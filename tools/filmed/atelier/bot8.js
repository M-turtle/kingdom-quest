/* plays one client of the Atelier v8; usage: SEEN=<n: 0 girl, 1 teddy, 2 princess, 3 fox> VW=<width> VH=<height> node bot8.js <age> <lang> <outdir> [url] [mistake] */
const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const age = +(process.argv[2] || 6), lang = process.argv[3] || 'he', out = process.argv[4] || '.', url = process.argv[5] || 'http://localhost:4420/atelier/index.html', mistake = process.argv[6] === 'mistake';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: +(process.env.VW || 1440), height: +(process.env.VH || 900) } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.evaluate(([l, seen]) => { localStorage.clear(); localStorage.setItem('kq_atelier_v5', JSON.stringify({ lang: l, name: 'Bot', age: 6, coins: 10, rep: 0, day: 1, wardrobe: [], seen, taught: {} })); }, [lang, +(process.env.SEEN || 0)]); await p.reload(); await p.waitForTimeout(900);
  let n = 0; const snap = async tag => p.screenshot({ path: `${out}/s${String(n++).padStart(3, '0')}_${tag}.png` });
  const st = async () => p.$eval('#stage', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, u: r.height / 100 }; });
  const P = (s, q) => [s.x + q.x * s.u, s.y + q.y * s.u];
  const dragPath = async pts => { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (const q of pts.slice(1)) { await p.mouse.move(q[0], q[1]); await p.waitForTimeout(8); } await p.mouse.up(); };
  const line = (a, c, k) => { const pts = []; for (let i = 0; i <= k; i++) pts.push([a[0] + (c[0] - a[0]) * i / k, a[1] + (c[1] - a[1]) * i / k]); return pts; };
  const bubble = async () => (await p.$('.bubble')) ? (await p.$eval('.bubble', e => e.textContent)) : '';
  await p.click(`.sheet .row button:text-is("${age >= 15 ? '15+' : age}")`); await p.click('.sheet .btn'); await p.waitForTimeout(1500); await snap('shop');
  await p.click('.actions .btn'); await p.waitForTimeout(1800); await snap('client');
  let mistakeLeft = mistake ? 1 : 0, fixes = 0;
  for (let step = 0; step < 600; step++) {
    await p.waitForTimeout(300); const s = await st();
    if (await p.$('.picker')) { await snap('picker'); await p.click('.picker .cols button:nth-child(' + (1 + (n % 8)) + ')'); await p.waitForTimeout(120); await p.click('.picker .kinds button:nth-child(' + (2 + (n % 7)) + ')'); await p.waitForTimeout(150); await snap('picker_set'); await p.click('.picker .btn'); continue; }
    if (await p.$('.pad')) { const ans = await p.evaluate(() => window.__answer); await p.waitForTimeout(1600); await snap('read'); for (const ch of String(ans)) await p.click(`.pad .keys button:text-is("${ch}")`); await p.click('.pad .keys .go'); await p.waitForTimeout(400); continue; }
    const g = await p.evaluate(() => window.__geo && !window.__geo.done ? window.__geo : null);
    if (g) { await p.evaluate(() => { window.__geo.done = true; });
      if (g.kind === 'tape') { await snap('tape'); const pts = []; for (let i = 0; i <= 48; i++) { const th = Math.PI + i / 48 * Math.PI * 2.02; pts.push(P(s, { x: g.c.x + g.rx * Math.cos(th), y: g.c.y + g.ry * Math.sin(th) })); } await dragPath(pts); await p.waitForTimeout(900); }
      else if (g.kind === 'round') { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push(P(s, { x: g.c.x + g.R * Math.cos(a), y: g.c.y + g.R * Math.sin(a) })); } await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (let i = 1; i < pts.length; i++) { await p.mouse.move(pts[i][0], pts[i][1]); await p.waitForTimeout(8); if (i === 15) await snap('swing'); } await p.mouse.up(); await p.waitForTimeout(1200); await snap('round_cut'); }
      else if (g.kind === 'drag' && !g.fine) { let to = Object.assign({}, g.to); if (g.mark && mistakeLeft) { to.x += 2 * g.pxcm; mistakeLeft = 0; } await dragPath(line(P(s, g.from), P(s, to), g.steps || 8)); await p.waitForTimeout(600); await snap('drag'); }
      else if (g.kind === 'drag' && g.fine) { await snap('closeup'); }
      continue; }
    const acts = await p.$$('.actions .btn'); if (acts.length) { const labels = []; for (const a of acts) labels.push((await a.textContent()).trim()); const txt = await bubble(); await p.waitForTimeout(1600); await snap('act');
      console.log('[' + labels.join(' | ') + '] ' + txt.slice(0, 120));
      if (/צלצלו|Ring/.test(labels[0])) break; if (/לתקן|Fix/.test(labels[0])) fixes++;
      await acts[0].click(); continue; }
  }
  const S = await p.evaluate(() => window.AT.S); await p.click('.hud .btn.ghost'); await p.waitForTimeout(800); await snap('wardrobe');
  console.log(JSON.stringify({ coins: S.coins, rep: S.rep, day: S.day, wardrobe: S.wardrobe.length, fixes, taught: S.taught, errs })); await b.close();
})();
