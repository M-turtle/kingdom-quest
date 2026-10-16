/* Kingdom Quest — animated character avatars.
   Keys are the same emoji the profiles already store, so nothing migrates: a surface that has not been upgraded simply
   shows the emoji. Each character is a hand-built SVG bust (soft radial shading, ink outline, castle-themed costume)
   with a small idle animation — a breath, a blink every few seconds, an ear or wing twitch. Never more than a glance. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;
  const E = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const INK = 'rgba(38,22,14,.34)', NO = { stroke: 'none' };
  // Frame strip: one row per character, four 256px frames — 0 idle, 1 blink, 2 look aside, 3 wave/laugh (shared/avatars.webp).
  const BASE = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || '';
  // two strips: the RPG hero classes (keys 'h:<class>') and the fantasy creatures (keys are the stored emoji)
  const SHEETS = [{ file: 'heroes.webp', order: ['h:knight', 'h:wizard', 'h:princess', 'h:ranger', 'h:bard', 'h:paladin', 'h:necromancer', 'h:druid', 'h:berserker', 'h:rogue', 'h:cleric', 'h:warlock', 'h:monk', 'h:summoner', 'h:alchemist', 'h:icemage', 'h:firemage', 'h:timemage', 'h:shadowdancer', 'h:dragonrider'] }, { file: 'avatars.webp', order: ['🦁', '🐉', '🦊', '🐺', '🦄', '🐯', '🐻', '🦅', '🐸', '🐧', '🦖', '🐼', '🦋', '🐙', '🦈', '🐲', '🤖'] },
    // the Avatar Forge library: every creature × fruit mix, pre-painted in the hero style (keys 'f:<creature>-<fruit>')
    { file: 'eggs.webp', order: ['e:rose', 'e:sunflower', 'e:tulip'] },   // hatched from the three secret eggs
    { file: 'forge2.webp', order: ['f:cat-apple', 'f:cat-banana', 'f:cat-strawberry', 'f:cat-pineapple', 'f:cat-grapes', 'f:cat-watermelon', 'f:dog-apple', 'f:dog-banana', 'f:dog-strawberry', 'f:dog-pineapple', 'f:dog-grapes', 'f:dog-watermelon', 'f:fox-apple', 'f:fox-banana', 'f:fox-strawberry', 'f:fox-pineapple', 'f:fox-grapes', 'f:fox-watermelon', 'f:owl-apple', 'f:owl-banana', 'f:owl-strawberry', 'f:owl-pineapple', 'f:owl-grapes', 'f:owl-watermelon', 'f:dragon-apple', 'f:dragon-banana', 'f:dragon-strawberry', 'f:dragon-pineapple', 'f:dragon-grapes', 'f:dragon-watermelon', 'f:bunny-apple', 'f:bunny-banana', 'f:bunny-strawberry', 'f:bunny-pineapple', 'f:bunny-grapes', 'f:bunny-watermelon', 'f:panda-apple', 'f:panda-banana', 'f:panda-strawberry', 'f:panda-pineapple', 'f:panda-grapes', 'f:panda-watermelon', 'f:tiger-apple', 'f:tiger-banana', 'f:tiger-strawberry', 'f:tiger-pineapple', 'f:tiger-grapes', 'f:tiger-watermelon'] }];
  const SHEET = { frames: 4, base: BASE, order: SHEETS.flatMap(s => s.order), file: 'avatars.webp' };
  const sheetOf = key => { for (const s of SHEETS) { const i = s.order.indexOf(key); if (i >= 0) return { file: s.file, row: i, rows: s.order.length }; } return null; };
  const CSS = `
.kqav{display:block;width:100%;height:100%;overflow:visible}
.kqav-photo{position:relative;display:block;width:100%;height:100%;border-radius:50%;background:#1a1030;box-shadow:0 0 0 2px rgba(255,255,255,.28),0 0 0 4px #c9962a,0 0 18px 4px rgba(150,80,255,.55),0 6px 14px rgba(0,0,0,.35);transform-origin:50% 100%;animation:kqavIdle 9s ease-in-out infinite;animation-delay:var(--d,0s)}
.kqav-photo .mask{position:absolute;inset:0;border-radius:50%;overflow:hidden}
.kqav-photo .face{position:absolute;inset:0;background-repeat:no-repeat;background-size:400% auto;opacity:1;transition:opacity .34s ease}
.kqav-photo .face.off{opacity:0}
.kqav-photo .kqav-ring{position:absolute;inset:-7%;border-radius:50%;border:2px dashed rgba(255,210,120,.55);animation:kqavRing 40s linear infinite;pointer-events:none}
.kqav-photo .glow{position:absolute;inset:-14%;border-radius:50%;background:radial-gradient(circle,rgba(180,110,255,.0) 55%,rgba(180,110,255,.35) 72%,rgba(180,110,255,0) 78%);animation:kqavGlow 5.5s ease-in-out infinite;animation-delay:var(--d,0s);pointer-events:none}
.kqav-photo .spark{position:absolute;width:12%;height:12%;border-radius:50%;background:radial-gradient(circle,#fff 0,rgba(255,255,255,.7) 35%,transparent 70%);animation:kqavSpark 2.8s ease-in-out infinite;pointer-events:none}
@keyframes kqavIdle{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-2.5%) rotate(-1.5deg)}65%{transform:translateY(-1%) rotate(1.5deg)}}
@keyframes kqavRing{to{transform:rotate(360deg)}}
@keyframes kqavGlow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}30%{transform:translateY(-3%) rotate(-2deg)}60%{transform:translateY(-1%) rotate(2deg)}}40%{transform:translateY(-18%) rotate(-6deg) scale(1.05)}70%{transform:translateY(0) scale(1.08,.92)}100%{transform:translateY(0) scale(1)}}
.kqav-photo .spark{position:absolute;width:12%;height:12%;border-radius:50%;background:radial-gradient(circle,#fff 0,rgba(255,255,255,.7) 35%,transparent 70%);animation:kqavSpark 2.8s ease-in-out infinite;pointer-events:none}
.kqav .bob{animation:kqavBob 3.8s ease-in-out infinite;animation-delay:var(--d,0s)}
.kqav .blink{transform-box:fill-box;transform-origin:center;animation:kqavBlink 5.2s infinite;animation-delay:var(--d,0s)}
.kqav .earL,.kqav .earR{transform-box:fill-box;transform-origin:bottom center;animation:kqavEarL 6s ease-in-out infinite;animation-delay:var(--d,0s)}
.kqav .earR{animation-name:kqavEarR}
.kqav .wingL,.kqav .wingR{transform-box:fill-box;transform-origin:right center;animation:kqavWingL 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.kqav .wingR{transform-origin:left center;animation-name:kqavWingR}
.kqav .sway{transform-box:fill-box;transform-origin:top center;animation:kqavSway 3.4s ease-in-out infinite;animation-delay:var(--d,0s)}
.kqav .tent{transform-box:fill-box;transform-origin:top center;animation:kqavSway 2.4s ease-in-out infinite;animation-delay:var(--d,0s)}
.kqav .flame{transform-box:fill-box;transform-origin:bottom center;animation:kqavFlame .8s ease-in-out infinite}
.kqav .spark{animation:kqavSpark 2.8s ease-in-out infinite;animation-delay:var(--d,0s)}
.kqav .glow{animation:kqavSpark 1.8s ease-in-out infinite}
@keyframes kqavBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.3px)}}
@keyframes kqavBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.06)}}
@keyframes kqavEarL{0%,82%,100%{transform:rotate(0)}87%{transform:rotate(-9deg)}93%{transform:rotate(3deg)}}
@keyframes kqavEarR{0%,70%,100%{transform:rotate(0)}75%{transform:rotate(9deg)}81%{transform:rotate(-3deg)}}
@keyframes kqavWingL{0%,100%{transform:rotate(0)}50%{transform:rotate(-8deg)}}
@keyframes kqavWingR{0%,100%{transform:rotate(0)}50%{transform:rotate(8deg)}}
@keyframes kqavSway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes kqavFlame{0%,100%{transform:scale(1,1)}50%{transform:scale(.86,1.14)}}
@keyframes kqavSpark{0%,100%{opacity:.2}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.kqav *{animation:none!important}}`;
  function ensureCss() { if (document.getElementById('kqav-css')) return; const s = document.createElement('style'); s.id = 'kqav-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- primitives ----------
  const ell = (p, cx, cy, rx, ry, fill, x) => E('ellipse', Object.assign({ cx, cy, rx, ry, fill, stroke: INK, 'stroke-width': 1.1 }, x || {}), p);
  const circ = (p, cx, cy, r, fill, x) => E('circle', Object.assign({ cx, cy, r, fill, stroke: INK, 'stroke-width': 1.1 }, x || {}), p);
  const path = (p, d, fill, x) => E('path', Object.assign({ d, fill, stroke: INK, 'stroke-width': 1.1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, x || {}), p);
  const line = (p, d, col, w) => E('path', { d, fill: 'none', stroke: col, 'stroke-width': w || 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
  const mirror = (p, cls) => { const g = E('g', { transform: 'translate(100 0) scale(-1 1)' }, p); return cls ? E('g', { class: cls }, g) : g; };
  function grads(defs, id) {
    let n = 0;
    return {
      rad(c1, c2, fx, fy) { const k = id + 'g' + (++n); const g = E('radialGradient', { id: k, cx: fx == null ? .38 : fx, cy: fy == null ? .32 : fy, r: .85 }, defs); E('stop', { offset: 0, 'stop-color': c1 }, g); E('stop', { offset: 1, 'stop-color': c2 }, g); return `url(#${k})`; },
      lin(c1, c2, vertical) { const k = id + 'g' + (++n); const g = E('linearGradient', { id: k, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: vertical ? 1 : 0 }, defs); E('stop', { offset: 0, 'stop-color': c1 }, g); E('stop', { offset: 1, 'stop-color': c2 }, g); return `url(#${k})`; }
    };
  }
  // ---------- shared anatomy ----------
  function body(p, G, c1, c2, collar) { path(p, 'M10,106 C12,82 30,71 50,71 C70,71 88,82 90,106 Z', G.lin(c1, c2, true)); if (collar) path(p, 'M27,78 C38,70 62,70 73,78 L69,88 C58,81 42,81 31,88 Z', collar); }
  function head(p, G, cx, cy, rx, ry, c1, c2) { ell(p, cx, cy, rx, ry, G.rad(c1, c2)); E('ellipse', { cx: cx - rx * .32, cy: cy - ry * .48, rx: rx * .42, ry: ry * .2, fill: '#fff', opacity: .17, transform: `rotate(-18 ${cx - rx * .32} ${cy - ry * .48})` }, p); }
  function eye(p, cx, cy, r, iris, slit) {
    const g = E('g', { class: 'blink' }, p);
    ell(g, cx, cy, r, r * 1.12, '#fff', { 'stroke-width': .9 });
    E('circle', { cx: cx + r * .05, cy: cy + r * .12, r: r * .62, fill: iris }, g);
    if (slit) E('ellipse', { cx: cx + r * .05, cy: cy + r * .12, rx: r * .17, ry: r * .5, fill: '#1a1210' }, g); else E('circle', { cx: cx + r * .05, cy: cy + r * .12, r: r * .35, fill: '#1a1210' }, g);
    E('circle', { cx: cx - r * .22, cy: cy - r * .26, r: r * .2, fill: '#fff' }, g);
    E('circle', { cx: cx + r * .28, cy: cy + r * .36, r: r * .09, fill: '#fff', opacity: .85 }, g);
  }
  const eyes = (p, dx, cy, r, iris, slit) => { eye(p, 50 - dx, cy, r, iris, slit); eye(p, 50 + dx, cy, r, iris, slit); };
  const lashes = (p, dx, cy, r) => { for (const s of [-1, 1]) { const x = 50 + s * dx; line(p, `M${x + s * r * .9},${cy - r * .5} l${s * 2.2},-1.6 M${x + s * r * .55},${cy - r * .9} l${s * 1.4},-2.2`, '#2a1a12', 1.2); } };
  const brows = (p, dx, cy, w, col, angry) => { for (const s of [-1, 1]) line(p, `M${50 + s * (dx - w)},${cy + (angry ? 0 : 1.2)} L${50 + s * (dx + w)},${cy + (angry ? 2.4 : 0)}`, col || '#2a1a12', 2); };
  function muzzle(p, G, cx, cy, rx, ry, c1, c2) { ell(p, cx, cy, rx, ry, G.rad(c1, c2 || c1, .4, .3)); }
  function nose(p, cx, cy, w, col) { path(p, `M${cx - w},${cy} Q${cx},${cy - w * .7} ${cx + w},${cy} Q${cx},${cy + w * 1.35} ${cx - w},${cy} Z`, col, { 'stroke-width': .8 }); E('ellipse', { cx: cx - w * .3, cy: cy - w * .1, rx: w * .3, ry: w * .18, fill: '#fff', opacity: .35 }, p); }
  function smile(p, cx, cy, w, open, col) { if (open) { path(p, `M${cx - w},${cy} Q${cx},${cy + w * 1.5} ${cx + w},${cy} Z`, col || '#7a2a2a', { 'stroke-width': 1 }); E('path', { d: `M${cx - w * .55},${cy + w * .55} Q${cx},${cy + w * 1.2} ${cx + w * .55},${cy + w * .55} Z`, fill: '#ff7f96' }, p); } else line(p, `M${cx - w},${cy} Q${cx},${cy + w * .95} ${cx + w},${cy}`, '#3d241a', 1.7); }
  function catMouth(p, cx, cy, w) { line(p, `M${cx - w},${cy - w * .5} Q${cx - w / 2},${cy + w * .7} ${cx},${cy} Q${cx + w / 2},${cy + w * .7} ${cx + w},${cy - w * .5}`, '#3d241a', 1.5); }
  function cheeks(p, dx, cy, r, col) { for (const s of [-1, 1]) E('ellipse', { cx: 50 + s * dx, cy, rx: r * 1.3, ry: r, fill: col || '#ff8fa3', opacity: .4 }, p); }
  function earRound(p, G, cx, cy, r, c1, c2, inner, cls) { const g = E('g', { class: cls }, p); circ(g, cx, cy, r, G.rad(c1, c2)); circ(g, cx, cy + r * .12, r * .55, inner, NO); }
  function earPointy(p, G, cx, cy, w, h, c1, c2, inner, cls, tilt) {
    const g = E('g', { transform: `rotate(${tilt || 0} ${cx} ${cy})` }, p), a = E('g', { class: cls }, g);
    path(a, `M${cx - w},${cy} Q${cx - w * .3},${cy - h * .9} ${cx + w * .05},${cy - h} Q${cx + w * .55},${cy - h * .55} ${cx + w},${cy} Z`, G.rad(c1, c2));
    path(a, `M${cx - w * .5},${cy - 1} Q${cx - w * .1},${cy - h * .65} ${cx + w * .05},${cy - h * .7} Q${cx + w * .35},${cy - h * .4} ${cx + w * .5},${cy - 1} Z`, inner, NO);
  }
  function crown(p, G, cx, y, w, h, c1, c2) {
    path(p, `M${cx - w},${y} L${cx - w},${y - h * .62} L${cx - w * .5},${y - h * .28} L${cx},${y - h} L${cx + w * .5},${y - h * .28} L${cx + w},${y - h * .62} L${cx + w},${y} Z`, G.lin(c1, c2, true));
    [[cx - w, y - h * .62], [cx, y - h], [cx + w, y - h * .62]].forEach(([x, yy]) => circ(p, x, yy, w * .13, '#ff4d6d', { 'stroke-width': .6 }));
    circ(p, cx, y - h * .12, w * .17, '#3ec9ff', { 'stroke-width': .6 }); E('path', { d: `M${cx - w},${y} L${cx + w},${y}`, stroke: c2, 'stroke-width': 1.8 }, p);
  }
  function sparkle(p, cx, cy, s, delay) { const g = E('g', { class: 'spark' }, p); if (delay) g.style.animationDelay = delay; E('path', { d: `M${cx},${cy - s} L${cx + s * .28},${cy - s * .28} L${cx + s},${cy} L${cx + s * .28},${cy + s * .28} L${cx},${cy + s} L${cx - s * .28},${cy + s * .28} L${cx - s},${cy} L${cx - s * .28},${cy - s * .28} Z`, fill: '#fff8c4', stroke: '#f5c542', 'stroke-width': .5 }, g); }
  function flame(p, cx, cy, s) { const g = E('g', { class: 'flame' }, p); E('path', { d: `M${cx},${cy} Q${cx - s * .7},${cy - s * .8} ${cx},${cy - s * 1.7} Q${cx + s * .7},${cy - s * .8} ${cx},${cy} Z`, fill: '#ff8f1c' }, g); E('path', { d: `M${cx},${cy} Q${cx - s * .35},${cy - s * .5} ${cx},${cy - s} Q${cx + s * .35},${cy - s * .5} ${cx},${cy} Z`, fill: '#ffe66d' }, g); }
  function wing(p, G, c1, c2, kind, cls) {
    const g = mirror(p, cls); // drawn once for the left side and mirrored by the caller
    if (kind === 'bat') { path(g, 'M30,66 C16,58 6,44 10,30 C16,40 20,44 24,46 C20,36 20,30 24,22 C28,34 30,40 34,44 C34,36 38,30 44,26 C40,40 40,54 38,68 Z', G.lin(c1, c2, true)); line(g, 'M30,64 C22,52 16,42 12,32 M32,62 C26,48 24,38 25,25 M35,60 C34,48 36,38 42,28', c2, .9); }
    else if (kind === 'feather') { path(g, 'M32,68 C14,64 4,50 8,30 C12,44 16,50 22,52 C16,42 16,34 20,26 C24,38 28,44 32,46 C30,36 34,30 40,26 C38,40 38,54 38,70 Z', G.lin(c1, c2, true)); for (const d of ['M30,64 C20,54 14,44 12,34', 'M33,60 C26,50 24,40 24,30', 'M36,56 C33,46 35,38 40,30']) line(g, d, c2, .9); }
    else { // butterfly: a big upper lobe and a small lower lobe, with eye-spots
      path(g, 'M36,58 C20,40 4,28 4,44 C4,56 18,62 34,66 Z', G.lin(c1, c2, true)); path(g, 'M36,66 C24,66 8,70 10,82 C12,90 26,86 36,78 Z', G.lin(c2, c1, true));
      circ(g, 16, 48, 4.5, '#fff', { opacity: .85, 'stroke-width': .6 }); circ(g, 16, 48, 2.2, c2, NO); circ(g, 20, 79, 2.5, '#fff', { opacity: .8, 'stroke-width': .5 });
    }
  }
  function mane(p, G, cx, cy, r, c1, c2, n) { let d = ''; n = n || 13; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + .5) / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2; const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), qx = cx + r * 1.22 * Math.cos(a1), qy = cy + r * 1.22 * Math.sin(a1), x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2); d += (i ? '' : `M${x0.toFixed(1)},${y0.toFixed(1)} `) + `Q${qx.toFixed(1)},${qy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} `; } path(p, d + 'Z', G.rad(c1, c2, .4, .35)); }
  function wizardHat(p, G, cx, y, c1, c2, band) {
    path(p, `M${cx - 15},${y} Q${cx - 6},${y - 20} ${cx + 1},${y - 36} Q${cx + 7},${y - 42} ${cx + 13},${y - 35} Q${cx + 6},${y - 35} ${cx + 4},${y - 26} Q${cx + 10},${y - 12} ${cx + 16},${y} Z`, G.lin(c1, c2, true));
    ell(p, cx, y, 23, 4.6, G.lin(c2, c1)); path(p, `M${cx - 13},${y - 3} Q${cx},${y - 7} ${cx + 14},${y - 3} L${cx + 14},${y} Q${cx},${y - 4} ${cx - 13},${y} Z`, band, NO);
    sparkle(p, cx - 4, y - 16, 2.4, '-.8s'); sparkle(p, cx + 5, y - 9, 1.8, '-1.9s');
  }
  function helm(p, G, cx, top, plume) {
    if (plume) { const g = E('g', { class: 'sway' }, p); path(g, `M${cx - 3},${top + 2} C${cx - 10},${top - 8} ${cx - 4},${top - 18} ${cx + 6},${top - 16} C${cx - 2},${top - 10} ${cx + 2},${top - 4} ${cx + 3},${top + 2} Z`, '#d62839', { 'stroke-width': .9 }); }
    path(p, `M${cx - 22},${top + 24} Q${cx - 22},${top} ${cx},${top} Q${cx + 22},${top} ${cx + 22},${top + 24} Z`, G.lin('#e6ecf2', '#8d99a8', true));
    path(p, `M${cx - 23},${top + 21} L${cx + 23},${top + 21} L${cx + 23},${top + 25} L${cx - 23},${top + 25} Z`, '#aab6c3'); path(p, `M${cx - 2.2},${top + 20} L${cx + 2.2},${top + 20} L${cx + 2.2},${top + 34} L${cx - 2.2},${top + 34} Z`, '#c5cfd9');
    E('path', { d: `M${cx - 16},${top + 10} Q${cx - 8},${top + 3} ${cx},${top + 2}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, opacity: .55, 'stroke-linecap': 'round' }, p);
  }
  function scarf(p, G, c1, c2) { path(p, 'M27,74 Q50,65 73,74 L71,83 Q50,74 29,83 Z', G.lin(c1, c2)); path(p, 'M58,79 L70,98 L60,96 Z', c2); for (let i = 0; i < 4; i++) E('path', { d: `M${32 + i * 10},${80 - i * .6} l3,-2.4`, stroke: '#fff', 'stroke-width': 1, opacity: .45 }, p); }
  function teeth(p, cx, y, n, w) { for (let i = 0; i < n; i++) { const x = cx - ((n - 1) * w) / 2 + i * w; E('path', { d: `M${x - w * .42},${y} L${x},${y + w * .9} L${x + w * .42},${y} Z`, fill: '#fff', stroke: INK, 'stroke-width': .5 }, p); } }

  // ---------- the cast ----------
  const CHARS = {
    '🦁': { bg: ['#ffdf9a', '#c9741c'], draw(p, G) {
      mane(p, G, 50, 49, 31, '#d97a1f', '#8f420c'); mane(p, G, 50, 49, 27, '#e58c2c', '#b85a12', 11);
      earRound(p, G, 31, 30, 7.5, '#f4b64a', '#c98a1e', '#f7cf93', 'earL'); earRound(p, G, 69, 30, 7.5, '#f4b64a', '#c98a1e', '#f7cf93', 'earR');
      body(p, G, '#b8262b', '#5e0f14', '#f4ede2'); for (const x of [33, 41, 50, 59, 67]) E('path', { d: `M${x},${79 + Math.abs(x - 50) * .18} l1.2,3 l1.2,-3`, fill: '#2a1a12' }, p);
      head(p, G, 50, 48, 25, 24, '#f7c45a', '#d5902a'); muzzle(p, G, 50, 58.5, 13, 9, '#ffe9b8', '#f0c880');
      nose(p, 50, 54.5, 4, '#6b3a1e'); catMouth(p, 50, 59.5, 5); eyes(p, 10, 44, 5, '#5a3a1a'); cheeks(p, 17, 54, 3.4, '#ff9e7a');
      line(p, 'M36,58 l-9,-1 M36,60 l-9,2 M64,58 l9,-1 M64,60 l9,2', '#4a2a1a', .8);
      crown(p, G, 50, 27, 12, 12, '#ffe27a', '#c9962a');
    } },
    '🐉': { bg: ['#c8f0b2', '#2f6f3a'], draw(p, G) {
      wing(p, G, '#2f7a3f', '#173d1e', 'bat', 'wingL'); const r = E('g', { transform: 'translate(100 0) scale(-1 1)' }, p); wing(r, G, '#2f7a3f', '#173d1e', 'bat', 'wingR');
      body(p, G, '#4fae57', '#255c2e'); path(p, 'M38,74 Q50,70 62,74 L60,106 L40,106 Z', G.lin('#e6f5c4', '#bfdc93', true)); for (const y of [80, 87, 94, 101]) line(p, `M41,${y} Q50,${y + 2} 59,${y}`, '#8fb36a', .9);
      for (const s of [-1, 1]) path(p, `M${50 + s * 13},30 Q${50 + s * 17},16 ${50 + s * 9},9 Q${50 + s * 8},20 ${50 + s * 5},29 Z`, G.lin('#f3e7c4', '#c9b27a', true));
      head(p, G, 50, 48, 26, 25, '#6cc96e', '#357f3d'); for (const [x, y, h] of [[38, 26, 6], [50, 22, 8], [62, 26, 6]]) path(p, `M${x - 4},${y + 2} L${x},${y - h} L${x + 4},${y + 2} Z`, '#2f7a3f');
      muzzle(p, G, 50, 60, 14.5, 10, '#d7f0ad', '#a9d38a'); E('ellipse', { cx: 44.5, cy: 57, rx: 1.8, ry: 1.1, fill: '#3a5a2a' }, p); E('ellipse', { cx: 55.5, cy: 57, rx: 1.8, ry: 1.1, fill: '#3a5a2a' }, p);
      smile(p, 50, 63.5, 6.5, true, '#5a1e2a'); teeth(p, 50, 63.5, 3, 4);
      brows(p, 11, 36.5, 4.5, '#2f6f3a', true); eyes(p, 11, 43, 5.5, '#ffb703', true);
      const f = E('g', { transform: 'translate(61 64) rotate(-62)' }, p); flame(f, 0, 0, 7);
    } },
    '🦊': { bg: ['#ffe2b8', '#b85c1a'], draw(p, G) {
      earPointy(p, G, 33, 33, 8.5, 18, '#f58a3c', '#b64f12', '#fff0e2', 'earL', -18); earPointy(p, G, 67, 33, 8.5, 18, '#f58a3c', '#b64f12', '#fff0e2', 'earR', 18);
      body(p, G, '#3f8f4a', '#1f4f28', null); path(p, 'M28,80 Q50,74 72,80 L70,86 Q50,80 30,86 Z', '#6d4a24'); circ(p, 50, 83, 2.6, '#ffd54f', { 'stroke-width': .7 });
      head(p, G, 50, 48, 25, 24, '#f7913f', '#d3641c');
      ell(p, 37, 59, 11, 8.5, '#fff5ec', NO); ell(p, 63, 59, 11, 8.5, '#fff5ec', NO); muzzle(p, G, 50, 59.5, 12, 8.5, '#fffaf4', '#f6e6d6');
      nose(p, 50, 56.5, 3.4, '#2a1a12'); smile(p, 50, 60.5, 4.5); eyes(p, 10, 45, 4.9, '#3e2a1c'); cheeks(p, 18, 53, 3, '#ff9e7a');
      path(p, 'M31,31 Q50,13 69,31 L67,34 Q50,22 33,34 Z', G.lin('#4caf50', '#2e7d32', true)); path(p, 'M60,23 C66,12 76,10 82,16 C74,14 68,20 63,26 Z', '#d62839', { 'stroke-width': .8 }); line(p, 'M62,25 L78,15', '#7a1220', .7);
    } },
    '🐺': { bg: ['#d6dde6', '#3f4c5c'], draw(p, G) {
      earPointy(p, G, 28, 37, 7.5, 16, '#8d97a5', '#525d6b', '#dfe4ea', 'earL', -26); earPointy(p, G, 72, 37, 7.5, 16, '#8d97a5', '#525d6b', '#dfe4ea', 'earR', 26);
      body(p, G, '#2b5fa8', '#12305e', null); path(p, 'M27,78 C38,70 62,70 73,78 L69,86 C58,79 42,79 31,86 Z', '#b8c2cc'); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) circ(p, 34 + i * 6.4 + (j ? 3.2 : 0), 79 + j * 3.2 + Math.abs(i - 2.5) * .5, 1.1, '#e3e9ee', { 'stroke-width': .4 });
      path(p, 'M44,84 L56,84 L50,96 Z', '#ffd54f', { 'stroke-width': .8 });
      head(p, G, 50, 48, 25, 24, '#9aa4b1', '#5f6a78'); muzzle(p, G, 50, 60, 13.5, 9.5, '#eef1f4', '#d3d9df');
      nose(p, 50, 56.5, 3.6, '#1f1a1a'); smile(p, 50, 61, 5); eyes(p, 10, 45, 4.9, '#d8a520'); brows(p, 10, 38.5, 4, '#4d5a6b');
      helm(p, G, 50, 21, true);
    } },
    '🦄': { bg: ['#ffe3f6', '#8f5fd0'], draw(p, G) {
      const m = E('g', { class: 'sway' }, p); path(m, 'M42,26 C22,30 16,58 26,78 C32,60 28,42 46,30 Z', '#ff9ecf', { 'stroke-width': .9 }); path(m, 'M46,24 C30,28 22,50 30,70 C34,52 34,38 50,28 Z', '#b58cff', { 'stroke-width': .9 }); path(m, 'M50,23 C40,28 32,44 36,62 C40,46 42,36 54,27 Z', '#8fd3ff', { 'stroke-width': .9 });
      path(p, 'M45,27 L50,3 L55,27 Z', G.lin('#ffe27a', '#c9962a', true)); for (const y of [12, 17, 22]) line(p, `M${50 - (y - 3) * .2},${y} L${50 + (y - 3) * .2},${y - 1.5}`, '#b07a1a', .8);
      earPointy(p, G, 37, 32, 5.5, 12, '#fffaff', '#e2cdf2', '#ffc6de', 'earL', -14); earPointy(p, G, 63, 32, 5.5, 12, '#fffaff', '#e2cdf2', '#ffc6de', 'earR', 14);
      body(p, G, '#fffaff', '#dcc8ee', '#ff9ecf'); circ(p, 50, 82, 2.8, '#ffe27a', { 'stroke-width': .7 });
      head(p, G, 50, 48, 25, 24, '#fffaff', '#e6d6f3'); muzzle(p, G, 50, 60, 12.5, 9, '#ffe4ef', '#ffc9dd'); E('ellipse', { cx: 45.5, cy: 58, rx: 1.4, ry: 1, fill: '#d98aa8' }, p); E('ellipse', { cx: 54.5, cy: 58, rx: 1.4, ry: 1, fill: '#d98aa8' }, p);
      smile(p, 50, 63, 4.5); eyes(p, 10, 45, 5.3, '#7b4fd6'); lashes(p, 10, 45, 5.3); cheeks(p, 18, 54, 3.2);
      sparkle(p, 22, 38, 3.4, '-.5s'); sparkle(p, 79, 30, 2.6, '-1.6s'); sparkle(p, 74, 70, 2.2, '-2.4s');
    } },
    '🐯': { bg: ['#ffdca6', '#c25a17'], draw(p, G) {
      earRound(p, G, 31, 30, 7.5, '#f79a3e', '#c95e1a', '#ffd7c2', 'earL'); earRound(p, G, 69, 30, 7.5, '#f79a3e', '#c95e1a', '#ffd7c2', 'earR');
      body(p, G, '#6b4a2b', '#2e1c0e', null); path(p, 'M36,78 Q50,72 64,78 L62,92 Q50,96 38,92 Z', G.lin('#ffd54f', '#b8860b', true)); line(p, 'M50,78 L50,94 M40,85 Q50,88 60,85', '#8a6508', .9);
      head(p, G, 50, 48, 25, 24, '#f79a3e', '#cf641c');
      for (const d of ['M50,25 L47.5,35 L50,33 L52.5,35 Z', 'M26,43 L35,44.5 L28,49 Z', 'M74,43 L65,44.5 L72,49 Z', 'M29,34 L37,38 L31,40 Z', 'M71,34 L63,38 L69,40 Z']) path(p, d, '#2f1d14', NO);
      muzzle(p, G, 50, 60, 14, 9.5, '#fff5ea', '#f3dfc8'); nose(p, 50, 56, 3.6, '#c0605a'); catMouth(p, 50, 60.5, 5); line(p, 'M36,59 l-8,-1 M36,61 l-8,2 M64,59 l8,-1 M64,61 l8,2', '#4a2a1a', .8);
      eyes(p, 10, 45.5, 5, '#3fa34d');
      path(p, 'M27,33.5 Q50,27 73,33.5 L73,38.5 Q50,32 27,38.5 Z', G.lin('#d62839', '#8f1020')); circ(p, 50, 33, 3.6, '#ffd54f', { 'stroke-width': .7 });
    } },
    '🐻': { bg: ['#ecd2b0', '#6d4123'], draw(p, G) {
      earRound(p, G, 30, 29, 8, '#a86a3c', '#6e3f1e', '#d9a06b', 'earL'); earRound(p, G, 70, 29, 8, '#a86a3c', '#6e3f1e', '#d9a06b', 'earR');
      body(p, G, '#7a1f1f', '#3d0c0c', '#c9962a'); path(p, 'M43,84 L57,84 L57,92 Q50,98 43,92 Z', G.lin('#ffd54f', '#c9962a', true)); path(p, 'M50,86 L52,90 L50,89 L48,90 Z', '#7a1f1f', NO);
      head(p, G, 50, 48, 25.5, 24, '#ad6d3e', '#764222'); muzzle(p, G, 50, 60, 13.5, 10, '#e9c39a', '#d1a071');
      nose(p, 50, 56, 4.2, '#2f1d14'); smile(p, 50, 61.5, 5); eyes(p, 10, 45, 4.7, '#3a2418'); cheeks(p, 18, 54, 3.2, '#e27a6a');
    } },
    '🦅': { bg: ['#eceef4', '#353a5c'], draw(p, G) {
      wing(p, G, '#6b4423', '#2f1c0d', 'feather', 'wingL'); const r = E('g', { transform: 'translate(100 0) scale(-1 1)' }, p); wing(r, G, '#6b4423', '#2f1c0d', 'feather', 'wingR');
      body(p, G, '#6b4423', '#2f1c0d', null); path(p, 'M36,72 Q50,68 64,72 L60,100 L40,100 Z', G.lin('#8a5a30', '#4a2c14', true)); for (const y of [80, 88, 96]) line(p, `M41,${y} Q50,${y + 3} 59,${y}`, '#a27442', .8);
      for (const [x, h] of [[42, 9], [50, 12], [58, 9]]) path(p, `M${x - 2.5},27 Q${x},${27 - h} ${x + 2.5},27 Z`, '#f4f4f0');
      head(p, G, 50, 48, 24, 25, '#fdfdfa', '#cfd0c8');
      path(p, 'M42,52 Q50,49 58,52 Q61,60 51,69 Q46,62 42,52 Z', G.lin('#ffc233', '#c98a00', true)); E('circle', { cx: 47, cy: 54.5, r: 1.1, fill: '#8a5a00' }, p); line(p, 'M43,56 Q50,58 57,56', '#a56f00', .9);
      brows(p, 10, 39, 5, '#2f1c0d', true); eyes(p, 10, 45, 4.8, '#e0a800');
      path(p, 'M30,30 Q50,20 70,30', 'none', { stroke: '#ffd54f', 'stroke-width': 2.2 }); circ(p, 50, 24.6, 2.4, '#ff4d6d', { 'stroke-width': .6 });
    } },
    '🐸': { bg: ['#daf7b6', '#2f7a3f'], draw(p, G) {
      body(p, G, '#6cc04a', '#2f7a2f', '#c62828'); circ(p, 50, 82, 2.8, '#ffd54f', { 'stroke-width': .7 });
      head(p, G, 50, 53, 27, 22, '#7ccb55', '#3f8b2f'); for (const s of [-1, 1]) { circ(p, 50 + s * 14, 33, 9.5, G.rad('#7ccb55', '#3f8b2f')); }
      eyes(p, 14, 33, 5.6, '#2f2a1a'); E('ellipse', { cx: 46, cy: 51, rx: 1.4, ry: 1, fill: '#2f5a1a' }, p); E('ellipse', { cx: 54, cy: 51, rx: 1.4, ry: 1, fill: '#2f5a1a' }, p);
      path(p, 'M31,58 Q50,74 69,58 Q50,68 31,58 Z', '#5a1e2a', { 'stroke-width': 1 }); E('path', { d: 'M44,63 Q50,69 56,63 Q50,66 44,63 Z', fill: '#ff7f96' }, p); cheeks(p, 21, 60, 3, '#ffb3a7');
      crown(p, G, 50, 26, 7, 8, '#ffe27a', '#c9962a');
    } },
    '🐧': { bg: ['#dbeeff', '#24508f'], draw(p, G) {
      body(p, G, '#2b2f3a', '#0f1218', null); path(p, 'M34,72 Q50,67 66,72 L64,106 L36,106 Z', G.lin('#ffffff', '#e2e6ea', true)); scarf(p, G, '#3d7bd6', '#1f4f9e');
      head(p, G, 50, 46, 25, 24, '#343947', '#12151d'); ell(p, 50, 50, 17.5, 15.5, G.rad('#ffffff', '#e6e8ea'), { 'stroke-width': .8 });
      path(p, 'M43,53 L57,53 L50,62 Z', G.lin('#ffb020', '#e07b00', true)); line(p, 'M44,54.5 L56,54.5', '#b95f00', .8);
      eyes(p, 9, 44.5, 4.8, '#1a1210'); cheeks(p, 16, 52, 2.8);
      for (const x of [41, 59]) circ(p, x, 44.5, 8, 'none', { stroke: '#5b4636', 'stroke-width': 1.9 }); line(p, 'M49,44 L51,44 M33,44 L28,41 M67,44 L72,41', '#5b4636', 1.6);
    } },
    '🦖': { bg: ['#cdeee0', '#1f5a4a'], draw(p, G) {
      body(p, G, '#4fa88b', '#22584a', '#c62828'); line(p, 'M32,84 Q50,92 68,84', '#f3e7c4', 1.4); path(p, 'M48,88 L52,88 L51,96 L49,96 Z', '#fff8e6', { 'stroke-width': .6 });
      head(p, G, 50, 47, 26, 24, '#5fb89b', '#2b6b58'); for (const [x, y] of [[36, 36], [64, 34], [42, 30]]) circ(p, x, y, 2.6, '#3b8a70', { opacity: .7, 'stroke-width': 0 });
      for (const [x, h] of [[38, 5], [50, 7], [62, 5]]) path(p, `M${x - 4},${25 + (50 - x) * .1} Q${x},${23 - h} ${x + 4},${25 + (50 - x) * .1} Z`, '#2b6b58');
      muzzle(p, G, 50, 61, 16, 10.5, '#c9e8d3', '#9ccbb0'); E('ellipse', { cx: 44, cy: 57, rx: 1.7, ry: 1.1, fill: '#2b5a4a' }, p); E('ellipse', { cx: 56, cy: 57, rx: 1.7, ry: 1.1, fill: '#2b5a4a' }, p);
      smile(p, 50, 64, 8, true, '#5a1e2a'); teeth(p, 50, 64, 5, 3.4);
      brows(p, 11, 37, 4.5, '#2b6b58', true); eyes(p, 11, 43, 5, '#e0a800');
    } },
    '🐼': { bg: ['#e6e8ff', '#3f2f8a'], draw(p, G) {
      earRound(p, G, 28, 34, 8, '#2b2b2b', '#0c0c0c', '#3d3d3d', 'earL'); earRound(p, G, 72, 34, 8, '#2b2b2b', '#0c0c0c', '#3d3d3d', 'earR');
      body(p, G, '#5e35b1', '#24125e', '#8e6bd6'); path(p, 'M53,82 A5,5 0 1 1 49,90 A3.6,3.6 0 1 0 53,82 Z', '#ffd54f', { 'stroke-width': .6 });
      head(p, G, 50, 49, 25, 23.5, '#fdfdfb', '#dcdcd4');
      for (const s of [-1, 1]) E('ellipse', { cx: 50 + s * 9.5, cy: 46, rx: 7.8, ry: 9, fill: '#232323', transform: `rotate(${s * -18} ${50 + s * 9.5} 46)` }, p);
      eyes(p, 9.5, 47, 4, '#1a1210'); nose(p, 50, 56.5, 3.6, '#1a1210'); smile(p, 50, 60.5, 4.5); cheeks(p, 19, 55, 3);
      wizardHat(p, G, 50, 29, '#5c6bc0', '#1f2a7a', '#ffd54f');
    } },
    '🦋': { bg: ['#ffe6f0', '#c94b8f'], draw(p, G) {
      wing(p, G, '#ff8fb1', '#ff6d00', 'butterfly', 'wingL'); const r = E('g', { transform: 'translate(100 0) scale(-1 1)' }, p); wing(r, G, '#ff8fb1', '#ff6d00', 'butterfly', 'wingR');
      body(p, G, '#6fbf73', '#2f7a3f', null); path(p, 'M28,78 Q39,70 50,72 Q61,70 72,78 L66,86 Q50,80 34,86 Z', '#3f9f4a'); for (const x of [36, 50, 64]) path(p, `M${x},78 q-3,4 0,8 q3,-4 0,-8 Z`, '#a5d6a7', { 'stroke-width': .5 });
      path(p, 'M25,48 C22,20 78,20 75,48 Q64,32 50,33 Q36,32 25,48 Z', G.lin('#8d5524', '#4e2a12', true));
      head(p, G, 50, 50, 22, 23, '#ffdcbd', '#e8b48e'); path(p, 'M27,44 C30,28 42,26 50,32 C58,26 70,28 73,44 Q62,36 50,38 Q38,36 27,44 Z', G.lin('#a06a35', '#5e3416', true));
      eyes(p, 9, 50, 5, '#3b7dd8'); lashes(p, 9, 50, 5); E('circle', { cx: 50, cy: 57, r: 1.3, fill: '#d9a08a' }, p); smile(p, 50, 61, 4); cheeks(p, 16, 57, 3.2, '#ff8fa3');
      for (const [x, y, c] of [[36, 30, '#ff8fb1'], [50, 27, '#ffd54f'], [64, 30, '#8fd3ff']]) { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; circ(p, x + 2.6 * Math.cos(a), y + 2.6 * Math.sin(a), 1.7, c, { 'stroke-width': .4 }); } circ(p, x, y, 1.3, '#fff8c4', NO); }
      sparkle(p, 20, 36, 2.6, '-.7s'); sparkle(p, 82, 42, 2.2, '-1.9s');
    } },
    '🐙': { bg: ['#ffd9e8', '#6e2560'], draw(p, G) {
      for (let i = 0; i < 5; i++) { const x = 24 + i * 13, g = E('g', { class: 'tent' }, p); g.style.animationDelay = (-i * .45) + 's'; path(g, `M${x - 5},70 C${x - 8},84 ${x - 2 + (i % 2 ? 6 : -6)},96 ${x + (i % 2 ? 8 : -8)},108 L${x + (i % 2 ? 2 : -2)},108 C${x - 2 + (i % 2 ? 2 : -2)},96 ${x + 2},86 ${x + 5},70 Z`, G.lin('#e86aa7', '#9c2f6c', true)); for (const y of [80, 88, 96]) circ(g, x + (i % 2 ? 1 : -1) * (y - 70) * .25, y, 1.4, '#ffd0e4', { 'stroke-width': .4 }); }
      head(p, G, 50, 47, 28, 27, '#f27fb5', '#b8438a'); ell(p, 50, 58, 20, 13, G.rad('#ffc4de', '#f7a5c8', .4, .3), { 'stroke-width': .7 });
      eyes(p, 11, 51, 5.6, '#2a1a3a'); smile(p, 50, 62, 5); cheeks(p, 19, 60, 3.4, '#ff6f91');
      path(p, 'M23,42 C24,18 76,18 77,42 Q50,33 23,42 Z', G.lin('#e53935', '#8e0d0d', true)); for (const [x, y] of [[36, 30], [50, 25], [64, 30], [43, 36], [57, 36]]) circ(p, x, y, 1.6, '#fff', NO);
      path(p, 'M75,40 L88,33 L86,44 Z', '#c62828'); path(p, 'M76,42 L89,48 L82,50 Z', '#c62828'); circ(p, 78, 60, 2.6, 'none', { stroke: '#ffd54f', 'stroke-width': 1.6 });
    } },
    '🦈': { bg: ['#cfe9ff', '#173f66'], draw(p, G) {
      path(p, 'M44,26 L54,2 L61,28 Z', G.lin('#7fa6c6', '#3e6b8e', true));
      body(p, G, '#6f9bbf', '#2b527a', null); path(p, 'M36,72 Q50,68 64,72 L62,106 L38,106 Z', G.lin('#f2f7fb', '#cfdde8', true));
      head(p, G, 50, 48, 26, 25, '#7aa6c9', '#3a6689'); ell(p, 50, 62, 19, 12.5, G.rad('#f4f8fb', '#d9e5ee', .4, .3), { 'stroke-width': .7 });
      line(p, 'M27,48 q2,4 0,8 M30,46 q2,4 0,8 M33,45 q2,4 0,8', '#2e5675', 1);
      eyes(p, 11, 44, 4.9, '#1a1210'); brows(p, 11, 37.5, 4, '#2e5675', true);
      path(p, 'M35,61 Q50,74 65,61 Q50,66 35,61 Z', '#5a1e2a', { 'stroke-width': 1 }); teeth(p, 50, 61.5, 6, 4);
      for (const s of [-1, 1]) path(p, `M${50 + s * 22},40 Q${50 + s * 40},34 ${50 + s * 36},14 Q${50 + s * 30},28 ${50 + s * 20},31 Z`, G.lin('#f3e7c4', '#c9b27a', true));
      path(p, 'M28,42 Q28,18 50,18 Q72,18 72,42 Z', G.lin('#dde5ec', '#8494a4', true)); path(p, 'M27,39 L73,39 L73,44 L27,44 Z', '#aab6c3'); E('path', { d: 'M34,30 Q42,22 50,21', fill: 'none', stroke: '#fff', 'stroke-width': 1.6, opacity: .55, 'stroke-linecap': 'round' }, p);
    } },
    '🐲': { bg: ['#ffe0a3', '#8f1d1d'], draw(p, G) {
      for (const s of [-1, 1]) path(p, `M${50 + s * 14},30 Q${50 + s * 22},22 ${50 + s * 20},8 Q${50 + s * 18},18 ${50 + s * 10},26 Z M${50 + s * 20},14 Q${50 + s * 28},12 ${50 + s * 30},4 Q${50 + s * 24},10 ${50 + s * 19},12 Z`, G.lin('#ffcf5a', '#b8781a', true));
      const mn = E('g', { class: 'sway' }, p); for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.0875 * 2); const x = 50 + 30 * Math.cos(a), y = 44 + 30 * Math.sin(a) * .9; path(mn, `M${x - 5},${y} Q${x},${y - 12} ${x + 5},${y} Z`, i % 2 ? '#ffb703' : '#ff8f1c', { 'stroke-width': .8, transform: `rotate(${(a - Math.PI / 2) * 180 / Math.PI} ${x} ${y})` }); }
      body(p, G, '#c62828', '#6a0c0c', null); path(p, 'M38,74 Q50,70 62,74 L60,106 L40,106 Z', G.lin('#ffe082', '#d9a024', true)); for (const y of [80, 87, 94, 101]) line(p, `M41,${y} Q50,${y + 2} 59,${y}`, '#b07a1a', .9);
      head(p, G, 50, 48, 26, 24, '#e8553f', '#961e14'); muzzle(p, G, 50, 60.5, 15, 9.5, '#ffb08a', '#ee8a62'); E('ellipse', { cx: 44.5, cy: 57.5, rx: 1.8, ry: 1.1, fill: '#7a2a1a' }, p); E('ellipse', { cx: 55.5, cy: 57.5, rx: 1.8, ry: 1.1, fill: '#7a2a1a' }, p);
      for (const s of [-1, 1]) { const w = E('g', { class: 'sway' }, p); line(w, `M${50 + s * 14},59 C${50 + s * 26},58 ${50 + s * 34},66 ${50 + s * 30},80`, '#ffcf5a', 1.6); }
      smile(p, 50, 64, 6); brows(p, 11, 36.5, 4.5, '#ffcf5a', true); eyes(p, 11, 43, 5, '#ffd166', true);
      const g = E('g', { class: 'glow' }, p); circ(g, 50, 33, 5, '#fff', { opacity: .35, 'stroke-width': 0 }); circ(p, 50, 33, 3.2, G.rad('#ffffff', '#cfd8ff', .35, .3), { 'stroke-width': .6 });
    } },
    '🤖': { bg: ['#e3f2fd', '#37474f'], draw(p, G) {
      line(p, 'M50,28 L50,17', '#78909c', 2.4); const a = E('g', { class: 'glow' }, p); circ(a, 50, 15, 3.2, '#ff5252', { 'stroke-width': .6 });
      body(p, G, '#90a4ae', '#455a64', null); path(p, 'M40,78 L60,78 L60,92 L40,92 Z', '#263238'); path(p, 'M44,85 A6,6 0 0 1 56,85', 'none', { stroke: '#4ff0c8', 'stroke-width': 1.6 }); line(p, 'M50,85 L54,81', '#4ff0c8', 1.2);
      for (const s of [-1, 1]) path(p, `M${50 + s * 26},40 L${50 + s * 30},40 L${50 + s * 30},54 L${50 + s * 26},54 Z`, '#78909c');
      path(p, 'M28,30 Q28,26 32,26 L68,26 Q72,26 72,30 L72,64 Q72,68 68,68 L32,68 Q28,68 28,64 Z', G.lin('#cfd8dc', '#78909c', true));
      path(p, 'M34,34 Q34,32 36,32 L64,32 Q66,32 66,34 L66,58 Q66,60 64,60 L36,60 Q34,60 34,58 Z', '#152029');
      for (const s of [-1, 1]) { const g = E('g', { class: 'blink' }, p); circ(g, 50 + s * 8, 44, 4.2, '#4ff0c8', { 'stroke-width': 0 }); circ(g, 50 + s * 8, 44, 1.6, '#e0fff7', NO); }
      line(p, 'M43,54 L57,54', '#4ff0c8', 2.2); for (const x of [45, 50, 55]) line(p, `M${x},52.5 L${x},55.5`, '#152029', .9);
    } }
  };

  const directors = new Set(), CUSTOM = {};   // forged avatars: key 'c:<id>' → data URL of a 4-frame strip (one row)
  function registerCustom(key, strip) { CUSTOM[key] = strip; }
  function makePhoto(key) {
    const custom = CUSTOM[key], sh = custom ? null : sheetOf(key); if (!custom && !sh) return null;
    const d = document.createElement('div'); d.className = 'kqav-photo';
    const glow = document.createElement('i'); glow.className = 'glow'; d.appendChild(glow);
    const mask = document.createElement('div'); mask.className = 'mask'; d.appendChild(mask);
    const url = `url("${custom || (BASE + sh.file)}")`, pos = frame => `${frame / (SHEET.frames - 1) * 100}% ${custom ? 0 : sh.row / (sh.rows - 1) * 100}%`;
    // two face layers crossfade, so every change of expression is a soft dissolve rather than a hard cut
    const faces = [0, 1].map(() => { const f = document.createElement('div'); f.className = 'face'; f.style.backgroundImage = url; if (custom) f.style.backgroundSize = '400% 100%'; mask.appendChild(f); return f; });
    let cur = 0; faces[0].style.backgroundPosition = pos(0); faces[1].classList.add('off');
    const show = frame => { const nxt = 1 - cur; faces[nxt].style.backgroundPosition = pos(frame); faces[nxt].classList.remove('off'); faces[cur].classList.add('off'); cur = nxt; };
    const ring = document.createElement('i'); ring.className = 'kqav-ring'; d.appendChild(ring);   // not 'ring': kq.css owns that class for progress rings
    if ('🦄🦋🐲'.includes(key) || /^h:(icemage|timemage|summoner|wizard)$/.test(key)) { for (const [x, y, dl] of [[18, 22, 0], [74, 16, -.9], [80, 66, -1.8]]) { const s = document.createElement('i'); s.className = 'spark'; s.style.left = x + '%'; s.style.top = y + '%'; s.style.animationDelay = dl + 's'; d.appendChild(s); } }
    d.style.setProperty('--d', (-(Math.random() * 5)).toFixed(2) + 's');
    // the director: slow, rounded — a blink every 3–8 s, a lingering glance aside, a wave now and then; tap = wave
    let busy = false, timer = null;
    const play = (frames, done) => { busy = true; let i = 0; const step = () => { if (!d.isConnected) return; if (i >= frames.length) { show(0); busy = false; done && done(); return; } const [fr, ms] = frames[i++]; show(fr); timer = setTimeout(step, ms); }; step(); };
    const blink = () => play([[1, 260]]);
    const look = () => play([[2, 1600], [0, 500], [2, 1200]]);
    const wave = () => play([[3, 520], [0, 380], [3, 640], [0, 300], [3, 900]]);
    const tick = () => { if (!d.isConnected) { clearTimeout(timer); directors.delete(tick); return; } if (!busy) { const r = Math.random(); if (r < 0.6) blink(); else if (r < 0.88) look(); else wave(); } setTimeout(tick, 3000 + Math.random() * 5000); };
    setTimeout(tick, 800 + Math.random() * 3000); directors.add(tick);
    d.addEventListener('pointerdown', () => { if (!busy) wave(); });
    return d;
  }
  // a still portrait (frame 0, no director, no ring) — for ingredient tiles and other places that only need the face
  function still(key) { ensureCss(); const sh = sheetOf(key); if (!sh) return null; const d = document.createElement('div'); d.className = 'kqav-still'; d.style.cssText = `width:100%;height:100%;border-radius:50%;background:#1a1030 url("${BASE + sh.file}") no-repeat;background-size:400% auto;background-position:0% ${sh.row / (sh.rows - 1) * 100}%`; return d; }
  let sheetOk = null;   // null = unknown, true/false once the sheet has loaded or failed
  function probeSheet() { if (sheetOk !== null || !BASE) return; const im = new Image(); im.onload = () => { sheetOk = true; }; im.onerror = () => { sheetOk = false; document.querySelectorAll('.kqav-photo').forEach(n => { const key = n.dataset.key, svg = makeSvg(key); if (svg) n.replaceWith(svg); }); }; im.src = BASE + 'avatars.webp'; }
  function make(key) {
    ensureCss(); probeSheet();
    if (CUSTOM[key]) { const p = makePhoto(key); p.dataset.key = key; return p; }
    if (sheetOk !== false) { const p = makePhoto(key); if (p) { p.dataset.key = key; return p; } }
    return makeSvg(key);
  }
  function makeSvg(key) {
    const C = CHARS[key]; if (!C) return null;
    ensureCss();
    const id = 'kqav' + (++uid) + '_';
    const svg = E('svg', { viewBox: '0 0 100 100', class: 'kqav', 'aria-hidden': 'true', focusable: 'false' });
    const defs = E('defs', null, svg), G = grads(defs, id);
    const clip = E('clipPath', { id: id + 'c' }, defs); E('circle', { cx: 50, cy: 50, r: 49 }, clip);
    E('circle', { cx: 50, cy: 50, r: 49, fill: G.rad(C.bg[0], C.bg[1], .5, .38) }, svg);
    const root = E('g', { 'clip-path': `url(#${id}c)` }, svg);
    E('ellipse', { cx: 50, cy: 96, rx: 40, ry: 22, fill: '#000', opacity: .14 }, root);
    C.draw(E('g', { class: 'bob' }, root), G);
    E('circle', { cx: 50, cy: 50, r: 48.3, fill: 'none', stroke: 'rgba(255,255,255,.5)', 'stroke-width': 1.6 }, svg);
    E('path', { d: 'M13,36 A40,40 0 0 1 36,13', fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: .4 }, svg);
    svg.style.setProperty('--d', (-(Math.random() * 6)).toFixed(2) + 's');
    return svg;
  }
  // a static raster-friendly copy (for canvas textures such as the chess victory banner)
  // Draw a portrait into a canvas context (async): the sheet tile clipped to a circle, or the SVG when the sheet is missing.
  function draw(key, ctx, x, y, size) {
    const sh = sheetOf(key), i = sh ? sh.row : -1;
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => { ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip(); if (i >= 0 && im.naturalWidth > 300) { const T = im.naturalWidth / SHEET.frames; ctx.drawImage(im, 0, i * T, T, T, x, y, size, size); } else ctx.drawImage(im, x, y, size, size); ctx.restore(); resolve(true); };
      im.onerror = () => { const url = dataURL(key, size); if (!url) return resolve(false); const s = new Image(); s.onload = () => { ctx.drawImage(s, x, y, size, size); resolve(true); }; s.onerror = () => resolve(false); s.src = url; };
      if (CUSTOM[key]) { im.onload = () => { ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip(); const T = im.naturalWidth / SHEET.frames; ctx.drawImage(im, 0, 0, T, im.naturalHeight, x, y, size, size); ctx.restore(); resolve(true); }; im.src = CUSTOM[key]; return; }
      im.src = sh && BASE ? BASE + sh.file : (dataURL(key, size) || '');
    });
  }
  function dataURL(key, size) { const s = makeSvg(key); if (!s) return null; s.setAttribute('xmlns', NS); s.setAttribute('width', size || 512); s.setAttribute('height', size || 512); s.removeAttribute('style'); return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(s)); }
  window.KQAvatars = { keys: SHEET.order.slice(), heroes: SHEETS[0].order.slice(), forge: SHEETS.find(x => x.file === 'forge2.webp').order.slice(),   /* by name: SHEETS[2] became the eggs sheet, and every free animal×fruit mix was sent to the painter (2026-09-29) */ still, has: k => !!sheetOf(k) || !!CHARS[k] || !!CUSTOM[k], make, makeSvg, dataURL, draw, registerCustom };
})();
