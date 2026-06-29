import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..")

test("JSR publication keeps explicit Vue public types", async () => {
  const source = await readFile(join(packageDirectory, "src", "index.ts"), "utf8")

  assert.match(source, /type DefineComponent/u)
  assert.match(source, /export interface SpriteIconProps/u)
  assert.match(
    source,
    /export const useSpritefoundry = <IconName extends string = string>\(\): SpritefoundryVueContext<IconName> =>/u
  )
  assert.match(source, /export const SpriteIcon: DefineComponent<SpriteIconProps> = defineComponent/u)
})
