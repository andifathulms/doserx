import { SITE } from './site'

/**
 * The route table, as data.
 *
 * One list drives the router, the navigation, the document title, the
 * per-route metadata and (from phase 6) the prerender and the sitemap. That
 * single-source rule is the one we set when the manifest description drifted
 * from the page description — a nav label or a <title> maintained in two
 * places will drift the same way.
 *
 * `nav` marks the items that appear in site navigation; `index` marks routes
 * that belong in the sitemap. Dynamic routes (/obat/:id) are expanded from the
 * catalog at build time rather than listed here.
 */
export interface RouteDef {
  path: string
  id: string
  /** Document title, without the site-name suffix. */
  title: string
  description: string
  /** Short label for the header and bottom nav. */
  navLabel?: string
  nav?: boolean
  index?: boolean
}

export const ROUTES: RouteDef[] = [
  {
    path: '/',
    id: 'home',
    title: SITE.title,
    description: SITE.description,
    navLabel: 'Beranda',
    nav: true,
    index: true,
  },
  {
    path: '/en',
    id: 'home-en',
    title: 'DoseRx — Weight-Based Dose Calculator',
    description:
      "Enter a patient's weight and get the dose in mg and the volume in mL, with the working " +
      'shown. A clinical dose calculator for 127 drugs — runs offline, nothing leaves your device.',
    index: true,
  },
  {
    path: '/hitung',
    id: 'calculator-index',
    title: 'Kalkulator dosis',
    description: SITE.description,
  },
  {
    path: '/hitung/:mode',
    id: 'calculator',
    title: 'Kalkulator dosis',
    description: SITE.description,
    index: true,
  },
  {
    path: '/obat',
    id: 'catalog',
    title: 'Obat',
    description:
      'Cari obat, lihat dosisnya langsung untuk berat pasien, lalu buka untuk mg dan mL per rute — dengan sediaan, efek samping dan sumber acuannya (IDAI, BNFc, Fornas, WHO, Kemenkes).',
    navLabel: 'Obat',
    nav: true,
    index: true,
  },
  {
    path: '/obat/:id',
    id: 'drug',
    title: 'Obat',
    description: '',
    index: true,
  },
  {
    path: '/darurat',
    id: 'darurat',
    title: 'Darurat',
    description:
      'Paket darurat untuk satu berat badan: intubasi (RSI), resusitasi, kejang bertahap dan anafilaksis — dosis mg dan volume mL siap tarik.',
    navLabel: 'Darurat',
    nav: true,
    index: true,
  },
  {
    path: '/tentang',
    id: 'about',
    title: 'Cara kerja & sumber',
    description:
      'Dari mana nilai dosis DoseRx berasal (IDAI, BNFc, Fornas, WHO, Kemenkes), bagaimana ' +
      'perhitungannya, dan di mana aplikasi ini membulatkan, memperkirakan atau belum punya rujukan.',
    navLabel: 'Tentang',
    index: true,
  },
  {
    path: '/en/about',
    id: 'about-en',
    title: 'How it works & sources',
    description:
      'Where DoseRx dosing values come from, how the arithmetic runs, and where the app rounds, ' +
      'estimates, assumes or lacks a citation.',
    index: true,
  },
  {
    path: '/riwayat',
    id: 'history',
    title: 'Riwayat perhitungan',
    description:
      'Riwayat perhitungan dosis yang tersimpan di perangkat ini. Tidak ada data yang dikirim ke server.',
    navLabel: 'Riwayat',
    // Personal data: in the navigation, never in the sitemap.
    index: false,
  },
  {
    path: '/tinjau',
    id: 'review',
    title: 'Tinjau draf obat',
    description: 'Daftar draf dosis yang menunggu verifikasi klinisi sebelum tampil di aplikasi.',
    // A working page for the reviewing clinician: never in nav or sitemap.
    index: false,
  },
  { path: '*', id: 'notfound', title: 'Halaman tidak ditemukan', description: '' },
]

/**
 * Primary navigation — the bottom bar on phones, the header on desktop. Five
 * working destinations organised by clinical task, not by calculation type:
 * the landing and methodology pages are reachable from the header, not from
 * the thumb zone.
 *
 * `match` lists every path prefix that counts as "inside" an item — Kustom
 * and the drip list are part of Obat, not destinations of their own.
 */
export type NavIcon = 'obat' | 'darurat' | 'puyer' | 'cairan' | 'riwayat'

export interface NavItem {
  id: string
  href: string
  match: string[]
  label: string
  icon: NavIcon
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'catalog', href: '/obat', match: ['/obat', '/hitung/custom', '/hitung/infus'], label: 'Obat', icon: 'obat' },
  { id: 'darurat', href: '/darurat', match: ['/darurat'], label: 'Darurat', icon: 'darurat' },
  { id: 'puyer', href: '/hitung/puyer', match: ['/hitung/puyer'], label: 'Puyer', icon: 'puyer' },
  { id: 'cairan', href: '/hitung/cairan', match: ['/hitung/cairan'], label: 'Cairan', icon: 'cairan' },
  { id: 'history', href: '/riwayat', match: ['/riwayat'], label: 'Riwayat', icon: 'riwayat' },
]

/**
 * The calculator pages under /hitung. Preset is gone as a mode: picking a
 * drug is the Obat list, and every drug page carries its own calculator.
 * Lives here rather than in App because the prerender expands /hitung/:mode
 * from it too.
 */
export const CALCULATOR_MODES = [
  {
    id: 'custom',
    label: 'Obat lain',
    title: 'Obat lain (kustom)',
    hint: 'Obat di luar katalog — masukkan sendiri dosis/kg, frekuensi, dan konsentrasi.',
  },
  {
    id: 'puyer',
    label: 'Puyer',
    title: 'Racik puyer',
    hint: 'Racik 2 obat atau lebih sekaligus menjadi satu resep puyer per bungkus.',
  },
  {
    id: 'infus',
    label: 'Obat drip',
    title: 'Obat drip',
    hint: 'Kecepatan infus (mL/jam) dan tetes per menit untuk obat drip.',
  },
  {
    id: 'cairan',
    label: 'Cairan',
    title: 'Cairan & elektrolit',
    hint: 'Cairan rumatan anak (mL/jam, tetes per menit) dan koreksi dekstrosa g/kg.',
  },
] as const

export const MODE_IDS: readonly string[] = CALCULATOR_MODES.map((m) => m.id)

export function routeTitle(id: string): string {
  const r = ROUTES.find((x) => x.id === id)
  if (!r || r.id === 'home') return SITE.title
  return `${r.title} — ${SITE.name}`
}
