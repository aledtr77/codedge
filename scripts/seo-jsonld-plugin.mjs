// Vite plugin: injects JSON-LD into built pages without touching pages/
// sources.
//   - BreadcrumbList  on every indexable page (labels identical to the
//     visible breadcrumbs via the shared vocabulary)
//   - TechArticle     on tutorials that lack a hand-written one
//   - DefinedTermSet  on the glossaries (one DefinedTerm per entry)
// Pages already carrying a block of a given @type are left alone.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { formatSegment, LANG_PREFIX_SEGMENTS } from '../src/scripts/components/breadcrumb-vocabulary.js';
import { ROUTE_MAP, counterpartOf, langOf, routeFromSourceDir, sourceDirForRoute } from '../src/i18n/routes.mjs';

const DEFAULT_OG_IMAGE = '/og/opengraph-1200x630.jpg';
const IN_LANGUAGE = { it: 'it-IT', en: 'en-US' };
const AUTHOR = { '@type': 'Person', name: 'Alessandro DTR', sameAs: ['https://github.com/aledtr77'] };

/**
 * Which kind of page a route is, asked in one language only. Matching the live
 * URLs directly needs one pattern per language and silently stops matching the
 * day they are renamed or swapped — which is exactly what happened when the
 * default language moved to the root. The IT route is the stable identity of a
 * page pair in ROUTE_MAP, so every check is written against that.
 */
function itRouteOf(route) {
  return langOf(route) === 'it' ? route : counterpartOf(route) ?? route;
}

function readBaseUrl(projectRoot) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return String(pkg.homepage || 'https://codedge.it/').replace(/\/+$/, '');
  } catch {
    return 'https://codedge.it';
  }
}

// Attribute extraction that scans whole tags: meta tags in this project
// often span multiple lines, so line-based matching misses them.
function findTagAttr(html, tagRegex, mustMatch, attr) {
  const tags = html.match(tagRegex) || [];
  for (const tag of tags) {
    if (!mustMatch.test(tag)) continue;
    const m = tag.match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i')) ||
              tag.match(new RegExp(`${attr}\\s*=\\s*'([^']*)'`, 'i'));
    if (m) return m[1].trim();
  }
  return '';
}

