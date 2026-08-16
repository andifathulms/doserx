import { useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { CalcResult } from '../lib/calculate'
import { HistoryEntry, generateId, saveEntry } from '../lib/storage'
import { DrugForm } from '../data/drugs'
import { describeForms, FormDoseLine } from '../lib/suggest'
import { DerivationChain } from './DerivationChain'

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
  source: string | undefined,
): string {
  const lines: string[] = [`${drugName} — ${weight} kg`]
  if (result.cappedByMaxDay) lines.push('⚠ Dosis harian dikurangi ke maksimum')
  if (result.cappedByMaxSingle) lines.push('⚠ Dosis per kali dikurangi ke maksimum')
  lines.push(`Dosis/kali : ${result.perDose} mg · ${freqText(freq, freqMax)}`)
  lines.push(`Dosis/hari : ${result.dailyDose} mg`)
  for (const l of formLines) {
    lines.push(`  ${l.name}: ${l.range ?? l.value} ${l.unit}/kali`)
  }
  // The citation travels with the number — a pasted dose with no provenance is
  // exactly the untraceable figure this app refuses to produce.
  if (source) lines.push(`Acuan dosis: ${source}`)
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
  /** Dosing reference for this drug (IDAI, BNFc, Fornas, …). Absent for
   *  user-authored presets, where there is nothing to cite. */
  source?: string
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
  freqMax,
  concentration,
  availableForms,
  source,
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

  // Only 37 of the catalog's drugs carry a stock concentration, so for the rest
  // the mL line simply never appeared — the app looked broken at the moment it
  // was being most correct. Ask only where a volume is actually meaningful: the
  // drug comes as a liquid AND no per-preparation mL line already covers it.
  const hasLiquidForm = !!availableForms?.some((f) =>
    f.form === 'syrup' || f.form === 'drop' || f.form === 'vial' ||
    f.form === 'ampoule' || f.form === 'nebule',
  )
  const volumeCoveredByForms = formLines.some((l) => l.kind === 'liquid')
  const needsConcentration =
    result.volume == null &&
    !volumeCoveredByForms &&
    (hasLiquidForm || !availableForms?.length)

  function handleCopy() {
    navigator.clipboard
      .writeText(buildResultText(drugName, weight, freq, freqMax, result, formLines, source))
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
        <h2 className="result-card__drug">{drugName}</h2>
        <span className="result-card__weight">{weight} kg</span>
      </div>

      {/* Provenance where the claim is made, not three taps away in the
          monograph. This is what makes "calculation aid, not decision support"
          an honest position rather than a defensive one. */}
      {source && (
        <p className="result-card__source">
          Acuan dosis <strong>{source}</strong>
        </p>
      )}

      {/* A cap is not a footnote: it is where the published rule stops scaling
          with weight. Showing the figure it replaced, and the weight where it
          starts binding, is the difference between "capped" and "this patient
          is now on a fixed adult ceiling". */}
      {(result.cappedByMaxDay || result.cappedByMaxSingle) && (
        <div className="result-card__warning">
          {result.cappedByMaxDay && (
            <p>
              Dosis harian dibatasi ke maksimum:{' '}
              <span className="cap-was">{result.uncappedDailyDose} mg/hari</span>{' '}
              → <strong>{result.dailyDose} mg/hari</strong>.
            </p>
          )}
          {result.cappedByMaxSingle && (
            <p>
              Dosis per kali dibatasi ke maksimum:{' '}
              <span className="cap-was">{result.uncappedPerDose} mg/kali</span>{' '}
              → <strong>{result.perDose} mg/kali</strong>.
            </p>
          )}
          {/* Whose ceiling, and why a weight-linear rule has one at all. The
              card cited its source generally; the rule that actually fired
              was unattributed at the moment it fired. */}
          <p className="result-card__cap-why">
            Batas ini bukan hitungan dari berat badan — ini angka maksimum tetap
            {source ? ` menurut ${source}` : ''}, di atasnya dosis tidak lagi dianggap
            aman meski berat pasien terus naik.
          </p>
          {result.capFromWeightKg != null && (
            <p className="result-card__crossover">
              Pada {dosePerKg} mg/kg/hari, batas ini berlaku sejak{' '}
              <strong>{result.capFromWeightKg} kg</strong> — di atas berat itu dosis tidak
              lagi mengikuti berat badan.
            </p>
          )}
        </div>
      )}

      {/* Not capped, but the ceiling is knowable — say where it starts. */}
      {!result.cappedByMaxDay && !result.cappedByMaxSingle && result.capFromWeightKg != null && (
        <p className="result-card__headroom">
          Masih mengikuti berat badan. Dosis maksimum mulai berlaku di{' '}
          <strong>{result.capFromWeightKg} kg</strong> pada {dosePerKg} mg/kg/hari.
        </p>
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

        {needsConcentration && (
          <div className="result-value result-value--pending">
            <span className="result-value__label">Volume / kali</span>
            <span className="result-value__num result-value__num--pending">—</span>
            <span className="result-value__unit">belum bisa dihitung</span>
          </div>
        )}
      </div>

      <DerivationChain
        steps={result.steps}
        pendingNote={needsConcentration ? 'volume belum bisa dihitung' : undefined}
      />

      {/* The app cannot know this number: concentration is a property of the
          vial in her hand, not of the drug. Saying so is the difference
          between a tool that looks broken and one that is being honest. */}
      {needsConcentration && (
        <p className="result-card__pending-hint">
          Isi <strong>konsentrasi stok (mg/mL)</strong> pada form di atas untuk mendapat volume.
          Nilainya tergantung sediaan yang ada di tangan Anda — beda merek atau batch bisa
          beda, jadi tidak disimpan di katalog.
        </p>
      )}

      {/* Where the range comes from. These two values were passed in and never
          rendered, so a range appeared on screen with no stated origin — and
          vanished without explanation as soon as the dose was overridden. */}
      {hasRange && dosePerKgMin != null && dosePerKgMax != null && (
        <p className="dose-range-label">
          Rentang berasal dari dosis <strong>{dosePerKgMin}–{dosePerKgMax} mg/kg/hari</strong>
          {source ? ` menurut ${source}` : ''} — bukan batas aman, melainkan rentang
          yang dipublikasikan. Ubah angka dosis dan hasil kembali jadi satu nilai.
        </p>
      )}

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
                {/* Every figure above this line is exact. A tablet can only be
                    split into practical fractions, so this step approximates —
                    and it is the only step that reaches the patient. Say what
                    is actually delivered and by how much it misses. */}
                {l.deliveredMg != null && l.deltaMg != null && !l.range && (
                  <span
                    className={`form-dose__delivered${
                      Math.abs(l.deltaMg) >= 0.01 ? ' form-dose__delivered--off' : ''
                    }`}
                  >
                    = {l.deliveredMg} mg
                    {Math.abs(l.deltaMg) >= 0.01 && (
                      <>
                        {' '}({l.deltaMg > 0 ? '+' : '−'}
                        {Math.abs(l.deltaMg)} mg dari {result.perDose})
                      </>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="form-doses__note">
            Takaran padat dibulatkan ke pecahan yang bisa dibelah (¼, ½, ¾, 1…),
            jadi dosis yang benar-benar diberikan bisa sedikit di atas atau di bawah
            hasil hitung. Cairan diukur langsung, tanpa pembulatan.
          </p>
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
          {copied ? <><CheckIcon width="1em" height="1em" aria-hidden="true" /> Disalin</> : 'Salin'}
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
