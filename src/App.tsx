import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { Tabs } from './components/Tabs'
import { PresetPanel } from './components/PresetPanel'
import { CustomPanel } from './components/CustomPanel'
import { MakerSignature } from './components/MakerSignature'
import { WorkedExample } from './components/WorkedExample'
import { loadHistory, loadCustomDrugs, HistoryEntry, CustomDrugPreset } from './lib/storage'

/**
 * Puyer, Infus and History sit behind a tab or the header button — never on
 * screen at first paint and never needed in the first interaction, which is
 * always Preset. Splitting them takes 5.5 kB gzip off the critical path.
 *
 * Preset, DrugGrid, ResultCard and the worked example stay eagerly imported:
 * they ARE the first interaction.
 */
const HistoryPanel = lazy(() =>
  import('./components/HistoryPanel').then((m) => ({ default: m.HistoryPanel })),
)
const PuyerPanel = lazy(() =>
  import('./components/PuyerPanel').then((m) => ({ default: m.PuyerPanel })),
)
const InfusionPanel = lazy(() =>
  import('./components/InfusionPanel').then((m) => ({ default: m.InfusionPanel })),
)

// Calculator modes only. History is a record, not a calculator — it lives in the
// header (see below) rather than crowding the segmented control to 5 items.
// Each mode carries a one-line hint: the bare labels are jargon to anyone
// meeting the app for the first time, and nothing else on screen says these
// four are calculators rather than drug categories.
const TABS = [
  {
    id: 'preset',
    label: 'Preset',
    hint: 'Hitung dosis satu obat dari katalog siap pakai — dosis/kg sudah terisi.',
  },
  {
    id: 'custom',
    label: 'Kustom',
    hint: 'Obat di luar katalog — masukkan sendiri dosis/kg, frekuensi, dan konsentrasi.',
  },
  {
    id: 'puyer',
    label: 'Puyer',
    hint: 'Racik 2 obat atau lebih sekaligus menjadi satu resep puyer per bungkus.',
  },
  {
    id: 'infus',
    label: 'Infus',
    hint: 'Obat drip — hitung kecepatan infus (mL/jam) dan tetes per menit.',
  },
]

function App() {
  const [activeTab, setActiveTab] = useState('preset')
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [customDrugs, setCustomDrugs] = useState<CustomDrugPreset[]>(() => loadCustomDrugs())

  // Warm the split chunks once the page is idle, so switching tabs never waits
  // on a network round trip. Without this the split would be a perceptible
  // change, which is exactly what this pass is not allowed to introduce.
  useEffect(() => {
    const warm = () => {
      void import('./components/PuyerPanel')
      void import('./components/InfusionPanel')
      void import('./components/HistoryPanel')
    }
    const ric = window.requestIdleCallback
    if (typeof ric === 'function') {
      const id = ric(warm, { timeout: 3000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(warm, 1500)
    return () => window.clearTimeout(id)
  }, [])

  const refreshHistory = useCallback(() => {
    setHistory(loadHistory())
  }, [])

  const refreshCustomDrugs = useCallback(() => {
    setCustomDrugs(loadCustomDrugs())
  }, [])

  function handleTabChange(id: string) {
    setActiveTab(id)
  }

  function toggleHistory() {
    if (activeTab === 'history') {
      setActiveTab('preset')
    } else {
      refreshHistory()
      setActiveTab('history')
    }
  }

  const showCalculator = activeTab !== 'history'

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <h1 className="app-title">Dose<span>Rx</span></h1>
          <p className="app-subtitle">
            Masukkan berat badan pasien — langsung dapat <strong>dosis mg</strong> dan{' '}
            <strong>volume mL</strong> yang harus diberikan.
          </p>
        </div>
        <button
          type="button"
          className={`history-toggle${activeTab === 'history' ? ' history-toggle--active' : ''}`}
          onClick={toggleHistory}
          aria-pressed={activeTab === 'history'}
        >
          Riwayat
          {history.length > 0 && (
            <span className="history-toggle__count">{history.length}</span>
          )}
        </button>
      </header>

      <main className="app-main">
        {/* The flow, carried through with real numbers and a live weight —
            an abstract three-step strip demonstrated nothing. */}
        {showCalculator && <WorkedExample />}

        {showCalculator && (
          <Tabs
            tabs={TABS}
            active={activeTab}
            onChange={handleTabChange}
            label="Mode hitung"
          />
        )}

        <div className="safety-banner" role="note">
          <span className="safety-banner__icon" aria-hidden="true">⚠</span>
          <span>
            <strong>Alat bantu hitung saja</strong> — bukan sistem pendukung keputusan klinis atau resep.
            Verifikasi setiap dosis dengan panduan institusi/klinis terkini sebelum digunakan.
          </span>
        </div>

        {activeTab === 'preset' && (
          <PresetPanel
            onHistoryUpdated={refreshHistory}
            customDrugs={customDrugs}
            onCustomDrugDeleted={refreshCustomDrugs}
          />
        )}
        {activeTab === 'custom' && (
          <CustomPanel
            onHistoryUpdated={refreshHistory}
            onPresetSaved={refreshCustomDrugs}
          />
        )}
        {activeTab === 'puyer' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <PuyerPanel onHistoryUpdated={refreshHistory} />
          </Suspense>
        )}
        {activeTab === 'infus' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <InfusionPanel />
          </Suspense>
        )}
        {activeTab === 'history' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <HistoryPanel entries={history} onUpdated={refreshHistory} />
          </Suspense>
        )}
      </main>

      <footer className="app-footer">
        <div className="app-footer__bar">
          <p className="app-footer__legal">
            Nilai dosis preset adalah referensi umum dan tidak menggantikan penilaian klinis.
            Tidak ada data pasien yang dikirim ke server — semua perhitungan berjalan di perangkat ini.
          </p>
          <MakerSignature />
        </div>
      </footer>
    </div>
  )
}

export default App
