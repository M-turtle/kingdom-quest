/* Kingdom Quest — SPACE (Yoni 2026-09-28: 'create another world in space, in the same intrinsic-integration mechanic, of the solar system
   and the Milky Way; add a black hole with a true representation of how it should look; whoever goes in reaches another universe of
   light creatures'). The way in is the rocket from the meadow (rocket.js). The map (kingdom3d.js) is the kingdom's rock floating among
   the stars; this file brings:
     THE BLACK HOLE   hanging in the sky, drawn by following the light itself: every pixel's ray is bent by the hole's gravity
                      (the Schwarzschild photon equation, integrated step by step), so you see what the physics gives — the black
                      shadow, the thin photon ring, the far side of the glowing disk lifted above and below it, the side that spins
                      toward you brighter and bluer (Doppler beaming), the inner edge reddened by gravity, the stars behind it bent.
                      Tap it and you fall in (a ride through the disk and the horizon) … and come out in
     THE LIGHTVERSE   a universe of light creatures. Its game, LIGHT SONG: the creatures sing a pattern — colours that repeat,
                      lights that grow, numbers that skip — and you pick the creature that sings the next note. The pattern IS the tune.
     STAR CONNECT     (math) join the stars in counting order — by ones, twos, fives, tens, back down, times tables — and a real
                      constellation lights up with its story.
     MISSION CONTROL  (reading) read the order from mission control and steer the probe to the right world in a real solar system.
     ASTEROID SPELLER (spelling) letters ride the asteroids; shoot them in the right order to spell the space word.
   Everything is built from primitives and shaders — no downloads, no cost. Hebrew in the plural (gender-neutral). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const pick = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o || {}));
  const t = (k, p) => KQ.t(k, p);

  /* ================================================================== the black hole: light followed through curved space
     Units: the Schwarzschild radius r_s = 1. A ray's path obeys d²x/dλ² = −(3/2)·h²·x/|x|⁵ (h = x × v, conserved), the standard exact form
     for light around a non-spinning hole. The photon sphere sits at 1.5, the innermost stable orbit (the disk's inner edge) at 3. */
  const BH_FRAG = [
    'uniform float uTime, uK, uFromCam, uFade; uniform vec3 uC, uN, uRo; varying vec3 vW;',
    'float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }',
    'float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'float n2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), f.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'vec3 stars(vec3 d){ vec3 col = vec3(0.0); for (int i = 0; i < 3; i++) { float sc = 40.0 + float(i) * 55.0; vec3 q = d * sc; vec3 id = floor(q); vec3 f = fract(q) - 0.5; float h = h13(id + float(i) * 17.0);',
    '  if (h > 0.93) { float s = smoothstep(0.35, 0.0, length(f)); col += s * mix(vec3(1.0, 0.82, 0.65), vec3(0.7, 0.82, 1.0), h13(id + 5.0)) * (1.6 - float(i) * 0.4); } }',
    '  col += vec3(0.05, 0.045, 0.07) * smoothstep(0.5, 0.0, abs(dot(d, normalize(vec3(0.3, 0.9, 0.2))))); return col; }',
    'void main(){ vec3 rd = normalize(vW - cameraPosition); vec3 p = uFromCam > 0.5 ? uRo : (vW - uC) * uK - rd * 40.0; vec3 v = rd;   /* start well in front of the hole: the near half of the disk lies between the camera and the billboard */ vec3 n = normalize(uN);',
    ' vec3 e1 = normalize(cross(n, abs(n.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0))), e2 = cross(n, e1);',
    ' vec3 hv = cross(p, v); float h2 = dot(hv, hv); vec3 col = vec3(0.0); float trans = 1.0; bool cap = false;',
    ' for (int i = 0; i < 150; i++) { float r = length(p); if (r < 1.0) { cap = true; break; } if (r > 80.0 && dot(p, v) > 0.0) break;',
    '  float dt = clamp(0.07 * r, 0.012, 2.0); vec3 pp = p; v += -1.5 * h2 * p / (r * r * r * r * r) * dt; p += v * dt;',
    '  float a0 = dot(pp, n), a1 = dot(p, n); if (a0 * a1 < 0.0) { vec3 q = mix(pp, p, a0 / (a0 - a1)); float rq = length(q);',
    '   if (rq > 2.6 && rq < 14.0) { float ang = atan(dot(q, e2), dot(q, e1)); float om = 1.0 / pow(rq, 1.5); float sw = ang + uTime * om * 3.0;',
    '    float turb = 0.5 + 0.5 * n2(vec2(rq * 2.2, sw * 4.0)) * (0.6 + 0.4 * sin(rq * 7.0 + sw * 2.0));',
    '    float vel = min(sqrt(0.5 / max(rq - 1.0, 0.5)), 0.7); vec3 tang = normalize(cross(n, q));',
    '    float D = sqrt(1.0 - vel * vel) / (1.0 - vel * dot(tang, -normalize(v))); float g = sqrt(max(1.0 - 1.0 / rq, 0.0)); float sh = D * g;',   /* Doppler × gravitational shift */
    '    float temp = pow(3.0 / rq, 0.9); vec3 base = mix(vec3(1.0, 0.32, 0.06), vec3(1.0, 0.86, 0.62), clamp(temp, 0.0, 1.0));',
    '    base = mix(base, vec3(0.8, 0.88, 1.0), clamp((sh - 1.0) * 1.2, 0.0, 0.7)); base *= mix(vec3(1.0), vec3(1.0, 0.55, 0.3), clamp((1.0 - sh) * 1.5, 0.0, 0.8));',
    '    float I = temp * 2.2 * pow(sh, 3.0) * turb * smoothstep(2.6, 3.4, rq) * smoothstep(14.0, 8.0, rq);',
    '    col += trans * base * I; trans *= 1.0 - clamp(I * 0.8 + 0.25, 0.0, 0.92) * smoothstep(2.6, 3.2, rq) * smoothstep(14.0, 10.0, rq); } }',
    '  if (trans < 0.02) break; }',
    ' if (!cap) col += trans * stars(normalize(v));',
    ' float bend = acos(clamp(dot(normalize(v), rd), -1.0, 1.0)); float a = cap ? 1.0 : clamp(max(smoothstep(0.004, 0.05, bend), 1.0 - trans), 0.0, 1.0);',
    ' if (uFromCam < 0.5) { vec3 lp = (vW - uC) * uK; float rr = length(lp - dot(lp, rd) * rd); a *= smoothstep(22.0, 15.0, rr); }',
    ' gl_FragColor = vec4(col * uFade, uFromCam > 0.5 ? 1.0 : a); }'].join('\n');
  function bhMat(o) {
    return new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uK: { value: o.k || 1 }, uFromCam: { value: o.fromCam ? 1 : 0 }, uFade: { value: 1 }, uC: { value: (o.c || new T.Vector3()).clone() }, uN: { value: (o.n || new T.Vector3(0, 1, 0)).clone() }, uRo: { value: new T.Vector3() } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }', fragmentShader: BH_FRAG });
  }

  /* ================================================================== the fall into the black hole (a KQRide scene) */
  const FALL = {
    en: { bh_c1: 'Black hole', bh_c1f: 'Its gravity is so strong that nothing can get out, not even light.', bh_c2: 'Accretion disk', bh_c2f: 'Gas whirling round so fast it glows hotter than the Sun. The side spinning toward you looks brighter.',
      bh_c3: 'Photon ring', bh_c3f: 'Light bent all the way round the hole: you can see the far side of the disk above and below it.', bh_c4: 'Event horizon', bh_c4f: 'The point of no return…',
      bh_c5: 'The other side', bh_c5f: 'Nobody knows what is inside a black hole. In our story it opens into another universe: a world of light creatures.', bh_note: 'Falling into the black hole…' },
    he: { bh_c1: 'חור שחור', bh_c1f: 'כוח המשיכה שלו חזק כל כך ששום דבר לא יכול לצאת ממנו, אפילו לא אור.', bh_c2: 'דסקת ספיחה', bh_c2f: 'גז שמסתחרר מהר כל כך שהוא זוהר חם יותר מהשמש. הצד שמסתובב לכיוונכם נראה בהיר יותר.',
      bh_c3: 'טבעת הפוטונים', bh_c3f: 'אור שמתעקם סביב החור: רואים את הצד הרחוק של הדסקה מעליו ומתחתיו.', bh_c4: 'אופק האירועים', bh_c4f: 'נקודת האל־חזור…',
      bh_c5: 'הצד השני', bh_c5f: 'אף אחד לא יודע מה יש בתוך חור שחור. בסיפור שלנו הוא נפתח אל יקום אחר: עולם של יצורי אור.', bh_note: 'נופלים לתוך החור השחור…' }
  };
  function fallCard(ov) { const st = document.createElement('style'); st.textContent = '.bh-card{position:absolute;right:max(16px,env(safe-area-inset-right));top:50%;transform:translate(14px,-50%);width:min(380px,44vw);box-sizing:border-box;padding:12px 18px 14px;border-radius:18px;background:rgba(10,8,24,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1.5px rgba(242,193,78,.7),0 12px 34px rgba(0,0,0,.45);color:#fff4dc;font-family:Rubik,"Secular One",system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .9s ease,transform .9s ease;pointer-events:none} .bh-card.on{opacity:1;transform:translate(0,-50%)} @media (max-width:640px){.bh-card{width:min(300px,62vw)}} .bh-card b{display:block;font-weight:900;font-size:clamp(20px,3.4vw,30px);color:#ffd6a0} .bh-card p{margin:6px 0 0;font-weight:600;font-size:clamp(15px,2vw,19px);line-height:1.35;color:#f2ecff}'; ov.appendChild(st);
    const card = document.createElement('div'); card.className = 'bh-card'; card.dir = KQ.i18n.lang === 'he' ? 'rtl' : 'ltr'; ov.appendChild(card); let cur = null, tm = 0;
    return k => { if (cur === k) return; cur = k; card.classList.remove('on'); clearTimeout(tm); tm = setTimeout(() => {   /* the old one fades out completely before the next fades in (Yoni 2026-10-03: fade in and out, time to read) */ const b = document.createElement('b'), p = document.createElement('p'); b.textContent = t(k); p.textContent = t(k + 'f'); card.replaceChildren(b, p); requestAnimationFrame(() => card.classList.add('on')); }, cur && card.textContent ? 950 : 50); }; }
  function fall(S, up, snd) {
    /* Yoni 2026-10-03: 'give a few more seconds for people to actually read it, it's too fast' — the whole fall runs at half speed (SLOW), so each
       notice stays up 4–6 s; the path and the light still follow the original 12.4 s script, read through s = tt / SLOW */
    const SLOW = 2.2, { scene, camera, renderer, ov } = S, DUR = 12.4 * SLOW; camera.near = 0.001; camera.far = 100; camera.updateProjectionMatrix(); scene.background = new T.Color(0);
    const card = fallCard(ov), n = new T.Vector3(0.12, 1, 0).normalize(), mat = bhMat({ fromCam: true, n }), quad = new T.Mesh(new T.PlaneGeometry(1, 1), mat); quad.frustumCulled = false; camera.add(quad); scene.add(camera); quad.position.z = -0.05;
    const white = document.createElement('div'); white.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#ffffff,#f4e8ff 45%,#d8c8ff);opacity:0;pointer-events:none'; ov.appendChild(white);
    let aud = null; if (snd) aud = { drone: snd.loop({ type: 'lowpass', freq: 90, gain: 0 }), hiss: snd.loop({ white: true, type: 'bandpass', freq: 600, q: 0.8, gain: 0 }), pad: snd.pad([220, 277, 330, 440], 'sine', 1400) };
    function update(t0, dt) { const tt = t0 / SLOW, w = window.innerWidth, h = window.innerHeight, H = 2 * Math.tan(camera.fov * PI / 360) * 0.05; quad.scale.set(H * w / h * 1.02, H * 1.02, 1);
      /* the path: from far away, spiralling in through the disk's plane, across the photon sphere, through the horizon */
      const r = tt < 3 ? 38 - 22 * smooth(0, 3, tt) : tt < 7 ? 16 - 13.2 * smooth(3, 7, tt) : 2.8 - 1.95 * smooth(7, 8.6, tt), th = 0.3 + tt * 0.22 + smooth(3, 8, tt) * 1.4, y = 2.2 * (1 - smooth(4, 8.6, tt)) + 0.3;
      const pos = new T.Vector3(Math.sin(th) * r, y, Math.cos(th) * r); camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0); camera.rotateZ(Math.sin(tt * 0.4) * 0.08);
      mat.uniforms.uRo.value.copy(pos); mat.uniforms.uTime.value = t0;   /* the disk keeps whirling at full speed */
      card(t0 < 5.4 ? 'bh_c1' : t0 < 10.8 ? 'bh_c2' : t0 < 16.2 ? 'bh_c3' : t0 < 19.6 ? 'bh_c4' : 'bh_c5');   /* real seconds on screen: ~4.4, 4.4, 4.4, 2.4 (a short line) and ~7, with a 1 s fade between */
      const light = smooth(8.4, 11.2, tt);   /* past the horizon the light of the other side opens at once */ white.style.opacity = String(light); mat.uniforms.uFade.value = 1 - light * 0.8;
      if (aud) { aud.drone.set(0.5 * smooth(0, 3, tt) * (1 - light), 70 + 40 * smooth(3, 9, tt), 0.3); aud.hiss.set(0.08 * smooth(3, 8, tt) * (1 - light), 500 + 800 * smooth(3, 9, tt), 0.3); aud.pad.set(0.07 * light); } }
    return { dur: DUR, update, skipAfter: 3, noteFor: 1.5, endColor: () => '#efe4ff' };
  }
  fall.grade = 'magic'; if (window.KQRide && KQRide.add) KQRide.add('blackhole', fall);

  /* ================================================================== the map: the black hole in the sky, the games' places */
  function landmarks(k) { const { T: T3, plot, height } = k;
    /* the black hole: high over the far edge of the rock, beyond the canyon */
    const BX = 16, BZ = -132, BY = -12, S = 70;   /* beside the rock, below its rim: seen past the edge in the default view */
    plot('sp_blackhole', BX, BZ, g => { const y0 = g.position.y, up = BY - y0; const cam = new T.Vector3(19, 45, 62), C = new T.Vector3(BX, BY, BZ), d = C.clone().sub(cam).normalize();
      let n = new T.Vector3(0, 1, 0); n.sub(d.clone().multiplyScalar(n.dot(d))).normalize(); n.sub(d.clone().multiplyScalar(0.22)).normalize();   /* seen almost edge-on from the meadow's view: the classic look */
      const mat = bhMat({ k: 22 / (S / 2), c: C, n }), bb = new T.Mesh(new T.PlaneGeometry(S, S), mat); bb.position.y = up; bb.renderOrder = 5; bb.frustumCulled = false; bb.onBeforeRender = (r, s, camera) => { bb.quaternion.copy(camera.quaternion); }; g.add(bb);
      g.userData.fly = { focus: up, dist: 95, up: 0 }; if (k.fx) k.fx((dt, tm) => { mat.uniforms.uTime.value = tm; }); }, { labelH: BY - height(BX, BZ) - 24 });
    /* the observatory (Star Connect): a white dome with an open slit and a telescope */
    plot('sp_stars', -22, -10, g => { const w = M(0xf2f0ea, { roughness: 0.5 }), dk = M(0x2a2c3a); const base = new T.Mesh(new T.CylinderGeometry(3, 3.2, 3.2, 28), w); base.position.y = 1.6; g.add(base);
      const dome = new T.Mesh(new T.SphereGeometry(3.05, 28, 14, 0, TAU, 0, PI / 2), w); dome.position.y = 3.2; g.add(dome); const slit = new T.Mesh(new T.BoxGeometry(1.1, 3.4, 3.2), dk); slit.position.set(0, 4.3, 1.1); slit.rotation.x = -0.5; g.add(slit);
      const tube = new T.Mesh(new T.CylinderGeometry(0.35, 0.5, 4, 16), M(0xd8b04a, { metalness: 0.8, roughness: 0.3 })); tube.position.set(0, 5.4, 1.4); tube.rotation.x = -0.9; g.add(tube);
      for (let i = 0; i < 12; i++) { const s = new T.Mesh(new T.OctahedronGeometry(0.2, 0), new T.MeshBasicMaterial({ color: new T.Color(2.5, 2.3, 1.4) })); s.userData.orbit = i % 3; g.add(s); } }, { labelH: 8 });
    /* mission control: a radar dish, a control hut with glowing screens, a small launch tower */
    plot('sp_mission', 24, 20, g => { const w = M(0xe8e8ee, { roughness: 0.5 }); const hut = new T.Mesh(new T.BoxGeometry(4.4, 2.4, 3.2), M(0xc8ccd8)); hut.position.y = 1.2; g.add(hut);
      for (let i = 0; i < 3; i++) { const sc = new T.Mesh(new T.PlaneGeometry(0.9, 0.6), new T.MeshBasicMaterial({ color: new T.Color(0.4, 1.6, 1.2) })); sc.position.set(-1.2 + i * 1.2, 1.5, 1.61); g.add(sc); }
      const dish = new T.Group(); dish.position.set(0, 4.6, -0.4); g.add(dish); dish.userData.spin = true; const bowl = new T.Mesh(new T.SphereGeometry(2.2, 24, 10, 0, TAU, 0, 1.0), M(0xf4f4f8, { side: T.DoubleSide, roughness: 0.4 })); bowl.rotation.x = -PI / 2 - 0.6; dish.add(bowl);
      const post = new T.Mesh(new T.CylinderGeometry(0.18, 0.25, 2.4, 10), w); post.position.set(0, 3.4, -0.4); g.add(post); const feed = new T.Mesh(new T.ConeGeometry(0.2, 1.4, 8), M(0xd8b04a, { metalness: 0.8 })); feed.position.set(0, 0.2, 1.2); feed.rotation.x = PI / 2 - 0.6; dish.add(feed); }, { labelH: 8 });
    /* the asteroid range: a turret on a pad and rocks with letters floating round it */
    plot('sp_spell', -30, 24, g => { const pad = new T.Mesh(new T.CylinderGeometry(2.6, 2.8, 0.5, 24), M(0x8a8a94)); pad.position.y = 0.25; g.add(pad);
      const tur = new T.Mesh(new T.SphereGeometry(1.2, 20, 14, 0, TAU, 0, PI / 2), M(0x5a7ad8, { metalness: 0.5, roughness: 0.4 })); tur.position.y = 0.5; g.add(tur); const gun = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 2.6, 12), M(0xd8d8e0, { metalness: 0.7 })); gun.position.set(0, 1.6, 0.6); gun.rotation.x = -0.9; g.add(gun);
      for (let i = 0; i < 3; i++) { const a = new T.Mesh(new T.DodecahedronGeometry(0.6, 0), M(0x8a7a6a, { flatShading: true })); a.userData.orbit = i; g.add(a); } }, { labelH: 7.5 });
    /* the Space Atlas: a round library with lit windows and a glass dome, a brass orrery turning on top, the open book on a lectern in front */
    plot('sp_atlas', 4, 30, g => { const stone = M(0xeae4d6, { roughness: 0.7 }), brass = M(0xd8b04a, { metalness: 0.85, roughness: 0.3 }), paper = M(0xf6efe0, { roughness: 0.8 });
      const base = new T.Mesh(new T.CylinderGeometry(2.4, 2.6, 3.2, 28), stone); base.position.y = 1.6; g.add(base);
      const band = new T.Mesh(new T.TorusGeometry(2.45, 0.12, 8, 40), brass); band.rotation.x = PI / 2; band.position.y = 3.2; g.add(band);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, w = new T.Mesh(new T.PlaneGeometry(0.5, 1.1), new T.MeshBasicMaterial({ color: new T.Color(1.4, 1.15, 0.7) })); w.position.set(Math.sin(a) * 2.47, 1.9, Math.cos(a) * 2.47); w.rotation.y = a; g.add(w); }
      const dome = new T.Mesh(new T.SphereGeometry(2.3, 28, 14, 0, TAU, 0, PI / 2), new T.MeshStandardMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.2 })); dome.position.y = 3.2; g.add(dome);
      const orr = new T.Group(); orr.position.y = 6.3; g.add(orr); orr.add(new T.Mesh(new T.SphereGeometry(0.42, 20, 14), new T.MeshBasicMaterial({ color: new T.Color(2.6, 2.0, 0.9) })));
      const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 1.7, 8), brass); post.position.y = -0.85; orr.add(post); const arms = [];
      [0x9a948c, 0xe8c890, 0x3a7ad0, 0xc0583a, 0xd8b088, 0xe8d8a8, 0x9ae0e8, 0x3a6ad8].forEach((col, i) => { const arm = new T.Group(), r = 0.75 + i * 0.32; orr.add(arm);
        const rod = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, r, 4), brass); rod.rotation.z = PI / 2; rod.position.x = r / 2; arm.add(rod);
        const pl = new T.Mesh(new T.SphereGeometry(i === 4 || i === 5 ? 0.18 : 0.11, 12, 8), M(col, { roughness: 0.6 })); pl.position.x = r; arm.add(pl); arm.rotation.y = i * 1.3; arms.push([arm, 0.9 / Math.sqrt(1 + i)]); });
      const lec = new T.Mesh(new T.CylinderGeometry(0.12, 0.18, 1.1, 8), brass); lec.position.set(0, 0.55, 3.4); g.add(lec);
      for (const sd of [-1, 1]) { const pg = new T.Mesh(new T.BoxGeometry(0.9, 0.06, 1.1), paper); pg.position.set(sd * 0.46, 1.18, 3.4); pg.rotation.set(-0.35, 0, -sd * 0.12); g.add(pg); }
      if (k.fx) k.fx(dt => { for (const [a, w] of arms) a.rotation.y += dt * w; }); }, { labelH: 8.5 });
    /* Who am I?: a brass telescope on its tripod, aimed at a world hidden in violet mist */
    plot('sp_whoami', -10, 22, g => { const brass = M(0xd8b04a, { metalness: 0.85, roughness: 0.3 }), dark = M(0x2a2c3a, { roughness: 0.6 });
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, leg = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 3.2, 8), dark); leg.position.set(Math.sin(a) * 0.7, 1.5, Math.cos(a) * 0.7); leg.rotation.set(Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25); g.add(leg); }
      const tube = new T.Mesh(new T.CylinderGeometry(0.32, 0.45, 3.4, 18), brass); tube.position.set(0.5, 3.6, 0.3); tube.rotation.set(0.35, 0, -0.75); g.add(tube);
      const mist = new T.Mesh(new T.SphereGeometry(1.5, 24, 16), new T.MeshStandardMaterial({ color: 0xb48cff, emissive: 0x6a3ad8, emissiveIntensity: 0.9, transparent: true, opacity: 0.55, roughness: 0.3 })); mist.position.set(2.6, 6.6, -0.6); g.add(mist);
      const core = new T.Mesh(new T.SphereGeometry(0.9, 20, 14), new T.MeshStandardMaterial({ color: 0xe8c890, roughness: 0.6 })); core.position.copy(mist.position); g.add(core);
      if (k.fx) k.fx((dt, tm) => { mist.position.y = core.position.y = 6.6 + Math.sin(tm * 0.9) * 0.25; mist.scale.setScalar(1 + Math.sin(tm * 1.7) * 0.06); }); }, { labelH: 9 });
    /* Weigh-in & jump: a launch pad with a giant scale and a spring, a little ball bouncing on it */
    plot('sp_gravity', 16, 34, g => { const steel = M(0xd8d8e0, { metalness: 0.6, roughness: 0.35 }), white = M(0xf2f0ea, { roughness: 0.4 });
      const pad = new T.Mesh(new T.CylinderGeometry(3.0, 3.2, 0.4, 32), M(0x8a8a94)); pad.position.y = 0.2; g.add(pad);
      const sc = new T.Mesh(new T.BoxGeometry(2.4, 0.4, 1.8), white); sc.position.set(-0.9, 0.6, 0); g.add(sc); const dial = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.06, 24), M(0x2a2236)); dial.position.set(-0.9, 0.83, 0.45); g.add(dial);
      const nd = new T.Mesh(new T.BoxGeometry(0.05, 0.02, 0.36), M(0xff5a3a)); nd.position.set(-0.9, 0.87, 0.45); g.add(nd);
      for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.TorusGeometry(0.42, 0.06, 8, 20), steel); r.rotation.x = PI / 2; r.position.set(1.4, 0.55 + i * 0.22, 0); g.add(r); }
      const ball = new T.Mesh(new T.SphereGeometry(0.42, 18, 12), M(0xe8473a, { roughness: 0.4 })); ball.position.set(1.4, 2.2, 0); g.add(ball);
      if (k.fx) k.fx((dt, tm) => { const ph = (tm * 0.8) % 1; ball.position.y = 2.0 + 3.2 * 4 * ph * (1 - ph); nd.rotation.y = Math.sin(tm * 2) * 0.8; }); }, { labelH: 8 });
    /* Line them up: a brass rail with the eight planets on posts, in order from the Sun */
    plot('sp_lineup', 30, 4, g => { const brass = M(0xd8b04a, { metalness: 0.85, roughness: 0.3 });
      const rail = new T.Mesh(new T.TorusGeometry(5, 0.08, 8, 48, PI * 0.9), brass); rail.rotation.x = PI / 2; rail.rotation.z = PI * 0.55; rail.position.y = 1.2; g.add(rail);
      [[0x9a948c, 0.22], [0xe8c890, 0.32], [0x3a7ad0, 0.34], [0xc0583a, 0.26], [0xd8b088, 0.7], [0xe8d8a8, 0.6], [0x9ae0e8, 0.45], [0x3a6ad8, 0.44]].forEach(([col, r], i) => { const a = PI * 0.55 + (i / 7) * PI * 0.9;
        const x = Math.cos(a) * 5, z = -Math.sin(a) * 5, post = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.2, 6), brass); post.position.set(x, 1.8, z); g.add(post);
        const pl = new T.Mesh(new T.SphereGeometry(r, 16, 12), M(col, { roughness: 0.6 })); pl.position.set(x, 2.4 + r, z); g.add(pl); pl.userData.spin = true; }); }, { labelH: 6 });
  }

  /* ================================================================== THE LIGHTVERSE: a universe of light creatures, and LIGHT SONG */
  const NOTE_COL = [0xff6ad0, 0x5ae8ff, 0xffd84a, 0x8aff7a, 0xb88aff];   /* each colour sings its own note (C D E G A) */
  const NOTE_HZ = [523.25, 587.33, 659.25, 783.99, 880.0];
  const THEMES = {
    sp_lightverse: { palette: { noFloor: true, sky: 0x140a2e, ground: 0x0a0618, fog: 0x1a0f3a, wall: ['plank', '#1a1030', '#140c26'], floor: ['plank', '#140c26', '#100a20'], hemi: [0xb89aff, 0x2a1a4a], key: 0xf0e0ff, dust: { c: 0xd8c8ff, n: 60, mode: 'drift' } },
      look: { keyC: 0xf0e0ff, grade: 'dusk', exposure: 1.0, fogD: 0.01, rim: 0xc8a0ff, face: 0x1a1040, accent: '#e8d0ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { scene } = c; if (KQRealms.hall && KQRealms.hall.skyDome) KQRealms.hall.skyDome(c, 0x0a0620, 0x3a1a6a);
        /* ribbons of light and far-away beings drifting in the deep */
        const rib = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, uniforms: { uT: { value: 0 } },
          vertexShader: 'uniform float uT; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.y += sin(p.x * 0.15 + uT * 0.6) * 2.0; p.z += sin(p.x * 0.08 - uT * 0.4) * 3.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
          fragmentShader: 'uniform float uT; varying vec2 vUv; void main(){ float a = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y) * (0.5 + 0.5 * sin(vUv.x * 40.0 + uT)) * smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x); vec3 c = mix(vec3(1.0, 0.5, 0.9), vec3(0.4, 0.9, 1.0), vUv.x); gl_FragColor = vec4(c * a * 0.5, a * 0.5); }' });
        for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.PlaneGeometry(80, 6, 80, 1), rib); m.position.set(0, 9 + i * 4, -26 - i * 8); m.rotation.z = (i - 1) * 0.12; scene.add(m); }
        c.updaters.push((dt, tm) => { rib.uniforms.uT.value = tm; });
        for (let i = 0; i < 16; i++) { const cr = creature(c, NOTE_COL[i % 5], 0.5 + Math.random() * 0.5); const a = Math.random() * TAU, r = 18 + Math.random() * 20; cr.position.set(Math.cos(a) * r, 2 + Math.random() * 12, -12 - Math.random() * 26); scene.add(cr); const k = Math.random() * 6; c.updaters.push((dt, tm) => { cr.position.y += Math.sin(tm * 0.6 + k) * 0.01; cr.userData.anim(tm + k, 0.4); }); }
        for (let i = 0; i < 60; i++) { const s = c.sprite(pick(NOTE_COL), 0.3 + Math.random() * 0.5, (Math.random() - 0.5) * 60, Math.random() * 18, -6 - Math.random() * 30, null, 0.8); const k = Math.random() * 6; c.updaters.push((dt, tm) => { s.material.opacity = 0.4 + 0.4 * Math.sin(tm * 1.5 + k); }); }
      } }
  };
  /* a light creature: a glowing bell with trailing tendrils, big friendly eyes and a small smile; anim(t, amount) makes it swim */
  function creature(c, col, s) {
    const g = new T.Group(), glow = new T.Color(col), body = new T.MeshStandardMaterial({ color: glow.clone().lerp(new T.Color(0xffffff), 0.12), emissive: glow, emissiveIntensity: 0.75, roughness: 0.35, transparent: true, opacity: 0.94 });   /* rich colour, not a white bloom: the colour IS the note */
    const bell = new T.Mesh(new T.SphereGeometry(0.8, 28, 18, 0, TAU, 0, PI * 0.62), body); bell.scale.set(1, 0.95, 1); g.add(bell);
    const rim = new T.Mesh(new T.TorusGeometry(0.66, 0.08, 8, 28), body); rim.rotation.x = PI / 2; rim.position.y = -0.3; g.add(rim);
    const core = c.sprite(col, 2.2, 0, 0.1, 0, g, 0.45);
    const dark = new T.MeshBasicMaterial({ color: 0x1a1030 }), shine = new T.MeshBasicMaterial({ color: 0xffffff });
    for (const sd of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.13, 12, 10), dark); e.scale.set(1, 1.3, 0.6); e.position.set(sd * 0.26, 0.2, 0.7); g.add(e); const h = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), shine); h.position.set(sd * 0.26 - 0.04, 0.27, 0.78); g.add(h); }
    const smile = new T.Mesh(new T.TorusGeometry(0.12, 0.025, 6, 16, PI), dark); smile.rotation.z = PI; smile.position.set(0, -0.02, 0.76); g.add(smile);
    const tend = []; const tm = new T.LineBasicMaterial({ color: glow.clone().lerp(new T.Color(0xffffff), 0.3), transparent: true, opacity: 0.8 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, pts = []; for (let j = 0; j < 10; j++) pts.push(new T.Vector3(Math.cos(a) * 0.45, -0.3 - j * 0.16, Math.sin(a) * 0.45)); const geo = new T.BufferGeometry().setFromPoints(pts); const ln = new T.Line(geo, tm); g.add(ln); tend.push({ ln, a }); }
    g.scale.setScalar(s || 1);
    g.userData = { body, core, glow: 1, anim(tt, amt) { const k = amt == null ? 1 : amt; bell.scale.y = 0.95 + Math.sin(tt * 3) * 0.06 * k; for (const td of tend) { const p = td.ln.geometry.attributes.position; for (let j = 0; j < 10; j++) p.setXYZ(j, Math.cos(td.a) * (0.45 + Math.sin(tt * 3 - j * 0.5) * 0.06 * j * k), -0.3 - j * 0.16, Math.sin(td.a) * 0.45 + Math.sin(tt * 2.2 + j * 0.6 + td.a) * 0.05 * j * k); p.needsUpdate = true; } },
      light(v) { body.emissiveIntensity = 0.35 + 1.0 * v; core.material.opacity = 0.2 + 0.55 * v; } };
    return g;
  }
  /* the patterns, gently harder band by band: colours that repeat → lights that grow → numbers that skip → times and squares */
  function songFor(b, i) {
    const col = (arr) => ({ kind: 'col', seq: arr });
    const P = (arr, n) => arr.slice(0, n);
    if (b <= 1) { const A = shuffle([0, 1, 2, 3, 4]); const unit = i < 3 ? [A[0], A[1]] : [A[0], A[1], A[2]]; const seq = []; while (seq.length < 6) seq.push(unit[seq.length % unit.length]); return Object.assign(col(seq), { rule: unit.length === 2 ? 'ab' : 'abc' }); }
    if (b === 2) { const A = shuffle([0, 1, 2, 3, 4]); const unit = pick([[A[0], A[0], A[1]], [A[0], A[1], A[1]], [A[0], A[1], A[2]], [A[0], A[0], A[1], A[1]]]); const seq = []; while (seq.length < 7) seq.push(unit[seq.length % unit.length]); return Object.assign(col(seq), { rule: 'unit' }); }
    if (b === 3) { if (i % 2 === 0) { const s = ri(1, 2), d = 1, seq = []; for (let k = 0; k < 5; k++) seq.push(s + k * d); return { kind: 'dots', seq, rule: 'grow', d }; } const A = shuffle([0, 1, 2, 3, 4]); const unit = [A[0], A[1], A[2]]; const seq = []; while (seq.length < 7) seq.push(unit[seq.length % 3]); return Object.assign(col(seq), { rule: 'unit' }); }
    if (b === 4) { const d = pick([2, 5, 10, 3]), s = d === 10 ? ri(1, 3) * 10 : ri(0, 4) * d + (d === 3 ? 0 : 0), seq = []; for (let k = 0; k < 5; k++) seq.push(s + k * d); return { kind: 'num', seq, rule: 'add', d }; }
    if (b === 5) { const r = pick(['sub', 'dbl', 'add4']); if (r === 'sub') { const d = pick([2, 3, 5]), s = d * ri(6, 9), seq = []; for (let k = 0; k < 5; k++) seq.push(s - k * d); return { kind: 'num', seq, rule: 'sub', d }; } if (r === 'dbl') { const s = pick([1, 2, 3]), seq = []; for (let k = 0; k < 5; k++) seq.push(s * Math.pow(2, k)); return { kind: 'num', seq, rule: 'dbl' }; } const s = pick([1, 3, 5]), seq = []; for (let k = 0; k < 5; k++) seq.push(s + 4 * k); return { kind: 'num', seq, rule: 'add', d: 4 }; }
    const r = pick(['alt', 'sq', 'fib']); if (r === 'alt') { const seq = [ri(2, 6)]; for (let k = 1; k < 6; k++) seq.push(seq[k - 1] + (k % 2 ? 3 : -1)); return { kind: 'num', seq, rule: 'alt' }; } if (r === 'sq') return { kind: 'num', seq: [1, 4, 9, 16, 25], rule: 'sq' }; return { kind: 'num', seq: [1, 1, 2, 3, 5, 8], rule: 'fib' };
  }
  const STAGES = {
    sp_light(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2 };
      let row = [], cands = [], tabs = [];
      const audio = (() => { let ac = null; return { note(i, when) { try { if (!(KQ.state().settings || {}).sfx) return; ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t0 = ac.currentTime + (when || 0), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = NOTE_HZ[i % 5]; o2.frequency.value = NOTE_HZ[i % 5] * 2; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.12, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9); o.connect(g); o2.connect(g); g.connect(ac.destination); o.start(t0); o2.start(t0); o.stop(t0 + 1); o2.stop(t0 + 1); } catch (e) {} }, close() { try { ac && ac.close(); } catch (e) {} } }; })();
      /* what a creature shows: its colour (and note); for 'dots' a ring of little lights; for 'num' its number on a crisp tablet below */
      function dress(cr, song, v) { if (song.kind === 'dots') { for (let j = 0; j < v; j++) { const a = j / v * TAU; const d = c.sprite(0xffffff, 0.34, Math.cos(a) * 1.2, 0.2 + Math.sin(a) * 1.2, 0.3, cr, 0.95); d.userData.dot = true; } }
        if (song.kind === 'num') { const tb = c.label(String(v), -1, 0.62); tb.position.set(0, -2.6, 0); cr.add(tb); tabs.push(tb); } }
      const colOf = (song, v) => song.kind === 'col' ? NOTE_COL[v] : NOTE_COL[(song.kind === 'dots' ? v : Math.abs(v)) % 5];
      const noteOf = (song, v) => song.kind === 'col' ? v : Math.abs(v) % 5;
      function clear() { for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } for (const o of row.concat(cands)) scene.remove(o); row = []; cands = []; }
      function layout(n) { const nar = K.narrow(), cam = c.camera, vw = 2 * Math.tan(cam.fov * PI / 360) * (nar ? 17.5 : 13.5) * cam.aspect, w = Math.min(nar ? 2.3 : 3.1, vw * 0.9 / n); return i => new T.Vector3((i - (n - 1) / 2) * w, nar ? 3.4 : 1.9, 0); }   /* the whole song fits the screen, however long — and sits below the question plaque (it used to tuck under it) */
      async function sing(list, song, vals) { for (let j = 0; j < list.length; j++) { const cr = list[j]; if (!cr) continue; audio.note(noteOf(song, vals[j])); await K.anim(0.34, k => { cr.userData.light(Math.sin(k * PI)); cr.scale.setScalar(cr.userData.s * (1 + 0.18 * Math.sin(k * PI))); }); cr.userData.light(0.35); } }
      async function round(i, n, kick) { clear(); const song = songFor(S.band, i), seq = song.seq, show = seq.length - 1, ans = seq[show], pos = layout(seq.length), nar = K.narrow(); S.ans = ans; S.picking = false;
        for (let j = 0; j < show; j++) { const cr = creature(c, colOf(song, seq[j]), 0.95); cr.userData.s = 0.95; cr.position.copy(pos(j)); dress(cr, song, seq[j]); scene.add(cr); row.push(cr); const k = j * 0.7; c.updaters.push((dt, tm) => { if (cr.parent) cr.userData.anim(tm + k); }); }
        const ghost = new T.Mesh(new T.TorusGeometry(0.9, 0.05, 8, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); ghost.position.copy(pos(show)); scene.add(ghost); row.push(ghost); c.updaters.push((dt, tm) => { ghost.material.opacity = 0.3 + 0.3 * Math.sin(tm * 3); });
        /* three creatures offer to sing the next note */
        const wrongs = []; if (song.kind === 'col') { for (const v of shuffle([0, 1, 2, 3, 4])) if (v !== ans && wrongs.length < 2) wrongs.push(v); } else { const d = song.d || 1; for (const v of shuffle([ans + d, ans - d, ans + 1, ans - 1, ans + 2, seq[show - 1]])) if (v !== ans && v >= 0 && !wrongs.includes(v) && wrongs.length < 2) wrongs.push(v); }
        const opts = shuffle([ans].concat(wrongs)); opts.forEach((v, j) => { const cr = creature(c, colOf(song, v), 0.9); cr.userData.s = 0.9; cr.userData.v = v; cr.position.set((j - 1) * (nar ? 2.6 : 3.4), nar ? -1.4 : -1.85, 1.4); dress(cr, song, v); scene.add(cr); cands.push(cr); const k = j * 1.3 + 3; cr.userData.home = cr.position.clone(); c.updaters.push((dt, tm) => { if (cr.parent && !cr.userData.busy) { cr.userData.anim(tm + k); cr.position.y = cr.userData.home.y + Math.sin(tm * 1.2 + k) * 0.12; } }); });
        K.tell(kick, t('ls_listen')); await K.wait(0.4); await sing(row.slice(0, show), song, seq); if (!K.alive()) return null;
        K.tell(kick, t('ls_which')); const hintKey = 'ls_h_' + song.rule; K.hint(() => { K.tell(kick, t(hintKey, { d: song.d || '' })); sing(row.slice(0, show), song, seq); });
        for (let tries = 0; tries < 2; tries++) {
          S.picking = true; const chosen = await new Promise(res => { K.pointer = { down(e) { const h = K.hit(e, cands.filter(x => !x.userData.used)); if (!h) return false; let o = h.object; while (o && !cands.includes(o)) o = o.parent; if (o) { K.pointer = null; res(o); } return !!o; }, cursor: () => 'pointer' }; });
          S.picking = false; if (!K.alive()) return null; chosen.userData.busy = true; K.sfx('tap'); await K.glide(chosen, pos(show), 0.7, 1.2);
          if (chosen.userData.v === ans) { ghost.visible = false; row[show] = chosen; chosen.scale.setScalar(0.95); chosen.userData.s = 0.95; K.sfx('correct'); K.tell(kick, t('ls_yes'));
            await sing(row, song, seq); for (const cr of row) c.burst(cr.position.clone(), colOf(song, seq[row.indexOf(cr)]), 10); await K.wait(0.6); K.hint(null); return tries === 0 ? 1 : 2; }
          K.sfx('wrong'); chosen.userData.light(0.05); audio.note(noteOf(song, chosen.userData.v)); K.tell(kick, t(tries === 0 ? 'ls_no' : 'ls_no2')); await K.wait(0.9); await K.glide(chosen, chosen.userData.home, 0.6, 0.6); chosen.userData.used = true; chosen.userData.busy = false; chosen.userData.light(0.1);
          if (tries === 0) { K.tell(kick, t(hintKey, { d: song.d || '' })); await sing(row.slice(0, show), song, seq); } }
        const right = cands.find(x => x.userData.v === ans); right.userData.busy = true; K.tell(kick, t('ls_show')); await K.glide(right, pos(show), 0.8, 1.2); ghost.visible = false; row[show] = right; await sing(row, song, seq); await K.wait(0.5); K.hint(null); return 0; }
      function frame(a) { const nar = a < 1.05; return nar ? { pos: [0, 1.2, 17.5], look: [0, 1.2, 0], fov: 58 } : { pos: [0, 1.6, 13.5], look: [0, 0.9, 0], fov: 46 }; }
      async function play(api) { K.mount(api); S.band = clamp(api.band || 2, 1, 6); window.__light = { S, row: () => row, cands: () => cands }; const N = 6, done = []; let pts = 0; api.pips(N, done);
        const nm = t('sp_blackhole'); await K.intro(async () => { K.tell(nm, t('ls_hi')); await K.act(t('ls_start')); }); if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const r = await round(i, N, t('ls_song', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 5 : 0; done.push(r === 1); api.pips(N, done); await K.wait(0.4); }
        clear(); const right = done.filter(Boolean).length; K.tell(nm, t('ls_win')); await K.wait(1.4);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('ls_win') }); }
      function dispose() { K.dispose(); clear(); audio.close(); }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };


  /* ================================================================== STAR CONNECT: count your way across a real constellation
     The stars wear numbers; joining them in counting order draws the figure. Harder bands tell you less: from 'count by 2s from 4' to
     'the first two are joined — find the rule'. Spare stars carry the numbers a guess would reach for (the +1 next to a +2 count). */
  const CONST = [
    { id: 'dipper', pts: [[-1.0, 0.35], [-0.62, 0.45], [-0.3, 0.38], [0.0, 0.28], [0.62, 0.32], [0.56, -0.12], [0.05, -0.06]], close: [[6, 3]] },
    { id: 'cassiopeia', pts: [[-1.0, 0.3], [-0.5, -0.2], [0.0, 0.1], [0.45, -0.3], [1.0, 0.2]] },
    { id: 'orion', pts: [[-0.45, 0.62], [0.42, 0.52], [0.16, 0.02], [0.0, -0.08], [-0.16, -0.18], [-0.36, -0.75], [0.45, -0.66]], close: [[4, 0]] },
    { id: 'cygnus', pts: [[0.0, 0.92], [0.0, 0.22], [0.0, -0.9], [-0.78, 0.42], [0.78, 0.02]], jump: [3, 4], close: [[3, 1], [1, 4]] },
    { id: 'leo', pts: [[0.92, 0.55], [0.76, 0.72], [0.55, 0.56], [0.44, 0.3], [0.56, 0.02], [0.55, -0.32], [-0.38, -0.12], [-0.96, -0.1], [-0.4, 0.3]], close: [[8, 3]] },
    { id: 'scorpius', pts: [[0.92, 0.66], [0.8, 0.36], [0.55, 0.24], [0.32, 0.05], [0.16, -0.25], [0.1, -0.56], [-0.18, -0.76], [-0.54, -0.72], [-0.76, -0.5], [-0.66, -0.28]] },
    { id: 'crux', pts: [[0.0, 0.85], [0.0, -0.85], [-0.62, 0.08], [0.52, 0.26]], jump: [2] },
    { id: 'lyra', pts: [[0.05, 0.9], [-0.12, 0.3], [-0.22, -0.48], [0.2, -0.54], [0.32, 0.24]], close: [[4, 1]] }
  ];
  /* the counting rule for a band: start, step, told (the plaque names the rule) or shown (the first two stars come joined) */
  function countRule(b, n) {
    if (b <= 1) return { s: 1, d: 1, told: true, spare: 0 };
    if (b === 2) return pick([{ s: ri(3, 9), d: 1, told: true, spare: 2 }, { s: ri(n + 1, 12), d: -1, told: true, spare: 2 }]);
    if (b === 3) return pick([{ s: pick([2, 4, 6]), d: 2, told: true, spare: 3 }, { s: pick([5, 10, 15]), d: 5, told: true, spare: 3 }, { s: pick([10, 20, 30]), d: 10, told: true, spare: 3 }]);
    if (b === 4) return pick([{ s: 3, d: 3, told: false, spare: 4 }, { s: 4, d: 4, told: false, spare: 4 }, { s: 25, d: 25, told: false, spare: 4 }, { s: pick([30, 40]), d: -2, told: false, spare: 4 }, { s: pick([50, 60]), d: -5, told: false, spare: 4 }]);
    if (b === 5) { const k = pick([6, 7, 8, 9]); return pick([{ s: k, d: k, told: false, spare: 4 }, { s: 0.5, d: 0.5, told: false, spare: 4 }, { s: pick([100, 200]), d: pick([100, 50]), told: false, spare: 4 }]); }
    return pick([{ s: pick([-12, -9]), d: 3, told: false, spare: 5 }, { s: 0.25, d: 0.25, told: false, spare: 5 }, { s: 1, d: 0, dbl: true, told: false, spare: 5 }, { s: pick([12, 15]), d: -3, told: false, spare: 5 }]);
  }
  const fmtN = v => KQKit.fmtNum(v);
  STAGES.sp_stars = function (c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2 }; let stars = [], lines = [], tabs = [], hits = [];
    const lineM = new T.MeshBasicMaterial({ color: new T.Color(1.2, 1.1, 0.7), transparent: true, opacity: 0.9 });
    function clear() { for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } for (const o of stars.concat(lines)) scene.remove(o); stars = []; lines = []; hits = []; }
    function link(a, b, dur) { const A = a.position.clone(), B = b.position.clone(), m = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 1, 6), lineM); scene.add(m); lines.push(m); const up = new T.Vector3(0, 1, 0);
      return K.anim(dur || 0.35, k => { const e = A.clone().lerp(B, k), mid = A.clone().lerp(e, 0.5), len = Math.max(0.001, A.distanceTo(e)); m.position.copy(mid); m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(up, e.clone().sub(A).normalize().lengthSq() ? e.clone().sub(A).normalize() : up); }); }
    function star(v, x, y, real) { const g = new T.Group(); g.position.set(x, y, 0); const core = new T.Mesh(new T.SphereGeometry(0.16, 14, 10), new T.MeshBasicMaterial({ color: new T.Color(2.2, 2.1, 1.7) })); g.add(core);
      const halo = c.sprite(real ? 0xfff0c0 : 0xd8e4ff, 1.0, 0, 0, 0, g, 0.6); const hit = new T.Mesh(new T.SphereGeometry(0.75, 10, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); g.add(hit);
      const tb = c.label(fmtN(v), -1, 0.52); tb.position.set(0, -0.72, 0.05);   /* numbers big enough to read at a glance */ g.add(tb); tabs.push(tb); g.userData = { v, halo, hit, tb, real }; hit.userData.star = g; hits.push(hit); scene.add(g); stars.push(g);
      const k = Math.random() * 6; c.updaters.push((dt, tm) => { if (g.parent) halo.material.opacity = (g.userData.on ? 0.85 : 0.45) + 0.12 * Math.sin(tm * 2.4 + k); }); return g; }
    async function sky(i, n, kick) { clear(); const b = S.band, fit = CONST.filter(q => b <= 1 ? q.pts.length <= 7 : b === 2 ? q.pts.length <= 9 : true), C = S.order[i] ? CONST.find(q => q.id === S.order[i]) : pick(fit), N = C.pts.length, R = countRule(b, N);
      const seq = []; for (let j = 0; j < N; j++) seq.push(R.dbl ? Math.pow(2, j) : +(R.s + j * R.d).toFixed(3));
      const nar = K.narrow(), sx = nar ? 3.1 : 6.0, sy = nar ? 4.0 : 2.7, oy = nar ? -0.2 : 0.1,   /* below the plaque */ real = C.pts.map(([x, y], j) => star(seq[j], x * sx, y * sy + oy, true));
      /* spare stars: numbers the rule skips (or that a slip would reach for), placed away from the figure */
      const used = new Set(seq.map(String)), pool = []; const lo = Math.min(...seq), hi = Math.max(...seq), st = Math.abs(R.d) || 1;
      for (let v = lo - st; v <= hi + st; v = +(v + (st >= 1 ? 1 : st / 2)).toFixed(3)) if (!used.has(String(v)) && (v >= 0 || lo < 0)) pool.push(v);
      for (const v of shuffle(pool).slice(0, R.spare)) { let p = null; for (let tr = 0; tr < 60 && !p; tr++) { const x = (Math.random() * 2 - 1) * sx * 1.05, y = (Math.random() * 2 - 1) * sy * 0.95 + oy; if (stars.every(s2 => s2.position.distanceTo(new T.Vector3(x, y, 0)) > 1.5)) p = [x, y]; } if (p) star(v, p[0], p[1], false); }
      let at = 0; if (!R.told) { real[0].userData.on = true; real[1].userData.on = true; await link(real[0], real[1], 0.5); at = 2; } else { real[0].userData.on = true; at = 1; }
      const rule = R.dbl ? t('st_rDbl') : t(R.d > 0 ? 'st_rUp' : 'st_rDown', { d: fmtN(Math.abs(R.d)), s: fmtN(R.s) });
      K.tell(kick, R.told ? t('st_told', { rule }) : t('st_find')); K.hint(() => K.tell(kick, R.told ? t('st_hintTold', { n: fmtN(seq[at]) }) : t('st_hintFind', { a: fmtN(seq[0]), b: fmtN(seq[1]) })));
      let miss = 0;
      while (at < N) { S.want = real[at]; S.waiting = true; const got = await new Promise(res => { K.pointer = { down(e) { const h = K.hit(e, hits); if (!h) return false; K.pointer = null; res(h.object.userData.star); return true; }, cursor: () => 'pointer' }; }); S.waiting = false; if (!K.alive()) return null;
        if (got === real[at]) { K.sfx('tick'); got.userData.on = true; if (!(C.jump || []).includes(at)) await link(real[at - 1], got); at++; continue; }
        if (got.userData.on) continue; miss++; K.sfx('wrong'); const tb = got.userData.tb; tb.userData.tablet.setState('wrong'); setTimeout(() => { try { tb.userData.tablet.setState(null); } catch (e) {} }, 900); K.tell(kick, t('st_no', { v: fmtN(got.userData.v) })); await K.wait(1.2); K.tell(kick, R.told ? t('st_told', { rule }) : t('st_find')); }
      for (const [a, b2] of C.close || []) await link(real[a], real[b2], 0.3);
      K.sfx('correct'); for (const s2 of real) c.burst(s2.position.clone(), 0xfff0c0, 6); K.tell(t('cs_' + C.id), t('cs_' + C.id + '_f')); K.hint(null); await K.act(t('st_next')); return miss === 0 ? 1 : miss <= 2 ? 2 : 0; }
    function frame(a) { return a < 1.05 ? { pos: [0, 1.4, 18.5], look: [0, 1.0, 0], fov: 56 } : { pos: [0, 1.4, 14.5], look: [0, 1.0, 0], fov: 46 }; }
    async function play(api) { K.mount(api); S.band = clamp(api.band || 2, 1, 6); window.__stars = { S, stars: () => stars }; const N = 4, done = []; let pts = 0; api.pips(N, done);
      S.order = shuffle(CONST.filter(q => S.band <= 1 ? q.pts.length <= 7 : S.band === 2 ? q.pts.length <= 9 : true).map(q => q.id)).slice(0, N);
      const nm = t('sp_stars'); await K.intro(async () => { K.tell(nm, t('st_hi')); await K.act(t('st_start')); }); if (!K.alive()) return;
      for (let i = 0; i < N; i++) { const r = await sky(i, N, t('st_sky', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 6 : 2; done.push(r === 1); api.pips(N, done); }
      clear(); const right = done.filter(Boolean).length; K.tell(nm, t('st_win')); await K.wait(1.4);
      api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('st_win') }); }
    function dispose() { K.dispose(); clear(); }
    return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose }; };
  THEMES.sp_observatory = { palette: { noFloor: true, sky: 0x060a1e, ground: 0x0a0c18, fog: 0x0a0e24, wall: ['plank', '#0a0c18', '#080a14'], floor: ['plank', '#0a0c18', '#080a14'], hemi: [0x8aa0ff, 0x101020], key: 0xd8e0ff, dust: { c: 0xffffff, n: 30, mode: 'drift' } },
    look: { keyC: 0xd8e0ff, grade: 'night', exposure: 1.0, fogD: 0.004, rim: 0x8aa8ff, face: 0x0e1430, accent: '#cfe0ff', pillars: null, rays: 0, noWall: true, ceiling: false },
    props(c) { const { scene } = c; if (KQRealms.hall && KQRealms.hall.skyDome) KQRealms.hall.skyDome(c, 0x02040e, 0x10183a);
      for (let i = 0; i < 260; i++) { const a = Math.random() * TAU, e = Math.random() * 1.2 - 0.1, r = 60; c.sprite(0xffffff, 0.12 + Math.random() * 0.25, Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r + 2, -Math.abs(Math.sin(a) * Math.cos(e) * r) - 10, null, 0.5 + Math.random() * 0.5); }
      const rail = M(0x2a2e44, { metalness: 0.6, roughness: 0.4 }); for (let i = -8; i <= 8; i++) { const p = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.2, 6), rail); p.position.set(i * 1.3, -4.4, 3); scene.add(p); } const bar = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 21, 8), rail); bar.rotation.z = PI / 2; bar.position.set(0, -3.8, 3); scene.add(bar); } };

  /* ================================================================== THE SPACE ATLAS (Yoni 2026-10-10: "space all games should have a higher
     level design like what we did with the nature … mission control … needs to have much more complex data"). Ten painted plates
     (shared/atlas.webp, tools/pack_atlas.py; art-src/space). Each world's page goes deeper with age: 1 picture facts · 2 numbers and three
     superpowers · 3 the full data, its missions and a lab note. A world is found when Mission Control flies to it; three right landings earn
     its gold seal. Numbers: NASA Planetary Fact Sheet (fetched 2026-10-10). Moons: NASA's planet pages (Jupiter 115, Uranus 29 as of 2026;
     they change as moons are found). Words checked against NASA's facts pages the same day (47 claims; Venus pressure, Olympus Mons, Jupiter's
     volume, Juno and the moon counts corrected). BepiColombo reaches Mercury on 21 Nov 2026: change "on its way" after that. */
  const AT_IDS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon', 'pluto'];
  /* diam km · mass 10^24 kg · g m/s² · esc km/s · day = sunrise to sunrise, hours · dist = million km from the Sun (the Moon: from Earth) ·
     year = Earth days (the Moon: once round Earth) · temp = average °C · dens kg/m³ */
  const AT_D = {
    mercury: { kind: 'planet', diam: 4879, mass: 0.330, g: 3.7, esc: 4.3, day: 4222.6, dist: 57.9, year: 88.0, temp: 167, dens: 5429, moons: 0, rings: 0 },
    venus: { kind: 'planet', diam: 12104, mass: 4.87, g: 8.9, esc: 10.4, day: 2802.0, dist: 108.2, year: 224.7, temp: 464, dens: 5243, moons: 0, rings: 0 },
    earth: { kind: 'planet', diam: 12756, mass: 5.97, g: 9.8, esc: 11.2, day: 24.0, dist: 149.6, year: 365.2, temp: 15, dens: 5514, moons: 1, rings: 0 },
    mars: { kind: 'planet', diam: 6792, mass: 0.642, g: 3.7, esc: 5.0, day: 24.7, dist: 228.0, year: 687.0, temp: -65, dens: 3934, moons: 2, rings: 0 },
    jupiter: { kind: 'planet', diam: 142984, mass: 1898, g: 23.1, esc: 59.5, day: 9.9, dist: 778.5, year: 4331, temp: -110, dens: 1326, moons: 115, rings: 1, gas: 1 },
    saturn: { kind: 'planet', diam: 120536, mass: 568, g: 9.0, esc: 35.5, day: 10.7, dist: 1432.0, year: 10747, temp: -140, dens: 687, moons: 274, rings: 1, gas: 1 },
    uranus: { kind: 'planet', diam: 51118, mass: 86.8, g: 8.7, esc: 21.3, day: 17.2, dist: 2867.0, year: 30589, temp: -195, dens: 1270, moons: 29, rings: 1, gas: 1 },
    neptune: { kind: 'planet', diam: 49528, mass: 102, g: 11.0, esc: 23.5, day: 16.1, dist: 4515.0, year: 59800, temp: -200, dens: 1638, moons: 16, rings: 1, gas: 1 },
    moon: { kind: 'moon', diam: 3475, mass: 0.073, g: 1.6, esc: 2.4, day: 708.7, dist: 0.3844, year: 27.3, temp: -20, dens: 3340, moons: 0, rings: 0 },
    pluto: { kind: 'dwarf', diam: 2376, mass: 0.0130, g: 0.7, esc: 1.3, day: 153.3, dist: 5906.4, year: 90560, temp: -225, dens: 1850, moons: 5, rings: 0 } };
  /* the words: type line · young (3 picture facts) · pw (three superpowers) · clue (a locked card) · miss (missions) · lab · fact (Mission
     Control's arrival line for the oldest) · size / from (the notes under two numbers) */
  const AT_T = {
    en: {
      mercury: { type: 'The 1st planet from the Sun · a rocky planet', young: ['Mercury is the closest planet to the Sun.', 'It is the smallest planet, only a little bigger than our Moon.', 'Its days are burning hot and its nights are freezing cold.'],
        pw: [['The fastest planet', 'It goes round the Sun in just 88 days, faster than any other planet.'], ['Hot and cold', 'Days reach about 430 °C and nights fall to about −180 °C: there is no air to hold the heat.'], ['An iron heart', 'Its iron core reaches 85% of the way to its surface.']],
        clue: 'The planet closest to the Sun.', miss: 'Mariner 10 flew past in 1974 and 1975. MESSENGER orbited it from 2011 to 2015. BepiColombo, from Europe and Japan, is on its way.',
        lab: 'Why so cold at night, so close to the Sun? With no air to trap it, the heat escapes into space as soon as the Sun sets: a swing of about 600 °C between day and night.', fact: 'A year here lasts just 88 Earth days.', size: 'a little bigger than our Moon', from: 'less than half Earth’s distance' },
      venus: { type: 'The 2nd planet from the Sun · a rocky planet', young: ['Venus is the hottest planet.', 'Thick yellow clouds cover it all the time.', 'It is almost the same size as Earth.'],
        pw: [['Hotter than an oven', 'About 465 °C, hot enough to melt lead, even though Mercury is closer to the Sun.'], ['It spins backwards', 'It turns the opposite way to Earth, so there the Sun rises in the west.'], ['A day longer than a year', 'One spin takes 243 Earth days; one trip round the Sun takes 225.']],
        clue: 'The hottest planet, though it is not the closest to the Sun.', miss: 'The Soviet Venera landers reached its surface between 1970 and 1982. Magellan mapped it by radar from 1990 to 1994.',
        lab: 'Its thick carbon-dioxide air traps the Sun’s heat like a blanket that never comes off: a runaway greenhouse. The air presses more than 90 times harder than ours, and the clouds are made of sulfuric acid.', fact: 'One spin of Venus takes longer than its whole year.', size: 'almost Earth’s size', from: 'about ¾ of Earth’s distance' },
      earth: { type: 'The 3rd planet from the Sun · our home', young: ['Earth is our home.', 'Most of it is covered by water.', 'It has one Moon.'],
        pw: [['Life', 'The only world we know of with living things.'], ['Liquid water', 'About 71% of the surface is ocean.'], ['A shield of air', 'The air (78% nitrogen, 21% oxygen) and a magnetic field protect life.']],
        clue: 'The only world we know of with life.', miss: 'Thousands of satellites circle it, and people have lived on the International Space Station since 2000. Israel’s astronauts: Ilan Ramon (2003) and Eytan Stibbe, who visited the space station in 2022.',
        lab: 'Sunlight takes about 8 minutes 20 seconds to reach us: 149.6 million km ÷ 300,000 km a second ≈ 499 seconds.', fact: 'Sunlight takes about 8 minutes to reach us.', size: 'the biggest of the rocky planets', from: 'one astronomical unit' },
      mars: { type: 'The 4th planet from the Sun · a rocky planet', young: ['Mars is the red planet.', 'The biggest volcano we know stands on Mars.', 'Robots drive on Mars right now.'],
        pw: [['Olympus Mons', 'The largest volcano in the solar system: more than twice as tall as Mount Everest.'], ['A giant canyon', 'Valles Marineris is almost 4,000 km long.'], ['Rusty red', 'The iron in its dust has rusted: that is why it looks red.']],
        clue: 'The red planet.', miss: 'The rovers Curiosity (since 2012) and Perseverance (since 2021) explore it, and the Ingenuity helicopter flew there 72 times.',
        lab: 'Gravity here is 3.7 m/s², 38% of Earth’s. Curiosity’s mass is 899 kg; a scale on Mars would show about 340 kg. It has two small moons, Phobos and Deimos.', fact: 'A day here lasts 24.7 hours, almost like ours.', size: 'about half of Earth’s width', from: 'about 1½ times Earth’s distance' },
      jupiter: { type: 'The 5th planet from the Sun · a gas giant', young: ['Jupiter is the biggest planet.', 'It has a giant storm called the Great Red Spot.', 'It has lots and lots of moons.'],
        pw: [['The biggest', 'More than 1,000 Earths would fit inside it.'], ['A giant storm', 'The Great Red Spot is a storm wider than the whole Earth.'], ['The fastest spinner', 'A day lasts under 10 hours, the shortest of any planet.']],
        clue: 'The biggest planet.', miss: 'Galileo orbited it from 1995 to 2003, and Juno went into orbit in 2016. Europa Clipper is on its way to the moon Europa.',
        lab: 'At the cloud tops gravity is 23.1 m/s², the strongest of any planet. Its moon Ganymede is the largest moon in the solar system, bigger even than Mercury.', fact: 'More than 1,000 Earths would fit inside it.', size: 'about 11 Earths across', from: 'about 5 times Earth’s distance' },
      saturn: { type: 'The 6th planet from the Sun · a gas giant', young: ['Saturn wears rings made of ice and rock.', 'It is so light for its size, it would float in a giant bathtub.', 'It has more moons than any other planet.'],
        pw: [['Huge, thin rings', 'They reach out 282,000 km from the planet, but the main rings are only about 10 metres thick.'], ['It could float', 'On average it is less dense than water, the only planet that is.'], ['A six-sided storm', 'A hexagon of fast winds, about 30,000 km across, spins at its north pole.']],
        clue: 'Rings of ice and rock, and more moons than any planet.', miss: 'Pioneer 11 (1979), Voyager 1 (1980) and Voyager 2 (1981) flew past. Cassini arrived in 2004 and ended on 15 September 2017 by diving into Saturn; its Huygens probe landed on the moon Titan in 2005.',
        lab: 'Density = mass ÷ volume. Saturn: 687 kg in every cubic metre; water: 1,000. That is why it would float. Its moon Titan is larger than Mercury, and Enceladus sprays geysers of water ice.', fact: 'It would float in water.', size: 'about 9½ Earths across', from: 'about 9½ times Earth’s distance' },
      uranus: { type: 'The 7th planet from the Sun · an ice giant', young: ['Uranus is a pale blue-green ice giant.', 'It spins tipped over, lying on its side.', 'Its rings stand up around it.'],
        pw: [['On its side', 'It is tilted about 98°, so each pole gets 42 years of sunshine and then 42 years of dark.'], ['The coldest air', 'Its clouds can fall to about −224 °C, the coldest of any planet.'], ['Found with a telescope', 'William Herschel discovered it in 1781, the first planet found with a telescope.']],
        clue: 'It spins tipped right over, on its side.', miss: 'Only Voyager 2 has visited, flying past in January 1986.',
        lab: 'A year here lasts about 84 Earth years: 30,589 days ÷ 365.25 ≈ 83.7. It has 13 faint rings.', fact: 'It spins lying on its side.', size: 'about 4 Earths across', from: 'about 19 times Earth’s distance' },
      neptune: { type: 'The 8th planet from the Sun · an ice giant', young: ['Neptune is the planet farthest from the Sun.', 'It is deep blue.', 'It has the fastest winds of any planet.'],
        pw: [['Wild winds', 'Winds blow at more than 2,000 km/h, the fastest in the solar system.'], ['Found by maths', 'Its place was worked out with mathematics before anyone saw it, in 1846.'], ['A backwards moon', 'Its big moon Triton circles it the wrong way round, and has geysers of ice.']],
        clue: 'The planet farthest from the Sun.', miss: 'Only Voyager 2 has visited, flying past in August 1989.',
        lab: 'Sunlight takes about 4 hours 10 minutes to arrive: 4,515 million km ÷ 300,000 km a second ≈ 15,000 seconds. One Neptune year is about 164 Earth years.', fact: 'Sunlight takes more than 4 hours to get here.', size: 'almost 4 Earths across', from: 'about 30 times Earth’s distance' },
      moon: { type: 'Earth’s moon', young: ['The Moon goes round the Earth.', 'People have walked on it: twelve astronauts.', 'It shines because sunlight bounces off it.'],
        pw: [['Footprints that last', 'With no wind or rain, the astronauts’ footprints are still there.'], ['Always the same face', 'The same side always faces Earth.'], ['It is moving away', 'It drifts about 3.8 cm farther from Earth every year.']],
        clue: 'Twelve people have walked on it.', miss: 'Apollo 11 landed on 20 July 1969, and twelve astronauts walked on it until 1972. Israel’s Beresheet reached it on 11 April 2019.',
        lab: 'It is 384,400 km away; its light reaches us in about 1.3 seconds. Gravity is 1.6 m/s², about a sixth of Earth’s: if you weigh 30 kg, a scale there would show about 4.9 kg.', fact: 'Its gravity is about a sixth of Earth’s.', size: 'about a quarter of Earth’s width', from: 'about 30 Earths away' },
      pluto: { type: 'A dwarf planet in the Kuiper Belt', young: ['Pluto is a small, icy dwarf planet.', 'It has a giant heart shape on it.', 'It is smaller than our Moon.'],
        pw: [['A heart of ice', 'The bright heart is called Tombaugh Regio; half of it is a glacier of frozen nitrogen.'], ['A big friend', 'Its moon Charon is about half Pluto’s size.'], ['A long year', 'One trip round the Sun takes 248 Earth years.']],
        clue: 'A small, icy world with a heart-shaped plain.', miss: 'New Horizons flew past it on 14 July 2015 and sent back the first close-up pictures.',
        lab: 'Clyde Tombaugh discovered it in 1930. Since 2006 it has been called a dwarf planet: it shares its path round the Sun with many other icy bodies.', fact: 'It has a heart made of ice.', size: 'smaller than our Moon', from: 'about 40 times Earth’s distance' } },
    he: {
      mercury: { type: 'כוכב הלכת הראשון מהשמש · כוכב לכת סלעי', young: ['כוכב חמה הוא כוכב הלכת הקרוב ביותר לשמש.', 'הוא כוכב הלכת הקטן ביותר, רק קצת יותר גדול מהירח שלנו.', 'הימים בו לוהטים והלילות קפואים.'],
        pw: [['כוכב הלכת המהיר ביותר', 'הוא מקיף את השמש ב־88 ימים בלבד, מהר יותר מכל כוכב לכת אחר.'], ['חם וקר', 'ביום החום מגיע לכ־430 מעלות, ובלילה הוא יורד לכ־180 מעלות מתחת לאפס: אין אוויר ששומר על החום.'], ['לב של ברזל', 'ליבת הברזל שלו מגיעה עד 85% מהדרך אל פני השטח.']],
        clue: 'כוכב הלכת הקרוב ביותר לשמש.', miss: 'מרינר 10 חלפה לידו ב־1974 וב־1975. מסנג׳ר הקיפה אותו מ־2011 עד 2015. בפיקולומבו, של אירופה ויפן, בדרך אליו.',
        lab: 'למה כל כך קר בלילה, כשהוא כל כך קרוב לשמש? אין אוויר שילכוד את החום, ולכן הוא בורח לחלל ברגע שהשמש שוקעת: הפרש של כ־600 מעלות בין יום ללילה.', fact: 'שנה כאן נמשכת 88 ימי ארץ בלבד.', size: 'קצת יותר גדול מהירח שלנו', from: 'פחות מחצי מהמרחק של כדור הארץ' },
      venus: { type: 'כוכב הלכת השני מהשמש · כוכב לכת סלעי', young: ['נוגה הוא כוכב הלכת החם ביותר.', 'עננים צהובים ועבים מכסים אותו כל הזמן.', 'הוא כמעט באותו גודל כמו כדור הארץ.'],
        pw: [['חם יותר מתנור', 'כ־465 מעלות, חם מספיק כדי להמיס עופרת, למרות שכוכב חמה קרוב יותר לשמש.'], ['מסתובב הפוך', 'הוא מסתובב לכיוון ההפוך מכדור הארץ, ולכן שם השמש זורחת במערב.'], ['יום ארוך משנה', 'סיבוב אחד סביב עצמו לוקח 243 ימי ארץ; סיבוב אחד סביב השמש לוקח 225.']],
        clue: 'כוכב הלכת החם ביותר, למרות שהוא לא הקרוב ביותר לשמש.', miss: 'הנחתות הסובייטיות ונרה הגיעו אל פני השטח שלו בין 1970 ל־1982. מגלן מיפתה אותו במכ״ם מ־1990 עד 1994.',
        lab: 'האוויר העבה שלו, עשוי פחמן דו־חמצני, לוכד את חום השמש כמו שמיכה שאי אפשר להוריד: אפקט חממה שיצא משליטה. האוויר לוחץ שם חזק פי יותר מ־90 מאשר אצלנו, והעננים עשויים חומצה גופרתית.', fact: 'סיבוב אחד של נוגה סביב עצמו ארוך מכל השנה שלו.', size: 'כמעט בגודל של כדור הארץ', from: 'בערך שלושה רבעים מהמרחק של כדור הארץ' },
      earth: { type: 'כוכב הלכת השלישי מהשמש · הבית שלנו', young: ['כדור הארץ הוא הבית שלנו.', 'רובו מכוסה במים.', 'יש לו ירח אחד.'],
        pw: [['חיים', 'העולם היחיד שאנחנו מכירים שיש בו יצורים חיים.'], ['מים נוזליים', 'בערך 71% מפני השטח הם אוקיינוס.'], ['מגן של אוויר', 'האוויר (78% חנקן, 21% חמצן) ושדה מגנטי מגינים על החיים.']],
        clue: 'העולם היחיד שאנחנו מכירים שיש בו חיים.', miss: 'אלפי לוויינים מקיפים אותו, ומאז שנת 2000 גרים אנשים בתחנת החלל הבינלאומית. האסטרונאוטים של ישראל: אילן רמון (2003) ואיתן סטיבה, שביקר בתחנת החלל ב־2022.',
        lab: 'אור השמש מגיע אלינו בתוך כ־8 דקות ו־20 שניות: 149.6 מיליון ק״מ חלקי 300,000 ק״מ בשנייה ≈ 499 שניות.', fact: 'אור השמש מגיע אלינו בתוך כ־8 דקות.', size: 'הגדול מבין כוכבי הלכת הסלעיים', from: 'יחידה אסטרונומית אחת' },
      mars: { type: 'כוכב הלכת הרביעי מהשמש · כוכב לכת סלעי', young: ['מאדים הוא כוכב הלכת האדום.', 'הר הגעש הגדול ביותר שאנחנו מכירים נמצא על מאדים.', 'רובוטים נוסעים על מאדים ממש עכשיו.'],
        pw: [['אולימפוס מונס', 'הר הגעש הגדול ביותר במערכת השמש: יותר מפי שניים מגובה האוורסט.'], ['קניון ענק', 'ואליס מרינריס ארוך כמעט 4,000 ק״מ.'], ['אדום חלוד', 'הברזל שבאבק שלו החליד: בגלל זה הוא נראה אדום.']],
        clue: 'כוכב הלכת האדום.', miss: 'הרכבים קיוריוסיטי (מאז 2012) ופרסברנס (מאז 2021) חוקרים אותו, והמסוק אינג׳נואיטי טס שם 72 פעמים.',
        lab: 'כוח המשיכה כאן הוא 3.7 מ׳/שנ׳², 38% משל כדור הארץ. המסה של קיוריוסיטי היא 899 ק״ג; משקל על מאדים יראה בערך 340 ק״ג. יש לו שני ירחים קטנים, פובוס ודימוס.', fact: 'יום כאן נמשך 24.7 שעות, כמעט כמו אצלנו.', size: 'בערך חצי מרוחב כדור הארץ', from: 'בערך פי אחד וחצי מהמרחק של כדור הארץ' },
      jupiter: { type: 'כוכב הלכת החמישי מהשמש · ענק גזים', young: ['צדק הוא כוכב הלכת הגדול ביותר.', 'יש בו סערה ענקית שנקראת הכתם האדום הגדול.', 'יש לו המון המון ירחים.'],
        pw: [['הגדול ביותר', 'יותר מ־1,000 כדורי ארץ היו נכנסים בתוכו.'], ['סערה ענקית', 'הכתם האדום הגדול הוא סערה רחבה יותר מכל כדור הארץ.'], ['המסתובב המהיר ביותר', 'יום נמשך פחות מ־10 שעות, הקצר ביותר מכל כוכבי הלכת.']],
        clue: 'כוכב הלכת הגדול ביותר.', miss: 'גלילאו הקיפה אותו מ־1995 עד 2003, וג׳ונו נכנסה למסלול סביבו ב־2016. אירופה קליפר בדרך אל הירח אירופה.',
        lab: 'בראש העננים כוח המשיכה הוא 23.1 מ׳/שנ׳², החזק מכל כוכבי הלכת. הירח שלו גנימד הוא הירח הגדול ביותר במערכת השמש, גדול אפילו מכוכב חמה.', fact: 'יותר מ־1,000 כדורי ארץ היו נכנסים בתוכו.', size: 'בערך 11 כדורי ארץ לרוחבו', from: 'בערך פי 5 מהמרחק של כדור הארץ' },
      saturn: { type: 'כוכב הלכת השישי מהשמש · ענק גזים', young: ['לשבתאי יש טבעות עשויות קרח וסלע.', 'הוא כל כך קל ביחס לגודלו, שהיה צף באמבטיה ענקית.', 'יש לו יותר ירחים מכל כוכב לכת אחר.'],
        pw: [['טבעות ענקיות ודקות', 'הן מגיעות עד 282,000 ק״מ מכוכב הלכת, אבל הטבעות הראשיות עבות רק כ־10 מטרים.'], ['הוא היה צף', 'בממוצע הוא פחות צפוף ממים, וזה כוכב הלכת היחיד כזה.'], ['סערה עם שש פינות', 'משושה של רוחות מהירות, ברוחב של כ־30,000 ק״מ, מסתובב בקוטב הצפוני שלו.']],
        clue: 'טבעות של קרח וסלע, ויותר ירחים מכל כוכב לכת.', miss: 'פיוניר 11 (1979), וויאג׳ר 1 (1980) ו־וויאג׳ר 2 (1981) חלפו לידו. קסיני הגיעה ב־2004 וסיימה ב־15 בספטמבר 2017 בצלילה לתוך שבתאי; הגשושית הויגנס שלה נחתה על הירח טיטאן ב־2005.',
        lab: 'צפיפות = מסה חלקי נפח. בשבתאי: 687 ק״ג בכל מטר מעוקב; במים: 1,000. לכן הוא היה צף. הירח שלו טיטאן גדול יותר מכוכב חמה, והירח אנקלדוס מתיז גייזרים של קרח מים.', fact: 'הוא היה צף במים.', size: 'בערך 9 וחצי כדורי ארץ לרוחבו', from: 'בערך פי 9 וחצי מהמרחק של כדור הארץ' },
      uranus: { type: 'כוכב הלכת השביעי מהשמש · ענק קרח', young: ['אורנוס הוא ענק קרח בצבע תכלת־ירקרק.', 'הוא מסתובב כשהוא שוכב על הצד.', 'הטבעות שלו עומדות סביבו.'],
        pw: [['על הצד', 'הוא נטוי בכ־98 מעלות, ולכן כל קוטב מקבל 42 שנים של שמש ואחריהן 42 שנים של חושך.'], ['האוויר הקר ביותר', 'העננים שלו יכולים לרדת לכ־224 מעלות מתחת לאפס, הקר ביותר מכל כוכבי הלכת.'], ['נמצא בטלסקופ', 'ויליאם הרשל גילה אותו ב־1781, כוכב הלכת הראשון שנמצא בטלסקופ.']],
        clue: 'הוא מסתובב כשהוא שוכב על הצד.', miss: 'רק וויאג׳ר 2 ביקרה בו, וחלפה לידו בינואר 1986.',
        lab: 'שנה כאן נמשכת כ־84 שנות ארץ: 30,589 ימים חלקי 365.25 ≈ 83.7. יש לו 13 טבעות חיוורות.', fact: 'הוא מסתובב כשהוא שוכב על הצד.', size: 'בערך 4 כדורי ארץ לרוחבו', from: 'בערך פי 19 מהמרחק של כדור הארץ' },
      neptune: { type: 'כוכב הלכת השמיני מהשמש · ענק קרח', young: ['נפטון הוא כוכב הלכת הרחוק ביותר מהשמש.', 'הוא כחול עמוק.', 'יש בו הרוחות המהירות ביותר מכל כוכבי הלכת.'],
        pw: [['רוחות פראיות', 'הרוחות נושבות במהירות של יותר מ־2,000 קמ״ש, המהירות ביותר במערכת השמש.'], ['נמצא בעזרת מתמטיקה', 'המקום שלו חושב במתמטיקה עוד לפני שמישהו ראה אותו, ב־1846.'], ['ירח הפוך', 'הירח הגדול שלו, טריטון, מקיף אותו בכיוון ההפוך, ויש עליו גייזרים של קרח.']],
        clue: 'כוכב הלכת הרחוק ביותר מהשמש.', miss: 'רק וויאג׳ר 2 ביקרה בו, וחלפה לידו באוגוסט 1989.',
        lab: 'אור השמש מגיע לכאן בתוך כ־4 שעות ו־10 דקות: 4,515 מיליון ק״מ חלקי 300,000 ק״מ בשנייה ≈ 15,000 שניות. שנה אחת בנפטון היא בערך 164 שנות ארץ.', fact: 'אור השמש מגיע לכאן אחרי יותר מ־4 שעות.', size: 'כמעט 4 כדורי ארץ לרוחבו', from: 'בערך פי 30 מהמרחק של כדור הארץ' },
      moon: { type: 'הירח של כדור הארץ', young: ['הירח מקיף את כדור הארץ.', 'אנשים כבר הלכו עליו: שנים עשר אסטרונאוטים.', 'הוא מאיר כי אור השמש מוחזר ממנו.'],
        pw: [['עקבות שנשארות', 'אין שם רוח וגשם, ולכן העקבות של האסטרונאוטים עדיין שם.'], ['תמיד אותו צד', 'תמיד אותו צד של הירח פונה אל כדור הארץ.'], ['הוא מתרחק', 'בכל שנה הוא מתרחק מכדור הארץ בכ־3.8 ס״מ.']],
        clue: 'שנים עשר אנשים הלכו עליו.', miss: 'אפולו 11 נחתה ב־20 ביולי 1969, ועד 1972 הלכו עליו שנים עשר אסטרונאוטים. החללית הישראלית בראשית הגיעה אליו ב־11 באפריל 2019.',
        lab: 'המרחק אליו 384,400 ק״מ; האור ממנו מגיע אלינו בתוך כ־1.3 שניות. כוח המשיכה שם 1.6 מ׳/שנ׳², בערך שישית משל כדור הארץ: אם אתם שוקלים 30 ק״ג, משקל שם יראה בערך 4.9 ק״ג.', fact: 'כוח המשיכה שלו הוא בערך שישית משל כדור הארץ.', size: 'בערך רבע מרוחב כדור הארץ', from: 'בערך 30 כדורי ארץ מאיתנו' },
      pluto: { type: 'כוכב לכת ננסי בחגורת קויפר', young: ['פלוטו הוא כוכב לכת ננסי, קטן וקפוא.', 'יש עליו צורת לב ענקית.', 'הוא קטן יותר מהירח שלנו.'],
        pw: [['לב של קרח', 'הלב הבהיר נקרא טומבו רגיו; חציו קרחון של חנקן קפוא.'], ['חבר גדול', 'הירח שלו, כארון, גדול בערך כמו חצי פלוטו.'], ['שנה ארוכה', 'סיבוב אחד סביב השמש לוקח 248 שנות ארץ.']],
        clue: 'עולם קטן וקפוא עם מישור בצורת לב.', miss: 'ניו הורייזונס חלפה לידו ב־14 ביולי 2015 ושלחה את התמונות הקרובות הראשונות.',
        lab: 'קלייד טומבו גילה אותו ב־1930. מאז 2006 הוא נקרא כוכב לכת ננסי: הוא חולק את המסלול שלו סביב השמש עם הרבה גופים קפואים אחרים.', fact: 'יש לו לב עשוי קרח.', size: 'קטן יותר מהירח שלנו', from: 'בערך פי 40 מהמרחק של כדור הארץ' } } };
  /* --- the Atlas's own state, depth and numbers --- */
  const AT_BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^/]*$/, '') : 'shared/';
  const atLang = () => (window.KQ && KQ.i18n && KQ.i18n.lang === 'he') ? 'he' : 'en';
  const atx = id => AT_T[atLang()][id];
  const atName = id => t(id === 'moon' || id === 'pluto' ? 'at_n_' + id : 'pl_' + id);
  const atIn = id => id === 'moon' ? t('at_in_moon') : atName(id);   /* inside a sentence: 'on the Moon', not 'on The Moon' */
  function atBook() { const st = KQ.state(), p = KQ.profiles.active(), pid = p ? p.id : 'guest'; st.atlas = st.atlas || {}; return (st.atlas[pid] = st.atlas[pid] || { found: {}, right: {} }); }
  /* how deep a page goes: the child's reading band (Mission Control is a reading game): 1–2 → 1, 3–4 → 2, 5–6 → 3 */
  function atLevel() { const p = KQ.profiles.active(); let b = 2; try { b = KQ.ladder.band(p.id, 'reading', [1, 2, 3, 4, 5, 6]) || 2; } catch (e) {} return b <= 2 ? 1 : b <= 4 ? 2 : 3; }
  /* a world found (a landing was about it); right = it was the first tap. Returns true the first time */
  function atFind(id, right) { if (!AT_D[id]) return false; const B = atBook(), fresh = !B.found[id]; if (fresh) B.found[id] = Date.now(); if (right) B.right[id] = (B.right[id] || 0) + 1; try { KQ.save(); } catch (e) {} return fresh; }
  const atNum = (v, d) => { const s = Number(v).toLocaleString(atLang() === 'he' ? 'he-IL' : 'en-US', { maximumFractionDigits: d == null ? 1 : d }); return s.replace('-', '−'); };
  const atU = k => t('au_' + k);
  const atFix = v => Number(v).toLocaleString(atLang() === 'he' ? 'he-IL' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });   /* 9.0, not 9: beside Earth's 9.8 */
  const atDays = days => days >= 1000 ? atNum(days / 365.25, 1) + atU('y') : atNum(days, days < 100 ? 1 : 0) + atU('d');
  const atDay = h => h >= 100 ? atNum(h / 24, h < 240 ? 1 : 0) + atU('d') : atNum(h, 1) + atU('h');
  const atLight = km => { const s = km * 1e6 / 299792.458; if (s < 60) return atNum(s, 1) + atU('s'); if (s < 3600) { const m = Math.floor(s / 60), r = Math.round(s - m * 60); return m < 10 ? atNum(m, 0) + atU('min') + ' ' + atNum(r, 0) + atU('s') : atNum(Math.round(s / 60), 0) + atU('min'); }
    const hh = Math.floor(s / 3600), mm = Math.round((s - hh * 3600) / 60); return atNum(hh, 0) + atU('hr') + ' ' + atNum(mm, 0) + atU('min'); };
  const atMass = m => { const e = m / 5.97; return (e >= 10 ? atNum(e, 0) : e >= 1 ? atNum(e, 1) : atNum(e, e >= 0.1 ? 2 : e >= 0.01 ? 3 : 4)) + atU('earths'); };
  /* the numbers on a page and on Mission Control's tags */
  const atStat = {
    diam: id => atNum(AT_D[id].diam, 0) + atU('km'),
    dist: id => id === 'moon' ? atNum(384400, 0) + atU('km') : atNum(AT_D[id].dist, AT_D[id].dist < 100 ? 1 : 0) + atU('mkm'),
    day: id => atDay(AT_D[id].day), year: id => atDays(AT_D[id].year), yearD: id => atNum(AT_D[id].year, 0) + atU('d'),
    g: id => atFix(AT_D[id].g) + atU('ms2'), temp: id => atNum(AT_D[id].temp, 0) + ' °C', moons: id => AT_D[id].moons === 1 ? t('tg_moon1') : AT_D[id].moons === 0 ? t('tg_moon0') : t('tg_moons', { n: atNum(AT_D[id].moons, 0) }),
    rings: id => t(AT_D[id].rings ? 'tg_rings' : 'tg_norings') };

  /* the same numbers, short enough for a tag under a planet */
  const atTag = (k, id) => { const D = AT_D[id]; if (k === 'year' || k === 'yearD') return k === 'year' && D.year >= 1000 ? atNum(D.year / 365.25, 1) + atU('ys') : atNum(D.year, 0) + atU('ds'); if (k === 'day') return D.day >= 100 ? atNum(D.day / 24, 0) + atU('ds') : atNum(D.day, 1) + atU('h'); return atStat[k](id); };

  /* --- the book: a shelf of plates, and a page per world --- */
  (function atCss() { if (document.getElementById('kq-atlas-css')) return; const st = document.createElement('style'); st.id = 'kq-atlas-css'; st.textContent = `
#kq-atlas{position:fixed; inset:0; z-index:95; display:flex; align-items:center; justify-content:center; padding:max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)); background:rgba(6,8,24,.86); font-family:var(--font-body, Rubik, Assistant, sans-serif)}
#kq-atlas[hidden]{display:none}
#kq-atlas .ka-box{position:relative; width:min(1180px, 100%); max-height:100%; overflow:auto; box-sizing:border-box; padding:22px 26px 26px; border-radius:24px; background:#0e1330; color:#f4ecdb; box-shadow:0 24px 70px rgba(0,0,0,.55)}
#kq-atlas .ka-head{display:flex; justify-content:space-between; align-items:flex-start; gap:12px}
#kq-atlas h2{margin:0; font:800 clamp(26px, 4vw, 40px)/1.1 Fraunces, 'Frank Ruhl Libre', Georgia, serif; color:#f4ecdb; letter-spacing:0}
#kq-atlas .ka-sub{margin:6px 0 0; font-size:15px; line-height:1.4; color:#d8d2c4}
#kq-atlas button{font-family:inherit}
#kq-atlas .ka-x{flex:none; min-height:44px; padding:0 18px; border-radius:999px; border:2px solid #3a4378; background:transparent; color:#f4ecdb; font-weight:700; font-size:15px; cursor:pointer}
#kq-atlas .ka-chips{display:flex; gap:8px; flex-wrap:wrap; margin:16px 0}
#kq-atlas .ka-chip{min-height:40px; padding:0 16px; border-radius:999px; border:2px solid #3a4378; background:transparent; color:#f4ecdb; font-weight:700; font-size:14px; cursor:pointer}
#kq-atlas .ka-chip.on{background:#e0a92e; border-color:#e0a92e; color:#2a2236}
#kq-atlas .ka-grid{display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:14px}
#kq-atlas .ka-card{display:flex; flex-direction:column; gap:4px; padding:10px 12px 12px; border-radius:16px; border:3px solid transparent; background:#f4ecdb; color:#2a2236; text-align:start; cursor:pointer}
#kq-atlas .ka-card:focus-visible{outline:3px solid #9fb4ff; outline-offset:2px}
#kq-atlas .ka-card.locked{background:#d8ccb4; cursor:default}
#kq-atlas .ka-card.seal{border-color:#e0a92e}
#kq-atlas .ka-meta{display:flex; justify-content:space-between; gap:6px; font-size:11px; font-weight:700; letter-spacing:.06em; color:#7a6d58; text-transform:uppercase}
#kq-atlas .ka-pic{position:relative; width:100%; aspect-ratio:1; background-image:url(${AT_BASE}atlas.webp?v=2); background-size:600% 200%; background-repeat:no-repeat}
#kq-atlas .ka-card.locked .ka-pic{background:none; display:grid; place-items:center}
#kq-atlas .ka-card.locked .ka-pic::after{content:'?'; width:62%; aspect-ratio:1; border-radius:50%; border:3px dashed #a8987c; display:grid; place-items:center; font:800 clamp(28px, 4vw, 44px) Fraunces, Georgia, serif; color:#a8987c}
#kq-atlas .ka-seal{position:absolute; inset-inline-end:2%; bottom:2%; width:34px; height:34px; border-radius:50%; background:#e0a92e; display:grid; place-items:center; box-shadow:0 2px 6px rgba(0,0,0,.25)}
#kq-atlas .ka-seal svg{width:20px; height:20px}
#kq-atlas .ka-name{font:800 19px/1.15 Fraunces, 'Frank Ruhl Libre', Georgia, serif}
#kq-atlas .ka-line{font-size:13px; line-height:1.35; color:#5e5240}
#kq-atlas .ka-page{display:flex; margin-top:14px; border-radius:22px; overflow:hidden; background:#f4ecdb; color:#2a2236}
#kq-atlas .ka-left{flex:0 0 42%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:22px; border-inline-end:2px solid #e2d6bd; box-sizing:border-box}
#kq-atlas .ka-left .ka-pic{width:min(100%, 440px)}
#kq-atlas .ka-cap{font-size:13px; font-style:italic; color:#6b5f4e}
#kq-atlas .ka-right{flex:1; min-width:0; display:flex; flex-direction:column; gap:14px; padding:24px 28px; box-sizing:border-box}
#kq-atlas h3{margin:0; font:800 clamp(34px, 5vw, 52px)/1 Fraunces, 'Frank Ruhl Libre', Georgia, serif; color:#2a2236}
#kq-atlas .ka-type{font-size:15px; color:#6b5f4e}
#kq-atlas .ka-fact{display:flex; gap:12px; align-items:center; padding:13px 16px; border-radius:14px; background:#fffaf0; font-size:clamp(17px, 2.2vw, 22px); line-height:1.3; font-weight:500}
#kq-atlas .ka-fact i{flex:none; width:12px; height:12px; border-radius:50%; background:#e0a92e}
#kq-atlas .ka-stats{display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px}
#kq-atlas .ka-stat{padding:10px 12px; border-radius:12px; background:#fffaf0}
#kq-atlas .ka-stat small{display:block; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#6b5f4e}
#kq-atlas .ka-stat b{display:block; margin:2px 0; font-size:19px}
#kq-atlas .ka-stat span{font-size:12px; color:#6b5f4e}
#kq-atlas .ka-h4{font:800 20px Fraunces, 'Frank Ruhl Libre', Georgia, serif}
#kq-atlas .ka-pw{display:flex; flex-direction:column; gap:8px; font-size:16px; line-height:1.45}
#kq-atlas .ka-table{display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); column-gap:20px; padding:4px 14px; border-radius:12px; background:#fffaf0; font-size:14px}
#kq-atlas .ka-row{display:flex; justify-content:space-between; gap:8px; padding:7px 0; border-bottom:1px solid #ece2cc}
#kq-atlas .ka-row span{color:#6b5f4e}
#kq-atlas .ka-notes{display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px}
#kq-atlas .ka-note{padding:12px 14px; border-radius:12px; background:#2a2236; color:#f4ecdb; font-size:14px; line-height:1.5}
#kq-atlas .ka-note small{display:block; margin-bottom:4px; font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#e0a92e}
#kq-atlas .ka-src{font-size:12px; line-height:1.4; color:#7a6d58}
#kq-atlas .ka-nav{display:flex; justify-content:space-between; gap:10px; margin-top:14px}
@media (max-width:820px){ #kq-atlas .ka-grid{grid-template-columns:repeat(3, minmax(0, 1fr))} #kq-atlas .ka-page{flex-direction:column} #kq-atlas .ka-left{border-inline-end:0; border-bottom:2px solid #e2d6bd} #kq-atlas .ka-left .ka-pic{width:min(70%, 320px)} }
@media (max-width:560px){ #kq-atlas .ka-box{padding:16px 14px 18px; border-radius:18px} #kq-atlas .ka-grid{grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px} #kq-atlas .ka-stats{grid-template-columns:repeat(2, minmax(0, 1fr))} #kq-atlas .ka-table, #kq-atlas .ka-notes{grid-template-columns:1fr} #kq-atlas .ka-right{padding:18px 16px} }
`; document.head.appendChild(st); })();
  const atEl = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  /* a number in Hebrew text: kept in its own direction when it has no Hebrew letters (−140 °C would otherwise flip) */
  const atVal = s => { const e = atEl(/[֐-׿]/.test(s) ? 'span' : 'bdi', null, s); if (e.tagName === 'BDI') e.dir = 'ltr'; return e; };
  const atPic = id => { const i = AT_IDS.indexOf(id), d = atEl('div', 'ka-pic'); d.style.backgroundPosition = `${(i % 6) * 20}% ${Math.floor(i / 6) * 100}%`;   /* 6 x 2: the ten plates, then the astronaut */ d.setAttribute('role', 'img'); d.setAttribute('aria-label', atName(id)); return d; };
  const AT = { root: null, filter: 'all', page: null };
  function atOpen(id) { if (!AT.root) { AT.root = atEl('div'); AT.root.id = 'kq-atlas'; AT.root.addEventListener('click', e => { if (e.target === AT.root) atClose(); }); document.body.appendChild(AT.root);
      addEventListener('keydown', e => { if (e.key === 'Escape' && AT.root && !AT.root.hidden) atClose(); }); }
    AT.page = id && atBook().found[id] ? id : null; AT.root.hidden = false; atDraw(); }
  function atClose() { if (AT.root) AT.root.hidden = true; }
  function atDraw() { const R = AT.root; R.replaceChildren(); R.dir = atLang() === 'he' ? 'rtl' : 'ltr'; const box = atEl('div', 'ka-box'); R.appendChild(box); if (AT.page) atPage(box, AT.page); else atShelf(box); }
  function atShelf(box) { const B = atBook(), found = AT_IDS.filter(id => B.found[id]);
    const head = atEl('div', 'ka-head'), hl = atEl('div'); hl.appendChild(atEl('h2', null, t('at_title'))); hl.appendChild(atEl('p', 'ka-sub', t('at_count', { n: found.length, m: AT_IDS.length }) + ' · ' + t('at_how'))); head.appendChild(hl);
    const x = atEl('button', 'ka-x', t('at_close')); x.type = 'button'; x.onclick = atClose; head.appendChild(x); box.appendChild(head);
    const chips = atEl('div', 'ka-chips'); for (const f of ['all', 'planet', 'moon', 'dwarf']) { const c = atEl('button', 'ka-chip' + (AT.filter === f ? ' on' : ''), t('at_f_' + f)); c.type = 'button'; c.setAttribute('aria-pressed', String(AT.filter === f)); c.onclick = () => { AT.filter = f; atDraw(); }; chips.appendChild(c); } box.appendChild(chips);
    const grid = atEl('div', 'ka-grid'); box.appendChild(grid);
    AT_IDS.forEach((id, i) => { const D = AT_D[id]; if (AT.filter !== 'all' && D.kind !== AT.filter) return; const got = !!B.found[id], seal = (B.right[id] || 0) >= 3;
      const c = atEl(got ? 'button' : 'div', 'ka-card' + (got ? '' : ' locked') + (seal ? ' seal' : '')); if (got) { c.type = 'button'; c.onclick = () => { AT.page = id; atDraw(); }; }
      const meta = atEl('div', 'ka-meta'); meta.appendChild(atEl('span', null, t('at_plate', { n: i + 1 }))); meta.appendChild(atEl('span', null, t('at_k_' + D.kind))); c.appendChild(meta);
      const pic = atPic(id); if (seal) { const s = atEl('span', 'ka-seal'); s.title = t('at_seal'); const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path'); svg.setAttribute('viewBox', '0 0 22 22'); svg.setAttribute('aria-hidden', 'true'); p.setAttribute('d', 'M11 2 l2.6 5.6 6 .7 -4.5 4.1 1.2 6 -5.3 -3 -5.3 3 1.2 -6 -4.5 -4.1 6 -.7 z'); p.setAttribute('fill', '#fffaf0'); svg.appendChild(p); s.appendChild(svg); pic.appendChild(s); } c.appendChild(pic);
      c.appendChild(atEl('div', 'ka-name', got ? atName(id) : t('at_unknown'))); c.appendChild(atEl('div', 'ka-line', got ? atx(id).young[0] : t('at_clue') + ' ' + atx(id).clue)); grid.appendChild(c); }); }
  function atPage(box, id) { const D = AT_D[id], X = atx(id), lv = atLevel(), B = atBook(), found = AT_IDS.filter(k => B.found[k]), at = found.indexOf(id);
    const head = atEl('div', 'ka-head'), back = atEl('button', 'ka-x', t('at_back')); back.type = 'button'; back.onclick = () => { AT.page = null; atDraw(); }; head.appendChild(back);
    const x = atEl('button', 'ka-x', t('at_close')); x.type = 'button'; x.onclick = atClose; head.appendChild(x); box.appendChild(head);
    const page = atEl('div', 'ka-page'), L = atEl('div', 'ka-left'), Rt = atEl('div', 'ka-right'); page.appendChild(L); page.appendChild(Rt); box.appendChild(page);
    L.appendChild(atPic(id)); L.appendChild(atEl('div', 'ka-cap', t('at_plate', { n: AT_IDS.indexOf(id) + 1 }) + ' · ' + t('at_painted')));
    const nm = atEl('div'); nm.appendChild(atEl('h3', null, atName(id))); nm.appendChild(atEl('div', 'ka-type', X.type)); Rt.appendChild(nm);
    if (lv === 1) { for (const f of X.young) { const r = atEl('div', 'ka-fact'); r.appendChild(atEl('i')); r.appendChild(atEl('span', null, f)); Rt.appendChild(r); } }
    if (lv >= 2) { const st = atEl('div', 'ka-stats'); const moonE = id === 'moon';
      const cell = (k, v, n) => { const c = atEl('div', 'ka-stat'); c.appendChild(atEl('small', null, t(k))); const b = atEl('b'); b.appendChild(atVal(v)); c.appendChild(b); if (n) c.appendChild(atEl('span', null, n)); st.appendChild(c); };
      cell('at_size', atStat.diam(id), X.size); cell(moonE ? 'at_fromE' : 'at_from', atStat.dist(id), X.from); cell('at_day', atStat.day(id), t('at_sun1')); cell('at_year', atStat.year(id), t(moonE ? 'at_orbitE' : 'at_orbit'));
      cell('at_moons', atNum(D.moons, 0), D.moons > 9 ? t('at_moonsNasa') : ''); cell('at_grav', atStat.g(id), t('at_earth98')); Rt.appendChild(st);
      if (lv === 2) { Rt.appendChild(atEl('div', 'ka-h4', t('at_powers'))); const pw = atEl('div', 'ka-pw'); X.pw.forEach(([h, tx], k) => { const r = atEl('div'); r.appendChild(atEl('b', null, (k + 1) + '. ' + h + '. ')); r.appendChild(document.createTextNode(tx)); pw.appendChild(r); }); Rt.appendChild(pw); } }
    if (lv === 3) { const tb = atEl('div', 'ka-table'), row = (k, v) => { const r = atEl('div', 'ka-row'); r.appendChild(atEl('span', null, t(k))); const b = atEl('b'); b.appendChild(atVal(v)); r.appendChild(b); tb.appendChild(r); };
      const moonE = id === 'moon'; row('at_r_mass', atMass(D.mass)); row(moonE ? 'at_r_lightE' : 'at_r_light', moonE ? atNum(1.3, 1) + atU('s') : atLight(D.dist)); row('at_r_esc', atFix(D.esc) + atU('kms'));
      row('at_r_temp', atStat.temp(id)); row('at_r_dens', atNum(D.dens, 0) + atU('kgm3')); row('at_r_rings', t(D.rings ? 'at_yes' : 'at_no')); Rt.appendChild(tb);
      const pw = atEl('div', 'ka-pw'); X.pw.forEach(([h, tx]) => { const r = atEl('div'); r.appendChild(atEl('b', null, h + '. ')); r.appendChild(document.createTextNode(tx)); pw.appendChild(r); }); Rt.appendChild(pw);
      const notes = atEl('div', 'ka-notes'); for (const [k, tx] of [['at_missions', X.miss], ['at_lab', X.lab]]) { const n = atEl('div', 'ka-note'); n.appendChild(atEl('small', null, t(k))); n.appendChild(document.createTextNode(tx)); notes.appendChild(n); } Rt.appendChild(notes); }
    Rt.appendChild(atEl('div', 'ka-src', t('at_src') + (D.gas ? ' ' + t('at_gas') : '')));
    if (found.length > 1) { const nav = atEl('div', 'ka-nav'); const go = d => { AT.page = found[(at + d + found.length) % found.length]; atDraw(); };
      const pv = atEl('button', 'ka-x', t('at_prev')); pv.type = 'button'; pv.onclick = () => go(-1); const nx = atEl('button', 'ka-x', t('at_next')); nx.type = 'button'; nx.onclick = () => go(1); nav.appendChild(pv); nav.appendChild(nx); box.appendChild(nav); } }
  window.KQAtlas = { open: atOpen, close: atClose, find: atFind, level: atLevel, book: atBook, ids: AT_IDS };

  /* ================================================================== MISSION CONTROL: read the order, fly the probe to the right world
     The eight planets in their real order (sizes squeezed so all fit, distances not to scale); a probe starts by Earth. */
  const PLANETS = [
    { id: 'mercury', r: 0.32, col: ['#9a948c', '#b8b0a4', '#7a746c'] }, { id: 'venus', r: 0.52, col: ['#e8c890', '#f0d8a8', '#d8b070'] }, { id: 'earth', r: 0.55, col: null },
    { id: 'mars', r: 0.4, col: ['#c0583a', '#a8482a', '#d8704a'] }, { id: 'jupiter', r: 1.1, col: ['#d8c0a0', '#b88a64', '#e8d8c0', '#a8724c'] }, { id: 'saturn', r: 0.92, col: ['#e8d8a8', '#d8c090', '#f0e4c0'], ring: true },
    { id: 'uranus', r: 0.7, col: ['#9ae0e8', '#8ad0dc', '#aeeaf0'] }, { id: 'neptune', r: 0.68, col: ['#3a6ad8', '#2a5ac8', '#4a7ae8'] }];
  const MISSIONS = {   /* [band]: [planet, key] — every fact checked; harder bands read longer and must be understood, not matched */
    1: [['mars', 'mc1_mars'], ['saturn', 'mc1_saturn'], ['jupiter', 'mc1_jupiter'], ['earth', 'mc1_earth'], ['neptune', 'mc1_neptune']],
    2: [['mercury', 'mc2_mercury'], ['mars', 'mc2_mars'], ['saturn', 'mc2_saturn'], ['earth', 'mc2_earth'], ['neptune', 'mc2_neptune'], ['jupiter', 'mc2_jupiter']],
    3: [['earth', 'mc3_earth'], ['jupiter', 'mc3_jupiter'], ['venus', 'mc3_venus'], ['uranus', 'mc3_uranus'], ['mars', 'mc3_mars'], ['saturn', 'mc3_saturn']],
    4: [['uranus', 'mc4_uranus'], ['venus', 'mc4_venus'], ['mars', 'mc4_mars'], ['neptune', 'mc4_neptune'], ['jupiter', 'mc4_jupiter'], ['mercury', 'mc4_mercury']],
    5: [['saturn', 'mc5_saturn'], ['venus', 'mc5_venus'], ['mercury', 'mc5_mercury'], ['earth', 'mc5_earth'], ['uranus', 'mc5_uranus'], ['jupiter', 'mc5_jupiter']],
    6: [['saturn', 'mc6_saturn'], ['jupiter', 'mc6_jupiter'], ['uranus', 'mc6_uranus'], ['neptune', 'mc6_neptune'], ['mars', 'mc6_mars'], ['venus', 'mc6_venus']] };
  /* Yoni 2026-10-10: "mission control … needs to have much more complex data". From band 3 the orders are built on the Atlas numbers, shown as
     tags under every planet: band 3 two clues that must BOTH fit (each alone fits two planets or more; checked by a script, scratchpad
     vl/check_missions.js); band 4 three of those and two of the old fact orders; bands 5–6 work it out (light time from the distance, a year in
     Earth years from days, weight from gravity) and landing math on two (band 5, choices) or three (band 6, typed) of the landings */
  const TWO = [{ p: 'saturn', k: 'mt_saturn', show: ['day', 'moons'] }, { p: 'jupiter', k: 'mt_jupiter', show: ['rings', 'temp'] }, { p: 'mars', k: 'mt_mars', show: ['diam', 'temp'] },
    { p: 'venus', k: 'mt_venus', show: ['diam', 'year'] }, { p: 'neptune', k: 'mt_neptune', show: ['g', 'temp'] }, { p: 'uranus', k: 'mt_uranus', show: ['day', 'g'] },
    { p: 'mercury', k: 'mt_mercury', show: ['moons', 'temp'] }, { p: 'earth', k: 'mt_earth', show: ['day', 'temp'] }];
  const CALC = [{ p: 'mars', k: 'mx_mars', show: ['dist', 'g'] }, { p: 'saturn', k: 'mx_saturn', show: ['dist'] }, { p: 'jupiter', k: 'mx_jupiter', show: ['yearD'] },
    { p: 'uranus', k: 'mx_uranus', show: ['yearD'] }, { p: 'neptune', k: 'mx_neptune', show: ['dist'] }, { p: 'venus', k: 'mx_venus', show: ['g', 'dist'] },
    { p: 'mercury', k: 'mx_mercury', show: ['g', 'dist'] }, { p: 'earth', k: 'mx_earth', show: ['dist'] }];
  function missionsFor(band, N) { if (band <= 2) return shuffle(MISSIONS[band]).slice(0, N);
    if (band === 3) return shuffle(TWO).slice(0, N);
    if (band === 4) return shuffle(shuffle(TWO).slice(0, 3).concat(shuffle(MISSIONS[4]).slice(0, N - 3)));
    const list = shuffle(CALC).slice(0, N).map(m => Object.assign({}, m)); shuffle(list.filter(m => m.p !== 'earth')).slice(0, band >= 6 ? 3 : 2).forEach(m => { m.math = true; }); return list; }
  function planetTex(p) { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    if (p.id === 'earth') { x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, 256, 128); for (let i = 0; i < 22; i++) { x.fillStyle = ['#3a8a3a', '#6a9a3a', '#b89a5a'][i % 3]; x.beginPath(); x.ellipse(Math.random() * 256, 20 + Math.random() * 88, 8 + Math.random() * 22, 5 + Math.random() * 14, Math.random() * 3, 0, TAU); x.fill(); } x.fillStyle = '#f4f8ff'; x.fillRect(0, 0, 256, 9); x.fillRect(0, 119, 256, 9); x.globalAlpha = 0.65; for (let i = 0; i < 30; i++) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(Math.random() * 256, Math.random() * 128, 8 + Math.random() * 20, 2 + Math.random() * 4, 0, 0, TAU); x.fill(); } }
    else { let y = 0; while (y < 128) { const bh = 3 + Math.random() * 12; x.fillStyle = p.col[Math.floor(Math.random() * p.col.length)]; x.fillRect(0, y, 256, bh + 1); y += bh; } if (p.id === 'jupiter') { x.fillStyle = '#c0583a'; x.beginPath(); x.ellipse(170, 80, 14, 7, 0, 0, TAU); x.fill(); } if (p.id === 'mars' || p.id === 'mercury') { x.globalAlpha = 0.3; for (let i = 0; i < 40; i++) { x.fillStyle = '#3a2a2a'; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 128, 1 + Math.random() * 4, 0, TAU); x.fill(); } } }
    const t2 = new T.CanvasTexture(c); t2.colorSpace = T.SRGBColorSpace; return t2; }
  STAGES.sp_mission = function (c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2 }; const P = [], tabs = [];
    const nar = () => K.narrow();
    const place = i => nar() ? new T.Vector3((i % 2 ? 1.1 : -1.1), 3.7 - i * 1.18, 0) : new T.Vector3(-7.2 + i * 2.05, 0.6 + Math.sin(i * 0.9) * 0.5, 0);
    let sun = null; function build() { for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } for (const g of P.splice(0)) scene.remove(g); if (sun) scene.remove(sun);
      sun = new T.Group(); scene.add(sun); { const at = nar() ? new T.Vector3(0, 5.6, -2.5) : new T.Vector3(-13.5, 0.5, -3), r0 = nar() ? 1.3 : 4; sun.position.copy(at); sun.add(new T.Mesh(new T.SphereGeometry(r0, 40, 24), new T.MeshBasicMaterial({ color: new T.Color(3, 2.2, 1.1) }))); c.sprite(0xffc060, r0 * 4, 0, 0, -0.2, sun, 0.7); const L = new T.PointLight(0xfff0d8, 60, 60, 1.2); L.position.set(nar() ? 0 : 2.5, nar() ? -1.5 : 0.5, 3); sun.add(L); }   /* the Sun first: 'closest to the Sun' must be seen */
      PLANETS.forEach((p, i) => { const g = new T.Group(); g.position.copy(place(i)); const tex = planetTex(p), m = new T.Mesh(new T.SphereGeometry(p.r, 40, 28), new T.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18 })); g.add(m);
        if (p.ring) { const ring = new T.Mesh(new T.RingGeometry(p.r * 1.3, p.r * 2.1, 64), new T.MeshBasicMaterial({ color: 0xe8d8a8, transparent: true, opacity: 0.7, side: T.DoubleSide })); ring.rotation.x = PI / 2 - 0.35; g.add(ring); }
        if (p.id === 'uranus') m.rotation.z = 1.7;
        const hit = new T.Mesh(new T.SphereGeometry(Math.max(0.75, p.r * 1.25), 10, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.userData.planet = i; g.add(hit);
        const tb = c.label(t('pl_' + p.id), -1, 0.42); if (nar()) tb.position.set((i % 2 ? 1 : -1) * (p.r + 1.15), 0, 0.1); else tb.position.set(0, -p.r - 0.6, 0.1); g.add(tb); tabs.push(tb);   /* the name right beside its planet */
        g.userData = { m, hit, i }; scene.add(g); P.push(g); const k = i; c.updaters.push((dt, tm) => { m.rotation.y = tm * 0.3 + k; }); }); }
    /* the probe: a gold body, a big dish, two solar wings */
    const probe = new T.Group(); { const body = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.4), M(0xd8b04a, { metalness: 0.8, roughness: 0.3 })); probe.add(body); const dish = new T.Mesh(new T.SphereGeometry(0.34, 16, 8, 0, TAU, 0, 1.0), M(0xf4f4f8, { side: T.DoubleSide })); dish.position.y = 0.3; probe.add(dish);
      for (const s of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(0.8, 0.02, 0.32), M(0x2a4aa8, { metalness: 0.5, roughness: 0.3 })); w.position.x = s * 0.62; probe.add(w); } const glow = c.sprite(0x8ad8ff, 0.9, 0, -0.3, 0, probe, 0.8); void glow; probe.scale.setScalar(0.8); scene.add(probe); }
    const home = () => P[2].position.clone().add(new T.Vector3(0, nar() ? 0.9 : 1.2, 0.6));
    async function fly(to, orbitR) { const a = probe.position.clone(), mid = a.clone().lerp(to, 0.5).add(new T.Vector3(0, 1.2, 1.4)); await K.anim(1.4, k => { const e = K.ease(k); probe.position.set((1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * mid.x + e * e * to.x, (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * mid.y + e * e * to.y, (1 - e) * (1 - e) * a.z + 2 * (1 - e) * e * mid.z + e * e * to.z); probe.rotation.z = Math.sin(k * PI) * 0.4; });
      if (orbitR) { const c0 = to.clone(); await K.anim(1.2, k => { const th = k * TAU; probe.position.set(c0.x + Math.cos(th) * orbitR, c0.y + Math.sin(th) * 0.3, c0.z + Math.sin(th) * orbitR); }); } }
    /* the numbers an order needs, as tags under every planet (gone once the probe lands) */
    const tags = []; function hideTags() { for (const tb of tags.splice(0)) { if (tb.parent) tb.parent.remove(tb); try { tb.userData.tablet.dispose(); } catch (e) {} } }
    function showTags(keys) { hideTags(); if (!keys || !keys.length) return; P.forEach((g, i) => { const p = PLANETS[i]; keys.forEach((k, j) => { const sz = keys.length === 1 ? 0.6 : 0.48, tb = c.label(atTag(k, p.id), -1, sz);   /* one number: bigger */
      if (nar()) tb.position.set((i % 2 ? 1 : -1) * (p.r + 1.15), -0.52 - j * 0.54, 0.1); else tb.position.set(0, -p.r - 0.96 - sz * 0.5 - j * 0.56, 0.1); g.add(tb); tags.push(tb); }); }); }
    /* what the probe reports on arrival, as deep as the child reads (the Atlas page's words) */
    function arrival(id) { const X = atx(id), lv = atLevel(); if (lv === 1) return X.young[Math.floor(Math.random() * X.young.length)]; if (lv === 2) { const w = X.pw[Math.floor(Math.random() * X.pw.length)]; return w[0] + ': ' + w[1]; } return X.fact; }
    /* landing math (bands 5–6): a rover's weight on a rocky world, or how many Earths across a giant; choices at 5, typed at 6 */
    async function landingMath(id) { const D = AT_D[id]; if (!D || id === 'earth') return false; let q, exact, ans, opts, unit;
      if (D.gas) { exact = D.diam / 12756; ans = Math.round(exact); q = t('lm_earths', { p: atName(id), d: atNum(D.diam, 0) }); unit = t('lm_u_earths'); opts = [ans, ans * 2, Math.max(2, ans - 3), ans + 5]; }
      else { exact = 899 * D.g / 9.8; ans = Math.round(exact / 10) * 10; q = t('lm_rover', { p: atName(id), g: atNum(D.g, 1) }); unit = atU('kg').trim(); opts = [ans, 899, Math.round(899 * 9.8 / D.g / 10) * 10, 90]; }
      const say = v => atNum(v, 0) + ' ' + unit; K.tell(t('lm_title'), q); let ok;
      if (S.band >= 6) { const v = await K.pad({ unit }); if (!K.alive()) return null; ok = Math.abs(Number(v) - exact) / exact <= 0.06; }
      else { const sh = shuffle([...new Set(opts)]); ok = await new Promise(res => K.tray(sh.map(v => ({ text: say(v) })), j => { K.tray(null); res(sh[j] === ans); })); if (!K.alive()) return null; }
      K.sfx(ok ? 'correct' : 'wrong'); K.tell(t('lm_title'), t(ok ? 'lm_yes' : 'lm_no', { a: say(ans) })); await K.act(t('mc_next')); return ok; }
    async function mission(i, n, kick) { const spec = S.order[i], target = spec.p || spec[0], key = spec.k || spec[1]; const tp = PLANETS.findIndex(p => p.id === target); showTags(spec.show);
      probe.position.copy(home()); K.tell(kick, t(key)); K.hint(() => K.tell(kick, t(key) + ' ' + t('mc_hint'))); let miss = 0;
      for (;;) { S.want = P[tp]; S.waiting = true; const got = await new Promise(res => { K.pointer = { down(e) { const h = K.hit(e, P.map(g => g.userData.hit)); if (!h) return false; K.pointer = null; res(h.object.userData.planet); return true; }, cursor: () => 'pointer' }; }); S.waiting = false; if (!K.alive()) return null;
        K.sfx('tap'); const g = P[got]; await fly(g.position.clone().add(new T.Vector3(0, 0, PLANETS[got].r + 0.8)), PLANETS[got].r + 0.8); if (!K.alive()) return null;
        if (got === tp) { K.sfx('correct'); c.burst(g.position.clone(), 0x8ad8ff, 14); hideTags(); const fresh = atFind(target, miss === 0); K.tell(t('pl_' + target), t('mc_yes', { p: t('pl_' + target) }) + ' ' + arrival(target) + (fresh ? ' ' + t('at_new', { p: atName(target) }) : '')); K.hint(null); await K.act(t('mc_next')); if (!K.alive()) return null;
          if (spec.math) { const ok = await landingMath(target); if (ok == null) return null; if (ok) S.mathPts += 5; } return miss === 0 ? 1 : miss === 1 ? 2 : 0; }
        miss++; K.sfx('wrong'); K.tell(kick, t('mc_no', { p: t('pl_' + PLANETS[got].id) }) + ' ' + t(key)); await fly(home()); if (miss >= 3) { K.tell(kick, t('mc_show', { p: t('pl_' + target) })); await fly(P[tp].position.clone().add(new T.Vector3(0, 0, PLANETS[tp].r + 0.8)), PLANETS[tp].r + 0.8); hideTags(); atFind(target, false); K.tell(t('pl_' + target), arrival(target)); K.hint(null); await K.act(t('mc_next')); return 0; } } }
    function frame(a) { return a < 1.05 ? { pos: [0, 0.4, 17.5], look: [0, 0.4, 0], fov: 56 } : { pos: [0, 1.2, 13.5], look: [0, 0.6, 0], fov: 50 }; }
    async function play(api) { K.mount(api); S.band = clamp(api.band || 2, 1, 6); build(); probe.position.copy(home()); window.__mission = { S, P, probe }; const N = 5, done = []; let pts = 0; api.pips(N, done);
      S.order = missionsFor(S.band, N); S.mathPts = 0; const nm = t('sp_mission'); await K.intro(async () => { K.tell(nm, t('mc_hi')); await K.act(t('mc_start')); }); if (!K.alive()) return;
      for (let i = 0; i < N; i++) { const r = await mission(i, N, t('mc_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 5 : 0; done.push(r === 1); api.pips(N, done); }
      const right = done.filter(Boolean).length; K.tell(nm, t('mc_win')); await K.wait(1.4);
      api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50 + (S.mathPts || 0), correct: right, total: N, say: t('mc_win') }); }
    function dispose() { K.dispose(); for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } }
    return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose }; };
  THEMES.sp_system = { palette: { noFloor: true, sky: 0x04040c, ground: 0x04040c, fog: 0x06061a, wall: ['plank', '#04040c', '#04040c'], floor: ['plank', '#04040c', '#04040c'], hemi: [0xb8c0ff, 0x101018], key: 0xfff4e0, dust: { c: 0xffffff, n: 20, mode: 'drift' } },
    look: { keyC: 0xfff4e0, grade: 'dusk', exposure: 1.05, fogD: 0.003, rim: 0xffd8a0, face: 0x10102a, accent: '#ffe7a8', pillars: null, rays: 0, noWall: true, ceiling: false },
    props(c) { const { scene } = c; if (KQRealms.hall && KQRealms.hall.skyDome) KQRealms.hall.skyDome(c, 0x020208, 0x0c0c24);
      for (let i = 0; i < 300; i++) { const a = Math.random() * TAU, e = Math.random() * 1.3 - 0.4, r = 70; c.sprite(0xffffff, 0.1 + Math.random() * 0.22, Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.abs(Math.sin(a) * Math.cos(e) * r) - 8, null, 0.4 + Math.random() * 0.5); }
      } };

  /* ================================================================== ASTEROID SPELLER: shoot the letters in order to spell the word */
  const WORDS = {
    en: { 1: [['sun', 'ws_sun'], ['moon', 'ws_moon'], ['star', 'ws_star'], ['sky', 'ws_sky']], 2: [['mars', 'ws_mars'], ['earth', 'ws_earth'], ['comet', 'ws_comet'], ['orbit', 'ws_orbit']],
      3: [['planet', 'ws_planet'], ['rocket', 'ws_rocket'], ['saturn', 'ws_saturn'], ['galaxy', 'ws_galaxy']], 4: [['jupiter', 'ws_jupiter'], ['asteroid', 'ws_asteroid'], ['meteor', 'ws_meteor'], ['crater', 'ws_crater']],
      5: [['gravity', 'ws_gravity'], ['nebula', 'ws_nebula'], ['astronaut', 'ws_astronaut'], ['telescope', 'ws_telescope']], 6: [['atmosphere', 'ws_atmosphere'], ['satellite', 'ws_satellite'], ['constellation', 'ws_constellation'], ['equator', 'ws_equator']] },
    he: { 1: [['שמש', 'ws_sun'], ['ירח', 'ws_moon'], ['כוכב', 'ws_star'], ['חלל', 'ws_sky']], 2: [['מאדים', 'ws_mars'], ['שביט', 'ws_comet'], ['טיל', 'ws_rocket'], ['מסלול', 'ws_orbit']],
      3: [['שבתאי', 'ws_saturn'], ['גלקסיה', 'ws_galaxy'], ['לוויין', 'ws_satellite'], ['צדק', 'ws_jupiter']], 4: [['אסטרואיד', 'ws_asteroid'], ['מטאור', 'ws_meteor'], ['מכתש', 'ws_crater'], ['אורנוס', 'ws_uranus']],
      5: [['טלסקופ', 'ws_telescope'], ['אסטרונאוט', 'ws_astronaut'], ['ערפילית', 'ws_nebula'], ['כבידה', 'ws_gravity']], 6: [['אטמוספירה', 'ws_atmosphere'], ['קבוצת כוכבים', 'ws_constellation'], ['קו המשווה', 'ws_equator'], ['גרם שמיים', 'ws_body']] } };
  const LOOK = { en: 'abcdefghijklmnopqrstuvwxyz', he: 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ' };
  const NEAR = { en: { b: 'dp', d: 'b', p: 'bq', q: 'p', m: 'n', n: 'mu', u: 'nv', v: 'u', i: 'l', l: 'i', e: 'a', a: 'e', o: 'u', c: 'k', k: 'c', s: 'z', z: 's' }, he: { 'ב': 'כו', 'כ': 'ב', 'ו': 'ז', 'ז': 'ו', 'ד': 'ר', 'ר': 'ד', 'ה': 'ח', 'ח': 'ה', 'ט': 'ת', 'ת': 'ט', 'ס': 'ם', 'ם': 'ס', 'א': 'ע', 'ע': 'א', 'ק': 'כ', 'ש': 'ס' } };
  STAGES.sp_spell = function (c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2 }; let rocks = [], slots = [], tabs = [];
    const gun = new T.Group(); { const base = new T.Mesh(new T.SphereGeometry(0.9, 24, 14, 0, TAU, 0, PI / 2), M(0x5a7ad8, { metalness: 0.5, roughness: 0.4 })); gun.add(base); const barrel = new T.Mesh(new T.CylinderGeometry(0.16, 0.22, 1.6, 12), M(0xd8d8e0, { metalness: 0.7, roughness: 0.3 })); barrel.position.y = 0.9; gun.add(barrel); gun.userData.barrel = barrel; scene.add(gun); }
    const rockM = [M(0x8a7a6a, { flatShading: true, roughness: 0.9 }), M(0x7a7078, { flatShading: true, roughness: 0.9 }), M(0x9a8a74, { flatShading: true, roughness: 0.9 })];
    function clear() { for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } for (const o of rocks.concat(slots)) scene.remove(o); rocks = []; slots = []; }
    const he = () => KQ.i18n.lang === 'he';
    function rock(ch, i, n) { const g = new T.Group(), geo = new T.DodecahedronGeometry(0.72, 1), p = geo.attributes.position; for (let j = 0; j < p.count; j++) { const v = new T.Vector3().fromBufferAttribute(p, j), k = 0.85 + Math.random() * 0.3; p.setXYZ(j, v.x * k, v.y * k, v.z * k); } geo.computeVertexNormals();
      const m = new T.Mesh(geo, rockM[i % 3]); m.scale.setScalar(1.15); g.add(m); const tb = c.label(ch.toUpperCase(), -1, 0.64); tb.position.set(0, 0, 0.95); g.add(tb); tabs.push(tb); const hit = new T.Mesh(new T.SphereGeometry(0.85, 10, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.userData.rock = g; g.add(hit);
      const nar = K.narrow(), W = nar ? 3.4 : 7.5, lane = i % 3, per = Math.ceil(n / 3), slot = Math.floor(i / 3); g.userData = { ch, m, hit, tb, lane, x0: -W + (slot + (lane % 2) * 0.5) * (W * 2 + 2) / per, y0: (nar ? -0.2 : -1.0) + lane * (nar ? 1.45 : 1.2),   /* the top lane stays below the plaque */ sp: 0.16 + lane * 0.05, k: Math.random() * 6, W };   /* three lanes under the plaque; a lane moves as one, so rocks never pile up */
      scene.add(g); rocks.push(g); return g; }
    c.updaters.push((dt, tm) => { for (const r of rocks) { if (r.userData.gone) continue; const u = r.userData; const span = u.W * 2 + 2, x = ((((u.x0 + u.W + 1 + tm * u.sp * (u.lane % 2 ? 1 : -1)) % span) + span) % span) - u.W - 1; r.position.set(x, u.y0 + Math.sin(tm * 0.8 + u.k) * 0.12, 0); u.m.rotation.set(tm * 0.3 + u.k, tm * 0.4, 0); } });
    function slotRow(word) { const n = word.length, nar = K.narrow(), w = Math.min(nar ? 0.95 : 1.0, (nar ? 6.2 : 11) / n), rtlw = he(); const out = []; S.slotW = w;
      for (let i = 0; i < n; i++) { if (word[i] === ' ') { out.push(null); continue; } const s = new T.Mesh(new T.PlaneGeometry(w * 0.86, w * 0.9), new T.MeshBasicMaterial({ color: 0x2a3060, transparent: true, opacity: 0.85 })); const fr = new T.Mesh(new T.PlaneGeometry(w * 0.94, w * 0.98), new T.MeshBasicMaterial({ color: 0xd8b04a })); fr.position.z = -0.01; s.add(fr); const x = (rtlw ? ((n - 1) / 2 - i) : (i - (n - 1) / 2)) * w; s.position.set(x, nar ? -2.9 : -2.9, 1); scene.add(s); slots.push(s); out.push(s); } return out; }
    async function shoot(r) { const to = r.position.clone(), from = gun.position.clone().add(new T.Vector3(0, 1.6, 0)); gun.lookAt(to.x, to.y, to.z); gun.rotateX(PI / 2);
      const beam = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1, 6), new T.MeshBasicMaterial({ color: new T.Color(0.6, 2.4, 2.8) })); scene.add(beam); const up = new T.Vector3(0, 1, 0);
      await K.anim(0.18, k => { const e = from.clone().lerp(to, k); beam.position.copy(from.clone().lerp(e, 0.5)); beam.scale.set(1, Math.max(0.01, from.distanceTo(e)), 1); beam.quaternion.setFromUnitVectors(up, to.clone().sub(from).normalize()); }); scene.remove(beam); }
    async function word(i, n, kick) { clear(); const list = WORDS[he() ? 'he' : 'en'][S.band], [w, clueKey] = S.order[i], letters = [...w], slotsRow = slotRow(w), show = S.band <= 2;
      K.tell(kick, show ? t('as_copy', { w: w.toUpperCase() }) : t('as_clue', { c: t(clueKey), n: letters.filter(ch => ch !== ' ').length })); K.hint(() => K.tell(kick, t('as_hint', { w: w.toUpperCase() })));
      const need = letters.filter(ch => ch !== ' '), abc = LOOK[he() ? 'he' : 'en'], near = NEAR[he() ? 'he' : 'en'], extra = []; for (const ch of need) { const nb = near[ch]; if (nb) extra.push(nb[0]); } while (extra.length < Math.min(4, 2 + S.band)) extra.push(abc[Math.floor(Math.random() * abc.length)]);
      const all = shuffle(need.concat(extra.slice(0, Math.min(4, 1 + S.band)))); all.forEach((ch, j) => rock(ch, j, all.length));
      let at = 0, miss = 0; const pos = []; letters.forEach((ch, j) => { if (ch !== ' ') pos.push(j); });
      while (at < need.length) { S.want = rocks.find(r => !r.userData.gone && r.userData.ch === need[at]); S.waiting = true; const got = await new Promise(res => { K.pointer = { down(e) { const h = K.hit(e, rocks.filter(r => !r.userData.gone).map(r => r.userData.hit)); if (!h) return false; K.pointer = null; res(h.object.userData.rock); return true; }, cursor: () => 'crosshair' }; }); S.waiting = false; if (!K.alive()) return null;
        await shoot(got); if (got.userData.ch === need[at]) { K.sfx('tick'); got.userData.gone = true; const sl = slotsRow[pos[at]]; c.burst(got.position.clone(), 0xffd08a, 10); got.userData.m.visible = false; await K.glide(got, sl.position.clone().add(new T.Vector3(0, 0, 0.1)), 0.45, 0.4); got.scale.setScalar(Math.min(0.7, S.slotW / 0.95)); at++; continue; }   /* the letter settles into its slot, sized to fit */
        miss++; K.sfx('wrong'); const tb = got.userData.tb; tb.userData.tablet.setState('wrong'); setTimeout(() => { try { tb.userData.tablet.setState(null); } catch (e) {} }, 800); K.tell(kick, t('as_no', { l: got.userData.ch.toUpperCase() })); await K.wait(1.0); K.tell(kick, show ? t('as_copy', { w: w.toUpperCase() }) : t('as_clue', { c: t(clueKey), n: need.length })); }
      K.sfx('correct'); K.tell(w.toUpperCase(), t('as_yes')); K.hint(null); await K.wait(1.6); return miss === 0 ? 1 : miss <= 2 ? 2 : 0; }
    function frame(a) { if (a < 1.05) gun.position.set(-2.5, -4.9, 0.5); else gun.position.set(-7.2, -3.9, 0.5);   /* the gun to the side, the word's slots in the middle */
      const tw = c.scene.getObjectByName('twinPlanets'); if (tw) { const A = tw.getObjectByName('pA'), B = tw.getObjectByName('pB');   /* both planets whole in view, under the plaque (portrait) or beside it (landscape) */
        if (a < 1.05) { const w = Math.min(1, a / 0.46), th = Math.tan(29 * PI / 180), vh = 24 * th, sc = Math.min(1.05, vh * a * 0.95 / 9.9), bot = (vh / 2 - 2.85 * sc - vh * 0.085) / (vh / 2), top = (bot - 0.06) * 57 * th - 0.2;   /* the plaque's lower edge (gamekit's own placement), in this camera's view at the planets' depth */
          const rA = 4.1 * w, rB = 2.6 * w; A.position.set(-5.4 * w, top - rA - 1.2, -40); A.scale.setScalar(rA); B.position.set(6.4 * w, top - rB, -40); B.scale.setScalar(rB); }
        else { A.position.set(-31, 5, -40); A.scale.setScalar(5.6); B.position.set(31, 3, -40); B.scale.setScalar(3.4); } }   /* out to the sides, below the plaque's band, so it never covers them */
      return a < 1.05 ? { pos: [0, -0.2, 17], look: [0, -0.4, 0], fov: 58 } : { pos: [0, 0.2, 13.5], look: [0, -0.4, 0], fov: 50 }; }
    async function play(api) { K.mount(api); S.band = clamp(api.band || 2, 1, 6); window.__spell = { S, rocks: () => rocks }; const N = 4, done = []; let pts = 0; api.pips(N, done);
      S.order = shuffle(WORDS[he() ? 'he' : 'en'][S.band]).slice(0, N); const nm = t('sp_spell'); await K.intro(async () => { K.tell(nm, t('as_hi')); await K.act(t('as_start')); }); if (!K.alive()) return;
      for (let i = 0; i < N; i++) { S.word = S.order[i][0]; const r = await word(i, N, t('as_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 6 : 2; done.push(r === 1); api.pips(N, done); }
      clear(); const right = done.filter(Boolean).length; K.tell(nm, t('as_win')); await K.wait(1.4);
      api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('as_win') }); }
    function dispose() { K.dispose(); clear(); }
    return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose }; };
  THEMES.sp_belt = { palette: { noFloor: true, sky: 0x06040e, ground: 0x06040e, fog: 0x0a0818, wall: ['plank', '#06040e', '#06040e'], floor: ['plank', '#06040e', '#06040e'], hemi: [0xc8b8ff, 0x141020], key: 0xffe8d0, dust: { c: 0xffffff, n: 40, mode: 'drift' } },
    look: { keyC: 0xffe8d0, grade: 'dusk', exposure: 1.05, fogD: 0.004, rim: 0xffb08a, face: 0x140e28, accent: '#ffd8b8', pillars: null, rays: 0, noWall: true, ceiling: false },
    props(c) { const { scene } = c; if (KQRealms.hall && KQRealms.hall.skyDome) KQRealms.hall.skyDome(c, 0x030208, 0x140c2a);
      for (let i = 0; i < 300; i++) { const a = Math.random() * TAU, e = Math.random() * 1.3 - 0.4, r = 70; c.sprite(0xffffff, 0.1 + Math.random() * 0.22, Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.abs(Math.sin(a) * Math.cos(e) * r) - 8, null, 0.4 + Math.random() * 0.5); }
      const far = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), M(0x5a5260, { flatShading: true }), 80), m4 = new T.Matrix4(); for (let i = 0; i < 80; i++) { const s = 0.2 + Math.random() * 0.9; m4.compose(new T.Vector3((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 20 + 2, -12 - Math.random() * 30), new T.Quaternion().setFromEuler(new T.Euler(Math.random() * 3, Math.random() * 3, 0)), new T.Vector3(s, s, s)); far.setMatrixAt(i, m4); } scene.add(far);
      /* two planets in the sky, like Tatooine's (Yoni 2026-09-29: 'make this two planets … make them be seen in full'): a big sand-banded
         desert world and a small pale one. The stage's frame() places them for the screen's shape, clear of the plaque and never cut off */
      const band = (cols, dunes) => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const g = cv.getContext('2d');
        for (let y = 0; y < 256; y += 4) { g.fillStyle = cols[Math.floor((Math.sin(y * 0.09) * 0.5 + 0.5 + Math.sin(y * 0.031) * 0.3) * cols.length) % cols.length]; g.fillRect(0, y, 512, 4); }
        for (let i = 0; i < dunes; i++) { g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '90,50,20' : '255,235,190') + ',' + (0.08 + Math.random() * 0.14) + ')'; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 40, 3 + Math.random() * 8, 0, 0, TAU); g.fill(); }
        const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; return tx; };
      const world = (r, cols, dunes, glow) => { const g = new T.Group(), tx = band(cols, dunes); const m = new T.Mesh(new T.SphereGeometry(r, 48, 32), new T.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.32, roughness: 0.95 })); m.rotation.z = 0.25; g.add(m);
        const halo = c.sprite(glow, r * 3.1, 0, 0, -0.5, null, 0.35); g.add(halo); g.userData.spin = m; return g; };
      const twin = new T.Group(); twin.name = 'twinPlanets'; scene.add(twin);
      const A = world(1, ['#e0b070', '#d49a58', '#eac48a', '#c8864a', '#f0d4a0'], 90, 0xffc890), B = world(1, ['#d8d2c8', '#c4bcb0', '#e8e2d8', '#b0a898'], 40, 0xdfe8ff); A.name = 'pA'; B.name = 'pB'; twin.add(A, B);
      c.updaters.push(dt => { A.userData.spin.rotation.y += dt * 0.03; B.userData.spin.rotation.y -= dt * 0.05; }); } };

  /* ================================================================== words (Hebrew in the plural: gender-neutral) */
  const STR = {
    en: Object.assign({}, FALL.en, {
      sp_blackhole: 'The Black Hole', sp_blackhole_b: 'Fall in… and find the universe of light',
      ls_hi: 'You fell through the black hole into the Lightverse! The light creatures sing in patterns. Listen, look, and choose who sings the next note.', ls_start: 'Sing!', ls_song: 'Song {i} of {n}',
      ls_listen: 'Listen to their song…', ls_which: 'Who sings the next note? Tap that creature.', ls_yes: 'The song is complete!', ls_no: 'That note does not fit the song. Listen again.', ls_no2: 'Not that one either.', ls_show: 'This creature sings the next note. Listen!',
      ls_h_ab: 'Two colours take turns: one, then the other, again and again.', ls_h_abc: 'Three colours take turns, always in the same order.', ls_h_unit: 'Find the part that repeats, then say it again from the start.', ls_h_grow: 'Count the little lights: each creature has one more than the one before.',
      ls_h_add: 'Each number is {d} more than the one before.', ls_h_sub: 'Each number is {d} less than the one before.', ls_h_dbl: 'Each number is double the one before.', ls_h_alt: 'Look at the jumps: up 3, down 1, up 3, down 1…', ls_h_sq: '1×1, 2×2, 3×3, 4×4… what comes next?', ls_h_fib: 'Add the two numbers before to get the next one.',
      ls_win: 'The light creatures sing your song across their universe!' }),
    he: Object.assign({}, FALL.he, {
      sp_blackhole: 'החור השחור', sp_blackhole_b: 'נופלים פנימה… ומגלים את יקום האור',
      ls_hi: 'נפלתם דרך החור השחור אל יקום האור! יצורי האור שרים בתבניות. מקשיבים, מסתכלים ובוחרים מי שר את הצליל הבא.', ls_start: 'שרים!', ls_song: 'שיר {i} מתוך {n}',
      ls_listen: 'מקשיבים לשיר שלהם…', ls_which: 'מי שר את הצליל הבא? נוגעים ביצור.', ls_yes: 'השיר הושלם!', ls_no: 'הצליל הזה לא מתאים לשיר. מקשיבים שוב.', ls_no2: 'גם לא הוא.', ls_show: 'היצור הזה שר את הצליל הבא. הקשיבו!',
      ls_h_ab: 'שני צבעים מתחלפים: אחד ואז השני, שוב ושוב.', ls_h_abc: 'שלושה צבעים מתחלפים, תמיד באותו סדר.', ls_h_unit: 'מוצאים את החלק שחוזר, ואומרים אותו שוב מההתחלה.', ls_h_grow: 'סופרים את האורות הקטנים: לכל יצור יש אחד יותר מלזה שלפניו.',
      ls_h_add: 'כל מספר גדול ב־{d} מהמספר שלפניו.', ls_h_sub: 'כל מספר קטן ב־{d} מהמספר שלפניו.', ls_h_dbl: 'כל מספר הוא כפול מהמספר שלפניו.', ls_h_alt: 'מסתכלים על הקפיצות: עולים 3, יורדים 1, עולים 3, יורדים 1…', ls_h_sq: '1×1, 2×2, 3×3, 4×4… מה בא אחר כך?', ls_h_fib: 'מחברים את שני המספרים הקודמים ומקבלים את הבא.',
      ls_win: 'יצורי האור שרים את השיר שלכם בכל היקום שלהם!' })
  };

  Object.assign(STR.en, {"sp_stars": "Star Connect", "sp_stars_b": "Count your way across the constellations", "sp_mission": "Mission Control", "sp_mission_b": "Read the orders and fly the probe to the right planet", "sp_spell": "Asteroid Speller", "sp_spell_b": "Shoot the letters in order to spell the space word", "st_hi": "Every star wears a number. Join them in counting order and a real constellation appears in the sky!", "st_start": "Look up", "st_sky": "Sky {i} of {n}", "st_rUp": "counting up by {d} from {s}", "st_rDown": "counting down by {d} from {s}", "st_rDbl": "doubling each time", "st_told": "Join the stars {rule}. Tap the next star.", "st_find": "The first two stars are joined. Find the rule and tap the next star.", "st_hintTold": "The next star is {n}.", "st_hintFind": "How do you get from {a} to {b}? Do the same again.", "st_no": "{v} does not come next. Look at the last star you joined.", "st_next": "Next sky", "st_win": "You drew four constellations across the night sky!", "cs_dipper": "The Big Dipper", "cs_dipper_f": "Seven bright stars in the Great Bear. The two stars at the end of the bowl point to the North Star.", "cs_cassiopeia": "Cassiopeia", "cs_cassiopeia_f": "A queen on her throne, shaped like a W. She circles the North Star all night long.", "cs_orion": "Orion", "cs_orion_f": "The Hunter. Three stars in a row are his belt; red Betelgeuse is his shoulder and blue-white Rigel his foot.", "cs_cygnus": "Cygnus, the Swan", "cs_cygnus_f": "Also called the Northern Cross. Its tail star, Deneb, is a giant far brighter than our Sun.", "cs_leo": "Leo, the Lion", "cs_leo_f": "A backwards question mark makes its head and mane; the bright star Regulus is its heart.", "cs_scorpius": "Scorpius", "cs_scorpius_f": "The Scorpion with a curling tail. Its red heart, Antares, is so big it would swallow the orbit of Mars.", "cs_crux": "The Southern Cross", "cs_crux_f": "The smallest constellation of all. Sailors in the south used it to find their way.", "cs_lyra": "Lyra, the Lyre", "cs_lyra_f": "A little harp. Its star Vega is one of the brightest in the night sky.", "pl_mercury": "Mercury", "pl_venus": "Venus", "pl_earth": "Earth", "pl_mars": "Mars", "pl_jupiter": "Jupiter", "pl_saturn": "Saturn", "pl_uranus": "Uranus", "pl_neptune": "Neptune", "mf_mercury": "The smallest planet and the closest to the Sun.", "mf_venus": "The hottest planet, hidden under thick clouds.", "mf_earth": "Our home, the only planet we know with life.", "mf_mars": "The red planet, covered in rusty dust.", "mf_jupiter": "The biggest planet, a giant ball of gas.", "mf_saturn": "Its rings are made of countless pieces of ice and rock.", "mf_uranus": "An ice giant that rolls around the Sun on its side.", "mf_neptune": "The farthest planet, with the fastest winds.", "mc_hi": "Mission Control here! Read each order and tap the planet to send the probe there.", "mc_start": "Launch", "mc_n": "Mission {i} of {n}", "mc_hint": "Read it again, slowly: which words tell you where to go?", "mc_yes": "Arrived at {p}!", "mc_no": "This is {p}. Read the order again:", "mc_show": "The order meant {p}.", "mc_next": "Next mission", "mc_win": "Every mission complete. Mission Control is proud of you!", "mc1_mars": "Fly to the red planet.", "mc1_saturn": "Fly to the planet with big rings.", "mc1_jupiter": "Fly to the biggest planet.", "mc1_earth": "Fly home, to the blue planet where we live.", "mc1_neptune": "Fly to the last planet, the one farthest from the Sun.", "mc2_mercury": "Fly to the planet closest to the Sun.", "mc2_mars": "Fly to the red planet next to Earth.", "mc2_saturn": "Fly to the planet with rings, right after Jupiter.", "mc2_earth": "Fly to the third planet from the Sun: our home.", "mc2_neptune": "Fly to the deep blue planet at the very end.", "mc2_jupiter": "Fly to the giant planet with a big red spot.", "mc3_earth": "Visit the planet between Venus and Mars.", "mc3_jupiter": "Fly past Mars to the next planet.", "mc3_venus": "Go to the second planet from the Sun.", "mc3_uranus": "Go to the seventh planet from the Sun.", "mc3_mars": "Fly to the planet just before the biggest one.", "mc3_saturn": "Fly to the planet between Jupiter and Uranus.", "mc4_uranus": "This planet spins on its side, rolling around the Sun like a ball.", "mc4_venus": "On this planet a day is longer than a whole year.", "mc4_mars": "The tallest volcano in the solar system, Olympus Mons, is on this planet.", "mc4_neptune": "The windiest planet, deep blue and farthest from the Sun.", "mc4_jupiter": "A storm called the Great Red Spot, bigger than Earth, spins on this planet.", "mc4_mercury": "The smallest planet, racing round the Sun faster than any other.", "mc5_saturn": "Not the biggest planet, but it wears the brightest rings.", "mc5_venus": "The hottest planet, even though it is not the closest to the Sun: its thick clouds trap the heat.", "mc5_mercury": "The closest planet to the Sun, yet its nights are freezing cold, because it has almost no air.", "mc5_earth": "The only planet we know of with oceans of liquid water on its surface, and with life.", "mc5_uranus": "An ice giant tipped over on its side: the planet just before the last one.", "mc5_jupiter": "So big that all the other planets could fit inside it.", "mc6_saturn": "Mission log: fly to the planet whose moon Titan has thick air and lakes of liquid methane.", "mc6_jupiter": "Mission log: its moon Europa may hide an ocean under the ice, and its moon Ganymede is bigger than Mercury.", "mc6_uranus": "Mission log: the first planet ever found with a telescope, by William Herschel in 1781.", "mc6_neptune": "Mission log: its largest moon, Triton, circles it backwards, against the planet’s spin.", "mc6_mars": "Mission log: two small moons, Phobos and Deimos, circle this rusty-red desert world.", "mc6_venus": "Mission log: it spins backwards, so there the Sun rises in the west.", "as_hi": "Letters are riding the asteroids! Tap them in the right order to spell the word.", "as_start": "Ready", "as_n": "Word {i} of {n}", "as_copy": "Spell: {w}", "as_clue": "{c} ({n} letters)", "as_hint": "The word is {w}. Shoot its next letter.", "as_no": "{l} is not the next letter.", "as_yes": "Spelled right!", "as_win": "The asteroid field is clear!", "ws_sun": "The star at the centre of our solar system", "ws_moon": "It circles the Earth and shines at night", "ws_star": "A giant ball of glowing gas, far away", "ws_sky": "Where you look up to see the clouds and the stars", "ws_space": "The huge, empty place between the stars", "ws_mars": "The red planet", "ws_earth": "Our home planet", "ws_comet": "An icy visitor with a long glowing tail", "ws_orbit": "The path a planet travels around the Sun", "ws_planet": "Earth, Mars and Jupiter are each one of these", "ws_rocket": "It blasts off to carry people into space", "ws_saturn": "The planet with the brightest rings", "ws_galaxy": "A huge family of billions of stars, like the Milky Way", "ws_satellite": "A machine that circles the Earth and sends signals", "ws_jupiter": "The biggest planet", "ws_asteroid": "A space rock circling the Sun", "ws_meteor": "A shooting star burning up in the air", "ws_crater": "A round hole made when a rock hits the ground", "ws_uranus": "The planet that spins on its side", "ws_gravity": "The pull that keeps our feet on the ground", "ws_nebula": "A giant cloud of gas and dust where stars are born", "ws_astronaut": "A person trained to travel in space", "ws_telescope": "It makes faraway stars look closer", "ws_atmosphere": "The layers of air around a planet", "ws_constellation": "A group of stars that makes a picture in the sky", "ws_equator": "The imaginary line around the middle of the Earth", "ws_body": "Any natural object in space: a star, a planet or a moon"});
  Object.assign(STR.he, {"sp_stars": "מחברים כוכבים", "sp_stars_b": "סופרים ומגלים קבוצות כוכבים", "sp_mission": "מרכז הבקרה", "sp_mission_b": "קוראים את הפקודות ומטיסים את הגשושית לכוכב הלכת הנכון", "sp_spell": "מאייתים אסטרואידים", "sp_spell_b": "יורים באותיות לפי הסדר ומאייתים מילה מהחלל", "st_hi": "על כל כוכב יש מספר. מחברים אותם לפי סדר הספירה, ובשמיים מופיעה קבוצת כוכבים אמיתית!", "st_start": "מסתכלים למעלה", "st_sky": "שמיים {i} מתוך {n}", "st_rUp": "סופרים קדימה בקפיצות של {d} מ־{s}", "st_rDown": "סופרים אחורה בקפיצות של {d} מ־{s}", "st_rDbl": "מכפילים כל פעם", "st_told": "מחברים את הכוכבים: {rule}. נוגעים בכוכב הבא.", "st_find": "שני הכוכבים הראשונים כבר מחוברים. מגלים את החוק ונוגעים בכוכב הבא.", "st_hintTold": "הכוכב הבא הוא {n}.", "st_hintFind": "איך מגיעים מ־{a} ל־{b}? עושים את אותו הדבר שוב.", "st_no": "{v} לא בא עכשיו. מסתכלים על הכוכב האחרון שחיברתם.", "st_next": "לשמיים הבאים", "st_win": "ציירתם ארבע קבוצות כוכבים בשמי הלילה!", "cs_dipper": "העגלה הגדולה", "cs_dipper_f": "שבעה כוכבים בהירים בדובה הגדולה. שני הכוכבים שבקצה הקערה מצביעים על כוכב הצפון.", "cs_cassiopeia": "קסיופאה", "cs_cassiopeia_f": "מלכה על כיסא, בצורת W. היא מקיפה את כוכב הצפון כל הלילה.", "cs_orion": "אוריון", "cs_orion_f": "הצייד. שלושה כוכבים בשורה הם החגורה שלו; בטלגז האדום הוא הכתף, וריגל הכחול־לבן הוא הרגל.", "cs_cygnus": "הברבור", "cs_cygnus_f": "נקרא גם הצלב הצפוני. הכוכב שבזנב, דנב, הוא ענק שבהיר הרבה יותר מהשמש שלנו.", "cs_leo": "אריה", "cs_leo_f": "סימן שאלה הפוך יוצר את הראש והרעמה; הכוכב הבהיר רגולוס הוא הלב.", "cs_scorpius": "עקרב", "cs_scorpius_f": "העקרב עם הזנב המתעקל. הלב האדום שלו, אנטארס, גדול כל כך שהיה בולע את המסלול של מאדים.", "cs_crux": "הצלב הדרומי", "cs_crux_f": "קבוצת הכוכבים הקטנה ביותר. מלחים בדרום השתמשו בה כדי למצוא את הדרך.", "cs_lyra": "נבל", "cs_lyra_f": "נבל קטן. הכוכב וגה הוא מהבהירים ביותר בשמי הלילה.", "pl_mercury": "כוכב חמה", "pl_venus": "נוגה", "pl_earth": "כדור הארץ", "pl_mars": "מאדים", "pl_jupiter": "צדק", "pl_saturn": "שבתאי", "pl_uranus": "אורנוס", "pl_neptune": "נפטון", "mf_mercury": "כוכב הלכת הקטן ביותר והקרוב ביותר לשמש.", "mf_venus": "כוכב הלכת החם ביותר, מוסתר מתחת לעננים עבים.", "mf_earth": "הבית שלנו, כוכב הלכת היחיד שאנחנו מכירים שיש בו חיים.", "mf_mars": "כוכב הלכת האדום, מכוסה באבק חלוד.", "mf_jupiter": "כוכב הלכת הגדול ביותר, כדור ענק של גז.", "mf_saturn": "הטבעות שלו עשויות אינספור חתיכות של קרח וסלע.", "mf_uranus": "ענק קרח שמתגלגל סביב השמש על הצד.", "mf_neptune": "כוכב הלכת הרחוק ביותר, עם הרוחות המהירות ביותר.", "mc_hi": "כאן מרכז הבקרה! קוראים כל פקודה ונוגעים בכוכב הלכת כדי לשלוח לשם את הגשושית.", "mc_start": "שיגור", "mc_n": "משימה {i} מתוך {n}", "mc_hint": "קוראים שוב לאט: אילו מילים אומרות לאן לטוס?", "mc_yes": "הגענו אל {p}!", "mc_no": "זה {p}. קוראים שוב את הפקודה:", "mc_show": "הפקודה התכוונה אל {p}.", "mc_next": "למשימה הבאה", "mc_win": "כל המשימות הושלמו. מרכז הבקרה גאה בכם!", "mc1_mars": "טסים לכוכב הלכת האדום.", "mc1_saturn": "טסים לכוכב הלכת עם הטבעות הגדולות.", "mc1_jupiter": "טסים לכוכב הלכת הכי גדול.", "mc1_earth": "טסים הביתה, לכוכב הלכת הכחול שבו אנחנו גרים.", "mc1_neptune": "טסים לכוכב הלכת האחרון, הכי רחוק מהשמש.", "mc2_mercury": "טסים לכוכב הלכת הכי קרוב לשמש.", "mc2_mars": "טסים לכוכב הלכת האדום שליד כדור הארץ.", "mc2_saturn": "טסים לכוכב הלכת עם הטבעות, מיד אחרי צדק.", "mc2_earth": "טסים לכוכב הלכת השלישי מהשמש: הבית שלנו.", "mc2_neptune": "טסים לכוכב הלכת הכחול העמוק שבסוף.", "mc2_jupiter": "טסים לכוכב הלכת הענק עם הכתם האדום הגדול.", "mc3_earth": "מבקרים בכוכב הלכת שבין נוגה למאדים.", "mc3_jupiter": "עוברים את מאדים וטסים לכוכב הלכת הבא.", "mc3_venus": "טסים לכוכב הלכת השני מהשמש.", "mc3_uranus": "טסים לכוכב הלכת השביעי מהשמש.", "mc3_mars": "טסים לכוכב הלכת שממש לפני הגדול מכולם.", "mc3_saturn": "טסים לכוכב הלכת שבין צדק לאורנוס.", "mc4_uranus": "כוכב הלכת הזה מסתובב על הצד, ומתגלגל סביב השמש כמו כדור.", "mc4_venus": "בכוכב הלכת הזה יום אחד ארוך יותר משנה שלמה.", "mc4_mars": "הר הגעש הגבוה ביותר במערכת השמש, אולימפוס מונס, נמצא על כוכב הלכת הזה.", "mc4_neptune": "כוכב הלכת עם הרוחות החזקות ביותר, כחול עמוק והכי רחוק מהשמש.", "mc4_jupiter": "סופה בשם הכתם האדום הגדול, גדולה יותר מכדור הארץ, מסתחררת על כוכב הלכת הזה.", "mc4_mercury": "כוכב הלכת הקטן ביותר, שמקיף את השמש מהר יותר מכל האחרים.", "mc5_saturn": "לא כוכב הלכת הגדול ביותר, אבל יש לו את הטבעות הבהירות ביותר.", "mc5_venus": "כוכב הלכת החם ביותר, למרות שהוא לא הכי קרוב לשמש: העננים העבים שלו לוכדים את החום.", "mc5_mercury": "כוכב הלכת הקרוב ביותר לשמש, ובכל זאת הלילות בו קפואים, כי כמעט אין לו אוויר.", "mc5_earth": "כוכב הלכת היחיד שאנחנו מכירים עם אוקיינוסים של מים נוזליים על פניו, ועם חיים.", "mc5_uranus": "ענק קרח שנוטה על הצד: כוכב הלכת שממש לפני האחרון.", "mc5_jupiter": "גדול כל כך שכל שאר כוכבי הלכת יכולים להיכנס לתוכו.", "mc6_saturn": "יומן המשימה: טסים לכוכב הלכת שהירח שלו, טיטאן, עטוף באוויר סמיך ויש בו אגמים של מתאן נוזלי.", "mc6_jupiter": "יומן המשימה: הירח שלו אירופה אולי מסתיר אוקיינוס מתחת לקרח, והירח שלו גנימד גדול יותר מכוכב חמה.", "mc6_uranus": "יומן המשימה: כוכב הלכת הראשון שהתגלה בעזרת טלסקופ, בידי ויליאם הרשל ב־1781.", "mc6_neptune": "יומן המשימה: הירח הגדול שלו, טריטון, מקיף אותו הפוך, נגד כיוון הסיבוב של כוכב הלכת.", "mc6_mars": "יומן המשימה: שני ירחים קטנים, פובוס ודימוס, מקיפים את עולם המדבר האדום־חלוד הזה.", "mc6_venus": "יומן המשימה: הוא מסתובב הפוך, ולכן שם השמש זורחת במערב.", "as_hi": "אותיות רוכבות על אסטרואידים! נוגעים בהן לפי הסדר הנכון כדי לאיית את המילה.", "as_start": "מוכנים", "as_n": "מילה {i} מתוך {n}", "as_copy": "מאייתים: {w}", "as_clue": "{c} ({n} אותיות)", "as_hint": "המילה היא {w}. יורים באות הבאה שלה.", "as_no": "{l} היא לא האות הבאה.", "as_yes": "איות נכון!", "as_win": "שדה האסטרואידים נקי!", "ws_sun": "הכוכב שבמרכז מערכת השמש שלנו", "ws_moon": "הוא מקיף את כדור הארץ ומאיר בלילה", "ws_star": "כדור ענק של גז זוהר, רחוק מאוד", "ws_sky": "לשם מסתכלים למעלה כדי לראות עננים וכוכבים", "ws_space": "המקום הריק והעצום שבין הכוכבים", "ws_mars": "כוכב הלכת האדום", "ws_earth": "כוכב הלכת שלנו", "ws_comet": "אורח קפוא עם זנב זוהר וארוך", "ws_orbit": "הדרך שבה כוכב לכת נע סביב השמש", "ws_planet": "כדור הארץ, מאדים וצדק הם כל אחד כזה", "ws_rocket": "הוא ממריא ונושא אנשים לחלל", "ws_saturn": "כוכב הלכת עם הטבעות הבהירות ביותר", "ws_galaxy": "משפחה ענקית של מיליארדי כוכבים, כמו שביל החלב", "ws_satellite": "מכונה שמקיפה את כדור הארץ ושולחת אותות", "ws_jupiter": "כוכב הלכת הגדול ביותר", "ws_asteroid": "סלע בחלל שמקיף את השמש", "ws_meteor": "כוכב נופל שנשרף באוויר", "ws_crater": "בור עגול שנוצר כשסלע פוגע בקרקע", "ws_uranus": "כוכב הלכת שמסתובב על הצד", "ws_gravity": "המשיכה ששומרת את הרגליים שלנו על הקרקע", "ws_nebula": "ענן ענק של גז ואבק שבו נולדים כוכבים", "ws_astronaut": "אדם שהוכשר לטוס לחלל", "ws_telescope": "הוא גורם לכוכבים רחוקים להיראות קרובים יותר", "ws_atmosphere": "שכבות האוויר שמסביב לכוכב לכת", "ws_constellation": "קבוצה של כוכבים שיוצרת ציור בשמיים", "ws_equator": "הקו הדמיוני שמקיף את אמצע כדור הארץ", "ws_body": "כל עצם טבעי בחלל: כוכב, כוכב לכת או ירח"});

  /* ================================================================== THE ATLAS GAMES (Yoni 2026-10-10, Space step 2: "Who am I?",
     "Weigh-in & jump", "Line them up"). They play with the Atlas's painted plates and its NASA numbers. A plate is cut out of its paper here
     (a flood from the cell's edges: the paper goes clear, bright parts inside a world stay), then shown as a sprite in the 3D hall. */
  const SHEET = { cols: 6, ids: AT_IDS.concat('astronaut') };
  let plImg = null; const plWait = [], plCut = {}, plTex = {};
  function withSheet(cb) { if (plImg && plImg.complete && plImg.naturalWidth) { cb(plImg); return; } plWait.push(cb); if (plImg) return;
    plImg = new Image(); plImg.onload = () => { for (const f of plWait.splice(0)) f(plImg); }; plImg.src = AT_BASE + 'atlas.webp?v=2'; }
  function cutPlate(img, id) { if (plCut[id]) return plCut[id]; const i = SHEET.ids.indexOf(id), C = Math.round(img.naturalWidth / SHEET.cols), cv = document.createElement('canvas'); cv.width = cv.height = C;
    const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, (i % SHEET.cols) * C, Math.floor(i / SHEET.cols) * C, C, C, 0, 0, C, C);
    const d = x.getImageData(0, 0, C, C), p = d.data, N = C * C, seen = new Uint8Array(N), q = new Int32Array(N); let h = 0, tl = 0;
    const far = k => Math.abs(p[k * 4] - 244) + Math.abs(p[k * 4 + 1] - 236) + Math.abs(p[k * 4 + 2] - 219);   /* the Atlas paper, #f4ecdb */
    for (let k = 0; k < C; k++) for (const s of [k, (C - 1) * C + k, k * C, k * C + C - 1]) if (!seen[s] && far(s) < 34) { seen[s] = 1; q[tl++] = s; }
    while (h < tl) { const s = q[h++], sx = s % C, sy = (s / C) | 0; for (const n of [sx > 0 ? s - 1 : -1, sx < C - 1 ? s + 1 : -1, sy > 0 ? s - C : -1, sy < C - 1 ? s + C : -1]) if (n >= 0 && !seen[n] && far(n) < 34) { seen[n] = 1; q[tl++] = n; } }
    for (let k = 0; k < N; k++) { if (seen[k]) { p[k * 4 + 3] = 0; continue; } for (const n of [k - 1, k + 1, k - C, k + C, k - 2, k + 2, k - 2 * C, k + 2 * C]) if (n >= 0 && n < N && seen[n]) { p[k * 4 + 3] = Math.min(255, far(k) * 4); break; } }   /* the soft rim fades out */
    x.putImageData(d, 0, 0); return (plCut[id] = cv); }
  /* blur: 0 = sharp; 8 / 16 / 32 = drawn that many times smaller, then scaled back up (a soft blur every browser can do) */
  function plateTex(id, blur) { const key = id + '|' + (blur || 0); if (plTex[key]) return plTex[key]; const cv = document.createElement('canvas'); cv.width = cv.height = 256; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; plTex[key] = tex;
    withSheet(img => { const src = cutPlate(img, id), x = cv.getContext('2d'); x.clearRect(0, 0, 256, 256); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      if (blur) { const s = Math.max(6, Math.round(256 / blur)), tmp = document.createElement('canvas'); tmp.width = tmp.height = s; const y = tmp.getContext('2d'); y.imageSmoothingEnabled = true; y.imageSmoothingQuality = 'high'; y.drawImage(src, 0, 0, s, s); x.drawImage(tmp, 0, 0, 256, 256); }
      else x.drawImage(src, 0, 0, 256, 256); tex.needsUpdate = true; }); return tex; }
  function plateSprite(id, size, blur) { const sp = new T.Sprite(new T.SpriteMaterial({ map: plateTex(id, blur), transparent: true, depthWrite: false })); sp.scale.set(size, size, 1); sp.userData.plate = id; return sp; }
  /* a quiet starry hall, one tint per game */
  function atlasHall(sky, hor, rim) { return { palette: { noFloor: true, sky, ground: 0x08081a, fog: sky, wall: ['plank', '#0a0c18', '#080a14'], floor: ['plank', '#0a0c18', '#080a14'], hemi: [0xc8d0ff, 0x101020], key: 0xfff4e6, dust: { c: 0xffffff, n: 30, mode: 'drift' } },
    look: { keyC: 0xfff4e6, grade: 'night', exposure: 1.0, fogD: 0.003, rim, face: 0x0e1430, accent: '#cfe0ff', pillars: null, rays: 0, noWall: true, ceiling: false },
    props(c) { if (KQRealms.hall && KQRealms.hall.skyDome) KQRealms.hall.skyDome(c, sky, hor); for (let i = 0; i < 240; i++) { const a = Math.random() * TAU, e = Math.random() * 1.2 - 0.1, r = 60; c.sprite(0xffffff, 0.1 + Math.random() * 0.22, Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r + 2, -Math.abs(Math.sin(a) * Math.cos(e) * r) - 10, null, 0.45 + Math.random() * 0.5); } } }; }
  THEMES.sp_mystery = atlasHall(0x0c0620, 0x2a1450, 0xb48cff);
  THEMES.sp_gravity = atlasHall(0x050a1a, 0x182a50, 0x8ad8ff);
  THEMES.sp_lineup = atlasHall(0x060818, 0x1a1a40, 0xffd27a);
  const lvOf = b => b <= 2 ? 1 : b <= 4 ? 2 : 3;
  const hallFrame = a => a < 1.05 ? { pos: [0, 1.4, 18.5], look: [0, 1.0, 0], fov: 56 } : { pos: [0, 1.4, 14.5], look: [0, 1.0, 0], fov: 46 };

  /* ------------------------------------------------------------------ WHO AM I? a world hides in the mist; clues, then the picture clears.
     4–7: a look clue then the Atlas clue, picked from four pictures. 8–11: a number, a superpower, the Atlas clue; names to pick. 12+: two
     numbers, a third, then a superpower, with look-alike worlds to choose from. Fewer clues, more points */
  const WHO = { mercury: ['year', ['g', 'temp'], 'day'], venus: ['temp', ['g', 'year'], 'day'], earth: ['year', ['g', 'temp'], 'moons'], mars: ['day', ['g', 'year'], 'moons'], jupiter: ['moons', ['g', 'day'], 'diam'],
    saturn: ['moons', ['g', 'day'], 'year'], uranus: ['temp', ['day', 'year'], 'moons'], neptune: ['dist', ['g', 'temp'], 'year'], moon: ['distE', ['g', 'day'], 'temp'], pluto: ['year', ['g', 'temp'], 'moons'] };
  const ROCKY = ['mercury', 'venus', 'earth', 'mars', 'moon', 'pluto'], GIANT = ['jupiter', 'saturn', 'uranus', 'neptune'];
  function whoClues(id, lv) { const X = atx(id), nm = atName(id), pw = X.pw.map(w => w[1]).filter(s2 => s2.indexOf(nm) < 0), W = WHO[id];
    const st = k => k === 'moons' ? t('wc_moons', { n: atNum(AT_D[id].moons, 0) }) : t('wc_' + k, { v: k === 'distE' ? atStat.dist(id) : atStat[k](id) });
    if (lv === 1) return [t('lk_' + id), X.clue];
    if (lv === 2) return [st(W[0]), pw[0] || X.clue, X.clue];
    return [st(W[1][0]) + ' ' + st(W[1][1]), st(W[2]), pw[pw.length - 1] || X.clue]; }
  STAGES.sp_whoami = function (c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2 }; let objs = [], tabs = [], hits = [];
    function clear() { for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } for (const o of objs.splice(0)) scene.remove(o); hits = []; K.tray(null); K.pointer = null; }
    function others(id, lv) { const pool = AT_IDS.filter(x => x !== id), near = (ROCKY.includes(id) ? ROCKY : GIANT).filter(x => x !== id);
      return lv === 3 ? shuffle(near).concat(shuffle(pool.filter(x => !near.includes(x)))).slice(0, 3) : shuffle(pool).slice(0, 3); }
    async function round(i, n, kick) { clear(); const id = S.order[i], lv = lvOf(S.band), clues = whoClues(id, lv), nar = K.narrow(), blurs = lv === 1 ? [16, 6] : [32, 12, 5];
      const big = plateSprite(id, lv === 1 ? (nar ? 4.0 : 4.6) : (nar ? 5.0 : 5.6), blurs[0]); big.position.set(lv === 1 && !nar ? -3.4 : 0, lv === 1 ? (nar ? 3.0 : 0.9) : (nar ? 1.6 : 0.6), 0); scene.add(big); objs.push(big);
      const glow = c.sprite(0xb48cff, (lv === 1 ? 4.6 : 5.6) * 1.5, big.position.x, big.position.y, -0.6, null, 0.35); objs.push(glow);
      const opts = shuffle([id].concat(others(id, lv))), wrong = []; let shown = 1;
      const pics = {}; if (lv === 1) opts.forEach((o, k) => { const sp = plateSprite(o, nar ? 1.8 : 2.0, 0), x = nar ? (k % 2 ? 1.5 : -1.5) : 2.0 + (k % 2) * 2.7, y = nar ? -1.0 - Math.floor(k / 2) * 2.5 : 2.1 - Math.floor(k / 2) * 2.7;
        sp.position.set(x, y, 0); scene.add(sp); objs.push(sp); const hit = new T.Mesh(new T.SphereGeometry(1.0, 10, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.copy(sp.position); hit.userData.id = o; scene.add(hit); objs.push(hit); hits.push(hit);
        const tb = c.label(atName(o), -1, 0.46); tb.position.set(x, y - 1.25, 0.1); scene.add(tb); tabs.push(tb); pics[o] = { sp, hit, tb }; });
      S.id = id; S.hits = hits;   /* for the tests */
      const say = () => K.tell(kick, clues.slice(0, shown).join('   ·   ')), blurTo = () => { big.material.map = plateTex(id, blurs[Math.min(shown - 1, blurs.length - 1)]); big.material.needsUpdate = true; };
      say(); K.hint(() => K.tell(kick, clues.slice(0, shown).join('   ·   ') + '   ' + t('wh_hint')));
      const choose = () => new Promise(res => { const items = lv === 1 ? [] : opts.filter(o => !wrong.includes(o)).map(o => ({ text: atName(o), id: o })); if (shown < clues.length) items.push({ text: t('wh_more'), icon: 'magnifier', more: true });
        if (lv === 1) K.pointer = { down(e) { const h = K.hit(e, hits.filter(x => !wrong.includes(x.userData.id))); if (!h) return false; K.pointer = null; K.tray(null); res({ id: h.object.userData.id }); return true; }, cursor: () => 'pointer' };
        K.tray(items.length ? items : null, j => { K.pointer = null; K.tray(null); res(items[j]); }); });
      for (;;) { const r = await choose(); if (!K.alive()) return null;
        if (r.more) { shown++; blurTo(); say(); continue; }
        if (r.id === id) break;
        wrong.push(r.id); K.sfx('wrong'); if (pics[r.id]) { pics[r.id].sp.material.opacity = 0.25; try { pics[r.id].tb.userData.tablet.setState('wrong'); } catch (e) {} }
        if (shown < clues.length) { shown++; blurTo(); } K.tell(kick, t('wh_no', { p: atIn(r.id) }) + '   ' + clues.slice(0, shown).join('   ·   ')); }
      big.material.map = plateTex(id, 0); big.material.needsUpdate = true; K.sfx('correct'); c.burst(big.position.clone(), 0xfff0c0, 20); K.hint(null);
      if (pics[id]) try { pics[id].tb.userData.tablet.setState('right'); } catch (e) {}
      const X = atx(id), more = lv === 1 ? X.young[1] : lv === 2 ? X.pw[0][0] + ': ' + X.pw[0][1] : X.fact, fresh = atFind(id, !wrong.length && shown === 1);
      K.tell(atName(id), t('wh_yes', { p: atIn(id) }) + ' ' + more + (fresh ? ' ' + t('at_new', { p: atName(id) }) : '')); await K.act(t('wh_next')); return { shown, wrong: wrong.length }; }
    async function play(api) { K.mount(api); S.band = clamp(api.band || 2, 1, 6); window.__whoami = { S }; const N = 5, done = []; let pts = 0; api.pips(N, done); S.order = shuffle(AT_IDS).slice(0, N);
      const nm = t('sp_whoami'); await K.intro(async () => { K.tell(nm, t('wh_hi')); await K.act(t('wh_start')); }); if (!K.alive()) return;
      for (let i = 0; i < N; i++) { const r = await round(i, N, t('wh_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += Math.max(2, (r.shown === 1 ? 10 : r.shown === 2 ? 7 : 4) - r.wrong * 2); done.push(!r.wrong); api.pips(N, done); }
      clear(); const right = done.filter(Boolean).length; K.tell(nm, t('wh_win')); await K.wait(1.4);
      api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('wh_win') }); }
    function dispose() { K.dispose(); clear(); }
    return { dynamic: true, frame: hallFrame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose }; };

  /* ------------------------------------------------------------------ WEIGH-IN & JUMP: the painted astronaut on the world's ground, a scale
     under the boots, a pole in metres. 4–7: lighter or heavier? 8–11: what the scale shows / how high the jump (choices). 12+: typed. Then the
     scale reads, the astronaut jumps as high as that world allows (a 40 cm Earth jump × 9.8 ÷ gravity) */
  const GROUND = { mercury: 0x8a8580, venus: 0xc8a060, mars: 0xb85a3a, jupiter: 0xd8b088, saturn: 0xe8d8a8, uranus: 0x9ad8e0, neptune: 0x4a7ad8, moon: 0xa8a8ac, pluto: 0xd8c0a0, earth: 0x5a9a4a };
  STAGES.sp_gravity = function (c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2 }; let objs = [], tabs = [], stage = null;
    const U = 0.9;   /* scene units per metre */
    function clear() { for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } for (const o of objs.splice(0)) scene.remove(o); K.tray(null); }
    function setWorld(id) { clear(); const nar = K.narrow(), gy = nar ? -3.4 : -3.0, ax = nar ? -0.4 : -0.6;
      const ground = new T.Mesh(new T.CylinderGeometry(nar ? 5 : 7, nar ? 5.4 : 7.6, 0.6, 48), M(GROUND[id], { roughness: 0.95 })); ground.position.set(0, gy - 0.3, -1); scene.add(ground); objs.push(ground);
      for (let k = 0; k < 9; k++) { const cr = new T.Mesh(new T.CircleGeometry(0.2 + Math.random() * 0.45, 18), M(new T.Color(GROUND[id]).multiplyScalar(0.8).getHex(), { roughness: 1 })); cr.rotation.x = -PI / 2; cr.position.set((Math.random() - 0.5) * (nar ? 8 : 12), gy + 0.01, -1 + (Math.random() - 0.5) * 3); scene.add(cr); objs.push(cr); }
      const sky = plateSprite(id, nar ? 3.4 : 4.4, 0); sky.position.set(nar ? 2.2 : -5.2, nar ? 4.6 : 3.0, -6); scene.add(sky); objs.push(sky);
      const scale = new T.Mesh(new T.BoxGeometry(1.5, 0.24, 1.0), M(0xf2f0ea, { roughness: 0.4 })); scale.position.set(ax, gy + 0.12, 0); scene.add(scale); objs.push(scale);
      const pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 6.2 * U, 8), M(0xd8b04a, { metalness: 0.8, roughness: 0.3 })); pole.position.set(ax + (nar ? 2.0 : 2.4), gy + 3.1 * U, 0); scene.add(pole); objs.push(pole);
      for (let m = 1; m <= 6; m++) { const tick = new T.Mesh(new T.BoxGeometry(0.4, 0.04, 0.04), M(0xd8b04a)); tick.position.set(pole.position.x, gy + m * U, 0); scene.add(tick); objs.push(tick); const tb = c.label(m + t('gv_m'), -1, 0.32); tb.position.set(pole.position.x + 0.55, gy + m * U, 0.05); scene.add(tb); tabs.push(tb); }
      const astro = plateSprite('astronaut', 2.5, 0); astro.position.set(ax, gy + 0.24 + 1.2, 0.1); scene.add(astro); objs.push(astro);
      stage = { id, gy, ax, astro, scale, reading: null, top: pole.position.x }; }
    function reading(text) { if (stage.reading) { const i = tabs.indexOf(stage.reading); if (i >= 0) tabs.splice(i, 1); scene.remove(stage.reading); try { stage.reading.userData.tablet.dispose(); } catch (e) {} }
      const tb = c.label(text, -1, 0.5); tb.position.set(stage.ax, stage.gy - 0.45, 0.6); scene.add(tb); tabs.push(tb); stage.reading = tb; }
    async function jump(h) { const a = stage.astro, y0 = a.position.y, top = h * U, dur = clamp(0.7 + Math.sqrt(h) * 0.9, 0.8, 2.8);
      const mark = new T.Mesh(new T.BoxGeometry(1.6, 0.03, 0.03), new T.MeshBasicMaterial({ color: 0xffd27a })); mark.position.set(stage.ax, stage.gy + top + 0.05, 0.05); scene.add(mark); objs.push(mark);
      await K.anim(0.18, k => { a.scale.set(2.5, 2.5 * (1 - 0.12 * k), 1); }); a.scale.set(2.5, 2.5, 1);
      await K.anim(dur, k => { a.position.y = y0 + 4 * top * k * (1 - k); }); a.position.y = y0; K.sfx('tap'); }
    const fmtH = m => m >= 1 ? atFix(m) + t('gv_m') : Math.round(m * 100) + t('gv_cm');
    async function round(i, n, kick) { const id = S.order[i], D = AT_D[id], g = D.g, lv = lvOf(S.band); setWorld(id); const w = S.band <= 4 ? 30 : 24 + Math.floor(Math.random() * 22), onW = w * g / 9.8, h = 0.4 * 9.8 / g;
      reading(atNum(w, 0) + atU('kg')); const gline = t('gv_g', { p: atIn(id), g: atFix(g) }); let ok;
      if (lv === 1) { K.tell(kick, t('gv_q1', { p: atIn(id) })); const ans = g < 9.8 ? 0 : 1; ok = await new Promise(res => K.tray([{ text: t('gv_less') }, { text: t('gv_more') }], j => { K.tray(null); res(j === ans); })); }
      else { const askJump = i % 2 === 1, q = askJump ? t('gv_qj', { p: atIn(id) }) : t('gv_qw', { w: atNum(w, 0), p: atIn(id) }); K.tell(kick, q + ' ' + gline);
        if (lv === 2) { const right = askJump ? fmtH(h) : atNum(Math.round(onW), 0) + atU('kg'); const opts = askJump ? [h, 0.4, 0.4 * g / 9.8, h * 2].map(fmtH) : [Math.round(onW), w, Math.round(w * 9.8 / g), Math.round(onW * 2)].map(v => atNum(v, 0) + atU('kg'));
          const sh = shuffle([...new Set(opts)]); ok = await new Promise(res => K.tray(sh.map(x => ({ text: x })), j => { K.tray(null); res(sh[j] === right); })); }
        else { const v = await K.pad({ unit: askJump ? t('gv_cm').trim() : atU('kg').trim(), dp: true }); if (!K.alive()) return null; const exact = askJump ? h * 100 : onW; ok = Math.abs(Number(v) - exact) / exact <= 0.08; } }
      if (!K.alive()) return null; K.sfx(ok ? 'correct' : 'wrong');
      for (let s2 = 1; s2 <= 6; s2++) { reading(atNum(w + (onW - w) * s2 / 6, 0) + atU('kg')); await K.wait(0.11); if (!K.alive()) return null; } reading(atNum(onW, onW < 10 ? 1 : 0) + atU('kg'));   /* the needle settles */
      K.tell(atName(id), (ok ? t('gv_yes') : t('gv_no')) + ' ' + t('gv_show', { p: atIn(id), w: atNum(onW, onW < 10 ? 1 : 0) + atU('kg'), h: fmtH(h) }) + (D.gas ? ' ' + t('gv_gas', { p: atIn(id) }) : ''));
      await jump(h); if (!K.alive()) return null; await K.wait(0.3); await jump(h); if (!K.alive()) return null; atFind(id, ok); await K.act(t('gv_next')); return ok; }
    async function play(api) { K.mount(api); S.band = clamp(api.band || 2, 1, 6); window.__gravity = { S }; const N = 5, done = []; let pts = 0; api.pips(N, done);
      S.order = shuffle(lvOf(S.band) === 1 ? ['moon', 'mars', 'jupiter', 'pluto', 'neptune', 'mercury', 'saturn'] : AT_IDS.filter(x => x !== 'earth')).slice(0, N);
      setWorld('earth'); reading('30' + atU('kg')); const nm = t('sp_gravity'); await K.intro(async () => { K.tell(nm, t('gv_hi')); await K.act(t('gv_start')); }); if (!K.alive()) return;
      for (let i = 0; i < N; i++) { const r = await round(i, N, t('gv_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r ? 10 : 2; done.push(!!r); api.pips(N, done); }
      clear(); const right = done.filter(Boolean).length; K.tell(nm, t('gv_win')); await K.wait(1.4);
      api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('gv_win') }); }
    function dispose() { K.dispose(); clear(); }
    return { dynamic: true, frame: hallFrame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose }; };

  /* ------------------------------------------------------------------ LINE THEM UP: tap the worlds into the numbered slots, then check.
     4–7: three or four worlds by size, drawn at their true sizes. 8–11: four or five, by size, distance, heat or moons, numbers shown. 12+:
     six to eight, by temperature, gravity, a year or a day (hours and days mixed: read the units) */
  const LINE = { size: id => AT_D[id].diam, dist: id => AT_D[id].dist, temp: id => AT_D[id].temp, moons: id => AT_D[id].moons, g: id => AT_D[id].g, year: id => AT_D[id].year, day: id => AT_D[id].day };
  const LINE_POOL = { size: AT_IDS, dist: AT_IDS.filter(x => x !== 'moon'), temp: AT_IDS, moons: AT_IDS, g: AT_IDS, year: AT_IDS.filter(x => x !== 'moon'), day: AT_IDS };
  const LINE_TAG = { size: 'diam', dist: 'dist', temp: 'temp', moons: 'moons', g: 'g', year: 'year', day: 'day' };
  const LINE_PLAN = { 1: [['size', 3], ['size', 3], ['size', 4]], 2: [['size', 4], ['size', 4], ['size', 4]], 3: [['size', 4], ['dist', 4], ['temp', 4]], 4: [['dist', 5], ['temp', 5], ['moons', 5]],
    5: [['temp', 6], ['g', 6], ['year', 6]], 6: [['day', 7], ['year', 7], ['dist', 8]] };
  function linePick(mode, n, apart) { for (let tr = 0; tr < 40; tr++) { const got = linePick1(mode, n, apart); if (got.length >= n || tr === 39) return got; } }   /* a few shuffles until n fit */
  function linePick1(mode, n, apart) { const out = [], f = LINE[mode]; for (const id of shuffle(LINE_POOL[mode])) { if (out.length >= n) break; if (out.every(o => apart ? Math.max(f(o), f(id)) / Math.min(f(o), f(id)) >= apart : Math.abs(f(o) - f(id)) > 1e-6)) out.push(id); } return out; }   /* never two equal values; for the youngest, sizes far enough apart to see (Venus and Earth are 5% apart) */
  STAGES.sp_lineup = function (c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2 }; let objs = [], tabs = [], hits = [];
    function clear() { for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } for (const o of objs.splice(0)) scene.remove(o); hits = []; K.tray(null); K.pointer = null; }
    async function round(i, n, kick) { clear(); const [mode, cnt] = LINE_PLAN[S.band][i], lv = lvOf(S.band), ids = linePick(mode, cnt, lv === 1 ? 1.3 : 0), nar = K.narrow(), f = LINE[mode], right = ids.slice().sort((a, b) => f(a) - f(b));
      const cols = nar ? Math.min(lv === 1 ? 2 : 4, cnt) : cnt, rowsP = Math.ceil(cnt / cols), stepX = lv === 1 ? (nar ? 3.0 : Math.min(3.6, 15 / cnt)) : nar ? 2.15 : Math.min(2.2, 15 / cnt), size = id => lv === 1 ? (0.9 + 2.3 * Math.sqrt(AT_D[id].diam / 142984)) * (nar ? 0.8 : 1) : (nar ? 1.5 : Math.min(1.6, stepX * 0.75));   /* 4–7: drawn at their true sizes (square-root scale) */
      const at = (k, top) => { const col = k % cols, row = Math.floor(k / cols); return new T.Vector3((col - (cols - 1) / 2) * stepX, top ? (nar ? 4.6 - row * 2.6 : 2.4) : (nar ? -0.6 - row * 2.2 - (rowsP - 1) * 0.6 : -1.9), 0); };
      const slots = []; for (let k = 0; k < cnt; k++) { const p = at(k, false), ring = new T.Mesh(new T.TorusGeometry(0.8, 0.05, 8, 40), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.55 })); ring.position.copy(p); scene.add(ring); objs.push(ring);
        const nb = c.label(String(k + 1), -1, 0.3); nb.position.set(p.x - 0.95, p.y + 0.75, 0.05); scene.add(nb); tabs.push(nb); slots.push({ p, id: null }); }
      const items = {}; shuffle(ids).forEach((id, k) => { const home = at(k, true), sp = plateSprite(id, size(id), 0); sp.position.copy(home); scene.add(sp); objs.push(sp);
        const hit = new T.Mesh(new T.SphereGeometry(0.85, 10, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.copy(home); hit.userData.id = id; scene.add(hit); objs.push(hit); hits.push(hit);
        const nm = c.label(atName(id), -1, 0.36); nm.position.set(home.x, home.y - 1.0, 0.05); scene.add(nm); tabs.push(nm); let tag = null;
        if (lv > 1) { tag = c.label(atTag(LINE_TAG[mode], id), -1, 0.4); tag.position.set(home.x, home.y - 1.42, 0.05); scene.add(tag); tabs.push(tag); }
        items[id] = { sp, hit, nm, tag, home, slot: -1 }; });
      S.right = right; S.hits = hits;   /* for the tests */
      K.tell(kick, t('lu_' + mode)); K.hint(() => K.tell(kick, t('lu_' + mode) + ' ' + t('lu_hint')));
      const place = (id, to) => { const it = items[id], a = it.sp.position.clone(), b = to.clone(), d = [it.nm, it.tag].filter(Boolean).map(x => x.position.clone());
        return K.anim(0.45, k => { const e = K.ease(k); it.sp.position.lerpVectors(a, b, e); it.sp.position.y += Math.sin(PI * k) * 0.8; it.hit.position.copy(it.sp.position); [it.nm, it.tag].filter(Boolean).forEach((x, j) => { x.position.lerpVectors(d[j], b.clone().add(new T.Vector3(0, j ? -1.42 : -1.0, 0.05)), e); }); }); };
      for (;;) { const filled = slots.filter(s2 => s2.id).length;
        const act = await new Promise(res => { K.pointer = { down(e) { const h = K.hit(e, hits); if (!h) return false; K.pointer = null; K.tray(null); res({ id: h.object.userData.id }); return true; }, cursor: () => 'pointer' };
          const tr = []; if (filled) tr.push({ text: t('lu_undo') }); if (filled === cnt) tr.push({ text: t('lu_check') }); K.tray(tr.length ? tr : null, j => { K.pointer = null; K.tray(null); res({ btn: tr[j].text }); }); });
        if (!K.alive()) return null;
        if (act.btn === t('lu_check')) break;
        if (act.btn === t('lu_undo')) { const last = slots.slice().reverse().find(s2 => s2.id), lid = last.id; last.id = null; items[lid].slot = -1; await place(lid, items[lid].home); continue; }
        const it = items[act.id]; if (it.slot >= 0) continue; const k = slots.findIndex(s2 => !s2.id); if (k < 0) continue; slots[k].id = act.id; it.slot = k; K.sfx('tap'); await place(act.id, slots[k].p); }
      let nRight = 0; slots.forEach((s2, k) => { const ok = s2.id === right[k]; if (ok) nRight++; const it = items[s2.id];
        if (!it.tag) { it.tag = c.label(atTag(LINE_TAG[mode], s2.id), -1, 0.4); scene.add(it.tag); tabs.push(it.tag); } it.tag.position.set(s2.p.x, s2.p.y - 1.42, 0.05); try { it.tag.userData.tablet.setState(ok ? 'right' : 'wrong'); } catch (e) {} });
      K.sfx(nRight === cnt ? 'correct' : 'wrong'); if (nRight === cnt) slots.forEach(s2 => c.burst(s2.p.clone(), 0xffd27a, 8));
      ids.forEach(id => atFind(id, nRight === cnt)); K.tell(kick, nRight === cnt ? t('lu_all', { n: cnt }) : t('lu_some', { k: nRight, n: cnt }) + ' ' + t('lu_right', { list: right.map(atName).join(' · ') })); K.hint(null);
      await K.act(t('lu_next')); return { nRight, cnt }; }
    async function play(api) { K.mount(api); S.band = clamp(api.band || 2, 1, 6); window.__lineup = { S }; const N = 3, done = []; let pts = 0; api.pips(N, done);
      const nm = t('sp_lineup'); await K.intro(async () => { K.tell(nm, t('lu_hi')); await K.act(t('lu_start')); }); if (!K.alive()) return;
      for (let i = 0; i < N; i++) { const r = await round(i, N, t('lu_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r.nRight === r.cnt ? 20 : Math.round(10 * r.nRight / r.cnt); done.push(r.nRight === r.cnt); api.pips(N, done); }
      clear(); const right = done.filter(Boolean).length; K.tell(nm, t('lu_win')); await K.wait(1.4);
      api.done({ stars: right === N ? 3 : right >= 2 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('lu_win') }); }
    function dispose() { K.dispose(); clear(); }
    return { dynamic: true, frame: hallFrame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose }; };

  /* the Space Atlas and Mission Control's data orders (2026-10-10) */
  Object.assign(STR.en, {"sa_name": "The Space Atlas", "sa_blurb": "Every world you visit, painted and explained", "at_title": "My Space Atlas", "at_count": "{n} of {m} worlds found", "at_how": "Fly the probe to a world in Mission Control to add it; three right landings earn its gold seal.", "at_f_all": "All", "at_f_planet": "Planets", "at_f_moon": "Moons", "at_f_dwarf": "Dwarf planets", "at_k_planet": "Planet", "at_k_moon": "Moon", "at_k_dwarf": "Dwarf planet", "at_plate": "Plate {n}", "at_unknown": "???", "at_clue": "Clue:", "at_seal": "Gold seal", "at_close": "Close", "at_back": "All worlds", "at_prev": "Previous", "at_next": "Next", "at_painted": "painted from spacecraft pictures", "at_size": "Size", "at_from": "From the Sun", "at_fromE": "From Earth", "at_day": "A day", "at_year": "A year", "at_moons": "Moons", "at_grav": "Gravity", "at_sun1": "sunrise to sunrise", "at_orbit": "one trip round the Sun", "at_orbitE": "one trip round Earth", "at_moonsNasa": "NASA, 2026: more are still being found", "at_earth98": "Earth: 9.8", "at_powers": "Three superpowers", "at_missions": "Missions", "at_lab": "Lab note", "at_r_mass": "Mass", "at_r_light": "Sunlight takes", "at_r_lightE": "Its light reaches Earth in", "at_r_esc": "Escape speed", "at_r_temp": "Average temperature", "at_r_dens": "Density", "at_r_rings": "Rings", "at_yes": "Yes", "at_no": "No", "at_src": "Numbers: NASA Planetary Fact Sheet. Moons: NASA, 2026.", "at_gas": "A giant has no ground: its gravity and temperature are measured at the cloud tops.", "at_new": "{p} joins your Space Atlas!", "at_n_moon": "The Moon", "at_in_moon": "the Moon", "at_n_pluto": "Pluto", "au_km": " km", "au_mkm": " million km", "au_h": " hours", "au_d": " Earth days", "au_y": " Earth years", "au_ms2": " m/s²", "au_kms": " km/s", "au_kgm3": " kg/m³", "au_earths": " Earths", "au_min": " min", "au_s": " s", "au_hr": " h", "au_kg": " kg", "au_ds": " days", "au_ys": " years", "tg_moons": "{n} moons", "tg_moon1": "One moon", "tg_moon0": "No moons", "tg_rings": "Rings", "tg_norings": "No rings", "mt_saturn": "Send the probe to the world whose day lasts less than 11 hours, and which has more moons than any other planet.", "mt_jupiter": "Find the world that has rings and is warmer than −120 °C.", "mt_mars": "Send the probe to a world that is smaller than Earth and colder than Earth.", "mt_venus": "Find the world that is almost Earth’s size, between 12,000 and 13,000 km across, and goes round the Sun faster than Earth.", "mt_neptune": "Send the probe to the world that pulls harder than Earth (more than 9.8 m/s²) and is colder than −150 °C.", "mt_uranus": "Find the world whose day lasts between 15 and 20 hours, and whose pull is weaker than Earth’s (less than 9.8 m/s²).", "mt_mercury": "Find the world with no moons that is not as hot as Venus.", "mt_earth": "Find the world whose day lasts between 23 and 25 hours, and that is warmer than freezing.", "mx_mars": "Signal check: sunlight takes about 12½ minutes to reach this world, and its gravity is 3.7 m/s², the same as Mercury’s. Light covers about 300,000 km every second. Where is the probe going?", "mx_saturn": "Signal check: sunlight takes about 80 minutes to reach this world. Light covers about 300,000 km every second. Where is the probe going?", "mx_jupiter": "Calendar check: a year here lasts almost 12 Earth years. Where is the probe going?", "mx_uranus": "Calendar check: a year here lasts about 84 Earth years. Where is the probe going?", "mx_neptune": "Signal check: sunlight takes more than 4 hours to reach this world. Light covers about 300,000 km every second. Where is the probe going?", "mx_venus": "On this world a scale shows about 91% of your Earth weight, and sunlight arrives in about 6 minutes. Where is the probe going?", "mx_mercury": "On this world a scale shows about 38% of your Earth weight, and sunlight arrives in about 3 minutes. Where is the probe going?", "mx_earth": "Signal check: sunlight takes about 8 minutes 20 seconds to reach this world. Where is the probe going?", "lm_title": "Landing math", "lm_rover": "The Curiosity rover has a mass of 899 kg. What would a scale on {p} show? Gravity there: {g} m/s². On Earth: 9.8.", "lm_earths": "How many Earths would fit side by side across {p}? {p} is {d} km across; Earth is 12,756 km.", "lm_yes": "Right! About {a}.", "lm_no": "Not quite: it is about {a}.", "lm_u_earths": "Earths"});
  Object.assign(STR.he, {"sa_name": "אטלס החלל", "sa_blurb": "כל עולם שמבקרים בו, מצויר ומוסבר", "at_title": "אטלס החלל שלי", "at_count": "נמצאו {n} מתוך {m} עולמות", "at_how": "מטיסים את הגשושית לעולם במרכז הבקרה כדי להוסיף אותו; שלוש נחיתות נכונות מזכות אותו בחותם זהב.", "at_f_all": "הכול", "at_f_planet": "כוכבי לכת", "at_f_moon": "ירחים", "at_f_dwarf": "כוכבי לכת ננסיים", "at_k_planet": "כוכב לכת", "at_k_moon": "ירח", "at_k_dwarf": "כוכב לכת ננסי", "at_plate": "לוח {n}", "at_unknown": "???", "at_clue": "רמז:", "at_seal": "חותם זהב", "at_close": "סגירה", "at_back": "כל העולמות", "at_prev": "הקודם", "at_next": "הבא", "at_painted": "צויר לפי תמונות של חלליות", "at_size": "גודל", "at_from": "מרחק מהשמש", "at_fromE": "מרחק מכדור הארץ", "at_day": "יום", "at_year": "שנה", "at_moons": "ירחים", "at_grav": "כוח משיכה", "at_sun1": "מזריחה עד זריחה", "at_orbit": "סיבוב אחד סביב השמש", "at_orbitE": "סיבוב אחד סביב כדור הארץ", "at_moonsNasa": "נאס״א, 2026: עוד ירחים מתגלים", "at_earth98": "כדור הארץ: 9.8", "at_powers": "שלושה כוחות על", "at_missions": "משימות", "at_lab": "פתק מהמעבדה", "at_r_mass": "מסה", "at_r_light": "אור השמש מגיע בתוך", "at_r_lightE": "האור ממנו מגיע לכדור הארץ בתוך", "at_r_esc": "מהירות מילוט", "at_r_temp": "טמפרטורה ממוצעת", "at_r_dens": "צפיפות", "at_r_rings": "טבעות", "at_yes": "יש", "at_no": "אין", "at_src": "המספרים: דף הנתונים של נאס״א על כוכבי הלכת. ירחים: נאס״א, 2026.", "at_gas": "לענק אין קרקע: כוח המשיכה והטמפרטורה נמדדים בראש העננים.", "at_new": "הוספנו את {p} לאטלס החלל שלכם!", "at_n_moon": "הירח", "at_in_moon": "הירח", "at_n_pluto": "פלוטו", "au_km": " ק״מ", "au_mkm": " מיליון ק״מ", "au_h": " שעות", "au_d": " ימי ארץ", "au_y": " שנות ארץ", "au_ms2": " מ׳/שנ׳²", "au_kms": " ק״מ/שנ׳", "au_kgm3": " ק״ג/מ״ק", "au_earths": " כדורי ארץ", "au_min": " דק׳", "au_s": " שנ׳", "au_hr": " שע׳", "au_kg": " ק״ג", "au_ds": " ימים", "au_ys": " שנים", "tg_moons": "{n} ירחים", "tg_moon1": "ירח אחד", "tg_moon0": "אין ירחים", "tg_rings": "יש טבעות", "tg_norings": "אין טבעות", "mt_saturn": "שולחים את הגשושית לעולם שבו יום נמשך פחות מ־11 שעות, ושיש לו יותר ירחים מכל כוכב לכת אחר.", "mt_jupiter": "מוצאים את העולם שיש לו טבעות, ושחם בו יותר מ־120 מעלות מתחת לאפס.", "mt_mars": "שולחים את הגשושית לעולם שקטן מכדור הארץ, וגם קר ממנו.", "mt_venus": "מוצאים את העולם שכמעט בגודל של כדור הארץ, בין 12,000 ל־13,000 ק״מ לרוחבו, ומקיף את השמש מהר יותר מכדור הארץ.", "mt_neptune": "שולחים את הגשושית לעולם שכוח המשיכה שלו חזק משל כדור הארץ (יותר מ־9.8 מ׳/שנ׳²), ושקר בו יותר מ־150 מעלות מתחת לאפס.", "mt_uranus": "מוצאים את העולם שבו יום נמשך בין 15 ל־20 שעות, וכוח המשיכה שלו חלש משל כדור הארץ (פחות מ־9.8 מ׳/שנ׳²).", "mt_mercury": "מוצאים את העולם שאין לו ירחים, ושהוא פחות חם מנוגה.", "mt_earth": "מוצאים את העולם שבו יום נמשך בין 23 ל־25 שעות, ושחם בו יותר מנקודת הקיפאון.", "mx_mars": "בדיקת אות: אור השמש מגיע לעולם הזה בתוך כ־12 וחצי דקות, וכוח המשיכה בו 3.7 מ׳/שנ׳², כמו בכוכב חמה. האור עובר כ־300,000 ק״מ בכל שנייה. לאן טסה הגשושית?", "mx_saturn": "בדיקת אות: אור השמש מגיע לעולם הזה בתוך כ־80 דקות. האור עובר כ־300,000 ק״מ בכל שנייה. לאן טסה הגשושית?", "mx_jupiter": "בדיקת לוח שנה: שנה כאן נמשכת כמעט 12 שנות ארץ. לאן טסה הגשושית?", "mx_uranus": "בדיקת לוח שנה: שנה כאן נמשכת כ־84 שנות ארץ. לאן טסה הגשושית?", "mx_neptune": "בדיקת אות: אור השמש מגיע לעולם הזה אחרי יותר מ־4 שעות. האור עובר כ־300,000 ק״מ בכל שנייה. לאן טסה הגשושית?", "mx_venus": "בעולם הזה משקל מראה בערך 91% מהמשקל שלכם על כדור הארץ, ואור השמש מגיע בתוך כ־6 דקות. לאן טסה הגשושית?", "mx_mercury": "בעולם הזה משקל מראה בערך 38% מהמשקל שלכם על כדור הארץ, ואור השמש מגיע בתוך כ־3 דקות. לאן טסה הגשושית?", "mx_earth": "בדיקת אות: אור השמש מגיע לעולם הזה בתוך כ־8 דקות ו־20 שניות. לאן טסה הגשושית?", "lm_title": "חשבון נחיתה", "lm_rover": "המסה של הרכב קיוריוסיטי היא 899 ק״ג. מה יראה משקל על {p}? כוח המשיכה שם: {g} מ׳/שנ׳². על כדור הארץ: 9.8.", "lm_earths": "כמה כדורי ארץ היו נכנסים זה לצד זה לרוחב {p}? הרוחב של {p} הוא {d} ק״מ; של כדור הארץ 12,756 ק״מ.", "lm_yes": "נכון! בערך {a}.", "lm_no": "לא בדיוק: זה בערך {a}.", "lm_u_earths": "כדורי ארץ"});

  /* the Atlas games (Space step 2, 2026-10-10) */
  Object.assign(STR.en, {"sp_whoami": "Who Am I?", "sp_whoami_b": "Read the clues and name the hidden world", "sp_gravity": "Weigh-in & Jump", "sp_gravity_b": "Your weight and your jump on every world", "sp_lineup": "Line Them Up", "sp_lineup_b": "Put the worlds in order: size, distance, heat", "wh_hi": "A world is hiding in the mist. Read the clues and say which world it is. The fewer clues you need, the more points.", "wh_start": "Begin", "wh_n": "Mystery world {i} of {n}", "wh_more": "Another clue", "wh_no": "Not {p}.", "wh_yes": "Yes! It is {p}.", "wh_next": "Next world", "wh_win": "Every mystery solved!", "wh_hint": "Need help? Ask for another clue.", "lk_mercury": "Grey rock, covered in craters.", "lk_venus": "Thick yellow clouds hide the ground.", "lk_earth": "Blue oceans, green and brown land, white clouds.", "lk_mars": "Rusty red, with white ice at the top.", "lk_jupiter": "Stripes of cream and brown, and a big red spot.", "lk_saturn": "Wide, bright rings all around it.", "lk_uranus": "Pale blue-green, with rings standing upright.", "lk_neptune": "Deep blue, with a dark storm spot.", "lk_moon": "Grey with dark patches, and it goes round the Earth.", "lk_pluto": "Small and icy, with a big pale heart.", "wc_year": "A year here lasts {v}.", "wc_day": "A day here lasts {v}.", "wc_temp": "The average temperature here is {v}.", "wc_moons": "Moons: {n}.", "wc_g": "Gravity here is {v}.", "wc_dist": "It is {v} from the Sun.", "wc_distE": "It is {v} from Earth.", "wc_diam": "It is {v} across.", "gv_hi": "Every world pulls on you differently. Find out what a scale would show there, and how high you can jump!", "gv_start": "Begin", "gv_n": "World {i} of {n}", "gv_q1": "On {p}, will the scale show less or more than on Earth?", "gv_less": "Less", "gv_more": "More", "gv_qw": "On Earth the scale shows {w} kg. What will it show on {p}?", "gv_qj": "On Earth you jump 40 cm high. How high will you jump on {p}?", "gv_g": "Gravity on {p}: {g} m/s². On Earth: 9.8.", "gv_yes": "Right!", "gv_no": "Not quite.", "gv_show": "On {p} the scale shows {w}, and a 40 cm jump becomes {h}.", "gv_gas": "There is no ground on {p}: these numbers are for the cloud tops.", "gv_next": "Next world", "gv_win": "You have jumped on every world!", "gv_cm": " cm", "gv_m": " m", "lu_hi": "Tap the worlds one by one to put them into the numbered places below, then check your line.", "lu_start": "Begin", "lu_n": "Line {i} of {n}", "lu_size": "Line them up by size: the smallest first.", "lu_dist": "Line them up by distance from the Sun: the nearest first.", "lu_temp": "Line them up by average temperature: the coldest first.", "lu_moons": "Line them up by number of moons: the fewest first.", "lu_g": "Line them up by gravity: the weakest pull first.", "lu_year": "Line them up by the length of a year: the shortest first. Careful: some are in days, some in years.", "lu_day": "Line them up by the length of a day: the shortest first. Careful: some are in hours, some in days.", "lu_hint": "Compare two at a time.", "lu_check": "Check my line", "lu_undo": "Take back", "lu_all": "All {n} in the right place!", "lu_some": "{k} of {n} in the right place.", "lu_right": "The right order: {list}.", "lu_next": "Next line", "lu_win": "Every line done!"});
  Object.assign(STR.he, {"sp_whoami": "מי אני?", "sp_whoami_b": "קוראים את הרמזים ומגלים איזה עולם מתחבא", "sp_gravity": "שוקלים וקופצים", "sp_gravity_b": "כמה תשקלו וכמה גבוה תקפצו בכל עולם", "sp_lineup": "מסדרים בשורה", "sp_lineup_b": "מסדרים את העולמות לפי גודל, מרחק וחום", "wh_hi": "עולם מתחבא בערפל. קוראים את הרמזים ואומרים איזה עולם זה. ככל שצריכים פחות רמזים, מקבלים יותר נקודות.", "wh_start": "מתחילים", "wh_n": "עולם מסתורי {i} מתוך {n}", "wh_more": "עוד רמז", "wh_no": "זה לא {p}.", "wh_yes": "נכון! זה {p}.", "wh_next": "לעולם הבא", "wh_win": "כל התעלומות נפתרו!", "wh_hint": "צריכים עזרה? אפשר לבקש עוד רמז.", "lk_mercury": "סלע אפור, מכוסה במכתשים.", "lk_venus": "עננים צהובים ועבים מסתירים את הקרקע.", "lk_earth": "אוקיינוסים כחולים, יבשה ירוקה וחומה, עננים לבנים.", "lk_mars": "אדום חלוד, עם קרח לבן למעלה.", "lk_jupiter": "פסים בצבעי שמנת וחום, וכתם אדום גדול.", "lk_saturn": "טבעות רחבות ובהירות מסביב.", "lk_uranus": "תכלת־ירקרק, עם טבעות שעומדות.", "lk_neptune": "כחול עמוק, עם כתם סערה כהה.", "lk_moon": "אפור עם כתמים כהים, והוא מקיף את כדור הארץ.", "lk_pluto": "קטן וקפוא, עם לב גדול ובהיר.", "wc_year": "שנה כאן נמשכת {v}.", "wc_day": "יום כאן נמשך {v}.", "wc_temp": "הטמפרטורה הממוצעת כאן: {v}.", "wc_moons": "מספר הירחים: {n}.", "wc_g": "כוח המשיכה כאן: {v}.", "wc_dist": "המרחק מהשמש: {v}.", "wc_distE": "המרחק מכדור הארץ: {v}.", "wc_diam": "הרוחב: {v}.", "gv_hi": "כל עולם מושך אתכם בכוח אחר. מגלים מה יראה המשקל שם, וכמה גבוה אפשר לקפוץ!", "gv_start": "מתחילים", "gv_n": "עולם {i} מתוך {n}", "gv_q1": "על {p}, המשקל יראה פחות או יותר מאשר על כדור הארץ?", "gv_less": "פחות", "gv_more": "יותר", "gv_qw": "על כדור הארץ המשקל מראה {w} ק״ג. מה הוא יראה על {p}?", "gv_qj": "על כדור הארץ אתם קופצים לגובה 40 ס״מ. לאיזה גובה תקפצו על {p}?", "gv_g": "כוח המשיכה על {p}: {g} מ׳/שנ׳². על כדור הארץ: 9.8.", "gv_yes": "נכון!", "gv_no": "לא בדיוק.", "gv_show": "על {p} המשקל מראה {w}, וקפיצה של 40 ס״מ הופכת ל־{h}.", "gv_gas": "אין קרקע על {p}: המספרים האלה הם בראש העננים.", "gv_next": "לעולם הבא", "gv_win": "קפצתם על כל העולמות!", "gv_cm": " ס״מ", "gv_m": " מ׳", "lu_hi": "לוחצים על העולמות אחד אחד כדי לשים אותם במקומות הממוספרים למטה, ואז בודקים את השורה.", "lu_start": "מתחילים", "lu_n": "שורה {i} מתוך {n}", "lu_size": "מסדרים לפי גודל: הקטן ביותר ראשון.", "lu_dist": "מסדרים לפי המרחק מהשמש: הקרוב ביותר ראשון.", "lu_temp": "מסדרים לפי הטמפרטורה הממוצעת: הקר ביותר ראשון.", "lu_moons": "מסדרים לפי מספר הירחים: הכי מעט ראשון.", "lu_g": "מסדרים לפי כוח המשיכה: החלש ביותר ראשון.", "lu_year": "מסדרים לפי אורך השנה: הקצרה ביותר ראשונה. שימו לב: חלק בימים וחלק בשנים.", "lu_day": "מסדרים לפי אורך היום: הקצר ביותר ראשון. שימו לב: חלק בשעות וחלק בימים.", "lu_hint": "משווים שניים בכל פעם.", "lu_check": "בודקים את השורה", "lu_undo": "מחזירים", "lu_all": "כל ה־{n} במקום הנכון!", "lu_some": "{k} מתוך {n} במקום הנכון.", "lu_right": "הסדר הנכון: {list}.", "lu_next": "לשורה הבאה", "lu_win": "כל השורות סודרו!"});

  KQRealms.define('space', {
    games: [
      { id: 'sp_blackhole', kind: 'logic', stage: 'sp_light', theme: 'sp_lightverse', icon: 'alien', custom: true,
        before(go) { if (window.KQRide) KQRide.play({ to: 'blackhole', dir: 'down', text: t('bh_note') }, () => go()); else go(); } },
      { id: 'sp_stars', kind: 'math', stage: 'sp_stars', theme: 'sp_observatory', icon: 'glowstar', custom: true },
      { id: 'sp_mission', kind: 'reading', stage: 'sp_mission', theme: 'sp_system', icon: 'rocket', custom: true },
      { id: 'sp_spell', kind: 'spelling', stage: 'sp_spell', theme: 'sp_belt', icon: 'comet', custom: true },
      { id: 'sp_whoami', kind: 'reading', stage: 'sp_whoami', theme: 'sp_mystery', icon: 'magnifier', custom: true },
      { id: 'sp_gravity', kind: 'math', stage: 'sp_gravity', theme: 'sp_gravity', icon: 'scale', custom: true },
      { id: 'sp_lineup', kind: 'logic', stage: 'sp_lineup', theme: 'sp_lineup', icon: 'ruler', custom: true }
    ],
    strings: STR, themes: THEMES, stages: STAGES, landmarks,
    gens: {}
  });
  window.__space = { bhMat, songFor, atlas: { D: AT_D, T: AT_T, stat: atStat, TWO, CALC, missionsFor } };   /* test hook */
})();
