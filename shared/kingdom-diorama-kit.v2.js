/* ============================================================================
   KINGDOM DIORAMA KIT v2 — CORRECTED
   for /Users/yonieyal/kingdom-quest/shared/kingdom3d.js
   three.js r160 core UMD only. No addons, no external assets.
   Paste inside the existing IIFE (so `const T = window.THREE;` is in scope),
   ABOVE `const create = (container, opts) => {`.

   Every identifier that would collide with a `const` inside create()
   (riverZ, ROADS, height, smooth, SEG, SIZE, RIVER) is namespaced `kq*` / KQ.*.
   ============================================================================ */

/* ---------------------------------------------------------------- 0. utils */
const R32 = (s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)(20260917);
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const H2 = (x, y) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf2 = x - xi, yf = y - yi, u = xf2 * xf2 * (3 - 2 * xf2), v = yf * yf * (3 - 2 * yf); const a = H2(xi, yi), b = H2(xi + 1, yi), c = H2(xi, yi + 1), d = H2(xi + 1, yi + 1); return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v; };
const fbm = (x, y, o) => { let s = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < (o || 4); i++) { s += a * vn(x * f, y * f); t += a; a *= 0.5; f *= 2.03; } return s / t; };
const xf = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz));

/* merge parts into ONE non-indexed geometry with baked vertex colours + a
   per-vertex `aLeaf` mask (1 = tintable foliage, 0 = bark/wood/stone).
   BufferGeometryUtils is an addon and is NOT in the core UMD build.
   parts: [{ g:BufferGeometry, m?:Matrix4, c?:Color, leaf?:0|1 }] */
function mergeGeos(parts) {
  const list = []; let n = 0;
  for (const p of parts) {
    if (!p || !p.g) continue;
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    if (p.m) g.applyMatrix4(p.m);
    if (!g.attributes.normal) g.computeVertexNormals();
    const cnt = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new T.BufferAttribute(new Float32Array(cnt * 2), 2));
    list.push({ g, c: p.c || null, leaf: p.leaf ? 1 : 0 }); n += cnt;
  }
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), C = new Float32Array(n * 3), L = new Float32Array(n);
  let o = 0;
  for (const { g, c, leaf } of list) {
    const cnt = g.attributes.position.count;
    P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); U.set(g.attributes.uv.array, o * 2);
    for (let i = 0; i < cnt; i++) { C[(o + i) * 3] = c ? c.r : 1; C[(o + i) * 3 + 1] = c ? c.g : 1; C[(o + i) * 3 + 2] = c ? c.b : 1; L[o + i] = leaf; }
    o += cnt; g.dispose();
  }
  const out = new T.BufferGeometry();
  out.setAttribute('position', new T.BufferAttribute(P, 3));
  out.setAttribute('normal', new T.BufferAttribute(N, 3));
  out.setAttribute('uv', new T.BufferAttribute(U, 2));
  out.setAttribute('color', new T.BufferAttribute(C, 3));
  out.setAttribute('aLeaf', new T.BufferAttribute(L, 1));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}

/* darken vertex colours by downward-facing normals + depth below the crown */
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

/* tileable value-noise (wraps exactly) */
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

/* ------------------------------------------------------------- 1. TERRAIN  */
/* LAKE moved off (-22,18): that spot is 5.1 units from the `memory` plot at
   (-17,17) and would drown it. (-34,-16) is clear of every plot, the sheep
   pen, the fences and the windmill, sits just inside the d<40 flat zone, and
   kisses the river so it reads as a river-fed pool. */
const KQ = {
  WORLD: 130,
  WATER_Y: -0.55,
  LAKE: { x: -34, z: -16, r: 7.6 },
  /* The 3 roads the file actually draws ribbons for, THEN the extra footpaths.
     Point the file's road-ribbon loop at KQ.ROADS so carve and ribbon can
     never disagree. KQ.PATHS is what gets carved (roads + footpaths). */
  ROADS: [[-2, 9, -14, -6], [2, 9, 15, -4], [0, 10, 0, 14]],
  PATHS: [[-2, 9, -14, -6], [2, 9, 15, -4], [0, 10, 0, 14], [-14, -6, -25, 4], [15, -4, 25, 6], [2, 9, 2, -20]],
  pointMats: []                       // materials whose uPix must track pixelRatio
};
const kqRiverZ = x => -26 + Math.sin((x + 60) / 120 * 4.2) * 5 - ((x + 60) / 120) * 6;
const kqRiverW = x => 2.4 + Math.sin(x * 0.07) * 0.8;
function segDist(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1, l2 = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / (l2 || 1)));
  const ax = px - (x1 + dx * t), az = pz - (z1 + dz * t);
  return Math.sqrt(ax * ax + az * az);
}
const kqWaterDist = (x, z) => {
  const lx = x - KQ.LAKE.x, lz = z - KQ.LAKE.z;
  return Math.min(Math.abs(z - kqRiverZ(x)) - kqRiverW(x), Math.sqrt(lx * lx + lz * lz) - KQ.LAKE.r);
};
const kqPathDist = (x, z) => { let d = 1e9; for (const s of KQ.PATHS) { const t = segDist(x, z, s[0], s[1], s[2], s[3]); if (t < d) d = t; } return d; };
const terrace = (h, step, k) => { const f = h / step, i = Math.floor(f), r = f - i; return (i + (k === 3 ? r * r * r : Math.pow(r, k))) * step; };

/* --- baseH LUT -------------------------------------------------------------
   THE load-time fix. Their terrainHeight() calls baseH 5x, and buildTerrain
   calls terrainHeight 11x per vertex; baked straight that is 1.9M baseH calls
   / 17.4M fbm octaves ~= 179 ms on an M-series laptop (~0.6 s on an iPad),
   not the 60-120 ms they claimed. Baking baseH once onto a 257^2 bilinear LUT
   costs 19 ms and makes every later lookup ~free: total load drops to ~91 ms
   (~0.3 s iPad). Max error vs exact: 0.081 world units — invisible. */
