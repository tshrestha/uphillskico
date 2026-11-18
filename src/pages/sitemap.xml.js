// /sitemap.xml, generated from the page registry (src/data/pages.js), the
// same list that drives every page's canonical URL. Same URL and schema as
// the previous hand-written file, which robots.txt and Search Console use.
import { pages, SITE } from "../data/pages.js";

export function GET() {
  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${SITE}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
