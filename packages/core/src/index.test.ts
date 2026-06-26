import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { Effect } from "effect"

import {
  buildSpritefoundry,
  getSpritefoundryInfo,
  IconNameCollisionError,
  IconSymbolCollisionError,
  MissingIconifyIconError,
  MissingIconifySetError,
  MissingViewBoxError,
  NodeSpritefoundryFileSystem,
  ScannerProposalMismatchError,
  SvgParseError,
  UnsafeSvgContentError
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

    assert.match(result.sprite.fileName, /^sprite\.[a-f0-9]{12}\.svg$/)
    assert.match(result.sprite.hash, /^[a-f0-9]{12}$/)
    assert.equal(result.icons[0]?.symbolId, "sf-custom-logo")

    const normalized = await readFile(join(outDir, "svg", "logo.svg"), "utf8")
    assert.equal(
      normalized,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>\n'
    )

    const sprite = await readFile(result.sprite.path, "utf8")
    assert.match(sprite, /<symbol id="sf-custom-logo" viewBox="0 0 24 24">/)

    const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"))
    assert.equal(manifest.icons.logo.symbolId, "sf-custom-logo")
    assert.equal(manifest.icons.logo.source.kind, "custom")
    assert.equal(manifest.sprite.fileName, result.sprite.fileName)
    assert.equal(manifest.sprite.hash, result.sprite.hash)
    assert.equal(manifest.sprite.publicPath, result.sprite.fileName)

    const types = await readFile(result.types.path, "utf8")
    assert.match(types, /export type SpritefoundryIconName = "logo"/)
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

  void it("rejects unsafe SVG content", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg viewBox="0 0 24 24"><script>alert("x")</script><path d="M4 4h16v16H4z"/></svg>'
    )

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: { directory: join(root, "dist") }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof UnsafeSvgContentError && error.reason.includes("script")
    )
  })

  void it("rejects unsafe SVG content outside the root element", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg><script>alert("x")</script>'
    )

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: { directory: join(root, "dist") }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof UnsafeSvgContentError && error.reason.includes("script")
    )
  })

  void it("rejects extra non-whitespace content outside the root SVG", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg><span></span>'
    )

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: { directory: join(root, "dist") }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof SvgParseError && error.message === "Expected one <svg> root element"
    )
  })

  void it("rejects external url references in SVG attributes", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg viewBox="0 0 24 24"><path fill="url(https://example.com/pattern.svg#x)" d="M4 4h16v16H4z"/></svg>'
    )

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: { directory: join(root, "dist") }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof UnsafeSvgContentError && error.reason.includes("external url")
    )
  })

  void it("fails when scanner proposal contains an undeclared icon", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "logo.svg"), '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>')

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: { directory: join(root, "dist") },
          scanner: {
            icons: [
              { name: "logo", ref: "custom:logo" },
              { name: "unused", ref: "custom:unused" }
            ]
          }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) =>
        error instanceof ScannerProposalMismatchError &&
        error.iconName === "unused" &&
        error.reason === "proposal-only"
    )
  })

  void it("fails when strict scanner proposal misses a declared icon", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "logo.svg"), '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>')
    await writeFile(join(iconsDir, "menu.svg"), '<svg viewBox="0 0 24 24"><path d="M2 4h20M2 12h20"/></svg>')

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [
            { name: "logo", ref: "custom:logo" },
            { name: "menu", ref: "custom:menu" }
          ],
          output: { directory: join(root, "dist") },
          scanner: {
            icons: [{ name: "logo", ref: "custom:logo" }],
            strict: true
          }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) =>
        error instanceof ScannerProposalMismatchError &&
        error.iconName === "menu" &&
        error.reason === "missing-from-proposal"
    )
  })

  void it("keeps explicit icon config as source of truth when scanner proposal is non-strict", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    const outDir = join(root, "dist")
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "logo.svg"), '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>')
    await writeFile(join(iconsDir, "menu.svg"), '<svg viewBox="0 0 24 24"><path d="M2 4h20M2 12h20"/></svg>')

    const result = await Effect.runPromise(
      buildSpritefoundry({
        customSources: [{ name: "custom", directory: iconsDir }],
        icons: [
          { name: "logo", ref: "custom:logo" },
          { name: "menu", ref: "custom:menu" }
        ],
        output: { directory: outDir },
        scanner: {
          icons: [{ name: "logo", ref: "custom:logo" }]
        }
      }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
    )

    assert.deepEqual(result.icons.map((icon) => icon.name), ["logo", "menu"])
  })

  void it("fails when scanner proposal ref disagrees with explicit icon config", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "logo.svg"), '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>')

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [{ name: "logo", ref: "custom:logo" }],
          output: { directory: join(root, "dist") },
          scanner: {
            icons: [{ name: "logo", ref: "custom:other" }]
          }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) =>
        error instanceof ScannerProposalMismatchError &&
        error.iconName === "logo" &&
        error.reason === "ref-mismatch"
    )
  })

  void it("fails with typed error when public icon names collide", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "home.svg"), '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>')
    await writeFile(join(iconsDir, "house.svg"), '<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>')

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [
            { name: "home", ref: "custom:home" },
            { name: "home", ref: "custom:house" }
          ],
          output: { directory: join(root, "dist") }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof IconNameCollisionError && error.iconName === "home"
    )
  })

  void it("fails with typed error when symbol ids collide", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "home.svg"), '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>')

    await assert.rejects(
      Effect.runPromise(
        buildSpritefoundry({
          customSources: [{ name: "custom", directory: iconsDir }],
          icons: [
            { name: "home", ref: "custom:home" },
            { name: "homeAlias", ref: "custom:home" }
          ],
          output: { directory: join(root, "dist") }
        }).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      ),
      (error) => error instanceof IconSymbolCollisionError && error.symbolId === "sf-custom-home"
    )
  })

  void it("keeps normalized SVG and sprite output deterministic across repeated runs", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    const outDir = join(root, "dist")
    const config = {
      customSources: [{ name: "custom", directory: iconsDir }],
      icons: [{ name: "logo", ref: "custom:logo" }],
      output: { directory: outDir }
    }
    await mkdir(iconsDir)
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg viewBox="0 0 24 24"><defs><clipPath id="clip"><path d="M0 0h24v24H0z"/></clipPath></defs><g clip-path="url(#clip)"><path d="M4 4h16v16H4z"/></g></svg>'
    )

    const firstResult = await Effect.runPromise(
      buildSpritefoundry(config).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
    )
    const firstNormalized = await readFile(join(outDir, "svg", "logo.svg"), "utf8")
    const firstSprite = await readFile(firstResult.sprite.path, "utf8")

    const secondResult = await Effect.runPromise(
      buildSpritefoundry(config).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
    )
    const secondNormalized = await readFile(join(outDir, "svg", "logo.svg"), "utf8")
    const secondSprite = await readFile(secondResult.sprite.path, "utf8")

    assert.equal(firstResult.sprite.hash, secondResult.sprite.hash)
    assert.equal(firstResult.sprite.fileName, secondResult.sprite.fileName)
    assert.equal(firstNormalized, secondNormalized)
    assert.equal(firstSprite, secondSprite)
    assert.match(firstSprite, /id="sf-custom-logo-clip"/)
    assert.match(firstSprite, /url\(#sf-custom-logo-clip\)/)
  })

  void it("changes sprite hash when icon content changes", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-"))
    const iconsDir = join(root, "icons")
    const outDir = join(root, "dist")
    const iconPath = join(iconsDir, "logo.svg")
    const config = {
      customSources: [{ name: "custom", directory: iconsDir }],
      icons: [{ name: "logo", ref: "custom:logo" }],
      output: { directory: outDir }
    }
    await mkdir(iconsDir)
    await writeFile(iconPath, '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>')
    const firstResult = await Effect.runPromise(
      buildSpritefoundry(config).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
    )

    await writeFile(iconPath, '<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>')
    const secondResult = await Effect.runPromise(
      buildSpritefoundry(config).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
    )

    assert.notEqual(firstResult.sprite.hash, secondResult.sprite.hash)
    assert.notEqual(firstResult.sprite.fileName, secondResult.sprite.fileName)
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