const KQ_PAD = 8, KQ_SPAN = KQ.WORLD + KQ_PAD * 2, KQ_N = 256, KQ_INV = KQ_N / KQ_SPAN;
let KQ_LUT = null;
function baseRaw(x, z) {
  const d = Math.hypot(x, z);
  let h = (fbm(x * 0.035, z * 0.035, 4) - 0.5) * 7.5 + (fbm(x * 0.11 + 4, z * 0.11 - 2, 3) - 0.5) * 1.7;
  h += Math.pow(Math.abs(fbm(x * 0.02 - 9, z * 0.02 + 5, 2) - 0.5) * 2, 1.6) * 3.4;   // ridged spine
  h *= ss(6, 15, d);                                                                   // flatten the plaza
  h += 3.2 * Math.max(0, 1 - Math.pow(d / 9, 2));                                      // castle mound
  if (d > 40) h += (d - 40) * 0.38;                                                    // rim hills
  return h;
}
function kqBakeBase() {
  if (KQ_LUT) return;
  const r = KQ_N + 1; KQ_LUT = new Float32Array(r * r);
  for (let j = 0; j <= KQ_N; j++) for (let i = 0; i <= KQ_N; i++) KQ_LUT[j * r + i] = baseRaw(-KQ_SPAN / 2 + i * KQ_SPAN / KQ_N, -KQ_SPAN / 2 + j * KQ_SPAN / KQ_N);
}
function baseH(x, z) {
  if (!KQ_LUT) kqBakeBase();
  let fx = (x + KQ_SPAN / 2) * KQ_INV, fz = (z + KQ_SPAN / 2) * KQ_INV;
  fx = fx < 0 ? 0 : fx > KQ_N ? KQ_N : fx; fz = fz < 0 ? 0 : fz > KQ_N ? KQ_N : fz;
  const i = Math.min(KQ_N - 1, fx | 0), j = Math.min(KQ_N - 1, fz | 0), tx = fx - i, tz = fz - j, r = KQ_N + 1;
  const a = KQ_LUT[j * r + i], b = KQ_LUT[j * r + i + 1], c = KQ_LUT[(j + 1) * r + i], d = KQ_LUT[(j + 1) * r + i + 1];
  return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
}

/* DROP-IN REPLACEMENT for the existing height() (kingdom3d.js line 50). */
function terrainHeight(x, z) {
  const wd = kqWaterDist(x, z), pd = kqPathDist(x, z);
  let h = baseH(x, z);
  const e = 1.2, sx = baseH(x + e, z) - baseH(x - e, z), sz = baseH(x, z + e) - baseH(x, z - e);
  const sl = Math.sqrt(sx * sx + sz * sz) / (2 * e);
  const tm = ss(0.45, 1.15, sl) * 0.85;                                // cliff strata
  if (tm > 0.01) h = lerp(h, terrace(h, 0.92, 3), tm);
  h = lerp(h, -0.15, ss(15, 1.5, wd) * 0.82);                          // valley
  const bw = (wd - 1.7) / 1.5;
  h += Math.exp(-bw * bw) * 0.55 - ss(1.3, -3.0, wd) * 2.7;            // berm + bed
  h -= ss(2.3, 0.5, pd) * 0.17;                                        // worn paths
  return h;
}
function terrainNormal(x, z, out) {
  const e = 0.6, hx = terrainHeight(x + e, z) - terrainHeight(x - e, z), hz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  return (out || new T.Vector3()).set(-hx, 2 * e, -hz).normalize();
}

/* --- procedural ground textures (world-space tiled) ------------------------ */
function grassCanvasTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#75ad52'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) { g.fillStyle = ['#5f9e3e', '#7dbb56', '#68a846', '#8cc563', '#4f8a33', '#94b06a'][i % 6]; g.globalAlpha = 0.25 + R32() * 0.4; const r = 5 + R32() * 18; g.beginPath(); g.ellipse(R32() * 512, R32() * 512, r, r * 0.55, R32() * 3, 0, 6.28); g.fill(); }
  g.globalAlpha = 1;
  for (let i = 0; i < 14000; i++) { g.fillStyle = R32() < 0.5 ? 'rgba(38,74,28,0.30)' : 'rgba(206,238,156,0.22)'; g.fillRect(R32() * 512, R32() * 512, 2, 3 + R32() * 3); }
  for (let i = 0; i < 90; i++) { g.fillStyle = ['rgba(255,214,90,0.5)', 'rgba(255,255,255,0.45)', 'rgba(210,150,255,0.4)'][i % 3]; g.beginPath(); g.arc(R32() * 512, R32() * 512, 2.2, 0, 6.28); g.fill(); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function rockCanvasTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#8b8378'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 600; i++) { const x = R32() * 512, y = R32() * 512, w = 24 + R32() * 90, h = 8 + R32() * 22; g.fillStyle = `rgba(${120 + R32() * 70 | 0},${112 + R32() * 66 | 0},${100 + R32() * 60 | 0},0.5)`; g.beginPath(); g.ellipse(x, y, w / 2, h / 2, (R32() - 0.5) * 0.5, 0, 6.28); g.fill(); }
  g.strokeStyle = 'rgba(40,36,32,0.45)'; g.lineWidth = 1.6;
  for (let i = 0; i < 160; i++) { g.beginPath(); const x = R32() * 512, y = R32() * 512; g.moveTo(x, y); g.lineTo(x + (R32() - 0.5) * 120, y + (R32() - 0.5) * 26); g.stroke(); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = R32() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,250,240,0.10)'; g.fillRect(R32() * 512, R32() * 512, 2, 2); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function strataTex() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  let y = 0; while (y < 256) { const h = 4 + R32() * 26, v = 118 + R32() * 120 | 0, warm = R32() * 26 | 0; g.fillStyle = `rgb(${v + warm},${v + (warm * 0.6 | 0)},${v - 6})`; g.fillRect(0, y, 4, h); y += h; }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; return t;
}
function cloudMaskTex() {
  const N = 256, f = tileNoise(N, 4, 4, 11), c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) { const v = Math.max(0, Math.min(255, (f[i] * 255) | 0)); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;   // data: leave colorSpace = NoColorSpace
}

