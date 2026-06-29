import {
  defineComponent,
  h,
  inject,
  reactive,
  type App,
  type DefineComponent,
  type InjectionKey,
  type Plugin,
  type PropType
} from "vue"

import {
  createSpriteLoader,
  type SpriteLoader,
  type SpriteLoaderState,
  type SpritefoundryRuntimeManifest
} from "@nicksuomi/spritefoundry"

/** Published package name for the Vue integration. */
export const vuePackageName = "@nicksuomi/spritefoundry-vue"

/** Icon name union derived from a Spritefoundry runtime manifest. */
export type SpriteIconName<TManifest extends SpritefoundryRuntimeManifest> = keyof TManifest["icons"] & string

/** Reactive Vue state for the sprite loader. */
export interface SpritefoundryVueState {
  current: SpriteLoaderState
}

/** Injected Spritefoundry Vue context. */
export interface SpritefoundryVueContext<IconName extends string = string> {
  readonly load: () => Promise<SpriteLoaderState>
  readonly manifest: SpritefoundryRuntimeManifest
  readonly resolveIcon: (
    name: IconName | string,
    passthrough: boolean
  ) => { readonly symbolId: string; readonly viewBox?: string }
  readonly state: SpritefoundryVueState
}

/** Options for creating the Spritefoundry Vue plugin. */
export interface SpritefoundryVueOptions {
  readonly loader?: SpriteLoader
  readonly manifest: SpritefoundryRuntimeManifest
  readonly spriteUrl?: string
}

/** Props accepted by the SpriteIcon component. */
export interface SpriteIconProps {
  readonly ariaLabel?: string
  readonly name: string
  readonly passthrough?: boolean
  readonly size?: number | string
  readonly title?: string
}

/** Vue plugin with exposed context and preload hook. */
export type SpritefoundryVuePlugin<IconName extends string = string> = Plugin & {
  readonly context: SpritefoundryVueContext<IconName>
  readonly preload: () => Promise<SpriteLoaderState>
}

/** Vue injection key for Spritefoundry context. */
export const spritefoundryVueKey: InjectionKey<SpritefoundryVueContext<string>> = Symbol("spritefoundry-vue")

const createContext = <IconName extends string>(options: SpritefoundryVueOptions): SpritefoundryVueContext<IconName> => {
  const loader =
    options.loader ??
    createSpriteLoader(
      options.spriteUrl === undefined ? { manifest: options.manifest } : { manifest: options.manifest, url: options.spriteUrl }
    )
  const state = reactive<SpritefoundryVueState>({
    current: loader.getState()
  })
  const load = async () => {
    state.current = await loader.load()
    return state.current
  }

  return {
    load,
    manifest: options.manifest,
    resolveIcon: (name, passthrough) => {
      const icon = options.manifest.icons[name]
      if (icon === undefined) {
        if (passthrough) {
          return { symbolId: name }
        }

        throw new Error(`Unknown Spritefoundry icon: ${name}`)
      }

      return icon
    },
    state
  }
}

/** Creates a Vue plugin that provides Spritefoundry icon rendering context. */
export const createSpritefoundryVue = <IconName extends string = string>(
  options: SpritefoundryVueOptions
): SpritefoundryVuePlugin<IconName> => {
  const context = createContext<IconName>(options)

  return {
    context,
    install: (app: App) => {
      app.provide(spritefoundryVueKey, context as SpritefoundryVueContext<string>)
      app.component("SpriteIcon", SpriteIcon)
    },
    preload: context.load
  }
}

/** Reads the injected Spritefoundry Vue context. */
export const useSpritefoundry = <IconName extends string = string>(): SpritefoundryVueContext<IconName> => {
  const context = inject(spritefoundryVueKey) as SpritefoundryVueContext<IconName> | undefined
  if (context === undefined) {
    throw new Error("Spritefoundry Vue plugin is not installed")
  }

  return context
}

/** Vue component that renders a `<use>` reference to a Spritefoundry symbol. */
export const SpriteIcon: DefineComponent<SpriteIconProps> = defineComponent({
  name: "SpriteIcon",
  props: {
    ariaLabel: {
      type: String,
      required: false
    },
    name: {
      type: String as PropType<string>,
      required: true
    },
    passthrough: {
      type: Boolean,
      default: false
    },
    size: {
      type: [Number, String] as PropType<number | string>,
      default: "1em"
    },
    title: {
      type: String,
      required: false
    }
  },
  setup: (props) => {
    const spritefoundry = useSpritefoundry()

    return () => {
      const icon = spritefoundry.resolveIcon(props.name, props.passthrough ?? false)
      const href = `#${icon.symbolId}`
      const labelled = props.title !== undefined || props.ariaLabel !== undefined

      return h(
        "svg",
        {
          "aria-hidden": labelled ? undefined : "true",
          "aria-label": props.ariaLabel,
          height: props.size,
          role: labelled ? "img" : "presentation",
          viewBox: icon.viewBox,
          width: props.size
        },
        [props.title === undefined ? undefined : h("title", props.title), h("use", { href })]
      )
    }
  }
})

/** Installs Spritefoundry, preloads the sprite, and mounts a Vue app. */
export const mountSpritefoundryApp = async (
  app: App,
  target: string,
  options: SpritefoundryVueOptions
): Promise<unknown> => {
  const plugin = createSpritefoundryVue(options)
  app.use(plugin)
  await plugin.preload()
  return app.mount(target)
}
