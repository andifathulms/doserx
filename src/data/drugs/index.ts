// Public barrel for the drug catalog. Importers use `'../data/drugs'` which
// resolves to ../data/drugs.ts (a one-line re-export of this folder).
export * from './types'

import { DrugPreset } from './types'
import { ANTIBIOTICS, ANTIVIRALS, ANTIFUNGALS, ANTITB } from './antiinfectives'
import { ANTIPARASITICS, ANTIMALARIALS } from './antiparasitics'
import { ANALGESICS, ANTICONVULSANTS } from './analgesics'
import { CARDIOVASCULAR, RESPIRATORY } from './cardiorespiratory'
import { GASTROINTESTINAL, ANTIHISTAMINES } from './gastro-allergy'
import { CORTICOSTEROIDS, VITAMINS, FLUIDS } from './steroids-nutrition'
import { EMERGENCY, MISC } from './emergency'

// Order roughly follows CATEGORY_ORDER (emergency first). Within a category the
// array order is preserved in the grid.
export const DRUG_PRESETS: DrugPreset[] = [
  ...EMERGENCY,
  ...ANALGESICS,
  ...ANTIBIOTICS,
  ...ANTIVIRALS,
  ...ANTIFUNGALS,
  ...ANTITB,
  ...ANTIPARASITICS,
  ...ANTICONVULSANTS,
  ...CARDIOVASCULAR,
  ...RESPIRATORY,
  ...GASTROINTESTINAL,
  ...CORTICOSTEROIDS,
  ...ANTIHISTAMINES,
  ...VITAMINS,
  ...FLUIDS,
  ...ANTIMALARIALS,
  ...MISC,
]

// Drugs offered in the Puyer (compounded powder) multi-select. Anything flagged
// forPuyer is poured-powder appropriate.
export const ALL_DRUGS: DrugPreset[] = DRUG_PRESETS.filter((d) => d.forPuyer)

// Back-compat alias (previously a separate hand-maintained list).
export const PUYER_DRUGS: DrugPreset[] = ALL_DRUGS

// Guard against duplicate ids slipping in across the split data files.
if (import.meta.env?.DEV) {
  const seen = new Set<string>()
  for (const d of DRUG_PRESETS) {
    if (seen.has(d.id)) console.warn(`[drugs] duplicate id: ${d.id}`)
    seen.add(d.id)
  }
}
