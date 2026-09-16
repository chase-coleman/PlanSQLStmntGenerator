# Schema questions from the 2027 plan-input tool

I'm the SQL generator that produces statements for you to paste into the
PlanetScale console. I've applied all eight of your earlier fixes: UPDATE by
`(plan_group_id, plan_year)` rather than INSERT, `radiology_coinsurance` on its
own toggle with the unused side written as 0, numeric `giveback_amount` and
`monthly_premium`, `benefits_published = TRUE` always, county/company dropped
from the payload, CMS id validated as `H####-###-###` or NULL, bare numerics
with quoted strings, and one single-line statement at a time.

Since then the tool gained a "new plan" mode that emits INSERTs. That's where I
had to guess, so most of these questions are about that path. Please answer by
number; where a guess of mine is wrong, the corrected form is more useful than
a yes/no.

## Blocking — I guessed and could be wrong

1. **`counties_plan` column names.** I emit
   `INSERT INTO counties_plan (county_id, plan_id) ...`. Your reference called
   the table `counties_plan` but didn't name its columns, and Hibernate-style
   join tables sometimes use `counties_id`. What are the actual column names,
   and does the table have any other NOT NULL columns (surrogate `id`,
   timestamps) that my INSERT must supply?

2. **Resolving the new plan's id.** A new row's `id` is auto-increment, so I
   can't reference it when inserting join rows. Because the PlanetScale console
   runs one statement per submission, `LAST_INSERT_ID()` may not survive
   between them, so I look the row up by its natural key instead:

   ```sql
   INSERT INTO `counties_plan` (`county_id`, `plan_id`)
   SELECT 1, `id` FROM `plan` WHERE `plan_group_id` = 25 AND `plan_year` = 2027;
   ```

   Is that correct and safe on your setup, or do you want a different shape?

3. **Full `plan` DDL, please.** My INSERT supplies exactly these 24 columns:
   `plan_group_id, plan_year, plan_name, cms_plan_id, monthly_premium, moop,
   plan_type, dr_visit, er_visit, hospital_stay, hospital_stay_length,
   surgery_copay_type, surgery_min, surgery_max, radiology_copay_min,
   radiology_copay_max, radiology_coinsurance, dental_benefit, otc_credit,
   otc_renewal, giveback_amount, rx_coverage, benefits_published, company_id`
   and omits `id`. Is there any other NOT NULL column without a default —
   `created_at`, `updated_at`, a soft-delete flag — that would reject this
   INSERT? The `SHOW CREATE TABLE plan` output would settle every question in
   this section at once.

4. **Where does a new `plan_group_id` come from?** I take
   `max(existing group) + 1`, which is 25 for a plan beyond the current 1–24.
   Is `plan_group_id` a plain INT column I'm free to assign, or is there a
   `plan_group` table it references, needing its own INSERT first? Is 25
   actually unused?

## New plans specifically

5. **Does a 2027-only plan break the UI?** You said `plan_group_id` is how the
   frontend pairs a plan's 2026 and 2027 rows. A genuinely new plan has no 2026
   row. Does the comparison view handle a group that exists in only one year,
   or does a new plan also need a 2026 row (placeholder or real) to render?

6. **`company_id` on INSERT.** I set it on new rows and leave it alone on
   UPDATEs, per your note that it doesn't change between plan years. Correct?

## Value semantics I want to confirm

7. **`plan_type` allowed values.** I offer `PPO`, `HMO`, `HMO-POS`, `C-SNP`. Is
   the column an ENUM or a VARCHAR, and is `C-SNP` spelled exactly that way?
   (Groups 22, 23 and 24 are C-SNP in your reference.)

8. **`otc_renewal` allowed values.** I emit lowercase `'monthly'`,
   `'quarterly'`, `'none'`. Is that the exact set and casing the frontend
   expects, and is `'none'` right for "no OTC benefit", or should that be NULL
   or an empty string?

9. **`radiology_coinsurance` units.** I emit a bare integer percentage, so 20%
   is `20`, not `0.20`. Confirm?

10. **Zero versus NULL for money.** `giveback_amount` and `monthly_premium` are
    `DECIMAL(10,2) NOT NULL`, and per your fix #3 I write `0.00` when there's no
    giveback. Does the frontend distinguish "$0 premium" from "no premium data",
    or is 0 unambiguous?

11. **`cms_plan_id` uniqueness.** It's nullable and I leave it NULL until CMS
    publishes 2027 ids. Is there a unique index on it? If so, do multiple NULL
    rows coexist safely (MySQL normally allows this, but I'd rather confirm than
    find out on paste)?

## Verification

12. **A SELECT to run after each statement** that would show the row landed
    correctly, ideally including its `counties_plan` rows. Something I can print
    beneath the generated SQL as a check step.

13. **Anything else stale.** The tool's plan-group reference table is a copy of
    the one you sent (24 groups, their companies, counties and 2026 CMS ids).
    If any of that has changed, send the corrected rows.
