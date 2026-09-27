import { useMemo } from 'react'
import { DrugCategory, DrugGroup, DrugPreset } from '../data/drugs'
import { GROUP_ORDER, groupOf, subcategoriesOf } from '../data/categories'

export interface GroupSelection {
  group: DrugGroup | null
  sub: DrugCategory | null
}

export const NO_GROUP: GroupSelection = { group: null, sub: null }

/** Applies a group (and optional sub-category) selection to a drug list. */
export function filterByGroup(drugs: DrugPreset[], sel: GroupSelection): DrugPreset[] {
  if (!sel.group) return drugs
  return drugs.filter(
    (d) => groupOf(d) === sel.group && (!sel.sub || d.category === sel.sub),
  )
}

/** Groups a list in GROUP_ORDER, dropping empty groups. */
export function groupDrugs(drugs: DrugPreset[]): [DrugGroup, DrugPreset[]][] {
  const map = new Map<DrugGroup, DrugPreset[]>()
  for (const g of GROUP_ORDER) map.set(g, [])
  for (const d of drugs) map.get(groupOf(d))?.push(d)
  return [...map.entries()].filter(([, list]) => list.length > 0)
}

interface GroupFilterProps {
  drugs: DrugPreset[]
  value: GroupSelection
  onChange: (sel: GroupSelection) => void
}

/**
 * The nine clinical groups as filter chips, plus a second row of
 * sub-category chips when the chosen group spans several (Anti-infeksi →
 * Antibiotik, Antivirus, …). Toggle buttons with aria-pressed — these are
 * filters, not tabs. The row scrolls sideways in its own container rather
 * than stretching the page (the 820px-overflow bug came from exactly this
 * kind of row).
 */
export function GroupFilter({ drugs, value, onChange }: GroupFilterProps) {
  const present = useMemo(() => {
    const set = new Set(drugs.map(groupOf))
    return GROUP_ORDER.filter((g) => set.has(g))
  }, [drugs])

  const subs = useMemo(
    () => (value.group ? subcategoriesOf(value.group, drugs) : []),
    [value.group, drugs],
  )

  return (
    <div className="group-filter">
      <div className="cat-chip-row">
        <button
          type="button"
          aria-pressed={value.group === null}
          className={`cat-chip${value.group === null ? ' cat-chip--active' : ''}`}
          onClick={() => onChange(NO_GROUP)}
        >
          Semua
        </button>
        {present.map((g) => (
          <button
            key={g}
            type="button"
            data-group={g}
            aria-pressed={value.group === g}
            className={`cat-chip${value.group === g ? ' cat-chip--active' : ''}`}
            onClick={() => onChange(value.group === g ? NO_GROUP : { group: g, sub: null })}
          >
            <span className="cat-chip__dot" aria-hidden="true" />
            {g}
          </button>
        ))}
      </div>

      {subs.length > 1 && (
        <div className="cat-chip-row cat-chip-row--sub" aria-label={`Sub-golongan ${value.group}`} role="group">
          {subs.map((c) => (
            <button
              key={c}
              type="button"
              data-group={value.group!}
              aria-pressed={value.sub === c}
              className={`cat-chip cat-chip--sub${value.sub === c ? ' cat-chip--active' : ''}`}
              onClick={() => onChange({ group: value.group, sub: value.sub === c ? null : c })}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
