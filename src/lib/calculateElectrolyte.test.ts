import { describe, it, expect } from 'vitest'
import { potassiumCorrection, sodiumBolus, sodiumDeficit } from './calculateElectrolyte'

describe('sodium', () => {
  it('bolus: 2 mL/kg of 3%, capped at 100 mL', () => {
    const a = sodiumBolus(20)
    expect(a.valid && a.volumeMl).toBe(40)
    expect(a.valid && a.sodiumMeq).toBe(20.5)
    const b = sodiumBolus(70)
    expect(b.valid && b.volumeMl).toBe(100)
    expect(b.valid && b.capped).toBe(true)
    expect(sodiumBolus(0).valid).toBe(false)
  })

  it('deficit: 0.6 × 20 kg × (130 − 120) = 120 mEq ≈ 234 mL of 3%, over ≥30 h', () => {
    const r = sodiumDeficit({ weight: 20, current: 120, target: 130, tbwFraction: 0.6 })
    expect(r.valid).toBe(true)
    if (!r.valid) return
    expect(r.deficitMeq).toBe(120)
    expect(r.volumeMl).toBe(233.9)
    expect(r.minHours).toBe(30)
  })

  it('rejects a target at or below the current value, and implausible sodium', () => {
    expect(sodiumDeficit({ weight: 20, current: 130, target: 125, tbwFraction: 0.6 }).valid).toBe(false)
    expect(sodiumDeficit({ weight: 20, current: 20, target: 130, tbwFraction: 0.6 }).valid).toBe(false)
  })
})

describe('potassium', () => {
  it('0.5 mEq/kg over 2 h at 20 kg in 250 mL of 7.46%: 10 mEq, 10 mL, 38.5 mEq/L', () => {
    const r = potassiumCorrection({ weight: 20, meqPerKg: 0.5, hours: 2, bagMl: 250, stockMeqPerMl: 1 })
    expect(r.valid).toBe(true)
    if (!r.valid) return
    expect(r.doseMeq).toBe(10)
    expect(r.kclMl).toBe(10)
    expect(r.finalMeqPerL).toBe(38.5)
    expect(r.rateMeqPerKgHr).toBe(0.25)
    expect(r.tooConcentratedPeripheral).toBe(false)
    expect(r.tooFast).toBe(false)
  })

  it('flags a bag too concentrated for a peripheral line, and one never to give', () => {
    const peripheral = potassiumCorrection({ weight: 20, meqPerKg: 0.5, hours: 2, bagMl: 150, stockMeqPerMl: 1 })
    expect(peripheral.valid && peripheral.tooConcentratedPeripheral).toBe(true)
    expect(peripheral.valid && peripheral.tooConcentrated).toBe(false)
    const never = potassiumCorrection({ weight: 20, meqPerKg: 1, hours: 2, bagMl: 100, stockMeqPerMl: 2 })
    expect(never.valid && never.tooConcentrated).toBe(true)
  })

  it('flags a rate above 0.5 mEq/kg/jam, and caps a dose at 40 mEq', () => {
    const fast = potassiumCorrection({ weight: 20, meqPerKg: 1, hours: 1, bagMl: 500, stockMeqPerMl: 1 })
    expect(fast.valid && fast.tooFast).toBe(true)
    const big = potassiumCorrection({ weight: 80, meqPerKg: 1, hours: 4, bagMl: 1000, stockMeqPerMl: 1 })
    expect(big.valid && big.doseMeq).toBe(40)
    expect(big.valid && big.cappedDose).toBe(true)
  })
})
