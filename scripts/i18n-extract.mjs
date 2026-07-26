// Pulls the translatable units out of a page and applies translations back.
//
//   node scripts/i18n-extract.mjs <en-route-fragment>            list units as JSON
//   node scripts/i18n-extract.mjs <en-route-fragment> --apply f  apply a {id: text} map
//
// A "unit" is the inner HTML of a leaf content element (p, li, h2, dd, td, …)
// plus the translatable attributes (alt, title, aria-label, meta content).
// Inline markup stays inside the unit, so <code> and <strong> survive the round
// trip and the translator only ever sees prose.
//
// Applying is exact-match on the extracted string: if the page changed since
// extraction, the unit is reported as skipped instead of being half-written.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { routePairs, sourceDirForRoute } from '../src/i18n/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');

// Elements we capture as a unit. Inline markup inside them (a, strong, code…)
// travels with the text; only a nested block child disqualifies a candidate,
// otherwise a whole section would be swallowed as a single unit.
const LEAF_TAGS = 'p|li|h1|h2|h3|h4|h5|h6|dt|dd|td|th|figcaption|summary|button|label|option|strong';
const BLOCK_CHILDREN = 'p|li|h1|h2|h3|h4|h5|h6|dt|dd|td|th|figcaption|div|section|article|aside|ul|ol|dl|table|pre|form|nav|figure';
const ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'content', 'aria-labelledby'];

const args = process.argv.slice(2);
const fragment = args.find((a) => !a.startsWith('--'));
const applyIdx = args.indexOf('--apply');
const applyFile = applyIdx >= 0 ? args[applyIdx + 1] : null;

if (!fragment) {
  console.error('usage: i18n-extract.mjs <en-route-fragment> [--apply file.json]');
  process.exit(2);
}

const enRoute = routePairs().map(([, en]) => en).find((r) => r.includes(fragment));
if (!enRoute) {
  console.error(`no English route matching "${fragment}"`);
  process.exit(2);
}
const file = path.join(pagesRoot, sourceDirForRoute(enRoute), 'index.html');
const html = fs.readFileSync(file, 'utf8');

// Only strings that actually contain words worth translating.
const isProse = (value) => {
  const text = value.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
  if (text.length < 2) return false;
  if (/^[\d\s.,:%°/+-]*$/.test(text)) return false;
  return /[A-Za-zÀ-ÿ]{2}/.test(text);
};

function collect(source) {
  const units = new Map();

  // Leaf elements: only those with no nested block-level child, so we never
  // capture a whole section as one unit.
  const leafRegex = new RegExp(`<(${LEAF_TAGS})\\b([^>]*)>([\\s\\S]*?)</\\1>`, 'gi');
  let m;
  while ((m = leafRegex.exec(source)) !== null) {
    const inner = m[3];
    if (new RegExp(`<(?:${BLOCK_CHILDREN})\\b`, 'i').test(inner)) continue;
    if (!isProse(inner)) continue;
    const key = inner.trim();
    if (!units.has(key)) units.set(key, { kind: m[1].toLowerCase(), count: 0 });
    units.get(key).count += 1;
  }

  const attrRegex = new RegExp(`\\b(${ATTRS.join('|')})\\s*=\\s*"([^"]*)"`, 'gi');
  while ((m = attrRegex.exec(source)) !== null) {
    const value = m[2].trim();
    if (!isProse(value)) continue;
    if (/^(https?:|\/|#|[a-z]{2}_[A-Z]{2}$)/.test(value)) continue;
    if (!/\s/.test(value) && !/[A-Za-zÀ-ÿ]{4}/.test(value)) continue;
    if (!units.has(value)) units.set(value, { kind: `@${m[1].toLowerCase()}`, count: 0 });
    units.get(value).count += 1;
  }

  return units;
}

if (!applyFile) {
  const units = collect(html);
  const out = [];
  let i = 0;
  for (const [text, meta] of units) {
    out.push({ id: i++, kind: meta.kind, n: meta.count, text });
  }
  // Write and let the process end on its own: process.exit() here would
  // truncate stdout when it is a pipe and the payload is large.
  process.stdout.write(
    JSON.stringify({ route: enRoute, file: path.relative(projectRoot, file), units: out }, null, 1) + '\n'
  );
} else {

// --- apply -----------------------------------------------------------------
const payload = JSON.parse(fs.readFileSync(applyFile, 'utf8'));
const units = [...collect(html).keys()];

let updated = html;
let applied = 0;
const skipped = [];

// Longest first so a short string that is a substring of a longer one cannot
// corrupt it.
const entries = Object.entries(payload)
  .map(([id, translation]) => [units[Number(id)], translation])
  .filter(([source]) => source !== undefined)
  .sort((a, b) => b[0].length - a[0].length);

for (const [source, translation] of entries) {
  if (source === translation) { applied += 1; continue; }
  if (!updated.includes(source)) { skipped.push(source.slice(0, 60)); continue; }
  updated = updated.split(source).join(translation);
  applied += 1;
}

fs.writeFileSync(file, updated, 'utf8');
console.log(`applied ${applied}/${entries.length} unit(s) to ${path.relative(projectRoot, file)}`);
if (skipped.length) {
  console.log(`skipped ${skipped.length} (not found verbatim):`);
  for (const s of skipped.slice(0, 10)) console.log(`  ${s}`);
}
}
