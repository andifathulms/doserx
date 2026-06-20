export interface CalcInput {
  weight: number
  dosePerKg: number
  freq: number
  maxDay?: number
  maxSingle?: number
  concentration?: number
}

export interface CalcResult {
  dailyDose: number
  perDose: number
  volume?: number
  cappedByMaxDay: boolean
  cappedByMaxSingle: boolean
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

  let dailyDose = weight * dosePerKg
  let cappedByMaxDay = false

  if (maxDay != null && isFinite(maxDay) && maxDay > 0 && dailyDose > maxDay) {
    dailyDose = maxDay
    cappedByMaxDay = true
  }

  let perDose = dailyDose / freq
  let cappedByMaxSingle = false

  if (maxSingle != null && isFinite(maxSingle) && maxSingle > 0 && perDose > maxSingle) {
    perDose = maxSingle
    cappedByMaxSingle = true
  }

  const result: CalcResult = {
    dailyDose: round(dailyDose, 1),
    perDose: round(perDose, 1),
    cappedByMaxDay,
    cappedByMaxSingle,
    valid: true,
  }

  if (concentration != null && isFinite(concentration) && concentration > 0) {
    result.volume = round(perDose / concentration, 2)
  }

  return result
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
