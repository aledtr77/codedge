document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("search");
  const entries = Array.from(document.querySelectorAll(".main-content details"));
  const clickableItems = Array.from(document.querySelectorAll(".concept-list .clickable-item"));
  const header = document.querySelector("header");
  const mainContent = document.querySelector(".main-content");
  const scrollWrapper = document.querySelector(".glossary-scroll-wrapper");
  const termsContainer = document.querySelector(".main-content > div:not(.sidebar-placeholder)");
  let openAsideGroupForItem = () => {};

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

  function enhanceGlossaryLabels() {
    entries.forEach((entry) => {
      entry.querySelectorAll("ol > li").forEach((item) => {
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
    if (!query) return 0;

    const title = entry.dataset.glossaryTitle || "";
    const summary = entry.dataset.glossarySummary || "";
    const fullText = entry.dataset.glossarySearch || "";

    // Split search query into separate words to support multi-word search in any order
    const queryWords = query.split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return 0;

    // Helper to check if a word matches as a prefix of any word in the text (using word boundary \b)
    const hasWordPrefix = (text, qWord) => {
      const escaped = qWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('\\b' + escaped, 'i');
      return regex.test(text);
    };

    // EVERY word in the query must match as a prefix of at least one word in title, summary, or fullText
    const matchesAllWords = queryWords.every((word) => 
      hasWordPrefix(title, word) || hasWordPrefix(summary, word) || hasWordPrefix(fullText, word)
    );

    if (!matchesAllWords) return -1; // Filter out entries that do not match all typed words

    let score = 0;

    // 1. Title matches query exactly (highest priority)
    if (title === query) {
      score += 20000;
    }
    // 2. Title starts with query
    else if (title.startsWith(query)) {
      score += 15000 - title.length;
    }
    // 3. Title contains query word boundary prefix
    else if (hasWordPrefix(title, query)) {
      score += 10000 - title.indexOf(query) - title.length;
    }

    // 4. Boost score if specific words in the title match/start with the query words
    const titleWords = title.split(/[\s().,_/-]+/).filter(Boolean);
    queryWords.forEach((qWord) => {
      if (titleWords.includes(qWord)) {
        score += 3000;
      } else if (titleWords.some((tWord) => tWord.startsWith(qWord))) {
        score += 1500;
      }
    });

    // 5. Summary prefix matches
    queryWords.forEach((qWord) => {
      if (hasWordPrefix(summary, qWord)) {
        score += 1000;
      }
    });

    return score;
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

    // Scroll to the matched term (after layout reflow settles)
    if (scrollToFirst && bestMatch) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const isDesktop = window.innerWidth > 1180;
          if (isDesktop && termsContainer) {
            // Desktop: scroll the independent terms container panel
            const containerRect = termsContainer.getBoundingClientRect();
            const entryRect = bestMatch.getBoundingClientRect();
            const gap = 16;
            termsContainer.scrollTo({
              top: termsContainer.scrollTop + (entryRect.top - containerRect.top) - gap,
              behavior: "smooth",
            });
          } else if (scrollWrapper) {
            // Mobile: scroll the entire wrapper
            const wrapperRect = scrollWrapper.getBoundingClientRect();
            const entryRect = bestMatch.getBoundingClientRect();
            const gap = 16;
            scrollWrapper.scrollTo({
              top: scrollWrapper.scrollTop + (entryRect.top - wrapperRect.top) - gap,
              behavior: "smooth",
            });
          }
        });
      });
    }
  }

  function setupAsideGroups() {
    const groups = Array.from(document.querySelectorAll(".concept-list li:not(.clickable-item)"))
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

  // Auto-scroll to matched term on typing
  search?.addEventListener("input", () => filterEntries(true));

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
