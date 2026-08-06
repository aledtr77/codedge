// The accessibility the README claims, measured on every page that ships.
//
// "Components ship with their ARIA attributes and keyboard focus handling
// written in, not bolted on afterwards" is the sentence on the front of this
// repo, and until 6 August 2026 nothing had ever checked it. The first run
// found four things: the search box on all three glossaries had a placeholder
// and no label, the image compressor had three unnamed inputs, seven active
// elements across the three tool pages painted white on a background that only
// reaches 3.66:1, and the quiz component emitted an h4 straight under an h2 on
// all twelve guides at once.
//
// None of that is exotic. All of it is the kind of thing that gets written once
// and then survives every visual review, because it looks perfectly fine.
//
//   npm run test:a11y            every route in the map
//   npm run test:a11y glossary   only the routes whose path matches
//
// This is not a full WCAG audit and does not pretend to be one — it is the
// subset a machine can decide on its own, which is exactly the subset a human
// stops noticing. Needs `npm run build` first and a local Chrome.

import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { ROUTE_MAP } from '../src/i18n/routes.mjs';
import { chromePath, DIST, serveDist } from './lib/serve-dist.mjs';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// The colour generator opens on a random palette, so an unpinned run reports a
// different page every time — it flagged the mockup on one load and passed on
// the next, which is a check nobody can act on. Pinning it is what i18n-swap
// already does for the same page for the same reason. That the tool's chosen
// text clears 4.5:1 on *any* colour is a separate claim, and it is checked
// where it belongs: readableTextColor, in the contract fixture.
const PINNED = {
  '/it/strumenti/generatore-colori/': '?colors=E74C3C-2980B9-2ECC71-F1C40F-8E44AD',
  '/tools/color-generator/': '?colors=E74C3C-2980B9-2ECC71-F1C40F-8E44AD',
};

const filter = process.argv[2];
const routes = [...Object.values(ROUTE_MAP), ...Object.keys(ROUTE_MAP)]
  .filter((r) => !filter || r.includes(filter))
  .sort();

// Runs in the page, after everything the page builds at runtime: the quiz
// heading and the breadcrumb only exist by then, and both have been wrong.
const AUDIT = () => {
  const report = {
    imagesNoAlt: [], controlsNoName: [], inputsNoLabel: [], headingSkips: [],
    duplicateIds: [], main: 0, h1: 0, langMissing: false, contrast: [],
  };

  const accessibleName = (el) => (
    el.getAttribute('aria-label') ||
    (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) ||
    el.textContent.trim() ||
    el.getAttribute('title') ||
    el.querySelector('img')?.getAttribute('alt') || ''
  ).trim();

  for (const img of document.querySelectorAll('img')) {
    // alt="" is a decision (decorative); a missing alt is an omission.
    if (img.getAttribute('alt') === null) report.imagesNoAlt.push(img.getAttribute('src') || '(no src)');
  }

  for (const el of document.querySelectorAll('a[href], button')) {
    if (el.getAttribute('aria-hidden') === 'true') continue;
    if (!accessibleName(el)) report.controlsNoName.push(el.outerHTML.slice(0, 100));
  }

  for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
    const labelled = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
      el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    // A placeholder is not a name: it disappears the moment anything is typed.
    if (!labelled) report.inputsNoLabel.push(el.outerHTML.slice(0, 100));
  }

  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  for (let i = 1; i < headings.length; i++) {
    const from = +headings[i - 1].tagName[1];
    const to = +headings[i].tagName[1];
    if (to - from > 1) report.headingSkips.push(`h${from} → h${to} at "${headings[i].textContent.trim().slice(0, 40)}"`);
  }

  const seen = new Set();
  for (const el of document.querySelectorAll('[id]')) {
    if (seen.has(el.id)) report.duplicateIds.push(el.id); else seen.add(el.id);
  }

  report.main = document.querySelectorAll('main, [role=main]').length;
  report.h1 = document.querySelectorAll('h1').length;
  report.langMissing = !document.documentElement.getAttribute('lang');

  // Contrast, against the background actually painted behind the text rather
  // than the one declared on the element, which is usually transparent.
  const luminance = ({ r, g, b }) => {
    const [R, G, B] = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const parse = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a] = m[1].split(',').map((n) => parseFloat(n));
    return { r, g, b, a: a === undefined ? 1 : a };
  };
  const backgroundBehind = (el) => {
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      const colour = parse(getComputedStyle(node).backgroundColor);
      if (colour && colour.a > 0.5) return colour;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255 };
  };

  const candidates = document.querySelectorAll('p,li,a,span,h1,h2,h3,h4,h5,h6,button,label,td,th,summary,code,strong,em');
  for (const el of candidates) {
    // The colour generator's contrast preview paints whatever pair the reader
    // picked, failing ones included — that is the whole widget. It carries
    // data-contrast-demo so the exemption is visible in the markup rather than
    // buried in a list of selectors here. Nothing else is exempt: a swatch and
    // a mockup are the tool's own choices and are checked like any other text.
    if (el.closest('[data-contrast-demo]')) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (own.length < 3) continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.opacity === '0') continue;

    const rawFg = parse(style.color);
    const bg = backgroundBehind(el);
    if (!rawFg || !bg) continue;
    // Composited, not raw. Text at rgba(239,68,68,0.8) on a dark panel is
    // darker than the same red at full opacity, and reading the channels
    // straight off reports a ratio the reader never gets — flatteringly, which
    // is the wrong direction for a check to be wrong in.
    const fg = rawFg.a >= 1 ? rawFg : {
      r: rawFg.r * rawFg.a + bg.r * (1 - rawFg.a),
      g: rawFg.g * rawFg.a + bg.g * (1 - rawFg.a),
      b: rawFg.b * rawFg.a + bg.b * (1 - rawFg.a),
    };
    const [l1, l2] = [luminance(fg), luminance(bg)];
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
    const needed = large ? 3 : 4.5;
    if (ratio < needed) {
      report.contrast.push(`<${el.tagName.toLowerCase()}> "${own.slice(0, 32)}" ${ratio.toFixed(2)}:1, needs ${needed} (${size}px ${style.color})`);
    }
  }

  return report;
};

