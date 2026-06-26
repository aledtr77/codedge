// src/scripts/pages/componenti-ui/minimal-navbar/main.js
// Entry per la pagina "Header accessibile"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS specifico pagina
import '@/styles/pages/componenti-ui/detail.css';
import '@/styles/pages/componenti-ui/minimal-navbar/index.css';

// side-effect modules (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import { initAccessibleHeader } from "@/scripts/pages/componenti-ui/minimal-navbar/minimal-navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initAccessibleHeader();
});
