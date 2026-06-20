import { useState, useMemo } from 'react'
import { DRUG_PRESETS, DrugPreset, DrugCategory } from '../data/drugs'

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
  'Antiinfeksi',
  'Antiparasit',
  'Antikonvulsan',
  'Kardiovaskular',
  'Pulmologi',
  'Gastrointestinal',
  'Kortikosteroid',
  'Vitamin/Mineral',
  'Antimalarial',
  'Lain-lain',
]

export function DrugGrid(props: DrugGridProps) {
  const [search, setSearch] = useState('')

  const drugs = props.mode === 'multi' ? props.drugs : (props.drugs ?? DRUG_PRESETS)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return drugs
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.route.toLowerCase().includes(q),
    )
  }, [drugs, search])

  const grouped = useMemo(() => {
    const map = new Map<DrugCategory, DrugPreset[]>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const d of filtered) {
      const list = map.get(d.category)
      if (list) list.push(d)
    }
    return [...map.entries()].filter(([, list]) => list.length > 0)
  }, [filtered])

  function isSelected(id: string): boolean {
    if (props.mode === 'multi') return props.selectedIds.includes(id)
    return props.selected === id
  }

  function handleClick(drug: DrugPreset) {
    if (props.mode === 'multi') props.onToggle(drug)
    else props.onSelect(drug)
  }

  return (
    <div className="drug-grid-wrapper">
      <div className="drug-search-row">
        <input
          className="input drug-search-input"
          type="search"
          placeholder="Cari obat…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari obat"
        />
        {props.mode === 'multi' && props.selectedIds.length > 0 && (
          <span className="drug-selected-count">{props.selectedIds.length} dipilih</span>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="empty-hint">Obat "{search}" tidak ditemukan.</p>
      )}

      {grouped.map(([category, list]) => (
        <div key={category} className="drug-category-group">
          <div className="drug-category-label">{category}</div>
          <div className="drug-grid">
            {list.map((drug) => (
              <button
                key={drug.id}
                className={`drug-card${isSelected(drug.id) ? ' drug-card--selected' : ''}`}
                onClick={() => handleClick(drug)}
                aria-pressed={isSelected(drug.id)}
              >
                <span className="drug-card__name">{drug.name}</span>
                <span className="drug-card__route">{drug.route}</span>
                {props.mode === 'multi' && isSelected(drug.id) && (
                  <span className="drug-card__check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
