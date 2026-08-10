import { describe, it, expect } from 'vitest'
import { describeForms } from './suggest'
import { DrugForm } from '../data/drugs'

const TAB_500: DrugForm = { strength: 500, form: 'tablet' }
const SYRUP_24: DrugForm = { strength: 24, form: 'syrup', label: '120mg/5mL' }

describe('describeForms — delivered dose and rounding gap', () => {
  it('reports the shortfall when a solid rounds down', () => {
    // 290mg from a 500mg tablet: 0.58 -> ½ tab = 250mg, 40mg short.
    const [line] = describeForms([TAB_500], 290)
    expect(line.value).toBe('½')
    expect(line.deliveredMg).toBe(250)
    expect(line.deltaMg).toBe(-40)
  })

  it('reports the excess when a solid rounds up', () => {
    // 320mg from a 500mg tablet: 0.64 -> ¾ tab = 375mg, 55mg OVER the
    // calculated dose. Rounding is not conservative in either direction,
    // which is exactly why the delta has to be visible.
    const [line] = describeForms([TAB_500], 320)
    expect(line.value).toBe('¾')
    expect(line.deliveredMg).toBe(375)
    expect(line.deltaMg).toBe(55)
  })

  it('reports no gap when the dose lands exactly on a fraction', () => {
    const [line] = describeForms([TAB_500], 250)
    expect(line.deliveredMg).toBe(250)
    expect(line.deltaMg).toBe(0)
  })

  it('leaves liquids without a delta — they are measured continuously', () => {
    const [line] = describeForms([SYRUP_24], 320)
    expect(line.kind).toBe('liquid')
    expect(line.deliveredMg).toBeUndefined()
    expect(line.deltaMg).toBeUndefined()
  })

  it('keeps delivered dose consistent with the displayed fraction', () => {
    for (const dose of [60, 125, 375, 620, 1100]) {
      const [line] = describeForms([TAB_500], dose)
      // Whatever fraction is shown, delivered must equal fraction x strength.
      expect(line.deliveredMg).toBeCloseTo(line.deltaMg! + dose, 5)
    }
  })
})
