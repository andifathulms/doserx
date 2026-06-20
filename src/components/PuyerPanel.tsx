import { useState, useRef } from 'react'
import { ALL_DRUGS, DrugPreset } from '../data/drugs'
import { DrugGrid } from './DrugGrid'
import { calculate, CalcResult } from '../lib/calculate'
import { suggestForms, FormSuggestion } from '../lib/suggest'

interface PuyerEntry {
  drug: DrugPreset
  dosePerKg: string
  freq: string
  result: CalcResult | null
  suggestions: FormSuggestion[]
}

function makeEntry(drug: DrugPreset): PuyerEntry {
  return { drug, dosePerKg: String(drug.dosePerKg), freq: String(drug.freq), result: null, suggestions: [] }
}

function freqLabel(freq: number): string {
  const map: Record<number, string> = { 1: '1×1', 2: '2×1', 3: '3×1', 4: '4×1', 6: '6×1' }
  return map[freq] ?? `${freq}×/hari`
}

interface PuyerPanelProps {
  onHistoryUpdated: () => void
}

export function PuyerPanel({ onHistoryUpdated: _onHistoryUpdated }: PuyerPanelProps) {
  const [weight, setWeight] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [entries, setEntries] = useState<Record<string, PuyerEntry>>({})
  const [gridOpen, setGridOpen] = useState(true)
  const [calculated, setCalculated] = useState(false)
  const [weightError, setWeightError] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)

  function handleToggle(drug: DrugPreset) {
    setCalculated(false)
    setSelectedIds((prev) => {
      if (prev.includes(drug.id)) return prev.filter((id) => id !== drug.id)
      setEntries((e) => ({ ...e, [drug.id]: e[drug.id] ?? makeEntry(drug) }))
      return [...prev, drug.id]
    })
  }

  function handleProceed() {
    setGridOpen(false)
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    )
  }

  function handleChangeSelection() {
    setGridOpen(true)
    setCalculated(false)
  }

  function updateEntry(id: string, patch: Partial<Pick<PuyerEntry, 'dosePerKg' | 'freq'>>) {
    setCalculated(false)
    setEntries((prev) => ({ ...prev, [id]: { ...prev[id], ...patch, result: null, suggestions: [] } }))
  }

  function handleCalculate() {
    const w = parseFloat(weight)
    if (!isFinite(w) || w <= 0) {
      setWeightError('Masukkan berat badan yang valid.')
      return
    }
    setWeightError(null)

    const updated: Record<string, PuyerEntry> = {}
    for (const id of selectedIds) {
      const entry = entries[id]
      if (!entry) continue
      const out = calculate({
        weight: w,
        dosePerKg: parseFloat(entry.dosePerKg),
        freq: parseFloat(entry.freq),
        maxDay: entry.drug.maxDay,
        maxSingle: entry.drug.maxSingle,
      })
      const result = out.valid ? out : null
      const suggestions = result && entry.drug.availableForms
        ? suggestForms(result.perDose, entry.drug.availableForms)
        : []
      updated[id] = { ...entry, result, suggestions }
    }
    setEntries((prev) => ({ ...prev, ...updated }))
    setCalculated(true)
  }

  const orderedEntries = selectedIds.map((id) => entries[id]).filter(Boolean)
  const allCalculated = calculated && orderedEntries.every((e) => e.result !== null)

  return (
    <div className="panel">
      <p className="puyer-intro">
        Pilih 2+ obat, masukkan berat badan, lalu hitung resep puyer sekaligus.
      </p>

      {/* ── Drug selection grid ────────────────────────── */}
      {gridOpen ? (
        <div className="puyer-grid-section">
          <DrugGrid
            mode="multi"
            drugs={ALL_DRUGS}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />

          {selectedIds.length > 0 && (
            <button className="btn btn--primary puyer-proceed-btn" onClick={handleProceed}>
              Lanjut dengan {selectedIds.length} obat →
            </button>
          )}

          {selectedIds.length === 0 && (
            <p className="empty-hint" style={{ marginTop: 4 }}>
              Pilih minimal 2 obat untuk membuat resep puyer.
            </p>
          )}
        </div>
      ) : (
        /* ── Collapsed selection summary ────────────────── */
        <div className="selected-drugs-summary">
          <div className="selected-drugs-summary__chips">
            {orderedEntries.map((e) => (
              <span key={e.drug.id} className="drug-chip" data-cat={e.drug.category}>
                {e.drug.name}
              </span>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={handleChangeSelection}>
            Ubah pilihan ↓
          </button>
        </div>
      )}

      {/* ── Form section (visible once grid is collapsed) ── */}
      {!gridOpen && (
        <div ref={formRef}>
          <div className="puyer-weight" style={{ marginTop: 20 }}>
            <label className="label" htmlFor="puyer-weight">Berat badan (kg)</label>
            <input
              id="puyer-weight"
              className="input"
              type="number"
              min="0"
              step="0.1"
              placeholder="misal 14"
              autoFocus
              value={weight}
              onChange={(e) => { setWeight(e.target.value); setCalculated(false) }}
            />
            {weightError && <p className="error" style={{ marginTop: 4 }}>{weightError}</p>}
          </div>

          <div className="puyer-section-label">Sesuaikan dosis (opsional)</div>
          <div className="puyer-drug-list">
            {orderedEntries.map((entry) => (
              <div key={entry.drug.id} className="puyer-drug-row">
                <span className="puyer-drug-row__name">{entry.drug.name}</span>
                <div className="puyer-drug-row__inputs">
                  <div className="field">
                    <label className="label">mg/kg</label>
                    <input
                      className="input input--sm"
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.dosePerKg}
                      onChange={(e) => updateEntry(entry.drug.id, { dosePerKg: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="label">×/hari</label>
                    <input
                      className="input input--sm"
                      type="number"
                      min="1"
                      step="1"
                      value={entry.freq}
                      onChange={(e) => updateEntry(entry.drug.id, { freq: e.target.value })}
                    />
                  </div>
                  {entry.drug.dosePerKgMin != null && entry.drug.dosePerKgMax != null && (
                    <span className="puyer-dose-range">
                      [{entry.drug.dosePerKgMin}–{entry.drug.dosePerKgMax}]
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn--primary" onClick={handleCalculate}>
            Hitung Puyer
          </button>

          {/* ── Recipe card ───────────────────────────────── */}
          {allCalculated && (
            <div className="puyer-recipe">
              <div className="puyer-recipe__header">
                <span className="puyer-recipe__title">Resep Puyer</span>
                <span className="puyer-recipe__weight">{weight} kg</span>
              </div>
              <ul className="puyer-recipe__list">
                {orderedEntries.map((entry) => {
                  if (!entry.result) return null
                  const solidS = entry.suggestions.filter(
                    (s) => s.form === 'tablet' || s.form === 'capsule',
                  )
                  const liquidS = entry.suggestions.filter(
                    (s) => s.form === 'syrup' || s.form === 'drop',
                  )
                  return (
                    <li key={entry.drug.id} className="puyer-recipe__item">
                      <div className="puyer-recipe__drug-name">{entry.drug.name}</div>
                      <div className="puyer-recipe__dose-line">
                        <span className="puyer-recipe__perdose">{entry.result.perDose} mg/dosis</span>
                        <span className="puyer-recipe__freq">{freqLabel(parseFloat(entry.freq))}</span>
                        {(entry.result.cappedByMaxDay || entry.result.cappedByMaxSingle) && (
                          <span className="badge badge--warn">cap</span>
                        )}
                      </div>
                      {solidS.length > 0 && (
                        <div className="puyer-recipe__forms">
                          {solidS.map((s, i) => (
                            <span key={i} className="suggestion-chip suggestion-chip--solid">{s.display}</span>
                          ))}
                        </div>
                      )}
                      {liquidS.length > 0 && (
                        <div className="puyer-recipe__forms">
                          {liquidS.map((s, i) => (
                            <span key={i} className="suggestion-chip suggestion-chip--liquid">{s.display}</span>
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
              <div className="puyer-recipe__footer">
                Campur semua bahan untuk tiap dosis, berikan sesuai frekuensi masing-masing obat.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
