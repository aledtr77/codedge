// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { minify } from 'html-minifier-terser';

const ENTRY_DIR = 'site-pages';

function scanEntries(dir) {
  const root = path.resolve(process.cwd(), dir);
  const inputs = {};
  if (!fs.existsSync(root)) return inputs;

  function walk(cur) {
    const list = fs.readdirSync(cur, { withFileTypes: true });
    for (const it of list) {
      const full = path.join(cur, it.name);
      if (it.isDirectory()) walk(full);
      else if (it.isFile() && it.name.endsWith('.html')) {
        const rel = path.relative(root, full).split(path.sep).join('/');
        let key = rel.replace(/\.html$/, '');
        key = key.replace(/\/index$/, ''); // folder/index.html -> folder
        if (key === '') key = 'index';
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

// --- plugin DEV: riscrive richieste "pulite" (/risorse/) a /site-pages/risorse/... ---
function devSitePagesRewrite() {
  return {
    name: 'dev-site-pages-rewrite',
    apply: 'serve', // SOLO in dev (vite serve)
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (!req.url) return next();

        // non toccare richieste che già puntano a /site-pages o asset noti
        const skipPrefixes = [
          '/site-pages/', '/src/', '/@vite/', '/@fs/', '/node_modules/', '/api/',
          '/favicon.ico', '/icons/', '/css/', '/js/', '/assets/', '/_app/', '/assets/'
        ];
        if (skipPrefixes.some(p => req.url.startsWith(p))) return next();
        if (req.url.startsWith('//')) return next(); // protocol-relative

        // normalizza path (rimuove query string e trailing slash)
        const orig = req.url.split('?')[0];
        const urlPath = orig.replace(/^\/+/, '').replace(/\/+$/, ''); // no leading, no trailing slash
        // candidate files under site-pages
        const candidatePaths = [
          path.join(process.cwd(), 'site-pages', urlPath),                     // site-pages/risorse (file)
          path.join(process.cwd(), 'site-pages', urlPath + '.html'),           // site-pages/risorse.html
          path.join(process.cwd(), 'site-pages', urlPath, 'index.html')        // site-pages/risorse/index.html
        ];

        for (const p of candidatePaths) {
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            // riscrivi la richiesta verso l'html corretto sotto /site-pages
            if (fs.existsSync(path.join(process.cwd(), 'site-pages', urlPath, 'index.html'))) {
              req.url = '/site-pages/' + (urlPath === '' ? 'index.html' : urlPath + '/index.html');
            } else if (fs.existsSync(path.join(process.cwd(), 'site-pages', urlPath + '.html'))) {
              req.url = '/site-pages/' + urlPath + '.html';
            } else {
              req.url = '/site-pages/' + urlPath;
            }
            break;
          }
        }

        next();
      });
    }
  };
}

// plugin che sposta i file generati da dist/site-pages/* -> dist/* e riscrive riferimenti "/site-pages/" in HTML
function moveSitePagesToRootPlugin(outDir) {
  return {
    name: 'move-site-pages-to-root',
    apply: 'build',
    async writeBundle() {
      const distRoot = path.resolve(process.cwd(), outDir);
      const sitePagesRoot = path.join(distRoot, 'site-pages');
      if (!fs.existsSync(sitePagesRoot)) return;

      function moveRecursive(srcDir, dstDir, basePrefix) {
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        for (const e of entries) {
          const src = path.join(srcDir, e.name);
          const rel = path.relative(basePrefix, src);
          const dest = path.join(dstDir, rel);

          if (e.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            moveRecursive(src, dstDir, basePrefix);
          } else if (e.isFile()) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            try { fs.renameSync(src, dest); }
            catch {
              fs.copyFileSync(src, dest);
              fs.unlinkSync(src);
            }
          }
        }
      }

      try {
        moveRecursive(sitePagesRoot, distRoot, sitePagesRoot);

        // rimuovi ricorsivamente site-pages (tentativo)
        const rim = (d) => {
          if (!fs.existsSync(d)) return;
          for (const c of fs.readdirSync(d)) {
            const ch = path.join(d, c);
            if (fs.statSync(ch).isDirectory()) rim(ch);
            else fs.unlinkSync(ch);
          }
          try { fs.rmdirSync(d); } catch (e) {}
        };
        rim(sitePagesRoot);
      } catch (e) {
        this.error(`[move-site-pages] errore durante lo spostamento: ${e.message}`);
      }

      // riscrivi riferimenti dentro gli HTML che puntano esplicitamente a /site-pages/...
      function rewriteHtmlFiles(root) {
        const list = fs.readdirSync(root, { withFileTypes: true });
        for (const it of list) {
          const full = path.join(root, it.name);
          if (it.isDirectory()) rewriteHtmlFiles(full);
          else if (it.isFile() && it.name.endsWith('.html')) {
            let txt = fs.readFileSync(full, 'utf8');
            const updated = txt
              .replace(/(["'\(])\/site-pages\//g, (m, p1) => `${p1}/`) // attr="/site-pages/.."
              .replace(/https?:\/\/[^"']+\/site-pages\//g, (m) => m);   // non toccare URL assoluti
            if (updated !== txt) fs.writeFileSync(full, updated, 'utf8');
          }
        }
      }

      try { rewriteHtmlFiles(distRoot); } catch (e) { this.warn(`[move-site-pages] rewriteHtmlFiles fallito: ${e.message}`); }
    }
  };
}

export default defineConfig(({ command }) => {
  const outDir = 'dist';
  const entries = scanEntries(ENTRY_DIR) || {};

  console.log('[vite.config] found html entries:', Object.keys(entries));

  let rollupInput;
  if (Object.keys(entries).length > 0) {
    rollupInput = Object.fromEntries(Object.entries(entries));
  } else {
    const fallback = path.resolve(process.cwd(), 'site-pages/index.html');
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
  if (command === 'serve') {
    plugins.push(devSitePagesRewrite());
  }
  if (command === 'build') {
    plugins.push(htmlMinifierPlugin);
    plugins.push(moveSitePagesToRootPlugin(outDir));
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
