import { DRUG_PRESETS } from '../data/drugs'
import { INFUSION_PRESETS } from '../data/infusionDrugs'
import { Lang } from './landing'

/**
 * Methodology page copy.
 *
 * Two rules govern this file. Every figure is derived from the catalog, so the
 * page cannot claim something the data does not support. And the limitations
 * section is written to be USEFUL rather than defensive — where the app
 * rounds, estimates, assumes or lacks a citation, it says so plainly. A
 * methodology page that only lists strengths is marketing, not methodology.
 */

/** Drug count per dosing reference, derived. Sorted most-used first. */
export const SOURCE_COUNTS = Object.entries(
  DRUG_PRESETS.reduce<Record<string, number>>((acc, d) => {
    if (d.source) acc[d.source] = (acc[d.source] ?? 0) + 1
    return acc
  }, {}),
).sort((a, b) => b[1] - a[1])

export const ABOUT_FACTS = {
  drugs: DRUG_PRESETS.length,
  categories: new Set(DRUG_PRESETS.map((d) => d.category)).size,
  uncited: DRUG_PRESETS.filter((d) => !d.source).length,
  infusionDrugs: INFUSION_PRESETS.length,
  withRange: DRUG_PRESETS.filter((d) => d.dosePerKgMin != null && d.dosePerKgMax != null).length,
  withMax: DRUG_PRESETS.filter((d) => d.maxDay != null || d.maxSingle != null).length,
  withConcentration: DRUG_PRESETS.filter((d) => d.concentration != null).length,
}

interface Section {
  title: string
  body: string[]
}

interface AboutCopy {
  title: string
  lede: string
  sourcesTitle: string
  sourcesLede: string
  sourcesColDrug: string
  sourcesColCount: string
  howTitle: string
  how: Section[]
  limitsTitle: string
  limitsLede: string
  limits: { title: string; body: string }[]
  scopeTitle: string
  isTitle: string
  is: string[]
  isNotTitle: string
  isNot: string[]
  privacyTitle: string
  privacy: string[]
  disclaimer: string
}

