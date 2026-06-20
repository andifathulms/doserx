import { useState } from 'react'
import { ResultCard } from './ResultCard'
import { WeightInput } from './WeightInput'
import { calculate, CalcResult } from '../lib/calculate'

interface CustomPanelProps {
  onHistoryUpdated: () => void
}

export function CustomPanel({ onHistoryUpdated }: CustomPanelProps) {
  const [drugName, setDrugName] = useState('')
  const [weight, setWeight] = useState('')
  const [dosePerKg, setDosePerKg] = useState('')
  const [freq, setFreq] = useState('')
  const [maxDay, setMaxDay] = useState('')
  const [concentration, setConcentration] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleCalculate() {
    const out = calculate({
      weight: parseFloat(weight),
      dosePerKg: parseFloat(dosePerKg),
      freq: parseFloat(freq),
      maxDay: maxDay ? parseFloat(maxDay) : undefined,
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
      <div className="form">
        <div className="field field--full">
          <label className="label" htmlFor="custom-drug">Nama obat</label>
          <input
            id="custom-drug"
            className="input"
            type="text"
            placeholder="misal Metronidazole"
            value={drugName}
            onChange={(e) => { setDrugName(e.target.value); setResult(null) }}
          />
        </div>
        <WeightInput
          id="custom-weight"
          value={weight}
          onChange={(v) => { setWeight(v); setResult(null) }}
        />
        <div className="field">
          <label className="label" htmlFor="custom-dose">Dosis (mg/kg)</label>
          <input
            id="custom-dose"
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="misal 7.5"
            value={dosePerKg}
            onChange={(e) => { setDosePerKg(e.target.value); setResult(null) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-freq">Frekuensi/hari</label>
          <input
            id="custom-freq"
            className="input"
            type="number"
            min="1"
            step="1"
            placeholder="misal 3"
            value={freq}
            onChange={(e) => { setFreq(e.target.value); setResult(null) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-maxday">Dosis maks/hari (mg) <span className="label--optional">opsional</span></label>
          <input
            id="custom-maxday"
            className="input"
            type="number"
            min="0"
            step="1"
            placeholder="misal 2000"
            value={maxDay}
            onChange={(e) => { setMaxDay(e.target.value); setResult(null) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-conc">Konsentrasi stok (mg/mL) <span className="label--optional">opsional</span></label>
          <input
            id="custom-conc"
            className="input"
            type="number"
            min="0"
            step="0.1"
            placeholder="misal 50"
            value={concentration}
            onChange={(e) => { setConcentration(e.target.value); setResult(null) }}
          />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button className="btn btn--primary" onClick={handleCalculate}>
        Hitung
      </button>

      {result && (
        <ResultCard
          result={result}
          drugName={drugName || 'Obat kustom'}
          weight={parseFloat(weight)}
          dosePerKg={parseFloat(dosePerKg)}
          freq={parseFloat(freq)}
          concentration={concentration ? parseFloat(concentration) : undefined}
          onSaved={onHistoryUpdated}
        />
      )}
    </div>
  )
}
