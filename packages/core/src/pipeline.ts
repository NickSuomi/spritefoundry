import { basename, join } from "node:path"

import type { IconifyJSON } from "@iconify/types"
import { getIconData, iconToSVG, replaceIDs } from "@iconify/utils"
import { Effect, Schema } from "effect"

import {
  ConfigDecodeError,
  IconifyJsonError,
  InvalidIconReferenceError,
  MissingIconifyIconError,
  MissingIconifySetError
} from "./errors.js"
import { SpritefoundryFileSystem } from "./file-system.js"
import {
  BuildManifest,
  BuildResult,
  CustomSourceConfig,
  IconifySourceConfig,
  IconSourceMetadata,
  ManifestIcon,
  SpriteAsset,
  SpritefoundryConfig
} from "./model.js"
import { normalizeSvg, parseSvg, toSymbol } from "./svg.js"

const defaults = {
  manifestFile: "manifest.json",
  normalizedSvgDirectory: "svg",
  spriteFile: "sprite.svg"
} as const

const parseRef = (ref: string): Effect.Effect<readonly [string, string], InvalidIconReferenceError> =>
  Effect.suspend(() => {
    const separator = ref.indexOf(":")
    return separator <= 0 || separator === ref.length - 1
      ? Effect.fail(new InvalidIconReferenceError({ ref }))
      : Effect.succeed([ref.slice(0, separator), ref.slice(separator + 1)] as const)
  })

const symbolIdFor = (sourceName: string, iconName: string) => `sf-${sourceName}-${iconName}`

const findIconifySource = (
  sources: ReadonlyArray<IconifySourceConfig>,
  sourceName: string
): Effect.Effect<IconifySourceConfig, MissingIconifySetError> =>
  Effect.suspend(() => {
    const source = sources.find((candidate: IconifySourceConfig) => candidate.name === sourceName)
    return source === undefined
      ? Effect.fail(
          new MissingIconifySetError({
            sourceName,
            packageName: sourceName,
            path: "",
            message: "No Iconify source is configured for this source name"
          })
        )
      : Effect.succeed(source)
  })

const parseIconifyJson = (
  sourceName: string,
  packageName: string,
  path: string,
  content: string
): Effect.Effect<IconifyJSON, IconifyJsonError> =>
  Effect.try({
    try: () => JSON.parse(content) as IconifyJSON,
    catch: (error) =>
      new IconifyJsonError({
        sourceName,
        packageName,
        path,
        message: error instanceof Error ? error.message : String(error)
      })
  })

export const buildSpritefoundry = Effect.fn("buildSpritefoundry")(function* (input: unknown) {
  const config = yield* Schema.decodeUnknownEffect(SpritefoundryConfig)(input).pipe(
    Effect.catch((error: unknown) =>
      Effect.fail(
        new ConfigDecodeError({
          message: String(error)
        })
      )
    )
  )

  const fs = yield* SpritefoundryFileSystem
  const normalizedDirectory = config.output.normalizedSvgDirectory ?? defaults.normalizedSvgDirectory
  const projectDirectory = config.output.projectDirectory ?? process.cwd()
  const spriteFile = config.output.spriteFile ?? defaults.spriteFile
  const manifestFile = config.output.manifestFile ?? defaults.manifestFile
  const normalizedOutputDirectory = join(config.output.directory, normalizedDirectory)
  const iconifySources = config.iconifySources ?? []

  yield* fs.makeDirectory(normalizedOutputDirectory)

  const icons: Array<ManifestIcon> = []
  const symbols: Array<string> = []

  for (const icon of config.icons) {
    const [sourceName, sourceIconName] = yield* parseRef(icon.ref)
    const customSource = config.customSources.find((candidate: CustomSourceConfig) => candidate.name === sourceName)
    const sourcePath = customSource === undefined
      ? join(projectDirectory, "node_modules", sourceName, "icons.json")
      : join(customSource.directory, `${sourceIconName}.svg`)
    const parsed = customSource === undefined
      ? yield* Effect.gen(function* () {
          const iconifySource = yield* findIconifySource(iconifySources, sourceName)
          const packagePath = join(projectDirectory, "node_modules", iconifySource.packageName, "icons.json")
          const json = yield* fs.readText(packagePath).pipe(
            Effect.catch((error) =>
              Effect.fail(
                new MissingIconifySetError({
                  sourceName,
                  packageName: iconifySource.packageName,
                  path: packagePath,
                  message: error instanceof Error ? error.message : String(error)
                })
              )
            )
          )
          const iconSet = yield* parseIconifyJson(sourceName, iconifySource.packageName, packagePath, json)
          const iconData = getIconData(iconSet, sourceIconName)
          if (iconData === null) {
            return yield* Effect.fail(
              new MissingIconifyIconError({
                sourceName,
                packageName: iconifySource.packageName,
                icon: sourceIconName
              })
            )
          }
          const rendered = iconToSVG(iconData)
          return {
            source: new IconSourceMetadata({
              kind: "iconify",
              name: sourceName,
              icon: sourceIconName,
              packageName: iconifySource.packageName,
              path: packagePath
            }),
            svg: {
              body: replaceIDs(rendered.body),
              viewBox: rendered.attributes.viewBox
            }
          }
        })
      : yield* Effect.gen(function* () {
          const content = yield* fs.readText(sourcePath)
          const svg = yield* parseSvg(icon.name, sourcePath, content)
          return {
            source: new IconSourceMetadata({
              kind: "custom",
              name: sourceName,
              icon: sourceIconName,
              path: sourcePath
            }),
            svg
          }
        })
    const symbolId = symbolIdFor(sourceName, sourceIconName)
    const normalized = normalizeSvg(parsed.svg)

    yield* fs.writeText(join(normalizedOutputDirectory, `${icon.name}.svg`), normalized)
    symbols.push(toSymbol(symbolId, parsed.svg))
    icons.push(
      new ManifestIcon({
        name: icon.name,
        symbolId,
        source: parsed.source,
        viewBox: parsed.svg.viewBox
      })
    )
  }

  const sprite = new SpriteAsset({
    fileName: spriteFile,
    path: join(config.output.directory, spriteFile)
  })
  const manifest = new BuildManifest({
    icons: Object.fromEntries(icons.map((icon) => [icon.name, icon])),
    sprite
  })
  const spriteContent = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`

  yield* fs.writeText(sprite.path, spriteContent)
  yield* fs.writeText(join(config.output.directory, manifestFile), `${JSON.stringify(manifest, null, 2)}\n`)

  return new BuildResult({
    icons,
    manifest,
    sprite: new SpriteAsset({
      fileName: basename(sprite.path),
      path: sprite.path
    })
  })
})
