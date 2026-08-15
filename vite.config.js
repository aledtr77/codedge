import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { minify } from 'html-minifier-terser';
import { imagetools } from 'vite-imagetools';
import seoJsonLdPlugin from './scripts/seo-jsonld-plugin.mjs';
import { chromeI18nPlugin, hreflangPlugin, langPreferencePlugin } from './scripts/i18n-plugin.mjs';
import { LANG_DIR, sourceDirForRoute } from './src/i18n/routes.mjs';
import { CRAWLER_UA_PATTERN } from './scripts/crawler-ua.mjs';

const ENTRY_DIR = 'pages';

function scanEntries(dir) {
  const root = path.resolve(process.cwd(), dir);
  const inputs = {};
  if (!fs.existsSync(root)) return inputs;

  function walk(cur) {
    const list = fs.readdirSync(cur, { withFileTypes: true });
    for (const it of list) {
      const full = path.join(cur, it.name);
      if (it.isDirectory()) walk(full);
      else if (it.isFile() && it.name === 'index.html') {
        const relDir = path.relative(root, path.dirname(full)).split(path.sep).join('/');
        const key = relDir === '' ? 'index' : relDir;
        inputs[key] = path.resolve(full);
      }
    }
  }
  walk(root);
  return inputs;
}

const htmlMinifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  collapseBooleanAttributes: true,
  minifyJS: false,
  minifyCSS: true,
  useShortDoctype: true,
  keepClosingSlash: true,
  sortAttributes: true,
  sortClassName: true
};

// Hiding the body until the styles land is a DEV-ONLY need, and the two builds
// differ in a way that makes it actively harmful in production:
//
//   dev  - page CSS arrives through the JS module graph, so the browser paints
//          raw markup first. blocking="render" (below) covers the entry module,
//          but the CSS that other chunks pull in still lands after that, so the
//          unstyled flash is real and this reveal is what stops it.
//   prod - every stylesheet is a render-blocking <link>, so unstyled markup
//          cannot paint in the first place and the reveal protects nothing.
//
// In production it also cost us the metric: Chrome does not count a paint at
// opacity 0 as contentful, and the later fade never registers a new first
// paint, so First Contentful Paint was never recorded, Lighthouse aborted with
// NO_FCP, and PageSpeed reported *every* category red - accessibility and SEO
// included - flipping green and red on the same URL minutes apart as the race
// between reveal and first paint went one way or the other.
//
// This is the only surviving copy of the rule; the twins in public/critical.css
// and src/styles/components/main.css were removed. Because it is inlined ahead
// of both stylesheets and all three had equal specificity, whichever copy came
// last won - which is why deleting only the other two changed nothing.
const bodyRevealCss = [
  'html.js:root body[data-css-ready="pending"]{opacity:0}',
  'html.js:root body[data-css-ready="ready"]{opacity:1;transition:opacity 0.25s ease}',
  // Revealed inside a view transition: the transition already animates the
  // swap, so fading the body on top of it would double up.
  'html.js:root body[data-css-ready="instant"]{opacity:1}'
].join('');

const buildAntiFoucCss = (isServe) => [
  'html{background:#0d111a;color:#f2f2f2;color-scheme:dark}',
  isServe ? bodyRevealCss : '',
  'body{margin:0;font-family:\'Inter\',sans-serif;color:#f2f2f2;background:#0d111a;line-height:1.6}',
  '.logo{display:block;flex:0 0 auto;width:80px;max-width:80px;height:auto}',
  'main{max-width:1900px;margin:2rem auto;padding:0 2rem}',
  'header{background:#090d16}',
  'a{color:inherit}',
  'img{display:block;max-width:100%;height:auto}',
  '@media screen and (max-width:860px){.logo{width:48px;max-width:48px}.resize-text,.invisible-text{display:none}}'
].join('');

const antiFoucJsFlagScript = `if(!/${CRAWLER_UA_PATTERN}/i.test(navigator.userAgent)){document.documentElement.classList.add("js");}`;
const indexRedirectScript = [
  '(function(){',
  'var path=window.location.pathname;',
  'if(!path||!path.endsWith("/index.html"))return;',
  'var normalized=path.slice(0,-"index.html".length);',
  'if(!normalized)normalized="/";',
  'if(normalized!=="/"&&!normalized.endsWith("/"))normalized+="/";',
  'window.location.replace(normalized+window.location.search+window.location.hash);',
  '})();'
].join('');

