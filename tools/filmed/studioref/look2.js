const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => { const band = process.argv[2] || '4', out = process.argv[3] || '.';
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4421/_studio_harness.html?band=' + band + '&lang=he'); await p.waitForTimeout(5000);
  let last = '';
  for (let i = 0; i < 60; i++) {
    const txt = await p.evaluate(() => [...document.querySelectorAll('div,p,span')].filter(e => e.offsetParent && e.children.length === 0 && e.textContent.trim().length > 12).map(e => e.textContent.trim()).filter(s => !/^\d/.test(s)).slice(0, 3).join(' | '));
    const btns = await p.$$eval('button', bs => bs.filter(b => b.offsetParent && b.getBoundingClientRect().width > 20).map(b => b.textContent.trim()));
    if (txt !== last) { await p.screenshot({ path: `${out}/s${band}_${String(i).padStart(2, '0')}.png` }); console.log(i, JSON.stringify(btns.slice(0, 6)), '::', txt.slice(0, 200)); last = txt; }
    const go = await p.$('button:has-text("מתחילים"), button:has-text("הלאה"), button:has-text("את זה")'); if (go && await go.isVisible()) { await go.click(); await p.waitForTimeout(2600); continue; }
    break; }
  await b.close(); })();
