// src/components/js/breadcrumb-loader.js
// ES module loader per breadcrumbs (importa e chiama esplicitamente).
// Opzioni: { selector, enableLog, jsonCandidates, rootUrl, onMount, force, currentIsLink }
// Piccola patch: normalizePath rimuove eventuali '/site-pages/' e '/html/' residui
// per evitare che la fallback path generi la briciola "site-pages" nella build/preview.

export default async function initBreadcrumbs(opts = {}) {
  const DEFAULT_SELECTOR = '#breadcrumb-container';
  const DEFAULT_JSONS = ['/generated/breadcrumbs.json', '/src/generated/breadcrumbs.json'];

  const selector = opts.selector || DEFAULT_SELECTOR;
  const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
  const enableLog = !!opts.enableLog;
  const jsonCandidates = opts.jsonCandidates || DEFAULT_JSONS;
  const currentIsLink = !!opts.currentIsLink;

  const log = (...args) => enableLog && console.log('[breadcrumb-loader]', ...args);

  if (!container) {
    log('container non trovato:', selector);
    return null;
  }

  // Normalize path: rimuove query/hash, pulisce double slashes, index.html
  // PATCH: rimuove eventuali occorrenze di 'site-pages' e 'html' che possono comparire in preview/build
  function normalizePath(p) {
    if (!p) p = location.pathname || '/';
    p = String(p).split('?')[0].split('#')[0];

    // ----- PATCH: rimuovi eventuali occorrenze di 'site-pages' o 'html' -----
    // rimuove '/site-pages/' ovunque compaia (es. /site-pages/risorse/ -> /risorse/)
    p = p.replace(/\/site-pages\//g, '/');
    // rimuove 'site-pages' se è l'unico segmento dopo la slash iniziale (es. '/site-pages' -> '/')
    p = p.replace(/^\/site-pages(\/?)/, '/');
    // rimuove anche eventuali '/html/' residui
    p = p.replace(/\/html\//g, '/');
    // --------------------------------------------------------------------

    p = p.replace(/\/index(\.html?)?$/i, '/');
    if (!p.startsWith('/')) p = '/' + p;
    p = p.replace(/\/+/g, '/');
    if (p !== '/' && !p.endsWith('/')) p = p + '/';
    return p;
  }

  function humanize(segment) {
    segment = String(segment || '').replace(/[-_]+/g, ' ').trim();
    return segment.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }

  async function tryLoadJson(candidates) {
    for (const url of candidates) {
      try {
        log('tentativo fetch JSON ->', url);
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        log('JSON caricato da', url);
        return { json, source: url };
      } catch (err) {
        log('fetch fallito per', url, err && err.message);
      }
    }
    return null;
  }

  function ensureAbsoluteUrls(items, rootUrl) {
    if (!Array.isArray(items)) return items || [];
    return items.map(it => {
      if (!it || !it.url) return it;
      try {
        new URL(it.url);
        return it;
      } catch (e) {
        try {
          return Object.assign({}, it, { url: new URL(it.url, rootUrl).href });
        } catch (e2) {
          return it;
        }
      }
    });
  }

  function fallbackFromPath(rootUrl, pathname) {
    const norm = normalizePath(pathname);
    const parts = norm.split('/').filter(Boolean);
    const items = [];
    items.push({ label: 'Home', url: new URL('/', rootUrl).href, current: parts.length === 0 });
    let cumulative = '/';
    for (let i = 0; i < parts.length; i++) {
      cumulative += parts[i] + '/';
      items.push({
        label: humanize(parts[i]),
        url: new URL(cumulative, rootUrl).href,
        current: i === parts.length - 1
      });
    }
    if (items.length === 1) items[0].current = true;
    return items;
  }

  // build DOM nav: se currentIsLink === true, anche l'ultimo item viene renderizzato come <a> con aria-current
  function buildNav(items) {
    const nav = document.createElement('nav');
    nav.className = 'breadcrumb-nav';
    nav.setAttribute('aria-label', 'Breadcrumb');

    const ol = document.createElement('ol');
    ol.className = 'breadcrumb-list';

    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'breadcrumb-item';

      const isLast = idx === items.length - 1;
      const shouldRenderAsLink = !item.current || (item.current && currentIsLink);

      if (shouldRenderAsLink) {
        const a = document.createElement('a');
        a.className = 'breadcrumb-link';
        a.href = item.url;
        a.textContent = item.label;
        a.setAttribute('role', 'link');
        if (item.current) {
          // se è current ma vogliamo il link (currentIsLink), manteniamo aria-current per accessibilità
          a.setAttribute('aria-current', 'page');
        }
        li.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.className = 'breadcrumb-current';
        span.setAttribute('aria-current', 'page');
        span.textContent = item.label;
        li.appendChild(span);
      }

      ol.appendChild(li);
    });

    nav.appendChild(ol);
    return nav;
  }

  if (window.__breadcrumbsLoaded && !opts.force) {
    log('breadcrumbs già caricate — usa {force:true} per forzare');
    return window.__breadcrumbsItems || null;
  }

  let rootUrl = opts.rootUrl || null;
  const loaded = await tryLoadJson(jsonCandidates);
  let json = null;
  if (loaded) {
    json = loaded.json;
    if (!rootUrl && json.rootUrl) rootUrl = json.rootUrl;
  }

  if (!rootUrl) {
    const c = document.querySelector('link[rel="canonical"]');
    if (c && c.href) rootUrl = c.href.replace(/\/?$/, '/');
    else rootUrl = location.origin.replace(/\/?$/, '/');
  } else {
    if (!rootUrl.endsWith('/')) rootUrl = rootUrl + '/';
  }

  log('rootUrl finale =', rootUrl);

  let items = null;
  const currentPath = normalizePath(location.pathname);
  log('currentPath normalizzato =', currentPath);

  if (json && json.pages && typeof json.pages === 'object') {
    items = json.pages[currentPath];

    if (!items) {
      const alt = currentPath.replace(/^\/(site-pages|html)\//, '/');
      if (json.pages[alt]) items = json.pages[alt];
    }

    if (!items) {
      const alt2 = currentPath.replace(/\/$/, '');
      if (alt2 && json.pages[alt2]) items = json.pages[alt2];
    }

    if (!items) {
      let best = null;
      for (const k of Object.keys(json.pages)) {
        if (currentPath.startsWith(k)) {
          if (!best || k.length > best.length) best = k;
        }
      }
      if (best) {
        log('prefix match trovato ->', best);
        items = json.pages[best];
      }
    }

    if (items) items = ensureAbsoluteUrls(items, rootUrl);
  }

  if (!items) {
    log('nessuna voce trovata nel JSON; costruisco fallback da pathname');
    items = fallbackFromPath(rootUrl, location.pathname);
  }

  // Forza che Home sia current SOLO se siamo nella root '/'
  try {
    const isRoot = currentPath === '/';
    if (items && items.length > 0) {
      items = ensureAbsoluteUrls(items, rootUrl);
      items[0].current = !!isRoot;
    }
  } catch (e) {
    log('errore nel forzare lo stato Home/current', e && e.message);
  }

  // mount into DOM
  try {
    container.innerHTML = '';
    const nav = buildNav(items);
    container.appendChild(nav);
    container.setAttribute('aria-hidden', 'false');
  } catch (err) {
    log('errore montaggio DOM', err && err.message);
  }

  window.__breadcrumbsItems = items;
  window.__breadcrumbsLoaded = true;

  if (opts.onMount && typeof opts.onMount === 'function') {
    try { opts.onMount(items); } catch (e) { log('onMount callback error', e && e.message); }
  }

  return items;
}
