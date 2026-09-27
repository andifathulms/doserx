---
name: DoseRx
description: A weight-based medication dose calculator for bedside use, dressed as a clinical instrument
colors:
  ward-50: "#f2f5f4"
  ward-100: "#e9eeec"
  ward-200: "#dbe3e0"
  ward-400: "#7f8f8b"
  ward-500: "#56655f"
  ward-600: "#3b4a47"
  ward-700: "#1f3140"
  ward-900: "#0f1e2a"
  ward-faint: "#9aa8a4"
  primary: "#0a7066"
  primary-bg: "#dcf1ed"
  primary-border: "#a3d9cf"
  primary-dark: "#075a52"
  mint: "#7fe8d2"
  accent-clay: "#83562d"
  accent-clay-bg: "#f6ebdf"
  warn: "#8a5500"
  warn-bg: "#fff1d9"
  error: "#a92c22"
  error-bg: "#fde9e6"
  success: "#256a3b"
  success-bg: "#e3f3e8"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "'Plus Jakarta Sans Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.1em"
  numeral:
    fontFamily: "'JetBrains Mono Variable', ui-monospace, 'SF Mono', 'Cascadia Code', monospace"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.045em"
rounded:
  xs: "6px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ward-900}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  answer-panel:
    backgroundColor: "{colors.ward-900}"
    textColor: "#e8f0ee"
    numeralColor: "{colors.mint}"
    rounded: "{rounded.xl}"
    padding: "16px"
  result-card:
    backgroundColor: "#ffffff"
    textColor: "{colors.ward-900}"
    rounded: "{rounded.xl}"
    padding: "20px 16px 16px"
---

# Design System: DoseRx

## Overview

**Creative North Star: "The Clinical Instrument"**

DoseRx should feel like a well-made medical instrument — a good infusion pump, a modern bedside monitor — not a reference book and not a SaaS dashboard. Calm, cool, faintly green neutrals carry the structure; one teal means "you can operate this"; and the answer to every calculation sits in one dark readout panel with mint digits, the only dark object on a light screen. The system is built for a doctor's hand at 2am and a 3-second glance: every choice trades decoration for scan speed, and every number a clinician reads under pressure is set in a monospace face whose confusable glyphs (0/O, 1/l/I, 5/S) are unmistakable.

This replaces the earlier "Bedside Notebook" direction (warm paper, serif titles, one blue). The engine, the safety rules and the accessibility discipline carried over unchanged; the visual layer and the structure did not.

**Key characteristics:**
- Cool ward neutrals (green-leaning, never a flat mid-grey) as the structural palette
- Teal for everything operable (links, focus, selection, active nav); ink for primary buttons
- One answer panel per result: ink background, mint dose digits, working shown inside it
- Two type families: Plus Jakarta Sans for reading and operating, JetBrains Mono + tabular-nums for every clinician-read number
- Soft, capped radii (6–20px); pills for chips, route choices and segmented controls
- Near-zero motion on task screens; numbers never animate

## Colors

### Operating colour
- **Clinic Teal** (`#0a7066`, bg `#dcf1ed`, border `#a3d9cf`; dark theme `#4fd1bf`): links, focus ring, selected states, active navigation, the patient bar's controls. Never used for a dose value and never for a drug group.

### Ink
- **Ink** (`#0f1e2a`): primary text, the primary button fill, and the answer panel's background. In dark mode the button inverts (`--c-ink` becomes near-white with ink text) while the answer panel moves to a teal-black (`#0f2b2c`) so it still reads as the one distinct object.

### Readout
- **Readout Mint** (`#7fe8d2`): the dose digits inside the answer panel, and nothing else. ~12:1 on ink.

### Neutral (ward scale)
- **Ward 50** (`#f2f5f4`): canvas. **Surface** `#ffffff`.
- **Ward 100** (`#e9eeec`): secondary surface, tracks.
- **Ward 200** (`#dbe3e0`): decorative hairlines only — never a load-bearing boundary.
- **Ward 400** (`#7f8f8b`): the UI-component boundary tier — meets 3:1.
- **Ward 500 / 600** (`#56655f` / `#3b4a47`): tertiary and secondary text.
- **Ward faint** (`#9aa8a4`): decorative/placeholder only.

