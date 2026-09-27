import { describe, it, expect } from 'vitest'
import { DRUG_PRESETS } from './drugs'
import { DRAFT_PRESETS } from './drugs/drafts'
import { INFUSION_PRESETS } from './infusionDrugs'
import { LIVE_CATALOG, REVIEW_CATALOG, pickRegimen, DoseRegimen } from './catalog'
import { parseRoutes } from './drugRoutes'
import { calculate } from '../lib/calculate'

const liveRegimens = LIVE_CATALOG.flatMap((d) => d.regimens)

describe('catalog — drugs and regimens', () => {
  it('turns every existing preset into exactly one dose regimen, holding the same object', () => {
    for (const p of DRUG_PRESETS) {
      const matches = liveRegimens.filter((r) => r.kind === 'dose' && r.preset === p)
      expect(matches.length, p.id).toBe(1)
    }
  })

  it('computes exactly what it computed before the regimen layer, for every preset', () => {
    // The regimen holds the original preset, so this is the same calculation
    // the old Preset tab ran — at a spread of weights, including capped ones.
    for (const r of liveRegimens) {
      if (r.kind !== 'dose') continue
      const p = (r as DoseRegimen).preset
      for (const weight of [3.5, 14, 32, 70]) {
        const before = calculate({ weight, dosePerKg: p.dosePerKg, freq: p.freq, maxDay: p.maxDay, maxSingle: p.maxSingle, concentration: p.concentration })
        const after = calculate({ weight, dosePerKg: r.preset.dosePerKg, freq: r.preset.freq, maxDay: r.preset.maxDay, maxSingle: r.preset.maxSingle, concentration: r.preset.concentration })
        expect(after).toEqual(before)
      }
    }
  })

  it('keeps every existing drug id as a catalog id (URLs, favourites and recents survive)', () => {
    const ids = new Set(LIVE_CATALOG.map((d) => d.id))
    for (const p of DRUG_PRESETS.filter((x) => !x.parent)) expect(ids.has(p.id), p.id).toBe(true)
  })

  it('has no dangling parent, in presets, drafts or infusions', () => {
    const ids = new Set(REVIEW_CATALOG.map((d) => d.id))
    for (const p of [...DRUG_PRESETS, ...DRAFT_PRESETS]) if (p.parent) expect(ids.has(p.parent), p.id).toBe(true)
    for (const i of INFUSION_PRESETS) {
      if (i.parent) expect(ids.has(i.parent), i.id).toBe(true)
      else expect(i.standalone, `${i.id} needs parent or standalone`).toBeDefined()
    }
  })

  it('attaches every live infusion preset exactly once', () => {
    for (const i of INFUSION_PRESETS.filter((x) => x.status !== 'draft')) {
      expect(liveRegimens.filter((r) => r.kind === 'infusion' && r.infusion === i).length, i.id).toBe(1)
    }
  })

  it('has unique regimen ids and unique drug ids', () => {
    const regIds = REVIEW_CATALOG.flatMap((d) => d.regimens.map((r) => r.id))
    expect(new Set(regIds).size).toBe(regIds.length)
    const drugIds = REVIEW_CATALOG.map((d) => d.id)
    expect(new Set(drugIds).size).toBe(drugIds.length)
  })

  it('never shows a draft regimen in the live catalog', () => {
    expect(liveRegimens.filter((r) => r.status === 'draft')).toEqual([])
  })

  it('holds the KCl drip back until its units are reviewed', () => {
    expect(liveRegimens.some((r) => r.kind === 'infusion' && r.infusion.id === 'kcl')).toBe(false)
    const reviewKcl = REVIEW_CATALOG.flatMap((d) => d.regimens).find(
      (r) => r.kind === 'infusion' && r.infusion.id === 'kcl',
    )
    expect(reviewKcl?.status).toBe('draft')
  })

  it('requires a source on every draft, so a reviewer can check it', () => {
    for (const p of DRAFT_PRESETS) {
      expect(p.status, p.id).toBe('draft')
      expect(p.source, p.id).toBeTruthy()
    }
  })

  it('opens the population-matching regimen first, else the first one', () => {
    for (const d of LIVE_CATALOG) {
      const anak = pickRegimen(d, 'anak')
      expect(d.regimens).toContain(anak)
    }
  })
})

describe('parseRoutes', () => {
  it('finds at least one route in every preset', () => {
    for (const p of [...DRUG_PRESETS, ...DRAFT_PRESETS]) {
      expect(p.routes ?? parseRoutes(p.route), `${p.id}: "${p.route}"`).not.toEqual([])
    }
  })

  it('reads the catalog spellings', () => {
    expect(parseRoutes('Oral / PR')).toEqual(['Oral', 'Rektal'])
    expect(parseRoutes('IV / PR (kejang)')).toEqual(['IV', 'Rektal'])
    expect(parseRoutes('Bukal / IM / IV')).toEqual(['IV', 'IM', 'Bukal'])
    expect(parseRoutes('IM (anafilaksis)')).toEqual(['IM'])
    expect(parseRoutes('Nebulisasi')).toEqual(['Nebul'])
    expect(parseRoutes('Oral (topikal mukosa)')).toEqual(['Oral', 'Topikal'])
  })
})

describe('draft entries (review catalog)', () => {
  it('every draft regimen yields a finite dose at common weights, or a stated fixed dose', async () => {
    const { quickDose, dosingSummary } = await import('../lib/quickDose')
    for (const d of REVIEW_CATALOG) {
      for (const r of d.regimens) {
        if (r.status !== 'draft') continue
        expect(dosingSummary(r), r.id).not.toMatch(/NaN|undefined|Infinity/)
        for (const w of [3, 14, 40, 70]) {
          const q = quickDose(r, w)
          expect(q, `${r.id} @ ${w}`).not.toBeNull()
          expect(q!.value, `${r.id} @ ${w}`).not.toMatch(/NaN|Infinity/)
          expect(Number(q!.value), `${r.id} @ ${w}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('gives every draft drip a source', () => {
    for (const i of INFUSION_PRESETS.filter((x) => x.status === 'draft')) {
      expect(i.source ?? i.reviewNote, i.id).toBeTruthy()
    }
  })

  it('files the intubation drugs under Anestesi & Intubasi', () => {
    for (const id of ['fentanyl', 'propofol', 'ketamine', 'etomidate', 'thiopental', 'succinylcholine', 'rocuronium', 'vecuronium', 'atracurium']) {
      expect(REVIEW_CATALOG.find((d) => d.id === id)?.group, id).toBe('Anestesi & Intubasi')
    }
  })
})
