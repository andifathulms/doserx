import { lazy, Suspense } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Tabs } from '../components/Tabs'
import { PresetPanel } from '../components/PresetPanel'
import { CustomPanel } from '../components/CustomPanel'
import { CALCULATOR_MODES } from '../routes'
import { navigate } from '../lib/router'
import { CustomDrugPreset } from '../lib/storage'

/**
 * /hitung/:mode — the calculator route, as one chunk.
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
  customDrugs,
  onHistoryUpdated,
  onCustomDrugsChanged,
}: CalculatorPageProps) {
  return (
    <>
      {/* The demo lives on the landing page, not here. On the tool it sat
          between the heading and the tabs, delaying the thing the doctor came
          for — and it duplicated what the form below does for real. */}
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>Kalkulator dosis</h1>
        <p className="page-lede">
          Masukkan berat badan pasien, dapatkan dosis mg dan volume mL siap pakai.
        </p>
      </div>

      <Tabs
        tabs={CALCULATOR_MODES.map((m) => ({ ...m }))}
        active={mode}
        onChange={(id) => navigate(`/hitung/${id}`)}
        label="Mode hitung"
      />

      <div className="safety-banner" role="note">
        <ExclamationTriangleIcon className="safety-banner__icon" aria-hidden="true" />
        <span>
          <strong>Alat bantu hitung saja</strong> — bukan sistem pendukung keputusan klinis atau resep.
          Verifikasi setiap dosis dengan panduan institusi/klinis terkini sebelum digunakan.
        </span>
      </div>

      {mode === 'preset' && (
        <PresetPanel
          onHistoryUpdated={onHistoryUpdated}
          customDrugs={customDrugs}
          onCustomDrugDeleted={onCustomDrugsChanged}
        />
      )}
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
