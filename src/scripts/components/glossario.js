import { scrollBehavior } from "@/scripts/utils/motion.js";
import { t } from "@/i18n/ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("search");
  const entries = Array.from(document.querySelectorAll(".main-content details"));
  const clickableItems = Array.from(document.querySelectorAll(".concept-list .clickable-item"));
  const header = document.querySelector("header");
  const termsContainer = document.querySelector(".main-content > div:not(.sidebar-placeholder)");
  // Must mirror the glossario.css breakpoint that switches the scroll owner:
  // above it the terms panel scrolls (desktop app-shell), at or below it the
  // document itself scrolls and the wrapper becomes overflow:visible.
  const mobileLayout = window.matchMedia("(max-width: 1180px)");
  let openAsideGroupForItem = () => {};
  let asideGroups = [];

  if (!entries.length) return;

  function syncHeaderOffset() {
    if (!header) return;
    const h = Math.ceil(header.getBoundingClientRect().height);
    document.body.style.setProperty("--glossary-header-offset", `${h}px`);
  }

  function normalize(value) {
    return (value || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  // The enhancement below rewrites each definition: it splits the single text
  // node the server sent into a <span class="glossary-label"> plus several
  // text nodes. The language switch matches text nodes by position, so once a
  // definition has been enhanced its text can no longer be translated in
  // place. We therefore keep the original markup and hand it back just before
  // a swap, re-applying the enhancement once the new text is in.
  const pristine = new WeakMap();

  function definitionItems() {
    return entries.flatMap((entry) => Array.from(entry.querySelectorAll("ol > li")));
  }

  function restorePristine() {
    definitionItems().forEach((item) => {
      const html = pristine.get(item);
      if (html !== undefined) item.innerHTML = html;
    });
  }

  function enhanceGlossaryLabels() {
    entries.forEach((entry) => {
      entry.querySelectorAll("ol > li").forEach((item) => {
        if (!pristine.has(item)) pristine.set(item, item.innerHTML);
        // 1. Process markdown formatting safely on text nodes to avoid parsing escaped HTML tags as actual DOM elements
        const childNodes = Array.from(item.childNodes);
        childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (/\*\*([^*]+)\*\*|`([^`]+)`/.test(text)) {
              const fragment = document.createDocumentFragment();
              let lastIndex = 0;
              const regex = /\*\*([^*]+)\*\*|`([^`]+)`/g;
              let match;
              while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                  fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                if (match[1]) {
                  const strong = document.createElement("strong");
                  strong.textContent = match[1];
                  fragment.appendChild(strong);
                } else if (match[2]) {
                  const code = document.createElement("code");
                  code.textContent = match[2];
                  fragment.appendChild(code);
                }
                lastIndex = regex.lastIndex;
              }
              if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
              }
              node.replaceWith(fragment);
            }
          }
        });

        // 2. Wrap glossary labels like "Cos'è:" in span elements
        if (item.querySelector(".glossary-label")) return;

        const textNode = Array.from(item.childNodes).find(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
        );
        if (!textNode) return;

        const match = textNode.textContent.match(/^(\s*)([^:\n]{2,40}:)(\s*)/);
        if (!match) return;

        const [, leading, label, spacing] = match;
        const remainder = textNode.textContent.slice(match[0].length);
        const fragment = document.createDocumentFragment();
        const labelEl = document.createElement("span");

        labelEl.className = "glossary-label";
        labelEl.textContent = label;

        if (leading) fragment.appendChild(document.createTextNode(leading));
        fragment.appendChild(labelEl);
        fragment.appendChild(document.createTextNode(spacing || " "));
        if (remainder) fragment.appendChild(document.createTextNode(remainder));

        textNode.replaceWith(fragment);
      });
    });
  }

  function getEntryTitle(entry) {
    const summary = entry.querySelector("summary");
    if (!summary) return "";

    // Clone summary element to avoid editing live DOM
    const clone = summary.cloneNode(true);
    // Remove description and group badges to isolate the term name
    clone.querySelectorAll(".tag-description, .tag-group").forEach((el) => el.remove());

    return clone.textContent.trim();
  }

  function prepareSearchData() {
    entries.forEach((entry) => {
      const title = getEntryTitle(entry);
      const description = entry.querySelector(".tag-description")?.textContent || "";
      const group = entry.querySelector(".tag-group")?.textContent || "";

      entry.dataset.glossaryTitleRaw = title;
      entry.dataset.glossaryTitle = normalize(title);
      // Deliberately scoped to title + short description + category, not the
      // full entry body: the body's "Cos'è/A cosa serve/Quando usarlo" text is
      // boilerplate-heavy (nearly every entry mentions the page's own subject,
      // e.g. "in JavaScript"), so substring-matching against it would surface
      // dozens of unrelated entries for any common word - the opposite of
      // precise ranking.
      entry.dataset.glossarySummary = normalize(`${title} ${description} ${group}`);
    });
  }

  function setActiveItem(rawTitle) {
    const normalizedQuery = normalize(rawTitle);
    let activeItem = null;

    clickableItems.forEach((item) => {
      const active = normalize(item.textContent) === normalizedQuery;
      item.classList.toggle("is-active", active);
      if (active) activeItem = item;
    });

    if (activeItem) openAsideGroupForItem(activeItem);
  }

  // Places the entry just below the fixed header (which holds the search bar).
  // Double rAF: the [open] reflow must settle before measuring positions.
  function scrollEntryIntoView(entry) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const gap = 16;
        const entryRect = entry.getBoundingClientRect();

        if (!mobileLayout.matches && termsContainer) {
          // Desktop app-shell: the terms panel is the only scroll container.
          const containerRect = termsContainer.getBoundingClientRect();
          termsContainer.scrollTo({
            top: termsContainer.scrollTop + (entryRect.top - containerRect.top) - gap,
            behavior: scrollBehavior(),
          });
        } else {
          // Mobile: glossario.css hands the scroll back to the document and
          // makes the wrapper overflow:visible, so scrolling any inner element
          // is a no-op - only window.scrollTo actually moves the viewport.
          const headerHeight = header ? header.getBoundingClientRect().height : 0;
          window.scrollTo({
            top: window.scrollY + entryRect.top - headerHeight - gap,
            behavior: scrollBehavior(),
          });
        }
      });
    });
  }

  // Named match tiers instead of a blended magic-number score: each tier is a
  // strictly stronger signal than the one below it, so ranking is "sort by
  // tier" plus a couple of positional tie-breakers, not an additive formula.
  const MATCH_TIER = Object.freeze({
    EXACT_TITLE: 6, // title === query
    TITLE_STARTS_WITH: 5, // title.startsWith(query)
    TITLE_WORD_BOUNDARY: 4, // query matches at the start of a word inside the title
    TITLE_CONTAINS: 3, // title contains query anywhere, or has every query word
    SUMMARY_CONTAINS: 2, // title+description+group has every query word
    NO_MATCH: 0,
  });

  const escapeRegExp = (text) => text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  // Word-boundary prefix match, e.g. "flex" matches "flexbox" but not "reflex".
  // Returns the match index, or -1. Text/word are already normalized (lowercased,
  // diacritics stripped) by the caller, so no case-insensitive flag is needed.
  const wordBoundaryIndex = (text, word) => text.search(new RegExp('\\b' + escapeRegExp(word)));

  function classifyMatch(entry, query, queryWords) {
    const title = entry.dataset.glossaryTitle || "";
    const summary = entry.dataset.glossarySummary || "";
    const noMatch = { tier: MATCH_TIER.NO_MATCH, matchIndex: 0, titleLength: title.length };

    // Very short queries (1-2 chars) only match the title, to avoid drowning
    // the result list in unrelated entries whose body text happens to contain
    // a common one- or two-letter substring.
    if (query.length < 3 && !queryWords.every((word) => title.includes(word))) {
      return noMatch;
    }

    if (title === query) {
      return { tier: MATCH_TIER.EXACT_TITLE, matchIndex: 0, titleLength: title.length };
    }
    if (title.startsWith(query)) {
      return { tier: MATCH_TIER.TITLE_STARTS_WITH, matchIndex: 0, titleLength: title.length };
    }

    const wbIndex = wordBoundaryIndex(title, query);
    if (wbIndex >= 0) {
      return { tier: MATCH_TIER.TITLE_WORD_BOUNDARY, matchIndex: wbIndex, titleLength: title.length };
    }

    // True substring containment (unlike the word-boundary check above, this
    // also matches mid-word - e.g. "script" inside "javascript").
    const substringIndex = title.indexOf(query);
    const titleHasAllWords = queryWords.every((word) => title.includes(word));
    if (substringIndex >= 0 || titleHasAllWords) {
      return {
        tier: MATCH_TIER.TITLE_CONTAINS,
        matchIndex: substringIndex >= 0 ? substringIndex : 0,
        titleLength: title.length,
      };
    }

    if (queryWords.every((word) => summary.includes(word))) {
      return { tier: MATCH_TIER.SUMMARY_CONTAINS, matchIndex: 0, titleLength: title.length };
    }

    return noMatch;
  }

  /**
   * Filter entries using CSS classes (not entry.hidden) to preserve layout.
   * entry.hidden collapses the element completely and can break the grid
   * because the aside loses its sticky scroll context.
   */
  function filterEntries(scrollToFirst = false) {
    const query = normalize(search?.value.trim() || "");

    if (!query) {
      entries.forEach((entry) => {
        entry.classList.remove("glossary-entry--hidden");
        entry.open = false;
      });
      clickableItems.forEach((item) => {
        item.classList.remove("sidebar-item--hidden");
      });
      asideGroups.forEach((group) => {
        group.heading.classList.remove("sidebar-group--hidden");
        group.list.classList.remove("sidebar-group-list--hidden");
        group.list.hidden = true;
        group.heading.classList.remove("is-open");
        group.heading.setAttribute("aria-expanded", "false");
      });
      setActiveItem("");
      return;
    }

    const queryWords = query.split(/\s+/).filter(Boolean);
    const scored = entries.map((entry, index) => ({
      entry,
      index,
      ...classifyMatch(entry, query, queryWords),
    }));

    const matches = scored
      .filter((c) => c.tier > MATCH_TIER.NO_MATCH)
      .sort((a, b) =>
        b.tier - a.tier || // stronger match tier wins
        a.matchIndex - b.matchIndex || // earlier match position in the title wins
        a.titleLength - b.titleLength || // shorter, more specific title wins
        a.index - b.index // stable DOM order as final fallback
      );

    const bestMatch = matches[0]?.entry || null;
    const matchSet = new Set(matches.map((c) => c.entry));

    entries.forEach((entry) => {
      const visible = matchSet.has(entry);
      // Use a CSS class instead of `hidden` to avoid layout collapse
      entry.classList.toggle("glossary-entry--hidden", !visible);
      if (visible) {
        // Open only the best match; collapse others so user can expand them
        entry.open = entry === bestMatch;
      }
    });

    const visibleTitlesSet = new Set(matches.map((c) => c.entry.dataset.glossaryTitle));

    clickableItems.forEach((item) => {
      const itemTitle = normalize(item.textContent);
      const visible = visibleTitlesSet.has(itemTitle);
      item.classList.toggle("sidebar-item--hidden", !visible);
    });

    asideGroups.forEach((group) => {
      const itemsInGroup = Array.from(group.list.querySelectorAll(".clickable-item"));
      const hasVisibleItems = itemsInGroup.some((item) => !item.classList.contains("sidebar-item--hidden"));

      group.heading.classList.toggle("sidebar-group--hidden", !hasVisibleItems);
      group.list.classList.toggle("sidebar-group-list--hidden", !hasVisibleItems);

      if (hasVisibleItems) {
        group.list.hidden = false;
        group.heading.classList.add("is-open");
        group.heading.setAttribute("aria-expanded", "true");
      } else {
        group.list.hidden = true;
        group.heading.classList.remove("is-open");
        group.heading.setAttribute("aria-expanded", "false");
      }
    });

    setActiveItem(bestMatch?.dataset.glossaryTitleRaw || "");

    // Scroll to the matched term (after layout reflow settles)
    if (scrollToFirst && bestMatch) {
      scrollEntryIntoView(bestMatch);
    }
  }

  function setupAsideGroups() {
    asideGroups = Array.from(document.querySelectorAll(".concept-list li:not(.clickable-item)"))
      .map((heading) => {
        const list = (heading.nextElementSibling?.tagName === "UL")
          ? heading.nextElementSibling
          : heading.querySelector("ul");
        if (!list) return null;

        heading.classList.add("concept-group");
        heading.setAttribute("role", "button");
        heading.setAttribute("tabindex", "0");
        heading.setAttribute("aria-expanded", "false");
        list.classList.add("concept-group-list");
        list.hidden = true;

        return { heading, list };
      })
      .filter(Boolean);

    function setGroupOpen(group, isOpen) {
      group.list.hidden = !isOpen;
      group.heading.classList.toggle("is-open", isOpen);
      group.heading.setAttribute("aria-expanded", String(isOpen));
    }

    function toggleGroup(group) {
      setGroupOpen(group, group.list.hidden);
    }

    function openGroup(group) {
      setGroupOpen(group, true);
    }

    openAsideGroupForItem = (item) => {
      const groupList = item.closest(".concept-group-list");
      const group = asideGroups.find((candidate) => candidate.list === groupList);
      if (group) openGroup(group);
    };

    asideGroups.forEach((group) => {
      group.heading.addEventListener("click", () => toggleGroup(group));
      group.heading.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleGroup(group);
      });
    });

    clickableItems.forEach((item) => {
      item.addEventListener("click", () => {
        openAsideGroupForItem(item);
      });
    });
  }

  function lockAsideScroll() {
    const aside = document.querySelector("aside");
    if (!aside) return;

    aside.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

        event.preventDefault();
        aside.scrollTop += event.deltaY;
      },
      { passive: false },
    );
  }

  async function copyCode(button) {
    const codeEl = button.closest(".code-container")?.querySelector("code");
    if (!codeEl) return;

    const text = codeEl.innerText || codeEl.textContent || "";
    const original = button.innerHTML;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      button.innerHTML = `<i class="fas fa-check" aria-hidden="true"></i> ${t("code.copied")}`;
    } catch (error) {
      console.warn("[glossario] copia fallita:", error);
      button.innerHTML = `<i class="fas fa-triangle-exclamation" aria-hidden="true"></i> ${t("code.error")}`;
    }

    setTimeout(() => {
      button.innerHTML = original;
    }, 1600);
  }

  enhanceGlossaryLabels();
  prepareSearchData();
  syncHeaderOffset();
  setupAsideGroups();

  // The language switch replaces text in place without touching structure, so
  // it needs the definitions back in their server-rendered shape first, and
  // the search index rebuilt afterwards — it caches the localised title,
  // description and category on each entry's dataset.
  window.addEventListener("codedge:lang-will-change", restorePristine);
  window.addEventListener("codedge:lang-changed", () => {
    enhanceGlossaryLabels();
    prepareSearchData();
    filterEntries(false);
  });

  if ("ResizeObserver" in window && header) {
    new ResizeObserver(syncHeaderOffset).observe(header);
  }

  window.addEventListener("resize", syncHeaderOffset);

  search?.addEventListener("input", () => filterEntries(true));

  clickableItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (search) {
        search.value = "";
        filterEntries(false);
      }

      const normalizedTitle = normalize(item.textContent);
      const targetEntry = entries.find(
        (entry) => entry.dataset.glossaryTitle === normalizedTitle
      );

      if (targetEntry) {
        entries.forEach((entry) => {
          entry.open = false;
        });
        targetEntry.open = true;
        setActiveItem(targetEntry.dataset.glossaryTitleRaw);
        scrollEntryIntoView(targetEntry);
      }
    });
  });

  document.addEventListener("click", (event) => {
    const copyBtn = event.target.closest(".copy-btn");
    if (!copyBtn) return;

    event.preventDefault();
    copyCode(copyBtn);
  });

  window.addEventListener("beforeunload", () => {
    if (search) search.value = "";
  });

  filterEntries(false);
});
