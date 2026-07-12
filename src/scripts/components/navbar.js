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
    document.body.classList.toggle("no-scroll", isActive);
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
      document.body.classList.remove("no-scroll");
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

// Smart Sticky Header logic
const header = document.querySelector("header");
if (header) {
  let lastScrollY = window.scrollY;
  let ticking = false;
  const tolerance = 15; // minimum scroll delta in px to trigger action

  const updateHeader = () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;
    const isMobileMenuOpen = navMenu && navMenu.classList.contains("active");

    if (currentScrollY <= 50) {
      header.classList.remove("header-hidden", "header-scrolled");
    } else {
      header.classList.add("header-scrolled");

      if (!isMobileMenuOpen) {
        if (scrollDelta > tolerance) {
          header.classList.add("header-hidden");
        } else if (scrollDelta < -tolerance) {
          header.classList.remove("header-hidden");
        }
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}

