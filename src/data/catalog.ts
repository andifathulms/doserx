import {
  DRUG_PRESETS,
  DrugCategory,
  DrugGroup,
  DrugPreset,
  EntryStatus,
  RegimenPopulation,
  RouteCode,
} from './drugs'
import { DRAFT_PRESETS } from './drugs/drafts'
import { INFUSION_PRESETS, InfusionPreset } from './infusionDrugs'
import { groupOf, isEmergency } from './categories'
import { parseRoutes, routeQualifier, ROUTE_ORDER } from './drugRoutes'

/**
 * The catalog as the doctor sees it: DRUGS, each with one or more REGIMENS.
 *
 * A regimen is one way of giving the drug — a route (or routes), an
 * indication, a population — with its own dosing and its own calculator.
 * Diazepam IV for a seizure and diazepam oral for anxiety are two regimens
 * of one drug, and must never share one mg/kg value.
 *
 * Built as a layer OVER the existing data rather than a rewrite of it:
 * - every DrugPreset is a 'dose' regimen (calculate() / calculateFixed());
 *   a preset with `parent` joins that drug instead of becoming its own;
 * - every InfusionPreset is an 'infusion' regimen (calculateInfusion()),
 *   attached to its `parent` drug or standing alone (dopamine has no bolus).
 * A regimen holds the ORIGINAL preset object, so every number the app
 * computed before this layer existed is computed from the same object now —
 * catalog.test.ts asserts that identity.
 */

interface RegimenBase {
  /** Stable, namespaced: the preset id, or `infus:<id>` for a drip. */
  id: string
  routes: RouteCode[]
  /** Qualifier for the chip — "kejang", "anafilaksis", "drip". */
  label?: string
  population: RegimenPopulation
  highAlert: boolean
  status: EntryStatus
}

export interface DoseRegimen extends RegimenBase {
  kind: 'dose'
  preset: DrugPreset
}

export interface InfusionRegimen extends RegimenBase {
  kind: 'infusion'
  infusion: InfusionPreset
}

export type Regimen = DoseRegimen | InfusionRegimen

export interface CatalogDrug {
  id: string
  name: string
  group: DrugGroup
  category: DrugCategory
  aliases: string[]
  indications: string[]
  emergency: boolean
  /** Any regimen is high-alert. */
  highAlert: boolean
  /** 'draft' when every regimen is a draft — a whole new drug under review. */
  status: EntryStatus
  /** Some (not all) regimens are drafts — an existing drug gaining a route. */
  hasDraft: boolean
  /** The preset carrying drug-level monograph fields (side effects,
   *  contraindication, source…), when the drug has a dose regimen. */
  primary?: DrugPreset
  regimens: Regimen[]
}

function doseRegimen(p: DrugPreset): DoseRegimen {
  return {
    kind: 'dose',
    id: p.id,
    routes: p.routes ?? parseRoutes(p.route),
    label: p.regimenLabel ?? routeQualifier(p.route),
    population: p.population ?? 'anak',
    highAlert: !!p.highAlert,
    status: p.status ?? 'verified',
    preset: p,
  }
}

function infusionRegimen(i: InfusionPreset): InfusionRegimen {
  return {
    kind: 'infusion',
    id: `infus:${i.id}`,
    routes: ['Infus'],
    label: i.doseUnit,
    population: i.population ?? 'anak',
    highAlert: !!i.highAlert,
    status: i.status ?? 'verified',
    infusion: i,
  }
}

