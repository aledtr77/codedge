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
// leaving the tree itself alone. Nothing is destroyed, so every listener and
// every initialised component (colour generator, playground, quiz) survives
// untouched — and there is no unstyled or empty state to flash, because
// nothing is ever re-rendered.
//
// The one exception is a paragraph whose inline markup the two languages
// arrange differently, where copying by position cannot work at all; there the
// markup is replaced outright, and only where nothing but prose can live.
//
// This is safe because the two trees are structurally identical by
// construction: English pages are scaffolded from the Italian ones. Where they
// do diverge — JS-generated content such as a rendered quiz — the walk simply
// stops descending that branch instead of corrupting it.
//
// scripts/i18n-swap.mjs drives this in a browser over every pair and compares
// the result against the real page; run it after touching anything here.

import { t } from "@/i18n/ui.js";

const SELECTOR = "a.lang-switch";

// The reader's choice, kept for the rest of this visit and for the next one.
// Only the head script injected by scripts/i18n-plugin.mjs reads it: it runs
// before first paint on every page and sends the reader to the language stored
// here, defaulting to English for anyone who has never chosen. So this write is
// the whole of "the language stays where I put it" — without it every page load
// would fall back to English again.
const LANG_KEY = "codedge:lang";

function remember(lang) {
  if (lang !== "it" && lang !== "en") return;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Private mode, storage disabled, quota: the switch still works for this
    // page, it just will not be remembered. Nothing to recover from.
  }
}

const LANG_CHANGED = "codedge:lang-changed";
// Fired before the swap, for components that rewrote the server-rendered
// markup at load time. The walk below matches text nodes by position, so a
// component that split one text node into several makes its own text
// untranslatable; on this signal it puts the original shape back, and restores
// its own on LANG_CHANGED once the text has been replaced.
const LANG_WILL_CHANGE = "codedge:lang-will-change";

// Attributes that carry human-readable text.
const TEXT_ATTRS = ["alt", "title", "aria-label", "placeholder"];

const LD_JSON = 'script[type="application/ld+json"]';

// Containers whose content is prose written in the page source, and the inline
// markup that may appear inside it. Together they identify an element whose
// markup no component ever assembles — see the fallback in applyTranslation.
const PROSE_CONTAINERS = new Set([
  "P", "LI", "DD", "DT", "TD", "TH", "CAPTION", "FIGCAPTION", "BLOCKQUOTE",
  "H1", "H2", "H3", "H4", "H5", "H6", "SUMMARY", "LABEL", "LEGEND"
]);

const INLINE_TAGS = new Set([
  "A", "ABBR", "B", "BDI", "BDO", "BR", "CITE", "CODE", "DEL", "DFN", "EM",
  "I", "INS", "KBD", "MARK", "Q", "S", "SAMP", "SMALL", "SPAN", "STRONG",
  "SUB", "SUP", "TIME", "U", "VAR", "WBR"
]);

// An in-page anchor is a scroll target components take over (guide TOC, scroll
// indicator); replacing it would drop the click handler with it.
const isScrollTarget = (el) =>
  el.tagName === "A" && (el.getAttribute("href") || "").startsWith("#");

/** True when everything below `el` is text and inline text markup. */
function isProse(el) {
  for (const child of el.children) {
    if (!INLINE_TAGS.has(child.tagName)) return false;
    if (isScrollTarget(child)) return false;
    if (!isProse(child)) return false;
  }
  return true;
}

/**
 * True when `el` carries nothing but prose, so its markup can be replaced
 * outright. Inline elements count too: a translation often moves a <code> in or
 * out of the <strong> around it, and the mismatch surfaces there rather than on
 * the paragraph.
 */
function isReplaceableProse(el) {
  if (!PROSE_CONTAINERS.has(el.tagName) && !INLINE_TAGS.has(el.tagName)) return false;
  if (isScrollTarget(el)) return false;
  return isProse(el);
}

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

  // Direct text children, matched by position.
  const liveText = [];
  const srcText = [];
  for (const node of live.childNodes) if (node.nodeType === Node.TEXT_NODE) liveText.push(node);
  for (const node of src.childNodes) if (node.nodeType === Node.TEXT_NODE) srcText.push(node);

  if (liveText.length === srcText.length) {
    for (let i = 0; i < srcText.length; i += 1) liveText[i].nodeValue = srcText[i].nodeValue;
  } else if (isReplaceableProse(live) && isReplaceableProse(src)) {
    // A different count usually means JavaScript rewrote this element, and
    // then its text must be left alone. But a translation that moves an inline
    // <code> or <strong> also changes how the sentence splits into text nodes
    // — "the <code>x</code> flag does…" against "<code>x</code> serve a…" —
    // and positional copying would leave the whole sentence untranslated.
    // Inside a prose container nothing is component-generated, so replacing
    // the markup outright is safe and translates the sentence whatever shape
    // the two languages gave it.
    live.innerHTML = src.innerHTML;
    return;
  }

  alignChildren(live.children, src.children);
}

/**
 * Two elements are the same slot if their tag and id agree — and, when both
 * carry classes, if they share at least one.
 *
 * Tag and id alone are too coarse. breadcrumb.js deletes the static
 * `.breadcrumb-container` from the live tree, so its bare <div> in the source
 * lines up with whatever bare <div> follows here and the walk descends into a
 * branch that has nothing to do with it — taking every translation below it
 * down with it. Classes are consulted only when both sides have them, so a
 * component that adds a class to an unclassed element still pairs; and one
 * class in common is enough, so a runtime state class ("active", "open") does
 * not break the pairing either.
 */
