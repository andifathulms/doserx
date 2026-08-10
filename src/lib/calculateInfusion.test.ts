import { describe, it, expect } from 'vitest'
import { calculateInfusion } from './calculateInfusion'

// Dopamin 400mg/250mL = 1600 mcg/mL, 5 mcg/kg/min, 14 kg
const DOPAMINE = {
  weight: 14,
  dose: 5,
  doseUnit: 'mcg/kg/min' as const,
  stockConcentration: 1600,
  stockUnit: 'mcg/mL',
  diluentVolume: 250,
}

describe('calculateInfusion — derivation', () => {
  it('traces rate and both drip rates for a per-minute drug', () => {
    const out = calculateInfusion(DOPAMINE)
    if (!out.valid) throw new Error('expected valid')
    // 5 x 14 = 70 mcg/min; 70/1600 x 60 = 2.63 mL/hr
    expect(out.ratePerHr).toBe(2.63)
    expect(out.steps.map((s) => s.result)).toEqual([
      '70 mcg/mnt',
      '2.63 mL/jam',
      `${out.dropsMacro} tpm`,
      `${out.dropsMicro} tpm`,
    ])
    // No normalisation step: the dose is already per-minute.
    expect(out.steps[0].expression).toBe('5 mcg/kg/mnt × 14 kg')
  })

  it('shows the hour-to-minute conversion for a per-hour drug', () => {
    const out = calculateInfusion({ ...DOPAMINE, dose: 20, doseUnit: 'mcg/kg/hr', stockConcentration: 40 })
    if (!out.valid) throw new Error('expected valid')
    expect(out.steps[0]).toEqual({
      expression: '20 mcg/kg/jam ÷ 60 mnt',
      result: '0.3333 mcg/kg/mnt',
    })
  })

  it('shows BOTH the mg->mcg and hr->min conversions for a mg/kg/hr drug', () => {
    const out = calculateInfusion({
      ...DOPAMINE, dose: 0.7, doseUnit: 'mg/kg/hr', stockConcentration: 1, stockUnit: 'mg/mL',
    })
    if (!out.valid) throw new Error('expected valid')
    expect(out.steps[0].expression).toBe('0.7 mg/kg/jam × 1000 mcg/mg ÷ 60 mnt')
    // The stock concentration is converted too, and says so.
    expect(out.steps[1]).toEqual({
      expression: 'Stok 1 mg/mL × 1000 mcg/mg',
      result: '1000 mcg/mL',
    })
  })

  it('keeps the final step result identical to the returned rate', () => {
    const out = calculateInfusion({ ...DOPAMINE, weight: 7.5, dose: 0.1, stockConcentration: 16 })
    if (!out.valid) throw new Error('expected valid')
    const rateStep = out.steps.find((s) => s.result.endsWith('mL/jam'))
    expect(rateStep?.result).toBe(`${out.ratePerHr} mL/jam`)
  })

  it('emits no steps for invalid input', () => {
    const out = calculateInfusion({ ...DOPAMINE, weight: 0 })
    expect(out.valid).toBe(false)
  })
})
