import { DrugCategory } from './drugs'

/**
 * Display order for therapeutic categories — emergency first, then roughly by
 * how often a general practice reaches for them.
 *
 * Shared by the picker inside the calculator and the /obat catalog so the
 * library reads the same way in both places. Every value must also have a
 * matching [data-cat="…"] accent rule in index.css.
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
