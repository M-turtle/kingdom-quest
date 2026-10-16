/* Kingdom Quest — Penalty Kick, the sports game of the Games Arcade (shared/arcade.js). Angles as the aim: a protractor lies on the grass
   in front of the ball, 0° straight at the goal, degrees counted to the left and to the right. The keeper can cover every spot but one;
   the coach calls where that gap is and you turn the arrow there — the arrow shows no number: you read the protractor — and shoot.
   Anywhere else, the keeper saves it. The calls grow with the child: tens with every tick numbered (4–5), fives (6–7), a sum or a
   difference to work out first (8–10), a range where any angle inside scores (11–12), and a half or a double of a given angle (13–15). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2, D2R = PI / 180;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o || {}));
  const pick = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const t = (k, p) => KQ.t(k, p);
  const deg = v => '\u200E' + v + '°\u200E';   /* '10°' stays in order inside Hebrew */
  const ex = (x, op, y) => '\u200E' + x + '°\u00A0' + op + '\u00A0' + y + '°\u200E';   /* '20° + 5°' stays left-to-right and on one line inside Hebrew */
  const MAXA = 40, GD = 11;   /* the posts are 40° either side; the goal line is GD in front of the ball */

  const THEMES = {
    gm_pitch: { palette: { noFloor: true, sky: 0x7ac0ff, ground: 0x3a8a3a, fog: 0xcfe8ff, wall: ['plank', '#3a8a3a', '#2a7a2a'], floor: ['plank', '#3a8a3a', '#2a7a2a'], hemi: [0xeaf6ff, 0x2a5a2a], key: 0xfff8e8, dust: { c: 0xffffff, n: 8, mode: 'drift' } },
      look: { keyC: 0xfff8e8, grade: 'sky', exposure: 1.05, fogD: 0.008, rim: 0xffffff, face: 0x10202a, accent: '#e8f4ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { scene } = c; KQRealms.hall.skyDome(c, 0x2a78e0, 0xd8eeff);
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const g = cv.getContext('2d'); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#4aa04a' : '#3f943f'; g.fillRect(0, i * 32, 512, 32); } const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(3, 3);
        const grass = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshStandardMaterial({ map: tx, roughness: 0.95 })); grass.rotation.x = -PI / 2; grass.position.set(0, 0, -10); grass.receiveShadow = true; scene.add(grass);
        const line = M(0xffffff, { roughness: 0.6 }); const L = (w, d, x, z) => { const m = new T.Mesh(new T.BoxGeometry(w, 0.02, d), line); m.position.set(x, 0.01, z); scene.add(m); };
        L(30, 0.12, 0, -GD); L(16, 0.12, 0, -GD + 6.5); L(0.12, 6.5, -8, -GD + 3.25); L(0.12, 6.5, 8, -GD + 3.25);   /* goal line and the box */
        /* the stands with a crowd of dots and flags */
        const stand = new T.Mesh(new T.BoxGeometry(60, 6, 4), M(0x5a6a8a)); stand.position.set(0, 3, -GD - 12); scene.add(stand); for (let i = 0; i < 300; i++) { const s = c.sprite(pick([0xff5a5a, 0xffd84a, 0x5ab8ff, 0xffffff, 0x8aff7a]), 0.5, (Math.random() - 0.5) * 58, 1 + Math.random() * 5, -GD - 9.8, null, 0.9); void s; }
        for (let i = 0; i < 8; i++) { const f = new T.Mesh(new T.PlaneGeometry(1.2, 0.7), M(pick([0xd8343a, 0x3a8ae0, 0xffd84a]), { side: T.DoubleSide })); f.position.set(-24 + i * 7, 7, -GD - 10); scene.add(f); const k = i; c.updaters.push((dt, tm) => { f.rotation.y = Math.sin(tm * 3 + k) * 0.3; }); }
      } }
  };

  /* ---------------------------------------------------------------- the coach's calls */
  function callFor(b, i) {
    const side = pick([-1, 1]);
    if (b <= 1) { const a = pick([10, 20, 30]); return { lo: a, hi: a, side, step: 10, lab: 10, key: 'pk_at', p: { a: deg(a) } }; }
    if (b === 2) { const a = pick([10, 20, 30, 40]); return { lo: a, hi: a, side, step: 5, lab: 10, key: 'pk_at', p: { a: deg(a) } }; }
    if (b === 3) { const a = pick([5, 15, 25, 35, 20, 30]); return { lo: a, hi: a, side, step: 5, lab: 10, key: 'pk_at', p: { a: deg(a) } }; }
    if (b === 4) { const a = pick([15, 20, 25, 30, 35]), x = pick([5, 10, 15].filter(v => v < a)); return i % 2 ? { lo: a, hi: a, side, step: 5, lab: 10, key: 'pk_calc', p: { e: ex(x, '+', a - x) } } : { lo: a, hi: a, side, step: 5, lab: 10, key: 'pk_calc', p: { e: ex(a + 10, '−', 10) } }; }
    if (b === 5) { const lo = pick([10, 15, 20, 25]), hi = lo + pick([5, 10]); return { lo, hi, side, step: 5, lab: 10, key: 'pk_range', p: { lo: deg(lo), hi: deg(hi) } }; }
    const a = pick([10, 15, 20]); return i % 2 ? { lo: a, hi: a, side, step: 5, lab: 10, key: 'pk_half', p: { x: deg(a * 2) } } : { lo: a * 2 > 40 ? a : a * 2, hi: a * 2 > 40 ? a : a * 2, side, step: 5, lab: 10, key: a * 2 > 40 ? 'pk_at' : 'pk_dbl', p: a * 2 > 40 ? { a: deg(a) } : { x: deg(a) } };
  }

  const STAGES = {
    gm_kick(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2, aim: 0, aiming: false, hold: false };
      /* the goal: posts, crossbar, a net */
      const white = M(0xffffff, { roughness: 0.35, metalness: 0.2 }), gw = 2 * GD * Math.tan(MAXA * D2R), gh = 3.4;
      const goal = new T.Group(); goal.position.z = -GD; scene.add(goal); for (const x of [-gw / 2, gw / 2]) { const p = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, gh, 12), white); p.position.set(x, gh / 2, 0); goal.add(p); } const bar = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, gw, 12), white); bar.rotation.z = PI / 2; bar.position.y = gh; goal.add(bar);
      const netC = document.createElement('canvas'); netC.width = netC.height = 64; { const g = netC.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; for (let i = 0; i <= 64; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); } } const nt = new T.CanvasTexture(netC); nt.wrapS = nt.wrapT = T.RepeatWrapping; nt.repeat.set(gw * 2, gh * 2);
      const net = new T.Mesh(new T.PlaneGeometry(gw, gh), new T.MeshBasicMaterial({ map: nt, transparent: true, side: T.DoubleSide, depthWrite: false })); net.position.set(0, gh / 2, -1.6); goal.add(net);
      /* the keeper: gloves, a jersey, a friendly face */
      const keeper = new T.Group(); { const body = new T.Mesh(new T.CapsuleGeometry(0.42, 0.9, 8, 16), M(0xffc83a)); body.position.y = 1.2; keeper.add(body); const head = new T.Mesh(new T.SphereGeometry(0.36, 18, 12), M(0xf0c8a0)); head.position.y = 2.15; keeper.add(head); for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), M(0x1a1010)); e.position.set(s * 0.13, 2.2, 0.32); keeper.add(e); }
        const arms = []; for (const s of [-1, 1]) { const a = new T.Group(); a.position.set(s * 0.45, 1.6, 0); const arm = new T.Mesh(new T.CapsuleGeometry(0.12, 0.7, 6, 10), M(0xffc83a)); arm.position.y = -0.4; a.add(arm); const glove = new T.Mesh(new T.SphereGeometry(0.2, 12, 10), M(0x3ab87a)); glove.position.y = -0.85; a.add(glove); a.rotation.z = s * 0.5; keeper.add(a); arms.push(a); }
        for (const s of [-1, 1]) { const l = new T.Mesh(new T.CapsuleGeometry(0.14, 0.6, 6, 10), M(0x2a2a3a)); l.position.set(s * 0.2, 0.45, 0); keeper.add(l); } keeper.userData.arms = arms; keeper.position.set(0, 0, -GD + 0.4); scene.add(keeper); }
      /* the ball, the aim arrow, the protractor on the grass */
      const ballC = document.createElement('canvas'); ballC.width = 256; ballC.height = 128; { const g = ballC.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 10; i++) { const x = (i % 5) * 52 + 26 + (i > 4 ? 26 : 0), y = i > 4 ? 90 : 36; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); } g.fill(); } }
      const bt = new T.CanvasTexture(ballC); bt.colorSpace = T.SRGBColorSpace; const ball = new T.Mesh(new T.SphereGeometry(0.34, 28, 20), new T.MeshStandardMaterial({ map: bt, roughness: 0.45 })); ball.position.set(0, 0.34, 0); ball.castShadow = true; scene.add(ball);
      const prot = new T.Group(); scene.add(prot); const tabs = [];
      const arrow = new T.Group(); { const red = new T.MeshBasicMaterial({ color: 0xff2a4a }); const shaft = new T.Mesh(new T.BoxGeometry(0.14, 0.04, 4.4), red); shaft.position.z = -2.6; arrow.add(shaft); const head = new T.Mesh(new T.ConeGeometry(0.38, 0.8, 12), red); head.rotation.x = -PI / 2; head.position.z = -5.1; arrow.add(head); } arrow.position.y = 0.05; scene.add(arrow);
      const setAim = a => { S.aim = a; arrow.rotation.y = -a * D2R; };
      function buildProt(C) { for (const tb of tabs.splice(0)) tb.userData.tablet.dispose(); while (prot.children.length) prot.remove(prot.children[0]); const R = 4.4, tick = new T.MeshBasicMaterial({ color: 0xffffff }), strong = new T.MeshBasicMaterial({ color: 0xffe08a });
        const arc = new T.Mesh(new T.RingGeometry(R - 0.05, R + 0.05, 64, 1, PI / 2 - MAXA * D2R, 2 * MAXA * D2R), tick); arc.rotation.x = -PI / 2; arc.position.y = 0.02; prot.add(arc);
        for (let a = -MAXA; a <= MAXA; a += C.step) { const big = a % C.lab === 0, len = big ? 0.7 : 0.4, m = new T.Mesh(new T.BoxGeometry(big ? 0.1 : 0.07, 0.02, len), big ? strong : tick); const r = R + len / 2; m.position.set(Math.sin(a * D2R) * r, 0.03, -Math.cos(a * D2R) * r); m.rotation.y = -a * D2R; prot.add(m);
          if (big && (S.band <= 3 || a === 0 || Math.abs(a) === MAXA) && (!K.narrow() || a % 20 === 0)) { const tb = c.label(String(Math.abs(a)) + '°', -1, K.narrow() ? 0.62 : 0.52); tb.position.set(Math.sin(a * D2R) * (R + 1.1), 0.4, -Math.cos(a * D2R) * (R + 1.1)); c.faceCam(tb); prot.add(tb); tabs.push(tb); } }
        for (const s of [-1, 1]) { const tb = c.label(t(s < 0 ? 'pk_left' : 'pk_right'), -1, 0.5); tb.position.set(s * (K.narrow() ? 2.2 : R + 1.6), 0.4, K.narrow() ? 1.6 : 0.4); c.faceCam(tb); prot.add(tb); tabs.push(tb); } }
      K.pointer = { down(e) { if (!S.aiming) return false; S.hold = true; aimFrom(e); return true; }, move(e) { if (S.hold) aimFrom(e); }, up() { S.hold = false; }, cursor: () => S.aiming ? (S.hold ? 'grabbing' : 'grab') : 'default' };
      function aimFrom(e) { const p = K.onPlane(e, 0); if (!p) return; let a = Math.atan2(p.x, -p.z) / D2R; a = Math.max(-MAXA, Math.min(MAXA, Math.round(a / S.C.step) * S.C.step)); if (a !== S.aim) { setAim(a); K.sfx('tick'); } K.ready(); }
      async function shoot() { const a = S.aim, dir = new T.Vector3(Math.sin(a * D2R), 0, -Math.cos(a * D2R)), dist = GD / Math.cos(a * D2R), to = dir.clone().multiplyScalar(dist).setY(1.1);
        const want = S.C.side * S.C.lo, ok = a * S.C.side >= S.C.lo - 1e-6 && a * S.C.side <= S.C.hi + 1e-6 && Math.sign(a) === S.C.side;
        const diveTo = ok ? -Math.sign(a || 1) * 2.2 : Math.max(-gw / 2 + 0.6, Math.min(gw / 2 - 0.6, to.x)), from = ball.position.clone();
        c.tween(0.55, k => { keeper.position.x = diveTo * k; keeper.rotation.z = -Math.sign(diveTo || 1) * 1.1 * k; keeper.position.y = Math.sin(k * PI) * 0.6; });
        await K.anim(0.6, k => { ball.position.lerpVectors(from, ok ? to : to.clone().multiplyScalar(0.94), k); ball.position.y = 0.34 + Math.sin(k * PI * 0.8) * 1.2; ball.rotation.x -= 0.4; });
        if (!ok) { await K.anim(0.4, k => { ball.position.z += 0.08; ball.position.y = Math.max(0.34, ball.position.y - 0.05); }); }
        else { net.position.z = -1.6 - 0.3; c.burst(to.clone(), 0xffe08a, 18); await K.wait(0.3); net.position.z = -1.6; }
        void want; return ok; }
      function reset() { ball.position.set(0, 0.34, 0); keeper.position.set(0, 0, -GD + 0.4); keeper.rotation.z = 0; setAim(0); }
      c.updaters.push((dt, tm) => { if (!S.shooting) { keeper.position.x = Math.sin(tm * 1.4) * 0.5; for (const [i, a] of keeper.userData.arms.entries()) a.rotation.z = (i ? 1 : -1) * (0.5 + Math.sin(tm * 3) * 0.15); } });
      async function round(i, n, kick) { const C = callFor(S.band, i); S.C = C; reset(); buildProt(C); const sideW = t(C.side < 0 ? 'pk_leftW' : 'pk_rightW'), call = t(C.key, Object.assign({ s: sideW }, C.p));
        K.tell(kick, call); K.hint(() => K.tell(kick, t('pk_hint', { s: sideW }))); let tries = 0;
        for (;;) { S.aiming = true; await K.act(t('pk_shoot'), { wait: true }); S.aiming = false; if (!K.alive()) return null; tries++; S.shooting = true; const ok = await shoot(); S.shooting = false;
          if (ok) { K.sfx('correct'); K.tell(kick, t('pk_goal')); await K.wait(1.2); K.hint(null); return tries === 1 ? 1 : tries === 2 ? 2 : 3; }
          K.sfx('wrong'); const got = Math.abs(S.aim), gs = t(S.aim < 0 ? 'pk_leftW' : S.aim > 0 ? 'pk_rightW' : 'pk_mid'); K.tell(kick, t('pk_saved', { a: deg(got), s: gs }) + ' ' + call); await K.wait(1.4); reset(); if (tries >= 3) { const a = C.side * C.lo; setAim(a); K.tell(kick, t('pk_show', { a: deg(C.lo), s: sideW })); await K.wait(1.2); S.shooting = true; await shoot(); S.shooting = false; await K.wait(0.8); K.hint(null); return 0; } } }
      function frame(a) { return a < 1.05 ? { pos: [0, 9.6, 8.2], look: [0, 0.2, -3.4], fov: 64 } : { pos: [0, 6.8, 6.4], look: [0, 0.4, -4.0], fov: 52 }; }   /* the protractor large in the foreground, the goal behind */
      async function play(api) { K.mount(api); S.band = Math.max(1, Math.min(6, api.band || 2)); window.__kick = { S, setAim }; const N = 5, done = []; let pts = 0; api.pips(N, done);
        const nm = t('ag_kick'); await K.intro(async () => { K.tell(nm, t('pk_hi')); await K.act(t('pk_start')); }); if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const r = await round(i, N, t('pk_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 6 : r === 3 ? 3 : 0; done.push(r === 1); api.pips(N, done); }
        const right = done.filter(Boolean).length; K.tell(nm, t('pk_win', { n: right })); await K.wait(1.4);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('pk_win', { n: right }) }); }
      function dispose() { K.dispose(); for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  const STR = {
    en: { pk_hi: 'Penalty! The keeper can reach every spot but one. The coach tells you the angle of the gap. Drag the red arrow to that angle on the protractor and shoot.', pk_start: 'Kick off', pk_n: 'Kick {i} of {n}', pk_left: '← left', pk_right: 'right →', pk_leftW: 'to the left', pk_rightW: 'to the right', pk_mid: 'straight ahead',
      pk_at: 'Coach: the gap is at {a} {s}!', pk_calc: 'Coach: the gap is at {e} {s}!', pk_range: 'Coach: the keeper cannot reach anywhere from {lo} to {hi} {s}!', pk_half: 'Coach: the gap is at half of {x} {s}!', pk_dbl: 'Coach: the gap is at double {x} {s}!',
      pk_shoot: 'Shoot!', pk_goal: 'GOAL!', pk_saved: 'Saved! You kicked {a} {s}.', pk_show: 'The gap was {a} {s}. Watch!', pk_hint: 'Count the degrees from 0 in the middle, {s}. Every mark is one step.', pk_win: '{n} of 5 first-time goals. What a match!' },
    he: { pk_hi: 'פנדל! השוער מגיע לכל מקום חוץ ממקום אחד. המאמן אומר את הזווית של הפרצה. גוררים את החץ האדום לזווית הזאת במד הזווית ובועטים.', pk_start: 'פותחים', pk_n: 'בעיטה {i} מתוך {n}', pk_left: '← שמאלה', pk_right: 'ימינה →', pk_leftW: 'שמאלה', pk_rightW: 'ימינה', pk_mid: 'ישר קדימה',
      pk_at: 'המאמן: הפרצה ב־{a} {s}!', pk_calc: 'המאמן: הפרצה ב־{e} {s}!', pk_range: 'המאמן: השוער לא מגיע לשום מקום בין {lo} ל־{hi} {s}!', pk_half: 'המאמן: הפרצה בחצי מ־{x} {s}!', pk_dbl: 'המאמן: הפרצה ב־{x} כפול 2 {s}!',
      pk_shoot: 'בועטים!', pk_goal: 'גול!', pk_saved: 'הציל! בעטתם {a} {s}.', pk_show: 'הפרצה הייתה ב־{a} {s}. צפו!', pk_hint: 'סופרים מעלות מה־0 שבאמצע, {s}. כל סימון הוא צעד.', pk_win: '{n} מתוך 5 גולים בניסיון הראשון. איזה משחק!' }
  };
  KQRealms.define('game-kick', { strings: STR, themes: THEMES, stages: STAGES });
})();
