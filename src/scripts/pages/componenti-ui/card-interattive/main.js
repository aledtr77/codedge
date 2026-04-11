// src/scripts/pages/componenti-ui/card-interattive/main.js
// Entry per la pagina "Card Interattive"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/componenti-ui/card-interattive/index.css';

// JS side-effect comuni (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

// import statico del modulo delle card (verrà incluso nello stesso bundle dell'entry)
import { initInteractiveCards } from "@/scripts/pages/componenti-ui/card-interattive/card-interattive.js";

document.addEventListener("DOMContentLoaded", () => {
  // Inizializza le card interattive solo se sono presenti elementi .card
  if (document.querySelector(".card")) {
    initInteractiveCards(".card", { unflipDelay: 1000 });
  }

  // Qui puoi aggiungere altri init specifici della pagina...
});
