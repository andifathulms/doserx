import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { CatalogPage } from './CatalogPage'
import { DrugPage } from './DrugPage'
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
