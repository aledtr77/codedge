// src/scripts/pages/strumenti/generatore-colori/main.js

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@/styles/components/tooltip.css"; // serve per i tooltip integrati
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/strumenti/generatore-colori/index.css';

// JS side-effect condivisi
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";
// NB: NON importo tooltip.js perché i tooltip del generatore sono integrati

document.addEventListener("DOMContentLoaded", async () => {
  // Carica il generatore solo se la pagina lo usa
  if (document.getElementById("picker")) {
    const { initColorGenerator } = await import("@/scripts/pages/strumenti/generatore-colori/generatore-colori.js");
    initColorGenerator();
  }
});
