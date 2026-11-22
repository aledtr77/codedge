// Drives the built site with its production response headers. These checks
// exercise browser-enforced boundaries, not just the text of the CSP.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { chromePath, serveDist } from './lib/serve-dist.mjs';

const { server, base } = await serveDist();
let browser;
async function withPage(run, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  await context.addInitScript(() => {
    if (window === window.top) localStorage.setItem('codedge:lang', location.pathname.startsWith('/it/') ? 'it' : 'en');
    window.securityViolations = [];
    window.previewMessages = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.securityViolations.push(event.effectiveDirective);
    });
    window.addEventListener('message', (event) => window.previewMessages.push(event.data));
  });
  try {
    await run(await context.newPage(), context);
  } finally {
    await context.close();
  }
}

try {
  browser = await chromium.launch({ executablePath: chromePath(), headless: true });

  await withPage(async (page) => {
    const response = await page.goto(`${base}/`);
    const headers = response.headers();
    const policy = headers['content-security-policy'];
    assert.ok(policy.includes("script-src-attr 'none'"));
    assert.ok(!/script-src\s[^;]*'unsafe-inline'/.test(policy));
    assert.ok(!policy.includes("'unsafe-eval'"));
    assert.equal(headers['x-content-type-options'], 'nosniff');
    assert.equal(headers['x-frame-options'], 'DENY');
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.injectedScriptRan = true';
      document.body.append(script);
      const button = document.createElement('button');
      button.setAttribute('onclick', 'window.injectedHandlerRan = true');
      document.body.append(button);
      button.click();
    });
    await page.waitForFunction(() => window.securityViolations.includes('script-src-attr'));
    assert.equal(await page.evaluate(() => Boolean(window.injectedScriptRan || window.injectedHandlerRan)), false);
    assert.equal(await page.evaluate(async () => {
      await WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
      return true;
    }), true);
    console.log('PASS production headers block injected scripts and handlers while allowing WASM');
  });

  for (const lang of ['it', 'en']) {
    await withPage(async (page) => {
      const route = lang === 'it' ? '/it/risorse/snippet-library/' : '/resources/snippet-library/';
      await page.goto(base + route);
      await page.locator('#semantic-layout .play-btn').click();
      const iframe = page.locator('.playground-iframe');
      assert.equal(await iframe.getAttribute('sandbox'), 'allow-scripts');
      const frame = await (await iframe.elementHandle()).contentFrame();
      await page.waitForFunction(() => window.previewMessages.some((data) => data.type === 'playground:height'));
      assert.ok(await frame.locator('h1').textContent());
      const externalLink = '<a href="https://example.com/private">External link</a>';
      const readyMessages = await page.evaluate(() => window.previewMessages.filter((data) => data.type === 'playground:ready').length);
      await page.locator('.playground-editor').fill(externalLink);
      await page.waitForFunction((count) => window.previewMessages.filter((data) => data.type === 'playground:ready').length > count, readyMessages);
      const previewLink = frame.locator('a[href="https://example.com/private"]');
      await previewLink.waitFor();
      await previewLink.evaluate((link) => link.click());
      const sandboxToast = frame.locator('#sandbox-toast');
      await sandboxToast.waitFor({ state: 'visible' });
      assert.ok(await sandboxToast.textContent());
      assert.equal(await frame.evaluate(() => {
        try { return Boolean(parent.document); } catch { return false; }
      }), false);

      const payload = `<h1 id="preview-proof">Preview isolation</h1>
        <script>parent.postMessage({type:'untrusted-script-ran'}, '*')</script>
        <img src="data:image/png,invalid" onerror="parent.postMessage({type:'untrusted-script-ran'}, '*')">
        <a href="javascript:parent.postMessage({type:'untrusted-script-ran'}, '*')">Run</a>`;
      await page.locator('.playground-editor').fill(payload);
      await frame.waitForSelector('#preview-proof');
      await frame.waitForFunction(() => window.securityViolations.includes('script-src-elem') && window.securityViolations.includes('script-src-attr'));
      await frame.locator('a').click();
      await page.waitForFunction(() => window.previewMessages.filter((data) => data.type === 'playground:height').length > 1);
      assert.equal(await page.evaluate(() => window.previewMessages.some((data) => data.type === 'untrusted-script-ran')), false);
      assert.equal(await frame.evaluate(async () => {
        try { await fetch('https://example.invalid/private'); return true; } catch { return false; }
      }), false);
      console.log(`PASS ${lang} HTML/CSS preview renders and resizes; reader scripts and network calls stay blocked`);
    });
  }

  await withPage(async (page) => {
    await page.goto(`${base}/tutorials/`);
    await page.evaluate(() => {
      localStorage.setItem('quiz-completed-marketing-indie-dev', 'true');
      localStorage.setItem('quiz-score-marketing-indie-dev', '<img id="stored-injection" src=x onerror="alert(1)">');
    });
    await page.reload();
    assert.equal(await page.locator('#stored-injection, .learning-card__badge').count(), 0);
    await page.evaluate(() => localStorage.setItem('quiz-score-marketing-indie-dev', '8'));
    await page.reload();
    assert.match(await page.locator('.learning-card__badge').textContent(), /Quiz passed:.*8\/10/);
    await page.locator('.lang-switch').click();
    await page.waitForFunction(() => document.documentElement.lang === 'it');
    assert.match(await page.locator('.learning-card__badge').textContent(), /Quiz superato:.*8\/10/);
    console.log('PASS saved quiz values cannot become markup; valid badges work in both languages');
  });

  for (const slug of ['html-fundamentals', 'css-fundamentals']) {
    await withPage(async (page) => {
      await page.addInitScript(() => {
        if (window === window.top) sessionStorage.setItem('security:loads', Number(sessionStorage.getItem('security:loads') || 0) + 1);
      });
      await page.goto(`${base}/tutorials/${slug}/?source=security-check#chapter-01`);
      const target = await page.locator('.lang-switch').getAttribute('href');
      await page.locator('.lang-switch').click();
      await page.waitForURL((url) => url.pathname === target);
      assert.equal(await page.locator('html').getAttribute('lang'), 'it');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('security:loads')), '2');
      assert.equal(new URL(page.url()).search, '?source=security-check');
      assert.equal(new URL(page.url()).hash, '#chapter-01');
      console.log(`PASS ${slug} loads the complete translation when authored structures differ`);
    }, { serviceWorkers: 'block' });
  }

  await withPage(async (page) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/tools/image-compressor/`);
    const fixture = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const context = canvas.getContext('2d');
      context.fillStyle = '#35a8c7';
      context.fillRect(0, 0, 32, 32);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page.selectOption('#outputFormat', 'avif');
    await page.setInputFiles('#fileInput', { name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') });
    await page.locator('.row-action-btn').click();
    await page.waitForFunction(() => document.querySelector('.row-action-btn')?.textContent.includes('Download'));
    await page.locator('.lang-switch').click();
    await page.waitForFunction(() => document.documentElement.lang === 'it');
    assert.match(await page.locator('.row-action-btn').textContent(), /Scarica/);
    assert.ok(await page.locator('.row-action-btn').evaluate((button) => button.classList.contains('is-download')));
    const downloaded = page.waitForEvent('download');
    await page.locator('.row-action-btn').click();
    const download = await downloaded;
    const encoded = readFileSync(await download.path());
    assert.match(download.suggestedFilename(), /\.avif$/);
    assert.equal(encoded.toString('ascii', 4, 8), 'ftyp');
    assert.ok(encoded.subarray(8, 32).includes(Buffer.from('avif')));
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => window.securityViolations), []);
    console.log('PASS AVIF compression downloads a real AVIF under the production CSP');
  });

  await withPage(async (page, context) => {
    await page.goto(`${base}/it/tutorial/marketing-indie-dev/`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.reload();
    const route = '/it/tutorial/marketing-indie-dev/';
    await page.waitForFunction(async (route) => Boolean(await caches.match(route)), route);
    // Seed an obsolete public image. A new load must show the current bytes
    // immediately, rather than serve the stale copy and update behind it.
    const imagePath = '/images/tutorials/indie-marketing/research-notes-it.webp';
    const freshImage = await page.evaluate(async (path) => {
      const name = (await caches.keys()).find((name) => name.startsWith('codedge-runtime-'));
      await (await caches.open(name)).put(path, new Response('obsolete image'));
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image.naturalWidth > 0);
        image.onerror = () => resolve(false);
        image.src = path;
      });
    }, imagePath);
    assert.equal(freshImage, true);
    const heading = await page.locator('h1').textContent();
    await context.setOffline(true);
    const cached = await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(cached.status(), 200);
    assert.equal(await page.locator('h1').textContent(), heading);
    const fallback = await page.goto(`${base}/unvisited-security-check/`, { waitUntil: 'domcontentloaded' });
    assert.equal(fallback.status(), 503);
    assert.equal(fallback.headers()['x-frame-options'], 'DENY');
    assert.ok(fallback.headers()['content-security-policy']);
    assert.match(await page.locator('h1').textContent(), /offline/);
    assert.equal(await page.locator('section[lang="en"]').count(), 1);
    console.log('PASS service worker refreshes edited images, opens visited pages offline and handles unvisited pages');
  });
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
