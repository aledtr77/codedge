// src/pages/risorse/snippet-library/main.js

// CSS globali / page-specific (Vite li processa)
import '@/components/css/main.css';
import '@/components/css/navbar.css';
import '@/components/css/footer.css';
import '@/components/css/breadcrumb.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS specifico pagina
import './index.css';

// Prism (CSS + core + linguaggi) — consigliato installarlo via npm: `npm i prismjs`
import 'prismjs/themes/prism-tomorrow.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';

// JS condivisi (ESM)
import '@/components/js/navbar.js';
import '@/components/js/navbar-loader.js';
import '@/components/js/footer.js';
import initBreadcrumbs from '@/components/js/breadcrumb-loader.js';

document.addEventListener('DOMContentLoaded', async () => {
  // --- breadcrumbs (manteniamo la tua configurazione) ---
  initBreadcrumbs({
    selector: "#breadcrumb-container",
    enableLog: true,
    rootUrl: "https://codedge.it/",
    currentIsLink: true,
    onMount: (items) => console.log("mounted", items),
  });

  // --- import condizionale del modulo degli snippet (solo se servono) ---
  if (document.querySelector('.snippet-box') || document.querySelector('.snippet-sidebar')) {
    try {
      // controlla che il file esista nello stesso folder: ./snippet-library.js
      const mod = await import('./snippet-library.js');
      const init = mod.default || mod.initSnippets;
      if (typeof init === 'function') {
        init({ scrollOffset: 110 }); // passa opzioni se vuoi
      } else {
        console.warn('snippet module imported but has no default export function');
      }
    } catch (err) {
      console.error('Errore import snippet-library:', err);
    }
  }

  // --- Prism highlighting: esegui in idle (o setTimeout come fallback) ---
  const runPrism = () => {
    // supporta sia l'import npm (Prism importato sopra) sia il CDN (window.Prism)
    if (window.Prism && typeof window.Prism.highlightAll === 'function') {
      window.Prism.highlightAll();
    } else if (Prism && typeof Prism.highlightAll === 'function') {
      Prism.highlightAll();
    } else {
      // non fatal: probabilmente Prism non è stato caricato (CDN o npm mancante)
      console.warn('Prism non disponibile per highlight');
    }
  };

  if ('requestIdleCallback' in window) requestIdleCallback(runPrism);
  else setTimeout(runPrism, 0);
});



