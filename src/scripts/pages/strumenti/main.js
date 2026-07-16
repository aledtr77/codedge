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
import strumentiIntroImageAvif from '@/assets/images/shop-template/strumenti.webp?w=480;800;1200&format=avif&as=srcset';
import strumentiIntroImageWebp from '@/assets/images/shop-template/strumenti.webp?w=480;800;1200&format=webp&as=srcset';
import fallbackStrumentiIntroImage from '@/assets/images/shop-template/strumenti.webp?width=1200';

import { setResponsiveImage } from '@/scripts/components/responsive-image.js';
import '@/styles/pages/strumenti/index.css';
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

const introImage = document.querySelector('#strumenti-intro-image');
if (introImage) {
  setResponsiveImage(introImage, {
    avifSrcset: strumentiIntroImageAvif,
    webpSrcset: strumentiIntroImageWebp,
    fallbackSrc: fallbackStrumentiIntroImage
  });
}
