/* Kingdom Quest — סדנת אומן / the Atelier, v2 (Yoni 2026-10-19 on v1: 'the background keeps on moving ... the measurements is really hard and small
   ... everything is small ... it's not a game, you're giving the answers ... it's not letting you choose the colors and patterns that we had before').
   v2 rules:
   · the shop is a STILL while the kid works; the filmed loop plays only while the shop waits for the next client;
   · everything is sized for a child: the camera moves in on the client to measure (the shop blurs behind), the ruler and tape are read in a big
     magnifier, the cutting table fills the screen, buttons and words are large;
   · NO NUMBER IS EVER GIVEN: the kid reads the tape and the ruler, the reading goes into the notebook, the pattern is worked out from the notebook
     and the rules, the chalk has no number on it, the fit is judged on the body without saying by how much; wrong answers get hints, never the answer;
   · every fabric is a filmed colour × one of the Doll Studio's patterns (dots, stripes, gingham, flowers, hearts, stars, zigzag, plain).
   Tiers by age: 1 (to 6) whole cm, skirt + belt; 2 (7–10) half cm, a circle skirt's hole = half the width across; 3 (11+) mm, hole = round ÷ 6.28.
   Looks: felt to 6, nature-tech from 7 (Yoni 2026-10-19: voxel dropped). */
