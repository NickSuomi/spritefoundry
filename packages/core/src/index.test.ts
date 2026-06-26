import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { Effect } from "effect"

import {
  buildSpritefoundry,
  getSpritefoundryInfo,
  MissingIconifyIconError,
  MissingIconifySetError,
  MissingViewBoxError,
  NodeSpritefoundryFileSystem
} from "./index.js"

describe("getSpritefoundryInfo", () => {
  void it("returns public package metadata", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const info = yield* getSpritefoundryInfo()

        assert.equal(info.name, "spritefoundry")
        assert.equal(info.effectLine, "effect-v4-beta")
      })
    )
  })

  void it("builds normalized SVG, sprite, and manifest for a custom SVG", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    const outDir = join(root, "dist")
    await mkdir(iconsDir)
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>'
    )

    const result = await Effect.runPromise(
      buildSpritefoundry({
        customSources: [{ name: "custom", directory: iconsDir }],
        icons: [{ name: "logo", ref: "custom:logo" }],
        output: { directory: outDir }
      }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
    )

    assert.equal(result.sprite.fileName, "sprite.svg")
    assert.equal(result.icons[0]?.symbolId, "sf-custom-logo")

    const normalized = await readFile(join(outDir, "svg", "logo.svg"), "utf8")
    assert.equal(
      normalized,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>\n'
    )

    const sprite = await readFile(join(outDir, "sprite.svg"), "utf8")
    assert.match(sprite, /<symbol id="sf-custom-logo" viewBox="0 0 24 24">/)

    const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"))
    assert.equal(manifest.icons.logo.symbolId, "sf-custom-logo")
    assert.equal(manifest.icons.logo.source.kind, "custom")
  })

  void it("fails with typed error when custom SVG lacks viewBox", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "logo.svg"), '<svg><path d="M4 4h16v16H4z"/></svg>')

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: { directory: join(root, "dist") }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof MissingViewBoxError && error.iconName === "logo"
    )
  })

  void it("builds normalized SVG, sprite, and manifest for an installed Iconify JSON set", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const packageDir = join(root, "node_modules", "@iconify-json", "lucide")
    const outDir = join(root, "dist")
    await mkdir(packageDir, { recursive: true })
    await writeFile(
      join(packageDir, "icons.json"),
      JSON.stringify({
        prefix: "lucide",
        icons: {
          home: {
            body: '<path d="M2 10 12 2l10 8v12H2z"/>',
            width: 24,
            height: 24
          }
        }
      })
    )

    const result = await Effect.runPromise(
      buildSpritefoundry({
        iconifySources: [{ name: "lucide", packageName: "@iconify-json/lucide" }],
        customSources: [],
        icons: [{ name: "home", ref: "lucide:home" }],
        output: { directory: outDir, projectDirectory: root }
      }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
    )

    assert.equal(result.icons[0]?.source.kind, "iconify")
    assert.equal(result.icons[0]?.source.packageName, "@iconify-json/lucide")
    assert.equal(result.icons[0]?.symbolId, "sf-lucide-home")

    const normalized = await readFile(join(outDir, "svg", "home.svg"), "utf8")
    assert.equal(
      normalized,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 10 12 2l10 8v12H2z"/></svg>\n'
    )

    const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"))
    assert.equal(manifest.icons.home.source.kind, "iconify")
  })

  void it("fails with typed error when installed Iconify set is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          iconifySources: [{ name: "lucide", packageName: "@iconify-json/lucide" }],
          customSources: [],
          icons: [{ name: "home", ref: "lucide:home" }],
          output: { directory: join(root, "dist"), projectDirectory: root }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof MissingIconifySetError && error.sourceName === "lucide"
    )
  })

  void it("fails with typed error when installed Iconify icon is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const packageDir = join(root, "node_modules", "@iconify-json", "lucide")
    await mkdir(packageDir, { recursive: true })
    await writeFile(join(packageDir, "icons.json"), JSON.stringify({ prefix: "lucide", icons: {} }))

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          iconifySources: [{ name: "lucide", packageName: "@iconify-json/lucide" }],
          customSources: [],
          icons: [{ name: "home", ref: "lucide:home" }],
          output: { directory: join(root, "dist"), projectDirectory: root }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof MissingIconifyIconError && error.icon === "home"
    )
  })
})
