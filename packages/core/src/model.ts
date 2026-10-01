import { Schema } from "effect"

const CustomSourceConfigFields: {
  readonly name: typeof Schema.String
  readonly directory: typeof Schema.String
} = {
  name: Schema.String,
  directory: Schema.String
} as const

const CustomSourceConfigBase: Schema.Class<
  CustomSourceConfig,
  Schema.Struct<typeof CustomSourceConfigFields>,
  {}
> = Schema.Class<CustomSourceConfig>("CustomSourceConfig")(CustomSourceConfigFields)

/** Local SVG source directory configuration. */
export class CustomSourceConfig extends CustomSourceConfigBase {}

const IconifySourceConfigFields: {
  readonly name: typeof Schema.String
  readonly packageName: typeof Schema.String
} = {
  name: Schema.String,
  packageName: Schema.String
} as const

const IconifySourceConfigBase: Schema.Class<
  IconifySourceConfig,
  Schema.Struct<typeof IconifySourceConfigFields>,
  {}
> = Schema.Class<IconifySourceConfig>("IconifySourceConfig")(IconifySourceConfigFields)

/** Installed Iconify JSON package source configuration. */
export class IconifySourceConfig extends IconifySourceConfigBase {}

const UsedIconConfigFields: {
  readonly name: typeof Schema.String
  readonly ref: typeof Schema.String
} = {
  name: Schema.String,
  ref: Schema.String
} as const

const UsedIconConfigBase: Schema.Class<
  UsedIconConfig,
  Schema.Struct<typeof UsedIconConfigFields>,
  {}
> = Schema.Class<UsedIconConfig>("UsedIconConfig")(UsedIconConfigFields)

/** Public icon name mapped to a `<source>:<icon>` ref. */
export class UsedIconConfig extends UsedIconConfigBase {}

const ScannerIconProposalFields: {
  readonly name: typeof Schema.String
  readonly ref: Schema.optional<typeof Schema.String>
} = {
  name: Schema.String,
  ref: Schema.optional(Schema.String)
} as const

const ScannerIconProposalBase: Schema.Class<
  ScannerIconProposal,
  Schema.Struct<typeof ScannerIconProposalFields>,
  {}
> = Schema.Class<ScannerIconProposal>("ScannerIconProposal")(ScannerIconProposalFields)

/** Proposed icon from scanner input. */
export class ScannerIconProposal extends ScannerIconProposalBase {}

const ScannerProposalConfigFields: {
  readonly icons: Schema.$Array<typeof ScannerIconProposal>
  readonly strict: Schema.optional<typeof Schema.Boolean>
} = {
  icons: Schema.Array(ScannerIconProposal),
  strict: Schema.optional(Schema.Boolean)
} as const

const ScannerProposalConfigBase: Schema.Class<
  ScannerProposalConfig,
  Schema.Struct<typeof ScannerProposalConfigFields>,
  {}
> = Schema.Class<ScannerProposalConfig>("ScannerProposalConfig")(ScannerProposalConfigFields)

/** Optional scanner proposal validation config. */
export class ScannerProposalConfig extends ScannerProposalConfigBase {}

const OutputConfigFields: {
  readonly directory: typeof Schema.String
  readonly manifestFile: Schema.optional<typeof Schema.String>
  readonly normalizedSvgDirectory: Schema.optional<typeof Schema.String>
  readonly projectDirectory: Schema.optional<typeof Schema.String>
  readonly spriteFile: Schema.optional<typeof Schema.String>
  readonly typesFile: Schema.optional<typeof Schema.String>
} = {
  directory: Schema.String,
  manifestFile: Schema.optional(Schema.String),
  normalizedSvgDirectory: Schema.optional(Schema.String),
  projectDirectory: Schema.optional(Schema.String),
  spriteFile: Schema.optional(Schema.String),
  typesFile: Schema.optional(Schema.String)
} as const

const OutputConfigBase: Schema.Class<
  OutputConfig,
  Schema.Struct<typeof OutputConfigFields>,
  {}
> = Schema.Class<OutputConfig>("OutputConfig")(OutputConfigFields)

/** Output artifact location and file-name config. */
export class OutputConfig extends OutputConfigBase {}

const SpritefoundryConfigFields: {
  readonly customSources: Schema.$Array<typeof CustomSourceConfig>
  readonly iconifySources: Schema.optional<Schema.$Array<typeof IconifySourceConfig>>
  readonly icons: Schema.$Array<typeof UsedIconConfig>
  readonly output: typeof OutputConfig
  readonly scanner: Schema.optional<typeof ScannerProposalConfig>
} = {
  customSources: Schema.Array(CustomSourceConfig),
  iconifySources: Schema.optional(Schema.Array(IconifySourceConfig)),
  icons: Schema.Array(UsedIconConfig),
  output: OutputConfig,
  scanner: Schema.optional(ScannerProposalConfig)
} as const

