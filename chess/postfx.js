/* ===========================================================================
   KQ POST-FX  —  hand-written mini compositor for chess/scene.js
   core three.js r160 only. No addons, no assets.

   Chain (all fullscreen-triangle passes):
     scene  -> sceneRT (RGBA16F, MSAA)          [linear HDR, NOT tone-mapped]
     bright -> L0.a   (1/2 res, karis 4-tap + soft-knee threshold)
     blurH/V L0, downsample+blur -> L1, -> L2   (1/4, 1/8)
     composite(sceneRT + L0 + L1 + L2) -> canvas
        bloom add -> chromatic aberration -> ACES -> LGG/S-curve/split-tone
        -> vignette -> sRGB -> film grain

   TONE MAPPING NOTE (verified against r160 source, WebGLPrograms.js:20723):
     three.js FORCES `NoToneMapping` for every material drawn into a
     non-XR WebGLRenderTarget, and forces outputColorSpace to LinearSRGB.
     So the scene pass is automatically raw linear HDR — you do NOT have to
     touch `renderer.toneMapping`. Leave it on ACESFilmic. The composite
     re-implements the exact same ACES curve and reads
     `renderer.toneMappingExposure` every frame, so `setTheme()`'s existing
     `renderer.toneMappingExposure = theme.exposure` line keeps working and
     the fallback (post disabled -> renderer.render straight to canvas)
     looks identical apart from bloom/grade.
   =========================================================================== */
