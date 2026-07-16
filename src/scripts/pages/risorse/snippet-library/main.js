// src/scripts/pages/risorse/snippet-library/main.js

// CSS globali / page-specific (Vite li processa)
import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS specifico pagina
import '@/styles/pages/risorse/snippet-library/index.css';

// Prism (CSS + core + linguaggi) — consigliato installarlo via npm: `npm i prismjs`
import 'prismjs/themes/prism-tomorrow.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';

// CSS del Playground
import '@/styles/components/playground.css';

// JS condivisi (ESM)
import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';
import initGuidePlayground from '@/scripts/components/guide-playground.js';
// Import statico: i pulsanti dei box vengono iniettati nello stesso tick di
// quelli del playground, senza il pop-in ritardato del chunk dinamico.
import initSnippets from './snippet-library.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inizializza il playground per gli snippet HTML/CSS
  initGuidePlayground();

  // Inizializza sidebar, pill mobile, copia e toggle dei box
  initSnippets();

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


