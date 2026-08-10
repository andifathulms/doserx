interface Tab {
  id: string
  label: string
  /** One line saying what this mode calculates — shown for the active tab. */
  hint?: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  /** Names the axis of choice, so four bare nouns read as one decision. */
  label?: string
}

export function Tabs({ tabs, active, onChange, label }: TabsProps) {
  const activeHint = tabs.find((t) => t.id === active)?.hint

  return (
    <div className="tabs-group">
      {label && <span className="tabs-group__label">{label}</span>}
      <div className="tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            className={`tab-btn${active === tab.id ? ' tab-btn--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeHint && <p className="tabs-group__hint">{activeHint}</p>}
    </div>
  )
}
