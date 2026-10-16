/* Kingdom Quest — Bridge Builder, a game of the Games Arcade (shared/arcade.js). Adding as building: a gap opens between two cliffs and
   the cart must cross. The planks on the tray each have a length; lay them end to end so they add up to EXACTLY the gap — too short and
   the cart stops at the edge, too long and the last plank sticks out past the far cliff and will not sit. The measure along the cliff
   helps the youngest count; the numbers grow with the child: small counts (4–5), within 10 and 20 (6–8), tens and fives (9–10),
   decimals (11–12) and fractions of a metre (13–15). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2, { fmtNum } = KQKit;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o || {}));
  const pick = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const t = (k, p) => KQ.t(k, p);

  const THEMES = {
    gm_skybridge: { palette: { noFloor: true, sky: 0x9ad4ff, ground: 0x6a8a4a, fog: 0xcfe8ff, wall: ['plank', '#8a6a4a', '#7a5a3a'], floor: ['plank', '#6a8a4a', '#5a7a3a'], hemi: [0xeaf6ff, 0x5a7a4a], key: 0xfff4e0, dust: { c: 0xffffff, n: 10, mode: 'drift' } },
      look: { keyC: 0xfff0d8, grade: 'sky', exposure: 1.05, fogD: 0.01, rim: 0xffe0b0, face: 0x2a1a10, accent: '#ffe7a8', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { scene } = c; KQRealms.hall.skyDome(c, 0x3a8ae0, 0xd8eeff);
        /* a sea of clouds far below and floating islets in the distance */
        const cm = M(0xffffff, { roughness: 1, emissive: 0x777777, emissiveIntensity: 0.35 });
        for (let i = 0; i < 24; i++) { const g = new T.Group(); for (let j = 0; j < 4; j++) { const s = new T.Mesh(new T.SphereGeometry(1.6 + Math.random() * 1.8, 10, 8), cm); s.position.set(j * 2 - 3 + Math.random(), Math.random() * 0.6, Math.random() * 1.4); s.scale.y = 0.5; g.add(s); } g.position.set((Math.random() - 0.5) * 70, -9 - Math.random() * 5, -8 - Math.random() * 30); scene.add(g); const k = Math.random() * 6; c.updaters.push((dt, tm) => { g.position.x += dt * 0.25; if (g.position.x > 36) g.position.x = -36; }); void k; }
        for (const [x, y, z, s] of [[-18, 3, -26, 1.3], [16, 5, -30, 1.6], [26, -1, -18, 1.0]]) { const isl = new T.Mesh(new T.ConeGeometry(3 * s, 4 * s, 9), M(0x8a7a6a, { flatShading: true })); isl.rotation.x = PI; isl.position.set(x, y, z); scene.add(isl); const top = new T.Mesh(new T.CylinderGeometry(3 * s, 3 * s, 0.6 * s, 18), M(0x6fbf4a)); top.position.set(x, y + 2.2 * s, z); scene.add(top); }
      } }
  };

  /* ---------------------------------------------------------------- the gaps, band by band: a solution of whole planks plus planks that do not fit */
  function gapFor(b) {
    if (b <= 1) { const T0 = ri(3, 5), a = ri(1, T0 - 1); return { T: T0, sol: [a, T0 - a], pool: [1, 2, 3, 4], unit: 1, lab: 1 }; }
    if (b === 2) { const T0 = ri(6, 10), a = ri(2, T0 - 2); return { T: T0, sol: [a, T0 - a], pool: [2, 3, 4, 5, 6, 7], unit: 1, lab: 5 }; }
    if (b === 3) { const T0 = ri(12, 20), a = ri(3, 8), c = ri(3, Math.min(9, T0 - a - 3)); return { T: T0, sol: [a, c, T0 - a - c], pool: [3, 4, 5, 6, 7, 8, 9], unit: 1, lab: 5 }; }
    if (b === 4) { const T0 = pick([40, 50, 60, 70, 80, 90]), a = pick([10, 15, 20, 25, 30]), c = T0 - a; return { T: T0, sol: c > 40 ? [a, 20, c - 20] : [a, c], pool: [5, 10, 15, 20, 25, 30, 35, 40], unit: 5, lab: 10 }; }
    if (b === 5) { const a = pick([0.5, 1.25, 1.5, 0.75]), c = pick([1, 1.5, 2.25, 0.25]), d = pick([0.5, 1, 1.75]); return { T: +(a + c + d).toFixed(2), sol: [a, c, d], pool: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25], unit: 0.25, lab: 1, dp: true }; }
    const a = pick([0.5, 0.25, 0.75]), c = pick([0.125, 0.375, 0.25, 0.5]), d = pick([0.5, 0.625, 0.875]); return { T: a + c + d, sol: [a, c, d], pool: [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], unit: 0.125, lab: 1, den: 8 };
  }
  const VULGAR = { '1/2': '½', '1/4': '¼', '3/4': '¾', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
  /* mixed numbers as one group — 2⅛, not 17/8 — kept in reading order inside Hebrew */
  const fmt = (v, G) => { if (G.den) { const w = Math.floor(v + 1e-6), f = v - w; if (w >= 1 && f > 1e-6) { const fr = fmtNum(f, { den: G.den }); return '\u200E' + w + (VULGAR[fr] || '\u00A0' + fr) + '\u200E'; } } return fmtNum(v, G.den ? { den: G.den } : null); };

  const STAGES = {
    gm_bridge(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2, G: null, laid: [], cartOn: false };
      const W = () => K.narrow() ? 5.4 : 11.5;   /* how wide the gap is drawn */
      let U = 1, X0 = 0;   /* world units per number unit; the left cliff edge */
      /* the cliffs, the measure along the near edge, the cart */
      const rock = M(0x9a8a74, { flatShading: true, roughness: 0.95 }), grass = M(0x6fbf4a, { roughness: 0.9 });
      const cliffL = new T.Group(), cliffR = new T.Group(); scene.add(cliffL, cliffR);
      for (const [g, sd] of [[cliffL, -1], [cliffR, 1]]) { const body = new T.Mesh(new T.CylinderGeometry(3.2, 1.6, 9, 9), rock); body.position.set(sd * 3.2, -4.4, 0); g.add(body); const top = new T.Mesh(new T.BoxGeometry(6.4, 0.5, 3.2), grass); top.position.set(sd * 3.2, 0.05, 0); g.add(top); for (let i = 0; i < 3; i++) { const tr = new T.Mesh(new T.ConeGeometry(0.5, 1.4, 7), M(0x3a8a4a)); tr.position.set(sd * (2.2 + i * 1.2), 0.9, -0.8 + (i % 2) * 0.4); g.add(tr); } }
      const measure = new T.Group(); scene.add(measure); const tabs = [];
      const woodM = [M(0xb8864a, { roughness: 0.7 }), M(0xa87a42, { roughness: 0.7 }), M(0xc89458, { roughness: 0.7 })];
      const deck = new T.Group(); scene.add(deck);
      const cart = new T.Group(); { const box = new T.Mesh(new T.BoxGeometry(1.3, 0.7, 0.9), M(0xd8343a, { roughness: 0.5 })); box.position.y = 0.65; cart.add(box); const trim = new T.Mesh(new T.BoxGeometry(1.36, 0.12, 0.96), M(0xe8b64a, { metalness: 0.7, roughness: 0.3 })); trim.position.y = 1.0; cart.add(trim);
        const wheels = []; for (const x of [-0.42, 0.42]) for (const z of [-0.48, 0.48]) { const w = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.12, 16), M(0x3a2a1a)); w.rotation.x = PI / 2; w.position.set(x, 0.26, z); cart.add(w); wheels.push(w); }
        const rider = new T.Mesh(new T.SphereGeometry(0.34, 20, 14), M(0xffd8a8)); rider.position.set(0, 1.35, 0); cart.add(rider); for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), M(0x1a1010)); e.position.set(s * 0.12, 1.42, 0.3); cart.add(e); }
        const flag = new T.Mesh(new T.PlaneGeometry(0.5, 0.32), M(0x3a8ae0, { side: T.DoubleSide })); flag.position.set(-0.45, 1.6, 0); cart.add(flag); const pole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.9, 5), M(0x6a4a2a)); pole.position.set(-0.7, 1.35, 0); cart.add(pole);
        cart.userData.wheels = wheels; scene.add(cart); }
      function layout() { const G = S.G, w = W(); U = w / G.T; X0 = -w / 2; cliffL.position.x = X0; cliffR.position.x = X0 + G.T * U;
        for (const tb of tabs.splice(0)) tb.userData.tablet.dispose(); while (measure.children.length) measure.remove(measure.children[0]);
        const tick = M(0x2a1a10); for (let v = 0; v <= G.T + 1e-6; v = +(v + G.unit).toFixed(4)) { const big = Math.abs(v / G.lab - Math.round(v / G.lab)) < 1e-6 || v === 0 || Math.abs(v - G.T) < 1e-6; const m = new T.Mesh(new T.BoxGeometry(0.05, big ? 0.5 : 0.28, 0.05), tick); m.position.set(X0 + v * U, big ? -0.35 : -0.25, 1.62); measure.add(m); }
        const bar = new T.Mesh(new T.BoxGeometry(G.T * U, 0.06, 0.06), M(0xffe7a8, { emissive: 0x6a5a20 })); bar.position.set(X0 + G.T * U / 2, -0.12, 1.62); measure.add(bar);
        for (const v of [0, G.T]) { const tb = c.label(fmt(v, G), -1, K.narrow() ? 0.6 : 0.55); tb.position.set(X0 + v * U, -1.0, 1.8); measure.add(tb); tabs.push(tb); }
        if (S.band <= 2) for (let v = G.lab; v < G.T - 1e-6; v += G.lab) { const tb = c.label(fmt(v, G), -1, 0.42); tb.position.set(X0 + v * U, -0.95, 1.8); measure.add(tb); tabs.push(tb); }
        cart.position.set(X0 - 2.4, 0.3, 0); cart.rotation.y = 0; }
      const laidLen = () => S.laid.reduce((s, p) => s + p.v, 0);
      function plank(v) { const g = new T.Group(), len = v * U, m = new T.Mesh(new T.BoxGeometry(Math.max(0.05, len - 0.04), 0.18, 1.6), woodM[S.laid.length % 3]); m.position.x = len / 2; g.add(m);
        for (const x of [0.12, len - 0.12]) { const n = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.02, 8), M(0x3a3a40, { metalness: 0.8 })); n.position.set(x, 0.1, 0); g.add(n); }
        const tb = c.label(fmt(v, S.G), -1, K.narrow() ? 0.55 : 0.5); tb.position.set(len / 2, 0.6, 0.9); g.add(tb); tabs.push(tb); g.userData = { v, tb }; return g; }
      async function lay(v, btn) { if (S.cartOn) return; btn.classList.add('used'); const p = plank(v); const at = X0 + laidLen() * U; p.position.set(at, 3.5, 2); deck.add(p); S.laid.push({ v, g: p, btn }); K.sfx('tap'); await K.anim(0.35, k => { p.position.set(at, 3.5 - 3.5 * K.ease(k), 2 - 2 * K.ease(k)); }); p.position.set(at, 0, 0);
        if (laidLen() > S.G.T + 1e-6) { const over = laidLen() - S.G.T; p.rotation.z = -0.05; K.tell(S.kick, t('bb_over', { n: fmt(over, S.G) })); } else K.tell(S.kick, t('bb_sofar', { n: fmt(laidLen(), S.G), g: fmt(S.G.T, S.G) })); K.ready(); }
      function unlay() { if (S.cartOn) return; const p = S.laid.pop(); if (!p) return; deck.remove(p.g); p.btn.classList.remove('used'); K.sfx('tap'); K.tell(S.kick, S.laid.length ? t('bb_sofar', { n: fmt(laidLen(), S.G), g: fmt(S.G.T, S.G) }) : t('bb_task', { g: fmt(S.G.T, S.G) })); }
      async function drive(to, dur) { const a = cart.position.x; await K.anim(dur, k => { cart.position.x = a + (to - a) * K.ease(k); for (const w of cart.userData.wheels) w.rotation.y = cart.position.x * 3; cart.position.y = 0.3 + Math.abs(Math.sin(k * 30)) * 0.03; }); }
      async function bridge(i, n, kick) { S.kick = kick; S.G = gapFor(S.band); for (const p of S.laid) deck.remove(p.g); S.laid = []; layout();
        const G = S.G, tiles = shuffle(G.sol.concat(shuffle(G.pool.filter(v => !G.sol.includes(v))).slice(0, S.band <= 1 ? 2 : 3)));
        K.tell(kick, t('bb_task', { g: fmt(G.T, G) })); K.hint(() => K.tell(kick, t('bb_hint', { g: fmt(G.T, G), a: fmt(G.sol[0], G), r: fmt(G.T - G.sol[0], G) })));
        let tries = 0;
        for (;;) { const btns = K.tray(tiles.map(v => ({ text: fmt(v, G) })).concat([{ text: '↶', label: t('bb_undo') }]), (j, btn) => { if (j === tiles.length) unlay(); else if (!btn.classList.contains('used')) lay(tiles[j], btn); });
          for (const p of S.laid) { const j = tiles.findIndex((v, jj) => v === p.v && !btns[jj].classList.contains('used')); if (j >= 0) { btns[j].classList.add('used'); p.btn = btns[j]; } }
          await K.act(t('bb_go'), { wait: !S.laid.length }); if (!K.alive()) return null; tries++; S.cartOn = true; K.tray(null);
          const len = laidLen(), diff = +(G.T - len).toFixed(4);
          if (Math.abs(diff) < 1e-6) { K.tell(kick, t('bb_yes', { g: fmt(G.T, G) })); await drive(X0 + G.T * U + 2.2, 2.4); K.sfx('correct'); c.burst(cart.position.clone().add(new T.Vector3(0, 1.4, 0)), 0xffe08a, 16); await K.wait(0.6); S.cartOn = false; K.hint(null); return tries === 1 ? 1 : tries === 2 ? 2 : 3; }
          if (diff > 0) { await drive(X0 + len * U - 0.7, 1.6); K.sfx('wrong'); await K.anim(0.5, k => { cart.rotation.z = Math.sin(k * PI * 4) * 0.08; }); cart.rotation.z = 0; K.tell(kick, t('bb_short', { n: fmt(len, G), g: fmt(G.T, G), d: fmt(diff, G) })); await drive(X0 - 2.4, 1.2); }
          else { K.sfx('wrong'); const last = S.laid[S.laid.length - 1]; if (last) await K.anim(0.6, k => { last.g.rotation.z = -Math.sin(k * PI * 3) * 0.12; }); K.tell(kick, t('bb_long', { n: fmt(len, G), g: fmt(G.T, G), d: fmt(-diff, G) })); }
          S.cartOn = false; await K.wait(0.4); }
      }
      function frame(a) { return a < 1.05 ? { pos: [0, 2.6, 19.5], look: [0, -0.4, 0], fov: 52 } : { pos: [0, 2.6, 14], look: [0, 0, 0], fov: 46 }; }
      async function play(api) { K.mount(api); S.band = Math.max(1, Math.min(6, api.band || 2)); window.__bridge = { S }; const N = 5, done = []; let pts = 0; api.pips(N, done); S.G = gapFor(S.band); layout();
        const nm = t('ag_bridge'); await K.intro(async () => { K.tell(nm, t('bb_hi')); await K.act(t('bb_start')); }); if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const r = await bridge(i, N, t('bb_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 6 : 3; done.push(r === 1); api.pips(N, done); }
        const right = done.filter(Boolean).length; K.tell(nm, t('bb_win')); await K.wait(1.4);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('bb_win') }); }
      function dispose() { K.dispose(); for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  const STR = {
    en: { bb_hi: 'The cart must cross the canyon! Lay planks end to end. Together they must be exactly as long as the gap: not shorter, not longer.', bb_start: 'Build!', bb_n: 'Bridge {i} of {n}',
      bb_task: 'The gap is {g} long. Tap the planks to lay them, then send the cart.', bb_sofar: 'The bridge is {n} so far. The gap is {g}.', bb_over: 'Too long: this plank sticks out by {n}. Take one back with ↶.',
      bb_go: 'Send the cart', bb_undo: 'Take back the last plank', bb_yes: 'Exactly {g}! Off it goes!', bb_short: 'The bridge is {n} but the gap is {g}: {d} short. The cart stopped at the edge.', bb_long: 'The bridge is {n} but the gap is {g}: {d} too long. The last plank will not sit.',
      bb_hint: 'The gap is {g}. If one plank is {a}, the others must make {r}.', bb_win: 'Five bridges, five safe crossings!' },
    he: { bb_hi: 'העגלה צריכה לחצות את הקניון! מניחים קרשים זה אחרי זה. יחד הם צריכים להיות בדיוק באורך הפער: לא קצרים יותר ולא ארוכים יותר.', bb_start: 'בונים!', bb_n: 'גשר {i} מתוך {n}',
      bb_task: 'הפער באורך {g}. נוגעים בקרשים כדי להניח אותם, ואז שולחים את העגלה.', bb_sofar: 'הגשר באורך {n} עד עכשיו. הפער {g}.', bb_over: 'ארוך מדי: הקרש הזה בולט ב־{n}. מחזירים אחד עם ↶.',
      bb_go: 'שולחים את העגלה', bb_undo: 'מחזירים את הקרש האחרון', bb_yes: 'בדיוק {g}! יוצאים לדרך!', bb_short: 'הגשר באורך {n} אבל הפער {g}: חסר {d}. העגלה נעצרה בקצה.', bb_long: 'הגשר באורך {n} אבל הפער {g}: ארוך מדי ב־{d}. הקרש האחרון לא נכנס.',
      bb_hint: 'הפער {g}. אם קרש אחד באורך {a}, השאר צריכים להשלים {r}.', bb_win: 'חמישה גשרים, חמש חציות בטוחות!' }
  };
  KQRealms.define('game-bridge', { strings: STR, themes: THEMES, stages: STAGES });
})();
