import { useState } from 'react'
import { INFUSION_PRESETS, InfusionPreset } from '../data/infusionDrugs'
import { calculateInfusion, InfusionResult } from '../lib/calculateInfusion'
import { WeightInput } from './WeightInput'

function InfusionResultCard({ result, drug, weight }: { result: InfusionResult; drug: InfusionPreset; weight: string }) {
  const [copied, setCopied] = useState(false)

  function buildText(): string {
    const lines = [
      `Infus ${drug.name} — ${weight} kg`,
      `Dosis: ${parseFloat(weight) > 0 ? result.dosePerHr : '?'} ${result.dosePerHrUnit}`,
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
        <span className="result-card__drug">{drug.name}</span>
        <span className="result-card__weight">{weight} kg</span>
      </div>

      <div className="result-card__values">
        <div className="result-value result-value--highlight">
          <span className="result-value__label">Kecepatan</span>
          <span className="result-value__num">{result.ratePerHr}</span>
          <span className="result-value__unit">mL/jam</span>
        </div>
        <div className="result-value">
          <span className="result-value__label">Makro (20 gtt/mL)</span>
          <span className="result-value__num">{result.dropsMacro}</span>
          <span className="result-value__unit">tpm</span>
        </div>
        <div className="result-value">
          <span className="result-value__label">Mikro (60 gtt/mL)</span>
          <span className="result-value__num">{result.dropsMicro}</span>
          <span className="result-value__unit">tpm</span>
        </div>
      </div>

      <div className="infusion-result__dose-summary">
        Total dosis: <strong>{result.dosePerHr} {result.dosePerHrUnit}</strong>
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
          {copied ? '✓ Disalin' : 'Salin'}
        </button>
      </div>
    </div>
  )
}

export function InfusionPanel() {
  const [selected, setSelected] = useState<InfusionPreset | null>(null)
  const [weight, setWeight] = useState('')
  const [dose, setDose] = useState('')
  const [stockConc, setStockConc] = useState('')
  const [diluentVol, setDiluentVol] = useState('')
  const [result, setResult] = useState<InfusionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSelect(drug: InfusionPreset) {
    setSelected(drug)
    setDose(String(drug.doseDefault))
    setStockConc(String(drug.stockConcentration))
    setDiluentVol(String(drug.diluentVolumeDefault))
    setResult(null)
    setError(null)
  }

  function handleCalculate() {
    if (!selected) return
    const out = calculateInfusion({
      weight: parseFloat(weight),
      dose: parseFloat(dose),
      doseUnit: selected.doseUnit,
      stockConcentration: parseFloat(stockConc),
      stockUnit: selected.stockUnit,
      diluentVolume: parseFloat(diluentVol),
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
      {/* Mode description now lives on the tab control (see App.tsx TABS). */}
      {/* Drug selector */}
      <div className="infusion-drug-grid">
        {INFUSION_PRESETS.map((drug) => (
          <button
            key={drug.id}
            className={`infusion-drug-btn${selected?.id === drug.id ? ' infusion-drug-btn--selected' : ''}`}
            onClick={() => handleSelect(drug)}
          >
            <span className="infusion-drug-btn__name">{drug.name}</span>
            <span className="infusion-drug-btn__unit">{drug.doseUnit}</span>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="drug-note">{selected.note}</div>

          <div className="form">
            <WeightInput
              id="infusion-weight"
              value={weight}
              onChange={(v) => { setWeight(v); setResult(null) }}
              autoFocus
            />

            <div className="field">
              <label className="label" htmlFor="infusion-dose">
                Dosis ({selected.doseUnit})
                <span className="label--range"> [{selected.doseMin}–{selected.doseMax}]</span>
              </label>
              <input
                id="infusion-dose"
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={dose}
                onChange={(e) => { setDose(e.target.value); setResult(null) }}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="infusion-conc">
                Konsentrasi stok ({selected.stockUnit})
              </label>
              <input
                id="infusion-conc"
                className="input"
                type="number"
                min="0"
                step="0.1"
                value={stockConc}
                onChange={(e) => { setStockConc(e.target.value); setResult(null) }}
                aria-describedby="infusion-conc-hint"
              />
              {/* The preset number describes one specific bag. Saying which
                  one is the difference between a default and an assumption. */}
              <p className="field__hint" id="infusion-conc-hint">
                Nilai awal mengasumsikan <strong>{selected.dilution}</strong>. Kalau
                pengenceran Anda berbeda, ubah angka ini — seluruh hasil ikut berubah.
              </p>
            </div>

            <div className="field">
              <label className="label" htmlFor="infusion-vol">Volume pelarut (mL)</label>
              <input
                id="infusion-vol"
                className="input"
                type="number"
                min="0"
                step="1"
                value={diluentVol}
                onChange={(e) => { setDiluentVol(e.target.value); setResult(null) }}
              />
            </div>
          </div>

          {/* role="alert" has no native equivalent: a validation failure must
              be announced without moving focus off the field being fixed. */}
          {error && <p className="error" role="alert">{error}</p>}

          <button className="btn btn--primary" onClick={handleCalculate}>
            Hitung Kecepatan Infus
          </button>

          {/* Mounted before any result exists, so the announcement fires on
              text change rather than on insertion. */}
          <p className="sr-only" role="status">
            {result
              ? `${selected.name}: ${result.ratePerHr} mililiter per jam, ` +
                `${result.dropsMacro} tetes per menit makro, ` +
                `${result.dropsMicro} tetes per menit mikro.`
              : ''}
          </p>

          {result && (
            <InfusionResultCard result={result} drug={selected} weight={weight} />
          )}
        </>
      )}
    </div>
  )
}
