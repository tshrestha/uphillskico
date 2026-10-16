/**
 * Thumbnail Generator for Uphill Ski Colorado
 * Creates small WebP previews of every trail map in public/trailmaps so the
 * grids and the map viewer don't have to download multi-megabyte originals.
 * Skips thumbnails that are already newer than their source image.
 */

import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { basename, dirname, extname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const SOURCE_DIR = join(rootDir, "public/trailmaps");
const THUMB_DIR = join(SOURCE_DIR, "thumbs");
const THUMB_WIDTH = 600;
const SOURCE_TYPES = new Set([".webp", ".avif", ".jpg", ".jpeg", ".png"]);

mkdirSync(THUMB_DIR, { recursive: true });

const sources = readdirSync(SOURCE_DIR).filter((file) =>
  SOURCE_TYPES.has(extname(file).toLowerCase()),
);

let generated = 0;
for (const file of sources) {
  const src = join(SOURCE_DIR, file);
  const out = join(THUMB_DIR, `${basename(file, extname(file))}.webp`);

  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
    continue;
  }

  await sharp(src, { limitInputPixels: false })
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 58, effort: 6 })
    .toFile(out);
  generated++;
}

console.log(
  `✓ Trail map thumbnails: ${generated} generated, ${sources.length - generated} up to date`,
);
