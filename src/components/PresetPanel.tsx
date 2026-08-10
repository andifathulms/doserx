import { useState, useRef } from 'react'
import { DrugGrid } from './DrugGrid'
import { ResultCard } from './ResultCard'
import { WeightInput } from './WeightInput'
import { DrugPreset } from '../data/drugs'
import { CustomDrugPreset, deleteCustomDrug, DoseMode, loadDoseMode, saveDoseMode } from '../lib/storage'
import { calculate, CalcResult } from '../lib/calculate'

interface PresetPanelProps {
  onHistoryUpdated: () => void
  customDrugs: CustomDrugPreset[]
  onCustomDrugDeleted: () => void
}

const r2 = (n: number) => Math.round(n * 100) / 100

// The catalog stores mg/kg/DAY. These helpers translate to/from the doctor's
// chosen entry mode so the field always shows the value in that mode.
function dayToMode(perDay: number | undefined, freq: number, mode: DoseMode): number | undefined {
  if (perDay == null) return undefined
  return mode === 'perDose' ? r2(perDay / freq) : perDay
}
function modeToDay(value: number, freq: number, mode: DoseMode): number {
  return mode === 'perDose' ? value * freq : value
}

export function PresetPanel({ onHistoryUpdated, customDrugs, onCustomDrugDeleted }: PresetPanelProps) {
  const [selected, setSelected] = useState<DrugPreset | null>(null)
  const [gridOpen, setGridOpen] = useState(true)
  const [weight, setWeight] = useState('')
  const [doseMode, setDoseMode] = useState<DoseMode>(() => loadDoseMode())
  const [dose, setDose] = useState('') // value in the current doseMode
  const [freq, setFreq] = useState('')
  const [concentration, setConcentration] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [resultMin, setResultMin] = useState<CalcResult | null>(null)
  const [resultMax, setResultMax] = useState<CalcResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)

  const doseUnit = doseMode === 'perDose' ? 'mg/kg/kali' : 'mg/kg/hari'

  // Default + range for the CURRENTLY selected drug, expressed in the active mode.
  const defaultDose = selected ? dayToMode(selected.dosePerKg, selected.freq, doseMode)! : null
  const rangeMin = selected ? dayToMode(selected.dosePerKgMin, selected.freq, doseMode) : undefined
  const rangeMax = selected ? dayToMode(selected.dosePerKgMax, selected.freq, doseMode) : undefined

  function clearResults() {
    setResult(null)
    setResultMin(null)
    setResultMax(null)
  }

  function handleSelect(drug: DrugPreset) {
    setSelected(drug)
    setGridOpen(false)
    setDose(String(dayToMode(drug.dosePerKg, drug.freq, doseMode)))
    setFreq(String(drug.freq))
    setConcentration(drug.concentration != null ? String(drug.concentration) : '')
    clearResults()
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
    clearResults()
    setError(null)
  }

  function handleToggleMode(mode: DoseMode) {
    if (mode === doseMode) return
    const freqNum = parseFloat(freq)
    const doseNum = parseFloat(dose)
    // Convert the current value so the actual regimen stays identical.
    if (isFinite(doseNum) && isFinite(freqNum) && freqNum > 0) {
      const perDay = modeToDay(doseNum, freqNum, doseMode)
      setDose(String(dayToMode(perDay, freqNum, mode)))
    } else if (selected) {
      setDose(String(dayToMode(selected.dosePerKg, selected.freq, mode)))
    }
    setDoseMode(mode)
    saveDoseMode(mode)
    clearResults()
  }

  function handleCalculate() {
    if (!selected) return

    const freqNum = parseFloat(freq)
    const doseNum = parseFloat(dose)
    const base = {
      weight: parseFloat(weight),
      freq: freqNum,
      maxDay: selected.maxDay,
      maxSingle: selected.maxSingle,
      concentration: concentration ? parseFloat(concentration) : undefined,
    }

    const out = calculate({ ...base, dosePerKg: modeToDay(doseNum, freqNum, doseMode) })

    if (!out.valid) {
      setError(out.error)
      clearResults()
      return
    }

    setError(null)
    setResult(out)

    // Show the min/max range only when the dose is still at its preset default.
    const usingDefault = defaultDose != null && doseNum === defaultDose
    if (usingDefault && rangeMin != null && rangeMax != null) {
      const outMin = calculate({ ...base, dosePerKg: modeToDay(rangeMin, freqNum, doseMode) })
      const outMax = calculate({ ...base, dosePerKg: modeToDay(rangeMax, freqNum, doseMode) })
      setResultMin(outMin.valid ? outMin : null)
      setResultMax(outMax.valid ? outMax : null)
    } else {
      setResultMin(null)
      setResultMax(null)
    }
  }

  const doseOverridden = defaultDose != null && dose !== String(defaultDose)

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
                      <span className="drug-card__route">{drug.dosePerKg} mg/kg/hari · {drug.freq}×</span>
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
          {/* The "pilih obat" instruction now leads the grid (see DrugGrid's
              lede) instead of trailing ~90 cards where nobody scrolled to it. */}
          <DrugGrid selected={selected?.id ?? null} onSelect={handleSelect} />
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
            {rangeMin != null && rangeMax != null && (
              <span className="drug-note__range">
                Range: {rangeMin}–{rangeMax} {doseUnit} ·{' '}
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

          {/* Dose entry mode — how the doctor thinks about the dose */}
          <div className="dose-mode">
            <span className="dose-mode__label">Cara hitung dosis</span>
            <div className="dose-mode__toggle" role="radiogroup" aria-label="Cara hitung dosis">
              <button
                role="radio"
                aria-checked={doseMode === 'perDose'}
                className={`dose-mode__btn${doseMode === 'perDose' ? ' dose-mode__btn--active' : ''}`}
                onClick={() => handleToggleMode('perDose')}
              >
                Per kali
              </button>
              <button
                role="radio"
                aria-checked={doseMode === 'perDay'}
                className={`dose-mode__btn${doseMode === 'perDay' ? ' dose-mode__btn--active' : ''}`}
                onClick={() => handleToggleMode('perDay')}
              >
                Per hari
              </button>
            </div>
          </div>

          <div className="form">
            <WeightInput
              id="preset-weight"
              value={weight}
              onChange={(v) => { setWeight(v); clearResults() }}
              autoFocus
            />
            <div className="field">
              <div className="label-row">
                <label className="label" htmlFor="preset-dose">
                  Dosis ({doseUnit})
                  {rangeMin != null && rangeMax != null && (
                    <span className="label--range"> [{rangeMin}–{rangeMax}]</span>
                  )}
                </label>
                {doseOverridden && defaultDose != null && (
                  <button
                    className="reset-btn"
                    onClick={() => { setDose(String(defaultDose)); clearResults() }}
                    title={`Reset ke ${defaultDose} ${doseUnit}`}
                  >
                    ↺ {defaultDose}
                  </button>
                )}
              </div>
              <input
                id="preset-dose"
                className={`input${doseOverridden ? ' input--overridden' : ''}`}
                type="number"
                min="0"
                step="0.01"
                value={dose}
                onChange={(e) => { setDose(e.target.value); clearResults() }}
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
                onChange={(e) => { setFreq(e.target.value); clearResults() }}
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
                onChange={(e) => { setConcentration(e.target.value); clearResults() }}
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
              dosePerKg={modeToDay(parseFloat(dose), parseFloat(freq), doseMode)}
              freq={parseFloat(freq)}
              freqMax={selected.freqMax}
              concentration={concentration ? parseFloat(concentration) : undefined}
              availableForms={selected.availableForms}
              source={selected.source}
              onSaved={onHistoryUpdated}
            />
          )}

          <DrugMonograph drug={selected} />
        </div>
      )}
    </div>
  )
}

