export default function initTableExplorer() {
  const explorer = document.getElementById("table-explorer");
  if (!explorer) return;

  const triggers = explorer.querySelectorAll(".table-explorer__btn");
  const defaultPiece = "grid";

  const activate = (piece) => {
    if (!piece) return;

    triggers.forEach((el) => {
      const isMatch = el.dataset.piece === piece;
      el.classList.toggle("is-active", isMatch);
      el.setAttribute("aria-pressed", String(isMatch));
    });

    explorer.querySelectorAll("[data-piece]").forEach((el) => {
      if (el.classList.contains("table-explorer__btn")) return;
      el.classList.toggle("is-active", el.dataset.piece === piece);
    });
  };

  triggers.forEach((el) => {
    el.addEventListener("click", () => activate(el.dataset.piece));
  });

  activate(defaultPiece);
}
