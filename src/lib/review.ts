import { useEffect, useState } from 'react'
import { CatalogDrug, catalogFor } from '../data/catalog'

/**
 * Review mode — how a clinician checks draft catalog entries in context.
 *
 * Off by default and for everyone else. When on, draft drugs and draft
 * routes appear in the Obat list and on drug pages, each marked DRAF with
 * its source and a "belum diverifikasi" notice beside every dose. Stored per
 * device in localStorage; switched in Tentang → Mode tinjau.
 *
 * The first render is always the live catalog (so prerendered HTML and
 * hydration agree); review mode applies after mount.
 */
const REVIEW_KEY = 'doserx_review'
const EVENT = 'doserx-review-change'

export function loadReviewMode(): boolean {
  try {
    return localStorage.getItem(REVIEW_KEY) === '1'
  } catch {
    return false
  }
}

export function setReviewMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(REVIEW_KEY, '1')
    else localStorage.removeItem(REVIEW_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useReviewMode(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const sync = () => setOn(loadReviewMode())
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])
  return on
}

export function useCatalog(): CatalogDrug[] {
  return catalogFor(useReviewMode())
}
