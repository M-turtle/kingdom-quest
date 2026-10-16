/* Castle Chess — 3D scene v2: five kingdoms (themes), procedural materials, environment reflections,
   particles and a victory banner. Needs THREE (r160 UMD global). Exposes window.CastleScene. */
(function () {
  'use strict';
  const T = window.THREE;
  const FILES = 'abcdefgh';
  const sqToXZ = alg => ({ x: FILES.indexOf(alg[0]) - 3.5, z: 3.5 - (+alg[1] - 1) });
  const xzToSq = (x, z) => { const f = Math.round(x + 3.5), r = Math.round(3.5 - z); return (f < 0 || f > 7 || r < 0 || r > 7) ? null : FILES[f] + (r + 1); };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- noise & procedural textures ----------
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const sm = t => t * t * (3 - 2 * t);
  function noiseField(size, octaves, seed) {
    const rnd = mulberry(seed), out = new Float32Array(size * size);
    let amp = 1, g = 4, total = 0;
    for (let o = 0; o < octaves; o++) {
      const grid = new Float32Array(g * g); for (let i = 0; i < grid.length; i++) grid[i] = rnd();
      for (let y = 0; y < size; y++) {
        const fy = y / size * g, y0 = Math.floor(fy), ty = sm(fy - y0), ya = y0 % g, yb = (y0 + 1) % g;
        for (let x = 0; x < size; x++) {
          const fx = x / size * g, x0 = Math.floor(fx), tx = sm(fx - x0), xa = x0 % g, xb = (x0 + 1) % g;
          const a = grid[ya * g + xa], b = grid[ya * g + xb], c = grid[yb * g + xa], d = grid[yb * g + xb];
          out[y * size + x] += amp * ((a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty);
        }
      }
      total += amp; amp *= 0.5; g *= 2;
    }
    for (let i = 0; i < out.length; i++) out[i] /= total;
    return out;
  }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, repeat) {
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  const rgb = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function paint(size, fn) {
    const c = canvas(size, size), g = c.getContext('2d'), img = g.createImageData(size, size), d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = y * size + x, p = fn(x, y, i); d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); return c;
  }
  const CACHE = {};
  const cached = (key, fn) => CACHE[key] || (CACHE[key] = fn());
  function woodTex(key, light, dark, seed, rings, repeat) {
    return cached(key, () => { const n = noiseField(256, 4, seed), A = rgb(light), B = rgb(dark); return tex(paint(256, (x, y, i) => { const t = (y / 256) * rings + n[i] * 2.4; const r = Math.abs(Math.sin(t * Math.PI)); return mix(A, B, clamp(Math.pow(r, 0.55) * 0.75 + (n[i] - 0.5) * 0.3 + 0.1, 0, 1)); }), repeat); });
  }
  function marbleTex(key, base, vein, seed, strength, repeat) {
    return cached(key, () => { const n = noiseField(256, 5, seed), n2 = noiseField(256, 3, seed + 11), A = rgb(base), V = rgb(vein); return tex(paint(256, (x, y, i) => { const t = Math.abs(Math.sin((x / 256 * 0.7 + y / 256 * 0.4) * 5 + n[i] * 10)); const veins = Math.min(1, Math.pow(1 - t, 14) * strength); const cloud = 1 + (n2[i] - 0.5) * 0.14; const c = mix(A, V, veins); return [c[0] * cloud, c[1] * cloud, c[2] * cloud]; }), repeat); });
  }
  function mottleTex(key, base, seed, contrast, repeat) {
    return cached(key, () => { const n = noiseField(256, 5, seed), A = rgb(base); return tex(paint(256, (x, y, i) => { const v = 1 + (n[i] - 0.5) * contrast; return [A[0] * v, A[1] * v, A[2] * v]; }), repeat); });
  }
  function crackTex(key, base, crack, seed, width, repeat) {
    return cached(key, () => { const n = noiseField(256, 4, seed), A = rgb(base), C = rgb(crack); return tex(paint(256, (x, y, i) => { const k = clamp(1 - Math.abs(n[i] - 0.5) / width, 0, 1); return mix(A, C, k * k); }), repeat); });
  }
  function speckleTex(key, base, fleck, seed, density, repeat) {
    return cached(key, () => { const n = noiseField(256, 4, seed), n2 = noiseField(256, 6, seed + 3), A = rgb(base), F = rgb(fleck); return tex(paint(256, (x, y, i) => { const v = 1 + (n[i] - 0.5) * 0.12; const f = n2[i] > 1 - density ? (n2[i] - (1 - density)) / density : 0; const c = mix(A, F, f); return [c[0] * v, c[1] * v, c[2] * v]; }), repeat); });
  }
  function flagstoneTex(key, base, mortar, seed, repeat, contrast) {
    return cached(key, () => {
      const size = 512, cells = 6, cw = size / cells, rnd = mulberry(seed), A = rgb(base), M = rgb(mortar);
      const jit = []; for (let i = 0; i <= cells; i++) { jit.push([]); for (let j = 0; j <= cells; j++) jit[i].push([(rnd() - 0.5) * cw * 0.3, (rnd() - 0.5) * cw * 0.3]); }
      for (let i = 0; i <= cells; i++) { jit[i][cells] = jit[i][0]; jit[cells][i] = jit[0][i]; }
      const c = canvas(size, size), g = c.getContext('2d');
      g.fillStyle = `rgb(${M.map(Math.round).join(',')})`; g.fillRect(0, 0, size, size);
      const P = (i, j) => [i * cw + jit[i][j][0], j * cw + jit[i][j][1]];
      for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
        const v = 1 + (rnd() - 0.5) * contrast, col = `rgb(${A.map(x => Math.round(clamp(x * v, 0, 255))).join(',')})`;
        const pts = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2;
        g.beginPath(); pts.forEach((p, k) => { const x = p[0] + (cx - p[0]) * 0.07, y = p[1] + (cy - p[1]) * 0.07; k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
        g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 7; g.lineJoin = 'round'; g.stroke(); g.fill();
      }
      const n = noiseField(128, 3, seed + 5), ov = paint(128, (x, y, i) => { const v = 128 + (n[i] - 0.5) * 70; return [v, v, v]; });
      g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.55; g.drawImage(ov, 0, 0, size, size); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      return tex(c, repeat);
    });
  }
  function bannerTexture(bg, trim) {
    const c = canvas(256, 512), g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = trim; g.lineWidth = 12; g.strokeRect(16, 16, 224, 480);
    g.fillStyle = trim;
    g.beginPath(); g.moveTo(60, 270); g.lineTo(196, 270); g.lineTo(184, 180); g.lineTo(152, 216); g.lineTo(128, 150); g.lineTo(104, 216); g.lineTo(72, 180); g.closePath(); g.fill();
    g.fillRect(60, 274, 136, 16);
    [[72, 176], [128, 146], [184, 176]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 9, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * 256, Math.random() * 512, 2, 40);
    return tex(c);
  }
  function flagTexture(bg, trim) {
    const c = canvas(256, 160), g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 160); g.fillStyle = trim; g.fillRect(0, 60, 256, 40);
    g.fillStyle = bg; g.beginPath(); g.arc(128, 80, 28, 0, Math.PI * 2); g.fill(); g.fillStyle = trim; g.beginPath(); g.arc(128, 80, 18, 0, Math.PI * 2); g.fill();
    return tex(c);
  }
  function labelTexture(text, color) {
    const c = canvas(128, 128), g = c.getContext('2d');
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    g.fillStyle = color; g.font = '700 82px Cinzel, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 68);
    const t = tex(c); t.minFilter = T.LinearFilter; return t;
  }
  function envCanvas(e) {
    const c = canvas(256, 128), g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, e.sky); grad.addColorStop(0.52, e.horizon); grad.addColorStop(0.58, e.ground); grad.addColorStop(1, e.groundDark || e.ground);
    g.fillStyle = grad; g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 6; i++) { const x = 20 + i * 42, y = 60, r = g.createRadialGradient(x, y, 1, x, y, 20); r.addColorStop(0, e.glow); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(x - 22, y - 22, 44, 44); }
    return c;
  }
  const spriteTex = (() => { const c = canvas(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.7)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();

/* ═══════════════════════════════════════════════════════════════════════════════════
   MATERIALS & LIGHTING UPGRADE — chess/scene.js
   Paste as one block INSIDE the existing IIFE, after `spriteTex` (line ~113) and
   before `const std = o => new T.MeshStandardMaterial(o);` (line ~115).

   Depends only on helpers already in the file: T, canvas(), tex(), paint(),
   clamp(), cached(), noiseField(), roundedRect(). `roundedRect` is a function
   declaration so it is hoisted — safe to reference from here even though it is
   defined further down the file.

   Core three.js r160 only. No addons, no external assets.
   ═══════════════════════════════════════════════════════════════════════════════════ */

  // ╔═════════════════════════════════════════════════════════════════════════════════╗
  // ║ 1. DERIVED MAPS — tangent-space normal + packed ORM from any procedural canvas  ║
  // ╚═════════════════════════════════════════════════════════════════════════════════╝
  // Every texture in this file is a CanvasTexture, and a CanvasTexture's `.image` IS
  // the source <canvas> — so we can re-read it with getImageData and derive from it.
  // Source and derived are both CanvasTextures, so both keep flipY = true and the UV
  // convention below stays consistent. (A DataTexture would NOT: it defaults to
  // flipY = false, and UNPACK_FLIP_Y behaviour for typed-array uploads is murky.)

  const DERIVED = {};

  // Luminance of `cv`, resampled to res×res, in [0,1]. Perceptual (sRGB) weights:
  // we want mortar lines and wood pores to read as deep, which is how the eye sees them.
  function lumOf(cv, res) {
    const g = cv.getContext('2d', { willReadFrequently: true }), w = cv.width, h = cv.height;
    const d = g.getImageData(0, 0, w, h).data, out = new Float32Array(res * res);
    for (let y = 0; y < res; y++) { const sy = Math.min(h - 1, (y * h / res) | 0) * w;
      for (let x = 0; x < res; x++) { const i = (sy + Math.min(w - 1, (x * w / res) | 0)) * 4;
        out[y * res + x] = (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) / 255; } }
    return out;
  }

  // Separable box blur with WRAP-AROUND sampling — required, because every one of these
  // textures tiles. A clamped blur puts a bright seam at every tile edge.
  // O(n) via running sums; verified to preserve a constant field to 5e-9.
  function blurWrap(src, res, r) {
    if (r < 1) return src;
    const n = r * 2 + 1, tmp = new Float32Array(res * res), out = new Float32Array(res * res);
    for (let y = 0; y < res; y++) { const o = y * res; let s = 0;
      for (let k = -r; k <= r; k++) s += src[o + (((k % res) + res) % res)];
      for (let x = 0; x < res; x++) { tmp[o + x] = s / n; s += src[o + ((x + r + 1) % res)] - src[o + ((((x - r) % res) + res) % res)]; } }
    for (let x = 0; x < res; x++) { let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[(((k % res) + res) % res) * res + x];
      for (let y = 0; y < res; y++) { out[y * res + x] = s / n; s += tmp[((y + r + 1) % res) * res + x] - tmp[((((y - r) % res) + res) % res) * res + x]; } }
    return out;
  }

  // Wrap a derived canvas as a texture that MATCHES the colour map's tiling exactly.
  // Forgetting repeat inheritance is the classic bug: a floor whose colour map repeats
  // 16×16 but whose normal map repeats 1×1 has relief 16× too coarse.
  function linkMap(cv, src) {
    const t = new T.CanvasTexture(cv);
    t.colorSpace = T.NoColorSpace;                 // data, NEVER sRGB — the #1 mistake
    t.wrapS = src.wrapS; t.wrapT = src.wrapT;
    t.repeat.copy(src.repeat); t.offset.copy(src.offset); t.center.copy(src.center); t.rotation = src.rotation;
    t.anisotropy = src.anisotropy; t.generateMipmaps = true; t.minFilter = T.LinearMipmapLinearFilter;
    t.needsUpdate = true; return t;
  }

  /* deriveMaps(srcTex, opts) -> { normal, orm, res }
     opts:
       key           cache key (REQUIRED in practice; falls back to srcTex.uuid)
       res           output resolution (default min(256, source width))
       strength      overall relief. 1.0 ≈ 30° max surface tilt on a strong feature.
       strengthU/V   per-axis relief — this is how you fake anisotropy
       detail        high-pass cutoff; blur radius = res/detail (default 32)
       highpass      false = Sobel raw luminance (keeps big shapes, but also pigment)
       rough         roughness the map is centred on
       roughContrast how much cavity shifts roughness (default 0.8)
       roughRange    [min, max] clamp
       ao            cavity → AO gain (default 1.4)
       metal         constant metalness baked into B (default 0)                          */
  function deriveMaps(src, o) {
    o = o || {};
    const key = o.key || src.uuid; if (DERIVED[key]) return DERIVED[key];
    const img = src.image, res = o.res || Math.min(256, img.width);
    const L = lumOf(img, res);
    // Separate LOW-frequency tone (pigment: which stone is darker) from HIGH-frequency
    // detail (relief: where the mortar groove is). Sobelling raw luminance would emboss
    // the colour variation, which is exactly the "sticker" look we are removing.
    const tone = blurWrap(L, res, Math.max(1, Math.round(res / (o.detail || 32))));
    const su = (o.strengthU != null ? o.strengthU : (o.strength != null ? o.strength : 1)) * 3;
    const sv = (o.strengthV != null ? o.strengthV : (o.strength != null ? o.strength : 1)) * 3;
    const relief = o.relief != null ? o.relief : 1;
    const Hf = new Float32Array(res * res);
    if (o.highpass === false) for (let i = 0; i < Hf.length; i++) Hf[i] = L[i];
    else for (let i = 0; i < Hf.length; i++) Hf[i] = 0.5 + (L[i] - tone[i]) * relief;
    const rBase = o.rough != null ? o.rough : 0.55, rC = o.roughContrast != null ? o.roughContrast : 0.8;
    const rr = o.roughRange || [0.10, 0.96], aoK = o.ao != null ? o.ao : 1.4, met = Math.round((o.metal || 0) * 255);
    const nc = canvas(res, res), ng = nc.getContext('2d'), ni = ng.createImageData(res, res), nd = ni.data;
    const oc = canvas(res, res), og = oc.getContext('2d'), oi = og.createImageData(res, res), od = oi.data;
    for (let y = 0; y < res; y++) {
      const ra = ((y - 1 + res) % res) * res, rb = y * res, rc = ((y + 1) % res) * res;
      for (let x = 0; x < res; x++) {
        const xa = (x - 1 + res) % res, xc = (x + 1) % res, i = rb + x, j = i * 4;
        const tl = Hf[ra + xa], tt = Hf[ra + x], tr = Hf[ra + xc], ll = Hf[rb + xa], rg = Hf[rb + xc],
              bl = Hf[rc + xa], bb = Hf[rc + x], br = Hf[rc + xc];
        const gx = ((tr + 2 * rg + br) - (tl + 2 * ll + bl)) * 0.25;   // /4 maps Sobel to ~[-1,1]
        const gy = ((bl + 2 * bb + br) - (tl + 2 * tt + tr)) * 0.25;
        // N = normalize(-dH/dU, -dH/dV, 1) in OpenGL tangent space (+Y = +V), which is
        // what three.js r160 expects. CanvasTexture keeps flipY = true, so +V runs UP the
        // canvas: dH/dV = -dH/dy_canvas, hence ny = +gy (NOT -gy). Sign-checked against a
        // known ramp: flat field packs to exactly (127.5, 127.5, 255).
        const nx = -gx * su, ny = gy * sv, inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        nd[j] = (nx * inv * 0.5 + 0.5) * 255; nd[j + 1] = (ny * inv * 0.5 + 0.5) * 255;
        nd[j + 2] = (inv * 0.5 + 0.5) * 255; nd[j + 3] = 255;
        // ORM packing matches what three.js actually samples:
        //   aoMap -> R,  roughnessMap -> G,  metalnessMap -> B.  One texture, three maps.
        const cav = L[i] - tone[i];                                   // local detail only
        od[j]     = clamp(1 + Math.min(0, cav) * aoK * 2, 0, 1) * 255; // AO: cavities only
        od[j + 1] = clamp(rBase - cav * rC, rr[0], rr[1]) * 255;       // cavities = rougher
        od[j + 2] = met; od[j + 3] = 255;
      }
    }
    ng.putImageData(ni, 0, 0); og.putImageData(oi, 0, 0);
    const out = { normal: linkMap(nc, src), orm: linkMap(oc, src), res: res };
    DERIVED[key] = out; return out;
  }

  // Attach derived maps to a material that already has a colour map.
  function pbr(mat, o) {
    o = Object.assign({}, o || {});
    if (!mat || !mat.map || !mat.map.image || mat.userData._pbr) return mat;
    if (o.rough == null) o.rough = mat.roughness;   // read BEFORE we overwrite it
    const d = deriveMaps(mat.map, o), s = o.nScale != null ? o.nScale : 0.7;
    mat.normalMap = d.normal;
    mat.normalScale = new T.Vector2(s, o.nScaleV != null ? o.nScaleV : s);
    // GOTCHA: material.roughness MULTIPLIES the G channel. Attaching a roughnessMap
    // while leaving roughness at 0.5 silently halves gloss everywhere. Bake the authored
    // value into the map (above) and hand ownership to the map.
    mat.roughnessMap = d.orm; mat.roughness = 1;
    mat.aoMap = d.orm; d.orm.channel = 0;           // AO on uv0 — these meshes have no uv1
    mat.aoMapIntensity = o.aoIntensity != null ? o.aoIntensity : 1;
    if (o.metal) { mat.metalnessMap = d.orm; mat.metalness = 1; }
    if (o.env != null) mat.envMapIntensity = o.env;
    mat.userData._pbr = 1; mat.needsUpdate = true; return mat;
  }

  // Fine isotropic micro-relief for materials that have NO colour map at all
  // (dragon / ice / forest pw+pb are flat-colour Physical materials today, so they have
  // literally nothing to catch a highlight). One shared bake, reused by all of them.
  function microNormal(key, seed, repeat, o) {
    o = o || {};
    const src = cached('micro_src_' + key, () => {
      const n = noiseField(256, 6, seed);
      return tex(paint(256, (x, y, i) => { const v = n[i] * 255; return [v, v, v]; }), repeat);
    });
    return deriveMaps(src, { key: 'micro_' + key, res: 256, detail: 48,
      rough: o.rough != null ? o.rough : 0.3, roughContrast: 0.3,
      roughRange: o.roughRange || [0.08, 0.55], ao: 0.35,
      strength: o.strength != null ? o.strength : 0.4 });
  }
  function polish(mat, key, seed, o) {
    o = o || {};
    if (!mat || mat.userData._pbr) return mat;
    const d = microNormal(key, seed, o.repeat || [3, 3], { rough: mat.roughness, roughRange: o.roughRange });
    const s = o.nScale != null ? o.nScale : 0.18;
    mat.normalMap = d.normal; mat.normalScale = new T.Vector2(s, s);
    mat.roughnessMap = d.orm; mat.roughness = 1;
    if (o.env != null) mat.envMapIntensity = o.env;
    mat.userData._pbr = 1; mat.needsUpdate = true; return mat;
  }

  // ── anisotropic wood ──────────────────────────────────────────────────────────────
  // woodTex() builds rings as bands of constant canvas-y => the GRAIN RUNS ALONG U.
  // So relief must be strong ACROSS the grain (V) and near-zero ALONG it (U). That is
  // what smears the highlight down the grain like turned/brushed wood.
  function anisoWood(mat, o) {
    o = o || {};
    pbr(mat, { key: o.key, res: o.res || 256,
      strengthU: o.along  != null ? o.along  : 0.30,
      strengthV: o.across != null ? o.across : 1.70,
      rough: o.rough != null ? o.rough : mat.roughness,
      roughContrast: 0.55, roughRange: [0.22, 0.66], ao: 1.1,
      nScale: o.nScale != null ? o.nScale : 0.85, env: o.env != null ? o.env : 0.8 });
    // Real anisotropic BRDF when available (MeshPhysicalMaterial, r157+). Feature-detected
    // so a Standard material just keeps the faked version and nothing breaks.
    if ('anisotropy' in mat) { mat.anisotropy = o.anisotropy != null ? o.anisotropy : 0.55; mat.anisotropyRotation = o.rot || 0; }
    return mat;
  }

  // ── clear-coated marble ───────────────────────────────────────────────────────────
  // Returns a (possibly NEW) material — assign the result back.
  function clearMarble(mat, o) {
    o = o || {};
    let m = mat;
    if (!m.isMeshPhysicalMaterial) m = new T.MeshPhysicalMaterial({ map: mat.map, color: mat.color, roughness: mat.roughness, metalness: mat.metalness || 0 });
    // nScale stays TINY: marble veining is pigment, not relief. Embossing the veins is
    // the most common way to make procedural marble look like plastic.
    pbr(m, { key: o.key, res: o.res || 256, strength: o.strength != null ? o.strength : 0.5,
      rough: o.rough != null ? o.rough : 0.30, roughContrast: 0.7, roughRange: [0.14, 0.50],
      ao: 0.8, nScale: o.nScale != null ? o.nScale : 0.12, env: o.env != null ? o.env : 1.0 });
    m.clearcoat = o.clearcoat != null ? o.clearcoat : 1;
    m.clearcoatRoughness = o.ccRough != null ? o.ccRough : 0.055;
    m.clearcoatNormalMap = null;   // polished slab: the coat is dead flat, only the stone
                                   // under it has relief. Reusing normalMap here = orange peel.
    m.needsUpdate = true; return m;
  }

  // ── one table drives all five kingdoms ────────────────────────────────────────────
  // kinds: wood | stone | marble | crystal | piece
  const MAT_TUNE = {
    oak: {
      light: ['wood',  { across: 1.7, along: 0.30, nScale: 0.85, env: 0.75 }],
      dark:  ['wood',  { across: 1.7, along: 0.30, nScale: 0.80, env: 0.75 }],
      frame: ['wood',  { across: 1.4, along: 0.30, nScale: 0.75, env: 0.70 }],
      plinth:['stone', { nScale: 1.25, env: 0.55 }],
      floor: ['stone', { nScale: 1.10, env: 0.40, res: 128 }],
      wall:  ['stone', { nScale: 1.35, env: 0.45, res: 128 }],
      tower: ['stone', { nScale: 1.35, env: 0.45, res: 128 }],
      pw:    ['piece', { nScale: 0.45, env: 0.90 }],
      pb:    ['piece', { nScale: 0.45, env: 1.10 }]
    },
    marble: {
      light: ['marble', { nScale: 0.10, ccRough: 0.05, env: 1.0 }],
      dark:  ['marble', { nScale: 0.12, ccRough: 0.05, env: 1.0 }],
      frame: ['marble', { nScale: 0.14, ccRough: 0.06, env: 1.1 }],
      plinth:['marble', { nScale: 0.18, ccRough: 0.12, env: 0.8 }],
      floor: ['marble', { nScale: 0.16, ccRough: 0.09, env: 0.9, res: 128 }],
      wall:  ['stone',  { nScale: 0.85, env: 0.45, res: 128 }],
      tower: ['stone',  { nScale: 0.85, env: 0.45, res: 128 }],
      pw:    ['piece',  { nScale: 0.10, env: 1.0 }],
      pb:    ['piece',  { nScale: 0.12, env: 1.1 }]
    },
    dragon: {
      light: ['stone', { nScale: 0.85, env: 0.40 }],
      dark:  ['stone', { nScale: 1.10, env: 0.50 }],
      frame: ['stone', { nScale: 1.00, env: 0.70 }],
      plinth:['stone', { nScale: 1.40, env: 0.35 }],
      floor: ['stone', { nScale: 1.30, env: 0.30, res: 128 }],
      wall:  ['stone', { nScale: 1.50, env: 0.25, res: 128 }],
      tower: ['stone', { nScale: 1.50, env: 0.25, res: 128 }],
      pw:    ['piece', { nScale: 0.22, seed: 91, env: 1.0 }],
      pb:    ['piece', { nScale: 0.16, seed: 92, env: 1.3 }]
    },
    ice: {
      light: ['crystal', { nScale: 0.45, ccRough: 0.04, env: 0.9 }],
      dark:  ['crystal', { nScale: 0.45, ccRough: 0.04, env: 0.9 }],
      frame: ['crystal', { nScale: 0.40, ccRough: 0.03, env: 1.1 }],
      plinth:['stone',   { nScale: 0.90, env: 0.70 }],
      floor: ['stone',   { nScale: 0.80, env: 0.70, res: 128 }],
      wall:  ['stone',   { nScale: 1.20, env: 0.60, res: 128 }],
      tower: ['stone',   { nScale: 1.20, env: 0.60, res: 128 }],
      pw:    ['piece',   { nScale: 0.14, seed: 93, env: 1.0 }],
      pb:    ['piece',   { nScale: 0.12, seed: 94, env: 1.3 }]
    },
    forest: {
      light: ['wood',  { across: 0.9, along: 0.40, nScale: 0.60, env: 0.55 }],
      dark:  ['stone', { nScale: 1.10, env: 0.35 }],
      frame: ['wood',  { across: 1.6, along: 0.30, nScale: 0.85, env: 0.55 }],
      plinth:['stone', { nScale: 1.30, env: 0.30 }],
      floor: ['stone', { nScale: 1.20, env: 0.25, res: 128 }],
      wall:  ['stone', { nScale: 1.45, env: 0.35, res: 128 }],
      tower: ['stone', { nScale: 1.45, env: 0.35, res: 128 }],
      pw:    ['piece', { nScale: 0.20, seed: 95, env: 0.95 }],
      pb:    ['piece', { nScale: 0.16, seed: 96, env: 1.2 }]
    }
  };

  function upgradeMats(id, m) {
    const tune = MAT_TUNE[id] || {};
    for (const k in tune) {
      const kind = tune[k][0], o = Object.assign({ key: id + '_' + k }, tune[k][1] || {});
      const mat = m[k]; if (!mat) continue;
      if (kind === 'wood') anisoWood(mat, o);
      else if (kind === 'stone') pbr(mat, Object.assign({ strength: 1.5, roughContrast: 0.9, roughRange: [0.45, 0.98], ao: 1.8, detail: 20 }, o));
      else if (kind === 'marble') m[k] = clearMarble(mat, o);
      else if (kind === 'crystal') m[k] = clearMarble(mat, Object.assign({ strength: 1.2 }, o));
      else if (kind === 'piece') {
        if (mat.map) pbr(mat, Object.assign({ strength: 0.6, roughContrast: 0.5, ao: 0.7 }, o));
        else polish(mat, o.key, o.seed || 7, o);
      }
    }
    return m;
  }

  // ╔═════════════════════════════════════════════════════════════════════════════════╗
  // ║ 2. BEVELLED BOARD SQUARES with per-square UVs                                   ║
  // ╚═════════════════════════════════════════════════════════════════════════════════╝
  const SQ_GEO = {};
  // No RoundedBoxGeometry in the core build — ExtrudeGeometry over the file's existing
  // roundedRect() does the job and gives correct hard-edged chamfer normals for free.
  // bevelSegments: 1 = a crisp single chamfer (Chess Ultra) rather than a soft fillet.
  function bevelSquareGeo(size, thick, bev, curve, bseg) {
    const k = [size, thick, bev, curve, bseg].join('_');
    if (SQ_GEO[k]) return SQ_GEO[k];
    const depth = thick - 2 * bev;
    const g = new T.ExtrudeGeometry(roundedRect(size, size, bev * 2.2),
      { depth: depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev,
        bevelSegments: bseg || 1, curveSegments: curve || 2 });
    // Extrusion runs +Z; rotateX(-90°) stands it up as +Y. Span becomes [-bev, depth+bev],
    // so translate by -depth/2 to centre it: top lands at +thick/2, matching the current
    // BoxGeometry so the existing `m.position.y = -0.06` still puts the play surface at y=0.
    g.rotateX(-Math.PI / 2); g.translate(0, -depth / 2, 0);
    SQ_GEO[k] = g; return g;
  }
  // Rewrite UVs from position. Must live in geometry, not texture.offset — all 64 squares
  // share one texture object, so per-square variation cannot come from the texture.
  function squareUV(geo, size, u0, v0, u1, v1, turn) {
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      let a = clamp(p.getX(i) / size + 0.5, 0, 1), b = clamp(0.5 - p.getZ(i) / size, 0, 1);
      for (let q = 0; q < (turn || 0); q++) { const t = a; a = b; b = 1 - t; }
      uv.setXY(i, u0 + (u1 - u0) * a, v0 + (v1 - v0) * b);
    }
    uv.needsUpdate = true; return geo;
  }
  // mode 'flow'   -> each square shows its own 1/8 slice, grain runs continuously across
  //                  the whole board like real inlaid veneer. USE THIS FOR WOOD/MARBLE.
  // mode 'jitter' -> deterministic per-square quarter-turn. Use for stone/ice.
  function boardSquareGeo(file, rank, opt) {
    const o = opt || {}, size = o.size || 0.985, thick = o.thick || 0.12, bev = o.bev || 0.018;
    const g = bevelSquareGeo(size, thick, bev, o.curve, o.bseg).clone();
    if (o.mode === 'jitter') { const r = ((file * 73856093) ^ (rank * 19349663)) >>> 0; squareUV(g, size, 0, 0, 1, 1, r & 3); }
    else squareUV(g, size, file / 8, rank / 8, (file + 1) / 8, (rank + 1) / 8, 0);
    return g;
  }

  // ╔═════════════════════════════════════════════════════════════════════════════════╗
  // ║ 3. LIGHTING RIG — motivated three-point + practicals, per kingdom               ║
  // ╚═════════════════════════════════════════════════════════════════════════════════╝
  // r160 is always physically-correct (useLegacyLights was defaulted off in r155):
  // Directional/Hemisphere intensity is irradiance; Point/Spot intensity is CANDELA, and
  // three.js computes irradiance = intensity / d². At 1 unit ≈ 1 m and a board ~7.5 m
  // below the chandeliers, ~25 cd lands ~0.4 on the board — which is why the existing
  // chandelier values were already about right. The problem was never the practicals, it
  // was the four un-motivated fills drowning them.
  //
  // key: [colour, intensity, dirX, dirY, dirZ]  (direction FROM board TO the light)
  // rim: [colour, intensity, yawOffsetFromCamera, height]
  const LIGHTS = {
    // late-afternoon sun raking in through the west side windows
    oak:    { sky: 0xb4c0d8, gnd: 0x7a6650, hemi: 0.40, key: [0xffd9b0, 2.2,  0.86, 0.47,  0.20],
              rim: [0xffb384, 0.70, 2.45, 7.0], top: [0xffe6bc, 26], fire: [0xff8f4a,  50], exp: 0.96 },
    // high overcast daylight; bright stone bounce, so the hemisphere carries real weight
    marble: { sky: 0xd9e3f4, gnd: 0xbeb3a2, hemi: 0.58, key: [0xfff3e0, 2.4,  0.34, 0.90,  0.27],
              rim: [0xdfe9ff, 0.45, 2.35, 9.0], top: [0xfff2dc, 16], fire: [0xffb070,  14], exp: 0.84 },
    // the fire IS the key: low and behind, and the floor lava is the bounce (note the
    // inverted hemisphere — groundColor is the HOT one, which is physically right here)
    dragon: { sky: 0x54504f, gnd: 0x7a6a62, hemi: 0.40, key: [0xffe0cc, 1.35, -0.50, 0.36, -0.79],
              rim: [0xffe8d8, 0.66, 2.60, 5.5], top: [0xffe0c8, 11], fire: [0xffc8a0,  24], exp: 0.86 },
    // moonlight key with a strong cold rim — the rim is what makes ice read as ice
    ice:    { sky: 0xb4bcc6, gnd: 0x525a64, hemi: 0.34, key: [0xe4eaf0, 1.2, -0.45, 0.80,  0.40],
              rim: [0xc4dcee, 0.55, 2.30, 8.0], top: [0xdde4ec, 10], fire: [0xa8cce8,  14], exp: 0.68 },
    // sun through a canopy: warm key, strong green bounce from the moss floor
    forest: { sky: 0xcfd2c6, gnd: 0x585a4c, hemi: 0.42, key: [0xfff3d2, 2.0,  0.30, 0.85,  0.42],
              rim: [0xf0f2e2, 0.50, 2.50, 7.5], top: [0xffe9b8, 20], fire: [0xd0dcb8,  12], exp: 0.86 }
  };

  function makeRig(scene, renderer, opts) {
    const o = opts || {}, C = o.center || new T.Vector3(0, 0.2, 0), rig = { center: C, radius: o.radius || 7.0 };

    // FILL — a hemisphere tuned to real interior bounce. This is the correct physical
    // fill for a room and it replaces BOTH the AmbientLight and the camera-follow point.
    rig.hemi = new T.HemisphereLight(0x9db4e8, 0x6b4a2e, 0.38); scene.add(rig.hemi);

    // KEY — the only board shadow caster.
    rig.key = new T.DirectionalLight(0xffc98a, 2.4);
    rig.key.castShadow = true; rig.key.shadow.mapSize.set(o.keyRes || 2048, o.keyRes || 2048);
    scene.add(rig.key); scene.add(rig.key.target);

    // RIM — ONE light, orbiting with the camera at a fixed yaw so silhouettes always
    // read. Two static rims (as now) go dead whenever you orbit away from them.
    rig.rim = new T.DirectionalLight(0xff9a4a, 0.85); scene.add(rig.rim); scene.add(rig.rim.target);

    // TOP — the surviving `stage` spot, re-motivated as the chandelier cluster. 30 cd,
    // not 95, and no shadow (the key owns board shadows).
    rig.top = new T.SpotLight(0xffe6bc, 30, 0, Math.PI / 5.2, 0.85, 2);
    rig.top.position.set(0, 11.5, 2.2); rig.top.target.position.set(0, 0, 0);
    scene.add(rig.top); scene.add(rig.top.target);

    // HEARTH — the SECOND shadow caster, at the fireplace mouth aimed across the board.
    // Spot, not Point: a point shadow is 6 render passes. distance 0 = pure inverse square.
    rig.hearth = new T.SpotLight(0xff7a28, 60, 0, Math.PI / 3.0, 0.75, 2);
    rig.hearth.position.set(0, 0.45, 12.0); rig.hearth.target.position.set(0, 0.3, -3);
    rig.hearth.castShadow = true; rig.hearth.shadow.mapSize.set(o.fireRes || 1024, o.fireRes || 1024);
    rig.hearth.shadow.camera.near = 2.5; rig.hearth.shadow.camera.far = 32;
    rig.hearth.shadow.bias = -0.0012; rig.hearth.shadow.normalBias = 0.035;  // coarse texels,
    // because SpotLightShadow fov = 2*angle (112° here) — the shadow is soft by design.
    if ('autoUpdate' in rig.hearth.shadow) { rig.hearth.shadow.autoUpdate = false; rig.hearth.shadow.needsUpdate = true; }
    scene.add(rig.hearth); scene.add(rig.hearth.target);
    rig.rimYaw = 2.45; rig.rimY = 7.0;

    // Derive the shadow frustum from where the light ACTUALLY is. The current near=1/far=40
    // over a ~16-unit throw wastes most of the depth buffer; this gives 7.5→32 instead.
    rig.fitKey = function () {
      const c = rig.key.shadow.camera, d = rig.key.position.distanceTo(C), r = rig.radius;
      c.left = -r; c.right = r; c.top = r; c.bottom = -r;
      c.near = Math.max(0.5, d - r * 1.5); c.far = d + r * 2.0;
      c.updateProjectionMatrix();                              // REQUIRED after touching bounds
      const texel = 2 * r / rig.key.shadow.mapSize.x;          // world units per shadow texel
      rig.key.shadow.normalBias = texel * 1.8;                 // ~2 texels along the normal
      rig.key.shadow.bias = -0.008 / (c.far - c.near);         // 8 mm of slop, in NDC depth
      rig.key.target.position.copy(C); rig.key.target.updateMatrixWorld();
    };

    rig.apply = function (id) {
      const L = LIGHTS[id] || LIGHTS.oak;
      rig.hemi.color.setHex(L.sky); rig.hemi.groundColor.setHex(L.gnd); rig.hemi.intensity = L.hemi;
      rig.key.color.setHex(L.key[0]); rig.key.intensity = L.key[1];
      rig.key.position.set(C.x + L.key[2] * 18, C.y + L.key[3] * 18, C.z + L.key[4] * 18);
      rig.rim.color.setHex(L.rim[0]); rig.rim.intensity = L.rim[1]; rig.rimYaw = L.rim[2]; rig.rimY = L.rim[3];
      rig.top.color.setHex(L.top[0]); rig.top.intensity = L.top[1];
      rig.hearth.color.setHex(L.fire[0]); rig.hearth.intensity = L.fire[1];
      if (renderer) renderer.toneMappingExposure = L.exp;
      rig.fitKey(); rig.dirty();
    };
    rig.update = function (cam) {
      const az = Math.atan2(cam.position.x - C.x, cam.position.z - C.z) + rig.rimYaw;
      rig.rim.position.set(C.x + Math.sin(az) * 20, C.y + rig.rimY, C.z + Math.cos(az) * 20);
      rig.rim.target.position.copy(C); rig.rim.target.updateMatrixWorld();
    };
    rig.dirty = function () { if ('needsUpdate' in rig.hearth.shadow) rig.hearth.shadow.needsUpdate = true; };
    return rig;
  }

  // ╔═════════════════════════════════════════════════════════════════════════════════╗
  // ║ 4. ENVIRONMENT that matches the room instead of the sky                         ║
  // ╚═════════════════════════════════════════════════════════════════════════════════╝
  // NOTE on the "light probe" ask: LightProbeGenerator lives in three/examples and is
  // NOT in the core build. The env map below + the hemisphere IS the probe.
  //
  // Best option: bake the ACTUAL room with core PMREMGenerator.fromScene (renders a cube
  // from the origin and prefilters it). Pass `prevRT` so the old target gets disposed.
  function roomEnv(renderer, scene, pmrem, hide, prevRT) {
    const fog = scene.fog, env = scene.environment, shown = [];
    scene.fog = null;          // fog would grey the entire probe
    scene.environment = null;  // feedback
    for (const m of hide || []) if (m && m.visible) { m.visible = false; shown.push(m); }
    const rt = pmrem.fromScene(scene, 0.04, 0.6, 90);
    for (const m of shown) m.visible = true;
    scene.fog = fog; scene.environment = env;
    if (prevRT) prevRT.dispose();
    return rt;                 // caller: scene.environment = rt.texture
  }

  // Cheap deterministic fallback: an equirect that DEPICTS the room. Still miles better
  // than a sky gradient for objects that are indoors.
  function roomEnvCanvas(e) {
    const W = 512, Hh = 256, c = canvas(W, Hh), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, Hh);
    gr.addColorStop(0.00, e.ceil);  gr.addColorStop(0.28, e.upper);
    gr.addColorStop(0.44, e.wall);  gr.addColorStop(0.58, e.wall);
    gr.addColorStop(0.74, e.floor); gr.addColorStop(1.00, e.floorDark || e.floor);
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    for (const u of (e.windows || [0.10, 0.22, 0.34, 0.60, 0.72, 0.84])) {   // real azimuths
      const x = u * W, ww = 0.045 * W, hh = 0.26 * Hh, y = 0.32 * Hh;
      const rg = g.createLinearGradient(0, y, 0, y + hh);
      rg.addColorStop(0, e.win); rg.addColorStop(1, e.win2 || e.win);
      g.fillStyle = rg; g.fillRect(x - ww / 2, y, ww, hh);
    }
    const hx = (e.fireU != null ? e.fireU : 0.5) * W, hy = 0.64 * Hh;
    const rg2 = g.createRadialGradient(hx, hy, 2, hx, hy, 0.15 * W);
    rg2.addColorStop(0, e.fire); rg2.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg2; g.fillRect(hx - 0.2 * W, hy - 0.2 * W, 0.4 * W, 0.4 * W);
    for (let i = 0; i < 4; i++) {                                            // chandeliers
      const x = (0.125 + i * 0.25) * W, y = 0.20 * Hh, r = g.createRadialGradient(x, y, 1, x, y, 30);
      r.addColorStop(0, e.glow); r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r; g.fillRect(x - 32, y - 32, 64, 64);
    }
    return c;
  }
  // Per-theme room descriptors for roomEnvCanvas — add as `room:` on each THEME.
  const ROOMS = {
    oak:    { ceil: '#140f0a', upper: '#291d12', wall: '#5e5449', floor: '#3c332a', floorDark: '#150f0a',
              win: '#ffd9a0', win2: '#ff9f55', fire: 'rgba(255,140,50,0.95)', glow: 'rgba(255,200,130,0.85)' },
    marble: { ceil: '#8e8a9d', upper: '#aea698', wall: '#cfc6b6', floor: '#b8af9e', floorDark: '#6c6459',
              win: '#ffffff', win2: '#d8e8ff', fire: 'rgba(255,190,120,0.7)', glow: 'rgba(255,245,225,0.9)' },
    dragon: { ceil: '#0a0605', upper: '#180d0a', wall: '#33262a', floor: '#30160e', floorDark: '#8a4a2a',
              win: '#ffa060', win2: '#5a1005', fire: 'rgba(255,140,70,0.9)', glow: 'rgba(255,160,100,0.7)' },
    ice:    { ceil: '#141e2e', upper: '#2c3a4c', wall: '#56687a', floor: '#4a5a6c', floorDark: '#28323e',
              win: '#c4d4e2', win2: '#4f7ab0', fire: 'rgba(140,200,245,0.7)', glow: 'rgba(200,225,245,0.6)' },
    forest: { ceil: '#0c1a0e', upper: '#1b3018', wall: '#6b675c', floor: '#464a3a', floorDark: '#101c0c',
              win: '#e6f2c0', win2: '#2f6a3a', fire: 'rgba(190,240,160,0.6)', glow: 'rgba(235,245,200,0.6)' }
  };

  // ╔═════════════════════════════════════════════════════════════════════════════════╗
  // ║ 5. FAKE AO for the room — VERTEX COLOURS (cheaper than a lightmap here)          ║
  // ╚═════════════════════════════════════════════════════════════════════════════════╝
  // Why vertex colours win for THIS room:
  //  • The walls/floor already use TILING uvs (repeat 5×2, 16×16). A lightmap needs
  //    unique, non-tiling UVs, so you would have to hand-author a second UV set for
  //    every room mesh. Vertex colours need no UVs at all.
  //  • Zero texture memory, zero extra samplers. A lightmap is ~4 MB per surface.
  //  • Decisive: three.js `aoMap` only attenuates INDIRECT light. Vertex colours multiply
  //    diffuse for EVERY light, so the corners stay dark under the flickering torches.
  //  • Cost is only the subdivision: ~6.7k triangles across all six room surfaces.
  //
  // Vertex colours are consumed in linear working space and are NOT colour-converted by
  // three.js. These are neutral greys, so there is nothing to convert.
  function ensureVC(geo) {
    let a = geo.attributes.color;
    if (!a) { a = new T.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3); geo.setAttribute('color', a); }
    return a;
  }
  /* bakeRoomAO(meshes, { min, max }, opts)
       opts.reach     falloff distance in world units (default 3.2)
       opts.strength  per-plane darkening (default 0.55)
       opts.pools     [{ x, z, r, d, y, h }] radial contact shadows (plinth, dais, …)
     Measured: floor-at-wall 0.47, vertical corner 0.22, 1.5 units out 0.85, mid-room 1.00. */
  function bakeRoomAO(meshes, room, o) {
    o = o || {};
    const reach = o.reach || 3.2, k = o.strength != null ? o.strength : 0.55, pools = o.pools || [], eps = 0.06;
    const mn = room.min, mx = room.max, v = new T.Vector3();
    const planes = [[0, mn.x], [0, mx.x], [1, mn.y], [1, mx.y], [2, mn.z], [2, mx.z]];
    for (const m of meshes) {
      if (!m || !m.geometry || !m.geometry.attributes.position) continue;
      const g = m.geometry, p = g.attributes.position, col = ensureVC(g);
      m.updateMatrixWorld(true);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
        let a = 1;
        for (let q = 0; q < planes.length; q++) {
          const ax = planes[q][0], d = Math.abs((ax === 0 ? v.x : ax === 1 ? v.y : v.z) - planes[q][1]);
          if (d < eps) continue;                    // skip the plane this vertex lies ON
          const t = clamp(d / reach, 0, 1); a *= 1 - k * (1 - t) * (1 - t);
        }
        for (const s of pools) {
          if (Math.abs(v.y - (s.y != null ? s.y : mn.y)) > (s.h || 1.2)) continue;
          const t = clamp(Math.hypot(v.x - s.x, v.z - s.z) / s.r, 0, 1);
          a *= 1 - (s.d || 0.5) * (1 - t) * (1 - t);
        }
        a = clamp(Math.pow(a, o.gamma || 1), 0, 1);
        col.setXYZ(i, a, a, a);
      }
      col.needsUpdate = true;
    }
  }
  // Materials are swapped on every setTheme, so the flag must be re-applied each time.
  // TRAP: R.walls share ONE material instance — if any mesh using it lacks a color
  // attribute it renders black. ensureVC() defaults to white, which keeps that safe.
  function enableVC(mats) { for (const m of mats) if (m && !m.vertexColors) { m.vertexColors = true; m.needsUpdate = true; } }

  // HDR flames: MeshBasicMaterial passes `diffuse` through unclamped, so >1 survives to
  // ACES and rolls into a white-hot core with a warm fringe. Also gives a later bloom
  // pass something above threshold to grab.
  function hotColor(hex, gain) { return new T.Color().setHex(hex, T.SRGBColorSpace).multiplyScalar(gain || 1); }

  const std = o => new T.MeshStandardMaterial(o);
  const phys = o => new T.MeshPhysicalMaterial(o);

  // ---------- the five kingdoms ----------
  const THEMES = [
    { id: 'oak', name: 'Oak Castle', emoji: '🏰', blurb: 'Warm oak, stone walls and torchlight.', music: 'prelude_c',
      sky: [0x243a7a, 0xf2a860], env: { sky: '#6f86c9', horizon: '#f0b070', ground: '#4a3a2c', glow: 'rgba(255,210,138,0.9)' },
      hemi: [0xbcc8ff, 0x5a4636, 0.75], sun: [0xffe9c8, 2.6, 6, 14, 5], torch: 0xff9a4a, flame: [0xffa040, 0xfff1b0], exposure: 1.15, particles: 'motes', roof: 0x7a1f2b, banner: ['#8e1f2f', '#d9b45a'],
      hall: { ceiling: () => std({ map: woodTex('oak_ceil', 0x4a3320, 0x2a1a0c, 61, 12, [8, 8]), roughness: 0.8 }), beam: () => std({ map: woodTex('oak_beam', 0x5a3a1c, 0x2d190a, 62, 6, [4, 0.5]), roughness: 0.6 }), column: () => std({ map: flagstoneTex('oak_col', 0x9a9084, 0x66605a, 63, [2, 6], 0.18), roughness: 0.85 }), window: ['#ffb060', '#4a70d8'], frame: 0x7a7066, candle: 0xffd080, chand: 0xffc070, fire: 0xff8a20, fireLight: 0xff7a20, hangers: 'none', lanterns: false, fog: 0x2a1c14, carpet: 0x8e1f2f, plume: 0xc0392b, shield: 0x8e1f2f },
      mats: () => ({
        light: std({ map: woodTex('oak_l', 0xe6d6b6, 0xcbb38a, 1, 5, [1, 1]), roughness: 0.5, envMapIntensity: 0.35 }),
        dark: std({ map: woodTex('oak_d', 0x6a4222, 0x3f2410, 2, 5, [1, 1]), roughness: 0.45, envMapIntensity: 0.35 }),
        frame: std({ map: woodTex('oak_f', 0x5c3a1c, 0x2d190a, 3, 8, [0.4, 0.4]), roughness: 0.45, envMapIntensity: 0.5 }),
        plinth: std({ map: flagstoneTex('oak_p', 0x8a8074, 0x55504a, 4, [2, 2], 0.25), roughness: 0.9, envMapIntensity: 0.2 }),
        floor: std({ map: flagstoneTex('oak_fl', 0x6a6158, 0x46403a, 11, [16, 16], 0.22), roughness: 0.95, envMapIntensity: 0.1 }),
        wall: std({ map: flagstoneTex('oak_w', 0x8d8478, 0x5a534b, 12, [5, 2], 0.22), roughness: 0.92, envMapIntensity: 0.15 }),
        tower: std({ map: flagstoneTex('oak_t', 0x8d8478, 0x5a534b, 13, [3, 2], 0.22), roughness: 0.92, envMapIntensity: 0.15 }),
        pw: std({ map: woodTex('oak_pw', 0xfff6e4, 0xe9d6b0, 5, 3, [1, 1]), roughness: 0.5, metalness: 0.02, envMapIntensity: 0.4 }),
        pb: phys({ map: woodTex('oak_pb', 0x2e1a0c, 0x120904, 6, 3, [1, 1]), roughness: 0.38, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 1.0 }),
        accW: std({ color: 0x5a3f2a, roughness: 0.6 }), accB: std({ color: 0xdcc7a0, roughness: 0.5 }), gold: std({ color: 0xc9a227, roughness: 0.35, metalness: 0.75 }),
        outW: new T.MeshBasicMaterial({ color: 0x3a2412, side: T.BackSide }), outB: new T.MeshBasicMaterial({ color: 0xf0dcb0, side: T.BackSide })
      }) },
    { id: 'marble', name: 'Marble Palace', emoji: '🏛️', blurb: 'White marble, gold veins and daylight.', music: 'goldberg_aria',
      sky: [0x8fb0e8, 0xfff0d0], env: { sky: '#bcd4ff', horizon: '#fff2dc', ground: '#cfc3b0', groundDark: '#8a8070', glow: 'rgba(255,255,255,0.95)' },
      hemi: [0xdde8ff, 0x8a8070, 1.0], sun: [0xfff6e8, 2.8, 5, 14, 6], torch: 0xffe6b0, flame: [0xfff0c0, 0xffffff], exposure: 1.1, particles: 'sparkles', roof: 0x2c4a7a, banner: ['#3b2a6e', '#e2c060'],
      hall: { ceiling: () => std({ map: marbleTex('mar_ceil', 0xefe9df, 0xb9ad9a, 64, 0.8, [6, 6]), roughness: 0.4, envMapIntensity: 0.5 }), beam: () => std({ color: 0xd8c9a8, roughness: 0.5, metalness: 0.2 }), column: () => std({ map: marbleTex('mar_col', 0xf4efe6, 0xb1a99c, 65, 0.9, [1, 4]), roughness: 0.3, envMapIntensity: 0.7 }), window: ['#ffffff', '#cfe4ff'], frame: 0xd9c9a4, candle: 0xfff4d0, chand: 0xfff0d0, fire: 0xffb060, fireLight: 0xffc080, hangers: 'none', lanterns: false, fog: 0xd9d0c2, carpet: 0x3b2a6e, plume: 0x3b2a6e, shield: 0x3b2a6e },
      mats: () => ({
        light: std({ map: marbleTex('mar_l', 0xb4a894, 0x8a7f70, 21, 0.9, [1, 1]), roughness: 0.22, envMapIntensity: 0.6 }),
        dark: std({ map: marbleTex('mar_d', 0x4b4347, 0xc9a85a, 22, 0.9, [1, 1]), roughness: 0.25, envMapIntensity: 0.6 }),
        frame: std({ map: marbleTex('mar_f', 0x3a3438, 0xc9a85a, 23, 0.8, [0.4, 0.4]), roughness: 0.25, envMapIntensity: 0.9 }),
        plinth: std({ map: marbleTex('mar_p', 0xd2c9bb, 0x968e84, 24, 0.9, [1.5, 1.5]), roughness: 0.3, envMapIntensity: 0.6 }),
        floor: std({ map: marbleTex('mar_fl', 0xcdc4b4, 0x8f877c, 25, 0.9, [8, 8]), roughness: 0.28, envMapIntensity: 0.6 }),
        wall: std({ map: mottleTex('mar_w', 0xe8dcc4, 26, 0.1, [4, 1]), roughness: 0.8, envMapIntensity: 0.3 }),
        tower: std({ map: mottleTex('mar_t', 0xe4d8c0, 27, 0.1, [2, 2]), roughness: 0.8, envMapIntensity: 0.3 }),
        pw: phys({ map: marbleTex('mar_pw', 0xf4ead2, 0xc4b89c, 28, 0.7, [1, 1]), roughness: 0.22, metalness: 0.0, clearcoat: 0.4, envMapIntensity: 0.8 }),
        pb: phys({ map: marbleTex('mar_pb', 0x1a1719, 0xc9a85a, 29, 0.9, [1, 1]), roughness: 0.2, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.15, envMapIntensity: 1.0 }),
        accW: std({ color: 0x8a7a55, roughness: 0.4, metalness: 0.5 }), accB: std({ color: 0xe2c060, roughness: 0.35, metalness: 0.7 }), gold: std({ color: 0xe2c060, roughness: 0.3, metalness: 0.85 }),
        outW: new T.MeshBasicMaterial({ color: 0x4a4650, side: T.BackSide }), outB: new T.MeshBasicMaterial({ color: 0xf3ecd8, side: T.BackSide })
      }) },
    { id: 'dragon', name: "Dragon's Lair", emoji: '🐉', blurb: 'Obsidian, amber and glowing lava.', music: 'moonlight',
      sky: [0x1a0a0a, 0xe8703a], env: { sky: '#3a2622', horizon: '#b8907a', ground: '#1a0d0a', glow: 'rgba(255,180,130,0.6)' },
      hemi: [0xe8b090, 0x1a0a08, 0.44], sun: [0xffc8a8, 1.4, -6, 12, 4], torch: 0xff9a58, flame: [0xff7a20, 0xffe090], exposure: 1.2, particles: 'embers', roof: 0x2a1616, banner: ['#3a0a0a', '#ff7a20'],
      hall: { ceiling: () => std({ map: mottleTex('dr_ceil', 0x1c1416, 66, 0.5, [8, 8]), roughness: 1 }), beam: () => std({ map: mottleTex('dr_beam', 0x2a1e1c, 67, 0.4, [4, 0.5]), roughness: 1 }), column: () => std({ map: crackTex('dr_col', 0x241a1c, 0x5a2a1a, 68, 0.02, [1, 4]), roughness: 0.7 }), window: ['#ff6a1a', '#5a1005'], frame: 0x3a2a26, candle: 0xff7a30, chand: 0xff6a30, fire: 0xff5a10, fireLight: 0xff5a10, hangers: 'rock', lanterns: false, fog: 0x18100e, carpet: 0x3a0a0a, plume: 0xff7a20, shield: 0x3a0a0a },
      mats: () => ({
        light: std({ map: mottleTex('dr_l', 0xb3a797, 31, 0.2, [1, 1]), roughness: 0.75, envMapIntensity: 0.25 }),
        dark: std({ map: mottleTex('dr_d', 0x4a2820, 32, 0.35, [1, 1]), emissiveMap: crackTex('dr_de', 0x000000, 0xffffff, 33, 0.012, [1, 1]), emissive: 0xff5a10, emissiveIntensity: 0.22, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.4 }),
        frame: std({ map: crackTex('dr_f', 0x2e2224, 0x4a2e26, 34, 0.02, [0.4, 0.4]), roughness: 0.4, metalness: 0.25, envMapIntensity: 0.7 }),
        plinth: std({ map: mottleTex('dr_p', 0x2a2224, 35, 0.4, [2, 2]), emissiveMap: crackTex('dr_pe', 0x000000, 0xffffff, 36, 0.01, [2, 2]), emissive: 0xff5000, emissiveIntensity: 0.28, roughness: 0.8 }),
        floor: std({ map: mottleTex('dr_fl', 0x241c1c, 37, 0.45, [10, 10]), emissiveMap: crackTex('dr_fe', 0x000000, 0xffffff, 38, 0.008, [10, 10]), emissive: 0xff4a00, emissiveIntensity: 0.32, roughness: 0.9 }),
        wall: std({ map: mottleTex('dr_w', 0x3a2c28, 39, 0.5, [5, 2]), roughness: 0.95, envMapIntensity: 0.1 }),
        tower: std({ map: mottleTex('dr_t', 0x3a2c28, 40, 0.5, [3, 2]), roughness: 0.95, envMapIntensity: 0.1 }),
        pw: phys({ color: 0xf3dca6, roughness: 0.32, metalness: 0.2, clearcoat: 0.8, envMapIntensity: 0.7 }),
        pb: phys({ color: 0x0e0a0d, roughness: 0.18, metalness: 0.15, clearcoat: 1.0, clearcoatRoughness: 0.1, envMapIntensity: 1.2 }),
        accW: std({ color: 0x5a2a00, roughness: 0.5 }), accB: std({ color: 0xff7030, emissive: 0xff5a10, emissiveIntensity: 1.5, roughness: 0.4 }), gold: std({ color: 0xffb040, roughness: 0.3, metalness: 0.8 }),
        outW: new T.MeshBasicMaterial({ color: 0x4a1e08, side: T.BackSide }), outB: new T.MeshBasicMaterial({ color: 0xffb070, side: T.BackSide })
      }) },
    { id: 'ice', name: 'Ice Kingdom', emoji: '❄️', blurb: 'Frosted crystal, sapphire and falling snow.', music: 'clair_de_lune',
      sky: [0x141e34, 0x6f8fb4], env: { sky: '#586a86', horizon: '#a8b6c4', ground: '#7a8898', groundDark: '#4a5462', glow: 'rgba(210,220,232,0.45)' },
      hemi: [0xaabccc, 0x33404e, 0.6], sun: [0xe4ecf4, 1.5, 6, 14, -4], torch: 0x80c8ff, flame: [0x8ad0ff, 0xe0f6ff], exposure: 1.02, particles: 'snow', roof: 0x6fa8e0, banner: ['#1e3a6e', '#bfe8ff'],
      hall: { ceiling: () => std({ map: mottleTex('ice_ceil', 0x6a7886, 69, 0.2, [8, 8]), roughness: 0.6 }), beam: () => std({ map: crackTex('ice_beam', 0x86aac8, 0xe8f2fa, 70, 0.01, [4, 0.5]), roughness: 0.2, envMapIntensity: 0.8 }), column: () => phys({ map: crackTex('ice_col', 0x9fc0da, 0xe8f2fa, 71, 0.01, [1, 4]), roughness: 0.12, clearcoat: 1, envMapIntensity: 1 }), window: ['#9fffd8', '#2a5aa8'], frame: 0x8fb4d4, candle: 0xbfe8ff, chand: 0xa8d8ff, fire: 0x7ac8ff, fireLight: 0x6ab8ff, hangers: 'ice', lanterns: false, fog: 0x222c38, carpet: 0x1e3a6e, plume: 0xbfe8ff, shield: 0x1e3a6e },
      mats: () => ({
        light: phys({ map: crackTex('ice_l', 0xb4c2cf, 0x8ea2b6, 41, 0.01, [1, 1]), roughness: 0.2, clearcoat: 0.8, envMapIntensity: 0.7 }),
        dark: phys({ map: crackTex('ice_d', 0x2e5688, 0x6693c2, 42, 0.012, [1, 1]), roughness: 0.22, clearcoat: 0.8, envMapIntensity: 0.7 }),
        frame: phys({ map: crackTex('ice_f', 0xa9cbe8, 0xe8f3fb, 43, 0.01, [0.4, 0.4]), roughness: 0.12, clearcoat: 1.0, envMapIntensity: 0.8 }),
        plinth: std({ map: crackTex('ice_p', 0x96a6b6, 0xc6d2dc, 44, 0.012, [2, 2]), roughness: 0.3, envMapIntensity: 0.6 }),
        floor: std({ map: crackTex('ice_fl', 0x8494a4, 0xb8c6d2, 45, 0.01, [10, 10]), roughness: 0.25, envMapIntensity: 0.6 }),
        wall: std({ map: flagstoneTex('ice_w', 0x8c9aa8, 0x5e6e7e, 46, [5, 2], 0.14), roughness: 0.4, envMapIntensity: 0.5 }),
        tower: std({ map: flagstoneTex('ice_t', 0x8c9aa8, 0x5e6e7e, 47, [3, 2], 0.14), roughness: 0.4, envMapIntensity: 0.5 }),
        pw: phys({ color: 0xdde9f2, roughness: 0.14, metalness: 0.0, clearcoat: 1.0, envMapIntensity: 0.7 }),
        pb: phys({ color: 0x0c1c48, roughness: 0.14, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.1, envMapIntensity: 1.2 }),
        accW: std({ color: 0x3a6aa0, roughness: 0.4 }), accB: std({ color: 0xbfe8ff, roughness: 0.3 }), gold: std({ color: 0xd8e4f0, roughness: 0.25, metalness: 0.9 }),
        outW: new T.MeshBasicMaterial({ color: 0x2a4a7a, side: T.BackSide }), outB: new T.MeshBasicMaterial({ color: 0xdff2ff, side: T.BackSide })
      }) },
    { id: 'forest', name: 'Enchanted Forest', emoji: '🌲', blurb: 'Birch, moss, jade and fireflies.', music: 'gymnopedie',
      sky: [0x26362c, 0xc2ccb0], env: { sky: '#626a62', horizon: '#dfe2d2', ground: '#2e3628', glow: 'rgba(234,240,220,0.55)' },
      hemi: [0xcfd6c4, 0x2e3628, 0.60], sun: [0xfff2c0, 2.0, 4, 14, 6], torch: 0xffc060, flame: [0xffc050, 0xfff4c0], exposure: 1.1, particles: 'fireflies', roof: 0x4a6a2a, banner: ['#2f5a2a', '#e2c060'],
      hall: { ceiling: () => std({ map: mottleTex('fo_ceil', 0x2a302a, 72, 0.6, [8, 8]), roughness: 1 }), beam: () => std({ map: woodTex('fo_beam', 0x4a3220, 0x1f140b, 73, 6, [4, 0.5]), roughness: 0.8 }), column: () => std({ map: woodTex('fo_col', 0x4a3a26, 0x22180e, 74, 10, [1, 5]), roughness: 0.9 }), window: ['#e6f2c0', '#3a6a48'], frame: 0x5a5a46, candle: 0xffd080, chand: 0xffc070, fire: 0xc8f0a0, fireLight: 0xa8d890, hangers: 'vine', lanterns: true, fog: 0x1a2420, carpet: 0x2f5a2a, plume: 0x2f7a4f, shield: 0x2f5a2a },
      mats: () => ({
        light: std({ map: speckleTex('fo_l', 0xdcd2b8, 0x847660, 51, 0.05, [1, 1]), roughness: 0.55, envMapIntensity: 0.3 }),
        dark: std({ map: mottleTex('fo_d', 0x44563a, 52, 0.35, [1, 1]), roughness: 0.8, envMapIntensity: 0.25 }),
        frame: std({ map: woodTex('fo_f', 0x4a3220, 0x1f140b, 53, 9, [0.4, 0.4]), roughness: 0.6, envMapIntensity: 0.4 }),
        plinth: std({ map: mottleTex('fo_p', 0x5e6058, 54, 0.4, [2, 2]), roughness: 0.95 }),
        floor: std({ map: mottleTex('fo_fl', 0x4a4e40, 55, 0.5, [10, 10]), roughness: 0.98 }),
        wall: std({ map: flagstoneTex('fo_w', 0x7c796e, 0x4c4b42, 56, [5, 2], 0.3), roughness: 0.95 }),
        tower: std({ map: flagstoneTex('fo_t', 0x7c796e, 0x4c4b42, 57, [3, 2], 0.3), roughness: 0.95 }),
        pw: phys({ color: 0xfff1f2, roughness: 0.3, metalness: 0.0, clearcoat: 0.6, envMapIntensity: 0.6 }),
        pb: phys({ color: 0x0f3a24, roughness: 0.22, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.12, envMapIntensity: 1.1 }),
        accW: std({ color: 0x8a4a55, roughness: 0.5 }), accB: std({ color: 0xd8f0d0, roughness: 0.4 }), gold: std({ color: 0xc9a227, roughness: 0.35, metalness: 0.75 }),
        outW: new T.MeshBasicMaterial({ color: 0x3a2a20, side: T.BackSide }), outB: new T.MeshBasicMaterial({ color: 0xeaffe0, side: T.BackSide })
      }) }
  ];
  const THEME_MATS = {};

  // ---------- piece geometry ----------
