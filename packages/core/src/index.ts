import { Effect, Schema } from "effect"

export * from "./errors.js"
export * from "./file-system.js"
export * from "./model.js"
export * from "./pipeline.js"

export class SpritefoundryInfo extends Schema.Class<SpritefoundryInfo>("SpritefoundryInfo")({
  effectLine: Schema.Literal("effect-v4-beta"),
  name: Schema.Literal("spritefoundry")
}) {}

export const getSpritefoundryInfo = Effect.fn("getSpritefoundryInfo")(function* () {
  return new SpritefoundryInfo({
    effectLine: "effect-v4-beta",
    name: "spritefoundry"
  })
})
