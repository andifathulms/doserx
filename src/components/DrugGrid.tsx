import { useState, useMemo } from 'react'
import { DRUG_PRESETS, DrugPreset, DrugCategory } from '../data/drugs'
import { loadRecents, loadFavorites, recordRecent, toggleFavorite } from '../lib/storage'

// ── Single-select mode (Preset tab) ──────────────────────────────────────────

interface SingleSelectProps {
  mode?: 'single'
  drugs?: DrugPreset[]
  selected: string | null
  onSelect: (drug: DrugPreset) => void
}

// ── Multi-select mode (Puyer tab) ─────────────────────────────────────────────

interface MultiSelectProps {
  mode: 'multi'
  drugs: DrugPreset[]
  selectedIds: string[]
  onToggle: (drug: DrugPreset) => void
}

type DrugGridProps = SingleSelectProps | MultiSelectProps

const CATEGORY_ORDER: DrugCategory[] = [
  'Gawat Darurat',
  'Analgesik/NSAID',
  'Antibiotik',
  'Antivirus',
  'Antijamur',
  'Anti-TB (OAT)',
  'Antiparasit',
  'Antikonvulsan',
  'Kardiovaskular',
  'Pulmologi',
  'Gastrointestinal',
  'Kortikosteroid',
  'Antihistamin/Alergi',
  'Vitamin/Mineral',
  'Cairan & Elektrolit',
  'Antimalarial',
  'Lain-lain',
]

const PINNED_MAX = 6

// Relevance score for a query against a drug. Higher = better; 0 = no match.
function scoreDrug(d: DrugPreset, q: string): number {
  const name = d.name.toLowerCase()
  if (name.startsWith(q)) return 5
  if (name.includes(q)) return 4
  if (d.aliases?.some((a) => a.toLowerCase().includes(q))) return 3
  if (d.indications?.some((i) => i.toLowerCase().includes(q))) return 2
  if (d.category.toLowerCase().includes(q) || d.route.toLowerCase().includes(q)) return 1
  return 0
}

