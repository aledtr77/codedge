import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { counterpartOf, langOf, routeFromSourceDir } from '../src/i18n/routes.mjs';

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
// weight of its Italian twin, so /en/tools/ ranks like /strumenti/.
function canonicalShape(route) {
  const itRoute = langOf(route) === 'en' ? counterpartOf(route) : route;
  return itRoute || route;
}

function priorityForRoute(route) {
  const shape = canonicalShape(route);
  if (shape === '/') return '1.0';
  if (/^\/(risorse|strumenti|componenti-ui)\/$/.test(shape)) return '0.9';
  if (shape === '/tutorial/' || shape === '/template/') return '0.8';
  if (/^\/(chi-sono|contatti|privacy-policy|termini-servizio)\/$/.test(shape)) return '0.3';
  return '0.7';
}

function sortWeight(route) {
  const shape = canonicalShape(route);
  if (shape === '/') return 0;
  if (/^\/(risorse|strumenti|componenti-ui|tutorial|template)\//.test(shape)) return 1;
  if (/^\/(chi-sono|contatti|privacy-policy|termini-servizio)\//.test(shape)) return 3;
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
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${itRoute}"/>`
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