const getMetaDescription = (html) =>
  findTagAttr(html, /<meta\b[\s\S]*?>/gi, /name\s*=\s*["']description["']/i, 'content');
const getCanonical = (html) =>
  findTagAttr(html, /<link\b[\s\S]*?>/gi, /rel\s*=\s*["']canonical["']/i, 'href');
const getOgImage = (html) =>
  findTagAttr(html, /<meta\b[\s\S]*?>/gi, /property\s*=\s*["']og:image["']/i, 'content');

function getTitleHeadline(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return '';
  return m[1].split('|')[0].replace(/\s+/g, ' ').trim();
}

function gitDate(projectRoot, filePath, { first = false } = {}) {
  try {
    const rel = path.relative(projectRoot, filePath).split(path.sep).join('/');
    const args = first
      ? ['log', '--diff-filter=A', '--format=%cI', '--', rel]
      : ['log', '-1', '--format=%cI', '--', rel];
    const out = execFileSync('git', args, {
      cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    if (!out) return '';
    const lines = out.split('\n');
    // publication date needs the oldest commit (last line)
    return (first ? lines[lines.length - 1] : lines[0]).slice(0, 10);
  } catch {
    return '';
  }
}

// Must produce the same trail as the runtime breadcrumb (breadcrumb.js):
// the /en prefix stays in the URLs but is not a level of its own.
function breadcrumbLd(baseUrl, route, lang) {
  const allSegments = route.split('/').filter(Boolean);
  const prefix = LANG_PREFIX_SEGMENTS.has(allSegments[0]) ? `/${allSegments[0]}` : '';
  const segments = prefix ? allSegments.slice(1) : allSegments;

  const items = [{
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: `${baseUrl}${prefix}/`
  }];
  let acc = prefix;
  segments.forEach((segment, i) => {
    acc += `/${segment}`;
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: formatSegment(segment, lang),
      item: `${baseUrl}${acc}/`
    });
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

function techArticleLd(baseUrl, route, html, filePath, projectRoot, lang) {
  const headline = getTitleHeadline(html);
  const description = getMetaDescription(html);
  if (!headline || !description) return null;

  const url = getCanonical(html) || `${baseUrl}${route}`;
  const image = getOgImage(html) || `${baseUrl}${DEFAULT_OG_IMAGE}`;
  const published = gitDate(projectRoot, filePath, { first: true });
  const modified = gitDate(projectRoot, filePath) || published;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    author: AUTHOR,
    publisher: { '@type': 'Organization', name: 'CODEDGE', url: `${baseUrl}/` },
    inLanguage: IN_LANGUAGE[lang],
    url,
    mainEntityOfPage: url,
    image
  };
  if (published) ld.datePublished = published;
  if (modified) ld.dateModified = modified;
  return ld;
}

/**
 * Drops HTML comments before any regex scanning. A comment that quotes a tag
 * name is indistinguishable from the tag itself to a pattern match.
 */
function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function glossaryLd(baseUrl, route, html, lang) {
  const terms = [];
  const entryRegex = /<summary>\s*([\s\S]*?)<span class="tag-description"[^>]*>([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = entryRegex.exec(html)) !== null) {
    const name = m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const description = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (name && description) terms.push({ '@type': 'DefinedTerm', name, description });
  }
  if (!terms.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: getTitleHeadline(html) || formatSegment(route.split('/').filter(Boolean).pop(), lang),
    description: getMetaDescription(html) || undefined,
    url: getCanonical(html) || `${baseUrl}${route}`,
    inLanguage: IN_LANGUAGE[lang],
    hasDefinedTerm: terms
  };
}

/**
 * The pages one level below a section index, in the order the visitor meets
 * them on the page. Derived from ROUTE_MAP rather than from the card markup so
 * a restyled grid cannot silently empty the list, and filtered by what the page
 * actually links so a route present in the map but not yet linked stays out.
 */
function childRoutesOf(route, lang, html) {
  const all = lang === 'it' ? Object.keys(ROUTE_MAP) : Object.values(ROUTE_MAP);
  const depth = route.split('/').filter(Boolean).length;
  return all
    .filter((r) => r !== route && r.startsWith(route) &&
      r.split('/').filter(Boolean).length === depth + 1 &&
      html.includes(`href="${r}"`))
    .sort((a, b) => html.indexOf(`href="${a}"`) - html.indexOf(`href="${b}"`));
}

function itemListLd(baseUrl, route, html, lang, pagesRoot) {
  const children = childRoutesOf(route, lang, html);
  if (children.length < 2) return null;

  const itemListElement = children.map((child, i) => {
    let name = '';
    try {
      const file = path.join(pagesRoot, sourceDirForRoute(child), 'index.html');
      name = getTitleHeadline(fs.readFileSync(file, 'utf8'));
    } catch {
      name = '';
    }
    return {
      '@type': 'ListItem',
      position: i + 1,
      name: name || formatSegment(child.split('/').filter(Boolean).pop(), lang),
      url: `${baseUrl}${child}`
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: getTitleHeadline(html) || undefined,
    description: getMetaDescription(html) || undefined,
    url: getCanonical(html) || `${baseUrl}${route}`,
    inLanguage: IN_LANGUAGE[lang],
    numberOfItems: itemListElement.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement
  };
}

export default function seoJsonLdPlugin() {
  const projectRoot = process.cwd();
  const pagesRoot = path.resolve(projectRoot, 'pages');
  const baseUrl = readBaseUrl(projectRoot);

  return {
    name: 'seo-jsonld',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const filename = ctx.filename ? path.resolve(ctx.filename) : '';
        if (!filename.startsWith(pagesRoot + path.sep)) return html;

        // No structured data on redirect stubs or noindex pages
        if (/http-equiv\s*=\s*["']refresh["']/i.test(html)) return html;
        if (/<meta\b[^>]*name\s*=\s*["']robots["'][^>]*noindex/i.test(html)) return html;

        const relDir = path.relative(pagesRoot, path.dirname(filename)).split(path.sep).join('/');
        const route = routeFromSourceDir(relDir);
        if (!route) return html;
        const lang = langOf(route);

        // Everything below reads the page with regexes, and a regex cannot tell
        // markup from a comment that quotes markup. The glossary pages explain
        // their own structure in a comment that names <summary>, which the entry
        // scanner matched as if it were the first entry — shipping the comment
        // text as a DefinedTerm name. Scan a comment-free copy; the html that
        // gets returned is untouched.
        const scannable = stripComments(html);

        const blocks = [];

        // Both language homes are roots, so neither gets a breadcrumb.
        const isLanguageHome = route === '/' || route === '/it/';
        if (!isLanguageHome && !scannable.includes('"BreadcrumbList"')) {
          blocks.push(breadcrumbLd(baseUrl, route, lang));
        }

        const itRoute = itRouteOf(route);

        const isTutorial = /^\/it\/tutorial\/[^/]+\/$/.test(itRoute);
        if (isTutorial && !scannable.includes('"TechArticle"')) {
          blocks.push(techArticleLd(baseUrl, route, scannable, filename, projectRoot, lang));
        }

        const isGlossary = /^\/it\/risorse\/glossario-[^/]+\/$/.test(itRoute);
        if (isGlossary && !scannable.includes('"DefinedTermSet"')) {
          blocks.push(glossaryLd(baseUrl, route, scannable, lang));
        }

        // Section indexes: the grid of cards is a list, and saying so is what
        // earns the expanded result with sub-links under the snippet.
        if (!isLanguageHome && !scannable.includes('"ItemList"')) {
          blocks.push(itemListLd(baseUrl, route, scannable, lang, pagesRoot));
        }

        const valid = blocks.filter(Boolean);
        if (!valid.length) return html;

        // Escape < inside JSON strings: content quoting "</script>" must not be
        // able to close the block.
        const scripts = valid
          .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`)
          .join('\n');

        return html.replace(/<\/head>/i, `${scripts}\n</head>`);
      }
    }
  };
}
