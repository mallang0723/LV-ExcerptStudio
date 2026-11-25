import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { firefox } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = new URL('../', import.meta.url);

test('phone close follows viewport width for mouse and touch; live HTML excludes hidden text', async () => {
  const browser = await firefox.launch({ executablePath: process.env.FIREFOX_BIN || undefined });
  try {
    for (const hasTouch of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 720, height: 800 }, hasTouch });
      try {
        // Every request is fulfilled locally or aborted; no network or host connection.
        await context.route('**/*', async route => {
          const url = new URL(route.request().url());
          const allowed = ['/qa/harness.html', '/qa/harness.js', '/dist/frontend.js'];
          if (url.origin !== 'https://qa.test' || !allowed.includes(url.pathname)) return route.abort();
          await route.fulfill({ body: await readFile(new URL(url.pathname.slice(1), root)),
            contentType: url.pathname.endsWith('.html') ? 'text/html' : 'application/javascript' });
        });
        const page = await context.newPage();
        await page.goto('https://qa.test/qa/harness.html');
        await page.waitForFunction(() => window.qa?.ready);
        await page.evaluate(() => {
          const style = document.createElement('style');
          style.textContent = 'article .popup-card { display:none }';
          document.head.append(style);
          document.querySelector('[data-component="MessageContent"]').innerHTML =
            '<p>여름 기온<span class="popup-card">숨긴 카드</span>입니다.</p>'
            + '<div style="visibility:hidden"><span style="visibility:visible">숨긴 자식</span></div>'
            + '<div hidden>숨김</div><div aria-hidden="true">접근성 숨김</div><p>다음 문단.</p>';
        });
        await page.locator('.lv-excerpt-action').click();
        assert.equal(await page.locator('.bs-card-text').textContent(), '여름 기온입니다.\n\n다음 문단.');
        for (const width of [720, 721, 760, 1280]) {
          await page.setViewportSize({ width, height: 800 });
          const phone = width <= 720;
          assert.equal(await page.locator('#excerpt-overlay-guard button').isVisible(), phone,
            `floating close: width=${width}, touch=${hasTouch}`);
          assert.equal(await page.locator('.bs-header .bs-icon-btn').isVisible(), !phone,
            `header close: width=${width}, touch=${hasTouch}`);
        }
        await page.locator('.bs-header .bs-icon-btn').click();
        assert.equal(await page.locator('.bs-overlay').count(), 0);
        await page.setViewportSize({ width: 720, height: 800 });
        await page.locator('.lv-excerpt-action').click();
        await page.locator('#excerpt-overlay-guard button').click();
        assert.equal(await page.locator('.bs-overlay').count(), 0);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
});
