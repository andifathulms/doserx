import { HistoryPanel } from '../components/HistoryPanel'
import { HistoryEntry } from '../lib/storage'

/** /riwayat — a record, not a calculator, and its own chunk. */
export function HistoryPage({
  entries,
  onUpdated,
}: {
  entries: HistoryEntry[]
  onUpdated: () => void
}) {
  return (
    <>
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>Riwayat perhitungan</h1>
        <p className="page-lede">
          Tersimpan di perangkat ini saja — tidak ada yang dikirim ke server.
        </p>
      </div>
      <HistoryPanel entries={entries} onUpdated={onUpdated} />
    </>
  )
}
