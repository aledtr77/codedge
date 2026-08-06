import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/card.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import resourcesIntroImageAvif from '@/assets/images/shop-template/resources.jpg?w=480;800;1200&format=avif&as=srcset';
import resourcesIntroImageWebp from '@/assets/images/shop-template/resources.jpg?w=480;800;1200&format=webp&as=srcset';
import fallbackResourcesIntroImage from '@/assets/images/shop-template/resources.jpg?width=1200';

import { setResponsiveImage } from '@/scripts/components/responsive-image.js';
import '@/styles/pages/resources/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

const introImage = document.querySelector('#resources-intro-image');
if (introImage) {
  setResponsiveImage(introImage, {
    avifSrcset: resourcesIntroImageAvif,
    webpSrcset: resourcesIntroImageWebp,
    fallbackSrc: fallbackResourcesIntroImage
  });
}
