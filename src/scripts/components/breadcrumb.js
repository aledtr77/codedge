// src/scripts/components/breadcrumb.js
import "@/styles/components/breadcrumb.css";
import { formatSegment } from "./breadcrumb-vocabulary.js";


function normalizePath(pathname) {
  const clean = String(pathname || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/index\.html$/i, "")
    .replace(/\/+$/g, "");

  return clean === "" ? "/" : clean;
}

function getBreadcrumbTitle(path) {
  // Sempre lo slug formattato via vocabolario, mai l'H1 o il <title> della
  // pagina: quelli sono descrittivi e lunghi (SEO), la breadcrumb vuole il
  // nome essenziale ("Glossario CSS", non "Glossario CSS completo con...").
  const normalized = path.replace(/\/+$/g, "");
  const lastSegment = normalized.split("/").pop() || "";
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
      currentSpan.textContent = getBreadcrumbTitle(accumulatedPath);
      li.appendChild(currentSpan);
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
