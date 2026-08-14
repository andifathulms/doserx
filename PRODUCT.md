# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a practicing doctor in Indonesia, calculating weight-based medication doses at the bedside (phone) and at a desk (desktop), often under time pressure — for pediatric and general patients. Originally built as a single-user personal tool; the doctor is now considering it as a real product/portfolio piece, potentially shared with other clinicians informally (still no accounts or multi-tenancy).

## Product Purpose

Eliminates repetitive, error-prone manual arithmetic (mg/kg × weight ÷ frequency → mL, checked against max-dose caps) for weight-based dosing. Ships with a large preset drug catalog so most calculations require only entering a patient weight, plus dedicated calculators for compounded powders (puyer) and IV infusion rates. Success is going from "patient weight known" to "mg + mL to administer" in under 10 seconds for any preset drug, with zero manual arithmetic and history that reliably persists across sessions.

## Positioning

Indonesian clinical context is the core differentiator — a generic mg/kg calculator could not truthfully claim this. Dosing references are sourced from IDAI/BNFc/WHO/Fornas; a dedicated Puyer (compounded powder) recipe engine handles multi-drug batching with clinically practical tablet-fraction rounding specific to Indonesian pharmacy practice; and post-calculation suggestions map computed doses to actual Indonesian pharmacy availability (e.g. "½ tab 500mg", "2.5 mL syrup 125mg/5mL").

## Operating Context

- Used at the bedside on a phone under time pressure, and at a desk on larger screens — one-handed mobile usability matters as much as desktop comfort.
- Deployed as an installable, offline-capable PWA (GitHub Pages via CI) — must work fully offline once loaded, no required network calls for core calculation.
- Four calculator tabs (Preset, Kustom/Custom, Puyer, Infus) plus a History drawer accessed from the header rather than a separate page.
- Drug catalog organized into 16 therapeutic categories (Gawat Darurat, Analgesik/NSAID, Antibiotik, Antikonvulsan, Kardiovaskular, Kortikosteroid, etc.), searchable by name, brand/alias, and indication; recents and favorites surface at the top for fast one-handed navigation.

## Capabilities and Constraints

- Calculation engine (`calculate.ts`) is pure (no DOM, no React), returns a discriminated union (`CalcResult | CalcError`) so invalid calculations can't be rendered as valid; every numeric output is validated/rounded before display (never NaN/Infinity/unrounded floats).
- Separate pure engines exist for IV infusion rates (mcg/kg/min, mcg/kg/hr, mg/kg/hr, unit/kg/hr → mL/hr + drip rates), weight-from-age estimation (APLS/Luscombe-Owens formulas, labeled as an estimate), and puyer tablet-fraction rounding (`suggest.ts`, snapping to ¼/½/¾/1/1½/2... practical fractions).
- Persistence is client-side only via a typed `localStorage` wrapper (`storage.ts`) — history entries, custom presets, recents/favorites, and the per-kali/per-hari display preference. No backend, no accounts, no analytics.
- Patient labels in history are nudged toward short labels/initials only — no collection of full patient names (privacy constraint from the original PRD, still binding).
- **Confirmed in-scope exception:** the Puyer panel's print/copy-to-clipboard output for compounded recipe cards is intentional and stays in scope, despite the original PRD's blanket "no prescribing/export" language.
- **Still out of scope:** drug-interaction checking, multi-user auth/accounts, a full prescribing workflow or general PDF export beyond the Puyer recipe card, regulatory/clinical certification. This remains a calculation aid, not a clinical decision support system.
- Custom drug presets: the doctor can define and save their own presets (dose/kg, frequency, caps, concentration) to localStorage and reuse them like built-in presets.

## Brand Commitments

- Name: DoseRx.
- A medical-teal palette and a dark-mode/accessibility pass are already implemented in the codebase (see current CSS/tokens) and are the incumbent visual authority — not to be treated as an open aesthetic decision.
- Indonesian-language UI copy for drug/category names and clinical terminology (e.g. "Puyer", "Kustom", "Infus", "Sediaan", "Detail Obat") is an established convention, not a translation gap.

## Evidence on Hand

- `PRD.md` — original product spec (8 seed drugs, 3 panels); scope has since expanded substantially (see below) and PRD.md is historical, not current scope.
- `PORTFOLIO_CONTEXT.md` — detailed factual record of build history, technical decisions, challenges, and metrics (92 drugs / 16 categories / 4 calculator tabs / ~5,000 LOC / ~3.5 weeks of iteration), useful as evidence for case-study or positioning work.
- Real drug catalog data exists in `src/data/drugs/` (7 domain modules + barrel), including dosing sources (IDAI/BNFc/WHO/Fornas), side effects, contraindications, warnings, minimum age/weight, and pack sizes per drug — this is real clinical reference content, not placeholder data.
- No user testimonials, case studies, or external press exist; none should be fabricated if this becomes portfolio-facing.

## Product Principles

1. The calculation engine's correctness and purity are non-negotiable — every feature (Preset, Kustom, Puyer, Infus) sits on top of pure, unit-tested calculation modules, never duplicates arithmetic in UI code.
2. Speed and one-handed usability at the bedside outrank feature breadth in any interaction that sits on the core "weight in → dose out" path.
3. Indonesian clinical specificity (dosing sources, puyer compounding, local pharmacy availability) is the product's real value and should be preserved and deepened, not generalized away.
4. Never show an unvalidated or unrounded number; never let a capped/warned dose look identical to an uncapped one.
5. This is a calculation aid, not a clinical decision-support or prescribing system — the safety disclaimer is a hard requirement on every relevant surface, not a buried footnote.

## Accessibility & Inclusion

A dark-mode/accessibility pass has already been implemented (per commit history); no additional standard (e.g. WCAG level) has been explicitly required beyond that existing pass.
