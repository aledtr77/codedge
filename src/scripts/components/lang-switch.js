// Language switch that never navigates.
//
// Both language versions of a page are separate documents — that is what keeps
// them separately indexable, and the <a href> stays real so crawlers and
// no-JS visitors follow it normally. But a navigation always tears the old
// document down, and no amount of tuning removes the blank frame that leaves:
// measured on this site, a plain navigation blanks for ~350ms and even a
// cross-document view transition still blanks for ~50ms.
//
// So with JavaScript available we don't navigate at all. We fetch the twin
// page and copy across *only text node values and translatable attributes*,
// never adding or removing a single node. Nothing is destroyed, so every
// listener and every initialised component (colour generator, playground,
// quiz) survives untouched — and there is no unstyled or empty state to flash,
// because nothing is ever re-rendered.
//
// This is safe because the two trees are structurally identical by
// construction: English pages are scaffolded from the Italian ones. Where they
// do diverge — JS-generated content such as a rendered quiz — the walk simply
// stops descending that branch instead of corrupting it.

import { t } from "@/i18n/ui.js";

const SELECTOR = "a.lang-switch";
const LANG_CHANGED = "codedge:lang-changed";

// Attributes that carry human-readable text.
const TEXT_ATTRS = ["alt", "title", "aria-label", "placeholder"];

function prefetch(href) {
  if (!href || document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Copies text and translatable attributes from `src` onto `live`, in place.
 * Structure is never modified: only nodeValue and a fixed set of attributes.
 */
function applyTranslation(live, src) {
  for (const attr of TEXT_ATTRS) {
    if (src.hasAttribute(attr)) live.setAttribute(attr, src.getAttribute(attr));
  }

  // Internal links differ between trees (/strumenti/ vs /en/tools/).
  const href = src.getAttribute("href");
  if (href && href.startsWith("/")) live.setAttribute("href", href);

  // Direct text children, matched by position. A different count means this
  // element was rewritten by JavaScript, so its text is left alone.
  const liveText = [];
  const srcText = [];
  for (const node of live.childNodes) if (node.nodeType === Node.TEXT_NODE) liveText.push(node);
  for (const node of src.childNodes) if (node.nodeType === Node.TEXT_NODE) srcText.push(node);
  if (liveText.length === srcText.length) {
    for (let i = 0; i < srcText.length; i += 1) liveText[i].nodeValue = srcText[i].nodeValue;
  }

  alignChildren(live.children, src.children);
}

/** Two elements are the same slot if their tag and id agree. */
function corresponds(a, b) {
  return a.tagName === b.tagName && a.id === b.id;
}

/**
 * Pairs live children with source children.
 *
 * The live tree usually has *extra* elements the fetched markup knows nothing
 * about — playgrounds built from code blocks, a rendered quiz. So a mismatch
 * must not abort the walk (that would leave every later sibling untranslated);
 * it means the live tree has an interloper, and we look ahead a few slots to
 * find the real counterpart and carry on.
 */
function alignChildren(liveKids, srcKids) {
  const LOOKAHEAD = 8;
  let li = 0;
  let si = 0;

  while (li < liveKids.length && si < srcKids.length) {
    const live = liveKids[li];
    const src = srcKids[si];

    if (corresponds(live, src)) {
      applyTranslation(live, src);
      li += 1;
      si += 1;
      continue;
    }

    // Skip over JS-injected elements to reach this source element's twin.
    let found = -1;
    for (let k = li + 1; k < Math.min(liveKids.length, li + 1 + LOOKAHEAD); k += 1) {
      if (corresponds(liveKids[k], src)) {
        found = k;
        break;
      }
    }

    if (found >= 0) {
      applyTranslation(liveKids[found], src);
      li = found + 1;
      si += 1;
    } else {
      // No counterpart on this page: leave the live tree alone and move on.
      si += 1;
    }
  }
}

/** Head metadata that must follow the language, for sharing and for reloads. */
function applyHead(doc) {
  document.documentElement.lang = doc.documentElement.lang;
  document.title = doc.title;

  const pairs = [
    ['meta[name="description"]', "content"],
    ['link[rel="canonical"]', "href"],
    ['meta[property="og:title"]', "content"],
    ['meta[property="og:description"]', "content"],
    ['meta[property="og:url"]', "content"],
    ['meta[property="og:locale"]', "content"],
    ['meta[property="og:image:alt"]', "content"],
    ['meta[name="twitter:title"]', "content"],
    ['meta[name="twitter:description"]', "content"]
  ];

  for (const [selector, attr] of pairs) {
    const from = doc.querySelector(selector);
    const to = document.querySelector(selector);
    if (from && to) to.setAttribute(attr, from.getAttribute(attr));
  }
}

/** Re-localises the switch itself, whose href and state come from the new page. */
function applySwitch(control, doc) {
  const src = doc.querySelector(SELECTOR);
  if (!src) return;
  for (const attr of ["href", "hreflang", "lang", "aria-label", "title", "data-active"]) {
    if (src.hasAttribute(attr)) control.setAttribute(attr, src.getAttribute(attr));
  }
}

const cache = new Map();

async function fetchTwin(href) {
  if (cache.has(href)) return cache.get(href);
  const res = await fetch(href, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = new DOMParser().parseFromString(await res.text(), "text/html");
  cache.set(href, doc);
  return doc;
}

async function swapTo(href, control, { push = true } = {}) {
  const doc = await fetchTwin(href);
  if (!doc.body) throw new Error("no body in twin document");

  applyTranslation(document.body, doc.body);
  applyHead(doc);
  applySwitch(control, doc);

  if (push) history.pushState({ codedgeLang: true }, "", href);

  // Content rendered by JavaScript (quiz questions, playground chrome) is not
  // in the fetched markup, so it re-localises itself from this signal.
  window.dispatchEvent(new CustomEvent(LANG_CHANGED, { detail: { lang: document.documentElement.lang } }));
}

export default function initLangSwitch() {
  const control = document.querySelector(SELECTOR);
  if (!control || control.dataset.langSwitchReady === "true") return;
  control.dataset.langSwitchReady = "true";

  const warm = () => {
    const href = control.getAttribute("href");
    prefetch(href);
    fetchTwin(href).catch(() => {});
  };
  control.addEventListener("pointerenter", warm, { once: true });
  control.addEventListener("focus", warm, { once: true });
  control.addEventListener("touchstart", warm, { once: true, passive: true });

  control.addEventListener("click", async (event) => {
    // Let modified clicks (new tab, download, middle click) behave normally.
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    const href = control.getAttribute("href");
    if (!href || !href.startsWith("/")) return;

    event.preventDefault();

    // The lever moves under the finger, before the content catches up.
    control.dataset.active = control.dataset.active === "en" ? "it" : "en";

    try {
      await swapTo(href, control);
    } catch {
      // Anything unexpected: fall back to the plain navigation the href
      // already describes, rather than leaving a half-translated page.
      window.location.href = href;
    }
  });

  window.addEventListener("popstate", async () => {
    const target = location.pathname;
    try {
      await swapTo(target, control, { push: false });
    } catch {
      window.location.reload();
    }
  });
}

export { LANG_CHANGED, t };
