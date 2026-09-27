import { DrugGroup } from './drugs'

/**
 * The single source of truth for "does every clinical group have its accent
 * colour." `Record<DrugGroup, …>` makes a missing group a compile error;
 * groupColors.test.ts parses index.css's `[data-group]` rules (light and the
 * dark override block) and fails if either drifts from these values.
 *
 * Nine hues spaced around the wheel so they can actually be learned —
 * seventeen could not. Teal is left out on purpose: it is the app's
 * operating colour. Red-leaning crimson is Kardiovaskular; the brighter
 * signal red stays reserved for errors and the Darurat section. Every value
 * clears 4.5:1 against both --c-bg and --c-surface in its theme
 * (npm run contrast).
 */
export const GROUP_COLORS: Record<DrugGroup, { light: string; dark: string }> = {
  Kardiovaskular: { light: '#a8304f', dark: '#f08aa4' },
  'Respirasi & Alergi': { light: '#246f9e', dark: '#6db5e6' },
  Neurologi: { light: '#6c43ad', dark: '#b096ec' },
  Analgetik: { light: '#a3521b', dark: '#ee9a64' },
  'Cairan & Elektrolit': { light: '#3a52bb', dark: '#94a6f4' },
  Gastrointestinal: { light: '#7a6200', dark: '#d8bb4e' },
  'Anti-infeksi': { light: '#2b7431', dark: '#74c87b' },
  'Anestesi & Intubasi': { light: '#8a3886', dark: '#dc8ed6' },
  'Lain-lain & Nutrisi': { light: '#566267', dark: '#a8b3b8' },
}
