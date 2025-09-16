// src/components/js/minimal-navbar.js
export function initMinimalNavbar(containerSelector = ".minimal-navbar__container") {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const menu = container.querySelector(".minimal-navbar__menu");
  const burger = container.querySelector(".minimal-navbar__burger");
  const links = container.querySelectorAll(".minimal-navbar__link");
  if (!menu || !burger) return;

  const closeMenu = () => {
    menu.classList.remove("minimal-active");
    burger.classList.remove("minimal-active");
  };

  burger.addEventListener("click", (ev) => {
    ev.stopPropagation();
    menu.classList.toggle("minimal-active");
    burger.classList.toggle("minimal-active");
  });

  links.forEach((lnk) => lnk.addEventListener("click", closeMenu));

  document.addEventListener("click", (ev) => {
    if (!container.contains(ev.target) && menu.classList.contains("minimal-active")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && menu.classList.contains("minimal-active")) closeMenu();
  });
}
