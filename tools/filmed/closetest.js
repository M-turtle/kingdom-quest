const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4409);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] });
  for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['ipad', { width: 1024, height: 768 }]]) for (const style of ['plush', 'voxel', 'nature', 'today']) {
    const pg = await b.newPage({ viewport: vp, locale: 'he-IL' }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/supabase|relay|fetch/i.test(m.text())) errs.push(m.text().slice(0, 120)); });
    await pg.goto('http://localhost:4409/index.html?style=' + style, { waitUntil: 'domcontentloaded', timeout: 90000 }); await pg.waitForFunction(() => window.KQ, null, { timeout: 60000 }); await pg.waitForTimeout(1500);
    const has = await pg.evaluate(() => !!KQ.profiles.active()); if (!has) { await pg.evaluate(() => { const p = KQ.profiles.add({ name: 'נועה א', avatar: 'h:knight', age: 7, lang: 'he' }); KQ.profiles.setActive(p.id); }); await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForFunction(() => window.KQ, null, { timeout: 60000 }); }
    await pg.waitForTimeout(1200); await pg.evaluate(() => { const o = document.getElementById('filmOverlay'); if (o && !o.hidden) o.click(); }); await pg.waitForTimeout(1000);
    if (style !== 'today') await pg.waitForFunction(() => window.__styleTest && window.__styleTest.placed.length === 3, null, { timeout: 90000 }).catch(() => {});
    const flew = await pg.evaluate(() => { try { return window.__styleFly('math'); } catch (e) { return 'err ' + e.message; } }); await pg.waitForTimeout(2600); await pg.evaluate(() => { document.querySelectorAll('.label').forEach(l => l.style.opacity = '0'); });
    const st = await pg.evaluate(() => window.__styleTest || null); const fps = await pg.evaluate(() => new Promise(r => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else r(Math.round(n / 2)); }; requestAnimationFrame(f); }));
    await pg.screenshot({ path: `close_${name}_${style}.png` }); console.log(name, style, 'flew:', flew, 'placed:', st && st.placed.join(','), '| fps:', fps, '| errs:', errs.slice(0, 3).join(' | ')); await pg.close(); }
  await b.close(); srv.close(); })();
