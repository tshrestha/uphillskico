import { defineConfig } from "vite";
import { resolve } from "path";
import { ViteMinifyPlugin } from "vite-plugin-minify";

export default defineConfig({
  plugins: [
    // HTML minification
    ViteMinifyPlugin({
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true,
    }),
  ],

  build: {
    // Minification settings
    minify: "esbuild", // Use esbuild for fast JS/CSS minification
    cssMinify: true, // Ensure CSS is minified

    // Generate source maps for debugging
    sourcemap: false,

    // Multi-page build configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        trailmaps: resolve(__dirname, "trailmaps.html"),
        aspen: resolve(__dirname, "trailmaps/aspen.html"),
        monarch: resolve(__dirname, "trailmaps/monarch.html"),
        cooper: resolve(__dirname, "trailmaps/cooper.html"),
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
