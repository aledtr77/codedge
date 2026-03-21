// src/scripts/pages/risorse/main.js
// Entry per la pagina "Risorse"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS specifico pagina
import '@/styles/pages/progetti-pratici/minimal-navbar/index.css';

// side-effect modules (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

// minimal-navbar (modulare, import statico - verrà incluso nello stesso bundle dell'entry)
import { initMinimalNavbar } from "@/scripts/pages/progetti-pratici/minimal-navbar/minimal-navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  // inizializza la minimal navbar (solo se presente)
  initMinimalNavbar();

  // qui puoi aggiungere altri init specifici per la pagina...
});
