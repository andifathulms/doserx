import { Regimen } from '../data/catalog'
import { calculate, calculateFixed } from './calculate'
import { calculateInfusion } from './calculateInfusion'

/**
 * The dose a drug row shows inline in the Obat list, for the current weight —
 * what makes "3 taps" into "1 glance": the doctor sees 175 mg / 7.29 mL next
 * to Paracetamol before opening anything.
 *
 * Nothing is computed here that the drug page would compute differently: it
 * calls the same engine with the same preset object and its catalog defaults
 * (typical dose, default frequency, stock concentration). Opening the drug
 * shows the full working; this is its first line.
 */
export interface QuickDose {
  value: string
  unit: string
  /** Second line: the volume, or the frequency when there is no volume. */
  sub?: string
  capped: boolean
}

export function quickDose(regimen: Regimen, weightKg: number): QuickDose | null {
  if (regimen.kind === 'infusion') {
    const i = regimen.infusion
    const out = calculateInfusion({
      weight: weightKg,
      dose: i.doseDefault,
      doseUnit: i.doseUnit,
      stockConcentration: i.stockConcentration,
      stockUnit: i.stockUnit,
      diluentVolume: i.diluentVolumeDefault,
    })
    if (!out.valid) return null
    return {
      value: String(out.ratePerHr),
      unit: 'mL/jam',
      sub: `${i.doseDefault} ${i.doseUnit}`,
      capped: false,
    }
  }

  const p = regimen.preset
  const concentration = p.concentration ?? p.prep?.concentration
  const out =
    p.fixedDoseMg != null
      ? calculateFixed({ doseMg: p.fixedDoseMg, freq: p.freq, maxDay: p.maxDay, concentration })
      : calculate({
          weight: weightKg,
          dosePerKg: p.dosePerKg,
          freq: p.freq,
          maxDay: p.maxDay,
          maxSingle: p.maxSingle,
          concentration,
        })
  if (!out.valid) return null
  return {
    value: String(out.perDose),
    unit: 'mg',
    sub: p.showMcg
      ? `${Math.round(out.perDose * 1000 * 10) / 10} mcg`
      : out.volume != null
        ? `${out.volume} mL`
        : `${p.freq}×/hari`,
    capped: out.cappedByMaxDay || out.cappedByMaxSingle,
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** The published dosing, for a row when no weight is set yet. */
export function dosingSummary(regimen: Regimen): string {
  if (regimen.kind === 'infusion') {
    const i = regimen.infusion
    return `${i.doseMin}–${i.doseMax} ${i.doseUnit}`
  }
  const p = regimen.preset
  if (p.fixedDoseMg != null) return `${p.fixedDoseMg} mg · ${p.freq}×/hari`
  if (p.dosePerKgMin != null && p.dosePerKgMax != null) {
    return `${r2(p.dosePerKgMin / p.freq)}–${r2(p.dosePerKgMax / p.freq)} mg/kg/kali`
  }
  return `${r2(p.dosePerKg / p.freq)} mg/kg/kali`
}
