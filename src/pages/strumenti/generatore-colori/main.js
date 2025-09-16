// src/pages/strumenti/generatore-colori/main.js

// CSS globali
import "@/components/css/main.css";
import "@/components/css/navbar.css";
import "@/components/css/footer.css";
import "@/components/css/button.css";
import "@/components/css/breadcrumb.css";
import "@/components/css/tooltip.css"; // serve per i tooltip integrati
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import "./index.css";

// JS side-effect condivisi
import "@/components/js/navbar.js";
import "@/components/js/navbar-loader.js";
import "@/components/js/button.js";
import "@/components/js/footer.js";
// NB: NON importo tooltip.js perché i tooltip del generatore sono integrati

import initBreadcrumbs from "@/components/js/breadcrumb-loader.js";

document.addEventListener("DOMContentLoaded", async () => {
  initBreadcrumbs({
    selector: "#breadcrumb-container",
    enableLog: true,
    rootUrl: "https://codedge.it/",
    currentIsLink: true,
    onMount: (items) => console.log("breadcrumbs mounted", items),
  });

  // Carica il generatore solo se la pagina lo usa
  if (document.getElementById("picker")) {
    const { initColorGenerator } = await import("@/pages/strumenti/generatore-colori/generatore-colori.js");
    initColorGenerator();
  }
});
