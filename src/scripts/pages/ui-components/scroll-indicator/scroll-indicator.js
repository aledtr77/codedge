import { scrollBehavior } from "@/scripts/utils/motion.js";

export function initReadingProgress(rootSelector = "[data-reading-progress]") {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const scroller = root.querySelector("[data-reading-scroller]");
  const progressBar = root.querySelector("[data-reading-bar]");
  const topButton = root.querySelector("[data-reading-top]");
  const links = Array.from(root.querySelectorAll("[data-reading-link]"));
  const sections = Array.from(root.querySelectorAll("[data-reading-section]"));
  if (!scroller || !progressBar || !sections.length) return;

  const getSectionTop = (section) =>
    section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

  const update = () => {
    const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const progress = Math.min(1, Math.max(0, scroller.scrollTop / maxScroll));
    progressBar.style.transform = `scaleX(${progress})`;

    let activeSection = sections[0];
    const readingLine = scroller.scrollTop + scroller.clientHeight * 0.45;

    sections.forEach((section) => {
      if (getSectionTop(section) <= readingLine) {
        activeSection = section;
      }
    });

    if (scroller.scrollTop >= maxScroll - 2) {
      activeSection = sections[sections.length - 1];
    }

    links.forEach((link) => {
      const target = link.getAttribute("href")?.replace("#", "");
      link.classList.toggle("is-active", target === activeSection.id);
    });
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href")?.replace("#", "");
      const target = targetId ? root.querySelector(`#${CSS.escape(targetId)}`) : null;
      if (!target) return;

      event.preventDefault();
      scroller.scrollTo({
        top: getSectionTop(target) - 16,
        behavior: scrollBehavior(),
      });
    });
  });

  topButton?.addEventListener("click", () => {
    scroller.scrollTo({ top: 0, behavior: scrollBehavior() });
  });

  scroller.addEventListener("scroll", update, { passive: true });
  update();
}
