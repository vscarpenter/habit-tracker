/**
 * Generate PWA icons + favicon from the master SVG source.
 * Run: node scripts/generate-icons.mjs
 *
 * Reads scripts/icon-source.svg and outputs:
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/icon-maskable-512.png
 *   src/app/favicon.ico  (32x32 PNG)
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const svgSource = readFileSync(join(__dirname, "icon-source.svg"));

// --- Standard icons (just resize the SVG) ---
const standardSizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

for (const { name, size } of standardSizes) {
  await sharp(svgSource).resize(size, size).png().toFile(join(outDir, name));
  console.log(`✓ ${name}`);
}

// --- Maskable icon: full-bleed blue background with icon centered in safe zone ---
const maskableSize = 512;
const safeZone = Math.round(maskableSize * 0.8);
const padding = Math.round((maskableSize - safeZone) / 2);

const iconResized = await sharp(svgSource)
  .resize(safeZone, safeZone)
  .png()
  .toBuffer();

await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 37, g: 99, b: 235, alpha: 1 }, // #2563eb
  },
})
  .composite([{ input: iconResized, left: padding, top: padding }])
  .png()
  .toFile(join(outDir, "icon-maskable-512.png"));

console.log("✓ icon-maskable-512.png");

// --- Favicon: 32x32 PNG saved as .ico extension ---
// Modern browsers accept PNG favicons. No ICO container needed.
await sharp(svgSource)
  .resize(32, 32)
  .png()
  .toFile(join(root, "src", "app", "favicon.ico"));

console.log("✓ favicon.ico");

console.log("\nDone — icons generated.");
