import { useMemo, useState } from 'react'
import { AnswerPanel } from './AnswerPanel'
import { Tabs } from './Tabs'
import { WeightPrompt } from './WeightPrompt'
import { usePatient } from '../lib/patient'
import { isInvalidPositiveNumber } from '../lib/validateNumber'
import {
  KCL_ABSOLUTE_MAX_MEQ_PER_L,
  KCL_MAX_MEQ_PER_KG_HR,
  KCL_PERIPHERAL_MAX_MEQ_PER_L,
  NA_MAX_RISE_PER_24H,
  potassiumCorrection,
  sodiumBolus,
  sodiumDeficit,
} from '../lib/calculateElectrolyte'

/**
 * Sodium and potassium correction — drafts awaiting clinical review, shown
 * only in review mode (FluidPanel gates them). Every rule they encode is a
 * named, cited constant in lib/calculateElectrolyte.ts.
 *
 * Both replace a fragile path: sodium had none (NaCl 3% was on the requested
 * list), and potassium's only path was a drip preset whose units were ~100×
 * off (see infusionDrugs.ts). Potassium here is in mEq throughout, with the
 * bag concentration and the rate checked against their limits on screen.
 */

function DraftNote() {
  return (
    <p className="notice notice--draft">
      <strong>DRAF — belum diverifikasi klinisi.</strong> Tampil karena mode tinjau aktif. Aturan dan
      batasnya tercantum di bawah hasil.
    </p>
  )
}

export function SodiumCorrection() {
  const { weightKg } = usePatient()
  const [mode, setMode] = useState<'bolus' | 'defisit'>('bolus')
  const [current, setCurrent] = useState('')
  const [target, setTarget] = useState('')

  const bolus = useMemo(() => (weightKg == null ? null : sodiumBolus(weightKg)), [weightKg])
  const deficit = useMemo(() => {
    if (weightKg == null || !current || !target) return null
    return sodiumDeficit({
      weight: weightKg,
      current: parseFloat(current),
      target: parseFloat(target),
      // 0.6 for children and adult men. Adult women and the elderly are 0.5;
      // the app does not ask sex, so it uses the higher figure and says so.
      tbwFraction: 0.6,
    })
  }, [weightKg, current, target])

  return (
    <>
      <DraftNote />
      <Tabs
        tabs={[
          { id: 'bolus', label: 'Bolus (simptomatik)', hint: 'Hiponatremia dengan kejang/penurunan kesadaran: NaCl 3% bolus.' },
          { id: 'defisit', label: 'Defisit Na', hint: 'Perkiraan defisit natrium dan batas kecepatan koreksi.' },
        ]}
        active={mode}
        onChange={(id) => setMode(id as 'bolus' | 'defisit')}
        label="Koreksi natrium"
      />
      {weightKg == null && <WeightPrompt what="volume NaCl 3%" />}

      {mode === 'bolus' && bolus?.valid && (
        <div className="result-card">
          <AnswerPanel
            label="Bolus NaCl 3%"
            primary={{ label: 'NaCl 3%', value: bolus.volumeMl, unit: 'mL', sub: 'IV dalam 10–20 menit' }}
            secondary={{ label: 'Natrium', value: bolus.sodiumMeq, unit: 'mEq' }}
            capped={bolus.capped}
            facts={['2 mL/kg, maks 100 mL', 'ulang hingga 3× bila gejala menetap']}
            steps={bolus.steps}
          />
          <p className="result-card__pending-hint">
            Setiap bolus menaikkan Na ≈ 2 mEq/L. Periksa ulang Na setelah tiap bolus; berhenti bila
            gejala membaik. Acuan: Moritz & Ayus; ESE 2014.
          </p>
        </div>
      )}

      {mode === 'defisit' && (
        <>
          <div className="form">
            <div className="field">
              <label className="label" htmlFor="na-current">Na saat ini (mEq/L)</label>
              <input
                id="na-current"
                className={`input${isInvalidPositiveNumber(current) ? ' input--invalid' : ''}`}
                type="number"
                inputMode="decimal"
                placeholder="misal 120"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="na-target">Target Na (mEq/L)</label>
              <input
                id="na-target"
                className={`input${isInvalidPositiveNumber(target) ? ' input--invalid' : ''}`}
                type="number"
                inputMode="decimal"
                placeholder="misal 128"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
          </div>
          {deficit && !deficit.valid && <p className="error" role="alert">{deficit.error}</p>}
          {deficit?.valid && (
            <div className="result-card">
              <AnswerPanel
                label="Defisit natrium"
                primary={{ label: 'NaCl 3%', value: deficit.volumeMl, unit: 'mL', sub: `defisit ${deficit.deficitMeq} mEq` }}
                secondary={{ label: 'Paling cepat', value: deficit.minHours, unit: 'jam' }}
                facts={[`≈ ${deficit.rateMlPerHr} mL/jam`, `maks naik ${NA_MAX_RISE_PER_24H} mEq/L per 24 jam`]}
                steps={deficit.steps}
              />
              <p className="result-card__pending-hint">
                Perkiraan kasar dengan cairan tubuh total 0,6 × BB (perempuan dewasa/lansia: 0,5 —
                defisit sebenarnya lebih kecil). Na naik tidak linear; periksa Na tiap 2–4 jam.
                Koreksi terlalu cepat berisiko demielinasi osmotik.
              </p>
            </div>
          )}
        </>
      )}
    </>
  )
}