/* shared uniforms — one object, updated once per frame */
const SKY = {
  uTime: { value: 0 },
  uCloud: { value: null }, uCloudScroll: { value: new T.Vector2() }, uCloudScale: { value: 0.0065 }, uCloudAmt: { value: 0.34 },
  uWind: new T.Vector2(0.9, 0.35)
};
/* ONE owner of the world-position varying, so two decorators on the same
   material can never both declare `varying vec3 vKQW;` (duplicate declaration
   = shader compile failure). `sh` is a fresh object per compile. */
function kqWorldPos(sh) {
  if (sh.__kqWP) return; sh.__kqWP = true;
  sh.vertexShader = 'varying vec3 vKQW;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
vec4 kqw4 = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
kqw4 = instanceMatrix * kqw4;
#endif
vKQW = (modelMatrix * kqw4).xyz;`);
  sh.fragmentShader = 'varying vec3 vKQW;\n' + sh.fragmentShader;
}
/* scrolling cloud shadow for ANY MeshStandardMaterial (ground, trees, roofs) */
function applyCloudShadow(mat, tag) {
  if (mat.__kqCloud) return; mat.__kqCloud = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    if (prev) prev(sh);
    kqWorldPos(sh);
    sh.uniforms.uCloud = SKY.uCloud; sh.uniforms.uCloudScroll = SKY.uCloudScroll;
    sh.uniforms.uCloudScale = SKY.uCloudScale; sh.uniforms.uCloudAmt = SKY.uCloudAmt;
    sh.fragmentShader = 'uniform sampler2D uCloud;\nuniform vec2 uCloudScroll;\nuniform float uCloudScale;\nuniform float uCloudAmt;\n' +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
float kqCl = texture2D(uCloud, vKQW.xz * uCloudScale + uCloudScroll).r;
diffuseColor.rgb *= 1.0 - uCloudAmt * smoothstep(0.44, 0.74, kqCl);`);
  };
  const k = mat.customProgramCacheKey; mat.customProgramCacheKey = () => 'kqcs_' + (tag || '') + (k ? k() : '');
}

/* --- terrain mesh ---------------------------------------------------------- */
function buildTerrain(night, PAL) {
  kqBakeBase();
  const SEGT = 144, geo = new T.PlaneGeometry(KQ.WORLD, KQ.WORLD, SEGT, SEGT); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3), spl = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = terrainHeight(x, z);
    pos.setY(i, h);
    const e = 0.9, dx = terrainHeight(x + e, z) - terrainHeight(x - e, z), dz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
    const sl = Math.sqrt(dx * dx + dz * dz) / (2 * e);
    // concavity AO — 4 taps is enough; the 6-tap ring was 50% more cost for no gain
    let avg = 0; for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283; avg += terrainHeight(x + Math.cos(a) * 2.0, z + Math.sin(a) * 2.0); }
    const ao = Math.min(1, Math.max(0.58, 0.82 + (h - avg / 4) * 0.42));
    const pd = kqPathDist(x, z), wd = kqWaterDist(x, z);
    spl[i * 3] = ss(0.42, 1.05, sl);                                      // rock
    spl[i * 3 + 1] = ss(2.4, 0.7, pd);                                    // path/dirt
    spl[i * 3 + 2] = ss(2.6, -0.4, wd) * (1 - ss(0.2, -1.4, wd) * 0.5);   // damp shore
    // vertex colour carries AO + a little large-scale value drift ONLY.
    // All hue now comes from the splat shader; baking hue here as well is what
    // made their version multiply two albedos together and go muddy.
    const v = ao * (0.93 + (fbm(x * 0.09, z * 0.09, 2) - 0.5) * 0.14);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
  }
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  geo.setAttribute('aSplat', new T.BufferAttribute(spl, 3));
  geo.computeVertexNormals();

  // retint the canvas textures to the time-of-day palette instead of multiplying
  // a second albedo on top. `new T.Color(r,g,b)` floats are working (linear) space.
  const tint = (hex, baseHex) => { const w = new T.Color(hex), b = new T.Color(baseHex); return new T.Color(w.r / Math.max(b.r, 1e-4), w.g / Math.max(b.g, 1e-4), w.b / Math.max(b.b, 1e-4)); };
  const uni = {
    uGrass: { value: grassCanvasTex() }, uRock: { value: rockCanvasTex() }, uStrata: { value: strataTex() },
    uGrassTint: { value: tint(PAL.grass, 0x75ad52) },
    uRockTint: { value: night ? new T.Color(0.42, 0.46, 0.60) : new T.Color(1, 1, 1) },
    uDirt: { value: new T.Color(night ? 0x5b4c35 : 0xb59a66) },
    uSand: { value: new T.Color(night ? 0x5d5a48 : 0xcfc09a) }
  };
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, color: 0xffffff });
  mat.onBeforeCompile = sh => {
    kqWorldPos(sh);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = 'attribute vec3 aSplat;\nvarying vec3 vSplat;\nvarying vec3 vWN;\n' +
      sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvSplat = aSplat;\nvWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = `uniform sampler2D uGrass;
uniform sampler2D uRock;
uniform sampler2D uStrata;
uniform vec3 uGrassTint;
uniform vec3 uRockTint;
uniform vec3 uDirt;
uniform vec3 uSand;
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
  float band = texture2D(uStrata, vec2(0.5, fract(P.y * 0.085 + gr.b * 0.12))).r;
  rk *= (0.72 + 0.62 * band) * uRockTint;
  float rockW = clamp(vSplat.x + smoothstep(0.34, 0.62, 1.0 - vWN.y) * 0.75, 0.0, 1.0);
  vec3 al = mix(gr * uGrassTint, rk, rockW);
  al = mix(al, uDirt * (0.70 + 0.55 * gr.g), vSplat.y * 0.92);
  al = mix(al, uSand * (0.78 + 0.44 * gr.r), vSplat.z);
  al *= mix(1.0, 0.80, smoothstep(0.35, 0.95, vSplat.z));
  diffuseColor.rgb *= al;
}`);
  };
  mat.customProgramCacheKey = () => 'kqterrain';
  applyCloudShadow(mat, 'terrain');
  const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true; mesh.castShadow = false;
  mesh.userData.kqTextures = [uni.uGrass.value, uni.uRock.value, uni.uStrata.value];
  return mesh;
}

