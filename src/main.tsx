import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ROUTE_CHUNKS } from './pages'
import { ROUTES } from './routes'
import { resolveRoute, stripBase } from './lib/route-match'

/**
 * Every route is prerendered to complete HTML, so the browser already has the
 * page. Two consequences:
 *
 * 1. Load this route's chunk BEFORE hydrating. Hydrating into a not-yet-loaded
 *    React.lazy boundary makes React swap the server-rendered content for a
 *    Suspense fallback — the page would blink blank on load, which is exactly
 *    the regression a split like this usually ships with.
 * 2. Hydrate rather than render, so the existing markup is adopted instead of
 *    thrown away. createRoot stays for the 404 shell, which has no content.
 */
const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

function mount() {
  if (container.firstChild) hydrateRoot(container, app)
  else createRoot(container).render(app)
}

/**
 * Reload once when a new service worker takes over.
 *
 * The SW already ships skipWaiting + clientsClaim, so a deploy activates on
 * the next load — but the page that is already open keeps serving the old
 * cached CSS and JS until someone hard-refreshes. That is how a shipped fix
 * can look like it never landed. Guarded on there having been a controller
 * already, so a first visit (where claiming is expected) does not reload.
 */
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })
}

const match = resolveRoute(ROUTES, stripBase(window.location.pathname, import.meta.env.BASE_URL))
const load = match ? ROUTE_CHUNKS[match.route.id] : undefined

if (load && container.firstChild) load().then(mount, mount)
else mount()
