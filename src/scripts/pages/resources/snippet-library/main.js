import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import '@/styles/pages/resources/snippet-library/index.css';

import 'prismjs/themes/prism-tomorrow.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';

import '@/styles/components/playground.css';

import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';
import initGuidePlayground from '@/scripts/components/guide-playground.js';
// Static import: box buttons are injected in the same tick as the
// playground ones, avoiding the delayed pop-in of a dynamic chunk.
import initSnippets from './snippet-library.js';

document.addEventListener('DOMContentLoaded', () => {
  initGuidePlayground();

  initSnippets();

  const runPrism = () => {
    // Works with the npm import above or a CDN-provided window.Prism
    if (window.Prism && typeof window.Prism.highlightAll === 'function') {
      window.Prism.highlightAll();
    } else if (Prism && typeof Prism.highlightAll === 'function') {
      Prism.highlightAll();
    } else {
      console.warn('Prism non disponibile per highlight');
    }
  };

  if ('requestIdleCallback' in window) requestIdleCallback(runPrism);
  else setTimeout(runPrism, 0);

  // Highlighting shreds each block into <span> tokens, and the code samples
  // carry translated comments and strings — so the language switch finds a
  // shape it cannot map and leaves the whole sample in the old language. Hand
  // back the plain text it was served with, then highlight the new one.
  window.addEventListener('codedge:lang-will-change', () => {
    document.querySelectorAll('pre > code').forEach(code => {
      if (!code.firstElementChild) return;
      code.replaceChildren(document.createTextNode(code.textContent));
    });
  });

  window.addEventListener('codedge:lang-changed', runPrism);
});

