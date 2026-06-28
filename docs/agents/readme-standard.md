# README Standard For Nick OSS Libraries

Use this structure for small public TypeScript libraries. Keep README user-facing, concise, and linked to deeper docs instead of duplicating them.

## Required Shape

1. Project name and one-line summary.
2. Problem: what pain the library removes.
3. Solution: what the library does differently.
4. Diagram: one visual flow when behavior has more than two moving parts.
5. Install: package manager commands for supported packages.
6. Minimal config: smallest useful config file.
7. CLI usage: one build command and generated artifacts.
8. Framework usage: Vite and Vue when packages exist.
9. Runtime behavior: what loads at build time and runtime.
10. Security and offline guarantees: network, SVG safety, reproducibility.
11. Comparison: concise, source-linked positioning against adjacent public tools.
12. Links: architecture, policy, usage, issue tracker, license.

## Writing Rules

- Lead with what a user can do in the first five minutes.
- Prefer one complete example over many partial examples.
- Keep marketing modest and evidence-backed.
- Link to architecture docs for module boundaries, seams, and extension points.
- Link to policy docs for security-sensitive behavior.
- Avoid private, company, customer, or unreleased product references.

## Spritefoundry Mapping

- Diagram: icon source resolution to generated sprite manifest and runtime loading.
- Install: core, CLI, Vite, Vue, and Iconify JSON package examples.
- Minimal config: one Iconify source, one custom source, two explicit icons.
- Runtime behavior: hashed sprite fetch from app-owned assets only.
- Security: local Iconify data, conservative SVG policy, pnpm hardening.
