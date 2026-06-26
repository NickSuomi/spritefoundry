import { Schema } from "effect"

export class CustomSourceConfig extends Schema.Class<CustomSourceConfig>("CustomSourceConfig")({
  name: Schema.String,
  directory: Schema.String
}) {}

export class IconifySourceConfig extends Schema.Class<IconifySourceConfig>("IconifySourceConfig")({
  name: Schema.String,
  packageName: Schema.String
}) {}

export class UsedIconConfig extends Schema.Class<UsedIconConfig>("UsedIconConfig")({
  name: Schema.String,
  ref: Schema.String
}) {}

export class OutputConfig extends Schema.Class<OutputConfig>("OutputConfig")({
  directory: Schema.String,
  manifestFile: Schema.optional(Schema.String),
  normalizedSvgDirectory: Schema.optional(Schema.String),
  projectDirectory: Schema.optional(Schema.String),
  spriteFile: Schema.optional(Schema.String)
}) {}

export class SpritefoundryConfig extends Schema.Class<SpritefoundryConfig>("SpritefoundryConfig")({
  customSources: Schema.Array(CustomSourceConfig),
  iconifySources: Schema.optional(Schema.Array(IconifySourceConfig)),
  icons: Schema.Array(UsedIconConfig),
  output: OutputConfig
}) {}

export class IconSourceMetadata extends Schema.Class<IconSourceMetadata>("IconSourceMetadata")({
  kind: Schema.Union([Schema.Literal("custom"), Schema.Literal("iconify")]),
  packageName: Schema.optional(Schema.String),
  name: Schema.String,
  icon: Schema.String,
  path: Schema.String
}) {}

export class ManifestIcon extends Schema.Class<ManifestIcon>("ManifestIcon")({
  name: Schema.String,
  symbolId: Schema.String,
  source: IconSourceMetadata,
  viewBox: Schema.String
}) {}

export class SpriteAsset extends Schema.Class<SpriteAsset>("SpriteAsset")({
  fileName: Schema.String,
  path: Schema.String
}) {}

export class BuildManifest extends Schema.Class<BuildManifest>("BuildManifest")({
  icons: Schema.Record(Schema.String, ManifestIcon),
  sprite: SpriteAsset
}) {}

export class BuildResult extends Schema.Class<BuildResult>("BuildResult")({
  icons: Schema.Array(ManifestIcon),
  manifest: BuildManifest,
  sprite: SpriteAsset
}) {}
