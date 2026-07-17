import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

import '@/styles/pages/componenti-ui/detail.css';
import '@/styles/pages/componenti-ui/form/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import { initValidatedContactForm } from "@/scripts/pages/componenti-ui/form/contact-form.js";

document.addEventListener("DOMContentLoaded", () => {
  initValidatedContactForm();
});
