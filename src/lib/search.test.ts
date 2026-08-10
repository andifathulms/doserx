import { describe, it, expect } from 'vitest'
import { scoreDrug, searchDrugs } from './search'
import { DRUG_PRESETS } from '../data/drugs'
import { DrugPreset } from '../data/drugs'

const drug = (over: Partial<DrugPreset>): DrugPreset => ({
  id: 'x', name: 'Xanadu', route: 'Oral', category: 'Lain-lain',
  dosePerKg: 1, freq: 1, note: '', ...over,
})

describe('scoreDrug', () => {
  it('ranks a name prefix above a name substring', () => {
    expect(scoreDrug(drug({ name: 'Paracetamol' }), 'para')).toBe(5)
    expect(scoreDrug(drug({ name: 'Isoparacetamol' }), 'para')).toBe(4)
  })

  it('ranks alias above indication above category', () => {
    expect(scoreDrug(drug({ aliases: ['Sanmol'] }), 'sanmol')).toBe(3)
    expect(scoreDrug(drug({ indications: ['demam'] }), 'demam')).toBe(2)
    expect(scoreDrug(drug({ category: 'Antibiotik' }), 'antibiotik')).toBe(1)
  })

  it('returns 0 when nothing matches', () => {
    expect(scoreDrug(drug({}), 'zzz')).toBe(0)
  })
})

describe('searchDrugs against the real catalog', () => {
  it('puts the exact drug first for a name query', () => {
    expect(searchDrugs(DRUG_PRESETS, 'paracetamol')[0].name).toBe('Paracetamol')
  })

  it('finds by brand alias', () => {
    const names = searchDrugs(DRUG_PRESETS, 'sanmol').map((d) => d.name)
    expect(names).toContain('Paracetamol')
  })

  it('finds by indication', () => {
    expect(searchDrugs(DRUG_PRESETS, 'demam').length).toBeGreaterThan(0)
  })

  it('returns the whole catalog for an empty query', () => {
    expect(searchDrugs(DRUG_PRESETS, '  ')).toHaveLength(DRUG_PRESETS.length)
  })

  it('returns nothing for a nonsense query', () => {
    expect(searchDrugs(DRUG_PRESETS, 'qwertyuiop')).toHaveLength(0)
  })
})
