import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"

import { runSpritefoundryCli } from "./index.js"

describe("runSpritefoundryCli", () => {
  void it("runs the build command in a fixture project without Vite", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-cli-"))
    const iconsDir = join(root, "icons")
    const outDir = join(root, "dist")
    const stdout: Array<string> = []
    const stderr: Array<string> = []
    await mkdir(iconsDir)
    await writeFile(
      join(iconsDir, "logo.svg"),
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>'
    )
    await writeFile(
      join(root, "spritefoundry.config.json"),
      JSON.stringify({
        customSources: [{ name: "custom", directory: "icons" }],
        icons: [{ name: "logo", ref: "custom:logo" }],
        output: { directory: "dist" }
      })
    )

    const exitCode = await runSpritefoundryCli({
      args: ["build", "--config", "spritefoundry.config.json"],
      cwd: root,
      stderr: (message) => stderr.push(message),
      stdout: (message) => stdout.push(message)
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(stderr, [])
    assert.match(stdout.join("\n"), /Spritefoundry build complete/)
    assert.match(stdout.join("\n"), /Sprite: sprite\.[a-f0-9]{12}\.svg/)

    const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"))
    assert.equal(manifest.icons.logo.symbolId, "sf-custom-logo")
    assert.match(manifest.sprite.fileName, /^sprite\.[a-f0-9]{12}\.svg$/)

    const types = await readFile(join(outDir, "icons.d.ts"), "utf8")
    assert.match(types, /export type SpritefoundryIconName = "logo"/)
  })

  void it("returns non-zero and prints typed failure messages", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-cli-"))
    const iconsDir = join(root, "icons")
    const stdout: Array<string> = []
    const stderr: Array<string> = []
    await mkdir(iconsDir)
    await writeFile(join(iconsDir, "logo.svg"), '<svg><path d="M4 4h16v16H4z"/></svg>')
    await writeFile(
      join(root, "spritefoundry.config.json"),
      JSON.stringify({
        customSources: [{ name: "custom", directory: "icons" }],
        icons: [{ name: "logo", ref: "custom:logo" }],
        output: { directory: "dist" }
      })
    )

    const exitCode = await runSpritefoundryCli({
      args: ["generate", "-c", "spritefoundry.config.json"],
      cwd: root,
      stderr: (message) => stderr.push(message),
      stdout: (message) => stdout.push(message)
    })

    assert.equal(exitCode, 1)
    assert.equal(stdout.length, 0)
    assert.match(stderr.join("\n"), /MissingViewBoxError/)
    assert.match(stderr.join("\n"), /needs a viewBox/)
  })

  void it("runs when invoked through a symlinked bin path", async () => {
    const root = await mkdtemp(join(tmpdir(), "spritefoundry-cli-bin-"))
    const binPath = join(root, "spritefoundry")
    await symlink(fileURLToPath(new URL("./index.js", import.meta.url)), binPath)

    const result = spawnSync(process.execPath, [binPath, "--help"], { encoding: "utf8" })

    assert.equal(result.status, 0)
    assert.match(result.stdout, /^Usage: spritefoundry/u)
    assert.equal(result.stderr, "")
  })
})
