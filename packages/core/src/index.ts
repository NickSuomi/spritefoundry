import { Effect, Schema } from "effect"

export * from "./errors.js"
export * from "./file-system.js"
export * from "./model.js"
export * from "./pipeline.js"
export * from "./runtime.js"

const SpritefoundryInfoFields: {
  readonly effectLine: Schema.Literal<"effect-v4-rc">
  readonly name: Schema.Literal<"spritefoundry">
} = {
  effectLine: Schema.Literal("effect-v4-rc"),
  name: Schema.Literal("spritefoundry")
} as const

const SpritefoundryInfoBase: Schema.Class<
  SpritefoundryInfo,
  Schema.Struct<typeof SpritefoundryInfoFields>,
  {}
> = Schema.Class<SpritefoundryInfo>("SpritefoundryInfo")(SpritefoundryInfoFields)

/** Package identity and Effect runtime line used by Spritefoundry. */
export class SpritefoundryInfo extends SpritefoundryInfoBase {}

/** Returns package identity metadata for runtime feature checks. */
export const getSpritefoundryInfo: () => Effect.Effect<SpritefoundryInfo, never, never> = Effect.fn("getSpritefoundryInfo")(
  function* () {
    return new SpritefoundryInfo({
      effectLine: "effect-v4-rc",
      name: "spritefoundry"
    })
  }
)
