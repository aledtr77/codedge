// src/scripts/pages/strumenti/estrattore-palette/main.js

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS specifico pagina
import '@/styles/pages/strumenti/estrattore-palette/index.css';

// JS side-effect
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Carico il componente solo se trovo elementi chiave
  if (document.getElementById("analyze") || document.getElementById("palette")) {
    const { initPaletteExtractor } = await import("@/scripts/pages/strumenti/estrattore-palette/estrattore-palette.js");
    initPaletteExtractor();
  }
});
