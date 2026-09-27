import { describe, it, expect } from 'vitest'
import css from '../index.css?raw'
import { GROUP_COLORS } from './groupColors'
import { GROUP_ORDER } from './categories'

/**
 * GROUP_COLORS makes a missing group a compile error; this makes a missing or
 * drifted CSS rule a test failure, so index.css can't fall out of sync with
 * it. Reads the stylesheet via Vite's ?raw import (styles.test.ts's pattern).
 */

function parseRules(regex: RegExp): Map<string, string> {
  const map = new Map<string, string>()
  let m
  while ((m = regex.exec(css))) map.set(m[1], m[2])
  return map
}

const lightRules = parseRules(/^\[data-group="([^"]+)"\]\s*\{\s*--_grp:\s*(#[0-9a-fA-F]{6});/gm)
const darkRules = parseRules(
  /^:root\[data-theme="dark"\]\s*\[data-group="([^"]+)"\]\s*\{\s*--_grp:\s*(#[0-9a-fA-F]{6});/gm,
)

describe('group accent colours: GROUP_COLORS vs. index.css', () => {
  const groups = Object.keys(GROUP_COLORS)

  it('has exactly the nine groups, in display order', () => {
    expect(groups.sort()).toEqual([...GROUP_ORDER].sort())
    expect(groups.length).toBe(9)
  })

  it('has a light [data-group] rule for every group, matching GROUP_COLORS', () => {
    for (const g of groups) {
      expect(lightRules.get(g), `light rule for "${g}"`).toBe(GROUP_COLORS[g as keyof typeof GROUP_COLORS].light)
    }
  })

  it('has a dark override rule for every group, matching GROUP_COLORS', () => {
    for (const g of groups) {
      expect(darkRules.get(g), `dark rule for "${g}"`).toBe(GROUP_COLORS[g as keyof typeof GROUP_COLORS].dark)
    }
  })

  it('has no rule in index.css for a group GROUP_COLORS does not know', () => {
    for (const g of [...lightRules.keys(), ...darkRules.keys()]) {
      expect(groups, `stray rule for "${g}"`).toContain(g)
    }
  })
})
