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
import { langOf, routeFromSourceDir } from '../src/i18n/routes.mjs';

const DEFAULT_OG_IMAGE = '/og/opengraph-1200x630.jpg';
const IN_LANGUAGE = { it: 'it-IT', en: 'en-US' };

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
    author: { '@type': 'Person', name: 'Alessandro' },
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

        const blocks = [];

        // Both language homes are roots, so neither gets a breadcrumb.
        const isLanguageHome = route === '/' || route === '/it/';
        if (!isLanguageHome && !html.includes('"BreadcrumbList"')) {
          blocks.push(breadcrumbLd(baseUrl, route, lang));
        }

        const isTutorial = /^\/tutorial\/[^/]+\/$/.test(route) || /^\/en\/tutorials\/[^/]+\/$/.test(route);
        if (isTutorial && !html.includes('"TechArticle"')) {
          blocks.push(techArticleLd(baseUrl, route, html, filename, projectRoot, lang));
        }

        const isGlossary = /^\/risorse\/glossario-[^/]+\/$/.test(route) || /^\/en\/resources\/[^/]+-glossary\/$/.test(route);
        if (isGlossary && !html.includes('"DefinedTermSet"')) {
          blocks.push(glossaryLd(baseUrl, route, html, lang));
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
