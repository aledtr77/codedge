document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("search");
  const entries = Array.from(document.querySelectorAll(".main-content details"));
  const clickableItems = Array.from(document.querySelectorAll(".concept-list .clickable-item"));
  const header = document.querySelector("header");
  const mainContent = document.querySelector(".main-content");
  const scrollWrapper = document.querySelector(".glossary-scroll-wrapper");
  let openAsideGroupForItem = () => {};

  if (!entries.length) return;

  function syncHeaderOffset() {
    if (!header) return;
    const h = Math.ceil(header.getBoundingClientRect().height);
    document.body.style.setProperty("--glossary-header-offset", `${h}px`);
    // Keep the scroll wrapper top-padding in sync so content never hides under the fixed header
    if (scrollWrapper) scrollWrapper.style.paddingTop = `${h}px`;
  }

  function normalize(value) {
    return (value || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function enhanceGlossaryLabels() {
    entries.forEach((entry) => {
      entry.querySelectorAll("ol > li").forEach((item) => {
        item.innerHTML = item.innerHTML
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
          .replace(/`([^`]+)`/g, "<code>$1</code>");

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

    // Walk childNodes and find the first non-empty text node
    // (the tag name comes before the .tag-description span)
    const titleNode = Array.from(summary.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );

    return (titleNode?.textContent || "").trim();
  }

  function prepareSearchData() {
    entries.forEach((entry) => {
      const title = getEntryTitle(entry);
      const description = entry.querySelector(".tag-description")?.textContent || "";
      const group = entry.querySelector(".tag-group")?.textContent || "";
      // full normalized text of the whole entry for broad search
      const fullText = normalize(entry.textContent);

      entry.dataset.glossaryTitleRaw = title;
      entry.dataset.glossaryTitle = normalize(title);
      entry.dataset.glossarySummary = normalize(`${title} ${description} ${group}`);
      entry.dataset.glossarySearch = fullText;
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

  function getContentScrollOffset() {
    const headerHeight = header?.offsetHeight || 0;
    const layoutGap = parseFloat(getComputedStyle(mainContent || document.body).marginTop) || 0;
    return headerHeight + layoutGap;
  }

  function getMatchScore(entry, query) {
    const title = entry.dataset.glossaryTitle || "";
    const summary = entry.dataset.glossarySummary || "";
    const fullText = entry.dataset.glossarySearch || "";

    if (!query) return 0;

    // Exact title match
    if (title === query) return 10000;
    // Title starts with query
    if (title.startsWith(query)) return 9000 - Math.max(0, title.length - query.length);
    // Any word in title starts with query
    const titleWords = title.split(/[\s().,_/-]+/).filter(Boolean);
    if (titleWords.some((w) => w.startsWith(query))) return 8000 - Math.max(0, title.length - query.length);
    // Title contains query anywhere
    if (title.includes(query)) return 7000 - title.indexOf(query) - Math.max(0, title.length - query.length);
    // Summary (title+description+group) contains query
    if (summary.includes(query)) return 5000 - summary.indexOf(query);
    // Full text of the entry contains query
    if (fullText.includes(query)) return 3000 - fullText.indexOf(query);

    return -1;
  }

  /**
   * Filter entries using CSS classes (not entry.hidden) to preserve layout.
   * entry.hidden collapses the element completely and can break the grid
   * because the aside loses its sticky scroll context.
   */
  function filterEntries(scrollToFirst = false) {
    const query = normalize(search?.value.trim() || "");

    if (!query) {
      // Reset: show everything, close all, clear active
      entries.forEach((entry) => {
        entry.classList.remove("glossary-entry--hidden");
        entry.open = false;
      });
      setActiveItem("");
      return;
    }

    // Score all entries
    const scored = entries.map((entry, index) => ({
      entry,
      index,
      score: getMatchScore(entry, query),
    }));

    const matches = scored
      .filter((c) => c.score >= 0)
      .sort((a, b) => b.score - a.score || a.index - b.index);

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

    setActiveItem(bestMatch?.dataset.glossaryTitleRaw || "");

    // Only scroll when explicitly requested (sidebar click, not typing)
    if (scrollToFirst && bestMatch && scrollWrapper) {
      // Scroll within the wrapper, not window (page scroll is locked)
      const wrapperRect = scrollWrapper.getBoundingClientRect();
      const entryRect = bestMatch.getBoundingClientRect();
      const gap = 16;
      scrollWrapper.scrollBy({
        top: entryRect.top - wrapperRect.top - gap,
        behavior: "smooth",
      });
    }
  }

  function setupAsideGroups() {
    const groups = Array.from(document.querySelectorAll(".concept-list li:not(.clickable-item)"))
      .map((heading) => {
        const list = heading.nextElementSibling?.tagName === "UL" ? heading.nextElementSibling : null;
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
      const group = groups.find((candidate) => candidate.list === groupList);
      if (group) openGroup(group);
    };

    groups.forEach((group) => {
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

      button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Copiato';
    } catch (error) {
      console.warn("[glossario] copia fallita:", error);
      button.innerHTML = '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i> Errore';
    }

    setTimeout(() => {
      button.innerHTML = original;
    }, 1600);
  }

  enhanceGlossaryLabels();
  prepareSearchData();
  syncHeaderOffset();
  setupAsideGroups();
  // lockAsideScroll removed: body scroll is blocked; aside and main content scroll natively

  if ("ResizeObserver" in window && header) {
    new ResizeObserver(syncHeaderOffset).observe(header);
  }

  window.addEventListener("resize", syncHeaderOffset);

  // Never auto-scroll on typing — keep layout stable
  search?.addEventListener("input", () => filterEntries(false));

  clickableItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (!search) return;
      search.value = item.textContent.trim();
      filterEntries(true); // scroll on explicit sidebar click
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
