import { useMemo, useState } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { DRUG_PRESETS } from '../data/drugs'
import { searchDrugs } from '../lib/search'
import { Link } from '../lib/router'
import { groupOf } from '../data/categories'
import { GroupFilter, GroupSelection, NO_GROUP, filterByGroup, groupDrugs } from '../components/GroupFilter'

/**
 * /obat — the catalog as a browsable index.
 *
 * Distinct from the picker inside the calculator: this one is made of links,
 * not buttons. Every entry is a destination with its own URL, which is what
 * makes the 92 drugs findable from outside the app at all. Ranking is shared
 * with the picker (lib/search) so a drug that comes first when calculating
 * comes first when browsing.
 */
export function CatalogPage() {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState<GroupSelection>(NO_GROUP)

  const scoped = useMemo(() => filterByGroup(DRUG_PRESETS, sel), [sel])
  const results = useMemo(() => searchDrugs(scoped, query), [scoped, query])
  const searching = query.trim().length > 0

  const grouped = useMemo(() => groupDrugs(results), [results])

  return (
    <>
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>Katalog obat</h1>
        <p className="page-lede">
          {DRUG_PRESETS.length} obat dengan dosis berbasis berat badan, sediaan yang tersedia,
          efek samping dan sumber acuannya. Buka satu obat untuk langsung menghitung dosisnya.
        </p>
      </div>

      <div className="drug-search-row">
        <input
          className="input drug-search-input"
          type="search"
          placeholder="Cari obat… (misal paracetamol, demam)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari obat"
        />
      </div>

      <GroupFilter drugs={DRUG_PRESETS} value={sel} onChange={setSel} />

      {results.length === 0 ? (
        <p className="empty-hint">Tidak ada hasil untuk “{query}”.</p>
      ) : searching ? (
        <section className="drug-category-group">
          <h2 className="drug-category-label">Hasil ({results.length})</h2>
          <div className="drug-grid">
            {results.map((d) => (
              <CatalogCard key={d.id} drug={d} />
            ))}
          </div>
        </section>
      ) : (
        grouped.map(([category, list]) => (
          <section key={category} className="drug-category-group">
            <h2 className="drug-category-label">
              {category} <span className="drug-category-count">({list.length})</span>
            </h2>
            <div className="drug-grid">
              {list.map((d) => (
                <CatalogCard key={d.id} drug={d} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  )
}

function CatalogCard({ drug }: { drug: (typeof DRUG_PRESETS)[number] }) {
  const flagged = !!(drug.warning || drug.contraindication)
  return (
    <Link to={`/obat/${drug.id}`} className="drug-card catalog-card" data-group={groupOf(drug)}>
      <span className="drug-card__name">
        {drug.name}
        {flagged && (
          <>
            <ExclamationTriangleIcon className="drug-card__flag" width="1em" height="1em" aria-hidden="true" />
            <span className="sr-only">
              {drug.contraindication ? ' — ada kontraindikasi' : ' — ada peringatan'}
            </span>
          </>
        )}
      </span>
      <span className="drug-card__route">{drug.route}</span>
      <span className="catalog-card__dose">
        {drug.dosePerKgMin != null && drug.dosePerKgMax != null
          ? `${drug.dosePerKgMin}–${drug.dosePerKgMax}`
          : drug.dosePerKg}{' '}
        mg/kg/hari
      </span>
    </Link>
  )
}
