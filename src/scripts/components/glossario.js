document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("search");
  const entries = Array.from(document.querySelectorAll(".main-content details"));
  const clickableItems = Array.from(document.querySelectorAll(".concept-list .clickable-item"));
  const header = document.querySelector("header");
  const mainContent = document.querySelector(".main-content");
  let openAsideGroupForItem = () => {};

  if (!entries.length) return;

  function syncHeaderOffset() {
    if (!header) return;
    document.body.style.setProperty("--glossary-header-offset", `${Math.ceil(header.getBoundingClientRect().height)}px`);
  }

  function normalize(value) {
    return (value || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
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

    const titleNode = Array.from(summary.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );

    return (titleNode?.textContent || summary.textContent || "").trim();
  }

  function prepareSearchData() {
    entries.forEach((entry) => {
      const title = getEntryTitle(entry);
      const description = entry.querySelector(".tag-description")?.textContent || "";
      const group = entry.querySelector(".tag-group")?.textContent || "";

      entry.dataset.glossaryTitleRaw = title;
      entry.dataset.glossaryTitle = normalize(title);
      entry.dataset.glossarySummary = normalize(`${title} ${description} ${group}`);
      entry.dataset.glossarySearch = normalize(entry.textContent);
    });
  }

  function setActiveItem(query) {
    const normalizedQuery = normalize(query);
    let activeItem = null;

    clickableItems.forEach((item) => {
      const active = normalize(item.textContent.trim()) === normalizedQuery;
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
    const titleWords = title.split(/[\s().,_-]+/).filter(Boolean);

    if (!query) return 0;
    if (title === query) return 10000;
    if (title.startsWith(query)) return 9000 - Math.max(0, title.length - query.length);
    if (titleWords.some((word) => word.startsWith(query))) return 8000 - Math.max(0, title.length - query.length);
    if (title.includes(query)) return 7000 - title.indexOf(query) - Math.max(0, title.length - query.length);
    if (summary.includes(query)) return 5000 - summary.indexOf(query);

    return -1;
  }

  function findBestEntry(query) {
    return entries
      .map((entry, index) => ({ entry, index, score: getMatchScore(entry, query) }))
      .filter((candidate) => candidate.score >= 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.entry || null;
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

  function filterEntries(scrollToFirst = false) {
    const query = normalize(search?.value.trim() || "");

    if (!query) {
      entries.forEach((entry) => {
        entry.hidden = false;
        entry.open = false;
      });
      setActiveItem("");
      return;
    }

    // Score every entry and collect those that match (score >= 0)
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
      entry.hidden = !visible;
      // Auto-open only the best match, collapse the others
      if (visible) {
        entry.open = entry === bestMatch;
      }
    });

    setActiveItem(bestMatch?.dataset.glossaryTitleRaw || "");

    if (scrollToFirst && bestMatch) {
      const offset = getContentScrollOffset();
      window.scrollTo({
        top: bestMatch.getBoundingClientRect().top + window.pageYOffset - offset,
        behavior: "smooth",
      });
    }
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
  lockAsideScroll();

  if ("ResizeObserver" in window && header) {
    new ResizeObserver(syncHeaderOffset).observe(header);
  }

  window.addEventListener("resize", syncHeaderOffset);

  // Never auto-scroll on typing — keep the search bar and navbar in view
  search?.addEventListener("input", () => filterEntries(false));

  clickableItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (!search) return;
      search.value = item.textContent.trim();
      filterEntries(true);
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
