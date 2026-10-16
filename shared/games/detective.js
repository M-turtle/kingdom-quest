/* Kingdom Quest — Detective Case, the reading game of the Games Arcade (shared/arcade.js). Reading as detective work: the golden cake has
   vanished from the town square and the suspects stand by the fountain, the tree and the market stall — hats, balloons, umbrellas, books.
   Each clue is a sentence; read it and tap every suspect it rules out (they step back into the shadow). Cross out someone the clue does
   not rule out and the detective stops you: read it again. When one is left, accuse! Grows with the child: one feature in short words
   (4–5), holding things (6–7), 'not' (8–9), where they stood (10–11), 'either … or' (12–13), and a witness's report to reason from (14–15). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const t = (k, p) => KQ.t(k, p);
  const HATS = ['none', 'red', 'blue', 'yellow', 'green'], ITEMS = ['none', 'balloon', 'umbrella', 'book', 'flower'], PLACES = ['fountain', 'tree', 'stall'];
  const HAT_HEX = { red: 0xd8343a, blue: 0x3a6ad8, yellow: 0xf2c83a, green: 0x3aa85a };

  const THEMES = {
    gm_square: { palette: { noFloor: false, sky: 0x9ad4ff, ground: 0xc8b89a, fog: 0xd8ecff, wall: ['stone', '#d8ccb4', '#c8bca4'], floor: ['stone', '#c8b89a', '#b8a88a'], hemi: [0xeaf6ff, 0x8a7a5a], key: 0xfff4e0, dust: { c: 0xffffff, n: 10, mode: 'drift' } },
      look: { keyC: 0xfff4e0, grade: 'sky', exposure: 1.05, fogD: 0.01, rim: 0xffe8c0, face: 0x2a1a10, accent: '#ffe7a8', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { scene } = c; KQRealms.hall.skyDome(c, 0x3a8ae0, 0xd8eeff); const stone = M(0xd8ccb4, { roughness: 0.85 });
        /* houses round the square */
        for (let i = 0; i < 7; i++) { const x = -15 + i * 5, h = 4 + (i % 3) * 1.4, hs = new T.Mesh(new T.BoxGeometry(4.4, h, 3), M([0xf0d8b8, 0xe8c8c8, 0xd8e0f0, 0xf4e8b0][i % 4])); hs.position.set(x, h / 2, -12); scene.add(hs); const rf = new T.Mesh(new T.ConeGeometry(3.3, 1.8, 4), M(0xb8483a)); rf.rotation.y = PI / 4; rf.position.set(x, h + 0.9, -12); scene.add(rf); for (const wx of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(0.8, 0.9), M(0x5a7aa8, { emissive: 0x1a2a4a })); w.position.set(x + wx * 1.1, h * 0.6, -10.49); scene.add(w); } }
        for (let i = 0; i < 6; i++) { const p = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 3.2, 8), M(0x2a2a30, { metalness: 0.6 })); p.position.set(-12 + i * 4.8, 1.6, -8); scene.add(p); const lamp = c.sprite(0xfff0c0, 0.7, -12 + i * 4.8, 3.3, -8, null, 0.8); void lamp; }
      } }
  };

  /* ---------------------------------------------------------------- a case: suspects, a culprit, clues that narrow them to one */
  function caseFor(b, relax) {
    const n = b <= 1 ? 3 : b === 2 ? 4 : b <= 4 ? 5 : 6;
    const kinds = b <= 1 ? ['hat', 'nothat'] : b === 2 ? ['hat', 'item'] : b === 3 ? ['hat', 'item', 'nothat', 'notitem'] : b === 4 ? ['place', 'notplace', 'nothat', 'item'] : b === 5 ? ['or', 'nothat', 'notplace', 'item', 'place'] : ['witness', 'or', 'notplace', 'notitem', 'nohat'];
    for (let tries = 0; tries < 500; tries++) {
      const sus = []; for (let i = 0; i < n; i++) sus.push({ id: i, hat: pick(b <= 1 ? HATS.slice(1) : HATS), item: pick(b <= 1 ? ['none'] : ITEMS), place: PLACES[i % 3], shirt: [0xff8a5a, 0x5ab8ff, 0x9a7aff, 0x5ad8a0, 0xffc85a, 0xff7ab6][i % 6], skin: [0xf6d2bc, 0xeab894, 0xc98e66, 0x9a6444][i % 4] });
      const culprit = pick(sus), clues = []; let left = sus.slice();
      for (let k = 0; k < 8 && left.length > 1; k++) { const kind = pick(kinds); let cl = null;
        if (kind === 'hat' && culprit.hat !== 'none') cl = { key: 'dt_hat', p: { c: culprit.hat }, fits: s => s.hat === culprit.hat };
        if (kind === 'nothat') { const o = pick(left.filter(s => s.hat !== culprit.hat && s.hat !== 'none')); if (o) cl = { key: 'dt_nothat', p: { c: o.hat }, fits: s => s.hat !== o.hat }; }
        if (kind === 'nohat' && culprit.hat === 'none') cl = { key: 'dt_nohat', p: {}, fits: s => s.hat === 'none' };
        if (kind === 'item' && culprit.item !== 'none') cl = { key: 'dt_item', p: { i: culprit.item }, fits: s => s.item === culprit.item };
        if (kind === 'notitem') { const o = pick(left.filter(s => s.item !== culprit.item && s.item !== 'none')); if (o) cl = { key: 'dt_notitem', p: { i: o.item }, fits: s => s.item !== o.item }; }
        if (kind === 'place') cl = { key: 'dt_place', p: { p: culprit.place }, fits: s => s.place === culprit.place };
        if (kind === 'notplace') { const o = pick(PLACES.filter(p => p !== culprit.place)); cl = { key: 'dt_notplace', p: { p: o }, fits: s => s.place !== o }; }
        if (kind === 'or' && culprit.item !== 'none') { const o = pick(ITEMS.filter(x => x !== 'none' && x !== culprit.item)); const pair = shuffle([culprit.item, o]); cl = { key: 'dt_or', p: { i: pair[0], j: pair[1] }, fits: s => s.item === pair[0] || s.item === pair[1] }; }
        if (kind === 'witness') { const bad = shuffle(HATS.filter(h => h !== 'none' && h !== culprit.hat)).slice(0, 2); cl = { key: 'dt_witness', p: { c: bad[0], d: bad[1] }, fits: s => s.hat !== 'none' && s.hat !== bad[0] && s.hat !== bad[1] }; }
        if (!cl) continue; const next = left.filter(cl.fits); if (next.length === left.length || !next.includes(culprit)) continue; clues.push(cl); left = next; }
      if (left.length === 1 && clues.length >= (relax ? 1 : b <= 2 ? 2 : 3)) return { sus, culprit, clues };
    }
    return null;
  }
  const W = (k, v) => t(k + '_' + v);   /* word for a hat colour, an item or a place */
  const fill = cl => { const p = {}; for (const [k, v] of Object.entries(cl.p)) p[k] = k === 'c' || k === 'd' ? W('dt_c', v) : k === 'i' || k === 'j' ? W('dt_i', v) : W('dt_p', v); return p; };

  const STAGES = {
    gm_detective(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2, C: null, figs: [], clue: null };
      /* the square's three landmarks the suspects stand by */
      const SPOT = { tree: new T.Vector3(-5.8, 0, -1.2), fountain: new T.Vector3(0, 0, -2.6), stall: new T.Vector3(5.8, 0, -1.2) };
      const LM = {}; { const tr = new T.Group(); LM.tree = tr; scene.add(tr); const tk = new T.Mesh(new T.CylinderGeometry(0.3, 0.4, 2.6, 8), M(0x6a4a2a)); tk.position.y = 1.3; tr.add(tk); for (let i = 0; i < 4; i++) { const cr = new T.Mesh(new T.SphereGeometry(1.2 - i * 0.12, 12, 10), M(0x4a9a3a, { flatShading: true })); cr.position.set((i % 2 - 0.5) * 0.8, 3 + i * 0.4, (i % 3 - 1) * 0.4); tr.add(cr); } }
      { const f = new T.Group(); LM.fountain = f; scene.add(f); const basin = new T.Mesh(new T.CylinderGeometry(2, 2.2, 0.7, 24), M(0xd8d0c0)); basin.position.y = 0.35; f.add(basin); const water = new T.Mesh(new T.CircleGeometry(1.85, 24), M(0x5ab8e8, { roughness: 0.1, emissive: 0x1a4a6a })); water.rotation.x = -PI / 2; water.position.y = 0.66; f.add(water); const col = new T.Mesh(new T.CylinderGeometry(0.25, 0.3, 1.8, 12), M(0xd8d0c0)); col.position.y = 1.4; f.add(col); for (let i = 0; i < 12; i++) { const d = c.sprite(0xbfe8ff, 0.25, 0, 2.3, 0, f, 0.8); const a = i / 12 * TAU; c.updaters.push((dt, tm) => { const q = (tm * 0.8 + i / 12) % 1; d.position.set(Math.cos(a) * q * 1.4, 2.3 + q * 0.8 - q * q * 2.2, Math.sin(a) * q * 1.4); }); } }
      { const st = new T.Group(); LM.stall = st; scene.add(st); const tb = new T.Mesh(new T.BoxGeometry(2.8, 1, 1.2), M(0x9a6a3a)); tb.position.y = 0.5; st.add(tb); for (const x of [-1.3, 1.3]) { const p = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.6, 6), M(0x9a6a3a)); p.position.set(x, 1.3, -0.5); st.add(p); } const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32; const g = cv.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff4e0' : '#e8475a'; g.fillRect(i * 16, 0, 16, 32); } const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; const aw = new T.Mesh(new T.BoxGeometry(3.2, 0.1, 1.6), new T.MeshStandardMaterial({ map: tx })); aw.position.set(0, 2.6, -0.1); aw.rotation.x = 0.25; st.add(aw); const plate = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.06, 20), M(0xffffff)); plate.position.y = 1.03; st.add(plate); S.plate = plate; }
      /* a suspect: a round little townsperson with a hat and something in hand */
      function figure(s) { const g = new T.Group(), shirt = M(s.shirt), skin = M(s.skin); const body = new T.Mesh(new T.CapsuleGeometry(0.42, 0.7, 8, 16), shirt); body.position.y = 0.95; g.add(body); const head = new T.Mesh(new T.SphereGeometry(0.4, 20, 14), skin); head.position.y = 1.85; g.add(head);
        for (const sd of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.055, 8, 6), M(0x1a1010)); e.position.set(sd * 0.14, 1.9, 0.36); g.add(e); } const sm = new T.Mesh(new T.TorusGeometry(0.1, 0.022, 6, 12, PI), M(0x6a2a2a)); sm.rotation.z = PI; sm.position.set(0, 1.76, 0.37); g.add(sm);
        if (s.hat !== 'none') { const hm = M(HAT_HEX[s.hat]); const brim = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.06, 20), hm); brim.position.y = 2.17; g.add(brim); const crown = new T.Mesh(new T.CylinderGeometry(0.3, 0.34, 0.42, 18), hm); crown.position.y = 2.4; g.add(crown); }
        const hand = new T.Group(); hand.position.set(0.55, 1.05, 0.15); g.add(hand); const arm = new T.Mesh(new T.CapsuleGeometry(0.1, 0.4, 6, 8), shirt); arm.rotation.z = 0.6; arm.position.set(-0.1, 0.1, 0); hand.add(arm);
        if (s.item === 'balloon') { const bl = new T.Mesh(new T.SphereGeometry(0.34, 16, 12), M(0xff5a8a, { roughness: 0.3 })); bl.scale.y = 1.2; bl.position.set(0.1, 1.6, 0); hand.add(bl); hand.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0.05, 0, 0), new T.Vector3(0.1, 1.2, 0)]), new T.LineBasicMaterial({ color: 0x444444 }))); }
        if (s.item === 'umbrella') { const um = new T.Mesh(new T.ConeGeometry(0.7, 0.4, 12, 1, true), M(0x3a3a8a, { side: T.DoubleSide })); um.position.set(0, 1.2, 0); hand.add(um); const st2 = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1.2, 6), M(0x2a2a2a)); st2.position.set(0, 0.55, 0); hand.add(st2); }
        if (s.item === 'book') { const bk = new T.Mesh(new T.BoxGeometry(0.3, 0.4, 0.1), M(0x8a3a2a)); bk.position.set(0.05, 0.05, 0.1); hand.add(bk); }
        if (s.item === 'flower') { const stem = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.5, 6), M(0x3a8a3a)); stem.position.set(0.05, 0.25, 0); hand.add(stem); const bloom = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), M(0xffd84a)); bloom.position.set(0.05, 0.52, 0); hand.add(bloom); }
        const hit = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 2.6, 10), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.y = 1.3; hit.userData.fig = g; g.add(hit);
        const mats = []; g.traverse(o => { if (o.isMesh && o !== hit && o.material && o.material.color) mats.push({ m: o.material, c: o.material.color.clone() }); }); g.userData = { s, hit, mats, out: false }; return g; }
      function setOut(g, out) { g.userData.out = out; for (const { m, c: col } of g.userData.mats) m.color.copy(col).lerp(new T.Color(0x3a3a44), out ? 0.7 : 0); const home = g.userData.home; c.tween(0.35, k => { g.position.z = home.z - (out ? k : 1 - k) * 1.4; }); }
      /* wide screens: the three places side by side; a phone: one behind the other, so every suspect is on screen */
      function place() { const nar = K.narrow(); if (nar) { SPOT.tree.set(0, 0, 3.0); SPOT.fountain.set(0, 0, -1.6); SPOT.stall.set(0, 0, -6.2); LM.tree.position.set(-2.8, 0, 2.0); LM.fountain.position.set(0, 0, -3.8); LM.stall.position.set(2.6, 0, -7.6); }
        else { SPOT.tree.set(-5.8, 0, -1.2); SPOT.fountain.set(0, 0, -2.6); SPOT.stall.set(5.8, 0, -1.2); LM.tree.position.set(-7.6, 0, -2.8); LM.fountain.position.set(0, 0, -4.8); LM.stall.position.set(7.6, 0, -2.8); } }
      function build() { place(); for (const f of S.figs) scene.remove(f); S.figs = []; const by = { tree: [], fountain: [], stall: [] }; for (const s of S.C.sus) by[s.place].push(s);
        for (const [pl, arr] of Object.entries(by)) arr.forEach((s, i) => { const g = figure(s); const nar = K.narrow(), p = SPOT[pl].clone().add(new T.Vector3((i - (arr.length - 1) / 2) * (nar ? 1.6 : 1.8), 0, (nar ? 0.8 : 1.6) + (i % 2) * 0.3));   /* apart enough that a tap lands on the one you mean */ g.position.copy(p); g.userData.home = p.clone(); scene.add(g); S.figs.push(g); const k = Math.random() * 6; c.updaters.push((dt, tm) => { if (g.parent) g.rotation.y = Math.sin(tm * 0.8 + k) * 0.15; }); }); }
      async function caseRound(ci, n, kick) { S.C = caseFor(S.band) || caseFor(S.band) || caseFor(S.band, true);   /* a fresh case every time; never stuck */ S.clue = null; build(); S.plate.visible = false; let miss = 0;
        K.tell(kick, t('dt_case')); await K.act(t('dt_first')); if (!K.alive()) return null;
        for (let k = 0; k < S.C.clues.length; k++) { const cl = S.C.clues[k]; S.clue = cl; const line = t('dt_clue', { i: k + 1, n: S.C.clues.length }) + ' ' + t(cl.key, fill(cl)); K.tell(kick, line);
          K.hint(() => { const g = S.figs.find(f => !f.userData.out && !cl.fits(f.userData.s)); K.tell(kick, g ? t('dt_hintOne') + ' ' + t(cl.key, fill(cl)) : t('dt_hintNone')); if (g) c.tween(0.6, q => { g.position.y = Math.sin(q * PI * 3) * 0.2; }); });
          K.pointer = { down(e) { const h = K.hit(e, S.figs.map(f => f.userData.hit)); if (!h) return false; const g = h.object.userData.fig; if (g.userData.out) { setOut(g, false); K.sfx('tap'); return true; }
              if (cl.fits(g.userData.s)) { miss++; K.sfx('wrong'); K.tell(kick, t('dt_keep') + ' ' + t(cl.key, fill(cl))); c.tween(0.5, q => { g.rotation.z = Math.sin(q * PI * 4) * 0.12; }, () => { g.rotation.z = 0; }); return true; }
              setOut(g, true); K.sfx('tick'); return true; }, cursor: () => 'pointer' };
          for (;;) { await K.act(k === S.C.clues.length - 1 ? t('dt_done') : t('dt_next')); if (!K.alive()) return null; const still = S.figs.filter(f => !f.userData.out && !cl.fits(f.userData.s)); if (!still.length) break; miss++; K.sfx('wrong'); K.tell(kick, t('dt_more', { n: still.length }) + ' ' + t(cl.key, fill(cl))); } K.hint(null); }
        K.pointer = null; S.clue = null; const cul = S.figs.find(f => f.userData.s === S.C.culprit); K.tell(kick, t('dt_accuse')); await K.act(t('dt_accuseBtn')); if (!K.alive()) return null;
        const cake = new T.Mesh(new T.CylinderGeometry(0.28, 0.3, 0.26, 16), M(0xffd84a, { metalness: 0.5, roughness: 0.3, emissive: 0x6a4a0a })); cake.position.set(0.55, 1.3, 0.4); cul.add(cake); K.sfx('correct'); c.burst(cul.position.clone().add(new T.Vector3(0, 2.5, 0)), 0xffe08a, 20); await K.anim(0.8, q => { cul.position.y = Math.abs(Math.sin(q * PI * 2)) * 0.5; });
        K.tell(kick, t('dt_solved')); await K.wait(1.6); cul.remove(cake); S.plate.visible = true; K.hint(null); return miss === 0 ? 1 : miss <= 2 ? 2 : 0; }
      function frame(a) { return a < 1.05 ? { pos: [0, 13, 13.5], look: [0, 0.6, -2.2], fov: 60 } : { pos: [0, 5.2, 12.5], look: [0, 1.2, -1.4], fov: 48 }; }
      async function play(api) { K.mount(api); S.band = Math.max(1, Math.min(6, api.band || 2)); window.__detective = { S }; const N = 4, done = []; let pts = 0; api.pips(N, done); S.C = caseFor(S.band) || caseFor(S.band, true); build();
        const nm = t('ag_detective'); await K.intro(async () => { K.tell(nm, t('dt_hi')); await K.act(t('dt_start')); }); if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const r = await caseRound(i, N, t('dt_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 12 : r === 2 ? 7 : 3; done.push(r === 1); api.pips(N, done); }
        const right = done.filter(Boolean).length; K.tell(nm, t('dt_win')); await K.wait(1.4);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('dt_win') }); }
      function dispose() { K.dispose(); }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  const STR = {
    en: { dt_hi: 'Detective! Read each clue carefully, then tap every suspect the clue rules out. Keep going until only one is left.', dt_start: 'Take the case', dt_n: 'Case {i} of {n}', dt_case: 'The golden cake has vanished from the market stall! The suspects are in the square.', dt_first: 'First clue',
      dt_clue: 'Clue {i} of {n}:', dt_next: 'Next clue', dt_done: 'Done', dt_keep: 'Wait! That one fits the clue, so they could still be the one. Read it again:', dt_more: '{n} suspect(s) left still do not fit this clue. Read it again:',
      dt_hintOne: 'Look at each suspect left and check them against the clue:', dt_hintNone: 'Everyone left fits this clue. Press on!', dt_accuse: 'Only one suspect is left. Accuse them!', dt_accuseBtn: 'Accuse!', dt_solved: 'Case solved! The golden cake goes back to the stall.', dt_win: 'Four cases, four culprits. Great detective work!',
      dt_hat: 'The one who took the cake wears a {c} hat.', dt_nothat: 'The one who took the cake does not wear a {c} hat.', dt_nohat: 'The one who took the cake wears no hat at all.',
      dt_item: 'The one who took the cake is holding {i}.', dt_notitem: 'The one who took the cake is not holding {i}.', dt_place: 'The one who took the cake stood by {p}.', dt_notplace: 'The one who took the cake did not stand by {p}.',
      dt_or: 'The one who took the cake is holding either {i} or {j}.', dt_witness: 'A witness saw the hat of the one who took the cake. It was not {c} and not {d}.',
      dt_c_red: 'red', dt_c_blue: 'blue', dt_c_yellow: 'yellow', dt_c_green: 'green', dt_i_balloon: 'a balloon', dt_i_umbrella: 'an umbrella', dt_i_book: 'a book', dt_i_flower: 'a flower', dt_p_fountain: 'the fountain', dt_p_tree: 'the tree', dt_p_stall: 'the market stall' },
    he: { dt_hi: 'בלשים! קוראים כל רמז בעיון, ונוגעים בכל חשוד שהרמז פוסל. ממשיכים עד שנשאר רק אחד.', dt_start: 'לוקחים את התיק', dt_n: 'תיק {i} מתוך {n}', dt_case: 'עוגת הזהב נעלמה מדוכן השוק! החשודים בכיכר.', dt_first: 'רמז ראשון',
      dt_clue: 'רמז {i} מתוך {n}:', dt_next: 'לרמז הבא', dt_done: 'סיימנו', dt_keep: 'רגע! החשוד הזה מתאים לרמז, אז אולי זה הוא. קוראים שוב:', dt_more: 'נשארו עוד {n} חשודים שלא מתאימים לרמז הזה. קוראים שוב:',
      dt_hintOne: 'בודקים כל חשוד שנשאר מול הרמז:', dt_hintNone: 'כל מי שנשאר מתאים לרמז הזה. ממשיכים!', dt_accuse: 'נשאר רק חשוד אחד. מאשימים!', dt_accuseBtn: 'מאשימים!', dt_solved: 'התיק נפתר! עוגת הזהב חוזרת לדוכן.', dt_win: 'ארבעה תיקים, ארבעה אשמים. עבודת בילוש מעולה!',
      dt_hat: 'מי שלקח את העוגה חובש כובע {c}.', dt_nothat: 'מי שלקח את העוגה לא חובש כובע {c}.', dt_nohat: 'מי שלקח את העוגה לא חובש כובע בכלל.',
      dt_item: 'מי שלקח את העוגה מחזיק {i}.', dt_notitem: 'מי שלקח את העוגה לא מחזיק {i}.', dt_place: 'מי שלקח את העוגה עמד ליד {p}.', dt_notplace: 'מי שלקח את העוגה לא עמד ליד {p}.',
      dt_or: 'מי שלקח את העוגה מחזיק {i} או {j}.', dt_witness: 'עדה ראתה את הכובע של מי שלקח את העוגה. הוא לא היה {c} וגם לא {d}.',
      dt_c_red: 'אדום', dt_c_blue: 'כחול', dt_c_yellow: 'צהוב', dt_c_green: 'ירוק', dt_i_balloon: 'בלון', dt_i_umbrella: 'מטרייה', dt_i_book: 'ספר', dt_i_flower: 'פרח', dt_p_fountain: 'המזרקה', dt_p_tree: 'העץ', dt_p_stall: 'דוכן השוק' }
  };
  KQRealms.define('game-detective', { strings: STR, themes: THEMES, stages: STAGES });
})();
