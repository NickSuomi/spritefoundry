import { Schema } from "effect"

type TaggedErrorBase<Self, Tag extends string, Fields extends Schema.Struct.Fields> = Schema.TaggedErrorClass<
  Self,
  Tag,
  { readonly _tag: Schema.tag<Tag> } & Fields
>

const ConfigDecodeErrorFields: {
  readonly message: typeof Schema.String
} = {
  message: Schema.String
} as const

const ConfigDecodeErrorBase: TaggedErrorBase<
  ConfigDecodeError,
  "ConfigDecodeError",
  typeof ConfigDecodeErrorFields
> = Schema.TaggedError<ConfigDecodeError>("ConfigDecodeError")("ConfigDecodeError", ConfigDecodeErrorFields)

/** Error raised when unknown config input cannot decode as Spritefoundry config. */
export class ConfigDecodeError extends ConfigDecodeErrorBase {}

const IconNameCollisionErrorFields: {
  readonly firstRef: typeof Schema.String
  readonly iconName: typeof Schema.String
  readonly secondRef: typeof Schema.String
} = {
  firstRef: Schema.String,
  iconName: Schema.String,
  secondRef: Schema.String
} as const

const IconNameCollisionErrorBase: TaggedErrorBase<
  IconNameCollisionError,
  "IconNameCollisionError",
  typeof IconNameCollisionErrorFields
> = Schema.TaggedError<IconNameCollisionError>("IconNameCollisionError")(
  "IconNameCollisionError",
  IconNameCollisionErrorFields
)

/** Error raised when two icon refs use the same public icon name. */
export class IconNameCollisionError extends IconNameCollisionErrorBase {}

const IconSymbolCollisionErrorFields: {
  readonly firstRef: typeof Schema.String
  readonly secondRef: typeof Schema.String
  readonly symbolId: typeof Schema.String
} = {
  firstRef: Schema.String,
  secondRef: Schema.String,
  symbolId: Schema.String
} as const

const IconSymbolCollisionErrorBase: TaggedErrorBase<
  IconSymbolCollisionError,
  "IconSymbolCollisionError",
  typeof IconSymbolCollisionErrorFields
> = Schema.TaggedError<IconSymbolCollisionError>("IconSymbolCollisionError")(
  "IconSymbolCollisionError",
  IconSymbolCollisionErrorFields
)

/** Error raised when two icon refs generate the same sprite symbol id. */
export class IconSymbolCollisionError extends IconSymbolCollisionErrorBase {}

const FileSystemErrorFields: {
  readonly operation: typeof Schema.String
  readonly path: typeof Schema.String
  readonly message: typeof Schema.String
} = {
  operation: Schema.String,
  path: Schema.String,
  message: Schema.String
} as const

const FileSystemErrorBase: TaggedErrorBase<FileSystemError, "FileSystemError", typeof FileSystemErrorFields> =
  Schema.TaggedError<FileSystemError>("FileSystemError")("FileSystemError", FileSystemErrorFields)

/** Error raised by filesystem operations. */
export class FileSystemError extends FileSystemErrorBase {}

const InvalidIconReferenceErrorFields: {
  readonly ref: typeof Schema.String
} = {
  ref: Schema.String
} as const

const InvalidIconReferenceErrorBase: TaggedErrorBase<
  InvalidIconReferenceError,
  "InvalidIconReferenceError",
  typeof InvalidIconReferenceErrorFields
> = Schema.TaggedError<InvalidIconReferenceError>("InvalidIconReferenceError")(
  "InvalidIconReferenceError",
  InvalidIconReferenceErrorFields
)

/** Error raised when an icon ref does not match `<source>:<icon>`. */
export class InvalidIconReferenceError extends InvalidIconReferenceErrorBase {}

const MissingCustomSourceErrorFields: {
  readonly sourceName: typeof Schema.String
} = {
  sourceName: Schema.String
} as const

const MissingCustomSourceErrorBase: TaggedErrorBase<
  MissingCustomSourceError,
  "MissingCustomSourceError",
  typeof MissingCustomSourceErrorFields
> = Schema.TaggedError<MissingCustomSourceError>("MissingCustomSourceError")(
  "MissingCustomSourceError",
  MissingCustomSourceErrorFields
)

/** Error raised when a custom source name is not configured. */
export class MissingCustomSourceError extends MissingCustomSourceErrorBase {}

const IconifyJsonErrorFields: {
  readonly message: typeof Schema.String
  readonly packageName: typeof Schema.String
  readonly path: typeof Schema.String
  readonly sourceName: typeof Schema.String
} = {
  message: Schema.String,
  packageName: Schema.String,
  path: Schema.String,
  sourceName: Schema.String
} as const

const IconifyJsonErrorBase: TaggedErrorBase<IconifyJsonError, "IconifyJsonError", typeof IconifyJsonErrorFields> =
  Schema.TaggedError<IconifyJsonError>("IconifyJsonError")("IconifyJsonError", IconifyJsonErrorFields)

