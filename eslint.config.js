import js from "@eslint/js";

export default [
  js.configs.recommended,
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
    files: ["scripts/**/*.js", "vite.config.js", "eslint.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
  {
    // Ignore patterns
    ignores: ["dist/**", "node_modules/**", "*.min.js"],
  },
];
