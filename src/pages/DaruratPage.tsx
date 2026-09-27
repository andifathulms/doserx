import { useEffect, useRef, useState } from 'react'
import { PACKS, Pack } from '../data/packs'
import { SafetyBanner } from '../components/SafetyBanner'
import { WeightPrompt } from '../components/WeightPrompt'
import { Link } from '../lib/router'
import { usePatient } from '../lib/patient'
import { useCatalog, useReviewMode } from '../lib/review'
import { PackLine, packLine } from '../lib/packDose'

/**
 * /darurat — emergency packs: every drug a situation needs, computed for the
 * patient-bar weight, in the order it is given. Built from the same catalog
 * as the drug pages (data/packs.ts only chooses and orders); a draft row
 * keeps its place but shows no number outside review mode.
 *
 * The volume is the big figure — it is what is drawn up — with the mg beside
 * it, and each row names the rule it came from so the number can be checked
 * at a glance.
 */
export function DaruratPage() {
  const catalog = useCatalog()
  const review = useReviewMode()
  const { weightKg, population } = usePatient()
  const [packId, setPackId] = useState<Pack['id']>('rsi')
  const pack = PACKS.find((p) => p.id === packId)!

  const anyPending = pack.sections.some((s) =>
    s.rows.some((r) => packLine(r, catalog, weightKg, population, review).pending),
  )

  return (
    <>
      <div className="page-head page-head--compact">
        <h1 className="page-title" tabIndex={-1}>Darurat</h1>
        <p className="page-lede">{pack.lede}</p>
      </div>

      {/* Filter-style buttons, not tabs: each is a whole different sheet,
          and aria-pressed says which one is showing. */}
      <div className="pack-tabs" role="group" aria-label="Paket darurat">
        {PACKS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pack-tab${p.id === packId ? ' pack-tab--on' : ''}`}
            aria-pressed={p.id === packId}
            onClick={() => setPackId(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pack.stopwatch && <Stopwatch />}

      {weightKg == null && <WeightPrompt what="dosis paket ini" />}

      {anyPending && !review && (
        <p className="pack-pending-note">
          Baris bertanda <strong>menunggu verifikasi</strong> adalah obat yang dosisnya belum
          diperiksa klinisi — angkanya sengaja tidak ditampilkan. <Link to="/tinjau">Tentang draf</Link>
        </p>
      )}

      {pack.sections.map((section) => (
        <section key={section.title} className="pack-section">
          <h2 className="pack-section__title">
            {section.time && <span className="pack-section__time">{section.time}</span>}
            {section.title}
          </h2>
          {section.note && <p className="pack-section__note">{section.note}</p>}
          <ul className="pack-list">
            {section.rows.map((row, i) => {
              const line = packLine(row, catalog, weightKg, population, review)
              return <PackRowView key={`${line.key}-${i}`} line={line} />
            })}
          </ul>
        </section>
      ))}

      <SafetyBanner />
    </>
  )
}

function PackRowView({ line }: { line: PackLine }) {
  const name = (
    <span className="pack-row__name">
      {line.name}
      {line.highAlert && <span className="tag tag--alert">HIGH-ALERT</span>}
      {line.draft && !line.pending && <span className="tag tag--draft">DRAF</span>}
    </span>
  )
  return (
    <li className={`pack-row${line.pending ? ' pack-row--pending' : ''}`}>
      <div className="pack-row__main">
        {line.href && !line.pending ? <Link to={line.href} className="pack-row__link">{name}</Link> : name}
        <span className="pack-row__rule">
          {line.route && <span className="route-pill">{line.route}</span>}
          {line.pending ? (
            <span className="pack-row__pending">menunggu verifikasi</span>
          ) : (
            line.rule
          )}
        </span>
        {line.note && !line.pending && <span className="pack-row__note">{line.note}</span>}
      </div>
      {line.primary && (
        <div className="pack-row__dose">
          <span className="pack-row__value">
            {line.capped && <span className="tag tag--cap">MAKS</span>}
            {line.primary.value}
            <span className="pack-row__unit"> {line.primary.unit}</span>
          </span>
          {line.secondary && (
            <span className="pack-row__sub">
              {line.secondary.value} {line.secondary.unit}
            </span>
          )}
        </div>
      )}
    </li>
  )
}

/**
 * Minutes since the seizure started. Big, mono, one button; it keeps running
 * across tab switches within the page and says nothing to a screen reader
 * every second (the value is read on demand, not announced).
 */
function Stopwatch() {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (startedAt == null) return
    timer.current = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [startedAt])

  const elapsed = startedAt == null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className={`stopwatch${startedAt != null ? ' stopwatch--on' : ''}`}>
      <div>
        <span className="stopwatch__label">Durasi kejang</span>
        <span className="stopwatch__time" aria-live="off">
          {mm}:{ss}
        </span>
      </div>
      {startedAt == null ? (
        <button
          type="button"
          className="btn btn--primary stopwatch__btn"
          onClick={() => {
            setNow(Date.now())
            setStartedAt(Date.now())
          }}
        >
          Mulai
        </button>
      ) : (
        <button type="button" className="btn btn--ghost stopwatch__btn" onClick={() => setStartedAt(null)}>
          Reset
        </button>
      )}
    </div>
  )
}
