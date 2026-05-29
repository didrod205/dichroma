# dichroma — Product & Strategy

Why dichroma exists, who it's for, how it's positioned, and how it could sustain itself.

## 1. Why this idea

About **1 in 12 men (8%)** and **1 in 200 women** have a color vision
deficiency. Designs that lean on color alone — red/green status, map legends,
chart series, error text — can be unreadable to them. Creators rarely check,
because checking *feels* impossible: you can't simulate color blindness by
squinting; it's an exact per-pixel color-science transform.

dichroma makes it a one-drop habit: see your image through all eight common
deficiencies at once, accurately (Machado 2009 model), and **entirely locally**.
It's a textbook "why didn't I know this?" tool that also does real good —
accessibility is increasingly a legal and ethical baseline (WCAG, the EU
Accessibility Act).

It fits every constraint: **AI can't replace it** (no chatbot applies an exact
LMS transform to your image; online tools require upload), **no server**, **no
API key**, **runs in the browser or any JS runtime**, immediate visual value,
broad audience.

## 2. Competitor analysis

| Tool | What it does | Gaps dichroma fills |
| ---- | ------------ | ------------------- |
| Coblis & similar web simulators | Simulate CVD on an image | Require **upload**; one type at a time; not a library |
| Browser/OS "color filters" | Apply a system-wide filter | Whole-screen only; can't share/export; not per-asset or scriptable |
| `color-blind` (npm) | Simulate single colors | Color-only (no image API); no severity; no app |
| Figma/Chrome CVD plugins | Preview in the design tool | Tool-locked; not a reusable library; not for marketers/creators outside that tool |
| Contrast checkers (incl. our okcolor) | WCAG contrast ratios | Different problem — contrast ≠ hue confusion |

**Nobody** offers: a dependency-free library (colors **and** images, with
severity) + a friendly **local** web app that shows **all eight** deficiencies
side-by-side and lets you download each.

## 3. Differentiation

1. **Local-first** — your image never leaves the browser.
2. **Colors *and* images**, with a severity dial (not just full dichromacy).
3. **All eight at once** — the side-by-side grid is the "aha".
4. **Library + app from one core** — devs embed it; everyone uses the studio.
5. **Accurate & cited** — Machado (2009), applied in linear RGB.

## 4. Folder structure

```
dichroma/
├─ src/        color.ts · matrices.ts (Machado) · index.ts
├─ test/       synthetic color/buffer tests
├─ web/        Vite app → docs/ (GitHub Pages)
├─ .github/    ci · release · pages workflows, templates, FUNDING
└─ README · LICENSE · CONTRIBUTING · CODE_OF_CONDUCT · CHANGELOG · PRODUCT
```

## 9. GitHub Topics

```
color-blindness, color-vision-deficiency, cvd, accessibility, a11y,
protanopia, deuteranopia, tritanopia, daltonize, color-blind-simulator,
design, zero-dependency
```

## 10. Product Hunt launch copy

**Tagline:** See your design the way ~1 in 12 men do — color blindness simulation, locally.

**Description:**
> 8% of men can't tell some of your colors apart — your red/green badges, your
> chart, that error text. dichroma lets you drop an image and instantly see it
> through all eight common types of color blindness, side by side, so you can
> fix what relies on color alone.
>
> It's accurate (Machado 2009 model), it runs 100% in your browser (nothing
> uploaded), and there's a zero-dependency npm library for colors and images too.
>
> Free & open-source (MIT). 🌈

**First comment (maker):** "I shipped a red/green status UI and a color-blind
friend couldn't use it. I wanted a check that took one drag-and-drop — and showed
*every* type at once, locally."

## 11. npm package name

- **Primary:** `dichroma` (from *dichromacy*; brandable, on-theme, available).
- Discoverability via keyword topics & SEO below.

## 12. SEO keyword strategy

Intent-rich queries:

- "color blindness simulator", "color blind image test"
- "how do color blind people see my design", "deuteranopia simulator"
- "check design for color blindness", "color blind accessibility checker"
- "protanopia / tritanopia simulator", "color blind filter for image"
- "daltonize javascript", "cvd simulation library"

Tactics: descriptive `<title>`/meta on the app (done), README phrasing, per-type
docs, GitHub topics, and the GitHub Pages app as an indexable landing page.

## 13. Monetization (without breaking the free, local promise)

Core stays free, open-source, local forever.

1. **Sponsorship** — Lemon Squeezy (wired up), with a clear "where it goes" note.
2. **Pro / integrations** — a paid "accessibility report" export (PDF with
   problem spots), a Figma/VS Code plugin, a GitHub Action that flags color-only
   UI in screenshots on PRs, or a daltonization (color-correction) Pro mode.
3. **Funded features** — orgs sponsor model accuracy work or batch tooling for
   compliance pipelines.

Guardrails: never upload user images, never add telemetry, never paywall the
existing simulation features.
