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
  // Always the formatted slug, never the page H1 or <title>: those are long,
  // SEO-oriented ("Glossario CSS completo con..."); the breadcrumb wants the
  // essential name ("Glossario CSS").
  const normalized = path.replace(/\/+$/g, "");
  const lastSegment = normalized.split("/").pop() || "";
  return formatSegment(lastSegment);
}

function initBreadcrumbs() {
  const currentPath = normalizePath(location.pathname);
  const isHomepage = currentPath === "/";

  if (isHomepage) return;

  if (document.querySelector(".codedge-breadcrumbs-bar")) return;

  const headerEl = document.querySelector("header");
  if (!headerEl) return;

  const navbarEl = headerEl.querySelector(".navbar");
  if (!navbarEl) return;

  const nav = document.createElement("nav");
  nav.className = "codedge-breadcrumbs-bar";
  nav.setAttribute("aria-label", "Breadcrumbs");

  const listEl = document.createElement("ol");
  listEl.className = "breadcrumb-list";

  const homeLi = document.createElement("li");
  homeLi.className = "breadcrumb-item";
  const homeLink = document.createElement("a");
  homeLink.href = "/";
  homeLink.className = "breadcrumb-link";
  homeLink.innerHTML = '<i class="fas fa-home" aria-hidden="true"></i> Home';
  homeLi.appendChild(homeLink);
  listEl.appendChild(homeLi);

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

  navbarEl.after(nav);

  // Static back links and breadcrumb placeholders become redundant once the
  // runtime bar exists: drop them from the flow
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
