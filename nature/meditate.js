/* Kingdom Quest — the Quiet Clearing (Yoni 2026-10-04/05: 'sit at the middle of the forest in a clearing and meditate' … 'no timer, no purpose
   or end, no start: you go there, it starts. If you want to leave, the music changes and it says thank you, may all your adventures be
   peaceful. Very Zen-like … no talking: just a bit of words shown on the screen, fading in and out. Something very peaceful').
   Arriving starts it; it runs as long as the child stays. The clearing is drawn live (light shafts, swaying grass, pollen, fireflies,
   butterflies, a soft light breathing in the middle). The sound is a still, Zen soundscape made on the spot: a warm drone on an open fifth
   that swells and settles like a slow breath, singing bowls struck now and then with long, shimmering tails, sparse wind chimes, a
   quiet brook and breeze, all in a gentle reverb. Nothing falls, nothing hurries. A few calm words drift in and out. Leaving plays a last
   bowl over a warm chord and shows a thank-you before the clearing fades. API: KQMeditate.open() */
(function () {
  'use strict';
  if (!window.KQ) return;
  const { t } = KQ, el = KQ.ui.el;
  KQ.i18n.extend({
    en: { md_card: 'The Quiet Clearing', md_cardSub: 'Sit in the middle of the forest and rest for as long as you like.', md_title: 'The Quiet Clearing', md_leave: 'Leave the clearing',
      md_w: ['Breathe slowly.', 'Listen to the leaves.', 'Let your shoulders soften.', 'Feel the warm sun.', 'You are safe here.', 'Breathe in… and let it go.', 'Notice the quiet.', 'Everything can wait.'],
      md_bye1: 'Thank you for sitting with the forest.', md_bye2: 'May all your adventures be peaceful.' },
    he: { md_card: 'הקרחת השקטה', md_cardSub: 'יושבים באמצע היער ונחים כמה שרוצים.', md_title: 'הקרחת השקטה', md_leave: 'יוצאים מהקרחת',
      md_w: ['נושמים לאט.', 'מקשיבים לעלים.', 'מרפים את הכתפיים.', 'מרגישים את השמש החמימה.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'שמים לב לשקט.', 'הכול יכול לחכות.'],
      md_bye1: 'תודה שישבתם עם היער.', md_bye2: 'שכל ההרפתקאות שלכם יהיו שלוות.' }
  });
  const css = () => { if (document.getElementById('md-css')) return; const s = document.createElement('style'); s.id = 'md-css'; s.textContent = `
.md{position:fixed; inset:0; z-index:60; background:#0e2a18; color:#fff; font-family:var(--font-body, Rubik, sans-serif); transition:opacity 2.5s ease}
.md.gone{opacity:0}
.md canvas{position:absolute; inset:0; width:100%; height:100%; display:block}
.md-top{position:absolute; top:calc(12px + env(safe-area-inset-top,0px)); inset-inline:16px; display:flex; justify-content:flex-end; z-index:2}
.md-leave{padding:10px 18px; border-radius:999px; border:1px solid rgba(255,255,255,.45); background:rgba(10,30,18,.28); color:#fffbe8; font:700 15px var(--font-body, Rubik); cursor:pointer; backdrop-filter:blur(6px); opacity:.75; transition:opacity .4s} .md-leave:hover{opacity:1}
.md-word{position:absolute; left:50%; top:66%; transform:translateX(-50%); max-width:min(86vw,700px); text-align:center; font:600 clamp(22px,4vw,34px)/1.4 'Frank Ruhl Libre', 'Fraunces', Georgia, serif; color:#fffbea; text-shadow:0 2px 18px rgba(20,40,20,.55); z-index:2; opacity:0; transition:opacity 3s ease}
.md-word.on{opacity:1}
.md-bye{position:absolute; inset:0; display:grid; place-items:center; align-content:center; gap:14px; z-index:3; text-align:center; padding:24px; opacity:0; transition:opacity 2.2s ease; pointer-events:none}
.md-bye.on{opacity:1} .md-bye p{margin:0; font:600 clamp(24px,4.4vw,38px)/1.4 'Frank Ruhl Libre', 'Fraunces', Georgia, serif; color:#fffbea; text-shadow:0 2px 20px rgba(20,40,20,.6)}`; document.head.appendChild(s); };

  /* ---------- the clearing, drawn live ---------- */
  function scene(cv) {
    const g = cv.getContext('2d'); let W = 0, H = 0; const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const trees = [], grass = [], motes = [], flies = [], flowers = [], butterflies = [];
    function layout() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      trees.length = 0; for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, depth = Math.random(); trees.push({ x: W / 2 + side * (W * (0.28 + depth * 0.32) + rnd(-30, 30)), h: H * (0.55 + (1 - depth) * 0.5), w: 60 + (1 - depth) * 120, d: depth, hue: 120 + rnd(-14, 10), sway: rnd(0, 6) }); } trees.sort((a, b) => b.d - a.d);
      grass.length = 0; for (let i = 0; i < 260; i++) grass.push({ x: rnd(0, W), y: H * rnd(0.62, 1.02), h: rnd(10, 30), k: rnd(0, 6) });
      flowers.length = 0; for (let i = 0; i < 40; i++) flowers.push({ x: rnd(0, W), y: H * rnd(0.7, 0.98), c: ['#ffd84a', '#ff8ab0', '#fff', '#b48cff'][i % 4], r: rnd(2.5, 5) });
      motes.length = 0; for (let i = 0; i < 70; i++) motes.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(3, 9), k: rnd(0, 6) });
      flies.length = 0; for (let i = 0; i < 18; i++) flies.push({ x: rnd(0, W), y: H * rnd(0.45, 0.9), k: rnd(0, 6) });
      butterflies.length = 0; for (let i = 0; i < 3; i++) butterflies.push({ k: rnd(0, 6), r: rnd(80, 180), c: ['#ffb43c', '#5ab0ff', '#ff6a9a'][i] }); }
    window.addEventListener('resize', layout); layout();
    function draw(tm) {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#8fd4f0'); sky.addColorStop(0.5, '#d8f2d0'); sky.addColorStop(0.62, '#9ad070'); sky.addColorStop(1, '#3f8a3a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const sx = W * 0.5, sy = H * 0.08; const sun = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.45); sun.addColorStop(0, 'rgba(255,250,215,.95)'); sun.addColorStop(0.25, 'rgba(255,240,180,.35)'); sun.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = sun; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = -0.35 + i * 0.14 + Math.sin(tm * 0.00015 + i) * 0.02, op = 0.05 + 0.03 * Math.sin(tm * 0.0004 + i * 2); g.fillStyle = `rgba(255,245,200,${op})`; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.tan(a - 0.05) * H, H); g.lineTo(sx + Math.tan(a + 0.05) * H, H); g.closePath(); g.fill(); } g.restore();
      for (const tr of trees) { const sw = Math.sin(tm * 0.0004 + tr.sway) * 6 * (1 - tr.d), base = H * (0.62 + (1 - tr.d) * 0.12), l = 22 + tr.d * 18;
        g.fillStyle = `hsl(28,35%,${16 + tr.d * 18}%)`; g.fillRect(tr.x - tr.w * 0.06, base - tr.h * 0.35, tr.w * 0.12, tr.h * 0.35);
        for (let k = 0; k < 3; k++) { g.fillStyle = `hsl(${tr.hue},${40 - tr.d * 10}%,${l + k * 4}%)`; g.beginPath(); const y = base - tr.h * (0.35 + k * 0.2); g.moveTo(tr.x + sw * (k + 1) * 0.4 - tr.w * (0.62 - k * 0.12), y + tr.h * 0.12); g.lineTo(tr.x + sw * (k + 1) * 0.5, y - tr.h * 0.3); g.lineTo(tr.x + sw * (k + 1) * 0.4 + tr.w * (0.62 - k * 0.12), y + tr.h * 0.12); g.closePath(); g.fill(); } }
      for (const b of grass) { const sw = Math.sin(tm * 0.0009 + b.k + b.x * 0.01) * 4; g.strokeStyle = `rgba(40,110,40,${0.5 + (b.y / H - 0.6)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x, b.y); g.quadraticCurveTo(b.x + sw * 0.5, b.y - b.h * 0.5, b.x + sw, b.y - b.h); g.stroke(); }
      for (const f of flowers) { g.fillStyle = f.c; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(f.x, f.y, f.r * 0.4, 0, 7); g.fill(); }
      /* a soft light in the middle of the clearing that breathes very slowly (no instructions, just there) */
      const br = 0.5 - 0.5 * Math.cos(tm * 0.00063), bx = W / 2, by = H * 0.47, R = Math.min(W, H) * (0.08 + br * 0.06);
      const orb = g.createRadialGradient(bx, by, 0, bx, by, R * 2.4); orb.addColorStop(0, 'rgba(255,255,240,.85)'); orb.addColorStop(0.35, 'rgba(255,240,170,.42)'); orb.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = orb; g.beginPath(); g.arc(bx, by, R * 2.4, 0, 7); g.fill();
      g.save(); g.globalCompositeOperation = 'lighter'; for (const m of motes) { m.y -= m.v * 0.016; m.x += Math.sin(tm * 0.0008 + m.k) * 0.3; if (m.y < -5) { m.y = H + 5; m.x = rnd(0, W); } g.fillStyle = `rgba(255,250,210,${0.25 + 0.25 * Math.sin(tm * 0.0015 + m.k)})`; g.beginPath(); g.arc(m.x, m.y, 1.6, 0, 7); g.fill(); }
      for (const f of flies) { const x = f.x + Math.sin(tm * 0.0005 + f.k) * 30, y = f.y + Math.cos(tm * 0.0007 + f.k) * 18, a = 0.4 + 0.6 * Math.max(0, Math.sin(tm * 0.002 + f.k * 3)); const gl = g.createRadialGradient(x, y, 0, x, y, 10); gl.addColorStop(0, `rgba(220,255,140,${a})`); gl.addColorStop(1, 'rgba(220,255,140,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); } g.restore();
      for (const b of butterflies) { const x = W / 2 + Math.cos(tm * 0.0002 + b.k) * b.r * 1.6, y = H * 0.55 + Math.sin(tm * 0.0004 + b.k) * b.r * 0.4, fl = Math.abs(Math.sin(tm * 0.008 + b.k)); g.fillStyle = b.c; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 6 * fl, y, 7 * fl + 1, 9, 0, 0, 7); g.fill(); } g.fillStyle = '#3a2a1a'; g.fillRect(x - 1, y - 7, 2, 14); }
    }
    let raf = 0, alive = true; const loop = tm => { if (!alive) return; draw(tm); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
    return { stop() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', layout); } };
  }

  /* ---------- the Zen soundscape ---------- */
  function soundscape() {
    const M = window.KQMusic, c = M && M.ac ? M.ac() : (window.AudioContext ? new AudioContext() : null); if (!c) return { leave(cb) { cb && cb(); } };
    if (c.state === 'suspended') c.resume();
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const master = c.createGain(); master.gain.value = 0; master.connect(c.destination); master.gain.setTargetAtTime(0.85, c.currentTime, 2.5);
    /* a soft hall: a generated impulse (noise fading over ~4.5 s) */
    const rev = c.createConvolver(); { const n = c.sampleRate * 4.5, ir = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); } rev.buffer = ir; }
    const wet = c.createGain(); wet.gain.value = 0.55; rev.connect(wet); wet.connect(master); const dry = c.createGain(); dry.gain.value = 0.7; dry.connect(master);
    const send = node => { node.connect(dry); node.connect(rev); };
    const nodes = [], timers = [];
    /* the drone: D2 · A2 · D3 · A3 (open fifths), gently detuned pairs, swelling and settling like a slow breath (no chord changes, nothing falls) */
    const droneG = c.createGain(); droneG.gain.value = 0.0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.3; droneG.connect(lp); send(lp);
    for (const [m, v] of [[38, 0.5], [45, 0.35], [50, 0.3], [57, 0.16]]) for (const det of [-3, 3]) { const o = c.createOscillator(); o.type = m < 45 ? 'sine' : 'triangle'; o.frequency.value = hz(m); o.detune.value = det; const g = c.createGain(); g.gain.value = v * 0.5; o.connect(g); g.connect(droneG); o.start(); nodes.push(o); }
    droneG.gain.setTargetAtTime(0.11, c.currentTime, 4);
    const swell = c.createOscillator(), swG = c.createGain(); swell.frequency.value = 1 / 14; swG.gain.value = 0.035; swell.connect(swG); swG.connect(droneG.gain); swell.start(); nodes.push(swell);
    const fl = c.createOscillator(), flG = c.createGain(); fl.frequency.value = 1 / 23; flG.gain.value = 260; fl.connect(flG); flG.connect(lp.frequency); fl.start(); nodes.push(fl);
    /* a singing bowl: inharmonic partials (1 · 2.76 · 5.40 · 8.93), each a slowly beating pair, a soft mallet attack and a long shimmering tail */
    function bowl(m, vel, when) { const t0 = Math.max(c.currentTime, when || 0), f = hz(m), out = c.createGain(); out.gain.value = vel; send(out);
      [[1, 1, 16], [2.76, 0.45, 11], [5.4, 0.22, 7], [8.93, 0.1, 4]].forEach(([r, a, dec]) => { for (const beat of [-0.6, 0.6]) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * r + beat; g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(a * 0.5, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dec); o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dec + 0.2); } }); }
    /* wind chimes: two or three soft high pings on the D pentatonic, now and then */
    const CHIME = [74, 76, 78, 81, 83, 86];
    function chimes() { const n = 1 + Math.floor(Math.random() * 3), t0 = c.currentTime; for (let k = 0; k < n; k++) { const s = t0 + k * (0.25 + Math.random() * 0.5), o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = hz(CHIME[Math.floor(Math.random() * CHIME.length)]); g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.018, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 3.2); o.connect(g); send(g); o.start(s); o.stop(s + 3.4); } }
    /* the brook and a light breeze: filtered noise that rises and falls very slowly */
    const nb = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const brook = c.createBufferSource(); brook.buffer = nb; brook.loop = true; const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 2200; bf.Q.value = 0.5; const bg = c.createGain(); bg.gain.value = 0.012; brook.connect(bf); bf.connect(bg); bg.connect(dry); brook.start(); nodes.push(brook);
    const breeze = c.createBufferSource(); breeze.buffer = nb; breeze.loop = true; const zf = c.createBiquadFilter(); zf.type = 'lowpass'; zf.frequency.value = 380; const zg = c.createGain(); zg.gain.value = 0.02; breeze.connect(zf); zf.connect(zg); zg.connect(dry); breeze.start(); nodes.push(breeze);
    const bl = c.createOscillator(), blG = c.createGain(); bl.frequency.value = 1 / 31; blG.gain.value = 0.014; bl.connect(blG); blG.connect(zg.gain); bl.start(); nodes.push(bl);
    /* a far-off bird, rarely */
    function bird() { const t0 = c.currentTime; for (let k = 0; k < 2; k++) { const o = c.createOscillator(), g = c.createGain(), f = 2400 + Math.random() * 900, s = t0 + k * 0.18; o.frequency.setValueAtTime(f, s); o.frequency.linearRampToValueAtTime(f * 1.12, s + 0.12); g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.008, s + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.16); o.connect(g); send(g); o.start(s); o.stop(s + 0.2); } }
    /* the bowls: D3, A3, D4, E4, A4 — never in a falling run, always one at a time with long silences between */
    const BOWLS = [50, 57, 62, 64, 69]; let last = -1;
    const nextBowl = () => { let i; do { i = Math.floor(Math.random() * BOWLS.length); } while (i === last); last = i; bowl(BOWLS[i], 0.11 + Math.random() * 0.04); timers.push(setTimeout(nextBowl, 15000 + Math.random() * 12000)); };
    timers.push(setTimeout(nextBowl, 3500));
    const chimeLoop = () => { if (Math.random() < 0.7) chimes(); timers.push(setTimeout(chimeLoop, 9000 + Math.random() * 9000)); }; timers.push(setTimeout(chimeLoop, 7000));
    const birdLoop = () => { if (Math.random() < 0.5) bird(); timers.push(setTimeout(birdLoop, 14000 + Math.random() * 16000)); }; timers.push(setTimeout(birdLoop, 11000));
    /* leaving: the music turns — the drone opens into a warm D major chord, one last low bowl, then everything fades */
    function leave(done) { timers.forEach(clearTimeout); const t0 = c.currentTime;
      const warm = c.createGain(); warm.gain.value = 0; warm.connect(lp); for (const m of [54, 57, 62, 66]) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m); const g = c.createGain(); g.gain.value = 0.25; o.connect(g); g.connect(warm); o.start(); nodes.push(o); } warm.gain.setTargetAtTime(0.09, t0, 1.2);
      bowl(50, 0.16, t0 + 0.2); setTimeout(() => chimes(), 1400);
      master.gain.setTargetAtTime(0.0001, t0 + 4.5, 1.4);
      setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) {} }); try { master.disconnect(); } catch (e) {} done && done(); }, 9500); }
    return { leave };
  }

  let busy = false;
  function open() {
    if (busy) return; busy = true; css();
    const root = el('div', 'md'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', t('md_title')); const cv = document.createElement('canvas'); root.appendChild(cv); document.body.appendChild(root);
    const sc = scene(cv), sound = soundscape();
    const top = el('div', 'md-top'); const lv = el('button', 'md-leave', t('md_leave')); lv.type = 'button'; top.appendChild(lv); root.appendChild(top);
    /* a few calm words, one at a time, fading in and out with long pauses */
    const word = el('div', 'md-word'); root.appendChild(word); let wi = 0; const list = t('md_w'); const ws = Array.isArray(list) ? list : [];
    const wt = []; const show = () => { if (!ws.length) return; word.textContent = ws[wi++ % ws.length]; word.classList.add('on'); wt.push(setTimeout(() => word.classList.remove('on'), 7000)); wt.push(setTimeout(show, 20000)); };
    wt.push(setTimeout(show, 6000));
    const bye = el('div', 'md-bye'); bye.appendChild(el('p', null, t('md_bye1'))); bye.appendChild(el('p', null, t('md_bye2'))); root.appendChild(bye);
    let leaving = false;
    lv.onclick = () => { if (leaving) return; leaving = true; wt.forEach(clearTimeout); word.classList.remove('on'); lv.style.visibility = 'hidden'; bye.classList.add('on');
      sound.leave(() => {}); setTimeout(() => root.classList.add('gone'), 6500); setTimeout(() => { sc.stop(); root.remove(); busy = false; }, 9200); };
  }
  window.KQMeditate = { open };
})();
