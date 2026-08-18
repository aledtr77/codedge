export default function initPageMap() {
  const explorer = document.getElementById("page-map");
  if (!explorer) return;

  const triggers = explorer.querySelectorAll("[data-piece]");
  const defaultPiece = "header";

  const activate = (piece) => {
    if (!piece) return;

    triggers.forEach((el) => {
      const isMatch = el.dataset.piece === piece;
      el.classList.toggle("is-active", isMatch);
      if (el.hasAttribute("aria-pressed")) {
        el.setAttribute("aria-pressed", String(isMatch));
      }
    });

    explorer.querySelectorAll(".page-map__explain").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.piece === piece);
    });

    const mid = explorer.querySelector(".page-map__mid");
    if (mid) mid.classList.toggle("is-active", piece === "main");
  };

  triggers.forEach((el) => {
    if (el.classList.contains("page-map__explain")) return;
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      activate(el.dataset.piece);
    });
    if (el.getAttribute("role") === "button" && el.tagName !== "BUTTON") {
      el.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate(el.dataset.piece);
      });
    }
  });

  activate(defaultPiece);
}
