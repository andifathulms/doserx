import { describe, it, expect } from 'vitest'
import { calculate } from './calculate'

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
