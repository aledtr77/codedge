// src/pages/progetti-pratici/scroll-indicator/main.js
// Entry per la pagina "Scroll Indicator"

// CSS globali
import "@/components/css/main.css";
import "@/components/css/navbar.css";
import "@/components/css/footer.css";
import "@/components/css/button.css";
import "@/components/css/breadcrumb.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import "./index.css";

// JS side-effect comuni
import "@/components/js/navbar.js";
import "@/components/js/navbar-loader.js";
import "@/components/js/button.js";
import "@/components/js/footer.js";

import initBreadcrumbs from "@/components/js/breadcrumb-loader.js";

// import statico del modulo scroll-indicator (modulare, ma incluso nello stesso bundle)
import { initScrollIndicator } from "@/pages/progetti-pratici/scroll-indicator/scroll-indicator.js";

document.addEventListener("DOMContentLoaded", () => {
  initBreadcrumbs({
    selector: "#breadcrumb-container",
    enableLog: true,
    rootUrl: "https://codedge.it/",
    currentIsLink: true,
  });

  // Inizializza lo scroll indicator (la funzione controlla se gli elementi esistono)
  initScrollIndicator({
    indicatorSelector: "#scrollIndicator",
    circleSelector: ".progress-ring__circle",
    visibleThresholdPercent: 10, // soglia per mostrare il pulsante
  });

  // ...altre inizializzazioni della pagina qui...
});
