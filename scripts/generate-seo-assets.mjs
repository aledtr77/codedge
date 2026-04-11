import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');
const publicRoot = path.join(projectRoot, 'public');
const packageJsonPath = path.join(projectRoot, 'package.json');
const sitemapPath = path.join(publicRoot, 'sitemap.xml');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const baseUrl = String(packageJson.homepage || 'https://codedge.it/').replace(/\/+$/, '');

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
  if (!relativeDir) return '/';
  return `/${relativeDir}/`;
}

function priorityForRoute(route) {
  if (route === '/') return '1.0';
  if (/^\/footer\//.test(route)) return '0.3';
  if (/^\/(risorse|strumenti|componenti-ui)\/$/.test(route)) return '0.9';
  if (route === '/percorsi-apprendimento/' || route === '/shop-template/') return '0.8';
  return '0.7';
}

function sortWeight(route) {
  if (route === '/') return 0;
  if (/^\/(risorse|strumenti|componenti-ui|percorsi-apprendimento|shop-template)\//.test(route)) return 1;
  if (/^\/footer\//.test(route)) return 3;
  return 2;
}

function buildSitemapXml(entries) {
  const body = entries
    .map(({ route, lastmod, priority }) => {
      return [
        '  <url>',
        `    <loc>${baseUrl}${route}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <priority>${priority}</priority>`,
        '  </url>'
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    ''
  ].join('\n');
}

const entries = walkIndexFiles(pagesRoot)
  .map((filePath) => {
    const stats = fs.statSync(filePath);
    const route = routeFromFile(filePath);
    return {
      filePath,
      route,
      priority: priorityForRoute(route),
      lastmod: new Date(stats.mtimeMs).toISOString()
    };
  })
  .sort((a, b) => {
    const weightDiff = sortWeight(a.route) - sortWeight(b.route);
    if (weightDiff !== 0) return weightDiff;
    return a.route.localeCompare(b.route, 'it');
  });

fs.writeFileSync(sitemapPath, buildSitemapXml(entries), 'utf8');
console.log(`Generated ${path.relative(projectRoot, sitemapPath)} with ${entries.length} URLs`);
