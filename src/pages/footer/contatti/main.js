// src/pages/index/main.js — minimalissimo e funzionale
import '@/components/css/main.css';
import '@/components/css/navbar.css';
import '@/components/css/footer.css';
import '@/components/css/button.css';
import '@/components/css/breadcrumb.css';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import '@/components/js/navbar.js';
import '@/components/js/navbar-loader.js';
import '@/components/js/footer.js';

import initBreadcrumbs from '@/components/js/breadcrumb-loader.js';

// import del modulo contact-form (metti il file in 
import { initContactForm } from '@/pages/footer/contatti/contatti.js';

document.addEventListener('DOMContentLoaded', () => {
  initBreadcrumbs({
    selector: '#breadcrumb-container',
    enableLog: true,             // true per debug in dev
    rootUrl: 'https://codedge.it/', // forza root assoluta (consigliato)
    currentIsLink: true, // <- rende cliccabile anche l'ultimo elemento
    onMount: items => console.log('breadcrumbs montate', items)
  });

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
