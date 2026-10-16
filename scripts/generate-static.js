/**
 * Static Site Generator for Uphill Ski Colorado
 * Generates static HTML content from resorts.json at build time
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { generateTicket, generateRidge } from "../src/shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Read resorts data
const resorts = JSON.parse(
  readFileSync(join(rootDir, "resorts.json"), "utf-8"),
);

// Read index.html template
let indexHtml = readFileSync(join(rootDir, "index.html"), "utf-8");

/**
 * Replace everything between <!-- STATIC_<NAME>_START --> and
 * <!-- STATIC_<NAME>_END --> markers, keeping the markers for the next build.
 */
function replaceBlock(name, html, indent = "") {
  const start = `<!-- STATIC_${name}_START -->`;
  const end = `<!-- STATIC_${name}_END -->`;
  if (!indexHtml.includes(start) || !indexHtml.includes(end)) {
    console.warn(`Warning: ${name} markers not found in index.html`);
    return;
  }
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`, "g");
  indexHtml = indexHtml.replace(regex, () => `${start}${html}${indent}${end}`);
}

replaceBlock(
  "TICKETS",
  `${resorts.map(generateTicket).join("")}\n`,
  "        ",
);
replaceBlock("RIDGE", generateRidge(resorts));
replaceBlock("COUNT", `${resorts.length} of ${resorts.length} resorts`);

// Fill filter option counts: <span data-count="pass:Epic">6</span>
const matchers = {
  pass: (resort, value) => !value || resort.pass === value,
  access: (resort, value) =>
    !value || String(resort.uphillPolicy?.operationalHoursAccess) === value,
};
indexHtml = indexHtml.replace(
  /(<span[^>]*data-count="(\w+):([\w-]*)"[^>]*>)[^<]*(<\/span\s*>)/g,
  (_match, open, key, value, close) =>
    `${open}${resorts.filter((r) => matchers[key]?.(r, value)).length}${close}`,
);

// Write updated index.html
writeFileSync(join(rootDir, "index.html"), indexHtml);

console.log(
  `✓ Generated static HTML for ${resorts.length} resorts in index.html`,
);
