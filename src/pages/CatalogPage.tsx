import { useEffect, useMemo, useState } from 'react'
import { StarFilledIcon } from '@radix-ui/react-icons'
import { DrugGroup } from '../data/drugs'
import { CatalogDrug, drugRoutes, pickRegimen } from '../data/catalog'
import { COMMON_DRUG_IDS, GROUP_ORDER } from '../data/categories'
import { searchCatalog } from '../lib/search'
import { Link } from '../lib/router'
import { usePatient } from '../lib/patient'
import { useCatalog } from '../lib/review'
import { quickDose, dosingSummary } from '../lib/quickDose'
import { CustomDrugPreset, loadFavorites, loadRecents } from '../lib/storage'
import { GroupFilter, GroupSelection, NO_GROUP } from '../components/GroupFilter'
import { SafetyBanner } from '../components/SafetyBanner'

/**
 * /obat — the one drug list. It replaces both the old Preset picker (a grid
 * of buttons inside the calculator) and the old catalog (a grid of links to
 * the same 92 drugs): two lists of one library taught two mental models.
 *
 * Every row is a link to the drug's page, and — once the patient bar has a
 * weight — shows that drug's dose for this patient inline, from the same
 * engine and catalog defaults the drug page uses. For the common case the
 * list IS the answer; opening the drug gives the working, the route choice
 * and the preparation.
 */
const PINNED_MAX = 6

