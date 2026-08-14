import { useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { ResultCard } from './ResultCard'
import { WeightInput } from './WeightInput'
import { calculate, CalcResult } from '../lib/calculate'
import { errorCopy } from '../lib/errorCopy'
import { announceResult } from '../lib/announce'
import { saveCustomDrug, generateId } from '../lib/storage'

interface CustomPanelProps {
  onHistoryUpdated: () => void
  onPresetSaved: () => void
}

export function CustomPanel({ onHistoryUpdated, onPresetSaved }: CustomPanelProps) {
  const [drugName, setDrugName] = useState('')
  const [weight, setWeight] = useState('')
  const [dosePerKg, setDosePerKg] = useState('')
  const [freq, setFreq] = useState('')
  const [maxDay, setMaxDay] = useState('')
  const [concentration, setConcentration] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [savingPreset, setSavingPreset] = useState(false)
  const [presetNote, setPresetNote] = useState('')
  const [presetSaved, setPresetSaved] = useState(false)

  function handleCalculate() {
    const out = calculate({
      weight: parseFloat(weight),
      dosePerKg: parseFloat(dosePerKg),
      freq: parseFloat(freq),
      maxDay: maxDay ? parseFloat(maxDay) : undefined,
      concentration: concentration ? parseFloat(concentration) : undefined,
    })
    if (!out.valid) {
      setError(errorCopy(out.error))
      setResult(null)
    } else {
      setError(null)
      setResult(out)
    }
  }

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
            onChange={(e) => { setDrugName(e.target.value); setResult(null) }}
          />
        </div>
        <WeightInput
          id="custom-weight"
          value={weight}
          onChange={(v) => { setWeight(v); setResult(null) }}
        />
        <div className="field">
          <label className="label" htmlFor="custom-dose">Dosis (mg/kg)</label>
          <input
            id="custom-dose"
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="misal 7.5"
            value={dosePerKg}
            onChange={(e) => { setDosePerKg(e.target.value); setResult(null) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-freq">Frekuensi/hari</label>
          <input
            id="custom-freq"
            className="input"
            type="number"
            min="1"
            step="1"
            placeholder="misal 3"
            value={freq}
            onChange={(e) => { setFreq(e.target.value); setResult(null) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-maxday">Dosis maks/hari (mg) <span className="label--optional">opsional</span></label>
          <input
            id="custom-maxday"
            className="input"
            type="number"
            min="0"
            step="1"
            placeholder="misal 2000"
            value={maxDay}
            onChange={(e) => { setMaxDay(e.target.value); setResult(null) }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="custom-conc">Konsentrasi stok (mg/mL) <span className="label--optional">opsional</span></label>
          <input
            id="custom-conc"
            className="input"
            type="number"
            min="0"
            step="0.1"
            placeholder="misal 50"
            value={concentration}
            onChange={(e) => { setConcentration(e.target.value); setResult(null) }}
          />
        </div>
      </div>

      {/* role="alert" has no native equivalent: a validation failure must be
          announced without moving focus away from the field being corrected. */}
      {error && <p className="error" role="alert">{error}</p>}

      <button className="btn btn--primary" onClick={handleCalculate}>
        Hitung
      </button>

      {/* Mounted with the form, before any result exists, so the announcement
          fires on text change rather than on insertion. */}
      <p className="sr-only" role="status">
        {result ? announceResult(drugName || 'Obat kustom', result, parseFloat(freq)) : ''}
      </p>

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

      {result && (
        <ResultCard
          result={result}
          drugName={drugName || 'Obat kustom'}
          weight={parseFloat(weight)}
          dosePerKg={parseFloat(dosePerKg)}
          freq={parseFloat(freq)}
          concentration={concentration ? parseFloat(concentration) : undefined}
          onSaved={onHistoryUpdated}
        />
      )}
    </div>
  )
}
