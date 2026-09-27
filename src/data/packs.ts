/**
 * Darurat packs — the drugs an emergency needs, on one screen, for one
 * weight. Every row points at a catalog drug (and optionally one of its
 * regimens), so a pack computes from exactly the data the drug page does and
 * cannot drift from it. A pack adds only ORDER and GROUPING: which drugs, in
 * which phase, in which sequence.
 *
 * A row whose regimen is a draft shows the drug's name and "menunggu
 * verifikasi" instead of a number for everyone outside review mode — a pack
 * never shows an unreviewed dose. Weight-derived non-drug figures (a fluid
 * bolus in mL/kg, defibrillation joules) are `formula` rows with their own
 * review status (approved 27 Sep 2026).
 */

export interface PackDrugRow {
  kind: 'drug'
  drug: string
  /** A specific regimen id; else the one pickRegimen() chooses for the
   *  patient's Anak/Dewasa. */
  regimen?: string
  note?: string
  /** For the D10 preset, whose catalog "dose" is mL of solution. */
  doseIsVolume?: boolean
}

export interface PackFormulaRow {
  kind: 'formula'
  id: string
  name: string
  perKg: number
  unit: string
  max?: number
  note: string
  source: string
  status: 'draft' | 'verified'
}

export type PackRow = PackDrugRow | PackFormulaRow

export interface PackSection {
  title: string
  /** Time marker for a sequenced protocol ("5–10 mnt"). */
  time?: string
  note?: string
  rows: PackRow[]
}

export interface Pack {
  id: 'rsi' | 'resusitasi' | 'kejang' | 'anafilaksis'
  label: string
  title: string
  lede: string
  /** Kejang runs against a clock. */
  stopwatch?: boolean
  sections: PackSection[]
}

