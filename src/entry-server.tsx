import { renderToString } from 'react-dom/server'
import App from './App'
import { setServerPath } from './lib/router'

/**
 * Server entry for the prerender step.
 *
 * Renders the same App the browser runs, at a given base-relative path. The
 * router reads that path through useSyncExternalStore's server snapshot, so
 * there is no second implementation of routing for the build — the prerendered
 * page is the app, not a static copy of it.
 */
export function render(path: string): string {
  setServerPath(path)
  return renderToString(<App />)
}

// Re-exported so the prerender script has a single module to import: the SSR
// build is one bundle, and reaching into its internals would be guesswork.
export { ROUTES, CALCULATOR_MODES } from './routes'
export { SITE } from './site'
export { DRUG_PRESETS } from './data/drugs'
