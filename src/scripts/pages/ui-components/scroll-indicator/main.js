import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import '@/styles/pages/ui-components/detail.css';
import '@/styles/pages/ui-components/scroll-indicator/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import { initReadingProgress } from "@/scripts/pages/ui-components/scroll-indicator/scroll-indicator.js";

document.addEventListener("DOMContentLoaded", () => {
  initReadingProgress();
});
