// src/scripts/components/footer.js
// Inizializza il footer già presente nel markup statico e gestisce il piccolo
// adjust "sticky" per le pagine con contenuto più corto della viewport.

(function () {
  'use strict';

  const READY_EVENT = 'codedge:footer-ready';
  function markReady() {
    if (window.__footerReady) return;
    window.__footerReady = true;
    window.dispatchEvent(new Event(READY_EVENT));
  }

  // Semplice normalizzazione dei link: se link senza href ma con data-href -> trasforma in href
  function initFooterLinks(container) {
    if (!container) return;
    container.querySelectorAll('a').forEach(a => {
      if (!a.getAttribute('href') && a.dataset && a.dataset.href) {
        a.setAttribute('href', a.dataset.href);
        delete a.dataset.href;
      }
      // fallback click handler (solo per link senza href)
      a.addEventListener('click', function (ev) {
        if (!this.getAttribute('href') && this.dataset && this.dataset.href) {
          ev.preventDefault();
          window.location.href = this.dataset.href;
        }
      });
    });
  }

  // Piccolo helper che rende il footer "fixed bottom" se il contenuto è più corto della viewport
  function initFooterAdjustment(footerEl) {
    if (!footerEl) return;

    let fixed = false;
    let oldPadding = '';
    let raf = null;

    function adjust() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const winH = window.innerHeight || document.documentElement.clientHeight;
        const docH = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          document.documentElement.offsetHeight,
          document.body.offsetHeight
        );
        const footerH = footerEl.offsetHeight || 0;
        const shouldFix = docH <= winH;
        if (shouldFix && !fixed) {
          Object.assign(footerEl.style, {
            position: 'fixed',
            left: '0',
            bottom: '0',
            width: '100%',
            zIndex: '1000'
          });
          oldPadding = document.body.style.paddingBottom || '';
          document.body.style.paddingBottom = footerH + 'px';
          fixed = true;
        } else if (!shouldFix && fixed) {
          footerEl.style.position = '';
          footerEl.style.left = '';
          footerEl.style.bottom = '';
          footerEl.style.width = '';
          footerEl.style.zIndex = '';
          document.body.style.paddingBottom = oldPadding || '';
          fixed = false;
        }
      });
    }

    // Applichiamo subito e al load completo: i timeout ritardati introducevano
    // un salto visibile del layout dopo il primo paint.
    setTimeout(adjust, 0);
    window.addEventListener('resize', adjust, { passive: true });
    window.addEventListener('orientationchange', adjust, { passive: true });
    window.addEventListener('load', adjust);
  }

  function loadFooter() {
    const footerEl = document.querySelector('footer');
    if (!footerEl) {
      markReady();
      return;
    }

    initFooterLinks(footerEl);
    initFooterAdjustment(footerEl);
    markReady();
  }

  // Avvia al DOMContentLoaded (comportamento semplice, side-effect voluto)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    // se lo script viene eseguito dopo il DOM ready
    loadFooter();
  }

})();
