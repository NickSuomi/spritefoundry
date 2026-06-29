# @nicksuomi/spritefoundry-cli

CLI runner for Spritefoundry.

Install from JSR:

```sh
pnpm add -D jsr:@nicksuomi/spritefoundry-cli
```

JSR installs expose `runSpritefoundryCli` as a module export. Use it from an app-owned Node script:

```js
import { runSpritefoundryCli } from "@nicksuomi/spritefoundry-cli"

process.exitCode = await runSpritefoundryCli({ args: process.argv.slice(2) })
```

The npm fallback package also provides the `spritefoundry` bin.

See the Spritefoundry root README for full usage:

https://github.com/NickSuomi/spritefoundry#readme
