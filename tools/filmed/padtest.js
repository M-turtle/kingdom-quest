const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4406);
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 900 } });
  await pg.goto('http://localhost:4406/math/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 }); await pg.waitForFunction(() => window.KQ, null, { timeout: 60000 });
  await pg.evaluate(() => { document.documentElement.setAttribute('dir', 'rtl'); document.documentElement.setAttribute('lang', 'he'); let np = document.getElementById('numpad'); if (!np) { np = document.createElement('div'); np.className = 'numpad'; np.id = 'numpad'; document.body.appendChild(np); } np.hidden = false; if (!np.children.length) for (const k of ['1','2','3','4','5','6','7','8','9','/','0','.']) { const x = document.createElement('button'); x.textContent = k; np.appendChild(x); } });
  await pg.waitForTimeout(200); console.log('row 1 left→right:', await pg.$$eval('#numpad button', bs => bs.slice(0, 3).map(x => [x.textContent, Math.round(x.getBoundingClientRect().left)]).sort((a, c) => a[1] - c[1]).map(x => x[0]).join(' ')));
  await b.close(); srv.close(); })();
