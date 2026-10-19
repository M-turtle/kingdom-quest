const { chromium, devices } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p === '/' ? '/index.html' : p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'text/html; charset=utf-8' }); r.end(d); }); }).listen(4397);
(async () => { const b = await chromium.launch();
  async function check(name, ctxOpts, prep, url) { const ctx = await b.newContext(ctxOpts); const pg = await ctx.newPage(); await pg.route(u => !u.href.startsWith('http://localhost'), r => r.abort()); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('http://localhost:4397/index.html', { waitUntil: 'domcontentloaded' }); if (prep) { await pg.evaluate(prep); await pg.goto('about:blank'); await pg.goto(url || 'http://localhost:4397/index.html', { waitUntil: 'domcontentloaded' }); }
    await pg.waitForTimeout(2500); const gate = await pg.$('.kq-devicegate'); console.log(name.padEnd(34), gate ? 'GATE: ' + await gate.innerText().then(t => t.split('\n')[0]) : 'plays normally', errs.length ? 'ERRS ' + errs[0] : '');
    if (gate) await pg.screenshot({ path: 'gate_' + name.replace(/\W+/g, '_') + '.png' }); await ctx.close(); }
  const phone = devices['iPhone 13'], tab = devices['iPad (gen 7)'];
  await check('iPad Pro 11, new', devices['iPad Pro 11'], () => localStorage.clear());
  await check('iPad Mini, new', devices['iPad Mini'], () => localStorage.clear());
  await check('Galaxy Tab S4, new', devices['Galaxy Tab S4'], () => localStorage.clear());
  await check('Pixel 7, new', devices['Pixel 7'], () => localStorage.clear());
  await check('Galaxy S9+, new', devices['Galaxy S9+'], () => localStorage.clear());
  await check('iPhone 15 Pro Max, new', devices['iPhone 15 Pro Max'], () => localStorage.clear());
  await check('desktop', { viewport: { width: 1280, height: 800 } });
  await check('iPhone, new', phone, () => localStorage.clear());
  await check('iPad, new (hebrew)', { ...tab, locale: 'he-IL' }, () => localStorage.clear());
  await check('iPhone with family profile', phone, () => { localStorage.clear(); localStorage.setItem('kq.state.v1', JSON.stringify({ profiles: [{ id: 'p1', name: 'Lily' }] })); });
  await check('iPhone with #anydevice', phone, () => localStorage.clear(), 'http://localhost:4397/index.html#anydevice');
  await b.close(); srv.close(); })();
