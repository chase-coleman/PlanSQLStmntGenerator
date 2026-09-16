import { PLAN_GROUPS, COMPANIES, COUNTIES } from '../constants/allConstants'

// Plan name alone does not identify a plan: groups 2/5 and 3/6 repeat a name
// across counties, and 7/8 and 9/10 repeat one within Linn. Narrowing by
// company and county is what makes the remaining choice small enough to read.
//
// Counties match on ANY of those selected, not all of them. A group covers a
// set of counties — group 1 is sold in Linn, Tillamook and Lincoln — so
// requiring every selected county would hide the plan you are looking for the
// moment you tick a second one.
export const matchingGroups = ({ countyIds = [], companyId }) =>
  PLAN_GROUPS.filter((group) => {
    if (companyId && group.companyId !== Number(companyId)) return false
    if (
      countyIds.length > 0 &&
      !countyIds.some((id) => group.countyIds.includes(Number(id)))
    ) {
      return false
    }
    return true
  })

export const findGroup = (groupId) =>
  PLAN_GROUPS.find((group) => group.id === Number(groupId))

// The 2026 contract id is the only thing separating 7 from 8 and 9 from 10,
// so it belongs in the label even though 2027 will get a different one.
export const groupLabel = (group) => {
  const company = COMPANIES.find((c) => c.id === group.companyId)
  const suffix = group.cms2026 ?? 'no 2026 CMS id'
  return `${company?.name ?? 'Unknown'} ${group.name} — ${suffix}`
}

// Groups 22 and 23 have no counties_plan rows, so the live site never shows
// them however correct the update is.
export const hasNoCounties = (group) => group.countyIds.length === 0

// One plan row serves every county it is linked to, so an UPDATE reaches all
// of them at once — there is no per-county row to edit separately.
export const countyNames = (group) =>
  group.countyIds
    .map((id) => COUNTIES.find((county) => county.id === id)?.name)
    .filter(Boolean)
