import { useState } from 'react'
import { CalcResult } from '../lib/calculate'
import { HistoryEntry, generateId, saveEntry } from '../lib/storage'
import { DrugForm } from '../data/drugs'
import { describeForms, FormDoseLine } from '../lib/suggest'

function freqText(freq: number, freqMax?: number): string {
  return freqMax && freqMax !== freq ? `${freq}–${freqMax}×/hari` : `${freq}×/hari`
}

function buildResultText(
  drugName: string,
  weight: number,
  freq: number,
  freqMax: number | undefined,
  result: CalcResult,
  formLines: FormDoseLine[],
): string {
  const lines: string[] = [`${drugName} — ${weight} kg`]
  if (result.cappedByMaxDay) lines.push('⚠ Dosis harian dikurangi ke maksimum')
  if (result.cappedByMaxSingle) lines.push('⚠ Dosis per kali dikurangi ke maksimum')
  lines.push(`Dosis/kali : ${result.perDose} mg · ${freqText(freq, freqMax)}`)
  lines.push(`Dosis/hari : ${result.dailyDose} mg`)
  for (const l of formLines) {
    lines.push(`  ${l.name}: ${l.range ?? l.value} ${l.unit}/kali`)
  }
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
  freqMax?: number
  concentration?: number
  availableForms?: DrugForm[]
  onSaved: () => void
}

export function ResultCard({
  result,
  resultMin,
  resultMax,
  drugName,
  weight,
  dosePerKg,
  freq,
  freqMax,
  concentration,
  availableForms,
  onSaved,
}: ResultCardProps) {
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasRange = resultMin != null && resultMax != null
  const formLines = availableForms?.length
    ? describeForms(availableForms, result.perDose, resultMin?.perDose, resultMax?.perDose)
    : []

  function handleCopy() {
    navigator.clipboard.writeText(buildResultText(drugName, weight, freq, freqMax, result, formLines))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

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
            <p>Dosis harian dibatasi ke maksimum ({result.dailyDose} mg/hari).</p>
          )}
          {result.cappedByMaxSingle && (
            <p>Dosis per kali dibatasi ke maksimum ({result.perDose} mg/kali).</p>
          )}
        </div>
      )}

      {/* Main result values. Per-kali (per dose) is the primary number —
          it's how clinicians prescribe. Daily total is shown as context. */}
      <div className="result-card__values">
        <div className="result-value result-value--highlight">
          <span className="result-value__label">Dosis / kali</span>
          {hasRange ? (
            <span className="result-value__num result-value__num--range">
              {resultMin!.perDose}–{resultMax!.perDose}
            </span>
          ) : (
            <span className="result-value__num">{result.perDose}</span>
          )}
          <span className="result-value__unit">mg · {freqText(freq, freqMax)}</span>
        </div>

        <div className="result-value">
          <span className="result-value__label">Dosis / hari</span>
          {hasRange ? (
            <span className="result-value__num result-value__num--range">
              {resultMin!.dailyDose}–{resultMax!.dailyDose}
            </span>
          ) : (
            <span className="result-value__num">{result.dailyDose}</span>
          )}
          <span className="result-value__unit">mg/hari</span>
        </div>

        {(result.volume != null || (hasRange && resultMin!.volume != null)) && (
          <div className="result-value result-value--highlight">
            <span className="result-value__label">Volume / kali</span>
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

      {/* Per-preparation takaran — how much of each available form, per kali */}
      {formLines.length > 0 && (
        <div className="form-doses">
          <span className="form-doses__label">Takaran per sediaan · per kali</span>
          <ul className="form-doses__list">
            {formLines.map((l) => (
              <li key={l.key} className={`form-dose form-dose--${l.kind}`}>
                <span className="form-dose__name">{l.name}</span>
                <span className="form-dose__amt">
                  <strong>{l.range ?? l.value}</strong> {l.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── The working ──────────────────────────────────────────────────────
          Collapsed by default: she does not need it every time, but when a
          number looks wrong the alternative is redoing the arithmetic on
          paper — the exact thing this app exists to remove. Every line comes
          from calculate(), so it cannot drift from what was computed. */}
      <details className="derivation">
        <summary className="derivation__summary">Cara hitung</summary>
        <div className="derivation__body">
          <p className="derivation__basis">
            Dihitung dari <strong>{dosePerKg} mg/kg/hari</strong> — dosis total sehari,
            lalu dibagi frekuensi.
          </p>
          <ol className="derivation__steps">
            {result.steps.map((step, i) => (
              <li
                key={`${step.kind}-${i}`}
                className={`derivation__step${
                  step.kind === 'capDay' || step.kind === 'capSingle'
                    ? ' derivation__step--cap'
                    : ''
                }`}
              >
                <span className="derivation__expr">{step.expression}</span>
                <span className="derivation__eq" aria-hidden="true">=</span>
                <span className="derivation__result">{step.result}</span>
              </li>
            ))}
          </ol>
          {hasRange && (
            <p className="derivation__note">
              Angka di atas memakai dosis tipikal. Rentang yang ditampilkan berasal dari
              dosis minimum dan maksimum yang tercatat untuk obat ini.
            </p>
          )}
        </div>
      </details>

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
