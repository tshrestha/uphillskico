/**
 * Texture Generator for Uphill Ski Colorado
 * Bakes the mountain surface texture (vertical erosion streaks plus a fine
 * grain) into a small tileable PNG. Rendering it once here keeps the hero
 * from running SVG noise filters in the browser on every repaint.
 */

import sharp from "sharp";
import { Buffer } from "buffer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const out = join(__dirname, "..", "public/images/peak-texture.png");

// The pattern tile covers 220 range units; rendered at this many pixels
const SIZE = 300;
const k = 220 / SIZE;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <filter id="streaks" x="0" y="0" width="1" height="1">
    <feTurbulence type="fractalNoise" baseFrequency="${0.75 * k} ${0.075 * k}" numOctaves="2" seed="11" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0.09  0 0 0 0 0.17  0 0 0 0 0.58  0 0 0 4.2 -2.45"/>
  </filter>
  <filter id="grain" x="0" y="0" width="1" height="1">
    <feTurbulence type="fractalNoise" baseFrequency="${0.95 * k}" numOctaves="2" seed="4" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 4 -2.3"/>
  </filter>
  <rect width="${SIZE}" height="${SIZE}" filter="url(#streaks)" opacity="0.32"/>
  <rect width="${SIZE}" height="${SIZE}" filter="url(#grain)" opacity="0.3"/>
</svg>`;

const info = await sharp(Buffer.from(svg))
  // A tiny palette keeps the file small; the texture is subtle enough not to band
  .png({ palette: true, colors: 8, dither: 0, effort: 10, compressionLevel: 9 })
  .toFile(out);

console.log(
  `✓ Peak texture: ${SIZE}×${SIZE}, ${Math.round(info.size / 1024)} KB`,
);
