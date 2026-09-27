import { DrugCategory, DrugGroup, DrugPreset } from './drugs'

/**
 * Display order for therapeutic categories — emergency first, then roughly by
 * how often a general practice reaches for them.
 *
 * Shared by the picker inside the calculator and the /obat catalog so the
 * library reads the same way in both places. Colour lives on the group, not
 * the category — see GROUP_ORDER below.
 */
export const CATEGORY_ORDER: DrugCategory[] = [
  'Gawat Darurat',
  'Analgesik/NSAID',
  'Antibiotik',
  'Antivirus',
  'Antijamur',
  'Anti-TB (OAT)',
  'Antiparasit',
  'Antikonvulsan',
  'Kardiovaskular',
  'Pulmologi',
  'Gastrointestinal',
  'Kortikosteroid',
  'Antihistamin/Alergi',
  'Vitamin/Mineral',
  'Cairan & Elektrolit',
  'Antimalarial',
  'Lain-lain',
]

/**
 * Fallback for the "Sering dipakai" shelf before a doctor has any favorites
 * or recents — i.e. every first-time visit and every fresh device. Without
 * this, the picker's only narrowing mechanism is empty exactly when it
 * matters most, and a first-time user meets the full ~90-drug wall with no
 * starting point. Mirrors the original PRD's 8-drug seed list: the general
 * practice staples a doctor reaches for most, not an editorial pick.
 */
export const COMMON_DRUG_IDS: string[] = [
  'paracetamol',
  'amoxicillin',
  'ibuprofen',
  'ceftriaxone',
  'diazepam',
  'epinephrine',
  'ondansetron',
  'salbutamol',
]

/**
 * Display order for the nine clinical groups — the order a ward drug list
 * uses, which is also the order the doctor who requested them wrote them in.
 */
export const GROUP_ORDER: DrugGroup[] = [
  'Kardiovaskular',
  'Respirasi & Alergi',
  'Neurologi',
  'Analgetik',
  'Cairan & Elektrolit',
  'Gastrointestinal',
  'Anti-infeksi',
  'Anestesi & Intubasi',
  'Lain-lain & Nutrisi',
]

/**
 * Where each therapeutic category files by default. 'Gawat Darurat' has no
 * sensible default — an emergency drug belongs to a body system like any
 * other — so every drug in it carries an explicit `group` (categories.test.ts
 * enforces that); the fallback here only exists to keep the Record total.
 */
const CATEGORY_GROUP: Record<DrugCategory, DrugGroup> = {
  'Gawat Darurat': 'Lain-lain & Nutrisi',
  'Analgesik/NSAID': 'Analgetik',
  Antibiotik: 'Anti-infeksi',
  Antivirus: 'Anti-infeksi',
  Antijamur: 'Anti-infeksi',
  'Anti-TB (OAT)': 'Anti-infeksi',
  Antiparasit: 'Anti-infeksi',
  Antimalarial: 'Anti-infeksi',
  Antikonvulsan: 'Neurologi',
  Kardiovaskular: 'Kardiovaskular',
  Pulmologi: 'Respirasi & Alergi',
  Gastrointestinal: 'Gastrointestinal',
  Kortikosteroid: 'Respirasi & Alergi',
  'Antihistamin/Alergi': 'Respirasi & Alergi',
  'Vitamin/Mineral': 'Lain-lain & Nutrisi',
  'Cairan & Elektrolit': 'Cairan & Elektrolit',
  'Lain-lain': 'Lain-lain & Nutrisi',
}

/** Anything with a category and an optional group override — a preset or a
 *  catalog drug. */
export type Groupable = Pick<DrugPreset, 'category' | 'group'>

export function groupOf(drug: Groupable): DrugGroup {
  return drug.group ?? CATEGORY_GROUP[drug.category]
}

/** Drugs that surface under the Darurat tag, whatever group they file in. */
export function isEmergency(drug: Pick<DrugPreset, 'category'>): boolean {
  return drug.category === 'Gawat Darurat'
}

/** The categories inside one group, in CATEGORY_ORDER — the sub-filter row
 *  shown when a group spans several (Anti-infeksi, Respirasi & Alergi). */
export function subcategoriesOf(group: DrugGroup, drugs: Groupable[]): DrugCategory[] {
  const present = new Set(drugs.filter((d) => groupOf(d) === group).map((d) => d.category))
  return CATEGORY_ORDER.filter((c) => present.has(c) && c !== 'Gawat Darurat')
}
