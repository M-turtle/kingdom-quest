/* Kingdom Quest — Robot Diver, a game of the Games Arcade (shared/arcade.js). Programming as play: a little diving robot stands on a grid
   of seabed tiles; pearls lie on some, rocks block others. Build its program from command tiles — forward, turn left, turn right, and
   later 'repeat ×2 / ×3' — then press Run and watch it follow your code exactly. It bumps a rock or the edge: find the bug and fix it.
   Grows with the child: straight lines to count (4–5), one turn (6–7), two pearls round a rock (8–9), three pearls (10–11), and a
   program with only a few slots so the repeats are needed (12–15). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
  const pick = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const t = (k, p) => KQ.t(k, p);
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   /* up (away from the camera), right, down, left */

  (function css() { if (document.getElementById('kq-robot-css')) return; const st = document.createElement('style'); st.id = 'kq-robot-css'; st.textContent = `
.rb-prog{position:absolute; left:50%; bottom:calc(152px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); display:flex; flex-wrap:wrap; justify-content:center; gap:6px; max-width:min(720px,94vw); min-height:52px; padding:8px 12px; border-radius:16px; background:rgba(8,24,44,.66); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); box-shadow:inset 0 0 0 1.5px rgba(242,193,78,.55); pointer-events:none}
.rb-prog i{display:grid; place-items:center; width:40px; height:40px; border-radius:10px; background:linear-gradient(180deg,#fffaf0,#ffe9c4); color:#2a1a30; font:900 22px/1 Rubik, sans-serif; font-style:normal; box-shadow:0 3px 0 #c8a068}
.rb-prog i.slot{background:rgba(255,255,255,.1); box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)} .rb-prog i.now{background:linear-gradient(180deg,#ffe08a,#f2b84a)} .rb-prog i.bad{background:linear-gradient(180deg,#ff9a8a,#d8434a); color:#fff}
.rb-prog em{font:800 12px Rubik, sans-serif; font-style:normal; color:#cfe4ff; align-self:center; margin-inline-start:6px}
@media (max-width:760px){ .rb-prog{bottom:auto; top:calc(150px + env(safe-area-inset-top,0px)); gap:4px; padding:6px 8px} .rb-prog i{width:30px; height:30px; font-size:17px; border-radius:8px} }   /* phones: the program under the plaque, the board between it and the tray */
`; document.head.appendChild(st); })();

  const THEMES = {
    gm_seabed: { palette: { noFloor: true, sky: 0x0a4a7a, ground: 0xc8b884, fog: 0x0f5a8a, wall: ['plank', '#0a4a7a', '#08406a'], floor: ['plank', '#c8b884', '#b8a874'], hemi: [0x9ae0ff, 0x2a4a3a], key: 0xd8f4ff, dust: { c: 0xdff4ff, n: 50, mode: 'drift' } },
      look: { keyC: 0xd8f4ff, grade: 'ocean', exposure: 1.1, fogD: 0.03, rim: 0x7ad8ff, face: 0x08243a, accent: '#bfe8ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { scene } = c; KQRealms.hall.skyDome(c, 0x063a66, 0x1f7ab0);
        const sand = new T.Mesh(new T.PlaneGeometry(80, 80, 40, 40), M(0xc8b884, { roughness: 0.95 })); sand.rotation.x = -PI / 2; sand.position.y = -0.05; { const p = sand.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y); p.setZ(i, d > 9 ? Math.sin(x * 0.4) * Math.cos(y * 0.3) * 0.5 : 0); } sand.geometry.computeVertexNormals(); } sand.receiveShadow = true; scene.add(sand);
        for (let i = 0; i < 16; i++) { const r = c.sprite(0xbfe8ff, 3 + Math.random() * 4, (Math.random() - 0.5) * 40, 8, -8 - Math.random() * 20, null, 0.12); r.scale.set(2.5, 22, 1); const k = Math.random() * 6; c.updaters.push((dt, tm) => { r.material.opacity = 0.06 + 0.06 * Math.sin(tm * 0.6 + k); }); }
        const kelpM = M(0x2f8a5a, { side: T.DoubleSide }); for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, rr = 9 + Math.random() * 14, k = new T.Mesh(new T.ConeGeometry(0.3, 4 + Math.random() * 4, 5), kelpM); k.position.set(Math.cos(a) * rr, 2.5, Math.sin(a) * rr - 4); scene.add(k); const ph = Math.random() * 6; c.updaters.push((dt, tm) => { k.rotation.z = Math.sin(tm * 0.8 + ph) * 0.12; }); }
        const cc = [0xff6b6b, 0xff9f43, 0xf9c74f, 0xff7eb6, 0xb48cff]; for (let i = 0; i < 30; i++) { const a = Math.random() * TAU, rr = 8 + Math.random() * 12, m = new T.Mesh(new T.DodecahedronGeometry(0.5 + Math.random() * 0.6, 0), M(cc[i % 5], { flatShading: true })); m.position.set(Math.cos(a) * rr, 0.3, Math.sin(a) * rr - 3); scene.add(m); }
        for (let i = 0; i < 40; i++) { const b = c.sprite(0xdff4ff, 0.18, (Math.random() - 0.5) * 30, Math.random() * 10, (Math.random() - 0.5) * 20 - 4, null, 0.6); const v = 0.6 + Math.random(); c.updaters.push((dt) => { b.position.y += v * dt; if (b.position.y > 12) b.position.y = 0; }); }
        for (let s = 0; s < 3; s++) { const g = new T.Group(); scene.add(g); for (let i = 0; i < 8; i++) { const f = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), M(cc[(s + i) % 5])); f.scale.set(1.8, 1, 0.6); f.position.set(i * 0.6, Math.sin(i) * 0.4, (i % 3) * 0.4); g.add(f); } g.position.set(-14, 5 + s * 1.5, -10 - s * 3); const k = s * 2; c.updaters.push((dt, tm) => { g.position.x = -16 + ((tm * (1 + s * 0.3) + k * 6) % 32); }); }
      } }
  };

  /* ---------------------------------------------------------------- the puzzles: walk a path from the start, pearls at its corners, rocks off it */
  function puzzleFor(b) {
    const N = b <= 2 ? 5 : b <= 4 ? 6 : 7, seg = b <= 1 ? 1 : b === 2 ? 2 : b === 3 ? 3 : b === 4 ? 4 : 4, minRun = b >= 6 ? 3 : b === 5 ? 2 : 1;
    for (let tries = 0; tries < 400; tries++) { let x = Math.floor(N / 2), y = N - 1, d = 0; const start = { x, y, d }, cells = new Set([x + ',' + y]), pearls = [], cmds = [];
      let ok = true; for (let s = 0; s < seg && ok; s++) { if (s > 0) { const turn = pick([-1, 1]); d = (d + turn + 4) % 4; cmds.push(turn < 0 ? 'L' : 'R'); }
        const run = ri(minRun, b <= 1 ? 3 : b >= 5 ? 4 : 3); for (let k = 0; k < run; k++) { x += DIRS[d][0]; y += DIRS[d][1]; if (x < 0 || y < 0 || x >= N || y >= N || cells.has(x + ',' + y)) { ok = false; break; } cells.add(x + ',' + y); cmds.push('F'); } if (ok && (b <= 2 || s === seg - 1 || s % 2 === 1 || b >= 3)) pearls.push({ x, y }); }
      if (!ok) continue; const need = b <= 2 ? 1 : b === 3 ? 2 : 3; const P = []; for (const p of pearls.slice(-need)) if (!P.some(q => q.x === p.x && q.y === p.y)) P.push(p);
      if (!P.length) continue; const rocks = []; const nr = b <= 1 ? 1 : b <= 3 ? 3 : 5; for (let r = 0; r < 60 && rocks.length < nr; r++) { const rx = ri(0, N - 1), ry = ri(0, N - 1); if (!cells.has(rx + ',' + ry) && !rocks.some(q => q.x === rx && q.y === ry)) rocks.push({ x: rx, y: ry }); }
      /* the shortest program with repeats: runs of the same command pack into one tile and a ×n */
      let packed = 0; for (let i = 0; i < cmds.length;) { let j = i; while (j < cmds.length && cmds[j] === cmds[i]) j++; const run = j - i; packed += run === 1 ? 1 : Math.ceil(run / 3) * 2; i = j; }
      const slots = b >= 5 ? packed + (b === 5 ? 2 : 1) : Math.max(cmds.length + 3, 6);
      return { N, start, pearls: P, rocks, cmds, slots, repeat: b >= 5 }; }
    return { N: 5, start: { x: 2, y: 4, d: 0 }, pearls: [{ x: 2, y: 2 }], rocks: [], cmds: ['F', 'F'], slots: 6, repeat: false };
  }

  const STAGES = {
    gm_robot(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2, P: null, prog: [], running: false };
      const board = new T.Group(); scene.add(board); let TS = 1.4;   /* tile size */
      const at = (x, y) => new T.Vector3((x - (S.P.N - 1) / 2) * TS, 0, (y - (S.P.N - 1) / 2) * TS);
      /* the robot: a round diving bot with a glass dome, a propeller and two lamp eyes */
      const bot = new T.Group(); { const body = new T.Mesh(new T.SphereGeometry(0.45, 24, 16), M(0xffc83a, { metalness: 0.4, roughness: 0.35 })); body.scale.set(1, 0.8, 1.1); body.position.y = 0.5; bot.add(body);
        const dome = new T.Mesh(new T.SphereGeometry(0.28, 20, 12, 0, TAU, 0, PI / 2), new T.MeshStandardMaterial({ color: 0x9ae0ff, transparent: true, opacity: 0.55, roughness: 0.05 })); dome.position.y = 0.78; bot.add(dome);
        for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.09, 10, 8), new T.MeshBasicMaterial({ color: new T.Color(1.6, 2.2, 2.4) })); e.position.set(s * 0.18, 0.55, -0.44); bot.add(e); }
        const prop = new T.Mesh(new T.BoxGeometry(0.5, 0.05, 0.1), M(0x3a3a4a)); prop.position.set(0, 0.5, 0.52); bot.add(prop); bot.userData.prop = prop; for (const s of [-1, 1]) { const fin = new T.Mesh(new T.BoxGeometry(0.06, 0.25, 0.35), M(0xd8434a)); fin.position.set(s * 0.46, 0.5, 0.1); bot.add(fin); } const nose = new T.Mesh(new T.ConeGeometry(0.2, 0.42, 3), new T.MeshBasicMaterial({ color: 0xffd84a })); nose.rotation.x = -PI / 2; nose.position.set(0, 0.08, -0.72); bot.add(nose);   /* a yellow arrow on the floor: the way it faces */
        scene.add(bot); }
      c.updaters.push((dt, tm) => { bot.userData.prop.rotation.z = tm * (S.running ? 20 : 4); if (!S.running) bot.position.y = Math.sin(tm * 2) * 0.05; });
      let pearlObjs = [];
      function build() { const P = S.P; while (board.children.length) board.remove(board.children[0]); pearlObjs = []; TS = K.narrow() ? 1.0 : 1.4;
        for (let y = 0; y < P.N; y++) for (let x = 0; x < P.N; x++) { const tile = new T.Mesh(new T.BoxGeometry(TS * 0.94, 0.12, TS * 0.94), M((x + y) % 2 ? 0x3a9ab8 : 0x4aaac8, { roughness: 0.5, transparent: true, opacity: 0.85 })); tile.position.copy(at(x, y)).setY(0.06); board.add(tile); }
        for (const r of P.rocks) { const m = new T.Mesh(new T.DodecahedronGeometry(TS * 0.38, 0), M(0x6a6a74, { flatShading: true })); m.position.copy(at(r.x, r.y)).setY(TS * 0.3); m.rotation.set(Math.random(), Math.random(), 0); board.add(m); }
        for (const p of P.pearls) { const g = new T.Group(); g.position.copy(at(p.x, p.y)); const shell = new T.Mesh(new T.SphereGeometry(0.38, 16, 8, 0, TAU, 0, PI / 2), M(0xe8c8d8, { side: T.DoubleSide })); shell.scale.y = 0.4; shell.position.y = 0.14; g.add(shell); const pearl = new T.Mesh(new T.SphereGeometry(0.18, 16, 12), M(0xffffff, { metalness: 0.3, roughness: 0.1, emissive: 0x6a6a7a })); pearl.position.y = 0.3; g.add(pearl); c.sprite(0xffffff, 0.7, 0, 0.35, 0, g, 0.22); g.userData = { x: p.x, y: p.y }; board.add(g); pearlObjs.push(g); }
        resetBot(); }
      function resetBot() { const s = S.P.start; S.pos = { x: s.x, y: s.y, d: s.d }; bot.position.copy(at(s.x, s.y)); bot.rotation.set(0, 0, 0); bot.rotation.y = -s.d * PI / 2; for (const g of pearlObjs) g.visible = true; }
      /* the program strip and the command tray */
      let strip = null; const SYM = { F: '↑', L: '↰', R: '↱', 2: '×2', 3: '×3' };
      function drawProg(now, bad) { if (!strip) { strip = document.createElement('div'); strip.className = 'rb-prog'; const host = c.renderer.domElement.parentNode && c.renderer.domElement.parentNode.parentNode; if (host) host.appendChild(strip); }
        strip.replaceChildren(); S.prog.forEach((cmd, i) => { const e = document.createElement('i'); e.textContent = SYM[cmd]; if (i === now) e.className = 'now'; if (i === bad) e.className = 'bad'; strip.appendChild(e); });
        for (let i = S.prog.length; i < S.P.slots; i++) { const e = document.createElement('i'); e.className = 'slot'; strip.appendChild(e); } const em = document.createElement('em'); em.textContent = t('rd_slots', { n: S.P.slots - S.prog.length }); strip.appendChild(em); }
      function tray() { const items = [{ c: 'F', text: '↑', label: t('rd_f') }, { c: 'L', text: '↰', label: t('rd_l') }, { c: 'R', text: '↱', label: t('rd_r') }]; if (S.P.repeat) items.push({ c: '2', text: '×2', label: t('rd_x2') }, { c: '3', text: '×3', label: t('rd_x3') }); items.push({ c: 'undo', text: '⌫', label: t('rd_undo') });
        K.tray(items, j => { if (S.running) return; const it = items[j]; if (it.c === 'undo') S.prog.pop(); else if (S.prog.length < S.P.slots) { if ((it.c === '2' || it.c === '3') && (!S.prog.length || /[23]/.test(S.prog[S.prog.length - 1]))) { K.sfx('wrong'); return; } S.prog.push(it.c); } drawProg(); if (S.prog.length) K.ready(); }); }
      /* run: expand the repeats, step the robot, check each cell */
      const expand = prog => { const out = []; prog.forEach((cmd, i) => { if (cmd === '2' || cmd === '3') { const prev = out[out.length - 1]; for (let k = 1; k < +cmd; k++) out.push(Object.assign({}, prev)); } else out.push({ c: cmd, i }); }); return out; };
      async function run() { S.running = true; resetBot(); const steps = expand(S.prog), got = new Set(); let bad = -1, why = null;
        for (const st of steps) { drawProg(st.i); if (!K.alive()) return null;
          if (st.c === 'L' || st.c === 'R') { const d0 = S.pos.d; S.pos.d = (S.pos.d + (st.c === 'L' ? 3 : 1)) % 4; const r0 = bot.rotation.y, r1 = r0 + (st.c === 'L' ? PI / 2 : -PI / 2); await K.anim(0.35, k => { bot.rotation.y = r0 + (r1 - r0) * K.ease(k); }); void d0; continue; }
          const nx = S.pos.x + DIRS[S.pos.d][0], ny = S.pos.y + DIRS[S.pos.d][1];
          if (nx < 0 || ny < 0 || nx >= S.P.N || ny >= S.P.N) { bad = st.i; why = 'edge'; } else if (S.P.rocks.some(r => r.x === nx && r.y === ny)) { bad = st.i; why = 'rock'; }
          if (bad >= 0) { const a = bot.position.clone(), b2 = a.clone().add(new T.Vector3(DIRS[S.pos.d][0], 0, DIRS[S.pos.d][1]).multiplyScalar(TS * 0.35)); K.sfx('wrong'); await K.anim(0.4, k => { bot.position.lerpVectors(a, b2, Math.sin(k * PI)); }); break; }
          const a = bot.position.clone(), b2 = at(nx, ny); await K.anim(0.42, k => { bot.position.lerpVectors(a, b2, K.ease(k)); bot.position.y = Math.sin(k * PI) * 0.12; }); S.pos.x = nx; S.pos.y = ny;
          const pe = pearlObjs.find(g => g.visible && g.userData.x === nx && g.userData.y === ny); if (pe) { pe.visible = false; got.add(pe); K.sfx('coin'); c.burst(pe.position.clone().setY(0.5), 0xffffff, 10); } }
        drawProg(-1, bad); S.running = false; return { all: got.size === pearlObjs.length, got: got.size, bad, why }; }
      async function dive(i, n, kick) { S.P = puzzleFor(S.band); S.prog = []; build(); drawProg(); tray();
        K.tell(kick, t(S.P.repeat ? 'rd_taskRep' : 'rd_task', { n: S.P.pearls.length, s: S.P.slots })); K.hint(() => K.tell(kick, t('rd_hint', { f: S.P.cmds.slice(0, 3).map(x => SYM[x]).join(' ') })));
        let tries = 0; for (;;) { await K.act(t('rd_run'), { wait: !S.prog.length }); if (!K.alive()) return null; tries++; const r = await run(); if (!r || !K.alive()) return null;
          if (r.all) { K.sfx('correct'); K.tell(kick, t('rd_yes')); await K.wait(1.2); K.hint(null); K.tray(null); return tries === 1 ? 1 : tries === 2 ? 2 : 3; }
          K.tell(kick, r.bad >= 0 ? t(r.why === 'rock' ? 'rd_rock' : 'rd_edge', { i: r.bad + 1 }) : t('rd_missed', { n: pearlObjs.length - r.got })); await K.wait(1.6); resetBot(); tray(); drawProg(); } }
      function frame(a) { return a < 1.05 ? { pos: [0, 19, 9.4], look: [0, 0, 0.4], fov: 52 } : { pos: [0, 10.8, 9.6], look: [0, 0, 3.0], fov: 52 }; }   /* the board in the upper part of the screen, clear of the program strip and the tray */
      async function play(api) { K.mount(api); S.band = Math.max(1, Math.min(6, api.band || 2)); window.__robot = { S, expand }; const N = 5, done = []; let pts = 0; api.pips(N, done); S.P = puzzleFor(S.band); build();
        const nm = t('ag_robot'); await K.intro(async () => { K.tell(nm, t('rd_hi')); await K.act(t('rd_start')); }); if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const r = await dive(i, N, t('rd_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 6 : 3; done.push(r === 1); api.pips(N, done); }
        if (strip) strip.remove(); strip = null; const right = done.filter(Boolean).length; K.tell(nm, t('rd_win')); await K.wait(1.4);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('rd_win') }); }
      function dispose() { K.dispose(); if (strip) strip.remove(); strip = null; }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  const STR = {
    en: { rd_hi: 'Program the diving robot! Tap the command tiles to build its program: ↑ one tile forward, ↰ turn left, ↱ turn right. Then press Run. It collects every pearl it passes.', rd_start: 'Dive!', rd_n: 'Dive {i} of {n}',
      rd_task: 'Collect {n} pearl(s). Build the program, then Run.', rd_taskRep: 'Collect {n} pearls with only {s} tiles: use ×2 and ×3 to repeat the tile before them.', rd_slots: '{n} left',
      rd_f: 'Forward', rd_l: 'Turn left', rd_r: 'Turn right', rd_x2: 'Repeat the last tile 2 times', rd_x3: 'Repeat the last tile 3 times', rd_undo: 'Remove the last tile', rd_run: 'Run ▶',
      rd_yes: 'Every pearl collected! Clean code!', rd_rock: 'Bonk! Tile {i} drove into a rock. Fix the program and run again.', rd_edge: 'Tile {i} drives off the edge. Fix the program and run again.', rd_missed: 'The program ended with {n} pearl(s) left. Add more tiles.',
      rd_hint: 'Stand where the robot stands and face where it faces. Its program could start: {f}', rd_win: 'Five dives, every pearl home. You are a coder!' },
    he: { rd_hi: 'מתכנתים את רובוט הצלילה! נוגעים באריחי הפקודות כדי לבנות לו תוכנית: ↑ צעד קדימה, ↰ פונים שמאלה, ↱ פונים ימינה. ואז לוחצים הרצה. הוא אוסף כל פנינה שהוא עובר עליה.', rd_start: 'צוללים!', rd_n: 'צלילה {i} מתוך {n}',
      rd_task: 'אוספים {n} פנינים. בונים את התוכנית ואז מריצים.', rd_taskRep: 'אוספים {n} פנינים בעזרת {s} אריחים בלבד: ×2 ו־×3 חוזרים על האריח שלפניהם.', rd_slots: 'נשארו {n}',
      rd_f: 'קדימה', rd_l: 'פונים שמאלה', rd_r: 'פונים ימינה', rd_x2: 'חוזרים על האריח האחרון פעמיים', rd_x3: 'חוזרים על האריח האחרון 3 פעמים', rd_undo: 'מוחקים את האריח האחרון', rd_run: 'הרצה ▶',
      rd_yes: 'כל הפנינים נאספו! קוד נקי!', rd_rock: 'בום! אריח {i} נכנס בסלע. מתקנים את התוכנית ומריצים שוב.', rd_edge: 'אריח {i} יוצא מהלוח. מתקנים את התוכנית ומריצים שוב.', rd_missed: 'התוכנית נגמרה ונשארו {n} פנינים. מוסיפים עוד אריחים.',
      rd_hint: 'עומדים במקום של הרובוט ומסתכלים לאן שהוא מסתכל. התוכנית שלו יכולה להתחיל כך: {f}', rd_win: 'חמש צלילות, כל הפנינים בבית. אתם מתכנתים!' }
  };
  KQRealms.define('game-robot', { strings: STR, themes: THEMES, stages: STAGES });
})();
