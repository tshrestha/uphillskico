/**
 * Parity check: compares two built sites (e.g. the pre-migration baseline and
 * a new build) on everything that matters for search and content.
 *
 * Usage: node scripts/parity-check.js <baselineDir> <newDir>
 *
 * Compares:
 *   - the set of .html page paths
 *   - per page: <title>, meta description, canonical, robots, Open Graph and
 *     Twitter tags, h1/h2 text, parsed JSON-LD, ticket and map card visible
 *     text, and the ridge SVG markup (whitespace-normalised)
 *   - the sitemap <loc> set
 *
 * Prints every difference and exits 1 when any are found, 0 otherwise.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, relative } from "path";
import { parse } from "node-html-parser";

const [baseDir, newDir] = process.argv.slice(2);
if (!baseDir || !newDir) {
  console.error("Usage: node scripts/parity-check.js <baselineDir> <newDir>");
  process.exit(2);
}

const norm = (text) => (text ?? "").replace(/\s+/g, " ").trim();
// Visible text with block boundaries marked, so whitespace-only text between
// block elements (which browsers don't render) doesn't count as a difference
const blockText = (el) =>
  el.structuredText.split("\n").map(norm).filter(Boolean).join(" | ");

function htmlFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html")) out.push(relative(dir, full));
    }
  };
  walk(dir);
  return out.sort();
}

// Stable JSON for deep comparison (sorted object keys)
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])]),
    );
  }
  return value;
}

function extract(file) {
  const root = parse(readFileSync(file, "utf-8"), {
    blockTextElements: { script: true, style: true },
  });
  const meta = (attr, name) =>
    root
      .querySelectorAll(`meta[${attr}="${name}"]`)
      .map((m) => m.getAttribute("content"));

  const fields = {
    title: [norm(root.querySelector("title")?.text)],
    description: meta("name", "description"),
    canonical: root
      .querySelectorAll('link[rel="canonical"]')
      .map((l) => l.getAttribute("href")),
    robots: meta("name", "robots"),
  };

  for (const m of root.querySelectorAll("meta")) {
    const key = m.getAttribute("property") ?? m.getAttribute("name") ?? "";
    if (/^(og|twitter):/.test(key)) {
      (fields[key] ??= []).push(m.getAttribute("content"));
    }
  }

  fields.h1 = root.querySelectorAll("h1").map((h) => norm(h.text));
  fields.h2 = root.querySelectorAll("h2").map((h) => norm(h.text));
  fields.jsonld = root
    .querySelectorAll('script[type="application/ld+json"]')
    .map((s) => {
      try {
        return JSON.stringify(stable(JSON.parse(s.text)));
      } catch (err) {
        return `INVALID JSON: ${err.message}`;
      }
    });

  // Ticket and card text ignores whitespace-only text nodes between elements
  // (formatter/minifier artefacts; the containers are flex/grid, so they
  // don't render). Whitespace inside text is still compared.
  const tight = parse(readFileSync(file, "utf-8").replace(/>\s+</g, "><"));
  const items = {};
  for (const t of tight.querySelectorAll("li.ticket")) {
    items[`ticket#${t.id}`] = blockText(t);
  }
  tight.querySelectorAll(".map-card").forEach((c, i) => {
    items[`map-card[${i}]`] =
      blockText(c) || norm(c.getAttribute("aria-label"));
  });

  const ridge = root.querySelector("#ridge");
  const ridgeSvgs = ridge
    ? ridge.querySelectorAll("svg.ridge-svg, svg.trail-svg").map((s) =>
        norm(s.outerHTML)
          .replace(/>\s+</g, "><")
          // Old minifier shortened style numbers (--d:0.30 -> --d:.3)
          .replace(/--d:([\d.]+)/g, (_, n) => `--d:${Number(n)}`),
      )
    : [];

  return { fields, items, ridge: ridgeSvgs };
}

function sitemapLocs(dir) {
  const file = join(dir, "sitemap.xml");
  if (!existsSync(file)) return null;
  return [
    ...readFileSync(file, "utf-8").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g),
  ]
    .map((m) => m[1])
    .sort();
}

const diffs = [];
const report = (where, what, before, after) =>
  diffs.push({ where, what, before, after });

// 1. Page path set
const basePages = htmlFiles(baseDir);
const newPages = htmlFiles(newDir);
for (const p of basePages) {
  if (!newPages.includes(p)) report(p, "page", "present", "MISSING");
}
for (const p of newPages) {
  if (!basePages.includes(p)) report(p, "page", "absent", "NEW");
}

// 2. Per-page comparison
for (const page of basePages.filter((p) => newPages.includes(p))) {
  const a = extract(join(baseDir, page));
  const b = extract(join(newDir, page));

  const keys = new Set([...Object.keys(a.fields), ...Object.keys(b.fields)]);
  for (const key of keys) {
    const before = JSON.stringify(a.fields[key] ?? []);
    const after = JSON.stringify(b.fields[key] ?? []);
    if (before !== after) report(page, key, before, after);
  }

  const itemKeys = new Set([...Object.keys(a.items), ...Object.keys(b.items)]);
  for (const key of itemKeys) {
    if (a.items[key] !== b.items[key]) {
      report(page, key, a.items[key] ?? "(none)", b.items[key] ?? "(none)");
    }
  }

  a.ridge.forEach((svg, i) => {
    if (svg !== b.ridge[i]) {
      report(
        page,
        `ridge-svg[${i}]`,
        `${svg.length} chars`,
        b.ridge[i] ? `${b.ridge[i].length} chars, differs` : "(none)",
      );
    }
  });
  if (b.ridge.length > a.ridge.length) {
    report(
      page,
      "ridge-svg",
      `${a.ridge.length} svgs`,
      `${b.ridge.length} svgs`,
    );
  }
}

// 3. Sitemap
const locsA = sitemapLocs(baseDir);
const locsB = sitemapLocs(newDir);
if (JSON.stringify(locsA) !== JSON.stringify(locsB)) {
  report(
    "sitemap.xml",
    "loc set",
    JSON.stringify(locsA),
    JSON.stringify(locsB),
  );
}

if (!diffs.length) {
  console.log(
    `No differences (${basePages.length} pages, ${locsA?.length ?? 0} sitemap URLs).`,
  );
  process.exit(0);
}

for (const d of diffs) {
  console.log(`\n[${d.where}] ${d.what}\n  - ${d.before}\n  + ${d.after}`);
}
console.log(`\n${diffs.length} difference(s).`);
process.exit(1);
