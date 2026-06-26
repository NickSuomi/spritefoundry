# SVG Policy

Spritefoundry alpha keeps SVG handling conservative and deterministic.

Custom SVG files must have one `<svg>` root and a `viewBox` with four numeric values. Iconify icons use the viewBox produced from installed local Iconify JSON data.

The build rejects active or external content instead of trying to repair it. Rejected content includes script-like elements, `foreignObject`, embedded media, style elements, inline style attributes, event handler attributes, external `href` or `xlink:href` values, and source attributes such as `src`.

Symbol IDs are generated as `sf-<source>-<icon>` with unsafe identifier characters replaced by `-`. Public icon name collisions and generated symbol ID collisions fail by default.

Internal SVG IDs are namespaced with the generated symbol ID. This keeps repeated builds deterministic and prevents `<defs>` IDs from colliding inside the sprite.
