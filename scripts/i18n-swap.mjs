// Checks that the in-place language switch really produces the other page.
//
// i18n-lint reads the files and i18n-drift compares their structure, but both
// are blind to the one thing a reader actually experiences: clicking the lever
// and getting a page that is still half in the old language. That failure lives
// entirely in the DOM walk in lang-switch.js, so the only way to catch it is to
// click the lever in a real browser.
//
// The check is a comparison, not a guess. For every pair we load one side,
// click the switch, and read back every piece of visible text with the position
// it occupies; then we load the other side directly and read the same. Position
// by position, the two must agree. Anything the walk failed to translate shows
// up as a slot holding the old language — no Italian-word heuristic involved,
// so it catches missed breadcrumbs, stale tooltips and half-translated
// sentences alike, and names the element each one sits in.
//
//   node scripts/i18n-swap.mjs                      every pair, both directions
//   node scripts/i18n-swap.mjs snippet              only matching routes
//   BASE=http://localhost:5199 node scripts/i18n-swap.mjs
//
// Needs a dev server (`npm run dev -- --port 5199`) and a local Chrome.

import { chromium } from 'playwright-core';
import { routePairs } from '../src/i18n/routes.mjs';

const BASE = process.env.BASE || 'http://localhost:5199';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
// How many differing slots to print per direction; raise it while debugging.
const SHOW = Number(process.env.SHOW) || 8;

// Pages that would otherwise never read the same way twice. The colour
// generator opens on a random palette unless the URL pins one — pin it, so a
// difference can only mean a translation the swap missed. The switch carries
// the query across, so both sides of a pair stay pinned to the same palette.
const PINNED = {
  '/strumenti/generatore-colori/': '?colors=E74C3C-2980B9-2ECC71-F1C40F-8E44AD',
  '/en/tools/color-generator/': '?colors=E74C3C-2980B9-2ECC71-F1C40F-8E44AD'
};

const urlFor = (route) => BASE + route + (PINNED[route] || '');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// Runs in the page. Every string a reader can see, each paired with the slot it
// occupies. Positions rather than a bag of words: it is the only way to tell
// "this sentence stayed Italian" from "this page says something else here", and
// it survives pages whose content is randomised.
function readVisibleSlots() {
  const pathOf = (el) => {
    const parts = [];
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const parent = node.parentElement;
      const index = parent ? Array.prototype.indexOf.call(parent.children, node) : 0;
      parts.push(`${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}:${index}`);
    }
    return parts.reverse().join('>');
  };

  const slots = [];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest('script, style, template, noscript')) continue;
    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const index = Array.prototype.indexOf.call(parent.childNodes, node);
    slots.push([`${pathOf(parent)}/text:${index}`, text]);
  }

  for (const el of document.body.querySelectorAll('[alt], [title], [aria-label], [placeholder]')) {
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
      const value = el.getAttribute(attr);
      if (value && value.trim()) slots.push([`${pathOf(el)}/@${attr}`, value.trim()]);
    }
  }

  slots.push(['<title>', document.title]);
  return slots;
}

/** Slots where `a` and `b` disagree, including slots only one of them has. */
function compare(a, b) {
  const bySlot = new Map(b);
  const seen = new Set();
  const out = [];

  for (const [slot, text] of a) {
    seen.add(slot);
    const other = bySlot.get(slot);
    if (other !== text) out.push({ slot, mine: text, theirs: other ?? null });
  }
  for (const [slot, text] of b) {
    if (!seen.has(slot)) out.push({ slot, mine: null, theirs: text });
  }

  return out;
}

/**
 * Drops differences that are only a reordering.
 *
 * The quiz shuffles its answers on every render, so the same options come back
 * in a different order and every slot under the list disagrees. Walking up the
 * ancestors, a shuffle is the level at which both readings hold exactly the
 * same strings — a sentence that stayed in the old language never reaches such
 * a level, because the string it should have become is nowhere in its subtree.
 */
function withoutReorderings(differences, a, b) {
  if (!differences.length) return differences;

  const textsUnder = (slots, prefix) =>
    slots.filter(([slot]) => slot.startsWith(prefix)).map(([, text]) => text).sort();

  const settled = new Map();
  const isReorder = (slot) => {
    const segments = slot.split('>');
    for (let depth = segments.length - 1; depth >= 1; depth -= 1) {
      const prefix = `${segments.slice(0, depth).join('>')}>`;
      if (!settled.has(prefix)) {
        const mine = textsUnder(a, prefix);
        const theirs = textsUnder(b, prefix);
        settled.set(prefix, mine.length === theirs.length && mine.every((text, i) => text === theirs[i]));
      }
      if (settled.get(prefix)) return true;
    }
    return false;
  };

  return differences.filter((d) => !isReorder(d.slot));
}

async function textAfterSwap(page, from) {
  await page.goto(urlFor(from), { waitUntil: 'networkidle' });
  const before = await page.getAttribute('html', 'lang');
  await page.click('a.lang-switch');
  // The swap is a fetch away; <html lang> flips just before it hands over to
  // the components that re-localise themselves.
  await page.waitForFunction((was) => document.documentElement.lang !== was, before, { timeout: 5000 });
  await page.waitForTimeout(300);
  return page.evaluate(readVisibleSlots);
}

async function textOnLoad(page, route) {
  await page.goto(urlFor(route), { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  return page.evaluate(readVisibleSlots);
}

const filter = process.argv.slice(2).find((a) => !a.startsWith('--'));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let failures = 0;
let checked = 0;

for (const [itRoute, enRoute] of routePairs()) {
  if (filter && !itRoute.includes(filter) && !enRoute.includes(filter)) continue;

  for (const [from, to] of [[itRoute, enRoute], [enRoute, itRoute]]) {
    checked += 1;
    const label = `${from} → ${to}`;

    let differences;
    try {
      const swapped = await textAfterSwap(page, from);
      const real = await textOnLoad(page, to);
      differences = withoutReorderings(compare(swapped, real), swapped, real);

      // Safety net for anything else that does not render the same way twice:
      // load the target once more and let the page itself say which of its
      // slots are unstable. Those cannot tell us anything about the swap.
      if (differences.length) {
        const again = await textOnLoad(page, to);
        const unstable = new Set(
          withoutReorderings(compare(real, again), real, again).map((d) => d.slot)
        );
        if (unstable.size) differences = differences.filter((d) => !unstable.has(d.slot));
      }
    } catch (error) {
      failures += 1;
      console.log(`${RED}✗${RESET} ${label} ${DIM}(${error.message.split('\n')[0]})${RESET}`);
      continue;
    }

    if (!differences.length) {
      console.log(`${GREEN}✓${RESET} ${label}`);
      continue;
    }

    failures += 1;
    const clip = (text) => (text === null ? '—' : text.length > 88 ? `${text.slice(0, 88)}…` : text);
    console.log(`${RED}✗${RESET} ${label} ${DIM}(${differences.length} slot${differences.length > 1 ? 's' : ''})${RESET}`);
    for (const { slot, mine, theirs } of differences.slice(0, SHOW)) {
      console.log(`    ${DIM}${slot.length > 96 ? `…${slot.slice(-96)}` : slot}${RESET}`);
      console.log(`      after swap  ${RED}${clip(mine)}${RESET}`);
      console.log(`      on the page ${clip(theirs)}`);
    }
    if (differences.length > SHOW) console.log(`    ${DIM}… ${differences.length - SHOW} more${RESET}`);
  }
}

await browser.close();

console.log(`\n${checked} swap(s) checked · ${failures} failing`);
process.exit(failures > 0 ? 1 : 0);
