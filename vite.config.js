// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { minify } from 'html-minifier-terser';

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
  'html{background:#0d111a;color:#f2f2f2}',
  'html.js body[data-css-ready="pending"]>*:not(.loading-bar-top){opacity:0!important}',
  'html.js body[data-css-ready="ready"]>*:not(.loading-bar-top){opacity:1!important;transition:opacity 0.25s ease!important}',
  'body{margin:0;font-family:\'Inter\',sans-serif;color:#f2f2f2;background:#0d111a;line-height:1.6}',
  '.logo{display:block;flex:0 0 auto;width:80px;max-width:80px;height:auto}',
  'main{max-width:1900px;margin:2rem auto;padding:0 2rem}',
  'header{background:#090d16}',
  'a{color:inherit}',
  'img{display:block;max-width:100%;height:auto}',
  '.loading-bar-top{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#0056b3,#0084ff,#7fd1ff);z-index:999999;transition:opacity 0.25s ease;width:0%;opacity:1;pointer-events:none;box-shadow:0 0 8px rgba(127,209,255,0.65),0 0 4px rgba(0,132,255,0.45);border-radius:0 2px 2px 0}',
  '@media screen and (max-width:860px){.logo{width:48px;max-width:48px}.resize-text,.invisible-text{display:none}}'
].join('');

const antiFoucJsFlagScript = 'document.documentElement.classList.add("js");';
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

const antiFoucRevealScript = [
  '(function(){',
  'var bar=document.createElement("div");',
  'bar.className="loading-bar-top";',
  'bar.style.cssText="position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#0056b3,#0084ff,#7fd1ff);z-index:999999;width:0%;opacity:1;transition:opacity 0.25s ease;pointer-events:none;box-shadow:0 0 8px rgba(127,209,255,0.65),0 0 4px rgba(0,132,255,0.45);border-radius:0 2px 2px 0;";',
  'document.body.appendChild(bar);',
  'var currentWidth=0;var targetWidth=15;var animId=null;',
  'function update(){',
  'var speed=targetWidth===100?0.15:0.08;',
  'currentWidth+=(targetWidth-currentWidth)*speed;',
  'bar.style.width=currentWidth+"%";',
  'if(targetWidth===100&&currentWidth>=99.4){',
  'bar.style.width="100%";',
  'cancelAnimationFrame(animId);',
  'setTimeout(function(){',
  'bar.style.opacity="0";',
  'setTimeout(function(){bar.remove();},250);',
  '},100);',
  'return;',
  '}',
  'animId=requestAnimationFrame(update);',
  '}',
  'animId=requestAnimationFrame(update);',
  'function reveal(){',
  'if(window.__revealed)return;window.__revealed=true;targetWidth=100;',
  'var body=document.body;if(body)body.setAttribute("data-css-ready","ready");',
  '}',
  'function waitForStyles(){return new Promise(function(resolve){var links=Array.prototype.slice.call(document.querySelectorAll(\'link[rel="stylesheet"]\'));var pending=0;',
  'function done(){pending=Math.max(0,pending-1);if(pending===0)resolve();}',
  'links.forEach(function(link){if(link.sheet)return;pending+=1;link.addEventListener("load",done,{once:true});link.addEventListener("error",done,{once:true});});',
  'if(pending===0)resolve();});}',
  'function waitForFonts(){if(!document.fonts||!document.fonts.ready)return Promise.resolve();return Promise.race([document.fonts.ready,new Promise(function(resolve){setTimeout(resolve,1200);})]);}',
  'function waitForFlagOrEvent(flag,eventName,timeout){if(window[flag])return Promise.resolve();return new Promise(function(resolve){var done=false;function finish(){if(done)return;done=true;window.removeEventListener(eventName,finish);resolve();}window.addEventListener(eventName,finish,{once:true});setTimeout(finish,timeout||1200);});}',
  'waitForStyles().then(function(){targetWidth=Math.max(targetWidth,45);});',
  'waitForFonts().then(function(){targetWidth=Math.max(targetWidth,65);});',
  'waitForFlagOrEvent("__navReady","codedge:nav-ready",1200).then(function(){targetWidth=Math.max(targetWidth,80);});',
  'waitForFlagOrEvent("__footerReady","codedge:footer-ready",1200).then(function(){targetWidth=Math.max(targetWidth,90);});',
  'Promise.all([waitForStyles(),waitForFonts(),waitForFlagOrEvent("__navReady","codedge:nav-ready",1200),waitForFlagOrEvent("__footerReady","codedge:footer-ready",1200)]).finally(reveal);',
  'window.addEventListener("pageshow",reveal,{once:true});',
  'setTimeout(reveal,2500);',
  '})();'
].join('');

function antiFoucHtmlPlugin() {
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
            '<noscript data-critical-base><style>body[data-css-ready="pending"]>*{opacity:1!important;visibility:visible!important}</style></noscript>',
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

        return updated;
      }
    }
  };
}

function staticFooterHtmlPlugin() {
  const footerTemplatePath = path.resolve(process.cwd(), 'src/partials/footer.html');

  return {
    name: 'static-footer-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (/<footer\b/i.test(html)) return html;
        const footerMarkup = fs.readFileSync(footerTemplatePath, 'utf8').trim();
        return html.replace(/<\/body>/i, `${footerMarkup}\n</body>`);
      }
    }
  };
}

// --- DEV: riscrive URL pulite (/risorse/) verso pages/<route>/index.html ---
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

        // evita rewrite di richieste file espliciti (es. /robots.txt)
        if (path.extname(pathname)) return next();

        const cleanPath = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
        const candidate = cleanPath === ''
          ? path.join(process.cwd(), ENTRY_DIR, 'index.html')
          : path.join(process.cwd(), ENTRY_DIR, cleanPath, 'index.html');

        if (fs.existsSync(candidate)) {
          const rewritten = cleanPath === '' ? '/pages/index.html' : `/pages/${cleanPath}/index.html`;
          req.url = query ? `${rewritten}?${query}` : rewritten;
        }

        next();
      });
    }
  };
}

// Build: sposta i file generati in dist/pages/* dentro dist/*
function movePagesToRootPlugin(outDir) {
  return {
    name: 'move-pages-to-root',
    apply: 'build',
    writeBundle() {
      const distRoot = path.resolve(process.cwd(), outDir);
      const pagesRoot = path.join(distRoot, 'pages');
      if (!fs.existsSync(pagesRoot)) return;

      try {
        fs.cpSync(pagesRoot, distRoot, { recursive: true });
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

  // html minifier (solo in build)
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
  plugins.push(staticFooterHtmlPlugin());
  plugins.push(antiFoucHtmlPlugin());
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
