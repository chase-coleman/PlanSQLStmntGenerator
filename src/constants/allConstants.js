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

export const PLAN_TYPES = ['PPO', 'HMO', 'HMO-POS']

export const OTC_RENEWALS = ['monthly', 'quarterly', 'none']

// Sentinel stored in place of a number when a field is marked not applicable.
export const NOT_APPLICABLE = 'N/A'

// Mirrors the Java Plan entity. `inputType` is what the form renders.
export const PLAN_FIELDS = [
  { name: 'id', label: 'ID', inputType: 'integer' },
  { name: 'planGroupId', label: 'Plan Group ID', inputType: 'integer' },
  { name: 'planName', label: 'Plan Name', inputType: 'string' },
  { name: 'cmsPlanId', label: 'CMS Plan ID', inputType: 'string' },
  { name: 'planYear', label: 'Plan Year', inputType: 'select', options: PLAN_YEARS },
  { name: 'benefitsPublished', label: 'Benefits Published', inputType: 'boolean' },
  { name: 'monthlyPremium', label: 'Monthly Premium', inputType: 'decimal' },
  { name: 'moop', label: 'MOOP', inputType: 'integer' },
  { name: 'planType', label: 'Plan Type', inputType: 'select', options: PLAN_TYPES },
  { name: 'drVisit', label: 'Doctor Visit', inputType: 'integer' },
  { name: 'erVisit', label: 'ER Visit', inputType: 'integer' },
  { name: 'hospitalStay', label: 'Hospital Stay Copay Per Day', inputType: 'integer' },
  { name: 'hospitalStayLength', label: 'Hospital Stay Length', inputType: 'integer' },
  { name: 'surgeryMin', label: 'Surgery Min', inputType: 'integer' },
  { name: 'surgeryMax', label: 'Surgery Max', inputType: 'integer' },
  { name: 'surgeryCopayType', label: 'Surgery Coinsurance Checkbox (check if coinsurance)', inputType: 'boolean', inverted: true },
  // The mirror of radiologyCoinsurance: copay amounts only apply while the
  // surgery box is unchecked (stored as surgeryCopayType true).
  {
    name: 'radiologyCopayMax',
    label: 'Radiology Copay Max',
    inputType: 'integer',
    visibleWhen: { field: 'surgeryCopayType', equals: true },
    // A coinsurance plan has no copay, so report 0 rather than nothing.
    hiddenValue: 0,
  },
  {
    name: 'radiologyCopayMin',
    label: 'Radiology Copay Min',
    inputType: 'integer',
    visibleWhen: { field: 'surgeryCopayType', equals: true },
    // A coinsurance plan has no copay, so report 0 rather than nothing.
    hiddenValue: 0,
  },
  // Only meaningful on coinsurance plans, i.e. when the surgery box is checked
  // (which, being inverted, stores surgeryCopayType as false).
  {
    name: 'radiologyCoinsurance',
    label: 'Radiology Coinsurance',
    inputType: 'integer',
    visibleWhen: { field: 'surgeryCopayType', equals: false },
  },
  { name: 'dentalBenefit', label: 'Dental Benefit', inputType: 'integer' },
  { name: 'otcCredit', label: 'OTC Credit', inputType: 'integer' },
  { name: 'otcRenewal', label: 'OTC Renewal', inputType: 'select', options: OTC_RENEWALS },
  { name: 'givebackAmount', label: 'Giveback Amount', inputType: 'integerOrNA' },
  { name: 'rxCoverage', label: 'Rx Coverage', inputType: 'boolean' },
]

// Blank form state derived from the field list, so adding a field above is the
// only change needed to surface it in the form.
export const EMPTY_PLAN = Object.fromEntries(
  PLAN_FIELDS.map((field) => [
    field.name,
    // An inverted checkbox starts unchecked, which for those fields means true.
    field.inputType === 'boolean' ? Boolean(field.inverted) : '',
  ]),
)
