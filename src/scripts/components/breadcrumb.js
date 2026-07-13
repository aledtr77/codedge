// src/scripts/components/breadcrumb.js
import "@/styles/components/breadcrumb.css";

const breadcrumbTitles = {
  "/risorse": "Risorse",
  "/risorse/glossario-html": "Glossario HTML",
  "/risorse/glossario-css": "Glossario CSS",
  "/risorse/glossario-js": "Glossario JavaScript",
  "/risorse/snippet-library": "Snippet Library",
  "/strumenti": "Strumenti",
  "/strumenti/compressore-immagini": "Compressore Immagini",
  "/strumenti/estrattore-palette": "Estrattore Palette",
  "/strumenti/generatore-colori": "Generatore Colori",
  "/strumenti/generatore-gradienti": "Generatore Gradienti",
  "/componenti-ui": "Componenti UI",
  "/componenti-ui/card-interattive": "Card Contenuto Riusabile",
  "/componenti-ui/form": "Form Contatto Accessibile",
  "/componenti-ui/minimal-navbar": "Header Responsive",
  "/componenti-ui/scroll-indicator": "Progress Bar di Lettura",
  "/tutorial": "Tutorial",
  "/tutorial/accessibilita-web-base": "Accessibilità Web Base",
  "/tutorial/ai-sviluppo-solido": "AI e Sviluppo Solido",
  "/tutorial/browser-devtools": "Browser e DevTools",
  "/tutorial/css-fondamentali": "CSS Fondamentali",
  "/tutorial/deploy-base": "Deploy Base",
  "/tutorial/git-pratico-senza-panico": "Git Pratico Senza Panico",
  "/tutorial/github-operativo": "GitHub Operativo",
  "/tutorial/html-fondamentali": "HTML Fondamentali",
  "/tutorial/javascript-fondamentali": "JavaScript Fondamentali",
  "/tutorial/npm-vite-struttura-progetto": "NPM, Vite e Struttura Progetto",
  "/tutorial/seo-tecnico-base": "SEO Tecnico Base",
  "/tutorial/vscode-essenziale": "VSCode Essenziale",
  "/template": "Template",
  "/chi-sono": "Chi Sono",
  "/contatti": "Contatti",
  "/privacy-policy": "Privacy Policy",
  "/termini-servizio": "Termini di Servizio"
};

function normalizePath(pathname) {
  const clean = String(pathname || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/index\.html$/i, "")
    .replace(/\/+$/g, "");

  return clean === "" ? "/" : clean;
}

function getBreadcrumbTitle(path) {
  const normalized = path.replace(/\/+$/g, "");
  if (breadcrumbTitles[normalized]) {
    return breadcrumbTitles[normalized];
  }

  // Fallback 1: search for main headings (h1, h2 with title class/id)
  const mainHeading = document.querySelector('main h1, article h1, h1:not(.resize-text), h2[id*="title"], h2[class*="title"]');
  if (mainHeading) {
    const text = mainHeading.textContent.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
    if (text) return text;
  }

  // Fallback 2: parse document.title
  if (document.title) {
    const parts = document.title.split(/[|\u2013\u2014-]/);
    if (parts.length > 0) {
      return parts[0].trim();
    }
  }

  // Fallback 3: capitalize path segment
  const lastSegment = normalized.split("/").pop() || "";
  return lastSegment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function initBreadcrumbs() {
  const currentPath = normalizePath(location.pathname);
  if (currentPath === "/") return; // No breadcrumbs on Homepage

  const segments = currentPath.split("/").filter(Boolean);
  if (segments.length === 0) return;

  // Avoid running multiple times
  if (document.querySelector(".codedge-breadcrumbs-navbar")) return;

  const headerEl = document.querySelector("header");
  if (!headerEl) return;

  const navbarH1 = headerEl.querySelector("h1");
  if (!navbarH1) return;

  // Disable logo home link as it is redundant with the breadcrumbs
  const logoLink = headerEl.querySelector(".logo-link");
  if (logoLink) {
    logoLink.removeAttribute("href");
    logoLink.style.pointerEvents = "none";
    logoLink.style.cursor = "default";
  }

  // Create breadcrumb navbar navigation element
  const nav = document.createElement("nav");
  nav.className = "codedge-breadcrumbs-navbar";
  nav.setAttribute("aria-label", "Breadcrumbs");

  const listEl = document.createElement("ol");
  listEl.className = "breadcrumb-list";

  // Home item
  const homeLi = document.createElement("li");
  homeLi.className = "breadcrumb-item";
  const homeLink = document.createElement("a");
  homeLink.href = "/";
  homeLink.className = "breadcrumb-link";
  homeLink.innerHTML = '<i class="fas fa-home" aria-hidden="true"></i> Home';
  homeLi.appendChild(homeLink);
  listEl.appendChild(homeLi);

  // Intermediate and Leaf segments
  let accumulatedPath = "";
  segments.forEach((segment, index) => {
    accumulatedPath += "/" + segment;
    const isLast = index === segments.length - 1;

    const li = document.createElement("li");
    li.className = "breadcrumb-item";

    if (isLast) {
      li.setAttribute("aria-current", "page");
      const currentH1 = document.createElement("h1");
      currentH1.className = "breadcrumb-current";
      currentH1.textContent = getBreadcrumbTitle(accumulatedPath);
      li.appendChild(currentH1);
    } else {
      const link = document.createElement("a");
      link.href = accumulatedPath + "/";
      link.className = "breadcrumb-link";
      link.textContent = getBreadcrumbTitle(accumulatedPath);
      li.appendChild(link);
    }
    listEl.appendChild(li);
  });

  nav.appendChild(listEl);

  // Replace the navbar H1 with the breadcrumb list to fit on the same line
  navbarH1.replaceWith(nav);

  // Remove pre-existing static back links or breadcrumb placeholders from the document flow
  const oldContainers = document.querySelectorAll(".breadcrumb-container:not(.codedge-breadcrumbs-navbar)");
  oldContainers.forEach(container => container.remove());

  const oldBackLinks = document.querySelectorAll(".back-link, .tool-back-link");
  oldBackLinks.forEach(link => link.remove());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBreadcrumbs);
} else {
  initBreadcrumbs();
}

window.addEventListener("pageshow", initBreadcrumbs);
