import { CatalogDrug, REVIEW_CATALOG, Regimen, pickRegimen, regimenTitle } from '../data/catalog'
import { PackRow } from '../data/packs'
import { calculate, calculateFixed, roundMg } from './calculate'
import { calculateInfusion } from './calculateInfusion'
import { dosingSummary } from './quickDose'

/**
 * One row of a Darurat pack, computed for a weight. Pure: the page only
 * renders what this returns.
 *
 * The volume is the big number for a bolus — it is what gets drawn into the
 * syringe at 2am — with the mg beside it. Every figure comes from the same
 * engine and catalog defaults as the drug page.
 *
 * A draft regimen (or a draft formula row) outside review mode returns
 * `pending`: the row keeps its place and its name, the number does not show.
 */
export interface PackLine {
  key: string
  name: string
  route: string
  /** The rule the number came from: "0.02 mg/kg", "20 mg/kg (maks 1500)". */
  rule: string
  primary?: { value: string; unit: string }
  secondary?: { value: string; unit: string }
  capped?: boolean
  highAlert: boolean
  draft: boolean
  /** Hidden number: draft outside review mode, or drug missing. */
  pending?: 'draft' | 'missing'
  note?: string
  href?: string
}

export function packLine(
  row: PackRow,
  catalog: CatalogDrug[],
  weightKg: number | null,
  population: 'anak' | 'dewasa',
  review: boolean,
): PackLine {
  if (row.kind === 'formula') {
    const draft = row.status === 'draft'
    const base: PackLine = {
      key: row.id,
      name: row.name,
      route: '',
      rule: `${row.perKg} ${row.unit}/kg${row.max != null ? ` (maks ${row.max} ${row.unit})` : ''}`,
      highAlert: false,
      draft,
      note: `${row.note} Acuan: ${row.source}.`,
    }
    // A draft shows no figure at all — not the result, and not the rule.
    if (draft && !review) return { ...base, rule: '', note: undefined, pending: 'draft' }
    if (weightKg == null) return base
    const raw = row.perKg * weightKg
    const value = row.max != null ? Math.min(raw, row.max) : raw
    return {
      ...base,
      primary: { value: String(roundMg(value)), unit: row.unit },
      capped: row.max != null && raw > row.max,
    }
  }

  const drug = catalog.find((d) => d.id === row.drug)
  const regimen: Regimen | undefined = drug
    ? row.regimen
      ? drug.regimens.find((r) => r.id === row.regimen)
      : pickRegimen(drug, population)
    : undefined

  if (!drug || !regimen) {
    // The regimen exists only in the review catalog: a draft, shown as such.
    return {
      key: `${row.drug}:${row.regimen ?? ''}`,
      // The name only — never a number — from the review catalog, so a
      // draft row still reads "Fentanil", not an id.
      name: drug?.name ?? REVIEW_CATALOG.find((d) => d.id === row.drug)?.name ?? row.drug,
      route: '',
      rule: '',
      highAlert: false,
      draft: true,
      pending: review ? 'missing' : 'draft',
      note: row.note,
    }
  }

  const draft = regimen.status === 'draft'
  const base: PackLine = {
    key: regimen.id,
    name: drug.name,
    route: regimenTitle(regimen),
    rule: ruleText(regimen),
    highAlert: regimen.highAlert,
    draft,
    note: row.note,
    href: `/obat/${drug.id}`,
  }
  if (draft && !review) return { ...base, rule: '', note: undefined, pending: 'draft' }
  if (weightKg == null && !(regimen.kind === 'dose' && regimen.preset.fixedDoseMg != null)) return base

  if (regimen.kind === 'infusion') {
    const i = regimen.infusion
    const out = calculateInfusion({
      weight: weightKg ?? NaN,
      dose: i.doseDefault,
      doseUnit: i.doseUnit,
      stockConcentration: i.stockConcentration,
      stockUnit: i.stockUnit,
      diluentVolume: i.diluentVolumeDefault,
    })
    if (!out.valid) return base
    return {
      ...base,
      primary: { value: String(out.ratePerHr), unit: 'mL/jam' },
      secondary: { value: `${i.doseDefault}`, unit: i.doseUnit },
    }
  }

  const p = regimen.preset
  // A pack's big number is the volume to draw up. When the preset has no
  // stock concentration but the catalog lists exactly one injectable
  // strength (midazolam 5 mg/mL), that strength is the one in the crash
  // cart — use it. Two or more strengths: don't guess.
  const injectables = (p.availableForms ?? []).filter((f) => f.form === 'ampoule' || f.form === 'vial')
  const concentration =
    p.concentration ?? p.prep?.concentration ?? (injectables.length === 1 ? injectables[0].strength : undefined)
  const out =
    p.fixedDoseMg != null
      ? calculateFixed({ doseMg: p.fixedDoseMg, freq: p.freq, maxDay: p.maxDay, concentration })
      : calculate({
          weight: weightKg!,
          dosePerKg: p.dosePerKg,
          freq: p.freq,
          maxDay: p.maxDay,
          maxSingle: p.maxSingle,
          concentration,
        })
  if (!out.valid) return base
  const capped = out.cappedByMaxDay || out.cappedByMaxSingle

  if (row.doseIsVolume) {
    // D10's catalog dose is already mL of solution (see its note).
    return {
      ...base,
      rule: base.rule.replace('mg/kg', 'mL/kg').replace(/ mg\)/, ' mL)'),
      primary: { value: String(out.perDose), unit: 'mL' },
      capped,
    }
  }
  const mass = p.showMcg
    ? { value: String(roundMg(out.perDose * 1000)), unit: 'mcg' }
    : { value: String(out.perDose), unit: 'mg' }
  return out.volume != null
    ? { ...base, primary: { value: String(out.volume), unit: 'mL' }, secondary: mass, capped }
    : { ...base, primary: mass, capped }
}

/** Per-dose rule, e.g. "0.02 mg/kg (maks 0.5 mg)". */
function ruleText(r: Regimen): string {
  if (r.kind === 'infusion') return dosingSummary(r)
  const p = r.preset
  if (p.fixedDoseMg != null) return `${p.fixedDoseMg} mg (dosis tetap)`
  const perDose = roundMg(p.dosePerKg / p.freq)
  const unit = p.showMcg ? `${roundMg(perDose * 1000)} mcg/kg` : `${perDose} mg/kg`
  return `${unit}${p.maxSingle != null ? ` (maks ${p.maxSingle} mg)` : ''}`
}
