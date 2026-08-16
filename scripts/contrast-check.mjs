#!/usr/bin/env node
/**
 * Contrast audit — DESIGN-REWORK.md §8 / §11 step 1.
 *
 * Pure arithmetic on the token values actually declared in src/index.css, no
 * browser involved. Parses the light `:root` block and the
 * `:root[data-theme="dark"]` override block the same way the cascade would
 * resolve them (dark = light values with the overridden subset replacing
 * them), resolves `var(--x)` chains, composites translucent tokens (the dark
 * theme's rgba tint backgrounds) over the surface they are documented to sit
 * on, and computes WCAG relative-luminance contrast ratios.
 *
 * This is read-only: it reports ratios and flags failures against the bars
 * DESIGN.md already claims (4.5:1 for text, 3:1 for a UI-component boundary
 * like a border or focus ring). It does not touch any token value.
 *
 * Usage: node scripts/contrast-check.mjs [--json]
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSS_PATH = path.join(__dirname, '..', 'src', 'index.css')
const css = readFileSync(CSS_PATH, 'utf8')

// ── CSS block extraction ─────────────────────────────────────────────────────

/** Returns the `{ ... }` body text immediately following the first match of
 *  `selectorRegex`, using brace counting (safe even though var() itself never
 *  nests braces in this file — a plain non-greedy regex would still break on
 *  an easy-to-miss nested rule added later). */
function extractBlock(source, selectorRegex) {
  const m = selectorRegex.exec(source)
  if (!m) throw new Error(`Selector not found: ${selectorRegex}`)
  const openIdx = source.indexOf('{', m.index)
  let depth = 0
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(openIdx + 1, i)
    }
  }
  throw new Error('Unbalanced braces')
}

function parseVars(blockText) {
  const vars = {}
  const re = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g
  let m
  while ((m = re.exec(blockText))) {
    vars[m[1]] = m[2].trim()
  }
  return vars
}

const lightBlock = extractBlock(css, /:root\s*\{/)
const darkBlock = extractBlock(css, /:root\[data-theme="dark"\]\s*\{/)
const lightVars = parseVars(lightBlock)
// The cascade: dark only overrides a subset: everything else falls through
// to the light declaration, which is exactly what the browser does when
// data-theme="dark" is set on <html> (a single :root still applies).
const darkVars = { ...lightVars, ...parseVars(darkBlock) }

// 17-entry category accent map — same hex in both themes (never redefined
// under the dark block), which is precisely what DESIGN-REWORK §5 flags as
// unverified.
const CATEGORIES = []
{
  const re = /\[data-cat="([^"]+)"\]\s*\{\s*--_cat:\s*(#[0-9a-fA-F]{3,6});/g
  let m
  while ((m = re.exec(css))) CATEGORIES.push({ name: m[1], hex: m[2] })
}
if (CATEGORIES.length !== 17) {
  throw new Error(`Expected 17 category accents, found ${CATEGORIES.length}`)
}

// ── Colour math ───────────────────────────────────────────────────────────────

/** Resolves `var(--name, fallback)` chains (and literal values) against a
 *  theme's variable map. Depth-capped so a circular reference fails loudly
 *  instead of hanging. */
function resolveVar(name, vars, depth = 0) {
  if (depth > 10) throw new Error(`var() resolution too deep: --${name}`)
  const raw = vars[name]
  if (raw == null) throw new Error(`Undefined var: --${name}`)
  return resolveValue(raw, vars, depth + 1)
}

function resolveValue(raw, vars, depth = 0) {
  const m = /^var\(\s*--([a-zA-Z0-9-]+)\s*(?:,\s*(.+))?\)$/.exec(raw.trim())
  if (!m) return raw.trim()
  const [, refName, fallback] = m
  if (vars[refName] != null) return resolveVar(refName, vars, depth)
  if (fallback != null) return resolveValue(fallback, vars, depth)
  throw new Error(`Unresolvable var(--${refName})`)
}

function parseColor(value) {
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = [...h].map((c) => c + c).join('')
    const n = parseInt(h, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
  }
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\)$/.exec(
    value,
  )
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] != null ? Number(rgba[4]) : 1,
    }
  }
  throw new Error(`Unparseable colour: ${value}`)
}

