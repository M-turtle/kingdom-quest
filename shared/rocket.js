/* Kingdom Quest — THE ROCKET TO THE STARS: the way from the meadow into the Space realm (Yoni 2026-09-28: 'the entrance should be a
   rocket from the meadow to the stars — that goes through stratosphere, mesosphere and marks them one by one till outer space').
   A ride scene for KQRide (ride3d.js). Countdown on a launch pad in the meadow, lift-off in a cloud of smoke, then the climb through the
   five layers of the air — each one named, measured and explained as the rocket crosses into it, with a glowing boundary where it
   starts and a gauge that ticks it off:
     Troposphere  0–12 km        clouds and weather, an airliner near its top
     Stratosphere 12–50 km       the ozone layer, a weather balloon
     Mesosphere   50–85 km       the coldest layer, shooting stars burning up
     Thermosphere 85–600 km      the Kármán line (100 km), auroras, the Space Station at ~400 km, stage separation
     Exosphere    600–10,000 km  the last wisps of air, satellites, the Earth now a curved ball with a thin blue rim
     … then outer space: the stars, the Milky Way and the Moon.
   Going home (dir 'up') it runs backwards: a capsule falls through the same layers (they are marked again, top to bottom), glows with
   the heat of re-entry, opens its parachute in the troposphere and lands on the meadow.
   Heights are real (the gauge and the cards show true kilometres); the picture squeezes them (the layers are drawn on a log scale) so all
   five fit into one ride. Everything is built from primitives and shaders; sounds are synthesised live. No downloads, no cost. */