export function buildCatalog(presets: DrugPreset[], infusions: InfusionPreset[]): CatalogDrug[] {
  const drugs = new Map<string, CatalogDrug>()

  for (const p of presets) {
    if (p.parent) continue
    drugs.set(p.id, {
      id: p.id,
      name: p.name,
      group: groupOf(p),
      category: p.category,
      aliases: [...(p.aliases ?? [])],
      indications: [...(p.indications ?? [])],
      emergency: isEmergency(p),
      highAlert: false,
      status: 'verified',
      hasDraft: false,
      primary: p,
      regimens: [doseRegimen(p)],
    })
  }

  // Drip-only drugs (dopamin, …) exist before any regimen tries to join
  // them, so a bolus route can attach to a drug that started as a drip.
  for (const inf of infusions) {
    if (inf.parent || !inf.standalone) continue
    const s = inf.standalone
    const existing = drugs.get(inf.id)
    if (existing) {
      existing.regimens.push(infusionRegimen(inf))
      continue
    }
    drugs.set(inf.id, {
      id: inf.id,
      name: s.name,
      group: s.group,
      category: s.category,
      aliases: [...(s.aliases ?? [])],
      indications: [...(s.indications ?? [])],
      emergency: false,
      highAlert: false,
      status: 'verified',
      hasDraft: false,
      regimens: [infusionRegimen(inf)],
    })
  }

  for (const p of presets) {
    if (!p.parent) continue
    const drug = drugs.get(p.parent)
    if (!drug) continue // catalog.test.ts fails on a dangling parent
    drug.regimens.push(doseRegimen(p))
    if (!drug.primary) drug.primary = p
    for (const a of p.aliases ?? []) if (!drug.aliases.includes(a)) drug.aliases.push(a)
    for (const i of p.indications ?? []) if (!drug.indications.includes(i)) drug.indications.push(i)
  }

  for (const inf of infusions) {
    if (inf.parent) drugs.get(inf.parent)?.regimens.push(infusionRegimen(inf))
  }

  for (const d of drugs.values()) {
    // Doses before drips: the bolus or oral route is the common first choice,
    // and a drug's first regimen is what opens by default. Stable otherwise,
    // so data order decides among doses.
    d.regimens.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'dose' ? -1 : 1))
  }

  for (const d of drugs.values()) {
    d.highAlert = d.regimens.some((r) => r.highAlert)
    const drafts = d.regimens.filter((r) => r.status === 'draft').length
    d.status = drafts === d.regimens.length ? 'draft' : 'verified'
    d.hasDraft = drafts > 0 && drafts < d.regimens.length
  }

  return [...drugs.values()]
}

/** What everyone sees: verified entries only. */
export const LIVE_CATALOG: CatalogDrug[] = buildCatalog(
  DRUG_PRESETS.filter((p) => p.status !== 'draft'),
  INFUSION_PRESETS.filter((i) => i.status !== 'draft'),
)

/** Review mode: verified entries plus every draft awaiting sign-off. */
export const REVIEW_CATALOG: CatalogDrug[] = buildCatalog(
  [...DRUG_PRESETS, ...DRAFT_PRESETS],
  INFUSION_PRESETS,
)

export function catalogFor(review: boolean): CatalogDrug[] {
  return review ? REVIEW_CATALOG : LIVE_CATALOG
}

export function findDrug(id: string, review = false): CatalogDrug | undefined {
  return catalogFor(review).find((d) => d.id === id)
}

/** Live infusion presets — the Infus tab and the Darurat packs use these. */
export const LIVE_INFUSIONS: InfusionPreset[] = INFUSION_PRESETS.filter((i) => i.status !== 'draft')

/**
 * The regimen to open first for this patient: the first whose population
 * matches (or is 'semua'), else the first regimen. Order within a drug is
 * data order, so the catalog author decides what "first" means.
 */
export function pickRegimen(drug: CatalogDrug, population: 'anak' | 'dewasa'): Regimen {
  return (
    drug.regimens.find((r) => r.population === population || r.population === 'semua') ??
    drug.regimens[0]
  )
}

/** Chip text for a regimen: its routes, plus its qualifier when two
 *  regimens of the same drug share a route. */
export function regimenTitle(r: Regimen): string {
  const routes = [...r.routes].sort((a, b) => ROUTE_ORDER.indexOf(a) - ROUTE_ORDER.indexOf(b))
  return routes.join(' / ')
}

/** The union of every regimen's routes, in chip order — for list rows. */
export function drugRoutes(d: CatalogDrug): RouteCode[] {
  const set = new Set(d.regimens.flatMap((r) => r.routes))
  return ROUTE_ORDER.filter((r) => set.has(r))
}
