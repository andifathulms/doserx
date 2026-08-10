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
    result: `${round(rawDailyDose, 1)} mg/hari`,
  })

  const hasMaxDay = maxDay != null && isFinite(maxDay) && maxDay > 0
  if (hasMaxDay && dailyDose > maxDay!) {
    dailyDose = maxDay!
    cappedByMaxDay = true
    steps.push({
      kind: 'capDay',
      expression: `${round(rawDailyDose, 1)} mg/hari melebihi maks ${trim(maxDay!)} mg/hari`,
      result: `${trim(maxDay!)} mg/hari`,
    })
  }

  const rawPerDose = dailyDose / freq
  let perDose = rawPerDose
  let cappedByMaxSingle = false

  steps.push({
    kind: 'perDose',
    expression: `${round(dailyDose, 1)} mg/hari ÷ ${trim(freq)}× sehari`,
    result: `${round(rawPerDose, 1)} mg/kali`,
  })

  const hasMaxSingle = maxSingle != null && isFinite(maxSingle) && maxSingle > 0
  if (hasMaxSingle && perDose > maxSingle!) {
    perDose = maxSingle!
    cappedByMaxSingle = true
    steps.push({
      kind: 'capSingle',
      expression: `${round(rawPerDose, 1)} mg/kali melebihi maks ${trim(maxSingle!)} mg/kali`,
      result: `${trim(maxSingle!)} mg/kali`,
    })
  }

  const result: CalcResult = {
    dailyDose: round(dailyDose, 1),
    perDose: round(perDose, 1),
    cappedByMaxDay,
    cappedByMaxSingle,
    steps,
    valid: true,
  }

  if (cappedByMaxDay || cappedByMaxSingle) {
    result.uncappedDailyDose = round(rawDailyDose, 1)
    // What the per-dose would have been with no cap anywhere in the chain.
    result.uncappedPerDose = round(rawDailyDose / freq, 1)
  }

  // Weight at which the first applicable cap starts binding. Both ceilings are
  // linear in weight, so this is exact arithmetic, not an estimate.
  const capWeights: number[] = []
  if (hasMaxDay) capWeights.push(maxDay! / dosePerKg)
  if (hasMaxSingle) capWeights.push((maxSingle! * freq) / dosePerKg)
  if (capWeights.length > 0) {
    result.capFromWeightKg = round(Math.min(...capWeights), 1)
  }

  if (concentration != null && isFinite(concentration) && concentration > 0) {
    const volume = round(perDose / concentration, 2)
    result.volume = volume
    steps.push({
      kind: 'volume',
      expression: `${round(perDose, 1)} mg/kali ÷ ${trim(concentration)} mg/mL`,
      result: `${volume} mL`,
    })
  }

  return result
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/** Drops trailing zeros so inputs read as typed: 30 not 30.0, 2.5 stays 2.5. */
function trim(value: number): string {
  return String(round(value, 2))
}
