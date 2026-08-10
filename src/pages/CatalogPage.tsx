import { useMemo, useState } from 'react'
import { DRUG_PRESETS, DrugCategory } from '../data/drugs'
import { searchDrugs } from '../lib/search'
import { Link } from '../lib/router'
import { CATEGORY_ORDER } from '../data/categories'

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
  const [activeCat, setActiveCat] = useState<DrugCategory | null>(null)

  const scoped = useMemo(
    () => (activeCat ? DRUG_PRESETS.filter((d) => d.category === activeCat) : DRUG_PRESETS),
    [activeCat],
  )
  const results = useMemo(() => searchDrugs(scoped, query), [scoped, query])
  const searching = query.trim().length > 0

  const grouped = useMemo(() => {
    const map = new Map<DrugCategory, typeof DRUG_PRESETS>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const d of results) map.get(d.category)?.push(d)
    return [...map.entries()].filter(([, list]) => list.length > 0)
  }, [results])

  const presentCategories = useMemo(() => {
    const set = new Set(DRUG_PRESETS.map((d) => d.category))
    return CATEGORY_ORDER.filter((c) => set.has(c))
  }, [])

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

      <div className="cat-chip-row">
        <button
          type="button"
          aria-pressed={activeCat === null}
          className={`cat-chip${activeCat === null ? ' cat-chip--active' : ''}`}
          onClick={() => setActiveCat(null)}
        >
          Semua
        </button>
        {presentCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            data-cat={cat}
            aria-pressed={activeCat === cat}
            className={`cat-chip${activeCat === cat ? ' cat-chip--active' : ''}`}
            onClick={() => setActiveCat(activeCat === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

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
    <Link to={`/obat/${drug.id}`} className="drug-card catalog-card" data-cat={drug.category}>
      <span className="drug-card__name">
        {drug.name}
        {flagged && (
          <>
            <span className="drug-card__flag" aria-hidden="true">⚠</span>
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
