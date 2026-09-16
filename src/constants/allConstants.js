export const COUNTIES = [
  { id: 1, name: 'Linn' },
  { id: 2, name: 'Tillamook' },
  { id: 3, name: 'Lincoln' },
  { id: 4, name: 'Clatsop' },
  { id: 5, name: 'Lane' },
  { id: 6, name: 'Yamhill' },
];

export const COMPANIES = [
  { id: 1, name: 'Devoted' },
  { id: 2, name: 'Humana' },
  { id: 3, name: 'UnitedHealthcare' },
  { id: 4, name: 'Wellcare' },
  // { id: 5, name: 'Regence' },
]

export const PLAN_YEARS = [2027]

// Plain VARCHAR in the database, but the frontend branches on the exact
// string 'C-SNP' to show its chronic-condition disclaimer, so spelling counts.
export const PLAN_TYPES = ['HMO', 'PPO', 'HMO-POS', 'C-SNP']

// Rendered verbatim by the frontend, and the seed data uses 'None' rather
// than an empty string or NULL when there is no OTC benefit.
export const OTC_RENEWALS = ['None', 'Monthly', 'Quarterly']

// Sentinel stored in place of a number when a field is marked not applicable.
// It never reaches SQL: fields that allow it declare an `naValue` to emit.
export const NOT_APPLICABLE = 'N/A'

// Every plan group, keyed by the id that is stable across plan years: the
// 2026 row and the 2027 placeholder of one plan share it. `cms2026` is the
// 2026 contract id, shown only to tell same-named plans apart — 2027 ids are
// not published yet. `countyIds` drives the picker's county filter.
export const PLAN_GROUPS = [
  { id: 1, name: 'Giveback', companyId: 1, planType: 'HMO', countyIds: [1, 2, 3], cms2026: 'H2923-004-000' },
  { id: 2, name: 'Core', companyId: 1, planType: 'HMO', countyIds: [2], cms2026: 'H2923-001-000' },
  { id: 3, name: 'Premium', companyId: 1, planType: 'HMO', countyIds: [2], cms2026: 'H2923-005-000' },
  { id: 4, name: 'Choice Premium', companyId: 1, planType: 'PPO', countyIds: [2], cms2026: 'H7199-002-000' },
  { id: 5, name: 'Core', companyId: 1, planType: 'HMO', countyIds: [1, 3], cms2026: 'H2923-003-000' },
  { id: 6, name: 'Premium', companyId: 1, planType: 'HMO', countyIds: [1, 3], cms2026: 'H2923-006-000' },
  { id: 7, name: 'HumanaChoice', companyId: 2, planType: 'PPO', countyIds: [1], cms2026: 'H5216-428-005' },
  { id: 8, name: 'HumanaChoice', companyId: 2, planType: 'PPO', countyIds: [1], cms2026: 'H5216-048-000' },
  { id: 9, name: 'USAA Honor Giveback', companyId: 2, planType: 'PPO', countyIds: [1], cms2026: 'H5216-427-002' },
  { id: 10, name: 'USAA Honor Giveback', companyId: 2, planType: 'PPO', countyIds: [1], cms2026: 'H5216-455-000' },
  { id: 11, name: 'Patriot', companyId: 3, planType: 'PPO', countyIds: [1], cms2026: 'H2406-073-000' },
  { id: 12, name: 'Essentials OR-4', companyId: 3, planType: 'HMO-POS', countyIds: [1], cms2026: 'H3805-039-002' },
  { id: 13, name: 'Essentials OR-0003', companyId: 3, planType: 'HMO-POS', countyIds: [1], cms2026: 'H3805-001-000' },
  { id: 14, name: 'Essentials OR-0001', companyId: 3, planType: 'PPO', countyIds: [1], cms2026: 'H2406-042-000' },
  { id: 15, name: 'Giveback Open', companyId: 4, planType: 'PPO', countyIds: [1], cms2026: 'H5439-015-000' },
  { id: 16, name: 'Patriot Giveback Open', companyId: 4, planType: 'PPO', countyIds: [1], cms2026: 'H5439-010-000' },
  { id: 17, name: 'Simple', companyId: 4, planType: 'HMO-POS', countyIds: [1], cms2026: 'H6815-039-000' },
  { id: 18, name: 'Simple Open', companyId: 4, planType: 'PPO', countyIds: [1], cms2026: 'H5439-022-003' },
  { id: 19, name: 'Low Premium', companyId: 4, planType: 'HMO-POS', countyIds: [1], cms2026: 'H6815-038-000' },
  { id: 20, name: 'Low Premium Open', companyId: 4, planType: 'PPO', countyIds: [1], cms2026: 'H5439-019-000' },
  { id: 21, name: 'Premium Ultra Open', companyId: 4, planType: 'PPO', countyIds: [1], cms2026: 'H5439-011-000' },
  { id: 22, name: 'Complete Care OR-5', companyId: 3, planType: 'C-SNP', countyIds: [], cms2026: null },
  { id: 23, name: 'Complete Care Support OR-1A', companyId: 3, planType: 'C-SNP', countyIds: [], cms2026: null },
  { id: 24, name: 'C-SNP Plus', companyId: 1, planType: 'C-SNP', countyIds: [1, 2, 3], cms2026: 'H2923-009-000' },
]

