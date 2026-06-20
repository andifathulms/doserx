# PRD: DoseRx — Weight-Based Medication Dose Calculator

## 1. Problem

A practicing doctor currently calculates weight-based medication dosing manually for every patient — multiplying mg/kg by patient weight, dividing by frequency, converting to administration volume, and checking against max-dose limits. This is repetitive, time-pressured, and error-prone, especially during busy shifts or with pediatric patients.

## 2. Goal

A simple, fast, reliable web app that:
- Calculates total daily dose, per-administration dose, and liquid volume from patient weight and dosing parameters
- Ships with a preset library of common drugs (so most calculations are just "enter weight")
- Supports fully custom drug entry for anything not in the preset list
- Flags when a calculated dose exceeds known maximums
- Saves a history of past calculations she can refer back to

Out of scope: drug interaction checking, full pharmacy database, multi-user accounts, prescription printing/export, regulatory/clinical certification. This is a personal calculation aid, not a clinical decision support system — it should be explicit about that.

## 3. Target user

One user (the doctor). No auth, no multi-tenancy. Used on both phone (bedside) and desktop.

## 4. Core features

### 4.1 Preset drug calculator
- Grid of common drugs to select from. Each preset includes: name, route, typical mg/kg dose (or range), default frequency/day, max daily dose, max single dose, typical stock concentration (mg/mL), and a short clinical note.
- Selecting a drug pre-fills the calculator form (dose/kg, frequency, concentration) with sane defaults the user can override.
- Seed list (extendable later): Paracetamol, Amoxicillin, Ibuprofen, Ceftriaxone, Diazepam (seizure), Epinephrine (anaphylaxis), Ondansetron, Salbutamol (nebule).

### 4.2 Custom calculator
- Free-form entry: drug name, patient weight, dose/kg, frequency/day, optional max daily dose, optional stock concentration.
- Same calculation engine as presets, no max-single-dose field (optional max-daily only).

### 4.3 Calculation engine (shared logic)
Given `weight (kg)`, `dosePerKg (mg/kg)`, `freq (doses/day)`, optional `maxDay (mg)`, optional `maxSingle (mg)`, optional `concentration (mg/mL)`:
1. `dailyDose = weight × dosePerKg`
2. If `maxDay` set and `dailyDose > maxDay` → cap to `maxDay`, flag warning
3. `perDose = dailyDose / freq`
4. If `maxSingle` set and `perDose > maxSingle` → cap to `maxSingle`, flag warning
5. If `concentration` set → `volume = perDose / concentration` (mL)
6. All displayed numbers rounded sensibly (1 decimal for mg, 2 decimals for mL)

Validation: weight, dosePerKg, and freq must be positive numbers before calculating; show inline error otherwise.

### 4.4 Save to history
- After any calculation, an optional "patient label" field (e.g. initials only — never full names, for privacy) plus a "Save to history" action.
- Saved entry: drug name, patient label, weight, dose/kg, frequency, computed daily dose, per-dose, volume, timestamp.

### 4.5 History view
- Reverse-chronological list of saved calculations.
- Each entry shows drug, label, weight/dose/frequency inputs, computed outputs, and a relative/formatted timestamp.
- Delete individual entries; clear-all action.
- Empty state when no history exists yet.

## 5. Data & persistence

- Single user, no backend required for v1. Use browser local storage (or equivalent persistent client-side storage) for history — nothing is sent to a server.
- No PII beyond optional short patient labels the user chooses to enter; UI should nudge toward initials, not full names.

## 6. Non-functional requirements

- Must work fully offline once loaded (no required network calls for core calculation).
- Fast: calculation is instant, no loading states needed for the math itself.
- Usable one-handed on a phone screen at the bedside; also comfortable on desktop.
- Numbers must never silently overflow/NaN — always validate before showing a result.

## 7. Safety / disclaimer requirement

The app must visibly communicate (e.g. in a footer or info note) that:
- It is a calculation aid only, not a clinical decision support or prescribing system.
- Preset dosing values are general references and should be verified against institutional/current clinical guidelines before use.

This is a hard requirement, not optional polish — do not ship without it.

## 8. Success criteria

- Doctor can go from "patient weight known" to "mg + mL to administer" in under 10 seconds for any preset drug.
- Zero manual arithmetic required for the common case.
- History reliably persists across app reloads/sessions on the same device.
