import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  counterpartOf,
  langOf,
  routeFromSourceDir,
  ROUTE_MAP,
  LEGACY_REDIRECTS,
  IT_PREFIX
} from '../src/i18n/routes.mjs';
import { collectPageSources } from './page-sources.mjs';
import { fileDates, toRelative } from './lib/git-dates.mjs';

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
  return toRelative(projectRoot, filePath);
}

// The date a move must not touch — see scripts/lib/git-dates.mjs for why the
// obvious git call gets this wrong, and what it costs when it does.
function lastCommitFor(relativePath) {
  return fileDates(projectRoot, relativePath).modified;
}

function lastModifiedForFile(filePath) {
  return lastCommitFor(gitRelativePath(filePath)) || fs.statSync(filePath).mtime.toISOString();
}

/**
 * The newest commit across the page's HTML and the sources only that page
 * imports — see scripts/page-sources.mjs for why the shared ones stay out.
 * ISO strings in UTC, so sorting them is sorting the dates.
 */
function lastModifiedForPage(filePath, sources) {
  const dates = [lastModifiedForFile(filePath)];
  for (const source of sources) {
    const date = lastCommitFor(source);
    if (date) dates.push(date);
  }
  return dates.sort().pop();
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
  noindex: hasNoindexMeta(filePath)
}));

// Un redirect che non atterra da nessuna parte è peggio di nessun redirect: il
// lettore prende un 404 e il credito della vecchia URL si butta invece di
// passarlo. Gli slug sono già stati rinominati una volta, quindi ogni salto si
// controlla contro le pagine che esistono davvero.
const routesOnFile = new Set(pages.map(({ route }) => route).filter(Boolean));
const brokenRedirects = Object.entries(LEGACY_REDIRECTS)
  .filter(([, to]) => !routesOnFile.has(to));

if (brokenRedirects.length) {
  console.error('\nRedirect senza destinazione:');
  for (const [from, to] of brokenRedirects) console.error(`  ${from} → ${to}`);
  console.error('\nLa pagina di arrivo non esiste: aggiorna LEGACY_REDIRECTS in src/i18n/routes.mjs.\n');
  process.exit(1);
}

const indexablePages = pages.filter(({ route, noindex }) => route && !noindex);

