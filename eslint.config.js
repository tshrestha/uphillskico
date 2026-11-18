import js from "@eslint/js";
import astro from "eslint-plugin-astro";

export default [
  js.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        HTMLElement: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        ResizeObserver: "readonly",
        IntersectionObserver: "readonly",
        CustomEvent: "readonly",
        Image: "readonly",
        performance: "readonly",
        Response: "readonly",
        // Node.js globals (for build scripts)
        process: "readonly",
      },
    },
    rules: {
      // Error prevention
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],

      // Best practices
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",

      // Code style (let Prettier handle most formatting)
      "no-multiple-empty-lines": ["error", { max: 2 }],
      "no-trailing-spaces": "error",
    },
  },
  {
    // Node.js scripts configuration
    files: ["scripts/**/*.js", "astro.config.mjs", "eslint.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        fetch: "readonly",
      },
    },
  },
  {
    // Ignore patterns
    ignores: [
      "dist/**",
      "node_modules/**",
      ".astro/**",
      ".baseline/**",
      "*.min.js",
    ],
  },
];
