import { useMemo } from 'react'
import { DRUG_PRESETS } from '../data/drugs'
import { DrugCalculator } from '../components/DrugCalculator'
import { Link } from '../lib/router'

/**
 * /obat/:id — one drug, as a destination.
 *
 * The catalog's clinical content used to be reachable only by selecting a drug
 * inside a tab and opening a collapsed panel: no URL, nothing to share, nothing
 * to index. Each of the 92 drugs is now a page that stands on its own, and it
 * carries the FULL calculator rather than a link to one — landing here from a
 * search result and getting to a dose should not require a detour.
 */
export function DrugPage({ id, onHistoryUpdated }: { id: string; onHistoryUpdated: () => void }) {
  const drug = useMemo(() => DRUG_PRESETS.find((d) => d.id === id), [id])

  const related = useMemo(() => {
    if (!drug) return []
    return DRUG_PRESETS.filter((d) => d.category === drug.category && d.id !== drug.id).slice(0, 6)
  }, [drug])

  if (!drug) {
    return (
      <>
        <div className="page-head">
          <h1 className="page-title" tabIndex={-1}>Obat tidak ditemukan</h1>
          <p className="page-lede">
            Tidak ada obat dengan alamat “{id}” di katalog.
          </p>
        </div>
        <p className="empty-hint">
          <Link to="/obat">Lihat seluruh katalog obat</Link>
        </p>
      </>
    )
  }

  const doseRange =
    drug.dosePerKgMin != null && drug.dosePerKgMax != null
      ? `${drug.dosePerKgMin}–${drug.dosePerKgMax} mg/kg/hari`
      : `${drug.dosePerKg} mg/kg/hari`

  return (
    <>
      <nav className="breadcrumb" aria-label="Remah roti">
        <Link to="/obat">Katalog obat</Link>
        <span aria-hidden="true"> › </span>
        <span className="breadcrumb__current">{drug.category}</span>
      </nav>

      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>{drug.name}</h1>
        <p className="page-lede">
          {doseRange} · {drug.freq}×/hari · {drug.route}
          {drug.source && <> · acuan <strong>{drug.source}</strong></>}
        </p>
        {drug.aliases?.length ? (
          <p className="drug-page__aliases">Nama lain: {drug.aliases.join(', ')}</p>
        ) : null}
      </div>

      {/* Calculate first: someone who arrives here from a search wants the
          dose, not a monograph they have to scroll past to reach the form. */}
      <div className="panel">
        <DrugCalculator drug={drug} onHistoryUpdated={onHistoryUpdated} idPrefix={`drug-${drug.id}`} />
      </div>

      {related.length > 0 && (
        <section className="related">
          <h2 className="drug-category-label">Obat lain di {drug.category}</h2>
          <div className="drug-grid">
            {related.map((d) => (
              <Link key={d.id} to={`/obat/${d.id}`} className="drug-card catalog-card" data-cat={d.category}>
                <span className="drug-card__name">{d.name}</span>
                <span className="drug-card__route">{d.route}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
