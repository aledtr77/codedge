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

  const setActiveLink = (id) => {
    tocLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
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
      setActiveLink(target.id);
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        let best = null;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        });

        if (best?.target?.id) {
          setActiveLink(best.target.id);
        }
      },
      {
        root: null,
        rootMargin: "-32% 0px -58% 0px",
        threshold: [0.1, 0.25, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));
  } else {
    const updateOnScroll = () => {
      const current = sections
        .slice()
        .reverse()
        .find((section) => section.getBoundingClientRect().top <= headerOffset + 8);

      if (current) setActiveLink(current.id);
    };

    window.addEventListener("scroll", updateOnScroll, { passive: true });
    updateOnScroll();
  }

  const hash = window.location.hash;
  if (hash) {
    const target = document.querySelector(hash);
    if (target) {
      setTimeout(() => {
        const top =
          target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top, behavior: "smooth" });
        setActiveLink(target.id);
      }, 30);
      return;
    }
  }

  setActiveLink(sections[0].id);
}

document.addEventListener("DOMContentLoaded", () => {
  initGuideToc();
});
