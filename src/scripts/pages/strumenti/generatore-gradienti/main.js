// src/scripts/pages/risorse/main.js
// Entry per la pagina "Risorse"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@/styles/components/breadcrumb.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS specifico pagina
import '@/styles/pages/strumenti/generatore-gradienti/index.css';

// side-effect modules (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import initBreadcrumbs from "@/scripts/components/breadcrumb-loader.js";

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
        /* @vite-ignore */ "@/scripts/pages/strumenti/generatore-gradienti/generatore-gradienti.js"
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