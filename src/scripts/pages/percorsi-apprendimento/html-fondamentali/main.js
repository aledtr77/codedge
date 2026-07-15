import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@/styles/pages/percorsi-apprendimento/git-pratico-senza-panico/index.css";

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import initGuideToc from "@/scripts/components/guide-toc.js";

document.addEventListener("DOMContentLoaded", () => {
  initGuideToc();
});
