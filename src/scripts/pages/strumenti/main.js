// src/scripts/pages/risorse/main.js
// Entry per la pagina "Risorse"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/card.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import strumentiIntroImage from '@/assets/images/shop-template/strumenti.webp';

// CSS specifico pagina
import '@/styles/pages/strumenti/index.css';

// side-effect modules (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

document.addEventListener("DOMContentLoaded", () => {
  const introImage = document.querySelector('#strumenti-intro-image');
  if (introImage) {
    introImage.src = strumentiIntroImage;
  }
});
