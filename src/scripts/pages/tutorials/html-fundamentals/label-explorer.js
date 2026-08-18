export default function initLabelExplorer() {
  const explorer = document.getElementById("label-explorer");
  if (!explorer) return;

  const triggers = explorer.querySelectorAll(".label-explorer__btn");
  const defaultPiece = "invisible";

  const activate = (piece) => {
    if (!piece) return;

    triggers.forEach((el) => {
      const isMatch = el.dataset.piece === piece;
      el.classList.toggle("is-active", isMatch);
      el.setAttribute("aria-pressed", String(isMatch));
    });

    explorer.querySelectorAll("[data-piece]").forEach((el) => {
      if (el.classList.contains("label-explorer__btn")) return;
      el.classList.toggle("is-active", el.dataset.piece === piece);
    });
  };

  triggers.forEach((el) => {
    el.addEventListener("click", () => activate(el.dataset.piece));
  });

  activate(defaultPiece);
}
