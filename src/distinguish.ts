/**
 * Distinguishability: will two colors still look different to someone with a
 * given color-vision deficiency?
 *
 * We simulate both colors under the deficiency, then measure the perceptual
 * distance between the results with CIE76 ΔE in CIELAB. This answers the
 * question UI/data-viz designers actually have: "can a colorblind user tell
 * these two apart?" — for chart series, status colors, links, etc.
 */

import { srgbToLinear, type RGB } from "./color.js";
import { simulate } from "./index.js";
import type { CVDType } from "./matrices.js";

/** Convert sRGB (0–255) to CIELAB using the D65 white point. */
export function rgbToLab([r, g, b]: RGB): [number, number, number] {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);
  // linear sRGB → XYZ (D65)
  let x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  let y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  let z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIE76 color difference (ΔE*ab) between two sRGB colors. */
export function deltaE(a: RGB, b: RGB): number {
  const [l1, a1, b1] = rgbToLab(a);
  const [l2, a2, b2] = rgbToLab(b);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export interface DistinguishResult {
  /** ΔE between the two colors as actually shown (no deficiency). */
  normal: number;
  /** ΔE between the two colors as seen under the deficiency. */
  simulated: number;
  /** `true` if the pair is still distinguishable under the deficiency. */
  distinguishable: boolean;
  /** How much of the original difference survives (0–1). */
  retained: number;
}

/**
 * A ΔE of ~10 is a common "clearly different" threshold for UI colors (well
 * above the ~2.3 just-noticeable-difference, leaving margin for displays).
 */
export const DEFAULT_THRESHOLD = 10;

/**
 * Check whether two colors remain distinguishable under a deficiency.
 *
 * ```ts
 * distinguish([255,0,0], [0,128,0], "deuteranopia");
 * // { normal: 86, simulated: 7, distinguishable: false, retained: 0.08 }
 * ```
 */
export function distinguish(
  a: RGB,
  b: RGB,
  type: CVDType,
  options: { severity?: number; threshold?: number } = {},
): DistinguishResult {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const normal = deltaE(a, b);
  const simA = simulate(a, type, options.severity);
  const simB = simulate(b, type, options.severity);
  const simulated = deltaE(simA, simB);
  return {
    normal: round(normal),
    simulated: round(simulated),
    distinguishable: simulated >= threshold,
    retained: normal > 0 ? round(simulated / normal, 3) : 1,
  };
}

export interface PalettePair {
  a: number;
  b: number;
  simulated: number;
  distinguishable: boolean;
}

/**
 * Audit a whole palette: for a deficiency, find every pair of colors that
 * becomes hard to tell apart. Returns the failing pairs (by index), worst first.
 */
export function auditPalette(
  colors: RGB[],
  type: CVDType,
  options: { severity?: number; threshold?: number } = {},
): { pairs: PalettePair[]; ok: boolean } {
  const pairs: PalettePair[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const r = distinguish(colors[i]!, colors[j]!, type, options);
      if (!r.distinguishable) {
        pairs.push({ a: i, b: j, simulated: r.simulated, distinguishable: false });
      }
    }
  }
  pairs.sort((x, y) => x.simulated - y.simulated);
  return { pairs, ok: pairs.length === 0 };
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
