import { describe, it, expect } from 'vitest'
import { computeDosePositionBand } from './dosePositionBand'

describe('computeDosePositionBand — no published range', () => {
  it('returns null when rangeMin/rangeMax are missing — no inferred band', () => {
    expect(
      computeDosePositionBand({
        dosePerKgPerDay: 12,
        rangeMin: undefined,
        rangeMax: undefined,
        weightKg: 20,
      }),
    ).toBeNull()
  })

  it('returns null when only one bound is published', () => {
    expect(
      computeDosePositionBand({
        dosePerKgPerDay: 12,
        rangeMin: 10,
        rangeMax: undefined,
        weightKg: 20,
      }),
    ).toBeNull()
  })
})

describe('computeDosePositionBand — no cap', () => {
  it('scales the domain to 1.8x rangeMax and yields three zones', () => {
    const band = computeDosePositionBand({
      dosePerKgPerDay: 12,
      rangeMin: 10,
      rangeMax: 15,
      weightKg: 20,
    })
    expect(band).not.toBeNull()
    if (!band) return
    expect(band.domainMin).toBe(0)
    expect(band.domainMax).toBe(27) // 15 * 1.8
    expect(band.capAt).toBeUndefined()
    expect(band.zones.map((z) => z.kind)).toEqual(['below', 'typical', 'above'])
    expect(band.zones[0]).toEqual({ kind: 'below', from: 0, to: 10 })
    expect(band.zones[1]).toEqual({ kind: 'typical', from: 10, to: 15 })
    expect(band.zones[2]).toEqual({ kind: 'above', from: 15, to: 27 })
  })

  it('positions the marker as a fraction of the domain', () => {
    const band = computeDosePositionBand({
      dosePerKgPerDay: 13.5,
      rangeMin: 10,
      rangeMax: 15,
      weightKg: 20,
    })
    if (!band) throw new Error('expected a band')
    expect(band.marker.value).toBe(13.5)
    expect(band.marker.position).toBeCloseTo(13.5 / 27, 10)
    expect(band.marker.offScale).toBeNull()
  })

  it('holds the domain fixed across a dose override at the same weight', () => {
    const typical = computeDosePositionBand({
      dosePerKgPerDay: 12.5,
      rangeMin: 10,
      rangeMax: 15,
      weightKg: 20,
    })
    const atMax = computeDosePositionBand({
      dosePerKgPerDay: 15,
      rangeMin: 10,
      rangeMax: 15,
      weightKg: 20,
    })
    if (!typical || !atMax) throw new Error('expected bands')
    expect(atMax.domainMax).toBe(typical.domainMax)
    expect(atMax.zones).toEqual(typical.zones)
    expect(atMax.marker.position).not.toBe(typical.marker.position)
  })
})

describe('computeDosePositionBand — with a fixed daily cap', () => {
  it('places the wall at maxDailyCap / weightKg, not at a weight', () => {
    // e.g. maxDay 500mg, this patient 20kg -> the cap reads as 25 mg/kg/day
    // for THIS patient, well past the typical 10-15 range.
    const band = computeDosePositionBand({
      dosePerKgPerDay: 12,
      rangeMin: 10,
      rangeMax: 15,
      maxDailyCap: 500,
      capFromWeightKg: 33.3,
      weightKg: 20,
    })
    if (!band) throw new Error('expected a band')
    expect(band.capAt).toBe(25)
    expect(band.domainMax).toBe(30) // 25 * 1.2, NOT rangeMax * 1.8
    expect(band.zones.map((z) => z.kind)).toEqual(['below', 'typical', 'above', 'over-cap'])
    expect(band.zones[band.zones.length - 1]).toEqual({ kind: 'over-cap', from: 25, to: 30 })
  })

  it('shows the cap annotation once weight is within 20% of the crossover, not before', () => {
    // capFromWeightKg = 33.3kg (500 / 15 mg/kg/day)
    const farBelow = computeDosePositionBand({
      dosePerKgPerDay: 15,
      rangeMin: 10,
      rangeMax: 15,
      maxDailyCap: 500,
      capFromWeightKg: 33.3,
      weightKg: 20, // 20 < 33.3 * 0.8 = 26.64
    })
    const withinTwentyPercent = computeDosePositionBand({
      dosePerKgPerDay: 15,
      rangeMin: 10,
      rangeMax: 15,
      maxDailyCap: 500,
      capFromWeightKg: 33.3,
      weightKg: 27, // 27 >= 26.64
    })
    const atCrossover = computeDosePositionBand({
      dosePerKgPerDay: 15,
      rangeMin: 10,
      rangeMax: 15,
      maxDailyCap: 500,
      capFromWeightKg: 33.3,
      weightKg: 33.3,
    })
    if (!farBelow || !withinTwentyPercent || !atCrossover) throw new Error('expected bands')
    expect(farBelow.showCapAnnotation).toBe(false)
    expect(withinTwentyPercent.showCapAnnotation).toBe(true)
    expect(atCrossover.showCapAnnotation).toBe(true)
  })

  it('collapses the "above" zone without producing a negative-width one when a heavy patient pushes the cap below rangeMax', () => {
    // maxDay 500mg at 60kg -> cap reads as 8.3 mg/kg/day for this patient,
    // BELOW the typical 10-15 range: the fixed ceiling binds before the
    // per-kg range would even reach its low end.
    const band = computeDosePositionBand({
      dosePerKgPerDay: 12,
      rangeMin: 10,
      rangeMax: 15,
      maxDailyCap: 500,
      weightKg: 60,
    })
    if (!band) throw new Error('expected a band')
    expect(band.capAt).toBeCloseTo(8.333, 2)
    // No zone may have a negative or zero width, and every boundary must be
    // non-decreasing left to right.
    for (const zone of band.zones) expect(zone.to).toBeGreaterThan(zone.from)
    for (let i = 1; i < band.zones.length; i++) {
      expect(band.zones[i].from).toBeGreaterThanOrEqual(band.zones[i - 1].to)
    }
    expect(band.zones.some((z) => z.kind === 'over-cap')).toBe(true)
    // "above" (rangeMax -> cap) cannot exist when the cap sits below rangeMax.
    expect(band.zones.some((z) => z.kind === 'above')).toBe(false)
  })
})

describe('computeDosePositionBand — off-scale', () => {
  it('flags a dose far beyond the domain instead of silently clamping it', () => {
    // The exact failure mode DESIGN-REWORK.md §3.4 calls out: a weight typed
    // into the dose field renders a dose ~13x the domain ceiling.
    const band = computeDosePositionBand({
      dosePerKgPerDay: 180,
      rangeMin: 10,
      rangeMax: 15,
      weightKg: 20,
    })
    if (!band) throw new Error('expected a band')
    expect(band.marker.offScale).toBe('high')
    // The real value is preserved for the label...
    expect(band.marker.value).toBe(180)
    // ...even though the render position pins to the edge.
    expect(band.marker.position).toBe(1)
  })

  it('is never triggered by an ordinary in-range dose', () => {
    const band = computeDosePositionBand({
      dosePerKgPerDay: 12,
      rangeMin: 10,
      rangeMax: 15,
      weightKg: 20,
    })
    if (!band) throw new Error('expected a band')
    expect(band.marker.offScale).toBeNull()
  })
})
