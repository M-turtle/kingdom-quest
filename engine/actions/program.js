/* Kingdom Quest — engine action "program the robot" (like CodeMonkey and Lightbot; the arcade's Robot Diver grew into this).
   Put moves in a row (forward, turn left, turn right; after the twist ×2 and ×3, which repeat the move before them), press play and
   watch the hero follow the plan exactly. A bump is a funny wobble and a walk back to the start; the plan stays, so the child fixes it.
   Four routes a round, one new idea at a time; the next route comes by itself (no "Next" presses: Yoni 2026-10-19). */
(function () {
  'use strict';
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];   /* east, south (towards the camera), west, north */
  const ang = d => Math.atan2(-DIRS[d][1], DIRS[d][0]);
  const DOCK_CSS = `
.kqe-dock{position:absolute; left:50%; transform:translateX(-50%); bottom:calc(14px + env(safe-area-inset-bottom,0px)); width:min(760px, calc(100% - 28px)); background:rgba(255,250,240,.96); border-radius:26px; padding:12px; display:grid; gap:10px; box-shadow:0 10px 30px rgba(0,0,0,.22)}
.kqe-slots{display:flex; flex-wrap:wrap; gap:8px; justify-content:center; padding:8px; border-radius:18px; background:#f1e4c6}
.kqe-slot{width:58px; height:58px; border-radius:14px; border:2.5px dashed #c9b58a; display:grid; place-items:center; font:800 24px Rubik,system-ui,sans-serif; color:#2b1c10; background:transparent; padding:0; cursor:pointer}
.kqe-slot.full{border:0; background:#fffaf0; box-shadow:0 3px 0 #c9b58a}
.kqe-slot .kqe-g{font-size:30px}
.kqe-slot.now{background:#ffe7a3; transform:translateY(-4px); box-shadow:0 6px 0 #e0b84f}
.kqe-slot.bump{background:#ffd8a8; animation:kqe-shake .4s ease}
@keyframes kqe-shake{20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)}}
.kqe-slots.nope{animation:kqe-shake .35s ease}
.kqe-cmds{display:flex; flex-wrap:wrap; gap:10px; justify-content:center; align-items:center}
.kqe-cmd{width:72px; height:72px; border-radius:20px; font-size:24px}
.kqe-cmd .kqe-g{font-size:36px}
.kqe-cmd.rep{background:#d8f3dc; box-shadow:0 4px 0 #95d5b2, 0 8px 18px rgba(0,0,0,.14); font-size:26px}
.kqe-cmd.pulse{animation:kqe-pulse 1.1s ease-in-out infinite}
@keyframes kqe-pulse{50%{transform:scale(1.1); box-shadow:0 0 0 8px rgba(255,209,102,.6)}}
.kqe-run{width:96px; height:72px; border-radius:20px; background:#2f9e44; color:#fff; box-shadow:0 4px 0 #1f6e2f, 0 8px 18px rgba(0,0,0,.18)}
.kqe-run .kqe-g{font-size:40px}
.kqe-dock.busy .kqe-cmd, .kqe-dock.busy .kqe-run, .kqe-dock.busy .kqe-slot{pointer-events:none}
.kqe-dock.busy .kqe-cmds{opacity:.55}
@media (prefers-reduced-motion: reduce){ .kqe-cmd.pulse, .kqe-slot.bump, .kqe-slots.nope{animation:none} }`;

  KQE.action('program', {
    name: { he: 'מתכנתים את הרובוט', en: 'Program the robot' }, like: 'CodeMonkey · Lightbot', kind: 'slow', pic: 'robot',
    start(ctx) {
      const { T, scene, camera, kit, skill, rng, L } = ctx, ROUTES = 4;
      let li = 0, repeats = skill.repeatsFrom === 0, twoTargets = ctx.level >= 3, spec = null, board = null, hero = null, targets = [], running = false, dir = 0, first = true;
      let collected = 0, steps = 0; const prog = [], pics = [], tweens = [];
      const rnd = n => Math.floor(rng() * n);

      // ---------- a route: built from a plan of straights and turns, so it always has an answer ----------
      function gen(i) {
        const turn = () => ({ t: rng() < 0.5 ? 'L' : 'R' }), N = repeats ? 6 : 5;
        /* the plan's turns are drawn again on every try: two turns the same way make a U that fits the board, a zig-zag may not */
        const plan = k => { const segs = !repeats ? (k === 0 ? [{ f: 2 + rnd(2) }] : [{ f: 1 + rnd(3) }, turn(), { f: 1 + rnd(3) }])
            : [[{ f: 3 }], [{ f: 2 }, turn(), { f: 3 }], [{ f: 3 }, turn(), { f: 3 }], [{ f: 3 }, turn(), { f: 2 }, turn(), { f: 3 }]][Math.min(3, k)];
          if (twoTargets && segs.length > 1) segs[0].tgt = true; return segs; };
        for (let tries = 0; tries < 800; tries++) {
          const segs = plan(tries < 700 ? i : Math.max(0, i - 1));
          let x = rnd(N), z = rnd(N), d = rnd(4); const start = { x, z, d }, path = [[x, z]], tg = []; let ok = true, firstEnd = null;
          for (const s of segs) {
            if (s.t) { d = s.t === 'L' ? (d + 3) % 4 : (d + 1) % 4; continue; }
            for (let k = 0; k < s.f; k++) { x += DIRS[d][0]; z += DIRS[d][1]; if (x < 0 || z < 0 || x >= N || z >= N || path.some(p => p[0] === x && p[1] === z)) { ok = false; break; } path.push([x, z]); }
            if (!ok) break; if (!firstEnd) firstEnd = [x + DIRS[d][0], z + DIRS[d][1]]; if (s.tgt) tg.push([x, z]);
          }
          if (!ok) continue; tg.push([x, z]);
          const onPath = (a, b) => path.some(p => p[0] === a && p[1] === b), inside = (a, b) => a >= 0 && b >= 0 && a < N && b < N, rocks = [];
          if (segs.length > 1 && firstEnd && inside(firstEnd[0], firstEnd[1]) && !onPath(firstEnd[0], firstEnd[1])) rocks.push(firstEnd);   /* overshoot the turn and you bump */
          for (let k = 0; k < 30 && rocks.length < 2 + rnd(3); k++) { const a = rnd(N), b = rnd(N); if (!onPath(a, b) && !rocks.some(r => r[0] === a && r[1] === b)) rocks.push([a, b]); }
          const solution = []; for (const s of segs) { if (s.t) solution.push(s.t); else if (repeats && s.f >= 2) solution.push('F', 'X' + s.f); else for (let k = 0; k < s.f; k++) solution.push('F'); }
          return { N, start, path, targets: tg, rocks, solution, slots: repeats ? solution.length : solution.length + 2 };
        }
        const m = Math.floor(N / 2);   /* never reached in practice; a route must always exist */
        return { N, start: { x: 0, z: m, d: 0 }, path: [[0, m], [1, m], [2, m], [3, m]], targets: [[3, m]], rocks: [], solution: repeats ? ['F', 'X3'] : ['F', 'F', 'F'], slots: repeats ? 2 : 5 };
      }

      // ---------- the board ----------
      const M = (c, o) => KQE.mat(c, o);
      function cell(x, z) { const off = (spec.N - 1) / 2; return new T.Vector3(x - off, 0.11, z - off); }
      function buildBoard() {
        if (board) { scene.remove(board); }
        board = new T.Group(); scene.add(board); targets = [];
        const N = spec.N, base = KQE.mesh(new T.BoxGeometry(N + 0.6, 0.6, N + 0.6), M(kit.base)); base.position.y = -0.31; board.add(base);
        for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) { const t = KQE.mesh(new T.BoxGeometry(0.94, 0.22, 0.94), M((x + z) % 2 ? kit.tileA : kit.tileB)); t.position.copy(cell(x, z)).setY(0); board.add(t); }
        const s = spec.start, ring = new T.Mesh(new T.RingGeometry(0.3, 0.42, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); ring.rotation.x = -Math.PI / 2; ring.position.copy(cell(s.x, s.z)).setY(0.115); board.add(ring);
        for (const [x, z] of spec.rocks) { const r = kit.rock(); r.scale.setScalar(0.62); r.position.copy(cell(x, z)); board.add(r); }
        for (const [x, z] of spec.targets) { const g = kit.collect(); g.position.copy(cell(x, z)); board.add(g); targets.push({ x, z, g, got: false, spin: rng() * 6 }); }
        hero = kit.hero(); hero.scale.setScalar(0.95); board.add(hero); place();
        frameCam();
      }
      function place() { const s = spec.start; dir = s.d; hero.position.copy(cell(s.x, s.z)); if (kit.fly) hero.position.y += 0.35; hero.rotation.set(0, ang(dir), 0); hero.scale.setScalar(0.95);
        for (const t of targets) { t.got = false; t.g.visible = true; t.g.scale.setScalar(1); t.g.position.copy(cell(t.x, t.z)); } }
      function frameCam() { const N = spec.N, narrow = camera.aspect < 1.05, d = N * (narrow ? 2.15 : 1.42) + 1.6; camera.position.set(0, d * 0.98, d * 0.74); camera.lookAt(0, 0, narrow ? 1.9 : 1.25); }

      // ---------- tweens: every move is a small animation the update loop plays ----------
      const wait = ms => new Promise(r => setTimeout(r, ms));
      function tween(dur, fn) { return new Promise(res => tweens.push({ t: 0, dur, fn, res })); }
      const hop = (a, b) => tween(0.42, k => { hero.position.lerpVectors(a, b, k); hero.position.y = a.y + Math.sin(k * Math.PI) * 0.28; });
      const spin = (a0, a1) => tween(0.3, k => { hero.rotation.y = a0 + (a1 - a0) * k; });
      const bump = (a, b) => tween(0.5, k => { const q = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6; hero.position.lerpVectors(a, b, q * 0.32); hero.rotation.z = Math.sin(k * 22) * 0.18 * (1 - k); });
      const shrug = () => tween(0.7, k => { hero.rotation.y = ang(dir) + k * Math.PI * 2; hero.position.y = (kit.fly ? 0.46 : 0.11) + Math.sin(k * Math.PI) * 0.4; });
      const cheer = () => tween(0.8, k => { hero.position.y = (kit.fly ? 0.46 : 0.11) + Math.abs(Math.sin(k * Math.PI * 2)) * 0.5; hero.rotation.y = ang(dir) + k * Math.PI * 2; });

      // ---------- the dock: the plan (slots) and the move tiles ----------
      if (!document.getElementById('kqe-dock-css')) { const s = ctx.el('style'); s.id = 'kqe-dock-css'; s.textContent = DOCK_CSS; document.head.appendChild(s); }
      const dock = ctx.el('div', 'kqe-dock'), slotsEl = ctx.el('div', 'kqe-slots'), cmds = ctx.el('div', 'kqe-cmds'); dock.append(slotsEl, cmds); ctx.stage.appendChild(dock);
      const face = (c, host) => { if (c === 'X2' || c === 'X3') { const t = ctx.el('span', null, '×' + c[1]); t.dir = 'ltr'; host.appendChild(t); } else host.appendChild(ctx.glyph({ F: 'up', L: 'left', R: 'right' }[c])); };
      const LABEL = { F: { he: 'צעד קדימה', en: 'Step forward' }, L: { he: 'פונים שמאלה', en: 'Turn left' }, R: { he: 'פונים ימינה', en: 'Turn right' }, X2: { he: 'עוד פעם, פעמיים', en: 'Repeat twice' }, X3: { he: 'שלוש פעמים', en: 'Repeat three times' } };
      function renderDock(now, bumped) {
        slotsEl.replaceChildren(); for (let i = 0; i < spec.slots; i++) { const c = prog[i], b = ctx.el('button', 'kqe-slot' + (c ? ' full' : '') + (i === now ? ' now' : '') + (i === bumped ? ' bump' : '')); b.type = 'button';
          if (c) { face(c, b); b.setAttribute('aria-label', L(LABEL[c])); b.onclick = () => { if (running) return; ctx.tap(); prog.splice(i, 1); renderDock(); }; } slotsEl.appendChild(b); }
        cmds.replaceChildren();
        for (const c of ['F', 'L', 'R'].concat(repeats ? ['X2', 'X3'] : [])) { const b = ctx.el('button', 'kqe-btn kqe-cmd' + (c[0] === 'X' ? ' rep' : '') + (first && c === 'F' && !prog.length ? ' pulse' : '')); b.type = 'button'; b.dataset.cmd = c; b.setAttribute('aria-label', L(LABEL[c])); face(c, b);
          b.onclick = () => { if (running) return; if (prog.length >= spec.slots) { slotsEl.classList.remove('nope'); void slotsEl.offsetWidth; slotsEl.classList.add('nope'); return; } ctx.tap(); first = false; prog.push(c); renderDock(); }; cmds.appendChild(b); }
        const er = ctx.el('button', 'kqe-btn kqe-cmd'); er.type = 'button'; er.dataset.cmd = 'erase'; er.setAttribute('aria-label', L({ he: 'למחוק את האחרון', en: 'Remove the last move' })); er.appendChild(ctx.glyph('erase')); er.onclick = () => { if (running || !prog.length) return; ctx.tap(); prog.pop(); renderDock(); };
        const go = ctx.el('button', 'kqe-btn kqe-run'); go.type = 'button'; go.dataset.cmd = 'run'; go.setAttribute('aria-label', L({ he: 'להריץ את התוכנית', en: 'Run the plan' })); go.appendChild(ctx.glyph('play')); go.onclick = run;
        cmds.append(er, go);
      }

      // ---------- running the plan ----------
      function expand(p) { const out = []; let prev = null; p.forEach((c, i) => { if (c[0] === 'X') { if (prev) for (let k = 1; k < +c[1]; k++) out.push({ c: prev, slot: i }); } else { out.push({ c, slot: i }); prev = c; } }); return out; }
      const rockAt = (x, z) => spec.rocks.some(r => r[0] === x && r[1] === z);
      async function run() {
        if (running || !prog.length) return; running = true; dock.classList.add('busy'); ctx.tap();
        let x = spec.start.x, z = spec.start.z; const plan = expand(prog), lift = kit.fly ? 0.35 : 0;
        for (const s of plan) {
          renderDock(s.slot);
          if (s.c !== 'F') { const nd = s.c === 'L' ? (dir + 3) % 4 : (dir + 1) % 4, a0 = hero.rotation.y; await spin(a0, a0 + (s.c === 'L' ? Math.PI / 2 : -Math.PI / 2)); dir = nd; continue; }
          const nx = x + DIRS[dir][0], nz = z + DIRS[dir][1], from = cell(x, z).setY(0.11 + lift);
          if (nx < 0 || nz < 0 || nx >= spec.N || nz >= spec.N || rockAt(nx, nz)) {
            await bump(from, cell(nx, nz).setY(0.11 + lift)); ctx.oops(hero.position.clone().add(new T.Vector3(0, 0.6, 0))); renderDock(-1, s.slot);
            await wait(900); place(); running = false; dock.classList.remove('busy'); renderDock(); return; }
          await hop(from, cell(nx, nz).setY(0.11 + lift)); x = nx; z = nz; steps++;
          const t = targets.find(q => q.x === x && q.z === z && !q.got); if (t) { t.got = true; t.fly = 0; ctx.good(cell(x, z).setY(0.8)); }
        }
        if (targets.every(q => q.got)) {
          collected += targets.length; for (const q of targets) pics.push(kit.collectPic); renderDock(); await cheer(); ctx.good(hero.position.clone().setY(1), true);
          li++; ctx.progress(li / ROUTES);
          if (li >= ROUTES) { ctx.done({ pics, title: { he: 'כל המסלולים עבדו', en: 'Every route worked' }, line: { he: collected + ' ' + kit.collectWord.he + ' נאספו · ' + steps + ' צעדים', en: collected + ' ' + kit.collectWord.en + ' collected · ' + steps + ' steps' } }); return; }
          await wait(900); prog.length = 0; spec = gen(li); buildBoard();
        } else { await shrug(); ctx.oops(hero.position.clone().setY(0.8)); await wait(500); place(); }
        running = false; dock.classList.remove('busy'); renderDock();
      }

      spec = gen(0); buildBoard(); renderDock();
      const ambient = dt => { const t = performance.now() / 1000;
        for (const q of targets) { if (q.got) { if (q.g.visible) { q.fly = (q.fly || 0) + dt; q.g.position.y += dt * 4; q.g.rotation.y += dt * 12; q.g.scale.setScalar(Math.max(0, 1 - q.fly * 2)); if (q.fly > 0.5) q.g.visible = false; } } else { q.g.rotation.y = t * 1.5 + q.spin; q.g.position.y = 0.11 + Math.sin(t * 2 + q.spin) * 0.08; } }
        if (hero.userData.spin) hero.userData.spin.rotation.x += dt * 14;
        if (hero.userData.wings) hero.userData.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * (0.9 + Math.sin(t * 9) * 0.5); }); };
      return {
        twist() { if (!repeats) { repeats = true; renderDock(); return { pic: 'refresh', say: { he: 'מהלך חדש: \u2066×2\u2069 ו-\u2066×3\u2069 חוזרים על המהלך שלפניהם', en: 'New tiles: ×2 and ×3 repeat the move before them' } }; }
          twoTargets = true; return { pic: kit.collectPic, say: { he: 'עכשיו שני אוצרות בכל מסלול', en: 'Now two treasures on every route' } }; },
        idle(dt) { ambient(dt); },
        update(dt) { ambient(dt); for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { tweens.splice(i, 1); w.res(); } } },
        resize() { if (spec) frameCam(); },
        destroy() { dock.remove(); },
        probe() { return { li, repeats, spec, prog: prog.slice(), running }; },
        genFor(i, rep, two) { const a = repeats, b = twoTargets; repeats = rep; twoTargets = two; const s = gen(i); repeats = a; twoTargets = b; return s; }   /* test hook */
      };
    }
  });
})();
