import { DRUG_PRESETS, DrugPreset } from '../data/drugs'

interface DrugGridProps {
  selected: string | null
  onSelect: (drug: DrugPreset) => void
}

export function DrugGrid({ selected, onSelect }: DrugGridProps) {
  return (
    <div className="drug-grid">
      {DRUG_PRESETS.map((drug) => (
        <button
          key={drug.id}
          className={`drug-card${selected === drug.id ? ' drug-card--selected' : ''}`}
          onClick={() => onSelect(drug)}
          aria-pressed={selected === drug.id}
        >
          <span className="drug-card__name">{drug.name}</span>
          <span className="drug-card__route">{drug.route}</span>
        </button>
      ))}
    </div>
  )
}
