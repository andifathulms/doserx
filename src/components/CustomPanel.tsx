import { useMemo, useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { ResultCard } from './ResultCard'
import { WeightPrompt } from './WeightPrompt'
import { calculate, CalcResult } from '../lib/calculate'
import { errorCopy } from '../lib/errorCopy'
import { announceResult, useSettled } from '../lib/announce'
import { usePatient } from '../lib/patient'
import { saveCustomDrug, generateId } from '../lib/storage'
import { isInvalidPositiveNumber } from '../lib/validateNumber'

interface CustomPanelProps {
  onHistoryUpdated: () => void
  onPresetSaved: () => void
}

export function CustomPanel({ onHistoryUpdated, onPresetSaved }: CustomPanelProps) {
  const [drugName, setDrugName] = useState('')
  const { weightKg } = usePatient()
  const [dosePerKg, setDosePerKg] = useState('')
  const [freq, setFreq] = useState('')
  const [maxDay, setMaxDay] = useState('')
  const [concentration, setConcentration] = useState('')

  const [savingPreset, setSavingPreset] = useState(false)
  const [presetNote, setPresetNote] = useState('')
  const [presetSaved, setPresetSaved] = useState(false)

  // Live once dose and frequency are filled in; before that an empty custom
  // form is not an error, just unfinished.
  const outcome = useMemo(() => {
    if (weightKg == null || !dosePerKg || !freq) return null
    return calculate({
      weight: weightKg,
      dosePerKg: parseFloat(dosePerKg),
      freq: parseFloat(freq),
      maxDay: maxDay ? parseFloat(maxDay) : undefined,
      concentration: concentration ? parseFloat(concentration) : undefined,
    })
  }, [weightKg, dosePerKg, freq, maxDay, concentration])
  const result: CalcResult | null = outcome && outcome.valid ? outcome : null
  const error = outcome && !outcome.valid ? errorCopy(outcome.error) : null
  const announcement = useSettled(
    result ? announceResult(drugName || 'Obat kustom', result, parseFloat(freq)) : '',
  )

  function canSavePreset(): boolean {
    return (
      drugName.trim().length > 0 &&
      isFinite(parseFloat(dosePerKg)) && parseFloat(dosePerKg) > 0 &&
      isFinite(parseFloat(freq)) && parseFloat(freq) > 0
    )
  }

  function handleSavePreset() {
    if (!canSavePreset()) return
    saveCustomDrug({
      id: generateId(),
      name: drugName.trim(),
      dosePerKg: parseFloat(dosePerKg),
      freq: parseFloat(freq),
      maxDay: maxDay ? parseFloat(maxDay) : undefined,
      concentration: concentration ? parseFloat(concentration) : undefined,
      note: presetNote.trim(),
      createdAt: Date.now(),
    })
    setSavingPreset(false)
    setPresetNote('')
    setPresetSaved(true)
    onPresetSaved()
    setTimeout(() => setPresetSaved(false), 2500)
  }

  return (
    <div className="panel">
      <div className="form">
        <div className="field field--full">
          <label className="label" htmlFor="custom-drug">Nama obat</label>
          <input
            id="custom-drug"
            className="input"
            type="text"
            placeholder="misal Metronidazole"
            value={drugName}
            onChange={(e) => { setDrugName(e.target.value) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-dose">Dosis (mg/kg)</label>
          <input
            id="custom-dose"
            className={`input${isInvalidPositiveNumber(dosePerKg) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="0.01"
            placeholder="misal 7.5"
            value={dosePerKg}
            aria-invalid={isInvalidPositiveNumber(dosePerKg)}
            onChange={(e) => { setDosePerKg(e.target.value) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-freq">Frekuensi/hari</label>
          <input
            id="custom-freq"
            className={`input${isInvalidPositiveNumber(freq) ? ' input--invalid' : ''}`}
            type="number"
            min="1"
            step="1"
            placeholder="misal 3"
            value={freq}
            aria-invalid={isInvalidPositiveNumber(freq)}
            onChange={(e) => { setFreq(e.target.value) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-maxday">Dosis maks/hari (mg) <span className="label--optional">opsional</span></label>
          <input
            id="custom-maxday"
            className={`input${isInvalidPositiveNumber(maxDay) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="1"
            placeholder="misal 2000"
            value={maxDay}
            aria-invalid={isInvalidPositiveNumber(maxDay)}
            onChange={(e) => { setMaxDay(e.target.value) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-conc">Konsentrasi stok (mg/mL) <span className="label--optional">opsional</span></label>
          <input
            id="custom-conc"
            className={`input${isInvalidPositiveNumber(concentration) ? ' input--invalid' : ''}`}
            type="number"
            min="0"
            step="0.1"
            placeholder="misal 50"
            value={concentration}
            aria-invalid={isInvalidPositiveNumber(concentration)}
            onChange={(e) => { setConcentration(e.target.value) }}
          />
        </div>
      </div>

      {weightKg == null && <WeightPrompt />}

      {/* role="alert" has no native equivalent: a validation failure must be
          announced without moving focus away from the field being corrected. */}
      {error && <p className="error" role="alert">{error}</p>}

      <p className="sr-only" role="status">{announcement}</p>

      {/* Save as preset */}
      {canSavePreset() && !savingPreset && (
        <div className="save-preset-row">
          {presetSaved ? (
            <span className="save-preset-confirm">
              <CheckIcon width="1em" height="1em" aria-hidden="true" /> Preset tersimpan di tab Preset
            </span>
          ) : (
            <button className="btn btn--ghost btn--sm" onClick={() => setSavingPreset(true)}>
              + Simpan sebagai preset
            </button>
          )}
        </div>
      )}

      {savingPreset && (
        <div className="save-preset-panel">
          <div className="save-preset-panel__title">Simpan "{drugName}" sebagai preset</div>
          <div className="field">
            <label className="label" htmlFor="preset-note-field">Catatan klinis <span className="label--optional">opsional</span></label>
            <input
              id="preset-note-field"
              className="input input--sm"
              type="text"
              maxLength={120}
              placeholder="misal: untuk ISK anak, 5–7 hari"
              value={presetNote}
              autoFocus
              onChange={(e) => setPresetNote(e.target.value)}
            />
          </div>
          <div className="save-preset-panel__btns">
            <button className="btn btn--secondary btn--sm" onClick={handleSavePreset}>Simpan Preset</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setSavingPreset(false)}>Batal</button>
          </div>
        </div>
      )}

      {result && weightKg != null && (
        <ResultCard
          result={result}
          drugName={drugName || 'Obat kustom'}
          weight={weightKg!}
          dosePerKg={parseFloat(dosePerKg)}
          freq={parseFloat(freq)}
          concentration={concentration ? parseFloat(concentration) : undefined}
          onSaved={onHistoryUpdated}
        />
      )}
    </div>
  )
}
