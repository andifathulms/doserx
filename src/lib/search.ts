import { DrugPreset } from '../data/drugs'
import type { CatalogDrug } from '../data/catalog'

/**
 * Relevance scoring for the drug catalog. Higher is better; 0 means no match.
 *
 * Pulled out of DrugGrid so the catalog page ranks identically — a drug that
 * comes first when picking for a calculation should come first when browsing,
 * or the two surfaces teach different mental models of the same library.
 *
 * The order encodes what a searcher most likely meant: an exact name prefix
 * beats a substring, a brand/alias beats an indication, and category or route
 * is the weakest signal.
 */
export function scoreDrug(d: DrugPreset, q: string): number {
  const name = d.name.toLowerCase()
  if (name.startsWith(q)) return 5
  if (name.includes(q)) return 4
  if (d.aliases?.some((a) => a.toLowerCase().includes(q))) return 3
  if (d.indications?.some((i) => i.toLowerCase().includes(q))) return 2
  if (d.category.toLowerCase().includes(q) || d.route.toLowerCase().includes(q)) return 1
  return 0
}

/** Drugs matching `query`, most relevant first. Empty query returns the input. */
export function searchDrugs(drugs: DrugPreset[], query: string): DrugPreset[] {
  const q = query.trim().toLowerCase()
  if (!q) return drugs
  return drugs
    .map((d) => ({ d, s: scoreDrug(d, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.d)
}

/**
 * The same ranking for catalog drugs (a drug with several regimens). Aliases
 * and indications are the union across regimens, and a route or group name is
 * the weakest signal — "infus" finds every drug with a drip regimen.
 */
export function scoreCatalogDrug(d: CatalogDrug, q: string): number {
  const name = d.name.toLowerCase()
  if (name.startsWith(q)) return 5
  if (name.includes(q)) return 4
  if (d.aliases.some((a) => a.toLowerCase().includes(q))) return 3
  if (d.indications.some((i) => i.toLowerCase().includes(q))) return 2
  if (
    d.category.toLowerCase().includes(q) ||
    d.group.toLowerCase().includes(q) ||
    d.regimens.some((r) => r.routes.some((rt) => rt.toLowerCase() === q))
  ) {
    return 1
  }
  return 0
}

export function searchCatalog(drugs: CatalogDrug[], query: string): CatalogDrug[] {
  const q = query.trim().toLowerCase()
  if (!q) return drugs
  return drugs
    .map((d) => ({ d, s: scoreCatalogDrug(d, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.d)
}
