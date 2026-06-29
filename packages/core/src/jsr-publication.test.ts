import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..")

test("JSR publication metadata does not expose npm protocol type specifiers", async () => {
  const source = await readFile(join(packageDirectory, "src", "pipeline.ts"), "utf8")
  const denoConfig = JSON.parse(await readFile(join(packageDirectory, "deno.json"), "utf8")) as {
    readonly imports?: Record<string, string>
  }

  assert.doesNotMatch(source, /from ["']@iconify\/types["']/u)
  assert.deepEqual(denoConfig.imports?.["@iconify/types"], undefined)
})
