// src/components/js/card-interattive.js
// Modulo per carte interattive (flip on click, auto-unflip on mouseleave)
// Esporta initInteractiveCards() — chiamala dal main.js dentro DOMContentLoaded

let _cardsInitialized = false;

export function initInteractiveCards(selector = ".card", options = {}) {
  // Se vuoi ri-inizializzare in HMR/dev, puoi forzare _cardsInitialized = false. 
  // Qui consideriamo init one-shot per evitare duplice binding.
  if (_cardsInitialized) return;
  _cardsInitialized = true;

  const cards = Array.from(document.querySelectorAll(selector));
  if (!cards.length) return;

  cards.forEach((card) => {
    // Evita doppio binding su card già inizializzata (utile se chiamato più volte)
    if (card.dataset.cardInit === "1") return;
    card.dataset.cardInit = "1";

    // Memorizziamo il timeout sul nodo per singola card
    card.__rotationTimeout = null;
    let hovered = false;

    // toggle flip
    const toggleFlip = (ev) => {
      // se è un evento da tastiera, preveniamo scroll su Space
      if (ev && ev.type === "keydown") {
        if (!(ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar")) return;
        ev.preventDefault();
      }
      // cancella eventuale timeout pendente
      if (card.__rotationTimeout) {
        clearTimeout(card.__rotationTimeout);
        card.__rotationTimeout = null;
      }
      card.classList.toggle("flipped");
    };

    // mouse enter
    const onMouseEnter = () => {
      hovered = true;
      if (card.__rotationTimeout) {
        clearTimeout(card.__rotationTimeout);
        card.__rotationTimeout = null;
      }
    };

    // mouse leave: se è capovolta, aspetta 1s e poi toglie flipped (comportamento originale)
    const onMouseLeave = () => {
      hovered = false;
      if (card.classList.contains("flipped")) {
        // salva timeout sul nodo così possiamo cancellarlo se necessario
        card.__rotationTimeout = setTimeout(() => {
          card.classList.remove("flipped");
          card.__rotationTimeout = null;
        }, options.unflipDelay || 1000);
      }
    };

    // keyboard accessibility: rendi focusable se non lo è
    if (!card.hasAttribute("tabindex")) {
      card.setAttribute("tabindex", "0");
    }

    const onKeyDown = (ev) => {
      if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
        toggleFlip(ev);
      }
    };

    // bind events
    card.addEventListener("click", toggleFlip);
    card.addEventListener("mouseenter", onMouseEnter);
    card.addEventListener("mouseleave", onMouseLeave);
    card.addEventListener("keydown", onKeyDown);

    // optional: cleanup handler seeded on the element (utile in dev/HMR)
    card.__cardCleanup = () => {
      card.removeEventListener("click", toggleFlip);
      card.removeEventListener("mouseenter", onMouseEnter);
      card.removeEventListener("mouseleave", onMouseLeave);
      card.removeEventListener("keydown", onKeyDown);
      if (card.__rotationTimeout) {
        clearTimeout(card.__rotationTimeout);
        card.__rotationTimeout = null;
      }
      delete card.dataset.cardInit;
      delete card.__cardCleanup;
    };
  });

  // opzionale: ritorniamo funzione destroy per test o HMR
  return {
    destroy() {
      document.querySelectorAll(selector).forEach((card) => {
        if (card.__cardCleanup) card.__cardCleanup();
      });
      _cardsInitialized = false;
    },
  };
}
