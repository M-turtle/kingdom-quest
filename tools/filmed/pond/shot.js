const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [name, w, h, dpr] of [['desktop', 1440, 900, 2], ['phone', 390, 844, 3]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const t0 = Date.now(); await p.goto('http://localhost:4410/index.html', { waitUntil: 'networkidle' }); const load = Date.now() - t0;
    await p.waitForTimeout(2500);
    await p.waitForTimeout(300);
    const fps = await p.$eval('#fps', e => e.textContent); const playing = await p.$$eval('#stage video', vs => vs.map(v => !v.paused && v.currentTime > 0));
    await p.screenshot({ path: `shot_${name}.png` });
    await p.click('.obj'); await p.waitForTimeout(900);
    const count = await p.$eval('#count', e => e.textContent);
    console.log(name, { load, fps, playing, count, errs });
    await p.close();
  }
  await b.close();
})();