/** Error raised when Iconify JSON cannot be read or parsed. */
export class IconifyJsonError extends IconifyJsonErrorBase {}

const MissingIconifyIconErrorFields: {
  readonly icon: typeof Schema.String
  readonly packageName: typeof Schema.String
  readonly sourceName: typeof Schema.String
} = {
  icon: Schema.String,
  packageName: Schema.String,
  sourceName: Schema.String
} as const

const MissingIconifyIconErrorBase: TaggedErrorBase<
  MissingIconifyIconError,
  "MissingIconifyIconError",
  typeof MissingIconifyIconErrorFields
> = Schema.TaggedError<MissingIconifyIconError>("MissingIconifyIconError")(
  "MissingIconifyIconError",
  MissingIconifyIconErrorFields
)

/** Error raised when an Iconify package lacks a requested icon. */
export class MissingIconifyIconError extends MissingIconifyIconErrorBase {}

const MissingIconifySetErrorFields: {
  readonly message: typeof Schema.String
  readonly packageName: typeof Schema.String
  readonly path: typeof Schema.String
  readonly sourceName: typeof Schema.String
} = {
  message: Schema.String,
  packageName: Schema.String,
  path: Schema.String,
  sourceName: Schema.String
} as const

const MissingIconifySetErrorBase: TaggedErrorBase<
  MissingIconifySetError,
  "MissingIconifySetError",
  typeof MissingIconifySetErrorFields
> = Schema.TaggedError<MissingIconifySetError>("MissingIconifySetError")(
  "MissingIconifySetError",
  MissingIconifySetErrorFields
)

/** Error raised when an Iconify source JSON file is missing. */
export class MissingIconifySetError extends MissingIconifySetErrorBase {}

const MissingViewBoxErrorFields: {
  readonly iconName: typeof Schema.String
  readonly path: typeof Schema.String
} = {
  iconName: Schema.String,
  path: Schema.String
} as const

const MissingViewBoxErrorBase: TaggedErrorBase<
  MissingViewBoxError,
  "MissingViewBoxError",
  typeof MissingViewBoxErrorFields
> = Schema.TaggedError<MissingViewBoxError>("MissingViewBoxError")("MissingViewBoxError", MissingViewBoxErrorFields)

/** Error raised when an SVG lacks a valid viewBox. */
export class MissingViewBoxError extends MissingViewBoxErrorBase {}

const ScannerProposalMismatchErrorFields: {
  readonly declaredRef: Schema.optional<typeof Schema.String>
  readonly iconName: typeof Schema.String
  readonly proposedRef: Schema.optional<typeof Schema.String>
  readonly reason: Schema.Schema<"proposal-only" | "ref-mismatch" | "missing-from-proposal">
} = {
  declaredRef: Schema.optional(Schema.String),
  iconName: Schema.String,
  proposedRef: Schema.optional(Schema.String),
  reason: Schema.Union(
    Schema.Literal("proposal-only"),
    Schema.Literal("ref-mismatch"),
    Schema.Literal("missing-from-proposal")
  )
} as const

const ScannerProposalMismatchErrorBase: TaggedErrorBase<
  ScannerProposalMismatchError,
  "ScannerProposalMismatchError",
  typeof ScannerProposalMismatchErrorFields
> = Schema.TaggedError<ScannerProposalMismatchError>("ScannerProposalMismatchError")(
  "ScannerProposalMismatchError",
  ScannerProposalMismatchErrorFields
)

/** Error raised when scanner proposal input disagrees with explicit icon config. */
export class ScannerProposalMismatchError extends ScannerProposalMismatchErrorBase {}

const SvgParseErrorFields: {
  readonly iconName: typeof Schema.String
  readonly path: typeof Schema.String
  readonly message: typeof Schema.String
} = {
  iconName: Schema.String,
  path: Schema.String,
  message: Schema.String
} as const

const SvgParseErrorBase: TaggedErrorBase<SvgParseError, "SvgParseError", typeof SvgParseErrorFields> =
  Schema.TaggedError<SvgParseError>("SvgParseError")("SvgParseError", SvgParseErrorFields)

/** Error raised when SVG text cannot be parsed into accepted SVG shape. */
export class SvgParseError extends SvgParseErrorBase {}

const UnsafeSvgContentErrorFields: {
  readonly iconName: typeof Schema.String
  readonly path: typeof Schema.String
  readonly reason: typeof Schema.String
} = {
  iconName: Schema.String,
  path: Schema.String,
  reason: Schema.String
} as const

const UnsafeSvgContentErrorBase: TaggedErrorBase<
  UnsafeSvgContentError,
  "UnsafeSvgContentError",
  typeof UnsafeSvgContentErrorFields
> = Schema.TaggedError<UnsafeSvgContentError>("UnsafeSvgContentError")(
  "UnsafeSvgContentError",
  UnsafeSvgContentErrorFields
)

/** Error raised when SVG text contains active or external content. */
export class UnsafeSvgContentError extends UnsafeSvgContentErrorBase {}
