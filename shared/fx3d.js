/* Kingdom Quest — the shared 3D look. three.js r160 core only (no addons, no downloaded assets).
   Every 3D surface renders through this file so the meadow, the realms, the encounter rooms, the world stages and the
   underworld ride share one lighting language, one colour grade and one set of in-world UI objects.
     KQ3D.post(renderer, scene, camera, opts) → HDR compositor: bloom → ACES → lift/gamma/gain → split-tone → vignette → grain,
                                               plus an optional tilt-shift (the miniature look on the meadow)
     KQ3D.env(renderer, look)                → PMREM environment (sky dome + soft boxes): metal, enamel and glass reflect it
     KQ3D.text(str, opts)                    → crisp canvas texture with fitted, wrapped, RTL-aware type
     KQ3D.tablet(label, opts)                → the answer token: a bevelled gold-rimmed enamel tablet with the answer on its face
     KQ3D.medallion(icon, opts)              → a gilded medallion carrying an atlas icon (world emblems, rewards)
     KQ3D.banner(opts)                       → the floating question plaque every room hangs over its stage
     KQ3D.GRADES                             → the named colour grades
   The chess hall keeps its own copy of the compositor (chess/postfx.js); this one adds the tilt-shift and the grade table. */
(function () {
  'use strict';
  const T = window.THREE; if (!T) return;
  const lerp = (a, b, t) => a + (b - a) * t;
  const UI_LAYER = 1;   /* the in-world interface (plaques, answer tablets) — rendered in its own pass when post() is given { ui: true } */

  /* ------------------------------------------------------------------ grades */
  const G = (o) => Object.assign({ bloom: 0.45, threshold: 0.95, knee: 0.55, w: [1.0, 0.8, 0.6], lift: [0.006, 0.006, 0.008], gain: [1, 1, 1], gamma: [1, 1, 1], shadow: [0.98, 0.99, 1.02], high: [1.02, 1.0, 0.97], contrast: 0.18, sat: 1.0, vig: 0.38, vigIn: 0.32, vigOut: 0.98, ca: 0.0018, grain: 0.018, exposure: null }, o);
  const GRADES = {
    day:    G({ bloom: 0.16, threshold: 1.45, knee: 0.4, shadow: [0.97, 0.99, 1.04], high: [1.03, 1.01, 0.96], contrast: 0.16, sat: 1.08, vig: 0.32, grain: 0.012 }),
    golden: G({ bloom: 0.34, threshold: 1.0, knee: 0.45, shadow: [0.94, 0.96, 1.07], high: [1.09, 1.0, 0.86], contrast: 0.22, sat: 1.14, vig: 0.4, grain: 0.012 }),   /* the richer meadow (?look=rich) */
    dusk:   G({ bloom: 0.55, threshold: 0.9, shadow: [0.94, 0.95, 1.08], high: [1.06, 1.0, 0.92], contrast: 0.2, sat: 1.06, vig: 0.42 }),
    night:  G({ bloom: 0.9, threshold: 0.62, knee: 0.5, w: [1, 0.9, 0.75], lift: [0.012, 0.016, 0.03], shadow: [0.9, 0.97, 1.14], high: [1.08, 1.0, 0.88], contrast: 0.2, sat: 1.0, vig: 0.5, grain: 0.02 }),
    sky:    G({ bloom: 0.2, threshold: 1.35, knee: 0.4, lift: [0.01, 0.012, 0.018], shadow: [0.97, 1.0, 1.05], high: [1.03, 1.01, 0.97], contrast: 0.14, sat: 1.1, vig: 0.28, grain: 0.01 }),
    cloud:  G({ bloom: 0.22, threshold: 1.3, knee: 0.4, lift: [0.02, 0.016, 0.02], shadow: [1.02, 0.97, 1.04], high: [1.03, 1.0, 1.0], contrast: 0.1, sat: 1.04, vig: 0.26, grain: 0.01 }),
    ocean:  G({ bloom: 0.62, threshold: 0.82, lift: [0.0, 0.012, 0.02], shadow: [0.9, 1.0, 1.1], high: [0.98, 1.03, 1.02], contrast: 0.2, sat: 1.06, vig: 0.5 }),
    pirate: G({ bloom: 0.95, threshold: 0.6, knee: 0.5, w: [1, 0.95, 0.8], lift: [0.004, 0.012, 0.018], shadow: [0.86, 1.0, 1.12], high: [1.12, 1.0, 0.84], contrast: 0.26, sat: 1.08, vig: 0.58, grain: 0.024 }),
    skull:  G({ bloom: 0.8, threshold: 0.7, knee: 0.5, w: [1, 0.95, 0.85], lift: [0.012, 0.004, 0.02], shadow: [0.96, 0.9, 1.14], high: [0.96, 1.08, 0.9], contrast: 0.28, sat: 0.96, vig: 0.62, grain: 0.03 }),
    demon:  G({ bloom: 0.85, threshold: 0.7, shadow: [1.06, 0.92, 0.92], high: [1.1, 0.96, 0.86], contrast: 0.26, sat: 1.0, vig: 0.6, grain: 0.028 }),
    warm:   G({ bloom: 0.7, threshold: 0.78, shadow: [0.93, 0.97, 1.08], high: [1.08, 1.0, 0.9], contrast: 0.22, sat: 1.05, vig: 0.5, grain: 0.02 }),
    cool:   G({ bloom: 0.75, threshold: 0.74, shadow: [0.9, 0.98, 1.12], high: [1.04, 1.02, 0.96], contrast: 0.2, sat: 1.02, vig: 0.5, grain: 0.02 }),
    magic:  G({ bloom: 0.9, threshold: 0.66, shadow: [0.98, 0.9, 1.14], high: [1.06, 1.0, 1.02], contrast: 0.2, sat: 1.1, vig: 0.5, grain: 0.02 }),
    bright: G({ bloom: 0.3, threshold: 1.15, shadow: [0.98, 0.99, 1.03], high: [1.03, 1.01, 0.97], contrast: 0.14, sat: 1.06, vig: 0.3, grain: 0.012 })
  };

  /* ------------------------------------------------------------------ GLSL */
  const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const LUMA = 'float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }';
  const BRIGHT = ['uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee; uniform float uClamp; varying vec2 vUv;', LUMA,
    'vec3 f(vec2 uv){ return min(texture2D(tSrc, uv).rgb, vec3(uClamp)); }',
    'void main(){ vec3 a=f(vUv+uTexel*vec2(-1.,-1.)), b=f(vUv+uTexel*vec2(1.,-1.)), c=f(vUv+uTexel*vec2(-1.,1.)), d=f(vUv+uTexel*vec2(1.,1.));',
    ' float wa=1./(1.+luma(a)), wb=1./(1.+luma(b)), wc=1./(1.+luma(c)), wd=1./(1.+luma(d)); vec3 col=(a*wa+b*wb+c*wc+d*wd)/max(wa+wb+wc+wd,1e-5);',
    ' float l=luma(col); float s=clamp(l-uThreshold+uKnee,0.,2.*uKnee); s=s*s/(4.*uKnee+1e-5); gl_FragColor=vec4(col*max(s,l-uThreshold)/max(l,1e-5),1.); }'].join('\n');
  const BLUR = ['uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;',
    'void main(){ vec4 c=texture2D(tSrc,vUv)*0.2270270270; c+=texture2D(tSrc,vUv+uDir*1.3846153846)*0.3162162162; c+=texture2D(tSrc,vUv-uDir*1.3846153846)*0.3162162162;',
    ' c+=texture2D(tSrc,vUv+uDir*3.2307692308)*0.0702702703; c+=texture2D(tSrc,vUv-uDir*3.2307692308)*0.0702702703; gl_FragColor=c; }'].join('\n');
  const COPY = 'uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tSrc, vUv); }';
  const COMP = ['uniform sampler2D tScene, tB0, tB1, tB2, tD0, tD1, tUI; uniform vec3 uBloomW; uniform float uBloom, uExposure, uCA, uUI; uniform vec3 uLift, uGain, uInvGamma, uShadow, uHigh;',
    'uniform float uContrast, uSat, uVig, uVigIn, uVigOut, uGrain, uTime, uAspect, uTilt, uTiltC, uTiltIn, uTiltOut; uniform vec2 uRes; varying vec2 vUv;', LUMA,
    'vec3 RRT(vec3 v){ vec3 a=v*(v+0.0245786)-0.000090537; vec3 b=v*(0.983729*v+0.4329510)+0.238081; return a/b; }',
    'vec3 ACES(vec3 c, float e){ const mat3 I=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));',
    ' const mat3 O=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602)); c*=e/0.6; c=I*c; c=RRT(c); c=O*c; return clamp(c,0.,1.); }',
    'float h21(vec2 p){ p=fract(p*vec2(443.8975,441.4237)); p+=dot(p,p+19.19); return fract((p.x+p.y)*p.x); }',
    'void main(){ vec2 d=(vUv-0.5)*vec2(uAspect,1.); float r2=dot(d,d); vec2 off=(vUv-0.5)*r2*uCA; vec3 col;',
    ' col.r=texture2D(tScene,vUv+off).r; col.g=texture2D(tScene,vUv).g; col.b=texture2D(tScene,vUv-off).b;',
    ' if (uTilt > 0.0) { float k = smoothstep(uTiltIn, uTiltOut, abs(vUv.y - uTiltC)) * uTilt; vec3 b1 = texture2D(tD0, vUv).rgb, b2 = texture2D(tD1, vUv).rgb; col = mix(col, mix(b1, b2, smoothstep(0.35, 1.0, k)), clamp(k * 1.4, 0.0, 1.0)); }',
    ' col += (texture2D(tB0,vUv).rgb*uBloomW.x + texture2D(tB1,vUv).rgb*uBloomW.y + texture2D(tB2,vUv).rgb*uBloomW.z) * uBloom;',
    ' col = ACES(col, uExposure);',
    ' col = pow(max(col*(uGain-uLift)+uLift, vec3(0.)), uInvGamma); col = mix(col, col*col*(3.-2.*col), uContrast);',
    ' float l=luma(col); col *= mix(uShadow, uHigh, smoothstep(0.12,0.78,l)); col = mix(vec3(luma(col)), col, uSat);',
    ' float v = 1. - smoothstep(uVigIn, uVigOut, length(d)); col *= mix(1., v, uVig);',
    ' vec4 ui = uUI > 0.5 ? texture2D(tUI, vUv) : vec4(0.); if (ui.a > 0.001) { vec3 u = ACES(ui.rgb / ui.a, uExposure); col = mix(col, u, clamp(ui.a, 0., 1.)); }',   /* the interface: tone-mapped like the room, but no bloom halo, no colour fringe, no vignette */
    ' gl_FragColor = vec4(clamp(col,0.,1.),1.);',
    ' #include <colorspace_fragment>',
    ' float n1=h21(vUv*uRes+vec2(uTime*13.7,uTime*7.3)), n2=h21(vUv*uRes+vec2(17.3-uTime*5.1,91.7+uTime*11.9)); float g=(n1+n2-1.)*uGrain; g*=1.-0.55*luma(gl_FragColor.rgb); g*=1.-clamp(ui.a,0.,1.); gl_FragColor.rgb+=g; }'].join('\n');

  function quad() { const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)); g.setAttribute('uv', new T.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)); return g; }

  /* ------------------------------------------------------------------ the compositor */
  function post(renderer, scene, camera, opts) {
    opts = opts || {};
    const caps = renderer.capabilities, webgl2 = caps.isWebGL2 !== false;
    const halfOK = webgl2 ? (renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float')) : (renderer.extensions.has('OES_texture_half_float_linear') && renderer.extensions.has('EXT_color_buffer_half_float'));
    const TYPE = halfOK ? T.HalfFloatType : T.UnsignedByteType, ldr = !halfOK;
    let quality = opts.quality || 'high', enabled = quality !== 'off';
    const msaa = Math.min(opts.msaa == null ? 4 : opts.msaa, caps.maxSamples || 0), maxDpr = opts.maxPixelRatio || 2;
    const rtOpts = { type: TYPE, format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: true, stencilBuffer: false, generateMipmaps: false };
    const mk = (w, h, x) => { const rt = new T.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), Object.assign({}, rtOpts, x || {})); rt.texture.colorSpace = T.NoColorSpace; return rt; };
    let sceneRT = null, uiRT = null; const L = [], D = []; let W = 1, H = 1, cssW = 0, cssH = 0; const UIon = !!opts.ui;
    const geo = quad(), qScene = new T.Scene(), qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), qMesh = new T.Mesh(geo, null); qMesh.frustumCulled = false; qScene.add(qMesh);
    const base = { depthTest: false, depthWrite: false, toneMapped: false };
    const mBright = new T.ShaderMaterial(Object.assign({ vertexShader: VERT, fragmentShader: BRIGHT, uniforms: { tSrc: { value: null }, uTexel: { value: new T.Vector2() }, uThreshold: { value: 0.9 }, uKnee: { value: 0.55 }, uClamp: { value: 24 } } }, base));
    const mBlur = new T.ShaderMaterial(Object.assign({ vertexShader: VERT, fragmentShader: BLUR, uniforms: { tSrc: { value: null }, uDir: { value: new T.Vector2() } } }, base));
    const mCopy = new T.ShaderMaterial(Object.assign({ vertexShader: VERT, fragmentShader: COPY, uniforms: { tSrc: { value: null } } }, base));
    const U = { tUI: { value: null }, uUI: { value: 0 }, tScene: { value: null }, tB0: { value: null }, tB1: { value: null }, tB2: { value: null }, tD0: { value: null }, tD1: { value: null }, uBloomW: { value: new T.Vector3(1, 0.8, 0.6) }, uBloom: { value: 0.5 }, uExposure: { value: 1 }, uCA: { value: 0.002 },
      uLift: { value: new T.Vector3() }, uGain: { value: new T.Vector3(1, 1, 1) }, uInvGamma: { value: new T.Vector3(1, 1, 1) }, uShadow: { value: new T.Vector3(1, 1, 1) }, uHigh: { value: new T.Vector3(1, 1, 1) },
      uContrast: { value: 0.2 }, uSat: { value: 1 }, uVig: { value: 0.4 }, uVigIn: { value: 0.32 }, uVigOut: { value: 0.98 }, uGrain: { value: 0.02 }, uTime: { value: 0 }, uRes: { value: new T.Vector2(1, 1) }, uAspect: { value: 1 },
      uTilt: { value: opts.tilt || 0 }, uTiltC: { value: opts.tiltCenter == null ? 0.46 : opts.tiltCenter }, uTiltIn: { value: opts.tiltIn == null ? 0.16 : opts.tiltIn }, uTiltOut: { value: opts.tiltOut == null ? 0.5 : opts.tiltOut } };
    const mComp = new T.ShaderMaterial(Object.assign({ vertexShader: VERT, fragmentShader: COMP, uniforms: U }, base));
    const draw = (m, target) => { qMesh.material = m; renderer.setRenderTarget(target || null); renderer.render(qScene, qCam); };
    function setSize(w, h) {
      cssW = w; cssH = h; const dpr = Math.min(renderer.getPixelRatio(), maxDpr); W = Math.max(1, Math.round(w * dpr)); H = Math.max(1, Math.round(h * dpr));
      const samples = webgl2 ? (quality === 'high' ? msaa : quality === 'low' ? Math.min(msaa, 2) : 0) : 0;
      if (sceneRT && sceneRT.samples !== samples) { sceneRT.dispose(); sceneRT = null; }
      if (!sceneRT) sceneRT = mk(W, H, { samples }); else sceneRT.setSize(W, H);
      if (UIon) { if (uiRT && uiRT.samples !== samples) { uiRT.dispose(); uiRT = null; } if (!uiRT) uiRT = mk(W, H, { samples }); else uiRT.setSize(W, H); }
      const div = quality === 'low' ? [4, 8, 16] : [2, 4, 8];
      for (let i = 0; i < 3; i++) { const a = Math.max(1, Math.round(W / div[i])), b = Math.max(1, Math.round(H / div[i])); if (!L[i]) L[i] = { a: mk(a, b, { depthBuffer: false }), b: mk(a, b, { depthBuffer: false }), w: a, h: b }; else { L[i].a.setSize(a, b); L[i].b.setSize(a, b); L[i].w = a; L[i].h = b; } }
      for (let i = 0; i < 2; i++) { const dv = i ? 4 : 2, a = Math.max(1, Math.round(W / dv)), b = Math.max(1, Math.round(H / dv)); if (!D[i]) D[i] = { a: mk(a, b, { depthBuffer: false }), b: mk(a, b, { depthBuffer: false }), w: a, h: b }; else { D[i].a.setSize(a, b); D[i].b.setSize(a, b); D[i].w = a; D[i].h = b; } }
      U.uRes.value.set(W, H); U.uAspect.value = W / H;
    }
    /* grade with a cross-fade */
    let cur = JSON.parse(JSON.stringify(GRADES[opts.grade] || GRADES.day)), dst = cur, blendT = 1, bloomMaster = cur.bloom;
    const snap = () => ({ bloom: bloomMaster, threshold: mBright.uniforms.uThreshold.value, knee: mBright.uniforms.uKnee.value, w: U.uBloomW.value.toArray(), lift: U.uLift.value.toArray(), gain: U.uGain.value.toArray(), gamma: [1 / U.uInvGamma.value.x, 1 / U.uInvGamma.value.y, 1 / U.uInvGamma.value.z], shadow: U.uShadow.value.toArray(), high: U.uHigh.value.toArray(), contrast: U.uContrast.value, sat: U.uSat.value, vig: U.uVig.value, vigIn: U.uVigIn.value, vigOut: U.uVigOut.value, ca: U.uCA.value, grain: U.uGrain.value });
    function apply(t) {
      const a = cur, b = dst, V = (k, i) => lerp(a[k][i], b[k][i], t);
      bloomMaster = lerp(a.bloom, b.bloom, t); mBright.uniforms.uThreshold.value = lerp(a.threshold, b.threshold, t) * (ldr ? 0.55 : 1); mBright.uniforms.uKnee.value = lerp(a.knee, b.knee, t);
      U.uBloomW.value.set(V('w', 0), V('w', 1), V('w', 2)); U.uLift.value.set(V('lift', 0), V('lift', 1), V('lift', 2)); U.uGain.value.set(V('gain', 0), V('gain', 1), V('gain', 2));
      U.uInvGamma.value.set(1 / V('gamma', 0), 1 / V('gamma', 1), 1 / V('gamma', 2)); U.uShadow.value.set(V('shadow', 0), V('shadow', 1), V('shadow', 2)); U.uHigh.value.set(V('high', 0), V('high', 1), V('high', 2));
      U.uContrast.value = lerp(a.contrast, b.contrast, t); U.uSat.value = lerp(a.sat, b.sat, t); U.uVig.value = lerp(a.vig, b.vig, t); U.uVigIn.value = lerp(a.vigIn, b.vigIn, t); U.uVigOut.value = lerp(a.vigOut, b.vigOut, t); U.uCA.value = lerp(a.ca, b.ca, t); U.uGrain.value = lerp(a.grain, b.grain, t);
    }
    apply(1);
    function setGrade(g, instant) { const d = typeof g === 'string' ? GRADES[g] : G(g || {}); if (!d) return; if (instant) { cur = JSON.parse(JSON.stringify(d)); dst = cur; blendT = 1; apply(1); return; } cur = snap(); dst = d; blendT = 0; }
    /* watchdog: sustained slow frames step quality down (high → low → bloom off), fast frames step it back */
    const wd = { ema: 16.7, over: 0, under: 0, warm: 0, prev: 0, steps: 0, on: opts.watchdog !== false };
    let bloomOn = true;
    function watchdog() {
      if (!wd.on) return; const now = performance.now(), dt = wd.prev ? now - wd.prev : 16.7; wd.prev = now;
      if (dt > 120 || document.hidden) { wd.over = wd.under = 0; return; } if (wd.warm < 1800) { wd.warm += dt; return; }
      wd.ema = wd.ema * 0.9 + dt * 0.1; if (wd.ema > 24) { wd.over += dt; wd.under = 0; } else { wd.under += dt; wd.over = 0; }
      if (wd.over > 2200 && wd.steps < 2) { wd.steps++; wd.over = 0; if (wd.steps === 1) setQuality('low'); else bloomOn = false; }
      else if (wd.under > 9000 && wd.steps > 0 && wd.ema < 13) { wd.steps--; wd.under = 0; if (wd.steps === 0) setQuality('high'); else bloomOn = true; }
    }
    function setQuality(q) { if (q === quality) return; quality = q; enabled = q !== 'off'; if (cssW) setSize(cssW, cssH); }
    /* the interface pass: plaques and answer tablets live on UI_LAYER; they are drawn into their own target after the room and
       blended in at the very end, so the room's bloom never haloes the words (Yoni 2026-09-24: 'too much fuzziness around the
       question — unreadable'). Every light also joins UI_LAYER, so the tablets stay lit exactly as before. */
    let uiScan = -1, uiKids = -1; const clearC = new T.Color();
    function uiPass() {
      if (++uiScan % 60 === 0 || scene.children.length !== uiKids) { uiKids = scene.children.length; scene.traverse(o => { if (o.isLight) o.layers.enable(UI_LAYER); }); }
      const bg = scene.background, mask = camera.layers.mask, auto = renderer.shadowMap.autoUpdate; renderer.getClearColor(clearC); const ca = renderer.getClearAlpha();
      scene.background = null; camera.layers.set(UI_LAYER); renderer.shadowMap.autoUpdate = false; renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(uiRT); renderer.clear(true, true, false); renderer.render(scene, camera);
      renderer.setClearColor(clearC, ca); renderer.shadowMap.autoUpdate = auto; camera.layers.mask = mask; scene.background = bg; }
    let clock = 0;
    function render(dt) {
      clock += dt || 0.0167; watchdog();
      if (!enabled || !sceneRT) { renderer.setRenderTarget(null); if (UIon) camera.layers.enable(UI_LAYER); renderer.render(scene, camera); if (UIon) camera.layers.disable(UI_LAYER); return; }
      if (blendT < 1) { blendT = Math.min(1, blendT + (dt || 0.0167) / 0.8); apply(blendT * blendT * (3 - 2 * blendT)); }
      renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
      if (bloomOn) {
        mBright.uniforms.tSrc.value = sceneRT.texture; mBright.uniforms.uTexel.value.set(1 / W, 1 / H); draw(mBright, L[0].a);
        for (let i = 0; i < 3; i++) { mBlur.uniforms.tSrc.value = i === 0 ? L[0].a.texture : L[i - 1].a.texture; mBlur.uniforms.uDir.value.set(1 / L[i].w, 0); draw(mBlur, L[i].b); mBlur.uniforms.tSrc.value = L[i].b.texture; mBlur.uniforms.uDir.value.set(0, 1 / L[i].h); draw(mBlur, L[i].a); }
      }
      if (U.uTilt.value > 0) {   /* tilt-shift: a half-res and a quarter-res blurred copy of the frame */
        mCopy.uniforms.tSrc.value = sceneRT.texture; draw(mCopy, D[0].a);
        for (let i = 0; i < 2; i++) {
          if (i === 1) { mCopy.uniforms.tSrc.value = D[0].a.texture; draw(mCopy, D[1].a); }
          mBlur.uniforms.tSrc.value = D[i].a.texture; mBlur.uniforms.uDir.value.set(1.5 / D[i].w, 0); draw(mBlur, D[i].b);
          mBlur.uniforms.tSrc.value = D[i].b.texture; mBlur.uniforms.uDir.value.set(0, 1.5 / D[i].h); draw(mBlur, D[i].a);
        }
      }
      U.tScene.value = sceneRT.texture; U.tB0.value = L[0].a.texture; U.tB1.value = L[1].a.texture; U.tB2.value = L[2].a.texture; U.tD0.value = D[0].a.texture; U.tD1.value = D[1].a.texture;
      U.uBloom.value = bloomOn ? bloomMaster : 0; U.uExposure.value = renderer.toneMappingExposure; U.uTime.value = clock % 10;
      if (UIon && uiRT) { uiPass(); U.tUI.value = uiRT.texture; U.uUI.value = 1; } else U.uUI.value = 0;
      draw(mComp, null);
    }
    function dispose() { if (sceneRT) sceneRT.dispose(); if (uiRT) uiRT.dispose(); for (const l of L.concat(D)) if (l) { l.a.dispose(); l.b.dispose(); } geo.dispose(); mBright.dispose(); mBlur.dispose(); mCopy.dispose(); mComp.dispose(); }
    return { render, resize: setSize, setGrade, setQuality, dispose, uniforms: U, setTilt(v, c) { U.uTilt.value = v; if (c != null) U.uTiltC.value = c; }, get quality() { return quality; }, get fps() { return 1000 / wd.ema; }, debug: () => ({ hdr: halfOK, webgl2, size: [W, H], samples: sceneRT ? sceneRT.samples : 0, quality, bloom: bloomOn, fps: Math.round(1000 / wd.ema) }) };
  }

  /* ------------------------------------------------------------------ environment */
  function env(renderer, look) {
    look = look || {};
    const s = new T.Scene(), geo = new T.SphereGeometry(10, 48, 24);
    const mat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { top: { value: new T.Color(look.top == null ? 0x8fb8f0 : look.top) }, mid: { value: new T.Color(look.horizon == null ? 0xf6e8d2 : look.horizon) }, bot: { value: new T.Color(look.ground == null ? 0x3a3024 : look.ground) }, k: { value: look.intensity == null ? 1 : look.intensity } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform float k; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.75, h)) : mix(mid, bot, smoothstep(0.0, 0.3, -h)); gl_FragColor = vec4(c * k, 1.0); }' });
    s.add(new T.Mesh(geo, mat));
    const boxes = look.boxes || [{ c: 0xfff1dc, i: 5, p: [5, 6, 4], s: [5, 3] }, { c: 0xbfd6ff, i: 2.4, p: [-6, 3, -3], s: [4, 4] }, { c: 0xffffff, i: 1.6, p: [0, 8, -6], s: [8, 2] }];
    const extra = [];
    for (const b of boxes) { const g = new T.PlaneGeometry(b.s[0], b.s[1]), m = new T.MeshBasicMaterial({ color: new T.Color(b.c).multiplyScalar(b.i), side: T.DoubleSide }); const q = new T.Mesh(g, m); q.position.set(b.p[0], b.p[1], b.p[2]); q.lookAt(0, 0, 0); s.add(q); extra.push(g, m); }
    const pm = new T.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.035); pm.dispose(); geo.dispose(); mat.dispose(); for (const e of extra) e.dispose();
    return rt.texture;
  }
  /* every Standard/Physical material under root gets the same reflection strength (r160 has no scene-wide knob) */
  function envStrength(root, k, filter) { root.traverse(o => { if (!o.isMesh && !o.isInstancedMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) if (m && m.isMeshStandardMaterial && (!filter || filter(m))) { if (m.userData.envK == null) m.userData.envK = m.envMapIntensity; m.envMapIntensity = (m.userData.envK == null ? 1 : m.userData.envK) * k; } }); }

  /* a tangent-space normal map from any canvas (its luminance is read as height) */
  function normalFrom(src, strength) {
    const W = src.width, H = src.height, sx = src.getContext('2d').getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) h[i] = (sx[i * 4] * 0.3 + sx[i * 4 + 1] * 0.59 + sx[i * 4 + 2] * 0.11) / 255;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), k = strength == null ? 2.5 : strength;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = h[y * W + (x + 1) % W] - h[y * W + (x - 1 + W) % W], dy = h[((y + 1) % H) * W + x] - h[((y - 1 + H) % H) * W + x]; let nx = -dx * k, ny = dy * k, nz = 1; const l = Math.hypot(nx, ny, nz); const i = (y * W + x) * 4; img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255; }
    ctx.putImageData(img, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace; return t;
  }
  /* screen → world: a point at normalised screen coords (-1..1) and a given distance from the camera, for a camera pose that
     has not been applied yet (so in-world UI can be laid out for the resting camera, not the swaying one) */
  function screenPoint(camPos, lookAt, fov, aspect, nx, ny, dist) {
    const f = new T.Vector3().subVectors(lookAt, camPos).normalize(), r = new T.Vector3().crossVectors(f, new T.Vector3(0, 1, 0)).normalize(), u = new T.Vector3().crossVectors(r, f);
    const th = Math.tan(fov * Math.PI / 360); return camPos.clone().addScaledVector(f, dist).addScaledVector(r, nx * th * aspect * dist).addScaledVector(u, ny * th * dist);
  }
  function floorPoint(camPos, lookAt, fov, aspect, nx, ny, y) {
    const p = screenPoint(camPos, lookAt, fov, aspect, nx, ny, 1), d = p.sub(camPos); const t = (y - camPos.y) / (d.y || -1e-6); return camPos.clone().addScaledVector(d, t > 0 ? t : 10);
  }
  /* ------------------------------------------------------------------ type */
  const HEB = /[֐-׿]/;
  const fontsReady = (spec) => (document.fonts && document.fonts.load) ? document.fonts.load(spec).catch(() => null) : Promise.resolve(null);
  function wrap(ctx, str, maxW) { const words = String(str).split(/[ \t\r\n]+/), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  function paintText(ctx, str, o) {
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.clearRect(0, 0, W, H);
    if (o.paint) o.paint(ctx, W, H);
    str = String(str == null ? '' : str).replace(/(?:\p{Regional_Indicator}{2})|(?:\p{Extended_Pictographic}[\uFE0F\uFE0E]?(?:\u200D\p{Extended_Pictographic}[\uFE0F\uFE0E]?)*)/gu, '').replace(/\s{2,}/g, ' ').trim(); if (!str) return;   /* in-world type never draws an emoji */
    const rtl = HEB.test(str); ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const family = rtl && o.fontHe ? o.fontHe : o.font;
    const cx = W / 2 + (o.offX || 0) * W, padX = W * o.padX, padY = H * o.padY, maxW = W - padX * 2 - Math.abs(o.offX || 0) * 2 * W, maxH = H - padY * 2;
    let size = Math.floor(maxH * o.max), lines = [str];
    for (; size > 10; size -= Math.max(1, Math.round(size * 0.06))) {
      ctx.font = o.weight + ' ' + size + 'px ' + family;
      lines = o.lines > 1 ? wrap(ctx, str, maxW) : [str];
      const widest = Math.max(...lines.map(l => ctx.measureText(l).width)), total = lines.length * size * o.leading;
      if (lines.length <= o.lines && widest <= maxW && total <= maxH) break;
    }
    const lh = size * o.leading, y0 = H / 2 - (lines.length - 1) * lh / 2 + (o.dy || 0) * H;
    lines.forEach((l, i) => {
      const y = y0 + i * lh;
      if (o.shadow) { ctx.save(); ctx.shadowColor = o.shadow; ctx.shadowBlur = size * 0.18; ctx.shadowOffsetY = size * 0.05; ctx.fillStyle = o.color; ctx.fillText(l, cx, y); ctx.restore(); }
      if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * o.strokeW; ctx.strokeStyle = o.stroke; ctx.strokeText(l, cx, y); }
      if (o.gradient) { const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2); o.gradient.forEach((c, k) => g.addColorStop(k / (o.gradient.length - 1), c)); ctx.fillStyle = g; } else ctx.fillStyle = o.color;
      ctx.fillText(l, cx, y);
    });
  }
  function text(str, opts) {
    const o = Object.assign({ w: 1024, h: 256, font: '"Rubik", "Arial Hebrew", sans-serif', fontHe: '"Assistant", "Rubik", "Arial Hebrew", sans-serif', weight: 800, color: '#fff6e0', stroke: null, strokeW: 0.1, shadow: 'rgba(0,0,0,.55)', max: 0.72, padX: 0.06, padY: 0.12, lines: 1, leading: 1.08, gradient: null, paint: null }, opts || {});
    const c = document.createElement('canvas'); c.width = o.w; c.height = o.h; const ctx = c.getContext('2d');
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 8; tx.generateMipmaps = true; tx.minFilter = T.LinearMipmapLinearFilter;
    let cur = str; const redraw = () => { paintText(ctx, cur, o); tx.needsUpdate = true; };
    redraw(); const fam = String(o.font).split(',')[0].trim(); fontsReady(o.weight + ' 64px ' + fam).then(redraw); if (o.fontHe) fontsReady(o.weight + ' 64px ' + String(o.fontHe).split(',')[0].trim()).then(redraw);
    tx.userData.set = s => { cur = s; redraw(); }; tx.userData.opts = o; tx.userData.canvas = c;
    return tx;
  }

  /* ------------------------------------------------------------------ shared shapes + materials */
  function roundRect(w, h, r) { const s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
  function uv01(geo) { geo.computeBoundingBox(); const b = geo.boundingBox, p = geo.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - b.min.x) / (b.max.x - b.min.x || 1); uv[i * 2 + 1] = (p.getY(i) - b.min.y) / (b.max.y - b.min.y || 1); } geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); return geo; }
  const MAT = {
    gold: () => new T.MeshStandardMaterial({ color: 0xe9c46a, metalness: 1, roughness: 0.26 }),
    goldDeep: () => new T.MeshStandardMaterial({ color: 0xc8962e, metalness: 1, roughness: 0.34 }),
    silver: () => new T.MeshStandardMaterial({ color: 0xdfe4ee, metalness: 1, roughness: 0.22 }),
    bronze: () => new T.MeshStandardMaterial({ color: 0xc07a3e, metalness: 1, roughness: 0.32 }),
    enamel: (c) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12 })
  };
  const hex = c => '#' + new T.Color(c).getHexString();
  const shade = (c, k) => { const x = new T.Color(c); return '#' + x.multiplyScalar(k).getHexString(); };
  function facePaint(face, trim) {
    return (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shade(face, 1.35)); g.addColorStop(0.5, hex(face)); g.addColorStop(1, shade(face, 0.62)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const r = ctx.createRadialGradient(W * 0.5, H * 0.1, 2, W * 0.5, H * 0.1, W * 0.7); r.addColorStop(0, 'rgba(255,255,255,0.22)'); r.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = trim || 'rgba(255,220,150,0.55)'; ctx.lineWidth = Math.max(2, H * 0.025); const m = H * 0.07; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    };
  }

  /* ------------------------------------------------------------------ the answer tablet */
  const STATE_FACE = { idle: null, right: 0x1f8a4c, wrong: 0x8a1f2a, reveal: 0x1f8a4c, dim: 0x2a2630 };
  function tablet(label, opts) {
    const o = Object.assign({ w: 2.3, h: 1.05, depth: 0.14, r: 0.3, face: 0x1c2140, rim: 'gold', color: '#fff3d4', glow: 0xffd27a, font: '"Rubik", "Arial Hebrew", sans-serif', px: 512 }, opts || {});
    const g = new T.Group();
    const bodyGeo = new T.ExtrudeGeometry(roundRect(o.w, o.h, o.r), { depth: o.depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.07, bevelSegments: 5, curveSegments: 12 }); bodyGeo.translate(0, 0, -o.depth / 2);
    const rimMat = (MAT[o.rim] || MAT.gold)(); rimMat.emissive = new T.Color(o.glow); rimMat.emissiveIntensity = 0;
    const body = new T.Mesh(bodyGeo, rimMat); body.castShadow = true; g.add(body);
    const faceGeo = uv01(new T.ShapeGeometry(roundRect(o.w - 0.24, o.h - 0.24, o.r * 0.62), 12));
    const H = Math.round(o.px * (o.h - 0.24) / (o.w - 0.24));
    const tex = text(label, { w: o.px, h: H, font: o.font, weight: 800, color: o.color, max: 0.88, padX: 0.08, padY: 0.16, lines: 2, shadow: 'rgba(0,0,0,.6)', paint: facePaint(o.face) });   /* start big: a short answer fills the face, long ones still shrink and wrap to fit */
    const faceMat = new T.MeshPhysicalMaterial({ map: tex, roughness: 0.5, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.45, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22 });
    const face = new T.Mesh(faceGeo, faceMat); face.position.z = o.depth / 2 + 0.061; face.userData.face = true; g.add(face);
    const back = new T.Mesh(faceGeo, MAT.enamel(o.face)); back.position.z = -o.depth / 2 - 0.061; back.rotation.y = Math.PI; g.add(back);
    const hit = new T.Mesh(new T.BoxGeometry(o.w + 0.2, o.h + 0.2, o.depth + 0.4), new T.MeshBasicMaterial({ visible: false })); g.add(hit);
    let state = 'idle';
    function setState(s) {
      state = s; const f = STATE_FACE[s];
      tex.userData.opts.paint = facePaint(f == null ? o.face : f, s === 'right' || s === 'reveal' ? 'rgba(190,255,200,0.7)' : null); tex.userData.set(label);
      rimMat.emissive.setHex(s === 'right' || s === 'reveal' ? 0x5aff9a : s === 'wrong' ? 0xff5a4a : o.glow);
      rimMat.emissiveIntensity = s === 'idle' ? 0 : s === 'dim' ? 0 : 0.9; faceMat.emissiveIntensity = s === 'dim' ? 0.05 : 0.22;
      if (s === 'dim') { rimMat.color.setHex(0x8a8070); } else rimMat.color.setHex(o.rim === 'silver' ? 0xdfe4ee : 0xe9c46a);
    }
    function setHover(on) { if (state !== 'idle') return; rimMat.emissiveIntensity = on ? 0.55 : 0; }
    function dispose() { bodyGeo.dispose(); faceGeo.dispose(); rimMat.dispose(); faceMat.dispose(); tex.dispose(); hit.geometry.dispose(); }
    g.userData.tablet = { hit, body, face, setState, setHover, dispose, label, get state() { return state; } };
    return overlay(g, 12);
  }

  /* ------------------------------------------------------------------ medallion (atlas icon on gold) */
  function medallion(icon, opts) {
    const o = Object.assign({ r: 1, depth: 0.16, face: 0x1a2446, rim: 'gold', glow: null }, opts || {});
    const g = new T.Group();
    const rimMat = (MAT[o.rim] || MAT.gold)();
    const disc = new T.Mesh(new T.CylinderGeometry(o.r, o.r, o.depth, 64), rimMat); disc.rotation.x = Math.PI / 2; disc.castShadow = true; g.add(disc);
    const ring = new T.Mesh(new T.TorusGeometry(o.r * 0.97, o.depth * 0.42, 12, 72), rimMat); g.add(ring);
    const ring2 = ring.clone(); ring2.rotation.y = Math.PI; g.add(ring2);
    const faceMat = MAT.enamel(o.face); const faceGeo = new T.CircleGeometry(o.r * 0.84, 64);
    const f1 = new T.Mesh(faceGeo, faceMat); f1.position.z = o.depth / 2 + 0.004; g.add(f1);
    const f2 = new T.Mesh(faceGeo, faceMat); f2.position.z = -o.depth / 2 - 0.004; f2.rotation.y = Math.PI; g.add(f2);
    const tex = (window.KQ && KQ.iconTexture) ? KQ.iconTexture(icon) : null;
    if (tex) { const im = new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.45, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18, alphaTest: 0.02 }); const ig = new T.PlaneGeometry(o.r * 1.34, o.r * 1.34); const a = new T.Mesh(ig, im); a.position.z = o.depth / 2 + 0.012; g.add(a); const b = new T.Mesh(ig, im); b.position.z = -o.depth / 2 - 0.012; b.rotation.y = Math.PI; g.add(b); }
    if (o.glow != null) { const s = new T.Sprite(new T.SpriteMaterial({ map: softDot(), color: o.glow, transparent: true, opacity: 0.45, depthWrite: false, blending: T.AdditiveBlending })); s.scale.setScalar(o.r * 4); s.position.z = -0.2; g.add(s); g.userData.halo = s; }
    return g;
  }
  let SOFT = null;
  function softDot() { if (SOFT) return SOFT; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const r = x.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 128, 128); SOFT = new T.CanvasTexture(c); return SOFT; }

  /* ------------------------------------------------------------------ plaques: the question banner and the host's speech plate */
  function plaque(opts) {
    const o = Object.assign({ w: 8.4, h: 2.3, face: 0x161a33, rim: 'gold', accent: '#ffd27a', chains: true, tail: null, px: 2048, max: 0.5, lines: 2, kickerSize: 0.13 }, opts || {});
    const g = new T.Group(); const rimMat = (MAT[o.rim] || MAT.gold)(); rimMat.roughness = 0.42;   /* a satin gold: no hot glint flaring over the words */
    const bodyGeo = new T.ExtrudeGeometry(roundRect(o.w, o.h, Math.min(0.34, o.h * 0.2)), { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.07, bevelSegments: 5, curveSegments: 12 }); bodyGeo.translate(0, 0, -0.07);
    const body = new T.Mesh(bodyGeo, rimMat); body.castShadow = true; g.add(body);
    const extra = [bodyGeo];
    if (o.chains) for (const s of [-1, 1]) { const fin = new T.Mesh(new T.SphereGeometry(0.2, 24, 16), rimMat); fin.position.set(s * (o.w / 2 + 0.12), 0, 0); g.add(fin); const tip = new T.Mesh(new T.ConeGeometry(0.1, 0.34, 16), rimMat); tip.rotation.z = -s * Math.PI / 2; tip.position.set(s * (o.w / 2 + 0.42), 0, 0); g.add(tip);
      const chain = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 7, 8), rimMat); chain.position.set(s * (o.w / 2 - 0.6), o.h / 2 + 3.5, -0.02); g.add(chain); extra.push(fin.geometry, tip.geometry, chain.geometry); }
    if (o.tail) { const s = o.tail === 'left' ? -1 : 1; const sh = new T.Shape(); sh.moveTo(0, 0.28); sh.lineTo(0, -0.28); sh.lineTo(s * 0.7, -0.62); sh.closePath(); const tg = new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 }); tg.translate(0, 0, -0.06); const tl = new T.Mesh(tg, rimMat); tl.position.set(s * (o.w / 2 - 0.02), -o.h * 0.08, 0); g.add(tl); extra.push(tg); }
    const faceGeo = uv01(new T.ShapeGeometry(roundRect(o.w - 0.24, o.h - 0.24, Math.min(0.24, o.h * 0.14)), 12)); extra.push(faceGeo);
    const H = Math.round(o.px * (o.h - 0.24) / (o.w - 0.24));
    let kicker = '', full = '', shown = -1, typing = null, icon = null;
    const tex = text('', { w: o.px, h: H, weight: 800, color: '#fff4dc', max: o.max, padX: 0.05, padY: o.kicker === false ? 0.14 : 0.22, lines: o.lines, dy: kicker ? 0.08 : 0.06, shadow: 'rgba(0,0,0,.6)', paint: (ctx, W, Hh) => { facePaint(o.face, 'rgba(255,215,140,0.5)')(ctx, W, Hh); if (icon && icon.im) { const sz = Hh * 0.56, rtl = HEB.test(full); ctx.drawImage(icon.im, icon.sx, icon.sy, icon.s, icon.s, rtl ? W - sz - W * 0.04 : W * 0.04, Hh * (kicker ? 0.58 : 0.5) - sz / 2, sz, sz); } if (kicker) { ctx.save(); const rtl = HEB.test(kicker); ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + Math.round(Hh * o.kickerSize) + 'px ' + (rtl ? '"Frank Ruhl Libre", "Rubik", serif' : '"Cinzel", "Rubik", serif'); ctx.fillStyle = o.accent; ctx.fillText(rtl ? kicker : kicker.toUpperCase(), W / 2, Hh * 0.2); ctx.restore(); } } });
    const faceMat = new T.MeshPhysicalMaterial({ map: tex, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3 });   /* satin enamel: no hot spot from the key light on a flat face */
    const face = new T.Mesh(faceGeo, faceMat); face.position.z = 0.07 + 0.071; face.userData.face = true; g.add(face);
    const api = {
      set(k, t, ic) { kicker = k || ''; full = t || ''; typing = null; shown = full.length; tex.userData.opts.dy = kicker ? 0.08 : 0; icon = null; tex.userData.opts.offX = 0; if (ic && window.KQ && KQ.iconImage) { const want = full; KQ.iconImage(ic).then(r => { if (r && full === want) { icon = r; tex.userData.opts.offX = HEB.test(full) ? -0.06 : 0.06; tex.userData.set(full); } }).catch(() => {}); } tex.userData.set(full); },
      type(k, t, cps) { kicker = k || ''; full = t || ''; tex.userData.opts.dy = kicker ? 0.08 : 0; typing = { i: 0, cps: cps || 38 }; shown = -1; tex.userData.set(''); },
      tick(dt) { if (!typing) return false; typing.i = Math.min(full.length, typing.i + dt * typing.cps); const n = Math.floor(typing.i); if (n !== shown) { shown = n; tex.userData.set(full.slice(0, n)); } if (n >= full.length) { typing = null; return false; } return true; },
      get typing() { return !!typing; },
      finish() { if (typing) { typing = null; shown = full.length; tex.userData.set(full); } },
      dispose() { for (const e of extra) e.dispose(); tex.dispose(); faceMat.dispose(); rimMat.dispose(); }
    };
    g.userData.plaque = api; g.userData.banner = api;
    return overlay(g, 11);
  }
  const banner = o => plaque(Object.assign({ chains: true }, o || {}));

  /* in-world interface draws on top of the room (never sunk into a floor or hidden by a door), body first, then its face */
  function overlay(g, order) { g.traverse(o => { if (!o.isMesh) return; o.renderOrder = (order || 10) + (o.userData.face ? 1 : 0); const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) if (m) { if (!m.transparent) { m.transparent = true; m.opacity = 1; } m.depthTest = false; m.depthWrite = false; } if (ms.every(m => m && m.visible !== false)) o.layers.set(UI_LAYER); }); return g; }   /* on UI_LAYER: drawn crisp, after the bloom (post opts.ui) */
  window.KQ3D = { UI_LAYER, post, env, envStrength, text, tablet, medallion, banner, plaque, roundRect, uv01, MAT, GRADES, softDot, fontsReady, normalFrom, screenPoint, floorPoint, overlay };
})();
