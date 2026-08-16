import { DrugCategory } from './drugs'

/**
 * The single source of truth for "does every therapeutic category have its
 * accent colour." DESIGN-REWORK.md §9: the CSS `[data-cat="…"]` rules in
 * index.css used to be the only place this lived, with nothing enforcing
 * that a new DrugCategory member came with a matching rule — the types.ts
 * NOTE just asked nicely.
 *
 * `Record<DrugCategory, …>` makes that structural: TypeScript will not
 * compile if a category is added to the union here without an entry, or
 * removed from the union while still listed. src/data/categoryColors.test.ts
 * closes the other half of the loop — it parses index.css's actual
 * `[data-cat]` rules (light and the dark override block) and fails the
 * suite if either drifts from these values, so the CSS itself can't go
 * stale even though it isn't generated from this file automatically.
 *
 * Values are exactly what index.css declares today; this file doesn't
 * decide the colours, it just makes their completeness checkable.
 */
export const CATEGORY_COLORS: Record<DrugCategory, { light: string; dark: string }> = {
  'Gawat Darurat': { light: '#953737', dark: '#c67474' },
  'Analgesik/NSAID': { light: '#9b5c31', dark: '#be7b4d' },
  Antibiotik: { light: '#5a5a9e', dark: '#8787b6' },
  Antivirus: { light: '#2e7a8c', dark: '#4096aa' },
  Antijamur: { light: '#8a6c28', dark: '#a88639' },
  'Anti-TB (OAT)': { light: '#94384e', dark: '#c47386' },
  Antiparasit: { light: '#368352', dark: '#479b65' },
  Antikonvulsan: { light: '#683894', dark: '#a27ac7' },
  Kardiovaskular: { light: '#8e3e62', dark: '#bd7595' },
  Pulmologi: { light: '#2e769b', dark: '#4193bd' },
  Gastrointestinal: { light: '#9b6a31', dark: '#b68042' },
  Kortikosteroid: { light: '#5a3795', dark: '#997dc9' },
  'Antihistamin/Alergi': { light: '#843f8d', dark: '#b374bb' },
  'Vitamin/Mineral': { light: '#546e28', dark: '#75953d' },
  'Cairan & Elektrolit': { light: '#275f7d', dark: '#4593bc' },
  Antimalarial: { light: '#2b766f', dark: '#3e9990' },
  'Lain-lain': { light: '#5d646f', dark: '#848b96' },
}
