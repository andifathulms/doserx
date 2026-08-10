import { useState, useRef } from 'react'
import { DrugGrid } from './DrugGrid'
import { ResultCard } from './ResultCard'
import { WeightInput } from './WeightInput'
import { DrugPreset } from '../data/drugs'
import { CustomDrugPreset, deleteCustomDrug, DoseMode, loadDoseMode, saveDoseMode } from '../lib/storage'
import { calculate, CalcResult } from '../lib/calculate'
import { errorCopy } from '../lib/errorCopy'
import { announceResult } from '../lib/announce'
import { scrollBehavior } from '../lib/motion'

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
  // True only when the grid is reopened by "Ganti obat" — the initial page
  // load must NOT steal focus into search.
  const [returningToGrid, setReturningToGrid] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)
  const customListRef = useRef<HTMLDivElement>(null)

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
    setReturningToGrid(false)
    setDose(String(dayToMode(drug.dosePerKg, drug.freq, doseMode)))
    setFreq(String(drug.freq))
    setConcentration(drug.concentration != null ? String(drug.concentration) : '')
    clearResults()
    setError(null)
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' })
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

  // Reopening the grid unmounts the button that was focused. Send focus to
  // the search field rather than dropping it on <body>.
  function handleChangeDrug() {
    setGridOpen(true)
    setSelected(null)
    setReturningToGrid(true)
    clearResults()
    setError(null)
  }

  // Same for deleting a custom preset: focus the next one, or fall back to
  // the grid's search field when the section empties.
  function handleDeleteCustom(id: string) {
    deleteCustomDrug(id)
    onCustomDrugDeleted()
    requestAnimationFrame(() => {
      const remaining = customListRef.current?.querySelectorAll<HTMLButtonElement>(
        '.custom-drug-card__delete',
      )
      if (remaining && remaining.length > 0) {
        remaining[remaining.length - 1].focus()
        return
      }
      document.querySelector<HTMLInputElement>('.drug-search-input')?.focus()
    })
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
      setError(errorCopy(out.error))
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
              <div className="drug-grid custom-drugs-grid" ref={customListRef}>
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
                      onClick={() => handleDeleteCustom(drug.id)}
                      aria-label={`Hapus preset ${drug.name}`}
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
          <DrugGrid
            selected={selected?.id ?? null}
            onSelect={handleSelect}
            autoFocusSearch={returningToGrid}
          />
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
            {/* Real radios: the browser supplies arrow-key selection, the
                grouping (shared name) and the checked state for free. The
                previous role="radio" buttons promised all three and delivered
                none of them. */}
            <div className="dose-mode__toggle">
              <input
                type="radio"
                id="preset-mode-perdose"
                name="preset-dose-mode"
                className="sr-only dose-mode__input"
                checked={doseMode === 'perDose'}
                onChange={() => handleToggleMode('perDose')}
              />
              <label className="dose-mode__btn" htmlFor="preset-mode-perdose">Per kali</label>
              <input
                type="radio"
                id="preset-mode-perday"
                name="preset-dose-mode"
                className="sr-only dose-mode__input"
                checked={doseMode === 'perDay'}
                onChange={() => handleToggleMode('perDay')}
              />
              <label className="dose-mode__btn" htmlFor="preset-mode-perday">Per hari</label>
            </div>
            {/* The convention was only explained after a result, inside a
                collapsed panel. The ambiguity bites HERE, at the toggle, on
                the one number the user might override. */}
            <p className="dose-mode__hint">
              Katalog menyimpan dosis sebagai <strong>mg/kg/hari</strong> (total sehari).
              Mode “Per kali” hanya mengubah cara angka ditampilkan — dibagi frekuensi —
              bukan besar dosisnya.
            </p>
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
                    aria-label={`Reset dosis ke ${defaultDose} ${doseUnit}`}
                  >
                    <span aria-hidden="true">↺ {defaultDose}</span>
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
              {/* "But what if I dosed at the top of the range?" used to require
                  retyping the number by hand — the manual arithmetic this app
                  exists to remove. Now it is one tap, and moving between the
                  three teaches what the range means better than a sentence. */}
              {rangeMin != null && rangeMax != null && defaultDose != null && (
                <div className="dose-picker">
                  <span className="dose-picker__label">Coba:</span>
                  {([
                    ['Minimum', rangeMin],
                    ['Tipikal', defaultDose],
                    ['Maksimum', rangeMax],
                  ] as const).map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      className={`dose-picker__btn${
                        dose === String(value) ? ' dose-picker__btn--active' : ''
                      }`}
                      aria-pressed={dose === String(value)}
                      onClick={() => { setDose(String(value)); clearResults() }}
                    >
                      {label} <span className="dose-picker__num">{value}</span>
                    </button>
                  ))}
                </div>
              )}
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
                placeholder="misal 24 — sirup 120mg/5mL = 24 mg/mL"
                value={concentration}
                onChange={(e) => { setConcentration(e.target.value); clearResults() }}
                aria-describedby="preset-conc-hint"
              />
              <p className="field__hint" id="preset-conc-hint">
                Diisi untuk mendapat volume dalam mL. Ambil dari label sediaan yang Anda pakai —
                katalog tidak menyimpannya karena berbeda antar merek.
              </p>
            </div>
          </div>

          {/* role="alert" has no native equivalent: a validation failure must
              be announced without moving focus off the field being fixed. */}
          {error && <p className="error" role="alert">{error}</p>}

          <button className="btn btn--primary" onClick={handleCalculate}>
            Hitung
          </button>

          {/* Mounted with the form, before any result exists, so the
              announcement fires on text change rather than on insertion. */}
          <p className="sr-only" role="status">
            {result ? announceResult(selected.name, result, parseFloat(freq)) : ''}
          </p>

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
