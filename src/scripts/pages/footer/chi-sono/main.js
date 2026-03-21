// src/scripts/pages/index/main.js — minimalissimo e funzionale
import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/components/breadcrumb.css';
import '@/styles/pages/footer/chi-sono/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';

import initBreadcrumbs from '@/scripts/components/breadcrumb-loader.js';

document.addEventListener('DOMContentLoaded', () => {
  initBreadcrumbs({
    selector: '#breadcrumb-container',
    enableLog: true,             // true per debug in dev
    rootUrl: 'https://codedge.it/', // forza root assoluta (consigliato)
    currentIsLink: true, // <- rende cliccabile anche l'ultimo elemento
    onMount: items => console.log('breadcrumbs montate', items)
  });
});