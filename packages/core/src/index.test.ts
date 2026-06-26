import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { Effect } from "effect"

import { getSpritefoundryInfo } from "./index.js"

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
})
