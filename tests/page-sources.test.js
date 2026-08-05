// What decides a page's date in the sitemap.
//
// This is the sort of thing that breaks silently in both directions and nobody
// notices for weeks: too narrow and a rewritten tool keeps advertising a date
// from before the rewrite, too wide and one padding fix restamps all 34 pages
// at once, which teaches crawlers to stop believing the field. Neither failure
// shows up on the page, so it is left to these tests to see them.

import { describe, expect, it } from 'vitest';
import {
  collectPageSources,
  entryFromHtml,
  extractSpecifiers,
  resolveSpecifier,
} from '../scripts/page-sources.mjs';

describe('entryFromHtml', () => {
  it('finds the module the page loads', () => {
    const html = '<script type="module" src="/src/scripts/pages/index/main.js"></script>';
    expect(entryFromHtml(html)).toBe('/src/scripts/pages/index/main.js');
  });

  it('ignores the inline scripts that run before the first paint', () => {
    const html = '<script data-lang-preference>(function(){})()</script>';
    expect(entryFromHtml(html)).toBe(null);
  });

  it('is not fooled by the attribute order', () => {
    const html = '<script src="/src/a/main.js" type="module"></script>';
    expect(entryFromHtml(html)).toBe('/src/a/main.js');
  });
});

describe('extractSpecifiers', () => {
  it('reads the side-effect imports the entries are made of', () => {
    const source = 'import "@/styles/components/navbar.css";\nimport "@/scripts/components/footer.js";';
    expect(extractSpecifiers(source, '.js')).toEqual([
      '@/styles/components/navbar.css',
      '@/scripts/components/footer.js',
    ]);
  });

  it('reads a named import, including the one broken over several lines', () => {
    const source = 'import { currentLang, t } from "@/i18n/ui.js";\nimport {\n  a,\n  b\n} from "./helpers.js";';
    expect(extractSpecifiers(source, '.js')).toContain('@/i18n/ui.js');
    expect(extractSpecifiers(source, '.js')).toContain('./helpers.js');
  });

  it('reads the dynamic import that actually pulls in the page script', () => {
    const source = 'const { init } = await import("@/scripts/pages/strumenti/x/x.js");';
    expect(extractSpecifiers(source, '.js')).toEqual(['@/scripts/pages/strumenti/x/x.js']);
  });

  it('reads a re-export', () => {
    expect(extractSpecifiers('export { rgbToHsl } from "./color.js";', '.js')).toEqual(['./color.js']);
  });

  it('reads @import in a stylesheet, with or without url()', () => {
    expect(extractSpecifiers('@import "./base.css";\n@import url("./type.css");', '.css'))
      .toEqual(['./base.css', './type.css']);
  });

  it('does not mistake the word import inside a string or a comment for one', () => {
    expect(extractSpecifiers('// how to import "x"\nconst s = "import y";', '.js')).toEqual([]);
  });
});

describe('resolveSpecifier', () => {
  const exists = (p) => ['src/i18n/ui.js', 'src/scripts/a/b.js', 'src/styles/x/index.css'].includes(p);

  it('turns the @ alias into a path under src', () => {
    expect(resolveSpecifier('@/i18n/ui.js', 'src/scripts/a/main.js', exists)).toBe('src/i18n/ui.js');
  });

  it('turns the /src/ form the HTML uses into the same path', () => {
    expect(resolveSpecifier('/src/i18n/ui.js', 'pages/en/index.html', exists)).toBe('src/i18n/ui.js');
  });

  it('resolves a relative specifier against the file that imports it', () => {
    expect(resolveSpecifier('./b.js', 'src/scripts/a/main.js', exists)).toBe('src/scripts/a/b.js');
    expect(resolveSpecifier('../a/b.js', 'src/scripts/z/main.js', exists)).toBe('src/scripts/a/b.js');
  });

  it('adds the extension when the import leaves it off', () => {
    expect(resolveSpecifier('@/scripts/a/b', 'src/scripts/a/main.js', exists)).toBe('src/scripts/a/b.js');
  });

  it('drops a package: bumping a dependency is not editing a page', () => {
    expect(resolveSpecifier('@fortawesome/fontawesome-free/css/all.min.css', 'src/a.js', exists)).toBe(null);
    expect(resolveSpecifier('vitest', 'src/a.js', exists)).toBe(null);
  });

  it('drops what does not exist rather than inventing a path', () => {
    expect(resolveSpecifier('@/nope.js', 'src/a.js', exists)).toBe(null);
  });
});

