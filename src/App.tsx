import { useState, useCallback } from 'react'
import { Tabs } from './components/Tabs'
import { PresetPanel } from './components/PresetPanel'
import { CustomPanel } from './components/CustomPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { PuyerPanel } from './components/PuyerPanel'
import { InfusionPanel } from './components/InfusionPanel'
import { loadHistory, loadCustomDrugs, HistoryEntry, CustomDrugPreset } from './lib/storage'

// Calculator modes only. History is a record, not a calculator — it lives in the
// header (see below) rather than crowding the segmented control to 5 items.
const TABS = [
  { id: 'preset', label: 'Preset' },
  { id: 'custom', label: 'Kustom' },
  { id: 'puyer', label: 'Puyer' },
  { id: 'infus', label: 'Infus' },
]

function App() {
  const [activeTab, setActiveTab] = useState('preset')
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [customDrugs, setCustomDrugs] = useState<CustomDrugPreset[]>(() => loadCustomDrugs())

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
          <p className="app-subtitle">Kalkulator dosis berbasis berat badan</p>
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
        {showCalculator && (
          <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />
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
          <PuyerPanel onHistoryUpdated={refreshHistory} />
        )}
        {activeTab === 'infus' && (
          <InfusionPanel />
        )}
        {activeTab === 'history' && (
          <HistoryPanel entries={history} onUpdated={refreshHistory} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Nilai dosis preset adalah referensi umum dan tidak menggantikan penilaian klinis.
          Tidak ada data pasien yang dikirim ke server — semua perhitungan berjalan di perangkat ini.
        </p>
      </footer>
    </div>
  )
}

export default App
