import { DRUG_PRESETS } from '../data/drugs'
import { CATEGORY_ORDER } from '../data/categories'

/**
 * Landing copy, both languages in one file.
 *
 * The app itself stays Indonesian — that is the real product for the real
 * user. Only the landing and the about page are bilingual, so someone who
 * cannot read the clinical copy can still understand what this is. Keeping
 * both languages side by side in one structure is the same anti-drift rule we
 * applied to the metadata: a translation maintained in a separate file gets
 * updated on one side only.
 *
 * The figures are DERIVED from the catalog, never typed in. "92 drugs" written
 * by hand becomes a lie the first time a drug is added.
 */

export type Lang = 'id' | 'en'

const drugCount = DRUG_PRESETS.length
const categoryCount = new Set(DRUG_PRESETS.map((d) => d.category)).size
const sources = [...new Set(DRUG_PRESETS.map((d) => d.source).filter(Boolean))] as string[]

export const CATALOG_FACTS = {
  drugs: drugCount,
  categories: categoryCount,
  sources,
  calculators: 4,
  // Ordered for display; unused categories are already filtered by the catalog.
  categoryNames: CATEGORY_ORDER,
}

interface LandingCopy {
  eyebrow: string
  title: string
  titleAccent: string
  lede: string
  ctaPrimary: string
  ctaSecondary: string
  demoTitle: string
  demoNote: string
  chainTitle: string
  chainLede: string
  chain: { label: string; detail: string }[]
  factsTitle: string
  facts: { value: string; label: string; href?: string }[]
  trustTitle: string
  trust: { title: string; body: string }[]
  disclaimer: string
  closingTitle: string
  closingBody: string
  closingCta: string
}

export const LANDING: Record<Lang, LandingCopy> = {
  id: {
    eyebrow: 'Kalkulator dosis klinis',
    title: 'Berat badan masuk, ',
    titleAccent: 'dosis siap pakai keluar.',
    lede:
      'Masukkan berat badan pasien dan dapatkan dosis dalam mg, volume dalam mL, dan takaran ' +
      'sediaan yang benar-benar ada di apotek — lengkap dengan cara hitungnya, bukan hanya angka akhir.',
    ctaPrimary: 'Buka kalkulator',
    ctaSecondary: `Telusuri ${drugCount} obat`,
    demoTitle: 'Coba sekarang',
    demoNote: 'Ubah berat badannya — semua angka di bawah ikut berubah.',
    chainTitle: 'Setiap angka bisa ditelusuri',
    chainLede:
      'Dosis bukan hasil tebakan yang muncul begitu saja. Ini rantai perhitungannya, ' +
      'dan aplikasi menampilkan setiap langkahnya — termasuk saat dosis dibatasi maksimum.',
    chain: [
      { label: 'Berat badan × mg/kg/hari', detail: 'Dosis harian total' },
      { label: '÷ frekuensi', detail: 'Dosis per kali pemberian' },
      { label: '÷ konsentrasi stok', detail: 'Volume dalam mL' },
      { label: '→ sediaan nyata', detail: 'Tablet, sirup, atau supp yang ada' },
    ],
    factsTitle: 'Isi katalog',
    facts: [
      { value: String(drugCount), label: 'obat', href: '/obat' },
      { value: String(categoryCount), label: 'kategori terapi', href: '/obat' },
      { value: String(sources.length), label: 'sumber acuan' },
      { value: '4', label: 'mode hitung', href: '/hitung' },
    ],
    trustTitle: 'Yang perlu Anda tahu',
    trust: [
      {
        title: 'Setiap dosis ada sumbernya',
        body: `Nilai dosis mengacu pada ${sources.join(', ')} — dicantumkan langsung di tempat angkanya muncul, bukan di catatan kaki.`,
      },
      {
        title: 'Tidak ada data yang keluar dari perangkat',
        body:
          'Semua perhitungan berjalan di browser Anda. Tidak ada server, tidak ada akun, ' +
          'tidak ada pelacakan. Riwayat tersimpan hanya di perangkat ini.',
      },
      {
        title: 'Bisa dipakai tanpa internet',
        body:
          'Setelah dibuka sekali, aplikasi bisa dipasang ke layar utama dan tetap berjalan ' +
          'penuh saat sinyal hilang — termasuk seluruh katalog obatnya.',
      },
    ],
    disclaimer:
      'DoseRx adalah alat bantu hitung, bukan sistem pendukung keputusan klinis atau resep. ' +
      'Nilai preset adalah referensi umum; verifikasi setiap dosis dengan panduan institusi ' +
      'dan penilaian klinis Anda sebelum digunakan.',
    closingTitle: 'Siap menghitung?',
    closingBody: 'Tidak perlu daftar, tidak perlu pasang apa pun.',
    closingCta: 'Mulai hitung dosis',
  },

  en: {
    eyebrow: 'Clinical dose calculator',
    title: 'Weight in, ',
    titleAccent: 'ready-to-give dose out.',
    lede:
      "Enter a patient's weight and get the dose in mg, the volume in mL, and the amount of a " +
      'preparation that actually exists in a pharmacy — with the working shown, not just the answer.',
    ctaPrimary: 'Open the calculator',
    ctaSecondary: `Browse ${drugCount} drugs`,
    demoTitle: 'Try it',
    demoNote: 'Change the weight — every number below re-derives.',
    chainTitle: 'Every number is traceable',
    chainLede:
      'A dose is a derivation, not a lookup. This is the chain, and the app shows every step ' +
      'of it — including where a maximum caps the result.',
    chain: [
      { label: 'weight × mg/kg/day', detail: 'total daily dose' },
      { label: '÷ frequency', detail: 'dose per administration' },
      { label: '÷ stock concentration', detail: 'volume in mL' },
      { label: '→ real preparation', detail: 'the tablet, syrup or supp on hand' },
    ],
    factsTitle: "What's in it",
    facts: [
      { value: String(drugCount), label: 'drugs', href: '/obat' },
      { value: String(categoryCount), label: 'therapeutic categories', href: '/obat' },
      { value: String(sources.length), label: 'reference sources' },
      { value: '4', label: 'calculators', href: '/hitung' },
    ],
    trustTitle: 'What you should know',
    trust: [
      {
        title: 'Every dose cites its source',
        body: `Dosing values follow ${sources.join(', ')} — shown where the number appears, not in a footnote.`,
      },
      {
        title: 'Nothing leaves the device',
        body:
          'Every calculation runs in your browser. No server, no account, no tracking. ' +
          'History is stored on this device only.',
      },
      {
        title: 'Works without a connection',
        body:
          'After one visit it installs to a home screen and keeps working with no signal — ' +
          'the entire drug catalog included.',
      },
    ],
    disclaimer:
      'DoseRx is a calculation aid, not a clinical decision support or prescribing system. ' +
      'Preset values are general references; verify every dose against your institutional ' +
      'guidelines and clinical judgement before use.',
    closingTitle: 'Ready to calculate?',
    closingBody: 'No sign-up, nothing to install.',
    closingCta: 'Start calculating',
  },
}

/** The app UI is Indonesian-only; the landing pair is the only bilingual surface. */
export const LANG_PATHS: Record<Lang, string> = { id: '/', en: '/en' }
