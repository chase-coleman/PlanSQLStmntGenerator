import { useState } from 'react'
import { EMPTY_PLAN } from './constants/allConstants'
import {
  visibleFields,
  effectiveValues,
  validate,
  buildStatements,
  preludeStatements,
} from './utils/planSql'
import { matchingGroups, findGroup } from './utils/planGroups'
import PlanPicker from './components/PlanPicker'
import PlanForm from './components/PlanForm'
import CurrentValues from './components/CurrentValues'
import SqlOutput from './components/SqlOutput'

export default function App() {
  const [mode, setMode] = useState('existing')
  // For an existing plan these only filter the picker. For a new plan the
  // company becomes company_id and the counties become counties_plan rows.
  // One plan row can serve several counties, so the selection is a set in
  // both modes.
  const [countyIds, setCountyIds] = useState([])
  const [companyId, setCompanyId] = useState('')
  // Read back from the database after the INSERT; the join rows need it.
  const [newPlanId, setNewPlanId] = useState('')
  const [plan, setPlan] = useState(EMPTY_PLAN)

  const context = { mode, companyId, countyIds, planId: newPlanId }

  const groups = matchingGroups({ countyIds, companyId })
  const selectedGroup = mode === 'new' ? null : findGroup(plan.planGroupId)

  // Fields the picker resolves are not typed into the form.
  const fields = visibleFields(plan).filter((field) => !field.viaPicker)
  const problems = validate(plan, context)
  const statements = buildStatements(plan, context)
  const prelude = preludeStatements(context)

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
    setNewPlanId('')
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
      <h1>Plan SQL Statement Generator</h1>
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
        planId={newPlanId}
        onPlanIdChange={setNewPlanId}
      />

      <CurrentValues
        values={
          mode === 'new'
            ? { ...effectiveValues(plan), companyId: Number(companyId) || null, countyIds }
            : effectiveValues(plan)
        }
      />
    </main>
  )
}
