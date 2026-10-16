/* Kingdom Quest — the realms beyond the meadow each have their OWN games (Yoni 2026-09-23: "every world needs its own specific
   games with its own specific themes … it can't be the same thing, otherwise it's boring"). The meadow keeps the classic worlds;
   the Sky Isles, the Cloud Kingdom, the Sky Ocean, the Pirate Cove and the Skull Catacombs each bring four games of their own —
   math, reading, writing and logic — played in a themed 3D hall with a game mechanic that exists nowhere else.

   Each realm lives in its own file (realm-pirate.js, realm-skull.js …) and registers itself here:
     KQRealms.define(realm, {
       games:     [{ id, kind: 'math'|'reading'|'spelling'|'logic', stage, theme, host, icon, at: [x, z], labelH }],
       strings:   { en: {…}, he: {…} }                 names (id), map taglines (id + '_b'), greetings (id + '_hi'),
                                                       how-to lines (id + '_how'), the host's question line (id + '_q')
       gens:      { [gameId](band, lang, H) → { q, a, ch, icon? } }   the themed questions, 6 age bands, EN + HE
       themes:    { [themeId]: { palette, look, props(ctx) } }         the 3D hall (rooms3d.js)
       stages:    { [stageId](ctx) → { frame, build, present, resolve, hostAt? } }   the mechanic (rooms3d.js)
       landmarks(kctx)                                                 the places on the realm's map (kingdom3d.js)
     })
   Room3D, Kingdom3D and the hub read the registry at run time. */
