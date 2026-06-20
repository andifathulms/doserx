export type FormType =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'vial'
  | 'nebule'
  | 'ampoule'
  | 'rectal'
  | 'drop'

export type DrugCategory =
  | 'Antiinfeksi'
  | 'Antiparasit'
  | 'Analgesik/NSAID'
  | 'Antikonvulsan'
  | 'Kardiovaskular'
  | 'Pulmologi'
  | 'Gastrointestinal'
  | 'Kortikosteroid'
  | 'Vitamin/Mineral'
  | 'Antimalarial'
  | 'Gawat Darurat'
  | 'Lain-lain'

export interface DrugForm {
  strength: number  // mg per unit (solid) or mg/mL (liquid)
  form: FormType
  label?: string
}

export interface DrugPreset {
  id: string
  name: string
  route: string
  category: DrugCategory
  dosePerKg: number
  dosePerKgMin?: number
  dosePerKgMax?: number
  freq: number
  maxDay?: number
  maxSingle?: number
  concentration?: number  // mg/mL for volume calculation
  availableForms?: DrugForm[]
  note: string
  forPuyer?: boolean
}

// ── Core preset drugs ─────────────────────────────────────────────────────────

export const DRUG_PRESETS: DrugPreset[] = [

  // ── Analgesik/Antipiretik ────────────────────────────────────────────────────
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    route: 'Oral / PR',
    category: 'Analgesik/NSAID',
    dosePerKg: 15,
    dosePerKgMin: 10,
    dosePerKgMax: 15,
    freq: 4,
    maxDay: 4000,
    maxSingle: 1000,
    concentration: 24,
    availableForms: [
      { strength: 500, form: 'tablet' },
      { strength: 250, form: 'tablet', label: 'Anak' },
      { strength: 24, form: 'syrup', label: '120mg/5mL' },
    ],
    note: '10–15 mg/kg/dosis, setiap 6 jam. Maks 4 g/hari. Sirup 120mg/5mL untuk anak.',
    forPuyer: true,
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    route: 'Oral',
    category: 'Analgesik/NSAID',
    dosePerKg: 10,
    dosePerKgMin: 5,
    dosePerKgMax: 10,
    freq: 3,
    maxDay: 2400,
    maxSingle: 400,
    concentration: 20,
    availableForms: [
      { strength: 400, form: 'tablet' },
      { strength: 200, form: 'tablet' },
      { strength: 20, form: 'syrup', label: '100mg/5mL' },
    ],
    note: '5–10 mg/kg/dosis, 3×/hari bersama makanan. Hindari jika dehidrasi/gangguan ginjal.',
    forPuyer: true,
  },
  {
    id: 'mefenamic-acid',
    name: 'Asam Mefenamat',
    route: 'Oral',
    category: 'Analgesik/NSAID',
    dosePerKg: 6.5,
    dosePerKgMin: 5,
    dosePerKgMax: 7,
    freq: 3,
    maxSingle: 500,
    maxDay: 1500,
    availableForms: [
      { strength: 500, form: 'tablet' },
      { strength: 250, form: 'tablet' },
    ],
    note: '5–7 mg/kg/dosis, 3×/hari. Dewasa: 500mg 3×/hari. Maks 7 hari pemakaian.',
    forPuyer: true,
  },

  // ── Antiinfeksi ──────────────────────────────────────────────────────────────
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    route: 'Oral',
    category: 'Antiinfeksi',
    dosePerKg: 25,
    dosePerKgMin: 20,
    dosePerKgMax: 40,
    freq: 3,
    maxDay: 3000,
    maxSingle: 500,
    concentration: 25,
    availableForms: [
      { strength: 500, form: 'capsule' },
      { strength: 250, form: 'capsule' },
      { strength: 25, form: 'syrup', label: '125mg/5mL' },
      { strength: 50, form: 'syrup', label: '250mg/5mL' },
    ],
    note: '20–40 mg/kg/hari, 3×/hari. Infeksi berat: hingga 90 mg/kg/hari.',
    forPuyer: false,
  },
  {
    id: 'metronidazole',
    name: 'Metronidazole',
    route: 'Oral / IV',
    category: 'Antiinfeksi',
    dosePerKg: 7.5,
    dosePerKgMin: 7.5,
    dosePerKgMax: 10,
    freq: 3,
    maxSingle: 500,
    maxDay: 2000,
    concentration: 25,
    availableForms: [
      { strength: 500, form: 'tablet' },
      { strength: 250, form: 'tablet' },
      { strength: 25, form: 'syrup', label: '125mg/5mL' },
    ],
    note: '7.5–10 mg/kg/dosis 3×/hari (oral/IV). Maks 500mg/dosis. Untuk anaerob, protozoa.',
    forPuyer: false,
  },
  {
    id: 'cotrimoxazole',
    name: 'Kotrimoksazol',
    route: 'Oral',
    category: 'Antiinfeksi',
    dosePerKg: 24,
    dosePerKgMin: 20,
    dosePerKgMax: 30,
    freq: 2,
    maxSingle: 480,
    maxDay: 2880,
    concentration: 48,
    availableForms: [
      { strength: 480, form: 'tablet', label: 'SS (480mg)' },
      { strength: 48, form: 'syrup', label: '240mg/5mL' },
    ],
    note: '20–30 mg/kg/hari (dosis gabungan TMP+SMX), 2×/hari. Tab 480mg (80mgTMP+400mgSMX).',
    forPuyer: false,
  },
  {
    id: 'azithromycin',
    name: 'Azitromisin',
    route: 'Oral',
    category: 'Antiinfeksi',
    dosePerKg: 10,
    dosePerKgMin: 5,
    dosePerKgMax: 10,
    freq: 1,
    maxSingle: 500,
    maxDay: 500,
    concentration: 40,
    availableForms: [
      { strength: 500, form: 'tablet' },
      { strength: 250, form: 'tablet' },
      { strength: 40, form: 'syrup', label: '200mg/5mL' },
    ],
    note: '10 mg/kg hari 1, lalu 5 mg/kg hari 2–5. Atau 10 mg/kg/hari OD × 3 hari. Maks 500mg/hari.',
    forPuyer: false,
  },
  {
    id: 'erythromycin',
    name: 'Eritromisin',
    route: 'Oral',
    category: 'Antiinfeksi',
    dosePerKg: 12.5,
    dosePerKgMin: 10,
    dosePerKgMax: 12.5,
    freq: 4,
    maxSingle: 500,
    maxDay: 2000,
    concentration: 25,
    availableForms: [
      { strength: 500, form: 'tablet' },
      { strength: 250, form: 'tablet' },
      { strength: 25, form: 'syrup', label: '125mg/5mL' },
    ],
    note: '10–12.5 mg/kg/dosis, 4×/hari. Dewasa: 250–500mg 4×/hari. Alternatif penisilin.',
    forPuyer: false,
  },
  {
    id: 'ceftriaxone',
    name: 'Seftriakson',
    route: 'IV / IM',
    category: 'Antiinfeksi',
    dosePerKg: 50,
    dosePerKgMin: 50,
    dosePerKgMax: 100,
    freq: 1,
    maxDay: 4000,
    maxSingle: 2000,
    availableForms: [
      { strength: 1000, form: 'vial', label: '1g' },
      { strength: 500, form: 'vial', label: '500mg' },
    ],
    note: '50 mg/kg OD. Meningitis: 100 mg/kg/hari. Maks 4 g/hari. IV/IM.',
    forPuyer: false,
  },
  {
    id: 'gentamicin',
    name: 'Gentamisin',
    route: 'IV / IM',
    category: 'Antiinfeksi',
    dosePerKg: 5,
    dosePerKgMin: 5,
    dosePerKgMax: 7.5,
    freq: 1,
    maxDay: 240,
    concentration: 40,
    availableForms: [
      { strength: 40, form: 'vial', label: '80mg/2mL' },
    ],
    note: '5–7.5 mg/kg/hari OD (once-daily dosing). Monitor fungsi ginjal dan pendengaran.',
    forPuyer: false,
  },

  // ── Antiparasit ──────────────────────────────────────────────────────────────
  {
    id: 'albendazole',
    name: 'Albendazol',
    route: 'Oral',
    category: 'Antiparasit',
    dosePerKg: 10,
    freq: 1,
    maxSingle: 400,
    maxDay: 400,
    concentration: 40,
    availableForms: [
      { strength: 400, form: 'tablet' },
      { strength: 40, form: 'syrup', label: '200mg/5mL' },
    ],
    note: '10 mg/kg/hari OD (≤15kg); atau dosis tetap 400mg OD (>15kg). Berikan bersama makanan.',
    forPuyer: false,
  },
  {
    id: 'mebendazole',
    name: 'Mebendazol',
    route: 'Oral',
    category: 'Antiparasit',
    dosePerKg: 5,
    freq: 2,
    maxSingle: 100,
    maxDay: 200,
    availableForms: [
      { strength: 100, form: 'tablet' },
      { strength: 500, form: 'tablet', label: 'Dosis tunggal' },
    ],
    note: 'Cacing gelang: 100mg 2×/hari × 3 hari atau 500mg dosis tunggal (>2 tahun). Tidak tergantung BB.',
    forPuyer: false,
  },

  // ── Antikonvulsan ────────────────────────────────────────────────────────────
  {
    id: 'diazepam',
    name: 'Diazepam',
    route: 'IV / PR (kejang)',
    category: 'Gawat Darurat',
    dosePerKg: 0.3,
    dosePerKgMin: 0.2,
    dosePerKgMax: 0.5,
    freq: 1,
    maxSingle: 10,
    concentration: 5,
    availableForms: [
      { strength: 5, form: 'tablet' },
      { strength: 2, form: 'tablet' },
      { strength: 5, form: 'rectal', label: 'Stesolid 5mg' },
      { strength: 10, form: 'rectal', label: 'Stesolid 10mg' },
    ],
    note: '0.2–0.5 mg/kg IV/rektal untuk kejang akut. Dapat diulang 1× setelah 5 menit. Maks 10mg.',
    forPuyer: false,
  },
  {
    id: 'phenobarbital',
    name: 'Fenobarbital',
    route: 'Oral / IV',
    category: 'Antikonvulsan',
    dosePerKg: 4,
    dosePerKgMin: 3,
    dosePerKgMax: 5,
    freq: 1,
    maxDay: 200,
    concentration: 4,
    availableForms: [
      { strength: 100, form: 'tablet' },
      { strength: 30, form: 'tablet' },
    ],
    note: '3–5 mg/kg/hari OD (maintenance). Loading IV: 15–20 mg/kg pelan. Monitor sedasi.',
    forPuyer: false,
  },
  {
    id: 'valproate',
    name: 'Asam Valproat',
    route: 'Oral',
    category: 'Antikonvulsan',
    dosePerKg: 10,
    dosePerKgMin: 10,
    dosePerKgMax: 30,
    freq: 2,
    maxDay: 2500,
    concentration: 50,
    availableForms: [
      { strength: 500, form: 'tablet', label: 'Depakote' },
      { strength: 250, form: 'tablet' },
      { strength: 50, form: 'syrup', label: '250mg/5mL' },
    ],
    note: '10–30 mg/kg/hari, mulai rendah dan titrasi naik. Monitor fungsi hati. Hindari pada kehamilan.',
    forPuyer: false,
  },

  // ── Kardiovaskular ───────────────────────────────────────────────────────────
  {
    id: 'furosemide',
    name: 'Furosemid',
    route: 'Oral / IV',
    category: 'Kardiovaskular',
    dosePerKg: 1,
    dosePerKgMin: 0.5,
    dosePerKgMax: 2,
    freq: 2,
    maxSingle: 80,
    concentration: 10,
    availableForms: [
      { strength: 40, form: 'tablet' },
      { strength: 10, form: 'ampoule', label: '20mg/2mL' },
    ],
    note: '0.5–2 mg/kg/dosis, 1–2×/hari. Monitor elektrolit (kalium). Maks 80mg/dosis.',
    forPuyer: false,
  },
  {
    id: 'captopril',
    name: 'Kaptopril',
    route: 'Oral',
    category: 'Kardiovaskular',
    dosePerKg: 0.2,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.5,
    freq: 3,
    maxSingle: 25,
    availableForms: [
      { strength: 25, form: 'tablet' },
      { strength: 12.5, form: 'tablet' },
    ],
    note: '0.1–0.5 mg/kg/dosis 3×/hari (anak). Dewasa: 12.5–25mg 3×/hari. ACE inhibitor. Monitor kalium.',
    forPuyer: false,
  },
  {
    id: 'digoxin',
    name: 'Digoksin',
    route: 'Oral',
    category: 'Kardiovaskular',
    dosePerKg: 0.008,
    dosePerKgMin: 0.005,
    dosePerKgMax: 0.01,
    freq: 1,
    maxDay: 0.25,
    concentration: 0.05,
    availableForms: [
      { strength: 0.25, form: 'tablet', label: '250mcg' },
    ],
    note: '5–10 mcg/kg/hari maintenance OD. Monitor EKG dan kadar digoksin. Indeks terapi sempit.',
    forPuyer: false,
  },
  {
    id: 'amlodipine',
    name: 'Amlodipine',
    route: 'Oral',
    category: 'Kardiovaskular',
    dosePerKg: 0.07,
    dosePerKgMin: 0.07,
    dosePerKgMax: 0.14,
    freq: 1,
    maxDay: 10,
    maxSingle: 10,
    availableForms: [
      { strength: 5, form: 'tablet' },
      { strength: 10, form: 'tablet' },
    ],
    note: '0.07–0.14 mg/kg/hari OD (anak). Dewasa: 5–10mg OD. CCB. Dapat menyebabkan edema tungkai.',
    forPuyer: false,
  },

  // ── Pulmologi ────────────────────────────────────────────────────────────────
  {
    id: 'salbutamol',
    name: 'Salbutamol',
    route: 'Nebulisasi',
    category: 'Pulmologi',
    dosePerKg: 0.15,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.15,
    freq: 3,
    maxSingle: 5,
    concentration: 1,
    availableForms: [
      { strength: 2.5, form: 'nebule', label: '2.5mg/2.5mL' },
      { strength: 4, form: 'tablet' },
      { strength: 2, form: 'tablet' },
    ],
    note: '0.1–0.15 mg/kg/dosis nebulisasi (maks 5mg). Tab 2–4mg untuk puyer.',
    forPuyer: true,
  },
  {
    id: 'nac',
    name: 'N-Asetilsistein',
    route: 'Oral',
    category: 'Pulmologi',
    dosePerKg: 15,
    dosePerKgMin: 15,
    dosePerKgMax: 20,
    freq: 3,
    maxSingle: 600,
    availableForms: [
      { strength: 200, form: 'tablet', label: 'Effervescent' },
    ],
    note: '15–20 mg/kg/dosis 3×/hari. Dewasa: 200mg 3×/hari. Mukolitik. Juga untuk overdosis paracetamol.',
    forPuyer: true,
  },

  // ── Gastrointestinal ─────────────────────────────────────────────────────────
  {
    id: 'ondansetron',
    name: 'Ondansetron',
    route: 'Oral / IV',
    category: 'Gastrointestinal',
    dosePerKg: 0.15,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.15,
    freq: 3,
    maxSingle: 8,
    concentration: 2,
    availableForms: [
      { strength: 8, form: 'tablet' },
      { strength: 4, form: 'tablet' },
      { strength: 2, form: 'ampoule', label: '4mg/2mL' },
    ],
    note: '0.1–0.15 mg/kg/dosis 3×/hari. Maks 8mg/dosis. Hindari QT memanjang.',
    forPuyer: true,
  },
  {
    id: 'ranitidine',
    name: 'Ranitidin',
    route: 'Oral / IV',
    category: 'Gastrointestinal',
    dosePerKg: 3,
    dosePerKgMin: 2,
    dosePerKgMax: 4,
    freq: 2,
    maxSingle: 150,
    concentration: 25,
    availableForms: [
      { strength: 150, form: 'tablet' },
      { strength: 25, form: 'ampoule', label: '50mg/2mL' },
    ],
    note: '2–4 mg/kg/dosis 2×/hari. Dewasa: 150mg 2×/hari. H2 blocker. Tersedia generik luas.',
    forPuyer: true,
  },

  // ── Kortikosteroid ───────────────────────────────────────────────────────────
  {
    id: 'methylprednisolone',
    name: 'Metilprednisolon',
    route: 'Oral / IV',
    category: 'Kortikosteroid',
    dosePerKg: 1,
    dosePerKgMin: 0.5,
    dosePerKgMax: 2,
    freq: 2,
    maxSingle: 64,
    availableForms: [
      { strength: 8, form: 'tablet' },
      { strength: 4, form: 'tablet' },
    ],
    note: '0.5–2 mg/kg/hari, dibagi 2×/hari. Tapering bertahap. Tidak boleh dihentikan tiba-tiba.',
    forPuyer: true,
  },

  // ── Vitamin/Mineral ──────────────────────────────────────────────────────────
  {
    id: 'zinc',
    name: 'Zinc',
    route: 'Oral',
    category: 'Vitamin/Mineral',
    dosePerKg: 0.5,
    dosePerKgMin: 0.5,
    dosePerKgMax: 1,
    freq: 1,
    maxDay: 20,
    concentration: 2,
    availableForms: [
      { strength: 20, form: 'tablet', label: 'Zinc 20mg' },
      { strength: 2, form: 'syrup', label: '10mg/5mL' },
    ],
    note: '0.5–1 mg/kg/hari OD × 10–14 hari untuk diare. <5 tahun: 10mg/hari. ≥5 tahun: 20mg/hari.',
    forPuyer: true,
  },

  // ── Gawat Darurat ────────────────────────────────────────────────────────────
  {
    id: 'epinephrine',
    name: 'Epinefrin',
    route: 'IM (anafilaksis)',
    category: 'Gawat Darurat',
    dosePerKg: 0.01,
    freq: 1,
    maxSingle: 0.5,
    concentration: 1,
    availableForms: [
      { strength: 1, form: 'ampoule', label: '1:1000' },
    ],
    note: '0.01 mg/kg IM (1:1000). Maks 0.5mg. Ulangi tiap 5–15 menit jika perlu.',
    forPuyer: false,
  },

  // ── Antimalarial ─────────────────────────────────────────────────────────────
  {
    id: 'chloroquine',
    name: 'Klorokuin',
    route: 'Oral',
    category: 'Antimalarial',
    dosePerKg: 10,
    freq: 1,
    maxSingle: 600,
    availableForms: [
      { strength: 150, form: 'tablet', label: '150mg basa' },
    ],
    note: '10 mg basa/kg hari 1, 10 mg/kg hari 2, 5 mg/kg hari 3. Tab 150mg basa (=250mg fosfat). Untuk P.vivax/P.malariae.',
    forPuyer: false,
  },
]

