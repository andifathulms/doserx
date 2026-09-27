import { describe, it, expect } from 'vitest'
import { titrationSteps } from './titration'

describe('titrationSteps', () => {
  it('spans min to max and includes the default', () => {
    const s = titrationSteps(2, 20, 5)
    expect(s[0]).toBe(2)
    expect(s[s.length - 1]).toBe(20)
    expect(s).toContain(5)
    expect([...s].sort((a, b) => a - b)).toEqual(s)
  })

  it('steps a wide range geometrically (norepinefrin 0.01–2)', () => {
    const s = titrationSteps(0.01, 2, 0.1)
    expect(s[0]).toBe(0.01)
    expect(s[s.length - 1]).toBe(2)
    expect(s).toContain(0.1)
    expect(s.length).toBeGreaterThanOrEqual(5)
  })

  it('returns nothing for an unusable range', () => {
    expect(titrationSteps(5, 5, 5)).toEqual([])
    expect(titrationSteps(0, 5, 1)).toEqual([])
  })
})
