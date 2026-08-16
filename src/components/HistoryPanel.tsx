import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretUpIcon, CaretDownIcon, CaretSortIcon } from '@radix-ui/react-icons'
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

type SortKey = 'timestamp' | 'drug'
type SortDir = 'asc' | 'desc'

/** Default direction on first click of a column — newest-first for time
 *  (matching the app's long-standing default) and A→Z for the drug name. */
const DEFAULT_DIR: Record<SortKey, SortDir> = { timestamp: 'desc', drug: 'asc' }

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <CaretSortIcon className="history-table__sort-icon" aria-hidden="true" />
  return dir === 'asc' ? (
    <CaretUpIcon className="history-table__sort-icon history-table__sort-icon--active" aria-hidden="true" />
  ) : (
    <CaretDownIcon className="history-table__sort-icon history-table__sort-icon--active" aria-hidden="true" />
  )
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = activeKey === sortKey
  return (
    <th scope="col" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="history-table__sort-btn" onClick={() => onSort(sortKey)}>
        {label}
        <SortIndicator active={active} dir={dir} />
      </button>
    </th>
  )
}

export function HistoryPanel({ entries, onUpdated }: HistoryPanelProps) {
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  const emptyRef = useRef<HTMLParagraphElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  // Every other destructive action in this panel (single-entry delete,
  // Puyer's per-drug reset) is a custom, focus-managed control — "Hapus
  // semua" used to be the one exception that dropped to a native
  // window.confirm(). This mirrors that same pattern instead.
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    if (confirmingClearAll) confirmRef.current?.focus()
  }, [confirmingClearAll])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(DEFAULT_DIR[key])
    }
  }

  // "Did I give this child a different dose last week?" is hard to answer
  // from a reverse-chronological list of prose rows — sorting by drug groups
  // every past calculation for the same medicine together.
  const sorted = useMemo(() => {
    const list = [...entries]
    list.sort((a, b) => {
      const cmp =
        sortKey === 'timestamp'
          ? a.timestamp - b.timestamp
          : a.drugName.localeCompare(b.drugName, 'id')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [entries, sortKey, sortDir])

  // Deleting removes the <tr> that holds the focused button. Move focus to
  // the entry that takes its place, or to the surrounding controls when the
  // table shortens or empties — never to <body>.
  function handleDelete(id: string, index: number) {
    deleteEntry(id)
    onUpdated()
    requestAnimationFrame(() => {
      const buttons = bodyRef.current?.querySelectorAll<HTMLButtonElement>(
        '.history-table__delete',
      )
      if (buttons && buttons.length > 0) {
        buttons[Math.min(index, buttons.length - 1)].focus()
        return
      }
      ;(clearRef.current ?? emptyRef.current)?.focus()
    })
  }

  function handleClearAll() {
    clearHistory()
    onUpdated()
    setConfirmingClearAll(false)
    requestAnimationFrame(() => emptyRef.current?.focus())
  }

  function handleCancelClearAll() {
    setConfirmingClearAll(false)
    requestAnimationFrame(() => clearRef.current?.focus())
  }

  function handleClearAllKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') handleCancelClearAll()
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
        {confirmingClearAll ? (
          <span className="history-clear-confirm" role="group" aria-label="Konfirmasi hapus semua riwayat" onKeyDown={handleClearAllKeyDown}>
            <span className="history-clear-confirm__text">Yakin?</span>
            <button ref={confirmRef} className="btn btn--ghost btn--sm history-clear-confirm__yes" onClick={handleClearAll}>
              Ya, hapus semua
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleCancelClearAll}>
              Batal
            </button>
          </span>
        ) : (
          <button ref={clearRef} className="btn btn--ghost btn--sm" onClick={() => setConfirmingClearAll(true)}>
            Hapus semua
          </button>
        )}
      </div>

      <div className="history-table-scroll">
        <table className="history-table">
          <caption className="sr-only">
            Riwayat {entries.length} perhitungan dosis tersimpan di perangkat ini
          </caption>
          <thead>
            <tr>
              <SortableHeader label="Obat" sortKey="drug" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Waktu" sortKey="timestamp" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <th scope="col" className="history-table__num">BB (kg)</th>
              <th scope="col" className="history-table__num">Dosis/kg</th>
              <th scope="col" className="history-table__num">Freq</th>
              <th scope="col" className="history-table__num">Harian (mg)</th>
              <th scope="col" className="history-table__num">Per dosis (mg)</th>
              <th scope="col" className="history-table__num">Volume (mL)</th>
              <th scope="col">Catatan</th>
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {sorted.map((entry, index) => (
              <tr key={entry.id} className="history-table__row">
                <td data-label="Obat" className="history-table__name">
                  <span className="history-table__drug">{entry.drugName}</span>
                  {entry.patientLabel && (
                    <span className="history-entry__label">{entry.patientLabel}</span>
                  )}
                </td>
                <td data-label="Waktu" className="history-table__time">
                  {formatTime(entry.timestamp)}
                </td>
                <td data-label="BB (kg)" className="history-table__num">{entry.weight}</td>
                {/* The stored dosePerKg is per DAY (panels convert via
                    modeToDay before saving), and the per-kali/per-hari toggle
                    makes exactly this the thing to get wrong. History is read
                    later without the form's context, so the period is
                    stated, same as the old prose row did. */}
                <td data-label="Dosis/kg" className="history-table__num">
                  {entry.dosePerKg} mg/kg/hari
                </td>
                <td data-label="Freq" className="history-table__num">{entry.freq}×/hari</td>
                <td data-label="Harian (mg)" className="history-table__num">
                  {entry.dailyDose}
                  {entry.cappedByMaxDay && <span className="badge badge--warn">cap</span>}
                </td>
                <td data-label="Per dosis (mg)" className="history-table__num">
                  {entry.perDose}
                  {entry.cappedByMaxSingle && <span className="badge badge--warn">cap</span>}
                </td>
                <td data-label="Volume (mL)" className="history-table__num">
                  {entry.volume ?? '—'}
                </td>
                <td data-label="Catatan" className="history-table__notes">
                  <NoteEditor entry={entry} onSaved={onUpdated} />
                  <button
                    className="btn btn--ghost btn--sm history-table__delete"
                    onClick={() => handleDelete(entry.id, index)}
                    aria-label={`Hapus entri ${entry.drugName}`}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
