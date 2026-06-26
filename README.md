# Spritefoundry

Spritefoundry is an Effect-first TypeScript library for generating used-only SVG sprites from Iconify sets and custom SVG folders.

Alpha goals:

- Resolve installed Iconify JSON sets and custom SVG folders.
- Build from explicit used-icon config.
- Export normalized SVG files, a hashed SVG sprite, a manifest, and generated TypeScript icon-name types.
- Provide runtime sprite loading helpers and Vue integration.
- Keep normal builds offline and runtime fetches limited to app-owned sprite assets.

Status: alpha scaffold.

SVG handling policy: [docs/svg-policy.md](docs/svg-policy.md).

Usage guide: [docs/usage.md](docs/usage.md).
