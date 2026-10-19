const { execFileSync } = require('child_process'); const fs = require('fs');
const key = () => execFileSync('security', ['find-generic-password', '-a', process.env.USER, '-s', 'fal-api', '-w'], { encoding: 'utf8' }).trim();
const H = () => ({ Authorization: 'Key ' + key(), 'Content-Type': 'application/json' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uri = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
async function call(url, init) { const r = await fetch(url, init); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {} if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 300)); return j; }
(async () => {
  const body = { front_image_url: uri('view_front.png'), back_image_url: uri('view_back.png'), left_image_url: uri('view_left.png'), right_image_url: uri('view_right.png'), textured_mesh: true, octree_resolution: 384, num_inference_steps: 50 };
  const q = await call('https://queue.fal.run/fal-ai/hunyuan3d/v2/multi-view', { method: 'POST', headers: H(), body: JSON.stringify(body) });
  console.log('queued', q.request_id); const t0 = Date.now();
  while (true) { await sleep(8000); const s = await call(q.status_url, { headers: H() }); if (s.status === 'COMPLETED') break; if (s.status === 'FAILED') throw new Error('failed ' + JSON.stringify(s).slice(0, 300)); if (Date.now() - t0 > 900000) throw new Error('timeout'); }
  const out = await call(q.response_url, { headers: H() }); console.log(JSON.stringify(out).slice(0, 600));
  const m = out.model_mesh || out.model_glb || out.mesh; const url = m && m.url; if (!url) throw new Error('no mesh url');
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer()); fs.writeFileSync('bear.glb', buf); console.log('saved bear.glb', buf.length, 'in', Math.round((Date.now() - t0) / 1000), 's');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
