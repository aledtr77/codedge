export function initContentCards(selector = "[data-content-card]") {
  const cards = Array.from(document.querySelectorAll(selector));
  if (!cards.length) return;

  cards.forEach((card) => {
    const saveButton = card.querySelector("[data-card-save]");
    if (!saveButton) return;

    saveButton.addEventListener("click", () => {
      const isPressed = saveButton.getAttribute("aria-pressed") === "true";
      saveButton.setAttribute("aria-pressed", String(!isPressed));
      card.classList.toggle("is-saved", !isPressed);
    });
  });
}
