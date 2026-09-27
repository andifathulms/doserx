/**
 * Dose steps for a drip's titration table — the chart taped to an ICU pump,
 * computed for this patient and this dilution. Pure; the rates themselves
 * come from calculateInfusion(), never from here.
 *
 * Steps run from the published minimum to maximum, always include the
 * default, and are rounded to two significant figures so every row is a dose
 * someone would actually set (5, 7.5, 10 — not 7.43).
 */
export function titrationSteps(min: number, max: number, dflt: number, count = 6): number[] {
  if (!(isFinite(min) && isFinite(max) && min > 0 && max > min)) return []
  const out = new Set<number>([nice(min), nice(max)])
  if (isFinite(dflt) && dflt >= min && dflt <= max) out.add(nice(dflt))
  // Wide ranges (norepinefrin 0.01–2) step geometrically; narrow ones evenly.
  const geometric = max / min > 20
  for (let i = 1; i < count - 1; i++) {
    const t = i / (count - 1)
    const v = geometric ? min * Math.pow(max / min, t) : min + (max - min) * t
    out.add(nice(v))
  }
  return [...out].filter((v) => v >= min && v <= max).sort((a, b) => a - b)
}

/** Two significant figures, snapped to a 1–2–2.5–5 ladder where close. */
function nice(v: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const norm = v / mag
  const ladder = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10]
  const snapped = ladder.reduce((best, x) => (Math.abs(x - norm) < Math.abs(best - norm) ? x : best), ladder[0])
  return Math.round(snapped * mag * 1e6) / 1e6
}
