# Usage

Spritefoundry builds used-only SVG sprites from installed Iconify JSON packages and local custom SVG folders. Normal builds are offline. Runtime helpers fetch only the app-owned sprite asset from the generated manifest.

## Install

```sh
pnpm add -D @nicksuomi/spritefoundry @nicksuomi/spritefoundry-cli @iconify-json/lucide
pnpm add @nicksuomi/spritefoundry-vue
```

The Vue package keeps `vue` as a peer dependency. The Vite package is optional:

```sh
pnpm add -D @nicksuomi/spritefoundry-vite vite
```

## Config

Create `spritefoundry.config.json`:

```json
{
  "iconifySources": [
    {
      "name": "lucide",
      "packageName": "@iconify-json/lucide"
    }
  ],
  "customSources": [
    {
      "name": "brand",
      "directory": "icons/brand"
    }
  ],
  "icons": [
    {
      "name": "home",
      "ref": "lucide:home"
    },
    {
      "name": "logo",
      "ref": "brand:logo"
    }
  ],
  "output": {
    "directory": "dist/icons"
  }
}
```

Custom SVG files must include a numeric `viewBox`. See [SVG policy](svg-policy.md).

## CLI

```sh
pnpm spritefoundry build --config spritefoundry.config.json
```

The CLI writes normalized SVG files, `sprite.<hash>.svg`, `manifest.json`, and `icons.d.ts`.

## Vite

```ts
import { defineConfig } from "vite"
import { spritefoundryVite } from "@nicksuomi/spritefoundry-vite"

export default defineConfig({
  plugins: [
    spritefoundryVite({
      config: {
        iconifySources: [{ name: "lucide", packageName: "@iconify-json/lucide" }],
        customSources: [{ name: "brand", directory: "icons/brand" }],
        icons: [
          { name: "home", ref: "lucide:home" },
          { name: "logo", ref: "brand:logo" }
        ],
        output: {}
      }
    })
  ]
})
```

The plugin runs during Vite build and writes Spritefoundry outputs into Vite `outDir`.

## Runtime

```ts
import manifest from "./icons/manifest.json"
import { createSpriteLoader } from "@nicksuomi/spritefoundry"

const loader = createSpriteLoader({ manifest })
const state = await loader.load()

if (state.status !== "ready") {
  console.error(state.error)
}
```

The loader fetches only `manifest.sprite.publicPath`, unless an explicit app-owned `url` is provided.

## Vue

```ts
import { createApp } from "vue"
import manifest from "./icons/manifest.json"
import { createSpritefoundryVue } from "@nicksuomi/spritefoundry-vue"
import App from "./App.vue"

const app = createApp(App)
const spritefoundry = createSpritefoundryVue({ manifest })

app.use(spritefoundry)
await spritefoundry.preload()
app.mount("#app")
```

```vue
<template>
  <SpriteIcon name="home" title="Home" />
</template>
```

For non-manifest symbol IDs, opt in explicitly:

```vue
<template>
  <SpriteIcon name="external-symbol-id" passthrough />
</template>
```
