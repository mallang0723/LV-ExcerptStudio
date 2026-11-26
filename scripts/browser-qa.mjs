// Reduced/adapted from marinara-anon-lumi-work/publish/scripts/browser-qa.mjs.
// Isolated stand-in host; never contacts the installed Lumiverse or ports 7880/7881.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(new URL('..', import.meta.url).pathname);
const output = resolve(root, 'qa/results'); await mkdir(output, { recursive: true });
async function asset(pathname) {
  if (!['/qa/harness.html', '/qa/harness.js', '/dist/frontend.js'].includes(pathname)) return null;
  return { body: await readFile(root + pathname), contentType: pathname.endsWith('.html') ? 'text/html' : 'application/javascript' };
}
// Both origins are fulfilled by Playwright routing; no listening socket is needed.
const secure = 'https://qa.test', insecure = 'http://qa.test';
const results = [], failures = [];
const names = (process.env.QA_BROWSERS || 'chromium,firefox').split(',');
try {
  for (const browserName of names) {
    let browser;
    try { browser = await pw[browserName].launch({ executablePath: process.env[browserName.toUpperCase() + '_BIN'] || undefined }); }
    catch (error) { failures.push({ tag: browserName, stage: 'launch', error: error.message }); console.log('BLOCKED', browserName, error.message.split('\n')[0]); continue; }
    try {
      for (const width of [360, 390, 1280]) for (const originName of ['secure', 'insecure']) {
        const tag = `${browserName}-${width}-${originName}`;
        const origin = originName === 'secure' ? secure : insecure;
        const context = await browser.newContext({ viewport: { width, height: 800 }, hasTouch: width < 500, acceptDownloads: true,
          ...(browserName === 'chromium' && width < 500 ? { isMobile: true, deviceScaleFactor: 1 } : {}) });
        await context.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.origin !== origin) return route.abort();
          const a = await asset(url.pathname);
          await route.fulfill({ status: a ? 200 : 404, body: a?.body || '', contentType: a?.contentType });
        });
        const page = await context.newPage(); page.setDefaultTimeout(7000);
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        try {
          await page.goto(origin + '/qa/harness.html'); await page.waitForFunction(() => window.qa?.ready);
          const env = await page.evaluate(() => ({ secure: isSecureContext, uuid: typeof crypto.randomUUID, clipboard: typeof navigator.clipboard }));
          assert.equal(env.secure, originName === 'secure');
          if (originName === 'insecure') { assert.equal(env.uuid, 'undefined'); assert.equal(env.clipboard, 'undefined'); }
          for (const theme of ['light', 'dark']) for (const layout of ['minimal', 'bubble']) {
            await page.evaluate(({ theme, layout }) => { qa.setTheme(theme); qa.render(layout); }, { theme, layout });
            const action = page.getByRole('button', { name: '이 메시지 발췌', exact: true });
            await action.waitFor();
            await page.mouse.move(0, 0);
            const actionMetrics = await action.evaluate(button => {
              const row = button.closest('.host-actions');
              const host = row.querySelector(':scope > button');
              const rect = button.getBoundingClientRect(), icon = button.querySelector('svg').getBoundingClientRect();
              const hostRect = host.getBoundingClientRect();
              const style = getComputedStyle(button), hostStyle = getComputedStyle(host);
              return { text: button.textContent, title: button.title, icon: [icon.width, icon.height],
                size: [rect.width, rect.height], hostSize: [hostRect.width, hostRect.height],
                color: style.color, hostColor: hostStyle.color, background: style.backgroundColor,
                hostBackground: hostStyle.backgroundColor, sameLine: rect.top === hostRect.top,
                overflow: row.scrollWidth > row.clientWidth || rect.right > innerWidth,
                coarse: matchMedia('(any-pointer: coarse)').matches };
            });
            assert.equal(actionMetrics.text, '');
            assert.equal(actionMetrics.title, '이 메시지 발췌');
            assert.deepEqual(actionMetrics.icon, [16, 16]);
            assert.deepEqual(actionMetrics.size, actionMetrics.hostSize);
            assert.equal(actionMetrics.color, actionMetrics.hostColor);
            assert.equal(actionMetrics.background, actionMetrics.hostBackground);
            assert.equal(actionMetrics.sameLine, true);
            assert.equal(actionMetrics.overflow, false);
            if (actionMetrics.coarse) assert.ok(Math.min(...actionMetrics.size) >= 44);
            await action.hover();
            const hover = await action.evaluate(b => ({ color: getComputedStyle(b).color, background: getComputedStyle(b).backgroundColor }));
            await page.locator('.host-actions > button').first().hover();
            assert.deepEqual(await page.locator('.host-actions > button').first().evaluate(b => ({ color: getComputedStyle(b).color, background: getComputedStyle(b).backgroundColor })), hover);
            await page.screenshot({ path: `${output}/${tag}-${theme}-${layout}-action.png` });
            await page.locator('.lv-excerpt-action').click();
            await page.locator('.bs-card-title').filter({ hasText: '우리 이야기' }).waitFor();
            assert.equal(await page.locator('.bs-card-author').textContent(), 'LUMIVERSE');
            assert.ok(!(await page.locator('.bs-card-text').textContent()).includes('제외'));
            await page.getByRole('button', { name: '선택 해제', exact: true }).click();
            await page.locator('.lv-excerpt-pieces button').first().click();
            await page.getByRole('button', { name: '선택 범위 적용', exact: true }).click();
            assert.equal(await page.locator('.bs-card-text').textContent(), '첫 문장입니다.');
            // Real button-only path through actual canvas renderer and browser download.
            const downloadPromise = page.waitForEvent('download');
            await page.getByRole('button', { name: 'PNG 저장', exact: true }).click();
            const download = await downloadPromise;
            assert.match(download.suggestedFilename(), /^발췌_\d{8}_\d{6}\.png$/);
            const bytes = await readFile(await download.path());
            assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
            assert.ok(bytes.length > 1000); assert.equal(bytes.readUInt32BE(16), 1280);
            const measurement = await page.evaluate(() => {
              const shown = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
              const overlay = document.querySelector('.bs-overlay');
              const controls = [...overlay.querySelectorAll('button,select,input:not([type=file]):not(.bs-swatch-picker),.bs-swatch-badge')].filter(shown);
              const short = controls.filter(e => { const r = e.getBoundingClientRect(); return Math.min(r.width,r.height) < 43.5; }).map(e => e.className);
              const overflow = [...overlay.querySelectorAll('*')].filter(shown).filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(e => e.className);
              const small = [...overlay.querySelectorAll('*')].filter(shown).filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 15).map(e => e.className);
              return { short, overflow, small, panelBg: getComputedStyle(overlay.querySelector('.bs-panel')).backgroundColor, hscroll: document.documentElement.scrollWidth > innerWidth };
            });
            assert.deepEqual(measurement.short, [], JSON.stringify(measurement));
            assert.deepEqual(measurement.overflow, [], JSON.stringify(measurement));
            assert.deepEqual(measurement.small, [], JSON.stringify(measurement));
            assert.equal(measurement.hscroll, false);
            assert.equal(measurement.panelBg, theme === 'light' ? 'rgb(255, 250, 245)' : 'rgb(40, 32, 51)');
            await page.screenshot({ path: `${output}/${tag}-${theme}-${layout}.png` });
            await page.keyboard.press('Escape'); await page.locator('.bs-overlay').waitFor({ state: 'detached' });
            await page.waitForTimeout(150);
            await page.locator('.lv-excerpt-action').click(); await page.evaluate(() => history.back());
            await page.locator('.bs-overlay').waitFor({ state: 'detached' });
            if (width < 500) {
              await page.locator('.lv-excerpt-action').click();
              const box = await page.locator('#excerpt-overlay-guard button').boundingBox();
              assert.ok(box.y >= 0 && box.x + box.width <= width && box.width >= 44);
              await page.locator('#excerpt-overlay-guard button').click();
              await page.locator('.bs-overlay').waitFor({ state: 'detached' }); await page.waitForTimeout(150);
            }
            results.push({ tag, theme, layout, env, pngBytes: bytes.length, ...measurement });
          }
          // The desktop selection shortcut accepts body only and preserves the host context menu.
          await page.evaluate(() => {
            const select = el => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
            select(document.querySelector('header'));
          });
          await page.waitForTimeout(180); assert.equal(await page.locator('.bs-fab').isVisible(), false);
          await page.evaluate(() => {
            const r = document.createRange(); r.selectNodeContents(document.querySelector('[data-component="MessageContent"] p'));
            getSelection().removeAllRanges(); getSelection().addRange(r);
          });
          await page.locator('.bs-fab').waitFor({ state: 'visible' });
          const cancelled = await page.evaluate(() => !document.querySelector('[data-component="MessageContent"]').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
          assert.equal(cancelled, false);
          await page.locator('.bs-fab').click(); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
          await page.evaluate(() => qa.switchChat()); await page.locator('.lv-excerpt-action').click();
          await page.locator('.bs-card-title').filter({ hasText: '다른 이야기' }).waitFor();
          await page.evaluate(() => qa.dispose());
          assert.equal(await page.locator('.bs-overlay,.bs-fab,.lv-excerpt-action,#excerpt-overlay-guard').count(), 0);
          assert.deepEqual(errors, []);
        } catch (error) {
          failures.push({ tag, error: error.stack });
          await page.screenshot({ path: `${output}/FAIL-${tag}.png` }).catch(() => {});
          console.log('FAIL', tag, error.message);
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
} finally { /* each browser/context is disposed above */ }
await writeFile(`${output}/report.json`, JSON.stringify({ cases: results.length, failures, results }, null, 2));
console.log(JSON.stringify({ cases: results.length, failures: failures.length }));
process.exitCode = failures.length ? 1 : 0;
