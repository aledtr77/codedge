/**
 * Which source files a page is actually made of.
 *
 * The sitemap dates a page by the last commit that touched it, and for a long
 * time "it" meant pages/<lang>/<route>/index.html and nothing else. That is
 * right for a tutorial, whose words all live in the HTML, and wrong for a tool:
 * the palette extractor's labels come out of its own script, so a commit that
 * rewrote five of them left the page different and the lastmod untouched.
 *
 * Widening it to "any file the build touches" is the other failure, and the one
 * the old comment was guarding against: navbar.js and the shared stylesheets are
 * imported by all 34 pages, so a padding fix would restamp the whole sitemap at
 * once, and a lastmod that always moves is one crawlers stop reading.
 *
 * So the rule is neither of the two: follow what the page itself imports, and
 * count only the files nothing else imports. That is exactly the set that can
 * change this page and no other. It needs no list to maintain — extract a
 * helper two pages share and it drops out of both on its own, which is the
 * behaviour we want anyway, because at that point it is a shared file.
 */

const MODULE_EXTENSIONS = ['', '.js', '.mjs', '/index.js', '/index.mjs'];

/** The one <script type="module"> a page loads: its entry into the graph. */
export function entryFromHtml(html) {
  // Both attributes are looked for inside the tag rather than in one pattern
  // across it, so the order they are written in does not matter.
  for (const [tag] of String(html).matchAll(/<script\b[^>]*>/gi)) {
    if (!/\btype=["']module["']/i.test(tag)) continue;
    const src = tag.match(/\bsrc=["']([^"']+)["']/i);
    if (src) return src[1];
  }
  return null;
}

/**
 * Blank out comments, keeping the source's length and its strings.
 *
 * Without this a line like `// we used to import "./old.js"` reads as an
 * import. Mostly it would resolve to nothing and be dropped, but a comment
 * naming a file that does still exist would quietly date the page by it.
 */
function stripComments(text, blockOnly) {
  let out = '';
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];

    // Only /* */ in a stylesheet: there // is not a comment, it is the middle
    // of a protocol-relative url().
    if (!blockOnly && char === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (char === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      out += char;
      i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') { out += text[i]; i++; }
        if (i < text.length) { out += text[i]; i++; }
      }
      out += quote;
      i++;
      continue;
    }

    out += char;
    i++;
  }

  return out;
}

/**
 * Every specifier a file imports. Still deliberately loose past the comments:
 * anything read wrong fails to resolve to a file on disk a moment later and is
 * dropped there.
 */
export function extractSpecifiers(source, extension) {
  const text = stripComments(String(source), extension === '.css');
  const found = [];

  if (extension === '.css') {
    for (const m of text.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) found.push(m[1]);
    return found;
  }

  // import x from "y" / export { x } from "y", including the multi-line form.
  for (const m of text.matchAll(/(?:^|[\s;}])(?:import|export)\s[^;]*?\sfrom\s*["']([^"']+)["']/g)) {
    found.push(m[1]);
  }
  // import "y" — the side-effect form the CSS entries use.
  for (const m of text.matchAll(/(?:^|[\s;}])import\s*["']([^"']+)["']/g)) found.push(m[1]);
  // await import("y") — how the page scripts are actually pulled in.
  for (const m of text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) found.push(m[1]);

  return found;
}

function normalize(pathname) {
  const parts = [];
  for (const segment of pathname.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return parts.join('/');
}

/**
 * A specifier to a repo-relative path, or null when it points outside the repo.
 * Bare specifiers are node_modules — a dependency bump is not a page edit.
 */
export function resolveSpecifier(specifier, importerPath, exists) {
  let base;

  if (specifier.startsWith('@/')) base = `src/${specifier.slice(2)}`;
  else if (specifier.startsWith('/src/')) base = specifier.slice(1);
  else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const importerDir = importerPath.split('/').slice(0, -1).join('/');
    base = normalize(`${importerDir}/${specifier}`);
  } else return null;

  for (const extension of MODULE_EXTENSIONS) {
    const candidate = `${base}${extension}`;
    if (exists(candidate)) return candidate;
  }
  return null;
}

/**
 * The files behind each page that no other page shares.
 *
 * `pages` are `{ route, shape, htmlPath }`; `shape` is what pairs the two
 * language versions, so the twins that load the same entry count as one page
 * and their common script stays page-specific instead of looking shared.
 *
 * Returns a Map keyed by route, holding repo-relative paths, HTML excluded —
 * the caller already has that one.
 */
export function collectPageSources({ pages, readFile, exists }) {
  const reachedFrom = new Map();
  const perRoute = new Map();

  for (const { route, shape, htmlPath } of pages) {
    const reached = new Set();
    const entry = entryFromHtml(readFile(htmlPath));

    if (entry) {
      const queue = [];
      const start = resolveSpecifier(entry, htmlPath, exists);
      if (start) queue.push(start);

      while (queue.length) {
        const current = queue.pop();
        if (reached.has(current)) continue;
        reached.add(current);

        const extension = current.slice(current.lastIndexOf('.'));
        for (const specifier of extractSpecifiers(readFile(current), extension)) {
          const resolved = resolveSpecifier(specifier, current, exists);
          if (resolved && !reached.has(resolved)) queue.push(resolved);
        }
      }
    }

    perRoute.set(route, reached);
    for (const file of reached) {
      if (!reachedFrom.has(file)) reachedFrom.set(file, new Set());
      reachedFrom.get(file).add(shape);
    }
  }

  const exclusive = new Map();
  for (const { route } of pages) {
    exclusive.set(
      route,
      [...perRoute.get(route)].filter((file) => reachedFrom.get(file).size === 1).sort()
    );
  }
  return exclusive;
}
