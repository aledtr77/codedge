// Creates the English twin of an Italian page with every mechanical rewrite
// already applied, so the only thing left to do by hand is the actual
// translation of the prose.
//
//   node scripts/i18n-scaffold.mjs               scaffold every missing twin
//   node scripts/i18n-scaffold.mjs tutorial/css-fondamentali
//   node scripts/i18n-scaffold.mjs --force ...   overwrite an existing twin
//
// What it rewrites: <html lang>, og:locale, canonical and og:url, and every
// internal link that has a mapped English counterpart. What it leaves alone:
// all human-readable text — that is the translator's job, and the file is
// deliberately left in Italian so untranslated pages are obvious.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROUTE_MAP, routePairs, sourceDirForRoute } from '../src/i18n/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');

const args = process.argv.slice(2);
const force = args.includes('--force');
const filter = args.find((a) => !a.startsWith('--'));

const fileForRoute = (route) =>
  path.join(pagesRoot, sourceDirForRoute(route), 'index.html');

// Longest first: /risorse/glossario-css/ must win over /risorse/.
const linkRewrites = Object.entries(ROUTE_MAP)
  .filter(([itRoute]) => itRoute !== '/')
  .sort((a, b) => b[0].length - a[0].length);

function rewrite(html, itRoute, enRoute) {
  let out = html;

  out = out.replace(/<html\b([^>]*)>/i, (match, attrs) =>
    `<html${attrs.replace(/\slang=(?:"[^"]*"|'[^']*')/i, ' lang="en"')}>`
  );

  out = out.replace(
    /(<meta\b[^>]*property=["']og:locale["'][^>]*content=)(?:"[^"]*"|'[^']*')/gi,
    '$1"en_US"'
  );

  // Self-referencing URLs point at the English route.
  const escaped = itRoute.replace(/[/]/g, '\\/');
  out = out.replace(new RegExp(`(https://codedge\\.it)${escaped}(?=["'])`, 'g'), `$1${enRoute}`);

  // Internal links: href="/strumenti/" -> href="/en/tools/"
  for (const [it, en] of linkRewrites) {
    out = out.replaceAll(`href="${it}"`, `href="${en}"`);
    out = out.replaceAll(`href='${it}'`, `href='${en}'`);
  }
  // Links to the Italian home become the English home.
  out = out.replaceAll('href="/"', 'href="/en/"');

  out = out.replace(
    /\(staticNavbarHtmlPlugin, vite\.config\.js\)/g,
    '(chromeI18nPlugin, scripts/i18n-plugin.mjs)'
  );

  // A scaffold still holds Italian text under an English URL. Keep it out of
  // the index and out of hreflang until someone translates it: publishing it
  // as-is would tell search engines this is the English version of the page.
  // Removing this block is the last step of translating a page.
  if (!/name=["']robots["']/i.test(out)) {
    const marker = [
      '  <!-- i18n: translation pending — this page still holds the Italian source text.',
      '       Remove this block (robots meta included) once the page is translated. -->',
      '  <meta name="robots" content="noindex,follow">',
      ''
    ].join('\n');
    out = out.replace(/^([ \t]*)<link rel="canonical"/m, `${marker}$1<link rel="canonical"`);
  }

  return out;
}

let created = 0;
let skipped = 0;

for (const [itRoute, enRoute] of routePairs()) {
  if (filter && !itRoute.includes(filter) && !enRoute.includes(filter)) continue;

  const itFile = fileForRoute(itRoute);
  if (!fs.existsSync(itFile)) continue;

  const enFile = fileForRoute(enRoute);
  if (fs.existsSync(enFile) && !force) {
    skipped += 1;
    continue;
  }

  const html = fs.readFileSync(itFile, 'utf8');
  fs.mkdirSync(path.dirname(enFile), { recursive: true });
  fs.writeFileSync(enFile, rewrite(html, itRoute, enRoute), 'utf8');
  console.log(`+ ${path.relative(projectRoot, enFile)}`);
  created += 1;
}

console.log(`\n${created} scaffolded · ${skipped} already present (use --force to overwrite)`);
