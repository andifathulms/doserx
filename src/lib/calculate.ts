export interface CalcInput {
  weight: number
  dosePerKg: number
  freq: number
  maxDay?: number
  maxSingle?: number
  concentration?: number
}

/**
 * One link in the derivation chain.
 *
 * The engine emits these so the UI can show its working WITHOUT re-deriving
 * anything: a narration written by hand in a component would drift from the
 * code that produced the number, and a dose you can't trace back to a rule is
 * the one thing this app must never show. `expression` and `result` are
 * display-ready; `kind` lets the UI style a clamp differently from a division.
 */
export interface CalcStep {
  kind: 'daily' | 'capDay' | 'perDose' | 'capSingle' | 'volume'
  expression: string
  result: string
}

export interface CalcResult {
  dailyDose: number
  perDose: number
  volume?: number
  cappedByMaxDay: boolean
  cappedByMaxSingle: boolean
  /** Daily/per-dose figures before any cap applied — only set when one did. */
  uncappedDailyDose?: number
  uncappedPerDose?: number
  /**
   * Weight at which a cap first binds for THIS dose/kg and frequency, i.e.
   * where weight-based dosing stops and a fixed ceiling takes over. Recomputed
   * per calculation because dose/kg is user-overridable — it is never a fixed
   * property of the drug.
   */
  capFromWeightKg?: number
  /** The derivation, in order. Always populated for a valid result. */
  steps: CalcStep[]
  valid: true
}

export interface CalcError {
  valid: false
  error: string
}

export type CalcOutput = CalcResult | CalcError

export function calculate(input: CalcInput): CalcOutput {
  const { weight, dosePerKg, freq, maxDay, maxSingle, concentration } = input

  if (!isFinite(weight) || weight <= 0) {
    return { valid: false, error: 'Weight must be a positive number.' }
  }
  if (!isFinite(dosePerKg) || dosePerKg <= 0) {
    return { valid: false, error: 'Dose/kg must be a positive number.' }
  }
  if (!isFinite(freq) || freq <= 0) {
    return { valid: false, error: 'Frequency must be a positive number.' }
  }

  const steps: CalcStep[] = []

  const rawDailyDose = weight * dosePerKg
  let dailyDose = rawDailyDose
  let cappedByMaxDay = false

  steps.push({
    kind: 'daily',
    expression: `${trim(weight)} kg × ${trim(dosePerKg)} mg/kg/hari`,
    result: `${roundMg(rawDailyDose)} mg/hari`,
  })

  const hasMaxDay = maxDay != null && isFinite(maxDay) && maxDay > 0
  if (hasMaxDay && dailyDose > maxDay!) {
    dailyDose = maxDay!
    cappedByMaxDay = true
    steps.push({
      kind: 'capDay',
      expression: `${roundMg(rawDailyDose)} mg/hari melebihi maks ${trim(maxDay!)} mg/hari`,
      result: `${trim(maxDay!)} mg/hari`,
    })
  }

  const rawPerDose = dailyDose / freq
  let perDose = rawPerDose
  let cappedByMaxSingle = false

  steps.push({
    kind: 'perDose',
    expression: `${roundMg(dailyDose)} mg/hari ÷ ${trim(freq)}× sehari`,
    result: `${roundMg(rawPerDose)} mg/kali`,
  })

  const hasMaxSingle = maxSingle != null && isFinite(maxSingle) && maxSingle > 0
  if (hasMaxSingle && perDose > maxSingle!) {
    perDose = maxSingle!
    cappedByMaxSingle = true
    steps.push({
      kind: 'capSingle',
      expression: `${roundMg(rawPerDose)} mg/kali melebihi maks ${trim(maxSingle!)} mg/kali`,
      result: `${trim(maxSingle!)} mg/kali`,
    })
  }

  const result: CalcResult = {
    dailyDose: roundMg(dailyDose),
    perDose: roundMg(perDose),
    cappedByMaxDay,
    cappedByMaxSingle,
    steps,
    valid: true,
  }

  if (cappedByMaxDay || cappedByMaxSingle) {
    result.uncappedDailyDose = roundMg(rawDailyDose)
    // What the per-dose would have been with no cap anywhere in the chain.
    result.uncappedPerDose = roundMg(rawDailyDose / freq)
  }

  // Weight at which the first applicable cap starts binding. Both ceilings are
  // linear in weight, so this is exact arithmetic, not an estimate.
  const capWeights: number[] = []
  if (hasMaxDay) capWeights.push(maxDay! / dosePerKg)
  if (hasMaxSingle) capWeights.push((maxSingle! * freq) / dosePerKg)
  if (capWeights.length > 0) {
    result.capFromWeightKg = round(Math.min(...capWeights), 1) // kg, not mg
  }

  if (concentration != null && isFinite(concentration) && concentration > 0) {
    const volume = round(perDose / concentration, 2)
    result.volume = volume
    steps.push({
      kind: 'volume',
      expression: `${roundMg(perDose)} mg/kali ÷ ${trim(concentration)} mg/mL`,
      result: `${volume} mL`,
    })
  }

  return result
}

