// src/pages/strumenti/compressore-immagini/main.js

// CSS globali
import "@/components/css/main.css";
import "@/components/css/navbar.css";
import "@/components/css/footer.css";
import "@/components/css/button.css";
import "@/components/css/breadcrumb.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import "./index.css";

// JS condivisi (side-effect)
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
    onMount: (items) => console.log("breadcrumbs mounted", items),
  });

  // Carica il compressore solo se la pagina ha i suoi elementi
  if (document.getElementById("fileInput") || document.getElementById("uploadArea")) {
    const { initImageCompressor } = await import("@/pages/strumenti/compressore-immagini/compressore-immagini.js");
    initImageCompressor();
  }
});
