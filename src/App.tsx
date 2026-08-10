import { useState, useCallback, useEffect, Suspense } from 'react'
import { MakerSignature } from './components/MakerSignature'
import {
  loadHistory,
  loadCustomDrugs,
  loadLastMode,
  saveLastMode,
  HistoryEntry,
  CustomDrugPreset,
} from './lib/storage'
import { Link, Redirect, useLocation } from './lib/router'
import { resolveRoute } from './lib/route-match'
import { SkipLink, SiteHeader, BottomNav, RouteAnnouncer } from './components/SiteNav'
// Eager on the server so they prerender, lazy in the browser so a route only
// pays for itself. See pages/index.tsx.
import {
  LandingPage,
  CatalogPage,
  AboutPage,
  DrugPage,
  CalculatorPage,
  HistoryPage,
  ROUTE_CHUNKS,
} from './pages'
import { ROUTES, MODE_IDS } from './routes'

function App() {
  const path = useLocation()
  const match = resolveRoute(ROUTES, path)
  const routeId = match?.route.id ?? 'notfound'
  const mode = match?.params.mode

  // Start empty and load from storage after mount. Reading localStorage during
  // render would make the prerendered HTML disagree with the first client
  // render (the header badge, most visibly) and React would throw the whole
  // subtree away to recover.
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [customDrugs, setCustomDrugs] = useState<CustomDrugPreset[]>([])

  useEffect(() => {
    setHistory(loadHistory())
    setCustomDrugs(loadCustomDrugs())
  }, [])

  // Warm the split chunks once the page is idle, so switching tabs never waits
  // on a network round trip.
  useEffect(() => {
    // Warm the routes she is most likely to reach next, so navigation never
    // waits on a round trip. The service worker precaches them all anyway;
    // this only matters on a first visit.
    const warm = () => {
      for (const load of Object.values(ROUTE_CHUNKS)) void load()
    }
    const ric = window.requestIdleCallback
    if (typeof ric === 'function') {
      const id = ric(warm, { timeout: 3000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(warm, 1500)
    return () => window.clearTimeout(id)
  }, [])

  // Remember the mode so /hitung returns her to where she left off.
  useEffect(() => {
    if (routeId === 'calculator' && mode && MODE_IDS.includes(mode)) saveLastMode(mode)
  }, [routeId, mode])

  const refreshHistory = useCallback(() => {
    setHistory(loadHistory())
  }, [])

  const refreshCustomDrugs = useCallback(() => {
    setCustomDrugs(loadCustomDrugs())
  }, [])

  // Only /hitung redirects now — '/' is a real page. The doctor never pays for
  // it: the installed PWA opens straight into /hitung/preset.
  if (routeId === 'calculator-index') {
    return <Redirect to={`/hitung/${loadLastMode(MODE_IDS, 'preset')}`} />
  }
  if (routeId === 'calculator' && (!mode || !MODE_IDS.includes(mode))) {
    return <Redirect to="/hitung/preset" />
  }

  const showCalculator = routeId === 'calculator'

  return (
    <div className="app">
      <SkipLink />
      <SiteHeader
        path={path}
        historyCount={history.length}
        historyActive={routeId === 'history'}
      />
      <RouteAnnouncer routeId={routeId} />

      <main className="app-main" id="main">
        {(routeId === 'home' || routeId === 'home-en') && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <LandingPage lang={routeId === 'home-en' ? 'en' : 'id'} />
          </Suspense>
        )}
        {(routeId === 'about' || routeId === 'about-en') && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <AboutPage lang={routeId === 'about-en' ? 'en' : 'id'} />
          </Suspense>
        )}
        {routeId === 'catalog' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <CatalogPage />
          </Suspense>
        )}
        {routeId === 'drug' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <DrugPage id={match!.params.id} onHistoryUpdated={refreshHistory} />
          </Suspense>
        )}
        {showCalculator && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <CalculatorPage
              mode={mode!}
              customDrugs={customDrugs}
              onHistoryUpdated={refreshHistory}
              onCustomDrugsChanged={refreshCustomDrugs}
            />
          </Suspense>
        )}
        {routeId === 'history' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <HistoryPage entries={history} onUpdated={refreshHistory} />
          </Suspense>
        )}
        {routeId === 'notfound' && <NotFound />}
      </main>

      <BottomNav path={path} historyCount={history.length} />

      <footer className="app-footer">
        <div className="app-footer__bar">
          <p className="app-footer__legal">
            Nilai dosis preset adalah referensi umum dan tidak menggantikan penilaian klinis.
            Tidak ada data pasien yang dikirim ke server — semua perhitungan berjalan di perangkat ini.
          </p>
          <MakerSignature />
        </div>
      </footer>
    </div>
  )
}

function NotFound() {
  return (
    <div className="panel">
      <div className="empty-state">
        <p className="empty-state__msg">Halaman tidak ditemukan.</p>
        <p className="empty-state__hint">
          <Link to="/hitung/preset">Kembali ke kalkulator</Link>
        </p>
      </div>
    </div>
  )
}

export default App
