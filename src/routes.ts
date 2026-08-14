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
      'shown. A clinical dose calculator for 92 drugs — runs offline, nothing leaves your device.',
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
    navLabel: 'Hitung',
    nav: true,
    index: true,
  },
  {
    path: '/obat',
    id: 'catalog',
    title: 'Katalog obat',
    description:
      'Katalog 92 obat dengan dosis berbasis berat badan, sediaan yang tersedia, efek samping dan sumber acuannya (IDAI, BNFc, Fornas, WHO, Kemenkes).',
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
    path: '/tentang',
    id: 'about',
    title: 'Cara kerja & sumber',
    description:
      'Dari mana nilai dosis DoseRx berasal (IDAI, BNFc, Fornas, WHO, Kemenkes), bagaimana ' +
      'perhitungannya, dan di mana aplikasi ini membulatkan, memperkirakan atau belum punya rujukan.',
    navLabel: 'Tentang',
    nav: true,
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
    // Personal data, and nothing to index — deliberately kept out of both.
    nav: false,
    index: false,
  },
  { path: '*', id: 'notfound', title: 'Halaman tidak ditemukan', description: '' },
]

/** Nav items, in the order they should appear. */
export const NAV_ITEMS = ROUTES.filter((r) => r.nav).map((r) => ({
  // The calculator's nav link points at a concrete mode, not the :mode pattern.
  href: r.id === 'calculator' ? '/hitung' : r.path,
  match: r.id === 'calculator' ? '/hitung' : r.path,
  label: r.navLabel!,
  id: r.id,
}))

/**
 * The four calculator modes. Lives here rather than in App because the
 * prerender needs it too: /hitung/:mode is a pattern, so the build has to
 * expand it, and a second hand-written list would drift from the tabs.
 */
export const CALCULATOR_MODES = [
  {
    id: 'preset',
    label: 'Preset',
    hint: 'Hitung dosis satu obat dari katalog siap pakai — dosis/kg sudah terisi.',
  },
  {
    id: 'custom',
    label: 'Kustom',
    hint: 'Obat di luar katalog — masukkan sendiri dosis/kg, frekuensi, dan konsentrasi.',
  },
  {
    id: 'puyer',
    label: 'Puyer',
    hint: 'Racik 2 obat atau lebih sekaligus menjadi satu resep puyer per bungkus.',
  },
  {
    id: 'infus',
    label: 'Infus',
    hint: 'Obat drip — hitung kecepatan infus (mL/jam) dan tetes per menit.',
  },
  {
    id: 'cairan',
    label: 'Cairan',
    hint: 'Cairan rumatan anak (mL/jam, tetes per menit) dan koreksi dekstrosa g/kg.',
  },
] as const

export const MODE_IDS: readonly string[] = CALCULATOR_MODES.map((m) => m.id)

export function routeTitle(id: string): string {
  const r = ROUTES.find((x) => x.id === id)
  if (!r || r.id === 'home') return SITE.title
  return `${r.title} — ${SITE.name}`
}
