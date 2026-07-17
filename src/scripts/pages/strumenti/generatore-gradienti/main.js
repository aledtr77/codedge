import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

import '@/styles/pages/strumenti/generatore-gradienti/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("previewBox")) {
    try {
      const mod = await import("./generatore-gradienti.js");
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