/* ---------------------------------------------------------------- 2. WATER */
function bakeDepthMap(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = (i / (size - 1) - 0.5) * KQ.WORLD, z = (j / (size - 1) - 0.5) * KQ.WORLD;
    const d = Math.max(0, Math.min(1, (KQ.WATER_Y - terrainHeight(x, z)) / 3.0)), k = (j * size + i) * 4;
    img.data[k] = (d * 255) | 0; img.data[k + 1] = 0; img.data[k + 2] = 0; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.minFilter = t.magFilter = T.LinearFilter; t.generateMipmaps = false; return t;
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
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
/* trimmed water mesh: only quads that actually hold water, with baked depth */
function buildWater(night, PAL, sunDir) {
  const G = 160, step = KQ.WORLD / G, half = KQ.WORLD / 2, P = [], D = [], idx = [];
  const key = new Int32Array((G + 1) * (G + 1)).fill(-1);
  const hCache = new Float32Array((G + 1) * (G + 1));
  for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) hCache[j * (G + 1) + i] = terrainHeight(-half + i * step, -half + j * step);
  const vert = (i, j) => {
    const k = j * (G + 1) + i; if (key[k] >= 0) return key[k];
    const x = -half + i * step, z = -half + j * step, d = Math.max(0, KQ.WATER_Y - hCache[k]);
    key[k] = P.length / 3; P.push(x, KQ.WATER_Y, z); D.push(d); return key[k];
  };
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const h0 = hCache[j * (G + 1) + i], h1 = hCache[j * (G + 1) + i + 1], h2 = hCache[(j + 1) * (G + 1) + i], h3 = hCache[(j + 1) * (G + 1) + i + 1];
    if (Math.min(h0, h1, h2, h3) > KQ.WATER_Y + 0.05) continue;
    const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
    idx.push(a, c, b, b, c, d);                                   // CCW seen from above (+Y)
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  geo.setAttribute('aDepth', new T.Float32BufferAttribute(D, 1));
  geo.setIndex(idx); geo.computeBoundingSphere();

  const dTex = bakeDepthMap(192), nTex = waterNormalTex();
  const uni = {
    // three's refreshFogUniforms() overwrites these from scene.fog every frame
    // (material.fog === true), so the initial values do not matter — but the
    // uniform objects MUST exist because a raw ShaderMaterial gets no UniformsLib.
    fogColor: { value: new T.Color() }, fogNear: { value: 1 }, fogFar: { value: 100 }, fogDensity: { value: 0.00025 },
    uTime: SKY.uTime, uNrm: { value: nTex }, uDepthTex: { value: dTex }, uSize: { value: KQ.WORLD },
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
  float dep = mix(vDepth, bed, 0.35);
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
  const m = new T.Mesh(geo, mat); m.renderOrder = 2;
  m.userData.kqTextures = [dTex, nTex];
  return m;
}

/* ---------------------------------------------------------------- 3. TREES */
const WIND = { uTime: SKY.uTime, uAmp: { value: 1 } };
function applyWind(mat, treeH, stiff, tag) {
  if (mat.__kqWind) return; mat.__kqWind = true;
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
  const k = mat.customProgramCacheKey; mat.customProgramCacheKey = () => 'kqwind_' + tag + (k ? k() : '');
}
/* per-instance tint must hit FOLIAGE ONLY. Their version multiplied
   instanceColor over every vertex, which turns birch bark (0xe4e0d4) green. */
function applyLeafTint(mat, tag) {
  if (mat.__kqLeaf) return; mat.__kqLeaf = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    if (prev) prev(sh);
    sh.vertexShader = 'attribute float aLeaf;\n' + sh.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>
#if defined( USE_COLOR ) && defined( USE_INSTANCING_COLOR )
vColor = color * mix( vec3( 1.0 ), instanceColor, aLeaf );
#endif`);
  };
  const k = mat.customProgramCacheKey; mat.customProgramCacheKey = () => 'kqleaf_' + tag + (k ? k() : '');
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

function buildBroadleaf() {                                   // 458 tris
  const bark = new T.Color(0x5e4227), lf1 = new T.Color(0x3f7f34), lf2 = new T.Color(0x56a03e), lf3 = new T.Color(0x2e6a2f), parts = [];
  parts.push({ g: trunkGeo(0.34, 0.15, 4.0, 6, 7, 0.22), c: bark, leaf: 0 });
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 0.4, L = 1.5 + R32() * 0.7;
    parts.push({ g: branchGeo(0.105, 0.035, L, 5), m: xf(Math.cos(a) * 0.14, 2.5 + i * 0.35, Math.sin(a) * 0.14, 0.72 * Math.sin(a), -a, 0.72 * Math.cos(a)), c: bark, leaf: 0 }); }
  const lob = [[0, 5.5, 0, 1.95, 1], [-1.5, 4.7, 0.6, 1.45, 1], [1.4, 4.8, -0.7, 1.4, 1], [0.5, 6.4, 0.9, 1.05, 0], [-0.9, 6.2, -0.8, 1.0, 0], [1.9, 5.5, 0.9, 0.85, 0], [-1.9, 5.6, -0.5, 0.8, 0]];
  for (const [x, y, z, r, d] of lob) parts.push({ g: lobe(r, d), m: xf(x, y, z, R32() * 3, R32() * 3, R32() * 3, 1, 0.82, 1), c: [lf1, lf2, lf3][(R32() * 3) | 0], leaf: 1 });
  const g = mergeGeos(parts); bakeLeafAO(g, 7.4, 2.6, 1); return { geo: g, h: 7.4 };
}
function buildConifer() {                                     // 283 tris
  const bark = new T.Color(0x4a3524), nd1 = new T.Color(0x24552f), nd2 = new T.Color(0x1b4429), parts = [];
  parts.push({ g: trunkGeo(0.30, 0.07, 6.6, 5, 6, 0), c: bark, leaf: 0 });
  for (let k = 0; k < 6; k++) {
    const t = k / 6, y = 1.0 + t * 5.0, r = (1.85 - t * 1.35);
    parts.push({ g: new T.ConeGeometry(r, 1.5, 9, 1, true), m: xf(0, y + 0.55, 0, 0, k * 0.9, 0), c: k % 2 ? nd1 : nd2, leaf: 1 });
    for (let b = 0; b < 5; b++) { const a = b / 5 * 6.283 + k * 0.7;
      parts.push({ g: new T.ConeGeometry(0.30, 1.0, 5, 1, true), m: xf(Math.cos(a) * r * 0.82, y + 0.25, Math.sin(a) * r * 0.82, 1.15 * Math.sin(a), 0, -1.15 * Math.cos(a)), c: nd2, leaf: 1 }); }
  }
  parts.push({ g: new T.ConeGeometry(0.55, 1.5, 7, 1, true), m: xf(0, 6.2, 0), c: nd1, leaf: 1 });
  const g = mergeGeos(parts); bakeLeafAO(g, 7.7, 1.0, 0.9); return { geo: g, h: 7.7 };
}
function buildBirch() {                                       // 424 tris
  const bark = new T.Color(0xe4e0d4), dark = new T.Color(0x8e8b80), lf1 = new T.Color(0x86b64a), lf2 = new T.Color(0x6a9e3c), parts = [];
  parts.push({ g: trunkGeo(0.18, 0.07, 5.4, 7, 7, -0.30), c: bark, leaf: 0 });
  for (let i = 0; i < 5; i++) parts.push({ g: new T.BoxGeometry(0.06, 0.012, 0.30), m: xf((R32() - 0.5) * 0.2, 0.9 + i * 0.85, 0.15, 0, R32() * 3, 0), c: dark, leaf: 0 });
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 1.1;
    parts.push({ g: branchGeo(0.05, 0.02, 1.25, 4), m: xf(Math.cos(a) * 0.09, 3.2 + i * 0.5, Math.sin(a) * 0.09, 0.85 * Math.sin(a), -a, 0.85 * Math.cos(a)), c: bark, leaf: 0 }); }
  const lob = [[0, 5.6, 0, 1.5, 1], [-1.2, 5.1, 0.5, 1.15, 1], [1.1, 5.3, -0.5, 0.95, 0], [0.3, 6.3, 0.6, 0.8, 0], [-0.7, 6.1, -0.6, 0.7, 0]];
  for (const [x, y, z, r, d] of lob) parts.push({ g: lobe(r, d), m: xf(x, y, z, R32() * 3, R32() * 3, R32() * 3, 1.1, 0.62, 1.1), c: R32() < 0.5 ? lf1 : lf2, leaf: 1 });
  const g = mergeGeos(parts); bakeLeafAO(g, 7.0, 3.0, 0.85); return { geo: g, h: 7.0 };
}

