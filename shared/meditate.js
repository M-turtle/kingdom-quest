/* Kingdom Quest — the Quiet places: one meditation, a scene for every realm (Yoni 2026-10-04/05: 'sit at the middle of the forest in a
   clearing and meditate' … 'no timer, no purpose or end, no start: you go there, it starts. If you want to leave, the music changes and it
   says thank you, may all your adventures be peaceful. Very Zen-like … no talking: just a bit of words shown on the screen, fading in and
   out'; 2026-10-09: 'Quiet … for every world. It should be adapted for every world … sports: extreme sports at the top of the mountains;
   space: floating on an asteroid').
   Arriving starts it; it runs as long as the child stays. Each scene is drawn live: a still background painted once, and a few slow things
   moving over it. In the middle of every scene a soft light breathes very slowly (about ten seconds a breath). The sound is made on the
   spot: a warm drone on an open fifth that swells and settles, singing bowls with long tails, and the scene's own air (a brook, wind, waves,
   water drops, the hush of a city far below, or almost nothing in space). Leaving plays a last bowl over a warm chord and a thank-you.
   API: KQMeditate.open({ realm }) — realm defaults to the current one; KQMeditate.themes = the scene ids. */
(function () {
  'use strict';
  if (!window.KQ) return;
  const { t } = KQ, el = KQ.ui.el;
  const W8 = (en, he) => ({ en, he });
  /* per scene: title, the leave button, the words that drift by, the first thank-you line */
  const TXT = {
    meadow: { t: W8('The Quiet Clearing', 'הקרחת השקטה'), l: W8('Leave the clearing', 'יוצאים מהקרחת'), b: W8('Thank you for sitting with the forest.', 'תודה שישבתם עם היער.'),
      w: W8(['Breathe slowly.', 'Listen to the leaves.', 'Let your shoulders soften.', 'Feel the warm sun.', 'You are safe here.', 'Breathe in… and let it go.', 'Notice the quiet.', 'Everything can wait.'],
        ['נושמים לאט.', 'מקשיבים לעלים.', 'מרפים את הכתפיים.', 'מרגישים את השמש החמימה.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'שמים לב לשקט.', 'הכול יכול לחכות.']) },
    sky: { t: W8('The Quiet Isle', 'האי השקט'), l: W8('Leave the isle', 'יוצאים מהאי'), b: W8('Thank you for sitting with the wind.', 'תודה שישבתם עם הרוח.'),
      w: W8(['Breathe slowly.', 'Feel the wind on your face.', 'Watch the clouds drift by.', 'Let your shoulders soften.', 'You are safe up here.', 'Breathe in… and let it go.', 'Notice the quiet.', 'Everything can wait.'],
        ['נושמים לאט.', 'מרגישים את הרוח על הפנים.', 'מסתכלים על העננים שחולפים.', 'מרפים את הכתפיים.', 'כאן למעלה בטוח.', 'נושמים פנימה… ומשחררים.', 'שמים לב לשקט.', 'הכול יכול לחכות.']) },
    cloud: { t: W8('The Cloud Nest', 'קן העננים'), l: W8('Leave the cloud', 'יורדים מהענן'), b: W8('Thank you for resting on the clouds.', 'תודה שנחתם על העננים.'),
      w: W8(['Breathe slowly.', 'Let your body feel light.', 'Soft, like a cloud.', 'Let your hands rest.', 'You are safe here.', 'Breathe in… and let it go.', 'Notice how still it is.', 'Everything can wait.'],
        ['נושמים לאט.', 'מרגישים את הגוף קל.', 'רך, כמו ענן.', 'נותנים לידיים לנוח.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'שמים לב כמה שקט.', 'הכול יכול לחכות.']) },
    ocean: { t: W8('The Quiet Reef', 'השונית השקטה'), l: W8('Swim back up', 'שוחים חזרה למעלה'), b: W8('Thank you for sitting with the sea.', 'תודה שישבתם עם הים.'),
      w: W8(['Breathe slowly.', 'Move like the seaweed.', 'Watch the bubbles rise.', 'Let your shoulders soften.', 'You are safe here.', 'Breathe in… and let it go.', 'Listen to the water.', 'Everything can wait.'],
        ['נושמים לאט.', 'זזים לאט, כמו אצות.', 'מסתכלים על הבועות שעולות.', 'מרפים את הכתפיים.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'מקשיבים למים.', 'הכול יכול לחכות.']) },
    pirate: { t: W8('The Quiet Cove', 'המפרץ השקט'), l: W8('Leave the cove', 'יוצאים מהמפרץ'), b: W8('Thank you for sitting by the sea.', 'תודה שישבתם ליד הים.'),
      w: W8(['Breathe slowly.', 'Breathe in with the wave…', '…and out as it rolls back.', 'Feel the warm sand.', 'You are safe here.', 'Let your shoulders soften.', 'Listen to the sea.', 'Everything can wait.'],
        ['נושמים לאט.', 'נושמים פנימה עם הגל…', '…ומשחררים כשהוא חוזר.', 'מרגישים את החול החמים.', 'כאן בטוח.', 'מרפים את הכתפיים.', 'מקשיבים לים.', 'הכול יכול לחכות.']) },
    skull: { t: W8('The Glowing Grotto', 'המערה הזוהרת'), l: W8('Leave the grotto', 'יוצאים מהמערה'), b: W8('Thank you for sitting with the crystals.', 'תודה שישבתם עם הגבישים.'),
      w: W8(['Breathe slowly.', 'Watch the crystals glow.', 'Listen to the drops.', 'Let your shoulders soften.', 'You are safe here.', 'Breathe in… and let it go.', 'Notice the quiet.', 'Everything can wait.'],
        ['נושמים לאט.', 'מסתכלים על הגבישים הזוהרים.', 'מקשיבים לטיפות.', 'מרפים את הכתפיים.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'שמים לב לשקט.', 'הכול יכול לחכות.']) },
    fashion: { t: W8('The Rooftop Garden', 'גן הגג'), l: W8('Leave the garden', 'יוצאים מהגן'), b: W8('Thank you for sitting in the garden.', 'תודה שישבתם בגן.'),
      w: W8(['Breathe slowly.', 'Watch the petals fall.', 'The city hums far away.', 'Let your shoulders soften.', 'You are safe here.', 'Breathe in… and let it go.', 'Notice the quiet.', 'Everything can wait.'],
        ['נושמים לאט.', 'מסתכלים על עלי הכותרת שנושרים.', 'העיר מזמזמת רחוק, רחוק.', 'מרפים את הכתפיים.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'שמים לב לשקט.', 'הכול יכול לחכות.']) },
    sports: { t: W8('The Summit', 'הפסגה'), l: W8('Climb down', 'יורדים מההר'), b: W8('Thank you for sitting on the summit.', 'תודה שישבתם על הפסגה.'),
      w: W8(['Breathe slowly.', 'You made it to the top.', 'Feel the cool, clean air.', 'Let your legs rest.', 'You are safe here.', 'Breathe in… and let it go.', 'Watch the sun come up.', 'Everything can wait.'],
        ['נושמים לאט.', 'הגעתם לפסגה.', 'מרגישים את האוויר הקריר והנקי.', 'נותנים לרגליים לנוח.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'מסתכלים על השמש שעולה.', 'הכול יכול לחכות.']) },
    space: { t: W8('The Quiet Asteroid', 'האסטרואיד השקט'), l: W8('Fly home', 'טסים הביתה'), b: W8('Thank you for floating with the stars.', 'תודה שריחפתם עם הכוכבים.'),
      w: W8(['Breathe slowly.', 'Float, light and still.', 'Watch the stars turn.', 'Let your shoulders soften.', 'You are safe here.', 'Breathe in… and let it go.', 'Notice how quiet space is.', 'Everything can wait.'],
        ['נושמים לאט.', 'מרחפים, קלים ושקטים.', 'מסתכלים על הכוכבים שמסתובבים.', 'מרפים את הכתפיים.', 'כאן בטוח.', 'נושמים פנימה… ומשחררים.', 'שמים לב כמה שקט בחלל.', 'הכול יכול לחכות.']) }
  };
  const ext = { en: { md_card: 'The Quiet Clearing', md_cardSub: 'Sit in the middle of the forest and rest for as long as you like.', md_bye2: 'May all your adventures be peaceful.' },
    he: { md_card: 'הקרחת השקטה', md_cardSub: 'יושבים באמצע היער ונחים כמה שרוצים.', md_bye2: 'שכל ההרפתקאות שלכם יהיו שלוות.' } };
  for (const id in TXT) for (const L of ['en', 'he']) { const x = TXT[id]; ext[L]['md_t_' + id] = x.t[L]; ext[L]['md_l_' + id] = x.l[L]; ext[L]['md_b_' + id] = x.b[L]; ext[L]['md_w_' + id] = x.w[L]; }
  KQ.i18n.extend(ext);

  const css = () => { if (document.getElementById('md-css')) return; const s = document.createElement('style'); s.id = 'md-css'; s.textContent = `
.md{position:fixed; inset:0; z-index:60; background:#0e2a18; color:#fff; font-family:var(--font-body, Rubik, sans-serif); transition:opacity 2.5s ease; --md-shadow:rgba(20,40,20,.55); --md-ink:#fffbea}
.md.gone{opacity:0}
.md canvas{position:absolute; inset:0; width:100%; height:100%; display:block}
.md-top{position:absolute; top:calc(12px + env(safe-area-inset-top,0px)); inset-inline:16px; display:flex; justify-content:flex-end; z-index:2}
.md-leave{padding:10px 18px; border-radius:999px; border:1px solid rgba(255,255,255,.45); background:rgba(10,20,30,.28); color:#fffbe8; font:700 15px var(--font-body, Rubik); cursor:pointer; backdrop-filter:blur(6px); opacity:.75; transition:opacity .4s} .md-leave:hover{opacity:1}
.md-word{position:absolute; left:50%; top:66%; transform:translateX(-50%); max-width:min(86vw,700px); text-align:center; font:600 clamp(22px,4vw,34px)/1.4 'Frank Ruhl Libre', 'Fraunces', Georgia, serif; color:var(--md-ink); text-shadow:0 2px 18px var(--md-shadow); z-index:2; opacity:0; transition:opacity 3s ease}
.md-word.on{opacity:1}
.md-bye{position:absolute; inset:0; display:grid; place-items:center; align-content:center; gap:14px; z-index:3; text-align:center; padding:24px; opacity:0; transition:opacity 2.2s ease; pointer-events:none}
.md-bye.on{opacity:1} .md-bye p{margin:0; font:600 clamp(24px,4.4vw,38px)/1.4 'Frank Ruhl Libre', 'Fraunces', Georgia, serif; color:var(--md-ink); text-shadow:0 2px 20px var(--md-shadow)}`; document.head.appendChild(s); };

  /* ---------- drawing helpers ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  function glow(g, x, y, r, rgb, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.4, `rgba(${rgb},${a * 0.45})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  const breath = tm => 0.5 - 0.5 * Math.cos(tm * 0.00063);   /* ~10 s in, out */
  function puff(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); for (const [dx, dy, k] of [[-1.1, 0.25, 0.62], [-0.45, -0.15, 0.85], [0.35, -0.3, 0.95], [1.05, 0.15, 0.7], [0, 0.35, 0.8]]) { g.moveTo(x + dx * r + k * r, y + dy * r); g.arc(x + dx * r, y + dy * r, k * r, 0, 7); } g.fill(); }
  function cloudBank(g, W, y, h, cols, seed) { let s = seed || 1; const R = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let layer = 0; layer < cols.length; layer++) { const yy = y + layer * h * 0.28; for (let x = -60; x < W + 80; x += 50 + R() * 50) puff(g, x, yy + R() * h * 0.2, 34 + R() * 40 + layer * 8, cols[layer]); } }
  function stars(g, W, H, n, top, alpha) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(255,255,255,${(alpha || 0.8) * Math.random()})`; g.fillRect(Math.random() * W, Math.random() * H * (top || 1), 1.3, 1.3); } }

  /* ---------- the scenes: bg(g, W, H) is painted once per size; init(W, H) makes the moving parts; frame(g, W, H, tm, s) draws them ---------- */
  const THEMES = {
    meadow: { shadow: 'rgba(20,40,20,.55)', ground: '#0e2a18', sound: { brook: 1, breeze: 1, bird: 1 },
      init(W, H) { const s = { trees: [], grass: [], motes: [], flies: [], flowers: [], bfs: [] };
        for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, d = Math.random(); s.trees.push({ x: W / 2 + side * (W * (0.28 + d * 0.32) + rnd(-30, 30)), h: H * (0.55 + (1 - d) * 0.5), w: 60 + (1 - d) * 120, d, hue: 120 + rnd(-14, 10), sway: rnd(0, 6) }); } s.trees.sort((a, b) => b.d - a.d);
        for (let i = 0; i < 260; i++) s.grass.push({ x: rnd(0, W), y: H * rnd(0.62, 1.02), h: rnd(10, 30), k: rnd(0, 6) });
        for (let i = 0; i < 40; i++) s.flowers.push({ x: rnd(0, W), y: H * rnd(0.7, 0.98), c: ['#ffd84a', '#ff8ab0', '#fff', '#b48cff'][i % 4], r: rnd(2.5, 5) });
        for (let i = 0; i < 70; i++) s.motes.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(3, 9), k: rnd(0, 6) });
        for (let i = 0; i < 18; i++) s.flies.push({ x: rnd(0, W), y: H * rnd(0.45, 0.9), k: rnd(0, 6) });
        for (let i = 0; i < 3; i++) s.bfs.push({ k: rnd(0, 6), r: rnd(80, 180), c: ['#ffb43c', '#5ab0ff', '#ff6a9a'][i] }); return s; },
      bg(g, W, H) { g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#8fd4f0'], [0.5, '#d8f2d0'], [0.62, '#9ad070'], [1, '#3f8a3a']]); g.fillRect(0, 0, W, H); },
      frame(g, W, H, tm, s) {
        const sx = W * 0.5, sy = H * 0.08; glow(g, sx, sy, H * 0.45, '255,246,200', 0.95);
        g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = -0.35 + i * 0.14 + Math.sin(tm * 0.00015 + i) * 0.02, op = 0.05 + 0.03 * Math.sin(tm * 0.0004 + i * 2); g.fillStyle = `rgba(255,245,200,${op})`; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.tan(a - 0.05) * H, H); g.lineTo(sx + Math.tan(a + 0.05) * H, H); g.closePath(); g.fill(); } g.restore();
        for (const tr of s.trees) { const sw = Math.sin(tm * 0.0004 + tr.sway) * 6 * (1 - tr.d), base = H * (0.62 + (1 - tr.d) * 0.12), l = 22 + tr.d * 18;
          g.fillStyle = `hsl(28,35%,${16 + tr.d * 18}%)`; g.fillRect(tr.x - tr.w * 0.06, base - tr.h * 0.35, tr.w * 0.12, tr.h * 0.35);
          for (let k = 0; k < 3; k++) { g.fillStyle = `hsl(${tr.hue},${40 - tr.d * 10}%,${l + k * 4}%)`; g.beginPath(); const y = base - tr.h * (0.35 + k * 0.2); g.moveTo(tr.x + sw * (k + 1) * 0.4 - tr.w * (0.62 - k * 0.12), y + tr.h * 0.12); g.lineTo(tr.x + sw * (k + 1) * 0.5, y - tr.h * 0.3); g.lineTo(tr.x + sw * (k + 1) * 0.4 + tr.w * (0.62 - k * 0.12), y + tr.h * 0.12); g.closePath(); g.fill(); } }
        for (const b of s.grass) { const sw = Math.sin(tm * 0.0009 + b.k + b.x * 0.01) * 4; g.strokeStyle = `rgba(40,110,40,${0.5 + (b.y / H - 0.6)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x, b.y); g.quadraticCurveTo(b.x + sw * 0.5, b.y - b.h * 0.5, b.x + sw, b.y - b.h); g.stroke(); }
        for (const f of s.flowers) { g.fillStyle = f.c; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(f.x, f.y, f.r * 0.4, 0, 7); g.fill(); }
        const br = breath(tm), R = Math.min(W, H) * (0.08 + br * 0.06); glow(g, W / 2, H * 0.47, R * 2.4, '255,246,190', 0.85);
        g.save(); g.globalCompositeOperation = 'lighter'; for (const m of s.motes) { m.y -= m.v * 0.016; m.x += Math.sin(tm * 0.0008 + m.k) * 0.3; if (m.y < -5) { m.y = H + 5; m.x = rnd(0, W); } g.fillStyle = `rgba(255,250,210,${0.25 + 0.25 * Math.sin(tm * 0.0015 + m.k)})`; g.beginPath(); g.arc(m.x, m.y, 1.6, 0, 7); g.fill(); }
        for (const f of s.flies) { const x = f.x + Math.sin(tm * 0.0005 + f.k) * 30, y = f.y + Math.cos(tm * 0.0007 + f.k) * 18, a = 0.4 + 0.6 * Math.max(0, Math.sin(tm * 0.002 + f.k * 3)); glow(g, x, y, 10, '220,255,140', a); } g.restore();
        for (const b of s.bfs) { const x = W / 2 + Math.cos(tm * 0.0002 + b.k) * b.r * 1.6, y = H * 0.55 + Math.sin(tm * 0.0004 + b.k) * b.r * 0.4, fl = Math.abs(Math.sin(tm * 0.008 + b.k)); g.fillStyle = b.c; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x + sd * 6 * fl, y, 7 * fl + 1, 9, 0, 0, 7); g.fill(); } g.fillStyle = '#3a2a1a'; g.fillRect(x - 1, y - 7, 2, 14); } } },

    /* the Sky Isles: the grassy edge of a floating island at golden hour, a sea of cloud below, other islands drifting far off */
    sky: { shadow: 'rgba(255,244,222,.95)', ink: '#4a3218', ground: '#c99a5c', sound: { wind: 0.8, chimes: 1.6, bird: 0.5 },
      init(W, H) { const s = { isles: [], grass: [], birds: [], motes: [], puffs: [] };
        [[0.16, 0.36, 0.55], [0.8, 0.3, 0.42], [0.62, 0.47, 0.3]].forEach(([x, y, k]) => s.isles.push({ x: W * x, y: H * y, k, ph: rnd(0, 6) }));
        for (let i = 0; i < 220; i++) s.grass.push({ x: rnd(0, W), y: H * rnd(0.84, 1.02), h: rnd(10, 26), k: rnd(0, 6) });
        for (let i = 0; i < 4; i++) s.birds.push({ x: rnd(0, W), y: H * rnd(0.12, 0.3), v: rnd(6, 12), k: rnd(0, 6) });
        for (let i = 0; i < 50; i++) s.motes.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(8, 18), k: rnd(0, 6) });
        for (let i = 0; i < 9; i++) s.puffs.push({ x: rnd(0, W), y: H * rnd(0.56, 0.74), r: rnd(30, 60), v: rnd(3, 7) }); return s; },
      bg(g, W, H) { g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#5d97cf'], [0.38, '#f3d3a2'], [0.52, '#ffe7bf'], [1, '#ffe7bf']]); g.fillRect(0, 0, W, H);
        cloudBank(g, W, H * 0.55, H * 0.4, ['rgba(255,236,214,.95)', 'rgba(255,246,236,.97)', 'rgba(255,255,255,.98)'], 7); },
      frame(g, W, H, tm, s) {
        const br = breath(tm); glow(g, W * 0.5, H * 0.5, Math.min(W, H) * (0.3 + br * 0.08), '255,232,170', 0.75); glow(g, W * 0.5, H * 0.5, Math.min(W, H) * 0.06, '255,250,230', 0.95);
        for (const p of s.puffs) { p.x += p.v * 0.016; if (p.x > W + 120) p.x = -120; puff(g, p.x, p.y, p.r, 'rgba(255,255,255,.7)'); }
        for (const is of s.isles) { const bob = Math.sin(tm * 0.0004 + is.ph) * 6, x = is.x, y = is.y + bob, w = W * 0.13 * is.k + 40, h = w * 0.7;
          g.fillStyle = '#a07a58'; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 0.4, y + h * 0.5, x, y + h); g.quadraticCurveTo(x + w * 0.5, y + h * 0.4, x + w, y); g.closePath(); g.fill();
          g.fillStyle = '#7fae5a'; g.beginPath(); g.ellipse(x, y, w, h * 0.16, 0, 0, 7); g.fill();
          for (let k = -2; k <= 2; k++) puff(g, x + k * w * 0.3, y - h * 0.18 - (k % 2 ? 0 : 6), w * 0.13, '#5f9a48');
          g.strokeStyle = `rgba(230,245,255,${0.55 + 0.2 * Math.sin(tm * 0.003 + is.ph)})`; g.lineWidth = Math.max(1.5, w * 0.03); g.beginPath(); g.moveTo(x + w * 0.62, y + 2); g.lineTo(x + w * 0.6, y + h * 1.4); g.stroke(); }
        const kx = W * 0.72 + Math.sin(tm * 0.0003) * 26, ky = H * 0.2 + Math.sin(tm * 0.0005) * 12; g.save(); g.translate(kx, ky); g.rotate(Math.sin(tm * 0.0006) * 0.15); g.fillStyle = '#e8546b'; g.beginPath(); g.moveTo(0, -16); g.lineTo(11, 0); g.lineTo(0, 22); g.lineTo(-11, 0); g.closePath(); g.fill(); g.fillStyle = '#ffd25a'; g.beginPath(); g.moveTo(0, -16); g.lineTo(11, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.restore();
        g.strokeStyle = 'rgba(120,80,60,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(kx, ky + 22); for (let i = 1; i <= 12; i++) g.lineTo(kx - i * 4 + Math.sin(tm * 0.002 + i) * 3, ky + 22 + i * 7); g.stroke();
        g.strokeStyle = 'rgba(70,60,70,.6)'; g.lineWidth = 1.6; for (const b of s.birds) { b.x += b.v * 0.016; if (b.x > W + 30) { b.x = -30; b.y = H * rnd(0.12, 0.3); } const f = Math.sin(tm * 0.004 + b.k) * 4; g.beginPath(); g.moveTo(b.x - 9, b.y - f); g.quadraticCurveTo(b.x - 4, b.y - 2, b.x, b.y); g.quadraticCurveTo(b.x + 4, b.y - 2, b.x + 9, b.y - f); g.stroke(); }
        g.fillStyle = lin(g, 0, H * 0.82, 0, H, [[0, '#86b85a'], [1, '#4f8a3a']]); g.beginPath(); g.moveTo(0, H * 0.86); g.quadraticCurveTo(W * 0.5, H * 0.8, W, H * 0.87); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
        for (const b of s.grass) { const sw = Math.sin(tm * 0.0012 + b.k + b.x * 0.01) * 6 + 3; g.strokeStyle = 'rgba(50,110,40,.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x, b.y); g.quadraticCurveTo(b.x + sw * 0.5, b.y - b.h * 0.5, b.x + sw, b.y - b.h); g.stroke(); }
        g.save(); g.globalCompositeOperation = 'lighter'; for (const m of s.motes) { m.x += m.v * 0.016; m.y += Math.sin(tm * 0.001 + m.k) * 0.2; if (m.x > W + 5) { m.x = -5; m.y = rnd(0, H); } g.fillStyle = `rgba(255,248,220,${0.2 + 0.2 * Math.sin(tm * 0.002 + m.k)})`; g.beginPath(); g.arc(m.x, m.y, 1.4, 0, 7); g.fill(); } g.restore(); } },

    /* the Cloud Kingdom: resting on a cloud at dawn, pastel sky, a faint rainbow, two sheep asleep on clouds far away */
    cloud: { shadow: 'rgba(255,244,250,.95)', ink: '#56386a', ground: '#e9c8e0', sound: { breeze: 0.4, chimes: 1.3, high: 1 },
      init(W, H) { const s = { puffs: [], sheep: [], motes: [] };
        for (let i = 0; i < 10; i++) s.puffs.push({ x: rnd(0, W), y: H * rnd(0.25, 0.6), r: rnd(26, 58), v: rnd(2, 5) });
        s.sheep.push({ x: W * 0.22, y: H * 0.5, ph: 0 }, { x: W * 0.8, y: H * 0.44, ph: 2 });
        for (let i = 0; i < 60; i++) s.motes.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(2, 6), k: rnd(0, 6) }); return s; },
      bg(g, W, H) { g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#a99ae0'], [0.45, '#f4c3d8'], [0.75, '#ffe0c6'], [1, '#fff1e2']]); g.fillRect(0, 0, W, H); stars(g, W, H, 60, 0.3, 0.5);
        g.save(); g.globalAlpha = 0.16; g.lineWidth = Math.max(8, W * 0.012); ['#ff6b6b', '#ffb347', '#fff275', '#7be38a', '#6ec8ff', '#b28dff'].forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(W * 0.5, H * 0.95, W * 0.52 - i * g.lineWidth, Math.PI, 2 * Math.PI); g.stroke(); }); g.restore(); },
      frame(g, W, H, tm, s) {
        const br = breath(tm); glow(g, W * 0.5, H * 0.3, Math.min(W, H) * (0.22 + br * 0.08), '255,240,220', 0.8); glow(g, W * 0.5, H * 0.3, Math.min(W, H) * 0.05, '255,255,250', 0.95);
        for (const p of s.puffs) { p.x += p.v * 0.016; if (p.x > W + 100) p.x = -100; puff(g, p.x, p.y, p.r, 'rgba(255,250,252,.75)'); }
        for (const sh of s.sheep) { const y = sh.y + Math.sin(tm * 0.0005 + sh.ph) * 5, x = sh.x; puff(g, x, y + 20, 48, 'rgba(255,255,255,.92)');   /* a sheep asleep on its own little cloud */
          g.fillStyle = '#f8f6f2'; for (const [dx, dy, r] of [[-12, 2, 10], [-4, -4, 11], [6, -3, 10], [12, 3, 9], [0, 5, 11]]) { g.beginPath(); g.arc(x + dx, y + dy, r, 0, 7); g.fill(); }
          g.fillStyle = '#5a5268'; g.beginPath(); g.ellipse(x + 21, y + 3, 9, 7.5, 0.25, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 15, y - 2, 5, 2.6, -0.7, 0, 7); g.fill();
          g.strokeStyle = '#efe9f5'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 20, y + 2); g.quadraticCurveTo(x + 23, y + 4.5, x + 26, y + 2); g.stroke();
          const zz = (tm * 0.0004 + sh.ph) % 1; g.fillStyle = `rgba(90,70,120,${0.7 * (1 - zz)})`; g.font = '600 14px Georgia, serif'; g.fillText('z', x + 28 + zz * 10, y - 10 - zz * 26); }
        const baseY = H * 0.8; for (let i = -1; i <= 9; i++) { const x = i * W / 8, r = W * 0.09 + Math.sin(tm * 0.0005 + i) * 6; puff(g, x, baseY + Math.sin(tm * 0.0004 + i * 1.7) * 5, r, i % 2 ? 'rgba(255,244,250,1)' : 'rgba(255,236,246,1)'); }
        g.fillStyle = '#fff4fa'; g.fillRect(0, H * 0.86, W, H * 0.14);
        g.save(); g.globalCompositeOperation = 'lighter'; for (const m of s.motes) { m.y -= m.v * 0.016; if (m.y < -5) { m.y = H + 5; m.x = rnd(0, W); } g.fillStyle = `rgba(255,240,250,${0.25 + 0.25 * Math.sin(tm * 0.0015 + m.k)})`; g.beginPath(); g.arc(m.x + Math.sin(tm * 0.0007 + m.k) * 8, m.y, 1.5, 0, 7); g.fill(); } g.restore(); } },

    /* the Sky Ocean: sitting on the sand of a quiet reef; light ripples down, seaweed sways, a jellyfish breathes in the middle */
    ocean: { shadow: 'rgba(0,30,50,.6)', ground: '#0d3d5c', sound: { under: 1, bubbles: 1, chimes: 0.5 },
      init(W, H) { const s = { weeds: [], fish: [], bubbles: [], turtle: { x: -200, t0: 0 } };
        for (let i = 0; i < 16; i++) s.weeds.push({ x: rnd(0, W), h: H * rnd(0.18, 0.42), k: rnd(0, 6), c: ['#2f8a5a', '#3fa06a', '#5a9a3a'][i % 3] });
        for (let i = 0; i < 3; i++) { const sc = []; for (let j = 0; j < 7; j++) sc.push({ dx: rnd(-40, 40), dy: rnd(-18, 18), k: rnd(0, 6) }); s.fish.push({ x: rnd(0, W), y: H * rnd(0.25, 0.6), v: rnd(10, 22) * (i % 2 ? -1 : 1), sc, c: ['#ffb84a', '#7fd4ff', '#ff8ab0'][i] }); }
        for (let i = 0; i < 40; i++) s.bubbles.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(14, 32), r: rnd(1.5, 4.5), k: rnd(0, 6) }); return s; },
      bg(g, W, H) { g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#2a8fb0'], [0.35, '#145a80'], [0.8, '#0a3354'], [1, '#08243c']]); g.fillRect(0, 0, W, H);
        g.fillStyle = lin(g, 0, H * 0.82, 0, H, [[0, '#c9b48a'], [1, '#8a7a5a']]); g.beginPath(); g.moveTo(0, H * 0.86); for (let x = 0; x <= W; x += 40) g.lineTo(x, H * 0.85 + Math.sin(x * 0.01) * 8); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
        const coral = (x, y, sc, col) => { g.strokeStyle = col; g.lineCap = 'round'; const br = (x0, y0, a, len, d) => { if (d > 4 || len < 4) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; g.lineWidth = Math.max(2, (5 - d) * 2.2 * sc); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); br(x1, y1, a - 0.45, len * 0.75, d + 1); br(x1, y1, a + 0.4, len * 0.72, d + 1); }; br(x, y, -Math.PI / 2, 34 * sc, 0); };
        coral(W * 0.12, H * 0.86, 1.4, '#e8708a'); coral(W * 0.88, H * 0.87, 1.6, '#f09a5a'); coral(W * 0.32, H * 0.88, 0.9, '#b48cff'); coral(W * 0.7, H * 0.88, 1, '#ff8ab0');
        for (const [x, r, c] of [[0.22, 34, '#d88a6a'], [0.6, 26, '#c97a9a'], [0.95, 30, '#d8a05a']]) { g.fillStyle = c; g.beginPath(); g.ellipse(W * x, H * 0.87, r, r * 0.7, 0, Math.PI, 0); g.fill(); } },
      frame(g, W, H, tm, s) {
        g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const x = W * (0.1 + i * 0.13) + Math.sin(tm * 0.0003 + i) * 30, op = 0.04 + 0.03 * Math.sin(tm * 0.0005 + i * 1.7); g.fillStyle = `rgba(180,240,255,${op})`; g.beginPath(); g.moveTo(x - 20, 0); g.lineTo(x + 20, 0); g.lineTo(x + 90, H * 0.85); g.lineTo(x + 30, H * 0.85); g.closePath(); g.fill(); }
          g.strokeStyle = 'rgba(200,250,255,.12)'; g.lineWidth = 2; for (let r = 0; r < 4; r++) { g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, 14 + r * 12 + Math.sin(x * 0.02 + tm * 0.001 + r) * 4); g.stroke(); } g.restore();
        for (const w of s.weeds) { g.strokeStyle = w.c; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); const y0 = H * 0.87; g.moveTo(w.x, y0); for (let k = 1; k <= 8; k++) { const t = k / 8; g.lineTo(w.x + Math.sin(tm * 0.0008 + w.k + t * 2) * 18 * t, y0 - w.h * t); } g.stroke(); }
        for (const f of s.fish) { f.x += f.v * 0.016; if (f.v > 0 && f.x > W + 80) f.x = -80; if (f.v < 0 && f.x < -80) f.x = W + 80; const dir = Math.sign(f.v);
          for (const m of f.sc) { const x = f.x + m.dx + Math.sin(tm * 0.001 + m.k) * 4, y = f.y + m.dy + Math.cos(tm * 0.0012 + m.k) * 3; g.fillStyle = f.c; g.beginPath(); g.ellipse(x, y, 7, 3.5, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - dir * 6, y); g.lineTo(x - dir * 11, y - 3.5); g.lineTo(x - dir * 11, y + 3.5); g.closePath(); g.fill(); } }
        const tu = s.turtle; if (tm - tu.t0 > 45000) { tu.t0 = tm; tu.x = -160; tu.y = H * rnd(0.3, 0.5); } if (tu.x < W + 200) { tu.x += 14 * 0.016; const x = tu.x, y = tu.y + Math.sin(tm * 0.0008) * 8, fl = Math.sin(tm * 0.0018) * 0.5;
          g.fillStyle = '#6a8a4a'; for (const sd of [-1, 1]) { g.save(); g.translate(x + 14, y + sd * 10); g.rotate(sd * (0.6 + fl)); g.beginPath(); g.ellipse(14, 0, 18, 6, 0, 0, 7); g.fill(); g.restore(); } g.beginPath(); g.ellipse(x + 46, y, 10, 8, 0, 0, 7); g.fill(); g.fillStyle = '#8a6a3a'; g.beginPath(); g.ellipse(x + 10, y, 30, 22, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x + 10, y, 18, 12, 0, 0, 7); g.stroke(); }
        const br = breath(tm), jx = W * 0.5, jy = H * 0.42 + Math.sin(tm * 0.0004) * 10, bw = Math.min(W, H) * (0.07 + br * 0.025), bh = bw * (0.85 - br * 0.15);
        glow(g, jx, jy, bw * 4, '210,170,255', 0.35 + br * 0.15);
        g.strokeStyle = 'rgba(240,210,255,.45)'; g.lineWidth = 2; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(jx + i * bw * 0.22, jy); for (let k = 1; k <= 10; k++) g.lineTo(jx + i * bw * 0.22 + Math.sin(tm * 0.0015 + k * 0.6 + i) * 6, jy + k * bw * 0.28); g.stroke(); }
        g.fillStyle = 'rgba(245,220,255,.7)'; g.beginPath(); g.ellipse(jx, jy, bw, bh, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(jx - bw * 0.3, jy - bh * 0.5, bw * 0.25, bh * 0.2, -0.3, 0, 7); g.fill();
        for (const b of s.bubbles) { b.y -= b.v * 0.016; b.x += Math.sin(tm * 0.002 + b.k) * 0.3; if (b.y < -10) { b.y = H + 10; b.x = rnd(0, W); } g.strokeStyle = 'rgba(220,250,255,.55)'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, 7); g.fill(); } } },

    /* the Pirate Cove: a sunset beach; the sea breathes in and out on the sand, a ship rests at anchor far away */
    pirate: { shadow: 'rgba(60,20,40,.55)', ground: '#2a2440', sound: { waves: 1, chimes: 0.5 },
      init(W, H) { const s = { gulls: [], stars: [] }; for (let i = 0; i < 3; i++) s.gulls.push({ x: rnd(0, W), y: H * rnd(0.15, 0.32), v: rnd(5, 10), k: rnd(0, 6) }); for (let i = 0; i < 40; i++) s.stars.push({ x: rnd(0, W), y: rnd(0, H * 0.25), k: rnd(0, 6) }); return s; },
      bg(g, W, H) { const hz = H * 0.56; g.fillStyle = lin(g, 0, 0, 0, hz, [[0, '#26306a'], [0.45, '#8a4f8f'], [0.75, '#e8789a'], [1, '#ffc27a']]); g.fillRect(0, 0, W, hz);
        g.fillStyle = lin(g, 0, hz, 0, H, [[0, '#4a5a9a'], [1, '#1c2a52']]); g.fillRect(0, hz, W, H - hz);
        g.fillStyle = '#3a2f5a'; g.beginPath(); g.moveTo(W * 0.02, hz); g.quadraticCurveTo(W * 0.12, hz - H * 0.07, W * 0.24, hz); g.closePath(); g.fill(); },
      frame(g, W, H, tm, s) {
        const hz = H * 0.56, br = breath(tm);
        for (const st of s.stars) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(tm * 0.001 + st.k)})`; g.fillRect(st.x, st.y, 1.4, 1.4); }
        glow(g, W * 0.5, hz, Math.min(W, H) * (0.34 + br * 0.08), '255,190,120', 0.7); g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip(); g.fillStyle = '#ffd58a'; g.beginPath(); g.arc(W * 0.5, hz + 4, Math.min(W, H) * 0.07, 0, 7); g.fill(); g.restore();
        g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const y = hz + 6 + i * i * 0.5, w = 30 + i * 5 + Math.sin(tm * 0.002 + i) * 14; g.fillStyle = `rgba(255,200,140,${0.35 - i * 0.012})`; g.fillRect(W * 0.5 - w / 2 + Math.sin(tm * 0.0013 + i * 2) * 8, y, w, 2); } g.restore();
        const sx = W * 0.72, sy = hz - 4 + Math.sin(tm * 0.0006) * 2.5; g.fillStyle = '#2a2140'; g.beginPath(); g.moveTo(sx - 46, sy - 8); g.lineTo(sx + 46, sy - 8); g.lineTo(sx + 36, sy + 6); g.lineTo(sx - 38, sy + 6); g.closePath(); g.fill();
        for (const [dx, h] of [[-22, 50], [4, 62], [28, 44]]) { g.fillRect(sx + dx, sy - 8 - h, 2.4, h); g.fillRect(sx + dx - 12, sy - 8 - h * 0.78, 26, 3); g.fillRect(sx + dx - 9, sy - 8 - h * 0.45, 20, 3); }
        g.strokeStyle = 'rgba(40,30,60,.75)'; g.lineWidth = 1.6; for (const b of s.gulls) { b.x += b.v * 0.016; if (b.x > W + 30) { b.x = -30; } const f = Math.sin(tm * 0.003 + b.k) * 4; g.beginPath(); g.moveTo(b.x - 9, b.y - f); g.quadraticCurveTo(b.x - 4, b.y - 2, b.x, b.y); g.quadraticCurveTo(b.x + 4, b.y - 2, b.x + 9, b.y - f); g.stroke(); }
        const wv = 0.5 - 0.5 * Math.cos(tm * 0.00063), shore = H * (0.8 - wv * 0.045);
        g.fillStyle = lin(g, 0, H * 0.74, 0, H, [[0, '#e7c38e'], [1, '#c99a6a']]); g.beginPath(); g.moveTo(0, H * 0.82); g.quadraticCurveTo(W * 0.5, H * 0.76, W, H * 0.83); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
        g.fillStyle = 'rgba(90,120,180,.55)'; g.beginPath(); g.moveTo(0, H * 0.74); g.lineTo(W, H * 0.74); g.lineTo(W, shore + 6); for (let x = W; x >= 0; x -= 20) g.lineTo(x, shore + Math.sin(x * 0.02 + tm * 0.0008) * 5); g.closePath(); g.fill();
        g.strokeStyle = `rgba(255,250,240,${0.55 + wv * 0.3})`; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= W; x += 16) g.lineTo(x, shore + Math.sin(x * 0.02 + tm * 0.0008) * 5); g.stroke();
        const palm = (x, dir) => { g.fillStyle = '#1e1830'; g.strokeStyle = '#1e1830'; g.lineWidth = 12; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + dir * 30, H * 0.6, x + dir * 70, H * 0.36); g.stroke(); const tx = x + dir * 70, ty = H * 0.36;
          for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5 + Math.sin(tm * 0.0007 + i) * 0.06, L = Math.min(W, H) * 0.22; g.lineWidth = 6; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - 20, tx + Math.cos(a) * L, ty + Math.sin(a) * L + 30); g.stroke(); } };
        palm(W * 0.04, 1); palm(W * 0.97, -1); } },

    /* the Skull Catacombs: a calm grotto, not a scary one; glowworms on the ceiling, crystals that glow, drops falling into a still pool */
    skull: { shadow: 'rgba(10,0,30,.7)', ground: '#0a0718', sound: { drips: 1, low: 1, chimes: 0.4 },
      init(W, H) { const s = { worms: [], crystals: [], candles: [], drops: [], ripples: [], motes: [] };
        for (let i = 0; i < 120; i++) s.worms.push({ x: rnd(0, W), y: rnd(0, H * 0.32), k: rnd(0, 6), r: rnd(0.8, 2) });
        [[0.1, 0.78, 1.2, '120,220,255'], [0.2, 0.84, 0.8, '190,140,255'], [0.84, 0.8, 1.3, '190,140,255'], [0.93, 0.86, 0.8, '120,220,255'], [0.68, 0.84, 0.6, '120,255,210']].forEach(([x, y, sc, c], i) => s.crystals.push({ x: W * x, y: H * y, sc, c, ph: i * 1.3 }));
        [[0.3, 0.74], [0.38, 0.76], [0.62, 0.75]].forEach(([x, y], i) => s.candles.push({ x: W * x, y: H * y, k: i * 2.1 }));
        for (let i = 0; i < 40; i++) s.motes.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(2, 5), k: rnd(0, 6) }); return s; },
      bg(g, W, H) { const gr = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75); gr.addColorStop(0, '#2a1f52'); gr.addColorStop(0.6, '#140e2e'); gr.addColorStop(1, '#06040e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = '#0a0718'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= W / 18) { const d = (x / W * 7.3) % 1; g.lineTo(x, H * (0.04 + d * 0.06)); g.lineTo(x - W / 36, H * (0.1 + d * 0.16)); } g.closePath(); g.fill();
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(W * 0.12, H * 0.5, 0, H); g.closePath(); g.fill(); g.beginPath(); g.moveTo(W, 0); g.quadraticCurveTo(W * 0.88, H * 0.5, W, H); g.closePath(); g.fill();
        g.fillStyle = '#1a1336'; g.beginPath(); g.moveTo(0, H * 0.78); g.quadraticCurveTo(W * 0.5, H * 0.7, W, H * 0.78); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
        g.fillStyle = lin(g, 0, H * 0.82, 0, H, [[0, 'rgba(60,90,160,.55)'], [1, 'rgba(20,20,60,.6)']]); g.beginPath(); g.ellipse(W * 0.5, H * 0.9, W * 0.36, H * 0.07, 0, 0, 7); g.fill(); },
      frame(g, W, H, tm, s) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const w of s.worms) { const a = 0.35 + 0.45 * Math.max(0, Math.sin(tm * 0.0009 + w.k)); g.fillStyle = `rgba(140,230,255,${a})`; g.beginPath(); g.arc(w.x, w.y, w.r, 0, 7); g.fill(); }
        const br = breath(tm); glow(g, W * 0.5, H * 0.5, Math.min(W, H) * (0.22 + br * 0.07), '170,140,255', 0.45);
        for (const c of s.crystals) { const a = 0.25 + 0.2 * Math.sin(tm * 0.0005 + c.ph); glow(g, c.x, c.y - 30 * c.sc, 90 * c.sc, c.c, a); }
        for (const c of s.candles) { const f = 0.8 + 0.2 * Math.sin(tm * 0.013 + c.k) * Math.sin(tm * 0.007 + c.k * 3); glow(g, c.x, c.y - 26, 46 * f, '255,190,110', 0.55); } g.restore();
        const cx = W * 0.5, cy = H * 0.62, ch = Math.min(W, H) * 0.2; g.fillStyle = `rgba(${Math.round(150 + br * 40)},${Math.round(120 + br * 40)},255,.8)`; g.beginPath(); g.moveTo(cx, cy - ch); g.lineTo(cx + ch * 0.22, cy - ch * 0.62); g.lineTo(cx + ch * 0.16, cy); g.lineTo(cx - ch * 0.16, cy); g.lineTo(cx - ch * 0.22, cy - ch * 0.62); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(cx, cy - ch); g.lineTo(cx - ch * 0.22, cy - ch * 0.62); g.lineTo(cx - ch * 0.05, cy - ch * 0.4); g.closePath(); g.fill();
        for (const c of s.crystals) { g.fillStyle = `rgba(${c.c},.85)`; for (let k = -1; k <= 1; k++) { const h = (46 - Math.abs(k) * 14) * c.sc, w = 9 * c.sc; g.beginPath(); g.moveTo(c.x + k * w * 1.4, c.y - h); g.lineTo(c.x + k * w * 1.4 + w, c.y - h * 0.7); g.lineTo(c.x + k * w * 1.4 + w * 0.7, c.y); g.lineTo(c.x + k * w * 1.4 - w * 0.7, c.y); g.lineTo(c.x + k * w * 1.4 - w, c.y - h * 0.7); g.closePath(); g.fill(); } }
        for (const c of s.candles) { g.fillStyle = '#e8dcc0'; g.fillRect(c.x - 5, c.y - 22, 10, 22); const f = Math.sin(tm * 0.013 + c.k) * 1.5; g.fillStyle = '#ffcf6a'; g.beginPath(); g.moveTo(c.x - 4, c.y - 22); g.quadraticCurveTo(c.x + f, c.y - 42, c.x + 4, c.y - 22); g.closePath(); g.fill(); g.fillStyle = '#fff4c0'; g.beginPath(); g.ellipse(c.x, c.y - 26, 1.8, 4, 0, 0, 7); g.fill(); }
        if (Math.random() < 0.012) s.drops.push({ x: W * rnd(0.25, 0.75), y: H * 0.12, v: 0 });
        for (const d of s.drops) { d.v += 900 * 0.016; d.y += d.v * 0.016; g.fillStyle = 'rgba(190,220,255,.8)'; g.beginPath(); g.ellipse(d.x, d.y, 1.6, 3, 0, 0, 7); g.fill(); if (d.y > H * 0.88 && !d.done) { d.done = true; s.ripples.push({ x: d.x, y: H * 0.9, r: 2, a: 0.7 }); } }
        s.drops = s.drops.filter(d => !d.done);
        for (const r of s.ripples) { r.r += 0.5; r.a *= 0.985; g.strokeStyle = `rgba(190,220,255,${r.a})`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, 7); g.stroke(); } s.ripples = s.ripples.filter(r => r.a > 0.03);
        g.save(); g.globalCompositeOperation = 'lighter'; for (const m of s.motes) { m.y -= m.v * 0.016; if (m.y < -5) { m.y = H + 5; m.x = rnd(0, W); } g.fillStyle = `rgba(200,180,255,${0.2 + 0.2 * Math.sin(tm * 0.0015 + m.k)})`; g.beginPath(); g.arc(m.x + Math.sin(tm * 0.0007 + m.k) * 6, m.y, 1.4, 0, 7); g.fill(); } g.restore(); } },

    /* the Fashion Kingdom: a rooftop garden at dusk; string lights sway, blossom petals drift, a paper lantern breathes; the city far below */
    fashion: { shadow: 'rgba(60,20,60,.6)', ground: '#2a1a3a', sound: { city: 1, fountain: 1, chimes: 1 },
      init(W, H) { const s = { petals: [], bulbs: [] }; for (let i = 0; i < 60; i++) s.petals.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(10, 22), k: rnd(0, 6), r: rnd(2.5, 5) }); return s; },
      bg(g, W, H) { const hz = H * 0.66; g.fillStyle = lin(g, 0, 0, 0, hz, [[0, '#2e2460'], [0.5, '#8a4f9a'], [0.82, '#e98aa6'], [1, '#ffc2a0']]); g.fillRect(0, 0, W, H); stars(g, W, H, 50, 0.3, 0.6);
        g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(W * 0.82, H * 0.16, Math.min(W, H) * 0.035, 0, 7); g.fill();
        let x = 0, i = 0; while (x < W) { const bw = 30 + ((i * 37) % 50), bh = H * (0.08 + ((i * 53) % 100) / 100 * 0.16); g.fillStyle = i % 2 ? '#3a2a5a' : '#45326a'; g.fillRect(x, hz - bh, bw, bh + H * 0.2);
          for (let wy = hz - bh + 8; wy < hz - 4; wy += 11) for (let wx = x + 5; wx < x + bw - 5; wx += 9) if (((wx * 7 + wy * 13 + i) % 5) < 2) { g.fillStyle = 'rgba(255,220,140,.75)'; g.fillRect(wx, wy, 4, 5); } x += bw + 3; i++; }
        g.fillStyle = '#6a5a7a'; g.fillRect(0, H * 0.8, W, H * 0.04); g.fillStyle = '#4a3e5c'; g.fillRect(0, H * 0.84, W, H * 0.16);
        const tree = (tx, dir) => { g.fillStyle = '#5a3a3a'; g.fillRect(tx - 5, H * 0.62, 10, H * 0.2); g.fillStyle = '#b06a4a'; g.fillRect(tx - 26, H * 0.79, 52, 30); for (let k = 0; k < 9; k++) puff(g, tx + Math.sin(k * 2.3) * 50 * dir, H * 0.56 + Math.cos(k * 1.7) * 30, 22, k % 2 ? '#f7b3cf' : '#f597bf'); };
        tree(W * 0.08, 1); tree(W * 0.92, -1); },
      frame(g, W, H, tm, s) {
        const br = breath(tm);
        for (const [x0, x1, y0, sag] of [[0, W * 0.5, H * 0.12, H * 0.12], [W * 0.5, W, H * 0.12, H * 0.12], [0, W, H * 0.06, H * 0.2]]) { const sw = Math.sin(tm * 0.0006 + x0) * 6; g.strokeStyle = 'rgba(40,30,50,.8)'; g.lineWidth = 1.2; g.beginPath(); for (let k = 0; k <= 20; k++) { const t = k / 20, x = x0 + (x1 - x0) * t, y = y0 + Math.sin(t * Math.PI) * (sag + sw); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          for (let k = 1; k < 20; k += 2) { const t = k / 20, x = x0 + (x1 - x0) * t, y = y0 + Math.sin(t * Math.PI) * (sag + sw) + 5, a = 0.6 + 0.4 * Math.sin(tm * 0.002 + k * 1.3 + x0); glow(g, x, y, 12, '255,214,150', a * 0.6); g.fillStyle = `rgba(255,236,190,${a})`; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } }
        const lx = W * 0.5, ly = H * 0.42 + Math.sin(tm * 0.0005) * 4, lr = Math.min(W, H) * 0.07; glow(g, lx, ly, lr * (3.2 + br * 1.2), '255,170,120', 0.55);
        g.strokeStyle = 'rgba(40,30,50,.8)'; g.beginPath(); g.moveTo(lx, H * 0.18); g.lineTo(lx, ly - lr); g.stroke(); g.fillStyle = `rgba(255,${Math.round(150 + br * 50)},110,.95)`; g.beginPath(); g.ellipse(lx, ly, lr, lr * 1.15, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(160,60,40,.45)'; g.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(lx, ly, lr * Math.abs(k) / 2.4 + 1, lr * 1.15, 0, 0, 7); g.stroke(); } g.fillStyle = '#7a3a2a'; g.fillRect(lx - lr * 0.4, ly - lr * 1.2, lr * 0.8, 5); g.fillRect(lx - lr * 0.4, ly + lr * 1.1, lr * 0.8, 5);
        for (const p of s.petals) { p.y += p.v * 0.016; p.x += Math.sin(tm * 0.001 + p.k) * 0.7 + 0.25; if (p.y > H + 10) { p.y = -10; p.x = rnd(0, W); } g.save(); g.translate(p.x, p.y); g.rotate(tm * 0.001 + p.k); g.fillStyle = 'rgba(255,190,215,.9)'; g.beginPath(); g.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 7); g.fill(); g.restore(); } } },

    sports: { shadow: 'rgba(255,246,236,.95)', ink: '#26305a', ground: '#dfe8f5', sound: { wind: 1.4, chimes: 0.4 },
      init(W, H) { const s = { snow: [], puffs: [], eagle: { k: rnd(0, 6) } };
        for (let i = 0; i < 90; i++) s.snow.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(20, 50), k: rnd(0, 6), r: rnd(0.8, 2.2) });
        for (let i = 0; i < 8; i++) s.puffs.push({ x: rnd(0, W), y: H * rnd(0.6, 0.68), r: rnd(30, 60), v: rnd(4, 8) }); return s; },
      bg(g, W, H) { g.fillStyle = lin(g, 0, 0, 0, H * 0.64, [[0, '#24467e'], [0.55, '#9a8fc0'], [0.85, '#f5ae7a'], [1, '#ffd9a6']]); g.fillRect(0, 0, W, H); stars(g, W, H, 40, 0.25, 0.5);
        const peaks = (y, h, col, snow, n, seed) => { let sd = seed; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280; g.fillStyle = col; g.beginPath(); g.moveTo(0, y); const pts = []; for (let i = 0; i <= n; i++) { const x = i * W / n + (R() - 0.5) * W / n * 0.5, py = y - h * (0.45 + R() * 0.55); pts.push([x, py]); g.lineTo(x, py); g.lineTo(x + W / n / 2, y - h * (0.1 + 0.2 * R())); } g.lineTo(W, y); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
          g.fillStyle = snow; for (const [x, py] of pts) { g.beginPath(); g.moveTo(x, py); g.lineTo(x + W / n * 0.13, py + h * 0.2); g.lineTo(x + W / n * 0.04, py + h * 0.16); g.lineTo(x - W / n * 0.05, py + h * 0.22); g.lineTo(x - W / n * 0.13, py + h * 0.2); g.closePath(); g.fill(); } };
        peaks(H * 0.64, H * 0.24, '#7c7cab', '#ecebf7', 6, 3); peaks(H * 0.66, H * 0.15, '#5d6592', '#e2e5f4', 5, 11);
        cloudBank(g, W, H * 0.63, H * 0.1, ['rgba(255,228,214,.92)', 'rgba(255,240,232,.96)'], 5);
        /* our summit: snow over dark rock, the top just left of the middle */
        const ridge = [[0, 0.93], [0.14, 0.86], [0.28, 0.8], [0.38, 0.755], [0.44, 0.735], [0.5, 0.75], [0.62, 0.79], [0.78, 0.84], [1, 0.9]];
        g.fillStyle = '#4a4f68'; g.beginPath(); g.moveTo(0, H); ridge.forEach(([x, y]) => g.lineTo(W * x, H * (y + 0.012))); g.lineTo(W, H); g.closePath(); g.fill();
        g.fillStyle = lin(g, 0, H * 0.73, 0, H, [[0, '#f8fbff'], [1, '#d3deef']]); g.beginPath(); g.moveTo(0, H); ridge.forEach(([x, y]) => g.lineTo(W * x, H * y)); g.lineTo(W, H); g.closePath(); g.fill();
        g.fillStyle = 'rgba(140,160,205,.35)'; g.beginPath(); g.moveTo(W * 0.44, H * 0.735); g.lineTo(W * 0.5, H * 0.75); g.lineTo(W * 0.62, H * 0.79); g.lineTo(W * 0.78, H * 0.84); g.lineTo(W, H * 0.9); g.lineTo(W, H); g.lineTo(W * 0.6, H); g.closePath(); g.fill();
        g.fillStyle = '#4a4f68'; for (const [x, y, w] of [[0.1, 0.9, 40], [0.24, 0.85, 26], [0.7, 0.86, 34], [0.88, 0.92, 46]]) { g.beginPath(); g.moveTo(W * x - w, H * y + 12); g.lineTo(W * x - w * 0.3, H * y - 6); g.lineTo(W * x + w * 0.4, H * y - 2); g.lineTo(W * x + w, H * y + 12); g.closePath(); g.fill(); } },
      frame(g, W, H, tm, s) {
        const br = breath(tm), rise = Math.min(1, tm / 150000), sy = H * (0.49 - rise * 0.06);   /* the sun clears the sea of cloud and keeps rising, slowly */
        glow(g, W * 0.5, sy, Math.min(W, H) * (0.34 + br * 0.08), '255,200,140', 0.65); g.fillStyle = '#ffe2a6'; g.beginPath(); g.arc(W * 0.5, sy, Math.min(W, H) * 0.055, 0, 7); g.fill();
        for (const p of s.puffs) { p.x += p.v * 0.016; if (p.x > W + 120) p.x = -120; puff(g, p.x, p.y, p.r, 'rgba(255,240,236,.82)'); }
        const e = s.eagle, ex = W * 0.3 + Math.cos(tm * 0.00012 + e.k) * W * 0.22, ey = H * 0.25 + Math.sin(tm * 0.00024 + e.k) * H * 0.05; g.strokeStyle = 'rgba(50,40,60,.75)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(ex - 18, ey - 3); g.quadraticCurveTo(ex - 8, ey - 6, ex, ey); g.quadraticCurveTo(ex + 8, ey - 6, ex + 18, ey - 3); g.stroke();
        /* pennants strung from a pole on the top to a pole further down the ridge */
        const p0 = [W * 0.45, H * 0.735], p1 = [W * 0.8, H * 0.845], t0 = [p0[0], H * 0.5], t1 = [p1[0], H * 0.6]; g.strokeStyle = '#3a3a4a'; g.lineWidth = 4; g.beginPath(); g.moveTo(...p0); g.lineTo(...t0); g.stroke(); g.beginPath(); g.moveTo(...p1); g.lineTo(...t1); g.stroke();
        const sag = H * 0.025, at = t => [t0[0] + (t1[0] - t0[0]) * t, t0[1] + (t1[1] - t0[1]) * t + Math.sin(t * Math.PI) * sag];
        g.lineWidth = 1.2; g.strokeStyle = 'rgba(60,60,80,.8)'; g.beginPath(); for (let k = 0; k <= 20; k++) g.lineTo(...at(k / 20)); g.stroke();
        const COLS = ['#e8546b', '#ffd25a', '#4fb3ff', '#7bdc8a', '#ff9a4a', '#b48cff'];
        for (let k = 1; k < 16; k++) { const [x, y] = at(k / 16), fl = Math.sin(tm * 0.006 + k * 0.9) * 4; g.fillStyle = COLS[k % COLS.length]; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.lineTo(x + fl, y + 17); g.closePath(); g.fill(); }
        /* the snowboard planted upright and an ice axe: the way up was hard */
        const bh = H * 0.17; g.save(); g.translate(W * 0.3, H * 0.82); g.rotate(-0.1); g.fillStyle = '#2b3a6a'; g.beginPath(); g.ellipse(0, -bh * 0.48, bh * 0.15, bh * 0.52, 0, 0, 7); g.fill(); g.fillStyle = '#ff7a3a'; g.fillRect(-bh * 0.15, -bh * 0.66, bh * 0.3, bh * 0.08); g.fillStyle = '#ffd25a'; g.fillRect(-bh * 0.15, -bh * 0.5, bh * 0.3, bh * 0.04); g.fillStyle = '#1a1a2a'; g.fillRect(-bh * 0.11, -bh * 0.82, bh * 0.22, bh * 0.05); g.fillRect(-bh * 0.11, -bh * 0.3, bh * 0.22, bh * 0.05); g.restore();
        g.fillStyle = 'rgba(220,230,245,1)'; g.beginPath(); g.ellipse(W * 0.3, H * 0.82, bh * 0.2, bh * 0.05, 0, 0, 7); g.fill();
        g.save(); g.translate(W * 0.7, H * 0.825); g.rotate(0.2); g.fillStyle = '#5a4030'; g.fillRect(-3, -H * 0.11, 6, H * 0.11); g.fillStyle = '#9aa6b8'; g.beginPath(); g.moveTo(-26, -H * 0.11); g.lineTo(24, -H * 0.112); g.lineTo(22, -H * 0.1); g.lineTo(-20, -H * 0.098); g.closePath(); g.fill(); g.restore();
        g.fillStyle = 'rgba(255,255,255,.85)'; for (const f of s.snow) { f.x += f.v * 0.016; f.y += Math.sin(tm * 0.002 + f.k) * 0.3 + 0.15; if (f.x > W + 5) { f.x = -5; f.y = rnd(0, H); } g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); } } },

    /* Space: floating on a small asteroid among slowly turning stars; a ringed planet, the Earth far away, a nebula that breathes */
    space: { shadow: 'rgba(0,0,20,.8)', ground: '#05060f', sound: { space: 1, chimes: 0.7 },
      init(W, H) { const s = { stars: [], pebbles: [], shoot: null }; const R = Math.hypot(W, H) * 0.6;
        for (let i = 0; i < 260; i++) { const a = rnd(0, Math.PI * 2), r = Math.sqrt(Math.random()) * R; s.stars.push({ a, r, k: rnd(0, 6), s: rnd(0.6, 2), c: Math.random() < 0.15 ? '255,220,190' : Math.random() < 0.2 ? '190,210,255' : '255,255,255' }); }
        for (let i = 0; i < 6; i++) s.pebbles.push({ x: W * rnd(0.15, 0.85), y: H * rnd(0.55, 0.75), r: rnd(3, 9), k: rnd(0, 6) }); return s; },
      bg(g, W, H) { g.fillStyle = '#04050d'; g.fillRect(0, 0, W, H);
        g.save(); g.translate(W * 0.5, H * 0.4); g.rotate(-0.5); const band = g.createLinearGradient(0, -H * 0.18, 0, H * 0.18); band.addColorStop(0, 'rgba(120,90,200,0)'); band.addColorStop(0.5, 'rgba(170,150,230,.22)'); band.addColorStop(1, 'rgba(120,90,200,0)'); g.fillStyle = band; g.fillRect(-W, -H * 0.18, W * 2, H * 0.36); g.restore();
        glow(g, W * 0.25, H * 0.25, Math.min(W, H) * 0.35, '120,80,200', 0.2); glow(g, W * 0.75, H * 0.45, Math.min(W, H) * 0.3, '60,160,200', 0.14);
        const px = W * 0.8, py = H * 0.22, pr = Math.min(W, H) * 0.09; g.fillStyle = lin(g, px - pr, py - pr, px + pr, py + pr, [[0, '#f2d3a0'], [1, '#a0704a']]); g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
        g.strokeStyle = 'rgba(240,220,180,.6)'; g.lineWidth = pr * 0.12; g.beginPath(); g.ellipse(px, py, pr * 1.9, pr * 0.45, -0.3, 0, 7); g.stroke(); g.fillStyle = lin(g, px - pr, py - pr, px + pr, py + pr, [[0, '#f2d3a0'], [1, '#a0704a']]); g.beginPath(); g.arc(px, py, pr, Math.PI * 1.05, Math.PI * 1.95); g.fill();
        const ex = W * 0.14, ey = H * 0.18, er = Math.min(W, H) * 0.035; g.fillStyle = '#2f6fd0'; g.beginPath(); g.arc(ex, ey, er, 0, 7); g.fill(); g.fillStyle = '#5aa04a'; g.beginPath(); g.ellipse(ex - er * 0.2, ey - er * 0.1, er * 0.45, er * 0.3, 0.5, 0, 7); g.fill(); glow(g, ex, ey, er * 2.2, '120,180,255', 0.3); },
      frame(g, W, H, tm, s) {
        const rot = tm * 0.000012, cx = W * 0.5, cy = H * 0.45; for (const st of s.stars) { const a = st.a + rot, x = cx + Math.cos(a) * st.r, y = cy + Math.sin(a) * st.r; if (x < -2 || x > W + 2 || y < -2 || y > H + 2) continue; g.fillStyle = `rgba(${st.c},${0.5 + 0.45 * Math.sin(tm * 0.0012 + st.k)})`; g.fillRect(x, y, st.s, st.s); }
        const br = breath(tm); glow(g, W * 0.5, H * 0.4, Math.min(W, H) * (0.22 + br * 0.08), '200,170,255', 0.42); glow(g, W * 0.5, H * 0.4, Math.min(W, H) * 0.03, '255,250,255', 0.9);
        if (!s.shoot && Math.random() < 0.002) s.shoot = { x: rnd(0, W * 0.6), y: rnd(0, H * 0.3), t: 0 }; if (s.shoot) { const sh = s.shoot; sh.t += 0.016; const x = sh.x + sh.t * 320, y = sh.y + sh.t * 120; g.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.8 - sh.t)})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 60, y - 22); g.stroke(); if (sh.t > 1) s.shoot = null; }
        for (const p of s.pebbles) { const y = p.y + Math.sin(tm * 0.0006 + p.k) * 10; g.fillStyle = '#6a6070'; g.beginPath(); g.ellipse(p.x, y, p.r, p.r * 0.8, p.k, 0, 7); g.fill(); }
        const bob = Math.sin(tm * 0.0004) * 6, ay = H * 0.86 + bob; g.fillStyle = lin(g, 0, ay - H * 0.1, 0, H, [[0, '#8a7f90'], [1, '#3a3446']]); g.beginPath(); g.moveTo(-20, H + 20); g.lineTo(-20, ay + 10); for (let x = -20; x <= W + 20; x += 30) g.lineTo(x, ay - Math.sin(x / W * Math.PI) * H * 0.08 + Math.sin(x * 0.07) * 4); g.lineTo(W + 20, H + 20); g.closePath(); g.fill();
        for (const [x, r] of [[0.25, 22], [0.48, 14], [0.7, 26], [0.86, 12]]) { const yy = ay - Math.sin(x * Math.PI) * H * 0.08 + 18; g.fillStyle = 'rgba(40,34,52,.55)'; g.beginPath(); g.ellipse(W * x, yy, r, r * 0.35, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(200,190,210,.35)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(W * x, yy - 1, r, r * 0.35, 0, Math.PI, 2 * Math.PI); g.stroke(); } } }
  };

  function scene(cv, th) {
    const g = cv.getContext('2d'); let W = 0, H = 0, st = null; const dpr = Math.min(2, window.devicePixelRatio || 1); const bg = document.createElement('canvas'), bgc = bg.getContext('2d');
    function layout() { W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg.width = W * dpr; bg.height = H * dpr; bgc.setTransform(dpr, 0, 0, dpr, 0, 0); th.bg(bgc, W, H); st = th.init(W, H); }
    window.addEventListener('resize', layout); layout();
    function draw(tm) { if (cv.clientWidth && Math.abs(cv.clientWidth - W) > 1) layout(); g.drawImage(bg, 0, 0, W, H); th.frame(g, W, H, tm, st); }
    let raf = 0, alive = true; const loop = tm => { if (!alive) return; draw(tm); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
    return { draw, stop() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', layout); } };
  }

  /* ---------- the Zen soundscape, with the scene's own air ---------- */
  function soundscape(opt) {
    const M = window.KQMusic, c = M && M.ac ? M.ac() : (window.AudioContext ? new AudioContext() : null); if (!c) return { leave(cb) { cb && cb(); } };
    if (c.state === 'suspended') c.resume();
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const master = c.createGain(); master.gain.value = 0; master.connect(c.destination); master.gain.setTargetAtTime(0.85, c.currentTime, 2.5);
    const rev = c.createConvolver(); { const n = c.sampleRate * 4.5, ir = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); } rev.buffer = ir; }
    const wet = c.createGain(); wet.gain.value = opt.space ? 0.75 : 0.55; rev.connect(wet); wet.connect(master); const dry = c.createGain(); dry.gain.value = 0.7; dry.connect(master);
    const send = node => { node.connect(dry); node.connect(rev); };
    const nodes = [], timers = [];
    /* the drone: open fifths, gently detuned pairs, swelling and settling like a slow breath (no chord changes, nothing falls) */
    const shift = opt.high ? 12 : opt.low || opt.space ? -5 : 0;
    const droneG = c.createGain(); droneG.gain.value = 0.0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = opt.under ? 420 : 700; lp.Q.value = 0.3; droneG.connect(lp); send(lp);
    for (const [m, v] of [[38, 0.5], [45, 0.35], [50, 0.3], [57, 0.16]]) for (const det of [-3, 3]) { const o = c.createOscillator(); o.type = m < 45 ? 'sine' : 'triangle'; o.frequency.value = hz(m + shift); o.detune.value = det; const gg = c.createGain(); gg.gain.value = v * 0.5; o.connect(gg); gg.connect(droneG); o.start(); nodes.push(o); }
    droneG.gain.setTargetAtTime(opt.high ? 0.07 : 0.11, c.currentTime, 4);
    const swell = c.createOscillator(), swG = c.createGain(); swell.frequency.value = 1 / 14; swG.gain.value = 0.035; swell.connect(swG); swG.connect(droneG.gain); swell.start(); nodes.push(swell);
    const fl = c.createOscillator(), flG = c.createGain(); fl.frequency.value = 1 / 23; flG.gain.value = opt.under ? 120 : 260; fl.connect(flG); flG.connect(lp.frequency); fl.start(); nodes.push(fl);
    if (opt.space) { for (const m of [81, 88]) { const o = c.createOscillator(), gg = c.createGain(); o.type = 'sine'; o.frequency.value = hz(m); gg.gain.value = 0.0; o.connect(gg); send(gg); o.start(); nodes.push(o); const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 1 / (17 + m % 7); lg.gain.value = 0.006; lfo.connect(lg); lg.connect(gg.gain); lfo.start(); nodes.push(lfo); gg.gain.setTargetAtTime(0.007, c.currentTime, 6); } }
    function bowl(m, vel, when) { const t0 = Math.max(c.currentTime, when || 0), f = hz(m), out = c.createGain(); out.gain.value = vel; send(out);
      [[1, 1, 16], [2.76, 0.45, 11], [5.4, 0.22, 7], [8.93, 0.1, 4]].forEach(([r, a, dec]) => { for (const beat of [-0.6, 0.6]) { const o = c.createOscillator(), gg = c.createGain(); o.type = 'sine'; o.frequency.value = f * r + beat; gg.gain.setValueAtTime(0.0001, t0); gg.gain.linearRampToValueAtTime(a * 0.5, t0 + 0.04); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dec); o.connect(gg); gg.connect(out); o.start(t0); o.stop(t0 + dec + 0.2); } }); }
    const CHIME = [74, 76, 78, 81, 83, 86];
    function chimes() { const n = 1 + Math.floor(Math.random() * 3), t0 = c.currentTime; for (let k = 0; k < n; k++) { const s = t0 + k * (0.25 + Math.random() * 0.5), o = c.createOscillator(), gg = c.createGain(); o.type = 'sine'; o.frequency.value = hz(CHIME[Math.floor(Math.random() * CHIME.length)]); gg.gain.setValueAtTime(0.0001, s); gg.gain.linearRampToValueAtTime(0.018, s + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, s + 3.2); o.connect(gg); send(gg); o.start(s); o.stop(s + 3.4); } }
    const nb = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    /* the scene's air: filtered noise, rising and falling very slowly */
    function air(type, freq, q, level, lfoHz, depth) { const src = c.createBufferSource(); src.buffer = nb; src.loop = true; src.playbackRate.value = 0.7 + Math.random() * 0.6; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const gg = c.createGain(); gg.gain.value = level; src.connect(f); f.connect(gg); gg.connect(dry); src.start(); nodes.push(src);
      if (lfoHz) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfoHz; lg.gain.value = depth; l.connect(lg); lg.connect(gg.gain); l.start(); nodes.push(l); } return gg; }
    if (opt.brook) air('bandpass', 2200, 0.5, 0.012 * opt.brook);
    if (opt.breeze) air('lowpass', 380, 0.7, 0.02 * opt.breeze, 1 / 31, 0.014 * opt.breeze);
    if (opt.wind) { air('bandpass', 520, 0.6, 0.016 * opt.wind, 1 / 13, 0.013 * opt.wind); air('lowpass', 260, 0.7, 0.02 * opt.wind, 1 / 29, 0.012 * opt.wind); }
    if (opt.waves) air('lowpass', 900, 0.5, 0.03 * opt.waves, 1 / 10, 0.028 * opt.waves);   /* one wave about every ten seconds: the breath of the beach */
    if (opt.under) air('lowpass', 180, 0.8, 0.05 * opt.under, 1 / 19, 0.02);
    if (opt.city) air('lowpass', 220, 0.5, 0.018 * opt.city, 1 / 37, 0.008);
    if (opt.fountain) air('bandpass', 3200, 0.4, 0.01 * opt.fountain, 1 / 7, 0.004);
    function bird() { const t0 = c.currentTime; for (let k = 0; k < 2; k++) { const o = c.createOscillator(), gg = c.createGain(), f = 2400 + Math.random() * 900, s = t0 + k * 0.18; o.frequency.setValueAtTime(f, s); o.frequency.linearRampToValueAtTime(f * 1.12, s + 0.12); gg.gain.setValueAtTime(0.0001, s); gg.gain.linearRampToValueAtTime(0.008, s + 0.03); gg.gain.exponentialRampToValueAtTime(0.0001, s + 0.16); o.connect(gg); send(gg); o.start(s); o.stop(s + 0.2); } }
    function drip() { const t0 = c.currentTime, o = c.createOscillator(), gg = c.createGain(), f = 900 + Math.random() * 900; o.type = 'sine'; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.6, t0 + 0.06); gg.gain.setValueAtTime(0.0001, t0); gg.gain.linearRampToValueAtTime(0.03, t0 + 0.005); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25); o.connect(gg); send(gg); o.start(t0); o.stop(t0 + 0.3); }
    function bubble() { const t0 = c.currentTime, n = 2 + Math.floor(Math.random() * 4); for (let k = 0; k < n; k++) { const s = t0 + k * 0.09, o = c.createOscillator(), gg = c.createGain(), f = 300 + Math.random() * 500; o.type = 'sine'; o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * 2.2, s + 0.08); gg.gain.setValueAtTime(0.0001, s); gg.gain.linearRampToValueAtTime(0.012, s + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, s + 0.1); o.connect(gg); send(gg); o.start(s); o.stop(s + 0.12); } }
    const BOWLS = [50, 57, 62, 64, 69].map(m => m + (opt.low ? -5 : 0)); let last = -1;
    const nextBowl = () => { let i; do { i = Math.floor(Math.random() * BOWLS.length); } while (i === last); last = i; bowl(BOWLS[i], 0.11 + Math.random() * 0.04); timers.push(setTimeout(nextBowl, 15000 + Math.random() * 12000)); };
    timers.push(setTimeout(nextBowl, 3500));
    const loopEvery = (fn, p, a, b, first) => { const go = () => { if (Math.random() < p) fn(); timers.push(setTimeout(go, a + Math.random() * (b - a))); }; timers.push(setTimeout(go, first)); };
    const cr = opt.chimes == null ? 1 : opt.chimes; if (cr > 0) loopEvery(chimes, Math.min(1, 0.7 * cr), 9000 / Math.max(0.5, cr), 18000 / Math.max(0.5, cr), 7000);
    if (opt.bird) loopEvery(bird, 0.5 * opt.bird, 14000, 30000, 11000);
    if (opt.drips) loopEvery(drip, 0.9, 1800, 6500, 2500);
    if (opt.bubbles) loopEvery(bubble, 0.8, 3000, 9000, 2000);
    function leave(done) { timers.forEach(clearTimeout); const t0 = c.currentTime;
      const warm = c.createGain(); warm.gain.value = 0; warm.connect(lp); for (const m of [54, 57, 62, 66]) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m + shift); const gg = c.createGain(); gg.gain.value = 0.25; o.connect(gg); gg.connect(warm); o.start(); nodes.push(o); } warm.gain.setTargetAtTime(0.09, t0, 1.2);
      bowl(50 + (opt.low ? -5 : 0), 0.16, t0 + 0.2); setTimeout(() => chimes(), 1400);
      master.gain.setTargetAtTime(0.0001, t0 + 4.5, 1.4);
      setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) {} }); try { master.disconnect(); } catch (e) {} done && done(); }, 9500); }
    return { leave };
  }

  let busy = false;
  function open(o) {
    if (busy) return; busy = true; css();
    const want = (o && o.realm) || (KQ.realm && KQ.realm.id) || 'meadow', id = THEMES[want] ? want : 'meadow', th = THEMES[id];
    const root = el('div', 'md'); root.dataset.scene = id; root.style.background = th.ground; root.style.setProperty('--md-shadow', th.shadow); if (th.ink) root.style.setProperty('--md-ink', th.ink); root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', t('md_t_' + id));
    const cv = document.createElement('canvas'); root.appendChild(cv); document.body.appendChild(root);
    const sc = scene(cv, th), sound = soundscape(th.sound);
    const top = el('div', 'md-top'); const lv = el('button', 'md-leave', t('md_l_' + id)); lv.type = 'button'; top.appendChild(lv); root.appendChild(top);
    /* a few calm words, one at a time, fading in and out with long pauses */
    const word = el('div', 'md-word'); root.appendChild(word); let wi = 0; const list = t('md_w_' + id); const ws = Array.isArray(list) ? list : [];
    const wt = []; const show = () => { if (!ws.length) return; word.textContent = ws[wi++ % ws.length]; word.classList.add('on'); wt.push(setTimeout(() => word.classList.remove('on'), 7000)); wt.push(setTimeout(show, 20000)); };
    wt.push(setTimeout(show, 6000));
    const bye = el('div', 'md-bye'); bye.appendChild(el('p', null, t('md_b_' + id))); bye.appendChild(el('p', null, t('md_bye2'))); root.appendChild(bye);
    let leaving = false;
    lv.onclick = () => { if (leaving) return; leaving = true; wt.forEach(clearTimeout); word.classList.remove('on'); lv.style.visibility = 'hidden'; bye.classList.add('on');
      sound.leave(() => {}); setTimeout(() => root.classList.add('gone'), 6500); setTimeout(() => { sc.stop(); root.remove(); busy = false; }, 9200); };
    return { root, scene: sc };
  }
  window.KQMeditate = { open, themes: Object.keys(THEMES) };
})();
