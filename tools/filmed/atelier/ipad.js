const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => { const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2, hasTouch: true });
  await p.goto(process.argv[2]); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(800);
  await p.screenshot({ path: process.argv[3] + '_start.png' }); await p.click('.sheet .row button:text-is("6")'); await p.click('.sheet .btn'); await p.waitForTimeout(1500); await p.click('.actions .btn'); await p.waitForTimeout(1800); await p.click('.actions .btn'); await p.waitForTimeout(1200);
  await p.screenshot({ path: process.argv[3] + '_measure.png' }); const r = await p.evaluate(() => ({ btn: getComputedStyle(document.querySelector('.bubble')).fontSize, stage: document.querySelector('#stage').getBoundingClientRect().height })); console.log(r); await b.close(); })();
