import { DrugPreset } from './types'

/**
 * Catalog entries awaiting clinical review.
 *
 * Every entry here carries `status: 'draft'` and a `source`, and is hidden
 * from the live catalog: it appears only in review mode (/tinjau), marked
 * DRAF on every surface, so the reviewing clinician sees it in context.
 * Publishing an entry means moving it into its domain file (or
 * requested.ts) with `status: 'verified'` and `reviewedBy` — never the
 * other way round.
 *
 * Empty since the requested ward list was approved on 27 Sep 2026.
 */
export const DRAFT_PRESETS: DrugPreset[] = []
