/* Kingdom Quest — the 3D kingdom map on the hub (Three.js r160 UMD, same build the chess hall uses).
   A meadow with rolling hills; the kid's castle grows on the central mound (10 stages); every world is a building
   you can tap; signposts mark the worlds still to come. Time of day follows the real clock. */
(function () {
  'use strict';
  const T = window.THREE;
  const K3D_BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^/]*$/, '') : 'shared/';   /* where this file lives: the landmark models sit next to it */
/* ============================================================================
   KINGDOM DIORAMA KIT — CORRECTED  (three.js r160 core UMD only, no addons, no assets)
   Paste inside the existing IIFE of /Users/yonieyal/kingdom-quest/shared/kingdom3d.js
   (so `const T = window.THREE;` is in scope), above `const create = (container, opts) => {`.
   Verified: `node --check` clean; no import/require/fetch; only core r160 symbols.
   FIX n: markers below cite the defect each block repairs.
   ============================================================================ */

/* ---------------------------------------------------------------- 0. utils */
let R32 = null;
function seedRandom(s) { R32 = (x => () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296)(s >>> 0); }
/* the richer meadow (Yoni 2026-10-08, built toward his Midjourney pictures; made the default the same evening: "1"). On for the meadow
   unless this device chose today's look (Parents switch → localStorage kq_look 'today'), or #today / ?look=today for the tab. The realms
   keep their own look until they are checked with it. RICH_PREF is the choice; RICH is set in create() once the realm is known */
const RICH_PREF = (() => { try { const h = location.hash, q = new URLSearchParams(location.search).get('look');
  if (h === '#rich' || q === 'rich') { try { sessionStorage.setItem('kq_look', 'rich'); } catch (e) {} return true; }
  if (h === '#today' || q === 'today') { try { sessionStorage.setItem('kq_look', 'today'); } catch (e) {} return false; }
  try { const ss = sessionStorage.getItem('kq_look'); if (ss === 'rich') return true; if (ss === 'today') return false; } catch (e) {}
  try { return localStorage.getItem('kq_look') !== 'today'; } catch (e) { return true; } } catch (e) { return true; } })();
let RICH = false;
const RICH_GRASS_BOOST = 1.35;   /* the painted grass is brightened to the drawn grass's average when it is made */
/* the 3D landmark models round (2026-10-08/09: Hunyuan models for every place, landmark trees, painted ground, tree clearings, the camera
   moved forward). Put aside by Yoni 2026-10-09: "Everything is super slow. The models pop up after I load. And it's not any better".
   Off = the meadow as it was before any model. The packed files are no longer published: they wait in art-src/landmark-packs (move them
   back to shared/models to try again); the source models are in art-src/places */
const LANDMARK_MODELS = false;
/* a viewer may hand the #word over after the page has started: switching then means one reload */
try { addEventListener('hashchange', () => { const h = location.hash; if ((h === '#rich') !== RICH_PREF && (h === '#rich' || h === '#today')) { try { sessionStorage.setItem('kq_look', h === '#rich' ? 'rich' : 'today'); } catch (e) {} location.reload(); } }); } catch (e) {}
seedRandom(20260917);
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const H2 = (x, y) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = H2(xi, yi), b = H2(xi + 1, yi), c = H2(xi, yi + 1), d = H2(xi + 1, yi + 1); return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v; };
const fbm = (x, y, o) => { let s = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < (o || 4); i++) { s += a * vn(x * f, y * f); t += a; a *= 0.5; f *= 2.03; } return s / t; };
const xf = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz));

/* FIX 17: every generated texture registers here so destroy() can actually free it. */
const DISPOSE = [];
const keep = t => { DISPOSE.push(t); return t; };
function disposeDiorama() { for (const t of DISPOSE) { try { t.dispose(); } catch (e) {} } DISPOSE.length = 0; }

/* merge parts into ONE non-indexed geometry with baked vertex colours.
   BufferGeometryUtils is an addon and is NOT in the core UMD build.
   parts: [{ g:BufferGeometry, m?:Matrix4, c?:Color }] */
function mergeGeos(parts) {
  const list = []; let n = 0;
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    if (!g.attributes.normal) g.computeVertexNormals();          // normals BEFORE the matrix
    if (p.m) g.applyMatrix4(p.m);
    const cnt = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new T.BufferAttribute(new Float32Array(cnt * 2), 2));
    list.push({ g, c: p.c || null }); n += cnt;
  }
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), C = new Float32Array(n * 3);
  let o = 0;
  for (const { g, c } of list) {
    const cnt = g.attributes.position.count;
    P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); U.set(g.attributes.uv.array, o * 2);
    for (let i = 0; i < cnt; i++) { C[(o + i) * 3] = c ? c.r : 1; C[(o + i) * 3 + 1] = c ? c.g : 1; C[(o + i) * 3 + 2] = c ? c.b : 1; }
    o += cnt; g.dispose();
  }
  const out = new T.BufferGeometry();
  out.setAttribute('position', new T.BufferAttribute(P, 3));
  out.setAttribute('normal', new T.BufferAttribute(N, 3));
  out.setAttribute('uv', new T.BufferAttribute(U, 2));
  out.setAttribute('color', new T.BufferAttribute(C, 3));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}

/* FIX 8: the draw-call fix the draft CLAIMED but never delivered. The kit only ever
   touched trees + river + roads; the ~400-mesh castle and ~150 plot meshes were left
   alone, so "110 draw calls" was never reachable. This collapses every static
   single-material Mesh under `root` into one Mesh per material. Apply it to each
   castle stage Group and each plot Group and the real count lands near ~230 draws
   including the shadow pass. Skips anything frame() animates, non-Mesh (Sprite/Points/
   Light), and multi-material. Returns the number of draw calls removed. */
const ANIM_KEYS = ['fire', 'spark', 'orbit', 'spin', 'smoke', 'bee', 'mill', 'bob', 'plot'];
function mergeByMaterial(root, opts) {
  opts = opts || {};
  const groups = new Map(), victims = [];
  root.updateMatrixWorld(true);
  const inv = new T.Matrix4().copy(root.matrixWorld).invert(), local = new T.Matrix4();
  root.traverse(o => {
    if (!o.isMesh || o === root) return;
    if (Array.isArray(o.material) || !o.material) return;
    if (o.material.transparent && !opts.mergeTransparent) return;
    for (const k of ANIM_KEYS) if (o.userData && o.userData[k] != null) return;
    if (o.userData && o.userData.noMerge) return;
    local.multiplyMatrices(inv, o.matrixWorld);
    let e = groups.get(o.material.uuid);
    if (!e) { e = { mat: o.material, parts: [], cs: false, rs: false }; groups.set(o.material.uuid, e); }
    e.parts.push({ g: o.geometry, m: local.clone() });
    e.cs = e.cs || o.castShadow; e.rs = e.rs || o.receiveShadow;
    victims.push(o);
  });
  if (victims.length < 2) return 0;
  for (const o of victims) o.removeFromParent();
  let made = 0;
  for (const e of groups.values()) {
    const g = mergeGeos(e.parts);
    const m = new T.Mesh(g, e.mat);
    m.castShadow = e.cs; m.receiveShadow = e.rs;
    if (opts.tagPlot) m.userData.plot = opts.tagPlot;
    root.add(m); made++;
  }
  return victims.length - made;
}

function bakeLeafAO(geo, yTop, yBot, strength) {
  const c = geo.attributes.color, nA = geo.attributes.normal, p = geo.attributes.position;
  for (let i = 0; i < c.count; i++) {
    const ny = nA.getY(i), y = p.getY(i);
    const up = 0.55 + 0.45 * (ny * 0.5 + 0.5);
    const dep = 0.62 + 0.38 * ss(yBot, yTop, y);
    const k = 1 - (1 - up * dep) * (strength == null ? 1 : strength);
    c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
  }
  c.needsUpdate = true;
}

/* tileable value-noise field (wraps exactly — reuse for clouds + water) */
function tileNoise(size, cells, oct, seed) {
  const out = new Float32Array(size * size); let amp = 1, g = cells, tot = 0;
  for (let o = 0; o < oct; o++) {
    const grid = new Float32Array(g * g); for (let i = 0; i < grid.length; i++) grid[i] = H2(i + seed * 7919, o * 131 + seed);
    for (let y = 0; y < size; y++) {
      const fy = y / size * g, y0 = Math.floor(fy), ty = (fy - y0) * (fy - y0) * (3 - 2 * (fy - y0)), ya = y0 % g, yb = (y0 + 1) % g;
      for (let x = 0; x < size; x++) {
        const fx = x / size * g, x0 = Math.floor(fx), tx = (fx - x0) * (fx - x0) * (3 - 2 * (fx - x0)), xa = x0 % g, xb = (x0 + 1) % g;
        const a = grid[ya * g + xa], b = grid[ya * g + xb], c2 = grid[yb * g + xa], d = grid[yb * g + xb];
        out[y * size + x] += amp * ((a + (b - a) * tx) * (1 - ty) + (c2 + (d - c2) * tx) * ty);
      }
    }
    tot += amp; amp *= 0.5; g *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

/* ------------------------------------------------------------- a skull, merged into one vertex-coloured geometry */
let SKULL_GEO = null;
function skullGeo() {
  if (SKULL_GEO) return SKULL_GEO; const bone = new T.Color(0xefe6d2), dark = new T.Color(0x140c08), parts = [];
  const cr = new T.SphereGeometry(0.5, 22, 16); parts.push({ g: cr, m: xf(0, 0.12, -0.02, 0, 0, 0, 1, 0.95, 1.08), c: bone });
  parts.push({ g: new T.CylinderGeometry(0.31, 0.25, 0.3, 18), m: xf(0, -0.24, 0.12), c: bone });
  for (const s of [-1, 1]) { parts.push({ g: new T.SphereGeometry(0.14, 14, 10), m: xf(s * 0.18, 0.05, 0.43, 0, 0, 0, 1, 1.15, 0.55), c: dark }); parts.push({ g: new T.SphereGeometry(0.12, 12, 8), m: xf(s * 0.34, -0.14, 0.22, 0, 0, 0, 0.8, 0.7, 0.9), c: bone }); }
  parts.push({ g: new T.ConeGeometry(0.06, 0.13, 3), m: xf(0, -0.1, 0.49, Math.PI, 0, 0), c: dark });
  for (let i = 0; i < 6; i++) parts.push({ g: new T.BoxGeometry(0.05, 0.08, 0.05), m: xf(-0.14 + i * 0.056, -0.27, 0.36), c: new T.Color(0xf6efdf) });
  SKULL_GEO = mergeGeos(parts); return SKULL_GEO;
}
function skullMesh(mat) { const m = new T.Mesh(skullGeo(), mat || new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 })); m.castShadow = true; m.userData.noMerge = true; return m; }

/* ------------------------------------------------------------- 1. TERRAIN  */
let WORLD = 130; const WATER_Y = -0.55; let RIM_MODE = 'rise', GROUND_STYLE = 'meadow';
let SPR = 1, CAMR = 1;   /* the spread of this map (the meadow's MEADOW_SPREAD, 1 in the realms) and how far the camera stands back for it: setSpread() below */
const GROUND_PAL = { space: { base: '#8c8a92', blobs: ['#7a7880', '#9a98a0', '#6e6c74', '#a8a6ae', '#5e5c64', '#b4b2ba'], dark: 'rgba(16,16,24,0.36)', light: 'rgba(236,236,246,0.2)', sand: 0x76747c }, meadow: { base: '#75ad52', blobs: ['#5f9e3e', '#7dbb56', '#68a846', '#8cc563', '#4f8a33', '#94b06a'], dark: 'rgba(38,74,28,0.30)', light: 'rgba(206,238,156,0.22)', sand: 0xcfc09a }, sky: { base: '#84c45c', blobs: ['#6fb84a', '#8fd06a', '#7cc45a', '#a2dc78', '#5fa640', '#a8c87a'], dark: 'rgba(40,90,30,0.30)', light: 'rgba(220,255,180,0.25)', sand: 0xe8e0c0 }, cloud: { base: '#f4eef8', blobs: ['#ffe4f2', '#e8e0ff', '#fff6fb', '#f0e6ff', '#ffd8ec', '#ffffff'], dark: 'rgba(200,170,220,0.22)', light: 'rgba(255,255,255,0.35)', sand: 0xfff0f8 }, ocean: { base: '#c9b98a', blobs: ['#b8a878', '#d8c898', '#c0b080', '#e0d0a0', '#a89868', '#d0c090'], dark: 'rgba(90,80,50,0.28)', light: 'rgba(255,245,210,0.25)', sand: 0xd8c8a0 }, pirate: { base: '#8e7a56', blobs: ['#7a6848', '#a08a62', '#6a5a40', '#b09a70', '#5a4c36', '#9a8660'], dark: 'rgba(30,20,12,0.32)', light: 'rgba(240,220,170,0.22)', sand: 0xc8b48a }, fashion: { base: '#a6d49e', blobs: ['#98cc90', '#b2dca8', '#c4e4b6', '#8cc486', '#f0d4e2', '#e8c6da'], dark: 'rgba(60,96,60,0.24)', light: 'rgba(255,240,250,0.3)', sand: 0xf2e6d8 }, sports: { base: '#6cbc4e', blobs: ['#5cae40', '#78c858', '#66b84a', '#86d466', '#4e9e36', '#9ccc6e'], dark: 'rgba(34,84,26,0.28)', light: 'rgba(230,255,190,0.24)', sand: 0xe8d8b0 }, skull: { base: '#4a4450', blobs: ['#3a3440', '#5a5260', '#443e4a', '#6a6272', '#2e2a34', '#7a7068'], dark: 'rgba(10,8,14,0.42)', light: 'rgba(230,220,200,0.2)', sand: 0x6a6470 } };
/* FIX 5: lake moved off the `memory` plot. In the draft it sat at (-22,18) r7.6 and
   drowned plot('memory',-17,17) by 2.28 m (waterDist(-17,17) was -2.50). Now +10.69. */
const LAKE = { x: -32, z: 26, r: 6.8 };
const riverZ = x => SPR * (-26 + Math.sin((x / SPR + 60) / 120 * 4.2) * 5 - ((x / SPR + 60) / 120) * 6);
const riverW = x => 2.4 + Math.sin(x / SPR * 0.07) * 0.8;
/* PATHS[0..2] are byte-identical to the file's existing ROADS (line 47), so the ribbons
   line up once you delete the `Math.sin(t*6)*0.8` wiggle from the ribbon builder. */
const PATHS0 = [[-3, 13, -20, -12], [3, 13, 22, -10], [0, 14, 6, 19], [-20, -12, -36, 6], [22, -10, 36, 9], [3, 13, 3, -23]], PATHS = PATHS0.map(p => p.slice());   // roads to the spread-out plots (setSpread() moves them out in the meadow)
/* FIX 12: flat pads under every plot() + the windmill, so buildings MEET the ground
   instead of hovering over fbm relief. Measured spread inside each footprint after
   this: <= 0.055 m. This is the actual cure for "squarey / floating" — the draft had
   no equivalent and could not have had one, because `reserved` is not populated until
   kingdom3d.js line 153, long after the terrain is built at line 65. */
const PADS0 = [
  { x: -14, z: -8, r: 4.5, rim: 5 }, { x: 15, z: -7, r: 5.0, rim: 5 }, { x: 4, z: 13, r: 4.5, rim: 5 },
  { x: -25, z: 4, r: 3.0, rim: 4 }, { x: 25, z: 6, r: 3.5, rim: 4 }, { x: -17, z: 17, r: 5.0, rim: 5 },
  { x: 19, z: 17, r: 3.0, rim: 4 }, { x: -6, z: 22, r: 3.5, rim: 4 }, { x: 12, z: 22, r: 2.5, rim: 4 },
  { x: 30, z: -8, r: 3.0, rim: 4 }
];
const PADS = PADS0.map(p => Object.assign({}, p));
/* the roomier meadow (Yoni 2026-10-10: "in the same valley let's make the middle a bit bigger so it'll be not so dense"): in the home meadow
   every place, road, pad, the river and the lake move out from the castle by MEADOW_SPREAD and the valley grows to match; the castle crag
   keeps its size, so the ring round it opens up. The realms keep their maps (1). The code keeps writing positions in the old numbers:
   SPX() turns one into the meadow's (anything within 15 of the middle stays, so the round door and the roads still meet the crag's foot).
   ?spread=1 shows the old meadow, for comparing */
const MEADOW_SPREAD = (() => { try { const q = +new URLSearchParams(location.search).get('spread'); if (q >= 1 && q <= 2) return q; } catch (e) {} return 1.3; })();
const SPX = (x, z) => (SPR === 1 || Math.hypot(x, z) < 15) ? [x, z] : [x * SPR, z * SPR];
function setSpread(s) { SPR = s; CAMR = 1 + (s - 1) * 0.5; WORLD = Math.round(130 * s); LAKE.x = -32 * s; LAKE.z = 26 * s;
  PATHS.length = 0; for (const p of PATHS0) { const a = SPX(p[0], p[1]), b = SPX(p[2], p[3]); PATHS.push([a[0], a[1], b[0], b[1]]); }
  PADS.length = 0; for (const p of PADS0) { const q = SPX(p.x, p.z); PADS.push(Object.assign({}, p, { x: q[0], z: q[1] })); }
  GH.h = null; PADH = null; }   /* the height cache is rebuilt for the new map */

function segDist(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1, l2 = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / (l2 || 1)));
  return Math.hypot(px - (x1 + dx * t), pz - (z1 + dz * t));
}
const waterDist = (x, z) => Math.min(Math.abs(z - riverZ(x)) - riverW(x), Math.hypot(x - LAKE.x, z - LAKE.z) - LAKE.r);
const pathDist = (x, z) => { let d = 1e9; for (const s of PATHS) d = Math.min(d, segDist(x, z, s[0], s[1], s[2], s[3])); return d; };
const terrace = (h, step, k) => { const f = h / step, i = Math.floor(f), r = f - i; return (i + Math.pow(r, k)) * step; };

function baseHRaw(x, z) {
  const d = Math.hypot(x, z), u = x / SPR, v = z / SPR;                                 // u, v: the hills spread with the meadow; the crag (d) keeps its size
  let h = (fbm(u * 0.035, v * 0.035, 4) - 0.5) * 7.5 + (fbm(u * 0.11 + 4, v * 0.11 - 2, 3) - 0.5) * 1.7;
  h += Math.pow(Math.abs(fbm(u * 0.02 - 9, v * 0.02 + 5, 2) - 0.5) * 2, 1.6) * 3.4;      // ridged spine
  h *= ss(6, 15 * SPR, d);                                                               // flatten the plaza
  // castle crag: a tall, steep-sided mound so the keep commands the valley, with a flat
  // summit for the walls to sit on and a terraced skirt that reads as cut rock.
  const crag = 8.6 * Math.max(0, 1 - Math.pow(d / 13.5, 2.6));
  h += crag;
  if (d > 7.5 && d < 15) h += terrace(crag, 1.15, 2.6) - crag;                            // stepped rock face
  if (d < 7.0) h = lerp(8.6, h, ss(2.5, 7.0, d));                                        // flat summit for the walls
  if (d > 52 * SPR) h += RIM_MODE === 'island' ? -(d - 50 * SPR) * 1.35 : (d - 52 * SPR) * 0.38;   /* meadow/ocean: rim hills; sky/cloud: the island falls away into the air */                                                      // rim hills (pushed out: the valley is wider now)
  return h;
}

/* FIX 4: THE LOAD HITCH. The draft evaluated baseH ~55x per terrain vertex over 25,921
   vertices, plus 36,481 for the water grid, plus 65,536 for the depth bake. Measured in
   node on a fast desktop: 233 + 27 + 49 = 309 ms of frozen main thread, i.e. ~1.2-2.0 s
   on an iPad — not the "60-120 ms" claimed. Cache baseH AND its slope on a 1 m grid
   once (17,161 evals, 6 ms) and bilinear-sample. The smallest feature in baseHRaw is
   1/0.11 = 9 m, so 1 m sampling is ~9 samples per wavelength: no visible loss.
   Measured after: 6 + 48 + 6 + 9 = 69 ms. 4.5x faster. */
const GH = { n: 0, step: 1, half: 0, h: null, s: null };
function buildHeightCache() {
  if (GH.h) return;
  const half = WORLD / 2 + 4, step = 1, n = Math.ceil((half * 2) / step) + 1;
  GH.n = n; GH.step = step; GH.half = half;
  const h = new Float32Array(n * n), s = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = baseHRaw(-half + i * step, -half + j * step);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(n - 1, j + 1);
    const dx = (h[j * n + i1] - h[j * n + i0]) / ((i1 - i0) * step), dz = (h[j1 * n + i] - h[j0 * n + i]) / ((j1 - j0) * step);
    s[j * n + i] = Math.hypot(dx, dz);
  }
  GH.h = h; GH.s = s;
}
function gsample(arr, x, z) {
  const n = GH.n, fx = (x + GH.half) / GH.step, fz = (z + GH.half) / GH.step;
  let i = Math.floor(fx), j = Math.floor(fz);
  i = Math.max(0, Math.min(n - 2, i)); j = Math.max(0, Math.min(n - 2, j));
  const tx = Math.max(0, Math.min(1, fx - i)), tz = Math.max(0, Math.min(1, fz - j));
  const a = arr[j * n + i], b = arr[j * n + i + 1], c = arr[(j + 1) * n + i], d = arr[(j + 1) * n + i + 1];
  return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
}
const baseH = (x, z) => { buildHeightCache(); return gsample(GH.h, x, z); };
const baseSlope = (x, z) => { buildHeightCache(); return gsample(GH.s, x, z); };

function terrainRaw(x, z) {
  const wd = waterDist(x, z), pd = pathDist(x, z);
  let h = baseH(x, z);
  const tm = ss(0.45, 1.15, baseSlope(x, z)) * 0.85;                 // terrace only where steep
  if (tm > 0.01) h = lerp(h, terrace(h, 0.92, 3.0), tm);
  h = lerp(h, -0.15, ss(15, 1.5, wd) * 0.82);                        // valley
  h += Math.exp(-Math.pow((wd - 1.7) / 1.5, 2)) * 0.55 - ss(1.3, -3.0, wd) * 2.7;   // berm + bed
  h -= ss(2.3, 0.5, pd) * 0.17;                                      // worn paths sink
  return h;
}
let PADH = null;
/* DROP-IN REPLACEMENT for the file's `height()` — kingdom3d.js LINE 50, not line 40. */
function terrainHeight(x, z) {
  if (!PADH) PADH = PADS.map(p => terrainRaw(p.x, p.z));
  let h = terrainRaw(x, z);
  for (let k = 0; k < PADS.length; k++) {
    const p = PADS[k], d = Math.hypot(x - p.x, z - p.z);
    if (d > p.r + p.rim) continue;
    h = lerp(h, PADH[k], ss(p.r + p.rim, p.r, d));
  }
  return h;
}
function terrainNormal(x, z, out) {
  const e = 0.6, hx = terrainHeight(x + e, z) - terrainHeight(x - e, z), hz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  return (out || new T.Vector3()).set(-hx, 2 * e, -hz).normalize();
}

/* --- procedural ground textures (world-space tiled, so no UV stretching) --- */
function grassCanvasTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const GP = GROUND_PAL[GROUND_STYLE] || GROUND_PAL.meadow; g.fillStyle = GP.base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2000; i++) { g.fillStyle = GP.blobs[i % 6]; g.globalAlpha = 0.25 + R32() * 0.4; const r = 5 + R32() * 18; g.beginPath(); g.ellipse(R32() * 512, R32() * 512, r, r * 0.55, R32() * 3, 0, 6.28); g.fill(); }
  g.globalAlpha = 1;
  for (let i = 0; i < 9000; i++) { g.fillStyle = R32() < 0.5 ? GP.dark : GP.light; g.fillRect(R32() * 512, R32() * 512, 2, 3 + R32() * 3); }
  for (let i = 0; i < 90; i++) { g.fillStyle = ['rgba(255,214,90,0.5)', 'rgba(255,255,255,0.45)', 'rgba(210,150,255,0.4)'][i % 3]; g.beginPath(); g.arc(R32() * 512, R32() * 512, 2.2, 0, 6.28); g.fill(); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return keep(t);
}
function rockCanvasTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#8b8378'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 500; i++) { const x = R32() * 512, y = R32() * 512, w = 24 + R32() * 90, h = 8 + R32() * 22; g.fillStyle = `rgba(${120 + R32() * 70 | 0},${112 + R32() * 66 | 0},${100 + R32() * 60 | 0},0.5)`; g.beginPath(); g.ellipse(x, y, w / 2, h / 2, (R32() - 0.5) * 0.5, 0, 6.28); g.fill(); }
  g.strokeStyle = 'rgba(40,36,32,0.45)'; g.lineWidth = 1.6;
  for (let i = 0; i < 160; i++) { g.beginPath(); const x = R32() * 512, y = R32() * 512; g.moveTo(x, y); g.lineTo(x + (R32() - 0.5) * 120, y + (R32() - 0.5) * 26); g.stroke(); }
  for (let i = 0; i < 6000; i++) { g.fillStyle = R32() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,250,240,0.10)'; g.fillRect(R32() * 512, R32() * 512, 2, 2); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return keep(t);
}
function strataTex() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  let y = 0; while (y < 256) { const h = 4 + R32() * 26, v = 118 + R32() * 120 | 0, warm = R32() * 26 | 0; g.fillStyle = `rgb(${v + warm},${v + (warm * 0.6 | 0)},${v - 6})`; g.fillRect(0, y, 4, h); y += h; }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; return keep(t);
}
function cloudMaskTex() {
  const N = 256, f = tileNoise(N, 4, 4, 11), c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) { const v = Math.max(0, Math.min(255, (f[i] * 255) | 0)); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return keep(t);   // NoColorSpace: data
}

const SKY = {
  uTime: { value: 0 },
  uCloud: { value: null }, uCloudScroll: { value: new T.Vector2() }, uCloudScale: { value: 0.0065 }, uCloudAmt: { value: 0.34 },
  uWind: new T.Vector2(0.9, 0.35)
};
/* FIX 2 (HARD CRASH): the draft did `const k = mat.customProgramCacheKey; ... k()`.
   For an untouched material that is Material.prototype.customProgramCacheKey, whose body
   is `return this.onBeforeCompile.toString()`. Called bare under the file's 'use strict',
   `this` is undefined -> TypeError on the first render of every decorated material.
   Verified in node. It must be k.call(mat). */
function chainCacheKey(mat, tag) {
  const k = mat.customProgramCacheKey;
  mat.customProgramCacheKey = function () { return tag + '|' + (k ? k.call(mat) : ''); };
}
function applyCloudShadow(mat, tag) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    if (prev) prev(sh);
    sh.uniforms.uCloud = SKY.uCloud; sh.uniforms.uCloudScroll = SKY.uCloudScroll;
    sh.uniforms.uCloudScale = SKY.uCloudScale; sh.uniforms.uCloudAmt = SKY.uCloudAmt;
    if (sh.vertexShader.indexOf('vKQW') < 0) {
      sh.vertexShader = 'varying vec3 vKQW;\n' + sh.vertexShader.replace('#include &lt;begin_vertex&gt;'.replace('&lt;','<').replace('&gt;','>'), `#include <begin_vertex>
vec4 kqw = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
kqw = instanceMatrix * kqw;
#endif
vKQW = (modelMatrix * kqw).xyz;`);
    }
    sh.fragmentShader = 'uniform sampler2D uCloud;\nuniform vec2 uCloudScroll;\nuniform float uCloudScale;\nuniform float uCloudAmt;\nvarying vec3 vKQW;\n' +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
float kqCl = texture2D(uCloud, vKQW.xz * uCloudScale + uCloudScroll).r;
diffuseColor.rgb *= 1.0 - uCloudAmt * smoothstep(0.44, 0.74, kqCl);`);
  };
  chainCacheKey(mat, 'kqcs_' + (tag || ''));
}
/* NOTE for the integrator: in the line above, the literal is plain
   `sh.vertexShader.replace('#include <begin_vertex>', ...)` — write it exactly like the
   fragment one below it. (Escaped here only to survive transport.) */

function buildTerrain(night, PAL) {
  buildHeightCache();
  const SEG = Math.round(144 * SPR), geo = new T.PlaneGeometry(WORLD, WORLD, SEG, SEG); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3), spl = new Float32Array(n * 3);
  const cA = new T.Color(PAL.grass), cB = new T.Color(PAL.grass2), tmp = new T.Color();
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = terrainHeight(x, z);
    pos.setY(i, h);
    const e = 0.9, sl = Math.hypot(terrainHeight(x + e, z) - terrainHeight(x - e, z), terrainHeight(x, z + e) - terrainHeight(x, z - e)) / (2 * e);
    let avg = 0; for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283; avg += terrainHeight(x + Math.cos(a) * 2.0, z + Math.sin(a) * 2.0); }
    const ao = Math.min(1, Math.max(0.58, 0.82 + (h - avg / 4) * 0.42));
    const pd = pathDist(x, z), wd = waterDist(x, z);
    spl[i * 3] = ss(0.42, 1.05, sl);                       // rock
    spl[i * 3 + 1] = ss(2.4, 0.7, pd);                     // path/dirt
    spl[i * 3 + 2] = ss(2.6, -0.4, wd) * (1 - ss(0.2, -1.4, wd) * 0.5);  // damp shore
    tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, (2.5 - h) / 7 + (fbm(x * 0.09, z * 0.09, 2) - 0.5) * 0.6)));
    tmp.multiplyScalar(ao);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  geo.setAttribute('aSplat', new T.BufferAttribute(spl, 3));
  geo.computeVertexNormals();

  /* FIX 1 (SYNTAX ERROR): the draft literal was 0xb59a<DEVANAGARI SIX>6. `node --check`
     reports "SyntaxError: Invalid or unexpected token" and the whole IIFE fails to parse,
     so nothing on the page runs. FIX 19: uBoost is theme-aware; the draft hard-coded 1.45
     and made the NIGHT terrain brighter than the day terrain it replaced. */
  const uni = {
    uGrass: { value: grassCanvasTex() }, uRock: { value: rockCanvasTex() }, uStrata: { value: strataTex() },
    uDirt: { value: new T.Color(night ? 0x5b4c35 : RICH ? 0xb07a4e : 0xb59a66) },
    uSand: { value: new T.Color(night ? 0x5d5a48 : (GROUND_PAL[GROUND_STYLE] || GROUND_PAL.meadow).sand) },
    uBoost: { value: night ? 1.0 : 1.35 },
    uPath: { value: null }, uPathOn: { value: 0 }
  };
  /* the new look: painted grass and a painted dirt path (Yoni's Midjourney textures, made seamless; tools note in art-src/places/tex_*) */
  if (RICH && !night && LANDMARK_MODELS) { const tl = new T.TextureLoader(), prep = t => { t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
    tl.load(K3D_BASE + 'models/grass.webp?v=2', t => { uni.uGrass.value = prep(t); uni.uBoost.value = RICH_GRASS_BOOST; });
    tl.load(K3D_BASE + 'models/path.webp?v=1', t => { uni.uPath.value = prep(t); uni.uPathOn.value = 1; }); }
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, color: 0xffffff });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = 'attribute vec3 aSplat;\nvarying vec3 vSplat;\nvarying vec3 vWN;\n' +
      sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvSplat = aSplat;\nvWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = `uniform sampler2D uGrass;
uniform sampler2D uRock;
uniform sampler2D uStrata;
uniform vec3 uDirt;
uniform vec3 uSand;
uniform float uBoost;
uniform sampler2D uPath;
uniform float uPathOn;
varying vec3 vSplat;
varying vec3 vWN;
` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 P = vKQW;
  vec3 gr = texture2D(uGrass, P.xz * 0.16).rgb;
  float kx = abs(vWN.x), kz = abs(vWN.z);
  vec3 ra = texture2D(uRock, P.zy * 0.13).rgb;
  vec3 rb = texture2D(uRock, P.xy * 0.13).rgb;
  vec3 rk = mix(rb, ra, kx / (kx + kz + 0.0001));
  float band = texture2D(uStrata, vec2(0.5, fract(P.y * 0.085))).r;
  rk *= 0.72 + 0.62 * band;
  float rockW = clamp(vSplat.x + smoothstep(0.34, 0.62, 1.0 - vWN.y) * 0.75, 0.0, 1.0);
  vec3 al = mix(gr, rk, rockW);
  vec3 dirt = uDirt * (0.70 + 0.55 * gr.g);
  if (uPathOn > 0.5) dirt = texture2D(uPath, P.xz * 0.21).rgb * 1.05;
  al = mix(al, dirt, vSplat.y * 0.92);
  al = mix(al, uSand * (0.78 + 0.44 * gr.r), vSplat.z);
  al *= mix(1.0, 0.74, smoothstep(0.35, 0.95, vSplat.z));
  diffuseColor.rgb *= al * uBoost;
}`);
  };
  mat.customProgramCacheKey = () => 'kqterrain2';
  applyCloudShadow(mat, 'terrain');
  const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true; mesh.castShadow = false;
  return mesh;
}
/* NOTE: the strata lookup dropped the draft's `+ gr.b * 0.12` term. That made the strata
   sample depend on a previously-fetched texel — a dependent texture read, which is one of
   the slowest things you can do in a mobile fragment shader, for a jitter nobody sees. */

/* ---------------------------------------------------------------- 2. WATER */
function bakeDepthMap(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = (i / (size - 1) - 0.5) * WORLD, z = (j / (size - 1) - 0.5) * WORLD;
    const d = Math.max(0, Math.min(1, (WATER_Y - terrainHeight(x, z)) / 3.0)), k = (j * size + i) * 4;
    img.data[k] = (d * 255) | 0; img.data[k + 1] = 0; img.data[k + 2] = 0; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
  t.minFilter = t.magFilter = T.LinearFilter; t.generateMipmaps = false;   // FIX 21: was building unused mips
  return keep(t);
}
function waterNormalTex() {
  const N = 256, f = tileNoise(N, 6, 3, 23), c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N), at = (x, y) => f[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * 6, dy = (at(x, y + 1) - at(x, y - 1)) * 6, k = (y * N + x) * 4;
    img.data[k] = Math.max(0, Math.min(255, (dx * 0.5 + 0.5) * 255)) | 0;
    img.data[k + 1] = Math.max(0, Math.min(255, (dy * 0.5 + 0.5) * 255)) | 0;
    img.data[k + 2] = (at(x, y) * 255) | 0; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return keep(t);
}
function buildWater(night, PAL, sunDir) {
  const G = Math.round(160 * SPR), step = WORLD / G, half = WORLD / 2, P = [], D = [], idx = [];
  const key = new Int32Array((G + 1) * (G + 1)).fill(-1);
  const hCache = new Float32Array((G + 1) * (G + 1));
  for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) hCache[j * (G + 1) + i] = terrainHeight(-half + i * step, -half + j * step);
  const vert = (i, j) => {
    const k = j * (G + 1) + i; if (key[k] >= 0) return key[k];
    const x = -half + i * step, z = -half + j * step, d = Math.max(0, WATER_Y - hCache[k]);
    key[k] = P.length / 3; P.push(x, WATER_Y, z); D.push(d); return key[k];
  };
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const h0 = hCache[j * (G + 1) + i], h1 = hCache[j * (G + 1) + i + 1], h2 = hCache[(j + 1) * (G + 1) + i], h3 = hCache[(j + 1) * (G + 1) + i + 1];
    if (Math.min(h0, h1, h2, h3) > WATER_Y + 0.05) continue;
    /* FIX 6: height alone is not enough. A flat plane at WATER_Y turns EVERY hollow in
       the fbm into a puddle — measured 1,066 spurious quads out of 2,215, up to 26.5 m
       from any river or lake, including one on top of the `memory` plot. Gate on
       distance to an actual watercourse as well. */
    if (waterDist(-half + (i + 0.5) * step, -half + (j + 0.5) * step) > 5.0) continue;
    const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
    idx.push(a, c, b, b, c, d);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  geo.setAttribute('aDepth', new T.Float32BufferAttribute(D, 1));
  geo.setIndex(idx); geo.computeBoundingSphere();

  const uni = {
    fogColor: { value: new T.Color() }, fogNear: { value: 1 }, fogFar: { value: 100 }, fogDensity: { value: 0.00025 },
    uTime: SKY.uTime, uNrm: { value: waterNormalTex() }, uDepthTex: { value: bakeDepthMap(192) }, uSize: { value: WORLD },
    uShallow: { value: new T.Color(night ? 0x1b3f63 : 0x63b6c9) }, uDeep: { value: new T.Color(night ? 0x0a1c3a : 0x18466e) },
    uFoam: { value: new T.Color(night ? 0xaebdd8 : 0xf4fbff) }, uSky: { value: new T.Color(PAL.hor) },
    uSun: { value: new T.Color(PAL.sun) }, uSunDir: { value: sunDir.clone().normalize() }
  };
  const mat = new T.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, fog: true, side: T.FrontSide,
    vertexShader: `attribute float aDepth;
varying float vDepth;
varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vDepth = aDepth;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: `uniform float uTime;
uniform float uSize;
uniform sampler2D uNrm;
uniform sampler2D uDepthTex;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uFoam;
uniform vec3 uSky;
uniform vec3 uSun;
uniform vec3 uSunDir;
varying float vDepth;
varying vec3 vW;
#include <fog_pars_fragment>
void main(){
  vec2 p = vW.xz;
  vec2 d1 = texture2D(uNrm, p * 0.055 + vec2( uTime * 0.013,  uTime * 0.021)).rg * 2.0 - 1.0;
  vec2 d2 = texture2D(uNrm, p * 0.121 + vec2(-uTime * 0.019,  uTime * 0.009)).rg * 2.0 - 1.0;
  vec3 N = normalize(vec3(d1.x + d2.x * 0.6, 2.6, d1.y + d2.y * 0.6));
  vec3 V = normalize(cameraPosition - vW);
  float fres = mix(0.05, 1.0, pow(1.0 - max(dot(N, V), 0.0), 4.0));
  vec2 duv = vW.xz / uSize + 0.5 + N.xz * 0.030;
  float bed = texture2D(uDepthTex, duv).r * 3.0;
  float dep = mix(vDepth, bed, 0.72);
  vec3 body = mix(uShallow, uDeep, clamp(dep / 1.8, 0.0, 1.0));
  vec3 Hv = normalize(uSunDir + V);
  float spec = pow(max(dot(N, Hv), 0.0), 200.0) * 1.7;
  float rip = texture2D(uNrm, p * 0.24 + vec2(uTime * 0.03, -uTime * 0.02)).b;
  float edge = 1.0 - smoothstep(0.0, 0.34, dep);
  float lap  = 0.5 + 0.5 * sin(uTime * 1.7 - dep * 22.0 + rip * 6.2);
  float foam = smoothstep(0.34, 0.95, edge * (0.55 + 0.45 * lap)) + smoothstep(0.88, 1.0, edge);
  foam = clamp(foam, 0.0, 1.0);
  vec3 col = mix(body, uSky, fres * 0.85) + uSun * spec;
  col = mix(col, uFoam, foam);
  float alpha = max(mix(0.52, 0.94, clamp(dep / 0.9, 0.0, 1.0)), foam);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`
  });
  const m = new T.Mesh(geo, mat); m.renderOrder = 2; return m;
}

/* ---------------------------------------------------------------- 3. TREES */
const WIND = { uTime: SKY.uTime, uAmp: { value: 1 } };
function applyWind(mat, treeH, stiff, tag) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    if (prev) prev(sh);
    sh.uniforms.uTime = WIND.uTime; sh.uniforms.uAmp = WIND.uAmp;
    sh.vertexShader = 'uniform float uTime;\nuniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
{
  #ifdef USE_INSTANCING
  vec3 ip = instanceMatrix[3].xyz;
  #else
  vec3 ip = vec3(0.0);
  #endif
  float ph = ip.x * 0.37 + ip.z * 0.61;
  float hN = clamp(transformed.y / ${treeH.toFixed(2)}, 0.0, 1.0);
  float k  = pow(hN, ${stiff.toFixed(2)}) * uAmp;
  float g  = sin(uTime * 1.15 + ph) * 0.55 + sin(uTime * 2.70 + ph * 1.7) * 0.22 + sin(uTime * 5.30 + ph * 3.1) * 0.07;
  transformed.x += g * k * 0.42;
  transformed.z += cos(uTime * 0.90 + ph * 0.8) * k * 0.26;
  transformed.y -= k * abs(g) * 0.06;
}`);
  };
  chainCacheKey(mat, 'kqwind_' + tag);                           // FIX 2 applies here too
}
function trunkGeo(rBot, rTop, h, seg, radial, bend) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg; pts.push(new T.Vector2(lerp(rBot, rTop, Math.pow(t, 0.62)) * (1 + Math.exp(-t * 14) * 0.85), t * h)); }
  pts.push(new T.Vector2(0, h * 1.01));
  const g = new T.LatheGeometry(pts, radial);
  if (bend) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / h; p.setX(i, p.getX(i) + bend * y * y); } g.computeVertexNormals(); }
  return g;
}
const branchGeo = (r0, r1, len, seg) => new T.CylinderGeometry(r1, r0, len, seg || 5, 1, true).translate(0, len / 2, 0);
const lobe = (r, det) => new T.IcosahedronGeometry(r, det == null ? 1 : det);

/* a crown of soft clumps on an ellipsoid (fibonacci spiral), none on the underside, and a filler core */
/* a clump that is not a perfect ball: its surface pushed in and out by a smooth pattern; normals stay round, so the light stays soft */
function lumpy(r) { const g = lobe(r, 1), p = g.attributes.position, nA = g.attributes.normal, v = new T.Vector3(), o = R32() * 9;
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const k = 1 + 0.08 * Math.sin(v.x * 5.1 + o) * Math.sin(v.y * 4.3 + o * 0.7) + 0.04 * Math.sin(v.z * 9.0 + v.x * 3.0 + o);
    p.setXYZ(i, v.x * r * k, v.y * r * k, v.z * r * k); nA.setXYZ(i, v.x, v.y, v.z); } return g; }
function canopyClumps(cx, cy, cz, rx, ry, rz, n, rMin, rMax, cols) { const out = [];
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, ph = Math.acos(1 - 2 * t), th = i * 2.39996, y = Math.cos(ph); if (y < -0.5) continue; const s = Math.sin(ph);
    out.push({ g: lumpy(rMin + R32() * (rMax - rMin)), m: xf(cx + s * Math.cos(th) * rx, cy + y * ry, cz + s * Math.sin(th) * rz, R32() * 3, R32() * 3, R32() * 3), c: cols[(R32() * cols.length) | 0] }); }
  out.push({ g: lobe(Math.min(rx, rz) * 0.9, 1), m: xf(cx, cy, cz, 0, 0, 0, 1, ry / rx, 1), c: cols[0] }); return out; }
/* clumps facing into the crown go dark, the ones facing out stay bright: the gaps between clumps read as depth */
function bakeCrownAO(geo, cx, cy, cz, yMin) { const c = geo.attributes.color, nA = geo.attributes.normal, p = geo.attributes.position, d = new T.Vector3(), n = new T.Vector3();
  for (let i = 0; i < c.count; i++) { if (p.getY(i) < yMin) continue; d.set(p.getX(i) - cx, p.getY(i) - cy, p.getZ(i) - cz).normalize(); n.set(nA.getX(i), nA.getY(i), nA.getZ(i));
    const k = 0.5 + 0.5 * ss(-0.25, 0.75, n.dot(d)); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); } }
function buildBroadleafRich() {                               // ~2,100 tris: 25 clumps
  const bark = new T.Color(0x5e4227), cols = [new T.Color(0x356f2a), new T.Color(0x447f30), new T.Color(0x52923a), new T.Color(0x2e6326)], parts = [];
  parts.push({ g: trunkGeo(0.36, 0.16, 4.2, 7, 7, 0.22), c: bark });
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 0.4, L = 1.5 + R32() * 0.7; parts.push({ g: branchGeo(0.11, 0.04, L, 5), m: xf(Math.cos(a) * 0.14, 2.6 + i * 0.35, Math.sin(a) * 0.14, 0.72 * Math.sin(a), -a, 0.72 * Math.cos(a)), c: bark }); }
  parts.push(...canopyClumps(0, 5.4, 0, 2.25, 1.6, 2.25, 18, 0.8, 1.15, cols), ...canopyClumps(0.7, 6.7, -0.3, 1.35, 0.95, 1.35, 7, 0.6, 0.85, cols));
  const g = mergeGeos(parts); bakeCrownAO(g, 0.2, 5.7, -0.1, 3.4); bakeLeafAO(g, 7.8, 3.4, 1.1); return { geo: g, h: 7.8 };
}
function buildBroadleaf() {                                   // 458 tris (verified)
  if (RICH) return buildBroadleafRich();
  const bark = new T.Color(0x5e4227), lf1 = new T.Color(0x3f7f34), lf2 = new T.Color(0x56a03e), lf3 = new T.Color(0x2e6a2f), parts = [];
  parts.push({ g: trunkGeo(0.34, 0.15, 4.0, 6, 7, 0.22), c: bark });
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 0.4, L = 1.5 + R32() * 0.7;
    parts.push({ g: branchGeo(0.105, 0.035, L, 5), m: xf(Math.cos(a) * 0.14, 2.5 + i * 0.35, Math.sin(a) * 0.14, 0.72 * Math.sin(a), -a, 0.72 * Math.cos(a)), c: bark }); }
  const lob = [[0, 5.5, 0, 1.95, 1], [-1.5, 4.7, 0.6, 1.45, 1], [1.4, 4.8, -0.7, 1.4, 1], [0.5, 6.4, 0.9, 1.05, 0], [-0.9, 6.2, -0.8, 1.0, 0], [1.9, 5.5, 0.9, 0.85, 0], [-1.9, 5.6, -0.5, 0.8, 0]];
  for (const [x, y, z, r, d] of lob) parts.push({ g: lobe(r, d), m: xf(x, y, z, R32() * 3, R32() * 3, R32() * 3, 1, 0.82, 1), c: [lf1, lf2, lf3][(R32() * 3) | 0] });
  const g = mergeGeos(parts); bakeLeafAO(g, 7.4, 2.6, 1); return { geo: g, h: 7.4 };
}
function buildConifer() {                                     // 283 tris (draft said 232)
  const bark = new T.Color(0x4a3524), nd1 = new T.Color(0x24552f), nd2 = new T.Color(0x1b4429), parts = [];
  parts.push({ g: trunkGeo(0.30, 0.07, 6.6, 5, 6, 0), c: bark });
  for (let k = 0; k < 6; k++) {
    const t = k / 6, y = 1.0 + t * 5.0, r = (1.85 - t * 1.35);
    parts.push({ g: new T.ConeGeometry(r, 1.5, 9, 1, true), m: xf(0, y + 0.55, 0, 0, k * 0.9, 0), c: k % 2 ? nd1 : nd2 });
    for (let b = 0; b < 5; b++) { const a = b / 5 * 6.283 + k * 0.7;
      parts.push({ g: new T.ConeGeometry(0.30, 1.0, 5, 1, true), m: xf(Math.cos(a) * r * 0.82, y + 0.25, Math.sin(a) * r * 0.82, 1.15 * Math.sin(a), 0, -1.15 * Math.cos(a)), c: nd2 }); }
  }
  parts.push({ g: new T.ConeGeometry(0.55, 1.5, 7, 1, true), m: xf(0, 6.2, 0), c: nd1 });
  const g = mergeGeos(parts); bakeLeafAO(g, 7.7, 1.0, 0.9); return { geo: g, h: 7.7 };
}
function buildBirchRich() {                                   // ~1,300 tris: 15 clumps on a slim crown
  const bark = new T.Color(0xe4e0d4), dark = new T.Color(0x8e8b80), cols = [new T.Color(0x86b64a), new T.Color(0x6a9e3c), new T.Color(0x97c255)], parts = [];
  parts.push({ g: trunkGeo(0.19, 0.07, 5.6, 7, 7, -0.30), c: bark });
  for (let i = 0; i < 5; i++) parts.push({ g: new T.BoxGeometry(0.06, 0.012, 0.30), m: xf((R32() - 0.5) * 0.2, 0.9 + i * 0.85, 0.15, 0, R32() * 3, 0), c: dark });
  parts.push(...canopyClumps(0, 5.6, 0, 1.55, 1.35, 1.55, 15, 0.55, 0.82, cols));
  const g = mergeGeos(parts); bakeCrownAO(g, 0, 5.6, 0, 4.0); bakeLeafAO(g, 7.2, 3.8, 0.9); return { geo: g, h: 7.2 };
}
function buildBirch() {                                       // 424 tris (draft said 400)
  if (RICH) return buildBirchRich();
  const bark = new T.Color(0xe4e0d4), dark = new T.Color(0x8e8b80), lf1 = new T.Color(0x86b64a), lf2 = new T.Color(0x6a9e3c), parts = [];
  parts.push({ g: trunkGeo(0.18, 0.07, 5.4, 7, 7, -0.30), c: bark });
  for (let i = 0; i < 5; i++) parts.push({ g: new T.BoxGeometry(0.06, 0.012, 0.30), m: xf((R32() - 0.5) * 0.2, 0.9 + i * 0.85, 0.15, 0, R32() * 3, 0), c: dark });
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 1.1;
    parts.push({ g: branchGeo(0.05, 0.02, 1.25, 4), m: xf(Math.cos(a) * 0.09, 3.2 + i * 0.5, Math.sin(a) * 0.09, 0.85 * Math.sin(a), -a, 0.85 * Math.cos(a)), c: bark }); }
  const lob = [[0, 5.6, 0, 1.5, 1], [-1.2, 5.1, 0.5, 1.15, 1], [1.1, 5.3, -0.5, 0.95, 0], [0.3, 6.3, 0.6, 0.8, 0], [-0.7, 6.1, -0.6, 0.7, 0]];
  for (const [x, y, z, r, d] of lob) parts.push({ g: lobe(r, d), m: xf(x, y, z, R32() * 3, R32() * 3, R32() * 3, 1.1, 0.62, 1.1), c: R32() < 0.5 ? lf1 : lf2 });
  const g = mergeGeos(parts); bakeLeafAO(g, 7.0, 3.0, 0.85); return { geo: g, h: 7.0 };
}

/* leaves, not polygons (?look=rich): a two-scale noise in the tree's own space darkens and lightens the colour like clusters of leaves,
   and tilts the normal so the light breaks up across a crown; trunks pick it up as bark. No extra geometry */
function applyLeafNoise(mat, tag) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => { if (prev) prev(sh);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLeafP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLeafP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLeafP;\nfloat lfH(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }\nfloat lfN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(lfH(i), lfH(i + vec3(1,0,0)), f.x), mix(lfH(i + vec3(0,1,0)), lfH(i + vec3(1,1,0)), f.x), f.y), mix(mix(lfH(i + vec3(0,0,1)), lfH(i + vec3(1,0,1)), f.x), mix(lfH(i + vec3(0,1,1)), lfH(i + vec3(1,1,1)), f.x), f.y), f.z); }')
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ float lf = lfN(vLeafP * 5.0) * 0.55 + lfN(vLeafP * 13.0) * 0.45; diffuseColor.rgb *= 0.7 + 0.55 * lf; }')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ vec3 q = vLeafP * 7.0; float e = 0.12; vec3 gr = vec3(lfN(q + vec3(e,0,0)) - lfN(q - vec3(e,0,0)), lfN(q + vec3(0,e,0)) - lfN(q - vec3(0,e,0)), lfN(q + vec3(0,0,e)) - lfN(q - vec3(0,0,e))); normal = normalize(normal + (viewMatrix * vec4(gr, 0.0)).xyz * 2.2); }');
  };
  chainCacheKey(mat, tag + 'leaf');
}
function plantSpecies(parent, spec, count, pick, opts) {
  opts = opts || {};
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  applyWind(mat, spec.h, opts.stiff || 2.2, opts.tag || 'tree');
  applyCloudShadow(mat, opts.tag || 'tree');
  if (RICH) applyLeafNoise(mat, opts.tag || 'tree');
  const mesh = new T.InstancedMesh(spec.geo, mat, count); mesh.userData.species = opts.tag || 'tree';
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.instanceMatrix.setUsage(T.StaticDrawUsage);
  const dm = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking });
  applyWind(dm, spec.h, opts.stiff || 2.2, (opts.tag || 'tree') + '_d');
  mesh.customDepthMaterial = dm;

  const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), s = new T.Vector3(), col = new T.Color();
  let placed = 0, guard = 0;
  while (placed < count && guard++ < count * 40) {
    const p = pick(); if (!p) continue;
    const sc = p.s || (0.75 + R32() * 0.7);
    e.set((R32() - 0.5) * 0.09, R32() * 6.283, (R32() - 0.5) * 0.09);
    q.setFromEuler(e); v.set(p.x, p.y - 0.12, p.z); s.set(sc * (0.9 + R32() * 0.22), sc, sc * (0.9 + R32() * 0.22));
    m.compose(v, q, s); mesh.setMatrixAt(placed, m);
    col.setHSL(0.24 + (R32() - 0.5) * 0.085, 0.42 + R32() * 0.26, 0.5 + (R32() - 0.5) * 0.14);
    col.r = lerp(1, col.r * 2.0, 0.34); col.g = lerp(1, col.g * 2.0, 0.34); col.b = lerp(1, col.b * 2.0, 0.34);
    mesh.setColorAt(placed, col);
    if (opts.onPlaced) opts.onPlaced(p.x, p.y, p.z, sc);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;   // correct: the batch bound is the SOURCE geometry's, not the spread
  parent.add(mesh); return mesh;
}

/* ------------------------------------------------------- 4. CONTACT SHADOWS */
function contactShadows(parent, max) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.62)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  const tx = keep(new T.CanvasTexture(c));
  const mat = new T.ShaderMaterial({
    uniforms: { uTex: { value: tx }, uStr: { value: 0.42 } },
    transparent: true, depthWrite: false, depthTest: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,   // added: kills z-fight on slopes
    blending: T.CustomBlending, blendSrc: T.ZeroFactor, blendDst: T.SrcColorFactor,
    vertexShader: `varying vec2 vUv;
varying float vS;
void main(){
  vUv = uv;
  #ifdef USE_INSTANCING_COLOR
  vS = instanceColor.r;
  #else
  vS = 1.0;
  #endif
  gl_Position = projectionMatrix * modelViewMatrix * (instanceMatrix * vec4(position, 1.0));
}`,
    fragmentShader: `uniform sampler2D uTex;
uniform float uStr;
varying vec2 vUv;
varying float vS;
void main(){
  float a = texture2D(uTex, vUv).a * vS;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vec3(1.0 - a * uStr), 1.0);
}`
  });
  const quad = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const mesh = new T.InstancedMesh(quad, mat, max);
  mesh.frustumCulled = false; mesh.renderOrder = 1; mesh.count = 0; parent.add(mesh);
  const m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), nv = new T.Vector3(),
        pv = new T.Vector3(), sv = new T.Vector3(), col = new T.Color();
  let i = 0;
  return {
    mesh,
    add(x, y, z, r, strength) {
      if (i >= max) return;
      terrainNormal(x, z, nv); q.setFromUnitVectors(up, nv);
      pv.set(x, y + 0.035, z); sv.set(r, 1, r);
      m.compose(pv, q, sv);
      mesh.setMatrixAt(i, m); col.setRGB(strength == null ? 1 : strength, 0, 0); mesh.setColorAt(i, col); i++;
    },
    commit() { mesh.count = i; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  };
}

/* ------------------------------------------------------------ 5. BUILDINGS */
/* FIX 3: EVERY triangle of the draft's hip roof was wound backwards. Verified: face
   (A,B,R2) normal = (0,-9.88,+9.58) — it points DOWN, so with FrontSide culling the roof
   is invisible from above and you see straight into the attic. `hip` is the cottage
   default, so the default cottage had no roof. Re-verified after this rewrite: all six
   faces now have n.y > 0. */
function hipRoofGeo(w, d, h, over, ridgeFrac) {
  const W = w / 2 + over, D = d / 2 + over, rf = (ridgeFrac == null ? 0.42 : ridgeFrac) * W;
  const v = [], uv = [], push = (a, b, c, ua, ub, uc) => { v.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...uc); };
  const A = [-W, 0, -D], B = [W, 0, -D], C = [W, 0, D], E = [-W, 0, D], R1 = [-rf, h, 0], R2 = [rf, h, 0];
  const sl = Math.hypot(h, D), hipL = Math.hypot(h, W - rf);
  push(A, R2, B, [0, 0], [(W + rf), sl], [w + 2 * over, 0]);   // -Z slope   n=(0,+9.88,-9.58)
  push(A, R1, R2, [0, 0], [(W - rf), sl], [(W + rf), sl]);     //            n=(0,+4.15,-4.02)
  push(C, R1, E, [0, 0], [(W + rf), sl], [w + 2 * over, 0]);   // +Z slope   n=(0,+9.88,+9.58)
  push(C, R2, R1, [0, 0], [(W + rf), sl], [(W - rf), sl]);     //            n=(0,+4.15,+4.02)
  push(B, R2, C, [0, 0], [D, hipL], [d + 2 * over, 0]);        // +X hip     n=(+7.45,+5.73,0)
  push(E, R1, A, [0, 0], [D, hipL], [d + 2 * over, 0]);        // -X hip     n=(-7.45,+5.73,0)
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;                                    // 6 tris
}
function gableRoofGeo(w, d, h, over) {
  const W = w / 2 + over, s = new T.Shape();
  s.moveTo(-W, 0); s.lineTo(W, 0); s.lineTo(W, 0.14); s.lineTo(0, h); s.lineTo(-W, 0.14); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: d + 2 * over, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -(d / 2 + over)); return g;                          // ~10 tris
}
function fasciaGeo(w, d, over, t) {
  const W = w / 2 + over, D = d / 2 + over, parts = [];
  parts.push({ g: new T.BoxGeometry(2 * W, t, 0.09), m: xf(0, -t / 2, -D) });
  parts.push({ g: new T.BoxGeometry(2 * W, t, 0.09), m: xf(0, -t / 2, D) });
  parts.push({ g: new T.BoxGeometry(0.09, t, 2 * D), m: xf(-W, -t / 2, 0) });
  parts.push({ g: new T.BoxGeometry(0.09, t, 2 * D), m: xf(W, -t / 2, 0) });
  return mergeGeos(parts);
}
/* FIX 16: the draft rotated the dormer gable 90 deg about Y, which put its ridge ACROSS
   the dormer instead of running out of the roof slope. No rotation is correct. */
function dormerGeo(w, h, d, roofH) {
  const parts = [];
  parts.push({ g: new T.BoxGeometry(w, h, d), m: xf(0, h / 2, 0) });
  parts.push({ g: gableRoofGeo(w, d, roofH, 0.12), m: xf(0, h, 0) });
  return mergeGeos(parts);
}
function chimneyGeo(w, d, h) {
  const parts = [];
  parts.push({ g: new T.BoxGeometry(w, h, d), m: xf(0, h / 2, 0) });
  parts.push({ g: new T.BoxGeometry(w * 1.34, 0.18, d * 1.34), m: xf(0, h - 0.09, 0) });
  parts.push({ g: new T.BoxGeometry(w * 1.1, 0.12, d * 1.1), m: xf(0, h * 0.62, 0) });
  return mergeGeos(parts);
}
/* Call this ONCE and reuse — the draft's STEP 4 snippet repainted a 256x256 canvas and
   uploaded a fresh texture per cottage. */
function halfTimberTex(plaster, beam) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = plaster; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) { g.fillStyle = R32() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; g.fillRect(R32() * 256, R32() * 256, 3, 3); }
  g.strokeStyle = beam; g.lineWidth = 15; g.lineCap = 'square';
  g.strokeRect(7, 7, 242, 242);
  g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  for (const x of [64, 128, 192]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.lineWidth = 11;
  g.beginPath(); g.moveTo(8, 128); g.lineTo(64, 8); g.moveTo(192, 8); g.lineTo(248, 128); g.stroke();
  g.beginPath(); g.moveTo(8, 248); g.lineTo(64, 136); g.moveTo(192, 136); g.lineTo(248, 248); g.stroke();
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return keep(t);
}
/* FIX 9: the chimney used to be merged into the WALL batch, so STEP 4's half-timber
   plaster got painted onto the stone chimney. It now goes into `trim`, with the plinth. */
function cottage(cfg) {
  const o = Object.assign({ w: 4.2, d: 3.2, wallH: 2.4, roofH: 1.9, over: 0.42, type: 'hip', dormers: 1, chimneys: [[1.3, 0.6, 2.2]] }, cfg);
  const wall = [], roof = [], trim = [];
  const soot = new T.Color(0x6f6a60), plain = new T.Color(0xffffff);
  wall.push({ g: new T.BoxGeometry(o.w, o.wallH, o.d), m: xf(0, o.wallH / 2, 0), c: plain });
  trim.push({ g: new T.BoxGeometry(o.w + 0.22, 0.3, o.d + 0.22), m: xf(0, 0.15, 0), c: soot });   // stone plinth
  for (const sx of [-1, 1]) for (const sz of [-1, 1])                                             // corner posts
    trim.push({ g: new T.BoxGeometry(0.17, o.wallH, 0.17), m: xf(sx * (o.w / 2 - 0.05), o.wallH / 2, sz * (o.d / 2 - 0.05)), c: plain });
  const rg = o.type === 'hip' ? hipRoofGeo(o.w, o.d, o.roofH, o.over) : gableRoofGeo(o.w, o.d, o.roofH, o.over);
  roof.push({ g: rg, m: xf(0, o.wallH, 0) });
  trim.push({ g: fasciaGeo(o.w, o.d, o.over, 0.16), m: xf(0, o.wallH, 0), c: plain });
  for (let i = 0; i < o.dormers; i++) {
    const u = o.dormers === 1 ? 0 : (i / (o.dormers - 1) - 0.5) * o.w * 0.55;
    roof.push({ g: dormerGeo(0.9, 0.62, 0.8, 0.42), m: xf(u, o.wallH + 0.46, o.d / 2 - 0.34) });
  }
  for (const [cx, cz, ch] of o.chimneys) trim.push({ g: chimneyGeo(0.48, 0.44, o.wallH + o.roofH + ch), m: xf(cx, 0, cz), c: soot });
  const win = [];
  for (let i = -1; i <= 1; i++) win.push(new T.Vector3(i * o.w * 0.3, o.wallH * 0.55, o.d / 2 + 0.02));
  return {
    wall: mergeGeos(wall), roof: mergeGeos(roof), trim: mergeGeos(trim), meta: o,
    chimneyTops: o.chimneys.map(([cx, cz, ch]) => new T.Vector3(cx, o.wallH + o.roofH + ch, cz)),
    windows: win
  };
}
/* FIX 10: the draft handed chimneyTops (LOCAL to the plot group) straight to
   smoke.addStack(), which writes into a WORLD-space Points cloud on `scene` — every
   plume would have appeared over the map origin. This converts for you. 3 draw calls. */
function addCottage(group, C, mats, smoke, glow) {
  const mk = (g, m) => { const o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; group.add(o); return o; };
  mk(C.wall, mats.wall); mk(C.roof, mats.roof); mk(C.trim, mats.trim);
  group.updateMatrixWorld(true);
  const v = new T.Vector3();
  if (smoke) for (const t of C.chimneyTops) { v.copy(t).applyMatrix4(group.matrixWorld); smoke.addStack(v.x, v.y + 0.2, v.z); }
  if (glow) for (const w of C.windows) { v.copy(w).applyMatrix4(group.matrixWorld); glow.add(v.x, v.y, v.z, 1.5); }
}

/* ----------------------------------------------------------- 6. ATMOSPHERE */
function dustMotes(count, radius) {
  const P = [], S = [], PH = [];
  for (let i = 0; i < count; i++) { P.push((R32() - 0.5) * radius * 2, R32() * 22 - 2, (R32() - 0.5) * radius * 2); S.push(0.5 + R32() * 1.6); PH.push(R32() * 20); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  g.setAttribute('aSize', new T.Float32BufferAttribute(S, 1));
  g.setAttribute('aPhase', new T.Float32BufferAttribute(PH, 1));
  const m = new T.ShaderMaterial({
    uniforms: { uTime: SKY.uTime, uCol: { value: new T.Color(0xfff0c8) }, uPix: { value: 1 } },
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: `attribute float aSize;
attribute float aPhase;
uniform float uTime;
uniform float uPix;
varying float vA;
void main(){
  vec3 p = position;
  p.x += sin(uTime * 0.21 + aPhase) * 1.8;
  p.y += sin(uTime * 0.33 + aPhase * 1.7) * 1.0;
  p.z += cos(uTime * 0.17 + aPhase * 0.6) * 1.8;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dd = -mv.z;
  vA = smoothstep(95.0, 55.0, dd) * smoothstep(5.0, 14.0, dd);
  gl_PointSize = min(24.0, aSize * uPix * (70.0 / max(dd, 1.0)));
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `uniform vec3 uCol;
varying float vA;
void main(){
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(uCol, a * a * vA * 0.5);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
  });
  const pts = new T.Points(g, m); pts.frustumCulled = false; return pts;
}
function windowGlow() {
  const P = [], C = [], S = [], col = new T.Color();
  const api = {
    add(x, y, z, size, hex) { col.set(hex || 0xffcf78); P.push(x, y, z); C.push(col.r, col.g, col.b); S.push(size || 1.6); },
    /* FIX 13: the draft told the integrator to hand-call add() at ~40 window sites buried
       inside spireTower/tower/seven plot builders, with no code to do it. Harvest instead:
       any mesh whose material is in `mats` emits a glow point at its world bbox centre.
       One call after the plots, zero surgery:
           wg.harvest(scene, [windowMat, fireMat], 1.7);  */
    harvest(root, mats, size) {
      const box = new T.Box3(), c = new T.Vector3(), set = new Set(mats);
      root.updateMatrixWorld(true);
      root.traverse(o => {
        if (!o.isMesh || Array.isArray(o.material) || !set.has(o.material)) return;
        box.setFromObject(o); if (box.isEmpty()) return;
        box.getCenter(c); api.add(c.x, c.y, c.z, size || 1.6);
      });
    },
    build(parent, intensity) {
      if (!P.length) return null;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      g.setAttribute('aSize', new T.Float32BufferAttribute(S, 1));
      /* NOTE: `attribute vec3 color;` is declared MANUALLY and that is deliberate — this
         ShaderMaterial leaves vertexColors false, so three does NOT define USE_COLOR and
         does NOT declare it. If you ever set vertexColors:true here you MUST delete that
         line or the shader fails with a duplicate declaration. */
      const m = new T.ShaderMaterial({
        uniforms: { uTime: SKY.uTime, uInt: { value: intensity == null ? 1 : intensity }, uPix: { value: 1 } },
        transparent: true, depthWrite: false, depthTest: true, blending: T.AdditiveBlending,
        vertexShader: `attribute float aSize;
attribute vec3 color;
uniform float uTime;
uniform float uPix;
varying vec3 vC;
varying float vA;
void main(){
  vC = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dd = -mv.z;
  vA = smoothstep(150.0, 60.0, dd) * (0.86 + 0.14 * sin(uTime * 2.3 + position.x * 3.1));
  gl_PointSize = min(48.0, aSize * uPix * (120.0 / max(dd, 1.0)));
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: `varying vec3 vC;
varying float vA;
uniform float uInt;
void main(){
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(0.0, 1.0 - r), 2.6);
  gl_FragColor = vec4(vC, a * vA * uInt);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
      });
      const p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = 3; parent.add(p); return p;
    }
  };
  return api;
}
function smokeSystem(parent, maxStacks, puffsPer) {
  const stacks = [], P = [], PH = [];
  const api = {
    addStack(x, y, z) { const i = stacks.length; if (i >= maxStacks) return; stacks.push(new T.Vector3(x, y, z)); for (let k = 0; k < puffsPer; k++) { P.push(x, y, z); PH.push(k / puffsPer + R32() * 0.05); } },
    build() {
      if (!P.length) return null;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      g.setAttribute('aPhase', new T.Float32BufferAttribute(PH, 1));
      const m = new T.ShaderMaterial({
        uniforms: { uTime: SKY.uTime, uPix: { value: 1 }, uCol: { value: new T.Color(0xd8d4cc) }, uRise: { value: 3.4 }, uWind: { value: SKY.uWind } },
        transparent: true, depthWrite: false,
        vertexShader: `attribute float aPhase;
uniform float uTime;
uniform float uPix;
uniform float uRise;
uniform vec2 uWind;
varying float vA;
void main(){
  float t = fract(uTime * 0.16 + aPhase);
  vec3 p = position;
  p.y += t * uRise;
  p.xz += uWind * t * 2.2 + vec2(sin(t * 9.0 + aPhase * 20.0), cos(t * 7.0 + aPhase * 14.0)) * t * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = (1.0 - t) * smoothstep(0.0, 0.12, t);
  gl_PointSize = min(56.0, (14.0 + t * 46.0) * uPix * (30.0 / max(-mv.z, 1.0)));
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: `uniform vec3 uCol;
varying float vA;
void main(){
  float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(uCol, a * vA * 0.34);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
      });
      const p = new T.Points(g, m); p.frustumCulled = false; parent.add(p); return p;
    }
  };
  return api;
}
/* FIX 14: the draft's sunShafts() was four 42-60 m additive DoubleSide cylinders with
   radii up to 9 m — heavy overdraw on the exact device it calls fill-rate bound, and they
   clip hard through the castle and the rim hills. Deleted. Replaced by the thing the brief
   explicitly asked for and the draft never delivered: a vignette. One fullscreen quad, no
   matrices, no render target, one draw call, multiply-blended over the already-encoded
   frame (so uStr is not linear — tune by eye, same caveat as the contact shadows). */
function vignetteOverlay(strength, warm) {
  const m = new T.ShaderMaterial({
    uniforms: { uStr: { value: strength == null ? 0.55 : strength }, uWarm: { value: new T.Color(warm || 0xffe7c2) } },
    transparent: true, depthTest: false, depthWrite: false,
    blending: T.CustomBlending, blendSrc: T.ZeroFactor, blendDst: T.SrcColorFactor,
    vertexShader: `varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`,
    fragmentShader: `uniform float uStr;
uniform vec3 uWarm;
varying vec2 vUv;
void main(){
  vec2 d = vUv - 0.5;
  float r = dot(d, d) * 2.0;
  float v = 1.0 - uStr * smoothstep(0.18, 1.0, r);
  gl_FragColor = vec4(mix(vec3(v), vec3(v) * uWarm, 0.35), 1.0);
}`
  });
  const q = new T.Mesh(new T.PlaneGeometry(2, 2), m);
  q.frustumCulled = false; q.renderOrder = 9999; return q;
}

/* ------------------------------------------------------------- 7. PER-FRAME */
/* FIX 18: `dt` was unused; `camTarget` was kingdom3d's `const target = Vector3(0,3,2)`,
   which is never mutated, so the dust never moved. Pass camera.position. `uPix` is now
   refreshed every frame so a monitor change / DPR change does not leave stale point sizes. */
function updateDiorama(tm, camPos, motesGroup, pixelRatio, pointMats) {
  SKY.uTime.value = tm;
  SKY.uCloudScroll.value.set(tm * SKY.uWind.x * SKY.uCloudScale.value, tm * SKY.uWind.y * SKY.uCloudScale.value);
  if (motesGroup && camPos) motesGroup.position.set(camPos.x, 0, camPos.z);
  if (pointMats && pixelRatio) for (const m of pointMats) if (m && m.uniforms && m.uniforms.uPix) m.uniforms.uPix.value = pixelRatio;
}

  const create = (container, opts) => {
    if (!T || !window.WebGLRenderingContext) return null;
    opts = opts || {};
    let renderer; try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 400);
    const FX = window.KQ3D; let post = null;
    const REALM = (opts && opts.realm) || 'meadow', isMeadow = REALM === 'meadow'; RICH = RICH_PREF && isMeadow; document.body.classList.toggle('rich', RICH); RIM_MODE = (REALM === 'sky' || REALM === 'cloud' || REALM === 'space') ? 'island' : 'rise'; GROUND_STYLE = REALM; PADH = null; setSpread(isMeadow ? MEADOW_SPREAD : 1);
    const REALM_PAL = { space: { top: 0x02030a, hor: 0x0a0c1e, sun: 0xfff4e6, sunI: 1.9, amb: 0x8a90c0, fog: 0x02030a, grass: 0x9a98a2, grass2: 0x5e5c66 }, fashion: { top: 0x9a7ae0, hor: 0xffd8e4, sun: 0xfff0e8, sunI: 1.6, amb: 0xf8e4f0, fog: 0xfbe6f0, grass: 0xa8d8a0, grass2: 0x86c08a }, sports: { top: 0x2a78e0, hor: 0xd4ecff, sun: 0xfff8e8, sunI: 1.75, amb: 0xd8e8ff, fog: 0xdcefff, grass: 0x74c454, grass2: 0x58a83e }, sky: { top: 0x2f6fd8, hor: 0xc8e6ff, sun: 0xfff6e0, sunI: 1.7, amb: 0xcfe0ff, fog: 0xd8ecff, grass: 0x8fd08a, grass2: 0x66b060 }, cloud: { top: 0xf0b6d8, hor: 0xfff6e6, sun: 0xfff0c0, sunI: 1.5, amb: 0xffe6f2, fog: 0xfff2f8, grass: 0xf4f0fc, grass2: 0xdcd4f4 }, ocean: { top: 0x06285a, hor: 0x1e6a9a, sun: 0x9fe0ff, sunI: 1.1, amb: 0x3a7aa8, fog: 0x0f4a7a, grass: 0xc8b884, grass2: 0x6f9a6a }, pirate: { top: 0x08202a, hor: 0x16505a, sun: 0xd8f4f0, sunI: 1.35, amb: 0x6a9ea4, fog: 0x0e3640, grass: 0x9a8a64, grass2: 0x4a4030 }, skull: { top: 0x0c0816, hor: 0x3a2a4e, sun: 0xd8ccff, sunI: 1.2, amb: 0x6e5e88, fog: 0x1c1028, grass: 0x6a6470, grass2: 0x34303c } };
    const hq = +(new URLSearchParams(location.search).get('hour')), hour = hq >= 0 && hq < 24 && new URLSearchParams(location.search).has('hour') ? hq : new Date().getHours(), night = isMeadow && (hour >= 20 || hour < 6), evening = isMeadow && !night && (hour >= 17 || hour < 7);
    const PAL = REALM_PAL[REALM] ? REALM_PAL[REALM] : night ? { top: 0x0a1540, hor: 0x33508f, sun: 0xb8ccff, sunI: 0.95, amb: 0x5a70b0, fog: 0x22335e, grass: 0x3f7a4a, grass2: 0x2a4a3a }
      : evening ? { top: 0x4a5fb0, hor: 0xffb677, sun: 0xffc48a, sunI: 1.4, amb: 0x8fa0c8, fog: 0xf3c9a0, grass: 0x6ea34f, grass2: 0x4e7d3a }
      : { top: 0x3f86d8, hor: 0xcfe7f7, sun: 0xfff2d0, sunI: 1.6, amb: 0xbfd6ee, fog: 0xd9ecf7, grass: 0x7fbf5a, grass2: 0x5a9642 };
    const GOLD = RICH && isMeadow && !night;   /* late-afternoon sun low behind the hill, warm haze, long shadows toward the viewer */
    if (GOLD) Object.assign(PAL, { top: 0x5a8ed6, hor: 0xffd7a6, sun: 0xffd08a, sunI: 2.72, amb: 0xcfe0ff, fog: 0xdcd8b8, grass: 0x6fae48, grass2: 0x4a8436 });
    const UNDER = REALM === 'pirate' || REALM === 'skull'; const FOG0 = [(night || UNDER ? 42 : GOLD ? 95 : 70) * SPR, (night || UNDER ? 150 : GOLD ? 280 : 230) * SPR]; scene.fog = new T.Fog(PAL.fog, FOG0[0], FOG0[1]); renderer.toneMappingExposure = UNDER ? 1.5 : night ? 1.45 : 1.15;   /* by day the air is clear: the valley reads end to end */
    // ---------- sky ----------
    const sky = new T.Mesh(new T.SphereGeometry(180, 32, 16), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { top: { value: new T.Color(PAL.top) }, hor: { value: new T.Color(PAL.hor) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = normalize(vP).y; float k = smoothstep(-0.05, 0.55, h); gl_FragColor = vec4(mix(hor, top, k), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }));
    scene.add(sky);
    const sun = new T.DirectionalLight(PAL.sun, PAL.sunI * 1.25); sun.position.set(...(GOLD ? [-48, 28, 36] : [38, 40, 26])); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -60 * SPR; sun.shadow.camera.right = 60 * SPR; sun.shadow.camera.top = 60 * SPR; sun.shadow.camera.bottom = -60 * SPR; sun.shadow.camera.far = 140 * SPR; sun.shadow.bias = -0.0008; scene.add(sun);
    const hemiLight = new T.HemisphereLight(PAL.amb, PAL.grass2, night ? 0.85 : 0.95); scene.add(hemiLight); if (GOLD) { hemiLight.intensity = 0.7; hemiLight.groundColor.setHex(0x3f6a2c); }   /* less flat fill: the sun does the work */
    { const bounce = new T.DirectionalLight(0xffe6bf, night ? 0.15 : GOLD ? 0.7 : 0.45); bounce.position.set(...(GOLD ? [40, 18, -44] : [-34, 16, -26])); scene.add(bounce); }   /* golden hour: a low sun from the front-left, a warm rim from behind */
    const sunDisc = new T.Mesh(new T.SphereGeometry(4, 16, 16), new T.MeshBasicMaterial({ color: night ? 0xf4f1e0 : 0xfff3b0, fog: false })); sunDisc.position.set(...(GOLD ? [-120, 40, -150] : [90, night ? 70 : 95, -110])); scene.add(sunDisc);
    if (night) { const g = new T.BufferGeometry(), pts = []; for (let i = 0; i < 500; i++) { const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.3, r = 170; pts.push(r * Math.cos(e) * Math.cos(a), r * Math.sin(e), r * Math.cos(e) * Math.sin(a)); } g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: true, fog: false }))); }
    // clouds
    const clouds = new T.Group(); scene.add(clouds);
    const cloudMat = new T.MeshStandardMaterial({ color: night ? 0x8d97b8 : 0xffffff, roughness: 1, emissive: night ? 0x000000 : 0x777777, emissiveIntensity: 0.4 });
    if (GOLD) { cloudMat.color.setHex(0xfff4ea); cloudMat.emissive.setHex(0xffc89a); cloudMat.emissiveIntensity = 0.32; }
    for (let i = 0; i < (GOLD ? 13 : 9); i++) { const c = new T.Group(); const n = GOLD ? 6 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 3); for (let j = 0; j < n; j++) { const s = new T.Mesh(new T.SphereGeometry((2.2 + Math.random() * 2.2) * (GOLD ? 1.9 : 1), 16, 12), cloudMat); s.position.set(j * 2.6 - n * 1.3 + Math.random(), Math.random() * 0.8, Math.random() * 1.4); s.scale.y = 0.55; c.add(s); } c.position.set((Math.random() - 0.5) * 140, 34 + Math.random() * 14, -40 - Math.random() * 60); if (GOLD) { c.scale.set(1.5, 1.25, 1.2); c.position.y = 30 + Math.random() * 12; c.position.z = -70 - Math.random() * 50; } c.userData.v = 0.2 + Math.random() * 0.4; clouds.add(c); }
    // ---------- procedural textures ----------
    function grassTex() { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#6fae4c'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2600; i++) { const r = 4 + Math.random() * 14; g.fillStyle = ['#5f9e3e', '#7dbb56', '#68a846', '#88c25e', '#578f38'][i % 5]; g.globalAlpha = 0.35 + Math.random() * 0.4; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, r, r * 0.6, Math.random() * 3, 0, 6.28); g.fill(); } g.globalAlpha = 1; for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(40,80,30,0.35)' : 'rgba(200,240,150,0.25)'; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 3); } const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(26, 26); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; return tx; }
    function stoneTex(base, mortar) { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.fillStyle = mortar; g.fillRect(0, 0, 256, 256); const rows = 8, bh = 256 / rows; for (let r = 0; r < rows; r++) { const off = r % 2 ? 24 : 0; for (let x = -48; x < 256; x += 48) { g.fillStyle = base; g.globalAlpha = 0.85 + Math.random() * 0.15; g.fillRect(x + off + 2, r * bh + 2, 44, bh - 4); } } g.globalAlpha = 1; for (let i = 0; i < 1500; i++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.colorSpace = T.SRGBColorSpace; return tx; }
    function shingleTex(base) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (let y = 0; y < 128; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); for (let x = (y / 16) % 2 ? 16 : 0; x < 128; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } } const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(3, 2); tx.colorSpace = T.SRGBColorSpace; return tx; }
    // ---------- terrain: carved heightfield, splat-shaded by slope and height ----------
    SKY.uCloud.value = cloudMaskTex();
    const height = terrainHeight;
    const ground = buildTerrain(night, PAL); ground.receiveShadow = true; scene.add(ground);
    // foliage materials the plot builders still use for bushes and stems
    const trunkMat = new T.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 1 }),
          leafMat = new T.MeshStandardMaterial({ color: night ? 0x1f4a2a : 0x2f7a3f, roughness: 0.9 }),
          leafMat2 = new T.MeshStandardMaterial({ color: night ? 0x274d2a : 0x4c9a4a, roughness: 0.9 });
    // trees are planted after the plots exist, so they can avoid the buildings (see below)
    const reserved = [[0, 0, 12]]; // [x, z, radius] no trees here
    const placeOk = (x, z, r) => reserved.every(([rx, rz, rr]) => Math.hypot(x - rx, z - rz) > rr + r);
    const rockMat = new T.MeshStandardMaterial({ color: 0x8f8a80, roughness: 1 });
    for (let i = 0; i < 26; i++) { const x = (Math.random() - 0.5) * 90 * SPR, z = (Math.random() - 0.5) * 90 * SPR; if (Math.hypot(x, z) < 12 || !placeOk(x, z, 1)) continue; const r = new T.Mesh(new T.DodecahedronGeometry(0.4 + Math.random() * 0.9, 0), rockMat); r.position.set(x, height(x, z) + 0.2, z); r.rotation.set(Math.random(), Math.random(), Math.random()); r.castShadow = true; scene.add(r); }
    { const g = new T.BufferGeometry(), pts = [], cols = [], palette = [0xff6b9d, 0xffd23f, 0xffffff, 0xb388ff, 0xff8c42]; for (let i = 0; i < 1400; i++) { const x = (Math.random() - 0.5) * 95 * SPR, z = (Math.random() - 0.5) * 95 * SPR; if (Math.hypot(x + 22, z - 18) < 8) continue; pts.push(x, height(x, z) + 0.18, z); const c = new T.Color(palette[Math.floor(Math.random() * palette.length)]); cols.push(c.r, c.g, c.b); } g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); scene.add(new T.Points(g, new T.PointsMaterial(Object.assign({ size: 0.28, vertexColors: true, sizeAttenuation: true }, RICH && FX ? { size: 0.55, map: FX.softDot(), transparent: true, depthWrite: false, blending: T.AdditiveBlending } : {}))   /* rich: soft glowing motes, not square confetti */)); }
    let H_water = null;
    // ---------- materials for buildings ----------
    const stoneMat = new T.MeshStandardMaterial({ map: stoneTex('#c4b9a6', '#8f8676'), roughness: 0.9 }), stoneDark = new T.MeshStandardMaterial({ map: stoneTex('#978d7e', '#6f665a'), roughness: 0.95 }), roofMat = new T.MeshStandardMaterial({ map: shingleTex('#a33a2a'), roughness: 0.8 }), roofBlue = new T.MeshStandardMaterial({ color: 0x2b5fa8, roughness: 0.7 }), roofGold = new T.MeshStandardMaterial({ color: 0xd9b45a, roughness: 0.35, metalness: 0.6 }), woodMat = new T.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.9 }), thatch = new T.MeshStandardMaterial({ color: 0xc9a25a, roughness: 1 }), windowMat = new T.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc24a, emissiveIntensity: night ? 1.6 : 0.35 }), glassMat = new T.MeshPhysicalMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0, clearcoat: 1 }), flagRed = new T.MeshStandardMaterial({ color: 0x8e1f2f, side: T.DoubleSide }), flagGold = new T.MeshStandardMaterial({ color: 0xd9b45a, side: T.DoubleSide }), fireMat = new T.MeshBasicMaterial({ color: 0xff8c2a }), crimsonMat = new T.MeshStandardMaterial({ color: 0x8e1f2f, roughness: 0.8 }), blackMat = new T.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.5 }), whiteMat = new T.MeshStandardMaterial({ color: 0xf1e9d6, roughness: 0.5 });
    const box = (w, h, d, m, x, y, z, g) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; (g || scene).add(b); return b; };
    const cyl = (r1, r2, h, m, x, y, z, g, seg) => { const b = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 14), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; (g || scene).add(b); return b; };
    const cone = (r, h, m, x, y, z, g, seg) => { const b = new T.Mesh(new T.ConeGeometry(r, h, seg || 14), m); b.position.set(x, y, z); b.castShadow = true; (g || scene).add(b); return b; };
    const flags = [];
    function flag(x, y, z, g, mat) { const pole = cyl(0.05, 0.05, 1.6, stoneDark, x, y + 0.8, z, g, 6); const f = new T.Mesh(new T.PlaneGeometry(0.9, 0.5), mat || flagRed); f.position.set(x + 0.45, y + 1.35, z); (g || scene).add(f); flags.push(f); return pole; }
    function crenel(g, cx, cy, cz, w, d, n) { for (let i = 0; i < n; i++) { const tx = cx - w / 2 + (i + 0.5) * (w / n); box(w / n * 0.55, 0.45, 0.35, stoneDark, tx, cy, cz - d / 2, g); box(w / n * 0.55, 0.45, 0.35, stoneDark, tx, cy, cz + d / 2, g); } for (let i = 0; i < n; i++) { const tz = cz - d / 2 + (i + 0.5) * (d / n); box(0.35, 0.45, d / n * 0.55, stoneDark, cx - w / 2, cy, tz, g); box(0.35, 0.45, d / n * 0.55, stoneDark, cx + w / 2, cy, tz, g); } }
    // Tiered spire tower: stacked roofs with gallery rings and a finial. This silhouette is what makes
    // the reference castle read as "built" rather than "stacked boxes".
    function spireTower(g, x, z, r, h, tiers, roofMat2, withBanner) {
      roofMat2 = roofMat2 || roofMat; tiers = tiers || 2;
      cyl(r, r * 1.14, h, stoneMat, x, h / 2, z, g, 14);
      cyl(r * 1.3, r * 1.3, 0.3, stoneDark, x, h * 0.55, z, g, 14);          // string course
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(r * 0.16, 0.5, r * 0.16, stoneDark, x + Math.cos(a) * r * 1.02, h * 0.28, z + Math.sin(a) * r * 1.02, g); }  // pilasters
      for (const fy of [h * 0.42, h * 0.72]) { box(r * 0.3, r * 0.5, 0.08, windowMat, x, fy, z + r * 1.02, g); box(r * 0.3, r * 0.5, 0.08, windowMat, x, fy, z - r * 1.02, g); }
      let y = h, rr = r;
      for (let t = 0; t < tiers; t++) {
        const gal = cyl(rr * 1.42, rr * 1.42, 0.34, stoneDark, x, y + 0.17, z, g, 16);           // gallery slab
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; box(0.16, 0.34, 0.16, stoneMat, x + Math.cos(a) * rr * 1.36, y + 0.5, z + Math.sin(a) * rr * 1.36, g); }  // balustrade
        cone(rr * 1.46, rr * 1.9, roofMat2, x, y + 0.34 + rr * 0.95, z, g, 14);                   // flared roof
        y += 0.34 + rr * 1.9 * 0.62; rr *= 0.72;
        if (t < tiers - 1) cyl(rr * 1.05, rr * 1.15, rr * 1.5, stoneMat, x, y + rr * 0.75, z, g, 12), y += rr * 1.5;
      }
      cone(rr * 1.15, rr * 4.2, roofMat2, x, y + rr * 2.1, z, g, 12);                              // the spire itself
      const fy = y + rr * 4.2;
      cyl(0.05, 0.05, 1.5, stoneDark, x, fy + 0.75, z, g, 6);
      const ball = new T.Mesh(new T.SphereGeometry(rr * 0.3, 10, 8), roofGold); ball.position.set(x, fy + 0.2, z); g.add(ball);
      if (withBanner !== false) { const bn = new T.Mesh(new T.PlaneGeometry(1.2, 0.62), flagRed); bn.position.set(x + 0.62, fy + 1.15, z); g.add(bn); flags.push(bn); }
      return fy;
    }
    function tower(g, x, z, r, h, roof, mat) { cyl(r, r * 1.08, h, mat || stoneMat, x, h / 2, z, g, 16); const ring = cyl(r * 1.25, r * 1.25, 0.35, stoneDark, x, h + 0.15, z, g, 16); if (roof === 'cone') cone(r * 1.3, r * 2.2, roofMat, x, h + 0.35 + r * 1.1, z, g, 16); else if (roof === 'gold') cone(r * 1.3, r * 2.6, roofGold, x, h + 0.35 + r * 1.3, z, g, 16); else { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; box(0.3, 0.4, 0.3, stoneDark, x + Math.cos(a) * r * 1.1, h + 0.55, z + Math.sin(a) * r * 1.1, g); } } for (let i = 0; i < 2; i++) box(0.22, 0.5, 0.05, windowMat, x + (i ? r : -r), h * 0.55, z, g); return ring; }
    // ---------- the kid's castle on the mound (10 cumulative stages) ----------
    const castle = new T.Group(); castle.position.y = height(0, 0); scene.add(castle);
    const stages = []; const st = () => { const g = new T.Group(); g.visible = false; castle.add(g); stages.push(g); return g; };
    st(); // 0 meadow: nothing
    { const g = st(); for (let i = 0; i < 5; i++) { const l = cyl(0.12, 0.12, 1.4, woodMat, 0, 0.14, 0, g, 6); l.rotation.z = Math.PI / 2; l.rotation.y = i * 1.25; } const fl = cone(0.5, 1.2, fireMat, 0, 0.7, 0, g, 8); fl.userData.fire = true; const li = new T.PointLight(0xff9a3a, night ? 2.5 : 1.2, 12, 2); li.position.set(0, 1.2, 0); g.add(li); g.userData.light = li; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; box(0.5, 0.35, 0.5, rockMat, Math.cos(a) * 1.1, 0.15, Math.sin(a) * 1.1, g); } }
    { const g = st(); box(2.2, 1.6, 2.2, woodMat, 3.4, 0.8, 1.2, g); cone(1.9, 1.4, thatch, 3.4, 2.3, 1.2, g, 4).rotation.y = Math.PI / 4; box(0.6, 0.9, 0.08, blackMat, 3.4, 0.45, 2.33, g); }
    { const g = st(); box(3.4, 2.2, 2.6, new T.MeshStandardMaterial({ color: 0xe9d9b8, roughness: 0.9 }), -3.6, 1.1, 1.6, g); const roof = new T.Mesh(new T.CylinderGeometry(0, 2.6, 1.6, 4), roofMat); roof.position.set(-3.6, 3.0, 1.6); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.75); roof.castShadow = true; g.add(roof); box(0.5, 1.4, 0.5, stoneDark, -2.6, 3.4, 1.0, g); box(0.7, 1.1, 0.08, woodMat, -3.6, 0.55, 2.93, g); box(0.5, 0.5, 0.06, windowMat, -4.6, 1.4, 2.93, g); box(0.5, 0.5, 0.06, windowMat, -2.6, 1.4, 2.93, g); }
    { const g = st(); spireTower(g, 0, -3.4, 0.95, 5.0, 1); }                                        // 4 watchtower
    { const g = st(); box(5.6, 4.4, 4.4, stoneMat, 0, 2.2, 0, g); crenel(g, 0, 4.6, 0, 5.6, 4.4, 5);   // 5 keep
      for (let i = 0; i < 3; i++) box(0.45, 0.85, 0.06, windowMat, -1.6 + i * 1.6, 2.7, 2.23, g);
      box(1.25, 2.0, 0.12, woodMat, 0, 1.0, 2.23, g);
      const arch = new T.Mesh(new T.TorusGeometry(0.72, 0.16, 8, 16, Math.PI), stoneDark); arch.position.set(0, 2.0, 2.23); g.add(arch); }
    { const g = st(); spireTower(g, -3.7, 2.7, 0.85, 6.2, 2); spireTower(g, 3.7, 2.7, 0.85, 6.2, 2);   // 6 front towers + gatehouse
      box(6.2, 3.0, 0.7, stoneMat, 0, 1.5, 3.0, g); crenel(g, 0, 3.2, 3.0, 6.2, 0.5, 5);
      cyl(0.95, 0.95, 2.4, blackMat, 0, 1.15, 3.05, g, 12).scale.z = 0.3; }
    { const g = st(); spireTower(g, -3.7, -3.5, 0.85, 6.6, 2); spireTower(g, 3.7, -3.5, 0.85, 6.6, 2); // 7 full curtain wall
      box(0.7, 3.0, 6.4, stoneMat, -3.7, 1.5, -0.4, g); box(0.7, 3.0, 6.4, stoneMat, 3.7, 1.5, -0.4, g);
      box(7.8, 3.0, 0.7, stoneMat, 0, 1.5, -3.6, g);
      crenel(g, 0, 3.2, -0.4, 0.5, 6.4, 5); crenel(g, 0, 3.2, -3.6, 7.8, 0.5, 6); }
    { const g = st(); spireTower(g, 0, 0, 1.25, 9.0, 3, roofGold);                                      // 8 the great spire
      for (const [x, z] of [[-2.4, 1.8], [2.4, 1.8]]) spireTower(g, x, z, 0.62, 7.4, 2);
      box(3.0, 0.5, 9.5, stoneDark, 0, 0.25, 8.5, g);                                                   // viaduct deck
      for (let i = 0; i < 4; i++) { const a = new T.Mesh(new T.TorusGeometry(0.85, 0.22, 8, 14, Math.PI), stoneMat); a.rotation.y = Math.PI / 2; a.position.set(0, 0.2, 5.4 + i * 2.1); g.add(a); }
      for (const s of [-1.35, 1.35]) for (let i = 0; i < 9; i++) box(0.18, 0.6, 0.18, stoneMat, s, 0.8, 4.6 + i * 1.1, g); }
    { const g = st();                                                                                    // 9 the kingdom: banners, glow, fireworks
      for (const [x, z] of [[-3.7, 2.7], [3.7, 2.7], [-3.7, -3.5], [3.7, -3.5]]) { const bn = new T.Mesh(new T.PlaneGeometry(1.1, 2.4), flagGold); bn.position.set(x, 4.6, z + 0.9); g.add(bn); flags.push(bn); }
      for (let i = 0; i < 3; i++) { const b = new T.Mesh(new T.PlaneGeometry(1.0, 2.2), i === 1 ? flagGold : flagRed); b.position.set(-2 + i * 2, 1.7, 3.36); g.add(b); }
      const glow = new T.PointLight(0xffd08a, 3.2, 26, 2); glow.position.set(0, 7, 0); g.add(glow);
      for (let i = 0; i < 46; i++) { const s = new T.Mesh(new T.SphereGeometry(0.09, 6, 6), new T.MeshBasicMaterial({ color: [0xffd23f, 0xff6b9d, 0xffffff, 0x7fd8ff][i % 4] })); s.position.set((Math.random() - 0.5) * 14, 5 + Math.random() * 12, (Math.random() - 0.5) * 14); s.userData.spark = Math.random() * 6.28; g.add(s); } }
    // collected treasures appear on pedestals ringing the castle — the kid's trophies, in the world
    const ornaments = new T.Group(); scene.add(ornaments);
    /* an atlas icon as a sprite (the 3D-rendered game icons) — never a system emoji */
    function emojiSprite(e) { const tx = window.KQ && KQ.iconTexture ? KQ.iconTexture(e) : null; if (!tx) return null; const sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, alphaTest: 0.02 })); sp.scale.set(2.2, 2.2, 1); return sp; }
    function setItems(list) {
      ornaments.clear();
      (list || []).slice(0, 16).forEach((it, i, arr) => {
        const a = i / arr.length * Math.PI * 2 + 0.4, r = 13 + (i % 2) * 1.6, x = Math.cos(a) * r, z = Math.sin(a) * r, y = height(x, z);
        const ped = new T.Mesh(new T.CylinderGeometry(0.5, 0.62, 0.6, 10), stoneMat); ped.position.set(x, y + 0.3, z); ped.castShadow = true; ped.receiveShadow = true; ornaments.add(ped);
        const cap = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.12, 10), stoneDark); cap.position.set(x, y + 0.66, z); ornaments.add(cap);
        const md = window.KQ3D ? KQ3D.medallion(it.e || it, { r: 0.62, depth: 0.14 }) : emojiSprite(it.e || it); if (md) { md.traverse(o => { o.castShadow = false; }); md.position.set(x, y + 1.7, z); md.userData.bob = i; md.userData.spin = 0.6 + (i % 3) * 0.15; md.userData.noMerge = true; ornaments.add(md); }
      });
    }
    let stage = 0; function setStage(n) { stage = Math.max(0, Math.min(stages.length - 1, n | 0)); stages.forEach((g, i) => { g.visible = i <= stage; }); }
    // ---------- worlds: buildings you can tap ----------
    const pickables = [], anchors = [];
    const CLASSIC = new Set(['math', 'reading', 'chess', 'clock', 'market', 'memory', 'logic', 'story', 'spelling', 'scrolls', 'music', 'art', 'nature', 'timemachine', 'explore', 'kindness']);   /* the meadow's worlds: every other realm has its own games (realm-*.js) */
    /* ?look=rich: a clearing round each landmark that has a real model, and a wider one on the side it faces, so no tree stands in front of it */
    const RICH_CLEAR = { chess: [[0, 0, 9.5], [0, 9, 8]], door: [[0, 0, 7], [0, 6, 5]], fairy: [[0, 0, 5.5], [0, 5, 4.5]], kindness: [[0, 0, 6], [0, 5, 4.5]],
      spelling: [[0, 0, 4.5], [0, 4, 4]], well: [[0, 0, 6], [0, 6, 6], [2, 9, 5]], story: [[0, 0, 5], [0, 5, 4.5]], gate: [[0, 0, 5], [0, 5, 4.5]] };
    const plot = (id, x, z, build, opts2) => { const p = SPX(x, z); return plotAt(id, p[0], p[1], build, opts2); };   /* every caller writes the old numbers (the realms, the arcade and the rocket too); plotAt() takes the map's own */
    function plotAt(id, x, z, build, opts2) { if (!isMeadow && CLASSIC.has(id)) { reserved.push([x, z, 6.5]); return new T.Group(); }   /* the spot stays clear for the realm's own scenery */ const g = new T.Group(); const y = height(x, z); g.position.set(x, y, z); g.userData = { id, soon: !!(opts2 && opts2.soon), base: y }; reserved.push([x, z, 5]); if (RICH && isMeadow && LANDMARK_MODELS) for (const [dx, dz, r] of (RICH_CLEAR[id] || [[0, 0, 5], [0, 5.5, 5], [0, 10, 4.5]])) {   /* every place: no tree on the side facing the camera */ reserved.push([x + dx, z + dz, r]); for (const o of scene.children.slice()) if (o.isMesh && o.geometry && o.geometry.type === 'DodecahedronGeometry' && Math.hypot(o.position.x - x - dx, o.position.z - z - dz) < r) scene.remove(o); }   /* loose boulders were scattered before the plots were known */ build(g); g.traverse(o => { if (o.isMesh) { o.userData.plot = g; pickables.push(o); } }); scene.add(g); g.userData.top = (opts2 && opts2.labelH) || 6; anchors.push({ g, id, soon: g.userData.soon, h: g.userData.top }); return g; }
    plot('math', -20, -12, g => { cyl(1.5, 1.7, 7, new T.MeshStandardMaterial({ map: stoneTex('#d5dbe6', '#9aa3b3'), roughness: 0.8 }), 0, 3.5, 0, g, 16); cone(2.2, 3.0, roofBlue, 0, 8.5, 0, g, 16); for (let i = 0; i < 3; i++) box(0.5, 0.8, 0.06, windowMat, Math.cos(i * 1.57) * 1.55, 2.3 + i * 1.6, Math.sin(i * 1.57) * 1.55, g).rotation.y = -i * 1.57; flag(0, 10.0, 0, g, roofBlue); const ring = cyl(2.0, 2.0, 0.4, stoneDark, 0, 7.1, 0, g, 16); for (const [sym, i] of [['+', 0], ['×', 1], ['÷', 2], ['−', 3]]) { const c = document.createElement('canvas'); c.width = c.height = 64; const cx = c.getContext('2d'); cx.fillStyle = '#ffd23f'; cx.font = '900 54px Georgia'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(sym, 32, 34); const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true })); sp.position.set(Math.cos(i * 1.57) * 3.2, 4 + i * 1.0, Math.sin(i * 1.57) * 3.2); sp.scale.set(1.3, 1.3, 1); sp.userData.orbit = i; g.add(sp); } box(1.0, 1.8, 0.1, woodMat, 0, 0.9, 1.72, g); }, { labelH: 11 });
    plot('reading', 22, -10, g => { const glass = box(6, 3.2, 4.2, glassMat, 0, 1.7, 0, g); glass.castShadow = false; const roof = new T.Mesh(new T.CylinderGeometry(0, 4.4, 2.2, 4), glassMat); roof.position.set(0, 4.4, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.7); g.add(roof); for (let i = 0; i < 6; i++) box(0.12, 3.2, 0.12, whiteMat, -3 + i * 1.2, 1.7, 2.1, g); const bedMat = new T.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 1 }); for (let r = 0; r < 2; r++) box(5, 0.3, 1.2, bedMat, 0, 0.35, -1 + r * 2, g); const petal = [0xff6b9d, 0xffd23f, 0xff8c42, 0xb388ff, 0xffffff]; for (let i = 0; i < 26; i++) { const f = new T.Mesh(new T.SphereGeometry(0.28, 8, 6), new T.MeshStandardMaterial({ color: petal[i % 5], roughness: 0.6 })); f.position.set(-2.2 + (i % 9) * 0.55, 0.75 + Math.random() * 0.2, -1 + Math.floor(i / 9) * 1 + (i % 2) * 0.5); g.add(f); const s = cyl(0.03, 0.03, 0.5, leafMat2, f.position.x, 0.55, f.position.z, g, 5); } const arch = new T.Mesh(new T.TorusGeometry(1.6, 0.16, 8, 20, Math.PI), whiteMat); arch.position.set(0, 0.2, 3.4); g.add(arch); for (let i = 0; i < 3; i++) { const s = new T.Mesh(new T.SphereGeometry(0.6 + i * 0.2, 8, 6), leafMat); s.position.set(-4.2 - i * 0.2, 0.6 + i * 0.7, 2.6); g.add(s); } }, { labelH: 7 });
    plot('chess', 6, 19, g => { const c = document.createElement('canvas'); c.width = c.height = 256; const cx = c.getContext('2d'); for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) { cx.fillStyle = (r + q) % 2 ? '#3a2a24' : '#efe1c4'; cx.fillRect(q * 32, r * 32, 32, 32); } const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; const board = new T.Mesh(new T.BoxGeometry(5.2, 0.3, 5.2), new T.MeshStandardMaterial({ map: tex, roughness: 0.5 })); board.position.y = 0.3; board.receiveShadow = true; board.castShadow = true; g.add(board); const frame = box(5.9, 0.28, 5.9, woodMat, 0, 0.14, 0, g); const piece = (x, z, m, h) => { cyl(0.42, 0.55, 0.25, m, x, 0.58, z, g, 14); cyl(0.2, 0.36, h, m, x, 0.58 + h / 2, z, g, 12); const top = new T.Mesh(new T.SphereGeometry(0.34, 12, 10), m); top.position.set(x, 0.58 + h + 0.2, z); top.castShadow = true; g.add(top); }; piece(-1.4, 1.2, whiteMat, 1.2); piece(1.2, -1.3, blackMat, 1.5); piece(1.6, 1.5, whiteMat, 0.9); tower(g, -3.6, -3.4, 0.8, 4.4, 'cone', crimsonMat); tower(g, 3.6, -3.4, 0.8, 4.4, 'cone', crimsonMat); box(6.4, 2.2, 0.5, stoneMat, 0, 1.1, -3.4, g); crenel(g, 0, 2.3, -3.4, 6.4, 0.3, 6); flag(-3.6, 5.5, -3.4, g); flag(3.6, 5.5, -3.4, g); }, { labelH: 7.5 });
    // coming soon: signposts with little placeholder builds
    const soonMat = new T.MeshStandardMaterial({ color: 0x9a8a72, roughness: 1 });
    function signpost(g, text) { cyl(0.08, 0.1, 2.2, woodMat, 0, 1.1, 2.8, g, 6); box(2.0, 0.7, 0.1, woodMat, 0, 2.0, 2.8, g); }
    plot('clock', -36, 6, g => { box(2.2, 6.5, 2.2, soonMat, 0, 3.25, 0, g); cone(1.8, 1.8, roofMat, 0, 7.4, 0, g, 4).rotation.y = Math.PI / 4; const face = new T.Mesh(new T.CircleGeometry(0.8, 24), whiteMat); face.position.set(0, 5.4, 1.12); g.add(face); box(0.08, 0.6, 0.02, blackMat, 0, 5.65, 1.14, g); box(0.5, 0.08, 0.02, blackMat, 0.2, 5.4, 1.14, g); signpost(g); }, { labelH: 9 });
    plot('market', 36, 9, g => { box(4.4, 0.4, 2.6, woodMat, 0, 1.0, 0, g); for (const x of [-2, 2]) cyl(0.08, 0.08, 3.2, woodMat, x, 1.6, -1.2, g, 6); const c = document.createElement('canvas'); c.width = 128; c.height = 32; const cx = c.getContext('2d'); for (let i = 0; i < 8; i++) { cx.fillStyle = i % 2 ? '#8e1f2f' : '#f4e8cf'; cx.fillRect(i * 16, 0, 16, 32); } const aw = new T.Mesh(new T.PlaneGeometry(4.8, 2.4), new T.MeshStandardMaterial({ map: new T.CanvasTexture(c), side: T.DoubleSide, roughness: 1 })); aw.position.set(0, 3.0, -0.2); aw.rotation.x = -0.5; g.add(aw); for (let i = 0; i < 6; i++) { const p = new T.Mesh(new T.SphereGeometry(0.24, 8, 6), new T.MeshStandardMaterial({ color: [0x9b5de5, 0x00bbf9, 0xfee440, 0xf15bb5][i % 4], roughness: 0.3 })); p.position.set(-1.6 + i * 0.64, 1.45, 0.4); g.add(p); } signpost(g); }, { labelH: 5.5 });
    plot('memory', -20, 29, g => { const hill = new T.Mesh(new T.SphereGeometry(4.2, 16, 12), new T.MeshStandardMaterial({ color: PAL.grass2, roughness: 1 })); hill.position.y = -0.6; hill.scale.y = 0.7; hill.receiveShadow = true; g.add(hill); const mouth = new T.Mesh(new T.CircleGeometry(1.4, 20), blackMat); mouth.position.set(0, 1.0, 3.9); g.add(mouth); for (let i = 0; i < 4; i++) { const cr = new T.Mesh(new T.OctahedronGeometry(0.35, 0), new T.MeshStandardMaterial({ color: 0x7fd8ff, emissive: 0x3aa0ff, emissiveIntensity: 0.6, roughness: 0.2 })); cr.position.set(-1.3 + i * 0.9, 0.5, 4.3); g.add(cr); } signpost(g); }, { labelH: 5 });
    plot('logic', 28, 25, g => { for (const x of [-1.6, 1.6]) box(1.0, 4.6, 1.0, stoneMat, x, 2.3, 0, g); const arch = new T.Mesh(new T.TorusGeometry(1.6, 0.4, 8, 20, Math.PI), stoneMat); arch.position.set(0, 4.6, 0); arch.castShadow = true; g.add(arch); const gem = new T.Mesh(new T.OctahedronGeometry(0.5, 0), new T.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffa000, emissiveIntensity: 0.5 })); gem.position.set(0, 6.6, 0); gem.userData.spin = true; g.add(gem); signpost(g); }, { labelH: 8 });
    plot('story', -3, 36, g => { box(3.6, 2.4, 3.0, stoneDark, 0, 1.2, 0, g); const roof = new T.Mesh(new T.CylinderGeometry(0, 2.9, 1.5, 4), blackMat); roof.position.set(0, 3.1, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.8); g.add(roof); box(0.7, 2.0, 0.7, stoneDark, 1.2, 3.6, -0.6, g); const glow = box(1.2, 1.0, 0.1, new T.MeshBasicMaterial({ color: 0xff8c2a }), 0, 0.7, 1.52, g); glow.castShadow = false; const li = new T.PointLight(0xff9a3a, 1.5, 8, 2); li.position.set(0, 1, 2); g.add(li); const smoke = []; for (let i = 0; i < 5; i++) { const s = new T.Mesh(new T.SphereGeometry(0.25 + i * 0.08, 8, 6), new T.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: 0.5, roughness: 1 })); s.position.set(1.2, 4.8 + i * 0.6, -0.6); s.userData.smoke = i; g.add(s); } signpost(g); }, { labelH: 7 });
    // the old well: a red sign begs not to be pressed. Pressing it flips the meadow into the demon lands.
    plot('well', -12, 24, g => { const ring = new T.Mesh(new T.CylinderGeometry(1.3, 1.4, 1.1, 14, 1, true), stoneMat); ring.position.y = 0.55; ring.material.side = T.DoubleSide; g.add(ring); const rim = new T.Mesh(new T.TorusGeometry(1.32, 0.16, 8, 18), stoneDark); rim.rotation.x = Math.PI / 2; rim.position.y = 1.1; g.add(rim); const dark = new T.Mesh(new T.CircleGeometry(1.15, 14), new T.MeshBasicMaterial({ color: 0x050308 })); dark.rotation.x = -Math.PI / 2; dark.position.y = 0.6; g.add(dark);
      for (const x of [-1.1, 1.1]) cyl(0.09, 0.09, 2.6, woodMat, x, 1.9, 0, g, 6); box(2.8, 0.12, 0.12, woodMat, 0, 3.2, 0, g); const roof = cone(1.9, 1.0, roofMat, 0, 3.75, 0, g, 4); roof.rotation.y = Math.PI / 4; const bucket = cyl(0.22, 0.18, 0.3, woodMat, 0, 2.2, 0, g, 8); bucket.userData.bob = 3;
      const sign = box(1.6, 1.0, 0.1, new T.MeshStandardMaterial({ color: 0xc0101a, emissive: 0xff1a1a, emissiveIntensity: 0.55, roughness: 0.5 }), 2.2, 1.6, 0.8, g); sign.rotation.y = -0.5; cyl(0.07, 0.07, 1.4, woodMat, 2.2, 0.6, 0.8, g, 6); { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff6e0'; x.font = '900 110px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 64, 70); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const mk = new T.Mesh(new T.PlaneGeometry(0.8, 0.8), new T.MeshBasicMaterial({ map: tx, transparent: true })); mk.position.set(2.2, 1.6, 0.86); mk.rotation.y = -0.5; g.add(mk); } }, { labelH: 5 });
    plot('pond', -46, 12, g => { const water = new T.MeshStandardMaterial({ color: 0x3f86c4, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }), lily = new T.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.9 }), reed = new T.MeshStandardMaterial({ color: 0x6f8a2e, roughness: 1 }); cyl(4.6, 5.0, 0.35, water, 0, 0.1, 0, g, 22); cyl(5.3, 5.6, 0.3, stoneMat, 0, -0.02, 0, g, 22); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.4, r = 1.3 + (i % 3) * 0.9; cyl(0.45, 0.45, 0.06, lily, Math.cos(a) * r, 0.3, Math.sin(a) * r, g, 8); } for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 4.9; cyl(0.06, 0.08, 1.6 + (i % 3) * 0.5, reed, Math.cos(a) * r, 0.9, Math.sin(a) * r, g, 5); } box(0.12, 2.2, 0.12, woodMat, 3.2, 1.1, 3.6, g); const sign = box(1.6, 0.9, 0.12, woodMat, 3.2, 2.4, 3.6, g); sign.rotation.y = -0.6; const gear = new T.Mesh(new T.TorusGeometry(0.55, 0.16, 8, 8), new T.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.3, metalness: 0.8 })); gear.position.set(0, 1.4, 0); gear.userData.spin = true; g.add(gear); }, { labelH: 5 });
    plot('glory', 46, -14, g => {   /* moved off the river line (2026-09-20): the boat used to sail straight into the rock */ const rock = new T.MeshStandardMaterial({ color: 0x77736c, roughness: 1 }), rock2 = new T.MeshStandardMaterial({ color: 0x8a857c, roughness: 1 }), snow = new T.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.9 }); cone(14, 26, rock, 0, 13, 0, g, 9); cone(9, 17, rock2, 7, 8.5, 5, g, 8); cone(7, 12, rock2, -7, 6, 6, g, 8); cone(4.6, 7.5, snow, 0, 22.5, 0, g, 9); cone(2.8, 4.5, snow, 7, 15.4, 5, g, 8); box(1.6, 2.2, 0.8, woodMat, 0, 1.1, 13.6, g); box(0.5, 0.5, 0.5, new T.MeshBasicMaterial({ color: 0xffd080 }), 0, 1.5, 14.0, g); flag(0, 26, 0, g); }, { labelH: 27 });
    plot('scrolls', -32, -14, g => { box(3.8, 2.6, 3.0, stoneMat, 0, 1.3, 0, g); cone(3.0, 1.7, roofMat, 0, 3.45, 0, g, 4).rotation.y = Math.PI / 4; box(1.1, 1.5, 0.25, woodMat, 0, 0.75, 1.55, g); for (const x of [-1.2, 1.2]) box(0.7, 0.9, 0.1, windowMat, x, 1.6, 1.52, g); const book = box(1.7, 0.28, 1.2, new T.MeshStandardMaterial({ color: 0x8a2a2a, roughness: 0.7 }), 0, 4.5, 0, g); book.rotation.y = 0.4; box(1.5, 0.12, 1.05, new T.MeshStandardMaterial({ color: 0xf3ead2, roughness: 1 }), 0, 4.7, 0, g).rotation.y = 0.4; });
    plot('gate', 18, 4, g => { const ringM = new T.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xffb040, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.5 }); const ring = new T.Mesh(new T.TorusGeometry(2.6, 0.32, 10, 36), ringM); ring.position.y = 3.4; ring.userData.gateSpin = true; ring.userData.noMerge = true; g.add(ring); const disc = new T.Mesh(new T.CircleGeometry(2.3, 32), new T.MeshBasicMaterial({ color: REALM === 'ocean' ? 0x9fe0ff : 0x8fd0ff, transparent: true, opacity: 0.45, side: T.DoubleSide, depthWrite: false })); disc.position.y = 3.4; disc.userData.gateGlow = true; disc.userData.noMerge = true; g.add(disc); for (let i = 0; i < 3; i++) { const st = box(1.6 - i * 0.2, 0.3, 1.0, stoneMat, 0, 0.15 + i * 0.32, 2.6 - i * 0.9, g); } for (const sx of [-2.4, 2.4]) { cyl(0.22, 0.28, 3.2, stoneMat, sx, 1.6, 0, g, 8); const o = new T.Mesh(new T.OctahedronGeometry(0.35, 0), new T.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x5ac8fa, emissiveIntensity: 1 })); o.position.set(sx, 3.6, 0); o.userData.spin = true; o.userData.noMerge = true; g.add(o); } }, { labelH: 7 });
    plot('spelling', 17, 32, g => { for (let i = 0; i < 4; i++) cyl(0.9 - i * 0.12, 1.0 - i * 0.12, 0.5, new T.MeshStandardMaterial({ color: 0xe8b83a, roughness: 0.8 }), 0, 0.5 + i * 0.5, 0, g, 12); const hole = new T.Mesh(new T.CircleGeometry(0.22, 12), blackMat); hole.position.set(0, 0.6, 0.98); g.add(hole); for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.SphereGeometry(0.12, 6, 5), new T.MeshStandardMaterial({ color: 0xffd23f })); b.position.set((Math.random() - 0.5) * 3, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 3); b.userData.bee = Math.random() * 6.28; g.add(b); } signpost(g); }, { labelH: 4.5 });
    /* Heart Garden (2026-10-03): flower beds round a heart-shaped arch, a bench for two, butterflies of colour — kindness grows here */
    plot('kindness', -6, 14, g => { const sph = (r, m, x, y, z, gg) => { const b = new T.Mesh(new T.SphereGeometry(r, 10, 8), m); b.position.set(x, y, z); (gg || scene).add(b); return b; };
      const pink = new T.MeshStandardMaterial({ color: 0xff6a9a, emissive: 0xc0396b, emissiveIntensity: 0.35, roughness: 0.5 }), leaf = new T.MeshStandardMaterial({ color: 0x4ab04a, roughness: 0.9 }), soil = new T.MeshStandardMaterial({ color: 0x6a4426, roughness: 1 }), wood = new T.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.7 });
      const hs = new T.Shape(); hs.moveTo(0, -1.4); hs.bezierCurveTo(-2.6, 0.2, -1.6, 2.2, 0, 1.0); hs.bezierCurveTo(1.6, 2.2, 2.6, 0.2, 0, -1.4);
      const heart = new T.Mesh(new T.ExtrudeGeometry(hs, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 20 }), pink); heart.position.set(0, 3.6, -0.18); heart.userData.noMerge = true; heart.userData.glowPulse = 1; g.add(heart);
      for (const sx of [-1.5, 1.5]) cyl(0.14, 0.16, 3.2, wood, sx, 1.6, 0, g, 8);
      const COLS = [0xff5a8a, 0xffb43c, 0xffd84a, 0xb48cff, 0x5ab0ff, 0xff7a5a];
      for (const [bx, bz] of [[-3.2, 1.4], [3.2, 1.4], [-3.0, -1.8], [3.0, -1.8]]) { cyl(1.2, 1.3, 0.35, soil, bx, 0.18, bz, g, 14); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, r = 0.75, x = bx + Math.cos(a) * r, z = bz + Math.sin(a) * r; cyl(0.03, 0.03, 0.6, leaf, x, 0.6, z, g, 4); sph(0.2, new T.MeshStandardMaterial({ color: COLS[(k + (bx > 0 ? 2 : 0)) % COLS.length], roughness: 0.5 }), x, 0.95, z, g); } sph(0.24, new T.MeshStandardMaterial({ color: 0xffe08a, roughness: 0.4 }), bx, 0.95, bz, g); }
      box(2.0, 0.12, 0.55, wood, 0, 0.55, 2.6, g); box(2.0, 0.6, 0.1, wood, 0, 0.9, 2.85, g); for (const sx of [-0.85, 0.85]) box(0.12, 0.5, 0.5, wood, sx, 0.28, 2.6, g);
    });
    /* World Explorer (2026-10-03): a little harbour across the river — a wooden dock, a sailboat, a striped lighthouse and a big globe on a stand */
    plot('explore', -18, -32, g => { const sph = (r, m, x, y, z, gg, ws, hs) => { const b = new T.Mesh(new T.SphereGeometry(r, ws || 16, hs || 12), m); b.position.set(x, y, z); b.castShadow = true; (gg || scene).add(b); return b; };
      const plank = new T.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.8 }), white = new T.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.6 }), red = new T.MeshStandardMaterial({ color: 0xd8303a, roughness: 0.6 }), sea = new T.MeshStandardMaterial({ color: 0x2f7ad0, roughness: 0.4, metalness: 0.1 }), land = new T.MeshStandardMaterial({ color: 0x5ab04a, roughness: 0.8 }), brass = new T.MeshStandardMaterial({ color: 0xc8963e, metalness: 0.9, roughness: 0.3 });
      g.rotation.y = 2.8;
      box(5.6, 0.25, 1.6, plank, 0, 0.45, 2.2, g); for (const x of [-2.4, -0.8, 0.8, 2.4]) cyl(0.12, 0.12, 1.0, plank, x, 0.1, 2.9, g, 6);
      const boat = new T.Group(); boat.position.set(1.2, 0.4, 3.9); g.add(boat); box(2.4, 0.5, 0.9, plank, 0, 0, 0, boat); cyl(0.05, 0.05, 2.6, plank, 0, 1.4, 0, boat, 6); const sail = new T.Mesh(new T.ShapeGeometry(new T.Shape([new T.Vector2(0, 0), new T.Vector2(1.3, 0), new T.Vector2(0, 2.1)])), new T.MeshStandardMaterial({ color: 0xfff8ec, side: T.DoubleSide })); sail.position.set(0.05, 0.4, 0); boat.add(sail);
      for (let i = 0; i < 5; i++) cyl(0.7 - i * 0.07, 0.75 - i * 0.07, 0.9, i % 2 ? red : white, -2.6, 0.55 + i * 0.9, -0.6, g, 14);
      cyl(0.5, 0.5, 0.6, new T.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xffd040, emissiveIntensity: 0.8 }), -2.6, 5.2, -0.6, g, 12); cone(0.6, 0.6, red, -2.6, 5.8, -0.6, g, 12);
      cyl(0.08, 0.1, 1.6, brass, 1.6, 0.8, -0.6, g, 8); const globe = sph(1.0, sea, 1.6, 2.4, -0.6, g); globe.userData.spin = true; globe.userData.noMerge = true;
      for (const [x, y, z, r] of [[0.55, 0.35, 0.65, 0.42], [-0.5, 0.3, 0.7, 0.36], [0.1, -0.5, 0.8, 0.3], [-0.6, -0.2, -0.7, 0.4]]) { const c = sph(r, land, x, y, z, globe, 10, 8); c.scale.set(1, 0.7, 0.45); c.lookAt(0, 0, 0); }
      const ring = new T.Mesh(new T.TorusGeometry(1.12, 0.05, 6, 32), brass); ring.position.set(1.6, 2.4, -0.6); ring.rotation.y = Math.PI / 2; g.add(ring);
    });
    /* Time Machine (2026-10-03): a round stone platform with a glowing portal ring, a clock face in its middle and brass gears turning */
    plot('timemachine', 32, -3, g => { const brass = new T.MeshStandardMaterial({ color: 0xc8963e, metalness: 0.9, roughness: 0.3 }), glowM = new T.MeshStandardMaterial({ color: 0xb48cff, emissive: 0x8a5aff, emissiveIntensity: 0.9, roughness: 0.3 }), face = new T.MeshStandardMaterial({ color: 0xf6eedc, roughness: 0.6 });
      g.rotation.y = -0.6;
      cyl(3.2, 3.5, 0.5, stoneMat, 0, 0.25, 0, g, 24); cyl(2.6, 2.6, 0.2, stoneDark, 0, 0.6, 0, g, 24);
      for (const sx of [-2.3, 2.3]) box(0.6, 4.2, 0.6, stoneMat, sx, 2.6, 0, g);
      const ring = new T.Mesh(new T.TorusGeometry(2.0, 0.28, 12, 48), glowM); ring.position.set(0, 3.0, 0); ring.userData.gateSpin = true; ring.userData.noMerge = true; g.add(ring);
      const inner = new T.Mesh(new T.CircleGeometry(1.75, 40), new T.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.35, side: T.DoubleSide })); inner.position.set(0, 3.0, 0); g.add(inner);
      const dial = new T.Mesh(new T.CircleGeometry(0.75, 32), face); dial.position.set(0, 3.0, 0.05); g.add(dial); const back = dial.clone(); back.rotation.y = Math.PI; back.position.z = -0.05; g.add(back);
      for (const z of [0.08, -0.08]) { box(0.06, 0.55, 0.02, blackMat, 0, 3.22, z, g); const mh = box(0.05, 0.4, 0.02, blackMat, 0.14, 3.0, z, g); mh.rotation.z = -1.1; }
      for (const [x, y, r] of [[-2.9, 1.4, 0.7], [2.9, 1.8, 0.55], [2.6, 4.9, 0.45]]) { const gr = new T.Mesh(new T.TorusGeometry(r, r * 0.22, 6, 14), brass); gr.position.set(x, y, 0.4); g.add(gr); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box(r * 0.3, r * 0.3, r * 0.2, brass, x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15, 0.4, g).rotation.z = a; } }
    });
    /* Nature Trail (2026-10-03): a log-cabin ranger station under a great oak, a little pond with lily pads and a trail sign */
    plot('nature', -26, -1, g => { const sph = (r, m, x, y, z, gg) => { const b = new T.Mesh(new T.SphereGeometry(r, 12, 10), m); b.position.set(x, y, z); b.castShadow = true; (gg || scene).add(b); return b; }; const log = new T.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 }), logD = new T.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.9 }), roofG = new T.MeshStandardMaterial({ color: 0x3a6a2a, roughness: 0.9 }), leafM = new T.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.9 }), leafL = new T.MeshStandardMaterial({ color: 0x5aaa48, roughness: 0.9 });
      g.rotation.y = 0.9;
      for (let i = 0; i < 6; i++) { const lg = cyl(0.22, 0.22, 4.4, i % 2 ? log : logD, 0, 0.35 + i * 0.42, -1.5, g, 10); lg.rotation.z = Math.PI / 2; const lg2 = cyl(0.22, 0.22, 3.0, i % 2 ? logD : log, -2.1, 0.35 + i * 0.42, 0, g, 10); lg2.rotation.x = Math.PI / 2; const lg3 = cyl(0.22, 0.22, 3.0, i % 2 ? logD : log, 2.1, 0.35 + i * 0.42, 0, g, 10); lg3.rotation.x = Math.PI / 2; }
      box(4.0, 2.4, 0.2, log, 0, 1.4, 1.45, g); box(1.0, 1.6, 0.1, logD, 0, 0.95, 1.56, g); box(0.8, 0.7, 0.08, windowMat, -1.3, 1.6, 1.56, g); box(0.8, 0.7, 0.08, windowMat, 1.3, 1.6, 1.56, g);
      for (const sd of [-1, 1]) { const rf = box(2.7, 0.15, 3.8, roofG, sd * 1.15, 3.35, 0, g); rf.rotation.z = -sd * 0.55; }
      /* the great oak */
      cyl(0.45, 0.7, 4.2, logD, 3.8, 2.1, -1.8, g, 10); for (const [x, y, z, r] of [[3.8, 5.2, -1.8, 2.0], [2.8, 4.6, -1.2, 1.4], [4.8, 4.8, -2.4, 1.5], [3.6, 6.2, -2.2, 1.3]]) sph(r, r > 1.6 ? leafM : leafL, x, y, z, g);
      /* the pond and a trail sign */
      const water = new T.Mesh(new T.CircleGeometry(1.5, 24), new T.MeshStandardMaterial({ color: 0x3f86c4, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 })); water.rotation.x = -Math.PI / 2; water.position.set(-3.6, 0.12, 2.2); g.add(water);
      for (const [x, z] of [[-3.2, 1.8], [-4.1, 2.6], [-3.4, 2.9]]) cyl(0.32, 0.32, 0.03, leafL, x, 0.15, z, g, 10);
      cyl(0.07, 0.08, 1.8, logD, 2.6, 0.9, 2.8, g, 6); const sign = box(1.4, 0.45, 0.08, log, 2.6, 1.6, 2.8, g); sign.rotation.y = -0.3;
    });
    /* Art Studio (2026-10-03): a white gallery with a glass skylight, a giant easel outside showing a real painting (The Starry Night), paint pots and splashes */
    plot('art', -28, 18, g => { const wall = new T.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 0.7 }), trim = new T.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.5 }), wood = new T.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.6 });
      g.rotation.y = 0.55;
      box(6.4, 0.3, 5.0, stoneMat, 0, 0.15, 0, g); box(5.6, 3.2, 4.2, wall, 0, 1.9, 0, g); box(5.9, 0.25, 4.5, trim, 0, 3.6, 0, g);
      const sky = new T.Mesh(new T.CylinderGeometry(0, 2.6, 1.4, 4), glassMat); sky.position.set(0, 4.4, 0); sky.rotation.y = Math.PI / 4; sky.scale.set(1, 1, 0.75); g.add(sky);
      box(1.2, 2.0, 0.1, trim, 0, 1.3, 2.12, g); for (const x of [-1.9, 1.9]) box(1.0, 1.2, 0.08, windowMat, x, 2.2, 2.12, g);
      /* the giant easel with The Starry Night */
      const e = new T.Group(); e.position.set(3.9, 0.3, 2.4); e.rotation.y = -0.5; g.add(e);
      for (const sx of [-0.7, 0.7]) { const leg = box(0.12, 4.0, 0.12, wood, sx, 2.0, 0, e); leg.rotation.z = -sx * 0.1; } const bk = box(0.12, 3.8, 0.12, wood, 0, 1.9, -0.7, e); bk.rotation.x = -0.25; box(2.0, 0.12, 0.3, wood, 0, 1.6, 0.1, e);
      const canvasM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }); const cnv = box(2.2, 1.75, 0.08, canvasM, 0, 2.6, 0.08, e);
      try { new T.TextureLoader().load('shared/art/starry-night.webp', tx => { tx.colorSpace = T.SRGBColorSpace; canvasM.map = tx; canvasM.needsUpdate = true; }); } catch (err) {}
      /* paint pots and splashes on the ground */
      [[0xe3262e, -3.6, 1.6], [0xf7d038, -3.2, 2.4], [0x2a62d0, -2.6, 1.9]].forEach(([c, x, z]) => { const m = new T.MeshStandardMaterial({ color: c, roughness: 0.35 }); cyl(0.32, 0.28, 0.5, new T.MeshStandardMaterial({ color: 0xc8c8d0, metalness: 0.6, roughness: 0.4 }), x, 0.55, z, g, 12); cyl(0.29, 0.29, 0.04, m, x, 0.81, z, g, 12); const sp = new T.Mesh(new T.CircleGeometry(0.6, 10), m); sp.rotation.x = -Math.PI / 2; sp.position.set(x + 0.5, 0.32, z + 0.4); sp.scale.set(1, 0.7, 1); g.add(sp); });
    });
    /* Music Hall (2026-10-03): a little concert hall — cream walls, a portico of white columns, a red roof, a rose window and a golden lyre on the gable */
    plot('music', -17, 7, g => { const cream = new T.MeshStandardMaterial({ color: 0xf2e6cf, roughness: 0.75 }), red = new T.MeshStandardMaterial({ color: 0x9a1e2e, roughness: 0.6 }), goldM = new T.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.9, roughness: 0.3, emissive: 0x6a4008, emissiveIntensity: 0.35 });
      g.rotation.y = 0.35;
      box(7.2, 0.35, 6.2, stoneMat, 0, 0.18, 0, g); box(6.6, 0.3, 5.6, stoneMat, 0, 0.5, 0, g);
      box(5.6, 3.6, 4.0, cream, 0, 2.45, -0.6, g);
      const roofShape = new T.Shape(); roofShape.moveTo(-3.3, 0); roofShape.lineTo(3.3, 0); roofShape.lineTo(0, 1.9); roofShape.lineTo(-3.3, 0);
      const roof = new T.Mesh(new T.ExtrudeGeometry(roofShape, { depth: 5.6, bevelEnabled: false }), red); roof.position.set(0, 4.25, -3.0); roof.castShadow = true; g.add(roof);
      const ped = new T.Mesh(new T.ExtrudeGeometry(roofShape, { depth: 0.3, bevelEnabled: false }), cream); ped.position.set(0, 4.25, 2.3); ped.scale.set(0.98, 0.95, 1); g.add(ped);
      box(6.8, 0.3, 1.6, cream, 0, 4.12, 1.85, g);
      for (const x of [-2.4, -0.8, 0.8, 2.4]) { cyl(0.22, 0.26, 3.4, whiteMat, x, 2.35, 2.1, g, 14); box(0.62, 0.18, 0.62, whiteMat, x, 0.73, 2.1, g); box(0.62, 0.18, 0.62, whiteMat, x, 4.0, 2.1, g); }
      box(1.3, 2.2, 0.12, woodMat, 0, 1.75, 1.42, g); for (const x of [-2.0, 2.0]) box(0.8, 1.4, 0.1, windowMat, x, 2.6, 1.42, g);
      const rose = new T.Mesh(new T.CircleGeometry(0.55, 24), windowMat); rose.position.set(0, 4.9, 2.62); g.add(rose); const rr = new T.Mesh(new T.TorusGeometry(0.58, 0.06, 6, 24), goldM); rr.position.set(0, 4.9, 2.63); g.add(rr);
      /* the golden lyre on the ridge */
      const ly = new T.Group(); ly.position.set(0, 6.0, 2.2); ly.scale.setScalar(1.7); g.add(ly);
      for (const sd of [-1, 1]) { const arm = new T.Mesh(new T.TorusGeometry(0.55, 0.07, 8, 18, Math.PI * 0.9), goldM); arm.position.set(sd * 0.32, 0.55, 0); arm.rotation.z = sd > 0 ? -0.15 : Math.PI + 0.15; arm.scale.set(0.6, 1.25, 1); ly.add(arm); }
      box(1.1, 0.1, 0.1, goldM, 0, 1.25, 0, ly); box(0.9, 0.16, 0.16, goldM, 0, 0.0, 0, ly);
      for (let k = 0; k < 5; k++) cyl(0.012, 0.012, 1.2, whiteMat, -0.3 + k * 0.15, 0.62, 0.02, ly, 4);
      ly.userData.spin = 0.4;
    });
    /* ---------- the realm's own places: every realm beyond the meadow brings four games of its own (realm-*.js) ---------- */
    const landFx = [];
    if (!isMeadow && window.KQRealms) { try { KQRealms.landmarks(REALM, { T, scene, REALM, plot, height, box, cyl, cone, flag, R32, placeOk, reserved, PAL, night, FX, stoneMat, stoneDark, roofMat, woodMat, windowMat, whiteMat, blackMat, glassMat, fx: f => landFx.push(f) }); } catch (e) { console.error('realm landmarks', e); } }
    /* the Games Arcade floats over the hill in every world, the meadow too (shared/arcade.js) */
    if (window.KQArcade) { try { KQArcade.plot({ T, scene, REALM, plot, height, box, cyl, cone, PAL, FX, fx: f => landFx.push(f) }); } catch (e) { console.error('arcade', e); } }
    /* the rocket to space stands on its pad in the meadow, and on the Moon-rock in Space for the way home (shared/rocket.js) */
    if (window.KQRocket) { try { KQRocket.plot({ T, scene, REALM, plot, height, fx: f => landFx.push(f) }); } catch (e) { console.error('rocket', e); } }
    // river + bridge, roads, fences, windmill, sheep
    // ---------- water: trimmed mesh, depth-tinted, with a foam shoreline ----------
    const water = buildWater(night, PAL, sun.position); if (REALM === 'ocean' || REALM === 'space') water.visible = false; else scene.add(water);   /* Space: the river bed is a dry canyon, like a rille on the Moon */
    if (REALM === 'cloud' && water.material.uniforms) { water.material.uniforms.uShallow.value.setHex(0xbfe8ff); water.material.uniforms.uDeep.value.setHex(0x8fb8ff); }
    if (REALM === 'sky' && water.material.uniforms) { water.material.uniforms.uShallow.value.setHex(0x7fd0ff); water.material.uniforms.uDeep.value.setHex(0x2a7ad0); }
    {
      // the bridge sits where the main road crosses the channel
      const bx = 2 * SPR, bz = riverZ(bx); const br = new T.Group(); br.position.set(bx, WATER_Y + 0.35, bz); scene.add(br);
      const deck = new T.Mesh(new T.BoxGeometry(3.4, 0.35, 11), stoneDark); deck.position.y = 0.55; deck.castShadow = true; deck.receiveShadow = true; br.add(deck);
      const arch = new T.Mesh(new T.TorusGeometry(2.3, 0.45, 8, 22, Math.PI), stoneMat); arch.rotation.y = Math.PI / 2; arch.position.y = 0.3; br.add(arch);
      for (const s of [-1.55, 1.55]) for (let i = 0; i < 7; i++) { const post = new T.Mesh(new T.BoxGeometry(0.22, 0.8, 0.22), stoneDark); post.position.set(s, 1.1, -4.2 + i * 1.4); br.add(post); const rail = new T.Mesh(new T.BoxGeometry(0.12, 0.14, 1.4), stoneMat); rail.position.set(s, 1.45, -3.5 + i * 1.4); br.add(rail); }
    }
    if (isMeadow) { const fenceMat = new T.MeshStandardMaterial({ color: 0x9a6b3a, roughness: 1 }); const fence = (x1, z1, x2, z2) => { const n = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.6)); for (let i = 0; i <= n; i++) { const tt = i / n, x = x1 + (x2 - x1) * tt, z = z1 + (z2 - z1) * tt; const post = new T.Mesh(new T.BoxGeometry(0.16, 1.0, 0.16), fenceMat); post.position.set(x, height(x, z) + 0.5, z); scene.add(post); if (i < n) { const nx = x1 + (x2 - x1) * (i + 1) / n, nz = z1 + (z2 - z1) * (i + 1) / n; const rail = new T.Mesh(new T.BoxGeometry(Math.hypot(nx - x, nz - z), 0.1, 0.08), fenceMat); rail.position.set((x + nx) / 2, height((x + nx) / 2, (z + nz) / 2) + 0.75, (z + nz) / 2); rail.rotation.y = -Math.atan2(nz - z, nx - x); scene.add(rail); } } }; const fo = SPX(15, -8), ox = fo[0] - 15, oz = fo[1] + 8; fence(9 + ox, -3 + oz, 21 + ox, -3 + oz); fence(21 + ox, -3 + oz, 21 + ox, -13 + oz); fence(9 + ox, -13 + oz, 9 + ox, -3 + oz); }   /* the pen moves out whole */
    if (isMeadow) { const wm = new T.Group(); const [wx, wz] = SPX(30, -8); wm.position.set(wx, height(wx, wz), wz); scene.add(wm); const body = new T.Mesh(new T.CylinderGeometry(1.4, 2.0, 6, 10), stoneMat); body.position.y = 3; body.castShadow = true; wm.add(body); const cap = new T.Mesh(new T.ConeGeometry(1.8, 1.6, 10), roofMat); cap.position.y = 6.8; wm.add(cap); const hub = new T.Group(); hub.position.set(0, 5.6, 2.1); wm.add(hub); for (let i = 0; i < 4; i++) { const bl = new T.Mesh(new T.PlaneGeometry(0.9, 4.2), new T.MeshStandardMaterial({ color: 0xf4ecd8, side: T.DoubleSide, roughness: 0.9 })); bl.position.y = 2.1; const piv = new T.Group(); piv.rotation.z = i * Math.PI / 2; piv.add(bl); hub.add(piv); } hub.userData.mill = true; }
    // ---------- fauna: sheep that graze and wander, horse herds that gallop past now and then, monkeys that hop between trees, big butterflies up close ----------
    const fauna = { sheep: [], horses: [], monkeys: [], flies: [], herd: null, nextHerd: 25 + Math.random() * 30, treeSpots: [] };
    const dry = (x, z) => terrainHeight(x, z) > WATER_Y + 0.4 && pathDist(x, z) > 1.8 && placeOk(x, z, 1.2);
    const face = new T.MeshStandardMaterial({ color: 0x2a2320, roughness: 1 });
    { const wool = new T.MeshStandardMaterial({ color: 0xf5f1e8, roughness: 1 });
      for (let i = 0; i < 9; i++) { let x, z; do { x = (-40 + Math.random() * 18) * SPR; z = Math.random() * 16 * SPR; } while (!dry(x, z)); const s = new T.Group(); s.position.set(x, height(x, z) + 0.45, z); s.rotation.y = Math.random() * 6.28;
        const bd = new T.Mesh(new T.SphereGeometry(0.55, 10, 8), wool); bd.scale.set(1.3, 1, 1); bd.castShadow = true; s.add(bd); const hd = new T.Mesh(new T.SphereGeometry(0.26, 8, 6), face); hd.position.set(0.72, 0.15, 0); s.add(hd);
        const legs = []; for (const [lx, lz] of [[-0.35, -0.25], [-0.35, 0.25], [0.35, -0.25], [0.35, 0.25]]) { const lg = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.5, 5), face); lg.position.set(lx, -0.45, lz); s.add(lg); legs.push(lg); }
        s.userData = { head: hd, legs, target: null, wait: Math.random() * 6, phase: Math.random() * 6 }; scene.add(s); fauna.sheep.push(s); } }
    // a low-poly horse in one of three coats; six live in a pool and only appear as a running herd
    function horse(coat) { const g = new T.Group(), mat = new T.MeshStandardMaterial({ color: coat, roughness: 0.85 }), mane = new T.MeshStandardMaterial({ color: coat === 0xf2eee6 ? 0xd8cfbf : 0x1a1410, roughness: 1 });
      const body = new T.Mesh(new T.BoxGeometry(2.2, 1.0, 0.9), mat); body.position.y = 1.35; body.castShadow = true; g.add(body);
      const neck = new T.Mesh(new T.BoxGeometry(0.5, 1.1, 0.5), mat); neck.position.set(1.05, 2.05, 0); neck.rotation.z = -0.5; g.add(neck);
      const head = new T.Mesh(new T.BoxGeometry(0.85, 0.45, 0.42), mat); head.position.set(1.65, 2.45, 0); g.add(head);
      const mn = new T.Mesh(new T.BoxGeometry(0.9, 0.5, 0.18), mane); mn.position.set(0.85, 2.25, 0); mn.rotation.z = -0.5; g.add(mn);
      const tail = new T.Mesh(new T.BoxGeometry(0.2, 1.0, 0.2), mane); tail.position.set(-1.15, 1.2, 0); tail.rotation.z = 0.5; g.add(tail);
      const legs = []; for (const [lx, lz] of [[0.75, -0.3], [0.75, 0.3], [-0.75, -0.3], [-0.75, 0.3]]) { const lg = new T.Mesh(new T.BoxGeometry(0.24, 1.3, 0.24), mat); lg.position.set(lx, 0.65, lz); g.add(lg); legs.push(lg); }
      g.userData = { legs, body, k: Math.random() * 6 }; g.visible = false; scene.add(g); return g; }
    for (const coat of [0x7a4a22, 0xf2eee6, 0x1e1a18, 0x5a3416, 0xf2eee6, 0x2b2420]) fauna.horses.push(horse(coat));
    // monkeys live in the canopy; tree positions are noted while the forest is planted (below)
    function monkey() { const g = new T.Group(), fur = new T.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 1 }), skin = new T.MeshStandardMaterial({ color: 0xd9b28a, roughness: 1 });
      const b = new T.Mesh(new T.SphereGeometry(0.42, 10, 8), fur); b.position.y = 0.5; g.add(b); const h = new T.Mesh(new T.SphereGeometry(0.3, 10, 8), fur); h.position.set(0.15, 1.05, 0); g.add(h); const f = new T.Mesh(new T.SphereGeometry(0.19, 8, 6), skin); f.position.set(0.36, 1.02, 0); g.add(f);
      for (const lz of [-0.32, 0.32]) { const ear = new T.Mesh(new T.SphereGeometry(0.1, 6, 5), skin); ear.position.set(0.1, 1.15, lz); g.add(ear); const arm = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.8, 5), fur); arm.position.set(0.1, 0.35, lz); arm.rotation.z = 0.5; g.add(arm); }
      const tail = new T.Mesh(new T.TorusGeometry(0.35, 0.06, 6, 12, Math.PI * 1.3), fur); tail.position.set(-0.4, 0.55, 0); g.add(tail);
      g.userData = { from: null, to: null, t: 1, wait: 4 + Math.random() * 10 }; scene.add(g); return g; }
    // big butterflies: two flapping wings, bright, only opaque when the camera is near
    const flyGeo = new T.PlaneGeometry(0.9, 1.1);
    for (let i = 0; i < 22; i++) { const col = [0xff9f1c, 0x4cc9f0, 0xf72585, 0xffd166, 0x9b5de5, 0x80ed99][i % 6]; const mat = new T.MeshStandardMaterial({ color: col, side: T.DoubleSide, transparent: true, opacity: 0, emissive: col, emissiveIntensity: 0.25, roughness: 0.8 });
      const g = new T.Group(); const L = new T.Mesh(flyGeo, mat), R = new T.Mesh(flyGeo, mat); L.position.x = -0.45; R.position.x = 0.45; L.rotation.y = 0.4; R.rotation.y = -0.4; const wl = new T.Group(), wr = new T.Group(); wl.add(L); wr.add(R); g.add(wl); g.add(wr);
      let x, z; do { x = (Math.random() - 0.5) * 70 * SPR; z = (Math.random() - 0.5) * 70 * SPR; } while (!dry(x, z) || Math.hypot(x, z) < 14);
      g.position.set(x, height(x, z) + 1.4 + Math.random() * 1.6, z); g.userData = { wl, wr, mat, k: Math.random() * 6, cx: x, cz: z, r: 3 + Math.random() * 5, h: g.position.y, v: 0.25 + Math.random() * 0.35 }; scene.add(g); fauna.flies.push(g); }
    // ---------- helpers for the secret places ----------
    const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o || {}));
    const glowMat = (c, i) => new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i == null ? 0.8 : i, roughness: 0.5 });
    function softTex(inner, outer) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return tx; }
    const SOFT_WHITE = softTex('rgba(255,255,255,0.95)', 'rgba(255,255,255,0)'), SOFT_GOLD = softTex('rgba(255,236,170,1)', 'rgba(255,210,120,0)');
    const flame = (g, x, y, z, sc) => { const k = Math.random() * 6; const f = cone(0.5 * sc, 1.3 * sc, new T.MeshBasicMaterial({ color: 0xff8c1a }), x, y + 0.65 * sc, z, g, 7); f.userData.flame = k; f.userData.noMerge = true; f.castShadow = false; const f2 = cone(0.26 * sc, 0.85 * sc, new T.MeshBasicMaterial({ color: 0xfff2b0 }), x, y + 0.45 * sc, z, g, 7); f2.userData.flame = k + 1.3; f2.userData.noMerge = true; f2.castShadow = false; const gl = new T.Sprite(new T.SpriteMaterial({ map: SOFT_GOLD, transparent: true, opacity: 0.55, depthWrite: false })); gl.scale.set(3.2 * sc, 3.2 * sc, 1); gl.position.set(x, y + 0.9 * sc, z); gl.userData.flameGlow = k; g.add(gl); return f; };
    /* the hosts of the secret places stand at their places as small 3D figures (the same cast the rooms use), built when the place opens */
    let MINI_MAT = null;
    /* a figure for the meadow: the same cast, flattened into one vertex-coloured mesh (one draw call) plus its glassy parts */
    function castMini(id) { if (!window.KQCast) return null; try { const c = KQCast.build(id, { lod: 0.34 }); const lights = []; c.root.traverse(o => { if (o.isLight) lights.push(o); }); for (const l of lights) l.removeFromParent();
        const inner = c.root.children[0]; inner.updateMatrixWorld(true); const inv = new T.Matrix4().copy(inner.matrixWorld).invert(), parts = [], victims = [];
        inner.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material) || o.material.transparent || !o.visible) return; let hidden = false, p = o.parent; while (p && p !== inner) { if (!p.visible) { hidden = true; break; } p = p.parent; } if (hidden) return; const m = o.material; const col = new T.Color(m.userData.tint != null ? m.userData.tint : m.color); if (m.emissive && m.emissiveIntensity > 1) col.copy(m.emissive).multiplyScalar(1.4); parts.push({ g: o.geometry, m: new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), c: col }); victims.push(o); });
        for (const v of victims) v.removeFromParent();
        if (parts.length) { MINI_MAT = MINI_MAT || new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05 }); const merged = new T.Mesh(mergeGeos(parts), MINI_MAT); inner.add(merged); }
        c.root.traverse(o => { if (o.isMesh) { o.userData.noMerge = true; o.castShadow = false; } }); return c; } catch (e) { console.error('cast', id, e); return null; } }
    function ensureHost(g) { const H = g.userData.hostSpec; if (!H || g.userData.hosted) return; g.userData.hosted = true; const c = castMini(H.id); if (!c) return; const s = H.sc / 3.0; c.root.scale.setScalar(s); c.root.position.set(H.x, H.y - H.sc * 0.5 + (c.float ? 0.4 * s : 0), H.z); c.root.rotation.y = (Math.abs(H.x) + Math.abs(H.z) > 0.5) ? Math.atan2(H.x, H.z) : 0; c.root.userData.baseY = c.root.position.y; if (c.float) c.root.userData.hostBob = Math.random() * 6; else { c.root.userData.castIdle = Math.random() * 6; c.root.userData.ry = c.root.rotation.y; } g.add(c.root); c.root.traverse(o => { if (o.isMesh) { o.userData.plot = g; pickables.push(o); } }); if (FX) FX.envStrength(c.root, night ? 0.35 : 0.3); }
    function fishMesh() { const f = new T.Group(); const m = new T.MeshPhysicalMaterial({ color: 0x9ab8c8, metalness: 0.4, roughness: 0.25, clearcoat: 1 }); const b = new T.Mesh(new T.SphereGeometry(0.5, 24, 16), m); b.scale.set(1.6, 0.8, 0.45); f.add(b); const t = new T.Mesh(new T.ConeGeometry(0.34, 0.5, 16), m); t.rotation.z = Math.PI / 2; t.position.x = -0.95; t.scale.z = 0.3; f.add(t); const e = new T.Mesh(new T.SphereGeometry(0.07, 12, 8), new T.MeshBasicMaterial({ color: 0x101010 })); e.position.set(0.5, 0.1, 0.2); f.add(e); f.rotation.z = 0.5; return f; }
    const host = (g, e, x, y, z, sc) => { const id = g.userData && g.userData.id;
      if (e === '🐟') { const f = fishMesh(); f.position.set(x, y, z); f.userData.hostBob = Math.random() * 6; f.userData.baseY = y; g.add(f); return f; }
      if (e === '💀') { const k = skullMesh(); k.scale.setScalar((sc || 0.8) * 0.9); k.position.set(x, y, z); k.rotation.y = 0.4; g.add(k); return k; }
      if (id && window.KQCast) { g.userData.hostSpec = { id, x, y, z, sc: sc || 2.8 }; return null; }
      const sp = emojiSprite(e); if (!sp) return null; sp.scale.set(sc || 2.8, sc || 2.8, 1); sp.position.set(x, y, z); sp.userData.hostBob = Math.random() * 6; sp.userData.baseY = y; g.add(sp); return sp; };
    const pulse = (m) => { m.userData.glowPulse = Math.random() * 6; m.userData.noMerge = true; return m; };
    const spot = (x, z, r) => { r = r || 3; const ok = (a, b) => terrainHeight(a, b) > WATER_Y + 0.6 && pathDist(a, b) > 2.2 && placeOk(a, b, r) && Math.abs(b - riverZ(a)) > riverW(a) + 7; if (ok(x, z)) return [x, z]; for (let d = 2; d <= 12; d += 2) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (Math.hypot(px, pz) < 51 * SPR && ok(px, pz)) return [px, pz]; } return [x, z]; };
    const portalGroups = new Map();
    function portal(id, x, z, h, build, fixed) { const p = SPX(x, z), q = fixed ? p : spot(p[0], p[1]); const g = plotAt(id, q[0], q[1], build, { labelH: h }); g.visible = false; portalGroups.set(id, g); return g; }
    const leafDark = M(0x3f8f3a), leafLight = M(0x6fbf4a), goldMat = glowMat(0xf2c14e, 0.35), mushRed = M(0xd23c2a), cream = M(0xf1e4c8), boulderMat = M(0x8a8378, { flatShading: true }), waterMat = M(0x3f86c4, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 });

    /* the Eagle's Nest (Yoni 2026-10-10: "make it across multiple valleys where you can fly around with that eagle … if you turn left, you're
       always going to see … an eagle ride"): out on the left of every valley a tall rock, a great nest of sticks on top and the eagle sitting
       in it. Tap it: the hub shows the map of the valleys, the eagle takes off with you, three questions on the way, and you land in the
       valley you chose (index.html: openNest, startTrip). It is placed before the secret places, so they make room for it */
    const NEST = { g: null, bird: null, y: 0, yaw: 0, state: 'perch', t: 0, cb: null, wp: new T.Vector3() };
    if (window.KQEagle) { const q = spot(...SPX(-45, -2), 6); NEST.g = plotAt('eyrie', q[0], q[1], g => {
        const cool = REALM === 'space' || REALM === 'skull' || REALM === 'ocean' || REALM === 'pirate', rockA = new T.MeshStandardMaterial({ color: cool ? 0x8a8794 : 0x8f8375, roughness: 0.95, flatShading: true }), rockB = new T.MeshStandardMaterial({ color: cool ? 0x6e6b78 : 0x766a5c, roughness: 0.95, flatShading: true });
        for (const [r, h, y, x, z, k] of [[3.7, 3.6, 1.2, 0, 0, 0], [2.9, 3.2, 3.9, 0.3, -0.2, 1], [2.3, 2.6, 6.1, -0.2, 0.15, 2], [1.4, 1.6, 2.2, 3.1, 1.4, 3], [1.1, 1.2, 1.0, -3.0, 1.8, 4]]) {
          const m = new T.Mesh(new T.DodecahedronGeometry(1, 0), k % 2 ? rockB : rockA); m.scale.set(r, h * 0.55, r * 0.92); m.position.set(x, y, z); m.rotation.y = k * 0.83; m.castShadow = true; m.receiveShadow = true; g.add(m); }
        const ny = 7.55, twig = new T.MeshStandardMaterial({ color: 0x8a6034, roughness: 1 }), twigD = new T.MeshStandardMaterial({ color: 0x5e3f22, roughness: 1 }), stick = new T.CylinderGeometry(0.07, 0.09, 1, 5);
        const bowl = new T.Mesh(new T.CylinderGeometry(2.05, 1.35, 0.75, 20), twigD); bowl.position.y = ny; bowl.castShadow = true; g.add(bowl);
        const down = new T.Mesh(new T.CircleGeometry(1.75, 20), new T.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 1 })); down.rotation.x = -Math.PI / 2; down.position.y = ny + 0.38; g.add(down);   /* soft down inside */
        for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 4 + R32() * 0.4, rr = 1.95 + R32() * 0.35, len = 1.3 + R32() * 1.0, s2 = new T.Mesh(stick, i % 3 ? twig : twigD);
          s2.scale.set(1, len, 1); s2.position.set(Math.cos(a) * rr, ny + 0.05 + (i % 5) * 0.11, Math.sin(a) * rr); s2.rotation.set(0, -a, Math.PI / 2 + (R32() - 0.5) * 0.5); s2.castShadow = true; g.add(s2); }   /* sticks laid round the rim, crossing */
        const b = KQEagle.build(T); b.root.rotation.order = 'YXZ'; b.root.scale.setScalar(1.35); NEST.y = ny + 1.05; b.root.position.set(0, NEST.y, 0);
        NEST.yaw = Math.atan2(22 * CAMR - q[0], 69 * CAMR - q[1]); b.root.rotation.set(-0.5, NEST.yaw, 0); g.add(b.root); NEST.bird = b; if (REALM === 'space' && KQEagle.helmet) KQEagle.helmet(T, b);   /* in Space it wears its helmet */   /* it sits up and looks out toward where the camera starts */
        g.userData.fly = { focus: 8.6, dist: 21, up: 3, dir: [-q[0], -q[1]] };   /* seen from the valley's side, where nothing stands in front of it */
      }, { labelH: 13.5 }); landFx.push((dt, tm) => updateNest(dt, tm)); }
    /* take off from the nest: the camera flies to it, the eagle spreads its wings and climbs; cb (the hub's warp into the sky) runs on the way up */
    function nestTakeoff(cb) { if (!NEST.bird || NEST.state !== 'perch' || fly.on || ride.on || EG.board) return false; NEST.state = 'wait';
      if (!flyTo('eyrie', () => { NEST.state = 'up'; NEST.t = 0; NEST.cb = cb; })) { NEST.state = 'perch'; return false; } return true; }
    /* arriving by eagle: the view opens close on the nest, from the valley's side, as the eagle comes down out of the sky and settles in it;
       then the view pulls back over the valley */
    function nestLand() { if (!NEST.bird || !NEST.g) { arrive(); return; } NEST.state = 'down'; NEST.t = 0; const p = NEST.g.position, th = Math.atan2(VIEW.home.x - p.x, VIEW.home.z - p.z);
      VIEW.to.set(p.x, p.y + 8, p.z); target.copy(VIEW.to); arrive({ sweep: orbit.tTheta - th, phi: 0.95, radius: 32, dur: 3.6, hold: 3.4 });
      setTimeout(() => { if (!VIEW.on) VIEW.to.copy(VIEW.home); }, 3600); }
    /* a trip that did not happen (the map closed, the ride left early): back in the nest, the camera back over the valley */
    function nestReset() { if (!NEST.bird) return; NEST.state = 'perch'; NEST.cb = null; const r = NEST.bird.root; r.position.set(0, NEST.y, 0); r.rotation.set(-0.5, NEST.yaw, 0); r.visible = true; if (fly.on) flyBack(); }
    /* the nest when it is off the screen (Yoni 2026-10-10: "make the nest easier to find on the phone"): its tag waits at the screen's edge
       on the side where the nest is, an arrow pointing the way; tapping it opens the map of the valleys, like the nest itself */
    function updateNestPin() { const L = labels.get('eyrie'); if (!NEST.g || !L) return;
      if (!NEST.pin) { const p = document.createElement('button'); p.type = 'button'; p.className = 'nestpin'; p.hidden = true; const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
        svg.setAttribute('viewBox', '0 0 12 12'); svg.setAttribute('aria-hidden', 'true'); path.setAttribute('d', 'M8 2 L3.5 6 L8 10'); svg.appendChild(path); p.appendChild(svg);
        const e = document.createElement('span'); e.className = 'e'; const ic = window.KQ && KQ.icon ? KQ.icon('eagle') : null; if (ic) e.appendChild(ic); p.appendChild(e); const b = document.createElement('b'); p.appendChild(b); NEST.pinB = b;
        p.onclick = ev => { ev.stopPropagation(); if (opts.onPick) opts.onPick('eyrie'); }; container.appendChild(p); NEST.pin = p; }
      const nm = names.eyrie ? names.eyrie.name : ''; if (NEST.pinB.textContent !== nm) NEST.pinB.textContent = nm;
      const show = !!nm && !L.hidden && L.style.opacity === '0' && !arr && !fly.on && !ride.on && !EG.board && !VIEW.on && !placing && !realm.demon;
      if (NEST.pin.hidden === show) NEST.pin.hidden = !show; if (!show) return;
      v3.set(NEST.g.position.x, NEST.g.position.y + 8, NEST.g.position.z).applyMatrix4(camera.matrixWorldInverse); NEST.pin.classList.toggle('right', v3.x > 0); }
    function updateNest(dt) { const B = NEST.bird; if (!B) return; const r = B.root;
      if (NEST.state === 'perch' || NEST.state === 'wait') { B.update(dt, 'perch'); return; }
      NEST.t += dt; const t = NEST.t;
      if (NEST.state === 'up') { B.update(dt, 'flap'); const fx2 = Math.sin(NEST.yaw), fz2 = Math.cos(NEST.yaw); r.position.set(fx2 * t * t * 2.4, NEST.y + t * 2.2 + t * t * 2.6, fz2 * t * t * 2.4); r.rotation.x += (-0.12 - r.rotation.x) * Math.min(1, dt * 3);
        r.getWorldPosition(NEST.wp); fly.look.lerp(NEST.wp, Math.min(1, dt * 4));   /* the camera keeps the eagle in view as it climbs */
        if (t > 1.5 && NEST.cb) { const cb = NEST.cb; NEST.cb = null; cb(); } if (t > 6) r.visible = false; return; }
      if (NEST.state === 'down') { const D = 3.2, k = Math.min(1, t / D), e = 1 - Math.pow(1 - k, 3), fx2 = Math.sin(NEST.yaw), fz2 = Math.cos(NEST.yaw); r.visible = true;
        r.position.set(fx2 * (1 - e) * 26, NEST.y + (1 - e) * 30, fz2 * (1 - e) * 26); r.rotation.y = NEST.yaw + Math.PI * (1 - e) * 0.25; r.rotation.x = k < 0.85 ? -0.1 : -0.5; B.update(dt, k < 0.55 ? 'glide' : k < 0.97 ? 'flap' : 'perch');
        if (k >= 1) { NEST.state = 'perch'; r.position.set(0, NEST.y, 0); r.rotation.set(-0.5, NEST.yaw, 0); } } }

    // ---------- the twenty secret places (ten are open at any time; the hub decides which, at random) ----------
    // 1. the wizard's fire on the flat summit of the castle crag, the big green hill in the middle of the meadow
    { const g = portal('fire', 0, 0, 7, g => { cyl(2.6, 3.0, 0.5, boulderMat, 0, 0.25, 0, g, 12); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const r = new T.Mesh(new T.DodecahedronGeometry(0.5, 0), boulderMat); r.position.set(Math.cos(a) * 1.6, 0.7, Math.sin(a) * 1.6); g.add(r); } for (const a of [0.3, 1.4, 2.6]) { const l = cyl(0.13, 0.13, 2.0, trunkMat, 0, 0.75, 0, g, 6); l.rotation.z = Math.PI / 2; l.rotation.y = a; } flame(g, 0, 0.8, 0, 2.2); host(g, '🧙', 2.6, 2.4, 1.6, 3.4); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; const lg = cyl(0.5, 0.6, 0.4, trunkMat, Math.cos(a) * 3.6, 0.2, Math.sin(a) * 3.6, g, 8); } const l = new T.PointLight(0xff9a40, 1.8, 18); l.position.set(0, 2.4, 0); l.userData.flameLight = 1; g.add(l); }, true); g.userData.fly = { focus: 1.6, dist: 12, up: 4 }; }
    // 2. the round green door at the foot of the mountain (a dwarf mine behind it)
    portal('door', 9.5, 10.5, 8, g => { const d = new T.Group(); d.rotation.y = 0.74; g.add(d); const mound = new T.Mesh(new T.SphereGeometry(5.2, 18, 12), M(0x5f9a3c)); mound.scale.set(1, 0.7, 1); mound.position.y = -0.4; d.add(mound); const dirt = new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 0.3, 20), M(0x7b5a3a)); dirt.rotation.x = Math.PI / 2; dirt.position.set(0, 2.2, 3.7); d.add(dirt); const door = new T.Mesh(new T.CylinderGeometry(2.4, 2.4, 0.35, 24), M(0x2f7a3a, { roughness: 0.6 })); door.rotation.x = Math.PI / 2; door.position.set(0, 2.2, 3.9); d.add(door); const knob = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), goldMat); knob.position.set(0, 2.2, 4.15); d.add(knob); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const p = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.2), goldMat); p.position.set(Math.cos(a) * 2.1, 2.2 + Math.sin(a) * 2.1, 4.1); d.add(p); } const win = pulse(new T.Mesh(new T.CircleGeometry(0.5, 14), glowMat(0xffd27a, 0.9))); win.position.set(-2.4, 3.6, 3.2); win.rotation.y = -0.6; d.add(win); for (const sx of [-3.3, 3.3]) { cyl(0.08, 0.1, 2.2, stoneDark, sx, 1.1, 4.4, d, 6); pulse(box(0.5, 0.6, 0.5, glowMat(0xffc86a, 1.0), sx, 2.4, 4.4, d)); } for (let i = 0; i < 4; i++) box(2.4 - i * 0.2, 0.25, 1.1, stoneMat, 0, 0.12, 5.0 + i * 1.15, d); const ch = cyl(0.35, 0.4, 1.2, stoneDark, 1.8, 3.4, 0.5, d, 8); for (let i = 0; i < 3; i++) { const sm = new T.Mesh(new T.SphereGeometry(0.35, 8, 6), new T.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.5 })); sm.position.set(1.8, 4.8, 0.5); sm.userData.smoke = i; d.add(sm); } host(g, '⛏️', -3.0, 2.2, 5.6, 2.6); }, true);
    // 3. the great tree, older than the kingdom, where the tree folk live
    portal('tree', -34, 38, 25, g => { cyl(2.4, 3.6, 16, trunkMat, 0, 8, 0, g, 12); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const r = cone(1.1, 3.2, trunkMat, Math.cos(a) * 3.4, 0.9, Math.sin(a) * 3.4, g, 6); r.rotation.z = Math.cos(a) * 0.9; r.rotation.x = -Math.sin(a) * 0.9; } for (const [x, y, z, r, m] of [[0, 18, 0, 7.2, leafDark], [4.5, 15, 3, 5, leafLight], [-4.5, 15.5, -2, 5.5, leafDark], [1, 21.5, -3, 4.6, leafLight], [-2, 13, 4.5, 4, leafLight]]) { const c = new T.Mesh(new T.SphereGeometry(r, 12, 9), m); c.position.set(x, y, z); c.castShadow = true; g.add(c); } const hollow = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 0.4, 16), blackMat); hollow.rotation.x = Math.PI / 2; hollow.position.set(0, 1.8, 3.4); hollow.scale.y = 1.4; g.add(hollow); for (const sx of [-1.1, 1.1]) { const e = new T.Mesh(new T.SphereGeometry(0.42, 10, 8), M(0xfff6e0)); e.position.set(sx, 6.2, 3.3); g.add(e); const pu = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), blackMat); pu.position.set(sx, 6.2, 3.65); g.add(pu); } for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 6.5 + (i % 2) * 1.5; cyl(0.02, 0.02, 1.4, stoneDark, Math.cos(a) * r, 12.6, Math.sin(a) * r, g, 4); } for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 6.5 + (i % 2) * 1.5; const gl = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), glowMat(0xffd27a, 1.1)); gl.position.set(Math.cos(a) * r, 11.8, Math.sin(a) * r); pulse(gl); g.add(gl); } host(g, '🍃', 3.8, 3.2, 3.8, 2.8); });
    // 4..20 the rest of the ring
    portal('fairy', 12, 6, 4, g => { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = 2.6; cyl(0.16, 0.2, 0.7, cream, Math.cos(a) * r, 0.35, Math.sin(a) * r, g, 8); const cap = new T.Mesh(new T.SphereGeometry(0.42, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), mushRed); cap.position.set(Math.cos(a) * r, 0.65, Math.sin(a) * r); g.add(cap); } for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const gl = pulse(new T.Mesh(new T.SphereGeometry(0.16, 8, 6), glowMat(0xffe9a8, 1.4))); gl.position.set(Math.cos(a) * 1.2, 0.9 + (i % 3) * 0.4, Math.sin(a) * 1.2); g.add(gl); } host(g, '🧚', 0, 2.1, 0, 2.8); });
    portal('mill', -48, -4, 11, g => { cyl(2.2, 2.7, 7, stoneMat, 0, 3.5, 0, g, 12); cone(2.9, 2.2, roofMat, 0, 8.1, 0, g, 12); box(1.0, 1.6, 0.2, trunkMat, 0, 0.8, 2.6, g); const hub = new T.Group(); hub.position.set(0, 6.4, 2.9); hub.userData.mill = true; g.add(hub); for (let i = 0; i < 4; i++) { const b = box(0.5, 5.6, 0.08, cream, 0, 2.6, 0, hub); b.userData.noMerge = true; b.rotation.z = i * Math.PI / 2; b.position.set(Math.sin(i * Math.PI / 2) * -2.6, Math.cos(i * Math.PI / 2) * 2.6, 0); const sp = box(0.12, 5.8, 0.12, trunkMat, 0, 0, 0.05, hub); sp.userData.noMerge = true; sp.rotation.z = i * Math.PI / 2; sp.position.set(Math.sin(i * Math.PI / 2) * -2.9, Math.cos(i * Math.PI / 2) * 2.9, 0.05); } for (let i = 0; i < 5; i++) cyl(0.5, 0.5, 0.9, M(0xc9a96a), -3.2 + i * 0.7, 0.45, 2.6 + (i % 2) * 0.6, g, 8); host(g, '🌾', 3.4, 2.0, 2.4, 2.6); });
    portal('stones', 40, 28, 6, g => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const st = box(1.1, 3.6 + (i % 3) * 0.4, 0.8, stoneDark, Math.cos(a) * 4.2, 1.8, Math.sin(a) * 4.2, g); st.rotation.y = -a; } for (let i = 0; i < 4; i++) { const a = (i * 2 + 0.5) / 8 * Math.PI * 2; const l = box(3.4, 0.6, 0.9, stoneDark, Math.cos(a) * 4.2, 4.1, Math.sin(a) * 4.2, g); l.rotation.y = -a + Math.PI / 2; } cyl(1.2, 1.4, 0.8, stoneMat, 0, 0.4, 0, g, 10); const cr = pulse(new T.Mesh(new T.OctahedronGeometry(0.6, 0), glowMat(0x9fd8ff, 1.2))); cr.position.set(0, 1.5, 0); cr.scale.y = 1.8; cr.userData.spin = true; g.add(cr); host(g, '✨', 0, 3.2, 0, 2.6); });
    portal('hive', -4, -16, 8, g => { cyl(0.9, 1.2, 4.5, trunkMat, 0, 2.2, 0, g, 8); const br = cyl(0.3, 0.4, 3.6, trunkMat, 1.4, 4.4, 0, g, 6); br.rotation.z = -1.1; for (let i = 0; i < 4; i++) { const h = new T.Mesh(new T.SphereGeometry(1.5 - i * 0.28, 12, 8), M(0xd9a520)); h.scale.y = 0.55; h.position.set(2.6, 1.9 + i * 0.62, 0); g.add(h); } const hole = new T.Mesh(new T.CircleGeometry(0.28, 10), blackMat); hole.position.set(2.6, 2.1, 1.2); g.add(hole); for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.SphereGeometry(0.12, 6, 5), goldMat); b.userData.bee = i * 1.3; b.position.set(2.6, 2.2, 0); g.add(b); } const c = new T.Mesh(new T.SphereGeometry(2.4, 10, 8), leafDark); c.position.set(0, 6.2, 0); g.add(c); host(g, '🐝', 2.6, 5.0, 1.6, 2.6); });
    portal('fisher', 20, -34, 6, g => { box(3.2, 2.4, 2.8, trunkMat, 0, 1.2, 0, g); cone(2.6, 1.6, roofMat, 0, 3.2, 0, g, 4).rotation.y = Math.PI / 4; box(0.9, 1.4, 0.1, stoneDark, 0, 0.7, 1.45, g); for (let i = 0; i < 4; i++) box(1.2, 0.15, 1.1, M(0xb08a5a), 0, 0.3, 2.6 + i * 1.1, g); for (const z of [3.0, 5.2]) for (const sx of [-0.7, 0.7]) cyl(0.1, 0.1, 1.4, trunkMat, sx, -0.2, z, g, 6); const rod = cyl(0.03, 0.05, 3.2, trunkMat, 0.6, 1.4, 6.2, g, 5); rod.rotation.x = -0.9; host(g, '🎣', -1.2, 1.4, 6.0, 2.4); const f = host(g, '🐟', 1.8, 0.4, 8.2, 1.4); f.userData.hostBob = 2; });
    portal('balloon', -14, 44, 12, g => { const b = new T.Group(); b.userData.hostBob = 1; b.userData.baseY = 0; g.add(b); const bl = new T.Mesh(new T.SphereGeometry(3.2, 16, 12), M(0xe04040)); bl.position.y = 8.2; bl.userData.noMerge = true; b.add(bl); for (let i = 0; i < 4; i++) { const st = new T.Mesh(new T.SphereGeometry(3.25, 16, 12, i * Math.PI / 2, Math.PI / 4), M(0xf6e9c8)); st.position.y = 8.2; st.userData.noMerge = true; b.add(st); } const ring = new T.Mesh(new T.TorusGeometry(2.2, 0.16, 8, 24), goldMat); ring.rotation.x = Math.PI / 2; ring.position.y = 5.6; ring.userData.noMerge = true; b.add(ring); const bk = box(1.8, 1.3, 1.8, M(0x8a6a3a), 0, 2.4, 0, b); bk.userData.noMerge = true; for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) { const r = cyl(0.03, 0.03, 2.8, stoneDark, x, 4.3, z, b, 4); r.userData.noMerge = true; } for (let i = 0; i < 3; i++) { const sb = new T.Mesh(new T.SphereGeometry(0.25, 8, 6), M(0xc9b48a)); sb.position.set(-0.9 + i * 0.9, 1.7, 0.95); sb.userData.noMerge = true; b.add(sb); } host(g, '🧭', 0, 3.6, 1.0, 2.2); for (let i = 0; i < 4; i++) cyl(0.08, 0.08, 1.0, trunkMat, -1.2 + i * 0.8, 0.5, 2.6, g, 5); });
    portal('caravan', 30, -40, 7, g => { const w = new T.Group(); w.rotation.y = 0.6; g.add(w); box(4.2, 2.2, 2.3, M(0x6a2d8a), 0, 2.0, 0, w); const roof = new T.Mesh(new T.CylinderGeometry(1.35, 1.35, 4.4, 14, 1, false, 0, Math.PI), M(0xe8d9b0)); roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.set(0, 3.1, 0); w.add(roof); for (const x of [-1.4, 1.4]) for (const z of [-1.3, 1.3]) { const wh = cyl(0.75, 0.75, 0.25, trunkMat, x, 0.75, z, w, 12); wh.rotation.x = Math.PI / 2; } box(1.0, 1.4, 0.1, M(0xf2c14e), 0, 1.9, 1.2, w); for (let i = 0; i < 3; i++) box(1.0, 0.18, 0.5, trunkMat, 0, 0.3 + i * 0.35, 1.6 + i * 0.4, w); box(1.2, 0.8, 1.2, M(0x4a2a5a), -3.4, 0.4, 1.4, w); const ball = pulse(new T.Mesh(new T.SphereGeometry(0.5, 12, 9), glowMat(0x9fd8ff, 0.9))); ball.position.set(-3.4, 1.3, 1.4); w.add(ball); host(g, '🔮', -3.4, 3.0, 1.6, 2.4); });
    portal('bear', -36, -34, 6, g => { const rk = new T.Mesh(new T.DodecahedronGeometry(4.2, 0), boulderMat); rk.position.y = 1.6; rk.scale.set(1.3, 0.9, 1.1); rk.castShadow = true; g.add(rk); const mouth = new T.Mesh(new T.SphereGeometry(1.7, 12, 9), blackMat); mouth.position.set(0, 1.2, 3.6); mouth.scale.set(1, 0.85, 0.5); g.add(mouth); for (let i = 0; i < 5; i++) { const r = new T.Mesh(new T.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0), boulderMat); r.position.set(-3 + i * 1.5, 0.3, 4.8 + (i % 2)); g.add(r); } cyl(0.4, 0.35, 0.6, goldMat, 2.2, 0.3, 4.6, g, 10); host(g, '🐻', 0, 1.6, 4.4, 3.0); });
    portal('tower', 10, -44, 12, g => { cyl(1.7, 2.1, 9, stoneMat, 0, 4.5, 0, g, 12); cyl(2.4, 2.4, 0.5, stoneDark, 0, 9.2, 0, g, 12); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; box(0.6, 0.7, 0.5, stoneDark, Math.cos(a) * 2.1, 9.8, Math.sin(a) * 2.1, g).rotation.y = -a; } for (let i = 0; i < 6; i++) box(0.5, 0.06, 0.12, trunkMat, 2.15, 1.2 + i * 1.3, 0, g); box(0.06, 8.6, 0.06, trunkMat, 2.3, 4.6, 0.25, g); box(0.06, 8.6, 0.06, trunkMat, 2.3, 4.6, -0.25, g); cyl(0.5, 0.35, 0.5, stoneDark, 0, 9.7, 0, g, 8); flame(g, 0, 9.9, 0, 1.0); flag(1.6, 9.5, 1.2, g); host(g, '🛡️', -1.6, 11.0, 1.2, 2.4); });
    portal('frog', -24, 44, 4, g => { const w = new T.Mesh(new T.CircleGeometry(3.6, 22), waterMat); w.rotation.x = -Math.PI / 2; w.position.y = 0.06; g.add(w); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, r = i ? 2.2 : 0; const pad = cyl(i ? 0.5 : 0.9, i ? 0.5 : 0.9, 0.08, leafLight, Math.cos(a) * r, 0.12, Math.sin(a) * r, g, 10); } const cr = new T.Mesh(new T.TorusGeometry(0.35, 0.08, 6, 12), goldMat); cr.rotation.x = Math.PI / 2; cr.position.set(0, 1.9, 0); cr.userData.spin = true; cr.userData.noMerge = true; g.add(cr); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cone(0.12, 1.4, leafDark, Math.cos(a) * 3.9, 0.7, Math.sin(a) * 3.9, g, 5); } host(g, '🐸', 0, 0.9, 0, 2.4); });
    portal('scarecrow', -16, -44, 6, g => { for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) cone(0.16, 1.5 + ((i * 3 + j) % 3) * 0.2, M(0xe8c26a), -3 + i * 1.0, 0.75, -2 + j * 1.0, g, 5); cyl(0.09, 0.09, 4.0, trunkMat, 0, 2.0, 0, g, 6); box(2.6, 0.12, 0.12, trunkMat, 0, 3.1, 0, g); box(1.1, 1.3, 0.6, M(0x8a4a2a), 0, 2.6, 0, g); const hd = new T.Mesh(new T.SphereGeometry(0.45, 10, 8), M(0xe8c26a)); hd.position.y = 3.7; g.add(hd); cone(0.7, 0.6, stoneDark, 0, 4.2, 0, g, 8); for (const x of [-1.2, 1.0]) { const c = new T.Mesh(new T.SphereGeometry(0.16, 6, 5), blackMat); c.position.set(x, 3.3, 0); g.add(c); } host(g, '🌻', 1.8, 2.0, 1.8, 2.4); });
    portal('owl', -8, -40, 6, g => { cyl(2.2, 2.6, 3.2, trunkMat, 0, 1.6, 0, g, 12); cyl(2.3, 2.3, 0.2, M(0xc9a074), 0, 3.25, 0, g, 12); const hol = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.4, 14), blackMat); hol.rotation.x = Math.PI / 2; hol.scale.y = 1.4; hol.position.set(0, 1.9, 2.25); g.add(hol); const br = cyl(0.25, 0.35, 3.0, trunkMat, 1.6, 3.4, 0, g, 6); br.rotation.z = -1.2; for (let i = 0; i < 3; i++) box(0.9, 0.18, 0.7, [M(0x8e1f2f), M(0x2b5fa8), M(0x2f7a3f)][i], 2.4, 0.1 + i * 0.18, 1.6, g).rotation.y = i * 0.3; for (let i = 0; i < 3; i++) { cyl(0.05, 0.06, 0.3, cream, -1.8 + i * 0.5, 3.45, 0.8, g, 6); const cp = new T.Mesh(new T.SphereGeometry(0.16, 8, 6, 0, 6.3, 0, 1.57), mushRed); cp.position.set(-1.8 + i * 0.5, 3.6, 0.8); g.add(cp); } pulse(box(0.35, 0.45, 0.35, glowMat(0xffc86a, 1.0), -2.4, 2.4, 1.0, g)); host(g, '🦉', 0, 2.0, 2.6, 2.6); });
    portal('gnome', 30, 40, 7, g => { cyl(1.5, 1.8, 2.8, cream, 0, 1.4, 0, g, 14); const cap = new T.Mesh(new T.SphereGeometry(3.1, 14, 10), mushRed); cap.scale.y = 0.6; cap.position.y = 3.1; cap.castShadow = true; g.add(cap); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.4; const d = new T.Mesh(new T.SphereGeometry(0.3 + (i % 2) * 0.12, 8, 6), cream); d.position.set(Math.cos(a) * 2.2, 3.7 + (i % 3) * 0.3, Math.sin(a) * 2.2); g.add(d); } box(0.8, 1.3, 0.12, M(0x7a3a2a), 0, 0.65, 1.75, g); const win = pulse(new T.Mesh(new T.CircleGeometry(0.32, 12), glowMat(0xffd27a, 0.9))); win.position.set(1.1, 1.7, 1.45); win.rotation.y = 0.6; g.add(win); cyl(0.25, 0.3, 1.2, stoneDark, -1.2, 4.6, -0.6, g, 8); for (let i = 0; i < 3; i++) { const sm = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.5 })); sm.position.set(-1.2, 4.8, -0.6); sm.userData.smoke = i; g.add(sm); } for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const fl = new T.Mesh(new T.SphereGeometry(0.16, 6, 5), M([0xff7eb6, 0xffd75e, 0xffffff][i % 3])); fl.position.set(Math.cos(a) * 2.8, 0.3, Math.sin(a) * 2.8); g.add(fl); } host(g, '🍄', -2.4, 1.6, 2.4, 2.4); });
    portal('nest', 50, 4, 5, g => { const n = new T.Mesh(new T.TorusGeometry(2.0, 0.7, 8, 20), M(0x8a6a3a)); n.rotation.x = Math.PI / 2; n.position.y = 0.6; g.add(n); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const st = cone(0.08, 1.4, M(0xc9a96a), Math.cos(a) * 2.4, 0.9, Math.sin(a) * 2.4, g, 4); st.rotation.z = Math.cos(a) * 0.8; st.rotation.x = -Math.sin(a) * 0.8; } [[0xf2c14e, -0.7, 0], [0xaf52de, 0.7, 0.3], [0x34c759, 0, -0.8]].forEach(([c, x, z]) => { const e = pulse(new T.Mesh(new T.SphereGeometry(0.55, 12, 9), glowMat(c, 0.5))); e.scale.y = 1.35; e.position.set(x, 1.15, z); g.add(e); }); for (let i = 0; i < 4; i++) { const r = new T.Mesh(new T.DodecahedronGeometry(0.6, 0), M(0x9a6a4a, { flatShading: true })); r.position.set(-3 + i * 2, 0.3, 2.8); g.add(r); } host(g, '🐉', 0, 2.8, 0, 3.0); });
    portal('crystal', -48, -12, 7, g => { const rk = new T.Mesh(new T.DodecahedronGeometry(3.6, 0), boulderMat); rk.position.y = 1.4; rk.scale.set(1.2, 0.9, 1); rk.castShadow = true; g.add(rk); const mouth = new T.Mesh(new T.SphereGeometry(1.4, 12, 9), M(0x140a20)); mouth.position.set(0, 1.0, 3.2); mouth.scale.set(1, 0.9, 0.5); g.add(mouth); const cols = [0xaf52de, 0x5ac8fa, 0xff6bd6, 0x9fd8ff]; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = 2.2 + (i % 2) * 1.4; const c = pulse(new T.Mesh(new T.OctahedronGeometry(0.45 + (i % 3) * 0.25, 0), glowMat(cols[i % 4], 1.1))); c.scale.y = 2.2; c.position.set(Math.cos(a) * r, 1.4 + (i % 3) * 0.6, Math.sin(a) * r); c.rotation.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4); g.add(c); } host(g, '💎', 0, 1.8, 4.2, 2.6); });
    portal('pirate', -24, -30, 5, g => { box(2.2, 1.2, 1.4, M(0x5a3a22), 0, 0.6, 0, g); const lid = box(2.3, 0.5, 1.5, M(0x6a4a2a), 0, 1.35, -0.55, g); lid.rotation.x = -1.0; box(2.3, 0.15, 0.2, goldMat, 0, 0.6, 0.72, g); for (let i = 0; i < 14; i++) { const c = cyl(0.22, 0.22, 0.06, goldMat, -0.9 + (i % 7) * 0.3, 1.24 + Math.floor(i / 7) * 0.07, (i % 3) * 0.3 - 0.3, g, 10); c.rotation.x = (i % 2) * 0.3; } for (let i = 0; i < 6; i++) cyl(0.2, 0.2, 0.06, goldMat, 1.4 + (i % 3) * 0.35, 0.03, 0.6 + Math.floor(i / 3) * 0.4, g, 10); flag(-1.8, 0, -0.8, g, new T.MeshStandardMaterial({ color: 0x111111, side: T.DoubleSide })); const sk = host(g, '💀', -1.35, 1.6, -0.8, 0.8); sk.userData.hostBob = null; host(g, '👻', 1.2, 2.4, 0.4, 2.8); });
    portal('troll', -2, -20, 6, g => { const rk = new T.Mesh(new T.DodecahedronGeometry(2.4, 0), boulderMat); rk.position.set(-2, 0.9, 0); rk.scale.set(1.2, 0.8, 1); g.add(rk); box(1.6, 0.5, 1.2, trunkMat, 1.2, 0.25, 0.4, g); for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.SphereGeometry(0.28, 8, 6), M([0xf2c14e, 0xf2c14e, 0xd9d9d9, 0xc9a074, 0xf2c14e][i])); b.position.set(0.6 + (i % 3) * 0.5, 0.65 + Math.floor(i / 3) * 0.4, 0.2 + (i % 2) * 0.4); g.add(b); } const sign = box(1.4, 0.8, 0.08, M(0xc9a074), 3.0, 1.4, 0, g); sign.rotation.y = 0.3; cyl(0.06, 0.06, 1.4, trunkMat, 3.0, 0.7, 0, g, 5); host(g, '🧌', -2, 2.9, 0.4, 3.2); }, true);
    portal('smith', 14, 44, 7, g => { box(4.2, 2.6, 3.2, stoneDark, 0, 1.3, 0, g); cone(3.2, 1.8, roofMat, 0, 3.5, 0, g, 4).rotation.y = Math.PI / 4; cyl(0.4, 0.45, 2.0, stoneDark, 1.3, 4.3, -0.6, g, 8); for (let i = 0; i < 3; i++) { const sm = new T.Mesh(new T.SphereGeometry(0.35, 8, 6), new T.MeshBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.5 })); sm.position.set(1.3, 4.8, -0.6); sm.userData.smoke = i; g.add(sm); } box(1.2, 0.5, 0.6, M(0x3a3a3a, { roughness: 0.4, metalness: 0.6 }), 0, 1.05, 2.4, g); cyl(0.4, 0.5, 0.8, trunkMat, 0, 0.4, 2.4, g, 8); const fg = pulse(box(1.4, 0.9, 1.0, glowMat(0xff7a1a, 1.2), -2.0, 0.45, 2.2, g)); const hm = box(0.5, 0.25, 0.25, M(0x3a3a3a), 0.9, 1.4, 2.4, g); hm.rotation.z = 0.8; cyl(0.04, 0.04, 0.9, trunkMat, 1.2, 1.05, 2.4, g, 4).rotation.z = 0.8; host(g, '🔨', 2.2, 2.0, 2.6, 2.6); });
    portal('ruins', -44, 24, 7, g => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const h = [4.2, 1.6, 3.4, 4.2, 2.2, 3.8][i]; cyl(0.45, 0.5, h, stoneMat, Math.cos(a) * 3.4, h / 2, Math.sin(a) * 3.4, g, 10); cyl(0.6, 0.6, 0.25, stoneMat, Math.cos(a) * 3.4, h + 0.12, Math.sin(a) * 3.4, g, 10); } const fallen = cyl(0.45, 0.45, 3.6, stoneMat, 1.2, 0.45, 5.2, g, 10); fallen.rotation.z = Math.PI / 2; fallen.rotation.y = 0.5; box(7.6, 0.4, 7.6, stoneDark, 0, 0.2, 0, g); for (let i = 0; i < 6; i++) { const mo = new T.Mesh(new T.SphereGeometry(0.35 + Math.random() * 0.3, 7, 5), leafDark); mo.position.set(-3 + Math.random() * 6, 0.45, -3 + Math.random() * 6); g.add(mo); } const cr = pulse(new T.Mesh(new T.OctahedronGeometry(0.5, 0), glowMat(0x8fd6ff, 1.0))); cr.position.set(0, 1.3, 0); cr.userData.spin = true; g.add(cr); host(g, '⚔️', 0, 3.0, 0, 3.0); });
    portal('garden', 44, 14, 6, g => { for (const [w, d, x, z] of [[8, 0.6, 0, -3.8], [8, 0.6, 0, 3.8], [0.6, 7, -3.8, 0], [0.6, 3, 3.8, -2.5], [0.6, 3, 3.8, 2.5]]) box(w, 1.4, d, stoneMat, x, 0.7, z, g); const arch = new T.Mesh(new T.TorusGeometry(1.1, 0.22, 8, 16, Math.PI), stoneMat); arch.position.set(3.8, 1.4, 0); arch.rotation.y = Math.PI / 2; g.add(arch); for (let i = 0; i < 24; i++) { const fl = new T.Mesh(new T.SphereGeometry(0.22, 6, 5), M([0xff7eb6, 0xffd75e, 0xffffff, 0xb48cff, 0xff5a5a, 0xffa552][i % 6])); fl.position.set(-3 + (i % 6) * 1.2, 0.55, -2.4 + Math.floor(i / 6) * 1.6); g.add(fl); cyl(0.04, 0.04, 0.5, leafDark, -3 + (i % 6) * 1.2, 0.25, -2.4 + Math.floor(i / 6) * 1.6, g, 4); } const bird = new T.Mesh(new T.CylinderGeometry(0.5, 0.6, 0.3, 10), stoneMat); bird.position.set(0, 1.2, 0); g.add(bird); cyl(0.15, 0.2, 1.0, stoneMat, 0, 0.5, 0, g, 8); const w = new T.Mesh(new T.CircleGeometry(0.42, 12), waterMat); w.rotation.x = -Math.PI / 2; w.position.set(0, 1.36, 0); g.add(w); host(g, '🌷', 3.0, 1.8, 3.2, 2.6); });
    /* the Quiet Clearing (Yoni 2026-10-09: 'Quiet … for every world'; its own place beside the Heart Garden, so feelings and calm sit together):
       a weeping willow over a still pond, a ring of stones, three sitting stones, and lanterns that glow from the evening on. Tapping it opens
       the meditation (shared/meditate.js through KQ.quiet); every other realm reaches its own quiet place from the top bar */
    if (isMeadow) { const q = spot(...SPX(-3, 25), 4.5); plotAt('quiet', q[0], q[1], g => {
      const water = new T.MeshStandardMaterial({ color: 0x4f97c0, roughness: 0.12, metalness: 0.15, emissive: 0x0a2a40, emissiveIntensity: 0.25 });
      const pond = new T.Mesh(new T.CylinderGeometry(2.3, 2.3, 1.0, 32), water); pond.position.set(0.6, -0.15, 0.4); g.add(pond);   /* a level pool: its top sits at 0.35 even where the ground slopes */
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = 2.55 + (k % 3) * 0.08, st = new T.Mesh(new T.DodecahedronGeometry(0.34 + (k % 4) * 0.05, 0), stoneMat); st.scale.y = 0.55; st.position.set(0.6 + Math.cos(a) * r, 0.4, 0.4 + Math.sin(a) * r); st.rotation.y = k; g.add(st); }
      const pad = M(0x4f9a46); for (const [x, z, r] of [[0.2, 0.9, 0.34], [1.3, -0.2, 0.28], [-0.2, -0.4, 0.24], [1.6, 1.1, 0.3]]) { const p = new T.Mesh(new T.CircleGeometry(r, 14, 0.3, Math.PI * 1.8), pad); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.37, z); g.add(p); }
      const lotus = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), glowMat(0xffa8c8, 0.4)); lotus.scale.y = 0.6; lotus.position.set(0.25, 0.44, 0.85); g.add(lotus);
      const bark = M(0x6a5034), willow = M(0x8cbf5c), willow2 = M(0x6fa548);   /* the willow: a leaning trunk and long strands hanging almost to the ground */
      const tr = cyl(0.32, 0.5, 3.6, bark, -2.2, 1.8, -1.6, g, 10); tr.rotation.z = 0.12;
      const crown = new T.Mesh(new T.SphereGeometry(2.4, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), willow); crown.position.set(-1.9, 3.5, -1.5); g.add(crown);
      for (let k = 0; k < 34; k++) { const a = k / 34 * Math.PI * 2, r = 2.0 + (k % 3) * 0.25, len = 2.4 + (k % 5) * 0.35, st = new T.Mesh(new T.CylinderGeometry(0.16, 0.05, len, 5), k % 2 ? willow : willow2); st.position.set(-1.9 + Math.cos(a) * r, 3.6 - len / 2, -1.5 + Math.sin(a) * r); st.rotation.z = Math.cos(a) * 0.12; st.rotation.x = -Math.sin(a) * 0.12; g.add(st); }
      for (const [x, z] of [[-1.0, 2.7], [1.0, 3.3], [2.9, 2.2]]) { const st = cyl(0.55, 0.62, 0.22, stoneMat, x, 0.11, z, g, 12); st.scale.z = 0.85; }   /* three flat stones to sit on, facing the water */
      const lamp = glowMat(0xffc46a, night ? 1.6 : evening ? 1.1 : 0.35);   /* soft by day, glowing from the evening on */
      for (const [x, z] of [[-3.4, 1.6], [3.4, -1.4], [3.6, 1.8], [-0.6, -3.3]]) { cyl(0.07, 0.08, 1.5, woodMat, x, 0.75, z, g, 6); pulse(box(0.34, 0.42, 0.34, lamp, x, 1.65, z, g)); cone(0.3, 0.22, roofMat, x, 1.98, z, g, 4).rotation.y = Math.PI / 4; }
    }, { labelH: 6.5 }); reserved.push([q[0] + 1.6, q[1] + 6, 4.5], [q[0] + 3, q[1] + 11, 4.5]); }   /* no tree between the camera and the pond (the forest is planted after the places) */

    // the developer door: a faint padlock floating on the river beside Mount Glory (no plaque; the hub asks for the code)
    { const g = new T.Group(); const lx = 42 * SPR, lz = riverZ(lx); g.position.set(lx, WATER_Y + 0.5, lz); g.userData = { id: 'devlock', soon: false, base: WATER_Y + 0.5, top: 2 }; const sp = new T.Group(); { const lm = new T.MeshStandardMaterial({ color: 0xe8c060, metalness: 1, roughness: 0.3, transparent: true, opacity: 0.38 }); const sh = new T.Shape(); const w = 0.62, h = 0.52, r = 0.12; sh.moveTo(-w / 2 + r, -h / 2); sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); const bodyG = new T.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 }); bodyG.translate(0, 0, -0.11); sp.add(new T.Mesh(bodyG, lm)); const shackle = new T.Mesh(new T.TorusGeometry(0.2, 0.05, 12, 32, Math.PI), lm); shackle.position.y = 0.26; sp.add(shackle); for (const sx of [-0.2, 0.2]) { const leg = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.1, 12), lm); leg.position.set(sx, 0.27, 0); sp.add(leg); } const hole = new T.Mesh(new T.CircleGeometry(0.06, 16), new T.MeshBasicMaterial({ color: 0x2a1a08, transparent: true, opacity: 0.5 })); hole.position.set(0, 0.02, 0.155); sp.add(hole); } sp.scale.setScalar(1.6); sp.position.y = 0.9; sp.userData.hostBob = 2; sp.userData.baseY = 0.9; sp.userData.noMerge = true; g.add(sp); const hit = new T.Mesh(new T.SphereGeometry(1.9, 8, 6), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.9; hit.userData.plot = g; g.add(hit); scene.add(g); anchors.push({ g, id: 'devlock', soon: false, h: 2 }); }
    function setPortals(ids) { const set = new Set(isMeadow ? (ids || []) : []); for (const [id, g] of portalGroups) { g.visible = set.has(id); if (g.visible) ensureHost(g); } }

    // ---------- the fly-in: the camera swoops to a secret place, then the hub takes over ----------
    const fly = { on: false, t: 0, cb: null, from: new T.Vector3(), to: new T.Vector3(), look: new T.Vector3(), lookFrom: new T.Vector3() };
    const EG = { g: null, bird: null, hit: null, label: null, on: false, t: 0, next: 22 + Math.random() * 14, curve: null, len: 1, speed: 16, board: null, chute: null, h: 0, noRide: false };   /* the giant eagle (below) */
    function flyTo(id, cb) { if (VIEW.on) { viewGlory(false); if (opts.onGloryView) opts.onGloryView(false); } const a = anchors.find(x => x.id === id); if (!a || fly.on || ride.on) return false; const g = a.g; fly.on = true; fly.t = 0; fly.cb = cb; fly.from.copy(camera.position); fly.lookFrom.copy(target); const F = g.userData.fly || {}; const top = g.userData.top || 6, h = F.focus != null ? F.focus : top * 0.45, dist = F.dist || Math.max(11, top * 1.3), up = F.up != null ? F.up : dist * 0.28; fly.look.set(g.position.x, g.position.y + h, g.position.z); const dir = (F.dir ? new T.Vector3(F.dir[0], 0, F.dir[1]) : new T.Vector3(camera.position.x - g.position.x, 0, camera.position.z - g.position.z)).normalize();   /* F.dir: a place that is always seen from one side */ fly.to.set(g.position.x + dir.x * dist, g.position.y + h + up, g.position.z + dir.z * dist); fly.lift = Math.max(8, Math.min(24, fly.from.distanceTo(fly.to) * 0.3)); gesture = null; return true; }
    function flyBack() { fly.on = false; fly.cb = null; placeCamera(); }
    function updateFly(dt) { if (!fly.on) return; fly.t += dt; const k = Math.min(1, fly.t / 1.8), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; camera.position.lerpVectors(fly.from, fly.to, e); camera.position.y += Math.sin(Math.PI * k) * (fly.lift || 8); v3.lerpVectors(fly.lookFrom, fly.look, e); camera.lookAt(v3); if (k >= 1 && fly.cb) { const cb = fly.cb; fly.cb = null; cb(); } }

    // ---------- the river: reeds, lilies, flowers and lanterns along both banks, and a dock where the boat waits ----------
    const riverDeco = new T.Group(); scene.add(riverDeco);
    { const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1), pos = new T.Vector3(); const bankOk = (x, z) => Math.abs(x - 2 * SPR) > 4.5 && terrainHeight(x, z) > WATER_Y - 0.3 && pathDist(x, z) > 1.6;
      const reeds = new T.InstancedMesh(new T.ConeGeometry(0.11, 1.7, 5), M(0x4f8f3a), 200); let n = 0; for (let x = -54 * SPR; x <= 58 * SPR && n < 200; x += 1.3 * SPR) for (const sd of [-1, 1]) { const z = riverZ(x) + sd * (riverW(x) + 0.5 + Math.random() * 1.3); if (!bankOk(x, z) || n >= 200) continue; const y = Math.max(WATER_Y, terrainHeight(x, z)); pos.set(x + (Math.random() - 0.5) * 0.6, y + 0.8, z); q.setFromEuler(new T.Euler((Math.random() - 0.5) * 0.25, Math.random() * 6.3, (Math.random() - 0.5) * 0.25)); sc.set(1, 0.8 + Math.random() * 0.6, 1); m4.compose(pos, q, sc); reeds.setMatrixAt(n++, m4); } reeds.count = n; reeds.castShadow = true; riverDeco.add(reeds);
      const flowers = new T.InstancedMesh(new T.SphereGeometry(0.17, 6, 5), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), 160); const fc = [new T.Color(0xff7eb6), new T.Color(0xffd75e), new T.Color(0xffffff), new T.Color(0xb48cff)]; n = 0; for (let x = -54 * SPR; x <= 58 * SPR && n < 160; x += 1.6 * SPR) for (const sd of [-1, 1]) { const z = riverZ(x) + sd * (riverW(x) + 2.2 + Math.random() * 2.6); if (!bankOk(x, z) || terrainHeight(x, z) < WATER_Y + 0.3 || n >= 160) continue; pos.set(x, terrainHeight(x, z) + 0.2, z); q.identity(); sc.set(1, 1, 1); m4.compose(pos, q, sc); flowers.setMatrixAt(n, m4); flowers.setColorAt(n, fc[n % 4]); n++; } flowers.count = n; riverDeco.add(flowers);
      const lilies = new T.InstancedMesh(new T.CircleGeometry(0.5, 10), M(0x3f9a3f), 70); n = 0; for (let x = -50 * SPR; x <= 56 * SPR && n < 70; x += 2.4 * SPR) for (const sd of [-1, 1]) { if (Math.random() < 0.35 || Math.abs(x - 2 * SPR) < 5) continue; const z = riverZ(x) + sd * (riverW(x) - 0.7 - Math.random() * 0.5); pos.set(x, WATER_Y + 0.04, z); q.setFromEuler(new T.Euler(-Math.PI / 2, 0, Math.random() * 6.3)); sc.set(0.7 + Math.random() * 0.6, 0.7 + Math.random() * 0.6, 1); m4.compose(pos, q, sc); lilies.setMatrixAt(n++, m4); } lilies.count = n; riverDeco.add(lilies);
      for (let x = -46 * SPR; x <= 54 * SPR; x += 11 * SPR) { const sd = (Math.round(x / (11 * SPR)) % 2) ? 1 : -1, z = riverZ(x) + sd * (riverW(x) + 1.6); if (!bankOk(x, z)) continue; const y = terrainHeight(x, z); cyl(0.07, 0.09, 2.6, trunkMat, x, y + 1.3, z, riverDeco, 6); pulse(box(0.42, 0.55, 0.42, glowMat(0xffd27a, 1.0), x, y + 2.7, z, riverDeco)); }
      const DX = -52 * SPR, dz = riverZ(DX) + riverW(DX) + 0.4; box(4.4, 0.18, 2.2, M(0xa8865a), DX, WATER_Y + 0.35, dz + 0.4, riverDeco); for (const x of [DX - 1.8, DX + 1.8]) for (const z of [dz - 0.4, dz + 1.2]) cyl(0.12, 0.12, 1.6, trunkMat, x, WATER_Y + 0.1, z, riverDeco, 6); }

    // ---------- the river boat: tap it and the camera rides it downriver, over the falls and off behind the rainbow ----------
    const boat = new T.Group(); { const wood = M(0x8a5a2a, { transparent: true }), deckM = M(0xc9a074, { transparent: true }), sailM = new T.MeshStandardMaterial({ color: 0xf6f0e2, side: T.DoubleSide, roughness: 1, transparent: true }), flagM = new T.MeshStandardMaterial({ color: 0xc0392b, side: T.DoubleSide, transparent: true });
      const hull = new T.Mesh(new T.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood); hull.scale.set(2.6, 0.9, 1.1); hull.position.y = 0.3; boat.add(hull); const rim = new T.Mesh(new T.TorusGeometry(1, 0.09, 6, 24), wood); rim.rotation.x = Math.PI / 2; rim.scale.set(2.6, 1.1, 1); rim.position.y = 0.3; boat.add(rim);
      const deck = new T.Mesh(new T.CircleGeometry(1, 20), deckM); deck.rotation.x = -Math.PI / 2; deck.scale.set(2.45, 1.0, 1); deck.position.y = 0.28; boat.add(deck); for (let i = 0; i < 5; i++) { const pl = new T.Mesh(new T.BoxGeometry(0.06, 0.02, 1.4 - Math.abs(i - 2) * 0.35), wood); pl.position.set(-1.6 + i * 0.8, 0.29, 0); boat.add(pl); } const mast = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 3.2, 6), wood); mast.position.y = 1.8; boat.add(mast);
      const sail = new T.Mesh(new T.PlaneGeometry(1.8, 2.2), sailM); sail.position.set(0.6, 2.1, 0); sail.rotation.y = Math.PI / 2; boat.add(sail); const flagm = new T.Mesh(new T.PlaneGeometry(0.7, 0.4), flagM); flagm.position.set(0.35, 3.3, 0); flagm.rotation.y = Math.PI / 2; boat.add(flagm);
      const lan = new T.Mesh(new T.BoxGeometry(0.3, 0.38, 0.3), glowMat(0xffd27a, 1.0)); lan.material.transparent = true; lan.position.set(-1.6, 0.9, 0); boat.add(lan); boat.traverse(o => { if (o.isMesh) o.userData.fadeable = true; });
      if (!isMeadow) boat.userData.hidden = true; const bx0 = -52 * SPR; boat.position.set(bx0, WATER_Y + 0.25, riverZ(bx0)); boat.userData = { id: 'boat', soon: false, base: WATER_Y + 0.25, top: 4, x0: bx0 }; const hit = new T.Mesh(new T.SphereGeometry(2.6, 8, 6), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 1; hit.userData.plot = boat; hit.userData.fadeable = false; boat.add(hit); pickables.push(hit); boat.traverse(o => { if (o.isMesh && o !== hit) { o.userData.plot = boat; pickables.push(o); } }); scene.add(boat); anchors.push({ g: boat, id: 'boat', soon: false, h: 4 }); portalGroups.set('boat', boat); boat.visible = false; }
    // the world's edge: the falls, a sea of clouds, the plunge pool far below and the rainbow the boat sails behind
    const falls = new T.Group(); falls.visible = false; scene.add(falls); const leafFar = M(0x3f8f3a, { fog: false }), leafFar2 = M(0x6fbf4a, { fog: false });
    { const fx = 63 * SPR, fz = riverZ(60 * SPR); const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(210,240,255,0.95)'); gr.addColorStop(1, 'rgba(140,200,250,0.35)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 256); x.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 40; i++) x.fillRect(Math.random() * 64, Math.random() * 256, 2, 20 + Math.random() * 40); const wt = new T.CanvasTexture(c); wt.wrapS = wt.wrapT = T.RepeatWrapping;
      const sheet = new T.Mesh(new T.PlaneGeometry(10, 36), new T.MeshBasicMaterial({ map: wt, transparent: true, depthWrite: false, side: T.DoubleSide, fog: false })); sheet.position.set(fx, WATER_Y - 18, fz); sheet.rotation.y = Math.PI / 2; falls.add(sheet); falls.userData = { wt, fx, fz };
      const cliff = new T.Mesh(new T.BoxGeometry(6, 38, 70), M(0x6b5a4a, { flatShading: true, fog: false })); cliff.position.set(fx - 3.5, WATER_Y - 19, fz); falls.add(cliff);
      const low = new T.Mesh(new T.PlaneGeometry(140, 140), M(0x6fae4a, { fog: false })); low.rotation.x = -Math.PI / 2; low.position.set(fx + 60, WATER_Y - 35, fz); falls.add(low);
      const pool = new T.Mesh(new T.CircleGeometry(13, 28), M(0x5fb6e6, { roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.9, fog: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(fx + 8, WATER_Y - 34.9, fz); falls.add(pool);
      for (let i = 0; i < 16; i++) { const r = new T.Mesh(new T.DodecahedronGeometry(0.9 + Math.random() * 1.6, 0), boulderMat); const a = Math.random() * Math.PI * 2, d = 11 + Math.random() * 7; r.position.set(fx + 8 + Math.cos(a) * d, WATER_Y - 34.5, fz + Math.sin(a) * d); falls.add(r); }
      for (let i = 0; i < 18; i++) { const t = new T.Group(); const a = Math.random() * Math.PI * 2, d = 24 + Math.random() * 30; t.position.set(fx + 20 + Math.cos(a) * d, WATER_Y - 35, fz + Math.sin(a) * d); cyl(0.3, 0.4, 3, trunkMat, 0, 1.5, 0, t, 5); const cr = new T.Mesh(new T.SphereGeometry(2.2 + Math.random(), 8, 6), i % 2 ? leafFar : leafFar2); cr.position.y = 4; t.add(cr); falls.add(t); }
      { const c2 = document.createElement('canvas'); c2.width = 4; c2.height = 128; const g2 = c2.getContext('2d'); const gr2 = g2.createLinearGradient(0, 0, 0, 128); gr2.addColorStop(0, '#4f9fe8'); gr2.addColorStop(0.55, '#a8d4f7'); gr2.addColorStop(1, '#eef7ff'); g2.fillStyle = gr2; g2.fillRect(0, 0, 4, 128); const st = new T.CanvasTexture(c2); st.colorSpace = T.SRGBColorSpace; const skyWall = new T.Mesh(new T.PlaneGeometry(150, 130), new T.MeshBasicMaterial({ map: st, fog: false, depthWrite: false })); skyWall.position.set(fx + 77, WATER_Y + 20, fz); skyWall.rotation.y = -Math.PI / 2; falls.add(skyWall); }
      const sun = new T.Sprite(new T.SpriteMaterial({ map: SOFT_GOLD, transparent: true, opacity: 0.9, depthWrite: false, fog: false })); sun.scale.set(60, 60, 1); sun.position.set(fx + 70, WATER_Y + 24, fz + 16); falls.add(sun);
      const cloudSea = new T.Group(); for (let i = 0; i < 46; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: SOFT_WHITE, color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, fog: false })); const sc2 = 9 + Math.random() * 12; s.scale.set(sc2 * 1.6, sc2, 1); s.position.set(fx + 6 + Math.random() * 66, WATER_Y - 12 - Math.random() * 14, fz - 45 + Math.random() * 90); s.userData = { v: 0.3 + Math.random() * 0.5 }; cloudSea.add(s); const sh = new T.Sprite(new T.SpriteMaterial({ map: SOFT_WHITE, color: 0xa9bfd6, transparent: true, opacity: 0.7, depthWrite: false, fog: false })); sh.scale.set(sc2 * 1.5, sc2 * 0.8, 1); sh.position.set(s.position.x, s.position.y - sc2 * 0.35, s.position.z); sh.userData = { v: s.userData.v }; cloudSea.add(sh); } falls.add(cloudSea); falls.userData.cloudSea = cloudSea;
      const cols = [0xff3b30, 0xff9500, 0xffcc00, 0x34c759, 0x32ade6, 0x5856d6, 0xaf52de]; const bowG = new T.Group(); bowG.position.set(fx + 27, WATER_Y - 5, fz); bowG.rotation.y = Math.PI / 2; cols.forEach((col, i) => { const arc = new T.Mesh(new T.TorusGeometry(22 - i * 1.05, 0.6, 8, 72, Math.PI), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.82, fog: false, depthWrite: false })); bowG.add(arc); }); falls.add(bowG); falls.userData.bow = bowG;
      const bow2 = new T.Group(); bow2.position.set(fx + 30, WATER_Y - 8, fz); bow2.rotation.y = Math.PI / 2; cols.slice().reverse().forEach((col, i) => { const arc = new T.Mesh(new T.TorusGeometry(29 - i * 0.9, 0.5, 6, 72, Math.PI), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, fog: false, depthWrite: false })); bow2.add(arc); }); falls.add(bow2);
      const sparks = new T.Group(); for (let i = 0; i < 50; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: SOFT_GOLD, transparent: true, opacity: 0.6, depthWrite: false, fog: false })); const a = Math.random() * Math.PI; const r = 12 + Math.random() * 14; s.scale.set(1.2, 1.2, 1); s.position.set(fx + 27 + (Math.random() - 0.5) * 6, WATER_Y - 5 + Math.sin(a) * r, fz + Math.cos(a) * r); s.userData = { k: Math.random() * 6 }; sparks.add(s); } falls.add(sparks); falls.userData.sparks = sparks;
      const mist = new T.Group(); for (let i = 0; i < 34; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: SOFT_WHITE, transparent: true, opacity: 0.3, depthWrite: false, fog: false })); s.scale.set(5, 5, 1); s.position.set(fx + (Math.random() - 0.5) * 7, WATER_Y - 30 + Math.random() * 10, fz + (Math.random() - 0.5) * 12); s.userData = { k: Math.random() * 6 }; mist.add(s); } falls.add(mist); falls.userData.mist = mist;
      const wake = new T.Group(); for (let i = 0; i < 16; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: SOFT_WHITE, transparent: true, opacity: 0, depthWrite: false })); s.scale.set(1.4, 1.4, 1); s.userData = { life: 0 }; wake.add(s); } falls.add(wake); falls.userData.wake = wake; falls.userData.wakeI = 0; falls.userData.wakeT = 0; }
    const ride = { on: false, t: 0, cb: null, phase: 'river' };
    function setBoatFade(a) { boat.traverse(o => { if (o.isMesh && o.userData.fadeable && o.material) o.material.opacity = a; }); }
    function startBoat(cb) { if (ride.on || fly.on) return; ride.on = true; ride.t = 0; ride.phase = 'river'; ride.cb = cb; falls.visible = true; gesture = null; setBoatFade(1); boat.visible = true; }
    function endBoat() { ride.on = false; falls.visible = false; setBoatFade(1); boat.position.set(boat.userData.x0, WATER_Y + 0.25, riverZ(boat.userData.x0)); boat.rotation.set(0, 0, 0); placeCamera(); }
    function updateBoat(dt, tm) {
      if (falls.visible) { const U = falls.userData; U.wt.offset.y -= dt * 0.9; for (const s of U.mist.children) { s.position.y += dt * 1.4; if (s.position.y > WATER_Y - 16) s.position.y = WATER_Y - 32; s.material.opacity = 0.18 + 0.16 * Math.sin(tm * 2 + s.userData.k); } for (const s of U.cloudSea.children) { s.position.z += s.userData.v * dt; if (s.position.z > U.fz + 48) s.position.z = U.fz - 48; } for (const s of U.sparks.children) s.material.opacity = 0.25 + 0.6 * Math.abs(Math.sin(tm * 2.2 + s.userData.k)); for (const s of U.wake.children) { if (s.userData.life > 0) { s.userData.life -= dt; s.material.opacity = Math.max(0, s.userData.life / 1.6) * 0.7; s.scale.setScalar(1.4 + (1.6 - s.userData.life) * 1.6); s.position.x -= dt * 0.6; } } }
      if (!ride.on) { boat.position.y = WATER_Y + 0.25 + Math.sin(tm * 1.4) * 0.08; boat.rotation.z = Math.sin(tm * 1.1) * 0.03; return; }
      ride.t += dt; const U = falls.userData, fz = U.fz;
      if (ride.phase === 'river') { const x = boat.userData.x0 + ride.t * 9 * SPR; const z = riverZ(Math.min(60 * SPR, x)); boat.position.set(x, WATER_Y + 0.25 + Math.sin(tm * 3) * 0.07, z); const zn = riverZ(Math.min(60 * SPR, x + 1)); boat.rotation.y = -Math.atan2(zn - z, 1); boat.rotation.z = Math.sin(tm * 1.7) * 0.04;
        U.wakeT += dt; if (U.wakeT > 0.11) { U.wakeT = 0; const s = U.wake.children[U.wakeI++ % U.wake.children.length]; s.userData.life = 1.6; s.position.set(x - 2.2, WATER_Y + 0.12, z + (Math.random() - 0.5) * 1.2); }
        const za = riverZ(Math.min(60 * SPR, x + 9)); camera.position.set(x - 7.5, WATER_Y + 3.8 + Math.sin(tm * 0.9) * 0.2, z + 0.9 + Math.sin(tm * 0.5) * 0.4); camera.lookAt(x + 9, WATER_Y + 1.6, za); camera.rotateZ(Math.sin(tm * 0.8) * 0.02); if (x >= 60 * SPR) { ride.phase = 'edge'; ride.t = 0; } }
      else if (ride.phase === 'edge') { const k = Math.min(1, ride.t / 4.2); const bx = 60 * SPR + ride.t * 7.5; boat.position.set(bx, WATER_Y + 0.25 + ride.t * 0.55 + Math.sin(tm * 2) * 0.08, fz); boat.rotation.y = 0; boat.rotation.z = Math.sin(tm * 1.2) * 0.05; boat.rotation.x = -0.08; const fade = 1 - Math.max(0, Math.min(1, (ride.t - 2.3) / 1.5)); setBoatFade(fade); boat.visible = fade > 0.02;
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; camera.position.set(60 * SPR - 7.5 + e * 3, WATER_Y + 3.8 + e * 3.7, fz + 0.9 + e * 1.1); v3.set(60 * SPR + 9 + e * 21, WATER_Y + 1.6 + e * 6, fz); camera.lookAt(v3); if (k >= 1) { ride.phase = 'bow'; ride.t = 0; } }
      else if (ride.phase === 'bow') { camera.position.set(60 * SPR - 4.5 + Math.sin(tm * 0.3) * 0.3, WATER_Y + 7.5 + Math.sin(tm * 0.5) * 0.25, fz + 2); camera.lookAt(60 * SPR + 30, WATER_Y + 7.6, fz); if (ride.cb) { const cb = ride.cb; ride.cb = null; cb(); } }
    }
    // ---------- the demon realm: the same valley, charred and red, with dragons overhead and monsters in the grass ----------
    const realm = { demon: false, flip: null, treeMeshes: [], dragons: [], monsters: [], moon: null };
    scene.traverse(o => { if (o.isInstancedMesh) realm.treeMeshes.push(o); });
    { const hide = new T.MeshStandardMaterial({ color: 0x5a1210, roughness: 0.7, metalness: 0.15 }), wingM = new T.MeshStandardMaterial({ color: 0x2a0a0a, side: T.DoubleSide, roughness: 0.9 }), eyeM = new T.MeshBasicMaterial({ color: 0xffb020 });
      for (let i = 0; i < 3; i++) { const d = new T.Group(); const belly = new T.MeshStandardMaterial({ color: 0xc9743a, roughness: 0.6 }), horn = new T.MeshStandardMaterial({ color: 0x1a0c0c, roughness: 0.4 }), bone = new T.MeshStandardMaterial({ color: 0x3a1010, roughness: 0.8 });
        const body = new T.Mesh(new T.CapsuleGeometry(0.85, 4.2, 4, 10), hide); body.rotation.z = Math.PI / 2; d.add(body); const under = new T.Mesh(new T.CapsuleGeometry(0.62, 3.6, 4, 10), belly); under.rotation.z = Math.PI / 2; under.position.y = -0.35; d.add(under);
        const neck = new T.Mesh(new T.CylinderGeometry(0.4, 0.62, 2.4, 8), hide); neck.position.set(2.9, 0.7, 0); neck.rotation.z = -1.0; d.add(neck); const head = new T.Mesh(new T.BoxGeometry(1.7, 0.8, 0.8), hide); head.position.set(4.1, 1.35, 0); d.add(head); const jaw = new T.Mesh(new T.BoxGeometry(1.2, 0.3, 0.6), hide); jaw.position.set(4.3, 0.85, 0); d.add(jaw); const fire = new T.Mesh(new T.SphereGeometry(0.22, 6, 5), new T.MeshBasicMaterial({ color: 0xff7a1a })); fire.position.set(4.9, 1.05, 0); d.add(fire);
        for (const z of [-0.3, 0.3]) { const e = new T.Mesh(new T.SphereGeometry(0.13, 6, 5), eyeM); e.position.set(4.6, 1.55, z); d.add(e); const h = new T.Mesh(new T.ConeGeometry(0.14, 1.1, 6), horn); h.position.set(3.6, 1.95, z * 1.4); h.rotation.z = 0.7; d.add(h); }
        for (let s = 0; s < 7; s++) { const sp = new T.Mesh(new T.ConeGeometry(0.16, 0.7, 5), horn); sp.position.set(2.0 - s * 0.75, 0.95, 0); d.add(sp); }
        const tail = new T.Mesh(new T.ConeGeometry(0.45, 4.6, 6), hide); tail.rotation.z = Math.PI / 2; tail.position.x = -4.4; d.add(tail); const tip = new T.Mesh(new T.ConeGeometry(0.5, 1.0, 4), horn); tip.rotation.z = -Math.PI / 2; tip.position.x = -6.9; d.add(tip);
        for (const [lx, lz] of [[1.3, -0.6], [1.3, 0.6], [-1.3, -0.6], [-1.3, 0.6]]) { const leg = new T.Mesh(new T.CylinderGeometry(0.16, 0.22, 1.3, 6), hide); leg.position.set(lx, -1.1, lz); leg.rotation.x = lz * 0.3; d.add(leg); }
        const wings = []; for (const s of [-1, 1]) { const w = new T.Group(); const shape = new T.Shape(); shape.moveTo(0, 0); shape.lineTo(0, 1.2); shape.quadraticCurveTo(3.2, 3.6, 6.6, 4.4); shape.lineTo(5.4, 2.4); shape.lineTo(6.2, 0.9); shape.lineTo(4.6, -0.1); shape.lineTo(2.2, -0.9); shape.lineTo(0, 0); const mem = new T.Mesh(new T.ShapeGeometry(shape), wingM); mem.rotation.x = Math.PI / 2; mem.rotation.z = s > 0 ? 0 : Math.PI; mem.position.set(0.4, 0.3, 0); if (s < 0) mem.scale.x = -1; w.add(mem); for (const [ax, ay] of [[6.6, 4.4], [6.2, 0.9], [4.6, -0.1]]) { const b = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, Math.hypot(ax, ay), 5), bone); b.position.set(0.4 + ax / 2, 0.3, s * ay / 2); b.rotation.x = Math.PI / 2; b.rotation.z = -Math.atan2(ay * s, ax) * s; w.add(b); } d.add(w); wings.push({ g: w, s }); }
        d.userData = { wings, a: i * 2.1, r: (30 + i * 7) * SPR, h: 20 + i * 4, v: 0.18 + i * 0.03 }; d.scale.setScalar(1.15); d.visible = false; scene.add(d); realm.dragons.push(d); }
      const skin = new T.MeshStandardMaterial({ color: 0x2b1030, roughness: 1 }), spike = new T.MeshStandardMaterial({ color: 0x140818, roughness: 1 });
      for (let i = 0; i < 6; i++) { const m = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(0.9, 10, 8), skin); b.position.y = 0.9; m.add(b); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const sp = new T.Mesh(new T.ConeGeometry(0.16, 0.9, 5), spike); sp.position.set(Math.cos(a) * 0.5, 1.5, Math.sin(a) * 0.5); sp.rotation.z = Math.cos(a) * 0.6; sp.rotation.x = -Math.sin(a) * 0.6; m.add(sp); } for (const z of [-0.3, 0.3]) { const e = new T.Mesh(new T.SphereGeometry(0.14, 6, 5), eyeM); e.position.set(0.72, 1.05, z); m.add(e); }
        let x, z; do { x = (Math.random() - 0.5) * 60 * SPR; z = (Math.random() - 0.5) * 60 * SPR; } while (!dry(x, z) || Math.hypot(x, z) < 16); m.position.set(x, height(x, z), z); m.userData = { target: null, wait: Math.random() * 3 }; m.visible = false; scene.add(m); realm.monsters.push(m); }
      // ground fog: soft puffs that drift low over the grass, only in the demon realm
      { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const grd = x.createRadialGradient(64, 64, 4, 64, 64, 64); grd.addColorStop(0, 'rgba(255,120,110,0.55)'); grd.addColorStop(0.5, 'rgba(180,60,60,0.25)'); grd.addColorStop(1, 'rgba(120,30,40,0)'); x.fillStyle = grd; x.fillRect(0, 0, 128, 128); const fogTex = new T.CanvasTexture(c); realm.fog = new T.Group(); realm.fog.visible = false; scene.add(realm.fog);
        for (let i = 0; i < 46; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: fogTex, transparent: true, opacity: 0.55, depthWrite: false, fog: false })); const s = 10 + Math.random() * 14; sp.scale.set(s, s * 0.45, 1); let px, pz; do { px = (Math.random() - 0.5) * 100 * SPR; pz = (Math.random() - 0.5) * 100 * SPR; } while (Math.hypot(px, pz) < 10); sp.position.set(px, height(px, pz) + 1.2, pz); sp.userData = { v: 0.4 + Math.random() * 0.6, k: Math.random() * 6, h: 1.2 + Math.random() * 1.2 }; realm.fog.add(sp); } }
      realm.moon = new T.Mesh(new T.CircleGeometry(14, 32), new T.MeshBasicMaterial({ color: 0xff3a1e, transparent: true, opacity: 0.9, fog: false })); realm.moon.position.set(-90, 70, -120); realm.moon.lookAt(0, 0, 0); realm.moon.visible = false; scene.add(realm.moon); }
    const PAL_DEMON = { top: 0x1a0208, hor: 0x7a1a12, fog: 0x2a0a08, sun: 0xff6a3a, sunI: 0.9, amb: 0x5a1a1a, gnd: 0x2a0a06 };
    function setRealm(demon) { realm.demon = !!demon; const P = demon ? PAL_DEMON : PAL; if (post) post.setGrade(demon ? 'demon' : baseGrade);
      sky.material.uniforms.top.value.setHex(P.top); sky.material.uniforms.hor.value.setHex(P.hor); scene.fog.color.setHex(P.fog); sun.color.setHex(P.sun); sun.intensity = demon ? PAL_DEMON.sunI : PAL.sunI * 1.25; hemiLight.color.setHex(P.amb); hemiLight.groundColor.setHex(demon ? PAL_DEMON.gnd : PAL.grass2);
      if (ground.material && ground.material.color) ground.material.color.setHex(demon ? 0x7a5048 : 0xffffff);
      for (const m of realm.treeMeshes) if (m.material && m.material.color) m.material.color.setHex(demon ? 0x4a2418 : 0xffffff);
      for (const c of motes.children) if (c.material && c.material.color) c.material.color.setHex(demon ? 0xff5a1e : 0xfff2c8);
      for (const d of realm.dragons) d.visible = demon; for (const m of realm.monsters) m.visible = demon; realm.moon.visible = demon; realm.fog.visible = demon; scene.fog.near = demon ? 30 * SPR : FOG0[0]; scene.fog.far = demon ? 125 * SPR : FOG0[1];   /* back to this meadow's own haze (the golden one too) */
      for (const s of fauna.sheep) s.visible = !demon; for (const m of fauna.monkeys) m.visible = !demon; for (const f of fauna.flies) f.visible = !demon && f.userData.mat.opacity > 0.02; if (demon && fauna.herd) { for (const m of fauna.herd.members) m.h.visible = false; fauna.herd = null; }
      container.classList.toggle('demon', !!demon); }
    // the flip: the whole valley turns over, swaps realm while upside-down, and comes back the other way up
    function flipRealm(demon, done) { if (realm.flip) return; realm.flip = { t: 0, demon: !!demon, swapped: false, done }; }
    function updateRealm(dt, tm) {
      if (realm.flip) { const F = realm.flip; F.t = Math.min(1, F.t + dt / 1.5); const e = F.t < 0.5 ? 2 * F.t * F.t : 1 - Math.pow(-2 * F.t + 2, 2) / 2; scene.rotation.x = e * Math.PI * 2; if (!F.swapped && F.t >= 0.5) { F.swapped = true; setRealm(F.demon); } if (F.t >= 1) { scene.rotation.x = 0; realm.flip = null; if (F.done) F.done(); } }
      if (!realm.demon && !realm.dragons.some(d => d.visible)) return;   /* the sky isles keep two friendly dragons circling */
      for (const d of realm.dragons) { if (!d.visible) continue; const u = d.userData; u.a += dt * u.v; const x = Math.cos(u.a) * u.r, z = Math.sin(u.a) * u.r; d.position.set(x, u.h + Math.sin(tm * 0.8 + u.r) * 2, z); d.rotation.y = -u.a - Math.PI / 2; for (const w of u.wings) w.g.rotation.x = Math.sin(tm * 3.2 + u.r) * 0.5 * w.s; }
      for (const m of realm.monsters) { const u = m.userData; if (u.wait > 0) { u.wait -= dt; m.rotation.y += dt * 0.6; continue; } if (!u.target) { for (let k = 0; k < 8; k++) { const tx = m.position.x + (Math.random() - 0.5) * 16, tz = m.position.z + (Math.random() - 0.5) * 16; if (dry(tx, tz) && Math.hypot(tx, tz) > 15 && Math.hypot(tx, tz) < 40) { u.target = [tx, tz]; break; } } if (!u.target) { u.wait = 2; continue; } } const dx = u.target[0] - m.position.x, dz = u.target[1] - m.position.z, d = Math.hypot(dx, dz); if (d < 0.4) { u.target = null; u.wait = 1 + Math.random() * 4; continue; } const sp = 2.2 * dt; m.position.x += dx / d * sp; m.position.z += dz / d * sp; m.position.y = height(m.position.x, m.position.z) + Math.abs(Math.sin(tm * 6)) * 0.3; m.rotation.y = Math.atan2(-dz, dx); }
      realm.moon.material.opacity = 0.8 + 0.15 * Math.sin(tm * 1.3);
      for (const sp of realm.fog.children) { const u = sp.userData; sp.position.x += u.v * dt; if (sp.position.x > 55 * SPR) sp.position.x = -55 * SPR; sp.position.y = height(sp.position.x, sp.position.z) + u.h + Math.sin(tm * 0.5 + u.k) * 0.3; sp.material.opacity = 0.2 + 0.1 * Math.sin(tm * 0.7 + u.k); }
    }
    function updateFauna(dt, tm, camPos) {
      // sheep: wander to a nearby dry spot, graze, repeat; legs swing while walking
      for (const s of fauna.sheep) { const u = s.userData; if (u.wait > 0) { u.wait -= dt; u.head.position.y = 0.15 - 0.18 * Math.max(0, Math.sin(tm * 1.6 + u.phase)); continue; }
        if (!u.target) { for (let k = 0; k < 8; k++) { const tx = s.position.x + (Math.random() - 0.5) * 10, tz = s.position.z + (Math.random() - 0.5) * 10; if (dry(tx, tz) && Math.hypot(tx + 30 * SPR, tz - 8 * SPR) < 16 * SPR) { u.target = [tx, tz]; break; } } if (!u.target) { u.wait = 2; continue; } }
        const dx = u.target[0] - s.position.x, dz = u.target[1] - s.position.z, d = Math.hypot(dx, dz); if (d < 0.3) { u.target = null; u.wait = 3 + Math.random() * 7; continue; }
        const sp = 0.9 * dt; s.position.x += dx / d * sp; s.position.z += dz / d * sp; s.position.y = height(s.position.x, s.position.z) + 0.45; s.rotation.y = Math.atan2(-dz, dx); u.legs.forEach((lg, i) => { lg.rotation.z = Math.sin(tm * 8 + i * 1.57) * 0.35; }); u.head.position.y = 0.15; }
      // horses: every 25–55 s a herd of 4–6 gallops along an arc around the valley, then vanishes
      fauna.nextHerd -= dt;
      if (!fauna.herd && fauna.nextHerd <= 0) { const n = 4 + Math.floor(Math.random() * 3), a0 = Math.random() * Math.PI * 2, dir = Math.random() < 0.5 ? 1 : -1; fauna.herd = { a: a0, dir, len: 1.9 + Math.random() * 0.8, done: 0, members: fauna.horses.slice(0, n).map((h, i) => ({ h, lag: i * 0.06, r: 42 * SPR + (i % 3) * 1.6 })) }; for (const m of fauna.herd.members) m.h.visible = true; }
      if (fauna.herd) { const H = fauna.herd; H.done += dt * 0.14; for (const m of H.members) { const a = H.a + H.dir * (H.done - m.lag); const x = Math.cos(a) * m.r, z = Math.sin(a) * m.r; const y = Math.max(WATER_Y + 0.2, height(x, z)); m.h.position.set(x, y, z); m.h.rotation.y = Math.atan2(-Math.sin(a + H.dir * 0.1) * m.r + z, Math.cos(a + H.dir * 0.1) * m.r - x); m.h.rotation.y = -a + (H.dir > 0 ? -Math.PI / 2 : Math.PI / 2); const u = m.h.userData; u.legs.forEach((lg, i) => { lg.rotation.z = Math.sin(tm * 14 + u.k + (i < 2 ? 0 : Math.PI)) * 0.6; }); u.body.position.y = 1.35 + Math.abs(Math.sin(tm * 14 + u.k)) * 0.18; }
        if (H.done > H.len) { for (const m of H.members) m.h.visible = false; fauna.herd = null; fauna.nextHerd = 25 + Math.random() * 30; } }
      // monkeys: sit, then leap in an arc to another tree within reach
      for (const mk of fauna.monkeys) { const u = mk.userData; if (u.t < 1) { u.t = Math.min(1, u.t + dt * 1.6); const e = u.t, arc = Math.sin(e * Math.PI) * 3.2; mk.position.set(u.from[0] + (u.to[0] - u.from[0]) * e, u.from[1] + (u.to[1] - u.from[1]) * e + arc, u.from[2] + (u.to[2] - u.from[2]) * e); mk.scale.y = 1 + 0.25 * Math.sin(e * Math.PI); continue; }
        u.wait -= dt; if (u.wait > 0) { mk.rotation.y += dt * 0.3; continue; } const near = fauna.treeSpots.filter(t => Math.hypot(t[0] - mk.position.x, t[2] - mk.position.z) < 13 && Math.hypot(t[0] - mk.position.x, t[2] - mk.position.z) > 2); if (!near.length) { u.wait = 5; continue; } const to = near[Math.floor(Math.random() * near.length)]; u.from = [mk.position.x, mk.position.y, mk.position.z]; u.to = [to[0], to[1] + 4.6, to[2]]; u.t = 0; u.wait = 6 + Math.random() * 14; mk.rotation.y = Math.atan2(-(to[2] - mk.position.z), to[0] - mk.position.x); }
      // butterflies: flutter in loops; fade in as the camera comes within ~34 units
      for (const f of fauna.flies) { const u = f.userData; const a = tm * u.v + u.k; f.position.x = u.cx + Math.cos(a) * u.r; f.position.z = u.cz + Math.sin(a * 1.3) * u.r * 0.7; f.position.y = u.h + Math.sin(tm * 2.2 + u.k) * 0.5; f.rotation.y = -a + Math.PI / 2; const fl = Math.sin(tm * 11 + u.k) * 0.95; u.wl.rotation.y = -fl; u.wr.rotation.y = fl; const d = camPos.distanceTo(f.position); const want = (u.dead || ride.on || fly.on) ? 0 : d < 22 ? 1 : d < 36 ? 1 - (d - 22) / 14 : 0;   /* dead = hidden by the realm (no butterflies in the underworld) */ u.mat.opacity += (want - u.mat.opacity) * Math.min(1, dt * 3); f.visible = u.mat.opacity > 0.02; }
    }
    // ---------- forest: three instanced species, GPU wind, one draw call each ----------
    const BROAD = buildBroadleaf(), CONIF = buildConifer(), BIRCH = buildBirch();
    const cs = contactShadows(scene, Math.round(620 * SPR));
    const pickSpot = (minD, maxD) => () => {
      const x = (R32() - 0.5) * 122 * SPR, z = (R32() - 0.5) * 122 * SPR, d = Math.hypot(x, z);
      if (d < minD || d > maxD || !placeOk(x, z, 1.6)) return null;
      const y = terrainHeight(x, z);
      if (y < WATER_Y + 0.35 || pathDist(x, z) < 2.6) return null;
      return { x, y, z };
    };
    const onPlaced = (x, y, z, s) => { cs.add(x, y, z, 2.1 * s, 0.85); fauna.treeSpots.push([x, y, z]); };
    plantSpecies(scene, BROAD, Math.round(130 * SPR), pickSpot(15, 61 * SPR), { stiff: 2.1, tag: 'broad', onPlaced });
    plantSpecies(scene, CONIF, Math.round(130 * SPR), pickSpot(18, 62 * SPR), { stiff: 3.0, tag: 'conif', onPlaced });
    plantSpecies(scene, BIRCH, Math.round(70 * SPR), pickSpot(15, 54 * SPR), { stiff: 1.8, tag: 'birch', onPlaced });
    /* ?look=rich: a ground with things standing on it — grass tufts that move with the trees' wind, flower clusters, half-buried stones */
    if (RICH && isMeadow) {
      const spotG = (minD, maxD, path) => { const x = (R32() - 0.5) * 124 * SPR, z = (R32() - 0.5) * 124 * SPR, d = Math.hypot(x, z); if (d < minD || d > maxD || !placeOk(x, z, 0.6)) return null; const y = terrainHeight(x, z); if (y < WATER_Y + 0.3 || pathDist(x, z) < path) return null; return { x, y, z }; };
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), col = new T.Color();
      { const P = [], C = []; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3, lean = 0.18 + (k % 2) * 0.12, cx = Math.cos(a), cz = Math.sin(a), h = 0.75 + (k % 3) * 0.18, w = 0.07;
          P.push(-cz * w, 0, cx * w, cz * w, 0, -cx * w, cx * lean, h, cz * lean); C.push(0.18, 0.36, 0.12, 0.18, 0.36, 0.12, 0.62, 0.78, 0.34); }
        const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(P, 3)); tg.setAttribute('color', new T.Float32BufferAttribute(C, 3)); tg.computeVertexNormals();
        const tm = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: T.DoubleSide }); applyWind(tm, 1.0, 1.4, 'tuft'); applyCloudShadow(tm, 'tuft');
        const N = Math.round(12000 * SPR), im = new T.InstancedMesh(tg, tm, N); let n = 0, g = 0;
        while (n < N && g++ < N * 6) { const p = spotG(4, 64 * SPR, 1.5); if (!p) continue; const sc = 0.65 + R32() * 0.75; e.set(0, R32() * 6.283, 0); m4.compose(new T.Vector3(p.x, p.y - 0.04, p.z), q.setFromEuler(e), new T.Vector3(sc, sc * (0.8 + R32() * 0.6), sc)); im.setMatrixAt(n, m4);
          col.setHSL(0.24 + (R32() - 0.5) * 0.06, 0.55, 0.62 + R32() * 0.2); im.setColorAt(n++, col); }
        im.count = n; im.receiveShadow = true; im.castShadow = false; scene.add(im); }
      { const im = new T.InstancedMesh(new T.IcosahedronGeometry(0.16, 0), new T.MeshStandardMaterial({ roughness: 0.7, emissive: 0x221100, emissiveIntensity: 0.15 }), 1700), pal = [0xff7eb6, 0xfff3a6, 0xffffff, 0xb48cff, 0xff9f5a, 0xff5d6c]; let n = 0, g = 0;
        while (n < 1700 && g++ < 3000) { const c0 = spotG(6, 62 * SPR, 2.0); if (!c0) continue; const cc = pal[(R32() * pal.length) | 0], k = 6 + ((R32() * 10) | 0);
          for (let j = 0; j < k && n < 1700; j++) { const x = c0.x + (R32() - 0.5) * 3.2, z = c0.z + (R32() - 0.5) * 3.2; if (pathDist(x, z) < 1.6 || !placeOk(x, z, 0.4)) continue; const y = terrainHeight(x, z);
            m4.compose(new T.Vector3(x, y + 0.42 + R32() * 0.25, z), q.identity(), new T.Vector3(1, 0.75, 1).multiplyScalar(0.8 + R32() * 0.5)); im.setMatrixAt(n, m4); im.setColorAt(n++, col.setHex(cc)); } }
        im.count = n; scene.add(im); }
      { const rg = new T.IcosahedronGeometry(1, 1), rp = rg.attributes.position, rc = new Float32Array(rp.count * 3), v = new T.Vector3();
        for (let i = 0; i < rp.count; i++) { v.set(rp.getX(i), rp.getY(i), rp.getZ(i)); const k = 1 + 0.16 * Math.sin(v.x * 4.1 + v.z * 2.3) * Math.cos(v.y * 3.7); rp.setXYZ(i, v.x * k, v.y * k * 0.72, v.z * k); const sh = 0.62 + 0.38 * (v.y * 0.5 + 0.5); rc.set([sh, sh, sh * 0.96], i * 3); }
        rg.setAttribute('color', new T.BufferAttribute(rc, 3)); rg.computeVertexNormals();
        const im = new T.InstancedMesh(rg, new T.MeshStandardMaterial({ color: 0xa49c90, vertexColors: true, roughness: 0.95 }), 160); let n = 0, g = 0;
        while (n < 160 && g++ < 2000) { const p = spotG(5, 63 * SPR, 2.2); if (!p) continue; const sc = 0.25 + Math.pow(R32(), 2) * 0.9; e.set(R32() * 0.4, R32() * 6.283, R32() * 0.4); m4.compose(new T.Vector3(p.x, p.y - sc * 0.25, p.z), q.setFromEuler(e), new T.Vector3(sc * (1 + R32() * 0.5), sc, sc)); im.setMatrixAt(n++, m4); }
        im.count = n; im.castShadow = true; im.receiveShadow = true; scene.add(im); }
    }
    // ---------- three secret eggs, tucked away where only an explorer looks; found ones are hidden per player ----------
    const eggs = []; const eggMat = new T.MeshStandardMaterial({ color: 0xffd35a, emissive: 0xff9a1c, emissiveIntensity: 0.35, roughness: 0.25, metalness: 0.6 });
    function egg(n, x, z) { const g = new T.Group(); { let best = null; for (let r = 0; r <= 8 && !best; r += 1) for (let a = 0; a < 12 && !best; a++) { const tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r; if (height(tx, tz) > WATER_Y + 0.7 && pathDist(tx, tz) > 2.5) best = [tx, tz]; } if (best) { x = best[0]; z = best[1]; } }   // nudge onto dry ground, off the roads
      const y = height(x, z); g.position.set(x, y, z); g.userData = { id: 'egg:' + n, soon: false, base: y, top: 1.4, k: n * 1.7 }; const m = new T.Mesh(new T.SphereGeometry(0.42, 14, 12), eggMat); m.scale.set(1, 1.3, 1); m.position.y = 0.55; m.castShadow = true; m.userData.plot = g; g.add(m); pickables.push(m); const hit = new T.Mesh(new T.SphereGeometry(1.6, 8, 6), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.6; hit.userData.plot = g; g.add(hit); pickables.push(hit); /* a generous invisible hit zone: the egg itself is only a few pixels from afar */ const sp = new T.Mesh(new T.SphereGeometry(0.08, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff })); sp.position.set(0.3, 1.1, 0); g.add(sp); scene.add(g); eggs.push(g); return g; }
    egg(1, ...SPX(-42, -12)); egg(2, ...SPX(38, -16)); egg(3, ...SPX(-8, -20));
    function setEggs(found) { for (const g of eggs) g.visible = !(found || []).includes(g.userData.id); }
    // ---------- player-made eggs: coloured, with the maker's emblem floating above; placed by tapping the ground ----------
    const peggs = new Map(); let placing = null;
    function eggGroup(e, ghost) { const gp = new T.Group(); const ex = e.x * SPR, ez = e.z * SPR, y = height(ex, ez); gp.position.set(ex, y, ez); gp.userData = { id: e.id, soon: false, base: y, top: 1.6, k: (e.ts || 0) % 7 };
      const m = new T.Mesh(new T.SphereGeometry(0.5, 16, 12), new T.MeshStandardMaterial({ color: new T.Color(e.color || '#ffd35a'), emissive: new T.Color(e.color || '#ffd35a'), emissiveIntensity: ghost ? 0.5 : 0.22, roughness: 0.3, metalness: 0.2, transparent: ghost, opacity: ghost ? 0.7 : 1 })); m.scale.set(1, 1.3, 1); m.position.y = 0.65; m.castShadow = !ghost; m.userData.plot = gp; gp.add(m);
      const sp = emojiSprite(e.emoji || '⭐') || emojiSprite('⭐'); if (sp) { sp.position.set(0, 1.9, 0); sp.scale.set(1.3, 1.3, 1); gp.add(sp); }
      if (!ghost) { const hit = new T.Mesh(new T.SphereGeometry(1.7, 8, 6), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.7; hit.userData.plot = gp; gp.add(hit); pickables.push(hit); pickables.push(m); }
      scene.add(gp); return gp; }
    /* ---------- Mount Glory's signatures (Yoni 2026-10-03: 'he writes in a field something he wants to sign, and then it appears on the
       mountain'): every signature is a little flag on the slope with its words on a plaque that always faces you, so they read from above.
       Rings from the summit down; the newest can be singled out (hi) and the camera turned to it. ---------- */
    let signG = null; const signSpots = [];
    const SIGN_RINGS = [[19.5, 3], [15.5, 5], [11.5, 7], [7.5, 9], [3.5, 11], [17.5, 4], [13.5, 6], [9.5, 8], [5.5, 10]];   /* [height on the mountain, how many fit] */
    function signSpot(i) { let k = 0, n = i; while (k < SIGN_RINGS.length - 1 && n >= SIGN_RINGS[k][1]) { n -= SIGN_RINGS[k][1]; k++; } const [y, cap] = SIGN_RINGS[k], a = n / cap * Math.PI * 2 + k * 0.45 + 0.3, r = 14 * (26 - y) / 26 + 0.25; return { a, y, r }; }
    function signTex(s, hi) { const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const g = c.getContext('2d'), he = /[\u0590-\u05FF]/.test((s.text || '') + s.name);
      const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
      rr(8, 8, 1008, 284, 48); g.fillStyle = hi ? 'rgba(58,40,10,.94)' : 'rgba(28,22,44,.9)'; g.fill(); g.lineWidth = hi ? 14 : 8; g.strokeStyle = hi ? '#ffd86a' : '#d8b04a'; g.stroke();
      g.direction = he ? 'rtl' : 'ltr'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff4dc';
      const fit = (txt, px, maxW) => { let f = px; do { g.font = '800 ' + f + 'px Rubik, Assistant, "Secular One", sans-serif'; f -= 4; } while (g.measureText(txt).width > maxW && f > 30); };
      const txt = s.text || s.name; fit(txt, 104, 940); g.fillText(txt, 512, s.text ? 118 : 150);
      if (s.text) { g.fillStyle = '#ffe7a8'; g.direction = /[\u0590-\u05FF]/.test(s.name) ? 'rtl' : 'ltr'; fit(s.name, 64, 900); g.fillText(s.name, 512, 226); }   /* the signer's name under their words */
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }
    function setSignatures(list, hi) { const a = anchors.find(x => x.id === 'glory'); if (!a) return; signSpots.length = 0;
      if (signG) { a.g.remove(signG); signG.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); signG = null; }
      if (!list || !list.length) return; signG = new T.Group(); signG.userData.noMerge = true; a.g.add(signG);
      const pole = new T.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.8 });
      const draw = () => list.forEach((s, i) => { const sp = signSpot(i), x = Math.cos(sp.a) * sp.r, z = Math.sin(sp.a) * sp.r, me = i === hi; signSpots.push(sp);
        const pm = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.8, 6), pole); pm.position.set(x, sp.y + 0.9, z); signG.add(pm);
        const fl = new T.Mesh(new T.PlaneGeometry(0.9, 0.55), new T.MeshStandardMaterial({ color: me ? 0xffc83a : [0xe8475a, 0x3a9aff, 0x3fae62, 0xb48cff, 0xff9a3c][i % 5], side: T.DoubleSide, roughness: 0.6 })); fl.position.set(x + 0.45, sp.y + 1.5, z); fl.rotation.y = -sp.a; signG.add(fl);
        const sm = new T.SpriteMaterial({ map: signTex(s, me), transparent: true, depthWrite: false }); const spr = new T.Sprite(sm); spr.scale.set(me ? 4.6 : 3.8, me ? 1.35 : 1.11, 1); spr.position.set(x * 1.12, sp.y + 2.6, z * 1.12); spr.renderOrder = 3; signG.add(spr); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (signG && signG.parent) { signG.clear(); signSpots.length = 0; draw(); } }); draw(); }
    /* the view round the mountain: the camera circles Mount Glory itself and may look straight down on it (the valley view stops at a
       steep angle and circles the middle of the valley, so the summit and the signatures were never in sight) */
    function viewGlory(on, o) { const a = anchors.find(x => x.id === 'glory'); if (on && !a) return false; o = o || {}; VIEW.on = !!on; idle = 0;
      if (on) { const g = a.g; VIEW.to.set(g.position.x, g.position.y + 11, g.position.z); LIM.pMin = 0.06; LIM.pMax = 1.3; LIM.rMin = 21; LIM.rMax = 80;   /* never inside the rock: 21 from the middle clears the summit (26 high) looking straight down */ orbit.tPhi = o.phi || 0.42; orbit.tRadius = o.radius || 48;
        if (o.sign != null && signSpots[o.sign]) { const sp = signSpots[o.sign]; orbit.tTheta = Math.PI / 2 - sp.a; orbit.tPhi = 0.62; orbit.tRadius = 26; VIEW.to.set(g.position.x, g.position.y + sp.y + 1.5, g.position.z); idle = -8; } }
      else { VIEW.to.copy(VIEW.home); LIM.pMin = 0.55; LIM.pMax = 1.35; LIM.rMin = 26; LIM.rMax = 105 * SPR; orbit.tPhi = 0.98; orbit.tRadius = 76 * CAMR; }
      orbit.tPhi = Math.max(LIM.pMin, Math.min(LIM.pMax, orbit.tPhi)); return true; }
    function setPlayerEggs(list) { const keep = new Set(); for (const e of list || []) { keep.add(e.id); let gp = peggs.get(e.id); if (!gp) { gp = eggGroup(e, false); peggs.set(e.id, gp); } gp.position.x = e.x * SPR; gp.position.z = e.z * SPR; gp.userData.base = height(gp.position.x, gp.position.z); } for (const [id, gp] of peggs) if (!keep.has(id)) { scene.remove(gp); peggs.delete(id); } }
    // placing mode: a ghost egg follows the pointer over the ground; a tap drops it and hands back the spot
    function startPlacing(look, cb) { stopPlacing(); placing = { ghost: eggGroup(Object.assign({ id: 'ghost', x: 0, z: 20 }, look), true), cb }; cv.style.cursor = 'crosshair'; }
    function stopPlacing() { if (!placing) return; scene.remove(placing.ghost); placing = null; cv.style.cursor = 'grab'; }
    function groundAt(x, y) { const r = renderer.domElement.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1)); ray.setFromCamera(ndc, camera); const h = ray.intersectObject(ground, false); return h.length ? h[0].point : null; }
    cs.commit();
    for (let i = 0; i < 3; i++) { const t = fauna.treeSpots[Math.floor(Math.random() * fauna.treeSpots.length)]; if (!t) break; const mk = monkey(); mk.position.set(t[0], t[1] + 4.6, t[2]); fauna.monkeys.push(mk); }

    // ---------- atmosphere ----------
    const motes = new T.Group(); scene.add(motes); motes.add(dustMotes(400, 60 * SPR));
    if (!FX) scene.add(vignetteOverlay(night ? 0.62 : 0.5));
    for (const m of [stoneMat, stoneDark, roofMat, roofBlue, woodMat, thatch]) if (m) applyCloudShadow(m, 'b');

    // birds
    const birds = new T.Group(); scene.add(birds);
    for (let i = 0; i < 6; i++) { const b = new T.Group(); for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(0.9, 0.25), new T.MeshBasicMaterial({ color: 0x222222, side: T.DoubleSide })); w.position.x = s * 0.45; w.rotation.z = s * 0.4; b.add(w); } b.userData = { r: 22 + Math.random() * 20, h: 18 + Math.random() * 8, a: Math.random() * 6.28, v: 0.25 + Math.random() * 0.2 }; birds.add(b); }
    // ---------- draw calls: merge every static mesh per material ----------
    (function collapseDraws() {
      let saved = 0;
      for (const s of stages) saved += mergeByMaterial(s);
      for (const a of anchors) saved += mergeByMaterial(a.g, { tagPlot: a.g });
      pickables.length = 0;
      for (const a of anchors) a.g.traverse(o => { if (o.isMesh) { o.userData.plot = a.g; pickables.push(o); } });
      for (const g of eggs) g.traverse(o => { if (o.isMesh) pickables.push(o); });   /* the eggs are pickable too (this rebuild used to wipe them) */
    })();
    /* ?look=rich: real models for the landmarks, made from Yoni's Midjourney pictures (Meshy image-to-3D, 2026-10-08). They load after the
       meadow is up; each replaces the drawn building on its plot, which stays (hidden) as part of the tap target. If anything fails, the
       drawn buildings simply stay */
    if (RICH && isMeadow && LANDMARK_MODELS) (async () => {
      /* width: across the widest side, in meadow units; rot: turns the model's front (the picture's front) toward the camera; host: where the
         plot's character stands now. Only places with a model in a loaded file are swapped. Mount Glory is not here on purpose: the children's
         signatures are placed on the shape of today's mountain */
      const LM = { chess: { width: 10.5, rot: 0, host: [-1.0, 4.1] }, door: { width: 9.5, rot: 0 }, fairy: { width: 7, rot: 0 }, kindness: { width: 8, rot: 0 },
        spelling: { width: 5.5, rot: 0 }, well: { width: 5.5, rot: 0 }, story: { width: 6.5, rot: 0 }, gate: { width: 7, rot: 0 },
        music: { width: 7.5 }, math: { width: 5.5 }, clock: { width: 5 }, art: { width: 7.5 }, reading: { width: 7.5 }, market: { width: 6.5 }, memory: { width: 9 },
        logic: { width: 6 }, scrolls: { width: 6.5 }, explore: { width: 7.5 }, timemachine: { width: 6.5 }, nature: { width: 8 }, pond: { width: 10 },
        tree: { width: 15 }, hive: { width: 6 }, caravan: { width: 7 }, tower: { width: 6 }, frog: { width: 7.5 }, nest: { width: 6 }, pirate: { width: 4.5 },
        smith: { width: 7 }, ruins: { width: 9 }, garden: { width: 9 }, fire: { width: 8, noLift: true },   /* the campfire's flames stay low, in the logs */ rocket: { width: 9 },
        arcade: { width: 9.5, into: 'isle', lift: 0.32 },   /* rides the floating island (it bobs); its label keeps hanging under the island */
        boat: { width: 5.6, rot: Math.PI / 2, boat: true } };   /* the model's length runs front-to-back: a quarter turn lines it up with the river boat */   /* sails the river: the model goes into the boat */
      /* landmark trees from the pictures, a few near the front (the forest itself stays the light trees) */
      const TREES = [['tree_round', 9, -27, 31], ['tree_round', 8.5, -33, 2], ['tree_pine', 10.5, 40, 24], ['tree_pine', 11, -40, 16], ['tree_round', 8.5, 44, 4]];   /* at the edges, never in front of a place */
      /* the models come in several files, loaded one after another once the meadow is up (a file adds its models to window.KQ_LANDMARKS);
         each model is swapped in as soon as its file arrives, and its text is dropped right after */
      const CHUNKS = ['landmarks.js?v=4', 'lm_front.js?v=1', 'lm_learn.js?v=1', 'lm_learn2.js?v=1', 'lm_secret.js?v=1', 'lm_more.js?v=1'];   /* each file stays under the 16 MB a published file may hold */
      const need = src => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
      try { if (!T.GLTFLoader) await need(K3D_BASE + 'vendor-gltf.js?v=1'); } catch (e) { return; }
      const loader = new T.GLTFLoader(), placed = new Set(), an = renderer.capabilities.getMaxAnisotropy();
      const parse = async b64 => { const bin = atob(b64), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); return (await new Promise((ok, no) => loader.parse(buf.buffer, '', ok, no))).scene; };
      /* a model sized to `width`, centred, standing on y = 0 */
      const fitModel = (m, width, rot) => { m.rotation.y = rot || 0; m.updateMatrixWorld(true); let bb = new T.Box3().setFromObject(m); const sz = bb.getSize(new T.Vector3()); m.scale.multiplyScalar(width / Math.max(sz.x, sz.z));
        m.updateMatrixWorld(true); bb = new T.Box3().setFromObject(m); const c = bb.getCenter(new T.Vector3()); m.position.set(-c.x, -bb.min.y - 0.05, -c.z);
        m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; for (const mt of [].concat(o.material)) for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (mt[k]) { mt[k].anisotropy = an; mt[k].needsUpdate = true; } } });
        const w = new T.Group(); w.add(m); w.userData.noMerge = true; w.userData.h = bb.max.y - bb.min.y; return w; };
      const keep = (o, root) => { for (let q = o; q && q !== root; q = q.parent) { const u = q.userData || {}; if (u.baseY !== undefined || u.orbit != null || u.gateSpin || u.gateGlow || u.flame != null || u.smoke != null || u.spin) return true; } return false; };   /* characters, flames, smoke, spinning things and the gate's ring keep showing */
      const lifts = (o, root) => { for (let q = o; q && q !== root; q = q.parent) { const u = q.userData || {}; if (u.flame != null || u.smoke != null || u.spin) return true; } return false; };
      async function swap(id, b64) {
        const L = LM[id];
        if (L.boat) { const w = fitModel(await parse(b64), L.width, L.rot); boat.traverse(o => { if (o.isMesh) o.visible = false; }); w.position.y = 0.05; boat.add(w); return; }
        const a = anchors.find(x => x.id === id); if (!a) return;
        const host = L.into === 'isle' ? (a.g.children.find(c => c.isGroup && c.children.length > 6) || a.g) : a.g;
        /* where the drawn place reached: kept flames, smoke and the gem move up or down by the difference */
        const old = new T.Box3(); host.updateMatrixWorld(true); host.traverse(o => { if (o.isMesh && o.visible && !keep(o, a.g)) old.expandByObject(o); });
        let wsc = 1; if (host !== a.g) { host.updateMatrixWorld(true); wsc = host.getWorldScale(new T.Vector3()).x; }
        const w = fitModel(await parse(b64), L.width / wsc, L.rot);
        host.traverse(o => { if (o.isMesh && !keep(o, a.g)) o.visible = false; });
        if (L.into) w.position.y = -w.userData.h * (L.lift || 0);
        const hp = L.host; if (hp) { const H = a.g.userData.hostSpec; if (H) { H.x = hp[0]; H.z = hp[1]; } for (const c of a.g.children) if (c.userData && c.userData.baseY !== undefined) { c.position.x = hp[0]; c.position.z = hp[1]; c.rotation.y = c.userData.ry = 0; } }
        w.traverse(o => { if (o.isMesh) { o.userData.plot = a.g; pickables.push(o); } }); host.add(w);
        if (!L.into && !L.noLift && !old.isEmpty()) { const dy = (a.g.position.y + w.userData.h) - old.max.y; a.g.traverse(o => { if (o !== a.g && lifts(o, a.g) && o.parent && !lifts(o.parent, a.g)) o.position.y += dy; }); }
        if (!L.into) { a.h = Math.max(a.h, w.userData.h + 1.2); try { cs.add(a.g.position.x, a.g.position.y, a.g.position.z, L.width * 0.62, 0.95); } catch (e) {} }   /* a soft dark patch where it meets the grass */
      }
      const treeModels = {};
      for (const file of CHUNKS) { try { await need(K3D_BASE + 'models/' + file); } catch (e) { continue; }
        const D = window.KQ_LANDMARKS || {};
        for (const id of Object.keys(D)) { const b64 = D[id]; delete D[id];
          try {
            if (id.startsWith('tree_')) { treeModels[id] = await parse(b64); continue; }
            if (!LM[id] || placed.has(id)) continue; placed.add(id); await swap(id, b64);
          } catch (e) { /* this one stays drawn */ } }
        for (const [tid, h, x, z] of TREES) { const src = treeModels[tid]; if (!src || !placeOk(x, z, 3)) continue; const w = fitModel(src.clone(true), 1, 0);
          const sz = new T.Box3().setFromObject(w).getSize(new T.Vector3()); w.scale.multiplyScalar(h / sz.y); w.position.set(x, height(x, z) - 0.1, z); w.rotation.y = (x * 7 + z) % 6.28; scene.add(w);
          try { cs.add(x, height(x, z), z, h * 0.45, 0.9); } catch (e) {} }
        for (const k of Object.keys(treeModels)) delete treeModels[k];
      }
    })();
    // ---------- the giant eagle (Yoni 2026-09-27): now and then it crosses the sky; tap it (or its label) and it swoops down for you to ride ----------
    if (window.KQEagle && !['ocean', 'pirate', 'skull', 'space'].includes(REALM)) {   /* the sky worlds and the meadow — not under the sea or under the ground */
      EG.g = new T.Group(); EG.g.visible = false; EG.g.userData = { id: 'eagle', soon: false, base: 0, top: 4 }; scene.add(EG.g);
      EG.bird = KQEagle.build(T); EG.bird.root.scale.setScalar(1.5); EG.g.add(EG.bird.root);
      EG.hit = new T.Mesh(new T.SphereGeometry(7, 10, 8), new T.MeshBasicMaterial({ visible: false })); EG.hit.userData.plot = EG.g; EG.g.add(EG.hit); pickables.push(EG.hit);
      const L = document.createElement('div'); L.className = 'label landmark eagle'; L.hidden = true; L.onclick = e => { e.stopPropagation(); if (opts.onPick) opts.onPick('eagle'); }; L.addEventListener('pointerenter', () => { hovering = EG.g; }); L.addEventListener('pointerleave', () => { if (hovering === EG.g) hovering = null; }); container.appendChild(L); EG.label = L; }
    function eagleLabel() { const L = EG.label; if (!L || !window.KQ) return; L.replaceChildren(); const e = document.createElement('span'); e.className = 'e'; const ic = KQ.icon ? KQ.icon('eagle') : null; if (ic) e.appendChild(ic); L.appendChild(e); const b = document.createElement('b'); b.textContent = KQ.t('eg_name'); L.appendChild(b); const sm = document.createElement('small'); sm.textContent = KQ.t('eg_tap'); L.appendChild(sm); }
    /* a flight in view of the camera: in from the far left, a wide circle and a half over the middle (low as it passes in front), out to the right */
    function eagleStart(noRide) { const th = orbit.theta, ux = Math.cos(th), uz = -Math.sin(th), fx = -Math.sin(th), fz = -Math.cos(th), at = (u, f, y) => new T.Vector3(target.x + ux * u + fx * f, y, target.z + uz * u + fz * f);
      const R = 26, cf = 10, pts = [at(-150, 50, 30), at(-76, 26, 21), at(-44, 16, 17)]; for (let i = 0; i <= 15; i++) { const a = Math.PI + i / 15 * Math.PI * 3; pts.push(at(R * Math.cos(a), cf + R * Math.sin(a), 14 - 3 * Math.sin(a))); } pts.push(at(62, 22, 19), at(170, 55, 32));   /* low enough to stay in the steep map view: 17 as it passes in front, 11 at the far side */
      EG.curve = new T.CatmullRomCurve3(pts, false, 'centripetal'); EG.len = EG.curve.getLength(); EG.t = 0; EG.on = true; EG.noRide = !!noRide; EG.g.visible = true; EG.h = null; if (!noRide) { eagleLabel(); EG.label.hidden = false; } }
    const egM = new T.Matrix4(), egV = new T.Vector3(), egW = new T.Vector3(), egO = new T.Vector3(), egUp = new T.Vector3(0, 1, 0);
    function updateEagle(dt, tm) {
      if (EG.chute) { const C = EG.chute; C.t += dt; const gy = height(C.x, C.z); C.ch.update(dt, tm); if (C.t < C.fall) C.ch.root.position.y = Math.max(gy, C.y0 - (C.y0 - gy) * (C.t / C.fall)); else { const k = Math.min(1, (C.t - C.fall) / 1.4); C.ch.root.position.y = gy; C.ch.canopy.scale.y = Math.max(0.05, 1 - k * 0.95); C.ch.canopy.position.x = k * 1.6; C.ch.canopy.rotation.z = -k * 1.2; if (C.t > C.fall + 3.2) { scene.remove(C.ch.root); EG.chute = null; } } }
      if (EG.board) { const B = EG.board; B.t += dt; const k = Math.min(1, B.t / 1.7), e = k * k * (3 - 2 * k); EG.g.position.lerpVectors(B.from, B.to, e); EG.g.position.y += Math.sin(Math.PI * k) * 4; EG.g.quaternion.slerpQuaternions(B.q0, B.q1, Math.min(1, e * 1.3)); EG.bird.update(dt, k < 0.6 ? 'flap' : 'glide'); egV.lerpVectors(B.look0, EG.g.position, e); camera.lookAt(egV); if (k >= 1 && B.cb) { const cb = B.cb; B.cb = null; cb(); } return; }
      if (!EG.on) { if (tm > EG.next) { if (ride.on || fly.on || realm.demon || placing || arr || document.body.classList.contains('riding')) EG.next = tm + 8; else eagleStart(false); } return; }
      EG.t += dt; const u = Math.min(1, EG.t * EG.speed / EG.len); EG.curve.getPointAt(u, egV); EG.curve.getTangentAt(u, egW); EG.g.position.copy(egV);
      const h = Math.atan2(egW.x, egW.z); let dh = EG.h == null ? 0 : h - EG.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); EG.h = h; EG.roll = (EG.roll || 0) + (Math.max(-0.7, Math.min(0.7, -dh / Math.max(dt, 1e-3) * 0.9)) - (EG.roll || 0)) * Math.min(1, dt * 3);
      egM.lookAt(egW, egO, egUp); EG.g.quaternion.setFromRotationMatrix(egM);   /* the bird's +z along its path */ EG.g.rotateZ(EG.roll); EG.bird.update(dt, 'auto'); EG.g.userData.base = EG.g.position.y - 4;
      const L = EG.label; if (L && !L.hidden) { egV.copy(EG.g.position); egV.y += 7; egV.project(camera); const onScreen = egV.z < 1 && Math.abs(egV.x) < 1.05 && Math.abs(egV.y) < 1.05; L.style.opacity = onScreen ? '1' : '0'; L.style.pointerEvents = onScreen ? '' : 'none'; L.style.left = ((egV.x + 1) / 2 * W) + 'px'; L.style.top = ((1 - egV.y) / 2 * H) + 'px'; L.classList.toggle('hot', hovering === EG.g); }
      if (u >= 1) { EG.on = false; EG.g.visible = false; if (L) L.hidden = true; if (hovering === EG.g) hovering = null; EG.next = tm + 95 + Math.random() * 60; } }
    /* tapped: the eagle breaks off, swoops down in front of you and the view turns to it; the hub takes over when it arrives */
    function eagleBoard(cb) { if (!EG.g || !EG.on || EG.noRide || EG.board || fly.on || ride.on) return false; EG.on = false; if (EG.label) EG.label.hidden = true; hovering = null; gesture = null;
      const dir = new T.Vector3(); camera.getWorldDirection(dir); const to = camera.position.clone().addScaledVector(dir, 13); to.y -= 2.5;
      const m = new T.Matrix4().lookAt(to.clone().sub(camera.position).normalize(), new T.Vector3(), egUp), q1 = new T.Quaternion().setFromRotationMatrix(m);   /* facing you as it comes in */
      EG.board = { t: 0, cb, from: EG.g.position.clone(), to, q0: EG.g.quaternion.clone(), q1, look0: target.clone() }; return true; }
    /* back from the ride: the camera glides down into the valley; after a fall a little parachute lands on the grass, after a win the eagle flies one more lap and away */
    function eagleLand(how) { EG.board = null; if (EG.g) EG.g.visible = false; EG.on = false; if (EG.label) EG.label.hidden = true; if (hovering === EG.g) hovering = null; EG.next = clock.elapsedTime + 110 + Math.random() * 50; arrive({ dur: 4.2, sweep: 0.3, phi: 0.36, radius: 62 * CAMR });
      if (!EG.g) return;
      if (how === 'chute' && window.KQEagle) { if (EG.chute) scene.remove(EG.chute.ch.root); const ch = KQEagle.chute(T); ch.root.scale.setScalar(1.7); const th = orbit.tTheta, x = target.x + Math.sin(th) * 12 + Math.cos(th) * 5, z = target.z + Math.cos(th) * 12 - Math.sin(th) * 5; ch.root.position.set(x, 36, z); scene.add(ch.root); EG.chute = { ch, t: 0, x, z, y0: 36, fall: 6 }; }   /* between the camera and the middle of the valley, a little to the right, so it floats down in view whatever way the map faces */
      else if (how === 'soar') setTimeout(() => { if (!EG.on && !EG.board) eagleStart(true); }, 900); }

    // ---------- labels (HTML, projected) ----------
    const labels = new Map(); let names = {};
    function setWorlds(list) { names = {}; for (const w of list) names[w.id] = w; for (const a of anchors) { let L = labels.get(a.id); if (!L) { L = document.createElement('div'); L.className = 'label' + (a.soon ? ' soon' : ''); L.dataset.id = a.id; L.onclick = e => { e.stopPropagation(); if (opts.onPick) opts.onPick(a.id, a.soon); }; L.addEventListener('pointerenter', () => { hovering = a.g; }); L.addEventListener('pointerleave', () => { if (hovering === a.g) hovering = null; }); container.appendChild(L); labels.set(a.id, L); } const w = names[a.id]; L.replaceChildren(); if (w) { const e = document.createElement('span'); e.className = 'e'; const ic = w.icon && window.KQ && KQ.icon ? KQ.icon(w.icon) : null; if (ic) e.appendChild(ic); else e.textContent = w.emoji || ''; L.appendChild(e); L.classList.toggle('place', w.kind === 'place'); L.classList.toggle('landmark', w.kind === 'landmark'); const b = document.createElement('b'); b.textContent = w.name + (a.soon ? ' · ' + (w.soonText || '') : ''); L.appendChild(b); if (w.blurb) { const s = document.createElement('small'); s.textContent = w.blurb; L.appendChild(s); } } L.hidden = !w; } }
    // ---------- hover fireworks: a fountain of sparks over the building under the pointer ----------
    const FW = { n: 360, i: 0, next: 0 }; const fwPos = new Float32Array(FW.n * 3), fwCol = new Float32Array(FW.n * 3), fwVel = new Float32Array(FW.n * 3), fwLife = new Float32Array(FW.n);
    const fwGeo = new T.BufferGeometry(); fwGeo.setAttribute('position', new T.BufferAttribute(fwPos, 3)); fwGeo.setAttribute('color', new T.BufferAttribute(fwCol, 3));
    const fwPts = new T.Points(fwGeo, new T.PointsMaterial(Object.assign({ size: 0.55, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }, RICH && FX ? { size: 0.95, map: FX.softDot() } : {}))); fwPts.frustumCulled = false; scene.add(fwPts);
    const FW_PAL = [0xffd166, 0xff4d6d, 0x4cc9f0, 0x9bff6a, 0xffffff, 0xc77dff, 0xff9f1c];
    function firework(g) { const top = g.userData.base + (g.userData.top || 7); const cx = g.position.x, cz = g.position.z; const c = new T.Color(FW_PAL[Math.floor(Math.random() * FW_PAL.length)]);
      for (let k = 0; k < 34; k++) { const i = FW.i = (FW.i + 1) % FW.n, j = i * 3, a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 5, up = 4 + Math.random() * 6; fwPos[j] = cx; fwPos[j + 1] = top; fwPos[j + 2] = cz; fwVel[j] = Math.cos(a) * sp; fwVel[j + 1] = up; fwVel[j + 2] = Math.sin(a) * sp; fwLife[i] = 1.1 + Math.random() * 0.5; const cc = Math.random() < 0.3 ? new T.Color(0xffffff) : c; fwCol[j] = cc.r; fwCol[j + 1] = cc.g; fwCol[j + 2] = cc.b; } }
    function updateFireworks(dt, tm) { if (hovering && tm > FW.next) { firework(hovering); FW.next = tm + 0.45; } let any = false; for (let i = 0; i < FW.n; i++) { if (fwLife[i] <= 0) continue; any = true; const j = i * 3; fwLife[i] -= dt; fwVel[j + 1] -= 11 * dt; fwPos[j] += fwVel[j] * dt; fwPos[j + 1] += fwVel[j + 1] * dt; fwPos[j + 2] += fwVel[j + 2] * dt; const f = Math.max(0, Math.min(1, fwLife[i])); fwCol[j] *= 0.985; fwCol[j + 1] *= 0.985; fwCol[j + 2] *= 0.985; if (fwLife[i] <= 0) { fwPos[j + 1] = -50; } } fwPts.visible = any; fwGeo.attributes.position.needsUpdate = true; fwGeo.attributes.color.needsUpdate = true; }
    // ---------- camera / orbit ----------
    const HOME = RICH && LANDMARK_MODELS ? [0, 3, 7] : [0, 3, 2];   /* the new look: a little nearer the front, so Story Forge and Spelling Bee are not cut by the screen's bottom edge */
    const target = new T.Vector3(...HOME), VIEW = { on: false, home: new T.Vector3(...HOME), to: new T.Vector3(...HOME) }, LIM = { pMin: 0.55, pMax: 1.35, rMin: 26, rMax: 105 * SPR }, orbit = { theta: 0.3, phi: 0.98, radius: 76 * CAMR, tTheta: 0.3, tPhi: 0.98, tRadius: 76 * CAMR }; let focused = false;
    let arr = null, drawn = 0;   /* arr: the arrival glide (arrive); drawn: frames drawn so far, for opts.onReady */   // wide view: the whole valley, room between the worlds
    let idle = 0, hovering = null, gesture = null, W = 1, H = 1;
    /* arriving from a ride or the gate: the camera starts looking steeply down into the land, then tilts up and draws back into the whole valley (the page fades in over it; a low start hid the land behind the hills) */
    function arrive(o) { o = o || {}; arr = { t: 0, hold: o.hold || 0, dur: o.dur || 3.4, th: orbit.tTheta - (o.sweep == null ? 0.45 : o.sweep), ph: o.phi || 0.62, r: o.radius || 58 * CAMR }; orbit.theta = arr.th; orbit.phi = arr.ph; orbit.radius = arr.r; placeCamera(); }
    function placeCamera() { if (ride.on || fly.on || EG.board) return; const c = orbit; camera.position.set(target.x + c.radius * Math.sin(c.phi) * Math.sin(c.theta), target.y + c.radius * Math.cos(c.phi), target.z + c.radius * Math.sin(c.phi) * Math.cos(c.theta)); camera.lookAt(target); }
    function resize() { const r = container.getBoundingClientRect(); W = Math.max(1, r.width | 0); H = Math.max(1, r.height | 0); renderer.setSize(W, H, false); camera.aspect = W / H; camera.fov = W < H ? 52 : 40; camera.updateProjectionMatrix(); if (post) post.resize(W, H); }
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    function pickAt(x, y) { const r = renderer.domElement.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1)); ray.setFromCamera(ndc, camera); const hits = ray.intersectObjects(pickables, false); for (const h of hits) { const p = h.object.userData.plot; if (!p || p.visible !== false) return p; } return null; }
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', e => { if (ride.on || fly.on || EG.board) return; focused = true; if (e.pointerType === 'mouse' && e.button !== 0) return; gesture = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, t: Date.now() }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} idle = 0; });
    cv.addEventListener('pointermove', e => { if (gesture && e.pointerType === 'mouse' && e.buttons === 0) gesture = null; if (gesture) { const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y; gesture.moved += Math.abs(dx) + Math.abs(dy); if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.5 && gesture.moved < 30) { gesture = null; return; } orbit.tTheta -= dx * 0.006; orbit.tPhi = Math.max(LIM.pMin, Math.min(LIM.pMax, orbit.tPhi - dy * 0.004)); gesture.x = e.clientX; gesture.y = e.clientY; idle = 0; } else if (placing) { const pt = groundAt(e.clientX, e.clientY); if (pt) { placing.ghost.position.set(pt.x, height(pt.x, pt.z), pt.z); placing.ghost.userData.base = placing.ghost.position.y; } } else { const p = pickAt(e.clientX, e.clientY); hovering = p; cv.style.cursor = p ? 'pointer' : 'grab'; } });
    const endGesture = e => { if (!gesture) return; const g = gesture; gesture = null; if (g.moved < 8 && Date.now() - g.t < 700) { if (placing) { const pt = groundAt(e.clientX, e.clientY); if (pt && pt.y > WATER_Y + 0.2) { const cb = placing.cb; stopPlacing(); cb({ x: +(pt.x / SPR).toFixed(2), z: +(pt.z / SPR).toFixed(2) }); } return; } const p = pickAt(e.clientX, e.clientY); if (p && VIEW.on && p.userData.id !== 'glory') { viewGlory(false); if (opts.onGloryView) opts.onGloryView(false); } if (p && opts.onPick) opts.onPick(p.userData.id, p.userData.soon); } };
    cv.addEventListener('pointerup', endGesture); cv.addEventListener('pointercancel', () => { gesture = null; });
    cv.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey || focused)) return; e.preventDefault(); orbit.tRadius = Math.max(LIM.rMin, Math.min(LIM.rMax, orbit.tRadius + e.deltaY * 0.03)); idle = 0; }, { passive: false });
    document.addEventListener('pointerdown', e => { if (!container.contains(e.target)) focused = false; });
    let pinch = null; cv.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    cv.addEventListener('touchmove', e => { if (e.touches.length === 2 && pinch) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); orbit.tRadius = Math.max(LIM.rMin, Math.min(LIM.rMax, orbit.tRadius * pinch / d)); pinch = d; gesture = null; } }, { passive: true });
    cv.addEventListener('touchend', () => { pinch = null; });
    // ---------- loop ----------
    const clock = new T.Clock(); let running = true, visible = true, raf = 0, tiltK = 0.4; const v3 = new T.Vector3();
    /* a game room (the hub's #portalOverlay) covers the whole map: stop drawing the map under it, so the phone runs one 3D scene, not two */
    let coverEl = null; const covered = () => { coverEl = coverEl || document.getElementById('portalOverlay'); return !!(coverEl && !coverEl.hidden); };
    function frame(force) {
      if (force !== true) raf = requestAnimationFrame(frame); if (force !== true && (!running || !visible || covered())) return;
      const dt = Math.min(0.05, clock.getDelta()) * (window.__mapSpeed || 1), tm = clock.elapsedTime; idle += dt;   /* __mapSpeed: fast-forward for tests (slow software rendering) */
      if (idle > 3 && !gesture) orbit.tTheta += dt * 0.03;
      if (arr) { arr.t += dt; const k = Math.min(1, Math.max(0, arr.t - arr.hold) / arr.dur), e = 1 - Math.pow(1 - k, 3); orbit.theta = arr.th + (orbit.tTheta - arr.th) * e; orbit.phi = arr.ph + (orbit.tPhi - arr.ph) * e; orbit.radius = arr.r + (orbit.tRadius - arr.r) * e; if (k >= 1) arr = null; }
      else { orbit.theta += (orbit.tTheta - orbit.theta) * 0.08; orbit.phi += (orbit.tPhi - orbit.phi) * 0.08; orbit.radius += (orbit.tRadius - orbit.radius) * 0.08; }
      target.lerp(VIEW.to, 0.07); placeCamera();
      for (const c of clouds.children) { c.position.x += c.userData.v * dt; if (c.position.x > 80) c.position.x = -80; }
      for (const f of flags) { f.rotation.y = Math.sin(tm * 3 + f.position.x) * 0.25; f.scale.x = 0.85 + 0.15 * Math.sin(tm * 6 + f.position.z); }
      updateDiorama(tm, camera.position, motes, renderer.getPixelRatio(), [motes.children[0] && motes.children[0].material]);
      if (H_water) H_water.uniforms.t.value = tm;
      scene.traverse(o => { if (o.userData.mill) o.rotation.z = tm * 0.8; });
      for (const b of birds.children) { const u = b.userData; u.a += u.v * dt; b.position.set(Math.cos(u.a) * u.r, u.h + Math.sin(tm * 2 + u.r) * 0.6, Math.sin(u.a) * u.r); b.rotation.y = -u.a; for (let i = 0; i < 2; i++) b.children[i].rotation.z = (i ? 1 : -1) * (0.3 + 0.5 * Math.sin(tm * 9 + u.r)); }
      for (const o of ornaments.children) if (o.userData.bob != null) { o.position.y += Math.sin(tm * 2 + o.userData.bob) * 0.004; if (o.userData.spin) o.rotation.y = tm * o.userData.spin + o.userData.bob; }
      castle.traverse(o => { if (o.userData.fire) { o.scale.y = 0.85 + 0.3 * Math.sin(tm * 14) * Math.sin(tm * 7.3); o.scale.x = o.scale.z = 0.9 + 0.15 * Math.sin(tm * 9); } if (o.userData.spark != null) { o.position.y += Math.sin(tm * 2 + o.userData.spark) * 0.01; o.visible = Math.sin(tm * 3 + o.userData.spark) > -0.2; } });
      for (const g of stages) if (g.userData.light) g.userData.light.intensity = (night ? 2.5 : 1.2) * (0.85 + 0.25 * Math.sin(tm * 11));
      for (const a of anchors) { a.g.traverse(o => { if (o.userData.orbit != null) { const k = o.userData.orbit; o.position.set(Math.cos(tm * 0.6 + k * 1.57) * 3.2, 4 + k * 1.0 + Math.sin(tm + k) * 0.3, Math.sin(tm * 0.6 + k * 1.57) * 3.2); } if (o.userData.spin) o.rotation.y = tm; if (o.userData.smoke != null) { const k = o.userData.smoke; o.position.y = 4.8 + ((tm * 0.7 + k * 0.6) % 3); o.material.opacity = 0.5 * (1 - ((tm * 0.7 + k * 0.6) % 3) / 3); } if (o.userData.bee != null) { const k = o.userData.bee; o.position.set(Math.cos(tm * 1.5 + k) * 1.6, 1.6 + Math.sin(tm * 3 + k) * 0.5, Math.sin(tm * 1.5 + k) * 1.6); } if (o.userData.gateSpin) { o.rotation.y = tm * 0.6; o.rotation.x = Math.sin(tm * 0.8) * 0.15; } else if (o.userData.gateGlow) { o.material.opacity = 0.35 + 0.2 * Math.sin(tm * 2.2); o.rotation.z = tm * 0.3; } else if (o.userData.flame != null) { const k = o.userData.flame; o.scale.y = 0.8 + 0.35 * Math.sin(tm * 13 + k) * Math.sin(tm * 7.1 + k); o.scale.x = o.scale.z = 0.9 + 0.15 * Math.sin(tm * 9 + k); } else if (o.userData.flameGlow != null) { o.material.opacity = 0.4 + 0.2 * Math.sin(tm * 11 + o.userData.flameGlow); } else if (o.userData.flameLight != null) { o.intensity = 1.4 + 0.5 * Math.sin(tm * 11); } else if (o.userData.hostBob != null) { o.position.y = o.userData.baseY + Math.sin(tm * 1.6 + o.userData.hostBob) * 0.22; } else if (o.userData.castIdle != null) { const k = o.userData.castIdle; o.getWorldPosition(v3); const want = Math.atan2(camera.position.x - v3.x, camera.position.z - v3.z) - (o.parent ? o.parent.rotation.y : 0) + Math.sin(tm * 0.6 + k) * 0.25; let d = want - o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); o.rotation.y += d * 0.06; o.position.y = o.userData.baseY + Math.abs(Math.sin(tm * 1.7 + k)) * 0.03; }   /* the hosts turn to face you as you look around, and greet you when you fly in */ else if (o.userData.glowPulse != null && o.material.emissive) { o.material.emissiveIntensity = 0.55 + 0.45 * Math.sin(tm * 2.5 + o.userData.glowPulse); } }); const hot = hovering === a.g; a.g.position.y = a.g.userData.base + (hot ? 0.15 + 0.1 * Math.sin(tm * 6) : 0); const L = labels.get(a.id); if (L && !L.hidden) { v3.set(a.g.position.x, a.g.position.y + a.h, a.g.position.z).project(camera); const onScreen = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1; L.style.opacity = onScreen ? '1' : '0'; L.style.left = ((v3.x + 1) / 2 * W) + 'px'; L.style.top = ((1 - v3.y) / 2 * H) + 'px'; L.classList.toggle('hot', hot); } }
      updateNestPin();
      /* ?look=rich: the tags are icons; only the place nearest the middle of the screen also shows its name (and any one touched) */
      if (RICH) { let best = null, bd = 0.42; for (const L of labels.values()) { if (L.hidden || L.style.opacity === '0') continue; const x = parseFloat(L.style.left) / W * 2 - 1, y = 1 - parseFloat(L.style.top) / H * 2, d = Math.hypot(x, y + 0.1); if (d < bd) { bd = d; best = L; } } for (const L of labels.values()) L.classList.toggle('named', L === best); }
      for (const gp of peggs.values()) { gp.rotation.y = tm * 0.6; gp.position.y = gp.userData.base + 0.1 + Math.sin(tm * 2 + gp.userData.k) * 0.12; } if (placing) placing.ghost.rotation.y = tm * 1.5;
      for (const g of eggs) { g.rotation.y = tm * 0.8; g.position.y = g.userData.base + (hovering === g ? 0.5 : 0.1 + Math.sin(tm * 2 + g.userData.k) * 0.12); }
      updateBoat(dt, tm); updateFly(dt); if (EG.g) updateEagle(dt, tm); updateRealm(dt, tm); if (!realm.demon && REALM !== 'ocean' && REALM !== 'space') updateFauna(dt, tm, camera.position); for (const f of realmFx) f(dt, tm);
      updateFireworks(dt, tm);
      if (post) { const tiltT = (ride.on || fly.on) ? 0 : (night ? 0.55 : 0.32); tiltK += (tiltT - tiltK) * Math.min(1, dt * 3); post.setTilt(tiltK, 0.5); post.render(dt); } else renderer.render(scene, camera); if (window.__kq3d) window.__kq3d.frames++;
      if (drawn >= 0 && ++drawn >= 4) { drawn = -1; if (opts && opts.onReady) setTimeout(() => { try { opts.onReady(); } catch (e) {} }, 0); }   /* the world has really drawn (shaders compiled): tell the page it may show it */
    }
    // ---------- the realms above the meadow: what each one adds and what it hides ----------
    const realmFx = landFx.slice(); { const tm2 = []; scene.traverse(o => { if (o.isInstancedMesh && o.userData.species) tm2.push(o); }); realm.treeMeshes = tm2; }   /* the trees are planted after the demon list was made; refresh it */
    if (!isMeadow) { boat.visible = false; falls.visible = false; for (const [id, gp] of portalGroups) gp.visible = false; const wellA = anchors.find(a => a.id === 'well'); if (wellA) wellA.g.visible = false; const dl = anchors.find(a => a.id === 'devlock'); if (dl) dl.g.visible = false; for (const e of eggs) e.visible = false; riverDeco.visible = REALM !== 'ocean'; }
    if (REALM === 'sky' || REALM === 'cloud') {
      // a sea of clouds below the island, and the sun higher
      const below = new T.Group(); scene.add(below); const cm = new T.MeshStandardMaterial({ color: REALM === 'cloud' ? 0xfff4fa : 0xffffff, roughness: 1, emissive: 0x666666, emissiveIntensity: 0.35 });
      for (let i = 0; i < 40; i++) { const c = new T.Group(); const n = 3 + Math.floor(Math.random() * 3); for (let j = 0; j < n; j++) { const s = new T.Mesh(new T.SphereGeometry(4 + Math.random() * 5, 10, 8), cm); s.position.set(j * 4.5 - n * 2.2, Math.random() * 2, (Math.random() - 0.5) * 5); c.add(s); } const a = Math.random() * Math.PI * 2, r = 45 + Math.random() * 60; c.position.set(Math.cos(a) * r, -14 - Math.random() * 16, Math.sin(a) * r); c.userData.v = 0.4 + Math.random() * 0.6; below.add(c); }
      realmFx.push((dt, tm) => { for (const c of below.children) { c.position.x += c.userData.v * dt; if (c.position.x > 110) c.position.x = -110; } });
      if (REALM === 'cloud') { for (const m of realm.treeMeshes) m.visible = false;
        // cotton-candy trees: pale trunks with pastel puffs
        const pk = pickSpot(14, 56); const N = 220; const trunks = new T.InstancedMesh(new T.CylinderGeometry(0.22, 0.4, 3.2, 6), new T.MeshStandardMaterial({ color: 0xe8d8f0, roughness: 1 }), N); const puffs = new T.InstancedMesh(new T.SphereGeometry(1, 9, 7), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), N * 3); const pc = [new T.Color(0xfff0f8), new T.Color(0xf6e6ff), new T.Color(0xffe0ee), new T.Color(0xffffff), new T.Color(0xe8f4ff)]; const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(); let n = 0, np = 0;
        for (let i = 0; i < 4000 && n < N; i++) { const sp = pk(); if (!sp) continue; const x = sp.x != null ? sp.x : sp[0], z = sp.z != null ? sp.z : sp[1]; const y = terrainHeight(x, z); if (y < WATER_Y + 0.5) continue; const h = 2.4 + Math.random() * 2.2; ps.set(x, y + h * 0.5, z); q.identity(); sc.set(1, h / 3.2, 1); m4.compose(ps, q, sc); trunks.setMatrixAt(n, m4); for (let j = 0; j < 3; j++) { const r = 1.3 + Math.random() * 1.3; ps.set(x + (Math.random() - 0.5) * 1.6, y + h + (j ? Math.random() * 1.2 : 0.2), z + (Math.random() - 0.5) * 1.6); sc.set(r, r * 0.85, r); m4.compose(ps, q, sc); puffs.setMatrixAt(np, m4); puffs.setColorAt(np, pc[(n + j) % 5]); np++; } n++; }
        trunks.count = n; puffs.count = np; trunks.castShadow = puffs.castShadow = true; scene.add(trunks); scene.add(puffs); }
      if (REALM === 'sky') { for (const m of realm.treeMeshes) if (m.material && m.material.color) m.material.color.setHex(0xe8ffe0);
        // floating sky crystals drift over the isles
        const crys = new T.Group(); scene.add(crys); for (let i = 0; i < 36; i++) { const c = new T.Mesh(new T.OctahedronGeometry(0.5 + Math.random() * 0.8, 0), new T.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x5ac8fa, emissiveIntensity: 0.8, roughness: 0.3, transparent: true, opacity: 0.85 })); c.scale.y = 1.8; const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 44; c.position.set(Math.cos(a) * r, 6 + Math.random() * 10, Math.sin(a) * r); c.userData = { k: Math.random() * 6, y: c.position.y }; crys.add(c); }
        realmFx.push((dt, tm) => { for (const c of crys.children) { c.rotation.y = tm * 0.5 + c.userData.k; c.position.y = c.userData.y + Math.sin(tm * 0.8 + c.userData.k) * 0.8; } }); }
      if (REALM === 'cloud') { for (const c of motes.children) if (c.material && c.material.color) c.material.color.setHex(0xffd6f0); }
      if (REALM === 'sky') { /* two friendly dragons circle the isles by day */ realm.dragons.forEach((d, i) => { if (i > 1) return; d.visible = true; d.traverse(o => { if (o.isMesh && o.material && o.material.color) { const hex = o.material.color.getHex(); if (hex === 0x5a1210) o.material = new T.MeshStandardMaterial({ color: i ? 0x3f8fd8 : 0xf2c14e, roughness: 0.6 }); else if (hex === 0x2a0a0a) o.material = new T.MeshStandardMaterial({ color: i ? 0x1f5aa0 : 0xd98a1f, side: T.DoubleSide, roughness: 0.9 }); } }); d.userData.h = 26 + i * 6; d.userData.r = 34 + i * 8; d.userData.friendly = true; }); }
    }
    if (REALM === 'fashion') {   /* the Fashion Kingdom (2026-09-26): blossom trees, pink motes, petals drifting on the breeze over a sage lawn */
      /* blossom: the broadleaf and birch canopies turn pink, white and lilac (the leaf colours live in the geometry, so a tint cannot do it); the pines stay dark green */
      for (const m of realm.treeMeshes) { const ca = m.userData.species !== 'conif' && m.geometry.attributes.color; if (!ca) continue; const cc = new T.Color(), BL = [[1.0, 0.5, 0.7], [1.0, 0.68, 0.8], [0.84, 0.58, 1.0], [1.0, 0.6, 0.76]]; for (let i = 0; i < ca.count; i++) { cc.fromBufferAttribute(ca, i); if (cc.g > cc.r * 1.08 && cc.g > cc.b * 1.08) { const l = 0.5 + (cc.r + cc.g + cc.b) * 0.3, b = BL[Math.floor(i / 9) % 4]; ca.setXYZ(i, Math.min(1, b[0] * l), Math.min(1, b[1] * l), Math.min(1, b[2] * l)); } } ca.needsUpdate = true; }
      for (const c of motes.children) if (c.material && c.material.color) c.material.color.setHex(0xffd0e8);
      const pg = new T.CircleGeometry(0.2, 6); pg.scale(1, 0.6, 1); const petals = new T.InstancedMesh(pg, new T.MeshStandardMaterial({ color: 0xffc0d8, side: T.DoubleSide, roughness: 0.8, emissive: 0x5a2a3a, emissiveIntensity: 0.2 }), 160), PT = [], m4 = new T.Matrix4(), q4 = new T.Quaternion(), e4 = new T.Euler(), s4 = new T.Vector3(1, 1, 1), p4 = new T.Vector3();
      for (let i = 0; i < 160; i++) PT.push({ x: (Math.random() - 0.5) * 110, y: 2 + Math.random() * 14, z: (Math.random() - 0.5) * 110, k: Math.random() * 6, v: 0.6 + Math.random() * 0.8 });
      scene.add(petals); realmFx.push((dt, tm) => { PT.forEach((pt, i) => { pt.x += pt.v * dt * 1.2; pt.y -= pt.v * dt * 0.35; if (pt.y < 0.5 || pt.x > 58) { pt.x = -58 + Math.random() * 10; pt.y = 6 + Math.random() * 12; } p4.set(pt.x, pt.y + Math.sin(tm + pt.k) * 0.3, pt.z); e4.set(tm * pt.v + pt.k, tm * 0.7 + pt.k, 0); q4.setFromEuler(e4); m4.compose(p4, q4, s4); petals.setMatrixAt(i, m4); }); petals.instanceMatrix.needsUpdate = true; });
    }
    if (REALM === 'ocean') {
      // the sea above: a rippling surface far overhead, caustic light, bubbles, kelp, coral and fish
      for (const s of fauna.sheep) s.visible = false; for (const m of fauna.monkeys) m.visible = false; for (const f of fauna.flies) { f.visible = false; f.userData.dead = true; } fauna.nextHerd = 1e9; for (const b of birds.children) b.visible = false; clouds.visible = false; sunDisc.visible = false; for (const m of realm.treeMeshes) m.visible = false;
      const surf = new T.Mesh(new T.PlaneGeometry(400, 400, 1, 1), new T.MeshBasicMaterial({ color: 0x3fa0e0, transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false, fog: false })); surf.rotation.x = Math.PI / 2; surf.position.y = 66; scene.add(surf);   /* above the map camera (≤ ~61): the valley is seen from under the water, not through a tinted sheet */
      const rays = new T.Group(); scene.add(rays); for (let i = 0; i < 14; i++) { const r = new T.Mesh(new T.PlaneGeometry(3 + Math.random() * 4, 40), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.08, depthWrite: false, side: T.DoubleSide, fog: false })); r.position.set((Math.random() - 0.5) * 100, 16, (Math.random() - 0.5) * 100); r.rotation.y = Math.random() * 3; r.rotation.z = (Math.random() - 0.5) * 0.3; r.userData.k = Math.random() * 6; rays.add(r); }
      const bub = new T.Group(); scene.add(bub); for (let i = 0; i < 160; i++) { const s = new T.Sprite(new T.SpriteMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.55, depthWrite: false })); s.scale.set(0.35, 0.35, 1); s.position.set((Math.random() - 0.5) * 110, Math.random() * 30, (Math.random() - 0.5) * 110); s.userData.v = 1 + Math.random() * 2; bub.add(s); }
      const kelpM = new T.MeshStandardMaterial({ color: 0x2f8a5a, roughness: 1, side: T.DoubleSide }); const kelp = new T.InstancedMesh(new T.ConeGeometry(0.35, 7, 5), kelpM, 220); const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1), pos = new T.Vector3(); let n = 0; for (let i = 0; i < 220; i++) { const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 44; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (!placeOk(x, z, 2) || pathDist(x, z) < 2.5) continue; pos.set(x, terrainHeight(x, z) + 3.4, z); q.setFromEuler(new T.Euler(0, Math.random() * 6.3, (Math.random() - 0.5) * 0.25)); sc.set(1, 0.7 + Math.random() * 0.9, 1); m4.compose(pos, q, sc); kelp.setMatrixAt(n++, m4); } kelp.count = n; scene.add(kelp);
      const corals = new T.Group(); scene.add(corals); const cc = [0xff6b6b, 0xff9f43, 0xf9c74f, 0xff7eb6, 0xb48cff, 0x5ac8fa]; for (let i = 0; i < 120; i++) { const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 46; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (!placeOk(x, z, 1.5) || pathDist(x, z) < 2.2) continue; const kind = i % 3; const m = new T.MeshStandardMaterial({ color: cc[i % 6], roughness: 0.8, flatShading: true }); let c; if (kind === 0) { c = new T.Mesh(new T.DodecahedronGeometry(0.9 + Math.random() * 0.9, 0), m); } else if (kind === 1) { c = new T.Group(); for (let j = 0; j < 5; j++) { const br = new T.Mesh(new T.CylinderGeometry(0.08, 0.18, 1.4 + Math.random(), 5), m); br.position.set((Math.random() - 0.5) * 0.8, 0.7, (Math.random() - 0.5) * 0.8); br.rotation.set((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8); c.add(br); } } else { c = new T.Mesh(new T.SphereGeometry(0.7 + Math.random() * 0.6, 8, 6), m); c.scale.y = 0.5; } c.position.set(x, terrainHeight(x, z), z); corals.add(c); }
      const fishG = new T.Group(); scene.add(fishG); const schools = []; for (let s = 0; s < 5; s++) { const col = cc[s % 6]; const cx = (Math.random() - 0.5) * 60, cz = (Math.random() - 0.5) * 60, h = 6 + Math.random() * 12, r = 6 + Math.random() * 8; const members = []; for (let i = 0; i < 12; i++) { const f = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(0.42, 8, 6), new T.MeshStandardMaterial({ color: col, roughness: 0.5 })); b.scale.set(1.8, 1, 0.6); f.add(b); const tl = new T.Mesh(new T.ConeGeometry(0.3, 0.6, 4), b.material); tl.rotation.z = Math.PI / 2; tl.position.x = -0.9; tl.scale.z = 0.3; f.add(tl); f.userData = { off: i * 0.5, dy: (Math.random() - 0.5) * 2, dr: (Math.random() - 0.5) * 2 }; fishG.add(f); members.push(f); } schools.push({ members, cx, cz, h, r, v: 0.25 + Math.random() * 0.2, k: Math.random() * 6 }); }
      const jelly = new T.Group(); scene.add(jelly); for (let i = 0; i < 10; i++) { const j = new T.Group(); const bell = new T.Mesh(new T.SphereGeometry(1.0, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xff9ae8, emissive: 0xff6bd6, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, roughness: 0.3 })); j.add(bell); for (let k = 0; k < 6; k++) { const tn = new T.Mesh(new T.CylinderGeometry(0.03, 0.02, 2.2, 4), new T.MeshBasicMaterial({ color: 0xffb6f0, transparent: true, opacity: 0.6 })); tn.position.set(Math.cos(k) * 0.5, -1.1, Math.sin(k) * 0.5); j.add(tn); } j.position.set((Math.random() - 0.5) * 90, 8 + Math.random() * 14, (Math.random() - 0.5) * 90); j.userData = { k: Math.random() * 6, bell }; jelly.add(j); }
      realmFx.push((dt, tm) => { surf.position.y = 66 + Math.sin(tm * 0.5) * 0.4; for (const r of rays.children) r.material.opacity = 0.03 + 0.03 * Math.sin(tm * 0.7 + r.userData.k); for (const s of bub.children) { s.position.y += s.userData.v * dt; s.position.x += Math.sin(tm * 2 + s.position.y) * dt * 0.3; if (s.position.y > 33) s.position.y = 0; } for (const S of schools) { for (const f of S.members) { const a = tm * S.v + f.userData.off + S.k; f.position.set(S.cx + Math.cos(a) * (S.r + f.userData.dr), S.h + f.userData.dy + Math.sin(tm * 1.5 + f.userData.off) * 0.6, S.cz + Math.sin(a) * (S.r + f.userData.dr) * 0.7); f.rotation.y = -a + Math.PI / 2; f.children[1].rotation.y = Math.sin(tm * 10 + f.userData.off) * 0.5; } } for (const j of jelly.children) { j.position.y += Math.sin(tm * 1.2 + j.userData.k) * dt * 0.8; j.userData.bell.scale.y = 1 + 0.25 * Math.sin(tm * 2.4 + j.userData.k); } });
    }

    /* ---------- Space (2026-09-28): the kingdom's rock floats among the stars — grey Moon-dust, craters, glowing crystals, the dry canyon
       of a rille, the Milky Way across the sky, the planets hanging in the dark. The black hole and the games come from realm-space.js ---------- */
    if (REALM === 'space') {
      sky.visible = false; sunDisc.visible = false; clouds.visible = false; birds.visible = false; riverDeco.visible = false;
      for (const m of realm.treeMeshes) m.visible = false;
      for (const s2 of fauna.sheep) s2.visible = false; for (const m of fauna.monkeys) m.visible = false; for (const f of fauna.flies) { f.visible = false; f.userData.dead = true; } for (const h of fauna.horses) h.visible = false; fauna.nextHerd = 1e9;
      scene.background = new T.Color(0x02030a); scene.fog.near = 140; scene.fog.far = 440;
      for (const c of motes.children) if (c.material && c.material.color) c.material.color.setHex(0xbfd8ff);
      const cv = (w, h, paint) => { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
      /* stars: a few thousand points, warm and cool, a handful bright */
      { const n = 2600, P = new Float32Array(n * 3), C = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = R32() * 2 - 1, a = R32() * Math.PI * 2, r = Math.sqrt(1 - u * u), k = 0.45 + R32() * 0.55, tint = R32(); P.set([Math.cos(a) * r * 300, u * 300, Math.sin(a) * r * 300], i * 3); C.set(tint < 0.2 ? [k, k * 0.85, k * 0.7] : tint < 0.35 ? [k * 0.75, k * 0.85, k] : [k, k, k], i * 3); }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('color', new T.BufferAttribute(C, 3)); scene.add(new T.Points(g, new T.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false }))); }
      /* the Milky Way: a soft band with dust lanes and a brighter core */
      { const t = cv(2048, 512, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const px = R32() * w, core = Math.exp(-Math.pow((px - w * 0.5) / (w * 0.18), 2)), py = h / 2 + (R32() + R32() + R32() - 1.5) * h * (0.09 + 0.06 * core); x.fillStyle = `rgba(${(200 + 55 * core) | 0},${(190 + 40 * core) | 0},${(230 - 40 * core) | 0},${0.035 + 0.05 * core})`; x.beginPath(); x.ellipse(px, py, 10 + R32() * 40, 4 + R32() * 14, 0, 0, 6.283); x.fill(); }
          for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + R32() * 0.6})`; x.fillRect(R32() * w, h / 2 + (R32() + R32() - 1) * h * 0.16, 1, 1); } x.globalCompositeOperation = 'multiply'; for (let i = 0; i < 260; i++) { x.fillStyle = 'rgba(40,30,30,0.35)'; x.beginPath(); x.ellipse(R32() * w, h / 2 + (R32() - 0.5) * h * 0.08, 12 + R32() * 48, 2 + R32() * 5, (R32() - 0.5) * 0.4, 0, 6.283); x.fill(); } });
        const mw = new T.Mesh(new T.SphereGeometry(320, 48, 24), new T.MeshBasicMaterial({ map: t, side: T.BackSide, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, fog: false })); mw.rotation.set(0.5, 0.2, 0.9); scene.add(mw); }
      /* the planets in the sky: Saturn with its rings, banded Jupiter, the blue Earth with clouds, little red Mars */
      const planet = (r, tex, x, y, z, emi) => { const m = new T.Mesh(new T.SphereGeometry(r, 48, 32), new T.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emi || 0.35, fog: false })); m.position.set(x, y, z); scene.add(m); return m; };
      const bands = (cols) => cv(512, 256, (x, w, h) => { let y = 0; while (y < h) { const b = 4 + R32() * 22; x.fillStyle = cols[Math.floor(R32() * cols.length)]; x.fillRect(0, y, w, b + 1); y += b; } x.globalAlpha = 0.25; for (let i = 0; i < 60; i++) { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.ellipse(R32() * w, R32() * h, 20 + R32() * 60, 2 + R32() * 4, 0, 0, 6.283); x.fill(); } x.globalAlpha = 1; });
      const jup = planet(20, bands(['#d8c0a0', '#b88a64', '#e8d8c0', '#a8724c', '#f0e4d0', '#c89a74']), -170, 78, -230);
      { const t = jup.material.map.image.getContext('2d'); t.fillStyle = '#c0583a'; t.beginPath(); t.ellipse(330, 160, 26, 13, 0, 0, 6.283); t.fill(); jup.material.map.needsUpdate = true; }   /* the Great Red Spot */
      const sat = planet(12, bands(['#e8d8a8', '#d8c090', '#f0e4c0', '#c8b080']), 150, 96, -210, 0.4); sat.rotation.z = 0.35;
      { const rt = cv(512, 512, (x, w) => { for (let r = 0; r < w / 2; r += 1) { const k = r / (w / 2); if (k < 0.55) continue; const band = Math.sin(k * 80) * 0.5 + 0.5, gap = k > 0.78 && k < 0.8 ? 0.05 : 1; x.strokeStyle = `rgba(${220 + band * 30},${200 + band * 30},${160 + band * 40},${(0.35 + band * 0.4) * gap})`; x.beginPath(); x.arc(w / 2, w / 2, r, 0, 6.283); x.stroke(); } });   /* the rings: many bands and the Cassini gap */
        const ring = new T.Mesh(new T.RingGeometry(15, 27, 96), new T.MeshBasicMaterial({ map: rt, transparent: true, side: T.DoubleSide, depthWrite: false, fog: false })); ring.rotation.x = -Math.PI / 2 + 0.35; sat.add(ring); ring.rotation.set(Math.PI / 2 - 0.1, 0, 0); ring.geometry.attributes.uv && (() => { const g = ring.geometry, pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 54 + 0.5, pos.getY(i) / 54 + 0.5); uv.needsUpdate = true; })(); }
      const earthT = cv(512, 256, (x, w, h) => { x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.fillStyle = ['#3a8a3a', '#6a9a3a', '#b89a5a', '#2a7a4a'][i % 4]; x.beginPath(); x.ellipse(R32() * w, h * 0.2 + R32() * h * 0.6, 14 + R32() * 40, 8 + R32() * 26, R32() * 3, 0, 6.283); x.fill(); } x.fillStyle = '#f4f8ff'; x.fillRect(0, 0, w, 16); x.fillRect(0, h - 16, w, 16); x.globalAlpha = 0.7; for (let i = 0; i < 70; i++) { x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(R32() * w, R32() * h, 10 + R32() * 36, 3 + R32() * 8, (R32() - 0.5) * 0.6, 0, 6.283); x.fill(); } x.globalAlpha = 1; });
      const earthP = planet(9, earthT, 110, 40, -170, 0.3); const halo = new T.Mesh(new T.SphereGeometry(9.6, 32, 24), new T.MeshBasicMaterial({ color: 0x5aa0ff, transparent: true, opacity: 0.25, blending: T.AdditiveBlending, side: T.BackSide, depthWrite: false, fog: false })); earthP.add(halo);
      const mars = planet(4, bands(['#c0583a', '#a8482a', '#d8704a', '#b85a3a']), -80, 58, -250);
      realmFx.push((dt, tm) => { jup.rotation.y = tm * 0.05; sat.rotation.y = tm * 0.04; earthP.rotation.y = tm * 0.06; mars.rotation.y = tm * 0.05; });
      /* Moon-rocks and glowing crystals instead of trees; craters in the dust */
      { const pk = pickSpot(10, 58), rockM = new T.MeshStandardMaterial({ color: 0x8a8890, roughness: 1, flatShading: true }), n = 150, rocks = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), rockM, n), m4 = new T.Matrix4(); let c = 0;
        for (let i = 0; i < 3000 && c < n; i++) { const sp = pk(); if (!sp) continue; const w = 0.4 + R32() * 1.6; m4.compose(new T.Vector3(sp.x, sp.y + w * 0.25, sp.z), new T.Quaternion().setFromEuler(new T.Euler(R32() * 3, R32() * 3, R32() * 3)), new T.Vector3(w, w * (0.5 + R32() * 0.5), w)); rocks.setMatrixAt(c++, m4); } rocks.count = c; rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
        const cm = new T.MeshStandardMaterial({ color: 0x9ae8ff, emissive: 0x3ab8ff, emissiveIntensity: 1.1, roughness: 0.2, transparent: true, opacity: 0.9 }), cm2 = cm.clone(); cm2.color.setHex(0xe0b0ff); cm2.emissive.setHex(0xb45aff);
        const crys = [new T.InstancedMesh(new T.OctahedronGeometry(1, 0), cm, 60), new T.InstancedMesh(new T.OctahedronGeometry(1, 0), cm2, 60)], cc = [0, 0];
        for (let i = 0; i < 2000 && cc[0] + cc[1] < 110; i++) { const sp = pk(); if (!sp) continue; const k = i % 2, im = crys[k]; if (cc[k] >= 60) continue; const n2 = 2 + Math.floor(R32() * 3); for (let j = 0; j < n2 && cc[k] < 60; j++) { const x = sp.x + (R32() - 0.5) * 1.6, z = sp.z + (R32() - 0.5) * 1.6, y = terrainHeight(x, z), s2 = 0.25 + R32() * 0.45; m4.compose(new T.Vector3(x, y + s2 * 1.2, z), new T.Quaternion().setFromEuler(new T.Euler((R32() - 0.5) * 0.6, R32() * 3, (R32() - 0.5) * 0.6)), new T.Vector3(s2, s2 * 2.4, s2)); im.setMatrixAt(cc[k]++, m4); } }
        crys.forEach((im, k) => { im.count = cc[k]; scene.add(im); });
        const cr = new T.InstancedMesh(new T.TorusGeometry(1, 0.13, 6, 28), new T.MeshStandardMaterial({ color: 0x8a8890, roughness: 1 }), 26), floor = new T.InstancedMesh(new T.CircleGeometry(1, 24), new T.MeshStandardMaterial({ color: 0x5e5c66, roughness: 1 }), 26); let nc = 0;
        for (let i = 0; i < 1500 && nc < 26; i++) { const sp = pk(); if (!sp) continue; const r = 1 + R32() * 2.2; m4.compose(new T.Vector3(sp.x, sp.y + 0.04, sp.z), new T.Quaternion().setFromEuler(new T.Euler(-Math.PI / 2, 0, 0)), new T.Vector3(r, r, r * 0.35)); cr.setMatrixAt(nc, m4); m4.compose(new T.Vector3(sp.x, sp.y + 0.03, sp.z), new T.Quaternion().setFromEuler(new T.Euler(-Math.PI / 2, 0, 0)), new T.Vector3(r * 0.9, r * 0.9, 1)); floor.setMatrixAt(nc, m4); nc++; }
        cr.count = floor.count = nc; cr.receiveShadow = floor.receiveShadow = true; scene.add(cr); scene.add(floor); }
    }

    /* ---------- the underworld: a vast cavern under the meadow — the pirate cove and the skull catacombs ---------- */
    if (REALM === 'pirate' || REALM === 'skull') {
      const PIR = REALM === 'pirate', accent = PIR ? 0x39d8c8 : 0x8aff5a;
      sky.visible = false; sunDisc.visible = false; clouds.visible = false; birds.visible = false; motes.visible = false;
      for (const m of realm.treeMeshes) m.visible = false; scene.traverse(o => { if (o.isPoints && o.material && o.material.vertexColors && o.parent === scene) o.visible = false; });
      for (const s of fauna.sheep) s.visible = false; for (const m of fauna.monkeys) m.visible = false; for (const f of fauna.flies) { f.visible = false; f.userData.dead = true; } for (const h of fauna.horses) h.visible = false; fauna.nextHerd = 1e9;
      scene.background = new T.Color(PAL.top);
      const rockC = document.createElement('canvas'); rockC.width = rockC.height = 256; { const x = rockC.getContext('2d'); x.fillStyle = PIR ? '#3a3a3a' : '#2e2836'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 1600; i++) { const r = 2 + R32() * 14; x.fillStyle = PIR ? ['#4a4642', '#2a2826', '#56504a', '#343230'][i % 4] : ['#3e3646', '#221e28', '#4a4254', '#2c2632'][i % 4]; x.globalAlpha = 0.3 + R32() * 0.5; x.beginPath(); x.ellipse(R32() * 256, R32() * 256, r, r * (0.4 + R32() * 0.6), R32() * 3, 0, 6.28); x.fill(); } x.globalAlpha = 1; }
      const rockT = new T.CanvasTexture(rockC); rockT.wrapS = rockT.wrapT = T.RepeatWrapping; rockT.colorSpace = T.SRGBColorSpace; rockT.repeat.set(16, 6); const rockN = FX ? FX.normalFrom(rockC, 3) : null; if (rockN) rockN.repeat.set(16, 6);
      const rockM = new T.MeshStandardMaterial({ map: rockT, normalMap: rockN, normalScale: new T.Vector2(1.3, 1.3), roughness: 0.95, color: 0xa09890 });
      /* the cavern vault, stalactites hanging from it and glow-worms lighting it like stars */
      const vault = new T.Mesh(new T.SphereGeometry(172, 96, 40, 0, Math.PI * 2, 0, Math.PI * 0.5), rockM.clone()); vault.material.side = T.BackSide; vault.scale.y = 0.42; vault.position.y = -6; scene.add(vault);
      { const n = 240, cone = new T.ConeGeometry(1, 1, 7), stal = new T.InstancedMesh(cone, rockM, n), m4 = new T.Matrix4(), q = new T.Quaternion().setFromEuler(new T.Euler(Math.PI, 0, 0)); let c = 0; for (let i = 0; i < n * 2 && c < n; i++) { const a = R32() * Math.PI * 2, r = 20 + R32() * 130, x = Math.cos(a) * r, z = Math.sin(a) * r; const top = Math.sqrt(Math.max(0, 1 - (r / 172) * (r / 172))) * 172 * 0.42 - 6; if (top < 14) continue; const len = 4 + R32() * 16, w = 0.8 + R32() * 2.4; m4.compose(new T.Vector3(x, top - len * 0.45, z), q, new T.Vector3(w, len, w)); stal.setMatrixAt(c++, m4); } stal.count = c; scene.add(stal); }
      { const g = new T.BufferGeometry(), pts = [], cols = []; for (let i = 0; i < 1400; i++) { const a = R32() * Math.PI * 2, r = R32() * 165; const top = Math.sqrt(Math.max(0, 1 - (r / 172) * (r / 172))) * 172 * 0.42 - 6.5; pts.push(Math.cos(a) * r, top, Math.sin(a) * r); const c = new T.Color(PIR ? (i % 3 ? 0x6afff0 : 0xbfffd8) : (i % 3 ? 0x9aff7a : 0xd8a0ff)); cols.push(c.r, c.g, c.b); } g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); const glowPts = new T.Points(g, new T.PointsMaterial({ size: 1.1, vertexColors: true, map: FX ? FX.softDot() : null, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false })); scene.add(glowPts); realmFx.push((dt, tm) => { glowPts.material.opacity = 0.75 + 0.25 * Math.sin(tm * 0.7); }); }
      /* stalagmites rising from the floor */
      { const pk = pickSpot(14, 60), n = 90, sm = new T.InstancedMesh(new T.ConeGeometry(1, 1, 7), rockM, n), m4 = new T.Matrix4(); let c = 0; for (let i = 0; i < 3000 && c < n; i++) { const sp = pk(); if (!sp) continue; const h = 2 + R32() * 7, w = 0.6 + R32() * 1.4; m4.compose(new T.Vector3(sp.x, sp.y + h * 0.42, sp.z), new T.Quaternion().setFromEuler(new T.Euler((R32() - 0.5) * 0.2, 0, (R32() - 0.5) * 0.2)), new T.Vector3(w, h, w)); sm.setMatrixAt(c++, m4); } sm.count = c; sm.castShadow = true; scene.add(sm); }
      /* glowing mushrooms in clusters */
      { const pk = pickSpot(12, 58), n = 160, stem = new T.InstancedMesh(new T.CylinderGeometry(0.08, 0.12, 1, 8), new T.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.6 }), n), cap = new T.InstancedMesh(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), new T.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4, roughness: 0.4 }), n), m4 = new T.Matrix4(); let c = 0; for (let i = 0; i < 2000 && c < n; i++) { const sp = pk(); if (!sp) continue; const k = 2 + Math.floor(R32() * 4); for (let j = 0; j < k && c < n; j++) { const x = sp.x + (R32() - 0.5) * 2.4, z = sp.z + (R32() - 0.5) * 2.4, y = terrainHeight(x, z), h = 0.3 + R32() * 0.9, w = 0.18 + R32() * 0.4; m4.compose(new T.Vector3(x, y + h / 2, z), new T.Quaternion(), new T.Vector3(1, h, 1)); stem.setMatrixAt(c, m4); m4.compose(new T.Vector3(x, y + h, z), new T.Quaternion(), new T.Vector3(w, w * 0.7, w)); cap.setMatrixAt(c, m4); c++; } } stem.count = cap.count = c; scene.add(stem); scene.add(cap); }
      /* bats circling under the vault */
      { const bm = new T.MeshStandardMaterial({ color: 0x14101a, roughness: 0.6, side: T.DoubleSide }); const wg = new T.Shape(); wg.moveTo(0, 0); wg.quadraticCurveTo(0.35, 0.3, 0.7, 0.12); wg.lineTo(0.55, 0); wg.lineTo(0.62, -0.12); wg.lineTo(0.42, -0.06); wg.lineTo(0.3, -0.16); wg.lineTo(0.12, -0.06); wg.closePath(); const wgeo = new T.ShapeGeometry(wg); const bats = new T.Group(); scene.add(bats);
        for (let i = 0; i < 18; i++) { const b = new T.Group(); b.add(new T.Mesh(new T.SphereGeometry(0.14, 8, 6), bm)); const ws = []; for (const sd of [-1, 1]) { const w = new T.Mesh(wgeo, bm); w.scale.set(sd * 1.6, 1.6, 1.6); b.add(w); ws.push(w); } b.userData = { a: R32() * 6.28, r: 14 + R32() * 40, h: 16 + R32() * 18, v: (0.25 + R32() * 0.35) * (R32() < 0.5 ? 1 : -1), ws, k: R32() * 6 }; bats.add(b); }
        realmFx.push((dt, tm) => { for (const b of bats.children) { const u = b.userData; u.a += dt * u.v; b.position.set(Math.cos(u.a) * u.r, u.h + Math.sin(tm * 2 + u.k), Math.sin(u.a) * u.r); b.rotation.y = -u.a + (u.v > 0 ? 0 : Math.PI); const f = Math.sin(tm * 16 + u.k) * 0.9; u.ws[0].rotation.y = f; u.ws[1].rotation.y = -f; } }); }
      /* the water glows */
      if (water.material.uniforms) { const U = water.material.uniforms; U.uShallow.value.setHex(PIR ? 0x18a09a : 0x4ac83a); U.uDeep.value.setHex(PIR ? 0x042a30 : 0x0a3812); U.uFoam.value.setHex(PIR ? 0xd8fff8 : 0xe0ffd0); U.uSky.value.setHex(PIR ? 0x1a6a70 : 0x3a8a2a); }
      { const wl = new T.PointLight(accent, 110, 60, 1.7); wl.position.set(LAKE.x + 6, 7, LAKE.z + 4); scene.add(wl); const rl = new T.PointLight(accent, 110, 60, 1.7); rl.position.set(10, 4, riverZ(10)); scene.add(rl); }
      /* lanterns on posts along the paths (warm, so the underworld is never pitch dark) */
      { const lm = new T.MeshStandardMaterial({ color: 0xffc46a, emissive: 0xffb050, emissiveIntensity: 2.4 }), post = new T.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.9 }); let n = 0; for (const P of PATHS) for (let t = 0.2; t < 1 && n < 16; t += 0.3) { const dx = P[2] - P[0], dz = P[3] - P[1], l = Math.hypot(dx, dz) || 1; const x = P[0] + dx * t - dz / l * 1.9, z = P[1] + dz * t + dx / l * 1.9; if (!placeOk(x, z, 0.6)) continue; const y = terrainHeight(x, z); const p = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 2.6, 8), post); p.position.set(x, y + 1.3, z); p.castShadow = true; scene.add(p); const lamp = new T.Mesh(new T.BoxGeometry(0.34, 0.44, 0.34), lm); lamp.position.set(x, y + 2.7, z); scene.add(lamp); if (n % 3 === 0 && n < 12) { const pl = new T.PointLight(0xffb060, 40, 16, 1.8); pl.position.set(x, y + 2.8, z); scene.add(pl); } n++; } }
      if (PIR) {
        /* the ghost ship riding at anchor in the lagoon */
        const ship = new T.Group(); ship.position.set(LAKE.x, WATER_Y + 0.1, LAKE.z); ship.rotation.y = 0.7; ship.scale.setScalar(0.72); scene.add(ship);
        const hullM = new T.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.75 }), trimM = new T.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.6, roughness: 0.4 }), sailM = new T.MeshStandardMaterial({ color: 0x9ad8cc, emissive: 0x39d8c8, emissiveIntensity: 0.16, transparent: true, opacity: 0.55, side: T.DoubleSide, roughness: 0.85, depthWrite: false });
        { const g = new T.BoxGeometry(12, 3.2, 4.2, 24, 6, 8), pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const t = x / 6, taper = 1 - Math.pow(Math.abs(t), 3) * 0.85, belly = y < 0 ? 1 - Math.pow(-y / 1.6, 2) * 0.55 : 1; pos.setZ(i, z * taper * belly); pos.setY(i, y + Math.pow(Math.abs(t), 2) * 1.2 + (y < 0 ? 0 : 0)); } g.computeVertexNormals(); const hull = new T.Mesh(g, hullM); hull.position.y = 1.2; hull.castShadow = true; ship.add(hull); }
        const deck = new T.Mesh(new T.BoxGeometry(10.6, 0.2, 3.4), new T.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.8 })); deck.position.y = 2.7; ship.add(deck);
        for (const [x, h] of [[-3.2, 9], [0.6, 11], [4, 8]]) { const mast = new T.Mesh(new T.CylinderGeometry(0.14, 0.2, h, 10), hullM); mast.position.set(x, 2.7 + h / 2, 0); ship.add(mast); for (let k = 0; k < 2; k++) { const w = 4.6 - k * 1.2, hh = 2.6 - k * 0.5; const sg = new T.PlaneGeometry(w, hh, 12, 6); const sp2 = sg.attributes.position; for (let i = 0; i < sp2.count; i++) { const sx = sp2.getX(i), sy = sp2.getY(i); sp2.setZ(i, Math.sin((sx / w + 0.5) * Math.PI) * 0.5 + (Math.random() - 0.5) * 0.06); if (sy < -hh * 0.3 && Math.random() < 0.25) sp2.setY(i, sy + 0.4); } sg.computeVertexNormals(); const sail = new T.Mesh(sg, sailM); sail.position.set(x, 2.7 + h * 0.45 + k * (hh + 0.3), 0.2); sail.rotation.y = Math.PI / 2; sail.userData.k = x + k; ship.add(sail); const yard = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, w + 0.4, 6), hullM); yard.rotation.x = Math.PI / 2; yard.position.set(x, sail.position.y + hh / 2, 0); ship.add(yard); } }
        { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#0c0c10'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#f2ece0'; x.beginPath(); x.arc(128, 66, 30, 0, 6.28); x.fill(); x.fillRect(110, 86, 36, 18); x.fillStyle = '#0c0c10'; x.beginPath(); x.arc(116, 64, 8, 0, 6.28); x.arc(140, 64, 8, 0, 6.28); x.fill(); x.strokeStyle = '#f2ece0'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(70, 118); x.lineTo(186, 146); x.moveTo(186, 118); x.lineTo(70, 146); x.stroke(); const ft = new T.CanvasTexture(c); ft.colorSpace = T.SRGBColorSpace; const flagM = new T.MeshStandardMaterial({ map: ft, side: T.DoubleSide, roughness: 0.8 }); const fl = new T.Mesh(new T.PlaneGeometry(2.2, 1.4, 10, 4), flagM); fl.position.set(0.6 + 1.1, 2.7 + 11 + 0.2, 0); ship.add(fl); flags.push(fl); }
        for (const x of [-5, 5.2]) { const lan = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), new T.MeshStandardMaterial({ color: 0x9affe8, emissive: 0x39d8c8, emissiveIntensity: 3 })); lan.position.set(x, 4.2, 0); ship.add(lan); } { const sl = new T.PointLight(0x39d8c8, 30, 24, 1.8); sl.position.set(0, 9, 3); ship.add(sl); }
        realmFx.push((dt, tm) => { ship.position.y = WATER_Y + 0.1 + Math.sin(tm * 0.8) * 0.12; ship.rotation.z = Math.sin(tm * 0.6) * 0.03; ship.traverse(o => { if (o.userData.k != null) o.rotation.z = Math.sin(tm * 1.2 + o.userData.k) * 0.05; }); sailM.opacity = 0.46 + 0.1 * Math.sin(tm * 1.5); });
        /* treasure: heaps of gold, open chests, barrels and crates */
        { const goldM = new T.MeshStandardMaterial({ color: 0xf2c14e, metalness: 1, roughness: 0.22, emissive: 0x3a2400, emissiveIntensity: 0.4 }); const coinG = new T.CylinderGeometry(0.22, 0.22, 0.05, 14); const n = 900, coins = new T.InstancedMesh(coinG, goldM, n), m4 = new T.Matrix4(); let c = 0; const heaps = []; const pk = pickSpot(10, 50); for (let i = 0; i < 400 && heaps.length < 9; i++) { const sp = pk(); if (sp) heaps.push(sp); }
          for (const hp of heaps) { const k = 80 + Math.floor(R32() * 40); for (let j = 0; j < k && c < n; j++) { const a = R32() * 6.28, r = Math.pow(R32(), 0.7) * 1.8, x = hp.x + Math.cos(a) * r, z = hp.z + Math.sin(a) * r, y = terrainHeight(x, z) + (1.8 - r) * 0.6 * R32() + 0.03; m4.compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler((R32() - 0.5) * 1.2, R32() * 6, (R32() - 0.5) * 1.2)), new T.Vector3(1, 1, 1)); coins.setMatrixAt(c++, m4); }
            const ch = new T.Group(); ch.position.set(hp.x + 1.6, terrainHeight(hp.x + 1.6, hp.z), hp.z); ch.rotation.y = R32() * 6; scene.add(ch); const wood2 = new T.MeshStandardMaterial({ color: 0x6a3e22, roughness: 0.7 }); const bx = new T.Mesh(new T.BoxGeometry(1.4, 0.8, 0.9), wood2); bx.position.y = 0.4; bx.castShadow = true; ch.add(bx); const lid = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 1.4, 16, 1, false, 0, Math.PI), wood2); lid.rotation.z = Math.PI / 2; lid.position.set(0, 0.8, -0.45); lid.rotation.x = -1.2; ch.add(lid); for (const y of [0.2, 0.6]) { const band = new T.Mesh(new T.BoxGeometry(1.44, 0.08, 0.94), goldM); band.position.y = y; ch.add(band); } const gl2 = new T.Mesh(new T.BoxGeometry(1.2, 0.2, 0.7), new T.MeshStandardMaterial({ color: 0xffd86a, emissive: 0xffb830, emissiveIntensity: 1.6 })); gl2.position.y = 0.78; ch.add(gl2); }
          coins.count = c; coins.castShadow = true; scene.add(coins); }
        { const barrelM = new T.MeshStandardMaterial({ color: 0x6a4428, roughness: 0.8 }), n = 26, br = new T.InstancedMesh(new T.CylinderGeometry(0.5, 0.5, 1.2, 16), barrelM, n), m4 = new T.Matrix4(); let c = 0; const pk = pickSpot(12, 56); for (let i = 0; i < 1000 && c < n; i++) { const sp = pk(); if (!sp) continue; m4.compose(new T.Vector3(sp.x, sp.y + 0.6, sp.z), new T.Quaternion().setFromEuler(new T.Euler(R32() < 0.3 ? Math.PI / 2 : 0, R32() * 6, 0)), new T.Vector3(1, 1, 1)); br.setMatrixAt(c++, m4); } br.count = c; br.castShadow = true; scene.add(br); }
        /* crabs scuttling on the sand */
        { const cm = new T.MeshStandardMaterial({ color: 0xd8442a, roughness: 0.5 }), crabs = []; for (let i = 0; i < 10; i++) { const cg = new T.Group(); const bd = new T.Mesh(new T.SphereGeometry(0.34, 12, 8), cm); bd.scale.set(1.3, 0.55, 1); cg.add(bd); for (const sd of [-1, 1]) { const cl = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), cm); cl.position.set(0.42, 0.05, sd * 0.3); cg.add(cl); for (let l = 0; l < 3; l++) { const lg = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.4, 5), cm); lg.position.set(-0.15 + l * 0.15, -0.05, sd * 0.36); lg.rotation.x = sd * 0.9; cg.add(lg); } } let x, z; do { x = LAKE.x + (R32() - 0.5) * 22; z = LAKE.z + (R32() - 0.5) * 22; } while (terrainHeight(x, z) < WATER_Y + 0.3); cg.position.set(x, terrainHeight(x, z) + 0.2, z); cg.userData = { x0: x, z0: z, k: R32() * 6 }; scene.add(cg); crabs.push(cg); }
          realmFx.push((dt, tm) => { for (const c of crabs) { const u = c.userData; const x = u.x0 + Math.sin(tm * 0.6 + u.k) * 1.6; c.position.x = x; c.position.y = terrainHeight(x, c.position.z) + 0.2 + Math.abs(Math.sin(tm * 12 + u.k)) * 0.03; c.rotation.y = Math.PI / 2; } }); }
      } else {
        /* skulls everywhere: piles of them around the valley, one instanced mesh */
        const boneM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
        { const n = 1400, sk = new T.InstancedMesh(skullGeo(), boneM, n), m4 = new T.Matrix4(); let c = 0; const pk = pickSpot(12, 60); const piles = []; for (let i = 0; i < 2000 && piles.length < 26; i++) { const sp = pk(); if (sp) piles.push(sp); }
          for (const pl of piles) { const k = 30 + Math.floor(R32() * 40), rad = 1.4 + R32() * 1.8; for (let j = 0; j < k && c < n; j++) { const a = R32() * 6.28, r = Math.pow(R32(), 0.8) * rad, x = pl.x + Math.cos(a) * r, z = pl.z + Math.sin(a) * r, y = terrainHeight(x, z) + (rad - r) * 0.9 * R32() + 0.25; const s2 = 0.55 + R32() * 0.35; m4.compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler((R32() - 0.5) * 0.8, R32() * 6.28, (R32() - 0.5) * 0.6)), new T.Vector3(s2, s2, s2)); sk.setMatrixAt(c++, m4); } }
          /* and a line of them along every path, like cobbles of bone */
          for (const P of PATHS) { const dx = P[2] - P[0], dz = P[3] - P[1], l = Math.hypot(dx, dz) || 1; for (let t = 0.04; t < 0.96 && c < n; t += 1.3 / l) { const x0 = P[0] + dx * t, z0 = P[1] + dz * t; for (const sd of [-1, 1]) { const x = x0 - dz / l * 2.2 * sd, z = z0 + dx / l * 2.2 * sd; if (!placeOk(x, z, 0.3)) continue; m4.compose(new T.Vector3(x, terrainHeight(x, z) + 0.22, z), new T.Quaternion().setFromEuler(new T.Euler(0, Math.atan2(dx, dz) + (sd > 0 ? -1 : 1) * Math.PI / 2, 0)), new T.Vector3(0.5, 0.5, 0.5)); sk.setMatrixAt(c++, m4); } } }
          sk.count = c; sk.castShadow = true; scene.add(sk); }
        /* bone arches over the paths */
        { const boneC = new T.MeshStandardMaterial({ color: 0xece2cc, roughness: 0.55 }), seg = new T.CapsuleGeometry(0.22, 1.1, 4, 10), n = 240, bones = new T.InstancedMesh(seg, boneC, n), m4 = new T.Matrix4(); let c = 0; for (const P of PATHS) for (const tt of [0.35, 0.75]) { if (c >= n - 14) break; const dx = P[2] - P[0], dz = P[3] - P[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, cx = P[0] + dx * tt, cz = P[1] + dz * tt; if (!placeOk(cx, cz, 0.5)) continue; const y0 = terrainHeight(cx, cz); for (let k = 0; k < 13; k++) { const t = k / 12 * Math.PI, R0 = 2.6; const px = cx + nx * Math.cos(t) * R0, pz = cz + nz * Math.cos(t) * R0, py = y0 + Math.sin(t) * R0 * 1.25 + 0.2; const tang = new T.Vector3(-nx * Math.sin(t), Math.cos(t) * 1.25, -nz * Math.sin(t)).normalize(); m4.compose(new T.Vector3(px, py, pz), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), tang), new T.Vector3(1, 0.9, 1)); bones.setMatrixAt(c++, m4); } const key = new T.Mesh(skullGeo(), boneM); key.position.set(cx, y0 + 2.6 * 1.25 + 0.5, cz); key.lookAt(cx + nz, y0 + 3.5, cz - nx); key.scale.setScalar(0.8); scene.add(key); } bones.count = c; bones.castShadow = true; scene.add(bones); }
        /* tombstones and crooked crosses */
        { const stoneM = new T.MeshStandardMaterial({ color: 0x6a6670, roughness: 0.9, map: rockT }); const sh = new T.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0.5, 1.0); sh.absarc(0, 1.0, 0.5, 0, Math.PI, false); sh.lineTo(-0.5, 0); const tg = new T.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }); const n = 70, tb = new T.InstancedMesh(tg, stoneM, n), m4 = new T.Matrix4(); let c = 0; const pk = pickSpot(12, 58); for (let i = 0; i < 2000 && c < n; i++) { const sp = pk(); if (!sp) continue; const s2 = 0.8 + R32() * 0.7; m4.compose(new T.Vector3(sp.x, sp.y - 0.1, sp.z), new T.Quaternion().setFromEuler(new T.Euler((R32() - 0.5) * 0.3, R32() * 6.28, (R32() - 0.5) * 0.3)), new T.Vector3(s2, s2, s2)); tb.setMatrixAt(c++, m4); } tb.count = c; tb.castShadow = true; scene.add(tb); }
        /* dead trees, twisted and bare */
        { const barkM = new T.MeshStandardMaterial({ color: 0x2e2622, roughness: 0.95 }); const pk = pickSpot(16, 60); for (let i = 0, c = 0; i < 2000 && c < 28; i++) { const sp = pk(); if (!sp) continue; c++; const t = new T.Group(); t.position.set(sp.x, sp.y, sp.z); t.rotation.y = R32() * 6.28; scene.add(t); const h = 4 + R32() * 4; const tr = new T.Mesh(new T.CylinderGeometry(0.18, 0.45, h, 7), barkM); tr.position.y = h / 2; tr.rotation.z = (R32() - 0.5) * 0.2; tr.castShadow = true; t.add(tr); for (let b = 0; b < 4; b++) { const bl = 1.2 + R32() * 1.8; const br = new T.Mesh(new T.CylinderGeometry(0.05, 0.14, bl, 5), barkM); const a = b / 4 * 6.28 + R32(); br.position.set(Math.cos(a) * bl * 0.35, h * (0.55 + R32() * 0.35), Math.sin(a) * bl * 0.35); br.rotation.z = Math.cos(a) * 0.9; br.rotation.x = -Math.sin(a) * 0.9; br.castShadow = true; t.add(br); } } }
        /* candles with green flames: lots of them, a few real lights */
        { const waxM = new T.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.6 }), n = 120, wax = new T.InstancedMesh(new T.CylinderGeometry(0.1, 0.12, 1, 10), waxM, n), m4 = new T.Matrix4(), flamesG = new T.Group(); scene.add(flamesG); let c = 0, candleLights = 0; const pk = pickSpot(10, 58); for (let i = 0; i < 3000 && c < n; i++) { const sp = pk(); if (!sp) continue; const k = 2 + Math.floor(R32() * 4); for (let j = 0; j < k && c < n; j++) { const x = sp.x + (R32() - 0.5) * 1.6, z = sp.z + (R32() - 0.5) * 1.6, y = terrainHeight(x, z), h = 0.3 + R32() * 0.8; m4.compose(new T.Vector3(x, y + h / 2, z), new T.Quaternion(), new T.Vector3(1, h, 1)); wax.setMatrixAt(c, m4); const f = new T.Sprite(new T.SpriteMaterial({ map: FX ? FX.softDot() : null, color: 0x9aff6a, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); f.scale.set(0.5, 0.8, 1); f.position.set(x, y + h + 0.25, z); f.userData.k = R32() * 6; flamesG.add(f); c++; } if (candleLights < 4) { candleLights++; const pl = new T.PointLight(0x8aff5a, 34, 14, 1.8); pl.position.set(sp.x, sp.y + 1.4, sp.z); scene.add(pl); } } wax.count = c; scene.add(wax); realmFx.push((dt, tm) => { for (const f of flamesG.children) { const k = f.userData.k; f.scale.y = 0.7 + 0.25 * Math.sin(tm * 11 + k) * Math.sin(tm * 6 + k); f.material.opacity = 0.75 + 0.2 * Math.sin(tm * 9 + k); } }); }
        /* the great skull mountain at the back of the cavern, eyes aglow */
        { const big = new T.Mesh(skullGeo(), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, color: 0xc8c0b0 })); big.scale.setScalar(34); big.position.set(0, 6, -92); scene.add(big); for (const sd of [-1, 1]) { const eye = new T.Mesh(new T.SphereGeometry(2.6, 20, 14), new T.MeshStandardMaterial({ color: 0x8aff5a, emissive: 0x8aff5a, emissiveIntensity: 3 })); eye.position.set(sd * 6.1, 6 + 1.9, -92 + 16.2); scene.add(eye); realmFx.push((dt, tm) => { eye.material.emissiveIntensity = 2.2 + 1.2 * Math.sin(tm * 1.3 + sd); }); } const bl = new T.PointLight(0x9aff7a, 240, 120, 1.5); bl.position.set(0, 2, -50); scene.add(bl); const rim = new T.PointLight(0xb89aff, 260, 90, 1.5); rim.position.set(0, 40, -120); scene.add(rim); }
        /* ghost wisps and green ground fog drifting */
        { const wisps = new T.Group(); scene.add(wisps); for (let i = 0; i < 26; i++) { const w = new T.Sprite(new T.SpriteMaterial({ map: FX ? FX.softDot() : null, color: 0xc8ffc8, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); w.scale.setScalar(1.2 + R32() * 1.4); w.userData = { a: R32() * 6.28, r: 10 + R32() * 40, h: 2 + R32() * 6, v: 0.1 + R32() * 0.2, k: R32() * 6 }; wisps.add(w); } realmFx.push((dt, tm) => { for (const w of wisps.children) { const u = w.userData; u.a += dt * u.v; w.position.set(Math.cos(u.a) * u.r, u.h + Math.sin(tm * 1.3 + u.k) * 0.8, Math.sin(u.a) * u.r); w.material.opacity = 0.35 + 0.25 * Math.sin(tm * 2 + u.k); } }); }
        { const gf = new T.Group(); scene.add(gf); for (let i = 0; i < 40; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: FX ? FX.softDot() : null, color: 0x7aff9a, transparent: true, opacity: 0.12, depthWrite: false, fog: false })); const sz = 10 + R32() * 14; sp.scale.set(sz, sz * 0.4, 1); let px, pz; do { px = (R32() - 0.5) * 100; pz = (R32() - 0.5) * 100; } while (Math.hypot(px, pz) < 10); sp.position.set(px, height(px, pz) + 1, pz); sp.userData = { v: 0.4 + R32() * 0.6, k: R32() * 6, h: 0.8 + R32() * 1.2 }; gf.add(sp); } realmFx.push((dt, tm) => { for (const sp of gf.children) { const u = sp.userData; sp.position.x += u.v * dt; if (sp.position.x > 55 * SPR) sp.position.x = -55 * SPR; sp.position.y = height(sp.position.x, sp.position.z) + u.h + Math.sin(tm * 0.5 + u.k) * 0.3; sp.material.opacity = 0.1 + 0.07 * Math.sin(tm * 0.7 + u.k); } }); }
      }
    }
    /* the realm's own scenery (realm-*.js): what makes the Pirate Cove a pirate cove, the Catacombs a city of the dead … */
    if (!isMeadow && window.KQRealms && KQRealms.scenery) { try { KQRealms.scenery(REALM, { T, scene, REALM, height, terrainHeight, pickSpot, placeOk, pathDist, reserved, riverZ, riverW, LAKE, WATER_Y, PATHS, R32, FX, fx: f => realmFx.push(f), box, cyl, cone, stoneMat, stoneDark, woodMat, roofMat }); } catch (e) { console.error('realm scenery', e); } }
    const baseGrade = isMeadow ? (night ? 'night' : GOLD ? 'golden' : evening ? 'dusk' : 'day') : REALM === 'space' ? 'dusk' : (FX && FX.GRADES[REALM] ? REALM : 'day');
    if (FX) { try { post = FX.post(renderer, scene, camera, { grade: baseGrade, tilt: 0.5, tiltCenter: 0.5, tiltIn: 0.22, tiltOut: 0.62, maxPixelRatio: RICH && LANDMARK_MODELS && !matchMedia('(pointer: coarse)').matches ? 2 : 1.6 })   /* 2 sharpened the landmark models on computers; without them, 1.6 everywhere as before */; const envTex = FX.env(renderer, { top: PAL.top, horizon: PAL.hor, ground: PAL.grass2, intensity: night ? 0.6 : 0.8 }); scene.environment = envTex; FX.envStrength(scene, night ? 0.35 : 0.28); } catch (e) { console.error('post', e); post = null; } }
    const ro = new ResizeObserver(resize); ro.observe(container); resize(); placeCamera();
    const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); }); io.observe(container);
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });
    frame();
    window.__kq3d = { renderer, scene, camera, fauna, realm, orbit, target, get post() { return post; }, get visible() { return visible; }, get running() { return running; }, frames: 0, step: () => frame(true), eagle: () => { EG.next = 0; }, get EG() { return EG; } };   /* step: one forced frame, for tests in a hidden tab */
    return { setSignatures, viewGlory, gloryView: () => VIEW.on, arrive, setStage, setWorlds, setItems, setEggs, setPlayerEggs, startPlacing, stopPlacing, setRealm, flipRealm, isDemon: () => realm.demon, startBoat, endBoat, isRiding: () => ride.on, setPortals, flyTo, flyBack, isFlying: () => fly.on || !!EG.board, eagleBoard, eagleLand, nestTakeoff, nestLand, nestReset, eagleNow: () => { EG.next = 0; }, resize, destroy() { cancelAnimationFrame(raf); disposeDiorama(); ro.disconnect(); io.disconnect(); renderer.dispose(); cv.remove(); labels.forEach(L => L.remove()); }, night, evening };
  };
  window.Kingdom3D = { create };
})();
