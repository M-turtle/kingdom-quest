const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4404);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] }); const pg = await b.newPage({ viewport: { width: 1100, height: 900 }, locale: 'en-US' }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const open = async () => { await pg.goto('http://localhost:4404/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 }); await pg.waitForFunction(() => window.KQ && document.getElementById('langRow'), null, { timeout: 60000 }); await pg.waitForTimeout(1200); };
  await open();
  const state = () => pg.evaluate(() => ({ ui: document.documentElement.lang, kq: KQ.i18n.lang, active: (KQ.profiles.active() || {}).name, plang: (KQ.profiles.active() || {}).lang, all: KQ.profiles.list().map(p => p.name + ':' + p.lang).join(' ') }));
  console.log('fresh device:', JSON.stringify(await state()));
  // player 1 picks Hebrew
  await pg.waitForFunction(() => [...document.querySelectorAll('#profiles *, button')].some(x => x.children.length < 3 && /add a player|הוספת|להוסיף/i.test(x.textContent)), null, { timeout: 30000 }); await pg.evaluate(() => { [...document.querySelectorAll('#profiles *, button')].find(x => x.children.length < 3 && /add a player|הוספת|להוסיף/i.test(x.textContent)).click(); }); await pg.waitForTimeout(300);
  console.log('lang buttons:', await pg.$$eval('#langRow button', a => a.map(b => b.textContent).join('|')));
  await pg.click('#langRow button:nth-child(2)'); await pg.waitForTimeout(400); console.log('after picking עברית: dialog lang', await pg.evaluate(() => document.documentElement.lang), '| name label:', await pg.$eval('label[for=pname]', e => e.textContent.slice(0, 30)), '| dialog still open:', await pg.$eval('#addOverlay', e => !e.hidden));
  await pg.fill('#pname', 'Lily E'); await pg.click('#ageRow button:nth-child(2)'); await pg.click('#mxA button'); await pg.click('#mxB button'); await pg.click('#btnSave'); await pg.waitForTimeout(600);
  console.log('player 1 saved:', JSON.stringify(await state()));
  // player 2 picks English
  await pg.waitForFunction(() => [...document.querySelectorAll('#profiles *, button')].some(x => x.children.length < 3 && /add a player|הוספת|להוסיף/i.test(x.textContent)), null, { timeout: 30000 }); await pg.evaluate(() => { [...document.querySelectorAll('#profiles *, button')].find(x => x.children.length < 3 && /add a player|הוספת|להוסיף/i.test(x.textContent)).click(); }); await pg.waitForTimeout(300); await pg.click('#langRow button:nth-child(1)'); await pg.waitForTimeout(400);
  await pg.fill('#pname', 'Ehud E'); await pg.click('#ageRow button:nth-child(6)'); await pg.click('#mxA button:nth-child(2)'); await pg.click('#mxB button:nth-child(2)'); await pg.click('#btnSave'); await pg.waitForTimeout(600);
  console.log('player 2 saved:', JSON.stringify(await state()));
  // switch back to player 1 → Hebrew follows
  await pg.evaluate(() => { const p = KQ.profiles.list().find(x => x.name.startsWith('Lily')); KQ.profiles.setActive(p.id); }); await pg.waitForTimeout(300); console.log('switched to Lily:', JSON.stringify(await state()));
  await open(); console.log('after reload:', JSON.stringify(await state()));
  // a world page follows the player
  await pg.goto('http://localhost:4404/math/index.html', { waitUntil: 'domcontentloaded' }); await pg.waitForFunction(() => window.KQ, null, { timeout: 60000 }); await pg.waitForTimeout(800); console.log('math page lang:', await pg.evaluate(() => document.documentElement.lang + ' / ' + document.title));
  // change language in the header → sticks to the player
  await open(); await pg.evaluate(() => { [...document.querySelectorAll('.langs button')].find(b => b.textContent === 'English').click(); }); await pg.waitForTimeout(400); console.log('header switch to English:', JSON.stringify(await state()));
  await open(); console.log('after reload again:', JSON.stringify(await state()));
  console.log('ERRS', errs.slice(0, 4)); await b.close(); srv.close(); })();
