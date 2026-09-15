import { useState } from 'react'
import { COUNTIES, COMPANIES, PLAN_FIELDS, EMPTY_PLAN } from './constants/allConstants'
import PlanForm from './components/PlanForm'
import CurrentValues from './components/CurrentValues'

export default function App() {
  const [countyId, setCountyId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [plan, setPlan] = useState(EMPTY_PLAN)

  const selectedCounty = COUNTIES.find((c) => c.id === Number(countyId))
  const selectedCompany = COMPANIES.find((c) => c.id === Number(companyId))

  // A field with `visibleWhen` only shows while that condition holds.
  const isVisible = (field) =>
    !field.visibleWhen ||
    plan[field.visibleWhen.field] === field.visibleWhen.equals

  const visibleFields = PLAN_FIELDS.filter(isVisible)

  // A hidden field contributes its `hiddenValue` if it declares one, and is
  // otherwise left out entirely so a stale entry can never reach the output.
  const fieldEntries = PLAN_FIELDS.flatMap((field) => {
    if (isVisible(field)) return [[field.name, plan[field.name]]]
    return 'hiddenValue' in field ? [[field.name, field.hiddenValue]] : []
  })

  // Everything the SQL generator will read, in one object, for verification.
  const formState = {
    countyId: selectedCounty?.id ?? null,
    countyName: selectedCounty?.name ?? null,
    companyId: selectedCompany?.id ?? null,
    companyName: selectedCompany?.name ?? null,
    ...Object.fromEntries(fieldEntries),
  }

  const updateField = (name, value) => {
    setPlan((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <main>
      <h1>Plan SQL Statement Generator</h1>

      <PlanForm
        countyId={countyId}
        onCountyChange={setCountyId}
        companyId={companyId}
        onCompanyChange={setCompanyId}
        fields={visibleFields}
        plan={plan}
        onFieldChange={updateField}
      />

      <CurrentValues values={formState} />
    </main>
  )
}
