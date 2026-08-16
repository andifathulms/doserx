/**
 * Geometry for DosePositionBand (DESIGN-REWORK.md §3) — where a computed
 * dose falls, in mg/kg/day, relative to a drug's published range and its
 * fixed ceiling. Pure math over values calculate.ts and DrugPreset already
 * expose; nothing here is a new clinical rule and no CalcResult field is
 * recomputed — this only reprojects them onto a chart's coordinate space.
 */

export interface DosePositionBandInput {
  /** mg/kg/day actually used for this calculation — the value calculate.ts
   *  received as `dosePerKg`. Positions the marker. */
  dosePerKgPerDay: number
  /** The drug's published mg/kg/day range. No band without both — see
   *  computeDosePositionBand's null return. */
  rangeMin: number | undefined
  rangeMax: number | undefined
  /** Fixed mg/day ceiling, if this drug has one (DrugPreset.maxDay). */
  maxDailyCap?: number
  /** Weight at which maxDailyCap starts binding AT THE CURRENT dosePerKg —
   *  CalcResult.capFromWeightKg, already computed. Used only for the inline
   *  "berlaku sejak X kg" annotation next to the wall, never for positioning
   *  it: capFromWeightKg moves with every dose override, and a wall that
   *  moved with it would stop being a fixed reference. */
  capFromWeightKg?: number
  /** This patient's weight (kg). */
  weightKg: number
}

export type BandZoneKind = 'below' | 'typical' | 'above' | 'over-cap'

export interface BandZone {
  kind: BandZoneKind
  /** mg/kg/day bounds, already clipped to [domainMin, domainMax]. */
  from: number
  to: number
}

export interface DosePositionBandGeometry {
  domainMin: number
  domainMax: number
  /** Left to right, contiguous, covering the full domain. */
  zones: BandZone[]
  /** mg/kg/day position of the fixed-ceiling wall, if this drug has one. */
  capAt?: number
  /** Show the "berlaku sejak X kg" annotation next to the wall — only when
   *  this patient's weight is within 20% of capFromWeightKg or past it
   *  (DESIGN-REWORK.md §3.3); otherwise the wall stands alone. */
  showCapAnnotation: boolean
  marker: {
    /** The real value — never altered, even when off-scale. */
    value: number
    /** 0..1 fraction along the domain, clamped to [0, 1] for rendering. */
    position: number
    /** Set when `value` falls outside the domain. The marker still pins to
     *  the nearest edge for rendering, but MUST render as an off-scale
     *  arrow with the real value labelled — never silently as an ordinary
     *  in-range marker (DESIGN-REWORK.md §3.4, §12). */
    offScale: 'low' | 'high' | null
  }
}

/**
 * Domain depends only on the drug's own published numbers (and this
 * patient's weight, which the cap's mg/kg-equivalent position necessarily
 * depends on — see capAt below) — never on the dosePerKgPerDay being
 * plotted. Trying Minimum/Tipikal/Maksimum at a fixed weight moves only the
 * marker; the scale itself holds still.
 */
function computeDomain(rangeMax: number, capAt: number | undefined): { domainMin: number; domainMax: number } {
  return { domainMin: 0, domainMax: capAt != null ? capAt * 1.2 : rangeMax * 1.8 }
}

function classifyZone(
  midpoint: number,
  rangeMin: number,
  rangeMax: number,
  capAt: number | undefined,
): BandZoneKind {
  if (capAt != null && midpoint >= capAt) return 'over-cap'
  if (midpoint >= rangeMax) return 'above'
  if (midpoint >= rangeMin) return 'typical'
  return 'below'
}

/**
 * Builds zones from the sorted, deduplicated boundary points rather than
 * assuming a fixed left-to-right order of rangeMin / rangeMax / capAt — a
 * heavy enough patient can push capAt (the cap's mg/kg-equivalent for THIS
 * weight) below rangeMax, or even below rangeMin, which is exactly the
 * clinical situation where the fixed ceiling binds before the typical
 * per-kg range would. That ordering still has to produce a valid, honest
 * set of non-overlapping zones instead of a negative-width one.
 */
function buildZones(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
  capAt: number | undefined,
): BandZone[] {
  const raw = [domainMin, rangeMin, rangeMax, domainMax]
  if (capAt != null) raw.push(capAt)

  const points = [...new Set(raw.filter((p) => p >= domainMin && p <= domainMax))].sort(
    (a, b) => a - b,
  )

  const zones: BandZone[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    if (to <= from) continue
    zones.push({ kind: classifyZone((from + to) / 2, rangeMin, rangeMax, capAt), from, to })
  }
  return zones
}

export function computeDosePositionBand(
  input: DosePositionBandInput,
): DosePositionBandGeometry | null {
  const { dosePerKgPerDay, rangeMin, rangeMax, maxDailyCap, capFromWeightKg, weightKg } = input

  // No published range, no band — not one drawn around an inferred or
  // single-point range (DESIGN-REWORK.md §3.7, §12).
  if (rangeMin == null || rangeMax == null) return null

  // The cap is a fixed mg/day ceiling; the chart's axis is mg/kg/day. The
  // only honest way to place it on that axis is to ask what mg/kg/day WOULD
  // reach it for this patient's actual weight.
  const capAt = maxDailyCap != null && weightKg > 0 ? maxDailyCap / weightKg : undefined

  const { domainMin, domainMax } = computeDomain(rangeMax, capAt)
  const zones = buildZones(domainMin, domainMax, rangeMin, rangeMax, capAt)

  const showCapAnnotation = capFromWeightKg != null && weightKg >= capFromWeightKg * 0.8

  let offScale: 'low' | 'high' | null = null
  if (dosePerKgPerDay < domainMin) offScale = 'low'
  else if (dosePerKgPerDay > domainMax) offScale = 'high'

  const clamped = Math.min(Math.max(dosePerKgPerDay, domainMin), domainMax)
  const position = domainMax > domainMin ? (clamped - domainMin) / (domainMax - domainMin) : 0

  return {
    domainMin,
    domainMax,
    zones,
    capAt,
    showCapAnnotation,
    marker: { value: dosePerKgPerDay, position, offScale },
  }
}
