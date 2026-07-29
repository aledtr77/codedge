// Single source of truth for the IT <-> EN route pairing.
//
// English is the language the site opens in, so it holds the root: /resources/,
// /tools/, and the home at /. Italian lives under /it/ with its own slugs.
// Everything that needs to know how a page maps across languages reads from
// here: the language switch in the navbar, the hreflang tags, the sitemap
// alternates and the build-time checks.
//
// Keys are Italian routes, values are the English counterpart. Both sides are
// written with a leading and a trailing slash, exactly as they appear in URLs.
//
// The Italian URLs used to be the ones at the root. They moved on 29/07/2026,
// and every one of them is answered by a 301 in public/_redirects — that file
// and this map have to be changed together, or an indexed URL dies quietly.

// The language served from the site root: the one a reader gets without asking
// for anything (see langPreferencePlugin in scripts/i18n-plugin.mjs).
export const ROOT_LANG = 'en';
export const LANGS = ['it', 'en'];
export const IT_PREFIX = '/it';

// The source tree is symmetric — pages/it/… and pages/en/… — but the URLs are
// not: English is served from the root, so pages/en/resources/ is published at
// /resources/, not at /en/resources/. Everything that needs to turn a file path
// into a URL (or back) goes through the two helpers below rather than assuming
// the two shapes match.
export const LANG_DIR = { it: 'it', en: 'en' };

export const ROUTE_MAP = {
  '/it/': '/',

  // Top-level pages
  '/it/chi-sono/': '/about/',
  '/it/contatti/': '/contact/',
  '/it/privacy-policy/': '/privacy-policy/',
  '/it/termini-servizio/': '/terms-of-service/',
  '/it/template/': '/templates/',

  // Resources
  '/it/risorse/': '/resources/',
  '/it/risorse/glossario-html/': '/resources/html-glossary/',
  '/it/risorse/glossario-css/': '/resources/css-glossary/',
  '/it/risorse/glossario-js/': '/resources/javascript-glossary/',
  '/it/risorse/snippet-library/': '/resources/snippet-library/',

  // Tools
  '/it/strumenti/': '/tools/',
  '/it/strumenti/compressore-immagini/': '/tools/image-compressor/',
  '/it/strumenti/estrattore-palette/': '/tools/palette-extractor/',
  '/it/strumenti/generatore-colori/': '/tools/color-generator/',
  '/it/strumenti/generatore-gradienti/': '/tools/gradient-generator/',

  // UI components
  '/it/componenti-ui/': '/ui-components/',
  '/it/componenti-ui/card-interattive/': '/ui-components/interactive-cards/',
  '/it/componenti-ui/form/': '/ui-components/form/',
  '/it/componenti-ui/minimal-navbar/': '/ui-components/minimal-navbar/',
  '/it/componenti-ui/scroll-indicator/': '/ui-components/scroll-indicator/',

  // Tutorials
  '/it/tutorial/': '/tutorials/',
  '/it/tutorial/accessibilita-web-base/': '/tutorials/web-accessibility-basics/',
  '/it/tutorial/ai-sviluppo-solido/': '/tutorials/ai-assisted-development/',
  '/it/tutorial/browser-devtools/': '/tutorials/browser-devtools/',
  '/it/tutorial/css-fondamentali/': '/tutorials/css-fundamentals/',
  '/it/tutorial/deploy-base/': '/tutorials/deployment-basics/',
  '/it/tutorial/git-pratico-senza-panico/': '/tutorials/git-without-panic/',
  '/it/tutorial/github-operativo/': '/tutorials/github-in-practice/',
  '/it/tutorial/html-fondamentali/': '/tutorials/html-fundamentals/',
  '/it/tutorial/javascript-fondamentali/': '/tutorials/javascript-fundamentals/',
  '/it/tutorial/npm-vite-struttura-progetto/': '/tutorials/npm-vite-project-structure/',
  '/it/tutorial/seo-tecnico-base/': '/tutorials/technical-seo-basics/',
  '/it/tutorial/vscode-essenziale/': '/tutorials/vscode-essentials/'
};

// Legacy redirect stubs. They exist only to keep old Italian URLs alive, so
// they get no English twin, no hreflang and no sitemap entry.
export const REDIRECT_STUBS = new Set([
  '/it/percorsi-apprendimento/',
  '/it/percorsi-apprendimento/github-senza-panico/',
  '/it/percorsi-apprendimento/git-pratico-senza-panico/',
  '/it/percorsi-apprendimento/visual-studio-code-senza-panico/',
  '/it/tutorial/visual-studio-code-senza-panico/',
  '/it/shop-template/',
  '/it/footer/chi-sono/',
  '/it/footer/contatti/',
  '/it/footer/privacy-policy/',
  '/it/footer/termini-servizio/'
]);

const EN_TO_IT = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([it, en]) => [en, it])
);

/** Normalizes any path into the `/segment/` form used as a map key. */
export function normalizeRoute(pathname) {
  const clean = String(pathname || '/')
    .split('?')[0]
    .split('#')[0]
    .replace(/index\.html$/i, '')
    .replace(/\/+$/, '');

  return clean === '' ? '/' : `${clean}/`;
}

/** `it` for anything under /it/, `en` for root routes. */
export function langOf(route) {
  const normalized = normalizeRoute(route);
  return normalized === `${IT_PREFIX}/` || normalized.startsWith(`${IT_PREFIX}/`)
    ? 'it'
    : 'en';
}

/** The same page in the other language, or null when it has no twin. */
export function counterpartOf(route) {
  const normalized = normalizeRoute(route);
  if (REDIRECT_STUBS.has(normalized)) return null;
  return langOf(normalized) === 'it'
    ? ROUTE_MAP[normalized] ?? null
    : EN_TO_IT[normalized] ?? null;
}

/** Both language variants of a page, keyed by lang. Missing twins are omitted. */
export function alternatesOf(route) {
  const normalized = normalizeRoute(route);
  const lang = langOf(normalized);
  const twin = counterpartOf(normalized);
  const out = { [lang]: normalized };
  if (twin) out[lang === 'it' ? 'en' : 'it'] = twin;
  return out;
}

/** Every route that has a translated twin, as [itRoute, enRoute] pairs. */
export function routePairs() {
  return Object.entries(ROUTE_MAP);
}

/**
 * URL route -> directory under pages/, without leading or trailing slashes.
 *   '/'              -> 'en'
 *   '/resources/'    -> 'en/resources'
 *   '/it/'           -> 'it'
 *   '/it/risorse/'   -> 'it/risorse'
 */
export function sourceDirForRoute(route) {
  const normalized = normalizeRoute(route);
  if (langOf(normalized) === 'it') {
    return `${LANG_DIR.it}${normalized.slice(IT_PREFIX.length).replace(/\/+$/, '')}`;
  }
  return `${LANG_DIR.en}${normalized.replace(/\/+$/, '')}`;
}

/**
 * Directory under pages/ -> URL route. The inverse of sourceDirForRoute; a
 * path outside a known language directory yields null so callers can skip it.
 */
export function routeFromSourceDir(relDir) {
  const clean = String(relDir || '').split('\\').join('/').replace(/^\/+|\/+$/g, '');
  const [head, ...rest] = clean.split('/').filter(Boolean);

  if (head === LANG_DIR.it) {
    return rest.length ? `${IT_PREFIX}/${rest.join('/')}/` : `${IT_PREFIX}/`;
  }
  if (head === LANG_DIR.en) {
    return rest.length ? `/${rest.join('/')}/` : '/';
  }
  return null;
}
