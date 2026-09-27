import { describe, it, expect } from 'vitest'
import { calculate, calculateFixed } from './calculate'

describe('calculate', () => {
  it('computes normal dose without caps', () => {
    const result = calculate({ weight: 20, dosePerKg: 15, freq: 4 })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.dailyDose).toBe(300)
    expect(result.perDose).toBe(75)
    expect(result.cappedByMaxDay).toBe(false)
    expect(result.cappedByMaxSingle).toBe(false)
    expect(result.volume).toBeUndefined()
  })

  it('computes volume when concentration is provided', () => {
    const result = calculate({ weight: 20, dosePerKg: 15, freq: 4, concentration: 250 })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.volume).toBe(0.3) // 75mg / 250mg/mL
  })

  it('caps daily dose when exceeding maxDay', () => {
    const result = calculate({ weight: 50, dosePerKg: 15, freq: 4, maxDay: 500 })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.dailyDose).toBe(500)
    expect(result.cappedByMaxDay).toBe(true)
    expect(result.perDose).toBe(125)
  })

  it('caps per-dose when exceeding maxSingle', () => {
    const result = calculate({ weight: 50, dosePerKg: 15, freq: 4, maxSingle: 100 })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.perDose).toBe(100)
    expect(result.cappedByMaxSingle).toBe(true)
  })

  it('returns error for invalid weight', () => {
    const result = calculate({ weight: 0, dosePerKg: 15, freq: 4 })
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.error).toMatch(/weight/i)
  })

  it('returns error for negative dosePerKg', () => {
    const result = calculate({ weight: 20, dosePerKg: -5, freq: 4 })
    expect(result.valid).toBe(false)
  })

  it('returns error for zero frequency', () => {
    const result = calculate({ weight: 20, dosePerKg: 15, freq: 0 })
    expect(result.valid).toBe(false)
  })

  it('does not show volume when concentration is missing', () => {
    const result = calculate({ weight: 20, dosePerKg: 15, freq: 4 })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.volume).toBeUndefined()
  })

  it('handles NaN inputs gracefully', () => {
    const result = calculate({ weight: NaN, dosePerKg: 15, freq: 4 })
    expect(result.valid).toBe(false)
  })
})

// ── Derivation trace ────────────────────────────────────────────────────────
// The steps are the audit trail: every number the UI shows must be traceable
// to a rule, so they are asserted as tightly as the arithmetic itself.
describe('calculate — steps', () => {
  it('traces the plain chain: daily then per-dose', () => {
    const result = calculate({ weight: 20, dosePerKg: 15, freq: 4 })
    if (!result.valid) throw new Error('expected valid')
    expect(result.steps.map((s) => s.kind)).toEqual(['daily', 'perDose'])
    expect(result.steps[0]).toEqual({
      kind: 'daily',
      expression: '20 kg × 15 mg/kg/hari',
      result: '300 mg/hari',
    })
    expect(result.steps[1]).toEqual({
      kind: 'perDose',
      expression: '300 mg/hari ÷ 4× sehari',
      result: '75 mg/kali',
    })
  })

  it('adds a volume step only when concentration is given', () => {
    const withConc = calculate({ weight: 20, dosePerKg: 15, freq: 4, concentration: 250 })
    if (!withConc.valid) throw new Error('expected valid')
    expect(withConc.steps[withConc.steps.length - 1]).toEqual({
      kind: 'volume',
      expression: '75 mg/kali ÷ 250 mg/mL',
      result: '0.3 mL',
    })

    const without = calculate({ weight: 20, dosePerKg: 15, freq: 4 })
    if (!without.valid) throw new Error('expected valid')
    expect(without.steps.some((s) => s.kind === 'volume')).toBe(false)
  })

  it('records the clamp as its own step when maxDay binds', () => {
    const result = calculate({ weight: 50, dosePerKg: 15, freq: 4, maxDay: 500 })
    if (!result.valid) throw new Error('expected valid')
    expect(result.steps.map((s) => s.kind)).toEqual(['daily', 'capDay', 'perDose'])
    expect(result.steps[1].expression).toBe('750 mg/hari melebihi maks 500 mg/hari')
    // The per-dose step divides the CAPPED daily dose, matching the result.
    expect(result.steps[2].expression).toBe('500 mg/hari ÷ 4× sehari')
    expect(result.steps[2].result).toBe('125 mg/kali')
  })

  it('records the clamp when maxSingle binds', () => {
    const result = calculate({ weight: 50, dosePerKg: 15, freq: 4, maxSingle: 100 })
    if (!result.valid) throw new Error('expected valid')
    expect(result.steps.map((s) => s.kind)).toEqual(['daily', 'perDose', 'capSingle'])
    expect(result.steps[2].result).toBe('100 mg/kali')
  })

  it('keeps every step result identical to the returned figures', () => {
    const result = calculate({ weight: 13.5, dosePerKg: 30, freq: 3, concentration: 120 })
    if (!result.valid) throw new Error('expected valid')
    const perDoseStep = result.steps.find((s) => s.kind === 'perDose')
    expect(perDoseStep?.result).toBe(`${result.perDose} mg/kali`)
    const volumeStep = result.steps.find((s) => s.kind === 'volume')
    expect(volumeStep?.result).toBe(`${result.volume} mL`)
  })
})