const readSource = (relativePath) => {
  try {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const isFile = (relativePath) => {
  try {
    return fs.statSync(path.join(projectRoot, relativePath)).isFile();
  } catch {
    return false;
  }
};

const pageSources = collectPageSources({
  pages: indexablePages.map(({ filePath, route }) => ({
    route,
    shape: canonicalShape(route),
    htmlPath: gitRelativePath(filePath)
  })),
  readFile: readSource,
  exists: isFile
});

const entries = indexablePages
  .map(({ filePath, route }) => ({
    filePath,
    route,
    priority: priorityForRoute(route),
    lastmod: lastModifiedForPage(filePath, pageSources.get(route) || [])
  }))
  .sort((a, b) => {
    const weightDiff = sortWeight(a.route) - sortWeight(b.route);
    if (weightDiff !== 0) return weightDiff;
    return a.route.localeCompare(b.route, 'it');
  });

fs.writeFileSync(sitemapPath, buildSitemapXml(entries), 'utf8');
console.log(`Generated ${path.relative(projectRoot, sitemapPath)} with ${entries.length} URLs`);

/**
 * One RSS feed per language, listing the tutorials newest first.
 *
 * Only tutorials go in: a feed is a list of things that get published, and the
 * glossaries, tools and components are pages that get revised instead. Dates
 * come from git — the first commit that added the file is the publication date,
 * the last one that touched it is the update — so nothing has to be maintained
 * by hand and the feed cannot drift from what is actually online.
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstCommitDate(filePath) {
  return fileDates(projectRoot, gitRelativePath(filePath)).created || lastModifiedForFile(filePath);
}

function readMeta(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const description =
    (html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
     html.match(/content=["']([^"']*)["'][^>]*name=["']description["']/i) || [])[1] || '';
  return {
    // "Titolo | Codedge" is right in a tab and noise in a feed reader, where the
    // channel name is already on screen.
    title: title.split('|')[0].replace(/\s+/g, ' ').trim(),
    description: description.replace(/\s+/g, ' ').trim()
  };
}

function buildFeedXml({ feedRoute, selfUrl, title, description, lang, items }) {
  const body = items
    .map(({ route, title: itemTitle, description: itemDescription, published }) => [
      '    <item>',
      `      <title>${escapeXml(itemTitle)}</title>`,
      `      <link>${baseUrl}${route}</link>`,
      `      <guid isPermaLink="true">${baseUrl}${route}</guid>`,
      itemDescription ? `      <description>${escapeXml(itemDescription)}</description>` : '',
      published ? `      <pubDate>${new Date(published).toUTCString()}</pubDate>` : '',
      '    </item>'
    ].filter(Boolean).join('\n'))
    .join('\n');

  const newest = items.map((i) => i.published).filter(Boolean).sort().pop();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${baseUrl}${feedRoute === '/feed.xml' ? '/' : '/it/'}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <language>${lang}</language>`,
    newest ? `    <lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>` : '',
    `    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>`,
    body,
    '  </channel>',
    '</rss>',
    ''
  ].filter(Boolean).join('\n');
}

const FEEDS = [
  {
    feedRoute: '/feed.xml',
    file: path.join(publicRoot, 'feed.xml'),
    prefix: '/tutorials/',
    lang: 'en-US',
    title: 'CODEDGE — Tutorials',
    description: 'Hands-on web development tutorials from codedge.it, newest first.'
  },
  {
    feedRoute: '/it/feed.xml',
    file: path.join(publicRoot, 'it', 'feed.xml'),
    prefix: '/it/tutorial/',
    lang: 'it-IT',
    title: 'CODEDGE — Tutorial',
    description: 'I tutorial pratici di sviluppo web di codedge.it, dal più recente.'
  }
];

for (const feed of FEEDS) {
  const items = entries
    .filter(({ route }) => route.startsWith(feed.prefix) && route !== feed.prefix)
    .map(({ filePath, route }) => ({
      route,
      published: firstCommitDate(filePath),
      ...readMeta(filePath)
    }))
    .filter(({ title }) => title)
    .sort((a, b) => String(b.published).localeCompare(String(a.published)));

  fs.mkdirSync(path.dirname(feed.file), { recursive: true });
  fs.writeFileSync(
    feed.file,
    buildFeedXml({ ...feed, selfUrl: `${baseUrl}${feed.feedRoute}`, items }),
    'utf8'
  );
  console.log(`Generated ${path.relative(projectRoot, feed.file)} with ${items.length} items`);
}

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
  const italianRoutes = Object.keys(ROUTE_MAP).sort();
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

  // Slug abbandonati anche prima dello spostamento: qui la destinazione è
  // scritta a mano perché non c'è nessuna regola che la possa dedurre.
  const legacy = Object.entries(LEGACY_REDIRECTS).flatMap(([from, to]) => {
    const rules = [`${from} ${to} 301`];
    // Per un giorno queste URL sono esistite anche sotto /it/, perché lo
    // spostamento le ha portate con sé prima che diventassero regole.
    if (!from.startsWith('/html/')) rules.push(`${IT_PREFIX}${from} ${to} 301`);
    return rules;
  });

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
    '',
    '# Slug abbandonati prima dello spostamento: erano pagine con un meta',
    '# refresh finché l\'host non sapeva emettere un 301.',
    ...legacy,
    ''
  ].join('\n');
}

const redirectsPath = path.join(publicRoot, '_redirects');
fs.writeFileSync(redirectsPath, buildRedirects(), 'utf8');
console.log(`Generated ${path.relative(projectRoot, redirectsPath)}`);
