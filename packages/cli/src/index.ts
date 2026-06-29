#!/usr/bin/env node
import { realpathSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildSpritefoundry,
  ConfigDecodeError,
  FileSystemError,
  IconNameCollisionError,
  IconSymbolCollisionError,
  IconifyJsonError,
  InvalidIconReferenceError,
  MissingCustomSourceError,
  MissingIconifyIconError,
  MissingIconifySetError,
  MissingViewBoxError,
  NodeSpritefoundryFileSystem,
  ScannerProposalMismatchError,
  SvgParseError,
  UnsafeSvgContentError
} from "@nicksuomi/spritefoundry"
import { Effect, Schema } from "effect"

/** Published package name for the Spritefoundry CLI. */
export const cliPackageName = "@nicksuomi/spritefoundry-cli"

type CliCommand = "build" | "export" | "generate"

interface ParsedArgs {
  readonly command: CliCommand
  readonly configFile: string
  readonly help: boolean
}

/** Inputs and optional IO hooks for running the CLI programmatically. */
export interface RunSpritefoundryCliOptions {
  readonly args: ReadonlyArray<string>
  readonly cwd?: string
  readonly stderr?: (message: string) => void
  readonly stdout?: (message: string) => void
}

class CliConfigError extends Schema.TaggedError<CliConfigError>("CliConfigError")("CliConfigError", {
  message: Schema.String,
  path: Schema.String
}) {}

class CliUsageError extends Schema.TaggedError<CliUsageError>("CliUsageError")("CliUsageError", {
  message: Schema.String
}) {}

const usage = [
  "Usage: spritefoundry <build|generate|export> --config <path>",
  "",
  "Commands:",
  "  build      Build normalized SVGs, hashed sprite, manifest, and types.",
  "  generate   Alias for build.",
  "  export     Alias for build.",
  "",
  "Options:",
  "  -c, --config <path>  Config JSON file. Defaults to spritefoundry.config.json.",
  "  -h, --help           Show help."
].join("\n")

const commands = new Set<CliCommand>(["build", "export", "generate"])

const isCommand = (value: string): value is CliCommand => commands.has(value as CliCommand)

const parseArgs = (args: ReadonlyArray<string>): Effect.Effect<ParsedArgs, CliUsageError> =>
  Effect.suspend(() => {
    let command: CliCommand = "build"
    let configFile = "spritefoundry.config.json"
    let help = false
    let index = 0

    if (args[0] !== undefined && !args[0].startsWith("-")) {
      if (!isCommand(args[0])) {
        return Effect.fail(new CliUsageError({ message: `Unknown command: ${args[0]}` }))
      }
      command = args[0]
      index = 1
    }

    while (index < args.length) {
      const arg = args[index]
      if (arg === "--help" || arg === "-h") {
        help = true
        index += 1
        continue
      }

      if (arg === "--config" || arg === "-c") {
        const value = args[index + 1]
        if (value === undefined || value.startsWith("-")) {
          return Effect.fail(new CliUsageError({ message: `${arg} requires a path` }))
        }
        configFile = value
        index += 2
        continue
      }

      return Effect.fail(new CliUsageError({ message: `Unknown option: ${arg ?? ""}` }))
    }

    return Effect.succeed({ command, configFile, help })
  })

const readJsonConfig = (path: string): Effect.Effect<unknown, CliConfigError> =>
  Effect.gen(function* () {
    const content = yield* Effect.tryPromise({
      try: () => readFile(path, "utf8"),
      catch: (error) =>
        new CliConfigError({
          path,
          message: error instanceof Error ? error.message : String(error)
        })
    })

    return yield* Effect.try({
      try: () => JSON.parse(content) as unknown,
      catch: (error) =>
        new CliConfigError({
          path,
          message: error instanceof Error ? error.message : String(error)
        })
    })
  })

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

const resolvePathField = (baseDirectory: string, value: unknown) =>
  typeof value === "string" ? resolve(baseDirectory, value) : value

const resolveConfigPaths = (input: unknown, baseDirectory: string, cwd: string): unknown => {
  if (!isRecord(input)) {
    return input
  }

  const output = isRecord(input.output)
    ? {
        ...input.output,
        directory: resolvePathField(baseDirectory, input.output.directory),
        projectDirectory:
          typeof input.output.projectDirectory === "string"
            ? resolve(baseDirectory, input.output.projectDirectory)
            : cwd
      }
    : input.output
  const customSources = Array.isArray(input.customSources)
    ? input.customSources.map((source) =>
        isRecord(source)
          ? {
              ...source,
              directory: resolvePathField(baseDirectory, source.directory)
            }
          : source
      )
    : input.customSources

  return {
    ...input,
    customSources,
    output
  }
}