/** Flattens a translucent colour onto an opaque base — needed for the dark
 *  theme's rgba tint backgrounds (e.g. --c-primary-bg), which are only ever
 *  meant to be seen painted over --c-bg or --c-surface. */
function compositeOver(fg, base) {
  if (fg.a >= 1) return fg
  return {
    r: fg.a * fg.r + (1 - fg.a) * base.r,
    g: fg.a * fg.g + (1 - fg.a) * base.g,
    b: fg.a * fg.b + (1 - fg.a) * base.b,
    a: 1,
  }
}

function channelLin(c) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * channelLin(r) + 0.7152 * channelLin(g) + 0.0722 * channelLin(b)
}

function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1)
  const l2 = relativeLuminance(c2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function toHex({ r, g, b }) {
  return (
    '#' +
    [r, g, b]
      .map((c) => Math.round(c).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** Resolves a token/value to a solid colour against a given theme + surface,
 *  compositing a translucent result over that surface's own base colour. */
function resolveSolid(tokenOrLiteral, vars, surfaceColor) {
  const value = tokenOrLiteral.startsWith('--')
    ? resolveVar(tokenOrLiteral.slice(2), vars)
    : resolveValue(tokenOrLiteral, vars)
  const color = parseColor(value)
  return compositeOver(color, surfaceColor)
}

// ── Pairs to check ────────────────────────────────────────────────────────────
// Every entry is checked against BOTH --c-bg and --c-surface, in BOTH themes.
// 'plain' pairs use the surface itself as the background; 'tint' pairs use
// the token's own tinted background (composited over that surface when the
// dark-theme value is translucent) — the pattern the Tint-Not-Fill rule
// actually renders on screen (coloured text on its own pale chip, not on the
// bare page background).

const TEXT_MIN = 4.5
const UI_MIN = 3

const PAIRS = [
  // ── Neutral text tiers ──
  { group: 'Neutral text', label: 'Primary text (--c-text)', fg: '--c-text', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Neutral text', label: 'Secondary text (--c-text-2)', fg: '--c-text-2', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Neutral text', label: 'Tertiary text (--c-text-3)', fg: '--c-text-3', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Neutral text', label: 'Faint text (--c-text-faint, decorative only)', fg: '--c-text-faint', mode: 'plain', min: null, kind: 'decorative' },

  // ── Borders / UI boundaries ──
  { group: 'Borders', label: 'Component boundary (--c-border-mid)', fg: '--c-border-mid', mode: 'plain', min: UI_MIN, kind: 'ui' },
  { group: 'Borders', label: 'Hairline (--c-border, decorative only)', fg: '--c-border', mode: 'plain', min: null, kind: 'decorative' },
  { group: 'Borders', label: 'Focus ring (--c-focus)', fg: '--c-focus', mode: 'plain', min: UI_MIN, kind: 'ui' },

  // ── Primary (clinical blue) ──
  { group: 'Primary', label: 'Primary text (--c-primary)', fg: '--c-primary', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Primary', label: 'Primary text on its own tint (--c-primary-bg)', fg: '--c-primary', bg: '--c-primary-bg', mode: 'tint', min: TEXT_MIN, kind: 'text' },
  { group: 'Primary', label: 'Primary-dark / active nav text (--c-primary-dark)', fg: '--c-primary-dark', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Primary', label: 'Primary-dark on primary tint (bottom-nav / history-toggle active)', fg: '--c-primary-dark', bg: '--c-primary-bg', mode: 'tint', min: TEXT_MIN, kind: 'text' },

  // ── Clay / accent secondary ──
  { group: 'Accent (clay)', label: 'Accent text (--c-accent)', fg: '--c-accent', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Accent (clay)', label: 'Accent text on its own tint (--c-accent-bg)', fg: '--c-accent', bg: '--c-accent-bg', mode: 'tint', min: TEXT_MIN, kind: 'text' },

  // ── Warn ──
  { group: 'Warn', label: 'Warn text (--c-warn)', fg: '--c-warn', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Warn', label: 'Warn text on its own tint (--c-warn-bg)', fg: '--c-warn', bg: '--c-warn-bg', mode: 'tint', min: TEXT_MIN, kind: 'text' },

  // ── Error ──
  { group: 'Error', label: 'Error text (--c-error)', fg: '--c-error', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Error', label: 'Error text on its own tint (--c-error-bg)', fg: '--c-error', bg: '--c-error-bg', mode: 'tint', min: TEXT_MIN, kind: 'text' },

  // ── Success ──
  { group: 'Success', label: 'Success text (--c-success)', fg: '--c-success', mode: 'plain', min: TEXT_MIN, kind: 'text' },
  { group: 'Success', label: 'Success text on its own tint (--c-success-bg)', fg: '--c-success', bg: '--c-success-bg', mode: 'tint', min: TEXT_MIN, kind: 'text' },
]

// ── Run ───────────────────────────────────────────────────────────────────────

function themeSurfaces(vars) {
  return {
    bg: parseColor(resolveVar('c-bg', vars)),
    surface: parseColor(resolveVar('c-surface', vars)),
  }
}

const THEMES = [
  { key: 'light', label: 'Light', vars: lightVars },
  { key: 'dark', label: 'Dark', vars: darkVars },
]

const rows = []

for (const pair of PAIRS) {
  const cell = { group: pair.group, label: pair.label, min: pair.min, kind: pair.kind, byTheme: {} }
  for (const theme of THEMES) {
    const { bg, surface } = themeSurfaces(theme.vars)
    const results = {}
    for (const [surfaceName, surfaceColor] of [['bg', bg], ['surface', surface]]) {
      const bgToken = pair.mode === 'tint' ? pair.bg : `--c-${surfaceName}`
      const bgColor = resolveSolid(bgToken, theme.vars, surfaceColor)
      const fgColor = resolveSolid(pair.fg, theme.vars, bgColor)
      results[surfaceName] = {
        ratio: contrastRatio(fgColor, bgColor),
        fgHex: toHex(fgColor),
        bgHex: toHex(bgColor),
      }
    }
    cell.byTheme[theme.key] = results
  }
  rows.push(cell)
}

// Category accents — same hex both themes, checked against both surfaces of
// both themes since the dark surface is new, unverified territory.
const categoryRows = []
for (const cat of CATEGORIES) {
  const cell = { group: 'Category accent', label: cat.name, hex: cat.hex, min: TEXT_MIN, kind: 'text', byTheme: {} }
  for (const theme of THEMES) {
    const { bg, surface } = themeSurfaces(theme.vars)
    const results = {}
    for (const [surfaceName, surfaceColor] of [['bg', bg], ['surface', surface]]) {
      const fgColor = parseColor(cat.hex)
      results[surfaceName] = {
        ratio: contrastRatio(fgColor, surfaceColor),
        fgHex: cat.hex,
        bgHex: toHex(surfaceColor),
      }
    }
    cell.byTheme[theme.key] = results
  }
  categoryRows.push(cell)
}

// One-off: the primary button's fixed #fff-on-stone-900 fill. Not a --c-*
// semantic token (index.css uses var(--stone-900) directly, unchanged by
// dark mode), so it sits outside the theme loop above by construction.
const btnFg = parseColor('#ffffff')
const btnBg = parseColor(resolveVar('stone-900', lightVars))
const btnRatio = contrastRatio(btnFg, btnBg)

// ── Report ────────────────────────────────────────────────────────────────────

function status(ratio, min) {
  if (min == null) return 'INFO'
  return ratio >= min ? 'PASS' : 'FAIL'
}

function fmt(ratio) {
  return `${ratio.toFixed(2)}:1`
}

const asJson = process.argv.includes('--json')

if (asJson) {
  console.log(JSON.stringify({ rows, categoryRows, button: { ratio: btnRatio } }, null, 2))
  process.exit(0)
}

const allRows = [...rows, ...categoryRows]
const failures = []
const infoRows = []
const evaluated = []

for (const cell of allRows) {
  for (const theme of THEMES) {
    for (const surfaceName of ['bg', 'surface']) {
      const r = cell.byTheme[theme.key][surfaceName]
      const st = status(r.ratio, cell.min)
      const entry = {
        group: cell.group,
        label: cell.label,
        theme: theme.label,
        surface: surfaceName === 'bg' ? '--c-bg' : '--c-surface',
        ratio: r.ratio,
        fgHex: r.fgHex,
        bgHex: r.bgHex,
        min: cell.min,
        status: st,
      }
      if (st === 'FAIL') failures.push(entry)
      else if (st === 'INFO') infoRows.push(entry)
      else evaluated.push(entry)
    }
  }
}

console.log('# Contrast audit — DESIGN-REWORK.md §8/§11 step 1\n')
console.log(`Source: src/index.css (${lightBlock ? 'light + dark :root blocks' : ''}, ${CATEGORIES.length} category accents)\n`)

console.log('## Token pairs\n')
console.log('| Group | Pair | Theme | Against | Ratio | Colours | Min | Status |')
console.log('|---|---|---|---|---|---|---|---|')
for (const cell of rows) {
  for (const theme of THEMES) {
    for (const [surfaceName, label] of [['bg', '--c-bg'], ['surface', '--c-surface']]) {
      const r = cell.byTheme[theme.key][surfaceName]
      const st = status(r.ratio, cell.min)
      const minLabel = cell.min == null ? '—' : `${cell.min}:1`
      console.log(
        `| ${cell.group} | ${cell.label} | ${theme.label} | ${label} | ${fmt(r.ratio)} | ${r.fgHex} on ${r.bgHex} | ${minLabel} | ${st} |`,
      )
    }
  }
}

console.log('\n## Category accents (17) — light claims 4.5:1 on white; dark surfaces unverified until now\n')
console.log('| Category | Hex | Theme | Against | Ratio | Min | Status |')
console.log('|---|---|---|---|---|---|---|')
for (const cell of categoryRows) {
  for (const theme of THEMES) {
    for (const [surfaceName, label] of [['bg', '--c-bg'], ['surface', '--c-surface']]) {
      const r = cell.byTheme[theme.key][surfaceName]
      const st = status(r.ratio, cell.min)
      console.log(
        `| ${cell.label} | ${cell.hex} | ${theme.label} | ${label} | ${fmt(r.ratio)} | ${cell.min}:1 | ${st} |`,
      )
    }
  }
}

console.log('\n## Fixed pair (not theme-dependent)\n')
console.log('| Pair | Ratio | Min | Status |')
console.log('|---|---|---|---|')
console.log(`| Primary button — #ffffff on var(--stone-900) | ${fmt(btnRatio)} | ${TEXT_MIN}:1 | ${status(btnRatio, TEXT_MIN)} |`)

console.log(`\n## Summary\n`)
console.log(`- ${evaluated.length + failures.length} pairs evaluated against a minimum ratio (${TEXT_MIN}:1 text / ${UI_MIN}:1 UI-boundary), plus ${infoRows.length} informational (decorative, no AA floor).`)
console.log(`- **${failures.length} failing.**`)

if (failures.length > 0) {
  console.log('\n### Failures\n')
  console.log('| Group | Pair | Theme | Against | Ratio | Min |')
  console.log('|---|---|---|---|---|---|')
  for (const f of failures) {
    console.log(`| ${f.group} | ${f.label} | ${f.theme} | ${f.surface} | ${fmt(f.ratio)} | ${f.min}:1 |`)
  }
  console.log('\nNo colour has been changed — this is a listing only, per DESIGN-REWORK.md §11 step 1.')
  process.exitCode = 1
} else {
  console.log('\nNo failures.')
}
