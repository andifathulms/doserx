import { useState, useCallback } from 'react'
import { Tabs } from './components/Tabs'
import { PresetPanel } from './components/PresetPanel'
import { CustomPanel } from './components/CustomPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { PuyerPanel } from './components/PuyerPanel'
import { loadHistory, loadCustomDrugs, HistoryEntry, CustomDrugPreset } from './lib/storage'

const TABS = [
  { id: 'preset', label: 'Preset' },
  { id: 'custom', label: 'Kustom' },
  { id: 'puyer', label: 'Puyer' },
  { id: 'history', label: 'Riwayat' },
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
    if (id === 'history') refreshHistory()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <h1 className="app-title">Dose<span>Rx</span></h1>
          <p className="app-subtitle">Kalkulator dosis berbasis berat badan</p>
        </div>
        <div className="header-badge">Clinical Tool</div>
      </header>

      <main className="app-main">
        <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />

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
        {activeTab === 'history' && (
          <HistoryPanel entries={history} onUpdated={refreshHistory} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          <strong>Alat bantu hitung saja.</strong> Bukan sistem pendukung keputusan klinis atau resep.
          Nilai dosis preset adalah referensi umum — verifikasi dengan panduan institusi/klinis terkini sebelum digunakan.
        </p>
      </footer>
    </div>
  )
}

export default App
