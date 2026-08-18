export default function initFormLab() {
  const explorer = document.getElementById("form-lab");
  if (!explorer) return;

  const triggers = explorer.querySelectorAll(".form-lab__chip");
  const defaultPiece = "type";

  const activate = (piece) => {
    if (!piece) return;

    triggers.forEach((el) => {
      const isMatch = el.dataset.piece === piece;
      el.classList.toggle("is-active", isMatch);
      el.setAttribute("aria-pressed", String(isMatch));
    });

    explorer.querySelectorAll("[data-piece]").forEach((el) => {
      if (el.classList.contains("form-lab__chip")) return;
      el.classList.toggle("is-active", el.dataset.piece === piece);
    });
  };

  triggers.forEach((el) => {
    el.addEventListener("click", () => activate(el.dataset.piece));
  });

  explorer.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const out = form.querySelector(".form-lab__sent");
      if (!out) return;
      const pairs = [...new FormData(form)]
        .map(([key, value]) => `${key}=${value || "…"}`)
        .join("\n");
      out.textContent = pairs || out.dataset.empty || "";
    });
  });

  activate(defaultPiece);
}
