# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0]

### Added

- **Distinguishability checks.** `distinguish(a, b, type)` answers "can a
  colorblind user still tell these two colors apart?" by simulating both and
  measuring CIE76 ΔE in CIELAB. `auditPalette(colors, type)` finds every
  confusable pair in a palette (worst first). Plus `deltaE` and `rgbToLab`.
- **Command-line interface** (`dichroma` bin), zero-dependency:
  - `dichroma <hex>` simulates a color (swatch view); `--all` for every type.
  - `dichroma <image.png>` writes a simulated PNG (`-o`, or `--all` variants).
  - `dichroma check <a> <b>` reports ΔE and exits non-zero when a pair becomes
    indistinguishable — a CI guard for chart/status palettes.
  - Decodes **and encodes** PNG via Node's built-in zlib (no npm deps).
- `decodePng` / `encodePng` / `isPng` exported for advanced Node use.

### Notes

- The PNG codec is imported only by the CLI, so the browser library bundle stays
  Node-API-free and dependency-free.

## [0.1.0]

### Added

- Initial release.
- `simulate(rgb, type, severity?)` and `simulateHex(...)` — simulate a single
  color under any of 8 color-vision-deficiency types, with adjustable severity.
- `simulateImage(source, type, severity?)` — simulate an RGBA buffer or
  `ImageData`; returns a new buffer with alpha preserved.
- Protan/deutan/tritan via the Machado et al. (2009) model (linear RGB);
  achromatopsia via luminance; milder "-anomaly" variants via severity.
- `CVD_LIST` and `CVD_TYPES` metadata (labels, prevalence, descriptions).
- Free, local-only web app — drop an image, see all 8 deficiencies side-by-side,
  download any tile — deployed to GitHub Pages.
- Zero runtime dependencies; ESM + CJS + TypeScript types.

[Unreleased]: https://github.com/didrod205/dichroma/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/didrod205/dichroma/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/didrod205/dichroma/releases/tag/v0.1.0
