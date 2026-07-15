// src/scripts/components/breadcrumb.js
import "@/styles/components/breadcrumb.css";

const BREADCRUMB_VOCABULARY = {
  // Categorie principali (parenti)
  "risorse": "Risorse",
  "strumenti": "Strumenti",
  "componenti-ui": "Componenti UI",
  "tutorial": "Tutorial",
  "template": "Template",
  "percorsi-apprendimento": "Percorsi di Apprendimento",

  // Specifiche eccezioni di pagine per le quali non vogliamo dipendere dal DOM o come fallback
  "privacy-policy": "Privacy Policy",
  "termini-servizio": "Termini di Servizio",
  "chi-sono": "Chi Sono",
  "contatti": "Contatti",

  // Acronimi e abbreviazioni comuni
  "ui": "UI",
  "html": "HTML",
  "css": "CSS",
  "js": "JavaScript",
  "vscode": "VSCode",
  "vs-code": "VS Code",
  "pwa": "PWA",
  "ai": "AI",
  "npm": "NPM",
  "seo": "SEO",
  "git": "Git",
  "github": "GitHub",

  // Congiunzioni/Preposizioni in minuscolo (per la formattazione automatica)
  "di": "di",
  "a": "a",
  "da": "da",
  "in": "in",
  "con": "con",
  "su": "su",
  "per": "per",
  "tra": "tra",
  "fra": "fra",
  "e": "e"
};

function formatSegment(segment) {
  if (!segment) return "";
  
  // Se l'intero segmento è mappato direttamente nel vocabolario, usalo subito
  if (BREADCRUMB_VOCABULARY[segment.toLowerCase()]) {
    return BREADCRUMB_VOCABULARY[segment.toLowerCase()];
  }

  // Altrimenti spezza per trattino, capitalizza e applica sostituzioni
  return segment
    .split(/[-_]+/)
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      
      // Controlla se la parola fa parte del vocabolario (es. "ui" -> "UI", "di" -> "di")
      if (BREADCRUMB_VOCABULARY[lowerWord]) {
        // La prima parola del segmento deve essere sempre capitalizzata, anche se è una congiunzione
        if (index === 0 && ["di", "a", "da", "in", "con", "su", "per", "tra", "fra", "e"].includes(lowerWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return BREADCRUMB_VOCABULARY[lowerWord];
      }
      
      // Capitalizzazione standard
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizePath(pathname) {
  const clean = String(pathname || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/index\.html$/i, "")
    .replace(/\/+$/g, "");

  return clean === "" ? "/" : clean;
}

function getBreadcrumbTitle(path, isCurrentPage) {
  const normalized = path.replace(/\/+$/g, "");
  const lastSegment = normalized.split("/").pop() || "";

  // Se è la pagina corrente, proviamo a estrarre il titolo esatto dal DOM
  if (isCurrentPage) {
    // 1. Cerca l'H1 principale (evitando titoli della navbar)
    const mainHeading = document.querySelector('main h1, article h1, h1:not(.resize-text), h2[id*="title"], h2[class*="title"]');
    if (mainHeading) {
      const text = mainHeading.textContent.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
      if (text) return text;
    }

    // 2. Fallback su parte iniziale del document.title
    if (document.title) {
      const parts = document.title.split(/[|\u2013\u2014-]/);
      if (parts.length > 0) {
        return parts[0].trim();
      }
    }
  }

  // Se è un segmento genitore (o se i fallback DOM falliscono), formatta il segmento dinamicamente
  return formatSegment(lastSegment);
}

function initBreadcrumbs() {
  const currentPath = normalizePath(location.pathname);
  const isHomepage = currentPath === "/";

  // Salta il rendering delle breadcrumb sulla Homepage
  if (isHomepage) return;

  // Evita esecuzioni multiple
  if (document.querySelector(".codedge-breadcrumbs-bar")) return;

  const headerEl = document.querySelector("header");
  if (!headerEl) return;

  const navbarEl = headerEl.querySelector(".navbar");
  if (!navbarEl) return;

  // Crea elemento nav per la barra delle breadcrumb
  const nav = document.createElement("nav");
  nav.className = "codedge-breadcrumbs-bar";
  nav.setAttribute("aria-label", "Breadcrumbs");

  const listEl = document.createElement("ol");
  listEl.className = "breadcrumb-list";

  // Item Home (link)
  const homeLi = document.createElement("li");
  homeLi.className = "breadcrumb-item";
  const homeLink = document.createElement("a");
  homeLink.href = "/";
  homeLink.className = "breadcrumb-link";
  homeLink.innerHTML = '<i class="fas fa-home" aria-hidden="true"></i> Home';
  homeLi.appendChild(homeLink);
  listEl.appendChild(homeLi);

  // Segmenti intermedi e foglia
  const segments = currentPath.split("/").filter(Boolean);
  let accumulatedPath = "";
  segments.forEach((segment, index) => {
    accumulatedPath += "/" + segment;
    const isLast = index === segments.length - 1;

    const li = document.createElement("li");
    li.className = "breadcrumb-item";

    if (isLast) {
      li.setAttribute("aria-current", "page");
      const currentSpan = document.createElement("span");
      currentSpan.className = "breadcrumb-current";
      currentSpan.textContent = getBreadcrumbTitle(accumulatedPath, true);
      li.appendChild(currentSpan);
    } else {
      const link = document.createElement("a");
      link.href = accumulatedPath + "/";
      link.className = "breadcrumb-link";
      link.textContent = getBreadcrumbTitle(accumulatedPath, false);
      li.appendChild(link);
    }
    listEl.appendChild(li);
  });

  nav.appendChild(listEl);

  // Insert the breadcrumb sub-bar after the main navbar inside the header
  navbarEl.after(nav);

  // Remove pre-existing static back links or breadcrumb placeholders from the document flow
  const oldContainers = document.querySelectorAll(".breadcrumb-container:not(.codedge-breadcrumbs-bar)");
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
