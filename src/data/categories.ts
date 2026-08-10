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
