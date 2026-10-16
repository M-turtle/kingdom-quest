/* Kingdom Quest — Flora: the Heart Garden's flowers and the garden itself (Yoni 2026-10-05: 'you can't just show a simple flower, that's
   boring. It needs to bloom. It needs to have something on it. The design level needs to be better' … the garden grows and evolves).
   Every flower is painted live on a canvas: layered petals with soft gradients, veins, dew, a real centre (seeds, stamens, a rose's
   spiral). Twelve species and three rare ones (every 7th flower). A flower grows from a seed: the stem rises, leaves unfurl, the bud
   swells and the petals open one by one. The garden is a living scene: flowers sway, and as it fills, butterflies arrive, then a pond, a
   blossom tree, bees, a stone path, birds, a rainbow and lanterns. It follows the real time of day (stars and fireflies at night).
   API: KQFlora.species(i) · KQFlora.stage(spec, done) → element (tap the watering can → it grows and blooms) · KQFlora.garden(el, flowers,
   {bloomLast}) → {stop} · KQFlora.icon(spec) → small canvas · KQFlora.next(n) → flowers until the next surprise */
(function () {
  'use strict';
  const en = { fl_tap: 'Tap the watering can!', fl_name: 'A {name} bloomed!', fl_tapGarden: 'Tap a flower to see its name.', fl_next: '{n} more flowers and something new will grow in your garden.', fl_next1: 'One more flower and something new will grow in your garden.', fl_rare: 'A rare flower!' };
  const he = { fl_tap: 'לוחצים על המזלף!', fl_name: 'פרח {name}!', fl_tapGarden: 'לוחצים על פרח כדי לראות את השם שלו.', fl_next: 'עוד {n} פרחים ומשהו חדש יצמח בגן שלכם.', fl_next1: 'עוד פרח אחד ומשהו חדש יצמח בגן שלכם.', fl_rare: 'פרח נדיר!' };
  if (window.KQ && KQ.i18n) KQ.i18n.extend({ en, he });
  const T = (k, v) => (window.KQ ? KQ.t(k, v) : en[k]);
  const L = () => ((window.KQ && KQ.i18n && KQ.i18n.lang) || document.documentElement.lang) === 'he' ? 'he' : 'en';

  /* ---------- species ---------- */
  const SP = [
    { id: 'sunflower', en: 'Sunflower', he: 'חמנייה', n: 20, layers: 2, shape: 'point', len: 30, w: 10, base: '#e67e00', tip: '#ffd84a', center: 'seeds', cc: '#5a3215', cr: 15, stem: 88, sw: 5 },
    { id: 'rose', en: 'Rose', he: 'ורד', shape: 'rose', base: '#8b0f2e', tip: '#ff4d6d', stem: 74 },
    { id: 'daisy', en: 'Daisy', he: 'חיננית', n: 18, shape: 'round', len: 28, w: 6, base: '#ffffff', tip: '#ffe3f0', center: 'disc', cc: '#ffc928', cr: 8, stem: 70 },
    { id: 'tulip', en: 'Tulip', he: 'צבעוני', shape: 'tulip', base: '#c2185b', tip: '#ff8fab', stem: 78 },
    { id: 'cherry', en: 'Cherry Blossom', he: 'פריחת דובדבן', n: 5, shape: 'notch', len: 22, w: 19, base: '#ffc2d4', tip: '#fff3f7', center: 'stamens', cc: '#e63975', cr: 5, stem: 66 },
    { id: 'poppy', en: 'Poppy', he: 'פרג', n: 4, shape: 'wide', len: 29, w: 32, base: '#b5121b', tip: '#ff4d3d', center: 'dark', cc: '#1a1a1a', cr: 7, stem: 82 },
    { id: 'lotus', en: 'Lotus', he: 'לוטוס', n: 8, layers: 2, shape: 'point', len: 31, w: 15, base: '#ff7eb0', tip: '#fff6fa', center: 'disc', cc: '#ffd23f', cr: 7, stem: 62 },
    { id: 'cosmos', en: 'Cosmos', he: 'קוסמוס', n: 8, shape: 'fringe', len: 29, w: 15, base: '#b0124f', tip: '#ff6fae', center: 'disc', cc: '#ffcf33', cr: 7, stem: 84 },
    { id: 'hibiscus', en: 'Hibiscus', he: 'היביסקוס', n: 5, shape: 'wide', len: 33, w: 29, base: '#a3122a', tip: '#ff8a72', center: 'stamen', cc: '#ffd23f', cr: 5, stem: 72 },
    { id: 'cornflower', en: 'Cornflower', he: 'דגנית', n: 10, shape: 'fringe', len: 23, w: 11, base: '#1e40af', tip: '#6aa8ff', center: 'stamens', cc: '#2e1065', cr: 6, stem: 80 },
    { id: 'lavender', en: 'Lavender', he: 'לבנדר', shape: 'spike', base: '#6d28d9', tip: '#c9b8ff', stem: 86 },
    { id: 'lily', en: 'Lily', he: 'שושן', n: 6, shape: 'point', len: 35, w: 12, base: '#ff8a2a', tip: '#fff1e0', center: 'stamens', cc: '#7a2400', cr: 4, spots: 1, stem: 80 }
  ];
  const RARE = [
    { id: 'goldrose', en: 'Golden Rose', he: 'ורד זהב', shape: 'rose', base: '#9a5b00', tip: '#ffe27a', stem: 76, rare: 1 },
    { id: 'moonlotus', en: 'Moon Lotus', he: 'לוטוס הירח', n: 8, layers: 2, shape: 'point', len: 32, w: 15, base: '#6ec3f5', tip: '#ffffff', center: 'disc', cc: '#e8f6ff', cr: 7, stem: 64, rare: 1, glow: 'rgba(170,220,255,' },
    { id: 'rainbow', en: 'Rainbow Cosmos', he: 'קוסמוס הקשת', n: 9, shape: 'fringe', len: 30, w: 15, rainbow: 1, center: 'disc', cc: '#fff3b0', cr: 7, stem: 84, rare: 1 }
  ];
  const ORDER = [0, 2, 1, 4, 3, 7, 6, 5, 9, 8, 11, 10];   // neighbours always look different
  function species(i) { if ((i + 1) % 7 === 0) return RARE[Math.floor(i / 7) % RARE.length]; const k = i - Math.floor((i + 1) / 7); return SP[ORDER[k % ORDER.length]]; }
  const byId = id => SP.concat(RARE).find(s => s.id === id);
  const name = s => s[L()] || s.en;

  /* ---------- painting ---------- */
  const clamp = x => Math.max(0, Math.min(1, x)), smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const backOut = x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const RAINBOW = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#3ecf7a', '#3a86ff', '#8338ec', '#ff5ec4', '#ff7a5a', '#4cc9f0'];
  function petalPath(g, shape, len, w) {
    g.beginPath(); g.moveTo(0, 0);
    if (shape === 'round') { g.bezierCurveTo(-w, -len * 0.3, -w, -len, 0, -len); g.bezierCurveTo(w, -len, w, -len * 0.3, 0, 0); }
    else if (shape === 'point') { g.bezierCurveTo(-w, -len * 0.35, -w * 0.6, -len * 0.8, 0, -len); g.bezierCurveTo(w * 0.6, -len * 0.8, w, -len * 0.35, 0, 0); }
    else if (shape === 'notch') { g.bezierCurveTo(-w * 0.9, -len * 0.3, -w * 0.8, -len, -w * 0.25, -len); g.lineTo(0, -len * 0.86); g.lineTo(w * 0.25, -len); g.bezierCurveTo(w * 0.8, -len, w * 0.9, -len * 0.3, 0, 0); }
    else if (shape === 'fringe') { g.bezierCurveTo(-w * 0.8, -len * 0.3, -w, -len * 0.8, -w * 0.7, -len * 0.95); for (let k = 0; k <= 4; k++) g.lineTo(-w * 0.7 + k * w * 0.35, -len * (k % 2 ? 0.88 : 1)); g.bezierCurveTo(w, -len * 0.8, w * 0.8, -len * 0.3, 0, 0); }
    else { g.bezierCurveTo(-w * 0.7, -len * 0.15, -w * 0.75, -len * 0.85, -w * 0.3, -len); g.quadraticCurveTo(0, -len * 1.06, w * 0.3, -len); g.bezierCurveTo(w * 0.75, -len * 0.85, w * 0.7, -len * 0.15, 0, 0); }   // wide, ruffled
    g.closePath();
  }
  function petal(g, s, len, w, base, tip, shape) {
    const gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, base); gr.addColorStop(1, tip); g.fillStyle = gr; petalPath(g, shape, len, w); g.fill();
    g.strokeStyle = 'rgba(60,10,30,.18)'; g.lineWidth = 0.6; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, -len * 0.08); g.quadraticCurveTo(len * 0.03, -len * 0.5, 0, -len * 0.82); g.stroke();   // the vein
    if (s.spots) { g.fillStyle = 'rgba(120,30,0,.55)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc((k % 2 ? 1 : -1) * w * 0.15, -len * (0.15 + k * 0.08), 0.9, 0, 7); g.fill(); } }
  }
  function centre(g, s, r, q) {
    if (r <= 0) return; const c = s.center;
    if (c === 'seeds') { const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, '#3a1e08'); gr.addColorStop(1, s.cc); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,200,90,.55)';
      for (let k = 0; k < 90 * q; k++) { const a = k * 2.39996, d = Math.sqrt(k / 90) * r * 0.92; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 0.75, 0, 7); g.fill(); } return; }
    if (c === 'dark') { g.fillStyle = s.cc; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = '#3a3a50'; for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; g.beginPath(); g.arc(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45, 1.1, 0, 7); g.fill(); } g.fillStyle = '#5a5a7a'; g.beginPath(); g.arc(0, 0, r * 0.45, 0, 7); g.fill(); return; }
    if (c === 'stamens' || c === 'stamen') { const n = c === 'stamen' ? 1 : 9; g.strokeStyle = c === 'stamen' ? '#ffe9a8' : 'rgba(255,240,200,.9)'; g.lineWidth = 0.9;
      for (let k = 0; k < n; k++) { const a = n === 1 ? -1.2 : k / n * 6.283, d = n === 1 ? r * 5 : r * 2.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * d * q, Math.sin(a) * d * q); g.stroke(); g.fillStyle = s.cc; g.beginPath(); g.arc(Math.cos(a) * d * q, Math.sin(a) * d * q, n === 1 ? 2.4 : 1.4, 0, 7); g.fill(); }
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(1, n === 1 ? '#7a0a1a' : s.cc); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * (n === 1 ? 1.4 : 0.8), 0, 7); g.fill(); return; }
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(1, s.cc); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,90,0,.35)'; for (let k = 0; k < 14; k++) { const a = k * 2.4, d = Math.sqrt(k / 14) * r * 0.8; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 0.7, 0, 7); g.fill(); }
  }
  function leaf(g, x, y, ang, size, open) {
    if (open <= 0) return; g.save(); g.translate(x, y); g.rotate(ang * open); const s = size * backOut(open); const gr = g.createLinearGradient(0, 0, s, 0); gr.addColorStop(0, '#2f7a2a'); gr.addColorStop(1, '#6fcf4f'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.5, -s * 0.38, s, 0); g.quadraticCurveTo(s * 0.5, s * 0.3, 0, 0); g.fill(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.9, -s * 0.02); g.stroke(); g.restore();
  }
  /* draw one flower with its stem base at (0,0); p = growth 0 (seed) → 1 (in full bloom); tm = time for the shimmer */
  function draw(g, s, p, tm) {
    tm = tm || 0; const grow = smooth(p / 0.38), Lh = s.stem || 76, top = -Lh * grow, bend = Math.sin(1.3 + Lh) * 6 * grow;
    if (grow > 0) { g.strokeStyle = '#3d8b37'; g.lineWidth = s.sw || 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(bend, top * 0.55, bend * 0.4, top); g.stroke();
      g.strokeStyle = 'rgba(190,255,150,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-0.8, 0); g.quadraticCurveTo(bend - 0.8, top * 0.55, bend * 0.4 - 0.8, top); g.stroke(); }
    const lo = clamp((p - 0.2) / 0.3); leaf(g, bend * 0.3, top * 0.32, -0.5, 22, lo); g.save(); g.scale(-1, 1); leaf(g, -bend * 0.5, top * 0.55, -0.6, 18, clamp((p - 0.28) / 0.3)); g.restore();
    const bud = smooth((p - 0.32) / 0.2), q = clamp((p - 0.5) / 0.5); if (bud <= 0) return;
    g.save(); g.translate(bend * 0.4, top);
    if (s.shape === 'spike') { const n = 16; for (let k = 0; k < n; k++) { const kq = clamp(q * 1.4 - k / n * 0.6), y = -k * 2.6 * Math.max(bud, 0.4), sd = k % 2 ? 1 : -1; if (kq <= 0 && bud < 1) continue; const r = (1.4 + 2.4 * backOut(kq)) * (1 - k / n * 0.35);
        const gr = g.createRadialGradient(sd * 2, y, 0, sd * 2, y, r + 0.5); gr.addColorStop(0, s.tip); gr.addColorStop(1, s.base); g.fillStyle = kq > 0 ? gr : '#5b8a3a'; g.beginPath(); g.ellipse(sd * 2.2, y, r, r * 0.8, sd * 0.5, 0, 7); g.fill(); } g.restore(); return; }
    if (q <= 0) { const r = 5 + 4 * bud; g.fillStyle = s.base; g.beginPath(); g.ellipse(0, -r * 0.9, r * 0.75, r * 1.2, 0, 0, 7); g.fill(); g.fillStyle = '#3d8b37'; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sd * r * 0.9, -r * 0.6, sd * r * 0.25, -r * 1.6); g.quadraticCurveTo(sd * 0.2, -r * 0.6, 0, 0); g.fill(); } g.restore(); return; }
    if (s.glow) { const gl = g.createRadialGradient(0, -2, 0, 0, -2, 44); gl.addColorStop(0, s.glow + (0.45 + 0.15 * Math.sin(tm * 0.003)) + ')'); gl.addColorStop(1, s.glow + '0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, -2, 44, 0, 7); g.fill(); }
    if (s.shape === 'tulip') { const o = backOut(q), hgt = 30, wd = 13; g.translate(0, 4); const gr = c => { const x = g.createLinearGradient(0, 0, 0, -hgt); x.addColorStop(0, s.base); x.addColorStop(1, c); return x; };
      const cup = (dx, rot, c, sc) => { g.save(); g.translate(dx, 0); g.rotate(rot); g.scale(sc, 1); g.fillStyle = gr(c); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-wd, -hgt * 0.2, -wd * 0.9, -hgt * 0.9, 0, -hgt); g.bezierCurveTo(wd * 0.9, -hgt * 0.9, wd, -hgt * 0.2, 0, 0); g.fill(); g.strokeStyle = 'rgba(80,0,30,.2)'; g.lineWidth = 0.6; g.stroke(); g.restore(); };
      cup(0, 0, s.tip, 0.95); cup(-5 * o, -0.28 * o, s.tip, 0.8); cup(5 * o, 0.28 * o, s.tip, 0.8); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(-3, -hgt * 0.55, 1.6, 8, -0.15, 0, 7); g.fill(); g.restore(); return; }
    g.scale(1, 0.9);
    if (s.shape === 'rose') { const layers = [[5, 24, 0], [5, 18, 0.6], [4, 13, 0.2], [3, 8, 0.9]];
      layers.forEach(([n, len, off], li) => { const lq = backOut(clamp(q * 1.3 - li * 0.12)); for (let k = 0; k < n; k++) { g.save(); g.rotate(off + k / n * 6.283 + (1 - lq) * 0.8); g.scale(0.3 + 0.7 * lq, 0.3 + 0.7 * lq);
        const dark = li / layers.length; petal(g, s, len, len * 0.85, mix(s.base, '#000000', dark * 0.25), mix(s.tip, s.base, dark * 0.5), 'round'); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.1; g.beginPath(); g.arc(0, -len * 0.62, len * 0.36, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); g.restore(); } });
      g.strokeStyle = 'rgba(70,0,20,.5)'; g.lineWidth = 1.2; g.beginPath(); for (let a = 0; a < 12; a += 0.2) { const r = a * 0.42 * q; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); g.restore(); return; }
    const layers = s.layers || 1;
    for (let li = layers - 1; li >= 0; li--) { const n = s.n, len = s.len * (li ? 0.78 : 1);
      for (let k = 0; k < n; k++) { const kq = backOut(clamp((q - (k / n) * 0.35) / 0.65)); if (kq <= 0) continue; g.save(); g.rotate((k + li * 0.5) / n * 6.283 + (1 - kq) * 0.7); g.scale(0.25 + 0.75 * kq, 0.25 + 0.75 * kq);
        const base = s.rainbow ? RAINBOW[k % RAINBOW.length] : s.base, tip = s.rainbow ? '#ffffff' : s.tip; petal(g, s, len, s.w, li ? mix(base, '#000000', 0.12) : base, tip, s.shape); g.restore(); } }
    centre(g, s, (s.cr || 7) * smooth(q * 1.4), q); g.restore();
  }
  function mix(a, b, k) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = sh => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k); return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1); }
  const headY = s => -(s.stem || 76) - (s.shape === 'spike' ? 18 : s.shape === 'tulip' ? 14 : 0);

  function canvasFor(wrap, wCss, hCss) { const cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = wCss * dpr; cv.height = hCss * dpr; cv.style.width = wCss + 'px'; cv.style.height = hCss + 'px'; const g = cv.getContext('2d'); g.scale(dpr, dpr); if (wrap) wrap.appendChild(cv); return { cv, g, dpr }; }
  function icon(s, size) { size = size || 64; const { cv, g } = canvasFor(null, size, size); const k = size / 120; g.translate(size / 2, size * 0.98); g.scale(k, k); draw(g, s, 1, 0); cv.className = 'fl-icon'; return cv; }

  /* ---------- sound: soft, never a speech line ---------- */
  function chime(kind) { try { if (!(window.KQ && KQ.state && KQ.state().settings.sfx)) return; const c = KQ.sfx && KQ.sfx.ensure && KQ.sfx.ensure(); if (!c) return; const t0 = c.currentTime + 0.02;
    const notes = kind === 'water' ? [880, 988, 1175, 1319, 1568] : kind === 'grow' ? [392, 494, 587] : [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; const at = t0 + i * (kind === 'water' ? 0.07 : 0.12); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(kind === 'water' ? 0.04 : 0.09, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + (kind === 'bloom' ? 1.4 : 0.5)); o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + 1.6); }); } catch (e) {} }

  /* ---------- the bloom stage: a seed in the soil, a watering can to tap, then the flower grows and opens ---------- */
  function css() { if (document.getElementById('fl-css')) return; const st = document.createElement('style'); st.id = 'fl-css'; st.textContent = `
.fl-stage{position:relative; width:min(340px,86vw); aspect-ratio:1; margin:0 auto; border-radius:22px; overflow:hidden; box-shadow:inset 0 0 0 2px rgba(255,255,255,.6), 0 10px 30px rgba(120,40,80,.25); cursor:pointer; touch-action:manipulation}
.fl-stage canvas{width:100%; height:100%; display:block}
.fl-name{position:absolute; left:50%; top:10px; transform:translateX(-50%) scale(.6); opacity:0; padding:6px 16px; border-radius:999px; background:rgba(255,255,255,.9); color:#7a1e48; font:900 clamp(16px,3.6vw,20px) var(--font-body, Rubik, sans-serif); width:max-content; max-width:88%; text-align:center; line-height:1.25; transition:all .6s cubic-bezier(.2,1.5,.4,1); pointer-events:none} .fl-name small{display:block; font-size:.72em; letter-spacing:.04em}
.fl-name.on{opacity:1; transform:translateX(-50%) scale(1)} .fl-name.rare{background:linear-gradient(90deg,#fff3b0,#ffd6f5,#c8f0ff)}
.fl-hint{text-align:center; font:800 16px var(--font-body, Rubik); color:#7a3a5a}
.fl-garden{position:relative; width:100%; border-radius:20px; overflow:hidden; touch-action:manipulation; box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)}
.fl-garden canvas{display:block; width:100%; height:100%}
.fl-tag{position:absolute; transform:translate(-50%,-100%); padding:5px 12px; border-radius:999px; background:rgba(255,255,255,.92); color:#3a1630; font:800 15px var(--font-body, Rubik); white-space:nowrap; pointer-events:none; animation:flTag 2.4s ease forwards}
@keyframes flTag{0%{opacity:0; margin-top:6px} 12%{opacity:1; margin-top:0} 80%{opacity:1} 100%{opacity:0; margin-top:-8px}}`; document.head.appendChild(st); }

  function sky(g, W, H, horizon, tm, hour) {
    const night = hour < 6 || hour >= 20, dusk = !night && (hour >= 17 || hour < 7);
    const gr = g.createLinearGradient(0, 0, 0, horizon); if (night) { gr.addColorStop(0, '#0b1340'); gr.addColorStop(1, '#2b3a78'); } else if (dusk) { gr.addColorStop(0, '#5a6fd6'); gr.addColorStop(0.6, '#ff9ec4'); gr.addColorStop(1, '#ffd29a'); } else { gr.addColorStop(0, '#6cc4f5'); gr.addColorStop(1, '#d8f3ff'); }
    g.fillStyle = gr; g.fillRect(0, 0, W, horizon + 2);
    if (night) { g.fillStyle = '#fff'; for (let k = 0; k < 60; k++) { const x = (k * 97.3) % W, y = (k * 53.7) % (horizon * 0.9), a = 0.4 + 0.6 * Math.abs(Math.sin(tm * 0.001 + k)); g.globalAlpha = a; g.fillRect(x, y, 1.6, 1.6); } g.globalAlpha = 1;
      g.fillStyle = '#fff8dc'; g.beginPath(); g.arc(W * 0.8, horizon * 0.3, 16, 0, 7); g.fill(); g.fillStyle = '#2b3a78'; g.beginPath(); g.arc(W * 0.8 + 7, horizon * 0.3 - 4, 14, 0, 7); g.fill(); }
    else { const sx = W * 0.82, sy = horizon * 0.32, sg = g.createRadialGradient(sx, sy, 0, sx, sy, 60); sg.addColorStop(0, dusk ? 'rgba(255,200,120,1)' : 'rgba(255,250,200,1)'); sg.addColorStop(0.3, 'rgba(255,240,170,.5)'); sg.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, 60, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 3; k++) { const cx = ((tm * 0.006 * (k + 1) + k * W * 0.4) % (W + 160)) - 80, cy = horizon * (0.2 + k * 0.17); for (const [dx, dy, r] of [[0, 0, 16], [18, 4, 13], [-17, 5, 12], [8, -9, 12]]) { g.beginPath(); g.arc(cx + dx, cy + dy, r, 0, 7); g.fill(); } } }
    return { night, dusk };
  }
  function ground(g, W, H, horizon, night) {
    for (let k = 0; k < 9; k++) { const x = (k + 0.3) * W / 8.5, r = 22 + (k * 37 % 17); g.fillStyle = night ? '#1a3d30' : (k % 2 ? '#6fb84e' : '#5fa844'); g.beginPath(); g.arc(x, horizon + 4, r, Math.PI, 0); g.fill(); g.beginPath(); g.arc(x + r * 0.8, horizon + 6, r * 0.7, Math.PI, 0); g.fill(); }
    g.fillStyle = night ? '#1f4a3a' : '#8fd06a'; g.beginPath(); g.moveTo(0, horizon + 10); for (let x = 0; x <= W; x += 20) g.lineTo(x, horizon - 8 * Math.sin(x / W * 3.1) - 4 * Math.sin(x / 37)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    const gr = g.createLinearGradient(0, horizon, 0, H); gr.addColorStop(0, night ? '#24573f' : '#7cc95a'); gr.addColorStop(1, night ? '#123526' : '#3f9a3a'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, horizon + 14); for (let x = 0; x <= W; x += 16) g.lineTo(x, horizon + 10 + 5 * Math.sin(x / 50 + 1)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  }

  function stage(spec, done) {
    css(); const s = typeof spec === 'string' ? byId(spec) : spec; const box = document.createElement('div'); box.className = 'fl-stage'; const W = 340, H = 340; const { cv, g } = canvasFor(box, W, H); cv.style.width = '100%'; cv.style.height = '100%';
    const tag = document.createElement('div'); tag.className = 'fl-name' + (s.rare ? ' rare' : ''); if (s.rare) { const sm = document.createElement('small'); sm.textContent = T('fl_rare'); tag.appendChild(sm); } tag.appendChild(document.createTextNode(T('fl_name', { name: name(s) }))); box.appendChild(tag);
    let phase = 'wait', t0 = 0, raf = 0, alive = true; const drops = [], burst = [], petals = []; let bee = null;
    const soilY = H * 0.8, fx = W * 0.5;
    const can = (tm, tilt) => { g.save(); g.translate(W * 0.74, H * 0.3 + (phase === 'wait' ? Math.sin(tm * 0.006) * 5 : 0)); g.rotate(-tilt); const sc = phase === 'wait' ? 1 + 0.05 * Math.sin(tm * 0.012) : 1; g.scale(sc, sc);
      if (phase === 'wait') { const gl = g.createRadialGradient(0, 0, 0, 0, 0, 60); gl.addColorStop(0, 'rgba(255,255,200,.65)'); gl.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill(); }
      const body = g.createLinearGradient(-26, 0, 26, 0); body.addColorStop(0, '#2a9d8f'); body.addColorStop(0.5, '#5fd3c2'); body.addColorStop(1, '#1f7a70'); g.fillStyle = body;
      g.beginPath(); g.moveTo(-22, -20); g.lineTo(22, -20); g.lineTo(26, 24); g.quadraticCurveTo(0, 30, -26, 24); g.closePath(); g.fill();
      g.strokeStyle = '#1f6f66'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-24, 10); g.lineTo(-56, -22); g.stroke(); g.fillStyle = '#1f6f66'; g.beginPath(); g.ellipse(-60, -26, 10, 5, -0.8, 0, 7); g.fill();
      g.strokeStyle = '#1f6f66'; g.lineWidth = 5; g.beginPath(); g.arc(4, -22, 20, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-8, 0, 4, 14, 0.1, 0, 7); g.fill(); g.restore(); };
    function frame(tm) { if (!alive) return; const el = t0 ? (tm - t0) / 1000 : 0;
      const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#bfe6ff'); sk.addColorStop(0.62, '#fff4e0'); sk.addColorStop(0.63, '#9bd775'); sk.addColorStop(1, '#4fa64a'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
      const sg = g.createRadialGradient(W * 0.2, H * 0.12, 0, W * 0.2, H * 0.12, 140); sg.addColorStop(0, 'rgba(255,250,210,.95)'); sg.addColorStop(1, 'rgba(255,250,210,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(fx, soilY + 6, 62, 16, 0, 0, 7); g.fill(); g.fillStyle = '#9a6038'; g.beginPath(); g.ellipse(fx, soilY + 2, 52, 11, 0, 0, 7); g.fill();
      let p = 0; if (phase === 'grow' || phase === 'done') p = phase === 'done' ? 1 : clamp((el - 1.1) / 3.2);
      if (p <= 0) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.ellipse(fx, soilY, 6, 4, 0.3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(fx - 2, soilY - 1, 2, 1, 0.3, 0, 7); g.fill(); }
      const sway = phase === 'done' ? Math.sin(tm * 0.0016) * 0.035 : 0; g.save(); g.translate(fx, soilY); g.rotate(sway); g.scale(2.25, 2.25); draw(g, s, p, tm); g.restore();
      const tilt = phase === 'wait' ? 0 : phase === 'grow' && el < 1.6 ? smooth(el / 0.4) * 0.75 * (el < 1.2 ? 1 : 1 - smooth((el - 1.2) / 0.4)) : 0;
      if (phase === 'wait' || (phase === 'grow' && el < 1.7)) can(tm, tilt);
      if (phase === 'grow' && el > 0.3 && el < 1.3 && Math.random() < 0.8) for (let k = 0; k < 2; k++) drops.push({ x: W * 0.74 - 50 + Math.random() * 6, y: H * 0.3 - 10, vx: -0.6 - Math.random() * 0.8, vy: 0.5 + Math.random(), life: 1 });
      g.fillStyle = 'rgba(90,170,255,.85)'; for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.vy += 0.25; d.x += d.vx; d.y += d.vy; if (d.y > soilY) { drops.splice(i, 1); continue; } g.beginPath(); g.ellipse(d.x, d.y, 1.8, 3, 0, 0, 7); g.fill(); }
      if (phase === 'grow' && p >= 1) { phase = 'done'; tag.classList.add('on'); chime('bloom'); const hy = soilY + headY(s) * 2.25 * 0.9; for (let k = 0; k < 46; k++) { const a = Math.random() * 6.283, v = 2 + Math.random() * 4.5; burst.push({ x: fx, y: hy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, c: s.rainbow ? RAINBOW[k % 9] : [s.tip || '#fff', s.base || '#ff8fb8', '#fff6b0'][k % 3], star: k % 3 === 0 }); }
        for (let k = 0; k < 14; k++) petals.push({ x: Math.random() * W, y: -10 - Math.random() * 80, vy: 0.6 + Math.random() * 0.6, k: Math.random() * 6, c: s.rainbow ? RAINBOW[k % 9] : (s.tip || '#ffd1dc') });
        bee = { a: 0, t: tm, hy }; setTimeout(() => done && done(), 900); }
      for (let i = burst.length - 1; i >= 0; i--) { const b = burst[i]; b.x += b.vx; b.y += b.vy; b.vy += 0.06; b.vx *= 0.98; b.life -= 0.012; if (b.life <= 0) { burst.splice(i, 1); continue; } g.globalAlpha = b.life; g.fillStyle = b.c; if (b.star) star(g, b.x, b.y, 4 * b.life + 1.5, tm * 0.01); else { g.beginPath(); g.arc(b.x, b.y, 2.6, 0, 7); g.fill(); } } g.globalAlpha = 1;
      for (const q of petals) { q.y += q.vy; q.x += Math.sin(tm * 0.002 + q.k) * 0.6; if (q.y > H + 10) q.y = -10; g.save(); g.translate(q.x, q.y); g.rotate(tm * 0.002 + q.k); g.fillStyle = q.c; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(0, 0, 4, 2.4, 0, 0, 7); g.fill(); g.restore(); } g.globalAlpha = 1;
      if (bee) { const e = (tm - bee.t) / 1000, a = e * 2.2, r = 46 + 10 * Math.sin(e * 1.3), x = fx + Math.cos(a) * r * Math.min(1, e), y = bee.hy + Math.sin(a * 1.6) * 18 - (1 - Math.min(1, e)) * 120; drawBee(g, x, y, tm, Math.cos(a) < 0 ? -1 : 1); }
      if (phase === 'done' && p >= 1) { const hy = soilY + headY(s) * 2.25 * 0.9; const dx = fx + 18, dy = hy + 10, sh = 0.6 + 0.4 * Math.sin(tm * 0.004); g.fillStyle = `rgba(255,255,255,${0.7 * sh})`; g.beginPath(); g.ellipse(dx, dy, 3.2, 4, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(dx - 1, dy - 1.5, 1, 0, 7); g.fill();
        if (s.rare) for (let k = 0; k < 6; k++) { const a = tm * 0.0012 + k * 1.047, r = 70; g.fillStyle = `rgba(255,240,160,${0.5 + 0.5 * Math.sin(tm * 0.005 + k)})`; star(g, fx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.6, 4, tm * 0.004); } }
      raf = requestAnimationFrame(frame); }
    raf = requestAnimationFrame(frame);
    const hint = document.createElement('div'); hint.className = 'fl-hint'; hint.textContent = T('fl_tap');
    box.addEventListener('click', () => { if (phase !== 'wait') return; phase = 'grow'; t0 = performance.now(); hint.style.visibility = 'hidden'; chime('water'); setTimeout(() => chime('grow'), 1300); });
    const wrap = document.createElement('div'); wrap.style.display = 'grid'; wrap.style.gap = '10px'; wrap.appendChild(box); wrap.appendChild(hint); wrap.stop = () => { alive = false; cancelAnimationFrame(raf); };
    return wrap;
  }
  function star(g, x, y, r, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? r * 0.35 : r, a = k * Math.PI / 4; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); }
  function drawBee(g, x, y, tm, dir) { g.save(); g.translate(x, y); g.scale(dir, 1); const w = Math.abs(Math.sin(tm * 0.06)); g.fillStyle = 'rgba(220,240,255,.8)'; g.beginPath(); g.ellipse(-1, -5, 4, 6 * w + 1, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(3, -5, 4, 6 * w + 1, 0.4, 0, 7); g.fill();
    g.fillStyle = '#ffc928'; g.beginPath(); g.ellipse(0, 0, 7, 5, 0, 0, 7); g.fill(); g.fillStyle = '#2a1a0a'; g.fillRect(-2.5, -4.6, 2, 9.2); g.fillRect(1.5, -4.4, 2, 8.8); g.beginPath(); g.arc(7, -0.5, 3, 0, 7); g.fill(); g.restore(); }

  /* ---------- the garden ---------- */
  const SURPRISES = [3, 5, 8, 12, 16, 20, 25, 30];
  function next(n) { const s = SURPRISES.find(x => x > n); return s ? s - n : 0; }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function garden(host, flowers, o) {
    css(); o = o || {}; const box = document.createElement('div'); box.className = 'fl-garden'; host.appendChild(box);
    const n = flowers.length; let W = 0, H = 0, cv, g, horizon = 0, dpr = 1; const items = []; let raf = 0, alive = true; const tags = [];
    const has = k => n >= k;
    function layout() { W = Math.max(280, box.clientWidth || host.clientWidth || 600); H = Math.round(Math.min(520, Math.max(300, W * 0.56))); box.style.height = H + 'px'; if (cv) cv.remove(); ({ cv, g, dpr } = canvasFor(box, W, H)); cv.style.width = '100%'; horizon = H * 0.36;
      items.length = 0; const pond = has(5) ? { x: W * 0.74, y: H * 0.74, rx: W * 0.16, ry: H * 0.09 } : null;
      flowers.forEach((f, i) => { const r = rng(i * 7919 + 13); let x = 0.05 + r() * 0.9, d = r(); for (let k = 0; k < 6 && pond; k++) { const px = x * W, py = horizon + 20 + d * (H - horizon - 34); if (((px - pond.x) / (pond.rx + 24)) ** 2 + ((py - pond.y) / (pond.ry + 30)) ** 2 < 1) { x = 0.05 + r() * 0.9; d = r(); } else break; }
        if (has(8) && x < 0.16 && d < 0.4) x += 0.14; const s = f.sp ? byId(f.sp) || species(i) : species(i); const y = horizon + 30 + d * (H - horizon - 40), sc = (0.62 + 0.72 * d) * (H / 420);
        items.push({ s, x: x * W, y, sc, k: r() * 6, i, born: o.bloomLast && i === n - 1 ? performance.now() + 600 : 0, cache: null, pop: 0 }); });
      items.sort((a, b) => a.y - b.y); state.pond = pond; }
    const state = { pond: null };
    function cacheOf(it) { if (it.cache) return it.cache; const k = it.sc * dpr, w = Math.ceil(130 * k), h = Math.ceil(150 * k), c = document.createElement('canvas'); c.width = w; c.height = h; const cg = c.getContext('2d'); cg.translate(w / 2, h - 2 * k); cg.scale(k, k); draw(cg, it.s, 1, 0); return (it.cache = { c, w, h }); }
    const flies = Array.from({ length: 5 }, (_, k) => ({ k: k * 1.7 })), bees = Array.from({ length: 3 }, (_, k) => ({ k: k * 2.1 }));
    function tree(tm, night) { const x = W * 0.1, b = horizon + 46, h = Math.min(H * 0.42, (b - 46) / 0.95); g.fillStyle = night ? '#3a2a20' : '#6b4226'; g.beginPath(); g.moveTo(x - 9, b); g.lineTo(x - 5, b - h * 0.55); g.lineTo(x + 5, b - h * 0.55); g.lineTo(x + 9, b); g.fill();
      g.strokeStyle = g.fillStyle; g.lineWidth = 5; g.beginPath(); g.moveTo(x, b - h * 0.45); g.lineTo(x + 34, b - h * 0.7); g.moveTo(x, b - h * 0.4); g.lineTo(x - 30, b - h * 0.66); g.stroke();
      const blobs = [[0, -0.8, 46], [-34, -0.68, 34], [36, -0.7, 36], [-12, -0.95, 34], [22, -0.92, 30]]; for (const [dx, dy, r] of blobs) { const gr = g.createRadialGradient(x + dx - 8, b + dy * h - 8, 2, x + dx, b + dy * h, r); gr.addColorStop(0, night ? '#c98aa8' : '#ffe1ec'); gr.addColorStop(1, night ? '#8a4a6a' : '#ff9ec4'); g.fillStyle = gr; g.beginPath(); g.arc(x + dx, b + dy * h + Math.sin(tm * 0.001 + dx) * 1.5, r, 0, 7); g.fill(); }
      g.fillStyle = '#ffc2d4'; for (let k = 0; k < 8; k++) { const fy = ((tm * 0.02 + k * 60) % (H - (b - h))) + (b - h * 0.6), fx = x - 40 + ((k * 37) % 120) + Math.sin(tm * 0.001 + k) * 14; g.save(); g.translate(fx, fy); g.rotate(tm * 0.002 + k); g.beginPath(); g.ellipse(0, 0, 3.4, 2, 0, 0, 7); g.fill(); g.restore(); }
      if (has(20)) for (const [dx, dy, c] of [[30, -0.72, '#4a90e2'], [-28, -0.69, '#ff7a5a']]) { const hop = Math.max(0, Math.sin(tm * 0.003 + dx)) * 3; const bx = x + dx, by = b + dy * h - 6 - hop; g.fillStyle = c; g.beginPath(); g.ellipse(bx, by, 7, 5.5, 0, 0, 7); g.fill(); g.beginPath(); g.arc(bx + (dx > 0 ? 5 : -5), by - 4, 4, 0, 7); g.fill(); g.fillStyle = '#ffb000'; g.beginPath(); g.moveTo(bx + (dx > 0 ? 9 : -9), by - 4); g.lineTo(bx + (dx > 0 ? 13 : -13), by - 3); g.lineTo(bx + (dx > 0 ? 9 : -9), by - 2); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(bx + (dx > 0 ? 6 : -6), by - 5, 0.9, 0, 7); g.fill(); } }
    function pondDraw(tm, night) { const p = state.pond; if (!p) return; const gr = g.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.rx); gr.addColorStop(0, night ? '#2a4a8a' : '#8fe0ff'); gr.addColorStop(1, night ? '#16305e' : '#3a9ad9'); g.fillStyle = '#6a8a5a'; g.beginPath(); g.ellipse(p.x, p.y + 3, p.rx + 6, p.ry + 5, 0, 0, 7); g.fill(); g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { const ph = ((tm * 0.0004 + k / 3) % 1); g.globalAlpha = 1 - ph; g.beginPath(); g.ellipse(p.x - p.rx * 0.3 + k * 20, p.y, 4 + ph * 26, (4 + ph * 26) * 0.35, 0, 0, 7); g.stroke(); } g.globalAlpha = 1;
      for (const [dx, dy] of [[-0.5, 0.2], [0.35, -0.3], [0.55, 0.35]]) { g.fillStyle = '#3f9a3a'; g.beginPath(); g.arc(p.x + dx * p.rx, p.y + dy * p.ry, 8, 0.4, 6.0); g.lineTo(p.x + dx * p.rx, p.y + dy * p.ry); g.fill(); } g.fillStyle = '#ffd1e6'; g.beginPath(); g.arc(p.x + 0.35 * p.rx, p.y - 0.3 * p.ry - 2, 3.2, 0, 7); g.fill(); }
    function path(night) { g.fillStyle = night ? '#6a6a7a' : '#d9c9a8'; for (let k = 0; k < 9; k++) { const t = k / 8, x = W * (0.42 + 0.08 * Math.sin(t * 4)), y = H - 8 - t * (H - horizon - 30), r = 13 * (1 - t * 0.6); g.beginPath(); g.ellipse(x, y, r * 1.4, r * 0.55, 0, 0, 7); g.fill(); } }
    function meadow(night) { for (let k = 0; k < 70; k++) { const x = (k * 137.5) % W, y = horizon + 18 + ((k * 61.7) % (H - horizon - 24)), r = 1.2 + (y - horizon) / (H - horizon) * 1.6; g.fillStyle = night ? 'rgba(200,220,255,.35)' : ['#ffffff', '#fff3a0', '#ffc2d4', '#d9c8ff'][k % 4]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      g.strokeStyle = night ? 'rgba(30,80,50,.6)' : 'rgba(50,120,40,.45)'; g.lineWidth = 1.2; for (let k = 0; k < 90; k++) { const x = (k * 89.3) % W, y = horizon + 24 + ((k * 47.9) % (H - horizon - 28)); g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 4, y - 6); g.moveTo(x, y); g.lineTo(x, y - 8); g.moveTo(x + 3, y); g.lineTo(x + 4, y - 6); g.stroke(); } }
    function rainbow() { g.save(); g.globalAlpha = 0.28; RAINBOW.slice(0, 6).forEach((c, k) => { g.strokeStyle = c; g.lineWidth = 6; g.beginPath(); g.arc(W * 0.45, horizon + 20, W * 0.42 - k * 6, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); }); g.restore(); }
    function lanterns(tm) { g.strokeStyle = 'rgba(80,60,40,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 18); g.quadraticCurveTo(W / 2, 56, W, 18); g.stroke(); for (let k = 1; k < 8; k++) { const t = k / 8, x = W * t, y = 18 + 4 * 38 * t * (1 - t) + 6; const gl = g.createRadialGradient(x, y, 0, x, y, 16); gl.addColorStop(0, `rgba(255,220,140,${0.55 + 0.2 * Math.sin(tm * 0.003 + k)})`); gl.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.fillStyle = ['#ff8fab', '#ffd23f', '#9ad0ff'][k % 3]; g.beginPath(); g.ellipse(x, y, 5, 7, 0, 0, 7); g.fill(); } }
    let chk = 0; function frame(tm) { if (!alive) return; if (tm - chk > 400) { chk = tm; if (box.clientWidth && Math.abs(box.clientWidth - W) > 8) layout(); } const hour = new Date().getHours(); const { night } = sky(g, W, H, horizon, tm, hour); if (has(25)) rainbow(); ground(g, W, H, horizon, night); meadow(night); if (has(16)) path(night); if (has(8)) tree(tm, night); if (has(5)) pondDraw(tm, night);
      for (const it of items) { let p = 1; if (it.born) { p = clamp((tm - it.born) / 3200); if (p >= 1) it.born = 0; } const sw = Math.sin(tm * 0.0012 + it.k) * 0.04, pop = it.pop > tm ? Math.sin((it.pop - tm) / 600 * Math.PI) * 0.18 : 0;
        g.save(); g.translate(it.x, it.y); g.rotate(sw); g.scale(1 + pop, 1 + pop);
        if (p < 1) { g.scale(it.sc, it.sc); draw(g, it.s, p, tm); } else { const c = cacheOf(it); g.drawImage(c.c, -c.w / 2 / dpr, -(c.h / dpr) + 2 * it.sc, c.w / dpr, c.h / dpr); }
        g.restore(); if (it.s.rare && p >= 1) { g.fillStyle = `rgba(255,240,170,${0.5 + 0.5 * Math.sin(tm * 0.004 + it.k)})`; star(g, it.x + 14 * it.sc, it.y + headY(it.s) * it.sc - 8, 3, tm * 0.003); } }
      g.fillStyle = night ? 'rgba(20,60,40,.9)' : 'rgba(60,140,50,.85)'; for (let x = 0; x < W; x += 6) { const sw = Math.sin(tm * 0.0015 + x * 0.05) * 3; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + sw * 0.5, H - 8, x + sw, H - 14 - (x * 7 % 9)); g.lineTo(x + 3, H); g.fill(); }
      if (has(3)) { const nb = Math.min(5, 1 + Math.floor(n / 5)); for (let k = 0; k < nb; k++) { const f = flies[k], x = W * (0.5 + 0.4 * Math.sin(tm * 0.00023 + f.k * 2)), y = horizon + 30 + (H - horizon) * 0.3 * (1 + Math.sin(tm * 0.0005 + f.k)), fl = Math.abs(Math.sin(tm * 0.012 + f.k)); g.fillStyle = ['#ffb43c', '#5ab0ff', '#ff6a9a', '#b48cff', '#ffe14a'][k]; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x + sd * 5 * fl, y, 6 * fl + 1, 8, 0, 0, 7); g.fill(); } g.fillStyle = '#3a2a1a'; g.fillRect(x - 1, y - 6, 2, 12); } }
      if (has(12) && !night) for (const b of bees) { const a = tm * 0.0009 + b.k, x = W * (0.5 + 0.38 * Math.sin(a * 1.3)), y = horizon + (H - horizon) * (0.45 + 0.25 * Math.sin(a * 2.1)); drawBee(g, x, y, tm, Math.cos(a * 1.3) > 0 ? 1 : -1); }
      if (night || has(30)) { if (has(30)) lanterns(tm); if (night) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 16; k++) { const x = (k * 71.3 + Math.sin(tm * 0.0005 + k) * 30) % W, y = horizon + 20 + ((k * 43.1) % (H - horizon - 30)) + Math.cos(tm * 0.0007 + k) * 12, a = Math.max(0, Math.sin(tm * 0.002 + k * 3)); const gl = g.createRadialGradient(x, y, 0, x, y, 9); gl.addColorStop(0, `rgba(220,255,140,${a})`); gl.addColorStop(1, 'rgba(220,255,140,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); } g.restore(); } }
      raf = requestAnimationFrame(frame); }
    box.addEventListener('click', e => { const r = box.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height; let best = null, bd = 1e9;
      for (const it of items) { const hx = it.x, hy = it.y + headY(it.s) * it.sc * 0.9, d = Math.hypot(x - hx, y - hy); if (d < 44 * Math.max(0.6, it.sc) && d < bd) { bd = d; best = it; } }
      if (!best) return; best.pop = performance.now() + 600; try { KQ.sfx && KQ.sfx.play('tap'); } catch (err) {} const tg = document.createElement('div'); tg.className = 'fl-tag'; tg.textContent = name(best.s); tg.style.left = (best.x / W * 100) + '%'; tg.style.top = ((best.y + headY(best.s) * best.sc - 26) / H * 100) + '%'; box.appendChild(tg); setTimeout(() => tg.remove(), 2500); });
    layout(); raf = requestAnimationFrame(frame);   /* the box may not be on the page yet when this runs: lay out again once it has its real width, and whenever it changes */
    let rt = 0; const onR = () => { clearTimeout(rt); rt = setTimeout(() => { if (alive && box.clientWidth && Math.abs(box.clientWidth - W) > 8) layout(); }, 120); };
    const ro = window.ResizeObserver ? new ResizeObserver(onR) : null; if (ro) ro.observe(box); else window.addEventListener('resize', onR); requestAnimationFrame(onR);
    return { el: box, stop() { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener('resize', onR); box.remove(); } };
  }
  window.KQFlora = { species, byId, name, draw, icon, stage, garden, next, SURPRISES, SP, RARE };
})();