(function () {
  'use strict';
  const reg = { realms: {}, games: {}, themes: {}, stages: {}, marks: {} }, recent = {};

  /* ---------- helpers for the question makers ---------- */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = a => a.filter((v, i) => a.findIndex(w => String(w) === String(v)) === i);
  /* n numeric choices around a (never negative unless a is), spaced by step */
  const near = (a, n, step) => { const st = [a]; let g = 0; step = step || 1; while (st.length < (n || 4) && g++ < 120) { const c = a + ri(-4, 4) * step; if ((c >= 0 || a < 0) && !st.includes(c)) st.push(c); } return shuffle(st); };
  /* the right answer plus 3 distractors drawn from a pool */
  const mc = (a, pool, n) => shuffle(uniq([a].concat(shuffle(pool.filter(x => String(x) !== String(a))).slice(0, (n || 4) - 1))));
  /* pick by band: rows is an array of [minBand, value] — the value for the highest minBand ≤ band */
  const byBand = (band, rows) => { let v = rows[0][1]; for (const [b, x] of rows) if (band >= b) v = x; return v; };
  /* Hebrew final letters: the right form for each position; and misspellings the way children really make them */
  const FIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' }, UNFIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  const heNorm = w => w.split(' ').map(p => p.split('').map((c, i, a) => i === a.length - 1 ? (FIN[c] || c) : (UNFIN[c] || c)).join('')).join(' ');
  const HE_SUB = { 'א': 'ע', 'ע': 'א', 'ט': 'ת', 'ת': 'ט', 'כ': 'ח', 'ח': 'כ', 'ק': 'כ', 'ס': 'ש', 'ש': 'ס', 'ב': 'ו', 'ו': 'ב' };
  /* a made-up misspelling must never land on a rude word or a slur (2026-09-26: 'shirt' minus the r, 'flag' minus the l) — whole-word check, EN + HE */
  /* the words are kept only as codes (FNV-1a), so no rude word is readable in the files (2026-10-11: public sharing review) */
  const kqHash = s => { let x = 0x811c9dc5; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(36); };
  const RUDE = new Set(["1aphvlf","o3bj36","1ry26ve","l0zz4","ykn8e7","s31e38","1npkzk5","1051mqh","1oydxjx","7w40km","dzx596","16yqbm2","1esczzy","vy81mf","5pekq6","13d1t87","14h9oi0","1mb5nmv","u74m7v","1fhzz46","14fkbtf","zwanhs","ngd4e0","1frp2cz","1wqvgzk","susqjs","11jflq4","zk9ty6","19o6l49","1y9t1r4","1kp0e4d","ysn4c2","1afm2y0","1ddoja5","6ichpm","15fvo3p","ly0h5g","1jpkpg0","yy78ri","5wga14","157bpup","6u4ocd","19mj789","5kl94a","1p1uv49","1wfnhou","1x6y0cl","1v7p2w2","z4446r","1ob5fz3","10xihbf","1g4wmwe","1aa0xqj","1fcbu2d","m93o71","4obcx0","eccv2g","n40ug1","1dnuahd","vi8muy","18f92hz","jvcm71","1s7rita","1493awo","igg2zb","1iefmcy","1s79mkp","16jvtnq","u0rr2z","127px9j","1tjv1hh","tacpfo","56hdt9","e5tr2s","x4koik","1sj5pzy","1lc5uyd","32xo37","1mjcvd4","vyevkk","s2hnfn","145i078"]);
  const rude = m => m.toLowerCase().split(/\s+/).some(p => RUDE.has(kqHash(p)) || RUDE.has(kqHash(heNorm(p))));
  function misspell(w, he, n) { const out = new Set(); let g = 0; n = n || 3;
    while (out.size < n && g++ < 300) { const k = Math.random(), i = ri(0, Math.max(0, w.length - 2)); let m;
      if (he) { const base = w.split('').map(c => UNFIN[c] || c), j = ri(0, base.length - 1);
        if (k < 0.5 && HE_SUB[base[j]]) { base[j] = HE_SUB[base[j]]; m = base.join(''); }
        else if (k < 0.75) { const pos = ri(1, base.length - 1); if (base[pos] === ' ' || base[pos - 1] === ' ') continue; base.splice(pos, 0, pick(['ו', 'י'])); m = base.join(''); }
        else { const vi = base.findIndex((c, q) => q > 0 && (c === 'ו' || c === 'י')); if (vi < 0) continue; base.splice(vi, 1); m = base.join(''); }
        m = heNorm(m); }
      else { if (k < 0.3) m = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); else if (k < 0.5) { const d = Math.max(1, i); m = w.slice(0, d) + w.slice(d + 1); } else if (k < 0.65) m = w.slice(0, i) + w[i] + w.slice(i); else { const V = { a: 'e', e: 'i', i: 'e', o: 'u', u: 'o', c: 'k', k: 'c', s: 'z' }, idx = [...w].map((c, q) => V[c] ? q : -1).filter(q => q >= 0); if (!idx.length) continue; const q = pick(idx); m = w.slice(0, q) + V[w[q]] + w.slice(q + 1); } }
      if (m && m !== w && m.trim().length >= 2 && !rude(m)) out.add(m); }
    return [...out]; }
  const H = { ri, pick, shuffle, uniq, near, mc, byBand, misspell, heNorm, rude, unfin: c => UNFIN[c] || c };
  /* ---------- 3D helpers for realm scenery: merge many parts into one vertex-coloured geometry (one draw call) ---------- */
  const G3 = {
    M4(T, x, y, z, rx, ry, rz, sx, sy, sz) { return new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx || 1, sy || sx || 1, sz || sx || 1)); },
    merge(T, parts) { let n = 0; const list = []; for (const p of parts) { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); if (p.m) g.applyMatrix4(p.m); if (!g.attributes.normal) g.computeVertexNormals(); list.push({ g, c: new T.Color(p.c) }); n += g.attributes.position.count; } const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0; for (const { g, c } of list) { const k = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); for (let i = 0; i < k; i++) { C[(o + i) * 3] = c.r; C[(o + i) * 3 + 1] = c.g; C[(o + i) * 3 + 2] = c.b; } o += k; g.dispose(); } const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(P, 3)); out.setAttribute('normal', new T.BufferAttribute(N, 3)); out.setAttribute('color', new T.BufferAttribute(C, 3)); out.computeBoundingSphere(); return out; }
  };

  /* ---------- the scenery kit: every realm-*.js dresses its map with the same tools (kingdom3d.js hands over k) ---------- */
  function kit(k) {
    const { T, scene, height, R32, fx } = k, PI = Math.PI, TAU = PI * 2;
    const R = (a, b) => a + R32() * (b - a), M = (x, y, z, rx, ry, rz, sx, sy, sz) => G3.M4(T, x, y, z, rx, ry, rz, sx, sy, sz), merge = parts => G3.merge(T, parts);
    const VC = o => new T.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 0.85 }, o || {}));
    const glowMat = (c, e, i) => new T.MeshStandardMaterial({ color: c, emissive: e == null ? c : e, emissiveIntensity: i == null ? 2.4 : i });
    const GT = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv); })();
    const BOX = new T.BoxGeometry(1, 1, 1), CYL = new T.CylinderGeometry(0.5, 0.5, 1, 14), CYL6 = new T.CylinderGeometry(0.5, 0.5, 1, 6), SPH = new T.SphereGeometry(0.5, 12, 8), ROCK = new T.DodecahedronGeometry(0.5, 0), CONE = new T.ConeGeometry(0.5, 1, 14), CONE4 = new T.ConeGeometry(0.5, 1, 4); CONE4.rotateY(PI / 4);
    const UP = new T.Vector3(0, 1, 0);
    /* the lowest ground under a footprint, so nothing floats on a slope */
    const low = (x, z, r) => { let h = height(x, z); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; h = Math.min(h, height(x + Math.cos(a) * r, z + Math.sin(a) * r)); } return h; };
    /* merge a part list into one mesh (one draw call) and stand it on the ground */
    const put = (parts, mat, x, z, ry, sink, r) => { const m = new T.Mesh(merge(parts), mat); m.position.set(x, low(x, z, r || 2) - (sink || 0), z); m.rotation.y = ry || 0; m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
    /* parts already placed in world coordinates */
    const putWorld = (parts, mat) => { const m = new T.Mesh(merge(parts), mat); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
    const beam = (P, a, b, r, c, geo) => { const A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), L = d.length(); P.push({ g: geo || CYL6, m: new T.Matrix4().compose(A.add(B).multiplyScalar(0.5), new T.Quaternion().setFromUnitVectors(UP, d.normalize()), new T.Vector3(r * 2, L, r * 2)), c }); };
    const bx = (P, x, y, z, w, h, d, c, ry) => P.push({ g: BOX, m: M(x, y, z, 0, ry || 0, 0, w, h, d), c });
    const barrel = (P, x, y, z, s, lying) => { const lg = new T.LatheGeometry([[0.001, -0.55], [0.36, -0.55], [0.44, -0.3], [0.47, 0], [0.44, 0.3], [0.36, 0.55], [0.001, 0.55]].map(p => new T.Vector2(p[0], p[1])), 14); const rx = lying ? PI / 2 : 0; P.push({ g: lg, m: M(x, y, z, rx, R(0, 3), 0, s, s, s), c: 0x7a5230 }); for (const hy of [-0.36, 0.36]) P.push({ g: new T.TorusGeometry(0.45, 0.035, 4, 18), m: new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, 0, 0)), new T.Vector3(s, s, s)).multiply(M(0, hy, 0, PI / 2)), c: 0x2e2a26 }); };
    const crate = (P, x, y, z, s, ry) => { bx(P, x, y + s / 2, z, s, s, s, 0x8a6a40, ry); const c = Math.cos(ry || 0), sn = Math.sin(ry || 0); for (const sd of [-1, 1]) P.push({ g: BOX, m: new T.Matrix4().compose(new T.Vector3(x + sd * (s / 2 + 0.01) * sn, y + s / 2, z + sd * (s / 2 + 0.01) * c), new T.Quaternion().setFromEuler(new T.Euler(0, ry || 0, 0)), new T.Vector3(1, 1, 1)).multiply(M(0, 0, 0, 0, 0, 0.78, s * 1.3, s * 0.16, 0.04)), c: 0x5a4028 }); };
    /* a flag that ripples (tex = a material with the flag's picture) */
    const flag = (parent, x, y, z, w, h, mat) => { const g = new T.PlaneGeometry(w, h, 8, 1), p = g.attributes.position, base = Float32Array.from(p.array); const f = new T.Mesh(g, mat); f.position.set(x + w / 2, y, z); parent.add(f); fx((dt, tm) => { for (let i = 0; i < p.count; i++) { const u = (base[i * 3] + w / 2) / w; p.setZ(i, Math.sin(u * 5 - tm * 5 + x) * 0.16 * u); } p.needsUpdate = true; }); return f; };
    /* torches: a pole and a flickering flame (sprites; the few real lights are kept for the big pieces) */
    const torchP = [], flames = [], fm = {};
    const torch = (x, z, col, pole) => { const y = height(x, z), c = col || 0xffa040; if (!fm[c]) fm[c] = [new T.SpriteMaterial({ map: GT, color: c, transparent: true, blending: T.AdditiveBlending, depthWrite: false }), new T.SpriteMaterial({ map: GT, color: c, transparent: true, opacity: 0.32, blending: T.AdditiveBlending, depthWrite: false })];
      beam(torchP, [x, y - 0.3, z], [x, y + 2.1, z], 0.07, pole || 0xa8905a); torchP.push({ g: CONE, m: M(x, y + 2.2, z, PI, 0, 0, 0.36, 0.35, 0.36), c: 0x3a2a1a }); const f = new T.Sprite(fm[c][0]); f.position.set(x, y + 2.55, z); f.scale.set(0.55, 0.85, 1); scene.add(f); const h = new T.Sprite(fm[c][1]); h.position.set(x, y + 2.5, z); h.scale.setScalar(2.4); scene.add(h); flames.push(f); };
    /* a soft glow sprite (halo round a lamp, a wisp, a fire) */
    const halo = (parent, c, s, x, y, z, op) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: GT, color: c, transparent: true, opacity: op == null ? 0.8 : op, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(s); sp.position.set(x, y, z); (parent || scene).add(sp); return sp; };
    /* call once at the end: merges every torch pole into one mesh and starts the flicker */
    const finish = mat => { if (torchP.length) { const tm = new T.Mesh(merge(torchP), mat || VC()); tm.castShadow = true; scene.add(tm); } fx((dt, t) => { flames.forEach((f, i) => { const s = 0.85 + 0.25 * Math.sin(t * 13 + i * 1.7) * Math.sin(t * 7.1 + i); f.scale.set(0.55 * s, 0.9 * s, 1); }); }); };
    return { R, M, VC, merge, glowMat, GT, BOX, CYL, CYL6, SPH, ROCK, CONE, CONE4, low, put, putWorld, beam, bx, barrel, crate, flag, torch, halo, finish };
  }

  /* ---------- hall helpers for the realm rooms (rooms3d ctx c) ---------- */
  const hall = {
    canvasTex(T, w, h, paint, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; },
    /* an open sky dome with an optional star field (the room's own background is a flat colour) */
    skyDome(c, top, hor, stars, starCol) { const { T, scene } = c; const m = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new T.Color(top) }, hor: { value: new T.Color(hor) } }, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(hor, top, smoothstep(-0.02, 0.5, h)), 1.0); }' }); const d = new T.Mesh(new T.SphereGeometry(90, 32, 16), m); scene.add(d);
      if (stars) { const g = new T.BufferGeometry(), p = []; for (let i = 0; i < (stars === true ? 600 : stars); i++) { const a = Math.random() * Math.PI * 2, e = 0.08 + Math.random() * 1.2, r = 85; p.push(r * Math.cos(e) * Math.cos(a), r * Math.sin(e), r * Math.cos(e) * Math.sin(a)); } g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); scene.add(new T.Points(g, new T.PointsMaterial({ color: starCol || 0xffffff, size: 0.35, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.9 }))); } return d; },
    /* a flat ground disc that fades into the fog (outdoor halls with noFloor) */
    ground(c, col, r, tex) { const { T, scene } = c; const m = new T.Mesh(new T.CircleGeometry(r || 60, 48), new T.MeshStandardMaterial({ color: col, roughness: 1, map: tex || null })); m.rotation.x = -Math.PI / 2; m.position.y = -0.01; m.receiveShadow = true; scene.add(m); return m; }
  };

  function define(realm, def) {
    reg.realms[realm] = def;
    for (const g of def.games || []) reg.games[g.id] = Object.assign({ realm }, g);
    Object.assign(reg.themes, def.themes || {}); Object.assign(reg.stages, def.stages || {});
    if (def.landmarks) reg.marks[realm] = def.landmarks; if (def.scenery) reg.scenery = Object.assign(reg.scenery || {}, { [realm]: def.scenery });
    if (def.strings && window.KQ && KQ.i18n && KQ.i18n.extend) KQ.i18n.extend(def.strings);
  }
  window.KQRealms = {
    define, H, G3, kit, hall,
    scenery(realm, kctx) { const f = reg.scenery && reg.scenery[realm]; if (f) f(kctx); },
    games: realm => Object.values(reg.games).filter(g => g.realm === realm),
    game: id => reg.games[id] || null,
    theme: id => reg.themes[id] || null,
    stage: id => reg.stages[id] || null,
    landmarks(realm, kctx) { const f = reg.marks[realm]; if (!f) return false; f(kctx); return true; },
    /* no repeats inside a run (2026-09-26: the same question came twice in a row): remember the last twelve per game and draw again;
       when a small pool has shown everything lately, take the one seen longest ago */
    question(id, band) { const g = reg.games[id], d = g && reg.realms[g.realm], f = d && d.gens && d.gens[id]; if (!f) return null; const lang = (window.KQ && KQ.i18n && KQ.i18n.lang) || 'en', b = Math.max(1, Math.min(6, band || 2));
      const seen = recent[id + ':' + lang + ':' + b] = recent[id + ':' + lang + ':' + b] || []; let q = null, key = '', age = 1e9;
      for (let t = 0; t < 16; t++) { const c = f(b, lang, H); if (!c) break; const k = c.q + '|' + c.a, at = seen.lastIndexOf(k); if (at < 0) { q = c; key = k; break; } if (at < age) { age = at; q = c; key = k; } }
      if (q) { const i = seen.indexOf(key); if (i >= 0) seen.splice(i, 1); seen.push(key); if (seen.length > 12) seen.shift(); q.ch = q.ch.map(String); } return q; }
  };
})();
