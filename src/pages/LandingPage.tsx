import { useEffect } from 'react'
import { Link } from '../lib/router'
import { WorkedExample } from '../components/WorkedExample'
import { LANDING, LANG_PATHS, Lang } from '../content/landing'

/**
 * / and /en — the front door for someone who has never seen this before.
 *
 * The doctor never has to pass through here: the installed PWA opens straight
 * into /hitung/preset, and the header keeps the calculator one tap away. That
 * is what makes it safe to put a landing page in front of a bedside tool.
 *
 * Language is a route, not component state — so a shared link carries the
 * language it was read in, and each version has a URL that can be canonical.
 */
export function LandingPage({ lang }: { lang: Lang }) {
  const t = LANDING[lang]
  const other: Lang = lang === 'id' ? 'en' : 'id'

  // The document language has to follow the content, or a screen reader reads
  // English copy with an Indonesian voice (and vice versa).
  useEffect(() => {
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = 'id'
    }
  }, [lang])

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero__head">
          <p className="landing-eyebrow">{t.eyebrow}</p>
          <Link to={LANG_PATHS[other]} className="lang-toggle" hrefLang={other} lang={other}>
            {other === 'en' ? 'English' : 'Bahasa Indonesia'}
          </Link>
        </div>

        <h1 className="landing-title" tabIndex={-1}>
          {t.title}
          <span className="landing-title__accent">{t.titleAccent}</span>
        </h1>
        <p className="landing-lede">{t.lede}</p>

        <div className="landing-cta">
          <Link to="/hitung/preset" className="btn btn--primary">
            {t.ctaPrimary}
          </Link>
          <Link to="/obat" className="btn btn--ghost">
            {t.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* The product, running, above the fold — not a screenshot of it. */}
      <section className="landing-section" aria-labelledby="demo-title">
        <h2 className="landing-section__title" id="demo-title">{t.demoTitle}</h2>
        <p className="landing-section__lede">{t.demoNote}</p>
        <WorkedExample lang={lang} />
      </section>

      <section className="landing-section" aria-labelledby="chain-title">
        <h2 className="landing-section__title" id="chain-title">{t.chainTitle}</h2>
        <p className="landing-section__lede">{t.chainLede}</p>
        <ol className="chain">
          {t.chain.map((step, i) => (
            <li key={step.label} className="chain__step">
              <span className="chain__num" aria-hidden="true">{i + 1}</span>
              <span className="chain__label">{step.label}</span>
              <span className="chain__detail">{step.detail}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="facts-title">
        <h2 className="landing-section__title" id="facts-title">{t.factsTitle}</h2>
        <ul className="facts">
          {t.facts.map((f) => (
            <li key={f.label} className="facts__item">
              {f.href ? (
                <Link to={f.href} className="facts__link">
                  <span className="facts__value">{f.value}</span>
                  <span className="facts__label">{f.label}</span>
                </Link>
              ) : (
                <>
                  <span className="facts__value">{f.value}</span>
                  <span className="facts__label">{f.label}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section" aria-labelledby="trust-title">
        <h2 className="landing-section__title" id="trust-title">{t.trustTitle}</h2>
        <div className="trust">
          {t.trust.map((item) => (
            <div key={item.title} className="trust__item">
              <h3 className="trust__title">{item.title}</h3>
              <p className="trust__body">{item.body}</p>
            </div>
          ))}
        </div>

        {/* The disclaimer is part of the pitch, not fine print under it — the
            PRD makes it a hard requirement and honesty makes it a feature. */}
        <p className="landing-disclaimer" role="note">
          <span className="landing-disclaimer__icon" aria-hidden="true">⚠</span>
          {t.disclaimer}
        </p>
      </section>

      <section className="landing-close">
        <h2 className="landing-close__title">{t.closingTitle}</h2>
        <p className="landing-close__body">{t.closingBody}</p>
        <Link to="/hitung/preset" className="btn btn--primary">
          {t.closingCta}
        </Link>
      </section>
    </div>
  )
}
