# ADR 0001: Effect v4 Beta And pnpm Hardening

## Status

Accepted.

## Context

Spritefoundry is Effect-first. Core logic, CLI logic, config parsing, IO, validation, errors, tests, and orchestration must use Effect idioms.

Local pnpm security hardening is active and must not be weakened. Confirmed settings include `minimumReleaseAge=10080`, `minimumReleaseAgeStrict=true`, `strictDepBuilds=true`, `dangerouslyAllowAllBuilds=false`, and `verifyStoreIntegrity=true`.

On 2026-06-26, npm reported:

- `effect` latest: `3.21.4`
- `effect` beta: `4.0.0-beta.90`
- `effect@4.0.0-beta.90` publish time: 2026-06-25
- Newest v4 beta older than the local release-age window: `4.0.0-beta.84`, published 2026-06-17
- All sampled npm v4 betas from `4.0.0-beta.1` through `4.0.0-beta.84` failed pnpm `trustPolicy=no-downgrade`.
- `pkg.pr.new` direct packages from `Effect-TS/effect-smol` installed without weakening pnpm policy.
- Latest checked `effect-smol` commit `aaa21a369a171c600db294f2a4f640583043e150` failed current local Node engine constraints through `ini@7.0.0`.
- Preview commit `4c9e6978` provides `effect@4.0.0-beta.66`, uses `ini@^6.0.0`, and installed under current pnpm hardening and Node runtime.
- Preview commit `18450f6` installed but resolved to old `effect@3.0.0`, so it is rejected for Spritefoundry.
- `@effect/vitest` from `pkg.pr.new` pulled a blocked registry Effect v4 beta in testing, so it is deferred.
- `@effect/platform-node` from `pkg.pr.new` failed `blockExoticSubdeps` because it depends on `@effect/platform-node-shared` through an exotic URL subdependency.

## Decision

Use pinned `pkg.pr.new` package from `Effect-TS/effect-smol` commit `4c9e6978` for `effect` until npm v4 beta packages pass local pnpm hardening.

Do not use `@effect/platform-node` or `@effect/vitest` until official package sources pass current pnpm hardening. Use Effect core plus local Node service layers for filesystem/process boundaries and the Node test runner for tests in the meantime.

Use `Effect-TS/effect-smol` and Effect Solutions as source-of-truth references before writing Effect code. Do not guess Effect APIs.

## Consequences

- The repo follows Effect v4 beta APIs from `effect-smol` without bypassing pnpm hardening.
- Upgrading to a newer v4 beta requires checking publish age, trust policy, Node engine constraints, and rerunning verification.
- Official platform package usage is deferred until it can be installed without weakening policy.
- Effect APIs are allowed to change because the selected line is beta; implementation should isolate Effect-driven service boundaries and keep public Spritefoundry APIs stable.
