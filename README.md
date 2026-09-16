# Plan SQL Statement Generator

A single-page tool for writing Medicare plan benefit data into the
**MedicarePlanComparer** database. You fill in a form, it emits SQL you paste
into the PlanetScale web console one statement at a time.

It exists because entering a plan by hand means getting two dozen columns,
several inverted booleans and a pair of mutually exclusive benefit shapes right
every time. The form encodes those rules so the statement is correct before it
reaches the console.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the built bundle
```

React 18 + Vite, no other runtime dependencies. There is no backend: the tool
never connects to the database, it only writes text for you to paste.

---

## The two modes

### Existing plan → UPDATE

The 2027 rows **already exist** as zeroed placeholders (ids 101–124, plan
groups 1–24), created alongside their `counties_plan` join rows. Entering 2027
data is therefore an update, not an insert:

```sql
UPDATE `plan` SET `plan_name` = '...', ... , `rx_coverage` = TRUE
WHERE `plan_group_id` = 8 AND `plan_year` = 2027;
```

Note what is *not* in that SET clause: see
[publishing](#field-rules-the-form-enforces) below.

The row is addressed by its natural key rather than by `id`, because
`uk_plan_group_year (plan_group_id, plan_year)` is the unique constraint and an
INSERT reusing an existing pair is rejected.

A verification `SELECT` follows every UPDATE. Running it *before* the update
too gives you a copy of the old row, which is the only rollback you get.

### New plan → INSERT

For a plan that does not exist in any year. This path emits a numbered
sequence, because a new row's `id` is auto-increment and unknown:

1. `INSERT INTO plan (...) VALUES (...)` — `id` omitted so MySQL assigns it,
   `benefits_published` written explicitly
2. `SELECT id FROM plan WHERE plan_group_id = ? AND plan_year = ?`
3. …n. `INSERT INTO counties_plan (plan_id, county_id) VALUES (...)` — one per county
4. `INSERT INTO counties_companies (company_id, county_id) VALUES (...)` — only when missing
5. Verification `SELECT`s for the row and its county links

Between steps 2 and 3 you paste the returned id into the **New plan id** field,
and the remaining statements fill themselves in. Until then they render
`<plan id>` rather than a guess.

**Why not `LAST_INSERT_ID()`?** The target is PlanetScale (Vitess) and each
pasted statement runs in its own session, so it would not carry over. There are
also no foreign keys anywhere in this schema — Vitess does not support them —
so nothing would stop a join row pointing at a nonexistent plan. The `SELECT`
is the only check that exists, which is why the flow is built around it.

`plan_group_id` for a new plan has no sequence behind it. The tool shows
`SELECT MAX(plan_group_id) + 1 FROM plan` in a **Look up first** panel and asks
you to type the answer in, rather than hardcoding a value that goes stale the
moment someone else adds a plan.

---

## Picking the right plan

Plan name alone does not identify a plan:

- Groups **2/5** and **3/6** share a name (Devoted "Core", "Premium") across
  different counties with different benefits.
- Groups **7/8** and **9/10** share a name *within the same county*, Linn.

So the picker narrows by **company + county**, and labels each option with its
2026 CMS contract id — the only thing separating 7 from 8 and 9 from 10.

County selection is a multi-select and matches **any** ticked county, not all.
A group covers a *set* of counties, so requiring all of them would hide the
plan you are looking for as soon as you ticked a second one.

> **One plan row serves every county it is linked to.** A multi-county plan is
> one `plan` row with several `counties_plan` rows, so a single UPDATE reaches
> all of them. You never generate one statement per county. Where benefits
> genuinely differ by county, the backend models it as separate plan groups —
> which is exactly why "Core" exists twice.

Groups **22 and 23** have no `counties_plan` rows at all and never reach the
live UI. They appear only when no county filter is applied, and selecting one
shows a warning that the update will change nothing visible.

---

## Field rules the form enforces

**Inverted checkbox.** The surgery control is labelled *check if coinsurance*
and stores the opposite of the box: `surgery_copay_type = true` means a dollar
copay using `surgery_min`/`surgery_max`, `false` means coinsurance, for which
the frontend hardcodes "20%" and ignores min/max. The form starts unchecked,
so the initial stored value is `true`.

**Mutually exclusive benefit shapes.** Radiology is coinsurance *or* copay,
never both, and the same applies to surgery. Choosing one hides the other's
inputs and writes them as `0` — the unused side is always zeroed rather than
left stale or omitted.

**Publishing is opt-in and off by default.** CMS releases plan details in
stages, and because every benefit column is `NOT NULL`, an unknown value has to
be entered as `0` — there is no way to represent "unknown". A published row
renders those placeholder zeros as real benefits, so a plan whose radiology
copay simply has not been released yet would advertise "Radiology Copay: $0" to
beneficiaries.

So the form has an **"All benefits confirmed — publish this plan"** checkbox,
and only when it is ticked does the UPDATE include
`benefits_published = TRUE`. When it is not ticked the column is *omitted from
the SET clause* rather than written `FALSE`: the placeholder rows are already
`FALSE`, and omitting it means re-running a partial update can never unpublish
a plan that was already live.

An INSERT is the exception and always writes the column explicitly, because it
is declared `NOT NULL DEFAULT TRUE` — omitting it there would publish the new
row.

A standalone statement is offered separately for publishing later, once the
remaining details arrive:

```sql
UPDATE `plan` SET `benefits_published` = TRUE
WHERE `plan_group_id` = ? AND `plan_year` = ?;
```

While the box is unticked, the tool also lists which benefits currently sit at
`0`, as a reminder of what is still outstanding. It is never blocking — `0` is
a legitimate value for `monthly_premium`, `giveback_amount`, `dr_visit` and
`radiology_coinsurance`, and those four are excluded from the list.

**Exact strings matter.** `plan_type` and `otc_renewal` are unconstrained
`VARCHAR`s that the frontend renders verbatim or branches on, so both are
dropdowns rather than text fields:

| Column | Allowed values |
| --- | --- |
| `plan_type` | `HMO`, `PPO`, `HMO-POS`, `C-SNP` |
| `otc_renewal` | `None`, `Monthly`, `Quarterly` |

`C-SNP` is matched exactly to trigger the chronic-condition disclaimer, and
"no OTC benefit" is the literal string `None`, not an empty string or NULL.

**Numbers are numbers.** Every numeric column is `NOT NULL`, so `0` means
"none" and NULL is not available — there is no way to distinguish "unknown"
from "zero", and $0 premium plans are real and common. Coinsurance columns are
`INT` whole percents: `20` means 20%, and `0.20` would truncate to `0` and
silently read as no coinsurance.

**`cms_plan_id`** is the one nullable column. It is validated against the CMS
contract/PBP shape `H####-###-###` and emits bare `NULL` when blank, which is
where all 2027 rows sit until CMS publishes their ids. It is not unique and is
never used to find a row.

