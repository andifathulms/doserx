import { useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { Tabs } from './Tabs'
import { WeightInput } from './WeightInput'
import { calculateFluidRate, FluidRateResult } from '../lib/calculateFluidRate'
import { calculateDextrose, DextroseConcentration, DextroseResult } from '../lib/calculateDextrose'
import { isInvalidPositiveNumber } from '../lib/validateNumber'

const SUB_MODES = [
  { id: 'rumatan', label: 'Rumatan', hint: 'Kecepatan cairan rumatan (aturan 4-2-1) dan tetes per menit.' },
  { id: 'dekstrosa', label: 'Dekstrosa', hint: 'Dosis koreksi dekstrosa g/kg, dikonversi ke volume larutan.' },
]

const FLUID_TYPES = [
  { id: 'NaCl 0,9%', label: 'NaCl 0,9%', hint: 'Isotonik netral. Pilihan umum untuk rumatan dan resusitasi.' },
  {
    id: 'RL',
    label: 'RL (Ringer Laktat)',
    hint: 'Mengandung laktat, kalium, kalsium — hindari jalur sama dengan produk darah.',
  },
]

const RATE_MODES = [
  { id: 'auto', label: 'Otomatis (4-2-1)', hint: 'Dihitung dari berat badan memakai aturan Holliday-Segar.' },
  { id: 'manual', label: 'Manual mL/kg/jam', hint: 'Masukkan kecepatan sendiri, mis. sesuai instruksi khusus.' },
]

const DEXTROSE_CONCENTRATIONS: { id: DextroseConcentration; label: string; hint: string }[] = [
  { id: 'D5%', label: 'D5%', hint: 'Volume terbesar. Aman untuk jalur perifer.' },
  { id: 'D10%', label: 'D10%', hint: 'Konsentrasi standar koreksi hipoglikemia — bolus IV pelan.' },
  {
    id: 'D40%',
    label: 'D40%',
    hint: 'Hipertonik — encerkan dulu (mis. 1:4 dengan aqua/NaCl) sebelum bolus IV perifer pada anak.',
  },
]

function FluidRateResultCard({ result, fluidType }: { result: FluidRateResult; fluidType: string }) {
  const [copied, setCopied] = useState(false)

  function buildText(): string {
    return [
      `Rumatan ${fluidType}`,
      `Kecepatan: ${result.ratePerHr} mL/jam`,
      `Tetes: ${result.dropsMacro} tpm (makro) / ${result.dropsMicro} tpm (mikro) / ${result.dropsTransfusion} tpm (transfusi)`,
      '— DoseRx',
    ].join('\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="result-card">
      <div className="result-card__header">
        <span className="result-card__drug">{fluidType}</span>
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
        <div className="result-value">
          <span className="result-value__label">Transfusi (15 gtt/mL)</span>
          <span className="result-value__num">{result.dropsTransfusion}</span>
          <span className="result-value__unit">tpm</span>
        </div>
      </div>

      <details className="derivation">
        <summary className="derivation__summary">Cara hitung</summary>
        <div className="derivation__body">
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
            Faktor tetes tergantung set infus yang dipakai: <strong>20 tetes/mL</strong> (makro),
            <strong> 60 tetes/mL</strong> (mikro), <strong>15 tetes/mL</strong> (transfusi). Periksa
            kemasan set Anda — faktor transfusi bisa berbeda (10–20 tetes/mL tergantung produsen).
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

function DextroseResultCard({ result, concentration }: { result: DextroseResult; concentration: string }) {
  const [copied, setCopied] = useState(false)

  function buildText(): string {
    return [
      `Koreksi dekstrosa ${concentration}`,
      `Dosis: ${result.doseGram} g`,
      `Volume: ${result.volumeMl} mL`,
      '— DoseRx',
    ].join('\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="result-card">
      <div className="result-card__header">
        <span className="result-card__drug">{concentration}</span>
      </div>

      <div className="result-card__values">
        <div className="result-value result-value--highlight">
          <span className="result-value__label">Volume</span>
          <span className="result-value__num">{result.volumeMl}</span>
          <span className="result-value__unit">mL</span>
        </div>
        <div className="result-value">
          <span className="result-value__label">Dosis</span>
          <span className="result-value__num">{result.doseGram}</span>
          <span className="result-value__unit">g</span>
        </div>
      </div>

      <details className="derivation">
        <summary className="derivation__summary">Cara hitung</summary>
        <div className="derivation__body">
          <ol className="derivation__steps">
            {result.steps.map((step, i) => (
              <li key={i} className="derivation__step">
                <span className="derivation__expr">{step.expression}</span>
                <span className="derivation__eq" aria-hidden="true">=</span>
                <span className="derivation__result">{step.result}</span>
              </li>
            ))}
          </ol>
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

export function FluidPanel() {
  const [subMode, setSubMode] = useState<'rumatan' | 'dekstrosa'>('rumatan')
  const [weight, setWeight] = useState('')

  // Rumatan (maintenance) state
  const [fluidType, setFluidType] = useState(FLUID_TYPES[0].id)
  const [rateMode, setRateMode] = useState<'auto' | 'manual'>('auto')
  const [manualRate, setManualRate] = useState('')
  const [rateResult, setRateResult] = useState<FluidRateResult | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)

  // Dekstrosa state
  const [dextroseDose, setDextroseDose] = useState('0.2')
  const [concentration, setConcentration] = useState<DextroseConcentration>('D10%')
  const [dextroseResult, setDextroseResult] = useState<DextroseResult | null>(null)
  const [dextroseError, setDextroseError] = useState<string | null>(null)

  function handleCalculateRate() {
    const out = calculateFluidRate({
      weight: parseFloat(weight),
      manualRatePerKgHr: rateMode === 'manual' ? parseFloat(manualRate) : undefined,
    })
    if (!out.valid) {
      setRateError(out.error)
      setRateResult(null)
    } else {
      setRateError(null)
      setRateResult(out)
    }
  }

  function handleCalculateDextrose() {
    const out = calculateDextrose({
      weight: parseFloat(weight),
      dosePerKg: parseFloat(dextroseDose),
      concentration,
    })
    if (!out.valid) {
      setDextroseError(out.error)
      setDextroseResult(null)
    } else {
      setDextroseError(null)
      setDextroseResult(out)
    }
  }

  return (
    <div className="panel">
      <Tabs
        tabs={SUB_MODES}
        active={subMode}
        onChange={(id) => setSubMode(id as 'rumatan' | 'dekstrosa')}
        label="Jenis hitung"
      />

      <div className="form">
        <WeightInput
          id="fluid-weight"
          value={weight}
          onChange={(v) => { setWeight(v); setRateResult(null); setDextroseResult(null) }}
          autoFocus
        />
      </div>

      {subMode === 'rumatan' && (
        <>
          <Tabs
            tabs={FLUID_TYPES}
            active={fluidType}
            onChange={(id) => { setFluidType(id); setRateResult(null) }}
            label="Jenis cairan"
          />
          <Tabs
            tabs={RATE_MODES}
            active={rateMode}
            onChange={(id) => { setRateMode(id as 'auto' | 'manual'); setRateResult(null) }}
            label="Mode kecepatan"
          />

          {rateMode === 'manual' && (
            <div className="form">
              <div className="field">
                <label className="label" htmlFor="fluid-manual-rate">Kecepatan (mL/kg/jam)</label>
                <input
                  id="fluid-manual-rate"
                  className={`input${isInvalidPositiveNumber(manualRate) ? ' input--invalid' : ''}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={manualRate}
                  aria-invalid={isInvalidPositiveNumber(manualRate)}
                  onChange={(e) => { setManualRate(e.target.value); setRateResult(null) }}
                />
              </div>
            </div>
          )}

          {rateError && <p className="error" role="alert">{rateError}</p>}

          <button className="btn btn--primary" onClick={handleCalculateRate}>
            Hitung Kecepatan Rumatan
          </button>

          <p className="sr-only" role="status">
            {rateResult
              ? `${fluidType}: ${rateResult.ratePerHr} mililiter per jam, ` +
                `${rateResult.dropsMacro} tetes per menit makro, ` +
                `${rateResult.dropsMicro} tetes per menit mikro, ` +
                `${rateResult.dropsTransfusion} tetes per menit transfusi.`
              : ''}
          </p>

          {rateResult && <FluidRateResultCard result={rateResult} fluidType={fluidType} />}
        </>
      )}

      {subMode === 'dekstrosa' && (
        <>
          <div className="form">
            <div className="field">
              <label className="label" htmlFor="dextrose-dose">
                Dosis (g/kg)
                <span className="label--range"> [0.2–1]</span>
              </label>
              <input
                id="dextrose-dose"
                className={`input${isInvalidPositiveNumber(dextroseDose) ? ' input--invalid' : ''}`}
                type="number"
                min="0"
                step="0.1"
                value={dextroseDose}
                aria-invalid={isInvalidPositiveNumber(dextroseDose)}
                onChange={(e) => { setDextroseDose(e.target.value); setDextroseResult(null) }}
              />
            </div>
          </div>

          <Tabs
            tabs={DEXTROSE_CONCENTRATIONS}
            active={concentration}
            onChange={(id) => { setConcentration(id as DextroseConcentration); setDextroseResult(null) }}
            label="Konsentrasi larutan"
          />

          {dextroseError && <p className="error" role="alert">{dextroseError}</p>}

          <button className="btn btn--primary" onClick={handleCalculateDextrose}>
            Hitung Volume Dekstrosa
          </button>

          <p className="sr-only" role="status">
            {dextroseResult
              ? `${concentration}: dosis ${dextroseResult.doseGram} gram, volume ${dextroseResult.volumeMl} mililiter.`
              : ''}
          </p>

          {dextroseResult && <DextroseResultCard result={dextroseResult} concentration={concentration} />}
        </>
      )}
    </div>
  )
}
