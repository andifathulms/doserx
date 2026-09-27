import { describe, it, expect } from 'vitest'
import { LIVE_CATALOG } from '../data/catalog'
import { quickDose, dosingSummary } from './quickDose'
import { calculate } from './calculate'

const para = LIVE_CATALOG.find((d) => d.id === 'paracetamol')!

describe('quickDose — the inline dose in the Obat list', () => {
  it('matches the full calculator for the catalog defaults', () => {
    const q = quickDose(para.regimens[0], 14)!
    const full = calculate({ weight: 14, dosePerKg: 50, freq: 4, maxDay: 4000, maxSingle: 1000, concentration: 24 })
    expect(full.valid).toBe(true)
    if (!full.valid) return
    expect(q.value).toBe(String(full.perDose)) // 175
    expect(q.sub).toBe(`${full.volume} mL`)
    expect(q.capped).toBe(false)
  })

  it('flags a capped dose', () => {
    expect(quickDose(para.regimens[0], 90)!.capped).toBe(true)
  })

  it('gives a drip rate for infusion regimens', () => {
    const dopa = LIVE_CATALOG.find((d) => d.id === 'dopamine')!
    const q = quickDose(dopa.regimens[0], 20)!
    // 5 mcg/kg/min × 20 kg × 60 ÷ 1600 mcg/mL = 3.75 mL/jam
    expect(q.unit).toBe('mL/jam')
    expect(Number(q.value)).toBeCloseTo(3.75, 1)
  })

  it('never produces NaN or Infinity for any live regimen at any common weight', () => {
    for (const d of LIVE_CATALOG) {
      for (const r of d.regimens) {
        for (const w of [2.5, 10, 25, 60]) {
          const q = quickDose(r, w)
          if (!q) continue
          expect(q.value, `${r.id} @ ${w}`).not.toMatch(/NaN|Infinity/)
          expect(q.sub ?? '', `${r.id} @ ${w}`).not.toMatch(/NaN|Infinity/)
        }
        expect(dosingSummary(r)).not.toMatch(/NaN|undefined/)
      }
    }
  })
})
