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
// The fine-grained therapeutic class. What the doctor browses by is the
// coarser DrugGroup below (groupOf() in categories.ts maps one to the other);
// category survives as a sub-filter, for search, and in the monograph.
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

// ── Clinical groups ─────────────────────────────────────────────────────────
// What the doctor browses by. Nine groups, following how an Indonesian ward
// organises its drug list (Kardiovaskular, Hematoimun-Respirasi, Neurologi,
// Analgetik, Cairan & Elektrolit, Gastrointestinal, Antibiotik, Obat Intubasi,
// Lain-lain). The finer `category` above stays as a sub-filter (Anti-infeksi →
// Antibiotik / Antivirus / …) and for search. Every group needs an entry in
// groupColors.ts and a matching [data-group] rule in index.css in both themes
// (groupColors.test.ts fails otherwise).
export type DrugGroup =
  | 'Kardiovaskular'
  | 'Respirasi & Alergi'
  | 'Neurologi'
  | 'Analgetik'
  | 'Cairan & Elektrolit'
  | 'Gastrointestinal'
  | 'Anti-infeksi'
  | 'Anestesi & Intubasi'
  | 'Lain-lain & Nutrisi'

// ── Routes, populations, preparation ────────────────────────────────────────

/** Structured administration routes — what the drug page's route chips show. */
export type RouteCode =
  | 'Oral'
  | 'IV'
  | 'IM'
  | 'SC'
  | 'Infus'
  | 'Rektal'
  | 'Nebul'
  | 'Bukal'
  | 'Intranasal'
  | 'Topikal'

/** Who a regimen's dosing applies to. 'semua' = weight-based with an adult
 *  ceiling that holds across ages. */
export type RegimenPopulation = 'anak' | 'dewasa' | 'semua'

/**
 * How the drug goes from the pack to the patient — the question that follows
 * "how many mg": how many mL do I draw up, and how do I give it. Display
 * only; `concentration` is the one field that also feeds the volume
 * calculation, and only when the regimen has no concentration of its own.
 */
export interface Preparation {
  /** "Serbuk 1 g + 10 mL aqua pro injeksi" */
  reconstitute?: string
  /** mg/mL once reconstituted as above. */
  concentration?: number
  /** "Encerkan dalam 100 mL NaCl 0,9%" */
  dilute?: string
  /** "IV pelan 3–5 menit" / "Infus 30 menit" */
  give?: string
}

/** Review state of a catalog entry. Drafts never reach the live catalog
 *  unless review mode is switched on (see lib/review.ts). */
export type EntryStatus = 'draft' | 'verified'

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
  /** Set only where the category alone doesn't decide it — every
   *  'Gawat Darurat' drug, which belongs to a body system like any other,
   *  and a few drugs a ward files elsewhere (zinc under Gastrointestinal).
   *  Otherwise groupOf() derives it from `category`. */
  group?: DrugGroup
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

  // ── Regimen model (see data/catalog.ts) ─────────────────────────────────────
  /** When set, this preset is one more regimen (route/indication/population)
   *  of the catalog drug with that id, not a drug of its own. */
  parent?: string
  /** Structured routes. Derived from `route` when absent (parseRoutes). */
  routes?: RouteCode[]
  /** Who the dosing applies to. Absent = 'anak': the original catalog is
   *  paediatric mg/kg dosing. */
  population?: RegimenPopulation
  /** Short qualifier shown on the route chip — "kejang", "anafilaksis". */
  regimenLabel?: string
  /** ISMP / Kemenkes high-alert medication: insulin, concentrated
   *  electrolytes, opioids, neuromuscular blockers, … Shows a HIGH-ALERT tag
   *  and a double-check line wherever a dose is shown. */
  highAlert?: boolean
  /** Adult fixed dose in mg per administration, for regimens that are not
   *  weight-based. When set, calculateFixed() is used instead of calculate()
   *  and dosePerKg is ignored for the result (kept only for the band). */
  fixedDoseMg?: number
  prep?: Preparation
  /** Draft entries are hidden from the live catalog until reviewed. */
  status?: EntryStatus
  /** Who verified this entry, and when — shown in the monograph. */
  reviewedBy?: string

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
