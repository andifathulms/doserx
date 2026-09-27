import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Population, loadPatient, loadPopulation, savePatient, savePopulation } from './storage'

/**
 * The current patient — weight and Anak/Dewasa — shared by every tool.
 *
 * Before this, Preset, Kustom, Puyer, Infus, Cairan and every drug page each
 * had their own weight field, so the one input they all share was typed again
 * in every one of them. Now the patient bar owns it and every calculator
 * reads it.
 *
 * Starts empty on the server and on the first client render (so prerendered
 * HTML and hydration agree — see App for why), then restores from
 * sessionStorage on mount. See storage.ts for why the weight expires.
 */

export interface PatientState {
  /** Raw field text, exactly as typed. */
  weight: string
  /** Parsed weight when it is a usable positive number, else null. */
  weightKg: number | null
  population: Population
  /** Formula text when the weight came from the age estimator. */
  estimatedFrom: string | null
  setWeight: (value: string, estimatedFrom?: string | null) => void
  setPopulation: (p: Population) => void
  /** "Pasien baru" — clears the weight for the next patient. */
  clear: () => void
}

export function parseWeight(value: string): number | null {
  const n = parseFloat(value)
  return isFinite(n) && n > 0 && n < 400 ? n : null
}

const noop = () => {}

const PatientContext = createContext<PatientState>({
  weight: '',
  weightKg: null,
  population: 'anak',
  estimatedFrom: null,
  setWeight: noop,
  setPopulation: noop,
  clear: noop,
})

export function PatientProvider({ children }: { children: ReactNode }) {
  const [weight, setWeightRaw] = useState('')
  const [estimatedFrom, setEstimatedFrom] = useState<string | null>(null)
  const [population, setPopulationRaw] = useState<Population>('anak')

  useEffect(() => {
    const stored = loadPatient()
    if (stored) {
      setWeightRaw(stored.weight)
      setEstimatedFrom(stored.estimatedFrom)
    }
    setPopulationRaw(loadPopulation())
  }, [])

  const setWeight = useCallback((value: string, from: string | null = null) => {
    setWeightRaw(value)
    setEstimatedFrom(from)
    savePatient({ weight: value, estimatedFrom: from, updatedAt: Date.now() })
  }, [])

  const setPopulation = useCallback((p: Population) => {
    setPopulationRaw(p)
    savePopulation(p)
  }, [])

  const clear = useCallback(() => setWeight(''), [setWeight])

  const value = useMemo<PatientState>(
    () => ({
      weight,
      weightKg: parseWeight(weight),
      population,
      estimatedFrom,
      setWeight,
      setPopulation,
      clear,
    }),
    [weight, population, estimatedFrom, setWeight, setPopulation, clear],
  )

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
}

export function usePatient(): PatientState {
  return useContext(PatientContext)
}

/** Moves focus to the patient bar's weight field — for "isi berat dulu" prompts. */
export function focusPatientWeight(): void {
  const el = document.getElementById('patient-weight') as HTMLInputElement | null
  el?.focus()
  el?.select()
}
