// src/pages/risorse/main.js
// Entry per la pagina "Risorse"

// CSS globali
import "@/components/css/main.css";
import "@/components/css/navbar.css";
import "@/components/css/footer.css";
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

// minimal-navbar (modulare, import statico - verrà incluso nello stesso bundle dell'entry)
import { initMinimalNavbar } from "@/pages/progetti-pratici/minimal-navbar/minimal-navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initBreadcrumbs({
    selector: "#breadcrumb-container",
    enableLog: true,
    rootUrl: "https://codedge.it/",
    currentIsLink: true, // <- rende cliccabile anche l'ultimo elemento
    onMount: (items) => console.log("mounted", items),
  });

  // inizializza la minimal navbar (solo se presente)
  initMinimalNavbar();

  // qui puoi aggiungere altri init specifici per la pagina...
});