### Secondary accent
- **Clay** (`#83562d`, bg `#f6ebdf`): marks a solid preparation (tablet, powder) apart from a liquid dose on the same screen. A clinical distinction, not decoration.

### Signal (warn / error / success)
- **Amber** (`#8a5500` on `#fff1d9`): caps triggered, warnings, the safety disclaimer.
- **Red** (`#a92c22` on `#fde9e6`): validation errors and the Darurat (emergency) section.
- **Green** (`#256a3b` on `#e3f3e8`): the "inside the published range" band zone only — never a verdict.

### Named rules
**The Four Signals Rule.** Outside the drug-group map, the palette carries teal, amber, red and green plus clay. A new UI state does not get a new colour; it is expressed with an existing signal, weight, or icon.

**The Tint-Not-Fill Rule.** Group and signal colours are applied as a tinted background with coloured text or border, never a saturated fill with white text. The two deliberate exceptions are the ink primary button and the ink answer panel — the two things on screen that must win.

**The Colour-Only-Encoding Rule.** No meaning is carried by colour alone; every coloured state also carries a label, an icon, or a position. The band's zones each carry a legend word; group accents always sit next to the group name; signal states pair a tint with an icon or wording.

All pairs are computed by `npm run contrast` (`scripts/contrast-check.mjs`) against both `--c-bg` and `--c-surface`, in both themes — including the ink button and the answer panel's three text tiers.

## Typography

**UI and display:** `'Plus Jakarta Sans Variable'`, falling back to the system sans.
**Numerals:** `'JetBrains Mono Variable'`, falling back to `ui-monospace` — always with `font-variant-numeric: tabular-nums`.

Both are self-hosted latin-only variable woff2 files (`src/fonts.css`, ~68 kB together) and precached by the service worker, so the app renders fully offline after its first load. On a cold first load with no network, the system stacks stand in (`font-display: swap`). Plus Jakarta Sans was designed in Jakarta by Tokotype, which suits an app built for Indonesian practice.

### Hierarchy
- **Page title** (800, 38px / 28px on phones, −0.035em): each route's `<h1>`.
- **Drug name** (800, 24px, −0.03em): the result card heading and drug pages.
- **Body** (400, 16px, 1.55): all prose, labels, buttons, inputs — the floor for anything read as language.
- **Label** (800, 12px, 0.1em, uppercase): eyebrows, readout labels.
- **Dose readout** (mono 800, 48px, −0.045em, mint): the primary value in the answer panel — the largest element on any working screen.
- **Secondary readout** (mono 800, 28px): the volume or drip rate beside it.
- **Derivation line** (mono 400, 14px floor, wraps rather than shrinks): the always-visible chain inside the answer panel, e.g. `14 kg × 50 mg/kg/hari = 700 mg/hari ÷ 4× sehari = 175 mg/kali ÷ 24 mg/mL = 7.29 mL`. Every operand comes from a step the engine computed.

### Named rules
**The Read-vs-Non-Read Rule.** Anything a person reads (prose, values, controls, drug names) sits at 16px or larger. Sub-16px sizes are for non-prose only: uppercase eyebrows, unit suffixes, badges, chips.

**The Two-Family Rule.** Sans for reading and operating, mono for measuring. A number a clinician will act on is never set in the sans.

## Layout

Content-first, capped at an `880px` column with `20px` gutters (`16px` on phones), on a 4px spacing scale. Primary breakpoint `560px` (bottom navigation appears, grids collapse). Every page is guarded against horizontal overflow — `.app` carries `width: 100%; min-width: 0` and `styles.test.ts` fails if either is removed. Interactive targets hold a `24px` floor; the controls a hand aims at one-handed (patient-bar steppers, route chips, bottom navigation, primary buttons) hold `44px` (`--target`).

## Elevation & Depth

