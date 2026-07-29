// Single source of truth for the IT <-> EN route pairing.
//
// Italian stays at the site root (existing URLs are already indexed and must
// not move); English lives under /en/ with translated slugs. Everything that
// needs to know how a page maps across languages reads from here: the language
// switch in the navbar, the hreflang tags, the sitemap alternates and the
// build-time checks.
//
// Keys are Italian routes, values are the English counterpart. Both sides are
// written with a leading and a trailing slash, exactly as they appear in URLs.

// The language served from the site root — a fact about URL shape, not about
// what a reader is shown: a reader who has chosen nothing is served English
// (see langPreferencePlugin in scripts/i18n-plugin.mjs).
export const ROOT_LANG = 'it';
export const LANGS = ['it', 'en'];
export const EN_PREFIX = '/en';

// The source tree is symmetric — pages/it/… and pages/en/… — but the URLs are
// not: Italian is served from the root, so pages/it/risorse/ is published at
// /risorse/, not at /it/risorse/. Those Italian URLs are already indexed and
// must never move. Everything that needs to turn a file path into a URL (or
// back) goes through the two helpers below rather than assuming the two shapes
// match.
export const LANG_DIR = { it: 'it', en: 'en' };

export const ROUTE_MAP = {
  '/': '/en/',

  // Top-level pages
  '/chi-sono/': '/en/about/',
  '/contatti/': '/en/contact/',
  '/privacy-policy/': '/en/privacy-policy/',
  '/termini-servizio/': '/en/terms-of-service/',
  '/template/': '/en/templates/',

  // Resources
  '/risorse/': '/en/resources/',
  '/risorse/glossario-html/': '/en/resources/html-glossary/',
  '/risorse/glossario-css/': '/en/resources/css-glossary/',
  '/risorse/glossario-js/': '/en/resources/javascript-glossary/',
  '/risorse/snippet-library/': '/en/resources/snippet-library/',

  // Tools
  '/strumenti/': '/en/tools/',
  '/strumenti/compressore-immagini/': '/en/tools/image-compressor/',
  '/strumenti/estrattore-palette/': '/en/tools/palette-extractor/',
  '/strumenti/generatore-colori/': '/en/tools/color-generator/',
  '/strumenti/generatore-gradienti/': '/en/tools/gradient-generator/',

  // UI components
  '/componenti-ui/': '/en/ui-components/',
  '/componenti-ui/card-interattive/': '/en/ui-components/interactive-cards/',
  '/componenti-ui/form/': '/en/ui-components/form/',
  '/componenti-ui/minimal-navbar/': '/en/ui-components/minimal-navbar/',
  '/componenti-ui/scroll-indicator/': '/en/ui-components/scroll-indicator/',

  // Tutorials
  '/tutorial/': '/en/tutorials/',
  '/tutorial/accessibilita-web-base/': '/en/tutorials/web-accessibility-basics/',
  '/tutorial/ai-sviluppo-solido/': '/en/tutorials/ai-assisted-development/',
  '/tutorial/browser-devtools/': '/en/tutorials/browser-devtools/',
  '/tutorial/css-fondamentali/': '/en/tutorials/css-fundamentals/',
  '/tutorial/deploy-base/': '/en/tutorials/deployment-basics/',
  '/tutorial/git-pratico-senza-panico/': '/en/tutorials/git-without-panic/',
  '/tutorial/github-operativo/': '/en/tutorials/github-in-practice/',
  '/tutorial/html-fondamentali/': '/en/tutorials/html-fundamentals/',
  '/tutorial/javascript-fondamentali/': '/en/tutorials/javascript-fundamentals/',
  '/tutorial/npm-vite-struttura-progetto/': '/en/tutorials/npm-vite-project-structure/',
  '/tutorial/seo-tecnico-base/': '/en/tutorials/technical-seo-basics/',
  '/tutorial/vscode-essenziale/': '/en/tutorials/vscode-essentials/'
};

// Legacy redirect stubs. They exist only to keep old Italian URLs alive, so
// they get no English twin, no hreflang and no sitemap entry.
export const REDIRECT_STUBS = new Set([
  '/percorsi-apprendimento/',
  '/percorsi-apprendimento/github-senza-panico/',
  '/percorsi-apprendimento/git-pratico-senza-panico/',
  '/percorsi-apprendimento/visual-studio-code-senza-panico/',
  '/tutorial/visual-studio-code-senza-panico/',
  '/shop-template/',
  '/footer/chi-sono/',
  '/footer/contatti/',
  '/footer/privacy-policy/',
  '/footer/termini-servizio/'
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

/** `it` for root routes, `en` for anything under /en/. */
export function langOf(route) {
  const normalized = normalizeRoute(route);
  return normalized === `${EN_PREFIX}/` || normalized.startsWith(`${EN_PREFIX}/`)
    ? 'en'
    : 'it';
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
 *   '/'            -> 'it'
 *   '/risorse/'    -> 'it/risorse'
 *   '/en/'         -> 'en'
 *   '/en/tools/'   -> 'en/tools'
 */
export function sourceDirForRoute(route) {
  const normalized = normalizeRoute(route);
  if (langOf(normalized) === 'en') {
    return `${LANG_DIR.en}${normalized.slice(EN_PREFIX.length).replace(/\/+$/, '')}`;
  }
  return `${LANG_DIR.it}${normalized.replace(/\/+$/, '')}`;
}

/**
 * Directory under pages/ -> URL route. The inverse of sourceDirForRoute; a
 * path outside a known language directory yields null so callers can skip it.
 */
export function routeFromSourceDir(relDir) {
  const clean = String(relDir || '').split('\\').join('/').replace(/^\/+|\/+$/g, '');
  const [head, ...rest] = clean.split('/').filter(Boolean);

  if (head === LANG_DIR.it) {
    return rest.length ? `/${rest.join('/')}/` : '/';
  }
  if (head === LANG_DIR.en) {
    return rest.length ? `${EN_PREFIX}/${rest.join('/')}/` : `${EN_PREFIX}/`;
  }
  return null;
}