const KCL_STOCKS = [
  { id: '1', label: 'KCl 7,46%', hint: '1 mEq/mL' },
  { id: '2', label: 'KCl 15%', hint: '≈2 mEq/mL' },
]

export function PotassiumCorrection() {
  const { weightKg } = usePatient()
  const [meqPerKg, setMeqPerKg] = useState('0.5')
  const [hours, setHours] = useState('2')
  const [bagMl, setBagMl] = useState('250')
  const [stock, setStock] = useState('1')

  const out = useMemo(() => {
    if (weightKg == null) return null
    return potassiumCorrection({
      weight: weightKg,
      meqPerKg: parseFloat(meqPerKg),
      hours: parseFloat(hours),
      bagMl: parseFloat(bagMl),
      stockMeqPerMl: parseFloat(stock),
    })
  }, [weightKg, meqPerKg, hours, bagMl, stock])

  return (
    <>
      <DraftNote />
      <p className="notice notice--alert">
        <strong>KCl pekat adalah obat high-alert.</strong> Jangan pernah bolus atau IV push. Selalu
        encerkan, beri lewat pompa, pantau EKG.
      </p>
      {weightKg == null && <WeightPrompt what="volume KCl" />}

      {out && !out.valid && <p className="error" role="alert">{out.error}</p>}
      {out?.valid && (
        <div className="result-card">
          <AnswerPanel
            label="Koreksi kalium"
            primary={{ label: 'Tambahkan KCl', value: out.kclMl, unit: 'mL', sub: `${out.doseMeq} mEq ke ${bagMl} mL` }}
            secondary={{ label: 'Kecepatan', value: out.rateMlPerHr, unit: 'mL/jam', sub: `${hours} jam` }}
            capped={out.cappedDose}
            facts={[`${out.finalMeqPerL} mEq/L`, `${out.rateMeqPerKgHr} mEq/kg/jam`]}
            steps={out.steps}
          />
          {(out.tooConcentrated || out.tooConcentratedPeripheral || out.tooFast) && (
            <div className="notices">
              {out.tooConcentrated && (
                <p className="notice notice--alert">
                  <strong>Terlalu pekat: {out.finalMeqPerL} mEq/L.</strong> Di atas {KCL_ABSOLUTE_MAX_MEQ_PER_L} mEq/L —
                  jangan diberikan. Tambah volume pelarut.
                </p>
              )}
              {!out.tooConcentrated && out.tooConcentratedPeripheral && (
                <p className="notice notice--draft">
                  <strong>{out.finalMeqPerL} mEq/L</strong> melebihi batas jalur perifer
                  ({KCL_PERIPHERAL_MAX_MEQ_PER_L} mEq/L) — perlu jalur sentral dan monitor EKG, atau
                  tambah volume pelarut.
                </p>
              )}
              {out.tooFast && (
                <p className="notice notice--alert">
                  <strong>Terlalu cepat: {out.rateMeqPerKgHr} mEq/kg/jam.</strong> Maks{' '}
                  {KCL_MAX_MEQ_PER_KG_HR} mEq/kg/jam — perpanjang waktu pemberian.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <h3 className="adjust__title">Atur dosis & pengenceran</h3>
      <Tabs tabs={KCL_STOCKS} active={stock} onChange={setStock} label="Sediaan KCl" />
      <div className="form">
        <div className="field">
          <label className="label" htmlFor="k-dose">
            Dosis (mEq/kg) <span className="label--range">[0,5–1]</span>
          </label>
          <input
            id="k-dose"
            className={`input${isInvalidPositiveNumber(meqPerKg) ? ' input--invalid' : ''}`}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={meqPerKg}
            onChange={(e) => setMeqPerKg(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="k-hours">Lama pemberian (jam)</label>
          <input
            id="k-hours"
            className={`input${isInvalidPositiveNumber(hours) ? ' input--invalid' : ''}`}
            type="number"
            inputMode="decimal"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="k-bag">Volume pelarut (mL)</label>
          <input
            id="k-bag"
            className={`input${isInvalidPositiveNumber(bagMl) ? ' input--invalid' : ''}`}
            type="number"
            inputMode="decimal"
            step="10"
            value={bagMl}
            onChange={(e) => setBagMl(e.target.value)}
          />
        </div>
      </div>
      <p className="field__hint">
        Acuan batas: maks {KCL_MAX_MEQ_PER_KG_HR} mEq/kg/jam dan 40 mEq per pemberian; jalur perifer
        ≤{KCL_PERIPHERAL_MAX_MEQ_PER_L} mEq/L (BNFc, IDAI).
      </p>
    </>
  )
}
