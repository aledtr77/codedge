// src/scripts/pages/strumenti/compressore-immagini/main.js

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@/styles/components/breadcrumb.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/strumenti/compressore-immagini/index.css';

// JS condivisi (side-effect)
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
    onMount: (items) => console.log("breadcrumbs mounted", items),
  });

  // Carica il compressore solo se la pagina ha i suoi elementi
  if (document.getElementById("fileInput") || document.getElementById("uploadArea")) {
    const { initImageCompressor } = await import("@/scripts/pages/strumenti/compressore-immagini/compressore-immagini.js");
    initImageCompressor();
  }
});
