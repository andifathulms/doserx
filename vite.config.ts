import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { SITE } from './src/site'

/**
 * The browser-chrome tint (theme-color meta tag, PWA manifest/splash) has to
 * agree with the app's own warm-monochrome palette, but used to live as a
 * literal copy of --stone-900/--stone-50 in site.ts — the exact "duplicated
 * literal that quietly drifts" this project has a standing rule against
 * (DESIGN-REWORK.md §9). Reading them straight out of index.css's token
 * block means a palette change here can't leave the chrome behind.
 */
function readStoneTokens() {
  const css = readFileSync(resolve(__dirname, 'src/index.css'), 'utf8')
  const find = (name: string) => {
    const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)
    if (!m) throw new Error(`vite.config.ts: --${name} not found in src/index.css`)
    return m[1]
  }
  return { themeColor: find('stone-900'), backgroundColor: find('stone-50') }
}

const { themeColor, backgroundColor } = readStoneTokens()

/**
 * Injects the metadata tags from SITE at build time. A hand-maintained copy in
 * index.html is what let the manifest and the page description drift apart, so
 * there is exactly one source now and no runtime cost — the tags are static by
 * the time the HTML is served.
 */
function metaTags() {
  const abs = (file: string) => new URL(file, SITE.url).href
  const tags = [
    ['description', SITE.description],
    ['og:title', SITE.title],
    ['og:description', SITE.description],
    ['og:type', 'website'],
    ['og:url', SITE.url],
    ['og:image', abs(SITE.ogImage)],
    ['og:image:width', '1200'],
    ['og:image:height', '630'],
    ['og:locale', 'id_ID'],
    ['og:site_name', SITE.name],
    ['twitter:card', 'summary_large_image'],
    ['twitter:title', SITE.title],
    ['twitter:description', SITE.description],
    ['twitter:image', abs(SITE.ogImage)],
    ['theme-color', themeColor],
  ]
  return {
    name: 'doserx-meta',
    // One route, so the sitemap has one entry — but without it (and robots)
    // there is nothing telling a crawler the site exists at all.
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', SITE.url).href}\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `  <url><loc>${SITE.url}</loc></url>\n` +
          '</urlset>\n',
      })
    },
    // GitHub Pages has no rewrite rules, so a deep link like /obat/paracetamol
    // would 404 on refresh or when opened cold. Pages serves 404.html for any
    // unknown path; shipping a copy of the built index.html there hands control
    // to the client router with the URL intact. Copied in closeBundle, after
    // the HTML has been transformed and written.
    closeBundle() {
      const out = resolve(__dirname, 'dist')
      const html = resolve(out, 'index.html')
      if (existsSync(html)) copyFileSync(html, resolve(out, '404.html'))
    },
    transformIndexHtml() {
      return [
        { tag: 'title', children: SITE.title, injectTo: 'head' as const },
        { tag: 'link', attrs: { rel: 'canonical', href: SITE.url }, injectTo: 'head' as const },
        ...tags.map(([key, content]) => ({
          tag: 'meta',
          // og:* is RDFa (property); twitter:* and the rest are name.
          attrs: key.startsWith('og:') ? { property: key, content } : { name: key, content },
          injectTo: 'head' as const,
        })),
      ]
    },
  }
}

/**
 * Build stamp, shown small in the footer.
 *
 * Half of this project's UI feedback loop has been "is that fixed, or am I
 * looking at a cached build?" — a visible identifier answers it in one glance
 * instead of a round trip.
 */
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  base: '/doserx/',
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Explicit chunking. Left to itself, Rollup merges the small shared
         * modules back into the entry, which quietly undoes the route split:
         * the landing copy, the methodology copy and the 92-drug catalog all
         * ended up on the critical path of every route.
         *
         * react-vendor is separated because it is the largest single thing
         * here and it never changes between deploys — a content edit should
         * not invalidate 46 kB of framework in everyone's cache.
         */
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor'
            }
            return 'vendor'
          }
          // The drug catalog: needed by the calculator, the catalog index and
          // every drug page, but NOT by the methodology page.
          if (id.includes('/src/data/')) return 'catalog'
          // Landing and about copy, shared by the two bilingual routes only.
          if (id.includes('/src/content/')) return 'content'
          return undefined
        },
        // Small shared chunks are the point of this split; do not let them be
        // merged back into their importers.
        experimentalMinChunkSize: 0,
      },
    },
  },
  plugins: [
    react(),
    metaTags(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/icon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        // The installed app is the doctor's tool: it opens straight into the
        // calculator and never shows the marketing landing page.
        start_url: '/doserx/hitung/preset',
        name: SITE.title,
        short_name: SITE.name,
        description: SITE.description,
        lang: SITE.lang,
        theme_color: themeColor,
        background_color: backgroundColor,
        display: 'standalone',
        icons: [
          // PNG rather than SVG: Android's launcher support for SVG icons is
          // still patchy. Declared 'any' only — the brand icon already has its
          // own rounded corners, and 'maskable' would let the launcher crop
          // them a second time.
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // The font is same-origin now, so it is picked up by the precache
        // glob below — the two runtimeCaching rules for Google's origins are
        // gone with the origins themselves.
        // icons/*.png is listed explicitly so the launcher icons are cached
        // without dragging the 57 kB social preview image into the precache.
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png'],
      },
    }),
  ],
  test: {
    environment: 'node',
    // Vitest stubs CSS imports to '' by default, which would make the
    // stylesheet-coverage test silently pass against an empty string.
    css: true,
  },
})
