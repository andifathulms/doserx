---
target: doserx (whole app)
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-14T05-09-53Z
slug: doserx-whole-app
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live regions (`role="status"`/`role="alert"`) cover calc results, estimates, and the Puyer recipe, but the "Hitung" button has no pressed/loading micro-state (low-risk given instant local calc, not zero-risk). |
| 2 | Match Between System and Real World | 4 | "Dosis/kali" as the primary number and the mg/kg/hari-as-source-of-truth + per-kali/per-hari toggle match how clinicians actually think about dosing. |
| 3 | User Control and Freedom | 3 | "Ganti obat"/"Ubah pilihan" reversal is well focus-managed, but "Hapus semua" in History drops to a native `window.confirm()` with no undo. |
| 4 | Consistency and Standards | 3 | `DrugCalculator` is shared between Preset and the `/obat/:id` catalog page by design — but Puyer independently reimplements the same dose-mode toggle rather than sharing it, undercutting the app's own stated discipline. |
| 5 | Error Prevention | 3 | The `CalcResult \| CalcError` discriminated union structurally prevents invalid states from rendering, and dose-picker buttons avoid hand-retyping — but numeric inputs accept negative/garbage values with no inline flag, caught only post-submit. |
| 6 | Recognition Rather Than Recall | 3 | Selected-drug bar and inline dose ranges reduce recall load well; Puyer's per-drug `[min–max]` hints lack a persistent per-kali/per-hari label tying the range to the active mode. |
| 7 | Flexibility and Efficiency of Use | 3 | Favorites/recents pinning, custom presets, and a persisted dose-mode preference are real efficiency features; no keyboard shortcuts or "recalculate from history" exist. |
| 8 | Aesthetic and Minimalist Design | 3 | DESIGN.md's Four Pastels and Tint-Not-Fill rules are genuinely honored in the CSS, but `DrugCalculator.tsx` stacks toggle + hint + weight + dose + dose-picker + freq + concentration + hint in one unbroken flow before the button. |
| 9 | Help Users Recognize/Diagnose/Recover from Errors | 3 | `errorCopy.ts` translates engine errors and fails open on unknown messages; errors are proximity-based rather than field-specific ("Berat badan harus berupa angka lebih dari 0" doesn't point at which field beyond adjacency). |
| 10 | Help and Documentation | 3 | `AboutPage.tsx` (methodology, sources, explicit scope table) and inline drug monographs are substantive, not boilerplate; no contextual "?" help beyond the per-kali/per-hari hint text. |
| **Total** | | **32/40** | **Good** |

## Design Specificity Verdict

**LLM assessment:** This is not a generic mg/kg calculator wearing local copy — the specificity is load-bearing in the code, not decorative. `PuyerPanel.tsx` implements real Indonesian compounding logic (bungkus totals, tablet-fraction formatting `¼ ½ ¾ 1½`, a "campur bahan rata" caveat). `ResultCard.tsx` cites `IDAI/BNFc/Fornas` inline at the point of the number it justifies, not in a footnote. DESIGN.md's category-accent map documents a real editorial choice a template would never make (indigo, not blue, for Antibiotik so it doesn't collide with the app's one interactive accent; brick red reserved exclusively for Gawat Darurat). The one place genericness leaks in is the form layer itself — `DrugCalculator.tsx`'s weight/dose/freq/concentration fields and `WeightInput.tsx`'s age estimator are functionally excellent but visually indistinguishable from any clinical calculator's form stack. For a bedside tool that's the correct trade (novelty in the interaction layer would be a liability, not a feature), but it does mean the "built for Indonesian practice" claim rests entirely on content fidelity and copy, not on any UI mechanism a screenshot alone would reveal.

**Deterministic scan:** The detector found 10 findings, all in a single file (`src/components/PuyerPanel.tsx`, lines 126–133) and all tagged `advisory` severity — 6 undocumented colors and 3 off-ramp font sizes. It ran clean (0 findings) across every other file in `src/components`, `src/pages`, and `src/App.tsx`. Notably, the tool's documented contract says advisory findings "never change the exit code," but this run exited 2 anyway, and `--no-advisory` (which should "suppress advisory findings entirely") returned the identical 10 findings and exit code — a real discrepancy between `detect.mjs --help` and its actual behavior, not something either assessment introduced.

**False positive assessment:** All 10 findings sit inside `buildRecipePrintHtml`, a template-literal `<style>` block that generates a standalone, print-only "Resep Puyer" HTML document opened in a popup (`window.open` → `popup.print()`), entirely outside the React tree and outside the app's own stylesheet. The flagged colors are the standard Tailwind slate scale — a different palette family from DESIGN.md's warm stone/paper neutrals and four-pastel-plus-clay system. The detector's literal claim (these values aren't in DESIGN.md) is factually correct; DESIGN.md doesn't carve out a print-artifact exemption anywhere. I'm treating these as **plausible-but-unconfirmed false positives**: defensible if you consider a printed prescription slip a separate rendering surface from the on-screen app (a common and reasonable design choice — cheap ink-friendly slate-gray print CSS is a real convention), but currently a second, untracked style system that DESIGN.md doesn't acknowledge either way.

