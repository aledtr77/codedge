// Navigable TOC for guides and tutorials, with active scrollspy.

import { scrollBehavior } from "@/scripts/utils/motion.js";

export default function initGuideToc() {
  const tocLinks = Array.from(document.querySelectorAll('.guide-toc a[href^="#"]'));
  const sections = tocLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;
      return document.querySelector(href);
    })
    .filter((section, index, all) => section && all.indexOf(section) === index);

  if (!tocLinks.length || !sections.length) return;

  // Measured live instead of hardcoded: the fixed header's height varies with
  // viewport (title wrap on mobile), and a stale offset skews both the
  // scrollspy activation line and the scroll-to-anchor landing position.
  const header = document.querySelector("header");
  const getHeaderOffset = () => {
    const height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    return height + 24;
  };
  let scrollTicking = false;

  // The TOC must feel autonomous from the content scroll: the highlight
  // follows the reading position, but the TOC itself repositions only when
  // the active link actually leaves its visible area - instantly and by the
  // minimal amount (block: nearest), never with animated drift. And never
  // while the pointer is over the TOC: at that moment the user owns it.
  const tocContainer = document.querySelector(".guide-toc");
  let pointerInsideToc = false;
  if (tocContainer) {
    tocContainer.addEventListener("pointerenter", () => { pointerInsideToc = true; });
    tocContainer.addEventListener("pointerleave", () => { pointerInsideToc = false; });
  }

  // The TOC is position:fixed on desktop (see the guide stylesheet), so it
  // leaves the grid flow; the placeholder keeps its track occupied and is the
  // source of truth for the fixed element's left/width.
  //
  // The placeholder is server-rendered and CSS sizes both it and the TOC, so
  // the page paints correctly before this file runs. It used to be created
  // here, which made the guide layout depend on JavaScript: until this ran, the
  // article was squeezed into the TOC's track with the TOC on top of it, and
  // that half-laid-out page was on screen for ~200ms on the heaviest guide.
  // What is left here is upkeep, not construction — resizes only.
  const desktopToc = window.matchMedia("(min-width: 1201px)");
  const syncFixedToc = () => {
    if (!tocContainer) return;
    const tocPlaceholder = tocContainer.parentNode.querySelector(".guide-toc-placeholder");
    if (desktopToc.matches && tocPlaceholder) {
      const rect = tocPlaceholder.getBoundingClientRect();
      tocContainer.style.left = `${Math.round(rect.left)}px`;
      tocContainer.style.width = `${Math.round(rect.width)}px`;
    } else {
      // Below the breakpoint CSS hides both; inline values from a wider
      // viewport would otherwise survive the resize.
      tocContainer.style.left = "";
      tocContainer.style.width = "";
    }
  };
  if (tocContainer) {
    syncFixedToc();
    window.addEventListener("resize", syncFixedToc, { passive: true });
    window.addEventListener("load", syncFixedToc, { once: true });
  }

  const setActiveState = (id) => {
    let activeLink = null;
    tocLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
        activeLink = link;
      } else {
        link.removeAttribute("aria-current");
      }
    });

    sections.forEach((section) => {
      section.classList.toggle("is-active", section.id === id);
    });

    if (activeLink && tocContainer && !pointerInsideToc) {
      const containerTop = tocContainer.scrollTop;
      const containerBottom = containerTop + tocContainer.clientHeight;
      const elemTop = activeLink.offsetTop;
      const elemBottom = elemTop + activeLink.clientHeight;

      if (elemTop < containerTop || elemBottom > containerBottom) {
        activeLink.scrollIntoView({ block: "nearest" });
      }
    }
  };

  const getCurrentSection = () => {
    // Tight 30px tolerance, and non-scrollable pages excluded, to avoid
    // false "last chapter" positives.
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const isAtBottom = maxScroll > 0 && scrollY >= maxScroll - 30;

    if (isAtBottom && sections.length > 0) {
      return sections[sections.length - 1];
    }

    const activationLine = getHeaderOffset() + Math.min(window.innerHeight * 0.18, 140);
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
        target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();

      history.replaceState(null, "", href);
      window.scrollTo({ top, behavior: scrollBehavior() });
      setActiveState(target.id);
    });
  });
  // Keep vertical wheel input over the TOC inside the TOC: without this, a
  // wheel at the TOC's scroll boundary (or on a TOC with no overflow) chains
  // into the page scroll, which moves the scrollspy, which re-scrolls the TOC
  // against the user. Same pattern as lockAsideScroll in glossario.js.
  if (tocContainer) {
    tocContainer.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        event.preventDefault();
        tocContainer.scrollTop += event.deltaY;
      },
      { passive: false },
    );
  }

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate, { passive: true });

  const hash = window.location.hash;
  if (hash) {
    const target = document.querySelector(hash);
    if (target) {
      setTimeout(() => {
        const top =
          target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
        window.scrollTo({ top, behavior: scrollBehavior() });
        setActiveState(target.id);
      }, 30);
      return;
    }
  }

  queueScrollUpdate();
}
