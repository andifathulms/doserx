import { describe, it, expect } from 'vitest'
import { PACKS } from '../data/packs'
import { LIVE_CATALOG, REVIEW_CATALOG } from '../data/catalog'
import { packLine } from './packDose'

const allRows = PACKS.flatMap((p) => p.sections.flatMap((s) => s.rows))

describe('Darurat packs', () => {
  it('points every row at a drug and regimen that exist (in the review catalog)', () => {
    for (const row of allRows) {
      if (row.kind !== 'drug') continue
      const drug = REVIEW_CATALOG.find((d) => d.id === row.drug)
      expect(drug, row.drug).toBeDefined()
      if (row.regimen) expect(drug!.regimens.some((r) => r.id === row.regimen), `${row.drug}:${row.regimen}`).toBe(true)
    }
  })

  it('never shows a number for a draft outside review mode', () => {
    for (const w of [4, 20, 70]) {
      for (const row of allRows) {
        const line = packLine(row, LIVE_CATALOG, w, 'anak', false)
        if (line.draft || line.pending) {
          expect(line.primary, `${line.key} @ ${w}`).toBeUndefined()
          expect(line.secondary, `${line.key} @ ${w}`).toBeUndefined()
          expect(line.rule, `${line.key} @ ${w}`).not.toMatch(/\d/)
        }
      }
    }
  })

  it('computes every row in review mode, with no NaN or Infinity', () => {
    for (const w of [4, 20, 70]) {
      for (const pop of ['anak', 'dewasa'] as const) {
        for (const row of allRows) {
          const line = packLine(row, REVIEW_CATALOG, w, pop, true)
          expect(line.pending, `${line.key}`).toBeUndefined()
          expect(line.primary, `${line.key} @ ${w}`).toBeDefined()
          expect(line.primary!.value, `${line.key} @ ${w}`).not.toMatch(/NaN|Infinity/)
          expect(Number(line.primary!.value), `${line.key} @ ${w}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('uses the loading dose, not the maintenance dose, in the seizure ladder', () => {
    const kejang = PACKS.find((p) => p.id === 'kejang')!
    const secondLine = kejang.sections.find((s) => s.title === 'Lini kedua')!
    for (const row of secondLine.rows) {
      expect(row.kind === 'drug' && row.regimen, JSON.stringify(row)).toMatch(/loading|valproate-iv/)
    }
    // Phenytoin at 20 kg: 20 mg/kg → 400 mg → 8 mL of 50 mg/mL.
    const pht = packLine(secondLine.rows[0], REVIEW_CATALOG, 20, 'anak', true)
    expect(pht.primary).toEqual({ value: '8', unit: 'mL' })
    expect(pht.secondary).toEqual({ value: '400', unit: 'mg' })
  })

  it('shows verified emergency doses live — adrenaline IM at 14 kg is 0.14 mL', () => {
    const anaf = PACKS.find((p) => p.id === 'anafilaksis')!
    const line = packLine(anaf.sections[0].rows[0], LIVE_CATALOG, 14, 'anak', false)
    expect(line.pending).toBeUndefined()
    expect(line.primary).toEqual({ value: '0.14', unit: 'mL' })
    expect(line.secondary).toEqual({ value: '0.14', unit: 'mg' })
  })

  it('caps a formula row at its ceiling (defibrillation 2 J/kg, max 200 J)', () => {
    const resus = PACKS.find((p) => p.id === 'resusitasi')!
    const defib = resus.sections[0].rows.find((r) => r.kind === 'formula')!
    expect(packLine(defib, REVIEW_CATALOG, 20, 'anak', true).primary).toEqual({ value: '40', unit: 'J' })
    const big = packLine(defib, REVIEW_CATALOG, 120, 'dewasa', true)
    expect(big.primary).toEqual({ value: '200', unit: 'J' })
    expect(big.capped).toBe(true)
  })
})

describe('pack row details', () => {
  it('states D10 as mL/kg, since its catalog dose is mL of solution', () => {
    const kejang = PACKS.find((p) => p.id === 'kejang')!
    const d10 = packLine(kejang.sections[0].rows[0], LIVE_CATALOG, 20, 'anak', false)
    expect(d10.rule).toContain('mL/kg')
    expect(d10.primary).toEqual({ value: '40', unit: 'mL' })
  })

  it('draws midazolam up from its single listed ampoule strength (5 mg/mL)', () => {
    const kejang = PACKS.find((p) => p.id === 'kejang')!
    const mida = packLine(kejang.sections[1].rows[1], LIVE_CATALOG, 20, 'anak', false)
    expect(mida.primary).toEqual({ value: '0.8', unit: 'mL' })
    expect(mida.secondary).toEqual({ value: '4', unit: 'mg' })
  })
})
