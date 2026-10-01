# ADR 0003: One stable Effect 4 graph

## Status

Accepted for source preparation. Exact-head review, continuous-integration checks and package publication remain separate delivery gates.

This decision supersedes the release-candidate selection in [ADR 0002](0002-effect-v4-rc.md).

## Context

[Issue 33](https://github.com/NickSuomi/spritefoundry/issues/33) moves the workspace and its published import maps from Effect 4.0.0-rc.117 to stable Effect 4.0.0. Consumers must share one runtime and schema graph with Spritefoundry.

The [official stable release](https://github.com/Effect-TS/effect/releases/tag/effect%404.0.0) and its [migration guide](https://github.com/Effect-TS/effect/blob/effect%404.0.0/MIGRATION.md) define the target. The [registry metadata](https://registry.npmjs.org/effect/4.0.0) names the Effect repository and MIT license and provides package signatures and a [provenance attestation](https://registry.npmjs.org/-/npm/v1/attestations/effect@4.0.0). Metadata presence does not establish successful trust-policy installation.

## Decision

Pin effect to exactly 4.0.0 in root, core and CLI manifests and all package import maps. Prepare version 0.0.6 for all four public packages. Dependent JSR import maps require core 0.0.6; core must publish first through the existing workflow.

The existing release-candidate implementation already uses Context.Service and root effect imports. Preserve the public filesystem service, schema types, generated SVG bytes, hashes and loader behavior. Public package metadata now reports effect-v4-stable.

Nick explicitly approved stable Effect 4 and an exception to the seven-day release-age rule for this upgrade on 2026-10-01. Add only effect@4.0.0 to minimumReleaseAgeExclude. Keep the 10,080-minute default, strict age validation, no-downgrade trust policy, store integrity and build-script restrictions. [pnpm documents exact-version exclusions](https://pnpm.io/settings/dependency-resolution#minimumreleaseageexclude); this exception does not admit future Effect versions or other packages.

## Verification

The existing release-candidate baseline passed all 32 tests and core, CLI, Vite and Vue Node runtime checks. Changing the wired public metadata assertion first produced 31 passes and one failure: actual effect-v4-rc, expected effect-v4-stable.

On 2026-10-01, stable installation and a frozen offline install succeeded under those controls. The scoped lock contains only Effect 4.0.0. Forced TypeScript compilation rebuilt all four package projects without errors. All 32 wired tests passed. The runtime check first caught its retained release-candidate metadata assertion; that assertion now follows the stable public contract. Core, CLI, Vite and Vue runtime checks then passed on Node 24.8.0. The private-reference guard passed.

Independent exact-head review, continuous-integration and the existing JSR publication dry run remain delivery gates. A source check is not proof that version 0.0.6 is published.

## Consequences

Consumers adopting 0.0.6 must use stable Effect 4.0.0. The project keeps no prerelease or Effect 3 compatibility layer. A later dependency upgrade needs its own exact-version eligibility and compatibility checks.
