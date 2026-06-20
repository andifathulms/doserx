export type FormType =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'vial'
  | 'nebule'
  | 'ampoule'
  | 'rectal'
  | 'drop'

export interface DrugForm {
  strength: number  // mg per unit (solid) or mg/mL (liquid)
  form: FormType
  label?: string    // e.g. "Forte", "Anak", "1:1000"
}

export interface DrugPreset {
  id: string
  name: string
  route: string
  dosePerKg: number       // typical/default dose
  dosePerKgMin?: number   // low end of dosing range
  dosePerKgMax?: number   // high end of dosing range
  freq: number
  maxDay?: number
  maxSingle?: number
  concentration?: number  // mg/mL for liquid volume calculation
  availableForms?: DrugForm[]
  note: string
  forPuyer?: boolean      // also shown in puyer panel
}

// ── 8 preset drugs ────────────────────────────────────────────────────────────

export const DRUG_PRESETS: DrugPreset[] = [
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    route: 'Oral / PR',
    dosePerKg: 15,
    dosePerKgMin: 10,
    dosePerKgMax: 15,
    freq: 4,
    maxDay: 4000,
    maxSingle: 1000,
    concentration: 24,      // syrup 120mg/5mL
    availableForms: [
      { strength: 500, form: 'tablet' },
      { strength: 250, form: 'tablet', label: 'Anak' },
      { strength: 24, form: 'syrup', label: '120mg/5mL' },
    ],
    note: '10–15 mg/kg per dose, every 6 h. Max 4 g/day (adult). Syrup 120mg/5mL for children.',
    forPuyer: true,
  },
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    route: 'Oral',
    dosePerKg: 25,
    dosePerKgMin: 20,
    dosePerKgMax: 40,
    freq: 3,
    maxDay: 3000,
    maxSingle: 500,
    concentration: 25,      // syrup 125mg/5mL
    availableForms: [
      { strength: 500, form: 'capsule' },
      { strength: 250, form: 'capsule' },
      { strength: 25, form: 'syrup', label: '125mg/5mL' },
      { strength: 50, form: 'syrup', label: '250mg/5mL' },
    ],
    note: '20–40 mg/kg/day in 3 divided doses. Severe infections: up to 90 mg/kg/day.',
    forPuyer: false,
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    route: 'Oral',
    dosePerKg: 10,
    dosePerKgMin: 5,
    dosePerKgMax: 10,
    freq: 3,
    maxDay: 2400,
    maxSingle: 400,
    concentration: 20,      // syrup 100mg/5mL
    availableForms: [
      { strength: 400, form: 'tablet' },
      { strength: 200, form: 'tablet' },
      { strength: 20, form: 'syrup', label: '100mg/5mL' },
    ],
    note: '5–10 mg/kg per dose, TDS with food. Avoid in renal impairment or dehydration.',
    forPuyer: true,
  },
  {
    id: 'ceftriaxone',
    name: 'Ceftriaxone',
    route: 'IV / IM',
    dosePerKg: 50,
    dosePerKgMin: 50,
    dosePerKgMax: 100,
    freq: 1,
    maxDay: 4000,
    maxSingle: 2000,
    availableForms: [
      { strength: 1000, form: 'vial', label: '1g' },
      { strength: 500, form: 'vial', label: '500mg' },
    ],
    note: '50 mg/kg OD for most infections. Meningitis: 100 mg/kg/day in 1–2 doses. Max 4 g/day.',
    forPuyer: false,
  },
  {
    id: 'diazepam',
    name: 'Diazepam',
    route: 'IV / PR (seizure)',
    dosePerKg: 0.3,
    dosePerKgMin: 0.2,
    dosePerKgMax: 0.5,
    freq: 1,
    maxSingle: 10,
    concentration: 5,       // 10mg/2mL
    availableForms: [
      { strength: 5, form: 'tablet' },
      { strength: 2, form: 'tablet' },
      { strength: 5, form: 'rectal', label: 'Stesolid 5mg' },
      { strength: 10, form: 'rectal', label: 'Stesolid 10mg' },
    ],
    note: '0.2–0.5 mg/kg IV/rectal for acute seizure. May repeat once after 5 min. Max 10 mg/dose.',
    forPuyer: false,
  },
  {
    id: 'epinephrine',
    name: 'Epinephrine',
    route: 'IM (anaphylaxis)',
    dosePerKg: 0.01,
    freq: 1,
    maxSingle: 0.5,
    concentration: 1,       // 1mg/mL (1:1000)
    availableForms: [
      { strength: 1, form: 'ampoule', label: '1:1000' },
    ],
    note: '0.01 mg/kg IM (1:1000). Max 0.5 mg/dose. Repeat every 5–15 min PRN.',
    forPuyer: false,
  },
  {
    id: 'ondansetron',
    name: 'Ondansetron',
    route: 'Oral / IV',
    dosePerKg: 0.15,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.15,
    freq: 3,
    maxSingle: 8,
    concentration: 2,       // 4mg/2mL
    availableForms: [
      { strength: 8, form: 'tablet' },
      { strength: 4, form: 'tablet' },
      { strength: 2, form: 'ampoule', label: '4mg/2mL' },
    ],
    note: '0.1–0.15 mg/kg per dose, TDS. Max 8 mg/dose. Do not use in prolonged QT.',
    forPuyer: true,
  },
  {
    id: 'salbutamol',
    name: 'Salbutamol',
    route: 'Nebulised',
    dosePerKg: 0.15,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.15,
    freq: 3,
    maxSingle: 5,
    concentration: 1,       // 2.5mg/2.5mL nebule
    availableForms: [
      { strength: 2.5, form: 'nebule', label: '2.5mg/2.5mL' },
      { strength: 4, form: 'tablet' },
      { strength: 2, form: 'tablet' },
    ],
    note: '0.1–0.15 mg/kg/dose via nebuliser (max 5 mg). Tablet 2–4mg for oral use in puyer.',
    forPuyer: true,
  },
]

