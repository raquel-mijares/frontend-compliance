# The banner is not the control

The most common thing I've seen fail an audit: treating the consent banner as if
it were the compliance mechanism. It isn't. The banner is **interface**. The
mechanism is whatever prevents anything from loading until there's a decision.

If your banner is beautiful and accessible but the GTM snippet sits in `<head>`
unconditionally, you comply with nothing. You've just documented it on screen.

## What prior consent actually requires

Under GDPR — and ePrivacy, which is the one that governs cookies — consent must
be **prior, specific, informed and unambiguous**, and as easy to withdraw as to
give. In front-end terms:

- Nothing non-essential loads before `accept`. Not the script, not the cookie,
  not the network request.
- "Continued browsing implies acceptance" doesn't hold. Scrolling isn't consent.
- Rejecting must cost what accepting costs. One button, same level.
- No pre-ticked boxes. Non-essential categories start at `false`.
- Withdrawal is always available, not buried in a PDF.

## Where the control goes

One gate, and everything passes through it:

```
user decision
      ↓
 consent state      ←── persisted, versioned
      ↓
  tag loader        ←── the only place that injects scripts
      ↓
 third parties (GA4, Meta, …)
```

No component loads its own script. None. The moment a team drops a vendor
`<script>` straight into their view "because it was quicker", the gate stops
existing and nobody finds out until the audit.

## Three states, not two

The design mistake I've had to undo most often is modelling consent as a
boolean. There are three states:

| State | Means | What loads |
|---|---|---|
| `unknown` | Hasn't decided yet | Nothing non-essential |
| `granted` | Accepted this category | That category's tags |
| `denied` | Explicitly refused | Nothing, and don't re-prompt on every view |

With a boolean, `false` means both "said no" and "hasn't said anything yet", so
you either fire early or re-prompt forever.

## Version the decision

Consent is given against a specific policy. Change the categories or add a
vendor, and the earlier consent doesn't cover the new thing.

Always store the version alongside the decision:

```json
{
  "version": 3,
  "timestamp": "2026-09-08T14:22:31.000Z",
  "categories": { "analytics": true, "advertising": false }
}
```

When `CURRENT_VERSION > stored.version`, the state returns to `unknown`. This is
literally the evidence an auditor will ask for: *show me that this user
consented to this version of the policy, and when.*

## Google Consent Mode

If you use GA4 or Google Ads, Consent Mode v2 expects four signals:

- `ad_storage`
- `analytics_storage`
- `ad_user_data`
- `ad_personalization`

The detail people miss: you have to send the default state as `denied`
**before** gtag loads, then send the `update` once the user decides. Send only
the update and there's a window where it fired in granted mode.

```js
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});
```

## How you prove it

A test that opens the page without interacting and fails if **any** request goes
out to a third-party domain. See [`tests/consent.spec.ts`](../tests/consent.spec.ts).

This is what turns "we comply" into something verifiable in CI instead of a
claim made in a meeting.

## Implementation notes

On [`src/loader.ts`](../src/loader.ts): it is deliberately the only thing in the
codebase that injects third-party scripts. If a component does it directly the
gating stops being verifiable, and the CI test no longer proves anything. That
restriction is the control; the code only expresses it.

`reloadOnWithdrawal` exists because withdrawing consent doesn't unload a script
that already ran. Removing the tag from the DOM doesn't undo what executed. If
your policy promises tracking stops immediately, you need the reload.

On [`src/consent.ts`](../src/consent.ts): the empty `catch` blocks around storage
are intentional. In private mode, or with storage full, `setItem` throws. The
state then lives in memory for the session and the user is asked again next time
— which is the correct behaviour. What you must never do is treat a failed write
as consent granted.
