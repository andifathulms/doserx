import { CalcResult } from '../lib/calculate'
import { HistoryEntry, generateId, saveEntry } from '../lib/storage'
import { useState } from 'react'

interface ResultCardProps {
  result: CalcResult
  drugName: string
  weight: number
  dosePerKg: number
  freq: number
  concentration?: number
  onSaved: () => void
}

export function ResultCard({ result, drugName, weight, dosePerKg, freq, concentration, onSaved }: ResultCardProps) {
  const [label, setLabel] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const entry: HistoryEntry = {
      id: generateId(),
      timestamp: Date.now(),
      drugName,
      patientLabel: label.trim(),
      weight,
      dosePerKg,
      freq,
      dailyDose: result.dailyDose,
      perDose: result.perDose,
      volume: result.volume,
      concentration,
      cappedByMaxDay: result.cappedByMaxDay,
      cappedByMaxSingle: result.cappedByMaxSingle,
    }
    saveEntry(entry)
    setSaved(true)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="result-card">
      <div className="result-card__header">
        <span className="result-card__drug">{drugName}</span>
        <span className="result-card__weight">{weight} kg</span>
      </div>

      {(result.cappedByMaxDay || result.cappedByMaxSingle) && (
        <div className="result-card__warning">
          {result.cappedByMaxDay && <p>Daily dose capped at maximum ({result.dailyDose} mg/day).</p>}
          {result.cappedByMaxSingle && <p>Per-dose capped at maximum single dose ({result.perDose} mg/dose).</p>}
        </div>
      )}

      <div className="result-card__values">
        <div className="result-value">
          <span className="result-value__label">Daily dose</span>
          <span className="result-value__num">{result.dailyDose}</span>
          <span className="result-value__unit">mg/day</span>
        </div>
        <div className="result-value result-value--highlight">
          <span className="result-value__label">Per dose</span>
          <span className="result-value__num">{result.perDose}</span>
          <span className="result-value__unit">mg</span>
        </div>
        {result.volume != null && (
          <div className="result-value result-value--highlight">
            <span className="result-value__label">Volume</span>
            <span className="result-value__num">{result.volume}</span>
            <span className="result-value__unit">mL</span>
          </div>
        )}
      </div>

      <div className="result-card__save">
        <input
          className="input input--sm"
          type="text"
          placeholder="Patient initials (optional)"
          value={label}
          maxLength={20}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="Patient label"
        />
        <button className="btn btn--secondary" onClick={handleSave} disabled={saved}>
          {saved ? 'Saved' : 'Save to history'}
        </button>
      </div>
    </div>
  )
}
