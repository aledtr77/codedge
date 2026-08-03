// Flags Italian text left behind in the English pages.
//
// Only user-visible content is checked: rendered text plus the attributes that
// reach a reader or a crawler (title, alt, aria-label, placeholder, meta
// descriptions, OG/Twitter cards). HTML comments and code samples are skipped —
// developer notes stay in Italian by design, and a code block may legitimately
// contain Italian strings that the surrounding prose is explaining.
//
//   node scripts/i18n-lint.mjs               check every English page
//   node scripts/i18n-lint.mjs tutorials     check a subset

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { routePairs, sourceDirForRoute } from '../src/i18n/routes.mjs';
import { italianHits, visibleSnippets } from './lib/italian-markers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const fileForRoute = (route) =>
  path.join(pagesRoot, sourceDirForRoute(route), 'index.html');

const filter = process.argv.slice(2).find((a) => !a.startsWith('--'));
let totalFlagged = 0;
let checked = 0;

for (const [, enRoute] of routePairs()) {
  if (filter && !enRoute.includes(filter)) continue;

  const enFile = fileForRoute(enRoute);
  if (!fs.existsSync(enFile)) continue;
  checked += 1;

  const html = fs.readFileSync(enFile, 'utf8');
  const flagged = [];

  for (const snippet of visibleSnippets(html)) {
    const hits = italianHits(snippet);
    if (hits.length) flagged.push({ snippet, hits });
  }

  if (!flagged.length) {
    console.log(`${GREEN}✓${RESET} ${enRoute}`);
    continue;
  }

  totalFlagged += flagged.length;
  console.log(`${RED}✗${RESET} ${enRoute} ${DIM}(${flagged.length} snippet${flagged.length > 1 ? 's' : ''})${RESET}`);
  for (const { snippet, hits } of flagged.slice(0, 8)) {
    const preview = snippet.length > 110 ? `${snippet.slice(0, 110)}…` : snippet;
    console.log(`    ${preview}`);
    console.log(`      ${DIM}markers: ${hits.join(', ')}${RESET}`);
  }
  if (flagged.length > 8) console.log(`    ${DIM}… ${flagged.length - 8} more${RESET}`);
}

console.log(`\n${checked} page(s) checked · ${totalFlagged} snippet(s) flagged`);
process.exit(totalFlagged > 0 ? 1 : 0);
