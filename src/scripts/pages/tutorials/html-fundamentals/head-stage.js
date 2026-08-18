export default function initHeadStage() {
  const explorer = document.getElementById("head-stage");
  if (!explorer) return;

  const triggers = explorer.querySelectorAll(".head-stage__chip");
  const defaultPiece = "tab";

  const activate = (piece) => {
    if (!piece) return;

    triggers.forEach((el) => {
      const isMatch = el.dataset.piece === piece;
      el.classList.toggle("is-active", isMatch);
      el.setAttribute("aria-pressed", String(isMatch));
    });

    explorer.querySelectorAll("[data-piece]").forEach((el) => {
      if (el.classList.contains("head-stage__chip")) return;
      el.classList.toggle("is-active", el.dataset.piece === piece);
    });
  };

  triggers.forEach((el) => {
    el.addEventListener("click", () => activate(el.dataset.piece));
  });

  activate(defaultPiece);
}