describe('collectPageSources', () => {
  // Two tools and their Italian twins, built like the real ones: a shared
  // navbar, a stylesheet each, and a script each holding the page's own words.
  const files = {
    'pages/en/tools/palette/index.html': '<script type="module" src="/src/scripts/pages/palette/main.js"></script>',
    'pages/it/strumenti/palette/index.html': '<script type="module" src="/src/scripts/pages/palette/main.js"></script>',
    'pages/en/tools/colors/index.html': '<script type="module" src="/src/scripts/pages/colors/main.js"></script>',
    'pages/it/strumenti/colori/index.html': '<script type="module" src="/src/scripts/pages/colors/main.js"></script>',
    'src/scripts/pages/palette/main.js':
      'import "@/scripts/components/navbar.js";\nimport "@/styles/pages/palette/index.css";\nawait import("@/scripts/pages/palette/palette.js");',
    'src/scripts/pages/colors/main.js':
      'import "@/scripts/components/navbar.js";\nawait import("@/scripts/pages/colors/colors.js");',
    'src/scripts/pages/palette/palette.js': 'import { t } from "@/i18n/ui.js";',
    'src/scripts/pages/colors/colors.js': 'import { t } from "@/i18n/ui.js";',
    'src/scripts/components/navbar.js': 'import { t } from "@/i18n/ui.js";',
    'src/styles/pages/palette/index.css': '',
    'src/i18n/ui.js': '',
  };

  const pages = [
    { route: '/tools/palette/', shape: '/it/strumenti/palette/', htmlPath: 'pages/en/tools/palette/index.html' },
    { route: '/it/strumenti/palette/', shape: '/it/strumenti/palette/', htmlPath: 'pages/it/strumenti/palette/index.html' },
    { route: '/tools/colors/', shape: '/it/strumenti/colori/', htmlPath: 'pages/en/tools/colors/index.html' },
    { route: '/it/strumenti/colori/', shape: '/it/strumenti/colori/', htmlPath: 'pages/it/strumenti/colori/index.html' },
  ];

  const sources = collectPageSources({
    pages,
    readFile: (p) => files[p] ?? '',
    exists: (p) => p in files,
  });

  it('counts the script holding the page\'s own words', () => {
    expect(sources.get('/tools/palette/')).toContain('src/scripts/pages/palette/palette.js');
  });

  it('counts the stylesheet only that page loads', () => {
    expect(sources.get('/tools/palette/')).toContain('src/styles/pages/palette/index.css');
  });

  it('leaves out the navbar every page shares', () => {
    for (const { route } of pages) {
      expect(sources.get(route)).not.toContain('src/scripts/components/navbar.js');
    }
  });

  it('leaves out a file reached through a shared one', () => {
    // ui.js is imported by the page scripts too, but two pages reach it: a new
    // string in there is not one page changing.
    for (const { route } of pages) {
      expect(sources.get(route)).not.toContain('src/i18n/ui.js');
    }
  });

  it('treats the two language versions as one page, so their common script stays theirs', () => {
    expect(sources.get('/tools/palette/')).toEqual(sources.get('/it/strumenti/palette/'));
    expect(sources.get('/tools/palette/')).toContain('src/scripts/pages/palette/main.js');
  });

  it('keeps one tool out of the other', () => {
    expect(sources.get('/tools/colors/')).not.toContain('src/scripts/pages/palette/palette.js');
    expect(sources.get('/tools/palette/')).not.toContain('src/scripts/pages/colors/colors.js');
  });

  it('gives a page with no module of its own an empty set rather than failing', () => {
    const plain = collectPageSources({
      pages: [{ route: '/about/', shape: '/it/chi-sono/', htmlPath: 'pages/en/about/index.html' }],
      readFile: () => '<p>no script here</p>',
      exists: () => false,
    });
    expect(plain.get('/about/')).toEqual([]);
  });

  it('does not loop forever on two files that import each other', () => {
    const cyclic = {
      'pages/en/x/index.html': '<script type="module" src="/src/a.js"></script>',
      'src/a.js': 'import "./b.js";',
      'src/b.js': 'import "./a.js";',
    };
    const result = collectPageSources({
      pages: [{ route: '/x/', shape: '/it/x/', htmlPath: 'pages/en/x/index.html' }],
      readFile: (p) => cyclic[p] ?? '',
      exists: (p) => p in cyclic,
    });
    expect(result.get('/x/')).toEqual(['src/a.js', 'src/b.js']);
  });
});
