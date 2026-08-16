// What the unit tests cannot see: the site running in a browser.
//
// The suite in tests/ covers the logic that survives without a DOM, and that
// leaves the whole of what a reader actually experiences uncovered — a page
// that paints blank, a module that throws on load and takes the tool with it,
// a stylesheet that 404s after a rename. None of that shows up in a build that
// exits 0, and twice already it reached the live site instead: the body left at
// `opacity: 0` that never let the FCP register, and the guide layout that was
// assembled in JavaScript and therefore was not there on the first paint.
//
// So these checks run against dist/ — not the dev server — because dist/ is
// what ships: minified HTML, hashed assets, the real _headers next to them.
// The script serves that directory itself the way Cloudflare Pages does
// (a directory means its index.html) and drives a real Chrome over it.
//
//   npm run test:smoke
//   CHROME_PATH=/usr/bin/chromium npm run test:smoke
//
// Needs `npm run build` first and a local Chrome. Exits non-zero on the first
// failing check so it can gate a deploy.

import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromePath, DIST, serveDist } from './lib/serve-dist.mjs';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// One page per kind of thing the site is made of: the two home pages (the
// language pair), a glossary (the app-shell with its own scrolling), a tool
// (canvas and workers), a guide (the longest page, table of contents included)
// and the components index.
const PAGES = [
  '/',
  '/it/',
  '/resources/css-glossary/',
  '/tools/palette-extractor/',
  '/tutorials/git-without-panic/',
  '/ui-components/',
];

// A counter only a real navigation can increment. Runs before anything of the
// page's own, on a context so fresh that document.documentElement is still null.
const PROBE = 'window.__navigations = (window.__navigations || 0) + 1;';

const results = [];
function record(name, detail) {
  results.push({ name, detail });
  const mark = detail ? `${RED}✗${RESET}` : `${GREEN}✓${RESET}`;
  console.log(`${mark} ${name}${detail ? ` ${DIM}(${detail})${RESET}` : ''}`);
}

if (!existsSync(DIST)) {
  console.error('dist/ is not there: run `npm run build` first.');
  process.exit(1);
}

const { server, base: BASE } = await serveDist();
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });

async function withPage(fn, options = {}) {
  const context = await browser.newContext(options);
  await context.addInitScript(PROBE);
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close();
  }
}

