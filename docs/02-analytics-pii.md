# Analytics without leaking personal data

Analytics leaks PII almost always by accident, and almost always through the
same door: **the URL**.

## The case that keeps happening

```
/reset-password?token=abc123&email=ana@example.com
```

GA4 collects the full `page_location` by default. That email has just entered
your analytics property — a third-party system, probably in another
jurisdiction, with a retention policy you don't control. And GA4 doesn't want
it: sending PII violates their terms and they can purge the property.

Same with referrers. A page with the email in the query links out to another,
and the email travels in the `Referer` header to every third party on the
destination page.

## Practical rule

**Never put identifiers in the query string.** Not email, not phone, not name,
not the session token. They go in the POST body, or in the path as an opaque id.

If you've inherited a system that already does it and can't change that today,
sanitize before it reaches the tag:

```js
const PII_PARAMS = ['email', 'phone', 'token', 'name', 'ssn'];

function sanitizeUrl(raw) {
  const url = new URL(raw);
  for (const p of PII_PARAMS) {
    if (url.searchParams.has(p)) url.searchParams.set(p, '[redacted]');
  }
  return url.toString();
}
```

That's a patch. The fix is not putting it there.

## The other ways it escapes

| Vector | How it happens |
|---|---|
| Page titles | `document.title = "Ana García's order"` → ships on every event |
| Event parameters | `track('signup', { email })` because it was handy for debugging |
| Custom dimensions | Someone maps `user_email` "temporarily" |
| Session recording | Hotjar/FullStory capturing an unmasked form |
| Error messages | `logError("payment failed for ana@example.com")` |
| `user_id` | Correct in GA4 — but it has to be opaque, not the email |

## Server-side is not a band-aid

Moving tags to a server container or to CAPI improves reliability and gives you
one place to sanitize. It exempts you from nothing: you're still processing
personal data, you still need a legal basis, and consent still applies.

What it does solve: **a single point** where you can inspect and redact before
anything leaves for a third party. That's a lot, but it's hygiene, not
compliance.

## Hashing is not anonymizing

A `SHA-256` of an email is a **pseudonym**, not an anonym. It's deterministic
and the email space is enumerable: anyone with a list can brute-force it back.
Under GDPR it remains personal data (recital 26).

It's good for two real things: letting a vendor match without seeing the
original, and reducing harm if there's a breach. It is not good for claiming
"this isn't PII any more."

## Implementation notes

On [`src/hash.ts`](../src/hash.ts): normalizing before hashing isn't cosmetic.
`"  Ana@Example.COM "` and `"ana@example.com"` produce different hashes, the
vendor reconciles nothing, and your match rate collapses without anything
visibly failing. It's the number one cause of bad CAPI attribution.

And repeating the point above because it gets forgotten: hashing reduces
exposure, it doesn't remove it. Still personal data, still needs a legal basis.

## How you verify it

Not by checking the Network tab once. A test that navigates, exercises the
sensitive flows, and **fails** if any outbound request contains something shaped
like an email or a phone number. See [`tests/no-pii.spec.ts`](../tests/no-pii.spec.ts).
