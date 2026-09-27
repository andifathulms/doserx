import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { CatalogPage } from './CatalogPage'
import { DrugPage } from './DrugPage'
import { LandingPage } from './LandingPage'
import { AboutPage } from './AboutPage'
import { SOURCE_COUNTS, ABOUT_FACTS } from '../content/about'
import { DRUG_PRESETS } from '../data/drugs'
import { LIVE_CATALOG } from '../data/catalog'

/**
 * Server-render smoke tests. They catch two classes of bug at once: a page that
 * throws on some catalog entry (a missing optional field, an undefined map),
 * and any component that touches window/localStorage at render time — which
 * would break the prerender step in phase 6.
 */
describe('CatalogPage', () => {
  it('renders every live catalog drug as a link to its own page', () => {
    const html = renderToString(<CatalogPage />)
    expect(html).toContain('<h1')
    for (const drug of LIVE_CATALOG) {
      expect(html).toContain(`/doserx/obat/${drug.id}`)
    }
  })

  it('offers the custom calculator from the list, and carries the disclaimer', () => {
    const html = renderToString(<CatalogPage />)
    expect(html).toContain('/doserx/hitung/custom')
    // Compact wording on the list, but both halves of the requirement.
    expect(html.toLowerCase()).toMatch(/bukan (sistem )?pendukung keputusan klinis/)
    expect(html.toLowerCase()).toContain('verifikasi')
  })
})

describe('DrugPage', () => {
  it('renders all 92 drug pages without throwing', () => {
    for (const drug of DRUG_PRESETS) {
      const html = renderToString(<DrugPage id={drug.id} onHistoryUpdated={() => {}} />)
      expect(html).toContain(drug.name)
      // The calculator travels with the page — landing from a search result
      // and getting a dose must not require a detour. Results are live, so
      // there is no button to look for: the dose field and the prompt that
      // points at the patient bar are the calculator's footprint.
      expect(html).toContain(`id="drug-${drug.id}-dose"`)
      expect(html).toContain('weight-prompt')
    }
  })

  it('cites the dosing reference on the page itself', () => {
    const withSource = DRUG_PRESETS.find((d) => d.source)!
    const html = renderToString(<DrugPage id={withSource.id} onHistoryUpdated={() => {}} />)
    expect(html).toContain(withSource.source!)
  })

  it('renders the drip-only drugs (dopamin, norepinefrin) with their infusion calculator', () => {
    for (const id of ['dopamine', 'norepinephrine']) {
      const html = renderToString(<DrugPage id={id} onHistoryUpdated={() => {}} />)
      expect(html).toContain('id="infusion-dose"')
      expect(html).toContain('HIGH-ALERT')
    }
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
    expect(html).toContain('/doserx/obat')
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
