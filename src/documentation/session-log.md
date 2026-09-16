# Session log — 2026-09-15

Where the project stands, and why it is built the way it is. The README is the
user-facing description; this file is the working context you would otherwise
have to reconstruct.

---

## What this is

A single-page React tool that generates SQL for the **MedicarePlanComparer**
database. You fill in a form, it emits statements you paste into the
**PlanetScale web console**, one at a time. There is no backend and no database
connection — the tool only produces text.

Built today from an empty repository. React 18 + Vite, no other runtime
dependencies.

---

## How it got here

The project was scaffolded, then reshaped twice by feedback relayed from the
agent that maintains the backend.

**First pass** built a form from the Java `Plan` entity and emitted an INSERT.
That was wrong in eight ways, and the backend agent's corrections drove a
rewrite: the 2027 rows already exist as zeroed placeholders, so entering data is
an UPDATE; radiology needed its own copay/coinsurance toggle rather than being
tied to the surgery one; `givebackAmount` had to be numeric rather than the
string `"N/A"`; county and company are not columns on `plan`; `cms_plan_id`
needed format validation and NULL support; numerics had to be unquoted; and
output had to be one single-line statement at a time.

**Second pass** added the plan picker once the 24-group reference table
arrived, then a new-plan INSERT mode, then answers to a list of schema
questions that corrected several guesses (see below).

**Last change of the day** reversed an earlier instruction: `benefits_published`
must *not* be set automatically. See "The publishing rule" below — it is the
subtlest thing in the project.

---

## Decisions worth remembering

### The publishing rule

CMS releases plan details in stages. Every benefit column is `NOT NULL`, so an
unknown value has to be entered as `0` — there is no way to represent
"unknown". If `benefits_published` is `TRUE`, the live site renders those
placeholder zeros as real benefits, so a plan whose radiology copay merely has
not been released yet would advertise "Radiology Copay: $0" to Medicare
beneficiaries.

So publishing is a deliberate, separate act:

- A checkbox, **off by default**, controls it.
- When unticked, an UPDATE **omits the column** rather than writing `FALSE`,
  so re-running a partial update can never unpublish a live plan.
- An **INSERT is the exception** and always writes it explicitly, because the
  column is `NOT NULL DEFAULT TRUE` and omitting it would publish the new row.
- A **standalone publish statement** is offered for later, once the remaining
  details arrive.
- While unpublished, the UI lists which benefits sit at `0` as a reminder. It
  never blocks: `0` is legitimate for `monthly_premium`, `giveback_amount`,
  `dr_visit` and `radiology_coinsurance`.

### Addressing rows

Never by `id`. The natural key is `(plan_group_id, plan_year)`, which is unique
via `uk_plan_group_year`. `id` is auto-increment, and `cms_plan_id` is neither
unique nor populated for 2027.

### The two-step id handoff

A new plan's `id` is unknown when you paste the INSERT. `LAST_INSERT_ID()` does
not work here: PlanetScale is Vitess, and each pasted statement runs in its own
session. So statement 2 is a `SELECT id ...`, and you type the result into the
**New plan id** field, which fills in the join statements. There are also no
foreign keys anywhere — Vitess does not support them — so that SELECT is the
only thing preventing a join row pointing at a nonexistent plan.

### Plan groups and counties

`plan_group_id` is stable across years and is how the frontend pairs a plan's
2026 and 2027 rows. One `plan` row serves *every* county it is linked to
through `counties_plan`, so a single UPDATE covers all of them — never generate
one statement per county. Where benefits differ by county, the backend models
it as separate groups, which is why Devoted "Core" exists as both group 2
(Tillamook) and group 5 (Linn + Lincoln).

Plan name alone does not identify a plan, so the picker narrows by company +
county and labels each option with its 2026 CMS id, which is the only thing
separating groups 7/8 and 9/10.

A new plan may also need a `counties_companies` row: the frontend builds its
per-county company list from that table, not from the plan rows, so a plan
whose company is not yet sold in that county is unreachable.

### Inverted and exclusive fields

The surgery checkbox reads *check if coinsurance* and stores the **opposite**
of the box: `surgery_copay_type = true` means a dollar copay. Radiology and
surgery are each coinsurance *or* copay, never both — picking one hides the
other's inputs and writes them as `0`.

### Exact strings

`plan_type` and `otc_renewal` are unconstrained `VARCHAR`s rendered verbatim by
the frontend, so spelling and capitalization matter more than the schema
suggests. `plan_type` ∈ `HMO`, `PPO`, `HMO-POS`, `C-SNP`. `otc_renewal` ∈
`None`, `Monthly`, `Quarterly`. An earlier lowercase `'monthly'` was a real bug
that the database would have accepted silently.

Coinsurance is a whole percent in an `INT` column: `20` means 20%, and `0.20`
would truncate to `0` and read as no coinsurance.

---

## Architecture

The form is **table-driven**. `PLAN_FIELDS` in `constants/allConstants.js` is
the single source of truth; each entry names its `column` and `inputType`, plus
optionally `visibleWhen`, `hiddenValue`, `inverted`, `options`, `nullable`,
`pattern`, `hint`, `isKey`, `viaPicker` or `uiOnly`. The form, the blank state,
the validation and the SQL all derive from it, so adding a column is one entry.

```
src/
  App.jsx                     state, derivation, wiring only
  constants/allConstants.js   reference data + the field table
  utils/planSql.js            visibility, validation, statement building
  utils/planGroups.js         plan group filtering and labels
  components/PlanPicker.jsx   mode, county/company, plan selection
  components/PlanForm.jsx     one control per field
  components/SqlOutput.jsx    prelude, statements, publish controls
  components/CurrentValues.jsx JSON of the exact emitted payload
  documentation/              this file
```

`CurrentValues` deliberately mirrors the statement exactly, including omitting
`benefitsPublished` when the SQL omits it. If the JSON looks wrong, the SQL is
wrong.

---

## Verifying changes

There is no test suite. Statement generation was checked by importing
`planSql.js` into a scratch Node script and printing statements for each path:
published and unpublished UPDATE, new-plan INSERT with and without a known
plan id, the ambiguous plan groups, and the validation messages. Node needs
explicit `.js` extensions on imports where Vite does not, so the scratch copy
had its import paths rewritten with `sed`. Worth redoing after any change to
`planSql.js` — it catches more than the build does, since the build only
proves the JSX parses.

---

## Open items

- **`QUESTIONS_FOR_BACKEND.md`** is answered and kept as a record of what was
  confirmed and when. Everything in it has been applied.
- **`PLAN_GROUPS` is hand-maintained** — it mirrors a comment block in the
  backend's `data.sql`, not generated output. Re-derive it before a bulk
  session with `REFERENCE_AUDIT_QUERY`.
- **Two known frontend bugs**, neither fixable here: radiology coinsurance
  renders with a dollar sign (`$20` for 20%), and a 2027-only plan's 2026 panel
  reads "not available until October 1st", which is odd wording for a past
  year. No row has ever used a nonzero coinsurance, so entering the first one
  will surface the first bug.
- **Nothing is committed.** The repository is still on the `npm_setup` branch
  with no commits.
