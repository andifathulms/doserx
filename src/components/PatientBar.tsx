import { useState } from 'react'
import { Cross2Icon, MinusIcon, PlusIcon } from '@radix-ui/react-icons'
import { usePatient } from '../lib/patient'
import { estimateWeight } from '../lib/estimateWeight'
import { isInvalidPositiveNumber } from '../lib/validateNumber'

/**
 * The patient bar — the one place the weight is entered, pinned under the
 * header on every tool screen. Everything else on those screens reads it.
 *
 * Built for one thumb: 44px steppers, a big mono field, and a clear button
 * that makes "next patient" a single tap. Steppers move 0.5 kg under 10 kg
 * (where half a kilo is a real fraction of the dose) and 1 kg above.
 */
export function PatientBar() {
  const { weight, weightKg, population, estimatedFrom, setWeight, setPopulation, clear } =
    usePatient()
  const [estimating, setEstimating] = useState(false)

  const invalid = isInvalidPositiveNumber(weight)

  function step(direction: 1 | -1) {
    const current = weightKg ?? 0
    const size = current < 10 ? 0.5 : 1
    const next = Math.max(size, Math.round((current + direction * size) / size) * size)
    setWeight(String(next))
  }

  return (
    <div className="patient-bar" role="region" aria-label="Pasien">
      <div className="patient-bar__inner">
        <div className="patient-bar__field">
          <div className="patient-bar__label-row">
            {/* "BB" is how every Indonesian chart writes berat badan; the
                full words stay for screen readers. */}
            <label className="patient-bar__label" htmlFor="patient-weight">
              <span aria-hidden="true">BB</span>
              <span className="sr-only">Berat badan pasien</span>
            </label>
            {estimatedFrom && <span className="estimate-badge">estimasi</span>}
            {population === 'anak' && (
              <button
                type="button"
                className="patient-bar__link"
                onClick={() => setEstimating((v) => !v)}
                aria-expanded={estimating}
                aria-controls="patient-estimate"
              >
                {estimating ? 'Tutup' : 'Dari usia?'}
              </button>
            )}
          </div>
          <div className={`patient-bar__input-wrap${invalid ? ' patient-bar__input-wrap--invalid' : ''}`}>
            <input
              id="patient-weight"
              className="patient-bar__input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="—"
              value={weight}
              aria-invalid={invalid}
              aria-describedby={estimatedFrom ? 'patient-estimate-note' : undefined}
              onChange={(e) => setWeight(e.target.value)}
            />
            <span className="patient-bar__unit" aria-hidden="true">kg</span>
            {weight && (
              <button
                type="button"
                className="patient-bar__clear"
                onClick={() => {
                  clear()
                  document.getElementById('patient-weight')?.focus()
                }}
                aria-label="Pasien baru — kosongkan berat"
              >
                <Cross2Icon width="14" height="14" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="patient-bar__steppers">
          <button
            type="button"
            className="patient-bar__step"
            onClick={() => step(-1)}
            disabled={weightKg == null}
            aria-label="Kurangi berat"
          >
            <MinusIcon width="18" height="18" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="patient-bar__step"
            onClick={() => step(1)}
            disabled={weightKg == null}
            aria-label="Tambah berat"
          >
            <PlusIcon width="18" height="18" aria-hidden="true" />
          </button>
        </div>

        {/* Real radios: arrow keys, grouping and checked state for free. */}
        <fieldset className="patient-bar__pop">
          <legend className="sr-only">Populasi</legend>
          {(['anak', 'dewasa'] as const).map((p) => (
            <label key={p} className="patient-bar__pop-opt">
              <input
                type="radio"
                name="patient-population"
                className="sr-only patient-bar__pop-input"
                checked={population === p}
                onChange={() => {
                  setPopulation(p)
                  if (p === 'dewasa') setEstimating(false)
                }}
              />
              <span className="patient-bar__pop-btn">{p === 'anak' ? 'Anak' : 'Dewasa'}</span>
            </label>
          ))}
        </fieldset>
      </div>

      {estimatedFrom && !estimating && (
        <p className="patient-bar__note" id="patient-estimate-note">
          Berat diperkirakan dari usia ({estimatedFrom}) — timbang bila memungkinkan.
        </p>
      )}

      {estimating && (
        <AgeEstimator
          onEstimate={(kg, from) => {
            setWeight(String(kg), from)
            setEstimating(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * Weight from age — APLS / Luscombe-Owens bands (lib/estimateWeight). The
 * formula and its caveat are shown before the value is accepted: every number
 * downstream inherits whichever band fired.
 */
function AgeEstimator({ onEstimate }: { onEstimate: (kg: number, from: string) => void }) {
  const [years, setYears] = useState('')
  const [months, setMonths] = useState('')

  const y = parseInt(years) || 0
  const m = parseInt(months) || 0
  const estimate = years || months ? estimateWeight(y, m) : null

  return (
    <div className="patient-bar__estimate" id="patient-estimate">
      <div className="estimate-panel__inputs">
        <div className="field">
          <label className="label" htmlFor="patient-age-y">Tahun</label>
          <input
            id="patient-age-y"
            className="input input--sm"
            type="number"
            inputMode="numeric"
            min="0"
            max="17"
            step="1"
            placeholder="0"
            value={years}
            autoFocus
            onChange={(e) => setYears(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="patient-age-m">Bulan</label>
          <input
            id="patient-age-m"
            className="input input--sm"
            type="number"
            inputMode="numeric"
            min="0"
            max="11"
            step="1"
            placeholder="0"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={estimate == null}
          onClick={() => estimate && onEstimate(estimate.kg, `${estimate.expression} · ${estimate.formula}`)}
        >
          Pakai {estimate ? `${estimate.kg} kg` : ''}
        </button>
      </div>
      {estimate ? (
        <p className="estimate-panel__result" role="status">
          Estimasi: <strong>{estimate.kg} kg</strong>
          <span className="estimate-panel__working">
            {' '}= {estimate.expression} · {estimate.formula}
          </span>
          <span className="estimate-panel__formula">
            Rata-rata populasi menurut usia — tidak memperhitungkan status gizi, jadi cenderung
            terlalu tinggi pada anak kurus dan terlalu rendah pada anak gemuk. Semua hasil hitung
            ikut memakai angka ini; timbang bila memungkinkan.
          </span>
        </p>
      ) : (
        (years || months) && (
          <p className="estimate-panel__result estimate-panel__result--warn" role="alert">
            Usia tidak valid atau ≥18 tahun — masukkan berat manual.
          </p>
        )
      )}
    </div>
  )
}
