import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

/**
 * The PRD's hard requirement, rendered inline on every screen where a dose is
 * about to be acted on: the Obat list (which now shows doses), each drug
 * page, every calculator and the Darurat packs. Never a tooltip, modal or
 * dismissible toast. One component so the wording cannot drift between them.
 */
export function SafetyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`safety-banner${compact ? ' safety-banner--compact' : ''}`} role="note">
      <ExclamationTriangleIcon className="safety-banner__icon" aria-hidden="true" />
      {compact ? (
        // Both halves of the requirement, in one line's worth of words — for
        // the list, where the full paragraph pushed every drug below the fold.
        <span>
          <strong>Alat bantu hitung</strong>, bukan pendukung keputusan klinis. Verifikasi
          dengan panduan terkini.
        </span>
      ) : (
        <span>
          <strong>Alat bantu hitung saja</strong> — bukan sistem pendukung keputusan klinis atau
          resep. Verifikasi setiap dosis dengan panduan institusi/klinis terkini sebelum
          digunakan.
        </span>
      )}
    </div>
  )
}
