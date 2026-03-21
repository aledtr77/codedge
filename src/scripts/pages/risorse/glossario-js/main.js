// importa i CSS globali e page-specific (Vite li processa)
import '@/styles/components/main.css';    // global 
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/components/glossario.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// importa i moduli JS (ESM) dalla cartella src/scripts/components
import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/footer.js';
import '@/scripts/components/glossario.js';

document.addEventListener("DOMContentLoaded", () => {});
