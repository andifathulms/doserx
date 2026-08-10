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

  /* NOTE: these two are the CURRENT shipped colours, not the brand palette.
     theme-color #2563eb is the old blue and does not match --c-primary
     (teal #0d9488); background #f1f5f9 is slate against a mint #f2f8f6 page.
     Correcting them changes the browser chrome tint and the PWA splash — a
     visible change, so it is deliberately NOT made in a performance pass.
     Left here, named, for whenever that is a decision you want to take. */
  themeColor: '#2563eb',
  backgroundColor: '#f1f5f9',
} as const
