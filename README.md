<div align="center">

# 🌈 dichroma

### See your colors and images the way color-blind people do — accurately, locally.

[![npm version](https://img.shields.io/npm/v/dichroma.svg?color=success)](https://www.npmjs.com/package/dichroma)
[![bundle size](https://img.shields.io/bundlephobia/minzip/dichroma?label=gzip)](https://bundlephobia.com/package/dichroma)
[![CI](https://github.com/didrod205/dichroma/actions/workflows/ci.yml/badge.svg)](https://github.com/didrod205/dichroma/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/dichroma.svg)](https://www.npmjs.com/package/dichroma)
[![license](https://img.shields.io/npm/l/dichroma.svg)](./LICENSE)

**[🌐 Try the free web app →](https://didrod205.github.io/dichroma/)** &nbsp;·&nbsp; drop an image, see it through 8 kinds of color blindness at once. Nothing uploaded.

</div>

---

About **1 in 12 men (8%)** and **1 in 200 women** have some form of color vision
deficiency. Your red/green status badges, your map legend, that red "error" text
on a dark background — millions of people may not be able to tell them apart.
And you can't check it by squinting: simulating color blindness is a precise,
per-pixel color-science transform.

**dichroma** simulates how colors and images look under every common deficiency
(protanopia, deuteranopia, tritanopia, achromatopsia and their milder forms),
using the **Machado et al. (2009)** model — accurately, with **zero
dependencies**, and **100% locally**.

> 📸 _Screenshot / demo GIF:_ `./web/screenshot.png` — record the [live app](https://didrod205.github.io/dichroma/) dropping a red/green design and showing the grid where they become indistinguishable.

## Why it exists

- **AI can't do this.** A chatbot can't apply an exact LMS/Machado transform to
  *your* image, and online simulators make you **upload** it. dichroma is a
  small, deterministic, local tool — the right shape for the job.
- **Accessibility is everyone's job now.** WCAG, the EU Accessibility Act, and
  basic empathy mean designers, marketers and creators need to check their work —
  not just developers.
- **One drop, the whole picture.** See all eight deficiency types side-by-side
  instead of toggling one filter at a time.

## Who it's for

**Designers & marketers** (check that a graphic, chart or ad reads for everyone),
**content creators** (thumbnails, infographics), **product/UX & a11y folks**,
**educators**, and **developers** who want a tiny simulation library for tests or
tooling.

## Install

**No install —** just open the **[web app](https://didrod205.github.io/dichroma/)**.

For the library:

```bash
npm install dichroma
```

Zero dependencies. ESM + CJS + TypeScript types. Runs in the browser, Node, Deno and Bun.

## Usage

### Simulate a color

```ts
import { simulate, simulateHex } from "dichroma";

simulate([255, 0, 0], "deuteranopia"); // [163, 144, 0] — red looks olive
simulateHex("#ff0000", "protanopia");  // "#a39000"
simulate([255, 0, 0], "protanomaly", 0.4); // milder, custom severity (0–1)
```

### Simulate an image (browser canvas)

```ts
import { simulateImage } from "dichroma";

const ctx = canvas.getContext("2d")!;
const input = ctx.getImageData(0, 0, canvas.width, canvas.height);
const output = simulateImage(input, "deuteranopia"); // Uint8ClampedArray (alpha preserved)

const out = ctx.createImageData(canvas.width, canvas.height);
out.data.set(output);
ctx.putImageData(out, 0, 0);
```

### List every type

```ts
import { CVD_LIST, CVD_TYPES } from "dichroma";

CVD_LIST; // ["protanopia", "deuteranopia", "tritanopia", "achromatopsia", ...]
CVD_TYPES.deuteranomaly;
// { label: "Deuteranomaly", family: "deutan", severity: 0.6,
//   prevalence: "~5% of men", description: "Reduced green sensitivity — the most common type." }
```

## Supported deficiencies

| Type | Family | Notes |
| ---- | ------ | ----- |
| **Protanopia** / Protanomaly | red (L) cones | reds look dark / muted |
| **Deuteranopia** / Deuteranomaly | green (M) cones | most common (~5% of men) |
| **Tritanopia** / Tritanomaly | blue (S) cones | rare |
| **Achromatopsia** / Achromatomaly | none | total / partial color loss |

`simulate(rgb, type, severity?)` lets you dial severity from `0` (normal) to `1`
(full). Dichromacy types default to `1`; the "-anomaly" types default to `~0.6`.

## API

| Function | Description |
| -------- | ----------- |
| `simulate(rgb, type, severity?)` | Simulate a single `[r,g,b]` color. |
| `simulateHex(hex, type, severity?)` | Same, for hex strings. |
| `simulateImage(source, type, severity?)` | Simulate an RGBA buffer / `ImageData` (returns a new buffer; alpha preserved). |
| `CVD_LIST` / `CVD_TYPES` | The deficiency types and their metadata. |
| `hexToRgb` / `rgbToHex` | Helpers. |

## FAQ

**Is my image uploaded anywhere?**
No. The web app and the library run entirely on your device — no server, no
telemetry, works offline.

**How accurate is it?**
It uses the widely-cited Machado, Oliveira & Fernandes (2009) model for
protan/deutan/tritan, applied in linear RGB. Milder variants interpolate toward
normal vision by severity. Simulation is inherently a model, but it matches the
results practitioners expect.

**Does it correct images for color-blind users (daltonize)?**
Not yet — dichroma *simulates* deficiencies today. Daltonization (recoloring to
improve distinguishability) is on the roadmap.

**Can it check a whole UI or palette?**
Screenshot your UI and drop it in — you'll instantly see if elements that rely on
color alone become indistinguishable.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md).

```bash
git clone https://github.com/didrod205/dichroma.git
cd dichroma
npm install
npm test          # run the suite
npm run dev       # run the web app locally
```

## 💖 Sponsor

dichroma is free, MIT-licensed, and built in spare time. If it helped you make
something everyone can see, please consider supporting it:

- ⭐ **Star this repo** — free, and it genuinely helps others find it.
- 🍋 **[Sponsor via Lemon Squeezy](https://elab-studio.lemonsqueezy.com/checkout/buy/5d059b89-51d0-456b-b33a-ed56994f7010)** — one-time or recurring support.

**Where your support goes:** adding **daltonization** (color correction), a
"problem spots" overlay that flags low-distinguishability regions, batch image
processing and a CLI, refining the simulation model, keeping the free web app
online, and fast issue responses.

## License

[MIT](./LICENSE) © dichroma contributors
