import { createHash } from "node:crypto"
import { extname, join } from "node:path"

import type { IconifyJSON } from "@iconify/types"
import { getIconData, iconToSVG } from "@iconify/utils"
import { Effect, Schema } from "effect"

import {
  ConfigDecodeError,
  IconNameCollisionError,
  IconSymbolCollisionError,
  IconifyJsonError,
  InvalidIconReferenceError,
  MissingIconifyIconError,
  MissingIconifySetError,
  ScannerProposalMismatchError
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
  SpritefoundryConfig,
  UsedIconConfig,
  TypesAsset
} from "./model.js"
import {
  namespaceSvgIds,
  normalizeSvg,
  parseSvg,
  type ParsedSvg,
  safeIdPart,
  toSymbol,
  validateSafeSvgContent
} from "./svg.js"

const defaults = {
  manifestFile: "manifest.json",
  normalizedSvgDirectory: "svg",
  spriteFile: "sprite.svg",
  typesFile: "icons.d.ts"
} as const

const parseRef = (ref: string): Effect.Effect<readonly [string, string], InvalidIconReferenceError> =>
  Effect.suspend(() => {
    const separator = ref.indexOf(":")
    return separator <= 0 || separator === ref.length - 1
      ? Effect.fail(new InvalidIconReferenceError({ ref }))
      : Effect.succeed([ref.slice(0, separator), ref.slice(separator + 1)] as const)
  })

const symbolIdFor = (sourceName: string, iconName: string) => `sf-${safeIdPart(sourceName)}-${safeIdPart(iconName)}`

const hashContent = (content: string) => createHash("sha256").update(content).digest("hex").slice(0, 12)

const hashedFileName = (fileName: string, hash: string) => {
  const extension = extname(fileName)
  if (extension.length === 0) {
    return `${fileName}.${hash}`
  }

  return `${fileName.slice(0, -extension.length)}.${hash}${extension}`
}

const renderTypes = (icons: ReadonlyArray<ManifestIcon>) => {
  const iconNameUnion = icons.length === 0 ? "never" : icons.map((icon) => JSON.stringify(icon.name)).join(" | ")

  return [
    `export type SpritefoundryIconName = ${iconNameUnion}`,
    "",
    "export interface SpritefoundryIconManifestEntry {",
    "  readonly symbolId: string",
    "  readonly viewBox: string",
    "}",
    "",
    "export type SpritefoundryIconManifest = Record<SpritefoundryIconName, SpritefoundryIconManifestEntry>",
    ""
  ].join("\n")
}

const validateScannerProposal = (config: SpritefoundryConfig): Effect.Effect<void, ScannerProposalMismatchError> =>
  Effect.suspend(() => {
    const scanner = config.scanner
    if (scanner === undefined) {
      return Effect.succeed(undefined)
    }

    const declaredIcons = new Map(config.icons.map((icon) => [icon.name, icon.ref]))
    const proposedIcons = new Map(scanner.icons.map((icon) => [icon.name, icon.ref]))

    for (const proposed of scanner.icons) {
      const declaredRef = declaredIcons.get(proposed.name)
      if (declaredRef === undefined) {
        return Effect.fail(
          new ScannerProposalMismatchError({
            iconName: proposed.name,
            proposedRef: proposed.ref,
            reason: "proposal-only"
          })
        )
      }

      if (proposed.ref !== undefined && proposed.ref !== declaredRef) {
        return Effect.fail(
          new ScannerProposalMismatchError({
            declaredRef,
            iconName: proposed.name,
            proposedRef: proposed.ref,
            reason: "ref-mismatch"
          })
        )
      }
    }

    if (scanner.strict === true) {
      for (const declared of config.icons) {
        if (!proposedIcons.has(declared.name)) {
          return Effect.fail(
            new ScannerProposalMismatchError({
              declaredRef: declared.ref,
              iconName: declared.name,
              reason: "missing-from-proposal"
            })
          )
        }
      }
    }

    return Effect.succeed(undefined)
  })

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

interface IconResolutionRequest {
  readonly config: SpritefoundryConfig
  readonly icon: UsedIconConfig
  readonly iconifySources: ReadonlyArray<IconifySourceConfig>
  readonly projectDirectory: string
  readonly sourceIconName: string
  readonly sourceName: string
  readonly symbolId: string
}

interface ResolvedIconSource {
  readonly source: IconSourceMetadata
  readonly svg: ParsedSvg
}

const resolveCustomIcon = Effect.fn("resolveCustomIcon")(function* (request: IconResolutionRequest) {
  const fs = yield* SpritefoundryFileSystem
  const customSource = request.config.customSources.find(
    (candidate: CustomSourceConfig) => candidate.name === request.sourceName
  )
  if (customSource === undefined) {
    return yield* Effect.fail(
      new MissingIconifySetError({
        sourceName: request.sourceName,
        packageName: request.sourceName,
        path: "",
        message: "No custom source is configured for this source name"
      })
    )
  }

  const sourcePath = join(customSource.directory, `${request.sourceIconName}.svg`)
  const content = yield* fs.readText(sourcePath)
  const svg = namespaceSvgIds(yield* parseSvg(request.icon.name, sourcePath, content), request.symbolId)

  return {
    source: new IconSourceMetadata({
      kind: "custom",
      name: request.sourceName,
      icon: request.sourceIconName,
      path: sourcePath
    }),
    svg
  } satisfies ResolvedIconSource
})

