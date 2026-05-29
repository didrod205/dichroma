# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/didrod205/dichroma/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/didrod205/dichroma/releases/tag/v0.1.0
