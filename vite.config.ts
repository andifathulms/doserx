import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { SITE } from './src/site'

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
    ['theme-color', SITE.themeColor],
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

export default defineConfig({
  base: '/doserx/',
  plugins: [
    react(),
    metaTags(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: SITE.title,
        short_name: SITE.name,
        description: SITE.description,
        lang: SITE.lang,
        theme_color: SITE.themeColor,
        background_color: SITE.backgroundColor,
        display: 'standalone',
        start_url: '/doserx/',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // The font is same-origin now, so it is picked up by the precache
        // glob below — the two runtimeCaching rules for Google's origins are
        // gone with the origins themselves.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
