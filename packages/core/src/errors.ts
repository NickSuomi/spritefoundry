import { Schema } from "effect"

export class ConfigDecodeError extends Schema.TaggedError<ConfigDecodeError>("ConfigDecodeError")("ConfigDecodeError", {
  message: Schema.String
}) {}

export class IconNameCollisionError extends Schema.TaggedError<IconNameCollisionError>("IconNameCollisionError")(
  "IconNameCollisionError",
  {
    firstRef: Schema.String,
    iconName: Schema.String,
    secondRef: Schema.String
  }
) {}

export class IconSymbolCollisionError extends Schema.TaggedError<IconSymbolCollisionError>("IconSymbolCollisionError")(
  "IconSymbolCollisionError",
  {
    firstRef: Schema.String,
    secondRef: Schema.String,
    symbolId: Schema.String
  }
) {}

export class FileSystemError extends Schema.TaggedError<FileSystemError>("FileSystemError")("FileSystemError", {
  operation: Schema.String,
  path: Schema.String,
  message: Schema.String
}) {}

export class InvalidIconReferenceError extends Schema.TaggedError<InvalidIconReferenceError>("InvalidIconReferenceError")(
  "InvalidIconReferenceError",
  {
    ref: Schema.String
  }
) {}

export class MissingCustomSourceError extends Schema.TaggedError<MissingCustomSourceError>("MissingCustomSourceError")(
  "MissingCustomSourceError",
  {
    sourceName: Schema.String
  }
) {}

export class IconifyJsonError extends Schema.TaggedError<IconifyJsonError>("IconifyJsonError")("IconifyJsonError", {
  message: Schema.String,
  packageName: Schema.String,
  path: Schema.String,
  sourceName: Schema.String
}) {}

export class MissingIconifyIconError extends Schema.TaggedError<MissingIconifyIconError>("MissingIconifyIconError")(
  "MissingIconifyIconError",
  {
    icon: Schema.String,
    packageName: Schema.String,
    sourceName: Schema.String
  }
) {}

export class MissingIconifySetError extends Schema.TaggedError<MissingIconifySetError>("MissingIconifySetError")("MissingIconifySetError", {
  message: Schema.String,
  packageName: Schema.String,
  path: Schema.String,
  sourceName: Schema.String
}) {}

export class MissingViewBoxError extends Schema.TaggedError<MissingViewBoxError>("MissingViewBoxError")("MissingViewBoxError", {
  iconName: Schema.String,
  path: Schema.String
}) {}

export class ScannerProposalMismatchError extends Schema.TaggedError<ScannerProposalMismatchError>("ScannerProposalMismatchError")(
  "ScannerProposalMismatchError",
  {
    declaredRef: Schema.optional(Schema.String),
    iconName: Schema.String,
    proposedRef: Schema.optional(Schema.String),
    reason: Schema.Union(
      Schema.Literal("proposal-only"),
      Schema.Literal("ref-mismatch"),
      Schema.Literal("missing-from-proposal")
    )
  }
) {}

export class SvgParseError extends Schema.TaggedError<SvgParseError>("SvgParseError")("SvgParseError", {
  iconName: Schema.String,
  path: Schema.String,
  message: Schema.String
}) {}

export class UnsafeSvgContentError extends Schema.TaggedError<UnsafeSvgContentError>("UnsafeSvgContentError")(
  "UnsafeSvgContentError",
  {
    iconName: Schema.String,
    path: Schema.String,
    reason: Schema.String
  }
) {}
