/* Kingdom Quest — procedural architecture kit for the great hall.
   three.js r160 CORE ONLY (no addons, no assets). Every builder returns a BufferGeometry in local
   space; the caller assigns theme materials. Exposes window.KQArch.
   Room contract (world space): floor y=-1.5, interior wall faces at x=±14 and z=±14,
   +Z = hearth wall, -Z = throne wall. */
(function () {
  'use strict';
  const T = window.THREE, PI = Math.PI, TAU = PI * 2;
  const V3 = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);
  const UPY = V3(0, 1, 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const CACHE = {}; const cached = (k, fn) => CACHE[k] || (CACHE[k] = fn());

  // ------------------------------------------------------------------ utilities
  const tri = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
  function idx(g) { if (g.index) return g; const n = g.attributes.position.count, a = n > 65535 ? new Uint32Array(n) : new Uint16Array(n); for (let i = 0; i < n; i++) a[i] = i; g.setIndex(new T.BufferAttribute(a, 1)); return g; }
  function flipFaces(g) { const a = idx(g).index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } g.computeVertexNormals(); return g; }
  /* faceDown — make a ceiling/vault surface face into the room (average normal pointing -Y). */
  function faceDown(g) { if (!g.attributes.normal) g.computeVertexNormals(); const n = g.attributes.normal.array; let s = 0; for (let i = 1; i < n.length; i += 3) s += n[i]; return s > 0 ? flipFaces(g) : g; }

  /* mergeGeos — stand-in for BufferGeometryUtils.mergeGeometries (an addon we do not have).
     Consumes its inputs. position/normal/uv only; keeps everything indexed. */
  function mergeGeos(list) {
    const gs = list.filter(Boolean); if (!gs.length) return new T.BufferGeometry(); if (gs.length === 1) return gs[0];
    let vc = 0, ic = 0;
    for (const g of gs) { if (!g.attributes.normal) g.computeVertexNormals(); idx(g); vc += g.attributes.position.count; ic += g.index.count; }
    const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3), uv = new Float32Array(vc * 2), ind = vc > 65535 ? new Uint32Array(ic) : new Uint16Array(ic);
    let vo = 0, io = 0;
    for (const g of gs) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, vo * 3); nrm.set(g.attributes.normal.array, vo * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
      const s = g.index.array; for (let i = 0; i < s.length; i++) ind[io + i] = s[i] + vo;
      vo += n; io += s.length;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nrm, 3));
    out.setAttribute('uv', new T.BufferAttribute(uv, 2)); out.setIndex(new T.BufferAttribute(ind, 1));
    for (const g of gs) g.dispose();
    return out;
  }

  const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _sc = new T.Vector3();
  /* xf(geo, {x,y,z,rx,ry,rz,s|sx,sy,sz}) — bake a transform in so the geometry can be merged. */
  function xf(g, o) { o = o || {}; _e.set(o.rx || 0, o.ry || 0, o.rz || 0); _sc.set(o.sx || o.s || 1, o.sy || o.s || 1, o.sz || o.s || 1); _m4.compose(V3(o.x, o.y, o.z), _q.setFromEuler(_e), _sc); g.applyMatrix4(_m4); if (_sc.x * _sc.y * _sc.z < 0) flipFaces(g); return g; }

  /* weld(geo, angleDeg) — average normals only across faces whose dihedral angle is under the
     threshold. Turns ExtrudeGeometry's flat facets into a real fillet without smearing the flats.
     Use on roundedBox(..., 2|3) and on the knight head. O(n) with small buckets. */
  function weld(g, angleDeg) {
    idx(g); if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array, cnt = g.attributes.position.count;
    const lim = Math.cos((angleDeg == null ? 32 : angleDeg) * PI / 180), map = new Map();
    for (let i = 0; i < cnt; i++) { const k = Math.round(p[i * 3] * 1e4) + '|' + Math.round(p[i * 3 + 1] * 1e4) + '|' + Math.round(p[i * 3 + 2] * 1e4); let b = map.get(k); if (!b) map.set(k, b = []); b.push(i); }
    const out = new Float32Array(n.length); out.set(n);
    map.forEach(b => { if (b.length < 2) return; for (const i of b) { let x = 0, y = 0, z = 0; for (const j of b) { if (n[i * 3] * n[j * 3] + n[i * 3 + 1] * n[j * 3 + 1] + n[i * 3 + 2] * n[j * 3 + 2] >= lim) { x += n[j * 3]; y += n[j * 3 + 1]; z += n[j * 3 + 2]; } } const L = Math.hypot(x, y, z) || 1; out[i * 3] = x / L; out[i * 3 + 1] = y / L; out[i * 3 + 2] = z / L; } });
    g.setAttribute('normal', new T.BufferAttribute(out, 3)); return g;
  }

  // ----------------------------------------------- 1. rounded / chamfered box
  /* roundedBox(w,h,d,r,seg) — the RoundedBoxGeometry the core build doesn't ship.
       seg = 1 (default) -> one 45° chamfer on all 12 edges: 60 tris, crisp arris highlight.
       seg = 2..3        -> a true fillet; run weld(g, 40) afterwards if you want it smooth-shaded.
     Axes match BoxGeometry (w=x, h=y, d=z), centred on the origin, exact outer dimensions.
     At 60 tris vs BoxGeometry's 12 you can afford this on essentially every box in the room. */
  function roundedBox(w, h, d, r, seg) {
    seg = seg == null ? 1 : seg; r = Math.max(1e-3, Math.min(r == null ? 0.04 : r, Math.min(w, h, d) * 0.49));
    const x = w / 2 - r, y = h / 2 - r, s = new T.Shape();
    s.moveTo(-x, -y - r); s.lineTo(x, -y - r);
    s.quadraticCurveTo(x + r, -y - r, x + r, -y); s.lineTo(x + r, y);
    s.quadraticCurveTo(x + r, y + r, x, y + r); s.lineTo(-x, y + r);
    s.quadraticCurveTo(-x - r, y + r, -x - r, y); s.lineTo(-x - r, -y);
    s.quadraticCurveTo(-x - r, -y - r, -x, -y - r);
    const dep = Math.max(1e-4, d - 2 * r);
    const g = new T.ExtrudeGeometry(s, { depth: dep, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelOffset: 0, bevelSegments: seg, curveSegments: seg });
    g.translate(0, 0, -dep / 2); return g;
  }
  const rbox = (w, h, d, r, seg) => cached('rb' + [w, h, d, r, seg].join('_'), () => roundedBox(w, h, d, r, seg)).clone();

  // ------------------------------------------------------ 4. mouldings / sweeps
  /* prepProfile — 2D cross-section -> points + per-point 2D normals, duplicating points at hard
     corners so mouldings get crisp arrises. Closed profiles are auto-wound CCW, so normals always
     face out of the solid (no more inside-out mouldings). */
  function prepProfile(p, smoothDeg, closed) {
    let pts = p.map(q => [q[0], q[1]]);
    if (closed) { let a = 0; for (let i = 0; i < pts.length; i++) { const q = pts[i], w = pts[(i + 1) % pts.length]; a += q[0] * w[1] - w[0] * q[1]; } if (a < 0) pts.reverse(); pts = pts.concat([[pts[0][0], pts[0][1]]]); }
    const n = pts.length, cosLim = Math.cos((smoothDeg == null ? 32 : smoothDeg) * PI / 180), sn = [];
    for (let i = 0; i < n - 1; i++) { const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], L = Math.hypot(dx, dy) || 1; sn.push([dy / L, -dx / L]); }
    const u = [], v = [], nu = [], nv = [], s = []; let arc = 0;
    const push = (i, m) => { u.push(pts[i][0]); v.push(pts[i][1]); nu.push(m[0]); nv.push(m[1]); s.push(arc); };
    for (let i = 0; i < n; i++) {
      if (i > 0) arc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const a = i === 0 ? (closed ? sn[n - 2] : null) : sn[i - 1], b = i === n - 1 ? (closed ? sn[0] : null) : sn[i];
      if (!a) push(i, b); else if (!b) push(i, a);
      else if (a[0] * b[0] + a[1] * b[1] >= cosLim) { const x = a[0] + b[0], y = a[1] + b[1], L = Math.hypot(x, y) || 1; push(i, [x / L, y / L]); }
      else { push(i, a); push(i, b); }
    }
    return { u, v, nu, nv, s };
  }

  /* sweep(profile, path, o) — THE workhorse. Extrudes a 2D profile along a 3D polyline with an
     explicit up vector, so orientation is deterministic (ExtrudeGeometry's extrudePath uses Frenet
     frames and twists unpredictably on straight runs). Used for cornices, chair rails, skirtings,
     vault ribs, archivolts, mullions, coffer frames and mantel shelves.
       profile : [[u,v],...]   u = lateral (out from the wall), v = along `up`
       path    : [Vector3,...]
       o.up          Vector3 or fn(i, point)->Vector3 (default +Y)
       o.closedPath  loop the path (mitres the corners automatically)
       o.closedProfile  treat the profile as a closed ring (auto CCW)
       o.smooth      arris threshold in degrees (default 32)
       o.mitre       default true; set false on smoothly curved paths
       o.uvScale
     Tri cost: (pathPoints-1) * (profilePoints-1) * 2.  A straight cornice run = ~18 tris. */
  function sweep(profile, path, o) {
    o = o || {};
    const S = path.length, cp = !!o.closedPath, pp = prepProfile(profile, o.smooth, o.closedProfile), P = pp.u.length;
    if (S < 2 || P < 2) return new T.BufferGeometry();
    const upFn = typeof o.up === 'function' ? o.up : (() => o.up || UPY), us = o.uvScale == null ? 1 : o.uvScale;
    const pos = new Float32Array(S * P * 3), nrm = new Float32Array(S * P * 3), uv = new Float32Array(S * P * 2);
    const ta = new T.Vector3(), r = new T.Vector3(), u2 = new T.Vector3(), d0 = new T.Vector3(), d1 = new T.Vector3(), up = new T.Vector3();
    let dist = 0;
    for (let i = 0; i < S; i++) {
      const p = path[i], ia = cp ? (i - 1 + S) % S : Math.max(0, i - 1), ib = cp ? (i + 1) % S : Math.min(S - 1, i + 1);
      d0.subVectors(p, path[ia]); d1.subVectors(path[ib], p);
      if (d0.lengthSq() < 1e-12) d0.copy(d1); if (d1.lengthSq() < 1e-12) d1.copy(d0);
      d0.normalize(); d1.normalize(); ta.addVectors(d0, d1); if (ta.lengthSq() < 1e-9) ta.copy(d1); ta.normalize();
      up.copy(upFn(i, p)).normalize();
      if (Math.abs(up.dot(ta)) > 0.985) up.set(Math.abs(ta.y) > 0.9 ? 1 : 0, Math.abs(ta.y) > 0.9 ? 0 : 1, 0);
      r.crossVectors(ta, up).normalize(); u2.crossVectors(r, ta).normalize();
      const k = o.mitre === false ? 1 : 1 / Math.sqrt(Math.max(0.15, (1 + d0.dot(d1)) * 0.5));
      if (i > 0) dist += p.distanceTo(path[i - 1]);
      for (let j = 0; j < P; j++) {
        const b = i * P + j, uu = pp.u[j] * k, vv = pp.v[j];
        pos[b * 3] = p.x + r.x * uu + u2.x * vv; pos[b * 3 + 1] = p.y + r.y * uu + u2.y * vv; pos[b * 3 + 2] = p.z + r.z * uu + u2.z * vv;
        const nx = r.x * pp.nu[j] + u2.x * pp.nv[j], ny = r.y * pp.nu[j] + u2.y * pp.nv[j], nz = r.z * pp.nu[j] + u2.z * pp.nv[j], L = Math.hypot(nx, ny, nz) || 1;
        nrm[b * 3] = nx / L; nrm[b * 3 + 1] = ny / L; nrm[b * 3 + 2] = nz / L;
        uv[b * 2] = dist * us; uv[b * 2 + 1] = pp.s[j] * us;
      }
    }
    const rings = cp ? S : S - 1, nq = rings * (P - 1), ind = S * P > 65535 ? new Uint32Array(nq * 6) : new Uint16Array(nq * 6);
    let k2 = 0;
    for (let i = 0; i < rings; i++) { const i2 = (i + 1) % S; for (let j = 0; j < P - 1; j++) { const a = i * P + j, b = a + 1, c = i2 * P + j + 1, d = i2 * P + j; ind[k2++] = a; ind[k2++] = b; ind[k2++] = c; ind[k2++] = a; ind[k2++] = c; ind[k2++] = d; } }
    // Make the winding agree with the profile normals we already know are correct. Scan for the
    // first NON-degenerate triangle: closed profiles duplicate points at every hard arris, so
    // triangle 0 is usually a zero-area sliver and testing it would flip the whole mesh at random.
    for (let t = 0; t < ind.length; t += 3) {
      const a = ind[t] * 3, b = ind[t + 1] * 3, c = ind[t + 2] * 3;
      const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
      const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
      const fx = e1y * e2z - e1z * e2y, fy = e1z * e2x - e1x * e2z, fz = e1x * e2y - e1y * e2x;
      const d = fx * nrm[a] + fy * nrm[a + 1] + fz * nrm[a + 2];
      if (Math.hypot(fx, fy, fz) < 1e-7) continue;
      if (d < 0) for (let i = 0; i < ind.length; i += 3) { const t2 = ind[i + 1]; ind[i + 1] = ind[i + 2]; ind[i + 2] = t2; }
      break;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nrm, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(new T.BufferAttribute(ind, 1));
    return g;
  }

  /* Moulding profiles. u = 0 sits on the wall face, +u runs INTO the room; v is vertical relative to
     the profile origin. All closed polygons -> pass closedProfile:true.
     Resize with scaleProfile(PROFILES.cornice, 1.3) rather than editing these in place. */
  const PROFILES = {
    cornice:   [[0, 0], [0.11, 0.03], [0.17, 0.09], [0.19, 0.17], [0.27, 0.23], [0.31, 0.31], [0.31, 0.46], [0.53, 0.52], [0.55, 0.59], [0.46, 0.67], [0.34, 0.75], [0.30, 0.85], [0.21, 0.90], [0, 0.90]],
    chairRail: [[0, 0], [0.09, 0.02], [0.14, 0.07], [0.15, 0.14], [0.22, 0.19], [0.22, 0.25], [0.15, 0.30], [0.08, 0.34], [0, 0.34]],
    skirting:  [[0, 0], [0.18, 0], [0.18, 0.44], [0.14, 0.50], [0.13, 0.57], [0.07, 0.62], [0.05, 0.65], [0, 0.65]],
    sill:      [[0, 0], [0.34, 0.06], [0.34, 0.17], [0.27, 0.24], [0.10, 0.26], [0, 0.26]],
    archivolt: [[0, 0], [0.12, 0.01], [0.20, 0.08], [0.20, 0.20], [0.12, 0.27], [0, 0.28]],
    rib:       [[-0.15, 0], [-0.15, 0.10], [-0.11, 0.20], [-0.05, 0.28], [0, 0.31], [0.05, 0.28], [0.11, 0.20], [0.15, 0.10], [0.15, 0]],
    ribSmall:  [[-0.09, 0], [-0.09, 0.07], [-0.05, 0.14], [0, 0.17], [0.05, 0.14], [0.09, 0.07], [0.09, 0]],
    coffer:    [[0, 0], [0.10, 0], [0.10, 0.14], [0.06, 0.19], [0.05, 0.24], [0, 0.26]],
    mullion:   [[-0.09, -0.06], [-0.09, 0.13], [-0.05, 0.19], [0, 0.21], [0.05, 0.19], [0.09, 0.13], [0.09, -0.06], [0.05, -0.10], [-0.05, -0.10]],
    bead:      [[0, 0], [0.07, 0.02], [0.09, 0.07], [0.07, 0.12], [0, 0.14]]
  };
  const scaleProfile = (p, su, sv) => p.map(q => [q[0] * su, q[1] * (sv == null ? su : sv)]);
  const flipProfileU = p => p.map(q => [-q[0], q[1]]);

  /* mouldingLoop(y, hx, hz, profile, o) — run a moulding right round the room. The CCW-from-above
     path makes +u point into the room on all four walls and mitres the corners automatically (the
     section widens by 1/cos(45°) through each turn, exactly like a real mitre). ~80 tris total. */
  function mouldingLoop(y, hx, hz, profile, o) {
    const path = [V3(-hx, y, -hz), V3(hx, y, -hz), V3(hx, y, hz), V3(-hx, y, hz)];
    return sweep(profile, path, Object.assign({ closedPath: true, closedProfile: true, up: UPY, uvScale: 0.5 }, o || {}));
  }
  const mouldingRun = (profile, pts, o) => sweep(profile, pts, Object.assign({ closedProfile: true, up: UPY }, o || {}));

  // ------------------------------------------------------------------ 2. columns
  /* flutedShaft(o) — a cylinder with real flutes cut into it, entasis (the subtle bulge that stops a
     shaft looking like drainpipe) and flutes that die out near both ends, as they do in stone.
       o.sweep < TAU  -> a half-round engaged column for a wall pier (flat back at local z = 0)
       o.fillet = 0   -> Doric sharp arrises; 0.28 -> Ionic fillet band between flutes
     Tri cost: flutes * fluteSegs * rings * 2  (12*4*5*2 = 480 full, 240 engaged). */
  function flutedShaft(o) {
    o = o || {};
    const h = o.h == null ? 8.5 : o.h, rb = o.rBot == null ? 0.49 : o.rBot, rt = o.rTop == null ? rb * 0.855 : o.rTop,
      n = o.flutes || 12, per = o.fluteSegs || 4, depth = o.fluteDepth == null ? 0.085 : o.fluteDepth,
      fillet = o.fillet == null ? 0.28 : o.fillet, bulge = o.entasis == null ? 0.015 : o.entasis,
      ny = o.rings || 5, sw = o.sweep == null ? TAU : o.sweep, open = sw < TAU - 1e-6,
      seg = Math.max(6, Math.round(n * per * sw / TAU)), cols = open ? seg + 1 : seg,
      phi0 = o.phiStart == null ? (open ? -sw / 2 : 0) : o.phiStart;
    const radAt = t => (rt + (rb - rt) * Math.cos(t * PI / 2)) * (1 + bulge * Math.sin(PI * t));
    const stop = t => clamp((t - 0.035) / 0.07, 0, 1) * clamp((0.965 - t) / 0.07, 0, 1);
    const fl = th => { const p = TAU / n, u = (((th % p) + p) % p) / p, x = (u - 0.5) / Math.max(1e-3, 0.5 - fillet * 0.5); return Math.abs(x) < 1 ? Math.sqrt(1 - x * x) : 0; };
    const nv = (ny + 1) * cols, pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    for (let i = 0; i <= ny; i++) {
      const t = i / ny, R = radAt(t), dep = depth * stop(t);
      for (let j = 0; j < cols; j++) {
        const th = phi0 + sw * (j / seg), rr = R * (1 - dep * fl(th)), b = i * cols + j;
        pos[b * 3] = Math.sin(th) * rr; pos[b * 3 + 1] = t * h; pos[b * 3 + 2] = Math.cos(th) * rr;
        uv[b * 2] = (j / seg) * (sw / TAU) * 4; uv[b * 2 + 1] = t * h * 0.25;
      }
    }
    const span = open ? cols - 1 : cols, ind = nv > 65535 ? new Uint32Array(ny * span * 6) : new Uint16Array(ny * span * 6);
    let k = 0;
    for (let i = 0; i < ny; i++) for (let j = 0; j < span; j++) { const j2 = (j + 1) % cols, a = i * cols + j, b = i * cols + j2, c = (i + 1) * cols + j2, d = (i + 1) * cols + j; ind[k++] = a; ind[k++] = b; ind[k++] = c; ind[k++] = a; ind[k++] = c; ind[k++] = d; }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(new T.BufferAttribute(ind, 1)); g.computeVertexNormals();
    if (open && o.backPlate !== false) { const bp = new T.PlaneGeometry(2 * rb * Math.sin(sw / 2), h, 1, ny); xf(bp, { y: h / 2, ry: PI }); return mergeGeos([g, bp]); }
    return g;
  }

  const latheGeo = (pts, seg, phiStart, phiLen) => new T.LatheGeometry(pts.map(p => new T.Vector2(Math.max(1e-4, p[0]), p[1])), seg || 20, phiStart || 0, phiLen == null ? TAU : phiLen);

  /* capital(o) — order: 'tuscan' | 'doric' (astragal + necking + echinus + abacus) or 'gothic'
     (a moulded bell with a ring — the right read for a great hall). Tri cost ~ 520 at seg 24. */
  function capital(o) {
    o = o || {}; const r = o.r == null ? 0.42 : o.r, order = o.order || 'tuscan', seg = o.seg || 24,
      H = o.h == null ? 0.86 : o.h, abH = o.abacusH == null ? 0.22 : o.abacusH, ab = o.abacus == null ? r * 3.2 : o.abacus, parts = [];
    if (order === 'gothic') {
      const bell = []; for (let i = 0; i <= 7; i++) { const t = i / 7; bell.push([r * (0.97 + 0.62 * Math.pow(t, 1.7)), t * (H - abH - 0.08)]); }
      parts.push(latheGeo([[r * 0.95, -0.16], [r * 1.03, -0.11], [r * 1.05, -0.05], [r * 0.99, -0.01]].concat(bell), seg));
      parts.push(latheGeo([[r * 1.55, H - abH - 0.10], [r * 1.66, H - abH - 0.05], [r * 1.62, H - abH]], seg));
    } else {
      parts.push(latheGeo([[r * 0.93, -0.18], [r * 1.02, -0.13], [r * 1.04, -0.07], [r * 0.97, -0.02], [r * 0.99, 0.04]], seg));
      const ov = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * PI / 2; ov.push([r * (0.99 + 0.46 * Math.sin(a)), 0.04 + (H - abH - 0.04) * (1 - Math.cos(a))]); }
      parts.push(latheGeo(ov, seg));
    }
    parts.push(xf(roundedBox(ab, abH, ab, 0.05, 1), { y: H - abH / 2 }));
    return mergeGeos(parts);
  }

  /* columnBase(o) — Attic base: square plinth + torus + scotia + torus. Tri cost ~ 300. */
  function columnBase(o) {
    o = o || {}; const r = o.r == null ? 0.49 : o.r, H = o.h == null ? 0.95 : o.h, seg = o.seg || 24, pl = o.plinth == null ? r * 2.8 : o.plinth;
    const p = [[0, 0], [r * 1.30, 0], [r * 1.34, 0.07], [r * 1.28, 0.15], [r * 1.10, 0.22], [r * 1.16, 0.32], [r * 1.12, 0.42], [r * 1.24, 0.50], [r * 1.20, 0.58], [r * 1.02, 0.64], [r, 0.68]];
    const ph = H * 0.42, k = (H - ph) / 0.68;
    return mergeGeos([xf(roundedBox(pl, ph, pl, 0.05, 1), { y: ph / 2 }), xf(latheGeo(p.map(q => [q[0], q[1] * k]), seg), { y: ph })]);
  }

  /* column(o) — a whole order merged into ONE geometry (one mesh, one draw call, one material).
       o.h        total floor-to-abacus height          (default 10.3)
       o.rBot     shaft radius at the base              (0.49)
       o.order    'tuscan' | 'doric' | 'gothic'
       o.engaged  true -> half-round pilaster; the flat back sits on local z = 0, so place the mesh
                  ON the wall face and rotate it to face the room.
       o.seg      lathe segments for base+capital (default 14 engaged / 24 free)
       o.flutes / o.fluteSegs / o.rings   shaft resolution
     Tri cost: engaged ~ 1,014, free-standing ~ 1,704.  Half those with
     {seg: 10, flutes: 8, fluteSegs: 3, rings: 4} for the iPad tier. */
  function column(o) {
    o = o || {};
    const H = o.h == null ? 10.3 : o.h, rb = o.rBot == null ? 0.49 : o.rBot, order = o.order || 'tuscan',
      eng = !!o.engaged, sw = eng ? PI : TAU, seg = o.seg || (eng ? 14 : 24), doric = order === 'doric',
      bh = o.baseH == null ? (doric ? 0.28 : 0.95) : o.baseH, ch = o.capH == null ? 0.86 : o.capH, sh = H - bh - ch, rt = rb * 0.855;
    const parts = [];
    parts.push(xf(doric ? roundedBox(rb * 2.6, bh, rb * 2.6, 0.05, 1) : columnBase({ r: rb, h: bh, seg: seg }), doric ? { y: bh / 2 } : { y: 0 }));
    parts.push(xf(flutedShaft({ h: sh, rBot: rb, rTop: rt, flutes: o.flutes || (doric ? 16 : 12), fluteSegs: o.fluteSegs || 4, fillet: doric ? 0 : 0.28, rings: o.rings || 5, sweep: sw, phiStart: eng ? -PI / 2 : 0 }), { y: bh }));
    parts.push(xf(capital({ r: rt, h: ch, order: order, seg: seg }), { y: bh + sh }));
    const g = mergeGeos(parts);
    if (eng) xf(g, { z: o.proud == null ? 0.04 : o.proud });
    return g;
  }

  // -------------------------------------------------------------------- 3. vaults
  /* A ribbed CLOISTER (coved) vault with a flat coffered panel over the middle. It springs off the
     capitals along every wall, sweeps up on an elliptical arc and dies into the panel. The groins
     fall exactly on the diagonals, and because the four webs are separate vertex sets the groin
     stays a crease rather than a smudge. No interior piers, so the board stays clear — and the
     camera (y clamped to 10.1) always sees it from below.
       o.S  half room size (14)    o.P  half panel size (5.5)
       o.y0 springing height (8.8) o.y1 crown height (12.6) */
  const coveM = (o, phi) => o.P + (o.S - o.P) * Math.sin(phi);
  const coveYof = (o, phi) => o.y0 + (o.y1 - o.y0) * Math.cos(phi);
  /* surface normal pointing down/into the room — feed this to sweep() as `up` when placing ribs */
  function coveNormal(o, phi, dx, dz) { const A = o.S - o.P, B = o.y1 - o.y0, m = -B * Math.sin(phi), y = -A * Math.cos(phi), L = Math.hypot(m, y) || 1; return V3(dx * m / L, y / L, dz * m / L); }
  const coveRot = (side, p) => side === 0 ? p : side === 1 ? [p[2], p[1], -p[0]] : side === 2 ? [-p[0], p[1], -p[2]] : [-p[2], p[1], p[0]];

  /* coveVault(o) — the four webs. Tri cost 4 * sSeg * tSeg * 2 (4*28*8*2 = 1,792). */
  function coveVault(o) {
    o = Object.assign({ S: 14, P: 5.5, y0: 8.8, y1: 12.6, sSeg: 28, tSeg: 8 }, o || {});
    const webs = [];
    for (let side = 0; side < 4; side++) {
      const nv = (o.tSeg + 1) * (o.sSeg + 1), pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
      for (let i = 0; i <= o.tSeg; i++) {
        const phi = (1 - i / o.tSeg) * PI / 2, m = coveM(o, phi), y = coveYof(o, phi);
        for (let j = 0; j <= o.sSeg; j++) {
          const s = (j / o.sSeg) * 2 - 1, b = i * (o.sSeg + 1) + j, p = coveRot(side, [s * m, y, m]);
          pos[b * 3] = p[0]; pos[b * 3 + 1] = p[1]; pos[b * 3 + 2] = p[2];
          uv[b * 2] = (j / o.sSeg) * 6; uv[b * 2 + 1] = (i / o.tSeg) * 2;
        }
      }
      const ind = nv > 65535 ? new Uint32Array(o.tSeg * o.sSeg * 6) : new Uint16Array(o.tSeg * o.sSeg * 6); let k = 0;
      for (let i = 0; i < o.tSeg; i++) for (let j = 0; j < o.sSeg; j++) { const a = i * (o.sSeg + 1) + j, b = a + 1, c = a + o.sSeg + 2, d = a + o.sSeg + 1; ind[k++] = a; ind[k++] = b; ind[k++] = c; ind[k++] = a; ind[k++] = c; ind[k++] = d; }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(new T.BufferAttribute(ind, 1));
      webs.push(faceDown(g));
    }
    return mergeGeos(webs);
  }

  /* vaultRibs(o, xs) — moulded ribs on the cove: one transverse rib rising from every wall column
     (xs = the column offsets along a wall, e.g. [-9,-3,3,9]) plus the four diagonal groin ribs.
     Each rib converges toward the crown exactly as the web does. Tri cost ~ 190/rib. */
  function vaultRibs(o, xs) {
    o = Object.assign({ S: 14, P: 5.5, y0: 8.8, y1: 12.6, steps: 12 }, o || {});
    const parts = [], prof = o.profile || PROFILES.rib;
    const mk = (pf, nf) => { const path = [], ups = []; for (let i = 0; i <= o.steps; i++) { const phi = (1 - i / o.steps) * PI / 2; path.push(pf(phi)); ups.push(nf(phi)); } return sweep(prof, path, { closedProfile: true, mitre: false, up: i => ups[i], uvScale: 0.7 }); };
    for (let side = 0; side < 4; side++) for (const cx of xs) parts.push(mk(
      phi => { const m = coveM(o, phi), p = coveRot(side, [cx * m / o.S, coveYof(o, phi), m]); return V3(p[0], p[1], p[2]); },
      phi => { const n = coveNormal(o, phi, 0, 1), p = coveRot(side, [n.x, n.y, n.z]); return V3(p[0], p[1], p[2]); }));
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) parts.push(mk(
      phi => { const m = coveM(o, phi); return V3(sx * m, coveYof(o, phi), sz * m); },
      phi => coveNormal(o, phi, sx * 0.7071, sz * 0.7071).normalize()));
    return mergeGeos(parts);
  }

  /* groinVault(o) — a true quadripartite bay (the intersection of two barrels, so the groins are
     real creases on the diagonals). Use it for the ambulatory behind the throne, where piers exist
     naturally. Tri cost nu*nv*2 (14*10*2 = 280). */
  function groinVault(o) {
    o = Object.assign({ w: 7, d: 6, y0: 4.6, y1: 8.2, nu: 12, nv: 12 }, o || {});
    const nv = (o.nu + 1) * (o.nv + 1), pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), R = o.y1 - o.y0;
    for (let i = 0; i <= o.nu; i++) for (let j = 0; j <= o.nv; j++) {
      const u = i / o.nu, v = j / o.nv, b = i * (o.nv + 1) + j;
      pos[b * 3] = (u - 0.5) * o.w; pos[b * 3 + 1] = o.y0 + R * Math.min(Math.sin(PI * u), Math.sin(PI * v)); pos[b * 3 + 2] = (v - 0.5) * o.d;
      uv[b * 2] = u * 2; uv[b * 2 + 1] = v * 2;
    }
    const ind = new Uint16Array(o.nu * o.nv * 6); let k = 0;
    for (let i = 0; i < o.nu; i++) for (let j = 0; j < o.nv; j++) { const a = i * (o.nv + 1) + j, b = a + 1, c = a + o.nv + 2, d = a + o.nv + 1; ind[k++] = a; ind[k++] = b; ind[k++] = c; ind[k++] = a; ind[k++] = c; ind[k++] = d; }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(new T.BufferAttribute(ind, 1));
    return faceDown(g);
  }

  /* cofferPanel(size, n, o) — the flat crown of the cove, coffered. Soffit plane with n*n square
     holes, a moulded taper up into each recess and a recessed head. Tri cost ~ 90/coffer. */
  function cofferPanel(size, n, o) {
    o = o || {}; const y = o.y == null ? 0 : o.y, c = size / n, m = o.margin == null ? c * 0.13 : o.margin,
      dep = o.depth == null ? 0.30 : o.depth, h = c / 2 - m, inset = 0.10, parts = [];
    const sh = new T.Shape(); sh.moveTo(-size / 2, -size / 2); sh.lineTo(size / 2, -size / 2); sh.lineTo(size / 2, size / 2); sh.lineTo(-size / 2, size / 2); sh.closePath();
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = (i + 0.5 - n / 2) * c, cz = (j + 0.5 - n / 2) * c, p = new T.Path();
      p.moveTo(cx - h, cz - h); p.lineTo(cx + h, cz - h); p.lineTo(cx + h, cz + h); p.lineTo(cx - h, cz + h); p.closePath(); sh.holes.push(p);
      parts.push(sweep(PROFILES.coffer, [V3(cx - h, y, cz - h), V3(cx + h, y, cz - h), V3(cx + h, y, cz + h), V3(cx - h, y, cz + h)], { closedPath: true, closedProfile: true, up: UPY }));
      parts.push(faceDown(xf(new T.PlaneGeometry(2 * (h - inset), 2 * (h - inset)), { x: cx, y: y + dep, z: cz, rx: PI / 2 })));
      if (o.boss) parts.push(xf(new T.SphereGeometry(o.boss, 10, 8), { x: cx, y: y + dep - o.boss * 0.4, z: cz }));
    }
    parts.push(faceDown(xf(new T.ShapeGeometry(sh), { y: y, rx: PI / 2 })));
    return mergeGeos(parts);
  }

  // -------------------------------------------- 5. arches, pierced walls, windows
  /* archPath(w, h, kind, seg) — outline of an arched opening as [[x,y],...], starting bottom-left,
     sitting on y = 0. kind: 'round' (semicircular head, needs h >= w/2), 'lancet' (two-centred
     gothic), 'segmental' (shallow — fireplaces, doorways) and 'rect' (a plain opening, e.g. the throne arch). */
  function archPath(w, h, kind, seg) {
    seg = seg || 16; const hw = w / 2, out = [];
    if (kind === 'rect') { return [[-hw, 0], [-hw, h], [hw, h], [hw, 0]]; }
    if (kind === 'lancet') {
      const sy = Math.max(0.01, h - w * 0.78), rise = h - sy, R = (hw * hw + rise * rise) / w, cx = R - hw, aEnd = Math.atan2(rise, -cx), left = [];
      for (let i = 0; i <= seg; i++) { const a = PI + (aEnd - PI) * (i / seg); left.push([cx + R * Math.cos(a), sy + R * Math.sin(a)]); }
      out.push([-hw, 0], [-hw, sy]);
      for (const p of left) out.push(p);
      for (let i = left.length - 2; i >= 0; i--) out.push([-left[i][0], left[i][1]]);
      out.push([hw, 0]);
    } else if (kind === 'segmental') {
      const rise = Math.min(h * 0.32, hw * 0.92), R = (rise * rise + hw * hw) / (2 * rise), sy = h - rise, a0 = Math.asin(clamp(hw / R, -1, 1));
      out.push([-hw, 0], [-hw, sy]);
      for (let i = 0; i <= seg; i++) { const a = -a0 + 2 * a0 * (i / seg); out.push([R * Math.sin(a), sy - R * Math.cos(a) + R]); }
      out.push([hw, 0]);
    } else {
      const sy = Math.max(0.01, h - hw);
      out.push([-hw, 0], [-hw, sy]);
      for (let i = 0; i <= seg; i++) { const a = PI - PI * (i / seg); out.push([hw * Math.cos(a), sy + hw * Math.sin(a)]); }
      out.push([hw, 0]);
    }
    return out;
  }
  const archShape = (w, h, kind, seg) => { const s = new T.Shape(); archPath(w, h, kind, seg).forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath(); return s; };

  /* wallPanel(w, h, t, holes) — a wall with REAL holes punched through it. This is the thing that
     stops the wall reading as paper: ExtrudeGeometry triangulates the rectangle minus each arch,
     and the extrusion side-walls become the window jambs. Built in the XY plane facing +Z, inner
     face at z = 0, body running back to z = +t; the panel's bottom edge is y = 0.
     holes: [{x, y, w, h, kind, seg}], y measured from the panel bottom — keep y > 0 so the hole
     never touches the panel boundary. Tri cost ~ 40 + 75 per hole. */
  function wallPanel(w, h, t, holes) {
    const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
    for (const o of holes || []) { const p = new T.Path(); archPath(o.w, o.h, o.kind || 'round', o.seg || 14).forEach((q, i) => { const x = q[0] + o.x, y = q[1] + o.y; i ? p.lineTo(x, y) : p.moveTo(x, y); }); p.closePath(); s.holes.push(p); }
    const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 14, steps: 1 });
    g.translate(0, 0, -t); return g;
  }

  /* reveal(o) — the splayed stone lining of an opening. o.w/o.h are the size of the hole you cut in
     wallPanel; the reveal tapers back and IN by o.splay, so the light (the glass) is
     (w - 2*splay) x (h - splay) — feed those numbers to tracery() and to the glass plane.
     That inward splay is what makes the wall read thick: the jamb catches the window light and
     throws it into the room. Built facing +Z, room face at z = 0, glass plane at z = -depth.
     Use a DoubleSide material (it is a 70-tri ring, the cost is nil). Tri cost ~ 74. */
  const revealLight = o => ({ w: o.w - 2 * o.splay, h: o.h - o.splay, kind: o.kind });
  function reveal(o) {
    o = Object.assign({ w: 2.4, h: 5.2, kind: 'round', splay: 0.3, depth: 0.9, seg: 16 }, o || {});
    const face = archPath(o.w, o.h, o.kind, o.seg), sc = (o.w - 2 * o.splay) / o.w, sy = (o.h - o.splay) / o.h;
    const P = face.length, pos = new Float32Array(P * 2 * 3), uv = new Float32Array(P * 2 * 2);
    for (let i = 0; i < P; i++) {
      pos[i * 6] = face[i][0]; pos[i * 6 + 1] = face[i][1]; pos[i * 6 + 2] = 0;
      pos[i * 6 + 3] = face[i][0] * sc; pos[i * 6 + 4] = face[i][1] * sy; pos[i * 6 + 5] = -o.depth;
      uv[i * 4] = i / P * 3; uv[i * 4 + 1] = 0; uv[i * 4 + 2] = i / P * 3; uv[i * 4 + 3] = 1;
    }
    const ind = new Uint16Array((P - 1) * 6); let k = 0;
    for (let i = 0; i < P - 1; i++) { const a = i * 2, b = a + 1, c = a + 3, d = a + 2; ind[k++] = a; ind[k++] = b; ind[k++] = c; ind[k++] = a; ind[k++] = c; ind[k++] = d; }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(new T.BufferAttribute(ind, 1)); g.computeVertexNormals();
    return g;
  }

  /* tracery(o) — stone mullions, a transom, a sub-arch over each light and an oculus, sitting in the
     plane of the glass. Same material as the window frame. Tri cost ~ 800. */
  function tracery(o) {
    o = Object.assign({ w: 2.4, h: 5.2, kind: 'round', lights: 2, transom: 0.42 }, o || {});
    const parts = [], hw = o.w / 2, spring = o.kind === 'round' ? o.h - hw : o.h - o.w * 0.78, ty = o.h * o.transom, sw = o.w / o.lights;
    for (let i = 1; i < o.lights; i++) { const x = -hw + sw * i; parts.push(sweep(PROFILES.mullion, [V3(x, 0, 0), V3(x, spring, 0)], { closedProfile: true, up: V3(0, 0, 1), mitre: false })); }
    parts.push(sweep(PROFILES.mullion, [V3(-hw, ty, 0), V3(hw, ty, 0)], { closedProfile: true, up: V3(0, 0, 1) }));
    for (let i = 0; i < o.lights; i++) {
      const cx = -hw + sw * (i + 0.5), pts = [];
      for (let j = 0; j <= 10; j++) { const a = PI - PI * (j / 10); pts.push(V3(cx + sw * 0.46 * Math.cos(a), spring + sw * 0.46 * Math.sin(a), 0)); }
      parts.push(sweep(PROFILES.ribSmall, pts, { closedProfile: true, up: V3(0, 0, 1), mitre: false }));
    }
    parts.push(xf(new T.TorusGeometry(Math.max(0.12, o.w * 0.17), 0.055, 6, 20), { y: spring + o.w * 0.30 }));
    return mergeGeos(parts);
  }

  // --------------------------------------------------------- 6. arcade / ambulatory
  /* arcade(o) — a pierced screen of round-headed arches on piers, with impost blocks, a plinth and
     archivolt mouldings. Put it in front of an opening in the wall and the room reads far deeper
     than its back wall. Built in the XY plane facing +Z, standing on y = 0 (plinth below that).
     The arch rise is forced to bayW/2 for 'round' so the head is a true semicircle.
     Tri cost ~ 420 per bay. */
  function arcade(o) {
    o = Object.assign({ bays: 3, bayW: 4.6, pierW: 1.3, depth: 1.0, spring: 4.3, h: 8.0, kind: 'round' }, o || {});
    const total = o.bays * o.bayW + (o.bays + 1) * o.pierW, x0 = -total / 2, plinth = 0.42, parts = [];
    const s = new T.Shape(); s.moveTo(x0, -plinth); s.lineTo(x0 + total, -plinth); s.lineTo(x0 + total, o.h); s.lineTo(x0, o.h); s.closePath();
    const rise = o.kind === 'round' ? o.bayW / 2 : o.bayW * 0.78;
    for (let i = 0; i < o.bays; i++) {
      const cx = x0 + o.pierW + i * (o.bayW + o.pierW) + o.bayW / 2, p = new T.Path();
      archPath(o.bayW, o.spring + rise, o.kind, 14).forEach((q, j) => { const x = q[0] + cx, y = q[1]; j ? p.lineTo(x, y) : p.moveTo(x, y); }); p.closePath(); s.holes.push(p);
      const path = []; for (let j = 0; j <= 14; j++) { const a = PI - PI * (j / 14); path.push(V3(cx + (o.bayW / 2 + 0.07) * Math.cos(a), o.spring + (rise + 0.07) * Math.sin(a), 0)); }
      parts.push(sweep(PROFILES.archivolt, path, { closedProfile: true, up: V3(0, 0, 1), mitre: false }));
    }
    parts.push(xf(new T.ExtrudeGeometry(s, { depth: o.depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, curveSegments: 14, steps: 1 }), { z: -o.depth }));
    for (let i = 0; i <= o.bays; i++) { const px = x0 + i * (o.bayW + o.pierW) + o.pierW / 2; parts.push(xf(roundedBox(o.pierW * 1.3, 0.30, o.depth * 1.3, 0.05, 1), { x: px, y: o.spring + 0.15, z: -o.depth / 2 })); }
    parts.push(xf(roundedBox(total + 0.4, plinth, o.depth * 1.3, 0.05, 1), { y: -plinth / 2, z: -o.depth / 2 }));
    return mergeGeos(parts);
  }

  /* ambulatory(o) — the lit space you see THROUGH the arcade: floor, two side walls and a groin-
     vaulted ceiling, running from the arcade plane toward -Z. Tri cost ~ 700.
     Light it with one warm PointLight at (0, 2.6, -depth*0.55) and put a Basic-material plane at
     the far end so it reads as daylight beyond. */
  function ambulatory(o) {
    o = Object.assign({ w: 18, depth: 9, floorY: 0, y0: 4.6, y1: 8.2, bays: 2 }, o || {});
    const parts = [], bd = o.depth / o.bays, wh = o.y0 - o.floorY + 2;
    parts.push(xf(new T.PlaneGeometry(o.w, o.depth), { y: o.floorY, z: -o.depth / 2, rx: -PI / 2 }));
    for (const s of [-1, 1]) parts.push(xf(new T.PlaneGeometry(o.depth, wh), { x: s * o.w / 2, y: o.floorY + wh / 2, z: -o.depth / 2, ry: -s * PI / 2 }));
    for (let i = 0; i < o.bays; i++) parts.push(xf(groinVault({ w: o.w, d: bd, y0: o.y0, y1: o.y1, nu: 14, nv: 10 }), { z: -bd * (i + 0.5) }));
    return mergeGeos(parts);
  }

  // -------------------------------------------------------------------- 7. fireplace
  /* fireplace(o) — a carved stone surround: one pierced slab (so jambs and lintel are a single
     stone), a segmental-arched opening, corbel mouldings, a heavy moulded mantel shelf mitred round
     its returns, a tapering overmantel hood and a heraldic shield in relief.
     Built in the XY plane facing +Z with its back at z = 0, standing on y = 0. Tri cost ~ 1,800. */
  function fireplace(o) {
    o = Object.assign({ w: 6.4, proj: 1.05, openW: 3.4, openH: 2.9, shelfY: 3.3, hoodTop: 8.6, crest: true }, o || {});
    const parts = [], hw = o.w / 2, ow = o.openW / 2, curb = 0.34;
    const s = new T.Shape(); s.moveTo(-hw, -curb); s.lineTo(hw, -curb); s.lineTo(hw, o.shelfY); s.lineTo(-hw, o.shelfY); s.closePath();
    const hole = new T.Path(); archPath(o.openW, o.openH, 'segmental', 14).forEach((q, i) => (i ? hole.lineTo(q[0], q[1]) : hole.moveTo(q[0], q[1]))); hole.closePath(); s.holes.push(hole);
    parts.push(new T.ExtrudeGeometry(s, { depth: o.proj, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 1, curveSegments: 14, steps: 1 }));
    for (const sg of [-1, 1]) { // corbel band on each jamb
      const cx = sg * (ow + (hw - ow) / 2), jw = (hw - ow) * 0.92, y = o.openH + 0.22;
      parts.push(sweep(PROFILES.chairRail, [V3(cx - jw / 2, y, 0), V3(cx - jw / 2, y, o.proj + 0.05), V3(cx + jw / 2, y, o.proj + 0.05), V3(cx + jw / 2, y, 0)], { closedProfile: true, up: UPY }));
    }
    const pj = o.proj + 0.26; // mantel shelf, mitred round the returns
    parts.push(sweep(scaleProfile(PROFILES.cornice, 1.0, 0.58), [V3(-hw - 0.22, o.shelfY, 0), V3(-hw - 0.22, o.shelfY, pj), V3(hw + 0.22, o.shelfY, pj), V3(hw + 0.22, o.shelfY, 0)], { closedProfile: true, up: UPY }));
    const ht = o.hoodTop - (o.shelfY + 0.62); // overmantel hood, tapering back into the wall
    const sh = new T.Shape(); sh.moveTo(-o.w * 0.40, 0); sh.lineTo(o.w * 0.40, 0); sh.lineTo(o.w * 0.21, ht); sh.lineTo(-o.w * 0.21, ht); sh.closePath();
    parts.push(xf(new T.ExtrudeGeometry(sh, { depth: o.proj * 0.62, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 1, steps: 1 }), { y: o.shelfY + 0.62 }));
    if (o.crest) {
      const sd = new T.Shape(); sd.moveTo(-0.52, 0.72); sd.lineTo(0.52, 0.72); sd.lineTo(0.52, 0.08);
      sd.quadraticCurveTo(0.52, -0.52, 0, -0.80); sd.quadraticCurveTo(-0.52, -0.52, -0.52, 0.08); sd.closePath();
      parts.push(xf(new T.ExtrudeGeometry(sd, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 10, steps: 1 }), { y: o.shelfY + 2.1, z: o.proj * 0.62 }));
    }
    return mergeGeos(parts);
  }

  /* fireBox(o) — the dark recess behind the opening: five inward-facing planes running back to
     z = -depth. Near-black rough material; put the existing flame spheres just inside its mouth. */
  function fireBox(o) {
    o = Object.assign({ w: 3.4, h: 2.9, d: 1.8 }, o || {});
    const parts = [xf(new T.PlaneGeometry(o.w, o.h), { y: o.h / 2, z: -o.d }), xf(new T.PlaneGeometry(o.w, o.d), { y: 0, z: -o.d / 2, rx: -PI / 2 }), xf(new T.PlaneGeometry(o.w, o.d), { y: o.h, z: -o.d / 2, rx: PI / 2 })];
    for (const s of [-1, 1]) parts.push(xf(new T.PlaneGeometry(o.d, o.h), { x: s * o.w / 2, y: o.h / 2, z: -o.d / 2, ry: -s * PI / 2 }));
    return mergeGeos(parts);
  }

  window.KQArch = {
    mergeGeos, xf, weld, tri, flipFaces, faceDown, V3, PROFILES, scaleProfile, flipProfileU,
    roundedBox, rbox, sweep, prepProfile, mouldingLoop, mouldingRun,
    flutedShaft, capital, columnBase, column, latheGeo,
    coveVault, coveM, coveYof, coveNormal, vaultRibs, groinVault, cofferPanel,
    archPath, archShape, wallPanel, reveal, revealLight, tracery,
    arcade, ambulatory, fireplace, fireBox
  };
})();
