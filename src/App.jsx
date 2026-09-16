import { useState } from 'react'
import { EMPTY_PLAN } from './constants/allConstants'
import {
  visibleFields,
  validate,
  buildStatements,
  preludeStatements,
  publishStatement,
  zeroedBenefits,
  emittedPayload,
} from './utils/planSql'
import { matchingGroups, findGroup } from './utils/planGroups'
import PlanPicker from './components/PlanPicker'
import PlanForm from './components/PlanForm'
import CurrentValues from './components/CurrentValues'
import SqlOutput from './components/SqlOutput'

// Every piece of form state in one place, so the initial render and the clear
// button cannot drift apart.
const INITIAL = {
  mode: 'existing',
  countyIds: [],
  companyId: '',
  plan: EMPTY_PLAN,
  // Temporarily ON while the live site has no visitors and 2027 data is being
  // tested in production. Publishing a row with unconfirmed zeros shows them
  // to beneficiaries as real benefits, so set this back to false once the site
  // is public.
  publish: true,
}

export default function App() {
  const [mode, setMode] = useState(INITIAL.mode)
  // For an existing plan these only filter the picker. For a new plan the
  // company becomes company_id and the counties become counties_plan rows.
  // One plan row can serve several counties, so the selection is a set in
  // both modes.
  const [countyIds, setCountyIds] = useState(INITIAL.countyIds)
  const [companyId, setCompanyId] = useState(INITIAL.companyId)
  const [publish, setPublish] = useState(INITIAL.publish)
  const [plan, setPlan] = useState(INITIAL.plan)

  const context = { mode, companyId, countyIds, publish }

  const groups = matchingGroups({ countyIds, companyId })
  const selectedGroup = mode === 'new' ? null : findGroup(plan.planGroupId)

  // Fields the picker resolves are not typed into the form.
  const fields = visibleFields(plan).filter((field) => !field.viaPicker)
  const problems = validate(plan, context)
  const statements = buildStatements(plan, context)
  const prelude = preludeStatements(context)
  const publishLater = publishStatement(plan, context)
  const zeroed = zeroedBenefits(plan)

  const isPristine =
    mode === INITIAL.mode &&
    companyId === INITIAL.companyId &&
    countyIds.length === 0 &&
    Object.keys(EMPTY_PLAN).every((key) => plan[key] === EMPTY_PLAN[key])

  const clearAll = () => {
    if (
      !isPristine &&
      !window.confirm('Clear every field and start a new plan?')
    ) {
      return
    }
    setMode(INITIAL.mode)
    setCountyIds(INITIAL.countyIds)
    setCompanyId(INITIAL.companyId)
    setPublish(INITIAL.publish)
    setPlan(INITIAL.plan)
  }

  const updateField = (name, value) => {
    setPlan((prev) => ({ ...prev, [name]: value }))
  }

  // Name and type are identity, not benefits, so an existing plan takes them
  // from the group rather than having them retyped. The 2026 CMS id is
  // deliberately not copied — 2027 ids are issued separately.
  const selectGroup = (groupId) => {
    const group = findGroup(groupId)
    setPlan((prev) => ({
      ...prev,
      planGroupId: groupId,
      planName: group?.name ?? '',
      planType: group?.planType ?? '',
    }))
  }

  // Switching mode changes what the group id means, so it is always reset:
  // a new plan claims the next unused id, an existing one must be re-picked.
  const changeMode = (value) => {
    setMode(value)
    setPlan((prev) => ({
      ...prev,
      planGroupId: '',
      planName: '',
      planType: '',
    }))
  }

  // A filter change can exclude the plan already chosen; drop it rather than
  // leave a selection that is no longer visible in the list.
  const keepSelectionIfStillListed = (filters) => {
    if (mode === 'new') return
    const stillListed = matchingGroups(filters).some(
      (group) => String(group.id) === String(plan.planGroupId),
    )
    if (!stillListed) selectGroup('')
  }

  const changeCompany = (value) => {
    setCompanyId(value)
    keepSelectionIfStillListed({ countyIds, companyId: value })
  }

  const toggleCounty = (id) => {
    const next = countyIds.includes(id)
      ? countyIds.filter((c) => c !== id)
      : [...countyIds, id].sort((a, b) => a - b)
    setCountyIds(next)
    keepSelectionIfStillListed({ countyIds: next, companyId })
  }

  return (
    <main>
      <div className="page-head">
        <h1>Plan SQL Statement Generator</h1>
        <button type="button" onClick={clearAll} disabled={isPristine}>
          Clear
        </button>
      </div>
      <p className="lede">
        {mode === 'new'
          ? 'Creates a plan row for 2027 and its county join rows.'
          : 'Updates the existing 2027 row for one plan, replacing its zeroed placeholder values.'}
      </p>

      <PlanPicker
        mode={mode}
        onModeChange={changeMode}
        countyIds={countyIds}
        onToggleCounty={toggleCounty}
        companyId={companyId}
        onCompanyChange={changeCompany}
        groups={groups}
        groupId={plan.planGroupId}
        onGroupChange={selectGroup}
        selectedGroup={selectedGroup}
      />

      <PlanForm fields={fields} plan={plan} onFieldChange={updateField} />

      <SqlOutput
        prelude={prelude}
        statements={statements}
        problems={problems}
        mode={mode}
        publish={publish}
        onPublishChange={setPublish}
        zeroed={zeroed}
        publishLater={publishLater}
      />

      <CurrentValues values={emittedPayload(plan, context)} />
    </main>
  )
}
