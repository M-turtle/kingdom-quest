/* drives one client through the Atelier with real pointer events; screenshots every step */
const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const age = +(process.argv[2] || 6), lang = process.argv[3] || 'he', outdir = process.argv[4] || '.';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:4420/atelier/index.html'); await p.waitForTimeout(600);
  await p.evaluate(l => { localStorage.setItem('kq_atelier_v1', JSON.stringify({ lang: l, name: 'Bot', age: 6, coins: 12, rep: 0, day: 1, wardrobe: [], seen: 0 })); }, lang); await p.reload(); await p.waitForTimeout(800);
  let shot = 0; const snap = async n => { await p.screenshot({ path: `${outdir}/s${String(shot++).padStart(2, '0')}_${n}.png` }); };
  const unit = async () => { const r = await p.$eval('#stage', e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, u: b.height / 100 }; }); return r; };
  const toPx = (u, x, y) => [u.x + x * u.u, u.y + y * u.u];
  const bubble = async () => (await p.$('.bubble')) ? await p.$eval('.bubble', e => e.textContent) : '';
  const clickBtn = async (txt) => { const bs = await p.$$('.actions .btn'); for (const x of bs) { const t = await x.textContent(); if (!txt || t.includes(txt)) { await x.click(); return true; } } return false; };
  const typeNum = async v => { const s = String(v); for (const ch of s) { await p.click(`.pad .keys button:text-is("${ch}")`); } await p.click('.pad .keys .go'); await p.waitForTimeout(300); };
  // start sheet: age
  await snap('start'); await p.click(`.sheet .row button:text-is("${age === 15 ? '15+' : age}")`); await p.click('.sheet .btn'); await p.waitForTimeout(1500); await snap('shop');
  await p.click('.actions .btn'); await p.waitForTimeout(1800); await snap('client'); console.log('wish:', await bubble()); await clickBtn(''); await p.waitForTimeout(600);
  // the game loop: look at __geo and the pad to decide what to do
  for (let step = 0; step < 140; step++) {
    await p.waitForTimeout(400); const geo = await p.evaluate(() => window.__geo && window.__geo.kind ? window.__geo : null); const hasPad = !!(await p.$('.pad')); const hasFab = !!(await p.$('.fabrics')); const acts = await p.$$('.actions .btn'); const txt = await bubble(); const u = await unit();
    if (hasPad) { // read the expected answer from the game state: the red line value or the drafting answer
      const ans = await p.evaluate(() => window.__answer); await snap('pad'); console.log('pad for', txt.slice(0, 80), '→', ans); await typeNum(ans != null ? ans : 10); continue; }
    if (hasFab) { await snap('fabric'); await p.click('.fabrics button:nth-child(2)'); continue; }
    if (geo && geo.kind === 'tape' && !(await p.evaluate(() => window.__done))) { await snap('tape'); const [cx, cy] = toPx(u, geo.cx, geo.y); const rx = geo.rx * u.u, ry = geo.ry * u.u; await p.mouse.move(cx - rx, cy); await p.mouse.down(); for (let i = 1; i <= 40; i++) { const th = Math.PI + i / 40 * Math.PI * 2; await p.mouse.move(cx + rx * Math.cos(th), cy + ry * Math.sin(th)); await p.waitForTimeout(12); } await p.mouse.up(); await p.evaluate(() => { window.__done = true; }); await p.waitForTimeout(700); await snap('tape_closed'); continue; }
    if (geo && geo.kind === 'ruler' && !(await p.evaluate(() => window.__done))) { await snap('ruler'); const [x, y0] = toPx(u, geo.x + 2, geo.y0 + 5); const [, yW] = toPx(u, 0, geo.yW + 5); await p.mouse.move(x, y0); await p.mouse.down(); await p.mouse.move(x, (y0 + yW) / 2); await p.mouse.move(x, yW + 1); await p.mouse.up(); await p.evaluate(() => { window.__done = true; }); await p.waitForTimeout(700); await snap('ruler_set'); continue; }
    if (geo && geo.kind === 'chalk' && !(await p.evaluate(() => window.__done))) { await snap('cut'); const [x0, yc] = toPx(u, geo.x0 - 0, geo.y - 4); const X = u.x + (geo.x0 + geo.target * geo.pxcm) * u.u; await p.mouse.move(x0, yc); await p.mouse.down(); await p.mouse.move((x0 + X) / 2, yc); await p.mouse.move(X, yc); await p.mouse.up(); await p.waitForTimeout(400); await snap('chalked'); await clickBtn(''); await p.waitForTimeout(400);
      const [sx, sy] = toPx(u, geo.x0 + geo.target * geo.pxcm, geo.y - 6.5); await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(sx, sy + i * (geo.h + 11) * u.u / 10); await p.waitForTimeout(10); } await p.mouse.up(); await p.evaluate(() => { window.__done = true; }); await p.waitForTimeout(1200); await snap('cut_done'); continue; }
    if (geo && geo.kind === 'compass' && !(await p.evaluate(() => window.__done))) { await snap('compass'); const [kx, ky] = toPx(u, geo.px + 2 * geo.pxcm, geo.py); const X = u.x + (geo.px + geo.r * geo.pxcm) * u.u; await p.mouse.move(kx, ky); await p.mouse.down(); await p.mouse.move((kx + X) / 2, ky); await p.mouse.move(X, ky); await p.mouse.up(); await p.waitForTimeout(1200); const [fx, fy] = toPx(u, geo.px + geo.r * geo.pxcm + 1, geo.y + geo.h / 2); await p.mouse.click(fx, fy); await p.waitForTimeout(500); await snap('circle');
      const R = geo.r * geo.pxcm * u.u, cx = u.x + (geo.px + geo.r * geo.pxcm + 1) * u.u, cy = u.y + (geo.y + geo.h / 2) * u.u; await p.mouse.move(cx + R, cy); await p.mouse.down(); for (let i = 1; i <= 36; i++) { const a = i / 36 * Math.PI * 2; await p.mouse.move(cx + R * Math.cos(a), cy + R * Math.sin(a)); await p.waitForTimeout(10); } await p.mouse.up(); await p.evaluate(() => { window.__done = true; }); await p.waitForTimeout(1200); await snap('circle_cut'); continue; }
    if (acts.length) { await snap('act'); const labels = []; for (const a of acts) labels.push(await a.textContent()); console.log('actions:', labels.join(' | '), '::', txt.slice(0, 100)); await p.evaluate(() => { window.__done = false; window.__geo = null; }); await acts[0].click(); if (labels.join().includes('הלקוח הבא') || labels.join().includes('Next client')) { await p.waitForTimeout(1500); await snap('end'); break; } continue; }
    await p.evaluate(() => { window.__done = false; }); }
  const S = await p.evaluate(() => window.AT.S); console.log({ coins: S.coins, rep: S.rep, day: S.day, wardrobe: S.wardrobe.length, errs }); await b.close();
})();
