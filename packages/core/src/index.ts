import { Effect, Schema } from "effect"

export * from "./errors.js"
export * from "./file-system.js"
export * from "./model.js"
export * from "./pipeline.js"
export * from "./runtime.js"

type SchemaClassBase<Self, Fields extends Schema.Struct.Fields> = Schema.Class<
  Self,
  Fields,
  Schema.Struct.Encoded<Fields>,
  Schema.Struct.Context<Fields>,
  Schema.Struct.Constructor<Fields>,
  {},
  {}
>

const SpritefoundryInfoFields: {
  readonly effectLine: Schema.Schema<"effect-v3-stable">
  readonly name: Schema.Schema<"spritefoundry">
} = {
  effectLine: Schema.Literal("effect-v3-stable"),
  name: Schema.Literal("spritefoundry")
} as const

const SpritefoundryInfoBase: SchemaClassBase<SpritefoundryInfo, typeof SpritefoundryInfoFields> =
  Schema.Class<SpritefoundryInfo>("SpritefoundryInfo")(SpritefoundryInfoFields)

/** Package identity and Effect runtime line used by Spritefoundry. */
export class SpritefoundryInfo extends SpritefoundryInfoBase {}

/** Returns package identity metadata for runtime feature checks. */
export const getSpritefoundryInfo: () => Effect.Effect<SpritefoundryInfo, never, never> = Effect.fn("getSpritefoundryInfo")(
  function* () {
    return new SpritefoundryInfo({
      effectLine: "effect-v3-stable",
      name: "spritefoundry"
    })
  }
)
