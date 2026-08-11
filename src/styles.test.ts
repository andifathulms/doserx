import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Every className in the app must have a CSS rule.
 *
 * This exists because a stylesheet edit in the routing pass used a replacement
 * range that happened to span the worked-example block and silently deleted it.
 * Nothing failed: types passed, tests passed, the build succeeded, the page
 * rendered — as an unstyled <ol> with double numbering. It took a screenshot
 * from a human to notice.
 *
 * Static analysis, not rendering: cheap, and it catches the deletion at the
 * moment it happens rather than in review.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.tsx')) out.push(p)
  }
  return out
}

const css = readFileSync('src/index.css', 'utf8')
const defined = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]))

const used = new Map<string, string>()
for (const file of walk('src')) {
  if (file.endsWith('.test.tsx')) continue
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/className=[`"{]([^`"}]*)/g)) {
    for (const cls of m[1].match(/[a-zA-Z][\w-]*/g) ?? []) {
      // Skip JSX identifiers inside template expressions (they are camelCase
      // variables, not class names — real classes are kebab/BEM).
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
})
