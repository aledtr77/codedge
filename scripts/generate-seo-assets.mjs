import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  counterpartOf,
  langOf,
  routeFromSourceDir,
  ROUTE_MAP,
  REDIRECT_STUBS,
  IT_PREFIX
} from '../src/i18n/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');
const publicRoot = path.join(projectRoot, 'public');
const packageJsonPath = path.join(projectRoot, 'package.json');
const sitemapPath = path.join(publicRoot, 'sitemap.xml');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const baseUrl = String(packageJson.homepage || 'https://codedge.it/').replace(/\/+$/, '');
function hasNoindexMeta(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  return /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);
}

// A handful of routes are only there to catch URLs that were indexed under an
// older slug and send the reader on. GitHub Pages cannot issue a 301, so they
// are pages that redirect — and they must never enter the sitemap.
//
// Recognised by their markup rather than listed by hand: a list has to be kept
// in step with the files, and the day it is not, a redirect quietly starts
// advertising itself as a destination.
function redirectTargetOf(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const match = html.match(/<meta\s+http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']+)["']/i);
  return match ? match[1].trim() : null;
}

function walkIndexFiles(dir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'index.html') {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

function routeFromFile(filePath) {
  const relativeDir = path.relative(pagesRoot, path.dirname(filePath)).split(path.sep).join('/');
  return routeFromSourceDir(relativeDir);
}

function gitRelativePath(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function lastModifiedForFile(filePath) {
  const fallback = () => fs.statSync(filePath).mtime.toISOString();

  try {
    const lastCommitDate = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', gitRelativePath(filePath)],
      {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }
    ).trim();

    if (!lastCommitDate) return fallback();

    // Only the last commit touching the page itself: folding in "global"
    // commits (theme, navbar) flattened every lastmod to the same date on any
    // CSS touch-up, and an always-changing lastmod is one crawlers learn to
    // ignore.
    return new Date(lastCommitDate).toISOString();
  } catch {
    return fallback();
  }
}

// Priority and ordering are language-independent: an English page inherits the
// weight of its Italian twin, so /tools/ ranks like /it/strumenti/.
function canonicalShape(route) {
  const itRoute = langOf(route) === 'en' ? counterpartOf(route) : route;
  return itRoute || route;
}

function priorityForRoute(route) {
  const shape = canonicalShape(route);
  if (shape === '/it/') return '1.0';
  if (/^\/it\/(risorse|strumenti|componenti-ui)\/$/.test(shape)) return '0.9';
  if (shape === '/it/tutorial/' || shape === '/it/template/') return '0.8';
  if (/^\/it\/(chi-sono|contatti|privacy-policy|termini-servizio)\/$/.test(shape)) return '0.3';
  return '0.7';
}

function sortWeight(route) {
  const shape = canonicalShape(route);
  if (shape === '/it/') return 0;
  if (/^\/it\/(risorse|strumenti|componenti-ui|tutorial|template)\//.test(shape)) return 1;
  if (/^\/it\/(chi-sono|contatti|privacy-policy|termini-servizio)\//.test(shape)) return 3;
  return 2;
}

// Every URL declares the full set it belongs to, itself included: that is what
// the protocol asks for, and it is how Google pairs the two versions.
function alternateLinks(route, knownRoutes) {
  const twin = counterpartOf(route);
  if (!twin || !knownRoutes.has(twin)) return [];

  const lang = langOf(route);
  const itRoute = lang === 'it' ? route : twin;
  const enRoute = lang === 'it' ? twin : route;

  return [
    `    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}${itRoute}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${enRoute}"/>`,
    // English answers for every locale neither version matches: it is what a
    // reader without a stored language preference is served (see
    // langPreferencePlugin in scripts/i18n-plugin.mjs).
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${enRoute}"/>`
  ];
}

function buildSitemapXml(entries) {
  const knownRoutes = new Set(entries.map(({ route }) => route));

  const body = entries
    .map(({ route, lastmod, priority }) => {
      return [
        '  <url>',
        `    <loc>${baseUrl}${route}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <priority>${priority}</priority>`,
        ...alternateLinks(route, knownRoutes),
        '  </url>'
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    body,
    '</urlset>',
    ''
  ].join('\n');
}

const pages = walkIndexFiles(pagesRoot).map((filePath) => ({
  filePath,
  route: routeFromFile(filePath),
  noindex: hasNoindexMeta(filePath),
  redirectTo: redirectTargetOf(filePath)
}));

// A redirect that no longer lands anywhere is worse than no redirect at all:
// the reader gets a 404 and the old URL's standing is thrown away rather than
// passed on. The slugs have been renamed once already, so check every hop
// against the pages that actually exist.
const routesOnFile = new Set(pages.map(({ route }) => route).filter(Boolean));
const brokenRedirects = pages
  .filter(({ redirectTo }) => redirectTo)
  .filter(({ redirectTo }) => !routesOnFile.has(redirectTo));

if (brokenRedirects.length) {
  console.error('\nRedirect senza destinazione:');
  for (const { filePath, route, redirectTo } of brokenRedirects) {
    console.error(`  ${route} → ${redirectTo}  (${path.relative(projectRoot, filePath)})`);
  }
  console.error('\nLa pagina di arrivo non esiste: aggiorna il redirect o rimuovilo.\n');
  process.exit(1);
}

const entries = pages
  .filter(({ route, noindex, redirectTo }) => route && !noindex && !redirectTo)
  .map(({ filePath, route }) => ({
    filePath,
    route,
    priority: priorityForRoute(route),
    lastmod: lastModifiedForFile(filePath)
  }))
  .sort((a, b) => {
    const weightDiff = sortWeight(a.route) - sortWeight(b.route);
    if (weightDiff !== 0) return weightDiff;
    return a.route.localeCompare(b.route, 'it');
  });

fs.writeFileSync(sitemapPath, buildSitemapXml(entries), 'utf8');
console.log(`Generated ${path.relative(projectRoot, sitemapPath)} with ${entries.length} URLs`);

/**
 * The 301s that keep the pre-29/07/2026 URLs alive.
 *
 * Until then Italian was served from the root and English from /en/; the two
 * swapped places. Every URL that moved has been indexed under the old shape and
 * linked to from outside, so none of them may simply stop answering.
 *
 * Generated rather than written by hand for the same reason the sitemap is: the
 * pairing lives in one place, and a route added there cannot be forgotten here.
 */
function buildRedirects() {
  const enRoutes = new Set(Object.values(ROUTE_MAP));
  const italianRoutes = [...Object.keys(ROUTE_MAP), ...REDIRECT_STUBS].sort();
  const lines = [];
  const collisions = [];

  for (const route of italianRoutes) {
    // The Italian home is not a redirect: the root now answers in English, and
    // that is the whole point of the move.
    if (route === `${IT_PREFIX}/`) continue;

    const was = route.slice(IT_PREFIX.length);
    // A slug both languages spell the same way (/privacy-policy/) is now the
    // English page's own URL. Redirecting it would take that page off the air;
    // a reader who wanted the Italian one is moved on by their stored
    // preference instead.
    if (enRoutes.has(was)) {
      collisions.push(was);
      continue;
    }
    lines.push(`${was} ${route} 301`);
  }

  if (collisions.length) {
    console.log(`  (${collisions.length} URL non redirette, ora sono dell'inglese: ${collisions.join(', ')})`);
  }

  return [
    '# Generato da scripts/generate-seo-assets.mjs — non modificare a mano.',
    '#',
    '# Il 29/07/2026 inglese e italiano si sono scambiati di posto: la radice',
    '# risponde in inglese, l\'italiano sta sotto /it/. Queste regole tengono in',
    '# vita le URL di prima.',
    '',
    '# Inglese: perde il prefisso e basta, gli slug sono gli stessi.',
    '/en/* /:splat 301',
    '',
    '# Italiano: ogni URL scende sotto /it/.',
    ...lines,
    ''
  ].join('\n');
}

const redirectsPath = path.join(publicRoot, '_redirects');
fs.writeFileSync(redirectsPath, buildRedirects(), 'utf8');
console.log(`Generated ${path.relative(projectRoot, redirectsPath)}`);
