import { defineConfig } from "vite";
import purgecss from "vite-plugin-purgecss";

export default defineConfig({
  plugins: [
    purgecss({
      content: ["./index.html", "./main.js"],
      // Safelist Bootstrap classes that might be dynamically generated
      safelist: {
        standard: [
          // Theme-related
          /^data-theme/,
          // Table classes used in JS
          "table",
          "table-striped",
          "table-hover",
          "table-dark",
          "table-responsive",
          "align-middle",
          "sticky-col",
          // Button classes used in JS
          "btn",
          "btn-sm",
          "btn-outline-primary",
          "btn-outline-secondary",
          // Typography/utilities used in JS
          "fw-semibold",
          "small",
          "text-muted",
          "text-center",
          "text-decoration-none",
          // Badge class
          "badge",
          // Image class
          "img-fluid",
        ],
      },
    }),
  ],

  build: {
    // Generate source maps for debugging
    sourcemap: false,

    // Asset file naming with hash for cache busting
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },

    // Target modern browsers for smaller bundle
    target: "es2024",

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Development server settings
  server: {
    open: true,
    cors: true,
  },

  // Preview server settings
  preview: {
    open: true,
  },

  // JSON handling
  json: {
    stringify: true, // Smaller bundle for JSON imports
  },
});
