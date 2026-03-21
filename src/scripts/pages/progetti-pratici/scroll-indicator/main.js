// src/scripts/pages/progetti-pratici/scroll-indicator/main.js
// Entry per la pagina "Scroll Indicator"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/progetti-pratici/scroll-indicator/index.css';

// JS side-effect comuni
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

// import statico del modulo scroll-indicator (modulare, ma incluso nello stesso bundle)
import { initScrollIndicator } from "@/scripts/pages/progetti-pratici/scroll-indicator/scroll-indicator.js";

document.addEventListener("DOMContentLoaded", () => {
  // Inizializza lo scroll indicator (la funzione controlla se gli elementi esistono)
  initScrollIndicator({
    indicatorSelector: "#scrollIndicator",
    circleSelector: ".progress-ring__circle",
    visibleThresholdPercent: 10, // soglia per mostrare il pulsante
  });

  // ...altre inizializzazioni della pagina qui...
});