const outputFileName = (config: unknown, key: string, fallback: string) =>
  isRecord(config) && isRecord(config.output) && typeof config.output[key] === "string"
    ? config.output[key]
    : fallback

const formatError = (error: unknown) => {
  if (error instanceof CliUsageError) {
    return `${error.message}\n\n${usage}`
  }
  if (error instanceof CliConfigError) {
    return `Config error at ${error.path}: ${error.message}`
  }
  if (error instanceof MissingViewBoxError) {
    return `MissingViewBoxError: ${error.iconName} at ${error.path} needs a viewBox`
  }
  if (error instanceof UnsafeSvgContentError) {
    return `UnsafeSvgContentError: ${error.iconName} at ${error.path}: ${error.reason}`
  }
  if (error instanceof MissingIconifySetError) {
    return `MissingIconifySetError: ${error.sourceName} from ${error.packageName} was not found at ${error.path}`
  }
  if (error instanceof MissingIconifyIconError) {
    return `MissingIconifyIconError: ${error.icon} was not found in ${error.packageName}`
  }
  if (error instanceof IconNameCollisionError) {
    return `IconNameCollisionError: ${error.iconName} is used by ${error.firstRef} and ${error.secondRef}`
  }
  if (error instanceof IconSymbolCollisionError) {
    return `IconSymbolCollisionError: ${error.symbolId} is used by ${error.firstRef} and ${error.secondRef}`
  }
  if (error instanceof InvalidIconReferenceError) {
    return `InvalidIconReferenceError: ${error.ref}`
  }
  if (error instanceof MissingCustomSourceError) {
    return `MissingCustomSourceError: ${error.sourceName}`
  }
  if (error instanceof ScannerProposalMismatchError) {
    return `ScannerProposalMismatchError: ${error.iconName} ${error.reason}`
  }
  if (error instanceof ConfigDecodeError) {
    return `ConfigDecodeError: ${error.message}`
  }
  if (error instanceof FileSystemError) {
    return `FileSystemError: ${error.operation} ${error.path}: ${error.message}`
  }
  if (error instanceof IconifyJsonError) {
    return `IconifyJsonError: ${error.packageName} at ${error.path}: ${error.message}`
  }
  if (error instanceof SvgParseError) {
    return `SvgParseError: ${error.iconName} at ${error.path}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

const runProgram = (options: Required<RunSpritefoundryCliOptions>): Effect.Effect<number> =>
  Effect.gen(function* () {
    const parsed = yield* parseArgs(options.args)
    if (parsed.help) {
      options.stdout(usage)
      return 0
    }

    const configPath = resolve(options.cwd, parsed.configFile)
    const rawConfig = yield* readJsonConfig(configPath)
    const config = resolveConfigPaths(rawConfig, dirname(configPath), options.cwd)
    const result = yield* buildSpritefoundry(config).pipe(Effect.provide(NodeSpritefoundryFileSystem.layer))

    options.stdout(`Spritefoundry ${parsed.command} complete`)
    options.stdout(`Icons: ${result.icons.length}`)
    options.stdout(`Sprite: ${result.sprite.fileName}`)
    options.stdout(`Manifest: ${outputFileName(config, "manifestFile", "manifest.json")}`)
    options.stdout(`Types: ${result.types.fileName}`)

    return 0
  }).pipe(
    Effect.catchAll((error: unknown) =>
      Effect.sync(() => {
        options.stderr(formatError(error))
        return 1
      })
    )
  )

/** Runs the Spritefoundry CLI and returns its process-style exit code. */
export const runSpritefoundryCli = (options: RunSpritefoundryCliOptions): Promise<number> =>
  Effect.runPromise(
    runProgram({
      args: options.args,
      cwd: options.cwd ?? process.cwd(),
      stderr: options.stderr ?? console.error,
      stdout: options.stdout ?? console.log
    })
  )

const isEntrypoint = () => {
  const entry = process.argv[1]
  return entry !== undefined && realpathOrResolve(entry) === realpathOrResolve(fileURLToPath(import.meta.url))
}

const realpathOrResolve = (path: string) => {
  try {
    return realpathSync(path)
  } catch {
    return resolve(path)
  }
}

if (isEntrypoint()) {
  const exitCode = await runSpritefoundryCli({ args: process.argv.slice(2) })
  process.exitCode = exitCode
}
