// src/scripts/pages/index/main.js — minimalissimo e funzionale
import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/components/button.css';
import '@/styles/pages/footer/contatti/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';

// import del modulo contact-form (metti il file in 
import { initContactForm } from '@/scripts/pages/footer/contatti/contatti.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inizializza il contact form SOLO se il form è presente
  if (document.querySelector('#contact-form')) {
    initContactForm({
      userId: '_jaOmpsmW4bnrY_bq',       // obbligatorio
      serviceId: 'service_7629q4n',     // il tuo service
      templateId: 'template_6gwohrk',   // il tuo template
      formSelector: '#contact-form',    // id del form
      feedbackSelector: '#feedback',    // id del box feedback
      loadingMessage: 'Invio in corso...',
      feedbackDuration: 4000
    });
  }
});
