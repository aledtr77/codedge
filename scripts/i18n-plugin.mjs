// Vite plugins for the bilingual (IT/EN) build.
//
//   chromeI18nPlugin()   fills the navbar/footer placeholders with the strings
//                        and hrefs of the page's own language, and injects the
//                        language switch pointing at the twin page
//   hreflangPlugin()     writes <html lang>, og:locale and the reciprocal
//                        hreflang tags from the shared route map
//
// Both derive the language from the page's position in pages/ — anything under
// pages/en/ is English, everything else Italian — so a page never has to
// declare it twice.

import fs from 'fs';
import path from 'path';
import {
  counterpartOf,
  langOf,
  normalizeRoute,
  routeFromSourceDir,
  sourceDirForRoute,
  REDIRECT_STUBS
} from '../src/i18n/routes.mjs';
import { STRINGS } from '../src/i18n/ui.js';

const ENTRY_DIR = 'pages';

function readBaseUrl(projectRoot) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return String(pkg.homepage || 'https://codedge.it/').replace(/\/+$/, '');
  } catch {
    return 'https://codedge.it';
  }
}

// The route a page will be served at, derived from its path inside pages/.
// Falls back to ctx.path for the rare case where filename is unavailable.
export function routeFromCtx(ctx, projectRoot) {
  const pagesRoot = path.resolve(projectRoot, ENTRY_DIR);
  const filename = ctx?.filename ? path.resolve(ctx.filename) : '';

  if (filename && filename.startsWith(pagesRoot)) {
    const rel = path.relative(pagesRoot, path.dirname(filename)).split(path.sep).join('/');
    const route = routeFromSourceDir(rel);
    if (route) return route;
  }

  const fromPath = String(ctx?.path || '/').replace(/^\/pages\/(it|en)\//, (_m, lang) =>
    lang === 'en' ? '/en/' : '/'
  );
  return normalizeRoute(fromPath);
}

const OG_LOCALE = { it: 'it_IT', en: 'en_US' };
const LANG_ATTR = { it: 'it', en: 'en' };
const LANG_CODE = { it: 'IT', en: 'EN' };

// Section landing pages the navbar links to, per language.
const NAV_HREFS = {
  it: {
    HOME_HREF: '/',
    RESOURCES_HREF: '/risorse/',
    TOOLS_HREF: '/strumenti/',
    COMPONENTS_HREF: '/componenti-ui/',
    TUTORIALS_HREF: '/tutorial/',
    TEMPLATES_HREF: '/template/'
  },
  en: {
    HOME_HREF: '/en/',
    RESOURCES_HREF: '/en/resources/',
    TOOLS_HREF: '/en/tools/',
    COMPONENTS_HREF: '/en/ui-components/',
    TUTORIALS_HREF: '/en/tutorials/',
    TEMPLATES_HREF: '/en/templates/'
  }
};

const FOOTER_HREFS = {
  it: {
    PRIVACY_HREF: '/privacy-policy/',
    TERMS_HREF: '/termini-servizio/',
    CONTACT_HREF: '/contatti/',
    ABOUT_HREF: '/chi-sono/'
  },
  en: {
    PRIVACY_HREF: '/en/privacy-policy/',
    TERMS_HREF: '/en/terms-of-service/',
    CONTACT_HREF: '/en/contact/',
    ABOUT_HREF: '/en/about/'
  }
};

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const NOINDEX = /<meta\b[^>]*name\s*=\s*["']robots["'][^>]*noindex/i;

/**
 * A twin only counts once it exists and is actually translated: the scaffold
 * carries a noindex marker until then. Both the language switch and the
 * hreflang set read this, so a half-finished translation is never presented as
 * the other language's version of a page — to a crawler or to a reader.
 */
function twinIsPublishable(route) {
  const file = path.resolve(process.cwd(), ENTRY_DIR, sourceDirForRoute(route), 'index.html');
  try {
    return !NOINDEX.test(fs.readFileSync(file, 'utf8'));
  } catch {
    return false;
  }
}

/** The twin to link to, or null when there is none worth linking. */
function publishableCounterpart(route) {
  const twin = counterpartOf(route);
  return twin && twinIsPublishable(twin) ? twin : null;
}

/** Placeholder values for the navbar template, for one page. */
function navbarTokens(route, lang) {
  const s = STRINGS[lang];
  const other = lang === 'it' ? 'en' : 'it';
  const twin = publishableCounterpart(route);
  const fallbackHome = other === 'it' ? '/' : '/en/';

  return {
    ...NAV_HREFS[lang],
    NAV_ARIA: s['nav.ariaMain'],
    LOGO_ALT: s['nav.logoAlt'],
    NAV_HOME: s['nav.home'],
    NAV_RESOURCES: s['nav.resources'],
    NAV_TOOLS: s['nav.tools'],
    NAV_COMPONENTS: s['nav.uiComponents'],
    NAV_TUTORIALS: s['nav.tutorials'],
    NAV_TEMPLATES: s['nav.templates'],
    SWITCH_HREF: twin || fallbackHome,
    SWITCH_LANG: other,
    SWITCH_LABEL: s['nav.switchLabel'],
    SWITCH_TITLE: s['nav.switchTo'],
    // A page without a twin sends the reader to the other language's home
    // instead of hiding the control; the marker keeps that case greppable.
    SWITCH_EXTRA: twin ? '' : ' data-lang-fallback="true"',
    // The two codes are always rendered in the same order (IT then EN) so the
    // knob has a fixed left/right position to slide between; which one is
    // selected is carried by data-active, not by the markup order.
    LANG_ACTIVE: lang
  };
}

/** Placeholder values for the footer template, for one page. */
function footerTokens(lang) {
  const s = STRINGS[lang];
  return {
    ...FOOTER_HREFS[lang],
    FOOTER_COPYRIGHT: s['footer.copyright'],
    FOOTER_PRIVACY: s['footer.privacy'],
    FOOTER_TERMS: s['footer.terms'],
    FOOTER_CONTACT: s['footer.contact'],
    FOOTER_ABOUT: s['footer.about'],
    FOOTER_BUG: s['footer.reportBug'],
    FOOTER_ICONS: s['footer.icons'],
    FOOTER_YT_ARIA: s['footer.youtubeAria'],
    FOOTER_GH_ARIA: s['footer.githubAria']
  };
}

function fillTokens(template, tokens) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : match
  );
}

