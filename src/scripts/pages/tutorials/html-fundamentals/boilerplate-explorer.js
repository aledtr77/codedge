export default function initBoilerplateExplorer() {
  const explorer = document.getElementById("boilerplate-explorer");
  if (!explorer) return;

  const triggers = explorer.querySelectorAll(
    ".boilerplate-explorer__btn, .boilerplate-explorer__line[data-piece]"
  );
  const windowEl = explorer.querySelector(".boilerplate-explorer__window");
  const defaultPiece = "doctype";

  const activate = (piece) => {
    if (!piece) return;

    triggers.forEach((el) => {
      const isMatch = el.dataset.piece === piece;
      el.classList.toggle("is-active", isMatch);
      if (el.hasAttribute("aria-pressed")) {
        el.setAttribute("aria-pressed", String(isMatch));
      }
    });

    explorer.querySelectorAll(".boilerplate-explorer__explain").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.piece === piece);
    });

    if (windowEl) windowEl.dataset.active = piece;
  };

  triggers.forEach((el) => {
    el.addEventListener("click", () => activate(el.dataset.piece));
  });

  activate(defaultPiece);
}