(function () {
  'use strict';
  const VERSION = 2;
  const $ = (s, r) => (r || document).querySelector(s), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const NS = 'http://www.w3.org/2000/svg', sv = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a || {}) e.setAttribute(k, a[k]); return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms)), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const stage = $('#stage'), world = $('#world'), scene = $('#scene'), overlay = $('#overlay'), table = $('#table'), ui = $('#ui'), actors = $('#actors');
  const PREC = { 1: 1, 2: 0.5, 3: 0.1 }, TOL = { 1: 0.4, 2: 0.3, 3: 0.06 }, H = 56, CLIENT_CM = 30;
  const CLIENTS = ['girl', 'boy', 'grandma', 'bear', 'fox', 'princess'], COLOURS = ['fab_pink', 'fab_blue', 'fab_yellow', 'fab_green', 'fab_purple', 'fab_red'];
  const KINDS = ['plain', 'dots', 'stripes', 'gingham', 'flowers', 'hearts', 'stars', 'zigzag'];

  /* ---------- state and save ---------- */
  const S = { lang: 'he', look: 'felt', tier: 1, name: '', age: 6, coins: 12, rep: 0, day: 1, wardrobe: [], seen: 0 };
  const KEY = 'kq_atelier_v2';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.name) { Object.assign(S, j); return; } const o = JSON.parse(localStorage.getItem('kq_atelier_v1') || 'null'); if (o && o.name) { S.name = o.name; S.age = o.age || 6; S.lang = o.lang || 'he'; } } catch (e) {} }
  const T = () => window.AT_STR[S.lang] || window.AT_STR.en;
  const look = (o, k) => k.split('.').reduce((a, p) => (a && a[p] != null ? a[p] : null), o);
  const t = (k, v) => { let s = look(T(), k); if (s == null) s = look(window.AT_STR.en, k); if (s == null) s = k; return String(s).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m)); };
  const snapTo = (v, p) => +(Math.round(v / p) * p).toFixed(2), snap = v => snapTo(v, PREC[S.tier]);
  const fmt = v => { const r = Math.round(v * 10) / 10; return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(1); };
  const same = (a, b, tol) => Math.abs(a - b) <= (tol != null ? tol : PREC[S.tier] / 4) + 1e-6;
  const cname = () => t('client.' + C.key);

  /* ---------- the stage: 1u = 1 % of its height; the world (shop, client, measuring) zooms, the UI does not ---------- */
  let U = 9, W = 177.78;
  const px = v => 'calc(var(--u) * ' + (+v).toFixed(3) + ' * 1px)';
  function measure() { const r = stage.getBoundingClientRect(); U = r.height / 100; W = 100 * r.width / r.height; stage.style.setProperty('--u', U.toFixed(4)); for (const s of [overlay, table]) s.setAttribute('viewBox', '0 0 ' + W.toFixed(3) + ' 100'); }
  window.addEventListener('resize', () => { measure(); applyCam(0); }); measure();
  const CAM = { z: 1, tx: 0, ty: 0 };
  function applyCam(ms) { world.style.transition = ms ? 'transform ' + ms + 'ms cubic-bezier(.4,0,.2,1)' : 'none'; world.style.transform = 'translate(' + px(CAM.tx) + ', ' + px(CAM.ty) + ') scale(' + CAM.z + ')'; scene.style.filter = CAM.z > 1.05 ? 'blur(2.5px) brightness(.8)' : ''; }
  function camTo(fx, fy, z, ms) { ms = ms == null ? 800 : ms; let tx = W / 2 - fx * z, ty = 50 - fy * z; if (z <= 1) { z = 1; tx = 0; ty = 0; } tx = clamp(tx, W - W * z, 0); ty = clamp(ty, 100 - 100 * z, 0); Object.assign(CAM, { z, tx, ty }); applyCam(ms); return wait(ms + 40); }
  const w2s = (x, y) => ({ x: CAM.tx + x * CAM.z, y: CAM.ty + y * CAM.z });
  const spt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.height * 100, y: (e.clientY - r.top) / r.height * 100 }; };
  const wpt = e => { const s = spt(e); return { x: (s.x - CAM.tx) / CAM.z, y: (s.y - CAM.ty) / CAM.z }; };
  function drag(elm, space, onMove, onEnd) { let on = false; const P = e => (space === 'world' ? wpt(e) : spt(e));
    elm.addEventListener('pointerdown', e => { on = true; try { elm.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); onMove(P(e), true); });
    elm.addEventListener('pointermove', e => { if (on) onMove(P(e), false); });
    const up = e => { if (!on) return; on = false; if (onEnd) onEnd(P(e)); }; elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up); }

  /* ---------- the look's assets; the loop plays only between clients ---------- */
  const A = { meta: {} };
  const asset = (n, lk) => 'assets/' + (lk || S.look) + '/' + n;
  async function loadLook() { $('#poster').src = asset('shop.webp'); const v = $('#loop'); v.src = asset('shop.mp4'); try { A.meta = await (await fetch(asset('meta.json'))).json(); } catch (e) { A.meta = {}; } }
  function loopPlay(on) { const v = $('#loop'); if (on) { v.currentTime = 0; v.play().then(() => v.classList.add('on')).catch(() => {}); } else { v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 900); } }
  document.addEventListener('visibilitychange', () => { const v = $('#loop'); if (document.hidden) v.pause(); else if (v.classList.contains('on')) v.play().catch(() => {}); });

  /* ---------- the client on the podium; the body's sizes come from the picture so the marks sit on the body ---------- */
  const C = { key: null, el: null, meta: null, body: null };
  const lookPos = () => (A.meta && A.meta._look) || { podiumX: 0.5, podiumY: 0.78 };
  function box(m) { m = m || C.meta; const L = lookPos(); const bottom = L.podiumY * 100, top = bottom - H, pxcm = H / CLIENT_CM; return { cx: W * L.podiumX, top, bottom, w: H * (m.aspect || 0.6), pxcm, waistY: top + H * m.waistY, headY: top + H * m.headY }; }
  function bodyOf(m) { const pxcm = H / CLIENT_CM;
    const acrossRaw = clamp(m.waistW * m.aspect * H / pxcm, 4, 8), lenRaw = clamp((m.kneeY - m.waistY) * H / pxcm, 5, 11), headRaw = clamp(m.headW * m.aspect * H / pxcm * 0.7, 5, 8);
    const across = S.tier === 3 ? snapTo(acrossRaw, 0.1) : Math.round(acrossRaw);
    return { across, waist: snap(Math.PI * across), len: snap(lenRaw), head: snap(Math.PI * headRaw), headAcross: headRaw }; }
  function placeClient(key) { C.key = key; C.meta = A.meta[key] || { waistY: 0.55, kneeY: 0.8, headY: 0.18, waistW: 0.32, headW: 0.5, aspect: 0.6 }; C.body = bodyOf(C.meta); const b = box(); const img = el('img', 'actor'); img.src = asset(key + '.webp'); img.alt = '';
    img.style.height = px(H); img.style.left = px(b.cx); img.style.bottom = px(100 - b.bottom); img.style.opacity = '0'; img.style.transform = 'translateX(-50%) translateX(' + px(T().dir === 'rtl' ? -80 : 80) + ')'; actors.appendChild(img); C.el = img;
    requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; img.style.transform = 'translateX(-50%)'; })); return wait(1000); }
  function clientLeave() { if (!C.el) return; const e = C.el; e.style.transform = 'translateX(-50%) translateX(' + px(T().dir === 'rtl' ? 80 : -80) + ')'; e.style.opacity = '0'; setTimeout(() => e.remove(), 1000); C.el = null; }

  /* ---------- words, buttons, the number pad ---------- */
  let bubble = null;
  /* the dock: the buttons always sit above the words, whatever their length */
  function dock() { let d = $('.dock', ui); if (!d) { d = el('div', 'dock'); d.appendChild(el('div', 'actions')); ui.appendChild(d); } return d; }
  function say(txt, who, cls) { if (!bubble) { bubble = el('div', 'bubble'); dock().appendChild(bubble); } bubble.className = 'bubble' + (cls ? ' ' + cls : ''); bubble.replaceChildren(); if (who) bubble.appendChild(el('span', 'who', who)); bubble.appendChild(document.createTextNode(txt)); }
  function clearSay() { if (bubble) { bubble.remove(); bubble = null; } }
  function actions(list) { const box = $('.actions', dock()); box.replaceChildren(); return new Promise(res => { for (const [label, val, cls] of list) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = () => { box.replaceChildren(); res(val); }; box.appendChild(b); } }); }
  function clearActions() { const box = $('.actions', ui); if (box) box.replaceChildren(); }
  function pad(decimals) { return new Promise(res => { let p = $('.pad', ui); if (p) p.remove(); p = el('div', 'pad'); const val = el('div', 'val'); const u = el('small', null, t('unitCm')); let s = ''; const show = () => val.replaceChildren(document.createTextNode(s || '0'), u); show(); p.appendChild(val);
    const keys = el('div', 'keys'); const add = (lbl, f, cls) => { const b = el('button', cls || '', lbl); b.type = 'button'; b.onclick = f; keys.appendChild(b); };
    for (const d of ['7', '8', '9', '4', '5', '6', '1', '2', '3']) add(d, () => { if (s.replace('.', '').length < 4) { s += d; show(); } });
    add(decimals ? '.' : '⌫', decimals ? () => { if (!s.includes('.')) { s = (s || '0') + '.'; show(); } } : () => { s = s.slice(0, -1); show(); }); add('0', () => { if (s.replace('.', '').length < 4) { s += '0'; show(); } }); add(decimals ? '⌫' : '', decimals ? () => { s = s.slice(0, -1); show(); } : () => {});
    add('✓', () => { if (!s || s === '.') return; p.remove(); res(parseFloat(s)); }, 'go'); p.appendChild(keys); ui.appendChild(p); }); }
  const badPad = () => { const p = $('.pad', ui); if (p) { p.classList.add('bad'); setTimeout(() => p.classList.remove('bad'), 700); } };
  function burst(x, y) { const box = $('#burst'); for (let i = 0; i < 18; i++) { const s = el('i'); const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 14; s.style.left = px(x); s.style.top = px(y); s.style.setProperty('--dx', px(Math.cos(a) * d)); s.style.setProperty('--dy', px(Math.sin(a) * d - 6)); s.style.background = ['#ffe7a8', '#f2c14e', '#ff9fd0', '#8fd3ff', '#9df09d'][i % 5]; box.appendChild(s); setTimeout(() => s.remove(), 1200); } }

  /* ---------- the notebook: what the kid measured and worked out, and the shop's rules; the only place numbers come from ---------- */
  const NB = { meas: [], pat: [], rules: [] };
  function note() { let n = $('.note', ui); if (!n) { n = el('div', 'note'); ui.appendChild(n); } n.replaceChildren(el('h4', null, t('notebook')));
    if (!NB.meas.length && !NB.pat.length) n.appendChild(el('span', 'empty', t('notebookEmpty')));
    for (const r of NB.meas) { const d = el('div'); d.dataset.k = r.k; d.append(el('span', null, r.label), el('b', null, fmt(r.v) + ' ' + t('unitCm'))); n.appendChild(d); }
    if (NB.rules.length) { n.appendChild(el('h4', 'ptn', t('patternTitle'))); for (const r of NB.rules) n.appendChild(el('p', 'rule', r)); }
    for (const r of NB.pat) { const d = el('div', 'pt'); d.dataset.k = r.k; d.append(el('span', null, r.label), el('b', null, fmt(r.v) + ' ' + t('unitCm'))); n.appendChild(d); } }
  function blinkNote(keys) { for (const k of keys) { const d = $('.note [data-k="' + k + '"]', ui); if (d) { d.classList.remove('blink'); void d.offsetWidth; d.classList.add('blink'); } } }
  const clearNote = () => { const n = $('.note', ui); if (n) n.remove(); };

  /* ---------- the magnifier: a big strip of tape or ruler; the tape's brass end or the red mark sits where the reading is ---------- */
  function readout(kind, value, shown, center) { let r = $('.readout', ui); if (!r) { r = el('div', 'readout'); r.appendChild(el('canvas')); ui.appendChild(r); }
    const c = $('canvas', r), dpr = Math.min(2, window.devicePixelRatio || 1), base = parseFloat(getComputedStyle(stage).fontSize), w = 26 * base, h = 6 * base; c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = kind === 'tape' ? '#f6d86a' : '#f6ecd0'; g.fillRect(0, 0, w, h);
    const left = center - shown / 2, pxcm = w / shown, step = S.tier === 3 ? 0.1 : S.tier === 2 ? 0.5 : 1;
    for (let v = Math.ceil((left - 1e-9) / step) * step; v <= left + shown + 1e-9; v = +(v + step).toFixed(3)) { if (v < -1e-9) continue; const X = (v - left) * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
      g.strokeStyle = '#2a1a0a'; g.lineWidth = whole ? 3.5 : half ? 2.2 : 1.3; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, whole ? h * 0.46 : half ? h * 0.32 : h * 0.2); g.stroke();
      if (whole) { g.fillStyle = '#2a1a0a'; g.font = '800 ' + Math.round(h * 0.36) + 'px Assistant, sans-serif'; g.textAlign = 'center'; g.fillText(String(Math.round(v)), X, h * 0.9); } }
    const X = (value - left) * pxcm;
    if (kind === 'tape') { g.fillStyle = 'rgba(176,120,32,.42)'; g.fillRect(X, 0, w - X, h); g.fillStyle = '#8a4a10'; g.fillRect(X - 2.5, 0, 5, h); g.fillStyle = '#d8a030'; g.beginPath(); g.arc(X + 14, h * 0.5, 6, 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = '#3a7aff'; g.fillRect(X - 3, 0, 6, h); }
    return r; }
  const clearReadout = () => { const r = $('.readout', ui); if (r) r.remove(); };
  /* read the magnifier until right: wrong answers get a hint, then a closer look; the answer is never shown */
  async function askRead(prompt, value, kind, k, label) { const shown = S.tier === 3 ? 3 : S.tier === 2 ? 6 : 8; const center = Math.max(shown / 2 - 0.5, value + rnd(-0.28, 0.28) * shown); readout(kind, value, shown, center); say(prompt); let miss = 0;
    for (;;) { window.__answer = value; const v = await pad(S.tier > 1); if (same(v, value)) { NB.meas.push({ k, label, v: value }); note(); blinkNote([k]); say(t('readYes', { what: label, n: fmt(value) }), null, 'ok'); await wait(1300); clearReadout(); return; }
      miss++; badPad(); if (miss === 1) say(t('readNo', { v: fmt(v) }) + ' ' + t('hint1'), null, 'bad'); else { readout(kind, value, shown / 2, Math.max(shown / 4 - 0.25, value + rnd(-0.2, 0.2) * shown / 2)); say(t('readNo', { v: fmt(v) }) + ' ' + t('hint2'), null, 'bad'); } } }

  /* ---------- measuring on the body ---------- */
  const clearOverlay = () => overlay.replaceChildren();
  function pulse(cx, cy, r) { const p = sv('circle', { cx, cy, r, fill: 'none', stroke: '#ffe7a8', 'stroke-width': 0.4 }); p.appendChild(sv('animate', { attributeName: 'r', values: r + ';' + (r * 1.7) + ';' + r, dur: '1.4s', repeatCount: 'indefinite' })); p.appendChild(sv('animate', { attributeName: 'opacity', values: '1;0;1', dur: '1.4s', repeatCount: 'indefinite' })); return p; }
  async function measureTape(which) { const b = box(), yc = which === 'head' ? b.headY : b.waistY, across = which === 'head' ? C.body.head / Math.PI : C.body.waist / Math.PI; const rx = across * b.pxcm / 2 + 1.2, ry = Math.max(1.2, rx * 0.22), cx = b.cx;
    await camTo(cx, yc + 4, 2.0); say(t(which === 'head' ? 'measureHead' : 'measureWaist', { name: cname() }));
    const g = sv('g'); overlay.appendChild(g); const path = sv('path', { fill: 'none', stroke: '#f6d86a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }), ticks = sv('path', { fill: 'none', stroke: '#6a4a10', 'stroke-width': 1.2, 'stroke-dasharray': '0.12 0.75' });
    const start = { x: cx - rx, y: yc }, ring = pulse(start.x, start.y, 2.4), handle = sv('circle', { cx: start.x, cy: start.y, r: 2.4, fill: '#ff6aa8', stroke: '#fff', 'stroke-width': 0.5, style: 'cursor:grab' }); g.append(path, ticks, ring, handle);
    let sum = 0, last = null, closed = false; const arcD = a => { let d = ''; const n = Math.max(2, Math.round(Math.abs(a) / 4)); for (let i = 0; i <= n; i++) { const th = Math.PI + (a * Math.PI / 180) * i / n; d += (i ? 'L' : 'M') + (cx + rx * Math.cos(th)).toFixed(2) + ' ' + (yc + ry * Math.sin(th)).toFixed(2) + ' '; } return d; };
    window.__geo = { kind: 'tape', c: w2s(cx, yc), rx: rx * CAM.z, ry: ry * CAM.z };
    await new Promise(res => drag(handle, 'world', (p, first) => { if (closed) return; const deg = (Math.atan2((p.y - yc) / ry, (p.x - cx) / rx) * 180 / Math.PI + 360) % 360; if (last != null && !first) { let d = deg - last; if (d < -180) d += 360; if (d > 180) d -= 360; sum = clamp(sum + d, -360, 360); } last = deg;
        path.setAttribute('d', arcD(sum)); ticks.setAttribute('d', arcD(sum)); const th = Math.PI + sum * Math.PI / 180; handle.setAttribute('cx', cx + rx * Math.cos(th)); handle.setAttribute('cy', yc + ry * Math.sin(th)); ring.remove();
        if (Math.abs(sum) >= 345) { closed = true; path.setAttribute('d', arcD(360)); handle.setAttribute('cx', start.x); handle.setAttribute('cy', start.y); setTimeout(res, 400); } }, () => { if (!closed) say(t('tapeOpen'), null, 'bad'); }));
    window.__geo = null; await askRead(t('readTape'), which === 'head' ? C.body.head : C.body.waist, 'tape', which, t('note.' + which)); clearOverlay(); }
  function rulerV(x, y0, cm, pxcm) { const g = sv('g', { style: 'cursor:grab' }); g.appendChild(sv('rect', { x, y: y0 - 0.6, width: 4.6, height: cm * pxcm + 1.2, rx: 0.4, fill: '#f6ecd0', stroke: '#8a6a3a', 'stroke-width': 0.25 }));
    for (let v = 0; v <= cm + 1e-9; v += 0.5) { const Y = y0 + v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6; g.appendChild(sv('line', { x1: x, y1: Y, x2: x + (whole ? 1.8 : 1.1), y2: Y, stroke: '#2a1a0a', 'stroke-width': whole ? 0.22 : 0.14 })); if (whole && v % 2 === 0) { const tx = sv('text', { x: x + 4.2, y: Y + 0.55, 'font-size': 1.5, 'text-anchor': 'end', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(v); g.appendChild(tx); } }
    overlay.appendChild(g); return g; }
  function rulerHW(x0, y, cm, pxcm) { const g = sv('g', { style: 'cursor:grab' }); g.appendChild(sv('rect', { x: x0 - 0.6, y, width: cm * pxcm + 1.2, height: 4.2, rx: 0.4, fill: '#f6ecd0', stroke: '#8a6a3a', 'stroke-width': 0.25 }));
    for (let v = 0; v <= cm + 1e-9; v += 0.5) { const X = x0 + v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6; g.appendChild(sv('line', { x1: X, y1: y, x2: X, y2: y + (whole ? 1.7 : 1.0), stroke: '#2a1a0a', 'stroke-width': whole ? 0.2 : 0.13 })); if (whole && v % 2 === 0) { const tx = sv('text', { x: X, y: y + 3.6, 'font-size': 1.4, 'text-anchor': 'middle', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(v); g.appendChild(tx); } }
    overlay.appendChild(g); return g; }
  const dashed = (x1, y1, x2, y2, col) => { const l = sv('line', { x1, y1, x2, y2, stroke: col || '#e8343a', 'stroke-width': 0.35, 'stroke-dasharray': '0.9 0.6' }); overlay.appendChild(l); return l; };
  async function measureLen() { const b = box(), yW = b.waistY, yK = yW + C.body.len * b.pxcm, half = (C.body.waist / Math.PI) * b.pxcm / 2; await camTo(b.cx, (yW + yK) / 2, 1.7); say(t('measureLen'));
    const x = b.cx + half + 5; dashed(b.cx - half - 3, yW, x + 6, yW); let y0 = yW + 9; const g = rulerV(x, y0, 14, b.pxcm); const ring = pulse(x + 2.3, y0 + 3, 2.6); overlay.appendChild(ring);
    window.__geo = { kind: 'rulerV', grab: w2s(x + 2.3, y0 + 3), to: w2s(x + 2.3, yW + 3) };
    let off = 0, ok = false; const setY = ny => { y0 = ny; g.setAttribute('transform', 'translate(0 ' + (ny - (yW + 9)).toFixed(3) + ')'); };
    await new Promise(res => drag(g, 'world', (p, first) => { if (ok) return; ring.remove(); if (first) off = p.y - y0; setY(clamp(p.y - off, yW - 16, yW + 20)); }, () => { if (ok) return; if (Math.abs(y0 - yW) <= 0.45 * b.pxcm) { ok = true; setY(yW); say(t('zeroOk'), null, 'ok'); setTimeout(res, 700); } else say(t('zeroNo'), null, 'bad'); }));
    window.__geo = null; dashed(b.cx - half - 3, yK, x + 6, yK, '#3a7aff'); await askRead(t('readRuler'), C.body.len, 'ruler', 'len', t('note.len')); clearOverlay(); }
  async function measureAcross() { const b = box(), yW = b.waistY, half = C.body.across * b.pxcm / 2; await camTo(b.cx, yW + 3, 2.1); say(t('measureAcross', { name: cname() }));
    const xl = b.cx - half, xr = b.cx + half; dashed(xl, yW - 4, xl, yW + 6); dashed(xr, yW - 4, xr, yW + 6, '#3a7aff'); let x0 = xl - 7; const y = yW + 2; const g = rulerHW(x0, y, 10, b.pxcm); const ring = pulse(x0 + 3, y + 2, 2.4); overlay.appendChild(ring);
    window.__geo = { kind: 'rulerH', grab: w2s(x0 + 3, y + 2), to: w2s(xl + 3, y + 2) };
    let off = 0, ok = false; const setX = nx => { x0 = nx; g.setAttribute('transform', 'translate(' + (nx - (xl - 7)).toFixed(3) + ' 0)'); };
    await new Promise(res => drag(g, 'world', (p, first) => { if (ok) return; ring.remove(); if (first) off = p.x - x0; setX(clamp(p.x - off, xl - 14, xl + 8)); }, () => { if (ok) return; if (Math.abs(x0 - xl) <= 0.45 * b.pxcm) { ok = true; setX(xl); say(t('zeroOkAcross'), null, 'ok'); setTimeout(res, 700); } else say(t('zeroNoAcross'), null, 'bad'); }));
    window.__geo = null; await askRead(t('readAcross'), C.body.across, 'ruler', 'across', t('note.across')); clearOverlay(); }

  /* ---------- the order, the rules and the pattern: every size is worked out from the notebook ---------- */
  function makeOrder() { if (S.tier === 1) return [{ kind: 'skirt' }, { kind: 'belt' }]; if (S.tier === 2) return pick([[{ kind: 'skirt' }, { kind: 'belt' }], [{ kind: 'circleSkirt' }, { kind: 'belt' }], [{ kind: 'circleSkirt' }, { kind: 'belt' }]]); return pick([[{ kind: 'circleSkirt' }, { kind: 'belt' }, { kind: 'hat' }], [{ kind: 'skirt' }, { kind: 'hat' }, { kind: 'belt' }]]); }
  const needsOf = p => p.kind === 'skirt' ? ['waist', 'len'] : p.kind === 'belt' ? ['waist'] : p.kind === 'circleSkirt' ? (S.tier === 2 ? ['across', 'len'] : ['waist', 'len']) : ['head'];
  function rulesOf(order) { const k = new Set(order.map(p => p.kind)), R = []; if (k.has('skirt')) R.push(t('rule.seam')); if (k.has('belt')) R.push(t('rule.buckle')); if (k.has('circleSkirt')) { R.push(t(S.tier === 2 ? 'rule.half' : 'rule.pi')); R.push(t('rule.outer')); } if (k.has('hat')) { if (!k.has('circleSkirt')) R.push(t('rule.pi')); } if (k.has('circleSkirt') || k.has('hat')) R.push(t('rule.disc')); return R; }
  function dims(p) { const B = C.body; if (p.kind === 'skirt') return [{ d: 'len', q: 'draft.skirtLen', ans: snap(B.waist + 2), hint: 'add', src: ['waist'] }, { d: 'h', q: 'draft.skirtH', ans: B.len, hint: 'same', src: ['len'] }];
    if (p.kind === 'belt') return [{ d: 'len', q: 'draft.belt', ans: snap(B.waist + 3), hint: 'add', src: ['waist'] }];
    if (p.kind === 'circleSkirt') { const r = S.tier === 2 ? B.across / 2 : Math.round(B.waist / 6.28 * 10) / 10; return [{ d: 'r', q: S.tier === 2 ? 'draft.holeHalf' : 'draft.holePi', ans: r, hint: S.tier === 2 ? 'half' : 'div', src: [S.tier === 2 ? 'across' : 'waist'], circle: true, tol: S.tier === 3 ? 0.1 : null }, { d: 'outer', q: 'draft.outer', ans: +(r + B.len).toFixed(2), hint: 'outer', src: ['len', 'circleSkirt.r'], circle: true, tol: S.tier === 3 ? 0.1 : null }]; }
    const r = Math.round(B.head / 6.28 * 10) / 10; return [{ d: 'r', q: 'draft.hatR', ans: r, hint: 'div', src: ['head'], circle: true, tol: 0.1 }]; }
  async function askDerive(dm, p) { say(t('piece.' + p.kind) + ': ' + t(dm.q)); let miss = 0;
    for (;;) { window.__answer = dm.ans; const v = await pad(S.tier > 1); if (same(v, dm.ans, dm.tol)) { p.ans[dm.d] = dm.ans; NB.pat.push({ k: p.kind + '.' + dm.d, label: t('piece.' + p.kind) + ' · ' + t('dim.' + dm.d), v: dm.ans }); note(); blinkNote([p.kind + '.' + dm.d]); say(t('draftYes'), null, 'ok'); await wait(1000); return; }
      miss++; badPad(); say(t('draftNo', { v: fmt(v) }) + ' ' + t('dhint.' + dm.hint), null, 'bad'); if (miss >= 2) blinkNote(dm.src); await wait(1700); say(t('piece.' + p.kind) + ': ' + t(dm.q)); } }
  const needAlong = p => p.kind === 'circleSkirt' ? 2 * p.ans.outer + 1 : p.kind === 'hat' ? 2 * p.ans.r + 1 : p.ans.len;

  /* ---------- fabric: a filmed colour × a pattern ---------- */
  function motif(kind, s) { const out = [], wht = 'rgba(255,255,255,.88)';
    if (kind === 'dots') { out.push(sv('circle', { cx: s * 0.25, cy: s * 0.25, r: s * 0.1, fill: wht }), sv('circle', { cx: s * 0.75, cy: s * 0.75, r: s * 0.1, fill: wht })); }
    else if (kind === 'stripes') out.push(sv('rect', { x: 0, y: 0, width: s * 0.3, height: s, fill: wht }));
    else if (kind === 'gingham') out.push(sv('rect', { x: 0, y: s / 2, width: s, height: s / 2, fill: 'rgba(255,255,255,.45)' }), sv('rect', { x: s / 2, y: 0, width: s / 2, height: s, fill: 'rgba(255,255,255,.45)' }));
    else if (kind === 'flowers') { const c = s / 2; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; out.push(sv('circle', { cx: c + Math.cos(a) * s * 0.13, cy: c + Math.sin(a) * s * 0.13, r: s * 0.09, fill: wht })); } out.push(sv('circle', { cx: c, cy: c, r: s * 0.07, fill: '#ffd84a' })); }
    else if (kind === 'hearts') { const c = s / 2, k = s * 0.3; out.push(sv('path', { d: `M${c} ${c + k * 0.55} C${c - k * 1.1} ${c - k * 0.2} ${c - k * 0.45} ${c - k * 0.95} ${c} ${c - k * 0.35} C${c + k * 0.45} ${c - k * 0.95} ${c + k * 1.1} ${c - k * 0.2} ${c} ${c + k * 0.55}Z`, fill: wht })); }
    else if (kind === 'stars') { const c = s / 2, pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.09 : s * 0.22, a = -Math.PI / 2 + i * Math.PI / 5; pts.push((c + Math.cos(a) * r).toFixed(2) + ',' + (c + Math.sin(a) * r).toFixed(2)); } out.push(sv('polygon', { points: pts.join(' '), fill: wht })); }
    else if (kind === 'zigzag') out.push(sv('polyline', { points: `0,${s * 0.6} ${s * 0.25},${s * 0.35} ${s * 0.5},${s * 0.6} ${s * 0.75},${s * 0.35} ${s},${s * 0.6}`, fill: 'none', stroke: wht, 'stroke-width': s * 0.09 }));
    return out; }
  function ensurePat(root, fab, tile, lk) { let defs = root.querySelector('defs'); if (!defs) { defs = sv('defs'); root.insertBefore(defs, root.firstChild); } const id = 'p_' + fab.col + '_' + fab.kind + '_' + String(tile).replace('.', '_') + '_' + (lk || S.look);
    if (!root.querySelector('#' + id)) { const p = sv('pattern', { id, patternUnits: 'userSpaceOnUse', width: tile, height: tile }); p.appendChild(sv('image', { href: asset(fab.col + '.webp', lk), x: 0, y: 0, width: tile, height: tile, preserveAspectRatio: 'none' })); for (const m of motif(fab.kind, tile)) p.appendChild(m); defs.appendChild(p); } return 'url(#' + id + ')'; }
  function swatch(fab, size) { const s = sv('svg', { viewBox: '0 0 10 10', width: size || '100%', height: size || '100%' }); s.appendChild(sv('rect', { width: 10, height: 10, fill: ensurePat(s, fab, 5) })); return s; }
  function pickFabric(label) { return new Promise(res => { const sh = el('div', 'picker'); const card = el('div', 'card'); card.appendChild(el('h3', null, t('fabricPick', { piece: label }))); let cur = { col: pick(COLOURS), kind: pick(KINDS) };
    const prev = el('div', 'preview'); const cols = el('div', 'row cols'), kinds = el('div', 'row kinds');
    const draw = () => { prev.replaceChildren(swatch(cur)); cols.replaceChildren(); kinds.replaceChildren();
      for (const c of COLOURS) { const b = el('button', c === cur.col ? 'on' : ''); b.type = 'button'; b.style.backgroundImage = 'url(' + asset(c + '.webp') + ')'; b.setAttribute('aria-label', c); b.onclick = () => { cur.col = c; draw(); }; cols.appendChild(b); }
      for (const k of KINDS) { const b = el('button', k === cur.kind ? 'on' : ''); b.type = 'button'; b.title = t('patterns.' + k); b.appendChild(swatch({ col: cur.col, kind: k })); b.onclick = () => { cur.kind = k; draw(); }; kinds.appendChild(b); } };
    draw(); const go = el('button', 'btn big', t('thisOne')); go.onclick = () => { sh.remove(); res(cur); }; card.append(el('p', null, t('colours')), cols, el('p', null, t('patternsWord')), kinds, prev, go); sh.appendChild(card); ui.appendChild(sh); }); }

  /* ---------- the cutting table: a big ruler, the fabric's end at 0, chalk with no number on it, scissors ---------- */
  /* the table sits beside the notebook (the notebook keeps its column on the reading side), so nothing covers the chalk or the scissors */
  const TB = { x0: 10, yF: 44, hF: 15, yR: 60, hR: 9, RW: 26, L: 3, R: 170, pxcm: 5 };
  function tbLayout() { const rtl = T().dir === 'rtl'; TB.L = rtl ? 3 : 37; TB.R = rtl ? W - 37 : W - 3; TB.x0 = TB.L + 7; TB.pxcm = (TB.R - TB.L - 14) / TB.RW; }
  const tpx = () => TB.pxcm;
  const clearTable = () => table.replaceChildren();
  function tableBase() { clearTable(); tbLayout(); if (C.el) C.el.style.opacity = '0.25'; table.appendChild(sv('rect', { x: TB.L, y: 30, width: TB.R - TB.L, height: 50, rx: 2, fill: '#6b4426', opacity: 0.97 })); table.appendChild(sv('rect', { x: TB.L, y: 30, width: TB.R - TB.L, height: 1.2, rx: 0.6, fill: '#9a6a3a' }));
    const pxcm = tpx(), g = sv('g'); g.appendChild(sv('rect', { x: TB.x0 - 1.5, y: TB.yR, width: TB.RW * pxcm + 3, height: TB.hR, rx: 0.6, fill: '#f6ecd0', stroke: '#8a6a3a', 'stroke-width': 0.3 }));
    const step = S.tier === 3 ? 0.1 : S.tier === 2 ? 0.5 : 1; for (let v = 0; v <= TB.RW + 1e-9; v = +(v + step).toFixed(2)) { const X = TB.x0 + v * pxcm, whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6; g.appendChild(sv('line', { x1: X, y1: TB.yR, x2: X, y2: TB.yR + (whole ? 3.8 : half ? 2.5 : 1.4), stroke: '#2a1a0a', 'stroke-width': whole ? 0.32 : half ? 0.22 : 0.14 }));
      if (whole) { const tx = sv('text', { x: X, y: TB.yR + 7.6, 'font-size': 3, 'text-anchor': 'middle', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(Math.round(v)); g.appendChild(tx); } }
    table.appendChild(g); }
  const endTable = () => { clearTable(); if (C.el) C.el.style.opacity = '1'; };
  /* chalk a mark and cut: returns where the kid cut (cm from the fabric's end); avail = how much fabric lies on the table */
  async function cutStrip(fab, avail, msg) { tableBase(); const pxcm = tpx(), fill = ensurePat(table, fab, 6), maxCm = Math.min(avail, TB.RW);
    const strip = sv('rect', { x: TB.x0, y: TB.yF, width: Math.min(avail * pxcm, TB.R - 2 - TB.x0), height: TB.hF, fill, stroke: 'rgba(0,0,0,.4)', 'stroke-width': 0.3 }); table.appendChild(strip); say(msg);
    const line = sv('line', { x1: TB.x0, y1: TB.yF, x2: TB.x0, y2: TB.yF + TB.hF, stroke: '#fff', 'stroke-width': 0.6, 'stroke-dasharray': '1.2 0.8', opacity: 0 }); table.appendChild(line);
    const chalk = sv('image', { href: asset('chalk.webp'), width: 10, height: 10, x: TB.x0 - 5, y: TB.yF - 11, style: 'cursor:grab' }); table.appendChild(chalk); const ring = sv('g'); ring.appendChild(pulseS(TB.x0, TB.yF - 5, 4.2)); table.appendChild(ring);
    let at = 0; const setAt = cm => { at = clamp(snap(cm), 0, maxCm); const X = TB.x0 + at * pxcm; chalk.setAttribute('x', X - 5); line.setAttribute('x1', X); line.setAttribute('x2', X); line.setAttribute('opacity', at > 0 ? 1 : 0); };
    window.__geo = { kind: 'chalk', from: { x: TB.x0, y: TB.yF - 5 }, x0: TB.x0, pxcm, y: TB.yF - 5 };
    let shown = false; await new Promise(res => drag(chalk, 'screen', p => { ring.remove(); setAt((p.x - TB.x0) / pxcm); }, () => { if (at > 0 && !shown) { shown = true; res(); } }));
    for (;;) { await actions([[t('cut'), 1]]); if (at > 0) break; }
    window.__geo = null; const X = TB.x0 + at * pxcm; say(t('cutGo')); const sc = sv('image', { href: asset('scissors.webp'), width: 14, height: 14, x: X - 7, y: TB.yF - 15, style: 'cursor:grab' }); table.appendChild(sc); const scRing = sv('g'); scRing.appendChild(pulseS(X, TB.yF - 8, 5)); table.appendChild(scRing);
    window.__geo = { kind: 'scissors', from: { x: X, y: TB.yF - 8 }, to: { x: X, y: TB.yF + TB.hF + 3 } };
    await new Promise(res => { let done = false; drag(sc, 'screen', p => { if (done) return; scRing.remove(); const y = clamp(p.y - 7, TB.yF - 15, TB.yF + TB.hF - 7); sc.setAttribute('y', y); const cutTo = clamp(p.y, TB.yF, TB.yF + TB.hF); line.setAttribute('stroke', '#ffe08a'); if (p.y >= TB.yF + TB.hF * 0.85) { done = true; res(); } }, () => { if (!done) sc.setAttribute('y', TB.yF - 15); }); });
    window.__geo = null; sc.remove(); line.remove(); const piece = sv('rect', { x: TB.x0, y: TB.yF, width: at * pxcm, height: TB.hF, fill, stroke: '#2a1a0a', 'stroke-width': 0.4, style: 'transition:transform .7s ease' }); table.appendChild(piece); strip.setAttribute('x', X); strip.setAttribute('width', Math.max(0, Math.min((avail - at) * pxcm, TB.R - 2 - X)));
    requestAnimationFrame(() => piece.setAttribute('transform', 'translate(0 -9)')); say(t('cutDone'), null, 'ok'); await wait(1100); return at; }
  function pulseS(cx, cy, r) { const p = sv('circle', { cx, cy, r, fill: 'none', stroke: '#ffe7a8', 'stroke-width': 0.5 }); p.appendChild(sv('animate', { attributeName: 'r', values: r + ';' + (r * 1.6) + ';' + r, dur: '1.4s', repeatCount: 'indefinite' })); p.appendChild(sv('animate', { attributeName: 'opacity', values: '1;0;1', dur: '1.4s', repeatCount: 'indefinite' })); return p; }
  /* open the compass on the ruler (no number on it), draw the circle on the fabric, cut round it; ringOf = the outer radius when cutting a hole */
  async function cutDisc(fab, msg, ringOf) { tableBase(); const pxcm = tpx(); say(msg); const py = TB.yR - 0.3;
    const legs = sv('path', { fill: 'none', stroke: '#2a2a3a', 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); table.appendChild(legs); table.appendChild(sv('circle', { cx: TB.x0, cy: py, r: 0.9, fill: '#2a2a3a' }));
    const knob = sv('circle', { cx: TB.x0 + pxcm, cy: py, r: 2.8, fill: '#ff6aa8', stroke: '#fff', 'stroke-width': 0.6, style: 'cursor:grab' }); table.appendChild(knob); const ring = sv('g'); ring.appendChild(pulseS(TB.x0 + pxcm, py, 2.8)); table.appendChild(ring);
    let open = 1; const setOpen = v => { open = clamp(snap(v), PREC[S.tier], 14); const X = TB.x0 + open * pxcm; knob.setAttribute('cx', X); legs.setAttribute('d', 'M' + TB.x0 + ' ' + py + ' L' + ((TB.x0 + X) / 2) + ' ' + (py - 16) + ' L' + X + ' ' + py); }; setOpen(1);
    window.__geo = { kind: 'compass', from: { x: TB.x0 + pxcm, y: py }, x0: TB.x0, pxcm, y: py };
    let shown = false; await new Promise(res => drag(knob, 'screen', p => { ring.remove(); setOpen((p.x - TB.x0) / pxcm); }, () => { if (!shown) { shown = true; res(); } }));
    await actions([[t('draw'), 1]]); window.__geo = null;
    /* the fabric, close up: tap to draw the circle the compass is set to, then cut round it */
    clearTable(); table.appendChild(sv('rect', { x: TB.L, y: 10, width: TB.R - TB.L, height: 70, rx: 2, fill: '#6b4426', opacity: 0.97 })); const fill = ensurePat(table, fab, 6), cx = (TB.L + TB.R) / 2, cy = 45, R0 = 26;
    if (ringOf) table.appendChild(sv('circle', { cx, cy, r: R0, fill, stroke: '#2a1a0a', 'stroke-width': 0.4 })); else table.appendChild(sv('rect', { x: cx - 32, y: cy - 31, width: 64, height: 62, fill, stroke: 'rgba(0,0,0,.4)', 'stroke-width': 0.3 }));
    const R = ringOf ? clamp(R0 * open / ringOf, 3, R0 - 1) : R0 - 2; const circ = sv('circle', { cx, cy, r: R, fill: 'none', stroke: '#fff', 'stroke-width': 0.7, 'stroke-dasharray': '1.4 0.9', opacity: 0 }); table.appendChild(circ);
    say(t('drawCircle')); window.__geo = { kind: 'tapDraw', at: { x: cx, y: cy } };
    await new Promise(res => { const hit = sv('rect', { x: cx - 32, y: cy - 31, width: 64, height: 62, fill: 'transparent', style: 'cursor:pointer' }); table.appendChild(hit); hit.addEventListener('pointerdown', () => { circ.setAttribute('opacity', 1); hit.remove(); res(); }); });
    say(t('cutGo')); const sc = sv('image', { href: asset('scissors.webp'), width: 14, height: 14, x: cx + R - 7, y: cy - 7, style: 'cursor:grab' }); table.appendChild(sc); window.__geo = { kind: 'scissorsRound', c: { x: cx, y: cy }, R };
    await new Promise(res => { let cov = 0, lastA = null, done = false; drag(sc, 'screen', (p, first) => { if (done) return; const a = Math.atan2(p.y - cy, p.x - cx); if (lastA != null && !first) { let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; cov += Math.abs(d); } lastA = a; sc.setAttribute('x', cx + R * Math.cos(a) - 7); sc.setAttribute('y', cy + R * Math.sin(a) - 7); if (cov >= Math.PI * 1.75) { done = true; res(); } }, () => {}); });
    window.__geo = null; sc.remove(); circ.setAttribute('fill', ringOf ? '#6b4426' : fill); circ.setAttribute('stroke', '#2a1a0a'); circ.setAttribute('stroke-dasharray', ''); say(t('cutDone'), null, 'ok'); await wait(1100); return open; }

  /* ---------- the try-on: the body judges, and says nothing about by how much ---------- */
  function drawOutfit(root, g, pieces, b, body, lk) { const ww = (body.waist / Math.PI) * b.pxcm + 1, yW = b.waistY, hw = body.headAcross * b.pxcm;
    for (const p of pieces) { if (!p.fab || !p.got) continue; const fill = ensurePat(root, p.fab, 3, lk), r = (k) => (p.got[k] || p.ans[k]) / p.ans[k], stroke = { stroke: '#2a1a0a', 'stroke-width': 0.35 };
      if (p.kind === 'skirt') { const ratio = r('len'), wTop = ww * clamp(ratio, 0.7, 1.3), h = (p.got.h || p.ans.h) * b.pxcm, drop = ratio > 1.03 ? 3 : 0, y0 = yW + drop; g.appendChild(sv('polygon', Object.assign({ points: [[b.cx - wTop / 2, y0], [b.cx + wTop / 2, y0], [b.cx + wTop * 0.8, y0 + h], [b.cx - wTop * 0.8, y0 + h]].map(q => q.map(n => n.toFixed(2)).join(',')).join(' '), fill }, stroke)));
        if (ratio < 0.97) g.appendChild(sv('rect', { x: b.cx + wTop / 2 - 0.4, y: y0, width: 1.4, height: h * 0.6, fill: 'rgba(232,52,58,.75)' })); }
      if (p.kind === 'belt') { const ratio = r('len'), w = ww * clamp(ratio, 0.7, 1.3) + 0.6; g.appendChild(sv('rect', Object.assign({ x: b.cx - w / 2, y: yW - 1.3, width: w, height: 2.6, rx: 0.5, fill }, stroke))); g.appendChild(sv('rect', { x: b.cx - 1, y: yW - 1.5, width: 2, height: 3, rx: 0.3, fill: '#e8c35a', stroke: '#6a4a10', 'stroke-width': 0.25 }));
        if (ratio < 0.97) g.appendChild(sv('rect', { x: b.cx + w / 2 - 0.3, y: yW - 1.3, width: 1.2, height: 2.6, fill: 'rgba(232,52,58,.8)' })); if (ratio > 1.03) g.appendChild(sv('rect', Object.assign({ x: b.cx + w / 2 - 1, y: yW - 1, width: 2.2, height: 5, rx: 0.4, fill }, stroke))); }
      if (p.kind === 'circleSkirt') { const hr = r('r'), wTop = ww * clamp(hr, 0.6, 1.4), len = ((p.got.outer || p.ans.outer) - (p.got.r || p.ans.r)) * b.pxcm, y0 = hr < 0.97 ? yW - 5 : hr > 1.03 ? yW + 5 : yW; g.appendChild(sv('polygon', Object.assign({ points: [[b.cx - wTop / 2, y0], [b.cx + wTop / 2, y0], [b.cx + wTop * 1.25, y0 + len], [b.cx - wTop * 1.25, y0 + len]].map(q => q.map(n => n.toFixed(2)).join(',')).join(' '), fill }, stroke)));
        if (hr < 0.97) g.appendChild(sv('rect', { x: b.cx - wTop / 2, y: y0 - 0.4, width: wTop, height: 0.9, fill: 'rgba(232,52,58,.8)' })); }
      if (p.kind === 'hat') { const hr = r('r'), w = hw * 1.2 * clamp(hr, 0.5, 1.5), yH = b.headY - hw * 0.45 + (hr > 1.03 ? 4 : 0); g.appendChild(sv('ellipse', Object.assign({ cx: b.cx, cy: yH, rx: w / 2, ry: 1.6, fill }, stroke))); g.appendChild(sv('path', Object.assign({ d: 'M' + (b.cx - w * 0.3) + ' ' + yH + ' Q' + b.cx + ' ' + (yH - w * 0.55) + ' ' + (b.cx + w * 0.3) + ' ' + yH + 'Z', fill }, stroke))); } } }
  function judge(p) { const out = []; for (const k in p.ans) { const got = p.got[k]; if (got == null) continue; const diff = got - p.ans[k]; if (Math.abs(diff) <= TOL[S.tier] + 1e-9) continue;
      const kind = (p.kind === 'skirt' && k === 'h') ? (diff < 0 ? 'short' : 'long') : (k === 'r' && p.kind === 'circleSkirt') ? (diff < 0 ? 'small' : 'big') : (k === 'outer') ? (diff < 0 ? 'short' : 'long') : (p.kind === 'hat') ? (diff < 0 ? 'small' : 'big') : (diff < 0 ? 'tight' : 'loose'); out.push({ k, kind, over: diff > 0 }); }
    return out; }

  /* ---------- fabric money ---------- */
  const ROLL = { left: 0, bought: 0, used: 0 };
  async function buyMore() { say(t('notEnough'), null, 'bad'); await actions([[t('buyMore'), 1]]); say(t('buyAsk')); window.__answer = 20; const b = Math.round(await pad(false)); let cost = Math.ceil(b / 10), got = b; if (cost > S.coins) { cost = S.coins; got = cost * 10; } S.coins -= cost; ROLL.left += got; ROLL.bought += got; hud(); save(); say(t('bought', { b: got, c: cost }), null, 'ok'); await wait(1000); }
  async function ensureRoll(cm) { while (ROLL.left + 1e-9 < cm && S.coins > 0) await buyMore(); }

  /* ---------- cutting a piece, and fixing it ---------- */
  async function cutPiece(p, only) { const L = t('piece.' + p.kind);
    if (p.kind === 'skirt' || p.kind === 'belt') { if (!only || only === 'len') { await ensureRoll(Math.min(p.ans.len, TB.RW)); window.__target = p.ans.len; const at = await cutStrip(p.fab, ROLL.left, t('cutMark', { piece: L })); ROLL.left -= at; p.got.len = at; }
      if (p.kind === 'skirt' && (!only || only === 'h')) window.__target = p.ans.h, p.got.h = await cutStrip(p.fab, 20, t('cutMarkH', { piece: L })); }
    else if (p.kind === 'circleSkirt') { if (!only || only === 'outer') { await ensureRoll(2 * p.ans.outer + 1); window.__target = p.ans.outer; p.got.outer = await cutDisc(p.fab, t('cutOuter', { piece: L })); ROLL.left -= 2 * p.got.outer + 1; } window.__target = p.ans.r; p.got.r = await cutDisc(p.fab, t('cutHole', { piece: L }), p.got.outer); }
    else { await ensureRoll(2 * p.ans.r + 1); window.__target = p.ans.r; p.got.r = await cutDisc(p.fab, t('cutHat', { piece: L })); ROLL.left -= 2 * p.got.r + 1; }
    endTable(); }
  async function fixPiece(p, bad) { const L = t('piece.' + p.kind);
    for (const x of bad) {
      if (x.over && (x.k === 'len' || x.k === 'h')) { say(t('fixTrim', { piece: L }), null); await wait(1500); const before = p.got[x.k]; window.__target = p.ans[x.k]; const at = await cutStrip(p.fab, before, t('trimMark', { piece: L })); p.got[x.k] = at; endTable(); continue; }
      if (x.over && (x.k === 'outer' || (p.kind === 'hat' && x.k === 'r'))) { say(t('fixTrim', { piece: L }), null); await wait(1500); const v = await cutDisc(p.fab, t(p.kind === 'hat' ? 'cutHat' : 'cutOuter', { piece: L })); if (v < p.got[x.k]) p.got[x.k] = v; endTable(); continue; }
      if (!x.over && x.k === 'r' && p.kind === 'circleSkirt') { say(t('fixHole', { piece: L }), null); await wait(1500); const v = await cutDisc(p.fab, t('cutHole', { piece: L }), p.got.outer); if (v > p.got.r) p.got.r = v; endTable(); continue; }
      say(t('fixNew', { piece: L }), null, 'bad'); await wait(1600); if (p.kind === 'skirt' || p.kind === 'belt') await cutPiece(p, x.k); else { p.got = {}; await cutPiece(p); } } }

  /* ---------- HUD and the wardrobe ---------- */
  function hud() { let h = $('.hud', ui); if (!h) { h = el('div', 'hud'); ui.appendChild(h); } h.replaceChildren(); const L = el('div', 'chips'), R = el('div', 'chips');
    const coin = el('span', 'chip'); const ci = el('img'); ci.src = asset('coin.webp'); ci.alt = ''; coin.append(ci, document.createTextNode(S.coins + ' ' + t('coins'))); L.append(coin, el('span', 'chip', '★ ' + S.rep), el('span', 'chip', t('day') + ' ' + S.day));
    const wd = el('button', 'btn ghost', t('wardrobe')); wd.onclick = openCloset; const lg = el('button', 'btn ghost', t('lang')); lg.onclick = () => { S.lang = S.lang === 'he' ? 'en' : 'he'; save(); location.reload(); }; R.append(wd, lg); h.append(L, R); }
  function outfitSVG(o) { const m = o.meta, L = o.pos || { podiumX: 0.5, podiumY: 0.78 }; const bottom = L.podiumY * 100, top = bottom - H, pxcm = H / CLIENT_CM, w = H * (m.aspect || 0.6), cx = W * L.podiumX; const b = { cx, top, bottom, w, pxcm, waistY: top + H * m.waistY, headY: top + H * m.headY };
    const s = sv('svg', { viewBox: (cx - w / 2).toFixed(2) + ' ' + (top - 4).toFixed(2) + ' ' + w.toFixed(2) + ' ' + (H + 4).toFixed(2), preserveAspectRatio: 'xMidYMid meet' }); s.appendChild(sv('image', { href: asset(o.client + '.webp', o.look), x: cx - w / 2, y: top, width: w, height: H })); const g = sv('g'); s.appendChild(g); drawOutfit(s, g, o.pieces, b, o.body, o.look); return s; }
  function openCloset() { let c = $('.closet', ui); if (c) { c.remove(); return; } c = el('div', 'closet'); const top = el('div', 'closetTop'); const back = el('button', 'btn ghost', t('back')); back.onclick = () => c.remove(); top.appendChild(back); c.appendChild(top);
    if (!S.wardrobe.length) c.appendChild(el('p', null, t('wardrobeEmpty'))); else { const g = el('div', 'grid'); for (const o of S.wardrobe.slice().reverse()) { const it = el('div', 'item'); try { it.appendChild(outfitSVG(o)); } catch (e) {} it.appendChild(el('small', null, t('wardrobeOf', { name: t('client.' + o.client), d: o.day }))); g.appendChild(it); } c.appendChild(g); } ui.appendChild(c); }

  /* ---------- one client, A to Z ---------- */
  async function serve() { const key = CLIENTS[(S.seen++) % CLIENTS.length]; save(); NB.meas = []; NB.pat = []; NB.rules = []; clearOverlay(); clearTable();
    await placeClient(key); const order = makeOrder(); order.forEach(p => { p.ans = {}; p.got = {}; }); const names = order.map(p => t('aPiece.' + p.kind)); const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' ' + t('and') + names[names.length - 1] : names[0];
    say(t('wish.' + key, { pieces: list }), cname()); await actions([[t('next'), 1]]); note();
    /* 1 · measure the body */
    const need = new Set(order.flatMap(needsOf)); for (const m of ['waist', 'across', 'len', 'head']) { if (!need.has(m)) continue; if (m === 'len') await measureLen(); else if (m === 'across') await measureAcross(); else await measureTape(m); }
    await camTo(0, 0, 1);
    /* 2 · the pattern, from the notebook and the rules */
    NB.rules = rulesOf(order); note(); say(t('draftTitle')); await wait(1300); for (const p of order) for (const dm of dims(p)) await askDerive(dm, p);
    /* 3 · buy fabric: an estimate, with consequences */
    const total = order.reduce((s, p) => s + needAlong(p), 0); ROLL.left = 0; ROLL.bought = 0;
    for (;;) { say(t('buyAsk')); window.__answer = Math.ceil(total); let b = Math.round(await pad(false)); let cost = Math.ceil(b / 10); if (cost > S.coins) { cost = S.coins; b = cost * 10; say(t('buyPoor', { b }), null, 'bad'); await wait(1300); } S.coins -= cost; ROLL.left += b; ROLL.bought += b; hud(); save(); say(t('bought', { b, c: cost }), null, 'ok'); await wait(1100);
      if (ROLL.left + 1e-9 >= total || S.coins <= 0) break; say(t('buyTooLittle', { b: ROLL.bought }), null, 'bad'); await actions([[t('buyMore'), 1]]); }
    /* 4 · fabric and cutting */
    for (const p of order) { p.fab = await pickFabric(t('piece.' + p.kind)); await cutPiece(p); }
    /* 5 · the try-on, and fixing */
    let paidAsIs = false; for (;;) { clearOverlay(); const b = box(); await camTo(b.cx, b.top + H * 0.5, 1.25); const g = sv('g'); overlay.appendChild(g); drawOutfit(overlay, g, order, b, C.body);
      const res = order.map(p => ({ p, bad: judge(p) })); const lines = res.map(({ p, bad }) => t(bad.length ? 'fit.' + bad[0].kind : 'fit.perfect', { piece: t('piece.' + p.kind) })); const allOk = res.every(x => !x.bad.length);
      say(lines.join(' '), t('fitTitle', { name: cname() }), allOk ? 'ok' : 'bad');
      if (allOk) { burst(W / 2, 40); await actions([[t('pay'), 1]]); break; }
      const go = await actions([[t('fix'), 'fix'], [t('payAsIs'), 'pay', 'ghost']]); if (go === 'pay') { paidAsIs = true; break; } await camTo(0, 0, 1); clearOverlay(); for (const { p, bad } of res) if (bad.length) await fixPiece(p, bad); }
    /* 6 · payment, the wardrobe */
    const perfect = order.map(p => !judge(p).length), q = perfect.filter(Boolean).length / order.length; const used = order.reduce((s, p) => s + needAlong(p), 0), waste = Math.max(0, ROLL.bought - used); const base = Math.round(order.length * 5 * (0.4 + 0.6 * q)), bonus = waste <= Math.max(5, used * 0.25) ? 2 : 0;
    S.coins += base + bonus; const star = q === 1 && !paidAsIs; if (star) S.rep++; hud(); burst(W / 2, 30);
    say(t('paid', { name: cname(), c: base }) + (bonus ? ' ' + t('bonus', { c: bonus }) : '') + ' ' + t('waste', { w: fmt(waste) }) + (star ? ' ' + t('star') : ''), cname(), star ? 'ok' : null);
    S.wardrobe.push({ client: key, look: S.look, pos: lookPos(), meta: C.meta, body: C.body, day: S.day, pieces: order.map(p => ({ kind: p.kind, fab: p.fab, ans: p.ans, got: p.got })) }); S.day++; save();
    await actions([[t('nextClient'), 1]]); say(star ? t('happy') : t('soso'), cname()); await camTo(0, 0, 1); clearOverlay(); clientLeave(); clearNote(); await wait(1200); clearSay(); hud(); }

  /* ---------- start: who plays, how old, which language ---------- */
  function startSheet() { return new Promise(res => { const sh = el('div', 'sheet'); const card = el('div', 'card'); card.appendChild(el('h1', null, t('title'))); card.appendChild(el('p', null, t('subtitle')));
    const name = el('input'); name.placeholder = t('yourName'); name.value = S.name || ''; card.appendChild(name); card.appendChild(el('p', 'q', t('howOld')));
    const ages = el('div', 'row'); let age = S.age; for (let a = 4; a <= 15; a++) { const b = el('button', a === age ? 'on' : '', a === 15 ? '15+' : String(a)); b.type = 'button'; b.onclick = () => { age = a; [...ages.children].forEach(x => x.classList.toggle('on', x === b)); }; ages.appendChild(b); } card.appendChild(ages);
    const langs = el('div', 'row'); for (const [id, lbl] of [['he', 'עברית'], ['en', 'English']]) { const b = el('button', id === S.lang ? 'on' : '', lbl); b.type = 'button'; b.onclick = () => { S.lang = id; S.name = name.value.trim() || S.name; S.age = age; save(); location.reload(); }; langs.appendChild(b); } card.appendChild(langs);
    const go = el('button', 'btn big', t('open')); go.type = 'button'; go.onclick = () => { S.name = name.value.trim() || S.name || '?'; S.age = age; S.tier = age <= 6 ? 1 : age <= 10 ? 2 : 3; S.look = age <= 6 ? 'felt' : 'nature'; save(); sh.remove(); res(); }; card.appendChild(go); sh.appendChild(card); ui.appendChild(sh); }); }

  async function main() { load(); $('#ver').textContent = 'v' + VERSION; document.documentElement.lang = S.lang; document.documentElement.dir = T().dir; document.title = t('title') + ' · Kingdom Quest';
    await startSheet(); await loadLook(); hud();
    for (;;) { loopPlay(true); say(t('waiting')); await actions([[t('ring'), 1, 'big']]); loopPlay(false); clearSay(); await serve(); } }
  window.AT = { S, t, get W() { return W; }, get cam() { return CAM; } };
  main();
})();
