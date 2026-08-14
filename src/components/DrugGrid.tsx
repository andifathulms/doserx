import { useState, useMemo } from 'react'
import { ExclamationTriangleIcon, CheckIcon, StarIcon, StarFilledIcon } from '@radix-ui/react-icons'
import { DRUG_PRESETS, DrugPreset, DrugCategory } from '../data/drugs'
import { loadRecents, loadFavorites, recordRecent, toggleFavorite } from '../lib/storage'
import { scoreDrug } from '../lib/search'
import { CATEGORY_ORDER, COMMON_DRUG_IDS } from '../data/categories'

// ── Single-select mode (Preset tab) ──────────────────────────────────────────

interface SingleSelectProps {
  mode?: 'single'
  drugs?: DrugPreset[]
  selected: string | null
  onSelect: (drug: DrugPreset) => void
  /** Set when the grid reopens after a selection was cleared: focus has to
   *  land somewhere, and search is where the returning user is headed. */
  autoFocusSearch?: boolean
}

// ── Multi-select mode (Puyer tab) ─────────────────────────────────────────────

interface MultiSelectProps {
  mode: 'multi'
  drugs: DrugPreset[]
  selectedIds: string[]
  onToggle: (drug: DrugPreset) => void
  autoFocusSearch?: boolean
}

type DrugGridProps = SingleSelectProps | MultiSelectProps


const PINNED_MAX = 6

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
  // Falls back to a curated common-drugs shelf when there's no personal
  // history yet, so a first-time visit or fresh device isn't dropped
  // straight into the full ~90-drug wall with nothing narrowing it.
  const { pinned, pinnedIsFallback } = useMemo(() => {
    if (searching || activeCat) return { pinned: [], pinnedIsFallback: false }
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
    if (ordered.length > 0) return { pinned: ordered.slice(0, PINNED_MAX), pinnedIsFallback: false }

    const fallback: DrugPreset[] = []
    for (const id of COMMON_DRUG_IDS) {
      const drug = byId.get(id)
      if (drug) fallback.push(drug)
    }
    return { pinned: fallback.slice(0, PINNED_MAX), pinnedIsFallback: true }
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
        {/* aria-pressed describes a toggle. In multi-select (Puyer) that is
            exactly right; in single-select it is a choice among 92, which is
            what aria-current states. */}
        <button
          data-cat={drug.category}
          className={`drug-card${selected ? ' drug-card--selected' : ''}`}
          onClick={() => handleClick(drug)}
          aria-pressed={props.mode === 'multi' ? selected : undefined}
          aria-current={props.mode === 'multi' ? undefined : selected || undefined}
        >
          <span className="drug-card__name">
            {drug.name}
            {/* The glyph is decorative: aria-label on a role-less span is
                ignored by most screen readers, and the warning text itself
                lived only in `title`, which keyboard and touch users never
                see. The meaning now rides in the card's accessible name; the
                full text appears in the drug note once selected. */}
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
          {(drug.minAgeMonths || drug.minWeightKg) && (
            <span className="drug-card__gate">
              {drug.minAgeMonths ? `≥${drug.minAgeMonths < 12 ? `${drug.minAgeMonths} bln` : `${drug.minAgeMonths / 12} th`}` : ''}
              {drug.minAgeMonths && drug.minWeightKg ? ' · ' : ''}
              {drug.minWeightKg ? `≥${drug.minWeightKg} kg` : ''}
            </span>
          )}
          {selected && (
            <span className="drug-card__check">
              <CheckIcon width="1em" height="1em" aria-hidden="true" /> Dipilih
            </span>
          )}
        </button>
        <button
          className={`drug-card__star${fav ? ' drug-card__star--on' : ''}`}
          onClick={(e) => handleToggleFav(e, drug.id)}
          aria-label={fav ? `Hapus ${drug.name} dari favorit` : `Tandai ${drug.name} favorit`}
          aria-pressed={fav}
        >
          {fav
            ? <StarFilledIcon width="18" height="18" aria-hidden="true" />
            : <StarIcon width="18" height="18" aria-hidden="true" />}
        </button>
      </div>
    )
  }

  return (
    <div className="drug-grid-wrapper">
      {/* Orientation before the catalog. Without this the visitor meets ~90
          cards with no idea where they are in the flow — and the instruction
          that used to explain it sat *below* the whole wall. */}
      <div className="grid-lede">
        <h2 className="grid-lede__title">
          {props.mode !== 'multi' && <span className="grid-lede__step" aria-hidden="true">1</span>}
          {props.mode === 'multi' ? 'Pilih obat untuk racikan' : 'Pilih obat'}
        </h2>
        <p className="grid-lede__meta">
          {drugs.length} obat siap pakai — cari nama, merek, atau keluhan, atau telusuri per kategori.
        </p>
      </div>

      <div className="drug-search-row">
        <input
          className="input drug-search-input"
          type="search"
          placeholder="Cari obat… (misal paracetamol, demam)"
          value={search}
          autoFocus={props.autoFocusSearch}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari obat"
        />
        {props.mode === 'multi' && props.selectedIds.length > 0 && (
          <span className="drug-selected-count">{props.selectedIds.length} dipilih</span>
        )}
      </div>

      {/* Category filter chips. These are filter toggles, not tabs — the
          role="tablist" that used to be here was simply the wrong widget, and
          the chips carried no pressed state at all, so which filter was
          active was unavailable to a screen reader. */}
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

      {/* Pinned recents/favorites, or — before any exist — a curated common-
          drugs shelf. The label and icon are honest about which one this is:
          a filled star claims "you picked this," which would be false for
          the fallback set. */}
      {pinned.length > 0 && (
        <div className="drug-category-group drug-pinned-section">
          <div className={`drug-category-label${pinnedIsFallback ? ' drug-category-label--fallback' : ''}`}>
            {pinnedIsFallback ? (
              <>Obat umum</>
            ) : (
              <>
                <StarFilledIcon width="1em" height="1em" aria-hidden="true" /> Sering dipakai
              </>
            )}
          </div>
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