/* ============================================================================
   Kingdom Quest / chess pieces v3 — three.js r160 CORE ONLY, no addons.
   Drop this inside the existing IIFE in chess/scene.js (it uses the file's `T`).
   REPLACES: PROFILE + GEO + lathe() + knightHead()   (scene.js lines 209-237)
   REPLACES: makePiece()                              (scene.js lines 492-516)
   ============================================================================ */

// ============================ profile DSL ===================================
// node forms, all in piece-local units (board square = 1.0):
//   [x, y]        plain point  -> three's own normal averaging smooths across it
//   [x, y, r]     FILLET this corner with a tangent arc of radius r (3 segments)
//   [x, y, 0]     CRISP shoulder -> two points 4e-4 apart. three.js weights its normal
//                 average by segment LENGTH, so the tiny segment contributes nothing and
//                 both sides get their exact face normal. Measured in r160: a plain 90deg
//                 corner -> (0,-0.514,0.857); epsilon-split -> (0,-1,0) then (0,0,1).
//   ['q', cx,cy, x,y, n]              quadratic bezier run
//   ['c', c1x,c1y, c2x,c2y, x,y, n]   cubic bezier run (the bell ogees)
function bakeProfile(nodes, fseg) {
  fseg = fseg || 3;
  const pts = [], rad = [], push = (x, y, r) => { pts.push([x, y]); rad.push(r === undefined ? -1 : r); };
  for (const n of nodes) {
    const p = pts[pts.length - 1];
    if (n[0] === 'q') { const N = n[5] || 8; for (let i = 1; i <= N; i++) { const t = i / N, u = 1 - t; push(u*u*p[0] + 2*u*t*n[1] + t*t*n[3], u*u*p[1] + 2*u*t*n[2] + t*t*n[4]); } }
    else if (n[0] === 'c') { const N = n[7] || 10; for (let i = 1; i <= N; i++) { const t = i / N, u = 1 - t, a = u*u*u, b = 3*u*u*t, c = 3*u*t*t, d = t*t*t; push(a*p[0] + b*n[1] + c*n[3] + d*n[5], a*p[1] + b*n[2] + c*n[4] + d*n[6]); } }
    else push(n[0], n[1], n[2]);
  }
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const B = pts[i], r = rad[i];
    if (i === 0 || i === pts.length - 1 || r < 0) { out.push(B); continue; }
    const A = pts[i - 1], C = pts[i + 1];
    let d1x = A[0]-B[0], d1y = A[1]-B[1], d2x = C[0]-B[0], d2y = C[1]-B[1];
    const L1 = Math.hypot(d1x, d1y), L2 = Math.hypot(d2x, d2y);
    if (L1 < 1e-9 || L2 < 1e-9) { out.push(B); continue; }
    d1x /= L1; d1y /= L1; d2x /= L2; d2y /= L2;
    if (r === 0) { const e = 4e-4; out.push([B[0] + d1x*e, B[1] + d1y*e], [B[0] + d2x*e, B[1] + d2y*e]); continue; }
    let bx = d1x + d2x, by = d1y + d2y; const bl = Math.hypot(bx, by);
    if (bl < 1e-6) { out.push(B); continue; }   // FIX: collinear -> no arc centre exists
    bx /= bl; by /= bl;
    const cs = Math.max(-0.99995, Math.min(0.99995, d1x*d2x + d1y*d2y)), th = Math.acos(cs), ht = Math.tan(th/2);
    let t = r / ht; const tm = Math.min(L1, L2) * 0.48; if (t > tm) t = tm;
    const rr = t * ht, T1 = [B[0]+d1x*t, B[1]+d1y*t], T2 = [B[0]+d2x*t, B[1]+d2y*t];
    const cx = B[0] + bx * (rr / Math.sin(th/2)), cy = B[1] + by * (rr / Math.sin(th/2));
    const a0 = Math.atan2(T1[1]-cy, T1[0]-cx); let da = Math.atan2(T2[1]-cy, T2[0]-cx) - a0;
    while (da >  Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
    for (let k = 0; k <= fseg; k++) { const a = a0 + da*k/fseg; out.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]); }
  }
  return out;
}

