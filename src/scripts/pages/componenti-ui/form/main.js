// src/scripts/pages/componenti-ui/form/main.js
// Entry per la pagina "Form validato"

// CSS globali
import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS specifico pagina
import '@/styles/pages/componenti-ui/detail.css';
import '@/styles/pages/componenti-ui/form/index.css';

// side-effect modules (se li usano)
import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import { initValidatedContactForm } from "@/scripts/pages/componenti-ui/form/contact-form.js";

document.addEventListener("DOMContentLoaded", () => {
  initValidatedContactForm();
});
