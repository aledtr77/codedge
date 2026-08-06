import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/components/button.css';
import '@/styles/pages/footer/contact/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';

import { initContactForm } from "@/scripts/pages/footer/contact/contact.js";

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#contact-form")) {
    initContactForm({
      userId: "_jaOmpsmW4bnrY_bq",
      serviceId: "service_7629q4n",
      templateId: "template_6gwohrk",
      formSelector: "#contact-form",
      feedbackSelector: "#feedback",
      honeypotFieldName: "website",
      loadingMessage: "Invio in corso...",
      minimumFillMs: 3000,
      cooldownMs: 60000,
      feedbackDuration: 4000,
    });
  }
});