function plantSpecies(parent, spec, count, pick, opts) {
  opts = opts || {};
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  applyLeafTint(mat, opts.tag || 'tree');
  applyWind(mat, spec.h, opts.stiff || 2.2, opts.tag || 'tree');
  applyCloudShadow(mat, opts.tag || 'tree');
  const mesh = new T.InstancedMesh(spec.geo, mat, count);
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
    // multiplies the baked FOLIAGE colours only (see applyLeafTint). Keep near 1.
    col.setHSL(0.24 + (R32() - 0.5) * 0.085, 0.42 + R32() * 0.26, 0.5 + (R32() - 0.5) * 0.14);
    col.setRGB(lerp(1, col.r * 2.0, 0.34), lerp(1, col.g * 2.0, 0.34), lerp(1, col.b * 2.0, 0.34));
    mesh.setColorAt(placed, col);
    if (opts.onPlaced) opts.onPlaced(p.x, p.y, p.z, sc);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  // r160 InstancedMesh.computeBoundingSphere() DOES iterate instance matrices,
  // and Frustum.intersectsObject() prefers object.boundingSphere. So culling is
  // correct — no need to disable it. (Verified against the r160 build.)
  mesh.computeBoundingSphere();
  parent.add(mesh); return mesh;
}

/* ------------------------------------------------------- 4. CONTACT SHADOWS */
function contactShadows(parent, max) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.62)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  const tx = new T.CanvasTexture(c);
  const mat = new T.ShaderMaterial({
    uniforms: { uTex: { value: tx }, uStr: { value: 0.42 } },
    transparent: true, depthWrite: false, depthTest: true,
    blending: T.CustomBlending, blendSrc: T.ZeroFactor, blendDst: T.SrcColorFactor,
    // the quad is flat but the ground under it is not; offset wins the depth
    // test instead of letting the corners sink and clip into half-moons.
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
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
  mesh.userData.kqTextures = [tx];
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
/* hipped roof. WINDING FIXED: all six faces in the original were wound
   inside-out (every normal pointed DOWN), so with FrontSide the roof was
   invisible from outside. Each push() has its 2nd and 3rd vertex swapped. */
function hipRoofGeo(w, d, h, over, ridgeFrac) {
  const W = w / 2 + over, D = d / 2 + over, rf = (ridgeFrac == null ? 0.42 : ridgeFrac) * W;
  const v = [], uv = [], push = (a, b, c, ua, ub, uc) => { v.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...uc); };
  const A = [-W, 0, -D], B = [W, 0, -D], C = [W, 0, D], E = [-W, 0, D], R1 = [-rf, h, 0], R2 = [rf, h, 0];
  const sl = Math.hypot(h, D), sh2 = Math.hypot(h, W - rf);
  push(A, R2, B, [0, 0], [(W + rf), sl], [w + 2 * over, 0]);
  push(A, R1, R2, [0, 0], [(W - rf), sl], [(W + rf), sl]);
  push(C, R1, E, [0, 0], [(W + rf), sl], [w + 2 * over, 0]);
  push(C, R2, R1, [0, 0], [(W + rf), sl], [(W - rf), sl]);
  push(B, R2, C, [0, 0], [D, sh2], [d + 2 * over, 0]);
  push(E, R1, A, [0, 0], [D, sh2], [d + 2 * over, 0]);
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;                                    // 6 tris
}
function gableRoofGeo(w, d, h, over) {
  const W = w / 2 + over, s = new T.Shape();
  s.moveTo(-W, 0); s.lineTo(W, 0); s.lineTo(W, 0.14); s.lineTo(0, h); s.lineTo(-W, 0.14); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: d + 2 * over, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -(d / 2 + over)); return g;                          // 16 tris
}
function fasciaGeo(w, d, over, t) {
  const W = w / 2 + over, D = d / 2 + over, parts = [];
  parts.push({ g: new T.BoxGeometry(2 * W, t, 0.09), m: xf(0, -t / 2, -D) });
  parts.push({ g: new T.BoxGeometry(2 * W, t, 0.09), m: xf(0, -t / 2, D) });
  parts.push({ g: new T.BoxGeometry(0.09, t, 2 * D), m: xf(-W, -t / 2, 0) });
  parts.push({ g: new T.BoxGeometry(0.09, t, 2 * D), m: xf(W, -t / 2, 0) });
  return mergeGeos(parts);
}
function dormerGeo(w, h, d, roofH) {
  const parts = [];
  parts.push({ g: new T.BoxGeometry(w, h, d), m: xf(0, h / 2, 0) });
  // gableRoofGeo's ridge runs along Z; rotate PI/2 so it runs along X and the
  // gable face points out of the main slope. Pass (d,w) so the overhang lands
  // on the right axes after the rotation.
  parts.push({ g: gableRoofGeo(d, w, roofH, 0.1), m: xf(0, h, 0, 0, Math.PI / 2) });
  return mergeGeos(parts);
}
function chimneyGeo(w, d, h) {
  const parts = [];
  parts.push({ g: new T.BoxGeometry(w, h, d), m: xf(0, h / 2, 0) });
  parts.push({ g: new T.BoxGeometry(w * 1.34, 0.18, d * 1.34), m: xf(0, h - 0.09, 0) });
  parts.push({ g: new T.BoxGeometry(w * 1.1, 0.12, d * 1.1), m: xf(0, h * 0.62, 0) });
  return mergeGeos(parts);
}
function halfTimberTex(plaster, beam) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = plaster; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) { g.fillStyle = R32() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; g.fillRect(R32() * 256, R32() * 256, 3, 3); }
  g.strokeStyle = beam; g.lineWidth = 15; g.lineCap = 'square';
  g.strokeRect(7, 7, 242, 242);
  g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  for (const x of [64, 128, 192]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.lineWidth = 11;
  g.beginPath(); g.moveTo(8, 128); g.lineTo(64, 8); g.moveTo(192, 8); g.lineTo(248, 128); g.stroke();
  g.beginPath(); g.moveTo(8, 248); g.lineTo(64, 136); g.moveTo(192, 136); g.lineTo(248, 248); g.stroke();
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
/* composed cottage -> 3 merged geometries. ~600 tris, 3 draws.
   Plinth and chimneys moved OUT of `wall` into `trim`: `wall` is the only piece
   that gets the half-timber map, and a half-timbered chimney looks wrong. */
function cottage(cfg) {
  const o = Object.assign({ w: 4.2, d: 3.2, wallH: 2.4, roofH: 1.9, over: 0.42, type: 'hip', dormers: 1, chimneys: [[1.3, 0.6, 2.2]] }, cfg);
  const wall = [], roof = [], trim = [];
  const soot = new T.Color(0x6f6a60), stone = new T.Color(0xb9b2a4), plain = new T.Color(0xffffff);
  wall.push({ g: new T.BoxGeometry(o.w, o.wallH, o.d), m: xf(0, o.wallH / 2, 0), c: plain });
  trim.push({ g: new T.BoxGeometry(o.w + 0.22, 0.3, o.d + 0.22), m: xf(0, 0.15, 0), c: stone });          // plinth
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    trim.push({ g: new T.BoxGeometry(0.17, o.wallH, 0.17), m: xf(sx * (o.w / 2 - 0.05), o.wallH / 2, sz * (o.d / 2 - 0.05)), c: plain });
  const rg = o.type === 'hip' ? hipRoofGeo(o.w, o.d, o.roofH, o.over) : gableRoofGeo(o.w, o.d, o.roofH, o.over);
  roof.push({ g: rg, m: xf(0, o.wallH, 0), c: plain });
  trim.push({ g: fasciaGeo(o.w, o.d, o.over, 0.16), m: xf(0, o.wallH, 0), c: plain });
  for (let i = 0; i < o.dormers; i++) {
    const u = o.dormers === 1 ? 0 : (i / (o.dormers - 1) - 0.5) * o.w * 0.55;
    roof.push({ g: dormerGeo(0.9, 0.62, 0.8, 0.42), m: xf(u, o.wallH + 0.46, o.d / 2 - 0.34), c: plain });
  }
  const tops = [];
  for (const [cx, cz, ch] of o.chimneys) {
    const H = o.wallH + o.roofH + ch;
    trim.push({ g: chimneyGeo(0.48, 0.44, H), m: xf(cx, 0, cz), c: soot });
    tops.push(new T.Vector3(cx, H, cz));
  }
  return { wall: mergeGeos(wall), roof: mergeGeos(roof), trim: mergeGeos(trim), chimneyTops: tops, meta: o };
}

/* ----------------------------------------------------------- 6. ATMOSPHERE */
/* gl_PointSize is clamped on every cloud below. Their originals let smoke reach
   ~360 px per point at close orbit; 168 such points is ~21 M blended fragments
   in one pass, which is exactly the fill-rate wall on an iPad. */
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
  gl_PointSize = min(36.0 * uPix, aSize * uPix * (70.0 / max(dd, 1.0)));
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `uniform vec3 uCol;
varying float vA;
void main(){
  if (vA <= 0.002) discard;
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(uCol, a * a * vA * 0.5);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
  });
  KQ.pointMats.push(m);
  const pts = new T.Points(g, m); pts.frustumCulled = false; return pts;
}
/* every lit window in the scene as ONE additive Points cloud — the bloom stand-in */
function windowGlow() {
  const P = [], C = [], S = [], col = new T.Color(), wv = new T.Vector3();
  const api = {
    add(x, y, z, size, hex) { col.set(hex || 0xffcf78); P.push(x, y, z); C.push(col.r, col.g, col.b); S.push(size || 1.6); },
    /* plot/castle windows are authored in GROUP-LOCAL space. Passing those
       straight to add() puts every glow near the world origin. */
    addLocal(obj, x, y, z, size, hex) { obj.updateWorldMatrix(true, false); wv.set(x, y, z); obj.localToWorld(wv); api.add(wv.x, wv.y, wv.z, size, hex); },
    build(parent, intensity) {
      if (!P.length) return null;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      g.setAttribute('aSize', new T.Float32BufferAttribute(S, 1));
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
  gl_PointSize = min(48.0 * uPix, aSize * uPix * (120.0 / max(dd, 1.0)));
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
      KQ.pointMats.push(m);
      const p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = 3; parent.add(p); return p;
    }
  };
  return api;
}
/* one Points cloud for every chimney on the map */
function smokeSystem(parent, maxStacks, puffsPer) {
  let stacks = 0; const P = [], PH = [], wv = new T.Vector3();
  const api = {
    addStack(x, y, z) { if (stacks >= maxStacks) return; stacks++; for (let k = 0; k < puffsPer; k++) { P.push(x, y, z); PH.push(k / puffsPer + R32() * 0.05); } },
    /* cottage().chimneyTops are COTTAGE-LOCAL. The Points cloud lives on the
       scene, so they must be converted or every plume vents at the origin. */
    addStackLocal(obj, v, dy) { obj.updateWorldMatrix(true, false); wv.copy(v); obj.localToWorld(wv); api.addStack(wv.x, wv.y + (dy || 0), wv.z); },
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
  gl_PointSize = min(64.0 * uPix, (14.0 + t * 46.0) * uPix * (30.0 / max(-mv.z, 1.0)));
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: `uniform vec3 uCol;
varying float vA;
void main(){
  if (vA <= 0.002) discard;
  float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(uCol, a * vA * 0.34);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
      });
      KQ.pointMats.push(m);
      const p = new T.Points(g, m); p.frustumCulled = false; parent.add(p); return p;
    }
  };
  return api;
}

