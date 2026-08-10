import { useState, useRef } from 'react'
import { ALL_DRUGS, DrugPreset } from '../data/drugs'
import { DrugGrid } from './DrugGrid'
import { calculate, CalcResult } from '../lib/calculate'
import { suggestForms, FormSuggestion } from '../lib/suggest'
import { DoseMode, loadDoseMode, saveDoseMode } from '../lib/storage'
import { scrollBehavior } from '../lib/motion'

interface PuyerEntry {
  drug: DrugPreset
  dosePerKg: string // value in the active doseMode (per kali / per hari)
  freq: string
  result: CalcResult | null
  suggestions: FormSuggestion[]
}

const r2 = (n: number) => Math.round(n * 100) / 100

// The catalog stores mg/kg/DAY; translate to/from the doctor's entry mode.
function dayToMode(perDay: number | undefined, freq: number, mode: DoseMode): number | undefined {
  if (perDay == null) return undefined
  return mode === 'perDose' ? r2(perDay / freq) : perDay
}
function modeToDay(value: number, freq: number, mode: DoseMode): number {
  return mode === 'perDose' ? value * freq : value
}

function makeEntry(drug: DrugPreset, mode: DoseMode): PuyerEntry {
  return {
    drug,
    dosePerKg: String(dayToMode(drug.dosePerKg, drug.freq, mode)),
    freq: String(drug.freq),
    result: null,
    suggestions: [],
  }
}

