# DoseRx — Portfolio Context

_Raw material for a client-facing case study. Factual, specific to this codebase._

---

## 1. One-line summary

A clinical dose calculator web app that takes a patient's weight and instantly outputs the correct drug amount and liquid volume to administer — built for use at the bedside under time pressure.

---

## 2. The problem

Calculating weight-based medication doses is repetitive, error-prone arithmetic that a doctor has to redo for every patient — multiply mg/kg by weight, divide by frequency, convert to mL, check against maximum limits. This is especially high-stakes for pediatric patients where dosing is weight-sensitive and errors are dangerous. The alternative to doing this mentally or on a phone calculator is to use institutional paper references or generic spreadsheets, neither of which is fast or mobile-friendly.

**Primary user:** a practicing doctor, working solo on both phone (bedside) and desktop. No multi-user, no auth, no backend required.

---

## 3. My role

Built from scratch — project scaffolded, all calculation logic, UI components, data, and deployment pipeline written by me. No inherited codebase. The PRD was provided as a product spec; everything else (architecture decisions, feature scope expansion, UI/UX design, Indonesian clinical context) was my implementation.

---

## 4. Technical approach

The central decision was to keep the calculation engine (`src/lib/calculate.ts`) completely pure — no DOM, no React, no side effects — so it can be unit-tested in isolation and reused across all four calculator tabs without coupling. The engine takes typed inputs, validates them, applies dose caps, and returns a discriminated union result (`CalcResult | CalcError`) so the UI can't accidentally render a failed calculation as a valid one.

Persistence is handled through a small `storage.ts` wrapper around `localStorage`, typed to the history-entry schema — easy to swap for an API later without touching any component code.

The Puyer tab (compounded medicine calculator, specific to Indonesian clinical practice) required a separate multi-drug recipe engine on top of the base calculator: it runs `calculate()` per drug in a batch, generates a combined recipe card with tablet-fraction arithmetic, and outputs a print-ready recipe.

The IV infusion calculator (`calculateInfusion.ts`) adds a second pure engine for a fundamentally different problem domain — drip rates in mL/hr and drops/min — sharing only the input validation pattern.

As the drug catalog grew to 92 entries, the single `drugs.ts` file was split into seven domain modules (`analgesics`, `antiinfectives`, `antiparasitics`, `cardiorespiratory`, `emergency`, `gastro-allergy`, `steroids-nutrition`) behind a barrel `index.ts`, with a shared `types.ts`. The `DrugPreset` interface separates **calculation fields** (consumed by `calculate.ts`) from **display-only catalog metadata** (dosing source/reference, search aliases, indications, side effects, contraindications, warnings, minimum age/weight, and per-preparation pack sizes) — so enriching the catalog for the UI never risks the calculation path.

Deployed as a static site (no server) via GitHub Actions → GitHub Pages, with PWA support so it can be installed to a phone home screen and used offline.

---

## 5. Actual tech stack

| Layer | Tool | Version |
|---|---|---|
| UI framework | React | 18.3 |
| Language | TypeScript | 5.5 |
| Build tool | Vite | 5.4 |
| Testing | Vitest | 2.0 |
| PWA | vite-plugin-pwa | 1.3 |
| Styling | Plain CSS (no framework) | — |
| Persistence | browser localStorage | — |
| CI/CD | GitHub Actions → GitHub Pages | — |

No UI library, no state management library, no router — the app is small enough that none were needed.

---

## 6. Notable features

- **Preset drug grid** — 92 drugs across 16 therapeutic categories (Gawat Darurat, Analgesik/NSAID, Antibiotik, Antikonvulsan, Kardiovaskular, Kortikosteroid, etc.), each with dose range, max caps, stock concentration, dosing reference (IDAI/BNFc/WHO/Fornas), and clinical notes; selecting one pre-fills the form instantly. Searchable by name, brand/alias, and indication.
- **Drug monograph ("Detail Obat")** — a collapsible per-drug panel showing available preparations/pack sizes (Sediaan), side effects (efek samping), contraindications, warnings, and minimum age/weight — a calm reference layer that stays out of the way until tapped.
- **Recents & favorites** — the most-recently-used and starred drugs surface at the top of the picker, keyed by stable drug id and persisted locally, so a large catalog stays fast to navigate one-handed.
- **Per-kali / per-hari dose entry toggle** — the doctor can enter or read doses as per single administration or per full day; the preference is persisted and honored consistently across Preset and Puyer tabs.
- **Indonesian medicine availability suggestions** — after calculating a per-dose amount, the app suggests specific tablet fractions or liquid volumes available in Indonesian pharmacies (e.g. "½ tab 500mg", "2.5 mL syrup 125mg/5mL"), snapping to practical fractions used in local clinical practice (¼, ½, ¾, 1, 1½, 2...).
- **Puyer calculator** — multi-drug compounded medicine calculator specific to Indonesian practice; batches up to several drugs, calculates each dose individually, and outputs a combined recipe card (with total tablet counts and signa) that can be printed or copied to clipboard.
- **IV infusion rate calculator** — separate engine supporting mcg/kg/min, mcg/kg/hr, mg/kg/hr, and unit/kg/hr dose units; outputs mL/hr pump rate plus macro/micro drip rates for manual infusion.
- **Custom drug presets ("Kustom" tab)** — the doctor can define and save their own drug presets (dose/kg, frequency, caps, concentration) to localStorage and reuse them like built-ins.
- **Weight-from-age estimator** — integrated into the weight field; enter patient age (years/months) and the app estimates weight using APLS and Luscombe-Owens pediatric formulas, labeled clearly as an estimate.
- **History with notes** — calculation history persists across sessions; each entry can carry an editable free-text note, and the whole log lives in a header drawer rather than crowding the calculators.
- **Offline-capable PWA** — installable to a phone home screen and fully usable without a network connection once loaded.

