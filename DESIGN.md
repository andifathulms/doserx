---
name: DoseRx
description: A weight-based medication dose calculator for bedside use, in warm-editorial clinical dress
colors:
  stone-50: "#fbfbfa"
  stone-100: "#f7f6f3"
  stone-200: "#eaeaea"
  stone-400: "#948e81"
  stone-500: "#75716b"
  stone-600: "#57534e"
  stone-700: "#333333"
  stone-900: "#111111"
  stone-faint: "#a19c93"
  primary: "#1f6c9f"
  primary-bg: "#e1f3fe"
  primary-border: "#b9e0f8"
  primary-dark: "#185a84"
  accent-clay: "#8b5e34"
  accent-clay-bg: "#f5ebe0"
  accent-clay-border: "#e8d9c5"
  warn: "#8a5a00"
  warn-bg: "#fbf3db"
  warn-border: "#f0e2b0"
  error: "#9f2f2d"
  error-bg: "#fdebec"
  success: "#346538"
  success-bg: "#edf3ec"
typography:
  display:
    fontFamily: "ui-serif, Georgia, 'Iowan Old Style', 'Times New Roman', serif"
    fontSize: "clamp(2rem, 6vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "ui-serif, Georgia, 'Iowan Old Style', 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.09em"
  numeral:
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', monospace"
    fontSize: "2.375rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.045em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
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
    backgroundColor: "#111111"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "#333333"
  button-secondary:
    backgroundColor: "{colors.stone-50}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.stone-600}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  input-field:
    backgroundColor: "#ffffff"
    textColor: "{colors.stone-900}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  drug-card:
    backgroundColor: "#ffffff"
    textColor: "{colors.stone-900}"
    rounded: "{rounded.sm}"
    padding: "12px"
  result-card:
    backgroundColor: "#ffffff"
    textColor: "{colors.stone-900}"
    rounded: "{rounded.lg}"
    padding: "20px 16px 16px"
---

# Design System: DoseRx

## Overview

**Creative North Star: "The Bedside Notebook"**

DoseRx reads like a well-kept clinical reference book, not a SaaS dashboard: warm paper-white surfaces, a near-black ink color for text, one restrained blue for interactive meaning, and a serif reserved for the moments the app is naming something (a drug, a page title) rather than asking for input. The system is built for a doctor's hand at 2am and a doctor's eye during a 3.5-second glance — every choice trades decoration for scan speed, and every number a clinician reads under time pressure gets its own typeface (monospace, tabular) so digits never shift or misalign.

The palette is deliberately narrow: exactly four semantic pastel pairs (primary/blue, warn/yellow, error/red, success/green), each a WCAG-verified text-on-background pair rather than a raw hue, plus one documented second accent (clay/tan) that exists for a single real clinical distinction — marking a solid preparation (tablet/powder) apart from a liquid dose shown elsewhere on the same screen. The one exception to "four pastels only" is the 17-color category-accent map used across the 92-drug catalog: each hue is a desaturated, darkened pass calibrated so the grid stays visually triaged without reading as a rainbow SaaS palette, with the loudest red reserved for true emergencies.

Motion is almost entirely absent from the working screens on purpose. The calculator, catalog, and history views are dense forms a clinician revisits repeatedly under time pressure — motion on every view there is friction, not sophistication. The one motion pattern in the system, a scroll-triggered fade-and-rise, is scoped to the landing/about pages only, where a first-time visitor is reading rather than working.

**Key Characteristics:**
- Warm stone neutrals (never cool gray, never pure black/white) as the entire structural palette
- One accent hue doing real interactive work (links, focus, the CTA-adjacent "primary" role) plus one documented clay secondary for a real clinical distinction — no decorative color
- Serif for naming (titles, drug names), sans for asking (UI chrome, forms, buttons), monospace+tabular-nums for every clinician-read number
- Crisp, capped corner radii (4–12px); pills reserved for chips, tags, and segmented controls only
- Near-zero motion on task screens; a single quiet scroll-reveal reserved for editorial/landing content
- System font stacks only — no webfont dependency, by requirement (the app must render fully offline from a cold load)

## Colors

The palette reads as warm paper and ink first, color second — chosen so the one blue accent and the four semantic pastels stay legible signals rather than background noise.

