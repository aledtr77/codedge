// src/scripts/pages/index/main.js — minimalissimo e funzionale
import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/pages/index/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import homeHeroImage from '@/assets/images/shop-template/home.jpg';


import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';

document.addEventListener('DOMContentLoaded', () => {
  const heroImage = document.querySelector('#home-hero-image');
  if (heroImage) {
    heroImage.src = homeHeroImage;
  }
});
