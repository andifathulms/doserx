import { useMemo, useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { Tabs } from './Tabs'
import { WeightPrompt } from './WeightPrompt'
import { usePatient } from '../lib/patient'
import { useSettled } from '../lib/announce'
import { AnswerPanel } from './AnswerPanel'
import { calculateFluidRate, FluidRateResult } from '../lib/calculateFluidRate'
import { calculateDextrose, DextroseConcentration, DextroseResult } from '../lib/calculateDextrose'
import { isInvalidPositiveNumber } from '../lib/validateNumber'
import { useReviewMode } from '../lib/review'
import { PotassiumCorrection, SodiumCorrection } from './ElectrolytePanels'

type SubMode = 'rumatan' | 'dekstrosa' | 'natrium' | 'kalium'

const SUB_MODES: { id: SubMode; label: string; hint: string; draft?: boolean }[] = [
  { id: 'rumatan', label: 'Rumatan', hint: 'Kecepatan cairan rumatan (aturan 4-2-1) dan tetes per menit.' },
  { id: 'dekstrosa', label: 'Dekstrosa', hint: 'Dosis koreksi dekstrosa g/kg, dikonversi ke volume larutan.' },
  { id: 'natrium', label: 'Natrium', hint: 'Koreksi hiponatremia dengan NaCl 3%.' },
  { id: 'kalium', label: 'Kalium', hint: 'Koreksi hipokalemia dengan KCl, dalam mEq.' },
]

// The rate (4-2-1) does not depend on the fluid; the choice is carried into
// the result and the copied text, and each hint states what is in the bag.
const FLUID_TYPES = [
  { id: 'NaCl 0,9%', label: 'NaCl 0,9%', hint: 'Isotonik netral. Pilihan umum untuk rumatan dan resusitasi.' },
  {
    id: 'RL',
    label: 'RL',
    hint: 'Ringer Laktat — mengandung laktat, kalium, kalsium; hindari jalur sama dengan produk darah.',
  },
  {
    id: 'KaEN 1B',
    label: 'KaEN 1B',
    hint: 'Na 38,5 · Cl 38,5 mEq/L, glukosa 3,75%, tanpa kalium — cairan awal bila status kalium/ginjal belum diketahui (label Otsuka).',
  },
  {
    id: 'KaEN 3B',
    label: 'KaEN 3B',
    hint: 'Na 50 · K 20 · Cl 50 · laktat 20 mEq/L, glukosa 2,7% — rumatan anak setelah diuresis ada (label Otsuka).',
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

      <AnswerPanel
        label={`Hasil rumatan ${fluidType}`}
        primary={{ label: 'Kecepatan', value: result.ratePerHr, unit: 'mL/jam' }}
        secondary={{ label: 'Makro · 20 gtt/mL', value: result.dropsMacro, unit: 'tpm' }}
        facts={[
          `Mikro ${result.dropsMicro} tpm`,
          `Transfusi ${result.dropsTransfusion} tpm`,
        ]}
        steps={result.steps}
      />

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

      <AnswerPanel
        label={`Hasil koreksi dekstrosa ${concentration}`}
        primary={{ label: 'Volume', value: result.volumeMl, unit: 'mL', sub: concentration }}
        secondary={{ label: 'Dosis', value: result.doseGram, unit: 'g' }}
        steps={result.steps}
      />

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
  const [subMode, setSubMode] = useState<SubMode>('rumatan')
  const { weightKg } = usePatient()
  const review = useReviewMode()
  const modes = SUB_MODES.filter((m) => review || !m.draft)

  // Rumatan (maintenance) state
  const [fluidType, setFluidType] = useState(FLUID_TYPES[0].id)
  const [rateMode, setRateMode] = useState<'auto' | 'manual'>('auto')
  const [manualRate, setManualRate] = useState('')

  // Dekstrosa state
  const [dextroseDose, setDextroseDose] = useState('0.2')
  const [concentration, setConcentration] = useState<DextroseConcentration>('D10%')

  // Live, like every other calculator — no "Hitung" step.
  const rateOutcome = useMemo(
    () =>
      weightKg == null
        ? null
        : calculateFluidRate({
            weight: weightKg,
            manualRatePerKgHr: rateMode === 'manual' ? parseFloat(manualRate) : undefined,
          }),
    [weightKg, rateMode, manualRate],
  )
  const rateResult: FluidRateResult | null = rateOutcome && rateOutcome.valid ? rateOutcome : null
  const rateError = rateOutcome && !rateOutcome.valid ? rateOutcome.error : null

  const dextroseOutcome = useMemo(
    () =>
      weightKg == null
        ? null
        : calculateDextrose({ weight: weightKg, dosePerKg: parseFloat(dextroseDose), concentration }),
    [weightKg, dextroseDose, concentration],
  )
  const dextroseResult: DextroseResult | null =
    dextroseOutcome && dextroseOutcome.valid ? dextroseOutcome : null
  const dextroseError = dextroseOutcome && !dextroseOutcome.valid ? dextroseOutcome.error : null

  const announcement = useSettled(
    subMode === 'rumatan'
      ? rateResult
        ? `${fluidType}: ${rateResult.ratePerHr} mililiter per jam, ` +
          `${rateResult.dropsMacro} tetes per menit makro, ` +
          `${rateResult.dropsMicro} tetes per menit mikro, ` +
          `${rateResult.dropsTransfusion} tetes per menit transfusi.`
        : ''
      : dextroseResult
        ? `${concentration}: dosis ${dextroseResult.doseGram} gram, volume ${dextroseResult.volumeMl} mililiter.`
        : '',
  )

  return (
    <div className="panel">
      <Tabs
        tabs={modes.map((m) => ({ ...m, label: m.draft ? `${m.label} · draf` : m.label }))}
        active={subMode}
        onChange={(id) => setSubMode(id as SubMode)}
        label="Jenis hitung"
      />

      {subMode === 'natrium' && <SodiumCorrection />}
      {subMode === 'kalium' && <PotassiumCorrection />}

      {weightKg == null && (subMode === 'rumatan' || subMode === 'dekstrosa') && (
        <WeightPrompt what="hasilnya" />
      )}

      <p className="sr-only" role="status">{announcement}</p>

      {subMode === 'rumatan' && (
        <>
          <Tabs
            tabs={FLUID_TYPES}
            active={fluidType}
            onChange={(id) => { setFluidType(id) }}
            label="Jenis cairan"
          />
          <Tabs
            tabs={RATE_MODES}
            active={rateMode}
            onChange={(id) => { setRateMode(id as 'auto' | 'manual') }}
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
                  onChange={(e) => { setManualRate(e.target.value) }}
                />
              </div>
            </div>
          )}

          {rateError && <p className="error" role="alert">{rateError}</p>}


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
                onChange={(e) => { setDextroseDose(e.target.value) }}
              />
            </div>
          </div>

          <Tabs
            tabs={DEXTROSE_CONCENTRATIONS}
            active={concentration}
            onChange={(id) => { setConcentration(id as DextroseConcentration) }}
            label="Konsentrasi larutan"
          />

          {dextroseError && <p className="error" role="alert">{dextroseError}</p>}


          {dextroseResult && <DextroseResultCard result={dextroseResult} concentration={concentration} />}
        </>
      )}
    </div>
  )
}
