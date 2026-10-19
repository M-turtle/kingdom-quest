/* Kingdom Quest — סדנת אומן / the Atelier, v4. Built on the Doll Studio's process (shared/studio.js), after Yoni 2026-10-19 on v3:
   'you can't show the finished product on the doll before it's actually finished ... work on making the dress and then afterwards when it's done,
   put it on ... the process itself should actually show how the radius is made ... cut separately the cloth, put the cloth on the table, put the
   dial on the cloth and then extend it to the right size ... separate portions ... a sense of success for every stage, and then the end product
   ... the ruler needs to zoom in for kids to understand ... showing the ruler not in exactly the locations of the zero, the numbers'.
   · A short worked lesson first (the ruler; halves or millimetres; the circle and its radius), shown on the same ruler and cloth the kid will use.
   · Every piece is made in small stages shown in a row of chips at the top; each stage ends with its own success. Nothing is shown on the client
     until the piece is finished; then it goes on, and the body judges the fit.
   · Every reading zooms into the very ruler on the screen (0 stays its 0) until a half or a millimetre is easy to see. No separate strip.
   · Circles are made on the cloth: the cloth square is cut from the roll first, the compass pin goes in its centre, the ruler is laid from the pin,
     the compass is opened along it to the radius, swung round, and the circle is cut.
   · Garments are the clients' own rendered garments (Gemini edit of each filmed client), coloured with the Doll Studio's colours and patterns.
   Tiers: 1 (to 6) felt, whole cm, skirt + belt; 2 (7–10) nature-tech, half cm, circle skirt + belt; 3 (11+) nature-tech, mm, circle skirt + belt + beret. */
