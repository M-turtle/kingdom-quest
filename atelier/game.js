/* Kingdom Quest — סדנת אומן / the Atelier, v5 (Yoni 2026-10-19 on v4, live: 'the design of the cloth is still not in the same level as the
   background ... the dial should be straight ... a lot of steps ... kids are just gonna press it and not do anything. It needs to be simpler ...
   teach them step by step, but they don't necessarily need to do everything ... the purpose is to understand radius and how to measure circles
   ... and then knowing that this times this equals that ... if you keep on just measuring things, it's going to get boring').
   · Cloth pieces are rendered (Gemini, white felt or cotton, real folds) and coloured at run time with the Doll Studio's colours and patterns.
   · The compass is a straight beam compass: a straight bar turning round its pin, with the chalk sliding along it to the radius.
   · No "Next" presses. Teaching is a short caption and an animation while the kid acts. Per piece only the actions that teach:
       belt   · to 10: tape round the waist, read it, chalk where the tape ends · 11+: width across, then 3.14 × width = the way round
       circle · to 10: width across, fold it in half = the radius · 11+: tape round, ÷ 6.28 = the radius · then set the compass, swing it
   · A piece goes on the client only when it is made; the body judges the fit; a fix redoes only the step that was wrong.
   · v8 (Yoni 2026-10-19: "a fox ... wear a dress ... makes no sense" · "the belt ... obviously comes after either pants or dress" · fox: "pants, shirt,
     belt", teddy: "Boy: pants like the fox"): the girl and the princess order a circle skirt, then a belt; the fox and the teddy order pants (a ruler
     down the leg), a shirt (a ruler across the chest), then a belt (the tape round the waist). The belt is always last.
   Tiers: 1 (to 6) felt, whole cm · 2 (7–10) nature-tech, half cm · 3 (11+) nature-tech, mm and π. */
