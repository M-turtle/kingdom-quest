const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4407);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] }); const pg = await b.newPage({ locale: 'en-US' }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' @' + (e.stack || '').split('\n')[1]));
  await pg.goto('http://localhost:4407/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 }); await pg.waitForFunction(() => window.KQ, null, { timeout: 60000 }); await pg.waitForTimeout(3000);
  console.log('profiles box:', await pg.$eval('#profiles', e => e.textContent.replace(/\s+/g, ' ').slice(0, 80)).catch(() => 'none'), '| addOverlay hidden:', await pg.$eval('#addOverlay', e => e.hidden));
  console.log(errs.slice(0, 5)); await b.close(); srv.close(); })();
