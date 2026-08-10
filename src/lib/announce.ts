import { CalcResult } from './calculate'

/**
 * Screen-reader summary of a calculation.
 *
 * The result card is a grid of tiles that reads as disconnected fragments out
 * of context, so the live region gets one spoken sentence with the figures
 * that matter: what to give, how often, and whether a ceiling intervened.
 * Presentation copy only — the numbers come from calculate(), nothing is
 * recomputed here.
 */
export function announceResult(
  drugName: string,
  result: CalcResult,
  freq: number,
): string {
  const parts = [`${drugName}: ${result.perDose} miligram per kali, ${freq} kali sehari`]
  if (result.volume != null) parts.push(`${result.volume} mililiter per kali`)
  parts.push(`total ${result.dailyDose} miligram per hari`)
  if (result.cappedByMaxDay) parts.push('dosis harian dibatasi ke maksimum')
  if (result.cappedByMaxSingle) parts.push('dosis per kali dibatasi ke maksimum')
  return `${parts.join(', ')}.`
}
