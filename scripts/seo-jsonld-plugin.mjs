// scripts/seo-jsonld-plugin.mjs
// Plugin Vite: inietta dati strutturati JSON-LD nelle pagine in build,
// senza toccare i sorgenti in pages/:
//  - BreadcrumbList  su ogni pagina indicizzabile (etichette identiche alla
//    breadcrumb visibile, stesso vocabolario condiviso)
//  - TechArticle     sui tutorial che non ne hanno già uno scritto a mano
//  - DefinedTermSet  sui glossari (un DefinedTerm per ogni voce)
// Le pagine che hanno già un blocco di quel @type vengono lasciate stare.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { formatSegment } from '../src/scripts/components/breadcrumb-vocabulary.js';

const DEFAULT_OG_IMAGE = '/og/opengraph-1200x630.jpg';

function readBaseUrl(projectRoot) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return String(pkg.homepage || 'https://codedge.it/').replace(/\/+$/, '');
  } catch {
    return 'https://codedge.it';
  }
}

// Estrae il valore di un attributo da un tag trovato via regex sull'HTML.
// I meta del progetto sono spesso scritti su più righe, quindi niente
// matching riga-per-riga: si scandiscono i tag interi.
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
    // per la data di pubblicazione serve il commit più vecchio (ultima riga)
    return (first ? lines[lines.length - 1] : lines[0]).slice(0, 10);
  } catch {
    return '';
  }
}

function breadcrumbLd(baseUrl, route) {
  const segments = route.split('/').filter(Boolean);
  const items = [{
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: `${baseUrl}/`
  }];
  let acc = '';
  segments.forEach((segment, i) => {
    acc += `/${segment}`;
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: formatSegment(segment),
      item: `${baseUrl}${acc}/`
    });
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

function techArticleLd(baseUrl, route, html, filePath, projectRoot) {
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
    inLanguage: 'it-IT',
    url,
    mainEntityOfPage: url,
    image
  };
  if (published) ld.datePublished = published;
  if (modified) ld.dateModified = modified;
  return ld;
}

function glossaryLd(baseUrl, route, html) {
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
    name: getTitleHeadline(html) || formatSegment(route.split('/').filter(Boolean).pop()),
    description: getMetaDescription(html) || undefined,
    url: getCanonical(html) || `${baseUrl}${route}`,
    inLanguage: 'it-IT',
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

        // Niente dati strutturati su redirect stub e pagine noindex
        if (/http-equiv\s*=\s*["']refresh["']/i.test(html)) return html;
        if (/<meta\b[^>]*name\s*=\s*["']robots["'][^>]*noindex/i.test(html)) return html;

        const relDir = path.relative(pagesRoot, path.dirname(filename)).split(path.sep).join('/');
        const route = relDir === '' ? '/' : `/${relDir}/`;

        const blocks = [];

        if (route !== '/' && !html.includes('"BreadcrumbList"')) {
          blocks.push(breadcrumbLd(baseUrl, route));
        }

        if (/^\/tutorial\/[^/]+\/$/.test(route) && !html.includes('"TechArticle"')) {
          blocks.push(techArticleLd(baseUrl, route, html, filename, projectRoot));
        }

        if (/^\/risorse\/glossario-[^/]+\/$/.test(route) && !html.includes('"DefinedTermSet"')) {
          blocks.push(glossaryLd(baseUrl, route, html));
        }

        const valid = blocks.filter(Boolean);
        if (!valid.length) return html;

        // < al posto di "<" dentro le stringhe JSON: un contenuto che
        // citasse "</script>" non può chiudere il blocco per sbaglio.
        const scripts = valid
          .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`)
          .join('\n');

        return html.replace(/<\/head>/i, `${scripts}\n</head>`);
      }
    }
  };
}
