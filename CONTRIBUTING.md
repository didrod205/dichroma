# Contributing to dichroma

Thanks for taking the time to contribute! 🎉 dichroma aims to be a small,
dependency-free, **accurate** tool. Contributions are reviewed with that in mind.

## Getting started

```bash
git clone https://github.com/didrod205/dichroma.git
cd dichroma
npm install
```

| Command | What it does |
| ------- | ------------ |
| `npm test` | Run the test suite (Vitest). |
| `npm run test:watch` | Re-run tests on change. |
| `npm run typecheck` | Type-check without emitting. |
| `npm run build` | Build the library (`dist/`). |
| `npm run build:web` | Build the web app (`docs/`). |
| `npm run dev` | Run the web app locally (`vite`). |

## Good contributions

- **Daltonization** (recoloring to improve distinguishability for CVD users).
- **Model improvements** — e.g. per-severity Machado matrices instead of
  interpolation. Cite the source.
- **A "problem spots" detector** that flags low-contrast/low-distinguishability
  regions for a given deficiency.
- **Web app UX** and docs.

## Rules of the road

1. Every change needs a test (synthetic colors / small RGBA buffers — assert
   robust invariants, not brittle exact values where float math is involved).
2. `npm run typecheck` and `npm test` must pass.
3. Keep the public API small and the package **zero-dependency**.
4. Cite a reference for any color-science change.

## Reporting bugs

Open an issue with the input color/image dimensions, the type & severity, and
what you expected vs. got.

By contributing you agree your contributions are licensed under the project's
[MIT License](./LICENSE).
