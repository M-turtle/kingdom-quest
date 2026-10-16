/* Kingdom Quest — THE GIANT EAGLE (Yoni 2026-09-27: "a very big bird, like a massive eagle … once in a while. If you click on it you
   get to ride it … to the clouds. Once in a while you see a question and then the answers in the clouds. You have to make a quick
   choice or they go away. If you miss three answers you parachute off the eagle back to the meadow. If you succeed you keep going,
   up to 10 questions, getting more points.")
   One file, two places:
     KQEagle.build(T, o)   the eagle itself — a bald eagle (dark feathered body, white head and tail, golden beak) whose wings beat and
                           glide; the map (kingdom3d.js) flies it across the sky now and then, the ride below puts a saddle and a rider on it
     KQEagle.chute(T)      the rider under a striped parachute (the way down after three misses; it also lands on the map)
     the ride              a rooms3d hall ('eagle_sky' theme, 'eagle' stage) registered through KQRealms: the camera sits behind the rider
                           on the eagle's back, answer clouds drift in, the right one bursts into light as the eagle flies through it, a
                           wrong one turns to rain, a slow one drifts away. The hub (index.html) owns the rules — ten questions, three
                           misses — and hands them to the stage in every question's payload (q.x.eagle: { t, fall, last }). */
(function () {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const mat = T => (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));

  /* feathers painted on a canvas: rows of overlapping scallops (tips pointing back), two tones */
  function featherTex(T, a, b, n, rep) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = a; g.fillRect(0, 0, 128, 128);
    const w = 128 / n; for (let r = -1; r <= n + 1; r++) for (let i = -1; i <= n; i++) { const x = i * w + (r % 2 ? w / 2 : 0), y = r * w * 0.82; g.fillStyle = (i * 7 + r * 3) % 5 ? a : b; g.beginPath(); g.ellipse(x + w / 2, y, w * 0.56, w * 0.7, 0, 0, PI); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 1.2; g.stroke(); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
  /* one feather: a slim leaf outline along +y (quill at the origin) */
  function featherGeo(T, len, w) { const s = new T.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(w, len * 0.28, w * 0.62, len * 0.82); s.quadraticCurveTo(w * 0.1, len * 1.06, 0, len); s.quadraticCurveTo(-w * 0.1, len * 1.06, -w * 0.62, len * 0.82); s.quadraticCurveTo(-w, len * 0.28, 0, 0); return new T.ShapeGeometry(s, 10); }
  /* a flat wing panel from an outline in (span, chord) and a little thickness; laid flat, chord pointing forward (+z) */
  function panel(T, pts, m, depth) { const s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: depth || 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 6 }); geo.translate(0, 0, -(depth || 0.07) / 2);
    const mesh = new T.Mesh(geo, m); mesh.rotation.x = PI / 2; mesh.scale.z = -1; return mesh; }   /* shape +y → +z (forward); the flip keeps the top face up */

  /* ------------------------------------------------------------------ the eagle */
  function build(T, o) { o = o || {}; const M = mat(T), root = new T.Group(), body = new T.Group(); root.add(body);
    const brownTex = featherTex(T, '#4a3020', '#5f3d27', 7, [3, 3]), wingTex = featherTex(T, '#3f2a1c', '#56382a', 6, [0.9, 0.9]), whiteTex = featherTex(T, '#f7f3ec', '#e2dccf', 7, [2, 2]);
    const brown = M(0xffffff, { map: brownTex, roughness: 0.86 }), wingM = M(0xffffff, { map: wingTex, roughness: 0.88, side: T.DoubleSide }), covert = M(0x6a4a30, { roughness: 0.85, side: T.DoubleSide }),
      dark = M(0x241a13, { roughness: 0.8, side: T.DoubleSide }), white = M(0xffffff, { map: whiteTex, roughness: 0.75 }), whiteF = M(0xf4f0e8, { roughness: 0.75, side: T.DoubleSide }), gold = M(0xf2b62a, { roughness: 0.42 }), claw = M(0x1a1410, { roughness: 0.4 });
    /* the body: a lathe laid forward (+z), a little flatter than it is wide */
    const prof = [[0.001, -1.75], [0.24, -1.6], [0.48, -1.12], [0.68, -0.42], [0.76, 0.2], [0.72, 0.7], [0.58, 1.1], [0.46, 1.34], [0.001, 1.52]];
    const torso = new T.Mesh(new T.LatheGeometry(prof.map(p => new T.Vector2(p[0], p[1])), 26), brown); torso.rotation.x = PI / 2; torso.scale.set(1, 1, 0.84); body.add(torso);
    /* the head: white, a golden hooked beak, bright eyes under a stern brow (friendly up close, fierce from afar) */
    const head = new T.Group(); head.position.set(0, 0.46, 1.52); body.add(head);
    const skull = new T.Mesh(new T.SphereGeometry(0.47, 24, 18), white); skull.scale.set(0.94, 0.9, 1.12); head.add(skull);
    const collar = new T.Mesh(new T.SphereGeometry(0.52, 20, 14), white); collar.position.set(0, -0.2, -0.32); collar.scale.set(1.02, 0.88, 1.08); head.add(collar);
    const cere = new T.Mesh(new T.SphereGeometry(0.2, 14, 10), gold); cere.position.set(0, 0.02, 0.42); cere.scale.set(1, 0.84, 1); head.add(cere);
    const beak = new T.Mesh(new T.ConeGeometry(0.18, 0.66, 16), gold); beak.rotation.x = PI / 2; beak.position.set(0, -0.02, 0.72); head.add(beak);
    const hook = new T.Mesh(new T.SphereGeometry(0.085, 10, 8), gold); hook.position.set(0, -0.1, 1.0); hook.scale.set(0.9, 1.3, 0.9); head.add(hook);
    for (const sd of [-1, 1]) { const eye = new T.Mesh(new T.SphereGeometry(0.08, 14, 10), M(0xf2c23a, { roughness: 0.25 })); eye.position.set(sd * 0.27, 0.1, 0.3); head.add(eye);
      const pup = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), M(0x0e0e0e, { roughness: 0.15 })); pup.position.set(sd * 0.31, 0.1, 0.34); head.add(pup);
      const glint = new T.Mesh(new T.SphereGeometry(0.014, 6, 4), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 })); glint.position.set(sd * 0.33, 0.13, 0.36); head.add(glint);
      const brow = new T.Mesh(new T.BoxGeometry(0.2, 0.04, 0.12), M(0xe6e0d4)); brow.position.set(sd * 0.25, 0.19, 0.3); brow.rotation.z = -sd * 0.28; head.add(brow); }
    /* the tail: a white fan */
    const tail = new T.Group(); tail.position.set(0, 0.1, -1.55); body.add(tail);
    for (let i = 0; i < 7; i++) { const f = new T.Mesh(featherGeo(T, 1.25, 0.34), whiteF), arm = new T.Group(); arm.rotation.y = (i - 3) * 0.15; tail.add(arm); f.rotation.x = -PI / 2; arm.add(f); }
    /* the legs, tucked under: golden shins and dark talons */
    for (const sd of [-1, 1]) { const leg = new T.Group(); leg.position.set(sd * 0.28, -0.42, -0.55); leg.rotation.x = 0.9; body.add(leg); const shin = new T.Mesh(new T.CylinderGeometry(0.09, 0.08, 0.5, 8), gold); shin.position.y = -0.2; leg.add(shin);
      for (let k = 0; k < 3; k++) { const tal = new T.Mesh(new T.ConeGeometry(0.035, 0.2, 6), claw); tal.position.set((k - 1) * 0.06, -0.47, 0.06); tal.rotation.x = 1.2; leg.add(tal); } }
    /* the wings: a broad inner panel from the shoulder, an outer panel from the wrist, a row of secondaries and six dark 'fingers' */
    const wings = [];
    for (const sd of [-1, 1]) {
      const sh = new T.Group(); sh.position.set(sd * 0.56, 0.36, 0.34); body.add(sh); const side = new T.Group(); side.scale.x = sd; sh.add(side);
      side.add(panel(T, [[0, 0.62], [0.9, 0.78], [1.8, 0.74], [2.35, 0.62], [2.4, -0.4], [2.0, -0.62], [1.4, -0.72], [0.8, -0.78], [0.3, -0.74], [0, -0.62]], wingM, 0.08));
      const cov = panel(T, [[0.1, 0.6], [1.9, 0.72], [2.3, 0.55], [2.2, 0.0], [0.2, 0.05]], covert, 0.04); cov.position.y = 0.05; side.add(cov);
      for (let i = 0; i < 8; i++) { const f = new T.Mesh(featherGeo(T, 0.9 + (i % 2) * 0.12, 0.32), wingM), a = new T.Group(); a.position.set(0.2 + i * 0.28, -0.01, -0.5); a.rotation.y = -0.05 * (i - 4); side.add(a); f.rotation.x = -PI / 2; a.add(f); }
      const wrist = new T.Group(); wrist.position.set(2.32, 0.01, 0); side.add(wrist);
      wrist.add(panel(T, [[0, 0.62], [0.9, 0.52], [1.6, 0.3], [1.95, 0.0], [1.5, -0.42], [0.8, -0.56], [0, -0.52]], wingM, 0.07));
      for (let i = 0; i < 6; i++) { const f = new T.Mesh(featherGeo(T, 1.5 - i * 0.1, 0.3), dark), a = new T.Group(); a.position.set(1.55 + i * 0.05, -0.005, 0.28 - i * 0.18); a.rotation.y = -PI / 2 + 0.12 + i * 0.2; wrist.add(a); f.rotation.x = -PI / 2; a.add(f); }
      wings.push({ sd, sh, wrist });
    }
    const R = { root, body, head, tail, wings };
    if (o.saddle) R.saddle = saddle(T, body);
    if (o.rider) { R.rider = rider(T); R.rider.position.set(0, 0.84, 0.05); body.add(R.rider); }
    root.traverse(m => { if (m.isMesh) m.castShadow = true; });
    const st = { t: Math.random() * 10, flap: 0.6, bank: 0, pitch: 0, fold: 0 };
    /* mode: 'auto' (a few beats, then a glide), 'flap', 'glide', 'dive', 'perch' (wings folded back along the body to the tail, the head looking round;
       any other mode unfolds them again over a third of a second) */
    R.update = (dt, mode) => { st.t += dt; const t = st.t, perch = mode === 'perch', want = mode === 'flap' ? 1 : mode === 'glide' || perch ? 0 : mode === 'dive' ? 0.15 : ((t % 6.5) < 2.6 ? 0.8 : 0.08); st.flap += (want - st.flap) * Math.min(1, dt * 2.2);
      st.fold += ((perch ? 1 : 0) - st.fold) * Math.min(1, dt * 3.2); const f = st.fold, o = 1 - f;
      const a = st.flap * o, ph = t * 4.6;
      for (const w of wings) { w.sh.rotation.z = w.sd * ((0.1 + a * 0.62 * Math.sin(ph) + (mode === 'dive' ? -0.35 : 0)) * o - 0.2 * f); w.wrist.rotation.z = w.sd * (a * 0.42 * Math.sin(ph - 1.0) + 0.04 * Math.sin(t * 1.3)) * o; w.wrist.rotation.y = 0.22 * f; w.sh.rotation.y = w.sd * ((mode === 'dive' ? 0.5 : 0) * o + 1.5 * f); w.sh.scale.setScalar(1 - 0.45 * f); w.sh.rotation.x = a * 0.07 * Math.sin(ph + 1.3) - 1.4 * f; w.sh.rotation.order = f > 0.01 ? 'YZX' : 'XYZ'; }   /* folded: rolled on its long side so the wing lies flat against the flank, drawn in to its folded length */
      body.position.y = -a * 0.14 * Math.sin(ph) + Math.sin(t * 0.9) * 0.05 * o; head.rotation.x = a * 0.12 * Math.sin(ph) - 0.04 + 0.45 * f;   /* a perched bird sits up (its root pitched about -0.5): the head levels out */ head.rotation.y = Math.sin(t * 0.37) * (0.12 + 0.55 * f) + Math.sin(t * 1.9) * 0.08 * f; tail.rotation.x = Math.sin(t * 1.3) * 0.06; tail.scale.x = 1 + a * 0.08 * Math.sin(ph);
      if (R.rider && R.rider.userData.tick) R.rider.userData.tick(dt, t); if (R.helmet) R.helmet.userData.bulb.material.emissiveIntensity = (t % 1.6) < 0.25 ? 2.4 : 0.35; };
    return R; }

  /* a red leather saddle with gold trim, a blanket and reins up to the beak */
  function saddle(T, body) { const M = mat(T), g = new T.Group(); g.position.set(0, 0.66, 0.1); body.add(g);
    const leather = M(0xb8322a, { roughness: 0.5 }), trim = M(0xf2c14e, { metalness: 0.6, roughness: 0.35 }), blanket = M(0x2a5ac8, { roughness: 0.8, side: T.DoubleSide });
    const blk = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 1.2, 24, 1, true, -PI * 0.42, PI * 0.84), blanket); blk.rotation.x = PI / 2; blk.rotation.z = PI / 2; blk.position.y = -0.36; blk.scale.set(1, 1, 0.9); g.add(blk);
    const seat = new T.Mesh(new T.CylinderGeometry(0.46, 0.46, 0.86, 20, 1, false, -PI * 0.38, PI * 0.76), leather); seat.rotation.x = PI / 2; seat.rotation.z = PI / 2; seat.position.y = -0.26; g.add(seat);
    const cantle = new T.Mesh(new T.TorusGeometry(0.3, 0.07, 8, 20, PI), leather); cantle.position.set(0, 0.04, -0.4); g.add(cantle);
    const pommel = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 0.3, 10), trim); pommel.position.set(0, 0.14, 0.42); g.add(pommel); const knob = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), trim); knob.position.set(0, 0.3, 0.42); g.add(knob);
    for (const sd of [-1, 1]) { const strap = new T.Mesh(new T.BoxGeometry(0.05, 0.62, 0.08), leather); strap.position.set(sd * 0.56, -0.42, 0.05); strap.rotation.z = sd * 0.25; g.add(strap); const st = new T.Mesh(new T.TorusGeometry(0.1, 0.022, 6, 16), trim); st.position.set(sd * 0.64, -0.78, 0.05); g.add(st);
      const pts = [new T.Vector3(sd * 0.08, 0.28, 0.42), new T.Vector3(sd * 0.3, 0.3, 0.95), new T.Vector3(sd * 0.36, 0.05, 1.38), new T.Vector3(sd * 0.24, -0.18, 1.86)]; const rein = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, 0.018, 5, false), M(0x6a3a1a, { roughness: 0.6 })); g.add(rein); }
    const rim = new T.Mesh(new T.TorusGeometry(0.46, 0.025, 6, 30, PI * 0.76), trim); rim.rotation.set(0, PI / 2, PI / 2 + PI * 0.12); rim.position.y = -0.26; g.add(rim);
    return g; }

  /* the rider: a child in an aviator cap with goggles and a long red scarf — sitting astride (the ride) or hanging under the chute */
  function rider(T) { const M = mat(T), g = new T.Group(); const jacket = M(0x2a8a8a, { roughness: 0.7 }), skin = M(0xf0c8a0, { roughness: 0.6 }), cap = M(0x7a4a2a, { roughness: 0.65 }), goldM = M(0xf2c14e, { metalness: 0.6, roughness: 0.3 }), lens = M(0x7ad0ff, { roughness: 0.1, metalness: 0.3 }), pants = M(0x3a4a6a), boot = M(0x3a2a20);
    const torso = new T.Mesh(new T.CylinderGeometry(0.2, 0.25, 0.6, 14), jacket); torso.position.y = 0.4; g.add(torso);
    const head = new T.Group(); head.position.y = 0.92; g.add(head); head.add(new T.Mesh(new T.SphereGeometry(0.2, 16, 12), skin));
    const capM = new T.Mesh(new T.SphereGeometry(0.215, 16, 10, 0, TAU, 0, PI * 0.56), cap); capM.position.y = 0.02; head.add(capM);
    for (const sd of [-1, 1]) { const flap = new T.Mesh(new T.BoxGeometry(0.06, 0.2, 0.14), cap); flap.position.set(sd * 0.19, -0.08, 0); head.add(flap); const gg = new T.Mesh(new T.TorusGeometry(0.058, 0.018, 6, 14), goldM); gg.position.set(sd * 0.075, 0.12, 0.17); gg.rotation.x = -0.35; head.add(gg); const ln = new T.Mesh(new T.CircleGeometry(0.05, 12), lens); ln.position.set(sd * 0.075, 0.12, 0.178); ln.rotation.x = -0.35; head.add(ln); }
    const band = new T.Mesh(new T.TorusGeometry(0.2, 0.018, 6, 20), M(0x3a2a1a)); band.position.y = 0.1; band.rotation.x = PI / 2 - 0.3; head.add(band);
    /* the scarf: a knot at the neck and a long tail that streams back and ripples */
    const knot = new T.Mesh(new T.TorusGeometry(0.17, 0.05, 8, 18), M(0xe8433a, { roughness: 0.7 })); knot.position.y = 0.72; knot.rotation.x = PI / 2; g.add(knot);
    const sg = new T.PlaneGeometry(0.16, 1.1, 1, 10); sg.translate(0, -0.55, 0); const scarf = new T.Mesh(sg, M(0xe8433a, { roughness: 0.7, side: T.DoubleSide })); scarf.position.set(0.05, 0.74, -0.12); scarf.rotation.x = 1.35; g.add(scarf); const s0 = Float32Array.from(sg.attributes.position.array);
    const arms = [], legs = [];
    for (const sd of [-1, 1]) { const arm = new T.Group(); arm.position.set(sd * 0.25, 0.62, 0); g.add(arm); const up = new T.Mesh(new T.CylinderGeometry(0.06, 0.055, 0.46, 8), jacket); up.position.y = -0.2; arm.add(up); const hand = new T.Mesh(new T.SphereGeometry(0.065, 8, 6), M(0xb07a3a)); hand.position.y = -0.44; arm.add(hand); arm.rotation.set(-1.0, 0, -sd * 0.2); arms.push(arm);
      const leg = new T.Group(); leg.position.set(sd * 0.13, 0.12, 0); g.add(leg); const th = new T.Mesh(new T.CylinderGeometry(0.075, 0.07, 0.42, 8), pants); th.position.y = -0.2; leg.add(th); const ft = new T.Mesh(new T.BoxGeometry(0.11, 0.1, 0.2), boot); ft.position.set(0, -0.44, 0.05); leg.add(ft); leg.rotation.set(-0.35, 0, sd * 0.95); legs.push(leg); }   /* astride: legs down the flanks */
    g.userData = { arms, legs, head,
      hang() { arms.forEach((a, i) => a.rotation.set(-2.6, 0, (i ? -1 : 1) * 0.35)); legs.forEach((l, i) => l.rotation.set(0.15, 0, (i ? 1 : -1) * 0.08)); },   /* under the chute: hands up on the lines, legs dangling */
      tick(dt, t) { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const y = s0[i * 3 + 1], k = -y / 1.1; p.setZ(i, s0[i * 3 + 2] + Math.sin(t * 9 - k * 6) * 0.1 * k); p.setX(i, s0[i * 3] + Math.sin(t * 6.3 - k * 4) * 0.05 * k); } p.needsUpdate = true; head.rotation.y = Math.sin(t * 0.5) * 0.25; } };
    g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g; }

  /* the parachute: a striped canopy, eight lines and the rider hanging below (root origin = the rider's feet) */
  function chute(T, o) { o = o || {}; const M = mat(T), g = new T.Group(), canopy = new T.Group(); canopy.position.y = 3.3; g.add(canopy);
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'), cols = ['#e8433a', '#ffffff', '#f4c21e', '#2a6ae0']; for (let i = 0; i < 8; i++) { x.fillStyle = cols[i % 4]; x.fillRect(i * 32, 0, 32, 64); } const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const dome = new T.Mesh(new T.SphereGeometry(1.7, 24, 10, 0, TAU, 0, PI * 0.42), M(0xffffff, { map: tex, roughness: 0.7, side: T.DoubleSide })); dome.scale.y = 0.62; canopy.add(dome);
    const rr = 1.7 * Math.sin(PI * 0.42), ry = 1.7 * Math.cos(PI * 0.42) * 0.62; const rim = new T.Mesh(new T.TorusGeometry(rr, 0.03, 6, 32), M(0xf4f0e6)); rim.rotation.x = PI / 2; rim.position.y = ry; canopy.add(rim);
    const lineM = M(0xe8e4dc, { roughness: 0.6 }), hp = new T.Vector3(0, 1.02, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, top = new T.Vector3(Math.cos(a) * rr, 3.3 + ry, Math.sin(a) * rr), mid = top.clone().add(hp).multiplyScalar(0.5), len = top.distanceTo(hp); const ln = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, len, 3), lineM); ln.position.copy(mid); ln.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), top.clone().sub(hp).normalize()); g.add(ln); }
    let r = null; if (o.rider !== false) { r = rider(T); r.userData.hang(); g.add(r); }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    return { root: g, canopy, rider: r, update(dt, t) { g.rotation.z = Math.sin(t * 1.25) * 0.09; g.rotation.x = Math.sin(t * 0.9) * 0.05; canopy.scale.set(1 + Math.sin(t * 2.2) * 0.025, 1 - Math.sin(t * 2.2) * 0.03, 1 + Math.sin(t * 2.2) * 0.025); if (r && r.userData.tick) r.userData.tick(dt, t); } }; }

  /* a space helmet for the eagle (Yoni 2026-10-10: "in space the eagle should have a helmet"): a glass bubble round the whole head, beak
     and all, a silver ring at the neck and a little antenna whose light blinks. It rides on the head, so it turns and nods with it */
  function helmet(T, R) { if (!R || !R.head || R.helmet) return R && R.helmet; const g = new T.Group(); g.name = 'helmet';
    const glass = new T.Mesh(new T.SphereGeometry(0.86, 32, 22), new T.MeshPhysicalMaterial({ color: 0xd8efff, transparent: true, opacity: 0.2, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false }));
    glass.position.set(0, 0.04, 0.3); glass.renderOrder = 2; glass.castShadow = false; g.add(glass);
    const shine = new T.Mesh(new T.TorusGeometry(0.7, 0.025, 6, 28, 1.1), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false }));
    shine.position.set(-0.12, 0.2, 0.55); shine.rotation.set(-0.35, -0.5, 1.9); shine.renderOrder = 3; g.add(shine);   /* the glint that says glass */
    const steel = new T.MeshStandardMaterial({ color: 0xd4d8e0, metalness: 0.85, roughness: 0.28 });
    const ring = new T.Mesh(new T.TorusGeometry(0.6, 0.08, 12, 32), steel); ring.position.set(0, -0.3, -0.42); ring.rotation.x = -0.5; g.add(ring);   /* round the neck, behind the head */
    const mast = new T.Mesh(new T.CylinderGeometry(0.018, 0.022, 0.42, 6), steel); mast.position.set(0.28, 0.98, -0.05); mast.rotation.z = -0.25; g.add(mast);
    const bulb = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), new T.MeshStandardMaterial({ color: 0xff3a2a, emissive: 0xff2a1a, emissiveIntensity: 1.2 })); bulb.position.set(0.335, 1.19, -0.05); g.add(bulb);
    g.userData.bulb = bulb; R.head.add(g); R.helmet = g; return g; }
  window.KQEagle = { build, chute, rider, helmet };

  /* ================================================================== the ride: a hall above the clouds */
  if (!window.KQRealms) return;
  const HALL = () => KQRealms.hall;
  /* a soft cloud: a cluster of white puffs (shared geometry), a touch of blue underneath */
  const PUFF = {}, TINTS = [0xffbcd8, 0xb4dcff, 0xbff0c4, 0xffd6a0, 0xd8c8ff]; const puffGeo = T => PUFF.g || (PUFF.g = new T.SphereGeometry(1, 14, 10));
  function cloud(c, w, seed, tint) { const { T } = c, G3 = KQRealms.G3, g = new T.Group(), m = new T.MeshStandardMaterial({ color: tint || 0xffffff, vertexColors: true, roughness: 1, emissive: tint || 0x8a96aa, emissiveIntensity: tint ? 0.55 : 0.22, transparent: true, opacity: 1 }), n = 7, rnd = k => { const x = Math.sin(seed * 12.9 + k * 78.2) * 43758.5; return x - Math.floor(x); }, parts = [];
    for (let i = 0; i < n; i++) { const u = (i / (n - 1) - 0.5), r = (0.7 + rnd(i) * 0.45) * (1 - Math.abs(u) * 0.55) * w * 0.34; parts.push({ g: puffGeo(T), m: G3.M4(T, u * w * 0.82, (rnd(i + 9) - 0.3) * r * 0.5 + (Math.abs(u) < 0.3 ? r * 0.28 : 0), (rnd(i + 5) - 0.5) * 0.5, 0, 0, 0, r * 1.1, r * 0.82, r * 0.9), c: 0xffffff }); }
    parts.push({ g: puffGeo(T), m: G3.M4(T, 0, -w * 0.12, 0, 0, 0, 0, w * 0.5, w * 0.16, w * 0.24), c: 0xe4ebf6 });   /* a flatter, shadowed base */
    g.add(new T.Mesh(G3.merge(T, parts), m)); g.userData.mat = m; return g; }   /* one draw call a cloud */

  const THEMES = {
    /* high above the kingdom: a deep blue sky, the sun, a sea of clouds far below and clouds streaming past on both sides */
    eagle_sky: { palette: { noFloor: true, sky: 0x8ec9f5, ground: 0xeaf4ff, fog: 0xb8dcf6, wall: ['cloud', '#ffffff', '#e8f4ff'], floor: ['cloud', '#ffffff', '#eef6ff'], hemi: [0xffffff, 0x9ab8d8], key: 0xfff4e0, ok: 'rainbow', bad: 'rain', dust: { c: 0xffffff, n: 18, mode: 'drift' } },
      look: { keyC: 0xfffaf0, grade: 'sky', exposure: 0.9, fogD: 0.0036, rim: 0xfff0d0, face: 0x163a66, accent: '#ffe7a8', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, MS } = c; HALL().skyDome(c, 0x2270d8, 0x9fd0f6, false); c.sprite(0xfff6dc, 18, 34, 30, -110, null, 0.95); c.sprite(0xffe9b0, 60, 34, 30, -110, null, 0.3);
        MS.speed = 10; MS.vy = 0; const move = [];
        /* the sea of clouds below (instanced puffs that stream past and wrap round) */
        const N = 300, sea = new T.InstancedMesh(puffGeo(T), new T.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 1, emissive: 0x7f92b0, emissiveIntensity: 0.3 }), N), P = [], m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), s = new T.Vector3(), col = new T.Color(), tint = [0xffffff, 0xe8f0ff, 0xfff4ee, 0xe4ecff];
        for (let i = 0; i < N; i++) { const r = 3 + Math.random() * 5; P.push({ x: (Math.random() - 0.5) * 220, y: -24 - Math.random() * 6, z: -190 + Math.random() * 215, r }); sea.setColorAt(i, col.setHex(tint[i % 4])); }
        const setSea = () => { P.forEach((p, i) => { m4.compose(v.set(p.x, p.y, p.z), q, s.set(p.r * 1.3, p.r * 0.5, p.r)); sea.setMatrixAt(i, m4); }); sea.instanceMatrix.needsUpdate = true; }; setSea(); scene.add(sea); MS.sea = { P };
        /* clouds streaming past at our height, kept out of the corridor where the answers come */
        const stream = []; for (let i = 0; i < 26; i++) { const sd = i % 2 ? 1 : -1, g = cloud(c, 6 + Math.random() * 8, i + 1); g.position.set(sd * (13 + Math.random() * 34), -6 + Math.random() * 20, -190 + Math.random() * 200); scene.add(g); stream.push(g); }
        /* far cloud banks on the horizon (slow) */
        for (let i = 0; i < 9; i++) { const g = cloud(c, 40 + Math.random() * 30, 40 + i); g.position.set(-160 + i * 40 + Math.random() * 20, -8 + Math.random() * 10, -170 - Math.random() * 20); g.scale.y = 0.7; scene.add(g); }
        /* speed streaks: faint lines rushing past */
        const sm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }), streaks = []; for (let i = 0; i < 26; i++) { const st = new T.Mesh(new T.PlaneGeometry(0.03, 2.6), sm); st.rotation.x = PI / 2; const sd = Math.random() < 0.5 ? -1 : 1; st.position.set(sd * (4 + Math.random() * 7), -2 + Math.random() * 8, -60 + Math.random() * 70); scene.add(st); streaks.push(st); }
        c.updaters.push((dt) => { const sp = MS.speed * dt, vy = MS.vy * dt;
          P.forEach(p => { p.z += sp; p.y += vy; if (p.z > 28) { p.z -= 220; p.x = (Math.random() - 0.5) * 220; } }); if (MS.vy) MS.seaY = (MS.seaY || 0) + vy; setSea();
          for (const g of stream) { g.position.z += sp * 1.05; g.position.y += vy; if (g.position.z > 20) { g.position.z -= 215; g.position.y = -6 + Math.random() * 20 + (MS.seaY || 0); } }
          for (const st of streaks) { st.position.z += sp * 3.2; st.position.y += vy; if (st.position.z > 12) { st.position.z -= 72; st.position.y = -2 + Math.random() * 8; } } sm.opacity = Math.min(0.35, MS.speed * 0.03); }); } }
  };

  const STAGES = {
    /* ---- The Eagle Ride: answers on clouds that drift in; tap the right one before they drift away ---- */
    eagle(c) { const { T, scene, MS } = c, Z0 = -18, Z1 = -10;
      const lerp = (a, b, k) => a + (b - a) * k;
      function takeOff(g, tab) { const s0 = g.scale.x; c.tween(0.5, k => { g.scale.setScalar(Math.max(0.001, s0 * (1 - k))); }, () => { if (g.parent) g.parent.remove(g); if (tab) tab.userData.tablet.dispose(); }); }
      /* the fall: the rider pops off the saddle, the chute opens, the eagle flies on; the camera follows the chute down through the clouds */
      function fall() { if (MS.state === 'fall') return; MS.state = 'fall'; const E = MS.E, r = E.rider; const w = new T.Vector3(); r.getWorldPosition(w);
        const ch = KQEagle.chute(T, { rider: false }); ch.root.position.copy(w).add(new T.Vector3(0, -0.8, 0)); ch.root.rotation.y = PI; scene.add(ch.root); ch.canopy.scale.setScalar(0.001); scene.attach(r); ch.root.attach(r); r.userData.hang(); MS.chute = ch;
        const y0 = ch.root.position.y; c.tween(0.6, k => { ch.root.position.y = y0 + Math.sin(PI * k) * 1.2; ch.root.position.z += 0.02; });
        c.tween(0.55, k => { const s = c.over(k); ch.canopy.scale.setScalar(Math.max(0.001, s)); }, null, 0.45);
        c.burst(w.clone().add(new T.Vector3(0, 3.3, 0)), 0xffffff, 14);
        MS.chuteT = 0; MS.eagleOut = 0; }
      /* the soar: after the tenth question the eagle climbs through a ring of light into the sun */
      function soar() { if (MS.state === 'soar') return; MS.state = 'soar'; const ring = new T.Mesh(new T.TorusGeometry(4.2, 0.28, 12, 48), new T.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc84a, emissiveIntensity: 1.1, roughness: 0.3 })); ring.position.set(0, 4.6, -52); scene.add(ring); MS.ring = ring;
        const glow = c.sprite(0xfff0b0, 14, 0, 4.6, -52, null, 0.55); c.updaters.push((dt, tm) => { if (!ring.parent) return; ring.position.z += MS.speed * dt * 1.6; glow.position.z = ring.position.z; ring.rotation.z = tm * 0.8; if (ring.position.z > -2 && !MS.ringHit) { MS.ringHit = true; const at = ring.position.clone(); c.burst(at, 0xffe08a, 26); c.burst(at, 0xffffff, 18); } if (ring.position.z > 14) { scene.remove(ring); scene.remove(glow); } }); }
      return {
      dynamic: true,
      frame: a => { const narrow = a < 1.05, mid = a < 1.5;
        if (MS.state === 'fall' && MS.chute) { const p = MS.chute.root.position; return narrow ? { pos: [p.x + 1.6, p.y + 5.2, p.z + 10.5], look: [p.x + 0.4, p.y - 0.6, p.z], fov: 62 } : { pos: [p.x + 7.2, p.y + 2.4, p.z + 8.4], look: [p.x + 4.0, p.y + 1.2, p.z], fov: mid ? 52 : 48 }; }
        if (MS.state === 'soar') return narrow ? { pos: [0, 4.2, 10.4], look: [0, 4.6, -14], fov: 62 } : { pos: [0, 3.4, 7.8], look: [0, 4.8, -14], fov: mid ? 52 : 48 };
        return narrow ? { pos: [0, 4.4, 10], look: [0, 2.4, -14], fov: 62 } : mid ? { pos: [0, 3.8, 7.8], look: [0, 2.3, -14], fov: 52 } : { pos: [0, 3.6, 7.2], look: [0, 2.3, -14], fov: 48 }; },
      build() { const E = KQEagle.build(T, { saddle: true, rider: true }); E.root.rotation.y = PI; scene.add(E.root); MS.E = E; MS.state = 'fly'; MS.cur = []; MS.bank = 0; MS.sway = 0;
        c.updaters.push((dt, tm) => { const E2 = MS.E;
          if (MS.state === 'fall') { MS.chuteT += dt; if (MS.chute) { MS.chute.update(dt, tm); MS.chute.root.position.y -= Math.min(2.2, MS.chuteT * 1.4) * dt; MS.chute.root.position.z -= 0.6 * dt; }
            MS.speed += (1.2 - MS.speed) * Math.min(1, dt * 1.5); MS.vy = Math.min(2.4, MS.chuteT * 1.6);   /* we sink: the world rises past */
            E2.root.position.z -= (8 + MS.chuteT * 6) * dt; E2.root.position.y += (2.4 + MS.chuteT) * dt; E2.update(dt, 'flap'); return; }
          if (MS.state === 'soar') { MS.speed += (16 - MS.speed) * Math.min(1, dt); E2.root.position.y += (2.6 - E2.root.position.y) * Math.min(1, dt * 0.9); E2.root.rotation.x = lerp(E2.root.rotation.x, E2.root.position.y < 2.3 ? -0.28 : 0, Math.min(1, dt * 2)); E2.root.rotation.z = lerp(E2.root.rotation.z, 0, Math.min(1, dt * 2)); E2.update(dt, 'flap'); return; }
          const tb = MS.bank; E2.root.rotation.z += (tb - E2.root.rotation.z) * Math.min(1, dt * 3); E2.root.position.x += ((MS.aimX || 0) - E2.root.position.x) * Math.min(1, dt * 2.2); E2.root.position.y = Math.sin(tm * 0.8) * 0.22 + (MS.lift || 0); E2.root.rotation.x = Math.sin(tm * 0.6) * 0.03 + (MS.pitch || 0);
          if (MS.shake > 0) { MS.shake -= dt; E2.root.rotation.z += Math.sin(tm * 40) * 0.05 * MS.shake; }
          E2.update(dt, MS.q && !MS.q.done ? 'glide' : (MS.flapMode || 'auto'));
          /* the answer clouds drift in; when the time is up they drift away (the hub hears it through q.onTimeout) */
          const Q = MS.q; if (Q && !Q.done) { Q.t += dt; const k = Math.min(1, Q.t / Q.T); for (const ch of MS.cur) { if (ch.gone || ch.anim) continue; ch.g.position.z = lerp(Z0, Z1, k); const late = Math.max(0, (k - 0.72) / 0.28); ch.obj.userData.mat.opacity = 1 - late * 0.45; ch.obj.scale.setScalar(1 + late * 0.08); if (ch.obj.userData.halo) ch.obj.userData.halo.material.opacity = 0.62 * (1 - late); }
            if (Q.t >= Q.T) { Q.done = true; Q.late = true; if (Q.onTimeout) Q.onTimeout(); } } }); },
      present(choices, q) { for (const ch of MS.cur) if (ch.g.parent) scene.remove(ch.g); MS.cur = []; MS.bank = 0; MS.aimX = 0; MS.lift = 0; MS.pitch = 0; MS.flapMode = 'auto';
        const X = (q && q.x && q.x.eagle) || {}; MS.q = { t: 0, T: X.t || 12, done: false, onTimeout: q && q.onTimeout, fall: !!X.fall, last: !!X.last, retry: !!X.retry };   /* retry: an eagle trip asks again after a first miss, so the answer is not shown yet */
        MS.qn = (MS.qn || 0) + 1; const n = choices.length, narrow = c.camera.aspect < 1.05, cols = narrow && n > 2 ? 2 : n, rows = Math.ceil(n / cols), sp = narrow ? 5.4 : 6.0;
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, col = s % cols, row = Math.floor(s / cols), inRow = Math.min(cols, n - row * cols), off = col - (inRow - 1) / 2;
          const y = rows > 1 ? (row ? 1.2 : 4.4) : 2.8 + ((s % 2) ? 0.55 : -0.15), g = new T.Group(); g.position.set(off * sp, y, Z0);
          const tint = TINTS[(j + (MS.qn || 0)) % TINTS.length], cl = cloud(c, narrow ? 5.2 : 5.8, j + 3 + Math.random() * 9, tint); g.add(cl); const halo = c.sprite(tint, narrow ? 8.2 : 9.2, 0, 0.2, -1.2, g, 0.62); cl.userData.halo = halo;
          const tab = c.label(choices[j], j, narrow ? 1.25 : 1.35); tab.position.set(0, -0.1, 1.7); c.faceCam(tab); g.add(tab); const h = c.hitBox(5.2, 3.2, 2.8, j, 0); g.add(h);
          const ch = { j, g, tab, obj: cl, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); MS.cur.push(ch); } },
      resolve(chosen, correct, ok) { const Q = MS.q || {}; Q.done = true; const ch = chosen >= 0 ? c.choiceOf(chosen) : null, r = c.choiceOf(correct); c.dimOthers([ch, r].filter(Boolean));
        const away = (list, delay) => list.forEach((x, i) => { if (!x || x.gone) return; x.anim = true; const p0 = x.g.position.clone(), sd = p0.x >= 0 ? 1 : -1, ts = x.tab.scale.x; c.tween(1.1, k => { x.g.position.set(p0.x + sd * k * k * 9, p0.y + k * 1.5, p0.z + k * k * 26); x.obj.userData.mat.opacity = Math.max(0, 1 - k * 1.2); x.tab.scale.setScalar(Math.max(0.001, ts * (1 - Math.min(1, k / 0.45)))); }, () => { x.gone = true; if (x.g.parent) x.g.parent.remove(x.g); x.tab.userData.tablet.dispose(); }, (delay || 0) + i * 0.06); });   /* the answer shrinks away first: a tablet is drawn on top of everything, so it must never sweep past the camera */
        const miss = !ok, falls = miss && Q.fall, again = miss && Q.retry;
        if (ch && ok) { ch.tab.userData.tablet.setState('right'); MS.right++; ch.anim = true; const p0 = ch.g.position.clone(); MS.aimX = p0.x * 0.35; MS.bank = -Math.sign(p0.x) * Math.min(0.45, Math.abs(p0.x) * 0.08); MS.flapMode = 'flap';
          const to = new T.Vector3(p0.x * 0.35, 1.5, -1.2);
          c.tween(0.75, k => { const e = k * k; ch.g.position.lerpVectors(p0, to, e); }, () => { const at = ch.g.position.clone(); c.burst(at, 0xffe08a, 24); c.burst(at, 0xffffff, 18); ch.gone = true; takeOff(ch.g, ch.tab); MS.bank = 0; MS.aimX = 0; MS.flapMode = 'auto';
            const plus = c.label('+10', -1, 0.5); plus.position.copy(at).add(new T.Vector3(0, 1.2, 0)); c.faceCam(plus); scene.add(plus); const y0 = plus.position.y; c.tween(1.2, k => { plus.position.y = y0 + k * 1.6; plus.scale.setScalar(Math.max(0.001, 0.5 * (1 - k * 0.4))); }, () => { scene.remove(plus); if (plus.userData.tablet) plus.userData.tablet.dispose(); }); });
          away(MS.cur.filter(x => x !== ch), 0.25); }
        else { if (ch) { ch.tab.userData.tablet.setState('wrong'); const m = ch.obj.userData.mat, c0 = m.color.clone(), c1 = new T.Color(0x6e7686); c.tween(0.5, k => { m.color.copy(c0).lerp(c1, k); m.emissiveIntensity = 0.22 * (1 - k); });
            const at = ch.g.position.clone(); const flash = c.sprite(0xffffff, 6, at.x, at.y + 0.4, at.z + 0.6, null, 0); c.tween(0.5, k => { flash.material.opacity = Math.max(0, Math.sin(k * PI * 3)) * 0.8; }, () => scene.remove(flash), 0.2);
            for (let i = 0; i < 22; i++) { const d = c.sprite(0x9ab8e0, 0.16, at.x + c.R(-1.4, 1.4), at.y - 0.4, at.z + c.R(-0.3, 0.6), null, 0.9); d.scale.set(0.05, 0.42, 1); c.tween(0.8, k => { d.position.y = at.y - 0.4 - k * 3.4; d.material.opacity = 0.9 * (1 - k); }, () => scene.remove(d), 0.15 + (i % 7) * 0.08); }
            MS.shake = 0.8; }
          if (r && !again) { r.tab.userData.tablet.setState('reveal'); c.glowUp(r); }
          away(MS.cur, falls ? (ch ? 0.55 : 0.1) : ch ? 1.1 : 0.2); }
        if (falls) setTimeout(() => { if (c.alive()) fall(); }, (ch ? 1750 : 1100));
        else if (Q.last && !miss) setTimeout(() => { if (c.alive()) soar(); }, 900);
        else if (Q.last && !again) setTimeout(() => { if (c.alive()) soar(); }, 1500);
        return falls ? 3.8 : ok ? 2.2 : ch ? 2.6 : 2.0; } }; }
  };

  const S = {
    en: { eg_name: 'The Giant Eagle', eg_tap: 'Tap to ride!', eg_title: 'The Eagle Ride', eagle: 'Eagle ride',
      eg_hi: 'Hold on tight! We fly above the clouds.', eg_rules: 'Tap the cloud with the right answer before it drifts away. Ten questions — three misses and you parachute down.',
      eg_q: 'Question {n} of {m}', eg_late: 'The clouds drifted away! The answer was {a}.', eg_fall: 'Three misses — time to parachute down!', eg_fallSay: 'Right answers: {n} of {m}. The eagle will be back!',
      eg_win: 'Ten questions — what a flight!', eg_winSay: 'The eagle soars above the clouds. The treasure is yours!', eg_coin1: '+1 coin', eg_gem1: '+1 gem', eg_miss: 'Not this time. The answer is {a}.', eg_found: 'The eagle brought you a treasure: {item}!' },
    he: { eg_name: 'הנשר הענק', eg_tap: 'לוחצים כדי לרכוב!', eg_title: 'הרכיבה על הנשר', eagle: 'רכיבה על הנשר',
      eg_hi: 'תחזיקו חזק! טסים מעל העננים.', eg_rules: 'לוחצים על הענן עם התשובה הנכונה לפני שהוא מתרחק. עשר שאלות — שלוש החמצות, ויורדים במצנח.',
      eg_q: 'שאלה {n} מתוך {m}', eg_late: 'העננים התרחקו! התשובה הייתה {a}.', eg_fall: 'שלוש החמצות — הזמן לרדת במצנח!', eg_fallSay: 'תשובות נכונות: {n} מתוך {m}. הנשר עוד יחזור!',
      eg_win: 'עשר שאלות — איזו טיסה!', eg_winSay: 'הנשר ממריא מעל העננים. האוצר שלכם!', eg_coin1: '+מטבע אחד', eg_gem1: '+אבן חן אחת', eg_miss: 'לא הפעם. התשובה היא {a}.', eg_found: 'הנשר הביא לכם אוצר: {item}!' }
  };

  KQRealms.define('eagle', { games: [], strings: S, themes: THEMES, stages: STAGES });
})();