/**
 * Replaces the navbar stub and appends the footer, both localized.
 * Supersedes the old staticNavbarHtmlPlugin / staticFooterHtmlPlugin, which
 * only knew about a single language.
 */
export function chromeI18nPlugin() {
  const projectRoot = process.cwd();
  const navbarPath = path.resolve(projectRoot, 'src/partials/navbar.html');
  const footerPath = path.resolve(projectRoot, 'src/partials/footer.html');
  const navbarRegex = /<nav\b[^>]*class=["']navbar["'][^>]*>([\s\S]*?)<\/nav>/i;
  const titleRegex = /<span\b[^>]*class=["']navbar-title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i;

  return {
    name: 'codedge-chrome-i18n',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const route = routeFromCtx(ctx, projectRoot);
        if (REDIRECT_STUBS.has(route)) return html;

        const lang = langOf(route);
        let updated = html;

        if (navbarRegex.test(updated)) {
          const navMatch = updated.match(navbarRegex);
          const titleMatch = navMatch[1].match(titleRegex);
          const title = titleMatch ? titleMatch[1].trim() : '';
          const navbar = fillTokens(
            fs.readFileSync(navbarPath, 'utf8').trim(),
            { ...navbarTokens(route, lang), TITLE: title }
          );
          updated = updated.replace(navbarRegex, navbar);
        }

        if (!/<footer\b/i.test(updated)) {
          const footer = fillTokens(
            fs.readFileSync(footerPath, 'utf8').trim(),
            footerTokens(lang)
          );
          updated = updated.replace(/<\/body>/i, `${footer}\n</body>`);
        }

        return updated;
      }
    }
  };
}

/**
 * Normalizes the language signals that are derivable from the route — <html
 * lang>, og:locale and the web app manifest — and injects the reciprocal
 * hreflang set. Pages without a translated twin get no hreflang at all, which
 * is what search engines expect: the tag must only ever point at a real
 * equivalent.
 */
export function hreflangPlugin() {
  const projectRoot = process.cwd();
  const baseUrl = readBaseUrl(projectRoot);

  return {
    name: 'codedge-hreflang',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const route = routeFromCtx(ctx, projectRoot);
        if (REDIRECT_STUBS.has(route)) return html;

        const lang = langOf(route);
        // A page still carrying the Italian source text is marked noindex by the
        // scaffold. It must not claim to be the English equivalent of anything:
        // no hreflang until it is actually translated.
        const isPending = NOINDEX.test(html);
        const candidate = isPending ? null : counterpartOf(route);
        const twin = candidate && twinIsPublishable(candidate) ? candidate : null;
        let updated = html;

        updated = updated.replace(/<html\b([^>]*)>/i, (match, attrs) => {
          const withoutLang = attrs.replace(/\slang=(?:"[^"]*"|'[^']*')/i, '');
          return `<html lang="${LANG_ATTR[lang]}"${withoutLang}>`;
        });

        updated = updated.replace(
          /(<meta\b[^>]*property=["']og:locale["'][^>]*content=)(?:"[^"]*"|'[^']*')/i,
          `$1"${OG_LOCALE[lang]}"`
        );

        // The manifest carries a name, a description and a start_url, all of
        // which are language-specific, so each tree points at its own. The two
        // declare different ids, so installing from an English page yields an
        // app that opens at /en/ rather than relabelling the Italian one.
        if (lang === 'en') {
          updated = updated.replace(
            /(<link\b[^>]*rel=["']manifest["'][^>]*href=)(?:"[^"]*"|'[^']*')/i,
            `$1"/site.en.webmanifest"`
          );
        }

        if (!twin) return updated;

        const itRoute = lang === 'it' ? route : twin;
        const enRoute = lang === 'it' ? twin : route;
        const alternates = [
          `<link rel="alternate" hreflang="it" href="${escapeAttr(baseUrl + itRoute)}" />`,
          `<link rel="alternate" hreflang="en" href="${escapeAttr(baseUrl + enRoute)}" />`,
          // Italian is the site default, so it also answers for unmatched locales.
          `<link rel="alternate" hreflang="x-default" href="${escapeAttr(baseUrl + itRoute)}" />`,
          `<meta property="og:locale:alternate" content="${OG_LOCALE[lang === 'it' ? 'en' : 'it']}" />`
        ].join('\n  ');

        // After the canonical when there is one: keeps the URL block together.
        if (/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(updated)) {
          return updated.replace(
            /(<link\b[^>]*rel=["']canonical["'][^>]*>)/i,
            `$1\n  ${alternates}`
          );
        }
        return updated.replace(/<\/head>/i, `  ${alternates}\n</head>`);
      }
    }
  };
}
