const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => { const band = process.argv[2] || '5', out = process.argv[3] || '.';
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4421/_studio_harness.html?band=' + band + '&lang=he'); await p.waitForTimeout(5000);
  for (let i = 0; i < 40; i++) { await p.screenshot({ path: `${out}/c${band}_${String(i).padStart(2, '0')}.png` });
    const g = await p.$$eval('button.btn.gold', bs => bs.filter(b => b.offsetParent).map(b => b.textContent.trim())); console.log(i, JSON.stringify(g));
    if (!g.length) break; await p.click('button.btn.gold >> visible=true'); await p.waitForTimeout(3200); }
  await b.close(); })();
