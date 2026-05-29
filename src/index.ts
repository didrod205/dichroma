/**
 * dichroma — see your colors and images the way ~1 in 12 men and ~1 in 200
 * women do. Accurate, dependency-free color-vision-deficiency simulation that
 * runs entirely locally.
 */

import { clamp, hexToRgb, linearToSrgb, rgbToHex, srgbToLinear, type RGB } from "./color.js";
import { CVD_TYPES, matrixFor, type CVDType } from "./matrices.js";

export type { RGB } from "./color.js";
export type { CVDType, CVDInfo, Family } from "./matrices.js";
export { CVD_TYPES } from "./matrices.js";
export { hexToRgb, rgbToHex } from "./color.js";

/** All simulatable deficiency types, in display order. */
export const CVD_LIST: CVDType[] = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia",
  "protanomaly",
  "deuteranomaly",
  "tritanomaly",
  "achromatomaly",
];

function applyMatrix(rgb: RGB, m: number[]): RGB {
  const lr = srgbToLinear(rgb[0] / 255);
  const lg = srgbToLinear(rgb[1] / 255);
  const lb = srgbToLinear(rgb[2] / 255);
  const r = (m[0] as number) * lr + (m[1] as number) * lg + (m[2] as number) * lb;
  const g = (m[3] as number) * lr + (m[4] as number) * lg + (m[5] as number) * lb;
  const b = (m[6] as number) * lr + (m[7] as number) * lg + (m[8] as number) * lb;
  return [
    Math.round(clamp(linearToSrgb(clamp(r, 0, 1)), 0, 1) * 255),
    Math.round(clamp(linearToSrgb(clamp(g, 0, 1)), 0, 1) * 255),
    Math.round(clamp(linearToSrgb(clamp(b, 0, 1)), 0, 1) * 255),
  ];
}

function applyAchroma(rgb: RGB, severity: number): RGB {
  // Perceived luminance (Rec. 709) blended in by severity.
  const gray = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  const mix = (c: number) => Math.round(c + (gray - c) * severity);
  return [mix(rgb[0]), mix(rgb[1]), mix(rgb[2])];
}

/**
 * Simulate how a single color is perceived under a given deficiency.
 *
 * ```ts
 * simulate([255, 0, 0], "deuteranopia"); // how a red looks to a deuteranope
 * simulate([255, 0, 0], "protanomaly", 0.4); // milder, custom severity
 * ```
 */
export function simulate(rgb: RGB, type: CVDType, severity?: number): RGB {
  const info = CVD_TYPES[type];
  const sev = severity ?? info.severity;
  if (info.family === "achroma") return applyAchroma(rgb, sev);
  return applyMatrix(rgb, matrixFor(info.family, sev));
}

/** Convenience wrapper for hex strings. */
export function simulateHex(hex: string, type: CVDType, severity?: number): string {
  return rgbToHex(simulate(hexToRgb(hex), type, severity));
}

/** An RGBA pixel buffer, or anything `ImageData`-shaped. */
export type PixelSource = Uint8ClampedArray | { data: Uint8ClampedArray; width?: number; height?: number };

function toPixels(source: PixelSource): Uint8ClampedArray {
  return source instanceof Uint8ClampedArray ? source : source.data;
}

/**
 * Simulate a deficiency across an RGBA image buffer (alpha preserved).
 * Returns a **new** `Uint8ClampedArray`; the input is not mutated.
 *
 * ```ts
 * const out = simulateImage(ctx.getImageData(0, 0, w, h), "deuteranopia");
 * ctx.putImageData(new ImageData(out, w, h), 0, 0);
 * ```
 */
export function simulateImage(source: PixelSource, type: CVDType, severity?: number): Uint8ClampedArray {
  const px = toPixels(source);
  const out = new Uint8ClampedArray(px.length);
  const info = CVD_TYPES[type];
  const sev = severity ?? info.severity;
  const m = info.family === "achroma" ? null : matrixFor(info.family, sev);

  for (let i = 0; i < px.length; i += 4) {
    const rgb: RGB = [px[i] as number, px[i + 1] as number, px[i + 2] as number];
    const [r, g, b] = m ? applyMatrix(rgb, m) : applyAchroma(rgb, sev);
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = px[i + 3] as number; // preserve alpha
  }
  return out;
}
