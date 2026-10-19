const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const t0 = Date.now(); await p.goto('http://localhost:4413/index.html', { waitUntil: 'networkidle' }); const load = Date.now() - t0; await p.waitForTimeout(800);
  const bb = await (await p.$('#stage')).boundingBox(); await p.screenshot({ path: 'ride_0.png', clip: bb });
  await p.click('#hotTower'); await p.waitForTimeout(4000); await p.screenshot({ path: 'ride_mid.png', clip: bb });
  await p.waitForSelector('#back:not([hidden])', { timeout: 15000 }); await p.waitForTimeout(500); await p.screenshot({ path: 'ride_end.png', clip: bb });
  const where = await p.$eval('#where', e => e.textContent), fps = await p.$eval('#fps', e => e.textContent);
  await p.click('#back'); await p.waitForSelector('#hotTower:not([hidden])', { timeout: 15000 }); const where2 = await p.$eval('#where', e => e.textContent);
  console.log({ load, where, where2, fps, errs }); await b.close();
})();
