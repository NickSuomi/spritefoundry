import { Effect } from "effect"

import { MissingViewBoxError, SvgParseError, UnsafeSvgContentError } from "./errors.js"

/** Parsed SVG body and normalized viewBox. */
export interface ParsedSvg {
  readonly body: string
  readonly viewBox: string
}

const svgPattern = /^\s*<svg\b([^>]*)>([\s\S]*?)<\/svg>\s*$/i
const viewBoxPattern = /\bviewBox\s*=\s*(["'])(.*?)\1/i
const idAttributePattern = /\bid\s*=\s*(["'])([^"']+)\1/g
const localHrefPattern = /\b(?:href|xlink:href)\s*=\s*(["'])#([^"']+)\1/g
const quotedFragmentPattern = /(["'])#([^"']+)\1/g
const forbiddenElementPattern = /<\s*(?:script|foreignObject|iframe|object|embed|image|audio|video|canvas|style)\b/i
const forbiddenEventAttributePattern = /\son[a-z][\w:-]*\s*=/i
const forbiddenExternalReferencePattern = /\b(?:href|xlink:href)\s*=\s*(["'])(?!#)[^"']+\1/i
const forbiddenExternalUrlPattern = /url\(\s*(?:(["'])(?!#)[^"']+\1|(?![#"'])[^)]*)\s*\)/i
const forbiddenSourceAttributePattern = /\s(?:src|poster)\s*=\s*(["'])[^"']+\1/i
const forbiddenStyleAttributePattern = /\sstyle\s*=/i
const forbiddenDoctypePattern = /<!doctype|<!entity/i

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Converts arbitrary source text into a stable SVG id fragment. */
export const safeIdPart = (value: string) => {
  const normalized = value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized.length === 0 ? "icon" : normalized
}

const validateViewBox = (iconName: string, path: string, viewBox: string) => {
  const parts = viewBox.trim().split(/\s+/)
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(Number(part)))) {
    return Effect.fail(
      new SvgParseError({
        iconName,
        path,
        message: "Expected viewBox to contain four numbers"
      })
    )
  }

  return Effect.succeed(viewBox.trim().replace(/\s+/g, " "))
}

/** Rejects SVG content with executable or external-reference features. */
export const validateSafeSvgContent = (
  iconName: string,
  path: string,
  content: string
): Effect.Effect<void, UnsafeSvgContentError> => {
  const checks: ReadonlyArray<readonly [RegExp, string]> = [
    [forbiddenDoctypePattern, "doctype/entity declarations are not allowed"],
    [forbiddenElementPattern, "script, foreignObject, embedded media, and style elements are not allowed"],
    [forbiddenEventAttributePattern, "event handler attributes are not allowed"],
    [forbiddenExternalReferencePattern, "external href references are not allowed"],
    [forbiddenExternalUrlPattern, "external url references are not allowed"],
    [forbiddenSourceAttributePattern, "external source attributes are not allowed"],
    [forbiddenStyleAttributePattern, "style attributes are not allowed"]
  ]

  for (const [pattern, reason] of checks) {
    if (pattern.test(content)) {
      return Effect.fail(new UnsafeSvgContentError({ iconName, path, reason }))
    }
  }

  return Effect.succeed(undefined)
}

/** Prefixes local SVG ids and matching references with a symbol id. */
export const namespaceSvgIds = (svg: ParsedSvg, symbolId: string): ParsedSvg => {
  const ids = new Map<string, string>()
  let match: RegExpExecArray | null

  idAttributePattern.lastIndex = 0
  while ((match = idAttributePattern.exec(svg.body)) !== null) {
    const original = match[2]
    if (original !== undefined && !ids.has(original)) {
      ids.set(original, `${symbolId}-${safeIdPart(original)}`)
    }
  }

  if (ids.size === 0) {
    return svg
  }

  let body = svg.body.replace(idAttributePattern, (full, quote: string, original: string) => {
    const namespaced = ids.get(original)
    return namespaced === undefined ? full : `id=${quote}${namespaced}${quote}`
  })

  for (const [original, namespaced] of ids) {
    const escaped = escapeRegExp(original)
    body = body.replace(new RegExp(`url\\(\\s*(['"]?)#${escaped}\\1\\s*\\)`, "g"), `url(#${namespaced})`)
  }

  body = body.replace(localHrefPattern, (full, _quote: string, original: string) => {
    const namespaced = ids.get(original)
    return namespaced === undefined ? full : full.replace(`#${original}`, `#${namespaced}`)
  })

  body = body.replace(quotedFragmentPattern, (full, quote: string, original: string) => {
    const namespaced = ids.get(original)
    return namespaced === undefined ? full : `${quote}#${namespaced}${quote}`
  })

  return { ...svg, body }
}

/** Parses one SVG document into body content and normalized viewBox metadata. */
export const parseSvg = (
  iconName: string,
  path: string,
  content: string
): Effect.Effect<ParsedSvg, MissingViewBoxError | SvgParseError | UnsafeSvgContentError> => {
  return Effect.gen(function* () {
    yield* validateSafeSvgContent(iconName, path, content)

    const svg = svgPattern.exec(content)
    if (svg === null) {
      return yield* Effect.fail(new SvgParseError({ iconName, path, message: "Expected one <svg> root element" }))
    }

    const attributes = svg[1] ?? ""
    const body = (svg[2] ?? "").trim()
    const viewBox = viewBoxPattern.exec(attributes)
    const viewBoxValue = viewBox?.[2]

    if (viewBoxValue === undefined) {
      return yield* Effect.fail(new MissingViewBoxError({ iconName, path }))
    }

    const normalizedViewBox = yield* validateViewBox(iconName, path, viewBoxValue)

    return {
      body,
      viewBox: normalizedViewBox
    }
  })
}

/** Renders a parsed SVG as a normalized standalone SVG document. */
export const normalizeSvg = (svg: ParsedSvg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svg.viewBox}">${svg.body}</svg>\n`

/** Renders a parsed SVG as a sprite `<symbol>` element. */
export const toSymbol = (symbolId: string, svg: ParsedSvg) =>
  `<symbol id="${symbolId}" viewBox="${svg.viewBox}">${svg.body}</symbol>`