(function () {
  'use strict';
  const VERSION = 9;
  const $ = (s, r) => (r || document).querySelector(s), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const NS = 'http://www.w3.org/2000/svg', sv = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a || {}) e.setAttribute(k, a[k]); return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms)), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.floor(Math.random() * a.length)];
  const stage = $('#stage'), world = $('#world'), scene = $('#scene'), overlay = $('#overlay'), table = $('#table'), ui = $('#ui'), actors = $('#actors');
  const PREC = { 1: 1, 2: 0.5, 3: 0.1 }, TOL = { 1: 0.4, 2: 0.3, 3: 0.06 }, H = 58, IMG_CM = 30;
  const READZ = { 1: 2.6, 2: 3.2, 3: 4.4 }, SPAN = { 1: 8, 2: 5.5, 3: 2.6 };   /* Yoni 2026-10-19: 'relax with the zoom ... car sickness': shallow and slow, none on the felt table */
  const CLIENTS = { felt: ['girl', 'teddy', 'princess', 'fox'], nature: ['girl', 'bear', 'princess', 'fox'] };   /* felt dolls and felt animals; no boy, no grandma (Yoni 2026-10-19) */
  const COLOURS = ['#ff8fb8', '#8fd0f0', '#c0a0ff', '#ffcf6a', '#7fdcb0', '#ff9f90', '#e8545c', '#5a78c8'];
  const KINDS = ['plain', 'dots', 'stripes', 'gingham', 'flowers', 'hearts', 'stars', 'zigzag'];
  /* no hats, no people clients: dolls and felt animals only (Yoni 2026-10-19); girls wear the skirt, boys the pants and shirt; the belt comes last */
  const BOY = { fox: 1, teddy: 1, bear: 1 }, ORDER = key => BOY[key] ? ['pants', 'shirt', 'belt'] : ['circleSkirt', 'belt'];
  const Z = { shirt: 1, circleSkirt: 1, skirt: 1, pants: 2, belt: 3, hat: 4 };   /* the shirt is tucked into the pants; the belt sits on top */

  /* ---------- state ---------- */
  const S = { lang: 'he', look: 'felt', tier: 1, name: '', age: 6, coins: 10, rep: 0, day: 1, wardrobe: [], seen: 0, taught: {} };
  const KEY = 'kq_atelier_v5';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.name) { Object.assign(S, j); S.taught = S.taught || {}; return; } for (const k of ['kq_atelier_v4', 'kq_atelier_v3', 'kq_atelier_v2', 'kq_atelier_v1']) { const o = JSON.parse(localStorage.getItem(k) || 'null'); if (o && o.name) { S.name = o.name; S.age = o.age || 6; S.lang = o.lang || 'he'; break; } } } catch (e) {} }
  const T = () => window.AT_STR[S.lang] || window.AT_STR.en;
  const look = (o, k) => k.split('.').reduce((a, p) => (a && a[p] != null ? a[p] : null), o);
  const t = (k, v) => { let s = look(T(), k); if (s == null) s = look(window.AT_STR.en, k); if (s == null) s = k; return String(s).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m)); };
  const snapTo = (v, p) => +(Math.round(v / p) * p).toFixed(2), snap = v => snapTo(v, PREC[S.tier]);
  const fmt = v => { const r = Math.round(v * 10) / 10; return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(1); };
  const same = (a, b, tol) => Math.abs(a - b) <= (tol != null ? tol : PREC[S.tier] / 4) + 1e-6;
  const cname = () => t('client.' + C.key), pname = k => t('piece.' + k);
  const layerOf = k => (S.look === 'felt' && k === 'circleSkirt') ? 'skirt' : k;   /* the felt clients wear their rendered flared skirt as the circle skirt */

  /* ---------- the stage, the camera, the table zoom ---------- */
  let W = 177.78;
  const px = v => 'calc(var(--u) * ' + (+v).toFixed(3) + ' * 1px)';
  const VB = { x: 0, y: 0, w: 177.78, h: 100 };
  function setVB() { table.setAttribute('viewBox', [VB.x, VB.y, VB.w, VB.h].map(v => v.toFixed(3)).join(' ')); }
  function measureStage() { const r = stage.getBoundingClientRect(); const full = VB.w >= W - 0.01; W = 100 * r.width / r.height; stage.style.setProperty('--u', (r.height / 100).toFixed(4)); overlay.setAttribute('viewBox', '0 0 ' + W.toFixed(3) + ' 100'); if (full) { VB.x = 0; VB.y = 0; VB.w = W; VB.h = 100; } setVB(); }
  window.addEventListener('resize', () => { measureStage(); applyCam(0); }); measureStage();
  const CAM = { z: 1, tx: 0, ty: 0 };
  function applyCam(ms) { world.style.transition = ms ? 'transform ' + ms + 'ms cubic-bezier(.4,0,.2,1)' : 'none'; world.style.transform = 'translate(' + px(CAM.tx) + ', ' + px(CAM.ty) + ') scale(' + CAM.z + ')'; scene.style.filter = CAM.z > 1.05 ? 'blur(3px) brightness(.85)' : ''; }
  function camTo(fx, fy, z, ms) { ms = Math.max(1100, ms == null ? 1300 : ms * 1.6); let tx = W / 2 - fx * z, ty = 50 - fy * z; if (z <= 1) { z = 1; tx = 0; ty = 0; } tx = clamp(tx, W - W * z, 0); ty = clamp(ty, 100 - 100 * z, 0); Object.assign(CAM, { z, tx, ty }); applyCam(ms); return wait(ms + 40); }
  function zoomVB(cx, cy, w, ms) { ms = Math.max(1200, (ms == null ? 800 : ms) * 1.6); w = clamp(w, 3, W); const h = w * 100 / W, x = clamp(cx - w / 2, 0, W - w), y = clamp(cy - h / 2, 0, 100 - h); const from = Object.assign({}, VB), to = { x, y, w, h };
    return new Promise(res => { const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; for (const q of ['x', 'y', 'w', 'h']) VB[q] = from[q] + (to[q] - from[q]) * e; setVB(); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }); }
  const zoomOut = ms => (VB.w >= W - 0.01 ? Promise.resolve() : zoomVB(W / 2, 50, W, ms));
  const noZoom = () => true;   /* no zoom on the cloth table at any age (Yoni 2026-10-19: 'The back and forth of the Zoom ... is useless') */
  const w2s = (x, y) => ({ x: CAM.tx + x * CAM.z, y: CAM.ty + y * CAM.z });
  const t2s = (x, y) => ({ x: (x - VB.x) * W / VB.w, y: (y - VB.y) * 100 / VB.h });
  const spt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.height * 100, y: (e.clientY - r.top) / r.height * 100 }; };
  const wpt = e => { const s = spt(e); return { x: (s.x - CAM.tx) / CAM.z, y: (s.y - CAM.ty) / CAM.z }; };
  const tpt = e => { const s = spt(e); return { x: VB.x + s.x * VB.w / W, y: VB.y + s.y * VB.h / 100 }; };
  function drag(elm, space, onMove, onEnd) { let on = false; const P = e => (space === 'world' ? wpt(e) : space === 'table' ? tpt(e) : spt(e));
    elm.addEventListener('pointerdown', e => { on = true; try { elm.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); onMove(P(e), true); });
    elm.addEventListener('pointermove', e => { if (on) onMove(P(e), false); });
    const up = e => { if (!on) return; on = false; if (onEnd) onEnd(P(e)); }; elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up); }
  const geo = g => { window.__geo = g; const p = g && (g.kind === 'round' && g.edge ? { x: g.edge.x + 2, y: g.c.y, side: 'right' } : (g.from || g.c || g.grab)); if (p) near(p); }, nogeo = () => { window.__geo = null; };

  /* ---------- assets ---------- */
  const A = { meta: {}, img: {} };
  const asset = (n, lk) => 'assets/' + (lk || S.look) + '/' + n;
  /* a picture that fails to load is tried again (three times, a short wait between), so a dropped connection never freezes the game */
  const loadImg = src => A.img[src] || (A.img[src] = new Promise((res, rej) => { let n = 0; const go = () => { const i = new Image(); i.onload = () => res(i); i.onerror = e => { if (++n < 4) setTimeout(go, 500 * n); else { delete A.img[src]; rej(e); } }; i.src = src + (n ? (src.includes('?') ? '&' : '?') + 'r=' + n : ''); }; go(); }));
  async function loadLook() { $('#poster').src = asset('shop.webp'); $('#loop').src = asset('shop.mp4'); try { A.meta = await (await fetch(asset('meta.json'))).json(); } catch (e) { A.meta = {}; } for (const n of ['cl_disc', 'cl_strip', 'cl_sheet', 'beam', 'table.webp']) loadImg(asset(n.includes('.') ? n : n + '.webp')).catch(() => {}); }
  function loopPlay(on) { const v = $('#loop'); if (on) { v.currentTime = 0; v.play().then(() => v.classList.add('on')).catch(() => {}); } else { v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 900); } }
  document.addEventListener('visibilitychange', () => { const v = $('#loop'); if (document.hidden) v.pause(); else if (v.classList.contains('on')) v.play().catch(() => {}); });

  /* ---------- fabric: the pattern tile, painted into rendered cloth and garments ---------- */
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
  async function paintInto(cv, img, fab, tiles, cut) { cv.width = img.naturalWidth; cv.height = img.naturalHeight; const g = cv.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = g.createPattern(tileCanvas(fab, Math.max(16, Math.round(img.naturalHeight / tiles))), 'repeat'); g.fillRect(0, 0, cv.width, cv.height);
    g.globalCompositeOperation = 'multiply'; g.drawImage(img, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0);
    if (cut) { g.globalCompositeOperation = 'destination-out'; cut(g, cv.width, cv.height); } g.globalCompositeOperation = 'source-over'; return cv; }
  async function paintGarment(cv, client, kind, fab, lk) { const img = await loadImg(asset('g_' + client + '_' + kind + '.webp', lk)); return paintInto(cv, img, fab, 9 * img.naturalHeight / img.naturalWidth); }
  /* a rendered cloth piece as an image for the table: 'cl_disc' | 'cl_strip' | 'cl_sheet'; cut(g, w, h) removes what was cut away */
  async function clothURL(name, fab, tiles, cut) { const img = await loadImg(asset(name + '.webp')); const cv = document.createElement('canvas'); await paintInto(cv, img, fab, tiles, cut); return cv.toDataURL(); }

  /* ---------- the client ---------- */
  const C = { key: null, fig: null, meta: null, body: null, cv: {} };
  const lookPos = () => (A.meta && A.meta._look) || { podiumX: 0.5, podiumY: 0.78 };
  const gOf = k => C.meta.g[layerOf(k)];
  function figBox() { const L = lookPos(), m = C.meta; const w = H * m.aspect, cx = W * L.podiumX, bottom = L.podiumY * 100 + 2, top = bottom - H; return { cx, top, bottom, w, left: cx - w / 2, y: f => top + H * f, x: f => cx - w / 2 + w * f }; }
  function bodyOf(m) { const g = m.g, wU = H * m.aspect, bw = (g.belt.x1 - g.belt.x0) * wU, raw = clamp(bw / (H / IMG_CM), 5, 9);
    const across = S.tier === 1 ? 2 * Math.round(raw / 2) : S.tier === 2 ? Math.round(raw) : snapTo(raw, 0.2), pxcm = bw / across;
    const headAcross = g.hat ? (S.tier === 3 ? snapTo(clamp((g.hat.x1 - g.hat.x0) * wU * 0.8 / pxcm, 4, 8), 0.2) : Math.round(clamp((g.hat.x1 - g.hat.x0) * wU * 0.8 / pxcm, 4, 8))) : 0;
    const leg = g.pants ? snap(clamp((g.pants.y1 - g.pants.y0) * H / pxcm, 3, 20)) : 0, chest = g.shirt ? snap(clamp((g.shirt.chestX1 - g.shirt.chestX0) * wU / pxcm, 3, 14)) : 0;
    return { across, round: snap(Math.PI * across), headAcross, pxcm, leg, chest }; }
  async function placeClient(key) { C.key = key; C.meta = A.meta[key]; C.body = bodyOf(C.meta); C.cv = {}; const b = figBox();
    const fig = el('div', 'figure'); fig.style.left = px(b.left); fig.style.top = px(b.top); fig.style.width = px(b.w); fig.style.height = px(H);
    const img = el('img', 'client'); img.src = asset(key + '.webp'); img.alt = ''; fig.appendChild(img); actors.appendChild(fig); C.fig = fig;
    fig.style.transform = 'translateX(' + px(T().dir === 'rtl' ? -90 : 90) + ')'; fig.style.opacity = '0'; await loadImg(img.src).catch(() => {});
    requestAnimationFrame(() => requestAnimationFrame(() => { fig.style.opacity = '1'; fig.style.transform = ''; })); await wait(1000); }
  function clientLeave() { if (!C.fig) return; const f = C.fig; f.style.transform = 'translateX(' + px(T().dir === 'rtl' ? 90 : -90) + ')'; f.style.opacity = '0'; setTimeout(() => f.remove(), 1000); C.fig = null; }
  async function wear(kind, fab, st) { let cv = C.cv[kind]; if (!cv) { cv = el('canvas', 'garment'); cv.style.zIndex = String(Z[kind]); C.fig.appendChild(cv); C.cv[kind] = cv; } await paintGarment(cv, C.key, layerOf(kind), fab); fitStyle(kind, st || {}); cv.classList.remove('pop'); void cv.offsetWidth; cv.classList.add('pop'); }
  function fitStyle(kind, st) { const cv = C.cv[kind]; if (!cv) return; const g = gOf(kind), cx = ((g.x0 + g.x1) / 2 * 100).toFixed(1) + '%', top = (g.y0 * 100).toFixed(1) + '%', mid = ((g.y0 + g.y1) / 2 * 100).toFixed(1) + '%';
    cv.style.clipPath = ''; let tf = '', origin = cx + ' ' + top;
    const gap = h => { const x = (g.x0 + g.x1) / 2 * 100, y0 = g.y0 * 100, y1 = (g.y0 + (g.y1 - g.y0) * h) * 100; cv.style.clipPath = 'polygon(0 0, ' + (x - 0.2) + '% 0, ' + (x - 0.2) + '% ' + y0 + '%, ' + (x - 3.2) + '% ' + y0 + '%, ' + x + '% ' + y1 + '%, ' + (x + 3.2) + '% ' + y0 + '%, ' + (x + 0.2) + '% ' + y0 + '%, ' + (x + 0.2) + '% 0, 100% 0, 100% 100%, 0 100%)'; };
    if (kind === 'circleSkirt') { if (st.big) tf = ' translateY(7%)'; if (st.small) { tf = ' translateY(-4%) scaleX(.88)'; gap(0.45); } }
    if (kind === 'belt') { if (st.big) tf = ' translateY(2.5%) rotate(5deg)'; if (st.small) gap(1); }
    if (kind === 'pants') { if (st.big) tf = ' scaleY(1.12)'; if (st.small) tf = ' scaleY(.8)'; }
    if (kind === 'shirt') { if (st.big) tf = ' scale(1.1)'; if (st.small) tf = ' scaleX(.86)'; }
    if (kind === 'hat') { origin = cx + ' ' + mid; if (st.small) tf = ' translateY(-5%) scale(.72)'; if (st.big) tf = ' translateY(6%) scale(1.28)'; }
    cv.style.transformOrigin = origin; cv.style.transform = tf.trim(); }

  /* ---------- words, buttons, the pad ---------- */
  /* the notice: a speech bubble with a speaker, in a side lane beside the work (Yoni 2026-10-19: "Put it on the side.") — it measures what is on
     screen (client, tape, cloth, ruler, compass, pad) and sits in the widest free lane, narrowing to fit; it never covers the work */
  let bubble = null, ANCH = null, lastSaid = '', dockT = 0;
  function dock() { let d = $('.dock', ui); if (!d) { d = el('div', 'dock'); const col = el('div', 'col'); col.appendChild(el('div', 'actions')); d.append(col); ui.appendChild(d); } return d; }
  function near(p) { ANCH = p; placeDock(); }
  function workRects(sr) { const out = [], atT = stage.classList.contains('atTable'), add = e => { if (!e || !e.getBoundingClientRect) return; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return; const r = e.getBoundingClientRect();
      const x0 = Math.max(r.left, sr.left), y0 = Math.max(r.top, sr.top), x1 = Math.min(r.right, sr.right), y1 = Math.min(r.bottom, sr.bottom); if (x1 - x0 < 2 || y1 - y0 < 2) return; if ((x1 - x0) * (y1 - y0) > sr.width * sr.height * 0.8) return; out.push({ x0, y0, x1, y1 }); };
    add($('.notes', ui)); if (atT) [...table.children].forEach(add); else { if (C.fig) { const fr = C.fig.getBoundingClientRect(), g = C.meta && C.meta.g && C.meta.g.belt; if (fr.width < sr.width * 0.45 || !g) add(C.fig); else { const cx = fr.left + (g.x0 + g.x1) / 2 * fr.width, hw = (g.x1 - g.x0) * fr.width * 0.75; out.push({ x0: Math.max(sr.left, cx - hw), y0: Math.max(sr.top, fr.top), x1: Math.min(sr.right, cx + hw), y1: Math.min(sr.bottom, fr.bottom) }); } } [...$('#overlay').children].forEach(add); }   /* zoomed on the body: the body's middle (waist wide) and the tools on it are the work */
    return out; }
  function placeDock() { clearTimeout(dockT); const d = dock(); requestAnimationFrame(() => { const sr = stage.getBoundingClientRect(), U = sr.height / 100, m = 1.5 * U, R = workRects(sr);
      d.classList.add('anch'); let wx0 = Infinity, wx1 = -Infinity, wy0 = Infinity, wy1 = -Infinity; R.forEach(r => { wx0 = Math.min(wx0, r.x0); wx1 = Math.max(wx1, r.x1); wy0 = Math.min(wy0, r.y0); wy1 = Math.max(wy1, r.y1); });
      const prefY = ANCH ? sr.top + ANCH.y * U : sr.top + 55 * U; let lane;
      if (!R.length) lane = { x0: sr.left + m, x1: sr.right - m, y0: sr.top + 15 * U, y1: sr.bottom - m };
      else { const L = { x0: sr.left + m, x1: wx0 - m, y0: sr.top + 15 * U, y1: sr.bottom - m }, Rt = { x0: wx1 + m, x1: sr.right - m, y0: sr.top + 15 * U, y1: sr.bottom - m },
          Tp = { x0: sr.left + m, x1: sr.right - m, y0: sr.top + 15 * U, y1: wy0 - m }, Bt = { x0: sr.left + m, x1: sr.right - m, y0: wy1 + m, y1: sr.bottom - m };
        const side = [L, Rt].filter(l => l.x1 - l.x0 >= 22 * U).sort((p, q) => (q.x1 - q.x0) - (p.x1 - p.x0))[0], band = [Tp, Bt].filter(l => l.y1 - l.y0 >= 14 * U).sort((p, q) => (q.y1 - q.y0) - (p.y1 - p.y0))[0];
        lane = side || band || [L, Rt].sort((p, q) => (q.x1 - q.x0) - (p.x1 - p.x0))[0]; }
      const pd = $('.pad', ui); if (pd) { const pr = pd.getBoundingClientRect(); if (lane.x1 > pr.left - m && lane.x0 < pr.left) lane.x1 = pr.left - m; else if (lane.x0 < pr.right + m && lane.x1 > pr.right) lane.x0 = pr.right + m; }
      const lw = Math.max(lane.x1 - lane.x0, 18 * U); d.style.maxWidth = px(Math.min(lw, 34 * U) / U); d.style.width = 'max-content';
      const dw = d.offsetWidth, dh = d.offsetHeight; let x = lane.x0 + (lane.x1 - lane.x0 - dw) / 2, y = prefY - dh / 2; y = clamp(y, lane.y0, Math.max(lane.y0, lane.y1 - dh));
      x = clamp(x, sr.left + m, sr.right - m - dw); d.style.left = px((x - sr.left) / U); d.style.top = px((y - sr.top) / U); });
    dockT = setTimeout(placeDock, 1300); }
  /* the speaker is drawn, not an emoji (no emoji icons: Yoni's kids' rules) */
  function spkIcon() { const s = sv('svg', { viewBox: '0 0 24 24', width: '1.2em', height: '1.2em', 'aria-hidden': 'true' }); s.appendChild(sv('path', { d: 'M3 9h4l5-4v14l-5-4H3z', fill: 'currentColor' })); s.appendChild(sv('path', { d: 'M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' })); return s; }
  function say(txt, cls) { const d = dock(); if (!bubble) { bubble = el('div', 'bubble'); const sp = el('button', 'spk'); sp.type = 'button'; sp.appendChild(spkIcon()); sp.setAttribute('aria-label', t('listen')); sp.onclick = e => { e.stopPropagation(); speak(lastSaid); }; bubble.appendChild(sp); bubble.appendChild(el('span', 'txt')); $('.col', d).insertBefore(bubble, $('.actions', d)); }
    bubble.className = 'bubble' + (cls ? ' ' + cls : ''); $('.txt', bubble).textContent = txt; lastSaid = txt; if (S.autoVoice) speak(txt); placeDock(); }
  function clearSay() { if (bubble) { bubble.remove(); bubble = null; } }
  /* the voice: ElevenLabs through the kingdom's relay (never the device voice: Yoni 2026-09-28); silent when the relay cannot answer */
  const RELAY = 'https://elnmuuymfmlwnsynzgrh.supabase.co/functions/v1/kq-relay', VOICE = { cache: new Map(), cur: null, fails: 0, seq: 0 };
  function speak(text) { if (!text) return; const my = ++VOICE.seq; if (VOICE.cur) { try { VOICE.cur.pause(); } catch (e) {} VOICE.cur = null; } const clean = text.replace(/[✓✂◯🔔🔊]/g, '').trim(), key = S.lang + '|' + clean;
    const play = url => { if (my !== VOICE.seq) return; const a = new Audio(url); VOICE.cur = a; talking(true); a.onended = a.onpause = () => talking(false); a.play().catch(() => talking(false)); };
    if (VOICE.cache.has(key)) return play(VOICE.cache.get(key)); if (VOICE.fails >= 3) return;
    const body = S.lang === 'he' ? { text: clean, lang: 'he', persona: 'mommy' } : { text: clean, lang: S.lang };
    fetch(RELAY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(b => { VOICE.fails = 0; const u = URL.createObjectURL(b); VOICE.cache.set(key, u); play(u); }).catch(() => { VOICE.fails++; }); }
  /* the bear talks while the voice plays: the filmed talking clip (God Mode, keyed) stepped frame by frame; the still otherwise */
  const TALK = { meta: null, timer: null, f: 0 };
  function talking(on) { const b = $('.dock .bear', ui); if (!b) return; const im = $('.bearimg', b); b.classList.toggle('talk', on); clearInterval(TALK.timer); TALK.timer = null;
    if (!on || !TALK.meta) { im.style.backgroundImage = 'url(' + asset('helper.webp', 'felt') + ')'; im.style.backgroundSize = 'contain'; im.style.backgroundPosition = 'center bottom'; return; }
    const m = TALK.meta; im.style.backgroundImage = 'url(' + asset('helper_talk.webp', 'felt') + ')'; im.style.backgroundSize = (m.cols * 100) + '% ' + (m.rows * 100) + '%'; TALK.f = 0;
    const step = () => { const f = TALK.f++ % m.frames; im.style.backgroundPosition = ((f % m.cols) / (m.cols - 1) * 100) + '% ' + (Math.floor(f / m.cols) / (m.rows - 1) * 100) + '%'; }; step(); TALK.timer = setInterval(step, 1000 / 6); }
  function actions(list) { const box = $('.actions', dock()); box.replaceChildren(); placeDock(); return new Promise(res => { for (const [label, val, cls] of list) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = () => { box.replaceChildren(); res(val); }; box.appendChild(b); } }); }
  const teach = (txt, ms) => { say(txt, 'teach'); return wait(ms || 2600); };   /* a caption that moves on by itself */
  function pad(decimals) { return new Promise(res => { let p = $('.pad', ui); if (p) p.remove(); p = el('div', 'pad'); const val = el('div', 'val'); const u = el('small', null, t('unitCm')); let s = ''; const show = () => val.replaceChildren(document.createTextNode(s || '0'), u); show(); p.appendChild(val);
    const keys = el('div', 'keys'); const add = (lbl, f, cls) => { const b = el('button', cls || '', lbl); b.type = 'button'; b.onclick = f; keys.appendChild(b); };
    for (const d of ['7', '8', '9', '4', '5', '6', '1', '2', '3']) add(d, () => { if (s.replace('.', '').length < 4) { s += d; show(); } });
    add(decimals ? '.' : '', decimals ? () => { if (!s.includes('.')) { s = (s || '0') + '.'; show(); } } : () => {}); add('0', () => { if (s.replace('.', '').length < 4) { s += '0'; show(); } }); add('⌫', () => { s = s.slice(0, -1); show(); });
    add('✓', () => { if (!s || s === '.') return; p.remove(); res(parseFloat(s)); }, 'go'); p.appendChild(keys); ui.appendChild(p); }); }
  const badPad = () => { const p = $('.pad', ui); if (p) { p.classList.add('bad'); setTimeout(() => p.classList.remove('bad'), 700); } };
  function burst(x, y, n) { const box = $('#burst'); for (let i = 0; i < (n || 20); i++) { const s = el('i'); const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 16; s.style.left = px(x); s.style.top = px(y); s.style.setProperty('--dx', px(Math.cos(a) * d)); s.style.setProperty('--dy', px(Math.sin(a) * d - 6)); s.style.background = ['#ffe7a8', '#f2c14e', '#ff9fd0', '#8fd3ff', '#9df09d'][i % 5]; box.appendChild(s); setTimeout(() => s.remove(), 1200); } }

  /* ---------- what the kid measured stays on the right, until the client leaves (Yoni 2026-10-19: 'that number needs to stay on the right hand side') ---------- */
  function note(key, v) { C.notes = (C.notes || []).filter(n => n[0] !== key); C.notes.push([key, v]); let n = $('.notes', ui); if (!n) { n = el('div', 'notes'); ui.appendChild(n); }
    n.replaceChildren(el('div', 'nt', t('notes.title'))); for (const [k, val] of C.notes) { const r = el('div', 'nr'); r.append(el('span', 'nk', t('notes.' + k)), el('b', 'nv', fmt(val) + ' ' + t('unitCm'))); n.appendChild(r); }
    n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); placeDock(); }
  const clearNotes = () => { C.notes = []; const n = $('.notes', ui); if (n) n.remove(); };

  /* ---------- stages: a few chips, each one done is a success ---------- */
  const STG = { keys: [], done: 0 };
  function stages(keys) { STG.keys = keys; STG.done = 0; drawStages(); }
  function drawStages() { let s = $('.stages', ui); if (!s) { s = el('div', 'stages'); ui.appendChild(s); } s.replaceChildren(); STG.keys.forEach((k, i) => s.appendChild(el('span', 'stg' + (i < STG.done ? ' done' : i === STG.done ? ' now' : ''), (i < STG.done ? '✓ ' : '') + t('stage.' + k)))); }
  async function stageDone(msg) { if (msg) {}  STG.done++; drawStages(); const all = $('.stages', ui) ? [...$('.stages', ui).children] : [], c = all[STG.done - 1], s = stage.getBoundingClientRect(); if (c) { const r = c.getBoundingClientRect(); burst((r.left + r.width / 2 - s.left) / s.height * 100, (r.top + r.height / 2 - s.top) / s.height * 100, 14); } say(msg, 'ok'); await wait(1300); }
  const clearStages = () => { const s = $('.stages', ui); if (s) s.remove(); };

  /* ---------- rulers, drawn exactly, red 0 ---------- */
  function mkRuler(root, x0, y, len, pxcm, h) { h = h || 9; const g = sv('g', { class: 'ruler' }), step = PREC[S.tier];
    g.appendChild(sv('rect', { x: x0 - 1.2 * h / 9, y, width: len * pxcm + 2.4 * h / 9, height: h, rx: 0.5 * h / 9, fill: 'url(#rulerTex)', stroke: '#6a4a2a', 'stroke-width': 0.03 * h }));
    const fs = Math.min(h * 0.36, pxcm * 0.78);
    for (let v = 0; v <= len + 1e-9; v = +(v + step).toFixed(2)) { const x = x0 + v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
      g.appendChild(sv('line', { x1: x, y1: y, x2: x, y2: y + h * (whole ? 0.44 : half ? 0.3 : 0.17), stroke: v === 0 ? '#c0302b' : '#2a1a0a', 'stroke-width': Math.min(h * (whole ? 0.036 : half ? 0.026 : 0.016), pxcm * (whole ? 0.06 : 0.04)) }));
      if (whole) { const tx = sv('text', { x, y: y + h * 0.88, 'font-size': fs, 'text-anchor': 'middle', fill: v === 0 ? '#c0302b' : '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(Math.round(v)); g.appendChild(tx); } }
    root.appendChild(g); return { g, x0, y, h, pxcm, len, X: cm => x0 + cm * pxcm }; }
  function bodyRuler(root, x, y, len, pxcm) { const th = 4.4, g = sv('g', { style: 'cursor:grab', class: 'ruler' }), step = PREC[S.tier];
    g.appendChild(sv('rect', { x: x - 0.6, y, width: len * pxcm + 1.2, height: th, rx: 0.4, fill: '#f3e6c4', stroke: '#8a6a3a', 'stroke-width': 0.2 }));
    const fs = Math.min(th * 0.3, pxcm * 0.62);
    for (let v = 0; v <= len + 1e-9; v = +(v + step).toFixed(2)) { const P = v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6, L = th * (whole ? 0.42 : half ? 0.28 : 0.16), w = whole ? 0.16 : half ? 0.11 : 0.05;
      g.appendChild(sv('line', { x1: x + P, y1: y, x2: x + P, y2: y + L, stroke: v === 0 ? '#c0302b' : '#2a1a0a', 'stroke-width': w }));
      if (whole) { const tx = sv('text', { x: x + P, y: y + th * 0.88, 'text-anchor': 'middle', 'font-size': fs, fill: v === 0 ? '#c0302b' : '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(Math.round(v)); g.appendChild(tx); } }
    root.appendChild(g); return g; }

  /* ---------- reading: zoom into the very ruler on screen; hints, never the answer ---------- */
  async function readTable(R, value, prompt, topY) { const top = topY != null ? topY : R.y - 2, cy = (top + R.y + R.h) / 2 + (R.y + R.h - top) * 0.12, w = Math.max(SPAN[S.tier] * R.pxcm, (R.y + R.h - top + 4) * W / 100);
    near(t2s(R.X(value), top)); if (!noZoom()) await zoomVB(R.X(value), cy, w, 900); say(prompt); let miss = 0;
    for (;;) { window.__answer = value; const v = await pad(S.tier > 1); if (same(v, value)) { say(t('readYes', { n: fmt(value) }), 'ok'); await wait(900); await zoomOut(700); return; }
      miss++; badPad(); say(t('readNo', { v: fmt(v) }) + ' ' + t(miss === 1 ? 'hint1' : 'hint2'), 'bad'); } }
  async function readBody(x, y, value, prompt) { await camTo(x, y, READZ[S.tier], 900); near(w2s(x, y - 4)); say(prompt); let miss = 0;
    for (;;) { window.__answer = value; const v = await pad(S.tier > 1); if (same(v, value)) { say(t('readYes', { n: fmt(value) }), 'ok'); await wait(900); return; }
      miss++; badPad(); say(t('readNo', { v: fmt(v) }) + ' ' + t(miss === 1 ? 'hint1' : 'hint2'), 'bad'); } }
  /* a worked number: the kid types it; hints point at what is on screen; the working is never typed for them */
  async function askCalc(prompt, value, hints, tol) { say(prompt); let miss = 0;
    for (;;) { window.__answer = value; const v = await pad(S.tier > 1); if (same(v, value, tol)) { say(t('calcYes', { n: fmt(value) }), 'ok'); await wait(1100); return; }
      badPad(); say(t('readNo', { v: fmt(v) }) + ' ' + hints[Math.min(miss, hints.length - 1)], 'bad'); miss++; } }

  /* ---------- measuring on the body ---------- */
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
    nogeo(); near(w2s(cx, yc - 4)); say(t('tapeDone'), 'ok'); await wait(1200); clearOverlay(); await camTo(0, 0, 1, 500); }
  /* a ruler across the waist or the head: drag its red 0 onto the red line, read the blue line up close */
  async function acrossOnBody(which) { const b = figBox(), m = C.meta, head = which === 'head', chest = which === 'chest', gg = head ? m.g.hat : chest ? m.g.shirt : m.g.belt, pxcm = C.body.pxcm;
    const yc = head ? b.y(gg.y0 + (gg.y1 - gg.y0) * 0.75) : chest ? b.y(gg.chestY) : b.y(gg.y0 + (gg.y1 - gg.y0) / 2), value = head ? C.body.headAcross : chest ? C.body.chest : C.body.across, half = value * pxcm / 2, cx = chest ? b.x((gg.chestX0 + gg.chestX1) / 2) : b.x((gg.x0 + gg.x1) / 2);
    await camTo(cx, yc + 3, 2.1); dashed(overlay, cx - half, yc - 5, cx - half, yc + 7, '#e8343a'); const endLine = dashed(overlay, cx + half, yc - 5, cx + half, yc + 7, '#3a7aff'); endLine.setAttribute('opacity', 0);
    say(t(head ? 'rulerHead' : chest ? 'rulerChest' : 'rulerAcross', { name: cname() })); const a = { x: cx - half, y: yc + 1.5 }, off0 = -8, start = { x: a.x + off0, y: a.y };
    const gr = bodyRuler(overlay, start.x, start.y, 11, pxcm); const grab = { x: start.x + 3, y: start.y + 2.2 }; const ring = pulse(overlay, grab.x, grab.y, 2.6);
    geo({ kind: 'drag', from: w2s(grab.x, grab.y), to: w2s(grab.x - off0, grab.y) });
    let pos = 0, offset = 0, ok = false; const set = v => { pos = v; gr.setAttribute('transform', 'translate(' + v.toFixed(3) + ' 0)'); };
    await new Promise(res => drag(gr, 'world', (p, first) => { if (ok) return; ring.remove(); if (first) offset = p.x - pos; set(clamp(p.x - offset, -14, 22)); }, () => { if (ok) return; if (Math.abs(pos + off0) <= 0.45 * pxcm) { ok = true; set(-off0); say(t('zeroOk'), 'ok'); setTimeout(res, 700); } else say(t('zeroNo'), 'bad'); }));
    nogeo(); endLine.setAttribute('opacity', 1); await wait(400); await readBody(cx + half, yc + 3.7, value, t('readBlue')); note(head ? 'head' : chest ? 'chest' : 'waist', value); await camTo(0, 0, 1, 600); clearOverlay(); return value; }

  /* a ruler down the leg, beside the pants (the side away from a tail): drag its red 0 onto the red line at the waist, read the blue line at the ankle */
  async function lengthOnBody() { const b = figBox(), g = C.meta.g.pants, pxcm = C.body.pxcm, value = C.body.leg, x = b.x(g.x0) - 0.8, y0 = b.y(g.y0), y1 = y0 + value * pxcm;
    await camTo(x, (y0 + y1) / 2, 1.9); dashed(overlay, x - 7, y0, x + 5, y0, '#e8343a'); const endLine = dashed(overlay, x - 7, y1, x + 5, y1, '#3a7aff'); endLine.setAttribute('opacity', 0);
    say(t('rulerLeg', { name: cname() })); const off0 = -8, outer = sv('g', { style: 'cursor:grab' }), inner = sv('g', { transform: 'rotate(90)' }); outer.appendChild(inner); overlay.appendChild(outer);
    bodyRuler(inner, 0, 0, Math.ceil(value + 3), pxcm); inner.querySelectorAll('text').forEach(tx => tx.setAttribute('transform', 'rotate(-90 ' + tx.getAttribute('x') + ' ' + (+tx.getAttribute('y') - 0.5) + ')'));   /* digits upright on the standing ruler */
    const set = v => outer.setAttribute('transform', 'translate(' + x.toFixed(3) + ' ' + (y0 + v).toFixed(3) + ')'); let pos = off0; set(pos);
    const grab = { x: x - 2.2, y: y0 + off0 + 3 }, ring = pulse(overlay, grab.x, grab.y, 2.6); geo({ kind: 'drag', from: w2s(grab.x, grab.y), to: w2s(grab.x, grab.y - off0) });
    let offset = 0, ok = false; await new Promise(res => drag(outer, 'world', (p, first) => { if (ok) return; ring.remove(); if (first) offset = p.y - pos; pos = clamp(p.y - offset, -16, 14); set(pos); }, () => { if (ok) return; if (Math.abs(pos) <= 0.45 * pxcm) { ok = true; pos = 0; set(0); say(t('zeroOk'), 'ok'); setTimeout(res, 700); } else say(t('zeroNo'), 'bad'); }));
    nogeo(); endLine.setAttribute('opacity', 1); await wait(400); await readBody(x - 2.2, y1, value, t('readBlue')); note('leg', value); await camTo(0, 0, 1, 600); clearOverlay(); return value; }

  /* ---------- the table ---------- */
  function tableOn(on) { stage.classList.toggle('atTable', on); if (!on) { table.replaceChildren(); VB.x = 0; VB.y = 0; VB.w = W; VB.h = 100; setVB(); } }
  function tableBase(fab) { table.replaceChildren(); VB.x = 0; VB.y = 0; VB.w = W; VB.h = 100; setVB(); const defs = sv('defs'); table.appendChild(defs);
    const tex = (id, href, w, h) => { const p = sv('pattern', { id, patternUnits: 'userSpaceOnUse', width: w, height: h }); p.appendChild(sv('image', { href, width: w, height: h, preserveAspectRatio: 'none' })); defs.appendChild(p); };
    tex('rulerTex', asset('rulertex.webp'), 30, 9); tex('tapeTex', asset('tapetex.webp'), 24, 3.4);
    table.appendChild(sv('image', { href: asset('table.webp'), x: 0, y: 0, width: W, height: 100, preserveAspectRatio: 'xMidYMid slice' })); }
  async function toTable(fab) { clearOverlay(); await camTo(0, 0, 1, 400); tableBase(fab); tableOn(true); await wait(450); }
  async function leaveTable() { if (!stage.classList.contains('atTable')) return; await zoomOut(400); tableOn(false); }
  function tapeStrip(R, fromCm, toCm, y, h, col) { const g = sv('g', { class: 'slide' }); g.appendChild(sv('rect', { x: R.X(fromCm), y, width: (toCm - fromCm) * R.pxcm, height: h, fill: col || 'url(#tapeTex)', stroke: '#8a6a10', 'stroke-width': 0.2 }));
    g.appendChild(sv('rect', { x: R.X(toCm) - 0.35, y: y - 0.4, width: 0.7, height: h + 0.8, rx: 0.25, fill: '#8a4a10' })); table.appendChild(g); return g; }
  function slideIn(g, dx, dy, ms) { ms = ms || 900; g.style.transform = 'translate(' + px(dx) + ',' + px(dy) + ')'; g.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transition = 'transform ' + ms + 'ms cubic-bezier(.3,1,.4,1), opacity .5s'; g.style.transform = 'translate(0,0)'; g.style.opacity = '1'; })); return wait(ms + 100); }
  function pulseT(cx, cy, r) { const g = sv('g'); pulse(g, cx, cy, r); table.appendChild(g); return g; }
  function flyAway(node) { if (!node) return wait(10); node.style.transition = 'transform .7s ease-in, opacity .6s'; node.style.transformBox = 'fill-box'; node.style.transformOrigin = 'center'; node.style.transform = 'translateY(-60%) scale(.4)'; node.style.opacity = '0'; return wait(700); }
  /* drag a marker along a ruler; when the kid lets go the table zooms in on it by itself; the kid can still move it, then presses the button */
  async function setOnRuler(R, start, target, label, btn, onSet, grabY) { let at = start; const handle = sv('g', { style: 'cursor:grab' }); const draw = () => onSet(at, handle); table.appendChild(handle); draw();
    const ring = pulseT(R.X(at), grabY, 3);
    window.__target = target; geo({ kind: 'drag', from: t2s(R.X(at), grabY), to: t2s(R.X(target), grabY), mark: true, pxcm: R.pxcm * W / VB.w });
    let moved = false, zoomed = false, locked = false; drag(handle, 'table', p => { if (locked) return; moved = true; ring.remove(); at = clamp(snap((p.x - R.x0) / R.pxcm), PREC[S.tier], R.len); draw(); }, async () => { if (locked) return; if (!zoomed && moved) { zoomed = true; if (!noZoom()) await zoomVB(R.X(at), R.y + R.h * 0.3, Math.max(SPAN[S.tier] * R.pxcm * 1.5, (R.h + 8) * W / 100), 700); draw(); near(t2s(R.X(at), grabY - 6)); say(label); geo({ kind: 'press', fine: true }); } });
    await new Promise(res => { const iv = setInterval(() => { if (zoomed) { clearInterval(iv); res(); } }, 120); });
    await actions([[btn, 1]]); locked = true; nogeo(); await zoomOut(600); draw(); return { at, handle }; }

  /* ---------- the belt: the way round ---------- */
  async function beltPiece(fab, again) { const B = C.body, need = B.round; stages(['measure', 'cut', 'wear']);
    if (S.tier < 3) { /* the tape goes round; the same tape lies on the cloth */ if (!again) { if (!S.taught.round) { await teach(t('teachRound'), 2600); S.taught.round = true; save(); } await tapeRound(); } }
    else if (!again) { /* 11+: across, then 3.14 × across */ await acrossOnBody('waist'); }
    await toTable(fab); const R = mkRuler(table, 14, 62, Math.ceil(need + 3), (W - 28) / Math.ceil(need + 3), 9);
    const stripImg = sv('image', { href: await clothURL('cl_strip', fab, 2.2), x: R.X(0), y: 36, width: R.X(need + 2.5) - R.X(0), height: 14, preserveAspectRatio: 'none', class: 'slide' }); table.insertBefore(stripImg, R.g); await slideIn(stripImg, 30, 0, 700);
    if (S.tier < 3) { const tape = tapeStrip(R, 0, need, 54.5, 3.4); if (!again) { say(t('layTape')); await slideIn(tape, -20, -20); await readTable(R, need, t('readTape'), 52); note('round', need); } }
    else if (!again) { /* the way round is 3.14 times across: the width laid three times and a bit */ const D = B.across; say(t('piRods', { d: fmt(D) }));
      for (let i = 0; i < 3; i++) { const rod = sv('rect', { x: R.X(i * D), y: 54.5, width: D * R.pxcm, height: 3.4, fill: i % 2 ? '#7fb8ff' : '#3a7aff', stroke: '#1a3a8a', 'stroke-width': 0.2 }); table.appendChild(rod); await slideIn(rod, 0, -14, 600); }
      const bit = sv('rect', { x: R.X(3 * D), y: 54.5, width: 0.14 * D * R.pxcm, height: 3.4, fill: '#ffcf6a', stroke: '#8a6a10', 'stroke-width': 0.2 }); table.appendChild(bit); await slideIn(bit, 0, -14, 600); await teach(t('piSays'), 3000);
      if (!S.taught.pi) { S.taught.pi = true; save(); } await askCalc(t('calcRound', { d: fmt(D) }), need, [t('hintPi', { d: fmt(D) }), t('hintPi2', { d: fmt(D) })], 0.12); note('round', need); }
    await stageDone(t('ok.measure'));
    /* chalk where it ends, cut */
    const line = sv('line', { x1: R.X(1), y1: 35, x2: R.X(1), y2: 51, stroke: '#fff', 'stroke-width': 0.6, 'stroke-dasharray': '1.1 0.7', style: 'pointer-events:none' });
    const { at } = await setOnRuler(R, 1, need, t('fineChalk'), t('cut'), (cm, h) => { h.replaceChildren(); line.setAttribute('x1', R.X(cm)); line.setAttribute('x2', R.X(cm)); if (!line.parentNode) table.appendChild(line); const k = VB.w / W; h.appendChild(sv('image', { class: 'grip', href: asset('chalk.webp'), x: R.X(cm) - 4.5 * k, y: 35 - 9 * k, width: 9 * k, height: 9 * k })); h.appendChild(sv('rect', { x: R.X(cm) - 4.5 * k, y: 35 - 9 * k, width: 9 * k, height: 26 + 9 * k, fill: 'transparent' })); }, 40);
    say(t('snip')); await snip(R.X(at), 35, 51); stripImg.setAttribute('width', R.X(at) - R.X(0)); line.remove(); await stageDone(t('ok.cut')); await flyAway(stripImg);
    return { got: at, need }; }
  async function snip(x, y0, y1) { const sc = sv('image', { href: asset('scissors.webp'), x: x - 6, y: y0 - 12, width: 12, height: 12 }); table.appendChild(sc); for (let i = 0; i <= 10; i++) { sc.setAttribute('y', y0 - 12 + (y1 - y0 + 6) * i / 10); await wait(40); } sc.remove(); }

  /* ---------- pants and shirt: measure on the body, mark it on the cloth with the chalk, cut ---------- */
  async function straightPiece(kind, fab, again) { const pants = kind === 'pants', need = pants ? C.body.leg : C.body.chest; stages(['measure', 'cut', 'wear']);
    if (!again) { const tk = pants ? 'leg' : 'chest'; if (!S.taught[tk]) { await teach(t(pants ? 'teachLeg' : 'teachChest'), 2600); S.taught[tk] = true; save(); }
      if (pants) await lengthOnBody(); else await acrossOnBody('chest'); await stageDone(t('ok.measure')); }
    await toTable(fab); const R = mkRuler(table, 14, 62, Math.ceil(need + 3), (W - 28) / Math.ceil(need + 3), 9), ch = pants ? 14 : 22, cy = 50 - ch;
    const cloth = sv('image', { href: await clothURL(pants ? 'cl_strip' : 'cl_sheet', fab, pants ? 2.2 : 4), x: R.X(0), y: cy, width: R.X(need + 2.5) - R.X(0), height: ch, preserveAspectRatio: 'none', class: 'slide' }); table.insertBefore(cloth, R.g); await slideIn(cloth, 30, 0, 700);
    say(t('markIt', { n: fmt(need) })); await wait(1400);
    const line = sv('line', { x1: R.X(1), y1: cy - 1, x2: R.X(1), y2: R.y + 1.5, stroke: '#fff', 'stroke-width': 0.6, 'stroke-dasharray': '1.1 0.7', style: 'pointer-events:none' });   /* down to the ruler, so the mark reads on it */
    const { at } = await setOnRuler(R, 1, need, t('fineChalkN', { n: fmt(need) }), t('cut'), (cm, h) => { h.replaceChildren(); line.setAttribute('x1', R.X(cm)); line.setAttribute('x2', R.X(cm)); if (!line.parentNode) table.appendChild(line); const k = VB.w / W; h.appendChild(sv('image', { class: 'grip', href: asset('chalk.webp'), x: R.X(cm) - 4.5 * k, y: cy - 1 - 9 * k, width: 9 * k, height: 9 * k })); h.appendChild(sv('rect', { x: R.X(cm) - 4.5 * k, y: cy - 1 - 9 * k, width: 9 * k, height: ch + 2 + 9 * k, fill: 'transparent' })); }, cy + ch / 2);
    say(t('snip')); await snip(R.X(at), cy - 1, 51); cloth.setAttribute('width', R.X(at) - R.X(0)); line.remove(); await stageDone(t('ok.cut')); await flyAway(cloth);
    return { got: at, need }; }

  /* ---------- circles: the radius, then the straight compass on the cloth ---------- */
  async function circlePiece(kind, fab, again) { const B = C.body, hat = kind === 'hat'; let r;
    stages(['measure', 'radius', 'compass', 'wear']);
    if (!again) {
      if (S.tier < 3 || hat) { const D = await acrossOnBody(hat ? 'head' : 'waist'); r = snap(D / 2); await stageDone(t('ok.measure'));
        /* fold the width in half: that is the radius */ await toTable(fab); const R = mkRuler(table, 14, 62, Math.ceil(D + 3), (W - 28) / Math.ceil(D + 3), 9); const y = R.y - 2.6;
        const wl = sv('line', { x1: R.X(0), y1: y, x2: R.X(D), y2: y, stroke: '#3a7aff', 'stroke-width': 1.1, 'stroke-linecap': 'round' }); table.appendChild(wl);
        say(t(S.taught.half ? 'foldIt' : 'foldTeach')); S.taught.half = true; save(); const end = sv('circle', { cx: R.X(D), cy: y, r: 2.4, fill: '#3a7aff', stroke: '#fff', 'stroke-width': 0.4, style: 'cursor:grab' }); table.appendChild(end); const ring = pulseT(R.X(D), y, 2.4);
        geo({ kind: 'drag', from: t2s(R.X(D), y), to: t2s(R.X(0), y), steps: 12 });
        await new Promise(res => { let done = false; drag(end, 'table', p => { if (done) return; ring.remove(); const cm = clamp((p.x - R.x0) / R.pxcm, 0, D); end.setAttribute('cx', R.X(cm)); wl.setAttribute('x2', R.X((D + cm) / 2)); if (cm <= 0.6) { done = true; res(); } }, () => { if (!done) { end.setAttribute('cx', R.X(D)); wl.setAttribute('x2', R.X(D)); } }); });
        nogeo(); end.remove(); wl.setAttribute('x2', R.X(r)); table.appendChild(sv('path', { d: 'M' + R.X(r) + ' ' + (y - 1.1) + ' l -1 -2 h 2 z', fill: '#3a7aff' })); await readTable(R, r, t('readFold'), y - 4); note('radius', r);
      } else { /* 11+: the tape round the waist; radius = round ÷ 6.28 */ await tapeRound(); await toTable(fab); const Cr = B.round, R = mkRuler(table, 14, 62, Math.ceil(Cr + 3), (W - 28) / Math.ceil(Cr + 3), 9); const tape = tapeStrip(R, 0, Cr, 54.5, 3.4); await slideIn(tape, -20, -20); await readTable(R, Cr, t('readTape'), 52); note('round', Cr); await stageDone(t('ok.measure'));
        r = Math.round(Cr / 6.28 * 10) / 10; const D = Cr / Math.PI; say(t('piBack')); for (let i = 0; i < 3; i++) { const rod = sv('rect', { x: R.X(i * D), y: 49.5, width: D * R.pxcm, height: 3.4, fill: i % 2 ? '#7fb8ff' : '#3a7aff', stroke: '#1a3a8a', 'stroke-width': 0.2 }); table.appendChild(rod); await slideIn(rod, 0, -12, 500); }
        await teach(t('piBack2'), 2600); await askCalc(t('calcRadius', { c: fmt(Cr) }), r, [t('hintR1', { c: fmt(Cr) }), t('hintR2', { c: fmt(Cr) })], 0.1); note('radius', r); }
      C.radius = C.radius || {}; C.radius[kind] = r; await stageDone(t('ok.radius'));
    } else r = C.radius[kind];
    /* the compass: cloth on the table, the pin in its centre, the chalk slid along the straight bar to the radius, then swung round */
    await leaveTable(); await toTable(fab); const side = hat ? Math.max(2 * r + 3, 8) : 2 * (r + Math.max(5, Math.round(r * 1.4))), pxcm = Math.min(4, 72 / side), cx = W * 0.38, cy = 48, s = side * pxcm;
    const cloth = sv('image', { href: await clothURL(hat ? 'cl_sheet' : 'cl_disc', fab, 6), x: cx - s / 2, y: cy - s / 2, width: s, height: s, class: 'slide' }); table.appendChild(cloth); await slideIn(cloth, 0, 24, 700);
    const cm = A.meta._cloth.beam, bl = (Math.ceil(r + 4)) * pxcm, bh = bl * cm.h / cm.w, pinX = 0.06 * bl, barMid = (cm.barY0 + cm.barY1) / 2 * bh, barHalf = (cm.barY1 - cm.barY0) / 2 * bh;
    const R = mkRuler(table, cx, cy + barHalf + 0.4, Math.ceil(r + 3), pxcm, Math.max(3.6, pxcm * 1.7)); R.g.style.opacity = '0.97';
    const beam = sv('g'); const bImg = sv('image', { href: asset('beam.webp'), x: cx - pinX, y: cy - barMid, width: bl, height: bh, preserveAspectRatio: 'none' }); beam.appendChild(bImg); table.appendChild(beam);
    if (!S.taught.pin) { await teach(t('teachPin'), 2600); S.taught.pin = true; save(); } else say(t('pinIn'));
    await slideIn(beam, -20, -20, 800); beam.style.transition = ''; beam.style.transform = ''; for (const n of [beam]) { n.style.transformBox = 'view-box'; n.style.transformOrigin = '0 0'; }
    table.appendChild(sv('circle', { cx, cy, r: 0.9, fill: '#3a3a4a' }));
    let chalk = null; const { at, handle } = await setOnRuler(R, 1, r, t('fineCompass'), t('swing'), (v, h) => { h.replaceChildren(); const k = VB.w / W; chalk = sv('image', { class: 'grip', href: asset('chalk.webp'), x: R.X(v) - 3.5 * k, y: cy - 7 * k, width: 7 * k, height: 7 * k }); h.appendChild(sv('line', { x1: R.X(v), y1: cy - 0.6, x2: R.X(v), y2: R.y + R.h * 0.45, stroke: '#ff3a8a', 'stroke-width': 0.35 * k })); h.appendChild(chalk); h.appendChild(sv('rect', { x: R.X(v) - 4 * k, y: cy - 8 * k, width: 8 * k, height: 9 * k, fill: 'transparent' })); }, cy - 3.5);
    /* swing: the kid drags the chalk all the way round; the straight bar turns with it */
    R.g.style.transition = 'opacity .4s'; R.g.style.opacity = '0'; const rr = at * pxcm, circle = sv('path', { d: '', fill: 'none', stroke: '#fff', 'stroke-width': 0.6 }); table.appendChild(circle); table.appendChild(handle);
    handle.querySelectorAll('line').forEach(l => l.remove()); handle.style.transformBox = 'view-box'; handle.style.transformOrigin = '0 0'; say(t(S.taught.swing ? 'swingIt' : 'swingTeach', { n: fmt(at) })); S.taught.swing = true; save(); const ring2 = pulseT(cx + rr, cy, 3);
    geo({ kind: 'round', c: t2s(cx, cy), R: rr * W / VB.w, edge: t2s(cx + s / 2, cy) });
    await new Promise(res => { let cov = 0, lastA = null, done = false, a0 = 0; drag(handle, 'table', (p, first) => { if (done) return; ring2.remove(); const a = Math.atan2(p.y - cy, p.x - cx); if (lastA != null && !first) { let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; cov += d; } lastA = a;
        const deg = a * 180 / Math.PI; beam.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' ' + cx + ' ' + cy + ')'); handle.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' ' + cx + ' ' + cy + ')');
        const n = Math.max(2, Math.round(Math.abs(cov) / 0.08)); let d = ''; for (let i = 0; i <= n; i++) { const th = a - cov * (1 - i / n); d += (i ? 'L' : 'M') + (cx + Math.cos(th) * rr).toFixed(2) + ' ' + (cy + Math.sin(th) * rr).toFixed(2) + ' '; } circle.setAttribute('d', d);
        if (Math.abs(cov) >= Math.PI * 1.9) { done = true; res(); } }, () => {}); });
    nogeo(); circle.setAttribute('d', 'M' + (cx + rr) + ' ' + cy + ' A' + rr + ' ' + rr + ' 0 1 1 ' + (cx - rr) + ' ' + cy + ' A' + rr + ' ' + rr + ' 0 1 1 ' + (cx + rr) + ' ' + cy); circle.setAttribute('stroke-dasharray', '1 0.6');
    beam.style.transition = 'opacity .4s'; beam.style.opacity = '0'; handle.remove(); await stageDone(t('ok.compass', { n: fmt(at) }));
    /* the scissors go round by themselves; the hole opens (skirt) or the disc comes out (beret) */
    say(t(hat ? 'cutDisc' : 'cutHole')); const sc = sv('image', { href: asset('scissors.webp'), width: 10, height: 10 }); table.appendChild(sc);
    for (let i = 0; i <= 36; i++) { const a = i / 36 * Math.PI * 2; sc.setAttribute('x', cx + Math.cos(a) * rr - 5); sc.setAttribute('y', cy + Math.sin(a) * rr - 5); await wait(28); } sc.remove(); circle.remove();
    const fr = at / side; cloth.setAttribute('href', await clothURL(hat ? 'cl_sheet' : 'cl_disc', fab, 6, hat ? (g, w, h) => { g.beginPath(); g.rect(0, 0, w, h); g.arc(w / 2, h / 2, fr * w, 0, Math.PI * 2, true); g.fill('evenodd'); } : (g, w, h) => { g.beginPath(); g.arc(w / 2, h / 2, fr * w, 0, Math.PI * 2); g.fill(); }));
    await wait(900); await flyAway(cloth); return { got: at, need: r }; }

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
    for (const k of kinds) { const it = el('div', 'item' + (done.includes(k) ? ' done' : '')), ic = el('div', 'ico'), g = gOf(k), gw = g.x1 - g.x0, gh = (g.y1 - g.y0) / C.meta.aspect, f = 0.86 / Math.max(gw, gh);
      ic.style.backgroundImage = 'url(' + asset('g_' + C.key + '_' + layerOf(k) + '.webp') + ')'; ic.style.backgroundSize = (f * 100).toFixed(1) + '% auto';
      const Iw = f, Ih = f / C.meta.aspect, bx = Iw === 1 ? 0 : (0.5 - (g.x0 + g.x1) / 2 * Iw) / (1 - Iw), by = (0.5 - (g.y0 + g.y1) / 2 * Ih) / (1 - Ih); ic.style.backgroundPosition = (bx * 100).toFixed(1) + '% ' + (by * 100).toFixed(1) + '%';
      it.append(ic, el('span', null, pname(k) + (done.includes(k) ? ' ✓' : ''))); o.appendChild(it); } }
  const clearOrder = () => { const o = $('.order', ui); if (o) o.remove(); };
  async function outfitCanvas(o) { const img = await loadImg(asset(o.client + '.webp', o.look)); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    for (const p of o.pieces.slice().sort((a, b) => Z[a.kind] - Z[b.kind])) { const cv = document.createElement('canvas'); await paintGarment(cv, o.client, (o.look === 'felt' && p.kind === 'circleSkirt') ? 'skirt' : p.kind, p.fab, o.look); g.drawImage(cv, 0, 0); } return c; }
  async function openCloset() { let c = $('.closet', ui); if (c) { c.remove(); return; } c = el('div', 'closet'); const top = el('div', 'closetTop'); const back = el('button', 'btn ghost', t('back')); back.onclick = () => c.remove(); top.appendChild(back); c.appendChild(top); ui.appendChild(c);
    if (!S.wardrobe.length) { c.appendChild(el('p', null, t('wardrobeEmpty'))); return; } const grid = el('div', 'grid'); c.appendChild(grid);
    for (const o of S.wardrobe.slice().reverse()) { const it = el('div', 'item'); grid.appendChild(it); try { it.appendChild(await outfitCanvas(o)); } catch (e) {} it.appendChild(el('small', null, t('wardrobeOf', { name: t('client.' + o.client), d: o.day }))); } }

  /* ---------- one client ---------- */
  async function makeAndWear(kind, fab) { let again = false;
    for (;;) { const res = kind === 'belt' ? await beltPiece(fab, again) : (kind === 'pants' || kind === 'shirt') ? await straightPiece(kind, fab, again) : await circlePiece(kind, fab, again); await leaveTable(); clearOverlay();
      const b = figBox(), g = gOf(kind); say(t('done.' + kind), 'ok'); await camTo(b.cx, b.y((g.y0 + g.y1) / 2), kind === 'hat' ? 1.7 : 1.3, 700); await wait(300);
      const d = res.got - res.need, st = d > TOL[S.tier] ? { big: true } : d < -TOL[S.tier] ? { small: true } : {}; await wear(kind, fab, st); burst(W / 2, 45, 30); near(w2s(b.x(g.x1), b.y((g.y0 + g.y1) / 2)));
      if (!st.big && !st.small) { STG.done = STG.keys.length; drawStages(); say(t('fit.perfect', { piece: pname(kind) }), 'ok'); await wait(1800); return; }
      say(t('fit.' + kind + (st.big ? 'Big' : 'Small'), { piece: pname(kind) }), 'bad'); await actions([[t('again'), 1]]); const cv = C.cv[kind]; if (cv) { cv.remove(); delete C.cv[kind]; } again = true; } }
  async function serve() { const CL = CLIENTS[S.look] || CLIENTS.felt, key = CL[(S.seen++) % CL.length], kinds = ORDER(key); save(); clearOverlay(); tableOn(false);
    clearNotes(); await placeClient(key); const done = [], pieces = []; C.radius = {}; orderCard(kinds, done);
    near(null); const names = kinds.map(k => t('aPiece.' + k)); say(t('wish.' + key, { pieces: names.length > 1 ? names.slice(0, -1).join(', ') + ' ' + t('and') + names[names.length - 1] : names[0] })); await actions([[t('start'), 1]]);
    for (const kind of kinds) { const fab = await pickFabric(pname(kind)); await makeAndWear(kind, fab); pieces.push({ kind, fab }); done.push(kind); orderCard(kinds, done); clearStages(); await camTo(0, 0, 1, 500); }
    const pay = kinds.length * 3; S.coins += pay; S.rep++; hud(); const b = figBox(); await camTo(b.cx, b.top + H * 0.5, 1.15, 600); burst(W / 2, 35, 30);
    say(t('paid.' + (BOY[key] ? 'm' : 'f'), { name: cname(), c: pay }) + ' ' + t('star'), 'ok'); S.wardrobe.push({ client: key, look: S.look, day: S.day, pieces }); S.day++; save();
    await actions([[t('nextClient'), 1]]); say(t('happy')); await camTo(0, 0, 1); clientLeave(); clearOrder(); clearNotes(); await wait(1200); clearSay(); }

  /* ---------- start ---------- */
  function startSheet() { return new Promise(res => { const sh = el('div', 'sheet'); const card = el('div', 'card'); card.appendChild(el('h1', null, t('title'))); card.appendChild(el('p', null, t('subtitle')));
    const name = el('input'); name.placeholder = t('yourName'); name.value = S.name || ''; card.appendChild(name); card.appendChild(el('p', 'q', t('howOld')));
    const ages = el('div', 'row'); let age = S.age; for (let a = 4; a <= 15; a++) { const b = el('button', a === age ? 'on' : '', a === 15 ? '15+' : String(a)); b.type = 'button'; b.onclick = () => { age = a; [...ages.children].forEach(x => x.classList.toggle('on', x === b)); }; ages.appendChild(b); } card.appendChild(ages);
    const langs = el('div', 'row'); for (const [id, lbl] of [['he', 'עברית'], ['en', 'English']]) { const b = el('button', id === S.lang ? 'on' : '', lbl); b.type = 'button'; b.onclick = () => { S.lang = id; S.name = name.value.trim() || S.name; S.age = age; save(); location.reload(); }; langs.appendChild(b); } card.appendChild(langs);
    const go = el('button', 'btn big', t('open')); go.type = 'button'; go.onclick = () => { S.name = name.value.trim() || S.name || '?'; S.age = age; S.tier = age <= 6 ? 1 : age <= 10 ? 2 : 3; S.look = age <= 6 ? 'felt' : 'nature'; save(); sh.remove(); res(); }; card.appendChild(go); sh.appendChild(card); ui.appendChild(sh); }); }
  async function main() { load(); $('#ver').textContent = 'v' + VERSION; document.documentElement.lang = S.lang; document.documentElement.dir = T().dir; document.title = t('title') + ' · Kingdom Quest';
    await startSheet(); await loadLook(); hud();
    for (;;) { loopPlay(true); near(null); say(t('waiting')); await actions([[t('ring'), 1, 'big']]); loopPlay(false); clearSay(); await serve(); } }
  window.AT = { S, t, get W() { return W; }, get cam() { return CAM; }, get C() { return C; }, get VB() { return VB; } };
  main();
})();
