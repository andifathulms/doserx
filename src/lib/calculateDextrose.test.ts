import { describe, it, expect } from 'vitest'
import { calculateDextrose } from './calculateDextrose'

describe('calculateDextrose', () => {
  it('computes dose and volume for D10%', () => {
    const out = calculateDextrose({ weight: 10, dosePerKg: 0.2, concentration: 'D10%' })
    if (!out.valid) throw new Error('expected valid')
    expect(out.doseGram).toBe(2)
    expect(out.volumeMl).toBe(20)
  })

  it('gives a smaller volume for a more concentrated fluid at the same dose', () => {
    const out = calculateDextrose({ weight: 10, dosePerKg: 0.2, concentration: 'D40%' })
    if (!out.valid) throw new Error('expected valid')
    expect(out.doseGram).toBe(2)
    expect(out.volumeMl).toBe(5)
  })

  it('gives a larger volume for a more dilute fluid at the same dose', () => {
    const out = calculateDextrose({ weight: 10, dosePerKg: 0.2, concentration: 'D5%' })
    if (!out.valid) throw new Error('expected valid')
    expect(out.volumeMl).toBe(40)
  })

  it('handles low-weight neonatal doses', () => {
    const out = calculateDextrose({ weight: 3, dosePerKg: 0.2, concentration: 'D10%' })
    if (!out.valid) throw new Error('expected valid')
    expect(out.doseGram).toBe(0.6)
    expect(out.volumeMl).toBe(6)
  })

  it('returns an error for invalid weight', () => {
    const out = calculateDextrose({ weight: 0, dosePerKg: 0.2, concentration: 'D10%' })
    expect(out.valid).toBe(false)
  })

  it('returns an error for invalid dose', () => {
    const out = calculateDextrose({ weight: 10, dosePerKg: 0, concentration: 'D10%' })
    expect(out.valid).toBe(false)
  })
})
