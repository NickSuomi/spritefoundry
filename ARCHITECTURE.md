# Spritefoundry Architecture

Spritefoundry is a small package set around one core pipeline: resolve selected icon sources, validate and normalize SVG, emit deterministic artifacts, and load the generated sprite from app-owned runtime assets.

## Packages

| Package | Role | Depends on |
| --- | --- | --- |
| `@nicksuomi/spritefoundry` | Core models, SVG policy, build pipeline, runtime sprite loader, filesystem seam. | `effect`, Iconify types/utilities |
| `@nicksuomi/spritefoundry-cli` | Node CLI wrapper around the core build pipeline. | Core package |
| `@nicksuomi/spritefoundry-vite` | Vite build plugin that runs the core pipeline during `writeBundle`. | Core package, Vite peer |
| `@nicksuomi/spritefoundry-vue` | Vue plugin, `SpriteIcon`, preload helper, composable. | Core runtime, Vue peer |

The core package owns artifact contracts. Integrations should adapt host tooling to the core interface instead of reimplementing SVG resolution or manifest behavior.

## Pipeline Flow

```text
spritefoundry.config.json
  -> Schema decode
  -> scanner proposal validation
  -> icon ref parsing
  -> source resolver
  -> SVG safety validation
  -> normalized SVG output
  -> sprite + hash
  -> manifest + types
```

The generated artifacts are:

- `svg/<icon>.svg`: normalized standalone SVG per public icon name.
- `sprite.<hash>.svg`: sprite containing one `<symbol>` per resolved icon.
- `manifest.json`: public icon name to symbol/viewBox/source metadata plus sprite asset metadata.
- `icons.d.ts`: TypeScript union for generated public icon names.

## Source Resolver Design

The pipeline treats icon refs as `<source>:<icon>`.

- Custom sources resolve from configured local SVG folders.
- Iconify sources resolve from installed `@iconify-json/*` packages under the project `node_modules`.
- Custom sources win when a configured custom source name matches the ref source name.
- Iconify resolution is the fallback for configured Iconify package names.

This is a deliberate seam. Adding another source type should add one resolver behind the same ref contract rather than changing callers or integrations.

## SVG Safety

`packages/core/src/svg.ts` owns SVG parsing, validation, ID namespacing, normalization, and symbol rendering.

The validator rejects active or external content instead of repairing it. The accepted SVG contract is intentionally narrower than general SVG. See [docs/svg-policy.md](docs/svg-policy.md).

## Filesystem Boundary

`SpritefoundryFileSystem` is the core filesystem seam. Production code provides `NodeSpritefoundryFileSystem.layer`; tests and future integrations can provide another layer without changing pipeline behavior.

This local seam remains in place until official Effect Node platform packages pass repo pnpm hardening. See [ADR 0001](docs/adr/0001-effect-v4-beta-and-pnpm-hardening.md).

## Runtime Loading

The runtime manifest has the smallest browser contract needed by integrations:

- `icons`: public icon name to `symbolId` and `viewBox`.
- `sprite.publicPath`: app-owned sprite asset URL.

`createSpriteLoader` fetches the sprite once, injects it into a hidden DOM container, and returns observable loading state. It does not fetch Iconify, registry, or remote SVG data.

## Vue Integration

The Vue package wraps the runtime loader:

- `createSpritefoundryVue` installs `SpriteIcon` and provides context.
- `preload()` loads the sprite before app mount when the caller wants to avoid first-render misses.
- `SpriteIcon` resolves manifest-backed names by default.
- `passthrough` is explicit for external symbol IDs.

## Extension Points

The supported extension points are:

- New source resolvers behind the `<source>:<icon>` ref contract.
- Additional host integrations that call `buildSpritefoundry`.
- Runtime adapters that consume `manifest.json`.
- More output metadata, if it remains backward-compatible for existing consumers.

Avoid shallow wrappers around the core pipeline. New packages should earn their interface by hiding host-specific behavior behind a small integration surface.

## Verification Expectations

Changes to core pipeline behavior should run:

```sh
pnpm typecheck
pnpm test
pnpm lint
```

Changes to dependency policy should also run:

```sh
pnpm install --frozen-lockfile
pnpm list --depth 0 -r
```
