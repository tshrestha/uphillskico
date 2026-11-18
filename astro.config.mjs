// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Canonical and absolute URLs are built from this origin
  site: "https://uphillskico.com",

  // Keep every public URL unchanged: pages build to `name.html`
  // (/trailmaps.html, /trailmaps/aspen.html), matching the pre-Astro site and
  // Netlify's serving, so no redirects are needed.
  build: {
    format: "file",
  },
  trailingSlash: "never",

  // Lossless whitespace removal (replaces vite-plugin-minify)
  compressHTML: true,

  vite: {
    build: {
      // Target modern browsers for a smaller bundle
      target: "es2025",
      // Never inline processed <script>s (or other assets) into the HTML:
      // the CSP header (`script-src 'self'`) would block inline scripts.
      // scripts/check-inline-scripts.js enforces this after every build.
      assetsInlineLimit: 0,
    },
    json: {
      stringify: true, // Smaller bundle for JSON imports
    },
  },
});
