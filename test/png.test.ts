import { describe, expect, it } from "vitest";
import { deflateSync } from "node:zlib";
import { decodePng, encodePng, isPng } from "../src/png.js";

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const u32 = (n: number): number[] => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
function chunk(type: string, data: number[]): number[] {
  const t = [...type].map((c) => c.charCodeAt(0));
  return [...u32(data.length), ...t, ...data, ...u32(crc32(Uint8Array.from([...t, ...data])))];
}
/** Build an 8-bit truecolor+alpha PNG from RGBA pixels. */
function buildPng(w: number, h: number, rgba: number[]): Uint8Array {
  const stride = w * 4;
  const raw = new Uint8Array(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = rgba[y * stride + x]!;
  }
  const idat = [...new Uint8Array(deflateSync(raw))];
  const ihdr = [...u32(w), ...u32(h), 8, 6, 0, 0, 0];
  return Uint8Array.from([...SIG, ...chunk("IHDR", ihdr), ...chunk("IDAT", idat), ...chunk("IEND", [])]);
}
const px = (img: { data: Uint8ClampedArray; width: number }, x: number, y: number): number[] => {
  const o = (y * img.width + x) * 4;
  return [img.data[o]!, img.data[o + 1]!, img.data[o + 2]!, img.data[o + 3]!];
};

describe("isPng", () => {
  it("recognizes the signature", () => {
    expect(isPng(Uint8Array.from(SIG))).toBe(true);
    expect(isPng(Uint8Array.from([1, 2, 3]))).toBe(false);
  });
});

describe("decodePng", () => {
  it("decodes truecolor+alpha pixels", () => {
    const rgba = [255, 0, 0, 255, 0, 255, 0, 128];
    const img = decodePng(buildPng(2, 1, rgba));
    expect(px(img, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(px(img, 1, 0)).toEqual([0, 255, 0, 128]);
  });

  it("throws on non-PNG input", () => {
    expect(() => decodePng(Uint8Array.from([1, 2, 3, 4]))).toThrow(/not a PNG/);
  });
});

describe("encodePng round-trip", () => {
  it("encodes pixels that decode back identically", () => {
    const w = 3, h = 2;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i++) data[i] = (i * 37) % 256;
    // keep alpha fully opaque so comparison is exact
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    const png = encodePng(data, w, h);
    expect(isPng(png)).toBe(true);
    const back = decodePng(png);
    expect(back.width).toBe(w);
    expect(back.height).toBe(h);
    expect(Array.from(back.data)).toEqual(Array.from(data));
  });
});
