import { describe, it, expect } from 'vitest'
import { compactDerivation } from './derivationLine'

describe('compactDerivation', () => {
  it('drops a leading operand that repeats the previous result', () => {
    const line = compactDerivation([
      { kind: 'daily', expression: '18 kg × 10 mg/kg/hari', result: '180 mg/hari' },
      { kind: 'perDose', expression: '180 mg/hari ÷ 3× sehari', result: '60 mg/kali' },
      { kind: 'volume', expression: '60 mg/kali ÷ 25 mg/mL', result: '2.4 mL' },
    ])
    expect(line).toBe(
      '18 kg × 10 mg/kg/hari = 180 mg/hari ÷ 3× sehari = 60 mg/kali ÷ 25 mg/mL = 2.4 mL',
    )
  })

  it('renders a cap step as a short marker, not a parsed operand', () => {
    const line = compactDerivation([
      { kind: 'daily', expression: '40 kg × 15 mg/kg/hari', result: '600 mg/hari' },
      {
        kind: 'capDay',
        expression: '600 mg/hari melebihi maks 500 mg/hari',
        result: '500 mg/hari',
      },
      { kind: 'perDose', expression: '500 mg/hari ÷ 4× sehari', result: '125 mg/kali' },
    ])
    expect(line).toBe(
      '40 kg × 15 mg/kg/hari = 600 mg/hari → maks 500 mg/hari ÷ 4× sehari = 125 mg/kali',
    )
  })

  it('keeps a step untouched when its expression does not continue the running value', () => {
    // Mirrors calculateInfusion's stock-concentration step, which is a side
    // calculation, not a continuation of the dose-normalisation chain.
    const line = compactDerivation([
      { expression: '5 mcg/kg/jam ÷ 60 mnt', result: '0.0833 mcg/kg/mnt' },
      { expression: 'Stok 2 mg/mL × 1000 mcg/mg', result: '2000 mcg/mL' },
      { expression: '0.0833 mcg/kg/mnt × 10 kg', result: '0.833 mcg/mnt' },
    ])
    expect(line).toBe(
      '5 mcg/kg/jam ÷ 60 mnt = 0.0833 mcg/kg/mnt Stok 2 mg/mL × 1000 mcg/mg = 2000 mcg/mL ' +
        '0.0833 mcg/kg/mnt × 10 kg = 0.833 mcg/mnt',
    )
  })

  it('handles a single step', () => {
    expect(compactDerivation([{ expression: '0.2 g/kg × 10 kg', result: '2 g' }])).toBe(
      '0.2 g/kg × 10 kg = 2 g',
    )
  })

  it('returns an empty string for no steps', () => {
    expect(compactDerivation([])).toBe('')
  })
})
