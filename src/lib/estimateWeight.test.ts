import { describe, it, expect } from 'vitest'
import { estimateWeight } from './estimateWeight'

describe('estimateWeight', () => {
  it('uses the infant formula and says so', () => {
    const e = estimateWeight(0, 6)
    expect(e).toEqual({
      kg: 7,                       // 6/2 + 4
      formula: 'APLS (0–12 bln)',
      expression: '(6 bln ÷ 2) + 4',
    })
  })

  it('uses the 1–10 formula and says so', () => {
    const e = estimateWeight(5, 0)
    expect(e).toEqual({
      kg: 18,                      // 2 x (5 + 4)
      formula: 'APLS (1–10 th)',
      expression: '2 × (5 th + 4)',
    })
  })

  it('switches attribution above 10 years — not every band is APLS', () => {
    const e = estimateWeight(12, 0)
    expect(e?.kg).toBe(43)         // 3 x 12 + 7
    expect(e?.formula).toBe('Luscombe & Owens (>10 th)')
    expect(e?.expression).toBe('(3 × 12 th) + 7')
  })

  it('holds the band boundary at exactly 12 months', () => {
    expect(estimateWeight(1, 0)?.formula).toBe('APLS (0–12 bln)')
    expect(estimateWeight(1, 1)?.formula).toBe('APLS (1–10 th)')
  })

  it('returns null for adults and for non-positive ages', () => {
    expect(estimateWeight(18, 0)).toBeNull()
    expect(estimateWeight(0, 0)).toBeNull()
  })

  it('keeps the stated arithmetic consistent with the returned kg', () => {
    const e = estimateWeight(3, 0)!
    expect(e.kg).toBe(2 * (3 + 4))
  })
})
