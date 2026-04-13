import { Link } from "react-router-dom";
import { useLandingPageEffects } from "../hooks/useLandingPageEffects";
import "../styles/landing.css";

export function LandingPage() {
  useLandingPageEffects();

  return (
    <>
      <header className="topbar" id="site-header">
        <div className="topbar__backdrop" id="topbar-backdrop" aria-hidden="true" />
        <div className="topbar__inner">
          <a className="brand" href="#top">
            <img
              className="brand__logo"
              src="/Group%2010%20(1).png"
              alt="Orca"
              width={2410}
              height={655}
              decoding="async"
            />
          </a>

          <button
            type="button"
            className="topbar__menu-toggle"
            id="topbar-menu-toggle"
            aria-expanded={false}
            aria-controls="primary-nav-panel"
            aria-label="Open menu"
          >
            <span className="topbar__menu-bars" aria-hidden="true">
              <span className="topbar__menu-bar" />
              <span className="topbar__menu-bar" />
              <span className="topbar__menu-bar" />
            </span>
          </button>

          <div className="topbar__panel" id="primary-nav-panel">
            <nav className="topbar__nav" aria-label="Primary">
              <ul className="topbar__links">
                <li>
                  <a href="#mission">Our mission</a>
                </li>
                <li>
                  <a href="#how-it-works">How it works</a>
                </li>
                <li>
                  <a href="#quote">Register your interest</a>
                </li>
              </ul>
            </nav>

            <div className="topbar__actions">
              <a className="btn btn--primary btn--nav-cta" href="#quote">
                Get an instant estimate
              </a>
              <Link className="btn btn--outline btn--nav-cta" to="/dashboard" style={{ marginLeft: "0.5rem" }}>
                Dashboard demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="page" id="top">
        <section className="hero" aria-labelledby="hero-heading">
          <canvas className="hero__grid-canvas" aria-hidden="true" />
          <div className="hero__blur-layer" aria-hidden="true">
            <div className="hero__blur-patch hero__blur-patch--copy" />
            <div className="hero__blur-patch hero__blur-patch--cta" />
            <div className="hero__blur-patch hero__blur-patch--h1" />
          </div>
          <div className="hero__inner">
            <div className="hero-text">
              <h1 className="hero-text__title" id="hero-heading">
                Cheaper water bills <span className="hero-text__accent">for your business</span>.
              </h1>
              <p className="hero-text__lead" hidden>
                Water companies in England have taken advantage of businesses for too long. Switching to Orca could save
                you upwards of 10% on your water bill, drastically reduce your leakages, and give you more accurate
                insights into your consumption.
              </p>
              <p className="hero-text__stats">
                <span className="hero-text__stat">
                  <span className="hero-text__stat-num">5%</span> instant saving
                </span>
                <span className="hero-text__stat-sep" aria-hidden="true">
                  |
                </span>
                <span className="hero-text__stat">
                  Switch in <span className="hero-text__stat-num">2</span> weeks
                </span>
              </p>
              <div className="hero-text__actions">
                <a className="btn btn--primary btn--sm" href="#quote">
                  Get an instant estimate
                </a>
                <a className="btn btn--outline btn--sm" href="#mission">
                  Read our mission
                </a>
              </div>
            </div>

            <div className="save-card" id="quote">
              <h2 className="save-card__title" id="estimate-heading">
                See how much you could save
              </h2>
              <p className="save-card__hint">
                Get an instant estimate — your bill, contact details, and postcode. We’re launching in your area soon!
              </p>
              <form className="save-card__form" id="estimate-form" noValidate>
                <div className="save-card__field">
                  <label className="save-card__label" htmlFor="water-bill">
                    Annual water bill (£)
                  </label>
                  <div className="save-card__input-wrap">
                    <input
                      className="save-card__input"
                      type="text"
                      id="water-bill"
                      name="water-bill"
                      placeholder="e.g. 450"
                      inputMode="decimal"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>
                <div className="save-card__field">
                  <label className="save-card__label" htmlFor="estimate-email">
                    Email
                  </label>
                  <div className="save-card__input-wrap">
                    <input
                      className="save-card__input"
                      type="email"
                      id="estimate-email"
                      name="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      required
                    />
                  </div>
                </div>
                <div className="save-card__field">
                  <label className="save-card__label" htmlFor="estimate-phone">
                    Phone <span className="save-card__optional">(optional)</span>
                  </label>
                  <div className="save-card__input-wrap">
                    <input
                      className="save-card__input"
                      type="tel"
                      id="estimate-phone"
                      name="phone"
                      placeholder="e.g. 07123 456789"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </div>
                </div>
                <label className="sr-only" htmlFor="postcode">
                  Postcode
                </label>
                <div className="save-card__combo" role="group" aria-label="Postcode and estimate">
                  <input
                    className="save-card__input"
                    type="text"
                    id="postcode"
                    name="postcode"
                    placeholder="Enter postcode"
                    autoComplete="postal-code"
                    inputMode="text"
                    required
                  />
                  <button className="save-card__submit" type="submit" id="estimate-submit">
                    See my estimate
                  </button>
                </div>
                <label className="save-card__consent" htmlFor="estimate-consent">
                  <input
                    className="save-card__checkbox"
                    type="checkbox"
                    id="estimate-consent"
                    name="consent"
                    value="yes"
                    required
                  />
                  <span className="save-card__consent-text">
                    I’m happy to be contacted about my estimate and Orca.eco updates.
                  </span>
                </label>
                <div className="save-card__result" id="estimate-result" hidden aria-live="polite">
                  <p className="save-card__result-kicker">You could save</p>
                  <p className="save-card__result-hero">
                    <span className="save-card__result-sum" id="estimate-result-saving" />
                    <span className="save-card__result-hero-suffix">/year</span>
                  </p>
                  <p className="save-card__result-sub" id="estimate-result-sub" />
                  <p className="save-card__result-launch" id="estimate-result-launch" />
                  <div className="save-card__compare">
                    <div className="save-card__compare-row">
                      <span className="save-card__compare-label">Your bill today</span>
                      <span className="save-card__compare-value" id="estimate-result-current" />
                    </div>
                    <div className="save-card__compare-row save-card__compare-row--orca">
                      <span className="save-card__compare-label">Estimated with Orca</span>
                      <span className="save-card__compare-value" id="estimate-result-orca" />
                    </div>
                  </div>
                  <p className="save-card__result-note" id="estimate-result-followup" />
                </div>
                <p className="save-card__feedback" id="estimate-feedback" hidden role="status" aria-live="polite" />
              </form>
            </div>
          </div>
        </section>

        <section className="hero-stat-bar" aria-label="Key figures">
          <div className="hero-stat-bar__inner">
            <ul className="hero-stat-bar__list">
              <li className="hero-stat-bar__item">
                <p className="hero-stat-bar__stat">
                  <span className="hero-stat-bar__value" data-stat="percent" data-target="5" data-suffix="%+">
                    0%+
                  </span>
                  <span className="hero-stat-bar__label">instant saving on your water bill</span>
                </p>
              </li>
              <li className="hero-stat-bar__item">
                <p className="hero-stat-bar__stat">
                  <span className="hero-stat-bar__value" data-stat="percent" data-target="30" data-suffix="%+">
                    0%+
                  </span>
                  <span className="hero-stat-bar__label">
                    potential reduction in your water usage using advanced analytics
                  </span>
                </p>
              </li>
              <li className="hero-stat-bar__item">
                <p className="hero-stat-bar__stat">
                  <span className="hero-stat-bar__value" data-stat="seconds" data-target-seconds="82">
                    0 min 0 sec
                  </span>
                  <span className="hero-stat-bar__label">
                    the average time it takes to connect to our team on a call
                  </span>
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="mission" id="mission" aria-labelledby="mission-heading">
          <div className="mission__inner">
            <div className="mission__content">
              <p className="mission__eyebrow">Our mission</p>
              <h2 className="mission__title" id="mission-heading">
                We are on a mission to make water supply cleaner and fairer
              </h2>
              <p className="mission__lead">
                For too long, large water companies—often owned or driven by financial institutions—have treated UK
                households and businesses as a captive market: rising charges, complex tariffs, and rewards that flow to
                distant shareholders before they flow back into pipes, service, or the environment.
              </p>
              <blockquote className="mission__quote">
                <p>“Orca’s core mission is to help businesses consume no more than they need to.”</p>
              </blockquote>
              <p className="mission__body">
                <strong>orca.eco</strong> exists to change that. We’re building a straightforward way to switch, see what
                you pay for, and choose supply that’s priced fairly and delivered responsibly. That means transparent
                quotes, ongoing account clarity, and technology that puts you in control—so savings and sustainability go
                to customers and communities, not only to financial intermediaries.
              </p>
              <div className="section-cta">
                <a className="btn btn--primary btn--sm" href="#quote">
                  Get an instant estimate
                </a>
                <a className="btn btn--outline btn--sm" href="#how-it-works">
                  How switching works
                </a>
              </div>
            </div>
            <div className="mission__visual">
              <div className="orca-blob orca-blob--behind" aria-hidden="true" />
              <div className="mission__frame">
                <img
                  className="mission__img"
                  src="/imogen-basty.png"
                  alt="Two team members smiling outdoors, each holding a large water jug — fair supply in action"
                  width={640}
                  height={480}
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works" id="how-it-works" aria-labelledby="how-it-works-heading">
          <div className="how-it-works__inner">
            <header className="how-it-works__header">
              <p className="how-it-works__eyebrow">How it works</p>
              <h2 className="how-it-works__title" id="how-it-works-heading">
                From switch to savings — in three steps
              </h2>
            </header>

            <div className="how-it-works__steps">
              <div className="scroll-journey" id="scroll-journey" aria-hidden="true">
                <div className="scroll-journey__track" />
                <div className="scroll-journey__fill" />
                <div className="scroll-journey__dots" />
              </div>
              <article className="how-step how-step--image-left">
                <div className="how-step__visual">
                  <div className="how-step__blob orca-blob orca-blob--behind" aria-hidden="true" />
                  <div className="how-step__frame">
                    <img
                      className="how-step__img"
                      src="/begin_switch.png"
                      alt="ORCA Water Services technician servicing a smart meter outside a commercial building"
                      width={1200}
                      height={800}
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="how-step__content">
                  <h3 className="how-step__heading">Begin your switch</h3>
                  <p className="how-step__text">
                    We’ll switch you over as quickly as possible. Once you have submitted your details we’ll be able to
                    give you an accurate estimate of your savings and start making recommendations for reducing your
                    consumption.
                  </p>
                  <ul className="how-step__bullets">
                    <li>Fast handover with a savings estimate based on the details you submit.</li>
                    <li>Recommendations tailored to help you reduce water consumption.</li>
                  </ul>
                  <div className="how-step__cta">
                    <a className="btn btn--primary btn--sm" href="#quote">
                      Get an instant estimate
                    </a>
                  </div>
                </div>
              </article>

              <article className="how-step how-step--image-right">
                <div className="how-step__visual">
                  <div className="how-step__blob orca-blob orca-blob--behind" aria-hidden="true" />
                  <div className="how-step__frame">
                    <img
                      className="how-step__img"
                      src="/orca_screenshot_dashboard.png"
                      alt="ORCA dashboard showing savings overview, leakage monitoring, billing insights, and recommendations"
                      width={1200}
                      height={800}
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="how-step__content">
                  <h3 className="how-step__heading">
                    Manage your usage, alerts and recommendations on our platform
                  </h3>
                  <p className="how-step__text">
                    We use advanced models to detect anomalous water consumption on your site; this allows us to
                    identify leaks as soon as they happen and provide high-impact recommendations on how you can reduce
                    your consumption.
                  </p>
                  <ul className="how-step__bullets">
                    <li>Leak and anomaly alerts driven by usage models, so issues surface early.</li>
                    <li>High-impact savings ideas ranked by relevance to your sites.</li>
                  </ul>
                  <div className="how-step__cta">
                    <a className="btn btn--primary btn--sm" href="#quote">
                      Get an instant estimate
                    </a>
                  </div>
                </div>
              </article>

              <article className="how-step how-step--image-left">
                <div className="how-step__visual">
                  <div className="how-step__blob orca-blob orca-blob--behind" aria-hidden="true" />
                  <div className="how-step__frame">
                    <img
                      className="how-step__img"
                      src="/Gemini_Generated_Image_idjd5yidjd5yidjd.png"
                      alt=""
                      width={1200}
                      height={800}
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="how-step__content">
                  <h3 className="how-step__heading">Multi-site management</h3>
                  <p className="how-step__text">
                    We have built our site with multi-site operators in mind. You can manage all of your sites from one
                    dashboard and we will issue consolidated bills, or you can choose to split them out. You can also set
                    up your bills to be sent directly to your accounting software so you don’t have to worry about
                    uploading them yourself every quarter.
                  </p>
                  <ul className="how-step__bullets">
                    <li>One dashboard for every site, with consolidated or per-site billing.</li>
                    <li>Optional bill delivery into your accounting tools—no manual quarterly uploads.</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="final-cta" aria-labelledby="final-cta-heading">
          <div className="final-cta__inner">
            <div className="final-cta__card">
              <h2 className="final-cta__title" id="final-cta-heading">
                Find out how much you could save
              </h2>
              <p className="final-cta__lead">
                Get a free, no-obligation estimate in under a minute. Most businesses save at least 5% when they switch
                to Orca.
              </p>
              <a className="btn btn--primary final-cta__btn" href="#quote">
                Get an instant estimate <span className="final-cta__arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__copy">© 2026 Orca · orca.eco</p>
          <ul className="site-footer__links">
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Terms</a>
            </li>
            <li>
              <a href="mailto:hello@orca.eco">Contact</a>
            </li>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
