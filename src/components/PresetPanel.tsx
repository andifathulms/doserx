import { useState } from 'react'
import { DrugGrid } from './DrugGrid'
import { ResultCard } from './ResultCard'
import { DrugPreset } from '../data/drugs'
import { calculate, CalcResult } from '../lib/calculate'

interface PresetPanelProps {
  onHistoryUpdated: () => void
}

export function PresetPanel({ onHistoryUpdated }: PresetPanelProps) {
  const [selected, setSelected] = useState<DrugPreset | null>(null)
  const [weight, setWeight] = useState('')
  const [dosePerKg, setDosePerKg] = useState('')
  const [freq, setFreq] = useState('')
  const [concentration, setConcentration] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSelect(drug: DrugPreset) {
    setSelected(drug)
    setDosePerKg(String(drug.dosePerKg))
    setFreq(String(drug.freq))
    setConcentration(drug.concentration != null ? String(drug.concentration) : '')
    setResult(null)
    setError(null)
  }

  function handleCalculate() {
    if (!selected) return
    const out = calculate({
      weight: parseFloat(weight),
      dosePerKg: parseFloat(dosePerKg),
      freq: parseFloat(freq),
      maxDay: selected.maxDay,
      maxSingle: selected.maxSingle,
      concentration: concentration ? parseFloat(concentration) : undefined,
    })
    if (!out.valid) {
      setError(out.error)
      setResult(null)
    } else {
      setError(null)
      setResult(out)
    }
  }

  return (
    <div className="panel">
      <DrugGrid selected={selected?.id ?? null} onSelect={handleSelect} />

      {selected && (
        <>
          <div className="drug-note">{selected.note}</div>

          <div className="form">
            <div className="field">
              <label className="label" htmlFor="preset-weight">Weight (kg)</label>
              <input
                id="preset-weight"
                className="input"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 25"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); setResult(null) }}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="preset-dose">Dose (mg/kg)</label>
              <input
                id="preset-dose"
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={dosePerKg}
                onChange={(e) => { setDosePerKg(e.target.value); setResult(null) }}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="preset-freq">Doses/day</label>
              <input
                id="preset-freq"
                className="input"
                type="number"
                min="1"
                step="1"
                value={freq}
                onChange={(e) => { setFreq(e.target.value); setResult(null) }}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="preset-conc">Stock concentration (mg/mL)</label>
              <input
                id="preset-conc"
                className="input"
                type="number"
                min="0"
                step="0.1"
                placeholder="optional"
                value={concentration}
                onChange={(e) => { setConcentration(e.target.value); setResult(null) }}
              />
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn--primary" onClick={handleCalculate}>
            Calculate
          </button>

          {result && (
            <ResultCard
              result={result}
              drugName={selected.name}
              weight={parseFloat(weight)}
              dosePerKg={parseFloat(dosePerKg)}
              freq={parseFloat(freq)}
              concentration={concentration ? parseFloat(concentration) : undefined}
              onSaved={onHistoryUpdated}
            />
          )}
        </>
      )}

      {!selected && (
        <p className="empty-hint">Select a drug above to begin.</p>
      )}
    </div>
  )
}
