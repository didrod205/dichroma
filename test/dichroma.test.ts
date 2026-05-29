import { describe, expect, it } from "vitest";
import {
  CVD_LIST,
  CVD_TYPES,
  simulate,
  simulateHex,
  simulateImage,
  type RGB,
} from "../src/index.js";

describe("simulate (single color)", () => {
  it("changes a pure red under deuteranopia", () => {
    const out = simulate([255, 0, 0], "deuteranopia");
    expect(out).not.toEqual([255, 0, 0]);
    expect(out[2]).toBeLessThan(60); // little blue introduced
    expect(out[1]).toBeGreaterThan(0); // some green channel output
  });

  it("severity 0 is (essentially) a no-op", () => {
    const input: RGB = [123, 45, 200];
    const out = simulate(input, "protanopia", 0);
    out.forEach((c, i) => expect(Math.abs(c - (input[i] as number))).toBeLessThanOrEqual(1));
  });

  it("higher severity changes the color more", () => {
    const base: RGB = [200, 120, 40];
    const mild = simulate(base, "protanomaly", 0.3);
    const full = simulate(base, "protanopia", 1);
    const dist = (a: RGB, b: RGB) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    expect(dist(full, base)).toBeGreaterThan(dist(mild, base));
  });

  it("achromatopsia produces a true gray (r=g=b)", () => {
    const [r, g, b] = simulate([200, 100, 50], "achromatopsia");
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("achromatomaly desaturates but isn't fully gray", () => {
    const [r, g, b] = simulate([200, 100, 50], "achromatomaly");
    expect(r === g && g === b).toBe(false);
    // channels move toward each other vs the original spread
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(150);
  });
});

describe("simulateHex", () => {
  it("round-trips through hex", () => {
    expect(simulateHex("#ff0000", "protanopia")).toMatch(/^#[0-9a-f]{6}$/);
    expect(simulateHex("#808080", "deuteranopia")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("simulateImage", () => {
  const img = Uint8ClampedArray.from([
    255, 0, 0, 255, // red, opaque
    0, 255, 0, 128, // green, half alpha
  ]);

  it("returns a new buffer of the same length and preserves alpha", () => {
    const out = simulateImage(img, "deuteranopia");
    expect(out).not.toBe(img);
    expect(out.length).toBe(img.length);
    expect(out[3]).toBe(255);
    expect(out[7]).toBe(128);
  });

  it("accepts ImageData-shaped input", () => {
    const out = simulateImage({ data: img, width: 2, height: 1 }, "protanopia");
    expect(out.length).toBe(8);
  });

  it("does not mutate the input", () => {
    const copy = Uint8ClampedArray.from(img);
    simulateImage(img, "tritanopia");
    expect(img).toEqual(copy);
  });
});

describe("metadata", () => {
  it("exposes 8 deficiency types with info", () => {
    expect(CVD_LIST).toHaveLength(8);
    for (const t of CVD_LIST) {
      expect(CVD_TYPES[t]).toMatchObject({ label: expect.any(String), prevalence: expect.any(String) });
    }
  });
});
