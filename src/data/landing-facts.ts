/**
 * Facts the landing page needs, without importing the 92-drug catalog.
 *
 * The catalog module is 13 kB gzip. The landing page needs exactly two things
 * from it — headline counts and one drug for the live demo — so importing all
 * of it puts the whole library on the critical path of the page most likely to
 * be someone's first impression.
 *
 * These values are hand-written, which normally invites exactly the drift this
 * project keeps fixing. The guard is landing-facts.test.ts: it asserts every
 * field here against the real catalog, so adding a drug fails the build until
 * this file is updated. Derived-at-runtime where it is cheap; asserted-at-test
 * where runtime derivation would cost the user bytes.
 */
export const CATALOG_STATS = {
  drugs: 92,
  categories: 16,
  sources: ['IDAI', 'BNFc', 'Fornas', 'WHO', 'Kemenkes'],
} as const

/** Paracetamol, the demo case — only the fields calculate() and the demo need. */
export const DEMO_DRUG = {
  id: 'paracetamol',
  name: 'Paracetamol',
  dosePerKg: 50,
  dosePerKgMin: 40,
  dosePerKgMax: 60,
  freq: 4,
  maxDay: 4000,
  maxSingle: 1000,
  concentration: 24,
  source: 'IDAI',
} as const
