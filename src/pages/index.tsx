import { lazy } from 'react'
import { LandingPage as LandingEager } from './LandingPage'
import { CatalogPage as CatalogEager } from './CatalogPage'
import { AboutPage as AboutEager } from './AboutPage'
import { DrugPage as DrugEager } from './DrugPage'
import { CalculatorPage as CalculatorEager } from './CalculatorPage'
import { HistoryPage as HistoryEager } from './HistoryPage'

/**
 * Route components, eager on the server and lazy in the browser.
 *
 * renderToString cannot resolve a React.lazy boundary — it renders the
 * fallback — so the prerender needs the real component. The browser wants the
 * opposite: someone calculating a dose should not download the landing copy,
 * the methodology page and the catalog index they are not looking at.
 *
 * import.meta.env.SSR is replaced with a literal at build time, so the client
 * build dead-code-eliminates the eager branch and drops the static import with
 * it. One route table, two outputs.
 *
 * Every prerendered page arrives as complete HTML, so main.tsx loads the
 * current route's chunk BEFORE hydrating — otherwise React would swap the
 * server-rendered content for a Suspense fallback and the page would blink
 * blank on load.
 */
// NOTE: import.meta.env.SSR is inlined at each use on purpose. Assigning it to
// a const first defeats Rollup's constant folding, and the eager imports then
// survive into the client bundle — which silently undoes the whole split.
export const LandingPage = import.meta.env.SSR
  ? LandingEager
  : lazy(() => import('./LandingPage').then((m) => ({ default: m.LandingPage })))

export const CatalogPage = import.meta.env.SSR
  ? CatalogEager
  : lazy(() => import('./CatalogPage').then((m) => ({ default: m.CatalogPage })))

export const AboutPage = import.meta.env.SSR
  ? AboutEager
  : lazy(() => import('./AboutPage').then((m) => ({ default: m.AboutPage })))

export const DrugPage = import.meta.env.SSR
  ? DrugEager
  : lazy(() => import('./DrugPage').then((m) => ({ default: m.DrugPage })))

export const CalculatorPage = import.meta.env.SSR
  ? CalculatorEager
  : lazy(() => import('./CalculatorPage').then((m) => ({ default: m.CalculatorPage })))

export const HistoryPage = import.meta.env.SSR
  ? HistoryEager
  : lazy(() => import('./HistoryPage').then((m) => ({ default: m.HistoryPage })))

/** Chunk loader per route id, for preloading before hydration and on idle. */
export const ROUTE_CHUNKS: Record<string, () => Promise<unknown>> = {
  home: () => import('./LandingPage'),
  'home-en': () => import('./LandingPage'),
  catalog: () => import('./CatalogPage'),
  drug: () => import('./DrugPage'),
  about: () => import('./AboutPage'),
  'about-en': () => import('./AboutPage'),
  calculator: () => import('./CalculatorPage'),
  history: () => import('./HistoryPage'),
}
