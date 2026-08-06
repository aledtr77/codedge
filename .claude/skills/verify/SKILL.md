---
name: verify
description: How to build, run, and drive this Vite multi-page static site to verify changes end-to-end (dev server + headless Chrome via playwright-core).
---

# Verifying changes in this repo

Vite multi-page static site (no framework). Pages live in `pages/**/index.html`,
scripts in `src/scripts/`, styles in `src/styles/`. The user often has their own
`vite` dev server running — **never kill bare `vite` processes**; launch your own
on a dedicated port instead.

## Launch

```bash
node_modules/.bin/vite --port 5199 --strictPort   # run in background, own port
curl -s -o /dev/null -w "%{http_code}" http://localhost:5199/risorse/glossario-html/
```

Dev-server URLs mirror `pages/`: `pages/risorse/glossario-html/index.html` →
`/risorse/glossario-html/`.

## Drive (headless browser)

Playwright is not a project dep. Install `playwright-core` in the scratchpad
(`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install playwright-core`) and launch
the system Chrome:

```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
```

- Mobile emulation: context with `viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true`.
- The site's responsive breakpoint for the glossary app-shell is **1180px**
  (desktop >1180: inner panels scroll; mobile ≤1180: the document scrolls).

## Gotchas

- Smooth scrolling over long distances takes >1.5s in Chrome. Never assert
  scroll position after a fixed timeout — poll `window.scrollY` / container
  `scrollTop` until stable for ~20 frames before measuring.
- Scroll-position assertions must allow for clamping: if the target entry is
  the first/last element, the browser clamps at 0/max and the "ideal" offset
  is physically unreachable. Check `scrollTop >= maxScroll` / `scrollY === 0`
  before calling a delta a failure.
- The three glossaries (html/css/js) share `src/scripts/components/glossary.js`
  and `src/styles/components/glossary.css`; verifying one page covers the
  shared logic, but page structure differs slightly (e.g. breadcrumb presence).