(function () {
  'use strict';
  const VERSION = 4;
  const $ = (s, r) => (r || document).querySelector(s), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const NS = 'http://www.w3.org/2000/svg', sv = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a || {}) e.setAttribute(k, a[k]); return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms)), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.floor(Math.random() * a.length)];
  const stage = $('#stage'), world = $('#world'), scene = $('#scene'), overlay = $('#overlay'), table = $('#table'), ui = $('#ui'), actors = $('#actors');
  const PREC = { 1: 1, 2: 0.5, 3: 0.1 }, TOL = { 1: 0.4, 2: 0.3, 3: 0.06 }, H = 58, IMG_CM = 30;
  const READZ = { 1: 4, 2: 5, 3: 8.5 }, SPAN = { 1: 5, 2: 3.5, 3: 1.6 };   /* how close a reading zooms: on the body (camera) and on the table (cm across the screen) */
  const CLIENTS = ['girl', 'boy', 'grandma', 'bear', 'fox', 'princess'];
  const COLOURS = ['#ff8fb8', '#8fd0f0', '#c0a0ff', '#ffcf6a', '#7fdcb0', '#ff9f90', '#e8545c', '#5a78c8'];   /* the Doll Studio's PASTEL, + red, navy */
  const KINDS = ['plain', 'dots', 'stripes', 'gingham', 'flowers', 'hearts', 'stars', 'zigzag'];               /* the Doll Studio's FAB, + stars, zigzag */
  const ORDER = { 1: ['skirt', 'belt'], 2: ['circleSkirt', 'belt'], 3: ['circleSkirt', 'belt', 'hat'] };
  const Z = { circleSkirt: 1, skirt: 1, belt: 2, hat: 3 };

  /* ---------- state ---------- */
  const S = { lang: 'he', look: 'felt', tier: 1, name: '', age: 6, coins: 10, rep: 0, day: 1, wardrobe: [], seen: 0, lessons: {} };
  const KEY = 'kq_atelier_v4';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.name) { Object.assign(S, j); S.lessons = S.lessons || {}; return; } for (const k of ['kq_atelier_v3', 'kq_atelier_v2', 'kq_atelier_v1']) { const o = JSON.parse(localStorage.getItem(k) || 'null'); if (o && o.name) { S.name = o.name; S.age = o.age || 6; S.lang = o.lang || 'he'; break; } } } catch (e) {} }
  const T = () => window.AT_STR[S.lang] || window.AT_STR.en;
  const look = (o, k) => k.split('.').reduce((a, p) => (a && a[p] != null ? a[p] : null), o);
  const t = (k, v) => { let s = look(T(), k); if (s == null) s = look(window.AT_STR.en, k); if (s == null) s = k; return String(s).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m)); };
  const snapTo = (v, p) => +(Math.round(v / p) * p).toFixed(2), snap = v => snapTo(v, PREC[S.tier]);
  const fmt = v => { const r = Math.round(v * 10) / 10; return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(1); };
  const same = (a, b, tol) => Math.abs(a - b) <= (tol != null ? tol : PREC[S.tier] / 4) + 1e-6;
  const cname = () => t('client.' + C.key), pname = k => t('piece.' + k);

  /* ---------- the stage, the camera on the world, the zoom on the table ---------- */
  let W = 177.78;
  const px = v => 'calc(var(--u) * ' + (+v).toFixed(3) + ' * 1px)';
  const VB = { x: 0, y: 0, w: 177.78, h: 100 };
  function setVB() { table.setAttribute('viewBox', [VB.x, VB.y, VB.w, VB.h].map(v => v.toFixed(3)).join(' ')); }
  function measureStage() { const r = stage.getBoundingClientRect(); const full = VB.w >= W - 0.01; W = 100 * r.width / r.height; stage.style.setProperty('--u', (r.height / 100).toFixed(4)); overlay.setAttribute('viewBox', '0 0 ' + W.toFixed(3) + ' 100'); if (full) { VB.x = 0; VB.y = 0; VB.w = W; VB.h = 100; } setVB(); }
  window.addEventListener('resize', () => { measureStage(); applyCam(0); }); measureStage();
  const CAM = { z: 1, tx: 0, ty: 0 };
  function applyCam(ms) { world.style.transition = ms ? 'transform ' + ms + 'ms cubic-bezier(.4,0,.2,1)' : 'none'; world.style.transform = 'translate(' + px(CAM.tx) + ', ' + px(CAM.ty) + ') scale(' + CAM.z + ')'; scene.style.filter = CAM.z > 1.05 ? 'blur(3px) brightness(.85)' : ''; }
  function camTo(fx, fy, z, ms) { ms = ms == null ? 750 : ms; let tx = W / 2 - fx * z, ty = 50 - fy * z; if (z <= 1) { z = 1; tx = 0; ty = 0; } tx = clamp(tx, W - W * z, 0); ty = clamp(ty, 100 - 100 * z, 0); Object.assign(CAM, { z, tx, ty }); applyCam(ms); return wait(ms + 40); }
  function zoomVB(cx, cy, w, ms) { ms = ms == null ? 800 : ms; w = clamp(w, 3, W); const h = w * 100 / W, x = clamp(cx - w / 2, 0, W - w), y = clamp(cy - h / 2, 0, 100 - h); const from = Object.assign({}, VB), to = { x, y, w, h };
    return new Promise(res => { const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; for (const q of ['x', 'y', 'w', 'h']) VB[q] = from[q] + (to[q] - from[q]) * e; setVB(); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }); }
  const zoomOut = ms => zoomVB(W / 2, 50, W, ms);
  const w2s = (x, y) => ({ x: CAM.tx + x * CAM.z, y: CAM.ty + y * CAM.z });
  const t2s = (x, y) => ({ x: (x - VB.x) * W / VB.w, y: (y - VB.y) * 100 / VB.h });
  const spt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.height * 100, y: (e.clientY - r.top) / r.height * 100 }; };
  const wpt = e => { const s = spt(e); return { x: (s.x - CAM.tx) / CAM.z, y: (s.y - CAM.ty) / CAM.z }; };
  const tpt = e => { const s = spt(e); return { x: VB.x + s.x * VB.w / W, y: VB.y + s.y * VB.h / 100 }; };
  function drag(elm, space, onMove, onEnd) { let on = false; const P = e => (space === 'world' ? wpt(e) : space === 'table' ? tpt(e) : spt(e));
    elm.addEventListener('pointerdown', e => { on = true; try { elm.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); onMove(P(e), true); });
    elm.addEventListener('pointermove', e => { if (on) onMove(P(e), false); });
    const up = e => { if (!on) return; on = false; if (onEnd) onEnd(P(e)); }; elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up); }
  const geo = g => { window.__geo = g; }, nogeo = () => { window.__geo = null; };

  /* ---------- assets ---------- */
  const A = { meta: {}, img: {} };
  const asset = (n, lk) => 'assets/' + (lk || S.look) + '/' + n;
  const loadImg = src => A.img[src] || (A.img[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
  async function loadLook() { $('#poster').src = asset('shop.webp'); $('#loop').src = asset('shop.mp4'); $('#tableBg').src = asset('table.webp'); try { A.meta = await (await fetch(asset('meta.json'))).json(); } catch (e) { A.meta = {}; } }
  function loopPlay(on) { const v = $('#loop'); if (on) { v.currentTime = 0; v.play().then(() => v.classList.add('on')).catch(() => {}); } else { v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 900); } }
  document.addEventListener('visibilitychange', () => { const v = $('#loop'); if (document.hidden) v.pause(); else if (v.classList.contains('on')) v.play().catch(() => {}); });

  /* ---------- fabric ---------- */
  function tileCanvas(fab, size) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.fillStyle = fab.col; g.fillRect(0, 0, size, size); g.fillStyle = 'rgba(255,255,255,.92)'; g.strokeStyle = 'rgba(255,255,255,.92)'; const s = size, k = fab.kind;
    if (k === 'dots') { for (const [x, y] of [[.25, .25], [.75, .75]]) { g.beginPath(); g.arc(s * x, s * y, s * .1, 0, 7); g.fill(); } }
    else if (k === 'stripes') g.fillRect(0, 0, s * .3, s);
    else if (k === 'gingham') { g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(0, s / 2, s, s / 2); g.fillRect(s / 2, 0, s / 2, s); }
    else if (k === 'flowers') { const c0 = s / 2; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; g.beginPath(); g.arc(c0 + Math.cos(a) * s * .13, c0 + Math.sin(a) * s * .13, s * .09, 0, 7); g.fill(); } g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(c0, c0, s * .07, 0, 7); g.fill(); }
    else if (k === 'hearts') { const c0 = s / 2, q = s * .3; g.beginPath(); g.moveTo(c0, c0 + q * .55); g.bezierCurveTo(c0 - q * 1.1, c0 - q * .2, c0 - q * .45, c0 - q * .95, c0, c0 - q * .35); g.bezierCurveTo(c0 + q * .45, c0 - q * .95, c0 + q * 1.1, c0 - q * .2, c0, c0 + q * .55); g.fill(); }
    else if (k === 'stars') { const c0 = s / 2; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .09 : s * .22, a = -Math.PI / 2 + i * Math.PI / 5; g[i ? 'lineTo' : 'moveTo'](c0 + Math.cos(a) * r, c0 + Math.sin(a) * r); } g.closePath(); g.fill(); }
    else if (k === 'zigzag') { g.lineWidth = s * .09; g.beginPath(); g.moveTo(0, s * .6); g.lineTo(s * .25, s * .35); g.lineTo(s * .5, s * .6); g.lineTo(s * .75, s * .35); g.lineTo(s, s * .6); g.stroke(); }
    return c; }
  const tileURL = (fab, size) => tileCanvas(fab, size || 64).toDataURL();
  async function paintGarment(cv, client, kind, fab, lk) { const img = await loadImg(asset('g_' + client + '_' + kind + '.webp', lk)); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const g = cv.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = g.createPattern(tileCanvas(fab, Math.round(img.naturalWidth / 9)), 'repeat'); g.fillRect(0, 0, cv.width, cv.height);
    g.globalCompositeOperation = 'multiply'; g.drawImage(img, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-over'; }

  /* ---------- the client ---------- */
  const C = { key: null, fig: null, meta: null, body: null, cv: {} };
  const lookPos = () => (A.meta && A.meta._look) || { podiumX: 0.5, podiumY: 0.78 };
  function figBox() { const L = lookPos(), m = C.meta; const w = H * m.aspect, cx = W * L.podiumX, bottom = L.podiumY * 100 + 2, top = bottom - H; return { cx, top, bottom, w, left: cx - w / 2, y: f => top + H * f, x: f => cx - w / 2 + w * f }; }
  /* the belt's rendered width is the waist across (kept kid-sized) and sets this client's cm scale; the skirt's rendered length and the beret's width use it */
  function bodyOf(m) { const g = m.g, wU = H * m.aspect, bw = (g.belt.x1 - g.belt.x0) * wU, raw = bw / (H / IMG_CM);
    const across = S.tier === 3 ? snapTo(clamp(raw, 5, 9), 0.2) : Math.round(clamp(raw, 5, 9)), pxcm = bw / across;
    const sk = g.skirt || g.circleSkirt, len = snap(clamp((sk.y1 - sk.y0) * H / pxcm, 4, 12));
    const headAcross = g.hat && S.tier === 3 ? snapTo(clamp((g.hat.x1 - g.hat.x0) * wU * 0.8 / pxcm, 4, 8), 0.2) : 0;
    return { across, round: snap(Math.PI * across), len, headAcross, pxcm }; }
  async function placeClient(key) { C.key = key; C.meta = A.meta[key]; C.body = bodyOf(C.meta); C.cv = {}; C.measuredRound = false; const b = figBox();
    const fig = el('div', 'figure'); fig.style.left = px(b.left); fig.style.top = px(b.top); fig.style.width = px(b.w); fig.style.height = px(H);
    const img = el('img', 'client'); img.src = asset(key + '.webp'); img.alt = ''; fig.appendChild(img); actors.appendChild(fig); C.fig = fig;
    fig.style.transform = 'translateX(' + px(T().dir === 'rtl' ? -90 : 90) + ')'; fig.style.opacity = '0'; await loadImg(img.src).catch(() => {});
    requestAnimationFrame(() => requestAnimationFrame(() => { fig.style.opacity = '1'; fig.style.transform = ''; })); await wait(1000); }
  function clientLeave() { if (!C.fig) return; const f = C.fig; f.style.transform = 'translateX(' + px(T().dir === 'rtl' ? 90 : -90) + ')'; f.style.opacity = '0'; setTimeout(() => f.remove(), 1000); C.fig = null; }
  async function wear(kind, fab, st) { let cv = C.cv[kind]; if (!cv) { cv = el('canvas', 'garment'); cv.style.zIndex = String(Z[kind]); C.fig.appendChild(cv); C.cv[kind] = cv; } await paintGarment(cv, C.key, kind, fab); fitStyle(kind, st || {}); cv.classList.remove('pop'); void cv.offsetWidth; cv.classList.add('pop'); }
  /* the body shows the fit: too long hangs, too short rides up, loose slips, tight will not close; a small hole sits high, a big one falls */
  function fitStyle(kind, st) { const cv = C.cv[kind]; if (!cv) return; const g = C.meta.g[kind], cx = ((g.x0 + g.x1) / 2 * 100).toFixed(1) + '%', top = (g.y0 * 100).toFixed(1) + '%', mid = ((g.y0 + g.y1) / 2 * 100).toFixed(1) + '%';
    cv.style.clipPath = ''; let tf = '', origin = cx + ' ' + top;
    const gap = h => { const x = (g.x0 + g.x1) / 2 * 100, y0 = g.y0 * 100, y1 = (g.y0 + (g.y1 - g.y0) * h) * 100; cv.style.clipPath = 'polygon(0 0, ' + (x - 0.2) + '% 0, ' + (x - 0.2) + '% ' + y0 + '%, ' + (x - 3.2) + '% ' + y0 + '%, ' + x + '% ' + y1 + '%, ' + (x + 3.2) + '% ' + y0 + '%, ' + (x + 0.2) + '% ' + y0 + '%, ' + (x + 0.2) + '% 0, 100% 0, 100% 100%, 0 100%)'; };
    if (kind === 'skirt' || kind === 'circleSkirt') { const sy = st.h != null ? clamp(st.h, 0.6, 1.45) : 1; tf += ' scaleY(' + sy.toFixed(3) + ')'; if (st.loose || st.holeBig) tf = ' translateY(6%)' + tf; if (st.tight || st.holeSmall) { tf = ' translateY(-3%) scaleX(.9)' + tf; gap(0.45); } }
    if (kind === 'belt') { if (st.loose) tf = ' translateY(2.5%) rotate(5deg)'; if (st.tight) gap(1); }
    if (kind === 'hat') { origin = cx + ' ' + mid; if (st.small) tf = ' translateY(-5%) scale(.72)'; if (st.big) tf = ' translateY(6%) scale(1.28)'; }
    cv.style.transformOrigin = origin; cv.style.transform = tf.trim(); }

  /* ---------- words, buttons, the pad, success ---------- */
  let bubble = null;
  function dock() { let d = $('.dock', ui); if (!d) { d = el('div', 'dock'); d.appendChild(el('div', 'actions')); ui.appendChild(d); } return d; }
  function say(txt, cls) { if (!bubble) { bubble = el('div', 'bubble'); dock().appendChild(bubble); } bubble.className = 'bubble' + (cls ? ' ' + cls : ''); bubble.textContent = txt; }
  function clearSay() { if (bubble) { bubble.remove(); bubble = null; } }
  function actions(list) { const box = $('.actions', dock()); box.replaceChildren(); return new Promise(res => { for (const [label, val, cls] of list) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = () => { box.replaceChildren(); res(val); }; box.appendChild(b); } }); }
  const next = () => actions([[t('next'), 1]]);
  function pad(decimals) { return new Promise(res => { let p = $('.pad', ui); if (p) p.remove(); p = el('div', 'pad'); const val = el('div', 'val'); const u = el('small', null, t('unitCm')); let s = ''; const show = () => val.replaceChildren(document.createTextNode(s || '0'), u); show(); p.appendChild(val);
    const keys = el('div', 'keys'); const add = (lbl, f, cls) => { const b = el('button', cls || '', lbl); b.type = 'button'; b.onclick = f; keys.appendChild(b); };
    for (const d of ['7', '8', '9', '4', '5', '6', '1', '2', '3']) add(d, () => { if (s.replace('.', '').length < 4) { s += d; show(); } });
    add(decimals ? '.' : '', decimals ? () => { if (!s.includes('.')) { s = (s || '0') + '.'; show(); } } : () => {}); add('0', () => { if (s.replace('.', '').length < 4) { s += '0'; show(); } }); add('⌫', () => { s = s.slice(0, -1); show(); });
    add('✓', () => { if (!s || s === '.') return; p.remove(); res(parseFloat(s)); }, 'go'); p.appendChild(keys); ui.appendChild(p); }); }
  const badPad = () => { const p = $('.pad', ui); if (p) { p.classList.add('bad'); setTimeout(() => p.classList.remove('bad'), 700); } };
  function burst(x, y, n) { const box = $('#burst'); for (let i = 0; i < (n || 20); i++) { const s = el('i'); const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 16; s.style.left = px(x); s.style.top = px(y); s.style.setProperty('--dx', px(Math.cos(a) * d)); s.style.setProperty('--dy', px(Math.sin(a) * d - 6)); s.style.background = ['#ffe7a8', '#f2c14e', '#ff9fd0', '#8fd3ff', '#9df09d'][i % 5]; box.appendChild(s); setTimeout(() => s.remove(), 1200); } }

  /* ---------- the stages of a piece, as chips; each one done is a small success ---------- */
  const STG = { keys: [], done: 0 };
  function stages(keys) { STG.keys = keys; STG.done = 0; drawStages(); }
  function drawStages() { let s = $('.stages', ui); if (!s) { s = el('div', 'stages'); ui.appendChild(s); } s.replaceChildren(); STG.keys.forEach((k, i) => s.appendChild(el('span', 'stg' + (i < STG.done ? ' done' : i === STG.done ? ' now' : ''), (i < STG.done ? '✓ ' : '') + t('stage.' + k)))); }
  async function stageDone(msg) { STG.done++; drawStages(); const all = $('.stages', ui) ? [...$('.stages', ui).children] : [], c = all[STG.done - 1], s = stage.getBoundingClientRect(); if (c) { const r = c.getBoundingClientRect(); burst((r.left + r.width / 2 - s.left) / s.height * 100, (r.top + r.height / 2 - s.top) / s.height * 100, 14); } say(msg || t('stageOk'), 'ok'); await wait(1200); }
  const clearStages = () => { const s = $('.stages', ui); if (s) s.remove(); };

  /* ---------- rulers, drawn exactly; 0 is marked in red ---------- */
  function mkRuler(root, x0, y, len, pxcm, h) { h = h || 9; const g = sv('g', { class: 'ruler' }), step = PREC[S.tier];
    g.appendChild(sv('rect', { x: x0 - 1.2 * h / 9, y, width: len * pxcm + 2.4 * h / 9, height: h, rx: 0.5 * h / 9, fill: 'url(#rulerTex)', stroke: '#6a4a2a', 'stroke-width': 0.03 * h }));
    const fs = Math.min(h * 0.36, pxcm * 0.78);
    for (let v = 0; v <= len + 1e-9; v = +(v + step).toFixed(2)) { const x = x0 + v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
      g.appendChild(sv('line', { x1: x, y1: y, x2: x, y2: y + h * (whole ? 0.44 : half ? 0.3 : 0.17), stroke: v === 0 ? '#c0302b' : '#2a1a0a', 'stroke-width': Math.min(h * (whole ? 0.036 : half ? 0.026 : 0.016), pxcm * (whole ? 0.06 : 0.04)) }));
      if (whole) { const tx = sv('text', { x, y: y + h * 0.88, 'font-size': fs, 'text-anchor': 'middle', fill: v === 0 ? '#c0302b' : '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(Math.round(v)); g.appendChild(tx); } }
    root.appendChild(g); return { g, x0, y, h, pxcm, len, X: cm => x0 + cm * pxcm }; }
  function bodyRuler(root, x, y, len, pxcm, vertical) { const th = 4.4, g = sv('g', { style: 'cursor:grab', class: 'ruler' }), step = PREC[S.tier];
    g.appendChild(sv('rect', vertical ? { x, y: y - 0.6, width: th, height: len * pxcm + 1.2, rx: 0.4, fill: '#f3e6c4', stroke: '#8a6a3a', 'stroke-width': 0.2 } : { x: x - 0.6, y, width: len * pxcm + 1.2, height: th, rx: 0.4, fill: '#f3e6c4', stroke: '#8a6a3a', 'stroke-width': 0.2 }));
    const fs = Math.min(th * 0.3, pxcm * 0.62);
    for (let v = 0; v <= len + 1e-9; v = +(v + step).toFixed(2)) { const P = v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6, L = th * (whole ? 0.42 : half ? 0.28 : 0.16), w = whole ? 0.16 : half ? 0.11 : 0.05;
      g.appendChild(sv('line', Object.assign(vertical ? { x1: x, y1: y + P, x2: x + L, y2: y + P } : { x1: x + P, y1: y, x2: x + P, y2: y + L }, { stroke: v === 0 ? '#c0302b' : '#2a1a0a', 'stroke-width': w })));
      if (whole) { const tx = sv('text', Object.assign(vertical ? { x: x + th * 0.93, y: y + P + fs * 0.35, 'text-anchor': 'end' } : { x: x + P, y: y + th * 0.88, 'text-anchor': 'middle' }, { 'font-size': fs, fill: v === 0 ? '#c0302b' : '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 })); tx.textContent = String(Math.round(v)); g.appendChild(tx); } }
    root.appendChild(g); return g; }

  /* ---------- readings: zoom into the very ruler on screen ---------- */
  async function readTable(R, value, prompt, topY) { const span = SPAN[S.tier] * R.pxcm, top = topY != null ? topY : R.y - 2, cy = (top + R.y + R.h) / 2, w = Math.max(span, (R.y + R.h - top + 3) * W / 100);
    await zoomVB(R.X(value), cy, w, 900); say(prompt); let miss = 0;
    for (;;) { window.__answer = value; const v = await pad(S.tier > 1); if (same(v, value)) { say(t('readYes', { n: fmt(value) }), 'ok'); await wait(900); await zoomOut(700); return miss === 0; }
      miss++; badPad(); if (miss === 1) say(t('readNo', { v: fmt(v) }) + ' ' + t('hint1'), 'bad'); else { await zoomVB(R.X(value), cy, w * 0.6, 600); say(t('readNo', { v: fmt(v) }) + ' ' + t('hint2'), 'bad'); } } }
  async function readBody(x, y, value, prompt) { await camTo(x, y, READZ[S.tier], 900); say(prompt); let miss = 0;
    for (;;) { window.__answer = value; const v = await pad(S.tier > 1); if (same(v, value)) { say(t('readYes', { n: fmt(value) }), 'ok'); await wait(900); return miss === 0; }
      miss++; badPad(); if (miss === 1) say(t('readNo', { v: fmt(v) }) + ' ' + t('hint1'), 'bad'); else { await camTo(x, y, READZ[S.tier] * 1.6, 600); say(t('readNo', { v: fmt(v) }) + ' ' + t('hint2'), 'bad'); } } }

  /* ---------- measuring the body ---------- */
  const clearOverlay = () => overlay.replaceChildren();
  function pulse(root, cx, cy, r) { const p = sv('circle', { cx, cy, r, fill: 'none', stroke: '#ffe7a8', 'stroke-width': r * 0.17 }); p.appendChild(sv('animate', { attributeName: 'r', values: r + ';' + (r * 1.7) + ';' + r, dur: '1.4s', repeatCount: 'indefinite' })); p.appendChild(sv('animate', { attributeName: 'opacity', values: '1;0;1', dur: '1.4s', repeatCount: 'indefinite' })); root.appendChild(p); return p; }
  const dashed = (root, x1, y1, x2, y2, col, w) => { w = w || 0.45; const l = sv('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': w, 'stroke-dasharray': w * 2.2 + ' ' + w * 1.3, 'stroke-linecap': 'round' }); root.appendChild(l); return l; };
  async function tapeRound() { const b = figBox(), g = C.meta.g.belt, yc = b.y(g.y0 + (g.y1 - g.y0) / 2), rx = b.w * (g.x1 - g.x0) / 2 + 0.6, ry = Math.max(1.2, rx * 0.22), cx = b.x((g.x0 + g.x1) / 2);
    await camTo(cx, yc + 6, 2.0); say(t('tapeWaist', { name: cname() }));
    const grp = sv('g'); overlay.appendChild(grp); const path = sv('path', { fill: 'none', stroke: '#f6c84a', 'stroke-width': 1.3, 'stroke-linecap': 'round' }), ticks = sv('path', { fill: 'none', stroke: '#6a4a10', 'stroke-width': 1.3, 'stroke-dasharray': '0.12 0.75' });
    const start = { x: cx - rx, y: yc }, ring = pulse(grp, start.x, start.y, 2.6), handle = sv('circle', { cx: start.x, cy: start.y, r: 2.6, fill: '#ff6aa8', stroke: '#fff', 'stroke-width': 0.5, style: 'cursor:grab' }); grp.append(path, ticks, handle);
    let sum = 0, last = null, closed = false; const arcD = a => { let d = ''; const n = Math.max(2, Math.round(Math.abs(a) / 4)); for (let i = 0; i <= n; i++) { const th = Math.PI + (a * Math.PI / 180) * i / n; d += (i ? 'L' : 'M') + (cx + rx * Math.cos(th)).toFixed(2) + ' ' + (yc + ry * Math.sin(th)).toFixed(2) + ' '; } return d; };
    geo({ kind: 'tape', c: w2s(cx, yc), rx: rx * CAM.z, ry: ry * CAM.z });
    await new Promise(res => drag(handle, 'world', (p, first) => { if (closed) return; const deg = (Math.atan2((p.y - yc) / ry, (p.x - cx) / rx) * 180 / Math.PI + 360) % 360; if (last != null && !first) { let d = deg - last; if (d < -180) d += 360; if (d > 180) d -= 360; sum = clamp(sum + d, -360, 360); } last = deg;
        path.setAttribute('d', arcD(sum)); ticks.setAttribute('d', arcD(sum)); const th = Math.PI + sum * Math.PI / 180; handle.setAttribute('cx', cx + rx * Math.cos(th)); handle.setAttribute('cy', yc + ry * Math.sin(th)); ring.remove();
        if (Math.abs(sum) >= 345) { closed = true; path.setAttribute('d', arcD(360)); handle.setAttribute('cx', start.x); handle.setAttribute('cy', start.y); setTimeout(res, 400); } }, () => { if (!closed) say(t('tapeOpen'), 'bad'); }));
    nogeo(); say(t('tapeDone'), 'ok'); await wait(1300); clearOverlay(); }
  /* a ruler on the body: drag it so its red 0 sits on the red line; then zoom in on the blue line and read */
  async function rulerOnBody(which) { const b = figBox(), m = C.meta, gk = m.g.circleSkirt || m.g.skirt, pxcm = C.body.pxcm; let a, endLine, endPt, vertical, value, prompt, read;
    if (which === 'len') { const yW = b.y(gk.y0), yK = yW + C.body.len * pxcm, xr = b.x(gk.x1) + 2; vertical = true; value = C.body.len; prompt = t('rulerLen'); read = t('readLen');
      await camTo(b.cx, (yW + yK) / 2, 1.7); dashed(overlay, b.x(gk.x0) - 2, yW, xr + 7, yW, '#e8343a'); endLine = dashed(overlay, b.x(gk.x0) - 2, yK, xr + 7, yK, '#3a7aff'); a = { x: xr, y: yW }; endPt = { x: xr + 2.2, y: yK }; }
    else { const head = which === 'head', gg = head ? m.g.hat : m.g.belt, yc = head ? b.y(gg.y0 + (gg.y1 - gg.y0) * 0.75) : b.y(gg.y0 + (gg.y1 - gg.y0) / 2), half = (head ? C.body.headAcross : C.body.across) * pxcm / 2, cx = b.x((gg.x0 + gg.x1) / 2);
      vertical = false; value = head ? C.body.headAcross : C.body.across; prompt = t(head ? 'rulerHead' : 'rulerAcross', { name: cname() }); read = t('readAcross');
      await camTo(cx, yc + 3, 2.1); dashed(overlay, cx - half, yc - 5, cx - half, yc + 7, '#e8343a'); endLine = dashed(overlay, cx + half, yc - 5, cx + half, yc + 7, '#3a7aff'); a = { x: cx - half, y: yc + 1.5 }; endPt = { x: cx + half, y: yc + 3.7 }; }
    endLine.setAttribute('opacity', 0); say(prompt); const off0 = vertical ? 9 : -8, start = vertical ? { x: a.x, y: a.y + off0 } : { x: a.x + off0, y: a.y };
    const gr = bodyRuler(overlay, start.x, start.y, vertical ? 13 : 11, pxcm, vertical); const grab = vertical ? { x: start.x + 2.2, y: start.y + 3 } : { x: start.x + 3, y: start.y + 2.2 }; const ring = pulse(overlay, grab.x, grab.y, 2.6);
    geo({ kind: 'drag', from: w2s(grab.x, grab.y), to: w2s(vertical ? grab.x : grab.x - off0, vertical ? grab.y - off0 : grab.y) });
    let pos = 0, offset = 0, ok = false; const set = v => { pos = v; gr.setAttribute('transform', vertical ? 'translate(0 ' + v.toFixed(3) + ')' : 'translate(' + v.toFixed(3) + ' 0)'); };
    await new Promise(res => drag(gr, 'world', (p, first) => { if (ok) return; ring.remove(); const q = vertical ? p.y : p.x; if (first) offset = q - pos; set(clamp(q - offset, -Math.abs(off0) - 14, Math.abs(off0) + 14)); }, () => { if (ok) return; if (Math.abs(pos + off0) <= 0.45 * pxcm) { ok = true; set(-off0); say(t('zeroOk'), 'ok'); setTimeout(res, 800); } else say(t('zeroNo'), 'bad'); }));
    nogeo(); endLine.setAttribute('opacity', 1); await wait(500); const first = await readBody(endPt.x, endPt.y, value, read); await camTo(0, 0, 1, 600); clearOverlay(); return first; }

  /* ---------- the cutting table ---------- */
  function tableOn(on) { stage.classList.toggle('atTable', on); if (!on) { table.replaceChildren(); VB.x = 0; VB.y = 0; VB.w = W; VB.h = 100; setVB(); } }
  function tableBase(fab) { table.replaceChildren(); VB.x = 0; VB.y = 0; VB.w = W; VB.h = 100; setVB(); const defs = sv('defs'); table.appendChild(defs);
    const tex = (id, href, w, h) => { const p = sv('pattern', { id, patternUnits: 'userSpaceOnUse', width: w, height: h }); p.appendChild(sv('image', { href, width: w, height: h, preserveAspectRatio: 'none' })); defs.appendChild(p); };
    tex('rulerTex', asset('rulertex.webp'), 30, 9); tex('tapeTex', asset('tapetex.webp'), 24, 3.4); if (fab) tex('fabTex', tileURL(fab, 64), 8, 8);
    table.appendChild(sv('image', { href: asset('table.webp'), x: 0, y: 0, width: W, height: 100, preserveAspectRatio: 'xMidYMid slice' })); }
  async function toTable(fab) { clearOverlay(); await camTo(0, 0, 1, 400); tableBase(fab); tableOn(true); await wait(450); }
  async function leaveTable() { if (!stage.classList.contains('atTable')) return; await zoomOut(400); tableOn(false); }
  function straightLayout(maxCm) { const RW = Math.max(10, Math.ceil(maxCm + 2)), x0 = 14, pxcm = (W - 28) / RW; return mkRuler(table, x0, 60, RW, pxcm, 9); }
  function tapeStrip(R, fromCm, toCm, y, h, col) { const g = sv('g', { class: 'slide' }); g.appendChild(sv('rect', { x: R.X(fromCm), y, width: (toCm - fromCm) * R.pxcm, height: h, fill: col || 'url(#tapeTex)', stroke: '#8a6a10', 'stroke-width': 0.2 }));
    g.appendChild(sv('rect', { x: R.X(toCm) - 0.35, y: y - 0.4, width: 0.7, height: h + 0.8, rx: 0.25, fill: '#8a4a10' })); table.appendChild(g); return g; }
  function slideIn(g, dx, dy) { g.style.transform = 'translate(' + px(dx) + ',' + px(dy) + ')'; g.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transition = 'transform .9s cubic-bezier(.3,1,.4,1), opacity .5s'; g.style.transform = 'translate(0,0)'; g.style.opacity = '1'; })); return wait(1000); }
  function pinFlag(x, y, label) { const g = sv('g', { class: 'pin' }); g.appendChild(sv('line', { x1: x, y1: y, x2: x, y2: y - 6, stroke: '#a83a5a', 'stroke-width': 0.4 })); g.appendChild(sv('circle', { cx: x, cy: y, r: 0.8, fill: '#e8545c' }));
    g.appendChild(sv('rect', { x: x + 0.2, y: y - 10.5, width: 9, height: 5, rx: 0.8, fill: '#fffaf0', stroke: '#a83a5a', 'stroke-width': 0.3 })); const tx = sv('text', { x: x + 4.7, y: y - 6.9, 'font-size': 3.2, 'text-anchor': 'middle', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = label; g.appendChild(tx); table.appendChild(g); return g; }
  function pulseT(cx, cy, r) { const g = sv('g'); pulse(g, cx, cy, r); table.appendChild(g); return g; }
  /* chalk a straight piece: drag to the place (the chalk carries no number), take a close look and set it exactly, then the scissors */
  async function chalkAndCut(R, y0, h, target, maxCm, msg) { say(msg); const line = sv('line', { x1: R.X(0), y1: y0, x2: R.X(0), y2: y0 + h, stroke: '#fff', 'stroke-width': 0.6, 'stroke-dasharray': '1.1 0.7', opacity: 0 }); table.appendChild(line);
    const chalk = sv('image', { href: asset('chalk.webp'), width: 9, height: 9, x: R.X(0) - 4.5, y: y0 - 10, style: 'cursor:grab' }); table.appendChild(chalk); const ring = pulseT(R.X(0), y0 - 5.5, 4);
    let at = 0, cw = 9; const setAt = cm => { at = clamp(snap(cm), 0, maxCm); chalk.setAttribute('x', R.X(at) - cw / 2); line.setAttribute('x1', R.X(at)); line.setAttribute('x2', R.X(at)); line.setAttribute('opacity', at > 0 ? 1 : 0); };
    window.__target = target; geo({ kind: 'drag', from: t2s(R.X(0), y0 - 5.5), to: t2s(R.X(target), y0 - 5.5), chalk: true, pxcm: R.pxcm * W / VB.w });
    drag(chalk, 'table', p => { ring.remove(); setAt((p.x - R.x0) / R.pxcm); }, () => {});
    await new Promise(res => { const iv = setInterval(() => { if (at > 0) { clearInterval(iv); res(); } }, 150); }); nogeo();
    await actions([[t('closer'), 1]]); const top = y0 + h - 11, bot = R.y + R.h + 1.5; await zoomVB(R.X(at), (top + bot) / 2 + (bot - top) * 0.22, (bot - top) * W / 100 * 1.2, 800); cw = 9 * VB.w / W; chalk.setAttribute('width', cw); chalk.setAttribute('height', cw); chalk.setAttribute('y', y0 + h - cw * 0.95); line.setAttribute('stroke-width', 0.6 * VB.w / W); line.setAttribute('stroke-dasharray', ''); setAt(at); say(t('fineTune'));
    geo({ kind: 'drag', from: t2s(R.X(at), y0 - 5.5), to: t2s(R.X(target), y0 - 5.5), fine: true }); await actions([[t('cut'), 1]]); nogeo(); await zoomOut(600);
    chalk.remove(); say(t('cutGo')); const xx = R.X(at), sc = sv('image', { href: asset('scissors.webp'), width: 13, height: 13, x: xx - 6.5, y: y0 - 14, style: 'cursor:grab' }); table.appendChild(sc); const r2 = pulseT(xx, y0 - 7.5, 4.6);
    geo({ kind: 'drag', from: t2s(xx, y0 - 7.5), to: t2s(xx, y0 + h + 3), steps: 10 });
    await new Promise(res => { let done = false; drag(sc, 'table', p => { if (done) return; r2.remove(); sc.setAttribute('y', clamp(p.y - 6.5, y0 - 14, y0 + h - 6.5)); line.setAttribute('stroke', '#ffe08a'); if (p.y >= y0 + h * 0.85) { done = true; res(); } }, () => { if (!done) sc.setAttribute('y', y0 - 14); }); });
    nogeo(); sc.remove(); return { at, line }; }

  /* ---------- circles on the cloth ---------- */
  const CIR = { cx: 0, cy: 0, pxcm: 2, side: 0, R: null };
  function circleLayout(sideCm) { CIR.pxcm = Math.min(3.4, 62 / (sideCm + 1)); CIR.side = sideCm; CIR.cx = W * 0.4; CIR.cy = 46; const s = sideCm * CIR.pxcm;
    const sq = sv('rect', { x: CIR.cx - s / 2, y: CIR.cy - s / 2, width: s, height: s, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.25, class: 'cloth slide' }); table.appendChild(sq); return sq; }
  async function compassPin() { const cx = CIR.cx, cy = CIR.cy; table.appendChild(sv('path', { d: 'M' + (cx - 1.8) + ' ' + cy + ' h3.6 M' + cx + ' ' + (cy - 1.8) + ' v3.6', stroke: '#fff', 'stroke-width': 0.4 }));
    const comp = sv('g', { style: 'cursor:grab' }); comp.appendChild(sv('image', { href: asset('compass.webp'), x: -5.5, y: -13, width: 11, height: 13 })); const sx = cx + CIR.side * CIR.pxcm / 2 + 16, sy = cy + 8; comp.setAttribute('transform', 'translate(' + sx + ' ' + sy + ')'); table.appendChild(comp); const ring = pulseT(sx, sy - 6, 4.5);
    geo({ kind: 'drag', from: t2s(sx, sy - 6), to: t2s(cx, cy - 6) }); let qx = sx, qy = sy;
    await new Promise(res => drag(comp, 'table', p => { ring.remove(); qx = p.x; qy = p.y + 6; comp.setAttribute('transform', 'translate(' + qx + ' ' + qy + ')'); }, () => { if (Math.hypot(qx - cx, qy - cy) < 4.5) { comp.remove(); res(); } else say(t('pinNo'), 'bad'); })); nogeo();
    table.appendChild(sv('circle', { cx, cy, r: 0.9, fill: '#3a3a4a' })); }
  /* the ruler slides in with its red 0 on the pin */
  async function rulerFromPin(lenCm) { const g = sv('g', { class: 'slide' }); table.appendChild(g); const h = Math.max(3.4, CIR.pxcm * 1.6); const R = mkRuler(g, CIR.cx, CIR.cy + 0.8, lenCm, CIR.pxcm, h); CIR.R = R; await slideIn(g, 30, 0); return R; }
  /* open the compass along the ruler (the knob carries no number), take a close look and set it exactly, then it swings round and draws */
  async function openAndDraw(target, msg) { const R = CIR.R, py = CIR.cy; say(msg); const legs = sv('path', { fill: 'none', stroke: '#3a3a4a', 'stroke-width': 0.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); table.appendChild(legs);
    const mark = sv('line', { x1: R.X(1), y1: py - 1, x2: R.X(1), y2: R.y + R.h * 0.5, stroke: '#ff3a8a', 'stroke-width': 0.25 }); table.appendChild(mark); const knob = sv('circle', { cx: R.X(1), cy: py - 2.2, r: 1.8, fill: 'rgba(255,106,168,.85)', stroke: '#fff', 'stroke-width': 0.4, style: 'cursor:grab' }); table.appendChild(knob); const ring = pulseT(R.X(1), py - 2.2, 1.8);
    let open = 1, k = 1; const set = v => { open = clamp(snap(v), PREC[S.tier], R.len); const x = R.X(open); knob.setAttribute('cx', x); mark.setAttribute('x1', x); mark.setAttribute('x2', x); legs.setAttribute('d', 'M' + CIR.cx + ' ' + py + ' L' + ((CIR.cx + x) / 2) + ' ' + (py - 8 * k) + ' L' + x + ' ' + py); }; set(1);
    window.__target = target; geo({ kind: 'drag', from: t2s(R.X(1), py - 2.2), to: t2s(R.X(target), py - 2.2), compass: true });
    let moved = false; drag(knob, 'table', p => { moved = true; ring.remove(); set((p.x - R.x0) / R.pxcm); }, () => {});
    await new Promise(res => { const iv = setInterval(() => { if (moved) { clearInterval(iv); res(); } }, 150); }); nogeo();
    await actions([[t('closer'), 1]]); await zoomVB(R.X(open), R.y + R.h * 0.5, Math.max(SPAN[S.tier] * R.pxcm * 1.4, (R.h + 4) * W / 100), 800); k = VB.w / W; knob.setAttribute('r', 1.8 * k); knob.setAttribute('cy', py - 2.6 * k); knob.setAttribute('stroke-width', 0.4 * k); mark.setAttribute('stroke-width', 0.3 * k); mark.setAttribute('y1', py - 0.8 * k); legs.setAttribute('stroke-width', 0.9 * k); set(open); say(t('fineTuneCompass'));
    geo({ kind: 'drag', from: t2s(R.X(open), py - 2.6 * k), to: t2s(R.X(target), py - 2.6 * k), fine: true }); await actions([[t('draw'), 1]]); nogeo(); await zoomOut(700); k = 1; mark.remove(); knob.setAttribute('r', 1.8); knob.setAttribute('stroke-width', 0.4); legs.setAttribute('stroke-width', 0.9);
    const rr = open * R.pxcm, c = sv('circle', { cx: CIR.cx, cy: CIR.cy, r: rr, fill: 'none', stroke: '#fff', 'stroke-width': 0.5 }), len = 2 * Math.PI * rr; c.setAttribute('stroke-dasharray', len + ' ' + len); c.setAttribute('stroke-dashoffset', len); table.appendChild(c);
    await new Promise(res => { const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / 1700), a = -k * Math.PI * 2, x = CIR.cx + Math.cos(a) * rr, y = CIR.cy + Math.sin(a) * rr; knob.setAttribute('cx', x); knob.setAttribute('cy', y); legs.setAttribute('d', 'M' + CIR.cx + ' ' + CIR.cy + ' L' + ((CIR.cx + x) / 2) + ' ' + ((CIR.cy + y) / 2 - 7) + ' L' + x + ' ' + y); c.setAttribute('stroke-dashoffset', len * (1 - k)); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    c.setAttribute('stroke-dasharray', '1 0.6'); c.setAttribute('stroke-dashoffset', 0); knob.remove(); legs.remove(); return { open, c, rr }; }
  async function cutRound(rr, msg) { say(msg || t('cutRound')); const sc = sv('image', { href: asset('scissors.webp'), width: 10, height: 10, x: CIR.cx + rr - 5, y: CIR.cy - 5, style: 'cursor:grab' }); table.appendChild(sc); const ring = pulseT(CIR.cx + rr, CIR.cy, 3.6);
    geo({ kind: 'round', c: t2s(CIR.cx, CIR.cy), R: rr * W / VB.w });
    await new Promise(res => { let cov = 0, lastA = null, done = false; drag(sc, 'table', (p, first) => { if (done) return; ring.remove(); const a = Math.atan2(p.y - CIR.cy, p.x - CIR.cx); if (lastA != null && !first) { let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; cov += Math.abs(d); } lastA = a; sc.setAttribute('x', CIR.cx + rr * Math.cos(a) - 5); sc.setAttribute('y', CIR.cy + rr * Math.sin(a) - 5); if (cov >= Math.PI * 1.75) { done = true; res(); } }, () => {}); });
    nogeo(); sc.remove(); }

  /* ---------- the lessons: worked examples on the same ruler and cloth ---------- */
  async function lessonRuler() { if (S.lessons['ruler' + S.tier]) return; await toTable({ col: '#8fd0f0', kind: 'dots' }); const R = straightLayout(10); stages(['lesson']);
    const band = sv('rect', { x: R.X(0), y: R.y - 0.4, width: R.pxcm, height: R.h + 0.8, fill: 'rgba(255,90,140,.35)' }); table.appendChild(band); await zoomVB(R.X(1.5), R.y + 4, 5 * R.pxcm, 800); say(t('lr1')); await next();
    band.remove(); await zoomOut(600); const rib = tapeStrip(R, 0, 4, R.y - 3.6, 3.4, '#ff8fb8'); await slideIn(rib, -10, -10); const lb = pinFlag(R.X(4), R.y - 4, '4'); say(t('lr2')); await next();
    rib.remove(); lb.remove(); if (S.tier >= 2) { const v = S.tier === 2 ? 6.5 : 6.3; const mk = sv('path', { d: 'M' + R.X(v) + ' ' + (R.y - 0.4) + ' l -0.7 -1.4 h 1.4 z', fill: '#3a7aff' }); table.appendChild(mk); await zoomVB(R.X(v), R.y + 3.5, (S.tier === 2 ? 3 : 1.6) * R.pxcm, 900); say(t(S.tier === 2 ? 'lr3half' : 'lr3mm')); await next(); mk.remove(); await zoomOut(600); }
    say(t('lrEnd'), 'ok'); await wait(1300); S.lessons['ruler' + S.tier] = true; save(); await leaveTable(); clearStages(); }
  async function lessonCircle() { if (S.lessons.circle) return; await toTable({ col: '#8fd0f0', kind: 'dots' }); stages(['lesson']); circleLayout(12); const cx = CIR.cx, cy = CIR.cy, r = 3;
    table.appendChild(sv('circle', { cx, cy, r: 0.9, fill: '#3a3a4a' })); say(t('lc1')); await next();
    const R = await rulerFromPin(7); const rad = sv('line', { x1: cx, y1: cy - 0.4, x2: R.X(r), y2: cy - 0.4, stroke: '#e8343a', 'stroke-width': 0.7 }); table.appendChild(rad); await zoomVB(R.X(1.8), cy + 1.5, 6 * R.pxcm, 800); say(t('lc2', { n: r })); await next(); await zoomOut(600);
    const rr = r * R.pxcm; table.appendChild(sv('circle', { cx, cy, r: rr, fill: 'none', stroke: '#fff', 'stroke-width': 0.5, 'stroke-dasharray': '1 0.6' })); for (const a of [2.2, 3.6, 5]) table.appendChild(sv('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * rr, y2: cy + Math.sin(a) * rr, stroke: '#e8343a', 'stroke-width': 0.45 })); say(t('lc3', { n: r })); await next();
    table.appendChild(sv('line', { x1: cx - rr, y1: cy - 1.4, x2: cx + rr, y2: cy - 1.4, stroke: '#3a7aff', 'stroke-width': 0.7 })); say(t('lc4', { n: r, d: 2 * r })); await next();
    say(t('lc5')); await next(); S.lessons.circle = true; save(); await leaveTable(); clearStages(); }

  /* ---------- pieces: straight (skirt, belt) ---------- */
  async function straightPiece(kind, fab) { const B = C.body, extra = kind === 'skirt' ? 2 : 3, needW = snap(B.round + extra), got = { w: null, h: null };
    stages(kind === 'skirt' ? ['measure', 'seam', 'cut', 'length', 'cutLength', 'sew', 'wear'] : ['measure', 'buckle', 'cut', 'buckleOn', 'wear']);
    /* 1 · round the waist; the tape laid flat on the table; read it */
    if (!C.measuredRound) { await tapeRound(); C.measuredRound = true; } else { say(t('tapeAgain', { name: cname() })); await wait(1400); }
    await toTable(fab); let R = straightLayout(needW + 1); say(t('layTape')); const tape = tapeStrip(R, 0, B.round, R.y - 3.6, 3.4); await slideIn(tape, -20, -20); await readTable(R, B.round, t('readTape'), R.y - 5); await stageDone(t('ok.measure'));
    /* 2 · the extra for the seam or the buckle, a piece at the end; read the new end */
    say(t(kind === 'skirt' ? 'addSeam' : 'addBuckle')); const ex = tapeStrip(R, B.round, needW, R.y - 3.6, 3.4, '#ff9fc6'); await slideIn(ex, 10, -16); await wait(400); await readTable(R, needW, t('readEnd'), R.y - 5); await stageDone(t(kind === 'skirt' ? 'ok.seam' : 'ok.buckle'));
    /* 3 · the cloth comes off the roll; chalk at the end; cut */
    const yF = 34, hF = 20; tape.style.opacity = '0.5'; ex.style.opacity = '0.5'; const cloth = sv('rect', { x: R.X(0), y: yF, width: (W - 8) - R.X(0), height: hF, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.25, class: 'slide' }); table.insertBefore(cloth, R.g); say(t('clothIn')); await slideIn(cloth, 40, 0);
    pinFlag(R.X(needW), yF, fmt(needW)); let cut = await chalkAndCut(R, yF, hF, needW, R.len, t('chalkEnd')); got.w = cut.at; cloth.setAttribute('width', got.w * R.pxcm); cut.line.remove(); await stageDone(t('ok.cut'));
    if (kind === 'skirt') {
      /* 4 · the length, on the body; 5 · cut it on the strip, turned */
      await leaveTable(); await rulerOnBody('len'); await stageDone(t('ok.length'));
      await toTable(fab); R = straightLayout(B.len + 5); const strip = sv('rect', { x: R.X(0), y: 34, width: (B.len + 4) * R.pxcm, height: 20, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.25, class: 'slide' }); table.insertBefore(strip, R.g); say(t('turned')); await slideIn(strip, 0, -30); await wait(600);
      pinFlag(R.X(B.len), 34, fmt(B.len)); cut = await chalkAndCut(R, 34, 20, B.len, B.len + 4, t('chalkLen')); got.h = cut.at; strip.setAttribute('width', got.h * R.pxcm); cut.line.remove(); await stageDone(t('ok.cutLength'));
      /* 6 · sew the side: the needle runs down the seam */
      const sx = R.X(got.h) - 1, seam = dashed(table, sx, 34, sx, 54, '#ffffff', 0.45); const nd = sv('circle', { cx: sx, cy: 32.5, r: 2.2, fill: '#c0c8d8', stroke: '#fff', 'stroke-width': 0.4, style: 'cursor:grab' }); table.appendChild(nd); const ring = pulseT(sx, 32.5, 2.2); say(t('sew'));
      geo({ kind: 'drag', from: t2s(sx, 32.5), to: t2s(sx, 55), steps: 10 });
      await new Promise(res => { let done = false; drag(nd, 'table', p => { if (done) return; ring.remove(); nd.setAttribute('cy', clamp(p.y, 32.5, 54)); seam.setAttribute('stroke', '#ffe08a'); if (p.y >= 52) { done = true; res(); } }, () => {}); }); nogeo(); nd.remove(); await stageDone(t('ok.sew'));
    } else {
      /* 4 · the buckle goes on the end */
      const bx = R.X(got.w), bk = sv('image', { href: asset('coin.webp'), x: W - 24, y: 20, width: 8, height: 8, style: 'cursor:grab' }); table.appendChild(bk); const ring = pulseT(W - 20, 24, 4.5); say(t('buckleOn'));
      geo({ kind: 'drag', from: t2s(W - 20, 24), to: t2s(bx - 2, 44) }); await new Promise(res => drag(bk, 'table', p => { ring.remove(); bk.setAttribute('x', p.x - 4); bk.setAttribute('y', p.y - 4); }, p => { if (Math.abs(p.x - bx) < 8 && p.y > 30 && p.y < 58) { bk.setAttribute('x', bx - 5); bk.setAttribute('y', 40); res(); } else say(t('buckleNo'), 'bad'); })); nogeo(); await stageDone(t('ok.buckleOn')); }
    return { needW, got }; }

  /* ---------- pieces: circles (circle skirt, beret) ---------- */
  async function circlePiece(kind, fab) { const B = C.body, D = kind === 'hat' ? B.headAcross : B.across, r = snap(D / 2), R = kind === 'hat' ? r : snap(r + B.len), side = snap(2 * R + 1), got = {};
    stages(kind === 'hat' ? ['across', 'radius', 'cloth', 'pin', 'circle', 'wear'] : ['across', 'radius', 'length', 'outer', 'cloth', 'pin', 'circle', 'hole', 'wear']);
    /* 1 · the width across, on the body */
    await rulerOnBody(kind === 'hat' ? 'head' : 'across'); await stageDone(t('ok.across'));
    /* 2 · fold the width in half: the radius */
    await toTable(fab); let Rl = straightLayout(Math.max(D, R) + 1); const y = Rl.y - 2.4; say(t('widthLine')); const wl = sv('line', { x1: Rl.X(0), y1: y, x2: Rl.X(D), y2: y, stroke: '#3a7aff', 'stroke-width': 1, 'stroke-linecap': 'round' }); table.appendChild(wl); await wait(1400);
    say(t('foldIt')); const end = sv('circle', { cx: Rl.X(D), cy: y, r: 2.2, fill: '#3a7aff', stroke: '#fff', 'stroke-width': 0.4, style: 'cursor:grab' }); table.appendChild(end); const ring = pulseT(Rl.X(D), y, 2.2);
    geo({ kind: 'drag', from: t2s(Rl.X(D), y), to: t2s(Rl.X(0), y), steps: 12 });
    await new Promise(res => { let done = false; drag(end, 'table', p => { if (done) return; ring.remove(); const cm = clamp((p.x - Rl.x0) / Rl.pxcm, 0, D); end.setAttribute('cx', Rl.X(cm)); wl.setAttribute('x2', Rl.X((D + cm) / 2)); if (cm <= 0.6) { done = true; res(); } }, () => { if (!done) { end.setAttribute('cx', Rl.X(D)); wl.setAttribute('x2', Rl.X(D)); } }); });
    nogeo(); end.remove(); wl.setAttribute('x2', Rl.X(r)); table.appendChild(sv('path', { d: 'M' + Rl.X(r) + ' ' + (y - 0.9) + ' l -0.9 -1.8 h 1.8 z', fill: '#3a7aff' })); await readTable(Rl, r, t('readFold'), y - 3.5); await stageDone(t('ok.radius'));
    if (kind !== 'hat') {
      /* 3 · the length from the waist to the knee; 4 · laid after the radius: the big radius */
      await leaveTable(); await rulerOnBody('len'); await stageDone(t('ok.length'));
      await toTable(fab); Rl = straightLayout(Math.max(D, R) + 1); const y2 = Rl.y - 2.4; table.appendChild(sv('line', { x1: Rl.X(0), y1: y2, x2: Rl.X(r), y2: y2, stroke: '#3a7aff', 'stroke-width': 1, 'stroke-linecap': 'round' })); pinFlag(Rl.X(r), y2 - 2, fmt(r));
      say(t('layLength')); const lt = tapeStrip(Rl, r, R, y2 - 1.7, 3.4); await slideIn(lt, 10, -16); await readTable(Rl, R, t('readEnd'), y2 - 4); await stageDone(t('ok.outer'));
    }
    /* 5 · the cloth: a square as wide as two big radii and a little more; cut it off the roll */
    await leaveTable(); await toTable(fab); Rl = straightLayout(side + 1); const yF = 34, hF = 20;
    say(t('twoRadii', { n: fmt(R) })); const t1 = tapeStrip(Rl, 0, R, Rl.y - 3.6, 3.4), t2 = tapeStrip(Rl, R, 2 * R, Rl.y - 3.6, 3.4); await slideIn(t1, -16, -12); await slideIn(t2, 10, -12); await readTable(Rl, snap(2 * R), t('readTwo'), Rl.y - 5);
    const extraP = tapeStrip(Rl, 2 * R, side, Rl.y - 3.6, 3.4, '#ff9fc6'); say(t('plusOne')); await slideIn(extraP, 10, -12); await readTable(Rl, side, t('readEnd'), Rl.y - 5);
    t1.style.opacity = t2.style.opacity = extraP.style.opacity = '0.5'; const cloth = sv('rect', { x: Rl.X(0), y: yF, width: (W - 8) - Rl.X(0), height: hF, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.25, class: 'slide' }); table.insertBefore(cloth, Rl.g); say(t('clothIn')); await slideIn(cloth, 40, 0);
    pinFlag(Rl.X(side), yF, fmt(side)); const ct = await chalkAndCut(Rl, yF, hF, side, Rl.len, t('chalkCloth')); got.side = ct.at; await stageDone(t('ok.cloth'));
    /* 6 · the cloth square on the table, the compass pin in its centre */
    await zoomOut(300); tableBase(fab); const sq = circleLayout(Math.max(got.side, 2)); say(t('clothOnTable')); await slideIn(sq, 0, 20); say(t('pinIt')); await compassPin(); await stageDone(t('ok.pin'));
    /* 7 · the big circle (or the beret): the ruler from the pin, open the compass to the radius, swing, cut */
    say(t('rulerFromPin')); await rulerFromPin(Math.ceil(R + 2)); const big = await openAndDraw(R, t(kind === 'hat' ? 'openHat' : 'openOuter')); got.outer = big.open; await cutRound(big.rr); sq.style.transition = 'opacity .6s'; sq.style.opacity = '0'; big.c.setAttribute('fill', 'url(#fabTex)'); big.c.setAttribute('stroke-dasharray', ''); big.c.setAttribute('stroke', 'rgba(0,0,0,.35)'); await stageDone(t('ok.circle'));
    if (kind !== 'hat') { /* 8 · the hole: open the compass to the small radius, swing, cut */
      const hole = await openAndDraw(r, t('openHole')); got.hole = hole.open; await cutRound(hole.rr, t('cutHole')); hole.c.setAttribute('fill', '#6b4426'); hole.c.setAttribute('stroke-dasharray', ''); await stageDone(t('ok.hole')); }
    return { r, R, got }; }

  /* ---------- judging, fixing ---------- */
  function judgeStraight(kind, res) { const st = {}, d = res.got.w - res.needW; if (d > TOL[S.tier]) st.loose = true; if (d < -TOL[S.tier]) st.tight = true; if (kind === 'skirt') { st.h = res.got.h / C.body.len; const dh = res.got.h - C.body.len; if (dh > TOL[S.tier]) st.long = true; if (dh < -TOL[S.tier]) st.short = true; } return st; }
  function judgeCircle(kind, res) { const st = {}; if (kind === 'hat') { const d = res.got.outer - res.r; if (d > TOL[S.tier]) st.big = true; if (d < -TOL[S.tier]) st.small = true; return st; }
    const dh = res.got.hole - res.r, dl = (res.got.outer - res.got.hole) - (res.R - res.r); if (dh > TOL[S.tier]) st.holeBig = true; if (dh < -TOL[S.tier]) st.holeSmall = true; st.h = (res.got.outer - res.got.hole) / (res.R - res.r); if (dl > TOL[S.tier]) st.long = true; if (dl < -TOL[S.tier]) st.short = true; return st; }
  const badOf = st => st.tight ? 'tight' : st.loose ? 'loose' : st.holeSmall ? 'holeSmall' : st.holeBig ? 'holeBig' : st.small ? 'hatSmall' : st.big ? 'hatBig' : st.long ? 'long' : st.short ? 'short' : null;
  async function fixStraight(kind, fab, res, st) { const B = C.body;
    if (st.loose || st.tight) { await toTable(fab); const R = straightLayout(Math.max(res.got.w, res.needW) + 1); const cloth = sv('rect', { x: R.X(0), y: 34, width: (st.tight ? (W - 8) - R.X(0) : res.got.w * R.pxcm), height: 20, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.25 }); table.insertBefore(cloth, R.g);
      if (st.tight) { S.coins = Math.max(0, S.coins - 1); hud(); } pinFlag(R.X(res.needW), 34, fmt(res.needW)); const c = await chalkAndCut(R, 34, 20, res.needW, st.tight ? R.len : res.got.w, t(st.tight ? 'chalkEnd' : 'trimTo')); res.got.w = c.at; await leaveTable(); }
    if (kind === 'skirt' && (st.long || st.short)) { await toTable(fab); const R = straightLayout(B.len + 5); const strip = sv('rect', { x: R.X(0), y: 34, width: (st.short ? B.len + 4 : res.got.h) * R.pxcm, height: 20, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.25 }); table.insertBefore(strip, R.g);
      if (st.short) { S.coins = Math.max(0, S.coins - 1); hud(); } pinFlag(R.X(B.len), 34, fmt(B.len)); const c = await chalkAndCut(R, 34, 20, B.len, st.short ? B.len + 4 : res.got.h, t(st.short ? 'chalkLen' : 'trimTo')); res.got.h = c.at; await leaveTable(); } }
  async function fixCircle(kind, fab, res, st) { const onlyHole = st.holeSmall && !st.long && !st.short; if (!onlyHole) { S.coins = Math.max(0, S.coins - 1); hud(); }
    await toTable(fab); const sq = circleLayout(snap(2 * res.R + 1)); table.appendChild(sv('circle', { cx: CIR.cx, cy: CIR.cy, r: 0.9, fill: '#3a3a4a' })); pinFlag(CIR.cx + 2, CIR.cy - 6, fmt(onlyHole ? res.r : res.R)); await rulerFromPin(Math.ceil(res.R + 2));
    if (onlyHole) { sq.style.opacity = '0'; const ring = sv('circle', { cx: CIR.cx, cy: CIR.cy, r: res.got.outer * CIR.pxcm, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.25 }); table.insertBefore(ring, CIR.R.g.parentNode); const h = await openAndDraw(res.r, t('openHole')); res.got.hole = h.open; await cutRound(h.rr, t('cutHole')); }
    else { const big = await openAndDraw(kind === 'hat' ? res.r : res.R, t(kind === 'hat' ? 'openHat' : 'openOuter')); res.got.outer = big.open; await cutRound(big.rr); if (kind !== 'hat') { const h = await openAndDraw(res.r, t('openHole')); res.got.hole = h.open; await cutRound(h.rr, t('cutHole')); } }
    await leaveTable(); }

  /* ---------- fabric picker, HUD, order card, wardrobe ---------- */
  function swatchEl(fab) { const d = el('div', 'sw'); d.style.backgroundImage = 'url(' + tileURL(fab, 48) + ')'; return d; }
  function pickFabric(label) { return new Promise(res => { const sh = el('div', 'picker'); const card = el('div', 'card'); card.appendChild(el('h3', null, t('fabricPick', { piece: label }))); const cur = { col: pick(COLOURS), kind: pick(KINDS) };
    const prev = el('div', 'preview'), cols = el('div', 'row cols'), kinds = el('div', 'row kinds');
    const draw = () => { prev.replaceChildren(swatchEl(cur)); cols.replaceChildren(); kinds.replaceChildren();
      for (const c of COLOURS) { const b = el('button', c === cur.col ? 'on' : ''); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', c); b.onclick = () => { cur.col = c; draw(); }; cols.appendChild(b); }
      for (const k of KINDS) { const b = el('button', k === cur.kind ? 'on' : ''); b.type = 'button'; b.title = t('patterns.' + k); b.appendChild(swatchEl({ col: cur.col, kind: k })); b.onclick = () => { cur.kind = k; draw(); }; kinds.appendChild(b); } };
    draw(); const go = el('button', 'btn big', t('thisOne')); go.type = 'button'; go.onclick = () => { sh.remove(); res({ col: cur.col, kind: cur.kind }); }; card.append(el('p', null, t('colours')), cols, el('p', null, t('patternsWord')), kinds, prev, go); sh.appendChild(card); ui.appendChild(sh); }); }
  function hud() { let h = $('.hud', ui); if (!h) { h = el('div', 'hud'); ui.appendChild(h); } h.replaceChildren(); const L = el('div', 'chips'), R = el('div', 'chips');
    const coin = el('span', 'chip'); const ci = el('img'); ci.src = asset('coin.webp'); ci.alt = ''; coin.append(ci, document.createTextNode(String(S.coins))); L.append(coin, el('span', 'chip', '★ ' + S.rep));
    const wd = el('button', 'btn ghost', t('wardrobe')); wd.onclick = openCloset; const lg = el('button', 'btn ghost', t('lang')); lg.onclick = () => { S.lang = S.lang === 'he' ? 'en' : 'he'; save(); location.reload(); }; R.append(wd, lg); h.append(L, R); }
  function orderCard(kinds, done) { let o = $('.order', ui); if (!o) { o = el('div', 'order'); ui.appendChild(o); } o.replaceChildren();
    for (const k of kinds) { const it = el('div', 'item' + (done.includes(k) ? ' done' : '')), ic = el('div', 'ico'), g = C.meta.g[k], gw = g.x1 - g.x0, gh = (g.y1 - g.y0) / C.meta.aspect, f = 0.86 / Math.max(gw, gh);
      ic.style.backgroundImage = 'url(' + asset('g_' + C.key + '_' + k + '.webp') + ')'; ic.style.backgroundSize = (f * 100).toFixed(1) + '% auto';
      const Iw = f, Ih = f / C.meta.aspect, bx = Iw === 1 ? 0 : (0.5 - (g.x0 + g.x1) / 2 * Iw) / (1 - Iw), by = (0.5 - (g.y0 + g.y1) / 2 * Ih) / (1 - Ih); ic.style.backgroundPosition = (bx * 100).toFixed(1) + '% ' + (by * 100).toFixed(1) + '%';
      it.append(ic, el('span', null, pname(k) + (done.includes(k) ? ' ✓' : ''))); o.appendChild(it); } }
  const clearOrder = () => { const o = $('.order', ui); if (o) o.remove(); };
  async function outfitCanvas(o) { const img = await loadImg(asset(o.client + '.webp', o.look)); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    for (const p of o.pieces.slice().sort((a, b) => Z[a.kind] - Z[b.kind])) { const cv = document.createElement('canvas'); await paintGarment(cv, o.client, p.kind, p.fab, o.look); g.drawImage(cv, 0, 0); } return c; }
  async function openCloset() { let c = $('.closet', ui); if (c) { c.remove(); return; } c = el('div', 'closet'); const top = el('div', 'closetTop'); const back = el('button', 'btn ghost', t('back')); back.onclick = () => c.remove(); top.appendChild(back); c.appendChild(top); ui.appendChild(c);
    if (!S.wardrobe.length) { c.appendChild(el('p', null, t('wardrobeEmpty'))); return; } const grid = el('div', 'grid'); c.appendChild(grid);
    for (const o of S.wardrobe.slice().reverse()) { const it = el('div', 'item'); grid.appendChild(it); try { it.appendChild(await outfitCanvas(o)); } catch (e) {} it.appendChild(el('small', null, t('wardrobeOf', { name: t('client.' + o.client), d: o.day }))); } }

  /* ---------- one client ---------- */
  async function makeAndWear(kind, fab) { const circle = kind === 'circleSkirt' || kind === 'hat'; const res = circle ? await circlePiece(kind, fab) : await straightPiece(kind, fab);
    for (;;) { await leaveTable(); clearOverlay(); const b = figBox(), g = C.meta.g[kind]; say(t('done', { piece: pname(kind) }), 'ok'); await camTo(b.cx, b.y((g.y0 + g.y1) / 2), kind === 'hat' ? 1.7 : 1.3, 700); await wait(400);
      const st = circle ? judgeCircle(kind, res) : judgeStraight(kind, res); await wear(kind, fab, st); burst(W / 2, 45, 30); const bad = badOf(st);
      if (!bad) { STG.done = STG.keys.length; drawStages(); say(t('fit.perfect', { piece: pname(kind) }), 'ok'); await wait(2000); return; }
      say(t('fit.' + bad, { piece: pname(kind) }) + ' ' + t(['loose', 'long', 'hatBig', 'holeSmall'].includes(bad) ? 'fixTrim' : 'fixRecut'), 'bad'); await actions([[t('fix'), 1]]);
      const cv = C.cv[kind]; if (cv) { cv.remove(); delete C.cv[kind]; } if (circle) await fixCircle(kind, fab, res, st); else await fixStraight(kind, fab, res, st); } }
  async function serve() { const key = CLIENTS[(S.seen++) % CLIENTS.length]; save(); clearOverlay(); tableOn(false);
    await placeClient(key); const kinds = ORDER[S.tier], done = [], pieces = []; orderCard(kinds, done);
    const names = kinds.map(k => t('aPiece.' + k)); say(t('wish.' + key, { pieces: names.length > 1 ? names.slice(0, -1).join(', ') + ' ' + t('and') + names[names.length - 1] : names[0] })); await next();
    await lessonRuler();
    for (const kind of kinds) { if (kind === 'circleSkirt' || kind === 'hat') await lessonCircle(); const fab = await pickFabric(pname(kind)); await makeAndWear(kind, fab); pieces.push({ kind, fab }); done.push(kind); orderCard(kinds, done); clearStages(); await camTo(0, 0, 1, 500); }
    const pay = kinds.length * 3; S.coins += pay; S.rep++; hud(); const b = figBox(); await camTo(b.cx, b.top + H * 0.5, 1.15, 600); burst(W / 2, 35, 30);
    say(t('paid', { name: cname(), c: pay }) + ' ' + t('star'), 'ok'); S.wardrobe.push({ client: key, look: S.look, day: S.day, pieces }); S.day++; save();
    await actions([[t('nextClient'), 1]]); say(t('happy')); await camTo(0, 0, 1); clientLeave(); clearOrder(); await wait(1200); clearSay(); }

  /* ---------- start ---------- */
  function startSheet() { return new Promise(res => { const sh = el('div', 'sheet'); const card = el('div', 'card'); card.appendChild(el('h1', null, t('title'))); card.appendChild(el('p', null, t('subtitle')));
    const name = el('input'); name.placeholder = t('yourName'); name.value = S.name || ''; card.appendChild(name); card.appendChild(el('p', 'q', t('howOld')));
    const ages = el('div', 'row'); let age = S.age; for (let a = 4; a <= 15; a++) { const b = el('button', a === age ? 'on' : '', a === 15 ? '15+' : String(a)); b.type = 'button'; b.onclick = () => { age = a; [...ages.children].forEach(x => x.classList.toggle('on', x === b)); }; ages.appendChild(b); } card.appendChild(ages);
    const langs = el('div', 'row'); for (const [id, lbl] of [['he', 'עברית'], ['en', 'English']]) { const b = el('button', id === S.lang ? 'on' : '', lbl); b.type = 'button'; b.onclick = () => { S.lang = id; S.name = name.value.trim() || S.name; S.age = age; save(); location.reload(); }; langs.appendChild(b); } card.appendChild(langs);
    const go = el('button', 'btn big', t('open')); go.type = 'button'; go.onclick = () => { S.name = name.value.trim() || S.name || '?'; S.age = age; S.tier = age <= 6 ? 1 : age <= 10 ? 2 : 3; S.look = age <= 6 ? 'felt' : 'nature'; save(); sh.remove(); res(); }; card.appendChild(go); sh.appendChild(card); ui.appendChild(sh); }); }
  async function main() { load(); $('#ver').textContent = 'v' + VERSION; document.documentElement.lang = S.lang; document.documentElement.dir = T().dir; document.title = t('title') + ' · Kingdom Quest';
    await startSheet(); await loadLook(); hud();
    for (;;) { loopPlay(true); say(t('waiting')); await actions([[t('ring'), 1, 'big']]); loopPlay(false); clearSay(); await serve(); } }
  window.AT = { S, t, get W() { return W; }, get cam() { return CAM; }, get C() { return C; }, get VB() { return VB; } };
  main();
})();
