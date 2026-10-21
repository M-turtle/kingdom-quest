/* plays the engine's games end to end and screenshots each step; usage: node engbot.js <base url> <outdir> [he|en] [recipe ids, comma] [WxH] [video]
   the kingdom's relay is blocked (no voice credits are spent by a test) */
const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const fs = require('fs');
const [base, out, lang = 'he', only = '', size = '1440x900', video = ''] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=metal', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext(Object.assign({ viewport: { width: W, height: H } }, video ? { recordVideo: { dir: out, size: { width: W, height: H } } } : {}));
  let relay = 0; await ctx.route(/supabase\.co|elevenlabs/, r => { relay++; r.abort(); });
  await ctx.addInitScript(l => { try { localStorage.setItem('kqe.lang', JSON.stringify(l)); } catch (e) {} }, lang);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200))); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  let n = 0; const shot = async (name, ms) => { if (ms) await pg.waitForTimeout(ms); n++; await pg.screenshot({ path: `${out}/${String(n).padStart(2, '0')}_${name}.png` }); };
  const t0 = Date.now(); await pg.goto(base + 'engine/index.html', { waitUntil: 'load' }); await pg.waitForFunction(() => window.KQE && document.querySelector('.card'), null, { timeout: 30000 }); console.log('page ready ms', Date.now() - t0);
  await shot('launcher', 1200); await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await shot('launcher_bottom', 500); await pg.evaluate(() => window.scrollTo(0, 0));
  console.log('checks', JSON.stringify(await pg.evaluate(() => KQE_RECIPES.map(r => [r.id, KQE.check(r).map(p => p.code)]).concat([['broken', KQE.check(KQE_BROKEN).map(p => p.code)]]))));
  const ids = only ? only.split(',') : await pg.evaluate(() => KQE_RECIPES.map(r => r.id));
  for (const id of ids) {
    const t1 = Date.now();
    if (id === 'broken') { await pg.evaluate(() => KQE.play(KQE_BROKEN, document.getElementById('host'), () => {})); await shot('broken_refused', 600); await pg.evaluate(() => document.querySelector('.kqe-stage').remove()); continue; }
    await pg.evaluate(id => { const r = KQE_RECIPES.find(x => x.id === id); KQE.play(r, document.getElementById('host'), () => {}); }, id);
    await shot(id + '_goal', 900); await pg.evaluate(() => __kqe.skipGoal()); await shot(id + '_start', 800);
    const action = await pg.evaluate(() => __kqe.recipe.action);
    if (action === 'swallow') {
      /* steer like a child would: the nearest thing that fits and is small enough; once big enough, the goal. One wrong swallow on purpose. */
      await pg.evaluate(() => { let wrong = 1; window.__drv = setInterval(() => { const k = __kqe && __kqe.inst; if (!k) return; const p = k.probe(); if (p.R >= p.RG) return k.steer(p.goal.x, p.goal.z);
        if (__kqe.stats.oops > 0) wrong = 0; const pool = p.items.filter(i => i.small && !i.fits); if (wrong > 0 && pool.length) { const t = pool.sort((a, b) => Math.hypot(a.x - p.pos.x, a.z - p.pos.z) - Math.hypot(b.x - p.pos.x, b.z - p.pos.z))[0]; return k.steer(t.x, t.z); }
        const ok = p.items.filter(i => i.small && i.fits).sort((a, b) => Math.hypot(a.x - p.pos.x, a.z - p.pos.z) - Math.hypot(b.x - p.pos.x, b.z - p.pos.z)); if (ok[0]) k.steer(ok[0].x, ok[0].z); }, 150); });
      let shots = 0, twistShot = false;
      for (let i = 0; i < 260; i++) { await pg.waitForTimeout(500); const s = await pg.evaluate(() => __kqe ? { done: __kqe.stats.done, p: __kqe.stats.progress, oops: __kqe.stats.oops, good: __kqe.stats.good } : { done: true });
        if (s.oops >= 1 && shots === 0) { await shot(id + '_spit'); shots++; }
        if (s.p > 0.3 && shots === 1) { await shot(id + '_growing'); shots++; }
        if (s.p >= 0.5 && !twistShot) { twistShot = true; await shot(id + '_twist', 400); }
        if (s.done) break; }
      await pg.evaluate(() => clearInterval(window.__drv));
    } else {
      /* first a wrong plan on route 1 (too many steps → a bump), then each route's own plan, clicked tile by tile */
      const press = async c => { await pg.evaluate(c => document.querySelector(`.kqe-cmds [data-cmd="${c}"]`).click(), c); await pg.waitForTimeout(150); };
      const p0 = await pg.evaluate(() => __kqe.inst.probe()); for (let i = 0; i < p0.spec.slots; i++) await press('F'); await shot(id + '_wrong_plan'); await press('run'); await shot(id + '_bump', 1500);
      await pg.waitForFunction(() => !__kqe.inst.probe().running, null, { timeout: 20000 }); for (let i = 0; i < p0.spec.slots; i++) await press('erase');
      for (let route = 0; route < 4; route++) {
        const p = await pg.evaluate(() => __kqe.inst.probe()); for (const c of p.spec.solution) await press(c); await shot(id + '_plan' + (route + 1));
        await press('run'); if (route === 0) await shot(id + '_running', 900);
        await pg.waitForFunction(r => !__kqe || __kqe.stats.done || __kqe.inst.probe().li > r, route, { timeout: 30000 });
        if (route === 1) await shot(id + '_twist', 1500);
        if (await pg.evaluate(() => __kqe.stats.done)) break; await pg.waitForTimeout(1300); }
    }
    await shot(id + '_end', 2200);
    const st = await pg.evaluate(() => __kqe ? Object.assign({}, __kqe.stats, { level: __kqe.ctx.level }) : null); console.log(id, 'secs', ((Date.now() - t1) / 1000).toFixed(0), JSON.stringify(st));
    await pg.evaluate(() => { const s = document.querySelector('.kqe-stage'); if (!s) return; const b = s.querySelector('.kqe-end .kqe-btn:last-child') || s.querySelector('.kqe-top .kqe-btn'); if (b) b.click(); }); await pg.waitForTimeout(400);
  }
  console.log('relay calls blocked', relay); console.log('ERRS', JSON.stringify(errs.slice(0, 10)));
  await ctx.close(); await b.close();
})();
