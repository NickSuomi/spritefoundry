import { mkdir, readFile, writeFile } from "node:fs/promises"

import { Context, Effect, Layer } from "effect"

import { FileSystemError } from "./errors.js"

export class SpritefoundryFileSystem extends Context.Tag("@spritefoundry/core/SpritefoundryFileSystem")<
  SpritefoundryFileSystem,
  {
    readonly makeDirectory: (path: string) => Effect.Effect<void, FileSystemError>
    readonly readText: (path: string) => Effect.Effect<string, FileSystemError>
    readonly writeText: (path: string, content: string) => Effect.Effect<void, FileSystemError>
  }
>() {}

const fileSystemError = (operation: string, path: string) => (error: unknown) =>
  new FileSystemError({
    operation,
    path,
    message: error instanceof Error ? error.message : String(error)
  })

export class NodeSpritefoundryFileSystem {
  static readonly layer = Layer.succeed(SpritefoundryFileSystem)({
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
