import { Effect } from "effect"

export interface SpritefoundryRuntimeManifest {
  readonly icons: Record<string, { readonly symbolId: string; readonly viewBox: string }>
  readonly sprite: { readonly publicPath: string }
}

export type SpriteLoaderState =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly url: string }
  | { readonly status: "ready"; readonly injected: boolean; readonly url: string }
  | { readonly status: "error"; readonly error: unknown; readonly url: string }

export interface SpriteFetchResponse {
  readonly ok: boolean
  readonly status: number
  readonly text: () => Promise<string>
}

export interface SpriteContainerElement {
  id: string
  innerHTML: string
  readonly style?: { display?: string }
  readonly setAttribute?: (name: string, value: string) => void
}

export interface SpriteDocumentTarget {
  readonly appendChild?: (element: SpriteContainerElement) => void
  readonly prepend?: (element: SpriteContainerElement) => void
}

export interface SpriteDocument {
  readonly body?: SpriteDocumentTarget
  readonly documentElement?: SpriteDocumentTarget
  readonly createElement: (tagName: string) => SpriteContainerElement
  readonly getElementById: (id: string) => unknown | null
}

export interface SpriteRuntimeEnvironment {
  readonly document: SpriteDocument
  readonly fetch: (url: string) => Promise<SpriteFetchResponse>
}

export interface CreateSpriteLoaderOptions {
  readonly elementId?: string
  readonly environment?: SpriteRuntimeEnvironment
  readonly manifest: SpritefoundryRuntimeManifest
  readonly url?: string
}

export interface SpriteLoader {
  readonly getState: () => SpriteLoaderState
  readonly load: () => Promise<SpriteLoaderState>
}

const defaultElementId = "spritefoundry-sprite"

const globalEnvironment = (): SpriteRuntimeEnvironment => ({
  document: globalThis.document as unknown as SpriteDocument,
  fetch: globalThis.fetch.bind(globalThis) as unknown as (url: string) => Promise<SpriteFetchResponse>
})

const injectSprite = (
  document: SpriteDocument,
  elementId: string,
  svg: string
): Effect.Effect<boolean, Error> =>
  Effect.try({
    try: () => {
      if (document.getElementById(elementId) !== null) {
        return false
      }

      const element = document.createElement("div")
      element.id = elementId
      element.innerHTML = svg
      element.setAttribute?.("aria-hidden", "true")
      if (element.style !== undefined) {
        element.style.display = "none"
      }

      const target = document.body ?? document.documentElement
      if (target?.prepend !== undefined) {
        target.prepend(element)
        return true
      }
      if (target?.appendChild !== undefined) {
        target.appendChild(element)
        return true
      }

      throw new Error("No document target can receive the sprite")
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  })

export const loadSpriteEffect = (
  options: CreateSpriteLoaderOptions
): Effect.Effect<SpriteLoaderState, never> =>
  Effect.gen(function* () {
    const environment = options.environment ?? globalEnvironment()
    const elementId = options.elementId ?? defaultElementId
    const url = options.url ?? options.manifest.sprite.publicPath

    const response = yield* Effect.tryPromise({
      try: () => environment.fetch(url),
      catch: (error) => error
    }).pipe(
      Effect.catch((error) =>
        Effect.succeed({
          status: "error",
          error,
          url
        } as const)
      )
    )

    if ("status" in response && response.status === "error") {
      return response
    }

    if (!response.ok) {
      return {
        status: "error",
        error: new Error(`Sprite fetch failed with HTTP ${response.status}`),
        url
      }
    }

    const svg = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (error) => error
    }).pipe(
      Effect.catch((error) =>
        Effect.succeed({
          status: "error",
          error,
          url
        } as const)
      )
    )

    if (typeof svg !== "string") {
      return svg
    }

    const injected = yield* injectSprite(environment.document, elementId, svg).pipe(
      Effect.catch((error) =>
        Effect.succeed({
          status: "error",
          error,
          url
        } as const)
      )
    )

    if (typeof injected !== "boolean") {
      return injected
    }

    return {
      status: "ready",
      injected,
      url
    } as const
  })

export const createSpriteLoader = (options: CreateSpriteLoaderOptions): SpriteLoader => {
  let state: SpriteLoaderState = { status: "idle" }
  let loadPromise: Promise<SpriteLoaderState> | undefined

  return {
    getState: () => state,
    load: () => {
      if (state.status === "ready") {
        return Promise.resolve(state)
      }
      if (loadPromise !== undefined) {
        return loadPromise
      }

      const url = options.url ?? options.manifest.sprite.publicPath
      state = { status: "loading", url }
      loadPromise = Effect.runPromise(loadSpriteEffect(options)).then((nextState) => {
        state = nextState
        loadPromise = undefined
        return nextState
      })

      return loadPromise
    }
  }
}