Shadows are soft and ink-tinted, used to lift only what needs lifting: the result card (`--sh-md`), the answer panel inside it (`--sh`), and hover states. Most surfaces separate with a 1px border first (**Border-Before-Shadow**).

Dark mode ("Ward Night") is a designed palette, not an inversion, behind a manual persisted toggle — never OS-following — applied before first paint by an inline script. The drug-group accents have their own dark overrides, verified separately by the contrast script.

## Shapes

Radii: `6px` (xs — chips inside panels, weight tag), `10px` (sm — buttons, inputs), `12px` (md — cards, banners), `16px` (lg), `20px` (xl — the result card and answer panel, the destination of every flow). Full pills for filter chips, route choices, fact chips and segmented controls.

## Components

### Answer panel (signature component)
`src/components/AnswerPanel.tsx`, used by every calculator mode. Ink background, `20px` radius. One **primary readout** (label, mint mono value at 48px, unit, sub-line) and an optional **secondary readout** aligned right (usually the volume). **Fact chips** carry context — the published range, the daily total, other drip rates. The **derivation line** sits inside the panel beneath a hairline, always visible.
- One hero number. A published range is a chip, never the hero value.
- A value that cannot be computed shows a dashed `—` with its reason (e.g. "isi konsentrasi stok"), never an omitted tile.
- A capped dose carries a `maks` tag on its label; the full cap explanation sits above the panel.
- Nothing inside it animates.

### Buttons
- **Primary:** ink fill, `--c-on-ink` text, full width, `44px` minimum height, `700` weight.
- **Secondary:** surface with teal text and border; hover fills with the teal tint.
- **Ghost:** transparent, secondary text, hairline border.

### DosePositionBand
A horizontal readout of where a computed dose falls, in mg/kg/day, against the drug's published range and fixed ceiling — Preset and Puyer only. Zones: no fill below the typical range (under-dosing is not an error state), a green-tinted "rentang lazim", an amber-tinted "di atas", and — only with a fixed daily ceiling — a red-tinted "batas maks" past a warn-coloured wall. Zone names appear in a **wrapping legend** below the track (proportional per-zone labels were truncated on phones). The marker is a teal line with its exact value in mono; an off-scale value pins to the edge and turns error-coloured rather than clamping silently.

**The never-invent-a-range rule.** The band renders only when the drug has a published `dosePerKgMin`/`dosePerKgMax` — never an inferred, estimated, or single-point range. A band drawn around invented bounds would be the most dangerous thing in this app.

### Inputs
Surface fill, 1.5px neutral border, `10px` radius, 16px text (so mobile Safari never zooms on focus). Focus shifts the border to teal plus the shared ring.

### Safety disclaimer
An amber-tinted notice block rendered inline, at body size, wherever a dose is about to be acted on. Never collapsed into a tooltip, modal, or toast.

### Print / generated documents
The Puyer recipe's printed output is a standalone document with literal values matching the ward/mono tokens (kept in sync by hand, with a comment saying so). Black-on-white, hairlines in `ward-400`, no fills, system fonts, never themed. Carries drug names, per-dose amounts, signa, tablet-fraction deltas, totals, the optional patient label, the date, and its own copy of the safety disclaimer.

## Do's and Don'ts

### Do
- **Do** put every result in the answer panel, with the derivation line inside it.
- **Do** use the mono face with tabular-nums for every number a clinician reads mid-task.
- **Do** keep teal for things you can operate, and mint for dose digits only.
- **Do** pair every colour with a word, icon, or position.
- **Do** render the safety disclaimer inline and visible near any dose output.
- **Do** run `npm run contrast` after touching any colour token.

### Don't
- **Don't** show a range as the hero value next to a derivation that computes a single number.
- **Don't** animate, count up, or transition a dose value.
- **Don't** use teal for a drug group, or red for anything other than errors and Darurat.
- **Don't** apply the landing page's scroll-reveal to calculator, catalog, or history screens.
- **Don't** add a font from a CDN; fonts are self-hosted and precached, latin subset only.
- **Don't** let the print document follow the app theme.