if (!existsSync(DIST)) {
  console.error('dist/ is not there: run `npm run build` first.');
  process.exit(1);
}

const { server, base } = await serveDist();
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
let failing = 0;

for (const route of routes) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + route + (PINNED[route] || ''), { waitUntil: 'load' });
  // The quiz and the breadcrumb are built after load; both have been wrong.
  await page.waitForTimeout(400);
  // Then stop every transition and settle. getComputedStyle hands back the
  // interpolated value while one is running, and the mockup badge fades its
  // colour over 250ms: sampling mid-fade reported greys nobody ever sees and
  // made this check fail on three runs out of four for no reason at all. A
  // check that flaps is worse than no check.
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.waitForTimeout(120);
  const r = await page.evaluate(AUDIT);

  const problems = [];
  if (r.imagesNoAlt.length) problems.push([`${r.imagesNoAlt.length} image(s) with no alt`, r.imagesNoAlt]);
  if (r.controlsNoName.length) problems.push([`${r.controlsNoName.length} control(s) with no accessible name`, r.controlsNoName]);
  if (r.inputsNoLabel.length) problems.push([`${r.inputsNoLabel.length} field(s) with no label`, r.inputsNoLabel]);
  if (r.headingSkips.length) problems.push([`${r.headingSkips.length} heading level skip(s)`, r.headingSkips]);
  if (r.duplicateIds.length) problems.push([`duplicate id(s): ${[...new Set(r.duplicateIds)].join(', ')}`, []]);
  if (r.main !== 1) problems.push([`${r.main} <main> landmark(s), expected 1`, []]);
  if (r.h1 !== 1) problems.push([`${r.h1} <h1>, expected 1`, []]);
  if (r.langMissing) problems.push(['no lang on <html>', []]);
  if (r.contrast.length) problems.push([`${r.contrast.length} contrast failure(s)`, r.contrast]);

  if (problems.length) {
    failing++;
    console.log(`${RED}✗${RESET} ${route}`);
    for (const [headline, details] of problems) {
      console.log(`    ${headline}`);
      for (const detail of details.slice(0, 3)) console.log(`      ${DIM}${detail}${RESET}`);
      if (details.length > 3) console.log(`      ${DIM}… ${details.length - 3} more${RESET}`);
    }
  } else {
    console.log(`${GREEN}✓${RESET} ${route}`);
  }
  await context.close();
}

await browser.close();
server.close();

console.log(`\n${routes.length} page(s) checked · ${failing} failing`);
process.exit(failing > 0 ? 1 : 0);
