const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core'); const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname; const types = { '.html': 'text/html', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]) === '/' ? '/viewer_unlit.html' : decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(4408);
(async () => { const b = await chromium.launch({ args: ['--use-angle=metal'] }); const pg = await b.newPage({ viewport: { width: 900, height: 600 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto('http://localhost:4408/', { waitUntil: 'load' }); await pg.waitForFunction(() => window.__ready, null, { timeout: 120000 }); await pg.waitForTimeout(500);
  console.log('triangles:', await pg.evaluate(() => window.__tris));
  for (const a of [0, 60, 135, 200, 270]) { const d = await pg.evaluate(a => window.__shot(a), a); fs.writeFileSync(`unlit_${a}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
  console.log('ERRS', errs); await b.close(); srv.close(); })();
