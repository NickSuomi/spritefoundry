import { resolve } from "node:path"

import {
  buildSpritefoundry,
  NodeSpritefoundryFileSystem,
  type SpritefoundryConfig
} from "@nicksuomi/spritefoundry"
import { Effect } from "effect"
import type { Plugin, ResolvedConfig } from "vite"

export const vitePackageName = "@nicksuomi/spritefoundry-vite"

export interface SpritefoundryViteOptions {
  readonly config: unknown | (() => unknown | Promise<unknown>)
  readonly outputDirectory?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

const withVitePaths = (input: unknown, root: string, outputDirectory: string): unknown => {
  if (!isRecord(input)) {
    return input
  }

  const output = isRecord(input.output) ? input.output : {}
  const customSources = Array.isArray(input.customSources)
    ? input.customSources.map((source) =>
        isRecord(source) && typeof source.directory === "string"
          ? {
              ...source,
              directory: resolve(root, source.directory)
            }
          : source
      )
    : input.customSources

  return {
    ...input,
    customSources,
    output: {
      ...output,
      directory: outputDirectory,
      projectDirectory: typeof output.projectDirectory === "string" ? resolve(root, output.projectDirectory) : root
    }
  }
}

const resolveUserConfig = async (config: SpritefoundryViteOptions["config"]) =>
  typeof config === "function" ? config() : config

export const spritefoundryVite = (options: SpritefoundryViteOptions): Plugin => {
  let viteConfig: ResolvedConfig | undefined

  return {
    apply: "build",
    configResolved: (config) => {
      viteConfig = config
    },
    name: "spritefoundry-vite",
    writeBundle: async () => {
      const config = viteConfig
      if (config === undefined) {
        throw new Error("Vite config was not resolved")
      }

      const outputDirectory = options.outputDirectory ?? resolve(config.root, config.build.outDir)
      const rawConfig = await resolveUserConfig(options.config)
      const spritefoundryConfig = withVitePaths(rawConfig, config.root, outputDirectory) as SpritefoundryConfig
      const result = await Effect.runPromise(
        buildSpritefoundry(spritefoundryConfig).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))
      )

      config.logger.info(`Spritefoundry emitted ${result.icons.length} icons to ${result.sprite.fileName}`)
    }
  }
}
