import { RouteCode } from './drugs/types'

/**
 * Structured routes from the catalog's free-text `route` strings
 * ("Oral / PR", "IV / PR (kejang)", "Bukal / IM / IV").
 *
 * The strings stay as they are — they read well in the monograph — and this
 * is the one place that knows how to turn them into route chips. Unknown
 * tokens are dropped rather than guessed; drugRoutes.test.ts fails if any
 * catalog entry parses to no route at all, so a new spelling can't slip
 * through as an empty chip.
 */
const TOKENS: Array<[RegExp, RouteCode]> = [
  [/^oral$/, 'Oral'],
  [/^(iv|intravena)$/, 'IV'],
  [/^(im|intramuskular)$/, 'IM'],
  [/^(sc|subkutan)$/, 'SC'],
  [/^(infus|drip)$/, 'Infus'],
  [/^(pr|rektal|rectal)$/, 'Rektal'],
  [/^(nebul|nebulisasi|nebulizer)$/, 'Nebul'],
  [/^bukal$/, 'Bukal'],
  [/^(intranasal|in)$/, 'Intranasal'],
  [/^topikal$/, 'Topikal'],
]

/** Display order for chips, most common first. */
export const ROUTE_ORDER: RouteCode[] = [
  'IV',
  'IM',
  'Oral',
  'Infus',
  'SC',
  'Rektal',
  'Nebul',
  'Bukal',
  'Intranasal',
  'Topikal',
]

export function parseRoutes(route: string): RouteCode[] {
  // Drop parenthesised qualifiers ("(kejang)") — those are regimen labels,
  // not routes. "(topikal mukosa)" is the one qualifier that names a route.
  const qualifier = /\(([^)]*)\)/.exec(route)?.[1] ?? ''
  const bare = route.replace(/\([^)]*\)/g, ' ')
  const found = new Set<RouteCode>()
  for (const raw of bare.split(/[\/,+]| atau | dan /i)) {
    const t = raw.trim().toLowerCase()
    if (!t) continue
    for (const [re, code] of TOKENS) if (re.test(t)) found.add(code)
  }
  if (/topikal/i.test(qualifier)) found.add('Topikal')
  return ROUTE_ORDER.filter((r) => found.has(r))
}

/** The parenthesised qualifier, if any — "IV / PR (kejang)" → "kejang". */
export function routeQualifier(route: string): string | undefined {
  const q = /\(([^)]*)\)/.exec(route)?.[1]?.trim()
  return q && !/topikal/i.test(q) ? q : undefined
}