Nothing is generated while validation fails; the form lists what is missing
instead.

---

## Known issues on the live site

Neither is fixable here, but both affect what you should enter:

- **Radiology coinsurance displays with a dollar sign.** `PlanComponent.jsx`
  renders it as `` `$${radiologyCoinsurance}` ``, so entering `20` shows "$20"
  under a "Radiology Coinsurance" label. No row has used a nonzero value yet.
- **A 2027-only plan renders correctly**, but its 2026 panel reads "plan info
  not available until October 1st", which is odd wording for a past year on a
  plan that never existed then.

---

## Project layout

```
src/
  App.jsx                     state, derivation, wiring
  constants/allConstants.js   counties, companies, plan groups, field table
  utils/
    planSql.js                visibility, validation, statement building
    planGroups.js             plan group filtering and labels
  components/
    PlanPicker.jsx            mode, county/company, plan selection
    PlanForm.jsx              one control per field
    SqlOutput.jsx             prelude, numbered statements, copy buttons
    CurrentValues.jsx         JSON of the exact payload, for verification
```

The form is table-driven. `PLAN_FIELDS` in `allConstants.js` is the single
source of truth: each entry names its `column`, its `inputType`, and optionally
`visibleWhen` (a condition for showing it), `hiddenValue` (what to write when
hidden), `inverted`, `options`, `nullable`, `pattern` or `hint`. Adding a
column means adding one entry — the form, the blank state, the validation and
the SQL all follow from it.

`CurrentValues` prints the resolved payload as JSON, after hidden fields have
been zeroed and N/A resolved. It mirrors the statement exactly — including
omitting `benefitsPublished` when the SQL omits it — so if a value looks wrong
there, it is wrong in the statement too.

---

## Keeping the reference data current

`PLAN_GROUPS` mirrors a **hand-maintained comment block** in the backend's
`data.sql` — it is not generated, and is only as current as whoever last edited
it. Before a bulk entry session, re-derive the truth:

```sql
SELECT p.plan_group_id, p.plan_name, p.plan_type, p.company_id,
       GROUP_CONCAT(cp.county_id ORDER BY cp.county_id) AS counties
FROM `plan` p LEFT JOIN `counties_plan` cp ON cp.plan_id = p.id
WHERE p.plan_year = 2026
GROUP BY p.plan_group_id, p.plan_name, p.plan_type, p.company_id
ORDER BY p.plan_group_id;
```

That query is stored as `REFERENCE_AUDIT_QUERY`. The other constants worth
checking against the live schema are `COUNTIES_PLAN`, `COUNTIES_COMPANIES`
(whose `pairs` list drives whether a company/county join row is emitted),
`PLAN_TYPES` and `OTC_RENEWALS`.

`QUESTIONS_FOR_BACKEND.md` is the prompt that produced these answers, kept as a
record of what was confirmed and when.
