const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4401);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] }); const pg = await b.newPage({ viewport: { width: 1100, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/favicon|he\.mp3|en\.mp3/i.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await pg.goto('http://localhost:4401/index.html'); await pg.waitForFunction(() => window.KQ && document.getElementById('gsearch'), null, { timeout: 40000 }); await pg.waitForTimeout(1500);
  // a player with an age, so worlds open
  await pg.evaluate(() => { const p = KQ.profiles.add({ name: 'Lily E', avatar: '🦁', age: 5 }); KQ.profiles.setActive(p.id); }); await pg.reload(); await pg.waitForFunction(() => window.KQ && document.getElementById('gsearch'), null, { timeout: 40000 }); await pg.waitForTimeout(2500);
  console.log('world cards:', await pg.$$eval('[data-world]', a => a.map(e => e.dataset.world).filter((v, i, A) => A.indexOf(v) === i).join(',')));
  console.log('letters card icon painted:', await pg.evaluate(() => { const c = [...document.querySelectorAll('[data-world="letters"]')][0]; const card = c && c.closest('.world, .card, li, div'); return !!(card && card.querySelector('.kq-i')); }), '| 3D label:', await pg.evaluate(() => [...document.querySelectorAll('.label')].some(l => /Letter Mountain|הר האותיות/.test(l.textContent))));
  const search = async q => { await pg.fill('#gsearch', ''); await pg.type('#gsearch', q); await pg.waitForTimeout(200); return pg.$$eval('#gresults button', a => a.map(e => e.textContent.trim()).slice(0, 8)); };
  console.log('search "letter":', JSON.stringify(await search('letter')));
  console.log('search "math":', (await search('math')).length, 'hits, first:', JSON.stringify((await search('math')).slice(0, 3)));
  console.log('search "pirate":', JSON.stringify((await search('pirate')).slice(0, 3)));
  await pg.evaluate(() => KQ.i18n.set ? KQ.i18n.set('he') : null); await pg.waitForTimeout(400); console.log('search "חשבון":', JSON.stringify((await search('חשבון')).slice(0, 3)), '| "אותיות":', JSON.stringify((await search('אותיות')).slice(0, 3)));
  await pg.evaluate(() => KQ.i18n.set ? KQ.i18n.set('en') : null); await pg.waitForTimeout(300);
  // click a math game from the search → math opens that round
  await search('Percent'); await pg.click('#gresults button'); await pg.waitForFunction(() => location.pathname.includes('/math/'), null, { timeout: 20000 }); await pg.waitForTimeout(2500);
  console.log('math via search:', location = await pg.evaluate(() => location.search), '| round open:', await pg.$eval('#round', e => !e.hidden), '| skill:', await pg.$eval('#skillName', e => e.textContent).catch(() => '?'));
  // Letter Mountain inside the kingdom
  await pg.goto('http://localhost:4401/letters/index.html'); await pg.waitForFunction(() => window.__letters, null, { timeout: 40000 }); await pg.waitForTimeout(800);
  console.log('letters header:', await pg.$eval('.kq-header', e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)), '| camps:', await pg.$$eval('.lm-camp', a => a.length), '| open:', await pg.$$eval('.lm-camp', a => a.map(c => !c.disabled).join(',')));
  await pg.screenshot({ path: 'kq_letters_home.png' });
  await pg.click('.lm-camp:nth-of-type(1)'); await pg.waitForTimeout(300); await pg.click('.lm-gbtn:nth-child(1)'); await pg.waitForTimeout(600);
  for (let q = 0; q < 8; q++) { const cards = await pg.$$('#round .lm-lcard'); await cards[0].click(); await pg.waitForTimeout(500); const hint = await pg.$('#round .lm-lcard.lm-hint'); if (hint) await hint.click(); await pg.waitForTimeout(1000); }
  await pg.waitForTimeout(700); console.log('hear done:', await pg.$eval('.lm-cheer h2', e => e.textContent).catch(() => 'NO CHEER'), '| recorded:', await pg.evaluate(() => KQ.store.results(KQ.profiles.active().id).filter(r => r.world === 'letters').length));
  await pg.goto('http://localhost:4401/letters/index.html?skill=first'); await pg.waitForFunction(() => window.__letters, null, { timeout: 40000 }); await pg.waitForTimeout(800); console.log('?skill=first opens game:', await pg.$eval('#round', e => !e.hidden), await pg.$eval('#round .pill', e => e.textContent).catch(() => ''));
  await pg.screenshot({ path: 'kq_letters_first.png' });
  console.log('ERRS', errs.slice(0, 6)); await b.close(); srv.close(); })();
