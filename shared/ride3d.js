/* Kingdom Quest — the ways into the underworld (and back up). Each underworld realm has its OWN entrance:
     Pirate Cove     → THE MAELSTROM. You stand at the bow of a pirate ship in a night storm: rain, lightning over the clouds, a
                       ship's bell. The sea begins to turn, a whirlpool opens, and the ship is dragged around and down its funnel of
                       water — barrels and planks circling with you, a ghostly pirate swooping past the bowsprit, a kraken arm
                       rising out of the wall of water — until it tips over the edge into the glowing eye of the cove.
                       Going up, the sea spits the ship back out of the eye and the whirlpool closes behind it under a calm dawn.
     Skull Catacombs → THE CRYPT. A moonlit graveyard, tombstones in the fog, a mausoleum with a carved skull whose iron doors creak
                       open on a green glow. Inside, a spiral stair winds down an ossuary: walls of stacked skulls and bones, candles
                       that light themselves as you pass, skulls that turn to watch you, a skeleton hand waving from a niche, a ghost
                       knight drifting through the shaft, bats fluttering up past you — down to a gate of bones that swings open on
                       the green-lit necropolis. Going up, you climb out and the candles go out behind you.
   KQRide.play({ to, from, dir: 'down'|'up', text }, done). Spooky-fun, never pure darkness; every sound is synthesised live with
   WebAudio (no recorded files). Tap anywhere to skip after the first moments. three.js r160 core + fx3d.js (compositor).
   Test hook: window.__ride { step(), seek(t), finish(), scene, camera, t, realm, up }. */
