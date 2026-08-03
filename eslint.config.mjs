// Three kinds of JavaScript live in this repo and they do not share globals:
// the site's own scripts run in a browser, the build and i18n scripts run in
// Node, and i18n-swap.mjs is a Node script that carries browser code inside
// page.evaluate(). Telling them apart is the whole job of this file — a single
// flat config would report `document` as undefined in one place and let a real
// typo through in another.

import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**'] },

  // The site: everything under src/scripts ships to the browser.
  {
    files: ['src/scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: js.configs.recommended.rules,
  },

  // Build, i18n and SEO tooling: Node, ES modules.
  {
    files: ['scripts/**/*.mjs', 'vite.config.js', 'src/i18n/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },

  // The swap check drives a real Chrome: the callbacks it hands to
  // page.evaluate() are executed in the page, so they legitimately reach for
  // document, location and NodeFilter from inside a Node file.
  {
    files: ['scripts/i18n-swap.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
