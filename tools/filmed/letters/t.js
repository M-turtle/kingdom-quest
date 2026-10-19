const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') { fs.readFile(path.join(__dirname, 'letter-mountain.html'), (e, d) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">' + d); }); return; } fs.readFile(path.join(__dirname, p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4399);
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 900, height: 1000 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('requestfailed', q => errs.push('REQFAIL ' + q.url()));
  await pg.goto('http://localhost:4399/'); await pg.waitForTimeout(900); await pg.screenshot({ path: 's_home_he.png' });
  // clips resolve for every letter/name/word in both languages
  console.log('clips ok:', await pg.evaluate(() => { const W = KQ_WORDS, EN = KQ_VOICES_EN.clips, HE = KQ_VOICES_HE.clips; const miss = []; for (const l of W.he.letters) { if (!HE[W.he.letterName(l)]) miss.push(l); } for (const f of Object.values(W.he.finals)) if (!HE[f]) miss.push(f); for (const l of W.en.letters) { if (!EN[l] || !EN[l.toLowerCase()]) miss.push(l); } for (const w of W.he.words) if (!HE[w[0]]) miss.push(w[0]); for (const w of W.en.words) if (!EN[w[0]]) miss.push(w[0]); return miss.length ? 'MISSING ' + miss.join(',') : 'all'; }));
  console.log('icons ok:', await pg.evaluate(() => { const miss = KQ_WORDS.he.words.concat(KQ_WORDS.en.words).map(w => w[1]).filter(p => !KQIcons.icon(p)); return miss.length ? 'MISSING ' + miss.join(' ') : 'all painted'; }));
  await pg.click('.camp:nth-of-type(1)'); await pg.waitForTimeout(300); await pg.screenshot({ path: 's_camp.png' });
  // GAME 1: answer by reading the hidden current letter via test hook? no hook: use the hint — click wrong first, then the pulsing card
  await pg.click('.gbtn:nth-child(1)'); await pg.waitForTimeout(600); await pg.screenshot({ path: 's_hear.png' });
  for (let q = 0; q < 8; q++) { const cards = await pg.$$('.lcard'); await cards[0].click(); await pg.waitForTimeout(500); const hint = await pg.$('.lcard.hint'); if (hint) { await hint.click(); } await pg.waitForTimeout(1000); }
  await pg.waitForTimeout(600); console.log('hear done:', await pg.$eval('.cheer h2', e => e.textContent).catch(() => 'NO CHEER'));
  await pg.click('.cheer .btn.ghost'); await pg.waitForTimeout(300); await pg.click('.camp:nth-of-type(1)'); await pg.waitForTimeout(300);
  // GAME 2: first letter — pick the card whose letter matches the spoken word's first letter (read the picture alt via dataset)
  await pg.click('.gbtn:nth-child(2)'); await pg.waitForTimeout(600); await pg.screenshot({ path: 's_first.png' });
  for (let q = 0; q < 8; q++) { const ok = await pg.evaluate(() => { const word = document.querySelector('.pic').dataset.word; const w = KQ_WORDS[document.documentElement.lang].words.find(x => x[0] === word); if (!w) return 'noword:' + emo; const first = document.documentElement.lang === 'he' ? w[0][0] : w[0][0].toUpperCase(); const c = [...document.querySelectorAll('.lcard')].find(x => x.textContent === first); if (!c) return 'nocard:' + first; c.click(); return 'ok'; }); if (ok !== 'ok') { console.log('first q', q, ok); } await pg.waitForTimeout(1700); }
  await pg.waitForTimeout(500); console.log('first done:', await pg.$eval('.cheer h2', e => e.textContent).catch(() => 'NO CHEER'));
  await pg.click('.cheer .btn.ghost'); await pg.waitForTimeout(300); await pg.click('.camp:nth-of-type(1)'); await pg.waitForTimeout(300);
  // GAME 3: pairs — brute force by reading backs
  await pg.click('.gbtn:nth-child(3)'); await pg.waitForTimeout(500); await pg.screenshot({ path: 's_pairs.png' });
  const n = await pg.$$eval('.pc', a => a.length); const backs = await pg.$$eval('.pc .b', a => a.map(e => e.textContent)); console.log('pairs cards', n, JSON.stringify(backs));
  // pair up by matching rule: same letter (upper/lower), letter/final, or letter/picture — simplest: try all pairs
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (await pg.$('.cheer')) break; const done = await pg.$$eval('.pc', a => a.map(e => e.classList.contains('done'))); if (done[i] || done[j]) continue; const cs = await pg.$$('.pc'); if (!cs[i] || !cs[j]) break; await cs[i].click(); await cs[j].click(); await pg.waitForTimeout(1250); }
  await pg.waitForTimeout(900); console.log('pairs done:', await pg.$eval('.cheer h2', e => e.textContent).catch(() => 'NO CHEER'), 'done cards', await pg.$$eval('.pc.done', a => a.length).catch(() => 'cheer shown'));
  // English pass of game 1 + camp unlocking
  await pg.click('.cheer .btn.ghost').catch(() => {}); await pg.waitForTimeout(300); await pg.click('button.chip:has-text("English")'); await pg.waitForTimeout(400); await pg.screenshot({ path: 's_home_en.png' });
  console.log('en camps open:', await pg.$$eval('.camp', a => a.map(c => !c.disabled).join(','))); await pg.evaluate(() => __letters.learn(0)); await pg.waitForTimeout(200); console.log('after camp 1 known:', await pg.$$eval('.camp', a => a.map(c => !c.disabled).join(',')));
  await pg.click('.camp:nth-of-type(2)'); await pg.click('.gbtn:nth-child(3)'); await pg.waitForTimeout(400); console.log('en pairs backs:', JSON.stringify(await pg.$$eval('.pc .b', a => a.map(e => e.textContent))));
  await pg.setViewportSize({ width: 390, height: 844 }); await pg.goto('http://localhost:4399/'); await pg.waitForTimeout(600); await pg.screenshot({ path: 's_home_m.png', fullPage: true }); console.log('overflow', await pg.evaluate(() => document.documentElement.scrollWidth));
  console.log('ERRS', errs.slice(0, 5)); await b.close(); srv.close(); })();
