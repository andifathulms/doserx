import {
  DosePositionBandInput,
  ZONE_LABEL,
  computeDosePositionBand,
  describeDosePositionBand,
} from '../lib/dosePositionBand'

interface DosePositionBandCompactProps extends DosePositionBandInput {
  drugName: string
}

/**
 * DosePositionBand's Puyer row variant (DESIGN-REWORK.md §3.8) — a full-size
 * band per drug would swamp a multi-drug recipe, so this drops to 12px, no
 * zone labels and no marker-value text per row (the shared
 * DosePositionBandLegend above the list states the four zones once instead).
 * Same geometry, same accessible description as the full band — only the
 * visual density changes.
 *
 * A rangeMin hairline is added (the full band doesn't need one — its zone
 * boundary and label already mark that spot unambiguously). It exists so
 * the eye has SOME landmark scanning down a column of bars whose scales all
 * differ per drug; it is not a claim that hairlines — or marker positions —
 * line up meaningfully between rows.
 *
 * A drug with no published range renders a plain dash in the same slot
 * instead of nothing, so a missing band reads as "no data for this drug,"
 * not as a layout glitch.
 */
export function DosePositionBandCompact({ drugName, ...input }: DosePositionBandCompactProps) {
  const band = computeDosePositionBand(input)
  if (!band) {
    return (
      <span className="dose-band-compact-missing" aria-label={`${drugName}: rentang dosis belum tersedia`}>
        —
      </span>
    )
  }

  const { domainMin, domainMax, zones, capAt, marker } = band
  const span = domainMax - domainMin
  const pct = (v: number) => `${((v - domainMin) / span) * 100}%`
  const desc = `${drugName}: ${describeDosePositionBand(band, input)}`

  return (
    <div className="dose-band-compact" role="img" aria-label={desc}>
      {zones.map((zone, i) => (
        <div
          key={i}
          className={`dose-band-compact__zone dose-band-compact__zone--${zone.kind}`}
          style={{ flexBasis: `${((zone.to - zone.from) / span) * 100}%` }}
        />
      ))}

      <div className="dose-band-compact__hairline" style={{ left: pct(input.rangeMin!) }} />

      {capAt != null && <div className="dose-band-compact__wall" style={{ left: pct(capAt) }} />}

      <div
        className={`dose-band-compact__marker${marker.offScale ? ` dose-band-compact__marker--offscale-${marker.offScale}` : ''}`}
        style={{ left: `${marker.position * 100}%` }}
      />
    </div>
  )
}

/** Stated once above the Puyer recipe list — see DosePositionBandCompact's
 *  doc comment for why the per-row bands drop their own labels. Not
 *  aria-hidden: unlike the full band's caption (redundant with its own
 *  role="img" description), this is the ONLY place the zone meanings are
 *  stated for the whole list, so a screen-reader user needs it too. */
export function DosePositionBandLegend() {
  return (
    <p className="dose-band-legend">
      <span className="dose-band-legend__label">Skala per obat:</span>
      {(['below', 'typical', 'above', 'over-cap'] as const).map((kind) => (
        <span key={kind} className="dose-band-legend__item">
          <span className={`dose-band-legend__swatch dose-band-legend__swatch--${kind}`} aria-hidden="true" />
          {ZONE_LABEL[kind]}
        </span>
      ))}
    </p>
  )
}