const resolveIconifyIcon = Effect.fn("resolveIconifyIcon")(function* (request: IconResolutionRequest) {
  const fs = yield* SpritefoundryFileSystem
  const iconifySource = yield* findIconifySource(request.iconifySources, request.sourceName)
  const packagePath = join(request.projectDirectory, "node_modules", iconifySource.packageName, "icons.json")
  const json = yield* fs.readText(packagePath).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        new MissingIconifySetError({
          sourceName: request.sourceName,
          packageName: iconifySource.packageName,
          path: packagePath,
          message: error instanceof Error ? error.message : String(error)
        })
      )
    )
  )
  const iconSet = yield* parseIconifyJson(request.sourceName, iconifySource.packageName, packagePath, json)
  const iconData = getIconData(iconSet, request.sourceIconName)
  if (iconData === null) {
    return yield* Effect.fail(
      new MissingIconifyIconError({
        sourceName: request.sourceName,
        packageName: iconifySource.packageName,
        icon: request.sourceIconName
      })
    )
  }

  const rendered = iconToSVG(iconData)
  yield* validateSafeSvgContent(request.icon.name, packagePath, rendered.body)

  return {
    source: new IconSourceMetadata({
      kind: "iconify",
      name: request.sourceName,
      icon: request.sourceIconName,
      packageName: iconifySource.packageName,
      path: packagePath
    }),
    svg: namespaceSvgIds(
      {
        body: rendered.body,
        viewBox: rendered.attributes.viewBox
      },
      request.symbolId
    )
  } satisfies ResolvedIconSource
})

const sourceResolvers = [
  {
    kind: "custom",
    canResolve: (request: IconResolutionRequest) =>
      request.config.customSources.some((candidate) => candidate.name === request.sourceName),
    resolve: resolveCustomIcon
  },
  {
    kind: "iconify",
    canResolve: () => true,
    resolve: resolveIconifyIcon
  }
] as const

const resolveIconSource = Effect.fn("resolveIconSource")(function* (request: IconResolutionRequest) {
  const resolver = sourceResolvers.find((candidate) => candidate.canResolve(request))
  if (resolver === undefined) {
    return yield* Effect.fail(new InvalidIconReferenceError({ ref: request.icon.ref }))
  }

  return yield* resolver.resolve(request)
})

export const buildSpritefoundry = Effect.fn("buildSpritefoundry")(function* (input: unknown) {
  const config = yield* Schema.decodeUnknown(SpritefoundryConfig)(input).pipe(
    Effect.catchAll((error: unknown) =>
      Effect.fail(
        new ConfigDecodeError({
          message: String(error)
        })
      )
    )
  )

  const fs = yield* SpritefoundryFileSystem
  yield* validateScannerProposal(config)

  const normalizedDirectory = config.output.normalizedSvgDirectory ?? defaults.normalizedSvgDirectory
  const projectDirectory = config.output.projectDirectory ?? process.cwd()
  const spriteFile = config.output.spriteFile ?? defaults.spriteFile
  const manifestFile = config.output.manifestFile ?? defaults.manifestFile
  const typesFile = config.output.typesFile ?? defaults.typesFile
  const normalizedOutputDirectory = join(config.output.directory, normalizedDirectory)
  const iconifySources = config.iconifySources ?? []

  yield* fs.makeDirectory(normalizedOutputDirectory)

  const icons: Array<ManifestIcon> = []
  const symbols: Array<string> = []
  const iconNames = new Map<string, string>()
  const symbolIds = new Map<string, string>()

  for (const icon of config.icons) {
    const [sourceName, sourceIconName] = yield* parseRef(icon.ref)
    const existingIconNameRef = iconNames.get(icon.name)
    if (existingIconNameRef !== undefined) {
      return yield* Effect.fail(
        new IconNameCollisionError({
          firstRef: existingIconNameRef,
          iconName: icon.name,
          secondRef: icon.ref
        })
      )
    }

    iconNames.set(icon.name, icon.ref)
    const symbolId = symbolIdFor(sourceName, sourceIconName)
    const existingSymbolRef = symbolIds.get(symbolId)
    if (existingSymbolRef !== undefined) {
      return yield* Effect.fail(
        new IconSymbolCollisionError({
          firstRef: existingSymbolRef,
          secondRef: icon.ref,
          symbolId
        })
      )
    }

    symbolIds.set(symbolId, icon.ref)
    const parsed = yield* resolveIconSource({
      config,
      icon,
      iconifySources,
      projectDirectory,
      sourceIconName,
      sourceName,
      symbolId
    })
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

  const spriteContent = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`
  const spriteHash = hashContent(spriteContent)
  const spriteFileName = hashedFileName(spriteFile, spriteHash)
  const sprite = new SpriteAsset({
    fileName: spriteFileName,
    hash: spriteHash,
    path: join(config.output.directory, spriteFileName),
    publicPath: spriteFileName
  })
  const types = new TypesAsset({
    fileName: typesFile,
    path: join(config.output.directory, typesFile)
  })
  const manifest = new BuildManifest({
    icons: Object.fromEntries(icons.map((icon) => [icon.name, icon])),
    sprite
  })

  yield* fs.writeText(sprite.path, spriteContent)
  yield* fs.writeText(types.path, renderTypes(icons))
  yield* fs.writeText(join(config.output.directory, manifestFile), `${JSON.stringify(manifest, null, 2)}\n`)

  return new BuildResult({
    icons,
    manifest,
    sprite,
    types
  })
})
