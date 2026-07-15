// src/scripts/pages/risorse/main.js
// Entry per la pagina "Risorse"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/card.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
// Responsive images via vite-imagetools
import percorsiIntroImageAvif from '@/assets/images/shop-template/percorsi-apprendimento.webp?w=480;800;1200&format=avif&as=srcset';
import percorsiIntroImageWebp from '@/assets/images/shop-template/percorsi-apprendimento.webp?w=480;800;1200&format=webp&as=srcset';
import fallbackPercorsiIntroImage from '@/assets/images/shop-template/percorsi-apprendimento.webp?width=1200';

import { setResponsiveImage } from '@/scripts/components/responsive-image.js';
import '@/styles/pages/percorsi-apprendimento/index.css';

// side-effect modules (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

document.addEventListener("DOMContentLoaded", () => {
  const introImage = document.querySelector('#percorsi-intro-image');
  if (introImage) {
    setResponsiveImage(introImage, {
      avifSrcset: percorsiIntroImageAvif,
      webpSrcset: percorsiIntroImageWebp,
      fallbackSrc: fallbackPercorsiIntroImage
    });
  }

  // Visualizzazione dei badge di superamento quiz sulle card dei tutorial
  const links = document.querySelectorAll('.learning-card a.button-simple');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const match = href.match(/\/tutorial\/([^/]+)\/?$/);
    if (match) {
      const quizId = match[1];
      const isCompleted = localStorage.getItem(`quiz-completed-${quizId}`);
      if (isCompleted === 'true') {
        const score = localStorage.getItem(`quiz-score-${quizId}`) || '10';
        const card = link.closest('.learning-card');
        if (card) {
          const badge = document.createElement('div');
          badge.className = 'learning-card__badge';
          badge.innerHTML = `<i class="fas fa-check-circle"></i> Quiz Superato: <strong>${score}/10</strong>`;
          
          // Inseriamo il badge subito prima del pulsante
          link.parentNode.insertBefore(badge, link);
        }
      }
    }
  });
});
