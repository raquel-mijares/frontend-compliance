# The reject button nobody can reach

Consent law and accessibility law meet in the same component, and most teams
treat them as separate tickets.

GDPR says refusing must be as easy as accepting. If your reject button can't be
reached with a keyboard, or isn't announced by a screen reader, then for those
users refusing is not as easy as accepting — it's impossible. The consent you
collected from them isn't valid, and the reason is a focus bug.

In the EU the European Accessibility Act has applied since June 2025, which
pulls WCAG 2.2 AA into scope for most consumer products. In Ontario the AODA
already did. The banner is the first thing every visitor meets, so it's also
the first thing that fails.

## What the dialog owes the user

**It's a dialog, so say so.** `role="dialog"`, `aria-modal="true"`, and a name
and description wired with `aria-labelledby` and `aria-describedby`. Without
these it's an anonymous box of buttons, and a screen reader user hears no
context for the choice being asked of them.

**Focus moves in, and comes back.** When the dialog opens, focus goes inside it.
When it closes, focus returns to what the user was on. Leaving focus at the top
of a page they never chose to be on is disorienting for everyone and lost work
for a keyboard user.

**Focus stays inside while it's open.** If Tab escapes into the page behind, the
user is operating a page they've been told is blocked, and can't find the way
back to the choice.

**Escape closes it, and closing is not consent.** This is where the two bodies
of law meet exactly. A modal that can't be dismissed traps people; a dismissal
read as acceptance is consent that was never given. Both are true at once, so
dismissing has to leave the state at `unknown` — nothing loads, and you can ask
again later.

**Which means withdrawal needs a door.** If Escape leaves the state unresolved,
there has to be a way back: a persistent control in the page. That's the same
control GDPR already required for withdrawing consent, so it's one button doing
two jobs rather than an extra feature.

**Visible focus.** `:focus-visible` with real contrast. A keyboard user who
can't see where they are is in the same position as one with no focus at all.

**Reject first in the DOM.** Not a dark pattern in reverse — just that the
cheapest choice to reach shouldn't be the one that profits you.

## Two bugs from this repo's own demo

Both are the kind that live for years because nothing tests them.

**The banner never actually hid.** The CSS said `#banner { display: flex }` and
the code set `banner.hidden = true`. The id selector outranks the UA stylesheet
rule for `[hidden]`, so the element stayed on screen after the user decided. It
looked correct in the code and was wrong on the page. The fix is one line —
`#banner[hidden] { display: none }` — and the reason it survived is that the
existing tests asserted what loaded, never what was visible.

**Consent could be given but not taken back.** The demo wired accept and reject
and stopped there. `ConsentState.withdraw()` existed and nothing called it, so
the page satisfied the part of the policy that's convenient and skipped the part
that isn't.

## How you test it

Keyboard-only assertions, in the same suite as everything else. See
[`tests/a11y.spec.ts`](../tests/a11y.spec.ts): that the dialog has an accessible
name, that focus lands on reject, that Tab cycles without escaping, that Enter
alone refuses, that Escape leaves the state `unknown` and fires no tracker, and
that focus returns where it came from.

Automated checks catch maybe half of what matters here. They will not tell you
whether the wording is comprehensible or the choice feels balanced. Use them for
the regressions — the focus trap someone breaks next quarter — and a real
screen reader for the rest.
