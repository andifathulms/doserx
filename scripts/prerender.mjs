import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * Writes a real HTML file for every route.
 *
 * Two problems solved at once:
 *
 * 1. HTTP status. GitHub Pages has no rewrites, so every path except '/' was
 *    being served by 404.html — correct content, 404 status. Crawlers and link
 *    preview bots take that literally, which made 92 drug pages invisible. A
 *    real file at each path is served with 200.
 *
 * 2. Content. The served markup was <div id="root"></div>. Anything that does
 *    not execute JavaScript — including WhatsApp and LinkedIn preview bots —
 *    saw an empty page. Now the HTML arrives complete and React hydrates it.
 *
 * No new dependency: react-dom/server already ships inside react-dom, and the
 * SSR bundle is built by Vite's own --ssr mode.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

const { render, ROUTES, CALCULATOR_MODES, SITE, DRUG_PRESETS } = await import(
  pathToFileURL(resolve(root, 'dist-ssr/entry-server.js')).href
)

const template = readFileSync(resolve(dist, 'index.html'), 'utf8')

const abs = (path) => new URL(path.replace(/^\//, ''), SITE.url).href

/** Language pairs, so each page can point at its counterpart. */
const ALTERNATES = {
  '/': { id: '/', en: '/en' },
  '/en': { id: '/', en: '/en' },
  '/tentang': { id: '/tentang', en: '/en/about' },
  '/en/about': { id: '/tentang', en: '/en/about' },
}

function pageMeta(path) {
  const drugMatch = path.match(/^\/obat\/(.+)$/)
  if (drugMatch) {
    const drug = DRUG_PRESETS.find((d) => d.id === drugMatch[1])
    if (!drug) return null
    const range =
      drug.dosePerKgMin != null && drug.dosePerKgMax != null
        ? `${drug.dosePerKgMin}–${drug.dosePerKgMax}`
        : String(drug.dosePerKg)
    return {
      // Descriptions are BUILT FROM THE CATALOG, never written by hand — the
      // rule we adopted when the manifest description drifted from the page.
      title: `Dosis ${drug.name} — ${SITE.name}`,
      description:
        `Dosis ${drug.name} berbasis berat badan: ${range} mg/kg/hari, ${drug.freq}×/hari, ` +
        `${drug.route}.${drug.source ? ` Acuan ${drug.source}.` : ''} Hitung mg dan mL langsung ` +
        `di halaman ini.`,
      lang: 'id',
    }
  }

  // /hitung/:mode is a pattern; expand it from the same mode table the tabs use.
  const modeMatch = path.match(/^\/hitung\/(.+)$/)
  if (modeMatch) {
    const mode = CALCULATOR_MODES.find((m) => m.id === modeMatch[1])
    if (!mode) return null
    return {
      title: `Kalkulator ${mode.label} — ${SITE.name}`,
      description: mode.hint,
      lang: 'id',
    }
  }

  const route = ROUTES.find((r) => r.path === path)
  if (!route) return null
  return {
    title: route.id === 'home' ? SITE.title : `${route.title} — ${SITE.name}`,
    description: route.description || SITE.description,
    lang: path === '/en' || path.startsWith('/en/') ? 'en' : 'id',
  }
}

function headFor(path, meta) {
  const canonical = abs(path === '/' ? '' : path)
  const tags = [
    `<link rel="canonical" href="${canonical}">`,
    `<meta name="description" content="${escapeAttr(meta.description)}">`,
    `<meta property="og:title" content="${escapeAttr(meta.title)}">`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}">`,
  ]

  const alt = ALTERNATES[path]
  if (alt) {
    tags.push(`<link rel="alternate" hreflang="id" href="${abs(alt.id === '/' ? '' : alt.id)}">`)
    tags.push(`<link rel="alternate" hreflang="en" href="${abs(alt.en)}">`)
    tags.push(`<link rel="alternate" hreflang="x-default" href="${abs('')}">`)
  }

  // History is personal; there is nothing to index and nothing to preview.
  if (path === '/riwayat') tags.push('<meta name="robots" content="noindex">')

  return tags.join('\n    ')
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function buildHtml(path, meta, body) {
  let html = template
  // Replace the build-time title/description/canonical/og with per-route ones.
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeAttr(meta.title)}</title>`)
  html = html.replace(/\s*<link rel="canonical"[^>]*>/g, '')
  html = html.replace(/\s*<meta name="description"[^>]*>/g, '')
  html = html.replace(/\s*<meta property="og:(title|description|url)"[^>]*>/g, '')
  html = html.replace(/\s*<meta name="twitter:(title|description)"[^>]*>/g, '')
  html = html.replace('</head>', `  ${headFor(path, meta)}\n  </head>`)
  html = html.replace('<html lang="id"', `<html lang="${meta.lang}"`)
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  return html
}

function writePage(path, html) {
  const target =
    path === '/' ? resolve(dist, 'index.html') : resolve(dist, `.${path}/index.html`)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
}

// ── Routes to emit ───────────────────────────────────────────────────────────
// Static routes from the table, plus one page per drug and one per calculator
// mode. Everything gets a file (so it is served with 200); only the content
// routes are worth prerendering body HTML for.
const paths = [
  ...ROUTES.filter((r) => !r.path.includes(':') && r.path !== '*').map((r) => r.path),
  ...CALCULATOR_MODES.map((m) => `/hitung/${m.id}`),
  ...DRUG_PRESETS.map((d) => `/obat/${d.id}`),
]

let count = 0
for (const path of paths) {
  const meta = pageMeta(path)
  if (!meta) continue
  let body = ''
  try {
    body = render(path)
  } catch (err) {
    // A page that cannot be rendered still gets a shell with correct metadata,
    // and the failure is reported rather than silently shipped as an empty page.
    console.warn(`  ! prerender failed for ${path}: ${err.message}`)
  }
  writePage(path, buildHtml(path, meta, body))
  count++
}

// 404.html keeps the client-router fallback for anything not listed above.
if (existsSync(resolve(dist, '404.html'))) {
  const meta = { title: SITE.title, description: SITE.description, lang: 'id' }
  writeFileSync(resolve(dist, '404.html'), buildHtml('/', meta, ''))
}

// ── Sitemap ──────────────────────────────────────────────────────────────────
const indexable = paths.filter((p) => {
  if (p === '/riwayat') return false
  const route = ROUTES.find((r) => r.path === p)
  if (route) return route.index === true
  return p.startsWith('/obat/') || p.startsWith('/hitung/')
})

const urls = indexable
  .map((p) => {
    const loc = abs(p === '/' ? '' : p)
    const alt = ALTERNATES[p]
    const links = alt
      ? `\n    <xhtml:link rel="alternate" hreflang="id" href="${abs(alt.id === '/' ? '' : alt.id)}"/>` +
        `\n    <xhtml:link rel="alternate" hreflang="en" href="${abs(alt.en)}"/>`
      : ''
    return `  <url>\n    <loc>${loc}</loc>${links}\n  </url>`
  })
  .join('\n')

writeFileSync(
  resolve(dist, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls +
    '\n</urlset>\n',
)

console.log(`  prerendered ${count} pages, sitemap lists ${indexable.length}`)
