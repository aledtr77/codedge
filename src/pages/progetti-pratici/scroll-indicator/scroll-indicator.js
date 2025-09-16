// src/components/js/scroll-indicator.js
// Modulo pulito per lo Scroll Indicator
let _scrollIndicatorInitialized = false;

export function initScrollIndicator({
  indicatorSelector = "#scrollIndicator",
  circleSelector = ".progress-ring__circle",
  visibleThresholdPercent = 10,
} = {}) {
  if (_scrollIndicatorInitialized) return;
  _scrollIndicatorInitialized = true;

  const indicator = document.querySelector(indicatorSelector);
  const circle = document.querySelector(circleSelector);

  if (!indicator || !circle) {
    // elementi mancanti: non inizializziamo nulla
    console.warn("[scroll-indicator] Elementi mancanti, skip init.");
    return;
  }

  // Ottieni raggio: try attribute -> fallback baseVal -> fallback numero
  const radiusAttr = circle.getAttribute("r");
  const radius =
    (typeof radiusAttr === "string" && Number(radiusAttr)) ||
    (circle.r && circle.r.baseVal && circle.r.baseVal.value) ||
    18;

  const circumference = 2 * Math.PI * radius;

  // imposta stroke per l'animazione
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = `${circumference}`;

  const setProgress = (percent) => {
    const clamped = Math.max(0, Math.min(100, percent));
    const offset = circumference - (clamped / 100) * circumference;
    circle.style.strokeDashoffset = String(offset);
  };

  // rAF throttle per evitare spam di eventi scroll
  let ticking = false;
  const updateFromScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || window.pageYOffset || 0;
      const max = Math.max(1, doc.scrollHeight - doc.clientHeight); // evita divisione per 0
      const percent = (scrollTop / max) * 100;
      setProgress(percent);

      if (percent > visibleThresholdPercent) indicator.classList.add("is-visible");
      else indicator.classList.remove("is-visible");

      ticking = false;
    });
  };

  // listener scroll
  window.addEventListener("scroll", updateFromScroll, { passive: true });

  // init subito (stato iniziale della pagina)
  updateFromScroll();

  // esponi funzione globale per compatibility con inline onclick="scrollToTop()"
  // (se vuoi evitare l'inline, puoi rimuoverlo e usare il listener sotto)
  window.scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // click sul contenitore -> scroll to top
  indicator.addEventListener("click", (ev) => {
    ev.preventDefault();
    window.scrollToTop();
  });

  // Optional: chiudi/ritorna stato quando la pagina viene navigata via history (SPA simple)
  window.addEventListener("popstate", updateFromScroll);

  // Pulizia (utile se vuoi distruggere il widget manualmente - non usata ora)
  // ritorniamo un oggetto con destroy() per eventuale uso futuro
  return {
    destroy() {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("popstate", updateFromScroll);
      indicator.removeEventListener("click", window.scrollToTop);
      // Non cancelliamo window.scrollToTop per evitare collisioni con altri script,
      // ma puoi farlo qui se sei sicuro che nessun altro lo usa.
      _scrollIndicatorInitialized = false;
    },
  };
}
