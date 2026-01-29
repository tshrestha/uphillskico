import { defineConfig } from "vite";
import { resolve } from "path";
import purgecss from "vite-plugin-purgecss";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  plugins: [
    purgecss({
      content: [
        "./index.html",
        "./trailmaps.html",
        "./main.js",
        "./src/**/*.js",
      ],
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
    ViteImageOptimizer({
      // Optimize images in public folder
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      includePublic: true,
      logStats: true,
      // JPEG optimization
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      // PNG optimization
      png: {
        quality: 80,
      },
      // WebP conversion settings
      webp: {
        quality: 80,
        lossless: false,
      },
      // SVG optimization
      svg: {
        multipass: true,
        plugins: [
          "preset-default",
          {
            name: "removeViewBox",
            active: false,
          },
        ],
      },
    }),
  ],

  build: {
    // Generate source maps for debugging
    sourcemap: false,

    // Multi-page build configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        trailmaps: resolve(__dirname, "trailmaps.html"),
      },
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