export function DrugGrid(props: DrugGridProps) {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<DrugCategory | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())
  const [recents] = useState<string[]>(() => loadRecents())

  const drugs = props.mode === 'multi' ? props.drugs : (props.drugs ?? DRUG_PRESETS)

  const q = search.trim().toLowerCase()
  const searching = q.length > 0

  // Categories actually present in this drug set, in canonical order.
  const presentCategories = useMemo(() => {
    const set = new Set(drugs.map((d) => d.category))
    return CATEGORY_ORDER.filter((c) => set.has(c))
  }, [drugs])

  const scoped = useMemo(
    () => (activeCat ? drugs.filter((d) => d.category === activeCat) : drugs),
    [drugs, activeCat],
  )

  // When searching: flat, relevance-ranked. Otherwise: keep the original order.
  const ranked = useMemo(() => {
    if (!searching) return scoped
    return scoped
      .map((d) => ({ d, s: scoreDrug(d, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.d)
  }, [scoped, searching, q])

  const grouped = useMemo(() => {
    const map = new Map<DrugCategory, DrugPreset[]>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const d of scoped) map.get(d.category)?.push(d)
    return [...map.entries()].filter(([, list]) => list.length > 0)
  }, [scoped])

  // "Sering dipakai" — favorites first, then recents not already favorited.
  const pinned = useMemo(() => {
    if (searching || activeCat) return []
    const byId = new Map(drugs.map((d) => [d.id, d]))
    const ordered: DrugPreset[] = []
    const seen = new Set<string>()
    for (const id of [...favorites, ...recents]) {
      if (seen.has(id)) continue
      const drug = byId.get(id)
      if (drug) {
        ordered.push(drug)
        seen.add(id)
      }
    }
    return ordered.slice(0, PINNED_MAX)
  }, [drugs, favorites, recents, searching, activeCat])

  function isSelected(id: string): boolean {
    if (props.mode === 'multi') return props.selectedIds.includes(id)
    return props.selected === id
  }

  function handleClick(drug: DrugPreset) {
    recordRecent(drug.id)
    if (props.mode === 'multi') props.onToggle(drug)
    else props.onSelect(drug)
  }

  function handleToggleFav(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setFavorites(toggleFavorite(id))
  }

  function renderCard(drug: DrugPreset) {
    const selected = isSelected(drug.id)
    const fav = favorites.includes(drug.id)
    const flagged = !!(drug.warning || drug.contraindication)
    return (
      <div key={drug.id} className="drug-card-wrap" data-cat={drug.category}>
        <button
          data-cat={drug.category}
          className={`drug-card${selected ? ' drug-card--selected' : ''}`}
          onClick={() => handleClick(drug)}
          aria-pressed={selected}
        >
          <span className="drug-card__name">
            {drug.name}
            {flagged && (
              <span className="drug-card__flag" title={drug.warning ?? drug.contraindication} aria-label="Perhatian">
                ⚠
              </span>
            )}
          </span>
          <span className="drug-card__route">{drug.route}</span>
          {(drug.minAgeMonths || drug.minWeightKg) && (
            <span className="drug-card__gate">
              {drug.minAgeMonths ? `≥${drug.minAgeMonths < 12 ? `${drug.minAgeMonths} bln` : `${drug.minAgeMonths / 12} th`}` : ''}
              {drug.minAgeMonths && drug.minWeightKg ? ' · ' : ''}
              {drug.minWeightKg ? `≥${drug.minWeightKg} kg` : ''}
            </span>
          )}
          {selected && <span className="drug-card__check">✓ Dipilih</span>}
        </button>
        <button
          className={`drug-card__star${fav ? ' drug-card__star--on' : ''}`}
          onClick={(e) => handleToggleFav(e, drug.id)}
          aria-label={fav ? `Hapus ${drug.name} dari favorit` : `Tandai ${drug.name} favorit`}
          aria-pressed={fav}
          title={fav ? 'Favorit' : 'Tandai favorit'}
        >
          {fav ? '★' : '☆'}
        </button>
      </div>
    )
  }

  return (
    <div className="drug-grid-wrapper">
      <div className="drug-search-row">
        <input
          className="input drug-search-input"
          type="search"
          placeholder="Cari nama, merek, atau keluhan (mis. demam, batuk)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari obat"
        />
        {props.mode === 'multi' && props.selectedIds.length > 0 && (
          <span className="drug-selected-count">{props.selectedIds.length} dipilih</span>
        )}
      </div>

      {/* Category filter chips */}
      <div className="cat-chip-row" role="tablist" aria-label="Filter kategori">
        <button
          className={`cat-chip${activeCat === null ? ' cat-chip--active' : ''}`}
          onClick={() => setActiveCat(null)}
        >
          Semua
        </button>
        {presentCategories.map((cat) => (
          <button
            key={cat}
            data-cat={cat}
            className={`cat-chip${activeCat === cat ? ' cat-chip--active' : ''}`}
            onClick={() => setActiveCat(activeCat === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Pinned recents/favorites */}
      {pinned.length > 0 && (
        <div className="drug-category-group drug-pinned-section">
          <div className="drug-category-label">★ Sering dipakai</div>
          <div className="drug-grid">{pinned.map(renderCard)}</div>
        </div>
      )}

      {searching ? (
        ranked.length === 0 ? (
          <p className="empty-hint">Tidak ada hasil untuk "{search}".</p>
        ) : (
          <div className="drug-category-group">
            <div className="drug-category-label">Hasil ({ranked.length})</div>
            <div className="drug-grid">{ranked.map(renderCard)}</div>
          </div>
        )
      ) : grouped.length === 0 ? (
        <p className="empty-hint">Tidak ada obat pada kategori ini.</p>
      ) : (
        grouped.map(([category, list]) => (
          <div key={category} className="drug-category-group">
            <div className="drug-category-label">{category}</div>
            <div className="drug-grid">{list.map(renderCard)}</div>
          </div>
        ))
      )}
    </div>
  )
}
