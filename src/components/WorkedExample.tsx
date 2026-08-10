import { useState } from 'react'
import { DEMO_DRUG } from '../data/landing-facts'
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
 * The figures come from calculate() — the same engine the real calculator uses.
 * The drug fields come from data/landing-facts, a catalog subset kept honest by
 * a test, so the landing page does not pull all 92 drugs to demo one.
 */
/** The demo is the only piece of the app that is bilingual, because it is the
 *  one piece the landing page reuses. */
const LABELS = {
  id: {
    heading: 'Contoh:', for: 'untuk anak', cite: 'dosis per',
    step1: 'Pilih obat', step2: 'Isi berat badan', step3: 'Dapat dosis',
    perDose: 'per kali', syrup: 'sirup',
    less: 'Kurangi berat contoh ke', more: 'Tambah berat contoh ke', kg: 'kilogram',
    capped: (name: string, kg: number) =>
      `Di berat ini dosis sudah menyentuh batas maksimum ${name} — di atas ${kg} kg dosis berhenti mengikuti berat badan.`,
    note: (typical: number, min?: number, max?: number) =>
      `Angka contoh, memakai dosis tipikal ${typical} mg/kg/hari (rentang ${min}–${max}). Hitung yang sebenarnya ada di bawah.`,
  },
  en: {
    heading: 'Example:', for: 'for a child', cite: 'dosing per',
    step1: 'Pick a drug', step2: 'Enter body weight', step3: 'Get the dose',
    perDose: 'per dose', syrup: 'syrup',
    less: 'Decrease example weight to', more: 'Increase example weight to', kg: 'kilograms',
    capped: (name: string, kg: number) =>
      `At this weight the dose has reached the ${name} maximum — above ${kg} kg it stops following body weight.`,
    note: (typical: number, min?: number, max?: number) =>
      `Example figures, using the typical ${typical} mg/kg/day dose (range ${min}–${max}). The real calculator is below.`,
  },
} as const

const MIN_KG = 4
const MAX_KG = 60
const STEP_KG = 2

export function WorkedExample({ lang = 'id' }: { lang?: 'id' | 'en' }) {
  const [weight, setWeight] = useState(14)
  const t = LABELS[lang]

  const drug = DEMO_DRUG

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
        {t.heading} <strong>{drug.name}</strong> {t.for}
        <span className="worked__cite"> · {t.cite} {drug.source}</span>
      </h2>

      <ol className="worked__steps">
        <li className="worked__step">
          <span className="worked__num">1</span>
          <span className="worked__label">{t.step1}</span>
          <span className="worked__val">
            {drug.name} · {drug.dosePerKg} mg/kg/hari · {drug.freq}×/hari
          </span>
        </li>

        <li className="worked__step">
          <span className="worked__num">2</span>
          <span className="worked__label">{t.step2}</span>
          <span className="worked__control">
            <button
              type="button"
              className="worked__step-btn"
              onClick={() => setWeight((w) => Math.max(MIN_KG, w - STEP_KG))}
              disabled={weight <= MIN_KG}
              aria-label={`${t.less} ${Math.max(MIN_KG, weight - STEP_KG)} ${t.kg}`}
            >
              −
            </button>
            <span className="worked__weight">{weight} kg</span>
            <button
              type="button"
              className="worked__step-btn"
              onClick={() => setWeight((w) => Math.min(MAX_KG, w + STEP_KG))}
              disabled={weight >= MAX_KG}
              aria-label={`${t.more} ${Math.min(MAX_KG, weight + STEP_KG)} ${t.kg}`}
            >
              +
            </button>
          </span>
        </li>

        <li className="worked__step worked__step--out">
          <span className="worked__num">3</span>
          <span className="worked__label">{t.step3}</span>
          <span className="worked__val worked__val--result" role="status">
            <strong>{out.perDose} mg</strong> {t.perDose}
            {out.volume != null && (
              <>
                {' '}· <strong>{out.volume} mL</strong> {t.syrup}
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
          {t.capped(drug.name, out.capFromWeightKg!)}
        </p>
      ) : (
        <p className="worked__note">
          {t.note(drug.dosePerKg, drug.dosePerKgMin, drug.dosePerKgMax)}
        </p>
      )}
    </section>
  )
}
