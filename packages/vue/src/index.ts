import {
  defineComponent,
  h,
  inject,
  reactive,
  type App,
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

export const vuePackageName = "@nicksuomi/spritefoundry-vue"

export type SpriteIconName<TManifest extends SpritefoundryRuntimeManifest> = keyof TManifest["icons"] & string

export interface SpritefoundryVueState {
  current: SpriteLoaderState
}

export interface SpritefoundryVueContext<IconName extends string = string> {
  readonly load: () => Promise<SpriteLoaderState>
  readonly manifest: SpritefoundryRuntimeManifest
  readonly resolveIcon: (
    name: IconName | string,
    passthrough: boolean
  ) => { readonly symbolId: string; readonly viewBox?: string }
  readonly state: SpritefoundryVueState
}

export interface SpritefoundryVueOptions {
  readonly loader?: SpriteLoader
  readonly manifest: SpritefoundryRuntimeManifest
  readonly spriteUrl?: string
}

export type SpritefoundryVuePlugin<IconName extends string = string> = Plugin & {
  readonly context: SpritefoundryVueContext<IconName>
  readonly preload: () => Promise<SpriteLoaderState>
}

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

export const useSpritefoundry = <IconName extends string = string>() => {
  const context = inject(spritefoundryVueKey) as SpritefoundryVueContext<IconName> | undefined
  if (context === undefined) {
    throw new Error("Spritefoundry Vue plugin is not installed")
  }

  return context
}

export const SpriteIcon = defineComponent({
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
      const icon = spritefoundry.resolveIcon(props.name, props.passthrough)
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
