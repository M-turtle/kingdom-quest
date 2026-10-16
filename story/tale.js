/* Story Forge — the shadow theatre under each story (Yoni 2026-09-26: "when a story is running there should be some sort
   of animation running beneath it … similar to The Tale of the Three Brothers"). Only the STYLE is borrowed: paper-cut
   puppets backlit in amber, ink smoke, every scene dissolving into smoke before the next. Every scene is our own — four
   beats for each of the eight Story Forge stories (same order in EN and HE; mirrored in Hebrew so the action runs with the
   reading direction). <kq-tale data-story="i"> starts when it enters the page and stops when the question leaves it.
   The text never sits on the action: the puppets live in the stage band BELOW the story, the sky behind the words is
   dark and still. $0: canvas 2D, no images, no network. Test hook: window.__tale {seek, freeze, beat}. */
(function () {
  'use strict';
  if (window.KQTale) return;
  const TAU = Math.PI * 2, PI = Math.PI;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v, mix = (a, b, t) => a + (b - a) * t;
  const sm = t => (t = cl(t, 0, 1)) * t * (3 - 2 * t);
  const win = (t, a, b) => sm((t - a) / (b - a));                        // 0 → 1 across [a, b]
  const bell = (t, a, b, c, d) => win(t, a, b) * (1 - win(t, c, d));     // up across [a,b], down across [c,d]
  const sn = (t, f, p) => Math.sin((t * f + (p || 0)) * TAU);
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const SIL = '#050302', RIM = 'rgba(255,196,118,.78)', FAR = '#261a11', NEAR = '#170f09', TONE = '#2e2116', PAPER = '#8f7550';
  const bz = (a, b, c, d, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push(u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]); } return o; };
  const blend = (a, b, u) => { const o = {}; for (const k in a) o[k] = a[k]; for (const k in b) o[k] = mix(a[k] || 0, b[k], u); for (const k in a) if (!(k in b)) o[k] = mix(a[k], 0, u); return o; };

  /* ---------- the drawing kit: world units, y up, 0 = the stage floor ---------- */
  function kit() {
    let c = null;
    const g = {
      c, pass: 1, use(x) { c = x; g.c = x; }, col: SIL, t: 0, dt: 1 / 60, pts: null, emitQ: null, flash: 0,
      fill() { c.fillStyle = g.col; c.fill(); },
      pt(x, y) { if (!g.pts || !g.pass) return; const m = c.getTransform(); g.pts.push(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f); },
      P(p) { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); g.fill(); g.pt(p[0], p[1]); },
      C(x, y, r) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); g.fill(); g.pt(x, y); },
      E(x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx) || 0.01, Math.abs(ry) || 0.01, rot || 0, 0, TAU); g.fill(); g.pt(x, y); },
      R(x, y, w, h) { c.beginPath(); c.rect(x, y, w, h); g.fill(); g.pt(x + w / 2, y + h / 2); },
      RR(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); g.fill(); g.pt(x + w / 2, y + h / 2); },
      L(x1, y1, x2, y2, w1, w2) {   // a tapered limb, rounded at both joints (paper puppets are pinned there)
        const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1e-6, nx = -dy / l, ny = dx / l, a = w1 / 2, b = (w2 == null ? w1 : w2) / 2;
        c.beginPath(); c.moveTo(x1 + nx * a, y1 + ny * a); c.lineTo(x2 + nx * b, y2 + ny * b); c.lineTo(x2 - nx * b, y2 - ny * b); c.lineTo(x1 - nx * a, y1 - ny * a); c.closePath(); g.fill();
        c.beginPath(); c.arc(x1, y1, a, 0, TAU); g.fill(); c.beginPath(); c.arc(x2, y2, b, 0, TAU); g.fill(); g.pt((x1 + x2) / 2, (y1 + y2) / 2);
      },
      S(p, w0, w1, bul) {   // a ribbon along a polyline (tails, stems, hair, waves of cloth)
        const n = p.length / 2; if (n < 2) return; const A = [], B = [];
        for (let i = 0; i < n; i++) { const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1); let dx = p[i1 * 2] - p[i0 * 2], dy = p[i1 * 2 + 1] - p[i0 * 2 + 1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const u = i / (n - 1), w = Math.max(0.05, mix(w0, w1, u) + (bul || 0) * Math.sin(u * PI)) / 2; A.push(p[i * 2] - dy * w, p[i * 2 + 1] + dx * w); B.push(p[i * 2] + dy * w, p[i * 2 + 1] - dx * w); }
        c.beginPath(); c.moveTo(A[0], A[1]); for (let i = 2; i < A.length; i += 2) c.lineTo(A[i], A[i + 1]); for (let i = B.length - 2; i >= 0; i -= 2) c.lineTo(B[i], B[i + 1]); c.closePath(); g.fill(); g.pt(p[0], p[1]); g.pt(p[p.length - 2], p[p.length - 1]);
      },
      path(fn) { c.beginPath(); fn(c); g.fill(); },
      tone(col, fn) { if (!g.pass) return; const o = g.col; g.col = col; fn(); g.col = o; },   // flat back-scenery (walls, doors, paper): no rim
      glow(x, y, r, rgb, a) { if (!g.pass || !(a > 0.004)) return; const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(0.35, 'rgba(' + rgb + ',' + a * 0.45 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); },
      line(p, w, col, a) { if (!g.pass || !(a > 0.004)) return; c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke(); c.restore(); },
      emit(kind, x, y, n) { if (!g.pass || !g.emitQ || !(n > 0)) return; const m = c.getTransform(); g.emitQ.push([kind, m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f, n, Math.hypot(m.a, m.b)]); },
      rate(r) { return Math.floor(r * g.dt + Math.random()); },
      at(x, y, fn, rot, sx, sy) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (sx != null) c.scale(sx, sy == null ? sx : sy); fn(); c.restore(); },
      bolt(x, y, h, a) { if (!g.pass || a <= 0) return; const p = [x, y]; let cx = x, cy = y; for (let i = 0; i < 7; i++) { cx += (hash(i + Math.floor(g.t * 3)) - 0.5) * 10; cy -= h / 7; p.push(cx, cy); } g.line(p, 1.6, '#fff4dc', a); g.line(p, 5, '#ffd9a0', a * 0.25); g.flash = Math.max(g.flash, a); }
    };
    return g;
  }

  /* ---------- puppets ---------- */
  const dv = a => [Math.sin(a), -Math.cos(a)];
  function gait(ph, A, run) {   // a walk (or run) cycle; A = 0 is standing still
    const s = Math.sin(ph), s2 = -s, cp = Math.cos(ph);
    return { hl: A * s * 0.85, kl: A * 1.3 * Math.max(0, cp) + 0.05, hr: A * s2 * 0.85, kr: A * 1.3 * Math.max(0, -cp) + 0.05,
      sl: -A * s * (run ? 1.15 : 0.8), el: run ? 1.55 : 0.22 + A * 0.25, sr: -A * s2 * (run ? 1.15 : 0.8), er: run ? 1.55 : 0.22 + A * 0.25,
      lean: run ? 0.3 * Math.min(1, A * 1.4) : 0.04 + A * 0.07, air: run ? 2.2 * Math.abs(s) * A : 0 };
  }
  function walker(t, x0, x1, t0, t1, stride, run) {   // walk from x0 to x1 during [t0, t1]; legs follow the distance
    const u = win(t, t0, t1), x = mix(x0, x1, u), A = (run ? 0.95 : 0.55) * bell(t, t0, t0 + 0.3, t1 - 0.3, t1);
    return { x, face: x1 >= x0 ? 1 : -1, P: gait(Math.abs(x - x0) / (stride || 22) * TAU, A, run), A };
  }
  const STAND = t => ({ hl: 0.05, kl: 0.04, hr: -0.05, kr: 0.04, sl: -0.1 + 0.03 * sn(t, 0.35), el: 0.2, sr: 0.12 + 0.03 * sn(t, 0.35, 0.5), er: 0.24, lean: 0.015 * sn(t, 0.3) });
  const KNEEL = () => ({ hl: 1.45, kl: 1.5, hr: -0.3, kr: 1.85, sl: 0.5, el: 0.45, sr: 0.95, er: 0.35, lean: 0.38 });

  function human(g, x, y, face, s, look, P) {
    look = look || {}; P = P || {};
    const c = g.c, TH = 11, SH = 11, TO = look.to || 15, UA = 8.4, FA = 8, HR = look.hr || 5.2, W = look.w || 1;
    const leg = (a, k) => { const d1 = dv(a), kn = [d1[0] * TH, d1[1] * TH], d2 = dv(a - k); return [kn, [kn[0] + d2[0] * SH, kn[1] + d2[1] * SH]]; };
    const [kL, fL] = leg(P.hl || 0, P.kl || 0), [kR, fR] = leg(P.hr || 0, P.kr || 0);
    const ln = P.lean || 0, sh = [Math.sin(ln) * TO, Math.cos(ln) * TO], hc = [Math.sin(ln) * (TO + 1.8 + HR), Math.cos(ln) * (TO + 1.8 + HR)];
    const arm = (a, e) => { const d1 = dv(a + ln), el = [sh[0] + d1[0] * UA, sh[1] + d1[1] * UA], d2 = dv(a + ln + e); return [el, [el[0] + d2[0] * FA, el[1] + d2[1] * FA]]; };
    const [eL, hL] = arm(P.sl || 0, P.el || 0), [eR, hR] = arm(P.sr || 0, P.er || 0);
    const rot = P.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot), Rp = p => [p[0] * cr - p[1] * sr, p[0] * sr + p[1] * cr];
    let low = Infinity; for (const p of rot ? [kL, fL, kR, fR, sh, eL, hL, eR, hR, [hc[0], hc[1] - HR], [hc[0], hc[1] + HR], [0, -2]] : [kL, fL, kR, fR]) low = Math.min(low, Rp(p)[1]);
    const lift = 1.3 - low + (P.air || 0);
    const Wp = p => { const q = Rp(p); return [x + face * s * q[0], y + s * (q[1] + lift)]; };
    c.save(); c.translate(x, y); c.scale(face * s, s); c.translate(0, lift); if (rot) c.rotate(rot);
    const foot = f => g.E(f[0] + 1.5, f[1] - 0.3, 2.9, 1.35, 0);
    g.L(0, 0, kL[0], kL[1], 5.2 * W, 4.2 * W); g.L(kL[0], kL[1], fL[0], fL[1], 4.2 * W, 3.1 * W); foot(fL);
    g.L(sh[0], sh[1], eL[0], eL[1], 3.7 * W, 3.1 * W); g.L(eL[0], eL[1], hL[0], hL[1], 3.1 * W, 2.4 * W); g.C(hL[0], hL[1], 1.7 * W);
    g.L(0, 0, kR[0], kR[1], 5.2 * W, 4.2 * W); g.L(kR[0], kR[1], fR[0], fR[1], 4.2 * W, 3.1 * W); foot(fR);
    const wx = sh[0] * 0.42, wy = sh[1] * 0.42;
    if (look.pack) g.at(-4.6 + sh[0] * 0.55, sh[1] * 0.55, () => g.RR(-3.5, -4.5, 5, 9.5, 1.6), ln);
    g.L(0, 1, sh[0], sh[1] - 0.5, 8.6 * W, 10 * W);
    if (look.dress) { const d = look.dress === 'long' ? -7 : 0; g.P([wx - 4.2, wy, wx + 4.2, wy, 9.8, -7.5 + d, -9.8, -7.5 + d]); }
    if (look.coat) g.P([sh[0] - 5.2, sh[1] - 1, sh[0] + 5.2, sh[1] - 1, 8, -10, -8, -10]);
    if (look.belly) g.E(wx + 2.8, wy + 1.8, 6.8, 7.4);
    g.L(sh[0], sh[1], hc[0], hc[1] - HR * 0.6, 3.3, 2.9);
    c.save(); c.translate(hc[0], hc[1]); c.rotate(P.head || 0);
    const sway = look.sway || 0;
    if (look.hair === 'pony') { g.E(-0.6, 1.1, HR * 1.05, HR * 0.9); g.S(bz([-HR * 0.8, HR * 0.6], [-HR * 2.1, HR * 0.9 + sway], [-HR * 2.6, -HR * 0.2 + sway], [-HR * 2.1, -HR * 1.6 + sway * 1.4], 8), 3.8, 0.8, 1.4); }
    if (look.hair === 'bob') { g.E(-1.1, 0.3, HR * 1.14, HR * 1.1); g.E(HR * 0.3, HR * 0.62, HR * 0.62, HR * 0.42); }
    if (look.hair === 'braids') { g.E(-0.6, 1.1, HR * 1.05, HR * 0.9); for (const o of [0, 1.6]) g.S(bz([-HR * 0.7 + o * 0.3, -HR * 0.1], [-HR * 1.2 + o, -HR * 1.2 + sway], [-HR * 1.3 + o, -HR * 2.2 + sway], [-HR * 1.1 + o, -HR * 3.1 + sway * 1.3], 7), 2.4, 1.2); }
    if (look.hair === 'bun') { g.E(-0.6, 1.1, HR * 1.04, HR * 0.9); g.C(-HR * 0.75, HR * 0.95, HR * 0.55); }
    if (look.hair === 'short') { g.E(-0.7, 1.4, HR * 1.03, HR * 0.8); g.P([-HR * 0.9, HR * 0.9, -HR * 1.4, HR * 1.25, -HR * 0.5, HR * 1.05]); g.P([HR * 0.1, HR * 1.0, HR * 0.5, HR * 1.35, HR * 0.6, HR * 0.8]); }
    if (look.hair === 'curly') { for (let i = 0; i < 7; i++) { const a = PI * 0.12 + i * PI * 0.16; g.C(Math.cos(a) * HR * 0.95 - 0.8, Math.sin(a) * HR * 0.95 + 0.4, HR * 0.42); } }
    g.C(0, 0, HR); g.P([HR * 0.7, 1.3, HR + 2.3, -0.4, HR * 0.72, -1.5]);   // head + a paper-cut nose
    if (look.beard) g.P([HR * 0.6, -HR * 0.3, HR * 0.95, -HR * 0.95, HR * 0.1, -HR * 2.2, -HR * 0.55, -HR * 0.75]);
    if (look.hat === 'chef') { g.R(-HR * 0.95, HR * 0.55, HR * 1.9, HR * 1.1); g.C(-HR * 0.6, HR * 1.9, HR * 0.62); g.C(0.1, HR * 2.15, HR * 0.75); g.C(HR * 0.66, HR * 1.9, HR * 0.62); }
    if (look.hat === 'cap') { g.E(-0.2, HR * 0.55, HR * 1.06, HR * 0.62); g.P([HR * 0.5, HR * 0.64, HR * 2.3, HR * 0.4, HR * 0.5, HR * 0.16]); }
    if (look.hat === 'hat') { g.E(0, HR * 0.62, HR * 2.0, HR * 0.28); g.RR(-HR * 0.85, HR * 0.62, HR * 1.7, HR * 1.25, 1.2); }
    if (look.hat === 'knit') { g.E(-0.2, HR * 0.55, HR * 1.07, HR * 0.95); g.C(-HR * 0.35, HR * 1.6, 1.7); }
    if (look.bow) { g.at(-HR * 0.55, HR * 1.05, () => { g.P([0, 0, -2.8, 1.8, -2.8, -1.8]); g.P([0, 0, 2.8, 1.8, 2.8, -1.8]); g.C(0, 0, 0.9); }, 0.5); }
    c.restore();
    g.L(sh[0], sh[1], eR[0], eR[1], 3.7 * W, 3.1 * W); g.L(eR[0], eR[1], hR[0], hR[1], 3.1 * W, 2.4 * W); g.C(hR[0], hR[1], 1.7 * W);
    c.restore();
    return { hL: Wp(hL), hR: Wp(hR), head: Wp(hc), fL: Wp(fL), fR: Wp(fR), sh: Wp(sh), hip: Wp([0, 0]) };
  }

  function fox(g, x, y, face, s, P) {   // P: mode 'sit' | 'walk', ph, tail, ear, head, bow
    P = P || {}; const tw = P.tail || 0, ear = P.ear || 0;
    g.at(x, y, () => {
      if (P.mode === 'walk') {
        const ph = P.ph || 0, A = P.A == null ? 0.45 : P.A;
        for (const [hx, off] of [[7, 0], [5, PI], [-6.5, PI * 0.5], [-8.5, PI * 1.5]]) { const a = A * Math.sin(ph + off), k = A * 0.8 * Math.max(0, Math.cos(ph + off)); const kx = hx + Math.sin(a) * 5.2, ky = 9 - Math.cos(a) * 5.2; g.L(hx, 10, kx, ky, 3, 2.3); g.L(kx, ky, kx + Math.sin(a - k) * 4.6, ky - Math.cos(a - k) * 4.6, 2.3, 1.7); }
        g.E(0, 11.5, 11.5, 4.8, 0.03);
        g.at(10, 13.5, () => { g.L(-1.5, -1, 3, 3.2, 5.4, 4.2); g.E(4.4, 4, 3.9, 3.3, -0.1); g.P([6.4, 5.1, 12, 3.2, 6.4, 1.9]); g.P([2.2, 6.4, 2.8, 12 + ear, 4.8, 7]); g.P([4.4, 6.8, 5.8, 11.8 + ear, 6.6, 6.4]); g.glow(5.6, 5, 1.3, '255,190,110', 0.9); }, (P.head || 0));
        g.S(bz([-10.5, 12.5], [-17, 14 + tw * 3], [-23, 19 + tw * 4], [-27, 15.5 + tw * 2], 10), 3, 1, 4.6);
      } else {
        g.E(-3, 6.8, 8.2, 6.9, 0);
        g.path(c => { c.moveTo(-8, 4); c.bezierCurveTo(-8.5, 14, -2, 21, 4.2, 23.4); c.lineTo(8.4, 20.5); c.bezierCurveTo(9.2, 13, 7.4, 6, 6.4, 0.2); c.lineTo(-3, 0.2); c.closePath(); });
        g.L(5.8, 10, 6.8, 0.8, 2.9, 2.2); g.L(3.1, 10, 3.5, 0.8, 2.9, 2.2); g.E(7.8, 0.9, 1.9, 1.05); g.E(4.5, 0.9, 1.9, 1.05);
        g.at(5.4, 25, () => { g.E(0, 0, 4.3, 3.7); g.P([2.3, 1.2, 8.4, -1.1, 2.1, -2.3]); g.P([-2.5, 2, -2.1, 8.2 + ear, 0.3, 2.9]); g.P([0.6, 2.9, 2.3, 8.6 + ear, 3.1, 2.2]); g.glow(1.7, 0.7, 1.3, '255,190,110', 0.95); }, P.head || 0);
        g.S(bz([-8.5, 3], [-19.5, 0.5], [-23.5, 12 + tw * 4], [-14.5, 17 + tw * 2.5], 12), 2, 0.8, 7.4);
      }
    }, 0, face * s, s);
  }

  function robot(g, x, y, face, s, P) {   // Bolt: treads, a boxy body, one ember eye. P: arm, elbow, arm2, tilt, bounce, blink
    P = P || {}; let hand = [0, 0];
    g.at(x, y + (P.bounce || 0), () => {
      g.P([-8.4, 1.1, 8.4, 1.1, 10, 3.6, 8.4, 6.2, -8.4, 6.2, -10, 3.6]);
      g.RR(-6.6, 6.8, 13.2, 13.4, 2.4); g.R(-1.2, 20, 2.4, 2.4);
      g.at(0, 22.2, () => { g.RR(-5.4, 0, 10.8, 7.8, 2.2); g.L(1.6, 7.6, 3.2, 12.4, 0.9, 0.7); g.C(3.2, 12.8, 1.25); g.glow(3.2, 12.8, 2.6, '255,170,90', 0.5 + 0.3 * sn(g.t, 1.3)); const bl = P.blink ? 0.15 : 1; g.tone('#ffcf8a', () => g.E(3.4, 4.2, 1.15, 1.15 * bl)); g.glow(3.4, 4.2, 2.6, '255,190,110', 0.8); }, P.tilt || 0);
      const a2 = P.arm2 == null ? 0.2 : P.arm2; g.L(-4.6, 17.5, -4.6 + Math.sin(a2) * 7, 17.5 - Math.cos(a2) * 7, 2.1, 1.8);
      const a = P.arm == null ? 0.3 : P.arm, e = P.elbow == null ? 0.4 : P.elbow, ex = 4.6 + Math.sin(a) * 6.5, ey = 17.5 - Math.cos(a) * 6.5, hx = ex + Math.sin(a + e) * 6, hy = ey - Math.cos(a + e) * 6;
      g.L(4.6, 17.5, ex, ey, 2.2, 1.9); g.L(ex, ey, hx, hy, 1.9, 1.6); g.P([hx - 1.4, hy + 0.8, hx + 1.8, hy + 1.2, hx + 1.2, hy - 1.6]);
      const m = g.c.getTransform(); hand = [hx, hy, m];
    }, 0, face * s, s);
    return [x + face * s * hand[0], y + (P.bounce || 0) + s * hand[1]];
  }

  function penguin(g, x, y, face, s, P) {   // P: mode 'stand' | 'swim' | 'slide', flap, rock, hop, ang
    P = P || {}; const fl = P.flap || 0;
    g.at(x, y + (P.hop || 0), () => {
      const body = () => {
        g.E(0, 10.5, 6.3, 10.6, 0); g.C(1.3, 20.6, 4.7); g.P([4.8, 21.4, 9.6, 20.2, 4.8, 19.3]);
        g.S([0.6, 17, 0.6 + Math.sin(0.5 + fl) * 4, 17 - Math.cos(0.5 + fl) * 4, 0.6 + Math.sin(0.6 + fl * 1.1) * 9.5, 17 - Math.cos(0.6 + fl * 1.1) * 9.5], 3.2, 0.6);
        g.E(2.6, 0.5, 2.6, 0.95); g.E(-1.8, 0.5, 2.3, 0.95); g.P([-5.2, 3, -9, 1.2, -5.8, 0.8]);
        g.glow(2.6, 21.6, 1.1, '255,220,170', 0.55);
      };
      if (P.mode === 'swim') g.at(0, 8, () => g.at(0, -10, body), -PI / 2 + (P.ang || 0));
      else if (P.mode === 'slide') g.at(0, 6.3, () => g.at(0, -10.5, body), -PI / 2 + 0.2 + (P.ang || 0));
      else g.at(0, 0, body, P.rock || 0);
    }, 0, face * s, s);
  }

  /* ---------- props ---------- */
  function spire(g, x, h, w, i) {   // a spindly paper tree: trunk + jagged branches
    g.P([x - 1.6, 0, x + 1.6, 0, x + 0.5, h, x - 0.5, h]);
    for (let j = 0; j < 6; j++) { const yy = h * (0.3 + j * 0.115), side = (j + i) % 2 ? 1 : -1, len = w * (1 - j * 0.13) * (0.8 + hash(i * 7 + j) * 0.5); g.P([x, yy, x + side * len, yy + 5 + hash(j + i) * 4, x, yy + 3.2]); }
  }
  function roundTree(g, x, h, t, k) {
    g.L(x, 0, x + 1, h * 0.55, 5.5 * k, 3.4 * k); g.L(x + 1, h * 0.42, x - 7 * k, h * 0.64, 2 * k, 1.2 * k); g.L(x + 1, h * 0.48, x + 8 * k, h * 0.7, 2 * k, 1.2 * k);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = 10 * k * (0.8 + hash(i + x) * 0.35); g.C(x + 1 + Math.cos(a) * 9 * k + sn(t, 0.2, i * 0.1) * 0.8, h * 0.74 + Math.sin(a) * 7 * k, r); }
  }
  function flower(g, x, h, bloom, droop, t, i) {
    const sw = sn(t, 0.25, (i || 0) * 0.13) * 1.4, top = [x + sw + droop * 3, h - droop * 3];
    g.S(bz([x, 0], [x, h * 0.4], [x + sw * 0.6, h * 0.8], top, 6), 1.5, 0.9);
    g.E(x + 1.8, h * 0.35, 2.6, 1, 0.5); g.E(x - 1.6, h * 0.55, 2.4, 0.9, -0.5);
    g.at(top[0], top[1], () => { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; g.E(Math.cos(a) * 2.7 * bloom, Math.sin(a) * 2.7 * bloom, 2.3 * bloom, 1.25 * bloom, a); } g.C(0, 0, 1.7 * bloom); }, -droop * 1.2);
  }
  function grass(g, x0, x1, t, h) {
    g.R(x0, -12, x1 - x0, 12.5);
    g.tone(SIL, () => { for (let x = x0; x < x1; x += 3.4 + hash(x) * 2.6) { const hh = (h || 3.4) * (0.35 + hash(x) * 1.1), lean = sn(t, 0.3, x * 0.01) * 0.8 + (hash(x + 3) - 0.5) * 2; g.P([x - 1.1, 0, x + 1.1, 0, x + lean, hh]); } });
  }
  function floor(g, x0, x1) { g.R(x0, -12, x1 - x0, 12.4); g.R(x0, 0, x1 - x0, 0.9); }
  function keyShape(g, x, y, s, rot) {   // the heavy old key with a tiny crown on top of the bow (+x = shaft)
    g.at(x, y, () => {
      g.path(c => { c.arc(0, 0, 7, 0, TAU); c.moveTo(4.1, 0); c.arc(0, 0, 4.1, 0, TAU, true); });
      g.P([-6.4, -3.4, -6.4, 3.4, -11.2, 5, -9.3, 1.8, -12.6, 0, -9.3, -1.8, -11.2, -5]); g.C(-11.5, 5.1, 0.95); g.C(-13, 0, 0.95); g.C(-11.5, -5.1, 0.95);
      g.R(6.4, -2, 3.2, 4); g.R(9, -1.3, 26, 2.6); g.P([14, 1.2, 15.2, 2.1, 16.4, 1.2]); g.P([21, -1.2, 22.4, -2.2, 23.6, -1.2]);
      g.P([27.5, -1.2, 35, -1.2, 35, -8.4, 32.6, -8.4, 32.6, -5.4, 30.6, -5.4, 30.6, -7.2, 28.2, -7.2, 28.2, -1.2]);
    }, rot, s);
  }
  function doorway(g, x, w, h, shake, leak, t) {   // a back-wall door: flat tone leaf, light leaking round it, a keyhole
    g.tone(TONE, () => g.at(x + (shake || 0), 0, () => g.path(c => { c.moveTo(-w / 2, 0); c.lineTo(-w / 2, h - w / 2); c.arc(0, h - w / 2, w / 2, PI, 0, true); c.lineTo(w / 2, 0); c.closePath(); })));
    g.tone('#140d08', () => { g.at(x + (shake || 0), 0, () => { g.C(w * 0.28, h * 0.45, 1.3); g.P([w * 0.28 - 0.8, h * 0.45, w * 0.28 + 0.8, h * 0.45, w * 0.28 + 1.1, h * 0.45 - 3, w * 0.28 - 1.1, h * 0.45 - 3]); }); });
    if (leak > 0) { const e = []; for (let i = 0; i <= 12; i++) { const a = PI - i / 12 * PI; e.push(x + Math.cos(a) * (w / 2 + 0.6), h - w / 2 + Math.sin(a) * (w / 2 + 0.6)); } g.line([x - w / 2 - 0.6, 0].concat(e, [x + w / 2 + 0.6, 0]), 0.9, '#ffc07a', leak); }
    g.R(x - w / 2 - 3.4, 0, 2.6, h - w / 2); g.R(x + w / 2 + 0.8, 0, 2.6, h - w / 2); g.S(bz([x - w / 2 - 2.1, h - w / 2], [x - w / 2 - 2.1, h + 3], [x + w / 2 + 2.1, h + 3], [x + w / 2 + 2.1, h - w / 2], 10), 2.6, 2.6);
  }
  function bookshelf(g, x, w, h, t) {
    g.R(x, 0, 3, h); g.R(x + w - 3, 0, 3, h); g.R(x - 1.5, h - 3.2, w + 3, 3.2); g.R(x, 0, w, 2.6); g.P([x + w * 0.3, h, x + w * 0.7, h, x + w * 0.5, h + 5]);
    for (let j = 0; j < 4; j++) { const y0 = 2.6 + j * (h - 6) / 4; g.R(x, y0, w, 1.7); let bx = x + 3.6; let n = 0; while (bx < x + w - 5) { const bw = 2.2 + hash(j * 31 + n) * 2.4, bh = (h - 6) / 4 - 3.5 - hash(n * 3 + j) * 4.5; if (hash(j * 7 + n * 13) > 0.86 && bx < x + w - 10) { g.at(bx, y0 + 1.7, () => g.R(0, 0, bw, bh), -0.35); bx += bh * 0.4 + bw; } else { g.R(bx, y0 + 1.7, bw, bh); bx += bw + 0.55; } n++; } }
  }
  function bucket(g, x, y, s, tilt) { g.at(x, y, () => { g.P([-4.4, 0, 4.4, 0, 5.4, 8, -5.4, 8]); g.R(-5.8, 7.4, 11.6, 1.5); g.path(c => { c.arc(0, 8.6, 5.4, 0, PI); c.arc(0, 8.6, 4.6, PI, 0, true); }); }, tilt || 0, s || 1); }
  function house(g, x, w, h, roof, lit, t, i) {
    g.R(x - w / 2, 0, w, h); g.P([x - w / 2 - 3, h, x + w / 2 + 3, h, x + (roof || 0), h + w * 0.45]); g.R(x + w * 0.2, h + 2, 4, w * 0.3 + 2);
    if (lit) g.tone('rgba(255,184,100,' + (0.55 * lit) + ')', () => { g.R(x - w * 0.3, h * 0.45, w * 0.18, h * 0.26); g.R(x + w * 0.12, h * 0.45, w * 0.18, h * 0.26); });
    if (lit) g.glow(x, h * 0.58, w * 0.8, '255,176,90', 0.18 * lit);
  }
  function waves(g, t, base, amp, spd, col, x0, x1, ph) {
    const o = g.col; if (col) g.col = col; g.path(c => { c.moveTo(x0, -14); for (let x = x0; x <= x1; x += 4) c.lineTo(x, base + amp * Math.sin(x * 0.07 + t * spd + (ph || 0)) + amp * 0.45 * Math.sin(x * 0.19 - t * spd * 1.3)); c.lineTo(x1, -14); c.closePath(); }); g.col = o;
  }
  function boat(g, x, y, s, rock, sail, lamp) {
    g.at(x, y, () => { g.path(c => { c.moveTo(-15, 6); c.quadraticCurveTo(-12, -1, 0, -1.2); c.quadraticCurveTo(12, -1, 16, 7); c.lineTo(-15, 6); c.closePath(); }); g.R(-5, 5, 9, 4.5); g.L(2, 5, 2, 30, 1.1, 0.8);
      if (sail === 1) g.P([2.6, 9, 2.6, 29, 14, 9]); else if (sail === 2) g.S([2, 12, 2.4, 20, 2, 27], 2.2, 1.2);
      if (lamp) { g.glow(4.5, 10.5, 9, '255,196,120', lamp); g.tone('#ffd9a0', () => g.C(4.5, 10.5, 0.9 * lamp)); } }, rock || 0, s);
  }
  function lighthouse(g, x, y0, s, lamp, t, cut, plain) {
    g.at(x, y0, () => {
      if (cut) {   // the cut-away: thick walls, the staircase inside on a lit wall
        g.tone('#4a3422', () => g.P([-17, 0, 17, 0, 11, 74, -11, 74])); g.glow(0, 62, 64, '255,184,100', 0.2 + 0.45 * lamp);
        g.P([-22, 0, -17, 0, -11, 74, -15, 74]); g.P([17, 0, 22, 0, 15, 74, 11, 74]);
        for (let i = 0; i < 6; i++) { const y0 = 4 + i * 11.5, d = i % 2 ? -1 : 1, x0 = -(16.4 - y0 * 0.081) * d, x1 = (16.4 - (y0 + 11.5) * 0.081) * d, pts = []; for (let k = 0; k <= 7; k++) pts.push(mix(x0, x1, k / 7), y0 + 11.5 * k / 7); g.S(pts, 1.8, 1.8); for (let k = 0; k < 7; k++) { const u = (k + 0.5) / 7, x = mix(x0, x1, u), y = y0 + 11.5 * u; g.P([x - 1.1 * d, y, x + 0.9 * d, y, x + 0.9 * d, y + 1.7]); } }
        g.R(-13, 74, 26, 2.4);
      } else {
        g.P([-11, 0, 11, 0, 7, 64, -7, 64]); if (!plain) g.tone('rgba(255,184,100,.35)', () => { g.R(-1.2, 22, 2.4, 4); g.R(-1, 42, 2, 4); });
        g.R(-10, 64, 20, 2.2);
      }
      const top = cut ? 76 : 66;
      g.R(cut ? -12 : -9, top, 2, 6); g.R(cut ? 10 : 7, top, 2, 6);
      g.tone(lamp > 0.05 ? 'rgba(255,214,150,' + (0.35 + 0.65 * lamp) + ')' : '#1d140c', () => g.R(-5, top, 10, 8));
      g.P([-7.5, top + 8, 7.5, top + 8, 0, top + 15]); g.C(0, top + 15.6, 1.2);
      if (lamp > 0) { g.glow(0, top + 4, 26 * lamp + 6, '255,208,140', 0.9 * lamp); const ph = t * 0.55 * TAU, R = Math.max(0, Math.cos(ph)), Lf = Math.max(0, -Math.cos(ph)); for (const [dir, len] of [[1, R], [-1, Lf]]) if (len > 0.02) { const c = g.c, L = 170 * len; c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createLinearGradient(0, top + 4, dir * L, top + 4); gr.addColorStop(0, 'rgba(255,214,150,' + 0.38 * lamp + ')'); gr.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(0, top + 5.5); c.lineTo(dir * L, top + 16); c.lineTo(dir * L, top - 8); c.lineTo(0, top + 2.5); c.closePath(); c.fill(); c.restore(); } }
    }, 0, s);
  }
  function gear(g, x, y, r, n, rot, col) {
    const o = g.col; if (col) g.col = col;
    g.at(x, y, () => g.path(c => { for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = a0 + TAU / n * 0.25, a2 = a0 + TAU / n * 0.5, a3 = a0 + TAU / n * 0.75; const pt = (a, rr) => [Math.cos(a) * rr, Math.sin(a) * rr]; const P = [pt(a0, r), pt(a1, r + 2.6), pt(a2, r + 2.6), pt(a3, r)]; if (i === 0) c.moveTo(P[0][0], P[0][1]); for (const p of P) c.lineTo(p[0], p[1]); } c.closePath(); c.moveTo(r * 0.3, 0); c.arc(0, 0, r * 0.3, 0, TAU, true); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; c.moveTo(Math.cos(a) * r * 0.62 + r * 0.14, Math.sin(a) * r * 0.62); c.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.14, 0, TAU, true); } }), rot);
    g.col = o;
  }
  function grandClock(g, x, t, st) {   // st: hour, minute (radians from 12, clockwise), pend (swing), glass
    g.R(x - 14.5, 0, 29, 3); g.R(x - 13, 0, 26, 12); g.R(x - 10, 12, 20, 46); g.R(x - 13, 58, 26, 30);
    g.P([x - 13, 88, x + 13, 88, x + 8.5, 93, x, 97, x - 8.5, 93]); g.C(x - 12, 89.5, 1.5); g.C(x + 12, 89.5, 1.5);
    g.tone('#2c1f13', () => g.R(x - 5.5, 18, 11, 32)); g.glow(x, 34, 16, '255,176,90', 0.12 + 0.1 * (st.glass || 0));
    const p = st.pend || 0; g.tone(SIL, () => { g.L(x, 48, x + Math.sin(p) * 24, 48 - Math.cos(p) * 24, 0.9, 0.9); g.C(x + Math.sin(p) * 25.5, 48 - Math.cos(p) * 25.5, 3.3); });
    g.tone('#e2d2b0', () => g.C(x, 73, 9.6)); g.glow(x, 73, 16, '255,220,170', 0.28 + 0.2 * (st.glass || 0));
    g.tone(SIL, () => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.L(x + Math.sin(a) * 7.6, 73 + Math.cos(a) * 7.6, x + Math.sin(a) * 8.8, 73 + Math.cos(a) * 8.8, i % 3 ? 0.5 : 1, i % 3 ? 0.5 : 1); } g.L(x, 73, x + Math.sin(st.hour) * 5.2, 73 + Math.cos(st.hour) * 5.2, 1.3, 0.9); g.L(x, 73, x + Math.sin(st.minute) * 7.4, 73 + Math.cos(st.minute) * 7.4, 0.9, 0.6); g.C(x, 73, 1); });
  }
  function bird(g, x, y, s, t, i) { const f = sn(t, 2.4, i || 0); g.at(x, y, () => { g.S([-6, 1.5 + f * 2.2, -3, 0.4 + f, 0, 0], 0.4, 1.4); g.S([0, 0, 3, 0.4 + f, 6, 1.5 + f * 2.2], 1.4, 0.4); }, 0, s); }
  function sparkle(g, x, y, r, a) { if (a <= 0) return; g.glow(x, y, r * 2.6, '255,214,150', 0.6 * a); g.tone('rgba(255,236,200,' + a + ')', () => { g.P([x - r, y, x, y + r * 0.22, x + r, y, x, y - r * 0.22]); g.P([x, y - r, x + r * 0.22, y, x, y + r, x - r * 0.22, y]); }); }

  /* ---------- scenery behind the stage (flat, parallax, no rim) ---------- */
  const BG = {
    garden(g, t) { g.col = FAR; for (let i = 0; i < 15; i++) { const r = 9 + hash(i + 3) * 17; g.C(-270 + i * 38 + hash(i) * 22, r * 0.3, r); } roundTree(g, 124, 84, t, 1.3); roundTree(g, -178, 70, t, 1.05); g.R(-64, 0, 104, 16); for (let i = 0; i < 10; i++) g.C(-60 + i * 10.7, 16, 2.6); g.col = '#1b120b'; g.path(c => { c.moveTo(-18, 0); c.lineTo(-18, 9); c.arc(-9, 9, 9, PI, 0, true); c.lineTo(0, 0); c.closePath(); }); g.col = NEAR; g.R(-270, -10, 540, 12); },
    forest(g, t) { g.col = FAR; for (let i = 0; i < 18; i++) spire(g, -270 + i * 32 + hash(i) * 18, 60 + hash(i + 9) * 40, 8 + hash(i + 3) * 6, i); g.col = NEAR; for (let i = 0; i < 9; i++) spire(g, -250 + i * 62 + hash(i + 40) * 20, 44 + hash(i + 19) * 30, 9, i + 5); },
    street(g, t, lit) { g.col = FAR; for (let i = 0; i < 12; i++) { const w = 30 + hash(i) * 16, h = 34 + hash(i + 4) * 28, x = -270 + i * 46; g.R(x, 0, w, h); g.P([x - 2, h, x + w + 2, h, x + w * (0.3 + hash(i + 8) * 0.4), h + 12 + hash(i) * 8]); g.R(x + w * 0.7, h + 2, 4, 12); if (lit) { g.col = 'rgba(255,176,90,' + (0.18 + 0.2 * hash(i + 2)) * lit + ')'; g.R(x + w * 0.25, h * 0.55, 4, 5); g.col = FAR; } } },
    room(g, t) { g.col = 'rgba(38,26,17,.8)'; g.R(-270, 0, 540, 104); g.col = '#1c130c'; for (let i = 0; i < 12; i++) g.R(-270 + i * 46, 0, 1.2, 104); g.R(-270, 30, 540, 1.4); g.col = '#3a2817'; g.path(c => { c.rect(92, 44, 34, 38); }); g.col = '#1c130c'; g.R(107.4, 44, 1.4, 38); g.R(92, 62, 34, 1.4); g.col = 'rgba(255,190,110,.08)'; g.P([92, 44, 126, 44, 150, 0, 118, 0]); g.col = '#1c130c'; g.R(-120, 50, 26, 20); g.col = '#2a1c11'; g.R(-117, 53, 20, 14); },
    sea(g, t, storm) { g.col = FAR; waves(g, t, 12, storm ? 3.5 : 1.2, storm ? 1.6 : 0.5, FAR, -300, 300, 1); if (storm) { g.col = 'rgba(14,10,8,.5)'; g.path(c => { for (let i = 0; i < 7; i++) { const cx = -270 + i * 86 + sn(t, 0.04, i) * 20; for (let k = 0; k < 5; k++) { const x = cx + (k - 2) * 15, y = 94 + hash(i * 5 + k) * 9 - Math.abs(k - 2) * 3, r = 11 + hash(i + k * 3) * 8; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } } }); } },
    ice(g, t) { g.col = FAR; for (let i = 0; i < 7; i++) { const x = -270 + i * 86 + hash(i) * 30, h = 24 + hash(i + 3) * 46, w = 46 + hash(i + 5) * 44, p = [x - w / 2, 0]; for (let k = 1; k < 7; k++) { const u = k / 7; p.push(x - w / 2 + w * u + (hash(i * 9 + k) - 0.5) * 7, h * Math.pow(Math.sin(u * PI), 0.55) * (0.7 + hash(i * 13 + k) * 0.4)); } p.push(x + w / 2, 0); g.P(p); } g.col = NEAR; for (let i = 0; i < 9; i++) g.E(-250 + i * 60 + hash(i + 20) * 20, 0, 26 + hash(i) * 14, 5 + hash(i + 2) * 4); },
    school(g, t) { g.col = FAR; g.R(-160, 0, 120, 38); g.P([-166, 38, -34, 38, -100, 52]); g.R(-112, 38, 22, 34); g.P([-116, 72, -86, 72, -101, 84]); g.L(-101, 84, -101, 96, 0.8); g.S([-101, 96, -94, 95 + sn(t, 0.6) * 1.2, -88, 96 + sn(t, 0.6, 0.3) * 1.5], 4, 3); g.col = 'rgba(255,176,90,.16)'; for (let i = 0; i < 6; i++) g.R(-150 + i * 18, 18, 7, 9); g.col = FAR; for (let i = 0; i < 5; i++) spire(g, 40 + i * 40 + hash(i) * 12, 50 + hash(i + 2) * 20, 8, i); g.R(-300, 0, 600, 1.5); for (let i = 0; i < 40; i++) g.R(-300 + i * 15, 0, 1, 7); g.R(-300, 5, 600, 0.8); },
    deep(g, t) { const c = g.c; c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const x = -200 + i * 80 + sn(t, 0.05, i) * 10; const gr = c.createLinearGradient(x, 104, x - 30, 0); gr.addColorStop(0, 'rgba(170,220,210,.1)'); gr.addColorStop(1, 'rgba(170,220,210,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(x - 6, 104); c.lineTo(x + 8, 104); c.lineTo(x - 20, 0); c.lineTo(x - 44, 0); c.closePath(); c.fill(); } c.restore(); g.col = FAR; for (let i = 0; i < 14; i++) { const x = -260 + i * 40 + hash(i) * 14; g.S(bz([x, 0], [x + 4, 12], [x - 4 + sn(t, 0.2, i * 0.1) * 4, 22], [x + sn(t, 0.2, i * 0.1) * 6, 30 + hash(i) * 20], 8), 3, 0.6); } },
    night(g, t) { g.col = 'rgba(236,222,196,.85)'; g.C(118, 88, 8.5); g.col = '#150e09'; g.C(122.5, 90.5, 7.6); for (let i = 0; i < 22; i++) { g.col = 'rgba(255,236,200,' + (0.25 + 0.3 * (0.5 + 0.5 * sn(t, 0.3 + hash(i) * 0.4, i))) + ')'; g.C(-260 + hash(i) * 520, 60 + hash(i + 7) * 44, 0.55 + hash(i + 9) * 0.5); } }
  };

  /* ---------- the eight stories, four beats each (d = seconds). fg(g, t) draws the puppets; t < 0 while a beat forms ---------- */
  const WARM = { c: [228, 160, 84], p: 1, x: 0, y: 6 };
  const STORIES = [
    { // 0 — Mira and the key with the crown
      beats: [
        { d: 6.6, bg: 'garden', sky: WARM, cam: [-4, 6, 1.4, 1.5], fg(g, t) {
          grass(g, -260, 260, t); roundTree(g, -128, 74, t, 1.05);
          [[-72, 15], [-56, 22], [-40, 13], [46, 18], [64, 24], [84, 16], [104, 21]].forEach(([x, h], i) => flower(g, x, h, 1, 0, t, i));
          const lift = win(t, 2.1, 3.1), up = win(t, 3.2, 4.3), dig = 0.95 + 0.45 * sn(t, 1.7) * (1 - lift);
          const P = blend(Object.assign(KNEEL(), { sr: mix(dig, 2.55, lift), er: mix(0.45, 0.15, lift), head: 0.25 * lift }), Object.assign(STAND(t), { sr: 2.7, er: 0.12, head: 0.38, sl: -0.2 }), up);
          const m = human(g, 0, 0, 1, 0.92, { hair: 'pony', dress: true, sway: sn(t, 0.6) * 0.6 }, P);
          if (t < 2.1 && sn(t, 1.7) < -0.6) g.emit('dirt', 14, 1.5, g.rate(26));
          const k = win(t, 2.0, 2.5); if (k > 0) { keyShape(g, m.hR[0], m.hR[1] + 12 * 0.42 * k, 0.42 * k, -PI / 2 + 0.15); sparkle(g, m.hR[0] + 1, m.hR[1] + 16, 3.4, bell(t, 3.0, 3.4, 5.2, 6.4) * (0.7 + 0.3 * sn(t, 1.4))); }
        } },
        { d: 6.2, bg: 'garden', sky: { c: [236, 176, 96], p: 1.15, x: 30, y: 30 }, cam: [-8, -2, 1.08, 1.14], fg(g, t) {
          g.at(-126, -96, () => { human(g, 0, 0, 1, 3.3, { hair: 'pony', dress: true, sway: sn(t, 0.4) * 0.3 }, Object.assign(STAND(t), { sl: 0.1, sr: 0.25, head: 0.18 + 0.04 * sn(t, 0.3) })); });
          const r = -PI / 2 + 0.22 + 0.07 * sn(t, 0.18), kx = 34, ky = 58 + 2.5 * sn(t, 0.22);
          keyShape(g, kx, ky, 1.85, r);
          const u = (t * 0.28) % 1, gx = kx + Math.cos(r) * mix(-6, 60, u) * 1.85, gy = ky + Math.sin(r) * mix(-6, 60, u) * 1.85; g.glow(gx, gy, 14, '255,220,160', 0.55 * Math.sin(u * PI));
          sparkle(g, kx + Math.cos(r - 0.5) * -24, ky + 22, 4.4, 0.5 + 0.5 * sn(t, 0.7)); sparkle(g, kx + 22, ky - 30, 3, 0.4 + 0.4 * sn(t, 0.9, 0.4));
          g.emit('spark', kx + (Math.random() - 0.5) * 30, ky + (Math.random() - 0.5) * 60, g.rate(5));
        } },
        { d: 7.2, bg: 'room', sky: { c: [222, 150, 80], p: 0.9, x: -40, y: 20 }, cam: [-34, -14, 1.18, 1.22], fg(g, t) {
          floor(g, -270, 270);
          const D = [-104, -24, 56]; D.forEach((dx, i) => { const tr = bell(t, 1.05 + i * 2, 1.2 + i * 2, 1.65 + i * 2, 1.8 + i * 2); doorway(g, dx, 26, 64, tr * 1.1 * sn(t, 9), 0.25 + 0.15 * sn(t, 0.5, i), t); });
          let x = -170, face = 1, P = STAND(t);
          const legs = [[-170, -113, 0, 1.0], [-113, -33, 1.8, 3.0], [-33, 47, 3.8, 5.0]];
          for (const [a, b, t0, t1] of legs) { if (t >= t0) { const w = walker(t, a, b, t0, t1); x = w.x; P = w.P; } }
          const trying = [1.0, 3.0, 5.0].some(t0 => t > t0 && t < t0 + 0.8);
          if (trying) P = Object.assign(STAND(t), { sr: 1.35 - 0.1 * sn(t, 6), er: 0.2, lean: 0.06, head: -0.05 });
          if (t > 5.8) P = Object.assign(STAND(t), { head: -0.32 * win(t, 5.8, 6.3), sl: -0.05, sr: 0.05, lean: -0.02 });
          const m = human(g, x, 0, face, 0.92, { hair: 'pony', dress: true, sway: sn(t, 0.7) * 0.5 }, P);
          if (trying) keyShape(g, m.hR[0] + 2, m.hR[1], 0.34, 0.1);
        } },
        { d: 7.4, bg: 'room', sky: { c: [236, 170, 90], p: 1.05, x: 70, y: 14 }, cam: [30, 48, 1.2, 1.3], fg(g, t) {
          floor(g, -270, 270);
          const open = win(t, 3.4, 5.6); doorway(g, 70, 16, 34, 0, 0.35 + 0.65 * open, t);
          g.glow(70 + 4.5, 15, 10 + 30 * open, '255,208,140', 0.25 + 0.6 * open);
          if (open > 0) g.tone('rgba(255,210,150,' + 0.5 * open + ')', () => g.P([62, 0, 78, 0, 150, -12, 40, -12]));
          const slide = win(t, 0.6, 2.6); bookshelf(g, 52 + slide * 44, 40, 78, t);
          const w = walker(t, -170, 50, 1.4, 4.6); let P = w.P; if (t > 4.6) P = Object.assign(STAND(t), { lean: 0.22 * win(t, 4.6, 5.2), sr: mix(0.2, 1.25, win(t, 4.8, 5.6)), er: 0.2, head: 0.05 });
          const m = human(g, w.x, 0, 1, 0.92, { hair: 'pony', dress: true, sway: sn(t, 0.7) * 0.5 }, P);
          if (t > 4.8) keyShape(g, m.hR[0] + 2, m.hR[1], 0.34, 0.1);
          if (open > 0.2) g.emit('spark', 74 + (Math.random() - 0.5) * 8, 16 + Math.random() * 8, g.rate(4 * open));
        } }
      ]
    },
    { // 1 — the baker who wakes before the sun
      beats: [
        { d: 6.6, bg: 'street', night: true, sky: { c: [150, 136, 124], p: 0.5, x: 0, y: -10 }, cam: [-14, 4, 1.22, 1.28], fg(g, t) {
          floor(g, -270, 270); const lit = win(t, 0.9, 1.6);
          house(g, -30, 60, 44, -6, lit, t); g.R(-4, 44 * 0.5, 0.9, 10); g.R(-4, 44 * 0.5 + 9, 12, 0.9); g.at(4, 44 * 0.5 + 3.4, () => { g.E(0, 0, 5.4, 2.6); g.C(-3.6, 1.3, 1.5); g.C(0, 2, 1.7); g.C(3.6, 1.3, 1.5); }, 0.06 * sn(t, 0.4));
          g.tone('#140d08', () => g.R(-22, 0, 12, 22)); g.line([-22, 0, -22, 22, -10, 22, -10, 0], 0.8, '#ffc07a', 0.5 * lit);
          const w = walker(t, 26, 120, 3.9, 6.4); let P = w.P;
          if (t < 3.9) P = blend(STAND(t), { sl: -2.8, sr: 2.8, el: 0.3, er: 0.3, lean: -0.08, head: 0.3, hl: 0.05, hr: -0.05 }, bell(t, 1.6, 2.2, 3.0, 3.5));
          human(g, w.x, 0, 1, 1.1, { hat: 'chef', belly: true }, P);
        } },
        { d: 6.8, bg: 'room', sky: { c: [228, 160, 84], p: 0.95, x: 0, y: 16 }, cam: [-10, -4, 1.4, 1.5], fg(g, t) {
          floor(g, -270, 270);
          g.R(-40, 20, 84, 3); g.R(-36, 0, 3, 20); g.R(37, 0, 3, 20); g.path(c => { c.ellipse(8, 30, 11, 7.5, 0, PI, TAU); c.closePath(); }); g.R(-3.4, 29.6, 22.8, 1.4); g.path(c => { c.ellipse(8, 30.6, 8, 3.2 + 0.4 * sn(t, 0.5), 0, 0, PI); c.closePath(); });
          g.P([-70, 0, -54, 0, -52, 14, -58, 19, -66, 19, -72, 14]); g.P([-66, 19, -58, 19, -62, 23]);
          const stir = t < 3.6 || t > 5; const P = Object.assign(STAND(t), { lean: 0.12, sr: stir ? 1.25 + 0.16 * sn(t, 1.4) : 1.0, er: stir ? 0.9 + 0.2 * sn(t, 1.4, 0.25) : 0.4, sl: t > 3.6 && t < 5 ? mix(0.3, 1.45, bell(t, 3.6, 4.0, 4.6, 5.0)) : 0.25, el: t > 3.6 && t < 5 ? 0.55 : 0.3, head: -0.12 });
          const m = human(g, -18, 0, 1, 1.1, { hat: 'chef', belly: true }, P);
          if (stir) g.L(m.hR[0], m.hR[1], 8 + 3 * sn(t, 1.4), 31, 1.1, 0.8);
          if (stir && sn(t, 0.55) > 0.7) g.emit('flour', 8, 34, g.rate(18));
          if (t > 3.9 && t < 4.7) g.emit('salt', m.hL[0] + 1, m.hL[1] - 1, g.rate(30));
        } },
        { d: 7.0, bg: 'street', sky: { c: [236, 170, 90], p: 0.8, x: 60, y: -22 }, skyTo: { y: 22 }, cam: [-14, -2, 1.26, 1.34], fg(g, t) {
          floor(g, -270, 270);
          g.path(c => { c.arc(-68, 0, 30, 0, PI); c.closePath(); }); g.R(-78, 26, 9, 22); g.tone('rgba(255,160,70,.95)', () => g.path(c => { c.moveTo(-80, 0); c.lineTo(-80, 9); c.arc(-68, 9, 12, PI, 0, true); c.lineTo(-56, 0); c.closePath(); })); g.glow(-68, 8, 34, '255,150,60', 0.55 + 0.1 * sn(t, 0.8));
          g.emit('smell', -73.5, 50, g.rate(3.2));
          const push = bell(t, 0.3, 1.6, 2.3, 3.3); const m = human(g, -18 - push * 10, 0, -1, 1.1, { hat: 'chef', belly: true }, Object.assign(STAND(t), { lean: 0.22 * push + 0.05, sl: 1.35, sr: 1.25, el: 0.3, er: 0.25 }));
          const px = m.hR[0], py = m.hR[1]; g.L(px, py, px - 30, 9, 1.2, 1.2); g.RR(px - 38, 7.6, 10, 2.4, 1);
          if (push > 0.1 && push < 0.95) g.E(px - 33, 11.4, 4.4, 2.2);
          g.R(34, 0, 2, 38); g.R(92, 0, 2, 38); for (let j = 0; j < 3; j++) { g.R(34, 11 + j * 12, 60, 1.6); for (let i = 0; i < 4; i++) { const k = win(t, 2.6 + (j * 4 + i) * 0.22, 3.1 + (j * 4 + i) * 0.22); if (k > 0) g.E(42 + i * 14, 14.6 + j * 12, 5.6 * k, 2.8 * k); } }
        } },
        { d: 7.0, bg: 'street', sky: { c: [240, 180, 100], p: 1.2, x: 40, y: 20 }, cam: [-34, -24, 1.22, 1.28], fg(g, t) {
          floor(g, -270, 270);
          [[-118, 44, 40], [-30, 50, 46], [60, 46, 42]].forEach(([x, w, h], i) => {
            house(g, x, w, h, 4 - i * 3, 0, t); const op = win(t, 0.6 + i * 1.0, 1.3 + i * 1.0);
            g.tone('#2a1c11', () => g.R(x - 9, h * 0.42, 18, 16));
            g.at(x, h * 0.42 + 4, () => { g.E(0, 0, 7, 5); g.C(0, 7.8, 4.2); g.P([3.3, 9, 6.6, 8, 3.3, 6.8]); if (i === 1) g.C(-2.2, 11.4, 2.2); }, 0.18 * op * (0.6 + 0.4 * sn(t, 0.6, i * 0.3)), op * 0.95 + 0.05, op * 0.95 + 0.05);
            const ca = Math.cos(op * PI) * 9; g.at(x - 9, h * 0.42, () => g.R(Math.min(0, ca), 0, Math.abs(ca) + 1, 16)); g.at(x + 9, h * 0.42, () => g.R(Math.min(0, -ca) - 1, 0, Math.abs(ca) + 1, 16));
            g.R(x - 11, h * 0.42 - 1.6, 22, 1.6);
          });
          g.emit('smell', -250 + ((t * 40) % 60), 26, g.rate(2.4));
          bird(g, -160 + t * 52, 84 + sn(t, 0.3) * 4, 1, t, 0);
        } }
      ]
    },
    { // 2 — Bolt and the broken tap
      beats: [
        { d: 6.8, bg: 'garden', sky: WARM, cam: [0, 20, 1.3, 1.4], fg(g, t) {
          grass(g, -260, 260, t);
          const F = [-20, 6, 32, 58, 84, 110]; const x = t < 0.6 ? -64 : mix(-64, 96, win(t, 0.6, 6.2));
          F.forEach((fx, i) => flower(g, fx, 16 + (i % 3) * 4, 0.75 + 0.25 * win(x, fx - 34, fx - 18), 0.3 * (1 - win(x, fx - 34, fx - 18)), t, i));
          g.L(-130, 0, -130, 26, 4.2, 4); g.L(-130, 26, -121, 26, 3.2, 3.2); g.L(-121, 26, -121, 22, 3, 3); g.C(-130, 30.5, 2.6);
          const hand = robot(g, x, 0, 1, 1.1, { arm: 1.2, elbow: 0.4, tilt: 0.05 * sn(t, 0.5), bounce: 0.5 * Math.abs(sn(t, 1.2)) });
          g.at(hand[0] + 1, hand[1] - 1, () => { g.path(c => { c.moveTo(-4, 0); c.lineTo(4, 0); c.lineTo(3.4, -8); c.lineTo(-3.4, -8); c.closePath(); }); g.L(3, -2.5, 12, -6.5, 1.4, 1); g.path(c => { c.arc(-0.4, 0.2, 3.6, 0, PI); c.arc(-0.4, 0.2, 2.8, PI, 0, true); }); }, 0.2);
          g.emit('water', hand[0] + 13, hand[1] - 8.5, g.rate(22));
        } },
        { d: 6.6, bg: 'garden', sky: { c: [224, 158, 86], p: 0.95, x: -30, y: 10 }, cam: [4, 8, 1.8, 1.95], fg(g, t) {
          grass(g, -260, 260, t);
          const snap = win(t, 2.4, 2.6), fall = win(t, 2.5, 3.1);
          g.L(10, 0, 10, 34, 5, 4.6); g.C(10, 38.6, 3.6); for (let k = 0; k < 4; k++) g.L(10, 38.6, 10 + Math.cos(k * PI / 2 + t * (t < 2.3 ? 2.4 : 0)) * 3.4, 38.6 + Math.sin(k * PI / 2 + t * (t < 2.3 ? 2.4 : 0)) * 3.4, 0.8, 0.8);
          g.L(10, 30, 20, 30, 4, 4);
          if (snap < 1) g.L(20, 30, 20, 25, 3.6, 3.6); else g.at(mix(20, 26, fall), mix(27.5, 1.8, fall * fall), () => g.L(0, 2.5, 0, -2.5, 3.6, 3.6), fall * 1.8);
          bucket(g, 22, 0, 1);
          if (t > 0.4 && t < 2.4) g.emit('stream', 20, 24.5, g.rate(46));
          if (t > 2.4 && t < 2.8) g.emit('dust', 20, 26, g.rate(90));
          if (t > 2.8 && t < 4.6) g.emit('drip', 20, 29, g.rate(2));
          const jolt = bell(t, 2.45, 2.6, 2.8, 3.2);
          robot(g, -3, 0, 1, 1.1, { arm: t < 2.4 ? 2.5 : mix(2.5, 0.4, win(t, 2.6, 3.2)), elbow: t < 2.4 ? 0.3 + 0.2 * sn(t, 1.2) : 0.5, arm2: t > 3.4 ? 2.6 * bell(t, 3.4, 3.8, 5.2, 5.8) : 0.2, tilt: t > 3.1 ? 0.28 * win(t, 3.1, 3.6) : 0, bounce: jolt * 3, blink: t > 4 && t < 4.15 });
        } },
        { d: 7.6, bg: 'garden', sky: { c: [232, 166, 88], p: 1, x: -90, y: 8 }, skyTo: { x: 110, y: -6 }, cam: [-6, -2, 1.12, 1.16], fg(g, t) {
          grass(g, -260, 260, t);
          g.path(c => { c.ellipse(-95, 0, 34, 4.5, 0, PI, TAU); c.closePath(); }); for (let i = 0; i < 5; i++) g.line([-124 + i * 12 + ((t * 9 + i * 5) % 10), 1, -119 + i * 12 + ((t * 9 + i * 5) % 10), 1], 0.8, '#ffc98a', 0.55);
          for (const rx of [-132, -126, -62, -57]) { g.S([rx, 0, rx + sn(t, 0.3, rx) * 1.4, 14, rx + sn(t, 0.3, rx) * 2, 22], 1.2, 0.4); g.E(rx + sn(t, 0.3, rx) * 2, 20, 1.2, 3); }
          [58, 78, 98, 118].forEach((fx, i) => flower(g, fx, 17 + (i % 2) * 5, 0.95, 0, t, i));
          const cyc = (t / 3.6) % 1, go = cyc < 0.5, u = sm(go ? cyc * 2 : (cyc - 0.5) * 2), x = go ? mix(-50, 40, u) : mix(40, -50, u);
          const atPond = !go && u > 0.92 || go && u < 0.08, atBed = go && u > 0.9 || !go && u < 0.1;
          const hand = robot(g, x, 0, go ? 1 : -1, 1.1, { arm: atPond ? 0.55 : atBed ? 1.55 : 1.15, elbow: 0.25, bounce: 0.6 * Math.abs(sn(t, 1.6)) });
          bucket(g, hand[0], hand[1] - 13.4, 1, atBed ? -0.9 * (go ? 1 : -1) : 0);
          if (atBed) g.emit('water', hand[0] + 5 * (go ? 1 : -1), hand[1] - 8, g.rate(28));
        } },
        { d: 7.0, bg: 'garden', sky: { c: [240, 150, 80], p: 1.1, x: 90, y: -14 }, cam: [-4, 6, 1.3, 1.4], fg(g, t) {
          grass(g, -260, 260, t);
          [-40, -16, 8, 32, 56, 80, 104].forEach((fx, i) => { const b = win(t, 0.4 + i * 0.35, 1.6 + i * 0.35); flower(g, fx, 14 + b * 8 + (i % 3) * 3, 0.6 + 0.55 * b, 0.35 * (1 - b), t, i); });
          robot(g, -76, 0, 1, 1.1, { arm: 0.15, elbow: 0.2, arm2: 0.1, tilt: -0.12 + 0.05 * sn(t, 0.25), bounce: -1.2 * win(t, 1, 2) });
          const bx = 30 + sn(t, 0.13) * 60, by = 44 + sn(t, 0.21, 0.3) * 12, f = Math.abs(sn(t, 3));
          g.at(bx, by, () => { g.E(-2.6 * f, 1.6, 3.2 * f + 0.4, 2.2, 0.4); g.E(2.6 * f, 1.6, 3.2 * f + 0.4, 2.2, -0.4); g.L(0, -1.5, 0, 2.5, 0.9, 0.7); });
        } }
      ]
    },
    { // 3 — the fox who loved riddles
      beats: [
        { d: 6.6, bg: 'forest', sky: { c: [216, 150, 84], p: 0.85, x: 0, y: 4 }, cam: [0, 0, 1.38, 1.52], fg(g, t) { bridgeSet(g, t); fox(g, 0, deck(0), 1, 1, { tail: sn(t, 0.35), ear: 0.6 * sn(t, 0.4) - 0.3, head: 0.18 * sn(t, 0.16) }); for (let i = 0; i < 5; i++) g.glow(-130 + i * 60 + sn(t, 0.07, i) * 20, 30 + sn(t, 0.11, i * 0.3) * 16, 5, '255,210,130', 0.4 + 0.4 * sn(t, 0.5, i * 0.2)); } },
        { d: 7.2, bg: 'forest', sky: { c: [216, 150, 84], p: 0.85, x: 0, y: 4 }, cam: [16, 24, 1.2, 1.26], fg(g, t) {
          bridgeSet(g, t); const ask = bell(t, 1.7, 2.1, 3.1, 3.5) + bell(t, 4.8, 5.1, 5.8, 6.1); fox(g, 0, deck(0), 1, 1, { tail: sn(t, 0.3), ear: 1.2 * ask, head: -0.28 * ask });
          let w = t < 3.6 ? walker(t, 170, 72, 0, 1.8) : walker(t, 72, 190, 3.6, 5.6); let P = w.P; if (t > 1.8 && t < 3.6) P = Object.assign(STAND(t), { sr: 2.9, er: 1.9 + 0.2 * sn(t, 2), head: -0.1 });
          const m = human(g, w.x, 0, t < 3.6 ? -1 : 1, 1.12, { hat: 'hat', coat: true }, P); g.L(m.hL[0], m.hL[1] + 6, m.hL[0] + 1.5 * (t < 3.6 ? -1 : 1), 0, 1.3, 1.1);
          const w2 = t < 5.1 ? walker(t, 190, 84, 3.2, 4.8) : walker(t, 84, 200, 5.4, 7.2); if (t > 3.2) { const m2 = human(g, w2.x, 0, t < 5.1 ? -1 : 1, 1.02, { hair: 'bun', dress: 'long' }, t > 4.8 && t < 5.4 ? Object.assign(STAND(t), { head: -0.25 }) : w2.P); g.at(m2.hL[0], m2.hL[1] - 5, () => { g.P([-4, 0, 4, 0, 5, 5, -5, 5]); g.path(c => { c.arc(0, 5, 4, 0, PI); c.arc(0, 5, 3.2, PI, 0, true); }); }); }
        } },
        { d: 7.0, bg: 'forest', sky: { c: [226, 160, 88], p: 0.95, x: 30, y: 8 }, cam: [26, 34, 1.3, 1.4], fg(g, t) {
          bridgeSet(g, t); const perk = win(t, 3.0, 3.6); fox(g, 0, deck(0), 1, 1, { tail: sn(t, 0.3) * (1 - perk) + 1.4 * perk, ear: 2 * perk, head: 0.28 * perk });
          const w = walker(t, 175, 76, 0, 2.1, 20); let P = Object.assign(w.P, { air: w.A > 0.1 ? 3.2 * Math.abs(Math.sin(Math.abs(w.x - 175) / 20 * PI)) : 0 });
          if (t > 2.1) P = Object.assign(STAND(t), { sl: -2.2 * win(t, 2.3, 2.8), sr: 2.3 * win(t, 2.3, 2.8), el: 0.3, er: 0.3, head: 0.42 * bell(t, 2.4, 2.7, 4.2, 4.8) + 0.12 * sn(t, 2.2) * bell(t, 2.4, 2.7, 4.0, 4.4), air: 1.6 * Math.abs(sn(t, 2.2)) * bell(t, 2.4, 2.7, 4.0, 4.4) });
          human(g, w.x, 0, -1, 0.9, { hair: 'braids', dress: true, bow: true, sway: sn(t, 1.1) * 0.6 }, P);
          [3.0, 3.6, 4.2].forEach((tt, i) => { const a = win(t, tt, tt + 0.3); if (a > 0) { g.glow(62 + i * 14, 60 + 4 * sn(t, 0.5, i * 0.3) + (i === 1 ? 5 : 0), 9 * a, '255,210,130', 0.9 * a); g.tone('rgba(255,236,200,' + a + ')', () => g.C(62 + i * 14, 60 + 4 * sn(t, 0.5, i * 0.3) + (i === 1 ? 5 : 0), 1.8 * a)); } });
        } },
        { d: 7.6, bg: 'forest', sky: { c: [232, 170, 96], p: 1.05, x: -40, y: 8 }, cam: [-6, -34, 1.24, 1.2], fg(g, t) {
          bridgeSet(g, t); const fx = mix(0, -200, win(t, 1.6, 6.2));
          if (t < 1.6) fox(g, 0, deck(0), 1, 1, { tail: sn(t, 0.8) * 1.2, ear: 0.4, head: -0.4 * bell(t, 0.2, 0.6, 1.1, 1.5) }); else fox(g, fx, deck(fx), -1, 1, { mode: 'walk', ph: (-fx) / 9, A: 0.45 * bell(t, 1.6, 1.9, 5.9, 6.2), tail: sn(t, 0.6) });
          const w = walker(t, 76, -150, 2.4, 7.2, 22); const P = t > 6.4 ? Object.assign(w.P, { sl: 2.8 * win(t, 6.4, 6.8), el: 0.3 + 0.3 * sn(t, 2) }) : w.P;
          human(g, w.x, deck(w.x), -1, 0.9, { hair: 'braids', dress: true, bow: true, sway: sn(t, 1.1) * 0.6 }, P);
        } }
      ]
    },
    { // 4 — Tom's race
      beats: [
        { d: 6.6, bg: 'school', sky: { c: [228, 160, 84], p: 1, x: 0, y: 6 }, dim: 1, cam: [0, 0, 1.3, 1.3], fg(g, t) {
          floor(g, -270, 270); for (let i = -9; i < 10; i++) g.line([i * 30 - ((t * 60) % 30), 0.4, i * 30 + 14 - ((t * 60) % 30), 0.4], 0.8, '#ffc98a', 0.25);
          const u = (t % 2.2) / 2.2, x = mix(-190, 190, u); human(g, x, 0, 1, 0.9, { hair: 'short', pack: true }, gait(x / 34 * TAU, 0.95, true));
        } },
        { d: 7.0, bg: 'school', sky: { c: [236, 168, 88], p: 1.05, x: 20, y: 10 }, cam: [-14, 6, 1.28, 1.34], fg(g, t) {
          floor(g, -270, 270); g.R(-96, 0, 1.4, 0.6); g.line([-96, 0.3, -96, 0.3], 1, '#fff', 0);
          const others = [['curly', -100], ['pony', -74]]; g.tone('#4a3627', () => others.forEach(([hair, x0], i) => { const x = x0 + Math.max(0, t - 0.6) * (70 + i * 8); human(g, x, 2, 1, 0.84, { hair, sway: sn(t, 2) }, t < 0.6 ? Object.assign(STAND(t), { lean: 0.3, hl: 0.5, kl: 0.8, sl: 0.6, sr: -0.4 }) : gait((x - x0) / 32 * TAU + i, 0.95, true)); }));
          const fall = win(t, 2.2, 2.9), xT = -86 + Math.max(0, Math.min(t, 2.3) - 0.6) * 66 + fall * 12;
          let P = t < 0.6 ? Object.assign(STAND(t), { lean: 0.3, hl: 0.5, kl: 0.8, sl: 0.6, sr: -0.4 }) : gait((xT + 86) / 32 * TAU, 0.95 * (1 - fall), true);
          if (t > 2.2) P = blend(P, { rot: -1.45, lean: 0.1, hl: 0.3, kl: 0.4, hr: -0.4, kr: 0.9, sl: 2.6, el: 0.2, sr: 2.2, er: 0.3, head: 0.4 }, fall);
          const m = human(g, xT, 0, 1, 0.9, { hair: 'short' }, P);
          const f = m.fR; g.S([f[0] - 1, f[1] + 0.4, f[0] - 4, f[1] + 1 + sn(t, 3) * 1.5, f[0] - 7, f[1] + sn(t, 3, 0.3) * 2.5], 0.7, 0.5);
          if (t > 2.6 && t < 3.0) g.emit('dust', xT + 10, 2, g.rate(80));
        } },
        { d: 7.4, bg: 'school', sky: { c: [236, 168, 88], p: 1.05, x: 60, y: 10 }, cam: [30, 50, 1.22, 1.26], fg(g, t) {
          floor(g, -270, 270); g.R(122, 0, 2, 30); g.R(150, 0, 2, 30); g.S([123, 26, 127, 20 + sn(t, 0.8) * 1.5, 130, 15 + sn(t, 0.8, 0.2) * 2], 1, 0.6); g.S([151, 26, 147, 20 + sn(t, 0.8, 0.4) * 1.5, 144, 16 + sn(t, 0.8, 0.5) * 2], 1, 0.6);
          const up = win(t, 0.4, 1.2), tie = t > 1.2 && t < 2.8, stand = win(t, 2.8, 3.4);
          let P = blend({ rot: -1.45, lean: 0.1, hl: 0.3, kl: 0.4, hr: -0.4, kr: 0.9, sl: 2.6, el: 0.2, sr: 2.2, er: 0.3, head: 0.4 }, Object.assign(KNEEL(), { sr: tie ? 1.3 + 0.2 * sn(t, 2.5) : 0.9, sl: tie ? 1.1 + 0.2 * sn(t, 2.5, 0.5) : 0.6, lean: 0.55 }), up);
          let x = -70;
          if (t > 2.8) { const w = walker(t, -70, 180, 3.3, 6.9, 32, true); x = w.x; P = blend(P, w.P, stand); }
          human(g, x, 0, 1, 0.9, { hair: 'short' }, P);
        } },
        { d: 7.2, bg: 'school', sky: { c: [244, 184, 104], p: 1.2, x: 0, y: 16 }, cam: [20, 28, 1.5, 1.65], fg(g, t) {
          floor(g, -270, 270);
          const w = walker(t, 150, 32, 0.2, 2.4, 26); let P = w.P; if (t > 2.4) P = Object.assign(STAND(t), { sr: mix(0.2, 1.2, win(t, 2.5, 3.1)) + 1.5 * win(t, 4.2, 4.8), er: mix(0.2, 0.1, win(t, 2.5, 3.1)), lean: 0.08, head: -0.12 + 0.3 * win(t, 4.2, 4.8) });
          human(g, w.x, 0, -1, 1.12, { hat: 'cap', w: 1.08 }, P);
          const raise = win(t, 4.2, 4.8); human(g, 12, 0, 1, 0.9, { hair: 'short' }, Object.assign(STAND(t), { head: mix(-0.35, 0.25, win(t, 2.8, 3.4)), sr: mix(0.1, 2.9, raise), er: 0.1, sl: -0.1 }));
          [[0, 72], [26, 80], [-18, 60], [44, 64], [8, 90]].forEach(([x, y], i) => sparkle(g, x, y, 3.4, win(t, 4.6 + i * 0.2, 5.0 + i * 0.2) * (0.6 + 0.4 * sn(t, 0.8, i * 0.3))));
        } }
      ]
    },
    { // 5 — the light in the storm
      beats: [
        { d: 6.8, bg: 'sea', sky: { c: [214, 150, 90], p: 0.8, x: 60, y: 0 }, cam: [-40, -34, 1, 1.03], fg(g, t) {
          g.P([-270, 0, -40, 0, -44, 6, -52, 11, -62, 15, -72, 18, -270, 18]); lighthouse(g, -110, 18, 1, 0, t);
          const look = bell(t, 0.6, 1.2, 4.0, 4.6); const m = human(g, -62, 15, 1, 1.02, { hair: 'bun', coat: true }, Object.assign(STAND(t), { sr: mix(0.3, 1.75, look), er: mix(0.2, 1.2, look), head: t > 4.6 ? -0.25 * sn(t, 1.6) * bell(t, 4.6, 4.9, 5.8, 6.2) : 0.04 }));
          if (look > 0.3) g.L(m.hR[0] - 0.5, m.hR[1] + 2.6, m.hR[0] + 8, m.hR[1] + 4.8, 1.8, 2.6);
          waves(g, t, 3, 1.4, 0.7, NEAR, -40, 280); waves(g, t, 0.5, 1.2, 1.0, SIL, -60, 280, 2);
          bird(g, 40 + sn(t, 0.08) * 60, 70 + sn(t, 0.2) * 6, 0.9, t, 0); bird(g, 90 + sn(t, 0.07, 0.4) * 50, 80 + sn(t, 0.18, 0.2) * 5, 0.7, t, 0.4);
        } },
        { d: 7.0, bg: 'sea', storm: true, sky: { c: [150, 144, 136], p: 0.45, x: 60, y: 0 }, cam: [-14, -8, 1, 1.03], fg(g, t) {
          const blink = (t % 1.1) < 0.5 ? 1 : 0.15; boat(g, 105, 6 + sn(t, 0.5) * 1.5, 0.45, 0.12 * sn(t, 0.45), 1, blink);
          g.P([-270, 0, -40, 0, -44, 6, -52, 11, -62, 15, -72, 18, -270, 18]); lighthouse(g, -110, 18, 1, 0, t);
          const pt = win(t, 2.0, 2.6); human(g, -62, 15, 1, 1.02, { hair: 'bun', coat: true, sway: sn(t, 1.2) }, Object.assign(STAND(t), { sr: mix(0.2, 1.85, pt), er: 0.05, lean: 0.08 + 0.03 * sn(t, 1.2), head: 0.08 }));
          waves(g, t, 5, 4.6, 1.8, NEAR, -40, 280); waves(g, t, 1, 3.8, 2.3, SIL, -60, 280, 2);
          for (let i = 0; i < 46; i++) { const x = -200 + hash(i) * 420 - ((t * 60 + i * 17) % 60), y = 104 - ((t * 150 + i * 37) % 110); g.line([x, y, x - 3, y - 9], 0.5, '#e8dcc6', 0.3); }
          g.bolt(40, 104, 70, bell(t, 1.2, 1.25, 1.35, 1.6) + bell(t, 4.6, 4.65, 4.75, 5.0) * 0.8);
        } },
        { d: 7.2, bg: 'sea', storm: true, sky: { c: [170, 150, 130], p: 0.55, x: 0, y: 30 }, cam: [0, 0, 1, 1.03], fg(g, t) {
          const lamp = win(t, 4.4, 5.0), u = win(t, 0.3, 4.3), S = 1.12;
          g.P([-60, 0, 60, 0, 44, 5, 20, 7.5, -20, 7.5, -46, 5]); lighthouse(g, 0, 7, S, lamp, t, false, true);
          const W = [[-3.2, 9], [3, 19], [-2.6, 29], [2.4, 39], [-2, 49], [1.8, 57]];
          W.forEach(([wx, wy], i) => { const on = u * W.length - i, lit = on >= 0 && on < 1 ? 1 : on >= 1 ? 0.25 : 0.06, x = wx * S, y = 7 + wy * S;
            g.tone('rgba(255,196,120,' + lit + ')', () => g.RR(x - 2.3, y, 4.6, 7.4, 1.8)); if (lit > 0.5) { g.glow(x, y + 3.7, 14, '255,184,100', 0.55); g.tone(SIL, () => human(g, x + (on - 0.5) * 2.4 * (i % 2 ? -1 : 1), y + 0.3, i % 2 ? -1 : 1, 0.13, { hair: 'bun', coat: true }, gait(on * 3 * TAU, 0.9))); } });
          if (lamp > 0.2) sparkle(g, 105, 12, 3, lamp * (0.5 + 0.5 * Math.max(0, Math.cos(t * 0.55 * TAU))));
          boat(g, 105, 5 + sn(t, 0.5) * 1.5, 0.42, 0.12 * sn(t, 0.45), 1, (t % 1.1) < 0.5 ? 1 : 0.15);
          waves(g, t, 4, 4, 1.8, NEAR, -280, 280); waves(g, t, 0.5, 3.4, 2.3, SIL, -280, 280, 2);
          for (let i = 0; i < 46; i++) { const x = -200 + hash(i) * 420 - ((t * 60 + i * 17) % 60), y = 104 - ((t * 150 + i * 37) % 110); g.line([x, y, x - 3, y - 9], 0.5, '#e8dcc6', 0.28); }
          g.bolt(-90, 104, 64, bell(t, 2.0, 2.05, 2.15, 2.4) * 0.8);
        } },
        { d: 7.2, bg: 'sea', sky: { c: [246, 188, 110], p: 1.25, x: 40, y: 8 }, cam: [-10, -4, 1.02, 1.06], fg(g, t) {
          g.P([-270, 0, -78, 0, -84, 8, -98, 14, -270, 14]); lighthouse(g, -116, 14, 0.8, 0.12, t);
          g.R(0, 5, 150, 2.2); for (let i = 0; i < 6; i++) g.R(4 + i * 26, -8, 2.4, 13.4); g.C(30, 9, 1.6);
          const bob = sn(t, 0.35) * 1.2; boat(g, 70, bob + 2.2, 1.3, 0.04 * sn(t, 0.35), 2, 0); g.S(bz([30, 8.6], [36, 3], [42, 3], [52, 9 + bob], 8), 0.7, 0.7);
          human(g, 104, 7.2, -1, 1.12, { hat: 'hat', coat: true, w: 1.1 }, Object.assign(STAND(t), { sr: 2.7 + 0.35 * sn(t, 1.4), er: 0.4 }));
          human(g, -88, 9.7, 1, 0.8, { hair: 'bun', coat: true }, Object.assign(STAND(t), { sr: 2.5 * win(t, 1.4, 1.9) + 0.3 * sn(t, 1.4, 0.3) * win(t, 1.9, 2.2), er: 0.4 }));
          waves(g, t, -0.8, 0.9, 0.6, SIL, -78, 280, 2); bird(g, -60 + t * 14, 70, 0.9, t, 0); bird(g, -10 + t * 12, 80, 0.7, t, 0.3);
        } }
      ]
    },
    { // 6 — penguins, the great swimmers
      beats: [
        { d: 6.6, bg: 'ice', sky: { c: [214, 196, 164], p: 0.95, x: 0, y: 10 }, cam: [0, 6, 1.7, 1.85], fg(g, t) {
          g.P([-270, 10, 90, 10, 96, 4, 94, -12, -270, -12]); waves(g, t, 1.5, 1, 0.8, SIL, 90, 280);
          penguin(g, 40, 10, 1, 1.05, { flap: 1.1 + 1.0 * sn(t, 4.5), hop: 4 * Math.abs(sn(t, 1.1)) });
          penguin(g, -20, 10, 1, 0.95, { flap: 0.1, rock: 0.05 * sn(t, 0.3) }); penguin(g, -44, 10, 1, 0.9, { flap: 0.05, rock: -0.06 * sn(t, 0.25) });
          bird(g, -170 + t * 55, 46 + sn(t, 0.3) * 4, 1.1, t, 0);
        } },
        { d: 6.8, bg: 'deep', sky: { c: [120, 168, 160], p: 0.85, x: 0, y: 110 }, cam: [0, 0, 1, 1], fg(g, t) {
          { const sf = []; for (let x = -280; x <= 280; x += 6) sf.push(x, 93 + 1.4 * Math.sin(x * 0.08 + t * 2)); g.line(sf, 1.4, '#cfeee6', 0.55); g.line(sf, 5, '#9fd8cc', 0.12); }
          g.path(c => { c.moveTo(-280, -12); for (let x = -280; x <= 280; x += 10) c.lineTo(x, 3 + 2 * Math.sin(x * 0.05) + hash(Math.round(x)) * 2); c.lineTo(280, -12); c.closePath(); });
          [[0, 70, 150], [1.1, 44, 190], [2.2, 24, 170]].forEach(([o, y, v], i) => { const x = -230 + ((t + o) * v) % 460, yy = y + 6 * sn(t, 0.5, i * 0.3); penguin(g, x, yy, 1, 1.6, { mode: 'swim', flap: 1.4 * sn(t, 3, i * 0.2), ang: 0.1 * sn(t, 0.5, i * 0.3) }); g.emit('bubble', x - 19, yy + 3, g.rate(9)); });
          for (let i = 0; i < 6; i++) { const x = 160 - ((t * 30 + i * 60) % 420), y = 30 + hash(i) * 50 + 3 * sn(t, 0.7, i); g.at(x, y, () => { g.E(0, 0, 4, 1.8); g.P([3.4, 0, 6.8, 2.2, 6.8, -2.2]); }, 0, -1.5, 1.5); }
        } },
        { d: 6.8, bg: 'ice', sky: { c: [220, 200, 168], p: 1, x: 0, y: 8 }, cam: [-40, 24, 1.65, 1.7], fg(g, t) {
          g.path(c => { c.moveTo(-280, -12); for (let x = -280; x <= 280; x += 10) c.lineTo(x, 4 + 1.6 * Math.sin(x * 0.04)); c.lineTo(280, -12); c.closePath(); });
          for (let i = 0; i < 4; i++) { const x = -120 + i * 30 + t * 14, rk = 0.16 * sn(t, 1.3, i * 0.25); penguin(g, x, 4 + 1.6 * Math.sin(x * 0.04), 1, 1 - i * 0.05, { rock: rk, flap: 0.25 + 0.1 * sn(t, 1.3) }); }
        } },
        { d: 7.2, bg: 'ice', sky: { c: [226, 204, 170], p: 1.1, x: 40, y: 10 }, cam: [-44, -34, 1.24, 1.3], fg(g, t) {
          g.P([-280, -12, -280, 62, -170, 60, 60, 4, 280, 4, 280, -12]);
          const sl = (x) => x < -170 ? 60 : x < 60 ? mix(60, 4, (x + 170) / 230) : 4, ang = Math.atan2(56, 230);
          [0, 1.6, 3.2].forEach((o, i) => { const u = cl((t - o) / 3.2, 0, 1), x = u <= 0 ? -190 : mix(-190, 40 - i * 30, 1 - Math.pow(1 - u, 2)); if (t > o - 0.4) { penguin(g, x, sl(x), 1, 1.3, { mode: x < 60 ? 'slide' : 'slide', ang: x < 60 ? -ang : 0, flap: 1.4 }); if (u > 0 && u < 0.9) g.emit('snow', x + 8, sl(x) + 1, g.rate(24)); } });
        } }
      ]
    },
    { // 7 — the flower in the clock
      beats: [
        { d: 6.8, bg: 'room', night: true, sky: { c: [190, 150, 110], p: 0.7, x: 0, y: 20 }, cam: [0, 0, 1, 1.04], fg(g, t) {
          floor(g, -270, 270); grandClock(g, 0, t, { hour: PI / 2, minute: 0, pend: 0 });
          g.line([13, 88, 22, 96, 26, 88], 0.3, '#d8c7a4', 0.5); g.line([13, 84, 24, 92], 0.3, '#d8c7a4', 0.4); g.line([17, 92, 20, 86, 25, 90], 0.3, '#d8c7a4', 0.35);
          for (let i = 0; i < 7; i++) { const y = 104 - ((t * 16 + i * 17) % 112), x = -120 + i * 38 + sn(t, 0.3, i * 0.17) * 12; g.tone(PAPER, () => g.at(x, y, () => { g.R(-3.4, -4.4, 6.8, 8.8); }, t * (1 + i * 0.2) + i, 1, Math.abs(Math.cos(t * 2 + i)) * 0.8 + 0.2)); }
        } },
        { d: 7.2, bg: 'room', sky: { c: [210, 154, 96], p: 0.85, x: 0, y: 20 }, cam: [0, 0, 1, 1], fg(g, t) {
          floor(g, -270, 270); grandClock(g, 0, t, { hour: PI / 2, minute: 0, pend: 0 });
          const w = t < 3.2 ? walker(t, -170, -30, 0, 1.8, 18) : walker(t, -30, -180, 3.4, 5.6, 18); let P = w.P; if (t > 1.8 && t < 3.4) P = Object.assign(STAND(t), { sr: mix(0.3, 2.2, bell(t, 1.9, 2.2, 2.5, 2.8)) + 0.12 * sn(t, 4) * bell(t, 2.0, 2.2, 2.4, 2.6), er: 0.3, head: 0.25 * sn(t, 1.2) * bell(t, 2.6, 2.8, 3.2, 3.4) });
          const gm = human(g, w.x, 0, t < 3.3 ? 1 : -1, 1.08, { hair: 'bald', beard: true, w: 1.05 }, Object.assign(P, { lean: (P.lean || 0) + 0.18 })); g.L(gm.hL[0], gm.hL[1], gm.hL[0] + 3, 0, 1.2, 1);
          const w2 = t < 5.2 ? walker(t, 190, 40, 2.6, 4.3, 22) : walker(t, 40, 200, 5.6, 7.2, 22); let P2 = w2.P; if (t > 4.3 && t < 5.6) P2 = Object.assign(KNEEL(), { sr: 1.4 + 0.5 * sn(t, 3), er: 0.4, sl: t > 5.0 ? 2.6 : 0.5, el: 0.3 });
          if (t > 2.6) { const m = human(g, w2.x, 0, t < 5.3 ? -1 : 1, 1.1, { hat: 'cap', w: 1.05 }, P2); g.RR(m.hL[0] - 4, m.hL[1] - 6, 8, 5, 1); }
        } },
        { d: 7.4, bg: 'room', sky: { c: [222, 160, 92], p: 0.95, x: -20, y: 30 }, cam: [2, 6, 1.02, 1.08], fg(g, t) {
          floor(g, -270, 270);
          g.R(-64, 0, 5, 96); g.R(52, 0, 5, 96); g.R(-64, 91, 121, 5); g.R(-64, 0, 121, 4);
          gear(g, 22, 62, 16, 13, 0.2); gear(g, 48, 43, 10.5, 9, 0.35); gear(g, -8, 30, 9, 8, 0.1); gear(g, -30, 58, 12, 10, 0.5); gear(g, 0, 80, 6.5, 7, 0.3);
          g.at(38.5, 51, () => { g.tone('#b58d58', () => { g.L(0, -3, 0, 3, 0.5, 0.5); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.E(Math.cos(a) * 1.3, 3 + Math.sin(a) * 1.3, 1.1, 0.6, a); } }); g.glow(0, 3, 7, '255,210,140', 0.35 + 0.25 * sn(t, 0.6)); }, 0.5);
          const reach = win(t, 3.0, 5.2); human(g, 70 - reach * 4, 0, -1, 0.95, { hair: 'bob', bow: true, dress: true }, Object.assign(STAND(t), { lean: mix(0.1, 0.42, win(t, 1.2, 2.2)), head: mix(0, -0.2, win(t, 1.2, 2.2)), sr: mix(0.2, 1.55, reach), er: mix(0.3, 0.05, reach) }));
        } },
        { d: 7.6, bg: 'room', sky: { c: [240, 176, 100], p: 1.15, x: 0, y: 20 }, cam: [-4, 0, 1, 1.02], fg(g, t) {
          floor(g, -270, 270); const go = win(t, 0.6, 1.4);
          grandClock(g, -24, t, { hour: PI / 2 + t * 0.06 * go, minute: t * 0.9 * go, pend: 0.32 * go * Math.sin(t * PI * 1.6), glass: go });
          const m = human(g, 44, 0, -1, 0.95, { hair: 'bob', bow: true, dress: true }, Object.assign(STAND(t), { sr: 2.45, er: 0.25, head: 0.2 }));
          g.at(m.hR[0], m.hR[1] + 2, () => { g.tone('#c49a60', () => { g.L(0, 0, 0, 5, 0.5, 0.5); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.E(Math.cos(a) * 1.6, 5.6 + Math.sin(a) * 1.6, 1.3, 0.7, a); } }); g.glow(0, 5.6, 10, '255,210,140', 0.55); });
          const j = bell(t, 2, 2.4, 6.6, 7.2); human(g, -96, 0, 1, 1.08, { hair: 'bald', beard: true, w: 1.05 }, Object.assign(STAND(t), { sl: 2.5 * j + 0.15 * sn(t, 1.4) * j, sr: 2.4 * j - 0.15 * sn(t, 1.4) * j, el: 0.3, er: 0.3, head: 0.2 * j, lean: 0.1 }));
          if (go > 0.9 && sn(t, 0.8) > 0.95) g.emit('spark', -24, 73, 2);
        } }
      ]
    }
  ];
  function deck(x) { return Math.abs(x) < 58 ? Math.max(3, 21 * Math.cos(x / 58 * PI / 2) + 1.5) : 3; }
  function bridgeSet(g, t) {
    g.P([-270, 0, -64, 0, -58, 3, -270, 3]); g.P([64, 0, 270, 0, 270, 3, 58, 3]); g.R(-270, -12, 540, 12.2);
    const top = []; for (let i = 0; i <= 24; i++) { const x = -58 + i * 116 / 24; top.push(x, deck(x) - 1.6); } g.S(top, 3.6, 3.6);
    for (let i = -2; i <= 2; i++) { const x = i * 22; g.R(x - 0.8, deck(x) - 1, 1.6, 7.4); }
    const rail = []; for (let i = 0; i <= 24; i++) { const x = -52 + i * 104 / 24; rail.push(x, deck(x) + 5.4); } g.S(rail, 1.2, 1.2);
    g.P([-72, 0, -54, 0, -54, 3.4, -60, 5, -72, 3]); g.P([72, 0, 54, 0, 54, 3.4, 60, 5, 72, 3]);
    for (let i = 0; i < 6; i++) g.line([-40 + i * 16 + ((t * 7 + i * 4) % 8), -1.2, -35 + i * 16 + ((t * 7 + i * 4) % 8), -1.2], 0.8, '#ffc98a', 0.5);
  }

  /* ---------- the engine ---------- */
  const TR = 1.5;   // seconds a change of beat takes (dissolve out, form in)
  let noiseCache = null;
  function noiseField() {   // smooth value noise, rank-normalised to [0,1], biased so the top of a puppet goes first (smoke rises)
    if (noiseCache) return noiseCache;
    const W = 192, H = 96, v = new Float32Array(W * H), g = [];
    for (let i = 0; i < 13 * 7; i++) g.push(Math.random());
    const at = (x, y) => g[(y % 7) * 13 + (x % 13)];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, a = 1, f = 1 / 16, tot = 0; for (let o = 0; o < 4; o++) { const fx = x * f, fy = y * f, ix = Math.floor(fx), iy = Math.floor(fy), ux = sm(fx - ix), uy = sm(fy - iy); s += a * mix(mix(at(ix, iy), at(ix + 1, iy), ux), mix(at(ix, iy + 1), at(ix + 1, iy + 1), ux), uy); tot += a; a *= 0.5; f *= 2; } v[y * W + x] = s / tot * 0.72 + (y / H) * 0.28; }
    const idx = Array.from(v.keys()).sort((a, b) => v[a] - v[b]); const r = new Float32Array(W * H); idx.forEach((k, i) => { r[k] = i / (idx.length - 1); });
    noiseCache = { W, H, v: r, masks: {} }; return noiseCache;
  }
  function mask(level, inv) {   // erase where noise < level (or > 1 - level when forming)
    const N = noiseField(), key = (inv ? 'i' : 'o') + Math.round(level * 40); if (N.masks[key]) return N.masks[key];
    const cv = document.createElement('canvas'); cv.width = N.W; cv.height = N.H; const x = cv.getContext('2d'), im = x.createImageData(N.W, N.H), L = Math.round(level * 40) / 40 * 1.26 - 0.13;
    for (let i = 0; i < N.W * N.H; i++) { const n = inv ? 1 - N.v[i] : N.v[i], a = sm((L - n) / 0.12 + 0.5); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 0; im.data[i * 4 + 3] = Math.round(a * 255); }
    x.putImageData(im, 0, 0); N.masks[key] = cv; return cv;
  }
  let sprite = null;
  function softSprite() { if (sprite) return sprite; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); sprite = c; return c; }
  const tinted = {};
  function tint(rgb) { if (tinted[rgb]) return tinted[rgb]; const s = softSprite(), c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgb(' + rgb + ')'; x.fillRect(0, 0, 64, 64); tinted[rgb] = c; return c; }
  let grainCv = null;
  function grain() { if (grainCv) return grainCv; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), im = x.createImageData(128, 128); for (let i = 0; i < 128 * 128; i++) { const v = Math.random() * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); grainCv = c; return c; }

  const PK = {   // particle kinds: [colour, blend, size px (×unit scale), grow, life s, rise px/s, spread, alpha]
    ink: ['12,8,5', 'source-over', 2.2, 3.2, 1.5, 34, 16, 0.6], ember: ['255,190,110', 'lighter', 0.9, 0.2, 1.1, 46, 18, 0.9],
    form: ['236,204,160', 'lighter', 3, 3.6, 1.1, 14, 10, 0.26], smoke: ['222,192,150', 'screen', 26, 1.8, 8, 7, 7, 0.2],
    dirt: ['12,8,5', 'source-over', 0.9, 0.2, 0.8, 42, 30, 0.9], spark: ['255,220,160', 'lighter', 0.9, 0.3, 1.2, 12, 12, 0.9],
    flour: ['240,226,200', 'screen', 3.4, 2.4, 1.4, 10, 12, 0.35], salt: ['250,240,220', 'lighter', 0.5, 0, 0.6, -60, 3, 0.8],
    smell: ['236,196,140', 'screen', 5, 3.2, 5.5, 10, 6, 0.28], water: ['255,214,170', 'lighter', 0.6, 0, 0.7, -40, 16, 0.75],
    stream: ['255,214,170', 'lighter', 0.8, 0, 0.35, -90, 1.2, 0.8], drip: ['255,214,170', 'lighter', 0.8, 0, 0.5, -70, 0, 0.8],
    dust: ['170,140,105', 'screen', 2.2, 2.6, 1.2, 14, 30, 0.4], bubble: ['200,236,230', 'lighter', 0.9, 0.5, 1.6, 26, 5, 0.55],
    snow: ['240,236,226', 'lighter', 1, 1.2, 0.8, 18, 18, 0.55]
  };

  function Theatre(host, idx, opt) {
    const story = STORIES[((idx % STORIES.length) + STORIES.length) % STORIES.length], B = story.beats, TOT = B.reduce((a, b) => a + b.d, 0);
    const cv = document.createElement('canvas'), ctx = cv.getContext('2d'); cv.className = 'tale-cv'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
    const la = document.createElement('canvas'), lb = document.createElement('canvas');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const S = { W: 0, H: 0, dpr: 1, k: 1, Hs: 100, LH: 0, rtl: !!opt.rtl, t: 0, last: 0, parts: [], motes: [], flash: 0, frozen: false, first: true, on: true, vis: true };
    const g = kit();
    function size() {
      const r = host.getBoundingClientRect(); if (!r.width) return; const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const pad = host.parentElement ? parseFloat(getComputedStyle(host.parentElement).paddingBottom) : 0, Hs = pad > 40 ? pad - 8 : 150;   // the band the page reserved under the words (a clamp() custom property does not resolve in getPropertyValue)
      S.W = r.width; S.H = r.height; S.dpr = dpr; S.Hs = Math.min(Hs, r.height); S.k = S.Hs * 0.84 / 100; S.LH = Math.min(S.H, S.Hs * 1.32);
      cv.width = Math.round(S.W * dpr); cv.height = Math.round(S.H * dpr); la.width = lb.width = cv.width; la.height = lb.height = Math.round(S.LH * dpr);
      if (!S.motes.length) for (let i = 0; i < 26; i++) S.motes.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random(), p: Math.random() * TAU, v: 0.004 + Math.random() * 0.01 });
      S.vig = null;
    }
    const ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(host); size();
    const io = window.IntersectionObserver ? new IntersectionObserver(es => { S.vis = es[0].isIntersecting; }) : null; if (io) io.observe(host);
    function groundPx(h) { return h - S.Hs * 0.12; }
    function worldTx(c, beat, lt, par, h, rim) {   // world → canvas: the beat's own slow camera (pan + push-in), mirrored in Hebrew
      const cam = beat.cam || [0, 0, 1, 1], u = reduce ? 0.5 : cl(lt / beat.d, 0, 1), camX = mix(cam[0], cam[1], u), z = mix(cam[2], cam[3], sm(u)), k = S.k * z, m = S.rtl ? -1 : 1;
      c.setTransform(S.dpr * k * m, 0, 0, -S.dpr * k, S.dpr * (S.W / 2 - m * camX * par * k) - (rim ? S.dpr * 1.25 * m : 0), S.dpr * groundPx(h) - (rim ? S.dpr * 1.25 : 0));
    }
    function skyOf(beat, lt) { const s = beat.sky || WARM, o = beat.skyTo; if (!o) return s; const u = cl(lt / beat.d, 0, 1); return { c: s.c, p: s.p, x: mix(s.x, o.x == null ? s.x : o.x, u), y: mix(s.y, o.y == null ? s.y : o.y, u) }; }
    function drawSky(sk) {
      const c = ctx, W = S.W * S.dpr, H = S.H * S.dpr, gy = S.dpr * groundPx(S.H), k = S.k * S.dpr, m = S.rtl ? -1 : 1;
      const top = c.createLinearGradient(0, 0, 0, H); top.addColorStop(0, '#0b0806'); top.addColorStop(cl((gy - S.Hs * S.dpr * 1.1) / H, 0.05, 0.9), '#100b07'); top.addColorStop(1, 'rgb(' + Math.round(34 + 16 * sk.p) + ',' + Math.round(22 + 9 * sk.p) + ',' + Math.round(13 + 4 * sk.p) + ')');
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = top; c.fillRect(0, 0, W, H);
      const gx = W / 2 + m * sk.x * k, gyy = gy - sk.y * k, R = Math.max(W, S.Hs * S.dpr * 2.2) * 0.72;
      const gr = c.createRadialGradient(gx, gyy, 0, gx, gyy, R); const [r, gg, b] = sk.c; gr.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',' + 0.62 * sk.p + ')'); gr.addColorStop(0.28, 'rgba(' + r + ',' + gg + ',' + b + ',' + 0.28 * sk.p + ')'); gr.addColorStop(1, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(gx, gyy); c.scale(1.35, 0.62); c.translate(-gx, -gyy); c.fillStyle = gr; c.beginPath(); c.arc(gx, gyy, R, 0, TAU); c.fill(); c.restore();
      if (S.flash > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(230,226,220,' + 0.35 * S.flash + ')'; c.fillRect(0, gy - S.Hs * S.dpr * 1.05, W, H); c.restore(); }
    }
    function drawBG(beat, lt, a) {
      if (!beat.bg || a <= 0) return; const c = ctx; c.save(); c.globalAlpha = a; worldTx(c, beat, lt, 0.45, S.H, false); g.use(c); g.pass = 0; g.col = FAR; g.pts = null; g.emitQ = null; g.t = lt;
      if (beat.night) BG.night(g, lt); BG[beat.bg](g, lt, beat.bg === 'sea' ? beat.storm : beat.bg === 'street' ? (beat.night ? 1 : 0.4) : undefined);
      c.restore();
    }
    function drawFG(layer, beat, lt, gone, show) {   // the puppets, into their own layer (full strength), then dissolved by the ink mask
      const c = layer.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, layer.width, layer.height);
      g.use(c); g.t = lt; g.pts = gone > 0 && gone < 1 ? [] : show < 1 ? [] : null; g.emitQ = []; g.flash = 0;
      for (const pass of [0, 1]) { g.pass = pass; g.col = pass ? SIL : RIM; worldTx(c, beat, lt, 1, S.LH, !pass); try { beat.fg(g, lt); } catch (e) { if (!S.err) { S.err = 1; console.error('tale', e); } } }
      c.setTransform(1, 0, 0, 1, 0, 0);
      if (gone > 0) { c.globalCompositeOperation = 'destination-out'; c.drawImage(mask(gone, false), 0, 0, layer.width, layer.height); c.globalCompositeOperation = 'source-over'; }
      if (show < 1) { c.globalCompositeOperation = 'destination-out'; c.drawImage(mask(1 - show, true), 0, 0, layer.width, layer.height); c.globalCompositeOperation = 'source-over'; }
      const top = (S.H - S.LH) * S.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(layer, 0, top);
      if (!reduce) {
        for (const q of g.emitQ) spawn(q[0], q[1], q[2] + top, q[3], q[4]);
        if (g.pts && g.pts.length) { const n = gone > 0 && gone < 1 ? Math.round(170 * S.dt) : Math.round(70 * S.dt); for (let i = 0; i < n; i++) { const j = Math.floor(Math.random() * g.pts.length / 2) * 2; spawn(gone > 0 && gone < 1 ? (Math.random() < 0.28 ? 'ember' : 'ink') : 'form', g.pts[j], g.pts[j + 1] + top, 1, S.k * S.dpr); } }
      }
      S.flash = Math.max(S.flash * 0.9, g.flash);
    }
    function spawn(kind, x, y, n, sc) {
      const K = PK[kind]; if (!K) return; const u = sc || S.k * S.dpr;
      for (let i = 0; i < n && S.parts.length < 420; i++) S.parts.push({ K, x: x + (Math.random() - 0.5) * K[6] * 0.25 * u, y, vx: (Math.random() - 0.5) * K[6] * u * (kind === 'water' || kind === 'dirt' || kind === 'snow' ? 1.6 : 1), vy: -K[5] * u * (0.7 + Math.random() * 0.6), r: K[2] * u * (0.7 + Math.random() * 0.6), life: 0, max: K[4] * (0.7 + Math.random() * 0.6), ph: Math.random() * TAU, grav: kind === 'water' || kind === 'dirt' || kind === 'salt' || kind === 'stream' || kind === 'drip' || kind === 'snow' ? 1 : 0 });
    }
    function drawParts(dt) {
      const c = ctx, W = S.W * S.dpr, H = S.H * S.dpr, gy = S.dpr * groundPx(S.H), band = gy - S.Hs * S.dpr * 0.9;
      if (!reduce && Math.random() < dt * 3.2) spawn('smoke', Math.random() * W, gy - Math.random() * S.Hs * S.dpr * 0.35, 1, S.k * S.dpr);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'screen'; for (let j = 0; j < 3; j++) { const span = W * 1.9, x = ((S.t * (7 + j * 4) * S.k * S.dpr + j * span / 3) % span) - W * 0.45, h = S.Hs * S.dpr * (0.2 + j * 0.05); c.globalAlpha = 0.1; c.drawImage(tint('226,198,160'), x - W * 0.45, gy - h * 0.55, W * 0.9, h); } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      for (let i = S.parts.length - 1; i >= 0; i--) {
        const p = S.parts[i], K = p.K; p.life += dt; if (p.life > p.max) { S.parts.splice(i, 1); continue; }
        p.ph += dt * 2; p.vx += Math.sin(p.ph) * 10 * S.dpr * dt; if (p.grav) p.vy += 150 * S.k * S.dpr * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.grav && p.y > gy + 2 * S.dpr) { p.y = gy + 2 * S.dpr; p.vy *= -0.2; p.vx *= 0.5; }
        const u = p.life / p.max, r = p.r * (1 + K[3] * u); let a = K[7] * Math.sin(Math.PI * Math.min(1, u * 1.15)) ; if (p.y < band) a *= cl(1 - (band - p.y) / (S.Hs * S.dpr * 0.5), 0, 1);
        if (a <= 0.003) continue; c.globalCompositeOperation = K[1]; c.globalAlpha = a; c.drawImage(tint(K[0]), p.x - r, p.y - r, r * 2, r * 2);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
      for (const m of S.motes) { if (!reduce) { m.y -= m.v * dt * 0.6; m.x += Math.sin(S.t * 0.3 + m.p) * 0.002 * dt * 20; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); } } const x = m.x * W, y = m.y * H, inText = y < band, a = (0.25 + 0.35 * Math.sin(S.t * 1.3 + m.p) ** 2) * (inText ? 0.35 : 1); c.globalAlpha = a; const r = m.s * S.dpr * 1.6; c.drawImage(tint('255,200,130'), x - r * 2, y - r * 2, r * 4, r * 4); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    function finish() {
      const c = ctx, W = S.W * S.dpr, H = S.H * S.dpr;
      if (!S.vig) { const v = document.createElement('canvas'); v.width = Math.max(1, Math.round(W / 4)); v.height = Math.max(1, Math.round(H / 4)); const x = v.getContext('2d'), gr = x.createRadialGradient(v.width / 2, v.height * 0.62, Math.min(v.width, v.height) * 0.2, v.width / 2, v.height * 0.62, Math.max(v.width, v.height) * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); x.fillStyle = gr; x.fillRect(0, 0, v.width, v.height); S.vig = v; }
      c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(S.vig, 0, 0, W, H);
      const gp = c.createPattern(grain(), 'repeat'); if (gp) { c.save(); c.globalAlpha = 0.055; c.globalCompositeOperation = 'overlay'; c.translate(-Math.random() * 128, -Math.random() * 128); c.fillStyle = gp; c.fillRect(0, 0, W + 128, H + 128); c.restore(); }
    }
    function active(t) {   // which beats are on stage at time t, and how far each has dissolved / formed
      const tt = ((t % TOT) + TOT) % TOT, loop = Math.floor(t / TOT); let i = 0, T0 = 0; while (i < B.length - 1 && tt >= T0 + B[i].d) { T0 += B[i].d; i++; }
      const lt = tt - T0, out = [], OUT = 0.9;
      if (lt > B[i].d - OUT) { const q = (lt - (B[i].d - OUT)) / TR, nx = (i + 1) % B.length; out.push({ b: B[i], lt, gone: win(q, 0, 0.62), show: 1, bgA: 1 - win(q, 0.2, 0.8) }); out.push({ b: B[nx], lt: lt - B[i].d, gone: 0, show: win(q, 0.38, 1), bgA: win(q, 0.2, 0.8) }); }
      else if (lt < TR - OUT) { const q = (lt + OUT) / TR, pv = (i - 1 + B.length) % B.length, first = loop === 0 && i === 0; if (!first) out.push({ b: B[pv], lt: B[pv].d + lt, gone: win(q, 0, 0.62), show: 1, bgA: 1 - win(q, 0.2, 0.8) }); out.push({ b: B[i], lt, gone: 0, show: win(q, 0.38, 1), bgA: first ? 1 : win(q, 0.2, 0.8) }); }
      else out.push({ b: B[i], lt, gone: 0, show: 1, bgA: 1 });
      return out;
    }
    let raf = 0, was = false;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!host.isConnected) { if (was) return destroy(); return; } was = true;
      if (S.manual || !S.vis || document.hidden || !S.W) { S.last = now; return; }
      if (S.last && now - S.last < 30) return;   // ~30 fps is plenty for paper puppets
      const dt = S.last ? Math.min(0.066, (now - S.last) / 1000) : 0.033; S.last = now; S.dt = dt; if (!S.frozen) S.t += reduce ? dt * 0.8 : dt; g.dt = dt;
      render();
    }
    function render() {
      if (!S.W) size(); if (!S.W) return;
      const on = active(S.t); ctx.setTransform(1, 0, 0, 1, 0, 0);
      let sk = skyOf(on[0].b, on[0].lt); if (on.length > 1) { const s2 = skyOf(on[1].b, on[1].lt), m = on[1].bgA; sk = { c: sk.c.map((v, i) => Math.round(mix(v, s2.c[i], m))), p: mix(sk.p, s2.p, m), x: mix(sk.x, s2.x, m), y: mix(sk.y, s2.y, m) }; }
      drawSky(sk);
      for (const a of on) drawBG(a.b, a.lt, a.bgA * 0.95);
      on.forEach((a, i) => drawFG(i ? lb : la, a.b, a.lt, a.gone, a.show));
      drawParts(S.dt || 0.016); finish();
    }
    function destroy() { cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); S.parts.length = 0; if (window.__tale && window.__tale.S === S) window.__tale = null; }
    raf = requestAnimationFrame(frame);
    const api = { S, restart() { S.t = 0; S.parts.length = 0; }, seek(t) { S.t = t; S.parts.length = 0; S.dt = 1 / 60; render(); }, freeze(v) { S.frozen = v !== false; }, manual(v) { S.manual = v !== false; }, step(dt) { S.dt = g.dt = dt; S.t += dt; render(); }, render, destroy, beats: B.map(b => b.d), total: TOT, story: idx };
    window.__tale = api; return api;
  }

  if (window.customElements && !customElements.get('kq-tale')) customElements.define('kq-tale', class extends HTMLElement {
    connectedCallback() { if (this._th) return; const box = this.parentElement || this; this._th = Theatre(this, +this.dataset.story || 0, { rtl: this.dataset.rtl === '1' }); const sp = document.getElementById('btnSpeak'); if (sp) { this._sp = () => this._th && this._th.restart(); sp.addEventListener('click', this._sp); } }
    disconnectedCallback() { if (this._th) { this._th.destroy(); this._th = null; } const sp = document.getElementById('btnSpeak'); if (sp && this._sp) sp.removeEventListener('click', this._sp); }
  });
  window.KQTale = { count: STORIES.length, Theatre };
})();
