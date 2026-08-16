import { DerivationStepLike, compactDerivation } from '../lib/derivationLine'

interface DerivationChainProps {
  /** The engine's own step trail — CalcResult.steps, InfusionResult.steps,
   *  FluidRateResult.steps or DextroseResult.steps. Nothing is recomputed. */
  steps: DerivationStepLike[]
  /** Set when the chain stops short of a value the doctor could still get —
   *  ResultCard's missing-concentration case. Rendered after the chain in
   *  the same --pending tone the result value itself uses, so the line never
   *  implies a completed chain it didn't reach. */
  pendingNote?: string
}

/**
 * The always-visible one-line summary beneath the hero number
 * (DESIGN-REWORK.md §4) — "can a tired doctor verify the number in three
 * seconds before acting on it?" The full step-by-step "Cara hitung" <details>
 * stays exactly as it is; this is the terser line above it, not a
 * replacement, present in all five calculator modes.
 */
export function DerivationChain({ steps, pendingNote }: DerivationChainProps) {
  if (steps.length === 0) return null
  return (
    <p className="derivation-line">
      {compactDerivation(steps)}
      {pendingNote && <span className="derivation-line__pending"> · {pendingNote}</span>}
    </p>
  )
}
