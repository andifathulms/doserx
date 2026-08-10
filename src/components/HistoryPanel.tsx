import { useEffect, useRef, useState } from 'react'
import { HistoryEntry, deleteEntry, clearHistory, updateEntryNote } from '../lib/storage'

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
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID')
}

function NoteEditor({ entry, onSaved }: { entry: HistoryEntry; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.note ?? '')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)

  // Closing the editor unmounts the focused button. Hand focus back to the
  // trigger that opened it rather than dropping it on <body>.
  useEffect(() => {
    if (wasEditing.current && !editing) triggerRef.current?.focus()
    wasEditing.current = editing
  }, [editing])

  function handleSave() {
    updateEntryNote(entry.id, draft)
    onSaved()
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="history-note-row">
        {entry.note ? (
          <span className="history-note">{entry.note}</span>
        ) : null}
        <button
          ref={triggerRef}
          className="note-edit-btn"
          onClick={() => { setDraft(entry.note ?? ''); setEditing(true) }}
        >
          {entry.note ? 'Edit catatan' : '+ Catatan'}
        </button>
      </div>
    )
  }

  return (
    <div className="history-note-editor">
      <textarea
        className="input input--sm"
        rows={2}
        maxLength={200}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Tambah catatan…"
      />
      <div className="history-note-editor__btns">
        <button className="btn btn--secondary btn--sm" onClick={handleSave}>Simpan</button>
        <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Batal</button>
      </div>
    </div>
  )
}

export function HistoryPanel({ entries, onUpdated }: HistoryPanelProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  const emptyRef = useRef<HTMLParagraphElement>(null)

  // Deleting removes the <li> that holds the focused button. Move focus to the
  // entry that takes its place, or to the surrounding controls when the list
  // shortens or empties — never to <body>.
  function handleDelete(id: string, index: number) {
    deleteEntry(id)
    onUpdated()
    requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
        '.history-entry__delete',
      )
      if (buttons && buttons.length > 0) {
        buttons[Math.min(index, buttons.length - 1)].focus()
        return
      }
      ;(clearRef.current ?? emptyRef.current)?.focus()
    })
  }

  function handleClearAll() {
    if (window.confirm('Hapus semua riwayat kalkulasi?')) {
      clearHistory()
      onUpdated()
      requestAnimationFrame(() => emptyRef.current?.focus())
    }
  }

  if (entries.length === 0) {
    return (
      <div className="panel">
        <div className="empty-state">
          {/* tabIndex={-1}: not a tab stop, but a valid focus destination when
              the list this replaced is emptied. */}
          <p className="empty-state__msg" ref={emptyRef} tabIndex={-1}>
            Belum ada kalkulasi tersimpan.
          </p>
          <p className="empty-state__hint">Hitung dosis lalu tekan “Simpan”.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="history-header">
        <span className="history-count">{entries.length} tersimpan</span>
        <button ref={clearRef} className="btn btn--ghost btn--sm" onClick={handleClearAll}>
          Hapus semua
        </button>
      </div>

      <ul className="history-list" ref={listRef}>
        {entries.map((entry, index) => (
          <li key={entry.id} className="history-entry">
            <div className="history-entry__top">
              <h3 className="history-entry__drug">{entry.drugName}</h3>
              {entry.patientLabel && (
                <span className="history-entry__label">{entry.patientLabel}</span>
              )}
              <span className="history-entry__time">{formatTime(entry.timestamp)}</span>
            </div>
            {/* The stored dosePerKg is per DAY (panels convert via modeToDay
                before saving), and the per-kali/per-hari toggle makes exactly
                this the thing to get wrong. History is read later without the
                form's context, so the period is stated. */}
            <div className="history-entry__inputs">
              {entry.weight} kg · {entry.dosePerKg} mg/kg/hari · {entry.freq}×/hari
            </div>
            <div className="history-entry__outputs">
              <span>Harian: <strong>{entry.dailyDose} mg</strong></span>
              <span>Per dosis: <strong>{entry.perDose} mg</strong></span>
              {entry.volume != null && (
                <span>Volume: <strong>{entry.volume} mL</strong></span>
              )}
              {entry.cappedByMaxDay && <span className="badge badge--warn">Cap harian</span>}
              {entry.cappedByMaxSingle && <span className="badge badge--warn">Cap dosis</span>}
            </div>
            <NoteEditor entry={entry} onSaved={onUpdated} />
            <button
              className="btn btn--ghost btn--sm history-entry__delete"
              onClick={() => handleDelete(entry.id, index)}
              aria-label={`Hapus entri ${entry.drugName}`}
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