### Primary
- **Clinical Blue** (`#1f6c9f`, bg `#e1f3fe`, border `#b9e0f8`): the app's single interactive accent — links, active tab, focus ring, selected states, and the "primary" result value (the dose the clinician actually needs). Reserved for meaning, not decoration; large fills of it are avoided in favor of the tinted background pairing.

### Secondary
- **Clay** (`#8b5e34`, bg `#f5ebe0`, border `#e8d9c5`): the one documented second accent. Exists for a specific clinical need — distinguishing a solid preparation (tablet/powder) from a liquid dose shown elsewhere on the same screen — never used as decoration or as an alternate brand color.

### Neutral
- **Stone 50 / Warm Paper** (`#fbfbfa`): app background.
- **Stone 100** (`#f7f6f3`): secondary surface fill (e.g. inside result values, inactive tab track).
- **Stone 200** (`#eaeaea`): decorative hairlines only — never a load-bearing UI-component boundary.
- **Stone 400** (`#948e81`): the real UI-component-boundary tier — meets 3:1, used wherever a border must be perceivable as a control edge.
- **Stone 500 / 600** (`#75716b` / `#57534e`): secondary and tertiary text.
- **Stone 900 / Near-Black Ink** (`#111111`): primary text and the primary button fill — never pure `#000`.
- **Stone Faint** (`#a19c93`): decorative or placeholder text only — below the bar for load-bearing copy.

### Semantic (warn / error / success)
- **Warm Amber** (text `#8a5a00`, bg `#fbf3db`): warnings, dose caps triggered, favorited state, safety-disclaimer accent.
- **Muted Brick** (text `#9f2f2d`, bg `#fdebec`): inline validation errors.
- **Muted Green** (text `#346538`, bg `#edf3ec`): success/confirmation states.

### Category accent map (catalog only)
A 17-entry `data-cat` → color map is the single source of truth for every element that needs to signal a drug's therapeutic category (drug cards, category chips, swatches). Each value is a desaturated, darkened pass over a vivid base hue (~55% of original saturation, lightness clamped 28–40%). Computed via `scripts/contrast-check.mjs`: on white (`--c-surface`, light theme) every value clears at least 4.64:1, most well above it — one exception, `Antiparasit` (`#368352`), reads 4.48:1 against the app's own `--c-bg` canvas (still ≥4.5:1 on white; a known, not-yet-closed gap on the warmer background, tracked rather than silently accepted). A separate dark-theme pass (`:root[data-theme="dark"] [data-cat="…"]` overrides, same hues lightened and desaturated further) clears at least 4.58:1 on the dark surface and 5.01:1 on the dark background — checked independently, since the light-theme values alone read as low as ~2:1 against a dark surface and cannot be reused as-is. `src/data/categoryColors.ts` is the type-checked source of truth behind both passes: it's a `Record<DrugCategory, …>`, so TypeScript won't compile if a category is missing an entry, and `categoryColors.test.ts` fails the suite if `index.css`'s rules drift from it. Brick red (`#953737`) is reserved exclusively for "Gawat Darurat" (emergency) so its alarm meaning is never diluted by reuse elsewhere. Indigo, not blue, represents "Antibiotik" — blue is already the app's primary accent, so reusing it for a category would blur that meaning.

### Named Rules
**The Four Pastels Rule.** Outside the category-accent map, the palette carries exactly four semantic hues (primary, warn, error, success) plus one documented clay secondary. A new UI state does not get a new color; it's expressed with an existing semantic hue, weight, or icon.

**The Tint-Not-Fill Rule.** Category and semantic colors are applied as a tinted background + colored text/border, never as a solid saturated fill with white text. Large saturated fills read as generic SaaS; this system reads as a reference book.

**The Colour-Only-Encoding Rule.** No meaning is carried by colour alone; every coloured state also carries a label, an icon, or a position. The category map pairs every accent with a name, never a bare swatch; `DosePositionBand`'s zones each carry a text label so the band reads fully with colour removed; semantic states (warn/error/success) pair a tint with an icon or wording, never the tint alone.

## Typography

**Display/Headline Font:** `ui-serif, Georgia, 'Iowan Old Style', 'Times New Roman', serif`
**Body/UI Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
**Numeral Font:** `ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', monospace`

