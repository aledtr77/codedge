import "@/scripts/components/pwa.js";

function markPageReady() {
  if (document.documentElement.dataset.pageReady === "true") return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.dataset.pageReady = "true";
    });
  });
}

const menuIcon = document.querySelector(".menu-icon"),
  navMenu = document.querySelector(".nav-menu");

if (menuIcon && navMenu) {
  // Set accessibility attributes dynamically to pass Lighthouse A11y audit
  menuIcon.setAttribute("role", "button");
  menuIcon.setAttribute("tabindex", "0");
  menuIcon.setAttribute("aria-label", "Menu di navigazione");
  menuIcon.setAttribute("aria-expanded", "false");

  menuIcon.addEventListener("click", () => {
    const isActive = menuIcon.classList.toggle("active");
    navMenu.classList.toggle("active");
    menuIcon.setAttribute("aria-expanded", String(isActive));
  });

  menuIcon.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      menuIcon.click();
    }
  });

  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !menuIcon.contains(e.target) && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      menuIcon.classList.remove("active");
      menuIcon.setAttribute("aria-expanded", "false");
    }
  });
}

const headings = document.querySelectorAll(".invisible-text, .resize-text");
function handleResize() {
  window.innerWidth < 860
    ? headings.forEach((e) => (e.style.display = "none"))
    : headings.forEach((e) => (e.style.display = ""));
}
(window.addEventListener("resize", handleResize), handleResize());
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", markPageReady, { once: true });
} else {
  markPageReady();
}
window.addEventListener("pageshow", markPageReady);
