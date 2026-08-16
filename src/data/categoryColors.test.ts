import { describe, it, expect } from 'vitest'
import css from '../index.css?raw'
import { CATEGORY_COLORS } from './categoryColors'

/**
 * The other half of DESIGN-REWORK.md §9's fix: CATEGORY_COLORS makes a
 * missing category a compile error; this makes a missing or drifted CSS
 * rule a test failure, so index.css can't quietly fall out of sync with it.
 * Reads the stylesheet via Vite's ?raw import (styles.test.ts's own
 * pattern) rather than node:fs, which this project deliberately has no
 * @types/node for (see lib/router.tsx's comment on the same choice).
 */

function parseRules(regex: RegExp): Map<string, string> {
  const map = new Map<string, string>()
  let m
  while ((m = regex.exec(css))) map.set(m[1], m[2])
  return map
}

const lightRules = parseRules(/^\[data-cat="([^"]+)"\]\s*\{\s*--_cat:\s*(#[0-9a-fA-F]{6});/gm)
const darkRules = parseRules(
  /^:root\[data-theme="dark"\]\s*\[data-cat="([^"]+)"\]\s*\{\s*--_cat:\s*(#[0-9a-fA-F]{6});/gm,
)

describe('category accent colours: CATEGORY_COLORS vs. index.css', () => {
  const categories = Object.keys(CATEGORY_COLORS)

  it('has exactly 17 categories', () => {
    expect(categories.length).toBe(17)
  })

  it('has a light [data-cat] rule for every category, matching CATEGORY_COLORS', () => {
    for (const cat of categories) {
      expect(lightRules.get(cat), `light rule for "${cat}"`).toBe(CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS].light)
    }
  })

  it('has a dark override rule for every category, matching CATEGORY_COLORS', () => {
    for (const cat of categories) {
      expect(darkRules.get(cat), `dark rule for "${cat}"`).toBe(CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS].dark)
    }
  })

  it('has no light rule in index.css for a category CATEGORY_COLORS does not know', () => {
    for (const cat of lightRules.keys()) {
      expect(categories, `stray light rule for "${cat}"`).toContain(cat)
    }
  })

  it('has no dark rule in index.css for a category CATEGORY_COLORS does not know', () => {
    for (const cat of darkRules.keys()) {
      expect(categories, `stray dark rule for "${cat}"`).toContain(cat)
    }
  })
})
