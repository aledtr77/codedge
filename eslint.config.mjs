// Three kinds of JavaScript live in this repo and they do not share globals:
// the site's own scripts run in a browser, the build and i18n scripts run in
// Node, and i18n-swap.mjs and smoke.mjs are Node scripts that carry browser
// code inside page.evaluate(). Telling them apart is the whole job of this
// file — a single flat config would report `document` as undefined in one
// place and let a real typo through in another.

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
    files: ['scripts/**/*.mjs', 'vite.config.js', 'vitest.config.mjs', 'src/i18n/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },

  // The tests run in Node under Vitest, and import both sides: browser modules
  // from src/scripts and build tooling from scripts/. No globals are declared
  // for the test API — describe/it/expect are imported explicitly, so a typo
  // in one of them is an undefined variable here rather than a runtime error.
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },

  // The two checks that drive a real Chrome: the callbacks they hand to
  // page.evaluate() are executed in the page, so they legitimately reach for
  // document, location and NodeFilter from inside a Node file.
  {
    files: ['scripts/i18n-swap.mjs', 'scripts/smoke.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
