import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { CatalogPage } from './CatalogPage'
import { DrugPage } from './DrugPage'
import { LandingPage } from './LandingPage'
import { AboutPage } from './AboutPage'
import { SOURCE_COUNTS, ABOUT_FACTS } from '../content/about'
import { DRUG_PRESETS } from '../data/drugs'

/**
 * Server-render smoke tests. They catch two classes of bug at once: a page that
 * throws on some catalog entry (a missing optional field, an undefined map),
 * and any component that touches window/localStorage at render time — which
 * would break the prerender step in phase 6.
 */
describe('CatalogPage', () => {
  it('renders every drug as a link to its own page', () => {
    const html = renderToString(<CatalogPage />)
    expect(html).toContain('Katalog obat')
    for (const drug of DRUG_PRESETS) {
      expect(html).toContain(`/doserx/obat/${drug.id}`)
    }
  })
})

describe('DrugPage', () => {
  it('renders all 92 drug pages without throwing', () => {
    for (const drug of DRUG_PRESETS) {
      const html = renderToString(<DrugPage id={drug.id} onHistoryUpdated={() => {}} />)
      expect(html).toContain(drug.name)
      // The calculator travels with the page — landing from a search result
      // and getting a dose must not require a detour.
      expect(html).toContain('Hitung')
    }
  })

  it('cites the dosing reference on the page itself', () => {
    const withSource = DRUG_PRESETS.find((d) => d.source)!
    const html = renderToString(<DrugPage id={withSource.id} onHistoryUpdated={() => {}} />)
    expect(html).toContain(withSource.source!)
  })

  it('handles an unknown id without throwing', () => {
    const html = renderToString(<DrugPage id="tidak-ada" onHistoryUpdated={() => {}} />)
    expect(html).toContain('tidak ditemukan')
  })
})

describe('LandingPage', () => {
  it('renders both languages with their own copy', () => {
    const id = renderToString(<LandingPage lang="id" />)
    const en = renderToString(<LandingPage lang="en" />)
    expect(id).toContain('Buka kalkulator')
    expect(en).toContain('Open the calculator')
    // Each links to the other, so the toggle is a real URL either way.
    expect(id).toContain('/doserx/en')
    expect(en).toContain('href="/doserx/"')
  })

  it('derives catalog figures instead of hardcoding them', () => {
    const html = renderToString(<LandingPage lang="id" />)
    expect(html).toContain(String(DRUG_PRESETS.length))
    // Sources are listed from the data, so a new reference shows up by itself.
    expect(html).toContain('IDAI')
  })

  it('carries the safety disclaimer on the landing page itself', () => {
    for (const lang of ['id', 'en'] as const) {
      const html = renderToString(<LandingPage lang={lang} />)
      expect(html.toLowerCase()).toMatch(/bukan sistem pendukung|not a clinical decision support/)
    }
  })

  it('always offers a route into the calculator', () => {
    const html = renderToString(<LandingPage lang="id" />)
    expect(html).toContain('/doserx/hitung/preset')
  })
})

describe('AboutPage', () => {
  it('derives the source breakdown from the catalog', () => {
    const html = renderToString(<AboutPage lang="id" />)
    for (const [source, count] of SOURCE_COUNTS) {
      expect(html).toContain(source)
      expect(html).toContain(`<td>${count}</td>`)
    }
    // Counts must add up to the catalog, or the table is lying by omission.
    const total = SOURCE_COUNTS.reduce((n, [, c]) => n + c, 0) + ABOUT_FACTS.uncited
    expect(total).toBe(DRUG_PRESETS.length)
  })

  it('states the limitations, not just the strengths', () => {
    const id = renderToString(<AboutPage lang="id" />)
    const en = renderToString(<AboutPage lang="en" />)
    expect(id).toContain('Batasan')
    expect(en).toContain('Known limitations')
    // The infusion catalog has no citations yet; the page must admit it.
    expect(id).toMatch(/belum mencantumkan sumber/)
    expect(en).toMatch(/does not yet cite sources/)
  })

  it('lists the PRD non-goals as explicit non-goals', () => {
    const html = renderToString(<AboutPage lang="en" />)
    expect(html).toContain('drug interaction checker')
    expect(html).toContain('clinical decision support system')
  })

  it('links between the two languages', () => {
    expect(renderToString(<AboutPage lang="id" />)).toContain('/doserx/en/about')
    expect(renderToString(<AboutPage lang="en" />)).toContain('/doserx/tentang')
  })
})
