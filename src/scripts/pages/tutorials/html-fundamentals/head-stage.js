export default function initHeadStage() {
  const explorer = document.getElementById("head-stage");
  if (!explorer) return;

  const triggers = explorer.querySelectorAll("[data-piece]");
  const defaultPiece = "title";

  const activate = (piece) => {
    if (!piece) return;

    triggers.forEach((el) => {
      const isMatch = el.dataset.piece === piece;
      el.classList.toggle("is-active", isMatch);
      if (el.hasAttribute("aria-pressed")) {
        el.setAttribute("aria-pressed", String(isMatch));
      }
    });

    explorer.querySelectorAll(".head-stage__explain").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.piece === piece);
    });
  };

  triggers.forEach((el) => {
    if (el.classList.contains("head-stage__explain")) return;
    el.addEventListener("click", () => activate(el.dataset.piece));
  });

  activate(defaultPiece);
}
