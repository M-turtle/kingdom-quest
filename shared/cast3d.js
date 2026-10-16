/* Kingdom Quest — the cast: the hosts of the twenty-four secret places as living 3D figures (three.js r160 core, procedural).
   KQCast.build(id) → { root, update(dt, tm), react('ok'|'bad'|'wave'|'cheer'), talk(on), dispose() }
   One anatomy and one material family for all of them — a turned body with real drapery folds, a big head with glossy eyes,
   arms on shoulder pivots; velvet cloth with a woven normal map, strand-textured hair, soft skin, real metal, clear enamel —
   so the wizard, the bee and the troll read as one set of collectible figures from the same kingdom. They breathe, blink and
   sway; they talk (mouth), cheer on a right answer and shake their head on a wrong one. Each stands on its feet at the
   origin, facing +z, about 3 units tall. The caller positions `root`; the animator only moves an inner group. */
(function () {
  'use strict';
  const T = window.THREE; if (!T) return;
  const PI = Math.PI, R = (a, b) => a + Math.random() * (b - a);

  /* ---------------------------------------------------------------- procedural normal maps (fabric weave, hair strands, fur, bark) */
  const nCache = new Map();
  function normalTex(kind, rep) {
    const key = kind + (rep || ''); if (nCache.has(key)) return nCache.get(key);
    const N = 256, h = new Float32Array(N * N), rnd = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = 0;
      if (kind === 'weave') v = 0.5 + 0.25 * Math.sin(x * PI / 4) * (Math.floor(y / 8) % 2 ? 1 : -1) + 0.25 * Math.sin(y * PI / 4) * (Math.floor(x / 8) % 2 ? 1 : -1);
      else if (kind === 'hair') v = 0.5 + 0.35 * Math.sin(x * 0.55 + Math.sin(y * 0.04 + x * 0.013) * 2.2) + 0.15 * rnd(x * 7 + Math.floor(y / 16));
      else if (kind === 'fur') v = 0.5 + 0.3 * Math.sin(x * 0.8 + Math.sin(y * 0.3) * 1.5) * Math.sin(y * 0.35 + x * 0.1) + 0.2 * rnd(x * 13 + y * 7);
      else if (kind === 'bark') v = 0.5 + 0.4 * Math.sin(x * 0.18 + Math.sin(y * 0.05) * 2.5) + 0.1 * rnd(x + y * 3);
      else if (kind === 'leather') v = 0.5 + 0.12 * rnd(x * 31 + y * 17) + 0.1 * Math.sin(x * 0.3) * Math.sin(y * 0.27);
      else if (kind === 'straw') v = 0.5 + 0.4 * Math.sin(x * 0.9 + Math.sin(y * 0.02) * 3) * (0.6 + 0.4 * rnd(Math.floor(x / 3)));
      h[y * N + x] = v;
    }
    const c = document.createElement('canvas'); c.width = c.height = N; const ctx = c.getContext('2d'); const img = ctx.createImageData(N, N); const s = kind === 'weave' ? 2.2 : 3.2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const hx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)], hy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x]; let nx = -hx * s, ny = -hy * s, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; const i = (y * N + x) * 4; img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255; }
    ctx.putImageData(img, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep || 6, rep || 6); t.colorSpace = T.NoColorSpace; nCache.set(key, t); return t;
  }

  /* ---------------------------------------------------------------- materials (cached per look) */
  const cache = new Map();
  const mat = (key, make) => { let m = cache.get(key); if (!m) { m = make(); m.userData.shared = true; cache.set(key, m); } return m; };
  const tinted = (m, c) => { m.userData.tint = c; return m; };
  const col = c => new T.Color(c);
  const SKIN = c => mat('skin' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.48, sheen: 0.7, sheenRoughness: 0.6, sheenColor: col(c).lerp(col(0xffd8c8), 0.7), clearcoat: 0.12, clearcoatRoughness: 0.5 }));
  const CLOTH = (c, map, nk) => mat('cloth' + c + (map ? map.uuid : '') + (nk || ''), () => tinted(new T.MeshPhysicalMaterial({ color: map ? 0xffffff : c, map: map || null, roughness: 0.8, sheen: 1, sheenRoughness: 0.4, sheenColor: col(c).lerp(col(0xffffff), 0.4), normalMap: normalTex(nk || 'weave', nk === 'fur' ? 3 : 8), normalScale: new T.Vector2(0.45, 0.45) }), c));
  const HAIR = c => mat('hair' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.46, sheen: 1, sheenRoughness: 0.3, sheenColor: col(c).lerp(col(0xffffff), 0.5), normalMap: normalTex('hair', 3), normalScale: new T.Vector2(0.8, 0.8), clearcoat: 0.2 }));
  const FUR = c => mat('fur' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.85, sheen: 1, sheenRoughness: 0.5, sheenColor: col(c).lerp(col(0xfff0d8), 0.5), normalMap: normalTex('fur', 3), normalScale: new T.Vector2(0.9, 0.9) }));
  const LEATHER = c => mat('leather' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4, normalMap: normalTex('leather', 5), normalScale: new T.Vector2(0.5, 0.5) }));
  const METAL = (c, r) => mat('metal' + c + '_' + r, () => new T.MeshStandardMaterial({ color: c, metalness: 1, roughness: r == null ? 0.3 : r }));
  const GLOSS = (c, r) => mat('gloss' + c + '_' + r, () => new T.MeshPhysicalMaterial({ color: c, roughness: r == null ? 0.3 : r, clearcoat: 1, clearcoatRoughness: 0.1 }));
  const MATTE = (c, r) => mat('matte' + c + '_' + r, () => new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.85 : r }));
  const GLOW = (c, i) => mat('glow' + c + '_' + i, () => new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i == null ? 2.2 : i, roughness: 0.35 }));
  const GHOST = c => mat('ghost' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.72, emissive: 0x6a9ad8, emissiveIntensity: 0.22, depthWrite: true }));
  const WING = c => mat('wing' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.4, side: T.DoubleSide, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 620], clearcoat: 1, depthWrite: false, emissive: c, emissiveIntensity: 0.12 }));

  /* ---------------------------------------------------------------- colour patterns */
  const texCache = new Map();
  function pattern(kind, a, b, rep) {
    const key = kind + a + b + (rep || ''); if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 256, 256);
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    if (kind === 'stars') { for (let i = 0; i < 22; i++) { const px = rnd() * 256, py = rnd() * 256, r = 4 + rnd() * 6; x.fillStyle = b; x.beginPath(); for (let k = 0; k < 10; k++) { const an = k / 10 * PI * 2 - PI / 2, rr = k % 2 ? r * 0.45 : r; x.lineTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr); } x.closePath(); x.fill(); } x.strokeStyle = 'rgba(210,225,255,0.4)'; x.lineWidth = 2.2; for (let i = 0; i < 8; i++) { x.beginPath(); const px = rnd() * 256, py = rnd() * 256; for (let t = 0; t < 7; t += 0.2) x.lineTo(px + Math.cos(t) * t * 2.6, py + Math.sin(t) * t * 2.6); x.stroke(); } }
    else if (kind === 'patch') { const cs = [a, b, '#b8483a', '#3a6aa8', '#d8a83a', '#5a8a3a', '#8a5a9a']; for (let yy = 0; yy < 256; yy += 64) for (let xx = 0; xx < 256; xx += 64) { x.fillStyle = cs[(xx / 64 + yy / 32) % cs.length | 0]; x.fillRect(xx, yy, 64, 64); x.strokeStyle = 'rgba(40,20,10,0.7)'; x.setLineDash([6, 5]); x.lineWidth = 3; x.strokeRect(xx + 5, yy + 5, 54, 54); x.setLineDash([]); if ((xx + yy) % 128 === 0) { x.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < 64; k += 8) x.fillRect(xx, yy + k, 64, 3); } } }
    else if (kind === 'straw') { for (let i = 0; i < 300; i++) { x.strokeStyle = rnd() < 0.5 ? b : 'rgba(255,240,180,0.5)'; x.lineWidth = 1 + rnd() * 2; const px = rnd() * 256, py = rnd() * 256; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 12, py + 14 + rnd() * 16); x.stroke(); } }
    else if (kind === 'stripes') { const n = rep || 4; for (let i = 0; i < n; i++) { x.fillStyle = b; x.fillRect(0, (i + 0.5) * 256 / n, 256, 256 / n / 2); } }
    else if (kind === 'bark') { for (let i = 0; i < 90; i++) { x.strokeStyle = i % 3 ? b : 'rgba(255,220,170,0.18)'; x.lineWidth = 2 + rnd() * 5; const px = rnd() * 256; x.beginPath(); x.moveTo(px, 0); for (let yy = 0; yy <= 256; yy += 16) x.lineTo(px + Math.sin(yy * 0.05 + i) * 5, yy); x.stroke(); } }
    else if (kind === 'burlap') { x.strokeStyle = b; x.lineWidth = 2; for (let i = 0; i < 256; i += 6) { x.globalAlpha = 0.5; x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } x.globalAlpha = 1; }
    else if (kind === 'scales') { x.strokeStyle = b; x.lineWidth = 3; for (let yy = 0, j = 0; yy < 280; yy += 22, j++) for (let xx = (j % 2) * 16; xx < 280; xx += 32) { x.beginPath(); x.arc(xx, yy, 16, 0, PI); x.stroke(); } }
    else if (kind === 'shawl') { for (let i = 0; i < 40; i++) { x.fillStyle = [b, '#e8b84a', '#3a8a8a', '#f2e6d0'][i % 4]; x.beginPath(); x.arc(rnd() * 256, rnd() * 256, 5 + rnd() * 9, 0, PI * 2); x.fill(); } x.strokeStyle = '#e8b84a'; x.lineWidth = 3; for (let yy = 16; yy < 256; yy += 64) { x.beginPath(); for (let xx = 0; xx <= 256; xx += 8) x.lineTo(xx, yy + Math.sin(xx * 0.1) * 6); x.stroke(); } }
    else if (kind === 'dots') { x.fillStyle = b; for (let yy = 0, j = 0; yy < 256; yy += 32, j++) for (let xx = (j % 2) * 16; xx < 256; xx += 32) { x.beginPath(); x.arc(xx + 8, yy + 8, 5, 0, PI * 2); x.fill(); } }
    else if (kind === 'plaid') { x.globalAlpha = 0.35; x.fillStyle = b; for (let i = 0; i < 256; i += 64) { x.fillRect(i, 0, 22, 256); x.fillRect(0, i, 256, 22); } x.globalAlpha = 1; }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; texCache.set(key, t); return t;
  }

  /* ---------------------------------------------------------------- geometry helpers */
  /* level of detail: the rooms build full tessellation, the meadow's small figures a light one (same shapes, fewer triangles) */
  let LOD = 1; const q = (n, min) => Math.max(min || 3, Math.round(n * LOD));
  const geoCache = new Map(); const geo = (key, make) => { key = LOD + '|' + key; let g = geoCache.get(key); if (!g) { g = make(); geoCache.set(key, g); } return g; };
  const SPH = () => geo('sph', () => new T.SphereGeometry(1, q(40, 8), q(28, 6)));
  const add = (p, m) => { p.add(m); m.castShadow = true; m.receiveShadow = true; return m; };
  const S = (p, m, r, x, y, z, sx, sy, sz) => { const o = add(p, new T.Mesh(SPH(), m)); o.position.set(x || 0, y || 0, z || 0); o.scale.set(r * (sx || 1), r * (sy || 1), r * (sz || 1)); return o; };
  const C = (p, m, rt, rb, h, x, y, z, seg, open) => { const o = add(p, new T.Mesh(geo('cyl' + rt + '_' + rb + '_' + h + '_' + (seg || 36) + (open ? 'o' : ''), () => new T.CylinderGeometry(rt, rb, h, q(seg || 36, 6), 1, !!open)), m)); o.position.set(x || 0, y || 0, z || 0); return o; };
  const K = (p, m, r, h, x, y, z, seg) => { const o = add(p, new T.Mesh(geo('cone' + r + '_' + h + '_' + (seg || 32), () => new T.ConeGeometry(r, h, q(seg || 32, 5))), m)); o.position.set(x || 0, y || 0, z || 0); return o; };
  const CAP = (p, m, r, len, x, y, z) => { const o = add(p, new T.Mesh(geo('capsule' + r + '_' + len, () => new T.CapsuleGeometry(r, len, q(10, 2), q(24, 6))), m)); o.position.set(x || 0, y || 0, z || 0); return o; };
  const TOR = (p, m, r, tube, arc, x, y, z) => { const o = add(p, new T.Mesh(geo('tor' + r + '_' + tube + '_' + arc, () => new T.TorusGeometry(r, tube, q(14, 4), q(56, 10), arc || PI * 2)), m)); o.position.set(x || 0, y || 0, z || 0); return o; };
  const RING = (p, m, r, tube, y, z) => { const o = TOR(p, m, r, tube, PI * 2, 0, y, z || 0); o.rotation.x = PI / 2; return o; };
  const BOX = (p, m, w, h, d, x, y, z) => { const o = add(p, new T.Mesh(geo('box' + w + '_' + h + '_' + d, () => new T.BoxGeometry(w, h, d, 2, 2, 2)), m)); o.position.set(x || 0, y || 0, z || 0); return o; };
  const group = (p, x, y, z) => { const g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); p.add(g); return g; };
  /* a turned shape from a profile [[radius, y], …], smoothed by a spline; `folds` = drapery (n folds, amplitude, strongest at the hem) */
  const LATHE = (p, m, pts, seg, x, y, z, folds) => {
    const key = 'lathe' + JSON.stringify(pts) + seg + JSON.stringify(folds || 0);
    const g = geo(key, () => { const curve = new T.SplineCurve(pts.map(q => new T.Vector2(q[0], q[1]))); const lg = new T.LatheGeometry(curve.getPoints(q(56, 10)).map(v => new T.Vector2(Math.max(0.001, v.x), v.y)), q(seg || 56, 8));
      if (folds) { const pos = lg.attributes.position, y0 = pts[0][1], y1 = folds.top != null ? folds.top : pts[pts.length - 1][1]; for (let i = 0; i < pos.count; i++) { const px = pos.getX(i), pz = pos.getZ(i), py = pos.getY(i), r = Math.hypot(px, pz); if (r < 0.01) continue; const th = Math.atan2(pz, px), w = Math.max(0, Math.min(1, (y1 - py) / (y1 - y0))); const d = folds.amp * w * (Math.sin(folds.n * th) * 0.7 + Math.sin(folds.n * 2.3 * th + 1.7) * 0.3); pos.setX(i, px * (1 + d / r)); pos.setZ(i, pz * (1 + d / r)); } lg.computeVertexNormals(); }
      return lg; });
    const o = add(p, new T.Mesh(g, m)); o.position.set(x || 0, y || 0, z || 0); return o; };
  /* a partial turned shell in front of a body: aprons, bibs */
  const APRON = (p, m, pts, arc, x, y, z) => { const key = 'apron' + JSON.stringify(pts) + arc; const g = geo(key, () => { const curve = new T.SplineCurve(pts.map(q => new T.Vector2(q[0], q[1]))); return new T.LatheGeometry(curve.getPoints(q(40, 8)).map(v => new T.Vector2(Math.max(0.001, v.x), v.y)), q(40, 8), -arc / 2, arc); }); const o = add(p, new T.Mesh(g, m)); o.position.set(x || 0, y || 0, z || 0); return o; };
  const capGeo = (th, r) => geo('cap' + th + '_' + r, () => new T.SphereGeometry(r, q(36, 8), q(16, 4), 0, PI * 2, 0, th));

  /* ---------------------------------------------------------------- the face */
  const SCLERA = () => mat('sclera', () => new T.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04 }));
  function eye(p, o, s) {
    const g = group(p); const px = s * o.x, py = o.y, pz = Math.sqrt(Math.max(0.02, o.R * o.R - px * px - py * py)) * 0.96 - o.r * 0.34; g.position.set(px, py, pz); g.rotation.y = s * (o.yaw == null ? 0.16 : o.yaw);
    const ball = group(g); ball.scale.set(o.r * 0.9, o.r * 1.1, o.r * 0.6);
    add(ball, new T.Mesh(SPH(), SCLERA()));
    const ring = add(ball, new T.Mesh(capGeo(0.68, 1.006), MATTE(0x120e0c, 0.4))); ring.rotation.x = PI / 2;
    const iris = add(ball, new T.Mesh(capGeo(0.62, 1.012), GLOSS(o.iris, 0.16))); iris.rotation.x = PI / 2;
    const inner = add(ball, new T.Mesh(capGeo(0.42, 1.016), GLOSS(new T.Color(o.iris).lerp(new T.Color(0xffffff), 0.28).getHex(), 0.16))); inner.rotation.x = PI / 2 + 0.12;
    const pupil = add(ball, new T.Mesh(capGeo(0.28, 1.022), GLOSS(0x060504, 0.1))); pupil.rotation.x = PI / 2;
    const hl = GLOW(0xffffff, 1.1);
    S(g, hl, o.r * 0.16, -o.r * 0.26, o.r * 0.34, o.r * 0.6); S(g, hl, o.r * 0.07, o.r * 0.2, -o.r * 0.22, o.r * 0.62);
    if (o.lid) { const lid = add(ball, new T.Mesh(capGeo(PI * o.lid, 1.07), SKIN(o.skin))); lid.rotation.x = 0.2; const edge = add(ball, new T.Mesh(geo('lidEdge' + o.lid, () => new T.TorusGeometry(Math.sin(PI * o.lid) * 1.07, 0.05, 8, 36)), MATTE(0x5a3a2a, 0.8))); edge.rotation.x = PI / 2 + 0.2; edge.position.y = Math.cos(PI * o.lid) * 1.07 * Math.cos(0.2); edge.position.z = Math.cos(PI * o.lid) * 1.07 * Math.sin(0.2); }
    else if (o.lash) { const l = add(ball, new T.Mesh(geo('lash', () => new T.TorusGeometry(1.02, 0.07, 8, 32, PI * 0.8)), MATTE(0x1a1010, 0.6))); l.rotation.z = PI * 0.1; l.position.z = 0.1; l.scale.set(1, 1, 0.9); }
    return g;
  }
  /* points on the head's surface (the skull is a sphere squashed to 1 × .97 × .96) and tubes that follow it */
  const surf = (R, x, y, lift) => { const u = 1 - (x / R) * (x / R) - (y / (0.97 * R)) * (y / (0.97 * R)); return new T.Vector3(x, y, 0.96 * R * Math.sqrt(Math.max(0, u)) + (lift || 0)); };
  function tubeOn(h, R, pts, r, m, lift) { const L = lift == null ? r * 0.5 : lift; const curve = new T.CatmullRomCurve3(pts.map(q => surf(R, q[0], q[1], L))); const mesh = add(h, new T.Mesh(new T.TubeGeometry(curve, q(28, 6), r, q(10, 4), false), m)); for (const q of [pts[0], pts[pts.length - 1]]) { const e = S(h, m, r, 0, 0, 0); e.position.copy(surf(R, q[0], q[1], L)); } return mesh; }
  const arcPts = (cx, cy, w, d, n) => { const out = []; for (let i = 0; i <= n; i++) { const t = -1 + 2 * i / n; out.push([cx + t * w, cy - (1 - t * t) * d]); } return out; };
  function head(p, o) {
    o = Object.assign({ R: 0.64, y: 2.12, skin: 0xf2c6a2, iris: 0x5a3a22, eyeX: 0.235, eyeY: 0.02, eyeR: 0.15, brow: 0x3a2a1a, browW: 0.026, nose: 1, blush: true, ears: 'round', mouth: 'smile', lid: 0, lash: false, yaw: 0.16 }, o || {});
    const h = group(p, 0, o.y, 0); h.userData.base = o.y; const R = o.R;
    const skull = S(h, SKIN(o.skin), R, 0, 0, 0, 1, 0.97, 0.96);
    const eo = { x: o.eyeX, y: o.eyeY, r: o.eyeR, R, iris: o.iris, lid: o.lid, lash: o.lash, skin: o.skin, yaw: o.yaw };
    const eyes = [eye(h, eo, -1), eye(h, eo, 1)];
    if (o.brow != null) for (const s of [-1, 1]) { const by = o.eyeY + o.eyeR * 1.5, bw = o.eyeR * 0.85; tubeOn(h, R, [[s * (o.eyeX - bw), by], [s * (o.eyeX - bw * 0.3), by + 0.03], [s * (o.eyeX + bw * 0.4), by + 0.026], [s * (o.eyeX + bw), by - 0.02]], o.browW, HAIR(o.brow)); }
    if (o.nose) { const n = S(h, SKIN(new T.Color(o.skin).lerp(new T.Color(0xe08a7a), 0.18).getHex()), R * 0.11 * o.nose, 0, 0, 0, 1.08, 0.92, 0.9); n.position.copy(surf(R, 0, -R * 0.1, -R * 0.02)); }
    const my = -R * 0.33; let smile = null;
    if (o.mouth === 'smile' || o.mouth === 'grin') smile = tubeOn(h, R, arcPts(0, my, R * (o.mouth === 'grin' ? 0.19 : 0.14), R * (o.mouth === 'grin' ? 0.085 : 0.06), 8), R * 0.026, MATTE(0x7a2e28, 0.55));
    const open = S(h, MATTE(0x4a1612, 0.7), R * 0.13, 0, 0, 0, 1.1, 0.12, 0.45); open.position.copy(surf(R, 0, my - R * 0.05, -R * 0.03)); open.userData.r = R * 0.13;
    if (o.blush) for (const s of [-1, 1]) { const v = surf(R, s * R * 0.55, -R * 0.2, 0.004); const b = new T.Mesh(geo('blush' + R, () => new T.CircleGeometry(R * 0.15, 24)), mat('blush', () => new T.MeshBasicMaterial({ color: 0xff6a6a, transparent: true, opacity: 0.22, depthWrite: false }))); b.position.copy(v); b.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(v.x / R, v.y / R, v.z / R).normalize()); h.add(b); }
    if (o.ears === 'round') for (const s of [-1, 1]) S(h, SKIN(o.skin), R * 0.2, s * R * 0.95, -R * 0.06, -0.02, 0.5, 1, 0.8);
    if (o.ears === 'pointy') for (const s of [-1, 1]) { const e = K(h, SKIN(o.skin), R * 0.14, R * 0.55, s * R * 1.02, R * 0.05, -0.04, 16); e.rotation.z = -s * 1.05; e.scale.z = 0.5; }
    return { h, eyes, open, smile, skull, R };
  }
  /* hair: a cap over the crown, a fall behind, a fringe, side locks */
  /* sculpted hair: a sphere cap whose surface is combed into ridges running from the crown (like a painted figurine) */
  const combed = (cover, n, amp) => geo('comb' + cover + '_' + n + '_' + amp, () => { const g = new T.SphereGeometry(1, q(72, 16), q(30, 8), 0, PI * 2, 0, PI * cover); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const th = Math.atan2(z, x), lat = Math.acos(Math.max(-1, Math.min(1, y))); const k = 1 + amp * Math.sin(n * th + lat * 3) * Math.min(1, lat * 2.2); pos.setXYZ(i, x * k, y * k, z * k); } g.computeVertexNormals(); return g; });
  function hairCap(h, c, R, cover, tilt) { const m = add(h, new T.Mesh(combed(cover, 28, 0.018), HAIR(c))); m.scale.set(R * 1.05, R * 1.04, R * 1.04); m.rotation.x = -(tilt == null ? 0.42 : tilt); return m; }
  function hairBack(h, c, R, len, wide) { const m = add(h, new T.Mesh(combed(1, 30, 0.022), HAIR(c))); m.position.set(0, -len * 0.42, -R * 0.42); m.scale.set(R * (wide || 0.95), len * 0.62 * (wide || 0.95), R * (wide || 0.95) * 0.62); return m; }
  function fringe(h, c, R, n, y) { for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * 2 - 1; const v = surf(R, t * R * 0.55, (y == null ? 0.42 : y) * R - Math.abs(t) * R * 0.12, R * 0.02); const l = S(h, HAIR(c), R * 0.2, v.x, v.y, v.z - R * 0.06, 1.1, 0.7, 0.7); l.rotation.z = t * 0.5; } }
  function locks(h, c, R, len, n) { for (const s of [-1, 1]) for (let i = 0; i < (n || 1); i++) { const l = CAP(h, HAIR(c), R * 0.13, len, s * R * (0.88 - i * 0.05), -len * 0.45, R * (0.1 - i * 0.25)); l.rotation.z = s * 0.12; } }
  /* a fluffy beard: overlapping lobes, a moustache of two curled lobes */
  function beard(h, c, R, len, wide, push) { const m = HAIR(c), w = wide || 1, pu = push == null ? 0.42 : push; const g = group(h, 0, 0, 0);
    for (const s of [-1, 1]) S(g, m, R * 0.3 * w, s * R * 0.52, -R * 0.36, R * 0.5, 0.8, 1.1, 0.8);
    S(g, m, R * 0.44 * w, 0, -R * 0.62, R * 0.54, 1.12, 0.92, 0.78);
    const n = Math.max(2, Math.round(len / (R * 0.32))); for (let i = 0; i < n; i++) { const k = (i + 1) / (n + 1); const lb = S(g, m, R * (0.42 - k * 0.26) * w, Math.sin(i * 2.1) * R * 0.035, -R * 0.62 - len * k, R * 0.52 + k * pu, 1.08, 1.2, 0.72); lb.rotation.x = -0.25 * k; }
    for (const s of [-1, 1]) { const mu = S(g, m, R * 0.15, s * R * 0.2, -R * 0.23, R * 0.86, 1.6, 0.75, 0.8); mu.rotation.z = s * 0.45; }
    return g; }

  /* ---------------------------------------------------------------- bodies */
  const ROBE = [[0.001, 0.0], [0.8, 0.02], [0.78, 0.35], [0.64, 0.85], [0.52, 1.2], [0.48, 1.38], [0.32, 1.52], [0.001, 1.58]];
  const TUNIC = [[0.001, 0.56], [0.58, 0.58], [0.57, 0.86], [0.5, 1.2], [0.47, 1.38], [0.32, 1.52], [0.001, 1.58]];
  const DRESS = [[0.001, 0.0], [0.74, 0.03], [0.68, 0.4], [0.47, 0.95], [0.41, 1.2], [0.43, 1.36], [0.3, 1.5], [0.001, 1.56]];
  function legs(p, pants, boots, o) { o = o || {}; const lx = o.lx || 0.21; for (const s of [-1, 1]) { C(p, pants, 0.16, 0.15, 0.52, s * lx, 0.38, 0, 28); S(p, boots, 0.19, s * lx, 0.12, 0.06, 1, 0.68, 1.35); RING(p, boots, 0.16, 0.035, 0.24).position.x = s * lx; } }
  function arm(p, s, sleeve, hand, o) {
    o = Object.assign({ x: 0.52, y: 1.36, len: 0.42, r: 0.135, spread: 0.3, fwd: -0.18, cuff: null, bell: false }, o || {});
    const pv = group(p, s * o.x, o.y, 0); pv.rotation.z = s * o.spread; pv.rotation.x = o.fwd;
    S(pv, sleeve, o.r * 1.18, 0, 0, 0); CAP(pv, sleeve, o.r, o.len, 0, -o.len / 2 - 0.04, 0);
    if (o.bell) { const b = C(pv, sleeve, o.r * 1.05, o.r * 1.9, 0.28, 0, -o.len - 0.02, 0, 32, true); b.material = b.material.clone(); b.material.side = T.DoubleSide; }
    if (o.cuff) RING(pv, o.cuff, o.r * 1.05, 0.035, -o.len - 0.02);
    const hg = group(pv, 0, -o.len - 0.16, 0.02); S(hg, hand, o.r * 1.02, 0, 0, 0, 1, 1.05, 0.9); S(hg, hand, o.r * 0.42, -s * o.r * 0.7, o.r * 0.25, o.r * 0.45);
    pv.userData.hand = hg; return pv;
  }
  /* a standard figure: body (robe | tunic+legs | dress), two arms, a head */
  function figure(root, o) {
    const body = group(root); const kind = o.body || 'robe'; const folds = o.folds === false ? null : (o.folds || { n: 11, amp: kind === 'tunic' ? 0.018 : 0.032 });
    const prof = o.profile || (kind === 'robe' ? ROBE : kind === 'dress' ? DRESS : TUNIC);
    LATHE(body, o.robe, prof, 64, 0, 0, 0, folds);
    if (kind === 'tunic') legs(body, o.pants || CLOTH(0x3a3a4a), o.boots || LEATHER(0x3a2418), o);
    if (o.hem) RING(body, o.hem, prof[1][0] * 0.99, 0.035, prof[1][1] + 0.02);
    if (o.belt) { RING(body, o.belt, o.beltR || 0.5, 0.05, o.beltY || 1.02); if (o.buckle) BOX(body, o.buckle, 0.16, 0.14, 0.05, 0, o.beltY || 1.02, (o.beltR || 0.5) + 0.04); }
    if (o.collar) RING(body, o.collar, 0.3, 0.06, 1.5);
    C(body, SKIN(o.skin), 0.17, 0.19, 0.2, 0, 1.58, 0, 24);
    const hand = SKIN(o.skin);
    const ao = Object.assign({ cuff: o.cuff || null }, o.arm || {});
    const armL = arm(body, -1, o.sleeve || o.robe, o.glove || hand, ao), armR = arm(body, 1, o.sleeve || o.robe, o.glove || hand, ao);
    const hd = head(body, Object.assign({ skin: o.skin }, o.head || {}));
    return { body, armL, armR, head: hd };
  }

  /* ---------------------------------------------------------------- props */
  const OCT = () => geo('oct', () => new T.OctahedronGeometry(0.16, 0));
  function staff(p, gemC) { const g = group(p); const wood = LEATHER(0x5a3a1e); C(g, wood, 0.045, 0.055, 3.0, 0, 0, 0, 14); const knot = TOR(g, wood, 0.13, 0.045, PI * 1.6, 0, 1.56, 0); knot.rotation.y = PI / 2; const gm = add(g, new T.Mesh(OCT(), GLOW(gemC || 0x5aff9a, 3))); gm.position.y = 1.64; gm.scale.set(1, 1.7, 1); g.userData.gem = gm; const li = new T.PointLight(gemC || 0x5aff9a, 2.2, 5, 2); li.position.y = 1.64; g.add(li); return g; }
  function pickaxe(p) { const g = group(p); C(g, LEATHER(0x7a5230), 0.045, 0.05, 1.7, 0, 0, 0, 12); const hd = TOR(g, METAL(0x8a9098, 0.4), 0.42, 0.065, PI * 0.9, 0, 0.7, 0); hd.rotation.z = PI * 0.05; return g; }
  function gem(p, c, s) { const m = add(p, new T.Mesh(OCT(), mat('gem' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.04, metalness: 0.1, clearcoat: 1, emissive: c, emissiveIntensity: 0.55, flatShading: true })))); m.scale.set(s || 1, (s || 1) * 1.3, s || 1); return m; }
  function crystalBall(p, c) { const g = group(p); S(g, mat('orb' + c, () => new T.MeshPhysicalMaterial({ color: 0xdfe8ff, roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.5, emissive: c, emissiveIntensity: 0.55 })), 0.3); const core = S(g, GLOW(c, 2.4), 0.12); g.userData.core = core; C(g, METAL(0xd9a84a, 0.28), 0.18, 0.22, 0.1, 0, -0.3, 0, 28); const li = new T.PointLight(c, 1.8, 4, 2); g.add(li); return g; }
  function honeyPot(p) { const g = group(p); S(g, GLOSS(0xb8742a, 0.35), 0.24, 0, 0, 0, 1, 0.85, 1); C(g, GLOSS(0xb8742a, 0.35), 0.16, 0.2, 0.08, 0, 0.2, 0); S(g, GLOSS(0xffb020, 0.12), 0.19, 0, 0.2, 0, 1, 0.35, 1); S(g, GLOSS(0xffb020, 0.12), 0.05, 0.15, 0.08, 0.12, 1, 2, 1); return g; }
  function book(p, c) { const g = group(p); BOX(g, LEATHER(c || 0x7a2a2a), 0.5, 0.08, 0.36, 0, 0, 0); BOX(g, MATTE(0xf2e8d0), 0.46, 0.065, 0.33, 0.012, 0, 0); return g; }
  function openBook(p, c) { const g = group(p); for (const s of [-1, 1]) { const half = group(g, 0, 0, 0); half.rotation.z = s * 0.22; BOX(half, LEATHER(c || 0x2a4a7a), 0.36, 0.03, 0.46, s * 0.19, 0, 0); BOX(half, MATTE(0xf6eedc, 0.9), 0.33, 0.05, 0.43, s * 0.18, 0.035, 0); } return g; }
  function hammer(p) { const g = group(p); C(g, LEATHER(0x6a4428), 0.05, 0.055, 1.1, 0, 0, 0, 12); BOX(g, METAL(0x5a5e68, 0.38), 0.44, 0.22, 0.22, 0, 0.56, 0); return g; }
  function sword(p, ghost) { const g = group(p); const bm = ghost ? GHOST(0xcfe8ff) : METAL(0xe8ecf2, 0.16); BOX(g, bm, 0.1, 1.5, 0.03, 0, 0.9, 0); K(g, bm, 0.05, 0.14, 0, 1.72, 0, 4).rotation.y = PI / 4; BOX(g, ghost ? GHOST(0xbfd8ff) : METAL(0xd9a84a, 0.28), 0.46, 0.07, 0.08, 0, 0.14, 0); C(g, LEATHER(0x3a2418), 0.04, 0.04, 0.3, 0, -0.03, 0); S(g, METAL(0xd9a84a, 0.28), 0.06, 0, -0.2, 0); return g; }
  function shield(p) { const g = group(p); const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const gr = x.createRadialGradient(110, 100, 10, 128, 128, 140); gr.addColorStop(0, '#c83040'); gr.addColorStop(1, '#801824'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); x.fillStyle = '#f0c868'; x.beginPath(); x.moveTo(128, 40); x.lineTo(150, 102); x.lineTo(216, 102); x.lineTo(162, 140); x.lineTo(182, 204); x.lineTo(128, 166); x.lineTo(74, 204); x.lineTo(94, 140); x.lineTo(40, 102); x.lineTo(106, 102); x.closePath(); x.fill(); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const face = add(g, new T.Mesh(geo('shieldFace', () => new T.CircleGeometry(0.5, 48)), tinted(new T.MeshPhysicalMaterial({ map: tx, roughness: 0.4, clearcoat: 0.7 }), 0xa82838))); face.position.z = 0.045; C(g, METAL(0xd9a84a, 0.28), 0.54, 0.54, 0.08, 0, 0, 0, 48).rotation.x = PI / 2; S(g, METAL(0xd9a84a, 0.28), 0.08, 0, 0, 0.06, 1, 1, 0.5); return g; }
  function lantern(p, c) { const g = group(p); const iron = METAL(0x2e2e34, 0.5); BOX(g, iron, 0.28, 0.04, 0.28, 0, 0.2, 0); BOX(g, iron, 0.28, 0.04, 0.28, 0, -0.2, 0); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) C(g, iron, 0.012, 0.012, 0.4, x * 0.13, 0, z * 0.13, 6); S(g, GLOW(c || 0xffc46a, 2.8), 0.1, 0, 0, 0, 1, 1.4, 1); const li = new T.PointLight(c || 0xffc46a, 1.8, 5, 2); g.add(li); TOR(g, iron, 0.08, 0.015, PI, 0, 0.24, 0); return g; }

  /* ---------------------------------------------------------------- the cast */
  const B = {};
  B.fire = (root, A) => {   // the wizard of the fire on the crag
    const tex = pattern('stars', '#223a86', '#f4d25a'); tex.repeat.set(3, 2); const robe = CLOTH(0x2a4290, tex); const gold = METAL(0xe0b050, 0.3);
    const f = figure(root, { robe, skin: 0xf0c7a6, hem: gold, collar: CLOTH(0x1a2a66), arm: { bell: true, spread: 0.34 }, head: { iris: 0x4a6a9a, brow: 0xf2f2ee, browW: 0.042, lid: 0.36, nose: 1.25 } }); A.set(f);
    RING(f.body, CLOTH(0xe8c060), 0.55, 0.045, 0.98);
    hairBack(f.head.h, 0xeeeeea, 0.64, 1.1, 1.0); locks(f.head.h, 0xeeeeea, 0.64, 0.8, 2);
    beard(f.head.h, 0xf6f6f2, 0.64, 1.05, 1.0);
    const hat = group(f.head.h, 0, 0.34, -0.04); hat.rotation.x = -0.14; C(hat, robe, 1.0, 1.0, 0.06, 0, 0, 0, 64); RING(hat, CLOTH(0x1a2a66), 0.99, 0.05, 0);
    { const g = new T.CylinderGeometry(0.02, 0.66, 1.8, q(48, 10), q(28, 6), true); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), k = (y + 0.9) / 1.8; pos.setX(i, pos.getX(i) + Math.pow(k, 2.2) * 0.6); pos.setY(i, y - Math.pow(k, 3) * 0.14); } g.computeVertexNormals(); const cone = add(hat, new T.Mesh(g, robe)); cone.position.y = 0.9; }
    RING(hat, CLOTH(0xf0c860), 0.64, 0.05, 0.12); const moon = TOR(hat, gold, 0.12, 0.03, PI * 1.3, 0.1, 0.5, 0.52); moon.rotation.z = 1.2;
    const st = staff(f.armR.userData.hand, 0x5aff9a); st.position.set(0, 0.35, 0.06); f.armR.rotation.x = -0.5; st.rotation.x = 0.5; A.extra.push((dt, tm) => { st.userData.gem.rotation.y = tm * 1.4; });
  };
  B.door = (root, A) => {   // the dwarf of the round door
    const f = figure(root, { body: 'tunic', robe: LEATHER(0x6a4028), sleeve: CLOTH(0x4a6a3a), skin: 0xf0b894, pants: CLOTH(0x3a3028), boots: LEATHER(0x2e1c10), belt: LEATHER(0x2a1a0e), buckle: METAL(0xe0b050, 0.3), beltR: 0.64, beltY: 0.95, profile: [[0.001, 0.56], [0.68, 0.58], [0.7, 0.9], [0.62, 1.2], [0.56, 1.36], [0.36, 1.5], [0.001, 1.56]], arm: { x: 0.6, r: 0.16, spread: 0.36 }, head: { iris: 0x5a3a1e, brow: 0xb8481e, browW: 0.048, nose: 1.5 } }); A.set(f); root.scale.set(1.1, 0.95, 1.1);
    beard(f.head.h, 0xc8541e, 0.64, 0.8, 1.15); for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) S(f.head.h, HAIR(0xc8541e), 0.075 - i * 0.008, s * 0.2, -1.02 - i * 0.12, 0.44); RING(f.head.h, METAL(0xe0b050, 0.3), 0.06, 0.02, -1.5, 0.44).position.x = s * 0.2; }
    const helm = group(f.head.h, 0, 0.12, 0); const iron = METAL(0x80868f, 0.46); const hm = add(helm, new T.Mesh(capGeo(PI * 0.5, 0.71), iron)); hm.rotation.x = -0.1; const brim = RING(helm, METAL(0xb88a3a, 0.32), 0.71, 0.055, 0); brim.rotation.x = PI / 2 - 0.1;
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; S(helm, METAL(0xb88a3a, 0.3), 0.03, Math.cos(a) * 0.7, 0.02 + Math.sin(a) * 0.07, Math.sin(a) * 0.7); }
    const lamp = C(helm, METAL(0xb88a3a, 0.3), 0.12, 0.14, 0.18, 0, 0.3, 0.62, 28); lamp.rotation.x = PI / 2 - 0.3; S(helm, GLOW(0xfff0b0, 3), 0.1, 0, 0.32, 0.72, 1, 1, 0.4); const li = new T.SpotLight(0xfff0c0, 5, 10, 0.5, 0.6); li.position.set(0, 0.3, 0.7); li.target.position.set(0, -1.5, 5); helm.add(li); helm.add(li.target);
    const pk = pickaxe(f.armR.userData.hand); pk.position.set(0, 0.18, 0.02); pk.rotation.set(0.12, 0, -0.18); f.armR.rotation.x = -0.25;
    const gl = group(f.armL.userData.hand, 0, 0.1, 0.12); gem(gl, 0xff3a5a, 0.95).position.set(-0.07, 0, 0); gem(gl, 0x3aa0ff, 0.85).position.set(0.08, 0.05, 0); gem(gl, 0x5aff7a, 0.75).position.set(0, 0.14, 0.05); f.armL.rotation.x = -1.0;
  };
  B.tree = (root, A) => {   // the tree folk
    const bark = pattern('bark', '#7a5232', '#5a3a1e'); bark.repeat.set(2, 1); const wood = mat('treeBark', () => tinted(new T.MeshPhysicalMaterial({ map: bark, roughness: 0.92, sheen: 0.3, normalMap: normalTex('bark', 2), normalScale: new T.Vector2(1.4, 1.4) }), 0x6a4628));
    const body = group(root); LATHE(body, wood, [[0.001, 0], [1.0, 0.02], [0.8, 0.3], [0.62, 0.9], [0.6, 1.8], [0.62, 2.4], [0.5, 2.9], [0.001, 3.0]], 56, 0, 0, 0, { n: 9, amp: 0.05 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3; const r = K(body, wood, 0.24, 0.9, Math.cos(a) * 0.8, 0.16, Math.sin(a) * 0.8, 14); r.rotation.z = Math.cos(a) * 1.2; r.rotation.x = -Math.sin(a) * 1.2; }
    const hd = { h: group(body, 0, 2.0, 0), eyes: [], open: null, R: 0.62 }; hd.h.userData.base = 2.0;
    for (const s of [-1, 1]) { S(hd.h, MATTE(0x3a2412, 0.9), 0.17, s * 0.22, 0.05, 0.5, 1, 1.1, 0.5); hd.eyes.push(eye(hd.h, { x: 0.22, y: 0.05, r: 0.13, R: 0.64, iris: 0xd8a032, yaw: 0.1 }, s)); }
    for (const s of [-1, 1]) { const b = CAP(hd.h, MATTE(0x4a2e18), 0.04, 0.16, s * 0.22, 0.29, 0.6); b.rotation.z = PI / 2 - s * 0.18; }
    const sm = TOR(hd.h, MATTE(0x3a2412, 0.8), 0.13, 0.025, PI * 0.8, 0, -0.18, 0.6); sm.rotation.z = PI + PI * 0.1; hd.open = S(hd.h, MATTE(0x2a1408), 0.08, 0, -0.24, 0.58, 1.1, 0.12, 0.4); hd.open.userData.r = 0.08;
    const leaves = [0x4f9a3a, 0x6fbf4a, 0x3f8a36, 0x8fcf5a]; const crown = group(body, 0, 3.0, 0); for (let i = 0; i < 18; i++) { const a = R(0, PI * 2), r = R(0.2, 0.95); S(crown, FUR(leaves[i % 4]), R(0.35, 0.6), Math.cos(a) * r, R(-0.1, 0.7), Math.sin(a) * r * 0.8, 1, 0.8, 1); }
    for (const s of [-1, 1]) { const b = group(crown, s * 0.6, 0.78, 0.3); S(b, GLOSS(0x3a8ad8, 0.4), 0.13, 0, 0, 0, 1.2, 1, 1); S(b, GLOSS(0x3a8ad8, 0.4), 0.09, s * 0.12, 0.08, 0); K(b, GLOSS(0xf2b030, 0.4), 0.03, 0.08, s * 0.2, 0.08, 0, 8).rotation.z = -s * PI / 2; S(b, GLOSS(0x0a0a0a, 0.1), 0.02, s * 0.15, 0.11, 0.06); A.extra.push((dt, tm) => { b.rotation.z = Math.sin(tm * 3 + s) * 0.15; }); }
    const armL = group(body, -0.55, 1.6, 0), armR = group(body, 0.55, 1.6, 0); for (const [a, s] of [[armL, -1], [armR, 1]]) { a.rotation.z = s * 0.6; CAP(a, wood, 0.12, 0.8, 0, -0.5, 0); for (let i = 0; i < 3; i++) S(a, FUR(leaves[i]), 0.22, R(-0.15, 0.15), -1.0 + R(-0.1, 0.1), R(-0.1, 0.1)); a.userData.hand = group(a, 0, -1.0, 0); }
    A.set({ body, armL, armR, head: hd });
  };
  B.fairy = (root, A) => {   // the fairy of the mushroom ring
    const f = figure(root, { body: 'dress', robe: CLOTH(0xf2a8d8), skin: 0xf6d2b8, folds: false, profile: [[0.001, 0.52], [0.3, 0.56], [0.32, 0.9], [0.3, 1.2], [0.34, 1.34], [0.26, 1.46], [0.001, 1.52]], arm: { r: 0.105, x: 0.38, spread: 0.4 }, head: { iris: 0x3a8a6a, brow: 0x9a6a3a, R: 0.62, lash: true } }); A.set(f); A.float = 0.35;
    const cols = [0xf6a8d0, 0xc8a8f0, 0xa8e0c8, 0xf8c8a0]; for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 + r * 0.31; const pt = S(f.body, CLOTH(cols[(i + r) % 4]), 0.36, Math.cos(a) * 0.36, 0.66 - r * 0.14, Math.sin(a) * 0.36, 0.5, 0.18, 1); pt.rotation.y = -a; pt.rotation.x = 0.55; }
    for (const s of [-1, 1]) { C(f.body, SKIN(0xf6d2b8), 0.07, 0.06, 0.55, s * 0.12, 0.28, 0, 16); S(f.body, GLOSS(0xa8e0c8, 0.3), 0.08, s * 0.12, 0.03, 0.04, 1, 0.7, 1.5); }
    hairCap(f.head.h, 0xe0a850, 0.62, 0.56, 0.3); hairBack(f.head.h, 0xe0a850, 0.62, 1.2, 1.0); fringe(f.head.h, 0xe0a850, 0.62, 5, 0.45);
    for (let i = 0; i < 9; i++) { const a = PI + (i / 8) * PI; const fl = group(f.head.h, Math.cos(a) * 0.6, 0.4, -Math.sin(a) * 0.3 - 0.06); for (let k = 0; k < 5; k++) S(fl, CLOTH([0xff8ab8, 0xffe070, 0xffffff, 0xb88af0][i % 4]), 0.045, Math.cos(k * 1.26) * 0.05, 0, Math.sin(k * 1.26) * 0.05, 1, 0.5, 1); S(fl, GLOSS(0xffd040, 0.3), 0.03, 0, 0.02, 0); }
    const wg = new T.Shape(); wg.moveTo(0, 0); wg.bezierCurveTo(0.4, 0.9, 1.3, 1.1, 1.1, 0.3); wg.bezierCurveTo(1.0, 0.0, 0.4, -0.1, 0, 0); const wgl = new T.ShapeGeometry(wg, 24); const wings = [];
    for (const s of [-1, 1]) for (const lo of [0, 1]) { const w = new T.Mesh(wgl, WING(lo ? 0xffc8f0 : 0xc8e8ff)); w.position.set(s * 0.12, 1.28 - lo * 0.12, -0.3); w.scale.set(s * (lo ? 0.75 : 1.05), lo ? -0.75 : 1.05, 1); w.rotation.y = -s * 0.5; f.body.add(w); wings.push({ w, s }); }
    const wand = group(f.armR.userData.hand, 0, 0.05, 0.05); C(wand, GLOSS(0xf8f0ff, 0.3), 0.015, 0.015, 0.5, 0, 0.25, 0, 8); const star = add(wand, new T.Mesh(OCT(), GLOW(0xfff0a0, 3))); star.position.y = 0.52; star.scale.setScalar(0.6); f.armR.rotation.x = -0.8;
    A.extra.push((dt, tm) => { for (const { w, s } of wings) w.rotation.y = -s * (0.4 + Math.sin(tm * 18) * 0.35); star.rotation.y = tm * 3; });
  };
  B.mill = (root, A) => {   // the miller
    const f = figure(root, { body: 'dress', robe: CLOTH(0xe08a8a), skin: 0xf2c4a4, arm: { spread: 0.35 }, head: { iris: 0x5a7a3a, brow: 0x7a5a3a, lash: true, mouth: 'grin' } }); A.set(f);
    APRON(f.body, CLOTH(0xfaf6ee), [[0.76, 0.05], [0.7, 0.4], [0.5, 0.92], [0.44, 1.12]], PI * 0.72, 0, 0, 0); RING(f.body, CLOTH(0xfaf6ee), 0.44, 0.03, 1.1);
    hairCap(f.head.h, 0x7a4a2a, 0.64, 0.5, 0.36); fringe(f.head.h, 0x7a4a2a, 0.64, 5, 0.38); hairBack(f.head.h, 0x7a4a2a, 0.64, 0.6, 0.85);
    const scarf = CLOTH(0xf4ecdc, pattern('dots', '#f4ecdc', '#d8505a')); const sc = add(f.head.h, new T.Mesh(capGeo(PI * 0.44, 0.7), scarf)); sc.rotation.x = -0.62; for (const s of [-1, 1]) { const k = S(f.head.h, scarf, 0.12, s * 0.08, 0.05, -0.68, 1.3, 0.8, 0.8); const t2 = CAP(f.head.h, scarf, 0.06, 0.2, s * 0.14, -0.12, -0.66); t2.rotation.z = s * 0.5; }
    const sack = group(f.armL.userData.hand, 0.12, -0.1, 0.3); LATHE(sack, CLOTH(0xd8c8a0, pattern('burlap', '#d8c8a0', '#a89a78')), [[0.001, -0.35], [0.3, -0.32], [0.38, -0.1], [0.34, 0.15], [0.14, 0.3], [0.1, 0.36], [0.16, 0.44], [0.001, 0.46]], 36, 0, 0, 0, { n: 5, amp: 0.02 }); RING(sack, LEATHER(0x6a4a2a), 0.11, 0.03, 0.33); S(sack, MATTE(0xffffff, 1), 0.12, 0, 0.44, 0, 1, 0.4, 1); f.armL.rotation.x = -1.0;
  };
  B.stones = (root, A) => {   // the astronomer of the standing stones
    const tx = pattern('stars', '#1a2450', '#e8e8ff'); tx.repeat.set(3, 2); const robe = CLOTH(0x1e2a5a, tx);
    const f = figure(root, { robe, skin: 0xf0ccb0, hem: METAL(0xc8ccd8, 0.3), collar: CLOTH(0x2a3a7a), arm: { bell: true, spread: 0.32 }, head: { iris: 0x4a5a8a, brow: 0xdcdcdc, lid: 0.34 } }); A.set(f);
    hairCap(f.head.h, 0xd8d8dc, 0.64, 0.52, 0.3); S(f.head.h, HAIR(0xd8d8dc), 0.26, 0, 0.36, -0.44); RING(f.head.h, METAL(0xd9a84a, 0.3), 0.12, 0.02, 0.38, -0.44).rotation.x = 0.3;
    for (const s of [-1, 1]) TOR(f.head.h, METAL(0xd9a84a, 0.26), 0.11, 0.013, PI * 2, s * 0.235, 0.02, 0.62); BOX(f.head.h, METAL(0xd9a84a, 0.26), 0.14, 0.02, 0.02, 0, 0.04, 0.64);
    const tel = group(f.armR.userData.hand, 0, 0.02, 0.06); tel.rotation.x = 0.9; tel.rotation.z = -0.35; const brass = METAL(0xd8a84e, 0.22); C(tel, brass, 0.075, 0.095, 0.7, 0, 0.1, 0, 28); C(tel, METAL(0x7a4a22, 0.35), 0.11, 0.11, 0.55, 0, 0.62, 0, 28); C(tel, brass, 0.14, 0.12, 0.3, 0, 1.02, 0, 28); RING(tel, brass, 0.12, 0.025, 0.88); S(tel, GLOSS(0x9ad8ff, 0.03), 0.12, 0, 1.17, 0, 1, 0.2, 1); f.armR.rotation.x = -1.35; f.armR.rotation.z = 0.25;
  };
  B.hive = (root, A) => {   // the queen bee
    const stripes = pattern('stripes', '#f4c02a', '#2a2018', 5); const body = group(root); A.float = 0.3;
    S(body, mat('beeBody', () => tinted(new T.MeshPhysicalMaterial({ map: stripes, roughness: 0.62, sheen: 1, sheenRoughness: 0.5, sheenColor: new T.Color(0xfff0a0), normalMap: normalTex('fur', 3), normalScale: new T.Vector2(0.7, 0.7) }), 0xd8a82a)), 0.78, 0, 1.0, 0, 1, 1.12, 0.95); K(body, MATTE(0x2a2018), 0.16, 0.34, 0, 0.1, -0.1, 16).rotation.x = PI;
    RING(body, FUR(0xfff4d8), 0.42, 0.14, 1.78);
    const hd = head(body, { y: 2.14, R: 0.58, skin: 0xf6c83a, iris: 0x3a2a1a, eyeR: 0.17, eyeX: 0.23, brow: null, nose: 0, ears: 'none', lash: true });
    for (const s of [-1, 1]) { const an = group(hd.h, s * 0.2, 0.5, 0.1); an.rotation.z = -s * 0.35; C(an, MATTE(0x2a2018), 0.02, 0.02, 0.5, 0, 0.25, 0, 8); S(an, GLOSS(0x2a2018), 0.07, 0, 0.52, 0); }
    const cr = group(hd.h, 0, 0.5, 0); const gold = METAL(0xf2c14e, 0.22); const band = C(cr, gold, 0.3, 0.3, 0.16, 0, 0, 0, 44, true); band.material = band.material.clone(); band.material.side = T.DoubleSide; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; K(cr, gold, 0.06, 0.2, Math.cos(a) * 0.3, 0.16, Math.sin(a) * 0.3, 14); S(cr, gold, 0.035, Math.cos(a) * 0.3, 0.27, Math.sin(a) * 0.3); } S(cr, GLOSS(0xd8203a, 0.08), 0.06, 0, 0.02, 0.3);
    const wg = new T.Shape(); wg.moveTo(0, 0); wg.bezierCurveTo(0.2, 0.9, 1.1, 1.0, 1.0, 0.3); wg.bezierCurveTo(0.9, 0, 0.3, -0.1, 0, 0); const wgl = new T.ShapeGeometry(wg, 20); const wings = [];
    for (const s of [-1, 1]) for (const lo of [0, 1]) { const w = new T.Mesh(wgl, WING(0xe8f4ff)); w.position.set(s * 0.25, 1.6 - lo * 0.15, -0.5); w.scale.set(s * (lo ? 0.7 : 1), lo ? -0.7 : 1, 1); body.add(w); wings.push({ w, s }); }
    A.extra.push((dt, tm) => { for (const { w, s } of wings) w.rotation.y = -s * (0.3 + Math.sin(tm * 30) * 0.5); });
    const armL = arm(body, -1, MATTE(0x2a2018), MATTE(0x2a2018), { x: 0.62, y: 1.3, r: 0.07, len: 0.36, spread: 0.3 }), armR = arm(body, 1, MATTE(0x2a2018), MATTE(0x2a2018), { x: 0.62, y: 1.3, r: 0.07, len: 0.36, spread: 0.3 });
    const pt = honeyPot(body); pt.position.set(0, 1.0, 0.86); armL.rotation.x = armR.rotation.x = -1.15;
    A.set({ body, armL, armR, head: hd });
  };
  B.fisher = (root, A) => {   // the fisher child in oilskins
    const coat = GLOSS(0xf4c21e, 0.3); const f = figure(root, { body: 'tunic', robe: coat, skin: 0xf6ccaa, pants: CLOTH(0x3a5a8a), boots: GLOSS(0xf4c21e, 0.28), folds: { n: 8, amp: 0.02 }, profile: [[0.001, 0.46], [0.6, 0.48], [0.57, 0.86], [0.5, 1.2], [0.47, 1.38], [0.32, 1.52], [0.001, 1.58]], head: { iris: 0x3a6aa8, brow: 0x8a5a2a, mouth: 'grin' } }); A.set(f);
    hairCap(f.head.h, 0x9a5a2a, 0.64, 0.5, 0.3); fringe(f.head.h, 0x9a5a2a, 0.64, 5, 0.4);
    const hat = group(f.head.h, 0, 0.3, -0.05); add(hat, new T.Mesh(capGeo(PI * 0.5, 0.7), coat)); const br = C(hat, coat, 0.95, 1.02, 0.05, 0, -0.02, -0.1, 56); br.rotation.x = -0.2;
    for (let i = 0; i < 5; i++) S(f.body, METAL(0xd9a84a, 0.3), 0.04, 0, 0.66 + i * 0.16, 0.51 - i * 0.012);
    const rod = group(f.armR.userData.hand, 0, 0, 0.05); rod.rotation.x = -0.7; C(rod, LEATHER(0x7a5230), 0.022, 0.038, 2.8, 0, 1.3, 0, 8); const reel = C(rod, METAL(0x9aa0a8, 0.3), 0.08, 0.08, 0.06, 0.06, 0.3, 0, 16); reel.rotation.z = PI / 2; f.armR.rotation.x = -0.7;
    const fish = group(f.armL.userData.hand, 0, -0.25, 0.1); S(fish, GLOSS(0x9ab8c8, 0.25), 0.18, 0, 0, 0, 0.5, 1.6, 0.35); K(fish, GLOSS(0x9ab8c8, 0.25), 0.14, 0.2, 0, -0.34, 0, 12).rotation.x = PI;
  };
  B.balloon = (root, A) => {   // the balloonist
    const leather = LEATHER(0x7a4a2a); const f = figure(root, { body: 'tunic', robe: leather, skin: 0xf2c4a0, pants: CLOTH(0x6a5a44), boots: LEATHER(0x3a2418), belt: LEATHER(0x2a1a0e), buckle: METAL(0xd9a84a, 0.3), collar: FUR(0xe8dcc8), cuff: FUR(0xe8dcc8), head: { iris: 0x5a3a1e, brow: 0x5a3a1e, mouth: 'grin' } }); A.set(f);
    hairCap(f.head.h, 0x6a3a1a, 0.64, 0.5, 0.25); fringe(f.head.h, 0x6a3a1a, 0.64, 6, 0.44);
    const gog = group(f.head.h, 0, 0.38, 0.28); gog.rotation.x = -0.55; RING(gog, LEATHER(0x3a2418), 0.66, 0.03, -0.05, -0.28); for (const s of [-1, 1]) { TOR(gog, METAL(0xc89a4a, 0.28), 0.12, 0.035, PI * 2, s * 0.16, 0, 0.2); S(gog, GLOSS(0x9ad8ff, 0.04), 0.1, s * 0.16, 0, 0.2, 1, 1, 0.4); }
    RING(f.body, CLOTH(0xd8303a), 0.3, 0.1, 1.5); const tail = group(f.body, 0.15, 1.45, -0.2); const tl = CAP(tail, CLOTH(0xd8303a), 0.08, 0.7, 0.35, 0, -0.1); tl.rotation.z = PI / 2 + 0.3; A.extra.push((dt, tm) => { tail.rotation.y = Math.sin(tm * 5) * 0.4 - 0.5; tail.rotation.z = Math.sin(tm * 7) * 0.15; });
    const cmp = group(f.armR.userData.hand, 0, 0.12, 0.14); C(cmp, METAL(0xd9a84a, 0.24), 0.14, 0.14, 0.05, 0, 0, 0, 32).rotation.x = PI / 2; const face = C(cmp, MATTE(0xf6f0e0, 0.5), 0.11, 0.11, 0.052, 0, 0, 0.004, 32); face.rotation.x = PI / 2; const nd = BOX(cmp, GLOSS(0xd8303a, 0.3), 0.02, 0.16, 0.01, 0, 0, 0.035); A.extra.push((dt, tm) => { nd.rotation.z = Math.sin(tm * 1.7) * 0.6; }); f.armR.rotation.x = -1.1;
  };
  B.caravan = (root, A) => {   // the fortune teller
    const f = figure(root, { body: 'dress', robe: CLOTH(0x6a2a7a, pattern('shawl', '#5a2270', '#d84a6a')), skin: 0xe0b08a, arm: { spread: 0.3 }, head: { iris: 0x2a1a10, brow: 0x1a0e08, lid: 0.2, lash: true } }); A.set(f);
    hairBack(f.head.h, 0x1a1010, 0.64, 1.1, 1.0); const sc = add(f.head.h, new T.Mesh(capGeo(PI * 0.56, 0.7), CLOTH(0x2a4a8a))); sc.rotation.x = -0.4;
    for (let i = 0; i < 11; i++) { const a = PI * 0.12 + i * (PI * 0.76 / 10); const c = C(f.head.h, METAL(0xf2c14e, 0.22), 0.045, 0.045, 0.012, Math.cos(a) * 0.64, 0.36 - Math.sin(a) * 0.08, Math.sin(a) * 0.26 + 0.1, 20); c.rotation.x = PI / 2 - 0.3; }
    S(f.head.h, GLOSS(0xd8203a, 0.08), 0.06, 0, 0.5, 0.48); for (const s of [-1, 1]) TOR(f.head.h, METAL(0xf2c14e, 0.2), 0.07, 0.012, PI * 2, s * 0.62, -0.24, 0.05);
    const cb = crystalBall(f.body, 0xb07aff); cb.position.set(0, 1.12, 0.8); f.armL.rotation.x = f.armR.rotation.x = -1.2; f.armL.rotation.z = -0.5; f.armR.rotation.z = 0.5; A.extra.push((dt, tm) => { cb.userData.core.scale.setScalar(0.12 * (1 + Math.sin(tm * 2.4) * 0.25)); });
  };
  B.bear = (root, A) => {   // the bear of the cave
    const fur = FUR(0x9a5a2e), light = FUR(0xd8a878); const body = group(root);
    S(body, fur, 0.95, 0, 1.0, 0, 1, 1.08, 0.9); S(body, light, 0.62, 0, 0.95, 0.42, 1, 1.05, 0.55);
    for (const s of [-1, 1]) { S(body, fur, 0.36, s * 0.52, 0.22, 0.28, 1, 0.8, 1.2); S(body, light, 0.16, s * 0.52, 0.2, 0.66, 1, 0.8, 0.4); }
    const hd = head(body, { y: 2.22, R: 0.62, skin: 0x9a5a2e, iris: 0x2a1a10, eyeR: 0.1, eyeX: 0.22, eyeY: 0.1, brow: null, nose: 0, ears: 'none', blush: true, mouth: 'none' }); hd.skull.material = fur;
    S(hd.h, light, 0.3, 0, -0.14, 0.5, 1.1, 0.8, 0.8); S(hd.h, GLOSS(0x1a1010, 0.18), 0.1, 0, -0.04, 0.78, 1.2, 0.8, 0.8); const sm = TOR(hd.h, MATTE(0x3a1a10), 0.08, 0.018, PI * 0.8, 0, -0.18, 0.76); sm.rotation.z = PI + 0.3; hd.open.position.set(0, -0.22, 0.74); hd.open.userData.r = 0.08;
    for (const s of [-1, 1]) { S(hd.h, fur, 0.2, s * 0.44, 0.48, 0, 1, 1, 0.6); S(hd.h, light, 0.11, s * 0.44, 0.48, 0.07, 1, 1, 0.5); }
    const armL = arm(body, -1, fur, fur, { x: 0.78, y: 1.52, r: 0.2, len: 0.5, spread: 0.3 }), armR = arm(body, 1, fur, fur, { x: 0.78, y: 1.52, r: 0.2, len: 0.5, spread: 0.3 });
    const pt = honeyPot(body); pt.position.set(0.1, 1.05, 0.9); pt.scale.setScalar(1.3); armL.rotation.x = armR.rotation.x = -1.0; armL.rotation.z = -0.3; armR.rotation.z = 0.3;
    const scarf = RING(body, CLOTH(0x3a6ab0, pattern('plaid', '#3a6ab0', '#e8d8a0')), 0.5, 0.12, 1.82); scarf.scale.set(1, 1, 0.8);
    A.set({ body, armL, armR, head: hd });
  };
  B.tower = (root, A) => {   // the young knight of the watchtower
    const steel = METAL(0xc8ced8, 0.2), dark = METAL(0x8a909a, 0.3), gold = METAL(0xd9a84a, 0.28);
    const f = figure(root, { body: 'tunic', robe: steel, sleeve: steel, glove: dark, skin: 0xf2c8a6, pants: dark, boots: dark, belt: LEATHER(0x5a2a1a), buckle: gold, folds: false, head: { iris: 0x3a6aa8, brow: 0xd8a040 } }); A.set(f);
    LATHE(f.body, CLOTH(0xb82030), [[0.001, 0.55], [0.54, 0.56], [0.5, 1.0], [0.001, 1.02]], 48, 0, 0, 0.06, { n: 8, amp: 0.02 }).scale.set(0.9, 1, 0.5);
    for (const s of [-1, 1]) { const pad = add(f.body, new T.Mesh(capGeo(PI * 0.5, 0.26), steel)); pad.position.set(s * 0.52, 1.42, 0); pad.rotation.z = -s * 0.5; }
    hairCap(f.head.h, 0xe8b850, 0.64, 0.46, 0.3); fringe(f.head.h, 0xe8b850, 0.64, 5, 0.36);
    const helm = group(f.head.h, 0, 0.1, -0.02); const hm = add(helm, new T.Mesh(capGeo(PI * 0.5, 0.72), steel)); hm.rotation.x = -0.3; const rim = RING(helm, gold, 0.72, 0.04, 0); rim.rotation.x = PI / 2 - 0.3;
    for (let i = 0; i < 7; i++) S(helm, CLOTH(0xd8203a), 0.15 - i * 0.008, 0, 0.8 - i * 0.03, -0.1 - i * 0.16, 1, 1.25, 1.3);
    const sh = shield(f.armL.userData.hand); sh.position.set(-0.08, 0.1, 0.2); sh.rotation.y = -0.2; f.armL.rotation.x = -0.9; f.armL.rotation.z = -0.3;
    const sw = sword(f.armR.userData.hand); sw.rotation.x = 0.25;
  };
  B.frog = (root, A) => {   // the frog king
    const skin = GLOSS(0x5aa83a, 0.32); const body = group(root);
    S(body, skin, 0.95, 0, 0.8, 0, 1.15, 0.85, 0.95); S(body, GLOSS(0xd8e8a0, 0.4), 0.7, 0, 0.72, 0.36, 1, 0.8, 0.6);
    for (let i = 0; i < 8; i++) S(body, GLOSS(0x3a7a2a, 0.3), R(0.06, 0.1), R(-0.7, 0.7), R(0.8, 1.3), R(-0.6, -0.1), 1, 0.4, 1);
    for (const s of [-1, 1]) S(body, skin, 0.36, s * 0.78, 0.2, 0.3, 1.2, 0.5, 1.4);
    const hd = { h: group(body, 0, 1.5, 0.1), eyes: [], R: 0.7 }; hd.h.userData.base = 1.5; S(hd.h, skin, 0.7, 0, 0, 0, 1.25, 0.72, 0.95);
    for (const s of [-1, 1]) { const bulb = group(hd.h, s * 0.42, 0.42, 0.22); S(bulb, skin, 0.3); hd.eyes.push(eye(bulb, { x: 0, y: 0.02, r: 0.2, R: 0.3, iris: 0xd8b030, yaw: 0 }, s)); }
    const sm = TOR(hd.h, MATTE(0x2a4a1a), 0.5, 0.025, PI * 0.9, 0, -0.08, 0.5); sm.rotation.z = PI + 0.15; sm.rotation.x = -0.5; hd.open = S(hd.h, MATTE(0x8a2a2a), 0.25, 0, -0.14, 0.52, 1.6, 0.1, 0.4); hd.open.userData.r = 0.25;
    const cr = group(hd.h, 0, 0.5, -0.12); cr.rotation.x = -0.15; const gold = METAL(0xf2c14e, 0.22); const band = C(cr, gold, 0.3, 0.32, 0.18, 0, 0, 0, 44, true); band.material = band.material.clone(); band.material.side = T.DoubleSide; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; K(cr, gold, 0.07, 0.24, Math.cos(a) * 0.31, 0.18, Math.sin(a) * 0.31, 14); S(cr, GLOSS([0xd8203a, 0x2a6ad8, 0x2ad86a][i % 3], 0.08), 0.045, Math.cos(a) * 0.31, 0.02, Math.sin(a) * 0.31); }
    const cape = group(body, 0, 0, -0.08); const cp = add(cape, new T.Mesh(geo('cape2', () => { const g = new T.CylinderGeometry(0.78, 1.28, 1.5, 56, 6, true, PI * 0.62, PI * 0.76); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i), th = Math.atan2(z, x), k = (0.75 - y) / 1.5; const d = 0.05 * k * Math.sin(th * 9); pos.setX(i, x * (1 + d)); pos.setZ(i, z * (1 + d)); } g.computeVertexNormals(); return g; }), mat('capeRed', () => new T.MeshPhysicalMaterial({ color: 0xb01a2a, roughness: 0.72, sheen: 1, sheenColor: new T.Color(0xff8090), side: T.DoubleSide, normalMap: normalTex('weave', 8), normalScale: new T.Vector2(0.4, 0.4) })))); cp.position.y = 0.95; for (const s2 of [-1, 1]) S(cape, METAL(0xf2c14e, 0.22), 0.08, s2 * 0.62, 1.55, 0.35);
    const armL = arm(body, -1, skin, skin, { x: 0.8, y: 1.0, r: 0.13, len: 0.35 }), armR = arm(body, 1, skin, skin, { x: 0.8, y: 1.0, r: 0.13, len: 0.35 });
    A.set({ body, armL, armR, head: hd });
  };
  B.scarecrow = (root, A) => {   // the scarecrow
    const f = figure(root, { body: 'robe', robe: CLOTH(0xd8a83a, pattern('patch', '#c8783a', '#6a8a3a')), skin: 0xd8b882, profile: [[0.001, 0.2], [0.6, 0.22], [0.64, 0.5], [0.55, 0.9], [0.5, 1.2], [0.48, 1.38], [0.32, 1.52], [0.001, 1.58]], folds: { n: 7, amp: 0.035 }, head: { iris: 0x1a1010, brow: null, nose: 0, blush: true, ears: 'none', mouth: 'none', eyeR: 0.13 } }); A.set(f);
    f.head.skull.material = CLOTH(0xd8b882, pattern('burlap', '#d8b882', '#a88a5a'));
    C(root, LEATHER(0x6a4a28), 0.07, 0.08, 1.2, 0, 0.3, -0.1, 12);
    const stitch = MATTE(0x3a2412, 0.9); tubeOn(f.head.h, 0.64, arcPts(0, -0.2, 0.2, 0.08, 8), 0.018, stitch); for (let i = 0; i <= 6; i++) { const t = -1 + i / 3; const p0 = surf(0.64, t * 0.2, -0.2 - (1 - t * t) * 0.08, 0.01); const st = CAP(f.head.h, stitch, 0.012, 0.06, p0.x, p0.y, p0.z); st.rotation.z = t * 0.3; }
    S(f.head.h, GLOSS(0xe86a1a, 0.3), 0.07, 0, -0.06, 0.64, 1, 1, 1.6);
    for (const a of [f.armL, f.armR]) for (let i = 0; i < 7; i++) { const s = K(a.userData.hand, CLOTH(0xe8c870, null, 'straw'), 0.035, 0.35, R(-0.08, 0.08), -0.16, R(-0.08, 0.08), 6); s.rotation.set(R(-0.4, 0.4), 0, R(-0.4, 0.4) + PI); }
    for (let i = 0; i < 8; i++) { const s = K(f.body, CLOTH(0xe8c870, null, 'straw'), 0.04, 0.3, R(-0.25, 0.25), 1.5, R(-0.1, 0.25), 6); s.rotation.set(R(-0.6, 0.6), 0, R(-0.6, 0.6)); }
    const hat = group(f.head.h, 0, 0.42, 0); const straw = CLOTH(0xe8c870, pattern('straw', '#e2bc62', '#b88a3a'), 'straw'); C(hat, straw, 1.1, 1.14, 0.05, 0, 0, 0, 64).rotation.x = -0.08; C(hat, straw, 0.46, 0.56, 0.4, 0, 0.2, 0, 44); RING(hat, CLOTH(0x8a3a2a), 0.53, 0.05, 0.06);
    f.armL.rotation.z = -1.35; f.armR.rotation.z = 1.35;
    const crow = group(f.body, 0.5, 1.64, -0.05); S(crow, GLOSS(0x1a1a22, 0.32), 0.17, 0, 0, 0, 1.3, 1, 1); S(crow, GLOSS(0x1a1a22, 0.32), 0.12, 0.16, 0.14, 0); K(crow, GLOSS(0xd8a03a, 0.3), 0.04, 0.14, 0.3, 0.14, 0, 8).rotation.z = -PI / 2; S(crow, GLOW(0xffffff, 0.8), 0.02, 0.2, 0.18, 0.08); A.extra.push((dt, tm) => { crow.rotation.y = Math.sin(tm * 0.9) * 0.6; crow.position.y = 1.64 + Math.max(0, Math.sin(tm * 3.3)) * 0.02; });
  };
  B.owl = (root, A) => {   // the owl of the hollow
    const feathers = mat('owlFeathers', () => tinted(new T.MeshPhysicalMaterial({ map: pattern('scales', '#9a6a3a', '#6a4424'), roughness: 0.82, sheen: 1, sheenColor: new T.Color(0xe8c8a0), normalMap: normalTex('fur', 4), normalScale: new T.Vector2(0.6, 0.6) }), 0x8a5e34)); const body = group(root);
    S(body, feathers, 0.95, 0, 1.25, 0, 1, 1.25, 0.9); S(body, FUR(0xe8d2b0), 0.65, 0, 1.15, 0.38, 1, 1.25, 0.55);
    for (const s of [-1, 1]) { const w = S(body, feathers, 0.5, s * 0.88, 1.25, -0.05, 0.35, 1.15, 0.8); w.rotation.z = s * 0.15; K(body, GLOSS(0xd8a03a, 0.4), 0.09, 0.14, s * 0.3, 0.06, 0.35, 8).rotation.x = PI / 2; }
    const hd = head(body, { y: 2.35, R: 0.62, skin: 0x9a6a3a, iris: 0xf0a020, eyeR: 0.2, eyeX: 0.25, eyeY: 0.02, brow: null, nose: 0, ears: 'none', blush: false, mouth: 'none', yaw: 0.05 });
    hd.skull.material = feathers; for (const s of [-1, 1]) { S(hd.h, FUR(0xf2e2c8), 0.27, s * 0.25, 0.02, 0.44, 1, 1, 0.4); K(hd.h, feathers, 0.12, 0.4, s * 0.42, 0.6, 0, 12).rotation.z = -s * 0.4; TOR(hd.h, METAL(0xd9a84a, 0.24), 0.22, 0.02, PI * 2, s * 0.25, 0.02, 0.64); }
    for (const e of hd.eyes) e.position.z += 0.05;
    const bk = K(hd.h, GLOSS(0xd8a03a, 0.35), 0.07, 0.2, 0, -0.2, 0.62, 12); bk.rotation.x = PI + 0.4; hd.open.position.set(0, -0.28, 0.58); hd.open.scale.set(0.05, 0.02, 0.03); hd.open.userData.r = 0.03;
    const armL = arm(body, -1, feathers, feathers, { x: 0.7, y: 1.7, r: 0.12, len: 0.4 }), armR = arm(body, 1, feathers, feathers, { x: 0.7, y: 1.7, r: 0.12, len: 0.4 });
    const bkk = openBook(body, 0x2a4a7a); bkk.position.set(0, 1.28, 0.98); bkk.rotation.x = 0.9; armL.rotation.x = armR.rotation.x = -0.9;
    A.set({ body, armL, armR, head: hd });
  };
  B.gnome = (root, A) => {   // the gnome
    const f = figure(root, { body: 'tunic', robe: CLOTH(0x3a6ab0), skin: 0xf2c0a0, pants: CLOTH(0x5a4a3a), boots: LEATHER(0x4a2e1a), belt: LEATHER(0x3a2418), buckle: METAL(0xd9a84a, 0.3), head: { iris: 0x3a5a8a, brow: 0xf2f2f2, browW: 0.04, lid: 0.3, nose: 1.6 } }); A.set(f); root.scale.set(1, 0.92, 1);
    LATHE(f.body, LEATHER(0x8a5a32), [[0.001, 0.6], [0.52, 0.62], [0.47, 1.0], [0.38, 1.3], [0.001, 1.32]], 44, 0, 0, 0.14).scale.set(0.95, 1, 0.6);
    beard(f.head.h, 0xf6f6f2, 0.64, 0.95, 1.05);
    { const g = new T.CylinderGeometry(0.02, 0.7, 2.0, q(48, 10), q(28, 6), true); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), k = (y + 1.0) / 2.0; pos.setZ(i, pos.getZ(i) - Math.pow(k, 2.4) * 0.8); } g.computeVertexNormals(); const hat = add(f.head.h, new T.Mesh(g, CLOTH(0xd8202a))); hat.position.set(0, 1.12, -0.05); hat.rotation.x = -0.12; const band = C(f.head.h, CLOTH(0xd8202a), 0.7, 0.72, 0.12, 0, 0.16, -0.02, 56); band.rotation.x = -0.12; }
    const bag = group(f.armL.userData.hand, 0, -0.15, 0.1); S(bag, CLOTH(0x4a8a3a), 0.22, 0, 0, 0, 1, 1.1, 1); RING(bag, LEATHER(0x6a4a2a), 0.1, 0.02, 0.18); f.armL.rotation.x = -0.6;
    const lan = lantern(f.armR.userData.hand, 0xffc46a); lan.position.set(0, -0.3, 0.05);
  };
  B.nest = (root, A) => {   // the baby dragon in the nest
    const hide = GLOSS(0x3ab8b0, 0.32), belly = CLOTH(0xf6e8c0); const body = group(root);
    S(body, hide, 0.72, 0, 0.9, 0, 1, 1.1, 0.95); S(body, belly, 0.5, 0, 0.82, 0.34, 1, 1.2, 0.6); for (let i = 0; i < 5; i++) RING(body, CLOTH(0xe8d8b0), 0.38 - Math.abs(i - 2) * 0.05, 0.02, 0.5 + i * 0.16, 0.36).scale.set(1, 0.4, 1);
    for (const s of [-1, 1]) S(body, hide, 0.26, s * 0.42, 0.22, 0.25, 1.1, 0.7, 1.4);
    const tail = group(body, 0, 0.5, -0.6); for (let i = 0; i < 6; i++) S(tail, hide, 0.22 - i * 0.03, Math.sin(i * 0.6) * 0.2, -i * 0.05, -i * 0.22); A.extra.push((dt, tm) => { tail.rotation.y = Math.sin(tm * 2) * 0.35; });
    for (let i = 0; i < 4; i++) K(body, CLOTH(0xf6e8c0), 0.07, 0.18, 0, 1.55 - i * 0.28, -0.62 + i * 0.04, 8).rotation.x = -0.4;
    const hd = head(body, { y: 1.98, R: 0.62, skin: 0x3ab8b0, iris: 0x2a6a3a, eyeR: 0.19, eyeX: 0.25, brow: null, nose: 0, ears: 'none', lash: true }); hd.skull.material = hide;
    S(hd.h, hide, 0.3, 0, -0.16, 0.44, 1.1, 0.75, 0.9); for (const s of [-1, 1]) { S(hd.h, GLOSS(0x1a4a48), 0.03, s * 0.1, -0.1, 0.72); K(hd.h, CLOTH(0xf6e8c0), 0.08, 0.3, s * 0.32, 0.5, -0.1, 12).rotation.z = -s * 0.4; }
    const shell = group(hd.h, 0, 0.06, -0.02); shell.rotation.z = 0.12; add(shell, new T.Mesh(capGeo(PI * 0.38, 0.7), GLOSS(0xfaf6ee, 0.38))); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; K(shell, GLOSS(0xfaf6ee, 0.38), 0.09, 0.2, Math.cos(a) * 0.62, 0.1, Math.sin(a) * 0.62, 6); }
    const wg = new T.Shape(); wg.moveTo(0, 0); wg.lineTo(0.7, 0.5); wg.lineTo(0.55, 0.15); wg.lineTo(0.8, 0.05); wg.lineTo(0.5, -0.1); wg.lineTo(0.6, -0.3); wg.lineTo(0, -0.1); wg.closePath(); const wgl = new T.ShapeGeometry(wg); const wings = [];
    for (const s of [-1, 1]) { const w = new T.Mesh(wgl, mat('dragWing', () => new T.MeshPhysicalMaterial({ color: 0x7ad8c8, roughness: 0.4, side: T.DoubleSide, sheen: 1 }))); w.position.set(s * 0.3, 1.25, -0.45); w.scale.set(s, 1, 1); body.add(w); wings.push({ w, s }); }
    A.extra.push((dt, tm) => { for (const { w, s } of wings) w.rotation.y = -s * (0.5 + Math.sin(tm * 4) * 0.3); });
    const armL = arm(body, -1, hide, hide, { x: 0.52, y: 1.15, r: 0.1, len: 0.3 }), armR = arm(body, 1, hide, hide, { x: 0.52, y: 1.15, r: 0.1, len: 0.3 });
    A.set({ body, armL, armR, head: hd });
  };
  B.crystal = (root, A) => {   // the crystal spirit
    const cm = mat('crystalBody', () => new T.MeshPhysicalMaterial({ color: 0xc8b0ff, roughness: 0.1, metalness: 0.05, clearcoat: 1, iridescence: 0.8, iridescenceIOR: 1.5, transparent: true, opacity: 0.88, emissive: 0x6a4ab0, emissiveIntensity: 0.25, flatShading: true })); const body = group(root); A.float = 0.25;
    const tor = add(body, new T.Mesh(geo('crysBody', () => new T.OctahedronGeometry(0.72, 1)), cm)); tor.position.y = 1.1; tor.scale.set(0.9, 1.2, 0.75);
    const heart = add(body, new T.Mesh(OCT(), GLOW(0xff9ae8, 3))); heart.position.set(0, 1.15, 0.45); heart.scale.y = 1.5; A.extra.push((dt, tm) => { heart.rotation.y = tm * 1.5; heart.scale.setScalar(1 + Math.sin(tm * 3) * 0.12); });
    const li = new T.PointLight(0xff9ae8, 2.5, 6, 2); li.position.set(0, 1.2, 0.6); body.add(li);
    const hd = { h: group(body, 0, 2.2, 0), eyes: [], R: 0.62 }; hd.h.userData.base = 2.2; add(hd.h, new T.Mesh(geo('crysHead', () => new T.IcosahedronGeometry(0.64, 1)), cm)).scale.set(1, 1.05, 0.95);
    for (const s of [-1, 1]) hd.eyes.push(eye(hd.h, { x: 0.24, y: 0.02, r: 0.17, R: 0.62, iris: 0x7a5ad8, yaw: 0.12 }, s));
    const sm = TOR(hd.h, MATTE(0x5a3a8a), 0.1, 0.02, PI * 0.8, 0, -0.22, 0.56); sm.rotation.z = PI + 0.25; hd.open = S(hd.h, MATTE(0x3a1a5a), 0.07, 0, -0.26, 0.54, 1.2, 0.12, 0.4); hd.open.userData.r = 0.07;
    for (let i = 0; i < 5; i++) { const c2 = add(body, new T.Mesh(OCT(), cm)); const a = i / 5 * PI * 2; c2.scale.set(1, 2.2, 1); A.extra.push((dt, tm) => { const b = a + tm * 0.6; c2.position.set(Math.cos(b) * 1.15, 1.1 + Math.sin(tm * 1.3 + a) * 0.25, Math.sin(b) * 0.7); c2.rotation.y = tm; }); }
    const armL = group(body, -0.62, 1.4, 0), armR = group(body, 0.62, 1.4, 0); for (const [a2, s] of [[armL, -1], [armR, 1]]) { a2.rotation.z = s * 0.4; const c3 = add(a2, new T.Mesh(OCT(), cm)); c3.position.y = -0.36; c3.scale.set(1, 2.6, 1); a2.userData.hand = group(a2, 0, -0.6, 0); }
    A.set({ body, armL, armR, head: hd });
  };
  B.pirate = (root, A) => {   // the ghost of the pirate cove
    const gm = GHOST(0xe8f4ff); const body = group(root); A.float = 0.45; A.ghost = true;
    LATHE(body, gm, [[0.001, 0.2], [0.7, 0.25], [0.66, 0.6], [0.58, 1.0], [0.5, 1.35], [0.34, 1.5], [0.001, 1.56]], 56, 0, 0, 0, { n: 6, amp: 0.05 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; const t = K(body, gm, 0.2, 0.5, Math.cos(a) * 0.5, 0.05, Math.sin(a) * 0.5, 16); t.rotation.x = PI; A.extra.push((dt, tm) => { t.position.y = 0.05 + Math.sin(tm * 3 + a) * 0.08; t.rotation.z = Math.sin(tm * 2 + a) * 0.25; }); }
    RING(body, CLOTH(0x2a2a3a), 0.5, 0.06, 1.0); BOX(body, METAL(0xd9a84a, 0.28), 0.18, 0.14, 0.06, 0, 1.0, 0.52);
    const hd = head(body, { y: 2.1, R: 0.64, skin: 0xe8f4ff, iris: 0x2a3a5a, brow: 0x2a2a3a, browW: 0.045, ears: 'none', blush: false, mouth: 'grin' }); hd.skull.material = gm;
    hd.eyes[1].visible = false; const ep = S(hd.h, GLOSS(0x1a1a22, 0.3), 0.16, 0, 0, 0, 1, 1, 0.3); ep.position.copy(surf(0.64, 0.235, 0.02, 0.01)); const strap = TOR(hd.h, MATTE(0x1a1a22), 0.66, 0.02, PI * 2, 0, 0.1, 0); strap.rotation.x = PI / 2 + 0.35; strap.rotation.z = -0.35;
    for (const s of [-1, 1]) { const m = CAP(hd.h, HAIR(0x2a2a34), 0.05, 0.3, s * 0.15, -0.14, 0.6); m.rotation.z = PI / 2 + s * 0.35; S(hd.h, HAIR(0x2a2a34), 0.05, s * 0.34, -0.06, 0.53); }
    const hat = group(hd.h, 0, 0.42, -0.04); hat.rotation.x = -0.1;
    { const sh = new T.Shape(); sh.moveTo(-1.05, 0.02); sh.quadraticCurveTo(-0.7, 0.2, -0.45, 0.52); sh.quadraticCurveTo(0, 0.95, 0.45, 0.52); sh.quadraticCurveTo(0.7, 0.2, 1.05, 0.02); sh.quadraticCurveTo(0, 0.2, -1.05, 0.02); const g = new T.ExtrudeGeometry(sh, { depth: 0.46, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 24 }); g.translate(0, 0, -0.23); const bic = add(hat, new T.Mesh(g, CLOTH(0x18181f))); const trim = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([[-1.02, 0.06], [-0.7, 0.24], [-0.45, 0.55], [0, 0.93], [0.45, 0.55], [0.7, 0.24], [1.02, 0.06]].map(q => new T.Vector3(q[0], q[1], 0.3))), 48, 0.028, 8, false), METAL(0xe0b050, 0.28)); hat.add(trim); }
    { const sk = group(hat, 0, 0.44, 0.31); S(sk, MATTE(0xf4f0e6, 0.5), 0.12, 0, 0.02, 0, 1, 0.95, 0.6); S(sk, MATTE(0xf4f0e6, 0.5), 0.07, 0, -0.08, 0.01, 1, 0.7, 0.6); for (const s2 of [-1, 1]) { S(sk, MATTE(0x18181f), 0.035, s2 * 0.045, 0.03, 0.065, 1, 1, 0.4); const bn = CAP(sk, MATTE(0xf4f0e6, 0.5), 0.022, 0.3, 0, -0.02, -0.01); bn.rotation.z = s2 * 0.8; } }
    const armL = arm(body, -1, gm, gm, { r: 0.12 }), armR = arm(body, 1, gm, gm, { r: 0.12 });
    const coin = C(armR.userData.hand, METAL(0xf2c14e, 0.2), 0.14, 0.14, 0.03, 0, 0.12, 0.12, 36); coin.rotation.x = PI / 2; armR.rotation.x = -1.2; A.extra.push((dt, tm) => { coin.rotation.z = tm * 3; });
    const li = new T.PointLight(0xbfe8ff, 1.0, 5, 2); li.position.set(0, 1.4, -0.7); body.add(li);
    A.set({ body, armL, armR, head: hd });
  };
  B.troll = (root, A) => {   // the troll under the bridge
    const skin = FUR(0x6a9a4a); const body = group(root); root.scale.setScalar(1.08);
    S(body, skin, 1.05, 0, 1.15, 0, 1.05, 1, 0.9); LATHE(body, CLOTH(0x6a4a2a, pattern('burlap', '#6a4a2a', '#4a3018')), [[0.001, 0.3], [1.04, 0.34], [1.08, 0.8], [0.92, 1.2], [0.001, 1.25]], 56, 0, 0, 0, { n: 7, amp: 0.05 });
    for (const s of [-1, 1]) { C(body, skin, 0.24, 0.26, 0.5, s * 0.45, 0.25, 0, 28); S(body, skin, 0.3, s * 0.45, 0.08, 0.12, 1.1, 0.6, 1.4); }
    const hd = head(body, { y: 2.3, R: 0.7, skin: 0x6a9a4a, iris: 0x8a3a1a, eyeR: 0.12, eyeX: 0.24, eyeY: 0.1, brow: 0x3a5a2a, browW: 0.06, nose: 0, ears: 'pointy', mouth: 'smile', lid: 0.34 }); hd.skull.material = skin;
    S(hd.h, skin, 0.26, 0, -0.02, 0.66, 1, 0.9, 1.1); for (const s of [-1, 1]) K(hd.h, GLOSS(0xf6f0dc, 0.3), 0.06, 0.2, s * 0.2, -0.3, 0.62, 12);
    for (let i = 0; i < 7; i++) S(hd.h, FUR(0x3a6a2a), R(0.12, 0.2), R(-0.3, 0.3), 0.6 + R(-0.05, 0.05), R(-0.3, 0.2));
    const armL = arm(body, -1, skin, skin, { x: 0.95, y: 1.7, r: 0.22, len: 0.6, spread: 0.3 }), armR = arm(body, 1, skin, skin, { x: 0.95, y: 1.7, r: 0.22, len: 0.6, spread: 0.3 });
    const sign = group(body, 0, 1.25, 1.05); BOX(sign, LEATHER(0xa87a4a), 1.5, 0.7, 0.08, 0, 0, 0); for (const s of [-1, 1]) C(sign, LEATHER(0x6a4a28), 0.04, 0.04, 0.7, s * 0.6, 0, 0.05, 8); armL.rotation.x = armR.rotation.x = -1.2; armL.rotation.z = -0.25; armR.rotation.z = 0.25;
    { const c = document.createElement('canvas'); c.width = 512; c.height = 240; const x = c.getContext('2d'); x.fillStyle = '#a87a4a'; x.fillRect(0, 0, 512, 240); x.strokeStyle = 'rgba(60,30,10,.35)'; for (let i = 0; i < 30; i++) { x.beginPath(); x.moveTo(0, i * 8 + Math.random() * 4); x.lineTo(512, i * 8 + Math.random() * 4); x.stroke(); } x.fillStyle = '#3a1e0c'; x.font = '900 120px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('? ? ?', 256, 124); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const pl = new T.Mesh(new T.PlaneGeometry(1.4, 0.64), tinted(new T.MeshStandardMaterial({ map: tx, roughness: 0.8 }), 0xa87a4a)); pl.position.z = 0.042; sign.add(pl); }
    A.set({ body, armL, armR, head: hd });
  };
  B.smith = (root, A) => {   // the smith
    const f = figure(root, { body: 'tunic', robe: CLOTH(0xd8c8a8), skin: 0xd8a47a, pants: CLOTH(0x4a3a2a), boots: LEATHER(0x2a1a10), belt: LEATHER(0x3a2418), buckle: METAL(0x8a8e96, 0.4), arm: { spread: 0.3 }, head: { iris: 0x3a2412, brow: 0x1a1008, mouth: 'grin', lash: true } }); A.set(f);
    APRON(f.body, LEATHER(0x6a3a1e), [[0.64, 0.42], [0.62, 0.8], [0.54, 1.2], [0.46, 1.4]], PI * 0.7, 0, 0, 0); for (const s2 of [-1, 1]) { const st = CAP(f.body, LEATHER(0x4a2612), 0.025, 0.5, s2 * 0.2, 1.5, 0.25); st.rotation.x = -0.5; }
    hairCap(f.head.h, 0x1a1210, 0.64, 0.5, 0.2); fringe(f.head.h, 0x1a1210, 0.64, 4, 0.5); for (const s of [-1, 1]) { for (let i = 0; i < 6; i++) S(f.head.h, HAIR(0x1a1210), 0.1 - i * 0.006, s * 0.5, -0.3 - i * 0.17, -0.02 + i * 0.03); RING(f.head.h, CLOTH(0xd8303a), 0.06, 0.02, -1.33, 0.13).position.x = s * 0.5; }
    const hm = hammer(f.armR.userData.hand); hm.position.set(0, 0.2, 0.02); hm.rotation.set(0.35, 0, -0.2); f.armR.rotation.x = -0.75;
  };
  B.ruins = (root, A) => {   // the ghost knight of the ruins
    const gm = GHOST(0xcfe4ff); const body = group(root); A.float = 0.35; A.ghost = true;
    LATHE(body, gm, [[0.001, 0.25], [0.6, 0.3], [0.6, 0.8], [0.52, 1.2], [0.48, 1.38], [0.32, 1.52], [0.001, 1.58]], 56, 0, 0, 0, { n: 6, amp: 0.04 }); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; const t = K(body, gm, 0.16, 0.5, Math.cos(a) * 0.42, 0.08, Math.sin(a) * 0.42, 12); t.rotation.x = PI; A.extra.push((dt, tm) => { t.rotation.z = Math.sin(tm * 2 + a) * 0.3; }); }
    RING(body, gm, 0.52, 0.06, 1.1); RING(body, gm, 0.4, 0.08, 1.5); for (const s of [-1, 1]) { const pad = add(body, new T.Mesh(capGeo(PI * 0.5, 0.26), gm)); pad.position.set(s * 0.5, 1.42, 0); pad.rotation.z = -s * 0.5; }
    const hd = head(body, { y: 2.1, R: 0.62, skin: 0xdcecff, iris: 0x4a8ad8, brow: 0x8aaad8, ears: 'none', blush: false }); hd.skull.material = gm;
    const helm = group(hd.h, 0, 0.06, 0); const hm = add(helm, new T.Mesh(capGeo(PI * 0.55, 0.7), gm)); hm.rotation.x = -0.3; for (let i = 0; i < 6; i++) S(helm, GHOST(0xbfe0ff), 0.12 - i * 0.008, 0, 0.72 - i * 0.02, 0.1 - i * 0.15, 0.6, 1.2, 1.3); const visor = RING(helm, gm, 0.66, 0.05, 0.28, 0.02); visor.rotation.x = PI / 2 - 0.5;
    const armL = arm(body, -1, gm, gm, { r: 0.13 }), armR = arm(body, 1, gm, gm, { r: 0.13 });
    const sw = sword(armR.userData.hand, true); sw.rotation.set(0.9, 0, -0.1); armR.rotation.x = -0.8; armR.rotation.z = 0.5;
    const li = new T.PointLight(0x9fd0ff, 1.0, 5, 2); li.position.set(0, 1.5, -0.7); body.add(li);
    A.set({ body, armL, armR, head: hd });
  };
  B.garden = (root, A) => {   // the gardener
    const f = figure(root, { body: 'tunic', robe: CLOTH(0x4a7a3a), sleeve: CLOTH(0xf2ece0), skin: 0xf0c2a0, pants: CLOTH(0x8a7a5a), boots: LEATHER(0x5a3a1e), folds: { n: 8, amp: 0.015 }, head: { iris: 0x5a6a3a, brow: 0xf0f0f0, browW: 0.04, lid: 0.34, nose: 1.3 } }); A.set(f);
    for (let i = 0; i < 4; i++) S(f.body, METAL(0xd9a84a, 0.3), 0.035, 0, 0.72 + i * 0.16, 0.51 - i * 0.01);
    for (const s of [-1, 1]) { const m = S(f.head.h, HAIR(0xf4f4f0), 0.14, s * 0.16, -0.19, 0.6, 1.7, 0.7, 0.8); m.rotation.z = s * 0.4; }
    hairBack(f.head.h, 0xe8e8e4, 0.64, 0.5, 0.9);
    const hat = group(f.head.h, 0, 0.38, 0); const straw = CLOTH(0xe2bc62, pattern('straw', '#e2bc62', '#b88a3a'), 'straw'); C(hat, straw, 0.98, 1.02, 0.05, 0, 0, 0, 64); C(hat, straw, 0.46, 0.52, 0.36, 0, 0.18, 0, 44); RING(hat, CLOTH(0x3a6a2a), 0.5, 0.045, 0.06);
    const bq = group(f.armL.userData.hand, 0, 0.1, 0.12); for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.05, z = R(-0.05, 0.05); C(bq, MATTE(0x3a8a2a), 0.015, 0.015, 0.6, x, 0.3, z, 6); S(bq, CLOTH([0xe8304a, 0xf2a0c0, 0xf8d040, 0xe8304a, 0xb060d0][i]), 0.08, x, 0.62, z, 0.9, 1.3, 0.9); } f.armL.rotation.x = -0.9;
    const can = group(f.armR.userData.hand, 0, -0.18, 0.06); const zinc = METAL(0xb8c0c8, 0.34); C(can, zinc, 0.18, 0.2, 0.32, 0, 0, 0, 36); const sp = C(can, zinc, 0.03, 0.05, 0.4, 0.25, 0.06, 0, 12); sp.rotation.z = -0.9; TOR(can, zinc, 0.13, 0.02, PI, 0, 0.16, 0);
  };
  B.boat = (root, A) => {   // the rainbow spirit of the river boat
    const f = figure(root, { body: 'dress', robe: CLOTH(0xf8f4ff), skin: 0xfae0cc, head: { iris: 0x5a8ad8, brow: 0xd8a0c0, lash: true } }); A.set(f); A.float = 0.4;
    const cols = [0xff5a5a, 0xffa03a, 0xffe050, 0x5ad86a, 0x4ab0f0, 0x8a6af0]; hairCap(f.head.h, 0xffe8a0, 0.64, 0.55, 0.3); fringe(f.head.h, 0xffe8a0, 0.64, 5, 0.44);
    const lk = group(f.head.h, 0, 0.25, -0.2); cols.forEach((c, i) => { const piv = group(lk, (i - 2.5) * 0.1, 0, 0); const sx = (i - 2.5) * 0.16; const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new T.Vector3(sx * (1 + t * 1.6) + Math.sin(t * 5 + i) * 0.08, -t * 2.2, -0.35 - t * 0.55 + Math.sin(t * 4 + i * 0.7) * 0.12)); } const tube = add(piv, new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.1, 10, false), mat('rain' + c, () => new T.MeshPhysicalMaterial({ color: c, roughness: 0.4, sheen: 1, emissive: c, emissiveIntensity: 0.3, normalMap: normalTex('hair', 3), normalScale: new T.Vector2(0.6, 0.6) })))); S(piv, tube.material, 0.1, pts[10].x, pts[10].y, pts[10].z); A.extra.push((dt, tm) => { piv.rotation.x = Math.sin(tm * 1.8 + i * 0.7) * 0.1; piv.rotation.z = Math.sin(tm * 2 + i) * 0.05; }); });
    const li = new T.PointLight(0xffe8f0, 0.9, 5, 2); li.position.set(0, 2.6, -0.8); root.add(li);
  };

  /* ---------------------------------------------------------------- the animator */
  function build(id, opts) {
    const root = new T.Group(); root.name = 'host:' + id; const inner = new T.Group(); root.add(inner);
    const A = { extra: [], float: 0, ghost: false, parts: null, set(p) { this.parts = p; } };
    const lod0 = LOD; LOD = opts && opts.lod ? opts.lod : 1; try { (B[id] || B.fire)(inner, A); } finally { LOD = lod0; }
    const P = A.parts || { body: inner, head: null, armL: null, armR: null };
    const st = { blink: R(1.5, 4), blinkT: 0, talk: false, talkK: 0.12, react: null, rt: 0, t: R(0, 10) };
    for (const a of [P.armL, P.armR]) if (a) a.userData.pose = { x: a.rotation.x, z: a.rotation.z };
    const lerp = (a, b, k) => a + (b - a) * k;
    function update(dt) {
      st.t += dt; const t = st.t, H = P.head, L = P.armL, Rr = P.armR;
      if (P.body) { P.body.scale.y = 1 + Math.sin(t * 2.1) * 0.012; P.body.rotation.y = Math.sin(t * 0.45) * 0.06; }
      let y = A.float ? A.float * (0.6 + 0.4 * Math.sin(t * 1.6)) : 0;
      if (H && H.h) { H.h.rotation.y = Math.sin(t * 0.37) * 0.16 + Math.sin(t * 0.91) * 0.05; H.h.rotation.x = Math.sin(t * 0.53) * 0.04; H.h.rotation.z = Math.sin(t * 0.29) * 0.04; }
      st.blink -= dt; if (st.blink <= 0) { st.blinkT = 0.14; st.blink = R(2, 5.5); }
      if (H && H.eyes) { let k = 1; if (st.blinkT > 0) { st.blinkT -= dt; k = Math.max(0.08, Math.abs(st.blinkT - 0.07) / 0.07); } for (const e of H.eyes) e.scale.y = k; }
      if (H && H.open) { const target = st.talk ? (0.3 + 0.7 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.3))) : 0.12; st.talkK += (target - st.talkK) * Math.min(1, dt * 18); H.open.scale.y = (H.open.userData.r || 0.08) * st.talkK; if (st.talk && H.h) H.h.rotation.x += Math.sin(t * 7) * 0.025; }
      if (st.react) { st.rt += dt; const k = st.rt;
        if (st.react === 'ok' || st.react === 'cheer') { const e = Math.min(1, k / 0.25) * (k > 1.2 ? Math.max(0, 1 - (k - 1.2) / 0.3) : 1); if (L) { L.rotation.z = lerp(L.userData.pose.z, -2.5, e); L.rotation.x = lerp(L.userData.pose.x, 0, e); } if (Rr) { Rr.rotation.z = lerp(Rr.userData.pose.z, 2.5, e); Rr.rotation.x = lerp(Rr.userData.pose.x, 0, e); } if (k < 1.2) y += Math.max(0, Math.sin(k * 9)) * 0.28; if (k > 1.5) st.react = null; }
        else if (st.react === 'bad') { if (H && H.h) H.h.rotation.y = Math.sin(k * 16) * 0.35 * Math.max(0, 1 - k / 1.1); if (P.body) P.body.rotation.x = k < 1.1 ? 0.08 * Math.sin(Math.min(1, k / 0.3) * PI / 2) : 0; if (k > 1.2) { st.react = null; if (P.body) P.body.rotation.x = 0; } }
        else if (st.react === 'wave') { if (Rr) { const e = Math.min(1, k / 0.3) * (k > 1.8 ? Math.max(0, 1 - (k - 1.8) / 0.3) : 1); Rr.rotation.z = lerp(Rr.userData.pose.z, 2.6 + Math.sin(k * 10) * 0.35, e); Rr.rotation.x = lerp(Rr.userData.pose.x, 0, e); } if (k > 2.1) st.react = null; }
      } else { for (const [a, s] of [[L, 1], [Rr, -1]]) if (a) { a.rotation.z += (a.userData.pose.z + s * Math.sin(t * 1.3) * 0.03 - a.rotation.z) * Math.min(1, dt * 6); a.rotation.x += (a.userData.pose.x - a.rotation.x) * Math.min(1, dt * 6); } }
      inner.position.y = y;
      for (const f of A.extra) f(dt, t);
    }
    function react(kind) { st.react = kind; st.rt = 0; }
    function talk(on) { st.talk = !!on; }
    function dispose() { root.removeFromParent(); }
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = !A.ghost; } });
    return { root, update, react, talk, dispose, parts: P, float: A.float };
  }
  window.KQCast = { build, IDS: Object.keys(B) };
})();
