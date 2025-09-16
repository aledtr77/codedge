// src/pages/strumenti/estrattore-palette/main.js

// CSS globali
import "@/components/css/main.css";
import "@/components/css/navbar.css";
import "@/components/css/footer.css";
import "@/components/css/button.css";
import "@/components/css/breadcrumb.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import "./index.css";

// JS side-effect
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

  // Carico il componente solo se trovo elementi chiave
  if (document.getElementById("analyze") || document.getElementById("palette")) {
    const { initPaletteExtractor } = await import("@/pages/strumenti/estrattore-palette/estrattore-palette.js");
    initPaletteExtractor();
  }
});