export const PACKS: Pack[] = [
  {
    id: 'rsi',
    label: 'Intubasi (RSI)',
    title: 'Paket intubasi',
    lede: 'Premedikasi, induksi dan pelumpuh otot — volume siap tarik untuk berat ini.',
    sections: [
      {
        title: 'A · Premedikasi',
        rows: [
          { kind: 'drug', drug: 'atropine', note: 'Minimal 0,1 mg; bradikardia/bayi, atau sebelum suksinilkolin pada anak.' },
          { kind: 'drug', drug: 'fentanyl' },
          { kind: 'drug', drug: 'lidocaine', regimen: 'lidocaine-rsi' },
        ],
      },
      {
        title: 'B · Induksi',
        note: 'Pilih satu. Ketamin atau etomidat bila hemodinamik tidak stabil.',
        rows: [
          { kind: 'drug', drug: 'ketamine', regimen: 'ketamine' },
          { kind: 'drug', drug: 'etomidate' },
          { kind: 'drug', drug: 'propofol' },
          { kind: 'drug', drug: 'thiopental' },
          { kind: 'drug', drug: 'midazolam', regimen: 'midazolam', note: 'Induksi 0,1–0,3 mg/kg.' },
        ],
      },
      {
        title: 'C · Pelumpuh otot',
        note: 'Pilih satu. Berikan hanya bila siap ventilasi dan intubasi.',
        rows: [
          { kind: 'drug', drug: 'rocuronium' },
          { kind: 'drug', drug: 'succinylcholine' },
          { kind: 'drug', drug: 'vecuronium' },
          { kind: 'drug', drug: 'atracurium' },
        ],
      },
    ],
  },
  {
    id: 'resusitasi',
    label: 'Resusitasi',
    title: 'Henti jantung & aritmia',
    lede: 'Dosis bolus dan energi listrik untuk berat ini. Ikuti algoritma PALS/ACLS.',
    sections: [
      {
        title: 'Henti jantung',
        rows: [
          { kind: 'drug', drug: 'epinephrine', regimen: 'epinephrine-iv' },
          { kind: 'drug', drug: 'amiodarone' },
          { kind: 'drug', drug: 'lidocaine', regimen: 'lidocaine', note: 'Alternatif amiodaron untuk VF/pVT refrakter.' },
          {
            kind: 'formula',
            id: 'defib-1',
            name: 'Defibrilasi — syok pertama',
            perKg: 2,
            unit: 'J',
            max: 200,
            note: '2 J/kg; syok berikutnya 4 J/kg (maks 10 J/kg atau dosis dewasa).',
            source: 'AHA PALS 2020',
            status: 'verified',
          },
          {
            kind: 'formula',
            id: 'defib-2',
            name: 'Defibrilasi — syok berikutnya',
            perKg: 4,
            unit: 'J',
            max: 360,
            note: '4 J/kg, dapat dinaikkan hingga 10 J/kg (tidak melebihi dosis dewasa).',
            source: 'AHA PALS 2020',
            status: 'verified',
          },
        ],
      },
      {
        title: 'Takikardia & bradikardia',
        rows: [
          { kind: 'drug', drug: 'adenosine', note: 'SVT; dosis kedua 0,2 mg/kg (maks 12 mg).' },
          {
            kind: 'formula',
            id: 'cardioversion',
            name: 'Kardioversi tersinkron',
            perKg: 0.5,
            unit: 'J',
            max: 100,
            note: '0,5–1 J/kg, naikkan ke 2 J/kg bila tidak berhasil.',
            source: 'AHA PALS 2020',
            status: 'verified',
          },
          { kind: 'drug', drug: 'atropine', note: 'Bradikardia dengan tonus vagal/blok AV.' },
        ],
      },
      {
        title: 'Penyebab yang bisa dikoreksi',
        rows: [
          { kind: 'drug', drug: 'dextrose-10', doseIsVolume: true, note: 'Hipoglikemia.' },
          { kind: 'drug', drug: 'calcium-gluconate', note: 'Hiperkalemia, hipokalsemia.' },
          { kind: 'drug', drug: 'naloxone', note: 'Intoksikasi opioid.' },
        ],
      },
    ],
  },
  {
    id: 'kejang',
    label: 'Kejang',
    title: 'Kejang & status epileptikus',
    lede: 'Tatalaksana bertahap. Mulai stopwatch saat kejang mulai.',
    stopwatch: true,
    sections: [
      {
        time: '0–5 mnt',
        title: 'Stabilisasi',
        note: 'Jalan napas, oksigen, posisi miring, akses IV, periksa gula darah.',
        rows: [{ kind: 'drug', drug: 'dextrose-10', doseIsVolume: true, note: 'Bila gula darah rendah.' }],
      },
      {
        time: '5–10 mnt',
        title: 'Benzodiazepin',
        note: 'Pilih satu. Boleh diulang 1× setelah 5 menit bila masih kejang.',
        rows: [
          { kind: 'drug', drug: 'diazepam', regimen: 'diazepam' },
          { kind: 'drug', drug: 'midazolam', regimen: 'midazolam' },
        ],
      },
      {
        time: '10–30 mnt',
        title: 'Lini kedua',
        note: 'Pilih satu bila kejang berlanjut setelah 2 dosis benzodiazepin.',
        rows: [
          { kind: 'drug', drug: 'phenytoin', regimen: 'phenytoin-loading' },
          { kind: 'drug', drug: 'levetiracetam', regimen: 'levetiracetam-loading' },
          { kind: 'drug', drug: 'valproate', regimen: 'valproate-iv' },
          { kind: 'drug', drug: 'phenobarbital', regimen: 'phenobarbital-loading' },
        ],
      },
      {
        time: '>30 mnt',
        title: 'Refrakter',
        note: 'Rujuk/konsultasi ICU. Intubasi dan infus kontinu.',
        rows: [{ kind: 'drug', drug: 'midazolam', regimen: 'infus:midazolam' }],
      },
    ],
  },
  {
    id: 'anafilaksis',
    label: 'Anafilaksis',
    title: 'Anafilaksis',
    lede: 'Adrenalin IM dulu, tanpa menunda. Ulang tiap 5–15 menit bila perlu.',
    sections: [
      {
        title: 'Segera',
        rows: [
          { kind: 'drug', drug: 'epinephrine', regimen: 'epinephrine', note: 'Paha anterolateral.' },
          {
            kind: 'formula',
            id: 'fluid-bolus',
            name: 'Bolus NaCl 0,9%',
            perKg: 20,
            unit: 'mL',
            max: 1000,
            note: '10–20 mL/kg cepat bila hipotensi; ulang sesuai respons.',
            source: 'WAO 2020 / RCUK 2021',
            status: 'verified',
          },
        ],
      },
      {
        title: 'Tambahan (setelah adrenalin)',
        rows: [
          { kind: 'drug', drug: 'diphenhydramine' },
          { kind: 'drug', drug: 'hydrocortisone' },
        ],
      },
      {
        title: 'Refrakter',
        note: 'Setelah 2 dosis adrenalin IM dan cairan.',
        rows: [{ kind: 'drug', drug: 'epinephrine', regimen: 'infus:epinephrine-infusion' }],
      },
    ],
  },
]
