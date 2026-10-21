/* Kingdom Quest — engine action "swallow & grow" (like Hole.io: eat things, the hole grows, now it can eat bigger things).
   Drag the hole round the place. Small enough + the skill says it fits → it tips in and the hole grows. Fits the size but not the skill →
   the hole spits it out with a boing (never a red X). Too big → it wobbles: grow first. Grow enough and the goal object (the barn, the
   lighthouse, the ship) can be swallowed: that ends the round. The skill decides everything about right and wrong; this file only moves. */
(function () {
  'use strict';
  KQE.action('swallow', {
    name: { he: 'בולעים וגדלים', en: 'Swallow & grow' }, like: 'Hole.io', kind: 'fast', pic: 'swirl',
    start(ctx) {
      const { T, scene, camera, kit, skill, rng, level } = ctx;
      const st = skill.init(level, ctx.lang()), FIELD = kit.field, N = 64 + level * 6;
      camera.fov = 40; camera.updateProjectionMatrix();
      const R0 = 0.82, goalDef = kit.goal(), GS = goalDef.size, RG = GS / 0.9 + 0.05, NEED = 16 + level * 3, STEP = (RG - R0) / NEED;
      let R = R0, Rshow = R0, finished = false, burp = 0, eatenCount = 0;
      const eaten = [], items = [], pos = new T.Vector3(0, 0, FIELD * 0.45), aim = pos.clone(), keys = {};

      /* the hole: a black disc, a soft inner ring and a rim in the place's colour; the place's hero sits on the rim */
      const hole = new T.Group(); scene.add(hole);
      const disc = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: 0x0b0a08 })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03; hole.add(disc);
      const inner = new T.Mesh(new T.RingGeometry(0.72, 1, 48), new T.MeshBasicMaterial({ color: 0x24201a, transparent: true, opacity: 0.9 })); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.035; hole.add(inner);
      const rim = new T.Mesh(new T.TorusGeometry(1, 0.07, 8, 48), new T.MeshStandardMaterial({ color: kit.rim, roughness: 0.7 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.05; hole.add(rim);
      let swirl = null; if (kit.swirl) { swirl = new T.Mesh(new T.RingGeometry(0.2, 0.95, 48, 1, 0, Math.PI * 1.6), new T.MeshBasicMaterial({ color: 0x5ec8e5, transparent: true, opacity: 0.35, side: T.DoubleSide })); swirl.rotation.x = -Math.PI / 2; swirl.position.y = 0.04; hole.add(swirl); }
      let hero = null; if (kit.hero) { hero = kit.hero(); hero.scale.setScalar(0.85); scene.add(hero); }

      /* the goal object waits at the far side of the field */
      const goal = { g: goalDef.g, s: GS, pos: new T.Vector3(0, 0, -FIELD * 0.55), state: 'idle', t: 0 }; goal.g.position.copy(goal.pos); scene.add(goal.g);
      const glow = new T.Mesh(new T.RingGeometry(GS * 1.05, GS * 1.25, 48), new T.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0 })); glow.rotation.x = -Math.PI / 2; glow.position.copy(goal.pos).setY(0.04); scene.add(glow);

      /* the side lane: the skill's own panel (the ten-frame, the table, the letter) beside the work */
      const panel = skill.panel(ctx, st); ctx.lane.appendChild(panel.el);

      // ---------- items ----------
      function sizeClass() { const x = rng(); return x < 0.58 ? 0.34 + rng() * 0.2 : x < 0.86 ? 0.72 + rng() * 0.26 : 1.3 + rng() * 0.38; }
      function body(s) { const set = s < 0.6 ? kit.small : s < 1.1 ? kit.mid : kit.big, b = set[Math.floor(rng() * set.length)](); b.scale.setScalar(s); return b; }
      function faceSprite(it) {
        const f = skill.face(it.d, st), map = f.pic ? KQIcons.iconTexture(f.pic) : ctx.badge(f);
        const sp = new T.Sprite(new T.SpriteMaterial({ map, transparent: true, depthWrite: false }));
        const k = f.pic ? 0.95 + it.s * 0.5 : 0.62 + it.s * 0.34; sp.scale.set(k, k, 1); sp.position.y = it.s * (f.pic ? 1.7 : 1.6) + k * 0.5; sp.renderOrder = 2; return sp;
      }
      function setFace(it) { if (it.face) { it.g.remove(it.face); if (it.face.material.map) it.face.material.map.dispose(); it.face.material.dispose(); } it.face = faceSprite(it); it.g.add(it.face); }
      function spot(s) { for (let k = 0; k < 40; k++) { const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * (FIELD - s - 0.4), x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (Math.hypot(x - pos.x, z - pos.z) < R + s + 2.2) continue; if (Math.hypot(x - goal.pos.x, z - goal.pos.z) < GS + s + 1.2) continue;
        if (items.some(o => o.state !== 'gone' && Math.hypot(x - o.g.position.x, z - o.g.position.z) < s + o.s + 0.35)) continue; return [x, z]; } return null; }
      function add(mustFit) { const s = mustFit ? 0.34 + rng() * 0.2 : sizeClass(), p = spot(s); if (!p) return null;
        const it = { s, d: skill.spawn(st, rng, mustFit), g: new T.Group(), state: 'idle', t: 0, v: new T.Vector3(), cool: 0, bob: rng() * 6 };
        const b = body(s); it.g.add(b); it.g.position.set(p[0], 0, p[1]); it.g.rotation.y = rng() * Math.PI * 2; it.b = b; setFace(it); scene.add(it.g); items.push(it); return it; }
      for (let i = 0; i < N; i++) add(i < 8);
      /* there are always a few things the hole can swallow right now: re-deal the face of a far one when there aren't */
      function keepFair() { const live = items.filter(o => o.state === 'idle');
        const ok = live.filter(o => o.s < R * 0.9 && skill.fits(o.d, st)).length;
        if (ok >= 5) return; const far = live.filter(o => o.s < R * 0.9 && !skill.fits(o.d, st)).sort((a, b) => b.g.position.distanceTo(pos) - a.g.position.distanceTo(pos));
        for (let i = 0; i < 5 - ok && i < far.length; i++) { far[i].d = skill.spawn(st, rng, true); setFace(far[i]); } }
      keepFair();

      // ---------- control: drag anywhere, the hole follows; arrow keys work too ----------
      const ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), ndc = new T.Vector2(), hit = new T.Vector3(); let down = false;
      const cv = ctx.renderer.domElement;
      function toGround(e) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(plane, hit)) aim.copy(hit); }
      const pd = e => { down = true; ctx.tap(); toGround(e); }, pm = e => { if (down) toGround(e); }, pu = () => { down = false; };
      cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
      const kd = e => { keys[e.key] = true; }, ku = e => { keys[e.key] = false; }; window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

      // ---------- eating ----------
      function swallowIt(it) { it.state = 'sink'; it.t = 0; it.from = it.g.position.clone(); const r = skill.eat(it.d, st); eatenCount++; eaten.push(skill.itemPic ? skill.itemPic(it.d) : kit.itemPic);
        const w = it.s > 1.1 ? 2 : it.s > 0.6 ? 1.4 : 1; R = Math.min(RG + 0.3, R + STEP * w + (r.full ? STEP * 1.6 : 0));
        const at = it.g.position.clone().setY(0.5); ctx.good(at, !!r.full); if (r.full) { panel.render(true); setTimeout(() => panel.render(), 650); } else panel.render();
        ctx.progress(Math.min(0.97, (R - R0) / (RG - R0))); }
      function spit(it) { it.state = 'fly'; it.t = 0; const away = it.g.position.clone().sub(pos).setY(0); if (away.lengthSq() < 0.01) away.set(rng() - 0.5, 0, rng() - 0.5); away.normalize();
        it.v.copy(away).multiplyScalar(3.2 + R * 0.8).setY(5.2); burp = 1; ctx.oops(it.g.position.clone().setY(0.6)); }

      return {
        twist() { const tw = skill.twist(st); items.forEach(o => { if (o.state === 'idle') setFace(o); }); panel.render(); keepFair(); return tw; },
        idle(dt) { this.look(dt, true); },
        /* a calm, high camera that pulls back as the hole grows (Yoni 2026-10-19: no car-sick zooms) */
        look(dt, snap) { const narrow = camera.aspect < 1.05 ? 1.35 : 1, h = (9 + R * 3.2) * narrow, back = (4.6 + R * 1.6) * narrow, want = new T.Vector3(pos.x, h, pos.z + back), k = snap ? 1 : 1 - Math.exp(-2.5 * dt);
          camera.position.lerp(want, k); camera.lookAt(pos.x, 0, pos.z - 0.6); },
        update(dt) {
          /* move */
          const kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), kz = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
          if (kx || kz) aim.set(pos.x + kx * 3, 0, pos.z + kz * 3);
          const to = aim.clone().sub(pos).setY(0), d = to.length(), sp = (4.2 + R * 1.3) * dt; if (d > 0.05) pos.addScaledVector(to.normalize(), Math.min(d, sp));
          const lim = FIELD - R * 0.4, dc = Math.hypot(pos.x, pos.z); if (dc > lim) { pos.x *= lim / dc; pos.z *= lim / dc; }
          Rshow += (R - Rshow) * (1 - Math.exp(-6 * dt)); burp = Math.max(0, burp - dt * 3);
          const sq = 1 + Math.sin(burp * Math.PI) * 0.18; hole.position.set(pos.x, 0, pos.z); disc.scale.set(Rshow * sq, Rshow / sq, 1); inner.scale.copy(disc.scale); rim.scale.set(Rshow * sq, Rshow / sq, 1);
          if (swirl) swirl.rotation.z += dt * 2.4;
          if (hero) { hero.position.set(pos.x + Rshow * 0.78, 0.02, pos.z - Rshow * 0.62); hero.rotation.y = -0.6; hero.position.y = Math.abs(Math.sin(performance.now() / 260)) * 0.12; }
          this.look(dt);
          /* items */
          const t = performance.now() / 1000;
          for (const it of items) {
            if (it.state === 'gone') continue;
            const p = it.g.position, dist = Math.hypot(p.x - pos.x, p.z - pos.z); it.cool = Math.max(0, it.cool - dt);
            if (it.state === 'idle') {
              if (kit.bob) it.b.position.y = Math.sin(t * 1.6 + it.bob) * 0.08;
              it.face.position.x = 0; it.b.rotation.z = 0;
              if (dist < R - it.s * 0.3 && it.cool <= 0) { if (it.s < R * 0.9) { if (skill.fits(it.d, st)) swallowIt(it); else spit(it); } else { it.state = 'wobble'; it.t = 0; it.cool = 1.2; } }
            } else if (it.state === 'wobble') { it.t += dt; it.b.rotation.z = Math.sin(it.t * 30) * 0.08 * (1 - it.t / 0.5); if (it.t > 0.5) { it.state = 'idle'; it.b.rotation.z = 0; } }
            else if (it.state === 'sink') { it.t += dt; const k = Math.min(1, it.t / 0.45); p.x = it.from.x + (pos.x - it.from.x) * k * 0.8; p.z = it.from.z + (pos.z - it.from.z) * k * 0.8; p.y = -k * k * (it.s * 2.6 + 0.6); it.g.rotation.x = k * 1.2; it.g.scale.setScalar(1 - k * 0.55);
              if (k >= 1) { it.state = 'gone'; scene.remove(it.g); setTimeout(() => { if (!finished) { add(false); keepFair(); } }, 700); } }
            else if (it.state === 'fly') { it.t += dt; it.v.y -= 14 * dt; p.addScaledVector(it.v, dt); it.g.rotation.y += dt * 8;
              if (p.y <= 0 && it.t > 0.15) { p.y = 0; const dd = Math.hypot(p.x - pos.x, p.z - pos.z); if (dd < R + it.s + 0.4) { it.v.set((p.x - pos.x) / (dd || 1) * 3, 3, (p.z - pos.z) / (dd || 1) * 3); } else { it.state = 'idle'; it.cool = 0.6; const dc2 = Math.hypot(p.x, p.z); if (dc2 > FIELD - it.s) { p.x *= (FIELD - it.s) / dc2; p.z *= (FIELD - it.s) / dc2; } } } }
          }
          /* the goal object: glows once the hole is big enough, then it can be swallowed */
          const ready = R >= RG - 0.001; glow.material.opacity = ready ? 0.45 + Math.sin(t * 4) * 0.25 : 0;
          const gd = Math.hypot(goal.pos.x - pos.x, goal.pos.z - pos.z);
          if (goal.state === 'idle' && gd < R - GS * 0.3) { if (ready) { goal.state = 'sink'; goal.t = 0; } else if (goal.cool == null || goal.cool <= 0) { goal.cool = 1.5; goal.wob = 0.6; } }
          if (goal.cool > 0) goal.cool -= dt; if (goal.wob > 0) { goal.wob -= dt; goal.g.rotation.z = Math.sin(goal.wob * 30) * 0.03; } else goal.g.rotation.z = 0;
          if (goal.state === 'sink') { goal.t += dt; const k = Math.min(1, goal.t / 1.4); goal.g.position.set(goal.pos.x + (pos.x - goal.pos.x) * k * 0.7, -k * k * 7, goal.pos.z + (pos.z - goal.pos.z) * k * 0.7); goal.g.rotation.x = k * 0.9; glow.material.opacity = 0;
            if (k >= 1 && !finished) { finished = true; scene.remove(goal.g); eaten.push(kit.goalPic); ctx.good(new T.Vector3(pos.x, 1, pos.z), true); ctx.progress(1);
              ctx.done({ pics: eaten, line: skill.made(st, eatenCount), title: { he: 'נבלע!', en: 'Swallowed!' } }); } }
        },
        destroy() { cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); },
        /* test hooks for the driver: where things are and which fit right now */
        probe() { return { R, RG, pos: { x: pos.x, z: pos.z }, goal: { x: goal.pos.x, z: goal.pos.z, state: goal.state }, items: items.filter(o => o.state === 'idle').map(o => ({ x: o.g.position.x, z: o.g.position.z, s: o.s, fits: skill.fits(o.d, st), small: o.s < R * 0.9 })) }; },
        steer(x, z) { aim.set(x, 0, z); }
      };
    }
  });
})();
