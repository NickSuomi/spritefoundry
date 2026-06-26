import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { Effect } from "effect"

import {
  buildSpritefoundry,
  getSpritefoundryInfo,
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
})