**Character:** The serif is used sparingly and only to *name* something — a page title, a drug name heading, the landing headline — never for body copy or a button. The sans stack runs everything a person operates: forms, buttons, nav, labels. The monospace face, always paired with `font-variant-numeric: tabular-nums`, carries every number a clinician reads under pressure (doses, mL, weights, timestamps) so digits align and never jitter between states.

### Hierarchy
- **Display** (700, `clamp(2rem, 6vw, 3rem)`, 1.08 line-height, serif): landing page hero title only.
- **Headline** (700, 1.125rem/18px, 1.15 line-height, serif): the result card's drug name — the one place inside the working app the serif appears.
- **Title** (700, 1.5–1.75rem/24–28px, sans): panel headings, app title.
- **Body** (400, 1rem/16px, 1.55 line-height, sans): all prose, form labels, buttons, inputs — the type-scale floor for anything a person reads as language.
- **Label** (700, 0.75rem/12px, 1.15 line-height, 0.09em letter-spacing, uppercase, sans): eyebrow labels, tabs-group headers.
- **Numeral (hero)** (800, 2.375rem/38px, 1.1 line-height, -0.045em letter-spacing, monospace, tabular-nums): the calculated dose — the single largest, boldest element on the result screen, deliberately bigger and bolder than the brand name.
- **Derivation line** (400, `--fs-sm`/14px floor — never shrinks smaller, wraps instead, monospace, tabular-nums): the always-visible one-line chain (`18 kg × 10 mg/kg = 180 mg/hari ÷ 3 = 60 mg/kali`) beneath the hero number in every calculator mode. Every operand traces back to a step the engine already computed; the full multi-line "Cara hitung" trail stays as a `<details>` beneath it.

### Named Rules
**The Read-vs-Non-Read Rule.** Anything a person *reads* (prose, values, form controls, buttons, drug names) sits at `--fs-base` (16px) or larger. Sub-16px sizes are reserved for non-prose only: uppercase eyebrows, unit suffixes, count badges, chips.

**The Three-Family Rule.** Sans for asking (UI chrome), serif for naming (titles, drug names), monospace for measuring (every clinician-read number). A component never borrows a family outside its job.

## Layout

Single-column, content-first layout capped at a `820px` max-width container with `20px` horizontal padding — sized for a form-and-result flow read top-to-bottom on a phone, not a multi-column dashboard grid. Spacing runs on a 4px base scale (4/8/12/16/20/24/32/40/48px); raw pixel values outside that scale are avoided.

The drug picker is the one true grid: `repeat(auto-fill, minmax(148px, 1fr))`, so it reflows from a two-column phone layout to a wide desktop grid without a breakpoint-specific column count. Primary breakpoints are `560px` (mobile/tablet threshold, e.g. bottom nav appears, result-value grid collapses to one column) and `640–680px` (secondary desktop refinements). Interactive targets hold a `24px` (`--target-min`) floor even where WCAG would exempt inline text controls, since these are controls a tired hand aims at one-handed.

Primary navigation collapses from a top site-nav (desktop) to a fixed bottom tab bar (mobile, `≤560px`) — a native-app pattern chosen because the core flow is used one-handed at arm's length, not scrolled to from a header.

## Elevation & Depth

Shadows are ultra-diffuse and warm-tinted (never a cool slate/blue-black), used sparingly to lift only the result card and interactive hover states off the page — most surfaces (drug cards, inputs, chips) are flat with a 1–1.5px border doing the separation work instead of a shadow. Dark mode redefines the same shadow roles at higher opacity against true black rather than inventing a new vocabulary.

Dark mode ships behind a manual, persisted toggle in the header — not OS-following, and not on by default even when the system preference is dark. A doctor who wants it chooses it; an inline boot script applies it before first paint so there is no light-theme flash on a night-shift load. The token layer's dark values were WCAG-verified when they were written, but they are not a costless palette swap: the 17-entry category accent map is a plain hex per category with no relationship to the `--c-*` semantic tokens, so shipping the toggle required its own separate dark-theme verification and its own dark override rules — see the Category accent map section above. Any future colour surface that isn't built from `--c-*` tokens needs the same treatment before dark mode can be trusted on it.

