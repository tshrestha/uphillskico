// Page registry: the single list of public pages. Canonical tags and
// /sitemap.xml are both generated from it, so they can never disagree.
//
// `lastmod` is edited by hand when a page's content actually changes. It is
// deliberately not the build date: Google ignores lastmod values that change
// on every deploy.

export const SITE = "https://uphillskico.com";

export const pages = [
  { path: "/", lastmod: "2026-11-01", changefreq: "weekly", priority: "1.0" },
  {
    path: "/trailmaps.html",
    lastmod: "2026-01-29",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    path: "/trailmaps/aspen.html",
    lastmod: "2026-01-29",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    path: "/trailmaps/monarch.html",
    lastmod: "2026-01-29",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    path: "/trailmaps/cooper.html",
    lastmod: "2026-01-29",
    changefreq: "monthly",
    priority: "0.7",
  },
];

/**
 * Absolute canonical URL for a registered page path
 * @param {string} path - Public path, e.g. "/trailmaps.html"
 * @returns {string} e.g. "https://uphillskico.com/trailmaps.html"
 */
export function canonicalUrl(path) {
  if (!pages.some((p) => p.path === path)) {
    throw new Error(`Page "${path}" is not in src/data/pages.js`);
  }
  return `${SITE}${path}`;
}
