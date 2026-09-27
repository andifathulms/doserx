import { focusPatientWeight } from '../lib/patient'

/**
 * Shown where a result would be while no weight is set. Points at the one
 * place the weight lives (the patient bar) instead of growing a second field
 * here — two weight inputs is how a stale one gets used.
 */
export function WeightPrompt({ what = 'dosis' }: { what?: string }) {
  return (
    <div className="weight-prompt">
      <p className="weight-prompt__text">
        Isi <strong>berat pasien</strong> di bagian atas untuk melihat {what}.
      </p>
      <button type="button" className="btn btn--secondary btn--sm" onClick={focusPatientWeight}>
        Isi berat
      </button>
    </div>
  )
}
