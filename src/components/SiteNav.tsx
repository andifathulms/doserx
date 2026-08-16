import { useEffect, useRef, useState } from 'react'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'
import { Link, isActive } from '../lib/router'
import { NAV_ITEMS, routeTitle } from '../routes'
import { Theme, loadTheme, saveTheme } from '../lib/storage'

/**
 * Site chrome for a multi-page app.
 *
 * Desktop puts navigation in the header. Mobile moves it to a bottom bar,
 * which is the thumb-reachable half of a phone held one-handed — the posture
 * the PRD describes for bedside use. Both render from the same NAV_ITEMS, so
 * they cannot drift apart.
 */

export function SkipLink() {
  return (
    <a className="skip-link" href="#main">
      Lompat ke konten utama
    </a>
  )
}

/**
 * Manual, persisted, never OS-following (see index.css's dark-mode comment
 * and DESIGN-REWORK.md §5) — a doctor who wants dark chooses dark, and the
 * choice sticks across visits.
 *
 * The two icons both render on server and client alike; only CSS ([data-theme]
 * rules in index.css) decides which one shows. That keeps the button's
 * children identical between the prerendered HTML and the first client
 * render, so only the aria attributes below can disagree — and only for the
 * instant before hydration reads the same doserx_theme key index.html's
 * inline script already applied to <html>. suppressHydrationWarning owns
 * that one known, harmless mismatch rather than silencing the whole subtree.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme())

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    saveTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      suppressHydrationWarning
    >
      <SunIcon
        className="theme-toggle__icon theme-toggle__icon--light"
        width="18"
        height="18"
        aria-hidden="true"
      />
      <MoonIcon
        className="theme-toggle__icon theme-toggle__icon--dark"
        width="18"
        height="18"
        aria-hidden="true"
      />
    </button>
  )
}

interface SiteHeaderProps {
  historyCount: number
  historyActive: boolean
  path: string
}

export function SiteHeader({ historyCount, historyActive, path }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        {/* The wordmark is a link, not the page heading — each page owns its
            own <h1>, which is what heading navigation depends on. */}
        <Link to="/" className="site-brand" aria-label="DoseRx — beranda">
          Dose<span>Rx</span>
        </Link>

        <nav className="site-nav" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`site-nav__link${isActive(path, item.match) ? ' site-nav__link--active' : ''}`}
              aria-current={isActive(path, item.match) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Grouped so the header stays a clean two-item space-between row on
            mobile (brand ↔ actions) once .site-nav hides at ≤560px, rather
            than spreading three separate flex children across the bar. */}
        <div className="site-header__actions">
          <ThemeToggle />
          <Link
            to="/riwayat"
            className={`history-toggle${historyActive ? ' history-toggle--active' : ''}`}
            aria-current={historyActive ? 'page' : undefined}
          >
            Riwayat
            {historyCount > 0 && <span className="history-toggle__count">{historyCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}

export function BottomNav({ path, historyCount }: { path: string; historyCount: number }) {
  const items = [
    ...NAV_ITEMS,
    { id: 'history', href: '/riwayat', match: '/riwayat', label: 'Riwayat' },
  ]

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama (bawah)">
      {items.map((item) => {
        const active = isActive(path, item.match)
        return (
          <Link
            key={item.id}
            to={item.href}
            className={`bottom-nav__link${active ? ' bottom-nav__link--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
            {item.id === 'history' && historyCount > 0 && (
              <span className="bottom-nav__count">{historyCount}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * A client-side route change is invisible to a screen reader: no page load, no
 * announcement, and focus stays wherever it was. This does what the browser
 * would have done — announces the new page and moves focus to its heading.
 *
 * Focus lands on the <h1> (tabIndex -1, so it is a destination but not a tab
 * stop) rather than on <main>, so the first thing announced is what the page
 * is. Skipped on first paint, where the browser's own load behaviour applies.
 */
export function RouteAnnouncer({ routeId }: { routeId: string }) {
  const first = useRef(true)
  const title = routeTitle(routeId)

  useEffect(() => {
    document.title = title
    if (first.current) {
      first.current = false
      return
    }
    const heading = document.querySelector<HTMLElement>('#main h1')
    heading?.focus()
  }, [title, routeId])

  return (
    <p className="sr-only" role="status">
      {first.current ? '' : title}
    </p>
  )
}
