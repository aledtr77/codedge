export function initAccessibleHeader(rootSelector = "[data-accessible-header]") {
  const header = document.querySelector(rootSelector);
  if (!header) return;

  const toggle = header.querySelector("[data-header-toggle]");
  const menu = header.querySelector("[data-header-menu]");
  const links = Array.from(header.querySelectorAll("[data-header-link]"));
  if (!toggle || !menu) return;

  const setOpen = (isOpen) => {
    header.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  };

  const close = () => setOpen(false);

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((item) => item.removeAttribute("aria-current"));
      link.setAttribute("aria-current", "page");
      close();
    });
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}