(function () {
  'use strict';
  const T = window.THREE; if (!T || !window.KQRide || !KQRide.add) return;
  const { canvas, SND, smooth, clamp, lerp, R } = KQRide.kit;
  const PI = Math.PI, TAU = PI * 2;

  /* ---------------------------------------------------------------- the layers (true heights in km) and how the picture squeezes them */
  const B = [0, 12, 50, 85, 600, 10000];
  const LAY = ['tropo', 'strato', 'meso', 'thermo', 'exo', 'space'];
  const COL = ['#6fd0ff', '#7aa8ff', '#b48cff', '#6fffb0', '#ffd27a', '#ffffff'];
  const RE = 6000;                                         /* the Earth's radius in scene units */
  const hv = p => 40 * (Math.exp(0.62 * p) - 1);           /* layer progress p (0 = ground … 5 = the top of the exosphere) → height drawn */
  const km = p => p >= 5 ? 10000 : B[Math.floor(p)] + (p - Math.floor(p)) * (B[Math.floor(p) + 1] - B[Math.floor(p)]);

  const STR = {
    en: { rk_tropo: 'Troposphere', rk_strato: 'Stratosphere', rk_meso: 'Mesosphere', rk_thermo: 'Thermosphere', rk_exo: 'Exosphere', rk_space: 'Outer space',
      rk_tropo_s: 'Tropo · sphere', rk_strato_s: 'Strato · sphere', rk_meso_s: 'Meso · sphere', rk_thermo_s: 'Thermo · sphere', rk_exo_s: 'Exo · sphere', rk_space_s: 'Outer · space',
      rk_tropo_f: 'The air we breathe. All the weather happens here: clouds, rain and wind. Airliners fly near its top.',
      rk_strato_f: 'The ozone layer is here. It blocks most of the Sun’s harmful ultraviolet light.',
      rk_meso_f: 'The coldest layer, down to about −90 °C. Shooting stars burn up here.',
      rk_thermo_f: 'At 100 km you cross the Kármán line: space officially begins! Auroras glow here and the Space Station circles at about 400 km.',
      rk_exo_f: 'The last wisps of air drift off into space. Some satellites circle the Earth up here.',
      rk_space_f: 'No air at all: just the stars, the Moon and the Sun. Welcome to space!',
      rk_space_r: 'beyond 10,000 km', rk_km: 'km', rk_alt: 'Height', rk_liftoff: 'Lift-off!', rk_home: 'Touchdown! Welcome home.', rk_party: 'Welcome home, astronauts!', rk_sep: 'Stage separation!' },
    he: { rk_tropo: 'טרופוספירה', rk_strato: 'סטרטוספירה', rk_meso: 'מזוספירה', rk_thermo: 'תרמוספירה', rk_exo: 'אקסוספירה', rk_space: 'החלל החיצון',
      rk_tropo_s: 'טרופו · ספירה', rk_strato_s: 'סטרטו · ספירה', rk_meso_s: 'מזו · ספירה', rk_thermo_s: 'תרמו · ספירה', rk_exo_s: 'אקסו · ספירה', rk_space_s: 'החלל · החיצון',
      rk_tropo_f: 'האוויר שאנחנו נושמים. כל מזג האוויר קורה כאן: עננים, גשם ורוח. מטוסי נוסעים טסים ליד הגבול העליון שלה.',
      rk_strato_f: 'כאן נמצאת שכבת האוזון. היא חוסמת את רוב הקרינה העל־סגולה המזיקה של השמש.',
      rk_meso_f: 'השכבה הקרה ביותר, עד בערך 90 מעלות מתחת לאפס. כאן נשרפים כוכבים נופלים.',
      rk_thermo_f: 'בגובה 100 ק״מ עוברים את קו קרמן: כאן מתחיל החלל באופן רשמי! כאן זוהרים זוהרי הקוטב, ותחנת החלל מקיפה בגובה של כ־400 ק״מ.',
      rk_exo_f: 'השאריות האחרונות של האוויר נמלטות לחלל. גם כמה לוויינים מקיפים את כדור הארץ כאן.',
      rk_space_f: 'אין כאן אוויר בכלל: רק כוכבים, הירח והשמש. ברוכים הבאים לחלל!',
      rk_space_r: 'מעל 10,000 ק״מ', rk_km: 'ק״מ', rk_alt: 'גובה', rk_liftoff: 'המראה!', rk_home: 'נחיתה! ברוכים השבים הביתה.', rk_party: 'ברוכים השבים, אסטרונאוטים!', rk_sep: 'היפרדות שלב!' }
  };
  if (window.KQ && KQ.i18n && KQ.i18n.extend) KQ.i18n.extend(STR);
  const tr = (k, p) => (window.KQ && KQ.t) ? KQ.t(k, p) : (STR.en[k] || k);
  const rtl = () => !!(window.KQ && KQ.i18n && KQ.i18n.lang === 'he');
  const fmtKm = v => Math.round(v).toLocaleString(rtl() ? 'he-IL' : 'en-US');

  /* ---------------------------------------------------------------- shaders */
  const NOISE = [
    'float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    ' return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),',
    '            mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }',
    'float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 7; i++) { s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }'].join('\n');
  /* the Earth: continents, oceans, ice, deserts and moving clouds from 3D noise (no seams, sharp at any height); the launch meadow is
     always green land under the pad (+y); sunlight, a glint on the sea, the blue rim of the air and the haze of distance */
  function earthMat() {
    return new T.ShaderMaterial({ uniforms: { uSun: { value: new T.Vector3(0.5, 0.6, -0.6).normalize() }, uTime: { value: 0 }, uHaze: { value: 0 }, uHazeCol: { value: new T.Color(0.7, 0.84, 1) } },
      vertexShader: 'varying vec3 vO; varying vec3 vN; varying vec3 vW; void main(){ vO = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: ['uniform vec3 uSun; uniform float uTime, uHaze; uniform vec3 uHazeCol; varying vec3 vO; varying vec3 vN; varying vec3 vW;', NOISE,
        'void main(){ vec3 o = vO; float pad = smoothstep(0.9965, 0.99995, o.y);',
        ' float c = fbm(o * 3.0) + 0.1 * fbm(o * 24.0); float land = smoothstep(0.515, 0.53, c + pad * 0.5);',
        ' float dry = smoothstep(0.52, 0.66, fbm(o * 5.0 + 7.0)) * (1.0 - pad), mount = smoothstep(0.62, 0.75, c);',
        ' vec3 green = mix(vec3(0.16, 0.36, 0.1), vec3(0.3, 0.5, 0.16), fbm(o * 60.0)), desert = vec3(0.66, 0.54, 0.34);',
        ' vec3 ground = mix(mix(green, desert, dry), vec3(0.42, 0.38, 0.34), mount * 0.7);',
        ' float coast = smoothstep(0.44, 0.515, c); vec3 sea = mix(vec3(0.01, 0.07, 0.24), vec3(0.03, 0.3, 0.5), coast);',
        ' vec3 col = mix(sea, ground, land); float ice = smoothstep(0.84, 0.9, abs(o.z) + 0.05 * fbm(o * 9.0)); col = mix(col, vec3(0.92, 0.95, 1.0), ice);',
        ' float cl = smoothstep(0.54, 0.74, fbm(o * 5.5 + vec3(uTime * 0.004, 0.0, uTime * 0.002))) * (1.0 - pad * 0.95); col = mix(col, vec3(1.0), cl * 0.92);',
        ' vec3 n = normalize(vN), v = normalize(cameraPosition - vW); float d = max(dot(n, uSun), 0.0);',
        ' vec3 lit = col * (0.07 + 1.15 * d); lit += vec3(1.0, 0.95, 0.85) * pow(max(dot(reflect(-uSun, n), v), 0.0), 60.0) * 0.8 * (1.0 - land) * (1.0 - cl);',
        ' float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0); lit += vec3(0.25, 0.55, 1.0) * rim * (0.25 + 0.9 * d);',
        ' float dist = length(cameraPosition - vW); lit = mix(lit, uHazeCol, (1.0 - exp(-dist * uHaze)) * 0.9);',
        ' gl_FragColor = vec4(lit, 1.0); }'].join('\n') });
  }
  /* the sky around the camera: a horizon glow that sinks and fades to black as the air thins; the Sun's glare */
  function skyMat() {
    return new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { uZen: { value: new T.Color() }, uHor: { value: new T.Color() }, uUp: { value: new T.Vector3(0, 1, 0) }, uHorE: { value: 0 }, uSun: { value: new T.Vector3(0.5, 0.6, -0.6).normalize() }, uSunI: { value: 1 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uZen, uHor, uUp, uSun; uniform float uHorE, uSunI; varying vec3 vW; void main(){ vec3 d = normalize(vW - cameraPosition); float e = dot(d, uUp);' +
        ' vec3 col = mix(uHor, uZen, smoothstep(uHorE - 0.02, uHorE + 0.55, e)); float s = max(dot(d, uSun), 0.0);' +
        ' col += vec3(1.0, 0.92, 0.75) * (pow(s, 900.0) * 30.0 + pow(s, 60.0) * 0.5 * uSunI + pow(s, 8.0) * 0.12 * uSunI); gl_FragColor = vec4(col, 1.0); }' });
  }
  /* a glowing shell where a layer begins: faint from inside, a bright line along the horizon once you are above it, a flash as you pass */
  function shellMat(hex) {
    return new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, uniforms: { uCol: { value: new T.Color(hex) }, uA: { value: 0.35 }, uFlash: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uCol; uniform float uA, uFlash; varying vec3 vN; varying vec3 vW; void main(){ vec3 v = normalize(cameraPosition - vW); float r = 1.0 - abs(dot(normalize(vN), v)); float a = pow(r, 6.0) * uA + uFlash * 0.35; gl_FragColor = vec4(uCol * a, a); }' });
  }
  /* the polar lights: rippling curtains, green at the foot, violet on top */
  function auroraMat() {
    return new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, uniforms: { uTime: { value: 0 }, uA: { value: 0 } },
      vertexShader: 'uniform float uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x * 0.02 + uTime * 0.7) * 14.0 + sin(p.x * 0.05 - uTime * 1.1) * 6.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
      fragmentShader: 'uniform float uTime, uA; varying vec2 vUv; void main(){ float y = vUv.y; float streak = 0.55 + 0.45 * sin(vUv.x * 90.0 + uTime * 2.0) * sin(vUv.x * 37.0 - uTime); float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);' +
        ' vec3 c = mix(vec3(0.2, 1.0, 0.45), vec3(0.7, 0.3, 1.0), smoothstep(0.35, 1.0, y)); float a = smoothstep(0.0, 0.12, y) * (1.0 - y) * streak * edge * uA; gl_FragColor = vec4(c * a * 1.6, a); }' });
  }

  /* ---------------------------------------------------------------- models */
  const std = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.45, metalness: 0.1 }, o || {}));
  const lathe = (pts, seg, mat) => new T.Mesh(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg || 32), mat);
  /* the rocket: a white booster with a black roll pattern and four red fins, a gold-banded upper stage with round windows, a red nose */
  function rocket() {
    const g = new T.Group(), white = std(0xf4f2ee, { roughness: 0.35 }), black = std(0x1c1c22, { roughness: 0.5 }), red = std(0xd8343a, { roughness: 0.35 }), gold = std(0xe8b64a, { metalness: 0.85, roughness: 0.25 }), metal = std(0x6a6a74, { metalness: 0.9, roughness: 0.35, side: T.DoubleSide });
    const boost = new T.Group(); g.add(boost);
    const body = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 8, 32), white); body.position.y = 4.4; boost.add(body);
    for (let i = 0; i < 4; i++) { const q = new T.Mesh(new T.CylinderGeometry(1.115, 1.115, 1.6, 32, 1, true, i * PI / 2, PI / 4), black); q.position.y = 2.2 + (i % 2) * 3.2; boost.add(q); }
    boost.add(lathe([[0.3, 0.9], [0.55, 0.6], [0.85, 0.05], [0.9, 0]], 24, metal));
    boost.add(lathe([[1.1, 1.1], [1.25, 0.4], [1.2, 0.3], [0.001, 0.3]], 32, black));
    for (let i = 0; i < 4; i++) { const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(1.5, -0.5); sh.lineTo(1.5, 0.3); sh.lineTo(0, 2.6); sh.closePath(); const geo = new T.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }); geo.translate(1.0, 0, -0.07); const f = new T.Mesh(geo, red); f.position.y = 0.6; f.rotation.y = i * PI / 2 + PI / 4; boost.add(f); }
    const band0 = new T.Mesh(new T.TorusGeometry(1.11, 0.07, 8, 40), gold); band0.rotation.x = PI / 2; band0.position.y = 8.4; boost.add(band0);
    const upper = new T.Group(); upper.position.y = 8.4; g.add(upper);
    const ub = new T.Mesh(new T.CylinderGeometry(1.0, 1.1, 4.4, 32), white); ub.position.y = 2.2; upper.add(ub);
    upper.add(lathe([[0.2, 0.1], [0.5, -0.5], [0.55, -0.55]], 20, metal));
    for (const y of [0.5, 4.2]) { const b = new T.Mesh(new T.TorusGeometry(y > 1 ? 1.01 : 1.1, 0.06, 8, 40), gold); b.rotation.x = PI / 2; b.position.y = y; upper.add(b); }
    const glass = new T.MeshStandardMaterial({ color: 0x1a3a6a, roughness: 0.1, metalness: 0.4, emissive: 0x2a6ab0, emissiveIntensity: 0.35 });
    for (let i = 0; i < 3; i++) { const a = i * 0.9 - 0.9, w = new T.Mesh(new T.CircleGeometry(0.26, 24), glass); w.position.set(Math.sin(a) * 1.035, 3.2, Math.cos(a) * 1.035); w.lookAt(Math.sin(a) * 3, 3.2, Math.cos(a) * 3); upper.add(w); const rim = new T.Mesh(new T.TorusGeometry(0.28, 0.04, 6, 24), gold); rim.position.copy(w.position); rim.quaternion.copy(w.quaternion); upper.add(rim); }
    const nose = lathe([[1.0, 0], [0.95, 0.9], [0.72, 2.2], [0.35, 3.3], [0.001, 3.8]], 32, red); nose.position.y = 4.4; upper.add(nose);
    const tip = new T.Mesh(new T.SphereGeometry(0.1, 12, 8), gold); tip.position.y = 8.2; upper.add(tip);
    g.userData = { boost, upper };
    return g;
  }
  /* the flame: a white-hot core in a longer orange plume, a glow sprite */
  function flame(soft, s) {
    const g = new T.Group(); const add = { transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide };
    const core = new T.Mesh(new T.ConeGeometry(0.55 * s, 3.2 * s, 20, 1, true), new T.MeshBasicMaterial(Object.assign({ color: new T.Color(3.2, 3.0, 2.6), opacity: 0.95 }, add))); core.rotation.x = PI; core.position.y = -1.6 * s; g.add(core);
    const plume = new T.Mesh(new T.ConeGeometry(0.95 * s, 7 * s, 20, 1, true), new T.MeshBasicMaterial(Object.assign({ color: new T.Color(3.0, 1.2, 0.3), opacity: 0.55 }, add))); plume.rotation.x = PI; plume.position.y = -3.5 * s; g.add(plume);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: soft, color: new T.Color(3, 1.6, 0.6), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); glow.scale.setScalar(7 * s); glow.position.y = -1.2 * s; g.add(glow);
    g.userData = { glow };
    return g;
  }
  function tower() {
    const g = new T.Group(), steel = std(0xc84a2a, { roughness: 0.6, metalness: 0.4 }), grey = std(0x8a8a90, { roughness: 0.7 });
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) { const p = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 18, 6), steel); p.position.set(x, 9, z); g.add(p); }
    for (let y = 1; y < 18; y += 1.5) for (const [a, b, rz, ry] of [[0, -0.7, 0.75, 0], [0, 0.7, -0.75, 0], [-0.7, 0, 0.75, PI / 2], [0.7, 0, -0.75, PI / 2]]) { const br = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.0, 5), steel); br.position.set(a, y + 0.75, b); br.rotation.set(0, ry, rz); g.add(br); }
    const arms = []; for (const y of [7, 12.5]) { const piv = new T.Group(); piv.position.set(0.7, y, 0); g.add(piv); const arm = new T.Mesh(new T.BoxGeometry(2.4, 0.3, 0.6), grey); arm.position.x = 1.2; piv.add(arm); arms.push(piv); }
    const top = new T.Mesh(new T.ConeGeometry(0.3, 1.2, 6), steel); top.position.y = 18.6; g.add(top);
    const lamp = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), new T.MeshBasicMaterial({ color: new T.Color(3, 0.3, 0.2) })); lamp.position.y = 19.3; g.add(lamp);
    g.userData.arms = arms; g.userData.lamp = lamp; return g;
  }
  function airliner() { const g = new T.Group(), w = std(0xf2f4f8), b = std(0x2a5ab0); const f = new T.Mesh(new T.CapsuleGeometry(0.5, 5, 6, 12), w); f.rotation.z = PI / 2; g.add(f); const wing = new T.Mesh(new T.BoxGeometry(1.6, 0.1, 7), w); wing.position.x = 0.3; g.add(wing); const tail = new T.Mesh(new T.BoxGeometry(1.0, 1.6, 0.12), b); tail.position.set(-2.8, 0.9, 0); g.add(tail); const st = new T.Mesh(new T.BoxGeometry(0.8, 0.08, 2.6), w); st.position.set(-2.8, 0.2, 0); g.add(st); return g; }
  function balloon() { const g = new T.Group(); g.add(lathe([[0.001, -2.6], [1.2, -2.2], [2.6, -0.6], [2.9, 0.8], [2.2, 2.4], [0.001, 2.9]], 24, std(0xf4f0e8, { roughness: 0.55 }))); const line = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 4, 4), std(0x444444)); line.position.y = -4.6; g.add(line); const box = new T.Mesh(new T.BoxGeometry(0.7, 0.6, 0.7), std(0xe8a030)); box.position.y = -6.8; g.add(box); return g; }
  function panel(w, h) { const c = canvas(128, 64, (x, W, H) => { x.fillStyle = '#1c2c6a'; x.fillRect(0, 0, W, H); x.strokeStyle = '#8aa8e8'; x.lineWidth = 1; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * W / 8, 0); x.lineTo(i * W / 8, H); x.stroke(); } for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * H / 4); x.lineTo(W, j * H / 4); x.stroke(); } }); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return new T.Mesh(new T.BoxGeometry(w, 0.05, h), new T.MeshStandardMaterial({ map: tx, roughness: 0.3, metalness: 0.5 })); }
  function station() { const g = new T.Group(), trussM = std(0xc8c8cc, { metalness: 0.6 }), modM = std(0xe8e8e0, { roughness: 0.5 }); g.add(new T.Mesh(new T.BoxGeometry(22, 0.5, 0.5), trussM));
    for (const x of [-9, -6, 6, 9]) for (const z of [-1, 1]) { const p = panel(2.4, 6.5); p.position.set(x, 0, z * 3.6); g.add(p); }
    for (const [x, len] of [[0, 6], [3.2, 3], [-3.2, 3]]) { const m = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, len, 16), modM); m.rotation.x = PI / 2; m.position.set(x, -1.2, 0); g.add(m); }
    const rad = new T.Mesh(new T.BoxGeometry(1.2, 0.05, 3.2), std(0xf8f8f8)); rad.position.set(0, -1.2, 3.8); g.add(rad); return g; }
  function satellite() { const g = new T.Group(); g.add(new T.Mesh(new T.BoxGeometry(1.2, 1.2, 1.6), std(0xd8a84a, { metalness: 0.8, roughness: 0.3 }))); for (const s of [-1, 1]) { const p = panel(3.4, 1.1); p.rotation.z = PI / 2; p.position.x = s * 2.4; g.add(p); } const dish = new T.Mesh(new T.SphereGeometry(0.6, 16, 8, 0, TAU, 0, 0.9), std(0xf0f0f0, { side: T.DoubleSide })); dish.position.z = 1.1; dish.rotation.x = -PI / 2; g.add(dish); return g; }
  /* ---------------------------------------------------------------- the welcome party (Yoni 2026-10-03: 'when landing back from space, a welcoming
     party: a team that gets the astronauts out of the spaceship, and people on the sides behind barricades, cheering'). Built round the capsule's
     landing spot (the capsule's own frame: +z faces the camera). A recovery truck, four crew in orange who walk to the capsule and open the
     hatch, two astronauts who climb out and wave, a cheering crowd behind steel barricades with flags and a banner, and confetti. */
  function welcomeParty(snd) {
    const g = new T.Group(), skin = [0xf2c9a0, 0xd9a47a, 0xa8714a, 0x7a4a2e, 0xffd8b8], shirt = [0xe8475a, 0x3a9aff, 0xffd84a, 0x3fae62, 0xb48cff, 0xff9a3c, 0xffffff, 0x2a3a6a];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    /* a person: legs, body, head, two arms on shoulder pivots (arm.rotation.z lifts them) */
    function person(body, head, o) { o = o || {}; const p = new T.Group(); const bm = std(body, { roughness: 0.8 });
      for (const sx of [-0.13, 0.13]) { const leg = new T.Mesh(new T.CylinderGeometry(0.1, 0.09, 0.8, 8), std(o.legs || 0x2a3048, { roughness: 0.9 })); leg.position.set(sx, 0.4, 0); p.add(leg); }
      const torso = new T.Mesh(new T.CylinderGeometry(0.24, 0.28, 0.75, 12), bm); torso.position.y = 1.16; p.add(torso);
      const hd = new T.Mesh(new T.SphereGeometry(o.helmet ? 0.27 : 0.2, 16, 12), o.helmet ? std(0xffffff, { roughness: 0.3 }) : std(head, { roughness: 0.7 })); hd.position.y = 1.75; p.add(hd);
      if (o.helmet) { const v = new T.Mesh(new T.SphereGeometry(0.2, 16, 10, -PI * 0.45, PI * 0.9, PI * 0.3, PI * 0.42), std(0xe8b64a, { metalness: 0.9, roughness: 0.15 })); v.position.set(0, 1.76, 0.1); p.add(v); }
      else if (o.cap) { const c = new T.Mesh(new T.SphereGeometry(0.215, 14, 8, 0, TAU, 0, PI / 2), std(o.cap, { roughness: 0.5 })); c.position.y = 1.78; p.add(c); }
      const arms = []; for (const sd of [-1, 1]) { const piv = new T.Group(); piv.position.set(sd * 0.3, 1.46, 0); p.add(piv); const arm = new T.Mesh(new T.CylinderGeometry(0.07, 0.06, 0.62, 8), bm); arm.position.y = -0.31; piv.add(arm); const hand = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), std(o.helmet ? 0xffffff : head)); hand.position.y = -0.64; piv.add(hand); piv.userData.sd = sd; arms.push(piv); }
      if (o.stripe) { const st = new T.Mesh(new T.CylinderGeometry(0.262, 0.27, 0.08, 12), std(0xe8f0ff, { emissive: 0x666666, roughness: 0.4 })); st.position.y = 1.0; p.add(st); }
      p.userData.arms = arms; return p; }
    /* steel crowd barricades in an arc behind and beside the landing spot (open in front, towards you) */
    const steel = std(0xc8ccd4, { metalness: 0.7, roughness: 0.35 }), crowd = [];
    const R0 = 9.5, A0 = -2.2, A1 = 2.2, NB = 13;
    for (let i = 0; i < NB; i++) { const a0 = A0 + (A1 - A0) * i / NB, a1 = A0 + (A1 - A0) * (i + 1) / NB, am = (a0 + a1) / 2, len = R0 * (a1 - a0) * 0.96; const b = new T.Group(); b.position.set(Math.sin(am) * R0, 0, -Math.cos(am) * R0); b.rotation.y = -am; g.add(b);
      for (const y of [0.35, 1.05]) { const rail = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, len, 6), steel); rail.rotation.z = PI / 2; rail.position.y = y; b.add(rail); }
      for (let k = 0; k <= 6; k++) { const bar = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.7, 4), steel); bar.position.set(-len / 2 + len * k / 6, 0.7, 0); b.add(bar); }
      for (const x of [-len / 2, len / 2]) { const leg = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.7), steel); leg.position.set(x, 0.03, 0); b.add(leg); }
      /* two or three people behind each section */
      const n = 2 + (i % 2); for (let k = 0; k < n; k++) { const q = person(pick(shirt), pick(skin), { cap: Math.random() < 0.3 ? pick(shirt) : 0, legs: pick([0x2a3048, 0x3a2a20, 0x5a6a8a]) }); const ak = a0 + (a1 - a0) * (k + 0.5) / n, rr = R0 + 0.7 + Math.random() * 0.9; q.position.set(Math.sin(ak) * rr, 0, -Math.cos(ak) * rr); q.lookAt(0, 0, 0); q.scale.setScalar(0.92 + Math.random() * 0.16); g.add(q);
        q.userData.ph = Math.random() * TAU; q.userData.fq = 5 + Math.random() * 4; q.userData.flag = null; if (Math.random() < 0.3) { const f = new T.Mesh(new T.PlaneGeometry(0.5, 0.32), std(pick([0xe8475a, 0x3a9aff, 0xffd84a]), { side: T.DoubleSide })); f.position.set(0.25, -0.75, 0); q.userData.arms[1].add(f); q.userData.flag = f; } crowd.push(q); } }
    /* the banner across the back */
    { const cv = canvas(1024, 160, (x, W, H) => { x.fillStyle = '#1a2a5a'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ffd86a'; x.lineWidth = 10; x.strokeRect(8, 8, W - 16, H - 16); x.fillStyle = '#fff4dc'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = rtl() ? 'rtl' : 'ltr'; let f = 84; do { x.font = '900 ' + f + 'px Rubik, Assistant, sans-serif'; f -= 4; } while (x.measureText(tr('rk_party')).width > W - 80 && f > 30); x.fillText(tr('rk_party'), W / 2, H / 2 + 4); });   /* the words always fit the banner */
      const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; const bn = new T.Mesh(new T.PlaneGeometry(9, 1.4), new T.MeshStandardMaterial({ map: tx, roughness: 0.7, side: T.DoubleSide })); bn.position.set(0, 3.3, -R0 - 1.6); g.add(bn);
      for (const x of [-4.6, 4.6]) { const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 4, 8), steel); pole.position.set(x, 2, -R0 - 1.6); g.add(pole); } }
    /* the recovery truck and its crew */
    const truck = new T.Group(); truck.position.set(7.2, 0, -3.2); truck.rotation.y = 0.5; g.add(truck);   /* parked off to the side, behind the capsule: never between you and the party */
    { const bodyM = std(0xffffff, { roughness: 0.5 }), cab = new T.Mesh(new T.BoxGeometry(2.0, 1.6, 1.5), bodyM); cab.position.set(1.6, 1.15, 0); truck.add(cab); const box = new T.Mesh(new T.BoxGeometry(3.4, 2.1, 1.9), bodyM); box.position.set(-1.0, 1.4, 0); truck.add(box);
      const stripe = new T.Mesh(new T.BoxGeometry(3.42, 0.3, 1.92), std(0xff7a1a, { roughness: 0.5 })); stripe.position.set(-1.0, 1.2, 0); truck.add(stripe); const win = new T.Mesh(new T.BoxGeometry(0.05, 0.6, 1.3), std(0x1a3a6a, { metalness: 0.4, roughness: 0.1 })); win.position.set(2.61, 1.45, 0); truck.add(win);
      for (const [x, z] of [[1.6, 0.8], [1.6, -0.8], [-1.6, 0.8], [-1.6, -0.8]]) { const w = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.3, 16), std(0x1a1a1e, { roughness: 0.9 })); w.rotation.x = PI / 2; w.position.set(x, 0.42, z); truck.add(w); }
      const lamp = new T.Mesh(new T.BoxGeometry(0.5, 0.15, 0.3), new T.MeshBasicMaterial({ color: 0xff8a2a })); lamp.position.set(1.6, 2.02, 0); truck.add(lamp); truck.userData.lamp = lamp; }
    const crew = [], CREW_TO = [[1.8, 0.4], [-1.8, 0.4], [1.4, 2.2], [-1.4, 2.2]];
    for (let i = 0; i < 4; i++) { const c = person(0xff7a1a, pick(skin), { cap: 0xffffff, stripe: true, legs: 0xff7a1a }); const from = new T.Vector3(5.6 + i * 0.5, 0, -1.6 + i * 0.6); c.position.copy(from); g.add(c); c.userData.from = from; c.userData.to = new T.Vector3(CREW_TO[i][0], 0, CREW_TO[i][1]); crew.push(c); }
    /* two astronauts inside the capsule, out through the hatch (the capsule's front, facing +z) */
    const astro = []; for (let i = 0; i < 2; i++) { const a = person(0xf4f4f6, 0xffffff, { helmet: true, legs: 0xf4f4f6 }); a.scale.setScalar(0.001); a.position.set(0, 0.6, 0.9); g.add(a); a.userData.out = new T.Vector3(i ? -0.7 : 0.7, 0, 3.4 + i * 0.4); astro.push(a); }
    /* the hatch on the capsule's front: a dark opening and a round door on a hinge at its left edge */
    const hole = new T.Mesh(new T.CircleGeometry(0.42, 24), new T.MeshBasicMaterial({ color: 0x0a0a10 })); hole.position.set(0, 1.0, 1.3); hole.rotation.x = -0.26; g.add(hole);
    const doorPivot = new T.Group(); doorPivot.position.set(-0.44, 1.0, 1.31); doorPivot.rotation.x = -0.26; g.add(doorPivot);
    const door = new T.Mesh(new T.CylinderGeometry(0.44, 0.44, 0.08, 24), std(0xd8d8dc, { metalness: 0.4, roughness: 0.4 })); door.rotation.x = PI / 2; door.position.set(0.44, 0, 0.02); doorPivot.add(door);
    /* confetti */
    const conf = []; const cm = new T.PlaneGeometry(0.16, 0.1); for (let i = 0; i < 160; i++) { const m = new T.Mesh(cm, new T.MeshBasicMaterial({ color: pick(shirt), side: T.DoubleSide })); m.visible = false; g.add(m); conf.push({ m, v: new T.Vector3(), r: new T.Vector3(R(-6, 6), R(-6, 6), R(-6, 6)), t0: 0 }); }
    g.visible = false;
    let cheer = null, lastWhistle = 0, fired = false;
    function burst(at) { for (const q of conf) if (!q.m.visible || Math.random() < 0.4) { q.m.visible = true; q.m.position.set(R(-6, 6), R(5, 9), R(-9, 2)); q.v.set(R(-0.5, 0.5), R(-1.6, -0.8), R(-0.5, 0.5)); } void at; }
    /* tl: seconds since touchdown */
    function update(tl, dt, tm) { if (tl < 0) { g.visible = false; return; } g.visible = true;
      if (!fired) { fired = true; burst(); if (snd) cheer = snd.loop({ white: true, type: 'bandpass', freq: 1100, q: 0.7, gain: 0 }); }
      /* the crowd: jumps, waving arms and flags, louder at the moments the hatch opens and the astronauts appear */
      const loud = 0.6 + 0.4 * (Math.max(0, 1 - Math.abs(tl - 3.4) / 1.2) + Math.max(0, 1 - Math.abs(tl - 5.6) / 1.4));
      for (const q of crowd) { const u = q.userData, ph = tm * u.fq + u.ph; q.position.y = Math.max(0, Math.sin(ph * 0.5)) * 0.18 * loud; u.arms[0].rotation.z = -(2.4 + Math.sin(ph) * 0.5); u.arms[1].rotation.z = 2.4 + Math.sin(ph + 1.3) * 0.5; if (u.flag) u.flag.rotation.y = Math.sin(ph * 1.6) * 0.6; }
      if (cheer) cheer.set(0.09 * loud * Math.min(1, tl / 0.8), 900 + 400 * Math.sin(tm * 3.1), 0.2);
      if (snd && tm - lastWhistle > 1.1 && Math.random() < 0.05) { lastWhistle = tm; snd.tone({ freq: 1800 + Math.random() * 600, freqTo: 2600 + Math.random() * 800, gain: 0.04, attack: 0.02, decay: 0.5 }); }
      /* the crew walk over (0.8–3 s), the hatch swings open (3–3.8 s), the astronauts climb out one by one and wave; the crew clap */
      truck.userData.lamp.material.color.setRGB(Math.sin(tm * 8) > 0 ? 3 : 0.4, 0.5, 0.1);
      crew.forEach((c, i) => { const k = smooth(0.8 + i * 0.2, 3.0 + i * 0.2, tl); c.position.lerpVectors(c.userData.from, c.userData.to, k); const walking = k > 0 && k < 1; c.lookAt(walking ? c.userData.to.x : 0, 0, walking ? c.userData.to.z : 1.2); c.position.y = walking ? Math.abs(Math.sin(tm * 9 + i)) * 0.06 : 0;
        const clap = tl > 5 ? Math.abs(Math.sin(tm * 9 + i)) : 0; c.userData.arms[0].rotation.set(walking ? Math.sin(tm * 9 + i) * 0.5 : -1.2 * Math.min(1, tl > 5 ? 1 : 0), 0, -0.25 - clap * 0.35); c.userData.arms[1].rotation.set(walking ? -Math.sin(tm * 9 + i) * 0.5 : -1.2 * Math.min(1, tl > 5 ? 1 : 0), 0, 0.25 + clap * 0.35); });
      doorPivot.rotation.y = -smooth(3.0, 3.8, tl) * 1.9;
      astro.forEach((a, i) => { const t0 = 4.0 + i * 1.4, k = smooth(t0, t0 + 1.2, tl), w = smooth(t0 + 1.2, t0 + 2.4, tl); a.scale.setScalar(Math.max(0.001, Math.min(1, k * 1.6)));
        const inside = new T.Vector3(0, 0.55, 1.0), step = new T.Vector3(i ? -0.35 : 0.35, 0, 2.1); a.position.lerpVectors(inside, step, k); a.position.y = 0.55 * (1 - k) + Math.sin(k * PI) * 0.35; if (w > 0) a.position.lerpVectors(step, a.userData.out, w);
        a.lookAt(a.position.x, a.position.y, a.position.z + 1); const wave = tl > t0 + 2.2 ? Math.sin(tm * 7 + i) : 0; a.userData.arms[i ? 0 : 1].rotation.z = (i ? -1 : 1) * (tl > t0 + 2.2 ? 2.6 + wave * 0.35 : 0.15); });
      if (tl > 5.4 && tl - dt <= 5.4) burst();
      for (const q of conf) { if (!q.m.visible) continue; q.m.position.addScaledVector(q.v, dt); q.m.rotation.x += q.r.x * dt; q.m.rotation.y += q.r.y * dt; q.v.x += Math.sin(tm * 2 + q.r.z) * dt * 0.6; if (q.m.position.y < 0.02) { q.m.position.y = 0.02; q.v.set(0, 0, 0); q.r.set(0, 0, 0); } } }
    function stop() { if (cheer) { cheer.set(0, 900, 0.6); } }
    return { g, update, stop };
  }
  function capsule() { const g = new T.Group(); g.add(lathe([[1.5, 0], [1.45, 0.3], [0.7, 2.3], [0.5, 2.5], [0.001, 2.5]], 32, std(0xe8e8ea, { roughness: 0.45, metalness: 0.3 })));
    g.add(lathe([[0.001, -0.35], [1.1, -0.25], [1.55, 0], [0.001, 0]], 32, std(0x5a3a28, { roughness: 0.8 })));
    for (let i = 0; i < 2; i++) { const w = new T.Mesh(new T.CircleGeometry(0.2, 20), std(0x1a3a6a, { metalness: 0.4, roughness: 0.1 })); const a = i * 1.1 - 0.55; w.position.set(Math.sin(a) * 1.18, 1.2, Math.cos(a) * 1.18); w.lookAt(Math.sin(a) * 4, 1.9, Math.cos(a) * 4); g.add(w); }
    const band = new T.Mesh(new T.TorusGeometry(1.49, 0.06, 8, 40), std(0xe8b64a, { metalness: 0.85, roughness: 0.25 })); band.rotation.x = PI / 2; band.position.y = 0.05; g.add(band); return g; }
  function chute() { const g = new T.Group(), n = 12; const c = canvas(256, 64, (x, W, H) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e8483a'; x.fillRect(i * W / n, 0, W / n + 1, H); } }); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
    const dome = new T.Mesh(new T.SphereGeometry(5, 24, 10, 0, TAU, 0, 1.2), new T.MeshStandardMaterial({ map: tx, side: T.DoubleSide, roughness: 0.8 })); dome.position.y = 8; g.add(dome);
    const lm = new T.LineBasicMaterial({ color: 0x8a8a8a }); for (let i = 0; i < n; i++) { const a = i / n * TAU; g.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 2.4, 0), new T.Vector3(Math.cos(a) * 4.66, 9.8, Math.sin(a) * 4.66)]), lm)); } return g; }
  function meadowCanvas() { return canvas(512, 512, (x, w, h) => { x.fillStyle = '#5f9e3e'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = ['#6fb84a', '#4f8a33', '#7dbb56', '#8cc563', '#568f38'][i % 5]; x.globalAlpha = 0.35; x.beginPath(); x.ellipse(R(0, w), R(0, h), R(6, 40), R(4, 26), R(0, 3), 0, TAU); x.fill(); } x.globalAlpha = 1; }); }
  function starfield(n) { const P = new Float32Array(n * 3), C = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = R(-1, 1), a = R(0, TAU), r = Math.sqrt(1 - u * u); P.set([Math.cos(a) * r * 15000, u * 15000, Math.sin(a) * r * 15000], i * 3); const k = R(0.5, 1), tint = Math.random(); C.set(tint < 0.2 ? [k, k * 0.85, k * 0.7] : tint < 0.35 ? [k * 0.75, k * 0.85, k] : [k, k, k], i * 3); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('color', new T.BufferAttribute(C, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false })); pts.frustumCulled = false; return pts; }
  /* the Milky Way: a soft band of countless faint stars, dust lanes and a brighter core */
  function milkyWay() { const c = canvas(2048, 512, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const px = R(0, w), core = Math.exp(-Math.pow((px - w * 0.5) / (w * 0.18), 2)), py = h / 2 + (Math.random() + Math.random() + Math.random() - 1.5) * h * (0.09 + 0.06 * core); x.fillStyle = `rgba(${(200 + 55 * core) | 0},${(190 + 40 * core) | 0},${(230 - 40 * core) | 0},${0.03 + 0.05 * core})`; x.beginPath(); x.ellipse(px, py, R(10, 50), R(4, 18), 0, 0, TAU); x.fill(); }
      for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(255,255,255,${R(0.2, 0.8)})`; x.fillRect(R(0, w), h / 2 + (Math.random() + Math.random() - 1) * h * 0.16, 1, 1); }
      x.globalCompositeOperation = 'multiply'; for (let i = 0; i < 260; i++) { x.fillStyle = 'rgba(40,30,30,0.35)'; x.beginPath(); x.ellipse(R(0, w), h / 2 + (Math.random() - 0.5) * h * 0.08, R(12, 60), R(2, 7), R(-0.2, 0.2), 0, TAU); x.fill(); } });
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(new T.SphereGeometry(14500, 48, 24), new T.MeshBasicMaterial({ map: tx, side: T.BackSide, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false })); m.rotation.set(0.9, 0.3, 0.5); m.frustumCulled = false; return m; }
  function moonTex() { const c = canvas(512, 256, (x, w, h) => { x.fillStyle = '#b8b4ac'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(70,68,70,${R(0.25, 0.5)})`; x.beginPath(); x.ellipse(R(0, w), R(h * 0.2, h * 0.8), R(20, 70), R(12, 40), 0, 0, TAU); x.fill(); }
      for (let i = 0; i < 260; i++) { const cx = R(0, w), cy = R(0, h), r = Math.pow(Math.random(), 2) * 10 + 1; x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.fillStyle = 'rgba(60,60,60,0.25)'; x.beginPath(); x.arc(cx + 0.6, cy + 0.6, r * 0.8, 0, TAU); x.fill(); } }); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return tx; }

  /* ---------------------------------------------------------------- the on-screen card and the gauge (crisp HTML, outside the glow) */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function hud(ov, up) {
    const css = el('style'); css.textContent = [
      '.rk-card{position:absolute;left:50%;top:max(16px,env(safe-area-inset-top));transform:translate(-50%,-12px);width:min(560px,calc(100vw - 150px));box-sizing:border-box;padding:12px 18px 14px;border-radius:18px;background:rgba(10,12,28,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1.5px rgba(242,193,78,.7),0 12px 34px rgba(0,0,0,.45);color:#fff4dc;font-family:Rubik,"Secular One",system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .45s,transform .45s;pointer-events:none}',
      '.rk-card.on{opacity:1;transform:translate(-50%,0)} .rk-card b{display:block;font-weight:900;font-size:clamp(30px,6vw,52px);letter-spacing:.03em;color:var(--rk,#ffe7a8);line-height:1.1}',
      '.rk-card i{display:block;font-style:normal;font-weight:800;font-size:clamp(14px,2.2vw,18px);color:#ffd27a;margin:2px 0 6px} .rk-card p{margin:0;font-weight:600;font-size:clamp(14px,2.2vw,18px);line-height:1.35;color:#f2ecff}',
      '.rk-card.big b{font-size:clamp(56px,12vw,96px)}',
      '.rk-gauge{position:absolute;top:50%;inset-inline-end:max(12px,env(safe-area-inset-right));transform:translateY(-50%);width:clamp(78px,12vw,120px);display:flex;flex-direction:column-reverse;gap:3px;padding:8px;border-radius:14px;background:rgba(10,12,28,.5);box-shadow:inset 0 0 0 1px rgba(242,193,78,.5);font-family:Rubik,"Secular One",system-ui,sans-serif;pointer-events:none}',
      '.rk-seg{position:relative;height:clamp(34px,7vh,58px);border-radius:8px;background:rgba(255,255,255,.07);overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 3px}',
      '.rk-seg span{position:relative;z-index:1;font-weight:800;font-size:clamp(9px,1.35vw,12px);line-height:1.05;color:rgba(255,255,255,.55)} .rk-seg em{position:absolute;inset:0;background:var(--c);opacity:0;transition:opacity .4s}',
      '.rk-seg.now em{opacity:.55} .rk-seg.now span{color:#fff} .rk-seg.did em{opacity:.22} .rk-seg.did span{color:#fff} .rk-seg.did::after{content:"✓";position:absolute;top:1px;inset-inline-end:4px;font:900 11px Rubik,sans-serif;color:#9dffb8;z-index:1}',
      '.rk-alt{order:-1;margin-top:6px;text-align:center;color:#ffe7a8;font-weight:900;font-size:clamp(12px,1.8vw,15px);font-variant-numeric:tabular-nums} .rk-alt small{display:block;font-weight:700;font-size:10px;color:#cfc6e8;letter-spacing:.06em;text-transform:uppercase}',
      '@media (max-width:640px){.rk-card{left:12px;width:calc(100vw - 118px);transform:translate(0,-12px)} .rk-card.on{transform:none} .rk-card[dir=rtl]{left:auto;right:12px} .rk-card p{font-size:13px} .rk-card b{font-size:28px}}'].join('\n');
    ov.appendChild(css);
    const card = el('div', 'rk-card'); card.dir = rtl() ? 'rtl' : 'ltr'; ov.appendChild(card);
    const gauge = el('div', 'rk-gauge'); gauge.dir = rtl() ? 'rtl' : 'ltr'; ov.appendChild(gauge);
    const alt = el('div', 'rk-alt'); gauge.appendChild(alt);
    const segs = LAY.map((id, i) => { const s = el('div', 'rk-seg'); s.style.setProperty('--c', COL[i]); s.append(el('em'), el('span', null, tr('rk_' + id + '_s')));   /* the gauge says it in parts too */ gauge.appendChild(s); return s; });
    let shown = null, timer = 0;
    return {
      card(key, name, sub, text, col, big) { if (shown === key) return; const wasOn = shown != null; shown = key; card.classList.remove('on'); clearTimeout(timer);
        timer = setTimeout(() => { card.className = 'rk-card' + (big ? ' big' : ''); card.style.setProperty('--rk', col || '#ffe7a8'); card.replaceChildren(el('b', null, name)); if (sub) card.appendChild(el('i', null, sub)); if (text) card.appendChild(el('p', null, text)); requestAnimationFrame(() => card.classList.add('on')); }, wasOn ? 260 : 0); },
      gauge(p) { const idx = p >= 5 ? 5 : Math.floor(p); segs.forEach((s, i) => { s.classList.toggle('now', i === idx); s.classList.toggle('did', up ? i > idx : i < idx); }); alt.replaceChildren(el('small', null, tr('rk_alt')), document.createTextNode(p >= 5 ? '> ' + fmtKm(10000) + ' ' + tr('rk_km') : fmtKm(km(p)) + ' ' + tr('rk_km'))); }
    };
  }
  const range = i => i >= 5 ? tr('rk_space_r') : '\u2066' + fmtKm(B[i]) + '–' + fmtKm(B[i + 1]) + '\u2069 ' + tr('rk_km');   /* isolated: '12–50' stays in order inside Hebrew */

  /* ---------------------------------------------------------------- mission control. The voice is ElevenLabs, recorded once through the
     kq-relay (tools/gen_rocket_vo.py → shared/voices/rocket/<lang>_<key>.mp3; Hebrew is 'mommy' = Storyteller A, v2 clips): NEVER the device's speech voice (Yoni 2026-09-28: 'never, ever
     use the generic voice of the computer'). Soothing and a little slower (played at 0.9× with the pitch kept); every layer's name is said
     in its parts ('Strato… sphere') and shown the same way on the card. Each call is framed by the two short radio beeps of NASA's loops
     (Quindar tones, 2525 Hz in, 2475 Hz out). If a clip cannot play, the ride stays silent — no fallback voice. The ride waits for each line:
     VO holds every clip's length (seconds, at 1×) so the layers last as long as their words. */
  const VO = {"en": {"n3": 0.65, "n2": 0.6, "n1": 0.6, "lift": 1.76, "up_tropo": 8.27, "up_strato": 7.38, "up_meso": 7.57, "up_thermo": 8.54, "up_exo": 7.94, "up_space": 3.81, "sep": 1.44, "dn_exo": 3.62, "dn_thermo": 3.53, "dn_meso": 3.76, "dn_strato": 3.58, "dn_tropo": 3.67, "chute": 1.53, "home": 1.63, "nm_tropo": 1.71, "nm_strato": 1.67, "nm_meso": 1.83, "nm_thermo": 1.81, "nm_exo": 1.69}, "he": {"n3": 0.96, "n2": 0.64, "n1": 0.88, "lift": 3.44, "up_tropo": 11.68, "up_strato": 11.92, "up_meso": 11.96, "up_thermo": 12.64, "up_exo": 13.12, "up_space": 5.52, "sep": 1.36, "dn_exo": 4.32, "dn_thermo": 5.52, "dn_meso": 4.72, "dn_strato": 4.4, "dn_tropo": 4.72, "chute": 1.68, "home": 3.12, "nm_tropo": 1.92, "nm_strato": 1.9, "nm_meso": 2.13, "nm_thermo": 2.35, "nm_exo": 1.72}};
  const RATE = 1.22, VOL = 0.85;   /* Yoni 2026-09-28: 'about 30 to 40 percent faster' than the first 0.9× — the whole ride follows, launch to touchdown */
  const voLang = () => rtl() ? 'he' : 'en', voLen = k => ((VO[voLang()] || VO.en)[k] || 2) / RATE;
  function narrator(snd) { const L = voLang(), clips = {}; let cur = null, seq = 0;
    for (const k of Object.keys(VO[L] || VO.en)) { const a = new Audio('shared/voices/rocket/' + L + '_' + k + '.mp3?v=' + (L === 'he' ? 2 : 1)); a.preload = 'auto'; a.playbackRate = RATE; a.defaultPlaybackRate = RATE; a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = true; a.volume = VOL; clips[k] = a; }
    const stop = () => { if (cur) { try { cur.pause(); } catch (e) {} cur = null; } };
    window.addEventListener('pagehide', stop, { once: true });
    return { say(k) { const a = clips[k]; if (!a) return; const my = ++seq; stop(); if (snd) snd.tone({ freq: 2525, gain: 0.03, attack: 0.005, decay: 0.2 });
        setTimeout(() => { if (my !== seq) return; cur = a; try { a.currentTime = 0; a.playbackRate = RATE; a.onended = () => { if (my === seq && snd) snd.tone({ freq: 2475, gain: 0.026, attack: 0.005, decay: 0.18 }); }; const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} }, 240); },
      stop() { seq++; stop(); } }; }

  /* ================================================================== the ride */
  function launch(S, up, snd) {
    const { scene, camera, renderer, soft, ov } = S;
    camera.near = 0.3; camera.far = 40000; camera.updateProjectionMatrix();
    /* the timeline follows the voice: countdown beats 0.9 s apart, then each layer lasts its line plus a breath; the stage separates after
       the thermosphere line; going home, each layer lasts its (shorter) line and the troposphere holds the parachute and the touchdown */
    /* SHORT (Yoni 2026-09-29: 'the speed-up should not be saying things faster — the video should be shorter'): offered after one full
       take-off and one full landing; each layer then says only its name ('Tropo… sphere.', cut from the landing recordings), at the
       normal pace, and lasts only that long — the whole ride is about a third as long. Switching mid-ride re-times the rest of the flight. */
    const T0 = 3.3, HOLD = 1.2, DUP = [], DDN = []; let fast = false, GAP, thermoLine, sepP, SPACE, CLIMB, DOWN, DUR;
    const layerKey = i => i < 5 && fast ? 'nm_' + LAY[i] : (up ? 'dn_' : 'up_') + LAY[i];
    function timeline() { GAP = fast ? 0.45 : 1.0;
      DUP[0] = voLen('lift') + voLen(layerKey(0)) + GAP + 0.45; for (const i of [1, 2, 4]) DUP[i] = voLen(layerKey(i)) + GAP;
      thermoLine = voLen(layerKey(3)) + 0.35; DUP[3] = thermoLine + voLen('sep') + GAP + (fast ? 0.2 : 0.6);
      sepP = 3 + thermoLine / DUP[3]; SPACE = voLen('up_space') + (fast ? 1.0 : 1.6); CLIMB = DUP.reduce((a, b) => a + b, 0);
      for (let i = 0; i < 5; i++) DDN[i] = voLen(layerKey(i)) + (fast ? 0.5 : 0.9); DDN[0] += voLen('chute') + (fast ? 1.2 : 1.9);
      DOWN = DDN.reduce((a, b) => a + b, 0); DUR = up ? HOLD + DOWN + voLen('home') + 1.0 + (fast ? 7.5 : 10.5) : T0 + CLIMB + SPACE;   /* going home ends with the welcome party */ if (ret) ret.dur = DUR; }
    let ret = null; timeline();
    /* where the flight is, as (segment, fraction), so a switch keeps the ship where it is and only the rest gets shorter or longer */
    function where(t) { if (!up) { if (t < T0) return { a: 't', x: t }; let x = t - T0; for (let i = 0; i < 5; i++) { if (x < DUP[i]) return { i, f: x / DUP[i] }; x -= DUP[i]; } return { i: 5, f: Math.min(1, x / SPACE) }; }
      if (t < HOLD) return { a: 't', x: t }; let x = t - HOLD; for (let i = 4; i >= 0; i--) { if (x < DDN[i]) return { i, f: x / DDN[i] }; x -= DDN[i]; } return { i: -1, x }; }
    function at(w) { if (w.a) return w.x; if (!up) { let t = T0; for (let i = 0; i < w.i; i++) t += DUP[i]; return t + (w.i < 5 ? w.f * DUP[w.i] : w.f * SPACE); }
      let t = HOLD; for (let i = 4; i > w.i && i >= 0; i--) t += DDN[i]; return w.i < 0 ? HOLD + DOWN + w.x : t + w.f * DDN[w.i]; }
    const H = hud(ov, up), NAR = narrator(snd);
    const sunDir = new T.Vector3(0.5, 0.6, -0.6).normalize();
    scene.fog = null; scene.background = new T.Color(0x000000);
    const hemi = new T.HemisphereLight(0xcfe4ff, 0x40502a, 0.9); scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff4e0, 2.4); sun.position.copy(sunDir).multiplyScalar(100); scene.add(sun); scene.add(sun.target);
    /* sky, stars, Milky Way — they travel with the camera */
    const sky = new T.Mesh(new T.SphereGeometry(16000, 32, 16), skyMat()); sky.renderOrder = -3; sky.frustumCulled = false; scene.add(sky);
    const stars = starfield(2600); stars.renderOrder = -2; scene.add(stars); const mw = milkyWay(); mw.renderOrder = -2; scene.add(mw);
    /* the Earth, centred under the pad */
    const earth = new T.Mesh(new T.SphereGeometry(RE, 192, 128), earthMat()); earth.position.y = -RE; scene.add(earth);
    /* where each layer starts: a glowing shell; the Kármán line (100 km) a thin white one */
    const shells = [1, 2, 3, 4].map(i => { const m = new T.Mesh(new T.SphereGeometry(RE + hv(i), 128, 64), shellMat(COL[i])); m.position.y = -RE; m.renderOrder = 2; scene.add(m); return m; });
    const pK = 3 + (100 - 85) / (600 - 85), karman = new T.Mesh(new T.SphereGeometry(RE + hv(pK), 128, 64), shellMat(0xffffff)); karman.position.y = -RE; karman.material.uniforms.uA.value = 0.2; scene.add(karman);
    /* the meadow and the pad: a patch of ground bent to the Earth's curve */
    const mg = new T.CircleGeometry(260, 64); mg.rotateX(-PI / 2); { const p = mg.attributes.position; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)); p.setY(i, Math.sqrt(RE * RE - r * r) - RE + 0.06); } mg.computeVertexNormals(); }
    const mtx = new T.CanvasTexture(meadowCanvas()); mtx.colorSpace = T.SRGBColorSpace; mtx.wrapS = mtx.wrapT = T.RepeatWrapping; mtx.repeat.set(10, 10);
    const alphaC = canvas(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, '#fff'); g.addColorStop(0.7, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    const meadow = new T.Mesh(mg, new T.MeshStandardMaterial({ map: mtx, alphaMap: new T.CanvasTexture(alphaC), transparent: true, roughness: 0.95 })); scene.add(meadow);
    const padG = new T.Group(); scene.add(padG);
    const padM = new T.Mesh(new T.CylinderGeometry(6, 6.6, 0.5, 40), std(0xb8b4ac, { roughness: 0.9 })); padM.position.y = 0.25; padG.add(padM);
    const trench = new T.Mesh(new T.BoxGeometry(2.6, 0.2, 12), std(0x3a3a3e, { roughness: 1 })); trench.position.set(0, 0.42, 3); padG.add(trench);
    const tw = tower(); tw.position.set(-3.2, 0.5, 0); padG.add(tw);
    const treeM = std(0x3f7a2e, { roughness: 0.9, flatShading: true }), trunkM = std(0x6a4a2a); for (let i = 0; i < 26; i++) { const a = R(0, TAU), r = R(40, 110), tre = new T.Group(); tre.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); const tk = new T.Mesh(new T.CylinderGeometry(0.25, 0.35, 1.6, 6), trunkM); tk.position.y = 0.8; tre.add(tk); const cr = new T.Mesh(new T.ConeGeometry(1.6, 3.6, 7), treeM); cr.position.y = 3; tre.add(cr); tre.scale.setScalar(R(0.8, 1.6)); padG.add(tre); }
    /* the castle on the far side of the meadow, so you know where you took off from */
    { const cg = new T.Group(); cg.position.set(-60, 0, -70); padG.add(cg); const st = std(0xd8ccb4, { roughness: 0.9 }), rf = std(0x3a5ab0, { roughness: 0.6 }); const keep = new T.Mesh(new T.BoxGeometry(10, 9, 8), st); keep.position.y = 4.5; cg.add(keep); for (const [x, z] of [[-6, -5], [6, -5], [-6, 5], [6, 5]]) { const tw2 = new T.Mesh(new T.CylinderGeometry(1.8, 2, 13, 12), st); tw2.position.set(x, 6.5, z); cg.add(tw2); const cn = new T.Mesh(new T.ConeGeometry(2.3, 4, 12), rf); cn.position.set(x, 15, z); cg.add(cn); } }
    /* the rocket and its flames; the capsule for the way home */
    const rk = rocket(); rk.position.y = 0.5; const ship = new T.Group(); ship.add(rk); scene.add(ship);
    const fl = flame(soft, 1.2); fl.position.y = 0.1; rk.userData.boost.add(fl); const fl2 = flame(soft, 0.7); fl2.position.y = -0.55; fl2.visible = false; rk.userData.upper.add(fl2);
    const cap = capsule(); cap.visible = false; cap.position.y = 0.5; ship.add(cap); const ch = chute(); ch.visible = false; ch.scale.setScalar(0.01); cap.add(ch);
    const heat = new T.Sprite(new T.SpriteMaterial({ map: soft, color: new T.Color(3.2, 1.2, 0.35), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false })); heat.scale.set(6, 6, 1); heat.position.y = -0.8; cap.add(heat);
    if (up) { rk.visible = false; cap.visible = true; ship.position.x = 16; }   /* home lands on the grass beside the pad */
    const party = up ? welcomeParty(snd) : null; if (party) { party.g.position.set(16, 0, 0); scene.add(party.g); } let tLand = -1;
    const flameLight = new T.PointLight(0xffa050, 0, 60, 1.6); scene.add(flameLight);
    /* smoke and the exhaust trail: soft sprites in world space */
    const puffs = [];
    function puff(pos, vel, size, life, col) { const m = new T.SpriteMaterial({ map: soft, color: col || 0xe8e4de, transparent: true, opacity: 0, depthWrite: false }); const s = new T.Sprite(m); s.position.copy(pos); scene.add(s); puffs.push({ s, vel: vel.clone(), size, life, age: 0 }); }
    /* what you meet on the way */
    const plane = airliner(); plane.visible = false; scene.add(plane);
    const bal = balloon(); bal.position.set(-26, hv(1.45), -14); bal.scale.setScalar(1.3); scene.add(bal);
    const iss = station(); iss.position.set(40, hv(3.61), -60); iss.rotation.set(0.2, 0.5, 0.1); scene.add(iss);
    const sats = []; for (let i = 0; i < 4; i++) { const s = satellite(); s.position.set(R(-80, 80), hv(4.2 + i * 0.2), R(-140, -40)); s.userData.k = R(0, TAU); scene.add(s); sats.push(s); }
    const clouds = []; for (let i = 0; i < 70; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); const a = R(0, TAU), r = i < 14 ? R(26, 60) : R(60, 400); s.position.set(Math.cos(a) * r, R(8, 26), Math.sin(a) * r); const sz = R(8, 20); s.scale.set(sz * 1.6, sz, 1); scene.add(s); clouds.push(s); }
    const meteors = []; { const g = new T.PlaneGeometry(1, 1); g.translate(0.5, 0, 0); const mc = canvas(128, 8, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.85, 'rgba(255,220,160,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }); const mt = new T.CanvasTexture(mc);
      for (let i = 0; i < 10; i++) { const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: mt, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, color: new T.Color(2.4, 1.8, 1.2) })); m.visible = false; scene.add(m); meteors.push({ m, t0: -9 }); } }
    const am = auroraMat(), aur = []; for (let i = 0; i < 3; i++) { const a = new T.Mesh(new T.PlaneGeometry(900, 120, 90, 1), am); a.position.set(-200 + i * 180, hv(3.05) + 20 + i * 12, -700 - i * 120); a.rotation.y = 0.3 - i * 0.25; scene.add(a); aur.push(a); }
    const mt = moonTex(), moon = new T.Mesh(new T.SphereGeometry(260, 48, 32), new T.MeshStandardMaterial({ map: mt, emissiveMap: mt, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 1 })); moon.position.set(-1200, hv(5) + 6000, -6000); scene.add(moon);
    const booster = { on: false, v: new T.Vector3(), spin: new T.Vector3() };
    /* sound */
    let aud = null; if (snd) aud = { roar: snd.loop({ type: 'lowpass', freq: 220, gain: 0 }), hiss: snd.loop({ white: true, type: 'bandpass', freq: 900, q: 0.6, gain: 0 }), pad: snd.pad([196, 247, 294, 392], 'sine', 900) };
    /* the sky colours by height (zenith, horizon) */
    const ZEN = [[0.12, 0.36, 0.92], [0.08, 0.24, 0.72], [0.03, 0.08, 0.32], [0.006, 0.012, 0.06], [0, 0, 0.004], [0, 0, 0]], HOR = [[0.55, 0.76, 1.0], [0.42, 0.64, 1.0], [0.3, 0.46, 0.9], [0.12, 0.2, 0.5], [0.03, 0.06, 0.18], [0.01, 0.02, 0.06]];
    const skyAt = (arr, p, out) => { const i = Math.min(4, Math.floor(clamp(p, 0, 5))), f = clamp(p, 0, 5) - i; return out.setRGB(lerp(arr[i][0], arr[i + 1][0], f), lerp(arr[i][1], arr[i + 1][1], f), lerp(arr[i][2], arr[i + 1][2], f)); };
    /* the camera: offsets from the rocket, by layer progress */
    const CAMK = [[0, [14, -6, 22], [4, 9, 0]], [1.2, [16, 3, 24], [5, 5, 0]], [2.4, [16, 8, 26], [5, 2, -20]], [4, [16, 10, 26], [5, -4, -30]], [5, [16, 10, 26], [5, -6, -32]]];   /* the rocket left of the card, the horizon below it */
    const camAt = p => { let a = CAMK[0], b = CAMK[0]; for (let i = 0; i < CAMK.length - 1; i++) if (p >= CAMK[i][0] && p <= CAMK[i + 1][0]) { a = CAMK[i]; b = CAMK[i + 1]; break; } if (p > CAMK[CAMK.length - 1][0]) a = b = CAMK[CAMK.length - 1]; const k = a === b ? 0 : smooth(0, 1, (p - a[0]) / (b[0] - a[0])); return { o: new T.Vector3().fromArray(a[1]).lerp(new T.Vector3().fromArray(b[1]), k), l: new T.Vector3().fromArray(a[2]).lerp(new T.Vector3().fromArray(b[2]), k) }; };
    const camPos = new T.Vector3(), camLook = new T.Vector3();
    let saidIdx = -1, lastIdx = -1, sepDone = false, liftDone = false, chuteDone = false, landed = false, lastBeep = -1, planeT = -1, sepUntil = 0, first = true;
    const beep = hi => { if (snd) snd.tone({ freq: hi ? 1320 : 880, gain: 0.12, attack: 0.005, decay: hi ? 0.5 : 0.18 }); };

    /* the height of the ship at time t, as layer progress */
    function progress(t) {
      if (!up) { if (t < T0) return 0; let x = t - T0; if (x >= CLIMB) return 5 + 0.6 * smooth(0, 1, (x - CLIMB) / 3);
        for (let i = 0; i < 5; i++) { if (x < DUP[i]) { const f = x / DUP[i]; return i + (i === 0 ? f * f * (1.6 - 0.6 * f) : f); } x -= DUP[i]; } return 5; }   /* a gentle start off the pad */
      if (t < HOLD) return 5.6 - 0.6 * smooth(0, HOLD, t); let x = t - HOLD;
      for (let i = 4; i >= 0; i--) { if (x < DDN[i]) { if (i > 0) return i + 1 - x / DDN[i]; const tc = voLen(layerKey(0)) + 0.5; if (x < tc) return 1 - 0.45 * x / tc; const f = (x - tc) / (DDN[0] - tc); return 0.55 * (1 - (2 - f) * f); } x -= DDN[i]; } return 0;   /* the troposphere: fall to parachute height while the line is said, then drift down under the chute */
    }

    function update(t, dt) {
      const p = progress(t), h = hv(Math.min(p, 5)) + (p > 5 ? (p - 5) * 5000 : 0);
      ship.position.y = h;
      /* sky, haze, light by height */
      const U = sky.material.uniforms; skyAt(ZEN, p, U.uZen.value); skyAt(HOR, p, U.uHor.value); U.uHorE.value = -Math.sqrt(Math.max(0, 1 - Math.pow(RE / (RE + h + 3), 2))); U.uSunI.value = 1 - smooth(1.5, 4, p) * 0.6;
      stars.material.opacity = smooth(1.8, 3.4, p); mw.material.opacity = smooth(2.8, 4.6, p) * 0.9;
      const EU = earth.material.uniforms; EU.uHaze.value = 0.0005 * (1 - smooth(0, 2.2, p)) + 0.00001; EU.uHazeCol.value.copy(U.uHor.value); EU.uTime.value = t;
      hemi.intensity = 0.9 - 0.55 * smooth(1, 4, p);
      meadow.material.opacity = 1 - smooth(0.9, 1.6, p); meadow.visible = meadow.material.opacity > 0.01; padG.visible = p < 1.8;
      const co = 0.7 * (1 - smooth(0.9, 1.4, p)); for (const c of clouds) { c.material.opacity = co; c.visible = co > 0.01; }
      /* the layer boundaries flash as you cross them */
      shells.forEach((m, i) => { m.material.uniforms.uFlash.value = Math.max(0, 1 - Math.abs(p - (i + 1)) / 0.18) * 0.8; m.material.uniforms.uA.value = 0.18 + 0.5 * smooth(1.5, 4, p); });
      karman.material.uniforms.uFlash.value = Math.max(0, 1 - Math.abs(p - pK) / 0.12) * 0.6;
      /* the card and the gauge */
      if (!up && t < T0) { const n = t < 0.45 ? 0 : t < 1.35 ? 3 : t < 2.25 ? 2 : 1; if (n) { H.card('c' + n, String(n), '', '', '#ffe7a8', true); if (n !== lastBeep) { lastBeep = n; beep(false); NAR.say('n' + n); } } }
      else if (!up && t < T0 + voLen('lift') + 0.4) { if (!liftDone) { liftDone = true; beep(true); NAR.say('lift'); } H.card('lift', tr('rk_liftoff'), '', '', '#ffe7a8', true); }
      else if (t > sepUntil) { const idx = p >= 5 ? 5 : Math.floor(p); if (idx !== lastIdx && (!up || t > 1.0)) { const again = saidIdx === idx; lastIdx = idx; saidIdx = idx; H.card('l' + idx, tr('rk_' + LAY[idx] + '_s'), range(idx), tr('rk_' + LAY[idx] + '_f'), COL[idx]); if (!again && (up ? idx < 5 : true)) NAR.say(layerKey(idx));   /* the name in its parts, said the same way */ if (snd && t > 1) snd.tone({ freq: 660 + idx * 110, gain: 0.07, attack: 0.01, decay: 0.7 }); } }
      if (up && landed) H.card('home', tr('rk_home'), '', '', '#9dffb8');
      H.gauge(p);
      if (!up) {
        /* the launch: arms swing back, ignition, smoke along the ground, the climb, the booster falling away */
        const ign = smooth(T0 - 1.1, T0 - 0.2, t), thrust = t >= T0 - 1.1;
        fl.visible = thrust && !sepDone; const fk = Math.max(0.01, (0.85 + 0.15 * Math.sin(t * 60) * Math.sin(t * 37)) * ign); fl.scale.set(fk, fk * (1 + smooth(0.5, 3, p) * 1.2), fk); fl.userData.glow.material.opacity = ign;
        flameLight.position.set(0, h - 1, 0); flameLight.intensity = (fl.visible ? 60 * ign : 0) * (1 - smooth(1.5, 3, p));
        tw.userData.arms.forEach((a, i) => { a.rotation.y = -smooth(T0 - 2.2 + i * 0.2, T0 - 1.2 + i * 0.2, t) * 1.3; });
        tw.userData.lamp.material.color.setRGB(Math.sin(t * 6) > 0 ? 3 : 0.3, 0.3, 0.2);
        if (thrust && p < 0.35 && t < T0 + 1.5) for (let k = 0; k < 2; k++) { const a = R(0, TAU); puff(new T.Vector3(Math.cos(a) * 2, 0.8, Math.sin(a) * 2), new T.Vector3(Math.cos(a) * R(4, 9), R(0.5, 2.5), Math.sin(a) * R(4, 9)), R(4, 7), R(2.5, 4.5)); }
        if (t > T0 && !sepDone && p < 3.1 && Math.random() < 0.6) puff(new T.Vector3(R(-0.3, 0.3), h - 2.5, R(-0.3, 0.3)), new T.Vector3(R(-1, 1), R(-4, -1), R(-1, 1)), 1.6 + p * 2, 2.0, p > 1.6 ? 0xb8c8e8 : null);
        if (!sepDone && p > sepP) { sepDone = true; booster.on = true; scene.attach(rk.userData.boost); booster.v.set(R(-3, 3), -6, R(-3, 3)); booster.spin.set(R(-1, 1), 0, R(-1, 1)); fl2.visible = true; if (snd) { SND.thud(snd); SND.whoosh(snd); } H.card('sep', tr('rk_sep'), '', '', '#ffd27a'); NAR.say('sep'); sepUntil = t + voLen('sep') + 0.6; lastIdx = -1; for (let k = 0; k < 14; k++) puff(new T.Vector3(R(-1, 1), h + 8, R(-1, 1)), new T.Vector3(R(-5, 5), R(-2, 2), R(-5, 5)), 3, 1.2, 0xffffff); }
        if (booster.on) { const b = rk.userData.boost; b.position.addScaledVector(booster.v, dt); booster.v.y -= 2 * dt; b.rotation.x += booster.spin.x * dt; b.rotation.z += booster.spin.z * dt; }
        if (fl2.visible) { const k2 = 0.85 + 0.15 * Math.sin(t * 50); fl2.scale.set(k2, k2 * 1.6, k2); }
        if (aud) { const k = ign * (1 - smooth(1, 4.2, p) * 0.85); aud.roar.set(0.55 * k, 160 + 260 * ign, 0.2); aud.hiss.set(0.06 * k, 900, 0.3); aud.pad.set(0.05 * smooth(4.6, 5.3, p)); }
      } else {
        /* re-entry: the shield glows in the thick of the air, the chute opens low, the capsule lands */
        const hk = p < 3.4 ? Math.max(0, Math.sin(clamp((p - 1.3) / 2.1, 0, 1) * PI)) : 0; heat.material.opacity = hk; heat.scale.setScalar(5 + hk * 4 + Math.sin(t * 40) * 0.4);
        if (hk > 0.3 && Math.random() < 0.8) puff(new T.Vector3(R(-0.6, 0.6), h + 0.5, R(-0.6, 0.6)), new T.Vector3(R(-1, 1), R(6, 12), R(-1, 1)), 2.5, 1.2, 0xffa050);
        if (!chuteDone && p <= 0.551) { chuteDone = true; ch.visible = true; if (snd) SND.whoosh(snd); NAR.say('chute'); }
        if (ch.visible) { const k = clamp(ch.scale.x + dt * 1.4, 0.01, 1); ch.scale.setScalar(k); cap.rotation.z = landed ? 0 : Math.sin(t * 1.2) * 0.06 * k; if (landed) { const f = smooth(0, 1.6, t - tLand); ch.position.set(-f * 2.6, -f * 3.2, -f * 1.4); ch.rotation.z = f * 1.3; ch.scale.y = Math.max(0.15, 1 - f * 0.85); } }   /* on the ground the chute sinks away behind */
        if (party) party.update(landed ? t - tLand : -1, dt, t);
        if (landed) { const gz = ov.querySelector('.rk-gauge'); if (gz) { gz.style.transition = 'opacity .8s'; gz.style.opacity = '0'; } }   /* on the ground the height gauge leaves: the crowd stands where it was */
        if (!landed && p < 0.004) { landed = true; tLand = t; NAR.say('home'); for (let k = 0; k < 18; k++) { const a = R(0, TAU); puff(new T.Vector3(Math.cos(a), 0.8, Math.sin(a)), new T.Vector3(Math.cos(a) * R(2, 5), R(0.2, 1.2), Math.sin(a) * R(2, 5)), 3, 2, 0xd8d0b8); } if (snd) SND.thud(snd); }
        fl.visible = false; flameLight.intensity = 0;
        if (aud) { aud.roar.set(0.35 * hk + 0.02, 300 + 400 * hk, 0.3); aud.hiss.set(0.12 * hk, 1400, 0.3); aud.pad.set(0.05 * smooth(3.5, 5.2, p)); }
      }
      for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.age += dt; const k = q.age / q.life; if (k >= 1) { scene.remove(q.s); q.s.material.dispose(); puffs.splice(i, 1); continue; } q.s.position.addScaledVector(q.vel, dt); q.vel.multiplyScalar(1 - dt * 0.9); q.s.scale.setScalar(q.size * (1 + k * 2.2)); q.s.material.opacity = 0.6 * Math.sin(PI * Math.min(1, k * 1.1)); }
      /* the airliner near the top of the troposphere, the balloon, meteors, auroras, the station, satellites */
      if (!up && planeT < 0 && p > 0.62) planeT = t; if (planeT > 0) { const q = (t - planeT) / 3.2; plane.visible = q < 1; plane.position.set(-70 + q * 140, hv(0.93), -36); if (plane.visible && Math.random() < 0.6) puff(plane.position.clone().add(new T.Vector3(-3, 0, R(-3, 3))), new T.Vector3(0, 0, 0), 0.9, 2.4, 0xffffff); }
      bal.position.y = hv(1.45) + Math.sin(t * 0.8) * 0.6; bal.visible = p > 0.9 && p < 2.3;
      const mOn = p > 1.9 && p < 3.3; for (const m of meteors) { if (mOn && t - m.t0 > 1.1 && Math.random() < 0.08) { m.t0 = t; const a = R(0, TAU); m.p0 = new T.Vector3(Math.cos(a) * R(60, 160) + R(-40, 40), h + R(20, 80), Math.sin(a) * R(40, 120) - 90); m.d = new T.Vector3(R(-1, 1), -R(0.6, 1), R(-0.4, 0.4)).normalize(); }
        const q = (t - m.t0) / 1.0; m.m.visible = mOn && q < 1 && !!m.p0; if (m.m.visible) { const L = 24 * Math.sin(q * PI) + 2; m.m.position.copy(m.p0).addScaledVector(m.d, q * 80 - L); m.m.lookAt(camera.position); const sd = new T.Vector3().copy(m.d).applyQuaternion(m.m.quaternion.clone().invert()); m.m.rotateZ(Math.atan2(sd.y, sd.x)); m.m.scale.set(L, 0.9, 1); } }
      am.uniforms.uTime.value = t; am.uniforms.uA.value = smooth(2.7, 3.2, p) * (1 - smooth(4.2, 4.8, p));
      iss.visible = p > 3.2 && p < 4.6; iss.rotation.y = 0.5 + t * 0.05;
      for (const s of sats) { s.visible = p > 3.8; s.rotation.y = t * 0.2 + s.userData.k; }
      /* the camera */
      const c = camAt(Math.min(p, 5)); if (camera.aspect < 1) c.l.x = c.o.x * c.l.z / c.o.z; else if (rtl()) { c.l.x = -c.l.x; c.o.x = -c.o.x; }   /* the ship never hides behind the gauge: centred on phones, mirrored in Hebrew (gauge on the left) */
      const base = new T.Vector3(ship.position.x, h, 0); let want = base.clone().add(c.o), look = base.clone().add(c.l);
      if (!up) { if (t < T0 + 1.6) { const k = smooth(T0 + 0.4, T0 + 1.6, t); want = new T.Vector3(15, 2.6, 21).lerp(want, k); look = new T.Vector3(0, 8, 0).lerp(new T.Vector3(0, h + 9, 0), smooth(T0, T0 + 1.2, t)).lerp(look, k); }
        if (p > 5) { const k = smooth(0, 1, (p - 5) / 0.6); want.lerp(base.clone().add(new T.Vector3(18, -6, 30)), k); look.lerp(moon.position.clone().sub(base).normalize().multiplyScalar(60).add(base), k); } }
      else { if (p > 5) { want = base.clone().add(new T.Vector3(26, 16, 40)); look = base.clone().add(new T.Vector3(0, -18, -30)); } if (p < 0.6) { const k = 1 - smooth(0, 0.6, p); want.lerp(base.clone().add(new T.Vector3(14, 3, 20)), k); look.lerp(base.clone().add(new T.Vector3(0, 4, 0)), k); } }
      want.sub(base); look.sub(base); if (up && p > 0.6) { want.multiplyScalar(0.6); look.multiplyScalar(0.6); }
      if (up && landed) { const k = smooth(0.4, 2.6, t - tLand), side = rtl() && camera.aspect >= 1 ? -1 : 1; want.lerp(new T.Vector3(7.5 * side, 4.6, 15.5), k); look.lerp(new T.Vector3(-0.5 * side, 1.7, -2.5), k); }   /* back off to show the crew, the astronauts and the crowd */   /* the capsule is small: come closer */   /* the camera eases in the rocket's own frame, so it never trails behind a fast climb */
      if (first) { camPos.copy(want); camLook.copy(look); first = false; }
      camPos.lerp(want, 1 - Math.exp(-dt * 6)); camLook.lerp(look, 1 - Math.exp(-dt * 7));
      const shake = !up && t > T0 - 1 ? Math.max(0, 1 - Math.abs(t - T0 - 0.4) / 1.4) * 0.12 : 0;
      camera.position.copy(camPos).add(base).add(new T.Vector3(R(-shake, shake), R(-shake, shake), 0)); camera.lookAt(camLook.clone().add(base));
      sky.position.copy(camera.position); stars.position.copy(camera.position); mw.position.copy(camera.position);
      renderer.toneMappingExposure = (1.05 + 0.25 * smooth(2, 4, p)) * (!up && t > DUR - 0.8 ? 1 - smooth(DUR - 0.8, DUR, t) * 0.6 : 1);
    }
    ret = { dur: DUR, update, speedable: true, setFast(on, t) { const w = where(t); fast = !!on; timeline(); return at(w); }, noteFor: 1.2, endColor: () => up ? '#bfe4ff' : '#05060f' };
    return ret;
  }
  launch.grade = 'sky';   /* low bloom: the words and the Earth stay crisp */
  KQRide.add('space', launch);

  /* ---------------------------------------------------------------- on the map: the rocket on its pad in the meadow (tap: fly to space), and in
     Space the same rocket standing on the Moon-rock (tap: fly home) */
  const PAD = { meadow: [36, -22], space: [36, -22] };
  function plot(k) { const at = PAD[k.REALM]; if (!at || !k.plot) return;
    k.plot('rocket', at[0], at[1], g => { const s = 0.62;
      const pad = new T.Mesh(new T.CylinderGeometry(4.2, 4.6, 0.6, 32), std(k.REALM === 'space' ? 0x8a8a94 : 0xb8b4ac, { roughness: 0.9 })); pad.position.y = 0.3; pad.receiveShadow = true; g.add(pad);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4, l = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.3, 8), new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.6, 0.4) })); l.position.set(Math.cos(a) * 3.8, 0.7, Math.sin(a) * 3.8); g.add(l); }
      const r = rocket(); r.scale.setScalar(s); r.position.y = 0.6; g.add(r); const tw = tower(); tw.scale.setScalar(s); tw.position.set(-2.1, 0.6, 0); g.add(tw);
      const puffs = []; for (let i = 0; i < 6; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); sp.userData.k = i / 6; g.add(sp); puffs.push(sp); }
      if (k.fx) k.fx((dt, tm) => { for (const sp of puffs) { const q = (tm * 0.35 + sp.userData.k) % 1; sp.position.set(Math.sin(sp.userData.k * 9) * (0.6 + q * 2), 0.8 + q * 1.4, Math.cos(sp.userData.k * 9) * (0.6 + q * 2)); sp.scale.setScalar(0.6 + q * 1.8); sp.material.opacity = 0.45 * Math.sin(q * PI); } tw.userData.lamp.material.color.setRGB(Math.sin(tm * 4) > 0 ? 3 : 0.3, 0.3, 0.2); });   /* a wisp of vapour at the base, a blinking lamp */
    }, { labelH: 12.5 }); }
  window.KQRocket = { plot };
  window.__rocket = { hv, km, LAY };   /* test hook */
})();
