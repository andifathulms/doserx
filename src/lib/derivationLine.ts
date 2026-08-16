/**
 * Compacts a step trail — calculate.ts's CalcStep[], and the identically
 * shaped step arrays calculateInfusion.ts / calculateFluidRate.ts /
 * calculateDextrose.ts already return — into one continuous chain for the
 * always-visible derivation line (DESIGN-REWORK.md §4).
 *
 * Pure string formatting over expression/result text those engines already
 * computed. No arithmetic happens here.
 */

export interface DerivationStepLike {
  /** calculate.ts marks its cap steps this way; the other engines omit it. */
  kind?: string
  expression: string
  result: string
}

/**
 * Each step's `expression` already restates the previous step's `result` as
 * its leading operand (that's what makes the full multi-line "Cara hitung"
 * trail readable line by line). Chained into one line, that repetition reads
 * as noise, so a step's expression drops its leading value whenever it
 * exactly repeats the running value from the step before it — "180 mg/hari ÷
 * 3× sehari" right after "...= 180 mg/hari" becomes "÷ 3× sehari".
 *
 * A step whose expression does NOT start with the running value (a side
 * calculation branching off the main chain, e.g. calculateInfusion's stock-
 * concentration conversion, or simply the first step) is left untouched —
 * this can only ever make the line more verbose, never wrong: it never
 * removes text that isn't a verified duplicate of what's already on screen.
 *
 * A cap step (kind 'capDay' | 'capSingle') is not an arithmetic operation —
 * it is a substitution of the raw computed value for a fixed ceiling — so it
 * renders as a short "→ maks X" marker instead of being parsed for a leading
 * operand.
 */
export function compactDerivation(steps: DerivationStepLike[]): string {
  const segments: string[] = []
  let running: string | null = null

  for (const step of steps) {
    if (step.kind === 'capDay' || step.kind === 'capSingle') {
      segments.push(`→ maks ${step.result}`)
      running = step.result
      continue
    }

    let expr = step.expression
    if (running && expr.startsWith(running)) {
      expr = expr.slice(running.length).trim()
    }
    segments.push(`${expr} = ${step.result}`)
    running = step.result
  }

  return segments.join(' ')
}
