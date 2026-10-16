import { useRef, useState, type SubmitEvent } from 'react';
import type { Decision } from '../src/consent';
import { audience, consent, loader, tags } from './setup';
import { useConsent } from './useConsent';
import { ConsentDialog } from './ConsentDialog';

const LABELS: Record<Decision, string> = {
  granted: 'Granted',
  denied: 'Denied',
  unknown: 'Not asked yet',
};

function Badge({ decision }: { decision: Decision }) {
  return <span className={`badge badge--${decision}`}>{LABELS[decision]}</span>;
}

export function App() {
  const state = useConsent(consent);
  const [dismissed, setDismissed] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const settingsRef = useRef<HTMLButtonElement>(null);

  const openSettings = () => {
    consent.withdraw();
    loader.reloadOnWithdrawal();
    setDismissed(false);
  };

  const signUp = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    void fetch('/api/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: data.get('email'), phone: data.get('phone') }),
    }).catch(() => {});
    history.replaceState(null, '', '/welcome');
    setSignedUp(true);
  };

  return (
    <>
      <header className="topbar">
        <div className="container topbar__inner">
          <a className="brand" href="https://github.com/raquel-mijares/frontend-compliance">
            <span className="brand__mark" aria-hidden="true" />
            frontend-compliance
          </a>
          <nav aria-label="Audience" className="segmented">
            <a href="/" aria-current={audience === 'general' ? 'page' : undefined}>
              General
            </a>
            <a href="/?audience=kids" aria-current={audience === 'kids' ? 'page' : undefined}>
              Kids
            </a>
          </nav>
        </div>
      </header>

      <main className="container layout">
        <section className="intro" aria-labelledby="intro-title">
          <p className="eyebrow">Live demo</p>
          <h1 id="intro-title">Consent-gated tag loading</h1>
          <p className="lede">
            Nothing third-party runs before a decision, rejecting costs the same as
            accepting, and no personal data leaves for a tracker. The Playwright specs
            in the repository check all of it against this page.
          </p>
          <button
            ref={settingsRef}
            type="button"
            className="btn btn--outline"
            onClick={openSettings}
          >
            Cookie settings
          </button>
        </section>

        <section className="card status" aria-labelledby="status-title">
          <h2 id="status-title" className="card__title">
            Consent status
          </h2>
          <ul className="rows">
            <li className="row">
              <span>Strictly necessary</span>
              <span className="badge badge--granted">Always on</span>
            </li>
            <li className="row">
              <span>Analytics</span>
              <Badge decision={state.analytics} />
            </li>
            <li className="row">
              <span>Advertising</span>
              <Badge decision={state.advertising} />
            </li>
          </ul>

          <h3 className="card__subtitle">Third-party tags</h3>
          {tags.length === 0 ? (
            <p className="muted">No third-party tags are registered for the kids audience.</p>
          ) : (
            <ul className="rows">
              {tags.map((tag) => {
                const loaded = consent.allows(tag.category);
                return (
                  <li className="row" key={tag.id}>
                    <span className="tag">
                      <span className="mono">{tag.id}</span>
                      <span className="tag__host muted">{new URL(tag.src).hostname}</span>
                    </span>
                    <span className={`badge ${loaded ? 'badge--granted' : 'badge--blocked'}`}>
                      {loaded ? 'Loaded' : 'Blocked'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <p id="state" className="state mono">
            consent: analytics={state.analytics} advertising={state.advertising}
          </p>
        </section>

        <section className="card signup" aria-labelledby="signup-title">
          <h2 id="signup-title" className="card__title">
            Create an account
          </h2>
          <p className="muted">
            The form posts to this site only. The specs fail if an email or phone number
            reaches a third party in a URL or a request body.
          </p>
          <form className="form" onSubmit={signUp}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" />
            </div>
            <button type="submit" className="btn btn--primary btn--block">
              Sign up
            </button>
            <p className="form__status" role="status">
              {signedUp ? 'Signed up. Nothing personal was sent to a third party.' : ''}
            </p>
          </form>
        </section>
      </main>

      <footer className="container footer muted">
        Not legal advice. Source and engineering notes on{' '}
        <a href="https://github.com/raquel-mijares/frontend-compliance">GitHub</a>.
      </footer>

      <ConsentDialog
        open={!state.resolved && !dismissed}
        returnFocusTo={settingsRef}
        onAccept={() => consent.acceptAll()}
        onReject={() => consent.rejectAll()}
        onDismiss={() => setDismissed(true)}
      />
    </>
  );
}
