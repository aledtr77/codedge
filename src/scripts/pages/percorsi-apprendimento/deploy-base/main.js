import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@/styles/pages/percorsi-apprendimento/git-pratico-senza-panico/index.css";

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

function initGuideToc() {
  const tocLinks = Array.from(document.querySelectorAll('.guide-toc a[href^="#"]'));
  const sections = tocLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;
      return document.querySelector(href);
    })
    .filter((section, index, all) => section && all.indexOf(section) === index);

  if (!tocLinks.length || !sections.length) return;

  const headerOffset = 120;
  let scrollTicking = false;

  const setActiveState = (id) => {
    tocLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    sections.forEach((section) => {
      section.classList.toggle("is-active", section.id === id);
    });
  };

  const getCurrentSection = () => {
    const activationLine = headerOffset + Math.min(window.innerHeight * 0.18, 140);
    let current = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= activationLine) {
        current = section;
      }
    });

    return current;
  };

  const updateOnScroll = () => {
    scrollTicking = false;
    const current = getCurrentSection();
    if (current) setActiveState(current.id);
  };

  const queueScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateOnScroll);
  };

  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      const top =
        target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      history.replaceState(null, "", href);
      window.scrollTo({ top, behavior: "smooth" });
      setActiveState(target.id);
    });
  });
  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate, { passive: true });

  const hash = window.location.hash;
  if (hash) {
    const target = document.querySelector(hash);
    if (target) {
      setTimeout(() => {
        const top =
          target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top, behavior: "smooth" });
        setActiveState(target.id);
      }, 30);
      return;
    }
  }

  queueScrollUpdate();
}

document.addEventListener("DOMContentLoaded", () => {
  initGuideToc();
});
