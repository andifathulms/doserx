import { DrugPreset } from './types'

/**
 * Catalog entries awaiting clinical review.
 *
 * Every entry here carries `status: 'draft'` and a `source`, and is hidden
 * from the live catalog: it appears only when review mode is switched on
 * (Tentang → Mode tinjau), marked DRAF on every surface, so the reviewing
 * clinician sees it in context. Moving an entry into its domain file with
 * `status: 'verified'` and `reviewedBy` is what publishes it — never the
 * other way round.
 */
export const DRAFT_PRESETS: DrugPreset[] = []
