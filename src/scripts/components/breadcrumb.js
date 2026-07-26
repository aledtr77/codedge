import "@/styles/components/breadcrumb.css";
import { formatSegment, LANG_PREFIX_SEGMENTS } from "./breadcrumb-vocabulary.js";
import { t, currentLang } from "@/i18n/ui.js";

function normalizePath(pathname) {
  const clean = String(pathname || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/index\.html$/i, "")
    .replace(/\/+$/g, "");

  return clean === "" ? "/" : clean;
}

function getBreadcrumbTitle(path, lang) {
  // Always the formatted slug, never the page H1 or <title>: those are long,
  // SEO-oriented ("Glossario CSS completo con..."); the breadcrumb wants the
  // essential name ("Glossario CSS").
  const normalized = path.replace(/\/+$/g, "");
  const lastSegment = normalized.split("/").pop() || "";
  return formatSegment(lastSegment, lang);
}

function initBreadcrumbs() {
  const currentPath = normalizePath(location.pathname);
  const lang = currentLang();
  // The language prefix is not a navigation level: /en/ is the English home,
  // and /en/tools/ must read "Home > Tools", not "Home > En > Tools".
  const langRoot = lang === "it" ? "/" : "/en";
  const isHomepage = currentPath === "/" || currentPath === langRoot;

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
  homeLink.href = lang === "it" ? "/" : "/en/";
  homeLink.className = "breadcrumb-link";
  homeLink.innerHTML = `<i class="fas fa-home" aria-hidden="true"></i> ${t("breadcrumb.home")}`;
  homeLi.appendChild(homeLink);
  listEl.appendChild(homeLi);

  const allSegments = currentPath.split("/").filter(Boolean);
  // Keep the prefix in the hrefs, drop it from the visible trail.
  const prefix = LANG_PREFIX_SEGMENTS.has(allSegments[0]) ? `/${allSegments[0]}` : "";
  const segments = prefix ? allSegments.slice(1) : allSegments;

  let accumulatedPath = prefix;
  segments.forEach((segment, index) => {
    accumulatedPath += "/" + segment;
    const isLast = index === segments.length - 1;

    const li = document.createElement("li");
    li.className = "breadcrumb-item";

    if (isLast) {
      li.setAttribute("aria-current", "page");
      const currentSpan = document.createElement("span");
      currentSpan.className = "breadcrumb-current";
      currentSpan.textContent = getBreadcrumbTitle(accumulatedPath, lang);
      li.appendChild(currentSpan);
    } else {
      const link = document.createElement("a");
      link.href = accumulatedPath + "/";
      link.className = "breadcrumb-link";
      link.textContent = getBreadcrumbTitle(accumulatedPath, lang);
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
