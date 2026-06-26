// src/scripts/pages/componenti-ui/scroll-indicator/main.js
// Entry per la pagina "Indice lettura"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/componenti-ui/detail.css';
import '@/styles/pages/componenti-ui/scroll-indicator/index.css';

// JS side-effect comuni
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import { initReadingProgress } from "@/scripts/pages/componenti-ui/scroll-indicator/scroll-indicator.js";

document.addEventListener("DOMContentLoaded", () => {
  initReadingProgress();
});
