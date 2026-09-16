import { COUNTIES, COMPANIES, MODES } from '../constants/allConstants'
import { groupLabel, hasNoCounties, countyNames } from '../utils/planGroups'

// Resolves which plan row the SQL targets. For an existing plan, county and
// company are filters only and the result is one plan_group_id. For a new
// plan they become real values: company_id is a column, and the counties are
// the counties_plan rows to create.
export default function PlanPicker({
  mode,
  onModeChange,
  countyIds,
  onToggleCounty,
  companyId,
  onCompanyChange,
  groups,
  groupId,
  onGroupChange,
  selectedGroup,
}) {
  const isNew = mode === 'new'

  return (
    <>
      <h2>Which Plan</h2>

      <div className="field">
        <label htmlFor="mode">Plan Status</label>
        <select id="mode" value={mode} onChange={(e) => onModeChange(e.target.value)}>
          {MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="company">Company</label>
        <select
          id="company"
          value={companyId}
          onChange={(e) => onCompanyChange(e.target.value)}
        >
          <option value="">{isNew ? 'Select a company…' : 'All companies'}</option>
          {COMPANIES.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="planGroupId">Plan</label>
        {isNew ? (
          <>
            <select id="planGroupIdMode" value="new" disabled>
              <option value="new">New plan</option>
            </select>
            <label htmlFor="planGroupId">Plan Group ID</label>
            <input
              id="planGroupId"
              type="number"
              step="1"
              value={groupId}
              onChange={(e) => onGroupChange(e.target.value)}
            />
            <p className="hint">
              There is no sequence for this. Run the lookup shown above the SQL
              and enter what it returns — a stale guess collides with
              uk_plan_group_year.
            </p>
          </>
        ) : (
          <select
            id="planGroupId"
            value={groupId}
            onChange={(e) => onGroupChange(e.target.value)}
          >
            <option value="">Select a plan…</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {groupLabel(group)}
              </option>
            ))}
          </select>
        )}
        {!isNew && groups.length === 0 && (
          <p className="hint">No plans match those filters.</p>
        )}
      </div>

      <fieldset className="field">
        <legend>
          {isNew ? 'Counties this plan is sold in' : 'Counties to search'}
        </legend>
        {COUNTIES.map((county) => (
          <div className="field-checkbox" key={county.id}>
            <input
              id={`county-${county.id}`}
              type="checkbox"
              checked={countyIds.includes(county.id)}
              onChange={() => onToggleCounty(county.id)}
            />
            <label htmlFor={`county-${county.id}`}>{county.name}</label>
          </div>
        ))}
        {isNew ? (
          countyIds.length === 0 && (
            <p className="hint">
              With no counties the plan exists but never appears on the live
              site, the way plan groups 22 and 23 do today.
            </p>
          )
        ) : (
          <p className="hint">
            {countyIds.length === 0
              ? 'All counties. Tick any to narrow the list.'
              : 'Shows plans sold in any of these counties.'}
          </p>
        )}
      </fieldset>

      {!isNew && selectedGroup && !hasNoCounties(selectedGroup) && (
        <p className="hint">
          Plan group {selectedGroup.id} ({selectedGroup.planType}) is one row
          serving {countyNames(selectedGroup).join(', ')}. The update reaches
          every one of those counties — there is no per-county row to edit.
        </p>
      )}

      {!isNew && selectedGroup && hasNoCounties(selectedGroup) && (
        <div className="problems">
          This plan has no counties_plan rows, so the live site will not show it
          until one is added — the update will appear to change nothing.
        </div>
      )}
    </>
  )
}
