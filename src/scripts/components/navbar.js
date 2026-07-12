import "@/scripts/components/pwa.js";

function markPageReady() {
  if (document.documentElement.dataset.pageReady === "true") return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.dataset.pageReady = "true";
    });
  });
}

const header = document.querySelector("header"),
  menuIcon = document.querySelector(".menu-icon"),
  navMenu = document.querySelector(".nav-menu");

if (menuIcon && navMenu) {
  // Set accessibility attributes dynamically to pass Lighthouse A11y audit
  menuIcon.setAttribute("role", "button");
  menuIcon.setAttribute("tabindex", "0");
  menuIcon.setAttribute("aria-label", "Menu di navigazione");
  menuIcon.setAttribute("aria-expanded", "false");

  menuIcon.addEventListener("click", (e) => {
    e.stopPropagation(); // Block bubbling to document click listener
    const isActive = menuIcon.classList.toggle("active");
    navMenu.classList.toggle("active");
    menuIcon.setAttribute("aria-expanded", String(isActive));

    if (isActive && header) {
      header.classList.remove("header-hidden");
    }
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

// Smart Sticky Header logic
if (header) {
  let lastScrollY = window.scrollY;
  let ticking = false;
  const tolerance = 15; // minimum scroll delta in px to trigger action

  // Track if user is touching/clicking the header to prevent hiding during taps or micro-scrolls
  let headerTouched = false;
  let touchTimeoutId = null;

  header.addEventListener("pointerdown", () => {
    headerTouched = true;
    if (touchTimeoutId) {
      clearTimeout(touchTimeoutId);
      touchTimeoutId = null;
    }
  }, { passive: true });

  const resetHeaderTouch = () => {
    if (touchTimeoutId) {
      clearTimeout(touchTimeoutId);
    }
    // Delay resetting to ensure any delayed scroll events or scroll inertia complete
    touchTimeoutId = setTimeout(() => {
      headerTouched = false;
      touchTimeoutId = null;
    }, 350);
  };

  window.addEventListener("pointerup", resetHeaderTouch, { passive: true });
  window.addEventListener("pointercancel", resetHeaderTouch, { passive: true });

  const updateHeader = () => {
    const isMobileMenuOpen = navMenu && navMenu.classList.contains("active");

    // Defensive early aborts: if menu is open or touch is active, force visibility and return
    if (isMobileMenuOpen) {
      header.classList.remove("header-hidden");
      ticking = false;
      return;
    }

    if (headerTouched) {
      ticking = false;
      return;
    }

    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    // Check if user reached the bottom of the page (with a 10px tolerance)
    const isAtBottom = (window.innerHeight + currentScrollY) >= (document.documentElement.scrollHeight - 10);

    if (currentScrollY <= 50) {
      header.classList.remove("header-hidden", "header-scrolled");
    } else {
      header.classList.add("header-scrolled");

      // Show header if scrolling up OR reached the bottom of the page
      if (isAtBottom || scrollDelta < -tolerance) {
        header.classList.remove("header-hidden");
      } 
      // Hide header if scrolling down (and not at the bottom)
      else if (scrollDelta > tolerance) {
        header.classList.add("header-hidden");
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



