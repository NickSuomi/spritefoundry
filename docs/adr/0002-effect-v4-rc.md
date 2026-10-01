# ADR 0002: One Effect 4 release-candidate graph

## Status

Accepted. Installation and working-tree verification passed. Pushed-head review
and publication remain delivery gates.

This decision supersedes the Effect 3 dependency choice in
[ADR 0001](0001-effect-v4-beta-and-pnpm-hardening.md). The June 2026 install
failures remain historical evidence. They do not establish the eligibility of
the current release candidate.

## Context

An Effect 4 consumer needs Spritefoundry's public build effects, schema classes,
and filesystem service to use the same Effect runtime. Retaining Effect 3 in
Spritefoundry would leave that consumer with two incompatible service and schema
graphs.

The migration belongs to [issue 31](https://github.com/NickSuomi/spritefoundry/issues/31).
Nick explicitly selected Effect 4 for the consuming application and its necessary
dependencies.

On 2026-10-01, the official npm registry identifies
[`effect@4.0.0-rc.117`](https://registry.npmjs.org/effect/4.0.0-rc.117) with the
[Effect repository](https://github.com/Effect-TS/effect), the MIT license, package
signatures, and a [SLSA provenance attestation](https://registry.npmjs.org/-/npm/v1/attestations/effect@4.0.0-rc.117).
SLSA is the Supply-chain Levels for Software Artifacts provenance format.
The [registry publish record](https://registry.npmjs.org/effect) dates rc117 to
2026-09-21T04:54:14.393Z, beyond the existing 10,080-minute release-age window.
Signature and attestation presence is metadata evidence. It does not replace a
successful install under Spritefoundry's own trust policy.

## Decision

Use exactly `effect@4.0.0-rc.117` throughout the workspace and the published
package import maps. Use one Effect 4 graph for core, CLI, Vite, and Vue consumers.
Do not retain an Effect 3 compatibility layer or a second runtime.

Ground the API port in rc117's published declarations. The installed Effect
Solutions guidance contains older service naming, so it cannot establish the
current API surface.

The public filesystem service retains its existing key and operations through
`Context.Service`. Schema classes and tagged errors use Effect 4's `Schema.Class`
and `Schema.TaggedStruct` types. Config decoding uses `Schema.decodeUnknownEffect`,
and recoverable failures use `Effect.catch`.

Keep the existing Node filesystem implementation and Node test runner. This
migration does not add a platform package, replace the CLI parser, or change the
SVG pipeline. Serialized config and manifest fields, generated SVG bytes and
hashes, loader states, and concurrent-load deduplication retain their contracts.
`getSpritefoundryInfo().effectLine` reports `effect-v4-rc`.

Keep the existing pnpm release-age, trust, store-integrity, and build-script
policies. Install failures must be resolved without weakening those policies.

## Verification receipt

On 2026-10-01, `pnpm install --frozen-lockfile --ignore-scripts` succeeded
under unchanged trust and release-age policies. The lock contains one Effect
version: `4.0.0-rc.117`. Every package import map and direct dependency uses it.

The downloaded npm archive (8,837,202 bytes) independently matched the registry
SHA-512 integrity value:

```text
sha512-UUyi9QiOW4nySFIBM3KnYbNMd9EZliOdKfBcyLD0mPMPheO2fkuXS5y0opjWc9oqzlJxPQICEGm8gGw3kh9j/w==
```

The accepted Effect 3 source fails compilation against rc117 at `TaggedErrorClass`,
`Context.Tag` and the old schema types. Restoring the source port byte-for-byte
then running `tsc -b tsconfig.packages.json --force` succeeds.

Working-tree checks passed with one worker at a time:

- `tsc -b tsconfig.packages.json`: no errors.
- `pnpm --workspace-concurrency=1 -r --if-present build`: all four packages built.
- `node --test --test-concurrency=1 "packages/*/dist/**/*.test.js"`: 32 passed,
  zero failures and zero skips.
- `node scripts/runtime-smoke.mjs`: core, CLI, Vite and Vue consumers passed on
  Node 24.8.0.
- `node scripts/check-forbidden-terms.mjs`: no forbidden references.

The pushed commit still requires independent review, fresh continuous-integration
checks and the existing JSR publication dry run. Working-tree checks establish
the source port, not a published artifact.

## Consequences

Effect 4 consumers can compose Spritefoundry's build effects with their own
services. Effect 3 consumers must migrate to the same release candidate when
adopting this package release.

Future Effect upgrades require a new age and trust check plus verification of
the published package graph. The historical permission to use stable Effect 3
does not authorize a fallback that recreates two runtimes.
