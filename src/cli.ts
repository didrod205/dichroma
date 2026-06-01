#!/usr/bin/env node
/**
 * dichroma CLI — simulate color-vision deficiency on colors and PNG images,
 * and check whether colors stay distinguishable. Zero-dependency.
 *
 *   dichroma "#ff0000" --type deuteranopia        # how a red looks
 *   dichroma photo.png -t protanopia -o out.png    # simulate a whole image
 *   dichroma check "#e41a1c" "#377eb8" -t deuteranopia
 *   dichroma photo.png --all                        # write all 8 variants
 */

import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { CVD_LIST, hexToRgb, rgbToHex, simulate, simulateImage } from "./index.js";
import { distinguish } from "./distinguish.js";
import { CVD_TYPES, type CVDType } from "./matrices.js";
import { decodePng, encodePng, isPng } from "./png.js";
import pkg from "../package.json";

const HELP = `dichroma — simulate color-vision deficiency, 100% locally.

Usage:
  dichroma <hex>            [-t <type>]            Simulate a single color
  dichroma <image.png>      [-t <type>] [-o out]   Simulate a PNG image
  dichroma <image.png> --all                        Write all 8 variants
  dichroma check <hexA> <hexB> [-t <type>]          Distinguishable check

Options:
  -t, --type <type>   Deficiency: ${CVD_LIST.join(", ")}
                      (default: deuteranopia — the most common)
      --severity <n>  0–1 override for the deficiency strength
  -o, --out <file>    Output PNG path (default: <name>-<type>.png)
      --all           Generate every deficiency variant (images only)
  -h, --help          Show this help
  -v, --version       Show version

PNG only for images (decoded via Node's built-in zlib — still no deps). Nothing
is uploaded; everything runs on your machine.`;

interface Args {
  cmd: "simulate" | "check";
  inputs: string[];
  type: CVDType;
  severity: number | undefined;
  out: string | null;
  all: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    cmd: "simulate",
    inputs: [],
    type: "deuteranopia",
    severity: undefined,
    out: null,
    all: false,
  };
  if (argv[0] === "check") a.cmd = "check";
  for (let i = a.cmd === "check" ? 1 : 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "-t" || arg === "--type") {
      const t = argv[++i] as CVDType;
      if (t in CVD_TYPES) a.type = t;
      else throw new Error(`unknown type "${t}". One of: ${CVD_LIST.join(", ")}`);
    } else if (arg === "--severity") a.severity = Number(argv[++i]);
    else if (arg === "-o" || arg === "--out") a.out = argv[++i] ?? null;
    else if (arg === "--all") a.all = true;
    else if (!arg.startsWith("-")) a.inputs.push(arg);
  }
  return a;
}

const isHex = (s: string): boolean => /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(s);

function swatchBlock(rgb: [number, number, number], useColor: boolean): string {
  const [r, g, b] = rgb;
  return useColor ? `\x1b[48;2;${r};${g};${b}m    \x1b[0m` : "████";
}

function runCheck(args: Args): number {
  const [aHex, bHex] = args.inputs;
  if (!aHex || !bHex || !isHex(aHex) || !isHex(bHex)) {
    process.stderr.write("dichroma: `check` needs two hex colors. See --help.\n");
    return 2;
  }
  const r = distinguish(hexToRgb(aHex), hexToRgb(bHex), args.type, { severity: args.severity });
  const label = CVD_TYPES[args.type].label;
  const verdict = r.distinguishable ? "\x1b[32mdistinguishable\x1b[0m" : "\x1b[31mTOO SIMILAR\x1b[0m";
  process.stdout.write(
    `${aHex} vs ${bHex} under ${label}:\n` +
      `  normal ΔE ${r.normal}, simulated ΔE ${r.simulated} (${Math.round(r.retained * 100)}% retained)\n` +
      `  → ${process.stdout.isTTY ? verdict : r.distinguishable ? "distinguishable" : "TOO SIMILAR"}\n`,
  );
  return r.distinguishable ? 0 : 1;
}

function runColor(args: Args, hex: string): number {
  const rgb = hexToRgb(hex);
  const useColor = process.stdout.isTTY === true;
  const types = args.all ? CVD_LIST : [args.type];
  process.stdout.write(`${swatchBlock(rgb, useColor)}  ${rgbToHex(rgb)}  (original)\n`);
  for (const t of types) {
    const sim = simulate(rgb, t, args.severity);
    process.stdout.write(`${swatchBlock(sim, useColor)}  ${rgbToHex(sim)}  ${CVD_TYPES[t].label}\n`);
  }
  return 0;
}

function runImage(args: Args, file: string): number {
  let bytes: Uint8Array;
  try {
    bytes = readFileSync(file);
  } catch {
    process.stderr.write(`dichroma: cannot read ${file}\n`);
    return 2;
  }
  if (!isPng(bytes)) {
    process.stderr.write("dichroma: only PNG images are supported by the CLI.\n");
    return 2;
  }
  let img;
  try {
    img = decodePng(bytes);
  } catch (e) {
    process.stderr.write(`dichroma: ${(e as Error).message}\n`);
    return 2;
  }

  const base = file.slice(0, file.length - extname(file).length);
  const types = args.all ? CVD_LIST : [args.type];
  for (const t of types) {
    const out = simulateImage(img.data, t, args.severity);
    const png = encodePng(out, img.width, img.height);
    const dest = args.all ? `${base}-${t}.png` : (args.out ?? `${base}-${t}.png`);
    writeFileSync(dest, png);
    process.stderr.write(`✓ ${CVD_TYPES[t].label} → ${dest}\n`);
  }
  return 0;
}

function main(): number {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help") || argv.length === 0) {
    process.stdout.write(HELP + "\n");
    return argv.length === 0 ? 2 : 0;
  }
  if (argv.includes("-v") || argv.includes("--version")) {
    process.stdout.write(`dichroma ${pkg.version}\n`);
    return 0;
  }

  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`dichroma: ${(e as Error).message}\n`);
    return 2;
  }

  if (args.cmd === "check") return runCheck(args);

  const input = args.inputs[0];
  if (!input) {
    process.stderr.write("dichroma: provide a hex color or a PNG file. See --help.\n");
    return 2;
  }
  return isHex(input) ? runColor(args, input) : runImage(args, input);
}

process.exit(main());
