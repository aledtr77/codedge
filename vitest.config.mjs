// Deliberately not an extension of vite.config.js.
//
// That file exists to produce dist/: it scans pages/, rewrites paths, minifies
// HTML, hashes inline scripts for the CSP. None of it has anything to say about
// whether rgbToHsl() is right, and pulling it in would make every test run pay
// for a build it does not use — and break the day a plugin starts reading
// something that only exists mid-build.
//
// The alias is the one thing shared with the build, and it is repeated here on
// purpose: the source imports `@/…`, so the tests have to resolve it the same
// way. If it changes in vite.config.js it has to change here too, and the test
// run says so loudly by failing to resolve.

import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    // Node, not jsdom: what is tested here is the logic that was deliberately
    // kept out of the DOM. A test that needs a real browser belongs in
    // scripts/i18n-swap.mjs, which drives Chrome for exactly that reason.
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