### Shadow Vocabulary
- **xs** (`0 1px 2px rgba(40,35,28,.03)`): resting state of interactive cards (drug card, active tab).
- **sm** (`0 1px 3px rgba(40,35,28,.04), 0 1px 2px rgba(40,35,28,.03)`): hover state of interactive cards, primary button hover.
- **default** (`0 2px 6px rgba(40,35,28,.04), 0 1px 3px rgba(40,35,28,.03)`): primary button hover (heavier step).
- **md** (`0 6px 16px rgba(40,35,28,.045), 0 2px 6px rgba(40,35,28,.03)`): the result card at rest — the one surface allowed to look "lifted" by default, since it's the answer the whole flow exists to produce.
- **ring** (`0 0 0 3px var(--c-focus)`): the single focus-visible treatment used everywhere in place of a native outline.

### Named Rules
**The Border-Before-Shadow Rule.** A component reaches for a 1–1.5px border first; a shadow is added only when a surface needs to read as physically raised above its neighbors (the result card, an active/hovering interactive card).

## Shapes

Radii are crisp and capped, never pill-shaped by default: `4px` (xs, tight elements like focus outlines on inline links), `6px` (sm, the default for buttons, inputs, chips proper, drug cards), `8px` (md, the tab-group track), `12px` (lg, the result card — the one surface allowed the roundest corner because it's the destination of the flow). Full pill radius (`9999px`) is reserved specifically for tag/badge/segmented-control shapes: category filter chips and the language toggle, never for cards or buttons. Category identity on a card is carried by a `3px` left border accent rather than a corner treatment or icon.

## Components

### Buttons
- **Shape:** `6px` radius, `1.5px` border (transparent on primary/ghost by default), `600` font-weight, `-0.01em` letter-spacing.
- **Primary:** solid near-black fill (`#111111` on `#fff` text) at full width, `12px` padding — deliberately *not* the accent blue. The CTA is treated as a UI convention here, not a place to spend the app's one accent hue. Hover deepens to `#333333` with a light shadow lift.
- **Secondary:** white/surface background, blue text and border (`--c-primary` / `--c-primary-bdr`); hover fills with the primary tint background.
- **Ghost:** transparent background, secondary-gray text and border; hover fills with the surface color and darkens text/border.
- **Disabled:** `0.5` opacity, `not-allowed` cursor, no other pseudo-states.
- **Focus:** the shared focus ring (`0 0 0 3px` primary blue), never a native outline.

### Cards
- **Drug card** (the picker's core unit): white surface, `1.5px` border, a `3px` left-edge border in the drug's category color (falling back to the mid-gray border tone when uncategorized), `6px` radius, `xs` shadow at rest. Hover lifts 1px with a category-tinted background (`color-mix` at 9% of the category hue over the surface color) and a category-colored border — the same tint mechanism works unmodified in dark mode. Selected state uses a `2px` category-colored border plus a soft `35%`-opacity color-mix ring rather than a filled background, so "selected" stays visually distinct from "hovered."
- **Result card:** white surface, `1.5px` border, `12px` radius (the roundest surface in the system), `md` shadow — the one card allowed to look physically lifted, since it holds the calculated answer. The drug-name heading inside it is the app's one working-screen use of the serif family.

### DosePositionBand
A horizontal readout of where a computed dose falls, in mg/kg/day, against the drug's published range and fixed ceiling — Preset and Puyer only (the two modes with a published range to plot against). Four zones, left to right: no fill below the typical range (under-dosing is not an error state, never tinted as one), a success-tinted "rentang lazim" band, a warn-tinted band above it, and — only when the drug has a fixed daily ceiling — an error-tinted band past a `2.5px` warn-colored wall. The marker is a `2px` primary-colored line ending in a dot, labelled with the exact value in the mono/tabular family; an out-of-domain value pins to the edge and turns error-colored rather than clamping silently. Puyer's per-row variant drops to `12px` with no inline labels (a shared legend states the four zones once above the list) and adds a hairline at each row's own range-minimum as a scan landmark, not a claim that positions compare across rows with differing scales.

**The never-invent-a-range rule.** The band renders only when the drug has a published `dosePerKgMin`/`dosePerKgMax` in the catalog — never with an inferred, estimated, or single-point range. Absence of a published range is itself clinical information; a band drawn around invented bounds would be the most dangerous thing in this app. This rule is load-bearing enough to live here, not only in the component's own source.

### Chips
- **Category filter chip:** pill radius (`9999px`), `1.5px` border, secondary-gray text at rest. Active state uses a category-tinted background (12% color-mix) and a category-colored border and text — never a solid fill, per the Tint-Not-Fill rule.

### Inputs / Fields
- **Style:** white surface, `1.5px` border in the neutral border tone, `6px` radius, `16px` body-size text (never smaller, so mobile Safari doesn't auto-zoom on focus).
- **Focus:** border shifts to primary blue plus the shared focus ring; no other focus decoration.
- **Placeholder:** tertiary text color, never full-strength text color.

### Navigation
- **Desktop (site-nav):** horizontal text links, `600` weight, secondary-gray at rest; active link gets primary-tinted background + darker primary text. Hover is a flat surface-color fill, no underline.
- **Mobile (`≤560px`, bottom-nav):** fixed bottom tab bar replaces the top nav — a native-app affordance chosen because the core flow is operated one-handed at arm's length.
- **In-app tabs (Preset/Kustom/Puyer/Infus):** a segmented control — flat gray track, `8px` radius, active segment lifts to the surface color with an `xs` shadow and turns primary-blue, `700` weight.

### Safety disclaimer / banner (signature component)
A recurring bordered notice block (white surface, `1px` border, `3px` warn-colored left accent, `6px` radius) used for both the landing-page legal disclaimer and the in-app safety banner shown near every dose decision. This is the one component the product treats as non-negotiable per PRODUCT.md — it is never collapsed into a tooltip, modal, or dismissible toast; it renders inline, at body-text size, wherever a dose is about to be acted on.

### Print / generated documents
The Puyer recipe's printed and copied output is a surface of this design system, not an implementation detail of `PuyerPanel` — it is the one output that leaves the screen and reaches a pharmacy. It is a standalone document (opened via `document.write()` into a popup, with no link to `index.css`), so it is built on literal values matching the stone/mono token block rather than `var()` against the app's stylesheet, kept in sync by hand with a comment saying so. Black text on white, hairline dividers in `stone-400` (not the near-invisible-on-paper `stone-200`), no background fills, no colour beyond ink — it never follows the app's theme, since it defines no dark-mode rule at all. Carries drug names, per-dose amounts, a signa line, tablet-fraction delivered-vs-target deltas (from `suggest.ts`'s `describeForms`), total counts per drug, the optional patient label, the date, and its own copy of the safety disclaimer as a bordered block — a printed sheet outlives the app session and cannot rely on framing that only exists on screen.

## Do's and Don'ts

### Do:
- **Do** keep the interactive accent to one hue (clinical blue) outside the category-accent map and the one documented clay secondary.
- **Do** use the monospace/tabular-nums family for every number a clinician reads mid-task (doses, mL, weights, timestamps).
- **Do** express category identity through the shared `data-cat` color map and the `color-mix()` tint mechanism, never a hardcoded hex per component.
- **Do** keep interactive targets at a `24px` floor even for controls that sit inline with text.
- **Do** render the safety disclaimer inline and visible near any dose output — never in a tooltip, modal, or toast.
- **Do** reach for a border before a shadow; reserve shadow for a surface that genuinely needs to look physically lifted (the result card, hover states).

### Don't:
- **Don't** use a solid saturated color fill with white text for a category, tab, or status — tint the background and color the text/border instead.
- **Don't** apply the landing page's scroll-reveal fade to the calculator, catalog, or history screens — those are dense working forms revisited under time pressure, where motion is friction.
- **Don't** load a webfont or CDN font asset; the app must render fully offline from a cold first load, and the three system stacks already cover every typographic job.
- **Don't** reuse the primary blue for a drug category color — blue is reserved for the app's single interactive-accent meaning.
- **Don't** let pure black (`#000`) or pure white/cool-gray neutrals creep in; every neutral in the system is warm-tinted (stone/paper), including shadows (`rgba(40,35,28,…)` in light mode, never a cool slate-black).
