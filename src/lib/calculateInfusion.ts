import { InfusionDoseUnit } from '../data/infusionDrugs'

export interface InfusionInput {
  weight: number          // kg
  dose: number            // in doseUnit
  doseUnit: InfusionDoseUnit
  stockConcentration: number  // mcg/mL or mg/mL
  stockUnit: string
  diluentVolume: number   // mL total bag volume
}

/** One link in the infusion derivation, display-ready. See CalcStep. */
export interface InfusionStep {
  expression: string
  result: string
}

export interface InfusionResult {
  valid: true
  ratePerHr: number       // mL/hr
  dropsMacro: number      // drops/min (macro: 20 drops/mL)
  dropsMicro: number      // drops/min (micro: 60 drops/min)
  dosePerHr: number       // normalised to per-hour in same unit magnitude
  dosePerHrUnit: string
  /**
   * The working. This mode hides the app's most error-prone arithmetic — a
   * mg->mcg factor of 1000 and an hr->min factor of 60 — inside a single
   * mL/jam figure, which is exactly how thousand-fold infusion errors survive
   * unnoticed. Every conversion gets its own visible line.
   */
  steps: InfusionStep[]
}

export interface InfusionError {
  valid: false
  error: string
}

export function calculateInfusion(input: InfusionInput): InfusionResult | InfusionError {
  const { weight, dose, doseUnit, stockConcentration, diluentVolume } = input

  if (!isFinite(weight) || weight <= 0) return { valid: false, error: 'Masukkan berat badan yang valid.' }
  if (!isFinite(dose) || dose <= 0) return { valid: false, error: 'Masukkan dosis yang valid.' }
  if (!isFinite(stockConcentration) || stockConcentration <= 0) return { valid: false, error: 'Masukkan konsentrasi stok yang valid.' }
  if (!isFinite(diluentVolume) || diluentVolume <= 0) return { valid: false, error: 'Masukkan volume pelarut yang valid.' }

  const steps: InfusionStep[] = []
  // Base unit after normalisation — mcg for mass drugs, unit for the rest.
  const baseUnit = doseUnit === 'unit/kg/hr' ? 'unit' : 'mcg'

  // Convert everything to mcg/hr or mg/hr per mL stock
  let dosePerMin_perKg: number  // in the unit's base (mcg or mg) per kg per min

  switch (doseUnit) {
    case 'mcg/kg/min':
      dosePerMin_perKg = dose
      break
    case 'mcg/kg/hr':
      dosePerMin_perKg = dose / 60
      steps.push({
        expression: `${dose} mcg/kg/jam ÷ 60 mnt`,
        result: `${round4(dosePerMin_perKg)} mcg/kg/mnt`,
      })
      break
    case 'mg/kg/hr':
      dosePerMin_perKg = (dose * 1000) / 60  // convert mg→mcg, hr→min
      steps.push({
        expression: `${dose} mg/kg/jam × 1000 mcg/mg ÷ 60 mnt`,
        result: `${round4(dosePerMin_perKg)} mcg/kg/mnt`,
      })
      break
    case 'unit/kg/hr':
      dosePerMin_perKg = dose / 60
      steps.push({
        expression: `${dose} unit/kg/jam ÷ 60 mnt`,
        result: `${round4(dosePerMin_perKg)} unit/kg/mnt`,
      })
      break
  }

  // Total dose per minute in same unit as stockConcentration
  // stockConcentration is in mcg/mL for mcg-based drugs, mg/mL for mg-based
  const isMg = doseUnit === 'mg/kg/hr'
  const stockConc_base = isMg ? stockConcentration * 1000 : stockConcentration // normalise to mcg/mL

  if (isMg) {
    steps.push({
      expression: `Stok ${stockConcentration} mg/mL × 1000 mcg/mg`,
      result: `${round4(stockConc_base)} mcg/mL`,
    })
  }

  const totalDosePerMin = dosePerMin_perKg * weight // mcg/min total patient dose
  steps.push({
    expression: `${round4(dosePerMin_perKg)} ${baseUnit}/kg/mnt × ${weight} kg`,
    result: `${round4(totalDosePerMin)} ${baseUnit}/mnt`,
  })

  // Rate = (dose mcg/min) / (concentration mcg/mL) → mL/min → ×60 → mL/hr
  const ratePerHr = round2((totalDosePerMin / stockConc_base) * 60)
  steps.push({
    expression: `${round4(totalDosePerMin)} ${baseUnit}/mnt ÷ ${round4(stockConc_base)} ${baseUnit}/mL × 60 mnt`,
    result: `${ratePerHr} mL/jam`,
  })

  const dropsMacro = round1((ratePerHr / 60) * 20)  // macro 20 gtt/mL
  const dropsMicro = round1((ratePerHr / 60) * 60)  // micro 60 gtt/mL
  steps.push({
    expression: `${ratePerHr} mL/jam ÷ 60 mnt × 20 tetes/mL (makro)`,
    result: `${dropsMacro} tpm`,
  })
  steps.push({
    expression: `${ratePerHr} mL/jam ÷ 60 mnt × 60 tetes/mL (mikro)`,
    result: `${dropsMicro} tpm`,
  })

  const dosePerHr = round2(dose * weight)
  const dosePerHrUnit = doseUnit.replace('/min', '/hr').replace('kg/', 'total ')

  return { valid: true, ratePerHr, dropsMacro, dropsMicro, dosePerHr, dosePerHrUnit, steps }
}

function round2(v: number): number { return Math.round(v * 100) / 100 }
/** Intermediate values keep more precision than the displayed result, so the
 *  working never looks like it disagrees with itself. */
function round4(v: number): number { return Math.round(v * 10000) / 10000 }
function round1(v: number): number { return Math.round(v * 10) / 10 }
