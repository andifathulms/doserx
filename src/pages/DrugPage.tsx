import { useEffect, useMemo, useState } from 'react'
import { StarFilledIcon, StarIcon } from '@radix-ui/react-icons'
import { DrugPreset } from '../data/drugs'
import { CatalogDrug, Regimen, findDrug, pickRegimen, regimenTitle } from '../data/catalog'
import { DrugCalculator } from '../components/DrugCalculator'
import { InfusionCalculator } from '../components/InfusionPanel'
import { SafetyBanner } from '../components/SafetyBanner'
import { Link, navigate } from '../lib/router'
import { usePatient } from '../lib/patient'
import { useCatalog, useReviewMode } from '../lib/review'
import {
  CustomDrugPreset,
  deleteCustomDrug,
  loadFavorites,
  recordRecent,
  toggleFavorite,
} from '../lib/storage'

/**
 * /obat/:id — one drug, as a destination with its own calculator.
 *
 * A drug has one or more regimens (route, indication, population — see
 * data/catalog.ts). The route chips pick one; the calculator below is the
 * one that regimen needs (a dose, or a drip rate). The chip that opens first
 * is the first regimen matching the patient bar's Anak/Dewasa.
 *
 * Also serves the doctor's own custom presets (/obat/<custom id>), which live
 * only in localStorage and so are never prerendered.
 */
interface DrugPageProps {
  id: string
  customDrugs?: CustomDrugPreset[]
  onHistoryUpdated: () => void
  onCustomDrugsChanged?: () => void
}

export function DrugPage({
  id,
  customDrugs = [],
  onHistoryUpdated,
  onCustomDrugsChanged,
}: DrugPageProps) {
  const review = useReviewMode()
  const drug = useMemo(() => findDrug(id, review), [id, review])
  const custom = customDrugs.find((c) => c.id === id)

  if (drug) return <CatalogDrugView drug={drug} onHistoryUpdated={onHistoryUpdated} />
  if (custom) {
    return (
      <CustomDrugView
        custom={custom}
        onHistoryUpdated={onHistoryUpdated}
        onDeleted={() => {
          deleteCustomDrug(custom.id)
          onCustomDrugsChanged?.()
          navigate('/obat', { replace: true })
        }}
      />
    )
  }
  // Custom presets arrive from localStorage after mount; don't flash "not
  // found" at an id that looks like one while they load.
  if (/^\d{10,}-/.test(id) && customDrugs.length === 0) return null

  return (
    <>
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>Obat tidak ditemukan</h1>
        <p className="page-lede">Tidak ada obat dengan alamat “{id}” di katalog.</p>
      </div>
      <p className="empty-hint">
        <Link to="/obat">Lihat seluruh daftar obat</Link>
      </p>
    </>
  )
}

