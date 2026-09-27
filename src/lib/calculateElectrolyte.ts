/**
 * Electrolyte corrections — pure, like every other engine: no DOM, no React,
 * a step trail for the derivation line, and a typed error instead of NaN.
 *
 * These encode clinical rules (bolus volumes, correction ceilings,
 * concentration limits), reviewed and approved 27 Sep 2026. The constants
 * are named and cited here so any future change is checked in one place.
 */

export interface ElectrolyteStep {
  expression: string
  result: string
}

export interface ElectrolyteError {
  valid: false
  error: string
}

const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d

/** NaCl 3% = 30 g/L ÷ 58.44 g/mol = 513 mEq/L. */
export const NACL3_MEQ_PER_ML = 0.513
/** Symptomatic hyponatraemia: 2 mL/kg of 3% (max 100 mL) per bolus, up to
 *  3 boluses — ≈ +2 mEq/L each. (Moritz & Ayus; ESE 2014.) */
export const NA_BOLUS_ML_PER_KG = 2
export const NA_BOLUS_MAX_ML = 100
/** Ceiling on correction: ≤ 8–10 mEq/L in 24 h (ODS risk). */
export const NA_MAX_RISE_PER_24H = 8

export interface SodiumBolusResult {
  valid: true
  volumeMl: number
  sodiumMeq: number
  capped: boolean
  steps: ElectrolyteStep[]
}

export function sodiumBolus(weight: number): SodiumBolusResult | ElectrolyteError {
  if (!isFinite(weight) || weight <= 0) return { valid: false, error: 'Masukkan berat badan yang valid.' }
  const raw = NA_BOLUS_ML_PER_KG * weight
  const volumeMl = round(Math.min(raw, NA_BOLUS_MAX_ML))
  const steps: ElectrolyteStep[] = [
    { expression: `${NA_BOLUS_ML_PER_KG} mL/kg × ${weight} kg`, result: `${round(raw)} mL` },
  ]
  if (raw > NA_BOLUS_MAX_ML) steps.push({ expression: `maks ${NA_BOLUS_MAX_ML} mL`, result: `${volumeMl} mL` })
  const sodiumMeq = round(volumeMl * NACL3_MEQ_PER_ML)
  steps.push({ expression: `${volumeMl} mL × ${NACL3_MEQ_PER_ML} mEq/mL (NaCl 3%)`, result: `${sodiumMeq} mEq Na` })
  return { valid: true, volumeMl, sodiumMeq, capped: raw > NA_BOLUS_MAX_ML, steps }
}

export interface SodiumDeficitInput {
  weight: number
  current: number
  target: number
  /** Total-body-water fraction: 0.6 child/adult man, 0.5 woman/elderly. */
  tbwFraction: number
}

export interface SodiumDeficitResult {
  valid: true
  deficitMeq: number
  volumeMl: number
  /** Minimum hours to stay within NA_MAX_RISE_PER_24H. */
  minHours: number
  rateMlPerHr: number
  steps: ElectrolyteStep[]
}

export function sodiumDeficit(input: SodiumDeficitInput): SodiumDeficitResult | ElectrolyteError {
  const { weight, current, target, tbwFraction } = input
  if (!isFinite(weight) || weight <= 0) return { valid: false, error: 'Masukkan berat badan yang valid.' }
  if (!isFinite(current) || current < 90 || current > 160)
    return { valid: false, error: 'Na saat ini harus antara 90 dan 160 mEq/L.' }
  if (!isFinite(target) || target <= current || target > 145)
    return { valid: false, error: 'Target Na harus di atas Na saat ini dan tidak lebih dari 145 mEq/L.' }
  const rise = target - current
  const tbw = tbwFraction * weight
  const deficitMeq = round(tbw * rise)
  const volumeMl = round(deficitMeq / NACL3_MEQ_PER_ML)
  const minHours = round((rise / NA_MAX_RISE_PER_24H) * 24, 0)
  const rateMlPerHr = round(volumeMl / Math.max(minHours, 1))
  return {
    valid: true,
    deficitMeq,
    volumeMl,
    minHours,
    rateMlPerHr,
    steps: [
      { expression: `${tbwFraction} × ${weight} kg`, result: `${round(tbw)} L cairan tubuh total` },
      { expression: `${round(tbw)} L × (${target} − ${current}) mEq/L`, result: `${deficitMeq} mEq Na` },
      { expression: `${deficitMeq} mEq ÷ ${NACL3_MEQ_PER_ML} mEq/mL`, result: `${volumeMl} mL NaCl 3%` },
      {
        expression: `naik ${rise} mEq/L, maks ${NA_MAX_RISE_PER_24H} mEq/L per 24 jam`,
        result: `≥ ${minHours} jam (≈ ${rateMlPerHr} mL/jam)`,
      },
    ],
  }
}