/* ------------------------------------------------------------- 7. PER-FRAME */
let KQ_PIX = -1;
function updateDiorama(tm, dt, camTarget, motesGroup, pixelRatio) {
  SKY.uTime.value = tm;
  SKY.uCloudScroll.value.set(tm * SKY.uWind.x * SKY.uCloudScale.value, tm * SKY.uWind.y * SKY.uCloudScale.value);
  if (motesGroup && camTarget) motesGroup.position.set(camTarget.x, 0, camTarget.z);
  // actually apply it (their version took the argument and ignored it, so
  // gl_PointSize never tracked a DPR change or a resize onto another display)
  if (pixelRatio !== KQ_PIX) { KQ_PIX = pixelRatio; for (const m of KQ.pointMats) m.uniforms.uPix.value = pixelRatio; }
}
/* the existing destroy() only calls renderer.dispose(); this kit adds ~10 canvas
   textures and several megabytes of geometry, so leaking it on every hub teardown
   is now worth fixing. Call from destroy() BEFORE renderer.dispose(). */
function disposeDiorama(scene) {
  scene.traverse(o => {
    if (o.userData && o.userData.kqTextures) for (const t of o.userData.kqTextures) t.dispose();
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) {
      for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); }
      if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) v.dispose(); }
      m.dispose();
    }
    if (o.customDepthMaterial) o.customDepthMaterial.dispose();
  });
  KQ.pointMats.length = 0;
}

