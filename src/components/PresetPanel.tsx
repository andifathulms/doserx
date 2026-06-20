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
  const [resultMin, setResultMin] = useState<CalcResult | null>(null)
  const [resultMax, setResultMax] = useState<CalcResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSelect(drug: DrugPreset) {
    setSelected(drug)
    setDosePerKg(String(drug.dosePerKg))
    setFreq(String(drug.freq))
    setConcentration(drug.concentration != null ? String(drug.concentration) : '')
    setResult(null)
    setResultMin(null)
    setResultMax(null)
    setError(null)
  }

  function handleCalculate() {
    if (!selected) return

    const base = {
      weight: parseFloat(weight),
      freq: parseFloat(freq),
      maxDay: selected.maxDay,
      maxSingle: selected.maxSingle,
      concentration: concentration ? parseFloat(concentration) : undefined,
    }

    const out = calculate({ ...base, dosePerKg: parseFloat(dosePerKg) })

    if (!out.valid) {
      setError(out.error)
      setResult(null)
      setResultMin(null)
      setResultMax(null)
      return
    }

    setError(null)
    setResult(out)

    if (selected.dosePerKgMin != null && selected.dosePerKgMax != null) {
      const outMin = calculate({ ...base, dosePerKg: selected.dosePerKgMin })
      const outMax = calculate({ ...base, dosePerKg: selected.dosePerKgMax })
      setResultMin(outMin.valid ? outMin : null)
      setResultMax(outMax.valid ? outMax : null)
    } else {
      setResultMin(null)
      setResultMax(null)
    }
  }

  return (
    <div className="panel">
      <DrugGrid selected={selected?.id ?? null} onSelect={handleSelect} />

      {selected && (
        <>
          <div className="drug-note">
            {selected.dosePerKgMin != null && selected.dosePerKgMax != null && (
              <span className="drug-note__range">
                Range: {selected.dosePerKgMin}–{selected.dosePerKgMax} mg/kg ·{' '}
              </span>
            )}
            {selected.note}
          </div>

          <div className="form">
            <div className="field">
              <label className="label" htmlFor="preset-weight">Berat badan (kg)</label>
              <input
                id="preset-weight"
                className="input"
                type="number"
                min="0"
                step="0.1"
                placeholder="misal 25"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); setResult(null) }}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="preset-dose">
                Dosis (mg/kg)
                {selected.dosePerKgMin != null && selected.dosePerKgMax != null && (
                  <span className="label--range"> [{selected.dosePerKgMin}–{selected.dosePerKgMax}]</span>
                )}
              </label>
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
              <label className="label" htmlFor="preset-freq">Frekuensi/hari</label>
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
              <label className="label" htmlFor="preset-conc">
                Konsentrasi stok (mg/mL) <span className="label--optional">opsional</span>
              </label>
              <input
                id="preset-conc"
                className="input"
                type="number"
                min="0"
                step="0.1"
                placeholder="opsional"
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
              resultMin={resultMin ?? undefined}
              resultMax={resultMax ?? undefined}
              dosePerKgMin={selected.dosePerKgMin}
              dosePerKgMax={selected.dosePerKgMax}
              drugName={selected.name}
              weight={parseFloat(weight)}
              dosePerKg={parseFloat(dosePerKg)}
              freq={parseFloat(freq)}
              concentration={concentration ? parseFloat(concentration) : undefined}
              availableForms={selected.availableForms}
              onSaved={onHistoryUpdated}
            />
          )}
        </>
      )}

      {!selected && (
        <p className="empty-hint">Pilih obat di atas untuk mulai.</p>
      )}
    </div>
  )
}
