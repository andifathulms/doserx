/**
 * Scroll behaviour that respects prefers-reduced-motion.
 *
 * The CSS reduced-motion block sets `scroll-behavior: auto !important`, but an
 * explicit `behavior` argument passed to scrollIntoView() overrides the CSS
 * property — so the page kept gliding for users who asked it not to, on the
 * app's most frequent action (selecting a drug). Queried at call time rather
 * than cached, so a mid-session preference change is picked up.
 */
export function scrollBehavior(): ScrollBehavior {
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return reduce ? 'auto' : 'smooth'
}
