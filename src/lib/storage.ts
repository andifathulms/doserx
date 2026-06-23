const HISTORY_KEY = 'doserx_history'
const CUSTOM_DRUGS_KEY = 'doserx_custom_drugs'
const RECENTS_KEY = 'doserx_recents'
const FAVORITES_KEY = 'doserx_favorites'
const RECENTS_MAX = 8

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
