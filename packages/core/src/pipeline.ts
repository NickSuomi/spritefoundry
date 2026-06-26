import { basename, join } from "node:path"

import { Effect, Schema } from "effect"

import {
  ConfigDecodeError,
  InvalidIconReferenceError,
  MissingCustomSourceError
} from "./errors.js"
import { SpritefoundryFileSystem } from "./file-system.js"
import {
  BuildManifest,
  BuildResult,
  CustomSourceConfig,
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

const findCustomSource = (
  sources: ReadonlyArray<CustomSourceConfig>,
  sourceName: string
): Effect.Effect<CustomSourceConfig, MissingCustomSourceError> =>
  Effect.suspend(() => {
    const source = sources.find((candidate: CustomSourceConfig) => candidate.name === sourceName)
    return source === undefined
      ? Effect.fail(new MissingCustomSourceError({ sourceName }))
      : Effect.succeed(source)
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
  const spriteFile = config.output.spriteFile ?? defaults.spriteFile
  const manifestFile = config.output.manifestFile ?? defaults.manifestFile
  const normalizedOutputDirectory = join(config.output.directory, normalizedDirectory)

  yield* fs.makeDirectory(normalizedOutputDirectory)

  const icons: Array<ManifestIcon> = []
  const symbols: Array<string> = []

  for (const icon of config.icons) {
    const [sourceName, sourceIconName] = yield* parseRef(icon.ref)
    const source = yield* findCustomSource(config.customSources, sourceName)

    const sourcePath = join(source.directory, `${sourceIconName}.svg`)
    const content = yield* fs.readText(sourcePath)
    const parsed = yield* parseSvg(icon.name, sourcePath, content)
    const symbolId = symbolIdFor(sourceName, sourceIconName)
    const normalized = normalizeSvg(parsed)

    yield* fs.writeText(join(normalizedOutputDirectory, `${icon.name}.svg`), normalized)
    symbols.push(toSymbol(symbolId, parsed))
    icons.push(
      new ManifestIcon({
        name: icon.name,
        symbolId,
        source: new IconSourceMetadata({
          kind: "custom",
          name: sourceName,
          icon: sourceIconName,
          path: sourcePath
        }),
        viewBox: parsed.viewBox
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