// ── Puyer-specific drugs ───────────────────────────────────────────────────────

export const PUYER_DRUGS: DrugPreset[] = [
  {
    id: 'ambroxol',
    name: 'Ambroxol',
    route: 'Oral',
    dosePerKg: 0.5,
    dosePerKgMin: 0.4,
    dosePerKgMax: 0.5,
    freq: 3,
    maxSingle: 30,
    concentration: 3,       // syrup 15mg/5mL
    availableForms: [
      { strength: 30, form: 'tablet' },
      { strength: 3, form: 'syrup', label: '15mg/5mL' },
    ],
    note: '0.4–0.5 mg/kg/dose TDS. Mucolytic. Tab 30mg; syrup 15mg/5mL.',
    forPuyer: true,
  },
  {
    id: 'dexamethasone',
    name: 'Dexamethasone',
    route: 'Oral',
    dosePerKg: 0.08,
    dosePerKgMin: 0.05,
    dosePerKgMax: 0.1,
    freq: 3,
    maxDay: 10,
    availableForms: [
      { strength: 0.75, form: 'tablet' },
      { strength: 0.5, form: 'tablet' },
    ],
    note: '0.15–0.3 mg/kg/day divided TDS. Corticosteroid. Use lowest effective dose.',
    forPuyer: true,
  },
  {
    id: 'ctm',
    name: 'Chlorphenamine (CTM)',
    route: 'Oral',
    dosePerKg: 0.1,
    freq: 3,
    maxSingle: 4,
    maxDay: 24,
    availableForms: [
      { strength: 4, form: 'tablet' },
    ],
    note: '0.1 mg/kg/dose TDS-QID. Antihistamine. Max 4 mg/dose.',
    forPuyer: true,
  },
  {
    id: 'cetirizine',
    name: 'Cetirizine',
    route: 'Oral',
    dosePerKg: 0.25,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.25,
    freq: 1,
    maxSingle: 10,
    concentration: 1,       // syrup 5mg/5mL
    availableForms: [
      { strength: 10, form: 'tablet' },
      { strength: 1, form: 'syrup', label: '5mg/5mL' },
    ],
    note: '0.25 mg/kg/dose OD (max 10 mg). Antihistamine. Syrup 5mg/5mL for children.',
    forPuyer: true,
  },
  {
    id: 'domperidone',
    name: 'Domperidone',
    route: 'Oral',
    dosePerKg: 0.3,
    dosePerKgMin: 0.25,
    dosePerKgMax: 0.5,
    freq: 3,
    maxSingle: 10,
    concentration: 1,       // syrup 5mg/5mL
    availableForms: [
      { strength: 10, form: 'tablet' },
      { strength: 1, form: 'syrup', label: '5mg/5mL' },
    ],
    note: '0.25–0.5 mg/kg/dose TDS. Antiemetic/prokinetic. Max 10 mg/dose.',
    forPuyer: true,
  },
  {
    id: 'gg',
    name: 'GG (Gliseril Guaiakolat)',
    route: 'Oral',
    dosePerKg: 3,
    dosePerKgMin: 2,
    dosePerKgMax: 4,
    freq: 4,
    maxSingle: 400,
    availableForms: [
      { strength: 100, form: 'tablet' },
    ],
    note: '2–4 mg/kg/dose QID. Expectorant. Tab 100mg. Common in pediatric puyer for cough.',
    forPuyer: true,
  },
  {
    id: 'prednisone',
    name: 'Prednisone',
    route: 'Oral',
    dosePerKg: 1,
    dosePerKgMin: 0.5,
    dosePerKgMax: 2,
    freq: 3,
    maxDay: 60,
    availableForms: [
      { strength: 5, form: 'tablet' },
    ],
    note: '0.5–2 mg/kg/day divided TDS. Corticosteroid. Taper gradually; avoid abrupt stop.',
    forPuyer: true,
  },
]

// ── Combined list for puyer panel ──────────────────────────────────────────────

export const ALL_DRUGS: DrugPreset[] = [
  ...DRUG_PRESETS.filter((d) => d.forPuyer),
  ...PUYER_DRUGS,
]
