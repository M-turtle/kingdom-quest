const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => { const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
  const ev = []; p.on('request', r => { if (r.url().includes('kq-relay')) ev.push(['req', r.method()]); }); p.on('requestfailed', r => ev.push(['fail', r.failure() && r.failure().errorText])); p.on('console', m => ev.push(['con', m.text().slice(0, 120)]));
  await p.goto(process.argv[2]); await p.waitForTimeout(800);
  const r = await p.evaluate(async () => { try { const x = await fetch('https://elnmuuymfmlwnsynzgrh.supabase.co/functions/v1/kq-relay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'שלום', lang: 'he', persona: 'mommy' }) }); return [x.status, x.headers.get('content-type')]; } catch (e) { return 'ERR ' + e; } });
  const bub = await p.evaluate(() => { const s = document.querySelector('.bubble .spk'); return s ? getComputedStyle(s).pointerEvents : 'no spk'; });
  console.log({ r, bub, ev }); await b.close(); })();
