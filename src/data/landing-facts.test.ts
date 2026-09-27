import { describe, it, expect } from 'vitest'
import { CATALOG_STATS, DEMO_DRUG, OTHER_REFERENCES } from './landing-facts'
import { LIVE_CATALOG, LIVE_INFUSIONS } from './catalog'
import { DRUG_PRESETS } from './drugs'
import { groupOf } from './categories'

/**
 * The guard that makes hand-written landing facts safe. If these fail, the
 * catalog changed and the landing page is about to state something untrue —
 * update landing-facts.ts, do not weaken these assertions.
 */
describe('landing facts match the catalog', () => {
  it('states the real drug count', () => {
    expect(CATALOG_STATS.drugs).toBe(LIVE_CATALOG.length)
  })

  it('states the real clinical-group count', () => {
    expect(CATALOG_STATS.groups).toBe(new Set(LIVE_CATALOG.map((d) => d.group)).size)
    expect(new Set(DRUG_PRESETS.map(groupOf)).size).toBeLessThanOrEqual(CATALOG_STATS.groups)
  })

  it('lists principal references that are actually cited', () => {
    const cited = [...DRUG_PRESETS.map((d) => d.source ?? ''), ...LIVE_INFUSIONS.map((i) => i.source ?? '')]
      .join(' | ')
      .toLowerCase()
    for (const ref of CATALOG_STATS.sources) {
      const token = ref.split('/')[0].trim().toLowerCase()
      expect(cited.includes(token), ref).toBe(true)
    }
  })

  it('cites a known reference on every sourced regimen', () => {
    const known = [...CATALOG_STATS.sources.flatMap((s) => s.split('/')), ...OTHER_REFERENCES].map((s) =>
      s.trim().toLowerCase(),
    )
    for (const d of DRUG_PRESETS) {
      if (!d.source) continue
      const src = d.source.toLowerCase()
      expect(known.some((k) => src.includes(k)), `${d.id}: ${d.source}`).toBe(true)
    }
  })

  it('mirrors the demo drug field for field', () => {
    const real = DRUG_PRESETS.find((d) => d.id === DEMO_DRUG.id)
    expect(real).toBeDefined()
    for (const [key, value] of Object.entries(DEMO_DRUG)) {
      expect({ [key]: real![key as keyof typeof real] }).toEqual({ [key]: value })
    }
  })
})
