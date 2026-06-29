import { mkdir, readFile, writeFile } from "node:fs/promises"

import { Context, Effect, Layer } from "effect"

import { FileSystemError } from "./errors.js"

interface SpritefoundryFileSystemService {
  readonly makeDirectory: (path: string) => Effect.Effect<void, FileSystemError>
  readonly readText: (path: string) => Effect.Effect<string, FileSystemError>
  readonly writeText: (path: string, content: string) => Effect.Effect<void, FileSystemError>
}

const SpritefoundryFileSystemBase: Context.TagClass<
  SpritefoundryFileSystem,
  "@spritefoundry/core/SpritefoundryFileSystem",
  SpritefoundryFileSystemService
> = Context.Tag("@spritefoundry/core/SpritefoundryFileSystem")<
  SpritefoundryFileSystem,
  SpritefoundryFileSystemService
>()

/** Effect service for Spritefoundry file-system reads, writes, and directory creation. */
export class SpritefoundryFileSystem extends SpritefoundryFileSystemBase {}

const fileSystemError =
  (operation: string, path: string): ((error: unknown) => FileSystemError) =>
  (error: unknown): FileSystemError =>
  new FileSystemError({
    operation,
    path,
    message: error instanceof Error ? error.message : String(error)
  })

/** Node.js implementation layer for the Spritefoundry file-system service. */
export class NodeSpritefoundryFileSystem {
  /** Layer backed by Node's `fs/promises` APIs. */
  static readonly layer: Layer.Layer<SpritefoundryFileSystem, never, never> = Layer.succeed(SpritefoundryFileSystem)({
    makeDirectory: (path: string) =>
      Effect.tryPromise({
        try: () => mkdir(path, { recursive: true }).then(() => undefined),
        catch: fileSystemError("makeDirectory", path)
      }),
    readText: (path: string) =>
      Effect.tryPromise({
        try: () => readFile(path, "utf8"),
        catch: fileSystemError("readText", path)
      }),
    writeText: (path: string, content: string) =>
      Effect.tryPromise({
        try: () => writeFile(path, content, "utf8"),
        catch: fileSystemError("writeText", path)
      })
  })
}
