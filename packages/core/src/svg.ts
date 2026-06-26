import { Effect } from "effect"

import { MissingViewBoxError, SvgParseError } from "./errors.js"

export interface ParsedSvg {
  readonly body: string
  readonly viewBox: string
}

const svgPattern = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/i
const viewBoxPattern = /\bviewBox\s*=\s*(["'])(.*?)\1/i

export const parseSvg = (
  iconName: string,
  path: string,
  content: string
): Effect.Effect<ParsedSvg, MissingViewBoxError | SvgParseError> => {
  const svg = svgPattern.exec(content)
  if (svg === null) {
    return Effect.fail(new SvgParseError({ iconName, path, message: "Expected one <svg> root element" }))
  }

  const attributes = svg[1] ?? ""
  const body = (svg[2] ?? "").trim()
  const viewBox = viewBoxPattern.exec(attributes)

  if (viewBox?.[2] === undefined) {
    return Effect.fail(new MissingViewBoxError({ iconName, path }))
  }

  return Effect.succeed({
    body,
    viewBox: viewBox[2]
  })
}

export const normalizeSvg = (svg: ParsedSvg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svg.viewBox}">${svg.body}</svg>\n`

export const toSymbol = (symbolId: string, svg: ParsedSvg) =>
  `<symbol id="${symbolId}" viewBox="${svg.viewBox}">${svg.body}</symbol>`
