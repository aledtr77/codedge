import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/card.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import componentsIntroImageAvif from '@/assets/images/shop-template/ui-components.webp?w=480;800;1200&format=avif&as=srcset';
import componentsIntroImageWebp from '@/assets/images/shop-template/ui-components.webp?w=480;800;1200&format=webp&as=srcset';
import fallbackComponentsIntroImage from '@/assets/images/shop-template/ui-components.webp?width=1200';

import { setResponsiveImage } from '@/scripts/components/responsive-image.js';
import '@/styles/pages/ui-components/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

const introImage = document.querySelector('#components-intro-image');
if (introImage) {
  setResponsiveImage(introImage, {
    avifSrcset: componentsIntroImageAvif,
    webpSrcset: componentsIntroImageWebp,
    fallbackSrc: fallbackComponentsIntroImage
  });
}
