# Spritefoundry Icon And Brand Direction

This is exploration material, not a final logo decision. Do not commit a final logo asset until a maintainer chooses a direction.

## Visual Directions

### 1. Foundry Mark

Compact mark based on a simplified press, spark, or mold shape. Use this when the name should feel like selected SVGs are shaped into one sprite artifact.

- Shape language: geometric, solid, minimal.
- Good for: GitHub avatar, package icon, small README mark.
- Avoid: heavy industrial detail, flames, mascots, realistic tools.

### 2. Sprite Grid

Small grid of outlined SVG tiles converging into one combined symbol. Use this when clarity matters more than metaphor.

- Shape language: tile grid, arrows, merged sprite sheet.
- Good for: README diagram companion and docs.
- Avoid: busy grids that fail at 32px.

### 3. Manifest Stamp

Document or tag shape with a hash mark and one embedded symbol. Use this when generated manifest and hashed output should be central.

- Shape language: file, hash, check, small symbol.
- Good for: technical package identity.
- Avoid: generic document icon without sprite-specific cue.

### 4. Runtime Spark

One hidden sprite container feeding visible UI icons. Use this when Vue/runtime loading should be recognizable.

- Shape language: hidden layer, use-arrow, visible icon.
- Good for: README visual system, not necessarily tiny app icon.
- Avoid: browser-window detail in primary icon.

### 5. Type-Safe Symbol

Angle brackets or TypeScript-like token framing a symbol ID. Use this when typed icon names and library identity should lead.

- Shape language: code brackets, symbol reference, restrained blue accent.
- Good for: developer-facing package mark.
- Avoid: copying TypeScript logo geometry or color too closely.

## Generation Prompt

```text
Create 12 minimalist icon concepts for Spritefoundry, an open-source TypeScript library that resolves selected Iconify and custom SVG icons, exports normalized SVGs, generates a hashed SVG sprite, writes a manifest and type definitions, and provides Vite/Vue/runtime loading helpers.

Style: clean developer-tool identity, geometric, readable at 32px, works as monochrome first with optional restrained blue/green accent. Explore these directions: foundry mark, sprite grid merging into one symbol, manifest hash stamp, hidden runtime sprite feeding visible UI icons, and type-safe symbol reference. Avoid mascots, flames, complex gradients, private company/product cues, and generic magic-wand imagery. Output concept names plus short rationale for each.
```

## Focused Prompt For A Finalist Round

```text
Refine the best Spritefoundry icon concept into 6 variants. Keep it minimal, SVG-friendly, and recognizable at 16px, 32px, and 128px. Use flat shapes, no text, no brand names, no 3D rendering, and no complex gradients. Provide monochrome and one-color-accent variants. The mark should imply selected SVG icons being combined into a deterministic sprite manifest for a TypeScript library.
```

## Candidate Concepts

- `Molded Sprite`: four small SVG tiles enter a square mold and leave as one symbol.
- `Hash Sprite`: a compact hash badge wrapped around a simple `<use>` symbol.
- `Manifest Fold`: a file-corner icon containing a tiny sprite grid and check mark.
- `Hidden Sheet`: stacked layers where a back layer is a sprite sheet and front layer is one visible icon.
- `Typed Symbol`: code brackets around a small symbol ID dot-grid.

## Review Criteria

- Recognizable at GitHub avatar size.
- Still meaningful in one color.
- No dependency on text to identify the concept.
- Reads as tooling, not a consumer app.
- Avoids private, company, customer, or unreleased product references.
