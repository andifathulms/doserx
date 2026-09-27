const HISTORY_KEY = 'doserx_history'
const CUSTOM_DRUGS_KEY = 'doserx_custom_drugs'
const RECENTS_KEY = 'doserx_recents'
const FAVORITES_KEY = 'doserx_favorites'
const RECENTS_MAX = 8
const DOSE_MODE_KEY = 'doserx_dose_mode'
const LAST_MODE_KEY = 'doserx_last_mode'
const THEME_KEY = 'doserx_theme'
const PATIENT_KEY = 'doserx_patient'
const POPULATION_KEY = 'doserx_population'

// ── Theme: manual, persisted, never OS-following ───────────────────────────────
// index.html reads this same key in an inline script that runs before first
// paint, so <html data-theme> is already correct by the time CSS applies —
// this module is only consulted again once React hydrates.

export type Theme = 'light' | 'dark'

export function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

// ── Current patient ──────────────────────────────────────────────────────────
// The weight is the one input every tool shares, so it lives in the patient
// bar rather than in each form. It is deliberately SHORT-lived: sessionStorage
// (gone when the tab closes) plus an expiry, because a weight silently carried
// over from the previous patient is the worst failure this feature could have.
// An installed PWA can keep one "session" open for days; the TTL is what
// actually protects the next patient.

export type Population = 'anak' | 'dewasa'

export interface StoredPatient {
  weight: string
  /** Formula text when the weight came from the age estimator, else null. */
  estimatedFrom: string | null
  updatedAt: number
}

export const PATIENT_TTL_MS = 60 * 60 * 1000

export function loadPatient(now: number = Date.now()): StoredPatient | null {
  try {
    const raw = sessionStorage.getItem(PATIENT_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as StoredPatient
    if (typeof p.weight !== 'string' || typeof p.updatedAt !== 'number') return null
    if (now - p.updatedAt > PATIENT_TTL_MS) {
      sessionStorage.removeItem(PATIENT_KEY)
      return null
    }
    return p
  } catch {
    return null
  }
}

export function savePatient(p: StoredPatient): void {
  try {
    if (!p.weight) sessionStorage.removeItem(PATIENT_KEY)
    else sessionStorage.setItem(PATIENT_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

/** Anak/Dewasa is a working preference (a doctor mostly sees one or the
 *  other), not patient data — so it persists, unlike the weight. */
export function loadPopulation(): Population {
  try {
    return localStorage.getItem(POPULATION_KEY) === 'dewasa' ? 'dewasa' : 'anak'
  } catch {
    return 'anak'
  }
}

export function savePopulation(p: Population): void {
  try {
    localStorage.setItem(POPULATION_KEY, p)
  } catch {
    /* ignore */
  }
}

// ── Dose-entry preference: per single dose (per kali) vs per day (per hari) ────

export type DoseMode = 'perDose' | 'perDay'

export function loadDoseMode(): DoseMode {
  try {
    return localStorage.getItem(DOSE_MODE_KEY) === 'perDay' ? 'perDay' : 'perDose'
  } catch {
    return 'perDose'
  }
}

export function saveDoseMode(mode: DoseMode): void {
  try {
    localStorage.setItem(DOSE_MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

// ── Last calculator mode ──────────────────────────────────────────────────────
// /hitung redirects here, so the doctor lands back where she left off instead
// of always on Preset. Validated against the caller's list of known modes so a
// stale or hand-edited value can never route to a dead page.

export function loadLastMode(valid: readonly string[], fallback: string): string {
  try {
    const v = localStorage.getItem(LAST_MODE_KEY)
    return v && valid.includes(v) ? v : fallback
  } catch {
    return fallback
  }
}

export function saveLastMode(mode: string): void {
  try {
    localStorage.setItem(LAST_MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

// ── Recently-used & favorite drugs (keyed by stable drug id) ──────────────────

function loadIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function loadRecents(): string[] {
  return loadIds(RECENTS_KEY)
}

export function recordRecent(id: string): void {
  const next = [id, ...loadRecents().filter((x) => x !== id)].slice(0, RECENTS_MAX)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
}

export function loadFavorites(): string[] {
  return loadIds(FAVORITES_KEY)
}

/** Toggles favorite state and returns the new list. */
export function toggleFavorite(id: string): string[] {
  const current = loadFavorites()
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [id, ...current]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  return next
}

// ── Custom drug presets ───────────────────────────────────────────────────────

export interface CustomDrugPreset {
  id: string
  name: string
  dosePerKg: number
  freq: number
  maxDay?: number
  maxSingle?: number
  concentration?: number
  note: string
  createdAt: number
}

export function loadCustomDrugs(): CustomDrugPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DRUGS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CustomDrugPreset[]
  } catch {
    return []
  }
}

export function saveCustomDrug(drug: CustomDrugPreset): void {
  const drugs = loadCustomDrugs()
  drugs.unshift(drug)
  localStorage.setItem(CUSTOM_DRUGS_KEY, JSON.stringify(drugs))
}

export function deleteCustomDrug(id: string): void {
  const drugs = loadCustomDrugs().filter((d) => d.id !== id)
  localStorage.setItem(CUSTOM_DRUGS_KEY, JSON.stringify(drugs))
}

export interface HistoryEntry {
  id: string
  timestamp: number
  drugName: string
  patientLabel: string
  note?: string
  weight: number
  dosePerKg: number
  freq: number
  dailyDose: number
  perDose: number
  volume?: number
  concentration?: number
  cappedByMaxDay: boolean
  cappedByMaxSingle: boolean
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

export function saveEntry(entry: HistoryEntry): void {
  const history = loadHistory()
  history.unshift(entry)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function deleteEntry(id: string): void {
  const history = loadHistory().filter((e) => e.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function updateEntryNote(id: string, note: string): void {
  const history = loadHistory().map((e) =>
    e.id === id ? { ...e, note: note.trim() || undefined } : e,
  )
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
