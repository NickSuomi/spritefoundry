import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { renderToString } from "@vue/server-renderer"
import { createSSRApp, h, type App } from "vue"

import {
  createSpritefoundryVue,
  mountSpritefoundryApp,
  SpriteIcon,
  useSpritefoundry,
  type SpritefoundryVueOptions
} from "./index.js"

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

const createReadyLoader = (events: Array<string> = []): NonNullable<SpritefoundryVueOptions["loader"]> => ({
  getState: () => ({ status: "idle" }),
  load: async () => {
    events.push("load")
    return {
      status: "ready",
      injected: true,
      url: "/assets/sprite.abc123.svg"
    }
  }
})

const createFailingLoader = (): NonNullable<SpritefoundryVueOptions["loader"]> => ({
  getState: () => ({ status: "idle" }),
  load: async () => ({
    status: "error",
    error: new Error("sprite failed"),
    url: "/assets/sprite.abc123.svg"
  })
})

describe("Spritefoundry Vue", () => {
  void it("preloads through plugin and renders manifest-backed SpriteIcon", async () => {
    const events: Array<string> = []
    const plugin = createSpritefoundryVue({ loader: createReadyLoader(events), manifest })
    const app = createSSRApp({
      render: () => h(SpriteIcon, { name: "logo", title: "Logo" })
    })

    app.use(plugin)
    const state = await plugin.preload()
    const html = await renderToString(app)

    assert.deepEqual(events, ["load"])
    assert.equal(state.status, "ready")
    assert.match(html, /href="#sf-custom-logo"/)
    assert.match(html, /viewBox="0 0 24 24"/)
    assert.match(html, /<title>Logo<\/title>/)
  })

  void it("exposes readiness state through the composable", async () => {
    const plugin = createSpritefoundryVue({ loader: createReadyLoader(), manifest })
    const app = createSSRApp({
      setup: () => {
        const spritefoundry = useSpritefoundry()
        return () => h("span", spritefoundry.state.current.status)
      }
    })

    app.use(plugin)
    await plugin.preload()

    assert.match(await renderToString(app), />ready</)
  })

  void it("exposes failure state through the composable", async () => {
    const plugin = createSpritefoundryVue({ loader: createFailingLoader(), manifest })
    const app = createSSRApp({
      setup: () => {
        const spritefoundry = useSpritefoundry()
        return () => h("span", spritefoundry.state.current.status)
      }
    })

    app.use(plugin)
    await plugin.preload()

    assert.match(await renderToString(app), />error</)
  })

  void it("allows explicit string passthrough", async () => {
    const plugin = createSpritefoundryVue({ loader: createReadyLoader(), manifest })
    const app = createSSRApp({
      render: () => h(SpriteIcon, { name: "external-symbol", passthrough: true })
    })

    app.use(plugin)

    assert.match(await renderToString(app), /href="#external-symbol"/)
  })

  void it("mount helper waits for sprite preload before mounting", async () => {
    const events: Array<string> = []
    const app = {
      component: () => app,
      mount: () => {
        events.push("mount")
        return { mounted: true }
      },
      provide: () => app,
      use: (plugin: { install: (app: App) => void }) => {
        events.push("use")
        plugin.install(app as unknown as App)
        return app
      }
    }

    const result = await mountSpritefoundryApp(app as unknown as App, "#app", {
      loader: createReadyLoader(events),
      manifest
    })

    assert.deepEqual(events, ["use", "load", "mount"])
    assert.deepEqual(result, { mounted: true })
  })
})
