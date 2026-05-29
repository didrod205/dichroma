import { CVD_LIST, CVD_TYPES, simulateImage } from "../src/index";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const fileInput = $<HTMLInputElement>("file");
const grid = $<HTMLDivElement>("grid");

let source: ImageData | null = null;

function tile(label: string, sub: string, rgba: Uint8ClampedArray, w: number, h: number): HTMLElement {
  const fig = document.createElement("figure");
  fig.className = "tile";
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const id = ctx.createImageData(w, h);
  id.data.set(rgba);
  ctx.putImageData(id, 0, 0);
  c.title = "Click to download";
  c.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `dichroma-${label.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  });
  const cap = document.createElement("figcaption");
  cap.innerHTML = `<span class="t">${label}</span><span class="s">${sub}</span>`;
  fig.append(c, cap);
  return fig;
}

function render(): void {
  if (!source) return;
  grid.innerHTML = "";
  const { width, height } = source;
  grid.append(tile("Normal vision", "what you see", source.data, width, height));
  for (const type of CVD_LIST) {
    const info = CVD_TYPES[type];
    const out = simulateImage({ data: source.data, width, height }, type);
    grid.append(tile(info.label, info.prevalence, out, width, height));
  }
}

function setImage(img: CanvasImageSource, w: number, h: number): void {
  const max = 460;
  const scale = Math.min(1, max / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, cw, ch);
  source = ctx.getImageData(0, 0, cw, ch);
  render();
}

function loadFile(file: File): void {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    setImage(img, img.naturalWidth, img.naturalHeight);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function loadSample(): void {
  const c = document.createElement("canvas");
  c.width = 460;
  c.height = 200;
  const ctx = c.getContext("2d")!;
  // Red/green blocks + text — the classic confusion pair.
  const cols = ["#e53935", "#43a047", "#fb8c00", "#1e88e5", "#8e24aa", "#fdd835"];
  cols.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect((i * c.width) / cols.length, 0, c.width / cols.length, 130);
  });
  ctx.fillStyle = "#43a047";
  ctx.fillRect(0, 130, c.width, 70);
  ctx.fillStyle = "#e53935";
  ctx.font = "bold 38px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Can you read this?", c.width / 2, 178);
  setImage(c, c.width, c.height);
}

$("pick").addEventListener("click", () => fileInput.click());
$("sample").addEventListener("click", loadSample);
fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (f) loadFile(f);
});

const drop = $("drop");
["dragover", "dragenter"].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("over");
  }),
);
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("over")));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  const f = (e as DragEvent).dataTransfer?.files?.[0];
  if (f && f.type.startsWith("image/")) loadFile(f);
});
window.addEventListener("paste", (e) => {
  const f = Array.from((e as ClipboardEvent).clipboardData?.files ?? []).find((x) =>
    x.type.startsWith("image/"),
  );
  if (f) loadFile(f);
});
