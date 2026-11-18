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
import { counterpartOf } from '@/i18n/routes.mjs';
import { t } from '@/i18n/ui.js';
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

function renderQuizBadges() {
  document.querySelectorAll('.learning-card__badge').forEach((badge) => badge.remove());
  // Quiz-passed badges on the tutorial cards
  const links = document.querySelectorAll('.learning-card a.button-simple');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const route = href.startsWith('/it/') ? href : counterpartOf(href);
    const match = route?.match(/^\/it\/tutorial\/([^/]+)\/$/);
    if (match) {
      const quizId = match[1];
      let isCompleted;
      let score;
      try {
        isCompleted = localStorage.getItem(`quiz-completed-${quizId}`);
        score = Number(localStorage.getItem(`quiz-score-${quizId}`));
      } catch {
        return;
      }
      if (isCompleted === 'true') {
        if (!Number.isInteger(score) || score < 6 || score > 10) return;
        const card = link.closest('.learning-card');
        if (card) {
          const badge = document.createElement('div');
          badge.className = 'learning-card__badge';
          const icon = document.createElement('i');
          icon.className = 'fas fa-check-circle';
          icon.setAttribute('aria-hidden', 'true');
          const result = document.createElement('strong');
          result.textContent = `${score}/10`;
          badge.append(icon, ` ${t('quiz.passedBadge')} `, result);
          
          link.parentNode.insertBefore(badge, link);
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', renderQuizBadges);
window.addEventListener('codedge:lang-changed', renderQuizBadges);
