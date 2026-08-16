import {
  DosePositionBandInput,
  ZONE_LABEL,
  computeDosePositionBand,
  describeDosePositionBand,
  trimNum,
} from '../lib/dosePositionBand'

interface DosePositionBandProps extends DosePositionBandInput {}

/**
 * DosePositionBand — DESIGN-REWORK.md §3. Shows WHERE a computed dose falls
 * on the drug's published mg/kg/day scale, relative to its typical range and
 * fixed ceiling. It supplements the numeric values already on screen; it
 * never replaces one, and it never renders without a published range (no
 * inferred or single-point band — see computeDosePositionBand).
 *
 * Positional, never a verdict: zone labels are nouns ("di atas", "batas
 * maks"), never "aman"/"sesuai"/a checkmark. The success tint means "inside
 * the published range," nothing about whether it is right for this patient.
 *
 * Built as plain HTML/CSS rather than SVG so the zone labels are real,
 * zoomable text rather than SVG glyphs that would need their own scaling
 * story at narrow widths. role="img" collapses it to one atomic graphic for
 * assistive tech — DESIGN-REWORK.md's "<desc>" doesn't have an HTML
 * equivalent, so the same one-sentence summary is the element's aria-label
 * instead, and the visual children are aria-hidden. The visible zone labels
 * stay in the accessibility tree's "hidden" branch only — they exist for a
 * sighted reader who has removed colour, which is a separate requirement
 * from what a screen reader announces (§3.6).
 *
 * Not interactive: no tabIndex, no click handler. A readout, not a control.
 */
export function DosePositionBand(props: DosePositionBandProps) {
  const band = computeDosePositionBand(props)
  if (!band) return null

  const { domainMin, domainMax, zones, capAt, showCapAnnotation, marker } = band
  const span = domainMax - domainMin
  const pct = (v: number) => `${((v - domainMin) / span) * 100}%`
  const desc = describeDosePositionBand(band, props)

  return (
    <div className="dose-band" role="img" aria-label={desc}>
      <div className="dose-band__track" aria-hidden="true">
        {zones.map((zone, i) => (
          <div
            key={i}
            className={`dose-band__zone dose-band__zone--${zone.kind}`}
            style={{ flexBasis: `${((zone.to - zone.from) / span) * 100}%` }}
          />
        ))}

        {capAt != null && (
          <div className="dose-band__wall" style={{ left: pct(capAt) }}>
            {showCapAnnotation && (
              <span className="dose-band__wall-note">berlaku sejak {trimNum(props.weightKg)} kg</span>
            )}
          </div>
        )}

        <div
          className={`dose-band__marker${marker.offScale ? ` dose-band__marker--offscale-${marker.offScale}` : ''}`}
          style={{ left: `${marker.position * 100}%` }}
        >
          <span className="dose-band__marker-value">
            {marker.offScale ? `${trimNum(marker.value)} ↦` : trimNum(marker.value)}
          </span>
          <span className="dose-band__marker-dot" />
        </div>
      </div>

      <div className="dose-band__labels" aria-hidden="true">
        {zones.map((zone, i) => (
          <span
            key={i}
            className="dose-band__label"
            style={{ flexBasis: `${((zone.to - zone.from) / span) * 100}%` }}
          >
            {ZONE_LABEL[zone.kind]}
          </span>
        ))}
      </div>

      <p className="dose-band__caption" aria-hidden="true">
        Posisi dosis pada skala mg/kg/hari yang dipublikasikan untuk obat ini — bukan penilaian
        aman/tidak aman.
      </p>
    </div>
  )
}
