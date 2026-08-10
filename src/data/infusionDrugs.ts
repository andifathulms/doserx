export type InfusionDoseUnit = 'mcg/kg/min' | 'mg/kg/hr' | 'mcg/kg/hr' | 'unit/kg/hr'

export interface InfusionPreset {
  id: string
  name: string
  doseUnit: InfusionDoseUnit
  doseMin: number
  doseMax: number
  doseDefault: number
  stockConcentration: number   // mcg/mL or mg/mL depending on doseUnit
  stockUnit: string            // label shown to user, e.g. "mcg/mL"
  diluentVolumeDefault: number // mL
  note: string
  /**
   * The dilution this preset's stockConcentration assumes. It lived only in a
   * code comment, so the user saw "1600 mcg/mL" with no way to check which
   * bag it describes — and a different dilution silently makes every figure
   * wrong. Shown next to the concentration field.
   */
  dilution: string
}

export const INFUSION_PRESETS: InfusionPreset[] = [
  {
    id: 'dopamine',
    name: 'Dopamin',
    doseUnit: 'mcg/kg/min',
    doseMin: 2,
    doseMax: 20,
    doseDefault: 5,
    stockConcentration: 1600, // mcg/mL (standard: 400mg in 250mL NS)
    stockUnit: 'mcg/mL',
    diluentVolumeDefault: 250,
    note: '2–5 mcg/kg/mnt: efek renal/dopaminergik. 5–10: efek inotropik. >10: vasopressor.',
    dilution: '400 mg dalam 250 mL NS',
  },
  {
    id: 'dobutamine',
    name: 'Dobutamin',
    doseUnit: 'mcg/kg/min',
    doseMin: 2,
    doseMax: 20,
    doseDefault: 5,
    stockConcentration: 1000, // mcg/mL (250mg in 250mL)
    stockUnit: 'mcg/mL',
    diluentVolumeDefault: 250,
    note: '2–20 mcg/kg/mnt. Inotropik positif. Hindari pada stenosis hipertrofik.',
    dilution: '250 mg dalam 250 mL',
  },
  {
    id: 'norepinephrine',
    name: 'Norepinefrin',
    doseUnit: 'mcg/kg/min',
    doseMin: 0.01,
    doseMax: 2,
    doseDefault: 0.1,
    stockConcentration: 16, // mcg/mL (4mg in 250mL)
    stockUnit: 'mcg/mL',
    diluentVolumeDefault: 250,
    note: '0.01–2 mcg/kg/mnt. Vasopressor pilihan pada syok septik.',
    dilution: '4 mg dalam 250 mL',
  },
  {
    id: 'epinephrine-infusion',
    name: 'Epinefrin (infus)',
    doseUnit: 'mcg/kg/min',
    doseMin: 0.01,
    doseMax: 1,
    doseDefault: 0.05,
    stockConcentration: 4, // mcg/mL (1mg in 250mL)
    stockUnit: 'mcg/mL',
    diluentVolumeDefault: 250,
    note: '0.01–1 mcg/kg/mnt. Bronkospasme berat, syok anafilaktik atau kardiogenik.',
    dilution: '1 mg dalam 250 mL',
  },
  {
    id: 'morphine',
    name: 'Morfin (infus)',
    doseUnit: 'mcg/kg/hr',
    doseMin: 10,
    doseMax: 40,
    doseDefault: 20,
    stockConcentration: 40, // mcg/mL (10mg in 250mL)
    stockUnit: 'mcg/mL',
    diluentVolumeDefault: 250,
    note: '10–40 mcg/kg/jam. Analgesik opioid. Monitor respirasi.',
    dilution: '10 mg dalam 250 mL',
  },
  {
    id: 'midazolam',
    name: 'Midazolam (infus)',
    doseUnit: 'mcg/kg/hr',
    doseMin: 30,
    doseMax: 200,
    doseDefault: 60,
    stockConcentration: 200, // mcg/mL (50mg in 250mL)
    stockUnit: 'mcg/mL',
    diluentVolumeDefault: 250,
    note: '30–200 mcg/kg/jam. Sedasi ICU. Titrasi ke target RASS.',
    dilution: '50 mg dalam 250 mL',
  },
  {
    id: 'aminophylline',
    name: 'Aminofilin (infus)',
    doseUnit: 'mg/kg/hr',
    doseMin: 0.5,
    doseMax: 1,
    doseDefault: 0.7,
    stockConcentration: 1,   // mg/mL (250mg in 250mL)
    stockUnit: 'mg/mL',
    diluentVolumeDefault: 250,
    note: '0.5–1 mg/kg/jam maintenance. Loading: 5–6 mg/kg bolus IV lambat. Monitor kadar.',
    dilution: '250 mg dalam 250 mL',
  },
  {
    id: 'kcl',
    name: 'KCl (koreksi hipokalemia)',
    doseUnit: 'mcg/kg/hr',
    doseMin: 200,
    doseMax: 500,
    doseDefault: 300,
    stockConcentration: 2000, // mcg/mL (500mg=~7mEq in 250mL → pakai mg: 2mg/mL)
    stockUnit: 'mcg/mL',
    diluentVolumeDefault: 250,
    note: 'Maks 0.5 mEq/kg/jam (≈40mg/kg/jam). Harus diencerkan, jangan bolus. Monitor EKG.',
    dilution: '500 mg (≈7 mEq) dalam 250 mL',
  },
]