// Staunton bell base with a ROLLED FOOT. R = max foot radius, yS/rS = where the stem starts.
// Bottom-up: flat contact disc -> 0.030 roll -> widest point -> 0.034 roll over the top ->
// 0.052 cove -> ogee bell sweeping in to the stem. The underside recess is deliberately omitted:
// never visible (the AO disc covers it) and it cost ~450 wasted triangles per piece.
const baseNodes = (R, yS, rS) => ([
  [0, 0.000], [R*0.965, 0.000, 0.030], [R*1.00, 0.050, 0.042], [R*0.935, 0.098, 0.034],
  [R*0.76, 0.146, 0.052], [R*0.60, 0.182, 0.040],
  ['c', R*0.44, 0.224, rS*1.62, yS - 0.11, rS*1.10, yS - 0.030, 6], [rS, yS, 0.016]
]);
// The two-bead COLLAR under every head: out to rC, crisp shoulder, back in, second bead, in to rN.
const collar = (rS, rC, rN, y) => ([
  [rS*1.02, y - 0.055, 0.015], [rC, y - 0.026, 0.013], [rC*0.995, y - 0.004, 0],
  [rC*0.90, y + 0.016, 0.012], [rC*0.97, y + 0.040, 0.013], [rN, y + 0.076, 0.020]
]);
const arc = (cx, cy, r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1-a0)*i/n; o.push([Math.max(0, cx + Math.cos(a)*r), cy + Math.sin(a)*r]); } return o; };

