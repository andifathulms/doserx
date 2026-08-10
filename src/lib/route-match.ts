/**
 * Route matching — pure, no DOM, no React.
 *
 * Kept separate from router.tsx for the same reason calculate.ts is kept out of
 * the components: it is the piece that decides what the user sees, so it should
 * be unit-testable in isolation. The app is served from a base path on GitHub
 * Pages ('/doserx/'), so every function here works in base-relative space and
 * the base is stripped exactly once, at the edge.
 */

export type RouteParams = Record<string, string>

/** Strips the deploy base from a browser pathname. Always returns a leading '/'. */
export function stripBase(pathname: string, base: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  let path = pathname
  if (b && (path === b || path.startsWith(b + '/'))) path = path.slice(b.length)
  if (!path.startsWith('/')) path = '/' + path
  // Trailing slash is meaningless here; '/obat/' and '/obat' are the same page.
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path
}

/** Prefixes a base-relative path with the deploy base, for hrefs. */
export function withBase(path: string, base: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  return `${b}${path.startsWith('/') ? path : '/' + path}`
}

/**
 * Matches a pattern against a path. Supports ':param' segments and a trailing
 * '*' wildcard. Returns null when the pattern does not apply, so callers can
 * distinguish "no params" ({}) from "no match" (null).
 */
export function matchRoute(pattern: string, path: string): RouteParams | null {
  const p = pattern.split('/').filter(Boolean)
  const s = path.split('/').filter(Boolean)

  const params: RouteParams = {}
  for (let i = 0; i < p.length; i++) {
    const seg = p[i]
    if (seg === '*') return params
    if (i >= s.length) return null
    if (seg.startsWith(':')) {
      const value = decodeURIComponent(s[i])
      if (!value) return null
      params[seg.slice(1)] = value
      continue
    }
    if (seg !== s[i]) return null
  }
  return p.length === s.length ? params : null
}

/** First matching pattern wins, so order the table most-specific first. */
export function resolveRoute<T extends { path: string }>(
  routes: T[],
  path: string,
): { route: T; params: RouteParams } | null {
  for (const route of routes) {
    const params = matchRoute(route.path, path)
    if (params) return { route, params }
  }
  return null
}
