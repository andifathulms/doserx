/**
 * Single source of truth for site metadata.
 *
 * The HTML meta tags and the PWA manifest were maintained by hand in two
 * places and had already drifted: the manifest still carried the description
 * that index.html replaced two passes ago, and its `lang` said "en" for an
 * app that is entirely Indonesian. Both are now generated from here — see
 * the transformIndexHtml hook and the manifest block in vite.config.ts.
 *
 * Imported by the build only; nothing here ships in the JS bundle.
 */
export const SITE = {
  name: 'DoseRx',
  title: 'DoseRx — Kalkulator Dosis Berbasis Berat Badan',
  /** Matches the on-page value proposition in App.tsx's app-subtitle. */
  description:
    'Masukkan berat badan pasien, dapatkan dosis mg dan volume mL siap pakai. ' +
    'Kalkulator dosis obat untuk tenaga medis — berjalan offline di perangkat.',
  lang: 'id',
  /** GitHub Pages origin + Vite base. Used for canonical and og:url. */
  url: 'https://andifathulms.github.io/doserx/',
  ogImage: 'og.png',

  /* Matches --stone-900 (the CTA/editorial-chrome colour) and --c-bg (warm
     bone canvas) in index.css, so the browser chrome tint and PWA splash
     screen agree with the shipped warm-monochrome brand. */
  themeColor: '#111111',
  backgroundColor: '#fbfbfa',
} as const
