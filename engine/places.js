/* Kingdom Quest — the engine's places: where a game happens and who lives there. Low-poly, built in code in the meadow's own style
   (the same flat-shaded shapes as shared/kingdom3d.js), so a new place costs no art budget.
   A place = { name, pic, build(T, scene, ctx, action) → { update(dt) }, swallow: kit, program: kit }.
   A kit holds what one action needs in this place: the hero, the things to swallow or collect, the goal object, what goes home. */
(function () {
  'use strict';
  const MATS = new Map();
  function mat(c, o) { const k = c + JSON.stringify(o || {}); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.82, metalness: 0, flatShading: true }, o || {}))); return MATS.get(k); }
  function mesh(geo, m, x, y, z) { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }
  function group() { const g = new THREE.Group(); for (const c of arguments) g.add(c); return g; }
  const pick = (a, r) => a[Math.floor(r() * a.length)];

  // ---------- the shapes ----------
  const S = {
    hay() { const g = group(), c = mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.5, 12), mat(0xe9c46a)); c.rotation.z = Math.PI / 2; c.position.y = 0.62; g.add(c);
      for (const x of [-0.42, 0.42]) { const b = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.1, 12), mat(0xc99a3a)); b.rotation.z = Math.PI / 2; b.position.set(x, 0.62, 0); g.add(b); } return g; },
    pumpkin() { const b = mesh(new THREE.SphereGeometry(0.78, 12, 8), mat(0xf28c28), 0, 0.6, 0); b.scale.y = 0.78; return group(b, mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.32, 6), mat(0x4f772d), 0, 1.2, 0)); },
    crate() { return group(mesh(new THREE.BoxGeometry(1.25, 1.25, 1.25), mat(0xb07a45), 0, 0.63, 0), mesh(new THREE.BoxGeometry(1.32, 0.14, 1.32), mat(0x8a5a2b), 0, 1.22, 0), mesh(new THREE.BoxGeometry(1.32, 0.14, 1.32), mat(0x8a5a2b), 0, 0.07, 0)); },
    haystack() { return group(mesh(new THREE.ConeGeometry(0.95, 1.7, 9), mat(0xe2bd55), 0, 0.95, 0), mesh(new THREE.CylinderGeometry(0.98, 1, 0.22, 9), mat(0xc99a3a), 0, 0.11, 0)); },
    cart() { const g = group(mesh(new THREE.BoxGeometry(1.6, 0.6, 1), mat(0xc0392b), 0, 0.78, 0), mesh(new THREE.BoxGeometry(1.5, 0.3, 0.9), mat(0xe9c46a), 0, 1.18, 0), mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), mat(0x6d4c41), 1.15, 0.8, 0));
      for (const z of [-0.55, 0.55]) { const w = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 12), mat(0x5d4037), -0.2, 0.38, z); w.rotation.x = Math.PI / 2; g.add(w); } return g; },
    tree() { return group(mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 6), mat(0x7a5230), 0, 0.45, 0), mesh(new THREE.IcosahedronGeometry(0.78, 0), mat(0x5fae4e), 0, 1.35, 0), mesh(new THREE.IcosahedronGeometry(0.5, 0), mat(0x75c35f), 0.25, 1.8, 0.1)); },
    pine() { return group(mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.6, 6), mat(0x6d4c41), 0, 0.3, 0), mesh(new THREE.ConeGeometry(0.8, 1.2, 7), mat(0x2e7d4f), 0, 1.0, 0), mesh(new THREE.ConeGeometry(0.6, 1.0, 7), mat(0x35905a), 0, 1.6, 0), mesh(new THREE.ConeGeometry(0.38, 0.8, 7), mat(0x3fa466), 0, 2.15, 0)); },
    barn() { const g = group(mesh(new THREE.BoxGeometry(3.2, 2.2, 2.6), mat(0xb5432f), 0, 1.1, 0));
      const sh = new THREE.Shape(); sh.moveTo(-1.8, 0); sh.lineTo(1.8, 0); sh.lineTo(0, 1.4); sh.lineTo(-1.8, 0);
      const roof = mesh(new THREE.ExtrudeGeometry(sh, { depth: 2.9, bevelEnabled: false }), mat(0x7f2a1d), 0, 2.2, -1.45); g.add(roof);
      g.add(mesh(new THREE.BoxGeometry(1.2, 1.5, 0.08), mat(0xfaf3e0), 0, 0.75, 1.31), mesh(new THREE.BoxGeometry(1.0, 1.32, 0.1), mat(0x8e2b1d), 0, 0.72, 1.33), mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), mat(0xfaf3e0), 0, 2.65, 1.33)); return g; },
    fence(len) { const g = group(); const n = Math.max(2, Math.round(len / 0.9)); for (let i = 0; i < n; i++) g.add(mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), mat(0xd9b38c), -len / 2 + i * len / (n - 1), 0.4, 0));
      g.add(mesh(new THREE.BoxGeometry(len, 0.09, 0.06), mat(0xc8a07a), 0, 0.55, 0), mesh(new THREE.BoxGeometry(len, 0.09, 0.06), mat(0xc8a07a), 0, 0.28, 0)); return g; },
    fish(color) { const b = mesh(new THREE.SphereGeometry(0.6, 12, 8), mat(color), 0, 0.55, 0); b.scale.set(1.35, 0.85, 0.6);
      const t = mesh(new THREE.ConeGeometry(0.42, 0.6, 4), mat(color), -0.9, 0.55, 0); t.rotation.z = Math.PI / 2;
      return group(b, t, mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(0xffffff), 0.52, 0.7, 0.2), mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x111111), 0.58, 0.7, 0.26), mesh(new THREE.ConeGeometry(0.2, 0.4, 4), mat(color), 0, 1.05, 0)); },
    turtle() { const s = mesh(new THREE.SphereGeometry(0.85, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4f9d69), 0, 0.25, 0); s.scale.y = 0.75;
      return group(s, mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(0x9ccc65), 0.95, 0.4, 0), mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 10), mat(0x8bc34a), 0, 0.2, 0)); },
    buoy() { return group(mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 10), mat(0xe63946), 0, 0.35, 0), mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.4, 10), mat(0xfafafa), 0, 0.8, 0), mesh(new THREE.ConeGeometry(0.42, 0.6, 10), mat(0xe63946), 0, 1.3, 0)); },
    boat() { const g = group(mesh(new THREE.BoxGeometry(2.0, 0.55, 1.0), mat(0x9c6644), 0, 0.4, 0), mesh(new THREE.BoxGeometry(1.9, 0.12, 0.9), mat(0xd4a373), 0, 0.72, 0), mesh(new THREE.BoxGeometry(0.7, 0.45, 0.7), mat(0xfefae0), -0.35, 1.0, 0), mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), mat(0xe63946), -0.35, 1.27, 0));
      const p = mesh(new THREE.ConeGeometry(0.5, 0.7, 4), mat(0x9c6644), 1.25, 0.42, 0); p.rotation.z = -Math.PI / 2; g.add(p); return g; },
    lighthouse() { const g = group(mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.6, 10), mat(0x8d99ae), 0, 0.3, 0), mesh(new THREE.CylinderGeometry(0.7, 0.95, 3.6, 12), mat(0xfafafa), 0, 2.4, 0));
      for (const y of [1.4, 2.6, 3.7]) g.add(mesh(new THREE.CylinderGeometry(0.86 - y * 0.05, 0.88 - y * 0.05, 0.42, 12), mat(0xd62828), 0, y, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 12), mat(0x2b2d42), 0, 4.25, 0), mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 10), mat(0xffd166, { emissive: 0xffb703, emissiveIntensity: 0.9 }), 0, 4.6, 0), mesh(new THREE.ConeGeometry(0.66, 0.6, 10), mat(0xd62828), 0, 5.2, 0)); return g; },
    coins() { const g = group(); for (let i = 0; i < 3; i++) g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 14), mat(0xf4c542, { metalness: 0.45, roughness: 0.35 }), (i - 1) * 0.08, 0.08 + i * 0.17, 0)); return g; },
    barrel() { const g = group(mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.15, 12), mat(0x9a6b3f), 0, 0.58, 0)); for (const y of [0.25, 0.9]) g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12), mat(0x4a3b2a), 0, y, 0)); return g; },
    chest() { const lid = mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.3, 10, 1, false, 0, Math.PI), mat(0x8a5a2b), 0, 0.72, 0); lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2;
      return group(mesh(new THREE.BoxGeometry(1.3, 0.72, 0.84), mat(0x8a5a2b), 0, 0.36, 0), lid, mesh(new THREE.BoxGeometry(0.16, 1.18, 0.88), mat(0xf4c542, { metalness: 0.4 }), 0, 0.6, 0)); },
    cannon() { const b = mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.6, 10), mat(0x2b2d42, { metalness: 0.3 }), 0.1, 0.65, 0); b.rotation.z = Math.PI / 2 - 0.35; const g = group(b, mesh(new THREE.BoxGeometry(1.1, 0.35, 0.7), mat(0x7f5539), 0, 0.3, 0));
      for (const z of [-0.42, 0.42]) { const w = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10), mat(0x5d4037), 0, 0.3, z); w.rotation.x = Math.PI / 2; g.add(w); } return g; },
    palm() { const g = group(); let x = 0; for (let i = 0; i < 6; i++) { x += 0.06 * i; g.add(mesh(new THREE.CylinderGeometry(0.16 - i * 0.012, 0.19 - i * 0.012, 0.55, 7), mat(i % 2 ? 0x9c6644 : 0x8a5a3c), x, 0.28 + i * 0.52, 0)); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, l = mesh(new THREE.ConeGeometry(0.28, 1.7, 4), mat(0x52b788), 0, 0, 0); l.scale.z = 0.25; l.position.set(x + Math.cos(a) * 0.7, 3.25, Math.sin(a) * 0.7); l.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); g.add(l); }
      return g; },
    ship() { const g = group(mesh(new THREE.BoxGeometry(4.2, 1.1, 1.7), mat(0x7f4f24), 0, 0.75, 0), mesh(new THREE.BoxGeometry(4.0, 0.2, 1.5), mat(0xb08968), 0, 1.35, 0), mesh(new THREE.BoxGeometry(1.0, 0.7, 1.5), mat(0x7f4f24), -1.6, 1.75, 0));
      const p = mesh(new THREE.ConeGeometry(0.85, 1.4, 4), mat(0x7f4f24), 2.75, 0.75, 0); p.rotation.z = -Math.PI / 2; p.rotation.x = Math.PI / 4; g.add(p);
      for (const [x, h] of [[-0.6, 3.6], [1.0, 3.0]]) { g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 6), mat(0x5d4037), x, 1.35 + h / 2, 0)); g.add(mesh(new THREE.BoxGeometry(0.08, h * 0.45, 1.4), mat(0xfefae0), x + 0.1, 1.6 + h * 0.5, 0)); }
      const f = mesh(new THREE.BoxGeometry(0.04, 0.4, 0.6), mat(0x111111), -0.6, 5.1, 0.32); g.add(f); return g; },
    rock(c) { const r = mesh(new THREE.DodecahedronGeometry(0.6, 0), mat(c || 0x8d99ae), 0, 0.42, 0); r.scale.set(1, 0.8, 0.9); return group(r); },
    mole() { return group(mesh(new THREE.SphereGeometry(0.45, 10, 8), mat(0x6d4c41), 0, 0.2, 0), mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(0xf4a6b7), 0.43, 0.32, 0), mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0x111111), 0.32, 0.47, 0.14), mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0x111111), 0.32, 0.47, -0.14), mesh(new THREE.SphereGeometry(0.13, 6, 4), mat(0xf4a6b7), 0.3, 0.06, 0.32), mesh(new THREE.SphereGeometry(0.13, 6, 4), mat(0xf4a6b7), 0.3, 0.06, -0.32)); },
    crab() { const b = mesh(new THREE.SphereGeometry(0.42, 10, 8), mat(0xe76f51), 0, 0.3, 0); b.scale.set(1.25, 0.6, 1); const g = group(b);
      for (const z of [-1, 1]) { g.add(mesh(new THREE.SphereGeometry(0.17, 8, 6), mat(0xe76f51), 0.45, 0.32, z * 0.42), mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 5), mat(0xe76f51), 0.18, 0.55, z * 0.12), mesh(new THREE.SphereGeometry(0.07, 6, 4), mat(0x111111), 0.18, 0.7, z * 0.12)); } return g; },
    diver() { const g = group(mesh(new THREE.SphereGeometry(0.42, 14, 10), mat(0xf2c14e, { metalness: 0.2, roughness: 0.5, flatShading: false }), 0, 0.46, 0), mesh(new THREE.SphereGeometry(0.26, 14, 10), mat(0xbde0fe, { transparent: true, opacity: 0.75, roughness: 0.1, flatShading: false }), 0.25, 0.62, 0), mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0xffffff, { emissive: 0xfff3b0, emissiveIntensity: 1 }), 0.4, 0.38, 0));
      const pr = mesh(new THREE.BoxGeometry(0.04, 0.42, 0.1), mat(0x495057), -0.47, 0.46, 0); g.add(pr, mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6), mat(0x495057), -0.42, 0.46, 0)); g.userData.spin = pr;
      for (const z of [-0.36, 0.36]) g.add(mesh(new THREE.BoxGeometry(0.34, 0.1, 0.12), mat(0xe09f3e), 0, 0.14, z)); return g; },
    rabbit() { const b = mesh(new THREE.SphereGeometry(0.36, 12, 10), mat(0xf1ece4, { flatShading: false }), -0.05, 0.36, 0); b.scale.set(1.2, 1, 1);
      const g = group(b, mesh(new THREE.SphereGeometry(0.25, 12, 10), mat(0xf1ece4, { flatShading: false }), 0.3, 0.68, 0), mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xf4a6b7), 0.54, 0.68, 0), mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xffffff, { flatShading: false }), -0.47, 0.42, 0));
      for (const z of [-0.09, 0.09]) { const e = mesh(new THREE.CapsuleGeometry(0.06, 0.34, 4, 8), mat(0xf1ece4, { flatShading: false }), 0.26, 1.05, z); e.rotation.z = -0.2; e.rotation.x = z * 2; g.add(e, mesh(new THREE.SphereGeometry(0.045, 6, 4), mat(0x222222), 0.48, 0.76, z * 1.3)); } return g; },
    dragon() { const b = mesh(new THREE.SphereGeometry(0.36, 12, 10), mat(0x43aa8b), 0, 0.55, 0); b.scale.set(1.25, 1, 0.95);
      const g = group(b, mesh(new THREE.SphereGeometry(0.25, 12, 10), mat(0x43aa8b), 0.4, 0.85, 0), mesh(new THREE.BoxGeometry(0.22, 0.14, 0.2), mat(0x52b788), 0.62, 0.8, 0), mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0xb7e4c7), 0.05, 0.47, 0));
      const t = mesh(new THREE.ConeGeometry(0.16, 0.7, 6), mat(0x43aa8b), -0.62, 0.5, 0); t.rotation.z = Math.PI / 2 + 0.3; g.add(t);
      for (const z of [-0.1, 0.1]) g.add(mesh(new THREE.ConeGeometry(0.05, 0.18, 5), mat(0xffd166), 0.36, 1.12, z), mesh(new THREE.SphereGeometry(0.045, 6, 4), mat(0x111111), 0.58, 0.95, z * 1.1));
      const wings = []; for (const z of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-0.35, 0.65); sh.lineTo(0.35, 0.3); sh.lineTo(0, 0); const w = mesh(new THREE.ShapeGeometry(sh), mat(0xf4a261, { side: THREE.DoubleSide }), 0, 0.72, z * 0.2); w.rotation.x = z * 0.9; wings.push(w); g.add(w); }
      g.userData.wings = wings; return g; },
    pearl() { const shell = (y, rx, rz, x) => { const m = mesh(new THREE.SphereGeometry(0.42, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf7a8c4, { side: THREE.DoubleSide }), x || 0, y, 0); m.scale.y = 0.42; m.rotation.set(rx, 0, rz); return m; };
      return group(shell(0.17, Math.PI, 0), shell(0.24, 0, 1.25, -0.3), mesh(new THREE.SphereGeometry(0.2, 18, 14), mat(0xffffff, { metalness: 0.35, roughness: 0.12, flatShading: false }), 0.04, 0.33, 0)); },
    corn() { const c = mesh(new THREE.CapsuleGeometry(0.17, 0.5, 4, 8), mat(0xffd23f), 0, 0.5, 0); const g = group(c);
      for (let i = 0; i < 3; i++) { const l = mesh(new THREE.ConeGeometry(0.12, 0.62, 4), mat(0x6a994e), Math.cos(i * 2.1) * 0.12, 0.33, Math.sin(i * 2.1) * 0.12); l.rotation.set(Math.sin(i * 2.1) * 0.35, 0, -Math.cos(i * 2.1) * 0.35); g.add(l); } return g; },
    star() { const sh = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.42; if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const s = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), mat(0xffd166, { emissive: 0xffb703, emissiveIntensity: 0.55 }), 0, 0.55, -0.06); s.rotation.y = Math.PI / 2; return group(s); },
    cloud(c) { const m = mat(c || 0xffffff, { flatShading: false, roughness: 1 }), g = group(); for (const [x, y, z, r] of [[0, 0.4, 0, 0.6], [0.55, 0.32, 0.1, 0.45], [-0.55, 0.3, -0.05, 0.45], [0.2, 0.62, -0.1, 0.4]]) g.add(mesh(new THREE.SphereGeometry(r, 12, 10), m, x, y, z)); return g; },
    coral(c) { const g = group(); for (let i = 0; i < 5; i++) { const h = 0.5 + i * 0.12; const b = mesh(new THREE.CylinderGeometry(0.06, 0.1, h, 5), mat(c), Math.cos(i * 1.3) * 0.22, h / 2, Math.sin(i * 1.3) * 0.22); b.rotation.z = Math.cos(i) * 0.4; g.add(b, mesh(new THREE.SphereGeometry(0.1, 6, 4), mat(c), Math.cos(i * 1.3) * 0.22 + Math.sin(b.rotation.z) * -h / 2, h, Math.sin(i * 1.3) * 0.22)); } return g; },
    weed() { const g = group(); for (let i = 0; i < 3; i++) { const w = mesh(new THREE.ConeGeometry(0.09, 1.4 + i * 0.3, 4), mat(0x2d6a4f), (i - 1) * 0.15, 0.7 + i * 0.15, 0); g.add(w); } return g; },
    flower(c) { return group(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), mat(0x4f772d), 0, 0.15, 0), mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(c), 0, 0.32, 0)); }
  };

  // ---------- light, sky and ground shared by every place ----------
  function env(scene, o) {
    scene.background = new THREE.Color(o.sky); scene.fog = new THREE.Fog(o.fog || o.sky, o.fogNear || 30, o.fogFar || 75);
    scene.add(new THREE.HemisphereLight(o.hiSky || 0xeaf6ff, o.hiGround || 0x8a7a55, 1.0));
    const sun = new THREE.DirectionalLight(0xfff1d6, o.sun || 1.7); sun.position.set(14, 26, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 80 }); sun.shadow.bias = -0.0006; scene.add(sun, sun.target);
    const g = mesh(new THREE.CircleGeometry(o.groundR || 60, 48), mat(o.ground, { flatShading: false, roughness: 1 })); g.rotation.x = -Math.PI / 2; g.castShadow = false; scene.add(g);
    return sun;
  }
  /* scatter decor outside a free circle (the field or the board) */
  function ring(scene, r, from, to, n, make, rng) { const out = []; for (let i = 0; i < n; i++) { const a = rng() * Math.PI * 2, d = from + rng() * (to - from), o = make(i); o.position.set(Math.cos(a) * d, o.position.y, Math.sin(a) * d); o.rotation.y = rng() * Math.PI * 2; scene.add(o); out.push(o); } return out; }
  function fenceRing(scene, r) { const n = 28; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, f = S.fence(2 * Math.PI * r / n); f.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); f.rotation.y = -a + Math.PI / 2; scene.add(f); } }
  const free = (ctx, action) => action === 'swallow' ? ctx.kit.field + 2 : 6.2;

  // ---------- the places ----------
  KQE.place('farm', {
    name: { he: 'החווה', en: 'The Farm' }, pic: 'cow',
    build(T, scene, ctx, action) { const r = ctx.rng; env(scene, { sky: 0xbfe6ff, ground: 0x86c25a, hiGround: 0x6a9a3a, fogNear: 34, fogFar: 80 });
      const F = free(ctx, action); if (action === 'swallow') fenceRing(scene, F);
      ring(scene, 0, F + 1.5, F + 14, 46, i => (i % 3 ? S.pine() : S.tree()), r); ring(scene, 0, F + 0.8, F + 10, 30, i => S.flower([0xffd6e0, 0xffffff, 0xffe066][i % 3]), r);
      if (action === 'program') { const b = S.barn(); b.position.set(-2, 0, -11); scene.add(b); const h = S.haystack(); h.position.set(6, 0, -8); scene.add(h); }
      return {}; },
    swallow: { field: 13, heroPic: 'swirl', goalPic: 'house', itemPic: 'wheat', rim: 0x6d4c41, hero: S.mole,
      small: [S.hay, S.pumpkin, S.crate], mid: [S.haystack, S.cart], big: [S.tree, S.pine], goal: () => ({ g: S.barn(), size: 2.3 }),
      leaves: { pic: 'house', say: { he: 'הרפת עוברת לממלכה שלך', en: 'The barn moves into your kingdom' } } },
    program: { heroPic: 'rabbit', goalPic: 'corn', collectPic: 'corn', collectWord: { he: 'קלחי תירס', en: 'corn cobs' }, hero: S.rabbit, collect: S.corn, rock: S.hay,
      tileA: 0x9bd770, tileB: 0x86c25a, base: 0x7a5230,
      leaves: { pic: 'corn', say: { he: 'התירס עובר לאסם שלך בממלכה', en: "The corn goes to your kingdom's barn" } } }
  });

  KQE.place('ocean', {
    name: { he: 'אוקיינוס השמיים', en: 'The Sky Ocean' }, pic: 'wave',
    build(T, scene, ctx, action) { const r = ctx.rng; env(scene, { sky: 0xcfe8ff, ground: 0x48b5d6, hiSky: 0xf0f8ff, hiGround: 0x2a7ea0, fogNear: 30, fogFar: 78, sun: 1.5 });
      const F = free(ctx, action), clouds = ring(scene, 0, F + 2, F + 16, 26, () => { const c = S.cloud(); c.scale.setScalar(1.6 + r() * 1.8); c.position.y = 1 + r() * 4; return c; }, r);
      ring(scene, 0, F + 0.6, F + 1.6, 22, () => S.buoy(), r);
      let t = 0; return { update(dt) { t += dt; clouds.forEach((c, i) => { c.position.y += Math.sin(t * 0.6 + i) * 0.003; }); } }; },
    swallow: { field: 13, heroPic: 'swirl', goalPic: 'tower', itemPic: 'tropicalfish', rim: 0x1d6f8f, swirl: true, bob: true,
      small: [() => S.fish(0xff8fab), () => S.fish(0xffd166), () => S.fish(0x90e0ef)], mid: [S.turtle, S.buoy], big: [S.boat], goal: () => ({ g: S.lighthouse(), size: 2.2 }),
      leaves: { pic: 'tower', say: { he: 'המגדלור עובר לממלכה שלך', en: 'The lighthouse moves into your kingdom' } } }
  });

  KQE.place('pirate', {
    name: { he: 'מפרץ הפיראטים', en: 'Pirate Cove' }, pic: 'pirateflag',
    build(T, scene, ctx, action) { const r = ctx.rng; env(scene, { sky: 0x9fd8f0, ground: 0x3aa6c9, hiGround: 0x2d7f99, fogNear: 32, fogFar: 80 });
      const F = free(ctx, action), sand = mesh(new THREE.CircleGeometry(F + 3.5, 40), mat(0xecd29b, { flatShading: false, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.y = 0.02; sand.castShadow = false; scene.add(sand);
      ring(scene, 0, F + 0.5, F + 3, 18, () => S.palm(), r); ring(scene, 0, F + 0.3, F + 3.2, 14, () => S.rock(0xb08968), r);
      return {}; },
    swallow: { field: 12, heroPic: 'swirl', goalPic: 'sailboat', itemPic: 'coin', rim: 0xc8a165, hero: S.crab,
      small: [S.coins, S.barrel, S.crate], mid: [S.chest, S.cannon], big: [S.palm], goal: () => ({ g: S.ship(), size: 2.4 }),
      leaves: { pic: 'sailboat', say: { he: 'ספינת הפיראטים עוגנת בממלכה שלך', en: 'The pirate ship docks in your kingdom' } } }
  });

  KQE.place('seabed', {
    name: { he: 'קרקעית הים', en: 'The Seabed' }, pic: 'octopus',
    build(T, scene, ctx, action) { const r = ctx.rng; env(scene, { sky: 0x1f7f99, fog: 0x1f7f99, ground: 0x7fb3a8, hiSky: 0xd8f6ff, hiGround: 0x5f8f86, fogNear: 22, fogFar: 52, sun: 1.6 });
      const weeds = ring(scene, 0, 6.6, 15, 40, i => (i % 3 ? S.weed() : S.coral([0xff8fab, 0xffb703, 0xc77dff][i % 3])), r);
      ring(scene, 0, 7, 14, 10, () => S.rock(0x6c757d), r);
      const bub = []; for (let i = 0; i < 26; i++) { const b = mesh(new THREE.SphereGeometry(0.06 + r() * 0.08, 8, 6), mat(0xe0fbfc, { transparent: true, opacity: 0.6, flatShading: false }), (r() - 0.5) * 22, r() * 8, -4 - r() * 8); b.castShadow = false; scene.add(b); bub.push(b); }
      let t = 0; return { update(dt) { t += dt; weeds.forEach((w, i) => { w.rotation.z = Math.sin(t * 1.3 + i) * 0.12; }); bub.forEach(b => { b.position.y += dt * 0.8; if (b.position.y > 9) b.position.y = 0; }); } }; },
    program: { heroPic: 'robot', goalPic: 'shell', collectPic: 'shell', collectWord: { he: 'פנינים', en: 'pearls' }, hero: S.diver, collect: S.pearl, rock: () => S.rock(0x6c757d),
      tileA: 0xf6e7bf, tileB: 0xbfe6e0, base: 0x4f7a72,
      leaves: { pic: 'shell', say: { he: 'הפנינים עוברות לאוצר שלך בממלכה', en: "The pearls go to your kingdom's treasure" } } }
  });

  KQE.place('sky', {
    name: { he: 'איי השמיים', en: 'The Sky Isles' }, pic: 'cloud',
    build(T, scene, ctx, action) { const r = ctx.rng; env(scene, { sky: 0x8fd0ff, ground: 0xdcefff, hiSky: 0xffffff, hiGround: 0xc8defa, fogNear: 24, fogFar: 64, sun: 1.8 }); scene.children.filter(o => o.geometry && o.geometry.type === 'CircleGeometry').forEach(o => { o.position.y = -3; });
      const clouds = ring(scene, 0, 8.5, 22, 34, () => { const c = S.cloud(); c.scale.setScalar(1.4 + r() * 2.2); c.position.y = -2.6 + r() * 1.0; return c; }, r);
      let t = 0; return { update(dt) { t += dt; clouds.forEach((c, i) => { c.position.x += Math.sin(t * 0.2 + i) * 0.004; }); } }; },
    program: { heroPic: 'dragon', goalPic: 'star', collectPic: 'star', collectWord: { he: 'כוכבים', en: 'stars' }, hero: S.dragon, collect: S.star, rock: () => S.cloud(0x8d99ae),
      tileA: 0xffffff, tileB: 0xe3f0ff, base: 0xbcd4f6, fly: true,
      leaves: { pic: 'star', say: { he: 'הכוכבים מאירים את השמיים של הממלכה שלך', en: "The stars light up your kingdom's sky" } } }
  });

  KQE.shapes = S; KQE.mat = mat; KQE.mesh = mesh;
})();
