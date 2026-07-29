// Pings IndexNow (Bing & friends) with new or changed URLs.
//
// Usage:
//   node scripts/indexnow-ping.mjs --all              every sitemap URL
//   node scripts/indexnow-ping.mjs /tutorials/x/ ...  specific routes
//   node scripts/indexnow-ping.mjs pages/en/tools/index.html ...  changed files
//   ... --dry-run                                     print payload, no send
//
// The key is the one hosted at public/<key>.txt: public by design, the
// endpoint verifies ownership by downloading that very file.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { routeFromSourceDir } from '../src/i18n/routes.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(projectRoot, 'public');
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function readBaseUrl() {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  return String(pkg.homepage || 'https://codedge.it/').replace(/\/+$/, '');
}

// The key file in public/: a .txt whose hex content matches its own
// basename.
function findKey() {
  for (const name of fs.readdirSync(publicRoot)) {
    if (!/^[0-9a-f]{16,64}\.txt$/i.test(name)) continue;
    const content = fs.readFileSync(path.join(publicRoot, name), 'utf8').trim();
    if (content === path.basename(name, '.txt')) return content;
  }
  return '';
}

function sitemapUrls() {
  const xml = fs.readFileSync(path.join(publicRoot, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const baseUrl = readBaseUrl();
const host = new URL(baseUrl).host;
const key = findKey();
if (!key) {
  console.error('IndexNow: nessun file chiave trovato in public/ (atteso <chiave>.txt con la chiave come contenuto).');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
// A path inside pages/ is not a URL: the two shapes stopped matching the day
// English took the root (pages/en/tools/ is published at /tools/). Callers pass
// whichever they have — the workflow passes the files git says changed — and the
// route map does the translation, so nobody has to derive a URL with sed again.
const asRoute = (arg) => {
  const match = arg.replace(/^\.?\//, '').match(/^pages\/(.+?)\/?(?:index\.html)?$/);
  return match ? routeFromSourceDir(match[1]) ?? arg : arg;
};
const routes = args.filter((a) => !a.startsWith('--')).map(asRoute);

let urlList;
if (all) {
  urlList = sitemapUrls();
} else if (routes.length) {
  const known = new Set(sitemapUrls());
  urlList = routes
    .map((r) => (r.startsWith('http') ? r : `${baseUrl}${r.startsWith('/') ? '' : '/'}${r}`))
    .filter((u) => {
      if (known.has(u)) return true;
      console.log(`IndexNow: salto ${u} (non presente in sitemap: redirect, esclusa o noindex)`);
      return false;
    });
} else {
  console.error('IndexNow: nessun URL da inviare. Usa --all o passa una o più route.');
  process.exit(1);
}

if (!urlList.length) {
  console.log('IndexNow: niente da inviare.');
  process.exit(0);
}

const payload = {
  host,
  key,
  keyLocation: `${baseUrl}/${key}.txt`,
  urlList
};

console.log(`IndexNow: ${urlList.length} URL per ${host}${dryRun ? ' (dry-run)' : ''}`);
urlList.forEach((u) => console.log('  -', u));

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});

// 200 = ok; 202 = accepted, key verification still pending. Both fine.
if (res.ok) {
  console.log(`IndexNow: inviato, risposta ${res.status} ${res.statusText}`);
} else {
  console.error(`IndexNow: rifiutato, risposta ${res.status} ${res.statusText}`);
  console.error(await res.text().catch(() => ''));
  process.exit(1);
}
