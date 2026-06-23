import { useState, useRef } from 'react'
import { DrugGrid } from './DrugGrid'
import { ResultCard } from './ResultCard'
import { WeightInput } from './WeightInput'
import { DrugPreset } from '../data/drugs'
import { CustomDrugPreset, deleteCustomDrug } from '../lib/storage'
import { calculate, CalcResult } from '../lib/calculate'

interface PresetPanelProps {
  onHistoryUpdated: () => void
  customDrugs: CustomDrugPreset[]
  onCustomDrugDeleted: () => void
}

export function PresetPanel({ onHistoryUpdated, customDrugs, onCustomDrugDeleted }: PresetPanelProps) {
  const [selected, setSelected] = useState<DrugPreset | null>(null)
  const [gridOpen, setGridOpen] = useState(true)
  const [weight, setWeight] = useState('')
  const [dosePerKg, setDosePerKg] = useState('')
  const [freq, setFreq] = useState('')
  const [concentration, setConcentration] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [resultMin, setResultMin] = useState<CalcResult | null>(null)
  const [resultMax, setResultMax] = useState<CalcResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)

  function handleSelect(drug: DrugPreset) {
    setSelected(drug)
    setGridOpen(false)
    setDosePerKg(String(drug.dosePerKg))
    setFreq(String(drug.freq))
    setConcentration(drug.concentration != null ? String(drug.concentration) : '')
    setResult(null)
    setResultMin(null)
    setResultMax(null)
    setError(null)
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    )
  }

  function handleSelectCustom(drug: CustomDrugPreset) {
    const asDrugPreset: DrugPreset = {
      id: drug.id,
      name: drug.name,
      route: 'Oral',
      category: 'Lain-lain',
      dosePerKg: drug.dosePerKg,
      freq: drug.freq,
      maxDay: drug.maxDay,
      concentration: drug.concentration,
      note: drug.note || 'Preset kustom',
      forPuyer: false,
    }
    handleSelect(asDrugPreset)
  }

  function handleChangeDrug() {
    setGridOpen(true)
    setSelected(null)
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

    // Only show min/max range when dose is at its preset default.
    // If the doctor has overridden the dose, show just that single result.
    const usingDefault = parseFloat(dosePerKg) === selected.dosePerKg
    if (usingDefault && selected.dosePerKgMin != null && selected.dosePerKgMax != null) {
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

      {/* ── Drug selection ─────────────────────────────── */}
      {gridOpen ? (
        <>
          {customDrugs.length > 0 && (
            <div className="custom-drugs-section">
              <div className="drug-category-label custom-drugs-section__label">
                Preset Saya
              </div>
              <div className="drug-grid custom-drugs-grid">
                {customDrugs.map((drug) => (
                  <div key={drug.id} className={`drug-card custom-drug-card${selected?.id === drug.id ? ' drug-card--selected' : ''}`}>
                    <button
                      className="custom-drug-card__select"
                      onClick={() => handleSelectCustom(drug)}
                    >
                      <span className="drug-card__name">{drug.name}</span>
                      <span className="drug-card__route">{drug.dosePerKg} mg/kg · {drug.freq}×</span>
                    </button>
                    <button
                      className="custom-drug-card__delete"
                      onClick={() => { deleteCustomDrug(drug.id); onCustomDrugDeleted() }}
                      aria-label={`Hapus preset ${drug.name}`}
                      title="Hapus preset"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DrugGrid selected={selected?.id ?? null} onSelect={handleSelect} />
          {!selected && <p className="empty-hint">Pilih obat di atas untuk mulai.</p>}
        </>
      ) : selected && (
        <button className="selected-drug-bar" onClick={handleChangeDrug}>
          <div className="selected-drug-bar__info">
            <span className="selected-drug-bar__dot" data-cat={selected.category} />
            <span className="selected-drug-bar__name">{selected.name}</span>
            <span className="selected-drug-bar__route">{selected.route}</span>
          </div>
          <span className="selected-drug-bar__change">Ganti obat ↓</span>
        </button>
      )}

      {/* ── Calculator form ─────────────────────────────── */}
      {selected && !gridOpen && (
        <div ref={formRef}>
          <div className="drug-note">
            {selected.dosePerKgMin != null && selected.dosePerKgMax != null && (
              <span className="drug-note__range">
                Range: {selected.dosePerKgMin}–{selected.dosePerKgMax} mg/kg/hari ·{' '}
              </span>
            )}
            {selected.note}
            {selected.warning && (
              <p className="drug-note__warning">⚠ {selected.warning}</p>
            )}
            {selected.contraindication && (
              <p className="drug-note__contra">⛔ Kontraindikasi: {selected.contraindication}</p>
            )}
            {(selected.minAgeMonths || selected.minWeightKg || selected.source) && (
              <p className="drug-note__meta">
                {selected.minAgeMonths != null && (
                  <span>Min usia: {selected.minAgeMonths < 12 ? `${selected.minAgeMonths} bln` : `${selected.minAgeMonths / 12} th`} · </span>
                )}
                {selected.minWeightKg != null && <span>Min BB: {selected.minWeightKg} kg · </span>}
                {selected.source && <span>Sumber: {selected.source}</span>}
              </p>
            )}
          </div>

          <div className="form">
            <WeightInput
              id="preset-weight"
              value={weight}
              onChange={(v) => { setWeight(v); setResult(null) }}
              autoFocus
            />
            <div className="field">
              <div className="label-row">
                <label className="label" htmlFor="preset-dose">
                  Dosis (mg/kg)
                  {selected.dosePerKgMin != null && selected.dosePerKgMax != null && (
                    <span className="label--range"> [{selected.dosePerKgMin}–{selected.dosePerKgMax}]</span>
                  )}
                </label>
                {dosePerKg !== String(selected.dosePerKg) && (
                  <button
                    className="reset-btn"
                    onClick={() => { setDosePerKg(String(selected.dosePerKg)); setResult(null) }}
                    title={`Reset ke ${selected.dosePerKg} mg/kg`}
                  >
                    ↺ {selected.dosePerKg}
                  </button>
                )}
              </div>
              <input
                id="preset-dose"
                className={`input${dosePerKg !== String(selected.dosePerKg) ? ' input--overridden' : ''}`}
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
        </div>
      )}
    </div>
  )
}
