const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => { const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4421/_studio_harness.html?band=5&lang=he'); await p.waitForTimeout(5000);
  console.log(await p.evaluate(() => [...document.querySelectorAll('button')].map(b => [b.className, b.textContent.trim(), !!b.offsetParent, JSON.stringify(b.getBoundingClientRect())]).slice(0, 10)));
  console.log(await p.evaluate(() => document.querySelector('#room3d').innerHTML.replace(/<canvas[^>]*>/g, '').slice(0, 1500)));
  await b.close(); })();
