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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// Words that are unambiguously Italian: none of them is an English word, a
// programming keyword, or a proper noun used on this site.
const ITALIAN_MARKERS = [
  'il', 'lo', 'gli', 'della', 'dello', 'degli', 'delle', 'dei', 'nel', 'nella',
  'sul', 'sulla', 'dal', 'dalla', 'agli', 'alle', 'allo', 'una', 'uno', 'che',
  'perché', 'perche', 'quando', 'come', 'anche', 'più', 'piu', 'molto', 'ogni',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'sono', 'essere',
  'avere', 'fare', 'puoi', 'devi', 'vuoi', 'trovi', 'serve', 'servono', 'senza',
  'sempre', 'ancora', 'quindi', 'però', 'pero', 'oppure', 'invece', 'mentre',
  'dove', 'tutti', 'tutte', 'tutto', 'tutta', 'niente', 'nulla', 'adesso',
  'prima', 'dopo', 'sopra', 'sotto', 'dentro', 'fuori', 'verso', 'tra', 'fra',
  'pagina', 'pagine', 'codice', 'esempio', 'esempi', 'guida', 'guide',
  'strumenti', 'risorse', 'sviluppo', 'progetto', 'progetti', 'lavoro',
  'capitolo', 'domanda', 'risposta', 'sezione', 'immagine', 'immagini',
  'colore', 'colori', 'testo', 'file', 'nome', 'passo', 'punto'
];

// `file`, `nome`, `punto` and friends are risky on their own; require them to
// sit next to another marker before reporting, by scoring the whole snippet.
const STRONG = new Set([
  'il', 'lo', 'gli', 'della', 'dello', 'degli', 'delle', 'dei', 'nel', 'nella',
  'perché', 'perche', 'questo', 'questa', 'questi', 'queste', 'quello', 'quella',
  'puoi', 'devi', 'vuoi', 'trovi', 'però', 'pero', 'oppure', 'invece', 'senza',
  'sono', 'anche', 'più', 'piu', 'quindi', 'mentre', 'sempre'
]);

const MARKER_SET = new Set(ITALIAN_MARKERS);

const fileForRoute = (route) =>
  path.join(pagesRoot, sourceDirForRoute(route), 'index.html');

const ATTR_REGEX = /\b(?:alt|title|aria-label|placeholder|content)\s*=\s*"([^"]{4,})"/gi;

function visibleSnippets(html) {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code\b[\s\S]*?<\/code>/gi, ' ');

  const snippets = [];

  for (const raw of stripped.split(/<[^>]+>/)) {
    const text = raw.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 3) snippets.push(text);
  }

  let m;
  while ((m = ATTR_REGEX.exec(stripped)) !== null) {
    const text = m[1].replace(/\s+/g, ' ').trim();
    // Skip machine-readable content: URLs, dimensions, locale codes.
    if (/^(https?:|\/|#|\d+$|[a-z]{2}_[A-Z]{2}$)/.test(text)) continue;
    if (text.includes(' ')) snippets.push(text);
  }

  return snippets;
}

function italianHits(snippet) {
  const words = snippet.toLowerCase().match(/[a-zàèéìòùA-Z]+/g) || [];
  const hits = words.filter((w) => MARKER_SET.has(w));
  const strong = hits.filter((w) => STRONG.has(w));
  return strong.length > 0 || hits.length >= 2 ? [...new Set(hits)] : [];
}

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