## Overall Impression

DoseRx is a genuinely well-built clinical tool with unusual engineering discipline — a discriminated-union calculation engine, real accessibility groundwork (focus-visible rings everywhere, live regions, a route announcer that focuses the new page's `<h1>` on client-side nav), and a design system whose own documented rules (Tint-Not-Fill, Border-Before-Shadow, the Four Pastels Rule) are actually honored in the shipped CSS rather than just aspirational. The single biggest opportunity is the first five seconds of the two heaviest-traffic screens (Preset and Puyer): both open directly onto an unfiltered, ~92-card catalog with no smart narrowing beyond a "Sering dipakai" section that is empty for every first-time user and every fresh device — meaning the flagship "3 quick taps" promise the product is built around doesn't actually hold for the moment that matters most, a doctor's very first use.

## What's Working

- **The cap-transparency pattern in `ResultCard.tsx`** (lines 144–176): when a dose hits its max-daily or max-single cap, the uncapped value is shown struck through right next to the capped one, with the crossover weight stated explicitly. This treats "this dose stopped scaling with weight" as a first-class clinical fact instead of a bare "MAX" badge — exactly the kind of honesty a doctor needs under time pressure, and directly in service of PRODUCT.md's Principle 4 ("never let a capped/warned dose look identical to an uncapped one").
- **Accessibility groundwork that goes past checkbox compliance**: `SiteNav.tsx`'s `RouteAnnouncer`, consistent `role="status"`/`role="alert"` regions across `DrugCalculator.tsx`, `PuyerPanel.tsx`, and `WeightInput.tsx`, and `Tabs.tsx`'s deliberate choice of `aria-pressed` buttons over a half-implemented `role="tab"` contract — the codebase explicitly reasons about what a screen reader actually hears during client-side routing, not just what an automated a11y scanner would flag.
- **A design system that's real in code, not just in DESIGN.md**: the Four Pastels Rule, Tint-Not-Fill Rule, and the category color map's specific choices (brick red reserved for emergencies, indigo instead of blue for antibiotics) all show up correctly in the shipped CSS, and the detector's clean pass across every file except one print-only template confirms the system is actually being followed, not just documented.

## Priority Issues

**[P1] The two highest-traffic screens open on an unfiltered ~92-card catalog with no first-run narrowing**
- **Why it matters**: PRODUCT.md's success criteria is "weight known → mg + mL to administer in under 10 seconds... zero manual arithmetic." Both assessments independently flagged that `DrugGrid.tsx`'s "Sering dipakai" (pinned/recents/favorites) section — the only mechanism that narrows the grid before search/category filtering — is empty until a user has already favorited or recently used something. A first-time doctor, or any doctor on a fresh device, therefore opens Preset or Puyer to the same long, category-grouped scroll every time, with only a small `grid-lede` step badge for orientation. This is the cold-start version of the product's own core promise failing on the visit that matters most.
- **Fix**: Give the empty-pinned-state a fallback — e.g. surface the 6-8 most clinically common drugs (Paracetamol, Amoxicillin, Ibuprofen, etc., the original PRD seed list) as a "Sering digunakan" default before any personal history exists, or default the category-chip row to a sensible starting filter (e.g. the visitor's most recent category) instead of "Semua."
- **Suggested command**: `$impeccable onboard` (first-run/empty-state design is exactly its scope) — could pair with `$impeccable layout` if the fix also touches the grid's default grouping.

**[P1] Puyer silently produces no result if any single drug's dose/freq fails to parse, with no per-row error**
- **Why it matters**: `PuyerPanel.tsx`'s `handleCalculate` skips (`continue`) any entry whose dose/freq doesn't parse, and `allCalculated` requires every entry's `result !== null` before the recipe card renders. If a doctor under time pressure mistypes one of several drugs' fields, "Hitung Puyer" simply does nothing — there is no indication of which drug is broken. This directly contradicts the app's own stated rigor elsewhere (the cap-transparency pattern above) and Nielsen heuristic 9 (errors should be specific and located at the source).
- **Fix**: Surface a per-row error state (reuse the existing `role="alert"` pattern already used elsewhere in the file) pointing at the specific drug/field that failed to parse, rather than only gating the aggregate "compute" action.
- **Suggested command**: `$impeccable harden` (production-ready error/edge-case handling is exactly its scope).

**[P2] "Hapus semua" in History uses a native `window.confirm()` with no undo**
- **Why it matters**: Every other destructive/reversible action in the app (single-entry delete, "Ganti obat," Puyer's per-drug reset) is a custom-styled, focus-managed component. The one bulk-destructive action breaks out to OS browser chrome with a different focus/announcement model than everything Sam (a screen-reader user) would otherwise experience consistently, and offers no way back.
- **Fix**: Replace with an in-app confirmation (inline "Yakin? Hapus semua / Batal" affordance, matching the app's existing custom-component language), ideally with a brief undo window rather than an irreversible confirm.
- **Suggested command**: `$impeccable harden`.

**[P2] Numeric inputs accept invalid values with no live/inline validation**
- **Why it matters**: `<input type="number" min="0">` fields across `DrugCalculator.tsx`, `PuyerPanel.tsx`, and `WeightInput.tsx` accept negative or garbage values silently; the error only surfaces after "Hitung" is pressed, via a generic string with no field-level indicator. This is a smaller gap in an otherwise disciplined error-prevention story (the discriminated-union engine, dose-picker buttons avoiding hand-retyping).
- **Fix**: Add inline validation styling (e.g. a border/color change on blur for out-of-range values) consistent with the existing focus-ring pattern, so the field itself signals the problem before submit.
- **Suggested command**: `$impeccable harden`.

**[P3] Puyer's per-drug override list has no per-row collapse, unlike the rest of the app's progressive disclosure**
- **Why it matters**: For a realistic 4-5 drug puyer, this renders 8-10 visible numeric fields plus reset buttons simultaneously — inconsistent with the app's own pattern elsewhere (collapsed monograph, collapsed "Cara hitung" derivation) of hiding complexity until needed.
- **Fix**: Collapse each drug's override row to a compact summary (name + computed dose) with an expand-to-edit affordance, mirroring the monograph's `<details>` pattern already used elsewhere in the codebase.
- **Suggested command**: `$impeccable layout`.

## Persona Red Flags

**Jordan (First-Timer):** Lands on the Preset tab's full 92-drug grid with only a one-line `grid-lede` ("Pilih obat," step 1) for orientation. The "Sering dipakai" section that would normally help a returning user is empty on a first visit, so Jordan — who has never used a dose calculator before — sees exactly the same undifferentiated wall of ~92 cards across ~17 category groups that a 50th-time user would, with no guided starting point.

**Riley (Deliberate Stress Tester):** In `PuyerPanel.tsx`, if Riley (simulating a doctor mistyping under pressure) enters an unparseable dose in even one drug among several in a puyer batch, `handleCalculate`'s `if (!entry) continue` logic means that drug is silently skipped and `allCalculated` never becomes true — the recipe card simply never appears, with zero indication of which of the several drugs is the problem.

**Sam (Accessibility-Dependent):** The single-entry delete flow in `HistoryPanel.tsx` (`handleDelete`, lines 85-98) explicitly manages focus return after deletion, matching the app's careful pattern elsewhere. "Hapus semua" (`handleClearAll`) drops to a native `window.confirm()` instead — a different interaction and announcement model a screen reader user would experience inconsistently compared to every other destructive action in the same panel.

## Minor Observations

- `ResultCard.tsx`'s patient-label field enforces `maxLength={20}` — the "no full names" privacy constraint from PRODUCT.md is enforced in code, not just suggested by copy.
- `errorCopy.ts` passes unknown engine error messages through verbatim rather than swallowing them — a thoughtful, explicitly-commented fail-open choice.
- The detector's `--no-advisory` flag did not change output or exit code on this run, despite `--help` documenting that it should suppress advisory findings and that advisory findings never affect exit code — worth a quick look at `detect.mjs` itself since this contradicts its own documented contract, independent of anything in DoseRx.
- `PuyerPanel.tsx`'s print-recipe HTML is a second, untracked style surface (Tailwind-slate palette, off-ramp font sizes) that DESIGN.md doesn't currently acknowledge either as in-system or explicitly exempt — worth a one-line decision either way next time DESIGN.md is touched, so the detector's findings there stop being ambiguous.

## Questions to Consider

- If "Sering dipakai" is empty for every first-time user and every fresh device, is the actual first-run experience closer to the "3 quick taps" the product promises, or closer to "browse a small textbook"?
- Puyer's dose-mode toggle is now implemented twice (`DrugCalculator.tsx` and `PuyerPanel.tsx`) — has it already drifted, or is it only a matter of time before one gets a fix the other doesn't?
- Given the app's own principle that a capped dose should never look identical to an uncapped one, should a Puyer entry that fails to parse get the same visibility treatment, instead of silently voiding the whole recipe?
- Is the print recipe's separate slate/Tailwind palette a deliberate "this is a different medium" choice, or should it be pulled onto the same warm-paper token system as everything else?
