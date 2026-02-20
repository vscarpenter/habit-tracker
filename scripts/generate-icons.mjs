/**
 * One-off script to generate PWA icons from SVG source.
 * Run: node scripts/generate-icons.mjs
 * Delete this file after icons are generated.
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const ACCENT_BLUE = "#3b82f6";
const WHITE = "#ffffff";

function createSvg(size, maskable = false) {
  const padding = maskable ? size * 0.1 : size * 0.15;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = innerSize / 2;
  const fontSize = Math.round(innerSize * 0.55);

  // Maskable icons need the background to fill the entire canvas
  // (safe zone is the inner 80%, but the full icon is used for display)
  const bgRect = maskable
    ? `<rect width="${size}" height="${size}" fill="${ACCENT_BLUE}" />`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgRect}
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${ACCENT_BLUE}" />
  <text x="${cx}" y="${cy}" dy="0.35em" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="${WHITE}">H</text>
</svg>`;
}

const icons = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const { name, size, maskable } of icons) {
  const svg = createSvg(size, maskable);
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, name));
  console.log(`✓ ${name}`);
}

console.log("Done — icons generated in public/icons/");
