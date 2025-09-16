// importa i CSS globali e page-specific (Vite li processa)
import '@/components/css/main.css';    // global 
import '@/components/css/navbar.css';
import '@/components/css/footer.css';
import '@/components/css/glossario.css';
import '@/components/css/breadcrumb.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// importa i moduli JS (ESM) dalla cartella src/components/js
import '@/components/js/navbar.js';
import '@/components/js/navbar-loader.js';
import '@/components/js/footer.js';
import '@/components/js/glossario.js';


import initBreadcrumbs from "@/components/js/breadcrumb-loader.js";

document.addEventListener("DOMContentLoaded", () => {
  initBreadcrumbs({
    selector: "#breadcrumb-container",
    enableLog: true,
    rootUrl: "https://codedge.it/",
    currentIsLink: true, // <- rende cliccabile anche l'ultimo elemento
    onMount: (items) => console.log("mounted", items),
  });
});
