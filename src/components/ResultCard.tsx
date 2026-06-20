import { useState } from 'react'
import { CalcResult } from '../lib/calculate'
import { HistoryEntry, generateId, saveEntry } from '../lib/storage'
import { DrugForm } from '../data/drugs'
import { suggestForms } from '../lib/suggest'

function buildResultText(
  drugName: string,
  weight: number,
  freq: number,
  result: CalcResult,
): string {
  const lines: string[] = [`${drugName} — ${weight} kg`]
  if (result.cappedByMaxDay) lines.push('⚠ Dosis harian dikurangi ke maksimum')
  if (result.cappedByMaxSingle) lines.push('⚠ Dosis per takaran dikurangi ke maksimum')
  lines.push(`Dosis harian : ${result.dailyDose} mg/hari`)
  lines.push(`Per dosis    : ${result.perDose} mg × ${freq}×/hari`)
  if (result.volume != null) lines.push(`Volume       : ${result.volume} mL/dosis`)
  lines.push('— DoseRx')
  return lines.join('\n')
}

interface ResultCardProps {
  result: CalcResult         // result at typical/selected dose
  resultMin?: CalcResult     // result at min dose (range low end)
  resultMax?: CalcResult     // result at max dose (range high end)
  dosePerKgMin?: number
  dosePerKgMax?: number
  drugName: string
  weight: number
  dosePerKg: number
  freq: number
  concentration?: number
  availableForms?: DrugForm[]
  onSaved: () => void
}

export function ResultCard({
  result,
  resultMin,
  resultMax,
  dosePerKgMin,
  dosePerKgMax,
  drugName,
  weight,
  dosePerKg,
  freq,
  concentration,
  availableForms,
  onSaved,
}: ResultCardProps) {
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(buildResultText(drugName, weight, freq, result))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const hasRange = resultMin != null && resultMax != null
  const suggestions = availableForms?.length
    ? suggestForms(result.perDose, availableForms)
    : []

  function handleSave() {
    const entry: HistoryEntry = {
      id: generateId(),
      timestamp: Date.now(),
      drugName,
      patientLabel: label.trim(),
      note: note.trim() || undefined,
      weight,
      dosePerKg,
      freq,
      dailyDose: result.dailyDose,
      perDose: result.perDose,
      volume: result.volume,
      concentration,
      cappedByMaxDay: result.cappedByMaxDay,
      cappedByMaxSingle: result.cappedByMaxSingle,
    }
    saveEntry(entry)
    setSaved(true)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="result-card">
      <div className="result-card__header">
        <span className="result-card__drug">{drugName}</span>
        <span className="result-card__weight">{weight} kg</span>
      </div>

      {(result.cappedByMaxDay || result.cappedByMaxSingle) && (
        <div className="result-card__warning">
          {result.cappedByMaxDay && (
            <p>Daily dose capped at maximum ({result.dailyDose} mg/day).</p>
          )}
          {result.cappedByMaxSingle && (
            <p>Per-dose capped at maximum single dose ({result.perDose} mg/dose).</p>
          )}
        </div>
      )}

      {/* Range header when min/max provided */}
      {hasRange && dosePerKgMin != null && dosePerKgMax != null && (
        <div className="dose-range-label">
          Dose range: {dosePerKgMin}–{dosePerKgMax} mg/kg
        </div>
      )}

      {/* Main result values (at typical/selected dose) */}
      <div className="result-card__values">
        <div className="result-value">
          <span className="result-value__label">Daily dose</span>
          {hasRange ? (
            <span className="result-value__num result-value__num--range">
              {resultMin!.dailyDose}–{resultMax!.dailyDose}
            </span>
          ) : (
            <span className="result-value__num">{result.dailyDose}</span>
          )}
          <span className="result-value__unit">mg/day</span>
        </div>

        <div className="result-value result-value--highlight">
          <span className="result-value__label">Per dose</span>
          {hasRange ? (
            <span className="result-value__num result-value__num--range">
              {resultMin!.perDose}–{resultMax!.perDose}
            </span>
          ) : (
            <span className="result-value__num">{result.perDose}</span>
          )}
          <span className="result-value__unit">mg × {freq}×/day</span>
        </div>

        {(result.volume != null || (hasRange && resultMin!.volume != null)) && (
          <div className="result-value result-value--highlight">
            <span className="result-value__label">Volume</span>
            {hasRange && resultMin!.volume != null && resultMax!.volume != null ? (
              <span className="result-value__num result-value__num--range">
                {resultMin!.volume}–{resultMax!.volume}
              </span>
            ) : (
              <span className="result-value__num">{result.volume}</span>
            )}
            <span className="result-value__unit">mL</span>
          </div>
        )}
      </div>

      {/* Tablet/form suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions">
          <span className="suggestions__label">Ketersediaan obat</span>
          <div className="suggestions__list">
            {suggestions.map((s, i) => (
              <span key={i} className={`suggestion-chip${s.form === 'tablet' || s.form === 'capsule' ? ' suggestion-chip--solid' : ' suggestion-chip--liquid'}`}>
                {s.display}
                {s.actualDose !== result.perDose && (
                  <span className="suggestion-chip__actual"> = {s.actualDose} mg</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="result-card__actions">
        <button className="btn btn--ghost btn--sm" onClick={handleCopy}>
          {copied ? '✓ Disalin' : 'Salin'}
        </button>
      </div>

      <div className="result-card__save">
        <input
          className="input input--sm"
          type="text"
          placeholder="Inisial pasien (opsional)"
          value={label}
          maxLength={20}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="Patient label"
        />
        <button className="btn btn--secondary" onClick={handleSave} disabled={saved}>
          {saved ? 'Tersimpan' : 'Simpan'}
        </button>
        <textarea
          className="input input--sm result-card__note-input"
          placeholder="Catatan (opsional) — misal: hari ke-3, dosis dinaikkan"
          value={note}
          maxLength={200}
          rows={2}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Catatan"
        />
      </div>
    </div>
  )
}