export function CatalogPage({ customDrugs = [] }: { customDrugs?: CustomDrugPreset[] }) {
  const catalog = useCatalog()
  const { weightKg, population } = usePatient()
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState<GroupSelection>(NO_GROUP)
  // Personal shelves are read after mount so the prerendered list and the
  // first client render agree (see App for why).
  const [favorites, setFavorites] = useState<string[]>([])
  const [recents, setRecents] = useState<string[]>([])
  useEffect(() => {
    setFavorites(loadFavorites())
    setRecents(loadRecents())
  }, [])

  const scoped = useMemo(
    () =>
      sel.group
        ? catalog.filter((d) => d.group === sel.group && (!sel.sub || d.category === sel.sub))
        : catalog,
    [catalog, sel],
  )
  const results = useMemo(() => searchCatalog(scoped, query), [scoped, query])
  const searching = query.trim().length > 0

  const grouped = useMemo(() => {
    const map = new Map<DrugGroup, CatalogDrug[]>()
    for (const g of GROUP_ORDER) map.set(g, [])
    for (const d of results) map.get(d.group)?.push(d)
    return [...map.entries()].filter(([, list]) => list.length > 0)
  }, [results])

  // Favourites, then recents, else the common-drugs shelf so a first visit
  // is never just the full wall of drugs.
  const { pinned, pinnedIsFallback } = useMemo(() => {
    if (searching || sel.group) return { pinned: [], pinnedIsFallback: false }
    const byId = new Map(catalog.map((d) => [d.id, d]))
    const personal = [...new Set([...favorites, ...recents])]
      .map((id) => byId.get(id))
      .filter((d): d is CatalogDrug => !!d)
    if (personal.length) return { pinned: personal.slice(0, PINNED_MAX), pinnedIsFallback: false }
    return {
      pinned: COMMON_DRUG_IDS.map((id) => byId.get(id)).filter((d): d is CatalogDrug => !!d),
      pinnedIsFallback: true,
    }
  }, [catalog, favorites, recents, searching, sel.group])

  const row = (d: CatalogDrug) => (
    <DrugRow key={d.id} drug={d} weightKg={weightKg} population={population} />
  )

  return (
    <>
      <div className="page-head page-head--compact">
        <h1 className="page-title" tabIndex={-1}>Obat</h1>
        <p className="page-lede">
          {weightKg != null
            ? `Dosis lazim per kali untuk ${weightKg} kg. Buka obat untuk rute lain dan cara hitungnya.`
            : 'Isi berat pasien di atas — dosis tiap obat langsung muncul di daftar.'}
        </p>
      </div>

      <SafetyBanner compact />

      <div className="drug-search-row">
        <input
          className="input drug-search-input"
          type="search"
          placeholder="Cari obat, merek, atau keluhan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari obat"
        />
      </div>

      <GroupFilter drugs={catalog} value={sel} onChange={setSel} />

      {pinned.length > 0 && (
        <section className="drug-section" aria-labelledby="shelf-pinned">
          <h2 className="drug-section__title" id="shelf-pinned">
            {pinnedIsFallback ? (
              'Obat umum'
            ) : (
              <>
                <StarFilledIcon width="1em" height="1em" aria-hidden="true" /> Sering dipakai
              </>
            )}
          </h2>
          <ul className="drug-list">{pinned.map(row)}</ul>
        </section>
      )}

      {!searching && !sel.group && customDrugs.length > 0 && (
        <section className="drug-section" aria-labelledby="shelf-custom">
          <h2 className="drug-section__title" id="shelf-custom">Preset saya</h2>
          <ul className="drug-list">
            {customDrugs.map((c) => (
              <li key={c.id}>
                <Link to={`/obat/${c.id}`} className="drug-row" data-group="Lain-lain & Nutrisi">
                  <span className="drug-row__bar" aria-hidden="true" />
                  <span className="drug-row__main">
                    <span className="drug-row__name">{c.name}</span>
                    <span className="drug-row__meta">
                      {c.dosePerKg} mg/kg/hari · {c.freq}×/hari · kustom
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {searching ? (
        <section className="drug-section" aria-labelledby="shelf-results">
          <h2 className="drug-section__title" id="shelf-results">
            {results.length === 0 ? `Tidak ada hasil untuk “${query}”` : `Hasil (${results.length})`}
          </h2>
          {results.length > 0 && <ul className="drug-list">{results.map(row)}</ul>}
        </section>
      ) : (
        grouped.map(([group, list]) => (
          <section key={group} className="drug-section" aria-labelledby={`g-${slug(group)}`}>
            <h2 className="drug-section__title" id={`g-${slug(group)}`} data-group={group}>
              <span className="drug-section__dot" aria-hidden="true" />
              {group} <span className="drug-section__count">{list.length}</span>
            </h2>
            <ul className="drug-list">{list.map(row)}</ul>
          </section>
        ))
      )}

      {/* The way out of the catalog, where it is needed: at the end of any
          search or list, not as a peer tab of the thing it is an exception to. */}
      <Link to="/hitung/custom" className="drug-row drug-row--custom">
        <span className="drug-row__main">
          <span className="drug-row__name">+ Hitung obat lain (kustom)</span>
          <span className="drug-row__meta">Tidak ada di daftar? Isi sendiri mg/kg, frekuensi dan konsentrasi.</span>
        </span>
      </Link>
    </>
  )
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z]+/g, '-')
}

function DrugRow({
  drug,
  weightKg,
  population,
}: {
  drug: CatalogDrug
  weightKg: number | null
  population: 'anak' | 'dewasa'
}) {
  const regimen = pickRegimen(drug, population)
  const q = weightKg != null ? quickDose(regimen, weightKg) : null
  const routes = drugRoutes(drug)
  const flagged = drug.primary?.warning || drug.primary?.contraindication

  return (
    <li>
      <Link to={`/obat/${drug.id}`} className="drug-row" data-group={drug.group}>
        <span className="drug-row__bar" aria-hidden="true" />
        <span className="drug-row__main">
          <span className="drug-row__name">
            {drug.name}
            {drug.status === 'draft' && <span className="tag tag--draft">DRAF</span>}
            {drug.highAlert && <span className="tag tag--alert">HIGH-ALERT</span>}
            {flagged && <span className="sr-only"> — ada peringatan</span>}
          </span>
          <span className="drug-row__routes">
            {routes.map((r) => (
              <span key={r} className="route-pill">{r}</span>
            ))}
          </span>
        </span>
        <span className="drug-row__dose">
          {q ? (
            <>
              <span className="drug-row__value">
                {q.capped && <span className="tag tag--cap">MAKS</span>}
                {q.value}
                <span className="drug-row__unit"> {q.unit}</span>
              </span>
              {q.sub && <span className="drug-row__sub">{q.sub}</span>}
            </>
          ) : (
            <span className="drug-row__summary">{dosingSummary(regimen)}</span>
          )}
        </span>
      </Link>
    </li>
  )
}