(function () {
  'use strict';
  const T = window.THREE; if (!T) return;
  const PI = Math.PI, TAU = PI * 2, R = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const UP = new T.Vector3(0, 1, 0);

  /* ================================================================== painted surfaces (canvas, no downloads) */
  function canvas(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); return c; }
  function tex(c, rx, ry) { const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || rx || 1); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
  function softTex() { return new T.CanvasTexture(canvas(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); })); }
  function stoneCanvas(base, blocks) {
    return canvas(256, 256, (x, w, h) => {
      x.fillStyle = base; x.fillRect(0, 0, w, h); const rows = 8, rh = h / rows;
      for (let r = 0; r < rows; r++) { const off = (r % 2) * 32; for (let c = -1; c < 5; c++) { x.fillStyle = blocks[(r * 7 + c * 3 + 9) % blocks.length]; x.globalAlpha = 0.5; x.fillRect(c * 64 + off + 2, r * rh + 2, 60, rh - 4); } }
      x.globalAlpha = 1; x.strokeStyle = 'rgba(8,6,5,0.8)'; x.lineWidth = 3;
      for (let r = 0; r <= rows; r++) { x.beginPath(); x.moveTo(0, r * rh); x.lineTo(w, r * rh); x.stroke(); }
      for (let r = 0; r < rows; r++) { const off = (r % 2) * 32; for (let c = 0; c <= 4; c++) { x.beginPath(); x.moveTo(c * 64 + off, r * rh); x.lineTo(c * 64 + off, (r + 1) * rh); x.stroke(); } }
      for (let i = 0; i < 2600; i++) { x.fillStyle = Math.random() < 0.55 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.07)'; x.fillRect(Math.random() * w, Math.random() * h, R(1, 3), R(1, 3)); }
      for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(10,8,6,0.5)'; x.lineWidth = R(0.6, 1.6); x.beginPath(); let px = R(0, w), py = R(0, h); x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += R(-14, 14); py += R(-10, 10); x.lineTo(px, py); } x.stroke(); }
    });
  }
  function plankCanvas() {
    return canvas(256, 256, (x, w, h) => {
      const n = 8, pw = w / n;
      for (let i = 0; i < n; i++) {
        x.fillStyle = ['#6b4526', '#5e3c21', '#744c2b', '#654022'][i % 4]; x.fillRect(i * pw, 0, pw, h);
        x.strokeStyle = 'rgba(30,18,8,0.45)'; for (let k = 0; k < 7; k++) { x.lineWidth = R(0.6, 1.4); x.beginPath(); const xx = i * pw + R(3, pw - 3); x.moveTo(xx, 0); x.bezierCurveTo(xx + R(-4, 4), h * 0.3, xx + R(-4, 4), h * 0.7, xx + R(-3, 3), h); x.stroke(); }
        x.fillStyle = 'rgba(18,10,4,0.9)'; x.fillRect(i * pw, 0, 2, h); const cut = R(40, 200); x.fillRect(i * pw, cut, pw, 2);
        x.fillStyle = 'rgba(210,190,150,0.55)'; for (const yy of [cut - 8, cut + 8]) { x.beginPath(); x.arc(i * pw + 6, yy, 1.6, 0, TAU); x.arc(i * pw + pw - 6, yy, 1.6, 0, TAU); x.fill(); }
      }
    });
  }
  /* sea water with long foam streaks: the streaks run around the whirlpool, so the swirl shears them into spirals */
  function foamCanvas() {
    return canvas(512, 256, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#174553'); g.addColorStop(0.5, '#0f3442'); g.addColorStop(1, '#174553'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${R(10, 30) | 0},${R(60, 95) | 0},${R(80, 115) | 0},0.35)`; x.beginPath(); x.ellipse(R(0, w), R(0, h), R(20, 90), R(4, 14), 0, 0, TAU); x.fill(); }
      for (let i = 0; i < 280; i++) { const y = R(0, h), x0 = R(0, w), len = R(40, 260), a = R(0.25, 0.85), lw = R(0.8, 3.2), d1 = R(-6, 6), d2 = R(-6, 6), d3 = R(-4, 4);
        x.strokeStyle = `rgba(226,243,246,${a})`; x.lineWidth = lw;
        for (const off of [0, -w]) { x.beginPath(); x.moveTo(x0 + off, y); x.bezierCurveTo(x0 + off + len * 0.3, y + d1, x0 + off + len * 0.7, y + d2, x0 + off + len, y + d3); x.stroke(); } }
    });
  }
  function stormCanvas() {
    return canvas(1024, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#07090e'); g.addColorStop(0.4, '#18202a'); g.addColorStop(0.5, '#2e3a46'); g.addColorStop(0.53, '#0c1218'); g.addColorStop(1, '#05080b'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 760; i++) { const y = R(0.04, 0.5) * h, rr = R(18, 110) * (1 - y / h * 0.7), px = R(0, w), light = Math.random() > 0.72;
        x.fillStyle = light ? `rgba(${R(58, 92) | 0},${R(68, 102) | 0},${R(86, 122) | 0},${R(0.07, 0.2)})` : `rgba(${R(12, 28) | 0},${R(16, 32) | 0},${R(24, 42) | 0},${R(0.25, 0.6)})`;
        for (const off of [0, -w, w]) { x.beginPath(); x.ellipse(px + off, y, rr * 1.9, rr * 0.55, 0, 0, TAU); x.fill(); } }
      const mg = x.createRadialGradient(w * 0.72, h * 0.2, 0, w * 0.72, h * 0.2, 130); mg.addColorStop(0, 'rgba(214,228,255,0.6)'); mg.addColorStop(1, 'rgba(214,228,255,0)'); x.fillStyle = mg; x.fillRect(0, 0, w, h);
    });
  }
  function nightCanvas() {
    return canvas(1024, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05070f'); g.addColorStop(0.36, '#10182c'); g.addColorStop(0.5, '#2a3350'); g.addColorStop(0.52, '#0a0d14'); g.addColorStop(1, '#040507'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { const y = Math.pow(Math.random(), 1.4) * h * 0.48; x.fillStyle = `rgba(255,${R(235, 255) | 0},${R(220, 255) | 0},${R(0.25, 0.95)})`; const s = Math.random() < 0.06 ? 2 : 1; x.fillRect(R(0, w), y, s, s); }
      for (let i = 0; i < 40; i++) { const y = R(0.3, 0.5) * h, px = R(0, w); x.fillStyle = `rgba(40,50,72,${R(0.2, 0.45)})`; for (const off of [0, -w, w]) { x.beginPath(); x.ellipse(px + off, y, R(60, 160), R(6, 16), 0, 0, TAU); x.fill(); } }
    });
  }
  function grassCanvas() {
    return canvas(256, 256, (x, w, h) => {
      x.fillStyle = '#1a2318'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${R(34, 54) | 0},${R(30, 42) | 0},${R(22, 30) | 0},0.5)`; x.beginPath(); x.ellipse(R(0, w), R(0, h), R(8, 30), R(6, 20), R(0, 3), 0, TAU); x.fill(); }
      for (let i = 0; i < 2400; i++) { const px = R(0, w), py = R(0, h); x.strokeStyle = `rgba(${R(40, 80) | 0},${R(62, 104) | 0},${R(40, 62) | 0},${R(0.3, 0.8)})`; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + R(-2, 2), py - R(3, 7)); x.stroke(); }
    });
  }
  function shaftCanvas(rgb) { return canvas(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.35, `rgba(${rgb},0.55)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, w, h); const g2 = x.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = g2; x.fillRect(0, 0, w, h); }); }

  /* ================================================================== merged vertex-coloured props */
  function merge(parts) { let n = 0; const list = []; for (const p of parts) { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); g.applyMatrix4(p.m); list.push({ g, c: p.c }); n += g.attributes.position.count; } const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0; for (const { g, c } of list) { const k = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); for (let i = 0; i < k; i++) { C[(o + i) * 3] = c.r; C[(o + i) * 3 + 1] = c.g; C[(o + i) * 3 + 2] = c.b; } o += k; g.dispose(); } const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(P, 3)); out.setAttribute('normal', new T.BufferAttribute(N, 3)); out.setAttribute('color', new T.BufferAttribute(C, 3)); return out; }
  const M4 = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx || 1, sy || sx || 1, sz || sx || 1));
  /* a skull facing +z (lo = the light version for the ossuary walls) */
  function skullGeo(lo, boneHex) { const bone = new T.Color(boneHex || 0xeee4cc), dark = new T.Color(0x100806), parts = [], s = lo ? [9, 7] : [18, 14]; parts.push({ g: new T.SphereGeometry(0.5, s[0], s[1]), m: M4(0, 0.12, -0.02, 0, 0, 0, 1, 0.95, 1.08), c: bone }); parts.push({ g: new T.CylinderGeometry(0.31, 0.25, 0.3, lo ? 8 : 16), m: M4(0, -0.24, 0.12), c: bone }); for (const sd of [-1, 1]) parts.push({ g: new T.SphereGeometry(0.14, lo ? 7 : 12, lo ? 5 : 8), m: M4(sd * 0.18, 0.05, 0.43, 0, 0, 0, 1, 1.15, 0.55), c: dark }); parts.push({ g: new T.ConeGeometry(0.06, 0.13, 3), m: M4(0, -0.1, 0.49, PI, 0, 0), c: dark }); if (!lo) for (let i = 0; i < 6; i++) parts.push({ g: new T.BoxGeometry(0.05, 0.08, 0.05), m: M4(-0.14 + i * 0.056, -0.27, 0.36), c: bone }); return merge(parts); }
  /* a femur lying along x */
  function femurGeo() { const bone = new T.Color(0xe0d3b4), parts = [{ g: new T.CylinderGeometry(0.055, 0.05, 0.78, 7), m: M4(0, 0, 0, 0, 0, PI / 2), c: bone }]; for (const sd of [-1, 1]) for (const dz of [-0.05, 0.05]) parts.push({ g: new T.SphereGeometry(0.075, 7, 5), m: M4(sd * 0.4, 0, dz), c: bone }); return merge(parts); }
  function barrelGeo() { const wood = new T.Color(0x7a5230), iron = new T.Color(0x2e2a26), parts = []; parts.push({ g: new T.LatheGeometry([[0.001, -0.55], [0.36, -0.55], [0.44, -0.3], [0.47, 0], [0.44, 0.3], [0.36, 0.55], [0.001, 0.55]].map(p => new T.Vector2(p[0], p[1])), 14), m: M4(0, 0, 0), c: wood }); for (const y of [-0.4, 0.4]) parts.push({ g: new T.TorusGeometry(0.44, 0.03, 4, 18), m: M4(0, y, 0, PI / 2, 0, 0), c: iron }); return merge(parts); }
  function chestGeo() { const wood = new T.Color(0x6a3e1e), gold = new T.Color(0xe8b64a), parts = []; parts.push({ g: new T.BoxGeometry(1.1, 0.6, 0.7), m: M4(0, 0, 0), c: wood }); parts.push({ g: new T.CylinderGeometry(0.35, 0.35, 1.1, 12, 1, false, 0, PI), m: M4(0, 0.3, 0, 0, 0, PI / 2), c: wood }); for (const x of [-0.4, 0.4]) parts.push({ g: new T.BoxGeometry(0.08, 0.66, 0.74), m: M4(x, 0, 0), c: gold }); for (let i = 0; i < 7; i++) parts.push({ g: new T.CylinderGeometry(0.09, 0.09, 0.03, 10), m: M4(R(-0.4, 0.4), 0.55 + R(0, 0.1), R(-0.2, 0.2), R(-0.6, 0.6), 0, R(-0.6, 0.6)), c: gold }); return merge(parts); }
  function plankGeo() { return merge([{ g: new T.BoxGeometry(2.4, 0.12, 0.34), m: M4(0, 0, 0), c: new T.Color(0x5e3c22) }, { g: new T.BoxGeometry(0.4, 0.13, 0.35), m: M4(0.6, 0.01, 0), c: new T.Color(0x4a2e18) }]); }
  function tombGeo() { const stone = new T.Color(0x6a6a6e), dark = new T.Color(0x4a4a50), parts = []; parts.push({ g: new T.BoxGeometry(0.9, 1.0, 0.2), m: M4(0, 0.5, 0), c: stone }); const top = new T.CylinderGeometry(0.45, 0.45, 0.2, 14, 1, false, 0, PI); top.rotateX(PI / 2); top.rotateZ(PI / 2); parts.push({ g: top, m: M4(0, 1.0, 0), c: stone }); parts.push({ g: new T.BoxGeometry(1.1, 0.16, 0.4), m: M4(0, 0.06, 0), c: dark }); parts.push({ g: new T.BoxGeometry(0.1, 0.4, 0.03), m: M4(0, 0.85, 0.11), c: dark }); parts.push({ g: new T.BoxGeometry(0.3, 0.1, 0.03), m: M4(0, 0.9, 0.11), c: dark }); return merge(parts); }

  /* bats: a body, two scalloped wings, red eyes */
  function makeBats(scene, n) {
    const bm = new T.MeshStandardMaterial({ color: 0x1a1418, roughness: 0.6, side: T.DoubleSide }), eyeM = new T.MeshBasicMaterial({ color: new T.Color(2.2, 0.5, 0.4) });
    const wg = new T.Shape(); wg.moveTo(0, 0); wg.quadraticCurveTo(0.35, 0.3, 0.7, 0.12); wg.lineTo(0.55, 0.0); wg.lineTo(0.62, -0.12); wg.lineTo(0.42, -0.06); wg.lineTo(0.3, -0.16); wg.lineTo(0.12, -0.06); wg.closePath(); const wgeo = new T.ShapeGeometry(wg);
    const bats = []; for (let i = 0; i < n; i++) { const b = new T.Group(); const body = new T.Mesh(new T.SphereGeometry(0.12, 10, 8), bm); body.scale.set(1, 1.3, 1); b.add(body); const ws = []; for (const s of [-1, 1]) { const w = new T.Mesh(wgeo, bm); w.scale.x = s; b.add(w); ws.push(w); } for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.025, 6, 4), eyeM); e.position.set(s * 0.05, 0.07, 0.1); b.add(e); } b.visible = false; scene.add(b); bats.push({ b, ws, k: R(0, 6) }); }
    return bats;
  }
  function flap(bat, t) { const fl = Math.sin(t * 38 + bat.k) * 0.9; bat.ws[0].rotation.y = fl; bat.ws[1].rotation.y = -fl; }

  /* ================================================================== live sound */
  function audioCore() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; let ctx; try { ctx = new AC(); } catch (e) { return null; }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {});
    const now = () => ctx.currentTime;
    const out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination); out.gain.linearRampToValueAtTime(0.6, now() + 0.8);
    const verb = ctx.createConvolver(); { const len = Math.floor(ctx.sampleRate * 2.8), b = ctx.createBuffer(2, len, ctx.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); } verb.buffer = b; }
    const wet = ctx.createGain(); wet.gain.value = 0; verb.connect(wet); wet.connect(out);
    const bus = ctx.createGain(); bus.connect(out); bus.connect(verb);
    const mk = (fn) => { const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0); fn(d); return b; };
    const brown = mk(d => { let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } });
    const white = mk(d => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
    function loop(o) { const s = ctx.createBufferSource(); s.buffer = o.white ? white : brown; s.loop = true; s.playbackRate.value = o.rate || 1; const f = ctx.createBiquadFilter(); f.type = o.type || 'lowpass'; f.frequency.value = o.freq || 400; f.Q.value = o.q || 0.7; const g = ctx.createGain(); g.gain.value = o.gain || 0; s.connect(f); f.connect(g); g.connect(bus); s.start(); return { set(gain, freq, tc) { const t = now(); g.gain.setTargetAtTime(Math.max(0, gain), t, tc || 0.25); if (freq != null) f.frequency.setTargetAtTime(freq, t, tc || 0.25); } }; }
    function burst(o) { const a = o.attack || 0.01, d = o.decay || 1, t = now() + (o.at || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = o.white ? white : brown; s.playbackRate.value = o.rate || 1; f.type = o.type || 'lowpass'; f.Q.value = o.q || 0.8; f.frequency.setValueAtTime(o.freq || 400, t); if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + a + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain || 0.3, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); s.connect(f); f.connect(g); g.connect(bus); s.start(t, R(0, 1)); s.stop(t + a + d + 0.1); }
    function tone(o) { const a = o.attack || 0.01, d = o.decay || 1, t = now() + (o.at || 0), osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.freq, t); if (o.freqTo) osc.frequency.exponentialRampToValueAtTime(o.freqTo, t + (o.glide || a + d)); if (o.vib) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = o.vib; vg.gain.value = o.vibDepth || 6; v.connect(vg); vg.connect(osc.frequency); v.start(t); v.stop(t + a + d + 0.2); } let node = osc; if (o.filter) { const f = ctx.createBiquadFilter(); f.type = o.filter; f.frequency.value = o.ffreq || 800; f.Q.value = o.fq || 1; osc.connect(f); node = f; } g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain || 0.1, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); g.connect(bus); osc.start(t); osc.stop(t + a + d + 0.1); }
    function pad(freqs, type, cutoff) { const g = ctx.createGain(); g.gain.value = 0; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff || 700; f.connect(g); g.connect(bus); for (const fr of freqs) { const o = ctx.createOscillator(); o.type = type || 'triangle'; o.frequency.value = fr; o.connect(f); o.start(); } return { set(v, tc) { g.gain.setTargetAtTime(Math.max(0, v), now(), tc || 0.8); } }; }
    return { loop, burst, tone, pad, wet(v) { wet.gain.setTargetAtTime(v, now(), 0.4); }, end() { try { out.gain.setTargetAtTime(0, now(), 0.25); setTimeout(() => ctx.close(), 1200); } catch (e) {} } };
  }
  const SND = {
    thunder(s) { s.burst({ type: 'lowpass', freq: 260, freqTo: 70, gain: 0.9, attack: 0.03, decay: 2.8, rate: 0.7 }); s.burst({ white: true, type: 'highpass', freq: 1800, gain: 0.22, attack: 0.005, decay: 0.3 }); },
    bell(s, at) { for (const [f, g, d] of [[523, 0.13, 2.6], [784, 0.05, 2.2], [1318, 0.06, 1.8], [2093, 0.035, 1.2]]) s.tone({ freq: f, gain: g, decay: d, at }); },
    creak(s) { s.tone({ type: 'sawtooth', freq: 74, freqTo: 56, glide: 0.8, gain: 0.05, attack: 0.08, decay: 0.8, filter: 'bandpass', ffreq: 520, fq: 6 }); },
    groan(s) { s.tone({ type: 'sawtooth', freq: 62, freqTo: 36, glide: 2.2, gain: 0.22, attack: 0.4, decay: 2.2, filter: 'lowpass', ffreq: 260, vib: 3, vibDepth: 3 }); s.burst({ type: 'lowpass', freq: 120, gain: 0.35, attack: 0.3, decay: 1.8 }); },
    splash(s) { s.burst({ white: true, type: 'lowpass', freq: 1500, freqTo: 380, gain: 0.3, attack: 0.02, decay: 0.9 }); },
    whoosh(s) { s.burst({ type: 'bandpass', freq: 300, freqTo: 2400, q: 1.2, gain: 0.5, attack: 0.4, decay: 1.1, rate: 2 }); },
    ghost(s) { s.tone({ freq: 410, freqTo: 250, glide: 1.7, gain: 0.14, attack: 0.3, decay: 1.6, vib: 6, vibDepth: 14, filter: 'lowpass', ffreq: 900 }); },
    squeak(s) { for (let i = 0; i < 6; i++) { const f = R(3200, 5200); s.tone({ freq: f, freqTo: f * 0.7, glide: 0.07, gain: 0.045, attack: 0.01, decay: 0.07, at: i * 0.09 }); } },
    doorCreak(s) { s.tone({ type: 'sawtooth', freq: 92, freqTo: 132, glide: 1.2, gain: 0.08, attack: 0.1, decay: 1.5, filter: 'bandpass', ffreq: 900, fq: 9, vib: 11, vibDepth: 9 }); },
    thud(s) { s.burst({ type: 'lowpass', freq: 140, gain: 0.7, attack: 0.01, decay: 0.6 }); },
    step(s, stone) { s.burst({ type: stone ? 'bandpass' : 'lowpass', freq: stone ? 380 : 220, q: 1, gain: stone ? 0.2 : 0.14, attack: 0.005, decay: 0.12 }); },
    ignite(s) { s.burst({ white: true, type: 'bandpass', freq: 1100, q: 1.2, gain: 0.05, attack: 0.03, decay: 0.3 }); },
    drip(s) { s.tone({ freq: 1700, freqTo: 1050, glide: 0.05, gain: 0.05, decay: 0.12 }); },
    rattle(s) { for (let i = 0; i < 10; i++) s.burst({ white: true, type: 'highpass', freq: 2500, gain: 0.07, attack: 0.002, decay: 0.05, at: i * 0.07 + R(0, 0.03) }); },
    rumble(s) { s.burst({ type: 'lowpass', freq: 90, gain: 0.8, attack: 0.2, decay: 1.8 }); }
  };

  /* ================================================================== the shared stage (overlay, renderer, compositor) */
  function stage(opts, grade) {
    const FX = window.KQ3D;
    const ov = document.createElement('div'); ov.className = 'kq-ride'; ov.style.cssText = 'position:fixed;inset:0;z-index:95;background:#000;opacity:0;transition:opacity .5s ease;cursor:pointer'; document.body.appendChild(ov);
    const note = document.createElement('div'); note.textContent = opts.text || ''; note.style.cssText = 'position:absolute;left:50%;bottom:9%;transform:translateX(-50%);padding:10px 22px;border-radius:999px;background:rgba(14,12,24,.62);color:#f7e1a0;font:700 clamp(14px,2.2vw,20px) Rubik,system-ui,sans-serif;letter-spacing:.04em;box-shadow:inset 0 0 0 1px rgba(255,222,160,.4),0 10px 30px rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:opacity .6s;pointer-events:none;white-space:nowrap;z-index:2'; if (opts.text) ov.appendChild(note);
    let renderer; try { renderer = new T.WebGLRenderer({ antialias: !FX, powerPreference: 'high-performance' }); } catch (e) { ov.remove(); return null; }
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; ov.appendChild(renderer.domElement);
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(66, 1, 0.05, 1600);
    const post = FX ? FX.post(renderer, scene, camera, { grade, maxPixelRatio: 1.25, msaa: 2 }) : null;
    return { FX, ov, note, renderer, scene, camera, post, soft: softTex() };
  }

  /* ================================================================== PIRATE COVE: the maelstrom */
  function jollyCanvas() {
    return canvas(256, 170, (x, w, h) => {
      x.fillStyle = '#0d0d10'; x.fillRect(0, 0, w, h); x.fillStyle = x.strokeStyle = '#efe8d8'; x.lineCap = 'round'; x.lineWidth = 15;
      x.beginPath(); x.moveTo(w * 0.3, h * 0.72); x.lineTo(w * 0.7, h * 0.95); x.moveTo(w * 0.7, h * 0.72); x.lineTo(w * 0.3, h * 0.95); x.stroke();
      for (const [bx, by] of [[0.3, 0.72], [0.7, 0.95], [0.7, 0.72], [0.3, 0.95]]) { x.beginPath(); x.arc(w * bx - 6, h * by, 9, 0, TAU); x.arc(w * bx + 6, h * by, 9, 0, TAU); x.fill(); }
      x.beginPath(); x.ellipse(w * 0.5, h * 0.38, 50, 44, 0, 0, TAU); x.fill(); x.fillRect(w * 0.5 - 29, h * 0.52, 58, 22);
      x.fillStyle = '#0d0d10'; for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(w * 0.5 + sd * 19, h * 0.38, 13, 15, 0, 0, TAU); x.fill(); } x.beginPath(); x.moveTo(w * 0.5, h * 0.47); x.lineTo(w * 0.5 - 7, h * 0.56); x.lineTo(w * 0.5 + 7, h * 0.56); x.fill(); for (let i = -2; i <= 2; i++) x.fillRect(w * 0.5 + i * 11 - 1.5, h * 0.58, 3, 13);
    });
  }
  function sailCanvas() { return canvas(128, 128, (x, w, h) => { x.fillStyle = '#e4d6b8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(120,90,50,0.08)'; x.beginPath(); x.ellipse(R(0, w), R(0, h), R(10, 40), R(8, 30), 0, 0, TAU); x.fill(); } x.strokeStyle = 'rgba(120,96,64,0.35)'; x.lineWidth = 1; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * w / 6, 0); x.lineTo(i * w / 6, h); x.stroke(); } x.fillStyle = 'rgba(160,120,70,0.25)'; x.fillRect(R(10, 60), R(20, 80), 22, 18); }); }
  /* a three-masted-looking brig in miniature: hull with sheer and a keel, a lit stern castle, two masts with billowing sails,
     a Jolly Roger that waves, a bowsprit, gun ports, stern lanterns */
  function pirateShip(soft) {
    const ship = new T.Group(), HL = 13, HW = 4.2, HH = 2.6, pc = plankCanvas();
    const deckMat = new T.MeshStandardMaterial({ map: tex(pc, 1.4, 3), roughness: 0.82, color: 0xcfb794 }), hullMat = new T.MeshStandardMaterial({ map: tex(pc, 3, 1), color: 0x6a4228, roughness: 0.72 });
    const darkM = new T.MeshStandardMaterial({ color: 0x24160c, roughness: 0.85 }), goldM = new T.MeshStandardMaterial({ color: 0xd4a44a, metalness: 1, roughness: 0.3 }), ironM = new T.MeshStandardMaterial({ color: 0x26262a, metalness: 0.8, roughness: 0.45 });
    const halfW = u => HW / 2 * (1 - (u > 0 ? Math.pow(u, 2.2) * 0.9 : Math.pow(-u, 3) * 0.3)), sheer = u => u * u * 0.8 + (u > 0.7 ? (u - 0.7) * 1.2 : 0);
    const hg = new T.BoxGeometry(HW, HH, HL, 8, 4, 30), ps = hg.attributes.position;
    for (let i = 0; i < ps.count; i++) { let x = ps.getX(i), y = ps.getY(i); const z = ps.getZ(i), u = -z / (HL / 2); const keel = y < 0 ? 1 - Math.pow(-y / (HH / 2), 2) * 0.55 : 1; x *= (halfW(u) / (HW / 2)) * keel; y += sheer(u); ps.setXYZ(i, x, y, z); }
    hg.computeVertexNormals(); ship.add(new T.Mesh(hg, [hullMat, hullMat, deckMat, darkM, hullMat, hullMat]));
    for (const sd of [-1, 1]) { const top = [], stripe = []; for (let k = 0; k <= 24; k++) { const u = -1 + k / 12, z = -u * HL / 2; top.push(new T.Vector3(sd * halfW(u) * 0.98, HH / 2 + sheer(u) + 0.4, z)); stripe.push(new T.Vector3(sd * halfW(u) * 1.01, HH / 2 + sheer(u) - 0.35, z)); } ship.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(top), 48, 0.08, 6, false), darkM)); ship.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(stripe), 48, 0.07, 5, false), goldM));
      for (let k = 0; k < 4; k++) { const z = -3 + k * 2, u = -z / (HL / 2), c = new T.Mesh(new T.CylinderGeometry(0.1, 0.13, 0.7, 10), ironM); c.rotation.z = PI / 2; c.position.set(sd * (halfW(u) + 0.2), 0.35 + sheer(u) * 0.5, z); ship.add(c); const port = new T.Mesh(new T.BoxGeometry(0.06, 0.4, 0.46), darkM); port.position.set(sd * (halfW(u) + 0.01), 0.35 + sheer(u) * 0.5, z); ship.add(port); } }
    const castle = new T.Mesh(new T.BoxGeometry(3.3, 1.7, 3.0), hullMat); castle.position.set(0, HH / 2 + sheer(-0.8) + 0.85, 5.0); ship.add(castle);
    const winM = new T.MeshBasicMaterial({ color: new T.Color(3.0, 1.9, 0.8) }); for (let i = 0; i < 4; i++) { const w = new T.Mesh(new T.PlaneGeometry(0.42, 0.5), winM); w.position.set(-1.15 + i * 0.77, castle.position.y + 0.1, 6.52); ship.add(w); }
    for (const sd of [-1, 1]) { const l = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), new T.MeshBasicMaterial({ color: new T.Color(4, 2.5, 1) })); l.position.set(sd * 1.5, castle.position.y + 1.3, 6.3); ship.add(l); const gl = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffb060, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false })); gl.scale.setScalar(2.2); gl.position.copy(l.position); ship.add(gl); }
    const lamp = new T.PointLight(0xffb060, 40, 28, 1.8); lamp.position.set(0, castle.position.y + 1.6, 7.2); ship.add(lamp);
    const bsA = new T.Vector3(0, HH / 2 + sheer(1) - 0.2, -6.3), bsB = new T.Vector3(0, HH / 2 + sheer(1) + 1.7, -10.4), bsD = bsB.clone().sub(bsA); const bs = new T.Mesh(new T.CylinderGeometry(0.08, 0.16, bsD.length(), 8), darkM); bs.position.copy(bsA).lerp(bsB, 0.5); bs.quaternion.setFromUnitVectors(UP, bsD.clone().normalize()); ship.add(bs);
    const sailTex = tex(sailCanvas(), 1, 1), sailM = new T.MeshStandardMaterial({ map: sailTex, roughness: 0.9, side: T.DoubleSide }), sails = [];
    const ropeM = new T.LineBasicMaterial({ color: 0x6a5a44 });
    let flag = null;
    for (const [z, H] of [[-2.8, 9.2], [1.4, 10.6]]) { const u = -z / (HL / 2), base = HH / 2 + sheer(u); const mast = new T.Mesh(new T.CylinderGeometry(0.1, 0.15, H, 10), darkM); mast.position.set(0, base + H / 2, z); ship.add(mast);
      for (const [yy, w, hgt] of [[base + 3.4, 4.8, 2.7], [base + 6.6, 3.9, 2.4]]) { const yard = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, w + 0.6, 8), darkM); yard.rotation.z = PI / 2; yard.position.set(0, yy + 0.1, z - 0.15); ship.add(yard);
        const sg = new T.PlaneGeometry(w, hgt, 10, 6), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { const sx = sp.getX(i) / w + 0.5, sy = sp.getY(i) / hgt + 0.5; sp.setZ(i, -Math.sin(sx * PI) * Math.sin(sy * PI) * 0.75 - (1 - sy) * 0.25); } sg.computeVertexNormals(); const sail = new T.Mesh(sg, sailM); sail.position.set(0, yy - hgt / 2, z - 0.2); ship.add(sail); sails.push(sail); }
      ship.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, base + H, z), new T.Vector3(0, HH / 2 + sheer(z < 0 ? 1 : -0.8) + 0.3, z < 0 ? -6 : 6)]), ropeM));
      for (const sd of [-1, 1]) ship.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, base + H - 0.5, z), new T.Vector3(sd * halfW(u), base + 0.4, z + 1.2)]), ropeM));
      if (H > 10) { const fg = new T.PlaneGeometry(2.3, 1.5, 14, 8); fg.rotateY(PI / 2); fg.translate(0, 0, 1.2); const f = new T.Mesh(fg, new T.MeshStandardMaterial({ map: new T.CanvasTexture(jollyCanvas()), roughness: 0.85, side: T.DoubleSide })); f.material.map.colorSpace = T.SRGBColorSpace; f.position.set(0, base + H - 0.8, z); ship.add(f); flag = { f, base: Float32Array.from(fg.attributes.position.array) }; } }
    ship.userData.wave = (t) => { if (flag) { const p = flag.f.geometry.attributes.position, b = flag.base; for (let i = 0; i < p.count; i++) { const zz = b[i * 3 + 2], k = zz / 2.4; p.setX(i, b[i * 3] + Math.sin(zz * 3.2 - t * 9) * 0.22 * k); p.setY(i, b[i * 3 + 1] + Math.sin(zz * 2.1 - t * 6) * 0.06 * k); } p.needsUpdate = true; flag.f.geometry.computeVertexNormals(); } for (const [i, s] of sails.entries()) s.scale.z = 1 + Math.sin(t * 2.3 + i) * 0.12; };
    return ship;
  }
  function maelstrom(S, up, snd) {
    const { scene, camera, renderer, FX, post, soft } = S;
    const TD = 12.0, DUR = up ? 11.6 : 12.2;
    scene.background = new T.Color(0x05080c); scene.fog = new T.FogExp2(0x0b1218, 0.005);
    if (FX) scene.environment = FX.env(renderer, { top: 0x1c2634, horizon: 0x52667a, ground: 0x03070a, intensity: 1.0, boxes: [{ c: 0xcfe0ff, i: 1.8, p: [0, 9, -5], s: [10, 3] }, { c: 0x8aa0c0, i: 1.2, p: [-7, 3, 2], s: [4, 4] }] });
    const hemi = new T.HemisphereLight(0x7890b0, 0x06121a, 0.7); scene.add(hemi);
    const moon = new T.DirectionalLight(0xa8c0e8, 1.0); moon.position.set(-80, 90, -60); scene.add(moon);
    const flashL = new T.DirectionalLight(0xe6eeff, 0); scene.add(flashL); scene.add(flashL.target);
    const eyeL = new T.PointLight(0x3ae6d2, 0, 190, 1.15); scene.add(eyeL);
    const skyMat = new T.MeshBasicMaterial({ map: tex(stormCanvas(), 1, 1), side: T.BackSide, fog: false, depthWrite: false }); const sky = new T.Mesh(new T.SphereGeometry(900, 48, 24), skyMat); sky.renderOrder = -1; scene.add(sky);

    /* ---- the sea: a polar grid, dense at the centre, displaced every frame (waves + the funnel) ---- */
    const NR = 96, NS = 140, RMAX = 520, D = 64, RC = 15;
    const rad = new Float32Array(NR); for (let i = 0; i < NR; i++) rad[i] = 0.8 + Math.pow(i / (NR - 1), 2.1) * RMAX;
    const VN = NR * (NS + 1), P = new Float32Array(VN * 3), UVA = new Float32Array(VN * 2), CA = new Float32Array(VN * 3), idx = [];
    for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + 1, c = a + NS + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const wgeo = new T.BufferGeometry(); wgeo.setAttribute('position', new T.BufferAttribute(P, 3).setUsage(T.DynamicDrawUsage)); wgeo.setAttribute('uv', new T.BufferAttribute(UVA, 2).setUsage(T.DynamicDrawUsage)); wgeo.setAttribute('color', new T.BufferAttribute(CA, 3).setUsage(T.DynamicDrawUsage)); wgeo.setIndex(idx);
    const cosT = new Float32Array(NS + 1), sinT = new Float32Array(NS + 1); for (let j = 0; j <= NS; j++) { cosT[j] = Math.cos(j / NS * TAU); sinT[j] = Math.sin(j / NS * TAU); }
    const phase = new Float32Array(NR);
    const water = new T.Mesh(wgeo, new T.MeshStandardMaterial({ map: tex(foamCanvas()), vertexColors: true, roughness: 0.18, metalness: 0.05, envMapIntensity: 1.15 })); water.frustumCulled = false; scene.add(water);
    const WAV = [[0.05, 0.018, 1.25, 1.2], [-0.028, 0.055, 0.85, 1.6], [0.085, -0.066, 0.4, 2.3], [0.021, 0.105, 0.26, 3.0], [-0.12, -0.04, 0.16, 3.7]];
    let wk = 0;
    const funnel = r => -D / (1 + Math.pow(r / RC, 1.6));
    const hAt = (x, z, t) => { const r = Math.hypot(x, z), calm = smooth(4, 70, r); let h = 0; for (const w of WAV) h += w[2] * Math.sin(x * w[0] + z * w[1] + t * w[3]); return h * (0.3 + 0.7 * calm) + funnel(r) * wk; };
    const omega = r => wk * 2.2 / (1 + Math.pow(r / 14, 1.5));   /* the water turns faster near the eye (clockwise seen from above: -θ) */
    function updateWater(t, dt) {
      for (let i = 0; i < NR; i++) phase[i] += omega(rad[i]) * dt;
      let v = 0;
      for (let i = 0; i < NR; i++) { const r = rad[i], ph = phase[i] / TAU, deep = wk * smooth(0.3, 0.95, 1 / (1 + Math.pow(r / RC, 1.6))), cr = 1 + deep * 0.5, cg = 1 + deep * 1.7, cb = 1 + deep * 1.5, calm = smooth(4, 70, r), fr = funnel(r) * wk, damp = 0.3 + 0.7 * calm;
        for (let j = 0; j <= NS; j++, v++) { const x = r * cosT[j], z = r * sinT[j]; let h = 0; for (const w of WAV) h += w[2] * Math.sin(x * w[0] + z * w[1] + t * w[3]); P[v * 3] = x; P[v * 3 + 1] = h * damp + fr; P[v * 3 + 2] = z; UVA[v * 2] = (j / NS + ph) * 7; UVA[v * 2 + 1] = r / 36; CA[v * 3] = cr; CA[v * 3 + 1] = cg; CA[v * 3 + 2] = cb; } }
      wgeo.attributes.position.needsUpdate = wgeo.attributes.uv.needsUpdate = wgeo.attributes.color.needsUpdate = true; wgeo.computeVertexNormals();
    }
    /* the glowing eye at the bottom of the funnel: the cove shining up through the sea */
    const eyeDisc = new T.Mesh(new T.CircleGeometry(9, 48), new T.MeshBasicMaterial({ color: new T.Color(0x7ffff0).multiplyScalar(2.4), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); eyeDisc.rotation.x = -PI / 2; scene.add(eyeDisc);
    const eyeHalo = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0x5ff5e6, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); scene.add(eyeHalo);

    /* ---- the ship ---- */
    const ship = pirateShip(soft); scene.add(ship);
    /* the dawn sun you sail toward on the way back up */
    const sun = new T.Sprite(new T.SpriteMaterial({ map: soft, color: new T.Color(3.0, 1.8, 0.9), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false })); sun.scale.setScalar(260); scene.add(sun); let sunDir = new T.Vector3(0, 0.12, -1);
    /* ---- debris circling with the water ---- */
    const debris = []; { const bm = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), geos = [barrelGeo(), plankGeo(), chestGeo()];
      for (let i = 0; i < 24; i++) { const kind = i < 12 ? 0 : i < 21 ? 1 : 2, m = new T.Mesh(geos[kind], bm); m.scale.setScalar(kind === 1 ? 1.6 : 1.8); scene.add(m); debris.push({ m, r: R(18, 120), th: R(0, TAU), rx: R(-1.5, 1.5), ry: R(-1.5, 1.5), rz: R(-1, 1), b: R(0, 6) }); } }
    /* ---- the ghostly pirate that swoops past ---- */
    let ghost = null; if (window.KQCast) { try { const c = KQCast.build('pirate', { lod: 0.7 }); c.root.visible = false; scene.add(c.root); ghost = c; } catch (e) {} }
    /* ---- the kraken arm: it rises beside the ship, curls over it, and sinks ---- */
    const TS = 44, TRS = 10, tentPos = new Float32Array((TS + 1) * (TRS + 1) * 3), tentGeo = new T.BufferGeometry(); { const id = []; for (let i = 0; i < TS; i++) for (let j = 0; j < TRS; j++) { const a = i * (TRS + 1) + j, b = a + 1, c = a + TRS + 1, d = c + 1; id.push(a, b, c, b, d, c); } tentGeo.setAttribute('position', new T.BufferAttribute(tentPos, 3).setUsage(T.DynamicDrawUsage)); tentGeo.setIndex(id); }
    const tent = new T.Mesh(tentGeo, new T.MeshStandardMaterial({ color: 0x7a2a52, roughness: 0.38, metalness: 0.05, emissive: 0x1a040e })); tent.frustumCulled = false; tent.visible = false; scene.add(tent);
    const SUCK = 18, suckers = new T.InstancedMesh(new T.SphereGeometry(1, 10, 6), new T.MeshStandardMaterial({ color: 0xf0c4d2, roughness: 0.45 }), SUCK); suckers.frustumCulled = false; suckers.visible = false; scene.add(suckers);
    const TT0 = up ? 4.2 : 6.0, TTD = 3.0; let tentBase = null, groaned = false;
    function buildTentacle(t, target) {
      const q = (t - TT0) / TTD; if (q < 0 || q > 1) { tent.visible = suckers.visible = false; return; }
      tent.visible = suckers.visible = true; const rise = smooth(0, 0.28, q), sink = smooth(0.72, 1, q), curl = smooth(0.2, 0.55, q) * (1 - sink * 0.6), L = 17 * rise;
      const base = new T.Vector3(tentBase.r * Math.cos(tentBase.th), 0, tentBase.r * Math.sin(tentBase.th)); base.y = hAt(base.x, base.z, t) - 2 - sink * 22;
      const tentDir = new T.Vector3(target.x - base.x, 0, target.z - base.z).normalize();
      const side = new T.Vector3().crossVectors(tentDir, UP).normalize(), pts = [], mat = new T.Matrix4(), tmp = new T.Vector3();
      for (let i = 0; i <= TS; i++) { const u = i / TS; const p = base.clone().addScaledVector(UP, L * u).addScaledVector(tentDir, 7 * curl * u * u * u + Math.sin(u * 3 + t * 2.2) * 0.8 * u).addScaledVector(side, Math.sin(u * 4 - t * 3) * 1.6 * u); if (u > 0.7) p.addScaledVector(UP, -(u - 0.7) * 14 * curl); pts.push(p); }
      let v = 0; const n = new T.Vector3(), b = new T.Vector3();
      for (let i = 0; i <= TS; i++) { const u = i / TS, tg = pts[Math.min(TS, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize(); n.crossVectors(tg, side).normalize(); b.crossVectors(tg, n).normalize(); const rr = 1.5 * Math.pow(1 - u, 0.85) + 0.08;
        for (let j = 0; j <= TRS; j++, v++) { const a = j / TRS * TAU; tmp.copy(pts[i]).addScaledVector(n, Math.cos(a) * rr).addScaledVector(b, Math.sin(a) * rr); tentPos[v * 3] = tmp.x; tentPos[v * 3 + 1] = tmp.y; tentPos[v * 3 + 2] = tmp.z; }
        if (i % 2 === 0 && i / 2 < SUCK && i > 3) { const k = i / 2; tmp.copy(pts[i]).addScaledVector(n, -rr * 0.95); mat.compose(tmp, new T.Quaternion(), new T.Vector3(1, 1, 1).multiplyScalar(rr * 0.28 + 0.05)); suckers.setMatrixAt(k, mat); } }
      for (let k = 0; k < 2; k++) suckers.setMatrixAt(k, new T.Matrix4().makeScale(0, 0, 0));
      tentGeo.attributes.position.needsUpdate = true; tentGeo.computeVertexNormals(); suckers.instanceMatrix.needsUpdate = true;
    }

    /* ---- lightning ---- */
    const boltMat = new T.MeshBasicMaterial({ color: new T.Color(3.2, 3.4, 4.4), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false });
    function bolt(from, to) { const pts = [from.clone()], n = 16; for (let i = 1; i < n; i++) { const k = i / n, p = from.clone().lerp(to, k); p.x += R(-9, 9); p.z += R(-9, 9); pts.push(p); } pts.push(to.clone()); const path = new T.CurvePath(); for (let i = 0; i < pts.length - 1; i++) path.add(new T.LineCurve3(pts[i], pts[i + 1])); const g = new T.Group(); g.add(new T.Mesh(new T.TubeGeometry(path, 90, 0.9, 5, false), boltMat)); for (let bI = 0; bI < 2; bI++) { const s = pts[4 + bI * 5], e = s.clone().add(new T.Vector3(R(-40, 40), R(-60, -30), R(-40, 40))); const bp = new T.CurvePath(); let prev = s; for (let k = 1; k <= 5; k++) { const p = s.clone().lerp(e, k / 5).add(new T.Vector3(R(-5, 5), 0, R(-5, 5))); bp.add(new T.LineCurve3(prev, p)); prev = p; } g.add(new T.Mesh(new T.TubeGeometry(bp, 30, 0.45, 4, false), boltMat)); } return g; }
    const FLASH = (up ? [1.5, 4.3] : [1.2, 5.3, 8.6]).map(t0 => ({ t0, g: null, boomed: false }));
    const flashEnv = q => q < 0 ? 0 : (q < 0.08 ? 1 : q < 0.14 ? 0.25 : q < 0.2 ? 0.9 : q < 0.26 ? 0.2 : q < 0.42 ? 0.7 * (1 - (q - 0.26) / 0.16) : 0);

    /* ---- rain around the camera ---- */
    const RN = 1500, rpos = new Float32Array(RN * 6), rgeo = new T.BufferGeometry(); rgeo.setAttribute('position', new T.BufferAttribute(rpos, 3).setUsage(T.DynamicDrawUsage));
    const rain = new T.LineSegments(rgeo, new T.LineBasicMaterial({ color: 0xb8cce0, transparent: true, opacity: 0.3, depthWrite: false })); rain.frustumCulled = false; scene.add(rain);
    const drops = new Float32Array(RN * 3); for (let i = 0; i < RN; i++) { drops[i * 3] = R(-32, 32); drops[i * 3 + 1] = R(-14, 30); drops[i * 3 + 2] = R(-32, 32); }

    /* ---- the course: a table of the ship's polar path (the down timeline; going up reads it backwards) ---- */
    const TH0 = 0.6, R0 = 150, RE = 6.5, T2 = 9.9, HZ = 120; const tab = [];
    { let r = R0, th = TH0, drop = 0; const N = Math.ceil(TD * HZ); for (let i = 0; i <= N + 1; i++) { const tt = i / HZ; tab.push([r * Math.cos(th), r * Math.sin(th), drop]); const dtt = 1 / HZ;
        if (tt < T2) { r = RE + (R0 - RE) * Math.pow(1 - Math.min(1, (tt + dtt) / T2), 1.6); th -= 34 * smooth(0.6, 9.0, tt) / Math.max(r, RE) * dtt; }
        else { const q = Math.min(1, (tt - T2) / (TD - T2)); r = Math.max(0.2, RE * (1 - q)); th -= 3.2 * dtt; drop = 6 * q * q; } } }
    const sample = tt => { const f = clamp(tt, 0, TD) * HZ, i = Math.min(tab.length - 2, Math.floor(f)), w = f - i, a = tab[i], b = tab[i + 1]; return [lerp(a[0], b[0], w), lerp(a[1], b[1], w), lerp(a[2], b[2], w)]; };
    const pathT = t => up ? TD * (1 - t / DUR) : Math.min(t, TD);
    { const a = sample(0), b = sample(0.1); sunDir = new T.Vector3(a[0] - b[0], 0, a[1] - b[1]).normalize(); sunDir.y = 0.1; sunDir.normalize(); }

    /* ---- sound ---- */
    const aud = snd ? { storm: snd.loop({ type: 'bandpass', freq: 700, q: 0.6, gain: 0.16, rate: 1.4 }), sea: snd.loop({ type: 'lowpass', freq: 260, q: 0.7, gain: 0.45 }), rain: snd.loop({ white: true, type: 'highpass', freq: 4500, q: 0.5, gain: 0.05 }), roar: snd.loop({ type: 'lowpass', freq: 110, q: 0.9, gain: 0 }) } : null;
    if (snd) { SND.bell(snd, 0.25); SND.bell(snd, 1.45); snd.wet(0.15); }
    let creakT = 2.0, ghostT = up ? 7.0 : 3.6, ghostOn = false, whooshed = false, first = true;

    const fwd = new T.Vector3(), rgt = new T.Vector3(), upv = new T.Vector3(), tmpA = new T.Vector3(), tmpB = new T.Vector3(), basis = new T.Matrix4(), sq = new T.Quaternion();
    const camPos = new T.Vector3(), camTgt = new T.Vector3(), want = new T.Vector3(), aim = new T.Vector3();
    function update(t, dt) {
      wk = up ? 1 - smooth(DUR - 3.8, DUR - 0.6, t) : smooth(0.4, 3.4, t);
      updateWater(t, dt);
      /* the ship: course from the table, attitude from the water under its hull */
      const p = pathT(t), c0 = sample(p), dir = up ? -1 : 1, cA = sample(p + 0.05 * dir), cB = sample(p - 0.05 * dir);
      fwd.set(cA[0] - cB[0], 0, cA[1] - cB[1]); if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
      rgt.set(-fwd.z, 0, fwd.x);
      const x = c0[0], z = c0[1], hb = hAt(x + fwd.x * 5, z + fwd.z * 5, t), hs = hAt(x - fwd.x * 5, z - fwd.z * 5, t), hp = hAt(x - rgt.x * 2, z - rgt.z * 2, t), hr = hAt(x + rgt.x * 2, z + rgt.z * 2, t), hc = (hb + hs + hp + hr) / 4;
      tmpA.set(x + fwd.x * 5, hb, z + fwd.z * 5); tmpB.set(x - fwd.x * 5, hs, z - fwd.z * 5); const f3 = tmpA.clone().sub(tmpB).normalize().lerp(fwd, 0.5).normalize();
      tmpA.set(x + rgt.x * 2, hr, z + rgt.z * 2); tmpB.set(x - rgt.x * 2, hp, z - rgt.z * 2); const r3 = tmpA.clone().sub(tmpB).normalize();
      upv.crossVectors(r3, f3).normalize(); upv.lerp(UP, 0.45).normalize(); r3.crossVectors(f3, upv).normalize(); upv.crossVectors(r3, f3).normalize();
      const plunge = smooth(T2, TD, p); if (plunge > 0) { const pa = (up ? 0.9 : -1.0) * plunge; f3.applyAxisAngle(r3, pa); upv.applyAxisAngle(r3, pa); }
      const shipPos = new T.Vector3(x, hc - 0.3 - c0[2], z);
      basis.makeBasis(r3, upv, f3.clone().negate()); sq.setFromRotationMatrix(basis); ship.position.copy(shipPos); ship.quaternion.copy(sq); ship.userData.wave(t);
      /* the camera: a chase shot from behind and outside the ship, so the funnel and the eye sit beyond it; it rises to look
         down into the eye for the plunge (and starts there going up) */
      const toC = tmpA.set(-x, 0, -z); if (toC.lengthSq() < 1e-6) toC.copy(fwd); toC.normalize(); const out = toC.clone().negate();
      const early = up ? 0 : 1 - smooth(0.6, 3.2, t);
      want.copy(shipPos).addScaledVector(fwd, -17 + early * 5).addScaledVector(UP, 7.5 - early * 3.5).addScaledVector(out, 6 * (1 - early));
      aim.copy(shipPos).addScaledVector(fwd, 9).addScaledVector(toC, 5 * (1 - early)).addScaledVector(UP, -1.5 + early * 2);
      if (up) { const e = smooth(DUR - 4.5, DUR - 1.2, t); aim.addScaledVector(fwd, 22 * e).addScaledVector(UP, 7 * e); }
      const pk = smooth(T2 - 1.0, TD - 0.5, p); const eyeY = funnel(0) * wk;
      if (pk > 0) { want.lerp(tmpB.set(shipPos.x * 0.35, shipPos.y + 24, shipPos.z * 0.35).addScaledVector(out, 5), pk); aim.lerp(tmpB.set(0, eyeY, 0).lerp(shipPos, 0.4), pk); }
      const floorY = hAt(want.x, want.z, t) + 3; if (want.y < floorY) want.y = floorY;
      if (first) { camPos.copy(want); camTgt.copy(aim); first = false; }
      camPos.lerp(want, 1 - Math.exp(-dt * 2.8)); camTgt.lerp(aim, 1 - Math.exp(-dt * 4));
      camera.position.copy(camPos).addScaledVector(UP, Math.sin(t * 1.9) * 0.1); camera.up.copy(UP).lerp(upv, 0.12).normalize(); camera.lookAt(camTgt);
      const fc = camTgt.clone().sub(camera.position).normalize();
      sky.position.copy(camera.position);
      /* the eye */
      eyeDisc.position.set(0, eyeY + 2, 0); eyeDisc.scale.setScalar(Math.max(0.001, wk)); eyeHalo.position.copy(eyeDisc.position).y += 4; eyeHalo.scale.setScalar(56 * wk + 0.001); eyeHalo.material.opacity = 0.75 * wk;
      const eyeK = up ? 0.35 + 0.65 * smooth(0.2, 3.0, t) : 1; eyeDisc.material.opacity = eyeK; eyeHalo.material.opacity *= eyeK;
      eyeL.position.set(0, eyeY * 0.85, 0); eyeL.intensity = 1400 * wk * wk * eyeK;
      if (up) { renderer.toneMappingExposure = 1.1 - 0.4 * (1 - smooth(0.3, 2.6, t)); sun.position.copy(camera.position).addScaledVector(sunDir, 600); sun.material.opacity = smooth(DUR - 4.5, DUR - 1, t); }
      /* debris */
      for (const d of debris) { d.th -= omega(d.r) * dt; d.r -= (0.6 + 50 / Math.max(d.r, 6)) * dt * wk; if (d.r < 5) { d.r = R(80, 130); d.th = R(0, TAU); } const dx = d.r * Math.cos(d.th), dz = d.r * Math.sin(d.th); d.m.position.set(dx, hAt(dx, dz, t) + 0.25 + Math.sin(t * 2 + d.b) * 0.15, dz); d.m.rotation.set(d.rx * t, d.ry * t, d.rz * t); }
      /* ghost swoop, across the shot between you and the ship */
      if (ghost && !ghostOn && t > ghostT) { ghostOn = true; ghost.root.visible = true; ghost.t0 = t; if (snd) SND.ghost(snd); }
      if (ghost && ghostOn) { const q = (t - ghost.t0) / 2.4; if (q > 1) ghost.root.visible = false; else { const side = new T.Vector3().crossVectors(fc, UP).normalize(); ghost.root.position.copy(camera.position).addScaledVector(fc, 9 - q * 2).addScaledVector(side, -8 + q * 16).addScaledVector(UP, 0.5 + Math.sin(q * PI) * 1.6); ghost.root.lookAt(camera.position); ghost.root.scale.setScalar(1.3); ghost.update(dt); } }
      /* the kraken */
      if (!tentBase && t > TT0 - 0.1) { const a = shipPos.clone().addScaledVector(fwd, 11).addScaledVector(toC, 8); tentBase = { r: Math.max(8, Math.hypot(a.x, a.z)), th: Math.atan2(a.z, a.x) }; }
      if (tentBase) { tentBase.th -= omega(tentBase.r) * dt; buildTentacle(t, shipPos); if (!groaned && t > TT0 + 0.2) { groaned = true; if (snd) { SND.groan(snd); SND.splash(snd); } } }
      /* lightning */
      let fl = 0; for (const F of FLASH) { const q = t - F.t0; if (q >= 0 && !F.g) { const az = Math.atan2(fc.x, fc.z) + R(-0.5, 0.5), dist = R(220, 320), gx = camera.position.x + Math.sin(az) * dist, gz = camera.position.z + Math.cos(az) * dist; F.g = bolt(new T.Vector3(gx + R(-30, 30), 260, gz + R(-30, 30)), new T.Vector3(gx, -4, gz)); scene.add(F.g); flashL.position.set(gx, 200, gz); flashL.target.position.copy(camera.position); }
        if (F.g) { const e = flashEnv(q); fl = Math.max(fl, e); F.g.visible = q < 0.45; if (!F.boomed && q > 0.35) { F.boomed = true; if (snd) SND.thunder(snd); } } }
      flashL.intensity = 4.2 * fl; hemi.intensity = 0.7 + 2.0 * fl + (up ? smooth(DUR - 4, DUR - 0.5, t) * 0.9 : 0); skyMat.color.setScalar(1 + 2.6 * fl);
      if (up) { const dawn = smooth(DUR - 4.5, DUR - 0.5, t); skyMat.color.lerp(new T.Color(2.2, 1.5, 1.1), dawn); moon.color.setHex(0xa8c0e8).lerp(new T.Color(0xffd0a0), dawn); moon.intensity = 1.0 + dawn * 1.2; if (post && dawn > 0.2 && !update.warm) { update.warm = true; post.setGrade('warm'); } rain.material.opacity = 0.3 * (1 - dawn); }
      /* rain */
      for (let i = 0; i < RN; i++) { let dx = drops[i * 3] + 9 * dt, dy = drops[i * 3 + 1] - 44 * dt; const dz = drops[i * 3 + 2]; if (dy < -14) dy += 44; if (dx > 32) dx -= 64; drops[i * 3] = dx; drops[i * 3 + 1] = dy; const px = camera.position.x + dx, py = camera.position.y + dy, pz = camera.position.z + dz; rpos.set([px, py, pz, px - 0.24, py + 1.2, pz], i * 6); }
      rgeo.attributes.position.needsUpdate = true;
      /* the plunge: the eye floods the view */
      if (!up) renderer.toneMappingExposure = 1.1 + 2.6 * smooth(TD - 1.0, TD + 0.1, t);
      /* sound */
      if (aud) { aud.storm.set(0.12 + 0.07 * Math.sin(t * 0.9) + 0.05 * Math.sin(t * 2.3), 600 + 200 * Math.sin(t * 0.5)); aud.sea.set(0.35 + 0.15 * Math.sin(t * 0.6)); const rr = Math.hypot(x, z), deep = wk * (1 - clamp(rr / 110, 0, 1)); aud.roar.set(0.08 + 0.75 * deep, 80 + 260 * deep); aud.rain.set(up ? 0.05 * (1 - smooth(DUR - 4, DUR, t)) : 0.05);
        if (t > creakT) { creakT = t + R(1.6, 3.2); SND.creak(snd); }
        if (!whooshed && ((!up && t > TD - 1.3) || (up && t > 0.2))) { whooshed = true; SND.whoosh(snd); } }
    }
    return { dur: DUR, update, endColor: () => up ? '#fff1dc' : '#0c3a3a' };
  }
  maelstrom.grade = 'pirate';

  /* ================================================================== SKULL CATACOMBS: the crypt */
  function fogCanvas() { return canvas(256, 256, (x, w, h) => { for (let i = 0; i < 70; i++) { const px = R(40, w - 40), py = R(40, h - 40), r = R(20, 70), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(210,235,210,0.22)'); g.addColorStop(1, 'rgba(210,235,210,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }); }
  function tinyTombGeo() { const s = new T.Color(0x5e5c62), roof = new T.Color(0x3c3a40), dark = new T.Color(0x0c0c0e); const shape = new T.Shape(); shape.moveTo(-1.1, 0); shape.lineTo(1.1, 0); shape.lineTo(0, 0.9); shape.closePath(); const pr = new T.ExtrudeGeometry(shape, { depth: 2.6, bevelEnabled: false }); pr.translate(0, 0, -1.3); return merge([{ g: new T.BoxGeometry(1.9, 1.7, 2.4), m: M4(0, 0.85, 0), c: s }, { g: pr, m: M4(0, 1.7, 0), c: roof }, { g: new T.BoxGeometry(0.6, 1.0, 0.05), m: M4(0, 0.5, 1.21), c: dark }, { g: new T.BoxGeometry(0.1, 0.5, 0.06), m: M4(0, 2.35, 1.2), c: s }, { g: new T.BoxGeometry(0.34, 0.1, 0.06), m: M4(0, 2.45, 1.2), c: s }]); }
  function crossGeo() { const s = new T.Color(0x6a6a70); return merge([{ g: new T.BoxGeometry(0.16, 1.5, 0.16), m: M4(0, 0.75, 0), c: s }, { g: new T.BoxGeometry(0.8, 0.16, 0.16), m: M4(0, 1.1, 0), c: s }, { g: new T.BoxGeometry(0.5, 0.2, 0.5), m: M4(0, 0.1, 0), c: new T.Color(0x4a4a50) }]); }
  function crypt(S, up, snd) {
    const { scene, camera, renderer, FX, post, soft } = S;
    const DUR = up ? 12.6 : 14.0;
    if (post) post.setGrade({ bloom: 0.78, threshold: 0.8, knee: 0.5, w: [1, 0.95, 0.85], lift: [0.012, 0.004, 0.02], shadow: [0.96, 0.9, 1.14], high: [0.96, 1.08, 0.9], contrast: 0.26, sat: 0.98, vig: 0.58, grain: 0.028 }, true);   /* the skull grade, with bloom kept for the flames and eyes (bone must not glow) */
    const FOG_OUT = new T.Color(0x151c2c), FOG_IN = new T.Color(0x07060a), FOG_GREEN = new T.Color(0x0c2612);
    scene.background = new T.Color(0x0a0e18); scene.fog = new T.FogExp2(FOG_OUT.getHex(), 0.026);
    if (FX) scene.environment = FX.env(renderer, { top: 0x2a3448, horizon: 0x44526a, ground: 0x0a0c10, intensity: 0.8 });
    const hemi = new T.HemisphereLight(0x9aaee0, 0x181420, 0.9); scene.add(hemi);
    const MOON = new T.Vector3(185, 125, -236);
    const moonL = new T.DirectionalLight(0xc0d2ff, 1.6); moonL.position.copy(MOON); scene.add(moonL);
    const fillL = new T.DirectionalLight(0x8c9ccc, 1.8); fillL.position.set(-30, 18, 50); scene.add(fillL);
    const lantern = new T.PointLight(0xffc27a, 0, 13, 2); scene.add(lantern);
    const C = new T.Vector3(0, 0, -7.2), RCAM = 3.95, TH0 = PI / 2, TURN = 11.2, H = 28, DA = 0.22, WELL = 2.0;
    const doom = new T.PointLight(0x7dff62, 0, 80, 1.3); doom.position.set(C.x, -24, C.z); scene.add(doom);
    const sky = new T.Mesh(new T.SphereGeometry(700, 48, 24), new T.MeshBasicMaterial({ map: tex(nightCanvas(), 1, 1), side: T.BackSide, fog: false, depthWrite: false })); scene.add(sky);
    const moonS = new T.Sprite(new T.SpriteMaterial({ map: soft, color: new T.Color(2.0, 2.2, 2.8), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); moonS.position.copy(MOON); moonS.scale.setScalar(70); scene.add(moonS);
    const moonD = new T.Mesh(new T.CircleGeometry(10, 40), new T.MeshBasicMaterial({ color: new T.Color(2.4, 2.5, 2.7), fog: false })); moonD.position.copy(MOON); moonD.lookAt(0, 2, 15); scene.add(moonD);
    const dawn = new T.Sprite(new T.SpriteMaterial({ map: soft, color: new T.Color(2.4, 1.4, 0.8), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false })); dawn.position.set(0, 4, 300); dawn.scale.set(420, 120, 1); scene.add(dawn);   /* a band of dawn along the horizon */

    /* ---- stone, grass ---- */
    const sc = stoneCanvas('#5a544c', ['#6a6258', '#4a443e', '#5e564c']), stone = tex(sc, 1, 1), stoneN = FX ? FX.normalFrom(sc, 2.6) : null;
    const stoneMat = (rx, ry, color, side) => { const m = stone.clone(); m.repeat.set(rx, ry); m.needsUpdate = true; let n = null; if (stoneN) { n = stoneN.clone(); n.repeat.set(rx, ry); n.needsUpdate = true; } return new T.MeshStandardMaterial({ map: m, normalMap: n, normalScale: new T.Vector2(1.2, 1.2), roughness: 0.92, color: color || 0xffffff, side: side || T.FrontSide }); };
    { const gs = new T.Shape(); gs.moveTo(-160, -160); gs.lineTo(160, -160); gs.lineTo(160, 160); gs.lineTo(-160, 160); gs.closePath(); const hole = new T.Path(); hole.absarc(C.x, -C.z, 6.5, 0, TAU, true); gs.holes.push(hole);
      const ground = new T.Mesh(new T.ShapeGeometry(gs, 40), new T.MeshStandardMaterial({ map: tex(grassCanvas(), 0.16, 0.16), roughness: 1, color: 0xa4ada4 })); ground.rotation.x = -PI / 2; scene.add(ground);
      const fs = new T.Shape(); fs.moveTo(-7.5, 0); fs.lineTo(7.5, 0); fs.lineTo(7.5, 15); fs.lineTo(-7.5, 15); fs.closePath(); const fh = new T.Path(); fh.absarc(C.x, -C.z, 6.5, 0, TAU, true); fs.holes.push(fh);
      const floor = new T.Mesh(new T.ShapeGeometry(fs, 40), stoneMat(0.25, 0.25, 0x8a8078)); floor.rotation.x = -PI / 2; floor.position.y = 0.02; scene.add(floor); }

    /* ---- the graveyard: a flagstone path, tombstones and crosses, a dead tree, ground fog, wisps ---- */
    { const fl = new T.InstancedMesh(new T.BoxGeometry(1.0, 0.08, 0.8), stoneMat(0.3, 0.3, 0x8c8880), 40), m = new T.Matrix4(); let c = 0; for (let z = 1.2; z < 17 && c < 40; z += 0.95) for (const x of [-0.56, 0.56]) { m.compose(new T.Vector3(x + R(-0.08, 0.08), 0.03, z + R(-0.06, 0.06)), new T.Quaternion().setFromAxisAngle(UP, R(-0.12, 0.12)), new T.Vector3(R(0.85, 1.05), 1, R(0.85, 1.05))); fl.setMatrixAt(c++, m); } fl.count = c; scene.add(fl);
      const place = (geo, n, minX, scaleR) => { const im = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), n), mm = new T.Matrix4(); let k = 0; for (let i = 0; i < n * 6 && k < n; i++) { const sd = Math.random() < 0.5 ? -1 : 1, x = sd * R(minX, 17), z = R(1.5, 26); mm.compose(new T.Vector3(x, 0, z), new T.Quaternion().setFromEuler(new T.Euler(R(-0.12, 0.12), R(-0.4, 0.4), R(-0.14, 0.14))), new T.Vector3(1, 1, 1).multiplyScalar(R(scaleR[0], scaleR[1]))); im.setMatrixAt(k++, mm); } im.count = k; scene.add(im); };
      place(tombGeo(), 34, 2.4, [0.9, 1.4]); place(crossGeo(), 12, 2.8, [0.9, 1.3]);
      for (const [x, z] of [[-3.4, 5.2], [3.6, 8.5], [-5.5, 13]]) { const ob = new T.Mesh(new T.CylinderGeometry(0.05, 0.42, 3.4, 4), stoneMat(0.4, 0.8, 0x7a7880)); ob.position.set(x, 1.7, z); ob.rotation.y = PI / 4; scene.add(ob); }
      const bark = new T.MeshStandardMaterial({ color: 0x2a221c, roughness: 1 }); const tree = new T.Group(); tree.position.set(-6.2, 0, 7.5); scene.add(tree);
      const branch = (from, dirv, len, rad, depth) => { const pts = [from.clone()]; let p = from.clone(); const d = dirv.clone(); for (let k = 0; k < 4; k++) { d.add(new T.Vector3(R(-0.35, 0.35), R(-0.1, 0.25), R(-0.35, 0.35))).normalize(); p = p.clone().addScaledVector(d, len / 4); pts.push(p); } tree.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, rad, 6, false), bark)); if (depth > 0) for (let k = 0; k < 2 + (depth > 1 ? 1 : 0); k++) branch(pts[2 + (k % 2)], d.clone().add(new T.Vector3(R(-1, 1), R(0, 0.6), R(-1, 1))).normalize(), len * 0.62, rad * 0.55, depth - 1); };
      branch(new T.Vector3(0, 0, 0), new T.Vector3(0.25, 1, 0), 6.5, 0.32, 3); }
    const fogs = []; { const ft = new T.CanvasTexture(fogCanvas()); for (let i = 0; i < 12; i++) { const f = new T.Mesh(new T.PlaneGeometry(14, 14), new T.MeshBasicMaterial({ map: ft, transparent: true, opacity: 0.16, depthWrite: false, color: 0x8aa894 })); f.rotation.x = -PI / 2; f.position.set(R(-14, 14), R(0.25, 0.9), R(2, 26)); f.rotation.z = R(0, TAU); scene.add(f); fogs.push({ f, b: f.position.clone(), k: R(0, 6) }); } }
    const wisps = []; for (let i = 0; i < 14; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0x9dff7a, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false })); s.scale.setScalar(R(0.3, 0.7)); s.position.set(R(-14, 14), R(0.4, 2.4), R(2, 22)); scene.add(s); wisps.push({ s, b: s.position.clone(), k: R(0, 6) }); }

    /* ---- the mausoleum: front wall with an arched door, columns, pediment with a carved skull, iron doors ---- */
    const mStone = stoneMat(0.3, 0.3, 0xc4bcb4);
    { const fw = new T.Shape(); fw.moveTo(-7.5, 0); fw.lineTo(7.5, 0); fw.lineTo(7.5, 7.5); fw.lineTo(-7.5, 7.5); fw.closePath(); const dh = new T.Path(); dh.moveTo(-1.25, 0); dh.lineTo(1.25, 0); dh.lineTo(1.25, 3.0); dh.absarc(0, 3.0, 1.25, 0, PI, false); dh.lineTo(-1.25, 0); fw.holes.push(dh);
      const front = new T.Mesh(new T.ExtrudeGeometry(fw, { depth: 0.8, bevelEnabled: false }), mStone); front.position.z = -0.8; scene.add(front);
      for (const x of [-7.9, 7.9]) { const s = new T.Mesh(new T.BoxGeometry(0.8, 7.5, 15), mStone); s.position.set(x, 3.75, -7.5); scene.add(s); }
      const back = new T.Mesh(new T.BoxGeometry(16.6, 7.5, 0.8), mStone); back.position.set(0, 3.75, -15.2); scene.add(back);
      const roof = new T.Mesh(new T.BoxGeometry(17.4, 0.7, 16.8), mStone); roof.position.set(0, 7.85, -7.3); scene.add(roof);
      const ped = new T.Shape(); ped.moveTo(-8.4, 0); ped.lineTo(8.4, 0); ped.lineTo(0, 3.0); ped.closePath(); const pm = new T.Mesh(new T.ExtrudeGeometry(ped, { depth: 1.2, bevelEnabled: false }), mStone); pm.position.set(0, 8.2, -0.4); scene.add(pm);
      for (const x of [-5.4, -2.3, 2.3, 5.4]) { const col = new T.Mesh(new T.CylinderGeometry(0.34, 0.38, 7.0, 18), mStone); col.position.set(x, 3.6, 0.55); scene.add(col); for (const y of [0.18, 7.1]) { const cap = new T.Mesh(new T.BoxGeometry(0.95, 0.36, 0.95), mStone); cap.position.set(x, y, 0.55); scene.add(cap); } }
      const steps = new T.Mesh(new T.BoxGeometry(6.4, 0.22, 1.4), mStone); steps.position.set(0, 0.11, 1.1); scene.add(steps);
      const carved = new T.Mesh(skullGeo(false, 0xbab2a6), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })); carved.position.set(0, 9.3, 0.95); carved.scale.setScalar(1.3); scene.add(carved);
      for (const sd of [-1, 1]) { const e = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0x7dff5a, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); e.position.set(sd * 0.23, 9.38, 1.55); e.scale.setScalar(0.55); scene.add(e); }
      const land = new T.Mesh(new T.BoxGeometry(4.4, 0.4, 3.9), stoneMat(0.6, 0.5, 0x8a8078)); land.position.set(0, -0.18, -2.75); scene.add(land); }
    const doorLeaves = []; const iron = new T.MeshStandardMaterial({ color: 0x2c2c34, metalness: 0.82, roughness: 0.46 });
    for (const sd of [-1, 1]) { const piv = new T.Group(); piv.position.set(sd * 1.25, 0, -0.35); scene.add(piv); const leaf = new T.Mesh(new T.BoxGeometry(1.24, 4.1, 0.12), iron); leaf.position.set(-sd * 0.62, 2.05, 0); piv.add(leaf);
      const riv = new T.InstancedMesh(new T.SphereGeometry(0.04, 6, 4), iron, 24), m = new T.Matrix4(); let c = 0; for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 4; xx++) m.makeTranslation(-sd * (0.12 + xx * 0.33), 0.35 + yy * 0.68, 0.07), riv.setMatrixAt(c++, m); piv.add(riv);
      const knock = new T.Mesh(new T.TorusGeometry(0.16, 0.035, 8, 20), new T.MeshStandardMaterial({ color: 0x8a7440, metalness: 1, roughness: 0.35 })); knock.position.set(-sd * 0.9, 1.9, 0.1); piv.add(knock);
      doorLeaves.push({ piv, sd }); }
    const doorGlow = new T.PointLight(0x7dff5a, 0, 16, 1.6); doorGlow.position.set(0, 1.6, -3.4); scene.add(doorGlow);
    const beam = new T.Mesh(new T.PlaneGeometry(2.4, 5.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shaftCanvas('150,255,120')), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); beam.position.set(0, 2.2, 0.6); beam.rotation.x = -0.35; scene.add(beam);
    const doorLamps = []; for (const sd of [-1, 1]) { const g = new T.Group(); g.position.set(sd * 1.95, 3.3, 0.35); scene.add(g); const cage = new T.Mesh(new T.CylinderGeometry(0.18, 0.14, 0.42, 6, 1, true), new T.MeshStandardMaterial({ color: 0x1c1c20, metalness: 0.7, roughness: 0.5, wireframe: true })); g.add(cage); const f = new T.Mesh(new T.ConeGeometry(0.09, 0.3, 10), new T.MeshBasicMaterial({ color: new T.Color(0.8, 3.0, 0.6), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); g.add(f); const gl = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0x8dff6a, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false })); gl.scale.setScalar(1.6); g.add(gl); doorLamps.push({ f, gl, k: R(0, 6) }); }

    /* ---- the shaft: stone walls (openings for the door and the gate, a rock shell outside), an OPEN WELL in the middle with
       a railing of bones, spiral steps ---- */
    const aEnd = TH0 + TURN, dE = new T.Vector3(-Math.sin(aEnd), 0, Math.cos(aEnd)), PE = new T.Vector3(C.x + RCAM * Math.cos(aEnd), 1.7 - H, C.z + RCAM * Math.sin(aEnd));
    const gateS = Math.sqrt(6.4 * 6.4 - RCAM * RCAM), G = PE.clone().addScaledVector(dE, gateS); const phiG = Math.atan2(G.z - C.z, G.x - C.x);
    const cyl = (y0, y1, gapAt, gapW, radius, outer) => { const h = y1 - y0; const th = gapAt == null ? 0 : (PI / 2 - gapAt) + gapW / 2, len = gapAt == null ? TAU : TAU - gapW; const geo = new T.CylinderGeometry(radius, radius, h, 72, 1, true, th, len); const m = new T.Mesh(geo, stoneMat(9, h / 4.5, outer ? 0x6a625a : 0x9a9088, outer ? T.FrontSide : T.BackSide)); m.position.set(C.x, (y0 + y1) / 2, C.z); scene.add(m); };
    cyl(-1, 7.5, PI / 2, 0.42, 6.4); cyl(-22.4, -1, null, 0, 6.4); cyl(-28.3, -22.4, phiG, 0.95, 6.4);   /* the shaft */
    cyl(-60, -28.3, null, 0, 6.9, true); cyl(-28.3, -22.4, phiG, 0.95, 6.9, true); cyl(-22.4, -2, null, 0, 6.9, true);   /* its rock shell, seen from the necropolis */
    { const sh = new T.Shape(), ri = WELL, ro = 6.36, hw = DA * 0.53; sh.moveTo(ri * Math.cos(-hw), ri * Math.sin(-hw)); sh.absarc(0, 0, ro, -hw, hw, false); sh.lineTo(ri * Math.cos(hw), ri * Math.sin(hw)); sh.absarc(0, 0, ri, hw, -hw, true);
      const wedge = new T.ExtrudeGeometry(sh, { depth: 0.36, bevelEnabled: false, curveSegments: 3 }); wedge.rotateX(PI / 2);
      const n = Math.floor(TURN / DA) + 1, steps = new T.InstancedMesh(wedge, stoneMat(0.5, 0.5, 0x9a9088), n), m = new T.Matrix4(), q = new T.Quaternion();
      for (let k = 0; k < n; k++) { const a = k * DA; q.setFromAxisAngle(UP, -(TH0 + a)); m.compose(new T.Vector3(C.x, -a / TURN * H, C.z), q, new T.Vector3(1, 1, 1)); steps.setMatrixAt(k, m); } scene.add(steps);
      const bottom = new T.Mesh(new T.CircleGeometry(6.5, 48), stoneMat(1.4, 1.4, 0x6a625a)); bottom.rotation.x = -PI / 2; bottom.position.set(C.x, -H - 0.02, C.z); scene.add(bottom);
      const glowPool = new T.Mesh(new T.CircleGeometry(WELL * 0.95, 32), new T.MeshBasicMaterial({ color: new T.Color(0.6, 2.4, 0.5) })); glowPool.rotation.x = -PI / 2; glowPool.position.set(C.x, -H + 0.01, C.z); scene.add(glowPool); }
    const stepY = a => -clamp(a, 0, TURN) / TURN * H;
    const boneMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 });
    { const skG = skullGeo(true, 0xcdc1a4), feG = femurGeo(), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
      /* the ossuary walls, in height bands so the bands out of view are culled */
      const BAND = 6, ROWS = 32, PER = 56, PERF = 42;
      const inGap = (phi, y) => { const d = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))); return (y > -1.2 && d(phi, PI / 2) < 0.3) || (y < -22.6 && d(phi, phiG) < 0.55); };
      for (let b0 = 0; b0 < ROWS; b0 += BAND) { const sk = [], fe = [];
        for (let r = b0; r < Math.min(ROWS, b0 + BAND); r++) { const y = 6.6 - r * 1.3;
          for (let j = 0; j < PER; j++) { const phi = (j + (r % 2) * 0.5) / PER * TAU; if (inGap(phi, y)) continue; const a = Math.atan2(-Math.cos(phi), -Math.sin(phi)); e.set(R(-0.15, 0.1), a + R(-0.18, 0.18), R(-0.08, 0.08)); q.setFromEuler(e); m.compose(new T.Vector3(C.x + 6.12 * Math.cos(phi), y + R(-0.04, 0.04), C.z + 6.12 * Math.sin(phi)), q, new T.Vector3(1, 1, 1).multiplyScalar(R(0.46, 0.54))); sk.push(m.clone()); }
          for (let j = 0; j < PERF; j++) { const phi = (j + (r % 2) * 0.5) / PERF * TAU, y2 = y - 0.66; if (inGap(phi, y2)) continue; const a = Math.atan2(-Math.cos(phi), -Math.sin(phi)); for (const dy of [-0.09, 0.09]) { e.set(R(-0.05, 0.05), a + R(-0.06, 0.06), R(-0.04, 0.04)); q.setFromEuler(e); m.compose(new T.Vector3(C.x + 6.24 * Math.cos(phi), y2 + dy, C.z + 6.24 * Math.sin(phi)), q, new T.Vector3(1, 1, 1)); fe.push(m.clone()); } } }
        const a = new T.InstancedMesh(skG, boneMat, sk.length); sk.forEach((mm, i) => a.setMatrixAt(i, mm)); scene.add(a);
        const f = new T.InstancedMesh(feG, boneMat, fe.length); fe.forEach((mm, i) => f.setMatrixAt(i, mm)); scene.add(f); }
      /* the railing round the open well: a femur post on every step, a skull on every third, a bone handrail */
      const n = Math.floor(TURN / DA) + 1, posts = new T.InstancedMesh(feG, boneMat, n), caps = new T.InstancedMesh(skG, boneMat, Math.ceil(n / 5)), rail = []; let ci = 0;
      for (let k = 0; k < n; k++) { const a = k * DA, th = TH0 + a, p = new T.Vector3(C.x + (WELL + 0.12) * Math.cos(th), stepY(a) + 0.42, C.z + (WELL + 0.12) * Math.sin(th)); m.compose(p, q.setFromEuler(new T.Euler(0, 0, PI / 2)), new T.Vector3(1.05, 1, 1)); posts.setMatrixAt(k, m); rail.push(p.clone().add(new T.Vector3(0, 0.44, 0))); if (k % 5 === 0) { m.compose(p.clone().add(new T.Vector3(0, 0.6, 0)), q.setFromAxisAngle(UP, Math.atan2(Math.cos(th), Math.sin(th))), new T.Vector3(1, 1, 1).multiplyScalar(0.27)); caps.setMatrixAt(ci++, m); } }
      caps.count = ci; scene.add(posts); scene.add(caps); scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rail), 400, 0.05, 6, false), new T.MeshStandardMaterial({ color: 0xe0d4b6, roughness: 0.6 }))); }
    /* candles on brackets: they light themselves as you come down (and go out behind you going up) */
    const candles = [], flameM = new T.MeshBasicMaterial({ color: new T.Color(3.2, 1.9, 0.7), transparent: true, blending: T.AdditiveBlending, depthWrite: false }), waxM = new T.MeshStandardMaterial({ color: 0xefe6d0, roughness: 0.6 }), bracketM = stoneMat(0.4, 0.4, 0x8a8278);
    for (let a = 0.45; a < TURN - 0.2; a += 0.5) { const th = TH0 + a, g = new T.Group(); g.position.set(C.x + 5.75 * Math.cos(th), stepY(a) + 1.35, C.z + 5.75 * Math.sin(th)); scene.add(g); const br = new T.Mesh(new T.BoxGeometry(0.46, 0.12, 0.46), bracketM); br.position.y = -0.24; g.add(br); const w = new T.Mesh(new T.CylinderGeometry(0.075, 0.08, 0.36, 10), waxM); g.add(w); const f = new T.Mesh(new T.ConeGeometry(0.06, 0.2, 10), flameM); f.position.y = 0.3; g.add(f); const gl = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffa850, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false })); gl.position.y = 0.3; gl.scale.setScalar(1.1); g.add(gl); candles.push({ a, g, f, gl, on: up ? 1 : 0, lit: !!up, k: R(0, 6) }); }
    const candleLights = [0, 1, 2].map(() => { const l = new T.PointLight(0xffb45a, 0, 7, 2); scene.add(l); return l; });
    /* skulls that turn to watch you */
    const watchers = []; { const g = skullGeo(false, 0xeae0c6), mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
      for (let a = 1.35; a < TURN - 0.8; a += 1.25) { const th = TH0 + a + 0.25, root = new T.Group(); root.position.set(C.x + 5.72 * Math.cos(th), stepY(a) + 2.05, C.z + 5.72 * Math.sin(th)); scene.add(root); const s = new T.Mesh(g, mat); s.scale.setScalar(0.62); root.add(s); for (const sd of [-1, 1]) { const e = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0x8dff5a, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); e.position.set(sd * 0.11, 0.04, 0.27); e.scale.setScalar(0.22); s.add(e); } root.lookAt(C.x, root.position.y, C.z); watchers.push({ root, rest: root.quaternion.clone() }); } }
    /* the waving skeleton hand */
    const hand = new T.Group(); const aHand = 3.6, arm = new T.Group(); hand.add(arm); const fingers = [];
    { const bm = new T.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.55 }); const th = TH0 + aHand + 0.2; hand.position.set(C.x + 6.2 * Math.cos(th), stepY(aHand) + 1.7, C.z + 6.2 * Math.sin(th)); hand.lookAt(C.x, hand.position.y, C.z); scene.add(hand);
      for (const sd of [-1, 1]) { const b = new T.Mesh(new T.CylinderGeometry(0.03, 0.035, 0.85, 6), bm); b.rotation.x = PI / 2; b.position.set(sd * 0.045, 0, 0.42); arm.add(b); }
      const wrist = new T.Group(); wrist.position.z = 0.86; arm.add(wrist); const palm = new T.Mesh(new T.BoxGeometry(0.26, 0.05, 0.24), bm); palm.position.z = 0.13; wrist.add(palm);
      for (let i = 0; i < 5; i++) { const thumb = i === 4, base = new T.Group(); base.position.set(thumb ? 0.15 : -0.1 + i * 0.066, 0, thumb ? 0.08 : 0.25); if (thumb) base.rotation.y = -0.7; wrist.add(base); let parent = base; const segs = thumb ? [0.09, 0.07] : [0.11, 0.08, 0.06];
        for (const L of segs) { const j = new T.Group(); parent.add(j); const s = new T.Mesh(new T.CylinderGeometry(0.018, 0.02, L, 5), bm); s.rotation.x = PI / 2; s.position.z = L / 2; j.add(s); const nx = new T.Group(); nx.position.z = L; j.add(nx); fingers.push(j); parent = nx; } }
      arm.position.z = -1.5; hand.userData.wrist = wrist; }
    let ghost = null; if (window.KQCast) { try { const c = KQCast.build('ruins', { lod: 0.7 }); c.root.visible = false; scene.add(c.root); ghost = c; } catch (e) {} }
    const bats = makeBats(scene, 18);
    /* ---- the gate of bones, the ledge, and the necropolis below it in a vast cavern ---- */
    const gate = new T.Group(); gate.position.copy(G).setY(-H); gate.lookAt(G.clone().addScaledVector(dE, -1).setY(-H)); scene.add(gate);
    const gateLeaves = []; { const skG = skullGeo(false, 0xe2d6ba), feG = femurGeo(), bm2 = boneMat;
      const arch = new T.InstancedMesh(skG, bm2, 15), m = new T.Matrix4(), q = new T.Quaternion(); for (let i = 0; i < 15; i++) { const a = PI * i / 14, p = new T.Vector3(Math.cos(a) * 1.95, 3.1 + Math.sin(a) * 1.95, 0.1); m.compose(p, q.setFromEuler(new T.Euler(0, 0, a - PI / 2)), new T.Vector3(1, 1, 1).multiplyScalar(0.55)); arch.setMatrixAt(i, m); } gate.add(arch);
      const posts = new T.InstancedMesh(feG, bm2, 16); let c = 0; for (const sd of [-1, 1]) for (let k = 0; k < 8; k++) { m.compose(new T.Vector3(sd * 1.95, 0.25 + k * 0.4, 0.1), q.setFromEuler(new T.Euler(0, 0, PI / 2 + R(-0.06, 0.06))), new T.Vector3(1, 1, 1)); posts.setMatrixAt(c++, m); } gate.add(posts);
      for (const sd of [-1, 1]) { const piv = new T.Group(); piv.position.set(sd * 1.8, 0, 0); gate.add(piv); const bars = new T.InstancedMesh(feG, bm2, 14); let k = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { m.compose(new T.Vector3(-sd * (0.25 + i * 0.42), 0.55 + j * 0.9, 0), q.setFromEuler(new T.Euler(0, 0, PI / 2)), new T.Vector3(1, 1.3, 1)); bars.setMatrixAt(k++, m); } for (const y of [0.9, 2.3]) { m.compose(new T.Vector3(-sd * 0.88, y, 0.06), q.setFromEuler(new T.Euler(0, 0, 0)), new T.Vector3(2.2, 1, 1)); bars.setMatrixAt(k++, m); } bars.count = k; piv.add(bars); const sk = new T.Mesh(skG, bm2); sk.position.set(-sd * 0.9, 1.6, 0.12); sk.scale.setScalar(0.5); piv.add(sk); gateLeaves.push({ piv, sd }); } }
    const gateGlow = new T.PointLight(0x7dff62, 0, 40, 1.4); gateGlow.position.copy(G).addScaledVector(dE, 0.8).setY(-H + 3.4); scene.add(gateGlow);
    const LEDGE = 6.2, FLOOR = -H - 24, side = new T.Vector3().crossVectors(dE, UP).normalize();
    const vista = new T.Group(); scene.add(vista);
    { const ledge = new T.Mesh(new T.BoxGeometry(5.2, 1.2, LEDGE + 0.6), stoneMat(1, 1.4, 0x8a8078)); ledge.position.copy(G).addScaledVector(dE, LEDGE / 2 + 0.1).setY(-H - 0.6); ledge.lookAt(ledge.position.clone().add(dE)); scene.add(ledge);
      const edge = G.clone().addScaledVector(dE, LEDGE).setY(-H), feG = femurGeo(), skG = skullGeo(false, 0xe6dac0), bal = new T.InstancedMesh(feG, boneMat, 9), bsk = new T.InstancedMesh(skG, boneMat, 3), m = new T.Matrix4(), q = new T.Quaternion(); for (let i = 0; i < 9; i++) { m.compose(edge.clone().addScaledVector(side, -2.3 + i * 0.575).add(new T.Vector3(0, 0.45, 0)), q.setFromEuler(new T.Euler(0, 0, PI / 2)), new T.Vector3(1.1, 1, 1)); bal.setMatrixAt(i, m); } for (let i = 0; i < 3; i++) { m.compose(edge.clone().addScaledVector(side, -2.3 + i * 2.3).add(new T.Vector3(0, 1.02, 0)), q.setFromUnitVectors(new T.Vector3(0, 0, 1), dE.clone().negate()), new T.Vector3(1, 1, 1).multiplyScalar(0.42)); bsk.setMatrixAt(i, m); } scene.add(bal); scene.add(bsk);
      const railPts = [edge.clone().addScaledVector(side, -2.4).add(new T.Vector3(0, 0.88, 0)), edge.clone().addScaledVector(side, 2.4).add(new T.Vector3(0, 0.88, 0))]; scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(railPts), 4, 0.05, 6, false), new T.MeshStandardMaterial({ color: 0xe0d4b6, roughness: 0.6 })));
      const center = G.clone().addScaledVector(dE, 60).setY(FLOOR);
      const rockC = stoneCanvas('#3a3430', ['#443c36', '#2e2824', '#3c3530']), rockT = tex(rockC, 14, 6), dome = new T.Mesh(new T.SphereGeometry(1, 64, 32), new T.MeshStandardMaterial({ map: rockT, color: 0x9a9088, roughness: 1, side: T.BackSide })); dome.scale.set(110, 44, 110); dome.position.copy(center).setY(FLOOR); vista.add(dome);
      const ground = new T.Mesh(new T.CircleGeometry(112, 64), new T.MeshStandardMaterial({ map: tex(grassCanvas(), 9, 9), color: 0x5a6a5a, roughness: 1 })); ground.rotation.x = -PI / 2; ground.position.copy(center).setY(FLOOR); vista.add(ground);
      const cliff = new T.Mesh(new T.CylinderGeometry(9, 12, 24, 24, 1, true), stoneMat(4, 3, 0x6a625a)); cliff.position.copy(C).setY(FLOOR + 12); vista.add(cliff);
      /* the glowing river winding through the city */
      const rp = []; for (let i = 0; i <= 20; i++) { const k = i / 20; rp.push(G.clone().addScaledVector(dE, 12 + k * 90).addScaledVector(side, Math.sin(k * 7) * 16 + (k - 0.5) * 20).setY(FLOOR + 0.06)); } const rc = new T.CatmullRomCurve3(rp), rpos = [], rid = []; for (let i = 0; i <= 160; i++) { const p = rc.getPointAt(i / 160), tg = rc.getTangentAt(i / 160), sd = new T.Vector3(-tg.z, 0, tg.x).normalize(), w = 2.2 + Math.sin(i * 0.3) * 0.5; rpos.push(p.x + sd.x * w, p.y, p.z + sd.z * w, p.x - sd.x * w, p.y, p.z - sd.z * w); if (i < 160) { const a = i * 2; rid.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(rpos, 3)); rg.setIndex(rid); vista.add(new T.Mesh(rg, new T.MeshBasicMaterial({ color: new T.Color(0.5, 2.4, 0.6), side: T.DoubleSide })));
      const place = (geo, n, scale, rMin, rMax, mat) => { const im = new T.InstancedMesh(geo, mat || new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), n), mm = new T.Matrix4(); for (let i = 0; i < n; i++) { const d = R(rMin, rMax), s = R(-40, 40), p = G.clone().addScaledVector(dE, d).addScaledVector(side, s).setY(FLOOR); mm.compose(p, new T.Quaternion().setFromAxisAngle(UP, Math.atan2(-dE.x, -dE.z) + R(-0.5, 0.5)), new T.Vector3(1, 1, 1).multiplyScalar(R(scale[0], scale[1]))); im.setMatrixAt(i, mm); } vista.add(im); return im; };
      place(tinyTombGeo(), 46, [0.9, 1.6], 14, 85); place(crossGeo(), 40, [1.2, 1.8], 12, 80);
      const ob = place(new T.CylinderGeometry(0.1, 0.9, 7, 4), 10, [0.8, 1.3], 20, 90, stoneMat(1, 2, 0x5a5860)); ob.position.y = 3.2;
      { const skL = skullGeo(true, 0xdcd0b4), piles = new T.InstancedMesh(skL, boneMat, 420), mm = new T.Matrix4(); let k = 0; for (let pI = 0; pI < 7; pI++) { const c = G.clone().addScaledVector(dE, R(18, 70)).addScaledVector(side, R(-30, 30)).setY(FLOOR); const nn = 60; for (let i = 0; i < nn; i++) { const r = Math.pow(Math.random(), 0.6) * 4, a = R(0, TAU), hgt = (4 - r) * 0.7; mm.compose(c.clone().add(new T.Vector3(Math.cos(a) * r, R(0, hgt) + 0.2, Math.sin(a) * r)), new T.Quaternion().setFromEuler(new T.Euler(R(-0.6, 0.6), R(0, TAU), R(-0.4, 0.4))), new T.Vector3(1, 1, 1).multiplyScalar(R(0.55, 0.8))); piles.setMatrixAt(k++, mm); } } vista.add(piles); }
      { const cn = new T.InstancedMesh(new T.SphereGeometry(0.16, 6, 4), new T.MeshBasicMaterial({ color: new T.Color(2.8, 2.6, 0.9) }), 60), mm = new T.Matrix4(); for (let i = 0; i < 60; i++) { mm.makeTranslation(...G.clone().addScaledVector(dE, R(12, 90)).addScaledVector(side, R(-40, 40)).setY(FLOOR + R(0.4, 2.6)).toArray()); cn.setMatrixAt(i, mm); } vista.add(cn); }
      { const st = new T.InstancedMesh(new T.ConeGeometry(1, 1, 7), new T.MeshStandardMaterial({ map: rockT, color: 0x6a625a, roughness: 1 }), 70), mm = new T.Matrix4(); for (let i = 0; i < 70; i++) { const p = G.clone().addScaledVector(dE, R(5, 110)).addScaledVector(side, R(-80, 80)); const h = R(4, 14); mm.compose(p.setY(FLOOR + 40 - h / 2 - R(0, 6)), new T.Quaternion().setFromEuler(new T.Euler(PI, 0, 0)), new T.Vector3(R(1, 2.4), h, R(1, 2.4))); st.setMatrixAt(i, mm); } vista.add(st); }
      const dark = new T.MeshStandardMaterial({ map: rockT, color: 0x4a4440, roughness: 1 }); const mtn = new T.Mesh(new T.ConeGeometry(30, 38, 12), dark); mtn.position.copy(G).addScaledVector(dE, 92).setY(FLOOR + 19); vista.add(mtn);
      const big = new T.Mesh(skullGeo(false, 0x8a8274), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })); big.position.copy(mtn.position).addScaledVector(dE, -15).setY(FLOOR + 22); big.scale.setScalar(13); big.lookAt(G.clone().setY(FLOOR + 22)); vista.add(big);
      for (const sd of [-1, 1]) { const e = new T.Sprite(new T.SpriteMaterial({ map: soft, color: new T.Color(0.9, 3.0, 0.6), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); e.position.copy(big.position).addScaledVector(side, sd * 2.5).addScaledVector(dE, -6.5).add(new T.Vector3(0, 0.9, 0)); e.scale.setScalar(5.5); vista.add(e); }
      const halo = new T.Sprite(new T.SpriteMaterial({ map: soft, color: new T.Color(0.6, 1.6, 0.5), transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false, fog: false })); halo.position.copy(mtn.position).add(new T.Vector3(0, 6, 0)).addScaledVector(dE, 12); halo.scale.setScalar(90); vista.add(halo);
      const cityL = new T.PointLight(0x7dff62, 480, 160, 1.2); cityL.position.copy(G).addScaledVector(dE, 45).setY(FLOOR + 14); vista.add(cityL);
    }

    /* ---- the camera path: graveyard → door → landing → down the helix → gate → out onto the ledge (reversed going up) ---- */
    const pts = [new T.Vector3(0, 1.9, 15.5), new T.Vector3(0, 1.8, 10.5), new T.Vector3(0, 1.7, 5.0), new T.Vector3(0, 1.7, 0.2), new T.Vector3(0, 1.7, -2.4)];
    const iDoor = 3, iHelix = pts.length; for (let a = 0; a <= TURN + 1e-6; a += 0.3) { const th = TH0 + a; pts.push(new T.Vector3(C.x + RCAM * Math.cos(th), 1.7 - a / TURN * H, C.z + RCAM * Math.sin(th))); }
    const iEnd = pts.length - 1; pts.push(PE.clone().addScaledVector(dE, 2.8)); const iGate = pts.length; pts.push(G.clone()); pts.push(G.clone().addScaledVector(dE, LEDGE * 0.4)); pts.push(G.clone().addScaledVector(dE, LEDGE - 2.0));
    const iLedge = pts.length - 1; if (!up) { pts.push(G.clone().addScaledVector(dE, LEDGE + 1.2).setY(-H + 2.7)); pts.push(G.clone().addScaledVector(dE, LEDGE + 8.5).setY(-H + 1.0)); pts.push(G.clone().addScaledVector(dE, LEDGE + 17).setY(-H - 3.0)); }   /* down: no stopping on the ledge — over the bone rail and out towards the city's light */
    const path = new T.CatmullRomCurve3(pts, false, 'centripetal'), DIV = 3000, Ls = path.getLengths(DIV), LEN = Ls[DIV]; const uOf = i => Ls[Math.round(i / (pts.length - 1) * DIV)] / LEN;
    const KF = up ? [[0, 0], [1.3, 1 - uOf(iGate)], [2.2, 1 - uOf(iEnd)], [8.8, 1 - uOf(iHelix)], [9.6, 1 - uOf(iDoor)], [12.6, 1]]
                  : [[0, 0], [1.0, 0.003], [3.4, uOf(iDoor)], [4.0, uOf(iHelix)], [10.0, uOf(iEnd)], [10.9, uOf(iGate) - 0.003], [12.0, uOf(iLedge)], [DUR + 0.8, 1]];   /* still gliding while the view fades (finish) */
    const uAt = t => { for (let i = 1; i < KF.length; i++) if (t <= KF[i][0]) { const a = KF[i - 1], b = KF[i]; return lerp(a[1], b[1], (t - a[0]) / (b[0] - a[0])); } return KF[KF.length - 1][1]; };
    const P = u => path.getPointAt(clamp(up ? 1 - u : u, 0, 1));
    const camPos = new T.Vector3(), camLook = new T.Vector3(), tgtLook = new T.Vector3(), tmp = new T.Vector3(), cityView = G.clone().addScaledVector(dE, 70).setY(FLOOR + 6);
    let first = true, stepPh = 0, lastPos = null, dripT = 5, doorOpen = up ? 1 : 0, gateOpen = up ? 1 : 0, doorThud = false, gateRumbled = false, closedBehind = false, ghostOn = false, batsOn = false, whooshed = false, whisper = null;
    const aud = snd ? { wind: snd.loop({ type: 'bandpass', freq: 420, q: 5, gain: 0.07 }), pad: snd.pad([55, 55.4, 82.4, 110.3], 'triangle', 520) } : null;
    if (snd) { whisper = snd.loop({ white: true, type: 'bandpass', freq: 2600, q: 2.5, gain: 0 }); if (!up) setTimeout(() => SND.doorCreak(snd), 700); }
    const helixA = pos => { const a = Math.atan2(pos.z - C.z, pos.x - C.x) - TH0; const k = ((a % TAU) + TAU) % TAU; const turns = Math.round(((1.7 - pos.y) / H * TURN - k) / TAU); return clamp(k + turns * TAU, -1, TURN + 1); };

    const wellK = () => 0;   /* (a lean-over-the-well shot was tried and dropped: the railing fills the frame) */
    function update(t, dt) {
      const u = uAt(t), p = P(u), wl = wellK(t);
      tgtLook.copy(P(clamp(u + 3.4 / LEN, 0, 1)));
      if (wl > 0) { p.x += (C.x - p.x) * 0.3 * wl; p.z += (C.z - p.z) * 0.3 * wl; }   /* lean over the bone railing */
      const inHelix = p.y < -0.5 && p.y > -H + 0.5; if (inHelix) tgtLook.y += up ? 0.9 : -0.8;
      if (!up) {
        tgtLook.lerp(tmp.set(0, 4.2, 0), 1 - smooth(1.0, 2.8, t));   /* the whole mausoleum first, carved skull and all */
        if (wl > 0) tgtLook.lerp(tmp.set(C.x + (C.x - camPos.x) * 0.15, camPos.y - 22, C.z + (C.z - camPos.z) * 0.15), wl * 0.92);   /* straight down the open well, just as the bats come flying up it */
        const gz = smooth(10.2, 10.8, t) * (1 - smooth(11.2, 11.8, t)); if (gz > 0) tgtLook.lerp(tmp.copy(G).setY(-H + 2.6), gz * 0.6);
        tgtLook.lerp(cityView, smooth(11.2, 12.2, t));   /* out over the necropolis */
      } else {
        const back = 1 - smooth(0.6, 1.4, t); if (back > 0) tgtLook.lerp(tmp.copy(G).setY(-H + 2.4), back);
        if (wl > 0) tgtLook.lerp(tmp.set(C.x, camPos.y - 18, C.z), wl * 0.8);
        tgtLook.lerp(tmp.set(0, 9, 60), smooth(DUR - 2.4, DUR - 0.8, t));
      }
      if (first) { camPos.copy(p); camLook.copy(tgtLook); first = false; }
      camPos.lerp(p, 1 - Math.exp(-dt * 9)); camLook.lerp(tgtLook, 1 - Math.exp(-dt * 5));
      if (lastPos) stepPh += camPos.distanceTo(lastPos) / 0.72 * PI; lastPos = (lastPos || new T.Vector3()).copy(camPos);
      const fly = !up && t > 12.0;   /* off the ledge: gliding, so no footsteps and no walking bob */
      camera.position.copy(camPos).add(tmp.set(0, fly ? 0 : Math.abs(Math.sin(stepPh)) * 0.07 - 0.035, 0)); camera.up.copy(UP); camera.lookAt(camLook);
      sky.position.copy(camera.position);
      if (snd && update.lastStep !== Math.floor(stepPh / PI)) { if (update.lastStep != null && t > 0.8 && !fly) SND.step(snd, camPos.z < -0.5); update.lastStep = Math.floor(stepPh / PI); }
      /* inside / outside / bottom */
      const kin = smooth(0.5, -2.5, camPos.z), kbot = smooth(-16, -26, camPos.y), kout = smooth(0.5, 3, camPos.distanceTo(tmp.set(C.x, camPos.y, C.z)) - 6.4) * kbot;
      scene.fog.color.copy(FOG_OUT).lerp(FOG_IN, kin).lerp(FOG_GREEN, kbot); scene.fog.density = 0.026 + 0.03 * kin - 0.04 * kbot - 0.01 * kout;
      const under = camPos.y < -6; sky.visible = moonS.visible = moonD.visible = dawn.visible = !under; vista.visible = camPos.y < -10; scene.background.setHex(under ? 0x061006 : 0x0a0e18);
      hemi.intensity = 0.9 * (1 - kin) + 0.07; moonL.intensity = 1.6 * (1 - kin); fillL.intensity = 1.8 * (1 - kin); lantern.position.copy(camera.position).add(tmp.set(0.3, -0.2, 0)); lantern.intensity = 8 * kin * (1 - kout) * (1 - 0.75 * wl);
      doom.intensity = 40 * smooth(-4, -26, camPos.y); if (snd) snd.wet(0.06 + 0.4 * kin);
      /* the doors */
      if (!up) { const k = smooth(0.8, 2.3, t); doorOpen = k * k * (3 - 2 * k); if (!doorThud && t > 2.3) { doorThud = true; if (snd) SND.thud(snd); } }
      else { const k = smooth(10.6, 11.6, t); doorOpen = 1 - k; if (!closedBehind && t > 11.6) { closedBehind = true; if (snd) SND.thud(snd); } }
      for (const d of doorLeaves) d.piv.rotation.y = -d.sd * 1.75 * doorOpen;   /* both leaves swing inward */
      doorGlow.intensity = 34 * doorOpen; beam.material.opacity = 0.32 * doorOpen * smooth(0.6, 3.5, camPos.z);
      for (const l of doorLamps) { const fl = 0.8 + 0.3 * Math.sin(t * 13 + l.k) * Math.sin(t * 7 + l.k); l.f.scale.set(1, fl, 1); l.gl.material.opacity = 0.6 + 0.2 * fl; }
      for (const w of wisps) { w.s.position.set(w.b.x + Math.sin(t * 0.7 + w.k) * 1.2, w.b.y + Math.sin(t * 1.3 + w.k) * 0.4, w.b.z + Math.cos(t * 0.5 + w.k) * 1.2); w.s.material.opacity = 0.45 + 0.3 * Math.sin(t * 2 + w.k); }
      for (const f of fogs) { f.f.position.x = f.b.x + Math.sin(t * 0.15 + f.k) * 2; f.f.rotation.z += dt * 0.03; }
      /* candles */
      const aCam = helixA(camPos); const lit = [];
      for (const c of candles) { const want = up ? (aCam > c.a - 0.7 ? 1 : 0) : (aCam > c.a - 1.1 && camPos.z < 0 ? 1 : 0); if (want && !c.lit) { c.lit = true; if (snd && !up) SND.ignite(snd); } if (!want && c.lit && up) c.lit = false; c.on += ((c.lit ? 1 : 0) - c.on) * (1 - Math.exp(-dt * 7)); const fl = (0.85 + 0.25 * Math.sin(t * 14 + c.k) * Math.sin(t * 9 + c.k)) * c.on; c.f.scale.set(Math.max(0.001, c.on), Math.max(0.001, fl), Math.max(0.001, c.on)); c.gl.material.opacity = 0.75 * c.on; c.gl.scale.setScalar(0.4 + 0.8 * c.on); if (c.on > 0.05) lit.push(c); }
      lit.sort((a, b) => a.g.position.distanceToSquared(camPos) - b.g.position.distanceToSquared(camPos));
      candleLights.forEach((l, i) => { const c = lit[i]; if (!c) { l.intensity = 0; return; } l.position.copy(c.g.position).y += 0.35; l.intensity = 6 * c.on * (0.85 + 0.15 * Math.sin(t * 17 + c.k)); });
      /* watchers */
      const o = update.o || (update.o = new T.Object3D()); for (const w of watchers) { const d = w.root.position.distanceTo(camPos); o.position.copy(w.root.position); o.lookAt(camPos); const target = w.rest.clone().slerp(o.quaternion, smooth(8, 4, d)); w.root.quaternion.slerp(target, 1 - Math.exp(-dt * 5)); }
      /* the hand */
      { const q = up ? -1 : (aCam - (aHand - 1.2)) / 2.4; const ext = q < 0 || q > 1 ? 0 : smooth(0, 0.22, q) * (1 - smooth(0.78, 1, q)); arm.position.z = -1.5 + 1.4 * ext; const wv = Math.sin(t * 7) * ext; hand.userData.wrist.rotation.y = wv * 0.6; hand.userData.wrist.rotation.x = -0.4 * ext; fingers.forEach((f, i) => { f.rotation.x = (0.25 + 0.35 * Math.sin(t * 9 + i * 0.7)) * ext; }); if (ext > 0.5 && !update.rattled) { update.rattled = true; if (snd) SND.rattle(snd); } }
      /* the ghost knight drifts across the open well */
      const gT = up ? 5.2 : 6.6; if (ghost && !ghostOn && t > gT) { ghostOn = true; ghost.root.visible = true; ghost.t0 = t; if (snd) SND.ghost(snd); }
      if (ghost && ghostOn) { const q = (t - ghost.t0) / 2.8; if (q > 1) ghost.root.visible = false; else { const th = TH0 + aCam + (up ? -1 : 1) * 1.3, r0 = 4.8 - q * 9.6; ghost.root.position.set(C.x + r0 * Math.cos(th), camPos.y + (up ? 1.6 : -2.2) + Math.sin(q * PI) * 0.8, C.z + r0 * Math.sin(th)); ghost.root.lookAt(camPos); ghost.root.scale.setScalar(1.15); ghost.update(dt); } }
      /* bats flutter up the well */
      const bT = up ? 4.0 : 7.5; if (!batsOn && t > bT) { batsOn = true; bats.forEach((b, i) => { b.t0 = t + i * 0.05; b.r = R(2.6, 5.2); b.ph = helixA(camPos) + TH0 + R(0.4, 1.4); b.y0 = camPos.y - 7 - R(0, 3); b.b.visible = true; }); if (snd) SND.squeak(snd); }
      if (batsOn) for (const b of bats) { const q = t - b.t0; if (q < 0) continue; if (q > 2.8) { b.b.visible = false; continue; } const th = b.ph + q * 1.8; b.b.position.set(C.x + b.r * Math.cos(th), b.y0 + q * 7.5, C.z + b.r * Math.sin(th)); b.b.lookAt(camPos); flap(b, t); }
      /* drips and whispers */
      if (snd && kin > 0.5 && t > dripT) { dripT = t + R(0.9, 2.2); SND.drip(snd); }
      if (whisper) { const k = smooth(0, 1, Math.sin(clamp((t - (up ? 3 : 4.6)) / 3.4, 0, 1) * PI)); whisper.set(0.06 * k * (0.5 + 0.5 * Math.sin(t * 23)) * (0.5 + 0.5 * Math.sin(t * 7.3)), 2200 + 900 * Math.sin(t * 3), 0.03); }
      if (aud) { aud.wind.set(0.08 * (1 - kin) + 0.012, 380 + 60 * Math.sin(t * 0.7) + 30 * Math.sin(t * 1.9), 0.3); aud.pad.set(0.05 * kin + 0.05 * kbot); }
      /* the gate */
      if (!up) { const k = smooth(9.3, 10.6, t); gateOpen = k; if (!gateRumbled && t > 9.3) { gateRumbled = true; if (snd) { SND.rumble(snd); SND.rattle(snd); } } }
      for (const g of gateLeaves) g.piv.rotation.y = -g.sd * 1.6 * gateOpen;   /* away from you, onto the ledge */
      gateGlow.intensity = 14 * (0.25 + 0.75 * gateOpen) * smooth(-12, -24, camPos.y);
      /* the finale: the city of skulls, then its green light fills the view (down) / out into the dawn (up) */
      if (!up) { renderer.toneMappingExposure = 1.1 + 2.4 * smooth(DUR - 0.9, DUR, t); if (!whooshed && t > 12.0) { whooshed = true; if (snd) SND.whoosh(snd); } }
      else { const k = smooth(DUR - 3.2, DUR - 0.4, t); dawn.material.opacity = k; hemi.intensity += k * 0.6; if (post && k > 0.15 && !update.warm) { update.warm = true; post.setGrade('warm'); } }
    }
    return { dur: DUR, update, endColor: () => up ? '#fff1dc' : '#0e2c0e' };
  }
  crypt.grade = 'skull';

  const SCENES = { pirate: maelstrom, skull: crypt };

  function play(opts, done) {
    opts = opts || {}; const up = opts.dir === 'up', realm = up ? (opts.from || 'skull') : (opts.to || 'pirate'), build = SCENES[realm] || maelstrom;
    const S = stage(opts, build.grade); if (!S) { done && done(); return; }
    const snd = audioCore(), sc = build(S, up, snd), { ov, note, renderer, camera, post, scene } = S;
    let t = 0, raf = 0, alive = true, finished = false; const clock = new T.Clock();
    const I = window.KQ && KQ.intro, rid = 'ride:' + realm + ':' + (up ? 'up' : 'down');   /* KQ.intro: what this player has already watched */
    function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 80 : 66; camera.updateProjectionMatrix(); if (post) post.resize(w, h); }
    window.addEventListener('resize', resize); resize();
    function finish() { if (finished) return; finished = true; if (I) I.clear(); ov.style.transition = 'opacity .6s ease, background .6s'; ov.style.background = sc.endColor(); renderer.domElement.style.transition = 'opacity .6s'; renderer.domElement.style.opacity = '0'; if (snd) snd.end(); setTimeout(() => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); try { post && post.dispose(); renderer.dispose(); renderer.forceContextLoss(); } catch (e) {} done && done(sc.endColor()); setTimeout(() => ov.remove(), 400); }, 650); }
    function frame(force, dtOver, noRender) { if (!alive) return; if (force !== true) { raf = requestAnimationFrame(frame); if (hook.paused) { clock.getDelta(); return; } } const dt = dtOver != null ? dtOver : Math.min(0.05, clock.getDelta()); t += dt; sc.update(t, dt); if (t > (sc.noteFor || 2.4)) note.style.opacity = '0'; if (noRender) return; if (post) post.render(dt); else renderer.render(scene, camera); if (t >= sc.dur && force !== true) { if (I) I.mark(rid); finish(); } }
    const hook = window.__ride = { paused: !!opts.paused, step: () => frame(true), seek(tt) { while (t < tt - 0.051) frame(true, 0.05, true); frame(true, Math.max(0.001, tt - t)); }, finish, scene, camera, get t() { return t; }, get dur() { return sc.dur; }, realm, up };
    requestAnimationFrame(() => { ov.style.opacity = '1'; }); frame();
    /* Yoni 2026-09-29: the first ride plays in full; a returning player gets Skip (and a tap anywhere). The rocket to space is never skipped:
       from its second time in each direction it plays the SHORT ride by itself (only the layer names, same pace); a 'Full ride' button brings the explanations back */
    if (sc.speedable) { if (I && I.seen(rid)) { const set = on => { if (sc.setFast) t = sc.setFast(on, t); if (on) I.unmark('full:' + realm); else I.mark('full:' + realm); I.offer(() => set(!on), KQ.t(on ? 'slower' : 'faster'), true); }; set(!I.seen('full:' + realm)); } }   /* Yoni 2026-09-29: 'no need for explaining after the second time, just mention the spheres' — from the 2nd take-off (and the 2nd landing) the short ride plays by itself; 'Full ride' brings the explanations back */
    else setTimeout(() => { if (finished || (I && !I.seen(rid))) return; ov.addEventListener('pointerdown', finish); if (I) I.offer(finish); }, (sc.skipAfter || 1.5) * 1000);
  }
  /* other journeys register their own scene (shared/rocket.js: the rocket to space), sharing the stage, the painted surfaces and the live sound */
  window.KQRide = { play, add(id, build) { SCENES[id] = build; }, kit: { canvas, tex, softTex, audioCore, SND, smooth, clamp, lerp, R, merge, M4 } };
})();