function CatalogDrugView({ drug, onHistoryUpdated }: { drug: CatalogDrug; onHistoryUpdated: () => void }) {
  const catalog = useCatalog()
  const { population } = usePatient()
  const [regimenId, setRegimenId] = useState(() => pickRegimen(drug, 'anak').id)
  const [favorite, setFavorite] = useState(false)

  // Follow Anak/Dewasa (and a change of drug) until the doctor picks a route
  // herself — then her choice stands for this page.
  const [manual, setManual] = useState(false)
  useEffect(() => {
    setManual(false)
    setRegimenId(pickRegimen(drug, population).id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drug.id])
  useEffect(() => {
    if (!manual) setRegimenId(pickRegimen(drug, population).id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [population])

  useEffect(() => {
    recordRecent(drug.id)
    setFavorite(loadFavorites().includes(drug.id))
  }, [drug.id])

  const regimen = drug.regimens.find((r) => r.id === regimenId) ?? drug.regimens[0]
  const related = catalog.filter((d) => d.group === drug.group && d.id !== drug.id).slice(0, 6)
  const p = drug.primary

  return (
    <>
      <nav className="breadcrumb" aria-label="Remah roti">
        <Link to="/obat">Obat</Link>
        <span aria-hidden="true"> › </span>
        <span className="breadcrumb__current">{drug.group}</span>
      </nav>

      <div className="page-head page-head--drug" data-group={drug.group}>
        <div className="page-head__row">
          <h1 className="page-title" tabIndex={-1}>{drug.name}</h1>
          <button
            type="button"
            className={`fav-btn${favorite ? ' fav-btn--on' : ''}`}
            onClick={() => setFavorite(toggleFavorite(drug.id).includes(drug.id))}
            aria-pressed={favorite}
            aria-label={favorite ? `Hapus ${drug.name} dari favorit` : `Tandai ${drug.name} favorit`}
          >
            {favorite ? (
              <StarFilledIcon width="20" height="20" aria-hidden="true" />
            ) : (
              <StarIcon width="20" height="20" aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="drug-meta">
          <span className="group-tag">
            <span className="group-tag__dot" aria-hidden="true" />
            {drug.group}
          </span>
          {drug.category !== drug.group && drug.category !== 'Gawat Darurat' && (
            <span className="drug-meta__item">{drug.category}</span>
          )}
          {drug.emergency && <span className="tag tag--sos">DARURAT</span>}
          {drug.highAlert && <span className="tag tag--alert">HIGH-ALERT</span>}
          {drug.status === 'draft' && <span className="tag tag--draft">DRAF</span>}
        </p>
        {drug.aliases.length > 0 && (
          <p className="drug-page__aliases">Nama lain: {drug.aliases.join(', ')}</p>
        )}
      </div>

      {drug.regimens.length > 1 && (
        <fieldset className="route-chips">
          <legend className="route-chips__legend">Rute</legend>
          {drug.regimens.map((r) => (
            <label key={r.id} className="route-chip">
              <input
                type="radio"
                name={`route-${drug.id}`}
                className="sr-only route-chip__input"
                checked={r.id === regimen.id}
                onChange={() => {
                  setManual(true)
                  setRegimenId(r.id)
                }}
              />
              <span className="route-chip__btn">
                <span className="route-chip__route">{regimenTitle(r)}</span>
                {(r.label || r.status === 'draft' || r.population !== 'anak') && (
                  <span className="route-chip__label">
                    {[r.label, r.population === 'dewasa' ? 'dewasa' : r.population === 'semua' ? 'semua usia' : null, r.status === 'draft' ? 'draf' : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <RegimenNotices regimen={regimen} population={population} />

      {regimen.kind === 'dose' && regimen.preset.prep && <PrepBlock preset={regimen.preset} />}

      <div className="panel">
        {regimen.kind === 'dose' ? (
          <DrugCalculator
            key={regimen.id}
            drug={regimen.preset}
            onHistoryUpdated={onHistoryUpdated}
            idPrefix={`drug-${regimen.id.replace(/[^a-z0-9-]/gi, '-')}`}
          />
        ) : (
          <InfusionCalculator key={regimen.id} drug={regimen.infusion} onDrugPage />
        )}
      </div>

      <SafetyBanner />

      {related.length > 0 && (
        <section className="related">
          <h2 className="drug-section__title">Obat lain di {drug.group}</h2>
          <ul className="drug-list">
            {related.map((d) => (
              <li key={d.id}>
                <Link to={`/obat/${d.id}`} className="drug-row" data-group={d.group}>
                  <span className="drug-row__bar" aria-hidden="true" />
                  <span className="drug-row__main">
                    <span className="drug-row__name">{d.name}</span>
                    <span className="drug-row__meta">{d.regimens.map(regimenTitle).join(' · ')}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p?.reviewedBy && <p className="reviewed-by">Diverifikasi oleh {p.reviewedBy}</p>}
    </>
  )
}

/**
 * What the doctor must know about THIS regimen before reading its number:
 * that it is a draft, that it is high-alert, or that its dosing comes from
 * the other population.
 */
function RegimenNotices({ regimen, population }: { regimen: Regimen; population: 'anak' | 'dewasa' }) {
  const draft = regimen.status === 'draft'
  const source = regimen.kind === 'dose' ? regimen.preset.source : undefined
  const reviewNote = regimen.kind === 'infusion' ? regimen.infusion.reviewNote : undefined
  const popMismatch =
    regimen.population !== 'semua' && regimen.population !== population

  if (!draft && !regimen.highAlert && !popMismatch) return null
  return (
    <div className="notices">
      {draft && (
        <p className="notice notice--draft">
          <strong>DRAF — belum diverifikasi klinisi.</strong> Tampil karena mode tinjau aktif.
          {source && <> Acuan yang dipakai: {source}.</>}
          {reviewNote && <> {reviewNote}</>}
        </p>
      )}
      {regimen.highAlert && (
        <p className="notice notice--alert">
          <strong>Obat high-alert.</strong> Cek ganda dosis, konsentrasi dan kecepatan pemberian
          dengan petugas kedua sebelum diberikan.
        </p>
      )}
      {popMismatch && (
        <p className="notice notice--pop">
          {regimen.population === 'anak' ? (
            <>
              Dosis rute ini dari acuan <strong>anak</strong> (mg/kg). Pasien diatur sebagai
              dewasa — batas maksimum tetap berlaku; periksa acuan dewasa bila ada.
            </>
          ) : (
            <>
              Dosis rute ini untuk <strong>dewasa</strong>. Pasien diatur sebagai anak.
            </>
          )}
        </p>
      )}
    </div>
  )
}

function PrepBlock({ preset }: { preset: DrugPreset }) {
  const prep = preset.prep!
  return (
    <section className="prep" aria-label="Penyiapan">
      <h2 className="prep__title">Penyiapan</h2>
      <dl className="prep__list">
        {prep.reconstitute && (
          <>
            <dt>Larutkan</dt>
            <dd>
              {prep.reconstitute}
              {prep.concentration != null && (
                <span className="prep__conc"> = {prep.concentration} mg/mL</span>
              )}
            </dd>
          </>
        )}
        {prep.dilute && (
          <>
            <dt>Encerkan</dt>
            <dd>{prep.dilute}</dd>
          </>
        )}
        {prep.give && (
          <>
            <dt>Berikan</dt>
            <dd>{prep.give}</dd>
          </>
        )}
      </dl>
    </section>
  )
}

function CustomDrugView({
  custom,
  onHistoryUpdated,
  onDeleted,
}: {
  custom: CustomDrugPreset
  onHistoryUpdated: () => void
  onDeleted: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const preset: DrugPreset = {
    id: custom.id,
    name: custom.name,
    route: 'Oral',
    category: 'Lain-lain',
    dosePerKg: custom.dosePerKg,
    freq: custom.freq,
    maxDay: custom.maxDay,
    maxSingle: custom.maxSingle,
    concentration: custom.concentration,
    note: custom.note || 'Preset kustom — nilai diisi sendiri, tanpa acuan katalog.',
    forPuyer: false,
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Remah roti">
        <Link to="/obat">Obat</Link>
        <span aria-hidden="true"> › </span>
        <span className="breadcrumb__current">Preset saya</span>
      </nav>
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>{custom.name}</h1>
        <p className="drug-meta">
          <span className="drug-meta__item">Preset kustom · tanpa acuan katalog</span>
        </p>
      </div>
      <div className="panel">
        <DrugCalculator drug={preset} onHistoryUpdated={onHistoryUpdated} idPrefix="custom-preset" />
      </div>
      <SafetyBanner />
      <div className="custom-delete">
        {confirming ? (
          <>
            <span>Hapus preset “{custom.name}”?</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)}>
              Batal
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={onDeleted}>
              Hapus
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(true)}>
            Hapus preset ini
          </button>
        )}
      </div>
    </>
  )
}
