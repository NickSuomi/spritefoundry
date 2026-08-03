# Spritefoundry

Spritefoundry is Effect-first TypeScript tooling that turns selected Iconify and custom SVG icons into an app-owned SVG sprite, manifest, and typed icon names.

Status: alpha.

## What is Spritefoundry?

Spritefoundry builds a small, deterministic icon artifact for an application that wants to control exactly which icons it ships. It resolves only configured local sources, validates SVG input, and produces generated files that an application can serve itself.

## Why Spritefoundry?

- App builds often need selected icons rather than a full icon library.
- Runtime icon loading should not require fetching from third-party icon services.
- Icon names and generated artifacts should be deterministic and type-safe across build and runtime integrations.

Spritefoundry is not a general SVG optimizer replacement.

## How it works

1. Configure explicit Iconify and custom SVG sources plus the icons to expose.
2. Run the core pipeline through the CLI or Vite plugin.
3. Resolve, validate, and normalize each configured icon.
4. Emit standalone SVGs, a hashed sprite, `manifest.json`, and `icons.d.ts`.
5. Load the generated, app-owned sprite at runtime.

## Quick start

### Install

JSR is the primary registry:

```sh
pnpm add -D jsr:@nicksuomi/spritefoundry jsr:@nicksuomi/spritefoundry-cli @iconify-json/lucide
pnpm add jsr:@nicksuomi/spritefoundry-vue
```

For Vite:

```sh
pnpm add -D jsr:@nicksuomi/spritefoundry-vite vite
```

The npm packages remain a supported fallback; see [usage notes](docs/usage.md).

### Configure and build

Create `spritefoundry.config.json`:

```json
{
  "iconifySources": [{ "name": "lucide", "packageName": "@iconify-json/lucide" }],
  "customSources": [{ "name": "brand", "directory": "icons/brand" }],
  "icons": [
    { "name": "home", "ref": "lucide:home" },
    { "name": "logo", "ref": "brand:logo" }
  ],
  "output": { "directory": "dist/icons" }
}
```

```sh
pnpm node scripts/spritefoundry.mjs build --config spritefoundry.config.json
```

The build writes `svg/<icon>.svg`, `sprite.<hash>.svg`, `manifest.json`, and `icons.d.ts`.

## Integrations

- **CLI** — builds an app-owned icon artifact from explicit configuration.
- **Vite** — runs the same pipeline during `writeBundle`.
- **Runtime** — loads the generated sprite once from `manifest.sprite.publicPath`.
- **Vue** — provides `SpriteIcon`, a preload helper, and manifest-backed name resolution.

See [usage notes](docs/usage.md) for integration examples.

## Architecture

One core pipeline owns the artifact contract: source resolution, SVG safety validation, normalization, sprite generation, manifest generation, and types. CLI, Vite, runtime, and Vue packages adapt that contract rather than reimplementing it.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for package boundaries and extension points.

## Security and offline guarantees

- Builds read installed Iconify JSON packages and local custom SVG files.
- Runtime helpers fetch only the generated sprite asset owned by the application.
- SVG input with active or external content is rejected rather than repaired.
- Generated sprite filenames are content-hashed.

Read the exact [SVG policy](docs/svg-policy.md) before adding custom icons.

## Known limitations

- Spritefoundry is alpha; package and integration interfaces may change.
- Custom SVG input must have one `<svg>` root and a numeric `viewBox`.
- The accepted SVG policy is intentionally narrower than general SVG.

## Verify

```sh
pnpm typecheck
pnpm test
pnpm lint
```

For dependency-policy changes, also run:

```sh
pnpm install --frozen-lockfile
pnpm list --depth 0 -r
```

## Related projects

- [Iconify Tools](https://iconify.design/docs/libraries/tools/) — icon-set tooling; Spritefoundry builds selected, app-owned artifacts.
- [vite-plugin-svg-icons](https://github.com/vbenjs/vite-plugin-svg-icons) — Vite sprite generation; Spritefoundry shares one core contract across CLI, Vite, runtime, and Vue.

## License

Spritefoundry is licensed under [Apache-2.0](LICENSE). See [NOTICE](NOTICE) for attribution.
