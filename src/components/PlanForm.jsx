import { COUNTIES, COMPANIES, NOT_APPLICABLE } from '../constants/allConstants'

// Renders every input on the page: the county and company selects, plus one
// control per plan field, chosen from that field's `inputType`.
export default function PlanForm({
  countyId,
  onCountyChange,
  companyId,
  onCompanyChange,
  fields,
  plan,
  onFieldChange,
}) {
  return (
    <>
      <label htmlFor="county">County</label>
      <select
        id="county"
        value={countyId}
        onChange={(e) => onCountyChange(e.target.value)}
      >
        <option value="">Select a county…</option>
        {COUNTIES.map((county) => (
          <option key={county.id} value={county.id}>
            {county.name}
          </option>
        ))}
      </select>

      <label htmlFor="company">Company</label>
      <select
        id="company"
        value={companyId}
        onChange={(e) => onCompanyChange(e.target.value)}
      >
        <option value="">Select a company…</option>
        {COMPANIES.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>

      <h2>Plan Details</h2>
      {fields.map((field) => {
        if (field.inputType === 'boolean') {
          return (
            <div className="field field-checkbox" key={field.name}>
              <input
                id={field.name}
                type="checkbox"
                checked={field.inverted ? !plan[field.name] : plan[field.name]}
                onChange={(e) =>
                  onFieldChange(
                    field.name,
                    field.inverted ? !e.target.checked : e.target.checked,
                  )
                }
              />
              <label htmlFor={field.name}>{field.label}</label>
            </div>
          )
        }

        if (field.inputType === 'integerOrNA') {
          const isNA = plan[field.name] === NOT_APPLICABLE

          return (
            <div className="field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <div className="field-row">
                <select
                  aria-label={`${field.label} availability`}
                  value={isNA ? NOT_APPLICABLE : 'amount'}
                  onChange={(e) =>
                    onFieldChange(
                      field.name,
                      e.target.value === NOT_APPLICABLE ? NOT_APPLICABLE : '',
                    )
                  }
                >
                  <option value="amount">Amount</option>
                  <option value={NOT_APPLICABLE}>{NOT_APPLICABLE}</option>
                </select>
                {!isNA && (
                  <input
                    id={field.name}
                    type="number"
                    step="1"
                    value={plan[field.name]}
                    onChange={(e) => onFieldChange(field.name, e.target.value)}
                  />
                )}
              </div>
            </div>
          )
        }

        if (field.inputType === 'select') {
          return (
            <div className="field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <select
                id={field.name}
                value={plan[field.name]}
                onChange={(e) => onFieldChange(field.name, e.target.value)}
              >
                <option value="">Select a {field.label.toLowerCase()}…</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        return (
          <div className="field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              type={field.inputType === 'string' ? 'text' : 'number'}
              step={field.inputType === 'decimal' ? '0.01' : '1'}
              value={plan[field.name]}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
            />
          </div>
        )
      })}
    </>
  )
}
