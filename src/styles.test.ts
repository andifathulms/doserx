import { describe, it, expect } from 'vitest'
import cssText from './index.css?raw'

/**
 * Every className in the app must have a CSS rule.
 *
 * This exists because a stylesheet edit in the routing pass used a replacement
 * range that happened to span the worked-example block and silently deleted it.
 * Nothing failed: types passed, tests passed, the build succeeded, the page
 * rendered — as an unstyled <ol> with double numbering. It took a screenshot
 * from a human to notice.
 *
 * Uses Vite's own glob rather than node:fs, so it needs no @types/node.
 */
const sources = import.meta.glob('./**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const defined = new Set([...cssText.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]))

const used = new Map<string, string>()
for (const [file, src] of Object.entries(sources)) {
  if (file.includes('.test.')) continue
  for (const m of src.matchAll(/className=[`"{]([^`"}]*)/g)) {
    for (const cls of m[1].match(/[a-zA-Z][\w-]*/g) ?? []) {
      // Skip identifiers inside template expressions — real class names are
      // kebab/BEM or plain lowercase words.
      if (!/[-_]/.test(cls) && !/^[a-z]+$/.test(cls)) continue
      if (!used.has(cls)) used.set(cls, file)
    }
  }
}

describe('stylesheet covers every className', () => {
  it('has a rule for each class the components use', () => {
    const missing = [...used.entries()]
      .filter(([cls]) => !defined.has(cls))
      .map(([cls, file]) => `${cls}  (${file})`)
    expect(missing).toEqual([])
  })

  it('is actually scanning the app, not silently reading nothing', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10)
    expect(used.size).toBeGreaterThan(100)
    expect(defined.size).toBeGreaterThan(100)
  })
})
