# frontend-compliance

Engineering notes on the part of compliance that ends up landing on the
front-end: consent, analytics without PII, children's privacy, and the evidence
a SOC 2 audit actually asks for.

Not legal advice. This is what I've had to solve building interfaces in audited
products — SOC 2, ISO 27001, GDPR and HIPAA in security compliance; COPPA and ad
attribution in streaming.

The thesis: most compliance that breaks in production **breaks on the client**.
Legal writes the policy, backend encrypts the database, and then a third-party
tag fires before the consent banner and six months of work falls over.

## Contents

| | |
|---|---|
| [Consent](docs/01-consent-gating.md) | Why the banner isn't the control, and where the control actually lives |
| [Analytics without PII](docs/02-analytics-pii.md) | GA4, GTM and CAPI without leaking personal data |
| [Children's privacy](docs/03-kids-privacy.md) | COPPA and GDPR art. 8 when your product carries kids content |
| [SOC 2 evidence](docs/04-soc2-frontend.md) | What the auditor will ask for that lives in the front-end |

## Examples

Runnable code, not pseudocode:

- [`src/consent.ts`](src/consent.ts) — consent state machine
- [`src/loader.ts`](src/loader.ts) — the single gate for third-party tags
- [`src/hash.ts`](src/hash.ts) — normalization and SHA-256 for conversion APIs
- [`tests/`](tests/) — specs that **fail** if anything fires before consent
- [`demo/`](demo/) — a small page wiring the two together, so the specs have
  something real to run against

```bash
npm install
npm test                       # 9 unit tests
npx playwright install chromium
npm run test:e2e               # 7 specs against the demo
```

The e2e run starts the demo itself. `npm run demo` serves it at
<http://localhost:4173> if you want to click through it by hand.

What the specs actually assert: no tracker request and no non-essential cookie
before a decision, nothing after rejecting, analytics **does** load after
accepting — a gate that blocks everything passes the first test and breaks the
product — reject costing the same as accept, and no PII leaving in URLs or
request bodies during signup.

## Why this exists

Because most writing on this is aimed at lawyers or at infra people, and the
person implementing it is whoever writes the component.
