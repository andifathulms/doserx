import { useEffect } from 'react'
import { Link } from '../lib/router'
import { Lang } from '../content/landing'
import { ABOUT, ABOUT_PATHS, SOURCE_COUNTS, ABOUT_FACTS } from '../content/about'

/**
 * /tentang and /en/about — the methodology page.
 *
 * Deliberately structured so the limitations are as prominent as the sources.
 * A doctor deciding whether to trust an unfamiliar calculator needs to know
 * what it assumes; a visitor evaluating the work needs to see that the
 * assumptions were tracked rather than hidden. Both are served by the same
 * honesty.
 */
export function AboutPage({ lang }: { lang: Lang }) {
  const t = ABOUT[lang]
  const other: Lang = lang === 'id' ? 'en' : 'id'

  useEffect(() => {
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = 'id'
    }
  }, [lang])

  return (
    <div className="landing">
      <div className="page-head">
        <div className="landing-hero__head">
          <span className="landing-eyebrow">DoseRx</span>
          <Link to={ABOUT_PATHS[other]} className="lang-toggle" hrefLang={other} lang={other}>
            {other === 'en' ? 'English' : 'Bahasa Indonesia'}
          </Link>
        </div>
        <h1 className="page-title" tabIndex={-1}>{t.title}</h1>
        <p className="page-lede">{t.lede}</p>
      </div>

      {/* Sources first: it is the question a clinician asks before any other. */}
      <section className="landing-section" aria-labelledby="sources-title">
        <h2 className="landing-section__title" id="sources-title">{t.sourcesTitle}</h2>
        <p className="landing-section__lede">{t.sourcesLede}</p>
        <table className="source-table">
          <thead>
            <tr>
              <th scope="col">{t.sourcesColDrug}</th>
              <th scope="col">{t.sourcesColCount}</th>
            </tr>
          </thead>
          <tbody>
            {SOURCE_COUNTS.map(([source, count]) => (
              <tr key={source}>
                <th scope="row">{source}</th>
                <td>{count}</td>
              </tr>
            ))}
            {ABOUT_FACTS.uncited > 0 && (
              <tr>
                <th scope="row">—</th>
                <td>{ABOUT_FACTS.uncited}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="landing-section" aria-labelledby="how-title">
        <h2 className="landing-section__title" id="how-title">{t.howTitle}</h2>
        <ol className="how-list">
          {t.how.map((step) => (
            <li key={step.title} className="how-list__item">
              <h3 className="how-list__title">{step.title}</h3>
              {step.body.map((p) => (
                <p key={p} className="how-list__body">{p}</p>
              ))}
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="limits-title">
        <h2 className="landing-section__title" id="limits-title">{t.limitsTitle}</h2>
        <p className="landing-section__lede">{t.limitsLede}</p>
        <div className="trust">
          {t.limits.map((item) => (
            <div key={item.title} className="trust__item limit__item">
              <h3 className="trust__title">{item.title}</h3>
              <p className="trust__body">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="scope-title">
        <h2 className="landing-section__title" id="scope-title">{t.scopeTitle}</h2>
        <div className="scope">
          <div className="scope__col">
            <h3 className="scope__title scope__title--is">{t.isTitle}</h3>
            <ul className="scope__list">
              {t.is.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="scope__col">
            <h3 className="scope__title scope__title--not">{t.isNotTitle}</h3>
            <ul className="scope__list scope__list--not">
              {t.isNot.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="privacy-title">
        <h2 className="landing-section__title" id="privacy-title">{t.privacyTitle}</h2>
        <ul className="privacy-list">
          {t.privacy.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <p className="landing-disclaimer" role="note">
          <span className="landing-disclaimer__icon" aria-hidden="true">⚠</span>
          {t.disclaimer}
        </p>
      </section>
    </div>
  )
}
