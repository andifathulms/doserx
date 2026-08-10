/**
 * Presentation-layer copy for validation errors returned by calculate().
 *
 * The engine's messages are English and part of its tested contract, so they
 * are translated HERE rather than at the source — calculate.ts stays untouched
 * and its assertions keep passing. This file holds no logic: it is a lookup,
 * and an unrecognised message passes through verbatim so a new engine error can
 * never be swallowed into silence.
 *
 * (calculateInfusion() already returns Indonesian and needs no mapping.)
 */
const ERROR_COPY: Record<string, string> = {
  'Weight must be a positive number.': 'Berat badan harus berupa angka lebih dari 0.',
  'Dose/kg must be a positive number.': 'Dosis per kg harus berupa angka lebih dari 0.',
  'Frequency must be a positive number.': 'Frekuensi harus berupa angka lebih dari 0.',
}

export function errorCopy(message: string): string {
  return ERROR_COPY[message] ?? message
}
