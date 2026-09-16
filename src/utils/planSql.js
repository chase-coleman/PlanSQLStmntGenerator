import {
  PLAN_FIELDS,
  PLAN_GROUPS,
  NOT_APPLICABLE,
  PUBLISHED_COLUMN,
  ZERO_IS_LEGITIMATE,
  COMPANY_COLUMN,
  COUNTIES_PLAN,
  COUNTIES_COMPANIES,
  VERIFY_COLUMNS,
  NEXT_GROUP_ID_QUERY,
} from '../constants/allConstants'

// A field with `visibleWhen` only applies while that condition holds.
export const isVisible = (field, plan) =>
  !field.visibleWhen ||
  plan[field.visibleWhen.field] === field.visibleWhen.equals

export const visibleFields = (plan) =>
  PLAN_FIELDS.filter((field) => isVisible(field, plan))

// The value each column will actually receive: what the user typed if the
// field is showing, otherwise its `hiddenValue`. A hidden field with no
// `hiddenValue` is left out so a stale entry can never reach the output.
export const effectiveValues = (plan) =>
  Object.fromEntries(
    PLAN_FIELDS.flatMap((field) => {
      if (field.uiOnly) return []
      if (isVisible(field, plan)) {
        const raw = plan[field.name]
        return [[field.name, raw === NOT_APPLICABLE ? field.naValue : raw]]
      }
      return 'hiddenValue' in field ? [[field.name, field.hiddenValue]] : []
    }),
  )

const isBlank = (value) => value === '' || value === null || value === undefined

// Blocking problems only — the statement is withheld until all are cleared,
// since every column here is NOT NULL apart from cms_plan_id.
export const validate = (plan, context = {}) => {
  const values = effectiveValues(plan)
  const { mode = 'existing', companyId = '' } = context

  const contextProblems = []
  if (mode === 'new') {
    if (!companyId) contextProblems.push('Company is required for a new plan.')
    if (PLAN_GROUPS.some((g) => String(g.id) === String(plan.planGroupId))) {
      contextProblems.push(
        `Plan group ${plan.planGroupId} already exists — a new plan needs an unused group id.`,
      )
    }
  }

  return contextProblems.concat(PLAN_FIELDS.flatMap((field) => {
    if (field.uiOnly) return []
    const value = values[field.name]

    if (isBlank(value)) {
      if (field.nullable) return []
      return [`${field.label} is required.`]
    }

    if (field.pattern && !field.pattern.test(value)) {
      return [`${field.label} must look like H2923-004-000.`]
    }

    if (
      (field.inputType === 'integer' ||
        field.inputType === 'decimal' ||
        field.inputType === 'integerOrNA') &&
      !Number.isFinite(Number(value))
    ) {
      return [`${field.label} must be a number.`]
    }

    return []
  }))
}

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`

// Numerics are emitted bare and strings quoted, so the statement types match
// the column types rather than relying on MySQL to coerce.
const literal = (field, value) => {
  if (isBlank(value)) return 'NULL'
  if (field.inputType === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (field.inputType === 'decimal') return Number(value).toFixed(2)
  if (field.inputType === 'integerOrNA') return Number(value).toFixed(2)
  if (field.inputType === 'integer') return String(Math.trunc(Number(value)))
  if (field.inputType === 'select' && typeof value === 'number') return String(value)
  if (field.isKey) return String(Number(value))
  return quote(value)
}

const columnFields = () => PLAN_FIELDS.filter((f) => !f.uiOnly && f.column)

const backtick = (name) => `\`${name}\``

const verifyPlanQuery = (groupId, planYear) =>
  `SELECT ${VERIFY_COLUMNS.map(backtick).join(', ')} FROM \`plan\` ` +
  `WHERE \`plan_group_id\` = ${Number(groupId)} AND \`plan_year\` = ${Number(planYear)};`

// Statements that discover a value the form needs. They are shown before the
// numbered list because they are safe to run at any time and answer questions
// the tool cannot answer for itself.
export const preludeStatements = (context = {}) => {
  const { mode = 'existing' } = context
  if (mode !== 'new') return []
  return [
    {
      sql: NEXT_GROUP_ID_QUERY,
      note: 'Run first, then enter the result as the plan group above.',
    },
  ]
}

// An existing 2027 row is a zeroed placeholder, so it is updated in place.
// The row is addressed by (plan_group_id, plan_year) because `id` is
// auto-increment and uk_plan_group_year makes that pair unique.
const buildUpdate = (values, { publish }) => {
  const fields = columnFields()

  const assignments = fields
    .filter((field) => !field.isKey)
    .map((field) => `${backtick(field.column)} = ${literal(field, values[field.name])}`)

  // Only when the user confirms every benefit is known. When they have not,
  // the column is left out rather than written FALSE: the placeholder rows are
  // already FALSE, and omitting it means re-running a partial update can never
  // unpublish a plan that was already live.
  if (publish) assignments.push(`${backtick(PUBLISHED_COLUMN)} = TRUE`)

  const conditions = fields
    .filter((field) => field.isKey)
    .map((field) => `${backtick(field.column)} = ${literal(field, values[field.name])}`)

  return [
    {
      sql: `UPDATE \`plan\` SET ${assignments.join(', ')} WHERE ${conditions.join(' AND ')};`,
      note: publish
        ? 'Writes the benefits and publishes the plan.'
        : 'Writes the benefits and leaves the plan unpublished, so unconfirmed zeros are not shown as real.',
    },
    {
      sql: verifyPlanQuery(values.planGroupId, values.planYear),
      note: 'Confirm the values landed. Worth running before the UPDATE too, to keep a copy of the old row.',
    },
  ]
}

