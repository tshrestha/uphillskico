/**
 * Post-build CSP guard: the Content-Security-Policy header allows scripts only
 * from the site's own origin (`script-src 'self'`), so any inline executable
 * <script> in the built HTML would be silently blocked in production.
 *
 * Fails (exit 1) when any HTML file has a <script> without `src` whose type
 * isn't `application/ld+json` (structured data is never executed).
 *
 * Usage: node scripts/check-inline-scripts.js [dir]   (default: dist)
 */

import { readFileSync, readdirSync } from "fs";
import { join, relative } from "path";
import { parse } from "node-html-parser";

const dir = process.argv[2] ?? "dist";
const ALLOWED_INLINE_TYPES = new Set(["application/ld+json"]);

function htmlFiles(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((entry) => {
    const full = join(d, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const problems = [];
const files = htmlFiles(dir);

for (const file of files) {
  const root = parse(readFileSync(file, "utf-8"), {
    blockTextElements: { script: true },
  });
  for (const script of root.querySelectorAll("script")) {
    if (script.hasAttribute("src")) continue;
    const type = (script.getAttribute("type") ?? "").trim().toLowerCase();
    if (ALLOWED_INLINE_TYPES.has(type)) continue;
    const snippet = script.text.trim().replace(/\s+/g, " ").slice(0, 80);
    problems.push(`${relative(dir, file)}: <script type="${type}"> ${snippet}`);
  }
}

if (problems.length) {
  console.error(
    `✗ Inline executable scripts found (blocked by CSP script-src 'self'):\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(`✓ No inline executable scripts in ${files.length} HTML file(s)`);