---

## 7. Challenges / tradeoffs

**Scope expanded far beyond the original PRD, over ~3.5 weeks of iteration.** The PRD specified 8 seed drugs and three panels (Preset, Custom, History). The build added a Puyer panel and an IV Infusion panel, Indonesian availability suggestions, and a weight estimator in the first day (commits `ad88c1f`, `b14d054`, `fd36bce`). It then kept growing across later sessions: the catalog expanded from 8 → 28 → **92 drugs across 16 categories**, split into 7 domain modules (`107fb58`); recents/favorites (`93f814d`); a per-kali/per-hari dose toggle (`0a3d380`, `1d3083d`); a per-preparation dosing engine and drug monographs with side-effect/pack-size content (`297a64a`, `027d8a4`, and the three most recent `content(data)` commits); plus a dark-mode/a11y pass and a fresh medical-teal palette (`fd478f1`, `9a681be`).

**Puyer fraction arithmetic.** Compounded powder sachets (puyer) require rounding per-dose amounts to tablet fractions physically cuttable in practice (¼, ½, ¾ tab). A naive round-to-nearest-integer would produce wrong or unphysical quantities. The solution (`src/lib/suggest.ts`) snaps to a predefined `SOLID_FRACTIONS` array representing clinically practical quantities, and shows the actual delivered dose alongside the target so the clinician can see any rounding delta.

**Dose override UX on presets.** The PRD assumed preset values would be used as-is, but in practice a doctor may want to override the dose/kg within a range. Added amber indicator + reset button when a preset's dose is modified (`feat(preset): dose override UX` commit), plus a bug fix in the next commit when the override wasn't being passed to the calculation correctly — evidence the interaction was non-trivial.

**No TypeScript strict-mode gotchas on numeric safety.** Rather than runtime guards scattered everywhere, the calculation engine returns a union type (`CalcOutput = CalcResult | CalcError`) and all display code is forced to branch on `result.valid` before touching any numeric fields. This eliminates the NaN/Infinity display class of bugs structurally.

---

## 8. Status

- **Deployed and live** on GitHub Pages via automated CI (GitHub Actions workflow in `.github/workflows/deploy.yml`).
- **Public repository** (inferred from GitHub Pages deployment targeting the `main` branch on push).
- **Prototype / personal tool** status — built for one user (the doctor), not a commercial product. No analytics, no user accounts, no server.
- Safety disclaimer is visible in the app (hard requirement from PRD §7).

---

## 9. Metrics

| Metric | Value |
|---|---|
| Total commits | 39 |
| Development timespan | ~3.5 weeks (2026-06-20 → 2026-07-13) |
| Lines of code (TS/TSX) | ~5,000 |
| React components | 10 (Preset, Custom, Puyer, Infusion, History, DrugGrid, ResultCard, WeightInput, Tabs, App shell) |
| Pure library modules | 5 (`calculate`, `calculateInfusion`, `estimateWeight`, `storage`, `suggest`) |
| Drug catalog | 92 drugs across 16 categories, split into 7 typed domain modules |
| Calculator tabs | 4 (Preset, Kustom, Puyer, Infus) + History drawer |
| Unit tests | `calculate.test.ts` — covers normal calc, max-daily cap, max-single cap, missing concentration, invalid inputs |

---

## 10. Suggested screenshots

| # | What to capture | Why it's interesting | Relevant component |
|---|---|---|---|
| 1 | **Preset tab — after selecting a drug and entering weight** — show the filled form with dose range, the calculated result card (mg + mL), and the availability suggestions (tablet fraction or syrup volume) | Demonstrates the core flow from "select drug → enter weight → instant result" in one frame | [src/components/PresetPanel.tsx](src/components/PresetPanel.tsx), [src/components/ResultCard.tsx](src/components/ResultCard.tsx) |
| 2 | **Puyer recipe card** — a multi-drug recipe with 2–3 drugs, showing per-drug doses and the combined recipe output with tablet counts and signa, with the copy/print buttons visible | Most unique feature; shows the Indonesian-specific clinical context and the recipe card UI | [src/components/PuyerPanel.tsx](src/components/PuyerPanel.tsx) |
| 3 | **Drug grid / category filter** — the 92-drug grid filtered to a category (e.g. "Gawat Darurat") or searched by name/indication, showing category color chips, recents/favorites, and the search/filter UX | Shows the breadth of the drug library and the visual design system | [src/components/DrugGrid.tsx](src/components/DrugGrid.tsx) |
| 4 | **IV Infusion calculator with result** — filled form with weight, dose, and concentration; showing mL/hr + macro/micro drip rate output | Second distinct calculation domain; shows the app's range beyond simple mg/kg math | [src/components/InfusionPanel.tsx](src/components/InfusionPanel.tsx) |
| 5 | **Drug monograph ("Detail Obat") expanded** — the collapsible panel open on a drug, showing Sediaan/pack sizes, side effects, contraindication, and warning | Shows the clinical-reference depth of the catalog and the calm, tap-to-reveal IA | [src/components/PresetPanel.tsx](src/components/PresetPanel.tsx) |
