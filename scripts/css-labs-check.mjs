// Run after npm run build. Check the lesson outcomes in real browser documents,
// including all choices, narrow screens, language switching and the production CSP.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { chromePath, DIST, serveDist } from './lib/serve-dist.mjs';

const { server, base } = await serveDist();
const browser = await chromium.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox'] });
const csp = readFileSync(`${DIST}/_headers`, 'utf8').match(/Content-Security-Policy: (.+)/)[1];
const routes = ['/it/tutorial/css-fondamentali/', '/tutorials/css-fundamentals/'];
try {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    await context.route('**/*', async (request) => {
      const response = await request.fetch();
      await request.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
    });
    await context.addInitScript(() => {
      if (window === window.top) localStorage.setItem('codedge:lang', location.pathname.startsWith('/it/') ? 'it' : 'en');
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}${route}`);
    const ready = async () => {
      await page.waitForFunction(() => document.querySelectorAll('[data-css-lab][data-ready]').length === 13);
      await page.waitForFunction(() => [...document.querySelectorAll('.css-lab iframe')].every((f) => f.contentDocument?.getElementById('experiment')));
    };
    await ready();
    assert.equal(await page.locator('html').getAttribute('lang'), route.startsWith('/it/') ? 'it' : 'en');
    const lab = (key) => page.locator(`[data-css-lab="${key}"]`);
    const choose = (key, name, value) => lab(key).locator(`button[name="${name}"][value="${value}"]`).click();
    const frame = async (key) => (await lab(key).locator('iframe').elementHandle()).contentFrame();
    const css = async (key, selector, property) => (await frame(key)).locator(selector).first().evaluate((el, property) => getComputedStyle(el)[property], property);
    const rect = async (key, selector) => (await frame(key)).locator(selector).first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, width: r.width, height: r.height };
    });
    const close = (a, b) => assert.ok(Math.abs(a - b) < 0.1, `${a} != ${b}`);

    // Assert the concepts taught, using computed styles and real geometry.
    const textBefore = await (await frame('rule')).locator('p').textContent();
    await choose('rule', 'color', '#efb38b');
    assert.equal(await css('rule', 'p', 'color'), 'rgb(239, 179, 139)');
    assert.equal(await (await frame('rule')).locator('p').textContent(), textBefore);
    for (const [selector, count] of [['p', 3], ['.group p', 2], ['.group > p', 1]]) {
      await choose('selectors', 'selector', selector);
      assert.equal(await (await frame('selectors')).locator('p').evaluateAll((nodes) => nodes.filter((el) => getComputedStyle(el).color === 'rgb(139, 201, 239)').length), count);
    }
    for (const [value, color] of [['specificity', 'rgb(239, 179, 139)'], ['order', 'rgb(139, 201, 239)'], ['reverse', 'rgb(239, 179, 139)']]) {
      await choose('cascade', 'case', value);
      assert.equal(await css('cascade', 'p', 'color'), color);
      assert.equal(await lab('cascade').locator('.css-lab__line--overridden').count(), 1);
    }
    assert.equal(await css('inheritance', 'p', 'color'), 'rgb(239, 179, 139)');
    assert.equal(await css('inheritance', 'p', 'borderTopWidth'), '0px');
    await choose('inheritance', 'own', 'blue');
    assert.equal(await css('inheritance', 'p', 'color'), 'rgb(139, 201, 239)');
    assert.equal(await css('inheritance', '.parent', 'color'), 'rgb(239, 179, 139)');
    assert.ok((await rect('flow', '.item')).width < 80);
    await choose('flow', 'display', 'block');
    close((await rect('flow', '.item')).width, 80);
    assert.ok(await (await frame('flow')).locator('.item').evaluateAll(([a, b]) => b.getBoundingClientRect().y > a.getBoundingClientRect().y));
    await choose('flow', 'display', 'inline-block');
    assert.ok(await (await frame('flow')).locator('.item').evaluateAll(([a, b]) => b.getBoundingClientRect().y === a.getBoundingClientRect().y));
    await choose('flow', 'display', 'none');
    close((await rect('flow', '.item')).width, 0);
    close((await rect('box', '.box')).width, 144);
    await choose('box', 'sizing', 'border-box');
    close((await rect('box', '.box')).width, 120);
    assert.equal(await css('box', '.box', 'width'), '120px');
    assert.ok((await lab('box').locator('.css-lab__readings').textContent()).includes('96px'));
    close((await rect('units', '.child')).width, 80);
    await choose('units', 'width', '240');
    close((await rect('units', '.parent')).width, 240);
    close((await rect('units', '.child')).width, 120);
    const input = (await frame('states')).locator('input');
    await input.click();
    assert.equal(await css('states', 'input', 'outlineWidth'), '3px');
    assert.equal(await css('states', 'input', 'outlineColor'), 'rgb(139, 201, 239)');
    await input.evaluate((el) => el.blur());
    assert.equal(await input.evaluate((el) => el.matches(':focus')), false);
    const flexRow = await (await frame('flex')).locator('.container > div').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().y));
    assert.equal(new Set(flexRow).size, 1);
    await choose('flex', 'direction', 'column');
    assert.ok(await (await frame('flex')).locator('.container > div').evaluateAll(([a, b]) => b.getBoundingClientRect().y > a.getBoundingClientRect().y));
    assert.equal((await css('grid', '.container', 'gridTemplateColumns')).split(' ').length, 2);
    await choose('grid', 'columns', '1');
    assert.equal((await css('grid', '.container', 'gridTemplateColumns')).split(' ').length, 1);
    const bBefore = await rect('position', '.b');
    await choose('position', 'position', 'absolute');
    assert.ok((await rect('position', '.b')).y < bBefore.y);
    close((await rect('position', '.a')).y, (await rect('position', '.parent')).y + 13);
    close((await rect('position', '.a')).right, (await rect('position', '.parent')).right - 13);
    assert.equal(await (await frame('responsive')).evaluate(() => innerWidth), 639);
    assert.equal((await css('responsive', '.container', 'gridTemplateColumns')).split(' ').length, 1);
    await choose('responsive', 'width', '640');
    assert.equal(await (await frame('responsive')).evaluate(() => innerWidth), 640);
    assert.equal((await css('responsive', '.container', 'gridTemplateColumns')).split(' ').length, 2);
    await choose('variables', 'color', '#efb38b');
    for (const selector of ['.a', '.b']) assert.equal(await css('variables', selector, 'color'), 'rgb(239, 179, 139)');

    // Every alternative fits its own canvas, and reset returns code, controls
    // and preview to their original state. Scrollable code may be wider.
    for (const key of await page.locator('[data-css-lab]').evaluateAll((nodes) => nodes.map((n) => n.dataset.cssLab))) {
      const reset = lab(key).locator('[type="reset"]');
      if (await reset.isVisible()) await reset.click();
      const initial = await lab(key).locator('input, button[name]').evaluateAll((els) => els.map((el) => [el.value, el.getAttribute('aria-pressed')]));
      const initialCode = await lab(key).locator('.css-lab__source code').textContent();
      for (const button of await lab(key).locator('button[name]').all()) {
        await button.click();
        const doc = await frame(key);
        assert.ok(await doc.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), `Clipped state: ${key}`);
      }
      for (const input of await lab(key).locator('input').all()) {
        await input.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
      }
      if (await reset.isVisible()) await reset.click();
      assert.deepEqual(await lab(key).locator('input, button[name]').evaluateAll((els) => els.map((el) => [el.value, el.getAttribute('aria-pressed')])), initial);
      assert.equal(await lab(key).locator('.css-lab__source code').textContent(), initialCode);
      assert.equal(await (await frame(key)).locator('#experiment').textContent(), initialCode);
      assert.equal(await lab(key).locator('.code-toolbar').count(), 0);
      assert.ok(await lab(key).locator('.css-lab__html pre').isVisible());
    }
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(150);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}: ${route}`);
      const boxDiagram = page.locator('#chapter-06 .guide-figure img');
      await boxDiagram.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('#chapter-06 .guide-figure img')?.naturalWidth > 0);
      assert.ok((await boxDiagram.evaluate((img) => img.currentSrc)).endsWith(width <= 600 ? 'box-model-mobile.svg' : 'box-model.svg'));
      for (const handle of await page.locator('.css-lab iframe').elementHandles()) {
        const child = await handle.contentFrame();
        assert.equal(await child.evaluate(() => getComputedStyle(document.documentElement).backgroundColor), 'rgb(12, 17, 27)');
        assert.ok(await child.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), `Clipped frame at ${width}: ${route}`);
        assert.ok(await child.locator('.projects strong').evaluateAll((els) => els.every((el) => el.scrollWidth <= el.clientWidth + 1)), `Clipped portfolio title at ${width}: ${route}`);
        assert.ok(await child.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal frame overflow at ${width}: ${route}`);
      }
      assert.ok(await page.locator('.css-lab input').evaluateAll((els) => els.every((el) => el.labels.length)));
      assert.ok(await page.locator('.css-lab button').evaluateAll((els) => els.every((el) => el.textContent.trim())));
      if (route === routes[0] && [1440, 320].includes(width)) {
        await page.addStyleTag({ content: 'body > header { visibility: hidden !important; }' });
        for (const key of ['selectors', 'inheritance', 'flow', 'box', 'grid', 'position']) await lab(key).screenshot({ path: `/tmp/codedge-css-rebuilt-${key}-${width}.png` });
        await page.addStyleTag({ content: 'body > header { visibility: visible !important; }' });
      }
    }
    // Language switching also translates generated controls and preview text.
    await choose('box', 'sizing', 'border-box');
    await page.locator('a.lang-switch').click();
    await page.waitForFunction((lang) => document.documentElement.lang === lang, route.startsWith('/it/') ? 'en' : 'it');
    await ready();
    assert.equal(await lab('box').locator('button[value="border-box"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await lab('selectors').locator('.css-lab__window-name').textContent(), route.startsWith('/it/') ? 'Three paragraphs: A, B and C' : 'Tre paragrafi: A, B e C');
    assert.equal(await (await frame('rule')).locator('p').textContent(), route.startsWith('/it/') ? 'This is a paragraph.' : 'Questo è un paragrafo.');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${route}: fundamental concepts, all choices, visible HTML, reset, 4 widths, language switch, production CSP`);
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJS.newPage();
  for (const route of routes) {
    await page.goto(`${base}${route}`);
    assert.equal(await page.locator('.css-lab noscript').count(), 13);
    assert.ok(await page.locator('.css-lab noscript').first().isVisible());
  }
  await noJS.close();
  console.log('PASS explanations and fallback remain readable without JavaScript');
} finally {
  await browser.close();
  server.close();
}
