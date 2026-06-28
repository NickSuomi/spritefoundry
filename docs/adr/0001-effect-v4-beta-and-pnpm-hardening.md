# ADR 0001: Effect Packages And pnpm Hardening

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

On 2026-06-28, research was refreshed with Node `v24.8.0`, pnpm `11.7.0`, the repo `.npmrc`, and the repo `pnpm-workspace.yaml`.

Effect Solutions was consulted before deciding package patterns:

- `pnpm exec effect-solutions list`
- `pnpm exec effect-solutions show project-setup tsconfig services-and-layers testing cli config`

Current package metadata and install probes showed:

- `effect@latest` is `3.21.4`, published 2026-06-18, and installed successfully under current pnpm hardening.
- `effect@beta` is `4.0.0-beta.91`, published 2026-06-28. `pnpm add effect@beta` resolved to an eligible older beta, `4.0.0-beta.85`, and failed `trustPolicy=no-downgrade`.
- `@effect/platform@0.96.2` with `effect@3.21.4` installed successfully. It peers `effect@^3.21.4`.
- `@effect/platform-node@0.107.0` did not pass current hardening. The install failed `strictDepBuilds` because `@parcel/watcher@2.5.6` has an ignored build script. Adding its full peer set did not remove that blocker.
- `@effect/vitest@0.29.0` with `vitest@3.2.4` and `effect@3.21.4` did not pass current hardening. The install failed `trustPolicy=no-downgrade` for `nanoid@3.3.14` through the Vitest dependency graph.
- A complete CLI package set installed and passed peer checks: `@effect/cli@0.75.2`, `@effect/platform@0.96.2`, `@effect/printer@0.49.0`, `@effect/printer-ansi@0.49.0`, `@effect/typeclass@0.40.0`, and `effect@3.21.4`.
- `@effect/schema@0.75.5` installed but is deprecated because schema has been merged into the main `effect` package.

## Decision

Use stable registry `effect@3.21.4` for the root workspace, core package, and CLI package.

Do not use pinned `pkg.pr.new` Effect preview packages for production dependencies.

Do not use `@effect/platform-node` or `@effect/vitest` until official package sources pass current pnpm hardening. Use Effect core plus local Node service layers for filesystem/process boundaries and the Node test runner for tests in the meantime.

Use installed package declarations, official package metadata, and Effect Solutions as source-of-truth references before writing Effect code. Do not guess Effect APIs.

## 2026-06-28 Decision Update

Production-ready migration should target stable registry Effect v3, not the current registry v4 beta line.

Issue #17 replaced the pinned `pkg.pr.new` Effect v4 beta with `effect@3.21.4`. This was an API migration, not a package-only update.

Package choices for #17:

- Use `effect@3.21.4` as the production-ready core package.
- Keep the local `SpritefoundryFileSystem` service seam. `@effect/platform@0.96.2` installs, but without `@effect/platform-node` it does not reduce the tested Node filesystem boundary in this slice.
- Keep the current Effect-driven CLI parser. The complete `@effect/cli` peer set installs, but adopting it is a separate CLI behavior migration.
- Do not add `@effect/platform-node` yet because `@parcel/watcher` fails current build-script hardening.
- Do not add `@effect/vitest` yet because the Vitest dependency graph fails current trust policy.
- Do not add `@effect/schema`; use Schema from `effect`.

Implemented migration details for #17:

1. Replaced pinned `pkg.pr.new` `effect` specs with registry `effect@3.21.4`.
2. Updated public metadata from `effect-v4-beta` to `effect-v3-stable`.
3. Adapted v4 beta-specific APIs to stable v3 APIs: `Schema.TaggedError`, `Context.Tag`, `Schema.decodeUnknown`, variadic `Schema.Union`, keyed `Schema.Record`, and `Effect.catchAll`.
4. Kept Node's test runner until the `@effect/vitest` dependency graph passes trust policy.
5. Deferred `@effect/cli` until a dedicated CLI behavior migration.

## Consequences

- The repo follows stable Effect v3 APIs from the npm registry without bypassing pnpm hardening.
- Moving to a future Effect v4 line requires checking publish age, trust policy, Node engine constraints, and rerunning verification.
- Official platform package usage is deferred until it can be installed without weakening policy.
- Effect-driven service boundaries remain isolated so public Spritefoundry APIs stay stable across future package-line changes.