// Holds the body hidden only until the page can paint fully styled, then
// reveals it. Two paths:
//   fade    - cold loads: wait for stylesheets, fonts and the style sentinel,
//             then fade in (the pre-existing behaviour);
//   instant - language switch, bfcache, view transitions: no fade, but the
//             body stays hidden until the full stylesheet is actually applied,
//             so unstyled markup can never paint. This matters on the dev
//             server, where bundle CSS is injected by JS instead of arriving
//             as a render-blocking link.
// The sentinel is --codedge-css-ready, declared in src/styles/components/main.css.
const antiFoucRevealScript = [
  '(function(){',
  'var K="codedge:instant-reveal";',
  'function state(){var b=document.body;return b?b.getAttribute("data-css-ready"):null}',
  'function styled(){try{return getComputedStyle(document.documentElement).getPropertyValue("--codedge-css-ready").indexOf("1")>-1}catch(e){return false}}',
  'function instant(){var b=document.body;if(!b||state()==="instant")return;b.setAttribute("data-css-ready","instant")}',
  'function fade(){var s=state();if(s==="ready"||s==="instant"||!document.body)return;requestAnimationFrame(function(){if(state()!=="instant"&&document.body)document.body.setAttribute("data-css-ready","ready")})}',
  'function whenStyled(cb,cap){var n=0;(function t(){if(styled()||n>cap)return cb();n+=1;requestAnimationFrame(t)})()}',
  'function fontsSettled(ms){if(!document.fonts||!document.fonts.ready)return Promise.resolve();return Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,ms)})])}',
  'function swallow(vt){if(!vt)return;if(vt.ready&&vt.ready.catch)vt.ready.catch(function(){});if(vt.finished&&vt.finished.catch)vt.finished.catch(function(){})}',
  'var nav=false;try{if(sessionStorage.getItem(K)){sessionStorage.removeItem(K);nav=true}}catch(e){}',
  'if(nav){whenStyled(function(){fontsSettled(350).then(instant)},240)}',
  'window.addEventListener("pagereveal",function(e){if(!e||!e.viewTransition)return;swallow(e.viewTransition);whenStyled(instant,20)});',
  'window.addEventListener("pageswap",function(e){if(e)swallow(e.viewTransition)});',
  'function waitForStyles(){return new Promise(function(resolve){var links=Array.prototype.slice.call(document.querySelectorAll(\'link[rel="stylesheet"]\'));var pending=0;',
  'function done(){pending=Math.max(0,pending-1);if(pending===0)resolve();}',
  'links.forEach(function(link){if(link.sheet)return;pending+=1;link.addEventListener("load",done,{once:true});link.addEventListener("error",done,{once:true});});',
  'if(pending===0)resolve();});}',
  'Promise.all([waitForStyles(),fontsSettled(1200),new Promise(function(r){whenStyled(r,240)})]).then(fade,fade);',
  'window.addEventListener("pageshow",function(e){if(e&&e.persisted)instant();else fade()},{once:true});',
  'setTimeout(fade,1600);',
  '})();'
].join('');

