/* Kingdom Quest — the Paint Studio (Yoni 2026-10-03: Art Studio — paint like the masters, from classical to contemporary; the artist and the
   piece are always named). A real canvas: brushes, a palette, stamps for the youngest, mixing two paints, and style brushes that work the
   way the masters did — Van Gogh's swirls, Seurat's and Kusama's dots, Mondrian's grid, Pollock's drips, Lichtenstein's comic dots,
   Matisse's paper cut-outs. "Paint like…" puts the real painting beside the child's canvas. Works are saved, signed with the child's name,
   in their own gallery (KQ.state().art[pid].works, a small WebP each, eight at most). API: KQPaint.open(band) */
(function () {
  'use strict';
  const A = window.KQArtKit; if (!A || !window.KQ) return;
  const { t } = KQ, el = KQ.ui.el;
  KQ.i18n.extend({
    en: { ps_title: 'Paint Studio', ps_close: 'Close', ps_brush: 'Brush', ps_stamp: 'Stamps', ps_size: 'Size', ps_undo: 'Undo', ps_clear: 'Clear', ps_save: 'Hang it in my gallery', ps_mix: 'Mix two paints', ps_mixed: 'You mixed a new colour!', ps_like: 'Paint like…', ps_free: 'My own idea', ps_gallery: 'My gallery', ps_empty: 'Your paintings will hang here.', ps_saved: 'Hung in your gallery!', ps_mine: 'My painting', ps_after: 'inspired by {artist}', ps_del: 'Remove', ps_full: 'Your gallery is full (8 paintings). Remove one to hang a new one.',
      ps_swirl: 'Swirls', ps_dots: 'Dots', ps_grid: 'Lines and blocks', ps_drip: 'Drips', ps_pop: 'Comic dots', ps_cut: 'Cut-outs', ps_eraser: 'Eraser',
      ps_g_free: 'Pick a colour and paint with your finger.', ps_g_like: 'Look at the painting by {artist}. Use the {tool} brush to paint like {who}!', ps_g_likeBrush: 'Look at the painting by {artist}. Paint bold, simple lines like {who}!', ps_tn_swirl: 'swirls', ps_tn_dots: 'dots', ps_tn_drip: 'drips', ps_tn_pop: 'comic dots', ps_tn_cut: 'cut-outs', ps_g_grid: 'Draw lines from edge to edge, then tap a box to fill it with colour.', ps_g_mix: 'Tap two paints to mix them.' },
    he: { ps_title: 'סטודיו הציור', ps_close: 'סגירה', ps_brush: 'מכחול', ps_stamp: 'חותמות', ps_size: 'גודל', ps_undo: 'ביטול', ps_clear: 'ניקוי', ps_save: 'תולים בגלריה שלי', ps_mix: 'מערבבים שני צבעים', ps_mixed: 'ערבבתם צבע חדש!', ps_like: 'מציירים כמו…', ps_free: 'רעיון משלי', ps_gallery: 'הגלריה שלי', ps_empty: 'הציורים שלכם ייתלו כאן.', ps_saved: 'נתלה בגלריה שלכם!', ps_mine: 'הציור שלי', ps_after: 'בהשראת {artist}', ps_del: 'הורדה', ps_full: 'הגלריה מלאה (8 ציורים). מורידים אחד כדי לתלות חדש.',
      ps_swirl: 'סלסולים', ps_dots: 'נקודות', ps_grid: 'קווים ומלבנים', ps_drip: 'טפטופים', ps_pop: 'נקודות קומיקס', ps_cut: 'גזרות', ps_eraser: 'מחק',
      ps_g_free: 'בוחרים צבע ומציירים עם האצבע.', ps_g_like: 'מסתכלים על הציור של {artist}. מציירים עם מכחול {tool} כמו {who}!', ps_g_likeBrush: 'מסתכלים על הציור של {artist}. מציירים קווים חזקים ופשוטים כמו {who}!', ps_tn_swirl: 'הסלסולים', ps_tn_dots: 'הנקודות', ps_tn_drip: 'הטפטופים', ps_tn_pop: 'נקודות הקומיקס', ps_tn_cut: 'הגזרות', ps_g_grid: 'מותחים קווים מקצה לקצה, ואז לוחצים על מלבן כדי למלא אותו בצבע.', ps_g_mix: 'לוחצים על שני צבעים כדי לערבב אותם.' }
  });
  const he = () => KQ.i18n.lang === 'he';
  const PAL1 = ['#e3262e', '#f28a1e', '#f7d038', '#3caa48', '#2a62d0', '#7a3ab0', '#f49ac0', '#7a4a24', '#1a1a1a', '#ffffff'];
  const PAL2 = PAL1.concat(['#8ac8f4', '#b8e070', '#ffd8a8', '#a0a0a0', '#0a7a7a', '#c81e6e']);
  const LIKE = [['starry-night', 'swirl'], ['grande-jatte', 'dots'], ['kusama-pumpkin', 'dots'], ['mondrian-rby', 'grid'], ['pollock-convergence-number-10', 'drip'], ['lichtenstein-girl-with-ball', 'pop'], ['matisse-the-snail', 'cut'], ['matisse-icarus', 'cut'], ['water-lilies', 'swirl'], ['haring-best-buddies', 'brush']];
  const work = id => KQ_ART.find(w => w.id === id);
  const store = () => { const st = KQ.state(); st.art = st.art || {}; const pid = (KQ.profiles.active() || {}).id || 'guest'; return (st.art[pid] = st.art[pid] || { works: [] }); };
  const myName = () => (KQ.profiles.active() || {}).name || '';
  let S = null, root = null;

  function open(band) {
    close(); band = band || 1;
    S = { band, color: PAL1[0], size: band <= 1 ? 26 : 18, tool: 'brush', stamp: null, like: null, undo: [], mixA: null, grid: { v: [], h: [] } };
    root = el('div', 'mc ps'); root.setAttribute('role', 'dialog'); document.body.appendChild(root); document.body.classList.add('mc-open');
    draw(); guide(t('ps_g_free'));
  }
  function close() { if (root) root.remove(); root = null; document.body.classList.remove('mc-open'); }
  function guide(text) { S.msg = text; const g = root && root.querySelector('.mc-guide'); if (!g) return; g.querySelector('span').textContent = text; if (S.band <= 2 && KQ.store && KQ.store.settings && KQ.store.settings.voice) KQ.speak(text); }

  let cv = null, ctx = null;
  function draw() {
    root.replaceChildren(); const band = S.band;
    const hd = el('div', 'mc-head'); hd.appendChild(el('h2', null, t('ps_title'))); const x = el('button', 'mc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', t('ps_close')); x.onclick = close; hd.appendChild(x); root.appendChild(hd);
    const g = el('div', 'mc-guide'); g.appendChild(el('span', null, S.msg || '')); if (band <= 2) { const sp = el('button', 'mc-say'); sp.type = 'button'; sp.setAttribute('aria-label', 'speak'); sp.appendChild(KQ.icon('🔊') || el('span', null, '♪')); sp.onclick = () => KQ.speak(g.querySelector('span').textContent, null, { force: true }); g.appendChild(sp); } root.appendChild(g);
    /* "Paint like…": the masters (ages 6+), with the real painting beside the canvas */
    if (band >= 2) { const row = el('div', 'ps-like'); const free = el('button', 'ps-likeb' + (!S.like ? ' on' : ''), t('ps_free')); free.type = 'button'; free.onclick = () => { S.like = null; S.tool = 'brush'; draw(); guide(t('ps_g_free')); }; row.appendChild(free);
      LIKE.filter(([id]) => work(id) && work(id).band <= Math.max(2, band)).forEach(([id, tool]) => { const w = work(id), b = el('button', 'ps-likeb' + (S.like === id ? ' on' : '')); b.type = 'button'; b.appendChild(A.img(w)); b.appendChild(el('span', null, A.artistName(w.a[0]))); b.onclick = () => { S.like = id; if (toolOk(tool)) S.tool = tool; draw(); likeGuide(); }; row.appendChild(b); }); root.appendChild(row); }
    const stage = el('div', 'ps-stage');
    if (S.like) { const w = work(S.like), ref = el('div', 'ps-ref'); ref.appendChild(A.framed(w)); ref.appendChild(A.caption(w)); stage.appendChild(ref); }
    const wrap = el('div', 'ps-canvas'); const keep = cv; cv = document.createElement('canvas'); cv.width = 960; cv.height = 720; ctx = cv.getContext('2d');
    if (keep) ctx.drawImage(keep, 0, 0); else { ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, 960, 720); }
    wrap.appendChild(cv); stage.appendChild(wrap); root.appendChild(stage); bind();
    /* tools */
    const tools = el('div', 'ps-tools');
    const toolBtn = (k, label, icon) => { const b = el('button', 'ps-tool' + (S.tool === k ? ' on' : '')); b.type = 'button'; b.appendChild(toolIcon(k)); b.appendChild(el('span', null, label)); b.onclick = () => { S.tool = k; S.stamp = null; draw(); if (k === 'grid') guide(t('ps_g_grid')); }; return b; };
    tools.appendChild(toolBtn('brush', t('ps_brush')));
    if (band >= 3 || S.like) for (const k of ['swirl', 'dots', 'grid', 'drip', 'pop', 'cut']) if (toolOk(k)) tools.appendChild(toolBtn(k, t('ps_' + k)));
    if (band >= 4) tools.appendChild(toolBtn('eraser', t('ps_eraser')));
    root.appendChild(tools);
    /* stamps for the youngest */
    if (band <= 2) { const st = el('div', 'ps-stamps'); for (const k of ['🌟', '❤️', '🌸', '🦋', '☀️', '🌈', '🐱', '🍎']) { const b = el('button', 'ps-stampb' + (S.stamp === k ? ' on' : '')); b.type = 'button'; b.appendChild(KQ.icon(k) || el('span', null, k)); b.onclick = () => { S.stamp = S.stamp === k ? null : k; draw(); }; st.appendChild(b); } root.appendChild(st); }
    /* palette (+ mixing from 6) and size */
    const pal = el('div', 'ps-pal'); (band <= 1 ? PAL1 : PAL2).forEach(c => { const b = el('button', 'ps-col' + (S.color === c ? ' on' : '')); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', c); b.onclick = () => pickColor(c); pal.appendChild(b); });
    if (S.mixed) { const b = el('button', 'ps-col on mixed'); b.type = 'button'; b.style.background = S.mixed; b.onclick = () => pickColor(S.mixed); pal.appendChild(b); }
    root.appendChild(pal);
    const ctl = el('div', 'mc-ctl');
    if (band >= 2) { const mx = el('button', 'btn ghost' + (S.mixA !== null ? ' on' : ''), t('ps_mix')); mx.type = 'button'; mx.onclick = () => { S.mixA = S.mixA === null ? '' : null; draw(); if (S.mixA !== null) guide(t('ps_g_mix')); }; ctl.appendChild(mx);
      const sz = el('label', 'mc-tempo'); sz.appendChild(el('span', null, t('ps_size'))); const r = document.createElement('input'); r.type = 'range'; r.min = 4; r.max = 60; r.value = S.size; r.oninput = () => { S.size = +r.value; }; sz.appendChild(r); ctl.appendChild(sz); }
    const un = el('button', 'btn ghost', t('ps_undo')); un.type = 'button'; un.onclick = undo; ctl.appendChild(un);
    const cl = el('button', 'btn ghost', t('ps_clear')); cl.type = 'button'; cl.onclick = () => { snap(); ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, 960, 720); S.grid = { v: [], h: [] }; }; ctl.appendChild(cl);
    const sv = el('button', 'btn gold', t('ps_save')); sv.type = 'button'; sv.onclick = save; ctl.appendChild(sv);
    root.appendChild(ctl);
    gallery();
  }
  function toolOk(k) { return S.band >= 3 || (S.like && LIKE.some(([id, tl]) => id === S.like && tl === k)) || k === 'brush'; }
  function likeGuide() { const w = work(S.like), tl = (LIKE.find(([id]) => id === S.like) || [])[1]; guide(tl === 'grid' ? t('ps_g_grid') : tl === 'brush' ? t('ps_g_likeBrush', { artist: A.artistName(w.a[0]), who: A.artistName(w.a[0]) }) : t('ps_g_like', { artist: A.artistName(w.a[0]), tool: t('ps_tn_' + tl), who: A.artistName(w.a[0]) })); }
  function toolIcon(k) { const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 32 32'); s.setAttribute('class', 'ps-ti');
    const P = (d, f) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', f ? 'currentColor' : 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2.4'); p.setAttribute('stroke-linecap', 'round'); s.appendChild(p); };
    ({ brush: () => { P('M6 26c4 0 6-2 6-5l14-14-3-3L9 18c-3 0-5 2-5 5'); }, swirl: () => P('M16 16a3 3 0 1 1 3 3 6 6 0 1 1-6-6 9 9 0 1 1 9 9'), dots: () => { for (const [x, y] of [[8, 8], [16, 10], [24, 8], [10, 18], [20, 18], [14, 26], [24, 25]]) P(`M${x} ${y}m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0`, 1); },
      grid: () => { P('M4 4h24v24H4z'); P('M12 4v24M4 16h24M20 16v12'); }, drip: () => P('M6 6c6 4 2 10 8 12s4 8 10 8M20 4c-2 6 4 6 2 12'), pop: () => { for (let y = 6; y < 30; y += 6) for (let x = 6 + (y % 12 ? 3 : 0); x < 30; x += 6) P(`M${x} ${y}m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0`, 1); },
      cut: () => P('M6 22c2-8 8-14 14-12s4 10-4 12-8 4-10 0z', 1), eraser: () => P('M6 22l10-14 10 7-7 9H10z') }[k] || (() => {}))(); return s; }
  function pickColor(c) {
    if (S.mixA !== null && S.mixA !== undefined) { if (!S.mixA) { S.mixA = c; guide(t('ps_g_mix')); return; } const m = mix(S.mixA, c); S.mixed = m; S.color = m; S.mixA = null; draw(); guide(t('ps_mixed')); return; }
    S.color = c; draw();
  }
  /* paints mix like paint, not like light: the painter's pairs first (red + yellow = orange, yellow + blue = green, red + blue = purple),
     white makes a tint, black a shade, anything else meets in the middle */
  function mix(a, b) { const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)), hex = v => '#' + v.map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
    const NAME = { '#e3262e': 'r', '#f7d038': 'y', '#2a62d0': 'b', '#f28a1e': 'o', '#3caa48': 'g', '#7a3ab0': 'p', '#ffffff': 'w', '#1a1a1a': 'k' }, n = [NAME[a.toLowerCase()], NAME[b.toLowerCase()]].sort().join('');
    const PAIRS = { ry: '#f28a1e', by: '#3caa48', br: '#7a3ab0', oy: '#f7b02a', gy: '#9ac83a', bg: '#1e8a7a', or: '#e8501e', pr: '#a82a6a', bp: '#4a3ab0', go: '#8a7a2a', op: '#8a4a3a', gp: '#5a5a6a' };
    if (PAIRS[n]) return PAIRS[n];
    const A1 = rgb(a), B1 = rgb(b);
    if (/w/.test(n) || /k/.test(n)) return hex(A1.map((v, i) => (v + B1[i]) / 2));
    return hex(A1.map((v, i) => Math.sqrt(v * B1[i])));
  }
  function snap() { try { S.undo.push(ctx.getImageData(0, 0, 960, 720)); if (S.undo.length > 12) S.undo.shift(); } catch (e) {} }
  function undo() { const im = S.undo.pop(); if (im) ctx.putImageData(im, 0, 0); }
  const R = (a, b) => a + Math.random() * (b - a);
  function bind() {
    let down = false, last = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 960, y: (e.clientY - r.top) / r.height * 720 }; };
    cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const p = pos(e); snap();
      if (S.stamp) { stampAt(p); return; }
      if (S.tool === 'grid') { gridTap(p); return; }
      down = true; last = p; paint(p, p, true); };
    cv.onpointermove = e => { if (!down) return; const p = pos(e); paint(last, p, false); last = p; };
    cv.onpointerup = cv.onpointercancel = () => { down = false; last = null; };
  }
  function paint(a, b, first) {
    const c = S.color, s = S.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    switch (S.tool) {
      case 'eraser': ctx.strokeStyle = '#fffdf8'; ctx.lineWidth = s * 1.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); break;
      case 'swirl': { /* short curved strokes in two shades, like Van Gogh's thick paint */ const n = Math.max(1, Math.floor(d / 6)); for (let i = 0; i < n; i++) { const x = a.x + dx * i / n, y = a.y + dy * i / n, ang = Math.atan2(dy, dx) + Math.PI / 2; ctx.strokeStyle = shade(c, R(-0.18, 0.18)); ctx.lineWidth = Math.max(3, s * 0.55); ctx.beginPath(); ctx.arc(x + Math.cos(ang) * s * 0.5, y + Math.sin(ang) * s * 0.5, s * R(0.7, 1.3), ang + R(0, 1), ang + R(1.6, 2.6)); ctx.stroke(); } break; }
      case 'dots': { const n = Math.max(1, Math.floor(d / Math.max(4, s * 0.45))) + (first ? 1 : 0); for (let i = 0; i < n * 2; i++) { const x = a.x + dx * Math.random() + R(-s, s), y = a.y + dy * Math.random() + R(-s, s); ctx.fillStyle = shade(c, R(-0.15, 0.15)); ctx.beginPath(); ctx.arc(x, y, Math.max(2, s * R(0.15, 0.3)), 0, 7); ctx.fill(); } break; }
      case 'drip': { /* flicked paint: splatters and thin trails, like Pollock dripping from a stick */ ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, s * R(0.1, 0.35)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(a.x + R(-30, 30), a.y + R(-30, 30), b.x, b.y); ctx.stroke(); if (Math.random() < 0.35) for (let i = 0; i < 4; i++) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(b.x + R(-s * 2, s * 2), b.y + R(-s * 2, s * 2), R(1.5, s * 0.25 + 2), 0, 7); ctx.fill(); } break; }
      case 'pop': { /* comic-book dots on a grid, like Lichtenstein's printed look */ const g = Math.max(10, s * 0.8); ctx.fillStyle = c; for (let y = Math.floor((Math.min(a.y, b.y) - s) / g) * g; y < Math.max(a.y, b.y) + s; y += g) for (let x = Math.floor((Math.min(a.x, b.x) - s) / g) * g; x < Math.max(a.x, b.x) + s; x += g) { if (distSeg({ x, y }, a, b) > s) continue; ctx.beginPath(); ctx.arc(x + ((y / g) % 2 ? g / 2 : 0), y, g * 0.28, 0, 7); ctx.fill(); } break; }
      case 'cut': { /* a paper cut-out: the shape fills solid, with Matisse's flat colour */ if (!S.cutPath || first) S.cutPath = [a]; S.cutPath.push(b); if (S.cutTimer) clearTimeout(S.cutTimer); ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        S.cutTimer = setTimeout(() => { const P = S.cutPath; if (P && P.length > 4) { ctx.fillStyle = c; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); } S.cutPath = null; }, 260); break; }
      default: ctx.strokeStyle = c; ctx.lineWidth = s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + (first ? 0.01 : 0), b.y); ctx.stroke();
    }
  }
  function distSeg(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy; let u = L2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2 : 0; u = Math.max(0, Math.min(1, u)); return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy); }
  function shade(hex, k) { const v = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)); return 'rgb(' + v.map(x => Math.max(0, Math.min(255, Math.round(x + k * 255)))).join(',') + ')'; }
  /* Mondrian's grid: a tap near an edge draws a black line across; a tap inside a box fills that box with the colour */
  function gridTap(p) {
    const G = S.grid, near = 40;
    if (p.x < near || p.x > 960 - near) { G.h.push(p.y); } else if (p.y < near || p.y > 720 - near) { G.v.push(p.x); }
    else { const xs = [0, ...G.v, 960].sort((a, b) => a - b), ys = [0, ...G.h, 720].sort((a, b) => a - b); const x0 = Math.max(...xs.filter(x => x <= p.x)), x1 = Math.min(...xs.filter(x => x > p.x)), y0 = Math.max(...ys.filter(y => y <= p.y)), y1 = Math.min(...ys.filter(y => y > p.y)); ctx.fillStyle = S.color; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
    ctx.fillStyle = '#111'; for (const x of G.v) ctx.fillRect(x - 7, 0, 14, 720); for (const y of G.h) ctx.fillRect(0, y - 7, 960, 14);
  }
  function stampAt(p) { KQ.iconCanvas && KQ.iconCanvas(S.stamp, 128).then(c => { const s = S.band <= 1 ? 150 : 110; ctx.drawImage(c, p.x - s / 2, p.y - s / 2, s, s); }); }
  function save() {
    const st = store(); if (st.works.length >= 8) { KQ.ui.toast(t('ps_full')); return; }
    const small = document.createElement('canvas'); small.width = 640; small.height = 480; small.getContext('2d').drawImage(cv, 0, 0, 640, 480);
    let url = ''; try { url = small.toDataURL('image/webp', 0.72); if (!/^data:image\/webp/.test(url)) url = small.toDataURL('image/jpeg', 0.72); } catch (e) { return; }
    const w = S.like ? work(S.like) : null; st.works.unshift({ img: url, at: Date.now(), name: myName(), after: w ? w.a[0] : null });
    try { KQ.save(); } catch (e) { st.works.shift(); KQ.ui.toast(t('ps_full')); return; }
    KQ.ui.toast(t('ps_saved')); gallery();
  }
  /* the child's own gallery: framed, signed "name · My painting, year (inspired by …)" */
  function gallery() {
    let box = root.querySelector('.ps-gallery'); if (box) box.remove(); box = el('div', 'mc-concert ps-gallery'); box.appendChild(el('h3', null, t('ps_gallery')));
    const works = store().works; if (!works.length) box.appendChild(el('p', null, t('ps_empty')));
    const g = el('div', 'ps-mine'); works.forEach((wk, i) => { const c = el('div', 'ps-minei'); const f = el('div', 'frame'); const im = document.createElement('img'); im.src = wk.img; im.alt = ''; f.appendChild(im); c.appendChild(f);
      const cap = el('div', 'cap'); cap.appendChild(el('b', null, (wk.name ? wk.name + ' · ' : '') + t('ps_mine') + ', ' + new Date(wk.at).getFullYear())); if (wk.after) cap.appendChild(el('span', null, t('ps_after', { artist: A.artistName(wk.after) }))); c.appendChild(cap);
      const d = el('button', 'btn sm ghost', t('ps_del')); d.type = 'button'; d.onclick = () => { store().works.splice(i, 1); try { KQ.save(); } catch (e) {} gallery(); }; c.appendChild(d); g.appendChild(c); });
    box.appendChild(g); root.appendChild(box);
  }
  document.addEventListener('keydown', e => { if (root && e.key === 'Escape') close(); });
  window.KQPaint = { open, close, get state() { return S; } };
})();
