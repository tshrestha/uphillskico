/**
 * Lighthouse audit: runs Lighthouse against every page in the page registry
 * (src/data/pages.js), on mobile and desktop, and checks the median run of
 * each page and form factor against the budgets in BUDGETS below.
 *
 * Usage: node scripts/lighthouse.js <origin> [--runs N] [--form mobile|desktop]
 *                                   [--json-dir DIR]
 *   e.g. npm run lighthouse -- https://uphillskico.com
 *        npm run lighthouse -- https://deploy-preview-2--uphillskico.netlify.app --form mobile
 *
 *   --runs N       runs per page and form factor (default 3); the median run
 *                  is the one reported and judged
 *   --form F       audit only one form factor (default: both)
 *   --json-dir D   also write each median report as JSON into D
 *                  (e.g. .lighthouse/, which is gitignored)
 *
 * The results table goes to stdout and progress goes to stderr, so
 * `> file.txt` captures only the table.
 *
 * Exit codes: 0 when every page meets every budget; 1 on a budget miss (each
 * page/form/budget is listed); 2 when the audit can't run (no Chrome, origin
 * unreachable, a Lighthouse runtimeError, bad arguments).
 *
 * Budgets are judged against a deploy preview or production. `astro preview`
 * serves no compression or _headers, so local results are only indicative.
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
// Lighthouse ships no `exports` map, so this deep import is stable per version
import { computeMedianRun } from "lighthouse/core/lib/median-run.js";
import { pages } from "../src/data/pages.js";

// Budgets from openspec page-performance / accessibility specs. `null` means
// no budget for that form factor. Scores are the 0-100 values Lighthouse shows.
const BUDGETS = {
  mobile: { perf: 95, a11y: 100, bp: 100, seo: 100, lcpMs: 2500, cls: 0.1 },
  desktop: { perf: null, a11y: 100, bp: 100, seo: 100, lcpMs: null, cls: 0.1 },
};

// Audit modes that never count as failures
const NON_FAILING_MODES = new Set(["notApplicable", "manual", "informative"]);

const USAGE =
  "Usage: node scripts/lighthouse.js <origin> [--runs N] [--form mobile|desktop] [--json-dir DIR]";

function setupError(message) {
  console.error(`lighthouse: ${message}`);
  process.exit(2);
}

// ---- Arguments ----

function parseArgs(argv) {
  const opts = { runs: 3, forms: ["mobile", "desktop"], jsonDir: null };
  let origin = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined) setupError(`${arg} needs a value\n${USAGE}`);
      return v;
    };
    if (arg === "--runs") {
      opts.runs = Number(value());
      if (!Number.isInteger(opts.runs) || opts.runs < 1) {
        setupError(`--runs must be a positive integer\n${USAGE}`);
      }
    } else if (arg === "--form") {
      const form = value();
      if (!(form in BUDGETS)) setupError(`unknown --form "${form}"\n${USAGE}`);
      opts.forms = [form];
    } else if (arg === "--json-dir") {
      opts.jsonDir = value();
    } else if (arg.startsWith("--")) {
      setupError(`unknown option ${arg}\n${USAGE}`);
    } else if (origin) {
      setupError(`unexpected argument ${arg}\n${USAGE}`);
    } else {
      origin = arg;
    }
  }
  if (!origin) setupError(USAGE);
  try {
    opts.origin = new URL(origin).origin;
  } catch {
    setupError(`"${origin}" is not a valid origin\n${USAGE}`);
  }
  return opts;
}

// ---- Report reading ----

const score = (lhr, id) => {
  const s = lhr.categories[id]?.score;
  return typeof s === "number" ? Math.round(s * 100) : null;
};
const numeric = (lhr, id) => lhr.audits[id]?.numericValue ?? null;

function failingA11yAudits(lhr) {
  return lhr.categories.accessibility.auditRefs
    .map((ref) => lhr.audits[ref.id])
    .filter(
      (a) =>
        a &&
        !NON_FAILING_MODES.has(a.scoreDisplayMode) &&
        a.score !== null &&
        a.score < 1,
    )
    .map((a) => a.id);
}

// Estimated bytes saved by serving right-sized images (Lighthouse 13 insight)
function imageSavingsKiB(lhr) {
  const audit = lhr.audits["image-delivery-insight"];
  if (!audit || audit.scoreDisplayMode === "notApplicable") return 0;
  const items = audit.details?.items ?? [];
  const bytes = items.reduce((sum, item) => sum + (item.wastedBytes ?? 0), 0);
  return bytes / 1024;
}

// LCP subparts (Lighthouse 13 insight), e.g. "TTFB 600 · load delay 20 ..."
function lcpBreakdown(lhr) {
  const items = lhr.audits["lcp-breakdown-insight"]?.details?.items ?? [];
  const table = items.find((item) => item.type === "table");
  if (!table) return null;
  return table.items
    .map((row) => `${row.label ?? row.subpart} ${Math.round(row.duration)} ms`)
    .join(" · ");
}

function summarize(path, form, lhr) {
  return {
    path,
    form,
    perf: score(lhr, "performance"),
    a11y: score(lhr, "accessibility"),
    bp: score(lhr, "best-practices"),
    seo: score(lhr, "seo"),
    lcpMs: numeric(lhr, "largest-contentful-paint"),
    tbtMs: numeric(lhr, "total-blocking-time"),
    cls: numeric(lhr, "cumulative-layout-shift"),
    imgKiB: imageSavingsKiB(lhr),
    a11yFailing: failingA11yAudits(lhr),
    lcpBreakdown: lcpBreakdown(lhr),
  };
}

// ---- Budgets ----

function budgetMisses(row) {
  const b = BUDGETS[row.form];
  const misses = [];
  for (const key of ["perf", "a11y", "bp", "seo"]) {
    if (b[key] !== null && (row[key] === null || row[key] < b[key])) {
      misses.push(`${key} ${row[key] ?? "n/a"} < ${b[key]}`);
    }
  }
  if (b.lcpMs !== null && !(row.lcpMs <= b.lcpMs)) {
    const detail = row.lcpBreakdown ? ` (${row.lcpBreakdown})` : "";
    misses.push(`LCP ${fmtSec(row.lcpMs)} > ${fmtSec(b.lcpMs)}${detail}`);
  }
  if (b.cls !== null && !(row.cls <= b.cls)) {
    misses.push(`CLS ${fmtCls(row.cls)} > ${b.cls}`);
  }
  if (b.a11y !== null && row.a11yFailing.length) {
    misses.push(`a11y audits failing: ${row.a11yFailing.join(", ")}`);
  }
  return misses;
}

// ---- Output ----

const fmtSec = (ms) => (ms === null ? "n/a" : `${(ms / 1000).toFixed(1)} s`);
const fmtMs = (ms) => (ms === null ? "n/a" : `${Math.round(ms)} ms`);
const fmtCls = (cls) => (cls === null ? "n/a" : cls.toFixed(3));

function printTable(rows, header) {
  const cols = [
    ["page", (r) => r.path],
    ["form", (r) => r.form],
    ["perf", (r) => String(r.perf ?? "n/a")],
    ["a11y", (r) => String(r.a11y ?? "n/a")],
    ["bp", (r) => String(r.bp ?? "n/a")],
    ["seo", (r) => String(r.seo ?? "n/a")],
    ["LCP", (r) => fmtSec(r.lcpMs)],
    ["TBT", (r) => fmtMs(r.tbtMs)],
    ["CLS", (r) => fmtCls(r.cls)],
    ["img savings", (r) => `${Math.round(r.imgKiB)} KiB`],
  ];
  const cells = rows.map((r) => cols.map(([, get]) => get(r)));
  const widths = cols.map(([name], i) =>
    Math.max(name.length, ...cells.map((c) => c[i].length)),
  );
  const line = (values) =>
    values
      .map((v, i) => (i < 2 ? v.padEnd(widths[i]) : v.padStart(widths[i])))
      .join("  ")
      .trimEnd();
  console.log(header);
  console.log(line(cols.map(([name]) => name)));
  for (const c of cells) console.log(line(c));
}

// ---- Main ----

const opts = parseArgs(process.argv.slice(2));

// Fail fast, with a clear reason, if the origin isn't reachable at all
try {
  await fetch(`${opts.origin}/`, {
    method: "HEAD",
    signal: AbortSignal.timeout(15000),
  });
} catch (err) {
  setupError(
    `origin ${opts.origin} is unreachable (${err.cause?.code ?? err.cause?.message ?? err.message})`,
  );
}

let chrome;
try {
  chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-first-run"],
  });
} catch (err) {
  setupError(`could not launch Chrome/Chromium (${err.code ?? err.message})`);
}

const rows = [];
let lighthouseVersion = "";
try {
  for (const { path } of pages) {
    for (const form of opts.forms) {
      const url = `${opts.origin}${path}`;
      const config = form === "desktop" ? desktopConfig : undefined;
      const runs = [];
      for (let i = 1; i <= opts.runs; i++) {
        console.error(`${path} ${form} run ${i}/${opts.runs}`);
        const result = await lighthouse(
          url,
          { port: chrome.port, output: "json", logLevel: "error" },
          config,
        );
        const lhr = result?.lhr;
        if (!lhr) throw new Error(`Lighthouse returned no report for ${url}`);
        if (lhr.runtimeError) {
          throw new Error(
            `${url} (${form}): ${lhr.runtimeError.code}: ${lhr.runtimeError.message}`,
          );
        }
        lighthouseVersion = lhr.lighthouseVersion;
        runs.push(lhr);
      }
      const median = computeMedianRun(runs);
      if (opts.jsonDir) {
        mkdirSync(opts.jsonDir, { recursive: true });
        const name = `${path.replace(/^\//, "").replace(/[/.]/g, "_") || "index"}-${form}.json`;
        writeFileSync(join(opts.jsonDir, name), JSON.stringify(median));
      }
      rows.push(summarize(path, form, median));
    }
  }
} catch (err) {
  await chrome.kill();
  setupError(err.message);
}
await chrome.kill();

printTable(
  rows,
  `Lighthouse ${lighthouseVersion} · ${opts.origin} · median of ${opts.runs} run(s)`,
);
if (opts.runs < 3) {
  console.error(
    `\nnote: fewer than 3 runs; budgets are judged on medians of 3 or more`,
  );
}

const failures = rows.flatMap((row) =>
  budgetMisses(row).map((miss) => `  ${row.path} ${row.form}: ${miss}`),
);
if (failures.length) {
  console.log(`\nBudget misses (${failures.length}):`);
  for (const f of failures) console.log(f);
  process.exit(1);
}
console.log("\nAll pages within budget.");