function antiFoucHtmlPlugin(isServe) {
  const criticalStyleRegex = /<style\b[^>]*data-critical-base[^>]*>[\s\S]*?<\/style>\s*/i;
  const criticalScriptRegex = /<script\b[^>]*data-css-ready[^>]*>[\s\S]*?<\/script>\s*/i;
  const noScriptRegex = /<noscript\b[^>]*data-critical-base[^>]*>[\s\S]*?<\/noscript>\s*/i;
  const stylesheetRegex = /<link\b[^>]*rel=(?:"stylesheet"|'stylesheet')[^>]*>\s*/gi;
  const firstRuntimeAssetRegex = /(<script\b[^>]*type=(?:"module"|'module')[^>]*>[\s\S]*?<\/script>|<script\b[^>]*type=(?:"module"|'module')[^>]*>|<link\b[^>]*rel=(?:"modulepreload"|'modulepreload')[^>]*>\s*)/i;

  return {
    name: 'anti-fouc-html',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // A page whose only job is to redirect has no paint to protect: it is
        // gone before anything renders. All this machinery would do there is
        // put ~3.5kB in front of the hop — and its `opacity:0` while pending
        // would hide the very link that is the fallback when the redirect
        // does not fire.
        if (/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)) return html;

        let updated = html
          .replace(criticalStyleRegex, '')
          .replace(noScriptRegex, '')
          .replace(criticalScriptRegex, '')
          .replace(/<meta name="theme-color" content="#00A8FF" \/>/gi, '<meta name="theme-color" content="#0d111a" />')
          .replace(/<meta name="viewport" content="width=device-width,initial-scale=1" \/>/gi, '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />');

        // Force inline dark background color on HTML and body tags to completely eliminate white flash during page transition on mobile browsers
        updated = updated.replace(/<html([^>]*)>/i, (_match, attrs = '') => {
          const cleanedAttrs = attrs.replace(/\sstyle=(?:"[^"]*"|'[^']*')/i, '');
          return `<html${cleanedAttrs} style="background:#0d111a;color:#f2f2f2">`;
        });

        updated = updated.replace(/<body([^>]*)>/i, (_match, attrs = '') => {
          const cleanedAttrs = attrs
            .replace(/\sdata-css-ready=(?:"[^"]*"|'[^']*')/i, '')
            .replace(/\sstyle=(?:"[^"]*"|'[^']*')/i, '');
          return `<body${cleanedAttrs} data-css-ready="pending" style="background:#0d111a;color:#f2f2f2">`;
        });

        const headMatch = updated.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        if (headMatch) {
          let headContent = headMatch[1];
          const stylesheets = headContent.match(stylesheetRegex) || [];
          headContent = headContent.replace(stylesheetRegex, '');

          const antiFoucTags = [
            `<script data-index-redirect>${indexRedirectScript}</script>`,
            `<script data-critical-base>${antiFoucJsFlagScript}</script>`,
            `<style data-critical-base>${buildAntiFoucCss(isServe)}</style>`,
            '<noscript data-critical-base><style>body[data-css-ready="pending"]{opacity:1;visibility:visible}</style></noscript>',
            ...stylesheets
          ].join('');

          if (firstRuntimeAssetRegex.test(headContent)) {
            headContent = headContent.replace(firstRuntimeAssetRegex, `${antiFoucTags}$1`);
          } else {
            headContent += antiFoucTags;
          }

          updated = updated.replace(headMatch[0], `<head>${headContent}</head>`);
        }

        updated = updated.replace(
          /<body[^>]*>/i,
          (match) => `${match}<script data-css-ready>${antiFoucRevealScript}</script>`
        );

        // Dev only: page CSS arrives through the JS module graph, so let first
        // paint wait for it. This makes dev paint fully styled like prod and
        // lets cross-document view transitions snapshot a finished page.
        // Browsers that ignore blocking="render" just fall back to the
        // sentinel-gated reveal above.
        if (isServe) {
          updated = updated.replace(
            /<script type="module" src="(\/src\/[^"]+)"><\/script>/i,
            '<script type="module" blocking="render" src="$1"></script>'
          );
        }

        return updated;
      }
    }
  };
}

// The navbar and footer are injected by chromeI18nPlugin (scripts/i18n-plugin.mjs),
// which fills the partials with the strings and hrefs of the page's language.

// The guide TOC is position:fixed, so it leaves the grid flow and its track
// would collapse - putting the article in the TOC's column, under the TOC.
// The placeholder holds that track. It lives here rather than in the 24 guide
// pages so a new guide cannot forget it and the two language versions cannot
// drift apart; it carries no text, so nothing here needs translating.
//
// It is markup, not a JS-built node, because it decides where the article goes:
// built by JS it would arrive after first paint, and the half-laid-out page in
// between was visible for ~200ms on the heaviest guide.
function guideTocPlaceholderPlugin() {
  const tocRegex = /<aside\b[^>]*class=(?:"|')[^"']*\bguide-toc\b[^"']*(?:"|')[^>]*>/i;
  return {
    name: 'guide-toc-placeholder',
    transformIndexHtml: {
      // Before anti-fouc: that one only reads the head, but keeping the body
      // rewrites ordered makes their interaction one-way.
      order: 'pre',
      handler(html) {
        if (html.includes('guide-toc-placeholder')) return html;
        const match = html.match(tocRegex);
        if (!match) return html;
        return html.replace(
          match[0],
          `<div class="guide-toc-placeholder" aria-hidden="true"></div>${match[0]}`
        );
      }
    }
  };
}

// Dev only: serves /@imagetools/<id> from the plugin's own disk cache when its
// in-memory map doesn't have the id yet (e.g. a tab left open across a server
// restart requesting lazy images), instead of letting vite-imagetools throw
// "cannot find image with id ... this is likely an internal error".
function imagetoolsCacheFallback() {
  const cacheDir = path.resolve(process.cwd(), 'node_modules/.cache/imagetools');
  const sniffFormat = (buf) => {
    if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') return 'avif';
    if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
    if (buf[0] === 0x89 && buf[1] === 0x50) return 'png';
    if (buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
    return null;
  };
  return {
    name: 'imagetools-cache-fallback',
    apply: 'serve',
    // vite-imagetools is enforce:'pre'; match it so this middleware registers
    // first (same enforce → array order wins) and can intercept before it throws
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/@imagetools/')) return next();
        const id = req.url.slice('/@imagetools/'.length);
        if (!/^[a-f0-9]+$/.test(id)) return next();
        const file = path.join(cacheDir, id);
        if (!fs.existsSync(file)) return next();
        const buf = fs.readFileSync(file);
        const format = sniffFormat(buf);
        if (format) res.setHeader('Content-Type', `image/${format}`);
        res.end(buf);
      });
    }
  };
}

