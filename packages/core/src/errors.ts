import { Schema } from "effect"

export class ConfigDecodeError extends Schema.TaggedErrorClass<ConfigDecodeError>()("ConfigDecodeError", {
  message: Schema.String
}) {}

export class FileSystemError extends Schema.TaggedErrorClass<FileSystemError>()("FileSystemError", {
  operation: Schema.String,
  path: Schema.String,
  message: Schema.String
}) {}

export class InvalidIconReferenceError extends Schema.TaggedErrorClass<InvalidIconReferenceError>()(
  "InvalidIconReferenceError",
  {
    ref: Schema.String
  }
) {}

export class MissingCustomSourceError extends Schema.TaggedErrorClass<MissingCustomSourceError>()(
  "MissingCustomSourceError",
  {
    sourceName: Schema.String
  }
) {}

export class IconifyJsonError extends Schema.TaggedErrorClass<IconifyJsonError>()("IconifyJsonError", {
  message: Schema.String,
  packageName: Schema.String,
  path: Schema.String,
  sourceName: Schema.String
}) {}

export class MissingIconifyIconError extends Schema.TaggedErrorClass<MissingIconifyIconError>()(
  "MissingIconifyIconError",
  {
    icon: Schema.String,
    packageName: Schema.String,
    sourceName: Schema.String
  }
) {}

export class MissingIconifySetError extends Schema.TaggedErrorClass<MissingIconifySetError>()("MissingIconifySetError", {
  message: Schema.String,
  packageName: Schema.String,
  path: Schema.String,
  sourceName: Schema.String
}) {}

export class MissingViewBoxError extends Schema.TaggedErrorClass<MissingViewBoxError>()("MissingViewBoxError", {
  iconName: Schema.String,
  path: Schema.String
}) {}

export class SvgParseError extends Schema.TaggedErrorClass<SvgParseError>()("SvgParseError", {
  iconName: Schema.String,
  path: Schema.String,
  message: Schema.String
}) {}
