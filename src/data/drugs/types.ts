// ── Pharmaceutical form types ────────────────────────────────────────────────
export type FormType =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'vial'
  | 'nebule'
  | 'ampoule'
  | 'rectal'
  | 'drop'
  | 'sachet'

// ── Therapeutic categories ───────────────────────────────────────────────────
// Every value here needs a matching entry in categoryColors.ts's
// CATEGORY_COLORS (a Record<DrugCategory, …> — TypeScript won't compile
// without one) and a matching `[data-cat="…"]` rule in index.css, in both
// themes (categoryColors.test.ts fails if index.css drifts from
// CATEGORY_COLORS). A category added here without both no longer fails
// silently with an uncoloured card — DESIGN-REWORK.md §9.
export type DrugCategory =
  | 'Gawat Darurat'
  | 'Analgesik/NSAID'
  | 'Antibiotik'
  | 'Antivirus'
  | 'Antijamur'
  | 'Anti-TB (OAT)'
  | 'Antiparasit'
  | 'Antikonvulsan'
  | 'Kardiovaskular'
  | 'Pulmologi'
  | 'Gastrointestinal'
  | 'Kortikosteroid'
  | 'Antihistamin/Alergi'
  | 'Vitamin/Mineral'
  | 'Cairan & Elektrolit'
  | 'Antimalarial'
  | 'Lain-lain'

export interface DrugForm {
  strength: number // mg per unit (solid) or mg/mL (liquid)
  form: FormType
  label?: string
  packSize?: string // e.g. '60 mL' bottle, 'strip 10' — shown in the Sediaan list
}

export interface DrugPreset {
  id: string
  name: string
  route: string
  category: DrugCategory
  // CONVENTION: dosePerKg is the TOTAL mg/kg/DAY. The engine computes
  // dailyDose = weight × dosePerKg, then perDose = dailyDose / freq.
  dosePerKg: number
  dosePerKgMin?: number
  dosePerKgMax?: number
  freq: number
  freqMax?: number // upper bound of frequency when it's a range (e.g. 4–6×/day)
  maxDay?: number
  maxSingle?: number
  concentration?: number // mg/mL for volume calculation
  availableForms?: DrugForm[]
  note: string
  forPuyer?: boolean

  // ── Catalog/UX metadata (display only — never consumed by calculate.ts) ──────
  source?: string // dosing reference, e.g. 'IDAI', 'BNFc', 'Fornas', 'WHO'
  aliases?: string[] // alternate names / brands for search, e.g. ['PCT','Sanmol']
  indications?: string[] // searchable indications, e.g. ['demam','nyeri']
  sideEffects?: string // efek samping — shown in the Detail Obat monograph
  minAgeMonths?: number // youngest age the dose applies to (display gating)
  minWeightKg?: number
  contraindication?: string // hard contraindication, surfaced in red
  warning?: string // short caution, drives the card badge + amber note line
  fixedDose?: boolean // true when the regimen is NOT weight-based (calc is indicative only)
}
