import { useMemo, useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { InfusionPreset, isWeightFreeUnit } from '../data/infusionDrugs'
import { LIVE_INFUSIONS } from '../data/catalog'
import { calculateInfusion, InfusionResult } from '../lib/calculateInfusion'
import { WeightPrompt } from './WeightPrompt'
import { usePatient } from '../lib/patient'
import { useSettled } from '../lib/announce'
import { AnswerPanel } from './AnswerPanel'
import { isInvalidPositiveNumber } from '../lib/validateNumber'

function InfusionResultCard({
  result,
  drug,
  weight,
  hideName = false,
}: {
  result: InfusionResult
  drug: InfusionPreset
  weight: string
  hideName?: boolean
}) {
  const [copied, setCopied] = useState(false)

  function buildText(): string {
    const lines = [
      `Infus ${drug.name} — ${weight} kg`,
      `Dosis total: ${parseFloat(weight) > 0 ? result.totalDose : '?'} ${result.totalDoseUnit}`,
      `Kecepatan: ${result.ratePerHr} mL/jam`,
      `Tetesan: ${result.dropsMacro} tpm (makro) / ${result.dropsMicro} tpm (mikro)`,
      '— DoseRx',
    ]
    return lines.join('\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildText())
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="result-card infusion-result">
      <div className="result-card__header">
        <span className={`result-card__drug${hideName ? ' result-card__drug--quiet' : ''}`}>
          {hideName ? 'Hasil' : drug.name}
        </span>
        {weight && <span className="result-card__weight">{weight} kg</span>}
      </div>

      {/* Drops per minute are a primary answer, not a footnote: many wards
          run infusions on a gravity set, not a pump. */}
      <AnswerPanel
        label={`Hasil infus ${drug.name}`}
        primary={{ label: 'Kecepatan', value: result.ratePerHr, unit: 'mL/jam' }}
        secondary={{ label: 'Makro · 20 gtt/mL', value: result.dropsMacro, unit: 'tpm' }}
        facts={[`Mikro ${result.dropsMicro} tpm`, `Total ${result.totalDose} ${result.totalDoseUnit}`]}
        steps={result.steps}
      />

      <div className="infusion-result__dose-summary">
        Total dosis: <strong>{result.totalDose} {result.totalDoseUnit}</strong>
      </div>

      {/* This mode hides the app's most dangerous arithmetic — mg↔mcg (×1000)
          and jam↔menit (÷60) — behind a single mL/jam figure. Every
          conversion gets a line of its own. */}
      <details className="derivation">
        <summary className="derivation__summary">Cara hitung</summary>
        <div className="derivation__body">
          <p className="derivation__basis">
            Dihitung dari <strong>{drug.doseUnit}</strong>, dinormalkan ke satuan per menit,
            lalu dibagi konsentrasi stok.
          </p>
          <ol className="derivation__steps">
            {result.steps.map((step, i) => (
              <li key={i} className="derivation__step">
                <span className="derivation__expr">{step.expression}</span>
                <span className="derivation__eq" aria-hidden="true">=</span>
                <span className="derivation__result">{step.result}</span>
              </li>
            ))}
          </ol>
          <p className="derivation__note">
            Tetes per menit memakai faktor set infus: <strong>20 tetes/mL</strong> untuk makro
            dan <strong>60 tetes/mL</strong> untuk mikro. Set yang Anda pakai bisa berbeda —
            periksa kemasannya, karena angka tpm ikut berubah.
          </p>
        </div>
      </details>

      <div className="result-card__actions">
        <button className="btn btn--ghost btn--sm" onClick={handleCopy}>
          {copied ? <><CheckIcon width="1em" height="1em" aria-hidden="true" /> Disalin</> : 'Salin'}
        </button>
      </div>
    </div>
  )
}

export function InfusionPanel() {
  const [selected, setSelected] = useState<InfusionPreset | null>(null)

  return (
    <div className="panel">
      <div className="infusion-drug-grid">
        {LIVE_INFUSIONS.map((drug) => (
          <button
            key={drug.id}
            className={`infusion-drug-btn${selected?.id === drug.id ? ' infusion-drug-btn--selected' : ''}`}
            onClick={() => setSelected(drug)}
            aria-pressed={selected?.id === drug.id}
          >
            <span className="infusion-drug-btn__name">{drug.name}</span>
            <span className="infusion-drug-btn__unit">{drug.doseUnit}</span>
          </button>
        ))}
      </div>

      {selected && <InfusionCalculator key={selected.id} drug={selected} />}
    </div>
  )
}

/**
 * The drip calculator for one infusion preset — used by the drip list above
 * and by a drug page's Infus route. Keyed by drug id at every call site, so
 * switching drugs remounts it with that drug's defaults.
 */
export function InfusionCalculator({ drug, onDrugPage = false }: { drug: InfusionPreset; onDrugPage?: boolean }) {
  const { weightKg } = usePatient()
  const [dose, setDose] = useState(String(drug.doseDefault))
  const [stockConc, setStockConc] = useState(String(drug.stockConcentration))
  const [diluentVol, setDiluentVol] = useState(String(drug.diluentVolumeDefault))

  // Live, like every other calculator — no "Hitung" step.
  // Whole-patient units (mcg/mnt, mg/jam) need no weight.
  const weightFree = isWeightFreeUnit(drug.doseUnit)
  const outcome = useMemo(() => {
    if (weightKg == null && !weightFree) return null
    return calculateInfusion({
      weight: weightKg ?? NaN,
      dose: parseFloat(dose),
      doseUnit: drug.doseUnit,
      stockConcentration: parseFloat(stockConc),
      stockUnit: drug.stockUnit,
      diluentVolume: parseFloat(diluentVol),
    })
  }, [drug, weightFree, weightKg, dose, stockConc, diluentVol])
  const result: InfusionResult | null = outcome && outcome.valid ? outcome : null
  const error = outcome && !outcome.valid ? outcome.error : null
  const announcement = useSettled(
    result
      ? `${drug.name}: ${result.ratePerHr} mililiter per jam, ` +
          `${result.dropsMacro} tetes per menit makro, ` +
          `${result.dropsMicro} tetes per menit mikro.`
      : '',
  )

  return (
    <>
      {/* The answer first: the dose is what gets titrated, so the fields sit
          directly under the rate they change. */}
      {weightKg == null && !weightFree && <WeightPrompt what="kecepatan infus" />}

      {/* role="alert" has no native equivalent: a validation failure must
          be announced without moving focus off the field being fixed. */}
      {error && <p className="error" role="alert">{error}</p>}

      <p className="sr-only" role="status">{announcement}</p>

      {result && (weightKg != null || weightFree) && (
        <InfusionResultCard
          result={result}
          drug={drug}
          weight={weightKg != null && !weightFree ? String(weightKg) : ''}
          hideName={onDrugPage}
        />
      )}
      <h3 className="adjust__title">Atur dosis &amp; pengenceran</h3>
      <div className="drug-note">{drug.note}</div>

      <div className="form">
        <div className="field">
          <label className="label" htmlFor="infusion-dose">
            Dosis ({drug.doseUnit})
            <span className="label--range"> [{drug.doseMin}–{drug.doseMax}]</span>
          </label>
          <input
            id="infusion-dose"
            className={`input${isInvalidPositiveNumber(dose) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="0.01"
            value={dose}
            aria-invalid={isInvalidPositiveNumber(dose)}
            onChange={(e) => { setDose(e.target.value) }}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="infusion-conc">
            Konsentrasi stok ({drug.stockUnit})
          </label>
          <input
            id="infusion-conc"
            className={`input${isInvalidPositiveNumber(stockConc) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="0.1"
            value={stockConc}
            aria-invalid={isInvalidPositiveNumber(stockConc)}
            onChange={(e) => { setStockConc(e.target.value) }}
            aria-describedby="infusion-conc-hint"
          />
          {/* The preset number describes one specific bag. Saying which
              one is the difference between a default and an assumption. */}
          <p className="field__hint" id="infusion-conc-hint">
            Nilai awal mengasumsikan <strong>{drug.dilution}</strong>. Kalau
            pengenceran Anda berbeda, ubah angka ini — seluruh hasil ikut berubah.
          </p>
        </div>

        <div className="field">
          <label className="label" htmlFor="infusion-vol">Volume pelarut (mL)</label>
          <input
            id="infusion-vol"
            className={`input${isInvalidPositiveNumber(diluentVol) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="1"
            value={diluentVol}
            aria-invalid={isInvalidPositiveNumber(diluentVol)}
            onChange={(e) => { setDiluentVol(e.target.value) }}
          />
        </div>
      </div>

    </>
  )
}
