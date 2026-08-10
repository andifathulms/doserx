/**
 * Pediatric weight estimation from age.
 *
 * Three different formulas apply across three age bands, and which one fired
 * changes the answer materially — so the result carries its formula name and
 * its arithmetic rather than just a number. The estimate feeds every figure
 * downstream, which makes it the one place in the app where hiding the working
 * hides the most.
 *
 *  - Infants 0–12 months: (age_months / 2) + 4  [APLS]
 *  - Children 1–10 years: 2 × (age_years + 4)   [APLS]
 *  - Children >10 years : (3 × age_years) + 7   [Luscombe & Owens]
 *
 * These are population averages. They take no account of nutritional status,
 * so they run high for a wasted child and low for an obese one — see the
 * caveat shown next to the result.
 */
export interface WeightEstimate {
  kg: number
  /** Attribution for THIS band — not all three bands are APLS. */
  formula: string
  /** The arithmetic, display-ready: "2 × (5 th + 4)". */
  expression: string
}

export function estimateWeight(ageYears: number, ageMonths: number): WeightEstimate | null {
  const totalMonths = ageYears * 12 + ageMonths
  if (totalMonths <= 0) return null

  if (totalMonths <= 12) {
    return {
      kg: round1(totalMonths / 2 + 4),
      formula: 'APLS (0–12 bln)',
      expression: `(${totalMonths} bln ÷ 2) + 4`,
    }
  }

  const years = totalMonths / 12
  if (years <= 10) {
    return {
      kg: round1(2 * (years + 4)),
      formula: 'APLS (1–10 th)',
      expression: `2 × (${round1(years)} th + 4)`,
    }
  }
  if (years < 18) {
    return {
      kg: round1(3 * years + 7),
      formula: 'Luscombe & Owens (>10 th)',
      expression: `(3 × ${round1(years)} th) + 7`,
    }
  }

  return null
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
