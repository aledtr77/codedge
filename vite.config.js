import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
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

const antiFoucCss = [
  'html{background:#0d111a;color:#f2f2f2;color-scheme:dark}',
  'html.js:root body[data-css-ready="pending"]{opacity:0}',
  'html.js:root body[data-css-ready="ready"]{opacity:1;transition:opacity 0.25s ease}',
  // Revealed inside a view transition: the transition already animates the
  // swap, so fading the body on top of it would double up.
  'html.js:root body[data-css-ready="instant"]{opacity:1}',
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
            `<style data-critical-base>${antiFoucCss}</style>`,
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
        this.error(`[move-pages] errore durante lo spostamento: ${e.message}`);
      }
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
      handler: async (html, ctx) => {
        if (command !== 'build') return html;
        try { return await minify(html, htmlMinifyOptions); }
        catch (e) { console.error('[html-minifier] errore minifying', e); return html; }
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
  }

  return {
    root: process.cwd(),
    publicDir: 'public',
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
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
