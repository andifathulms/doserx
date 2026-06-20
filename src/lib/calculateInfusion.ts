import { InfusionDoseUnit } from '../data/infusionDrugs'

export interface InfusionInput {
  weight: number          // kg
  dose: number            // in doseUnit
  doseUnit: InfusionDoseUnit
  stockConcentration: number  // mcg/mL or mg/mL
  stockUnit: string
  diluentVolume: number   // mL total bag volume
}

export interface InfusionResult {
  valid: true
  ratePerHr: number       // mL/hr
  dropsMacro: number      // drops/min (macro: 20 drops/mL)
  dropsMicro: number      // drops/min (micro: 60 drops/min)
  dosePerHr: number       // normalised to per-hour in same unit magnitude
  dosePerHrUnit: string
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

  // Convert everything to mcg/hr or mg/hr per mL stock
  let dosePerMin_perKg: number  // in the unit's base (mcg or mg) per kg per min

  switch (doseUnit) {
    case 'mcg/kg/min':
      dosePerMin_perKg = dose
      break
    case 'mcg/kg/hr':
      dosePerMin_perKg = dose / 60
      break
    case 'mg/kg/hr':
      dosePerMin_perKg = (dose * 1000) / 60  // convert mg→mcg, hr→min
      break
    case 'unit/kg/hr':
      dosePerMin_perKg = dose / 60
      break
  }

  // Total dose per minute in same unit as stockConcentration
  // stockConcentration is in mcg/mL for mcg-based drugs, mg/mL for mg-based
  const isMg = doseUnit === 'mg/kg/hr'
  const stockConc_base = isMg ? stockConcentration * 1000 : stockConcentration // normalise to mcg/mL

  const totalDosePerMin = dosePerMin_perKg * weight // mcg/min total patient dose

  // Rate = (dose mcg/min) / (concentration mcg/mL) → mL/min → ×60 → mL/hr
  const ratePerHr = round2((totalDosePerMin / stockConc_base) * 60)
  const dropsMacro = round1((ratePerHr / 60) * 20)  // macro 20 gtt/mL
  const dropsMicro = round1((ratePerHr / 60) * 60)  // micro 60 gtt/mL

  const dosePerHr = round2(dose * weight)
  const dosePerHrUnit = doseUnit.replace('/min', '/hr').replace('kg/', 'total ')

  return { valid: true, ratePerHr, dropsMacro, dropsMicro, dosePerHr, dosePerHrUnit }
}

function round2(v: number): number { return Math.round(v * 100) / 100 }
function round1(v: number): number { return Math.round(v * 10) / 10 }
