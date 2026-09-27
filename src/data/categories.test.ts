import { describe, it, expect } from 'vitest'
import { DRUG_PRESETS } from './drugs'
import { GROUP_ORDER, groupOf, isEmergency } from './categories'

describe('clinical groups', () => {
  it('files every emergency drug under an explicit body-system group', () => {
    // 'Gawat Darurat' has no meaningful default group; a drug added to it
    // without `group` would silently land in Lain-lain.
    const missing = DRUG_PRESETS.filter((d) => isEmergency(d) && !d.group).map((d) => d.id)
    expect(missing).toEqual([])
  })

  it('puts every drug in one of the nine groups', () => {
    for (const d of DRUG_PRESETS) expect(GROUP_ORDER).toContain(groupOf(d))
  })

  it('leaves no group empty', () => {
    const used = new Set(DRUG_PRESETS.map(groupOf))
    for (const g of GROUP_ORDER) {
      expect(used.has(g), g).toBe(true)
    }
  })
})