// A CMS contract/PBP id, e.g. H2923-004-000. Null until CMS publishes 2027.
export const CMS_PLAN_ID_PATTERN = /^H\d{4}-\d{3}-\d{3}$/

// Radiology is coinsurance OR copay, never both. This drives the form only —
// the database infers it from which of the three columns is non-zero.
export const RADIOLOGY_TYPES = ['copay', 'coinsurance']

// An existing plan is an UPDATE of a placeholder row; a new plan is an INSERT
// that also needs its counties_plan join rows.
export const MODES = [
  { value: 'existing', label: 'Existing plan (UPDATE)' },
  { value: 'new', label: 'New plan (INSERT)' },
]

// A new plan needs an unused group id, but there is no sequence for it and a
// hardcoded guess would collide with uk_plan_group_year if anyone added a plan
// meanwhile. The user runs this and types the answer in.
export const NEXT_GROUP_ID_QUERY =
  'SELECT MAX(`plan_group_id`) + 1 AS next_plan_group_id FROM `plan`;'

// company_id is a column on `plan`, but only an INSERT sets it: it does not
// change between plan years, so an UPDATE leaves it alone.
export const COMPANY_COLUMN = 'company_id'

// The many-to-many join between plans and counties. Composite primary key on
// (plan_id, county_id), so re-running an insert fails as a duplicate key
// rather than double-linking.
export const COUNTIES_PLAN = {
  table: 'counties_plan',
  planColumn: 'plan_id',
  countyColumn: 'county_id',
}

// The frontend builds its company list for a county from this table, not from
// the plan rows. A plan whose company is not yet paired with its county is
// unreachable: the company button never appears.
export const COUNTIES_COMPANIES = {
  table: 'counties_companies',
  companyColumn: 'company_id',
  countyColumn: 'county_id',
  // TODO: re-derive with PAIRS_AUDIT_QUERY. Clatsop (4), Lane (5) and Yamhill
  // (6) were added to the system after this list was captured and reportedly
  // have counties_companies rows already, so a pairing below may be missing
  // and its INSERT would be rejected as a duplicate key.
  pairs: [
    { companyId: 1, countyIds: [1, 2, 3] },
    { companyId: 2, countyIds: [1] },
    { companyId: 3, countyIds: [1] },
    { companyId: 4, countyIds: [1] },
  ],
}

// Refreshes COUNTIES_COMPANIES.pairs above.
export const PAIRS_AUDIT_QUERY =
  'SELECT `company_id`, `county_id` FROM `counties_companies` ' +
  'ORDER BY `company_id`, `county_id`;'

// Columns to read back when confirming a statement landed.
export const VERIFY_COLUMNS = [
  'id', 'plan_group_id', 'plan_name', 'cms_plan_id', 'plan_year',
  'benefits_published', 'monthly_premium', 'moop', 'plan_type', 'dr_visit',
  'er_visit', 'hospital_stay', 'hospital_stay_length', 'surgery_min',
  'surgery_max', 'surgery_copay_type', 'radiology_copay_min',
  'radiology_copay_max', 'radiology_coinsurance', 'dental_benefit',
  'otc_credit', 'otc_renewal', 'giveback_amount', 'rx_coverage', 'company_id',
]

// The plan-to-county reference below is a hand-maintained comment block in the
// backend's data.sql, not generated, so re-derive it before a bulk session.
export const REFERENCE_AUDIT_QUERY =
  'SELECT p.plan_group_id, p.plan_name, p.plan_type, p.company_id, ' +
  'GROUP_CONCAT(cp.county_id ORDER BY cp.county_id) AS counties ' +
  'FROM `plan` p LEFT JOIN `counties_plan` cp ON cp.plan_id = p.id ' +
  'WHERE p.plan_year = 2026 ' +
  'GROUP BY p.plan_group_id, p.plan_name, p.plan_type, p.company_id ' +
  'ORDER BY p.plan_group_id;'

// The target row is addressed by its natural key rather than by id, because
// `uk_plan_group_year` makes (plan_group_id, plan_year) unique.
export const KEY_COLUMNS = ['plan_group_id', 'plan_year']

// Never set automatically. CMS releases plan details in stages, and because
// every benefit column is NOT NULL an unknown value has to be entered as 0.
// Publishing a row like that makes the live site render those placeholder
// zeros as real benefits — a plan whose radiology copay simply has not been
// published yet would advertise "Radiology Copay: $0" to beneficiaries.
export const PUBLISHED_COLUMN = 'benefits_published'

// Columns where 0 is a normal, real value rather than a sign that the benefit
// has not been published yet. Used for the reminder, which is never blocking.
export const ZERO_IS_LEGITIMATE = [
  'monthlyPremium',
  'givebackAmount',
  'drVisit',
  'radiologyCoinsurance',
]

