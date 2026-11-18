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

/** Card/preview thumbnail settings (match the old generate-thumbs.js output) */
export const THUMB = { width: 600, quality: 58, format: "webp" };

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
