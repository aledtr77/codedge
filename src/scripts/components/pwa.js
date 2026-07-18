if ("serviceWorker" in navigator) {
  // Reload once when a new service worker takes control, so installed PWAs
  // pick up fresh HTML/assets right after a deploy instead of showing the
  // previous cached version. Guarded to avoid reload loops, and skipped on
  // first install (no previous controller means nothing stale is on screen).
  let hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const registerSW = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // The browser only checks for a new sw.js on navigation. An installed
        // PWA resumed from the background may not navigate for a long time,
        // so also check whenever the app returns to the foreground.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((error) => {
        console.warn("Service Worker registration failed:", error);
      });
  };

  if (document.readyState === "complete") {
    registerSW();
  } else {
    window.addEventListener("load", registerSW);
  }
}

