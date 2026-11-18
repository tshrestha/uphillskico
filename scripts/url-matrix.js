/**
 * URL matrix: records the status code and Location header for every URL
 * variant the site answers on, so a deploy can be compared with production.
 *
 * Usage: node scripts/url-matrix.js <origin> [--no-host-variants]
 *   e.g. node scripts/url-matrix.js https://uphillskico.com > .baseline/url-matrix.txt
 *
 * Locations on the same origin are printed relative to it, so the output of a
 * deploy preview can be diffed directly against production.
 * `--no-host-variants` skips the www. and http:// rows (useful on preview
 * hosts that have no www. record).
 */

const PATHS = [
  "/",
  "/index.html",
  "/index",
  "/trailmaps",
  "/trailmaps/",
  "/trailmaps.html",
  "/trailmaps/aspen",
  "/trailmaps/aspen/",
  "/trailmaps/aspen.html",
  "/sitemap.xml",
  "/og-image.png",
];

const args = process.argv.slice(2);
const originArg = args.find((a) => !a.startsWith("--"));
if (!originArg) {
  console.error(
    "Usage: node scripts/url-matrix.js <origin> [--no-host-variants]",
  );
  process.exit(2);
}
const origin = new URL(originArg).origin;
const { host } = new URL(origin);

const rows = PATHS.map((path) => [path, `${origin}${path}`]);
if (!args.includes("--no-host-variants")) {
  rows.push(["www.", `https://www.${host}/`]);
  rows.push(["http://", `http://${host}/`]);
}

function relative(location) {
  if (!location) return "-";
  return location.startsWith(origin)
    ? location.slice(origin.length) || "/"
    : location;
}

for (const [label, url] of rows) {
  let line;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    line = `${label}\t${res.status}\t${relative(res.headers.get("location"))}`;
  } catch (err) {
    line = `${label}\tERR\t${err.cause?.code ?? err.message}`;
  }
  console.log(line);
}