const PROFILE_SRC = {
  p: baseNodes(0.300, 0.300, 0.112).concat(                    // 59 baked pts, h 0.966
      [['c', 0.104, 0.380, 0.090, 0.450, 0.086, 0.512, 5]],    // tapered stem (slight ogee)
      collar(0.086, 0.140, 0.092, 0.575),
      [[0.090, 0.664, 0.028]], arc(0, 0.808, 0.158, -Math.PI*0.50, Math.PI*0.5, 8)),
  r: baseNodes(0.355, 0.262, 0.222).concat(                    // 68 pts, h 1.196
      [['c', 0.218, 0.420, 0.208, 0.600, 0.206, 0.726, 5]],
      collar(0.206, 0.262, 0.216, 0.800),
      [[0.238, 0.930, 0.038], [0.300, 0.982, 0.024], [0.316, 1.012, 0.018], [0.314, 1.060, 0],
       [0.236, 1.060, 0.013], [0.230, 1.018, 0.028], [0.150, 0.980, 0.020], [0, 0.976]]),  // rim + well
  n: baseNodes(0.345, 0.268, 0.214).concat(                    // 48 pts, h 0.650 (head takes over)
      [['c', 0.208, 0.360, 0.196, 0.450, 0.196, 0.508, 5]],
      collar(0.196, 0.252, 0.206, 0.572), [[0.204, 0.650, 0], [0, 0.650]]),
  b: baseNodes(0.340, 0.276, 0.150).concat(                    // 75 pts, h 1.398
      [['c', 0.142, 0.360, 0.128, 0.470, 0.126, 0.556, 5]],
      collar(0.126, 0.186, 0.134, 0.622),
      [['c', 0.168, 0.742, 0.208, 0.814, 0.212, 0.908, 6],     // mitre: shoulder
       ['c', 0.216, 1.012, 0.188, 1.106, 0.128, 1.198, 6],     //        taper
       ['c', 0.100, 1.242, 0.072, 1.262, 0.052, 1.272, 4], [0.042, 1.280, 0.014], [0.033, 1.298, 0.010]],
      arc(0, 1.346, 0.052, -Math.PI*0.42, Math.PI*0.5, 5)),    // finial
  q: baseNodes(0.365, 0.290, 0.166).concat(                    // 86 pts, h 1.560
      [['c', 0.158, 0.390, 0.146, 0.520, 0.146, 0.616, 5]],
      collar(0.146, 0.206, 0.154, 0.686),
      [['c', 0.196, 0.840, 0.252, 0.960, 0.286, 1.086, 6],
       [0.300, 1.140, 0.020], [0.322, 1.196, 0.016], [0.320, 1.232, 0],   // coronet rim (points sit here)
       [0.246, 1.244, 0.015], [0.232, 1.222, 0.022], [0.170, 1.276, 0.024],
       [0.122, 1.336, 0.018], [0.148, 1.374, 0.015], [0.104, 1.416, 0.018]],
      arc(0, 1.478, 0.082, -Math.PI*0.46, Math.PI*0.5, 6)),
  k: baseNodes(0.375, 0.296, 0.176).concat(                    // 86 pts, h 1.554 + cross = 1.873
      [['c', 0.168, 0.400, 0.156, 0.540, 0.156, 0.646, 5]],
      collar(0.156, 0.216, 0.164, 0.716),
      [['c', 0.206, 0.880, 0.262, 1.010, 0.292, 1.140, 6],
       [0.306, 1.200, 0.020], [0.330, 1.262, 0.016], [0.328, 1.302, 0],   // crown band (teeth sit here)
       [0.252, 1.314, 0.015], [0.240, 1.292, 0.024],
       ['c', 0.232, 1.386, 0.170, 1.436, 0.084, 1.462, 6], [0.060, 1.470, 0.018],
       [0.056, 1.498, 0.013], [0.086, 1.512, 0.013], [0.082, 1.546, 0.015], [0, 1.554]])
};
// Radial segments are NOT all the same. At 14 units with fov 52 (~51 px/unit) the silhouette
// error of a 0.30 radius at 20 segments is 0.30*(1-cos 9deg) = 0.0037 units = 0.19 px. Invisible.
// 56 was pure waste; the savings pay for the fillets.
const SEGS = { p: 20, r: 24, n: 22, b: 26, q: 28, k: 28 };

// ============================ lathe helpers =================================
function finishLathe(geo, prof, segs) {
  const n = geo.attributes.normal.array;   // r160 DOES push the last ring un-normalised (verified: len 0.0224 for a 0.0224 segment)
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i+1], n[i+2]) || 1; n[i]/=l; n[i+1]/=l; n[i+2]/=l; }
  const P = prof.length, cum = new Float32Array(P); let tot = 0;
  for (let j = 1; j < P; j++) { tot += Math.hypot(prof[j][0]-prof[j-1][0], prof[j][1]-prof[j-1][1]); cum[j] = tot; }
  if (!tot) return geo;                                   // FIX
  const uv = geo.attributes.uv.array;      // Lathe sets uv.y by INDEX -> grain bunches at every fillet
  for (let i = 0; i <= segs; i++) for (let j = 0; j < P; j++) uv[(i*P + j)*2 + 1] = cum[j] / tot;
  geo.attributes.uv.needsUpdate = true; return geo;
}
function latheOf(type) {
  const prof = bakeProfile(PROFILE_SRC[type], 2), segs = SEGS[type];
  return { geo: finishLathe(new T.LatheGeometry(prof.map(p => new T.Vector2(p[0], p[1])), segs), prof, segs), prof, segs };
}

