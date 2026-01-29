/**
 * Static Site Generator for Uphill Ski Colorado
 * Generates static HTML content from resorts.json at build time
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { generateCard, generateTableRow } from "../src/shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Read resorts data
const resorts = JSON.parse(
  readFileSync(join(rootDir, "resorts.json"), "utf-8"),
);

// Generate all cards
const cardsHtml = resorts.map(generateCard).join("");

// Generate all table rows
const tableRowsHtml = resorts.map(generateTableRow).join("");

// Read index.html template
let indexHtml = readFileSync(join(rootDir, "index.html"), "utf-8");

// Marker comments for injection
const CARDS_START = "<!-- STATIC_CARDS_START -->";
const CARDS_END = "<!-- STATIC_CARDS_END -->";
const TABLE_START = "<!-- STATIC_TABLE_START -->";
const TABLE_END = "<!-- STATIC_TABLE_END -->";
const COUNT_MARKER = "<!-- STATIC_COUNT -->";

// Replace placeholders with generated content
if (indexHtml.includes(CARDS_START) && indexHtml.includes(CARDS_END)) {
  const cardsRegex = new RegExp(`${CARDS_START}[\\s\\S]*?${CARDS_END}`, "g");
  indexHtml = indexHtml.replace(
    cardsRegex,
    `${CARDS_START}\n${cardsHtml}\n          ${CARDS_END}`,
  );
} else {
  console.warn("Warning: Cards markers not found in index.html");
}

if (indexHtml.includes(TABLE_START) && indexHtml.includes(TABLE_END)) {
  const tableRegex = new RegExp(`${TABLE_START}[\\s\\S]*?${TABLE_END}`, "g");
  indexHtml = indexHtml.replace(
    tableRegex,
    `${TABLE_START}\n${tableRowsHtml}\n              ${TABLE_END}`,
  );
} else {
  console.warn("Warning: Table markers not found in index.html");
}

// Replace count marker
indexHtml = indexHtml.replace(
  COUNT_MARKER,
  `${resorts.length} of ${resorts.length} resorts`,
);

// Write updated index.html
writeFileSync(join(rootDir, "index.html"), indexHtml);

console.log(
  `✓ Generated static HTML for ${resorts.length} resorts in index.html`,
);
