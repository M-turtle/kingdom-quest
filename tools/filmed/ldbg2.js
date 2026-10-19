const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4405);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] }); const pg = await b.newPage({ locale: 'en-US' }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto('http://localhost:4405/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 }); await pg.waitForFunction(() => window.KQ, null, { timeout: 60000 }); await pg.waitForTimeout(2500);
  console.log('buttons:', await pg.$$eval('button', a => a.map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 40).join(' | ')));
  console.log('btnAdd:', await pg.$('#btnAdd') ? 'yes' : 'no', '| profiles box:', await pg.$eval('#profiles', e => e.innerHTML.length).catch(() => 'none'));
  console.log(errs.slice(0, 6)); await b.close(); srv.close(); })();
