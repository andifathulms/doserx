/**
 * Pediatric weight estimation from age.
 *
 * Sources:
 *  - Infants 0–12 months: (age_months / 2) + 4  [APLS formula]
 *  - Children 1–10 years: 2 × (age_years + 4)   [APLS formula]
 *  - Children >10 years : (3 × age_years) + 7    [Luscombe-Owens]
 *
 * These are population averages; the result is labelled as an estimate.
 * Adult weights (≥18 yr) are not estimated — the field should be left blank.
 */
export function estimateWeight(ageYears: number, ageMonths: number): number | null {
  const totalMonths = ageYears * 12 + ageMonths
  if (totalMonths <= 0) return null

  if (totalMonths <= 12) {
    return Math.round((totalMonths / 2 + 4) * 10) / 10
  }

  const years = totalMonths / 12
  if (years <= 10) {
    return Math.round(2 * (years + 4) * 10) / 10
  }
  if (years < 18) {
    return Math.round((3 * years + 7) * 10) / 10
  }

  return null
}
