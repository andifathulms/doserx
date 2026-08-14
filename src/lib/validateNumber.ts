/**
 * Live validity check for a numeric text field, shared by every panel's
 * weight/dose/frequency/concentration inputs. Empty is never "invalid" —
 * an untouched field shouldn't flash red before the doctor has typed
 * anything; calculate.ts still rejects an empty/blank submit on its own.
 */
export function isInvalidPositiveNumber(value: string): boolean {
  if (value.trim() === '') return false
  const n = parseFloat(value)
  return !isFinite(n) || n <= 0
}
