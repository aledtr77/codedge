// src/pages/progetti-pratici/card-interattive/main.js
// Entry per la pagina "Card Interattive"

// CSS globali
import "@/components/css/main.css";
import "@/components/css/navbar.css";
import "@/components/css/footer.css";
import "@/components/css/button.css";
import "@/components/css/breadcrumb.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import "./index.css";

// JS side-effect comuni (se li usano)
import "@/components/js/navbar.js";
import "@/components/js/navbar-loader.js";
import "@/components/js/button.js";
import "@/components/js/footer.js";

import initBreadcrumbs from "@/components/js/breadcrumb-loader.js";

// import statico del modulo delle card (verrà incluso nello stesso bundle dell'entry)
import { initInteractiveCards } from "@/pages/progetti-pratici/card-interattive/card-interattive.js";

document.addEventListener("DOMContentLoaded", () => {
  initBreadcrumbs({
    selector: "#breadcrumb-container",
    enableLog: true,
    rootUrl: "https://codedge.it/",
    currentIsLink: true,
    onMount: (items) => console.log("breadcrumbs mounted", items),
  });

  // Inizializza le card interattive solo se sono presenti elementi .card
  if (document.querySelector(".card")) {
    initInteractiveCards(".card", { unflipDelay: 1000 });
  }

  // Qui puoi aggiungere altri init specifici della pagina...
});
