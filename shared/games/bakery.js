/* Kingdom Quest — Potion Bakery, a game of the Games Arcade (shared/arcade.js). Fractions as measuring: every order needs an exact amount
   of glowing potion flour in the mixing jug. The measuring cups on the tray hold 1, ½, ¼, ⅓, ⅙, ⅛ (or litres, later); pour as many as you
   like — the level climbs up the marks on the jug — and bake when it is exactly right. Pour too much and the jug overflows: tip it out
   and try again. Grows with the child: whole cups to count (4–5), cups of 1, 2 and 5 (6–7), halves and quarters (8–9), thirds, sixths and
   eighths (10–11), decimal litres (12–13), and doubling or halving the recipe before you pour (14–15). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2, { fmtNum } = KQKit;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
  const pick = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const t = (k, p) => KQ.t(k, p);
  const EPS = 1e-6;

  const THEMES = {
    gm_bakery: { palette: { noFloor: false, sky: 0xffe8d0, ground: 0xc89a6a, fog: 0xffe8d0, wall: ['plank', '#e8c8a0', '#d8b890'], floor: ['plank', '#c89a6a', '#b88a5a'], hemi: [0xfff0e0, 0x8a6a4a], key: 0xfff0d8, dust: { c: 0xffffff, n: 30, mode: 'drift' } },
      look: { keyC: 0xfff0d8, grade: 'warm', exposure: 1.05, fogD: 0.02, rim: 0xffd8a0, face: 0x3a2010, accent: '#ffe0b8', pillars: null, rays: 0, noWall: false, ceiling: false },
      props(c) { const { scene } = c; const wood = M(0x9a6a3a, { roughness: 0.8 });
        const counter = new T.Mesh(new T.BoxGeometry(18, 1, 5), wood); counter.position.set(0, -0.5, 0); scene.add(counter); const top = new T.Mesh(new T.BoxGeometry(18.4, 0.14, 5.4), M(0xf0e0c8, { roughness: 0.5 })); top.position.y = 0.05; scene.add(top);
        for (let r = 0; r < 2; r++) { const sh = new T.Mesh(new T.BoxGeometry(14, 0.18, 1.2), wood); sh.position.set(0, 4.2 + r * 2.1, -4.2); scene.add(sh); for (let i = 0; i < 9; i++) { const col = [0xff7eb6, 0x7ad8ff, 0xffd84a, 0x9aff7a, 0xc8a0ff][(i + r) % 5], j = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 0.9, 16), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.8, roughness: 0.1, emissive: col, emissiveIntensity: 0.25 })); j.position.set(-6 + i * 1.5, 4.8 + r * 2.1, -4.1); scene.add(j); } }
        const oven = new T.Mesh(new T.BoxGeometry(3.6, 3.2, 2), M(0x8a8a94, { metalness: 0.5, roughness: 0.4 })); oven.position.set(6.5, 1.7, -3.6); scene.add(oven); const door = new T.Mesh(new T.PlaneGeometry(2.4, 1.4), new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.1, 0.4) })); door.position.set(6.5, 1.5, -2.58); scene.add(door); const L = new T.PointLight(0xffa050, 14, 12, 1.6); L.position.set(6.5, 1.6, -1.6); scene.add(L);
        c.updaters.push((dt, tm) => { L.intensity = 12 + Math.sin(tm * 7) * 2; });
      } }
  };

  /* ---------------------------------------------------------------- orders and cups, band by band */
  function orderFor(b, i) {
    if (b <= 1) return { amt: ri(2, 5), cups: [1], unit: 'cups', step: 1, lab: 1, den: null };
    if (b === 2) return { amt: ri(6, 10), cups: [1, 2, 5], unit: 'cups', step: 1, lab: 1, den: null };
    if (b === 3) return { amt: pick([0.75, 1.25, 1.5, 1.75, 2.25, 2.5]), cups: [1, 0.5, 0.25], unit: 'cups', step: 0.25, lab: 0.5, den: 4 };
    if (b === 4) return i % 2 ? { amt: pick([5 / 6, 1 + 1 / 3, 1 + 2 / 3, 1 + 1 / 6, 2 / 3]), cups: [1, 1 / 2, 1 / 3, 1 / 6], unit: 'cups', step: 1 / 6, lab: 1 / 3, den: 6 } : { amt: pick([7 / 8, 3 / 8, 1 + 5 / 8, 1 + 3 / 8]), cups: [1, 1 / 2, 1 / 4, 1 / 8], unit: 'cups', step: 1 / 8, lab: 1 / 4, den: 8 };
    if (b === 5) return { amt: pick([1.3, 0.7, 1.6, 2.4, 0.9, 1.8]), cups: [1, 0.5, 0.2, 0.1], unit: 'litres', step: 0.1, lab: 0.5, den: null, dp: true };
    const base = pick([0.75, 1.25, 1.5, 0.5]), dbl = i % 2 === 0; return { amt: dbl ? base * 2 : base / 2, base, how: dbl ? 'dbl' : 'half', cups: [1, 0.5, 0.25, 0.125], unit: 'cups', step: 0.125, lab: 0.5, den: 8 };
  }
  const VULGAR = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
  /* mixed numbers as one glyph group — 2½, 1⅜ — kept in reading order inside Hebrew (LRM on both sides); plain fractions stay 3/4 */
  const fmt = (v, O) => { if (O.den) { const w = Math.floor(v + EPS), f = v - w; if (w >= 1 && f > EPS) { const fr = fmtNum(f, { den: O.den }); return '\u200E' + w + (VULGAR[fr] || '\u00A0' + fr) + '\u200E'; } } return fmtNum(v, O.den ? { den: O.den } : null); };
  const RECIPES = ['bk_r1', 'bk_r2', 'bk_r3', 'bk_r4', 'bk_r5', 'bk_r6'];

  const STAGES = {
    gm_bakery(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2, O: null, poured: 0, pours: [], baking: false };
      /* the mixing jug: glass, a scale up its side, the potion flour inside rising */
      const jug = new T.Group(); jug.position.set(0, 0.12, 0.6); scene.add(jug); const JH = 3.6, JR = 1.2;
      const glass = new T.Mesh(new T.CylinderGeometry(JR, JR * 0.92, JH, 40, 1, true), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.05, side: T.DoubleSide })); glass.position.y = JH / 2; jug.add(glass);
      const bottom = new T.Mesh(new T.CircleGeometry(JR * 0.92, 40), M(0xf0f0f0, { transparent: true, opacity: 0.4 })); bottom.rotation.x = -PI / 2; bottom.position.y = 0.02; jug.add(bottom);
      const fillM = new T.MeshStandardMaterial({ color: 0xc8a0ff, emissive: 0x7a4ad8, emissiveIntensity: 0.5, roughness: 0.4 }), fill = new T.Mesh(new T.CylinderGeometry(JR * 0.9, JR * 0.88, 1, 40), fillM); fill.position.y = 0.5; fill.scale.y = 0.001; jug.add(fill);
      const scale = new T.Group(); jug.add(scale); const tabs = [];
      let CAP = 1;   /* the amount the jug's scale runs to */
      const hOf = v => Math.max(0.001, v / CAP * (JH - 0.3));
      function buildScale() { const O = S.O; for (const tb of tabs.splice(0)) tb.userData.tablet.dispose(); while (scale.children.length) scale.remove(scale.children[0]);
        CAP = Math.max(O.amt * 1.35, O.lab * 4); CAP = Math.ceil(CAP / O.lab) * O.lab; const tick = new T.MeshBasicMaterial({ color: 0x3a2010 });
        for (let v = O.step; v <= CAP + EPS; v = +(v + O.step).toFixed(6)) { const big = Math.abs(v / O.lab - Math.round(v / O.lab)) < EPS, m = new T.Mesh(new T.BoxGeometry(big ? 0.5 : 0.28, 0.035, 0.02), tick); m.position.set(-JR + (big ? 0.25 : 0.14), hOf(v), JR * 0.98); scale.add(m);
          if (big && (S.band <= 4 || Math.abs(v - Math.round(v)) < EPS)) { const tb = c.label(fmt(v, O), -1, 0.34); tb.position.set(-JR - 0.55, hOf(v), JR); scale.add(tb); tabs.push(tb); } }
        const want = new T.Mesh(new T.TorusGeometry(JR * 1.02, 0.03, 6, 48), new T.MeshBasicMaterial({ color: 0xffd84a })); want.rotation.x = PI / 2; want.position.y = hOf(O.amt); scale.add(want); want.visible = S.band <= 2; }   /* the youngest see the line to fill to */
      function setLevel(v, dur) { const h0 = fill.scale.y, h1 = hOf(Math.min(v, CAP * 1.05)); return K.anim(dur || 0.35, k => { const h = h0 + (h1 - h0) * K.ease(k); fill.scale.y = h; fill.position.y = h / 2 + 0.02; }); }
      /* the order ticket (a crisp tablet) and a cup that flies to the jug and tips */
      const cupM = M(0xe8e8f0, { metalness: 0.7, roughness: 0.25 });
      async function pour(v) { if (S.baking) return; S.baking = true; const r = 0.28 + Math.sqrt(v) * 0.3, cup = new T.Group(); const body = new T.Mesh(new T.CylinderGeometry(r, r * 0.9, r * 1.2, 20, 1, true), cupM); body.material.side = T.DoubleSide; cup.add(body); const flour = new T.Mesh(new T.CircleGeometry(r * 0.95, 20), fillM); flour.rotation.x = -PI / 2; flour.position.y = r * 0.45; cup.add(flour); const h = new T.Mesh(new T.TorusGeometry(r * 0.5, 0.05, 6, 16, PI), cupM); h.position.x = r + 0.2; h.rotation.z = -PI / 2; cup.add(h);
        cup.position.set(2.8, 2.6, 1.6); scene.add(cup); await K.anim(0.35, k => { cup.position.set(2.8 - 1.8 * k, 2.6 + 2.2 * k, 1.6 - 1.0 * k); }); await K.anim(0.3, k => { cup.rotation.z = k * 2.2; }); S.poured = +(S.poured + v).toFixed(6); S.pours.push(v); K.sfx('tick');
        for (let i = 0; i < 8; i++) { const d = c.sprite(0xd8b8ff, 0.25, 0.4, 4.3, 0.6, null, 0.9); c.tween(0.5, k => { d.position.y = 4.3 - k * 3; d.material.opacity = 0.9 * (1 - k); }, () => scene.remove(d), i * 0.04); }
        await setLevel(S.poured, 0.4); await K.anim(0.25, k => { cup.position.x -= 0.2; cup.position.y += 0.4; cup.material && 0; }); scene.remove(cup);
        if (S.poured > S.O.amt + EPS) { K.tell(S.kick, t('bk_over', { n: fmt(S.poured, S.O) })); for (let i = 0; i < 14; i++) { const d = c.sprite(0xd8b8ff, 0.35, (Math.random() - 0.5) * 2.4, hOf(CAP) + 0.2, 0.6, null, 0.9); c.tween(0.9, k => { d.position.y -= 0.03; d.material.opacity = 0.9 * (1 - k); }, () => scene.remove(d), i * 0.03); } }
        else K.tell(S.kick, t('bk_sofar', { n: fmt(S.poured, S.O), u: t('bk_' + S.O.unit), a: fmt(S.O.amt, S.O) })); S.baking = false; K.ready(); }
      async function tipOut() { if (S.baking || !S.poured) return; S.baking = true; await K.anim(0.5, k => { jug.rotation.z = Math.sin(k * PI) * 0.9; }); S.poured = 0; S.pours = []; await setLevel(0, 0.2); jug.rotation.z = 0; S.baking = false; K.tell(S.kick, S.task); }
      const cupLabel = (v, O) => O.unit === 'litres' ? fmt(v, O) + ' L' : fmt(v, O);
      async function order(i, n, kick) { const O = orderFor(S.band, i); S.O = O; S.kick = kick; S.poured = 0; S.pours = []; buildScale(); await setLevel(0, 0.1);
        const what = t(RECIPES[(i + S.seed) % RECIPES.length]); S.task = O.how ? t(O.how === 'dbl' ? 'bk_taskDbl' : 'bk_taskHalf', { r: what, b: fmt(O.base, O), u: t('bk_' + O.unit) }) : t('bk_task', { r: what, a: fmt(O.amt, O), u: t('bk_' + O.unit) });
        K.tell(kick, S.task); K.hint(() => K.tell(kick, O.how ? t(O.how === 'dbl' ? 'bk_hintDbl' : 'bk_hintHalf', { b: fmt(O.base, O), a: fmt(O.amt, O) }) : t('bk_hint', { a: fmt(O.amt, O) })));
        const items = O.cups.map(v => ({ text: cupLabel(v, O) })).concat([{ text: '⤺', label: t('bk_tip') }]);
        let tries = 0; for (;;) { K.tray(items, j => { if (j === O.cups.length) tipOut(); else if (S.poured <= O.amt + EPS) pour(O.cups[j]); });
          await K.act(t('bk_bake'), { wait: !S.poured }); if (!K.alive()) return null; tries++; K.tray(null);
          if (Math.abs(S.poured - O.amt) < EPS) { K.sfx('correct'); K.tell(kick, t('bk_yes', { a: fmt(O.amt, O), u: t('bk_' + O.unit), r: what })); const cake = new T.Mesh(new T.CylinderGeometry(0.8, 0.9, 0.7, 24), M(0xffb8d8, { emissive: 0xff7ab6, emissiveIntensity: 0.3 })); cake.position.set(6.5, 1.5, -2.2); scene.add(cake); c.burst(new T.Vector3(6.5, 2, -2), 0xffd8a0, 16); await K.anim(0.8, k => { cake.position.set(6.5 - 4 * k, 1.5 + Math.sin(k * PI) * 1.4, -2.2 + 2.4 * k); }); await K.wait(0.7); scene.remove(cake); S.poured = 0; await setLevel(0, 0.2); K.hint(null); return tries === 1 ? 1 : tries === 2 ? 2 : 3; }
          K.sfx('wrong'); const d = +(O.amt - S.poured).toFixed(6); K.tell(kick, d > 0 ? t('bk_short', { d: fmt(d, O), u: t('bk_' + O.unit) }) : t('bk_long', { d: fmt(-d, O), u: t('bk_' + O.unit) })); await K.wait(1.6); if (d < 0) await tipOut(); } }
      function frame(a) { jug.position.x = a < 1.05 ? 0.8 : 0; return a < 1.05 ? { pos: [0, 4.2, 11.5], look: [0, 2.0, 0], fov: 50 } : { pos: [0, 3.6, 9.5], look: [0, 2.0, 0], fov: 46 }; }
      async function play(api) { K.mount(api); S.band = Math.max(1, Math.min(6, api.band || 2)); S.seed = Math.floor(Math.random() * 6); window.__bakery = { S }; const N = 5, done = []; let pts = 0; api.pips(N, done); S.O = orderFor(S.band, 0); buildScale();
        const nm = t('ag_bakery'); await K.intro(async () => { K.tell(nm, t('bk_hi')); await K.act(t('bk_start')); }); if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const r = await order(i, N, t('bk_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 6 : 3; done.push(r === 1); api.pips(N, done); }
        const right = done.filter(Boolean).length; K.tell(nm, t('bk_win')); await K.wait(1.4);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('bk_win') }); }
      function dispose() { K.dispose(); for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  const STR = {
    en: { bk_hi: 'Welcome to the Potion Bakery! Every order needs an exact amount of glowing flour. Pour the measuring cups into the jug, watch the marks, and bake when it is just right.', bk_start: 'Open the shop', bk_n: 'Order {i} of {n}',
      bk_task: '{r}: pour exactly {a} {u}.', bk_taskDbl: '{r}: the recipe takes {b} {u}, but make a DOUBLE batch.', bk_taskHalf: '{r}: the recipe takes {b} {u}, but make HALF a batch.', bk_cups: 'cups', bk_litres: 'litres',
      bk_sofar: 'In the jug: {n} {u}. The order needs {a}.', bk_over: 'Too much: {n}! Tip it out with ⤺ and pour again.', bk_tip: 'Tip the jug out', bk_bake: 'Bake!',
      bk_yes: 'Exactly {a} {u}! Order up: {r}!', bk_short: '{d} {u} short. Pour a little more.', bk_long: '{d} {u} too much. Tip it out and try again.',
      bk_hint: 'You need {a}. Which cups add up to that? Big cups first, then small ones.', bk_hintDbl: 'Double {b} means {b} + {b} = {a}.', bk_hintHalf: 'Half of {b} is {a}.',
      bk_r1: 'Moon muffins', bk_r2: 'Starlight cake', bk_r3: 'Dragon cookies', bk_r4: 'Rainbow bread', bk_r5: 'Fairy pie', bk_r6: 'Comet cupcakes', bk_win: 'Every order baked just right. The customers are glowing!' },
    he: { bk_hi: 'ברוכים הבאים למאפיית השיקויים! כל הזמנה צריכה כמות מדויקת של קמח זוהר. יוצקים את כוסות המדידה לכד, מסתכלים על הסימונים ואופים כשזה בדיוק נכון.', bk_start: 'פותחים את החנות', bk_n: 'הזמנה {i} מתוך {n}',
      bk_task: '{r}: יוצקים בדיוק {a} {u}.', bk_taskDbl: '{r}: במתכון יש {b} {u}, אבל אופים מנה כפולה.', bk_taskHalf: '{r}: במתכון יש {b} {u}, אבל אופים חצי מנה.', bk_cups: 'כוסות', bk_litres: 'ליטר',
      bk_sofar: 'בכד: {n} {u}. ההזמנה צריכה {a}.', bk_over: 'יותר מדי: {n}! שופכים עם ⤺ ויוצקים שוב.', bk_tip: 'שופכים את הכד', bk_bake: 'אופים!',
      bk_yes: 'בדיוק {a} {u}! ההזמנה מוכנה: {r}!', bk_short: 'חסר {d} {u}. יוצקים עוד קצת.', bk_long: 'יותר מדי ב־{d} {u}. שופכים ומנסים שוב.',
      bk_hint: 'צריך {a}. אילו כוסות מסתכמות בזה? קודם כוסות גדולות, אחר כך קטנות.', bk_hintDbl: 'כפול {b} זה {b} + {b} = {a}.', bk_hintHalf: 'חצי מ־{b} זה {a}.',
      bk_r1: 'מאפינס ירח', bk_r2: 'עוגת אור כוכבים', bk_r3: 'עוגיות דרקון', bk_r4: 'לחם קשת', bk_r5: 'פאי פיות', bk_r6: 'קאפקייקס שביט', bk_win: 'כל ההזמנות נאפו בדיוק. הלקוחות זוהרים!' }
  };
  KQRealms.define('game-bakery', { strings: STR, themes: THEMES, stages: STAGES });
})();
