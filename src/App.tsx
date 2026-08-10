import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { Tabs } from './components/Tabs'
import { PresetPanel } from './components/PresetPanel'
import { CustomPanel } from './components/CustomPanel'
import { MakerSignature } from './components/MakerSignature'
import { WorkedExample } from './components/WorkedExample'
import {
  loadHistory,
  loadCustomDrugs,
  loadLastMode,
  saveLastMode,
  HistoryEntry,
  CustomDrugPreset,
} from './lib/storage'
import { Link, Redirect, useLocation, navigate } from './lib/router'
import { resolveRoute } from './lib/route-match'
import { SkipLink, SiteHeader, BottomNav, RouteAnnouncer } from './components/SiteNav'
import { CatalogPage } from './pages/CatalogPage'
import { LandingPage } from './pages/LandingPage'
// Methodology is a read, not an interaction — never needed at first paint.
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })),
)
import { ROUTES } from './routes'

/**
 * Puyer, Infus and History sit behind a tab or a nav link — never on screen at
 * first paint and never needed in the first interaction, which is always
 * Preset. Splitting them takes 5.5 kB gzip off the critical path.
 *
 * Preset, DrugGrid, ResultCard and the worked example stay eagerly imported:
 * they ARE the first interaction.
 */
const HistoryPanel = lazy(() =>
  import('./components/HistoryPanel').then((m) => ({ default: m.HistoryPanel })),
)
const PuyerPanel = lazy(() =>
  import('./components/PuyerPanel').then((m) => ({ default: m.PuyerPanel })),
)
const InfusionPanel = lazy(() =>
  import('./components/InfusionPanel').then((m) => ({ default: m.InfusionPanel })),
)
// A drug page is a destination reached from the catalog or from outside; it is
// never the first interaction on the calculator route.
const DrugPage = lazy(() =>
  import('./pages/DrugPage').then((m) => ({ default: m.DrugPage })),
)

// Calculator modes only. History is a record, not a calculator — it is its own
// route rather than crowding the segmented control to 5 items.
// Each mode carries a one-line hint: the bare labels are jargon to anyone
// meeting the app for the first time, and nothing else on screen says these
// four are calculators rather than drug categories.
const TABS = [
  {
    id: 'preset',
    label: 'Preset',
    hint: 'Hitung dosis satu obat dari katalog siap pakai — dosis/kg sudah terisi.',
  },
  {
    id: 'custom',
    label: 'Kustom',
    hint: 'Obat di luar katalog — masukkan sendiri dosis/kg, frekuensi, dan konsentrasi.',
  },
  {
    id: 'puyer',
    label: 'Puyer',
    hint: 'Racik 2 obat atau lebih sekaligus menjadi satu resep puyer per bungkus.',
  },
  {
    id: 'infus',
    label: 'Infus',
    hint: 'Obat drip — hitung kecepatan infus (mL/jam) dan tetes per menit.',
  },
]

const MODE_IDS = TABS.map((t) => t.id)

function App() {
  const path = useLocation()
  const match = resolveRoute(ROUTES, path)
  const routeId = match?.route.id ?? 'notfound'
  const mode = match?.params.mode

  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [customDrugs, setCustomDrugs] = useState<CustomDrugPreset[]>(() => loadCustomDrugs())

  // Warm the split chunks once the page is idle, so switching tabs never waits
  // on a network round trip.
  useEffect(() => {
    const warm = () => {
      void import('./components/PuyerPanel')
      void import('./components/InfusionPanel')
      void import('./components/HistoryPanel')
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

  function handleTabChange(id: string) {
    navigate(`/hitung/${id}`)
  }

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
        {/* Each page owns its <h1>; the wordmark in the header is a link, not
            a heading. Focus lands here on every route change. */}
        {(showCalculator || routeId === 'history') && (
          <div className="page-head">
            <h1 className="page-title" tabIndex={-1}>
              {routeId === 'history' ? 'Riwayat perhitungan' : 'Kalkulator dosis'}
            </h1>
            <p className="page-lede">
              {routeId === 'history'
                ? 'Tersimpan di perangkat ini saja — tidak ada yang dikirim ke server.'
                : 'Masukkan berat badan pasien, dapatkan dosis mg dan volume mL siap pakai.'}
            </p>
          </div>
        )}

        {/* The flow, carried through with real numbers and a live weight —
            an abstract three-step strip demonstrated nothing. */}
        {showCalculator && <WorkedExample />}

        {showCalculator && (
          <Tabs tabs={TABS} active={mode!} onChange={handleTabChange} label="Mode hitung" />
        )}

        {routeId === 'home' && <LandingPage lang="id" />}
        {routeId === 'home-en' && <LandingPage lang="en" />}
        {(routeId === 'about' || routeId === 'about-en') && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <AboutPage lang={routeId === 'about-en' ? 'en' : 'id'} />
          </Suspense>
        )}
        {routeId === 'catalog' && <CatalogPage />}
        {routeId === 'drug' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <DrugPage id={match!.params.id} onHistoryUpdated={refreshHistory} />
          </Suspense>
        )}

        {(showCalculator || routeId === 'drug') && (
        <div className="safety-banner" role="note">
          <span className="safety-banner__icon" aria-hidden="true">⚠</span>
          <span>
            <strong>Alat bantu hitung saja</strong> — bukan sistem pendukung keputusan klinis atau resep.
            Verifikasi setiap dosis dengan panduan institusi/klinis terkini sebelum digunakan.
          </span>
        </div>
        )}

        {mode === 'preset' && (
          <PresetPanel
            onHistoryUpdated={refreshHistory}
            customDrugs={customDrugs}
            onCustomDrugDeleted={refreshCustomDrugs}
          />
        )}
        {mode === 'custom' && (
          <CustomPanel
            onHistoryUpdated={refreshHistory}
            onPresetSaved={refreshCustomDrugs}
          />
        )}
        {mode === 'puyer' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <PuyerPanel onHistoryUpdated={refreshHistory} />
          </Suspense>
        )}
        {mode === 'infus' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <InfusionPanel />
          </Suspense>
        )}
        {routeId === 'history' && (
          <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
            <HistoryPanel entries={history} onUpdated={refreshHistory} />
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
