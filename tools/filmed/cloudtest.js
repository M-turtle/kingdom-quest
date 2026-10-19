const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4418);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] });
  const open = async ctx => { const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('PAGEERR', e.message)); await pg.goto('http://localhost:4418/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 }); await pg.waitForFunction(() => window.KQ && document.getElementById('langRow'), null, { timeout: 60000 }); await pg.waitForTimeout(2500); return pg; };
  // device A: make a player, play a round
  const A = await b.newContext({ locale: 'en-US' }); const a = await open(A);
  const key = await a.evaluate(async () => { const p = KQ.profiles.add({ name: 'Lily E', avatar: 'h:wizard', age: 6, lang: 'he', pics: ['moon'] }); KQ.profiles.setActive(p.id); KQ.store.record('math', { stars: 3, points: 120, correct: 10, total: 10, mode: 'add', level: 2, label: 'test round' }); const ok = await KQ.cloud.push(p.id); return { key: p.key, pushed: ok, results: KQ.store.results(p.id).length, lang: p.lang }; });
  console.log('A made Lily:', JSON.stringify(key));
  // device B: a fresh browser, "I already have a player" with the key
  const B = await b.newContext({ locale: 'en-US' }); const bp = await open(B);
  await bp.waitForFunction(() => [...document.querySelectorAll('#profiles *')].some(x => /add a player|הוספ|להוסיף/i.test(x.textContent)), null, { timeout: 30000 }); await bp.evaluate(() => { [...document.querySelectorAll('#profiles *')].find(x => x.children.length < 3 && /add a player|הוספ|להוסיף/i.test(x.textContent)).click(); }); await bp.waitForTimeout(300);
  await bp.click('#btnHaveKey'); await bp.fill('#keyName', 'lily e.'); await bp.click('#picGrid2 button[data-pic="moon"]'); await bp.click('#btnKeyGo'); await bp.waitForTimeout(4000);
  console.log('B after key:', JSON.stringify(await bp.evaluate(() => { const p = KQ.profiles.active(); return p ? { name: p.name, avatar: p.avatar, age: p.age, lang: p.lang, uiLang: document.documentElement.lang, results: KQ.store.results(p.id).length, overlayHidden: document.getElementById('addOverlay').hidden } : 'NO PROFILE'; })));
  // B plays a round; the automatic push runs 3 s after the change
  await bp.evaluate(() => { KQ.store.record('reading', { stars: 2, points: 60, correct: 7, total: 10, mode: 'findLetter', level: 1, label: 'from B' }); }); await bp.waitForTimeout(6000);
  // A reopens the hub: the newer save is pulled
  const a2 = await open(A); await a2.waitForTimeout(3000);
  console.log('A after reload:', JSON.stringify(await a2.evaluate(() => { const p = KQ.profiles.active(); return { name: p.name, results: KQ.store.results(p.id).map(r => r.label).join(' + ') }; })));
  await b.close(); srv.close(); })();
