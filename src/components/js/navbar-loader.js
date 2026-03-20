// src/components/js/navbar-loader.js
// Carica il partial della nav e segnala quando la navbar e' pronta,
// cosi' il reveal iniziale puo' aspettare il layout definitivo.

!(function () {
  "use strict";

  if (window.__navLoaderActive) return;
  window.__navLoaderActive = true;

  const READY_EVENT = "codedge:nav-ready";
  const config = {
    placeholderSelector: "#nav-menu",
    partialPath: "/partials/nav.html",
    fetchOptions: { cache: "no-store" },
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

  async function loadNav() {
    const placeholder = document.querySelector(config.placeholderSelector);

    if (!placeholder) {
      console.warn("[nav-loader] placeholder non trovato:", config.placeholderSelector);
      markReady();
      return;
    }

    if (placeholder.dataset.partialLoaded === "true" && !config.forceReload) {
      log("Placeholder gia' popolato; esco.");
      markReady();
      return;
    }

    try {
      const response = await fetch(config.partialPath, config.fetchOptions);
      if (!response.ok) {
        console.error("[nav-loader] fetch fallito:", response.status, config.partialPath);
        markReady();
        return;
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const list = doc.querySelector("ul");
      const nextHtml = (list ? list.innerHTML : doc.body.innerHTML).trim();
      const currentHtml = (placeholder.innerHTML || "").trim();

      if (currentHtml && currentHtml === nextHtml && !config.forceReload) {
        log("Contenuto identico gia' presente nel placeholder, skip iniezione.");
        placeholder.dataset.partialLoaded = "true";
        markCurrent(placeholder);
        markReady();
        return;
      }

      placeholder.innerHTML = "";
      placeholder.innerHTML = list ? list.innerHTML : doc.body.innerHTML;
      placeholder.dataset.partialLoaded = "true";

      markCurrent(placeholder);
      log("Nav iniettata con successo.");
      markReady();
    } catch (error) {
      console.error("[nav-loader] errore:", error);
      markReady();
    }
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
