/**
 * Weight-based dextrose dose (g/kg) for hypoglycaemia correction, converted
 * to a volume of whichever concentration is on hand.
 */

export type DextroseConcentration = 'D5%' | 'D10%' | 'D40%'

const CONCENTRATION_PERCENT: Record<DextroseConcentration, number> = {
  'D5%': 5,
  'D10%': 10,
  'D40%': 40,
}

export interface DextroseStep {
  expression: string
  result: string
}

export interface DextroseInput {
  weight: number // kg
  dosePerKg: number // g/kg
  concentration: DextroseConcentration
}

export interface DextroseResult {
  valid: true
  doseGram: number
  volumeMl: number
  steps: DextroseStep[]
}

export interface DextroseError {
  valid: false
  error: string
}

export function calculateDextrose(input: DextroseInput): DextroseResult | DextroseError {
  const { weight, dosePerKg, concentration } = input

  if (!isFinite(weight) || weight <= 0) return { valid: false, error: 'Masukkan berat badan yang valid.' }
  if (!isFinite(dosePerKg) || dosePerKg <= 0) return { valid: false, error: 'Masukkan dosis g/kg yang valid.' }

  const percent = CONCENTRATION_PERCENT[concentration]
  const steps: DextroseStep[] = []

  const doseGram = round2(dosePerKg * weight)
  steps.push({ expression: `${dosePerKg} g/kg × ${weight} kg`, result: `${doseGram} g` })

  // percent means grams per 100 mL, so volume = dose / (percent/100).
  const volumeMl = round1((doseGram / percent) * 100)
  steps.push({
    expression: `${doseGram} g ÷ ${percent} g per 100 mL (${concentration})`,
    result: `${volumeMl} mL`,
  })

  return { valid: true, doseGram, volumeMl, steps }
}

function round2(v: number): number { return Math.round(v * 100) / 100 }
function round1(v: number): number { return Math.round(v * 10) / 10 }
