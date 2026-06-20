import { useState, useCallback } from 'react'
import { Tabs } from './components/Tabs'
import { PresetPanel } from './components/PresetPanel'
import { CustomPanel } from './components/CustomPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { loadHistory, HistoryEntry } from './lib/storage'

const TABS = [
  { id: 'preset', label: 'Presets' },
  { id: 'custom', label: 'Custom' },
  { id: 'history', label: 'History' },
]

function App() {
  const [activeTab, setActiveTab] = useState('preset')
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  const refreshHistory = useCallback(() => {
    setHistory(loadHistory())
  }, [])

  function handleTabChange(id: string) {
    setActiveTab(id)
    if (id === 'history') refreshHistory()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">DoseRx</h1>
        <p className="app-subtitle">Weight-based dose calculator</p>
      </header>

      <main className="app-main">
        <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />

        {activeTab === 'preset' && (
          <PresetPanel onHistoryUpdated={refreshHistory} />
        )}
        {activeTab === 'custom' && (
          <CustomPanel onHistoryUpdated={refreshHistory} />
        )}
        {activeTab === 'history' && (
          <HistoryPanel entries={history} onUpdated={refreshHistory} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          <strong>Calculation aid only.</strong> Not a clinical decision support or prescribing system.
          Preset dosing values are general references — verify against current institutional guidelines before use.
        </p>
      </footer>
    </div>
  )
}

export default App
