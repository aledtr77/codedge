// Vite plugins for the bilingual (IT/EN) build.
//
//   chromeI18nPlugin()   fills the navbar/footer placeholders with the strings
//                        and hrefs of the page's own language, and injects the
//                        language switch pointing at the twin page
//   hreflangPlugin()     writes <html lang>, og:locale and the reciprocal
//                        hreflang tags from the shared route map
//   langPreferencePlugin() injects the head script that sends a reader to the
//                        language they chose, English until they choose
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
import { CRAWLER_UA_PATTERN } from './crawler-ua.mjs';

// Where the reader's chosen language is kept, and the language served to a
// reader who has not chosen one. src/scripts/components/lang-switch.js writes
// the key; the script below is the only thing that reads it.
export const LANG_STORAGE_KEY = 'codedge:lang';
export const FALLBACK_LANG = 'en';

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
    lang === 'it' ? '/it/' : '/'
  );
  return normalizeRoute(fromPath);
}

const OG_LOCALE = { it: 'it_IT', en: 'en_US' };
const LANG_ATTR = { it: 'it', en: 'en' };
const LANG_CODE = { it: 'IT', en: 'EN' };

// Section landing pages the navbar links to, per language.
const NAV_HREFS = {
  it: {
    HOME_HREF: '/it/',
    RESOURCES_HREF: '/it/risorse/',
    TOOLS_HREF: '/it/strumenti/',
    COMPONENTS_HREF: '/it/componenti-ui/',
    TUTORIALS_HREF: '/it/tutorial/',
    TEMPLATES_HREF: '/it/template/'
  },
  en: {
    HOME_HREF: '/',
    RESOURCES_HREF: '/resources/',
    TOOLS_HREF: '/tools/',
    COMPONENTS_HREF: '/ui-components/',
    TUTORIALS_HREF: '/tutorials/',
    TEMPLATES_HREF: '/templates/'
  }
};

const FOOTER_HREFS = {
  it: {
    PRIVACY_HREF: '/it/privacy-policy/',
    TERMS_HREF: '/it/termini-servizio/',
    CONTACT_HREF: '/it/contatti/',
    ABOUT_HREF: '/it/chi-sono/'
  },
  en: {
    PRIVACY_HREF: '/privacy-policy/',
    TERMS_HREF: '/terms-of-service/',
    CONTACT_HREF: '/contact/',
    ABOUT_HREF: '/about/'
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
  const fallbackHome = other === 'it' ? '/it/' : '/';

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
    // The two codes are always rendered in the same order (EN then IT) so the
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
        // declare different ids, so installing from an Italian page yields an
        // app that opens at /it/ rather than relabelling the English one.
        if (lang === 'it') {
          updated = updated.replace(
            /(<link\b[^>]*rel=["']manifest["'][^>]*href=)(?:"[^"]*"|'[^']*')/i,
            `$1"/site.it.webmanifest"`
          );
        }

        if (!twin) return updated;

        const itRoute = lang === 'it' ? route : twin;
        const enRoute = lang === 'it' ? twin : route;
        const alternates = [
          `<link rel="alternate" hreflang="it" href="${escapeAttr(baseUrl + itRoute)}" />`,
          `<link rel="alternate" hreflang="en" href="${escapeAttr(baseUrl + enRoute)}" />`,
          // English is what a reader without a stored preference is served, so
          // it is also what answers for a locale neither version matches.
          `<link rel="alternate" hreflang="x-default" href="${escapeAttr(baseUrl + enRoute)}" />`,
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

/**
 * The inline script that decides, before anything is fetched or painted, which
 * language this reader gets.
 *
 * Two documents exist for every page and the URL alone says which one you are
 * looking at, so a preference can only be honoured by moving to the other URL.
 * That is what this does, and why it has to be the first thing in the head:
 * everything the browser starts before it — fonts, stylesheets, the module
 * graph — is work thrown away by the hop.
 *
 * The rules, in order:
 *   a stored choice wins, always, on every page and every visit;
 *   without one, the reader gets English, whatever their browser asks for;
 *   a crawler is never moved, so both language trees stay indexable and each
 *     URL keeps answering in the language it was indexed in.
 *
 * `location.replace` rather than an assignment: the page being left was never
 * the reader's destination, and must not sit in the history as a step Back
 * returns to (it would redirect again, trapping them).
 */
export function langPreferencePlugin() {
  const projectRoot = process.cwd();

  return {
    name: 'codedge-lang-preference',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const route = routeFromCtx(ctx, projectRoot);
        if (REDIRECT_STUBS.has(route)) return html;

        // No twin worth showing — an untranslated scaffold, a page that exists
        // in one language only — means there is nowhere to send anyone: the
        // reader stays here rather than landing on Italian text under /en/.
        const twin = publishableCounterpart(route);
        if (!twin) return html;

        const lang = langOf(route);
        const script = [
          '(function(){try{',
          `if(/${CRAWLER_UA_PATTERN}/i.test(navigator.userAgent))return;`,
          'var w=null;',
          `try{w=localStorage.getItem(${JSON.stringify(LANG_STORAGE_KEY)})}catch(e){}`,
          `if(w!=="it"&&w!=="en")w=${JSON.stringify(FALLBACK_LANG)};`,
          `if(w===${JSON.stringify(lang)})return;`,
          // The query and the fragment belong to the reader (a pinned palette,
          // the section they were sent to), not to the language.
          `location.replace(${JSON.stringify(twin)}+location.search+location.hash);`,
          '}catch(e){}})();'
        ].join('');

        return html.replace(
          /<head\b[^>]*>/i,
          (match) => `${match}\n  <script data-lang-preference>${script}</script>`
        );
      }
    }
  };
}