// Dev only: rewrites clean URLs (/risorse/) to pages/<route>/index.html
function devPagesRewrite() {
  return {
    name: 'dev-pages-rewrite',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.method !== 'GET') return next();
        if (!req.url) return next();

        const [pathname, query = ''] = req.url.split('?');
        if (!pathname || pathname.startsWith('//')) return next();

        const skipPrefixes = [
          '/pages/',
          '/src/',
          '/@vite/',
          '/@fs/',
          '/node_modules/',
          '/assets/',
          '/icons/',
          '/api/'
        ];
        if (skipPrefixes.some((p) => pathname.startsWith(p))) return next();

        // no rewrite for explicit file requests (e.g. /robots.txt)
        if (path.extname(pathname)) return next();

        // URL -> source directory: English is served from the root but lives in
        // pages/en/, Italian keeps its /it/ prefix in both places.
        const sourceDir = sourceDirForRoute(pathname);
        const candidate = path.join(process.cwd(), ENTRY_DIR, sourceDir, 'index.html');

        if (fs.existsSync(candidate)) {
          const rewritten = `/${ENTRY_DIR}/${sourceDir}/index.html`;
          req.url = query ? `${rewritten}?${query}` : rewritten;
        }

        next();
      });
    }
  };
}

// Build: maps the symmetric source tree onto the published URL shape.
//   dist/pages/en/**  ->  dist/**      (English is what the site opens in: root)
//   dist/pages/it/**  ->  dist/it/**   (Italian keeps its prefix)
function movePagesToRootPlugin(outDir) {
  return {
    name: 'move-pages-to-root',
    apply: 'build',
    writeBundle() {
      const distRoot = path.resolve(process.cwd(), outDir);
      const pagesRoot = path.join(distRoot, 'pages');
      if (!fs.existsSync(pagesRoot)) return;

      try {
        for (const [dir, target] of [
          [LANG_DIR.en, distRoot],
          [LANG_DIR.it, path.join(distRoot, LANG_DIR.it)]
        ]) {
          const source = path.join(pagesRoot, dir);
          if (fs.existsSync(source)) fs.cpSync(source, target, { recursive: true });
        }
        fs.rmSync(pagesRoot, { recursive: true, force: true });
      } catch (e) {
        this.error(`[move-pages] failed while moving the pages: ${e.message}`);
      }
    }
  };
}

