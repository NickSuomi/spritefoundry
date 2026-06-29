import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { Effect } from "effect"

import {
  buildSpritefoundry,
  createSpriteLoader,
  getSpritefoundryInfo,
  NodeSpritefoundryFileSystem
} from "../packages/core/dist/index.js"
import { runSpritefoundryCli } from "../packages/cli/dist/index.js"
import { spritefoundryVite } from "../packages/vite/dist/index.js"
import { createSpritefoundryVue, SpriteIcon } from "../packages/vue/dist/index.js"

const importFromPackage = async (packageJsonUrl, specifier) => {
  const require = createRequire(packageJsonUrl)
  return import(pathToFileURL(require.resolve(specifier)).href)
}

const { build: buildVite } = await importFromPackage(new URL("../packages/vite/package.json", import.meta.url), "vite")
const { createSSRApp, h } = await importFromPackage(new URL("../packages/vue/package.json", import.meta.url), "vue")
const { renderToString } = await importFromPackage(
  new URL("../packages/vue/package.json", import.meta.url),
  "@vue/server-renderer"
)

const runtime = "Bun" in globalThis ? `bun ${globalThis.Bun.version}` : `node ${process.version}`

const createFixture = async (prefix) => {
  const root = await mkdtemp(join(tmpdir(), `${prefix}-`))
  const iconsDir = join(root, "icons")
  const outDir = join(root, "dist")
  await mkdir(iconsDir, { recursive: true })
  await writeFile(
    join(iconsDir, "logo.svg"),
    '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>'
  )

  return { iconsDir, outDir, root }
}

const createConfig = (iconsDir, outDir) => ({
  customSources: [{ name: "custom", directory: iconsDir }],
  icons: [{ name: "logo", ref: "custom:logo" }],
  output: { directory: outDir }
})

const assertManifest = async (outDir) => {
  const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"))
  assert.equal(manifest.icons.logo.symbolId, "sf-custom-logo")
  assert.match(manifest.sprite.fileName, /^sprite\.[a-f0-9]{12}\.svg$/)
  return manifest
}

const smokeCore = async () => {
  const info = await Effect.runPromise(getSpritefoundryInfo())
  assert.equal(info.name, "spritefoundry")
  assert.equal(info.effectLine, "effect-v3-stable")

  const { iconsDir, outDir } = await createFixture("spritefoundry-core-smoke")
  const result = await Effect.runPromise(
    buildSpritefoundry(createConfig(iconsDir, outDir)).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
  )
  assert.match(result.sprite.fileName, /^sprite\.[a-f0-9]{12}\.svg$/)
  const manifest = await assertManifest(outDir)

  const elements = []
  const loader = createSpriteLoader({
    environment: {
      document: {
        body: {
          prepend: (element) => {
            elements.unshift(element)
          }
        },
        createElement: () => ({ id: "", innerHTML: "", style: {}, setAttribute: () => undefined }),
        getElementById: (id) => elements.find((element) => element.id === id) ?? null
      },
      fetch: async (url) => ({
        ok: true,
        status: 200,
        text: async () => `<svg data-url="${url}"><symbol id="sf-custom-logo"></symbol></svg>`
      })
    },
    manifest
  })
  const state = await loader.load()
  assert.equal(state.status, "ready")
  assert.equal(elements[0]?.id, "spritefoundry-sprite")
}

const smokeCli = async () => {
  const { iconsDir, outDir, root } = await createFixture("spritefoundry-cli-smoke")
  await writeFile(join(root, "spritefoundry.config.json"), JSON.stringify(createConfig(iconsDir, outDir)))
  const stdout = []
  const stderr = []

  const exitCode = await runSpritefoundryCli({
    args: ["build", "--config", "spritefoundry.config.json"],
    cwd: root,
    stderr: (message) => stderr.push(message),
    stdout: (message) => stdout.push(message)
  })

  assert.equal(exitCode, 0)
  assert.deepEqual(stderr, [])
  assert.match(stdout.join("\n"), /Spritefoundry build complete/)
  await assertManifest(outDir)

  const binPath = join(root, "spritefoundry")
  await symlink(fileURLToPath(new URL("../packages/cli/dist/index.js", import.meta.url)), binPath)
  assert.equal(typeof binPath, "string")
}

const smokeVite = async () => {
  const fixtureRoot = join(process.cwd(), "work", "runtime-smoke")
  await mkdir(fixtureRoot, { recursive: true })
  const root = await mkdtemp(join(fixtureRoot, "spritefoundry-vite-smoke-"))
  const iconsDir = join(root, "icons")
  const srcDir = join(root, "src")
  const outDir = join(root, "dist")
  await mkdir(iconsDir)
  await mkdir(srcDir)
  await writeFile(join(root, "index.html"), '<main id="app"></main><script type="module" src="/src/main.js"></script>')
  await writeFile(join(srcDir, "main.js"), 'document.querySelector("#app").textContent = "ready"\n')
  await writeFile(
    join(iconsDir, "logo.svg"),
    '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>'
  )

  await buildVite({
    build: { emptyOutDir: true, outDir },
    logLevel: "silent",
    plugins: [
      spritefoundryVite({
        config: {
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: {}
        }
      })
    ],
    root
  })

  const files = await readdir(outDir)
  assert.equal(files.includes("manifest.json"), true)
  assert.equal(files.includes("icons.d.ts"), true)
  assert.equal(files.some((file) => /^sprite\.[a-f0-9]{12}\.svg$/.test(file)), true)
  await assertManifest(outDir)
}

const smokeVue = async () => {
  const manifest = {
    icons: {
      logo: {
        symbolId: "sf-custom-logo",
        viewBox: "0 0 24 24"
      }
    },
    sprite: {
      publicPath: "/assets/sprite.abc123.svg"
    }
  }
  const plugin = createSpritefoundryVue({
    loader: {
      getState: () => ({ status: "idle" }),
      load: async () => ({ status: "ready", injected: true, url: manifest.sprite.publicPath })
    },
    manifest
  })
  const app = createSSRApp({
    render: () => h(SpriteIcon, { name: "logo", title: "Logo" })
  })

  app.use(plugin)
  const state = await plugin.preload()
  const html = await renderToString(app)

  assert.equal(state.status, "ready")
  assert.match(html, /href="#sf-custom-logo"/)
  assert.match(html, /viewBox="0 0 24 24"/)
}

await smokeCore()
console.log(`ok core on ${runtime}`)
await smokeCli()
console.log(`ok cli on ${runtime}`)
await smokeVite()
console.log(`ok vite on ${runtime}`)
await smokeVue()
console.log(`ok vue on ${runtime}`)