(function () {
  'use strict';
  const T = window.THREE;

  // ---------- per-theme grade ----------
  // multipliers are around 1.0; keep them there or brightness drifts.
  const GRADE = {
    oak:    { bloom: 0.50, threshold: 0.95, knee: 0.55, w: [1.00, 0.78, 0.55],
              lift: [0.008, 0.006, 0.004], gain: [1.015, 1.00, 0.975], gamma: [1.00, 1.00, 1.01],
              shadow: [0.965, 0.98, 1.03], high: [1.03, 1.00, 0.955],
              contrast: 0.20, sat: 1.00, vig: 0.42, vigIn: 0.34, vigOut: 0.95, ca: 0.0028, grain: 0.022 },
    marble: { bloom: 0.40, threshold: 1.08, knee: 0.60, w: [1.00, 0.70, 0.45],
              lift: [0.010, 0.010, 0.013], gain: [1.00, 1.00, 1.01], gamma: [1.00, 1.00, 1.00],
              shadow: [0.985, 0.995, 1.03], high: [1.015, 1.005, 0.99],
              contrast: 0.14, sat: 0.96, vig: 0.28, vigIn: 0.38, vigOut: 1.02, ca: 0.0018, grain: 0.016 },
    dragon: { bloom: 0.50, threshold: 0.84, knee: 0.50, w: [1.00, 0.92, 0.80],
              lift: [0.007, 0.005, 0.004], gain: [1.00, 1.00, 0.99], gamma: [1.00, 1.00, 1.005],
              shadow: [1.00, 0.99, 0.975], high: [1.01, 1.00, 0.97],
              contrast: 0.21, sat: 0.86, vig: 0.50, vigIn: 0.26, vigOut: 0.88, ca: 0.0046, grain: 0.030 },
    ice:    { bloom: 0.36, threshold: 1.08, knee: 0.60, w: [1.00, 0.85, 0.70],
              lift: [0.003, 0.004, 0.005], gain: [0.99, 0.995, 1.00], gamma: [1.00, 1.00, 1.00],
              shadow: [0.98, 0.99, 1.02], high: [0.985, 0.99, 1.00],
              contrast: 0.22, sat: 0.86, vig: 0.38, vigIn: 0.34, vigOut: 0.97, ca: 0.0035, grain: 0.020 },
    forest: { bloom: 0.46, threshold: 0.97, knee: 0.55, w: [1.00, 0.80, 0.62],
              lift: [0.005, 0.006, 0.005], gain: [1.00, 0.99, 1.00], gamma: [1.00, 1.00, 1.00],
              shadow: [0.99, 1.00, 0.995], high: [1.015, 1.00, 0.98],
              contrast: 0.22, sat: 0.88, vig: 0.48, vigIn: 0.30, vigOut: 0.92, ca: 0.0030, grain: 0.024 }
  };

  // ---------- shared GLSL ----------
  const VERT = [
    'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
  ].join('\n');

  const LUMA = 'float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }';

  // bright pass: 2x2 karis-weighted box (kills single-pixel fireflies) + soft knee
  const BRIGHT_FRAG = [
    'uniform sampler2D tSrc;',
    'uniform vec2 uTexel;',        // source texel size
    'uniform float uThreshold;',
    'uniform float uKnee;',
    'uniform float uClamp;',
    'varying vec2 vUv;',
    LUMA,
    'vec3 fetch(vec2 uv){ return min(texture2D(tSrc, uv).rgb, vec3(uClamp)); }',
    'void main(){',
    '  vec3 a = fetch(vUv + uTexel * vec2(-1.0,-1.0));',
    '  vec3 b = fetch(vUv + uTexel * vec2( 1.0,-1.0));',
    '  vec3 c = fetch(vUv + uTexel * vec2(-1.0, 1.0));',
    '  vec3 d = fetch(vUv + uTexel * vec2( 1.0, 1.0));',
    '  float wa = 1.0/(1.0+luma(a)), wb = 1.0/(1.0+luma(b)), wc = 1.0/(1.0+luma(c)), wd = 1.0/(1.0+luma(d));',
    '  vec3 col = (a*wa + b*wb + c*wc + d*wd) / max(wa+wb+wc+wd, 1e-5);',
    '  float l = luma(col);',
    '  float soft = clamp(l - uThreshold + uKnee, 0.0, 2.0*uKnee);',
    '  soft = soft*soft / (4.0*uKnee + 1e-5);',
    '  float contrib = max(soft, l - uThreshold) / max(l, 1e-5);',
    '  gl_FragColor = vec4(col * contrib, 1.0);',
    '}'
  ].join('\n');

  // separable gaussian: 9 taps folded into 5 bilinear fetches
  const BLUR_FRAG = [
    'uniform sampler2D tSrc;',
    'uniform vec2 uDir;',          // = (1/dstW,0) or (0,1/dstH)  -> widens automatically when downsampling
    'varying vec2 vUv;',
    'void main(){',
    '  vec4 c  = texture2D(tSrc, vUv) * 0.2270270270;',
    '  c += texture2D(tSrc, vUv + uDir * 1.3846153846) * 0.3162162162;',
    '  c += texture2D(tSrc, vUv - uDir * 1.3846153846) * 0.3162162162;',
    '  c += texture2D(tSrc, vUv + uDir * 3.2307692308) * 0.0702702703;',
    '  c += texture2D(tSrc, vUv - uDir * 3.2307692308) * 0.0702702703;',
    '  gl_FragColor = c;',
    '}'
  ].join('\n');

  // final composite. NOTE: material.toneMapped = false, so three injects NO
  // tone-map function here -> we carry three's exact ACES verbatim.
  const COMP_FRAG = [
    'uniform sampler2D tScene;',
    'uniform sampler2D tB0;',
    'uniform sampler2D tB1;',
    'uniform sampler2D tB2;',
    'uniform vec3  uBloomW;',
    'uniform float uBloom;',
    'uniform float uExposure;',
    'uniform float uCA;',
    'uniform vec3  uLift;',
    'uniform vec3  uGain;',
    'uniform vec3  uInvGamma;',
    'uniform vec3  uShadow;',
    'uniform vec3  uHigh;',
    'uniform float uContrast;',
    'uniform float uSat;',
    'uniform float uVig;',
    'uniform float uVigIn;',
    'uniform float uVigOut;',
    'uniform float uGrain;',
    'uniform float uTime;',
    'uniform vec2  uRes;',
    'uniform float uAspect;',
    'varying vec2 vUv;',
    LUMA,
    // three.js r160 ACESFilmicToneMapping, verbatim (exposure folded in)
    'vec3 RRTAndODTFit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }',
    'vec3 ACESFilmic(vec3 color, float exposure){',
    '  const mat3 ACESInputMat = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));',
    '  const mat3 ACESOutputMat = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));',
    '  color *= exposure / 0.6;',
    '  color = ACESInputMat * color;',
    '  color = RRTAndODTFit(color);',
    '  color = ACESOutputMat * color;',
    '  return clamp(color, 0.0, 1.0);',
    '}',
    'float hash21(vec2 p){ p = fract(p * vec2(443.8975, 441.4237)); p += dot(p, p + 19.19); return fract((p.x + p.y) * p.x); }',
    'void main(){',
    '  vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);',
    '  float r2 = dot(d, d);',
    // chromatic aberration: radial, quadratic falloff, zero in the centre
    '  vec2 off = (vUv - 0.5) * r2 * uCA;',
    '  vec3 col;',
    '  col.r = texture2D(tScene, vUv + off).r;',
    '  col.g = texture2D(tScene, vUv).g;',
    '  col.b = texture2D(tScene, vUv - off).b;',
    // bloom, still in linear HDR so ACES rolls it off naturally
    '  vec3 bloom = texture2D(tB0, vUv).rgb * uBloomW.x',
    '             + texture2D(tB1, vUv).rgb * uBloomW.y',
    '             + texture2D(tB2, vUv).rgb * uBloomW.z;',
    '  col += bloom * uBloom;',
    '  col = ACESFilmic(col, uExposure);',
    // ---- grade, in display space ----
    '  col = pow(max(col * (uGain - uLift) + uLift, vec3(0.0)), uInvGamma);',
    '  col = mix(col, col*col*(3.0 - 2.0*col), uContrast);',              // S-curve
    '  float l = luma(col);',
    '  col *= mix(uShadow, uHigh, smoothstep(0.12, 0.78, l));',           // split-tone
    '  col = mix(vec3(luma(col)), col, uSat);',
    // ---- vignette ----
    // NB: edge0 < edge1 — a reversed smoothstep() is undefined in the GLSL spec
    '  float v = 1.0 - smoothstep(uVigIn, uVigOut, length(d));',
    '  col *= mix(1.0, v, uVig);',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '  #include <colorspace_fragment>',
    // ---- film grain, after the OETF so it actually dithers the 8-bit output ----
    '  float n1 = hash21(vUv * uRes + vec2(uTime * 13.7, uTime * 7.3));',
    '  float n2 = hash21(vUv * uRes + vec2(17.3 - uTime * 5.1, 91.7 + uTime * 11.9));',
    '  float g = (n1 + n2 - 1.0) * uGrain;',                              // triangular PDF, zero mean
    '  g *= 1.0 - 0.55 * luma(gl_FragColor.rgb);',                        // stronger in shadows
    '  gl_FragColor.rgb += g;',
    '}'
  ].join('\n');

  // ---------- helpers ----------
  function quadGeo() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    g.setAttribute('uv', new T.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    return g;
  }
  const lerp = (a, b, t) => a + (b - a) * t;

  /* -------------------------------------------------------------------------
     createPostFX(renderer, scene, camera, [opts])
       opts.quality   'high' | 'low' | 'off'      (default 'high')
       opts.msaa      samples for the scene RT     (default 4, 0 disables)
       opts.maxPixelRatio                          (default 2)
       opts.watchdog  false to disable auto-downgrade
     returns an object; see the bottom of this function.
     ---------------------------------------------------------------------- */
  function createPostFX(renderer, scene, camera, opts) {
    opts = opts || {};
    const caps = renderer.capabilities;
    const webgl2 = caps.isWebGL2 !== false;
    // RGBA16F must be BOTH linearly filterable AND colour-renderable.
    const halfOK = webgl2
      ? (renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float'))
      : (renderer.extensions.has('OES_texture_half_float_linear') && renderer.extensions.has('EXT_color_buffer_half_float'));
    const RTType = halfOK ? T.HalfFloatType : T.UnsignedByteType;
    // 8-bit fallback: no headroom above 1.0, so pull the bright-pass down or nothing blooms.
    const ldrFallback = !halfOK;

    let quality = opts.quality || 'high';
    let bloomOn = true;
    let enabled = true;
    const maxDpr = opts.maxPixelRatio || 2;
    // three clamps to capabilities.maxSamples internally, but clamp here too so
    // the `sceneRT.samples !== samples` rebuild test can never thrash.
    const msaaWant = Math.min(opts.msaa === undefined ? 4 : opts.msaa, caps.maxSamples || 0);

    // --- render targets ---
    const rtOpts = {
      type: RTType, format: T.RGBAFormat,
      minFilter: T.LinearFilter, magFilter: T.LinearFilter,
      depthBuffer: true, stencilBuffer: false, generateMipmaps: false
    };
    function mkRT(w, h, extra) {
      const o = Object.assign({}, rtOpts, extra || {});
      const rt = new T.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), o);
      rt.texture.colorSpace = T.NoColorSpace;   // stay linear; no decode on read
      return rt;
    }
    let sceneRT = null;
    const L = [];                                // 3 levels, each {a,b,w,h}
    let W = 1, H = 1;

    // --- pass materials ---
    const geo = quadGeo();
    const qScene = new T.Scene();
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const qMesh = new T.Mesh(geo, null);
    qMesh.frustumCulled = false;
    qScene.add(qMesh);

    const base = { depthTest: false, depthWrite: false, toneMapped: false };
    const mBright = new T.ShaderMaterial(Object.assign({
      vertexShader: VERT, fragmentShader: BRIGHT_FRAG,
      uniforms: {
        tSrc: { value: null }, uTexel: { value: new T.Vector2() },
        uThreshold: { value: 0.9 }, uKnee: { value: 0.55 }, uClamp: { value: 24.0 }
      }
    }, base));
    const mBlur = new T.ShaderMaterial(Object.assign({
      vertexShader: VERT, fragmentShader: BLUR_FRAG,
      uniforms: { tSrc: { value: null }, uDir: { value: new T.Vector2() } }
    }, base));
    const mComp = new T.ShaderMaterial(Object.assign({
      vertexShader: VERT, fragmentShader: COMP_FRAG,
      uniforms: {
        tScene: { value: null }, tB0: { value: null }, tB1: { value: null }, tB2: { value: null },
        uBloomW: { value: new T.Vector3(1, 0.78, 0.55) }, uBloom: { value: 0.62 },
        uExposure: { value: 1.05 }, uCA: { value: 0.0028 },
        uLift: { value: new T.Vector3() }, uGain: { value: new T.Vector3(1, 1, 1) },
        uInvGamma: { value: new T.Vector3(1, 1, 1) },
        uShadow: { value: new T.Vector3(1, 1, 1) }, uHigh: { value: new T.Vector3(1, 1, 1) },
        uContrast: { value: 0.22 }, uSat: { value: 1.06 },
        uVig: { value: 0.42 }, uVigIn: { value: 0.34 }, uVigOut: { value: 0.95 },
        uGrain: { value: 0.022 }, uTime: { value: 0 },
        uRes: { value: new T.Vector2(1, 1) }, uAspect: { value: 1 }
      }
    }, base));

    function draw(mat, target) {
      qMesh.material = mat;
      renderer.setRenderTarget(target || null);
      renderer.render(qScene, qCam);
    }

    // --- sizing ---
    const bloomDiv = () => (quality === 'low' ? [4, 8, 16] : [2, 4, 8]);
    function setSize(cssW, cssH) {
      const dpr = Math.min(renderer.getPixelRatio(), maxDpr);
      W = Math.max(1, Math.round(cssW * dpr));
      H = Math.max(1, Math.round(cssH * dpr));
      const samples = webgl2 ? (quality === 'high' ? msaaWant : quality === 'low' ? Math.min(msaaWant, 2) : 0) : 0;
      // three can't change `samples` on a live RT — rebuild when it changes.
      if (sceneRT && sceneRT.samples !== samples) { sceneRT.dispose(); sceneRT = null; }
      if (!sceneRT) sceneRT = mkRT(W, H, { samples: samples });
      else sceneRT.setSize(W, H);
      const div = bloomDiv();
      for (let i = 0; i < 3; i++) {
        const w = Math.max(1, Math.round(W / div[i])), h = Math.max(1, Math.round(H / div[i]));
        if (!L[i]) L[i] = { a: mkRT(w, h, { depthBuffer: false }), b: mkRT(w, h, { depthBuffer: false }), w: w, h: h };
        else { L[i].a.setSize(w, h); L[i].b.setSize(w, h); L[i].w = w; L[i].h = h; }
      }
      mComp.uniforms.uRes.value.set(W, H);
      mComp.uniforms.uAspect.value = W / H;
    }

    // --- theme grade, with a smooth cross-fade ---
    let gCur = JSON.parse(JSON.stringify(GRADE.oak));
    let gDst = gCur, blendT = 1;
    function setTheme(id) {
      const g = GRADE[id] || GRADE.oak;
      if (g === gDst) return;
      gCur = snapshot();            // start from whatever is on screen now
      gDst = g; blendT = 0;
    }
    function snapshot() {
      const u = mComp.uniforms;
      return {
        bloom: gradeBloom, threshold: mBright.uniforms.uThreshold.value, knee: mBright.uniforms.uKnee.value,
        w: [u.uBloomW.value.x, u.uBloomW.value.y, u.uBloomW.value.z],
        lift: [u.uLift.value.x, u.uLift.value.y, u.uLift.value.z],
        gain: [u.uGain.value.x, u.uGain.value.y, u.uGain.value.z],
        gamma: [1 / u.uInvGamma.value.x, 1 / u.uInvGamma.value.y, 1 / u.uInvGamma.value.z],
        shadow: [u.uShadow.value.x, u.uShadow.value.y, u.uShadow.value.z],
        high: [u.uHigh.value.x, u.uHigh.value.y, u.uHigh.value.z],
        contrast: u.uContrast.value, sat: u.uSat.value,
        vig: u.uVig.value, vigIn: u.uVigIn.value, vigOut: u.uVigOut.value,
        ca: u.uCA.value, grain: u.uGrain.value
      };
    }
    let gradeBloom = GRADE.oak.bloom;   // grade-driven bloom master (gated by bloomOn at draw time)
    function applyGrade(t) {
      const a = gCur, b = gDst, u = mComp.uniforms;
      const L3 = (k, i) => lerp(a[k][i], b[k][i], t);
      gradeBloom = lerp(a.bloom, b.bloom, t);
      u.uBloom.value = gradeBloom;
      mBright.uniforms.uThreshold.value = lerp(a.threshold, b.threshold, t);
      mBright.uniforms.uKnee.value = lerp(a.knee, b.knee, t);
      // in the 8-bit fallback nothing can exceed 1.0, so drop the threshold
      if (ldrFallback) mBright.uniforms.uThreshold.value *= 0.55;
      u.uBloomW.value.set(L3('w', 0), L3('w', 1), L3('w', 2));
      u.uLift.value.set(L3('lift', 0), L3('lift', 1), L3('lift', 2));
      u.uGain.value.set(L3('gain', 0), L3('gain', 1), L3('gain', 2));
      u.uInvGamma.value.set(1 / L3('gamma', 0), 1 / L3('gamma', 1), 1 / L3('gamma', 2));
      u.uShadow.value.set(L3('shadow', 0), L3('shadow', 1), L3('shadow', 2));
      u.uHigh.value.set(L3('high', 0), L3('high', 1), L3('high', 2));
      u.uContrast.value = lerp(a.contrast, b.contrast, t);
      u.uSat.value = lerp(a.sat, b.sat, t);
      u.uVig.value = lerp(a.vig, b.vig, t);
      u.uVigIn.value = lerp(a.vigIn, b.vigIn, t);
      u.uVigOut.value = lerp(a.vigOut, b.vigOut, t);
      u.uCA.value = lerp(a.ca, b.ca, t);
      u.uGrain.value = lerp(a.grain, b.grain, t);
    }
    applyGrade(1);

    // --- emissive HDR boost registry -------------------------------------
    // MeshBasicMaterial flames sit at <= 1.0 linear, which no bright-pass can
    // see. We push the registered materials above 1.0; ACES pulls them back,
    // so the *look* is unchanged but the bloom finally has something to grab.
    const glow = [];                              // {mat, gain}
    function markGlow(objOrArray, gain) {
      const list = Array.isArray(objOrArray) ? objOrArray : [objOrArray];
      for (const o of list) {
        const m = o && o.isMesh ? o.material : o;
        if (!m || !m.color) continue;
        if (!glow.some(e => e.mat === m)) glow.push({ mat: m, gain: gain });
        else glow.find(e => e.mat === m).gain = gain;
      }
    }
    const emis = [];                               // {mat, gain, base}
    function markEmissive(objOrArray, gain) {      // for MeshStandard emissive (lava cracks)
      const list = Array.isArray(objOrArray) ? objOrArray : [objOrArray];
      for (const o of list) {
        const m = o && o.isMesh ? o.material : o;
        if (!m || m.emissiveIntensity === undefined) continue;
        let e = emis.find(x => x.mat === m);
        if (!e) { e = { mat: m, gain: gain, base: m.emissiveIntensity }; emis.push(e); }
        else e.gain = gain;
        m.emissiveIntensity = e.base * gain;
      }
    }
    // Call after setTheme(): re-reads any colour the theme just wrote, then
    // re-applies the boost. Idempotent — safe to call every frame if you like.
    function applyGlow() {
      if (!enabled || !bloomOn) return;
      for (const e of glow) {
        const m = e.mat, c = m.color, ud = m.userData;
        if (!ud.kqLast || Math.abs(c.r - ud.kqLast.r) > 1e-4 || Math.abs(c.g - ud.kqLast.g) > 1e-4 || Math.abs(c.b - ud.kqLast.b) > 1e-4) {
          ud.kqBase = c.clone();                   // theme changed it -> new base
        }
        c.copy(ud.kqBase).multiplyScalar(e.gain);
        ud.kqLast = c.clone();
      }
      for (const e of emis) e.mat.emissiveIntensity = e.base * e.gain;
    }
    function clearGlow() {                         // restore <=1.0 colours (post off)
      for (const e of glow) { const ud = e.mat.userData; if (ud.kqBase) { e.mat.color.copy(ud.kqBase); ud.kqLast = null; } }
      for (const e of emis) e.mat.emissiveIntensity = e.base;
    }

    // --- watchdog ---------------------------------------------------------
    // Measures its OWN wall clock — never trust the caller's dt, the scene loop
    // clamps it (Math.min(0.05, …)) so a 600ms stall would read as a 50ms frame.
    const wd = { ema: 16.7, over: 0, under: 0, warm: 0, n: 0, prev: 0, on: opts.watchdog !== false, steps: 0 };
    function wdReset() { wd.over = 0; wd.under = 0; wd.prev = 0; wd.ema = 16.7; wd.n = 0; }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', wdReset);
    function watchdog() {
      if (!wd.on) return;
      const now = performance.now();
      const dtMs = wd.prev ? now - wd.prev : 16.7;
      wd.prev = now;
      if (dtMs > 120 || document.hidden) { wd.over = 0; wd.under = 0; return; }  // stall / background tab
      if (wd.warm < 1500) { wd.warm += dtMs; return; }                           // ignore shader warm-up
      wd.ema = wd.ema * 0.9 + dtMs * 0.1; wd.n++;
      if (wd.ema > 22) { wd.over += dtMs; wd.under = 0; } else { wd.under += dtMs; wd.over = 0; }
      if (wd.over > 2000 && wd.n > 60 && wd.steps < 2) {          // sustained < ~45fps for 2s
        wd.steps++; wdReset();
        if (wd.steps === 1) setQuality('low'); else setBloom(false);
        if (opts.onQuality) opts.onQuality(quality, bloomOn);
      } else if (wd.under > 8000 && wd.steps > 0 && wd.ema < 13) { // comfortably fast again
        wd.steps--; wdReset();
        if (wd.steps === 0) setQuality('high'); else setBloom(true);
        if (opts.onQuality) opts.onQuality(quality, bloomOn);
      }
    }

    // --- controls ---
    let lastCss = { w: 0, h: 0 };
    function setQuality(q) {
      if (q === quality) return;
      quality = q;
      if (q === 'off') { enabled = false; clearGlow(); }
      else { enabled = true; applyGlow(); }
      if (lastCss.w) setSize(lastCss.w, lastCss.h);
    }
    function setBloom(on) { bloomOn = on; if (on) applyGlow(); else clearGlow(); }

    // --- the frame ---
    let clock = 0;
    function render(dtSec) {
      clock += (dtSec || 0.0167);
      watchdog();

      if (!enabled || !sceneRT) {                       // hard fallback: straight to canvas
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        return;
      }
      if (blendT < 1) { blendT = Math.min(1, blendT + (dtSec || 0.0167) / 0.6); applyGrade(blendT * blendT * (3 - 2 * blendT)); }

      // 1. scene -> HDR target (three forces NoToneMapping + linear here)
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);

      if (bloomOn) {
        // 2. bright pass -> L0.a
        mBright.uniforms.tSrc.value = sceneRT.texture;
        mBright.uniforms.uTexel.value.set(1 / W, 1 / H);
        draw(mBright, L[0].a);
        // 3. blur / downsample chain
        for (let i = 0; i < 3; i++) {
          const src = i === 0 ? L[0].a.texture : L[i - 1].a.texture;
          mBlur.uniforms.tSrc.value = src;
          mBlur.uniforms.uDir.value.set(1 / L[i].w, 0);
          draw(mBlur, L[i].b);
          mBlur.uniforms.tSrc.value = L[i].b.texture;
          mBlur.uniforms.uDir.value.set(0, 1 / L[i].h);
          draw(mBlur, L[i].a);
        }
      }

      // 4. composite -> canvas
      const u = mComp.uniforms;
      u.tScene.value = sceneRT.texture;
      u.tB0.value = L[0].a.texture; u.tB1.value = L[1].a.texture; u.tB2.value = L[2].a.texture;
      u.uBloom.value = bloomOn ? gradeBloom : 0;         // keep textures bound, just gate the add
      u.uExposure.value = renderer.toneMappingExposure;  // setTheme still drives this
      u.uTime.value = clock % 10;          // keep the hash argument small — highp has 24 mantissa bits
      draw(mComp, null);
    }

    function resize(cssW, cssH) { lastCss.w = cssW; lastCss.h = cssH; setSize(cssW, cssH); }

    function dispose() {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', wdReset);
      if (sceneRT) sceneRT.dispose();
      for (const l of L) { if (l) { l.a.dispose(); l.b.dispose(); } }
      geo.dispose(); mBright.dispose(); mBlur.dispose(); mComp.dispose();
      clearGlow();
    }

    function debug() {
      return {
        enabled: enabled, quality: quality, bloom: bloomOn, hdr: halfOK, webgl2: webgl2,
        size: [W, H], samples: sceneRT ? sceneRT.samples : 0,
        levels: L.map(l => l && [l.w, l.h]),
        ms: +wd.ema.toFixed(2), fps: Math.round(1000 / wd.ema), steps: wd.steps,
        // rough VRAM: sceneRT (x(samples+1)) + 6 bloom targets, RGBA16F = 8 bytes/px
        mb: +(((W * H * (sceneRT ? sceneRT.samples + 1 : 1)) + L.reduce((s, l) => s + (l ? l.w * l.h * 2 : 0), 0)) * (halfOK ? 8 : 4) / 1048576).toFixed(1)
      };
    }

    return {
      render, resize, setTheme, setQuality, setBloom, markGlow, markEmissive, applyGlow, dispose, debug,
      get enabled() { return enabled; },
      get quality() { return quality; },
      get bloom() { return bloomOn; },
      get fps() { return 1000 / wd.ema; },
      GRADE
    };
  }

  window.KQPost = { create: createPostFX, GRADE: GRADE };
})();
