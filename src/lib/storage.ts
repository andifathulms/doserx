const HISTORY_KEY = 'doserx_history'

export interface HistoryEntry {
  id: string
  timestamp: number
  drugName: string
  patientLabel: string
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

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
