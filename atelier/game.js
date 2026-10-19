/* Kingdom Quest — סדנת אומן / the Atelier, v3 (Yoni 2026-10-19 on v2: 'that dress, it's nothing like the same level ... it's not built in the same concept
   as the other game ... everything you create, you have to immediately show so the kid will see progress ... a lot of data dump ... break it down
   step by step and show everything that you're doing. You can't just expect people to do it in their head.')
   v3, built on the Doll Studio's concept (shared/studio.js): one piece at a time, and the piece goes onto the client the moment it is cut.
   · The garments are rendered ON each client at the client's own art level (Gemini edit of the filmed client, white cloth), cut out as a shading
     layer, and coloured at run time: a Doll Studio colour × a Doll Studio pattern, multiplied by the rendered folds.
   · No notebook, no rules list, nothing to hold in the head: every number the kid types is READ off something on screen. The tape that went round
     the waist is laid flat on the fabric and read; the seam is a piece added at its end and the new end is read; the width line is folded in half
     by the kid and the fold is read; the length is laid after the radius and its end is read. Then chalk, scissors or compass, and onto the client.
   · The body judges the fit (too long hangs, too tight will not close, a small hole will not go on) and the kid fixes it on the spot.
   Tiers: 1 (to 6) felt, whole cm, skirt + belt; 2 (7–10) nature-tech, half cm, circle skirt + belt; 3 (11+) nature-tech, mm, circle skirt + belt + hat. */