// ── Puyer-specific drugs ───────────────────────────────────────────────────────

export const PUYER_DRUGS: DrugPreset[] = [
  {
    id: 'ambroxol',
    name: 'Ambroksol',
    route: 'Oral',
    category: 'Pulmologi',
    dosePerKg: 0.5,
    dosePerKgMin: 0.4,
    dosePerKgMax: 0.5,
    freq: 3,
    maxSingle: 30,
    concentration: 3,
    availableForms: [
      { strength: 30, form: 'tablet' },
      { strength: 3, form: 'syrup', label: '15mg/5mL' },
    ],
    note: '0.4–0.5 mg/kg/dosis 3×/hari. Mukolitik. Tab 30mg; sirup 15mg/5mL.',
    forPuyer: true,
  },
  {
    id: 'bromhexine',
    name: 'Bromheksin',
    route: 'Oral',
    category: 'Pulmologi',
    dosePerKg: 0.2,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.3,
    freq: 3,
    maxSingle: 8,
    concentration: 0.8,
    availableForms: [
      { strength: 8, form: 'tablet' },
      { strength: 4, form: 'tablet' },
      { strength: 0.8, form: 'syrup', label: '4mg/5mL' },
    ],
    note: '0.1–0.3 mg/kg/dosis 3×/hari. Dewasa: 8–16mg 3×/hari. Mukolitik.',
    forPuyer: true,
  },
  {
    id: 'dexamethasone',
    name: 'Deksametason',
    route: 'Oral',
    category: 'Kortikosteroid',
    dosePerKg: 0.08,
    dosePerKgMin: 0.05,
    dosePerKgMax: 0.1,
    freq: 3,
    maxDay: 10,
    availableForms: [
      { strength: 0.75, form: 'tablet' },
      { strength: 0.5, form: 'tablet' },
    ],
    note: '0.15–0.3 mg/kg/hari dibagi 3×. Kortikosteroid. Gunakan dosis efektif terendah.',
    forPuyer: true,
  },
  {
    id: 'ctm',
    name: 'Klorfeniramin (CTM)',
    route: 'Oral',
    category: 'Lain-lain',
    dosePerKg: 0.1,
    freq: 3,
    maxSingle: 4,
    maxDay: 24,
    availableForms: [
      { strength: 4, form: 'tablet' },
    ],
    note: '0.1 mg/kg/dosis 3–4×/hari. Antihistamin. Maks 4mg/dosis. Dapat menyebabkan kantuk.',
    forPuyer: true,
  },
  {
    id: 'cetirizine',
    name: 'Setirizin',
    route: 'Oral',
    category: 'Lain-lain',
    dosePerKg: 0.25,
    dosePerKgMin: 0.1,
    dosePerKgMax: 0.25,
    freq: 1,
    maxSingle: 10,
    concentration: 1,
    availableForms: [
      { strength: 10, form: 'tablet' },
      { strength: 1, form: 'syrup', label: '5mg/5mL' },
    ],
    note: '0.25 mg/kg/dosis OD (maks 10mg). Antihistamin non-sedatif. Sirup 5mg/5mL untuk anak.',
    forPuyer: true,
  },
  {
    id: 'domperidone',
    name: 'Domperidon',
    route: 'Oral',
    category: 'Gastrointestinal',
    dosePerKg: 0.3,
    dosePerKgMin: 0.25,
    dosePerKgMax: 0.5,
    freq: 3,
    maxSingle: 10,
    concentration: 1,
    availableForms: [
      { strength: 10, form: 'tablet' },
      { strength: 1, form: 'syrup', label: '5mg/5mL' },
    ],
    note: '0.25–0.5 mg/kg/dosis 3×/hari. Antiemetik/prokinetik. Maks 10mg/dosis.',
    forPuyer: true,
  },
  {
    id: 'hyoscine',
    name: 'Hiosin Butilbromid',
    route: 'Oral',
    category: 'Gastrointestinal',
    dosePerKg: 0.4,
    dosePerKgMin: 0.3,
    dosePerKgMax: 0.5,
    freq: 3,
    maxSingle: 10,
    availableForms: [
      { strength: 10, form: 'tablet', label: 'Buscopan' },
    ],
    note: '0.3–0.5 mg/kg/dosis 3×/hari. Antispasmodik. Dewasa: 10–20mg 3×/hari. Tab Buscopan 10mg.',
    forPuyer: true,
  },
  {
    id: 'gg',
    name: 'GG (Gliseril Guaiakolat)',
    route: 'Oral',
    category: 'Pulmologi',
    dosePerKg: 3,
    dosePerKgMin: 2,
    dosePerKgMax: 4,
    freq: 4,
    maxSingle: 400,
    availableForms: [
      { strength: 100, form: 'tablet' },
    ],
    note: '2–4 mg/kg/dosis 4×/hari. Ekspektoran. Tab 100mg. Umum dalam puyer batuk anak.',
    forPuyer: true,
  },
  {
    id: 'prednisone',
    name: 'Prednison',
    route: 'Oral',
    category: 'Kortikosteroid',
    dosePerKg: 1,
    dosePerKgMin: 0.5,
    dosePerKgMax: 2,
    freq: 3,
    maxDay: 60,
    availableForms: [
      { strength: 5, form: 'tablet' },
    ],
    note: '0.5–2 mg/kg/hari dibagi 3×. Kortikosteroid. Taper bertahap; jangan dihentikan tiba-tiba.',
    forPuyer: true,
  },
]

// ── Combined list for puyer panel (preset drugs marked forPuyer + puyer drugs) ─

export const ALL_DRUGS: DrugPreset[] = [
  ...DRUG_PRESETS.filter((d) => d.forPuyer),
  ...PUYER_DRUGS,
]
