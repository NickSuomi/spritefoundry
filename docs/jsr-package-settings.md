# JSR Package Settings

JSR package descriptions and runtime compatibility live in each package page's Settings tab. Keep these settings aligned with this repo's smoke tests.

Source facts:

- JSR package descriptions are Settings-tab metadata and can be up to 250 characters.
- JSR runtime compatibility supports Deno, Node.js, Cloudflare Workers, Bun, and web browsers, each as Supported, Unsupported, or Unknown support.
- Compatibility evidence in this repo is local runtime smoke output, not package metadata alone.

## Proof Commands

Run these before changing JSR runtime settings:

```sh
pnpm typecheck
pnpm test
pnpm smoke:runtime:node
pnpm smoke:runtime:bun
```

`pnpm smoke:runtime:node` and `pnpm smoke:runtime:bun` build the workspace, then exercise the built dist for:

- `@nicksuomi/spritefoundry`: public metadata, build pipeline, Node filesystem layer, runtime sprite loader.
- `@nicksuomi/spritefoundry-cli`: CLI build command through `runSpritefoundryCli`.
- `@nicksuomi/spritefoundry-vite`: Vite build plugin writing sprite outputs.
- `@nicksuomi/spritefoundry-vue`: Vue plugin preload plus SSR render of `SpriteIcon`.

## Recommended Settings

| Package | Description | Node.js | Bun | Deno | Browsers | Cloudflare Workers |
| --- | --- | --- | --- | --- | --- | --- |
| `@nicksuomi/spritefoundry` | Effect-first SVG sprite pipeline for Iconify and custom SVG sources. | Supported | Supported | Unknown support | Unknown support | Unknown support |
| `@nicksuomi/spritefoundry-cli` | Node and Bun CLI for Spritefoundry SVG sprite builds. | Supported | Supported | Unknown support | Unknown support | Unknown support |
| `@nicksuomi/spritefoundry-vite` | Vite build plugin for Spritefoundry SVG sprite generation. | Supported | Supported | Unknown support | Unknown support | Unknown support |
| `@nicksuomi/spritefoundry-vue` | Vue integration for Spritefoundry sprite loading and typed icons. | Supported | Supported | Unknown support | Unknown support | Unknown support |

## Score Impact

Current live Score tabs show these package-settings gaps for all four packages:

- `Has a description`: `0/1`
- `At least one runtime is marked as compatible`: `0/1`
- `At least two runtimes are marked as compatible`: `0/1`

After maintainers apply descriptions and set Node.js plus Bun to Supported, expected score delta is `+3` points per package.

## Manual Update Rule

Do not publish packages or mutate JSR account settings from this repo unless an official authenticated JSR CLI/API is configured and documented here. With current repo docs, update JSR Settings manually from each package page.
