/* plays one client of the Atelier v2 with real pointer events; usage: node bot2.js <age> <lang> <outdir> [url] [mistake] */
const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const age = +(process.argv[2] || 6), lang = process.argv[3] || 'he', out = process.argv[4] || '.', url = process.argv[5] || 'http://localhost:4420/atelier/index.html', mistake = process.argv[6] === 'mistake';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.evaluate(l => { localStorage.clear(); localStorage.setItem('kq_atelier_v3', JSON.stringify({ lang: l, name: 'Bot', age: 6, coins: 12, rep: 0, day: 1, wardrobe: [], seen: 0 })); }, lang); await p.reload(); await p.waitForTimeout(900);
  let n = 0; const snap = async tag => p.screenshot({ path: `${out}/s${String(n++).padStart(3, '0')}_${tag}.png` });
  const st = async () => p.$eval('#stage', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, u: r.height / 100 }; });
  const P = (s, q) => [s.x + q.x * s.u, s.y + q.y * s.u];
  const dragPath = async (pts) => { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (const q of pts.slice(1)) { await p.mouse.move(q[0], q[1]); await p.waitForTimeout(8); } await p.mouse.up(); };
  const bubble = async () => (await p.$('.bubble')) ? (await p.$eval('.bubble', e => e.textContent)) : '';
  await snap('start'); await p.click(`.sheet .row button:text-is("${age >= 15 ? '15+' : age}")`); await p.click('.sheet .btn'); await p.waitForTimeout(1500); await snap('shop');
  await p.click('.actions .btn'); await p.waitForTimeout(1800); await snap('client');
  let fixes = 0, mistakeDone = false;
  for (let step = 0; step < 400; step++) {
    await p.waitForTimeout(350); const s = await st();
    if (await p.$('.picker')) { await snap('picker'); await p.click('.picker .cols button:nth-child(' + (2 + (n % 5)) + ')'); await p.waitForTimeout(150); await p.click('.picker .kinds button:nth-child(' + (2 + (n % 6)) + ')'); await p.waitForTimeout(150); await snap('picker_set'); await p.click('.picker .btn'); continue; }
    if (await p.$('.pad')) { const ans = await p.evaluate(() => window.__answer); await snap('pad'); const txt = String(ans); for (const ch of txt) await p.click(`.pad .keys button:text-is("${ch}")`); await p.click('.pad .keys .go'); await p.waitForTimeout(500); continue; }
    const g = await p.evaluate(() => window.__geo && !window.__geo.done ? window.__geo : null);
    if (g) { await p.evaluate(() => { window.__geo.done = true; }); const tgt = await p.evaluate(() => window.__target);
      if (g.kind === 'tape') { await snap('tape'); const pts = []; for (let i = 0; i <= 48; i++) { const th = Math.PI + i / 48 * Math.PI * 2.02; pts.push(P(s, { x: g.c.x + g.rx * Math.cos(th), y: g.c.y + g.ry * Math.sin(th) })); } await dragPath(pts); await p.waitForTimeout(900); await snap('tape_read'); }
      else if (g.kind === 'rulerV' || g.kind === 'rulerH') { await snap(g.kind); const a = P(s, g.grab), c = P(s, g.to); await dragPath([a, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], c]); await p.waitForTimeout(1100); await snap(g.kind + '_read'); }
      else if (g.kind === 'chalk') { let target = tgt; if (mistake && !mistakeDone) { target = tgt + (age <= 6 ? 2 : 1); mistakeDone = true; } const a = P(s, g.from), c = P(s, { x: g.x0 + target * g.pxcm, y: g.y }); await dragPath([a, [(a[0] + c[0]) / 2, a[1]], c]); await p.waitForTimeout(300); await snap('chalked'); }
      else if (g.kind === 'scissors') { const a = P(s, g.from), c = P(s, g.to); const pts = []; for (let i = 0; i <= 10; i++) pts.push([a[0], a[1] + (c[1] - a[1]) * i / 10]); await dragPath(pts); await p.waitForTimeout(1300); await snap('cut'); }
      else if (g.kind === 'compass') { const a = P(s, g.from), c = P(s, { x: g.x0 + tgt * g.pxcm, y: g.y }); await dragPath([a, [(a[0] + c[0]) / 2, a[1]], c]); await p.waitForTimeout(300); await snap('compass'); }
      else if (g.kind === 'fold') { await snap('fold'); const a = P(s, g.grab), c = P(s, g.to); const pts = []; for (let i = 0; i <= 12; i++) pts.push([a[0] + (c[0] - a[0]) * i / 12, a[1]]); await dragPath(pts); await p.waitForTimeout(500); await snap('folded'); }
      else if (g.kind === 'tapDraw') { const a = P(s, g.at); await p.mouse.click(a[0], a[1]); await p.waitForTimeout(400); }
      else if (g.kind === 'scissorsRound') { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push(P(s, { x: g.c.x + g.R * Math.cos(a), y: g.c.y + g.R * Math.sin(a) })); } await dragPath(pts); await p.waitForTimeout(1300); await snap('circle_cut'); }
      continue; }
    const acts = await p.$$('.actions .btn'); if (acts.length) { const labels = []; for (const a of acts) labels.push((await a.textContent()).trim()); const txt = await bubble(); await snap('act');
      console.log('[' + labels.join(' | ') + '] ' + txt.slice(0, 140));
      if (/צלצלו|Ring/.test(labels[0])) break;
      if (labels.length > 1 && /לתקן|Fix/.test(labels[0])) fixes++;
      await acts[0].click(); continue; }
  }
  const S = await p.evaluate(() => window.AT.S); await p.click('.hud .btn.ghost'); await p.waitForTimeout(600); await snap('wardrobe');
  console.log(JSON.stringify({ coins: S.coins, rep: S.rep, day: S.day, wardrobe: S.wardrobe.length, fixes, errs })); await b.close();
})();