// Replaces 'unsafe-inline' in the published script-src with the SHA-256 hash of
// every inline script the build actually emitted.
//
// The site needs a handful of inline scripts that must run before the first
// paint (language preference, the anti-FOUC flag, the CSS-ready fade), so they
// cannot move to a file. 'unsafe-inline' bought that at the price of also
// authorising any script an attacker managed to inject — which matters here
// because the playground, the palette extractor and the image compressor all
// put reader input into the DOM. Hashes authorise exactly these scripts and
// nothing else.
//
// Runs in closeBundle so it sees the final dist: after move-pages-to-root has
// put the pages where they are served from, and after html-minifier has settled
// the bytes the hash is taken over. A hash of pre-minified source would not
// match what the browser receives.
//
// Only `script-src` is touched. Inline *style attributes* cannot be hashed, so
// style-src keeps 'unsafe-inline' and is left exactly as written.
function cspHashesPlugin(outDir) {
  return {
    name: 'csp-inline-hashes',
    apply: 'build',
    closeBundle() {
      const distRoot = path.resolve(process.cwd(), outDir);
      const headersFile = path.join(distRoot, '_headers');
      if (!fs.existsSync(headersFile)) {
        this.error('[csp-hashes] dist/_headers is not there: the CSP was never written.');
      }

      const htmlFiles = [];
      (function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
        }
      })(distRoot);

      // An inline script is one without src. A type that is not a JavaScript
      // MIME type (application/ld+json here) is data the browser never
      // executes, so CSP does not apply to it and hashing it would only bloat
      // the header — one hash per page instead of one for the whole site.
      const EXECUTABLE_TYPE = /^(module|text\/javascript|application\/javascript)$/i;
      const hashes = new Set();
      for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
          const [, attrs, body] = match;
          if (/\ssrc\s*=/i.test(attrs)) continue;
          const type = /\stype\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1]?.trim();
          if (type && !EXECUTABLE_TYPE.test(type)) continue;
          if (!body.trim()) continue;
          hashes.add(crypto.createHash('sha256').update(body, 'utf8').digest('base64'));
        }
      }

      if (hashes.size === 0) {
        this.error('[csp-hashes] nessuno script inline trovato: sospetto, meglio fermarsi.');
      }

      const tokens = [...hashes].sort().map((h) => `'sha256-${h}'`).join(' ');
      let replaced = 0;
      const rewritten = fs
        .readFileSync(headersFile, 'utf8')
        .replace(/^(\s*Content-Security-Policy:\s*)(.+)$/gim, (line, label, policy) => {
          const directives = policy.split(';').map((part) => {
            if (!/^\s*script-src\s/i.test(part)) return part;
            replaced += 1;
            const kept = part
              .trim()
              .split(/\s+/)
              .filter((token) => token !== "'unsafe-inline'");
            return ` ${kept.join(' ')} ${tokens}`;
          });
          return label + directives.join(';');
        });

      if (replaced !== 1) {
        this.error(
          `[csp-hashes] expected exactly one script-src to rewrite in _headers, found ${replaced}.`
        );
      }
      if (rewritten.includes("script-src 'self' 'unsafe-inline'")) {
        this.error("[csp-hashes] 'unsafe-inline' is still in script-src after the rewrite.");
      }

      fs.writeFileSync(headersFile, rewritten);
      console.log(`[csp-hashes] script-src: ${hashes.size} inline hash(es), 'unsafe-inline' removed`);
    }
  };
}

export default defineConfig(({ command }) => {
  const outDir = 'dist';
  const entries = scanEntries(ENTRY_DIR) || {};

  let rollupInput;
  if (Object.keys(entries).length > 0) {
    rollupInput = Object.fromEntries(Object.entries(entries));
  } else {
    const fallback = path.resolve(process.cwd(), 'pages/index.html');
    if (fs.existsSync(fallback)) {
      rollupInput = { index: fallback };
      console.warn('[vite.config] no entries found, falling back to', fallback);
    } else {
      rollupInput = undefined;
      console.warn('[vite.config] no entries and no fallback found — build may fail if no index.html in project root');
    }
  }

  const htmlMinifierPlugin = {
    name: 'html-minifier',
    transformIndexHtml: {
      order: 'post',
      handler: async (html) => {
        if (command !== 'build') return html;
        try { return await minify(html, htmlMinifyOptions); }
        catch (e) { console.error('[html-minifier] failed to minify', e); return html; }
      }
    }
  };

  const plugins = [];
  plugins.push(imagetoolsCacheFallback());
  plugins.push(imagetools());
  plugins.push(chromeI18nPlugin());
  plugins.push(hreflangPlugin());
  plugins.push(langPreferencePlugin());
  plugins.push(seoJsonLdPlugin());
  plugins.push(guideTocPlaceholderPlugin());
  plugins.push(antiFoucHtmlPlugin(command === 'serve'));
  if (command === 'serve') {
    plugins.push(devPagesRewrite());
  }
  if (command === 'build') {
    plugins.push(htmlMinifierPlugin);
    plugins.push(movePagesToRootPlugin(outDir));
    plugins.push(cspHashesPlugin(outDir));
  }

  return {
    root: process.cwd(),
    publicDir: 'public',
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    plugins,
    build: {
      outDir,
      emptyOutDir: true,
      manifest: true,
      minify: 'esbuild',
      rollupOptions: rollupInput ? { input: rollupInput } : {}
    },
    server: { port: 3000 }
  };
});
