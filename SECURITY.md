# Security policy

## Reporting a vulnerability

Please don't open a public issue. Use GitHub's private reporting instead:

**[Report a vulnerability](https://github.com/raquel-mijares/frontend-compliance/security/advisories/new)**

Include what you found, how to reproduce it, and what you think the impact is.
You'll get an acknowledgement within 5 business days.

## What's in scope

This repository is reference code, not a published package. The things worth
reporting are the ones that would mislead someone copying it:

- The consent gate letting a tag load before a decision
- Personal data leaving in a payload that the tests say is clean
- A hashing or normalization bug that weakens the pseudonymization in
  `src/hash.ts`
- A vulnerable dependency that `npm audit` in CI isn't catching

## Supported versions

Only `main`. There are no releases.

## Dependencies

Dependabot opens weekly update PRs for npm packages and GitHub Actions. Every
update goes through the same required checks as any other change — typecheck,
unit tests, e2e and `npm audit --audit-level=high` — before it can merge.
