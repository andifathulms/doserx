import { describe, it, expect } from 'vitest'
import { CATALOG_STATS, DEMO_DRUG } from './landing-facts'
import { DRUG_PRESETS } from './drugs'

/**
 * The guard that makes hand-written landing facts safe. If these fail, the
 * catalog changed and the landing page is about to state something untrue —
 * update landing-facts.ts, do not weaken these assertions.
 */
describe('landing facts match the catalog', () => {
  it('states the real drug count', () => {
    expect(CATALOG_STATS.drugs).toBe(DRUG_PRESETS.length)
  })

  it('states the real category count', () => {
    expect(CATALOG_STATS.categories).toBe(new Set(DRUG_PRESETS.map((d) => d.category)).size)
  })

  it('lists every dosing source actually used', () => {
    const real = [...new Set(DRUG_PRESETS.map((d) => d.source).filter(Boolean))]
    expect([...CATALOG_STATS.sources].sort()).toEqual(real.sort())
  })

  it('mirrors the demo drug field for field', () => {
    const real = DRUG_PRESETS.find((d) => d.id === DEMO_DRUG.id)
    expect(real).toBeDefined()
    for (const [key, value] of Object.entries(DEMO_DRUG)) {
      expect({ [key]: real![key as keyof typeof real] }).toEqual({ [key]: value })
    }
  })
})
