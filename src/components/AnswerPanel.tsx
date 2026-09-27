import { ReactNode } from 'react'
import { DerivationChain } from './DerivationChain'
import { DerivationStepLike } from '../lib/derivationLine'

/**
 * The answer panel — the one dark, high-contrast object on a light screen.
 *
 * Every calculator mode ends here, so the number a doctor acts on always sits
 * in the same place, in the same face, at the same size, with its working
 * directly beneath it. That consistency is the point: at 2am the eye should
 * not have to hunt for which tile is the answer.
 *
 * Rules this component holds for every caller:
 * - ONE primary value. A range is context (a chip), never the hero — the old
 *   card showed "140–210" as the answer while its own derivation said 175,
 *   which is two answers to "what do I give?".
 * - The derivation line is always visible inside the panel, not a tap away.
 * - A value that cannot be computed is shown as a dashed "—" with the reason,
 *   never omitted (an absent tile looks like a bug; a stated gap is honest).
 * - Nothing animates. The dose appears and holds still.
 */

export interface AnswerReadout {
  label: string
  value: ReactNode
  unit: string
  /** Small line under the value — frequency, preparation, "per menit". */
  sub?: ReactNode
  /** Rendered as a stated gap ("—") with this reason instead of a value. */
  pending?: string
}

interface AnswerPanelProps {
  primary: AnswerReadout
  /** The second number most people need next — usually the volume. */
  secondary?: AnswerReadout
  /** Context chips: the published range, the daily total, drip rates. */
  facts?: ReactNode[]
  /** Set when a fixed ceiling replaced the weight-based figure. */
  capped?: boolean
  steps?: DerivationStepLike[]
  pendingNote?: string
  /** Screen-reader label for the region, e.g. "Hasil Paracetamol". */
  label: string
}

export function AnswerPanel({
  primary,
  secondary,
  facts,
  capped,
  steps,
  pendingNote,
  label,
}: AnswerPanelProps) {
  return (
    <section className="answer" aria-label={label}>
      <div className="answer__row">
        <Readout readout={primary} main capped={capped} />
        {secondary && <Readout readout={secondary} />}
      </div>

      {facts && facts.length > 0 && (
        <ul className="answer__facts">
          {facts.map((f, i) => (
            <li key={i} className="answer__fact">{f}</li>
          ))}
        </ul>
      )}

      {steps && steps.length > 0 && (
        <div className="answer__working">
          <DerivationChain steps={steps} pendingNote={pendingNote} />
        </div>
      )}
    </section>
  )
}

function Readout({
  readout,
  main = false,
  capped = false,
}: {
  readout: AnswerReadout
  main?: boolean
  capped?: boolean
}) {
  const { label, value, unit, sub, pending } = readout
  return (
    <div className={`answer__readout${main ? ' answer__readout--main' : ''}`}>
      <span className="answer__label">
        {label}
        {capped && <span className="answer__cap">maks</span>}
      </span>
      {pending ? (
        <>
          <span className="answer__num answer__num--pending">—</span>
          <span className="answer__sub">{pending}</span>
        </>
      ) : (
        <>
          <span className="answer__num">
            {value}
            <span className="answer__unit">{unit}</span>
          </span>
          {sub && <span className="answer__sub">{sub}</span>}
        </>
      )}
    </div>
  )
}
