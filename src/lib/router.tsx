import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { stripBase, withBase } from './route-match'

/**
 * A ~90-line router, deliberately not a dependency.
 *
 * The route table is eight patterns with one dynamic segment; react-router
 * would add ~11 kB gzip for loaders and nested layouts we do not use. What we
 * do need is here: base-path handling for GitHub Pages, real <a href> links
 * that middle-click and open-in-new-tab correctly, scroll restoration, and a
 * navigation event other code can react to.
 *
 * Deep links work because the build writes 404.html alongside index.html —
 * GitHub Pages serves it for unknown paths and this router takes over.
 */

const BASE = import.meta.env.BASE_URL

// ── Subscription ─────────────────────────────────────────────────────────────
// One store, so every useLocation() in the tree re-renders from the same event.

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): string {
  return stripBase(window.location.pathname, BASE)
}

/** Server snapshot for the prerender pass; overridden per route at build time. */
let serverPath = '/'
export function setServerPath(path: string) {
  serverPath = path
}
function getServerSnapshot(): string {
  return serverPath
}

/** Current path, base-stripped and normalised (no trailing slash). */
export function useLocation(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// ── Navigation ───────────────────────────────────────────────────────────────

export interface NavigateOptions {
  replace?: boolean
  /** Skip the scroll-to-top, e.g. when only a query param changed. */
  keepScroll?: boolean
}

export function navigate(to: string, opts: NavigateOptions = {}) {
  const url = withBase(to, BASE)
  if (opts.replace) window.history.replaceState(null, '', url)
  else window.history.pushState(null, '', url)
  if (!opts.keepScroll) window.scrollTo(0, 0)
  emit()
}

if (typeof window !== 'undefined') {
  // Back/forward: the browser restores scroll itself, so we only re-render.
  window.addEventListener('popstate', emit)
}

// ── Link ─────────────────────────────────────────────────────────────────────

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  replace?: boolean
}

/**
 * A real anchor. Modified clicks (⌘/ctrl/shift/alt), non-primary buttons and
 * targeted links fall through to the browser untouched — intercepting those is
 * the classic way SPA routers break "open in new tab".
 */
export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (rest.target && rest.target !== '_self') return
      e.preventDefault()
      navigate(to, { replace })
    },
    [to, replace, onClick, rest.target],
  )

  return <a href={withBase(to, BASE)} onClick={handleClick} {...rest} />
}

/** Declarative redirect, applied after paint so it never blocks a render. */
export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    navigate(to, { replace: true })
  }, [to])
  return null
}

/** True when `path` is the current route or an ancestor of it (for nav state). */
export function isActive(current: string, path: string): boolean {
  if (path === '/') return current === '/'
  return current === path || current.startsWith(path + '/')
}
