import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/card.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import tutorialsIntroImageAvif from '@/assets/images/shop-template/tutorials.webp?w=480;800;1200&format=avif&as=srcset';
import tutorialsIntroImageWebp from '@/assets/images/shop-template/tutorials.webp?w=480;800;1200&format=webp&as=srcset';
import fallbackTutorialsIntroImage from '@/assets/images/shop-template/tutorials.webp?width=1200';

import { setResponsiveImage } from '@/scripts/components/responsive-image.js';
import '@/styles/pages/tutorials/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

const introImage = document.querySelector('#tutorials-intro-image');
if (introImage) {
  setResponsiveImage(introImage, {
    avifSrcset: tutorialsIntroImageAvif,
    webpSrcset: tutorialsIntroImageWebp,
    fallbackSrc: fallbackTutorialsIntroImage
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Quiz-passed badges on the tutorial cards
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
          
          link.parentNode.insertBefore(badge, link);
        }
      }
    }
  });
});
