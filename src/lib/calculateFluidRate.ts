/**
 * Maintenance IV fluid rate for children — the Holliday-Segar "4-2-1" rule —
 * plus its drip rate under the three set types actually stocked on a ward.
 */

export interface FluidRateStep {
  expression: string
  result: string
}

export interface FluidRateInput {
  weight: number // kg
  /** mL/kg/hr override. Omit to use the Holliday-Segar tiers. */
  manualRatePerKgHr?: number
}

export interface FluidRateResult {
  valid: true
  ratePerHr: number // mL/hr
  dropsMacro: number // gtt/min, 20 gtt/mL
  dropsMicro: number // gtt/min, 60 gtt/mL
  dropsTransfusion: number // gtt/min, 15 gtt/mL
  steps: FluidRateStep[]
}

export interface FluidRateError {
  valid: false
  error: string
}

export function calculateFluidRate(input: FluidRateInput): FluidRateResult | FluidRateError {
  const { weight, manualRatePerKgHr } = input

  if (!isFinite(weight) || weight <= 0) return { valid: false, error: 'Masukkan berat badan yang valid.' }
  if (manualRatePerKgHr !== undefined && (!isFinite(manualRatePerKgHr) || manualRatePerKgHr <= 0)) {
    return { valid: false, error: 'Masukkan kecepatan mL/kg/jam yang valid.' }
  }

  const steps: FluidRateStep[] = []
  let ratePerHr: number

  if (manualRatePerKgHr !== undefined) {
    ratePerHr = round2(manualRatePerKgHr * weight)
    steps.push({
      expression: `${manualRatePerKgHr} mL/kg/jam × ${weight} kg`,
      result: `${ratePerHr} mL/jam`,
    })
  } else {
    // Holliday-Segar: 4 mL/kg/hr for the first 10kg, 2 mL/kg/hr for the next
    // 10kg (10-20kg), 1 mL/kg/hr for every kg above 20.
    const tier1 = Math.min(weight, 10) * 4
    const tier2 = Math.max(Math.min(weight, 20) - 10, 0) * 2
    const tier3 = Math.max(weight - 20, 0) * 1

    if (weight <= 10) {
      steps.push({ expression: `${weight} kg × 4 mL/kg/jam`, result: `${round2(tier1)} mL/jam` })
    } else if (weight <= 20) {
      steps.push({ expression: `10 kg × 4 mL/kg/jam`, result: `${round2(tier1)} mL/jam` })
      steps.push({ expression: `${round2(weight - 10)} kg × 2 mL/kg/jam`, result: `${round2(tier2)} mL/jam` })
    } else {
      steps.push({ expression: `10 kg × 4 mL/kg/jam`, result: `${round2(tier1)} mL/jam` })
      steps.push({ expression: `10 kg × 2 mL/kg/jam`, result: `${round2(tier2)} mL/jam` })
      steps.push({ expression: `${round2(weight - 20)} kg × 1 mL/kg/jam`, result: `${round2(tier3)} mL/jam` })
    }

    ratePerHr = round2(tier1 + tier2 + tier3)
    steps.push({ expression: 'Jumlah tiap tingkat (aturan 4-2-1)', result: `${ratePerHr} mL/jam` })
  }

  const dropsMacro = round1((ratePerHr / 60) * 20) // makro 20 gtt/mL
  const dropsMicro = round1((ratePerHr / 60) * 60) // mikro 60 gtt/mL
  const dropsTransfusion = round1((ratePerHr / 60) * 15) // set transfusi 15 gtt/mL

  steps.push({ expression: `${ratePerHr} mL/jam ÷ 60 mnt × 20 tetes/mL (makro)`, result: `${dropsMacro} tpm` })
  steps.push({ expression: `${ratePerHr} mL/jam ÷ 60 mnt × 60 tetes/mL (mikro)`, result: `${dropsMicro} tpm` })
  steps.push({
    expression: `${ratePerHr} mL/jam ÷ 60 mnt × 15 tetes/mL (transfusi)`,
    result: `${dropsTransfusion} tpm`,
  })

  return { valid: true, ratePerHr, dropsMacro, dropsMicro, dropsTransfusion, steps }
}

function round2(v: number): number { return Math.round(v * 100) / 100 }
function round1(v: number): number { return Math.round(v * 10) / 10 }