function corresponds(a, b) {
  if (a.tagName !== b.tagName || a.id !== b.id) return false;
  if (a.classList.length === 0 || b.classList.length === 0) return true;
  for (const cls of a.classList) if (b.classList.contains(cls)) return true;
  return false;
}

const LOOKAHEAD = 8;
const PEEL_DEPTH = 2;

/** Index of `target`'s twin in `kids` at or after `from`, or -1. */
function findAhead(kids, from, target) {
  const limit = Math.min(kids.length, from + LOOKAHEAD);
  for (let k = from; k < limit; k += 1) {
    if (corresponds(kids[k], target)) return k;
  }
  return -1;
}

/**
 * `live`, or something it wraps, matching `src`.
 *
 * Components do not only insert siblings — they also wrap the markup that was
 * already there: the playground moves every <pre> inside a `.code-wrapper` of
 * its own, alongside a toolbar. The source knows nothing about that wrapper, so
 * a walk that only ever looks at siblings stops dead at it and the code block
 * keeps the language it was served in.
 */
function peel(live, src, depth = PEEL_DEPTH) {
  if (corresponds(live, src)) return live;
  if (depth <= 0) return null;
  for (const child of live.children) {
    const found = peel(child, src, depth - 1);
    if (found) return found;
  }
  return null;
}

/**
 * Pairs live children with source children.
 *
 * Neither list is authoritative. The live tree gains elements the fetched
 * markup knows nothing about — playgrounds built from code blocks, a rendered
 * quiz — and loses others the source still carries, because breadcrumb.js
 * deletes the static breadcrumb its runtime bar replaces. So a mismatch must
 * never abort the walk (that would leave every later sibling untranslated): it
 * means one side has an interloper, and we look ahead on *both* to find the
 * real counterpart, resyncing on whichever twin is nearer.
 */
function alignChildren(liveKids, srcKids) {
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

    const aheadInLive = findAhead(liveKids, li + 1, src);
    const aheadInSrc = findAhead(srcKids, si + 1, live);

    if (aheadInLive >= 0 && (aheadInSrc < 0 || aheadInLive - li <= aheadInSrc - si)) {
      // Extra elements on this page: skip them to reach the source's twin.
      applyTranslation(liveKids[aheadInLive], src);
      li = aheadInLive + 1;
      si += 1;
    } else if (aheadInSrc >= 0) {
      // Extra elements in the source: skip them to reach this element's twin.
      applyTranslation(live, srcKids[aheadInSrc]);
      li += 1;
      si = aheadInSrc + 1;
    } else {
      // Nothing alongside: last resort, the twin may have been wrapped.
      const wrapped = peel(live, src);
      if (wrapped) {
        applyTranslation(wrapped, src);
        li += 1;
        si += 1;
      } else {
        // No counterpart within reach at all: leave the live tree alone.
        si += 1;
      }
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
    ['meta[property="og:locale:alternate"]', "content"],
    ['meta[property="og:image:alt"]', "content"],
    // Not metadata but the installable app itself: each language has its own
    // manifest, with its own start_url and description. Leave it behind and a
    // reader who installs after switching gets the other language's app.
    ['link[rel="manifest"]', "href"],
    ['meta[name="twitter:title"]', "content"],
    ['meta[name="twitter:description"]', "content"]
  ];

  for (const [selector, attr] of pairs) {
    const from = doc.querySelector(selector);
    const to = document.querySelector(selector);
    if (from && to) to.setAttribute(attr, from.getAttribute(attr));
  }

  // Structured data describes the page, so it has to describe the new one:
  // breadcrumb trail, article headline, glossary terms. These blocks are
  // build-time output that nothing reads at runtime and the browser never
  // executes, so swapping the whole set is both safe and the only way to keep
  // them consistent when the two languages carry a different number of them.
  for (const stale of document.head.querySelectorAll(LD_JSON)) stale.remove();
  for (const block of doc.head.querySelectorAll(LD_JSON)) {
    document.head.appendChild(document.importNode(block, true));
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

  // Let DOM-rewriting components hand back the server-rendered shape, so the
  // positional walk can actually reach their text.
  window.dispatchEvent(new CustomEvent(LANG_WILL_CHANGE));

  applyTranslation(document.body, doc.body);
  applyHead(doc);
  applySwitch(control, doc);

  // Covers the path a click does not: Back after a switch lands here through
  // popstate, and what is on screen then has to be what a reload gives back.
  remember(document.documentElement.lang);

  // The switch's href is a bare path, but the query and the fragment belong to
  // the reader, not to the language: a pinned palette or the anchor they were
  // reading at must survive the swap, and above all stay in the URL they copy.
  if (push) history.pushState({ codedgeLang: true }, "", href + location.search + location.hash);

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

    // Recorded before the swap, not after it: the catch below falls back to a
    // plain navigation, and the head script on the page it lands on would send
    // the reader straight back here if the choice were not already stored.
    remember(control.getAttribute("hreflang"));

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

export { LANG_CHANGED, LANG_WILL_CHANGE, t };
