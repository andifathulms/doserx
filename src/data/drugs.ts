export interface DrugPreset {
  id: string
  name: string
  route: string
  dosePerKg: number
  dosePerKgMin?: number
  freq: number
  maxDay?: number
  maxSingle?: number
  concentration?: number
  note: string
}

export const DRUG_PRESETS: DrugPreset[] = [
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    route: 'Oral / PR',
    dosePerKg: 15,
    freq: 4,
    maxDay: 4000,
    maxSingle: 1000,
    concentration: 250,
    note: '15 mg/kg every 6 h. Max 4 g/day. Do not exceed 5 doses in 24 h.',
  },
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    route: 'Oral',
    dosePerKg: 25,
    freq: 3,
    maxDay: 3000,
    maxSingle: 500,
    concentration: 125,
    note: '25 mg/kg TDS for most infections. Severe: up to 50 mg/kg TDS.',
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    route: 'Oral',
    dosePerKg: 10,
    freq: 3,
    maxDay: 2400,
    maxSingle: 400,
    concentration: 100,
    note: '10 mg/kg TDS with food. Avoid if renal impairment or dehydrated.',
  },
  {
    id: 'ceftriaxone',
    name: 'Ceftriaxone',
    route: 'IV / IM',
    dosePerKg: 50,
    freq: 1,
    maxDay: 2000,
    maxSingle: 2000,
    concentration: 100,
    note: '50 mg/kg OD. Meningitis: 100 mg/kg. Max 2 g/dose.',
  },
  {
    id: 'diazepam',
    name: 'Diazepam',
    route: 'IV / PR (seizure)',
    dosePerKg: 0.3,
    freq: 1,
    maxSingle: 10,
    concentration: 5,
    note: '0.3 mg/kg IV for acute seizure. May repeat once after 5 min. Max 10 mg.',
  },
  {
    id: 'epinephrine',
    name: 'Epinephrine',
    route: 'IM (anaphylaxis)',
    dosePerKg: 0.01,
    freq: 1,
    maxSingle: 0.5,
    concentration: 1,
    note: '0.01 mg/kg IM (1:1000). Max 0.5 mg. Repeat every 5–15 min PRN.',
  },
  {
    id: 'ondansetron',
    name: 'Ondansetron',
    route: 'Oral / IV',
    dosePerKg: 0.15,
    freq: 3,
    maxSingle: 8,
    concentration: 2,
    note: '0.15 mg/kg TDS. Max 8 mg/dose. Do not use in prolonged QT.',
  },
  {
    id: 'salbutamol',
    name: 'Salbutamol',
    route: 'Nebulised',
    dosePerKg: 0.15,
    freq: 3,
    maxSingle: 5,
    concentration: 1,
    note: '0.15 mg/kg/dose via nebuliser. Min 2.5 mg, max 5 mg. Dilute to 4 mL with NS.',
  },
]
