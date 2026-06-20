import { HistoryEntry, deleteEntry, clearHistory } from '../lib/storage'

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onUpdated: () => void
}

function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} h ago`
  if (days < 7) return `${days} d ago`
  return new Date(ts).toLocaleDateString()
}

export function HistoryPanel({ entries, onUpdated }: HistoryPanelProps) {
  function handleDelete(id: string) {
    deleteEntry(id)
    onUpdated()
  }

  function handleClearAll() {
    if (window.confirm('Clear all history entries?')) {
      clearHistory()
      onUpdated()
    }
  }

  if (entries.length === 0) {
    return (
      <div className="panel">
        <div className="empty-state">
          <p className="empty-state__msg">No saved calculations yet.</p>
          <p className="empty-state__hint">Run a calculation and tap "Save to history".</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="history-header">
        <span className="history-count">{entries.length} saved</span>
        <button className="btn btn--ghost btn--sm" onClick={handleClearAll}>
          Clear all
        </button>
      </div>

      <ul className="history-list">
        {entries.map((entry) => (
          <li key={entry.id} className="history-entry">
            <div className="history-entry__top">
              <span className="history-entry__drug">{entry.drugName}</span>
              {entry.patientLabel && (
                <span className="history-entry__label">{entry.patientLabel}</span>
              )}
              <span className="history-entry__time">{formatTime(entry.timestamp)}</span>
            </div>
            <div className="history-entry__inputs">
              {entry.weight} kg · {entry.dosePerKg} mg/kg · {entry.freq}×/day
            </div>
            <div className="history-entry__outputs">
              <span>Daily: <strong>{entry.dailyDose} mg</strong></span>
              <span>Per dose: <strong>{entry.perDose} mg</strong></span>
              {entry.volume != null && (
                <span>Volume: <strong>{entry.volume} mL</strong></span>
              )}
              {entry.cappedByMaxDay && <span className="badge badge--warn">Daily cap</span>}
              {entry.cappedByMaxSingle && <span className="badge badge--warn">Dose cap</span>}
            </div>
            <button
              className="btn btn--ghost btn--sm history-entry__delete"
              onClick={() => handleDelete(entry.id)}
              aria-label={`Delete entry for ${entry.drugName}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
