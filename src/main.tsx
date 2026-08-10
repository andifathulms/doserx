import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App'

/**
 * Every route is prerendered to real HTML, so the normal path is hydration —
 * attach to the markup that already arrived rather than throwing it away and
 * rendering again. createRoot stays as the fallback for the 404.html shell,
 * which is served for paths that have no prerendered file.
 */
const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (container.firstChild) hydrateRoot(container, app)
else createRoot(container).render(app)