// One entry per column the generator writes. `column` is the snake_case name
// in MySQL; `inputType` is what the form renders. `id` and `company_id` are
// absent on purpose: id is auto-increment and company_id never changes
// between plan years.
export const PLAN_FIELDS = [
  {
    name: 'planGroupId',
    column: 'plan_group_id',
    label: 'Plan',
    inputType: 'select',
    isKey: true,
    // Resolved by the picker from company + county + name, never typed.
    viaPicker: true,
  },
  {
    name: 'planYear',
    column: 'plan_year',
    label: 'Plan Year',
    inputType: 'select',
    options: PLAN_YEARS,
    isKey: true,
  },
  { name: 'planName', column: 'plan_name', label: 'Plan Name', inputType: 'string' },
  {
    name: 'cmsPlanId',
    column: 'cms_plan_id',
    label: 'CMS Plan ID (e.g. H2923-004-000, blank for NULL)',
    inputType: 'string',
    nullable: true,
    pattern: CMS_PLAN_ID_PATTERN,
  },
  { name: 'monthlyPremium', column: 'monthly_premium', label: 'Monthly Premium', inputType: 'decimal' },
  { name: 'moop', column: 'moop', label: 'MOOP', inputType: 'integer' },
  { name: 'planType', column: 'plan_type', label: 'Plan Type', inputType: 'select', options: PLAN_TYPES },
  { name: 'drVisit', column: 'dr_visit', label: 'Doctor Visit', inputType: 'integer' },
  { name: 'erVisit', column: 'er_visit', label: 'ER Visit', inputType: 'integer' },
  { name: 'hospitalStay', column: 'hospital_stay', label: 'Hospital Stay Copay Per Day', inputType: 'integer' },
  { name: 'hospitalStayLength', column: 'hospital_stay_length', label: 'Hospital Stay Length', inputType: 'integer' },
  {
    name: 'surgeryCopayType',
    column: 'surgery_copay_type',
    label: 'Surgery Coinsurance Checkbox (check if coinsurance)',
    inputType: 'boolean',
    // Stored value is the opposite of the box: true = dollar copay (uses
    // surgery_min/max), false = coinsurance (frontend hardcodes 20%).
    inverted: true,
  },
  {
    name: 'surgeryMin',
    column: 'surgery_min',
    label: 'Surgery Min',
    inputType: 'integer',
    visibleWhen: { field: 'surgeryCopayType', equals: true },
    hiddenValue: 0,
  },
  {
    name: 'surgeryMax',
    column: 'surgery_max',
    label: 'Surgery Max',
    inputType: 'integer',
    visibleWhen: { field: 'surgeryCopayType', equals: true },
    hiddenValue: 0,
  },
  {
    name: 'radiologyType',
    label: 'Radiology Benefit Type',
    inputType: 'select',
    options: RADIOLOGY_TYPES,
    // Drives the fields below; not a column.
    uiOnly: true,
    defaultValue: 'copay',
  },
  {
    name: 'radiologyCopayMin',
    column: 'radiology_copay_min',
    label: 'Radiology Copay Min',
    inputType: 'integer',
    visibleWhen: { field: 'radiologyType', equals: 'copay' },
    hiddenValue: 0,
  },
  {
    name: 'radiologyCopayMax',
    column: 'radiology_copay_max',
    label: 'Radiology Copay Max',
    inputType: 'integer',
    visibleWhen: { field: 'radiologyType', equals: 'copay' },
    hiddenValue: 0,
  },
  {
    name: 'radiologyCoinsurance',
    column: 'radiology_coinsurance',
    label: 'Radiology Coinsurance (%)',
    inputType: 'integer',
    // Whole percent: 20 means 20%. The column is INT, so 0.20 truncates to 0
    // and silently reads as "no coinsurance".
    hint:
      'Whole percent — enter 20 for 20%. Note: the live site renders this as ' +
      '"$20" because of a formatting bug in PlanComponent.jsx, and no row has ' +
      'used a nonzero value yet.',
    visibleWhen: { field: 'radiologyType', equals: 'coinsurance' },
    hiddenValue: 0,
  },
  { name: 'dentalBenefit', column: 'dental_benefit', label: 'Dental Benefit', inputType: 'integer' },
  { name: 'otcCredit', column: 'otc_credit', label: 'OTC Credit', inputType: 'integer' },
  { name: 'otcRenewal', column: 'otc_renewal', label: 'OTC Renewal', inputType: 'select', options: OTC_RENEWALS },
  {
    name: 'givebackAmount',
    column: 'giveback_amount',
    label: 'Giveback Amount',
    inputType: 'integerOrNA',
    // DECIMAL(10,2) NOT NULL, so "no giveback" is written as 0, never as N/A.
    naValue: 0,
  },
  { name: 'rxCoverage', column: 'rx_coverage', label: 'Rx Coverage', inputType: 'boolean' },
]

// Blank form state derived from the field list, so adding a field above is the
// only change needed to surface it in the form.
export const EMPTY_PLAN = Object.fromEntries(
  PLAN_FIELDS.map((field) => {
    if ('defaultValue' in field) return [field.name, field.defaultValue]
    // An inverted checkbox starts unchecked, which for those fields means true.
    return [field.name, field.inputType === 'boolean' ? Boolean(field.inverted) : '']
  }),
)
