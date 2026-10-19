const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'); const root = '/Users/yonieyal/kingdom-quest';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(4398);
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:4398/tools/tests/adapt_sim.html'); await pg.waitForFunction(() => window.KQ && window.simulate);
  const kids = {
    'Perfect, fast': { rounds: 14, play: (r, n) => Array.from({ length: n }, () => ({ ok: true, ms: 1500 + Math.random() * 800 })) },
    'Struggling (40% right, slow)': { rounds: 10, play: (r, n) => Array.from({ length: n }, () => ({ ok: Math.random() < 0.4, ms: 6000 + Math.random() * 4000 })) },
    'Helped (right, but hints + long pauses)': { rounds: 8, play: (r, n) => Array.from({ length: n }, (_, k) => ({ ok: true, ms: k % 2 ? 26000 : 3000, hint: k % 2 === 0 })) },
    'Improving (50% → 95%)': { rounds: 14, play: (r, n) => Array.from({ length: n }, () => ({ ok: Math.random() < Math.min(0.95, 0.5 + r * 0.05), ms: 4000 - r * 150 })) } };
  for (const [name, k] of Object.entries(kids)) { const res = await pg.evaluate(([name, rounds, fn]) => simulate({ name, rounds, band: 2, skill: 'add', bandSkills: ['add', 'sub', 'count', 'compare'], play: new Function('return ' + fn)() }), [name, k.rounds, k.play.toString()]);
    console.log('\n== ' + name); console.log('rnd band lvl→lvl  q  ok  stars tier plan        status      rate  lower occ  flags'); for (const r of res.rows) console.log(String(r.round).padStart(3), String(r.bandBefore).padStart(4) + '→' + r.band, String(r.levelBefore).padStart(3) + '→' + String(r.levelAfter).padEnd(3), String(r.questions).padStart(2), String(r.correct).padStart(3), String(r.stars).padStart(5), String(r.tierStart).padStart(4), r.planStatus.padEnd(11), r.status.padEnd(11), String(r.rate).padEnd(5), String(r.lower).padEnd(5), String(r.occasions).padStart(3), ' ', r.flags); console.log('ladder log:', JSON.stringify(res.history)); }
  console.log('\nERRS', errs); await b.close(); srv.close(); })();
