# CLAUDE.md — DoseRx

## What this is
A weight-based medication dose calculator web app. Read PRD.md fully before writing any code — it defines the calculation logic, feature scope, and the safety-disclaimer requirement exactly. Do not skip the disclaimer; it's a hard requirement.

## Stack
- Frontend only, no backend needed for v1.
- React + TypeScript, Vite for tooling.
- Plain CSS or a lightweight utility approach — no heavy UI framework needed, this is a small focused app.
- Client-side persistence via `localStorage` (wrap in a small storage utility module so it's easy to swap for a backend later if needed).
- Deployable as a static site (no server required).

## Project structure (suggested)
```
src/
  data/drugs.ts          # preset drug list (typed)
  lib/calculate.ts        # pure calculation engine, fully unit-testable, no UI deps
  lib/storage.ts          # localStorage read/write/delete wrapper for history
  components/
    PresetPanel.tsx
    CustomPanel.tsx
    HistoryPanel.tsx
    ResultCard.tsx
    DrugGrid.tsx
    Tabs.tsx
  App.tsx
```

Keep `calculate.ts` pure (no DOM, no React) — it's the most important piece of logic in the app and should be straightforward to unit test in isolation. Write a few unit tests covering: normal calc, max-daily cap triggering, max-single cap triggering, missing concentration (no volume shown), invalid inputs.

## Design direction
- Clinical, calm, trustworthy — not playful, not generic SaaS. This is used at the bedside under time pressure, so legibility and one-handed mobile usability matter more than visual flourish.
- Should work well at both narrow mobile widths and desktop.
- Avoid clutter: the preset drug grid → form → result flow should feel like 3 quick taps, not a form wizard.
- It's fine to take a real point of view on typography/color rather than defaulting to a generic admin-dashboard look — just keep it restrained and fast to scan.

## Build approach
1. Start with `calculate.ts` and its tests — get the math right and locked down first, since every feature depends on it.
2. Build `drugs.ts` with the preset list from the PRD (8 seed drugs). Keep this as a typed array that's easy to extend later — adding a new drug should never require touching calculation logic.
3. Build the three panels (Preset / Custom / History) as described in the PRD, using the shared calculation engine.
4. Wire up `storage.ts` for saving/loading/deleting history entries, and the empty-state/list UI for History.
5. Add the safety disclaimer (visible, not buried in a tooltip).
6. Pass over responsiveness and mobile usability last, after functionality is solid.

## Constraints to respect
- No network calls required for the app to function.
- No collection of full patient names — UI copy should nudge toward short labels/initials only for the optional patient field.
- Every numeric output must be validated/rounded before display — never show `NaN`, `Infinity`, or unrounded floats.
- Don't add drug-interaction checking, multi-user auth, or a prescribing/export-to-PDF feature — explicitly out of scope per PRD.

## When done
Give me a brief summary of what was built, how to run it locally (`npm install && npm run dev` or equivalent), and flag anything from the PRD you made a judgment call on or deviated from.
