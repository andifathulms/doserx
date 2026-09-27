import { lazy, Suspense } from 'react'
import { CustomPanel } from '../components/CustomPanel'
import { SafetyBanner } from '../components/SafetyBanner'
import { CALCULATOR_MODES } from '../routes'
import { Link } from '../lib/router'
import { CustomDrugPreset } from '../lib/storage'

/**
 * /hitung/:mode — the tools that are not "one catalog drug": a custom drug,
 * a puyer recipe, the drip list, and fluids. Each is reached from the
 * navigation (Puyer, Cairan) or from the Obat list (Kustom, drips), so the
 * mode tabs that used to sit here are gone — each mode is its own page with
 * its own heading.
 *
 * Pulled out of App so the shell carries no calculator code: a visitor reading
 * the landing page or a drug monograph never downloads the four panels, and
 * someone calculating never downloads the landing copy.
 *
 * Puyer and Infus stay lazy WITHIN this chunk: they are separate modes behind
 * a tab, not part of the first interaction, and they are warmed on idle.
 */
const PuyerPanel = lazy(() =>
  import('../components/PuyerPanel').then((m) => ({ default: m.PuyerPanel })),
)
const InfusionPanel = lazy(() =>
  import('../components/InfusionPanel').then((m) => ({ default: m.InfusionPanel })),
)
const FluidPanel = lazy(() =>
  import('../components/FluidPanel').then((m) => ({ default: m.FluidPanel })),
)

interface CalculatorPageProps {
  mode: string
  customDrugs: CustomDrugPreset[]
  onHistoryUpdated: () => void
  onCustomDrugsChanged: () => void
}

export function CalculatorPage({
  mode,
  customDrugs: _customDrugs,
  onHistoryUpdated,
  onCustomDrugsChanged,
}: CalculatorPageProps) {
  const m = CALCULATOR_MODES.find((x) => x.id === mode) ?? CALCULATOR_MODES[0]

  return (
    <>
      {(mode === 'custom' || mode === 'infus') && (
        <nav className="breadcrumb" aria-label="Remah roti">
          <Link to="/obat">Obat</Link>
          <span aria-hidden="true"> › </span>
          <span className="breadcrumb__current">{m.label}</span>
        </nav>
      )}
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>{m.title}</h1>
        <p className="page-lede">{m.hint}</p>
      </div>

      <SafetyBanner />

      {mode === 'custom' && (
        <CustomPanel onHistoryUpdated={onHistoryUpdated} onPresetSaved={onCustomDrugsChanged} />
      )}
      {mode === 'puyer' && (
        <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
          <PuyerPanel onHistoryUpdated={onHistoryUpdated} />
        </Suspense>
      )}
      {mode === 'infus' && (
        <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
          <InfusionPanel />
        </Suspense>
      )}
      {mode === 'cairan' && (
        <Suspense fallback={<div className="panel-loading" aria-hidden="true" />}>
          <FluidPanel />
        </Suspense>
      )}
    </>
  )
}
