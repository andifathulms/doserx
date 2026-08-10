import { useState } from 'react'
import { DRUG_PRESETS } from '../data/drugs'
import { calculate } from '../lib/calculate'

/**
 * The landing view used to state the process in the abstract — "1 Pilih obat,
 * 2 Isi berat, 3 Dapat mg + mL" — with no numbers anywhere, so a first-time
 * visitor had to select a drug and type a weight before the app demonstrated
 * anything at all.
 *
 * This is the same three steps carried through with real figures, and the
 * weight is a live control: moving it re-derives every number below. Watching
 * the chain move is the explanation; there is nothing to read.
 *
 * Everything here comes from the catalog entry and calculate() — the same
 * engine and the same data the real calculator uses. No hardcoded results.
 */
const DEMO_DRUG_ID = 'paracetamol'
const MIN_KG = 4
const MAX_KG = 60
const STEP_KG = 2

export function WorkedExample() {
  const [weight, setWeight] = useState(14)

  const drug = DRUG_PRESETS.find((d) => d.id === DEMO_DRUG_ID)
  if (!drug) return null

  const out = calculate({
    weight,
    dosePerKg: drug.dosePerKg,
    freq: drug.freq,
    maxDay: drug.maxDay,
    maxSingle: drug.maxSingle,
    concentration: drug.concentration,
  })
  if (!out.valid) return null

  return (
    <section className="worked" aria-labelledby="worked-title">
      <h2 className="worked__title" id="worked-title">
        Contoh: <strong>{drug.name}</strong> untuk anak
        <span className="worked__cite"> · dosis per {drug.source}</span>
      </h2>

      <ol className="worked__steps">
        <li className="worked__step">
          <span className="worked__num">1</span>
          <span className="worked__label">Pilih obat</span>
          <span className="worked__val">
            {drug.name} · {drug.dosePerKg} mg/kg/hari · {drug.freq}×/hari
          </span>
        </li>

        <li className="worked__step">
          <span className="worked__num">2</span>
          <span className="worked__label">Isi berat badan</span>
          <span className="worked__control">
            <button
              type="button"
              className="worked__step-btn"
              onClick={() => setWeight((w) => Math.max(MIN_KG, w - STEP_KG))}
              disabled={weight <= MIN_KG}
              aria-label={`Kurangi berat contoh ke ${Math.max(MIN_KG, weight - STEP_KG)} kilogram`}
            >
              −
            </button>
            <span className="worked__weight">{weight} kg</span>
            <button
              type="button"
              className="worked__step-btn"
              onClick={() => setWeight((w) => Math.min(MAX_KG, w + STEP_KG))}
              disabled={weight >= MAX_KG}
              aria-label={`Tambah berat contoh ke ${Math.min(MAX_KG, weight + STEP_KG)} kilogram`}
            >
              +
            </button>
          </span>
        </li>

        <li className="worked__step worked__step--out">
          <span className="worked__num">3</span>
          <span className="worked__label">Dapat dosis</span>
          <span className="worked__val worked__val--result" role="status">
            <strong>{out.perDose} mg</strong> per kali
            {out.volume != null && (
              <>
                {' '}· <strong>{out.volume} mL</strong> sirup
              </>
            )}
          </span>
        </li>
      </ol>

      {/* The arithmetic, not just the endpoints — same steps the real result
          card shows, so the demo teaches the thing it is demonstrating. */}
      <p className="worked__working">
        {out.steps.map((s, i) => (
          <span key={`${s.kind}-${i}`} className="worked__working-step">
            {s.expression} = <strong>{s.result}</strong>
            {i < out.steps.length - 1 && <span aria-hidden="true"> → </span>}
          </span>
        ))}
      </p>

      {out.cappedByMaxDay || out.cappedByMaxSingle ? (
        <p className="worked__note worked__note--cap">
          Di berat ini dosis sudah menyentuh batas maksimum {drug.name} — di atas{' '}
          {out.capFromWeightKg} kg dosis berhenti mengikuti berat badan.
        </p>
      ) : (
        <p className="worked__note">
          Angka contoh, memakai dosis tipikal {drug.dosePerKg} mg/kg/hari
          (rentang {drug.dosePerKgMin}–{drug.dosePerKgMax}). Hitung yang sebenarnya
          ada di bawah.
        </p>
      )}
    </section>
  )
}
