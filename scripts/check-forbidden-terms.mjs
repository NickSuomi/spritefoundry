import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const ignoredDirectories = new Set([
  ".git",
  "coverage",
  "dist",
  "node_modules",
  "outputs",
  "work"
])

const glue = (...parts) => parts.join("")
const forbidden = [
  glue("Inter", "com"),
  glue("In", "tra"),
  glue("In", "tra", "kommuna"),
  glue("Commu", "nex"),
  glue("Mor", "pheus"),
  glue("gitlab", ".united", "-grid"),
  glue("united", "-grid", ".com")
]

const textFilePattern = /\.(cjs|cts|js|json|md|mjs|mts|ts|tsx|txt|vue|yaml|yml)$/i
const findings = []

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walk(path)
      }
      continue
    }
    if (!entry.isFile() || !textFilePattern.test(entry.name)) {
      continue
    }
    const text = await readFile(path, "utf8")
    for (const term of forbidden) {
      if (text.includes(term)) {
        findings.push(`${path.slice(root.length + 1)}: contains ${term}`)
      }
    }
  }
}

await walk(root)

if (findings.length > 0) {
  console.error(findings.join("\n"))
  process.exitCode = 1
}