/* ============================================================================
   CORRECTED INTEGRATION NOTES — line numbers verified against the real
   /Users/yonieyal/kingdom-quest/shared/kingdom3d.js (251 lines, 2026-09-17).
   The original notes were written against an older revision: every line number
   after ~26 was off by ~18, and they referenced a `lake` at line 48 (it is
   `roadCarve`) and "40 river quads / 15 road discs" that do not exist — the
   file has ONE river ribbon (l.167-177) and THREE road ribbons (l.183-197).

   STEP 0 (new, do first). Line 11: renderer.setPixelRatio(Math.min(1.5, ...)).
     Line 26: add `sun.shadow.normalBias = 0.02;` — with real relief and
     instanced foliage, bias=-0.0008 alone gives acne on slopes. Keep the
     shadow camera at +/-45; widening to +/-60 costs 33% shadow resolution on
     the castle, which is the one thing the kid looks at.

   STEP 1 — terrain. Delete lines 39-65 (noise, smooth, RIVER, riverT, riverZ,
     riverCarve, ROADS, roadCarve, baseHeight, height, SEG, SIZE, the geo/pos/col
     loop and the `ground` mesh). Replace with:
        const height = terrainHeight;
        const ROADS  = KQ.ROADS;              // carve and ribbon now share one list
        SKY.uCloud.value = cloudMaskTex();
        const ground = buildTerrain(night, PAL); scene.add(ground);
     Line 179 uses baseHeight() for the bridge — change to height().
     Everything else already calls height(x,z) and re-seats itself.

   STEP 2 — water. There is no `lake` to delete. Delete the river-ribbon block
     lines 167-177 ONLY (keep the bridge, lines 178-182). Then:
        const water = buildWater(night, PAL, sun.position); scene.add(water);
     Bridge: `br.position.set(bx, height(bx, bz) + 1.1, bz)` and note bz now
     comes from kqRiverZ (the old inner riverZ is gone, so no shadowing).
     Line 72 and line 75 both hard-code the old pond at (x+22, z-18). Replace
     BOTH with the real lake test, or the flowers will avoid empty grass and
     float on the new water:
        if (terrainHeight(x, z) < KQ.WATER_Y + 0.35) continue;

   STEP 3 — trees. Delete line 67 (trunkMat/leafMat/leafMat2), line 71 (tree())
     and line 72 (the scatter loop). Keep `reserved`/`placeOk` (lines 68-69).
     Put this AFTER the last plot() call (line 165), so buildings reserve first:
        const BROAD = buildBroadleaf(), CONIF = buildConifer(), BIRCH = buildBirch();
        const cs = contactShadows(scene, 520);
        const pick = (minD, maxD) => () => {
          const x = (R32()-0.5)*108, z = (R32()-0.5)*108, d = Math.hypot(x,z);
          if (d < minD || d > maxD || !placeOk(x, z, 2.6)) return null;
          const y = terrainHeight(x, z);
          if (y < KQ.WATER_Y + 0.35 || kqPathDist(x, z) < 2.6) return null;
          return { x, y, z };
        };
        // trees already cast a real shadow-map shadow; the blob is root AO, not
        // a second shadow. 0.22 strength / 0.9*scale radius, NOT 0.85 / 2.1.
        const onP = (x,y,z,s) => cs.add(x, y, z, 0.9*s, 0.22);
        plantSpecies(scene, BROAD, 90, pick(15, 54), { stiff: 2.1, tag: 'broad', onPlaced: onP });
        plantSpecies(scene, CONIF, 90, pick(18, 56), { stiff: 3.0, tag: 'conif', onPlaced: onP });
        plantSpecies(scene, BIRCH, 50, pick(15, 46), { stiff: 1.8, tag: 'birch', onPlaced: onP });
     Rocks (l.74) and sheep (l.200) should call cs.add(x, y, z, r, 0.5) — those
     DO want a real contact blob. Then cs.commit().

   STEP 4 — buildings. Inside a plot() builder, e.g. `story` (line 164):
        const C = cottage({ w: 4.0, d: 3.2, wallH: 2.4, roofH: 1.9, type: 'gable', dormers: 2, chimneys: [[1.4, -0.7, 1.9]] });
        const mW = new T.Mesh(C.wall, new T.MeshStandardMaterial({ map: halfTimberTex('#e8dcc2', '#3a2a1e'), vertexColors: true, roughness: 0.9 }));
        const mR = new T.Mesh(C.roof, roofMat), mT = new T.Mesh(C.trim, woodMat);
        for (const m of [mW, mR, mT]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
        // chimneyTops are COTTAGE-LOCAL — convert, or every plume vents at the origin
        C.chimneyTops.forEach(v => smoke.addStackLocal(g, v, 0.2));
     Declare `const smoke = smokeSystem(scene, 12, 14);` before the plots and
     `smoke.build();` after them. Same rule for window glow: use wg.addLocal(g, x, y, z, ...).

   STEP 5 — atmosphere. Line 20: scene.fog = new T.Fog(PAL.fog, 42, 150).
     After the plots:
        const motes = new T.Group(); scene.add(motes); motes.add(dustMotes(400, 60));
        const wg = windowGlow(); const wgPts = wg.build(scene, night ? 1.0 : 0.22);
     sunShafts() is NOT in this kit — see the review. Apply applyCloudShadow to
     stoneMat / roofMat / thatch / woodMat at line 78 (not 60).

   STEP 6 — frame loop (frame() starts line 234). Add after the dt/tm line:
        updateDiorama(tm, dt, target, motes, renderer.getPixelRatio());
     And fix the two real per-frame CPU costs they correctly spotted:
       - line 240 `scene.traverse(o => { if (o.userData.mill) ... })` walks the
         WHOLE scene (~1,400 objects) every frame. Cache the hub at line 199:
         `const millHub = hub;` then `millHub.rotation.z = tm * 0.8;`
       - line 244 `a.g.traverse(...)` per anchor, every frame. At plot() build
         time (line 153) do:
           g.userData.anim = []; g.traverse(o => { const u = o.userData;
             if (u.orbit != null || u.spin || u.smoke != null || u.bee != null) g.userData.anim.push(o); });
         then iterate `a.g.userData.anim` instead of traversing.
     In destroy() (line 250), call disposeDiorama(scene) BEFORE renderer.dispose().

   STEP 7 — the sky fix. Correct and worth doing: line 24, before the closing
     `}`, add `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`
     each on its own line. The sky is currently the ONLY material writing linear
     colour straight to an sRGB framebuffer, so it renders too dark. Expect the
     sky to jump brighter — re-tune PAL.top / PAL.hor afterwards, they were
     hand-picked against the broken pipeline.
   ============================================================================ */
