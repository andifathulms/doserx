import { describe, it, expect } from 'vitest'
import { calculateFluidRate } from './calculateFluidRate'

describe('calculateFluidRate — Holliday-Segar', () => {
  it('uses the first tier only under 10kg', () => {
    const out = calculateFluidRate({ weight: 8 })
    if (!out.valid) throw new Error('expected valid')
    expect(out.ratePerHr).toBe(32) // 8 x 4
  })

  it('adds the second tier between 10 and 20kg', () => {
    const out = calculateFluidRate({ weight: 15 })
    if (!out.valid) throw new Error('expected valid')
    expect(out.ratePerHr).toBe(50) // 10x4 + 5x2
  })

  it('adds the third tier above 20kg', () => {
    const out = calculateFluidRate({ weight: 25 })
    if (!out.valid) throw new Error('expected valid')
    expect(out.ratePerHr).toBe(65) // 10x4 + 10x2 + 5x1
  })

  it('computes drip rate for all three set types', () => {
    const out = calculateFluidRate({ weight: 25 })
    if (!out.valid) throw new Error('expected valid')
    expect(out.dropsMacro).toBe(21.7) // 65/60*20
    expect(out.dropsMicro).toBe(65) // 65/60*60
    expect(out.dropsTransfusion).toBe(16.3) // 65/60*15
  })

  it('honours a manual mL/kg/hr override instead of Holliday-Segar', () => {
    const out = calculateFluidRate({ weight: 20, manualRatePerKgHr: 5 })
    if (!out.valid) throw new Error('expected valid')
    expect(out.ratePerHr).toBe(100)
  })

  it('returns an error for invalid weight', () => {
    const out = calculateFluidRate({ weight: 0 })
    expect(out.valid).toBe(false)
  })

  it('returns an error for a zero manual rate', () => {
    const out = calculateFluidRate({ weight: 20, manualRatePerKgHr: 0 })
    expect(out.valid).toBe(false)
  })
})