(function () {
  'use strict';
  const VERSION = 3;
  const $ = (s, r) => (r || document).querySelector(s), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const NS = 'http://www.w3.org/2000/svg', sv = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a || {}) e.setAttribute(k, a[k]); return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms)), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.floor(Math.random() * a.length)];
  const stage = $('#stage'), world = $('#world'), scene = $('#scene'), overlay = $('#overlay'), table = $('#table'), tableBg = $('#tableBg'), ui = $('#ui'), actors = $('#actors');
  const PREC = { 1: 1, 2: 0.5, 3: 0.1 }, TOL = { 1: 0.4, 2: 0.3, 3: 0.06 }, H = 58, IMG_CM = 30;
  const CLIENTS = ['girl', 'boy', 'grandma', 'bear', 'fox', 'princess'];
  /* the Doll Studio's colours and patterns (shared/studio.js PASTEL, FAB), plus red, navy, stars and zigzag */
  const COLOURS = ['#ff8fb8', '#8fd0f0', '#c0a0ff', '#ffcf6a', '#7fdcb0', '#ff9f90', '#e8545c', '#5a78c8'];
  const KINDS = ['plain', 'dots', 'stripes', 'gingham', 'flowers', 'hearts', 'stars', 'zigzag'];
  const ORDER = { 1: ['skirt', 'belt'], 2: ['circleSkirt', 'belt'], 3: ['circleSkirt', 'belt', 'hat'] };
  const Z = { circleSkirt: 1, skirt: 1, belt: 2, hat: 3 };

  /* ---------- state ---------- */
  const S = { lang: 'he', look: 'felt', tier: 1, name: '', age: 6, coins: 10, rep: 0, day: 1, wardrobe: [], seen: 0 };
  const KEY = 'kq_atelier_v3';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.name) { Object.assign(S, j); return; } for (const k of ['kq_atelier_v2', 'kq_atelier_v1']) { const o = JSON.parse(localStorage.getItem(k) || 'null'); if (o && o.name) { S.name = o.name; S.age = o.age || 6; S.lang = o.lang || 'he'; break; } } } catch (e) {} }
  const T = () => window.AT_STR[S.lang] || window.AT_STR.en;
  const look = (o, k) => k.split('.').reduce((a, p) => (a && a[p] != null ? a[p] : null), o);
  const t = (k, v) => { let s = look(T(), k); if (s == null) s = look(window.AT_STR.en, k); if (s == null) s = k; return String(s).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m)); };
  const snapTo = (v, p) => +(Math.round(v / p) * p).toFixed(2), snap = v => snapTo(v, PREC[S.tier]);
  const fmt = v => { const r = Math.round(v * 10) / 10; return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(1); };
  const same = (a, b, tol) => Math.abs(a - b) <= (tol != null ? tol : PREC[S.tier] / 4) + 1e-6;

  /* ---------- the stage (1u = 1 % of its height) and the camera on the world layer ---------- */
  let W = 177.78;
  const px = v => 'calc(var(--u) * ' + (+v).toFixed(3) + ' * 1px)';
  function measureStage() { const r = stage.getBoundingClientRect(); W = 100 * r.width / r.height; stage.style.setProperty('--u', (r.height / 100).toFixed(4)); for (const s of [overlay, table]) s.setAttribute('viewBox', '0 0 ' + W.toFixed(3) + ' 100'); }
  window.addEventListener('resize', () => { measureStage(); applyCam(0); }); measureStage();
  const CAM = { z: 1, tx: 0, ty: 0 };
  function applyCam(ms) { world.style.transition = ms ? 'transform ' + ms + 'ms cubic-bezier(.4,0,.2,1)' : 'none'; world.style.transform = 'translate(' + px(CAM.tx) + ', ' + px(CAM.ty) + ') scale(' + CAM.z + ')'; scene.style.filter = CAM.z > 1.05 ? 'blur(3px) brightness(.85)' : ''; }
  function camTo(fx, fy, z, ms) { ms = ms == null ? 750 : ms; let tx = W / 2 - fx * z, ty = 50 - fy * z; if (z <= 1) { z = 1; tx = 0; ty = 0; } tx = clamp(tx, W - W * z, 0); ty = clamp(ty, 100 - 100 * z, 0); Object.assign(CAM, { z, tx, ty }); applyCam(ms); return wait(ms + 40); }
  const w2s = (x, y) => ({ x: CAM.tx + x * CAM.z, y: CAM.ty + y * CAM.z });
  const spt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.height * 100, y: (e.clientY - r.top) / r.height * 100 }; };
  const wpt = e => { const s = spt(e); return { x: (s.x - CAM.tx) / CAM.z, y: (s.y - CAM.ty) / CAM.z }; };
  function drag(elm, space, onMove, onEnd) { let on = false; const P = e => (space === 'world' ? wpt(e) : spt(e));
    elm.addEventListener('pointerdown', e => { on = true; try { elm.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); onMove(P(e), true); });
    elm.addEventListener('pointermove', e => { if (on) onMove(P(e), false); });
    const up = e => { if (!on) return; on = false; if (onEnd) onEnd(P(e)); }; elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up); }

  /* ---------- assets ---------- */
  const A = { meta: {}, img: {} };
  const asset = (n, lk) => 'assets/' + (lk || S.look) + '/' + n;
  const loadImg = src => A.img[src] || (A.img[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
  async function loadLook() { $('#poster').src = asset('shop.webp'); $('#loop').src = asset('shop.mp4'); tableBg.src = asset('table.webp'); try { A.meta = await (await fetch(asset('meta.json'))).json(); } catch (e) { A.meta = {}; } }
  function loopPlay(on) { const v = $('#loop'); if (on) { v.currentTime = 0; v.play().then(() => v.classList.add('on')).catch(() => {}); } else { v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 900); } }
  document.addEventListener('visibilitychange', () => { const v = $('#loop'); if (document.hidden) v.pause(); else if (v.classList.contains('on')) v.play().catch(() => {}); });

  /* ---------- fabric: a colour with a pattern, as a tile ---------- */
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
  /* paint a garment: the colour and pattern, multiplied by the rendered folds, cut to the garment's shape */
  async function paintGarment(cv, client, kind, fab, lk) { const img = await loadImg(asset('g_' + client + '_' + kind + '.webp', lk)); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const g = cv.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = g.createPattern(tileCanvas(fab, Math.round(img.naturalWidth / 9)), 'repeat'); g.fillRect(0, 0, cv.width, cv.height);
    g.globalCompositeOperation = 'multiply'; g.drawImage(img, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-over'; }

  /* ---------- the client on the podium, and the garments on the client ---------- */
  const C = { key: null, fig: null, meta: null, body: null, cv: {} };
  const lookPos = () => (A.meta && A.meta._look) || { podiumX: 0.5, podiumY: 0.78 };
  function figBox() { const L = lookPos(), m = C.meta; const w = H * m.aspect, cx = W * L.podiumX, bottom = L.podiumY * 100 + 2, top = bottom - H; return { cx, top, bottom, w, left: cx - w / 2, y: f => top + H * f, x: f => cx - w / 2 + w * f }; }
  /* the body's sizes: the belt's rendered width is the waist across (kept in a kid-sized range), which sets this client's own cm scale;
     the skirt's rendered length and the beret's width are read with the same scale, so the marks on the body sit on the rendered garments */
  function bodyOf(m) { const g = m.g, wU = H * m.aspect, bw = (g.belt.x1 - g.belt.x0) * wU, raw = bw / (H / IMG_CM);
    const across = S.tier === 1 ? Math.round(clamp(raw, 5, 9)) : S.tier === 2 ? Math.round(clamp(raw, 5, 9)) : snapTo(clamp(raw, 5, 9), 0.2), pxcm = bw / across;
    const sk = g.skirt || g.circleSkirt, len = snap(clamp((sk.y1 - sk.y0) * H / pxcm, 4, 13));
    const headAcross = g.hat ? snapTo(clamp((g.hat.x1 - g.hat.x0) * wU * 0.8 / pxcm, 4, 9), 0.2) : 0;
    return { across, round: snap(Math.PI * across), len, headAcross, pxcm }; }
  async function placeClient(key) { C.key = key; C.meta = A.meta[key]; C.body = bodyOf(C.meta); C.cv = {}; const b = figBox();
    const fig = el('div', 'figure'); fig.style.left = px(b.left); fig.style.top = px(b.top); fig.style.width = px(b.w); fig.style.height = px(H);
    const img = el('img', 'client'); img.src = asset(key + '.webp'); img.alt = ''; fig.appendChild(img); actors.appendChild(fig); C.fig = fig;
    fig.style.transform = 'translateX(' + px(T().dir === 'rtl' ? -90 : 90) + ')'; fig.style.opacity = '0'; await loadImg(img.src).catch(() => {});
    requestAnimationFrame(() => requestAnimationFrame(() => { fig.style.opacity = '1'; fig.style.transform = ''; })); await wait(1000); }
  function clientLeave() { if (!C.fig) return; const f = C.fig; f.style.transform = 'translateX(' + px(T().dir === 'rtl' ? 90 : -90) + ')'; f.style.opacity = '0'; setTimeout(() => f.remove(), 1000); C.fig = null; }
  async function garmentOn(kind, fab, state) { let cv = C.cv[kind]; if (!cv) { cv = el('canvas', 'garment'); cv.style.zIndex = String(Z[kind]); C.fig.appendChild(cv); C.cv[kind] = cv; } await paintGarment(cv, C.key, kind, fab); fitStyle(kind, state || { ghost: true }); }
  /* how the body shows a fit: the transform keeps the garment's own art; too long hangs, too short rides up, loose slips, tight will not close */
  function fitStyle(kind, st) { const cv = C.cv[kind]; if (!cv) return; const g = C.meta.g[kind], cx = ((g.x0 + g.x1) / 2 * 100).toFixed(1) + '%', top = (g.y0 * 100).toFixed(1) + '%', mid = ((g.y0 + g.y1) / 2 * 100).toFixed(1) + '%';
    cv.classList.toggle('ghost', !!st.ghost); cv.style.clipPath = ''; let tf = '', origin = cx + ' ' + top;
    const gap = h => { const x = (g.x0 + g.x1) / 2 * 100, y0 = g.y0 * 100, y1 = (g.y0 + (g.y1 - g.y0) * h) * 100; cv.style.clipPath = 'polygon(0 0, ' + (x - 0.2) + '% 0, ' + (x - 0.2) + '% ' + y0 + '%, ' + (x - 3.2) + '% ' + y0 + '%, ' + x + '% ' + y1 + '%, ' + (x + 3.2) + '% ' + y0 + '%, ' + (x + 0.2) + '% ' + y0 + '%, ' + (x + 0.2) + '% 0, 100% 0, 100% 100%, 0 100%)'; };
    if (kind === 'skirt' || kind === 'circleSkirt') { const sy = st.long ? 1.3 : st.h != null ? clamp(st.h, 0.6, 1.45) : 1; tf += ' scaleY(' + sy.toFixed(3) + ')'; if (st.loose || st.holeBig) tf = ' translateY(6%)' + tf; if (st.tight || st.holeSmall) { tf = ' translateY(-3%) scaleX(.9)' + tf; gap(0.45); } }
    if (kind === 'belt') { if (st.loose) tf = ' translateY(2.5%) rotate(5deg)'; if (st.tight) gap(1); }
    if (kind === 'hat') { origin = cx + ' ' + mid; if (st.small) tf = ' translateY(-5%) scale(.72)'; if (st.big) tf = ' translateY(6%) scale(1.28)'; }
    cv.style.transformOrigin = origin; cv.style.transform = tf.trim(); }
  function pop(kind) { const cv = C.cv[kind]; if (!cv) return; cv.classList.remove('pop'); void cv.offsetWidth; cv.classList.add('pop'); }

  /* ---------- words, buttons, the number pad ---------- */
  let bubble = null;
  function dock() { let d = $('.dock', ui); if (!d) { d = el('div', 'dock'); d.appendChild(el('div', 'actions')); ui.appendChild(d); } return d; }
  function say(txt, cls) { if (!bubble) { bubble = el('div', 'bubble'); dock().appendChild(bubble); } bubble.className = 'bubble' + (cls ? ' ' + cls : ''); bubble.textContent = txt; }
  function clearSay() { if (bubble) { bubble.remove(); bubble = null; } }
  function actions(list) { const box = $('.actions', dock()); box.replaceChildren(); return new Promise(res => { for (const [label, val, cls] of list) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = () => { box.replaceChildren(); res(val); }; box.appendChild(b); } }); }
  function pad(decimals) { return new Promise(res => { let p = $('.pad', ui); if (p) p.remove(); p = el('div', 'pad'); const val = el('div', 'val'); const u = el('small', null, t('unitCm')); let s = ''; const show = () => val.replaceChildren(document.createTextNode(s || '0'), u); show(); p.appendChild(val);
    const keys = el('div', 'keys'); const add = (lbl, f, cls) => { const b = el('button', cls || '', lbl); b.type = 'button'; b.onclick = f; keys.appendChild(b); };
    for (const d of ['7', '8', '9', '4', '5', '6', '1', '2', '3']) add(d, () => { if (s.replace('.', '').length < 4) { s += d; show(); } });
    add(decimals ? '.' : '', decimals ? () => { if (!s.includes('.')) { s = (s || '0') + '.'; show(); } } : () => {}); add('0', () => { if (s.replace('.', '').length < 4) { s += '0'; show(); } }); add('⌫', () => { s = s.slice(0, -1); show(); });
    add('✓', () => { if (!s || s === '.') return; p.remove(); res(parseFloat(s)); }, 'go'); p.appendChild(keys); ui.appendChild(p); }); }
  const badPad = () => { const p = $('.pad', ui); if (p) { p.classList.add('bad'); setTimeout(() => p.classList.remove('bad'), 700); } };
  function burst(x, y) { const box = $('#burst'); for (let i = 0; i < 20; i++) { const s = el('i'); const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 16; s.style.left = px(x); s.style.top = px(y); s.style.setProperty('--dx', px(Math.cos(a) * d)); s.style.setProperty('--dy', px(Math.sin(a) * d - 6)); s.style.background = ['#ffe7a8', '#f2c14e', '#ff9fd0', '#8fd3ff', '#9df09d'][i % 5]; box.appendChild(s); setTimeout(() => s.remove(), 1200); } }

  /* ---------- the magnifier: a big strip of tape or ruler around the place to read ---------- */
  function magnifier(kind, value, shown) { let r = $('.readout', ui); if (!r) { r = el('div', 'readout'); r.appendChild(el('canvas')); ui.appendChild(r); } r.classList.toggle('side', !stage.classList.contains('atTable'));
    const c = $('canvas', r), dpr = Math.min(2, window.devicePixelRatio || 1), base = parseFloat(getComputedStyle(stage).fontSize), w = 27 * base, h = 6.2 * base; c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = kind === 'tape' ? '#f6d86a' : '#f6ecd0'; g.fillRect(0, 0, w, h);
    const center = Math.max(shown / 2 - 0.4, value - shown * (0.15 + Math.random() * 0.2)), left = center - shown / 2, pxcm = w / shown, step = S.tier === 3 ? 0.1 : S.tier === 2 ? 0.5 : 1;
    for (let v = Math.ceil((left - 1e-9) / step) * step; v <= left + shown + 1e-9; v = +(v + step).toFixed(3)) { if (v < -1e-9) continue; const X = (v - left) * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
      g.strokeStyle = '#2a1a0a'; g.lineWidth = whole ? 3.5 : half ? 2.2 : 1.3; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, whole ? h * .46 : half ? h * .32 : h * .2); g.stroke();
      if (whole) { g.fillStyle = '#2a1a0a'; g.font = '800 ' + Math.round(h * .36) + 'px Assistant, sans-serif'; g.textAlign = 'center'; g.fillText(String(Math.round(v)), X, h * .9); } }
    const X = (value - left) * pxcm; if (kind === 'tape') { g.fillStyle = 'rgba(176,120,32,.4)'; g.fillRect(0, 0, X, h); g.fillStyle = '#8a4a10'; g.fillRect(X - 3, 0, 6, h); } else { g.fillStyle = '#3a7aff'; g.fillRect(X - 3, 0, 6, h); }
    return r; }
  const clearMag = () => { const r = $('.readout', ui); if (r) r.remove(); };
  /* read a number until it is right: hints, a closer look, never the answer */
  async function askRead(prompt, value, kind) { const shown = S.tier === 3 ? 3 : S.tier === 2 ? 6 : 8; magnifier(kind, value, shown); say(prompt); let miss = 0;
    for (;;) { window.__answer = value; const v = await pad(S.tier > 1); if (same(v, value)) { say(t('readYes', { n: fmt(value) }), 'ok'); await wait(1100); clearMag(); return miss === 0; }
      miss++; badPad(); if (miss === 1) say(t('readNo', { v: fmt(v) }) + ' ' + t('hint1'), 'bad'); else { magnifier(kind, value, shown / 2); say(t('readNo', { v: fmt(v) }) + ' ' + t('hint2'), 'bad'); } } }

  /* ---------- measuring on the body ---------- */
  const clearOverlay = () => overlay.replaceChildren();
  function pulse(root, cx, cy, r) { const p = sv('circle', { cx, cy, r, fill: 'none', stroke: '#ffe7a8', 'stroke-width': 0.45 }); p.appendChild(sv('animate', { attributeName: 'r', values: r + ';' + (r * 1.7) + ';' + r, dur: '1.4s', repeatCount: 'indefinite' })); p.appendChild(sv('animate', { attributeName: 'opacity', values: '1;0;1', dur: '1.4s', repeatCount: 'indefinite' })); root.appendChild(p); return p; }
  const dashed = (root, x1, y1, x2, y2, col) => { const l = sv('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': 0.45, 'stroke-dasharray': '1 0.6', 'stroke-linecap': 'round' }); root.appendChild(l); return l; };
  /* the tape round the waist: drag the pink end all the way round; it closes */
  async function tapeRound() { const b = figBox(), g = C.meta.g.belt, yc = b.y(g.y0 + (g.y1 - g.y0) / 2), rx = b.w * (g.x1 - g.x0) / 2 + 0.6, ry = Math.max(1.2, rx * 0.22), cx = b.x((g.x0 + g.x1) / 2);
    await camTo(cx, yc + 6, 2.0); say(t('tapeWaist', { name: t('client.' + C.key) }));
    const grp = sv('g'); overlay.appendChild(grp); const path = sv('path', { fill: 'none', stroke: '#f6c84a', 'stroke-width': 1.3, 'stroke-linecap': 'round' }), ticks = sv('path', { fill: 'none', stroke: '#6a4a10', 'stroke-width': 1.3, 'stroke-dasharray': '0.12 0.75' });
    const start = { x: cx - rx, y: yc }, ring = pulse(grp, start.x, start.y, 2.6), handle = sv('circle', { cx: start.x, cy: start.y, r: 2.6, fill: '#ff6aa8', stroke: '#fff', 'stroke-width': 0.5, style: 'cursor:grab' }); grp.append(path, ticks, handle);
    let sum = 0, last = null, closed = false; const arcD = a => { let d = ''; const n = Math.max(2, Math.round(Math.abs(a) / 4)); for (let i = 0; i <= n; i++) { const th = Math.PI + (a * Math.PI / 180) * i / n; d += (i ? 'L' : 'M') + (cx + rx * Math.cos(th)).toFixed(2) + ' ' + (yc + ry * Math.sin(th)).toFixed(2) + ' '; } return d; };
    window.__geo = { kind: 'tape', c: w2s(cx, yc), rx: rx * CAM.z, ry: ry * CAM.z };
    await new Promise(res => drag(handle, 'world', (p, first) => { if (closed) return; const deg = (Math.atan2((p.y - yc) / ry, (p.x - cx) / rx) * 180 / Math.PI + 360) % 360; if (last != null && !first) { let d = deg - last; if (d < -180) d += 360; if (d > 180) d -= 360; sum = clamp(sum + d, -360, 360); } last = deg;
        path.setAttribute('d', arcD(sum)); ticks.setAttribute('d', arcD(sum)); const th = Math.PI + sum * Math.PI / 180; handle.setAttribute('cx', cx + rx * Math.cos(th)); handle.setAttribute('cy', yc + ry * Math.sin(th)); ring.remove();
        if (Math.abs(sum) >= 345) { closed = true; path.setAttribute('d', arcD(360)); handle.setAttribute('cx', start.x); handle.setAttribute('cy', start.y); setTimeout(res, 400); } }, () => { if (!closed) say(t('tapeOpen'), 'bad'); }));
    window.__geo = null; say(t('tapeDone'), 'ok'); await wait(1200); clearOverlay(); }
  function rulerSVG(root, x, y, len, pxcm, vertical, opt) { opt = opt || {}; const grp = sv('g', { style: 'cursor:grab' }), th = opt.thick || 4.4;
    grp.appendChild(sv('rect', vertical ? { x, y: y - 0.6, width: th, height: len * pxcm + 1.2, rx: 0.4, fill: '#f3e6c4', stroke: '#8a6a3a', 'stroke-width': 0.25 } : { x: x - 0.6, y, width: len * pxcm + 1.2, height: th, rx: 0.4, fill: '#f3e6c4', stroke: '#8a6a3a', 'stroke-width': 0.25 }));
    for (let v = 0; v <= len + 1e-9; v = +(v + 0.5).toFixed(2)) { const P = v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, L = whole ? th * 0.42 : th * 0.26;
      grp.appendChild(sv('line', Object.assign(vertical ? { x1: x, y1: y + P, x2: x + L, y2: y + P } : { x1: x + P, y1: y, x2: x + P, y2: y + L }, { stroke: '#2a1a0a', 'stroke-width': whole ? th * 0.05 : th * 0.03 })));
      if (whole && Math.round(v) % 2 === 0) { const tx = sv('text', Object.assign(vertical ? { x: x + th * 0.92, y: y + P + th * 0.13, 'text-anchor': 'end' } : { x: x + P, y: y + th * 0.86, 'text-anchor': 'middle' }, { 'font-size': th * 0.37, fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 })); tx.textContent = String(Math.round(v)); grp.appendChild(tx); } }
    root.appendChild(grp); return grp; }
  /* a ruler on the body: drag it so 0 sits on the red line; read the blue line in the magnifier */
  async function rulerOnBody(which) { const b = figBox(), m = C.meta, gk = m.g.circleSkirt || m.g.skirt || m.g.belt, pxcm = C.body.pxcm;
    let a, endLine, vertical, value, prompt, read;
    if (which === 'len') { const yW = b.y(gk.y0), yK = yW + C.body.len * pxcm, xr = b.x(gk.x1) + 2; vertical = true; value = C.body.len; prompt = t('rulerLen'); read = t('readLen');
      await camTo(b.cx, (yW + yK) / 2, 1.7); dashed(overlay, b.x(gk.x0) - 2, yW, xr + 7, yW, '#e8343a'); endLine = dashed(overlay, b.x(gk.x0) - 2, yK, xr + 7, yK, '#3a7aff'); a = { x: xr, y: yW }; }
    else { const head = which === 'head', gg = head ? m.g.hat : m.g.belt, yc = head ? b.y(gg.y0 + (gg.y1 - gg.y0) * 0.75) : b.y(gg.y0 + (gg.y1 - gg.y0) / 2), half = (head ? C.body.headAcross : C.body.across) * pxcm / 2, cx = b.x((gg.x0 + gg.x1) / 2);
      vertical = false; value = head ? C.body.headAcross : C.body.across; prompt = t(head ? 'rulerHead' : 'rulerAcross', { name: t('client.' + C.key) }); read = t('readAcross');
      await camTo(cx, yc + 3, 2.1); dashed(overlay, cx - half, yc - 5, cx - half, yc + 7, '#e8343a'); endLine = dashed(overlay, cx + half, yc - 5, cx + half, yc + 7, '#3a7aff'); a = { x: cx - half, y: yc + 1.5 }; }
    endLine.setAttribute('opacity', 0); say(prompt); const off0 = vertical ? 9 : -8; const start = vertical ? { x: a.x, y: a.y + off0 } : { x: a.x + off0, y: a.y };
    const gr = rulerSVG(overlay, start.x, start.y, vertical ? 13 : 11, pxcm, vertical, { thick: 4.2 }); const grab = vertical ? { x: start.x + 2.1, y: start.y + 3 } : { x: start.x + 3, y: start.y + 2.1 }; const ring = pulse(overlay, grab.x, grab.y, 2.6);
    window.__geo = { kind: vertical ? 'rulerV' : 'rulerH', grab: w2s(grab.x, grab.y), to: w2s(vertical ? grab.x : grab.x - off0, vertical ? grab.y - off0 : grab.y) };
    let pos = 0, offset = 0, ok = false; const set = v => { pos = v; gr.setAttribute('transform', vertical ? 'translate(0 ' + v.toFixed(3) + ')' : 'translate(' + v.toFixed(3) + ' 0)'); };
    await new Promise(res => drag(gr, 'world', (p, first) => { if (ok) return; ring.remove(); const q = vertical ? p.y : p.x; if (first) offset = q - pos; set(clamp(q - offset, -Math.abs(off0) - 14, Math.abs(off0) + 14)); }, () => { if (ok) return; if (Math.abs(pos + off0) <= 0.45 * pxcm) { ok = true; set(-off0); say(t('zeroOk'), 'ok'); setTimeout(res, 700); } else say(t('zeroNo'), 'bad'); }));
    window.__geo = null; endLine.setAttribute('opacity', 1); await wait(400); const first = await askRead(read, value, 'ruler'); clearOverlay(); return first; }

  /* ---------- the cutting table ---------- */
  const TB = { x0: 12, RW: 26, pxcm: 5, yF: 40, hF: 18, yR: 62, hR: 9, L: 4, R: 170, fabric: null };
  function tableOn(on) { stage.classList.toggle('atTable', on); if (!on) table.replaceChildren(); }
  function tableLayout(maxCm) { TB.RW = Math.max(12, Math.ceil(maxCm + 2)); TB.L = 6; TB.R = W - 6; TB.x0 = TB.L + 6; TB.pxcm = (TB.R - TB.L - 12) / TB.RW; }
  const X = cm => TB.x0 + cm * TB.pxcm;
  function tableBase(fab, opt) { table.replaceChildren(); opt = opt || {}; TB.fabric = null; const defs = sv('defs'); table.appendChild(defs);
    const tex = (id, href, w, h) => { const p = sv('pattern', { id, patternUnits: 'userSpaceOnUse', width: w, height: h }); p.appendChild(sv('image', { href, width: w, height: h, preserveAspectRatio: 'none' })); defs.appendChild(p); };
    tex('rulerTex', asset('rulertex.webp'), 30, TB.hR); tex('tapeTex', asset('tapetex.webp'), 24, 3.4); if (fab) tex('fabTex', tileURL(fab, 64), 9, 9);
    if (fab && !opt.noFabric) { const f = sv('rect', { x: TB.x0, y: TB.yF, width: Math.min(TB.RW * TB.pxcm, TB.R - TB.x0 - 1), height: TB.hF, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.3, class: 'fabric' }); table.appendChild(f); TB.fabric = f; }
    const r = sv('g'); r.appendChild(sv('rect', { x: TB.x0 - 1.5, y: TB.yR, width: TB.RW * TB.pxcm + 3, height: TB.hR, rx: 0.6, fill: 'url(#rulerTex)', stroke: '#6a4a2a', 'stroke-width': 0.3 }));
    const step = S.tier === 3 ? 0.1 : S.tier === 2 ? 0.5 : 1; for (let v = 0; v <= TB.RW + 1e-9; v = +(v + step).toFixed(2)) { const x = X(v), whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
      r.appendChild(sv('line', { x1: x, y1: TB.yR, x2: x, y2: TB.yR + (whole ? 3.8 : half ? 2.5 : 1.4), stroke: '#2a1a0a', 'stroke-width': whole ? 0.32 : half ? 0.22 : 0.14 }));
      if (whole) { const tx = sv('text', { x, y: TB.yR + 7.7, 'font-size': 3.2, 'text-anchor': 'middle', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(Math.round(v)); r.appendChild(tx); } }
    table.appendChild(r); }
  function tapeStrip(fromCm, toCm, y, h, col) { const g = sv('g', { class: 'slide' }); g.appendChild(sv('rect', { x: X(fromCm), y, width: (toCm - fromCm) * TB.pxcm, height: h, fill: col ? col : 'url(#tapeTex)', stroke: '#8a6a10', 'stroke-width': 0.25 }));
    for (let v = Math.ceil(fromCm); v <= toCm + 1e-9; v++) g.appendChild(sv('line', { x1: X(v), y1: y, x2: X(v), y2: y + h * 0.35, stroke: '#6a4a10', 'stroke-width': 0.18 })); g.appendChild(sv('rect', { x: X(toCm) - 0.5, y: y - 0.4, width: 1, height: h + 0.8, rx: 0.3, fill: '#8a4a10' })); table.appendChild(g); return g; }
  function slideIn(g, dx, dy) { g.style.transform = 'translate(' + px(dx) + ',' + px(dy) + ')'; g.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transition = 'transform .9s cubic-bezier(.3,1,.4,1), opacity .5s'; g.style.transform = 'translate(0,0)'; g.style.opacity = '1'; })); return wait(1000); }
  function pinFlag(cm, label, y) { y = y == null ? TB.yF : y; const g = sv('g', { class: 'pin' }); g.appendChild(sv('line', { x1: X(cm), y1: y - 1, x2: X(cm), y2: y - 7, stroke: '#a83a5a', 'stroke-width': 0.4 })); g.appendChild(sv('circle', { cx: X(cm), cy: y - 0.6, r: 0.8, fill: '#e8545c' }));
    g.appendChild(sv('rect', { x: X(cm) + 0.2, y: y - 11.5, width: 9, height: 5, rx: 0.8, fill: '#fffaf0', stroke: '#a83a5a', 'stroke-width': 0.3 })); const tx = sv('text', { x: X(cm) + 4.7, y: y - 7.9, 'font-size': 3.2, 'text-anchor': 'middle', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = label; g.appendChild(tx); table.appendChild(g); return g; }
  function pulseS(cx, cy, r) { const g = sv('g'); pulse(g, cx, cy, r); table.appendChild(g); return g; }
  /* chalk: drag to where to cut (no number on it); returns cm */
  async function chalkAt(target, maxCm) { const line = sv('line', { x1: X(0), y1: TB.yF, x2: X(0), y2: TB.yF + TB.hF, stroke: '#fff', 'stroke-width': 0.7, 'stroke-dasharray': '1.2 0.8', opacity: 0 }); table.appendChild(line);
    const chalk = sv('image', { href: asset('chalk.webp'), width: 10, height: 10, x: X(0) - 5, y: TB.yF - 11, style: 'cursor:grab' }); table.appendChild(chalk); const ring = pulseS(X(0), TB.yF - 6, 4.4);
    let at = 0; const setAt = cm => { at = clamp(snap(cm), 0, maxCm); chalk.setAttribute('x', X(at) - 5); line.setAttribute('x1', X(at)); line.setAttribute('x2', X(at)); line.setAttribute('opacity', at > 0 ? 1 : 0); };
    window.__target = target; window.__geo = { kind: 'chalk', from: { x: X(0), y: TB.yF - 6 }, x0: TB.x0, pxcm: TB.pxcm, y: TB.yF - 6 };
    await new Promise(res => drag(chalk, 'screen', p => { ring.remove(); setAt((p.x - TB.x0) / TB.pxcm); }, () => { if (at > 0) res(); })); window.__geo = null;
    await actions([[t('cut'), 1]]); chalk.remove(); return { at, line }; }
  async function scissorsDown(at, line) { say(t('cutGo')); const xx = X(at), sc = sv('image', { href: asset('scissors.webp'), width: 14, height: 14, x: xx - 7, y: TB.yF - 15, style: 'cursor:grab' }); table.appendChild(sc); const ring = pulseS(xx, TB.yF - 8, 5);
    window.__geo = { kind: 'scissors', from: { x: xx, y: TB.yF - 8 }, to: { x: xx, y: TB.yF + TB.hF + 3 } };
    await new Promise(res => { let done = false; drag(sc, 'screen', p => { if (done) return; ring.remove(); const y = clamp(p.y - 7, TB.yF - 15, TB.yF + TB.hF - 7); sc.setAttribute('y', y); line.setAttribute('stroke', '#ffe08a'); if (p.y >= TB.yF + TB.hF * 0.85) { done = true; res(); } }, () => { if (!done) sc.setAttribute('y', TB.yF - 15); }); });
    window.__geo = null; sc.remove(); if (TB.fabric) { TB.fabric.setAttribute('width', Math.max(0.5, at * TB.pxcm)); } }
  /* the compass: the pin at 0 on the ruler, drag the pencil leg to the mark; returns cm */
  async function compassOpen(target) { const py = TB.yR - 0.2, legs = sv('path', { fill: 'none', stroke: '#3a3a4a', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); table.appendChild(legs); table.appendChild(sv('circle', { cx: X(0), cy: py, r: 0.9, fill: '#3a3a4a' }));
    const knob = sv('circle', { cx: X(1), cy: py, r: 2.9, fill: '#ff6aa8', stroke: '#fff', 'stroke-width': 0.6, style: 'cursor:grab' }); table.appendChild(knob); const ring = pulseS(X(1), py, 2.9);
    let open = 1; const set = v => { open = clamp(snap(v), PREC[S.tier], TB.RW); const x = X(open); knob.setAttribute('cx', x); legs.setAttribute('d', 'M' + X(0) + ' ' + py + ' L' + ((X(0) + x) / 2) + ' ' + (py - 15) + ' L' + x + ' ' + py); }; set(1);
    window.__target = target; window.__geo = { kind: 'compass', from: { x: X(1), y: py }, x0: TB.x0, pxcm: TB.pxcm, y: py };
    let moved = false; await new Promise(res => drag(knob, 'screen', p => { moved = true; ring.remove(); set((p.x - TB.x0) / TB.pxcm); }, () => { if (moved) res(); })); window.__geo = null; legs.setAttribute('opacity', 0.35); knob.setAttribute('opacity', 0.35); return open; }

  /* ---------- circles on the fabric: drawn with the compass, cut round with the scissors ---------- */
  const DISC = { cx: 0, cy: 0, R0: 18 };
  function discArea() { const cx = W - 32, cy = 31; DISC.cx = cx; DISC.cy = cy; const f = sv('rect', { x: cx - 23, y: cy - 22, width: 46, height: 44, fill: 'url(#fabTex)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.3, rx: 0.6 }); table.appendChild(f); return f; }
  async function drawCircle(rCm, scaleMax) { const R = clamp(DISC.R0 * rCm / scaleMax, 2, 21); say(t('drawCircle')); await actions([[t('draw'), 1]]); const c = sv('circle', { cx: DISC.cx, cy: DISC.cy, r: R, fill: 'none', stroke: '#fff', 'stroke-width': 0.6 });
    const len = 2 * Math.PI * R; c.setAttribute('stroke-dasharray', len + ' ' + len); c.setAttribute('stroke-dashoffset', len); c.style.transition = 'stroke-dashoffset 1.1s ease'; table.appendChild(c); requestAnimationFrame(() => requestAnimationFrame(() => c.setAttribute('stroke-dashoffset', 0))); await wait(1200); c.style.transition = ''; c.setAttribute('stroke-dasharray', '1.3 0.9'); c.setAttribute('stroke-dashoffset', 0); return { c, R }; }
  async function cutRound(R) { say(t('cutRound')); const sc = sv('image', { href: asset('scissors.webp'), width: 13, height: 13, x: DISC.cx + R - 6.5, y: DISC.cy - 6.5, style: 'cursor:grab' }); table.appendChild(sc); const ring = pulseS(DISC.cx + R, DISC.cy, 4.5);
    window.__geo = { kind: 'scissorsRound', c: { x: DISC.cx, y: DISC.cy }, R };
    await new Promise(res => { let cov = 0, lastA = null, done = false; drag(sc, 'screen', (p, first) => { if (done) return; ring.remove(); const a = Math.atan2(p.y - DISC.cy, p.x - DISC.cx); if (lastA != null && !first) { let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; cov += Math.abs(d); } lastA = a; sc.setAttribute('x', DISC.cx + R * Math.cos(a) - 6.5); sc.setAttribute('y', DISC.cy + R * Math.sin(a) - 6.5); if (cov >= Math.PI * 1.75) { done = true; res(); } }, () => {}); });
    window.__geo = null; sc.remove(); }

  /* ---------- moving between the client and the table; the cut piece flies on ---------- */
  async function toTable(maxCm, fab, opt) { clearOverlay(); await camTo(0, 0, 1, 400); tableLayout(maxCm); tableBase(fab, opt); tableOn(true); await wait(450); }
  async function toClient(kind, st) { const f = TB.fabric; if (f) f.classList.add('flyoff'); await wait(450); tableOn(false); const b = figBox(), g = C.meta.g[kind];
    await camTo(b.x((g.x0 + g.x1) / 2), b.y((g.y0 + g.y1) / 2), kind === 'hat' ? 1.7 : 1.35, 600); fitStyle(kind, st); pop(kind); burst(b.x((g.x0 + g.x1) / 2), b.y((g.y0 + g.y1) / 2)); await wait(900); }

  /* ---------- the pieces ---------- */
  const STORE = {};
  async function fabricFor(kind) { const fab = await pickFabric(t('piece.' + kind)); await garmentOn(kind, fab, { ghost: true }); const b = figBox(); await camTo(b.cx, b.y(C.meta.g[kind].y0), 1.25, 500); say(t('ghost', { piece: t('piece.' + kind) })); await actions([[t('next'), 1]]); return fab; }
  async function payFabric() { S.coins = Math.max(0, S.coins - 1); hud(); }

  /* a straight piece (skirt or belt): the waist round, plus a little more; a skirt also gets its length */
  async function straightPiece(kind, fab) { const B = C.body, extra = kind === 'skirt' ? 2 : 3, needW = snap(B.round + extra); let first = true, gotW = null;
    if (!STORE.measuredRound) { await tapeRound(); STORE.measuredRound = true; }
    for (;;) { await toTable(needW + 1, fab);
      if (first) { say(t('layTape')); await slideIn(tapeStrip(0, B.round, TB.yF + TB.hF + 0.6, 3.4), -20, -30); await askRead(t('readTape'), B.round, 'tape');
        say(t(kind === 'skirt' ? 'addSeam' : 'addBuckle')); await slideIn(tapeStrip(B.round, needW, TB.yF + TB.hF + 0.6, 3.4, '#ff9fc6'), 10, -20); await askRead(t('readEnd'), needW, 'tape'); first = false; }
      pinFlag(needW, fmt(needW)); say(t('chalkEnd')); const r = await chalkAt(needW, TB.RW); await scissorsDown(r.at, r.line); gotW = r.at;
      let st = gotW - needW > TOL[S.tier] ? { loose: true } : gotW - needW < -TOL[S.tier] ? { tight: true } : {}; if (kind === 'skirt') st.long = true;
      await toClient(kind, st);
      if (st.tight) { say(t('fit.tight', { piece: t('piece.' + kind) }) + ' ' + t('fixRecut'), 'bad'); await actions([[t('again'), 1]]); await payFabric(); continue; }
      while (st.loose) { say(t('fit.loose', { piece: t('piece.' + kind) }) + ' ' + t('fixTrim'), 'bad'); await actions([[t('fix'), 1]]); await toTable(gotW + 1, fab); TB.fabric.setAttribute('width', gotW * TB.pxcm); pinFlag(needW, fmt(needW)); say(t('trimTo'));
        const q = await chalkAt(needW, gotW); await scissorsDown(q.at, q.line); gotW = q.at; st = gotW - needW > TOL[S.tier] ? { loose: true } : gotW - needW < -TOL[S.tier] ? { tight: true } : {}; if (kind === 'skirt') st.long = true; await toClient(kind, st); }
      if (st.tight) { say(t('fit.tight', { piece: t('piece.' + kind) }) + ' ' + t('fixRecut'), 'bad'); await actions([[t('again'), 1]]); await payFabric(); continue; }
      break; }
    if (kind === 'belt') { say(t('fit.perfect', { piece: t('piece.belt') }), 'ok'); await wait(1300); return; }
    /* the skirt's length: the ruler from the waist down, then chalk that length and cut */
    say(t('nowLength'), 'ok'); await wait(1500); await rulerOnBody('len');
    for (;;) { await toTable(B.len + 6, fab); pinFlag(B.len, fmt(B.len)); say(t('chalkLen')); const r = await chalkAt(B.len, B.len + 5); await scissorsDown(r.at, r.line); const gotH = r.at;
      const st = { h: gotH / B.len }; await toClient('skirt', st);
      if (gotH - B.len > TOL[S.tier]) { say(t('fit.long', { piece: t('piece.skirt') }) + ' ' + t('fixTrim'), 'bad'); await actions([[t('fix'), 1]]); continue; }
      if (gotH - B.len < -TOL[S.tier]) { say(t('fit.short', { piece: t('piece.skirt') }) + ' ' + t('fixRecut'), 'bad'); await actions([[t('again'), 1]]); await payFabric(); continue; }
      break; }
    fitStyle('skirt', {}); say(t('fit.perfect', { piece: t('piece.skirt') }), 'ok'); await wait(1400); }

  /* a circle (circle skirt or hat): the width across, folded in half = the radius; a skirt adds its length after the radius */
  async function circlePiece(kind, fab) { const B = C.body, D = kind === 'hat' ? B.headAcross : B.across, r = snap(D / 2), R = kind === 'hat' ? r : snap(r + B.len), span = Math.max(D, R) + 1;
    await rulerOnBody(kind === 'hat' ? 'head' : 'across');
    await toTable(span, fab, { noFabric: true }); discArea();
    say(t('widthLine')); const wl = sv('line', { x1: X(0), y1: TB.yR - 2.5, x2: X(D), y2: TB.yR - 2.5, stroke: '#3a7aff', 'stroke-width': 0.9, 'stroke-linecap': 'round' }); table.appendChild(wl); await wait(1200);
    say(t('foldIt')); const end = sv('circle', { cx: X(D), cy: TB.yR - 2.5, r: 2.4, fill: '#3a7aff', stroke: '#fff', 'stroke-width': 0.5, style: 'cursor:grab' }); table.appendChild(end); const ring = pulseS(X(D), TB.yR - 2.5, 2.4);
    window.__geo = { kind: 'fold', grab: { x: X(D), y: TB.yR - 2.5 }, to: { x: X(0), y: TB.yR - 2.5 } };
    await new Promise(res => { let done = false; drag(end, 'screen', p => { if (done) return; ring.remove(); const cm = clamp((p.x - TB.x0) / TB.pxcm, 0, D); end.setAttribute('cx', X(cm)); wl.setAttribute('x2', X((D + cm) / 2)); if (cm <= 0.6) { done = true; res(); } }, () => { if (!done) { end.setAttribute('cx', X(D)); wl.setAttribute('x2', X(D)); } }); });
    window.__geo = null; end.remove(); wl.setAttribute('x2', X(r)); table.appendChild(sv('path', { d: 'M' + X(r) + ' ' + (TB.yR - 4.2) + ' l -1.3 -2.4 h 2.6 z', fill: '#3a7aff' }));
    await askRead(t('readFold'), r, 'ruler'); pinFlag(r, fmt(r), TB.yR - 4);
    if (kind !== 'hat') { say(t('lengthNext'), 'ok'); await wait(1300); tableOn(false); await rulerOnBody('len'); await toTable(span, fab, { noFabric: true }); discArea(); pinFlag(r, fmt(r), TB.yR - 4);
      say(t('layLength')); await slideIn(tapeStrip(r, R, TB.yR - 4, 3.4), 10, -20); await askRead(t('readEnd'), R, 'tape'); pinFlag(R, fmt(R), TB.yR - 4); }
    for (;;) { let gotR = null, gotr;
      if (kind !== 'hat') { say(t('compassOuter')); gotR = await compassOpen(R); const o = await drawCircle(gotR, R * 1.05); await cutRound(o.R); o.c.setAttribute('fill', 'url(#fabTex)'); o.c.setAttribute('stroke', 'rgba(0,0,0,.4)'); o.c.setAttribute('stroke-dasharray', '');
        say(t('compassHole')); gotr = await compassOpen(r); const h = await drawCircle(gotr, R * 1.05); await cutRound(h.R); h.c.setAttribute('fill', '#5a3a22'); h.c.setAttribute('stroke-dasharray', ''); TB.fabric = o.c; }
      else { say(t('compassHat')); gotr = await compassOpen(r); const h = await drawCircle(gotr, r * 1.05); await cutRound(h.R); h.c.setAttribute('fill', 'url(#fabTex)'); h.c.setAttribute('stroke-dasharray', ''); TB.fabric = h.c; }
      const dr = gotr - r, dR = kind === 'hat' ? 0 : gotR - R, st = {};
      if (kind === 'hat') { if (dr > TOL[S.tier]) st.big = true; if (dr < -TOL[S.tier]) st.small = true; }
      else { if (dr > TOL[S.tier]) st.holeBig = true; if (dr < -TOL[S.tier]) st.holeSmall = true; st.h = (gotR - gotr) / (R - r); }
      for (const k of ['flyoff']) if (TB.fabric) TB.fabric.classList.add(k); await toClient(kind, st);
      const bad = st.big ? 'hatBig' : st.small ? 'hatSmall' : st.holeSmall ? 'holeSmall' : st.holeBig ? 'holeBig' : (st.h != null && Math.abs(dR - dr) > TOL[S.tier]) ? (dR - dr > 0 ? 'long' : 'short') : null;
      if (!bad) break;
      say(t('fit.' + bad, { piece: t('piece.' + kind) }) + ' ' + t('fixRecut'), 'bad'); await actions([[t('again'), 1]]); await payFabric();
      await toTable(span, fab, { noFabric: true }); discArea(); pinFlag(r, fmt(r), TB.yR - 4); if (kind !== 'hat') pinFlag(R, fmt(R), TB.yR - 4); }
    fitStyle(kind, {}); say(t('fit.perfect', { piece: t('piece.' + kind) }), 'ok'); await wait(1400); }

  /* ---------- fabric picker: colour × pattern, with a live swatch ---------- */
  function swatchEl(fab) { const d = el('div', 'sw'); d.style.backgroundImage = 'url(' + tileURL(fab, 48) + ')'; return d; }
  function pickFabric(label) { return new Promise(res => { const sh = el('div', 'picker'); const card = el('div', 'card'); card.appendChild(el('h3', null, t('fabricPick', { piece: label }))); const cur = { col: pick(COLOURS), kind: pick(KINDS) };
    const prev = el('div', 'preview'), cols = el('div', 'row cols'), kinds = el('div', 'row kinds');
    const draw = () => { prev.replaceChildren(swatchEl(cur)); cols.replaceChildren(); kinds.replaceChildren();
      for (const c of COLOURS) { const b = el('button', c === cur.col ? 'on' : ''); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', c); b.onclick = () => { cur.col = c; draw(); }; cols.appendChild(b); }
      for (const k of KINDS) { const b = el('button', k === cur.kind ? 'on' : ''); b.type = 'button'; b.title = t('patterns.' + k); b.appendChild(swatchEl({ col: cur.col, kind: k })); b.onclick = () => { cur.kind = k; draw(); }; kinds.appendChild(b); } };
    draw(); const go = el('button', 'btn big', t('thisOne')); go.type = 'button'; go.onclick = () => { sh.remove(); res({ col: cur.col, kind: cur.kind }); }; card.append(el('p', null, t('colours')), cols, el('p', null, t('patternsWord')), kinds, prev, go); sh.appendChild(card); ui.appendChild(sh); }); }

  /* ---------- HUD, the order card, the wardrobe ---------- */
  function hud() { let h = $('.hud', ui); if (!h) { h = el('div', 'hud'); ui.appendChild(h); } h.replaceChildren(); const L = el('div', 'chips'), R = el('div', 'chips');
    const coin = el('span', 'chip'); const ci = el('img'); ci.src = asset('coin.webp'); ci.alt = ''; coin.append(ci, document.createTextNode(String(S.coins))); L.append(coin, el('span', 'chip', '★ ' + S.rep));
    const wd = el('button', 'btn ghost', t('wardrobe')); wd.onclick = openCloset; const lg = el('button', 'btn ghost', t('lang')); lg.onclick = () => { S.lang = S.lang === 'he' ? 'en' : 'he'; save(); location.reload(); }; R.append(wd, lg); h.append(L, R); }
  function orderCard(kinds, done) { let o = $('.order', ui); if (!o) { o = el('div', 'order'); ui.appendChild(o); } o.replaceChildren();
    for (const k of kinds) { const it = el('div', 'item' + (done.includes(k) ? ' done' : '')), ic = el('div', 'ico'), g = C.meta.g[k], gw = g.x1 - g.x0, gh = (g.y1 - g.y0) / C.meta.aspect, f = 0.86 / Math.max(gw, gh);
      ic.style.backgroundImage = 'url(' + asset('g_' + C.key + '_' + k + '.webp') + ')'; ic.style.backgroundSize = (f * 100).toFixed(1) + '% auto';
      const Iw = f, Ih = f / C.meta.aspect, px_ = Iw === 1 ? 0 : ((0.5 - (g.x0 + g.x1) / 2 * Iw) / (1 - Iw)), py_ = ((0.5 - (g.y0 + g.y1) / 2 * Ih) / (1 - Ih)); ic.style.backgroundPosition = (px_ * 100).toFixed(1) + '% ' + (py_ * 100).toFixed(1) + '%';
      it.append(ic, el('span', null, t('piece.' + k) + (done.includes(k) ? ' ✓' : ''))); o.appendChild(it); } }
  const clearOrder = () => { const o = $('.order', ui); if (o) o.remove(); };
  async function outfitCanvas(o) { const img = await loadImg(asset(o.client + '.webp', o.look)); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    for (const p of o.pieces.slice().sort((a, b) => Z[a.kind] - Z[b.kind])) { const cv = document.createElement('canvas'); await paintGarment(cv, o.client, p.kind, p.fab, o.look); g.drawImage(cv, 0, 0); } return c; }
  async function openCloset() { let c = $('.closet', ui); if (c) { c.remove(); return; } c = el('div', 'closet'); const top = el('div', 'closetTop'); const back = el('button', 'btn ghost', t('back')); back.onclick = () => c.remove(); top.appendChild(back); c.appendChild(top); ui.appendChild(c);
    if (!S.wardrobe.length) { c.appendChild(el('p', null, t('wardrobeEmpty'))); return; } const grid = el('div', 'grid'); c.appendChild(grid);
    for (const o of S.wardrobe.slice().reverse()) { const it = el('div', 'item'); grid.appendChild(it); try { it.appendChild(await outfitCanvas(o)); } catch (e) {} it.appendChild(el('small', null, t('wardrobeOf', { name: t('client.' + o.client), d: o.day }))); } }

  /* ---------- one client ---------- */
  async function serve() { const key = CLIENTS[(S.seen++) % CLIENTS.length]; save(); clearOverlay(); tableOn(false); for (const k in STORE) delete STORE[k];
    await placeClient(key); const kinds = ORDER[S.tier], done = [], pieces = []; orderCard(kinds, done);
    const names = kinds.map(k => t('aPiece.' + k)); say(t('wish.' + key, { pieces: names.length > 1 ? names.slice(0, -1).join(', ') + ' ' + t('and') + names[names.length - 1] : names[0] })); await actions([[t('next'), 1]]);
    for (const kind of kinds) { const fab = await fabricFor(kind); if (kind === 'skirt' || kind === 'belt') await straightPiece(kind, fab); else await circlePiece(kind, fab); pieces.push({ kind, fab }); done.push(kind); orderCard(kinds, done); await camTo(0, 0, 1, 500); }
    const pay = kinds.length * 3; S.coins += pay; S.rep++; hud(); const b = figBox(); await camTo(b.cx, b.top + H * 0.5, 1.15, 600); burst(W / 2, 35);
    say(t('paid', { name: t('client.' + key), c: pay }) + ' ' + t('star'), 'ok'); S.wardrobe.push({ client: key, look: S.look, day: S.day, pieces }); S.day++; save();
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
  window.AT = { S, t, get W() { return W; }, get cam() { return CAM; }, get C() { return C; } };
  main();
})();