// 1-3. Every sampled page: it paints, it paints something, and nothing on it
// throws or 404s on the way.
for (const route of PAGES) {
  await withPage(async (page) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`throw: ${e.message.split('\n')[0]}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
    page.on('requestfailed', (r) => errors.push(`request: ${r.url().replace(BASE, '')}`));
    const response = await page.goto(BASE + route, { waitUntil: 'load' });
    if (response.status() !== 200) errors.push(`HTTP ${response.status()}`);

    // Not "is the body visible" but "did the browser record a contentful
    // paint": the way the opacity-0 body failed was by never producing one, and
    // that is the entry PageSpeed reads as NO_FCP. Reading the metric itself
    // means the check does not depend on catching the right instant.
    await page.waitForFunction(
      () => performance.getEntriesByType('paint').some((e) => e.name === 'first-contentful-paint'),
      null,
      { timeout: 5000 },
    ).catch(() => {});
    const paint = await page.evaluate(() => {
      const fcp = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint');
      const style = getComputedStyle(document.body);
      return { fcp: fcp ? Math.round(fcp.startTime) : null, opacity: style.opacity, visibility: style.visibility };
    });
    record(
      `${route} — paints something`,
      paint.fcp !== null && paint.opacity === '1' && paint.visibility !== 'hidden'
        ? null
        : `FCP ${paint.fcp === null ? 'never' : `${paint.fcp}ms`}, body opacity ${paint.opacity}, visibility ${paint.visibility}`,
    );

    const box = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      const main = document.querySelector('#main-content, main');
      const size = (el) => (el ? el.getBoundingClientRect() : null);
      const h = size(heading);
      const m = size(main);
      return {
        heading: h && h.width > 0 && h.height > 0,
        main: m && m.width > 0 && m.height > 0,
        text: (heading?.textContent || '').trim().length,
      };
    });
    record(
      `${route} — heading and main have a box`,
      box.heading && box.main && box.text > 0 ? null : `h1 ${box.heading}, main ${box.main}, ${box.text} chars`,
    );

    record(`${route} — loads clean`, errors.length ? errors.slice(0, 2).join(' · ') : null);
  });
}

// 4. The layout must come out of the markup and the CSS. With JavaScript off,
// the guide is the page that used to fall apart: its table of contents and its
// two columns were assembled at runtime, so the first paint had neither.
await withPage(async (page) => {
  await page.goto(`${BASE}/tutorials/git-without-panic/`, { waitUntil: 'load' });
  const laid = await page.evaluate(() => {
    const main = document.querySelector('#main-content, main');
    const heading = document.querySelector('h1');
    const paragraphs = Array.from(document.querySelectorAll('main p, #main-content p'))
      .filter((p) => p.getBoundingClientRect().height > 0);
    return {
      main: main ? main.getBoundingClientRect().height : 0,
      heading: heading ? heading.getBoundingClientRect().height : 0,
      paragraphs: paragraphs.length,
    };
  });
  record(
    'the guide lays out with JavaScript disabled',
    laid.main > 400 && laid.heading > 0 && laid.paragraphs > 3
      ? null
      : `main ${Math.round(laid.main)}px, h1 ${Math.round(laid.heading)}px, ${laid.paragraphs} paragraphs`,
  );
}, { javaScriptEnabled: false });

// 5. The lever swaps the page in place. A full navigation would also end up on
// the right URL, which is why the navigation counter is part of the assertion.
await withPage(async (page) => {
  await page.goto(`${BASE}/resources/`, { waitUntil: 'load' });
  await page.click('.lang-switch');
  await page.waitForFunction(() => document.documentElement.lang === 'it', null, { timeout: 5000 })
    .catch(() => {});
  const after = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    path: location.pathname,
    navigations: window.__navigations,
  }));
  record(
    'the language lever swaps in place',
    after.lang === 'it' && after.path === '/it/risorse/' && after.navigations === 1
      ? null
      : `lang ${after.lang}, path ${after.path}, ${after.navigations} navigation(s)`,
  );
});

// 6. The tool has to do its arithmetic in the browser, on an image, with no
// network anywhere in the path. Its own Demo button is the reproducible input.
await withPage(async (page) => {
  await page.goto(`${BASE}/tools/palette-extractor/`, { waitUntil: 'load' });
  await page.click('#demoBtn');
  await page.waitForFunction(
    () => document.querySelectorAll('#paletteGrid *').length > 0,
    null,
    { timeout: 15000 },
  ).catch(() => {});
  const out = await page.evaluate(() => ({
    swatches: document.querySelectorAll('#paletteGrid > *').length,
    roles: document.querySelectorAll('#rolesList > *').length,
    hex: /#[0-9a-f]{6}/i.test(document.querySelector('#paletteGrid')?.textContent || ''),
  }));
  record(
    'the palette extractor builds a palette from its demo',
    out.swatches > 0 && out.roles > 0 && out.hex
      ? null
      : `${out.swatches} swatch(es), ${out.roles} role(s), hex ${out.hex}`,
  );
});

// 7. The compressor shows an estimate that follows the controls, and only
// encodes when asked. Both halves have broken before: an earlier version
// re-encoded on every slider move (and kept serving the first WebP blob
// regardless of the format chosen), and the preset chips tracked the last
// button pressed rather than the values, so changing the format put the light
// out. What matters here is that the numbers move without the engine running,
// and that pressing the button is what turns an estimate into a file.
await withPage(async (page) => {
  await page.goto(`${BASE}/tools/image-compressor/`, { waitUntil: 'load' });
  const fixture = fileURLToPath(new URL('../public/og/opengraph-1200x630.jpg', import.meta.url));
  await page.setInputFiles('#fileInput', fixture);
  await page.waitForFunction(() =>
    document.querySelector('.savings-badge')?.textContent.includes('≈'), null, { timeout: 15000 }).catch(() => {});

  const details = () => page.locator('.compressed-size-text').textContent().catch(() => '');
  const action = () => page.locator('.row-action-btn span').textContent().catch(() => '');
  const filename = () => page.locator('.row-filename').textContent().catch(() => '');
  const litPresets = () => page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-preset]'))
      .filter((chip) => chip.classList.contains('is-active'))
      .map((chip) => chip.dataset.preset).join(','));

  // Nothing has been encoded yet: the row still carries the source file's name,
  // and the drop zone holds the image it was handed — without that the drop
  // leaves the box looking exactly as empty as before it.
  const idle = {
    estimate: await details(),
    action: await action(),
    name: await filename(),
    box: await page.evaluate(() => {
      const preview = document.getElementById('uploadPreview');
      const rect = preview?.getBoundingClientRect();
      return {
        shown: !document.getElementById('uploadAreaLoaded')?.hidden &&
          Boolean(document.getElementById('uploadAreaEmpty')?.hidden),
        drawn: Boolean(rect && rect.width > 0 && rect.height > 0 && preview.naturalWidth > 0),
        name: document.getElementById('uploadFilename')?.textContent || '',
      };
    }),
  };

  await page.selectOption('#outputFormat', 'jpeg');
  const asJpeg = await details();
  // The format is not part of any preset, so the chip must stay lit.
  const litAfterFormat = await litPresets();

  const presetEstimates = [];
  for (const [preset, quality, maxWidth] of [
    ['balanced', '72', '1600'],
    ['light', '82', '2200'],
    ['strong', '58', '1280'],
  ]) {
    await page.click(`[data-preset="${preset}"]`);
    presetEstimates.push(await page.evaluate(([expectedQuality, expectedWidth, expected]) => ({
      quality: document.querySelector('#quality')?.value === expectedQuality,
      width: document.querySelector('#maxWidth')?.value === expectedWidth,
      lit: Array.from(document.querySelectorAll('[data-preset]'))
        .filter((chip) => chip.classList.contains('is-active'))
        .map((chip) => chip.dataset.preset).join(',') === expected,
      details: document.querySelector('.compressed-size-text')?.textContent || '',
    }), [quality, maxWidth, preset]));
  }
  const presetsAgree = presetEstimates.every((p) => p.quality && p.width && p.lit && p.details.startsWith('JPG'));

  // Sizes for the three presets have to be ordered the way the presets promise.
  const sizeOf = (text) => {
    const match = text.match(/([\d.]+) (KB|MB)$/);
    return match ? Number.parseFloat(match[1]) * (match[2] === 'MB' ? 1024 : 1) : Number.NaN;
  };
  const [balanced, light, strong] = presetEstimates.map((p) => sizeOf(p.details));
  const presetsOrdered = [balanced, light, strong].every(Number.isFinite) &&
    strong < balanced && balanced < light;

  await page.locator('#maxWidth').evaluate((input) => {
    input.value = '640';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const resized = await details();

  // Only now does anything get encoded.
  await page.selectOption('#outputFormat', 'webp');
  await page.click('.row-action-btn');
  await page.waitForFunction(() =>
    document.querySelector('.row-action-btn')?.classList.contains('is-download'), null, { timeout: 30000 }).catch(() => {});
  const compressed = {
    estimate: await details(),
    action: await action(),
    name: await filename(),
    message: await page.locator('#result').textContent().catch(() => ''),
  };

  // And changing a control drops it back to an estimate rather than leaving a
  // stale file behind the Download button.
  await page.locator('#quality').evaluate((input) => {
    input.value = '50';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const afterChange = {
    estimate: await details(),
    action: await action(),
  };

  const problems = [];
  if (!idle.estimate.startsWith('WEBP') || !idle.estimate.includes('≈')) problems.push(`idle estimate "${idle.estimate}"`);
  if (idle.name !== 'opengraph-1200x630.jpg') problems.push(`encoded before being asked: "${idle.name}"`);
  if (!idle.box.shown || !idle.box.drawn || idle.box.name !== 'opengraph-1200x630.jpg') {
    problems.push(`drop zone after upload ${JSON.stringify(idle.box)}`);
  }
  if (!asJpeg.startsWith('JPG') || asJpeg === idle.estimate) problems.push(`jpeg estimate "${asJpeg}"`);
  if (litAfterFormat !== 'balanced') problems.push(`preset lit after format change: "${litAfterFormat}"`);
  if (!presetsAgree) problems.push(`presets ${JSON.stringify(presetEstimates)}`);
  if (!presetsOrdered) problems.push(`preset sizes ${strong}/${balanced}/${light}`);
  if (!resized.includes('640×336')) problems.push(`resized "${resized}"`);
  if (compressed.action === idle.action) problems.push(`button unchanged after compressing: "${compressed.action}"`);
  if (compressed.estimate.includes('≈')) problems.push(`still an estimate after compressing: "${compressed.estimate}"`);
  if (!compressed.name.endsWith('.webp') || compressed.name === idle.name) problems.push(`output name "${compressed.name}"`);
  if (!compressed.message.includes(compressed.name)) problems.push(`message "${compressed.message}"`);
  if (!afterChange.estimate.includes('≈') || afterChange.action !== idle.action) {
    problems.push(`after changing quality: "${afterChange.estimate}" / "${afterChange.action}"`);
  }

  record('the image compressor estimates first and encodes on request', problems.length ? problems.join(' · ') : null);
});

// 8. The colour generator, whose mechanics are all keyboard, selection and
// state: Space belongs to whatever is focused before it belongs to the tool,
// the contrast checker is pointed at swatches rather than at hex values, a
// shared link is user input, and the shades panel is the one place on the site
// where text is painted on colours the reader picked — all four have been
// wrong, and none of them is visible in a screenshot.
await withPage(async (page) => {
  const link = `${BASE}/tools/color-generator/?colors=264653-2A9D8F-E9C46A-F4A261-E76F51`;
  // The cards are built by a module imported after load, so every arrival here
  // waits for them rather than for the document.
  const openWithCards = async (url) => {
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.color-card .lock-btn', { timeout: 10000 });
  };
  await openWithCards(link);
  const hexes = () => page.$$eval('.color-card-hex', (els) => els.map((e) => e.textContent));
  const problems = [];

  // Space on a focused control belongs to that control.
  await page.focus('.color-card .lock-btn');
  const before = await hexes();
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  const locked = await page.$eval('.color-card .lock-btn', (b) => b.getAttribute('aria-pressed'));
  if (locked !== 'true') problems.push(`Space on a focused lock did not lock it (aria-pressed ${locked})`);
  if (JSON.stringify(await hexes()) !== JSON.stringify(before)) problems.push('Space on a focused lock also regenerated the palette');

  // Space with nothing focused still generates.
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  if (JSON.stringify(await hexes()) === JSON.stringify(before)) problems.push('Space did not generate a new palette');

  // The checker follows the swatches it was pointed at, across a generate.
  const checker = await page.evaluate(async () => {
    const bg = document.getElementById('contrast-bg-select');
    const text = document.getElementById('contrast-text-select');
    bg.selectedIndex = 2; bg.dispatchEvent(new Event('change', { bubbles: true }));
    text.selectedIndex = 4; text.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('btn-generate').click();
    await new Promise((r) => setTimeout(r, 100));
    return { bg: bg.selectedIndex, text: text.selectedIndex, bgValue: bg.value, swatch: document.querySelectorAll('.color-card-hex')[2].textContent };
  });
  if (checker.bg !== 2 || checker.text !== 4) problems.push(`the checker lost its pair on generate (${checker.bg}/${checker.text})`);
  if (checker.bgValue.toLowerCase() !== checker.swatch.toLowerCase()) {
    problems.push(`the checker points at ${checker.bgValue} while swatch 3 is ${checker.swatch}`);
  }

  // A malformed link is refused, and not written back out.
  await openWithCards(`${BASE}/tools/color-generator/?colors=zzzzzz-2A9D8F-E9C46A-F4A261-E76F51`);
  await page.waitForTimeout(150);
  const recovered = await page.evaluate(() => ({
    search: location.search,
    painted: getComputedStyle(document.querySelector('.color-card')).backgroundColor,
  }));
  if (/zzzzzz/i.test(recovered.search)) problems.push(`a broken link stayed in the address bar: ${recovered.search}`);
  if (recovered.painted === 'rgba(0, 0, 0, 0)') problems.push('a broken link left the first swatch unpainted');

  // Every shade the panel offers has to carry readable text: this is the tool
  // that explains contrast.
  await openWithCards(`${BASE}/tools/color-generator/?colors=0000FF-2A9D8F-E9C46A-F4A261-E76F51`);
  await page.evaluate(() => document.querySelector('.color-card .shades-btn').click());
  await page.waitForTimeout(250);
  const worstShade = await page.evaluate(() => {
    const lum = (r, g, b) => {
      const [R, G, B] = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const nums = (value) => value.match(/[\d.]+/g).map(Number);
    let worst = Infinity;
    for (const bar of document.querySelectorAll('.color-card .shade-bar')) {
      const style = getComputedStyle(bar);
      const [br, bg, bb] = nums(style.backgroundColor);
      const [fr, fg, fb] = nums(style.color);
      const [l1, l2] = [lum(br, bg, bb), lum(fr, fg, fb)];
      worst = Math.min(worst, (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
    }
    return worst;
  });
  if (!(worstShade >= 4.5)) problems.push(`a shade bar carries text at ${worstShade.toFixed(2)}:1`);

  record('the colour generator answers the keyboard, the link and the checker', problems.length ? problems.join(' · ') : null);
});

// 9. The glossary is a search box over a few hundred entries: if the filter
// stops filtering the page still looks perfectly fine.
await withPage(async (page) => {
  await page.goto(`${BASE}/resources/css-glossary/`, { waitUntil: 'load' });
  const visible = () => page.evaluate(() =>
    Array.from(document.querySelectorAll('.main-content details ol > li'))
      .filter((li) => li.getBoundingClientRect().height > 0).length);
  const before = await visible();
  await page.fill('#search', 'flex-direction');
  await page.waitForFunction(
    (n) => Array.from(document.querySelectorAll('.main-content details ol > li'))
      .filter((li) => li.getBoundingClientRect().height > 0).length < n,
    before,
    { timeout: 5000 },
  ).catch(() => {});
  const after = await visible();
  record(
    'the glossary search filters the entries',
    before > 20 && after > 0 && after < before ? null : `${before} entries before, ${after} after`,
  );
});

await browser.close();
server.close();

const failing = results.filter((r) => r.detail).length;
console.log(`\n${results.length} check(s) · ${failing} failing`);
process.exit(failing > 0 ? 1 : 0);
