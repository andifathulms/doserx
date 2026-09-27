import { useMemo } from 'react'
import { DrugGroup } from '../data/drugs'
import { GROUP_ORDER } from '../data/categories'
import { REVIEW_CATALOG, Regimen, regimenTitle } from '../data/catalog'
import { dosingSummary } from '../lib/quickDose'
import { Link } from '../lib/router'
import { setReviewMode, useReviewMode } from '../lib/review'

/**
 * /tinjau — where a clinician signs off draft catalog entries.
 *
 * Lists every draft regimen with its dosing, source and notes, grouped the
 * way the requested list was, and switches review mode on for this device so
 * each draft can be checked in context: on its drug page, in the Obat list,
 * with a real weight in the patient bar. Nothing here changes what other
 * users see — drafts are published by moving them into the catalog files
 * with `status: 'verified'`, which is a code change, not a toggle.
 *
 * Not in the navigation and not in the sitemap.
 */

/** Requested items that are deliberately not calculator entries, and why. */
const NOT_INCLUDED: Array<[string, string]> = [
  ['Antasida', 'Dosisnya dalam tablet/sendok takar, bukan mg — tidak cocok untuk kalkulator mg/kg.'],
  ['Attapulgit', 'Dosis "setelah tiap BAB cair", bukan jadwal; WHO tidak menganjurkan antidiare pada anak.'],
  ['NaCl 3%', 'Cairan: dihitung di Cairan → Koreksi natrium (mL/kg), bukan sebagai obat mg.'],
  ['KaEN 1B / KaEN 3B', 'Cairan rumatan: pilih di Cairan → Rumatan (jenis cairan).'],
  ['Insulin SC', 'Dosis subkutan diindividualkan (kebutuhan harian, sliding scale) — bukan rumus berat badan. Drip KAD ada.'],
  ['Nifedipin IV', 'Tidak beredar di Indonesia; yang dimasukkan sediaan oral lepas lambat.'],
  ['Tramadol untuk anak <12 th', 'Kontraindikasi (BPOM/FDA); regimen hanya dewasa dan remaja ≥12 th.'],
]

interface Row {
  drugId: string
  drugName: string
  newDrug: boolean
  regimen: Regimen
}

export function ReviewPage() {
  const on = useReviewMode()

  const rows = useMemo(() => {
    const out: Row[] = []
    for (const d of REVIEW_CATALOG) {
      for (const r of d.regimens) {
        if (r.status !== 'draft') continue
        out.push({ drugId: d.id, drugName: d.name, newDrug: d.status === 'draft', regimen: r })
      }
    }
    return out
  }, [])

  const byGroup = useMemo(() => {
    const groupOfDrug = new Map(REVIEW_CATALOG.map((d) => [d.id, d.group]))
    const map = new Map<DrugGroup, Row[]>()
    for (const g of GROUP_ORDER) map.set(g, [])
    for (const r of rows) map.get(groupOfDrug.get(r.drugId)!)?.push(r)
    return [...map.entries()].filter(([, list]) => list.length > 0)
  }, [rows])

  const newDrugs = new Set(rows.filter((r) => r.newDrug).map((r) => r.drugId)).size
  const newRoutes = rows.filter((r) => !r.newDrug).length

  return (
    <>
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>Tinjau draf obat</h1>
        <p className="page-lede">
          {rows.length} regimen menunggu verifikasi klinisi — {newDrugs} obat baru (dengan semua
          rutenya) dan {newRoutes} rute atau indikasi baru pada obat yang sudah ada. Draf tidak
          tampil untuk pengguna lain.
        </p>
      </div>

      <div className={`review-switch${on ? ' review-switch--on' : ''}`}>
        <div>
          <p className="review-switch__title">Mode tinjau {on ? 'aktif' : 'mati'}</p>
          <p className="review-switch__body">
            {on
              ? 'Draf tampil di daftar Obat dan di halaman obat pada perangkat ini, ditandai DRAF.'
              : 'Nyalakan untuk melihat setiap draf di tempatnya — dengan berat pasien sungguhan.'}
          </p>
        </div>
        <button
          type="button"
          className={`btn ${on ? 'btn--ghost' : 'btn--primary'} review-switch__btn`}
          aria-pressed={on}
          onClick={() => setReviewMode(!on)}
        >
          {on ? 'Matikan mode tinjau' : 'Nyalakan mode tinjau'}
        </button>
      </div>

      <p className="review-how">
        Cara memeriksa: isi berat di bagian atas, buka tiap obat, bandingkan angka dan catatan dengan
        acuan yang tercantum. Draf yang sudah benar dipindahkan ke katalog dengan status
        terverifikasi dan nama pemeriksa — perubahan itu yang membuatnya tampil untuk semua.
      </p>

      {byGroup.map(([group, list]) => (
        <section key={group} className="drug-section">
          <h2 className="drug-section__title" data-group={group}>
            <span className="drug-section__dot" aria-hidden="true" />
            {group} <span className="drug-section__count">{list.length}</span>
          </h2>
          <ul className="review-list">
            {list.map((row) => (
              <li key={row.regimen.id} className="review-item">
                <div className="review-item__head">
                  <Link to={`/obat/${row.drugId}`} className="review-item__name">
                    {row.drugName}
                  </Link>
                  <span className="route-pill">{regimenTitle(row.regimen)}</span>
                  {row.regimen.label && <span className="review-item__label">{row.regimen.label}</span>}
                  <span className="review-item__pop">{populationText(row.regimen.population)}</span>
                  {row.newDrug ? (
                    <span className="tag tag--draft">OBAT BARU</span>
                  ) : (
                    <span className="tag tag--draft">RUTE BARU</span>
                  )}
                  {row.regimen.highAlert && <span className="tag tag--alert">HIGH-ALERT</span>}
                </div>
                <p className="review-item__dose">{dosingSummary(row.regimen)}</p>
                <p className="review-item__note">{regimenNote(row.regimen)}</p>
                <p className="review-item__source">Acuan: {regimenSource(row.regimen) ?? '—'}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="drug-section">
        <h2 className="drug-section__title">Diminta, tetapi tidak dijadikan entri kalkulator</h2>
        <ul className="review-list">
          {NOT_INCLUDED.map(([name, why]) => (
            <li key={name} className="review-item">
              <p className="review-item__name review-item__name--plain">{name}</p>
              <p className="review-item__note">{why}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function populationText(p: Regimen['population']): string {
  return p === 'anak' ? 'anak' : p === 'dewasa' ? 'dewasa' : 'semua usia'
}

function regimenNote(r: Regimen): string {
  if (r.kind === 'infusion') return [r.infusion.note, r.infusion.reviewNote].filter(Boolean).join(' ')
  return r.preset.note
}

function regimenSource(r: Regimen): string | undefined {
  return r.kind === 'infusion' ? r.infusion.source : r.preset.source
}
