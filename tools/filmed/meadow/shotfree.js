const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now(); await p.goto('http://localhost:4412/index.html'); await p.waitForFunction(() => !document.getElementById('load') || document.getElementById('load').textContent.startsWith('could'), null, { timeout: 90000 }); const load = Date.now() - t0; await p.waitForTimeout(3000);
  const bb = await (await p.$('#stage')).boundingBox();
  await p.screenshot({ path: 'free_a.png', clip: bb });
  await p.mouse.move(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5); await p.mouse.down(); for (let i = 0; i <= 30; i++) { await p.mouse.move(bb.x + bb.width * (0.5 - 0.45 * i / 30), bb.y + bb.height * 0.5); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'free_b.png', clip: bb });
  await p.mouse.move(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5); await p.mouse.down(); for (let i = 0; i <= 30; i++) { await p.mouse.move(bb.x + bb.width * (0.5 + 0.9 * i / 30), bb.y + bb.height * 0.5); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'free_c.png', clip: bb });
  const fence = await p.evaluate(() => window.__fence); const fps = await p.$eval('#fps', e => e.textContent), n = await p.$eval('#n', e => e.textContent), loadtxt = await p.evaluate(() => document.getElementById('load') ? document.getElementById('load').textContent : 'ok');
  console.log({ fence, load, fps, n, loadtxt, errs: errs.slice(0, 5) }); await b.close();
})();
