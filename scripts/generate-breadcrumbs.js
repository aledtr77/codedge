#!/usr/bin/env node
/**
 * scripts/generate-breadcrumbs.js
 *
 * Adattato al working tree di Ale (project-vite).
 * - Scansiona: site-pages/ + public/partials/ (poi puoi estendere)
 * - Produce: src/generated/breadcrumbs.json
 * - ROOT_URL di default: https://codedge.it/ (override con env ROOT_URL)
 * - Rimuove segmenti "site-pages", "html", "_includes", "partials", "assets", "public"
 * - Normalizza index.html -> '/'
 * - Garantisce URL assoluti (rootUrl + path)
 *
 * Esempio:
 *   ROOT_URL="https://codedge.it/" npm run gen:breadcrumbs
 *   npm run gen:breadcrumbs
 */

const fs = require('fs');
const path = require('path');

const ENTRY_DIRS = ['site-pages', 'public/partials', 'public']; // ordine: priorità
const OUT_DIR = path.join('src', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'breadcrumbs.json');
const DEFAULT_ROOT = 'https://codedge.it/';

const RAW_ROOT = process.env.ROOT_URL || DEFAULT_ROOT;
const ROOT_URL = RAW_ROOT.endsWith('/') ? RAW_ROOT : RAW_ROOT + '/';

// Segmenti da ignorare nei breadcrumb (non mostrati)
const IGNORE_SEGMENTS = new Set([
  'site-pages', 'site_pages', 'html', '_includes', 'includes', 'partials', 'public', 'assets'
]);

function log(...args) {
  console.log('[gen-breadcrumbs]', ...args);
}

function isHtml(name) {
  return /\.html?$/i.test(name);
}

function walkDir(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    // skip obvious noise
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      result.push(...walkDir(full));
    } else if (e.isFile() && isHtml(e.name)) {
      result.push(full);
    }
  }
  return result;
}

function normalizeFsToUrlPath(fsPath) {
  // fsPath è relativo alla cwd o assoluto -> vogliamo urlPath come '/strumenti/generatore-colori/'
  let rel = path.relative(process.cwd(), fsPath).replace(/\\/g, '/');

  // se il percorso contiene '/html/' come segmento (vecchie build), rimuovilo
  rel = rel.replace(/\/html\//g, '/');

  // rimuovi prefissi che non vogliamo mostrare
  rel = rel.replace(/^site-pages\//, '');
  rel = rel.replace(/^public\//, '');
  rel = rel.replace(/^public\/partials\//, '');
  rel = rel.replace(/^src\//, '');

  // normalizza index.html -> '/'
  rel = rel.replace(/\/index(\.html?)?$/i, '/');

  // rimuovi estensioni .html residue
  rel = rel.replace(/\.html?$/i, '');

  if (!rel.startsWith('/')) rel = '/' + rel;
  // collapse multiple slashes
  rel = rel.replace(/\/+/g, '/');

  // trailing slash per "directory style" eccetto root
  if (rel !== '/' && !rel.endsWith('/')) rel = rel + '/';

  return rel;
}

function humanizeSegment(segment) {
  if (!segment) return '';
  // decode, replace dash/underscore, capitalize words
  segment = decodeURIComponent(segment);
  segment = segment.replace(/[-_]+/g, ' ').trim();
  return segment.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function buildBreadcrumbItems(urlPath) {
  // urlPath: '/strumenti/generatore-colori/' or '/'
  const parts = urlPath.split('/').filter(Boolean); // array di segmenti reali
  const items = [];

  // Home sempre
  items.push({ label: 'Home', url: new URL('/', ROOT_URL).href, current: parts.length === 0 });

  // costruiamo cumulativo ignorando i segmenti in IGNORE_SEGMENTS
  let cumulative = '/';
  const meaningful = parts.filter(p => !IGNORE_SEGMENTS.has(p.toLowerCase()));
  for (let i = 0; i < meaningful.length; i++) {
    const seg = meaningful[i];
    cumulative += seg + '/';
    const isLast = i === meaningful.length - 1;
    const label = humanizeSegment(seg) || seg;
    const url = new URL(cumulative, ROOT_URL).href;
    items.push({ label, url, current: isLast });
  }

  // edge: se non ci sono meaningful (solo home) assicurati current true
  if (items.length === 1) items[0].current = true;

  return items;
}

function main() {
  log('rootUrl =', ROOT_URL);
  const found = [];

  for (const dir of ENTRY_DIRS) {
    const full = path.join(process.cwd(), dir);
    if (!fs.existsSync(full)) {
      log(`directory non trovata (skip): ${dir}`);
      continue;
    }
    const list = walkDir(full);
    log(`trovati ${list.length} html in ${dir}`);
    found.push(...list);
  }

  // Map urlPath -> breadcrumb items
  const map = {};

  for (const f of found) {
    try {
      const urlPath = normalizeFsToUrlPath(f);
      // overwrite se duplicate: l'ultima occorrenza vince (public/partials vs site-pages)
      map[urlPath] = buildBreadcrumbItems(urlPath);
    } catch (err) {
      log('errore su', f, err && err.message);
    }
  }

  // assicurati che '/' esista
  if (!map['/']) {
    map['/'] = buildBreadcrumbItems('/');
  }

  // write output
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const output = {
    generatedAt: new Date().toISOString(),
    rootUrl: ROOT_URL,
    pages: map
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  log(`Generati breadcrumbs per ${Object.keys(map).length} url. Output -> ${OUT_FILE}`);
  process.exit(0);
}

main();
