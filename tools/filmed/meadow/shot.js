const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now(); await p.goto('http://localhost:4411/index.html', { waitUntil: 'networkidle' }); const load = Date.now() - t0; await p.waitForTimeout(1500);
  const s1 = await p.$('#s1'); const bb = await s1.boundingBox();
  // drag across the first stage, time how many distinct frames were shown
  const seeks = await p.evaluate(() => { window.__seeks = 0; document.querySelector('#s1 video').addEventListener('seeked', () => window.__seeks++); return 0; });
  await p.mouse.move(bb.x + bb.width * 0.2, bb.y + bb.height / 2); await p.mouse.down();
  const t1 = performance.now(); for (let i = 0; i <= 40; i++) { await p.mouse.move(bb.x + bb.width * (0.2 + 0.6 * i / 40), bb.y + bb.height / 2); await p.waitForTimeout(16); } await p.mouse.up(); const dragMs = Math.round(performance.now() - t1);
  await p.waitForTimeout(800); const n = await p.evaluate(() => window.__seeks); const a1 = await p.$eval('#a1', e => e.textContent); const f1 = await p.$eval('#f1', e => e.textContent);
  await p.screenshot({ path: 'shot_turn.png', clip: bb });
  const s2 = await p.$('#s2'); await s2.scrollIntoViewIfNeeded(); const b2 = await s2.boundingBox();
  await p.mouse.move(b2.x + b2.width / 2, b2.y + b2.height * 0.8); await p.mouse.down(); for (let i = 0; i <= 30; i++) { await p.mouse.move(b2.x + b2.width / 2, b2.y + b2.height * (0.8 - 0.6 * i / 30)); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(800);
  const a2 = await p.$eval('#a2', e => e.textContent); const ct = await p.$$eval('.stage video', vs => vs.map(v => [v.currentTime.toFixed(2), v.videoWidth, v.readyState])); const f2 = await p.$eval('#f2', e => e.textContent); await p.screenshot({ path: 'shot_fly.png', clip: b2 });
  console.log({ ct, load, dragMs, framesShownDuringDrag: n, a1, f1, a2, f2, errs }); await b.close();
})();
