import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@/styles/components/tooltip.css"; // needed by the integrated tooltips
import "@fortawesome/fontawesome-free/css/all.min.css";

import '@/styles/pages/tools/color-generator/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";
// The generator ships its own integrated tooltips (no shared tooltip component).

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("palette-cards-container")) {
    const { initColorGenerator } = await import("@/scripts/pages/tools/color-generator/color-generator.js");
    initColorGenerator();
  }
});
