# Children's privacy

If your product carries content aimed at children, the rules change in ways that
break normal front-end assumptions. This isn't "compliance with extra
paperwork": there are things you simply cannot do.

## What changes

Under **COPPA** (US, under 13):

- Contextual advertising **yes**, behavioural advertising **no**. No profiling.
- Verifiable parental consent before collecting personal information.
- Persistent identifiers count as personal information. That includes cookies,
  device IDs and advertising IDs.
- Real minimization: only what the activity strictly needs.

Under **GDPR art. 8** (EU), the age of consent defaults to 16, and each member
state may lower it to 13. If you operate across countries, the threshold depends
on where the user is.

## The pattern that works: two contexts, not a flag

The temptation is an `isKids` boolean that switches things off. It breaks the
moment someone adds a new tag and forgets the `if`.

What survives an audit is treating it as **two distinct execution contexts**,
with separate tag inventories:

```ts
const TAGS = {
  general: [analytics, advertising, personalization, sessionRecording],
  kids:    [analyticsAggregatedOnly],
};
```

The kids context starts from an empty list and only gets what has been reviewed
explicitly. If someone registers a new tag without consciously deciding it
belongs in `kids`, it doesn't get in. Failure by omission lands on the safe side.

## Where it leaks anyway

- **Video player.** The player SDK sends its own telemetry and usually brings
  its own advertising identifier. It has to be configured separately from
  everything else.
- **Smart TV.** Platforms have their own identifiers. On Roku, Tizen or webOS
  that isn't controlled by your application code — it's the manifest and the
  platform configuration.
- **Embedded content.** A standard YouTube embed sets cookies.
  `youtube-nocookie.com` exists for exactly this.
- **Fonts and CDNs.** Loading a font from a third-party CDN transmits the IP.
  Self-host them.
- **Crash reporting.** Sentry and friends capture more context than you think.

## Age gating that isn't theatre

A date-of-birth picker is not verifiable parental consent, and any child gets
past it. What makes the technical difference:

- **Neutral**, unbiased. Ask for the date, not "are you over 13?" with yes
  pre-selected.
- **Not retryable.** If the result is under age, persist the decision. Without
  that, reload and try another date.
- **Enforced server-side.** If the gate only lives on the client, it doesn't
  exist.

## What to check before assuming you comply

- [ ] The kids-context tag inventory is written down and reviewed
- [ ] No tag registers itself: adding one requires picking a context
- [ ] The player SDK has kids-specific configuration
- [ ] Embeds use cookieless variants
- [ ] Fonts and assets are self-hosted
- [ ] The age gate persists and is enforced server-side
- [ ] There's a test that fails if a disallowed request appears in the kids
      context

That last one is what keeps the rest true a year from now. The list without the
test is a document; with the test it's a control.

## Implementation notes

[`src/contexts.ts`](../src/contexts.ts) implements the two-context pattern above.
`TagRegistry.register` requires an explicit list of contexts, so a tag can't end
up anywhere by default. The kids context only contains what was listed for it,
and an `advertising` tag registered for `kids` throws at startup instead of
shipping.

The loader doesn't change: it receives `registry.for(context)` and gates on
consent as usual. Consent and audience are separate questions. A child's parent
clicking "accept" does not turn behavioural advertising back on.

The demo runs in the kids context with `?audience=kids`.
[`tests/kids.spec.ts`](../tests/kids.spec.ts) accepts consent there and fails if
any tracker is contacted — the last item on the checklist above.