// ── Cap context ─────────────────────────────────────────────────────────────
describe('calculate — cap context', () => {
  it('reports the uncapped figures only when a cap fired', () => {
    const capped = calculate({ weight: 50, dosePerKg: 15, freq: 4, maxDay: 500 })
    if (!capped.valid) throw new Error('expected valid')
    expect(capped.uncappedDailyDose).toBe(750)
    expect(capped.uncappedPerDose).toBe(187.5)

    const uncapped = calculate({ weight: 10, dosePerKg: 15, freq: 4, maxDay: 500 })
    if (!uncapped.valid) throw new Error('expected valid')
    expect(uncapped.uncappedDailyDose).toBeUndefined()
    expect(uncapped.uncappedPerDose).toBeUndefined()
  })

  it('computes the weight at which maxDay starts binding', () => {
    const result = calculate({ weight: 10, dosePerKg: 15, freq: 4, maxDay: 500 })
    if (!result.valid) throw new Error('expected valid')
    expect(result.capFromWeightKg).toBe(33.3) // 500 / 15
  })

  it('computes the weight at which maxSingle starts binding', () => {
    const result = calculate({ weight: 10, dosePerKg: 15, freq: 4, maxSingle: 100 })
    if (!result.valid) throw new Error('expected valid')
    expect(result.capFromWeightKg).toBe(26.7) // 100 × 4 / 15
  })

  it('reports the lower crossover when both ceilings exist', () => {
    const result = calculate({
      weight: 10, dosePerKg: 15, freq: 4, maxDay: 500, maxSingle: 100,
    })
    if (!result.valid) throw new Error('expected valid')
    expect(result.capFromWeightKg).toBe(26.7) // maxSingle binds first
  })

  it('tracks dose/kg overrides — the crossover is not fixed per drug', () => {
    const low = calculate({ weight: 10, dosePerKg: 10, freq: 4, maxDay: 500 })
    const high = calculate({ weight: 10, dosePerKg: 25, freq: 4, maxDay: 500 })
    if (!low.valid || !high.valid) throw new Error('expected valid')
    expect(low.capFromWeightKg).toBe(50)
    expect(high.capFromWeightKg).toBe(20)
  })

  it('omits the crossover when the drug has no ceiling', () => {
    const result = calculate({ weight: 10, dosePerKg: 15, freq: 4 })
    if (!result.valid) throw new Error('expected valid')
    expect(result.capFromWeightKg).toBeUndefined()
  })
})

