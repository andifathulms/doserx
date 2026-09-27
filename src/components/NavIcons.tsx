import { NavIcon as NavIconName } from '../routes'

/**
 * Bottom-bar icons. Drawn here rather than taken from the icon set because
 * the set has no capsule, drip or compounding glyph — and a generic "home" or
 * "grid" icon would say nothing about a clinical task. Stroke-only at 1.7px so
 * they sit with the Radix icons used elsewhere. Always paired with a text
 * label; never the only carrier of meaning.
 */
export function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'obat':
      return (
        <svg {...common}>
          <rect x="2.6" y="7" width="14.8" height="6" rx="3" transform="rotate(-38 10 10)" />
          <path d="m7.4 6.5 5.2 7" />
        </svg>
      )
    case 'darurat':
      return (
        <svg {...common}>
          <path d="M2.5 10.5h3.2l1.8-4 3 8.5 2.2-4.5h4.8" />
        </svg>
      )
    case 'puyer':
      return (
        <svg {...common}>
          <path d="M4 8h12l-1.4 8.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8z" />
          <path d="M7 8V5.5h6V8" />
        </svg>
      )
    case 'cairan':
      return (
        <svg {...common}>
          <path d="M10 2.8s5 5.4 5 9a5 5 0 0 1-10 0c0-3.6 5-9 5-9Z" />
        </svg>
      )
    case 'riwayat':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v4.2l2.8 1.8" />
        </svg>
      )
  }
}
