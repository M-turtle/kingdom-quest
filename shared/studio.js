/* Kingdom Quest — the Doll Studio (Yoni 2026-09-27: 'a doll, like an LOL … a ruler on a shelf on the side … they teach you the centimetre
   and the inch … they tell you the doll's sizes, you make the ruler exactly that number and cut it with scissors … put it on the doll …
   shoes from plastic … less asking questions, more actually doing it with an actual ruler … understand radius and how to measure things
   that are not a straight line — explain the logic and show examples first, then ask them to measure').

   A game of the Games Arcade (first built as the Fashion Kingdom's fifth place), played at a crafting desk: a big-headed doll on her stand, a 20 cm ruler, a strip of fabric, tailor's
   chalk, scissors, a spool of string, a pin compass and a sheet of shoe plastic. Nothing is multiple choice: the child lines the fabric up
   with 0, slides the chalk to the size on the order card, cuts, and dresses the doll — a wrong length shows on the doll (too short, trailing
   on the floor) and gets trimmed or cut again. Round things are measured by wrapping a string and laying it straight on the ruler; circles
   are drawn with a pin, a string and chalk at a radius. Three short lessons with worked examples come first (the ruler; around a curve;
   circles and the radius), and the orders climb with the child's level: whole centimetres → lining up at 0 → curves → half centimetres
   and circles → millimetres and diameters → π. Tasks are in centimetres (inches appear in the ruler lesson only — Yoni's choice).

   One of the Games Arcade's games (shared/arcade.js): it registers the 'fa_studio' hall and the 'studio' stage; the hub loads this file
   when the game is picked, rooms3d runs the stage, the hub calls stage.play and banks the result. */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2;
  const CM = 0.3;                          /* world units per centimetre: the desk, the doll and the ruler share one scale */
  const R0X = -2.1, RZ = 2.25, RW = 3.6;   /* the ruler: 0 cm at x = R0X, lying along +x at z = RZ, 3.6 cm wide (cm edge at the back) */
  const FZ = RZ - RW * CM / 2 - 1.3 * CM;  /* the fabric strip's centre line, its front edge against the ruler's cm edge */
  const FW = 2.6;                          /* the strip is 2.6 cm wide */
  const xOf = cm => R0X + cm * CM, cmOf = x => (x - R0X) / CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const PASTEL = [0xff8fb8, 0x8fd0f0, 0xc0a0ff, 0xffcf6a, 0x7fdcb0, 0xff9f90];
  const hexStr = c => '#' + new T.Color(c).getHexString();
  const fmt = (v, dp) => { const s = (Math.round(v * 10) / 10).toFixed(dp == null ? (Math.abs(v - Math.round(v)) > 1e-6 ? 1 : 0) : dp); return s; };

  /* ---------------------------------------------------------------- the controls' look (the room's own DOM layer: Leave, pips) */
  (function css() { if (document.getElementById('sd-css')) return; const st = document.createElement('style'); st.id = 'sd-css'; st.textContent = `
.sd-ui{position:absolute; inset:0; z-index:6; pointer-events:none; font-family:var(--font-body, Rubik, sans-serif)}
.sd-bar{position:absolute; left:50%; bottom:calc(18px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); display:flex; gap:10px; align-items:center; pointer-events:auto}
.sd-bar .btn{font-size:clamp(16px,2.2vw,20px); padding:12px 22px; min-width:120px; box-shadow:0 8px 22px rgba(0,0,0,.28)} .sd-bar .btn[hidden]{display:none}
.sd-bar .sd-help{min-width:0; width:48px; height:48px; padding:0; border-radius:50%; font:900 24px var(--font-body, Rubik, sans-serif); color:#3a1a44; background:rgba(255,250,236,.95); border:2px solid var(--gold-2, #d8b04a)}
.sd-pad{position:absolute; right:18px; bottom:calc(90px + env(safe-area-inset-bottom,0px)); width:228px; padding:12px; border-radius:20px; pointer-events:auto; background:rgba(28,22,44,.72); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); box-shadow:inset 0 0 0 1px rgba(255,220,150,.4), 0 14px 34px rgba(0,0,0,.35)}
.sd-pick{position:absolute; right:18px; top:50%; transform:translateY(-50%); width:252px; padding:12px; border-radius:20px; pointer-events:auto; background:rgba(28,22,44,.74); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); box-shadow:inset 0 0 0 1.5px rgba(242,193,78,.6), 0 12px 30px rgba(0,0,0,.35)}
[dir=rtl] .sd-pick{right:auto; left:18px}
.sd-pick .sd-tabs{display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px} .sd-pick .sd-tab{height:42px; border:0; border-radius:12px; background:rgba(255,255,255,.12); color:#f4ecff; font:800 16px var(--font-body, Rubik, sans-serif); cursor:pointer}
.sd-pick .sd-tab.on{background:linear-gradient(180deg,#ffe08a,#f2b84a); color:#3a1a44; box-shadow:0 3px 0 #b8862a}
.sd-pick .sd-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:8px} .sd-pick .sd-sw{aspect-ratio:1; border-radius:50%; border:3px solid rgba(255,255,255,.35); cursor:pointer; background-position:center; box-shadow:inset 0 -3px 6px rgba(0,0,0,.18)}
.sd-pick .sd-grid.pats .sd-sw{border-radius:12px} .sd-pick .sd-sw.on{border-color:#ffe08a; box-shadow:0 0 0 3px rgba(255,224,138,.55), inset 0 -3px 6px rgba(0,0,0,.18); transform:scale(1.06)}
@media (max-width:760px){ .sd-pick{left:50%; right:auto; top:auto; bottom:calc(84px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); width:min(340px,92vw); padding:10px} [dir=rtl] .sd-pick{left:50%} .sd-pick .sd-grid{grid-template-columns:repeat(7,1fr); gap:6px} .sd-pick .sd-tab{height:36px; font-size:14px} }
.sd-pad[hidden]{display:none} .sd-pad .sd-disp{direction:ltr; display:flex; align-items:baseline; justify-content:center; gap:8px; height:54px; margin-bottom:10px; border-radius:12px; background:#fffaf0; color:#2a1a30; font:900 34px var(--font-body, Rubik, sans-serif); box-shadow:inset 0 2px 6px rgba(0,0,0,.18)}
.sd-pad .sd-disp small{font-size:18px; color:#7a6a80} .sd-pad .sd-disp b{min-width:1ch} .sd-pad .sd-disp b:empty::before{content:'?'; color:#c9bccf}
.sd-pad .sd-keys{direction:ltr; display:grid; grid-template-columns:repeat(3,1fr); gap:8px} .sd-pad button{height:48px; border:0; border-radius:12px; background:#fff3dc; color:#2a1a30; font:900 22px var(--font-body, Rubik, sans-serif); cursor:pointer; box-shadow:0 3px 0 #d8b98a} .sd-pad button:active{transform:translateY(2px); box-shadow:0 1px 0 #d8b98a}
.sd-pad .sd-ok{grid-column:1 / -1; background:linear-gradient(180deg,#ffe08a,#f2b84a); box-shadow:0 3px 0 #b8862a} .sd-pad .sd-dot[disabled]{opacity:.35}
.sd-pad.bad .sd-disp{animation:sdShake .35s} @keyframes sdShake{25%{transform:translateX(-6px)} 75%{transform:translateX(6px)}}
@media (max-width:760px){ .sd-pad{left:50%; right:auto; transform:translateX(-50%); bottom:calc(84px + env(safe-area-inset-bottom,0px)); width:min(330px,92vw); padding:10px} .sd-pad .sd-keys{grid-template-columns:repeat(6,1fr); gap:6px} .sd-pad button{height:44px; font-size:20px} .sd-pad .sd-ok{grid-column:auto / span 2} .sd-pad .sd-disp{height:46px; font-size:28px; margin-bottom:8px} .sd-bar .btn{padding:11px 18px; min-width:104px} }
`; document.head.appendChild(st); })();

  /* ---------------------------------------------------------------- textures */
  const canvasTex = (w, h, paint, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
  const FONT = '"Rubik", "Arial Hebrew", sans-serif';
  /* the ruler's face: centimetres and millimetres along the back edge (next to the fabric), inches along the front; 180 px per cm */
  const RULER_CM = 21.6, PXC = 180, RM = 0.8;   /* the face runs 0.8 cm past each end */
  let rulerTexCache = null;
  function rulerTex() { if (rulerTexCache) return rulerTexCache; const W = Math.round(RULER_CM * PXC), H = Math.round(RW * PXC);
    const tx = canvasTex(W, H, (g) => {
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fffdf6'); bg.addColorStop(1, '#f6eedc'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
      const X = cm => (RM + cm) * PXC; g.fillStyle = '#2a2320'; g.textAlign = 'center'; g.textBaseline = 'top';
      for (let mm = 0; mm <= 200; mm++) { const big = mm % 10 === 0, half = mm % 5 === 0, h = big ? 170 : half ? 118 : 72, w = big ? 7 : half ? 5 : 3.2; g.fillRect(X(mm / 10) - w / 2, 0, w, h); }
      g.font = '800 66px ' + FONT; for (let c = 0; c <= 20; c++) g.fillText(String(c), X(c), 182);
      g.font = '700 38px ' + FONT; g.fillStyle = '#8a3a5a'; g.textAlign = 'left'; g.fillText('cm', X(20) + 26, 186);
      g.fillStyle = 'rgba(42,35,32,.12)'; g.fillRect(PXC * 0.5, H * 0.5 - 2, W - PXC, 4);   /* a faint seam between the two scales */
      const IN = 2.54 * PXC; g.fillStyle = '#2f4468'; g.textAlign = 'center'; g.textBaseline = 'bottom';
      for (let e = 0; e * IN / 8 <= 20 * PXC + 1; e++) { const x = RM * PXC + e * IN / 8, k = e % 8 === 0 ? 150 : e % 4 === 0 ? 108 : e % 2 === 0 ? 78 : 52, w = e % 8 === 0 ? 7 : e % 4 === 0 ? 5 : 3.2; g.fillRect(x - w / 2, H - k, w, k); }
      g.font = '800 58px ' + FONT; for (let i = 0; i * IN <= 20 * PXC + 1; i++) g.fillText(String(i), RM * PXC + i * IN, H - 160);
      g.font = '700 38px ' + FONT; g.fillStyle = '#2f4468'; g.textAlign = 'left'; g.fillText('inch', RM * PXC + 7 * IN + 40, H - 166);
    });
    tx.generateMipmaps = true; tx.minFilter = T.LinearMipmapLinearFilter; return (rulerTexCache = tx); }
  /* fabrics: dots, stripes, gingham, flowers, hearts, plain weave */
  const FAB = ['dots', 'stripes', 'gingham', 'flowers', 'hearts', 'plain'];
  /* the child's own choice before each piece (Yoni 2026-09-28: 'one button that says colors and one button that says patterns') */
  const CHOICE_COLS = [0xff8fb8, 0xff4f9a, 0xe8343a, 0xff9a4a, 0xffcf6a, 0x7fdcb0, 0x3ab87a, 0x8fd0f0, 0x3a7ad8, 0xc0a0ff, 0x8a4ad8, 0x2a2430, 0xf8f4ee, 0xd8b04a];
  const CHOICE_PATS = ['plain', 'dots', 'stripes', 'gingham', 'flowers', 'hearts', 'stars', 'leopard', 'zigzag', 'sparkle'];
  const fabCache = {};
  function fabricTex(col, kind) { const key = col + ':' + kind; if (fabCache[key]) return fabCache[key];
    return (fabCache[key] = canvasTex(256, 256, (g, w, h) => { g.fillStyle = hexStr(col); g.fillRect(0, 0, w, h); const hi = 'rgba(255,255,255,0.62)';
      if (kind === 'dots') { g.fillStyle = hi; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(32 + x * 64 + (y % 2) * 32, 32 + y * 64, 11, 0, TAU); g.fill(); } }
      else if (kind === 'stripes') { g.fillStyle = hi; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 22, 256); }
      else if (kind === 'gingham') { g.fillStyle = 'rgba(255,255,255,0.38)'; for (let i = 0; i < 256; i += 64) { g.fillRect(i, 0, 32, 256); g.fillRect(0, i, 256, 32); } }
      else if (kind === 'flowers') { for (let k = 0; k < 6; k++) { const cx = 40 + (k % 3) * 88 + (k > 2 ? 44 : 0), cy = 56 + (k > 2 ? 128 : 0); g.fillStyle = hi; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 10, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,214,90,0.95)'; g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill(); } }
      else if (kind === 'hearts') { g.fillStyle = hi; for (let k = 0; k < 8; k++) { const cx = 32 + (k % 4) * 64, cy = 40 + Math.floor(k / 4) * 128 + (k % 2) * 40, s = 12; g.beginPath(); g.moveTo(cx, cy + s); g.bezierCurveTo(cx + s * 1.8, cy - s * 0.2, cx + s * 0.8, cy - s * 1.5, cx, cy - s * 0.5); g.bezierCurveTo(cx - s * 0.8, cy - s * 1.5, cx - s * 1.8, cy - s * 0.2, cx, cy + s); g.fill(); } }
      else if (kind === 'stars') { g.fillStyle = hi; for (let k = 0; k < 8; k++) { const cx = 32 + (k % 4) * 64, cy = 36 + Math.floor(k / 4) * 128 + (k % 2) * 56, r1 = 14, r2 = 6; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? r2 : r1; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); } }
      else if (kind === 'leopard') { let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) { const cx = gx * 64 + 32 + (rnd() - 0.5) * 30 + (gy % 2) * 20, cy = gy * 64 + 32 + (rnd() - 0.5) * 30, r = 11 + rnd() * 6;   /* rosettes: broken dark rings round a warmer centre */
          g.fillStyle = 'rgba(150,90,40,0.35)'; g.beginPath(); g.ellipse(cx, cy, r * 0.8, r * 0.65, rnd() * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(40,24,16,0.9)'; const n = 4 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) { const a = k / n * TAU + rnd() * 0.5; g.beginPath(); g.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, 4 + rnd() * 3, 2.5 + rnd() * 1.5, a + PI / 2, 0, TAU); g.fill(); } }
        g.fillStyle = 'rgba(40,24,16,0.85)'; for (let k = 0; k < 18; k++) { g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 2 + rnd() * 2.5, 0, TAU); g.fill(); } }
      else if (kind === 'zigzag') { g.strokeStyle = hi; g.lineWidth = 12; g.lineJoin = 'round'; for (let y = 24; y < 256; y += 64) { g.beginPath(); for (let x = -32; x <= 288; x += 32) g.lineTo(x, y + ((x / 32) % 2 ? 16 : -16)); g.stroke(); } }
      else if (kind === 'sparkle') { for (let i = 0; i < 70; i++) { const x = (i * 71) % 256, y = (i * 113) % 256, r = 1.5 + (i % 4); g.fillStyle = i % 3 ? 'rgba(255,255,255,0.9)' : 'rgba(255,236,150,0.95)'; g.beginPath(); g.moveTo(x, y - r * 2); g.lineTo(x + r * 0.5, y); g.lineTo(x, y + r * 2); g.lineTo(x - r * 0.5, y); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x - r * 2, y); g.lineTo(x, y + r * 0.5); g.lineTo(x + r * 2, y); g.lineTo(x, y - r * 0.5); g.closePath(); g.fill(); } }
      else { g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 400; i++) g.fillRect((i * 37) % 256, (i * 61) % 256, 2, 2); }
      g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 1; for (let i = 0; i < 256; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); } }, [1, 1])); }
  /* the cutting mat: soft rose with a very faint centimetre grid (the ruler does the measuring, not the mat) */
  const matTex = () => canvasTex(1024, 640, (g, w, h) => { g.fillStyle = '#f7d9e3'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,80,110,.10)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.strokeStyle = 'rgba(160,80,110,.35)'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); });
  const wallTex = () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fbe6ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6d3e0'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 28, h); g.fillStyle = 'rgba(255,255,255,.8)'; for (let y = 16; y < h; y += 64) for (let x = 46; x < w; x += 64) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); } }, [10, 5]);
  /* the soft tailor's tape (the lesson's 'ruler that bends'): yellow with a centimetre scale */
  const tapeTex = () => canvasTex(2048, 96, (g, w, h) => { g.fillStyle = '#ffd84a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2320'; const px = w / 21; for (let mm = 0; mm <= 210; mm++) { const big = mm % 10 === 0; g.fillRect(mm * px / 10, 0, big ? 3 : 1.5, big ? 40 : mm % 5 === 0 ? 28 : 16); } g.font = '800 34px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'bottom'; for (let c = 1; c <= 20; c++) g.fillText(String(c), c * px, h - 6); });

  /* ================================================================ the doll
     An original big-headed fashion doll (huge glossy eyes, space buns, a small round body). She is built in real centimetres inside a
     group scaled by CM, from her measurements: the waist she has IS the waist the string wraps, the foot the ruler reads IS her foot.
     m = { waist: circumference, foot: length, instep: circumference round the middle of the foot } (cm). */
  const V2 = pts => pts.map(p => new T.Vector2(p[0], p[1]));
  function physical(c, o) { return new T.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.5 }, o || {})); }
  /* shoe plastic: glossy, in the chosen colour, with the chosen pattern printed on it */
  const plasticM = fab => fab.kind && fab.kind !== 'plain' ? physical(0xffffff, { map: fabricTex(fab.col, fab.kind), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }) : physical(fab.col, { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  /* candy-bright hair that never matches her skin (the peach one read as bald), vivid irises, glossy lips, eyeshadow */
  const SKINS = [0xf6d2bc, 0xeab894, 0xc98e66, 0x9a6444, 0x6e442c], HAIRS = [0xff4fa3, 0xa77bff, 0x3ec9d6, 0x7a3fe0, 0xffc93a, 0x5a3420, 0x17141c, 0x3a8dff], IRIS = [0x7a5aff, 0x3a8aff, 0x1fa890, 0x3a9a4a, 0x8a5a2a, 0x5a4ad8, 0xff5fae];
  const LIPS = [0xff3f86, 0xe0306a, 0xff5a6e, 0xc2185b], LIDS = [0xc79bff, 0xff9ccf, 0x8fd7f0, 0xffb38a], SUITS = [0xff8fb8, 0x8fd0f0, 0xc0a0ff, 0x7fdcb0, 0xff9f90, 0xffe07a];
  /* a leotard whose colour stands apart from her hair (a cream suit under pale hair made her one colour) */
  const suitFor = hair => { const h = {}, o = {}; new T.Color(hair).getHSL(h); const pool = SUITS.slice().sort(() => Math.random() - 0.5); return pool.find(c => { new T.Color(c).getHSL(o); const d = Math.abs(o.h - h.h); return h.s < 0.3 || Math.min(d, 1 - d) > 0.17; }) || pool[0]; };
  /* ---- the painted face (L.O.L. style, Yoni 2026-09-28: 'it still looks weird … not like the LOL dolls'). Like the real toy's, her
     face is painted on: canvases drawn in centimetres (y up) that decals on the head's own surface carry. ---- */
  const rgba = (c, al) => { const h = new T.Color(c).getHexString(); return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + al + ')'; };
  const paintCm = (W, H, box, draw) => canvasTex(W, H, g => { const sx = W / (box.x1 - box.x0), sy = H / (box.y1 - box.y0); g.setTransform(sx, 0, 0, -sy, -box.x0 * sx, box.y1 * sy); g.lineJoin = 'round'; g.lineCap = 'round'; draw(g); });
  const EYES = { x0: -4.9, x1: 4.9, y0: -2.95, y1: 2.5, cx: 2.36, cy: -0.55, rx: 1.72, ry: 2.0, tilt: 0.07 }, MOUTH = { x0: -1.5, x1: 1.5, y0: -4.95, y1: -3.45 }, CHEEK = { x0: -4.4, x1: 4.4, y0: -3.95, y1: -2.0 };
  /* huge glossy eyes: the iris nearly fills the eye, a big dark pupil, two glints from one light, a thick winged liner and three big lashes */
  function eyesTex(look, shut) { const E = EYES, ink = '#160f1b', ir = new T.Color(look.iris), irisDark = rgba(ir.clone().multiplyScalar(0.3), 1), irisMid = rgba(ir, 1), irisLight = rgba(ir.clone().lerp(new T.Color(0xffffff), 0.55), 1);
    return paintCm(1024, 576, E, g => {
      for (const s of [-1, 1]) { const cx = s * E.cx, cy = E.cy, rx = E.rx, ry = E.ry, a = s * E.tilt, ca = Math.cos(a), sa = Math.sin(a);
        const P = th => new T.Vector2(cx + rx * Math.cos(th) * ca - ry * Math.sin(th) * sa, cy + rx * Math.cos(th) * sa + ry * Math.sin(th) * ca);
        const N = th => { const nx = Math.cos(th) / rx, ny = Math.sin(th) / ry, l = Math.hypot(nx, ny); return new T.Vector2((nx * ca - ny * sa) / l, (nx * sa + ny * ca) / l); };
        const up = f => s > 0 ? PI * (1 - f) : PI * f, lo = f => s > 0 ? PI * (1 + f) : -PI * f;   /* upper / lower lid, from the inner corner (by the nose) to the outer one */
        const sg = g.createRadialGradient(cx + s * 0.25, cy + ry * 0.62, 0.1, cx + s * 0.25, cy + ry * 0.62, rx * 1.4); sg.addColorStop(0, rgba(look.lid, 0.62)); sg.addColorStop(1, rgba(look.lid, 0));
        g.save(); g.beginPath(); g.rect(cx - 3, cy + ry * 0.3, 6, 4); g.clip(); g.fillStyle = sg; g.beginPath(); g.ellipse(cx + s * 0.22, cy + ry * 0.55, rx * 1.42, ry * 0.92, a, 0, TAU); g.fill(); g.restore();   /* eyeshadow on the upper lid only (round the whole eye it read as a smudge) */
        g.fillStyle = rgba(new T.Color(look.hair).lerp(new T.Color(0x2a1a20), 0.45), 0.92); const b0 = [cx - s * 1.0, cy + ry + 0.42], b1 = [cx + s * 0.28, cy + ry + 0.82], b2 = [cx + s * 1.5, cy + ry + 0.52];
        g.beginPath(); g.moveTo(b0[0], b0[1] - 0.05); g.quadraticCurveTo(b1[0], b1[1] + 0.12, b2[0], b2[1]); g.quadraticCurveTo(b1[0], b1[1] - 0.05, b0[0], b0[1] + 0.08); g.closePath(); g.fill();   /* thin, high, softly arched brows */
        if (shut) {   /* a blink: the closed lid's lash line curving down, two lashes at the outer end */
          const A = P(up(0)), B = P(up(1)), at = f => [A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f - 0.42 * Math.sin(PI * f) - 0.35];
          g.strokeStyle = ink; g.lineWidth = 0.2; g.beginPath(); for (let i = 0; i <= 24; i++) { const [x, y] = at(i / 24); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          g.lineWidth = 0.11; for (const [f, d] of [[0.72, 0.5], [0.9, 0.6]]) { const [x, y] = at(f); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 0.12, y - d * 0.6, x + s * 0.34, y - d); g.stroke(); }
          continue; }
        g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, a, 0, TAU); g.fillStyle = '#fbf8f6'; g.fill(); g.clip();
        const ix = cx + s * 0.05, iy = cy - 0.08, irx = rx * 0.88, iry = ry * 0.86;
        const ig = g.createRadialGradient(ix, iy - iry * 0.5, iry * 0.05, ix, iy - iry * 0.12, iry * 1.08); ig.addColorStop(0, irisLight); ig.addColorStop(0.5, irisMid); ig.addColorStop(1, irisDark);
        g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, irx, iry, a, 0, TAU); g.fill();   /* the iris: lighter below, where the light bounces in */
        g.save(); g.globalAlpha = 0.3; g.strokeStyle = irisLight; g.lineWidth = 0.035; for (let k = 0; k < 30; k++) { const t2 = k / 30 * TAU; g.beginPath(); g.moveTo(ix + Math.cos(t2) * irx * 0.55, iy + Math.sin(t2) * iry * 0.55); g.lineTo(ix + Math.cos(t2) * irx * 0.93, iy + Math.sin(t2) * iry * 0.93); g.stroke(); } g.restore();
        g.strokeStyle = irisDark; g.lineWidth = 0.11; g.beginPath(); g.ellipse(ix, iy, irx, iry, a, 0, TAU); g.stroke();
        const pg = g.createRadialGradient(ix, iy, 0.05, ix, iy, irx * 0.56); pg.addColorStop(0, '#000000'); pg.addColorStop(1, '#1a0d1f'); g.fillStyle = pg; g.beginPath(); g.ellipse(ix, iy + 0.04, irx * 0.54, iry * 0.56, a, 0, TAU); g.fill();   /* a big dark pupil */
        const lid = g.createLinearGradient(0, cy + ry, 0, cy + ry * 0.15); lid.addColorStop(0, 'rgba(60,30,70,0.55)'); lid.addColorStop(1, 'rgba(60,30,70,0)'); g.fillStyle = lid; g.fillRect(cx - rx - 0.1, cy - ry, rx * 2 + 0.2, ry * 2 + 0.1);   /* the upper lid's shadow */
        g.fillStyle = 'rgba(255,255,255,0.96)'; g.beginPath(); g.ellipse(ix - irx * 0.36, iy + iry * 0.34, irx * 0.3, iry * 0.25, -0.5, 0, TAU); g.fill();   /* one light for both eyes: a big soft glint top-left */
        g.beginPath(); g.arc(ix + irx * 0.36, iy - iry * 0.4, irx * 0.14, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(ix - irx * 0.05, iy - iry * 0.08, irx * 0.06, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 0.07; g.beginPath(); g.ellipse(ix, iy, irx * 0.74, iry * 0.74, 0, -PI * 0.44, -PI * 0.1); g.stroke();
        g.restore();
        g.strokeStyle = 'rgba(80,36,64,0.5)'; g.lineWidth = 0.05; g.beginPath(); for (let i = 0; i <= 16; i++) { const q = P(lo(0.3 + 0.7 * i / 16)); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); } g.stroke();   /* a soft lower lid */
        const n = 28, outer = [], inner = []; for (let i = 0; i <= n; i++) { const f = i / n, th = up(f), p = P(th), nn = N(th), w = 0.1 + 0.28 * Math.pow(f, 1.3); outer.push(p.clone().addScaledVector(nn, w)); inner.push(p.clone().addScaledVector(nn, -0.04)); }
        const oc = P(up(1)), tip = new T.Vector2(oc.x + s * 0.78, oc.y + 0.6); g.fillStyle = ink; g.beginPath(); g.moveTo(inner[0].x, inner[0].y); for (const q of inner) g.lineTo(q.x, q.y); g.lineTo(tip.x, tip.y); for (let i = n; i >= 0; i--) g.lineTo(outer[i].x, outer[i].y); g.closePath(); g.fill();   /* the thick winged liner */
        for (const [f, len] of [[0.56, 0.62], [0.72, 0.8], [0.88, 0.92]]) { const p = P(up(f)), nn = N(up(f)), base = p.clone().addScaledVector(nn, 0.06 + 0.28 * Math.pow(f, 1.3)), dir = nn.clone().rotateAround(new T.Vector2(), -s * 0.6), tp = base.clone().addScaledVector(dir, len), side = new T.Vector2(-dir.y, dir.x).multiplyScalar(0.1), ctl = base.clone().addScaledVector(dir, len * 0.55).add(new T.Vector2(s * 0.2, 0));
          g.beginPath(); g.moveTo(base.x - side.x, base.y - side.y); g.quadraticCurveTo(ctl.x, ctl.y, tp.x, tp.y); g.quadraticCurveTo(ctl.x, ctl.y, base.x + side.x, base.y + side.y); g.closePath(); g.fill(); }   /* three big lashes at the outer corner */
      } }); }
  /* a small glossy pout; the corners lift for a smile and drop when sad; an 'o' for wow */
  function mouthTex(look, mood) { const lip = rgba(look.lip, 1), lipD = rgba(new T.Color(look.lip).multiplyScalar(0.5), 0.9), my = -4.14;
    return paintCm(256, 128, MOUTH, g => {
      if (mood === 'wow') { g.fillStyle = '#5a1328'; g.beginPath(); g.ellipse(0, my - 0.08, 0.36, 0.44, 0, 0, TAU); g.fill(); g.fillStyle = '#ff7f9f'; g.beginPath(); g.ellipse(0, my - 0.34, 0.22, 0.12, 0, 0, TAU); g.fill();
        g.strokeStyle = lip; g.lineWidth = 0.15; g.beginPath(); g.ellipse(0, my - 0.08, 0.41, 0.49, 0, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(0.16, my - 0.5, 0.1, 0.04, -0.2, 0, TAU); g.fill(); return; }
      const w = mood === 'sad' ? 0.5 : 0.68, cu = mood === 'sad' ? -0.13 : 0.1;
      g.fillStyle = lip; g.beginPath(); g.moveTo(-w, my + cu); g.bezierCurveTo(-w * 0.62, my + 0.2, -w * 0.38, my + 0.3, -w * 0.18, my + 0.25); g.quadraticCurveTo(0, my + 0.17, w * 0.18, my + 0.25); g.bezierCurveTo(w * 0.38, my + 0.3, w * 0.62, my + 0.2, w, my + cu); g.quadraticCurveTo(0, my - 0.02, -w, my + cu); g.fill();   /* the upper lip: a cupid's bow */
      g.beginPath(); g.moveTo(-w * 0.9, my + cu * 0.9); g.quadraticCurveTo(0, my + 0.01, w * 0.9, my + cu * 0.9); g.bezierCurveTo(w * 0.68, my - 0.36, -w * 0.68, my - 0.36, -w * 0.9, my + cu * 0.9); g.fill();   /* the fuller lower lip */
      g.strokeStyle = lipD; g.lineWidth = 0.05; g.beginPath(); g.moveTo(-w, my + cu); g.quadraticCurveTo(0, my - 0.02, w, my + cu); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(w * 0.22, my - 0.18, 0.14, 0.05, -0.15, 0, TAU); g.fill(); }); }
  const cheekTex = () => paintCm(512, 114, CHEEK, g => { for (const s of [-1, 1]) { const x = s * 3.15, y = -3.0, gr = g.createRadialGradient(x, y, 0.05, x, y, 1.1); gr.addColorStop(0, 'rgba(255,105,150,0.5)'); gr.addColorStop(1, 'rgba(255,105,150,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 1.15, 0.9, 0, 0, TAU); g.fill(); } });
  function buildDoll(m, look) {
    look = Object.assign({ skin: SKINS[Math.floor(Math.random() * 3)], hair: HAIRS[Math.floor(Math.random() * HAIRS.length)], iris: IRIS[Math.floor(Math.random() * IRIS.length)], lip: LIPS[Math.floor(Math.random() * LIPS.length)], lid: null, suit: null, style: Math.random() < 0.6 ? 'tails' : 'buns' }, look || {});
    if (look.suit == null) look.suit = suitFor(look.hair);
    if (look.lid == null) { const deep = SKINS.indexOf(look.skin) >= 3, pool = deep ? [0xff4fb8, 0xa46bff, 0xffc24a, 0x3ec9d6] : LIDS; look.lid = pool[Math.floor(Math.random() * pool.length)]; }   /* richer lids on deeper skin: pastels turned chalky */
    const root = new T.Group(), body = new T.Group(); body.scale.setScalar(CM); root.add(body);
    const skin = physical(look.skin, { roughness: 0.42, sheen: 0.7, sheenRoughness: 0.5, sheenColor: new T.Color(look.skin).lerp(new T.Color(0xffe0d0), 0.7), clearcoat: 0.2, clearcoatRoughness: 0.45 });
    const hairM = physical(look.hair, { roughness: 0.34, sheen: 1, sheenRoughness: 0.28, sheenColor: new T.Color(look.hair).lerp(new T.Color(0xffffff), 0.55), clearcoat: 0.45, clearcoatRoughness: 0.2 });
    const suit = physical(new T.Color(look.suit).lerp(new T.Color(0xffffff), 0.12).getHex(), { roughness: 0.55, sheen: 0.5, sheenColor: new T.Color(0xffffff) });   /* her own soft pastel leotard: the outfit goes over it */
    const add = (g, geo, mat, x, y, z) => { const o = new T.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; g.add(o); return o; };
    const S = (g, mat, r, x, y, z, sx, sy, sz) => { const o = add(g, new T.SphereGeometry(r, 36, 24), mat, x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); return o; };
    /* her landmarks (cm): a small round body under a big head — the look of a collectable fashion doll */
    const rw = m.waist / TAU, ri = m.instep / TAU, WY = 9.2, CHY = 10.9, SHY = 11.9, NKY = 12.7, R = 5.9, HY = NKY + 0.2 + 0.95 * R;
    const D = { root, body, m, rw, ri, WY, CHY, SHY, NKY, headY: HY, HR: R, parts: {}, worn: {}, mood: 'happy', t: 0 };
    /* chubby toddler legs and round feet (the middle of each foot is a circle of exactly the measured instep) */
    for (const s of [-1, 1]) { const leg = add(body, new T.LatheGeometry(V2([[0.001, ri * 1.2], [0.92, ri * 1.3], [1.12, 2.2], [1.22, 3.3], [1.14, 4.15], [1.3, 5.4], [1.4, 6.4], [0.001, 7.0]]), 28), skin, s * 1.15, 0, 0);
      const foot = S(body, skin, 1, s * 1.15, ri, m.foot / 2 - 0.55, ri, ri, m.foot / 2); D.parts['foot' + s] = foot; }
    D.footZ = m.foot / 2 - 0.55;
    /* a round little body in her leotard; the waist is exactly the measured size (the belt and skirt are cut to it) */
    const hip = Math.max(2.25, rw * 1.04), chest = Math.max(2.12, rw * 1.02); D.chestR = chest;   /* a rounder middle when her waist is wide (radius 2.5) */
    add(body, new T.LatheGeometry(V2([[0.001, 6.1], [Math.max(1.95, hip - 0.3), 6.2], [hip, 7.0], [rw * 1.1, 8.2], [rw, WY], [rw * 1.08, 9.95], [chest, CHY], [chest - 0.04, 11.45], [1.72, SHY + 0.25], [0.85, 12.55], [0.001, 12.65]]), 48), suit);
    add(body, new T.CylinderGeometry(0.62, 0.68, 1.2, 20), skin, 0, NKY + 0.2, 0);
    for (const s of [-1, 1]) { const arm = new T.Group(); arm.position.set(s * 2.05, SHY - 0.3, 0); arm.rotation.z = s * 0.34; body.add(arm);
      S(arm, suit, 0.84, 0, 0, 0); add(arm, new T.CapsuleGeometry(0.7, 2.4, 8, 18), skin, 0, -1.8, 0); S(arm, skin, 0.8, 0, -3.55, 0.08, 1, 1.1, 0.88); D.parts['arm' + s] = arm; }   /* short, chubby arms */
    /* the head (L.O.L. style): very round, a little wider at the full cheeks, a small chin. HS maps a direction to her head's surface;
       onHead finds the surface point in front of (x, y) so the painted face and the hair sit exactly on it. */
    const head = new T.Group(); head.position.y = HY; body.add(head); D.head = head;
    const HS = u => { const cheek = Math.exp(-(((u.y + 0.42) / 0.3) ** 2)) * Math.max(0, u.z + 0.15) / 1.15, chin = u.y < -0.72 ? (u.y + 0.72) * 0.18 : 0;
      return new T.Vector3(u.x * R * 1.02 * (1 + 0.085 * cheek + chin), u.y * R * 0.98 * (1 + chin), u.z * R * 0.97 * (1 + 0.04 * cheek + chin)); };
    { const hg = new T.SphereGeometry(R, 96, 64), Pp = hg.attributes.position, u = new T.Vector3(); for (let i = 0; i < Pp.count; i++) { u.fromBufferAttribute(Pp, i).divideScalar(R); const q = HS(u); Pp.setXYZ(i, q.x, q.y, q.z); }
      hg.computeVertexNormals(); const Nn = hg.attributes.normal, seam = {}; for (let i = 0; i < Pp.count; i++) { const k = Pp.getX(i).toFixed(3) + ',' + Pp.getY(i).toFixed(3) + ',' + Pp.getZ(i).toFixed(3); (seam[k] = seam[k] || []).push(i); }
      for (const k in seam) { const ix = seam[k]; if (ix.length < 2) continue; const v = new T.Vector3(); for (const i of ix) v.add(new T.Vector3().fromBufferAttribute(Nn, i)); v.normalize(); for (const i of ix) Nn.setXYZ(i, v.x, v.y, v.z); }   /* no shading seam where the sphere closes */
      add(head, hg, skin); }
    const onHead = (x, y, lift) => { const u = new T.Vector3(x / (R * 1.02), y / (R * 0.98), 0), fit = () => { const l = u.x * u.x + u.y * u.y; if (l > 0.998) { u.x *= Math.sqrt(0.998 / l); u.y *= Math.sqrt(0.998 / l); } u.z = Math.sqrt(1 - u.x * u.x - u.y * u.y); };
      for (let i = 0; i < 10; i++) { fit(); const q = HS(u); u.x += (x - q.x) / (R * 1.02); u.y += (y - q.y) / (R * 0.98); }
      fit(); const q = HS(u); if (lift) q.addScaledVector(normalOn(q), lift); return q; };
    const normalOn = q => new T.Vector3(q.x / 1.04, q.y / 0.96, q.z / 0.94).normalize();
    /* the painted face: decals that follow the head, glossy over the eyes and lips */
    const decalGeo = (box, nx, ny) => { const geo = new T.PlaneGeometry(1, 1, nx, ny), Pp = geo.attributes.position, U = geo.attributes.uv; for (let i = 0; i < Pp.count; i++) { const q = onHead(box.x0 + (box.x1 - box.x0) * U.getX(i), box.y0 + (box.y1 - box.y0) * U.getY(i), 0.035); Pp.setXYZ(i, q.x, q.y, q.z); } geo.computeVertexNormals(); return geo; };
    const decal = (geo, map, gloss) => { const o = new T.Mesh(geo, gloss ? new T.MeshPhysicalMaterial({ map, transparent: true, depthWrite: false, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
      : new T.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 0.42, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); o.renderOrder = 2; head.add(o); return o; };
    decal(decalGeo(CHEEK, 32, 8), cheekTex(), false);   /* blush */
    { const eg = decalGeo(EYES, 56, 32); D.eyeOpen = decal(eg, eyesTex(look, false), true); D.eyeShut = decal(eg, eyesTex(look, true), true); D.eyeShut.visible = false; }
    { const mg = decalGeo(MOUTH, 16, 8); D.smile = decal(mg, mouthTex(look, 'happy'), true); D.frown = decal(mg, mouthTex(look, 'sad'), true); D.wow = decal(mg, mouthTex(look, 'wow'), true); D.frown.visible = D.wow.visible = false; }
    { const q = onHead(0, -2.95, -0.12); S(head, skin, 0.22, q.x, q.y, q.z, 1.15, 0.85, 0.8); }   /* a tiny button nose */
    /* hair: sculpted and glossy like the toy's — a cap, a thick blunt fringe of chunky locks, locks by the cheeks, and big pigtails or buns */
    { const hc = add(head, new T.SphereGeometry(R * 1.05, 96, 64), hairM, 0, 0.3, -0.62); hc.scale.set(1.03, 0.99, 0.98); }
    const lock = (x, y, lift, rx, ry, rz, spin) => { const q = onHead(x, y, lift), o = S(head, hairM, 1, q.x, q.y, q.z, rx, ry, rz); o.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), normalOn(q)); o.rotateZ(spin || 0); return o; };
    for (let i = 0; i < 11; i++) { const x = -4.2 + i * 0.84; lock(x, 3.78 - Math.abs(x) * 0.05, -0.16, 0.8, 1.32, 0.38, -x * 0.05); }   /* the blunt fringe: close-set locks, a smooth sculpted edge */
    for (const s of [-1, 1]) lock(s * 5.68, 0.1, -0.3, 0.82, 2.0, 0.45, s * 0.1);   /* a lock down by each cheek, tucked back from the eye */
    S(head, hairM, 3.9, 0, -1.9, -2.95, 1.24, 1.0, 0.55);   /* the nape */
    const tieM = physical(PASTEL[(HAIRS.indexOf(look.hair) + 2) % PASTEL.length], { roughness: 0.3, clearcoat: 0.6 });
    if (look.style === 'buns') for (const s of [-1, 1]) { const c = new T.Vector3(s * 3.25, 5.25, -0.9), bun = S(head, hairM, 2.65, c.x, c.y, c.z); D.parts['bun' + s] = bun;   /* big space buns on top, each with a scrunchie at its base */
      const dir = c.clone().sub(new T.Vector3(0, 0.3, -0.6)).normalize(), tie = add(head, new T.TorusGeometry(1.55, 0.36, 10, 30), tieM); tie.position.copy(c).addScaledVector(dir, -1.75); tie.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir); }
    else { const tail = new T.LatheGeometry(V2([[0.001, 0], [0.9, 0.35], [1.6, 1.5], [2.0, 3.2], [1.95, 5.0], [1.5, 6.7], [0.8, 8.0], [0.001, 8.6]]), 32);   /* big high pigtails with a scrunchie */
      for (const s of [-1, 1]) { const g = new T.Group(); g.position.set(s * 4.7, 3.5, -1.3); g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(s * 0.45, -0.86, -0.2).normalize());   /* out at the sides, hanging down beside her face */ head.add(g); add(g, tail, hairM); D.parts['tail' + s] = g;
        const tie = add(g, new T.TorusGeometry(0.98, 0.3, 10, 28), tieM, 0, 0.3, 0); tie.rotation.x = PI / 2; } }
    /* ---- the outfit: every piece is built from the length that was actually cut ---- */
    const cloth = (fab) => new T.MeshStandardMaterial({ color: 0xffffff, map: fabricTex(fab.col, fab.kind), roughness: 0.78, side: T.DoubleSide });
    const gemM = col => new T.MeshStandardMaterial({ color: col, roughness: 0.15, metalness: 0.2, emissive: col, emissiveIntensity: 0.2 }), trimM = () => new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), goldM = () => new T.MeshStandardMaterial({ color: 0xffd86a, metalness: 0.8, roughness: 0.25 });
    D.dress = function (kind, v, fab) { D.undress(kind); const g = new T.Group(); body.add(g); D.worn[kind] = g; const mat = kind === 'shoes' ? plasticM(fab) : cloth(fab);   /* glossy plastic without transmission: no second scene pass every frame */
      if (kind === 'skirt') { const top = WY + 0.3, bot = Math.max(0.12, top - v), L = top - bot, n = 14, pts = []; for (let i = 0; i <= n; i++) { const y = top - L * i / n; pts.push([rw + 0.14 + (top - y) * 0.5, y]); } if (v > top - 0.12) { const extra = v - (top - 0.12); pts.push([pts[pts.length - 1][0] + extra * 0.9, 0.1]); }
        const sk = new T.Mesh(new T.LatheGeometry(V2(pts), 56), mat); g.add(sk); const last = pts[pts.length - 1], hem = new T.Mesh(new T.TorusGeometry(last[0], 0.12, 6, 56), trimM()); hem.rotation.x = PI / 2; hem.position.y = last[1]; g.add(hem); }
      else if (kind === 'top') { const y0 = WY - 0.2, top = Math.min(NKY + 0.3, y0 + v), prof = y => y < CHY ? rw + 0.16 + (y - WY) * 0.36 : y < SHY + 0.2 ? 2.35 - (y - CHY) * 0.35 : 0.85 + Math.max(0, NKY + 0.3 - y) * 0.9, pts = []; for (let i = 0; i <= 12; i++) { const y = y0 + (top - y0) * i / 12; pts.push([prof(y) + 0.06, y]); }
        g.add(new T.Mesh(new T.LatheGeometry(V2(pts), 48), mat)); if (y0 + v > NKY + 0.3) { const roll = new T.Mesh(new T.TorusGeometry(0.95, 0.34 + (y0 + v - NKY - 0.3) * 0.1, 10, 32), mat); roll.rotation.x = PI / 2; roll.position.y = NKY + 0.3; g.add(roll); } }
      else if (kind === 'necklace') { const prof = y => y >= NKY ? 0.72 : y < CHY ? rw + 0.16 + (y - WY) * 0.36 : y < SHY + 0.2 ? 2.35 - (y - CHY) * 0.35 : 0.85 + Math.max(0, NKY + 0.3 - y) * 0.9, r = Math.max(0.55, v / TAU);
        let y0 = NKY + 0.6; for (let yy = NKY + 0.6; yy > WY - 1.5; yy -= 0.05) { y0 = yy; if (prof(yy) + 0.12 >= r) break; }   /* where it rests: a short chain chokes at her neck, a long one slides low */
        const drop = Math.min(0.9, 0.25 + Math.max(0, r - 1.2) * 0.4), pts = [];   /* the front drapes a little lower than the back, lying on her */
        for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, f = Math.pow(Math.max(0, Math.sin(a)), 2), y = y0 - drop * f, rr = Math.max(r * (1 - f) + (prof(y) + 0.12) * f, prof(y) + 0.1); pts.push(new T.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr)); }
        g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 128, 0.12, 8, true), goldM()));
        const yb = y0 - drop, yp = yb - 0.55, gem = new T.Mesh(new T.OctahedronGeometry(0.55, 0), gemM(fab.gem)); gem.scale.set(0.85, 1.3, 0.6); gem.position.set(0, yp, prof(yp) + 0.32); gem.rotation.x = -0.25; g.add(gem);
        const bail = new T.Mesh(new T.TorusGeometry(0.16, 0.05, 6, 16), goldM()); bail.position.set(0, yb - 0.08, prof(yb) + 0.22); g.add(bail); }
      else if (kind === 'earrings') { const hoop = v && v.hoop; for (const sd of [-1, 1]) { const e = new T.Group(); e.position.set(sd * R * 0.86, HY - R * 0.42, 0.25); g.add(e); e.add(new T.Mesh(new T.SphereGeometry(0.2, 12, 10), goldM()));
          if (hoop) { const r = Math.max(0.3, hoop), h = new T.Mesh(new T.TorusGeometry(r, 0.09, 8, 48), goldM()); h.rotation.y = PI / 2; h.position.y = -r; e.add(h); }
          else { const len = Math.max(0.3, v), c = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, len, 6), goldM()); c.position.y = -len / 2; e.add(c); const gm = new T.Mesh(new T.OctahedronGeometry(0.34, 0), gemM(fab.gem)); gm.scale.y = 1.3; gm.position.y = -len - 0.3; e.add(gm); } } }
      else if (kind === 'bracelet') { const arm = D.parts['arm1'], wr = 0.78, r = Math.max(0.3, v / TAU), loose = r > wr + 0.15, short = r < wr - 0.02, rr = short ? wr : r, bg = new T.Group(); arm.add(bg); g.userData.extra = bg;   /* on her wrist: too short won't close, too long slides down over her hand */
        const br = new T.Mesh(new T.TorusGeometry(rr, 0.18, 8, 48, short ? Math.max(0.6, TAU * v / (TAU * wr)) : TAU), goldM()); br.rotation.x = PI / 2; br.position.y = loose ? -3.3 : -2.85; bg.add(br);
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.4, bd = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), gemM(fab.gem)); bd.position.set(Math.cos(a) * rr, br.position.y, Math.sin(a) * rr); bg.add(bd); } }
      else if (kind === 'ring') { const arm = D.parts['arm-1'], rg = new T.Group(); arm.add(rg); g.userData.extra = rg; rg.position.set(0, -3.45, 0.86);   /* a cocktail ring on the back of her hand */
        const band = new T.Mesh(new T.TorusGeometry(0.36, 0.1, 8, 24), goldM()); rg.add(band); const gm = new T.Mesh(new T.OctahedronGeometry(0.38, 0), gemM(fab.gem)); gm.position.z = 0.22; rg.add(gm); }
      else if (kind === 'belt') { const r = rw + 0.16, arc = Math.min(TAU, v / r), b = new T.Mesh(new T.TorusGeometry(r, 0.42, 10, 64, arc), mat); b.rotation.x = PI / 2; b.rotation.z = PI / 2 - (TAU - arc) / 2 + PI; b.position.y = WY; b.scale.z = 0.35; g.add(b);
        const buckle = new T.Mesh(new T.TorusGeometry(0.55, 0.14, 8, 4), goldM()); buckle.rotation.z = PI / 4; buckle.position.set(0, WY, r + 0.12); if (arc < TAU - 0.02) buckle.position.x = Math.sin((TAU - arc) / 2) * r * 0.9; g.add(buckle);
        if (v > TAU * r + 0.05) { const len = Math.min(8, v - TAU * r), tail = new T.Mesh(new T.BoxGeometry(0.85, len, 0.12), mat); tail.position.set(0.35, WY - len / 2 - 0.3, r + 0.3); tail.rotation.z = 0.12; g.add(tail); } }
      else if (kind === 'bow') { const s = clamp(v / 8, 0.35, 2.4), bw = new T.Group(); bw.position.set(0, HY + 6.35, -0.2); bw.scale.setScalar(s); g.add(bw); for (const sd of [-1, 1]) { const lp = new T.Mesh(new T.TorusGeometry(1.1, 0.42, 10, 24), mat); lp.position.set(sd * 1.15, 0, 0); lp.scale.set(1, 0.7, 0.5); bw.add(lp); const tl = new T.Mesh(new T.BoxGeometry(0.6, 1.8, 0.1), mat); tl.position.set(sd * 0.45, -1.2, 0.1); tl.rotation.z = sd * 0.35; bw.add(tl); } bw.add(new T.Mesh(new T.SphereGeometry(0.48, 16, 12), mat)); }
      else if (kind === 'beret') { const bt = new T.Group(); bt.position.set(0, HY + 6.2, 1.0); bt.rotation.set(0.32, 0, -0.16); g.add(bt); const disc = new T.Mesh(new T.SphereGeometry(v, 48, 16, 0, TAU, 0, PI * 0.5), mat); disc.scale.y = 0.26; bt.add(disc); const band = new T.Mesh(new T.TorusGeometry(Math.max(0.6, v * 0.72), 0.16, 8, 40), mat); band.rotation.x = PI / 2; bt.add(band); const st = new T.Mesh(new T.CylinderGeometry(0.1, 0.16, 0.6, 8), mat); st.position.y = v * 0.26 + 0.2; bt.add(st); }
      else if (kind === 'shoes') { const sole = v.sole, strap = v.strap; for (const s of [-1, 1]) { const f = new T.Group(); f.position.set(s * 1.15, 0, 0); g.add(f); const sl = new T.Mesh(new T.BoxGeometry(ri * 2.3, 0.4, Math.max(0.4, sole)), mat); sl.position.set(0, 0.16, -0.55 + sole / 2); f.add(sl);
          const toe = new T.Mesh(new T.CylinderGeometry(ri * 1.15, ri * 1.15, 0.4, 20, 1, false, -PI / 2, PI), mat); toe.position.set(0, 0.16, -0.55 + sole); f.add(toe);
          const r2 = ri + 0.12, arc = Math.min(TAU, strap / r2), st = new T.Mesh(new T.TorusGeometry(r2, 0.2, 8, 40, arc), mat); st.position.set(0, ri, D.footZ); st.rotation.y = PI / 2; st.rotation.x = -PI / 2 + (TAU - arc) / 2; f.add(st);
          if (strap > TAU * r2 + 0.05) { const lp = new T.Mesh(new T.TorusGeometry(0.4 + (strap - TAU * r2) * 0.12, 0.14, 8, 20), mat); lp.position.set(r2 + 0.2, ri, D.footZ); lp.rotation.y = PI / 2; f.add(lp); } } }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; };
    D.undress = kind => { const g = D.worn[kind]; if (g) { body.remove(g); const x = g.userData.extra; if (x && x.parent) { x.parent.remove(x); x.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); } g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); delete D.worn[kind]; } };
    /* pins at the height a piece should reach (the tailor's marks: you can see a hem is 2 cm short) */
    D.marks = new T.Group(); body.add(D.marks);
    D.showMark = (y, r) => { D.clearMark(); const pin = new T.MeshStandardMaterial({ color: 0xff3a6a, emissive: 0xff3a6a, emissiveIntensity: 0.5, roughness: 0.3 }); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; if (Math.sin(a) < -0.35) continue; const p = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), pin); p.position.set(Math.cos(a) * r, y, Math.sin(a) * r); D.marks.add(p); } };
    D.clearMark = () => { while (D.marks.children.length) D.marks.remove(D.marks.children[0]); };
    D.setMood = k => { D.mood = k; D.smile.visible = k === 'happy'; D.frown.visible = k === 'sad'; D.wow.visible = k === 'wow'; };
    D.update = (dt, tm) => { D.t += dt; head.rotation.z = Math.sin(tm * 0.7) * 0.05 + (D.tilt || 0); head.rotation.y = (D.look || 0) + Math.sin(tm * 0.5) * 0.06; body.position.y = Math.sin(tm * 1.3) * 0.08 * CM * 0.4;
      const bl = (tm % 4.2) < 0.13; if (D.eyeShut.visible !== bl) { D.eyeShut.visible = bl; D.eyeOpen.visible = !bl; } for (const s of [-1, 1]) D.parts['arm' + s].rotation.z = s * (0.34 + Math.sin(tm * 1.1 + s) * 0.04 + (D.cheer || 0)); };
    return D; }

  /* ================================================================ the studio: a crafting desk seen close (the room's floor is the desk) */
  const SHELF = { x: 7.4, y: 6.1, z: -3.7 };   /* the ruler waits on the wall shelf at the side until the first lesson brings it down */
  const THEMES = {
    fa_studio: { palette: { sky: 0xfbe9ef, ground: 0xe6cfae, fog: 0xfbe9ef, wall: ['plank', '#fbe6ee', '#f6d3e0'], floor: ['plank', '#ecd6b6', '#e0c7a0'], hemi: [0xfff6f8, 0xb89a8a], key: 0xfff0e6, dust: { c: 0xffffff, n: 18, mode: 'drift' } },
      look: { keyC: 0xfff6ee, grade: 'day', exposure: 1.02, fogD: 0.012, rim: 0xffe0f0, face: 0x3a1a44, accent: '#ffd6e6', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, M } = c;
        const wall = new T.Mesh(new T.PlaneGeometry(40, 22), new T.MeshStandardMaterial({ map: wallTex(), roughness: 0.95 })); wall.position.set(0, 11, -4.4); wall.receiveShadow = true; scene.add(wall);
        c.box(40, 0.5, 0.4, M(0xffffff, { roughness: 0.6 }), 0, 0.25, -4.2);   /* the skirting board */
        /* the window: morning light over the desk */
        const win = new T.Mesh(new T.PlaneGeometry(6.4, 4.6), new T.MeshBasicMaterial({ color: 0xfff8e8 })); win.position.set(-1.2, 11.4, -4.35); scene.add(win);
        for (const [w, h, x, y] of [[6.9, 0.3, -1.2, 13.8], [6.9, 0.3, -1.2, 9.0], [0.3, 4.9, -4.55, 11.4], [0.3, 4.9, 2.15, 11.4], [0.18, 4.6, -1.2, 11.4], [6.4, 0.18, -1.2, 11.4]]) c.box(w, h, 0.25, M(0xffffff, { roughness: 0.5 }), x, y, -4.25);
        c.sprite(0xfff2d0, 11, -1.2, 11.4, -4.1, null, 0.35);
        /* the side shelf (the ruler's home), with jars of buttons and spools */
        c.box(5.2, 0.24, 1.2, M(0xc8966a, { roughness: 0.6 }), SHELF.x, SHELF.y - 0.12, SHELF.z + 0.2); for (const x of [-2.1, 2.1]) c.box(0.2, 0.9, 1.0, M(0xa8784e), SHELF.x + x, SHELF.y - 0.6, SHELF.z + 0.2);
        for (let i = 0; i < 3; i++) { const j = c.cyl(0.42, 0.42, 1.0, M(0xe8f4ff, { transparent: true, opacity: 0.45, roughness: 0.05 }), SHELF.x - 1.6 + i * 0.95, SHELF.y + 0.5, SHELF.z - 0.05, null, 20); for (let k = 0; k < 7; k++) c.cyl(0.12, 0.12, 0.05, M(PASTEL[(i * 2 + k) % 6]), j.position.x + Math.cos(k * 1.7) * 0.2, SHELF.y + 0.1 + k * 0.1, SHELF.z - 0.05 + Math.sin(k * 1.7) * 0.2, null, 12); }
        for (let i = 0; i < 2; i++) { const sp = new T.Group(); sp.position.set(SHELF.x + 1.3 + i * 0.7, SHELF.y + 0.42, SHELF.z + 0.3); scene.add(sp); c.cyl(0.3, 0.3, 0.08, M(0xe0c090), 0, -0.36, 0, sp, 16); c.cyl(0.24, 0.24, 0.64, M(PASTEL[i + 3], { roughness: 0.8 }), 0, 0, 0, sp, 16); c.cyl(0.3, 0.3, 0.08, M(0xe0c090), 0, 0.36, 0, sp, 16); }
        /* a pegboard of tools on the left */
        const peg = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#ffd0de'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(150,60,90,.28)'; for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); } }, [3, 2]);
        const pb = new T.Mesh(new T.BoxGeometry(7.2, 4.8, 0.2), new T.MeshStandardMaterial({ map: peg, roughness: 0.8 })); pb.position.set(-9.2, 7.6, -4.2); scene.add(pb);
        for (let i = 0; i < 4; i++) { const sw = c.box(0.5, 1.6, 0.06, M(PASTEL[i], { roughness: 0.6, map: fabricTex(PASTEL[i], FAB[i]) }), -11.6 + i * 0.75, 8.6, -4.05); sw.rotation.z = (i - 1.5) * 0.04; }
        const tp = new T.Mesh(new T.TorusGeometry(0.7, 0.2, 10, 28), M(0xffd84a, { roughness: 0.5 })); tp.position.set(-7.4, 8.4, -3.95); scene.add(tp);
        /* fabric bolts leaning on the wall, a sewing machine at the back of the desk */
        for (let i = 0; i < 6; i++) { const b = c.cyl(0.55, 0.55, 5.2, M(0xffffff, { roughness: 0.85, map: fabricTex(PASTEL[i], FAB[i]) }), 9.4 + i * 1.15, 2.5, -3.4 + (i % 2) * 0.35, null, 20); b.rotation.z = -0.1 - (i % 3) * 0.04; }
        const sm = new T.Group(); sm.position.set(7.6, 0, -1.9); sm.rotation.y = -0.35; scene.add(sm); const body = M(0xf4f0f6, { roughness: 0.3, metalness: 0.1 }), gold = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 });
        c.box(3.4, 0.45, 1.6, body, 0, 0.23, 0, sm); c.box(0.8, 2.1, 1.3, body, 1.25, 1.5, 0, sm); c.box(3.2, 0.72, 1.1, body, -0.1, 2.55, 0, sm); c.box(0.5, 1.0, 0.8, body, -1.6, 1.9, 0, sm); c.cyl(0.03, 0.03, 0.7, M(0xdfe4ea, { metalness: 0.9 }), -1.6, 1.1, 0, sm, 6);
        const wh = c.cyl(0.55, 0.55, 0.18, gold, 1.8, 2.0, 0, sm, 24); wh.rotation.z = PI / 2; c.box(2.6, 0.06, 0.03, M(0xff7eb6), -0.1, 2.55, 0.56, sm); c.cyl(0.2, 0.2, 0.5, M(PASTEL[2]), 0.4, 3.15, 0, sm, 16);
        /* fairy lights along the top of the wall */
        for (let i = 0; i < 22; i++) { const x = -15 + i * 1.45, y = 16.2 - Math.sin(i / 21 * PI * 3) * 0.5; const bl = c.sph(0.13, M(0xffffff, { emissive: PASTEL[i % 6], emissiveIntensity: 1.6 }), x, y, -4.1, null, 8); c.updaters.push((dt, tm) => { bl.material.emissiveIntensity = 1.1 + 0.6 * Math.sin(tm * 2 + i); }); }
      } }
  };

  /* ================================================================ the stage: the desk, the tools, the camera */
  const STAGES = {
    studio(c) { const { scene, FX } = c, M = c.M;
      const S = { view: 'overview', fx: 0.9, x0: R0X, dead: false, band: 2, step: 1, api: null, drag: null, cx: 0.9, cz: 1.2, strips: [], chalkCm: null, tm: 0 };
      const narrow = () => (c.camera.aspect || 1.5) < 1.05;
      const DOLL = new T.Vector3(-4.8, 0, 0.2);
      const X = cm => S.x0 + cm * CM, CMX = x => (x - S.x0) / CM;
      const add = (g, o) => { (g || scene).add(o); return o; };
      const mesh = (geo, mat, g, x, y, z) => { const o = new T.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return add(g, o); };

      /* ---- the doll's turntable stand ---- */
      const stand = new T.Group(); stand.position.copy(DOLL); scene.add(stand);
      mesh(new T.CylinderGeometry(1.75, 1.9, 0.3, 48), M(0xffc6da, { roughness: 0.45 }), stand, 0, 0.15, 0); const rimT = mesh(new T.TorusGeometry(1.8, 0.05, 8, 64), M(0xd8b04a, { metalness: 0.85, roughness: 0.3 }), stand, 0, 0.3, 0); rimT.rotation.x = PI / 2;
      const spin = new T.Group(); spin.position.y = 0.3; stand.add(spin);

      /* ---- the ruler (it waits on the side shelf until the first lesson brings it down) ---- */
      const ruler = new T.Group(); scene.add(ruler); const RL = RULER_CM * CM, RWW = RW * CM;
      mesh(new T.BoxGeometry(RL, 0.08, RWW), M(0xf2e2c0, { roughness: 0.55 }), ruler, 0, 0.04, 0);
      const face = new T.Mesh(new T.PlaneGeometry(RL, RWW), new T.MeshBasicMaterial({ map: rulerTex(), toneMapped: false })); face.rotation.x = -PI / 2; face.position.y = 0.082; ruler.add(face);
      /* the measured stretch: a see-through band over the cm scale from 0 to the chalk, growing as it is dragged (Yoni 2026-09-29: 'you need to
         literally see that area filled from zero till four or six') */
      const fill = new T.Mesh(new T.PlaneGeometry(1, RWW / 2), new T.MeshBasicMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })); fill.rotation.x = -PI / 2; fill.position.set(0, 0.087, -RWW / 4); fill.visible = false; fill.renderOrder = 2; ruler.add(fill);
      const rulerAt = () => new T.Vector3(S.x0 + (RULER_CM / 2 - RM) * CM, 0, RZ);   /* where the ruler lies on the desk (its 0 at S.x0) */
      const rulerHome = () => { ruler.position.copy(rulerAt()); ruler.rotation.set(0, 0, 0); };
      const rulerShelf = () => { ruler.position.set(SHELF.x - 0.2, SHELF.y + RWW / 2 + 0.02, SHELF.z + 0.35); ruler.rotation.set(PI / 2 - 0.25, 0, 0); };
      rulerHome();

      /* ---- fabric strips (and the shoe plastic): a flat band on the desk, its left edge at `left` cm ---- */
      /* w: the strip's width in cm (across the ruler); its front edge always lies against the ruler, so a wider strip reaches further back */
      const FE = FZ + FW * CM / 2;
      function makeStrip(left, len, fab, plastic, w) { w = w || FW; const g = new T.Group(); scene.add(g); const tx = plastic && (!fab.kind || fab.kind === 'plain') ? null : fabricTex(fab.col, fab.kind).clone(); if (tx) { tx.needsUpdate = true; tx.wrapS = tx.wrapT = T.RepeatWrapping; }
        const topM = plastic ? new T.MeshPhysicalMaterial({ color: tx ? 0xffffff : fab.col, map: tx, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }) : new T.MeshStandardMaterial({ color: 0xffffff, map: tx, roughness: 0.8 });
        const top = mesh(new T.PlaneGeometry(1, w * CM), topM, g, 0, 0.034, 0); top.rotation.x = -PI / 2; const edge = mesh(new T.BoxGeometry(1, 0.03, w * CM), M(new T.Color(fab.col).multiplyScalar(0.7).getHex(), { roughness: 0.8 }), g, 0, 0.016, 0);
        const s = { g, top, edge, tx, left, len, fab, plastic: !!plastic, w, z: FE - w * CM / 2 }; S.strips.push(s); setStrip(s, left, len); g.position.z = s.z; return s; }
      function setStrip(s, left, len) { s.left = left; s.len = Math.max(0.05, len); const L = s.len * CM; s.top.scale.x = L; s.edge.scale.x = L; s.g.position.x = X(left) + L / 2; if (s.tx) s.tx.repeat.set(s.len / 5, s.w / 5); }
      function dropStrip(s) { const i = S.strips.indexOf(s); if (i >= 0) S.strips.splice(i, 1); scene.remove(s.g); s.g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); } }); if (s.tx) s.tx.dispose(); }

      /* ---- tailor's chalk: a pale triangle at the fabric's back edge and a line across the fabric onto the ruler's ticks ---- */
      const chalk = new T.Group(); chalk.visible = false; scene.add(chalk); const chalkM = M(0xcfe8ff, { roughness: 0.9 });
      const tri = mesh(new T.CylinderGeometry(0.42, 0.42, 0.1, 3), chalkM, chalk, 0, 0.1, FZ - FW * CM / 2 - 0.38); tri.rotation.y = PI / 2;
      const line = mesh(new T.BoxGeometry(0.03, 0.012, FW * CM + 0.5), new T.MeshBasicMaterial({ color: 0x2a6ad8 }), chalk, 0, 0.05, FZ + 0.12); line.castShadow = false;
      const tip = mesh(new T.ConeGeometry(0.12, 0.3, 12), new T.MeshBasicMaterial({ color: 0x2a6ad8 }), chalk, 0, 0.12, RZ - RWW / 2 + 0.3); tip.rotation.x = -PI / 2; tip.castShadow = false;
      /* the chalk line reaches across the whole strip, however wide (S.cw: the width being cut, in cm) */
      const fitChalk = w => { S.cw = w || FW; const L = S.cw * CM + 0.5; line.scale.z = L / (FW * CM + 0.5); line.position.z = FE + 0.12 - S.cw * CM / 2; tri.position.z = FE - S.cw * CM - 0.38; };
      const setChalk = cm => { S.chalkCm = cm; chalk.visible = cm != null; if (cm != null) { chalk.position.x = X(cm); chalk.position.z = S.dz || 0; }
        fill.visible = cm != null && cm > 0; if (fill.visible) { const w = cm * CM; fill.scale.x = w; fill.position.x = -(RULER_CM / 2 - RM) * CM + w / 2; } };
      /* a chalk drag starts with the chalk standing at the start of the ruler, so it is pulled along it (not tapped onto a spot) */
      const startChalk = d => { S.drag = d; setChalk(d.min != null ? d.min : 0); };

      /* ---- scissors: two blades on a pivot, pink rings; they lie on the desk until they cut ---- */
      const sc = new T.Group(); scene.add(sc); const steel = M(0xe4e8ee, { metalness: 0.95, roughness: 0.18 }), pinkH = M(0xff6a9a, { roughness: 0.35 }), blades = [];
      for (const sd of [-1, 1]) { const b = new T.Group(); sc.add(b); const bl = mesh(new T.BoxGeometry(0.16, 0.035, 2.1), steel, b, 0, 0, -1.05); bl.scale.x = 1; const tp = mesh(new T.ConeGeometry(0.08, 0.3, 4), steel, b, 0, 0, -2.2); tp.rotation.x = -PI / 2;
        const ring = mesh(new T.TorusGeometry(0.34, 0.1, 10, 24), pinkH, b, sd * 0.3, 0, 0.75); ring.rotation.x = PI / 2; mesh(new T.BoxGeometry(0.12, 0.08, 0.5), pinkH, b, sd * 0.12, 0, 0.3).rotation.y = sd * 0.35; blades.push(b); }
      mesh(new T.CylinderGeometry(0.08, 0.08, 0.12, 12), M(0x8a8a90, { metalness: 0.9, roughness: 0.3 }), sc, 0, 0.02, 0);
      const SC_REST = { p: new T.Vector3(5.4, 0.1, RZ - 0.2), r: new T.Euler(0, -0.7, 0) };
      const SCS = 0.5; sc.scale.setScalar(SCS);   /* Yoni 2026-09-29: the scissors were too big for the ruler — now about 8 cm long, like real fabric scissors at this scale */
      const scRest = () => { sc.position.copy(SC_REST.p); sc.rotation.copy(SC_REST.r); setBlades(0.12); };
      /* the slit the blades leave behind them as they go, so the cut is seen travelling forward across the fabric */
      const slit = mesh(new T.BoxGeometry(0.06, 0.008, 1), new T.MeshBasicMaterial({ color: 0x3a1f2a }), scene, 0, 0.045, 0); slit.visible = false; slit.castShadow = false;
      function setBlades(a) { blades[0].rotation.y = a; blades[1].rotation.y = -a; }
      scRest();

      /* ---- the spool of red string, pins, the shoe plastic sheet ---- */
      const spool = new T.Group(); spool.position.set(5.6, 0, 0.3); scene.add(spool); mesh(new T.CylinderGeometry(0.42, 0.42, 0.1, 20), M(0xe0c090), spool, 0, 0.05, 0); mesh(new T.CylinderGeometry(0.32, 0.32, 0.6, 20), M(0xe8344a, { roughness: 0.7 }), spool, 0, 0.4, 0); mesh(new T.CylinderGeometry(0.42, 0.42, 0.1, 20), M(0xe0c090), spool, 0, 0.75, 0);
      const cush = new T.Group(); cush.position.set(4.3, 0, -1.0); scene.add(cush); const tom = mesh(new T.SphereGeometry(0.62, 20, 14), M(0xff5a6a, { roughness: 0.6 }), cush, 0, 0.42, 0); tom.scale.y = 0.72; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const pn = mesh(new T.CylinderGeometry(0.015, 0.015, 0.7, 4), M(0xdfe4ea, { metalness: 0.9 }), cush, Math.cos(a) * 0.3, 0.8, Math.sin(a) * 0.3); pn.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); mesh(new T.SphereGeometry(0.07, 10, 8), M(PASTEL[i]), pn, 0, 0.36, 0); }
      const redM = new T.MeshStandardMaterial({ color: 0xe8344a, roughness: 0.6 });
      let strObj = null; function setString(pts, r) { if (strObj) { scene.remove(strObj); strObj.geometry.dispose(); strObj = null; } if (!pts || pts.length < 2) return; const curve = new T.CatmullRomCurve3(pts); strObj = new T.Mesh(new T.TubeGeometry(curve, Math.max(8, pts.length * 2), r || 0.035, 6, false), redM); strObj.castShadow = true; scene.add(strObj); }
      function pin(col) { const g = new T.Group(); scene.add(g); mesh(new T.CylinderGeometry(0.015, 0.015, 0.55, 4), M(0xdfe4ea, { metalness: 0.9 }), g, 0, 0.27, 0); mesh(new T.SphereGeometry(0.1, 12, 10), M(col || 0xff3a6a, { roughness: 0.3 }), g, 0, 0.56, 0); return g; }

      /* ---- the instruction plaque: the room's banner look, but carried by the camera (the studio's camera turns from the desk to the doll) ---- */
      const plq = FX.plaque({ w: 9.6, h: 2.7, face: c.P.face, accent: c.P.accent, max: 0.42, lines: 3 }); plq.visible = false; scene.add(plq); S.plqPop = 1;
      const tmpV = new T.Vector3();
      c.updaters.push(dt => { if (!plq.visible) return; const cam = c.camera, d = 12, th = Math.tan(cam.fov * PI / 360), vh = 2 * th * d, vw = vh * cam.aspect, nar = cam.aspect < 1.05, s = Math.min(1.05, vw * (nar ? 0.95 : 0.52) / 9.9) * S.plqPop; plq.scale.setScalar(Math.max(0.001, s));
        tmpV.set(0, vh / 2 - 1.5 * s - vh * (nar ? 0.085 : 0.045), -d).applyQuaternion(cam.quaternion).add(cam.position); plq.position.copy(tmpV); plq.quaternion.copy(cam.quaternion); });
      function tell(k, t) { plq.visible = true; plq.userData.plaque.set(k || '', t || '', null); S.plqPop = 0.001; c.tween(0.45, q => { S.plqPop = Math.max(0.001, c.over(q)); }, () => { S.plqPop = 1; }); }

      /* ---- the camera: the whole desk, the ruler, a close look at the chalk, the doll, the shelf, the circle mat ---- */
      function frame(a) { const nar = a < 1.05, mid = a < 1.5, v = S.view, dl = DOLL;
        if (v === 'doll') return nar ? { pos: [dl.x + 0.6, 7.6, dl.z + 13.0], look: [dl.x + 0.1, 5.7, dl.z], fov: 56 } : { pos: [dl.x + 2.4, 8.2, dl.z + 17.2], look: [dl.x + 0.5, 6.2, dl.z], fov: mid ? 42 : 40 };   /* framed low enough that the sign never sits on her head */
        if (v === 'waist') { const y = S.wy || 2.8; return nar ? { pos: [dl.x, y + 1.1, dl.z + 7.6], look: [dl.x, y + 0.2, dl.z], fov: 50 } : { pos: [dl.x, y + 0.8, dl.z + 5.8], look: [dl.x, y + 0.12, dl.z], fov: 38 }; }   /* measuring across her waist: face on, the ruler under the blocks */
        if (v === 'feet') return nar ? { pos: [dl.x + 0.4, 3.2, dl.z + 6.4], look: [dl.x, 0.9, dl.z], fov: 50 } : { pos: [dl.x + 1.6, 4.0, dl.z + 7.2], look: [dl.x + 0.5, 1.4, dl.z], fov: 40 };
        if (v === 'zoom') { const x = S.fx; return nar ? { pos: [x, 6.6, 1.0 + 4.4], look: [x, 0, 1.0], fov: 48 } : { pos: [x, 3.1, 1.35 + 2.2], look: [x, 0, 1.35], fov: 38 }; }
        if (v === 'circle') { if (S.circBig) return nar ? { pos: [S.cx, 14.2, S.cz + 6.4], look: [S.cx, 0, S.cz - 0.9], fov: 56 } : { pos: [S.cx, 10.2, S.cz + 5.6], look: [S.cx, 0, S.cz - 0.75], fov: 44 };   /* the skirt's big circle sits under the sign, never behind it */
          return nar ? { pos: [S.cx, 11.8, S.cz + 5.8], look: [S.cx, 0, S.cz + 0.7], fov: 54 } : { pos: [S.cx, 7.8, S.cz + 4.8], look: [S.cx, 0, S.cz + 0.55], fov: 42 }; }
        if (v === 'shelf') return nar ? { pos: [4.8, 8.4, 9.6], look: [6.6, 5.8, -3.2], fov: 56 } : { pos: [3.8, 7.8, 8.0], look: [6.4, 6.0, -3.4], fov: 44 };
        if (v === 'overview') return nar ? { pos: [-2.6, 12.0, 18.0], look: [-2.8, 4.4, 0.4], fov: 60 } : { pos: [-0.6, 10.4, 16.2], look: [-0.6, 4.5, 0.4], fov: mid ? 46 : 42 };
        const cx = S.x0 + 3.0, wx = X(S.wx == null ? 4.5 : S.wx), e = Math.max(0, (S.cw || FW) - 6) * CM;   /* a deep piece (a rectangle turned round) pulls the camera back so its far edge clears the sign */
        return nar ? { pos: [wx, 8.4 + e * 1.1, 1.0 + 5.4 + e * 0.2], look: [wx, 0, 1.0 - e * 0.55], fov: 52 } : { pos: [cx, 5.9 + e * 1.0, 1.15 + 4.3 + e * 0.2], look: [cx, 0, 1.15 - e * 0.55], fov: mid ? 44 : 40 }; }
      const view = (v, o) => { S.view = v; if (o && o.x != null) S.fx = o.x; };

      /* ---- the hands: drag on the desk (the chalk along the ruler, a strip to line it up with 0), tap things, buttons and a number pad ---- */
      const ray = new T.Raycaster(), ndc = new T.Vector2(), desk = new T.Plane(new T.Vector3(0, 1, 0), -0.06), hp = new T.Vector3(); ray.camera = c.camera;
      const cv = c.renderer.domElement;
      const aim = e => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)); ray.setFromCamera(ndc, c.camera); };
      const deskAt = e => { aim(e); return ray.ray.intersectPlane(desk, hp) ? hp.clone() : null; };
      const snap = v => Math.round(v / S.step + 1e-9) * S.step;
      const onRuler = p => p && p.x > X(-1.2) && p.x < X(21) && p.z > FE + (S.dz || 0) - (S.cw || FW) * CM - 0.9 && p.z < RZ + (S.dz || 0) + RW * CM / 2 + 0.9;
      const onStrip = (p, s) => p && p.x > X(s.left) - 0.35 && p.x < X(s.left + s.len) + 0.35 && Math.abs(p.z - s.z) < s.w * CM / 2 + 0.45;
      function down(e) { if (!S.drag || S.dead) return; const d = S.drag, p = deskAt(e);
        if (d.kind === 'chalk' && onRuler(p)) { S.held = { kind: 'chalk' }; moveChalk(p); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }
        else if (d.kind === 'fabric' && onStrip(p, d.strip)) { S.held = { kind: 'fabric', grab: CMX(p.x) - d.strip.left }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }
        else if (d.kind === 'tap') { aim(e); const h = ray.intersectObjects(d.targets, true)[0]; if (h) { const cb = d.cb; S.drag = null; cb(h); } } }
      function moveChalk(p) { const d = S.drag, v = clamp(snap(CMX(p.x)), d.min == null ? 0 : d.min, d.max == null ? 20 : d.max); if (v !== S.chalkCm) { setChalk(v); if (S.api) S.api.sfx('tick'); } if (d.zoom) view('zoom', { x: X(v) }); if (d.onMove) d.onMove(v); }
      function move(e) { if (S.dead) return; const p = S.held || S.drag ? deskAt(e) : null;
        if (S.held && S.held.kind === 'chalk' && p) moveChalk(p);
        else if (S.held && S.held.kind === 'fabric' && p) { const s = S.drag.strip, v = clamp(snap(CMX(p.x) - S.held.grab), -4, 8); if (v !== s.left) { setStrip(s, v, s.len); if (S.api) S.api.sfx('tick'); } }
        const hot = S.drag && (S.drag.kind === 'chalk' ? onRuler(p) : S.drag.kind === 'fabric' ? onStrip(p, S.drag.strip) : false); cv.style.cursor = S.held ? 'grabbing' : hot ? 'grab' : S.drag && S.drag.kind === 'tap' ? 'pointer' : 'default'; }
      function up() { if (S.held && S.drag && S.drag.onRelease) S.drag.onRelease(); S.held = null; }
      /* the DOM layer: the action button, a '?' for a reminder, the number pad */
      let ui = null; const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
      function mountUI() { const host = cv.parentNode && cv.parentNode.parentNode; if (!host || ui) return; ui = { root: el('div', 'sd-ui') }; host.appendChild(ui.root);
        ui.bar = el('div', 'sd-bar'); ui.help = el('button', 'btn ghost sd-help', '?'); ui.help.type = 'button'; ui.help.hidden = true; ui.help.onclick = () => { if (S.hint) { S.api.sfx('tap'); S.hint(); } };
        ui.main = el('button', 'btn gold'); ui.main.type = 'button'; ui.main.hidden = true; ui.bar.append(ui.help, ui.main); ui.root.appendChild(ui.bar);
        ui.pad = el('div', 'sd-pad'); ui.pad.hidden = true; const disp = el('div', 'sd-disp'); ui.val = el('b'); disp.append(ui.val, el('small', null, KQ.t('sd_cm'))); ui.keys = el('div', 'sd-keys'); ui.pad.append(disp, ui.keys); ui.root.appendChild(ui.pad);
        for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']) { const b = el('button', k === '.' ? 'sd-dot' : null, k); b.type = 'button'; b.dataset.k = k; ui.keys.appendChild(b); } ui.ok = el('button', 'sd-ok', '✓'); ui.ok.type = 'button'; ui.keys.appendChild(ui.ok);
        cv.style.touchAction = 'none'; cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); }
      const hint = f => { S.hint = f; if (ui) ui.help.hidden = !f; };
      /* the action button: resolves when pressed; `ready` (optional) keeps it greyed until the child has done something */
      function act(label, o) { o = o || {}; return new Promise(res => { if (!ui || S.dead) return; const b = ui.main; b.textContent = label; b.hidden = false; b.disabled = !!o.wait; S.ready = () => { b.disabled = false; };
        S.skipAct = () => { b.onclick = null; b.hidden = true; S.ready = null; S.skipAct = null; res(); };
        b.onclick = () => { if (b.disabled) return; b.onclick = null; b.hidden = true; S.ready = null; S.skipAct = null; S.api.sfx('tap'); res(); }; }); }
      /* the number pad: the child reads the ruler and types what it shows (dp: decimals allowed) */
      function pad(dp) { return new Promise(res => { if (!ui || S.dead) return; let s = ''; ui.pad.hidden = false; ui.pad.classList.remove('bad'); ui.val.textContent = ''; ui.keys.querySelector('.sd-dot').disabled = !dp;
        ui.keys.onclick = e => { const b = e.target.closest('button'); if (!b) return; S.api.sfx('tick'); if (b === ui.ok) { if (!s || s === '.') return; ui.keys.onclick = null; ui.pad.hidden = true; res(parseFloat(s)); return; }
          const k = b.dataset.k; if (k === '⌫') s = s.slice(0, -1); else if (k === '.') { if (dp && !s.includes('.')) s = (s || '0') + '.'; } else if (s.replace('.', '').length < 4 && !(s.includes('.') && s.split('.')[1].length >= 1)) s = s === '0' ? k : s + k; ui.val.textContent = s; };
        S.padKey = e => { if (ui.pad.hidden) return; if (/^[0-9]$/.test(e.key) || e.key === '.' || e.key === 'Backspace' || e.key === 'Enter') { const k = e.key === 'Backspace' ? '⌫' : e.key; const b = k === 'Enter' ? ui.ok : ui.keys.querySelector('[data-k="' + k + '"]'); if (b && !b.disabled) b.click(); } }; }); }
      const onKey = e => { if (S.padKey) S.padKey(e); }; document.addEventListener('keydown', onKey);

      /* ---- time and motion (room time: the studio pauses with the room) ---- */
      const wait = s => new Promise(r => c.tween(s, () => {}, r));
      const anim = (dur, fn) => new Promise(r => c.tween(dur, fn, r));
      const ease = k => k * k * (3 - 2 * k);
      function glide(o, to, dur, h, rot) { const a = o.position.clone(), q0 = o.quaternion.clone(), q1 = rot ? new T.Quaternion().setFromEuler(rot) : null; return anim(dur, k => { const e = ease(k); o.position.lerpVectors(a, to, e); o.position.y += Math.sin(PI * k) * (h || 0); if (q1) o.quaternion.slerpQuaternions(q0, q1, e); }); }
      /* a glowing bar on the ruler from a to b (cm), with a label over it — the lessons point with it */
      const marks = [];
      function bar(a, b, text, col) { const g = new T.Group(); scene.add(g); const w = Math.max(0.04, (b - a) * CM), z = RZ - RW * CM / 2 - 0.07 + (S.dz || 0), mat = new T.MeshBasicMaterial({ color: col || 0xff4a8a }); const m = new T.Mesh(new T.BoxGeometry(w, 0.02, 0.08), mat); m.position.set(X(a) + w / 2, 0.1, z); g.add(m);   /* along the ruler's edge, never over its ticks */
        for (const e of [a, b]) { const k = new T.Mesh(new T.BoxGeometry(0.035, 0.02, 0.26), mat); k.position.set(X(e), 0.1, z - 0.1); g.add(k); }
        if (text) { const t = c.label(text, -1, narrow() ? 0.5 : 0.4); t.position.set(X((a + b) / 2), 0.42, FE + (S.dz || 0) - (S.cw || FW) * CM - 0.2); c.faceCam(t); g.add(t); g.userData.tab = t; } g.scale.setScalar(0.001); c.tween(0.35, k => g.scale.setScalar(Math.max(0.001, c.over(k)))); marks.push(g); return g; }
      function clearBars() { for (const g of marks.splice(0)) { scene.remove(g); if (g.userData.tab) g.userData.tab.userData.tablet.dispose(); } }
      /* scissors: fly to the chalk line, snip across the strip, come back; the strip splits into the piece (from its left edge to the cut) and the rest */
      /* tips pointing away, the blades open at the fabric's front edge (by the ruler); each snip closes them and they advance, the slit growing
         behind them, until they are through the back edge — then the piece comes free (Yoni 2026-09-29: 'they cut forward, not backwards') */
      async function cut(s, at) { const x = X(at), zNear = FE + 0.05, zFar = FE - s.w * CM - 0.05, run = 1.3 * Math.sqrt(Math.max(1, s.w / FW)), lead = 0.55 * SCS; if (S.api) S.api.sfx('tap');
        await glide(sc, new T.Vector3(x, 0.3, zNear + lead + 0.25), 0.55, 1.0, new T.Euler(-0.08, 0, 0)); setBlades(0.42); await anim(0.18, k => { sc.position.z = zNear + lead + 0.25 - 0.25 * k; });
        slit.position.x = x; slit.visible = true; let lastSnip = -1;
        await anim(run, k => { const zc = zNear - (zNear - zFar) * k, open = Math.abs(Math.cos(k * PI * 4)); sc.position.z = zc + lead; setBlades(0.05 + 0.37 * open);
          const len = Math.max(0.001, zNear - zc); slit.scale.z = len; slit.position.z = zNear - len / 2; const snip = Math.floor(k * 4 + 0.5); if (snip !== lastSnip && open < 0.1) { lastSnip = snip; if (S.api) S.api.sfx('tick'); } });
        slit.visible = false; setBlades(0.06);
        const piece = makeStrip(s.left, at - s.left, s.fab, s.plastic, s.w); setStrip(s, at, s.left + s.len - at); piece.g.position.y = 0.02; await glide(piece.g, piece.g.position.clone().add(new T.Vector3(-0.18, 0.18, -0.05)), 0.3);
        glide(sc, SC_REST.p.clone(), 0.6, 1.0, SC_REST.r).then(() => setBlades(0.12)); return piece; }
      /* the string: wrapped round a circle on the doll (points in her own centimetres), pinned where it meets itself, then laid straight on the ruler from 0 */
      /* circ(a) gives a world point on the loop at angle a (the doll's waist or foot, a spool, a drawn circle) */
      const onDoll = (cx, cy, cz, r, plane) => a => { D.body.updateMatrixWorld(true); return D.body.localToWorld(plane === 'xy' ? new T.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz) : new T.Vector3(cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r)); };
      async function wrapAndLay(circ, len, a0) { const N = 48, lineZ = RZ - RW * CM / 2 + 0.16, pt = i => circ((a0 || 0) + TAU * i / N);
        await anim(1.6, k => { const n = Math.max(2, Math.round(N * k)); const pts = []; for (let i = 0; i <= n; i++) pts.push(pt(i)); setString(pts, 0.035); });
        const pn = pin(); pn.position.copy(pt(0)); pn.scale.setScalar(0.7); if (S.api) S.api.sfx('tick'); await wait(0.7); scene.remove(pn);
        view('work'); const from = []; for (let i = 0; i <= N; i++) from.push(pt(i)); const to = []; for (let i = 0; i <= N; i++) to.push(new T.Vector3(X(len * i / N), 0.13, lineZ));
        await anim(1.9, k => { const pts = []; for (let i = 0; i <= N; i++) { const e = ease(clamp(k * 1.5 - (i / N) * 0.5, 0, 1)); const p = from[i].clone().lerp(to[i], e); p.y += Math.sin(PI * e) * 1.4 * (1 - i / N * 0.3); pts.push(p); } setString(pts, 0.035); });
        const endPin = pin(); endPin.position.set(X(len), 0.1, lineZ); endPin.scale.setScalar(0.6); S.endPin = endPin; return endPin; }
      function clearString() { setString(null); if (S.endPin) { scene.remove(S.endPin); S.endPin = null; } }

      /* ================================================================ the visit: lessons with worked examples, then the order */
      let D = null; const t = (k, p) => KQ.t(k, p);
      const pick = a => a[Math.floor(Math.random() * a.length)];
      const nice = v => +(Math.round(v / S.step) * S.step).toFixed(1);
      const same = (a, b) => Math.abs(a - b) < S.step / 2 - 1e-6;
      const num = v => fmt(v, S.step < 1 ? (Math.abs(v - Math.round(v)) > 1e-6 ? 1 : 0) : 0);
      /* her measurements. Her waist's RADIUS comes first (Yoni 2026-09-28: 'teach how to measure a radius like waist, then cut it'): the
         circle skirt is cut from it. Whole centimetres for the young ones (radius 2 = 4 cm across), halves at 10–11, tenths after. */
      function measures(b) { const r = b <= 3 ? 2 : b === 4 ? pick([1.5, 2, 2.5]) : pick([1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2]), w = { waist: TAU * r, waistR: r, collarR: 1.6, wristR: 0.78 };   /* her collar (where a necklace rests) and her wrist, as radii in cm */
        if (b <= 3) return Object.assign(w, { foot: pick([3, 4]), instep: pick([5, 6]) });
        if (b === 4) return Object.assign(w, { foot: pick([3, 3.5, 4]), instep: pick([5, 5.5, 6]) });
        return Object.assign(w, { foot: +(3 + Math.floor(Math.random() * 11) / 10).toFixed(1), instep: +(5 + Math.floor(Math.random() * 10) / 10).toFixed(1) }); }
      /* lessons already seen stay seen (per player); '?' still gives the key idea back */
      const seen = () => { try { const st = KQ.state(); st.studio = st.studio || {}; return (st.studio[S.api.pid || 'guest'] = st.studio[S.api.pid || 'guest'] || {}); } catch (e) { return {}; } };
      const markSeen = k => { try { seen()[k] = true; KQ.save(); } catch (e) {} };
      const K = k => t('sd_lesson') + ' · ' + t(k);
      const alive = () => !S.dead;

      /* ---- lesson 1: the ruler — centimetres, start at 0, millimetres (10+), inches (the other edge) — then two tries with the chalk ---- */
      async function lessonRuler(first) {
        if (first) { rulerShelf(); view('shelf'); tell(K('sd_lRuler'), t('sd_r0')); await act(t('sd_next')); if (!alive()) return;
          view('work'); await glide(ruler, rulerAt(), 1.5, 3.2, new T.Euler(0, 0, 0)); rulerHome(); }
        else view('work');
        tell(K('sd_lRuler'), t('sd_r1')); for (let i = 0; i < 5; i++) { bar(i, i + 1, i ? null : t('sd_1cm'), i % 2 ? 0xff8ab4 : 0xff4a8a); await wait(0.35); } await act(t('sd_next')); if (!alive()) return; clearBars();
        const rib = makeStrip(0, 4, { col: 0xff6aa8, kind: 'stripes' }); tell(K('sd_lRuler'), t('sd_r2')); bar(0, 4, t('sd_ncm', { n: 4 })); await act(t('sd_next')); if (!alive()) return;
        if (S.band >= 2) { clearBars(); await anim(0.8, k => setStrip(rib, k, 4)); tell(K('sd_lRuler'), t('sd_r3')); bar(1, 5, t('sd_ncm', { n: 4 })); await act(t('sd_next')); if (!alive()) return; clearBars(); await anim(0.6, k => setStrip(rib, 1 - k, 4)); }
        dropStrip(rib); clearBars();
        if (S.band >= 4) { view('zoom', { x: X(3.5) }); tell(K('sd_lRuler'), t('sd_r4')); for (let i = 0; i < 10; i++) { bar(3 + i / 10, 3 + (i + 1) / 10, null, i % 2 ? 0xff8ab4 : 0xff4a8a); await wait(0.18); } await wait(0.3); clearBars(); bar(3, 3.5, t('sd_5mm')); await act(t('sd_next')); if (!alive()) return; clearBars(); view('work'); }
        tell(K('sd_lRuler'), t('sd_r5')); const inch = new T.Group(); scene.add(inch); const ib = new T.Mesh(new T.BoxGeometry(2.54 * CM, 0.02, 0.1), new T.MeshBasicMaterial({ color: 0x3a7aff })); ib.position.set(X(1.27), 0.1, RZ + RW * CM / 2 - 0.06); inch.add(ib);
        const il = c.label(t('sd_1in'), -1, narrow() ? 0.5 : 0.42); il.position.set(X(1.27), 0.5, RZ + RW * CM / 2 + 0.5); c.faceCam(il); inch.add(il); bar(0, 2.54, t('sd_25cm'));
        await act(t('sd_next')); scene.remove(inch); il.userData.tablet.dispose(); clearBars(); if (!alive()) return;
        for (const n of S.band >= 4 ? [nice(4.5 + Math.random() * 4), nice(11 + Math.random() * 6)] : [pick([6, 7, 8]), pick([3, 4, 5])]) { if (!(await chalkTry(n))) return; }
        setChalk(null); markSeen('ruler'); }
      /* one try with the chalk: move it to n cm; a miss shows where n is, and the child tries again */
      async function chalkTry(n) { S.target = n; setChalk(null); tell(K('sd_lRuler'), t('sd_try', { n: num(n) })); hint(() => { bar(0, n, t('sd_ncm', { n: num(n) })); c.tween(0.001, () => {}, clearBars, 2.4); });
        for (;;) { startChalk({ kind: 'chalk', zoom: S.step < 1 || narrow(), onMove: () => S.ready && S.ready() }); await act(t('sd_done'), { wait: true }); S.drag = null; if (!alive()) return false;
          if (same(S.chalkCm, n)) { S.api.sfx('correct'); tell(K('sd_lRuler'), t('sd_yes', { n: num(n) })); hint(null); view('work'); await wait(1.1); return true; }
          S.api.sfx('wrong'); tell(K('sd_lRuler'), t('sd_notThere', { v: num(S.chalkCm), n: num(n) })); bar(0, n, t('sd_ncm', { n: num(n) })); await wait(1.8); clearBars(); } }

      /* ---- lesson 2: around a curve — a string round the spool, pinned, laid straight on the ruler from 0 ---- */
      async function lessonCurve() { view('work'); tell(K('sd_lCurve'), t('sd_c1')); await act(t('sd_next')); if (!alive()) return;
        tell(K('sd_lCurve'), t('sd_c2')); const r = 7 / TAU * CM + 0.02, sp = spool.position; await wrapAndLay(a => new T.Vector3(sp.x + Math.cos(a) * r, 0.4, sp.z + Math.sin(a) * r), 7, PI / 2); if (!alive()) return;
        tell(K('sd_lCurve'), t('sd_c3')); bar(0, 7, t('sd_ncm', { n: 7 })); await act(t('sd_next')); clearBars(); clearString(); if (!alive()) return;
        tell(K('sd_lCurve'), t('sd_c4')); await act(t('sd_next')); markSeen('curve'); }

      /* ---- lesson 3: circles — a centre, the radius (pin, string, chalk), every edge point the same distance, the diameter; π for the oldest ---- */
      const chalkLine = new T.MeshBasicMaterial({ color: 0x2a6ad8 });
      let ringObj = null; function setRing(cx, cz, r, arc) { if (ringObj) { scene.remove(ringObj); ringObj.geometry.dispose(); ringObj = null; } if (!arc) return; ringObj = new T.Mesh(new T.TorusGeometry(r, 0.025, 4, 96, arc), chalkLine); ringObj.rotation.x = -PI / 2; ringObj.position.set(cx, 0.075, cz); scene.add(ringObj); }
      function square(cx, cz, half, fab) { const g = new T.Group(); scene.add(g); const tx = fabricTex(fab.col, fab.kind).clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(half * 2 / (5 * CM), half * 2 / (5 * CM));
        const top = mesh(new T.PlaneGeometry(half * 2, half * 2), new T.MeshStandardMaterial({ color: 0xffffff, map: tx, roughness: 0.8 }), g, 0, 0.05, 0); top.rotation.x = -PI / 2; mesh(new T.BoxGeometry(half * 2, 0.04, half * 2), M(new T.Color(fab.col).multiplyScalar(0.7).getHex()), g, 0, 0.02, 0); g.position.set(cx, 0, cz); g.userData.tx = tx; return g; }
      const lessonFab = { col: 0xbfe0ff, kind: 'dots' };
      async function toCircleDesk() { S.cx = 0.9; S.cz = RZ - RW * CM / 2 - 1.9; S.x0 = S.cx; S.dz = (S.cz + 0.02) - (RZ - RW * CM / 2); await glide(ruler, rulerAt().setZ(S.cz + RW * CM / 2 + 0.02), 0.8, 0.4); view('circle'); }
      async function toRulerDesk() { S.x0 = R0X; S.dz = 0; await glide(ruler, rulerAt(), 0.8, 0.4); rulerHome(); view('work'); }
      async function lessonCircle() { await toCircleDesk(); const sq = square(S.cx, S.cz, 2.3, lessonFab); const pn = pin(); pn.position.set(S.cx, 0.05, S.cz);
        tell(K('sd_lCircle'), t('sd_o1')); await act(t('sd_next')); if (!alive()) return;
        const r = 3; setChalk(null); const str = () => setString([new T.Vector3(S.cx, 0.12, S.cz), new T.Vector3(S.cx + r * CM, 0.12, S.cz)], 0.02);
        tell(K('sd_lCircle'), t('sd_o2', { n: r })); str(); const ck = mesh(new T.CylinderGeometry(0.16, 0.16, 0.1, 3), chalkM, null, S.cx + r * CM, 0.12, S.cz); bar(0, r, t('sd_ncm', { n: r })); await act(t('sd_next')); if (!alive()) return; clearBars();
        await glide(ruler, rulerAt().setZ(RZ + 0.6), 0.6, 0.3); tell(K('sd_lCircle'), t('sd_o3', { n: r }));
        await anim(2.2, k => { const a = k * TAU; ck.position.set(S.cx + Math.cos(a) * r * CM, 0.12, S.cz - Math.sin(a) * r * CM); setString([new T.Vector3(S.cx, 0.12, S.cz), ck.position.clone()], 0.02); setRing(S.cx, S.cz, r * CM, Math.max(0.01, a)); });
        const spokes = new T.Group(); scene.add(spokes); for (const a of [0.5, 2.3, 4.1]) { const sk = new T.Mesh(new T.BoxGeometry(r * CM, 0.02, 0.05), new T.MeshBasicMaterial({ color: 0xff4a8a })); sk.position.set(S.cx + Math.cos(a) * r * CM / 2, 0.1, S.cz - Math.sin(a) * r * CM / 2); sk.rotation.y = a; spokes.add(sk); }
        const lr = c.label(t('sd_ncm', { n: r }), -1, narrow() ? 0.5 : 0.4); lr.position.set(S.cx + Math.cos(0.5) * r * CM / 2, 0.7, S.cz - Math.sin(0.5) * r * CM / 2); c.faceCam(lr); spokes.add(lr); await act(t('sd_next')); if (!alive()) return;
        scene.remove(spokes); lr.userData.tablet.dispose(); tell(K('sd_lCircle'), t('sd_o4', { n: r, d: 2 * r, eq: iso(r + ' + ' + r + ' = ' + 2 * r) })); const dia = mesh(new T.BoxGeometry(2 * r * CM, 0.02, 0.06), new T.MeshBasicMaterial({ color: 0x3a7aff }), null, S.cx, 0.1, S.cz); const ld = c.label(t('sd_ncm', { n: 2 * r }), -1, narrow() ? 0.5 : 0.4); ld.position.set(S.cx, 0.75, S.cz + 0.15); c.faceCam(ld); scene.add(ld);
        await act(t('sd_next')); scene.remove(dia); scene.remove(ld); ld.userData.tablet.dispose(); if (!alive()) return;
        tell(K('sd_lCircle'), t('sd_o6')); await act(t('sd_next')); if (!alive()) return;   /* her waist is a circle too */
        if (S.band >= 5) { tell(K('sd_lCircle'), t('sd_o5')); setString(null); scene.remove(ck); const around = +(TAU * r).toFixed(1), cx0 = S.cx, cz0 = S.cz; await toRulerDesk(); if (!alive()) return;
          await wrapAndLay(a => new T.Vector3(cx0 + Math.cos(a) * r * CM, 0.1, cz0 + Math.sin(a) * r * CM), around, 0); if (!alive()) return;
          bar(0, around, t('sd_ncm', { n: fmt(around, 1) })); await act(t('sd_next')); clearBars(); clearString(); if (!alive()) return; }
        setString(null); setRing(0, 0, 0, 0); scene.remove(ck); scene.remove(pn); scene.remove(sq); sq.userData.tx.dispose(); if (S.x0 !== R0X) await toRulerDesk(); markSeen('circle'); markSeen('radius'); }

      /* ---- the order: what the doll wears today, climbing with the child's level ---- */
      let m = null;
      function order(b) { const fab = i => ({ col: PASTEL[(i + S.seed) % 6], kind: FAB[(i * 2 + S.seed) % 6] }), L = (a, z) => nice(a + Math.random() * (z - a)), P = [];
        /* every piece starts from measuring HER (Yoni 2026-09-28: plain 'cut 7 cm' is not geometry): the circle skirt from her waist's radius,
           the belt and the top from the way round her, the beret a circle, the shoes from her foot */
        /* Yoni 2026-09-30: every outfit is a skirt, a top, at least one more accessory and shoes; from age 8 the top
           is a rectangle: cut its length, turn the fabric, cut its width — two measurements in cm for one piece */
        P.push({ kind: 'skirt', how: b >= 5 ? 'around' : 'across', len: b <= 3 ? pick([3, 4]) : b === 4 ? pick([3, 4, 5]) : L(3, 5), fab: fab(0) });
        P.push(b <= 2 ? { kind: 'top', how: 'cut', dim: 'h', v: pick([3, 4]), fab: fab(2) } : { kind: 'top', how: 'rect', h: b === 3 ? pick([3, 4]) : b === 4 ? pick([3, 3.5, 4]) : L(3, 4), fab: fab(2) });
        if (b === 1) P.push({ kind: 'bow', how: 'cut', dim: 'l', v: pick([6, 7, 8, 9, 10]), fab: fab(1) });
        if (b >= 2 && b !== 4 && b !== 5) P.push({ kind: 'belt', how: b >= 6 ? 'pi' : 'wrap', fab: fab(1) });
        if (b >= 4) P.push({ kind: 'beret', how: b >= 5 ? 'diam' : 'radius', v: b === 4 ? pick([2, 2.5, 3]) : nice(2 + Math.random() * 1.4), fab: fab(3) });
        /* Yoni 2026-10-09: no cape; jewellery instead ('necklaces, rings, earrings, jewelry in general'), each piece measured like the rest:
           a necklace or drop earrings cut to length (4–7), a necklace or bracelet wrapped round her (8–9, halves at 10–11, mm after), hoop
           earrings drawn as circles from their radius (10–11) or diameter (12+), a necklace worked out as 2 × π × r (14–15). A ring from the
           jewellery box finishes every look. The strip the child cuts is gold; the gem takes a colour of its own */
        const gold = { col: 0xf2c94c, kind: 'plain', gem: [0xff4f9a, 0x3a7ad8, 0x7fdcb0, 0xc0a0ff, 0xe8343a, 0x8fd0f0][(S.seed + b) % 6] };
        const J = b === 1 ? { kind: 'necklace', how: 'cut', dim: 'l', v: pick([6, 7, 8, 9]) }
          : b === 2 ? pick([{ kind: 'earrings', how: 'cut', dim: 'l', v: pick([2, 3, 4]) }, { kind: 'necklace', how: 'cut', dim: 'l', v: pick([7, 8, 9, 10]) }])
          : b === 3 ? pick([{ kind: 'necklace', how: 'wrap' }, { kind: 'bracelet', how: 'wrap' }])
          : b === 4 ? pick([{ kind: 'earrings', how: 'radius', v: pick([1, 1.5, 2]) }, { kind: 'necklace', how: 'wrap' }])
          : b === 5 ? pick([{ kind: 'earrings', how: 'diam', v: pick([1, 1.2, 1.4, 1.5, 1.6]) }, { kind: 'bracelet', how: 'wrap' }])
          : pick([{ kind: 'necklace', how: 'pi' }, { kind: 'earrings', how: 'diam', v: nice(1 + Math.random() * 0.8) }]);
        P.push(Object.assign(J, { fab: gold }));
        P.push({ kind: 'shoes', how: b <= 2 ? 'sole' : 'strap', fab: { col: pick([0xff7eb6, 0xb48cff, 0x5ad0c8, 0xffb84a]), kind: 'plain' } });
        return P; }
      const slotY = k => ({ skirt: D.WY - 2, top: D.CHY, belt: D.WY, bow: D.headY + 6.4, beret: D.headY + 6.3, necklace: D.NKY - 0.6, earrings: D.headY - 2.6, bracelet: D.WY - 0.5, ring: D.WY - 1.5 })[k] || 3;   /* where each piece lands on her */
      const markFor = (k, v) => k === 'skirt' ? [D.WY + 0.3 - v, D.rw + 0.36 + v * 0.5] : k === 'top' ? [D.WY - 0.2 + v, 2.5] : null;
      const offset = () => S.band >= 2 ? pick(S.step < 1 ? [0.5, 1, 1.5, 2.5, 3] : [1, 2, 3]) : 0;

      /* line the fabric up with 0 (from age 6), chalk the size, cut: returns the piece (a strip from 0 to the chalk) */
      async function cutTo(s, target, kick, what) { view('work');
        if (Math.abs(s.left) > 1e-6) { tell(kick, t('sd_align')); hint(() => { bar(-0.06, 0.06, t('sd_zero'), 0x3a7aff); c.tween(0.001, () => {}, clearBars, 2.2); });
          for (;;) { S.drag = { kind: 'fabric', strip: s, onRelease: () => S.ready && S.ready() }; await act(t('sd_done'), { wait: true }); S.drag = null; if (!alive()) return null;
            if (Math.abs(s.left) < 1e-6) { S.api.sfx('correct'); break; } S.api.sfx('wrong'); tell(kick, t('sd_alignNo', { v: num(s.left) })); bar(-0.06, 0.06, t('sd_zero'), 0x3a7aff); await wait(1.8); clearBars(); tell(kick, t('sd_align')); } }
        S.target = target; setChalk(null); tell(kick, t('sd_mark', { what, n: num(target) })); hint(() => { bar(0, target, t('sd_ncm', { n: num(target) })); c.tween(0.001, () => {}, clearBars, 2.4); });
        startChalk({ kind: 'chalk', zoom: S.step < 1 || narrow(), min: S.step, max: Math.min(20, s.left + s.len - 0.2), onMove: () => S.ready && S.ready() });
        await act(t('sd_cut'), { wait: true }); S.drag = null; hint(null); if (!alive()) return null; const at = S.chalkCm; setChalk(null); if (narrow()) view('zoom', { x: X(at) }); else view('work'); const pc = await cut(s, at); view('work'); return pc; }
      /* before each piece the child chooses its fabric (or the shoes' plastic): a Colours tab and a Patterns tab, the strip on the desk shows it */
      function pickFabric(p, kick) { return new Promise(res => { if (!ui || S.dead) return; view('work'); const plastic = p.kind === 'shoes'; const fab = { col: p.fab.col, kind: p.fab.kind || 'plain' };
        tell(kick, t(plastic ? 'sd_pickShoes' : 'sd_pick', { what: t('sd_k_' + p.kind).toLowerCase() })); let prev = makeStrip(0, 14, fab, plastic);
        const redo = () => { dropStrip(prev); prev = makeStrip(0, 14, fab, plastic); paint(); S.api.sfx('tick'); };
        const box = el('div', 'sd-pick'), tabs = el('div', 'sd-tabs'), grid = el('div', 'sd-grid'); const tC = el('button', 'sd-tab on', t('sd_colors')), tP = el('button', 'sd-tab', t('sd_patterns')); tC.type = tP.type = 'button'; tabs.append(tC, tP); box.append(tabs, grid); ui.root.appendChild(box);
        let tab = 'c'; const thumb = (col, kind) => { const cv2 = fabricTex(col, kind).image; try { return 'url(' + cv2.toDataURL() + ')'; } catch (e) { return hexStr(col); } };
        function paint() { grid.replaceChildren(); tC.classList.toggle('on', tab === 'c'); tP.classList.toggle('on', tab === 'p'); grid.classList.toggle('pats', tab === 'p');
          (tab === 'c' ? CHOICE_COLS : CHOICE_PATS).forEach(v => { const b = el('button', 'sd-sw'); b.type = 'button'; if (tab === 'c') { b.style.background = hexStr(v); b.classList.toggle('on', v === fab.col); } else { b.style.backgroundImage = thumb(fab.col, v); b.style.backgroundSize = '200%'; b.classList.toggle('on', v === fab.kind); }
            b.onclick = () => { if (tab === 'c') fab.col = v; else fab.kind = v; redo(); }; grid.appendChild(b); }); }
        tC.onclick = () => { tab = 'c'; paint(); S.api.sfx('tap'); }; tP.onclick = () => { tab = 'p'; paint(); S.api.sfx('tap'); }; paint();
        act(t('sd_pickDone')).then(() => { box.remove(); dropStrip(prev); p.fab = fab; res(); }); }); }
      async function toDoll(piece, kind) { view('doll'); D.look = 0; const to = D.body.localToWorld(new T.Vector3(0, slotY(kind), 2.4)); await glide(piece.g, to, 0.95, 2.4); dropStrip(piece); }
      function wear(kind, v, fab) { const g = D.dress(kind, v, fab); g.scale.setScalar(0.7); c.tween(0.4, k => g.scale.setScalar(0.7 + 0.3 * c.over(k))); c.burst(D.body.localToWorld(new T.Vector3(0, slotY(kind), 2)), 0xffd6e6, 12); return g; }
      async function happy(kick, what, v) { S.api.sfx('correct'); D.setMood('wow'); D.cheer = 0.6; c.tween(1.2, k => { D.cheer = 0.6 * (1 - k); }); tell(kick, t('sd_fits', { what, n: num(v) })); await wait(1.7); D.setMood('happy'); }

      /* a straight piece: skirt, top, bow, a chain or drop earrings — and the belt, necklace or bracelet once its length is known */
      async function straight(p, kick, target) { const what = t('sd_k_' + p.kind) + (p.dim ? ', ' + t('sd_dim_' + p.dim) : ''), mk = markFor(p.kind, target); let first = true, s = makeStrip(offset(), Math.min(19.5, Math.max(target + 4.5, 12)), p.fab);
        for (;;) { let piece = await cutTo(s, target, kick, what); if (!piece || !alive()) return null; let len = piece.len;
          for (;;) { if (mk) D.showMark(mk[0], mk[1]); await toDoll(piece, p.kind); wear(p.kind, len, p.fab); await wait(0.8); if (!alive()) return null;
            if (same(len, target)) { D.clearMark(); await happy(kick, what, target); dropStrip(s); return first; }
            first = false; S.api.sfx('wrong'); D.setMood('sad'); const long = len > target; tell(kick, t(long ? 'sd_long' : 'sd_short', { what, v: num(len), n: num(target), d: num(Math.abs(len - target)) }));
            await act(t(long ? 'sd_trim' : 'sd_again')); if (!alive()) return null; D.setMood('happy'); D.undress(p.kind); D.clearMark();
            if (!long) break;   /* too short: cut a new piece from what is left */
            piece = makeStrip(0, len, p.fab); const trimmed = await cutTo(piece, target, kick, what); if (!trimmed) return null; const scrap = piece; glide(scrap.g, scrap.g.position.clone().add(new T.Vector3(1.2, -0.4, 2.4)), 0.7, 1.0).then(() => dropStrip(scrap)); piece = trimmed; len = piece.len; }
          if (s.len < target + 1) { dropStrip(s); s = makeStrip(offset(), Math.min(19.5, Math.max(target + 4.5, 12)), p.fab); } else if (S.band >= 2) { const o = offset(); await anim(0.4, k => setStrip(s, s.left + (o - s.left) * k, s.len)); setStrip(s, o, s.len); } else { await anim(0.4, k => setStrip(s, s.left * (1 - k), s.len)); setStrip(s, 0, s.len); } } }

      /* read the ruler: the child types the number where the string (or the toe) ends; a second miss shows it */
      async function readNumber(kick, ans, prompt) { S.expect = ans; tell(kick, prompt); if (S.step < 1 || narrow()) view('zoom', { x: X(ans) }); hint(() => { bar(0, ans, null, 0x3a7aff); c.tween(0.001, () => {}, clearBars, 2.2); });
        for (let tries = 0; ; tries++) { const v = await pad(S.step < 1); if (!alive()) return null;
          if (same(v, ans)) { S.api.sfx('correct'); tell(kick, t('sd_readYes', { n: num(ans) })); hint(null); await wait(1.3); view('work'); return { v: ans, ok: tries === 0 }; }
          S.api.sfx('wrong'); if (ui) ui.pad.classList.add('bad'); if (tries >= 1) { tell(kick, t('sd_readShow', { n: num(ans) })); bar(0, ans, t('sd_ncm', { n: num(ans) })); await wait(2.6); clearBars(); hint(null); view('work'); return { v: ans, ok: false }; }
          tell(kick, t('sd_readNo', { v: num(v) })); await wait(1.4); tell(kick, prompt); } }

      /* the belt: wrap the waist with the string, lay it on the ruler, read it — or, at 14–15, work it out: 2 × π × radius */
      async function belt(p, kick) { const what = t('sd_k_belt'); let first = true, target;
        if (p.how === 'pi') { view('doll'); const r = m.waistR, ans = +(2 * 3.14 * r).toFixed(1); S.expect = ans; tell(kick, t('sd_pi', { r: fmt(r, 1) })); hint(() => tell(kick, t('sd_piHint', { r: fmt(r, 1) })));
          for (let tries = 0; ; tries++) { const v = await pad(true); if (!alive()) return null; if (Math.abs(v - ans) <= 0.1 + 1e-6) { S.api.sfx('correct'); tell(kick, t('sd_piYes', { n: fmt(ans, 1) })); await wait(1.5); break; }
            S.api.sfx('wrong'); first = false; if (tries >= 1) { tell(kick, t('sd_piShow', { r: fmt(r, 1), n: fmt(ans, 1) })); await wait(3.2); break; } tell(kick, t('sd_piNo', { v: fmt(v, 1) })); await wait(1.6); tell(kick, t('sd_pi', { r: fmt(r, 1) })); }
          hint(null); target = ans; }
        else { view('doll'); D.look = 0; tell(kick, t('sd_wrapWaist')); await act(t('sd_wrap')); if (!alive()) return null; const wv = nice(m.waist);
          await wrapAndLay(onDoll(0, D.WY, 0, D.rw + 0.14, 'xz'), wv, PI / 2); if (!alive()) return null; const r = await readNumber(kick, wv, t('sd_readEnd', { what })); clearString(); if (!r) return null; first = first && r.ok; target = wv; }
        const ok = await straight(Object.assign({}, p, { kind: 'belt' }), kick, target); return ok == null ? null : first && ok; }

      /* a necklace or a bracelet: wrap the string round her collar or her wrist, lay it on the ruler, read it, cut the chain — or, at 14–15,
         work the necklace out: 2 × π × radius */
      const onWrist = r => a => { const arm = D.parts['arm1']; arm.updateMatrixWorld(true); return arm.localToWorld(new T.Vector3(Math.cos(a) * r, -2.85, Math.sin(a) * r)); };
      async function wrapJewel(p, kick) { const what = t('sd_k_' + p.kind), neck = p.kind === 'necklace', rr = neck ? m.collarR : m.wristR; let first = true, target;
        if (p.how === 'pi') { view('doll'); const ans = +(2 * 3.14 * rr).toFixed(1); S.expect = ans; tell(kick, t('sd_piNeck', { r: fmt(rr, 1) })); hint(() => tell(kick, t('sd_piHint', { r: fmt(rr, 1) })));
          for (let tries = 0; ; tries++) { const v = await pad(true); if (!alive()) return null; if (Math.abs(v - ans) <= 0.1 + 1e-6) { S.api.sfx('correct'); tell(kick, t('sd_piYesNeck', { n: fmt(ans, 1) })); await wait(1.5); break; }
            S.api.sfx('wrong'); first = false; if (tries >= 1) { tell(kick, t('sd_piShow', { r: fmt(rr, 1), n: fmt(ans, 1) })); await wait(3.2); break; } tell(kick, t('sd_piNo', { v: fmt(v, 1) })); await wait(1.6); tell(kick, t('sd_piNeck', { r: fmt(rr, 1) })); }
          hint(null); target = ans; }
        else { view('doll'); D.look = 0; tell(kick, t(neck ? 'sd_wrapNeck' : 'sd_wrapWrist')); await act(t('sd_wrap')); if (!alive()) return null; const wv = nice(TAU * rr);
          await wrapAndLay(neck ? onDoll(0, D.NKY - 0.4, 0, rr, 'xz') : onWrist(rr), wv, PI / 2); if (!alive()) return null; const rd = await readNumber(kick, wv, t('sd_readEnd', { what })); clearString(); if (!rd) return null; first = first && rd.ok; target = wv; }
        const ok = await straight(Object.assign({}, p, { dim: null }), kick, target); return ok == null ? null : first && ok; }

      /* the beret: a circle — pin in the middle, the chalk at the radius on the ruler, draw round, cut round */
      async function beret(p, kick) { const what = t('sd_k_' + p.kind), r = p.v, hoop = p.kind === 'earrings'; let first = true;   /* the beret, and hoop earrings (2026-10-09) */
        for (;;) { await toCircleDesk(); const half = Math.max(r, 3.4) * CM + 0.35, sq = square(S.cx, S.cz, half, p.fab), pn = pin(); pn.position.set(S.cx, 0.05, S.cz);
          tell(kick, p.how === 'diam' ? t(hoop ? 'sd_hoopD' : 'sd_beretD', { d: num(2 * r) }) : t(hoop ? 'sd_hoopR' : 'sd_beretR', { n: num(r) })); hint(() => tell(kick, p.how === 'diam' ? t('sd_diamHint', { d: num(2 * r), n: num(r) }) : t('sd_radHint')));
          S.target = r; setChalk(null); startChalk({ kind: 'chalk', min: 1, max: 6, onMove: v => { S.ready && S.ready(); setString([new T.Vector3(S.cx, 0.12, S.cz), new T.Vector3(X(v), 0.12, S.cz)], 0.02); } });
          await act(t('sd_draw'), { wait: true }); S.drag = null; if (!alive()) return null; const v = S.chalkCm, R = v * CM; setChalk(null); await glide(ruler, rulerAt().setZ(S.cz + R + RW * CM / 2 + 0.25), 0.5, 0.3);
          const ck = mesh(new T.CylinderGeometry(0.16, 0.16, 0.1, 3), chalkM, null, S.cx + R, 0.12, S.cz); await anim(1.8, k => { const a = k * TAU; ck.position.set(S.cx + Math.cos(a) * R, 0.12, S.cz - Math.sin(a) * R); setString([new T.Vector3(S.cx, 0.12, S.cz), ck.position.clone()], 0.02); setRing(S.cx, S.cz, R, Math.max(0.01, a)); });
          scene.remove(ck); setString(null); tell(kick, t('sd_cutRound')); await act(t('sd_cut')); if (!alive()) return null;
          await glide(sc, new T.Vector3(S.cx + R, 0.3, S.cz + 0.55 * SCS), 0.5, 1.0, new T.Euler(0, 0, 0)); await anim(1.7, k => { const a = k * TAU; const ld = 0.55 * SCS; sc.position.set(S.cx + Math.cos(a) * R + ld * Math.sin(a), 0.3, S.cz - Math.sin(a) * R + ld * Math.cos(a)); sc.rotation.set(0, a, 0); setBlades(0.06 + 0.34 * Math.abs(Math.cos(k * PI * 7))); });
          glide(sc, SC_REST.p.clone(), 0.6, 1.0, SC_REST.r).then(() => setBlades(0.12)); setRing(0, 0, 0, 0); scene.remove(pn);
          const disc = new T.Mesh(new T.CircleGeometry(R, 48), new T.MeshStandardMaterial({ color: 0xffffff, map: sq.userData.tx, roughness: 0.8, side: T.DoubleSide })); disc.rotation.x = -PI / 2; disc.position.set(S.cx, 0.09, S.cz); scene.add(disc); scene.remove(sq);
          await glide(disc, disc.position.clone().setY(0.6), 0.35); const dg = { g: disc }; view('doll'); await glide(disc, D.body.localToWorld(new T.Vector3(0, slotY(p.kind), 2)), 0.9, 2.0); scene.remove(disc); disc.geometry.dispose(); void dg;
          wear(p.kind, hoop ? { hoop: v } : v, p.fab); await wait(0.8); if (!alive()) return null;
          if (same(v, r)) { await happy(kick, what, r); sq.userData.tx.dispose(); await toRulerDesk(); return first; }
          first = false; S.api.sfx('wrong'); D.setMood('sad'); tell(kick, t(v > r ? (hoop ? 'sd_hoopBig' : 'sd_big') : (hoop ? 'sd_hoopSmall' : 'sd_small'), { v: num(v), n: num(r) })); await act(t('sd_again')); if (!alive()) return null; D.setMood('happy'); D.undress(p.kind); sq.userData.tx.dispose(); } }

      /* ---- the circle skirt (Yoni 2026-09-28: 'cutting in the right number has nothing to do with geometry — teach how to measure a radius
         like the waist, then cut it'). A circle skirt is a ring of fabric whose hole is as big as her waist, so the child first finds her
         waist's radius: across her waist with two blocks and a ruler, then half of it (to age 11), or round it with the string, then
         ÷ 6.28 (12+). Then the compass is set to that radius, the circle drawn and cut. Too small a hole won't close round her; too big
         and the skirt falls down. ---- */
      const iso = s => '‎' + String(s).replace(/ /g, ' ') + '‎';   /* '2 + 2 = 4' stays left-to-right and on one line inside Hebrew */
      function blocksAt(y, half) {   /* two wooden blocks that touch her sides at height y (her cm), and a ruler under them: 0 at the left block */
        const g = new T.Group(); D.body.add(g); const wood = M(0xd9a66a, { roughness: 0.55 }), red = new T.MeshBasicMaterial({ color: 0xe8344a });
        const blocks = [-1, 1].map(s => { const b = new T.Mesh(new T.BoxGeometry(0.5, 2.6, 3.6), wood); b.position.set(s * 8, y, 0.8); b.castShadow = true; g.add(b); return b; });
        const W = 2 * half + 3.4, geo = new T.PlaneGeometry(W, 1.7), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (RM - 0.8 + uv.getX(i) * W) / RULER_CM, 0.5 + uv.getY(i) * 0.5);
        const ru = new T.Group(); ru.position.set(-half - 0.8 + W / 2, y - 2.25, 2.7); ru.visible = false; g.add(ru); ru.add(new T.Mesh(geo, new T.MeshStandardMaterial({ map: rulerTex(), roughness: 0.6 })));
        const back = new T.Mesh(new T.BoxGeometry(W, 1.7, 0.25), M(0xe8dcc0, { roughness: 0.7 })); back.position.z = -0.14; ru.add(back);
        const lines = [-1, 1].map(s => { const l = new T.Mesh(new T.BoxGeometry(0.07, 1.1, 0.03), red); l.position.set(s * half, y - 1.85, 2.84); l.visible = false; g.add(l); return l; });
        const bar2 = col => { const b = new T.Mesh(new T.BoxGeometry(1, 0.22, 0.03), new T.MeshBasicMaterial({ color: col })); b.position.set(0, y - 1.52, 2.86); b.visible = false; g.add(b); return b; };
        const hl = bar2(0xff4a8a), hl2 = bar2(0x3a7aff), mid = new T.Mesh(new T.BoxGeometry(0.06, 2.8, 0.03), new T.MeshBasicMaterial({ color: 0x3a7aff })); mid.position.set(0, y - 0.6, 2.86); mid.visible = false; g.add(mid);
        return {
          async slideIn() { ru.visible = true; await anim(1.0, k => { const e = ease(k); blocks.forEach((b, i) => { b.position.x = (i ? 1 : -1) * (8 - (8 - half - 0.25) * e); }); }); lines.forEach(l => { l.visible = true; }); if (S.api) S.api.sfx('tick'); },
          mark(on) { hl.visible = !!on; hl2.visible = mid.visible = false; hl.scale.x = 2 * half; hl.position.x = 0; },   /* the whole way across: the diameter */
          halves(on) { mid.visible = hl.visible = hl2.visible = !!on; hl.scale.x = hl2.scale.x = half; hl.position.x = -half / 2; hl2.position.x = half / 2; },   /* her middle, and the two halves: each one a radius */
          dispose() { D.body.remove(g); g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); } }; }
      /* read a number off a ruler that is not the desk's (the blocks' ruler): like readNumber, without moving the camera */
      async function readAt(kick, ans, prompt, show, showText) { S.expect = ans; tell(kick, prompt); hint(() => { show(true); c.tween(0.001, () => {}, () => show(false), 2.2); });
        for (let tries = 0; ; tries++) { const v = await pad(S.step < 1); if (!alive()) return null;
          if (same(v, ans)) { S.api.sfx('correct'); tell(kick, t('sd_readYes', { n: num(ans) })); hint(null); await wait(1.2); return { v: ans, ok: tries === 0 }; }
          S.api.sfx('wrong'); if (ui) ui.pad.classList.add('bad'); if (tries >= 1) { tell(kick, showText); show(true); await wait(2.8); show(false); hint(null); return { v: ans, ok: false }; }
          tell(kick, t('sd_readNo', { v: num(v) })); await wait(1.4); tell(kick, prompt); } }
      /* to age 11: across her waist (the diameter), then half of it (the radius) */
      async function acrossWaist(kick) { const r = m.waistR, d = +(2 * r).toFixed(1); let ok = true;
        const r0 = D.root.rotation.y; await anim(0.6, k => { D.root.rotation.y = r0 * (1 - ease(k)); D.cheer = 0.45 * ease(k); });   /* she turns to us and lifts her arms a little */
        S.wy = D.body.localToWorld(new T.Vector3(0, D.WY, 0)).y; view('waist'); tell(kick, t('sd_acr')); const cal = blocksAt(D.WY, r); await cal.slideIn(); if (!alive()) return null; await wait(0.8);
        const rd = await readAt(kick, d, t('sd_acrRead'), on => cal.mark(on), t('sd_acrShow', { n: num(d) })); if (!rd) return null; ok = rd.ok;
        cal.halves(true); S.expect = r; const ask = () => tell(kick, t('sd_half', { d: num(d) })); ask(); hint(() => tell(kick, t('sd_halfHint', { d: num(d) })));
        for (let tries = 0; ; tries++) { const v = await pad(S.step < 1); if (!alive()) return null;
          if (same(v, r)) { S.api.sfx('correct'); tell(kick, t('sd_halfYes', { r: num(r) })); break; }
          S.api.sfx('wrong'); ok = false; if (ui) ui.pad.classList.add('bad'); if (tries >= 1) { tell(kick, t('sd_halfShow', { eq: iso(num(r) + ' + ' + num(r) + ' = ' + num(d)), d: num(d), r: num(r) })); await wait(3.4); break; }
          tell(kick, t('sd_halfNo', { v: num(v), d: num(d) })); await wait(1.6); ask(); }
        hint(null); await wait(1.5); cal.dispose(); await anim(0.5, k => { D.root.rotation.y = r0 * ease(k); D.cheer = 0.45 * (1 - ease(k)); }); return { r, ok }; }
      /* from 12: round her waist with the string, then the radius = the way round ÷ 6.28 (2 × π) */
      async function aroundWaist(kick) { const r = m.waistR, C = nice(m.waist); let ok = true; view('doll'); D.look = 0; tell(kick, t('sd_arWrap')); await act(t('sd_wrap')); if (!alive()) return null;
        await wrapAndLay(onDoll(0, D.WY, 0, D.rw + 0.14, 'xz'), C, PI / 2); if (!alive()) return null; const rd = await readNumber(kick, C, t('sd_readEnd', { what: t('sd_k_skirt') })); clearString(); if (!rd) return null; ok = rd.ok;
        view('doll'); S.expect = r; const ask = () => tell(kick, t('sd_arR', { c: num(C), eq: iso(num(C) + ' ÷ 6.28'), f: iso('2 × 3.14') })); ask(); hint(() => tell(kick, t('sd_arHint', { c: num(C) })));
        for (let tries = 0; ; tries++) { const v = await pad(true); if (!alive()) return null;
          if (Math.abs(v - r) <= 0.1 + 1e-6) { S.api.sfx('correct'); tell(kick, t('sd_arYes', { r: num(r), eq: iso('6.28 × ' + num(r) + ' ≈ ' + num(C)) })); break; }
          S.api.sfx('wrong'); ok = false; if (ui) ui.pad.classList.add('bad'); if (tries >= 1) { tell(kick, t('sd_arShow', { r: num(r), eq: iso(num(C) + ' ÷ 6.28 ≈ ' + num(r)) })); await wait(3.4); break; }
          tell(kick, t('sd_arNo', { eq: iso('6.28 × ' + fmt(v, 1) + ' = ' + fmt(6.28 * v, 1)), c: num(C) })); await wait(1.8); ask(); }
        hint(null); await wait(1.3); return { r, ok }; }
      /* the compass on the circle mat: the chalk at a radius on the ruler, the string from the pin, swing round; returns the radius drawn */
      async function compass(kick, prompt, target, auto) { S.target = target; setChalk(null); tell(kick, prompt); const strTo = v => setString([new T.Vector3(S.cx, 0.12, S.cz), new T.Vector3(X(v), 0.12, S.cz)], 0.02);
        if (auto) { await wait(1.4); setChalk(target); strTo(target); if (S.api) S.api.sfx('tick'); await wait(1.6); }
        else { startChalk({ kind: 'chalk', min: 0.5, max: 9, onMove: v => { S.ready && S.ready(); strTo(v); } }); await act(t('sd_draw'), { wait: true }); S.drag = null; if (!alive()) return null; }
        const v = S.chalkCm, R = v * CM; setChalk(null); await glide(ruler, rulerAt().setZ(S.cz + Math.max(R, 0.6) + RW * CM / 2 + 0.25), 0.5, 0.3);
        const ck = mesh(new T.CylinderGeometry(0.16, 0.16, 0.1, 3), chalkM, null, S.cx + R, 0.12, S.cz); await anim(1.6, k => { const a = k * TAU; ck.position.set(S.cx + Math.cos(a) * R, 0.12, S.cz - Math.sin(a) * R); setString([new T.Vector3(S.cx, 0.12, S.cz), ck.position.clone()], 0.02); setRing(S.cx, S.cz, R, Math.max(0.01, a)); });
        scene.remove(ck); setString(null); return v; }
      const keepRing = rad => { const k = new T.Mesh(new T.TorusGeometry(rad * CM, 0.025, 4, 96), chalkLine); k.rotation.x = -PI / 2; k.position.set(S.cx, 0.075, S.cz); scene.add(k); setRing(0, 0, 0, 0); return { dispose() { scene.remove(k); k.geometry.dispose(); } }; };
      async function cutRound(R, park) { await glide(sc, new T.Vector3(S.cx + R, 0.3, S.cz + 0.55 * SCS), 0.5, 1.0, new T.Euler(0, 0, 0)); await anim(1.5, k => { const a = k * TAU; const ld = 0.55 * SCS; sc.position.set(S.cx + Math.cos(a) * R + ld * Math.sin(a), 0.3, S.cz - Math.sin(a) * R + ld * Math.cos(a)); sc.rotation.set(0, a, 0); setBlades(0.06 + 0.34 * Math.abs(Math.cos(k * PI * 7))); });
        if (park) glide(sc, SC_REST.p.clone(), 0.6, 1.0, SC_REST.r).then(() => setBlades(0.12)); }
      async function circleSkirt(p, kick) { view('doll'); D.look = 0; tell(kick, t('sd_skIntro')); await act(t('sd_next')); if (!alive()) return null;
        const got = p.how === 'around' ? await aroundWaist(kick) : await acrossWaist(kick); if (!got || !alive()) return null; let first = got.ok;
        const r = got.r, L = p.len, O = +(r + L).toFixed(1);
        for (;;) { S.circBig = true; await toCircleDesk(); const sq = square(S.cx, S.cz, O * CM + 0.45, p.fab), pn = pin(); pn.position.set(S.cx, 0.05, S.cz);
          const hole = await compass(kick, t('sd_skHole', { r: num(r) }), r, false); if (hole == null) return null; const inner = keepRing(hole);   /* 1: the hole for her waist */
          await glide(ruler, rulerAt().setZ(S.cz + RW * CM / 2 + 0.02), 0.5, 0.3); let outer = null;   /* 2: the outer edge = her waist's radius + the skirt's length */
          if (p.how === 'around') for (;;) { const v = await compass(kick, t('sd_skOuter', { l: num(L) }), O, false); if (v == null) return null; if (same(v, O)) { outer = v; break; }
            S.api.sfx('wrong'); first = false; tell(kick, t('sd_skOuterNo', { eq: iso(num(r) + ' + ' + num(L) + ' = ' + num(O)), v: num(v) })); await wait(2.6); setRing(0, 0, 0, 0); await glide(ruler, rulerAt().setZ(S.cz + RW * CM / 2 + 0.02), 0.5, 0.3); }
          else outer = await compass(kick, t('sd_skOuterAuto', { l: num(L), eq: iso(num(r) + ' + ' + num(L) + ' = ' + num(O)) }), O, true);
          if (outer == null || !alive()) return null;
          tell(kick, t('sd_skCut')); await act(t('sd_cut')); if (!alive()) return null; await cutRound(outer * CM, false); await cutRound(hole * CM, true); setRing(0, 0, 0, 0); inner.dispose(); scene.remove(pn);   /* 3: cut round the outside, then the hole */
          const ringM = new T.Mesh(new T.RingGeometry(hole * CM, outer * CM, 72), new T.MeshStandardMaterial({ color: 0xffffff, map: sq.userData.tx, roughness: 0.8, side: T.DoubleSide })); ringM.rotation.x = -PI / 2; ringM.position.set(S.cx, 0.09, S.cz); scene.add(ringM); scene.remove(sq);
          const disc = new T.Mesh(new T.CircleGeometry(hole * CM, 48), ringM.material); disc.rotation.x = -PI / 2; disc.position.set(S.cx, 0.085, S.cz); scene.add(disc);
          await glide(ringM, ringM.position.clone().setY(0.7), 0.4); glide(disc, disc.position.clone().add(new T.Vector3(1.8, 0, 1.4)), 0.6, 0.4).then(() => { scene.remove(disc); disc.geometry.dispose(); });   /* the middle falls away */
          S.circBig = false; view('doll'); D.look = 0; const at = (y, z) => D.body.localToWorld(new T.Vector3(0, y, z || 0));   /* 4: to her waist — does the hole fit? */
          await glide(ringM, at(D.WY - 0.3, 7), 1.0, 1.4);
          if (same(hole, r)) { await glide(ringM, at(D.WY - 0.3), 0.6); scene.remove(ringM); ringM.geometry.dispose(); wear('skirt', L, p.fab); await wait(0.6);
            S.api.sfx('correct'); D.setMood('wow'); D.cheer = 0.6; c.tween(1.2, k => { D.cheer = 0.6 * (1 - k); }); tell(kick, t('sd_skYes', { r: num(r) })); await wait(2.0); D.setMood('happy'); sq.userData.tx.dispose(); await toRulerDesk(); return first; }
          first = false; S.api.sfx('wrong'); D.setMood('sad');
          if (hole < r) { const z0 = ringM.position.clone(); await anim(0.7, k => { ringM.position.copy(z0).add(new T.Vector3(Math.sin(k * PI * 6) * 0.08 * (1 - k), 0, 0)); }); tell(kick, t('sd_skSmall', { v: num(hole), r: num(r) })); }   /* it can't close round her */
          else { await glide(ringM, at(D.WY - 0.3), 0.5); await glide(ringM, at(0.3), 1.0); tell(kick, t('sd_skBig', { v: num(hole), r: num(r) })); }   /* it slides down to her feet */
          await act(t('sd_again')); if (!alive()) return null; D.setMood('happy'); scene.remove(ringM); ringM.geometry.dispose(); sq.userData.tx.dispose(); } }
      /* a rectangle (Yoni 2026-09-30: 'the upgraded levels should cut both width and length'): the bolt is a little wider than the piece.
         Cut the first side (A) across the bolt; turn the piece a quarter turn so its other side lies along the ruler; cut the second side (B).
         A is checked on the desk (msgA says what a wrong A does), B on the doll. Returns true when both were right the first time. */
      async function rect(p, kick, A, B, dA, dB, msgA) { const k = t('sd_k_' + p.kind), wA = k + ', ' + t('sd_dim_' + dA), wB = k + ', ' + t('sd_dim_' + dB); let first = true;
        const bolt = () => makeStrip(offset(), Math.min(19.5, Math.max(A + 4.5, 12)), p.fab, false, nice(B + 2.5));
        tell(kick, t('sd_rect', { a: t('sd_dim_' + dA), x: num(A), b: t('sd_dim_' + dB), y: num(B) })); view('work'); let s = bolt(); fitChalk(s.w); await act(t('sd_next')); if (!alive()) return null;
        let piece;
        for (;;) { piece = await cutTo(s, A, kick, wA); if (!piece || !alive()) return null;
          if (same(piece.len, A)) { S.api.sfx('correct'); break; }
          first = false; S.api.sfx('wrong'); D.setMood('sad'); tell(kick, msgA(piece.len)); await act(t('sd_again')); if (!alive()) return null; D.setMood('happy');
          const scrap = piece; glide(scrap.g, scrap.g.position.clone().add(new T.Vector3(1.2, -0.4, 2.4)), 0.7, 1.0).then(() => dropStrip(scrap));
          if (s.len < A + 0.6) { dropStrip(s); s = bolt(); } else { const o = offset(); await anim(0.4, q => setStrip(s, s.left + (o - s.left) * q, s.len)); setStrip(s, o, s.len); } }
        dropStrip(s); const W = piece.w;
        /* the quarter turn: the side that was across the bolt now runs along the ruler, the side just cut runs back from it */
        const turned = async () => { const o = offset(), at = new T.Vector3(X(o) + W * CM / 2, piece.g.position.y, FE - A * CM / 2);
          await glide(piece.g, at, 0.8, 0.8, new T.Euler(0, PI / 2, 0)); dropStrip(piece); const s2 = makeStrip(o, W, p.fab, false, A); fitChalk(A); return s2; };
        tell(kick, t('sd_turn', { a: t('sd_dim_' + dA), n: num(A), b: t('sd_dim_' + dB) })); let s2 = await turned(); await act(t('sd_next')); if (!alive()) return null;
        for (;;) { const pc = await cutTo(s2, B, kick, wB); if (!pc || !alive()) return null; fitChalk(FW); const len = pc.len, mk = markFor(p.kind, B);
          if (mk) D.showMark(mk[0], mk[1]); await toDoll(pc, p.kind); wear(p.kind, len, p.fab); await wait(0.8); if (!alive()) return null;
          if (same(len, B)) { D.clearMark(); dropStrip(s2); await happy(kick, wB, B); if (S.band >= 5) { tell(kick, t('sd_area', { a: num(A), b: num(B), n: String(Math.round(A * B * 100) / 100) })); await wait(2.6); } return first; }
          first = false; S.api.sfx('wrong'); D.setMood('sad'); const long = len > B; tell(kick, t(long ? 'sd_long' : 'sd_short', { what: wB, v: num(len), n: num(B), d: num(Math.abs(len - B)) }));
          await act(t('sd_again')); if (!alive()) return null; D.setMood('happy'); D.undress(p.kind); D.clearMark();
          /* a fresh piece, already turned, cut to the right first side */
          dropStrip(s2); view('work'); s2 = makeStrip(offset(), W, p.fab, false, A); fitChalk(A); }
      }
      /* the top: round her body under her arms with the string (its width is the way round), then how tall it is */
      async function topRect(p, kick) { const what = t('sd_k_top'); view('doll'); D.look = 0; tell(kick, t('sd_wrapBody')); await act(t('sd_wrap')); if (!alive()) return null;
        const rc = (D.chestR || 2.12) + 0.18, C = nice(TAU * rc); await wrapAndLay(onDoll(0, D.CHY, 0, rc, 'xz'), C, PI / 2); if (!alive()) return null;
        const rd = await readNumber(kick, C, t('sd_readEnd', { what })); clearString(); if (!rd) return null;
        const ok = await rect(p, kick, C, p.h, 'round', 'h', v => t(v > C ? 'sd_topLong' : 'sd_topShort', { v: num(v), n: num(C) })); return ok == null ? null : rd.ok && ok; }
      /* shoes from plastic: read the footprint for the sole, the strap round the foot (given until 8, wrapped from 8), cut both, fit */
      function footprint(len) { const w = 2.2, h = len + 0.6, tx = canvasTex(256, Math.round(256 * h / w), (g, W, H) => { g.fillStyle = '#fffdf6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a5a7a'; g.lineWidth = 6; const cx = W / 2, top = (0.3 / h) * H, bot = H - (0.3 / h) * H, fw = W * 0.28;
          const L = bot - top; g.fillStyle = 'rgba(200,120,160,.22)'; g.beginPath(); g.moveTo(cx, bot); g.bezierCurveTo(cx + fw * 0.9, bot, cx + fw * 0.8, top + L * 0.62, cx + fw * 0.7, top + L * 0.5); g.bezierCurveTo(cx + fw * 1.25, top + L * 0.3, cx + fw * 1.1, top + L * 0.16, cx + fw * 0.6, top + L * 0.14); g.lineTo(cx - fw * 0.9, top + L * 0.14); g.bezierCurveTo(cx - fw * 1.3, top + L * 0.2, cx - fw * 1.1, top + L * 0.42, cx - fw * 0.55, top + L * 0.55); g.bezierCurveTo(cx - fw * 0.95, top + L * 0.72, cx - fw * 0.9, bot, cx, bot); g.closePath(); g.fill(); g.stroke();
          [[-0.95, 0.09, 0.2], [-0.45, 0.05, 0.16], [0.02, 0.05, 0.15], [0.45, 0.07, 0.13], [0.82, 0.1, 0.11]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(cx + dx * fw, top + L * dy, r * fw * 1.4, 0, TAU); g.fill(); g.stroke(); }); });
        const pm = new T.Mesh(new T.PlaneGeometry(len + 0.6, w).rotateX(-PI / 2).rotateY(-PI / 2), new T.MeshStandardMaterial({ map: tx, roughness: 0.9 })); pm.scale.setScalar(CM); const g = new T.Group(); g.add(pm); pm.rotation.y = PI / 2; pm.position.set((len / 2) * CM, 0.04, 0); scene.add(g); g.userData.tx = tx; return g; }
      async function shoes(p, kick) { const what = t('sd_k_shoes'); let first = true; view('feet'); tell(kick, t('sd_foot')); await act(t('sd_next')); if (!alive()) return null;
        const fp = footprint(m.foot); fp.position.copy(D.body.localToWorld(new T.Vector3(1.15, 0.2, 0))); view('work'); await glide(fp, new T.Vector3(X(0), 0, FZ), 1.1, 1.6); if (!alive()) return null;
        const r1 = await readNumber(kick, m.foot, t('sd_footRead')); if (!r1) return null; first = first && r1.ok; await glide(fp, fp.position.clone().add(new T.Vector3(0, 0, -2.6)), 0.5, 0.4); scene.remove(fp); fp.userData.tx.dispose();
        let strapLen = m.instep; if (p.how === 'strap') { view('feet'); tell(kick, t('sd_wrapFoot')); await act(t('sd_wrap')); if (!alive()) return null; await wrapAndLay(onDoll(1.15, D.ri, D.footZ, D.ri + 0.1, 'xy'), m.instep, -PI / 2); if (!alive()) return null; const r2 = await readNumber(kick, m.instep, t('sd_readEnd', { what: t('sd_strap') })); clearString(); if (!r2) return null; first = first && r2.ok; }
        else { tell(kick, t('sd_strapGiven', { n: num(m.instep) })); await wait(2.2); }
        let sole = null, strap = null, s = makeStrip(offset(), 12, p.fab, true);
        for (;;) { if (sole == null) { const pc = await cutTo(s, m.foot, kick, t('sd_sole')); if (!pc) return null; sole = pc.len; await glide(pc.g, pc.g.position.clone().add(new T.Vector3(0, 0.1, -1.5)), 0.4); dropStrip(pc); }
          if (strap == null) { if (s.len < strapLen + 0.6) { dropStrip(s); s = makeStrip(offset(), 12, p.fab, true); } else if (Math.abs(s.left) > 1e-6 && S.band < 2) setStrip(s, 0, s.len); const pc = await cutTo(s, strapLen, kick, t('sd_strap')); if (!pc) return null; strap = pc.len; await glide(pc.g, pc.g.position.clone().add(new T.Vector3(0.4, 0.1, -1.5)), 0.4); dropStrip(pc); }
          view('feet'); wear('shoes', { sole, strap }, p.fab); await wait(1.0); if (!alive()) return null; const okSole = same(sole, m.foot), okStrap = same(strap, strapLen);
          if (okSole && okStrap) { dropStrip(s); await happy(kick, what, m.foot); return first; }
          first = false; S.api.sfx('wrong'); D.setMood('sad'); tell(kick, !okSole ? t(sole > m.foot ? 'sd_soleLong' : 'sd_soleShort', { v: num(sole), n: num(m.foot) }) : t(strap > strapLen ? 'sd_strapLong' : 'sd_strapShort', { v: num(strap), n: num(strapLen) }));
          await act(t('sd_again')); if (!alive()) return null; D.setMood('happy'); D.undress('shoes'); if (!okSole) sole = null; if (!okStrap) strap = null; if (s.len < 5) { dropStrip(s); s = makeStrip(offset(), 12, p.fab, true); } else { const o = offset(); setStrip(s, o, s.len); } } }

      async function runway() { view('doll'); D.look = 0; tell(t('rg_studio'), t('sd_runway')); D.setMood('wow'); const r0 = spin.rotation.y; await anim(2.6, k => { spin.rotation.y = r0 + ease(k) * TAU; }); c.burst(D.body.localToWorld(new T.Vector3(0, 14, 3)), 0xffd6e6, 26); c.burst(D.body.localToWorld(new T.Vector3(0, 20, 3)), 0xfff2a8, 18); D.setMood('happy'); await wait(0.8); }

      async function play(api) { S.api = api; S.band = clamp(api.band || 2, 1, 6); S.step = S.band <= 3 ? 1 : S.band === 4 ? 0.5 : 0.1; S.seed = Math.floor(Math.random() * 6);
        window.__studio = { S, X, CMX, setChalk, setStrip, doll: () => D, meas: () => m, ui: () => ui, camera: c.camera, restyle: look => { const ry = D.root.rotation.y; spin.remove(D.root); D = buildDoll(m, look); D.root.rotation.y = ry; spin.add(D.root); } };   /* test hook, like __room */
        mountUI(); m = measures(S.band); D = buildDoll(m); spin.add(D.root); D.root.rotation.y = 0.3; c.updaters.push((dt, tm) => { if (D) { D.update(dt, tm); D.look += ((S.view === 'work' || S.view === 'zoom' ? 0.55 : 0) - (D.look || 0)) * Math.min(1, dt * 2); } });
        if (!seen().ruler) rulerShelf();   /* first visit: the ruler waits on its shelf until the lesson brings it down */
        const P = order(S.band), done = []; api.pips(P.length, done); view('overview');
        const I = window.KQ && KQ.intro; let skipped = false; if (I && I.seen('game:studio')) I.offer(() => { skipped = true; if (S.skipAct) S.skipAct(); });   /* a returning player may skip the welcome (KQ.intro) */
        tell(t('rg_studio'), t('sd_hi')); await act(t('sd_start')); if (!alive()) return;
        if (!seen().ruler) { if (I) I.clear(); await lessonRuler(true); if (!alive()) return; } else if (!skipped) { tell(t('rg_studio'), t('sd_remind')); await wait(2.2); }
        if (I) { I.clear(); I.mark('game:studio'); }
        for (let i = 0; i < P.length; i++) { const p = P[i], kick = t('sd_piece', { i: i + 1, n: P.length }) + ' · ' + t('sd_k_' + p.kind); if (!alive()) return;
          if ((p.kind === 'belt' || (p.kind === 'top' && p.how === 'rect') || (p.kind === 'shoes' && p.how === 'strap') || (p.kind === 'skirt' && p.how === 'around') || ((p.kind === 'necklace' || p.kind === 'bracelet') && p.how === 'wrap')) && !seen().curve) { await lessonCurve(); if (!alive()) return; }
          if ((p.kind === 'beret' || p.kind === 'skirt' || (p.kind === 'earrings' && p.how !== 'cut')) && !seen().radius) { await lessonCircle(); if (!alive()) return; }
          if (!p.fab.gem) { await pickFabric(p, kick); if (!alive()) return; }
          const ok = p.kind === 'shoes' ? await shoes(p, kick) : p.kind === 'belt' ? await belt(p, kick) : p.kind === 'beret' ? await beret(p, kick) : p.kind === 'skirt' ? await circleSkirt(p, kick) : p.kind === 'top' && p.how === 'rect' ? await topRect(p, kick) : (p.kind === 'necklace' || p.kind === 'bracelet') && p.how !== 'cut' ? await wrapJewel(p, kick) : p.kind === 'earrings' && p.how !== 'cut' ? await beret(p, kick) : await straight(p, kick, p.v);
          if (ok == null || !alive()) return; done.push(!!ok); api.pips(P.length, done); }
        hint(null); view('doll'); D.look = 0; tell(t('rg_studio'), t('sd_ring')); wear('ring', 0, { gem: [0xff4f9a, 0x3a7ad8, 0x7fdcb0, 0xc0a0ff, 0xe8343a, 0x8fd0f0][(S.seed + 3) % 6] }); S.api.sfx('correct'); await wait(2.2); if (!alive()) return;   /* a ring from the jewellery box finishes every look */
        await runway(); if (!alive()) return; const right = done.filter(Boolean).length;
        api.done({ stars: right === done.length ? 3 : right >= done.length * 0.6 ? 2 : 1, points: right * 10 + (done.length - right) * 5 + 50, correct: right, total: done.length, say: t('sd_doneSay') }); }
      function dispose() { S.dead = true; S.drag = null; if (window.KQ && KQ.intro) KQ.intro.clear(); document.removeEventListener('keydown', onKey); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); if (ui && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root); ui = null; try { plq.userData.plaque.dispose(); } catch (e) {} }
      return { dynamic: true, frame, build() {}, play, say: tell, present() {}, resolve() { return 1; }, dispose };
    }
  };

  /* ================================================================ words (Hebrew in the plural: gender-neutral) */
  const STR = {
    en: { rg_studio: 'The Doll Studio', rg_studio_b: 'Measure, cut and dress a doll with a real ruler', rg_studio_hi: 'Welcome to the Doll Studio!', rg_studio_how: 'Measure, cut and dress her.',
      sd_cm: 'cm', sd_lesson: 'Lesson', sd_lRuler: 'The ruler', sd_lCurve: 'Measuring round', sd_lCircle: 'Circles', sd_next: 'Next', sd_done: 'Done', sd_start: "Let's start", sd_cut: 'Cut ✂', sd_draw: 'Draw ◯', sd_trim: 'Trim it', sd_again: 'Try again', sd_wrap: 'Wrap the string',
      sd_hi: 'Welcome to the Doll Studio! We measure, cut and dress her with a real ruler.', sd_remind: 'Remember: start at 0, find the number, then cut.',
      sd_r0: 'This is a ruler. It lives on the shelf. Let’s bring it to the desk.', sd_r1: 'Each long line with a number is 1 centimetre: 1 cm.', sd_1cm: '1 cm', sd_ncm: '{n} cm',
      sd_r2: 'Always start at 0. This ribbon goes from 0 to 4, so it is 4 cm long.', sd_r3: 'From 1 to 5 it is still 4 cm! The end number shows the length only when you start at 0.',
      sd_r4: 'Every centimetre has 10 tiny steps: millimetres (mm). Half a centimetre is 5 mm, so this is 3.5 cm.', sd_5mm: '5 mm',
      sd_r5: 'The other edge shows inches. 1 inch is about 2.5 cm. In the studio we cut in centimetres.', sd_1in: '1 inch', sd_25cm: '≈ 2.5 cm',
      sd_try: 'Your turn: slide the chalk to {n} cm.', sd_yes: 'Yes! That is exactly {n} cm.', sd_notThere: 'That is {v} cm. Count the long lines from 0 to find {n}.',
      sd_c1: 'A waist is round, and a stiff ruler can’t bend round it.', sd_c2: 'So: wrap a string round it, pin where it meets itself, and lay it straight on the ruler from 0.', sd_c3: 'It ends at 7: the way round the spool is 7 cm.', sd_c4: 'A tailor’s tape is a ruler that bends, so it does the same job.',
      sd_o1: 'Every circle has a centre. A pin goes right in the middle.', sd_o2: 'The radius goes from the centre to the edge. A string from the pin to the chalk: {n} cm.', sd_o3: 'Swing the chalk all the way round. Every point on the circle is {n} cm from the centre.',
      sd_o4: 'Across, through the centre, is the diameter: 2 radii. {eq} cm.', sd_o5: 'The way round is about 3.14 × the diameter. That number is π (pi). Watch the string.',
      sd_piece: 'Piece {i} of {n}', sd_pick: 'Choose the fabric for the {what}: a colour and a pattern.', sd_pickShoes: 'Choose the plastic for the shoes: a colour and a pattern.', sd_colors: 'Colours', sd_patterns: 'Patterns', sd_pickDone: 'This one!', sd_k_skirt: 'Circle skirt', sd_k_top: 'Top', sd_k_necklace: 'Necklace', sd_k_earrings: 'Earrings', sd_k_bracelet: 'Bracelet', sd_k_ring: 'Ring', sd_wrapNeck: 'The necklace rests round her neck, just above her shoulders. Measure round it with the string.', sd_wrapWrist: 'The bracelet goes round her wrist. Measure round it with the string.', sd_piNeck: 'Jeweller’s shortcut: round a circle = 2 × π × radius. Her necklace sits on a circle with a radius of {r} cm. Use π = 3.14 and type the chain’s length.', sd_piYesNeck: 'Yes: about {n} cm. Now cut the chain.', sd_hoopR: 'Hoop earrings: a circle with a radius of {n} cm. Slide the chalk to {n} on the ruler, then draw.', sd_hoopD: 'Hoop earrings: {d} cm across (the diameter). What radius is that? Set the chalk to it, then draw.', sd_hoopBig: 'Too big: the radius is {v} cm, it should be {n} cm.', sd_hoopSmall: 'Too small: the radius is {v} cm, it should be {n} cm.', sd_ring: 'And to finish her look: a ring from the jewellery box!', sd_k_bow: 'Hair ribbon', sd_k_belt: 'Belt', sd_k_beret: 'Beret', sd_k_shoes: 'Shoes', sd_sole: 'Sole', sd_strap: 'Strap',
      sd_align: 'First line the fabric up with 0: drag it until its edge sits on 0.', sd_zero: 'Start here: 0', sd_alignNo: 'Its edge is at {v}, not at 0. Slide it a little more.',
      sd_mark: '{what}: {n} cm. Slide the chalk to {n} on the ruler, then cut.', sd_fits: '{what}: exactly {n} cm. A perfect fit!', sd_long: 'Too long: this is {v} cm, the order says {n} cm. {d} cm too much.', sd_short: 'Too short: this is {v} cm, the order says {n} cm. {d} cm missing.',
      sd_readEnd: 'The string is on the ruler. Where does it end? Type the number.', sd_readYes: 'Right: {n} cm.', sd_readNo: 'Not {v}. Look again at where it ends.', sd_readShow: 'It ends at {n} cm: see the bar. Next time count the long lines from 0.',
      sd_wrapWaist: 'The belt has to go all the way round her waist. Measure it with the string.', sd_pi: 'Tailor’s shortcut: round a circle = 2 × π × radius. Her waist’s radius is {r} cm. Use π = 3.14 and type the belt’s length.', sd_piHint: '2 × 3.14 × {r} = ?  (round to one decimal place)',
      sd_piYes: 'Yes: about {n} cm. Now cut the belt.', sd_piNo: 'Not {v}. Multiply: 2 × 3.14 × the radius.', sd_piShow: '2 × 3.14 × {r} ≈ {n} cm. That is the belt.',
      sd_beretR: 'Beret: a circle with a radius of {n} cm. Slide the chalk to {n} on the ruler, then draw.', sd_beretD: 'Beret: {d} cm across (the diameter). What radius is that? Set the chalk to it, then draw.', sd_radHint: 'The pin is at 0. The radius is how far the chalk is from the pin.', sd_diamHint: 'The radius is half the diameter: {d} ÷ 2 = {n}.',
      sd_cutRound: 'Now cut along the chalk circle.', sd_big: 'Too big: the radius is {v} cm, it should be {n} cm.', sd_small: 'Too small: the radius is {v} cm, it should be {n} cm.',
      sd_foot: 'Shoes! Plastic is great for shoes. First we need the length of her foot.', sd_footRead: 'Her footprint is on the ruler, heel at 0. How long is her foot? Type the number at the toe.', sd_wrapFoot: 'The strap goes round her foot. Measure round it with the string.', sd_strapGiven: 'The strap is {n} cm long.',
      sd_soleLong: 'The sole is too long: {v} cm, and her foot is {n} cm.', sd_soleShort: 'The sole is too short: {v} cm, and her foot is {n} cm. Her toes stick out!', sd_strapLong: 'The strap is too long: {v} cm, it should be {n} cm.', sd_strapShort: 'The strap is too short: {v} cm, it should be {n} cm. It won’t close.',
      sd_runway: 'The outfit is ready! A spin on the runway.', sd_doneT: 'The outfit is ready!', sd_found: 'A beautiful outfit! You found: {item}.', sd_o6: 'Her waist is round too! Straight across it is the diameter, and half of that is the radius.',
      sd_skIntro: 'A circle skirt is a round piece of fabric with a round hole for her waist. The hole must be exactly as big as her waist.',
      sd_acr: 'Two blocks touch the sides of her waist. The ruler under them shows how wide she is.',
      sd_acrRead: 'How many centimetres across is her waist, from block to block? That is the diameter. Type it.',
      sd_acrShow: 'From block to block is {n} cm: see the bar. That is the diameter.',
      sd_half: 'The radius goes from her middle to her side: half of the diameter. What is half of {d} cm?',
      sd_halfHint: 'Half means two equal parts. Which number plus itself makes {d}?',
      sd_halfYes: 'Yes! Her waist’s radius is {r} cm.',
      sd_halfNo: '{v} is not half of {d}. Try again.',
      sd_halfShow: '{eq}, so half of {d} is {r}. Her waist’s radius is {r} cm.',
      sd_arWrap: 'First measure all the way round her waist with the string.',
      sd_arR: 'Round her waist: {c} cm. The way round a circle = {f} × the radius (about 6.28 radii). So the radius is {eq}. Type it (one decimal).',
      sd_arHint: 'Divide {c} by 6.28. Check: 6.28 × your answer should come close to {c}.',
      sd_arYes: 'Right! The radius is {r} cm ({eq}).',
      sd_arNo: '{eq}, not {c}. Try again.',
      sd_arShow: '{eq}. Her waist’s radius is {r} cm.',
      sd_skHole: 'Set the compass for her waist: slide the chalk to {r} cm, the radius you found, then draw.',
      sd_skOuterAuto: 'The skirt is {l} cm long, so its outer edge is {eq} cm from the centre. The chalk goes there.',
      sd_skOuter: 'The skirt is {l} cm long. Set the compass for the outer edge: her waist’s radius plus the length.',
      sd_skOuterNo: 'The outer edge is {eq} cm from the centre, not {v}. Try again.',
      sd_skCut: 'Cut round the outside, then cut out the hole in the middle.',
      sd_skYes: 'The hole’s radius is {r} cm, just like her waist. It fits!',
      sd_skSmall: 'The hole’s radius is {v} cm, but her waist’s radius is {r} cm. Too small: it can’t close round her!',
      sd_skBig: 'The hole’s radius is {v} cm, but her waist’s radius is {r} cm. Too big: it falls down!',
      sd_wrapBody: 'The top goes all the way round her body, under her arms. Measure round her with the string.',
      sd_topShort: '{v} cm does not reach all the way round her ({n} cm). Too short!',
      sd_topLong: '{v} cm is more than the way round her ({n} cm). It flaps open!',
      sd_dim_h: 'height', sd_dim_l: 'length', sd_dim_w: 'width', sd_dim_round: 'way round',
      sd_rect: 'This piece is a rectangle: two sides to measure. First cut the {a} ({x} cm), then turn the fabric and cut the {b} ({y} cm).',
      sd_turn: 'The {a} is right: {n} cm! Now turn the fabric a quarter turn, so the other side lies along the ruler, and cut the {b}.',
      sd_area: 'A rectangle {a} cm by {b} cm: its area is {a} × {b} = {n} square cm (cm²) of fabric.',
      sd_doneSay: 'A beautiful outfit, measured exactly!' },
    he: { rg_studio: 'סטודיו הבובה', rg_studio_b: 'מודדים, גוזרים ומלבישים בובה עם סרגל אמיתי', rg_studio_hi: 'ברוכים הבאים לסטודיו הבובה!', rg_studio_how: 'מודדים, גוזרים ומלבישים אותה.',
      sd_cm: 'ס״מ', sd_lesson: 'שיעור', sd_lRuler: 'הסרגל', sd_lCurve: 'מדידה מסביב', sd_lCircle: 'עיגולים', sd_next: 'הלאה', sd_done: 'סיימתי', sd_start: 'מתחילים', sd_cut: 'גוזרים ✂', sd_draw: 'משרטטים ◯', sd_trim: 'מקצרים', sd_again: 'שוב', sd_wrap: 'עוטפים בחוט',
      sd_hi: 'ברוכים הבאים לסטודיו הבובה! מודדים, גוזרים ומלבישים אותה עם סרגל אמיתי.', sd_remind: 'זוכרים: מתחילים מ־0, מוצאים את המספר, ואז גוזרים.',
      sd_r0: 'זה סרגל. הוא גר על המדף. מורידים אותו לשולחן.', sd_r1: 'כל קו ארוך עם מספר הוא סנטימטר אחד: 1 ס״מ.', sd_1cm: '1 ס״מ', sd_ncm: '{n} ס״מ',
      sd_r2: 'תמיד מתחילים מ־0. הסרט הזה הולך מ־0 עד 4, אז האורך שלו 4 ס״מ.', sd_r3: 'מ־1 עד 5 זה עדיין 4 ס״מ! המספר בסוף מראה את האורך רק כשמתחילים מ־0.',
      sd_r4: 'בכל סנטימטר יש 10 צעדים קטנים: מילימטרים (מ״מ). חצי סנטימטר הוא 5 מ״מ, אז כאן זה 3.5 ס״מ.', sd_5mm: '5 מ״מ',
      sd_r5: 'בצד השני יש אינצ׳ים. אינץ׳ אחד הוא בערך 2.5 ס״מ. בסטודיו גוזרים בסנטימטרים.', sd_1in: 'אינץ׳ אחד', sd_25cm: '≈ 2.5 ס״מ',
      sd_try: 'עכשיו תורכם: מזיזים את הגיר ל־{n} ס״מ.', sd_yes: 'כן! זה בדיוק {n} ס״מ.', sd_notThere: 'זה {v} ס״מ. סופרים את הקווים הארוכים מ־0 כדי למצוא את {n}.',
      sd_c1: 'המותניים עגולים, וסרגל קשיח לא מתכופף סביבם.', sd_c2: 'לכן: עוטפים בחוט, נועצים סיכה איפה שהוא פוגש את עצמו, ומניחים אותו ישר על הסרגל מ־0.', sd_c3: 'הוא נגמר ב־7: ההיקף של הסליל הוא 7 ס״מ.', sd_c4: 'סרט מדידה של חייטים הוא סרגל שמתכופף, אז הוא עושה את אותה עבודה.',
      sd_o1: 'לכל עיגול יש מרכז. נועצים סיכה בדיוק באמצע.', sd_o2: 'הרדיוס הולך מהמרכז עד הקצה. חוט מהסיכה אל הגיר: {n} ס״מ.', sd_o3: 'מסובבים את הגיר סיבוב שלם. כל נקודה על העיגול רחוקה {n} ס״מ מהמרכז.',
      sd_o4: 'מקצה לקצה דרך המרכז זה הקוטר: שני רדיוסים. {eq} ס״מ.', sd_o5: 'ההיקף הוא בערך פי 3.14 מהקוטר. למספר הזה קוראים π (פאי). מסתכלים על החוט.',
      sd_piece: 'חלק {i} מתוך {n}', sd_pick: 'בוחרים בד ל{what}: צבע ודוגמה.', sd_pickShoes: 'בוחרים פלסטיק לנעליים: צבע ודוגמה.', sd_colors: 'צבעים', sd_patterns: 'דוגמאות', sd_pickDone: 'את זה!', sd_k_skirt: 'חצאית עיגול', sd_k_top: 'חולצה', sd_k_necklace: 'שרשרת', sd_k_earrings: 'עגילים', sd_k_bracelet: 'צמיד', sd_k_ring: 'טבעת', sd_wrapNeck: 'השרשרת נחה סביב הצוואר, ממש מעל הכתפיים. מודדים סביבו עם החוט.', sd_wrapWrist: 'הצמיד מקיף את פרק היד שלה. מודדים סביבו עם החוט.', sd_piNeck: 'קיצור של צורפים: היקף עיגול = 2 × π × רדיוס. השרשרת יושבת על עיגול ברדיוס {r} ס״מ. משתמשים ב־π = 3.14 ומקלידים את אורך השרשרת.', sd_piYesNeck: 'כן: בערך {n} ס״מ. עכשיו גוזרים את השרשרת.', sd_hoopR: 'עגילי חישוק: עיגול עם רדיוס של {n} ס״מ. מזיזים את הגיר ל־{n} על הסרגל, ואז משרטטים.', sd_hoopD: 'עגילי חישוק: {d} ס״מ מקצה לקצה (הקוטר). מה הרדיוס? מזיזים אליו את הגיר, ואז משרטטים.', sd_hoopBig: 'גדולים מדי: הרדיוס {v} ס״מ, וצריך {n} ס״מ.', sd_hoopSmall: 'קטנים מדי: הרדיוס {v} ס״מ, וצריך {n} ס״מ.', sd_ring: 'ולסיום: טבעת מקופסת התכשיטים!', sd_k_bow: 'סרט לשיער', sd_k_belt: 'חגורה', sd_k_beret: 'כומתה', sd_k_shoes: 'נעליים', sd_sole: 'סוליה', sd_strap: 'רצועה',
      sd_align: 'קודם מיישרים את הבד ל־0: גוררים אותו עד שהקצה שלו על ה־0.', sd_zero: 'מתחילים כאן: 0', sd_alignNo: 'הקצה שלו נמצא ב־{v}, לא ב־0. מזיזים עוד קצת.',
      sd_mark: '{what}: {n} ס״מ. מזיזים את הגיר ל־{n} על הסרגל, ואז גוזרים.', sd_fits: '{what}: בדיוק {n} ס״מ. מתאים בול!', sd_long: 'ארוך מדי: יצא {v} ס״מ, וההזמנה היא {n} ס״מ. {d} ס״מ יותר מדי.', sd_short: 'קצר מדי: יצא {v} ס״מ, וההזמנה היא {n} ס״מ. חסרים {d} ס״מ.',
      sd_readEnd: 'החוט מונח על הסרגל. איפה הוא נגמר? מקלידים את המספר.', sd_readYes: 'נכון: {n} ס״מ.', sd_readNo: 'לא {v}. מסתכלים שוב איפה הוא נגמר.', sd_readShow: 'הוא נגמר ב־{n} ס״מ: רואים את הפס. בפעם הבאה סופרים את הקווים הארוכים מ־0.',
      sd_wrapWaist: 'החגורה צריכה להקיף את כל המותניים. מודדים אותם עם החוט.', sd_pi: 'קיצור של חייטים: היקף עיגול = 2 × π × רדיוס. רדיוס המותניים שלה {r} ס״מ. משתמשים ב־π = 3.14 ומקלידים את אורך החגורה.', sd_piHint: '2 × 3.14 × {r} = ?  (מעגלים לספרה אחת אחרי הנקודה)',
      sd_piYes: 'כן: בערך {n} ס״מ. עכשיו גוזרים את החגורה.', sd_piNo: 'לא {v}. כופלים: 2 × 3.14 × הרדיוס.', sd_piShow: '2 × 3.14 × {r} ≈ {n} ס״מ. זאת החגורה.',
      sd_beretR: 'כומתה: עיגול עם רדיוס של {n} ס״מ. מזיזים את הגיר ל־{n} על הסרגל, ואז משרטטים.', sd_beretD: 'כומתה: {d} ס״מ מקצה לקצה (הקוטר). מה הרדיוס? מזיזים אליו את הגיר, ואז משרטטים.', sd_radHint: 'הסיכה נמצאת ב־0. הרדיוס הוא כמה רחוק הגיר מהסיכה.', sd_diamHint: 'הרדיוס הוא חצי מהקוטר: {d} ÷ 2 = {n}.',
      sd_cutRound: 'עכשיו גוזרים לאורך עיגול הגיר.', sd_big: 'גדולה מדי: הרדיוס {v} ס״מ, וצריך {n} ס״מ.', sd_small: 'קטנה מדי: הרדיוס {v} ס״מ, וצריך {n} ס״מ.',
      sd_foot: 'נעליים! פלסטיק מצוין לנעליים. קודם צריך את האורך של כף הרגל שלה.', sd_footRead: 'טביעת הרגל על הסרגל, העקב על 0. מה אורך כף הרגל? מקלידים את המספר שליד הבוהן.', sd_wrapFoot: 'הרצועה עוטפת את כף הרגל. מודדים מסביב עם החוט.', sd_strapGiven: 'הרצועה באורך {n} ס״מ.',
      sd_soleLong: 'הסוליה ארוכה מדי: {v} ס״מ, וכף הרגל {n} ס״מ.', sd_soleShort: 'הסוליה קצרה מדי: {v} ס״מ, וכף הרגל {n} ס״מ. האצבעות בחוץ!', sd_strapLong: 'הרצועה ארוכה מדי: {v} ס״מ, וצריך {n} ס״מ.', sd_strapShort: 'הרצועה קצרה מדי: {v} ס״מ, וצריך {n} ס״מ. היא לא נסגרת.',
      sd_runway: 'התלבושת מוכנה! סיבוב על המסלול.', sd_doneT: 'התלבושת מוכנה!', sd_found: 'תלבושת יפהפייה! מצאתם: {item}.', sd_o6: 'גם המותניים שלה עגולים! מקצה לקצה דרכם זה הקוטר, וחצי ממנו זה הרדיוס.',
      sd_skIntro: 'חצאית עיגול היא חתיכת בד עגולה עם חור עגול למותניים. החור צריך להיות בדיוק בגודל המותניים שלה.',
      sd_acr: 'שתי קוביות נוגעות בצדדים של המותניים שלה. הסרגל שמתחתן מראה כמה היא רחבה.',
      sd_acrRead: 'כמה סנטימטרים רוחב המותניים שלה, מקובייה לקובייה? זה הקוטר. מקלידים אותו.',
      sd_acrShow: 'מקובייה לקובייה יש {n} ס״מ: רואים את הפס. זה הקוטר.',
      sd_half: 'הרדיוס הולך מהאמצע שלה עד הצד: חצי מהקוטר. כמה זה חצי מ־{d} ס״מ?',
      sd_halfHint: 'חצי זה שני חלקים שווים. איזה מספר ועוד אותו מספר נותן {d}?',
      sd_halfYes: 'נכון! הרדיוס של המותניים שלה הוא {r} ס״מ.',
      sd_halfNo: '{v} זה לא חצי מ־{d}. מנסים שוב.',
      sd_halfShow: '{eq}, אז חצי מ־{d} זה {r}. הרדיוס של המותניים שלה הוא {r} ס״מ.',
      sd_arWrap: 'קודם מודדים עם החוט את כל ההיקף של המותניים.',
      sd_arR: 'ההיקף של המותניים: {c} ס״מ. היקף של עיגול = {f} × הרדיוס (בערך 6.28 רדיוסים). אז הרדיוס הוא {eq}. מקלידים אותו (ספרה אחת אחרי הנקודה).',
      sd_arHint: 'מחלקים את {c} ב־6.28. בודקים: 6.28 כפול התשובה צריך לצאת קרוב ל־{c}.',
      sd_arYes: 'נכון! הרדיוס הוא {r} ס״מ ({eq}).',
      sd_arNo: '{eq}, ולא {c}. מנסים שוב.',
      sd_arShow: '{eq}. הרדיוס של המותניים שלה הוא {r} ס״מ.',
      sd_skHole: 'מכוונים את המחוגה למותניים: מזיזים את הגיר ל־{r} ס״מ, הרדיוס שמצאנו, ומשרטטים.',
      sd_skOuterAuto: 'החצאית ארוכה {l} ס״מ, אז הקצה החיצוני רחוק {eq} ס״מ מהמרכז. הגיר עובר לשם.',
      sd_skOuter: 'החצאית ארוכה {l} ס״מ. מכוונים את המחוגה לקצה החיצוני: הרדיוס של המותניים ועוד האורך.',
      sd_skOuterNo: 'הקצה החיצוני רחוק {eq} ס״מ מהמרכז, ולא {v}. מנסים שוב.',
      sd_skCut: 'גוזרים מסביב מבחוץ, ואז גוזרים את החור באמצע.',
      sd_skYes: 'הרדיוס של החור {r} ס״מ, בדיוק כמו המותניים שלה. מתאים!',
      sd_skSmall: 'הרדיוס של החור {v} ס״מ, אבל הרדיוס של המותניים {r} ס״מ. קטן מדי: החצאית לא נסגרת סביבה!',
      sd_skBig: 'הרדיוס של החור {v} ס״מ, אבל הרדיוס של המותניים {r} ס״מ. גדול מדי: החצאית נופלת!',
      sd_wrapBody: 'החולצה מקיפה את כל הגוף שלה, מתחת לידיים. מודדים מסביב עם החוט.',
      sd_topShort: '{v} ס״מ לא מגיעים מסביב לכל הגוף שלה ({n} ס״מ). קצר מדי!',
      sd_topLong: '{v} ס״מ זה יותר מכל ההיקף שלה ({n} ס״מ). החולצה נפתחת!',
      sd_dim_h: 'גובה', sd_dim_l: 'אורך', sd_dim_w: 'רוחב', sd_dim_round: 'היקף',
      sd_rect: 'החלק הזה הוא מלבן: יש לו שתי צלעות למדוד. קודם גוזרים את ה{a} ({x} ס״מ), אחר כך מסובבים את הבד וגוזרים את ה{b} ({y} ס״מ).',
      sd_turn: 'ה{a} נכון: {n} ס״מ! עכשיו מסובבים את הבד רבע סיבוב, כך שהצלע השנייה מונחת לאורך הסרגל, וגוזרים את ה{b}.',
      sd_area: 'מלבן של {a} ס״מ על {b} ס״מ: השטח שלו {a} × {b} = {n} סנטימטרים רבועים (סמ״ר) של בד.',
      sd_doneSay: 'תלבושת יפהפייה, מדודה בדיוק!' }
  };

  /* one of the Games Arcade's games (shared/arcade.js): the hub loads this file when it is picked, hands the stage the room and banks the outfit */
  KQRealms.define('studio', { strings: STR, themes: THEMES, stages: STAGES });
  window.KQStudio = { buildDoll, CM };
})();
