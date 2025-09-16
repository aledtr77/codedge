// src/pages/index/main.js — minimalissimo e funzionale
import '@/components/css/main.css';
import '@/components/css/navbar.css';
import '@/components/css/footer.css';
import '@/components/css/breadcrumb.css';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


import '@/components/js/navbar.js';
import '@/components/js/navbar-loader.js';
import '@/components/js/footer.js';

import initBreadcrumbs from '@/components/js/breadcrumb-loader.js';

document.addEventListener('DOMContentLoaded', () => {
  initBreadcrumbs({
    selector: '#breadcrumb-container',
    enableLog: true,             // true per debug in dev
    rootUrl: 'https://codedge.it/', // forza root assoluta (consigliato)
    currentIsLink: true, // <- rende cliccabile anche l'ultimo elemento
    onMount: items => console.log('breadcrumbs montate', items)
  });
});