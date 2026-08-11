import { useState } from 'react'
import { DEMO_DRUG } from '../data/landing-facts'
import { calculate } from '../lib/calculate'

/**
 * The live demo: move the weight, watch every number re-derive.
 *
 * Previously framed as three numbered steps, which put a 1-2-3 immediately
 * above the 1-2-3 of the chain section and made both harder to read — and
 * crammed label, value and control onto single rows.
 *
 * Now it is what it actually is: one input, one output, working underneath.
 * The numbered explanation belongs to the chain section; this card only has to
 * make the transformation feel real.
 *
 * Figures come from calculate() — the same engine the real calculator uses.
 * The drug fields come from data/landing-facts, a catalog subset kept honest
 * by a test, so the landing does not pull all 92 drugs to demo one.
 */

const LABELS = {
  id: {
    for: 'untuk anak',
    cite: 'acuan',
    weight: 'Berat badan',
    result: 'Dosis yang diberikan',
    perDose: 'per kali',
    perDay: '/hari',
    syrup: 'sirup',
    working: 'Lihat cara hitungnya',
    less: 'Kurangi berat contoh ke',
    more: 'Tambah berat contoh ke',
    kg: 'kilogram',
    capped: (name: string, kg: number) =>
      `Di berat ini dosis sudah menyentuh batas maksimum ${name} — di atas ${kg} kg dosis berhenti mengikuti berat badan.`,
    note: (typical: number, min?: number, max?: number) =>
      `Angka contoh dengan dosis tipikal ${typical} mg/kg/hari (rentang ${min}–${max}).`,
  },
  en: {
    for: 'for a child',
    cite: 'per',
    weight: 'Body weight',
    result: 'Dose to give',
    perDose: 'per dose',
    perDay: '/day',
    syrup: 'syrup',
    working: 'See the working',
    less: 'Decrease example weight to',
    more: 'Increase example weight to',
    kg: 'kilograms',
    capped: (name: string, kg: number) =>
      `At this weight the dose has reached the ${name} maximum — above ${kg} kg it stops following body weight.`,
    note: (typical: number, min?: number, max?: number) =>
      `Example figures using the typical ${typical} mg/kg/day dose (range ${min}–${max}).`,
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
    <section className="demo" aria-labelledby="demo-drug">
      <header className="demo__head">
        <h3 className="demo__drug" id="demo-drug">
          {drug.name} <span className="demo__for">{t.for}</span>
        </h3>
        <span className="demo__cite">
          {t.cite} {drug.source}
        </span>
      </header>

      <div className="demo__body">
        <div className="demo__panel">
          <span className="demo__label">{t.weight}</span>
          <div className="demo__stepper">
            <button
              type="button"
              className="demo__step-btn"
              onClick={() => setWeight((w) => Math.max(MIN_KG, w - STEP_KG))}
              disabled={weight <= MIN_KG}
              aria-label={`${t.less} ${Math.max(MIN_KG, weight - STEP_KG)} ${t.kg}`}
            >
              −
            </button>
            <span className="demo__weight">
              {weight} <span className="demo__unit">kg</span>
            </span>
            <button
              type="button"
              className="demo__step-btn"
              onClick={() => setWeight((w) => Math.min(MAX_KG, w + STEP_KG))}
              disabled={weight >= MAX_KG}
              aria-label={`${t.more} ${Math.min(MAX_KG, weight + STEP_KG)} ${t.kg}`}
            >
              +
            </button>
          </div>
        </div>

        <div className="demo__arrow" aria-hidden="true">→</div>

        <div className="demo__panel demo__panel--out" role="status">
          <span className="demo__label">{t.result}</span>
          <p className="demo__result">
            <strong>{out.perDose}</strong>
            <span className="demo__unit"> mg {t.perDose}</span>
          </p>
          {out.volume != null && (
            <p className="demo__result demo__result--sub">
              <strong>{out.volume}</strong>
              <span className="demo__unit"> mL {t.syrup}</span>
            </p>
          )}
          <span className="demo__freq">
            {drug.freq}×{t.perDay}
          </span>
        </div>
      </div>

      {/* The intermediate values, not just input and answer. */}
      <details className="demo__working">
        <summary className="demo__working-summary">{t.working}</summary>
        <ol className="demo__steps">
          {out.steps.map((s, i) => (
            <li key={`${s.kind}-${i}`} className="demo__step">
              <span className="demo__expr">{s.expression}</span>
              <span className="demo__eq" aria-hidden="true">=</span>
              <span className="demo__value">{s.result}</span>
            </li>
          ))}
        </ol>
      </details>

      {out.cappedByMaxDay || out.cappedByMaxSingle ? (
        <p className="demo__note demo__note--cap">{t.capped(drug.name, out.capFromWeightKg!)}</p>
      ) : (
        <p className="demo__note">{t.note(drug.dosePerKg, drug.dosePerKgMin, drug.dosePerKgMax)}</p>
      )}
    </section>
  )
}
