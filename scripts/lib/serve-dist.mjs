// Serves dist/ the way Cloudflare Pages does, for the checks that need a real
// browser pointed at what actually ships.
//
// A directory means its index.html and anything missing gets 404.html with a
// 404 — the two behaviours the pages depend on. Both the smoke run and the
// accessibility audit drive the built site, and one copy of this is enough.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = fileURLToPath(new URL('../../dist', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const target = resolve(DIST, `.${clean}`);
  const localPath = relative(DIST, target);
  if (localPath === '..' || localPath.startsWith(`..${sep}`)) return null;
  if (existsSync(target) && statSync(target).isFile()) return target;
  const index = join(target, 'index.html');
  return existsSync(index) ? index : null;
}

// Use the same response policies as production. A browser check without the
// CSP can pass while an iframe or a WASM encoder is blocked on the live site.
function responseHeaders() {
  const rules = [];
  let current;
  for (const line of readFileSync(join(DIST, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim().split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      current = { pattern: new RegExp(`^${pattern}$`), headers: {} };
      rules.push(current);
    } else {
      const match = /^\s+([^:]+):\s*(.*)$/.exec(line);
      if (match && current) current.headers[match[1].toLowerCase()] = match[2];
    }
  }
  return (pathname) => Object.assign({}, ...rules.filter((rule) => rule.pattern.test(pathname)).map((rule) => rule.headers));
}

/** Resolves to { server, base }. Call server.close() when finished. */
export function serveDist() {
  const headersFor = responseHeaders();
  const server = createServer((req, res) => {
    let file;
    try {
      file = resolveFile(req.url || '/');
    } catch {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }
    const headers = headersFor((req.url || '/').split('?')[0]);
    if (!file) {
      const notFound = join(DIST, '404.html');
      res.writeHead(404, { ...headers, 'content-type': MIME['.html'] });
      res.end(existsSync(notFound) ? readFileSync(notFound) : 'not found');
      return;
    }
    res.writeHead(200, { ...headers, 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

// The runners and the distributions do not agree on where Chrome lives, and a
// hard-coded path turns a missing browser into a confusing timeout instead of a
// sentence saying which paths were tried.
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
].filter(Boolean);

export function chromePath() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    console.error(`No Chrome found. Tried:\n  ${CHROME_CANDIDATES.join('\n  ')}\nSet CHROME_PATH.`);
    process.exit(1);
  }
  return found;
}
