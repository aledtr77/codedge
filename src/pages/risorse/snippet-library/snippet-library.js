// snippet-library.js (estratto / aggiornato)

// default offset
const DEFAULT_OFFSET = 110;

let _initialized = false;

function setCssScrollOffset(offset) {
  // imposta una variabile CSS globale che useremo in CSS per scroll-margin-top
  document.documentElement.style.setProperty('--scroll-offset', `${offset}px`);
}

function scrollToElementWithOffset(el, offset = DEFAULT_OFFSET) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

function scrollToId(id, offset = DEFAULT_OFFSET) {
  const el = document.getElementById(id);
  scrollToElementWithOffset(el, offset);
}

function updateScrollOffset(val) {
  if (typeof val !== 'number') return;
  window.SCROLL_OFFSET = val;
  setCssScrollOffset(val);
  console.log(`Offset scroll aggiornato a: ${val}px`);
}

/* --- other helpers (copy, toggle, prism etc) --- */

// ... (mantieni le tue funzioni copyToClipboard, toggleSnippet, attachCopyButtons, ecc.) ...

// attach anchors: usa window.SCROLL_OFFSET (se presente) come valore
function attachAnchorSmoothScroll(offset = DEFAULT_OFFSET) {
  const usedOffset = window.SCROLL_OFFSET || offset;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (a.__smoothBound) return;
    a.__smoothBound = true;
    a.addEventListener("click", function (ev) {
      const id = this.getAttribute("href").substring(1);
      if (!id) return;
      ev.preventDefault();
      const target = document.getElementById(id);
      if (target) scrollToElementWithOffset(target, usedOffset);
      // aggiorna history senza scroll automatico
      history.replaceState(null, '', `#${id}`);
    });
  });
}

// quando la pagina viene caricata con un hash (es. url#section), il browser può fare il salto prima.
// gestiamo il "load" e "hashchange" per riallinearci usando lo stesso offset.
function handleInitialHash(offset = DEFAULT_OFFSET) {
  const usedOffset = window.SCROLL_OFFSET || offset;
  // se c'è già un hash al load, posticipa lo scroll con requestIdleCallback / timeout per sovrascrivere il jump predefinito
  const doScroll = () => {
    const h = location.hash && location.hash.substring(1);
    if (h) {
      const el = document.getElementById(h);
      if (el) scrollToElementWithOffset(el, usedOffset);
    }
  };
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(doScroll);
    else setTimeout(doScroll, 50);
  });
  // se hash cambia a runtime (es. link esterno che imposta hash)
  window.addEventListener('hashchange', () => {
    doScroll();
  });
}

// export default init function (idempotente)
export default function initSnippetLibrary(options = {}) {
  if (_initialized) return;
  _initialized = true;

  const { scrollOffset = DEFAULT_OFFSET } = options;
  // salva e sincronizza CSS var
  if (typeof scrollOffset === 'number') {
    window.SCROLL_OFFSET = scrollOffset;
    setCssScrollOffset(scrollOffset);
  }

  document.addEventListener("DOMContentLoaded", () => {
    // inizializzazioni funzionalità
    attachAnchorSmoothScroll(window.SCROLL_OFFSET || scrollOffset);
    preventSidebarWheelLock?.();
    attachCopyButtons?.();
    attachToggleButtons?.();
    enhanceTitleButtons?.();
    exposeLegacyCopyFunction?.();
  });

  // gestisce hash iniziale e hashchange
  handleInitialHash(window.SCROLL_OFFSET || scrollOffset);

  initPrismHighlight?.();

  return {
    scrollToId,
    updateScrollOffset,
  };
}
