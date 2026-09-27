import { useEffect, useMemo, useState } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { ResultCard } from './ResultCard'
import { WeightPrompt } from './WeightPrompt'
import { DrugPreset } from '../data/drugs'
import { DoseMode, loadDoseMode, saveDoseMode } from '../lib/storage'
import { calculate, CalcResult } from '../lib/calculate'
import { errorCopy } from '../lib/errorCopy'
import { announceResult, useSettled } from '../lib/announce'
import { usePatient } from '../lib/patient'
import { isInvalidPositiveNumber } from '../lib/validateNumber'
import { groupOf } from '../data/categories'

/**
 * Everything that happens once a drug is chosen: the clinical note, the dose
 * entry mode, the form, the result, and the monograph.
 *
 * Extracted from PresetPanel so /obat/:id can offer the SAME calculator rather
 * than a second implementation of it. Two copies of dose arithmetic UI is
 * exactly how a per-kali/per-hari bug gets fixed in one place and not the
 * other. The panel now owns drug selection; this owns calculation.
 *
 * `idPrefix` keeps input ids and radio group names unique when more than one
 * instance could exist on a page.
 */

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

interface DrugCalculatorProps {
  drug: DrugPreset
  onHistoryUpdated: () => void
  idPrefix?: string
}

export function DrugCalculator({
  drug,
  onHistoryUpdated,
  idPrefix = 'calc',
}: DrugCalculatorProps) {
  // Deterministic first render — the stored preference is applied on mount, so
  // prerendered HTML and the first client render agree. See App for why.
  const [doseMode, setDoseMode] = useState<DoseMode>('perDose')
  const [dose, setDose] = useState(() => String(dayToMode(drug.dosePerKg, drug.freq, 'perDose')))
  const [freq, setFreq] = useState(() => String(drug.freq))
  const [concentration, setConcentration] = useState(
    drug.concentration != null ? String(drug.concentration) : '',
  )
  const { weightKg } = usePatient()

  const doseUnit = doseMode === 'perDose' ? 'mg/kg/kali' : 'mg/kg/hari'
  const defaultDose = dayToMode(drug.dosePerKg, drug.freq, doseMode)!
  const rangeMin = dayToMode(drug.dosePerKgMin, drug.freq, doseMode)
  const rangeMax = dayToMode(drug.dosePerKgMax, drug.freq, doseMode)

  // Apply the saved dose-entry preference once we are on the client. Reuses the
  // same conversion path as the toggle, so the regimen never changes — only how
  // it is displayed.
  useEffect(() => {
    const stored = loadDoseMode()
    if (stored !== 'perDose') handleToggleMode(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-seed when the drug changes underneath us (grid selection, or navigating
  // between two /obat/:id pages without unmounting).
  useEffect(() => {
    setDose(String(dayToMode(drug.dosePerKg, drug.freq, doseMode)))
    setFreq(String(drug.freq))
    setConcentration(drug.concentration != null ? String(drug.concentration) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drug.id])


  function handleToggleMode(mode: DoseMode) {
    if (mode === doseMode) return
    const freqNum = parseFloat(freq)
    const doseNum = parseFloat(dose)
    // Convert the current value so the actual regimen stays identical.
    if (isFinite(doseNum) && isFinite(freqNum) && freqNum > 0) {
      const perDay = modeToDay(doseNum, freqNum, doseMode)
      setDose(String(dayToMode(perDay, freqNum, mode)))
    } else {
      setDose(String(dayToMode(drug.dosePerKg, drug.freq, mode)))
    }
    setDoseMode(mode)
    saveDoseMode(mode)
  }

  // Live: every input change recomputes. The engine is pure and instant, so
  // a "Hitung" button only added a step between the weight and the answer.
  const freqNum = parseFloat(freq)
  const doseNum = parseFloat(dose)
  const concNum = concentration ? parseFloat(concentration) : undefined
  const computed = useMemo(() => {
    if (weightKg == null) return null
    const base = {
      weight: weightKg,
      freq: freqNum,
      maxDay: drug.maxDay,
      maxSingle: drug.maxSingle,
      concentration: concNum,
    }
    const out = calculate({ ...base, dosePerKg: modeToDay(doseNum, freqNum, doseMode) })
    if (!out.valid) return { error: errorCopy(out.error) }

    // Show the min/max range only when the dose is still at its preset default.
    let resultMin: CalcResult | undefined
    let resultMax: CalcResult | undefined
    if (doseNum === defaultDose && rangeMin != null && rangeMax != null) {
      const outMin = calculate({ ...base, dosePerKg: modeToDay(rangeMin, freqNum, doseMode) })
      const outMax = calculate({ ...base, dosePerKg: modeToDay(rangeMax, freqNum, doseMode) })
      if (outMin.valid && outMax.valid) {
        resultMin = outMin
        resultMax = outMax
      }
    }
    return { result: out, resultMin, resultMax }
  }, [weightKg, freqNum, doseNum, concNum, doseMode, drug, defaultDose, rangeMin, rangeMax])

  const result = computed && 'result' in computed ? computed.result : null
  const error = computed && 'error' in computed ? computed.error : null
  const announcement = useSettled(result ? announceResult(drug.name, result, freqNum) : '')

  const doseOverridden = dose !== String(defaultDose)

  return (
    <>
      <div className="drug-note">
        {rangeMin != null && rangeMax != null && (
          <span className="drug-note__range">
            Range: {rangeMin}–{rangeMax} {doseUnit} ·{' '}
          </span>
        )}
        {drug.note}
        {drug.warning && (
          <p className="drug-note__warning">
            <ExclamationTriangleIcon width="1em" height="1em" aria-hidden="true" /> {drug.warning}
          </p>
        )}
        {drug.contraindication && (
          <p className="drug-note__contra">⛔ Kontraindikasi: {drug.contraindication}</p>
        )}
        {(drug.minAgeMonths || drug.minWeightKg || drug.source) && (
          <p className="drug-note__meta">
            {drug.minAgeMonths != null && (
              <span>
                Min usia:{' '}
                {drug.minAgeMonths < 12 ? `${drug.minAgeMonths} bln` : `${drug.minAgeMonths / 12} th`} ·{' '}
              </span>
            )}
            {drug.minWeightKg != null && <span>Min BB: {drug.minWeightKg} kg · </span>}
            {drug.source && <span>Sumber: {drug.source}</span>}
          </p>
        )}
      </div>

      {/* Dose entry mode — how the doctor thinks about the dose */}
      <div className="dose-mode">
        <span className="dose-mode__label">Cara hitung dosis</span>
        {/* Real radios: the browser supplies arrow-key selection, the grouping
            (shared name) and the checked state for free. */}
        <div className="dose-mode__toggle">
          <input
            type="radio"
            id={`${idPrefix}-mode-perdose`}
            name={`${idPrefix}-dose-mode`}
            className="sr-only dose-mode__input"
            checked={doseMode === 'perDose'}
            onChange={() => handleToggleMode('perDose')}
          />
          <label className="dose-mode__btn" htmlFor={`${idPrefix}-mode-perdose`}>Per kali</label>
          <input
            type="radio"
            id={`${idPrefix}-mode-perday`}
            name={`${idPrefix}-dose-mode`}
            className="sr-only dose-mode__input"
            checked={doseMode === 'perDay'}
            onChange={() => handleToggleMode('perDay')}
          />
          <label className="dose-mode__btn" htmlFor={`${idPrefix}-mode-perday`}>Per hari</label>
        </div>
        {/* The ambiguity bites HERE, at the toggle, on the one number the user
            might override — not after a result, inside a collapsed panel. */}
        <p className="dose-mode__hint">
          Katalog menyimpan dosis sebagai <strong>mg/kg/hari</strong> (total sehari).
          Mode “Per kali” hanya mengubah cara angka ditampilkan — dibagi frekuensi —
          bukan besar dosisnya.
        </p>
      </div>

      <div className="form">
        <div className="field">
          <div className="label-row">
            <label className="label" htmlFor={`${idPrefix}-dose`}>
              Dosis ({doseUnit})
              {rangeMin != null && rangeMax != null && (
                <span className="label--range"> [{rangeMin}–{rangeMax}]</span>
              )}
            </label>
            {doseOverridden && (
              <button
                className="reset-btn"
                onClick={() => setDose(String(defaultDose))}
                aria-label={`Reset dosis ke ${defaultDose} ${doseUnit}`}
              >
                <span aria-hidden="true">↺ {defaultDose}</span>
              </button>
            )}
          </div>
          <input
            id={`${idPrefix}-dose`}
            className={`input${doseOverridden ? ' input--overridden' : ''}${isInvalidPositiveNumber(dose) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="0.01"
            value={dose}
            aria-invalid={isInvalidPositiveNumber(dose)}
            onChange={(e) => { setDose(e.target.value) }}
          />
          {/* Trying the top of the range used to mean retyping the number by
              hand — the manual arithmetic this app exists to remove. */}
          {rangeMin != null && rangeMax != null && (
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
                  className={`dose-picker__btn${dose === String(value) ? ' dose-picker__btn--active' : ''}`}
                  aria-pressed={dose === String(value)}
                  onClick={() => setDose(String(value))}
                >
                  {label} <span className="dose-picker__num">{value}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-freq`}>Frekuensi/hari</label>
          <input
            id={`${idPrefix}-freq`}
            className={`input${isInvalidPositiveNumber(freq) ? ' input--invalid' : ''}`}
            type="number"
            min="1"
            step="1"
            value={freq}
            aria-invalid={isInvalidPositiveNumber(freq)}
            onChange={(e) => { setFreq(e.target.value) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-conc`}>
            Konsentrasi stok (mg/mL) <span className="label--optional">opsional</span>
          </label>
          <input
            id={`${idPrefix}-conc`}
            className={`input${isInvalidPositiveNumber(concentration) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="0.1"
            placeholder="misal 24 — sirup 120mg/5mL = 24 mg/mL"
            value={concentration}
            aria-invalid={isInvalidPositiveNumber(concentration)}
            onChange={(e) => { setConcentration(e.target.value) }}
            aria-describedby={`${idPrefix}-conc-hint`}
          />
          <p className="field__hint" id={`${idPrefix}-conc-hint`}>
            Diisi untuk mendapat volume dalam mL. Ambil dari label sediaan yang Anda pakai —
            katalog tidak menyimpannya karena berbeda antar merek.
          </p>
        </div>
      </div>

      {weightKg == null && <WeightPrompt />}

      {/* role="alert" has no native equivalent: a validation failure must be
          announced without moving focus off the field being fixed. */}
      {error && <p className="error" role="alert">{error}</p>}

      <p className="sr-only" role="status">{announcement}</p>

      {result && weightKg != null && (
        <ResultCard
          result={result}
          resultMin={computed && 'result' in computed ? computed.resultMin : undefined}
          resultMax={computed && 'result' in computed ? computed.resultMax : undefined}
          dosePerKgMin={drug.dosePerKgMin}
          dosePerKgMax={drug.dosePerKgMax}
          drugName={drug.name}
          weight={weightKg}
          dosePerKg={modeToDay(doseNum, freqNum, doseMode)}
          freq={freqNum}
          freqMax={drug.freqMax}
          concentration={concNum}
          availableForms={drug.availableForms}
          source={drug.source}
          maxDailyCap={drug.maxDay}
          onSaved={onHistoryUpdated}
        />
      )}

      <DrugMonograph drug={drug} />
    </>
  )
}

// ── Detail Obat — collapsible monograph (calm alternative to a flat dump) ──────
export function DrugMonograph({ drug, open = false }: { drug: DrugPreset; open?: boolean }) {
  const doseRange =
    drug.dosePerKgMin != null && drug.dosePerKgMax != null
      ? `${drug.dosePerKgMin}–${drug.dosePerKgMax} mg/kg/hari`
      : `${drug.dosePerKg} mg/kg/hari`
  const maxParts: string[] = []
  if (drug.maxSingle != null) maxParts.push(`${drug.maxSingle} mg/kali`)
  if (drug.maxDay != null) maxParts.push(`${drug.maxDay} mg/hari`)

  const rows: Array<[string, string | undefined]> = [
    ['Golongan', groupOf(drug) === 'Anti-infeksi' || drug.category === 'Gawat Darurat' ? `${groupOf(drug)} · ${drug.category}` : groupOf(drug)],
    ['Indikasi', drug.indications?.length ? drug.indications.join(', ') : undefined],
    ['Dosis', doseRange],
    ['Dosis maksimum', maxParts.length ? maxParts.join(' · ') : undefined],
    ['Efek samping', drug.sideEffects],
    ['Kontraindikasi', drug.contraindication],
    ['Keterangan', drug.note],
    ['Sumber', drug.source],
  ]

  return (
    <details className="monograph" open={open}>
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