// ============================ merge + transform =============================
function xf(geo, o) {
  const m = new T.Matrix4(), e = new T.Euler(o.rx||0, o.ry||0, o.rz||0);
  m.compose(new T.Vector3(o.x||0, o.y||0, o.z||0), new T.Quaternion().setFromEuler(e),
            new T.Vector3(o.sx||o.s||1, o.sy||o.s||1, o.sz||o.s||1));
  return geo.applyMatrix4(m);
}
// BufferGeometryUtils is an addon, so: 20 lines of core. All inputs need position+normal+uv.
function mergeGeos(list) {
  let vc = 0, ic = 0;
  for (const g of list) { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(vc*3), nor = new Float32Array(vc*3), uv = new Float32Array(vc*2),
        idx = vc > 65535 ? new Uint32Array(ic) : new Uint16Array(ic);
  let vo = 0, io = 0;
  for (const g of list) {
    const p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv, c = p.count;
    pos.set(p.array, vo*3); if (nn) nor.set(nn.array, vo*3); if (u) uv.set(u.array, vo*2);
    if (g.index) { const gi = g.index.array; for (let i = 0; i < gi.length; i++) idx[io+i] = gi[i] + vo; io += gi.length; }
    else { for (let i = 0; i < c; i++) idx[io+i] = vo + i; io += c; }
    vo += c;
  }
  const o = new T.BufferGeometry();
  o.setAttribute('position', new T.BufferAttribute(pos, 3));
  o.setAttribute('normal',   new T.BufferAttribute(nor, 3));
  o.setAttribute('uv',       new T.BufferAttribute(uv, 2));
  o.setIndex(new T.BufferAttribute(idx, 1)); return o;
}
// Non-indexed soup with TRUE per-face normals. This is how faceted parts (merlons, coronet,
// groove) share ONE material with the smooth lathe: bake flatness into the geometry rather
// than setting material.flatShading, which would wreck the lathe.
function vmapOf(prof) {
  const P = prof.length, cum = new Float32Array(P); let tot = 0;
  for (let j = 1; j < P; j++) { tot += Math.hypot(prof[j][0]-prof[j-1][0], prof[j][1]-prof[j-1][1]); cum[j] = tot; }
  return y => { let v = 0;
    for (let j = 1; j < P; j++) { const a = prof[j-1][1], b = prof[j][1];
      if (y >= Math.min(a,b) && y <= Math.max(a,b) && Math.abs(b-a) > 1e-9) v = cum[j-1] + (cum[j]-cum[j-1])*(y-a)/(b-a); }
    return tot ? v/tot : 0; };
}
function soup(tris, vmap) {
  const n = tris.length, pos = new Float32Array(n*9), nor = new Float32Array(n*9), uv = new Float32Array(n*6);
  const A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3(), ab = new T.Vector3(), ac = new T.Vector3(), nm = new T.Vector3();
  const u3 = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const t = tris[i]; A.fromArray(t[0]); B.fromArray(t[1]); C.fromArray(t[2]);
    ab.subVectors(B, A); ac.subVectors(C, A); nm.crossVectors(ab, ac).normalize();
    for (let k = 0; k < 3; k++) u3[k] = Math.atan2(t[k][0], t[k][2])/(2*Math.PI) + 0.5;
    const um = Math.min(u3[0], u3[1], u3[2]);
    for (let k = 0; k < 3; k++) if (u3[k] - um > 0.5) u3[k] -= 1;    // FIX: seam unwrap
    for (let k = 0; k < 3; k++) {
      pos[i*9 + k*3] = t[k][0]; pos[i*9 + k*3 + 1] = t[k][1]; pos[i*9 + k*3 + 2] = t[k][2];
      nor[i*9 + k*3] = nm.x;    nor[i*9 + k*3 + 1] = nm.y;    nor[i*9 + k*3 + 2] = nm.z;
      uv[i*6 + k*2] = u3[k];
      uv[i*6 + k*2 + 1] = vmap ? vmap(t[k][1]) : t[k][1]/2.0;        // FIX: arc-length v
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setAttribute('normal',   new T.BufferAttribute(nor, 3));
  g.setAttribute('uv',       new T.BufferAttribute(uv, 2)); return g;
}
const quad = (a, b, c, d) => [[a, b, c], [a, c, d]];

// ================ crenellations / coronet / carved groove ===================
// n merlons on a ring. fill = fraction of each slot filled (the rest is the crenel gap).
// Verified signed volume 0.0693 > 0 -> consistent outward winding, watertight for shadows.
function crenelRing(n, r0, r1, y0, y1, fill, cham, lean) {
  lean = lean || 0; const tris = [], AS = 2;
  const P = (r, a, y) => [Math.sin(a)*r, y, Math.cos(a)*r];
  for (let m = 0; m < n; m++) {
    const c = m/n*Math.PI*2, hw = (Math.PI/n)*fill, a0 = c - hw, a1 = c + hw;
    const ca = cham/((r0+r1)/2), yc = y1 - cham;
    const i1 = r1 + (y1-y0)*lean;                                         // outward lean of the tip
    for (let s = 0; s < AS; s++) {
      const b0 = a0 + (a1-a0)*s/AS, b1 = a0 + (a1-a0)*(s+1)/AS;
      const c0 = a0 + ca + (a1-a0-2*ca)*s/AS, c1 = a0 + ca + (a1-a0-2*ca)*(s+1)/AS;
      tris.push(...quad(P(r1,b0,y0), P(r1,b1,y0), P(r1,b1,yc), P(r1,b0,yc)));                       // outer
      tris.push(...quad(P(r0,b1,y0), P(r0,b0,y0), P(r0,b0,yc), P(r0,b1,yc)));                       // inner
      tris.push(...quad(P(r1,b0,yc), P(r1,b1,yc), P(i1-cham,c1,y1), P(i1-cham,c0,y1)));             // outer chamfer
      tris.push(...quad(P(r0,b1,yc), P(r0,b0,yc), P(r0+cham,c0,y1), P(r0+cham,c1,y1)));             // inner chamfer
      tris.push(...quad(P(r0+cham,c0,y1), P(i1-cham,c0,y1), P(i1-cham,c1,y1), P(r0+cham,c1,y1)));   // top
      tris.push(...quad(P(r0,b0,y0), P(r1,b0,y0), P(r1,b1,y0), P(r0,b1,y0)));                       // bottom
    }
    for (const a of [a0, a1]) {                                            // the two cut cheeks
      const s = a === a0 ? 1 : -1, ac = a + s*ca;
      tris.push(...quad(P(r0,a,y0), P(r1,a,y0), P(r1,a,yc), P(r0,a,yc)).map(t => s > 0 ? t : [t[0], t[2], t[1]]));
      tris.push(...quad(P(r0,a,yc), P(r1,a,yc), P(i1-cham,ac,y1), P(r0+cham,ac,y1)).map(t => s > 0 ? t : [t[0], t[2], t[1]]));
    }
  }
  return soup(tris);
}
// Pointed coronet teeth: same idea, but the tip converges to a short ridge.
function coronetPoints(n, r0, r1, y0, y1, fill, lean) {
  const tris = [], P = (r, a, y) => [Math.sin(a)*r, y, Math.cos(a)*r];
  for (let m = 0; m < n; m++) {
    const c = m/n*Math.PI*2, hw = (Math.PI/n)*fill, a0 = c - hw, a1 = c + hw;
    const rt0 = r0 + (r1-r0)*0.42 + lean, rt1 = r1 + lean, yt = y1, hw2 = hw*0.14;
    const t0 = c - hw2, t1 = c + hw2;
    tris.push(...quad(P(r1,a0,y0), P(r1,a1,y0), P(rt1,t1,yt), P(rt1,t0,yt)));   // outer face
    tris.push(...quad(P(r0,a1,y0), P(r0,a0,y0), P(rt0,t0,yt), P(rt0,t1,yt)));   // inner face
    tris.push(...quad(P(rt0,t0,yt), P(rt1,t0,yt), P(rt1,t1,yt), P(rt0,t1,yt))); // tip ridge
    tris.push(...quad(P(r0,a0,y0), P(r1,a0,y0), P(rt1,t0,yt), P(rt0,t0,yt)));   // cheek
    tris.push(...quad(P(r1,a1,y0), P(r0,a1,y0), P(rt0,t1,yt), P(rt1,t1,yt)));   // cheek
    tris.push(...quad(P(r0,a0,y0), P(r0,a1,y0), P(r1,a1,y0), P(r1,a0,y0)));     // bottom
  }
  return soup(tris);
}
// A groove CUT INTO a lathe surface (the bishop's mitre slot). An inset extruded blade - what
// the file does today - pokes out of the mitre near the top. This puts the lips EXACTLY on the
// surface and pushes the floor along -normal, so it follows the curvature at every azimuth.
// Measured max protrusion beyond the mitre surface: 0.00000 units.
function surfaceGroove(prof, i0, i1, th0, th1, halfTh, depth, n, segs, vmap) {
  const tris = [], sag = 1 - Math.cos(Math.PI / (segs || 24));
  const at = u => {
    const x = i0 + (i1-i0)*u, i = Math.max(0, Math.min(prof.length-2, Math.floor(x))), t = x - i;
    const r = prof[i][0] + (prof[i+1][0]-prof[i][0])*t, y = prof[i][1] + (prof[i+1][1]-prof[i][1])*t;
    let dr = prof[i+1][0]-prof[i][0], dy = prof[i+1][1]-prof[i][1]; const L = Math.hypot(dr, dy) || 1; dr /= L; dy /= L;
    return { r, y, nr: dy, ny: -dr };                       // outward normal in the (radial, y) plane
  };
  const P = (o, th, d) => [Math.sin(th)*(o.r - o.nr*d), o.y - o.ny*d, Math.cos(th)*(o.r - o.nr*d)];
  let prev = null;
  for (let k = 0; k <= n; k++) {
    const u = k/n, o = at(u), th = th0 + (th1-th0)*u;
    const lip = -(o.r*sag*1.35 + 1e-4);                     // FIX: negative d = OUTWARD of the chord
    const cur = { L: P(o, th - halfTh, lip), R: P(o, th + halfTh, lip), F: P(o, th, depth) };
    if (prev) { tris.push(...quad(prev.F, cur.F, cur.L, prev.L));   // FIX: reversed
                tris.push(...quad(prev.R, cur.R, cur.F, prev.F)); } // FIX: reversed
    else tris.push([cur.R, cur.F, cur.L]);                          // FIX: reversed
    if (k === n) tris.push([cur.L, cur.F, cur.R]);                  // FIX: reversed
    prev = cur;
  }
  return soup(tris, vmap);
}

// ============================ the knight ====================================
// Ring nodes: [y, z, angDeg, wBack, wFront, back, front].
// Ring plane normal N = (0, cos a, sin a); in-plane V = (0, -sin a, cos a).
// +V is ALWAYS the throat/jaw/lip side, -V ALWAYS the crest/forehead/nose-bridge side, at every
// station. That is what makes the table readable: `back` is neck-depth low down and skull-height
// up top; `front` is throat low down and jaw up top.
function loft(nodes, S, e, opt) {
  opt = opt || {}; const R = nodes.length, W = S + 1;
  const pos = new Float32Array(R*W*3), uv = new Float32Array(R*W*2), idx = [];
  for (let i = 0; i < R; i++) {
    const [y, z, ad, wB, wF, b, f] = nodes[i], a = ad*Math.PI/180, sv = -Math.sin(a), cv = Math.cos(a);
    for (let k = 0; k <= S; k++) {
      const t = k/S*Math.PI*2, ct = Math.cos(t), st = Math.sin(t);
      const w = wB + (wF-wB)*(0.5 + 0.5*st), r = st >= 0 ? f : b;
      const X = w*Math.sign(ct)*Math.pow(Math.abs(ct), e);
      const V = r*Math.sign(st)*Math.pow(Math.abs(st), e);
      const o = (i*W + k)*3; pos[o] = X; pos[o+1] = y + V*sv; pos[o+2] = z + V*cv;
      uv[(i*W + k)*2] = k/S; uv[(i*W + k)*2 + 1] = i/(R-1);
    }
  }
  for (let i = 0; i < R-1; i++) for (let k = 0; k < S; k++) {
    const a = i*W + k, b2 = a + W; idx.push(a, b2, a+1, a+1, b2, b2+1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
  g.setIndex(idx); g.userData = { R, S, W };
  if (opt.capA || opt.capB) {
    const extra = [], cp = [], cu = [];
    const cap = (ring, flip) => {
      const [y, z] = nodes[ring], v = ring/(R-1);
      for (let k = 0; k < S; k++) {                         // FIX: one centre per fan triangle
        const ci = R*W + cp.length/3; cp.push(0, y, z); cu.push((k + 0.5)/S, v);
        const a = ring*W + k;
        if (flip) extra.push(ci, a+1, a); else extra.push(ci, a, a+1);
      }
    };
    if (opt.capA) cap(0, true); if (opt.capB) cap(R-1, false);
    const np = new Float32Array(pos.length + cp.length), nu = new Float32Array(uv.length + cu.length);
    np.set(pos); np.set(cp, pos.length); nu.set(uv); nu.set(cu, uv.length);
    g.setAttribute('position', new T.BufferAttribute(np, 3));
    g.setAttribute('uv', new T.BufferAttribute(nu, 2));
    g.setIndex(idx.concat(extra));
  }
  return g;
}
function dent(geo, c, r, depth) {           // ellipsoidal carve; pulls vertices toward c
  const p = geo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const dx = (p[i]-c[0])/r[0], dy = (p[i+1]-c[1])/r[1], dz = (p[i+2]-c[2])/r[2], d = dx*dx + dy*dy + dz*dz;
    if (d >= 1) continue; const k = depth*(1-d)*(1-d);
    p[i] += (c[0]-p[i])*k; p[i+1] += (c[1]-p[i+1])*k; p[i+2] += (c[2]-p[i+2])*k;
  }
  return geo;
}
// The loft duplicates the u-seam vertex so UVs are right; computeVertexNormals then gives the two
// copies different normals and you get a crease down the horse's back. Average them.
function sealSeam(geo) {
  const u = geo.userData; if (!u) return geo; const n = geo.attributes.normal.array;
  for (let i = 0; i < u.R; i++) {
    const a = (i*u.W)*3, b = (i*u.W + u.S)*3;
    const x = n[a]+n[b], y = n[a+1]+n[b+1], z = n[a+2]+n[b+2], l = Math.hypot(x,y,z) || 1;
    n[a] = n[b] = x/l; n[a+1] = n[b+1] = y/l; n[a+2] = n[b+2] = z/l;
  }
  return geo;
}
const HEAD = [
  [0.500, -0.030,   3, 0.205, 0.196, 0.188, 0.150],   // buried inside the collar
  [0.630, -0.026,   7, 0.190, 0.180, 0.190, 0.132],   // neck: deep crest, LEAN throat
  [0.760, -0.012,  12, 0.176, 0.168, 0.196, 0.120],
  [0.880,  0.014,  19, 0.164, 0.160, 0.200, 0.116],
  [0.986,  0.052,  28, 0.152, 0.158, 0.198, 0.120],
  [1.072,  0.098,  40, 0.146, 0.158, 0.180, 0.136],   // jowl starts
  [1.138,  0.152,  54, 0.140, 0.154, 0.152, 0.150],   // cheek / jaw mass
  [1.180,  0.212,  68, 0.124, 0.142, 0.118, 0.152],   // brow
  [1.194,  0.272,  81, 0.104, 0.120, 0.090, 0.140],
  [1.180,  0.328,  92, 0.088, 0.100, 0.072, 0.120],   // nose bridge
  [1.148,  0.376, 101, 0.080, 0.088, 0.062, 0.100],
  [1.100,  0.412, 110, 0.076, 0.080, 0.055, 0.082],   // muzzle narrows
  [1.044,  0.434, 120, 0.070, 0.070, 0.048, 0.062],
  [0.990,  0.440, 132, 0.058, 0.056, 0.040, 0.042],   // nose / lip
  [0.952,  0.428, 148, 0.038, 0.036, 0.026, 0.024]    // chin tucks back
];
function knightHead3D() {
  const S = 16, head = loft(HEAD, S, 0.78, { capA: true, capB: true });
  dent(head, [ 0.106, 1.190, 0.248], [0.070, 0.060, 0.068], 0.42);   // eye sockets
  dent(head, [-0.106, 1.190, 0.248], [0.070, 0.060, 0.068], 0.42);
  dent(head, [ 0.148, 1.106, 0.180], [0.090, 0.092, 0.090], 0.17);   // cheek hollow above the jaw
  dent(head, [-0.148, 1.106, 0.180], [0.090, 0.092, 0.090], 0.17);
  dent(head, [ 0.048, 1.016, 0.446], [0.034, 0.038, 0.034], 0.46);   // nostrils
  dent(head, [-0.048, 1.016, 0.446], [0.034, 0.038, 0.034], 0.46);
  dent(head, [ 0.000, 0.978, 0.450], [0.086, 0.022, 0.046], 0.28);   // mouth crease
  head.computeVertexNormals(); sealSeam(head);
  // MANE: resampled off the same spine, so it can never detach from the neck. 4 carved locks.
  const lerpN = t => { const x = t*(HEAD.length-1), i = Math.min(HEAD.length-2, Math.floor(x)), u = x-i;
    return HEAD[i].map((v, k) => v + (HEAD[i+1][k]-v)*u); };
  const M = 17, mane = [];
  for (let s = 0; s < M; s++) {
    const t = 0.10 + (0.600-0.10)*s/(M-1), n = lerpN(t), a = n[2]*Math.PI/180, sv = -Math.sin(a), cv = Math.cos(a);
    const cy = n[0] - n[5]*sv, cz = n[1] - n[5]*cv;                  // that ring's crest point
    const u = (s/(M-1))*4 % 1, lock = 0.55 + 0.45*Math.pow(Math.sin(Math.PI*u), 0.55);
    const env = Math.sin(Math.PI*Math.pow(s/(M-1), 0.85));
    mane.push([cy, cz, n[2], 0.038 + 0.015*env, 0.042 + 0.015*env, 0.024 + 0.108*env*lock, 0.070]);
  }
  const maneG = loft(mane, 8, 0.72, { capA: true, capB: true }); maneG.computeVertexNormals(); sealSeam(maneG);
  const earN = [[0, 0, 0, 0.044, 0.038, 0.030, 0.026], [0.052, 0.004, 0, 0.040, 0.034, 0.030, 0.022],
                [0.116, 0.010, 0, 0.026, 0.022, 0.022, 0.014], [0.150, 0.012, 0, 0.006, 0.006, 0.006, 0.004]];
  const ear = () => { const g = loft(earN, 6, 0.85, { capA: true }); g.computeVertexNormals(); sealSeam(g); return g; };
  const eL = xf(ear(), { x: -0.080, y: 1.196, z: 0.152, rz:  0.30, rx: -0.24 });
  const eR = xf(ear(), { x:  0.080, y: 1.196, z: 0.152, rz: -0.30, rx: -0.24 });
  return mergeGeos([head, maneG, eL, eR]);   // 836 tris total (the old flat slab was 1836)
}

// ================= contact shadow / AO disc =================================
// Why this is needed: the scene has 8+ lights but ONLY the sun casts shadows. hemi + ambient +
// fill point + stage spot + 2 rim directionals + torches all wash the contact region flat, which
// is exactly why the pieces look like they hover. This is the AMBIENT term, so it is a centred
// circle (isotropic) - the sun's directional shadow is already handled by the shadow map.
// Falloff: t = r/Rout;  f = clamp((1-t)/0.58, 0, 1);  alpha = 0.60 * f*f*(3-2*f)
//   t 0.00 -> 0.600   (under the foot)
//   t 0.50 -> 0.569
//   t 0.69 -> 0.331   (at the base radius)
//   t 0.83 -> 0.124   (1.2x the base radius)
//   t 1.00 -> 0.000
// C1-continuous (smoothstep), so no banding rings.
function aoTexture(px) {
  px = px || 128;
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), h = px/2, gr = g.createRadialGradient(h, h, 0, h, h, h);
  for (let i = 0; i <= 16; i++) {
    const t = i/16, f = Math.max(0, Math.min(1, (1-t)/0.58)), s = f*f*(3-2*f);
    gr.addColorStop(t, 'rgba(16,11,8,' + (0.60*s).toFixed(4) + ')');   // warm-dark, not pure black
  }
  g.fillStyle = gr; g.fillRect(0, 0, px, px);
  const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; return tx;
}
let AO_TEX = null, AO_GEO = null;
function contactShadow(baseR) {
  if (!AO_TEX) { AO_TEX = aoTexture(128); AO_GEO = new T.PlaneGeometry(1, 1); }   // shared by all 32
  const size = Math.min(0.99, baseR*2.90);           // <=0.99 so it never crosses into a neighbour
  const m = new T.Mesh(AO_GEO, new T.MeshBasicMaterial({ map: AO_TEX, transparent: true,
    depthWrite: false, toneMapped: false, color: 0xffffff, opacity: 1 }));
  // toneMapped:false matters - with ACESFilmic + exposure 1.02-1.20 a tone-mapped overlay shifts colour.
  m.rotation.x = -Math.PI/2; m.position.y = 0.006; m.scale.set(size, size, 1);
  m.renderOrder = -1;                                 // draw before the move markers at y 0.075
  m.castShadow = m.receiveShadow = false;
  m.raycast = function () {};                         // never pickable
  m.userData.role = 'shadow'; m.userData.size = size; return m;
}
// Call once per frame per piece. groundY = the surface it stands on (0 = board, -0.35 = graveyard plinth).
function updateContactShadow(g) {
  const s = g.userData.ao; if (!s) return;
  const ground = g.userData.groundY || 0, lift = Math.max(0, g.position.y - ground);
  const gs = Math.max(1e-3, g.scale.y || 1);          // FIX: undo the parent group's scale
  const k = 1/(1 + lift*2.2), sz = s.userData.size*Math.min(1.16, 1 + lift*0.40);
  s.position.y = (ground + 0.006 - g.position.y) / gs;
  s.scale.set(sz, sz, 1);                             // world size still tracks the piece, which is right
  s.material.opacity = k*Math.max(0, Math.min(1, g.scale.x/0.72));
}

// ============================ assembled pieces ==============================
const PIECE_CACHE = {};
function pieceGeo(type) {
  if (PIECE_CACHE[type]) return PIECE_CACHE[type];
  const L = latheOf(type), vm = vmapOf(L.prof), body = [L.geo], accent = [], gold = [];
  if (type === 'r') body.push(crenelRing(8, 0.232, 0.318, 1.044, 1.196, 0.56, 0.022, 0.0, vm));
  else if (type === 'q') {
    body.push(coronetPoints(9, 0.246, 0.322, 1.226, 1.398, 0.58, 0.014, vm));
    gold.push(new T.TorusGeometry(0.312, 0.019, 5, 24).rotateX(Math.PI/2).translate(0, 1.176, 0));
  } else if (type === 'k') {
    body.push(crenelRing(8, 0.254, 0.330, 1.296, 1.386, 0.50, 0.016, 0.06, vm));
    const cs = new T.Shape(), a = 0.030, u = 0.115, d = 0.150, w = 0.098;          // Latin cross
    cs.moveTo(-a, -d); cs.lineTo(a, -d); cs.lineTo(a, u-2*a); cs.lineTo(w, u-2*a); cs.lineTo(w, u);
    cs.lineTo(a, u); cs.lineTo(a, u+2.1*a); cs.lineTo(-a, u+2.1*a); cs.lineTo(-a, u);
    cs.lineTo(-w, u); cs.lineTo(-w, u-2*a); cs.lineTo(-a, u-2*a); cs.closePath();
    gold.push(xf(new T.ExtrudeGeometry(cs, { depth: 0.056, bevelEnabled: true, bevelThickness: 0.013,
      bevelSize: 0.013, bevelSegments: 2, curveSegments: 1 }), { y: 1.682, z: -0.028 }));
  } else if (type === 'b') {
    const iM = L.prof.findIndex(p => p[1] > 0.760), iT = L.prof.findIndex(p => p[1] > 1.170);
    body.push(surfaceGroove(L.prof, iM, iT, -0.40, 0.40, 0.105, 0.030, 14, L.segs, vm));  // FIX: body, not accent
  } else if (type === 'n') {
    body.push(knightHead3D());
    const eye = r => new T.SphereGeometry(r, 8, 6);
    accent.push(xf(eye(0.029), { x:  0.0955, y: 1.1885, z: 0.2505 }),
                xf(eye(0.029), { x: -0.0955, y: 1.1885, z: 0.2505 }));
  }
  let baseR = 0; for (const p of L.prof) if (p[1] < 0.26 && p[0] > baseR) baseR = p[0];   // FIX: derived
  return (PIECE_CACHE[type] = {
    body:   mergeGeos(body),
    accent: accent.length ? mergeGeos(accent) : null,
    gold:   gold.length   ? mergeGeos(gold)   : null,
    baseR: baseR
  });
}

// =================== drop-in replacement for makePiece() ====================
// Preserves everything the rest of scene.js relies on:
//   children[0] is the body mesh   (setHover() at scene.js:769-771 pokes children[0].material)
//   userData.role on every child   (applyPieceMaterials() at scene.js:484-492)
//   userData.group + pieceMeshes   (pick() at scene.js:713-716)
// role 'shadow' falls through every branch of applyPieceMaterials untouched. Verified.
  const geoBox = (w, h, d) => new T.BoxGeometry(w, h, d);
  const geoSphere = r => new T.SphereGeometry(r, 18, 14);
  function roundedRect(w, h, r) { const s = new T.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; }

  window.CastleScene = { create, THEMES: THEMES.map(t => ({ id: t.id, name: t.name, emoji: t.emoji, blurb: t.blurb, music: t.music })) };

  function create(container, cb) {
    cb = cb || {};
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const cv = renderer.domElement; cv.style.display = 'block'; cv.style.width = '100%'; cv.style.height = '100%'; cv.style.touchAction = 'none';
    container.appendChild(cv);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(46, 1, 0.1, 300);
    const orbit = { theta: 0.35, phi: 1.1, radius: 15.5, tTheta: 0, tPhi: 0.83, tRadius: 14.0, target: new T.Vector3(0, 0.7, 0), tTargetY: 0.7 };
    const pmrem = new T.PMREMGenerator(renderer);

    // ---------- lights ----------
    const rig = makeRig(scene, renderer, { center: new T.Vector3(0, 0.2, 0), radius: 7.0 });
    const hemi = rig.hemi, sun = rig.key;   // aliases so the rest of the file still compiles
    const torchLights = [];

    // ---------- sky ----------
    const skyMat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false,
      uniforms: { top: { value: new T.Color(0x243a7a) }, horizon: { value: new T.Color(0xf2a860) } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vW;\nvoid main(){\n float h = normalize(vW).y; float t = clamp(h * 1.3 + 0.05, 0.0, 1.0);\n gl_FragColor = vec4(mix(horizon, top, pow(t, 0.75)), 1.0);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}'
    });
    scene.add(new T.Mesh(new T.SphereGeometry(120, 32, 16), skyMat));

    // ---------- board ----------
    const R = { light: [], dark: [], walls: [], towers: [], roofs: [], banners: [], flags: [], flames: [], cores: [] };
    const root = new T.Group(); scene.add(root);
    const squares = {}, squareMeshes = [];
    const placeholder = std({ color: 0x888888 });
    (function buildBoard() {
      for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
        const alg = FILES[f] + (r + 1), m = new T.Mesh(boardSquareGeo(f, r, { mode: 'flow' }), placeholder);
        m.position.set(f - 3.5, -0.06, 3.5 - r); m.receiveShadow = true; m.userData.sq = alg;
        root.add(m); squares[alg] = m; squareMeshes.push(m); (((f + r) & 1) ? R.light : R.dark).push(m);
      }
      const seam = new T.Mesh(geoBox(8.1, 0.06, 8.1), std({ color: 0x141010, roughness: 0.9 })); seam.position.y = -0.09; root.add(seam);
      const shape = roundedRect(9.9, 9.9, 0.38);
      const hp = new T.Path(); hp.moveTo(-4.03, -4.03); hp.lineTo(4.03, -4.03); hp.lineTo(4.03, 4.03); hp.lineTo(-4.03, 4.03); hp.closePath(); shape.holes.push(hp);
      const fg = new T.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 12 });
      R.frame = new T.Mesh(fg, placeholder); R.frame.rotation.x = -Math.PI / 2; R.frame.position.y = -0.34; R.frame.castShadow = true; R.frame.receiveShadow = true; root.add(R.frame);
      const under = new T.Mesh(geoBox(8.2, 0.2, 8.2), std({ color: 0x2a201a })); under.position.y = -0.22; root.add(under);
      R.plinth = new T.Mesh(geoBox(11.8, 0.9, 11.8), placeholder); R.plinth.position.y = -0.8; R.plinth.receiveShadow = true; R.plinth.castShadow = true; root.add(R.plinth);
      R.step = new T.Mesh(geoBox(13.4, 0.4, 13.4), placeholder); R.step.position.y = -1.3; R.step.receiveShadow = true; root.add(R.step);
      const buildLabels = () => {
        const pg = new T.PlaneGeometry(0.5, 0.5);
        const mk = (text, x, z, flip) => { const m = new T.Mesh(pg, new T.MeshBasicMaterial({ map: labelTexture(text, '#e6c76a'), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; if (flip) m.rotation.z = Math.PI; m.position.set(x, 0.015, z); root.add(m); };
        for (let f = 0; f < 8; f++) { mk(FILES[f], f - 3.5, 4.45, false); mk(FILES[f], f - 3.5, -4.45, true); }
        for (let r = 0; r < 8; r++) { mk(String(r + 1), -4.45, 3.5 - r, false); mk(String(r + 1), 4.45, 3.5 - r, true); }
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildLabels); else buildLabels();
    })();

    // ---------- the great hall ----------
    function archShape(w, h) { const r = w / 2, sh = new T.Shape(); sh.moveTo(-r, 0); sh.lineTo(-r, h - r); sh.absarc(0, h - r, r, Math.PI, 0, true); sh.lineTo(r, 0); sh.closePath(); return sh; }
    function windowTexture(glow, glow2) {
      const c = canvas(128, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, glow2); gr.addColorStop(0.5, glow); gr.addColorStop(1, glow2); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(60, 0, 8, 256); for (let y = 40; y < 256; y += 54) g.fillRect(0, y, 128, 7);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(64, 40, 26, 0, Math.PI * 2); g.fill();
      return tex(c);
    }
    function spineTexture(colors) {
      const c = canvas(256, 128), g = c.getContext('2d'); g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 256, 128);
      let x = 4; while (x < 250) { const w = 10 + Math.random() * 14, h = 90 + Math.random() * 30; g.fillStyle = colors[Math.floor(Math.random() * colors.length)]; g.fillRect(x, 128 - h, w - 2, h); g.fillStyle = 'rgba(255,220,120,0.5)'; g.fillRect(x + 2, 128 - h + 8, w - 6, 3); x += w; }
      return tex(c, [1, 1]);
    }
    const H = { windows: [], frames: [], columns: [], beams: [], hangers: [], candles: [], chandLights: [], fire: [], lanterns: [], shelves: [], armor: [], throne: [] };
    (function buildHall() {
      const D = 14, WH = 12, iron = std({ color: 0x2a2724, roughness: 0.6, metalness: 0.5 }), metal = std({ color: 0x9aa0a8, roughness: 0.32, metalness: 0.9, envMapIntensity: 1.2 });
      R.floor = new T.Mesh(new T.PlaneGeometry(2 * D + 2, 2 * D + 2, 30, 30), placeholder); R.floor.rotation.x = -Math.PI / 2; R.floor.position.y = -1.5; R.floor.receiveShadow = true; scene.add(R.floor);
      R.ceiling = new T.Mesh(new T.PlaneGeometry(2 * D + 2, 2 * D + 2, 16, 16), placeholder); R.ceiling.rotation.x = Math.PI / 2; R.ceiling.position.y = WH - 1.5; scene.add(R.ceiling);
      for (let i = -3; i <= 3; i++) { const b = new T.Mesh(geoBox(2 * D + 2, 0.5, 0.55), placeholder); b.position.set(0, WH - 1.85, i * 4); scene.add(b); H.beams.push(b); const b2 = new T.Mesh(geoBox(0.55, 0.5, 2 * D + 2), placeholder); b2.position.set(i * 4, WH - 1.85, 0); scene.add(b2); H.beams.push(b2); }
      const walls = [[0, D, 0, 'back'], [0, -D, Math.PI, 'front'], [D, 0, -Math.PI / 2, 'side'], [-D, 0, Math.PI / 2, 'side']];
      for (const [wx, wz, ry, kind] of walls) {
        const wall = new T.Group(); wall.position.set(wx, 0, wz); wall.rotation.y = ry; scene.add(wall); // local -z faces the room
        const slab = new T.Mesh(new T.BoxGeometry(2 * D + 2, WH, 1.2, 22, 11, 1), placeholder); slab.position.set(0, WH / 2 - 1.5, 0.6); slab.receiveShadow = true; wall.add(slab); R.walls.push(slab);
        const ledge = new T.Mesh(geoBox(2 * D + 2, 0.5, 0.5), placeholder); ledge.position.set(0, WH - 1.75, -0.25); wall.add(ledge); R.walls.push(ledge);
        for (const cx of [-9, -3, 3, 9]) {
          const A = window.KQArch;
          const col = A ? new T.Mesh(A.column({ h: WH - 1.2, rBot: 0.5, order: 'gothic', engaged: true, seg: 14, flutes: 10, fluteSegs: 3, rings: 4 }), placeholder)
                        : new T.Mesh(new T.CylinderGeometry(0.42, 0.5, WH - 1.2, 18), placeholder);
          col.position.set(cx, A ? -1.5 : WH / 2 - 2.1, -0.75); if (A) col.rotation.y = Math.PI; col.castShadow = true; wall.add(col); H.columns.push(col);
          if (!window.KQArch) { const cap = new T.Mesh(geoBox(1.3, 0.45, 1.3), placeholder); cap.position.set(cx, WH - 2.0, -0.75); wall.add(cap); H.columns.push(cap); }
          if (!window.KQArch) { const base = new T.Mesh(geoBox(1.3, 0.5, 1.3), placeholder); base.position.set(cx, -1.25, -0.75); wall.add(base); H.columns.push(base); }
        }
        const winX = kind === 'side' ? [-6, 0, 6] : [-6, 6];
        for (const x of winX) {
          const glow = new T.Mesh(new T.ShapeGeometry(archShape(2.4, 5.2), 24), new T.MeshBasicMaterial({ color: 0xffffff })); glow.position.set(x, 2.8, -0.05); wall.add(glow); H.windows.push(glow);
          const fs = archShape(3.2, 5.9); fs.holes.push(archShape(2.4, 5.2)); const frame = new T.Mesh(new T.ExtrudeGeometry(fs, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 24 }), placeholder); frame.position.set(x, 2.45, -0.35); wall.add(frame); H.frames.push(frame);
          const sill = new T.Mesh(geoBox(3.6, 0.3, 0.7), placeholder); sill.position.set(x, 2.35, -0.35); wall.add(sill); H.frames.push(sill);
        }
        const bannerX = kind === 'side' ? [-3, 3] : [-3, 3];
        for (const bx of bannerX) { const b = new T.Mesh(new T.PlaneGeometry(1.6, 3.4), std({ roughness: 0.85, side: T.DoubleSide })); b.position.set(bx, 6.4, -1.05); b.rotation.y = Math.PI; wall.add(b); R.banners.push(b); const rod = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.0, 8), iron); rod.rotation.z = Math.PI / 2; rod.position.set(bx, 8.15, -1.05); wall.add(rod); }
        for (const tx of [-9, 9]) {
          const holder = new T.Group(); holder.position.set(tx, 3.2, -1.2); wall.add(holder);
          const stick = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 0.6, 8), iron); stick.rotation.x = -0.5; stick.position.set(0, 0, -0.18); holder.add(stick);
          const bowl = new T.Mesh(new T.CylinderGeometry(0.14, 0.09, 0.2, 10), iron); bowl.position.set(0, 0.3, -0.36); holder.add(bowl);
          const flame = new T.Mesh(geoSphere(0.15), new T.MeshBasicMaterial({ color: 0xffa040 })); flame.position.set(0, 0.5, -0.36); flame.scale.set(1, 1.5, 1); holder.add(flame); R.flames.push(flame);
          const core = new T.Mesh(geoSphere(0.07), new T.MeshBasicMaterial({ color: 0xfff1b0 })); core.position.set(0, 0.46, -0.36); holder.add(core); R.cores.push(core);
          if (kind !== 'side') { const light = new T.PointLight(0xff9a4a, 14, 18, 2); light.position.set(0, 0.6, -0.6); holder.add(light); torchLights.push({ light, flame, base: 14, seed: Math.random() * 10 }); }
          else torchLights.push({ light: null, flame, base: 0, seed: Math.random() * 10 });
        }
        if (kind === 'side') {
          for (const sx of [-9, 9]) { const shelf = new T.Mesh(geoBox(2.4, 3.2, 0.6), placeholder); shelf.position.set(sx, 0.5, -0.95); wall.add(shelf); H.shelves.push(shelf); for (let r = 0; r < 3; r++) { const books = new T.Mesh(geoBox(2.2, 0.9, 0.45), new T.MeshStandardMaterial({ map: spineTexture(['#8e1f2f', '#2f5a8e', '#3f6b3a', '#c9a227', '#6b3a8e', '#a0522d']), roughness: 0.8 })); books.position.set(sx, -0.5 + r * 1.0, -1.05); wall.add(books); } }
        }
        if (kind === 'back') {
          const hearth = new T.Mesh(geoBox(5.2, 4.6, 1.4), placeholder); hearth.position.set(0, 0.8, -0.9); wall.add(hearth); R.walls.push(hearth);
          const mantel = new T.Mesh(geoBox(5.8, 0.4, 1.8), placeholder); mantel.position.set(0, 2.6, -1.0); wall.add(mantel); H.frames.push(mantel);
          const cavity = new T.Mesh(geoBox(3.0, 2.6, 1.2), std({ color: 0x120a06, roughness: 1 })); cavity.position.set(0, -0.2, -0.9); wall.add(cavity);
          for (let i = 0; i < 5; i++) { const f = new T.Mesh(geoSphere(0.34 - i * 0.04), new T.MeshBasicMaterial({ color: 0xff8a20 })); f.position.set(-0.8 + i * 0.4, -0.9 + (i % 2) * 0.25, -1.3); f.scale.set(1, 1.6 + (i % 2) * 0.5, 1); wall.add(f); H.fire.push(f); }
          for (const lx of [-1.1, 0, 1.1]) { const log = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 2.2, 8), std({ color: 0x3a2412, roughness: 0.9 })); log.rotation.z = Math.PI / 2; log.position.set(0, -1.3 + (lx === 0 ? 0.3 : 0), -1.3 + lx * 0.4); wall.add(log); }
          const fl = new T.PointLight(0xff7a20, 26, 22, 2); fl.position.set(0, 0.2, -2.0); wall.add(fl); H.fireLight = fl;
        }
        if (kind === 'front') {
          const dais = new T.Mesh(geoBox(6, 0.6, 3), placeholder); dais.position.set(0, -1.2, -2.2); wall.add(dais); H.throne.push(dais);
          const seat = new T.Mesh(geoBox(2.0, 0.7, 1.6), placeholder); seat.position.set(0, -0.55, -2.2); wall.add(seat); H.throne.push(seat);
          const back = new T.Mesh(geoBox(2.2, 4.2, 0.4), placeholder); back.position.set(0, 1.2, -1.5); wall.add(back); H.throne.push(back);
          const crown = new T.Mesh(geoBox(2.6, 0.6, 0.6), std({ color: 0xc9a227, roughness: 0.3, metalness: 0.85 })); crown.position.set(0, 3.5, -1.5); wall.add(crown); H.throne.push(crown);
          for (const ax of [-1.3, 1.3]) { const arm = new T.Mesh(geoBox(0.3, 0.9, 1.6), std({ color: 0xc9a227, roughness: 0.3, metalness: 0.85 })); arm.position.set(ax, 0.1, -2.2); wall.add(arm); }
          const carpet = new T.Mesh(new T.PlaneGeometry(3.2, 9), std({ color: 0x8e1f2f, roughness: 0.95 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, -1.48, -6.4); wall.add(carpet); H.carpet = carpet;
        }
        if (kind !== 'side') for (const ax of [-5.2, 5.2]) {
          const a = new T.Group(); a.position.set(ax, -1.5, -1.6); wall.add(a); H.armor.push(a);
          const ped = new T.Mesh(geoBox(1.1, 0.5, 1.1), placeholder); ped.position.y = 0.25; a.add(ped); H.frames.push(ped);
          const legs = new T.Mesh(new T.CylinderGeometry(0.28, 0.34, 1.0, 12), metal); legs.position.y = 1.0; a.add(legs);
          const torso = new T.Mesh(new T.CylinderGeometry(0.42, 0.3, 1.1, 12), metal); torso.position.y = 2.05; a.add(torso);
          const helm = new T.Mesh(geoSphere(0.32), metal); helm.position.y = 2.95; a.add(helm);
          const visor = new T.Mesh(geoBox(0.5, 0.12, 0.2), iron); visor.position.set(0, 2.9, -0.28); a.add(visor);
          const plume = new T.Mesh(new T.ConeGeometry(0.12, 0.7, 8), std({ color: 0xc0392b, roughness: 0.9 })); plume.position.set(0, 3.5, 0.05); plume.rotation.x = 0.35; a.add(plume); H.plumes = H.plumes || []; H.plumes.push(plume);
          const shield = new T.Mesh(geoBox(0.7, 0.9, 0.12), std({ color: 0x8e1f2f, roughness: 0.6 })); shield.position.set(-0.6, 1.9, -0.15); a.add(shield); H.shields = H.shields || []; H.shields.push(shield);
          const spear = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 3.2, 6), iron); spear.position.set(0.6, 2.0, -0.1); a.add(spear);
          const tip = new T.Mesh(new T.ConeGeometry(0.09, 0.4, 6), metal); tip.position.set(0.6, 3.8, -0.1); a.add(tip);
        }
      }
      for (const [cx, cz, lit] of [[-7, -7, true], [7, 7, true], [-7, 7, false], [7, -7, false]]) {
        const ch = new T.Group(); ch.position.set(cx, WH - 4.6, cz); scene.add(ch);
        const ring = new T.Mesh(new T.TorusGeometry(1.15, 0.07, 10, 40), iron); ring.rotation.x = Math.PI / 2; ch.add(ring);
        const hub = new T.Mesh(geoSphere(0.18), iron); hub.position.y = 0.9; ch.add(hub);
        for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, chain = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1.4, 6), iron); chain.position.set(Math.cos(a) * 0.55, 0.55, Math.sin(a) * 0.55); chain.rotation.z = Math.cos(a) * 0.62; chain.rotation.x = -Math.sin(a) * 0.62; ch.add(chain); }
        const top = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 3.0, 6), iron); top.position.y = 2.4; ch.add(top);
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.cos(a) * 1.15, z = Math.sin(a) * 1.15; const candle = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.32, 8), std({ color: 0xf3e6c8, roughness: 0.7 })); candle.position.set(x, 0.2, z); ch.add(candle); const fl = new T.Mesh(geoSphere(0.07), new T.MeshBasicMaterial({ color: 0xffd080 })); fl.position.set(x, 0.45, z); fl.scale.set(1, 1.6, 1); ch.add(fl); H.candles.push(fl); }
        if (lit) { const l = new T.PointLight(0xffc070, 22, 26, 2); l.position.y = 0.6; ch.add(l); H.chandLights.push(l); }
      }
      for (let i = 0; i < 46; i++) {
        const r = 0.12 + Math.random() * 0.22, len = 0.6 + Math.random() * 1.5;
        // only out near the walls — never over the board, where they would hang into the camera's view
        const a = Math.random() * Math.PI * 2, rad = 10.5 + Math.random() * 3;
        const m = new T.Mesh(new T.ConeGeometry(r, len, 7), placeholder); m.rotation.x = Math.PI;
        m.position.set(Math.cos(a) * rad, WH - 1.5 - len / 2 + 0.02, Math.sin(a) * rad); m.visible = false; scene.add(m); H.hangers.push(m);
      }
      for (const [lx, lz] of [[-10.5, -10.5], [10.5, -10.5], [-10.5, 10.5], [10.5, 10.5]]) { const lan = new T.Mesh(geoSphere(0.22), new T.MeshBasicMaterial({ color: 0xffd080 })); lan.position.set(lx, 5.4, lz); lan.visible = false; scene.add(lan); H.lanterns.push(lan); const s2 = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 5.0, 5), iron); s2.position.set(lx, 8.0, lz); s2.visible = false; scene.add(s2); H.lanterns.push(s2); }
    })();

    // ---------- the vault: a coved ceiling with moulded ribs, replacing the flat plane ----------
    (function buildVault() {
      const A = window.KQArch; if (!A) return;
      const RS = 14;                               // half room size; `D` is private to buildHall
      const VO = { S: RS, P: 5.5, y0: 8.4, y1: 11.6 };
      R.ceiling.visible = false;                       // the flat plane is the fallback only
      H.beams.forEach(b => { b.visible = false; });    // the ribs take over from the beams
      const white = g => { if (!g.getAttribute('color')) { const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(1); g.setAttribute('color', new T.BufferAttribute(c, 3)); } return g; };
      const web = new T.Mesh(white(A.coveVault(VO)), placeholder);
      web.receiveShadow = true; scene.add(web); H.vault = web;
      const ribs = new T.Mesh(white(A.vaultRibs(VO, [-9, -3, 3, 9])), placeholder);
      ribs.castShadow = true; scene.add(ribs); H.ribs = ribs;
      // a moulded cornice where wall meets vault, and a chair rail lower down
      const corn = new T.Mesh(white(A.mouldingLoop(VO.y0 - 0.15, RS, RS, A.PROFILES.cornice, { scale: 1.0 })), placeholder);
      scene.add(corn); H.cornice = corn;
      const rail = new T.Mesh(white(A.mouldingLoop(1.6, RS, RS, A.PROFILES.chairRail, { scale: 0.7 })), placeholder);
      scene.add(rail); H.rail = rail;
      const skirt = new T.Mesh(white(A.mouldingLoop(-1.5, RS, RS, A.PROFILES.skirting, { scale: 1.0 })), placeholder);
      scene.add(skirt); H.skirt = skirt;
    })();

    // corner darkening baked into vertex colours — cheaper than a lightmap at this scale
    bakeRoomAO([R.floor, R.ceiling].concat(R.walls),
      { min: new T.Vector3(-14, -1.5, -14), max: new T.Vector3(14, 10.5, 14) },
      { reach: 3.4, strength: 0.55, pools: [
          { x: 0, z: 0, r: 9.5, d: 0.55, y: -1.5, h: 0.5 },
          { x: 0, z: -11.8, r: 4.0, d: 0.45, y: -1.5, h: 0.5 }
      ] });

    // ---------- set dressing: the hall as seen from the player's seat ----------
    (function dressHall() {
      const WH = 12, iron = std({ color: 0x2a2724, roughness: 0.6, metalness: 0.5 }), brass = std({ color: 0xc9a227, roughness: 0.35, metalness: 0.8 });
      // floor inlay: a compass ring around the dais
      const rc = canvas(1024, 1024), g = rc.getContext('2d'); g.clearRect(0, 0, 1024, 1024); g.strokeStyle = 'rgba(214,180,90,0.7)';
      g.lineWidth = 14; g.beginPath(); g.arc(512, 512, 480, 0, Math.PI * 2); g.stroke(); g.lineWidth = 5; g.beginPath(); g.arc(512, 512, 428, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, L = i % 8 === 0 ? 505 : i % 4 === 0 ? 470 : 452; g.lineWidth = i % 8 === 0 ? 10 : 4; g.beginPath(); g.moveTo(512 + Math.cos(a) * 436, 512 + Math.sin(a) * 436); g.lineTo(512 + Math.cos(a) * L, 512 + Math.sin(a) * L); g.stroke(); }
      const inlay = new T.Mesh(new T.PlaneGeometry(19.5, 19.5), new T.MeshBasicMaterial({ map: tex(rc), transparent: true, depthWrite: false, opacity: 0.85 })); inlay.rotation.x = -Math.PI / 2; inlay.position.y = -1.485; scene.add(inlay); H.inlay = inlay;
      // light shafts pouring in from the side windows (soft additive cones)
      const sc = canvas(64, 256), sg = sc.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 64, 256);
      const shaftTex = tex(sc); H.shafts = [];
      for (const [wx, wz] of [[14, -6], [14, 0], [14, 6], [-14, -6], [-14, 0], [-14, 6]]) {
        const top = new T.Vector3(wx > 0 ? 13.3 : -13.3, 4.9, wz), foot = new T.Vector3(wx > 0 ? 6.2 : -6.2, -1.4, wz * 0.8);
        const dir = top.clone().sub(foot), len = dir.length(); dir.normalize();
        const m = new T.Mesh(new T.CylinderGeometry(0.9, 2.1, len, 12, 1, true), new T.MeshBasicMaterial({ map: shaftTex, color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
        m.position.copy(foot).addScaledVector(dir, len / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); scene.add(m); H.shafts.push(m);
      }
      // pennants hanging from the beams
      H.pennants = [];
      for (const [x, z] of [[-6, -8], [6, -8], [-6, 8], [6, 8], [-10, -2], [10, -2], [-10, 2], [10, 2]]) {
        const pn = new T.Mesh(new T.PlaneGeometry(1.1, 2.4), std({ roughness: 0.85, side: T.DoubleSide })); pn.position.set(x, WH - 3.3, z); pn.rotation.y = Math.abs(x) === 10 ? Math.PI / 2 : 0; scene.add(pn); R.banners.push(pn); H.pennants.push(pn);
        const rod = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.4, 6), iron); rod.position.set(x, WH - 2.05, z); if (Math.abs(x) === 10) rod.rotation.x = Math.PI / 2; else rod.rotation.z = Math.PI / 2; scene.add(rod);
      }
      // rose windows over the throne and the hearth
      H.roses = [];
      { const c = canvas(256, 256), g2 = c.getContext('2d'); const rg = g2.createRadialGradient(128, 128, 8, 128, 128, 128); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.4, '#f4f4f4'); rg.addColorStop(1, '#c8c8c8'); g2.fillStyle = rg; g2.fillRect(0, 0, 256, 256);
        g2.strokeStyle = 'rgba(0,0,0,0.62)'; g2.lineWidth = 6; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g2.beginPath(); g2.moveTo(128, 128); g2.lineTo(128 + Math.cos(a) * 128, 128 + Math.sin(a) * 128); g2.stroke(); } for (const r of [38, 82, 122]) { g2.beginPath(); g2.arc(128, 128, r, 0, Math.PI * 2); g2.stroke(); }
        const roseTex = tex(c);
        for (const z of [-13.88, 13.88]) { const rose = new T.Mesh(new T.CircleGeometry(1.75, 40), new T.MeshBasicMaterial({ map: roseTex, color: 0xffffff })); rose.position.set(0, 7.4, z); rose.rotation.y = z > 0 ? Math.PI : 0; scene.add(rose); H.roses.push(rose); const ring = new T.Mesh(new T.TorusGeometry(1.85, 0.17, 10, 48), placeholder); ring.position.set(0, 7.4, z > 0 ? 13.78 : -13.78); scene.add(ring); H.frames.push(ring); } }
      // corner props on the dais steps: one kind per kingdom
      H.corner = { candelabra: [], brazier: [], crystal: [], lantern: [] }; H.cornerLights = [];
      const wax = std({ color: 0xf3e6c8, roughness: 0.7 }), wood = std({ color: 0x4a3220, roughness: 0.9 });
      const flame = (g, x, y, z, r, hex) => { const f = new T.Mesh(geoSphere(r), new T.MeshBasicMaterial({ color: hex })); f.position.set(x, y, z); f.scale.set(1, 1.7, 1); g.add(f); torchLights.push({ light: null, flame: f, base: 0, seed: Math.random() * 10 }); return f; };
      for (const [cx, cz, lit] of [[-6.3, 6.3, true], [6.3, 6.3, true], [-6.3, -6.3, false], [6.3, -6.3, false]]) {
        { const g = new T.Group(); g.position.set(cx, -1.1, cz); scene.add(g); H.corner.candelabra.push(g);
          const foot = new T.Mesh(new T.CylinderGeometry(0.36, 0.46, 0.12, 12), brass); foot.position.y = 0.06; g.add(foot); const stem = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 2.2, 8), brass); stem.position.y = 1.16; g.add(stem);
          const arms = new T.Mesh(new T.TorusGeometry(0.34, 0.03, 8, 24, Math.PI), brass); arms.position.y = 2.1; g.add(arms);
          for (const ax of [-0.34, 0, 0.34]) { const y = ax ? 2.1 : 2.36; const cup = new T.Mesh(new T.CylinderGeometry(0.075, 0.05, 0.12, 8), brass); cup.position.set(ax, y, 0); g.add(cup); const cd = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.34, 8), wax); cd.position.set(ax, y + 0.23, 0); g.add(cd); const fl = flame(g, ax, y + 0.47, 0, 0.06, 0xffd080); R.flames.push(fl); } }
        { const g = new T.Group(); g.position.set(cx, -1.1, cz); scene.add(g); H.corner.brazier.push(g);
          for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, leg = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 1.2, 6), iron); leg.position.set(Math.cos(a) * 0.28, 0.6, Math.sin(a) * 0.28); leg.rotation.z = Math.cos(a) * 0.25; leg.rotation.x = -Math.sin(a) * 0.25; g.add(leg); }
          const bowl = new T.Mesh(new T.CylinderGeometry(0.6, 0.32, 0.5, 14), iron); bowl.position.y = 1.3; g.add(bowl); const coal = new T.Mesh(new T.CylinderGeometry(0.52, 0.52, 0.08, 14), new T.MeshBasicMaterial({ color: 0xff5a10 })); coal.position.y = 1.55; g.add(coal);
          flame(g, 0, 1.9, 0, 0.32, 0xff7a20); flame(g, 0.18, 1.8, 0.1, 0.18, 0xffb040); }
        { const g = new T.Group(); g.position.set(cx, -1.1, cz); scene.add(g); H.corner.crystal.push(g);
          for (let i = 0; i < 6; i++) { const ht = 0.7 + Math.random() * 1.7, c = new T.Mesh(new T.ConeGeometry(0.14 + Math.random() * 0.14, ht, 6), phys({ color: 0xbfe8ff, roughness: 0.08, transparent: true, opacity: 0.85, emissive: 0x3a8fff, emissiveIntensity: 0.55, clearcoat: 1, envMapIntensity: 1.2 })); c.position.set((Math.random() - 0.5) * 0.7, ht / 2 - 0.05, (Math.random() - 0.5) * 0.7); c.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * 3, (Math.random() - 0.5) * 0.6); g.add(c); } }
        { const g = new T.Group(); g.position.set(cx, -1.1, cz); scene.add(g); H.corner.lantern.push(g);
          const post = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 2.5, 8), wood); post.position.y = 1.25; g.add(post); const arm = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.6, 6), iron); arm.rotation.z = Math.PI / 2; arm.position.set(-0.3, 2.45, 0); g.add(arm);
          const cage = new T.Mesh(geoBox(0.42, 0.55, 0.42), std({ color: 0x2a2724, roughness: 0.6, metalness: 0.5, transparent: true, opacity: 0.3 })); cage.position.set(-0.55, 2.1, 0); g.add(cage); const cap = new T.Mesh(new T.ConeGeometry(0.34, 0.25, 4), iron); cap.position.set(-0.55, 2.5, 0); cap.rotation.y = Math.PI / 4; g.add(cap);
          const gl = flame(g, -0.55, 2.08, 0, 0.13, 0xffe08a); R.cores.push(gl); const moss = new T.Mesh(geoSphere(0.3), std({ color: 0x4f7a3a, roughness: 1 })); moss.position.set(0.2, 0.1, 0.15); moss.scale.y = 0.5; g.add(moss); }
        if (lit) { const l = new T.PointLight(0xffc070, 12, 14, 2); l.position.set(cx, 1.3, cz); scene.add(l); H.cornerLights.push(l); }
      }
    })();

    // ---------- highlights ----------
    const markers = []; for (let i = 0; i < 32; i++) {
      const disc = new T.Mesh(new T.CircleGeometry(0.17, 24), new T.MeshBasicMaterial({ color: 0x2f9a4f, transparent: true, opacity: 0.7, depthWrite: false }));
      const ring = new T.Mesh(new T.RingGeometry(0.36, 0.47, 32), new T.MeshBasicMaterial({ color: 0x2f9a4f, transparent: true, opacity: 0.7, depthWrite: false }));
      for (const m of [disc, ring]) { m.rotation.x = -Math.PI / 2; m.position.y = 0.075; m.visible = false; root.add(m); }
      markers.push({ disc, ring });
    }
    const checkDisc = new T.Mesh(new T.CircleGeometry(0.48, 32), new T.MeshBasicMaterial({ color: 0xe03030, transparent: true, opacity: 0.6, depthWrite: false }));
    checkDisc.rotation.x = -Math.PI / 2; checkDisc.position.y = 0.07; checkDisc.visible = false; root.add(checkDisc);
    const starShape = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.16 : 0.36, a = -Math.PI / 2 + i / 10 * Math.PI * 2; if (i) starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); } starShape.closePath();
    const starGeo = new T.ExtrudeGeometry(starShape, { depth: 0.08, bevelEnabled: false }), stars = [];
    for (let i = 0; i < 8; i++) { const s = new T.Mesh(starGeo, new T.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.95 })); s.rotation.x = -Math.PI / 2; s.position.y = 0.1; s.visible = false; root.add(s); stars.push(s); }
    function arrowMesh(hex) { const g = new T.Group(); g.visible = false; root.add(g); g.userData.mat = new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.88, depthWrite: false }); return g; }
    const arrowBook = arrowMesh(0xd4a017), arrowHint = arrowMesh(0x2f9a4f);
    function placeArrow(g, from, to) {
      const a = sqToXZ(from), b = sqToXZ(to), dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) - 0.3;
      while (g.children.length) { const c = g.children.pop(); c.geometry.dispose(); }
      const sh = new T.Shape();
      sh.moveTo(0.22, -0.1); sh.lineTo(len - 0.36, -0.1); sh.lineTo(len - 0.36, -0.26); sh.lineTo(len, 0); sh.lineTo(len - 0.36, 0.26); sh.lineTo(len - 0.36, 0.1); sh.lineTo(0.22, 0.1); sh.closePath();
      const m = new T.Mesh(new T.ShapeGeometry(sh), g.userData.mat); m.rotation.x = -Math.PI / 2; g.add(m);
      g.position.set(a.x, 0.09, a.z); g.rotation.y = Math.atan2(-dz, dx); g.visible = true;
    }
    const pulse = { book: [], check: false, t: 0 };
    let lastHighlights = {};

    // ---------- pieces ----------
    const pieces = {}, graveyard = { w: [], b: [] }, pieceMeshes = [];
    let theme = THEMES[0], mats = null;
    function themeMats() { if (!THEME_MATS[theme.id]) THEME_MATS[theme.id] = upgradeMats(theme.id, theme.mats()); return THEME_MATS[theme.id]; }
    function applyPieceMaterials(g) {
      const m = themeMats(), c = g.userData.color;
      for (const ch of g.children) {
        const role = ch.userData.role;
        if (role === 'outline') { ch.material = c === 'w' ? m.outW : m.outB; continue; }
        if (role === 'body') ch.material = (c === 'w' ? m.pw : m.pb).clone();
        else if (role === 'accent') ch.material = c === 'w' ? m.accW : m.accB;
        else if (role === 'gold') ch.material = m.gold;
      }
    }
    function makePiece(color, type) {
  const g = new T.Group(); g.userData = { color, type, sq: null, groundY: 0 };
  const G = pieceGeo(type);
  const add = (geo, role) => {
    const mesh = new T.Mesh(geo, placeholder);
    mesh.userData.role = role; mesh.userData.group = g;
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh); pieceMeshes.push(mesh); return mesh;
  };
  add(G.body, 'body');                       // children[0] - must stay first
  if (G.accent) add(G.accent, 'accent');
  if (G.gold)   add(G.gold,   'gold');
  const ao = contactShadow(G.baseR); g.add(ao); g.userData.ao = ao;   // last, and NOT in pieceMeshes
  if (color === 'b') g.rotation.y = Math.PI;
  applyPieceMaterials(g); root.add(g); return g;
}
    function disposePiece(g) {
      root.remove(g);
      for (const m of g.children) {
        const i = pieceMeshes.indexOf(m); if (i >= 0) pieceMeshes.splice(i, 1);
        if (m.userData.role === 'shadow' && m.material) m.material.dispose();
      }
      g.userData.ao = null;
    }
    function graveSlot(color, idx) { const col = Math.floor(idx / 8), row = idx % 8; return color === 'b' ? new T.Vector3(5.5 + col * 0.62, -0.35, 3.4 - row * 0.62) : new T.Vector3(-5.5 - col * 0.62, -0.35, -3.4 + row * 0.62); }

    // ---------- tweens ----------
    const tweens = [];
    function tween(dur, update, done, ease) { tweens.push({ t0: performance.now(), dur, update, done, ease: ease || easeOut }); }
    function slide(g, sq, fromGrave) {
      g.userData.groundY = 0;
      const p0 = g.position.clone(), p1 = sqToXZ(sq), s0 = g.scale.x, hop = g.userData.type === 'n' ? 0.75 : 0.28, dist = Math.hypot(p1.x - p0.x, p1.z - p0.z);
      g.userData.busy = true;
      tween(fromGrave ? 600 : 300 + Math.min(dist * 40, 200), t => { g.position.x = p0.x + (p1.x - p0.x) * t; g.position.z = p0.z + (p1.z - p0.z) * t; g.position.y = p0.y * (1 - t) + Math.sin(Math.PI * t) * hop; g.scale.setScalar(s0 + (1 - s0) * t); }, () => { g.position.set(p1.x, 0, p1.z); g.scale.setScalar(1); g.userData.busy = false; }, easeInOut);
    }
    function toGraveyard(g) {
      g.userData.groundY = -0.35;
      const list = graveyard[g.userData.color]; list.push(g); g.userData.sq = null;
      const p0 = g.position.clone(), p1 = graveSlot(g.userData.color, list.length - 1);
      tween(650, t => { g.position.x = p0.x + (p1.x - p0.x) * t; g.position.z = p0.z + (p1.z - p0.z) * t; g.position.y = p0.y + (p1.y - p0.y) * t + Math.sin(Math.PI * t) * 1.4; g.scale.setScalar(1 - 0.28 * t); }, () => { g.position.copy(p1); g.scale.setScalar(0.72); }, easeInOut);
    }
    function relayoutGraveyard(color) { graveyard[color].forEach((g, i) => { const p1 = graveSlot(color, i), p0 = g.position.clone(); tween(300, t => { g.position.lerpVectors(p0, p1, t); }); }); }
    function fadeOut(g) { const s0 = g.scale.x; tween(260, t => g.scale.setScalar(s0 * (1 - t)), () => disposePiece(g)); }
    function pop(g) { g.scale.setScalar(0.01); tween(320, t => g.scale.setScalar(t), () => g.scale.setScalar(1)); }
    function placeAt(g, sq) { const p = sqToXZ(sq); g.position.set(p.x, 0, p.z); }

    function sync(wanted, ev) {
      ev = Object.assign({}, ev || {});
      if (ev.reset) {
        for (const sq in pieces) disposePiece(pieces[sq]);
        for (const c of ['w', 'b']) { for (const g of graveyard[c]) disposePiece(g); graveyard[c] = []; }
        for (const k in pieces) delete pieces[k];
      }
      const stale = [];
      for (const sq in pieces) { const g = pieces[sq], w = wanted[sq]; if (!w || g.userData.color !== w.color || g.userData.type !== w.type) { stale.push(g); delete pieces[sq]; } }
      for (const sq in wanted) {
        if (pieces[sq]) { if (!pieces[sq].userData.busy) placeAt(pieces[sq], sq); continue; }
        const w = wanted[sq]; let g = null, i;
        if ((i = stale.findIndex(x => x.userData.color === w.color && x.userData.type === w.type)) >= 0) { g = stale.splice(i, 1)[0]; slide(g, sq, false); }
        else if (ev.uncaptured && ev.uncaptured.color === w.color && ev.uncaptured.type === w.type && (i = graveyard[w.color].findIndex(x => x.userData.type === w.type)) >= 0) { g = graveyard[w.color].splice(i, 1)[0]; ev.uncaptured = null; relayoutGraveyard(w.color); slide(g, sq, true); }
        else { g = makePiece(w.color, w.type); placeAt(g, sq); if (!ev.reset) pop(g); }
        g.userData.sq = sq; pieces[sq] = g;
      }
      for (const g of stale) { if (ev.captured && ev.captured.color === g.userData.color && ev.captured.type === g.userData.type) { ev.captured = null; toGraveyard(g); } else fadeOut(g); }
    }

    const darkGlow = sq => theme.id === 'dragon' && R.dark.includes(squares[sq]);
    function baseEmissive(sq) { const m = squares[sq].material; if (!m.emissive) return; if (darkGlow(sq)) { m.emissive.setHex(0xff4a00); m.emissiveIntensity = 1.2; } else { m.emissive.setHex(0); m.emissiveIntensity = 0; } }
    function setHighlights(h) {
      h = h || {}; lastHighlights = h;
      for (const sq in squares) baseEmissive(sq);
      const set = (sq, hex, i) => { const m = squares[sq].material; if (m.emissive) { m.emissive.setHex(hex); m.emissiveIntensity = i; } };
      if (h.last) { set(h.last.from, 0xc9a227, 0.3); set(h.last.to, 0xc9a227, 0.4); }
      if (h.selected) set(h.selected, 0xd4a017, 0.6);
      pulse.book = h.book ? [h.book.from, h.book.to] : [];
      let mi = 0; for (const mk of markers) mk.disc.visible = mk.ring.visible = false;
      for (const l of h.legal || []) { if (mi >= markers.length) break; const p = sqToXZ(l.sq), mk = markers[mi++], m = l.capture ? mk.ring : mk.disc; m.position.x = p.x; m.position.z = p.z; m.visible = true; }
      if (h.check) { const p = sqToXZ(h.check); checkDisc.position.x = p.x; checkDisc.position.z = p.z; checkDisc.visible = true; pulse.check = true; } else { checkDisc.visible = false; pulse.check = false; }
      if (h.book) placeArrow(arrowBook, h.book.from, h.book.to); else arrowBook.visible = false;
      if (h.hint) placeArrow(arrowHint, h.hint.from, h.hint.to); else arrowHint.visible = false;
      let si = 0; for (const s of stars) s.visible = false; for (const sq of h.stars || []) { if (si >= stars.length) break; const p = sqToXZ(sq), s = stars[si++]; s.position.x = p.x; s.position.z = p.z; s.visible = true; }
    }

    // ---------- particles ----------
    let particles = null;
    function makeParticles(kind) {
      const specs = { motes: { n: 160, size: 0.07, color: 0xffe0b0, opacity: 0.45, add: true }, embers: { n: 260, size: 0.1, color: 0xff7a30, opacity: 0.9, add: true }, snow: { n: 600, size: 0.09, color: 0xffffff, opacity: 0.85, add: false }, fireflies: { n: 140, size: 0.13, color: 0xd8ff70, opacity: 0.95, add: true }, sparkles: { n: 90, size: 0.09, color: 0xffe9a0, opacity: 0.9, add: true } };
      const s = specs[kind]; if (!s) return null;
      const n = s.n, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n * 3), phase = new Float32Array(n), base = new T.Color(s.color), rnd = Math.random;
      function spawn(i, init) {
        const j = i * 3;
        if (kind === 'embers') { pos[j] = (rnd() - 0.5) * 22; pos[j + 1] = init ? rnd() * 7 - 1.2 : -1.2; pos[j + 2] = (rnd() - 0.5) * 22; vel[j + 1] = 0.5 + rnd() * 0.9; }
        else if (kind === 'snow') { pos[j] = (rnd() - 0.5) * 30; pos[j + 1] = init ? rnd() * 12 - 1 : 11; pos[j + 2] = (rnd() - 0.5) * 30; vel[j + 1] = -(0.5 + rnd() * 0.5); }
        else if (kind === 'sparkles') { pos[j] = (rnd() - 0.5) * 12; pos[j + 1] = rnd() * 3; pos[j + 2] = (rnd() - 0.5) * 12; vel[j + 1] = 0.15 + rnd() * 0.2; }
        else { pos[j] = (rnd() - 0.5) * 24; pos[j + 1] = rnd() * 7; pos[j + 2] = (rnd() - 0.5) * 24; vel[j] = (rnd() - 0.5) * 0.4; vel[j + 1] = (rnd() - 0.5) * 0.25; vel[j + 2] = (rnd() - 0.5) * 0.4; }
        phase[i] = rnd() * Math.PI * 2; col[j] = base.r; col[j + 1] = base.g; col[j + 2] = base.b;
      }
      for (let i = 0; i < n; i++) spawn(i, true);
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      const mat = new T.PointsMaterial({ size: s.size, map: spriteTex, transparent: true, opacity: s.opacity, depthWrite: false, blending: s.add ? T.AdditiveBlending : T.NormalBlending, vertexColors: true, sizeAttenuation: true });
      const pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
      return {
        update(dt, t) {
          for (let i = 0; i < n; i++) {
            const j = i * 3;
            if (kind === 'embers') { pos[j + 1] += vel[j + 1] * dt; pos[j] += Math.sin(t * 2 + phase[i]) * 0.3 * dt; if (pos[j + 1] > 7) spawn(i, false); const b = 0.55 + 0.45 * Math.sin(t * 9 + phase[i]); col[j] = base.r * b; col[j + 1] = base.g * b; col[j + 2] = base.b * b; }
            else if (kind === 'snow') { pos[j + 1] += vel[j + 1] * dt; pos[j] += Math.sin(t * 0.8 + phase[i]) * 0.25 * dt; if (pos[j + 1] < -1.4) spawn(i, false); }
            else if (kind === 'fireflies') { pos[j] += Math.sin(t * 0.7 + phase[i]) * 0.5 * dt; pos[j + 2] += Math.cos(t * 0.6 + phase[i] * 1.3) * 0.5 * dt; pos[j + 1] += Math.sin(t * 1.1 + phase[i]) * 0.2 * dt; const b = Math.pow(Math.max(0, Math.sin(t * 1.6 + phase[i])), 3); col[j] = base.r * b; col[j + 1] = base.g * b; col[j + 2] = base.b * b; }
            else if (kind === 'sparkles') { pos[j + 1] += vel[j + 1] * dt; if (pos[j + 1] > 3.5) spawn(i, false); const b = Math.pow(Math.max(0, Math.sin(t * 3 + phase[i])), 4); col[j] = base.r * b; col[j + 1] = base.g * b; col[j + 2] = base.b * b; }
            else { pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt; if (Math.abs(pos[j]) > 12 || Math.abs(pos[j + 2]) > 12 || pos[j + 1] < 0 || pos[j + 1] > 7) spawn(i, true); }
          }
          geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        },
        dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); }
      };
    }

    // ---------- theme switching ----------
    let envTex = null;
    // ---------- the Enchanted Forest grows INTO the hall: trees, bushes, ivy on the columns, moss and flowers (instanced, forest only) ----------
    (function buildGreenery() {
      const G = new T.Group(); G.visible = false; scene.add(G); H.greenery = G;
      const rnd = (a, b) => a + Math.random() * (b - a), dummy = new T.Object3D();
      const shades = [0x3d7a33, 0x56983f, 0x2c6a2a, 0x6fae4a];
      const leafMat = shades.map(c => std({ color: c, roughness: 0.92 })), barkMat = std({ color: 0x4a3220, roughness: 0.95 }), mossMat = std({ color: 0x4f8a3a, roughness: 1 });
      const petalMat = [0xfff2c8, 0xffd36a, 0xf7a8c4, 0xcfe8ff].map(c => std({ color: c, roughness: 0.8, emissive: c, emissiveIntensity: 0.25 }));
      const leaves = shades.map(() => []), trunks = [], moss = [], petals = petalMat.map(() => []);
      const blob = (x, y, z, r, sx, sy, sz) => leaves[Math.floor(Math.random() * shades.length)].push([x, y, z, r * (sx || 1), r * (sy || 1), r * (sz || 1)]);
      const F = -1.5;   // floor height
      // trees: around the walls, between the columns, never over the board
      const trees = [[-4.6, 12.3], [4.6, 12.3], [-9.4, 12.3], [9.4, 12.3], [-12.3, 4.5], [12.3, 4.5], [-12.3, -4.5], [12.3, -4.5], [-12.3, 10], [12.3, 10], [-9.4, -12.3], [9.4, -12.3], [-12.3, -10], [12.3, -10]];
      for (const [x, z] of trees) {
        const h = rnd(4.2, 6.8), lean = rnd(-0.06, 0.06);
        trunks.push([x, F + h * 0.5, z, 0.22, h, 0.22, lean]);
        for (let i = 0; i < 5; i++) blob(x + rnd(-0.9, 0.9), F + h * rnd(0.72, 1.05), z + rnd(-0.9, 0.9), rnd(1.1, 1.8), 1, rnd(0.75, 0.95), 1);
        if (Math.random() < 0.5) trunks.push([x + rnd(-0.5, 0.5), F + h * 0.62, z + rnd(-0.5, 0.5), 0.07, h * 0.7, 0.07, rnd(-0.5, 0.5)]);   // a branch
      }
      // bushes: a ring of undergrowth around the room, plus two flanking the dais
      for (let i = 0; i < 34; i++) {
        const a = rnd(0, Math.PI * 2), rad = rnd(8.6, 12.6), x = Math.cos(a) * rad, z = Math.sin(a) * rad, n = 3 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) { const r = rnd(0.35, 0.8); blob(x + rnd(-0.6, 0.6), F + r * 0.75, z + rnd(-0.6, 0.6), r, 1, rnd(0.7, 0.9), 1); }
        if (Math.random() < 0.55) for (let k = 0; k < 4; k++) petals[Math.floor(Math.random() * petalMat.length)].push([x + rnd(-0.7, 0.7), F + rnd(0.5, 1.0), z + rnd(-0.7, 0.7), 0.07]);
      }
      for (const [x, z] of [[-7.6, 7.8], [7.6, 7.8]]) for (let k = 0; k < 5; k++) { const r = rnd(0.4, 0.75); blob(x + rnd(-0.7, 0.7), F + r * 0.75, z + rnd(-0.5, 0.5), r, 1, 0.8, 1); }
      // ivy climbing every column (columns sit 0.75 in from each wall at x/z = -9, -3, 3, 9)
      const cols = []; for (const c of [-9, -3, 3, 9]) cols.push([c, 13.25], [c, -13.25], [13.25, c], [-13.25, c]);
      for (const [x, z] of cols) { const top = rnd(3, 7.5), dx = x > 12 ? -0.55 : x < -12 ? 0.55 : 0, dz = z > 12 ? -0.55 : z < -12 ? 0.55 : 0;
        for (let y = 0; y < top; y += 0.55) { const r = rnd(0.28, 0.5); blob(x + dx + rnd(-0.35, 0.35), F + y + rnd(0, 0.3), z + dz + rnd(-0.35, 0.35), r, 1, 0.55, 1); } }
      // moss: soft patches on the floor near the walls
      for (let i = 0; i < 26; i++) { const a = rnd(0, Math.PI * 2), rad = rnd(7.8, 13); moss.push([Math.cos(a) * rad, F + 0.015, Math.sin(a) * rad, rnd(0.6, 1.6), rnd(0.6, 1.6)]); }
      const inst = (geo, mat, list, fill) => { if (!list.length) return; const m = new T.InstancedMesh(geo, mat, list.length); list.forEach((it, i) => { fill(it); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }); m.instanceMatrix.needsUpdate = true; m.castShadow = true; m.receiveShadow = true; G.add(m); return m; };
      const sph = new T.SphereGeometry(1, 12, 9), cyl = new T.CylinderGeometry(0.7, 1, 1, 8), disc = new T.CircleGeometry(1, 14);
      leaves.forEach((list, i) => inst(sph, leafMat[i], list, ([x, y, z, sx, sy, sz]) => { dummy.position.set(x, y, z); dummy.rotation.set(0, rnd(0, 6.28), 0); dummy.scale.set(sx, sy, sz); }));
      inst(cyl, barkMat, trunks, ([x, y, z, sx, sy, sz, lean]) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, lean); dummy.scale.set(sx, sy, sz); });
      inst(disc, mossMat, moss, ([x, y, z, sx, sz]) => { dummy.position.set(x, y, z); dummy.rotation.set(-Math.PI / 2, 0, rnd(0, 6.28)); dummy.scale.set(sx, sz, 1); });
      petals.forEach((list, i) => inst(sph, petalMat[i], list, ([x, y, z, r]) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(r, r * 0.6, r); }));
      // a soft green fill so the undergrowth glows a little under the lanterns
      const fill = new T.PointLight(0xa8e08a, 7, 20, 2); fill.position.set(0, 4.5, 0); G.add(fill);
    })();

    // ---------- the Dragon's Lair as a Chinese temple: red lacquer columns, paper lanterns, calligraphy banners, pagoda eaves, guardian lions (dragon only) ----------
    (function buildTemple() {
      const G = new T.Group(); G.visible = false; scene.add(G); H.temple = G;
      const F = -1.5, WH = 12, rnd = (a, b) => a + Math.random() * (b - a);
      const lacquer = phys({ color: 0xa5121a, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 0.9 });
      const gold = std({ color: 0xd9a52c, roughness: 0.3, metalness: 0.85 }), paper = std({ color: 0xff3b1f, emissive: 0xff5a20, emissiveIntensity: 1.1, roughness: 0.8 });
      const tile = std({ color: 0x1f3d3a, roughness: 0.6, metalness: 0.1 }), stone = std({ color: 0x6f6a62, roughness: 0.9 }), bronze = std({ color: 0x7a5a2a, roughness: 0.5, metalness: 0.7 });
      // lacquered sleeves with gold rings on every column (columns sit 0.75 in from each wall at x/z = -9, -3, 3, 9)
      const cols = []; for (const c of [-9, -3, 3, 9]) cols.push([c, 13.25], [c, -13.25], [13.25, c], [-13.25, c]);
      const sleeveGeo = new T.CylinderGeometry(0.58, 0.64, WH - 1.4, 18), ringGeo = new T.TorusGeometry(0.64, 0.07, 8, 24);
      for (const [x, z] of cols) { const s = new T.Mesh(sleeveGeo, lacquer); s.position.set(x, F + (WH - 1.4) / 2, z); s.castShadow = true; G.add(s);
        for (const y of [0.35, 3.2, WH - 2.2]) { const r = new T.Mesh(ringGeo, gold); r.rotation.x = Math.PI / 2; r.position.set(x, F + y, z); G.add(r); } }
      // red paper lanterns around the hall, hanging from the beams (never over the board)
      const lantGeo = new T.SphereGeometry(0.42, 16, 12), capGeo = new T.CylinderGeometry(0.2, 0.2, 0.1, 12), cordGeo = new T.CylinderGeometry(0.02, 0.02, 1.2, 6), tasselGeo = new T.CylinderGeometry(0.05, 0.02, 0.5, 6);
      const tassel = std({ color: 0xd9a52c, roughness: 0.9 });
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.17, rad = 9.6 + (i % 2) * 2.4, x = Math.cos(a) * rad, z = Math.sin(a) * rad, y = F + rnd(7.4, 8.6);
        const l = new T.Mesh(lantGeo, paper); l.scale.set(1, 1.25, 1); l.position.set(x, y, z); G.add(l);   // not in H.lanterns: setTheme hides that list for the dragon kingdom
        for (const dy of [0.56, -0.56]) { const c = new T.Mesh(capGeo, gold); c.position.set(x, y + dy, z); G.add(c); }
        const cord = new T.Mesh(cordGeo, tassel); cord.position.set(x, y + 1.2, z); G.add(cord); const ts = new T.Mesh(tasselGeo, tassel); ts.position.set(x, y - 0.9, z); G.add(ts); }
      // calligraphy banners: 龍 dragon · 福 fortune · 勇 courage · 智 wisdom · 王 king · 棋 chess
      const banner = chars => { const c = canvas(256, 1024), g = c.getContext('2d'); g.fillStyle = '#9e1016'; g.fillRect(0, 0, 256, 1024); g.strokeStyle = '#e0b04a'; g.lineWidth = 14; g.strokeRect(14, 14, 228, 996);
        g.fillStyle = '#f2c85a'; g.font = '900 150px "Noto Serif SC","PingFang SC","Hiragino Sans GB","STSong",serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        chars.split('').forEach((ch, i) => g.fillText(ch, 128, 200 + i * 300)); return std({ map: tex(c), roughness: 0.85, side: T.DoubleSide }); };
      const bGeo = new T.PlaneGeometry(1.5, 6);
      for (const [x, y, z, ry, txt] of [[-5.6, 4.6, 13.35, Math.PI, '龍福'], [5.6, 4.6, 13.35, Math.PI, '勇智'], [13.35, 4.6, -6, -Math.PI / 2, '王'], [13.35, 4.6, 6, -Math.PI / 2, '棋'], [-13.35, 4.6, -6, Math.PI / 2, '福'], [-13.35, 4.6, 6, Math.PI / 2, '龍'], [-6, 4.6, -13.35, 0, '智勇'], [6, 4.6, -13.35, 0, '龍王']]) {
        const b = new T.Mesh(bGeo, banner(txt)); b.position.set(x, y, z); b.rotation.y = ry; G.add(b); }
      // pagoda eaves: three tiers of upswept green-tiled roof over the throne, and a small hood over each round window
      const eave = (w, d, y, z, ry) => { const g = new T.Group(); g.position.set(0, y, z); g.rotation.y = ry; G.add(g);
        const roof = new T.Mesh(geoBox(w, 0.28, d), tile); g.add(roof); const trim = new T.Mesh(geoBox(w + 0.1, 0.1, d + 0.1), gold); trim.position.y = -0.18; g.add(trim);
        const under = new T.Mesh(geoBox(w - 0.6, 0.5, d - 0.4), lacquer); under.position.y = -0.45; g.add(under);
        for (const sx of [-1, 1]) { const tip = new T.Mesh(new T.CylinderGeometry(0.05, 0.16, 0.9, 6), tile); tip.position.set(sx * w / 2, 0.35, -d / 2 + 0.2); tip.rotation.z = -sx * 0.6; g.add(tip); } return g; };
      eave(9, 2.6, F + 6.2, 12.2, 0); eave(7, 2.2, F + 7.6, 12.45, 0); eave(5, 1.8, F + 8.9, 12.7, 0);
      for (const [z, ry] of [[-13.4, 0], [13.4, Math.PI]]) eave(4.6, 1.2, 9.6, z, ry);
      // guardian lions flanking the dais
      for (const sx of [-1, 1]) { const g = new T.Group(); g.position.set(sx * 4.4, F, 9.2); G.add(g);
        const base = new T.Mesh(geoBox(1.3, 0.5, 1.3), stone); base.position.y = 0.25; g.add(base);
        const body = new T.Mesh(new T.SphereGeometry(0.5, 14, 10), bronze); body.scale.set(1, 0.9, 1.3); body.position.set(0, 0.95, 0.05); g.add(body);
        const chest = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), bronze); chest.position.set(0, 1.25, -0.35); g.add(chest);
        const head = new T.Mesh(new T.SphereGeometry(0.38, 14, 10), bronze); head.position.set(0, 1.85, -0.45); g.add(head);
        const mane = new T.Mesh(new T.TorusGeometry(0.42, 0.13, 8, 18), bronze); mane.position.set(0, 1.8, -0.3); mane.rotation.x = 0.35; g.add(mane);
        for (const ex of [-0.15, 0.15]) { const eye = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0xffb040 })); eye.position.set(ex, 1.92, -0.8); g.add(eye); }
        const ball = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), gold); ball.position.set(sx * -0.45, 0.72, -0.55); g.add(ball); }
      // a warm red wash from the lanterns
      const fill = new T.PointLight(0xff7a3a, 8, 22, 2); fill.position.set(0, 6, 0); G.add(fill);
    })();

    function setTheme(id) {
      theme = THEMES.find(t => t.id === id) || THEMES[0]; mats = themeMats();
      R.light.forEach(m => { m.material = mats.light.clone(); }); R.dark.forEach(m => { m.material = mats.dark.clone(); });
      R.frame.material = mats.frame; R.plinth.material = mats.plinth; R.step.material = mats.plinth; R.floor.material = mats.floor;
      R.walls.forEach(m => m.material = mats.wall);
      enableVC([mats.floor, mats.wall].filter(Boolean));
      const hm = theme.hall; if (!mats.hallCeiling) { mats.hallCeiling = hm.ceiling(); mats.hallBeam = hm.beam(); mats.hallColumn = hm.column(); mats.hallFrame = std({ color: hm.frame, roughness: 0.8 }); mats.hallWindow = new T.MeshBasicMaterial({ map: windowTexture(hm.window[0], hm.window[1]) }); mats.hanger = hm.hangers === 'ice' ? phys({ color: 0xcfe8ff, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 }) : hm.hangers === 'vine' ? std({ color: 0x2f5a2a, roughness: 0.9 }) : std({ color: 0x2a2022, roughness: 0.95 }); }
      R.ceiling.material = mats.hallCeiling;
      if (H.vault) H.vault.material = mats.hallCeiling;
      if (H.ribs) H.ribs.material = mats.hallColumn;
      if (H.cornice) H.cornice.material = mats.hallFrame;
      if (H.rail) H.rail.material = mats.hallFrame;
      if (H.skirt) H.skirt.material = mats.hallColumn; H.beams.forEach(b => { b.material = mats.hallBeam; b.visible = hm.hangers !== 'rock'; }); H.columns.forEach(c => c.material = mats.hallColumn); H.frames.forEach(f => f.material = mats.hallFrame); H.shelves.forEach(f => f.material = mats.hallFrame); H.throne.forEach((t, i) => { if (i < 3) t.material = mats.hallColumn; });
      H.windows.forEach(w => w.material = mats.hallWindow); H.candles.forEach(c => c.material.color.setHex(hm.candle)); H.chandLights.forEach(l => l.color.setHex(hm.chand)); H.fire.forEach(f => f.material.color.copy(hotColor(hm.fire, 2.4))); if (H.fireLight) H.fireLight.color.setHex(hm.fireLight);
      H.hangers.forEach(m => { m.visible = hm.hangers !== 'none'; m.material = mats.hanger; }); H.lanterns.forEach(m => m.visible = !!hm.lanterns);
      if (H.carpet) H.carpet.material.color.setHex(hm.carpet); (H.plumes || []).forEach(p => p.material.color.setHex(hm.plume)); (H.shields || []).forEach(p => p.material.color.setHex(hm.shield));
      scene.fog = new T.Fog(hm.fog, 16, 48);
      const cornerKind = { oak: 'candelabra', marble: 'candelabra', dragon: 'brazier', ice: 'crystal', forest: 'lantern' }[theme.id] || 'candelabra';
      if (H.greenery) H.greenery.visible = theme.id === 'forest';   // the forest grows into the hall; every other kingdom keeps a clean floor
      if (H.temple) H.temple.visible = theme.id === 'dragon';     // the lair is a Chinese temple; lanterns, banners and lions only there
      for (const k in H.corner) H.corner[k].forEach(g => { g.visible = k === cornerKind; });
      H.cornerLights.forEach(l => { l.color.setHex(theme.torch); l.intensity = cornerKind === 'crystal' ? 6 : 12; });
      H.shafts.forEach(s => { s.material.color.set(hm.window[0]); s.material.opacity = theme.id === 'marble' || theme.id === 'ice' ? 0.2 : theme.id === 'dragon' ? 0.14 : 0.18; });   // a hint of haze, never a wedge across the board
      if (H.inlay) H.inlay.material.opacity = theme.id === 'dragon' ? 0.55 : 0.85;
      H.roses.forEach(r => r.material.color.set(hm.window[0]));
      const bt = bannerTexture(theme.banner[0], theme.banner[1]);
      R.banners.forEach(b => { b.material.map = bt; b.material.needsUpdate = true; }); 
      R.flames.forEach(f => f.material.color.copy(hotColor(theme.flame[0], 2.2))); R.cores.forEach(c => c.material.color.copy(hotColor(theme.flame[1], 4.0)));
      torchLights.forEach(tl => { if (tl.light) tl.light.color.setHex(theme.torch); });
      skyMat.uniforms.top.value.setHex(theme.sky[0]); skyMat.uniforms.horizon.value.setHex(theme.sky[1]);
      hemi.color.setHex(theme.hemi[0]); hemi.groundColor.setHex(theme.hemi[1]); hemi.intensity = theme.hemi[2];
      sun.color.setHex(theme.sun[0]); sun.intensity = theme.sun[1]; sun.position.set(theme.sun[2], theme.sun[3], theme.sun[4]);
      renderer.toneMappingExposure = theme.exposure;
      if (envTex) envTex.dispose();
      const eq = new T.CanvasTexture(envCanvas(theme.env)); eq.mapping = T.EquirectangularReflectionMapping; eq.colorSpace = T.SRGBColorSpace;
      envTex = pmrem.fromEquirectangular(eq).texture; eq.dispose(); scene.environment = envTex;
      if (particles) particles.dispose(); particles = makeParticles(theme.particles);
      for (const sq in pieces) applyPieceMaterials(pieces[sq]);
      for (const c of ['w', 'b']) for (const g of graveyard[c]) applyPieceMaterials(g);
      setHighlights(lastHighlights);
      enableVC([mats.hallCeiling].filter(Boolean));
      rig.apply(theme.id); rig.dirty();
      if (post) { post.setTheme(theme.id); registerGlow(); }
      if (cb.onTheme) cb.onTheme(theme);
    }

    // ---------- victory banner & confetti ----------
    let victory = null, confetti = null;
    function victoryTexture(info) {
      const c = canvas(512, 768), g = c.getContext('2d'), bg = theme.banner[0], trim = theme.banner[1];
      g.fillStyle = bg; g.fillRect(0, 0, 512, 768);
      const grad = g.createLinearGradient(0, 0, 512, 0); grad.addColorStop(0, 'rgba(0,0,0,0.25)'); grad.addColorStop(0.5, 'rgba(255,255,255,0.08)'); grad.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = grad; g.fillRect(0, 0, 512, 768);
      g.strokeStyle = trim; g.lineWidth = 16; g.strokeRect(24, 24, 464, 720); g.lineWidth = 4; g.strokeRect(48, 48, 416, 672);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = trim;
      g.font = '700 44px Cinzel, "Assistant", Georgia, serif'; g.fillText(info.label || 'CHAMPION', 256, 110);
      const painted = window.KQAvatars && KQAvatars.has(info.avatar); if (!painted) { g.font = '200px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; g.fillText(info.avatar || '👑', 256, 300); }   /* a painted avatar is drawn below — never its key as text */
      // the name, big — shrinking to fit — then the avatar's title beneath it
      let name = info.name || 'Champion', size = 96; g.font = `900 ${size}px "Cinzel Decorative", Cinzel, "Assistant", Georgia, serif`;
      while (g.measureText(name).width > 430 && size > 44) { size -= 6; g.font = `900 ${size}px "Cinzel Decorative", Cinzel, "Assistant", Georgia, serif`; }
      g.fillText(name, 256, 530);
      if (info.title) { let ts = 40; g.font = `italic 700 ${ts}px Cinzel, "Assistant", Georgia, serif`; while (g.measureText(info.title).width > 430 && ts > 22) { ts -= 3; g.font = `italic 700 ${ts}px Cinzel, "Assistant", Georgia, serif`; } g.fillText(info.title, 256, 620); }
      g.fillRect(156, 665, 200, 4);
      g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 60; i++) g.fillRect(Math.random() * 512, 0, 2, 768);
      const texture = tex(c);
      if (window.KQAvatars && KQAvatars.has(info.avatar)) { g.fillStyle = bg; KQAvatars.draw(info.avatar, g, 124, 168, 264).then(ok => { if (ok) texture.needsUpdate = true; }); }
      return texture;
    }
    function showVictory(info) {
      hideVictory();
      const geo = new T.PlaneGeometry(6.4, 9.4, 14, 20); geo.translate(0, -4.7, 0);
      const mesh = new T.Mesh(geo, new T.MeshBasicMaterial({ map: victoryTexture(info), side: T.DoubleSide }));
      const group = new T.Group(); group.add(mesh);
      const rod = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 7.6, 10), std({ color: 0xc9a227, roughness: 0.3, metalness: 0.8 })); rod.rotation.z = Math.PI / 2; rod.position.y = 0.06; group.add(rod);
      for (const x of [-3.8, 3.8]) { const f = new T.Mesh(geoSphere(0.2), rod.material); f.position.set(x, 0.06, 0); group.add(f); }
      const side = Math.cos(orbit.tTheta) >= 0 ? 1 : -1;
      group.position.set(0, 6.6, -side * 9.4); group.rotation.y = side > 0 ? 0 : Math.PI;   // in FRONT of the dais and throne, never behind the chair back
      scene.add(group);
      victory = { group, mesh, base: geo.attributes.position.array.slice() };
      mesh.scale.y = 0.02; tween(1500, t => { mesh.scale.y = 0.02 + 0.98 * t; }, null, easeOut);
      orbit.tTargetY = 2.6; orbit.tPhi = 1.14; orbit.tRadius = 12.5;
      launchConfetti();
    }
    /* the winner's banner in full view (Yoni 2026-09-30: 'at the end of every chess game, if someone wins, the view needs to move to show
       the banner of the winner'): lift the eye and step back, so the whole banner hangs in the frame across the board */
    let focused = false;
    function focusVictory() { if (!victory) return; focused = true; orbit.tPhi = 1.1; orbit.tRadius = 11.5; orbit.tTargetY = 4.5; }   /* stays inside the hall (the playing view is ~10 back); aims up at the banner */
    function hideVictory() {
      if (focused) { focused = false; orbit.tPhi = 0.83; orbit.tRadius = 14.0; orbit.tTargetY = 0.7; }   /* back to the playing view */
      if (victory) { const v = victory; victory = null; scene.remove(v.group); v.mesh.geometry.dispose(); v.mesh.material.map.dispose(); v.mesh.material.dispose(); }
      if (confetti) { confetti.dispose(); confetti = null; }
      orbit.tTargetY = 0.7;
    }
    function launchConfetti() {
      const n = 420, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n * 3);
      const palette = [0xff4d6d, 0xffd166, 0x06d6a0, 0x4cc9f0, 0xf9c74f, 0xffffff, 0xc77dff];
      for (let i = 0; i < n; i++) { const j = i * 3; pos[j] = (Math.random() - 0.5) * 12; pos[j + 1] = 6 + Math.random() * 5; pos[j + 2] = (Math.random() - 0.5) * 12; vel[j] = (Math.random() - 0.5) * 1.2; vel[j + 1] = -(0.8 + Math.random() * 1.2); vel[j + 2] = (Math.random() - 0.5) * 1.2; const c = new T.Color(palette[i % palette.length]); col[j] = c.r; col[j + 1] = c.g; col[j + 2] = c.b; }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      const mat = new T.PointsMaterial({ size: 0.16, map: spriteTex, transparent: true, opacity: 0.95, depthWrite: false, vertexColors: true, sizeAttenuation: true });
      const pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
      let life = 0;
      confetti = { update(dt, t) { life += dt; for (let i = 0; i < n; i++) { const j = i * 3; pos[j] += (vel[j] + Math.sin(t * 3 + i) * 0.6) * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt; if (pos[j + 1] < -1.4) pos[j + 1] = 6 + Math.random() * 5; } geo.attributes.position.needsUpdate = true; if (life > 8) mat.opacity = Math.max(0, 0.95 - (life - 8) * 0.5); if (life > 10.5 && confetti) { confetti.dispose(); confetti = null; } }, dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); } };
    }

    // ---------- camera ----------
    function setView(which, instant) {
      const cur = orbit.tTheta; let th = which === 'b' ? Math.PI : 0;
      if (which === 'top') { orbit.tPhi = 0.3; orbit.tRadius = 9.8; } else { orbit.tPhi = 0.83; orbit.tRadius = 14.0; }
      th = cur + Math.atan2(Math.sin(th - cur), Math.cos(th - cur)); orbit.tTheta = th;
      if (instant) { orbit.theta = th; orbit.phi = orbit.tPhi; orbit.radius = orbit.tRadius; }
    }
    function updateCamera() {
      orbit.theta += (orbit.tTheta - orbit.theta) * 0.1; orbit.phi += (orbit.tPhi - orbit.phi) * 0.1; orbit.radius += (orbit.tRadius - orbit.radius) * 0.1; orbit.target.y += (orbit.tTargetY - orbit.target.y) * 0.06;
      const sp = Math.sin(orbit.phi), portrait = camera.aspect < 1, rf = portrait ? clamp(0.9 / camera.aspect, 1, 1.25) : 1, rad = orbit.radius * rf; // tall screens: pull back and widen so the whole board fits
      const fov = portrait ? clamp(52 * 0.85 / camera.aspect, 52, 80) : 52; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.position.set(orbit.target.x + rad * sp * Math.sin(orbit.theta), orbit.target.y + rad * Math.cos(orbit.phi), orbit.target.z + rad * sp * Math.cos(orbit.theta));
      if (camera.position.y > 10.1) camera.position.y = 10.1;
      camera.lookAt(orbit.target); rig.update(camera);
    }

    // ---------- picking / input ----------
    const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), hitPt = new T.Vector3();
    function setNdc(e) { const r = cv.getBoundingClientRect(); ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1; ray.setFromCamera(ndc, camera); }
    function pick(e) {
      setNdc(e);
      const hp = ray.intersectObjects(pieceMeshes, false)[0];
      const planeSq = ray.ray.intersectPlane(plane, hitPt) ? xzToSq(hitPt.x, hitPt.z) : null;
      const pieceSq = hp && hp.object.userData.group ? hp.object.userData.group.userData.sq : null;
      const own = sq => !!sq && pieces[sq] && cb.canDrag && cb.canDrag(sq);
      if (own(planeSq)) return { sq: planeSq, piece: pieces[planeSq] };
      if (own(pieceSq)) return { sq: pieceSq, piece: pieces[pieceSq] };
      if (planeSq) return { sq: planeSq, piece: pieces[planeSq] || null };
      if (pieceSq) return { sq: pieceSq, piece: pieces[pieceSq] };
      return null;
    }
    function boardPoint(e) { setNdc(e); return ray.ray.intersectPlane(plane, hitPt) ? hitPt : null; }
    const pointers = new Map(); let gesture = null, hovered = null;
    const pdist = () => { const p = [...pointers.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
    cv.addEventListener('pointerdown', e => {
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) { if (gesture && gesture.type === 'drag') snapBack(gesture); gesture = { type: 'pinch', d0: pdist(), r0: orbit.tRadius }; return; }
      if (pointers.size > 2) return;
      const hit = pick(e);
      if (hit && hit.piece && cb.canDrag && cb.canDrag(hit.sq)) { gesture = { type: 'drag', id: e.pointerId, piece: hit.piece, from: hit.sq, x0: e.clientX, y0: e.clientY, moved: false }; if (cb.onDragStart) cb.onDragStart(hit.sq); }
      else gesture = { type: 'orbit', id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, hitSq: hit ? hit.sq : null, th0: orbit.tTheta, ph0: orbit.tPhi };
    });
    function cancelGesture() { if (gesture && gesture.type === 'drag') snapBack(gesture); gesture = null; pointers.clear(); cv.style.cursor = 'grab'; }
    window.addEventListener('blur', cancelGesture);
    cv.addEventListener('pointermove', e => {
      if (gesture && e.pointerType === 'mouse' && e.buttons === 0) cancelGesture(); // a button-up we never received: never let a stale gesture keep steering the camera
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesture && gesture.type === 'pinch' && pointers.size >= 2) { orbit.tRadius = clamp(gesture.r0 * gesture.d0 / Math.max(20, pdist()), 6, 15.5); return; }
      if (!gesture) { if (e.pointerType === 'mouse') { const hit = pick(e); const g = hit && hit.piece && cb.canDrag && cb.canDrag(hit.sq) ? hit.piece : null; setHover(g); cv.style.cursor = g ? 'grab' : (hit ? 'pointer' : 'grab'); } return; }
      if (gesture.id !== e.pointerId) return;
      const dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
      if (!gesture.moved && Math.hypot(dx, dy) < 6) return;
      gesture.moved = true;
      if (gesture.type === 'orbit') { orbit.tTheta = gesture.th0 - dx * 0.0065; orbit.tPhi = clamp(gesture.ph0 - dy * 0.005, 0.28, 1.2); cv.style.cursor = 'grabbing'; }
      else if (gesture.type === 'drag') { const p = boardPoint(e); if (p) { gesture.piece.position.set(clamp(p.x, -4.2, 4.2), 0.55, clamp(p.z, -4.2, 4.2)); gesture.piece.userData.busy = true; } }
    });
    function snapBack(g) { const piece = g.piece, p = sqToXZ(g.from), p0 = piece.position.clone(); tween(220, t => { piece.position.lerpVectors(p0, new T.Vector3(p.x, 0, p.z), t); }, () => { piece.position.set(p.x, 0, p.z); piece.userData.busy = false; }); }
    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (!gesture) return;
      if (gesture.type === 'pinch') { if (pointers.size < 2) gesture = null; return; }
      if (gesture.id !== e.pointerId) return;
      const g = gesture; gesture = null; cv.style.cursor = 'grab';
      if (g.type === 'drag') {
        if (!g.moved) { g.piece.userData.busy = false; return; }
        const p = boardPoint(e), target = p ? xzToSq(p.x, p.z) : null; let accepted = false;
        if (target && target !== g.from && cb.onDrop) { g.piece.position.set(sqToXZ(target).x, 0, sqToXZ(target).z); g.piece.userData.busy = false; accepted = !!cb.onDrop(g.from, target); }
        if (!accepted) { snapBack(g); if (cb.onDropRejected) cb.onDropRejected(g.from, target); }
      } else if (!g.moved && g.hitSq && cb.onTap) cb.onTap(g.hitSq);
    }
    cv.addEventListener('pointerup', endPointer); cv.addEventListener('pointercancel', endPointer);
    cv.addEventListener('wheel', e => { e.preventDefault(); orbit.tRadius = clamp(orbit.tRadius * (1 + e.deltaY * 0.0012), 6, 15.5); }, { passive: false });
    function setHover(g) {
      if (hovered === g) return;
      if (hovered) { const m = hovered.children[0].material; if (m.emissive) { m.emissive.setHex(0); m.emissiveIntensity = 0; } }
      hovered = g;
      if (hovered) { const m = hovered.children[0].material; if (m.emissive) { m.emissive.setHex(0xd4a017); m.emissiveIntensity = 0.18; } }
    }

    // ---------- post-processing: HDR target, soft-knee bloom on the practical lights, per-theme grade ----------
    const isTablet = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
    const post = window.KQPost ? window.KQPost.create(renderer, scene, camera, {
      quality: 'high', msaa: isTablet ? 2 : 4, maxPixelRatio: isTablet ? 1.5 : 2
    }) : null;
    function registerGlow() {
      if (!post) return;
      post.markGlow(torchLights.map(t => t.flame), 2.6);
      post.markGlow(R.cores, 4.0);
      post.markGlow(H.candles, 3.2);
      post.markGlow(H.fire, 3.0);
      post.markGlow(H.lanterns.filter(m => m.material && m.material.isMeshBasicMaterial), 2.8);
      post.markGlow(H.windows, 1.7);
      post.markGlow(H.roses || [], 1.5);
      post.markGlow(H.shafts || [], 1.0);
      post.markEmissive([R.floor, R.plinth], theme.id === 'dragon' ? 1.4 : 1.0);
      post.applyGlow();
    }

    // ---------- resize & loop ----------
    function resize() { const w = container.clientWidth || 640, h = container.clientHeight || 480; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (post) post.resize(w, h); }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(container); else window.addEventListener('resize', resize);
    resize();
    let running = true, last = performance.now();
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; pulse.t += dt;
      for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i], t = Math.min(1, (now - tw.t0) / tw.dur); tw.update(tw.ease(t)); if (t >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); } }
      for (const sq of pulse.book) { const m = squares[sq].material; if (m.emissive) { m.emissive.setHex(0xd4a017); m.emissiveIntensity = 0.35 + 0.3 * Math.sin(pulse.t * 5); } }
      if (pulse.check) checkDisc.material.opacity = 0.5 + 0.25 * Math.sin(pulse.t * 7);
      for (const s of stars) if (s.visible) { s.rotation.z = pulse.t * 1.6; s.position.y = 0.14 + 0.06 * Math.sin(pulse.t * 4); }
      if (arrowBook.visible) arrowBook.userData.mat.opacity = 0.7 + 0.25 * Math.sin(pulse.t * 5);
      for (const tl of torchLights) { const n = Math.sin(pulse.t * 11 + tl.seed) * 0.5 + Math.sin(pulse.t * 23 + tl.seed * 2) * 0.3 + Math.sin(pulse.t * 5 + tl.seed) * 0.2; if (tl.light) tl.light.intensity = tl.base * (0.85 + 0.2 * n); tl.flame.scale.set(1 + 0.15 * n, 1.5 + 0.3 * n, 1 + 0.15 * n); }
      H.fire.forEach((f, i) => { const n = Math.sin(pulse.t * 13 + i * 1.7) * 0.5 + Math.sin(pulse.t * 29 + i) * 0.3; f.scale.set(1 + 0.2 * n, 1.6 + 0.5 * n + (i % 2) * 0.5, 1 + 0.2 * n); }); if (H.fireLight) H.fireLight.intensity = 26 * (0.8 + 0.25 * Math.sin(pulse.t * 17));
      if (victory) { const pos = victory.mesh.geometry.attributes.position, b = victory.base; for (let i = 0; i < pos.count; i++) { const y = b[i * 3 + 1], x = b[i * 3]; pos.array[i * 3 + 2] = Math.sin(y * 1.6 + x * 0.8 - pulse.t * 2.6) * 0.14 * (-y / 9.4); } pos.needsUpdate = true; }
      if (particles) particles.update(dt, pulse.t);
      if (confetti) confetti.update(dt, pulse.t);
      for (const sq in pieces) updateContactShadow(pieces[sq]);
      for (const c of ['w', 'b']) for (const gv of graveyard[c]) updateContactShadow(gv);
      updateCamera();
      if (post) post.render(dt); else renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
    setTheme('oak');

    return {
      sync, setHighlights, setView, setTheme, showVictory, focusVictory, hideVictory, resize,
      setQuality: q => { if (post) post.setQuality(q); }, postDebug: () => post && post.debug(),
      get theme() { return theme; },
      cancelGesture,
      debug() { return { theta: orbit.theta, tTheta: orbit.tTheta, phi: orbit.phi, tPhi: orbit.tPhi, radius: orbit.radius, targetY: orbit.target.y, gesture: gesture && gesture.type, pointers: pointers.size, pieces: Object.keys(pieces).length }; },
      dispose() { running = false; if (post) post.dispose(); renderer.dispose(); }
    };
  }
})();
