// src/scripts/pages/strumenti/generatore-box-shadow/main.js

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/strumenti/generatore-box-shadow/index.css';

// JS condivisi
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Carica il generatore solo se la pagina lo usa
  if (document.getElementById("preview-box") || document.getElementById("horizontal")) {
    const { initBoxShadowGenerator } = await import("@/scripts/pages/strumenti/generatore-box-shadow/generatore-box-shadow.js");
    initBoxShadowGenerator();
  }
});
