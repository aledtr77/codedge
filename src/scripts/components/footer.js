// src/scripts/components/footer.js
// Inietta il footer da template inline + piccolo adjust "sticky".
// Modalità d'uso (semplice):
//  - import '/src/scripts/components/footer.js' in main.js (o <script type="module" ...>)
//  - opzionale: inserisci <div id="footer-placeholder"></div> prima di </body> per controllare la posizione

(function () {
  'use strict';

  const READY_EVENT = 'codedge:footer-ready';
  const FOOTER_MARKUP = `
<footer>
  <div class="footer-content">
    <div class="footer-links">
      <div class="footer-copyright">
        © 2025 Codedge. Tutti i diritti riservati.
      </div>
      <a href="/footer/privacy-policy/">Privacy Policy</a>
      <a href="/footer/termini-servizio/">Termini di Servizio</a>
      <a href="/footer/contatti/">Contatti</a>
      <a href="/footer/chi-sono/">Chi Sono</a>
      <a href="https://fontawesome.com/">Icone di Font Awesome</a>
    </div>
    <div class="footer-social">
      <a
        href="https://www.instagram.com/codedgestudio?igsh=MXJzcWxjNnpuNG5yZQ=="
        class="footer-social-link footer-social-link-instagram"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram Codedge"
        title="Instagram Codedge"
      >
        <i class="fa-brands fa-instagram" aria-hidden="true"></i>
      </a>
    </div>
  </div>
</footer>
`.trim();

  function markReady() {
    if (window.__footerReady) return;
    window.__footerReady = true;
    window.dispatchEvent(new Event(READY_EVENT));
  }

  // Inserisce il markup HTML del footer: preferisce il placeholder se presente,
  // altrimenti appende in fondo al body.
  function insertFooterHtml(html) {
    const placeholder = document.querySelector('#footer-placeholder');
    if (placeholder) {
      placeholder.innerHTML = html;
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
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

    // Applichiamo subito e al load completo: i timeout ritardati introducevano
    // un salto visibile del layout dopo il primo paint.
    setTimeout(adjust, 0);
    window.addEventListener('resize', adjust, { passive: true });
    window.addEventListener('orientationchange', adjust, { passive: true });
    window.addEventListener('load', adjust);
  }

  function loadFooter() {
    if (!document.querySelector('footer')) {
      insertFooterHtml(FOOTER_MARKUP);
    }

    const footerEl = document.querySelector('footer');
    if (!footerEl) {
      console.error('Footer: markup inserito ma <footer> non trovato');
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
