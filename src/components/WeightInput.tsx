import { useState } from 'react'
import { estimateWeight, WeightEstimate } from '../lib/estimateWeight'

interface WeightInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}

export function WeightInput({ id, value, onChange, autoFocus = false }: WeightInputProps) {
  const [estimating, setEstimating] = useState(false)
  const [ageYears, setAgeYears] = useState('')
  const [ageMonths, setAgeMonths] = useState('')
  const [estimated, setEstimated] = useState<WeightEstimate | null>(null)

  function handleEstimate() {
    const y = parseInt(ageYears) || 0
    const m = parseInt(ageMonths) || 0
    const e = estimateWeight(y, m)
    if (e != null) {
      setEstimated(e)
      onChange(String(e.kg))
    } else {
      setEstimated(null)
    }
  }

  function handleToggle() {
    setEstimating((v) => {
      if (v) {
        setAgeYears('')
        setAgeMonths('')
        setEstimated(null)
      }
      return !v
    })
  }

  return (
    <div className="weight-input-block">
      <div className="weight-input-row">
        <div className="field" style={{ flex: 1 }}>
          <div className="label-row">
            <label className="label" htmlFor={id}>
              Berat badan (kg)
              {estimated != null && <span className="estimate-badge">estimasi</span>}
            </label>
            <button
              type="button"
              className="estimate-toggle"
              onClick={handleToggle}
              aria-label={estimating ? 'Batal estimasi berat dari usia' : 'Estimasi berat badan dari usia'}
            >
              {estimating ? 'Batal' : 'Dari usia?'}
            </button>
          </div>
          <input
            id={id}
            className="input"
            type="number"
            min="0"
            step="0.1"
            placeholder="misal 14"
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => { onChange(e.target.value); setEstimated(null) }}
          />
        </div>
      </div>

      {estimating && (
        <div className="estimate-panel">
          <div className="estimate-panel__title">Estimasi berat badan dari usia</div>
          <div className="estimate-panel__inputs">
            <div className="field">
              <label className="label" htmlFor={`${id}-yr`}>Tahun</label>
              <input
                id={`${id}-yr`}
                className="input input--sm"
                type="number"
                min="0"
                max="17"
                step="1"
                placeholder="0"
                value={ageYears}
                onChange={(e) => { setAgeYears(e.target.value); setEstimated(null) }}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor={`${id}-mo`}>Bulan</label>
              <input
                id={`${id}-mo`}
                className="input input--sm"
                type="number"
                min="0"
                max="11"
                step="1"
                placeholder="0"
                value={ageMonths}
                onChange={(e) => { setAgeMonths(e.target.value); setEstimated(null) }}
              />
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleEstimate}
            >
              Hitung
            </button>
          </div>
          {/* The estimate replaces the weight field's value without moving
              focus, so it has to be spoken. */}
          {/* The formula, its arithmetic and its attribution — three bands use
              two different sources, and every downstream number inherits
              whichever one fired. "Perkiraan" alone was not honest about
              what is being assumed. */}
          {estimated != null && (
            <p className="estimate-panel__result" role="status">
              Estimasi: <strong>{estimated.kg} kg</strong>
              <span className="estimate-panel__working">
                {' '}= {estimated.expression} · {estimated.formula}
              </span>
              <span className="estimate-panel__formula">
                Rata-rata populasi menurut usia — tidak memperhitungkan status gizi,
                jadi cenderung terlalu tinggi pada anak kurus dan terlalu rendah pada anak
                gemuk. Semua hasil hitung di bawah ikut memakai angka ini; timbang bila
                memungkinkan.
              </span>
            </p>
          )}
          {(ageYears || ageMonths) && estimated == null && (
            <p className="estimate-panel__result estimate-panel__result--warn" role="alert">
              Usia tidak valid atau ≥18 tahun — masukkan berat manual.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
