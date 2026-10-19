const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => { const band = process.argv[2] || '4', out = process.argv[3] || '.';
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:4421/_studio_harness.html?band=' + band + '&lang=he'); await p.waitForTimeout(6000);
  for (let i = 0; i < 40; i++) { await p.screenshot({ path: `${out}/b${band}_${String(i).padStart(2, '0')}.png` });
    const btns = await p.$$eval('button', bs => bs.filter(b => b.offsetParent && b.getBoundingClientRect().width > 20).map(b => b.textContent.trim()).slice(0, 8)); const plaque = await p.evaluate(() => { const e = document.querySelector('.rm-plaque, .plaque, [class*=plaque]'); return e ? e.textContent.trim().slice(0, 160) : ''; });
    console.log(i, JSON.stringify(btns), plaque);
    const next = await p.$('button:has-text("הלאה"), button:has-text("Next")'); if (next && await next.isVisible()) { await next.click(); await p.waitForTimeout(2500); continue; } break; }
  console.log(errs.slice(0, 5)); await b.close(); })();