const SpritefoundryConfigBase: Schema.Class<
  SpritefoundryConfig,
  Schema.Struct<typeof SpritefoundryConfigFields>,
  {}
> = Schema.Class<SpritefoundryConfig>("SpritefoundryConfig")(SpritefoundryConfigFields)

/** Full Spritefoundry build config. */
export class SpritefoundryConfig extends SpritefoundryConfigBase {}

const IconSourceMetadataFields: {
  readonly kind: Schema.Literals<readonly ["custom", "iconify"]>
  readonly packageName: Schema.optional<typeof Schema.String>
  readonly name: typeof Schema.String
  readonly icon: typeof Schema.String
  readonly path: typeof Schema.String
} = {
  kind: Schema.Literals(["custom", "iconify"]),
  packageName: Schema.optional(Schema.String),
  name: Schema.String,
  icon: Schema.String,
  path: Schema.String
} as const

const IconSourceMetadataBase: Schema.Class<
  IconSourceMetadata,
  Schema.Struct<typeof IconSourceMetadataFields>,
  {}
> = Schema.Class<IconSourceMetadata>("IconSourceMetadata")(IconSourceMetadataFields)

/** Source metadata recorded for one emitted icon. */
export class IconSourceMetadata extends IconSourceMetadataBase {}

const ManifestIconFields: {
  readonly name: typeof Schema.String
  readonly symbolId: typeof Schema.String
  readonly source: typeof IconSourceMetadata
  readonly viewBox: typeof Schema.String
} = {
  name: Schema.String,
  symbolId: Schema.String,
  source: IconSourceMetadata,
  viewBox: Schema.String
} as const

const ManifestIconBase: Schema.Class<
  ManifestIcon,
  Schema.Struct<typeof ManifestIconFields>,
  {}
> = Schema.Class<ManifestIcon>("ManifestIcon")(ManifestIconFields)

/** Manifest entry for one public icon. */
export class ManifestIcon extends ManifestIconBase {}

const SpriteAssetFields: {
  readonly fileName: typeof Schema.String
  readonly hash: typeof Schema.String
  readonly path: typeof Schema.String
  readonly publicPath: typeof Schema.String
} = {
  fileName: Schema.String,
  hash: Schema.String,
  path: Schema.String,
  publicPath: Schema.String
} as const

const SpriteAssetBase: Schema.Class<
  SpriteAsset,
  Schema.Struct<typeof SpriteAssetFields>,
  {}
> = Schema.Class<SpriteAsset>("SpriteAsset")(SpriteAssetFields)

/** Generated sprite asset metadata. */
export class SpriteAsset extends SpriteAssetBase {}

const TypesAssetFields: {
  readonly fileName: typeof Schema.String
  readonly path: typeof Schema.String
} = {
  fileName: Schema.String,
  path: Schema.String
} as const

const TypesAssetBase: Schema.Class<
  TypesAsset,
  Schema.Struct<typeof TypesAssetFields>,
  {}
> = Schema.Class<TypesAsset>("TypesAsset")(TypesAssetFields)

/** Generated TypeScript icon-name type asset metadata. */
export class TypesAsset extends TypesAssetBase {}

const BuildManifestFields: {
  readonly icons: Schema.$Record<typeof Schema.String, typeof ManifestIcon>
  readonly sprite: typeof SpriteAsset
} = {
  icons: Schema.Record(Schema.String, ManifestIcon),
  sprite: SpriteAsset
} as const

const BuildManifestBase: Schema.Class<
  BuildManifest,
  Schema.Struct<typeof BuildManifestFields>,
  {}
> = Schema.Class<BuildManifest>("BuildManifest")(BuildManifestFields)

/** JSON manifest emitted by the build pipeline. */
export class BuildManifest extends BuildManifestBase {}

const BuildResultFields: {
  readonly icons: Schema.$Array<typeof ManifestIcon>
  readonly manifest: typeof BuildManifest
  readonly sprite: typeof SpriteAsset
  readonly types: typeof TypesAsset
} = {
  icons: Schema.Array(ManifestIcon),
  manifest: BuildManifest,
  sprite: SpriteAsset,
  types: TypesAsset
} as const

const BuildResultBase: Schema.Class<
  BuildResult,
  Schema.Struct<typeof BuildResultFields>,
  {}
> = Schema.Class<BuildResult>("BuildResult")(BuildResultFields)

/** Build result returned by the core pipeline. */
export class BuildResult extends BuildResultBase {}
