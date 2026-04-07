// src/scripts/components/navbar-loader.js
// Inietta la nav da template inline e segnala quando la navbar e' pronta.

!(function () {
  "use strict";

  if (window.__navLoaderActive) return;
  window.__navLoaderActive = true;

  const READY_EVENT = "codedge:nav-ready";
  const NAV_MARKUP = `
    <li class="nav-item">
      <a href="/" class="nav-link"><i class="fas fa-home" aria-hidden="true"></i>Home</a>
    </li>
    <li class="nav-item">
      <a href="/risorse/" class="nav-link"><i class="fas fa-book" aria-hidden="true"></i>Risorse</a>
    </li>
    <li class="nav-item">
      <a href="/strumenti/" class="nav-link"><i class="fas fa-tools" aria-hidden="true"></i>Strumenti</a>
    </li>
    <li class="nav-item">
      <a href="/progetti-pratici/" class="nav-link"><i class="fas fa-project-diagram" aria-hidden="true"></i>Progetti Pratici</a>
    </li>
    <li class="nav-item">
      <a href="/percorsi-apprendimento/" class="nav-link"><i class="fas fa-graduation-cap" aria-hidden="true"></i>Percorsi Apprendimento</a>
    </li>
    <li class="nav-item">
      <a href="/shop-template/" class="nav-link"><i class="fas fa-store" aria-hidden="true"></i>Shop Template</a>
    </li>
  `.trim();

  const config = {
    placeholderSelector: "#nav-menu",
    enableLog: false,
    forceReload: false,
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

  function hasNavLinks(container) {
    return !!container?.querySelector("a.nav-link");
  }

  async function loadNav() {
    const placeholder = document.querySelector(config.placeholderSelector);

    if (!placeholder) {
      console.warn("[nav-loader] placeholder non trovato:", config.placeholderSelector);
      markReady();
      return;
    }

    if (placeholder.dataset.partialLoaded === "true" && !config.forceReload) {
      log("Placeholder gia' popolato; esco.");
      markCurrent(placeholder);
      markReady();
      return;
    }

    if (hasNavLinks(placeholder) && !config.forceReload) {
      log("Contenuto nav gia' presente nel placeholder, skip iniezione.");
      placeholder.dataset.partialLoaded = "true";
      markCurrent(placeholder);
      markReady();
      return;
    }

    placeholder.innerHTML = NAV_MARKUP;
    placeholder.dataset.partialLoaded = "true";

    markCurrent(placeholder);
    log("Nav iniettata con successo.");
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
    if (placeholder.children.length === 0 || placeholder.dataset.partialLoaded !== "true") {
      loadNav();
    }
  });

  window.navLoader = { load: loadNav, config };
})();
