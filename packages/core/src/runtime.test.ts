import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createSpriteLoader, type SpriteContainerElement, type SpriteRuntimeEnvironment } from "./index.js"

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

const createEnvironment = (response: { ok: boolean; status: number; text: string }) => {
  const fetches: Array<string> = []
  const elements: Array<SpriteContainerElement> = []
  const environment: SpriteRuntimeEnvironment = {
    document: {
      body: {
        prepend: (element) => {
          elements.unshift(element)
        }
      },
      createElement: () => ({
        id: "",
        innerHTML: "",
        style: {},
        setAttribute: () => undefined
      }),
      getElementById: (id) => elements.find((element) => element.id === id) ?? null
    },
    fetch: async (url) => {
      fetches.push(url)
      return {
        ok: response.ok,
        status: response.status,
        text: async () => response.text
      }
    }
  }

  return { elements, environment, fetches }
}

describe("createSpriteLoader", () => {
  void it("fetches and injects only the configured sprite URL once", async () => {
    const { elements, environment, fetches } = createEnvironment({
      ok: true,
      status: 200,
      text: '<svg><symbol id="sf-custom-logo"></symbol></svg>'
    })
    const loader = createSpriteLoader({ environment, manifest })

    const first = await loader.load()
    const second = await loader.load()

    assert.deepEqual(fetches, ["/assets/sprite.abc123.svg"])
    assert.equal(first.status, "ready")
    assert.equal(second.status, "ready")
    assert.equal(elements.length, 1)
    assert.equal(elements[0]?.id, "spritefoundry-sprite")
    assert.equal(elements[0]?.innerHTML, '<svg><symbol id="sf-custom-logo"></symbol></svg>')
  })

  void it("returns failure state without injecting when fetch fails", async () => {
    const { elements, environment, fetches } = createEnvironment({
      ok: false,
      status: 404,
      text: ""
    })
    const loader = createSpriteLoader({ environment, manifest })

    const state = await loader.load()

    assert.deepEqual(fetches, ["/assets/sprite.abc123.svg"])
    assert.equal(state.status, "error")
    assert.equal(elements.length, 0)
  })
})
