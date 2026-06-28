# Usage Notes

The canonical first-run guide now lives in [README.md](../README.md). Keep this page for expanded recipes that would make the README harder to scan.

Current supported entry points:

- CLI build from `spritefoundry.config.json`.
- Vite build integration through `@nicksuomi/spritefoundry-vite`.
- Runtime sprite preload through `createSpriteLoader`.
- Vue integration through `createSpritefoundryVue`, `preload()`, and `SpriteIcon`.

See [ARCHITECTURE.md](../ARCHITECTURE.md) for package boundaries and [SVG policy](svg-policy.md) for SVG input rules.