// Counties this company is not yet paired with. Without the pairing the
// company button never appears for that county and the plan is unreachable,
// because the frontend builds its company list from counties_companies.
const missingCompanyPairs = (companyId, countyIds) => {
  const known = COUNTIES_COMPANIES.pairs.find(
    (pair) => pair.companyId === Number(companyId),
  )
  return countyIds.filter((countyId) => !known?.countyIds.includes(Number(countyId)))
}

// A new plan inserts the row, then links it to its counties. The new `id` is
// auto-increment and PlanetScale runs each pasted statement in its own
// session, so LAST_INSERT_ID() would not carry over: the id is read back with
// a SELECT and typed in, and the join rows use plain VALUES.
const buildInsert = (values, { companyId, countyIds, planId, publish }) => {
  const fields = columnFields()

  const columns = fields.map((field) => backtick(field.column))
  const literals = fields.map((field) => literal(field, values[field.name]))

  // Unlike the UPDATE this is always written, because the column is
  // NOT NULL DEFAULT TRUE — omitting it on an INSERT would publish the row.
  columns.push(backtick(PUBLISHED_COLUMN), backtick(COMPANY_COLUMN))
  literals.push(publish ? 'TRUE' : 'FALSE', String(Number(companyId)))

  const statements = [
    {
      sql: `INSERT INTO \`plan\` (${columns.join(', ')}) VALUES (${literals.join(', ')});`,
      note: 'Creates the row. `id` is omitted so MySQL assigns it.',
    },
    {
      sql:
        `SELECT \`id\` FROM \`plan\` WHERE \`plan_group_id\` = ${Number(values.planGroupId)} ` +
        `AND \`plan_year\` = ${Number(values.planYear)};`,
      note: "Run this, then enter the id above to fill in the statements below.",
    },
  ]

  const id = planId === '' || planId === undefined ? '<plan id>' : String(Number(planId))
  const { table, planColumn, countyColumn } = COUNTIES_PLAN

  countyIds.forEach((countyId) => {
    statements.push({
      sql:
        `INSERT INTO \`${table}\` (${backtick(planColumn)}, ${backtick(countyColumn)}) ` +
        `VALUES (${id}, ${Number(countyId)});`,
      note: 'Links the plan to a county. Re-running it fails on the composite primary key rather than double-linking.',
    })
  })

  const cc = COUNTIES_COMPANIES
  missingCompanyPairs(companyId, countyIds).forEach((countyId) => {
    statements.push({
      sql:
        `INSERT INTO \`${cc.table}\` (${backtick(cc.companyColumn)}, ${backtick(cc.countyColumn)}) ` +
        `VALUES (${Number(companyId)}, ${Number(countyId)});`,
      note: 'This company does not sell in that county yet. Without this row the company button never appears and the plan is unreachable.',
    })
  })

  statements.push({
    sql: verifyPlanQuery(values.planGroupId, values.planYear),
    note: 'Confirm the row landed.',
  })

  statements.push({
    sql:
      `SELECT cp.\`plan_id\`, cp.\`county_id\`, c.\`county_name\` FROM \`${table}\` cp ` +
      `JOIN \`county\` c ON c.\`id\` = cp.\`county_id\` WHERE cp.\`plan_id\` = ${id};`,
    note: 'Confirm the county links exist.',
  })

  return statements
}

// The PlanetScale console runs a single statement at a time, so each one is
// emitted standalone and on one line, to be run in order.
export const buildStatements = (plan, context = {}) => {
  const {
    mode = 'existing',
    companyId = '',
    countyIds = [],
    planId = '',
    publish = false,
  } = context
  if (validate(plan, context).length > 0) return []

  const values = effectiveValues(plan)
  return mode === 'new'
    ? buildInsert(values, { companyId, countyIds, planId, publish })
    : buildUpdate(values, { publish })
}

// Offered on its own, for the day the remaining CMS details arrive and the
// plan can go live without re-entering anything.
export const publishStatement = (plan, context = {}) => {
  if (context.publish) return null
  if (validate(plan, context).length > 0) return null

  const values = effectiveValues(plan)
  return {
    sql:
      `UPDATE \`plan\` SET ${backtick(PUBLISHED_COLUMN)} = TRUE ` +
      `WHERE \`plan_group_id\` = ${Number(values.planGroupId)} ` +
      `AND \`plan_year\` = ${Number(values.planYear)};`,
    note: 'Run this later, once every benefit above is confirmed. Nothing else changes.',
  }
}

// Benefits sitting at 0 that probably just have not been published yet. A
// reminder rather than a validation error: 0 is a real value for some columns,
// and a hidden field is zeroed on purpose by the copay/coinsurance toggle.
export const zeroedBenefits = (plan) =>
  visibleFields(plan)
    .filter(
      (field) =>
        !field.uiOnly &&
        field.column &&
        !ZERO_IS_LEGITIMATE.includes(field.name) &&
        ['integer', 'decimal', 'integerOrNA'].includes(field.inputType) &&
        Number(plan[field.name]) === 0,
    )
    .map((field) => field.label)

// What the statement actually writes, so reviewing the JSON is equivalent to
// reading the SQL.
export const emittedPayload = (plan, context = {}) => {
  const { mode = 'existing', companyId = '', countyIds = [], publish = false } = context
  const values = effectiveValues(plan)

  if (mode === 'new') {
    return { ...values, benefitsPublished: publish, companyId: Number(companyId) || null, countyIds }
  }
  // An unpublished update leaves the column alone, so it is not in the payload.
  return publish ? { ...values, benefitsPublished: true } : values
}
