// src/components/js/footer.js
// Semplice loader del partial footer + piccolo adjust "sticky".
// Modalità d'uso (semplice):
//  - import '/src/components/js/footer.js' in main.js (o <script type="module" ...>)
//  - assicurati che il partial esista in public/partials/footer.html
//  - opzionale: inserisci <div id="footer-placeholder"></div> prima di </body> per controllare la posizione

(function () {
  'use strict';

  // Lista di URL da provare in ordine — public/ è servito come root da Vite,
  // quindi la prima voce '/partials/footer.html' è la più corretta.
  const FALLBACKS = [
    '/partials/footer.html',
    '/site-pages/partials/footer.html',
    '/site-pages/footer.html'
  ];

  // Inserisce il markup HTML del footer: preferisce il placeholder se presente,
  // altrimenti appende in fondo al body.
  function insertFooterHtml(html) {
    const placeholder = document.querySelector('#footer-placeholder');
    if (placeholder) {
      placeholder.innerHTML = html;
      console.log('Footer: inserito in #footer-placeholder');
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
      console.log('Footer: inserito in document.body (append)');
    }
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

    // esegui alcune volte per coprire caricamenti ritardati
    setTimeout(adjust, 0);
    setTimeout(adjust, 400);
    setTimeout(adjust, 1200);
    window.addEventListener('resize', adjust, { passive: true });
    window.addEventListener('orientationchange', adjust, { passive: true });
    window.addEventListener('load', adjust);
  }

  // Prova a caricare il partial usando la lista FALLBACKS (prima OK vince)
  async function loadFooter() {
    for (const url of FALLBACKS) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          console.warn(`Footer: fetch ${url} -> status ${res.status}`);
          continue;
        }
        const html = await res.text();
        insertFooterHtml(html);

        const footerEl = document.querySelector('footer');
        if (!footerEl) {
          console.error('Footer: markup inserito ma <footer> non trovato');
          return;
        }

        initFooterLinks(footerEl);
        initFooterAdjustment(footerEl);

        console.log('Footer: caricato correttamente da', url);
        return;
      } catch (err) {
        console.warn('Footer: errore fetching', url, err && err.message ? err.message : err);
        // prova il prossimo fallback
      }
    }
    console.error('Footer: tutti i tentativi falliti. Controlla che public/partials/footer.html esista e sia servito dal dev server.');
  }

  // Avvia al DOMContentLoaded (comportamento semplice, side-effect voluto)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    // se lo script viene eseguito dopo il DOM ready
    loadFooter();
  }

})();