/** KCl 7.46% = 1 mEq/mL; KCl 15% ≈ 2 mEq/mL. */
export const KCL_MAX_MEQ_PER_KG_HR = 0.5
/** Peripheral line limit; central lines allow more, under monitoring. */
export const KCL_PERIPHERAL_MAX_MEQ_PER_L = 40
export const KCL_ABSOLUTE_MAX_MEQ_PER_L = 80
export const KCL_MAX_DOSE_MEQ = 40

export interface PotassiumInput {
  weight: number
  /** Total dose, mEq/kg (0.5–1 typical). */
  meqPerKg: number
  hours: number
  bagMl: number
  /** mEq/mL of the concentrate in hand: 1 (KCl 7.46%) or 2 (KCl 15%). */
  stockMeqPerMl: number
}

export interface PotassiumResult {
  valid: true
  doseMeq: number
  cappedDose: boolean
  kclMl: number
  finalMeqPerL: number
  rateMlPerHr: number
  rateMeqPerKgHr: number
  /** Concentration exceeds the peripheral limit (needs a central line). */
  tooConcentratedPeripheral: boolean
  /** Concentration exceeds the absolute limit — must not be given. */
  tooConcentrated: boolean
  tooFast: boolean
  steps: ElectrolyteStep[]
}

export function potassiumCorrection(input: PotassiumInput): PotassiumResult | ElectrolyteError {
  const { weight, meqPerKg, hours, bagMl, stockMeqPerMl } = input
  if (!isFinite(weight) || weight <= 0) return { valid: false, error: 'Masukkan berat badan yang valid.' }
  if (!isFinite(meqPerKg) || meqPerKg <= 0) return { valid: false, error: 'Masukkan dosis mEq/kg yang valid.' }
  if (!isFinite(hours) || hours <= 0) return { valid: false, error: 'Masukkan lama pemberian (jam) yang valid.' }
  if (!isFinite(bagMl) || bagMl <= 0) return { valid: false, error: 'Masukkan volume cairan pelarut yang valid.' }
  if (!isFinite(stockMeqPerMl) || stockMeqPerMl <= 0) return { valid: false, error: 'Pilih konsentrasi KCl.' }

  const raw = meqPerKg * weight
  const doseMeq = round(Math.min(raw, KCL_MAX_DOSE_MEQ))
  const kclMl = round(doseMeq / stockMeqPerMl)
  const finalMeqPerL = round((doseMeq / (bagMl + kclMl)) * 1000)
  const rateMlPerHr = round((bagMl + kclMl) / hours)
  const rateMeqPerKgHr = round(doseMeq / hours / weight, 2)

  const steps: ElectrolyteStep[] = [
    { expression: `${meqPerKg} mEq/kg × ${weight} kg`, result: `${round(raw)} mEq` },
  ]
  if (raw > KCL_MAX_DOSE_MEQ) steps.push({ expression: `maks ${KCL_MAX_DOSE_MEQ} mEq per pemberian`, result: `${doseMeq} mEq` })
  steps.push(
    { expression: `${doseMeq} mEq ÷ ${stockMeqPerMl} mEq/mL`, result: `${kclMl} mL KCl` },
    { expression: `${doseMeq} mEq ÷ (${bagMl} + ${kclMl}) mL × 1000`, result: `${finalMeqPerL} mEq/L` },
    { expression: `${round(bagMl + kclMl)} mL ÷ ${hours} jam`, result: `${rateMlPerHr} mL/jam` },
    { expression: `${doseMeq} mEq ÷ ${hours} jam ÷ ${weight} kg`, result: `${rateMeqPerKgHr} mEq/kg/jam` },
  )

  return {
    valid: true,
    doseMeq,
    cappedDose: raw > KCL_MAX_DOSE_MEQ,
    kclMl,
    finalMeqPerL,
    rateMlPerHr,
    rateMeqPerKgHr,
    tooConcentratedPeripheral: finalMeqPerL > KCL_PERIPHERAL_MAX_MEQ_PER_L,
    tooConcentrated: finalMeqPerL > KCL_ABSOLUTE_MAX_MEQ_PER_L,
    tooFast: rateMeqPerKgHr > KCL_MAX_MEQ_PER_KG_HR,
    steps,
  }
}
