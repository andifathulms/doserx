import { DrugForm } from '../data/drugs'

export interface FormSuggestion {
  form: string
  strength: number
  count: number       // e.g. 0.5, 1, 1.5
  display: string     // e.g. "½ tab 500mg"
  actualDose: number  // mg actually delivered
  label?: string
}

// Practical fractions used in Indonesian clinical practice
const SOLID_FRACTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4]

const FRACTION_LABEL: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
  1: '1',
  1.5: '1½',
  2: '2',
  2.5: '2½',
  3: '3',
  4: '4',
}

const FORM_LABEL: Record<string, string> = {
  tablet: 'tab',
  capsule: 'kap',
  syrup: 'mL',
  vial: 'vial',
  nebule: 'nebule',
  ampoule: 'amp',
  rectal: 'supp',
  drop: 'tetes',
}

function roundToFraction(exact: number, fractions: number[]): number {
  let best = fractions[0]
  let bestDiff = Math.abs(exact - fractions[0])
  for (const f of fractions) {
    const diff = Math.abs(exact - f)
    if (diff < bestDiff) {
      bestDiff = diff
      best = f
    }
  }
  return best
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

export function suggestForms(perDose: number, forms: DrugForm[]): FormSuggestion[] {
  if (perDose <= 0) return []

  const suggestions: FormSuggestion[] = []

  for (const f of forms) {
    if (f.form === 'tablet' || f.form === 'capsule') {
      const exact = perDose / f.strength
      const count = roundToFraction(exact, SOLID_FRACTIONS)
      const formLabel = FORM_LABEL[f.form]
      const countLabel = FRACTION_LABEL[count] ?? String(count)
      const labelPart = f.label ? ` (${f.label})` : ''
      suggestions.push({
        form: f.form,
        strength: f.strength,
        count,
        display: `${countLabel} ${formLabel} ${f.strength}mg${labelPart}`,
        actualDose: round2(count * f.strength),
        label: f.label,
      })
    } else if (f.form === 'syrup' || f.form === 'drop') {
      // strength is mg/mL for liquids
      const vol = round2(perDose / f.strength)
      const labelPart = f.label ? ` (${f.label})` : ''
      suggestions.push({
        form: f.form,
        strength: f.strength,
        count: vol,
        display: `${vol} mL${labelPart}`,
        actualDose: round2(vol * f.strength),
        label: f.label,
      })
    } else if (f.form === 'rectal') {
      // pick the nearest rectal suppository
      const count = roundToFraction(perDose / f.strength, SOLID_FRACTIONS)
      const countLabel = FRACTION_LABEL[count] ?? String(count)
      const labelPart = f.label ? ` — ${f.label}` : ''
      suggestions.push({
        form: f.form,
        strength: f.strength,
        count,
        display: `${countLabel} supp ${f.strength}mg${labelPart}`,
        actualDose: round2(count * f.strength),
        label: f.label,
      })
    }
    // vials and ampoules: volume is handled by the main concentration calc
  }

  return suggestions
}