// ── Detail Obat — collapsible monograph (calm alternative to a flat dump) ──────
function DrugMonograph({ drug }: { drug: DrugPreset }) {
  const doseRange =
    drug.dosePerKgMin != null && drug.dosePerKgMax != null
      ? `${drug.dosePerKgMin}–${drug.dosePerKgMax} mg/kg/hari`
      : `${drug.dosePerKg} mg/kg/hari`
  const maxParts: string[] = []
  if (drug.maxSingle != null) maxParts.push(`${drug.maxSingle} mg/kali`)
  if (drug.maxDay != null) maxParts.push(`${drug.maxDay} mg/hari`)

  const rows: Array<[string, string | undefined]> = [
    ['Golongan', drug.category],
    ['Indikasi', drug.indications?.length ? drug.indications.join(', ') : undefined],
    ['Dosis', doseRange],
    ['Dosis maksimum', maxParts.length ? maxParts.join(' · ') : undefined],
    ['Efek samping', drug.sideEffects],
    ['Kontraindikasi', drug.contraindication],
    ['Keterangan', drug.note],
    ['Sumber', drug.source],
  ]

  return (
    <details className="monograph">
      <summary className="monograph__summary">Detail Obat</summary>
      <div className="monograph__body">
        {drug.availableForms?.length ? (
          <div className="monograph__row">
            <span className="monograph__key">Sediaan</span>
            <span className="monograph__val">
              {drug.availableForms
                .map((f) => {
                  const name = f.label ?? `${f.strength} mg`
                  return f.packSize ? `${name} (${f.packSize})` : name
                })
                .join(' · ')}
            </span>
          </div>
        ) : null}
        {rows.map(([k, v]) =>
          v ? (
            <div key={k} className="monograph__row">
              <span className="monograph__key">{k}</span>
              <span className="monograph__val">{v}</span>
            </div>
          ) : null,
        )}
      </div>
    </details>
  )
}