/**
 * Rounding for a dose in mg, by magnitude. A fixed one decimal place was
 * wrong for small doses: 0.14 mg of atropine displayed as "0.1 mg" beside a
 * volume computed from the exact 0.14 (0.56 mL of 0.25 mg/mL) — the mg and
 * the mL on the same card disagreed by 40%, and fentanyl's 0.028 mg would
 * have shown as "0 mg". Now:
 *   ≥ 100 mg  → 1 decimal   (233.3)
 *   ≥ 1 mg    → 2 decimals  (7.25)
 *   < 1 mg    → 3 significant figures (0.14, 0.0283)
 * so the mg shown always agrees with the mL shown to the precision a
 * syringe can deliver.
 */
export function roundMg(value: number): number {
  const a = Math.abs(value)
  if (a === 0 || !isFinite(a)) return value
  if (a >= 100) return round(value, 1)
  if (a >= 1) return round(value, 2)
  return round(value, 2 - Math.floor(Math.log10(a)))
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/** Inputs as typed: 30 not 30.0, 2.5 stays 2.5, and a small per-kg dose
 *  (fentanil 0.002 mg/kg) keeps its digits instead of rounding to 0. */
function trim(value: number): string {
  const a = Math.abs(value)
  if (a > 0 && a < 1) return String(round(value, 3 - Math.floor(Math.log10(a))))
  return String(round(value, 2))
}

export interface FixedDoseInput {
  /** mg per administration, as published — not derived from weight. */
  doseMg: number
  freq: number
  maxDay?: number
  concentration?: number
}

/**
 * The adult fixed-dose counterpart of calculate(): many adult regimens are
 * "30 mg IV tiap 8 jam", not mg/kg. Returns the same CalcResult shape so the
 * answer panel, history and copy text need no second code path, with a step
 * trail that says plainly the dose is fixed rather than weight-derived.
 *
 * A daily ceiling still applies: if doseMg × freq exceeds maxDay, the
 * per-dose figure is reduced to maxDay / freq and flagged as capped, exactly
 * as calculate() does for a weight-based dose.
 */
export function calculateFixed(input: FixedDoseInput): CalcOutput {
  const { doseMg, freq, maxDay, concentration } = input

  if (!isFinite(doseMg) || doseMg <= 0) {
    return { valid: false, error: 'Dose must be a positive number.' }
  }
  if (!isFinite(freq) || freq <= 0) {
    return { valid: false, error: 'Frequency must be a positive number.' }
  }

  const steps: CalcStep[] = [
    { kind: 'perDose', expression: 'dosis tetap (tidak berbasis berat)', result: `${trim(doseMg)} mg/kali` },
  ]

  const rawDaily = doseMg * freq
  steps.push({
    kind: 'daily',
    expression: `${trim(doseMg)} mg/kali × ${trim(freq)}× sehari`,
    result: `${roundMg(rawDaily)} mg/hari`,
  })

  let perDose = doseMg
  let dailyDose = rawDaily
  let cappedByMaxDay = false
  if (maxDay != null && isFinite(maxDay) && maxDay > 0 && rawDaily > maxDay) {
    dailyDose = maxDay
    perDose = maxDay / freq
    cappedByMaxDay = true
    steps.push({
      kind: 'capDay',
      expression: `${roundMg(rawDaily)} mg/hari melebihi maks ${trim(maxDay)} mg/hari`,
      result: `${roundMg(perDose)} mg/kali`,
    })
  }

  const result: CalcResult = {
    dailyDose: roundMg(dailyDose),
    perDose: roundMg(perDose),
    cappedByMaxDay,
    cappedByMaxSingle: false,
    steps,
    valid: true,
  }
  if (cappedByMaxDay) {
    result.uncappedDailyDose = roundMg(rawDaily)
    result.uncappedPerDose = roundMg(doseMg)
  }

  if (concentration != null && isFinite(concentration) && concentration > 0) {
    const volume = round(perDose / concentration, 2)
    result.volume = volume
    steps.push({
      kind: 'volume',
      expression: `${roundMg(perDose)} mg/kali ÷ ${trim(concentration)} mg/mL`,
      result: `${volume} mL`,
    })
  }

  return result
}
