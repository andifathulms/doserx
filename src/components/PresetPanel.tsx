import { useState, useRef } from 'react'
import { DrugGrid } from './DrugGrid'
import { DrugCalculator } from './DrugCalculator'
import { DrugPreset } from '../data/drugs'
import { CustomDrugPreset, deleteCustomDrug } from '../lib/storage'
import { scrollBehavior } from '../lib/motion'

/**
 * Drug selection for the Preset mode. Everything after a drug is chosen lives
 * in DrugCalculator, which /obat/:id renders too — one implementation of the
 * dose form, not two.
 */

interface PresetPanelProps {
  onHistoryUpdated: () => void
  customDrugs: CustomDrugPreset[]
  onCustomDrugDeleted: () => void
}

export function PresetPanel({
  onHistoryUpdated,
  customDrugs,
  onCustomDrugDeleted,
}: PresetPanelProps) {
  const [selected, setSelected] = useState<DrugPreset | null>(null)
  const [gridOpen, setGridOpen] = useState(true)
  // True only when the grid is reopened by "Ganti obat" — the initial page
  // load must NOT steal focus into search.
  const [returningToGrid, setReturningToGrid] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)
  const customListRef = useRef<HTMLDivElement>(null)

  function handleSelect(drug: DrugPreset) {
    setSelected(drug)
    setGridOpen(false)
    setReturningToGrid(false)
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' }),
    )
  }

  function handleSelectCustom(drug: CustomDrugPreset) {
    handleSelect({
      id: drug.id,
      name: drug.name,
      route: 'Oral',
      category: 'Lain-lain',
      dosePerKg: drug.dosePerKg,
      freq: drug.freq,
      maxDay: drug.maxDay,
      concentration: drug.concentration,
      note: drug.note || 'Preset kustom',
      forPuyer: false,
    })
  }

  // Reopening the grid unmounts the button that was focused. Send focus to
  // the search field rather than dropping it on <body>.
  function handleChangeDrug() {
    setGridOpen(true)
    setSelected(null)
    setReturningToGrid(true)
  }

  // Same for deleting a custom preset: focus the next one, or fall back to
  // the grid's search field when the section empties.
  function handleDeleteCustom(id: string) {
    deleteCustomDrug(id)
    onCustomDrugDeleted()
    requestAnimationFrame(() => {
      const remaining = customListRef.current?.querySelectorAll<HTMLButtonElement>(
        '.custom-drug-card__delete',
      )
      if (remaining && remaining.length > 0) {
        remaining[remaining.length - 1].focus()
        return
      }
      document.querySelector<HTMLInputElement>('.drug-search-input')?.focus()
    })
  }

  return (
    <div className="panel">
      {/* ── Drug selection ─────────────────────────────── */}
      {gridOpen ? (
        <>
          {customDrugs.length > 0 && (
            <div className="custom-drugs-section">
              <div className="drug-category-label custom-drugs-section__label">Preset Saya</div>
              <div className="drug-grid custom-drugs-grid" ref={customListRef}>
                {customDrugs.map((drug) => (
                  <div
                    key={drug.id}
                    className={`drug-card custom-drug-card${selected?.id === drug.id ? ' drug-card--selected' : ''}`}
                  >
                    <button
                      className="custom-drug-card__select"
                      onClick={() => handleSelectCustom(drug)}
                    >
                      <span className="drug-card__name">{drug.name}</span>
                      <span className="drug-card__route">
                        {drug.dosePerKg} mg/kg/hari · {drug.freq}×
                      </span>
                    </button>
                    <button
                      className="custom-drug-card__delete"
                      onClick={() => handleDeleteCustom(drug.id)}
                      aria-label={`Hapus preset ${drug.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* The "pilih obat" instruction leads the grid (see DrugGrid's lede)
              instead of trailing ~90 cards where nobody scrolled to it. */}
          <DrugGrid
            selected={selected?.id ?? null}
            onSelect={handleSelect}
            autoFocusSearch={returningToGrid}
          />
        </>
      ) : (
        selected && (
          <button className="selected-drug-bar" onClick={handleChangeDrug}>
            <div className="selected-drug-bar__info">
              <span className="selected-drug-bar__dot" data-cat={selected.category} />
              <span className="selected-drug-bar__name">{selected.name}</span>
              <span className="selected-drug-bar__route">{selected.route}</span>
            </div>
            <span className="selected-drug-bar__change">Ganti obat ↓</span>
          </button>
        )
      )}

      {/* ── Calculator ─────────────────────────────────── */}
      {selected && !gridOpen && (
        <div ref={formRef}>
          <DrugCalculator
            drug={selected}
            onHistoryUpdated={onHistoryUpdated}
            idPrefix="preset"
            autoFocusWeight
          />
        </div>
      )}
    </div>
  )
}
