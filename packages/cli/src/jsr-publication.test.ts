import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..")

test("JSR publication keeps explicit CLI public return types", async () => {
  const source = await readFile(join(packageDirectory, "src", "index.ts"), "utf8")

  assert.match(
    source,
    /const runProgram = \(options: Required<RunSpritefoundryCliOptions>\): Effect\.Effect<number> =>/u
  )
  assert.match(
    source,
    /export const runSpritefoundryCli = \(options: RunSpritefoundryCliOptions\): Promise<number> =>/u
  )
})
