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
import risorseIntroImageAvif from '@/assets/images/shop-template/risorse.jpg?w=480;800;1200&format=avif&as=srcset';
import risorseIntroImageWebp from '@/assets/images/shop-template/risorse.jpg?w=480;800;1200&format=webp&as=srcset';
import fallbackRisorseIntroImage from '@/assets/images/shop-template/risorse.jpg?width=1200';

import { setResponsiveImage } from '@/scripts/components/responsive-image.js';
import '@/styles/pages/risorse/index.css';

// side-effect modules (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

document.addEventListener("DOMContentLoaded", () => {
  const introImage = document.querySelector('#risorse-intro-image');
  if (introImage) {
    setResponsiveImage(introImage, {
      avifSrcset: risorseIntroImageAvif,
      webpSrcset: risorseIntroImageWebp,
      fallbackSrc: fallbackRisorseIntroImage
    });
  }
});
