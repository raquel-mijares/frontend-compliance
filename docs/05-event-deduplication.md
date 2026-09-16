# Counting a conversion once

Send the same purchase from the browser Pixel and from the server Conversions
API and, done wrong, the platform counts two. Your reported ROAS goes up, your
optimization gets worse, and finance asks why the dashboard doesn't match the
orders table.

Both sends are deliberate. The browser event is fast and carries click context;
the server event survives ad blockers, ITP and a user closing the tab mid-redirect.
You want both. What you need is for the platform to recognize them as one.

## The mechanism

Meta deduplicates on the pair `event_name` + `event_id`. Both sends must carry
the same values. The matching window is about 48 hours, so a server event that
arrives late still collapses into the browser one.

The rule that makes it work: **the id is generated once, in the browser, and
travels to your server.** If the server mints its own id, nothing matches and
you get the double count you were trying to avoid.

```
browser                             your server            Meta
  |  newEventId() ───────────────────┐                       |
  |  Pixel: Purchase, event_id ──────┼──────────────────────>|
  |  POST /api/track { event_id } ──>|                       |
  |                                  |  CAPI: Purchase, ─────>|  same id →
  |                                  |       same event_id    |  one event
```

Google Ads and GA4 use a different name for the same idea: `transaction_id` on
the purchase event, consistent across gtag and the Measurement Protocol.

## Where it goes wrong

**A new id per send.** Calling the generator twice — once for the Pixel, once
where you build the server payload — is the most common version of this bug. It
looks correct in code review and fails silently in production.

**Reusing one id across events.** `event_id` identifies an occurrence, not a
user or a cart. Reusing it across a `ViewContent` and a `Purchase` makes the
platform drop one of them.

**Milliseconds instead of seconds.** `event_time` is a Unix timestamp in
seconds. `Date.now()` gives milliseconds and lands the event ~50,000 years in
the future, past the 7-day acceptance window. It fails as a rejection, not as a
duplicate, so it shows up as missing conversions rather than double ones.

**Dropping `fbp` and `fbc`.** These cookies carry the click attribution. The
server send has no browser context of its own, so if you don't forward them the
event still lands but attributes to nothing.

**Different `event_name` casing.** `purchase` and `Purchase` are different
events. No match.

## Consent still applies

Deduplication is an accuracy problem, not a legal one. The server send is not a
way around a refused consent: same data, same purpose, same legal basis. If the
user rejected advertising, neither send happens.

That means `event_id` generation belongs behind the same gate as everything else
— see [the consent notes](01-consent-gating.md). And the identifiers you attach
are hashed and normalized before they leave, which is
[the analytics notes](02-analytics-pii.md) and [`src/hash.ts`](../src/hash.ts).

## How you check it

Meta's Events Manager shows a deduplication rate per event. If it sits near zero
while you're sending both, the ids aren't matching.

Locally, the cheaper check is a test that builds both payloads and asserts they
carry the same id, that the timestamp is in seconds, and that no raw email is in
the body. See [`tests/events.test.ts`](../tests/events.test.ts). The last of
those catches the accident where someone adds the plain email "just for
debugging" alongside the hash.