export const ABOUT: Record<Lang, AboutCopy> = {
  id: {
    title: 'Cara kerja & sumber',
    lede:
      'Halaman ini menjelaskan dari mana angka dosis berasal, bagaimana perhitungannya, ' +
      'dan — yang sama pentingnya — di mana aplikasi ini membulatkan, memperkirakan, atau ' +
      'belum punya rujukan.',

    sourcesTitle: 'Sumber acuan dosis',
    sourcesLede: `Setiap obat di katalog mencantumkan acuan dosisnya, dan acuan itu ditampilkan di tempat angkanya muncul — bukan di catatan kaki. Dari ${ABOUT_FACTS.drugs} obat, berikut pembagiannya:`,
    sourcesColDrug: 'Sumber',
    sourcesColCount: 'Jumlah obat',

    howTitle: 'Bagaimana dosis dihitung',
    how: [
      {
        title: '1. Dosis harian',
        body: [
          'Berat badan (kg) × dosis (mg/kg/hari) = dosis harian total.',
          'Katalog selalu menyimpan dosis sebagai mg/kg/hari. Mode “Per kali” hanya mengubah cara angka ditampilkan, bukan besar dosisnya.',
        ],
      },
      {
        title: '2. Batas maksimum',
        body: [
          'Bila dosis harian melampaui batas maksimum obat, dosis dipotong ke batas itu dan ditandai.',
          `${ABOUT_FACTS.withMax} dari ${ABOUT_FACTS.drugs} obat punya batas maksimum harian atau per kali. Aplikasi juga menghitung pada berat berapa batas itu mulai berlaku, karena di atas berat tersebut dosis berhenti mengikuti berat badan.`,
        ],
      },
      {
        title: '3. Dosis per kali',
        body: ['Dosis harian ÷ frekuensi pemberian = dosis sekali minum atau sekali suntik.'],
      },
      {
        title: '4. Volume',
        body: [
          'Dosis per kali ÷ konsentrasi stok (mg/mL) = volume dalam mL.',
          `Konsentrasi tergantung sediaan yang ada di tangan Anda, jadi katalog hanya menyimpannya untuk ${ABOUT_FACTS.withConcentration} obat; sisanya Anda isi sendiri.`,
        ],
      },
      {
        title: '5. Takaran sediaan',
        body: [
          'Dosis per kali diterjemahkan ke sediaan nyata: ¼, ½, ¾, 1, 1½ tablet, atau volume sirup.',
          'Karena tablet hanya bisa dibelah pada pecahan tertentu, aplikasi menampilkan dosis yang benar-benar diberikan beserta selisihnya terhadap hasil hitung.',
        ],
      },
    ],

    limitsTitle: 'Batasan yang perlu diketahui',
    limitsLede:
      'Setiap alat hitung punya asumsi. Ini asumsi yang dipakai DoseRx, ditulis apa adanya.',
    limits: [
      {
        title: 'Pembulatan sediaan padat',
        body:
          'Tablet dibulatkan ke pecahan yang bisa dibelah, sehingga dosis yang diberikan bisa sedikit di atas atau di bawah hasil hitung. Selisihnya selalu ditampilkan; cairan diukur langsung tanpa pembulatan.',
      },
      {
        title: 'Estimasi berat dari usia',
        body:
          'Memakai formula APLS (0–12 bln dan 1–10 th) serta Luscombe & Owens (>10 th). Ini rata-rata populasi yang tidak memperhitungkan status gizi — cenderung terlalu tinggi pada anak kurus dan terlalu rendah pada anak gemuk. Timbang bila memungkinkan.',
      },
      {
        title: 'Puyer',
        body:
          'Perhitungan puyer mengasumsikan bahan tercampur rata dan terbagi sama banyak ke setiap bungkus. Ketepatan tiap bungkus bergantung pada peracikan.',
      },
      {
        title: 'Infus',
        body: `Tetes per menit memakai faktor set infus 20 tetes/mL (makro) dan 60 tetes/mL (mikro); set yang Anda pakai bisa berbeda. Konsentrasi awal tiap obat mengasumsikan pengenceran tertentu, yang ditampilkan di sebelah kolomnya. Katalog infus (${ABOUT_FACTS.infusionDrugs} obat) belum mencantumkan sumber acuan — ini kekurangan yang belum dilengkapi.`,
      },
    ],

    scopeTitle: 'Cakupan',
    isTitle: 'DoseRx adalah',
    is: [
      'alat bantu hitung dosis berbasis berat badan',
      'katalog referensi dosis dengan sumber yang dicantumkan',
      'alat pribadi yang berjalan penuh di perangkat Anda',
    ],
    isNotTitle: 'DoseRx bukan',
    isNot: [
      'sistem pendukung keputusan klinis',
      'sistem peresepan atau pencetak resep',
      'pemeriksa interaksi obat',
      'basis data farmasi lengkap',
      'produk yang tersertifikasi regulator',
    ],

    privacyTitle: 'Data & privasi',
    privacy: [
      'Tidak ada server. Semua perhitungan berjalan di browser Anda.',
      'Riwayat, preset kustom, dan favorit disimpan di localStorage perangkat ini saja.',
      'Tidak ada analitik, tidak ada pelacak, tidak ada permintaan ke pihak ketiga — termasuk fontnya.',
      'Label pasien bersifat opsional; gunakan inisial saja, jangan nama lengkap.',
    ],

    disclaimer:
      'DoseRx adalah alat bantu hitung, bukan sistem pendukung keputusan klinis atau resep. ' +
      'Nilai dosis preset adalah referensi umum dan tidak menggantikan penilaian klinis. ' +
      'Verifikasi setiap dosis terhadap panduan institusi dan sumber klinis terkini sebelum digunakan.',
  },

  en: {
    title: 'How it works & sources',
    lede:
      'Where the dosing values come from, how the arithmetic runs, and — just as ' +
      'importantly — where this app rounds, estimates, assumes, or has no citation yet.',

    sourcesTitle: 'Dosing references',
    sourcesLede: `Every drug in the catalog names its dosing reference, and that reference is shown where the number appears rather than in a footnote. Across ${ABOUT_FACTS.drugs} drugs:`,
    sourcesColDrug: 'Source',
    sourcesColCount: 'Drugs',

    howTitle: 'How a dose is calculated',
    how: [
      {
        title: '1. Daily dose',
        body: [
          'Body weight (kg) × dose (mg/kg/day) = total daily dose.',
          'The catalog always stores doses as mg/kg/day. The “per dose” mode changes how the number is displayed, not the size of the dose.',
        ],
      },
      {
        title: '2. Maximum',
        body: [
          'If the daily dose exceeds the drug’s ceiling it is capped there and flagged.',
          `${ABOUT_FACTS.withMax} of ${ABOUT_FACTS.drugs} drugs carry a daily or single-dose maximum. The app also computes the weight at which that ceiling starts binding, because above it the dose stops following body weight.`,
        ],
      },
      {
        title: '3. Dose per administration',
        body: ['Daily dose ÷ frequency = the amount given each time.'],
      },
      {
        title: '4. Volume',
        body: [
          'Dose per administration ÷ stock concentration (mg/mL) = volume in mL.',
          `Concentration depends on the preparation in your hand, so the catalog stores it for only ${ABOUT_FACTS.withConcentration} drugs; you supply the rest.`,
        ],
      },
      {
        title: '5. Real preparations',
        body: [
          'The per-dose amount is translated into what exists: ¼, ½, ¾, 1, 1½ tablets, or a syrup volume.',
          'Because tablets only split at certain fractions, the app shows the dose actually delivered and how far it is from the calculated figure.',
        ],
      },
    ],

    limitsTitle: 'Known limitations',
    limitsLede: 'Every calculator makes assumptions. These are the ones DoseRx makes.',
    limits: [
      {
        title: 'Rounding of solid forms',
        body:
          'Tablets are rounded to splittable fractions, so the delivered dose can land slightly above or below the calculated one. The gap is always shown; liquids are measured continuously and are not rounded.',
      },
      {
        title: 'Weight estimated from age',
        body:
          'Uses APLS (0–12 months and 1–10 years) and Luscombe & Owens (>10 years). These are population averages that ignore nutritional status — high for a wasted child, low for an obese one. Weigh the patient where possible.',
      },
      {
        title: 'Compounded powders (puyer)',
        body:
          'The calculation assumes the powder mixes evenly and divides equally across sachets. Per-sachet accuracy depends on the compounding itself.',
      },
      {
        title: 'Infusions',
        body: `Drops per minute assume a giving set of 20 drops/mL (macro) or 60 drops/mL (micro); yours may differ. Each drug's default concentration assumes a specific dilution, which is stated next to the field. The infusion catalog (${ABOUT_FACTS.infusionDrugs} drugs) does not yet cite sources — an acknowledged gap.`,
      },
    ],

    scopeTitle: 'Scope',
    isTitle: 'DoseRx is',
    is: [
      'a weight-based dose calculation aid',
      'a dosing reference catalog with its sources named',
      'a personal tool that runs entirely on your device',
    ],
    isNotTitle: 'DoseRx is not',
    isNot: [
      'a clinical decision support system',
      'a prescribing or prescription-printing system',
      'a drug interaction checker',
      'a complete pharmacy database',
      'a regulator-certified product',
    ],

    privacyTitle: 'Data & privacy',
    privacy: [
      'No server. Every calculation runs in your browser.',
      'History, custom presets and favourites live in this device’s localStorage only.',
      'No analytics, no trackers, no third-party requests — including the font.',
      'Patient labels are optional; use initials only, never full names.',
    ],

    disclaimer:
      'DoseRx is a calculation aid, not a clinical decision support or prescribing system. ' +
      'Preset dosing values are general references and do not replace clinical judgement. ' +
      'Verify every dose against institutional guidance and current clinical sources before use.',
  },
}

export const ABOUT_PATHS: Record<Lang, string> = { id: '/tentang', en: '/en/about' }
