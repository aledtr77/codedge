// src/scripts/pages/componenti-ui/card-interattive/main.js
// Entry per la pagina "Card contenuto"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/componenti-ui/detail.css';
import '@/styles/pages/componenti-ui/card-interattive/index.css';

// JS side-effect comuni (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import { initContentCards } from "@/scripts/pages/componenti-ui/card-interattive/card-interattive.js";

document.addEventListener("DOMContentLoaded", () => {
  initContentCards();
});
