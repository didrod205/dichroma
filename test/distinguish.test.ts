import { describe, expect, it } from "vitest";
import { distinguish, auditPalette, deltaE, rgbToLab, hexToRgb } from "../src/index.js";

describe("deltaE / rgbToLab", () => {
  it("is zero for identical colors", () => {
    expect(deltaE([100, 150, 200], [100, 150, 200])).toBe(0);
  });

  it("maps black and white to expected L*", () => {
    expect(rgbToLab([0, 0, 0])[0]).toBeCloseTo(0, 0);
    expect(rgbToLab([255, 255, 255])[0]).toBeCloseTo(100, 0);
  });

  it("grows with visible difference", () => {
    const small = deltaE([100, 100, 100], [105, 100, 100]);
    const large = deltaE([0, 0, 0], [255, 255, 255]);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeGreaterThan(95);
  });
});

describe("distinguish", () => {
  it("keeps red vs blue distinguishable under deuteranopia", () => {
    const r = distinguish([255, 0, 0], [0, 0, 255], "deuteranopia");
    expect(r.distinguishable).toBe(true);
    expect(r.retained).toBeGreaterThan(0.8);
  });

  it("collapses red vs green difference under deuteranopia", () => {
    const r = distinguish([255, 0, 0], [0, 128, 0], "deuteranopia");
    // The perceptual gap shrinks dramatically (red-green confusion).
    expect(r.simulated).toBeLessThan(r.normal * 0.3);
  });

  it("respects a custom threshold", () => {
    const a: [number, number, number] = [120, 120, 120];
    const b: [number, number, number] = [128, 128, 128];
    expect(distinguish(a, b, "protanopia", { threshold: 100 }).distinguishable).toBe(false);
    expect(distinguish(a, b, "protanopia", { threshold: 1 }).distinguishable).toBe(true);
  });
});

describe("auditPalette", () => {
  it("flags an indistinguishable pair and reports indices", () => {
    // A blue and a purple that converge under deuteranopia.
    const colors = ["#377eb8", "#984ea3"].map(hexToRgb);
    const res = auditPalette(colors, "deuteranopia");
    expect(res.ok).toBe(false);
    expect(res.pairs[0]).toMatchObject({ a: 0, b: 1, distinguishable: false });
  });

  it("passes a palette of well-separated hues", () => {
    const colors = ["#000000", "#ffffff"].map(hexToRgb);
    expect(auditPalette(colors, "deuteranopia").ok).toBe(true);
  });
});
