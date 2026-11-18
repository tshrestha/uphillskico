// Build-time trail map image resolver.
//
// Trail map images live in src/assets/trailmaps/ and go through astro:assets,
// so their public URLs are content-hashed (/_astro/...). resorts.json and
// src/trailmaps-data.js keep referring to them by file name; everything that
// needs a URL resolves it here. A missing file fails the build.

import { getImage } from "astro:assets";
import { trailMaps, getMapsByResort } from "../trailmaps-data.js";

const DIR = "../assets/trailmaps/";
const images = import.meta.glob("../assets/trailmaps/*.{webp,avif}", {
  eager: true,
  import: "default",
});

/**
 * Card/preview thumbnail settings. Quality 36 keeps every map under
 * Lighthouse's image-compression target (about 0.17 bytes per pixel), so
 * `image-delivery-insight` stays under 100 KiB on /trailmaps.html; at card
 * size it looks the same as the earlier quality 58.
 */
export const THUMB = { width: 600, quality: 36, format: "webp" };

/**
 * Widths offered in a card thumbnail's srcset. The largest is THUMB.width, so
 * the card `src` (and the viewer placeholder read from it) is the 600px file.
 */
export const THUMB_WIDTHS = [320, 480, 600];

/**
 * Card thumbnail `sizes`, matching .map-grid in src/styles/maps.css (each
 * value slightly over the measured image width, so the browser never picks a
 * file that is too small):
 *   ≤ 560px    2 columns (mobile rule)          118–239px
 *   561–608px  1 column                         499–542px
 *   609–927px  2 columns of minmax(17rem, 1fr)  255–400px
 *   928–1247px 3 columns                        255–353px
 *   ≥ 1248px   4 columns inside --wrap          ≤ 258px
 * Re-measure if the grid, gutters or card padding change.
 */
export const THUMB_SIZES = [
  "(max-width: 560px) calc(50vw - 2rem)",
  "(max-width: 608px) calc(100vw - 3.5rem)",
  "(max-width: 927px) calc(46vw - 17px)",
  "(max-width: 1247px) calc(30vw - 17px)",
  "258px",
].join(", ");

/**
 * Image metadata for a trail map file
 * @param {string} file - File name, e.g. "Vail.avif"
 * @returns {import("astro").ImageMetadata}
 */
export function getMapImage(file) {
  const image = images[`${DIR}${file}`];
  if (!image) {
    throw new Error(
      `Trail map image "${file}" not found in src/assets/trailmaps/`,
    );
  }
  return image;
}

/**
 * Full-size map URL: the original file, unmodified (same format, dimensions
 * and bytes), so dense maps stay legible
 * @param {string} file - File name
 * @returns {string} e.g. /_astro/Vail.Bx7k2.avif
 */
export function getFullSrc(file) {
  return getMapImage(file).src;
}

/**
 * Thumbnail URL, identical to what <Image {...THUMB}> renders for the file
 * @param {string} file - File name
 * @returns {Promise<string>}
 */
export async function getThumbSrc(file) {
  const thumb = await getImage({ src: getMapImage(file), ...THUMB });
  return thumb.src;
}

/**
 * Entry the trail map viewer needs for one map
 * @param {{ name: string, rank?: number, file: string }} map
 */
export async function toViewerMap(map) {
  return {
    name: map.name,
    rank: map.rank,
    src: getFullSrc(map.file),
    thumb: await getThumbSrc(map.file),
  };
}

/**
 * Resolve a resorts.json `trailMap` path for a link: image paths
 * (/trailmaps/Vail.avif) become their processed full-size URL, resort map
 * pages (/trailmaps/aspen.html) pass through unchanged.
 * @param {string|undefined} path
 * @returns {string|undefined}
 */
export function resolveTrailMapHref(path) {
  if (!path || path.endsWith(".html")) return path;
  return getFullSrc(path.split("/").pop());
}

/**
 * The maps the viewer pages through when a resort's trail map link is opened:
 * every map of that resort, starting at the linked one.
 * @param {string|undefined} path - resorts.json `trailMap` path
 * @returns {Promise<{ maps: object[], index: number } | null>}
 */
export async function getViewerGallery(path) {
  if (!path) return null;
  const file = path.split("/").pop();
  let maps = [];
  let index = 0;
  if (file.endsWith(".html")) {
    maps = getMapsByResort(file.replace(".html", ""));
  } else {
    const match = trailMaps.find((m) => m.file === file);
    if (match) {
      maps = getMapsByResort(match.resort);
      index = Math.max(0, maps.indexOf(match));
    } else {
      getMapImage(file); // still fail the build if the file is missing
    }
  }
  if (!maps.length) return null;
  return { maps: await Promise.all(maps.map(toViewerMap)), index };
}
