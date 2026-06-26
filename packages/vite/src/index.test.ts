import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { describe, it } from "node:test"

import { build } from "vite"

import { spritefoundryVite } from "./index.js"

describe("spritefoundryVite", () => {
  void it("writes hashed sprite, manifest, and types during a fixture Vite build", async () => {
    const fixtureRoot = join(process.cwd(), "work", "vite-fixtures")
    await mkdir(fixtureRoot, { recursive: true })
    const root = await mkdtemp(join(fixtureRoot, "spritefoundry-vite-"))
    const iconsDir = join(root, "icons")
    const sourceDir = join(root, "src")
    const outDir = join(root, "dist")
    await mkdir(iconsDir)
    await mkdir(sourceDir)
    await writeFile(join(root, "index.html"), '<main id="app"></main><script type="module" src="/src/main.ts"></script>')
    await writeFile(join(sourceDir, "main.ts"), 'document.querySelector("#app")!.textContent = "ready"\n')
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>'
    )

    await build({
      build: {
        emptyOutDir: true,
        outDir
      },
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
    const spriteFile = files.find((file) => /^sprite\.[a-f0-9]{12}\.svg$/.test(file))
    assert.equal(typeof spriteFile, "string")
    assert.ok(files.includes("manifest.json"))
    assert.ok(files.includes("icons.d.ts"))

    const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"))
    assert.equal(manifest.icons.logo.symbolId, "sf-custom-logo")
    assert.equal(manifest.sprite.fileName, spriteFile)
  })
})
