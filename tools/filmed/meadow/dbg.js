const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4411/index.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => { const v = document.querySelector('#s1 video'); const out = { before: v.currentTime, dur: v.duration, rs: v.readyState, err: v.error && v.error.code };
    v.currentTime = 4; await new Promise(res => { v.addEventListener('seeked', res, { once: true }); setTimeout(res, 3000); }); out.after = v.currentTime; out.rs2 = v.readyState;
    const c = document.createElement('canvas'); c.width = 64; c.height = 36; const g = c.getContext('2d'); g.drawImage(v, 0, 0, 64, 36); out.px = Array.from(g.getImageData(30, 18, 1, 1).data); return out; });
  console.log(r); await b.close();
})();
