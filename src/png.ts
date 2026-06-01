/**
 * Minimal PNG decode/encode → RGBA, using only Node's built-in `zlib`.
 *
 * Decoding supports the common 8-bit cases (truecolor, truecolor+alpha,
 * grayscale(+alpha), indexed) with all five scanline filters. Encoding always
 * writes 8-bit truecolor+alpha (color type 6) with filter 0. This keeps the
 * CLI dependency-free — `node:zlib` is the standard library, not an npm package.
 */

import { deflateSync, inflateSync } from "node:zlib";

export interface DecodedImage {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, row-major. */
  data: Uint8ClampedArray;
}

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function isPng(b: Uint8Array): boolean {
  return SIGNATURE.every((v, i) => b[i] === v);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function channelsFor(colorType: number): number {
  switch (colorType) {
    case 0: return 1;
    case 2: return 3;
    case 3: return 1;
    case 4: return 2;
    case 6: return 4;
    default: throw new Error(`unsupported PNG color type ${colorType}`);
  }
}

export function decodePng(buf: Uint8Array): DecodedImage {
  if (!isPng(buf)) throw new Error("not a PNG file");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat: Uint8Array[] = [];
  let palette: Uint8Array | null = null;
  let trns: Uint8Array | null = null;

  let pos = 8;
  while (pos + 8 <= buf.length) {
    const len = dv.getUint32(pos);
    const type = String.fromCharCode(buf[pos + 4]!, buf[pos + 5]!, buf[pos + 6]!, buf[pos + 7]!);
    const dataStart = pos + 8;
    if (dataStart + len > buf.length) break;
    if (type === "IHDR") {
      width = dv.getUint32(dataStart);
      height = dv.getUint32(dataStart + 4);
      bitDepth = buf[dataStart + 8]!;
      colorType = buf[dataStart + 9]!;
      interlace = buf[dataStart + 12]!;
    } else if (type === "PLTE") palette = buf.subarray(dataStart, dataStart + len);
    else if (type === "tRNS") trns = buf.subarray(dataStart, dataStart + len);
    else if (type === "IDAT") idat.push(buf.subarray(dataStart, dataStart + len));
    else if (type === "IEND") break;
    pos = dataStart + len + 4;
  }

  if (width === 0 || height === 0) throw new Error("invalid PNG: missing IHDR");
  if (interlace !== 0) throw new Error("interlaced PNG is not supported");
  if (bitDepth !== 8 && !(colorType === 3 && bitDepth <= 8)) {
    throw new Error(`unsupported PNG bit depth ${bitDepth}`);
  }

  const total = idat.reduce((n, c) => n + c.length, 0);
  const compressed = new Uint8Array(total);
  let off = 0;
  for (const c of idat) { compressed.set(c, off); off += c.length; }
  const raw = new Uint8Array(inflateSync(compressed));

  const out = new Uint8ClampedArray(width * height * 4);
  if (colorType === 3) {
    if (!palette) throw new Error("indexed PNG missing PLTE");
    const stride = Math.ceil((width * bitDepth) / 8);
    const rows = unfilter(raw, stride, height, 1);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = readIndex(rows, y * stride, x, bitDepth);
        const d = (y * width + x) * 4;
        out[d] = palette[idx * 3] ?? 0;
        out[d + 1] = palette[idx * 3 + 1] ?? 0;
        out[d + 2] = palette[idx * 3 + 2] ?? 0;
        out[d + 3] = trns && idx < trns.length ? trns[idx]! : 255;
      }
    }
  } else {
    const channels = channelsFor(colorType);
    const stride = width * channels;
    const rows = unfilter(raw, stride, height, channels);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = y * stride + x * channels;
        const d = (y * width + x) * 4;
        if (colorType === 0 || colorType === 4) {
          out[d] = out[d + 1] = out[d + 2] = rows[s]!;
          out[d + 3] = colorType === 4 ? rows[s + 1]! : 255;
        } else {
          out[d] = rows[s]!;
          out[d + 1] = rows[s + 1]!;
          out[d + 2] = rows[s + 2]!;
          out[d + 3] = colorType === 6 ? rows[s + 3]! : 255;
        }
      }
    }
  }
  return { width, height, data: out };
}

function unfilter(raw: Uint8Array, stride: number, height: number, bpp: number): Uint8Array {
  const out = new Uint8Array(height * stride);
  let rawPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rawPos++]!;
    const rowStart = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[rawPos++]!;
      const a = x >= bpp ? out[rowStart + x - bpp]! : 0;
      const b = y > 0 ? out[rowStart - stride + x]! : 0;
      const c = y > 0 && x >= bpp ? out[rowStart - stride + x - bpp]! : 0;
      let v: number;
      switch (filter) {
        case 0: v = value; break;
        case 1: v = value + a; break;
        case 2: v = value + b; break;
        case 3: v = value + ((a + b) >> 1); break;
        case 4: v = value + paeth(a, b, c); break;
        default: throw new Error(`unsupported PNG filter ${filter}`);
      }
      out[rowStart + x] = v & 0xff;
    }
  }
  return out;
}

function readIndex(rows: Uint8Array, rowStart: number, x: number, bitDepth: number): number {
  if (bitDepth === 8) return rows[rowStart + x]!;
  const perByte = 8 / bitDepth;
  const byte = rows[rowStart + Math.floor(x / perByte)]!;
  const shift = (perByte - 1 - (x % perByte)) * bitDepth;
  return (byte >> shift) & ((1 << bitDepth) - 1);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const t = Uint8Array.from([...type].map((c) => c.charCodeAt(0)));
  const body = new Uint8Array(t.length + data.length);
  body.set(t);
  body.set(data, t.length);
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  out.set(body, 4);
  dv.setUint32(8 + data.length, crc32(body));
  return out;
}

/** Encode RGBA pixels as an 8-bit truecolor+alpha PNG. */
export function encodePng(data: Uint8ClampedArray | Uint8Array, width: number, height: number): Uint8Array {
  const stride = width * 4;
  const raw = new Uint8Array(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    raw.set(data.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }
  const idat = new Uint8Array(deflateSync(raw));
  const ihdr = new Uint8Array(13);
  const hv = new DataView(ihdr.buffer);
  hv.setUint32(0, width);
  hv.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: truecolor + alpha
  const parts = [
    Uint8Array.from(SIGNATURE),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", new Uint8Array(0)),
  ];
  const size = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(size);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
