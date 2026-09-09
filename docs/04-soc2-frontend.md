# What a SOC 2 auditor asks of the front-end

SOC 2 isn't a certification with a fixed checklist: it's an audit that the
controls **you** said you have actually work, consistently, over a period.
Type I is a point in time; Type II is typically 3 to 12 months.

That changes what "being ready" means. It isn't fixing it the week before. It's
that the control has been working the whole period and you can show it.

## The part that ends up being front-end

**Access control.** Hiding a button is not access control. If the endpoint
answers someone who shouldn't be asking, it doesn't matter what the interface
shows. Hiding is UX; the control is on the server. The auditor tests it by
calling the endpoint.

What the client does contribute: permission states that are explicit and
testable, not `v-if` scattered across twenty components.

**Traceability of sensitive actions.** Permission changes, data exports,
deletions. The server writes the log, but the client has to send enough context
for the entry to mean anything.

**Session handling.** Idle timeout, a logout that actually invalidates
server-side, and no sensitive data left in `localStorage` surviving the logout.

**Dependencies.** This is where front-end fails most. It's a security criterion
and your `node_modules` is attack surface: `npm audit` in CI, a committed
lockfile, and a written process for patching within a defined window.

**Change management.** Every production change traceable to an approved review.
In practice: protected branch, mandatory PR, a reviewer who isn't the author,
green CI. If anyone can push straight to `main`, that control doesn't exist.

## Evidence beats intent

The difference between a control that passes and one that doesn't is usually
whether it produces **dated artifacts** automatically.

| Control | Weak evidence | Evidence that passes |
|---|---|---|
| Code review | "We review everything" | Protected branch + PR history for the period |
| Dependency scanning | "We use npm audit" | A CI job, with results archived |
| Consent gating | Screenshot of the banner | A CI test that fails if it fires early |
| Access control | A roles document | Per-role authorization tests, every build |

The pattern: **turn policy into a test.** A test that runs on every PR and fails
when the control stops holding produces continuous evidence without anyone
having to remember to collect it. It also happens to be what keeps the control
true.

## The scheduling mistake

Starting three weeks before the audit window. If your Type II period starts in
January and you enable branch protection in March, you have two months of
changes without the control. The auditor will see it in the history.

Controls have to be switched on **before** the period starts, not before it ends.

## Example CI

The workflow that generates that evidence is in
[`ci.example.yml`](ci.example.yml). Copy it to `.github/workflows/ci.yml`.

It runs typecheck, tests and `npm audit --audit-level=high` on every PR. The
first two keep the controls alive; the third produces the dated artifact.
