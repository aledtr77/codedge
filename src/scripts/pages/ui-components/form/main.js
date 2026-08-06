import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

import '@/styles/pages/ui-components/detail.css';
import '@/styles/pages/ui-components/form/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import { initValidatedContactForm } from "@/scripts/pages/ui-components/form/contact-form.js";

document.addEventListener("DOMContentLoaded", () => {
  initValidatedContactForm();
});
