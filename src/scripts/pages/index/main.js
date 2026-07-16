// src/scripts/pages/index/main.js — minimalissimo e funzionale
import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/pages/index/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
// Responsive images via vite-imagetools
import homeHeroImageAvif from '@/assets/images/shop-template/home.jpg?w=480;800;1200&format=avif&as=srcset';
import homeHeroImageWebp from '@/assets/images/shop-template/home.jpg?w=480;800;1200&format=webp&as=srcset';
import fallbackHomeHeroImage from '@/assets/images/shop-template/home.jpg?width=1200';

import { setResponsiveImage } from '@/scripts/components/responsive-image.js';
import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';

// Run setResponsiveImage immediately because type="module" executes after DOM parsing is complete.
// This triggers image pre-loading and fetching as early as possible.
const heroImage = document.querySelector('#home-hero-image');
if (heroImage) {
  setResponsiveImage(heroImage, {
    avifSrcset: homeHeroImageAvif,
    webpSrcset: homeHeroImageWebp,
    fallbackSrc: fallbackHomeHeroImage
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // 3D Tilt Parallax Effect on Homepage Hero
  const heroFrame = document.querySelector('.hero-visual-frame');
  if (heroFrame && heroImage) {
    heroFrame.addEventListener('mousemove', (e) => {
      const rect = heroFrame.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Rotate image slightly based on cursor position (max 6 degrees for subtle look)
      const rotateX = -(y / rect.height) * 6;
      const rotateY = (x / rect.width) * 6;

      heroImage.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });

    heroFrame.addEventListener('mouseleave', () => {
      heroImage.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }
});
