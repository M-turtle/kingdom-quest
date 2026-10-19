const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4400);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] }); const pg = await b.newPage({ viewport: { width: 1100, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/favicon|three/i.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await pg.goto('http://localhost:4400/index.html'); await pg.waitForFunction(() => window.KQ && document.getElementById('ageRow'), null, { timeout: 40000 }); await pg.waitForTimeout(1500);
  // 1. add a player: without an age → refused; with age 7 → saved with age
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /add a player|הוספת/i.test(x.textContent)); if (b) b.click(); }); await pg.waitForTimeout(400);
  console.log('add overlay open:', await pg.$eval('#addOverlay', e => !e.hidden), 'age buttons:', await pg.$$eval('#ageRow button', a => a.length));
  await pg.fill('#pname', 'Noa E'); await pg.click('#mxA button'); await pg.click('#mxB button'); await pg.click('#btnSave'); await pg.waitForTimeout(400);
  console.log('saved without age?', await pg.evaluate(() => KQ.profiles.list().length), '(expect 0)');
  await pg.click('#ageRow button:nth-child(4)'); await pg.click('#btnSave'); await pg.waitForTimeout(600);
  console.log('profiles:', JSON.stringify(await pg.evaluate(() => KQ.profiles.list().map(p => ({ n: p.name, age: p.age })))));
  console.log('math band for age 7:', await pg.evaluate(() => KQ.ladder.band(KQ.profiles.active().id, 'math', [1, 2, 3, 4, 5, 6])), '(expect 2)', 'reading:', await pg.evaluate(() => KQ.ladder.band(KQ.profiles.active().id, 'reading', [1, 2, 3])));
  // 2. an old player without an age is asked at the gate
  await pg.evaluate(() => { const p = KQ.profiles.active(); KQ.profiles.update(p.id, { age: null }); }); await pg.reload(); await pg.waitForFunction(() => window.KQ, null, { timeout: 40000 }); await pg.waitForTimeout(1500);
  console.log('age gate shown:', await pg.$eval('#ageOverlay', e => !e.hidden), '|', await pg.$eval('#ageTitle', e => e.textContent)); await pg.screenshot({ path: 'age_gate.png' });
  await pg.click('#ageRow2 button:nth-child(7)'); await pg.waitForTimeout(500); console.log('after pick: gate hidden', await pg.$eval('#ageOverlay', e => e.hidden), 'age', await pg.evaluate(() => KQ.profiles.active().age), 'math band', await pg.evaluate(() => KQ.ladder.band(KQ.profiles.active().id, 'math', [1, 2, 3, 4, 5, 6])), '(10 → 4)');
  // 3. worlds: no band tiles, a stage label instead
  for (const w of ['math', 'reading', 'logic', 'clock']) { await pg.goto('http://localhost:4400/' + w + '/index.html'); await pg.waitForFunction(() => window.KQ, null, { timeout: 40000 }); await pg.waitForTimeout(1200); console.log(w, 'tiles in #bands:', await pg.$$eval('#bands .tile', a => a.length), 'label:', await pg.$eval('#bands .bandnow', e => e.textContent).catch(() => 'NONE'), 'heading:', await pg.$eval('#pick h2', e => e.textContent).catch(() => '?')); }
  await pg.goto('http://localhost:4400/math/index.html'); await pg.waitForTimeout(1500); await pg.screenshot({ path: 'math_pick.png' });
  console.log('ERRS', errs.slice(0, 6)); await b.close(); srv.close(); })();
