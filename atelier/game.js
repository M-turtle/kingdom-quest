/* Kingdom Quest — the Atelier (Yoni 2026-10-18, pick A: 'Go with A ... I want to see the game. A to Z. Just the full game. Let me play it').
   A tailor's shop in the Fashion world. A client comes in with a wish; the kid MEASURES the client with the tape and the ruler (the number
   comes from the world, never from a card), WORKS OUT the pattern (round the waist plus a seam; a radius from a circumference), BUYS fabric
   (one coin per 10 cm: estimate first), CUTS with chalk, scissors and compass on a ruled table, and the client TRIES IT ON: the body judges
   the fit (too tight will not close, too long hangs below the knee, a small hole will not go on). Payment by fit and by waste. Everything
   made goes to the wardrobe. Three tiers by age (whole cm / half cm / mm and π), two looks (felt 3–6, nature-tech 7+; Yoni 2026-10-19: 'drop the mid-level format', voxel is not used here).
   Every picture is filmed: the shop loop, the clients, the tools and the fabrics come from God Mode stills keyed from green. The ruler and
   tape TICKS are drawn exactly (a filmed ruler cannot be trusted to the millimetre), on top of the filmed tools. */
(function () {
  'use strict';
  const VERSION = 1;
  const $ = (s, r) => (r || document).querySelector(s), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const NS = 'http://www.w3.org/2000/svg', sv = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a || {}) e.setAttribute(k, a[k]); return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms)); const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const rnd = (a, b) => a + Math.random() * (b - a); const pick = a => a[Math.floor(Math.random() * a.length)];
  const stage = $('#stage'), overlay = $('#overlay'), ui = $('#ui'), actors = $('#actors');
  const PREC = { 1: 1, 2: 0.5, 3: 0.1 }, TOL = { 1: 0.4, 2: 0.3, 3: 0.08 }, SEAM = 2, CLIENT_CM = 30;   /* every client stands 30 cm tall; the tape and ruler scale from that */
  const CLIENTS = ['girl', 'boy', 'grandma', 'bear', 'fox', 'princess'], FABS = ['fab_pink', 'fab_blue', 'fab_yellow', 'fab_green', 'fab_purple', 'fab_red'];

  /* ---------- state, save ---------- */
  const S = { lang: 'he', look: 'felt', tier: 1, name: '', age: 6, coins: 12, rep: 0, day: 1, wardrobe: [], seen: 0 };
  const KEY = 'kq_atelier_v1';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.name) Object.assign(S, j); } catch (e) {} }
  const T = () => window.AT_STR[S.lang] || window.AT_STR.en;
  const t = (k, v) => { let s = k.split('.').reduce((o, p) => (o && o[p] != null ? o[p] : null), T()); if (s == null) s = k; return String(s).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m)); };
  const num = v => { const p = PREC[S.tier]; const r = Math.round(v / p) * p; return (p < 1 ? r.toFixed(p === 0.5 ? 1 : 1) : String(Math.round(r))).replace(/\.0$/, ''); };
  const same = (a, b) => Math.abs(a - b) < 1e-6 + PREC[S.tier] / 4;
  const round = v => +(Math.round(v / PREC[S.tier]) * PREC[S.tier]).toFixed(2);

  /* ---------- the stage unit: 1 u = 1% of stage height ---------- */
  function fit() { const r = stage.getBoundingClientRect(); stage.style.setProperty('--u', (r.height / 100).toFixed(3)); overlay.setAttribute('viewBox', '0 0 ' + (100 * r.width / r.height).toFixed(3) + ' 100'); W = 100 * r.width / r.height; }
  let W = 177.78; window.addEventListener('resize', fit); fit();
  const pt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.height * 100, y: (e.clientY - r.top) / r.height * 100 }; };

  /* ---------- assets ---------- */
  const A = { meta: null };
  const asset = n => 'assets/' + S.look + '/' + n;
  async function loadLook() { $('#poster').src = asset('shop.webp'); const v = $('#loop'); v.classList.remove('on'); v.src = asset('shop.mp4'); v.play().then(() => v.classList.add('on')).catch(() => {}); try { A.meta = await (await fetch(asset('meta.json'))).json(); } catch (e) { A.meta = {}; } document.documentElement.lang = S.lang; document.documentElement.dir = T().dir; }
  document.addEventListener('visibilitychange', () => { const v = $('#loop'); if (document.hidden) v.pause(); else v.play().catch(() => {}); });

  /* ---------- the client on the podium ---------- */
  const C = { key: null, el: null, m: null, box: null };
  function clientMeasures(key) {   /* true sizes in cm, rounded to the tier's precision; every client a little different */
    const base = { girl: [12, 7, 14, 4], boy: [13, 7.5, 15, 4], grandma: [15, 8, 16, 5], bear: [18, 6, 18, 5], fox: [10, 8.5, 13, 3], princess: [11, 7.5, 14, 4] }[key];
    const j = () => (S.tier === 1 ? pick([-1, 0, 1]) : S.tier === 2 ? pick([-1, -0.5, 0, 0.5, 1]) : round(rnd(-1, 1)));
    return { waist: round(base[0] + j()), len: round(base[1] + j() / 2), head: round(base[2] + j()), bow: round(base[3]) };
  }
  function placeClient(key) { C.key = key; C.m = clientMeasures(key); const img = el('img', 'actor'); img.src = asset(key + '.webp'); img.alt = ''; const meta = (A.meta && A.meta[key]) || { waistY: 0.56, kneeY: 0.8, headY: 0.14, waistW: 0.34, headW: 0.44, bodyX: 0.5 };
    const LK = (A.meta && A.meta._look) || { podiumX: 0.5, podiumY: 0.78 }; const H = 56; img.style.height = H + 'em'; img.style.left = (W * LK.podiumX) + 'em'; img.style.bottom = (100 - LK.podiumY * 100) + 'em'; img.style.transform = 'translateX(-50%) translateX(120em)'; img.style.opacity = '0'; actors.appendChild(img); C.el = img; C.meta = meta;
    C.box = () => { const asp = meta.aspect || 0.5625; const h = H, w = H * asp; const cx = W * LK.podiumX, bottom = LK.podiumY * 100; return { cx, top: bottom - h, bottom, w, h, pxcm: h / CLIENT_CM }; };
    requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; img.style.transform = 'translateX(-50%)'; })); return wait(1000); }
  function clientLeave() { if (!C.el) return; const e = C.el; e.style.transform = 'translateX(-50%) translateX(' + (T().dir === 'rtl' ? -120 : 120) + 'em)'; e.style.opacity = '0'; setTimeout(() => e.remove(), 1000); C.el = null; }
  const lineY = frac => { const b = C.box(); return b.top + b.h * frac; };

  /* ---------- words, buttons, number pad ---------- */
  let bubble = null;
  function say(txt, who, cls) { if (!bubble) { bubble = el('div', 'bubble'); ui.appendChild(bubble); } bubble.className = 'bubble' + (cls ? ' ' + cls : ''); bubble.replaceChildren(); if (who) bubble.appendChild(el('span', 'who', who)); bubble.appendChild(document.createTextNode(txt)); }
  function clearSay() { if (bubble) { bubble.remove(); bubble = null; } }
  function actions(list) { let box = $('.actions', ui); if (!box) { box = el('div', 'actions'); ui.appendChild(box); } box.replaceChildren(); return new Promise(res => { for (const [label, val, cls] of list) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), label); b.onclick = () => { box.replaceChildren(); res(val); }; box.appendChild(b); } }); }
  function clearActions() { const box = $('.actions', ui); if (box) box.replaceChildren(); }
  function pad(decimals, unit) { return new Promise(res => { let p = $('.pad', ui); if (p) p.remove(); p = el('div', 'pad'); const val = el('div', 'val'); const u = el('small', null, unit || t('unitCm')); let s = ''; const show = () => { val.replaceChildren(document.createTextNode(s || '0'), u); }; show(); p.appendChild(val);
    const keys = el('div', 'keys'); const add = (lbl, f, cls) => { const b = el('button', cls || '', lbl); b.type = 'button'; b.onclick = f; keys.appendChild(b); };
    for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) add(d, () => { if (s.replace('.', '').length < 4) { s += d; show(); } });
    add(decimals ? '.' : '0', () => { if (decimals) { if (!s.includes('.')) { s = (s || '0') + '.'; show(); } } else if (s.length < 4) { s += '0'; show(); } }); add('0', () => { if (s.length < 4) { s += '0'; show(); } }); add('⌫', () => { s = s.slice(0, -1); show(); });
    add('✓', () => { if (!s || s === '.') return; p.remove(); res(parseFloat(s)); }, 'go'); p.appendChild(keys); ui.appendChild(p); }); }
  const badPad = () => { const p = $('.pad', ui); if (p) { p.classList.add('bad'); setTimeout(() => p.classList.remove('bad'), 700); } };
  function burst(x, y) { const box = $('#burst'); for (let i = 0; i < 16; i++) { const s = el('i'); const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 14; s.style.left = x + 'em'; s.style.top = y + 'em'; s.style.setProperty('--dx', Math.cos(a) * d + 'em'); s.style.setProperty('--dy', (Math.sin(a) * d - 6) + 'em'); s.style.background = ['#ffe7a8', '#f2c14e', '#ff9fd0', '#8fd3ff', '#9df09d'][i % 5]; box.appendChild(s); setTimeout(() => s.remove(), 1200); } }
  /* ask a number until it matches; two misses show the answer */
  async function askNumber(prompt, answer, who, opts) { opts = opts || {}; window.__answer = answer; say(prompt, who); for (let tries = 0; ; tries++) { const v = await pad(opts.decimals, opts.unit); if (same(v, answer)) { say(t(opts.yes || 'readYes', { n: num(answer) }), who, 'ok'); await wait(900); return { ok: tries === 0 }; }
      badPad(); if (tries >= 1) { say(t(opts.show || 'readShow', { n: num(answer), why: opts.why || '' }), who, 'bad'); if (opts.onShow) opts.onShow(); await wait(2600); return { ok: false }; } say(t(opts.no || 'readNo', { v: num(v) }), who, 'bad'); await wait(900); say(prompt, who); } }

  /* ---------- HUD ---------- */
  function hud() { let h = $('.hud', ui); if (!h) { h = el('div', 'hud'); ui.appendChild(h); } h.replaceChildren(); const L = el('div', 'chips'), R = el('div', 'chips');
    const coin = el('span', 'chip'); const ci = el('img'); ci.src = asset('coin.webp'); ci.alt = ''; coin.append(ci, document.createTextNode(S.coins + ' ' + t('coins'))); L.appendChild(coin);
    L.appendChild(el('span', 'chip', '★ ' + S.rep)); L.appendChild(el('span', 'chip', t('day') + ' ' + S.day));
    const wd = el('button', 'btn ghost', t('wardrobe')); wd.onclick = openCloset; R.appendChild(wd); const lg = el('button', 'btn ghost', t('lang')); lg.onclick = () => { S.lang = S.lang === 'he' ? 'en' : 'he'; save(); location.reload(); }; R.appendChild(lg); h.append(L, R); }

  /* ---------- SVG helpers: exact ticks on top of the filmed tools ---------- */
  function clearOverlay() { overlay.replaceChildren(); }
  function rulerH(x0, y, cm, pxcm, opt) {   /* a horizontal ruler from (x0,y): 0..cm, exact ticks; returns group */
    opt = opt || {}; const g = sv('g', { class: 'ruler' }); g.appendChild(sv('rect', { x: x0 - 1, y: y, width: cm * pxcm + 2, height: 6, rx: 0.6, fill: opt.fill || '#f1e5c4', stroke: '#8a6a3a', 'stroke-width': 0.6 }));
    const step = S.tier === 3 ? 0.1 : S.tier === 2 ? 0.5 : 1; for (let v = 0; v <= cm + 1e-9; v = +(v + step).toFixed(2)) { const X = x0 + v * pxcm; const whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6; const hgt = whole ? 2.4 : half ? 1.6 : 0.9; g.appendChild(sv('line', { x1: X, y1: y, x2: X, y2: y + hgt, stroke: '#3a2a1a', 'stroke-width': whole ? 0.5 : 0.3 })); if (whole) { const tx = sv('text', { x: X, y: y + 5.2, 'font-size': 2.1, 'text-anchor': 'middle', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(Math.round(v)); g.appendChild(tx); } }
    overlay.appendChild(g); return g; }
  function rulerV(x, y0, cm, pxcm) {   /* a vertical ruler, 0 at y0 going down */
    const g = sv('g'); g.appendChild(sv('rect', { x: x, y: y0 - 1, width: 7.5, height: cm * pxcm + 2, rx: 0.6, fill: '#f1e5c4', stroke: '#8a6a3a', 'stroke-width': 0.6 }));
    const step = S.tier === 3 ? 0.1 : S.tier === 2 ? 0.5 : 1; for (let v = 0; v <= cm + 1e-9; v = +(v + step).toFixed(2)) { const Y = y0 + v * pxcm; const whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6; const len = whole ? 2.4 : half ? 1.6 : 0.9; g.appendChild(sv('line', { x1: x, y1: Y, x2: x + len, y2: Y, stroke: '#3a2a1a', 'stroke-width': whole ? 0.5 : 0.3 })); if (whole) { const tx = sv('text', { x: x + 7, y: Y + 0.75, 'font-size': 2.1, 'text-anchor': 'end', fill: '#2a1a0a', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); tx.textContent = String(Math.round(v)); g.appendChild(tx); } }
    overlay.appendChild(g); return g; }
  function drag(elm, onMove, onEnd) { let on = false; elm.addEventListener('pointerdown', e => { on = true; elm.setPointerCapture && elm.setPointerCapture(e.pointerId); e.preventDefault(); onMove(pt(e), e, true); }); elm.addEventListener('pointermove', e => { if (on) onMove(pt(e), e, false); }); const up = e => { if (!on) return; on = false; onEnd && onEnd(pt(e), e); }; elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up); }
  function readout(value, cmShown, label) {   /* the tape or ruler window: exact ticks around the value, a red line at the value; the kid reads it */
    let r = $('.readout', ui); if (!r) { r = el('div', 'readout'); r.appendChild(el('canvas')); ui.appendChild(r); } const c = $('canvas', r); const dpr = Math.min(2, window.devicePixelRatio || 1); const w = 22 * parseFloat(getComputedStyle(stage).getPropertyValue('--u')), h = 4.2 * parseFloat(getComputedStyle(stage).getPropertyValue('--u')); c.width = w * dpr; c.height = h * dpr; const g = c.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = '#fbf5e4'; g.fillRect(0, 0, w, h); const pxcm = w / cmShown, left = value - cmShown / 2; const step = S.tier === 3 ? 0.1 : S.tier === 2 ? 0.5 : 1;
    for (let v = Math.ceil(left / step) * step; v <= left + cmShown; v = +(v + step).toFixed(2)) { if (v < 0) continue; const X = (v - left) * pxcm; const whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6; g.strokeStyle = '#2a1a0a'; g.lineWidth = whole ? 2 : 1; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, whole ? h * 0.5 : half ? h * 0.34 : h * 0.2); g.stroke(); if (whole) { g.fillStyle = '#2a1a0a'; g.font = '800 ' + (h * 0.34) + 'px Assistant, sans-serif'; g.textAlign = 'center'; g.fillText(String(Math.round(v)), X, h * 0.9); } }
    const X = (value - left) * pxcm; g.strokeStyle = '#e8343a'; g.lineWidth = 3; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, h); g.stroke(); return r; }
  const clearReadout = () => { const r = $('.readout', ui); if (r) r.remove(); };

  /* ---------- measuring: the tape round the body ---------- */
  async function measureRound(which) {   /* which: 'waist' | 'head' → returns the number the kid read (the true one) */
    clearOverlay(); clearReadout(); const b = C.box(), m = C.meta; const yf = which === 'head' ? m.headY : m.waistY, wf = which === 'head' ? m.headW : m.waistW; const y = lineY(yf), rx = b.w * wf / 2 + 1.2, ry = 2.2, cx = b.cx;
    say(t(which === 'head' ? 'measureHead' : 'measureWaist', { name: t('client.' + C.key) }), null); const g = sv('g'); overlay.appendChild(g);
    const path = sv('path', { d: '', fill: 'none', stroke: '#f2c14e', 'stroke-width': 1.6, 'stroke-linecap': 'round' }); g.appendChild(path); const path2 = sv('path', { d: '', fill: 'none', stroke: '#e8343a', 'stroke-width': 0.35, 'stroke-dasharray': '0.8 0.6' }); g.appendChild(path2);
    const start = { x: cx - rx, y }; const handle = sv('circle', { cx: start.x, cy: start.y, r: 2.6, fill: '#ff6aa8', stroke: '#fff', 'stroke-width': 0.5, cursor: 'grab' }); g.appendChild(handle); const lbl = sv('text', { x: start.x, y: y - 4, 'font-size': 2, 'text-anchor': 'middle', fill: '#ffe7a8', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); lbl.textContent = t('dragHere'); g.appendChild(lbl);
    window.__geo = { kind: 'tape', cx, y, rx, ry }; let prog = 0, last = null, closed = false; const arc = a => { let d = ''; const n = Math.max(2, Math.round(a / 4)); for (let i = 0; i <= n; i++) { const th = Math.PI + (a * Math.PI / 180) * i / n; const X = cx + rx * Math.cos(th), Y = y + ry * Math.sin(th); d += (i ? 'L' : 'M') + X.toFixed(2) + ' ' + Y.toFixed(2) + ' '; } return d; };
    await new Promise(res => { drag(handle, (p, e, first) => { if (closed) return; const ang = Math.atan2((p.y - y) / ry, (p.x - cx) / rx); let deg = ((ang - Math.PI) * 180 / Math.PI + 720) % 360; if (last != null) { let d = deg - last; if (d < -180) d += 360; if (d > 180) d -= 360; if (first) d = 0; prog = clamp(prog + d, 0, 360); } last = deg; path.setAttribute('d', arc(prog)); const th = Math.PI + prog * Math.PI / 180; handle.setAttribute('cx', cx + rx * Math.cos(th)); handle.setAttribute('cy', y + ry * Math.sin(th)); lbl.setAttribute('opacity', 0);
        if (prog >= 345 && !closed) { closed = true; path.setAttribute('d', arc(360)); handle.setAttribute('cx', start.x); handle.setAttribute('cy', start.y); say(t('tapeClosed'), null, 'ok'); setTimeout(res, 500); } }, () => { if (!closed) say(t('tapeOpen'), null); }); });
    const value = C.m[which]; readout(value, S.tier === 3 ? 4 : 8); const r = await askNumber(t('readTape'), value, null, { decimals: S.tier > 1 }); clearReadout(); clearOverlay(); return { value, ok: r.ok }; }

  /* ---------- measuring: the ruler from the waist to the knee ---------- */
  async function measureLength() { clearOverlay(); clearReadout(); const b = C.box(), m = C.meta; const yW = lineY(m.waistY), yK = yW + C.m.len * b.pxcm; const x = b.cx + b.w / 2 + 2; say(t('measureLen'), null);
    overlay.appendChild(sv('line', { x1: b.cx - b.w / 2 - 2, y1: yW, x2: x + 8, y2: yW, stroke: '#e8343a', 'stroke-width': 0.5, 'stroke-dasharray': '1 0.7' })); const kneeLine = sv('line', { x1: b.cx - b.w / 2 - 2, y1: yK, x2: x + 8, y2: yK, stroke: '#e8343a', 'stroke-width': 0.5, 'stroke-dasharray': '1 0.7', opacity: 0 }); overlay.appendChild(kneeLine);
    let y0 = yW + 9; const g = rulerV(x, y0, 12, b.pxcm); g.setAttribute('cursor', 'grab'); const lbl = sv('text', { x: x + 2.5, y: y0 - 1.5, 'font-size': 2, 'text-anchor': 'middle', fill: '#ffe7a8', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); lbl.textContent = t('dragHere'); overlay.appendChild(lbl);
    window.__geo = { kind: 'ruler', x, y0, yW, pxcm: b.pxcm }; let off = 0, aligned = false; const setY = ny => { y0 = ny; g.setAttribute('transform', 'translate(0 ' + (ny - (yW + 9)) + ')'); lbl.setAttribute('opacity', 0); };
    await new Promise(res => { drag(g, (p, e, first) => { if (aligned) return; if (first) off = p.y - y0; setY(clamp(p.y - off, yW - 20, yW + 25)); }, () => { if (aligned) return; const d = (y0 - yW) / b.pxcm; if (Math.abs(d) <= 0.3) { aligned = true; setY(yW); say(t('zeroOk'), null, 'ok'); setTimeout(res, 500); } else say(t('zeroNo', { d: num(Math.abs(d)) }), null, 'bad'); }); });
    kneeLine.setAttribute('opacity', 1); const value = C.m.len; readout(value, S.tier === 3 ? 4 : 8); const r = await askNumber(t('readRuler'), value, null, { decimals: S.tier > 1 }); clearReadout(); clearOverlay(); return { value, ok: r.ok }; }

  /* ---------- the order: which pieces, from the tier ---------- */
  function makeOrder() { const o = { pieces: [] }; if (S.tier === 1) o.pieces = [{ kind: 'skirt' }, { kind: 'bow' }]; else if (S.tier === 2) o.pieces = pick([[{ kind: 'skirt' }, { kind: 'belt' }], [{ kind: 'circleSkirt' }, { kind: 'belt' }]]); else o.pieces = pick([[{ kind: 'circleSkirt' }, { kind: 'belt' }, { kind: 'hat' }], [{ kind: 'skirt' }, { kind: 'hat' }, { kind: 'belt' }]]); return o; }
  const needs = p => p.kind === 'skirt' ? ['waist', 'len'] : p.kind === 'circleSkirt' ? ['waist', 'len'] : p.kind === 'belt' ? ['waist'] : p.kind === 'hat' ? ['head'] : [];
  /* every piece: the dimensions to cut, with the question that derives each from a measurement */
  function dims(p, M) { const w = M.waist, l = M.len, h = M.head, bw = C.m.bow;
    if (p.kind === 'skirt') return [{ key: 'len', q: t('draft.skirtLen', { seam: SEAM, w: num(w) }), ans: round(w + SEAM), why: t('why.add', { a: num(w), b: SEAM, n: num(w + SEAM) }) }, { key: 'h', q: t('draft.skirtH', { l: num(l) }), ans: round(l), why: t('why.same', { n: num(l) }), vertical: true }];
    if (p.kind === 'belt') return [{ key: 'len', q: t('draft.belt', { seam: 3, w: num(w) }), ans: round(w + 3), why: t('why.add', { a: num(w), b: 3, n: num(w + 3) }) }];
    if (p.kind === 'bow') return [{ key: 'len', q: t('draft.bow', { b: num(bw) }), ans: round(bw * 2), why: t('why.dbl', { a: num(bw), n: num(bw * 2) }) }];
    if (p.kind === 'circleSkirt') { const r = Math.round(w / 6.28 * 10) / 10; return [{ key: 'r', q: t(S.tier === 3 ? 'draft.circleRPi' : 'draft.circleR', { w: num(w) }), ans: r, why: t('why.div', { a: num(w), n: r.toFixed(1) }), decimals: true, circle: true }, { key: 'h', q: t('draft.skirtH', { l: num(l) }), ans: round(l), why: t('why.same', { n: num(l) }), skipCut: true }]; }
    if (p.kind === 'hat') { const r = Math.round(h / 6.28 * 10) / 10; return [{ key: 'r', q: t('draft.hatR', { h: num(h) }), ans: r, why: t('why.div', { a: num(h), n: r.toFixed(1) }), decimals: true, circle: true }]; }
    return []; }
  const fabricNeed = p => p.cut.some(d => d.circle) ? 2 * p.cut.find(d => d.circle).ans + 1 : p.cut.find(d => d.key === 'len').ans;   /* cm along the roll each piece takes */

  /* ---------- the cutting table ---------- */
  const TABLE = { x0: 6, y: 60, pxcm: 0 };
  function tableRuler(cm) { TABLE.pxcm = Math.min(4.6, (W * 0.5) / Math.max(cm, 10)); rulerH(TABLE.x0, TABLE.y + 13, cm, TABLE.pxcm); if (C.el) C.el.style.opacity = '0.35'; }
  function fabricRect(x, y, w, h, fab) { const id = 'fab_' + fab; if (!$('#' + id, overlay)) { const defs = sv('defs'); const pat = sv('pattern', { id, patternUnits: 'userSpaceOnUse', width: 20, height: 20 }); const im = sv('image', { href: asset(fab + '.webp'), x: 0, y: 0, width: 20, height: 20, preserveAspectRatio: 'none' }); pat.appendChild(im); defs.appendChild(pat); overlay.appendChild(defs); } const r = sv('rect', { x, y, width: w, height: h, rx: 0.4, fill: 'url(#' + id + ')', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.3 }); overlay.appendChild(r); return r; }
  function chalkLine(x, y1, y2) { const l = sv('line', { x1: x, y1, x2: x, y2, stroke: '#fff', 'stroke-width': 0.7, 'stroke-dasharray': '1.2 0.8', opacity: 0.95 }); overlay.appendChild(l); return l; }
  /* chalk a length on the ruled fabric (snap to the tier's precision), then cut along it with the scissors */
  async function cutLength(piece, target, label, fab, remaining, vertical) { clearOverlay(); const cm = Math.max(remaining, 10); tableRuler(cm); const h = 12; const fabR = fabricRect(TABLE.x0, TABLE.y, remaining * TABLE.pxcm, h, fab); say(t(vertical ? 'cutMarkH' : 'cutMark', { piece: label, n: num(target) }), null);
    const chalkImg = sv('image', { href: asset('chalk.webp'), width: 6, height: 6, x: TABLE.x0 - 3, y: TABLE.y - 7, cursor: 'grab' }); overlay.appendChild(chalkImg); const line = chalkLine(TABLE.x0, TABLE.y, TABLE.y + h); line.setAttribute('opacity', 0); const tag = sv('text', { x: TABLE.x0, y: TABLE.y - 8, 'font-size': 2.4, 'text-anchor': 'middle', fill: '#ffe7a8', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); overlay.appendChild(tag);
    window.__geo = { kind: 'chalk', x0: TABLE.x0, y: TABLE.y, h, pxcm: TABLE.pxcm, target }; let at = 0; const setAt = v => { at = clamp(round(v), 0, remaining); const X = TABLE.x0 + at * TABLE.pxcm; chalkImg.setAttribute('x', X - 3); line.setAttribute('x1', X); line.setAttribute('x2', X); line.setAttribute('opacity', at > 0 ? 1 : 0); tag.setAttribute('x', X); tag.textContent = num(at) + ' ' + t('unitCm'); };
    for (;;) { setAt(0); let moved = false; await new Promise(res => { drag(chalkImg, p => { moved = true; setAt((p.x - TABLE.x0) / TABLE.pxcm); }, () => { if (moved && at > 0) res(); }); clearActions(); });
      const go = await actions([[t('cut'), 'cut'], [t('again'), 'again', 'ghost']]); if (go === 'again') continue;
      /* the scissors: drag across the chalk line from top to bottom */
      say(t('cutGo'), null); const X = TABLE.x0 + at * TABLE.pxcm; const sc = sv('image', { href: asset('scissors.webp'), width: 9, height: 9, x: X - 4.5, y: TABLE.y - 11, cursor: 'grab' }); overlay.appendChild(sc); let y = TABLE.y - 11, done = false;
      await new Promise(res => { drag(sc, p => { if (done) return; y = clamp(p.y - 4.5, TABLE.y - 11, TABLE.y + h); sc.setAttribute('y', y); if (Math.abs(p.x - X) > 6) sc.setAttribute('x', clamp(p.x - 4.5, X - 6, X + 6)); if (y >= TABLE.y + h - 1.5) { done = true; res(); } }, () => { if (!done) { sc.setAttribute('y', TABLE.y - 11); } }); });
      sc.remove(); const cut = at; /* the piece slides off the roll */ fabR.setAttribute('width', (remaining - cut) * TABLE.pxcm); fabR.setAttribute('x', TABLE.x0 + cut * TABLE.pxcm); const piece = fabricRect(TABLE.x0, TABLE.y, cut * TABLE.pxcm, h, fab); piece.setAttribute('transform', 'translate(0 -18)'); say(t('cutDone', { n: num(cut) }), null, same(cut, target) ? 'ok' : null); await wait(900); return cut; } }
  /* the compass: open it to r on the ruler, draw the circle on the fabric, cut round it */
  async function cutCircle(piece, r, label, fab, remaining) { clearOverlay(); const cm = Math.max(remaining, 10); tableRuler(cm); const h = 14; fabricRect(TABLE.x0, TABLE.y - 2, remaining * TABLE.pxcm, h, fab); say(t('cutCircle', { piece: label, n: r.toFixed(1) }), null);
    const pin = { x: TABLE.x0, y: TABLE.y + 13 - 2 }; const legs = sv('path', { d: '', fill: 'none', stroke: '#2a2a3a', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); overlay.appendChild(legs); overlay.appendChild(sv('circle', { cx: pin.x, cy: pin.y, r: 1.1, fill: '#2a2a3a' })); const knob = sv('circle', { cx: pin.x + 4, cy: pin.y, r: 2.4, fill: '#ff6aa8', stroke: '#fff', 'stroke-width': 0.6, cursor: 'grab' }); overlay.appendChild(knob); const tag = sv('text', { x: pin.x + 4, y: pin.y - 9, 'font-size': 2.4, 'text-anchor': 'middle', fill: '#ffe7a8', 'font-family': 'Assistant, sans-serif', 'font-weight': 800 }); overlay.appendChild(tag);
    window.__geo = { kind: 'compass', px: pin.x, py: pin.y, pxcm: TABLE.pxcm, r, h, y: TABLE.y - 2 }; let open = 0; const setOpen = v => { open = clamp(Math.round(v * 10) / 10, 0, Math.min(remaining / 2, 12)); const X = pin.x + open * TABLE.pxcm; knob.setAttribute('cx', X); legs.setAttribute('d', 'M' + pin.x + ' ' + pin.y + ' L' + ((pin.x + X) / 2) + ' ' + (pin.y - 12) + ' L' + X + ' ' + pin.y); tag.setAttribute('x', (pin.x + X) / 2); tag.textContent = open.toFixed(1) + ' ' + t('unitCm'); };
    for (;;) { setOpen(2); await new Promise(res => { drag(knob, p => setOpen((p.x - pin.x) / TABLE.pxcm), () => res()); });
      if (!same(open, r)) { say(t('compassNo', { v: open.toFixed(1), n: r.toFixed(1) }), null, 'bad'); await wait(900); say(t('cutCircle', { piece: label, n: r.toFixed(1) }), null); continue; }
      say(t('compassSet', { n: r.toFixed(1) }) + ' ' + t('drawCircle'), null, 'ok'); const R = open * TABLE.pxcm; const cx = TABLE.x0 + R + 1, cy = TABLE.y - 2 + h / 2; const circ = sv('circle', { cx, cy, r: Math.min(R, h / 2 - 0.5), fill: 'none', stroke: '#fff', 'stroke-width': 0.7, 'stroke-dasharray': '1.2 0.8', opacity: 0 }); overlay.appendChild(circ);
      await new Promise(res => { const hit = sv('rect', { x: TABLE.x0, y: TABLE.y - 2, width: remaining * TABLE.pxcm, height: h, fill: 'transparent', cursor: 'pointer' }); overlay.appendChild(hit); hit.addEventListener('pointerdown', () => { circ.setAttribute('opacity', 1); hit.remove(); res(); }); });
      say(t('cutGo'), null); const sc = sv('image', { href: asset('scissors.webp'), width: 8, height: 8, x: cx + R - 4, y: cy - 4, cursor: 'grab' }); overlay.appendChild(sc); let cov = 0, lastA = null, done = false;
      await new Promise(res => { drag(sc, (p, e, first) => { if (done) return; const a = Math.atan2(p.y - cy, p.x - cx); if (lastA != null && !first) { let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; cov += Math.abs(d); } lastA = a; sc.setAttribute('x', cx + R * Math.cos(a) - 4); sc.setAttribute('y', cy + R * Math.sin(a) - 4); if (cov >= Math.PI * 1.7) { done = true; res(); } }, () => {}); });
      sc.remove(); circ.setAttribute('fill', 'url(#fab_' + fab + ')'); circ.setAttribute('transform', 'translate(0 -20)'); say(t('cutDone', { n: open.toFixed(1) }), null, 'ok'); await wait(900); return open; } }

  /* ---------- the fit: the body judges ---------- */
  function judge(piece, M) { const out = []; const tol = TOL[S.tier];
    for (const d of piece.cut) { const got = piece.got[d.key]; if (got == null) continue; const diff = got - d.ans; const a = Math.abs(diff);
      if (a <= tol + 1e-9) continue; if (d.circle) out.push({ key: d.key, kind: diff < 0 ? 'small' : 'big', d: a }); else if (d.key === 'h') out.push({ key: d.key, kind: diff < 0 ? 'short' : 'long', d: a }); else out.push({ key: d.key, kind: diff < 0 ? 'tight' : 'loose', d: a }); }
    return out; }
  function drawOutfit(target, pieces, b, m) {   /* the pieces on the body, from the real cuts: a skirt that is too short stops above the knee, a tight one shows a gap */
    const yW = b.top + b.h * m.waistY, yK = yW + C.m.len * b.pxcm, bw = b.w * m.waistW;
    for (const p of pieces) { const fab = p.fab; const need = p.cut.reduce((o, d) => (o[d.key] = d.ans, o), {}); const got = p.got;
      if (p.kind === 'skirt') { const h = (got.h || need.h) * b.pxcm; const ratio = (got.len || need.len) / need.len; const wTop = bw * Math.min(1.25, Math.max(0.6, ratio)); const flare = 1.35; const pts = [[b.cx - wTop / 2, yW], [b.cx + wTop / 2, yW], [b.cx + wTop * flare / 2, yW + h], [b.cx - wTop * flare / 2, yW + h]]; const poly = sv('polygon', { points: pts.map(q => q.join(',')).join(' '), fill: 'url(#fab_' + fab + ')', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.3 }); target.appendChild(poly); if (ratio < 0.97) target.appendChild(sv('rect', { x: b.cx + wTop / 2 - 0.5, y: yW, width: bw - wTop + 1, height: h * 0.5, fill: 'rgba(232,52,58,.55)' })); if (ratio > 1.03) target.appendChild(sv('path', { d: 'M' + (b.cx + wTop / 2) + ' ' + yW + ' q 3 ' + (h / 2) + ' 0 ' + h, fill: 'none', stroke: 'rgba(0,0,0,.4)', 'stroke-width': 0.6 })); }
      if (p.kind === 'circleSkirt') { const h = (got.h || need.h) * b.pxcm; const ratio = (got.r || need.r) / need.r; const wTop = bw * Math.min(1.3, Math.max(0.6, ratio)); const pts = [[b.cx - wTop / 2, yW], [b.cx + wTop / 2, yW], [b.cx + wTop * 1.9 / 2, yW + h], [b.cx - wTop * 1.9 / 2, yW + h]]; target.appendChild(sv('polygon', { points: pts.map(q => q.join(',')).join(' '), fill: 'url(#fab_' + fab + ')', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.3 })); if (ratio < 0.97) target.appendChild(sv('rect', { x: b.cx + wTop / 2 - 0.5, y: yW, width: bw - wTop + 1, height: h * 0.4, fill: 'rgba(232,52,58,.55)' })); }
      if (p.kind === 'belt') { const ratio = (got.len || need.len) / need.len; const w = bw * Math.min(1.3, ratio) + 1; target.appendChild(sv('rect', { x: b.cx - w / 2, y: yW - 1.2, width: w, height: 2.4, rx: 0.5, fill: 'url(#fab_' + fab + ')', stroke: 'rgba(0,0,0,.4)', 'stroke-width': 0.3 })); if (ratio < 0.97) target.appendChild(sv('rect', { x: b.cx + w / 2 - 0.4, y: yW - 1.2, width: bw - w + 1.4, height: 2.4, fill: 'rgba(232,52,58,.6)' })); }
      if (p.kind === 'bow') { const yN = b.top + b.h * (m.headY + 0.17); const s = (got.len || need.len) * b.pxcm * 0.5; target.appendChild(sv('path', { d: 'M' + b.cx + ' ' + yN + ' l ' + (-s) + ' ' + (-s * 0.6) + ' l 0 ' + (s * 1.2) + ' z M' + b.cx + ' ' + yN + ' l ' + s + ' ' + (-s * 0.6) + ' l 0 ' + (s * 1.2) + ' z', fill: 'url(#fab_' + fab + ')', stroke: '#2a1a0a', 'stroke-width': 0.5 })); target.appendChild(sv('circle', { cx: b.cx, cy: yN, r: s * 0.22, fill: '#3a1a44' })); }
      if (p.kind === 'hat') { const yH = b.top + b.h * (m.headY - 0.02); const ratio = (got.r || need.r) / need.r; const w = b.w * m.headW * Math.min(1.35, Math.max(0.6, ratio)); target.appendChild(sv('ellipse', { cx: b.cx, cy: yH, rx: w / 2, ry: 1.8, fill: 'url(#fab_' + fab + ')', stroke: 'rgba(0,0,0,.4)', 'stroke-width': 0.3 })); target.appendChild(sv('ellipse', { cx: b.cx, cy: yH - 2.5, rx: w / 3, ry: 3, fill: 'url(#fab_' + fab + ')', stroke: 'rgba(0,0,0,.4)', 'stroke-width': 0.3 })); }
      if (p.kind === 'hat' || p.kind === 'bow') continue; } }
  function outfitSVG(pieces) { const s = sv('svg', { viewBox: '0 0 40 60' }); const fake = { top: 2, h: 56, w: 20, cx: 20, pxcm: 56 / CLIENT_CM }; const defs = sv('defs'); for (const p of pieces) { const pat = sv('pattern', { id: 'w_' + p.fab, patternUnits: 'userSpaceOnUse', width: 12, height: 12 }); const im = sv('image', { href: asset(p.fab + '.webp'), width: 12, height: 12, preserveAspectRatio: 'none' }); pat.appendChild(im); defs.appendChild(pat); } s.appendChild(defs); const g = sv('g'); s.appendChild(g); const saveM = C.m; C.m = pieces.M; drawOutfit(g, pieces.map(p => Object.assign({}, p, { fab: p.fab })), fake, pieces.meta); C.m = saveM; g.querySelectorAll('[fill^="url(#fab_"]').forEach(e => e.setAttribute('fill', e.getAttribute('fill').replace('#fab_', '#w_'))); return s; }

  /* ---------- the wardrobe ---------- */
  function openCloset() { let c = $('.closet', ui); if (c) { c.remove(); return; } c = el('div', 'closet'); const top = el('div', 'actions'); top.style.position = 'static'; top.style.justifyContent = 'flex-start'; top.style.marginBottom = '.8em'; const back = el('button', 'btn ghost', t('back')); back.onclick = () => c.remove(); top.appendChild(back); c.appendChild(top);
    if (!S.wardrobe.length) c.appendChild(el('p', null, t('wardrobeEmpty'))); else { const g = el('div', 'grid'); for (const o of S.wardrobe.slice().reverse()) { const it = el('div', 'item'); try { it.appendChild(outfitSVG(Object.assign(o.pieces.slice(), { M: o.M, meta: o.meta }))); } catch (e) {} it.appendChild(el('small', null, t('wardrobeOf', { name: t('client.' + o.client), d: o.day }))); g.appendChild(it); } c.appendChild(g); } ui.appendChild(c); }

  /* ---------- one client, A to Z ---------- */
  async function serve() { const key = CLIENTS[(S.seen++) % CLIENTS.length]; save(); clearOverlay(); await placeClient(key); const order = makeOrder(); const name = t('client.' + key);
    const names = order.pieces.map(p => t('aPiece.' + p.kind)); const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' ' + t('and') + names[names.length - 1] : names[0];
    say(t('wish.' + key, { pieces: list }), name); await actions([[t('next'), 1]]);
    /* 1 · measure what the order needs */
    const M = {}; const need = [...new Set(order.pieces.flatMap(needs))]; let misses = 0;
    for (const n of need) { const r = n === 'len' ? await measureLength() : await measureRound(n); M[n] = r.value; if (!r.ok) misses++; }
    /* 2 · the pattern: every dimension derived from a measurement */
    say(t('draftTitle'), null); await wait(900); for (const p of order.pieces) { p.cut = dims(p, M); p.got = {}; p.label = t('piece.' + p.kind); for (const d of p.cut) { const r = await askNumber(d.q, d.ans, null, { decimals: !!d.decimals || S.tier > 1, yes: 'draftYes', no: 'draftNo', show: 'draftShow', why: d.why }); if (!r.ok) misses++; } }
    /* 3 · fabric: estimate, then buy */
    const totalNeed = order.pieces.reduce((s, p) => s + fabricNeed(p), 0); let roll = 0, spent = 0;
    for (;;) { say(t('buyAsk'), null); window.__answer = Math.ceil(totalNeed); let b = Math.round(await pad(false)); let c = Math.ceil(b / 10); if (c > S.coins) { b = S.coins * 10; c = S.coins; say(t('buyPoor', { b }), null, 'bad'); await wait(1200); } S.coins -= c; spent += c; roll += b; hud(); save(); say(t('bought', { b, c }), null, 'ok'); await wait(1000);
      if (roll >= Math.ceil(totalNeed) - 1e-9 || S.coins <= 0) break; say(t('buyTooLittle', { b: roll, need: num(totalNeed) }), null, 'bad'); await actions([[t('buyMore'), 1]]); }
    /* 4 · pick a fabric per piece and cut it */
    let remaining = roll; for (const p of order.pieces) { p.fab = await pickFabric(p.label);
      for (const d of p.cut) { if (d.skipCut) { p.got[d.key] = d.ans; continue; } const needCm = d.circle ? 2 * d.ans + 1 : d.ans; if (remaining + 1e-9 < Math.min(needCm, d.vertical ? 0 : needCm)) { /* out of fabric: buy more */ say(t('notEnough'), null, 'bad'); await actions([[t('buyMore'), 1]]); window.__answer = Math.ceil(needCm); const b = Math.round(await pad(false)); const c = Math.min(S.coins, Math.ceil(b / 10)); S.coins -= c; remaining += c * 10; roll += c * 10; spent += c; hud(); save(); }
        if (d.circle) { const got = await cutCircle(p, d.ans, p.label, p.fab, remaining); p.got[d.key] = got; remaining = Math.max(0, remaining - (2 * got + 1)); } else if (d.vertical) { p.got[d.key] = await cutLength(p, d.ans, p.label, p.fab, Math.max(remaining, 12), true); } else { const got = await cutLength(p, d.ans, p.label, p.fab, remaining, false); p.got[d.key] = got; remaining = Math.max(0, remaining - got); } } }
    /* 5 · the try-on: the body judges; fix until it fits or the kid gives up */
    let quality = 0; for (let round = 0; ; round++) { clearOverlay(); if (C.el) C.el.style.opacity = '1'; const g = sv('g'); overlay.appendChild(g); const b = C.box(); for (const p of order.pieces) { /* defs for patterns */ fabricRect(-50, -50, 1, 1, p.fab); } drawOutfit(g, order.pieces, b, C.meta);
      const problems = order.pieces.map(p => ({ p, bad: judge(p, M) })); const lines = problems.map(({ p, bad }) => bad.length ? t('fit.' + bad[0].kind, { piece: p.label, d: num(bad[0].d) }) : t('fit.perfect', { piece: p.label }));
      say(t('fitTitle', { name }) + ' · ' + lines.join(' '), name, problems.every(x => !x.bad.length) ? 'ok' : 'bad'); quality = problems.reduce((s, x) => s + (x.bad.length ? (x.bad[0].d <= TOL[S.tier] * 3 ? 0.5 : 0.15) : 1), 0) / order.pieces.length;
      if (problems.every(x => !x.bad.length)) { burst(b.cx, b.top + 20); await actions([[t('pay'), 1]]); break; }
      const go = await actions([[t('fix'), 'fix'], [t('pay'), 'pay', 'ghost']]); if (go === 'pay') break;
      for (const { p, bad } of problems) { for (const x of bad) { const d = p.cut.find(q => q.key === x.key); say(t('fixHow.' + x.kind, { d: num(x.d) }), null); await wait(1400);
          if (x.kind === 'loose' || x.kind === 'long') { const off = await cutLength(p, x.d, p.label, p.fab, p.got[x.key], d.vertical); p.got[x.key] = round(p.got[x.key] - off); }
          else { if (d.circle) { if (remaining < 2 * d.ans + 1) { say(t('notEnough'), null, 'bad'); await actions([[t('buyMore'), 1]]); window.__answer = 10; const bb = Math.round(await pad(false)); const c = Math.min(S.coins, Math.ceil(bb / 10)); S.coins -= c; remaining += c * 10; spent += c; hud(); save(); } const got = await cutCircle(p, d.ans, p.label, p.fab, remaining); p.got[x.key] = got; remaining = Math.max(0, remaining - (2 * got + 1)); }
            else { if (!d.vertical && remaining < d.ans) { say(t('notEnough'), null, 'bad'); await actions([[t('buyMore'), 1]]); window.__answer = 10; const bb = Math.round(await pad(false)); const c = Math.min(S.coins, Math.ceil(bb / 10)); S.coins -= c; remaining += c * 10; spent += c; hud(); save(); } const got = await cutLength(p, d.ans, p.label, p.fab, d.vertical ? Math.max(remaining, 12) : remaining, !!d.vertical); p.got[x.key] = got; if (!d.vertical) remaining = Math.max(0, remaining - got); } } } } }
    /* 6 · payment: by fit, by waste */
    clearOverlay(); if (C.el) C.el.style.opacity = '1'; const base = Math.round(order.pieces.length * 4 * quality); const waste = Math.max(0, roll - order.pieces.reduce((s, p) => s + fabricNeed(p), 0)); const bonus = waste <= Math.ceil(totalNeed * 0.25) ? 2 : 0; S.coins += base + bonus; const perfect = quality >= 0.999; if (perfect) S.rep++;
    say(t('paid', { name, c: base }) + (bonus ? ' ' + t('bonus', { c: bonus }) : '') + ' · ' + t('waste', { w: num(waste) }) + (perfect ? ' · ' + t('star') : ''), name, perfect ? 'ok' : null); hud(); burst(W / 2, 30);
    S.wardrobe.push({ client: key, day: S.day, pieces: order.pieces.map(p => ({ kind: p.kind, fab: p.fab, cut: p.cut.map(d => ({ key: d.key, ans: d.ans, circle: !!d.circle })), got: p.got })), M, meta: C.meta }); S.day++; save(); await actions([[t('nextClient'), 1]]);
    say(perfect ? t('happy') : t('soso'), name); clientLeave(); await wait(1100); clearSay(); hud(); }
  function pickFabric(label) { return new Promise(res => { let box = $('.fabrics', ui); if (box) box.remove(); box = el('div', 'fabrics'); for (const f of FABS) { const b = el('button'); b.style.backgroundImage = 'url(' + asset(f + '.webp') + ')'; b.title = f; b.onclick = () => { box.remove(); res(f); }; box.appendChild(b); } ui.appendChild(box); say(label + ' · ' + (S.lang === 'he' ? 'בוחרים בד' : 'pick a fabric'), null); }); }

  /* ---------- start: who plays, how old, which language ---------- */
  function startSheet() { return new Promise(res => { const sh = el('div', 'sheet'); const card = el('div', 'card'); card.appendChild(el('h1', null, t('title'))); card.appendChild(el('p', null, t('subtitle')));
    const name = el('input'); name.placeholder = S.lang === 'he' ? 'השם שלך' : 'Your name'; name.value = S.name || ''; card.appendChild(name);
    const ages = el('div', 'row'); let age = S.age; for (let a = 4; a <= 15; a++) { const b = el('button', a === age ? 'on' : '', a === 15 ? '15+' : String(a)); b.onclick = () => { age = a; [...ages.children].forEach(x => x.classList.toggle('on', x === b)); }; ages.appendChild(b); } card.appendChild(ages);
    const langs = el('div', 'row'); for (const [id, lbl] of [['he', 'עברית'], ['en', 'English']]) { const b = el('button', id === S.lang ? 'on' : '', lbl); b.onclick = () => { S.lang = id; save(); location.reload(); }; langs.appendChild(b); } card.appendChild(langs);
    const go = el('button', 'btn', t('open')); go.onclick = () => { S.name = name.value.trim() || S.name || '?'; S.age = age; S.tier = age <= 6 ? 1 : age <= 10 ? 2 : 3; S.look = age <= 6 ? 'felt' : 'nature'; save(); sh.remove(); res(); }; card.appendChild(go); sh.appendChild(card); ui.appendChild(sh); }); }

  async function main() { load(); $('#ver').textContent = 'v' + VERSION; document.documentElement.lang = S.lang; document.documentElement.dir = T().dir; await startSheet(); await loadLook(); hud();
    for (;;) { say(t('ring'), null); const b = C.box; await actions([[t('ring'), 1]]); await serve(); } }
  window.AT = { S, get client() { return C; }, t, get W() { return W; } };
  main();
})();
