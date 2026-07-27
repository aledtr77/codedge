// Marks the static navbar as ready and applies the current-page link state.

import initLangSwitch from "./lang-switch.js";

!(function () {
  "use strict";

  if (window.__navLoaderActive) return;
  window.__navLoaderActive = true;

  const READY_EVENT = "codedge:nav-ready";
  const config = {
    placeholderSelector: "#nav-menu",
    enableLog: false,
  };
  // Labels are already correct in the markup (the build fills the partial per
  // language); this map only restores them if a script has emptied the link.
  const navLabels = {
    "/": { text: "Home", ariaLabel: "Home" },
    "/risorse": { text: "Risorse", ariaLabel: "Risorse" },
    "/strumenti": { text: "Strumenti", ariaLabel: "Strumenti" },
    "/componenti-ui": { text: "Componenti UI", ariaLabel: "Componenti UI" },
    "/tutorial": { text: "Tutorial", ariaLabel: "Tutorial" },
    "/template": { text: "Template", ariaLabel: "Template" },
    "/en": { text: "Home", ariaLabel: "Home" },
    "/en/resources": { text: "Resources", ariaLabel: "Resources" },
    "/en/tools": { text: "Tools", ariaLabel: "Tools" },
    "/en/ui-components": { text: "UI Components", ariaLabel: "UI Components" },
    "/en/tutorials": { text: "Tutorials", ariaLabel: "Tutorials" },
    "/en/templates": { text: "Templates", ariaLabel: "Templates" },
  };

  function log(...args) {
    if (config.enableLog) console.log("[nav-loader]", ...args);
  }

  function markReady() {
    if (window.__navReady) return;
    window.__navReady = true;
    window.dispatchEvent(new Event(READY_EVENT));
  }

  function normalizePath(pathname) {
    const clean = String(pathname || "")
      .split("?")[0]
      .split("#")[0]
      .replace(/index\.html$/i, "")
      .replace(/\/+$/g, "");

    return clean === "" ? "/" : clean;
  }

  function markCurrent(container) {
    const currentPath = normalizePath(location.pathname || "/");

    container.querySelectorAll("a.nav-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;

      let targetPath;
      try {
        targetPath = new URL(href, location.origin).pathname;
      } catch {
        targetPath = href;
      }

      targetPath = normalizePath(targetPath);

      if (targetPath === currentPath) {
        link.setAttribute("aria-current", "page");
        link.classList.add("is-active");
      } else {
        link.removeAttribute("aria-current");
        link.classList.remove("is-active");
      }
    });
  }

  function applyNavLabels(container) {
    container.querySelectorAll("a.nav-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;

      let targetPath;
      try {
        targetPath = new URL(href, location.origin).pathname;
      } catch {
        targetPath = href;
      }

      targetPath = normalizePath(targetPath);

      const navItem = navLabels[targetPath];
      if (!navItem) return;

      const icon = link.querySelector("i");
      link.textContent = "";
      if (icon) link.appendChild(icon);
      link.append(navItem.text);
      link.setAttribute("aria-label", navItem.ariaLabel);
      link.setAttribute("title", navItem.ariaLabel);
    });
  }

  function hasNavLinks(container) {
    return !!container?.querySelector("a.nav-link");
  }

  function loadNav() {
    const placeholder = document.querySelector(config.placeholderSelector);

    if (!placeholder) {
      console.warn("[nav-loader] placeholder non trovato:", config.placeholderSelector);
      markReady();
      return;
    }

    if (hasNavLinks(placeholder)) {
      log("Navbar statica rilevata, skip iniezione.");
      placeholder.dataset.partialLoaded = "true";
      applyNavLabels(placeholder);
      markCurrent(placeholder);
      initLangSwitch();
      markReady();
      return;
    }

    console.warn("[nav-loader] nav-menu presente ma senza link. Controlla il markup della pagina.");
    markReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadNav);
  } else {
    loadNav();
  }

  window.addEventListener("pageshow", () => {
    const placeholder = document.querySelector(config.placeholderSelector);
    if (!placeholder) return;
    loadNav();
  });

  // Both passes below key off the link hrefs, and the language switch rewrites
  // those in place: without this the labels stay in the old language and
  // aria-current still points at the route we came from.
  window.addEventListener("codedge:lang-changed", () => {
    const placeholder = document.querySelector(config.placeholderSelector);
    if (!placeholder || !hasNavLinks(placeholder)) return;
    applyNavLabels(placeholder);
    markCurrent(placeholder);
  });

  window.navLoader = { load: loadNav, config };
})();
