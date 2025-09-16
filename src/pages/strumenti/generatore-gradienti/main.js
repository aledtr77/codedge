// src/pages/risorse/main.js
// Entry per la pagina "Risorse"

// CSS globali
import "@/components/css/main.css";
import "@/components/css/navbar.css";
import "@/components/css/footer.css";
import "@/components/css/button.css";
import "@/components/css/breadcrumb.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS specifico pagina
import "./index.css";

// side-effect modules (se li usano)
import "@/components/js/navbar.js";
import "@/components/js/navbar-loader.js";
import "@/components/js/button.js";
import "@/components/js/footer.js";

import initBreadcrumbs from "@/components/js/breadcrumb-loader.js";

document.addEventListener("DOMContentLoaded", async () => {
  initBreadcrumbs({
    selector: "#breadcrumb-container",
    enableLog: true,
    rootUrl: "https://codedge.it/",
    currentIsLink: true,
    onMount: (items) => console.log("mounted", items),
  });

  // se la pagina ha l'elemento del generatore, carichiamo il modulo separato
  if (document.getElementById("previewBox")) {
    try {
      // usa alias '@' per puntare a src/
      const mod = await import(
        /* @vite-ignore */ "@/pages/strumenti/generatore-gradienti/generatore-gradienti.js"
      );
      // se il modulo esporta default() la chiamiamo
      if (mod && typeof mod.default === "function") {
        mod.default();
      } else if (mod && typeof mod.initGeneratorGradienti === "function") {
        mod.initGeneratorGradienti();
      }
    } catch (err) {
      console.error("Impossibile caricare il modulo generatore-gradienti:", err);
    }
  }
});