describe('calculateFixed — adult fixed-dose regimens', () => {
  it('uses the published dose regardless of weight', () => {
    const out = calculateFixed({ doseMg: 30, freq: 3, concentration: 30 })
    expect(out.valid).toBe(true)
    if (!out.valid) return
    expect(out.perDose).toBe(30)
    expect(out.dailyDose).toBe(90)
    expect(out.volume).toBe(1)
    expect(out.cappedByMaxDay).toBe(false)
    expect(out.steps[0].expression).toMatch(/dosis tetap/)
  })

  it('caps the per-dose when the daily total exceeds the ceiling', () => {
    const out = calculateFixed({ doseMg: 1000, freq: 6, maxDay: 4000 })
    expect(out.valid).toBe(true)
    if (!out.valid) return
    expect(out.dailyDose).toBe(4000)
    expect(out.perDose).toBe(666.7)
    expect(out.cappedByMaxDay).toBe(true)
    expect(out.uncappedDailyDose).toBe(6000)
  })

  it('omits the volume without a concentration and rejects invalid input', () => {
    const ok = calculateFixed({ doseMg: 4, freq: 3 })
    expect(ok.valid && ok.volume).toBe(undefined)
    expect(calculateFixed({ doseMg: 0, freq: 3 }).valid).toBe(false)
    expect(calculateFixed({ doseMg: NaN, freq: 3 }).valid).toBe(false)
    expect(calculateFixed({ doseMg: 4, freq: -1 }).valid).toBe(false)
  })
})

describe('small doses — the mg shown agrees with the mL shown', () => {
  it('atropine 7 kg: 0.14 mg and 0.56 mL (was "0.1 mg" beside 0.56 mL)', () => {
    const out = calculate({ weight: 7, dosePerKg: 0.02, freq: 1, maxSingle: 0.5, concentration: 0.25 })
    expect(out.valid && out.perDose).toBe(0.14)
    expect(out.valid && out.volume).toBe(0.56)
  })

  it('naloxone 9 kg: 0.09 mg, not 0.1', () => {
    const out = calculate({ weight: 9, dosePerKg: 0.01, freq: 1, maxSingle: 0.4, concentration: 0.4 })
    expect(out.valid && out.perDose).toBe(0.09)
  })

  it('fentanyl 2 mcg/kg at 14 kg: 0.028 mg, never 0', () => {
    const out = calculate({ weight: 14, dosePerKg: 0.002, freq: 1, concentration: 0.05 })
    expect(out.valid && out.perDose).toBe(0.028)
    expect(out.valid && out.volume).toBe(0.56)
    expect(out.valid && out.steps[0].expression).toContain('0.002 mg/kg/hari')
  })

  it('keeps one decimal for large doses and two between 1 and 100 mg', () => {
    const big = calculate({ weight: 14, dosePerKg: 50, freq: 3 }) // 233.33
    expect(big.valid && big.perDose).toBe(233.3)
    const mid = calculate({ weight: 5, dosePerKg: 0.45, freq: 3 }) // 0.75
    expect(mid.valid && mid.perDose).toBe(0.75)
    const mid2 = calculate({ weight: 29, dosePerKg: 1, freq: 3 }) // 9.666…
    expect(mid2.valid && mid2.perDose).toBe(9.67)
  })

  it('agrees mg × concentration ≈ mL across the whole catalogue, at several weights', async () => {
    const { DRUG_PRESETS } = await import('../data/drugs')
    for (const p of DRUG_PRESETS) {
      if (!p.concentration) continue
      for (const w of [3, 7, 14, 30, 70]) {
        const o = calculate({ weight: w, dosePerKg: p.dosePerKg, freq: p.freq, maxDay: p.maxDay, maxSingle: p.maxSingle, concentration: p.concentration })
        if (!o.valid || o.volume == null) continue
        // Within half a unit of the volume's last displayed decimal.
        expect(Math.abs(o.perDose / p.concentration - o.volume), `${p.id} @ ${w} kg`).toBeLessThanOrEqual(0.0051 + o.volume * 0.005)
      }
    }
  })
})