function freqLabel(freq: number): string {
  const map: Record<number, string> = { 1: '1×1', 2: '2×1', 3: '3×1', 4: '4×1', 6: '6×1' }
  return map[freq] ?? `${freq}×/hari`
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

function formatQty(n: number, unit: string): string {
  const FRAC: Record<number, string> = {
    0.25: '¼', 0.5: '½', 0.75: '¾',
    1: '1', 1.5: '1½', 2: '2', 2.5: '2½', 3: '3', 4: '4',
  }
  // whole numbers
  if (Number.isInteger(n)) return `${n} ${unit}`
  // common fractions
  const floor = Math.floor(n)
  const frac = round2(n - floor)
  const fracStr = FRAC[frac]
  if (fracStr) return floor > 0 ? `${floor}${fracStr} ${unit}` : `${fracStr} ${unit}`
  return `${n} ${unit}`
}

function buildRecipeText(
  orderedEntries: PuyerEntry[],
  weight: string,
  numDays: number,
): string {
  const lines: string[] = [`RESEP PUYER — ${weight} kg, ${numDays} hari`, '─'.repeat(36)]
  for (const entry of orderedEntries) {
    if (!entry.result) continue
    const freq = parseFloat(entry.freq)
    const totalBungkus = freq * numDays
    lines.push(entry.drug.name)
    lines.push(`  ${entry.result.perDose} mg/dosis · ${freqLabel(freq)} · ${totalBungkus} bungkus`)
    const solidS = entry.suggestions.filter((s) => s.form === 'tablet' || s.form === 'capsule')
    for (const s of solidS) {
      const totalUnits = round2((entry.result.perDose * totalBungkus) / s.strength)
      const unit = s.form === 'capsule' ? 'kap' : 'tab'
      lines.push(`  → ${s.display} × ${totalBungkus} bungkus = ${formatQty(totalUnits, unit)}`)
    }
    const liquidS = entry.suggestions.filter((s) => s.form === 'syrup' || s.form === 'drop')
    for (const s of liquidS) {
      const totalMl = round2((entry.result.perDose * totalBungkus) / s.strength)
      lines.push(`  → ${s.display} × ${totalBungkus} bungkus = ${totalMl} mL`)
    }
  }
  lines.push('─'.repeat(36))
  lines.push('Dibuat dengan DoseRx — hanya untuk referensi.')
  return lines.join('\n')
}

function buildRecipePrintHtml(
  orderedEntries: PuyerEntry[],
  weight: string,
  numDays: number,
): string {
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const drugsHtml = orderedEntries.map((entry) => {
    if (!entry.result) return ''
    const freq = parseFloat(entry.freq)
    const totalBungkus = freq * numDays
    const solidS = entry.suggestions.filter((s) => s.form === 'tablet' || s.form === 'capsule')
    const liquidS = entry.suggestions.filter((s) => s.form === 'syrup' || s.form === 'drop')
    const formsHtml = [
      ...solidS.map((s) => {
        const total = round2((entry.result!.perDose * totalBungkus) / s.strength)
        const unit = s.form === 'capsule' ? 'kap' : 'tab'
        return `<div class="form-line">→ ${s.display} × ${totalBungkus} bungkus = <strong>${formatQty(total, unit)}</strong></div>`
      }),
      ...liquidS.map((s) => {
        const total = round2((entry.result!.perDose * totalBungkus) / s.strength)
        return `<div class="form-line">→ ${s.display} × ${totalBungkus} bungkus = <strong>${total} mL</strong></div>`
      }),
    ].join('')
    return `
      <div class="drug">
        <div class="drug-name">${entry.drug.name}</div>
        <div class="dose-line">${entry.result.perDose} mg/dosis · ${freqLabel(freq)} · ${totalBungkus} bungkus</div>
        ${formsHtml}
      </div>`
  }).join('')

  return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
<title>Resep Puyer — DoseRx</title>
<style>
  body{font-family:system-ui,sans-serif;padding:24px;color:#1e293b;max-width:520px}
  h1{font-size:1.1rem;font-weight:700;margin-bottom:2px}
  .meta{color:#64748b;font-size:.85rem;margin-bottom:16px}
  .drug{margin-bottom:10px;border-top:1px solid #e2e8f0;padding-top:10px}
  .drug-name{font-weight:600}
  .dose-line{color:#475569;font-size:.875rem;margin:2px 0}
  .form-line{font-size:.85rem;color:#334155;margin:2px 0 2px 10px}
  .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:.75rem;color:#94a3b8}
</style>
</head><body>
<h1>Resep Puyer</h1>
<div class="meta">${weight} kg &middot; ${numDays} hari &middot; ${date}</div>
${drugsHtml}
<div class="footer">Dibuat dengan DoseRx &mdash; Hanya untuk referensi kalkulasi. Verifikasi terhadap panduan klinis sebelum digunakan.</div>
</body></html>`
}

interface PuyerPanelProps {
  onHistoryUpdated: () => void
}

export function PuyerPanel({ onHistoryUpdated: _onHistoryUpdated }: PuyerPanelProps) {
  const [weight, setWeight] = useState('')
  const [days, setDays] = useState('3')
  const [doseMode, setDoseMode] = useState<DoseMode>(() => loadDoseMode())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [entries, setEntries] = useState<Record<string, PuyerEntry>>({})
  const [gridOpen, setGridOpen] = useState(true)
  const [calculated, setCalculated] = useState(false)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // True only when the grid is reopened by "Ubah pilihan" — the initial page
  // load must NOT steal focus into search.
  const [returningToGrid, setReturningToGrid] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)

  const doseUnit = doseMode === 'perDose' ? 'mg/kg/kali' : 'mg/kg/hari'

  function handleToggle(drug: DrugPreset) {
    setCalculated(false)
    setSelectedIds((prev) => {
      if (prev.includes(drug.id)) return prev.filter((id) => id !== drug.id)
      setEntries((e) => ({ ...e, [drug.id]: e[drug.id] ?? makeEntry(drug, doseMode) }))
      return [...prev, drug.id]
    })
  }

  function handleToggleMode(mode: DoseMode) {
    if (mode === doseMode) return
    setEntries((prev) => {
      const next: Record<string, PuyerEntry> = {}
      for (const [id, e] of Object.entries(prev)) {
        const f = parseFloat(e.freq)
        const val = parseFloat(e.dosePerKg)
        const dosePerKg =
          isFinite(val) && isFinite(f) && f > 0
            ? String(dayToMode(modeToDay(val, f, doseMode), f, mode))
            : String(dayToMode(e.drug.dosePerKg, e.drug.freq, mode))
        next[id] = { ...e, dosePerKg, result: null, suggestions: [] }
      }
      return next
    })
    setDoseMode(mode)
    saveDoseMode(mode)
    setCalculated(false)
  }

  function handleProceed() {
    setGridOpen(false)
    setReturningToGrid(false)
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' })
    )
  }

  // Reopening the grid unmounts the focused button; send focus to search.
  function handleChangeSelection() {
    setGridOpen(true)
    setReturningToGrid(true)
    setCalculated(false)
  }

  function updateEntry(id: string, patch: Partial<Pick<PuyerEntry, 'dosePerKg' | 'freq'>>) {
    setCalculated(false)
    setEntries((prev) => ({ ...prev, [id]: { ...prev[id], ...patch, result: null, suggestions: [] } }))
  }

  function resetDose(id: string) {
    const drug = entries[id]?.drug
    if (!drug) return
    updateEntry(id, { dosePerKg: String(dayToMode(drug.dosePerKg, drug.freq, doseMode)) })
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
      const fq = parseFloat(entry.freq)
      const out = calculate({
        weight: w,
        dosePerKg: modeToDay(parseFloat(entry.dosePerKg), fq, doseMode),
        freq: fq,
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
  const numDays = Math.max(1, parseInt(days) || 1)

  function handleCopyRecipe() {
    navigator.clipboard.writeText(buildRecipeText(orderedEntries, weight, numDays))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function handlePrintRecipe() {
    const popup = window.open('', '_blank', 'width=600,height=700')
    if (!popup) return
    popup.document.write(buildRecipePrintHtml(orderedEntries, weight, numDays))
    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <div className="panel">
      {/* Mode description now lives on the tab control (see App.tsx TABS). */}
      {/* ── Drug selection grid ────────────────────────── */}
      {gridOpen ? (
        <div className="puyer-grid-section">
          <DrugGrid
            mode="multi"
            drugs={ALL_DRUGS}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            autoFocusSearch={returningToGrid}
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

      {/* ── Form section ───────────────────────────────── */}
      {!gridOpen && (
        <div ref={formRef}>

          {/* Weight + days row */}
          <div className="puyer-meta-row">
            <div className="field">
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
              {/* role="alert": validation failure announced without moving focus. */}
              {weightError && <p className="error" role="alert" style={{ marginTop: 4 }}>{weightError}</p>}
            </div>
            <div className="field">
              <label className="label" htmlFor="puyer-days">Jumlah hari</label>
              <input
                id="puyer-days"
                className="input"
                type="number"
                min="1"
                step="1"
                value={days}
                onChange={(e) => { setDays(e.target.value); setCalculated(false) }}
              />
            </div>
          </div>

          {/* Dose entry mode — puyer content per bungkus = per kali */}
          <div className="dose-mode">
            <span className="dose-mode__label">Cara hitung dosis</span>
            {/* Real radios: the browser supplies arrow-key selection, the
                grouping (shared name) and the checked state for free. The
                previous role="radio" buttons promised all three and delivered
                none of them. */}
            <div className="dose-mode__toggle">
              <input
                type="radio"
                id="puyer-mode-perdose"
                name="puyer-dose-mode"
                className="sr-only dose-mode__input"
                checked={doseMode === 'perDose'}
                onChange={() => handleToggleMode('perDose')}
              />
              <label className="dose-mode__btn" htmlFor="puyer-mode-perdose">Per kali</label>
              <input
                type="radio"
                id="puyer-mode-perday"
                name="puyer-dose-mode"
                className="sr-only dose-mode__input"
                checked={doseMode === 'perDay'}
                onChange={() => handleToggleMode('perDay')}
              />
              <label className="dose-mode__btn" htmlFor="puyer-mode-perday">Per hari</label>
            </div>
          </div>

          {/* Per-drug dose overrides */}
          <div className="puyer-section-label">Sesuaikan dosis (opsional)</div>
          <div className="puyer-drug-list">
            {orderedEntries.map((entry) => {
              const defaultDose = dayToMode(entry.drug.dosePerKg, entry.drug.freq, doseMode)!
              const isOverridden = entry.dosePerKg !== String(defaultDose)
              const rMin = dayToMode(entry.drug.dosePerKgMin, entry.drug.freq, doseMode)
              const rMax = dayToMode(entry.drug.dosePerKgMax, entry.drug.freq, doseMode)
              return (
                <div key={entry.drug.id} className="puyer-drug-row">
                  <div className="puyer-drug-row__header">
                    <span className="puyer-drug-row__name">{entry.drug.name}</span>
                    {isOverridden && (
                      <span className="override-badge">diubah</span>
                    )}
                  </div>
                  <div className="puyer-drug-row__inputs">
                    <div className="field">
                      <div className="label-row">
                        <label className="label">{doseUnit}</label>
                        {isOverridden && (
                          <button
                            className="reset-btn"
                            onClick={() => resetDose(entry.drug.id)}
                            aria-label={`Reset dosis ${entry.drug.name} ke ${defaultDose} ${doseUnit}`}
                          >
                            <span aria-hidden="true">↺ {defaultDose}</span>
                          </button>
                        )}
                      </div>
                      <input
                        className={`input input--sm${isOverridden ? ' input--overridden' : ''}`}
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
                    {rMin != null && rMax != null && (
                      <span className="puyer-dose-range">
                        [{rMin}–{rMax}]
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button className="btn btn--primary" onClick={handleCalculate}>
            Hitung Puyer
          </button>

          {/* Mounted before the recipe exists, so the announcement fires on
              text change rather than on insertion. */}
          <p className="sr-only" role="status">
            {allCalculated
              ? `Resep puyer siap: ${orderedEntries.length} obat, ${weight} kilogram, ${numDays} hari.`
              : ''}
          </p>

          {/* ── Recipe card ───────────────────────────────── */}
          {allCalculated && (
            <div className="puyer-recipe">
              <div className="puyer-recipe__header">
                <span className="puyer-recipe__title">Resep Puyer</span>
                <div className="puyer-recipe__meta">
                  <span className="puyer-recipe__weight">{weight} kg</span>
                  <span className="puyer-recipe__days">{numDays} hari</span>
                </div>
              </div>

              <ul className="puyer-recipe__list">
                {orderedEntries.map((entry) => {
                  if (!entry.result) return null
                  const freq = parseFloat(entry.freq)
                  const totalBungkus = freq * numDays
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
                        <span className="puyer-recipe__freq">{freqLabel(freq)}</span>
                        {(entry.result.cappedByMaxDay || entry.result.cappedByMaxSingle) && (
                          <span className="badge badge--warn">cap</span>
                        )}
                      </div>

                      {solidS.length > 0 && (
                        <div className="puyer-recipe__forms-block">
                          {solidS.map((s, i) => {
                            // Total tabs = exact mg needed ÷ tablet strength
                            // NOT rounded-fraction × bungkus (that inflates the total)
                            const totalUnits = round2((entry.result!.perDose * totalBungkus) / s.strength)
                            const unit = s.form === 'capsule' ? 'kap' : 'tab'
                            return (
                              <div key={i} className="puyer-form-row">
                                <span className="suggestion-chip suggestion-chip--solid">{s.display}</span>
                                <span className="puyer-form-total">
                                  × {totalBungkus} bungkus = <strong>{formatQty(totalUnits, unit)}</strong>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {liquidS.length > 0 && (
                        <div className="puyer-recipe__forms-block">
                          {liquidS.map((s, i) => {
                            const totalMl = round2((entry.result!.perDose * totalBungkus) / s.strength)
                            return (
                              <div key={i} className="puyer-form-row">
                                <span className="suggestion-chip suggestion-chip--liquid">{s.display}</span>
                                <span className="puyer-form-total">
                                  × {totalBungkus} bungkus = <strong>{totalMl} mL</strong>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* ── Bungkus summary ──── */}
              <div className="puyer-recipe__bungkus-summary">
                {orderedEntries
                  .filter((e) => e.result)
                  .map((entry) => {
                    const freq = parseFloat(entry.freq)
                    const totalBungkus = freq * numDays
                    return (
                      <div key={entry.drug.id} className="puyer-bungkus-row">
                        <span className="puyer-bungkus-drug">{entry.drug.name}</span>
                        <span className="puyer-bungkus-count">
                          {freqLabel(freq)} × {numDays} hari = <strong>{totalBungkus} bungkus</strong>
                        </span>
                      </div>
                    )
                  })}
              </div>

              <div className="puyer-recipe__actions">
                <button className="btn btn--ghost btn--sm" onClick={handleCopyRecipe}>
                  {copied ? '✓ Disalin' : 'Salin Resep'}
                </button>
                <button className="btn btn--ghost btn--sm" onClick={handlePrintRecipe}>
                  Cetak
                </button>
              </div>

              <div className="puyer-recipe__footer">
                Campur semua bahan untuk tiap bungkus, berikan sesuai frekuensi masing-masing obat.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
