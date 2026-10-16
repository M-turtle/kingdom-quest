/* Kingdom Quest — Cannon Cove, a game of the Games Arcade (shared/arcade.js). Number sense as aiming: a number line of buoys runs across
   the bay; the captain calls where a ship hides in the fog and you drag the aim to that place on the line (the aim never shows its
   number — you read the line), then fire. A miss splashes where you really aimed: too short, too far. Some ships sail in plain sight:
   you read where they are and type it. The line grows with the child: 0–5 with every buoy numbered (4–5), 0–10 counting marks (6–7),
   0–100 in tens (8–9), fractions of a mile (10–11), decimals and below zero (12–13), and a wind to allow for (14–15). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2, { fmtNum, parseNum } = KQKit;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));

  /* ---------------------------------------------------------------- the bay at sunset */
  const THEMES = {
    gm_cove: { palette: { noFloor: true, sky: 0xffb48a, ground: 0x2a6a8a, fog: 0xffc9a0, wall: ['plank', '#8a6a4a', '#7a5a3a'], floor: ['plank', '#2a6a8a', '#245a7a'], hemi: [0xffe8d0, 0x2a4a6a], key: 0xfff0d8, dust: { c: 0xffffff, n: 14, mode: 'drift' } },
      look: { keyC: 0xffe0b8, grade: 'sky', exposure: 1.0, fogD: 0.012, rim: 0xffb070, face: 0x2a1a10, accent: '#ffd89a', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { scene } = c; KQRealms.hall.skyDome(c, 0x3a5ac8, 0xffb88a);
        const sun = c.sprite(0xfff0c0, 16, 6, 5.2, -40, null, 0.9); const glow = c.sprite(0xffa060, 40, 6, 5, -41, null, 0.45); void sun; void glow;
        /* far islands with palms, a lighthouse on the right */
        for (const [x, z, s] of [[-18, -30, 1.4], [12, -34, 1.8], [26, -26, 1.1], [-30, -22, 1.0]]) { const isl = new T.Mesh(new T.ConeGeometry(4 * s, 2.4 * s, 9), M(0x6a8a4a, { flatShading: true })); isl.position.set(x, 0.4 * s, z); scene.add(isl);
          for (let i = 0; i < 3; i++) { const tr = new T.Mesh(new T.CylinderGeometry(0.08 * s, 0.12 * s, 2.2 * s, 5), M(0x7a5a3a)); tr.position.set(x + (i - 1) * 1.2 * s, 2.2 * s, z); tr.rotation.z = (i - 1) * 0.25; scene.add(tr); const fr = new T.Mesh(new T.ConeGeometry(0.9 * s, 0.5 * s, 6), M(0x3a8a4a)); fr.position.set(x + (i - 1) * 1.2 * s + (i - 1) * 0.3 * s, 3.3 * s, z); scene.add(fr); (c.oldPalms = c.oldPalms || []).push(tr, fr); }
          (c.isles = c.isles || []).push([x, 1.6 * s, z, s]); }
        const lh = new T.Group(); lh.position.set(22, 0, -18); scene.add(lh); for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.CylinderGeometry(0.9 - i * 0.1, 1.0 - i * 0.1, 1.2, 14), M(i % 2 ? 0xffffff : 0xd8343a)); b.position.y = 0.6 + i * 1.2; lh.add(b); } const lamp = c.sprite(0xfff2b0, 3.2, 0, 6.8, 0, lh, 0.9); c.updaters.push((dt, tm) => { lamp.material.opacity = 0.6 + 0.35 * Math.sin(tm * 2); });
        /* the sea: a gently heaving surface */
        const geo = new T.PlaneGeometry(160, 150, 64, 48); geo.rotateX(-PI / 2); const sea = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x2f7fa8, roughness: 0.42, metalness: 0.05 }));   /* smooth: flat shading made glare squares */ sea.position.set(0, 0, -10); sea.receiveShadow = true;   /* reaches the upright-phone camera, which stands far back */ scene.add(sea);
        const pos = geo.attributes.position, base = Float32Array.from(pos.array); c.updaters.push((dt, tm) => { for (let i = 0; i < pos.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; pos.setY(i, Math.sin(x * 0.35 + tm * 1.1) * 0.12 + Math.sin(z * 0.5 + tm * 0.8) * 0.1); } pos.needsUpdate = true; geo.computeVertexNormals(); });
        for (let i = 0; i < 6; i++) { const g = c.sprite(0xffffff, 0.5, -20 + i * 8, 6 + (i % 3), -12 - i * 2, null, 0.85); g.scale.set(0.6, 0.18, 1); const k = i * 1.3; c.updaters.push((dt, tm) => { g.position.x = -24 + ((tm * 1.4 + k * 6) % 48); g.position.y = 6 + (i % 3) + Math.sin(tm * 3 + k) * 0.3; }); }
      } }
  };

  /* ---------------------------------------------------------------- models */
  function ship(c, s) { const g = new T.Group(); const hullM = M(0x6a3a1c, { roughness: 0.6 }), trim = M(0xd8b04a, { metalness: 0.6, roughness: 0.35 }), sailM = M(0xf4ead8, { roughness: 0.9, side: T.DoubleSide });
    const sh = new T.Shape(); sh.moveTo(-1.6, 0.6); sh.lineTo(1.3, 0.6); sh.lineTo(1.9, 1.2); sh.lineTo(1.5, 0); sh.lineTo(-1.3, 0); sh.lineTo(-1.8, 0.9); sh.closePath();
    const hull = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }), hullM); hull.position.z = -0.55; hull.castShadow = true; g.add(hull);
    const rail = new T.Mesh(new T.BoxGeometry(3.3, 0.1, 1.25), trim); rail.position.set(0, 0.7, 0); g.add(rail);
    for (const [x, h] of [[-0.6, 2.6], [0.7, 2.1]]) { const mast = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, h, 6), hullM); mast.position.set(x, 0.6 + h / 2, 0); g.add(mast); const sail = new T.Mesh(new T.PlaneGeometry(1.2, h * 0.55, 4, 2), sailM); sail.position.set(x, 0.9 + h * 0.5, 0.05); g.add(sail); const sp = sail.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.18 * Math.cos(sp.getX(i) * 2)); sp.needsUpdate = true; }
    const flag = new T.Mesh(new T.PlaneGeometry(0.55, 0.36), M(0x1a1a22, { side: T.DoubleSide })); flag.position.set(-0.32, 3.35, 0); g.add(flag); const skullDot = new T.Mesh(new T.CircleGeometry(0.08, 10), M(0xffffff)); skullDot.position.set(-0.32, 3.36, 0.01); g.add(skullDot);
    for (let i = 0; i < 3; i++) { const port = new T.Mesh(new T.CircleGeometry(0.1, 10), M(0x1a1a1a)); port.position.set(-0.7 + i * 0.6, 0.35, 0.64); g.add(port); }
    g.scale.setScalar(s || 1); g.userData.flag = flag; return g; }
  function cannon(c) { const g = new T.Group(); const iron = M(0x2e2e34, { metalness: 0.8, roughness: 0.35 }), wood = M(0x7a4a24, { roughness: 0.7 }), gold = M(0xd8b04a, { metalness: 0.8, roughness: 0.3 });
    const car = new T.Mesh(new T.BoxGeometry(1.5, 0.5, 1.0), wood); car.position.y = 0.45; g.add(car); for (const sx of [-0.5, 0.5]) for (const sz of [-0.55, 0.55]) { const w = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.14, 14), wood); w.rotation.x = PI / 2; w.position.set(sx, 0.3, sz); g.add(w); }
    const barrel = new T.Group(); barrel.position.set(0, 0.85, 0); barrel.rotation.z = 0.45; g.add(barrel); const tube = new T.Mesh(new T.CylinderGeometry(0.26, 0.36, 2.1, 18), iron); tube.rotation.z = -PI / 2; tube.position.x = 0.7; barrel.add(tube);
    for (const x of [0.1, 1.5]) { const band = new T.Mesh(new T.TorusGeometry(0.33, 0.06, 8, 20), gold); band.rotation.y = PI / 2; band.position.x = x; barrel.add(band); } const muzzle = new T.Object3D(); muzzle.position.x = 1.8; barrel.add(muzzle);
    g.userData.barrel = barrel; g.userData.muzzle = muzzle; return g; }
  function buoy(c, big, col) { const g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(big ? 0.22 : 0.13, big ? 0.28 : 0.16, big ? 0.55 : 0.3, 12), M(col || (big ? 0xd8343a : 0xf4ead8), { roughness: 0.5 })); b.position.y = big ? 0.2 : 0.1; g.add(b); if (big) { const cap = new T.Mesh(new T.SphereGeometry(0.2, 12, 8), M(0xffffff)); cap.position.y = 0.52; g.add(cap); } return g; }
  /* the aim sits ON the number line (Yoni 2026-10-08: the red marker was 'on the side, not exactly on the same line as the number' — it used to
     float on the ships' lane, in the fog): a ring round the chosen buoy and a pointer right above it. The ships' lane is straight behind it */
  function aimRing(c) { const g = new T.Group(); const red = new T.MeshBasicMaterial({ color: 0xff2a4a, transparent: true, opacity: 0.95, depthWrite: false }); const r = new T.Mesh(new T.TorusGeometry(0.4, 0.08, 8, 40), red); r.rotation.x = -PI / 2; r.position.y = 0.2; g.add(r);
    const tip = new T.Mesh(new T.ConeGeometry(0.2, 0.38, 10), red); tip.rotation.x = PI; tip.position.y = 0.92; g.add(tip); return g; }

  /* ---------------------------------------------------------------- real models (Yoni 2026-10-07: 'let's implement one of these packs and see how
     it looks in a live game'). Quaternius' pirate models, public domain (CC0), from poly.pizza: a galleon and a sloop to sink, a cannon on
     wheels, palm trees, and Captain Barbarossa with Ernest the parrot, who waves, ducks when the cannon fires, nods at a hit and shakes his
     head at a miss. One file, games/pirate_models.js (the GLB files end to end in base64, with an index; artifacts serve no .glb or .bin,
     made by tools/pack_models.py), read by three.js's GLTFLoader (shared/vendor-gltf.js). If either cannot load in time, the drawn models above stay */
  const ME = document.currentScript && document.currentScript.src, BASE = ME ? ME.replace(/games\/[^/]*$/, '') : 'shared/', PACK_V = 1;
  let packP = null;
  function loadPack() { if (packP) return packP;
    const need = (have, src) => have ? Promise.resolve() : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = BASE + src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
    return (packP = new Promise(res => { let over = false; const done = v => { if (!over) { over = true; res(v); } }; setTimeout(() => done(null), 9000);
      need(T.GLTFLoader, 'vendor-gltf.js?v=1').then(() => need(window.KQ_PIRATE_MODELS, 'games/pirate_models.js?v=' + PACK_V)).then(() => {
        const M = window.KQ_PIRATE_MODELS, bin = atob(M.data), buf = new Uint8Array(bin.length), loader = new T.GLTFLoader(), out = {}; window.KQ_PIRATE_MODELS = null;
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        return Promise.all(Object.keys(M.idx).map(k => new Promise(ok => { const [o, l] = M.idx[k]; loader.parse(buf.buffer.slice(o, o + l), '', g => { out[k] = g; ok(); }, () => ok()); })))
          .then(() => done(Object.keys(out).length ? out : null)); }).catch(() => done(null)); })); }
  /* the box of what is drawn (a skinned character's own box is its skeleton's, far too big) */
  function boxOf(o) { o.updateMatrixWorld(true); const b = new T.Box3(); o.traverse(m => { if (m.isMesh) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)); } }); return b; }
  /* a model sized so its length (or, with 'h', its height) is `size`, standing on y = 0 and centred, inside a group of its own */
  function fit(o, size, by) { const s = boxOf(o).getSize(new T.Vector3()); o.scale.multiplyScalar(size / (by === 'h' ? s.y : Math.max(s.x, s.z))); const b = boxOf(o), c = b.getCenter(new T.Vector3());
    o.position.x -= c.x; o.position.z -= c.z; o.position.y -= b.min.y; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); const g = new T.Group(); g.add(o); return g; }

  /* ---------------------------------------------------------------- the lines, level by level (targets avoid the numbered buoys: you count) */
  const pick = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function range(b, i) {
    if (b <= 1) return { min: 0, max: 5, step: 1, big: 1, small: 0, labels: [0, 5], pickT: () => ri(1, 4) };   /* only the ends are numbered: you count the buoys */
    if (b === 2) return { min: 0, max: 10, step: 1, big: 1, small: 0, labels: [0, 5, 10], pickT: () => pick([1, 2, 3, 4, 6, 7, 8, 9]) };
    if (b === 3) return { min: 0, max: 100, step: 5, big: 10, small: 5, labels: [0, 50, 100], pickT: () => pick([10, 20, 30, 40, 60, 70, 80, 90, 15, 35, 45, 65, 85]) };
    if (b === 4) return { min: 0, max: 1, step: 0.125, big: 0.25, small: 0.125, labels: [0, 0.5, 1], den: 8, frac: true, pickT: () => pick([0.25, 0.75, 0.125, 0.375, 0.625, 0.875]) };
    if (b === 5 && i < 3) return { min: 0, max: 1, step: 0.05, big: 0.1, small: 0.05, labels: [0, 0.5, 1], dp: true, pickT: () => pick([0.3, 0.7, 0.2, 0.8, 0.35, 0.65, 0.15, 0.85, 0.45]) };
    if (b === 5) return { min: -10, max: 10, step: 1, big: 1, small: 0, labels: [-10, 0, 10], neg: true, pickT: () => pick([-7, -3, -8, -2, -6, 3, 7, -4]) };
    return { min: 0, max: 10, step: 0.25, big: 1, small: 0.5, labels: [0, 5, 10], dp: true, wind: true, pickT: () => pick([2.5, 3.5, 6.5, 7.5, 3.25, 6.75, 7.25, 2.75, 8.5]) };
  }
  const fmtR = (v, R) => fmtNum(v, R.den ? { den: R.den } : null);

  /* ---------------------------------------------------------------- the lookout's clue (Yoni 2026-09-28: 'how does placing the marker in the right
     location make a thinking game?' — so the captain no longer calls the number: the lookout gives a clue you work out first, and every
     miss reports how far off it landed, so the next shot is a sum you do yourself). Clues grow with the band and within a round. */
  const LRM = '\u200E', ex = (a, op, b, R) => LRM + fmtR(a, R) + '\u00A0' + op + '\u00A0' + fmtR(b, R) + LRM;   /* keeps '9 − 2' left-to-right inside Hebrew, and on one line */
  const OPS = { 1: [1, 2], 2: [1, 2, 3, 4], 3: [10, 20, 30, 5, 15, 25], 4: [0.125, 0.25, 0.5], 5: [0.1, 0.2, 0.3], 6: [0.5, 1, 1.5, 2, 0.25] };
  function clue(R, v, b, i) { const on = x => x >= R.min - 1e-9 && x <= R.max + 1e-9 && Math.abs((x - R.min) / R.step - Math.round((x - R.min) / R.step)) < 1e-6, eq = (a, c) => Math.abs(a - c) < 1e-9;
    const A = R.neg ? [1, 2, 3, 4, 5] : OPS[Math.max(1, Math.min(6, b))], kinds = b <= 1 ? ['more', 'less'] : b === 2 ? (i < 2 ? ['more', 'less'] : ['more', 'less', 'sum', 'diff']) : b === 3 ? (i < 2 ? ['more', 'less'] : ['sum', 'diff', 'half', 'dbl']) : b === 4 ? ['half', 'more', 'less', 'sum'] : R.neg ? ['less', 'more', 'sum'] : ['sum', 'diff', 'half'];
    for (let n = 0; n < 60; n++) { const k = pick(kinds), a = pick(A);
      if (k === 'more') { const f = +(v - a).toFixed(4); if (on(f) && !eq(f, v)) return { key: 'cc_more', p: { a: fmtR(a, R), b: fmtR(f, R) }, h: 'cc_hMore', hp: { a: fmtR(a, R), b: fmtR(f, R) } }; }
      if (k === 'less') { const f = +(v + a).toFixed(4); if (on(f) && !eq(f, v)) return { key: 'cc_less', p: { a: fmtR(a, R), b: fmtR(f, R) }, h: 'cc_hLess', hp: { a: fmtR(a, R), b: fmtR(f, R) } }; }
      if (k === 'sum') { const x = R.neg ? -pick([6, 7, 8, 9]) : +(v - a).toFixed(4), y = +(v - x).toFixed(4); if (on(x) && !eq(x, 0) && !eq(y, 0) && Math.abs(y) <= R.max - R.min) return { key: 'cc_at', p: { e: ex(x, '+', y, R) }, h: 'cc_hSum', hp: { e: ex(x, '+', y, R) } }; }
      if (k === 'diff') { const x = +(v + a).toFixed(4); if (on(x)) return { key: 'cc_at', p: { e: ex(x, '−', a, R) }, h: 'cc_hDiff', hp: { e: ex(x, '−', a, R) } }; }
      if (k === 'half') { const d = b === 4 ? pick([0.125, 0.25]) : b === 3 ? pick([10, 20]) : pick(A), lo = +(v - d).toFixed(4), hi = +(v + d).toFixed(4); if (on(lo) && on(hi) && (b !== 3 || (lo % 10 === 0 && hi % 10 === 0))) return { key: 'cc_half', p: { a: fmtR(lo, R), b: fmtR(hi, R) }, h: 'cc_hHalf', hp: { a: fmtR(lo, R), b: fmtR(hi, R) } }; }
      if (k === 'dbl') { const h = v / 2; if (on(h) && !eq(h, 0)) return { key: 'cc_dbl', p: { a: fmtR(h, R) }, h: 'cc_hDbl', hp: { a: fmtR(h, R) } }; } }
    return { key: 'cc_plain', p: { n: fmtR(v, R) }, h: 'cc_hint', hp: { n: fmtR(v, R) } }; }

  /* ---------------------------------------------------------------- the stage */
  const STAGES = {
    gm_cannon(c) { const { scene } = c, K = KQKit.make(c), t = (k, p) => KQ.t(k, p);
      const S = { band: 2, view: 'bay', aim: null, hold: false, R: null };
      /* the line: its 0 at O, running along AX for L units; the ships sit SIDE of it. Wide screens see it across the bay; a portrait phone
         sees it run up the screen from the cannon (a line across a narrow screen is too small to count) */
      let L = 15, SC = 1, SH = 1.9; const O = new T.Vector3(-6.6, 0, 0.6), AX = new T.Vector3(1, 0, 0), SIDE = new T.Vector3(0, 0, -1), LBL = new T.Vector3(0, 0, 0.1);
      const P = (v, side, y) => O.clone().addScaledVector(AX, (v - S.R.min) / (S.R.max - S.R.min) * L).addScaledVector(SIDE, side || 0).setY(y || 0);
      const PV = p => S.R.min + p.clone().sub(O).dot(AX) / L * (S.R.max - S.R.min);
      const X = v => P(v).x;
      const snap = v => { const R = S.R, s = Math.round((v - R.min) / R.step) * R.step + R.min; return Math.max(R.min, Math.min(R.max, +s.toFixed(4))); };
      /* the shore: a rock with the cannon on it */
      const shore = new T.Group(); scene.add(shore); const rock = new T.Mesh(new T.DodecahedronGeometry(1.8, 0), M(0x8a7a6a, { flatShading: true })); rock.scale.set(1.4, 0.55, 1.1); rock.position.y = 0.2; shore.add(rock);
      const plank = new T.Mesh(new T.BoxGeometry(2.4, 0.14, 1.8), M(0x9a6a3a)); plank.position.y = 1.05; shore.add(plank); const gun = cannon(c); gun.position.y = 1.1; shore.add(gun);
      for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), M(0x2a2a30, { metalness: 0.7, roughness: 0.3 })); b.position.set(-0.8 + (i % 2) * 0.3, 1.28 + Math.floor(i / 2) * 0.2, 0.6 - (i % 2) * 0.1); shore.add(b); }
      const windG = new T.Group(); windG.visible = false; shore.add(windG); const pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.2, 6), M(0x7a5a3a)); pole.position.set(-0.9, 2.2, -0.5); windG.add(pole); const sock = new T.Mesh(new T.ConeGeometry(0.22, 1.0, 10, 1, true), M(0xff6a3a, { side: T.DoubleSide })); sock.position.set(-0.45, 3.1, -0.5); sock.rotation.z = -PI / 2; windG.add(sock);
      /* the number line: a rope, buoys, numbered flags (only where the level shows numbers) */
      const lineG = new T.Group(); scene.add(lineG); const tabs = [], small = () => Math.min(innerWidth, innerHeight) < 520;   /* a phone on its side: bigger numbers */
      function buildLine() { for (const tb of tabs.splice(0)) tb.userData.tablet.dispose(); while (lineG.children.length) lineG.remove(lineG.children[0]); const R = S.R;
        const rope = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, L, 6), M(0xe8d8b0)); rope.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), AX); rope.position.copy(O).addScaledVector(AX, L / 2).setY(0.16); lineG.add(rope);
        const n = Math.round((R.max - R.min) / (R.small || R.big)); for (let i = 0; i <= n; i++) { const v = R.min + i * (R.small || R.big), major = Math.abs((v - R.min) / R.big - Math.round((v - R.min) / R.big)) < 1e-6; const b = buoy(c, major, R.labels.some(l => Math.abs(l - v) < 1e-6) ? 0xd8343a : major ? 0xf4ead8 : 0xffe07a); b.position.copy(P(v)); b.scale.setScalar(SC * (major ? 1 : 1.25)); lineG.add(b);   /* the in-between marks are yellow and big enough to count */ b.userData.k = i * 1.3; }
        LBL.y = K.narrow() ? 2.0 : small() ? 1.4 : 1.25; for (const v of R.labels) { const tb = c.label(fmtR(v, R), -1, K.narrow() ? 1.8 : small() ? 0.62 : 0.4); tb.position.copy(P(v)).add(LBL); c.faceCam(tb); lineG.add(tb); tabs.push(tb); } }
      c.updaters.push((dt, tm) => { for (const b of lineG.children) if (b.userData.k != null) b.position.y = Math.sin(tm * 1.6 + b.userData.k) * 0.05; });
      /* fog over the sea where the ships hide */
      const fog = new T.Group(); fog.visible = false; scene.add(fog); const fogM = [];
      function buildFog() { while (fog.children.length) fog.remove(fog.children[0]); fogM.length = 0; for (let i = 0; i < 14; i++) { const q = P(S.R.min + (S.R.max - S.R.min) * (i / 13 * 1.08 - 0.04), SH + (i % 2) * 0.5 - 0.2, 1.1 + (i % 3) * 0.25); const sp = c.sprite(0xf8f4ff, 3.6 * SC, q.x, q.y, q.z, fog, 0.92); fogM.push(sp.material); } }
      const setFog = (on, dur) => { if (on) { fog.visible = true; for (const m of fogM) m.opacity = 0.92; return Promise.resolve(); } return K.anim(dur || 0.8, k => { for (const m of fogM) m.opacity = 0.92 * (1 - k); }).then(() => { fog.visible = false; }); };
      /* the aim: a red ring and post on the ships' line; no number on it — you read the line */
      const aim = aimRing(c); aim.visible = false; scene.add(aim); const setAim = v => { S.aim = v; aim.visible = v != null; if (v != null) aim.position.copy(P(v)); };
      K.pointer = { down(e) { if (!S.aiming) return false; const p = K.onPlane(e, 0); if (!p) return false; const off = p.clone().sub(O), along = off.dot(AX), side = off.dot(SIDE); if (side < -3.5 || side > SH + 3.5 || along < -2 || along > L + 2) return false; S.hold = true; setAim(snap(PV(p))); K.ready(); return true; },
        move(e) { if (!S.hold) return; const p = K.onPlane(e, 0); if (p) setAim(snap(PV(p))); }, up() { S.hold = false; }, cursor: () => S.aiming ? (S.hold ? 'grabbing' : 'crosshair') : 'default' };
      /* the real models: the cannon, the palms and the captain go in as soon as they load; the ships are made from them in newShip */
      const RM = { pack: null, mixer: null, acts: {}, cur: null, man: null };
      function capDo(n) { const a = RM.acts[n], cur = RM.cur; if (!RM.mixer || !a) return; a.reset(); a.setLoop(n === 'Idle' ? T.LoopRepeat : T.LoopOnce, Infinity); a.clampWhenFinished = n !== 'Idle'; a.enabled = true; a.setEffectiveWeight(1); a.play(); if (cur && cur !== a) cur.crossFadeTo(a, 0.25, false); RM.cur = a; }
      function dress(p) { RM.pack = p;
        if (p.cannon) { gun.traverse(m => { if (m.isMesh) m.visible = false; }); const rec = new T.Group(); rec.add(fit(p.cannon.scene, 1.7)); const bx = boxOf(rec), mz = new T.Object3D(); mz.position.set(bx.max.x, bx.min.y + (bx.max.y - bx.min.y) * 0.62, (bx.min.z + bx.max.z) / 2); rec.add(mz); gun.add(rec); gun.userData.barrel = rec; gun.userData.muzzle = mz; }
        if (p.palmA || p.palmB) { for (const o of c.oldPalms || []) o.visible = false; let k = 0; const palm = h => { const src = (k++ % 2 ? p.palmB : p.palmA) || p.palmA || p.palmB; return fit(src.scene.clone(true), h, 'h'); };
          for (const [x, y, z, s] of c.isles || []) for (let i = 0; i < 3; i++) { const t2 = palm(s * (2.4 + i * 0.5)); t2.position.set(x + (i - 1) * 1.3 * s, y - 0.25 * s, z + (i % 2) * 0.6 * s); t2.rotation.y = i * 2.1; scene.add(t2); }
          for (const [x, z, h, r] of [[-1.7, -0.7, 2.6, 0.4], [1.5, -0.95, 2.1, 2.5]]) { const t2 = palm(h); t2.position.set(x, 0.85, z); t2.rotation.y = r; shore.add(t2); } }
        if (p.captain) { const g = p.captain, cap = g.scene, man = fit(cap, 1.45, 'h'); RM.man = man; man.position.set(0.75, 1.12, 0.85); man.rotation.y = 0.35; shore.add(man); RM.mixer = new T.AnimationMixer(cap);
          for (const n of ['Idle', 'Wave', 'Duck', 'Yes', 'No', 'Jump', 'HitReact']) { const cl = g.animations.find(a => a.name.includes('|' + n + '|')); if (cl) RM.acts[n] = RM.mixer.clipAction(cl); }
          RM.mixer.addEventListener('finished', e => { if (e.action === RM.cur && RM.acts.Idle) capDo('Idle'); }); c.updaters.push(dt => RM.mixer.update(dt)); capDo('Idle'); setTimeout(() => capDo('Wave'), 400); } }
      const packReady = loadPack().then(p => { if (p) { try { dress(p); } catch (e) { RM.pack = null; } } return p; });
      function modelShip(s) { const p = RM.pack, k = p.sloop && (!p.galleon || Math.random() < 0.4) ? 'sloop' : 'galleon', inner = fit(p[k].scene.clone(true), k === 'sloop' ? 3.0 : 3.7); inner.position.y = -0.28; const g = new T.Group(); g.add(inner); g.scale.setScalar(s); return g; }
      /* ships */
      let foe = null; function newShip(v, shown) { if (foe) scene.remove(foe); foe = RM.pack && (RM.pack.galleon || RM.pack.sloop) ? modelShip(0.62 * SC) : ship(c, 0.62 * SC); foe.position.copy(P(v, SH)); foe.rotation.y = Math.atan2(-AX.z, AX.x) - 0.25; foe.visible = !!shown; scene.add(foe); foe.userData.v = v; return foe; }
      c.updaters.push((dt, tm) => { if (foe && !foe.userData.sinking) { foe.position.y = Math.sin(tm * 1.3) * 0.06; foe.rotation.z = Math.sin(tm * 1.1) * 0.04; if (foe.userData.flag) foe.userData.flag.rotation.y = Math.sin(tm * 4) * 0.3; } });
      /* the shot: recoil, smoke, an arc, then a splash or a hit */
      async function shoot(land) { capDo('Duck'); const mz = new T.Vector3(); gun.userData.muzzle.getWorldPosition(mz); const to = P(land, SH, 0.25), ball = new T.Mesh(new T.SphereGeometry(0.16 * SC + 0.04, 12, 8), M(0x1a1a20, { metalness: 0.6, roughness: 0.3 })); ball.position.copy(mz); scene.add(ball); K.sfx('tap');
        const br = gun.userData.barrel; c.tween(0.35, k => { br.position.x = -Math.sin(PI * k) * 0.25; }); for (let i = 0; i < 8; i++) { const sm = c.sprite(0xdedad4, 0.6, mz.x, mz.y, mz.z, null, 0.8); c.tween(1.1, k => { sm.position.set(mz.x + k * 0.8 + (i % 3) * 0.1, mz.y + k * 1.2, mz.z + (i % 2 - 0.5) * k); sm.scale.setScalar(0.6 + k * 1.6); sm.material.opacity = 0.8 * (1 - k); }, () => scene.remove(sm), i * 0.03); }
        const dist = mz.distanceTo(to), H = 2 + dist * 0.28, dur = 0.8 + dist * 0.045; await K.anim(dur, k => { ball.position.lerpVectors(mz, to, k); ball.position.y += Math.sin(PI * k) * H; }); scene.remove(ball); return to; }
      function splash(at) { for (let i = 0; i < 16; i++) { const d = c.sprite(0xe8f6ff, 0.35, at.x, 0.2, at.z, null, 0.95); const a = Math.random() * TAU, sp = 0.6 + Math.random() * 1.2, up = 1.5 + Math.random() * 2.5; c.tween(0.9, k => { d.position.set(at.x + Math.cos(a) * sp * k, 0.2 + up * k - 4.5 * k * k, at.z + Math.sin(a) * sp * k * 0.6); d.material.opacity = 0.95 * (1 - k); }, () => scene.remove(d)); }
        const ring = new T.Mesh(new T.TorusGeometry(0.3, 0.05, 6, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.set(at.x, 0.08, at.z); scene.add(ring); c.tween(1.1, k => { ring.scale.setScalar(1 + k * 4); ring.material.opacity = 0.9 * (1 - k); }, () => scene.remove(ring)); }
      async function sink(sh) { sh.visible = true; sh.userData.sinking = true; const p = sh.position.clone(); c.burst(p.clone().add(new T.Vector3(0, 1.2, 0)), 0xffa040, 26); c.burst(p.clone().add(new T.Vector3(0, 1.5, 0)), 0xfff0a0, 16); K.sfx('correct');
        await K.anim(1.8, k => { sh.rotation.z = -k * 0.7; sh.rotation.x = k * 0.2; sh.position.y = p.y - k * k * 2.4; }); scene.remove(sh); foe = null; }
      /* a little marker where a miss landed, with the number it hit — the gap is the lesson */
      const marks = []; function missMark(v) { const nar = K.narrow(), tb = c.label(fmtR(v, S.R), -1, nar ? 1.3 : small() ? 0.5 : 0.34), up = S.R.labels.some(x => Math.abs(x - v) < 1e-9) ? (nar ? 2.0 : 1.0) : 0; tb.position.copy(P(v)).add(LBL); tb.position.y += up; c.faceCam(tb); tb.userData.tablet.setState('wrong'); scene.add(tb); marks.push(tb); }
      const clearMarks = () => { for (const tb of marks.splice(0)) { scene.remove(tb); tb.userData.tablet.dispose(); } };
      /* the camera: the whole bay from the beach, the line across the screen, left to right on every screen (Yoni 2026-10-08: phones too —
         the old up-the-screen phone view showed the models from above). A narrow, upright screen backs the camera off until the whole line
         fits its width and lifts the bay into the upper half (the pad and the buttons are below); turning the phone sideways gives the full view */
      function frame(a) { const nar = a < 1.05, fov = a < 1.5 ? 46 : 42; if (S.shot) return { pos: S.shot.pos, look: S.shot.look, fov };
        const cx = O.x + L / 2 - (nar ? 0.6 : 1.0), need = 10.2 / (Math.tan(fov * PI / 360) * a), f = Math.max(1, need / 17.0), lift = nar ? (f - 1) * 2.6 : 0;
        return { pos: [cx, 1.0 - lift + 4.4 * f, O.z - 1.0 + 16.4 * f], look: [cx, 1.0 - lift, O.z - 1.0], fov }; }
      function layout() { L = 15; SC = 1; SH = 1.9; O.set(-6.6, 0, 0.6); AX.set(1, 0, 0); SIDE.set(0, 0, -1); LBL.set(0, 1.25, 0.1); shore.position.set(O.x - 1.9, 0, O.z - 0.2); shore.rotation.y = 0; shore.scale.setScalar(SC); }
      /* the numbers are sized for the screen's shape: rebuilt when the phone turns */
      c.updaters.push(() => { const n = K.narrow(); if (S.nar != null && n !== S.nar && S.R) { S.nar = n; buildLine(); } });
      /* close-ups on the hit and the win (Yoni 2026-10-08): the camera eases in on the ship as it sinks and on the captain at the end, then back */
      /* the numbers and the miss tags step aside during a close-up: the shot is the model's */
      const tagsShown = on => { for (const tb of tabs.concat(marks)) tb.visible = on; };
      const shotAt = (at, off, up) => { S.shot = { pos: at.clone().add(off).toArray(), look: at.clone().add(new T.Vector3(0, up, 0)).toArray() }; tagsShown(false); }, shotOff = () => { S.shot = null; tagsShown(true); };
      function shotShip(sh) { const p = sh.position.clone(); p.y = 0; shotAt(p, new T.Vector3(-2.4, 3.3, 6.2), 0.7); }   /* above and left of the buoy that marks the same number, so it never hides the hull */
      function shotCap() { const m = RM.man; if (!m) return; const p = m.getWorldPosition(new T.Vector3()), f = new T.Vector3(0, 0, 1).applyQuaternion(m.getWorldQuaternion(new T.Quaternion())); f.y = 0; f.normalize(); shotAt(p, f.multiplyScalar(4.4).add(new T.Vector3(0.8, 1.9, 0)), 1.0); }

      /* ---------------------------------------------------------------- one ship */
      const done = [], score = { pts: 0 };
      async function placeShip(i, n, kick) { const R = S.R, v = R.pickT(); const wind = R.wind ? pick([-1.5, -1, -0.5, 0.5, 1, 1.5]) : 0; S.v = v; S.wind = wind; windG.visible = !!wind; if (wind) sock.rotation.y = wind > 0 ? 0 : PI;
        newShip(v, false); await setFog(true); const wtxt = wind ? t(wind > 0 ? 'cc_right' : 'cc_left', { n: fmtR(Math.abs(wind), R) }) : '';
        const cl = clue(R, v, S.band, i); S.clue = cl; const line = t(cl.key, cl.p) + (wind ? ' ' + t('cc_windToo', { w: wtxt }) : ''); K.tell(kick, line);
        K.hint(() => K.tell(kick, t(cl.h, cl.hp) + (wind ? ' ' + t('cc_hintWind', { w: wtxt }) : '')));
        for (let shot = 1; shot <= 3; shot++) { setAim(null); S.aiming = true; await K.act(t('cc_fire'), { wait: true }); S.aiming = false; if (!K.alive()) return null;
          const land = snap(Math.max(R.min, Math.min(R.max, S.aim + wind))), at = await shoot(land); if (!K.alive()) return null; setAim(null);
          if (Math.abs(land - v) < R.step / 4) { await setFog(false, 0.4); K.tell(kick, t('cc_hit', { n: fmtR(v, R) })); capDo('Yes'); shotShip(foe); await K.wait(K.narrow() ? 1.6 : 1.0); await sink(foe); shotOff(); clearMarks(); K.hint(null); return shot; }
          splash(at); K.sfx('wrong'); missMark(land); capDo('No'); if (shot < 3) { K.tell(kick, t(land < v ? 'cc_short' : 'cc_far', { v: fmtR(land, R), d: fmtR(Math.abs(v - land), R) })); await K.wait(0.6); }   /* the gap, not the answer: the next aim is yours to work out */
        }
        await setFog(false, 0.6); K.tell(kick, t('cc_gone', { n: fmtR(v, R) })); capDo('HitReact'); await K.glide(foe, foe.position.clone().add(new T.Vector3(0, 0, -6)), 1.6); scene.remove(foe); foe = null; clearMarks(); K.hint(null); return 0; }
      async function readShip(i, n, kick) { const R = S.R, v = R.pickT(); S.v = v; S.wind = 0; windG.visible = false; newShip(v, true); fog.visible = false; K.tell(kick, t('cc_read')); K.hint(() => K.tell(kick, t('cc_hintRead')));
        for (let tries = 0; tries < 2; tries++) { const s = await K.pad({ dp: R.dp, frac: R.frac, neg: R.neg }); if (!K.alive()) return null; const got = parseNum(s);
          if (Math.abs(got - v) < R.step / 4) { K.tell(kick, t('cc_readYes', { n: fmtR(v, R) })); capDo('Yes'); await K.wait(0.5); await shoot(v); shotShip(foe); await K.wait(K.narrow() ? 1.6 : 1.0); await sink(foe); shotOff(); K.hint(null); return tries === 0 ? 1 : 2; }
          K.padBad(); K.sfx('wrong'); capDo('No'); K.tell(kick, t('cc_readNo', { v: String(s).replace('-', '−') })); await K.wait(1.4); if (tries === 0) K.tell(kick, t('cc_read')); }
        K.tell(kick, t('cc_readShow', { n: fmtR(v, R) })); await K.wait(1.8); await shoot(v); shotShip(foe); await K.wait(K.narrow() ? 1.6 : 1.0); await sink(foe); shotOff(); K.hint(null); return 0; }

      /* an upright phone is asked to turn sideways first (Yoni 2026-10-08): it goes on by itself when the phone turns, or with 'Play like this'
         (the same view, smaller). A picture of a phone turning, drawn in SVG; no sound */
      let turnBox = null;
      function turnPrompt() { return new Promise(res => { const root = document.querySelector('.sd-ui'); if (!root) { res(); return; }
        if (!document.getElementById('cc-turn-css')) { const st = document.createElement('style'); st.id = 'cc-turn-css'; st.textContent = '.cc-turn{position:absolute;top:calc(72px + env(safe-area-inset-top,0px));left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:24px;text-align:center;background:rgba(18,28,46,.84);color:#fff8ea;pointer-events:auto;font-family:var(--font-body,Rubik,sans-serif)}.cc-turn p{margin:0;max-width:300px;font:800 23px/1.35 var(--font-body,Rubik,sans-serif)}.cc-turn svg{width:132px;height:132px}.cc-turn .cc-ph{transform-origin:66px 66px;animation:ccTurn 2.4s ease-in-out infinite}@keyframes ccTurn{0%,20%{transform:rotate(0)}55%,85%{transform:rotate(-90deg)}100%{transform:rotate(0)}}'; document.head.appendChild(st); }
        const NS = 'http://www.w3.org/2000/svg', mk = (tag, at, par) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); par.appendChild(e); return e; };
        turnBox = document.createElement('div'); turnBox.className = 'cc-turn'; const svg = mk('svg', { viewBox: '0 0 132 132' }, turnBox);
        mk('path', { d: 'M22 70a44 44 0 0 1 70-36', fill: 'none', stroke: '#f2c14e', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg); mk('path', { d: 'M86 22l8 13-15 3', fill: 'none', stroke: '#f2c14e', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
        const ph = mk('g', { class: 'cc-ph' }, svg); mk('rect', { x: 46, y: 30, width: 40, height: 72, rx: 8, fill: '#2a3b5c', stroke: '#fff8ea', 'stroke-width': 4 }, ph); mk('rect', { x: 52, y: 40, width: 28, height: 50, rx: 3, fill: '#7fc4d8' }, ph); mk('circle', { cx: 66, cy: 96, r: 2.6, fill: '#fff8ea' }, ph);
        const tx = document.createElement('p'); tx.textContent = t('cc_turn'); turnBox.appendChild(tx);
        const go = document.createElement('button'); go.className = 'btn gold'; go.textContent = t('cc_turnGo'); turnBox.appendChild(go); root.appendChild(turnBox);
        const end = () => { removeEventListener('resize', check); if (turnBox) { turnBox.remove(); turnBox = null; } res(); }, check = () => { if (innerWidth / innerHeight >= 1.05) end(); };
        go.addEventListener('click', end); addEventListener('resize', check); }); }

      async function play(api) { K.mount(api); S.band = Math.max(1, Math.min(6, api.band || 2)); layout(); window.__cannon = { S, X, P, PV, setAim, snap, RM, packReady, fog, foe: () => foe, shore, shotShip, shotCap, shotOff };   /* test hook */
        const N = 6, nm = t('ag_cannon'); api.pips(N, done); S.R = range(S.band, 0); buildLine(); buildFog();
        S.nar = K.narrow(); if (S.nar && matchMedia('(pointer: coarse)').matches) { await turnPrompt(); if (!K.alive()) return; }
        await K.intro(async () => { K.tell(nm, t('cc_hi')); await K.act(t('cc_start')); if (!K.alive()) return; K.tell(nm, t('cc_how')); await K.act(t('cc_next')); }); if (!K.alive()) return; await packReady; if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const R = range(S.band, i); if (!S.R || R.min !== S.R.min || R.max !== S.R.max || R.step !== S.R.step) { S.R = R; buildLine(); buildFog(); } else S.R = R;
          const kick = t('cc_ship', { i: i + 1, n: N }), reading = S.band >= 2 && (i === 2 || i === 5);
          const r = reading ? await readShip(i, N, kick) : await placeShip(i, N, kick); if (r == null || !K.alive()) return;
          const pts = reading ? (r === 1 ? 10 : r === 2 ? 5 : 0) : (r === 1 ? 10 : r === 2 ? 6 : r === 3 ? 3 : 0); score.pts += pts; done.push(r === 1); api.pips(N, done); await K.wait(0.6); }
        const right = done.filter(Boolean).length; K.tell(nm, t('cc_win')); shotCap(); capDo('Jump'); await K.wait(2.0);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: score.pts + 50, correct: right, total: N, say: t('cc_win') }); }
      function dispose() { if (turnBox) { turnBox.remove(); turnBox = null; } K.dispose(); for (const tb of tabs.splice(0)) tb.userData.tablet.dispose(); clearMarks(); }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  /* ---------------------------------------------------------------- words (Hebrew in the plural: gender-neutral) */
  const STR = {
    en: { cc_hi: 'Ahoy! Pirate ships are hiding in the fog of the cove. The buoys are a number line: read it and aim true.', cc_how: 'The lookout never says the number: you get a clue. Work it out, drag the red aim to that place on the line and fire. Miss, and the lookout tells you how far off you were.', cc_start: 'Set sail', cc_next: 'Ready!',
      cc_ship: 'Ship {i} of {n}', cc_plain: 'A ship hides in the fog at {n}.', cc_more: 'Lookout: the ship is {a} more than {b}.', cc_less: 'Lookout: the ship is {a} less than {b}.', cc_at: 'Lookout: the ship is at {e}.', cc_half: 'Lookout: the ship is halfway between {a} and {b}.', cc_dbl: 'Lookout: the ship is at double {a}.', cc_windToo: 'And the wind pushes every shot {w}.',
      cc_hMore: 'Find {b} on the line, then count {a} more.', cc_hLess: 'Find {b} on the line, then count {a} back.', cc_hSum: 'Work out {e} first, then find it on the line.', cc_hDiff: 'Work out {e} first, then find it on the line.', cc_hHalf: 'Find {a} and {b}. The ship is in the middle, just as far from each.', cc_hDbl: 'Double means {a} and {a} again.', cc_right: '{n} further', cc_left: '{n} shorter',
      cc_turn: 'Turn your phone sideways to see the whole bay.', cc_turnGo: 'Play like this',
      cc_fire: 'Fire!', cc_hit: 'Hit! It was at {n}.', cc_short: 'Splash at {v}! Lookout: {d} too short.', cc_far: 'Splash at {v}! Lookout: {d} too far.', cc_gone: 'It slipped away! It was at {n}.',
      cc_read: 'This ship is in plain sight. Which number is it at? Type it.', cc_readYes: 'Yes, {n}! Fire!', cc_readNo: 'Not {v}. Count the marks from the nearest number.', cc_readShow: 'It sits at {n}. Fire!',
      cc_hint: 'Find the nearest number on a flag, then count the marks to {n}.', cc_hintWind: 'The wind moves the ball {w}. Aim just as far the other way.', cc_hintRead: 'Start from a numbered flag and count the marks to the ship.', cc_win: 'The whole fleet is sunk. The cove is safe!' },
    he: { cc_hi: 'אהוי! ספינות פיראטים מתחבאות בערפל של המפרץ. המצופים הם ישר מספרים: קוראים אותו ומכוונים בדיוק.', cc_how: 'התצפיתן אף פעם לא אומר את המספר: מקבלים רמז. פותרים אותו, גוררים את הכוונת האדומה למקום הזה על הישר ויורים. החטאתם? התצפיתן יגיד בכמה.', cc_start: 'מפליגים', cc_next: 'מוכנים!',
      cc_ship: 'ספינה {i} מתוך {n}', cc_plain: 'ספינה מתחבאת בערפל ב־{n}.', cc_more: 'התצפיתן: הספינה ב־{a} יותר מ־{b}.', cc_less: 'התצפיתן: הספינה ב־{a} פחות מ־{b}.', cc_at: 'התצפיתן: הספינה נמצאת ב־{e}.', cc_half: 'התצפיתן: הספינה בדיוק באמצע בין {a} ל־{b}.', cc_dbl: 'התצפיתן: הספינה נמצאת ב־{a} כפול 2.', cc_windToo: 'והרוח דוחפת כל ירייה {w}.',
      cc_hMore: 'מוצאים את {b} על הישר, וסופרים עוד {a} קדימה.', cc_hLess: 'מוצאים את {b} על הישר, וסופרים {a} אחורה.', cc_hSum: 'קודם פותרים {e}, ואז מוצאים את התוצאה על הישר.', cc_hDiff: 'קודם פותרים {e}, ואז מוצאים את התוצאה על הישר.', cc_hHalf: 'מוצאים את {a} ואת {b}. הספינה באמצע, באותו מרחק משניהם.', cc_hDbl: '{a} כפול 2 זה {a} ועוד {a}.', cc_right: 'רחוק יותר ב־{n}', cc_left: 'קרוב יותר ב־{n}',
      cc_turn: 'מסובבים את הטלפון לרוחב כדי לראות את כל המפרץ.', cc_turnGo: 'משחקים ככה',
      cc_fire: 'אש!', cc_hit: 'פגיעה! היא הייתה ב־{n}.', cc_short: 'שפריץ ב־{v}! התצפיתן: קצר מדי ב־{d}.', cc_far: 'שפריץ ב־{v}! התצפיתן: רחוק מדי ב־{d}.', cc_gone: 'היא ברחה! היא הייתה ב־{n}.',
      cc_read: 'הספינה הזאת גלויה. באיזה מספר היא נמצאת? מקלידים.', cc_readYes: 'כן, {n}! אש!', cc_readNo: 'לא {v}. סופרים את הסימונים מהמספר הקרוב.', cc_readShow: 'היא נמצאת ב־{n}. אש!',
      cc_hint: 'מוצאים את המספר הקרוב על דגל, וסופרים סימונים עד {n}.', cc_hintWind: 'הרוח מזיזה את הכדור {w}. מכוונים בדיוק באותה מידה לצד השני.', cc_hintRead: 'מתחילים מדגל עם מספר וסופרים סימונים עד הספינה.', cc_win: 'כל הצי טבע. המפרץ בטוח!' }
  };
  KQRealms.define('game-cannon', { strings: STR, themes: THEMES, stages: STAGES });
})();
