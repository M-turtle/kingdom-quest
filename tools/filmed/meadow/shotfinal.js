const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const t0 = Date.now(); await p.goto('http://localhost:4412/index.html'); await p.waitForFunction(() => window.__ctl, null, { timeout: 90000 }); const load = Date.now() - t0; await p.waitForTimeout(2500);
  const bb = await (await p.$('#stage')).boundingBox(); await p.screenshot({ path: 'final_0.png', clip: bb });
  await p.mouse.move(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5); await p.mouse.down(); for (let i = 0; i <= 40; i++) { await p.mouse.move(bb.x + bb.width * (0.5 - 0.3 * i / 40), bb.y + bb.height * 0.5); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1500);
  const a1 = await p.evaluate(() => window.__ctl.getAzimuthalAngle()); await p.screenshot({ path: 'final_1.png', clip: bb });
  await p.mouse.move(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5); await p.mouse.down(); for (let i = 0; i <= 40; i++) { await p.mouse.move(bb.x + bb.width * (0.5 - 0.6 * i / 40), bb.y + bb.height * 0.5); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1500);
  const a2 = await p.evaluate(() => window.__ctl.getAzimuthalAngle()); await p.screenshot({ path: 'final_2.png', clip: bb });
  const fps = await p.$eval('#fps', e => e.textContent), fence = await p.evaluate(() => window.__fence);
  console.log({ load, fps, fence, a1, a2 }); await b.close();
})();
