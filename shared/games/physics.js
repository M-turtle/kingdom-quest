/* Kingdom Quest — the Physics Lab, a game of the Games Arcade (shared/arcade.js). Yoni 2026-10-03: 'teach all the major rules of
   physics … mentioned by voice … actually show each rule'. Yoni 2026-10-05: the first version 'shows the rules. It's just boring. No
   one would want to do it … fun meaning that something happens … like Fruit Ninja, very satisfying because of the process … no
   clicking on the screen or a joystick … it needs fun and action'. So every rule is now a challenge with a target: the child's choice
   is the move, the physics plays out, and something big happens either way — the piñata bursts or the ball bonks off it, the dishes
   stay or crash to the floor, the cans tumble or the pumpkin splats. Professor Owl gives the goal before and the rule after (recorded
   lines: shared/voices/physics_lines.js). Ages 4–7 make one move (two or three picture tiles); 8 and up set two things with real
   numbers, then run it.
     1 Gravity          drop a ball on a piñata: higher is faster (8+: a speed gauge, and a glass bowl that breaks above 10 m/s)
     2 Inertia          the tablecloth trick: pull fast and the dishes stay (8+: the cloth and the pull time)
     3 Force and mass   a catapult and a tower of cans: one push throws light things far (8+: rubber bands ÷ mass = speed)
     4 Action-reaction  a rocket: gas down, rocket up (8+: pumps, to bring a pizza to the tree-house door)
     5 Speed            a car jumps a river (8+: it flies exactly one second, so speed = distance ÷ time)
     6 Friction         a penguin slides to the fish on ice, snow or sand (8+: the start height and the ground)
     7 Energy           a loop-the-loop coaster: start higher than the top of the loop (8+: in metres, friction included)
     8 Floating         a raft for Teddy (8+: load gold bars without letting the water over the side)
     + Machines (8+)    many rules in one long run, a visit of its own: the Penguin Express (energy → inertia → speed → friction)
   A visit is three challenges, carrying on from where the child stopped last time. A wrong choice shows its own funny result and Owl
   says why; after two misses the right tile glows. Every motion is computed from the rule itself, at a child's pace.
   2026-10-07: everything 25% faster; every ending is a joke (the penguin is the lab's helper in every experiment, Teddy keeps the raft) with
   the camera leaning in on it; the front door shows every experiment as a card, and a child can make it harder (or easier, never below
   the level their class gives them). */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o || {}));
  const t = (k, p) => KQ.t(k, p);
  const R = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), V3 = (x, y, z) => new T.Vector3(x, y, z);
  const LESSONS = ['gravity', 'inertia', 'force', 'action', 'speed', 'friction', 'energy', 'float'];
  const VOICE_V = 2;   /* bump when the voice pack is recorded again (tools/voice_batch.py) */
  /* Owl's recorded lines come in their own sprite, loaded with the game (kq.js plays it through KQ_LINE_PACKS) */
  (function () { const me = document.currentScript && document.currentScript.src; if (!me || document.getElementById('kq-pack-physics')) return; const s = document.createElement('script'); s.id = 'kq-pack-physics'; s.src = me.replace(/games\/[^/]*$/, 'voices/physics_lines.js') + '?v=' + VOICE_V; document.head.appendChild(s); })();

  /* Yoni 2026-10-03: 'not intimidating with the formulas … much friendlier, simpler and more fun': a bright playroom lab — a big sunny window,
     rainbow bunting, bubbling flasks, plants, soap bubbles drifting in the air; Professor Owl hosts the experiments (see the stage) */
  const THEMES = {
    gm_lab: { palette: { noFloor: false, sky: 0xd8f0ff, ground: 0xf0c890, fog: 0xd8f0ff, wall: ['plank', '#bfe6ff', '#a9dcfa'], floor: ['plank', '#ffd9a8', '#f5c890'], hemi: [0xfffaf0, 0xb88a5a], key: 0xfff4e0, dust: { c: 0xffffff, n: 10, mode: 'drift' } },
      look: { keyC: 0xfff4e0, grade: 'warm', exposure: 1.0, fogD: 0.004, rim: 0xfff0d0, face: 0x3a2050, accent: '#ffe8a8', pillars: null, rays: 0, noWall: false, ceiling: false },
      props(c) { const { scene } = c;
        /* a big round window: sky, sun and clouds */
        { const cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#5ab8ff'); gr.addColorStop(1, '#c8ecff'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
          g.fillStyle = '#ffe066'; g.beginPath(); g.arc(380, 130, 60, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; for (const [x, y, r] of [[120, 300, 50], [170, 280, 64], [230, 300, 50], [300, 380, 40], [340, 362, 52], [390, 380, 40]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
          g.fillStyle = '#7ad06a'; g.fillRect(0, 450, 512, 62); const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace;
          const win = new T.Mesh(new T.CircleGeometry(2.4, 48), new T.MeshBasicMaterial({ map: tx, toneMapped: false })); win.position.set(0, 5.0, -6.15); scene.add(win);
          const rim = new T.Mesh(new T.TorusGeometry(2.45, 0.22, 12, 48), M(0xffffff, { roughness: 0.4 })); rim.position.set(0, 5.0, -6.1); scene.add(rim);
          for (const [w, h, rz] of [[4.9, 0.12, 0], [0.12, 4.9, 0]]) { const bar = new T.Mesh(new T.BoxGeometry(w, h, 0.1), M(0xffffff)); bar.position.set(0, 5.0, -6.05); bar.rotation.z = rz; scene.add(bar); } }
        /* rainbow bunting across the wall */
        const RB = [0xff5a6a, 0xff9a3c, 0xffd84a, 0x6ad06a, 0x4ab0ff, 0xa87aff];
        for (let i = 0; i < 18; i++) { const x = -8.5 + i * 1.0, y = 7.9 - Math.sin(i / 17 * PI) * 0.7; const f = new T.Mesh(new T.ConeGeometry(0.32, 0.6, 3), M(RB[i % 6])); f.rotation.x = PI; f.position.set(x, y, -6.0); scene.add(f); }
        /* shelves of bubbling, glowing flasks, and plants */
        for (const sx of [-7.4, 7.4]) { const sh = new T.Mesh(new T.BoxGeometry(3.2, 0.15, 1), M(0xffffff, { roughness: 0.5 })); sh.position.set(sx, 3.6, -5.6); scene.add(sh);
          for (let i = 0; i < 4; i++) { const col = RB[(i + (sx > 0 ? 2 : 0)) % 6], f = new T.Mesh(new T.SphereGeometry(0.32, 16, 12), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.8, roughness: 0.1, emissive: col, emissiveIntensity: 0.35 })); f.position.set(sx - 1.15 + i * 0.76, 4.0, -5.6); scene.add(f);
            const neck = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.3, 10), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); neck.position.set(f.position.x, 4.42, -5.6); scene.add(neck);
            const bub = []; for (let k = 0; k < 3; k++) bub.push(c.sprite(0xffffff, 0.12, f.position.x, 4.6, -5.6, null, 0.8)); const k0 = Math.random() * 3; c.updaters.push((dt, tm) => bub.forEach((b, k) => { const q = (tm * 0.6 + k0 + k / 3) % 1; b.position.y = 4.6 + q * 0.9; b.material.opacity = 0.8 * (1 - q); })); }
          const pot = new T.Mesh(new T.CylinderGeometry(0.5, 0.38, 0.8, 16), M(0xe8774a)); pot.position.set(sx * 1.12, 0.4, -4.4); scene.add(pot); for (let k = 0; k < 5; k++) { const lf = new T.Mesh(new T.SphereGeometry(0.45, 10, 8), M(0x4ac05a, { roughness: 0.8 })); lf.scale.set(0.6, 1.4, 0.6); lf.position.set(sx * 1.12 + Math.sin(k * 1.3) * 0.35, 1.3 + (k % 2) * 0.3, -4.4 + Math.cos(k * 1.3) * 0.35); lf.rotation.z = Math.sin(k * 1.3) * 0.5; scene.add(lf); } }
        /* soap bubbles drifting up through the room */
        for (let i = 0; i < 14; i++) { const b = new T.Mesh(new T.SphereGeometry(0.18 + Math.random() * 0.2, 16, 12), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.3, emissive: RB[i % 6], emissiveIntensity: 0.2 })); const x0 = -9 + Math.random() * 18, z0 = -5 + Math.random() * 3, k0 = Math.random() * 10; scene.add(b);
          c.updaters.push((dt, tm) => { const q = ((tm * 0.05 + k0 / 10) % 1); b.position.set(x0 + Math.sin(tm * 0.7 + k0) * 0.5, 0.5 + q * 8, z0); }); }
      } }
  };

  (function css() { if (document.getElementById('ph-css')) return; const st = document.createElement('style'); st.id = 'ph-css'; st.textContent = `
.ph-pick{position:absolute; left:50%; bottom:calc(84px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); display:grid; gap:8px; justify-items:center; pointer-events:auto; width:max-content; max-width:min(780px,96vw); z-index:7}
.ph-pick[hidden]{display:none}
.ph-row{display:flex; flex-wrap:wrap; gap:8px; justify-content:center; align-items:center} .ph-br{display:none}
.ph-lab{font:800 14px var(--font-body, Rubik, sans-serif); color:#fff; background:rgba(40,24,60,.72); padding:7px 12px; border-radius:999px}
.ph-opt{display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; min-width:84px; min-height:58px; padding:8px 12px 6px; border:3px solid transparent; border-radius:16px; background:linear-gradient(180deg,#fffaf0,#ffe9c4); color:#2a1a30; font:900 16px var(--font-body, Rubik, sans-serif); cursor:pointer; box-shadow:0 4px 0 #c8a068, 0 8px 18px rgba(0,0,0,.25); transition:transform .15s}
.ph-opt .kq-i, .ph-opt .ph-svg svg{width:46px; height:46px; display:block} .ph-opt:active{transform:translateY(2px)}
.ph-opt .ph-sub{font:800 12px var(--font-body, Rubik, sans-serif); opacity:.7}
.ph-opt.sel{border-color:#ff9f1a; background:linear-gradient(180deg,#fff6d0,#ffd77a); transform:translateY(-4px)}
.ph-opt.hint{animation:phGlow 1s ease-in-out infinite}
@keyframes phGlow{50%{box-shadow:0 0 0 7px rgba(255,214,80,.9), 0 8px 18px rgba(0,0,0,.25)}}
.ph-board{display:grid; grid-template-columns:repeat(8, minmax(0, 1fr)); gap:8px}
.ph-board .ph-opt{position:relative; min-width:80px; max-width:96px; min-height:84px; padding:8px 6px 6px; font-size:13px; line-height:1.15; text-align:center}
.ph-board .ph-opt .kq-i{width:44px; height:44px}
.ph-board .ph-opt .ph-done, .ph-mach .ph-opt .ph-done{position:absolute; top:-7px; inset-inline-end:-7px; width:24px; height:24px; border-radius:50%; background:#3fae62; box-shadow:0 2px 6px rgba(0,0,0,.3); display:grid; place-items:center}
.ph-board .ph-opt .ph-done svg, .ph-mach .ph-opt .ph-done svg{width:16px; height:16px; display:block}
.ph-mach .ph-lab{display:flex; align-items:center; gap:6px} .ph-mach .ph-lab .kq-i{width:24px; height:24px}
.ph-mach .ph-opt{position:relative; flex-direction:row; gap:8px; min-height:56px; padding:8px 18px 8px 10px} .ph-mach .ph-opt .kq-i{width:40px; height:40px}
.ph-lvl .ph-lab{display:flex; align-items:center; gap:6px} .ph-lvl .ph-lab .kq-i{width:24px; height:24px}
.ph-lvl .ph-opt.ph-mini{flex-direction:row; gap:4px; min-width:0; min-height:40px; padding:6px 14px 6px 10px; font-size:14px} .ph-lvl .ph-mini .ph-svg svg{width:18px; height:18px}
@media (max-width:760px){ .ph-opt{min-width:66px; min-height:50px; padding:6px 8px 4px; font-size:14px} .ph-opt .kq-i, .ph-opt .ph-svg svg{width:34px; height:34px} .ph-lab{font-size:12px; padding:5px 10px}
  .ph-four .ph-opt{min-width:50px; padding:6px 4px 4px} .ph-br{display:block; flex-basis:100%; height:0}
  .ph-board{grid-template-columns:repeat(4, minmax(0, 1fr))} .ph-board .ph-opt{min-width:0; min-height:72px; font-size:12px} .ph-board .ph-opt .kq-i{width:34px; height:34px} .ph-board .ph-opt .ph-done svg{width:15px; height:15px} }`; document.head.appendChild(st); })();
  /* little drawn icons for the choices that have no picture in the atlas */
  const SVG = {
    up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" fill="none" stroke="#2a1a30" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="#2a1a30" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    level: k => `<svg viewBox="0 0 48 48"><rect x="21" y="3" width="6" height="40" rx="3" fill="#b8c2d8"/><rect x="9" y="42" width="30" height="4" rx="2" fill="#6aa04a"/><circle cx="24" cy="${38 - k * 30}" r="8" fill="#ff7a3a" stroke="#7a2a0a" stroke-width="2"/></svg>`,
    swatch: (a, b) => `<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="30" rx="7" fill="${a}"/><path d="M5 22 Q16 15 24 22 T43 22" stroke="${b}" stroke-width="3" fill="none"/><path d="M5 31 Q16 24 24 31 T43 31" stroke="${b}" stroke-width="3" fill="none"/></svg>`,
    ball: `<svg viewBox="0 0 48 48"><defs><radialGradient id="phb" cx=".35" cy=".3"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#b8c0cc"/><stop offset="1" stop-color="#4a5260"/></radialGradient></defs><circle cx="24" cy="25" r="17" fill="url(#phb)"/></svg>`,
    hull: `<svg viewBox="0 0 48 48"><path d="M5 20 H43 L37 36 Q24 41 11 36 Z" fill="#9aa4b4" stroke="#4a5260" stroke-width="2.5"/><rect x="5" y="17" width="38" height="4" rx="2" fill="#6a7484"/></svg>`,
    raft: `<svg viewBox="0 0 48 48"><g fill="#b07a42" stroke="#6a4420" stroke-width="2">${[0, 1, 2, 3, 4].map(i => `<rect x="${6 + i * 7.6}" y="12" width="6.6" height="26" rx="3.3"/>`).join('')}</g><rect x="4" y="18" width="40" height="3" fill="#e8d0a0"/><rect x="4" y="29" width="40" height="3" fill="#e8d0a0"/></svg>`,
    gas: d => { const fl = (a, b) => `<path d="${a}" fill="#ff7a1a"/><path d="${b}" fill="#ffd84a"/>`; return `<svg viewBox="0 0 48 48"><path d="M18 30 L13 38 L18 35 Z M30 30 L35 38 L30 35 Z" fill="#e8303a"/><rect x="18" y="15" width="12" height="20" rx="4" fill="#f4f4f0" stroke="#4a4f58" stroke-width="1.6"/><path d="M18 16 Q24 4 30 16 Z" fill="#e8303a"/><circle cx="24" cy="23" r="2.8" fill="#8ad0ff" stroke="#4a4f58" stroke-width="1"/>${{ down: fl('M19 35 L24 47 L29 35 Z', 'M21.5 35 L24 42 L26.5 35 Z'), up: fl('M20 9 L24 0 L28 9 Z', 'M22 9 L24 3 L26 9 Z'), side: fl('M18 20 L3 25 L18 30 Z', 'M18 22.5 L9 25 L18 27.5 Z') }[d]}</svg>`; },
    slab: `<svg viewBox="0 0 48 48"><path d="M6 20 L40 15 L44 30 L10 36 Z" fill="#8a8f98" stroke="#4a4f58" stroke-width="2.5"/><circle cx="20" cy="25" r="2" fill="#6a6f78"/><circle cx="31" cy="23" r="1.6" fill="#6a6f78"/></svg>`
  };

  const STAGES = {
    gm_physics(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2, view: null, ts: 1 };   /* ts: the sims' time scale (a slow-motion beat at the big moments) */
      /* Professor Owl hosts from the side: he talks while the voice speaks, cheers a win, shakes his head at a miss */
      let owl = null; try { if (window.KQCast) { owl = KQCast.build('owl'); owl.root.scale.setScalar(1.25); owl.root.position.set(-8.8, 0, -4.6); owl.root.rotation.y = 0.55; scene.add(owl.root); } } catch (e) { owl = null; }
      c.updaters.push((dt, tm) => { if (!owl) return; owl.update(dt, tm); const a = KQ.tts && KQ.tts.current; owl.talk(!!(a && !a.paused && !a.ended)); });
      /* the room's clock drives every moving thing: a sim(dt) returns false when it is done */
      const sims = []; c.updaters.push(dt => { dt = Math.min(dt, 0.05) * S.ts * SPEED; for (let i = sims.length - 1; i >= 0; i--) if (sims[i](dt) === false) sims.splice(i, 1); });
      /* Yoni 2026-10-07: 'faster, let's say 25%: the narrator and everything that's moving'. One speed for the whole lab: the sims,
         every animation and wait, and Owl's voice (played at SPEED with its pitch kept) */
      const SPEED = 1.25, anim = (d, fn, dl) => K.anim(d / SPEED, fn, dl && dl / SPEED), wait = s => K.wait(s / SPEED), glide = (o, to, d, h, r) => K.glide(o, to, d / SPEED, h, r), tween = (d, fn, done, dl) => c.tween(d / SPEED, fn, done, dl && dl / SPEED);
      const until = (test, max) => new Promise(res => { let tm = 0; sims.push(dt => { tm += dt; if (test(dt, tm) || tm > (max || 15)) { res(); return false; } }); });
      /* one diorama on the lab floor per challenge */
      let demo = null; const tabs = [];
      const disposeTree = o => o.traverse(x => { if (x.geometry && !x.geometry.userData.keep) x.geometry.dispose(); const ms = Array.isArray(x.material) ? x.material : x.material ? [x.material] : []; for (const m of ms) { if (m.map && m.userData.own) m.map.dispose(); m.dispose(); } });
      const clearDemo = () => { sims.length = 0; for (const tb of tabs.splice(0)) { try { tb.userData.tablet.dispose(); } catch (e) {} } if (demo) { scene.remove(demo); disposeTree(demo); demo = null; } };
      const newDemo = () => { clearDemo(); demo = new T.Group(); scene.add(demo); return demo; };
      const drop = o => { if (!o) return; o.removeFromParent(); disposeTree(o); };
      const tag = (text, x, y, z, size) => { const tb = c.label(text, -1, (size || 0.4) * (K.narrow() ? 1.6 : 1.4));   /* the numbers have to be readable from the back of the room */ tb.position.set(x, y, z); c.faceCam(tb); demo.add(tb); tabs.push(tb); return tb; };
      const untag = tb => { if (!tb) return; const i = tabs.indexOf(tb); if (i >= 0) tabs.splice(i, 1); tb.removeFromParent(); try { tb.userData.tablet.dispose(); } catch (e) {} };
      const box = (w, h, d, m, x, y, z, p) => c.box(w, h, d, m, x, y, z, p || demo);
      const cyl = (r1, r2, h, m, x, y, z, p, seg) => c.cyl(r1, r2, h, m, x, y, z, p || demo, seg || 20);
      const sph = (r, m, x, y, z, p, seg) => c.sph(r, m, x, y, z, p || demo, seg || 18);
      const cone = (r, h, m, x, y, z, p, seg) => c.cone(r, h, m, x, y, z, p || demo, seg || 16);
      const grp = (x, y, z, p) => { const g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); (p || demo).add(g); return g; };
      const TOP = 0.32;   /* the top of every diorama's plinth */
      const plinth = (w, dp, top, side, x) => { S.pl = { x0: (x || 0) - w / 2, x1: (x || 0) + w / 2, z: dp / 2 }; const g = grp(x || 0, 0, 0); box(w, 0.26, dp, M(side, { roughness: 0.85 }), 0, 0.13, 0, g); box(w + 0.06, 0.06, dp + 0.06, M(top, { roughness: 0.9 }), 0, 0.29, 0, g); return g; };
      const tex = (w, h, draw, rep) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; if (rep) { tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(rep[0], rep[1]); } return tx; };
      const texM = (tx, o) => { const m = new T.MeshStandardMaterial(Object.assign({ map: tx, roughness: 0.8 }, o || {})); m.userData.own = true; return m; };
      /* a few flowers and tufts so a plinth reads as a meadow */
      const meadow = (w, dp, x) => { const cols = [0xffffff, 0xffd84a, 0xff8ab0, 0xb48cff]; for (let i = 0; i < 26; i++) { const px = (x || 0) + R(-w / 2, w / 2), pz = R(-dp / 2, dp / 2); if (i % 3) { cone(0.05, 0.16, M(0x3f9a3a), px, TOP + 0.08, pz, null, 5); } else { cyl(0.012, 0.012, 0.14, M(0x3f9a3a), px, TOP + 0.07, pz, null, 4); sph(0.045, M(cols[i % 4], { roughness: 0.5 }), px, TOP + 0.15, pz, null, 8); } } };
      /* ---------------------------------------------------------------- the payoffs: what makes it feel good */
      const CONF_G = new T.PlaneGeometry(0.16, 0.1); CONF_G.userData.keep = true;
      const CONF = [0xff5a6a, 0xffd84a, 0x4ab0ff, 0x6ad06a, 0xa87aff, 0xff9a3c, 0xff7ad0];
      function confetti(at, n, spread, cols) { for (let i = 0; i < (n || 46); i++) { const m = new T.Mesh(CONF_G, new T.MeshBasicMaterial({ color: (cols || CONF)[i % (cols || CONF).length], side: T.DoubleSide, transparent: true })); m.position.copy(at); demo.add(m);
        const v = V3(R(-1, 1) * (spread || 2.6), R(3.5, 7), R(-1, 1) * 1.4), w = V3(R(-9, 9), R(-9, 9), R(-9, 9)); let life = R(2, 2.8);
        sims.push(dt => { v.y -= 7.5 * dt; v.multiplyScalar(1 - 1.1 * dt); m.position.addScaledVector(v, dt); m.rotation.x += w.x * dt; m.rotation.y += w.y * dt; m.rotation.z += w.z * dt; life -= dt; if (life < 0.6) m.material.opacity = Math.max(0, life / 0.6); if (life <= 0) { m.removeFromParent(); m.material.dispose(); return false; } }); } }
      const glow = (col, size, x, y, z, op) => { const s = c.sprite(col, size, x, y, z, demo, op == null ? 0.9 : op); s.material.blending = T.AdditiveBlending; return s; };
      function firework(at, col) { snd('pop'); for (let i = 0; i < 28; i++) { const s = glow(col, 0.36, at.x, at.y, at.z, 1), a = i / 28 * TAU, b = R(-0.6, 0.6), sp = R(2.2, 3.4); const v = V3(Math.cos(a) * Math.cos(b) * sp, Math.sin(a) * Math.cos(b) * sp, Math.sin(b) * sp * 0.6); let life = 1.3;
          sims.push(dt => { v.y -= 1.6 * dt; v.multiplyScalar(1 - 1.2 * dt); s.position.addScaledVector(v, dt); life -= dt; s.material.opacity = Math.max(0, life / 1.3); s.scale.setScalar(0.36 * (0.6 + life / 2.6)); if (life <= 0) { s.removeFromParent(); s.material.dispose(); return false; } }); }
        const fl = glow(0xffffff, 2.2, at.x, at.y, at.z, 1); let k = 0; sims.push(dt => { k += dt * 3; fl.material.opacity = Math.max(0, 1 - k); fl.scale.setScalar(2.2 + k * 1.5); if (k >= 1) { fl.removeFromParent(); fl.material.dispose(); return false; } }); }
      function splash(at, size) { snd('splash'); const k = size || 1; for (let i = 0; i < 22 * k; i++) { const s = c.sprite(i % 3 ? 0xdff4ff : 0xffffff, R(0.16, 0.34) * k, at.x, at.y, at.z, demo, 0.95), a = R(0, TAU), sp = R(0.5, 1.7) * k, up = R(2.2, 4.4) * Math.sqrt(k); const v = V3(Math.cos(a) * sp, up, Math.sin(a) * sp * 0.6); let life = 1.1;
          sims.push(dt => { v.y -= 9 * dt; s.position.addScaledVector(v, dt); life -= dt; s.material.opacity = Math.max(0, life); if (life <= 0 || s.position.y < at.y - 0.3) { s.removeFromParent(); s.material.dispose(); return false; } }); }
        const ring = new T.Mesh(new T.TorusGeometry(0.3 * k, 0.04, 6, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.set(at.x, at.y + 0.02, at.z); demo.add(ring);
        let q = 0; sims.push(dt => { q += dt / 1.2; ring.scale.setScalar(1 + q * 4); ring.material.opacity = 0.9 * (1 - q); if (q >= 1) { drop(ring); return false; } }); }
      function puff(at, col, n, size, spread, up) { for (let i = 0; i < (n || 10); i++) { const s0 = size || 0.6, s = c.sprite(col, s0, at.x + R(-0.2, 0.2), at.y, at.z + R(-0.2, 0.2), demo, 0.75); const v = V3(R(-1, 1) * (spread == null ? 1.2 : spread), R(0.3, 1) * (up == null ? 1.2 : up), R(-0.6, 0.6)); const L0 = R(0.9, 1.5); let life = L0;
          sims.push(dt => { s.position.addScaledVector(v, dt); v.multiplyScalar(1 - 1.6 * dt); life -= dt; const q = 1 - life / L0; s.scale.setScalar(s0 * (1 + q * 2)); s.material.opacity = 0.75 * (1 - q); if (life <= 0) { s.removeFromParent(); s.material.dispose(); return false; } }); } }
      function bubbles(at, n, top) { for (let i = 0; i < (n || 14); i++) { const s = c.sprite(0xffffff, R(0.08, 0.18), at.x + R(-0.35, 0.35), at.y, at.z + R(-0.3, 0.3), demo, 0.85); const vy = R(0.8, 1.6), k0 = R(0, 6); let tm = -i * 0.12;
          sims.push(dt => { tm += dt; if (tm < 0) { s.visible = false; return true; } s.visible = true; s.position.y += vy * dt; s.position.x += Math.sin(tm * 6 + k0) * 0.004; if (s.position.y > top) { s.removeFromParent(); s.material.dispose(); return false; } }); } }
      /* things flying apart: each object gets a kick away from the hit, tumbles, bounces on the floor and settles */
      function fling(objs, from, power, floor, o) { o = o || {}; for (const ob of objs) { const p = ob.position, dir = p.clone().sub(from); dir.y = Math.abs(dir.y) + (o.lift == null ? 0.7 : o.lift); dir.normalize();
          const v = dir.multiplyScalar(power * R(0.55, 1.15)); v.z += R(-0.6, 0.6) * power * 0.25; if (o.dir) v.x += o.dir * power * 0.4; const w = V3(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(power * 1.6), hy = ob.userData.hy == null ? 0.1 : ob.userData.hy, id = ob.userData.fly = (ob.userData.fly || 0) + 1; let rest = 0;
          sims.push(dt => { if (ob.userData.fly !== id) return false; v.y -= 9.8 * dt; p.addScaledVector(v, dt); ob.rotation.x += w.x * dt; ob.rotation.y += w.y * dt; ob.rotation.z += w.z * dt; const onPl = !S.pl || (p.x > S.pl.x0 && p.x < S.pl.x1 && Math.abs(p.z) < S.pl.z), fy = (typeof floor === 'function' ? floor(p.x, p.z) : onPl ? floor : 0.02) + hy;   /* off the plinth: down to the lab floor */
            if (p.y < fy) { p.y = fy; if (v.y < -1) { v.y = -v.y * 0.32; v.x *= 0.6; v.z *= 0.6; w.multiplyScalar(0.55); } else { v.set(v.x * 0.8, 0, v.z * 0.8); w.multiplyScalar(0.7); rest += dt; } }
            return rest < 0.7; }); } }
      const still = o => { o.userData.fly = (o.userData.fly || 0) + 1; };   /* stops a flying object where it is (before it is put back) */
      function shake(a, dur) { const d = demo; if (!d) return; let k = 0; sims.push(dt => { k += dt / (dur || 0.35); const s = (a || 0.08) * Math.max(0, 1 - k); d.position.set(R(-s, s), R(-s, s) * 0.6, 0); if (k >= 1) { d.position.set(0, 0, 0); return false; } }); }
      /* the big moment: a slow-motion beat, a white flash, a shock ring and a shake */
      function slowmo(k, dur) { const lo = k || 0.3, d = dur || 0.45; S.ts = lo; tween(d + 0.5, x => { const q = x * (d + 0.5); S.ts = q < d ? lo : Math.min(1, lo + (q - d) / 0.5 * (1 - lo)); }, () => { S.ts = 1; }); }
      function impact(at, col, big) { const k = big || 1, fl = glow(0xffffff, 1.4 * k, at.x, at.y, at.z + 0.3, 0.8); tween(0.28, q => { fl.material.opacity = 0.8 * (1 - q); fl.scale.setScalar(1.4 * k * (1 + q * 1.2)); }, () => { fl.removeFromParent(); fl.material.dispose(); });
        const ring = new T.Mesh(new T.TorusGeometry(0.5 * k, 0.06, 8, 40), new T.MeshBasicMaterial({ color: col || 0xfff0b0, transparent: true, opacity: 0.9, depthWrite: false })); ring.position.copy(at); ring.position.z += 0.2; demo.add(ring);
        let r = 0; sims.push(dt => { r += dt / 0.55; ring.scale.setScalar(1 + r * 4); ring.material.opacity = 0.9 * (1 - r); if (r >= 1) { drop(ring); return false; } }); shake(0.12 * k, 0.45); slowmo(0.3, 0.45); }
      const yay = () => { if (owl) owl.react('cheer'); K.sfx('win'); };
      const aww = () => { if (owl) owl.react('bad'); };
      /* the impact sounds, made on the spot (WebAudio, no files): they follow the room's sound switch */
      let nbuf = null;
      function snd(kind) { try { if (!KQ.state().settings.sfx) return; const ctx = KQ.sfx && KQ.sfx.ensure && KQ.sfx.ensure(); if (!ctx) return;
        if (!nbuf || nbuf.sampleRate !== ctx.sampleRate) { nbuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); const dd = nbuf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; }
        const t0 = ctx.currentTime + 0.01, out = ctx.createGain(); out.gain.value = 0.5; out.connect(ctx.destination);
        const nz = (dur, f0, f1, q, vol, type, at) => { at = at || t0; const s = ctx.createBufferSource(); s.buffer = nbuf; const f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(f0, at); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), at + dur); f.Q.value = q || 1;
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + Math.min(0.03, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); s.connect(f); f.connect(g); g.connect(out); s.start(at, Math.random() * Math.max(0, 2.9 - dur)); s.stop(at + dur + 0.05); };
        const tone = (f0, f1, dur, vol, type, at) => { at = at || t0; const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.05); };
        /* the penguin's voice: a nasal honk, with an optional warble */
        const hk = (f0, f1, at, dur, vol, vib) => { const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), v = vol || 0.5; o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + dur);
          if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vib; lg.gain.value = f1 * 0.06; l.connect(lg); lg.connect(o.frequency); l.start(at); l.stop(at + dur + 0.05); }
          bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 3; g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.02); g.gain.setValueAtTime(v, at + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); o.connect(bp); bp.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.05); };
        switch (kind) {
          case 'whoosh': nz(0.55, 300, 2600, 1.4, 0.5); break;
          case 'zoom': tone(90, 260, 1.1, 0.1, 'sawtooth'); nz(1.1, 200, 900, 0.8, 0.22, 'lowpass'); break;
          case 'crash': nz(0.9, 2400, 300, 0.7, 0.9, 'lowpass'); nz(0.35, 5000, 1800, 1.5, 0.3, 'highpass'); tone(110, 45, 0.35, 0.45); break;
          case 'smash': for (let i = 0; i < 7; i++) tone(R(1800, 4200), R(1500, 3800), 0.18, 0.1, 'triangle', t0 + i * 0.035); nz(0.5, 6000, 2500, 1, 0.35, 'highpass'); break;
          case 'splash': nz(0.9, 1600, 250, 0.7, 0.8); for (let i = 0; i < 5; i++) tone(R(500, 900), R(1000, 1600), 0.08, 0.07, 'sine', t0 + 0.2 + i * 0.09); break;
          case 'splat': nz(0.3, 900, 150, 0.9, 0.9, 'lowpass'); tone(200, 70, 0.22, 0.4); break;
          case 'boing': { const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 14; lg.gain.value = 60; l.connect(lg); lg.connect(o.frequency); o.frequency.setValueAtTime(180, t0); o.frequency.exponentialRampToValueAtTime(420, t0 + 0.5);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6); o.connect(g); g.connect(out); o.start(t0); l.start(t0); o.stop(t0 + 0.65); l.stop(t0 + 0.65); break; }
          case 'pop': nz(0.09, 2600, 700, 1, 0.8); tone(900, 180, 0.1, 0.22); break;
          case 'launch': nz(2.0, 180, 1400, 0.6, 0.9, 'lowpass'); tone(60, 140, 1.8, 0.18, 'sawtooth'); break;
          case 'thud': tone(95, 38, 0.3, 0.6); nz(0.18, 500, 120, 1, 0.45, 'lowpass'); break;
          case 'clap': for (let i = 0; i < 34; i++) nz(0.06, R(1200, 2600), R(800, 1600), 1.2, R(0.15, 0.4), 'bandpass', t0 + R(0, 1.8)); break;
          case 'glug': for (let i = 0; i < 7; i++) tone(R(240, 380), R(500, 800), 0.13, 0.2, 'sine', t0 + i * 0.2); break;
          case 'ding': [[1318.5, 0.22], [2637, 0.07], [3951, 0.035]].forEach(([f, v]) => tone(f, f * 0.998, 2.2, v)); break;
          case 'chomp': nz(0.07, 1500, 600, 1, 0.5); nz(0.07, 1500, 600, 1, 0.5, 'bandpass', t0 + 0.16); break;
          case 'slide': nz(1.6, 900, 400, 0.6, 0.16); break;
          case 'swish': nz(0.3, 1200, 4000, 1.2, 0.35); break;
          /* the cartoon voice of the funny endings (Yoni 2026-10-07: 'something funny needs to happen at the end … a weird happy sound') */
          case 'gulp': tone(320, 140, 0.12, 0.28); tone(160, 300, 0.1, 0.22, 'sine', t0 + 0.13); break;
          case 'honk': hk(380, 470, t0, 0.13); hk(470, 580, t0 + 0.17, 0.17); break;
          case 'honkSad': hk(470, 400, t0, 0.16, 0.45); hk(400, 290, t0 + 0.22, 0.42, 0.45, 5); break;
          case 'happy': [[380, 430, 0], [450, 510, 0.11], [530, 600, 0.22], [620, 700, 0.33]].forEach(([a, b, at]) => hk(a, b, t0 + at, 0.09, 0.45)); hk(700, 920, t0 + 0.46, 0.55, 0.55, 9); break;
          case 'mmf': for (let i = 0; i < 3; i++) { const at = t0 + i * 0.24, o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(190 + i * 25, at); o.frequency.exponentialRampToValueAtTime(240 + i * 25, at + 0.14); lp.type = 'lowpass'; lp.frequency.value = 520; g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.5, at + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.17); o.connect(lp); lp.connect(g); g.connect(out); o.start(at); o.stop(at + 0.2); } break;
          case 'slap': nz(0.06, 3000, 1400, 0.7, 0.95, 'highpass'); nz(0.12, 900, 260, 1, 0.45, 'lowpass'); break;
          case 'hic': tone(600, 1350, 0.07, 0.28, 'triangle'); nz(0.04, 3000, 2000, 2, 0.15, 'bandpass', t0 + 0.02); break;
          case 'whistleUp': tone(480, 1750, 0.5, 0.16); break;
          case 'whistleDown': tone(1700, 420, 0.55, 0.16); break;
          case 'spout': nz(1.0, 500, 3200, 0.8, 0.45); for (let i = 0; i < 4; i++) tone(R(500, 800), R(900, 1300), 0.07, 0.07, 'sine', t0 + 0.2 + i * 0.18); break;
          case 'achoo': nz(0.32, 280, 800, 1.2, 0.1, 'bandpass'); nz(0.34, 320, 950, 1.2, 0.14, 'bandpass', t0 + 0.42); nz(0.38, 2800, 700, 0.8, 0.9, 'bandpass', t0 + 0.92); tone(520, 190, 0.22, 0.28, 'sawtooth', t0 + 0.92); break;
          case 'squeak': tone(1400, 2100, 0.08, 0.14); break;
          case 'squish': nz(0.2, 500, 200, 1, 0.5, 'lowpass'); tone(210, 120, 0.15, 0.2); break;
          case 'zip': nz(1.2, 3600, 2400, 3, 0.12); break;
          case 'scratch': nz(0.7, 1800, 900, 4, 0.22); break;
          /* the rest of the cast (2026-10-07) */
          case 'twinkle': [2093, 2637, 3136, 2637].forEach((f, i) => tone(f, f * 1.01, 0.2, 0.06, 'sine', t0 + i * 0.07)); break;
          case 'giggle': for (let i = 0; i < 5; i++) { const f = 880 + (i % 2) * 240; tone(f, f * 1.35, 0.07, 0.15, 'triangle', t0 + i * 0.085); } break;
          case 'tweet': tone(2600, 3900, 0.07, 0.12); tone(2800, 4200, 0.07, 0.12, 'sine', t0 + 0.11); break;
          case 'tweetSad': tone(3200, 2100, 0.22, 0.11); tone(2600, 1600, 0.32, 0.1, 'sine', t0 + 0.26); break;
          case 'squawk': hk(900, 620, t0, 0.22, 0.4); nz(0.2, 2400, 1200, 2, 0.25, 'bandpass'); break;
          case 'bawk': hk(520, 600, t0, 0.09, 0.42); hk(520, 620, t0 + 0.16, 0.09, 0.42); hk(600, 920, t0 + 0.34, 0.24, 0.48); break;
          case 'meow': { const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(480, t0); o.frequency.linearRampToValueAtTime(720, t0 + 0.18); o.frequency.linearRampToValueAtTime(430, t0 + 0.55); bp.type = 'bandpass'; bp.Q.value = 4; bp.frequency.setValueAtTime(700, t0); bp.frequency.linearRampToValueAtTime(1500, t0 + 0.2); bp.frequency.linearRampToValueAtTime(800, t0 + 0.55);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.45, t0 + 0.05); g.gain.setValueAtTime(0.45, t0 + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6); o.connect(bp); bp.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.65); break; }
          case 'beep': for (const at of [0, 0.22]) { tone(392, 392, 0.16, 0.11, 'square', t0 + at); tone(494, 494, 0.16, 0.09, 'square', t0 + at); } break;
          case 'slurp': { const sb = ctx.createBufferSource(); sb.buffer = nbuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(2200, t0); f.frequency.exponentialRampToValueAtTime(500, t0 + 0.55); const g = ctx.createGain(), lf = ctx.createOscillator(), lg = ctx.createGain(); lf.frequency.value = 22; lg.gain.value = 0.25; lf.connect(lg); lg.connect(g.gain); g.gain.setValueAtTime(0.3, t0); sb.connect(f); f.connect(g); g.connect(out); sb.start(t0, Math.random()); sb.stop(t0 + 0.6); lf.start(t0); lf.stop(t0 + 0.6); break; }
          case 'boink': tone(1200, 260, 0.16, 0.3); tone(600, 900, 0.12, 0.1, 'triangle', t0 + 0.05); break;
          case 'quack': for (const at of [0, 0.2]) { const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(330, t0 + at); o.frequency.exponentialRampToValueAtTime(260, t0 + at + 0.14); bp.type = 'bandpass'; bp.frequency.value = 1000; bp.Q.value = 5; g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(0.5, t0 + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.15); o.connect(bp); bp.connect(g); g.connect(out); o.start(t0 + at); o.stop(t0 + at + 0.2); } break;
          case 'rumble': nz(0.9, 160, 90, 1.5, 0.6, 'lowpass'); tone(70, 55, 0.8, 0.25); break;
          case 'clack': for (const at of [0, 0.12, 0.24]) nz(0.03, 3500, 2500, 3, 0.5, 'bandpass', t0 + at); break;
          case 'plink': tone(1760, 1740, 0.25, 0.12, 'triangle'); break;
          case 'urp': tone(180, 110, 0.18, 0.4, 'sawtooth'); nz(0.15, 400, 200, 1, 0.2, 'lowpass'); break;
          case 'whee': tone(500, 1500, 0.6, 0.14); for (let i = 0; i < 3; i++) tone(1300, 1700, 0.06, 0.08, 'triangle', t0 + 0.62 + i * 0.08); break;
          case 'ow': hk(760, 480, t0, 0.18, 0.4); break;
          case 'gasp': nz(0.18, 1800, 3200, 1, 0.35, 'bandpass'); break;
          case 'plop': tone(300, 900, 0.07, 0.25); nz(0.06, 1200, 600, 1, 0.2); break;
          case 'squeakBig': { const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(1100, t0); o.frequency.linearRampToValueAtTime(1750, t0 + 0.12); o.frequency.linearRampToValueAtTime(1300, t0 + 0.4); l.frequency.value = 28; lg.gain.value = 90; l.connect(lg); lg.connect(o.frequency);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.03); g.gain.setValueAtTime(0.4, t0 + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45); o.connect(g); g.connect(out); o.start(t0); l.start(t0); o.stop(t0 + 0.5); l.stop(t0 + 0.5); break; }
          case 'ghost': { const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(380, t0); o.frequency.linearRampToValueAtTime(560, t0 + 0.45); o.frequency.linearRampToValueAtTime(360, t0 + 1.0); l.frequency.value = 6; lg.gain.value = 18; l.connect(lg); lg.connect(o.frequency);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.1); g.gain.setValueAtTime(0.18, t0 + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.05); o.connect(g); g.connect(out); o.start(t0); l.start(t0); o.stop(t0 + 1.1); l.stop(t0 + 1.1); break; }
        } } catch (e) {} }
      /* ---------------------------------------------------------------- the choice: big picture tiles (4–7) or two rows of numbers (8+) */
      const UI = { root: null };
      const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
      function mountUI() { const cv = c.renderer.domElement, host = cv.parentNode && cv.parentNode.parentNode; if (!host || UI.root) return; UI.root = el('div', 'ph-pick'); UI.root.hidden = true; host.appendChild(UI.root); }
      const iconOf = ic => { if (!ic) return null; if (ic.startsWith('<svg')) { const s = el('span', 'ph-svg'), doc = new DOMParser().parseFromString(ic.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml'); s.appendChild(document.importNode(doc.documentElement, true)); return s; } return KQ.icon ? KQ.icon(ic) : null; };
      /* the lab's front door (Yoni 2026-10-07: 'right now I can't see the penguin'): the big Start plays the next three in turn (that
         card is raised); above it every experiment as a picture card, so a child or a parent can go straight to one. A tick marks the
         ones already done */
      const CARD = { gravity: 'candy', inertia: 'coffee', force: 'pumpkin', action: 'rocket', speed: 'car', friction: 'penguin', energy: 'minecart', float: 'sailboat' };
      const LVL_IC = ['shield', 'swords', 'horse', 'crown', 'castle', 'glowstar'];   /* the same rank emblems as the worlds' level tiles */
      const MACH = ['express'], MCARD = { express: 'train' };   /* the machines: many rules in one long run, from 8 up (CH.express) */
      function board(mine, onPick, lv) { UI.root.replaceChildren(); UI.root.hidden = false; UI.root.appendChild(el('span', 'ph-lab', t('ph_all'))); const g = el('div', 'ph-board');
        LESSONS.forEach((id, i) => { const b = el('button', 'ph-opt' + (i === mine.next ? ' sel' : '')); b.type = 'button'; const ic = iconOf(CARD[id]); if (ic) b.appendChild(ic); b.appendChild(el('span', null, t('ph_t_' + id)));
          if (mine.won && mine.won[id]) { const ck = el('i', 'ph-done'); ck.appendChild(iconOf(SVG.check)); b.appendChild(ck); } b.onclick = () => { K.sfx('tap'); onPick(i); }; g.appendChild(b); });
        UI.root.appendChild(g);
        if (lv && lv.band >= 3) { const row = el('div', 'ph-row ph-mach'), chip = el('span', 'ph-lab'), gi = iconOf('gear'); if (gi) chip.appendChild(gi); chip.appendChild(el('span', null, t('ph_machines'))); row.appendChild(chip);
          for (const id of MACH) { const b = el('button', 'ph-opt'); b.type = 'button'; const ic = iconOf(MCARD[id]); if (ic) b.appendChild(ic); b.appendChild(el('span', null, t('ph_t_' + id)));
            if (mine.won && mine.won[id]) { const ck = el('i', 'ph-done'); ck.appendChild(iconOf(SVG.check)); b.appendChild(ck); } b.onclick = () => { K.sfx('tap'); onPick(id); }; row.appendChild(b); }
          UI.root.appendChild(row); }
        /* the level: a child who finds it too easy goes up one (Yoni 2026-10-07: 'if it's boring for them, they can jump onto the next
           level'), and can come back down, but never below the level their class gives them */
        if (lv) { const row = el('div', 'ph-row ph-lvl'), chip = el('span', 'ph-lab'), ic = iconOf(LVL_IC[lv.band - 1]); if (ic) chip.appendChild(ic); chip.appendChild(el('span', null, t('band' + lv.band))); row.appendChild(chip);
          for (const [d, key, svg] of [[-1, 'ph_easier', SVG.down], [1, 'ph_harder', SVG.up]]) { if (d < 0 ? lv.band <= lv.base : lv.band >= 6) continue; const b = el('button', 'ph-opt ph-mini'); b.type = 'button'; b.appendChild(iconOf(svg)); b.appendChild(el('span', null, t(key))); b.onclick = () => { K.sfx('tap'); lv.set(d); }; row.appendChild(b); }
          UI.root.appendChild(row); }
        const H = c.renderer.domElement.clientHeight || innerHeight; S.ui = clamp(UI.root.getBoundingClientRect().height / H, 0.06, 0.45); }
      /* every tap changes the diorama at once (the crane rises, the fruit hops into the cup, the boat sits lower): the Go button runs it */
      async function choose(ch, st) { const rows = ch.rows(st); if (!st.sel || st.sel.length !== rows.length) st.sel = rows.map(r => r.def == null ? null : r.def);
        const all = () => st.sel.every(v => v != null); UI.root.replaceChildren(); UI.root.hidden = false;
        rows.forEach((r, ri) => { const row = el('div', 'ph-row' + (r.opts.length >= 4 ? ' ph-four' : '')); if (r.label) row.appendChild(el('span', 'ph-lab', r.label)); if (r.label && r.opts.length >= 5) row.appendChild(el('i', 'ph-br'));   /* four or more numbers: narrower tiles on a phone, and from five the label takes its own line, so the tiles stay on one */
          for (const op of r.opts) { const b = el('button', 'ph-opt' + (st.sel[ri] === op.v ? ' sel' : '') + (st.hint && st.hint[ri] === op.v ? ' hint' : '')); b.type = 'button'; const ic = iconOf(op.icon); if (ic) b.appendChild(ic); if (op.text) b.appendChild(el('span', null, op.text)); if (op.sub) b.appendChild(el('small', 'ph-sub', op.sub));
            b.onclick = () => { K.sfx('tap'); st.sel[ri] = op.v; for (const x of row.querySelectorAll('.ph-opt')) x.classList.toggle('sel', x === b); ch.preview(st); if (all()) K.ready(); }; row.appendChild(b); }
          UI.root.appendChild(row); });
        { const H = c.renderer.domElement.clientHeight || innerHeight; S.ui = clamp(UI.root.getBoundingClientRect().height / H, 0.06, 0.45); }   /* the camera keeps the scene above the tiles */
        ch.preview(st); const p = K.act(t(ch.go), { wait: !all() }); if (all()) K.ready(); await p; UI.root.hidden = true; UI.root.replaceChildren(); return st.sel.slice(); }
      /* Owl's lines: on the sign, in the voice (the recorded pack), and again on '?' */
      const fastVoice = () => { for (const P of window.KQ_LINE_PACKS || []) for (const L of ['en', 'he']) { const m = P[L]; if (m && m._load && /^physics_/.test(m.file)) m._load.then(a => { if (a) { a.playbackRate = SPEED; a.preservesPitch = true; } }); } };
      async function say(kick, key) { const text = t(key); K.tell(kick, text); const sp = () => { KQ.speak(text, KQ.i18n.lang, { force: true }); fastVoice(); }; K.hint(sp); sp(); await wait(0.3); }
      /* one challenge: the goal, then choose → run until it works. A miss plays its own result and Owl says why; after two misses the right tile glows */
      /* variations (Yoni 2026-10-07: 'yes, we need to do variations'): a young visit gets one of an experiment's set-ups, never the same
         one twice in a row, so the right tile changes and nothing can be learnt by heart */
      /* a set-up whose lines Owl has not recorded yet waits until they are (a 4-year-old cannot read the sign, so Owl must always be heard) */
      const VAR_LINE = { 'friction:tall': 'pv_r_y_win_sand', 'friction:low': 'pv_r_y_win_ice', 'force:near': 'pv_f_y_long', 'force:far': 'pv_f_y_short', 'speed:island1': 'pv_s_y_in2', 'speed:island2': 'pv_s_y_in2', 'action:balloon': 'pv_a_y_in_b', 'action:duck': 'pv_a_y_in_d', 'gravity:egg': 'pv_g_y_in_e', 'inertia:serve': 'pv_i_y_in_s', 'energy:small': 'pv_e_y_in2', 'float:heavy': 'pv_w_y_in2' };
      const voiced = key => { const L = KQ.i18n.lang, packs = (window.KQ_LINE_PACKS || []).filter(P => P[L] && /^physics_/.test(P[L].file || '')); return !packs.length || packs.some(P => P[L].clips && P[L].clips[t(key)]); };
      const pickVar = (st, list) => { const vs = S.mine ? (S.mine.vars = S.mine.vars || {}) : {}, ok = list.filter(v => !VAR_LINE[st.id + ':' + v] || voiced(VAR_LINE[st.id + ':' + v])), base = ok.length ? ok : [list[0]], opts = base.filter(v => v !== vs[st.id]), v = pick(opts.length ? opts : base); vs[st.id] = v; return v; };
      async function runChallenge(id, kick) { const ch = CH[id], st = { id, old: S.band >= 3, band: S.band, sel: null, hint: null, trash: [] }; newDemo(); ch.build(st); S.view = ch.view(st); const L = ch.lines(st);
        await say(kick, L.in); let fails = 0;
        for (;;) { if (!K.alive()) return false; const sel = await choose(ch, st); if (!K.alive()) return false;
          const res = await ch.run(st, sel); if (!K.alive()) return false;
          if (res === 'win') { await say(kick, typeof L.win === 'function' ? L.win(sel) : L.win); return fails === 0; }
          fails++; aww(); await wait(0.5); await say(kick, L.fail[res]); await wait(1.8); if (!K.alive()) return false;
          for (const o of st.trash.splice(0)) drop(o); await ch.reset(st); if (fails >= (ch.hintAfter || 2)) st.hint = ch.answer(st); } }
      const CH = {};
      /* ---------------------------------------------------------------- the cast and their jokes (Yoni 2026-10-07: 'penguin is good, continue
         with the funny ending and seven experiments'). The penguin is the lab's helper in every experiment: it pilots the rocket, drives the
         car, rides the coaster, and it is the one who gets bonked, splatted and covered in cake before its weird happy honk. Teddy keeps the
         raft. Every ending is a joke a child can read on a phone: the camera leans in (camIn) and leans back out for Owl's lesson (camOut) */
      const hearts = (at, n) => { for (let i = 0; i < (n || 6); i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: KQ.iconTexture ? KQ.iconTexture('heart') : null, color: KQ.iconTexture ? 0xffffff : 0xff5a8a, transparent: true })); s.scale.setScalar(0.28); s.position.set(at.x + R(-0.3, 0.3), at.y, at.z + 0.2); demo.add(s); let q = -i * 0.12; sims.push(dt => { q += dt; if (q < 0) { s.visible = false; return true; } s.visible = true; s.position.y += dt * 0.7; s.material.opacity = Math.max(0, 1 - q / 1.4); if (q > 1.4) { s.removeFromParent(); s.material.dispose(); return false; } }); } };
      const camIn = (st, x, y, w) => { if (!st.v0) st.v0 = S.view; S.view = { x0: x - w / 2, x1: x + w / 2, y0: y - w * 0.28, y1: y + w * 0.28, pitch: 0.16 }; };
      const camOut = st => { if (st.v0) { S.view = st.v0; st.v0 = null; } };
      /* the penguin: { g (at its feet, facing +x; ry turns it), head, beak, eyes, fl (flippers), belly, face, sc } */
      function pip(x, y, z, sc, ry, par) { const g = grp(x, y, z, par), blk = M(0x1e2230, { roughness: 0.6 }), wht = M(0xffffff, { roughness: 0.7 }), org = M(0xff9a1a, { roughness: 0.5 });
        sph(0.3, blk, 0, 0.42, 0, g, 20).scale.set(1, 1.3, 0.92); const belly = sph(0.25, wht, 0.07, 0.4, 0, g, 18); belly.scale.set(0.95, 1.22, 0.8);
        const head = grp(0.02, 0.9, 0, g); sph(0.2, blk, 0, 0, 0, head, 18); const face = sph(0.12, wht.clone(), 0.12, -0.02, 0, head, 12); face.scale.set(0.6, 0.9, 1.2); const eyes = [];
        for (const zz of [-0.075, 0.075]) { const e = grp(0.15, 0.05, zz, head); sph(0.045, wht, 0, 0, 0, e, 10); sph(0.022, M(0x111111), 0.035, 0.005, 0, e, 8); eyes.push(e); sph(0.035, M(0xff9ab0), 0.15, -0.07, zz * 1.7, head, 8); }
        const beak = cone(0.05, 0.16, org, 0.25, -0.02, 0, head, 8); beak.rotation.z = -PI / 2; const fl = []; for (const s of [-1, 1]) { const f = grp(0, 0.6, s * 0.28, g); sph(0.12, blk, 0, -0.15, 0, f, 12).scale.set(0.5, 1.4, 0.35); fl.push(f); }
        for (const zz of [-0.1, 0.1]) sph(0.07, org, 0.1, 0.03, zz, g, 10).scale.set(1.4, 0.4, 0.9);
        const k = sc || 0.95; g.scale.setScalar(k); if (ry) g.rotation.y = ry; return { g, head, beak, eyes, fl, belly, face, sc: k }; }
      const pg = {
        blink(p, n) { for (let i = 0; i < (n || 1); i++) tween(0.16, q => { for (const e of p.eyes) e.scale.y = Math.max(0.08, Math.abs(1 - 2 * q)); }, () => { for (const e of p.eyes) e.scale.y = 1; }, i * 0.32); },
        beak: p => p.beak.getWorldPosition(V3()),
        top: p => p.head.getWorldPosition(V3()).add(V3(0, 0.21 * p.sc, 0)),   /* just on top of its head */
        /* it turns its head to the child (or back) */
        look(p, back) { const r0 = p.head.rotation.y; let r1 = 0; if (!back) { let a = -PI / 2 - p.g.rotation.y; a = ((a + PI) % TAU + TAU) % TAU - PI; r1 = clamp(a, -1.3, 1.3) * 0.85; } return anim(0.25, q => { p.head.rotation.y = r0 + (r1 - r0) * K.ease(q); }); },
        dizzy(p, dur) { dizzyAt(() => pg.top(p), dur, 0.25 * p.sc / 0.95); },
        wobble(p, dur, a) { let q = 0; const r0 = p.g.rotation.z; sims.push(dt => { q += dt; p.g.rotation.z = r0 + (a || 0.18) * Math.sin(q * 11) * Math.max(0, 1 - q / dur); if (q >= dur || !p.g.parent) { p.g.rotation.z = r0; return false; } }); },
        squash(p, k) { return anim(0.18, q => { const s2 = Math.sin(PI * q) * (k || 1); p.g.scale.set(p.sc * (1 + 0.16 * s2), p.sc * (1 - 0.2 * s2), p.sc * (1 + 0.16 * s2)); }).then(() => p.g.scale.setScalar(p.sc)); },
        /* the weird happy honk, hopping, flapping (and a spin) */
        async laugh(p, spin) { snd('happy'); const y0 = p.g.position.y, r0 = p.g.rotation.y; await anim(1.1, q => { const hop = Math.abs(Math.sin(q * PI * 3)); p.g.position.y = y0 + hop * 0.27 * p.sc; p.g.scale.set(p.sc * (1 + 0.1 * (1 - hop)), p.sc * (1 + 0.12 * hop - 0.1 * (1 - hop)), p.sc); if (spin !== false) p.g.rotation.y = r0 + K.ease(clamp((q - 0.33) / 0.34, 0, 1)) * TAU; for (const f of p.fl) f.rotation.x = Math.sin(q * 44) * 0.9; });
          p.g.position.y = y0; p.g.rotation.y = r0; p.g.scale.setScalar(p.sc); for (const f of p.fl) f.rotation.x = 0; },
        flippersUp(p, k) { p.fl[0].rotation.x = 2.5 * k; p.fl[1].rotation.x = -2.5 * k; },
        /* both flippers over its eyes (they stretch a little: it is a cartoon) */
        cover(p, k) { for (const f of p.fl) { f.rotation.z = 2.8 * k; f.scale.y = 1 + 0.6 * k; } p.fl[0].rotation.x = 0.4 * k; p.fl[1].rotation.x = -0.4 * k; p.head.rotation.z = -0.3 * k; },
        /* something soft lands on its head: a blob that drips down its face */
        goo(p, col) { const b = sph(0.17, M(col, { roughness: 0.55 }), 0, 0.15, 0, p.head, 14); b.scale.set(1.2, 0.55, 1.2); const dr = []; for (let i = 0; i < 5; i++) { const d = sph(0.04, M(col, { roughness: 0.5 }), Math.cos(i * 1.3) * 0.16, 0.1, Math.sin(i * 1.3) * 0.16, p.head, 8); d.scale.y = 1.7; dr.push(d); }
          let q = 0; sims.push(dt => { q += dt; dr.forEach((d, i) => { d.position.y = 0.1 - Math.min(0.24, q * (0.16 + i * 0.03)); }); return q < 1.8 && !!p.g.parent; }); return b; },
        tint(p, col) { p.face.material.color.setHex(col); },
        async waddleTo(p, x, z, dur) { const x0 = p.g.position.x, z0 = p.g.position.z, z1 = z == null ? z0 : z; snd('squeak'); await anim(dur, q => { p.g.position.x = x0 + (x - x0) * q; p.g.position.z = z0 + (z1 - z0) * q; p.g.rotation.z = Math.sin(q * PI * Math.max(4, dur * 14)) * 0.12; for (const f of p.fl) f.rotation.x = Math.sin(q * 30) * 0.4; }); p.g.rotation.z = 0; for (const f of p.fl) f.rotation.x = 0; } };
      /* a burst of drops from a moving point (a beak, a snorkel): dir 0 = up like a fountain, ±1 = forwards */
      function sprayAt(at, n, cols, dir, sz, gap) { const cs = [].concat(cols); for (let i = 0; i < n; i++) { const sp = c.sprite(cs[i % cs.length], R(0.1, 0.2) * (sz || 1), 0, -20, 0, demo, 0.95); let t2 = -i * (gap == null ? 0.03 : gap), on = false; const vx = dir ? dir * R(1.6, 3.8) : R(-0.6, 0.6), vz = R(-0.4, 0.4); let vy = dir ? R(0.2, 1.8) : R(2.6, 3.8);
          sims.push(d2 => { t2 += d2; if (t2 < 0) return true; if (!on) { on = true; sp.position.copy(at()); } vy -= 7 * d2; sp.position.x += vx * d2; sp.position.y += vy * d2; sp.position.z += vz * d2; sp.material.opacity = Math.max(0, 0.95 - t2 * 0.75); if (t2 > 1.25) { sp.removeFromParent(); sp.material.dispose(); return false; } }); } }
      /* stars circling over a head */
      function dizzyAt(at, dur, r) { snd('twinkle'); const ss = []; for (let i = 0; i < 3; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: KQ.iconTexture ? KQ.iconTexture('star') : null, color: KQ.iconTexture ? 0xffffff : 0xffd84a, transparent: true, depthTest: false })); sp.scale.setScalar(0.2); sp.position.y = -20; sp.renderOrder = 5; demo.add(sp); ss.push(sp); } let q = 0;
        sims.push(dt => { q += dt; const c0 = at(); ss.forEach((s, i) => { const a = q * 7 + i * TAU / 3; s.position.set(c0.x + Math.cos(a) * (r || 0.24), c0.y + 0.06, c0.z + Math.sin(a) * (r || 0.24)); s.material.opacity = clamp((dur - q) * 2, 0, 1); }); if (q >= dur) { for (const s of ss) { s.removeFromParent(); s.material.dispose(); } return false; } }); }
      /* an object hops in an arc onto a point, or onto a moving one (to is a function) */
      const arcTo = (o, to, dur, h, spin) => { const a = o.position.clone(); return anim(dur, q => { const e = typeof to === 'function' ? to() : to; o.position.set(a.x + (e.x - a.x) * q, a.y + (e.y - a.y) * q + Math.sin(PI * q) * (h == null ? 0.8 : h), a.z + (e.z - a.z) * q); if (spin) o.rotation.z += spin; }); };
      /* the supporting cast */
      function chicken(x, y, z) { const g = grp(x, y, z), wh = M(0xffffff, { roughness: 0.8 }), rd = M(0xe8303a, { roughness: 0.6 }), or = M(0xffa21a, { roughness: 0.5 });
        sph(0.2, wh, 0, 0.26, 0, g, 16).scale.set(1.2, 1, 0.9); const head = grp(0.2, 0.48, 0, g); sph(0.11, wh, 0, 0, 0, head, 14); for (let i = 0; i < 3; i++) sph(0.035, rd, -0.04 + i * 0.04, 0.11, 0, head, 8);
        cone(0.035, 0.09, or, 0.13, -0.01, 0, head, 6).rotation.z = -PI / 2; sph(0.03, rd, 0.1, -0.07, 0, head, 8).scale.y = 1.5; for (const zz of [-0.05, 0.05]) sph(0.018, M(0x111111), 0.08, 0.03, zz, head, 6);
        const wings = []; for (const s of [-1, 1]) { const w = grp(-0.02, 0.3, s * 0.17, g); sph(0.12, wh, -0.03, -0.03, 0, w, 10).scale.set(1.2, 0.7, 0.3); wings.push(w); }
        for (let i = 0; i < 3; i++) cone(0.05, 0.16, wh, -0.27, 0.36 + i * 0.03, (i - 1) * 0.05, g, 6).rotation.z = 0.9; for (const zz of [-0.06, 0.06]) cyl(0.012, 0.012, 0.12, or, 0.02, 0.06, zz, g, 5);
        return { g, head, wings }; }
      const flapWings = (ck, dur) => { let q = 0; sims.push(dt => { q += dt; ck.wings[0].rotation.x = -Math.abs(Math.sin(q * 30)) * 1.1; ck.wings[1].rotation.x = Math.abs(Math.sin(q * 30)) * 1.1; if (q >= dur || !ck.g.parent) { for (const w of ck.wings) w.rotation.x = 0; return false; } }); };
      function duck(x, y, z, sc) { const g = grp(x, y, z), ye = M(0xffd21a, { roughness: 0.35 }); sph(0.2, ye, 0, 0.12, 0, g, 16).scale.set(1.25, 0.8, 1); sph(0.12, ye, 0.13, 0.3, 0, g, 14); cone(0.05, 0.1, M(0xff8a1a), 0.26, 0.29, 0, g, 6).rotation.z = -PI / 2; for (const zz of [-0.05, 0.05]) sph(0.018, M(0x111111), 0.2, 0.33, zz, g, 6); cone(0.06, 0.12, ye, -0.26, 0.2, 0, g, 6).rotation.z = 1.1; g.scale.setScalar(sc || 1); return g; }
      function crab(x, y, z, sc) { const g = grp(x, y, z), rd = M(0xe8443a, { roughness: 0.5 }); sph(0.2, rd, 0, 0.12, 0, g, 16).scale.set(1.3, 0.55, 1); const claws = [];
        for (const s of [-1, 1]) { const c0 = grp(s * 0.27, 0.2, 0.12, g); sph(0.08, rd, 0, 0, 0, c0, 10).scale.set(1.2, 0.8, 0.8); cone(0.04, 0.1, rd, 0, 0.08, 0, c0, 6); claws.push(c0); for (let i = 0; i < 3; i++) cyl(0.015, 0.015, 0.2, rd, s * (0.12 + i * 0.07), 0.04, -0.08, g, 5).rotation.z = s * 0.9; }
        for (const s of [-1, 1]) { cyl(0.012, 0.012, 0.1, rd, s * 0.07, 0.25, 0.08, g, 5); sph(0.035, M(0xffffff), s * 0.07, 0.31, 0.08, g, 8); sph(0.018, M(0x111111), s * 0.07, 0.31, 0.11, g, 6); }
        g.scale.setScalar(sc || 1); return { g, claws }; }
      const egg = (x, y, z) => { const e = sph(0.07, M(0xfff6e6, { roughness: 0.4 }), x, y, z, null, 12); e.scale.y = 1.3; e.userData.hy = 0.09; return e; };
      /* ---------------------------------------------------------------- 1. gravity: drop the ball on the piñata */
      const gaugeR = v => (135 - 270 * clamp(v, 0, 14) / 14) * PI / 180;
      const onPed = (st, r) => (x, z) => (Math.abs(x - st.X) < r && Math.abs(z) < r) ? st.pTop : TOP;
      CH.gravity = { go: 'ph_go_drop',
        view: st => ({ x0: -3.4, x1: st.old ? 4.1 : 3.6, y0: 0, y1: st.old ? 7.4 : 6.3 }),
        lines: st => st.old ? { in: 'pv_g_o_in', win: 'pv_g_o_win', fail: { slow: 'pv_g_o_slow', fast: 'pv_g_o_fast' } } : st.var === 'egg' ? { in: 'pv_g_y_in_e', win: 'pv_g_y_win_e', fail: { mid: 'pv_g_y_crack_e', high: 'pv_g_y_splat_e' } } : { in: 'pv_g_y_in', win: 'pv_g_y_win', fail: { low: 'pv_g_y_low', mid: 'pv_g_y_mid' } },
        build(st) { plinth(7.8, 3.2, 0x86d46a, 0x4f8f45, 0.2); meadow(7.4, 2.8, 0.2); st.X = 1.2; st.PX = -1.7;
          cyl(0.56, 0.68, 0.45, M(0xfff1dc, { roughness: 0.5 }), st.X, TOP + 0.225, 0, null, 28); const rim = new T.Mesh(new T.TorusGeometry(0.56, 0.05, 8, 32), M(0xff7ad0)); rim.rotation.x = PI / 2; rim.position.set(st.X, TOP + 0.45, 0); demo.add(rim);
          st.pTop = TOP + 0.45; st.pinY = st.pTop + 0.86; st.hitY = st.pinY + 1.04; if (!st.old) st.var = pickVar(st, ['pinata', 'egg']); if (st.var === 'egg') this.nest(st); else this.pinata(st); if (st.old) this.bowl(st); this.helper(st);
          /* the pole with its heights, and the crane that carries the ball */
          const metal = M(0xd8dce6, { metalness: 0.55, roughness: 0.3 });
          const lv = st.old ? [1, 2, 4, 8].map(m => ({ v: m, m, text: t('ph_m', { n: m }) })) : (st.band <= 1 ? ['low', 'high'] : ['low', 'mid', 'high']).map(k => ({ v: k, m: { low: 1.5, mid: 3.0, high: 5.5 }[k], text: t('ph_' + k) }));
          st.levels = lv.map((l, i) => Object.assign(l, { y: st.hitY + 0.3 + l.m * 0.45, k: i / Math.max(1, lv.length - 1) }));
          const poleH = st.levels[st.levels.length - 1].y + 0.75 - TOP; cyl(0.09, 0.12, poleH, metal, st.PX, TOP + poleH / 2, 0); cyl(0.42, 0.5, 0.16, M(0x5a6070), st.PX, TOP + 0.08, 0);
          const LC = [0x6ad06a, 0xffd84a, 0xff9a3c, 0xff5a6a];
          st.levels.forEach((l, i) => { const col = LC[st.old ? i : (st.levels.length === 2 ? [0, 3][i] : [0, 1, 3][i])], y = l.y + 0.42; const ring = new T.Mesh(new T.TorusGeometry(0.16, 0.045, 8, 24), M(col)); ring.rotation.x = PI / 2; ring.position.set(st.PX, y, 0); demo.add(ring);
            const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(-0.48, 0.14); sh.lineTo(0, 0.28); sh.closePath(); const fl = new T.Mesh(new T.ShapeGeometry(sh), M(col, { side: T.DoubleSide })); fl.position.set(st.PX - 0.08, y - 0.02, 0); demo.add(fl);
            if (st.old) tag(l.text, st.PX - 1.05, y + 0.12, 0, 0.3); });
          const Lb = st.X - st.PX; st.arm = grp(st.PX, st.levels[0].y + 0.42, 0); cyl(0.17, 0.17, 0.42, M(0xff9a3c), 0, 0, 0, st.arm); box(Lb, 0.14, 0.18, M(0xffc84a), Lb / 2, 0, 0, st.arm); box(0.3, 0.26, 0.3, M(0x5a6070), 0.38, 0.17, 0, st.arm);
          cyl(0.035, 0.035, 0.16, metal, Lb, -0.12, 0, st.arm); box(0.5, 0.05, 0.14, metal, Lb, -0.2, 0, st.arm);
          const finger = s => { const f = grp(Lb + s * 0.23, -0.2, 0, st.arm); box(0.05, 0.34, 0.1, M(0x5a6070), s * 0.05, -0.17, 0, f); return f; }; st.fL = finger(-1); st.fR = finger(1);
          st.ball = this.ballOrEgg(st);
          /* 8+: a speedometer that follows the falling ball, with the piñata's zone in green and the bowl's in red */
          if (st.old) { const gx = st.X + 1.95, gy = 5.0, gg = grp(gx, gy, 0.3); cyl(0.04, 0.04, gy - 0.75 - TOP, metal, gx, TOP + (gy - 0.75 - TOP) / 2, 0.2);
            const face = tex(256, 256, (g2) => { const cx = 128, cy = 128; g2.fillStyle = '#fffaf0'; g2.beginPath(); g2.arc(cx, cy, 124, 0, TAU); g2.fill(); g2.lineWidth = 6; g2.strokeStyle = '#3a2a40'; g2.stroke();
              const at = (v, rr) => { const r = gaugeR(v); return [cx - Math.sin(r) * rr, cy - Math.cos(r) * rr]; };
              const arc = (v0, v1, col) => { g2.strokeStyle = col; g2.lineWidth = 16; g2.beginPath(); const n = 30; for (let i = 0; i <= n; i++) { const [x, y] = at(v0 + (v1 - v0) * i / n, 100); if (i) g2.lineTo(x, y); else g2.moveTo(x, y); } g2.stroke(); };
              arc(8, 10.5, '#3ecf7a'); arc(10.5, 14, '#ff5a5a'); g2.strokeStyle = '#3a2a40'; g2.lineWidth = 3; for (let v = 0; v <= 14; v += 2) { const [x0, y0] = at(v, 114), [x1, y1] = at(v, 90); g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x1, y1); g2.stroke(); }
              g2.fillStyle = '#3a2a40'; g2.font = 'bold 26px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; for (const v of [0, 4, 8, 12]) { const [x, y] = at(v, 68); g2.fillText(String(v), x, y); } g2.font = 'bold 22px sans-serif'; g2.fillText(t('ph_msu'), cx, cy + 64); });
            const fm = new T.MeshBasicMaterial({ map: face }); fm.userData.own = true; gg.add(new T.Mesh(new T.CircleGeometry(0.75, 48), fm)); const gr = new T.Mesh(new T.TorusGeometry(0.75, 0.05, 8, 40), M(0xffc84a, { metalness: 0.5, roughness: 0.3 })); gg.add(gr);
            const nd = grp(0, 0, 0.03, gg); box(0.05, 0.56, 0.02, M(0xd8202a), 0, 0.26, 0, nd); sph(0.07, M(0x3a2a40), 0, 0, 0.04, gg, 12); st.needle = nd; nd.rotation.z = gaugeR(0); } },
        pinata(st) { if (st.pin) drop(st.pin); const g = grp(st.X, st.pinY, 0); st.pin = g; const cols = [0xffd84a, 0x4ab0ff, 0x6ad06a, 0xff9a3c, 0xa87aff];
          sph(0.6, M(0xff4fa0, { roughness: 0.8 }), 0, 0, 0, g, 28);
          [-0.3, 0, 0.3].forEach((y, i) => { const b = new T.Mesh(new T.TorusGeometry(Math.sqrt(0.36 - y * y) + 0.012, 0.055, 6, 40), M(cols[i], { roughness: 0.9 })); b.rotation.x = PI / 2; b.position.y = y; g.add(b); });
          const UP = V3(0, 1, 0), dirs = []; for (let k = 0; k < 5; k++) { const a = PI / 2 + k * TAU / 5; dirs.push(V3(Math.cos(a), Math.sin(a), 0)); } dirs.push(V3(0, 0, 1), V3(0, 0, -1));
          dirs.forEach((d, i) => { const cn = new T.Mesh(new T.ConeGeometry(0.2, 0.6, 14), M(cols[i % 5], { roughness: 0.7 })); cn.quaternion.setFromUnitVectors(UP, d); cn.position.copy(d).multiplyScalar(0.74); g.add(cn);
            if (i < 5) for (let r = 0; r < 3; r++) { const tip = d.clone().multiplyScalar(1.02); box(0.025, 0.32, 0.07, M(cols[(i + r + 1) % 5], { side: T.DoubleSide }), tip.x + (r - 1) * 0.05, tip.y - 0.16, tip.z, g); } });
          /* a face, so it can giggle at you */
          st.pEyes = []; for (const s2 of [-1, 1]) { const e = grp(s2 * 0.25, 0.17, 0.5, g); sph(0.11, M(0xffffff, { roughness: 0.4 }), 0, 0, 0, e, 14); sph(0.055, M(0x111111), 0, 0, 0.085, e, 10); st.pEyes.push(e); }
          const mouth = new T.Mesh(new T.TorusGeometry(0.11, 0.026, 6, 16, PI), M(0x5a0a30)); mouth.rotation.z = PI; mouth.position.set(0, -0.3, 0.6); g.add(mouth); },
        /* the bowling ball, or (the egg variant) a speckled egg */
        ballOrEgg(st) { if (st.ball) drop(st.ball); const b = grp(st.X, st.levels[0].y, 0);
          if (st.var === 'egg') { sph(0.22, M(0xfff6e6, { roughness: 0.35 }), 0, 0, 0, b, 24).scale.set(1, 1.3, 1); for (const [x, y, z] of [[0.1, 0.12, 0.17], [-0.12, -0.05, 0.16], [0.05, -0.18, 0.18]]) sph(0.03, M(0xd8c8a8), x, y, z, b, 8); b.userData.hy = 0.29; }
          else { sph(0.3, M(0x24308a, { roughness: 0.15, metalness: 0.3 }), 0, 0, 0, b, 28); for (const [x, y, z] of [[-0.07, 0.24, 0.13], [0.07, 0.24, 0.13], [0, 0.17, 0.22]]) sph(0.045, M(0x0a0f2a), x, y, z, b, 10); b.userData.hy = 0.3; }
          return b; },
        nest(st) { if (st.nestG) drop(st.nestG); const g = st.nestG = grp(st.X, st.pTop, 0), br = M(0x9a6a3a, { roughness: 1 }), tor = new T.Mesh(new T.TorusGeometry(0.34, 0.12, 8, 22), br); tor.rotation.x = PI / 2; tor.position.y = 0.1; g.add(tor); cyl(0.3, 0.26, 0.08, M(0xe8d0a0, { roughness: 1 }), 0, 0.05, 0, g, 18);
          for (let i = 0; i < 16; i++) { const s2 = box(0.022, 0.022, R(0.22, 0.38), M(0xc8a060, { roughness: 1 }), Math.cos(i) * 0.32, 0.16, Math.sin(i) * 0.32, g); s2.rotation.set(R(-0.4, 0.4), i * 0.7, R(-0.4, 0.4)); } st.eggY = st.pTop + 0.12 + 0.29; },
        chick(x, y, z) { const g = grp(x, y, z), ye = M(0xffe04a, { roughness: 0.9 }); sph(0.15, ye, 0, 0.1, 0, g, 14); sph(0.11, ye, 0, 0.3, 0.02, g, 12); cone(0.03, 0.07, M(0xff8a1a), 0, 0.29, 0.13, g, 6).rotation.x = PI / 2;
          for (const s2 of [-1, 1]) { sph(0.022, M(0x111111), s2 * 0.045, 0.34, 0.1, g, 6); sph(0.06, ye, s2 * 0.14, 0.12, 0, g, 8).scale.set(0.5, 1, 0.8); } return g; },
        eggCrack(st) { const g = grp(0, 0.05, 0.215, st.ball); let x = -0.12, y = 0.04; for (let i = 0; i < 4; i++) { const nx = x + 0.07, ny = y + (i % 2 ? 0.06 : -0.08), m = box(Math.hypot(nx - x, ny - y), 0.016, 0.01, M(0x5a4030), (x + nx) / 2, (y + ny) / 2, 0, g); m.rotation.z = Math.atan2(ny - y, nx - x); x = nx; y = ny; } cone(0.03, 0.07, M(0xff8a1a), 0.02, 0.02, 0.03, g, 6).rotation.x = PI / 2; },
        /* the egg: from low it lands softly and hatches (the win); from the middle it cracks and a beak peeks out; from high — SPLAT, all over the penguin */
        async eggEnd(st, k) { const e = st.ball, p = st.pp; camIn(st, st.X + 0.7, st.pTop + 0.7, 3.2);
          if (k === 'low') { snd('plop'); await anim(0.25, q => { e.position.y = st.eggY + Math.sin(PI * q) * 0.08; }); await anim(0.8, q => { e.rotation.z = Math.sin(q * 34) * 0.22; }); e.rotation.z = 0; snd('pop');
            e.visible = false; const sm = M(0xfff6e6, { roughness: 0.35, side: T.DoubleSide }), bot = new T.Mesh(new T.SphereGeometry(0.22, 20, 10, 0, TAU, PI / 2, PI / 2), sm); bot.scale.set(1, 1.3, 1); bot.position.set(st.X, st.eggY, 0); demo.add(bot); st.trash.push(bot);
            const tp = new T.Mesh(new T.SphereGeometry(0.22, 20, 10, 0, TAU, 0, PI / 2), sm.clone()); tp.scale.set(1, 1.3, 1); tp.position.set(st.X, st.eggY, 0); demo.add(tp); st.trash.push(tp); arcTo(tp, V3(st.X - 0.75, TOP + 0.5, 0.4), 0.6, 0.8, 0.2);
            const ck = this.chick(st.X, st.eggY - 0.15, 0.05); st.trash.push(ck); ck.scale.setScalar(0.01); await anim(0.3, q => { ck.scale.setScalar(Math.max(0.01, 1.3 * c.over(q))); ck.position.y = st.eggY - 0.15 + 0.2 * q; });
            snd('tweet'); await anim(0.6, q => { ck.position.y = st.eggY + 0.05 + Math.abs(Math.sin(q * PI * 2)) * 0.1; }); snd('tweet'); hearts(ck.position.clone().add(V3(0, 0.4, 0)), 5);
            yay(); confetti(V3(st.X, st.pTop + 1.0, 0.3), 80, 2.4); firework(V3(st.X - 1.3, 4.6, -0.4), 0xffd84a); await wait(0.4); snd('happy'); pg.squash(p); await wait(1.0); camOut(st); return 'win'; }
          if (k === 'mid') { snd('thud'); this.eggCrack(st); snd('ow'); pg.blink(p, 2); await wait(0.6); snd('tweet'); await wait(0.6); await pg.look(p); snd('honkSad'); await wait(0.7); camOut(st); return 'mid'; }
          e.visible = false; snd('splat'); snd('crash'); const yolk = new T.Mesh(new T.CircleGeometry(0.4, 20), M(0xffc81a, { roughness: 0.3 })); yolk.rotation.x = -PI / 2; yolk.position.set(st.X, st.pTop + 0.13, 0); demo.add(yolk); st.trash.push(yolk);
          const bits = []; for (let i = 0; i < 10; i++) { const b = box(R(0.06, 0.12), 0.02, R(0.06, 0.12), M(0xfff6e6, { side: T.DoubleSide }), st.X, st.eggY, 0); b.userData.hy = 0.02; bits.push(b); } st.trash.push(...bits); fling(bits, V3(st.X, st.eggY - 0.2, 0), 2.6, TOP, { lift: 1 });
          const bl = sph(0.1, M(0xffc81a, { roughness: 0.3 }), st.X, st.eggY, 0.1, null, 12); st.trash.push(bl); await arcTo(bl, () => pg.top(p), 0.5, 0.8); bl.visible = false; snd('splat'); pg.goo(p, 0xffc81a); pg.squash(p, 1.4);   /* a big blob of yolk, onto the penguin */
          await wait(0.6); pg.blink(p, 2); await pg.look(p); snd('honkSad'); await wait(0.8); camOut(st); return 'high'; },
        /* the penguin waits by the piñata with a pail for the candy */
        helper(st) { if (st.pp) drop(st.pp.g); const p = st.pp = pip(st.X + 1.45, TOP, 0.62, 0.8, PI), pail = st.pail = grp(0.3, 0.5, 0, p.g); cyl(0.17, 0.13, 0.22, M(0xff5a6a, { roughness: 0.45 }), 0, 0, 0, pail, 16); const h = new T.Mesh(new T.TorusGeometry(0.16, 0.012, 6, 16, PI), M(0x9aa0aa)); h.position.y = 0.1; pail.add(h); },
        giggle(st) { snd('giggle'); let q = 0; const pin = st.pin; sims.push(dt => { q += dt; const on = q < 1.2; for (const e of st.pEyes) e.scale.y = on ? 0.3 : 1; pin.position.y = st.pinY + (on ? Math.abs(Math.sin(q * 28)) * 0.05 : 0); return q < 1.25; }); },
        /* it bursts: candy rains into the pail, the biggest one lands on the penguin's head, it eats it and laughs */
        async feast(st) { const p = st.pp, cols = [0xff4fa0, 0xffd84a, 0x4ab0ff, 0x6ad06a]; camIn(st, st.X + 0.8, TOP + 1.35, 3.6); await wait(0.25); const from = V3(st.X, st.pinY, 0.15);
          for (let i = 0; i < 4; i++) { const cd = this.candy(cols[i]); cd.scale.setScalar(1.4); cd.position.copy(from); st.trash.push(cd); arcTo(cd, () => st.pail.getWorldPosition(V3()).add(V3(0, 0.1, 0)), 0.5, 0.9, 0.3).then(() => { cd.visible = false; snd('plink'); pg.squash(p, 0.4); }); await wait(0.16); }
          await wait(0.55); const big = this.candy(0xff9a3c); big.scale.setScalar(2.4); big.position.copy(from); st.trash.push(big); snd('whistleDown');
          await arcTo(big, () => pg.top(p).add(V3(0, 0.12, 0)), 0.6, 1.2, 0.25); snd('boink'); pg.squash(p, 1.2); pg.blink(p, 2); await wait(0.45);
          const b0 = big.position.clone(); await anim(0.3, q => { big.position.lerpVectors(b0, pg.beak(p), q); big.scale.setScalar(2.4 * (1 - 0.8 * q)); }); big.visible = false; snd('gulp');
          await anim(0.3, q => { p.head.scale.setScalar(1 + 0.25 * Math.sin(PI * q)); }); p.head.scale.setScalar(1); await pg.laugh(p); hearts(pg.top(p), 5); await wait(0.5); camOut(st); await wait(0.6); },
        /* too slow to break it: the ball bonks off, the piñata giggles at you, and the ball lands on the penguin's head */
        async bonk(st, mid) { const p = st.pp; camIn(st, st.X + 0.8, TOP + 1.4, 3.6); snd('boing'); this.wobble(st); if (mid) { this.crack(st); snd('ow'); }
          await arcTo(st.ball, () => pg.top(p).add(V3(0, 0.26, 0)), 0.6, 1.0, -0.15); snd('boink'); pg.squash(p, 1.5); pg.dizzy(p, 2.4); pg.wobble(p, 1.8, 0.22);
          fling([st.ball], st.ball.position.clone().add(V3(-0.35, -0.3, 0)), 1.3, TOP, { lift: 0.5, dir: 1 }); this.giggle(st); await wait(1.4); pg.blink(p, 2); await pg.look(p); await wait(0.7); camOut(st); },
        /* too fast: candy AND glass everywhere — the penguin hides behind its flippers, shaking, then peeks out */
        async hide(st) { const p = st.pp, x0 = p.g.position.x; camIn(st, st.X + 0.8, TOP + 1.3, 3.6); snd('gasp'); await anim(0.22, q => { pg.cover(p, q); p.g.scale.set(p.sc, p.sc * (1 - 0.22 * q), p.sc); });
          await anim(1.1, q => { p.g.position.x = x0 + Math.sin(q * 70) * 0.02; }); p.g.position.x = x0; await anim(0.3, q => pg.cover(p, 1 - 0.55 * q)); pg.blink(p, 2); snd('honkSad'); await wait(0.9);
          await anim(0.25, q => { pg.cover(p, 0.45 * (1 - q)); p.g.scale.set(p.sc, p.sc * (0.78 + 0.22 * q), p.sc); }); camOut(st); },
        bowl(st) { const g = grp(st.X, st.pTop + 1.08, 0); st.bowlG = g; const gl = new T.Mesh(new T.SphereGeometry(1.08, 36, 18, 0, TAU, PI / 2, PI / 2), new T.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, side: T.DoubleSide, depthWrite: false })); g.add(gl);
          const r = new T.Mesh(new T.TorusGeometry(1.08, 0.03, 8, 48), new T.MeshStandardMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.7, roughness: 0.05 })); r.rotation.x = PI / 2; g.add(r); },
        candy(col) { const g = grp(0, 0, 0); cyl(0.07, 0.07, 0.16, M(col, { roughness: 0.3 }), 0, 0, 0, g, 10).rotation.z = PI / 2; for (const s of [-1, 1]) cone(0.07, 0.1, M(col, { roughness: 0.4 }), s * 0.13, 0, 0, g, 6).rotation.z = s * PI / 2; g.userData.hy = 0.07; return g; },
        burst(st) { st.pin.visible = false; snd('pop'); snd('crash'); const at = V3(st.X, st.pinY, 0), cols = [0xff4fa0, 0xffd84a, 0x4ab0ff, 0x6ad06a, 0xff9a3c, 0xa87aff], bits = []; impact(at.clone().add(V3(0, 0.5, 0)), 0xffe08a, 1.2);
          for (let i = 0; i < 22; i++) { const b = box(R(0.2, 0.36), R(0.16, 0.3), 0.04, M(cols[i % 6], { roughness: 0.7, side: T.DoubleSide }), at.x + R(-0.4, 0.4), at.y + R(-0.4, 0.4), R(-0.3, 0.3)); b.userData.hy = 0.03; bits.push(b); }
          for (let i = 0; i < 26; i++) { const cd = this.candy(cols[(i + 2) % 6]); cd.scale.setScalar(1.3); cd.position.set(at.x + R(-0.3, 0.3), at.y + R(-0.3, 0.3), R(-0.25, 0.25)); bits.push(cd); }
          st.trash.push(...bits); fling(bits, at.clone().add(V3(0, -0.35, 0)), 7, onPed(st, 0.62), { lift: 0.9 }); },
        wobble(st) { const g = st.pin; let tm = 0; sims.push(dt => { tm += dt; g.rotation.z = 0.35 * Math.exp(-2.5 * tm) * Math.sin(11 * tm); if (tm > 2.2) { g.rotation.z = 0; return false; } }); },
        crack(st) { snd('thud'); const g = grp(0, 0.05, 0.57, st.pin); let x = -0.2, y = 0.16; for (let i = 0; i < 4; i++) { const nx = x + 0.12, ny = y + (i % 2 ? 0.1 : -0.14), m = box(Math.hypot(nx - x, ny - y), 0.028, 0.02, M(0x2a1020), (x + nx) / 2, (y + ny) / 2, 0, g); m.rotation.z = Math.atan2(ny - y, nx - x); x = nx; y = ny; } },
        rows: st => [{ label: st.old ? t('ph_r_height') : null, opts: st.levels.map(l => ({ v: l.v, icon: SVG.level(l.k), text: l.text })) }],
        answer: st => [st.old ? 4 : st.var === 'egg' ? 'low' : 'high'],
        preview(st) { const L = st.levels.find(l => l.v === st.sel[0]); if (!L) return; const my = st.mv = (st.mv || 0) + 1, y0 = st.arm.position.y, y1 = L.y + 0.42; if (Math.abs(y1 - y0) < 0.01) return; snd('swish');
          tween(0.5, k => { if (st.mv !== my) return; const y = y0 + (y1 - y0) * K.ease(k); st.arm.position.y = y; st.ball.position.y = y - 0.42; }); },
        async run(st, sel) { const L = st.levels.find(l => l.v === sel[0]), yC = st.var === 'egg' ? st.eggY : st.hitY + 0.3, y0 = st.ball.position.y, g = 9.8 * 0.45; let tm = 0, last = 0;
          await anim(0.25, k => { st.fL.rotation.z = 0.55 * k; st.fR.rotation.z = -0.55 * k; }); snd('whoosh');
          await until(dt => { tm += dt; const y = y0 - 0.5 * g * tm * tm; st.ball.position.y = Math.max(yC, y); st.ball.rotation.x += dt * 3;
            if (tm - last > 0.04) { last = tm; const s = c.sprite(0xffffff, 0.5, st.X, st.ball.position.y + 0.25, -0.05, demo, 0.35); let q = 0; sims.push(d2 => { q += d2 / 0.35; s.material.opacity = 0.35 * (1 - q); s.scale.setScalar(0.5 * (1 - q * 0.5)); if (q >= 1) { s.removeFromParent(); s.material.dispose(); return false; } }); }
            if (st.needle) st.needle.rotation.z = gaugeR(9.8 * tm); return y <= yC; }, 5);
          const v = Math.sqrt(2 * 9.8 * L.m); if (st.needle) st.needle.rotation.z = gaugeR(v); if (st.var === 'egg') return this.eggEnd(st, sel[0]);
          const ok = st.old ? v >= 8 && v <= 10.5 : v >= 9.5, fast = st.old && v > 10.5;
          if (ok || fast) { this.burst(st); if (fast) { st.bowlG.visible = false; c.shatterAt(V3(st.X, st.pTop + 0.5, 0), 0xd8f0ff, 26); snd('smash'); }
            fling([st.ball], V3(st.X + 0.3, yC - 0.4, 0), 1.6, onPed(st, 0.62), { lift: 0.3 });   /* away from the penguin */
            if (ok) { yay(); confetti(V3(st.X, st.pinY + 0.4, 0.3), 110, 3.6); firework(V3(st.X - 1.5, 5.6, -0.4), 0xff7ad0); await wait(0.35); firework(V3(st.X + 1.1, 6.3, -0.4), 0xffd84a); await this.feast(st); return 'win'; }
            await this.hide(st); return 'fast'; }
          await this.bonk(st, sel[0] === 'mid'); return st.old ? 'slow' : sel[0]; },
        async reset(st) { still(st.ball); if (st.var === 'egg') { this.nest(st); st.ball = this.ballOrEgg(st); } else this.pinata(st); this.helper(st); if (st.old) { drop(st.bowlG); this.bowl(st); }
          st.ball.rotation.set(0, 0, 0); st.ball.position.set(st.X, st.arm.position.y - 0.42, 0); st.fL.rotation.z = 0; st.fR.rotation.z = 0; if (st.needle) st.needle.rotation.z = gaugeR(0);
          puff(V3(st.X, st.pinY, 0.3), 0xffffff, 8, 0.5, 0.8, 0.6); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- 2. inertia: the tablecloth trick */
      CH.inertia = { go: 'ph_go_pull',
        view: () => ({ x0: -3.4, x1: 4.6, y0: 0, y1: 4.7 }),
        lines: st => st.old ? { in: 'pv_i_o_in', win: 'pv_i_o_win', fail: { drag: 'pv_i_o_drag' } } : st.var === 'serve' ? { in: 'pv_i_y_in_s', win: 'pv_i_y_win_s', fail: { fast: 'pv_i_y_fast_s', mid: 'pv_i_y_mid_s' } } : { in: 'pv_i_y_in', win: 'pv_i_y_win', fail: { slow: 'pv_i_y_slow', mid: 'pv_i_y_mid' } },
        CLOTH: { silk: { mu: 0.1, a: '#f7a8d0', b: '#ffe6f3' }, cotton: { mu: 0.3, a: '#ffffff', b: '#e8343a' }, burlap: { mu: 0.6, a: '#c8a070', b: '#8a6438' } },
        build(st) { plinth(8.4, 3.2, 0xd8a868, 0x8a5a3a, 0.6);
          const cm = [M(0xb0122a, { roughness: 0.9 }), M(0x8a0a1e, { roughness: 0.9 })]; for (let i = 0; i < 14; i++) cyl(0.33, 0.33, 4.2, cm[i % 2], -3.4 + i * 0.62, TOP + 2.1, -1.35, null, 12);
          box(8.9, 0.42, 0.34, M(0xe8b84a, { metalness: 0.4, roughness: 0.35 }), 0.6, TOP + 4.3, -1.2);
          const spot = new T.Mesh(new T.CircleGeometry(2.1, 40), new T.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.22, depthWrite: false })); spot.rotation.x = -PI / 2; spot.position.set(0, TOP + 0.01, 0.2); demo.add(spot);
          st.TY = TOP + 1.36; st.EDGE = 1.7; box(3.4, 0.12, 1.6, M(0xfff8ee, { roughness: 0.5 }), 0, st.TY - 0.06, 0); for (const [x, z] of [[-1.5, -0.62], [1.5, -0.62], [-1.5, 0.62], [1.5, 0.62]]) cyl(0.07, 0.05, 1.3, M(0x8a5a3a), x, TOP + 0.65, z, null, 10);
          if (!st.old) st.var = pickVar(st, ['dishes', 'serve']); st.clothK = 'cotton'; this.cloth(st); this.items(st);
          const W = grp(3.55, TOP, 0); box(0.9, 0.5, 0.9, M(0x5a6070, { metalness: 0.3 }), 0, 0.25, 0, W); for (const z of [-0.36, 0.36]) box(0.12, 0.9, 0.12, M(0x3a4050), 0, 0.85, z, W);
          cyl(0.22, 0.22, 0.62, M(0xffc84a, { metalness: 0.4, roughness: 0.35 }), 0, 1.0, 0, W, 18).rotation.x = PI / 2;
          st.crank = grp(0, 1.0, 0.42, W); box(0.06, 0.42, 0.06, M(0x3a4050), 0, 0.21, 0, st.crank); sph(0.08, M(0xff5a5a), 0, 0.44, 0.05, st.crank, 10);
          st.rope = cyl(0.025, 0.025, 1, M(0xe8d8b0), 0, 0, 0, null, 6); this.ropeTo(st); this.helper(st); },
        /* the penguin stands by the table, right where things land when they slide off */
        helper(st) { if (st.pp) drop(st.pp.g); st.pp = pip(2.45, TOP, 0.95, 0.85, PI); if (st.var === 'serve') st.plate = cyl(0.26, 0.2, 0.04, M(0xffffff, { roughness: 0.3 }), 0.36, 0.52, 0, st.pp.g, 20); },   /* serve: it holds out a plate */
        toPlate(st, it) { const g = it.g, pl = st.plate; demo.attach(g); snd('whoosh'); arcTo(g, () => pl.getWorldPosition(V3()).add(V3(0, 0.03, 0)), 0.5, 0.5).then(() => { if (!pl.parent) return; pl.attach(g); g.position.set(0, 0.03, 0); g.rotation.set(0, 0, 0); snd('plop'); }); },
        /* serve: pulled slowly, the cloth drags the cake to the edge and onto the penguin's plate — chomp, chomp, gulp; too fast and the cake stays put */
        async serveEnd(st, served, T0, k) { const p = st.pp;
          if (served) { await wait(0.7); const ck = st.its[0].g; pg.blink(p, 2); await wait(0.3); for (let i = 0; i < 3; i++) { snd('chomp'); ck.scale.multiplyScalar(0.7); await wait(0.25); } ck.visible = false; snd('gulp');
            await anim(0.4, q => { p.belly.scale.set(0.95 * (1 + 0.4 * Math.sin(PI * q * 0.5)), 1.22, 0.8); }); await pg.laugh(p, false); hearts(pg.top(p), 6); yay(); confetti(V3(1.6, TOP + 2.0, 0.4), 80, 2.4); await wait(0.6); camOut(st); return 'win'; }
          if (T0 < 0.4) await this.ghost(st, true); else { this.flyCloth(st, false); await wait(0.9); pg.blink(p, 2); await pg.look(p); snd('honkSad'); await wait(0.8); }
          camOut(st); return k; },
        /* the one dish that comes off onto the penguin: the cake lands upside down on its head, the teapot or a cup becomes a hat */
        toPip(st, it) { const g = it.g, p = st.pp, flip = it.k !== 'tea'; snd('whoosh'); demo.attach(g);
          anim(0.6, q => { g.rotation.z = (flip ? PI : 0) * q; });
          arcTo(g, () => pg.top(p).add(V3(0, it.k === 'cake' ? 0.66 : 0.14, 0)), 0.6, 0.6).then(() => { if (!p.g.parent) return; p.head.attach(g); g.rotation.set(0, 0, flip ? PI : 0); g.position.set(0, it.k === 'cake' ? 1.0 : it.k === 'cup' ? 0.4 : 0.2, 0);
            snd(it.k === 'cake' ? 'splat' : 'plink'); pg.squash(p, 1.4); if (it.k === 'cake') pg.goo(p, 0xff9ac8); else pg.dizzy(p, 1.8); }); },
        /* the trick works: the cloth flies off and lands right over the penguin — a ghost! It wobbles about, the sheet slides off, and
           there it is, wide-eyed; it takes a bow and laughs */
        async ghost(st, sad) { const p = st.pp, cl = st.cloth; st.rope.visible = false; const p0 = cl.position.clone(), tgt = p.g.position.clone().add(V3(0, 1.3, 0)); snd('whoosh');
          await anim(0.5, q => { cl.position.set(p0.x + (tgt.x - p0.x) * q, p0.y + (tgt.y - p0.y) * q + Math.sin(PI * q) * 0.9, p0.z + (tgt.z - p0.z) * q); cl.rotation.z = -q * 2.4; cl.rotation.x = q * 1.2; cl.scale.setScalar(1 - 0.5 * q); });
          cl.visible = false; const m = cl.children[0].material, gh = grp(p.g.position.x, TOP, p.g.position.z); st.trash.push(gh); cyl(0.36, 0.52, 1.0, m, 0, 0.5, 0, gh, 20); sph(0.36, m, 0, 1.0, 0, gh, 18).scale.y = 0.75;
          for (const s2 of [-1, 1]) { const h = new T.Mesh(new T.CircleGeometry(0.065, 14), M(0x111111)); h.position.set(s2 * 0.13, 0.97, 0.37); gh.add(h); }   /* eye holes, like a ghost costume */
          p.g.visible = false; gh.scale.set(1.25, 0.15, 1.25); snd('squish'); await anim(0.2, q => gh.scale.set(1.25 - 0.25 * q, 0.15 + 0.85 * q, 1.25 - 0.25 * q));
          snd('ghost'); const gx = gh.position.x; await anim(1.1, q => { gh.position.x = gx + Math.sin(q * TAU) * 0.28; gh.rotation.z = Math.sin(q * PI * 4) * 0.12; });
          gh.position.x = gx; gh.rotation.z = 0; p.g.visible = true; for (const e of p.eyes) e.scale.setScalar(1.45); snd('swish'); await anim(0.4, q => { gh.scale.set(1 + 0.4 * q, 1 - 0.94 * q, 1 + 0.4 * q); });
          await wait(0.3); for (const e of p.eyes) e.scale.setScalar(1); pg.blink(p, 2); await wait(0.3); if (sad) { await pg.look(p); snd('honkSad'); await wait(0.6); return; } await anim(0.3, q => { p.g.rotation.z = -0.55 * Math.sin(PI * q); }); p.g.rotation.z = 0; await pg.laugh(p, false); },
        /* after the crash: cake on its head — it licks the frosting and is quite happy; a hat — it blinks at you */
        async afterMess(st, vic) { const p = st.pp; await wait(0.4); pg.blink(p, 2); await wait(0.4); await pg.look(p);
          if (vic && vic.k === 'cake') { snd('slurp'); await anim(0.7, q => { p.head.rotation.z = Math.sin(q * PI * 3) * 0.15; }); p.head.rotation.z = 0; snd('honk'); hearts(pg.top(p), 4); } else snd('honkSad');
          await wait(0.9); },
        ropeTo(st) { const a = V3(st.cloth.position.x + 1.78, st.TY + 0.02, 0), b = V3(3.5, TOP + 1.22, 0); st.rope.position.copy(a).add(b).multiplyScalar(0.5); st.rope.scale.set(1, a.distanceTo(b), 1); st.rope.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); },
        cloth(st) { if (st.cloth) drop(st.cloth); const g = grp(0, st.TY, 0); st.cloth = g; const k = st.clothK, C = this.CLOTH[k];
          const tx = tex(128, 128, (g2, w, h) => { g2.fillStyle = C.a; g2.fillRect(0, 0, w, h);
            if (k === 'cotton') { g2.fillStyle = C.b; g2.globalAlpha = 0.55; for (let i = 0; i < 8; i += 2) { g2.fillRect(i * 16, 0, 16, h); g2.fillRect(0, i * 16, w, 16); } g2.globalAlpha = 1; }
            else if (k === 'burlap') { g2.strokeStyle = C.b; g2.lineWidth = 2; for (let i = 0; i < w; i += 6) { g2.beginPath(); g2.moveTo(i, 0); g2.lineTo(i, h); g2.stroke(); g2.beginPath(); g2.moveTo(0, i); g2.lineTo(w, i); g2.stroke(); } }
            else { const gr = g2.createLinearGradient(0, 0, w, h); gr.addColorStop(0, C.a); gr.addColorStop(0.5, C.b); gr.addColorStop(1, C.a); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); } }, [3, 2]);
          const m = texM(tx, { roughness: k === 'silk' ? 0.25 : 0.95, metalness: k === 'silk' ? 0.15 : 0, side: T.DoubleSide });
          box(3.56, 0.03, 1.76, m, 0, 0.015, 0, g); for (const z of [-0.88, 0.88]) box(3.56, 0.38, 0.02, m, 0, -0.17, z, g); for (const x of [-1.78, 1.78]) box(0.02, 0.38, 1.76, m, x, -0.17, 0, g); },
        items(st) { for (const it of st.its || []) drop(it.g); st.its = []; const y0 = st.TY + 0.03, add = (g, x, z, col, hy) => { g.position.set(x, y0, z); st.its.push({ g, x0: x, z, col, hy, k: { 0xffffff: 'plates', 0xff9ac8: 'cake', 0xffd84a: 'cup', 0x3ab0a0: 'tea' }[col] }); };
          if (st.var !== 'serve') { const g = grp(); for (let i = 0; i < 4; i++) { cyl(0.32, 0.26, 0.05, M(0xffffff, { roughness: 0.3 }), 0, 0.03 + i * 0.055, 0, g, 28); const rim = new T.Mesh(new T.TorusGeometry(0.3, 0.015, 6, 28), M(0x4a7ae0)); rim.rotation.x = PI / 2; rim.position.y = 0.055 + i * 0.055; g.add(rim); } add(g, -1.0, 0.1, 0xffffff, 0.12); }
          { const g = grp(); cyl(0.08, 0.14, 0.18, M(0xfff1dc), 0, 0.09, 0, g, 14); cyl(0.42, 0.42, 0.04, M(0xfff1dc), 0, 0.2, 0, g, 28); cyl(0.34, 0.34, 0.22, M(0xff9ac8, { roughness: 0.6 }), 0, 0.33, 0, g, 28); cyl(0.35, 0.35, 0.05, M(0xffffff), 0, 0.46, 0, g, 28); cyl(0.26, 0.26, 0.16, M(0xff9ac8), 0, 0.56, 0, g, 28); sph(0.07, M(0xd8102a, { roughness: 0.3 }), 0, 0.7, 0, g, 12); add(g, -0.05, -0.1, 0xff9ac8, 0.36); }
          if (st.var !== 'serve') for (const [x, z] of [[0.5, 0.42], [-0.45, -0.45]]) { const g = grp(); cyl(0.17, 0.17, 0.02, M(0xffffff), 0, 0.01, 0, g, 18); cyl(0.1, 0.08, 0.14, M(0xffd84a, { roughness: 0.4 }), 0, 0.09, 0, g, 16); const h = new T.Mesh(new T.TorusGeometry(0.05, 0.015, 6, 12), M(0xffd84a)); h.position.set(0.11, 0.09, 0); g.add(h); add(g, x, z, 0xffd84a, 0.08); }
          if (st.var !== 'serve') { const g = grp(); sph(0.24, M(0x3ab0a0, { roughness: 0.35 }), 0, 0.2, 0, g, 20).scale.set(1, 0.82, 1); cyl(0.03, 0.05, 0.26, M(0x3ab0a0), 0.26, 0.24, 0, g, 8).rotation.z = -0.9; const hd = new T.Mesh(new T.TorusGeometry(0.11, 0.025, 6, 14), M(0x3ab0a0)); hd.position.set(-0.24, 0.24, 0); g.add(hd); sph(0.06, M(0xffd84a), 0, 0.42, 0, g, 10); add(g, 1.15, 0, 0x3ab0a0, 0.2); } },
        rows: st => st.old ? [{ label: t('ph_r_cloth'), opts: ['silk', 'cotton', 'burlap'].map(k => ({ v: k, icon: SVG.swatch(CH.inertia.CLOTH[k].a, CH.inertia.CLOTH[k].b), text: t('ph_' + k) })) }, { label: t('ph_r_time'), opts: [2, 1, 0.5, 0.25].map(s => ({ v: s, text: t('ph_sec', { n: s }) })) }]
          : [{ opts: (st.band <= 1 ? ['slow', 'fast'] : ['slow', 'mid', 'fast']).map(k => ({ v: k, icon: { slow: 'turtle', mid: 'rabbit', fast: 'rocket' }[k], text: t({ slow: 'ph_slow', mid: 'ph_med', fast: 'ph_fast' }[k]) })) }],
        answer: st => st.old ? ['silk', 0.25] : [st.var === 'serve' ? 'slow' : 'fast'],
        preview(st) { if (st.old && st.sel[0] && st.clothK !== st.sel[0]) { st.clothK = st.sel[0]; this.cloth(st); this.ropeTo(st); snd('swish'); } },
        fall(st, it, vx) { const g = it.g, v = V3(vx, 0.4, R(-0.2, 0.2)), w = R(-5, -2); snd('whoosh');
          sims.push(dt => { v.y -= 9.8 * dt; g.position.addScaledVector(v, dt); g.rotation.z += w * dt; if (g.position.y > TOP + 0.05) return true;
            g.visible = false; const at = V3(g.position.x, TOP + 0.15, g.position.z); c.shatterAt(at, it.col, 16); snd('smash'); shake(0.05, 0.25);
            if (it.col === 0xff9ac8) { const sp = new T.Mesh(new T.CircleGeometry(0.45, 20), M(0xff9ac8, { roughness: 0.9 })); sp.rotation.x = -PI / 2; sp.position.set(at.x, TOP + 0.015, at.z); demo.add(sp); st.trash.push(sp); } return false; }); },
        flyCloth(st, fast) { const g = st.cloth, v = V3(fast ? 2.4 : 1.0, fast ? 3.4 : 0.3, 0.3); st.rope.visible = false; let done = false;
          sims.push(dt => { if (done) return false; v.y -= 6 * dt; g.position.addScaledVector(v, dt); g.rotation.z -= dt * (fast ? 2.4 : 1.2); g.rotation.x += dt * (fast ? 1.6 : 0.3); if (g.position.y < TOP + 0.15) { g.position.y = TOP + 0.12; g.rotation.set(0, 0.4, 0); g.scale.set(0.6, 0.35, 0.6); done = true; snd('thud'); return false; } }); },
        async run(st, sel) { const mu = st.old ? this.CLOTH[sel[0]].mu : 0.3, T0 = st.old ? sel[1] : { slow: 2.4, mid: 0.7, fast: 0.12 }[sel[0]], L = 3.9, g = 9.8, sticks = 2 * L / (T0 * T0) <= mu * g;
          /* each dish is dragged only while the cloth is still under it: slipping, it moves ½·μ·g·t²; if the pull is gentle enough, it rides along */
          for (const it of st.its) { const tc = T0 * Math.sqrt(clamp((it.x0 + 1.78) / L, 0, 1)); it.s = sticks ? 99 : 0.5 * mu * g * tc * tc; it.falls = it.x0 + it.s > st.EDGE - 0.08; it.out = false; }
          /* the one that lands on the penguin: the cake if it falls, else the teapot, else a cup */
          const vic = ['cake', 'tea', 'cup'].map(k => st.its.find(i => i.falls && i.k === k)).find(Boolean); if (vic) { if (st.var === 'serve') vic.toPlate = true; else vic.toPip = true; }
          camIn(st, 1.3, TOP + 1.3, 4.2); snd(T0 < 0.4 ? 'whoosh' : 'slide'); let tm = 0;
          await until(dt => { tm += dt; const k = Math.min(1, tm / T0), cx = L * k * k; st.cloth.position.x = cx; this.ropeTo(st); st.crank.rotation.z -= dt * 18 / T0;
            for (const it of st.its) { if (it.out) continue; const d = sticks ? cx : Math.min(it.s, 0.5 * mu * g * tm * tm); it.g.position.x = it.x0 + d;
              if (it.g.position.x > st.EDGE - 0.02) { it.out = true; if (it.toPlate) this.toPlate(st, it); else if (it.toPip) this.toPip(st, it); else this.fall(st, it, sticks ? Math.min(3, 2 * L * Math.max(tm, 0.01) / (T0 * T0)) : 0.8); } }
            return tm >= T0; }, 8);
          const fell = st.its.filter(i => i.falls); if (st.var === 'serve') return this.serveEnd(st, fell.length > 0, T0, sel[0]);
          if (fell.length) { this.flyCloth(st, T0 < 0.7); await wait(1.6); }
          if (!fell.length) { const gh = this.ghost(st); for (const it of st.its) { const gg = it.g; let q = 0; sims.push(dt => { q += dt; gg.rotation.z = 0.07 * Math.sin(q * 30) * Math.exp(-q * 5); return q < 1 || (gg.rotation.z = 0, false); }); }
            snd('clap'); yay(); confetti(V3(-2.4, 2.4, 0.5), 60, 2.2); confetti(V3(2.6, 2.4, 0.5), 60, 2.2); firework(V3(0, 3.9, -0.6), 0xffd84a);
            for (let i = 0; i < 12; i++) { const s = glow(0xfff4b0, 0.4, R(-1.7, 1.7), st.TY + R(0.2, 1.2), R(-0.6, 0.8), 0); let q = -i * 0.08; sims.push(dt => { q += dt; if (q < 0) return true; s.material.opacity = Math.max(0, Math.sin(q * 5)) * Math.max(0, 1 - q / 1.6); s.scale.setScalar(0.3 + 0.3 * Math.abs(Math.sin(q * 5))); if (q > 1.6) { s.removeFromParent(); s.material.dispose(); return false; } }); }
            await gh; await wait(0.4); camOut(st); return 'win'; }
          await this.afterMess(st, vic); camOut(st); return st.old ? 'drag' : sel[0]; },
        async reset(st) { this.items(st); this.cloth(st); this.helper(st); st.rope.visible = true; this.ropeTo(st); st.crank.rotation.z = 0; puff(V3(0, st.TY + 0.4, 0.3), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- 3. force and mass: the fruit catapult and the tower of cans */
      CH.force = { go: 'ph_go_launch',
        view: st => ({ x0: -6.4, x1: Math.max(3.8, st.TX + 1.3), y0: 0, y1: 4.6 }),
        lines: st => st.old ? { in: 'pv_f_o_in', win: 'pv_f_o_win', fail: { short: 'pv_f_o_short', long: 'pv_f_o_long' } } : { in: 'pv_f_y_in', win: 'pv_f_y_win', fail: { short: 'pv_f_y_heavy', long: 'pv_f_y_light', shortA: 'pv_f_y_short', longA: 'pv_f_y_long' } },
        LX: -4.2, PY: TOP + 1.25, CK: PI + 0.35, RL: PI / 2 - 0.25,
        FRY: { pumpkin: 3, apple: 2, grapes: 1.5 },   /* the young fruits' masses (not shown): near, middle and far cans */
        FR: { pumpkin: { m: 4, col: 0xff8a1a, splat: true }, apple: { m: 2, col: 0xe8303a }, grapes: { m: 1, col: 0x7a3aa8, many: true }, melon: { m: 2, col: 0x3a9a3a, splat: true, inside: 0xff5a6a }, pineapple: { m: 1, col: 0xe8b030 } },
        fruit(id) { const g = grp(); const F = this.FR[id];
          if (id === 'pumpkin') { sph(0.28, M(0xff8a1a, { roughness: 0.6 }), 0, 0, 0, g, 22).scale.set(1, 0.78, 1); for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.TorusGeometry(0.28, 0.022, 6, 24), M(0xe86a0a)); r.rotation.y = i * PI / 6; r.scale.y = 0.78; g.add(r); } cyl(0.03, 0.04, 0.12, M(0x3a7a2a), 0, 0.26, 0, g, 8); g.userData.r = 0.28; }
          else if (id === 'apple') { sph(0.18, M(0xe8303a, { roughness: 0.35 }), 0, 0, 0, g, 20).scale.set(1, 0.92, 1); cyl(0.012, 0.012, 0.1, M(0x6a4a2a), 0, 0.2, 0, g, 6); sph(0.06, M(0x4ac05a), 0.06, 0.22, 0, g, 8).scale.set(1.6, 0.4, 0.8); g.userData.r = 0.18; }
          else if (id === 'grapes') { const gm = M(0x7a3aa8, { roughness: 0.3 }); let n = 0; for (const [cnt, y] of [[4, 0.09], [3, -0.02], [2, -0.12], [1, -0.21]]) for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU + y * 3, r = cnt > 1 ? 0.06 + cnt * 0.012 : 0; sph(0.065, gm, Math.cos(a) * r, y, Math.sin(a) * r, g, 10); n++; } cyl(0.01, 0.01, 0.12, M(0x3a7a2a), 0, 0.18, 0, g, 6); g.userData.r = 0.2; }
          else if (id === 'melon') { const tx = tex(64, 32, (g2, w, h) => { g2.fillStyle = '#5ab84a'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#2a6a2a'; for (let i = 0; i < w; i += 8) g2.fillRect(i, 0, 3, h); }); sph(0.25, texM(tx, { roughness: 0.4 }), 0, 0, 0, g, 22); g.userData.r = 0.25; }
          else { const tx = tex(32, 32, (g2, w, h) => { g2.fillStyle = '#e8b030'; g2.fillRect(0, 0, w, h); g2.strokeStyle = '#8a5a10'; g2.lineWidth = 2; for (let i = -w; i < w; i += 8) { g2.beginPath(); g2.moveTo(i, 0); g2.lineTo(i + h, h); g2.stroke(); g2.beginPath(); g2.moveTo(i + h, 0); g2.lineTo(i, h); g2.stroke(); } }, [2, 2]); sph(0.16, texM(tx, { roughness: 0.6 }), 0, 0, 0, g, 18).scale.set(1, 1.35, 1); for (let i = 0; i < 6; i++) { const lf = cone(0.04, 0.22, M(0x3a9a3a), Math.cos(i) * 0.04, 0.3, Math.sin(i) * 0.04, g, 5); lf.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i) * 0.4); } g.userData.r = 0.2; }
          g.userData.id = id; g.userData.hy = g.userData.r; void F; return g; },
        build(st) { plinth(13, 3.0, 0x86d46a, 0x4f8f45); meadow(12.4, 2.6); const LX = this.LX, PY = this.PY, wood = M(0x9a6a3a, { roughness: 0.8 }), dark = M(0x5a3a20, { roughness: 0.8 });
          for (const z of [-0.42, 0.42]) { box(2.2, 0.16, 0.16, wood, LX + 0.1, TOP + 0.24, z); box(0.14, 1.12, 0.14, wood, LX, TOP + 0.84, z); const br = box(0.1, 1.2, 0.1, wood, LX - 0.32, TOP + 0.7, z); br.rotation.z = -0.5; }
          for (const x of [LX - 0.85, LX + 1.05]) box(0.16, 0.16, 1.0, wood, x, TOP + 0.24, 0);
          for (const [x, z] of [[LX - 0.7, 0.55], [LX + 0.9, 0.55], [LX - 0.7, -0.55], [LX + 0.9, -0.55]]) cyl(0.24, 0.24, 0.1, dark, x, TOP + 0.24, z, null, 16).rotation.x = PI / 2;
          cyl(0.06, 0.06, 1.0, M(0x3a3a40, { metalness: 0.6 }), LX, PY, 0, null, 10).rotation.x = PI / 2; box(0.14, 0.14, 1.0, wood, LX + 0.42, PY + 0.62, 0);
          st.arm = grp(LX, PY, 0); st.arm.rotation.z = this.CK; box(2.35, 0.14, 0.16, wood, 0.95, 0, 0, st.arm);
          const cup = new T.Mesh(new T.SphereGeometry(0.3, 18, 10, 0, TAU, PI / 2, PI / 2), M(0x7a4a2a, { roughness: 0.8, side: T.DoubleSide })); cup.rotation.z = PI; cup.position.set(2.1, -0.08, 0); st.arm.add(cup);
          st.bands = grp(0, 0, 0, st.arm); this.setBands(st, 2);
          /* the fruit stand */
          box(1.7, 0.08, 0.6, M(0xfff1dc), -3.0, TOP + 0.66, 1.0); for (const x of [-3.75, -2.25]) cyl(0.05, 0.05, 0.62, dark, x, TOP + 0.33, 1.0, null, 8);
          st.list = st.old ? ['pumpkin', 'melon', 'pineapple'] : ['pumpkin', 'apple', 'grapes']; this.stand(st);
          /* the target: a tower of cans on a crate */
          if (!st.old) st.var = pickVar(st, ['near', 'mid', 'far']); const q = st.old ? pick([0.75, 1, 1.5]) : 2 / this.FRY[{ near: 'pumpkin', mid: 'apple', far: 'grapes' }[st.var]]; st.q = q; st.P0x = LX + Math.cos(this.RL) * 2.1; st.Rb = st.old ? 4.0 : 4.5; st.TX = st.P0x + st.Rb * q * q;
          box(1.0, 0.5, 0.7, M(0xb07a42, { roughness: 0.85 }), st.TX, TOP + 0.25, 0); this.cans(st);
          if (st.old) { tag(t('ph_sg_need', { v: Math.round(q * 10 * 10) / 10 }), st.TX, TOP + 2.3, 0, 0.36); this.speedTag(st); } this.helper(st); },
        /* the penguin stands by the fruit stand, ready to run and catch whatever falls short */
        helper(st) { if (st.pp) drop(st.pp.g); st.pp = pip(st.TX < -1 ? st.TX + 1.3 : -1.6, TOP, 0.9, 0.85, 0); },
        /* it catches the fruit — with its face: splat (and it licks it), a bonk, or grapes everywhere and one in its beak */
        async caught(st, f, F) { const p = st.pp; pg.squash(p, 1.5);
          if (F.splat) { f.visible = false; snd('splat'); pg.goo(p, F.col); const bits = []; for (let i = 0; i < 10; i++) { const b = box(R(0.06, 0.12), R(0.05, 0.1), R(0.06, 0.12), M(i % 3 ? F.col : (F.inside || 0xffe08a), { roughness: 0.7 }), f.position.x, f.position.y, R(-0.1, 0.1)); b.userData.hy = 0.04; bits.push(b); } st.trash.push(...bits); fling(bits, f.position.clone().add(V3(0, -0.2, 0)), 2.6, TOP, { lift: 1.2 }); }
          else if (F.many) { snd('thud'); const gs = f.children.filter(x => x.geometry && x.geometry.type === 'SphereGeometry'); for (const g of gs) { demo.attach(g); g.userData.hy = 0.065; } st.trash.push(...gs); const one = gs.pop(); fling(gs, f.position.clone().add(V3(0, -0.3, 0)), 2.2, TOP, { lift: 1 }); if (one) arcTo(one, () => pg.beak(p), 0.3, 0.2).then(() => { one.visible = false; snd('gulp'); }); }
          else { snd('boink'); pg.dizzy(p, 2.0); fling([f], f.position.clone().add(V3(-0.3, -0.3, 0)), 1.6, TOP, { lift: 0.6 }); }
          pg.wobble(p, 1.2, 0.15); await wait(0.9); pg.blink(p, 2); await pg.look(p); if (F.splat) { snd('slurp'); await wait(0.5); snd('honk'); } else snd(F.many ? 'honk' : 'honkSad'); await wait(0.9); },
        /* far too light: it flies right out of the lab… a moment of quiet… CRASH… MEOW! */
        async faraway(st, id) { const p = st.pp; await wait(0.9); snd('crash'); await wait(0.25); snd('meow'); for (const e of p.eyes) e.scale.setScalar(1.45); pg.squash(p, 1.2); await wait(0.5);
          /* …and one grape comes back down, onto its head */
          const top = pg.top(p), gr = id && id !== 'grapes' ? this.fruit(id) : sph(0.08, M(0x7a3aa8, { roughness: 0.3 }), 0, 0, 0, null, 12); if (id && id !== 'grapes') gr.scale.setScalar(0.55); gr.position.set(top.x + 0.3, top.y + 3.2, top.z); gr.userData.hy = 0.08; st.trash.push(gr);   /* a little one of the same fruit */ snd('whistleDown'); await arcTo(gr, () => pg.top(p).add(V3(0, 0.06, 0)), 0.5, 0);
          snd('boink'); pg.squash(p, 1.3); fling([gr], gr.position.clone().add(V3(-0.2, -0.2, 0)), 1.2, TOP, { lift: 0.5, dir: 1 }); p.head.rotation.z = 0; await pg.look(p); for (const e of p.eyes) e.scale.setScalar(1); pg.blink(p, 2); snd('honkSad'); await wait(0.9); },
        /* bullseye: the cans fly, and one comes all the way back — onto the penguin's head */
        async canHat(st) { const p = st.pp; await wait(0.4); const cn = grp(st.TX, TOP + 1.2, 0); cyl(0.15, 0.15, 0.3, M(0xd8dce6, { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, cn, 18); cyl(0.152, 0.152, 0.16, M(0xff5a6a, { roughness: 0.5 }), 0, 0, 0, cn, 18); st.trash.push(cn); snd('whistleDown');
          camIn(st, p.g.position.x + 0.9, TOP + 1.2, 3.8); await arcTo(cn, () => pg.top(p).add(V3(0, 0.15, 0)), 0.9, 1.6, 0.2); p.head.attach(cn); cn.rotation.set(0, 0, 0); cn.position.set(0, 0.38, 0); snd('boink'); pg.squash(p, 1.2); pg.blink(p, 2); await wait(0.4); await pg.laugh(p); },
        /* it landed beyond the cans: the penguin stops, shrugs, and looks at you */
        async shrug(st) { const p = st.pp; await wait(0.4); await anim(0.25, q => { p.fl[0].rotation.x = 0.9 * q; p.fl[1].rotation.x = -0.9 * q; }); await pg.look(p); pg.blink(p); snd('honkSad'); await wait(0.8); await anim(0.25, q => { p.fl[0].rotation.x = 0.9 * (1 - q); p.fl[1].rotation.x = -0.9 * (1 - q); }); },
        stand(st) { for (const f of st.fr || []) drop(f); st.fr = st.list.map((id, i) => { const f = this.fruit(id); f.position.set(-3.5 + i * 0.5, TOP + 0.7 + f.userData.r, 1.0); return f; }); },
        setBands(st, n) { if (st.nb === n) return; st.nb = n; while (st.bands.children.length) drop(st.bands.children[0]); const cols = [0xff5a6a, 0x4ab0ff, 0xffd84a, 0x6ad06a]; for (let i = 0; i < n; i++) { const r = new T.Mesh(new T.TorusGeometry(0.13, 0.035, 8, 20), M(cols[i])); r.rotation.y = PI / 2; r.position.x = 0.15 + i * 0.11; st.bands.add(r); } },
        cans(st) { for (const cn of st.canL || []) drop(cn); st.canL = []; const cols = [0xff5a6a, 0x4ab0ff, 0xffd84a, 0x6ad06a, 0xff9a3c, 0xa87aff]; let k = 0;
          for (const [n, row] of [[3, 0], [2, 1], [1, 2]]) for (let i = 0; i < n; i++) { const g = grp(st.TX + (i - (n - 1) / 2) * 0.32, TOP + 0.5 + 0.16 + row * 0.32, 0); cyl(0.15, 0.15, 0.3, M(0xd8dce6, { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, g, 18); cyl(0.152, 0.152, 0.16, M(cols[k++ % 6], { roughness: 0.5 }), 0, 0, 0, g, 18); g.userData.hy = 0.15; st.canL.push(g); } },
        speedTag(st) { untag(st.vtag); const b = st.sel && st.sel[1], m = st.sel && st.sel[0] ? this.FR[st.sel[0]].m : null; st.vtag = tag(b && m ? t('ph_sg_launch', { v: Math.round(b / m * 10 * 10) / 10 }) : t('ph_sg_launch', { v: '?' }), this.LX + 0.4, TOP + 2.55, 0, 0.34); },
        rows: st => st.old ? [{ label: t('ph_r_load'), opts: st.list.map(id => ({ v: id, text: t('ph_' + id), sub: t('ph_kg', { n: CH.force.FR[id].m }) })) }, { label: t('ph_r_bands'), opts: [1, 2, 3, 4].map(n => ({ v: n, text: String(n) })) }]
          : [{ opts: st.list.map(id => ({ v: id, icon: id === 'grapes' ? 'grapes' : id, text: t('ph_' + id) })) }],
        answer: st => st.old ? (st.q === 0.75 ? ['pumpkin', 3] : st.q === 1.5 ? ['melon', 3] : ['melon', 2]) : [{ near: 'pumpkin', mid: 'apple', far: 'grapes' }[st.var]],
        seat(st, id) { const f = st.fr[st.list.indexOf(id)]; if (!f || st.loaded === f) return; if (st.loaded) { const o = st.loaded, i = st.fr.indexOf(o); demo.attach(o); glide(o, V3(-3.5 + i * 0.5, TOP + 0.7 + o.userData.r, 1.0), 0.35, 0.4); }
          st.loaded = f; const to = V3(2.1, -0.32 - f.userData.r * 0.5, 0); st.arm.updateMatrixWorld(true); const w = st.arm.localToWorld(to.clone()); snd('swish'); glide(f, w, 0.45, 0.8).then(() => { if (st.loaded === f && !st.flying) { st.arm.attach(f); f.position.copy(to); } }); },
        preview(st) { if (st.sel[0]) this.seat(st, st.sel[0]); if (st.old) { if (st.sel[1]) this.setBands(st, st.sel[1]); this.speedTag(st); } },
        splat(st, at, F) { snd('splat'); const bits = []; for (let i = 0; i < 16; i++) { const b = box(R(0.07, 0.16), R(0.05, 0.12), R(0.07, 0.14), M(i % 3 ? F.col : (F.inside || 0xffe08a), { roughness: 0.7 }), at.x + R(-0.1, 0.1), at.y + 0.1, at.z + R(-0.1, 0.1)); b.userData.hy = 0.04; bits.push(b); }
          st.trash.push(...bits); fling(bits, at.clone().add(V3(0, -0.2, 0)), 3.2, TOP, { lift: 1.4 }); const sp = new T.Mesh(new T.CircleGeometry(0.42, 18), M(F.col, { roughness: 0.9 })); sp.rotation.x = -PI / 2; sp.position.set(at.x, TOP + 0.012, at.z); demo.add(sp); st.trash.push(sp); },
        async run(st, sel) { const id = sel[0], F = this.FR[id], f = st.loaded, bands = st.old ? sel[1] : 2, q = bands / (st.old ? F.m : this.FRY[id]), R0 = st.Rb * q * q;
          const rs = r => st.old ? r : r === 'short' ? (id === 'pumpkin' ? 'short' : 'shortA') : (id === 'grapes' ? 'long' : 'longA');   /* the young lines name the fruit when it is the pumpkin or the grapes */ if (f.parent !== st.arm) await wait(0.55); st.flying = true;
          /* the arm swings and stops on the bar; the fruit leaves the cup at the top of the swing */
          snd('whoosh'); await anim(0.22, k => { st.arm.rotation.z = this.CK + (this.RL - this.CK) * k * k; }); snd('thud');
          const P0 = V3(), tgt = V3(); f.getWorldPosition(P0); demo.attach(f); const xl = P0.x + R0, hit = Math.abs(xl - st.TX) < 0.6, off = xl > 6.9, p = st.pp, catchIt = !hit && !off && xl < st.TX && xl > -2.9;
          if (hit) tgt.set(st.TX - 0.1, TOP + 0.95, 0); else if (off) tgt.set(9.5, 2.5, 0); else if (catchIt) tgt.set(xl, TOP + 0.94 + f.userData.r * 0.7, 0); else tgt.set(xl, TOP + f.userData.r, 0);
          const H = (off ? 6 : Math.abs(tgt.x - P0.x) * 0.25) + 0.5, dur = off ? 1.6 : 0.5 + 0.13 * Math.sqrt(Math.abs(tgt.x - P0.x)) * 2; let tm = 0;
          /* the penguin runs under it to catch it — or chases it, looking up */
          if (hit) camIn(st, st.TX, TOP + 1.2, 3.8); else if (catchIt) { camIn(st, xl, TOP + 1.1, 3.6); pg.waddleTo(p, xl, 0, dur); } else { camIn(st, 0.2, TOP + 1.3, 5.2); p.head.rotation.z = 0.45; pg.waddleTo(p, p.g.position.x + 1.2, null, 0.7); }
          await until(dt => { tm += dt; const k = Math.min(1, tm / dur); f.position.set(P0.x + (tgt.x - P0.x) * k, P0.y + (tgt.y - P0.y) * k + H * 4 * k * (1 - k), 0); f.rotation.z -= dt * 8; return k >= 1; }, 4);
          anim(0.6, k => { st.arm.rotation.z = this.RL + (this.CK - this.RL) * K.ease(k); });
          if (hit) { impact(V3(st.TX, TOP + 1.0, 0.3), 0xffe08a, 1); snd('crash'); fling(st.canL, V3(st.TX - 0.6, TOP + 0.6, 0), 4.2, TOP, { lift: 0.9, dir: 0.6 }); if (F.splat) { f.visible = false; this.splat(st, f.position, F); } else fling([f], V3(st.TX - 0.5, TOP + 0.5, 0), 2, TOP);
            yay(); confetti(V3(st.TX, TOP + 1.6, 0.3), 90, 3); firework(V3(st.TX - 0.8, 3.8, -0.4), 0xff7ad0); await wait(0.4); firework(V3(st.TX + 0.9, 4.2, -0.4), 0x4ab0ff); await this.canHat(st); await wait(0.4); camOut(st); return 'win'; }
          if (off) { f.visible = false; await this.faraway(st, id); camOut(st); return rs('long'); }
          if (catchIt) { await this.caught(st, f, F); camOut(st); return rs('short'); }
          if (xl > st.TX + 1.5) { /* way past the cans: it bounces along the plinth and right off the end… crash… meow */ snd('thud'); const x0 = f.position.x, y0 = f.position.y; await anim(0.9, q => { f.position.x = x0 + (8.2 - x0) * q; f.position.y = q < 0.75 ? y0 + Math.abs(Math.sin(q * PI * 3)) * 0.4 * (1 - q) : y0 - (q - 0.75) * 6; f.rotation.z -= 0.25; }); f.visible = false; await this.faraway(st, id); camOut(st); return rs('long'); }
          if (F.splat) { f.visible = false; this.splat(st, f.position, F); } else if (F.many) { snd('thud'); const gs = f.children.filter(x => x.geometry && x.geometry.type === 'SphereGeometry'); demo.attach(f); for (const g of gs) { demo.attach(g); g.userData.hy = 0.065; } st.trash.push(...gs); fling(gs, f.position.clone().add(V3(0, -0.3, 0)), 2.2, TOP, { lift: 1 }); }
          else { snd('thud'); fling([f], f.position.clone().add(V3(-0.3, -0.3, 0)), 1.6, TOP, { lift: 0.6 }); }
          p.head.rotation.z = 0; if (xl < st.TX) { pg.blink(p, 2); await anim(0.25, q => pg.cover(p, 0.8 * q)); snd('honkSad'); await wait(0.9); await anim(0.25, q => pg.cover(p, 0.8 * (1 - q))); } else await this.shrug(st); camOut(st); return rs(xl < st.TX ? 'short' : 'long'); },
        async reset(st) { st.loaded = null; st.flying = false; for (const f of st.fr) { still(f); drop(f); } this.stand(st); this.cans(st); this.helper(st); st.arm.rotation.z = this.CK; puff(V3(st.TX, TOP + 0.9, 0.3), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.3); if (st.sel && st.sel[0]) this.seat(st, st.sel[0]); await wait(0.5); } };
      /* ---------------------------------------------------------------- 4. action and reaction: the rocket */
      CH.action = { go: 'ph_go_fire',
        view: st => st.old ? { x0: -3.2, x1: 4.2, y0: 0, y1: 7.3 } : { x0: -3.0, x1: 4.4, y0: 0, y1: 6.3 },
        lines: st => st.old ? { in: 'pv_a_o_in', win: 'pv_a_o_win', fail: { dir: 'pv_a_o_dir', short: 'pv_a_o_short', high: 'pv_a_o_high' } } : { in: { star: 'pv_a_y_in', balloon: 'pv_a_y_in_b', duck: 'pv_a_y_in_d' }[st.var], win: { star: 'pv_a_y_win', balloon: 'pv_a_y_win_b', duck: 'pv_a_y_win_d' }[st.var], fail: { up: 'pv_a_y_up', side: 'pv_a_y_side', down: 'pv_a_y_down' } },
        NOZ: { down: { p: [0, 0.1, 0], r: 0 }, up: { p: [0, 2.12, 0], r: PI }, side: { p: [-0.4, 0.85, 0], r: -PI / 2 } },
        SC: 0.62,   /* metres → scene units for the 8+ heights */
        build(st) { plinth(7.8, 3.0, 0x86d46a, 0x4f8f45, 0.6); meadow(7.4, 2.6, 0.6);
          st.pad = cyl(0.85, 0.9, 0.16, M(0x9aa0aa, { roughness: 0.7 }), 0, TOP + 0.08, 0, null, 32); const ring = new T.Mesh(new T.TorusGeometry(0.8, 0.04, 6, 40), M(0xffd84a)); ring.rotation.x = PI / 2; ring.position.set(0, TOP + 0.165, 0); demo.add(ring);
          for (const z of [-0.25, 0.25]) box(0.1, 2.6, 0.1, M(0xd8343a), -1.15, TOP + 1.3, z); for (let i = 0; i < 4; i++) { const b = box(0.06, 0.62, 0.06, M(0xd8343a), -1.15, TOP + 0.4 + i * 0.6, 0); b.rotation.x = 0.85 * (i % 2 ? 1 : -1); } box(0.6, 0.06, 0.12, M(0x9aa0aa), -0.85, TOP + 1.9, 0);
          if (!st.old) st.var = pickVar(st, st.band <= 1 ? ['star', 'duck'] : ['star', 'balloon', 'duck']); st.base = TOP + 0.16 + (st.var === 'duck' ? 0.5 : 0);
          if (st.var === 'duck') { st.duckT = duck(0.45, TOP + 0.16, 0, 2.4); }   /* the rocket stands on a big squeaky rubber duck */
          if (st.var === 'balloon') { const b = st.bal = grp(2.0, TOP + 0.95, 0); sph(0.3, M(0xff3a5a, { roughness: 0.25 }), 0, 0, 0, b, 20).scale.y = 1.15; cone(0.06, 0.08, M(0xff3a5a), 0, -0.36, 0, b, 8).rotation.z = PI; cyl(0.006, 0.006, 0.6, M(0xffffff), 0, -0.68, 0, b, 4); let q0 = 0; sims.push(dt => { q0 += dt; b.position.y = TOP + 0.95 + Math.sin(q0 * 2) * 0.05; b.rotation.z = Math.sin(q0 * 1.3) * 0.08; return true; }); }
          this.rocket(st); sims.push(() => { if (st.fl && st.fl.visible) st.fl.scale.set(1 + R(-0.1, 0.1), 1 + R(-0.2, 0.25), 1 + R(-0.1, 0.1)); return true; });
          if (!st.old && st.var === 'star') { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = PI / 2 + i * PI / 5, r = i % 2 ? 0.24 : 0.56; if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath();
            st.star = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }), new T.MeshStandardMaterial({ color: 0xffd84a, emissive: 0xffa800, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.3 })); st.star.position.set(0, 5.3, -0.08); demo.add(st.star);
            st.starGlow = glow(0xffe890, 2.2, 0, 5.3, -0.2, 0.55); cyl(0.012, 0.012, 1.6, M(0xffffff), 0, 6.65, -0.02, null, 4); let tm0 = 0; sims.push(dt => { tm0 += dt; st.star.rotation.y = Math.sin(tm0 * 1.2) * 0.35; return true; }); }
          const hay = grp(3.3, TOP, 0); cyl(0.62, 0.66, 0.8, M(0xe8c060, { roughness: 1 }), 0, 0.4, 0, hay, 18); sph(0.62, M(0xf0cc70, { roughness: 1 }), 0, 0.8, 0, hay, 18).scale.y = 0.45; for (let i = 0; i < 10; i++) box(0.02, R(0.2, 0.35), 0.02, M(0xc8a040), R(-0.55, 0.55), 0.7 + R(0, 0.3), R(-0.5, 0.6), hay).rotation.z = R(-0.6, 0.6);
          if (st.old) { const H = pick([3, 4.5, 6]); st.H = H; st.doorY = TOP + 0.16 + 2.04 + H * this.SC; const tr = grp(2.15, 0, 0); cyl(0.24, 0.32, st.doorY + 0.9, M(0x8a5a3a, { roughness: 0.9 }), 0, (st.doorY + 0.9) / 2, 0, tr, 12);
            for (const [x, y, r] of [[0, 0.9, 0.9], [-0.6, 0.6, 0.6], [0.6, 0.55, 0.65]]) sph(r, M(0x4aa04a, { roughness: 0.85 }), x, st.doorY + y, -0.3, tr, 14);
            box(0.9, 0.08, 0.7, M(0xb07a42), -0.6, st.doorY - 0.04, 0, tr); box(0.7, 0.62, 0.6, M(0xd8a868), -0.35, st.doorY + 0.31, -0.1, tr); const rf = cone(0.55, 0.4, M(0xd8343a), -0.35, st.doorY + 0.82, -0.1, tr, 4); rf.rotation.y = PI / 4; box(0.04, 0.42, 0.3, M(0x5a3a20), -0.71, st.doorY + 0.22, -0.1, tr);
            st.bird = grp(1.3, st.doorY + 0.16, 0.15); sph(0.16, M(0x4a90e2, { roughness: 0.5 }), 0, 0, 0, st.bird, 14); sph(0.11, M(0x4a90e2), -0.1, 0.16, 0, st.bird, 12); cone(0.04, 0.12, M(0xffb000), -0.24, 0.16, 0, st.bird, 6).rotation.z = PI / 2; sph(0.025, M(0x111111), -0.17, 0.2, 0.07, st.bird, 6);
            tag(t('ph_sg_door', { h: H }), 3.35, st.doorY + 0.35, 0, 0.34); tag(t('ph_sg_pump'), -2.25, TOP + 2.3, 0, 0.32);
            const pump = grp(-2.1, TOP, 0.4); cyl(0.11, 0.11, 0.8, M(0xd8343a, { roughness: 0.4 }), 0, 0.4, 0, pump, 14); st.handle = grp(0, 0.85, 0, pump); box(0.06, 0.4, 0.06, M(0x9aa0aa), 0, 0.15, 0, st.handle); box(0.4, 0.06, 0.08, M(0x3a3a40), 0, 0.36, 0, st.handle);
            const hose = new T.Mesh(new T.TorusGeometry(0.62, 0.025, 6, 20, PI * 0.8), M(0x2a2a2a)); hose.position.set(-1.45, TOP + 0.05, 0.25); hose.rotation.x = PI / 2; demo.add(hose); } },
        rocket(st) { if (st.rk) drop(st.rk); const g = grp(0, st.base || TOP + 0.16, 0); st.rk = g; const red = M(0xe8303a, { roughness: 0.4 });
          cyl(0.3, 0.3, 1.2, M(0xf6f6f2, { roughness: 0.35, metalness: 0.1 }), 0, 0.85, 0, g, 24); st.nose = cone(0.3, 0.55, red, 0, 1.725, 0, g, 24);
          for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + PI / 6, f = box(0.05, 0.5, 0.34, red, Math.cos(a) * 0.36, 0.3, Math.sin(a) * 0.36, g); f.rotation.y = -a; }
          const win = new T.Mesh(new T.TorusGeometry(0.12, 0.03, 8, 20), M(0xd8dce6, { metalness: 0.7, roughness: 0.3 })); win.position.set(0, 1.08, 0.29); g.add(win);
          /* the pilot: the penguin, peeking out of the window */
          const pil = grp(0, 1.07, 0.21, g); sph(0.085, M(0x1e2230, { roughness: 0.6 }), 0, 0, 0, pil, 14); sph(0.06, M(0xffffff, { roughness: 0.7 }), 0, -0.015, 0.042, pil, 10).scale.set(1.1, 0.95, 0.6); const pe = [];
          for (const s2 of [-1, 1]) { const e = grp(s2 * 0.032, 0.02, 0.074, pil); sph(0.02, M(0xffffff), 0, 0, 0, e, 8); sph(0.01, M(0x111111), 0, 0, 0.014, e, 6); pe.push(e); } cone(0.02, 0.055, M(0xff9a1a), 0, -0.02, 0.09, pil, 6).rotation.x = PI / 2; st.pil = { head: pil, eyes: pe };
          const gl = new T.Mesh(new T.CircleGeometry(0.12, 20), new T.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45, roughness: 0.05 })); gl.position.set(0, 1.08, 0.31); g.add(gl);
          if (st.old) { st.pizza = grp(0, 2.04, 0, g); box(0.36, 0.08, 0.36, M(0xffffff, { roughness: 0.7 }), 0, 0, 0, st.pizza); box(0.2, 0.01, 0.2, M(0xe8303a), 0, 0.045, 0, st.pizza); }
          st.noz = grp(0, 0.1, 0, g); cone(0.2, 0.3, M(0x4a4f58, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, st.noz, 20);
          st.fl = grp(0, -0.5, 0, st.noz); st.fl.rotation.z = PI; cone(0.17, 0.7, new T.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9 }), 0, 0, 0, st.fl, 16); cone(0.09, 0.45, new T.MeshBasicMaterial({ color: 0xfff2a0 }), 0, -0.1, 0, st.fl, 12); st.fl.visible = false;
          if (st.sel && st.sel[0]) this.nozzle(st, st.sel[0], true); },
        nozzle(st, dir, now) { const N = this.NOZ[dir], from = st.noz.position.clone(), r0 = st.noz.rotation.z, to = V3(...N.p); if (now) { st.noz.position.copy(to); st.noz.rotation.z = N.r; return; } snd('swish'); tween(0.4, k => { const e = K.ease(k); st.noz.position.lerpVectors(from, to, e); st.noz.position.z += Math.sin(PI * k) * 0.5; st.noz.rotation.z = r0 + (N.r - r0) * e; }); },
        rows: st => { const d = (st.band <= 1 && !st.old ? ['down', 'up'] : ['down', 'up', 'side']).map(k => ({ v: k, icon: SVG.gas(k), text: t('ph_gas_' + k) }));
          return st.old ? [{ label: t('ph_r_dir'), opts: d }, { label: t('ph_r_pumps'), opts: [1, 2, 3, 4].map(n => ({ v: n, text: String(n) })) }] : [{ opts: d }]; },
        answer: st => st.old ? ['down', st.H / 1.5] : [{ star: 'down', balloon: 'side', duck: 'up' }[st.var]],
        preview(st) { if (st.sel[0] && st.sel[0] !== st.dir) { st.dir = st.sel[0]; this.nozzle(st, st.dir); } if (st.old && st.sel[1] && st.sel[1] !== st.pumps) { const n = st.pumps = st.sel[1]; tween(0.25 * n, k => { st.handle.position.y = 0.85 - 0.3 * Math.abs(Math.sin(k * n * PI)); }); for (let i = 0; i < n; i++) setTimeout(() => snd('swish'), i * 250 / SPEED); } },
        smoke(st, dirY, spread) { const p = V3(); st.fl.getWorldPosition(p); puff(p, 0xf2f2f2, 3, 0.55, spread == null ? 0.8 : spread, dirY); },
        async run(st, sel) { const dir = sel[0], g = st.rk; st.fl.visible = true; snd('launch');
          if (dir === 'up') { let tm = 0, y0 = g.position.y; const dk = st.duckT; await until(dt => { tm += dt; const k = Math.min(1, tm / 0.6); g.position.y = y0 - (dk ? 0.3 : 0.22) * k; g.position.x = R(-0.03, 0.03); if (dk) dk.scale.set(2.4 * (1 + 0.15 * k), 2.4 * (1 - 0.45 * k), 2.4 * (1 + 0.15 * k)); else st.pad.scale.y = 1 - 0.5 * k; if (Math.random() < 0.5) this.smoke(st, 2.5, 0.4); if (Math.random() < 0.4) puff(V3(R(-0.8, 0.8), TOP + 0.2, R(-0.6, 0.6)), 0xb8956a, 2, 0.6, 1.6, 0.3); return tm > 1.4; }, 3);
            st.fl.visible = false; g.position.x = 0;
            if (dk) { /* SQUEAK! the duck springs back and bounces the rocket up; out pops the penguin, laughing */ snd('squeakBig'); camIn(st, 0.3, TOP + 1.4, 3.6); const yb = g.position.y; await anim(0.35, q => { const e = c.over(q); dk.scale.set(2.4 * (1.15 - 0.15 * e), 2.4 * (0.55 + 0.45 * e), 2.4 * (1.15 - 0.15 * e)); g.position.y = yb + 0.3 * e + Math.sin(PI * q) * 0.35; }); snd('boing');
              yay(); confetti(V3(0.3, TOP + 2.2, 0.3), 90, 2.6); firework(V3(-1.4, 3.6, -0.4), 0xffd84a); await wait(0.3); snd('squeakBig'); const p = await this.popOut(st); await wait(0.15); await pg.laugh(p, false); hearts(pg.top(p), 5); await wait(0.5); camOut(st); return 'win'; }
            snd('thud'); shake(0.1, 0.4); camIn(st, 0.3, TOP + 1.5, 3.6); await wait(0.4);
            const p = await this.popOut(st); pg.dizzy(p, 2.2); pg.wobble(p, 1.8, 0.25); await wait(1.2); pg.blink(p, 2); await pg.look(p); snd('honkSad'); await wait(0.8); camOut(st); return st.old ? 'dir' : 'up'; }
          if (dir === 'side') { let tm = 0, popped = false; const x0 = g.position.x, yb0 = g.position.y; await until(dt => { tm += dt; const k = Math.min(1, tm / 1.0); g.position.x = x0 + 2.75 * k * k; g.rotation.z = -1.05 * Math.min(1, k * 1.4); g.position.y = yb0 + Math.sin(Math.min(1, k * 1.4) * PI / 2) * 0.32; if (Math.random() < 0.6) this.smoke(st, 0.4, 0.6);
              if (st.bal && !popped && g.position.x > st.bal.position.x - 0.35) { popped = true; st.bal.visible = false; snd('pop'); impact(st.bal.position.clone(), 0xff3a5a, 1); confetti(st.bal.position.clone(), 80, 2.4); } return k >= 1; }, 3);
            st.fl.visible = false; snd('crash'); shake(0.1, 0.4); puff(V3(3.1, TOP + 0.7, 0.3), 0xe8c060, 18, 0.5, 2, 1.2); camIn(st, 2.5, TOP + 1.2, 3.6); await wait(0.6);
            if (popped) { yay(); firework(V3(1.2, 3.2, -0.4), 0xff7ad0); await wait(0.3); firework(V3(3.0, 3.5, -0.4), 0xffd84a); pg.blink(st.pil, 2); snd('happy'); await wait(1.4); camOut(st); return 'win'; }
            /* out of the haystack bursts a very cross chicken — BAWK! — onto the rocket, and lays an egg */
            const ck = chicken(3.35, TOP + 0.6, 0.2); st.trash.push(ck.g); ck.g.rotation.y = PI; ck.g.scale.setScalar(0.01); snd('bawk'); flapWings(ck, 1.6); anim(0.2, q => ck.g.scale.setScalar(Math.max(0.01, 1.45 * q)));
            await arcTo(ck.g, g.localToWorld(V3(0.32, 0.8, 0)).add(V3(0, 0.05, 0.2)), 0.6, 1.0); snd('squish'); await wait(0.4);
            const e = egg(ck.g.position.x - 0.1, ck.g.position.y + 0.05, 0.35); st.trash.push(e); snd('plop'); fling([e], e.position.clone().add(V3(0.2, 0.2, 0)), 0.6, TOP, { lift: 0.2 });
            await wait(0.6); pg.blink(st.pil, 2); snd('bawk'); await wait(0.9); camOut(st); return st.old ? 'dir' : 'side'; }
          /* gas down: rumble, then lift-off */
          let tm = 0; await until(dt => { tm += dt; g.position.x = R(-0.02, 0.02); if (Math.random() < 0.7) puff(V3(R(-0.5, 0.5), TOP + 0.25, R(-0.4, 0.4)), 0xf2f2f2, 1, 0.7, 2.4, 0.25); return tm > 0.45; }, 2); g.position.x = 0;
          if (!st.old) { const y0 = g.position.y; tm = 0; let popped = false;
            await until(dt => { tm += dt; g.position.y = y0 + 0.5 * 5.5 * tm * tm; if (Math.random() < 0.8) this.smoke(st, -1.5, 0.5);
              if (st.star && !popped && g.position.y + 2.0 >= st.star.position.y - 0.45) { popped = true; st.star.visible = false; st.starGlow.visible = false; impact(st.star.position.clone(), 0xffd84a, 1.4); yay(); confetti(st.star.position.clone(), 90, 3); firework(V3(-1.2, 5.6, -0.4), 0xff7ad0); firework(V3(1.3, 6.2, -0.4), 0x4ab0ff); }
              return g.position.y > 11; }, 5);
            g.visible = false; st.fl.visible = false; await wait(0.5);
            /* …and back it comes on its parachute; out pops the penguin, holding the star */
            g.position.y = 8.5; g.visible = true; camIn(st, 0.3, TOP + 1.7, 4.0); await this.parachute(st); const won = st.var === 'star', p = await this.popOut(st, won); await wait(0.15);
            if (!won) { pg.blink(p, 2); await pg.look(p); snd('honkSad'); await wait(0.8); camOut(st); return 'down'; }
            await pg.laugh(p, false); hearts(pg.top(p), 5); await wait(0.5); camOut(st); return 'win'; }
          const rise = 1.5 * sel[1] * this.SC, y0 = g.position.y, tau = 0.9 + 0.25 * sel[1]; tm = 0;
          await until(dt => { tm += dt; const k = Math.min(1, tm / tau); g.position.y = y0 + rise * (1 - (1 - k) * (1 - k)); if (k > 0.6) st.fl.visible = false; else if (Math.random() < 0.8) this.smoke(st, -1.5, 0.5); return k >= 1; }, 6);
          st.fl.visible = false; const ok = Math.abs(1.5 * sel[1] - st.H) < 0.1; camIn(st, 1.4, st.doorY + 0.2, 3.8);
          if (ok) { const p = V3(); st.pizza.getWorldPosition(p); demo.attach(st.pizza); snd('ding'); await glide(st.pizza, V3(st.bird.position.x - 0.1, st.bird.position.y + 0.12, st.bird.position.z), 0.5, 0.3);
            for (let i = 0; i < 6; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: KQ.iconTexture ? KQ.iconTexture('heart') : null, transparent: true })); s.scale.setScalar(0.3); s.position.set(st.bird.position.x + R(-0.3, 0.3), st.bird.position.y + 0.3, 0.3); demo.add(s); let q = 0; sims.push(dt => { q += dt; s.position.y += dt * 0.8; s.material.opacity = Math.max(0, 1 - q / 1.4); if (q > 1.4) { s.removeFromParent(); s.material.dispose(); return false; } }); }
            yay(); impact(V3(st.bird.position.x - 0.3, st.doorY, 0.2), 0xffd84a, 0.9); confetti(V3(0.6, st.doorY + 0.5, 0.3), 70, 2.4); firework(V3(-1.4, st.doorY + 0.6, -0.4), 0xff7ad0); await this.chomp(st); }
          else { await wait(0.3); aww(); if (1.5 * sel[1] < st.H) await this.reach(st); else await this.pizzaHat(st); }
          camOut(st); await this.parachute(st); return ok ? 'win' : (1.5 * sel[1] < st.H ? 'short' : 'high'); },
        /* the nose cone pops off and out comes the penguin (with the star, if it got it) */
        async popOut(st, star) { const g = st.rk, n = st.nose; snd('pop'); demo.attach(n); st.trash.push(n); const n0 = n.position.clone(); anim(0.7, q => { n.position.set(n0.x + 0.9 * q, n0.y + Math.sin(PI * q) * 1.1 - (n0.y - TOP - 0.3) * q * q, n0.z + 0.3 * q); n.rotation.z = -q * 4; });
          if (st.chute) { const ch = st.chute; anim(0.4, q => { ch.scale.set(1, Math.max(0.05, 1 - q), 1); }).then(() => { ch.visible = false; }); }
          st.pil.head.visible = false; if (st.pizza) st.pizza.visible = false; const top = g.localToWorld(V3(0, 1.4, 0)), p = st.mini = pip(top.x, top.y, top.z + 0.05, 0.42, -0.3); st.trash.push(p.g); p.g.scale.setScalar(0.01);
          if (star) { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = PI / 2 + i * PI / 5, r = i % 2 ? 0.17 : 0.42; if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath(); const s2 = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshStandardMaterial({ color: 0xffd84a, emissive: 0xffa800, emissiveIntensity: 0.6, side: T.DoubleSide })); s2.position.set(0.25, 1.75, 0.4); s2.rotation.y = 0.3; p.g.add(s2); }
          await anim(0.3, q => { p.g.scale.setScalar(Math.max(0.01, 0.42 * c.over(q))); p.g.position.y = top.y + 0.15 * q; }); return p; },
        /* 8+: the bird eats the pizza (chomp, chomp), or leans down for it with a rumbling tummy, or gets it on its head */
        async chomp(st) { const z = st.pizza; st.trash.push(z); for (let i = 0; i < 2; i++) { await wait(0.3); snd('chomp'); z.scale.multiplyScalar(0.55); } z.visible = false; snd('tweet'); const b = st.bird, y0 = b.position.y; await anim(0.5, q => { b.position.y = y0 + Math.abs(Math.sin(q * PI * 2)) * 0.15; }); b.position.y = y0; },
        async reach(st) { const b = st.bird; await anim(0.35, q => { b.rotation.z = 0.55 * q; }); snd('rumble'); await anim(0.6, q => { b.position.x = 1.3 + Math.sin(q * 30) * 0.02; }); b.position.x = 1.3; await anim(0.3, q => { b.rotation.z = 0.55 * (1 - q) + 0.2 * q; }); snd('tweetSad'); await wait(0.7); b.rotation.z = 0; },
        async pizzaHat(st) { const z = st.pizza, b = st.bird; demo.attach(z); st.trash.push(z); snd('whistleDown'); await arcTo(z, () => b.localToWorld(V3(-0.1, 0.3, 0)), 0.6, 0.9, 0.25); b.attach(z); z.position.set(-0.1, 0.3, 0); z.rotation.set(0, 0, 0.2); snd('squawk');
          const y0 = b.position.y; await anim(0.6, q => { b.position.y = y0 + Math.abs(Math.sin(q * PI * 3)) * 0.1; b.rotation.z = Math.sin(q * 30) * 0.1; }); b.position.y = y0; b.rotation.z = 0; await wait(0.4); },
        async parachute(st) { const g = st.rk, ch = st.chute = grp(0, 2.15, 0, g); const can = new T.Mesh(new T.SphereGeometry(0.62, 16, 8, 0, TAU, 0, PI / 2), M(0xff5a6a, { roughness: 0.7, side: T.DoubleSide })); can.position.y = 0.75; ch.add(can); for (const [x, z] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) { const s = cyl(0.006, 0.006, 0.9, M(0xffffff), x * 0.5, 0.38, z * 0.5, ch, 4); s.rotation.set(z * 0.9, 0, -x * 0.9); }
          ch.scale.setScalar(0.01); snd('pop'); await anim(0.3, k => ch.scale.setScalar(Math.max(0.01, c.over(k)))); const y0 = g.position.y, y1 = st.base || TOP + 0.16; await anim(Math.min(2.2, 0.6 + (y0 - y1) * 0.3), k => { g.position.y = y0 + (y1 - y0) * k; g.rotation.z = Math.sin(k * 9) * 0.06; }); g.rotation.z = 0; snd('thud'); },
        async reset(st) { st.pad.scale.y = 1; st.chute = null; if (st.duckT) st.duckT.scale.setScalar(2.4); if (st.bal) st.bal.visible = true; if (st.bird) { st.bird.rotation.set(0, 0, 0); st.bird.position.set(1.3, st.doorY + 0.16, 0.15); } this.rocket(st); if (st.star) { st.star.visible = true; st.starGlow.visible = true; } puff(V3(0, TOP + 0.8, 0.3), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- 5. speed: the car jumps the river */
      /* The car leaves the cliff flat out, so it is in the air for the same time at any speed (a 4.9 m drop: one second); the faster it goes,
         the further it gets in that second. Scene scale 0.4 per metre, gravity scaled the same way, so the times are real. */
      CH.speed = { go: 'ph_go_drive', S: 0.4,
        view: () => ({ x0: -6.5, x1: 6.5, y0: 0, y1: 3.9 }),
        lines: st => st.old ? { in: 'pv_s_o_in', win: 'pv_s_o_win', fail: { short: 'pv_s_o_short', long: 'pv_s_o_long' } } : { in: st.var === 'far' ? 'pv_s_y_in' : 'pv_s_y_in2', win: st.var === 'far' ? 'pv_s_y_win' : 'pv_s_y_win2', fail: { slow: 'pv_s_y_slow', mid: 'pv_s_y_mid', fast: 'pv_s_y_fast' } },
        build(st) { const S0 = this.S; st.yR = TOP + 0.32; st.yL = st.yR + 4.9 * S0; st.yW = TOP + 0.12; st.xe = -2.6;   /* 4.9 m above the landing bank: one second in the air */
          if (st.old) { st.D = pick([6, 8, 10]); st.xr = st.xe + st.D * S0; }
          else { st.var = pickVar(st, st.band <= 1 ? ['far', 'island1'] : ['far', 'island1', 'island2']); const I = { island1: [0.45, 1.25], island2: [1.55, 2.5] }[st.var]; st.isl = I ? [st.xe + I[0], st.xe + I[1]] : null; st.xr = I ? st.xe + 5.4 : -0.3; if (I) st.banX = st.xe + (st.var === 'island1' ? 0.85 : 2.05); }
          st.lands = st.isl ? [st.isl, [st.xr, 6.5]] : [[st.xr, 6.5]];
          S.pl = { x0: -6.5, x1: 6.5, z: 1.25 };
          const rock = M(0x9a7a5a, { roughness: 0.95, flatShading: true }), grass = M(0x6ac04a, { roughness: 0.9 });
          box(st.xe + 6.5, st.yL, 2.4, rock, (st.xe - 6.5) / 2, st.yL / 2, 0); box(st.xe + 6.5 + 0.02, 0.08, 2.42, grass, (st.xe - 6.5) / 2, st.yL, 0);
          box(st.xe + 6.5, 0.02, 0.8, M(0x4a4e58, { roughness: 0.9 }), (st.xe - 6.5) / 2, st.yL + 0.05, 0); for (let x = -6.2; x < st.xe - 0.2; x += 0.6) box(0.3, 0.025, 0.06, M(0xffffff), x, st.yL + 0.06, 0);
          box(6.5 - st.xr, st.yR, 2.4, rock, (st.xr + 6.5) / 2, st.yR / 2, 0); box(6.5 - st.xr + 0.02, 0.08, 2.42, grass, (st.xr + 6.5) / 2, st.yR, 0);
          if (st.isl) { const [a, b] = st.isl; box(b - a, st.yR, 1.6, rock, (a + b) / 2, st.yR / 2, 0); box(b - a + 0.02, 0.08, 1.62, M(0xf0d890, { roughness: 1 }), (a + b) / 2, st.yR, 0); }   /* a little sandy island: a soft stop */
          const wm = new T.MeshStandardMaterial({ color: 0x3a9ae0, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.1 }); box(st.xr - st.xe, st.yW, 2.4, wm, (st.xe + st.xr) / 2, st.yW / 2, 0);
          for (let i = 0; i < 8; i++) { const s = glow(0xffffff, 0.2, R(st.xe + 0.2, st.xr - 0.2), st.yW + 0.02, R(-1, 1), 0.6); let k0 = R(0, 6); sims.push(dt => { k0 += dt * 2; s.material.opacity = 0.3 + 0.3 * Math.sin(k0); return true; }); }
          for (const [x, z, r] of [[st.xe + 0.4, 0.9, 0.22], [st.xr - 0.3, -0.8, 0.18]]) sph(r, M(0x8a8f98, { flatShading: true }), x, st.yW, z, null, 6);
          if (st.old) { const pit = box(0.8, 0.06, 1.2, M(0xf0d890, { roughness: 1 }), st.xr + 0.4, st.yR + 0.02, 0); void pit; for (const x of [st.xr + 0.02, st.xr + 0.78]) { cyl(0.02, 0.02, 0.7, M(0xffffff), x, st.yR + 0.35, -0.65, null, 6); box(0.25, 0.16, 0.01, M(0xff5a5a), x + 0.12, st.yR + 0.62, -0.65); }
            st.hay = grp(st.xr + 1.3, st.yR, 0); cyl(0.5, 0.55, 0.7, M(0xe8c060, { roughness: 1 }), 0, 0.35, 0, st.hay, 16); sph(0.5, M(0xf0cc70, { roughness: 1 }), 0, 0.7, 0, st.hay, 16).scale.y = 0.45;
            tag(t('ph_sg_air'), st.xe - 1.1, st.yL + 0.85, 0, 0.32); tag(t('ph_m', { n: st.D }), st.xr + 0.4, st.yR + 1.05, 0, 0.34); }
          else this.banner(st);
          this.car(st); },
        banner(st) { if (st.ban) drop(st.ban); const g = grp(st.banX || 4.4, st.yR, 0); st.ban = g; for (const z of [-0.7, 0.7]) cyl(0.04, 0.04, 1.1, M(0xffffff), 0, 0.55, z, g, 8);
          const tx = tex(64, 16, (g2, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g2.fillStyle = (i + j) % 2 ? '#222' : '#fff'; g2.fillRect(i * 8, j * 8, 8, 8); } }); st.banM = box(0.03, 0.32, 1.4, texM(tx, { side: T.DoubleSide }), 0, 0.92, 0, g); },
        car(st) { if (st.car) drop(st.car); const g = grp(-5.9, st.yL + 0.04, 0); st.car = g; const red = M(0xe8303a, { roughness: 0.3, metalness: 0.2 });
          box(0.82, 0.22, 0.44, red, 0, 0.22, 0, g); box(0.42, 0.2, 0.38, new T.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.75, roughness: 0.1 }), -0.06, 0.42, 0, g); box(0.08, 0.14, 0.44, red, -0.38, 0.38, 0, g);
          st.wh = []; for (const [x, z] of [[0.27, 0.23], [-0.27, 0.23], [0.27, -0.23], [-0.27, -0.23]]) { const w = cyl(0.12, 0.12, 0.1, M(0x1a1a1a), x, 0.12, z, g, 14); w.rotation.x = PI / 2; cyl(0.05, 0.05, 0.11, M(0xc8ccd4), x, 0.12, z, g, 8).rotation.x = PI / 2; st.wh.push(w); }
          for (const z of [-0.13, 0.13]) sph(0.04, new T.MeshBasicMaterial({ color: 0xfff2a0 }), 0.41, 0.24, z, g, 8);
          /* the driver: the penguin */
          const dh = grp(-0.06, 0.6, 0, g); sph(0.1, M(0x1e2230, { roughness: 0.6 }), 0, 0, 0, dh, 14); sph(0.065, M(0xffffff, { roughness: 0.7 }), 0.06, -0.01, 0, dh, 10).scale.set(0.6, 0.9, 1.2); const de = [];
          for (const z of [-0.036, 0.036]) { const e = grp(0.075, 0.025, z, dh); sph(0.022, M(0xffffff), 0, 0, 0, e, 8); sph(0.011, M(0x111111), 0.018, 0, 0, e, 6); de.push(e); }
          const db = cone(0.026, 0.08, M(0xff9a1a), 0.125, -0.01, 0, dh, 6); db.rotation.z = -PI / 2; st.drv = { head: dh, eyes: de, beak: db }; st.blind = null; },
        /* young: the finish banner's checks wrap round the penguin's eyes */
        blindfold(st) { const tx = tex(32, 8, (g2) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g2.fillStyle = (i + j) % 2 ? '#222' : '#fff'; g2.fillRect(i * 4, j * 4, 4, 4); } }); const b = new T.Mesh(new T.TorusGeometry(0.105, 0.03, 6, 20), texM(tx, { side: T.DoubleSide })); b.rotation.x = PI / 2; b.position.y = 0.03; st.drv.head.add(b); return b; },
        /* into the river: up pops the penguin in a diving mask, blows its snorkel like a whale, and a rubber duck floats by */
        async snorkel(st) { const d = st.drv, h = d.head; snd('pop'); const mask = new T.Mesh(new T.TorusGeometry(0.06, 0.02, 6, 16), M(0x3a8ae0, { roughness: 0.4 })); mask.position.set(0.09, 0.03, 0); mask.rotation.y = PI / 2; h.add(mask);
          const gl = new T.Mesh(new T.CircleGeometry(0.055, 16), new T.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.5 })); gl.position.set(0.1, 0.03, 0); gl.rotation.y = PI / 2; h.add(gl); cyl(0.014, 0.014, 0.22, M(0xff9a1a), -0.02, 0.15, 0.09, h, 6);
          const y0 = h.position.y; await anim(0.3, q => { h.position.y = y0 + 0.12 * c.over(q); });
          snd('spout'); sprayAt(() => h.localToWorld(V3(-0.02, 0.27, 0.09)), 26, [0x2f8de0, 0x6cc0ff, 0xffffff], 0, 0.9); await wait(0.8);
          const dk = duck(st.xr - 0.15, st.yW - 0.04, 0.75, 1.1); dk.rotation.y = PI; st.trash.push(dk); snd('quack'); const x0 = dk.position.x, x1 = st.xe + 0.25;
          anim(2.4, q => { dk.position.x = x0 + (x1 - x0) * q; dk.position.y = st.yW - 0.04 + Math.sin(q * 20) * 0.02; dk.rotation.z = Math.sin(q * 14) * 0.08; }); await wait(1.0); snd('quack');
          await anim(0.5, q => { h.rotation.y = -0.9 * q; }); pg.blink(d, 2); await wait(1.0); },
        /* made it: beep-beep! A wheelie, and the penguin's weird happy honk */
        async victoryLap(st) { const g = st.car, d = st.drv; await wait(0.3);
          if (st.blind) { snd('beep'); await anim(0.6, q => { d.head.rotation.y = Math.sin(q * PI * 4) * 0.5; }); d.head.rotation.y = 0; const b = st.blind; st.blind = null; demo.attach(b); st.trash.push(b); snd('swish'); arcTo(b, b.position.clone().add(V3(-0.6, 0.1, 0.4)), 0.6, 0.8, 0.3); await wait(0.3); }
          snd('beep'); const r0 = g.rotation.z; await anim(0.5, q => { g.rotation.z = r0 + 0.38 * Math.sin(PI * q); }); g.rotation.z = r0;
          snd('happy'); const y0 = d.head.position.y; await anim(1.0, q => { d.head.position.y = y0 + Math.abs(Math.sin(q * PI * 4)) * 0.06; d.head.rotation.z = Math.sin(q * PI * 4) * 0.25; }); d.head.position.y = y0; d.head.rotation.z = 0; pg.blink(d, 2); await wait(0.5); },
        /* 8+: too fast — into the haystack; out bursts the chicken, lands on the penguin's head and lays an egg */
        async hayChicken(st) { const g = st.car, d = st.drv; for (let i = 0; i < 6; i++) { const s2 = box(0.015, R(0.12, 0.2), 0.015, M(0xe8c060), R(-0.06, 0.06), 0.12, R(-0.06, 0.06), d.head); s2.rotation.set(R(-0.6, 0.6), 0, R(-0.6, 0.6)); }
          await wait(0.5); const ck = chicken(st.hay.position.x, st.yR + 0.5, 0.2); st.trash.push(ck.g); ck.g.rotation.y = PI; ck.g.scale.setScalar(0.01); snd('bawk'); flapWings(ck, 1.6); anim(0.2, q => ck.g.scale.setScalar(Math.max(0.01, 1.45 * q)));
          await arcTo(ck.g, g.localToWorld(V3(-0.05, 0.66, 0)).add(V3(0, 0, 0.05)), 0.6, 1.0); snd('squish'); await wait(0.4);
          const e = egg(ck.g.position.x - 0.12, ck.g.position.y + 0.05, 0.3); st.trash.push(e); snd('plop'); fling([e], e.position.clone().add(V3(0.2, 0.2, 0)), 0.6, st.yR, { lift: 0.2 });
          await wait(0.6); pg.blink(d, 2); snd('bawk'); await wait(0.9); },
        rows: st => st.old ? [{ label: t('ph_r_speed'), opts: [4, 6, 8, 10, 12].map(v => ({ v, text: t('ph_ms', { n: v }) })) }]
          : [{ opts: (st.band <= 1 ? ['slow', 'fast'] : ['slow', 'mid', 'fast']).map(k => ({ v: k, icon: { slow: 'turtle', mid: 'rabbit', fast: 'rocket' }[k], text: t({ slow: 'ph_slow', mid: 'ph_med', fast: 'ph_fast' }[k]) })) }],
        answer: st => [st.old ? st.D : { far: 'fast', island1: 'slow', island2: 'mid' }[st.var]],
        preview() {},
        async run(st, sel) { const v = st.old ? sel[0] : { slow: 2, mid: 5, fast: 12 }[sel[0]], vd = v * this.S, gd = 9.8 * this.S, g = st.car, x0 = g.position.x, d = st.xe - x0, Tr = clamp(2 * d / vd, 1.0, 2.4);
          snd('zoom'); let tm = 0; await until(dt => { tm += dt; const k = Math.min(1, tm / Tr); g.position.x = x0 + d * k * k; for (const w of st.wh) w.rotation.y -= dt * (8 + v * 2); if (Math.random() < 0.3) puff(V3(g.position.x - 0.4, st.yL + 0.08, 0), 0xe8dcc8, 1, 0.25, 0.3, 0.3); return k >= 1; }, 4);
          /* the jump: the same fall for every speed, the distance grows with the speed */
          tm = 0; let res = null; const y0 = g.position.y;
          const onLand = x => st.lands.some(([a, b]) => x >= a - 0.05 && x <= b + 0.05);
          await until(dt => { tm += dt; const x = st.xe + vd * tm, y = y0 - 0.5 * gd * tm * tm; g.position.set(x, y, 0); g.rotation.z = -Math.min(0.35, tm * 0.3); for (const w of st.wh) w.rotation.y -= dt * 10;
            if (onLand(x) && y <= st.yR + 0.04 && y > st.yR - 0.3) { g.position.y = st.yR + 0.04; res = 'land'; return true; }
            if (!onLand(x) && y <= st.yW - 0.05) { res = 'water'; return true; } for (const [a] of st.lands) if (x >= a - 0.3 && x < a - 0.05 && y < st.yR) g.position.x = a - 0.32; return false; }, 6);
          if (res === 'water') { splash(V3(g.position.x, st.yW, 0), 1.3); shake(0.06); g.rotation.z = 0.2; let q = 0; sims.push(dt => { if (!g.parent) return false; q += dt; g.position.y = st.yW - 0.16 + Math.sin(q * 3) * 0.03; g.rotation.x = Math.sin(q * 2) * 0.08; return true; }); bubbles(V3(g.position.x, st.yW - 0.2, 0), 8, st.yW + 0.4); camIn(st, g.position.x + 0.2, st.yW + 0.6, 3.4); await wait(0.6); await this.snorkel(st); camOut(st);
            if (st.old) return 'short'; const IX = { slow: 0, mid: 1, fast: 2 }, ri = IX[{ far: 'fast', island1: 'slow', island2: 'mid' }[st.var]], pi = IX[sel[0]]; return pi > ri ? 'fast' : (ri - pi >= 2 ? 'slow' : 'mid'); }
          snd('thud'); g.rotation.z = 0; puff(V3(g.position.x, st.yR + 0.1, 0), st.old && g.position.x < st.xr + 0.8 ? 0xf0d890 : 0xd8c8a8, 8, 0.4, 1.2, 0.5);
          const inPit = st.old && g.position.x < st.xr + 0.8, onIsl = st.isl && g.position.x < st.isl[1] + 0.1; let vx = st.old ? vd * 0.5 : vd * 0.55; const dec = inPit ? vx * vx / (2 * 0.3) : onIsl ? 2.6 : st.old ? 1.2 : 0.9;
          await until(dt => { vx = Math.max(0, vx - dec * dt); g.position.x += vx * dt; for (const w of st.wh) w.rotation.y -= dt * vx * 8;
            const bx = st.banX || 4.4; if (!st.old && st.ban && st.ban.visible && g.position.x > bx - 0.2) { st.ban.visible = false; const bits = []; for (let i = 0; i < 14; i++) { const b = box(0.12, 0.12, 0.02, M(i % 2 ? 0x222222 : 0xffffff, { side: T.DoubleSide }), bx, st.yR + 0.92, R(-0.6, 0.6)); b.userData.hy = 0.01; bits.push(b); } st.trash.push(...bits); fling(bits, V3(bx - 0.2, st.yR + 0.8, 0), 3, st.yR, { lift: 1 }); impact(V3(bx, st.yR + 0.9, 0.3), 0xffd84a, 1); snd('pop'); st.blind = this.blindfold(st); }
            if (st.old && st.hay && g.position.x > st.hay.position.x - 0.75) { vx = 0; snd('crash'); shake(0.08); puff(V3(st.hay.position.x - 0.2, st.yR + 0.6, 0.2), 0xe8c060, 16, 0.45, 1.8, 1.2); return true; }
            return vx <= 0.01 || g.position.x > 6.0; }, 8);
          if (st.old && !inPit) { camIn(st, st.hay.position.x - 0.6, st.yR + 0.8, 3.4); await this.hayChicken(st); camOut(st); return 'long'; }
          yay(); confetti(V3(g.position.x, st.yR + 1.0, 0.3), 90, 2.8); firework(V3(g.position.x - 1.0, 3.0, -0.4), 0xff7ad0); if (st.old) impact(V3(g.position.x, st.yR + 0.5, 0.3), 0xffd84a, 0.9); camIn(st, g.position.x - 0.2, st.yR + 0.7, 3.4); await wait(0.4); firework(V3(g.position.x + 0.8, 3.3, -0.4), 0x4ab0ff); await this.victoryLap(st); camOut(st); return 'win'; },
        async reset(st) { this.car(st); if (!st.old) this.banner(st); puff(V3(-5.9, st.yL + 0.4, 0.3), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- 6. friction: the penguin slides to the fish */
      /* down the hill the penguin gains speed (v = √(2·g·h)); on the flat, friction takes it away (stops after h ÷ μ metres). Flat: 0.6 per metre */
      CH.friction = { go: 'ph_go_slide', XS: -5.6, XB: -3.0, PE: 4.8,
        view: st => ({ x0: -6.5, x1: 6.5, y0: 0, y1: Math.max(3.7, TOP + st.hd + 1.3), pitch: 0.22 }),
        lines: st => st.old ? { in: 'pv_r_o_in', win: 'pv_r_o_win', fail: { long: 'pv_r_o_long', short: 'pv_r_o_short' } } : { in: 'pv_r_y_in', win: sel => ({ sand: 'pv_r_y_win_sand', ice: 'pv_r_y_win_ice' })[sel[0]] || 'pv_r_y_win', fail: { ice: 'pv_r_y_ice', sand: 'pv_r_y_sand', snowlong: 'pv_r_y_snowlong', snowshort: 'pv_r_y_snowshort' } },
        MU: { ice: 0.1, snow: 0.25, sand: 0.5 },
        build(st) { plinth(13, 3.0, 0xcfe4fa, 0x8aaed4); for (let i = 0; i < 18; i++) sph(R(0.06, 0.16), M(0xffffff, { roughness: 1 }), R(-6.2, 6.2), TOP + 0.04, R(-1.3, -0.75) * (i % 2 ? 1 : -1), null, 8);
          if (st.old) st.hd = 0.9 * 2; else { st.var = pickVar(st, ['tall', 'mid', 'low']); const V = { tall: [3, 6], mid: [2, 8], low: [1, 10] }[st.var]; st.hd = 0.9 * V[0]; st.dT = V[1]; } this.hill(st);
          const wm = new T.MeshStandardMaterial({ color: 0x2a86d8, transparent: true, opacity: 0.92, roughness: 0.1 }); box(6.5 - this.PE, 0.05, 2.0, wm, (this.PE + 6.5) / 2, TOP + 0.03, 0); cyl(0.35, 0.4, 0.08, M(0xffffff), 5.8, TOP + 0.07, -0.5, null, 10);
          this.ground(st, 'snow');
          if (st.old) st.dT = pick([4, 6, 8, 10]);
          st.xT = this.XB + 0.6 * st.dT + 1.25;   /* the bucket stands just past where the penguin stops (it lies about a metre long) */ this.bucket(st); if (st.old) tag(t('ph_m', { n: st.dT }), st.xT, TOP + 1.1, 0.5, 0.34);
          this.penguin(st); },
        hy(st, x) { const xs = this.XS, xb = this.XB; if (x <= xs) return TOP + st.hd; if (x >= xb) return TOP + 0.05; const u = (xb - x) / (xb - xs); return TOP + 0.05 + (st.hd - 0.05) * u * u; },
        hill(st) { if (st.hillM) drop(st.hillM); const sh = new T.Shape(); sh.moveTo(-6.5, TOP); sh.lineTo(-6.5, TOP + st.hd); sh.lineTo(this.XS, TOP + st.hd); for (let i = 1; i <= 24; i++) { const x = this.XS + (this.XB - this.XS) * i / 24; sh.lineTo(x, this.hy(st, x)); } sh.lineTo(this.XB, TOP); sh.closePath();
          const geo = new T.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: false }); geo.translate(0, 0, -0.75); st.hillM = new T.Mesh(geo, M(0xf2f8ff, { roughness: 0.95 })); demo.add(st.hillM); },
        ground(st, k) { if (st.groundK === k) return; st.groundK = k; const m = k === 'ice' ? M(0xbfe9ff, { roughness: 0.05, metalness: 0.25 }) : k === 'snow' ? M(0xffffff, { roughness: 1 }) : texM(tex(64, 64, (g2, w, h) => { g2.fillStyle = '#e8c98a'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#c8a060'; for (let i = 0; i < 160; i++) g2.fillRect(Math.random() * w, Math.random() * h, 2, 2); }, [8, 2]), { roughness: 1 });
          if (st.run) { const o = st.run.material; if (o.map && o.userData.own) o.map.dispose(); o.dispose(); st.run.material = m; } else st.run = box(this.PE - this.XB, 0.05, 1.3, m, (this.XB + this.PE) / 2, TOP + 0.025, 0); },
        bucket(st) { const g = grp(st.xT, TOP + 0.05, 0.5); cyl(0.24, 0.19, 0.34, M(0xe8303a, { roughness: 0.5 }), 0, 0.17, 0, g, 18); cyl(0.22, 0.22, 0.02, M(0x2a6aa8), 0, 0.33, 0, g, 18); st.fish = [];
          for (let i = 0; i < 3; i++) { const f = this.fishMesh(1.35); f.position.set(R(-0.08, 0.08), 0.42, R(-0.08, 0.08)); g.add(f); f.rotation.z = R(-0.5, 0.5); st.fish.push(f); } },
        penguin(st) { if (st.pg) drop(st.pg); const p = st.pp = pip(this.XS - 0.4, TOP + st.hd, 0); Object.assign(st, { pg: p.g, head: p.head, beak: p.beak, eyes: p.eyes, fl: p.fl, belly: p.belly }); },
        blink(st, n) { for (let i = 0; i < (n || 1); i++) tween(0.16, q => { for (const e of st.eyes) e.scale.y = Math.max(0.08, Math.abs(1 - 2 * q)); }, () => { for (const e of st.eyes) e.scale.y = 1; }, i * 0.32); },
        beakAt(st) { const p = V3(); st.beak.getWorldPosition(p); return p; },
        fishMesh(k) { const f = grp(); sph(0.07, M(0xff9a1a), 0, 0, 0, f, 10).scale.set(1, 1.8, 0.6); cone(0.06, 0.1, M(0xff7a0a), 0, -0.15, 0, f, 6).rotation.z = PI; for (const z of [-0.036, 0.036]) sph(0.015, M(0x111111), 0.022, 0.07, z, f, 6); f.scale.setScalar(k || 1); return f; },
        spray(st, n, cols, dir, sz, gap) { const cs = [].concat(cols); for (let i = 0; i < n; i++) { const sp = c.sprite(cs[i % cs.length], R(0.1, 0.2) * (sz || 1), 0, -20, 0, demo, 0.95); let t2 = -i * (gap == null ? 0.03 : gap), on = false; const vx = dir ? dir * R(1.6, 3.8) : R(-0.6, 0.6), vz = R(-0.4, 0.4); let vy = dir ? R(0.2, 1.8) : R(2.6, 3.8);
            sims.push(d2 => { t2 += d2; if (t2 < 0) return true; if (!on) { on = true; sp.position.copy(this.beakAt(st)); } vy -= 7 * d2; sp.position.x += vx * d2; sp.position.y += vy * d2; sp.position.z += vz * d2; sp.material.opacity = Math.max(0, 0.95 - t2 * 0.75); if (t2 > 1.25) { sp.removeFromParent(); sp.material.dispose(); return false; } }); } },
        /* the jokes have to read on a phone: the camera leans in on each ending, and leans back out for Owl's lesson */
        punch(st, x, y, w) { camIn(st, x, y, w); },
        unpunch(st) { camOut(st); },
        lookAtYou(st) { return anim(0.25, q => { st.head.rotation.y = -1.2 * K.ease(q); }); },
        /* too rough: the sand grabs its belly, it trips and plants its head in the sand ('mmf! mmf!', feet kicking), pops out wearing a sand
           hat, and 'ah… ah… ACHOO!': the sneeze blows the sand off and pushes the penguin backwards (every push has a push back) */
        async sandGag(st, k) { const col = k === 'snow' ? 0xf4f8ff : k === 'ice' ? 0xd8f0ff : 0xd2a560, pcol = k === 'sand' ? 0xc29550 : 0xffffff, scol = k === 'sand' ? [0xc29550, 0xa87a3a, 0xe2c07e] : [0xffffff, 0xe8f2ff, 0xc8dcf0]; const g = st.pg, base = TOP + 0.05, px = g.position.x, hl = V3(0.019, 0.855, 0), hp = V3(), h0 = V3(px + 0.855, TOP + 0.33, 0), h1 = V3(px + 1.0, TOP + 0.1, 0), T1 = -PI + 0.3;
          const place = th => { g.rotation.z = th; g.position.set(hp.x - (hl.x * Math.cos(th) - hl.y * Math.sin(th)), hp.y - (hl.x * Math.sin(th) + hl.y * Math.cos(th)), 0); };
          snd('thud'); await anim(0.22, q => { hp.lerpVectors(h0, h1, q); place(-PI / 2 + (T1 + PI / 2) * q * q); }); shake(0.05); puff(V3(h1.x, TOP + 0.12, 0.25), pcol, 12, 0.32, 1.3, 0.9); snd('mmf');
          await anim(0.75, q => { place(T1 + Math.sin(q * 28) * 0.1); for (const f of st.fl) f.rotation.x = Math.sin(q * 50) * 1.1; }); place(T1); for (const f of st.fl) f.rotation.x = 0;
          const sandM = M(col, { roughness: 1 }), hat = cone(0.15, 0.24, sandM, -0.01, 0.26, 0, st.head, 12), face = sph(0.12, sandM, 0.16, -0.05, 0, st.head, 12); hat.rotation.z = 0.18; face.scale.set(0.55, 0.8, 1.3);
          snd('pop'); const g0 = g.position.clone(), x1 = h1.x;
          await anim(0.3, q => { g.position.set(g0.x + (x1 - g0.x) * q, g0.y + (base - g0.y) * q + Math.sin(PI * q) * 0.5, 0); g.rotation.z = T1 * (1 - q); });
          g.rotation.z = 0; g.position.set(x1, base, 0); snd('squish'); await anim(0.18, q => { const s2 = Math.sin(PI * q); g.scale.set(0.95 * (1 + 0.16 * s2), 0.95 * (1 - 0.2 * s2), 0.95 * (1 + 0.16 * s2)); }); g.scale.setScalar(0.95);
          this.blink(st, 2); await wait(0.35);
          /* the sneeze runs in real time, in step with its sound */
          snd('achoo'); await K.anim(0.92, q => { const tt = q * 0.92, a = Math.max(0.6 * Math.sin(Math.min(1, tt / 0.36) * PI), tt > 0.42 ? Math.sin(Math.min(1, (tt - 0.42) / 0.5) * PI / 2) : 0); st.head.rotation.z = 0.55 * a; g.rotation.z = 0.2 * a; g.scale.set(0.95, 0.95 * (1 + 0.12 * a), 0.95); });
          await K.anim(0.08, q => { st.head.rotation.z = 0.55 - q; g.rotation.z = 0.2 - 0.5 * q; g.scale.set(0.95 * (1 + 0.14 * q), 0.95 * (1.12 - 0.3 * q), 0.95 * (1 + 0.14 * q)); });
          face.visible = false; this.spray(st, 40, scol, 1, 1.3, 0.006); shake(0.07);
          demo.attach(hat); st.trash.push(hat); { let vy = 3.4; const hy = TOP + 0.08; sims.push(dt => { if (!hat.parent) return false; vy -= 9.8 * dt; hat.position.x -= 0.8 * dt; hat.position.y += vy * dt; hat.rotation.z += 10 * dt; if (vy < 0 && hat.position.y <= hy) { hat.position.y = hy; hat.rotation.set(0, 0, 0); hat.scale.y *= 0.5; snd('squish'); return false; } return true; }); }
          snd('scratch'); const gx = g.position.x; await anim(0.45, q => { const e = K.ease(q); g.position.x = gx - 0.8 * e; g.rotation.z = -0.3 * (1 - e) + Math.sin(q * PI * 3) * 0.1 * (1 - q); st.head.rotation.z = -0.45 * (1 - e); g.scale.setScalar(0.95); });
          snd('thud'); await anim(0.2, q => { g.position.y = base - 0.08 * q; g.rotation.z = 0.32 * q; });
          await this.lookAtYou(st); this.blink(st, 2); await wait(0.6); this.unpunch(st); return st.old ? 'short' : (k === 'sand' ? 'sand' : 'snowshort'); },
        /* too slippery to stop: off the end, SPLASH. Up it pops and spouts like a fountain, then a fish leaps out of the pond, lands on its
           head, slaps its face with its tail (slap! slap!) and dives home */
        async pondGag(st, v) { const g = st.pg, px = g.position.x, xl = Math.min(px + 0.6 * Math.max(v, 1.5) * 0.3, this.PE + 0.75);
          await anim(0.3, q => { g.position.x = px + (xl - px) * q; g.position.y = TOP + 0.35 - q * 0.45; g.rotation.z = -PI / 2 + q * 0.5; });
          const at = V3(xl, TOP + 0.06, 0); splash(at, 1.3); shake(0.06); g.visible = false; await wait(0.35);
          const yb = TOP - 0.24; g.rotation.z = 0; g.position.set(xl + 0.15, yb - 0.6, 0); g.visible = true; snd('pop');
          await anim(0.2, q => { g.position.y = yb - 0.6 + 0.6 * K.ease(q); });
          let q0 = 0; sims.push(dt => { if (!g.parent) return false; q0 += dt; g.position.y = yb + Math.sin(q0 * 3) * 0.035; for (const f of st.fl) f.rotation.x = Math.sin(q0 * 9) * 0.5; return true; });
          await anim(0.15, q => { st.head.rotation.z = 0.7 * q; }); snd('spout'); this.spray(st, 34, [0x2f8de0, 0x6cc0ff, 0xffffff], 0, 1.25); await wait(0.85); await anim(0.15, q => { st.head.rotation.z = 0.7 * (1 - q); });
          const fish = this.fishMesh(2.2), top = () => st.head.getWorldPosition(V3()).add(V3(0, 0.25, 0)), f0 = V3(g.position.x + 0.45, TOP + 0.02, 0.75); st.trash.push(fish);
          fish.position.copy(f0); splash(f0, 0.35); snd('whistleUp');
          await anim(0.5, q => { fish.position.lerpVectors(f0, top(), q); fish.position.y += Math.sin(PI * q) * 1.0; fish.rotation.z = PI / 2 + (1 - q) * TAU; }); fish.rotation.z = PI / 2; snd('boing');
          let on = true; sims.push(() => { if (!on || !fish.parent) return false; fish.position.copy(top()); return true; });
          for (let i = 0; i < 2; i++) { await anim(0.12, q => { fish.rotation.z = PI / 2 - 0.75 * q; }); snd('slap'); this.blink(st); st.head.rotation.z = -0.25; await anim(0.18, q => { fish.rotation.z = PI / 2 - 0.75 * (1 - q); st.head.rotation.z = -0.25 * (1 - q); }); }
          on = false; const f1 = fish.position.clone(), f2 = V3(g.position.x - 0.45, TOP - 0.05, 0.6); snd('whistleDown');
          await anim(0.42, q => { fish.position.lerpVectors(f1, f2, q); fish.position.y += Math.sin(PI * q) * 0.7; fish.rotation.z = PI / 2 + q * TAU * 0.75; }); fish.visible = false; splash(f2, 0.35);
          await this.lookAtYou(st); snd('honkSad'); this.blink(st, 2); await wait(0.7); this.unpunch(st); return st.old ? 'long' : 'ice'; },
        /* just right: the fish jumps out of the bucket into its beak, GULP, its belly swells, a hiccup bubble pops, then the weird happy honk
           and a hopping, spinning, flapping dance */
        async winGag(st) { const g = st.pg, base = TOP + 0.05, f = st.fish[0];
          demo.attach(f); snd('boing'); const p0 = f.position.clone(), s0 = f.scale.x, tgt = this.beakAt(st).add(V3(0.08, 0.02, 0));
          await anim(0.5, q => { f.position.lerpVectors(p0, tgt, q); f.position.y += Math.sin(PI * q) * 1.2; f.rotation.z = q * 9; f.scale.setScalar(s0 * (1 + 0.35 * q)); });
          await anim(0.1, q => { f.scale.setScalar(s0 * 1.35 * (1 - 0.9 * q)); }); f.visible = false; snd('gulp');
          await anim(0.5, q => { st.head.scale.setScalar(1 + 0.3 * Math.sin(PI * Math.min(1, q * 2.2))); const b = Math.sin(PI * Math.max(0, q - 0.3) / 0.7 * 0.5); st.belly.scale.set(0.95 * (1 + 0.45 * b), 1.22 * (1 + 0.12 * b), 0.8 * (1 + 0.3 * b)); });
          st.head.scale.setScalar(1); await wait(0.15);
          snd('hic'); const bp = this.beakAt(st), bub = new T.Mesh(new T.SphereGeometry(0.15, 16, 12), new T.MeshStandardMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.3 })); bub.position.copy(bp); demo.add(bub); st.trash.push(bub); c.sprite(0xffffff, 0.12, -0.05, 0.06, 0.12, bub, 0.9);
          anim(0.2, q => { g.position.y = base + Math.sin(PI * q) * 0.18; });
          await anim(0.7, q => { bub.position.set(bp.x + q * 0.25 + Math.sin(q * 12) * 0.04, bp.y + q * 0.9, bp.z); bub.scale.setScalar(1 + q * 0.9); }); bub.visible = false; snd('pop'); puff(bub.position.clone(), 0xffffff, 6, 0.18, 0.6, 0.3);
          snd('happy'); await anim(1.1, q => { const hop = Math.abs(Math.sin(q * PI * 3)); g.position.y = base + hop * 0.28; g.scale.set(0.95 * (1 + 0.1 * (1 - hop)), 0.95 * (1 + 0.12 * hop - 0.1 * (1 - hop)), 0.95); g.rotation.y = K.ease(Math.min(1, Math.max(0, (q - 0.33) / 0.34))) * TAU; for (const fl of st.fl) fl.rotation.x = Math.sin(q * 44) * 0.9; st.belly.scale.x = 0.95 * (1.45 - 0.45 * q); });
          g.rotation.y = 0; g.scale.setScalar(0.95); g.position.y = base; for (const fl of st.fl) fl.rotation.x = 0; st.belly.scale.set(0.95, 1.22, 0.8);
          hearts(V3(g.position.x, TOP + 1.1, 0), 6); yay(); impact(V3(g.position.x, TOP + 0.8, 0.3), 0xbfe9ff, 0.8); confetti(V3(g.position.x, TOP + 1.2, 0.3), 90, 2.6, [0xffffff, 0xbfe9ff, 0x9ad0ff, 0xffd84a]); firework(V3(g.position.x - 1.0, 2.9, -0.4), 0x9ad0ff);
          this.unpunch(st); await wait(1.3); return 'win'; },
        rows: st => { const gr = ['ice', 'snow', 'sand'].map(k => ({ v: k, icon: { ice: 'icecube', snow: 'snowflake', sand: 'desert' }[k], text: t('ph_' + k) }));
          return st.old ? [{ label: t('ph_r_start'), opts: [1, 2, 3].map(h => ({ v: h, icon: SVG.level((h - 1) / 2), text: t('ph_m', { n: h }) })) }, { label: t('ph_r_ground'), opts: gr }] : [{ opts: gr }]; },
        answer: st => st.old ? ({ 4: [1, 'snow'], 6: [3, 'sand'], 8: [2, 'snow'], 10: [1, 'ice'] })[st.dT] : [{ tall: 'sand', mid: 'snow', low: 'ice' }[st.var]],
        preview(st) { const k = st.old ? st.sel[1] : st.sel[0]; if (k) this.ground(st, k); if (st.old && st.sel[0] && Math.abs(st.hd - 0.9 * st.sel[0]) > 0.01) { st.hd = 0.9 * st.sel[0]; this.hill(st); const g = st.pg; glide(g, V3(this.XS - 0.4, TOP + st.hd, 0), 0.4, 0.3); snd('swish'); } },
        async run(st, sel) { const k = st.old ? sel[1] : sel[0], h = st.hd / 0.9, mu = this.MU[k], g = st.pg, d = h / mu;
          /* Yoni 2026-10-07: 'something funny needs to happen … the penguin needs to make a weird happy sound'. The run-up: a nervous waddle to
             the edge, a peek down, a gulp, then 'wheee' and a belly flop */
          const x0 = g.position.x; snd('squeak'); await anim(0.5, q => { g.position.x = x0 + 0.28 * q; g.rotation.z = Math.sin(q * PI * 4) * 0.14; }); snd('squeak');
          await anim(0.22, q => { g.rotation.z = -0.38 * q; }); snd('gulp'); this.blink(st); await wait(0.45);
          snd('whistleUp'); await anim(0.34, q => { g.position.y = TOP + st.hd + Math.sin(PI * q) * 0.5; g.rotation.z = -0.38 - (PI / 2 - 0.38) * q; }); snd('squish'); g.position.y = TOP + st.hd + 0.3;
          snd(k === 'ice' ? 'zip' : k === 'sand' ? 'scratch' : 'slide'); const gh = 9.8 * 0.36 / 0.9, ytop = TOP + st.hd; let x = g.position.x, tf = 0;
          await until(dt => { tf += dt; const y = this.hy(st, x), v = Math.sqrt(Math.max(0.16, 2 * gh * (ytop - y))), sl = (this.hy(st, x + 0.01) - y) / 0.01; x += v * dt / Math.sqrt(1 + sl * sl); const yy = this.hy(st, x); g.position.set(x, yy + 0.3, 0); g.rotation.z = -PI / 2 + Math.atan(sl); for (const f of st.fl) f.rotation.x = Math.sin(tf * 22) * 0.5; return x >= this.XB; }, 6);
          const v0 = Math.sqrt(2 * 9.8 * h), a = mu * 9.8, sPond = (this.PE - this.XB) / 0.6; let s = 0, v = v0;
          { const xs = this.XB + 0.6 * Math.min(d, sPond) + 0.6; if (d >= sPond) this.punch(st, this.PE + 0.1, TOP + 0.8, 4.4); else if (Math.abs(d - st.dT) <= 0.6) this.punch(st, xs + 0.3, TOP + 0.9, 3.8); else if (d < st.dT - 0.6) this.punch(st, xs + 0.4, TOP + 0.8, 3.6); else this.punch(st, (xs + st.xT) / 2, TOP + 0.8, Math.max(3.6, Math.abs(xs - st.xT) + 2.4)); }
          await until(dt => { tf += dt; v = Math.max(0, v - a * dt); s += v * dt; g.position.set(this.XB + 0.6 * Math.min(s, sPond), TOP + 0.35, 0); g.rotation.z = -PI / 2 + Math.sin(s * 3) * 0.03; for (const f of st.fl) f.rotation.x = Math.sin(tf * 22) * 0.5 * Math.min(1, v / 2);
            if (k === 'ice' && Math.random() < 0.3) { const sp = glow(0xffffff, 0.25, g.position.x - 0.2, TOP + 0.1, R(-0.3, 0.3), 0.8); let q2 = 0; sims.push(d2 => { q2 += d2; sp.material.opacity = Math.max(0, 0.8 * (1 - q2 / 0.5)); if (q2 > 0.5) { sp.removeFromParent(); sp.material.dispose(); return false; } }); } return v <= 0 || s >= sPond; }, 20);
          for (const f of st.fl) f.rotation.x = 0;
          if (s >= sPond) return this.pondGag(st, v);
          if (d < st.dT - 0.6) return this.sandGag(st, k);
          /* it pushes itself up onto its feet a little further on (its body was lying ahead of its feet) */
          const base = TOP + 0.05, x0b = g.position.x; await anim(0.4, q => { g.rotation.z = -PI / 2 * (1 - q); g.position.x = x0b + 0.6 * q; g.position.y = base + 0.3 * (1 - q) + Math.sin(PI * q) * 0.12; });
          if (Math.abs(d - st.dT) <= 0.6) return this.winGag(st);
          /* slid past the fish: it turns round, sees the bucket behind it, and its shoulders drop with a sad little honk */
          snd('squeak'); await anim(0.32, q => { g.rotation.y = PI * K.ease(q); }); await wait(0.2); snd('honkSad');
          await anim(0.35, q => { const e = K.ease(q); g.scale.set(0.95, 0.95 * (1 - 0.1 * e), 0.95); st.head.rotation.z = -0.35 * e; for (const f of st.fl) f.rotation.x = -0.25 * e; });
          await wait(0.6); this.unpunch(st); return st.old ? 'long' : 'snowlong'; },
        async reset(st) { this.penguin(st); puff(V3(this.XS - 0.4, TOP + st.hd + 0.4, 0.3), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- 7. energy: the loop-the-loop coaster */
      /* the cart's speed comes from energy: g·(start height − height now), minus what friction has taken (a tenth of the drop by the top of
         the loop). It can never climb higher than it started, so a low start rolls back and forth in the valley */
      CH.energy = { go: 'ph_go_roll', XS: -5.3, XV: -2.2, XC: 0.3, XE: 5.4, G: 6,
        view: () => ({ x0: -6.5, x1: 6.5, y0: 0, y1: 4.3 }),
        lines: st => st.old ? { in: 'pv_e_o_in', win: 'pv_e_o_win', fail: { low: 'pv_e_o_low' } } : st.var === 'small' ? { in: 'pv_e_y_in2', win: 'pv_e_y_win2', fail: { low: 'pv_e_y_low', mid: 'pv_e_y_mid', fast: 'pv_e_y_fast' } } : { in: 'pv_e_y_in', win: 'pv_e_y_win', fail: { low: 'pv_e_y_low', mid: 'pv_e_y_mid' } },
        build(st) { plinth(13, 3.0, 0xe8dcff, 0x9a7ac8); st.V = TOP + 0.3;
          if (st.old) { st.T = pick([2, 2.5, 3]); st.R = 0.75 * st.T / 2; st.opts = ({ 2: [1.5, 2, 2.5, 3.5], 2.5: [2, 2.5, 3, 4], 3: [2.5, 3, 3.5, 4.5] })[st.T]; }
          else { st.var = pickVar(st, ['big', 'small']); const sm = st.var === 'small'; st.R = sm ? 0.62 : 1.0; st.opts = st.band <= 1 ? (sm ? ['mid', 'high'] : ['low', 'high']) : ['low', 'mid', 'high']; }
          st.h = this.startY(st, st.opts[0]); this.track(st); this.cart(st);
          const bell = grp(3.7, 0, 0.35); for (const z of [-0.45, 0.45]) cyl(0.04, 0.04, 1.5, M(0x9aa0aa), 0, TOP + 0.75, z, bell, 8); box(0.08, 0.08, 1.0, M(0x9aa0aa), 0, TOP + 1.5, 0, bell); st.bell = grp(0, TOP + 1.46, 0, bell);
          cone(0.16, 0.26, M(0xffc84a, { metalness: 0.7, roughness: 0.25 }), 0, -0.16, 0, st.bell, 18); sph(0.04, M(0x8a6a2a), 0, -0.3, 0, st.bell, 8);
          this.foam(st); if (st.old) tag(t('ph_sg_loop', { h: st.T }), this.XC, st.V + 2 * st.R + 0.75, 0, 0.34); },
        startY(st, v) { return st.old ? st.V + 0.75 * v : st.V + ({ low: 1.3, mid: 2.12, high: 3.0 })[v]; },
        path(st) { const P = [], V = st.V, R = st.R, h = st.h, add = (x, y, z) => P.push(V3(x, y, z));
          for (let x = this.XS - 0.5; x < this.XS; x += 0.05) add(x, h, -0.35);
          for (let i = 0; i <= 60; i++) { const u = i / 60, x = this.XS + (this.XV - this.XS) * u; add(x, V + (h - V) * (1 + Math.cos(PI * u)) / 2, -0.35); }
          for (let x = this.XV + 0.05; x < this.XC; x += 0.05) add(x, V, -0.35);
          const nl = Math.ceil(TAU * R / 0.05); st.loop0 = P.length; for (let i = 0; i <= nl; i++) { const f = i / nl * TAU; add(this.XC + R * Math.sin(f), V + R - R * Math.cos(f), -0.35 + 0.7 * i / nl); } st.loop1 = P.length;
          for (let x = this.XC + 0.05; x <= this.XE; x += 0.05) add(x, V, 0.35);
          const S0 = [0]; for (let i = 1; i < P.length; i++) S0.push(S0[i - 1] + P[i].distanceTo(P[i - 1])); st.P = P; st.S = S0; st.sTop = S0[Math.round((st.loop0 + st.loop1) / 2)]; st.sEnd = S0[S0.length - 1]; },
        at(st, s) { const S0 = st.S, P = st.P; s = clamp(s, 0, st.sEnd); let lo = 0, hi = S0.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S0[m] <= s) lo = m; else hi = m; } const k = (s - S0[lo]) / Math.max(1e-6, S0[hi] - S0[lo]); return { p: P[lo].clone().lerp(P[hi], k), t: P[hi].clone().sub(P[lo]).normalize() }; },
        track(st) { if (st.trk) drop(st.trk); st.trk = grp(); this.path(st); const P = st.P, red = M(0xe8303a, { metalness: 0.4, roughness: 0.35 }), dark = M(0x4a4f58);
          for (const dz of [-0.15, 0.15]) { const crv = new T.CatmullRomCurve3(P.map(p => V3(p.x, p.y, p.z + dz))); st.trk.add(new T.Mesh(new T.TubeGeometry(crv, P.length, 0.035, 6, false), red)); }
          for (let s = 0; s < st.sEnd; s += 0.26) { const { p, t: tg } = this.at(st, s), b = box(0.06, 0.03, 0.42, dark, p.x, p.y - 0.02, p.z, st.trk); b.rotation.z = Math.atan2(tg.y, tg.x); }
          for (let i = 0; i < P.length; i += 12) { const p = P[i]; if (i > st.loop0 && i < st.loop1) continue; if (p.y > TOP + 0.08) cyl(0.025, 0.025, p.y - TOP, M(0xb8bcc8), p.x, TOP + (p.y - TOP) / 2, p.z, st.trk, 6); }
          const tw = st.h - TOP; box(0.7, tw, 0.9, M(0xb48cff, { roughness: 0.7 }), this.XS - 0.25, TOP + tw / 2 - 0.02, -0.35, st.trk); cyl(0.015, 0.015, 0.6, M(0xffffff), this.XS - 0.5, st.h + 0.3, -0.35, st.trk, 4); box(0.3, 0.18, 0.01, M(0xffd84a), this.XS - 0.35, st.h + 0.5, -0.35, st.trk); },
        cart(st) { if (st.cartG) drop(st.cartG); const g = grp(); st.cartG = g; box(0.52, 0.24, 0.42, M(0x4ab0ff, { roughness: 0.35, metalness: 0.2 }), 0, 0.2, 0, g); box(0.06, 0.16, 0.44, M(0xffd84a), 0.27, 0.16, 0, g); for (const [x, z] of [[0.17, 0.17], [-0.17, 0.17], [0.17, -0.17], [-0.17, -0.17]]) cyl(0.06, 0.06, 0.06, M(0x1a1a1a), x, 0.05, z, g, 10).rotation.x = PI / 2;
          /* the rider: the penguin */
          st.rider = pip(-0.04, 0.1, 0, 0.42, 0, g); st.arms = st.rider.fl; this.place(st, 0.4); },
        /* bullseye: the cart slams into the foam, the penguin flies out, bounces off the foam, flips, and lands back in its seat */
        async flip(st) { const p = st.rider, g = st.cartG, home = V3(-0.04, 0.1, 0); pg.flippersUp(p, 0); demo.attach(p.g); const p0 = p.g.position.clone(), foam = V3(this.XE + 0.2, TOP + 1.15, 0.35); snd('whee');
          await anim(0.45, q => { p.g.position.set(p0.x + (foam.x - p0.x) * q, p0.y + (foam.y - p0.y) * q + Math.sin(PI * q) * 0.6, p0.z + (foam.z - p0.z) * q); p.g.rotation.z = -q * 1.2; });
          snd('boing'); const p1 = p.g.position.clone(); await anim(0.75, q => { const e = g.localToWorld(home.clone()); p.g.position.set(p1.x + (e.x - p1.x) * q, p1.y + (e.y - p1.y) * q + Math.sin(PI * q) * 1.3, p1.z + (e.z - p1.z) * q); p.g.rotation.z = -1.2 + (1.2 - TAU) * q; });
          g.attach(p.g); p.g.position.copy(home); p.g.rotation.set(0, 0, 0); snd('squish'); await pg.squash(p, 1.4); await pg.laugh(p, false); },
        /* too much energy for the little foam pile: the cart smashes through it and off the end; the penguin flies out and lands upside down */
        async smash(st) { const g = st.cartG, p = st.rider; impact(V3(this.XE, TOP + 0.6, 0.6), 0xff7a5a, 1); snd('crash'); fling(st.fb, V3(this.XE - 0.4, TOP + 0.3, 0.35), 6, TOP, { lift: 0.6, dir: 1 }); camIn(st, this.XE + 0.6, TOP + 0.8, 3.8);
          demo.attach(p.g); const p0 = p.g.position.clone(), land = V3(this.XE + 1.35, 0.4, 0.6), c0 = g.position.clone(); snd('whee');
          anim(0.6, q => { g.position.set(c0.x + 1.0 * q, c0.y - 0.5 * q * q, c0.z); g.rotation.z = -0.9 * q; });
          await anim(0.8, q => { p.g.position.set(p0.x + (land.x - p0.x) * q, p0.y + (land.y - p0.y) * q + Math.sin(PI * q) * 1.0, p0.z + (land.z - p0.z) * q); p.g.rotation.z = -q * PI; });
          snd('thud'); shake(0.08); pg.dizzy(p, 2.2); pg.wobble(p, 1.6, 0.2); await wait(0.8); pg.blink(p, 2); snd('honkSad'); await wait(0.9); camOut(st); return 'fast'; },
        /* it could not climb that high: it rocks back and forth until the penguin is quite green — 'urp' */
        async seasick(st) { const p = st.rider; pg.flippersUp(p, 0); for (const e of p.eyes) e.scale.setScalar(1); await wait(0.3); const c0 = new T.Color(0xffffff), c1 = new T.Color(0x9ad45a);
          await anim(0.6, q => { p.face.material.color.copy(c0).lerp(c1, q); p.face.scale.set(0.6 * (1 + 0.3 * q), 0.9, 1.2 * (1 + 0.3 * q)); });
          snd('urp'); await anim(0.5, q => { p.g.rotation.z = Math.sin(q * PI * 3) * 0.15; p.head.rotation.z = -0.3 * Math.sin(PI * q); }); p.g.rotation.z = 0; pg.blink(p, 2); await pg.look(p); await wait(0.4); snd('honkSad'); await wait(0.8); },
        place(st, s) { const { p, t: tg } = this.at(st, s), a = Math.atan2(tg.y, tg.x); st.cartG.position.set(p.x - Math.sin(a) * 0.04, p.y + Math.cos(a) * 0.04, p.z); st.cartG.rotation.set(0, 0, a); },
        foam(st) { for (const b of st.fb || []) drop(b); st.fb = []; const cols = [0xff7ad0, 0xffd84a, 0x6ad06a, 0x4ab0ff, 0xff9a3c, 0xa87aff]; let k = 0; for (let r = 0; r < (st.var === 'small' ? 1 : 3); r++) for (let i = 0; i < 3; i++) { const b = box(0.32, 0.32, 0.36, M(cols[k++ % 6], { roughness: 0.9 }), this.XE + 0.35, TOP + 0.16 + r * 0.33, 0.35 + (i - 1) * 0.37); b.userData.hy = 0.16; st.fb.push(b); } },
        rows: st => [{ label: st.old ? t('ph_r_start') : null, opts: st.opts.map((v, i) => ({ v, icon: SVG.level(st.old ? i / (st.opts.length - 1) : ({ low: 0.15, mid: 0.55, high: 1 })[v]), text: st.old ? t('ph_m', { n: v }) : t('ph_' + v) })) }],
        answer: st => [st.old ? st.opts.find(h => 0.9 * h > st.T + 0.05) : st.var === 'small' ? 'mid' : 'high'],
        preview(st) { const v = st.sel[0]; if (v == null) return; const h = this.startY(st, v); if (Math.abs(h - st.h) < 0.01) return; st.h = h; this.track(st); this.place(st, 0.4); snd('swish'); },
        async run(st, sel) { const g = this.G, hEff = st.h, k = 0.1 * g * (hEff - st.V) / st.sTop; let kk = k, Ls = 0, s = 0.4, dir = 1, tm = 0, rang = false, won = false, done = false, wheee = false, gasped = false; snd('zoom');
          await until(dt => { tm += dt; const y = this.at(st, s).p.y, E = g * (hEff - y) - Ls; let v = Math.sqrt(Math.max(0, 2 * E)) + 0.35 * Math.max(0, 1 - tm);
            if (v < 0.06) { const yAhead = this.at(st, s + dir * 0.02).p.y; if (yAhead > y) { dir = -dir; kk = k * 16; if (!gasped) { gasped = true; snd('gasp'); pg.flippersUp(st.rider, 0); for (const e of st.rider.eyes) e.scale.setScalar(1.5); } } v = 0.06; }   /* rolling back: let it settle in a few seconds */
            if (!wheee && dir > 0 && s > st.sTop - 0.6 && s < st.sTop) { wheee = true; snd('whee'); pg.flippersUp(st.rider, 1); }   /* up into the loop: flippers up! */
            s += dir * v * dt; Ls += kk * v * dt; s = clamp(s, 0.4, st.sEnd); this.place(st, s); const p = this.at(st, s).p;
            if (!rang && p.x > 3.65 && s > st.sTop) { rang = true; snd('ding'); let q = 0; sims.push(d2 => { q += d2; st.bell.rotation.x = Math.sin(q * 14) * 0.5 * Math.exp(-q * 2); return q < 2.5; }); }
            if (s > st.sTop + 0.3) won = true;
            if (won && p.x > this.XE - 0.05) { done = true; st.vEnd = v; return true; }
            if (!won && tm > 3 && v < 0.3 && Math.abs(y - st.V) < 0.05 && E < 0.2) return true; return tm > 14; }, 16);
          if (done && !st.old && st.var === 'small' && st.vEnd > 5.0) return this.smash(st);
          if (done) { impact(V3(this.XE, TOP + 0.6, 0.6), 0xffd84a, 1); snd('crash'); fling(st.fb, V3(this.XE - 0.4, TOP + 0.4, 0.35), 4, TOP, { lift: 0.8, dir: 0.4 });
            yay(); confetti(V3(3.5, 2.6, 0.4), 100, 3); firework(V3(st.XC || this.XC, st.V + 2 * st.R + 1.0, -0.4), 0xff7ad0); camIn(st, this.XE - 0.5, TOP + 1.1, 3.6); await this.flip(st); firework(V3(3.2, 3.4, -0.4), 0x4ab0ff); await wait(0.5); camOut(st); return 'win'; }
          const cp = st.cartG.position; camIn(st, cp.x, cp.y + 0.45, 3.0); await this.seasick(st); camOut(st); return st.old ? 'low' : sel[0]; },
        async reset(st) { this.cart(st); this.foam(st); st.bell.rotation.x = 0; puff(V3(this.XS, st.h + 0.4, 0), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- 8. floating: a raft for Teddy, gold on the barge */
      CH.float = { go: 'ph_go_sail',
        view: () => ({ x0: -6.5, x1: 6.5, y0: 0, y1: 3.4, pitch: 0.42 }),
        lines: st => st.old ? { in: 'pv_w_o_in', win: 'pv_w_o_win', fail: { sink: 'pv_w_o_sink', light: 'pv_w_o_light' } } : { in: st.var === 'heavy' ? 'pv_w_y_in2' : 'pv_w_y_in', win: sel => sel[0] === 'mboat' ? 'pv_w_y_win2' : 'pv_w_y_win', fail: { stone: 'pv_w_y_stone', ball: 'pv_w_y_ball', wood: 'pv_w_y_wood_h' } },
        build(st) { plinth(13, 3.0, 0xb89a60, 0x8a7048); st.yW = TOP + 0.7; st.yD = st.yW + 0.3;
          const vol = new T.Mesh(new T.BoxGeometry(13, st.yW - TOP, 3.0), new T.MeshStandardMaterial({ color: 0x1f78c8, transparent: true, opacity: 0.66, roughness: 0.1, depthWrite: false })); vol.position.set(0, (st.yW + TOP) / 2, 0); vol.renderOrder = 2; demo.add(vol);
          const geo = new T.PlaneGeometry(13, 3, 52, 12); geo.rotateX(-PI / 2); const sea = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x2f90e0, transparent: true, opacity: 0.86, roughness: 0.12, metalness: 0.15, depthWrite: false })); sea.position.y = st.yW; sea.renderOrder = 3; demo.add(sea);
          const pos = geo.attributes.position, base = Float32Array.from(pos.array); let tw = 0; sims.push(dt => { tw += dt; for (let i = 0; i < pos.count; i++) pos.setY(i, Math.sin(base[i * 3] * 1.3 + tw * 1.6) * 0.02 + Math.sin(base[i * 3 + 2] * 2 + tw * 1.2) * 0.015); pos.needsUpdate = true; return true; });
          const wood = M(0xa8743a, { roughness: 0.85 }); box(2.9, 0.08, 1.7, wood, -5.05, st.yD - 0.04, 0); for (const [x, z] of [[-6.3, -0.75], [-6.3, 0.75], [-3.8, -0.75], [-3.8, 0.75]]) cyl(0.07, 0.07, st.yD - TOP, M(0x7a5028), x, (st.yD + TOP) / 2, z, null, 8);
          const isl = grp(5.3, 0, 0); sph(1.3, M(0xf2cf78, { roughness: 1 }), 0, st.yW - 0.12, 0, isl, 22).scale.set(1.1, 0.42, 0.9);
          for (let i = 0; i < 5; i++) cyl(0.07 - i * 0.008, 0.08 - i * 0.008, 0.36, M(0x8a5a2a), 0.25 + i * 0.05, st.yW + 0.4 + i * 0.34, -0.2, isl, 8).rotation.z = -0.12;
          for (let i = 0; i < 6; i++) { const lf = sph(0.36, M(0x3aa04a, { roughness: 0.8 }), 0.5 + Math.cos(i) * 0.3, st.yW + 2.1, -0.2 + Math.sin(i) * 0.3, isl, 10); lf.scale.set(1.6, 0.18, 0.5); lf.rotation.set(Math.sin(i) * 0.5, i, Math.cos(i) * 0.5 - 0.3); }
          cyl(0.025, 0.025, 1.6, M(0xffffff), -0.45, st.yW + 0.7, 0.3, isl, 6); st.flag = box(0.42, 0.26, 0.02, M(0xff5a6a, { side: T.DoubleSide }), -0.24, st.yW + 0.42, 0.3, isl); st.flagY0 = st.flag.position.y;
          if (st.old) { const C = pick([[100, 25], [120, 40], [150, 30], [90, 20]]); st.C = C[0]; st.w = C[1]; st.nStar = Math.floor(st.C / st.w); this.barge(st);
            for (let i = 0; i < 6; i++) { const b = box(0.32, 0.11, 0.15, M(0xffc93a, { metalness: 0.8, roughness: 0.25, emissive: 0x3a2a00 }), -5.9 + (i % 3) * 0.34, st.yD + 0.06 + Math.floor(i / 3) * 0.12, -0.45); void b; }
            tag(t('ph_sg_cap', { c: st.C }), -2.6, st.yW + 1.55, 0, 0.34); tag(t('ph_sg_bar', { w: st.w }), -5.6, st.yD + 0.75, -0.45, 0.32); st.crab = crab(4.35, st.yW + 0.22, 0.55, 0.9); }
          else { st.var = pickVar(st, ['light', 'heavy']); const hv = st.var === 'heavy'; st.list = st.band <= 1 ? (hv ? ['wood', 'mboat'] : ['stone', 'wood']) : (hv ? ['wood', 'stone', 'mboat'] : ['stone', 'wood', 'ball']); this.rafts(st); if (hv) this.chest(st); }
          st.ted = this.teddy(1.3); st.ted.position.set(-4.25, st.yD, 0.45); },
        teddy(sc) { const g = grp(), br = M(0xb07a42, { roughness: 0.8 }); sph(0.2, br, 0, 0.2, 0, g, 16).scale.set(1, 1.1, 0.9); sph(0.16, br, 0, 0.5, 0, g, 16); for (const z of [-0.12, 0.12]) sph(0.06, br, 0, 0.64, z, g, 10); sph(0.07, M(0xe8c89a), 0.13, 0.48, 0, g, 10); sph(0.025, M(0x111111), 0.19, 0.5, 0, g, 6);
          for (const z of [-0.06, 0.06]) sph(0.022, M(0x111111), 0.14, 0.56, z, g, 6); for (const z of [-0.2, 0.2]) sph(0.07, br, 0.02, 0.28, z, g, 10).scale.set(1, 1.6, 1); for (const z of [-0.1, 0.1]) sph(0.08, br, 0.06, 0.04, z, g, 10); g.scale.setScalar(sc || 1); return g; },
        /* safe on the island: a coconut drops from the palm onto Teddy's head — bonk! — then Teddy drinks it with a straw */
        async coconut(st) { const tg = st.ted, top = () => tg.localToWorld(V3(0, 0.8, 0)), co = grp(5.1, st.yW + 2.0, 0); st.trash.push(co); sph(0.13, M(0x6a4a2a, { roughness: 0.9 }), 0, 0, 0, co, 14); for (let i = 0; i < 3; i++) sph(0.025, M(0x2a1a0a), (i - 1) * 0.045, 0.06, 0.12, co, 6);
          snd('whistleDown'); await arcTo(co, () => top().add(V3(0, 0.1, 0)), 0.5, 0.1); snd('boink'); dizzyAt(top, 1.8, 0.22); const r0 = tg.rotation.z; await anim(0.6, q => { tg.rotation.z = r0 + Math.sin(q * 30) * 0.15 * (1 - q); }); tg.rotation.z = r0;
          await arcTo(co, () => tg.localToWorld(V3(0.28, 0.35, 0)), 0.35, 0.2); const sw = cyl(0.012, 0.012, 0.3, M(0xff5a8a), 0, 0.2, 0, co, 6); sw.rotation.z = 0.5; snd('pop'); await wait(0.3); snd('slurp'); await wait(0.6); snd('slurp');
          snd('giggle'); const y0 = tg.position.y; await anim(0.6, q => { tg.position.y = y0 + Math.abs(Math.sin(q * PI * 2)) * 0.12; }); tg.position.y = y0; hearts(top(), 5); await wait(0.6); },
        /* glug… then up pops Teddy in a rubber-duck swim ring, paddles back to the dock (squeak, squeak) and shakes itself dry */
        async duckRing(st) { const tg = st.ted; tg.visible = true; tg.rotation.set(0, 0, 0); tg.position.set(-3.1, st.yW - 0.75, 0.1);
          const ring = grp(0, 0.3, 0, tg), ye = M(0xffd21a, { roughness: 0.35 }), tr = new T.Mesh(new T.TorusGeometry(0.28, 0.09, 10, 24), ye); tr.rotation.x = PI / 2; ring.add(tr); sph(0.1, ye, 0.32, 0.12, 0, ring, 12); cone(0.04, 0.09, M(0xff8a1a), 0.43, 0.11, 0, ring, 6).rotation.z = -PI / 2; for (const zz of [-0.04, 0.04]) sph(0.015, M(0x111111), 0.38, 0.16, zz, ring, 6);
          snd('pop'); await anim(0.35, q => { tg.position.y = st.yW - 0.75 + 0.4 * c.over(q); }); snd('quack');
          const x0 = tg.position.x, pa = anim(1.4, q => { tg.position.x = x0 + (-3.95 - x0) * q; tg.position.y = st.yW - 0.35 + Math.sin(q * 20) * 0.025; tg.rotation.z = Math.sin(q * 16) * 0.12; }); for (let i = 0; i < 3; i++) { await wait(0.4); snd('squeak'); } await pa;
          snd('whee'); await arcTo(tg, V3(-4.25, st.yD, 0.45), 0.45, 0.5); ring.visible = false; tg.rotation.z = 0; snd('squish');
          sprayAt(() => tg.localToWorld(V3(0, 0.5, 0)), 24, [0x6cc0ff, 0xffffff], 0, 0.6, 0.01); await anim(0.6, q => { tg.rotation.y = Math.sin(q * PI * 6) * 0.5; }); tg.rotation.y = 0; await anim(0.25, q => { tg.rotation.y = -1.0 * q; }); await wait(0.6); },
        /* 8+: too heavy — it sinks; up comes a crab holding a gold bar over its head, clacking happily, and down it goes again */
        async crabGold(st, x) { const cb = crab(x, st.yW - 0.5, 0.5, 1.2); st.trash.push(cb.g); const bar = box(0.42, 0.12, 0.2, M(0xffc93a, { metalness: 0.8, roughness: 0.25, emissive: 0x3a2a00 }), 0, 0.42, 0, cb.g); cb.claws[0].position.set(-0.2, 0.32, 0.05); cb.claws[1].position.set(0.2, 0.32, 0.05);
          snd('pop'); await anim(0.4, q => { cb.g.position.y = st.yW - 0.5 + 0.5 * c.over(q); }); snd('clack'); await anim(0.9, q => { cb.g.rotation.z = Math.sin(q * PI * 4) * 0.15; bar.rotation.z = Math.sin(q * PI * 4) * 0.1; }); snd('clack');
          await wait(0.4); snd('glug'); await anim(0.5, q => { cb.g.position.y = st.yW - 0.5 * q; }); },
        /* 8+: it could have carried more — the island crab waves its claws: no, no, more! */
        async crabNo(st) { const cb = st.crab; if (!cb) return; snd('clack'); await anim(0.9, q => { cb.claws[0].rotation.z = 0.6 + Math.sin(q * PI * 6) * 0.5; cb.claws[1].rotation.z = -0.6 - Math.sin(q * PI * 6) * 0.5; cb.g.rotation.y = Math.sin(q * PI * 4) * 0.4; }); cb.g.rotation.y = 0; for (const cl of cb.claws) cl.rotation.z = 0; snd('clack'); await wait(0.6); },
        async crabDance(st) { const cb = st.crab; if (!cb) return; snd('clack'); const x0 = cb.g.position.x, y0 = cb.g.position.y; await anim(1.2, q => { cb.g.position.x = x0 + Math.sin(q * PI * 4) * 0.2; cb.g.position.y = y0 + Math.abs(Math.sin(q * PI * 6)) * 0.08; cb.claws[0].rotation.z = 0.9 + Math.sin(q * 30) * 0.3; cb.claws[1].rotation.z = -0.9 - Math.sin(q * 30) * 0.3; }); cb.g.position.set(x0, y0, cb.g.position.z); for (const cl of cb.claws) cl.rotation.z = 0; snd('clack'); },
        /* the heavy variant's treasure chest, waiting on the dock beside Teddy */
        chest(st) { if (st.chest) drop(st.chest); const g = st.chest = grp(-4.95, st.yD, 0.5), wd = M(0x8a5428, { roughness: 0.8 }), gd = M(0xffc93a, { metalness: 0.7, roughness: 0.3 }); box(0.46, 0.28, 0.32, wd, 0, 0.14, 0, g); cyl(0.16, 0.16, 0.46, wd, 0, 0.28, 0, g, 14).rotation.z = PI / 2;
          for (const x of [-0.17, 0.17]) { box(0.04, 0.3, 0.34, gd, x, 0.15, 0, g); const bd = new T.Mesh(new T.TorusGeometry(0.165, 0.02, 6, 16, PI), gd); bd.position.set(x, 0.28, 0); bd.rotation.y = PI / 2; g.add(bd); } box(0.08, 0.1, 0.03, gd, 0, 0.24, 0.17, g); },
        mask(g, r, y, sx, sz) { const m = new T.Mesh(new T.CircleGeometry(r, 24), new T.MeshBasicMaterial({ colorWrite: false, transparent: true })); m.rotation.x = -PI / 2; m.position.y = y; m.scale.set(sx || 1, sz || 1, 1); m.renderOrder = 1; g.add(m); return m; },   /* keeps the sea from showing inside a hull that floats */
        raft(id) { const g = grp();
          if (id === 'stone') { box(0.95, 0.2, 0.75, M(0x8a8f98, { roughness: 1, flatShading: true }), 0, 0.1, 0, g); g.userData = { sink: true, hy: 0.1, top: 0.2 }; }
          else if (id === 'wood') { for (let i = 0; i < 5; i++) cyl(0.085, 0.085, 0.8, M(i % 2 ? 0xa8743a : 0x9a6a32, { roughness: 0.9 }), -0.34 + i * 0.17, 0.085, 0, g, 10).rotation.x = PI / 2; for (const z of [-0.25, 0.25]) box(0.9, 0.03, 0.05, M(0xe8d0a0), 0, 0.17, z, g); g.userData = { draft: 0.08, top: 0.17 }; }
          else if (id === 'ball') { sph(0.3, M(0x9aa0aa, { metalness: 0.9, roughness: 0.25 }), 0, 0.3, 0, g, 22); g.userData = { sink: true, hy: 0.3, top: 0.6 }; }
          else { const h = new T.Mesh(new T.SphereGeometry(0.55, 24, 12, 0, TAU, PI / 2, PI / 2), M(0x9aa0aa, { metalness: 0.85, roughness: 0.3, side: T.DoubleSide })); h.scale.set(1.4, 0.6, 0.8); h.position.y = 0.33; g.add(h); const rim = new T.Mesh(new T.TorusGeometry(0.55, 0.03, 6, 32), M(0x6a7484, { metalness: 0.8 })); rim.rotation.x = PI / 2; rim.scale.set(1.4, 0.8, 1); rim.position.y = 0.33; g.add(rim); this.mask(g, 0.55, 0.33, 1.4, 0.8); g.userData = { draft: 0.12, top: 0.12 }; }
          g.userData.id = id; return g; },
        rafts(st) { for (const r of st.rf || []) drop(r); st.rf = st.list.map((id, i) => { const r = this.raft(id); r.position.set(-6.0 + i * 0.95, st.yD, -0.3); return r; }); st.chosen = null; },
        barge(st) { if (st.bg) drop(st.bg); const g = grp(-2.6, 0, 0); st.bg = g; const red = M(0xd8343a, { roughness: 0.5 }), wht = M(0xf6f6f2, { roughness: 0.5 }); st.Hh = 0.42; st.d0 = 0.08;
          box(1.6, 0.05, 0.9, red, 0, 0.025, 0, g); for (const z of [-0.43, 0.43]) { box(1.6, st.Hh, 0.04, red, 0, st.Hh / 2, z, g); box(1.6, 0.06, 0.05, wht, 0, st.Hh - 0.03, z, g); } for (const x of [-0.78, 0.78]) { box(0.04, st.Hh, 0.9, red, x, st.Hh / 2, 0, g); box(0.05, 0.06, 0.9, wht, x, st.Hh - 0.03, 0, g); }
          const mk = new T.Mesh(new T.PlaneGeometry(1.52, 0.82), new T.MeshBasicMaterial({ colorWrite: false, transparent: true })); mk.rotation.x = -PI / 2; mk.position.y = st.Hh; mk.renderOrder = 1; g.add(mk);
          st.bars = grp(0, 0.05, 0, g); st.ropes = grp(0, 0, 0, g); for (const z of [-0.3, 0.3]) { const r = cyl(0.015, 0.015, 1.0, M(0xe8d8b0), -1.2, 0, z, st.ropes, 4); r.rotation.z = PI / 2 - 0.25; r.position.y = st.Hh + 0.12; }
          this.load(st, (st.sel && st.sel[0]) || 0, true); },
        draftOf(st, n) { const f = n * st.w / st.C; return f > 1 ? st.Hh + 0.05 : st.d0 + (st.Hh - 0.05 - st.d0) * f; },
        load(st, n, now) { st.n = n; while (st.bars.children.length) drop(st.bars.children[0]); for (let i = 0; i < n; i++) { const L = Math.floor(i / 3), j = i % 3; box(0.42, 0.12, 0.2, M(0xffc93a, { metalness: 0.8, roughness: 0.25, emissive: 0x3a2a00 }), -0.45 + j * 0.45, 0.06 + L * 0.13, L % 2 ? 0.12 : -0.12, st.bars); }
          const y1 = st.yW - this.draftOf(st, n), y0 = st.bg.position.y; if (now) st.bg.position.y = y1; else tween(0.5, k => { st.bg.position.y = y0 + (y1 - y0) * c.over(k); }); },
        rows: st => st.old ? [{ label: t('ph_r_bars'), opts: [1, 2, 3, 4, 5, 6].map(n => ({ v: n, text: String(n) })) }]
          : [{ opts: st.list.map(id => ({ v: id, icon: { stone: SVG.slab, wood: SVG.raft, ball: SVG.ball, mboat: SVG.hull }[id], text: t('ph_' + id) })) }],
        answer: st => [st.old ? st.nStar : (st.var === 'heavy' ? 'mboat' : 'wood')],
        preview(st) { const v = st.sel[0]; if (v == null) return; if (st.old) { if (v !== st.n) { this.load(st, v); snd('thud'); } return; }
          const r = st.rf[st.list.indexOf(v)]; if (st.chosen === r) return; if (st.chosen) { const o = st.chosen, i = st.rf.indexOf(o); glide(o, V3(-6.0 + i * 0.95, st.yD, -0.3), 0.35, 0.3); } st.chosen = r; snd('swish'); glide(r, V3(-4.0, st.yD, 0), 0.45, 0.4); },
        async sail(st, g, to, bob) { const x0 = g.position.x, y0 = g.position.y; let q = 0; snd('whoosh');
          await until(dt => { q += dt / 2.6; const e = K.ease(Math.min(1, q)); g.position.x = x0 + (to - x0) * e; g.position.y = y0 + Math.sin(q * 14) * 0.02; g.rotation.z = Math.sin(q * 11) * 0.03; if (Math.random() < 0.5) { const s = c.sprite(0xffffff, 0.22, g.position.x - 0.7, st.yW + 0.03, R(-0.4, 0.4), demo, 0.8); let k = 0; sims.push(d2 => { k += d2; s.material.opacity = 0.8 * (1 - k / 0.8); s.scale.setScalar(0.22 * (1 + k)); if (k > 0.8) { s.removeFromParent(); s.material.dispose(); return false; } }); } void bob; return q >= 1; }, 5); },
        async run(st, sel) { const v = sel[0];
          if (st.old) { const n = v; st.ropes.visible = false; const g = st.bg;
            if (n * st.w > st.C) { snd('splash'); bubbles(V3(g.position.x, TOP + 0.1, 0), 18, st.yW); snd('glug'); const y0 = g.position.y; await anim(2.2, k => { g.position.y = y0 - (y0 - TOP + 0.05) * k * k; g.rotation.z = 0.25 * k; g.position.x += 0.004; }); camIn(st, g.position.x, st.yW + 0.5, 3.4); await this.crabGold(st, g.position.x); camOut(st); return 'sink'; }
            await this.sail(st, g, 2.9); if (n !== st.nStar) { camIn(st, 3.7, st.yW + 0.6, 3.4); await this.crabNo(st); camOut(st); return 'light'; }
            impact(V3(g.position.x, st.yW + 0.6, 0.3), 0xffc93a, 1); for (let i = 0; i < 10; i++) { const s = glow(0xfff4b0, 0.35, g.position.x + R(-0.7, 0.7), st.yW + R(0.2, 0.6), R(-0.4, 0.4), 0); let q = -i * 0.1; sims.push(dt => { q += dt; if (q < 0) return true; s.material.opacity = Math.max(0, Math.sin(q * 5)) * Math.max(0, 1 - q / 1.8); if (q > 1.8) { s.removeFromParent(); s.material.dispose(); return false; } }); }
            await anim(0.8, k => { st.flag.position.y = st.flagY0 + 0.95 * k; }); yay(); confetti(V3(3.6, 2.4, 0.3), 100, 3, [0xffc93a, 0xffe08a, 0xffffff, 0xff5a6a]); firework(V3(2.2, 2.9, -0.4), 0xffd84a); camIn(st, 3.8, st.yW + 0.6, 3.6); await wait(0.4); firework(V3(4.3, 3.1, -0.4), 0xff7ad0); await this.crabDance(st); await wait(0.4); camOut(st); return 'win'; }
          const r = st.chosen, U = r.userData; demo.attach(r); await glide(r, V3(-3.1, st.yW + 0.1, 0), 0.5, 0.35);
          if (U.sink) { camIn(st, -3.7, st.yW + 0.5, 3.6); const tg = st.ted; demo.attach(tg); snd('whee'); await arcTo(tg, V3(-3.1, st.yW + 0.1 + U.top, 0), 0.5, 0.7);   /* Teddy can't wait: it jumps aboard… */
            splash(V3(-3.1, st.yW, 0), 0.9); snd('glug'); bubbles(V3(-3.1, TOP + 0.2, 0), 16, st.yW); const y0 = r.position.y, t0 = tg.position.y; await anim(1.4, k => { const e = K.ease(k); r.position.y = y0 - (y0 - TOP - 0.02) * e; r.rotation.z = 0.3 * k; tg.position.y = t0 - (t0 - (TOP - 0.3)) * e; });   /* …and down they both go */
            tg.visible = false; await wait(0.5); await this.duckRing(st); camOut(st); return v; }
          splash(V3(-3.1, st.yW, 0), 0.5); r.position.y = st.yW - U.draft; snd('pop');
          /* the heavy chest goes aboard first: the wood raft sinks under it (Teddy jumps on anyway); the metal boat just sits a little lower */
          if (st.var === 'heavy') { const ch = st.chest; demo.attach(ch); snd('swish'); await arcTo(ch, V3(-2.85, r.position.y + U.top, 0.05), 0.45, 0.5); r.attach(ch); snd('thud');
            if (v === 'wood') { camIn(st, -3.7, st.yW + 0.5, 3.6); const tg = st.ted; demo.attach(tg); snd('whee'); await arcTo(tg, V3(-3.3, r.position.y + U.top + 0.02, 0), 0.5, 0.7); r.attach(tg);
              splash(V3(-3.1, st.yW, 0), 0.9); snd('glug'); bubbles(V3(-3.1, TOP + 0.2, 0), 16, st.yW); const y0 = r.position.y; await anim(1.4, k => { r.position.y = y0 - (y0 - TOP + 0.1) * K.ease(k); r.rotation.z = 0.25 * k; });
              demo.attach(tg); tg.visible = false; await wait(0.5); await this.duckRing(st); camOut(st); return v; }
            await anim(0.3, k => { r.position.y = st.yW - U.draft - 0.06 * k; }); }
          const tg = st.ted; demo.attach(tg); await glide(tg, V3(-3.1, r.position.y + U.top + 0.02, 0), 0.5, 0.6); r.attach(tg);
          const mast = grp(0.25, U.top, -0.2, r); cyl(0.022, 0.022, 0.95, M(0x7a5028), 0, 0.47, 0, mast, 6); const sh = new T.Shape(); sh.moveTo(0, 0.12); sh.lineTo(0, 0.9); sh.lineTo(0.55, 0.15); sh.closePath(); const sl = new T.Mesh(new T.ShapeGeometry(sh), M(0xffffff, { side: T.DoubleSide, roughness: 0.8 })); sl.position.set(0.03, 0, 0); mast.add(sl);
          mast.scale.setScalar(0.01); await anim(0.35, k => mast.scale.setScalar(Math.max(0.01, c.over(k)))); await this.sail(st, r, 3.4);
          demo.attach(tg); await glide(tg, V3(4.6, st.yW + 0.42, 0.1), 0.5, 0.6); await anim(0.8, k => { st.flag.position.y = st.flagY0 + 0.95 * k; });
          impact(V3(4.6, st.yW + 0.8, 0.3), 0xffd84a, 1); yay(); confetti(V3(4.4, 2.4, 0.3), 100, 3); firework(V3(3.2, 2.8, -0.4), 0xffd84a); camIn(st, 4.7, st.yW + 0.95, 3.4); await wait(0.4); firework(V3(5.4, 3.0, -0.4), 0x4ab0ff); await this.coconut(st); camOut(st); return 'win'; },
        async reset(st) { if (st.old) { st.flag.position.y = st.flagY0; this.barge(st); } else { this.rafts(st); if (st.var === 'heavy') this.chest(st); drop(st.ted); st.ted = this.teddy(1.3); st.ted.position.set(-4.25, st.yD, 0.45); } puff(V3(-4.4, st.yD + 0.4, 0.3), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- 9. the Penguin Express: a machine of four rules (8+) */
      /* Yoni 2026-10-07: 'for eight and above … combinations of multiple physics rules … more complicated to succeed … not just one thing
         which ends in a few seconds'. One long run through four rules the child has met one at a time. The start height is ENERGY: it has to
         carry the cart round the loop (friction takes a tenth, so 0.9 × start > loop top) and it sets the speed at the bottom (2, 3, 4, 5 m →
         6, 7, 8, 9 m/s, on the tiles). At the end of the track a stopper halts the cart, but the penguin keeps going: INERTIA. Off the cliff it
         is in the air for one second, so it flies as many metres as its speed: SPEED. It lands on its belly keeping half its speed and slides on
         the ground the child picked until FRICTION stops it (ice 0.1, snow 0.25, sand 0.5, as in the friction experiment); it has to stop at
         the fish. Every visit draws a new loop, river and fish, always with one or two right answers, and every stage fails in its own funny way */
      const SPD = { 2: 6, 3: 7, 4: 8, 5: 9 };
      CH.express = { go: 'ph_go_roll', S: 0.4, XS: -6.1, XV: -4.6, XC: -3.6, xe: -1.9, PSC: 0.56, hintAfter: 3,
        view: st => ({ x0: -6.5, x1: 6.5, y0: 0, y1: st.yL + 2.9, pitch: 0.16 }),
        lines: () => ({ in: 'pv_x_in', win: 'pv_x_win', fail: { loop: 'pv_x_loop', river: 'pv_x_river', short: 'pv_x_short', long: 'pv_x_long' } }),
        stopAt(st, h, k) { const v = SPD[h]; return (v - st.W) + (v / 2) * (v / 2) / (2 * CH.friction.MU[k] * 9.8); },   /* where it stops: metres past the far bank */
        outcome(st, h, k) { if (0.9 * h <= st.top) return 'loop'; if (SPD[h] < st.W) return 'river'; const d = this.stopAt(st, h, k); return d > st.F + 0.6 ? 'long' : d < st.F - 0.6 ? 'short' : 'win'; },
        /* a loop, a river and a fish the child did not just have; a fish only where every miss stops well clear of it */
        setup(st) { const vs = S.mine ? (S.mine.vars = S.mine.vars || {}) : {}, all = [];
          for (const top of [2.5, 3]) for (const W of [6, 7, 8]) { const o0 = { top, W }, stops = [];
            for (const h of [2, 3, 4, 5]) for (const k of ['ice', 'snow', 'sand']) { if (0.9 * h <= top || SPD[h] < W) continue; const d = this.stopAt(o0, h, k); if (d <= 8.4) stops.push([d, h, k]); }
            for (const [d] of stops) { const F = Math.round(d * 2) / 2; if (F < 1 || all.some(o => o.top === top && o.W === W && o.F === F)) continue; const win = stops.filter(s => Math.abs(s[0] - F) <= 0.6), gap = Math.min(9, ...stops.filter(s => Math.abs(s[0] - F) > 0.6).map(s => Math.abs(s[0] - F)));
              if (win.length && gap >= 1.1) all.push({ top, W, F, ans: [win[0][1], win[0][2]] }); } }
          const key = o => o.top + ':' + o.W + ':' + o.F + ':' + o.ans.join(''), last = String(vs.express || ''), fresh = all.filter(o => key(o) !== last && o.ans.join('') !== last.split(':')[3]), o = pick(fresh.length ? fresh : all); vs.express = key(o); Object.assign(st, o); },
        /* the camera rides along: the coaster, then the river and the far bank, then it follows the slide (a camIn for the joke, camOut back to all of it) */
        shot(st, x0, x1, y0, y1) { if (!st.v0) st.v0 = S.view; const w = x1 - x0, a = clamp(x0, -6.5, 6.5 - w); S.view = { x0: a, x1: a + w, y0, y1, pitch: 0.16 }; },
        build(st) { const S0 = this.S, xe = this.xe; this.setup(st); st.yW = TOP + 0.12; st.yR = TOP + 0.32; st.yL = st.yR + 4.9 * S0; st.V = st.yL + 0.1; st.R = st.top * S0 / 2; st.xr = xe + st.W * S0; st.hm = 3; st.h = st.V + st.hm * S0; S.pl = { x0: -6.5, x1: 6.5, z: 1.25 };
          /* the cliff with the coaster on top, the river, and the low far bank (it falls 4.9 m in its one second in the air) */
          const rock = M(0x9a7a5a, { roughness: 0.95, flatShading: true }), grass = M(0x6ac04a, { roughness: 0.9 });
          box(xe + 6.5, st.yL, 2.4, rock, (xe - 6.5) / 2, st.yL / 2, 0); box(xe + 6.5 + 0.02, 0.08, 2.42, grass, (xe - 6.5) / 2, st.yL, 0); box(6.5 - st.xr, st.yR, 2.4, rock, (st.xr + 6.5) / 2, st.yR / 2, 0);
          const wm = new T.MeshStandardMaterial({ color: 0x3a9ae0, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.1 }); box(st.xr - xe, st.yW, 2.4, wm, (xe + st.xr) / 2, st.yW / 2, 0);
          for (let i = 0; i < 6; i++) { const s = glow(0xffffff, 0.2, R(xe + 0.2, st.xr - 0.2), st.yW + 0.02, R(-1, 1), 0.6); let k0 = R(0, 6); sims.push(dt => { k0 += dt * 2; s.material.opacity = 0.3 + 0.3 * Math.sin(k0); return true; }); }
          for (let i = 1; i <= 10; i++) box(0.025, 0.012, i % 2 ? 0.14 : 0.26, M(0x4a5060), st.xr + i * S0, st.yR + 0.056, 0.85);   /* a mark every metre past the bank */
          this.ground(st, null); this.track(st); this.cart(st);
          /* the stopper at the end of the track: red and white, on a spring */
          st.stopper = grp(xe - 0.05, st.V, 0.35); box(0.12, 0.3, 0.5, texM(tex(16, 32, (g2, w, h) => { for (let i = 0; i < 4; i++) { g2.fillStyle = i % 2 ? '#ffffff' : '#e8303a'; g2.fillRect(0, i * h / 4, w, h / 4); } })), 0, 0.15, 0, st.stopper); cyl(0.04, 0.04, 0.3, M(0x9aa0aa, { metalness: 0.7, roughness: 0.3 }), 0.12, 0.12, 0, st.stopper, 8).rotation.z = PI / 2;
          this.bucket(st); this.snowman(st);
          st.signs = [tag(t('ph_sg_loop', { h: st.top }), this.XC, st.V + 2 * st.R + 0.65, -0.4, 0.5), tag(t('ph_sg_river', { w: st.W }), (xe + st.xr) / 2 + 0.3, st.yL + 1.0, -0.6, 0.5), tag(t('ph_m', { n: st.F }), st.bx, st.yR + 1.1, -0.42, 0.52)]; },   /* the numbers to reason with: big enough to read on a phone */
        /* the signs step aside while the camera leans in on a joke, and come back for Owl's lesson */
        signs(st, on) { for (const s of st.signs || []) s.visible = on; },
        lean(st, x, y, w) { this.signs(st, false); camIn(st, x, y, w); },
        back(st) { this.signs(st, true); camOut(st); },
        path(st) { const P = [], V = st.V, R = st.R, h = st.h, add = (x, y, z) => P.push(V3(x, y, z)), XB = this.xe - 0.35;
          for (let x = this.XS - 0.5; x < this.XS; x += 0.05) add(x, h, -0.35);
          for (let i = 0; i <= 60; i++) { const u = i / 60, x = this.XS + (this.XV - this.XS) * u; add(x, V + (h - V) * (1 + Math.cos(PI * u)) / 2, -0.35); }
          for (let x = this.XV + 0.05; x < this.XC; x += 0.05) add(x, V, -0.35);
          const nl = Math.ceil(TAU * R / 0.05); st.loop0 = P.length; for (let i = 0; i <= nl; i++) { const f = i / nl * TAU; add(this.XC + R * Math.sin(f), V + R - R * Math.cos(f), -0.35 + 0.7 * i / nl); } st.loop1 = P.length;
          for (let x = this.XC + 0.05; x <= XB; x += 0.05) add(x, V, 0.35);
          const S0 = [0]; for (let i = 1; i < P.length; i++) S0.push(S0[i - 1] + P[i].distanceTo(P[i - 1])); st.P = P; st.S = S0; st.sTop = S0[Math.round((st.loop0 + st.loop1) / 2)]; st.sEnd = S0[S0.length - 1]; },
        track(st) { if (st.trk) drop(st.trk); st.trk = grp(); this.path(st); const P = st.P, red = M(0xe8303a, { metalness: 0.4, roughness: 0.35 }), dark = M(0x4a4f58);
          for (const dz of [-0.15, 0.15]) { const crv = new T.CatmullRomCurve3(P.map(p => V3(p.x, p.y, p.z + dz))); st.trk.add(new T.Mesh(new T.TubeGeometry(crv, P.length, 0.035, 6, false), red)); }
          for (let s = 0; s < st.sEnd; s += 0.26) { const { p, t: tg } = CH.energy.at(st, s), b = box(0.06, 0.03, 0.42, dark, p.x, p.y - 0.02, p.z, st.trk); b.rotation.z = Math.atan2(tg.y, tg.x); }
          for (let i = 0; i < P.length; i += 12) { const p = P[i]; if (i > st.loop0 && i < st.loop1) continue; if (p.y > st.yL + 0.08) cyl(0.025, 0.025, p.y - st.yL, M(0xb8bcc8), p.x, st.yL + (p.y - st.yL) / 2, p.z, st.trk, 6); }
          const tw = st.h - st.yL; box(0.7, tw, 0.9, M(0xb48cff, { roughness: 0.7 }), this.XS - 0.25, st.yL + tw / 2 - 0.02, -0.35, st.trk); cyl(0.015, 0.015, 0.6, M(0xffffff), this.XS - 0.5, st.h + 0.3, -0.35, st.trk, 4); box(0.3, 0.18, 0.01, M(0xffd84a), this.XS - 0.35, st.h + 0.5, -0.35, st.trk); },
        /* the energy coaster's cart, with a bigger penguin aboard: it is the star of a long run */
        cart(st) { CH.energy.cart(st); st.rider.sc = this.PSC; st.rider.g.scale.setScalar(this.PSC); },
        /* the far bank's ground: grass until the child picks ice, snow or sand */
        ground(st, k) { if (st.groundK === k && st.gnd) return; st.groundK = k; const m = k === 'ice' ? M(0xbfe9ff, { roughness: 0.05, metalness: 0.25 }) : k === 'snow' ? M(0xffffff, { roughness: 1 }) : k === 'sand' ? texM(tex(64, 64, (g2, w, h) => { g2.fillStyle = '#e8c98a'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#c8a060'; for (let i = 0; i < 160; i++) g2.fillRect(Math.random() * w, Math.random() * h, 2, 2); }, [8, 2]), { roughness: 1 }) : M(0x6ac04a, { roughness: 0.9 });
          if (st.gnd) { const o = st.gnd.material; if (o.map && o.userData.own) o.map.dispose(); o.dispose(); st.gnd.material = m; } else st.gnd = box(6.5 - st.xr + 0.02, 0.05, 2.42, m, (st.xr + 6.5) / 2, st.yR + 0.025, 0); },
        /* the fish bucket, just behind the lane where the penguin should stop */
        bucket(st) { if (st.bk) drop(st.bk); st.bx = st.xr + st.F * this.S + 1.1 * this.PSC; const g = st.bk = grp(st.bx, st.yR + 0.05, -0.42); cyl(0.17, 0.13, 0.24, M(0xe8303a, { roughness: 0.5 }), 0, 0.12, 0, g, 18); cyl(0.155, 0.155, 0.02, M(0x2a6aa8), 0, 0.23, 0, g, 18); st.fish = [];
          for (let i = 0; i < 3; i++) { const f = CH.friction.fishMesh(0.95); g.add(f); f.position.set(R(-0.05, 0.05), 0.3, R(-0.05, 0.05)); f.rotation.z = R(-0.5, 0.5); st.fish.push(f); } },
        /* at the end of the bank a snowman in a top hat: what a penguin going far too fast runs into */
        snowman(st) { if (st.snow) drop(st.snow); const g = st.snow = grp(st.xr + 9.6 * this.S + 1.1 * this.PSC + 0.34, st.yR + 0.05, 0), wh = M(0xffffff, { roughness: 0.9 }), blk = M(0x1e1e24, { roughness: 0.6 }); g.rotation.y = PI;
          st.smBody = grp(0, 0, 0, g); sph(0.34, wh, 0, 0.3, 0, st.smBody, 18); sph(0.25, wh, 0, 0.78, 0, st.smBody, 16); for (let i = 0; i < 3; i++) sph(0.03, blk, 0.24 - i * 0.02, 0.62 + i * 0.12, 0, st.smBody, 6);
          for (const s of [-1, 1]) { const arm = cyl(0.016, 0.016, 0.42, M(0x6a4a2a), 0, 0.88, s * 0.32, st.smBody, 4); arm.rotation.x = s * 1.1; }
          const hd = st.smHead = grp(0, 1.15, 0, g); sph(0.18, wh, 0, 0, 0, hd, 16); cone(0.035, 0.2, M(0xff8a1a, { roughness: 0.5 }), 0.24, -0.01, 0, hd, 8).rotation.z = -PI / 2; for (const z of [-0.07, 0.07]) sph(0.025, blk, 0.15, 0.06, z, hd, 6);
          st.smHat = grp(0, 0.14, 0, hd); cyl(0.2, 0.2, 0.02, blk, 0, 0, 0, st.smHat, 18); cyl(0.12, 0.13, 0.2, blk, 0, 0.11, 0, st.smHat, 14); cyl(0.13, 0.13, 0.04, M(0xe8303a), 0, 0.04, 0, st.smHat, 14); },
        rows: st => [{ label: t('ph_r_start'), opts: [2, 3, 4, 5].map(h => ({ v: h, icon: SVG.level((h - 2) / 3), text: t('ph_m', { n: h }), sub: t('ph_ms', { n: SPD[h] }) })) },
          { label: t('ph_r_ground'), opts: ['ice', 'snow', 'sand'].map(k => ({ v: k, icon: { ice: 'icecube', snow: 'snowflake', sand: 'desert' }[k], text: t('ph_' + k) })) }],
        answer: st => st.ans.slice(),
        preview(st) { const hm = st.sel[0], k = st.sel[1]; if (k) this.ground(st, k); if (hm != null && hm !== st.hm) { st.hm = hm; st.h = st.V + hm * this.S; this.track(st); CH.energy.place(st, 0.4); snd('swish'); } },
        /* from lying on its belly onto its feet, a little further on (its body was lying ahead of its feet) */
        standUp(st) { const p = st.rider, g = p.g, x0 = g.position.x, y0 = g.position.y, base = st.yR + 0.05; return anim(0.4, q => { g.rotation.z = -PI / 2 * (1 - q); g.position.x = x0 + 0.63 * p.sc * q; g.position.y = y0 + (base - y0) * q + Math.sin(PI * q) * 0.06; }); },
        /* too slow for the river: SPLASH. Up it pops, spouts water like a fountain, and a fish leaps out, slaps its face and dives home */
        async river(st) { const p = st.rider, g = p.g, x = g.position.x, yb = st.yW - 0.18; this.lean(st, x + 0.3, st.yW + 0.55, 2.4);
          splash(V3(x, st.yW, 0), 1.0); shake(0.05); g.visible = false; await wait(0.35);
          g.rotation.set(0, 0, 0); g.position.set(x, yb - 0.4, 0); g.visible = true; snd('pop'); await anim(0.2, q => { g.position.y = yb - 0.4 + 0.4 * K.ease(q); });
          let bob = true, q0 = 0; sims.push(dt => { if (!bob || !g.parent) return false; q0 += dt; g.position.y = yb + Math.sin(q0 * 3) * 0.02; for (const f of p.fl) f.rotation.x = Math.sin(q0 * 9) * 0.5; return true; });
          await anim(0.15, q => { p.head.rotation.z = 0.7 * q; }); snd('spout'); sprayAt(() => pg.beak(p), 30, [0x2f8de0, 0x6cc0ff, 0xffffff], 0, 0.8); await wait(0.85); await anim(0.15, q => { p.head.rotation.z = 0.7 * (1 - q); });
          const fish = CH.friction.fishMesh(1.0), top = () => pg.top(p).add(V3(0, 0.05, 0)), f0 = V3(x + 0.45, st.yW, 0.45); st.trash.push(fish); fish.position.copy(f0); splash(f0, 0.3); snd('whistleUp');
          await anim(0.5, q => { fish.position.lerpVectors(f0, top(), q); fish.position.y += Math.sin(PI * q) * 0.7; fish.rotation.z = PI / 2 + (1 - q) * TAU; }); fish.rotation.z = PI / 2; snd('boing');
          let on = true; sims.push(() => { if (!on || !fish.parent) return false; fish.position.copy(top()); return true; });
          for (let i = 0; i < 2; i++) { await anim(0.12, q => { fish.rotation.z = PI / 2 - 0.75 * q; }); snd('slap'); pg.blink(p); p.head.rotation.z = -0.25; await anim(0.18, q => { fish.rotation.z = PI / 2 - 0.75 * (1 - q); p.head.rotation.z = -0.25 * (1 - q); }); }
          on = false; const f1 = fish.position.clone(), f2 = V3(x - 0.4, st.yW - 0.05, 0.4); snd('whistleDown'); await anim(0.42, q => { fish.position.lerpVectors(f1, f2, q); fish.position.y += Math.sin(PI * q) * 0.6; fish.rotation.z = PI / 2 + q * TAU * 0.75; }); fish.visible = false; splash(f2, 0.3);
          await pg.look(p); snd('honkSad'); pg.blink(p, 2); await wait(0.7); bob = false; this.back(st); return 'river'; },
        /* stopped short: it gets up, leans and stretches its flippers for the fish (so near!), and a fish jumps up, bonks its beak and dives back
           into the bucket; down it plops on its bottom, seeing stars */
        async short(st) { const p = st.rider, g = p.g; this.lean(st, (g.position.x + st.bx) / 2 + 0.2, st.yR + 0.5, Math.max(2.4, st.bx - g.position.x + 1.4)); await this.standUp(st); await wait(0.15);
          snd('squeak'); await anim(0.5, q => { const e = K.ease(q); g.rotation.z = -0.35 * e; p.fl[0].rotation.x = 1.6 * e; p.fl[1].rotation.x = -1.6 * e; p.fl[0].rotation.z = p.fl[1].rotation.z = 1.2 * e; });
          await anim(0.5, q => { g.rotation.z = -0.35 - Math.sin(q * PI * 4) * 0.05; }); snd('squeak');
          const f = st.fish[0]; demo.attach(f); st.trash.push(f); const a = f.position.clone(), b = () => pg.beak(p).add(V3(0.05, 0.08, 0)); snd('boing');
          await anim(0.32, q => { f.position.lerpVectors(a, b(), q); f.position.y += Math.sin(PI * q) * 0.35; f.rotation.z = q * 7; }); snd('boink'); shake(0.03); pg.dizzy(p, 1.8);
          const c0 = f.position.clone(), back = anim(0.32, q => { f.position.lerpVectors(c0, a, q); f.position.y += Math.sin(PI * q) * 0.35; f.rotation.z = 7 + q * 5; });
          const y0 = g.position.y; await anim(0.35, q => { const e = K.ease(q); g.rotation.z = -0.35 + 0.6 * e; g.position.y = y0 - 0.06 * e; for (const fl of p.fl) fl.rotation.z = 1.2 * (1 - e); p.fl[0].rotation.x = 1.6 * (1 - e); p.fl[1].rotation.x = -1.6 * (1 - e); });
          await back; snd('squish'); await pg.squash(p, 1.2); await wait(0.3); snd('honkSad'); pg.blink(p, 2); await wait(0.8); this.back(st); return 'short'; },
        /* slid right past the fish: it gets up and turns round. On sand its shoulders just drop; on ice or snow it hurries back for the fish,
           its feet shoot out from under it, and it whizzes right past the bucket the other way */
        async past(st, k) { const p = st.rider, g = p.g; this.lean(st, (g.position.x + st.bx) / 2 - 0.3, st.yR + 0.45, Math.max(2.6, g.position.x - st.bx + 3.0)); await this.standUp(st);
          snd('squeak'); await anim(0.32, q => { g.rotation.y = PI * K.ease(q); }); await wait(0.15);
          if (k === 'sand') { snd('honkSad'); await anim(0.35, q => { const e = K.ease(q); g.scale.set(p.sc, p.sc * (1 - 0.1 * e), p.sc); p.head.rotation.z = -0.35 * e; for (const f of p.fl) f.rotation.x = -0.25 * e; }); await wait(0.6); this.back(st); return 'long'; }
          snd('honk'); const x0 = g.position.x; await anim(0.45, q => { g.position.x = x0 - 0.3 * q; g.rotation.z = Math.sin(q * PI * 4) * 0.15; for (const f of p.fl) f.rotation.x = Math.sin(q * 30) * 0.5; });
          const x1 = g.position.x, y0 = g.position.y, ly = st.yR + 0.05 + 0.37 * p.sc; snd('whistleUp');
          await anim(0.3, q => { g.rotation.z = -PI / 2 * q; g.position.y = y0 + (ly - y0) * q + Math.sin(PI * q) * 0.25; }); snd('squish'); shake(0.03);   /* turned round, 'forwards' is towards the bucket */
          snd('zip'); const x2 = st.bx - 1.0; await anim(1.0, q => { g.position.x = x1 + (x2 - x1) * (1 - (1 - q) * (1 - q)); for (const f of p.fl) f.rotation.x = Math.sin(q * 40) * 0.5 * (1 - q); });
          await wait(0.25); snd('honkSad'); pg.blink(p, 2); await wait(0.8); this.back(st); return 'long'; },
        /* far too fast: SMACK into the snowman. Its body bursts, its head spins up, and down it comes onto the penguin, carrot, top hat and all */
        async snowCrash(st) { const p = st.rider, g = p.g, sm = st.snow; this.lean(st, sm.position.x - 0.5, st.yR + 0.7, 2.6);
          snd('crash'); impact(V3(sm.position.x - 0.25, st.yR + 0.45, 0.3), 0xffffff, 0.8); puff(V3(sm.position.x - 0.1, st.yR + 0.4, 0.2), 0xffffff, 16, 0.4, 1.4, 1.0); st.smBody.visible = false;
          const balls = []; for (let i = 0; i < 7; i++) { const b = sph(R(0.07, 0.13), M(0xffffff, { roughness: 0.9 }), sm.position.x + R(-0.2, 0.2), st.yR + R(0.25, 0.8), R(-0.25, 0.25)); b.userData.hy = 0.08; balls.push(b); } st.trash.push(...balls); fling(balls, V3(sm.position.x - 0.3, st.yR + 0.3, 0), 2.6, st.yR + 0.05, { lift: 0.8, dir: 0.4 });
          const hd = st.smHead; demo.attach(hd); const h0 = hd.position.clone(); snd('whistleUp'); const up = anim(0.6, q => { hd.position.set(h0.x - 0.15 * q, h0.y + Math.sin(PI * q * 0.5) * 0.9, h0.z); hd.rotation.z = q * TAU; });
          await this.standUp(st); pg.dizzy(p, 1.4); await up; snd('whistleDown');
          await arcTo(hd, () => pg.top(p).add(V3(0, 0.06, 0)), 0.35, 0.15); snd('boink'); shake(0.04); p.head.attach(hd); hd.position.set(0, 0.02, 0); hd.rotation.set(0, 0, 0);
          pg.wobble(p, 1.2, 0.2); snd('mmf'); await wait(0.8); await anim(0.3, q => { st.smHat.rotation.z = -0.9 * K.ease(q); }); snd('plink'); await wait(0.3); snd('honkSad'); await wait(0.8); this.back(st); return 'long'; },
        /* right at the fish: up it gets, the fish jumps into its beak, GULP, its belly swells, a hiccup bubble pops, and the weird happy dance */
        async win(st) { const p = st.rider, g = p.g; this.lean(st, g.position.x + 0.3, st.yR + 0.55, 2.4); await this.standUp(st);
          const f = st.fish[0]; demo.attach(f); const a = f.position.clone(), s0 = f.scale.x; snd('boing');
          await anim(0.5, q => { f.position.lerpVectors(a, pg.beak(p).add(V3(0.03, 0.01, 0)), q); f.position.y += Math.sin(PI * q) * 0.6; f.rotation.z = q * 9; f.scale.setScalar(s0 * (1 + 0.35 * q)); });
          await anim(0.1, q => { f.scale.setScalar(s0 * 1.35 * (1 - 0.9 * q)); }); f.visible = false; snd('gulp');
          await anim(0.5, q => { p.head.scale.setScalar(1 + 0.3 * Math.sin(PI * Math.min(1, q * 2.2))); const b = Math.sin(PI * Math.max(0, q - 0.3) / 0.7 * 0.5); p.belly.scale.set(0.95 * (1 + 0.45 * b), 1.22 * (1 + 0.12 * b), 0.8 * (1 + 0.3 * b)); }); p.head.scale.setScalar(1);
          snd('hic'); const bp = pg.beak(p), bub = new T.Mesh(new T.SphereGeometry(0.08, 16, 12), new T.MeshStandardMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.3 })); bub.position.copy(bp); demo.add(bub); c.sprite(0xffffff, 0.06, -0.025, 0.03, 0.06, bub, 0.9);
          await anim(0.7, q => { bub.position.set(bp.x + q * 0.15 + Math.sin(q * 12) * 0.02, bp.y + q * 0.55, bp.z); bub.scale.setScalar(1 + q * 0.9); }); bub.visible = false; snd('pop'); puff(bub.position.clone(), 0xffffff, 6, 0.12, 0.5, 0.3);
          hearts(V3(g.position.x, st.yR + 0.9, 0), 6); yay(); confetti(V3(g.position.x, st.yR + 1.1, 0.3), 90, 2.6); firework(V3(g.position.x - 1.0, st.yR + 2.4, -0.4), 0x9ad0ff);
          await pg.laugh(p); p.belly.scale.set(0.95, 1.22, 0.8); firework(V3(g.position.x + 0.8, st.yR + 2.6, -0.4), 0xff7ad0); await wait(0.6); this.back(st); await wait(0.6); return 'win'; },
        async run(st, sel) { const hm = sel[0], k = sel[1], p = st.rider, S0 = this.S;
          /* 1. ENERGY: the energy coaster's own rule (a tenth lost to friction by the top of the loop) */
          S.ui = 0.06; this.shot(st, -6.5, -0.4, st.yL - 0.7, st.h + 0.8);   /* the tiles are away while it runs: the camera can use their room */
          const g6 = 6, hEff = st.h, kf = 0.1 * g6 * (hEff - st.V) / st.sTop; let kk = kf, Ls = 0, s = 0.4, dir = 1, tm = 0, over = false, gasped = false, wheee = false, res = null; snd('zoom');
          await until(dt => { tm += dt; const y = CH.energy.at(st, s).p.y, E = g6 * (hEff - y) - Ls; let v = Math.sqrt(Math.max(0, 2 * E)) + 0.35 * Math.max(0, 1 - tm);
            if (v < 0.06) { const yA = CH.energy.at(st, s + dir * 0.02).p.y; if (yA > y) { dir = -dir; kk = kf * 16; if (!gasped) { gasped = true; snd('gasp'); pg.flippersUp(p, 0); for (const e of p.eyes) e.scale.setScalar(1.5); } } v = 0.06; }
            if (!wheee && dir > 0 && s > st.sTop - 0.6 && s < st.sTop) { wheee = true; snd('whee'); pg.flippersUp(p, 1); }
            s += dir * v * dt; Ls += kk * v * dt; s = clamp(s, 0.4, st.sEnd); CH.energy.place(st, s); if (s > st.sTop + 0.3) over = true;
            if (over && s >= st.sEnd - 0.005) { res = 'stop'; return true; }
            if (!over && tm > 3 && v < 0.3 && Math.abs(y - st.V) < 0.05 && E < 0.2) { res = 'loop'; return true; } return tm > 14; }, 16);
          if (res !== 'stop') { const cp = st.cartG.position; this.lean(st, cp.x, cp.y + 0.4, 2.4); await CH.energy.seasick(st); this.back(st); return 'loop'; }
          /* 2. INERTIA: the stopper halts the cart, the penguin keeps going */
          const v = SPD[hm]; snd('clack'); snd('thud'); impact(V3(this.xe - 0.05, st.V + 0.25, 0.45), 0xffd84a, 0.8); anim(0.25, q => { st.stopper.scale.x = 1 - 0.4 * Math.sin(PI * q); });
          demo.attach(p.g); pg.flippersUp(p, 1); for (const e of p.eyes) e.scale.setScalar(1.4); snd('whee'); const sp = tag(t('ph_ms', { n: v }), this.xe - 0.6, st.yL + 1.3, 0.35, 0.5);
          this.shot(st, this.xe - 1.4, this.xe + 5.6, st.yR - 0.5, st.yL + 1.6);
          /* 3. SPEED: one second in the air (it falls 4.9 m), so it flies v metres */
          const x0 = p.g.position.x, y0 = p.g.position.y, z0 = p.g.position.z, xl = this.xe + v * S0, yl = st.yR + 0.05 + 0.37 * p.sc; let ft = 0, wet = false;
          await until(dt => { ft += dt; let x = x0 + (xl - x0) * ft; const y = y0 + (yl - y0) * ft * ft;
            if (ft >= 1 && xl >= st.xr - 0.02) { p.g.position.set(xl, yl, 0); p.g.rotation.z = -PI / 2; return true; }
            if (ft >= 1) { if (x > st.xr - 0.12) x = st.xr - 0.12; if (y <= st.yW) { p.g.position.set(x, st.yW, 0); wet = true; return true; } }   /* short of the far bank: on down into the river */
            p.g.position.set(x, y, z0 * (1 - Math.min(1, ft))); p.g.rotation.z = -PI / 2 * Math.min(1, ft * 1.6); return false; }, 4);
          untag(sp); for (const e of p.eyes) e.scale.setScalar(1);
          if (wet) return this.river(st);
          /* 4. FRICTION: it keeps half its speed on landing, and the ground takes the rest */
          const gc = { ice: 0xd8f0ff, snow: 0xffffff, sand: 0xd2a560 }[k]; snd('thud'); snd('squish'); shake(0.04); puff(V3(xl + 0.2, st.yR + 0.12, 0), gc, 10, 0.35, 1.2, 0.6);
          const d = this.stopAt(st, hm, k), crash = d > 9.6, lim = st.xr + Math.min(d, 9.6) * S0, a = CH.friction.MU[k] * 9.8; let x = xl, u = v / 2, tt = 0;
          snd(k === 'ice' ? 'zip' : k === 'sand' ? 'scratch' : 'slide');
          await until(dt => { tt += dt; u = Math.max(0, u - a * dt); x = Math.min(lim, x + u * S0 * dt); p.g.position.x = x; p.g.rotation.z = -PI / 2 + Math.sin(tt * 9) * 0.03; for (const f of p.fl) f.rotation.x = Math.sin(tt * 22) * 0.5 * Math.min(1, u / 2);
            if (x > st.xr + 1.5) this.shot(st, x - 3.2, x + 2.6, st.yR - 0.5, st.yR + 2.4);
            if (Math.random() < 0.3) { if (k === 'ice') { const s2 = glow(0xffffff, 0.2, x - 0.1, st.yR + 0.1, R(-0.3, 0.3), 0.8); let q2 = 0; sims.push(d2 => { q2 += d2; s2.material.opacity = Math.max(0, 0.8 * (1 - q2 / 0.5)); if (q2 > 0.5) { s2.removeFromParent(); s2.material.dispose(); return false; } }); } else puff(V3(x - 0.05, st.yR + 0.1, R(-0.2, 0.2)), gc, 1, 0.2, 0.4, 0.3); }
            return u <= 0 || x >= lim; }, 12);
          p.g.position.x = lim; p.g.rotation.z = -PI / 2; for (const f of p.fl) f.rotation.x = 0;
          if (crash) return this.snowCrash(st);
          const r = this.outcome(st, hm, k); return r === 'win' ? this.win(st) : r === 'short' ? this.short(st) : this.past(st, k); },
        async reset(st) { drop(st.rider.g); this.cart(st); this.bucket(st); this.snowman(st); st.stopper.scale.x = 1; puff(V3(this.XS, st.h + 0.4, 0), 0xffffff, 8, 0.5, 1, 0.5); snd('pop'); await wait(0.4); } };
      /* ---------------------------------------------------------------- the visit */
      /* the camera fits each diorama between the sign at the top and the tiles at the bottom (a phone gets a narrower, taller fit) */
      function frame(a) { const v = S.view || { x0: -6, x1: 6, y0: 0, y1: 5 }, nar = a < 1.05, fov = nar ? 56 : 44, th = Math.tan(fov * PI / 360);
        const top = nar ? 0.3 : 0.27, bot = 0.13 + (S.ui == null ? 0.13 : S.ui), band = Math.max(0.3, 1 - top - bot), mid = top + band / 2;   /* the clear band between the sign and the tiles (measured) */
        const w = v.x1 - v.x0, h = v.y1 - v.y0, D = Math.max((h / band) / (2 * th), (w / (nar ? 0.96 : 0.9)) / (2 * th * a))   /* the whole diorama always fits: its far ends are part of the story */, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2, ly = cy + (mid - 0.5) * 2 * D * th;
        return { pos: [cx, ly + D * (v.pitch || 0.12), D], look: [cx, ly, 0], fov }; }
      async function play(api) { K.mount(api); mountUI(); S.band = clamp(api.band || 2, 1, 6); window.__physics = { S, CH, sims, run: runChallenge, say };
        const st = KQ.state(); st.physics = st.physics || {}; const pid = api.pid || 'guest', mine = st.physics[pid] = st.physics[pid] || { next: 0 };
        S.mine = mine; const base = S.band, lvl = () => clamp(Math.max(base, mine.lvl || 0), 1, 6); S.band = lvl();
        let N = 3; const done = []; api.pips(N, done); let pick = null;
        const show = () => board(mine, i => { pick = i; if (K.skipAct) K.skipAct(); }, { band: S.band, base, set: d => { mine.lvl = clamp(S.band + d, base, 6); S.band = lvl(); KQ.save(); show(); } });
        const nm = t('ag_physics'); await K.intro(async () => { await say(nm, 'pv_hi'); show(); await K.act(t('ph_start')); });
        UI.root.hidden = true; UI.root.replaceChildren(); if (!K.alive()) return;
        /* a machine is a visit of its own: one long run of several rules, in place of three short challenges */
        const mach = typeof pick === 'string' ? pick : null; if (pick != null && !mach) mine.next = pick; const list = [];
        if (mach) { list.push(mach); N = 1; api.pips(N, done); } else for (let i = 0; i < N; i++) list.push(LESSONS[(mine.next + i) % LESSONS.length]);
        let right = 0; for (let i = 0; i < N; i++) { const id = list[i], kick = (N > 1 ? t('ph_n', { i: i + 1, n: N }) + ' · ' : '') + t('ph_t_' + id);
          const ok = await runChallenge(id, kick); if (!K.alive()) return; if (ok) right++; done.push(!!ok); api.pips(N, done); (mine.won = mine.won || {})[id] = 1; if (!mach) mine.next = (mine.next + 1) % LESSONS.length; KQ.save();
          if (i < N - 1) { await K.act(t('ph_next')); if (!K.alive()) return; } }
        const bye = mach ? 'pv_bye_m' : 'pv_bye'; clearDemo(); S.view = null; await say(nm, bye); await wait(1.6);
        api.done({ stars: right === N ? 3 : right >= N - 1 ? 2 : 1, points: right * 10 + 50, correct: right, total: N, say: t(bye) }); }
      function dispose() { clearDemo(); K.dispose(); if (UI.root) { UI.root.remove(); UI.root = null; } CONF_G.dispose(); if (owl) { try { owl.dispose(); } catch (e) {} } try { if (KQ.tts && KQ.tts.current) KQ.tts.current.pause(); } catch (e) {} }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  /* the words. pv_* are Owl's voiced lines (recorded once into the physics pack: tools/collect_lines.js → voice_batch.py); ph_* are labels.
     Hebrew in the plural: gender-neutral */
  const STR = {
    en: { ph_start: 'Start the experiments', ph_all: 'All the experiments', ph_harder: 'Harder', ph_easier: 'Easier', ph_next: 'Next challenge', ph_n: 'Challenge {i} of {n}',
      ph_machines: 'Machines: many rules at once', ph_t_express: 'Penguin Express', ph_sg_river: 'River: {w} m · 1 s in the air',
      ph_t_gravity: 'Gravity', ph_t_inertia: 'Inertia', ph_t_force: 'Force and mass', ph_t_action: 'Action and reaction', ph_t_speed: 'Speed', ph_t_friction: 'Friction', ph_t_energy: 'Energy', ph_t_float: 'Floating and sinking',
      ph_go_drop: 'Drop!', ph_go_pull: 'Pull!', ph_go_launch: 'Launch!', ph_go_fire: 'Blast off!', ph_go_drive: 'Go!', ph_go_slide: 'Slide!', ph_go_roll: 'Let go!', ph_go_sail: 'Sail!',
      ph_low: 'Low', ph_mid: 'Middle', ph_high: 'High', ph_slow: 'Slow', ph_med: 'Medium', ph_fast: 'Fast',
      ph_pumpkin: 'Pumpkin', ph_apple: 'Apple', ph_grapes: 'Grapes', ph_melon: 'Melon', ph_pineapple: 'Pineapple',
      ph_gas_down: 'Gas down', ph_gas_up: 'Gas up', ph_gas_side: 'Gas sideways', ph_ice: 'Ice', ph_snow: 'Snow', ph_sand: 'Sand',
      ph_stone: 'Stone', ph_wood: 'Wood', ph_ball: 'Metal ball', ph_mboat: 'Metal boat', ph_silk: 'Silk', ph_cotton: 'Cotton', ph_burlap: 'Burlap',
      ph_r_height: 'Drop height', ph_r_cloth: 'Cloth', ph_r_time: 'Pull time', ph_r_load: 'Load', ph_r_bands: 'Rubber bands', ph_r_dir: 'Gas', ph_r_pumps: 'Pumps', ph_r_speed: 'Speed', ph_r_start: 'Start height', ph_r_ground: 'Ground', ph_r_bars: 'Gold bars',
      ph_m: '{n} m', ph_ms: '{n} m/s', ph_msu: 'm/s', ph_kg: '{n} kg', ph_sec: '{n} s',
      ph_sg_need: 'Speed needed: {v} m/s', ph_sg_launch: 'Launch speed: {v} m/s', ph_sg_air: 'Air time: 1 s', ph_sg_door: 'Door: {h} m', ph_sg_pump: 'Each pump: 1.5 m', ph_sg_loop: 'Loop top: {h} m', ph_sg_cap: 'Boat carries {c} kg', ph_sg_bar: 'Each bar: {w} kg',
      pv_hi: 'Hoo-hoo! I am Professor Owl. In my lab, every experiment is a challenge! Make your choice, press the big button, and see what happens.',
      pv_bye: 'Hoo-hoo! All three challenges done. You are a real scientist!',
      pv_g_y_in: 'Gravity pulls everything down, and falling things go faster and faster. Pick how high to drop the ball, to smash the piñata!',
      pv_g_y_low: 'Bonk! From down low, the ball was not fast enough. Try higher!',
      pv_g_y_mid: 'Crack! Almost! From higher up, it falls for longer and gets even faster.',
      pv_g_y_win: 'Smash! The higher it falls, the faster it goes. That is gravity!',
      pv_g_y_in_e: 'Gravity makes falling things go faster and faster. Drop the egg into the nest so gently that it does not break!',
      pv_g_y_win_e: 'Plop! From down low, the egg fell slowly and landed softly. Hello, little chick!',
      pv_g_y_crack_e: 'Crack! From the middle, it fell a little too fast. Drop it from lower down!',
      pv_g_y_splat_e: 'Splat! From up high, the egg fell so fast that it broke. Lower means slower!',
      pv_g_o_in: 'Gravity speeds up a falling ball by about 10 metres per second, every second. The piñata breaks at 8 metres per second, but the glass bowl breaks above 10. Pick the height!',
      pv_g_o_slow: 'Too slow! A higher drop gives gravity more time to speed the ball up.',
      pv_g_o_fast: 'Too fast! The bowl broke too. Try a lower drop.',
      pv_g_o_win: 'Perfect! From 4 metres, the ball hits at about 9 metres per second. Fast enough for the piñata, gentle enough for the bowl.',
      pv_i_y_in: 'Inertia: things that are still like to stay still. Can you pull the cloth away and leave the dishes on the table? Pick how to pull!',
      pv_i_y_slow: 'Crash! Pulled slowly, the cloth dragged the dishes right along. Try a super fast pull!',
      pv_i_y_mid: 'Oops, the teapot slid off! Pull even faster.',
      pv_i_y_win: 'Ta-da! The cloth was so quick, the dishes just stayed still. That is inertia!',
      pv_i_y_in_s: 'Inertia: still things like to stay still, unless something drags them along. The penguin wants cake! Pull the cloth so the cake slides over to it!',
      pv_i_y_win_s: 'Yum! Pulled slowly, the cloth dragged the cake all the way to the penguin. Rubbing pulls things along!',
      pv_i_y_fast_s: 'Whoosh! So fast that the cloth slid away and the cake stayed put. Pull slower!',
      pv_i_y_mid_s: 'Almost! Pull a bit slower, so the cloth drags the cake further.',
      pv_i_o_in: 'The dishes want to stay still, but while the cloth moves, its rubbing drags them along. Pick the cloth, and how fast to pull it.',
      pv_i_o_drag: 'Crash! The cloth rubbed on the dishes for too long. Try a quicker pull, or a more slippery cloth.',
      pv_i_o_win: 'Ta-da! A little rubbing, for a very short time, so the dishes stayed put. That is inertia!',
      pv_f_y_in: 'The catapult gives every fruit the same push. Pick the fruit that will knock down the cans!',
      pv_f_y_heavy: 'Splat! The pumpkin is so heavy, the same push only threw it a little way.',
      pv_f_y_light: 'Whoosh! The grapes are so light, they flew right over the cans!',
      pv_f_y_win: 'Crash! The same push sends light things far, and heavy things only a little way. That is force and mass!',
      pv_f_y_short: 'Too short! That fruit is too heavy to fly so far with the same push. Try a lighter one!',
      pv_f_y_long: 'Too far! That fruit is so light, it flew right past the cans. Try a heavier one!',
      pv_f_o_in: 'More rubber bands give a bigger push. A heavier load needs a bigger push to fly just as fast. Match the launch speed to the cans!',
      pv_f_o_short: 'Too short! Add rubber bands, or pick a lighter load.',
      pv_f_o_long: 'Too far! Fewer rubber bands, or a heavier load.',
      pv_f_o_win: 'Bullseye! Twice the mass needs twice the force to reach the same speed. Force equals mass times acceleration!',
      pv_a_y_in: 'A rocket pushes gas one way, and the gas pushes the rocket the other way. Which way should the gas go, to fly up to the star?',
      pv_a_y_up: 'Oops! The gas pushed up, so the rocket got pushed down into the ground!',
      pv_a_y_side: 'Whoosh! The gas went sideways, so the rocket zoomed the other way!',
      pv_a_y_win: 'Blast off! The gas pushed down, so the rocket went up. Every push has a push back!',
      pv_a_y_in_b: 'A rocket pushes gas one way, and the gas pushes the rocket the other way. Which way should the gas go, to pop the balloon?',
      pv_a_y_in_d: 'A rocket pushes gas one way, and the gas pushes the rocket the other way. Which way should the gas go, to squash the squeaky duck under it?',
      pv_a_y_win_b: 'Pop! The gas went sideways, so the rocket zoomed the other way, right into the balloon. Every push has a push back!',
      pv_a_y_win_d: 'Squeak! The gas pushed up, so the rocket pushed down on the duck. Every push has a push back!',
      pv_a_y_down: 'Whoosh! The gas pushed down, so the rocket flew up, the wrong way!',
      pv_a_o_in: 'Bring the pizza to the tree house door! Push the gas down to go up. Each pump of air lifts the rocket about one and a half metres.',
      pv_a_o_dir: 'The rocket always goes the opposite way from the gas. Point the gas down!',
      pv_a_o_short: 'Not high enough! A few more pumps give a bigger push.',
      pv_a_o_high: 'Too high! It shot right past the door. Use fewer pumps.',
      pv_a_o_win: 'Pizza delivered! The rocket pushed the gas down, and the gas pushed the rocket up. That is action and reaction!',
      pv_s_y_in: 'Speed is how far you go in a certain time. Pick a speed to jump over the river!',
      pv_s_y_slow: 'Splash! Too slow. While it was flying, the car could not go far enough.',
      pv_s_y_mid: 'Splash! So close! A little faster goes further in the same time.',
      pv_s_y_win: 'What a jump! Faster means more distance in the same time. That is speed!',
      pv_s_y_in2: 'Speed is how far you go in a certain time. Pick a speed to land the car on the little island!',
      pv_s_y_win2: 'Right on the island! The right speed goes just the right distance in the same time. That is speed!',
      pv_s_y_fast: 'Splash! Too fast. In the same time, it flew right past the island. Try slower!',
      pv_s_o_in: 'Off this cliff, the car flies for exactly one second. Speed is distance divided by time. Pick the speed to land in the sand pit!',
      pv_s_o_short: 'Splash! In one second, that speed did not go far enough.',
      pv_s_o_long: 'Too far! It flew past the sand pit, into the hay.',
      pv_s_o_win: 'Perfect landing! In one second, the car flew exactly the distance to the sand pit. Speed equals distance divided by time!',
      pv_r_y_in: 'Friction is the rubbing that slows things down. Smooth ground has a little, rough ground has a lot. Pick the ground, so the penguin stops at the fish!',
      pv_r_y_ice: 'Wheee, splash! Ice is so smooth, the penguin slid right past the fish.',
      pv_r_y_sand: 'Oh! Sand is rough, so the penguin stopped much too soon.',
      pv_r_y_win: 'Yum! Snow had just enough friction to stop right at the fish. That is friction!',
      pv_r_y_win_sand: 'Yum! From the tall hill it went fast, so rough sand stopped it right at the fish. That is friction!',
      pv_r_y_win_ice: 'Yum! From the low hill it went slowly, so smooth ice let it slide all the way to the fish. That is friction!',
      pv_r_y_snowlong: 'Too far! From the tall hill it was so fast that snow could not stop it in time. Try rougher ground!',
      pv_r_y_snowshort: 'Too soon! From the low hill it was slow, and snow stopped it early. Try smoother ground!',
      pv_r_o_in: 'A higher start gives more speed. Rough ground stops you sooner, smooth ground lets you slide further. Pick the start and the ground!',
      pv_r_o_long: 'Too far! Start lower, or pick rougher ground.',
      pv_r_o_short: 'Too short! Start higher, or pick smoother ground.',
      pv_r_o_win: 'Yum! The height gave the speed, and friction took it away right at the fish.',
      pv_e_y_in: 'Up high, the coaster has stored energy. Rolling down turns it into speed. Pick a start, so it goes all the way around the loop!',
      pv_e_y_low: 'Whoa, back down! It did not start high enough to climb the loop.',
      pv_e_y_mid: 'So close! It has to start higher than the top of the loop.',
      pv_e_y_win: 'Loop the loop! Starting high gave it enough energy. Energy changes from height to speed, and back again!',
      pv_e_y_in2: 'Up high, the coaster has stored energy. Pick a start high enough for the little loop, but not so high that it smashes through the foam!',
      pv_e_y_win2: 'Just right! Enough energy for the little loop, and not too much for the foam!',
      pv_e_y_fast: 'Crash! Starting so high made it so fast that it smashed right through the foam!',
      pv_e_o_in: 'Energy is never lost, it only changes form. But friction turns a little of it into heat. Pick a start height, to get over the top of the loop!',
      pv_e_o_low: 'It rolled back! It cannot climb higher than it started, and friction took some energy too.',
      pv_e_o_win: 'Loop the loop! The height turned into speed, and back into height at the top. That is energy!',
      pv_w_y_in: 'Water pushes up on everything in it. Things float if they are light for their size. Pick a raft to carry Teddy to the island!',
      pv_w_y_stone: 'Glug glug! Stone is heavy for its size, so it sank.',
      pv_w_y_ball: 'Glug! A solid metal ball is heavy for its size, so it sank.',
      pv_w_y_win: 'Hooray! Wood is light for its size, so it floats. Off to the island!',
      pv_w_y_win2: 'Hooray! The metal boat is full of air inside, so it floats, just like a big ship!',
      pv_w_y_in2: 'Teddy is bringing a heavy treasure chest! Things float if they are light for their size. Pick a boat that can carry Teddy and the chest!',
      pv_w_y_wood_h: 'Glug! The wood raft floats on its own, but the heavy chest pushed it under. It needs a bigger boat!',
      pv_w_o_in: 'The more you load a boat, the lower it sits in the water. Load as much gold as you can, without letting the water come over the top!',
      pv_w_o_sink: 'Glug glug! Too heavy. The water came over the side, and the boat sank.',
      pv_w_o_light: 'It floats! But there was room for more gold.',
      pv_w_o_win: 'Treasure! The water pushed up just hard enough to hold all that gold. That is floating!',
      pv_x_in: 'A machine with four rules at once! The coaster has to make it round the loop. At the end of the track, a stopper stops the cart, but the penguin keeps going, flies over the river and slides to the fish. Pick the start height and the ground!',
      pv_x_loop: 'It rolled back! To get round the loop, start higher than the top of the loop, and a little more, because friction takes some energy.',
      pv_x_river: 'Splash! The penguin was too slow. In one second in the air, it did not reach the other side of the river. Start higher, for more speed!',
      pv_x_short: 'Too short! It stopped before the fish. Pick more slippery ground, or start a little higher.',
      pv_x_long: 'Too far! It slid right past the fish. Pick rougher ground, or start a little lower, but still high enough for the loop and the river!',
      pv_x_win: 'Breakfast! The height turned into speed. The cart stopped, but the penguin kept going: that is inertia. It flew over the river in one second, and friction stopped it right at the fish. Four rules in one machine!',
      pv_bye_m: 'Hoo-hoo! The machine works. You are a real engineer!' },
    he: { ph_start: 'מתחילים בניסויים', ph_all: 'כל הניסויים', ph_harder: 'קשה יותר', ph_easier: 'קל יותר', ph_next: 'לאתגר הבא', ph_n: 'אתגר {i} מתוך {n}',
      ph_machines: 'מכונות: כמה חוקים יחד', ph_t_express: 'האקספרס של הפינגווין', ph_sg_river: 'נהר: {w} מ׳ · שנייה באוויר',
      ph_t_gravity: 'כוח המשיכה', ph_t_inertia: 'התמדה', ph_t_force: 'כוח ומסה', ph_t_action: 'פעולה ותגובה', ph_t_speed: 'מהירות', ph_t_friction: 'חיכוך', ph_t_energy: 'אנרגיה', ph_t_float: 'ציפה ושקיעה',
      ph_go_drop: 'משחררים!', ph_go_pull: 'מושכים!', ph_go_launch: 'משגרים!', ph_go_fire: 'המראה!', ph_go_drive: 'יוצאים!', ph_go_slide: 'מחליקים!', ph_go_roll: 'עוזבים!', ph_go_sail: 'מפליגים!',
      ph_low: 'נמוך', ph_mid: 'באמצע', ph_high: 'גבוה', ph_slow: 'לאט', ph_med: 'בינוני', ph_fast: 'מהר',
      ph_pumpkin: 'דלעת', ph_apple: 'תפוח', ph_grapes: 'ענבים', ph_melon: 'מלון', ph_pineapple: 'אננס',
      ph_gas_down: 'גז למטה', ph_gas_up: 'גז למעלה', ph_gas_side: 'גז הצידה', ph_ice: 'קרח', ph_snow: 'שלג', ph_sand: 'חול',
      ph_stone: 'אבן', ph_wood: 'עץ', ph_ball: 'כדור מתכת', ph_mboat: 'סירת מתכת', ph_silk: 'משי', ph_cotton: 'כותנה', ph_burlap: 'יוטה',
      ph_r_height: 'גובה', ph_r_cloth: 'מפה', ph_r_time: 'זמן משיכה', ph_r_load: 'מטען', ph_r_bands: 'גומיות', ph_r_dir: 'גז', ph_r_pumps: 'שאיבות', ph_r_speed: 'מהירות', ph_r_start: 'גובה התחלה', ph_r_ground: 'קרקע', ph_r_bars: 'מטילי זהב',
      ph_m: '{n} מ׳', ph_ms: '{n} מ׳/ש׳', ph_msu: 'מ׳/ש׳', ph_kg: '{n} ק״ג', ph_sec: '{n} ש׳',
      ph_sg_need: 'מהירות נדרשת: {v} מ׳/ש׳', ph_sg_launch: 'מהירות שיגור: {v} מ׳/ש׳', ph_sg_air: 'זמן באוויר: שנייה', ph_sg_door: 'הדלת: {h} מ׳', ph_sg_pump: 'כל שאיבה: 1.5 מ׳', ph_sg_loop: 'ראש הלולאה: {h} מ׳', ph_sg_cap: 'הסירה נושאת {c} ק״ג', ph_sg_bar: 'כל מטיל: {w} ק״ג',
      pv_hi: 'הו־הו! אני פרופסור ינשוף. במעבדה שלי כל ניסוי הוא אתגר! בוחרים, לוחצים על הכפתור הגדול, ורואים מה קורה.',
      pv_bye: 'הו־הו! עשיתם את כל שלושת האתגרים. אתם מדענים אמיתיים!',
      pv_g_y_in: 'כוח המשיכה מושך הכול למטה, ודברים שנופלים נעשים מהירים יותר ויותר. בוחרים מאיזה גובה להפיל את הכדור, כדי לנפץ את הפיניאטה!',
      pv_g_y_low: 'בום! מלמטה, הכדור לא היה מהיר מספיק. מנסים מגבוה יותר!',
      pv_g_y_mid: 'קראק! כמעט! מגבוה יותר הכדור נופל זמן רב יותר, ונעשה מהיר עוד יותר.',
      pv_g_y_win: 'ניפוץ! ככל שהכדור נופל מגבוה יותר, הוא מהיר יותר. זה כוח המשיכה!',
      pv_g_y_in_e: 'כוח המשיכה מאיץ דברים שנופלים. מפילים את הביצה לתוך הקן בעדינות, כדי שהיא לא תישבר!',
      pv_g_y_win_e: 'פלופ! מלמטה הביצה נפלה לאט ונחתה ברכות. שלום, אפרוח קטן!',
      pv_g_y_crack_e: 'קראק! מהאמצע היא נפלה קצת מהר מדי. מפילים מנמוך יותר!',
      pv_g_y_splat_e: 'ספלאט! מלמעלה הביצה נפלה כל כך מהר, שהיא נשברה. נמוך יותר זה לאט יותר!',
      pv_g_o_in: 'כוח המשיכה מאיץ כדור נופל בערך ב־10 מטרים לשנייה, בכל שנייה. הפיניאטה נשברת ב־8 מטרים לשנייה, אבל קערת הזכוכית נשברת מעל 10. בוחרים גובה!',
      pv_g_o_slow: 'לאט מדי! מגובה רב יותר, לכוח המשיכה יש יותר זמן להאיץ את הכדור.',
      pv_g_o_fast: 'מהר מדי! גם הקערה נשברה. מנסים מגובה נמוך יותר.',
      pv_g_o_win: 'מושלם! מגובה 4 מטרים הכדור פוגע במהירות של בערך 9 מטרים לשנייה. מספיק מהר בשביל הפיניאטה, ומספיק עדין בשביל הקערה.',
      pv_i_y_in: 'התמדה: דברים שעומדים במקום אוהבים להישאר במקום. אפשר למשוך את המפה ולהשאיר את הכלים על השולחן? בוחרים איך למשוך!',
      pv_i_y_slow: 'טראח! כשמושכים לאט, המפה גוררת איתה את הכלים. מנסים משיכה סופר מהירה!',
      pv_i_y_mid: 'אופס, הקומקום החליק ונפל! מושכים עוד יותר מהר.',
      pv_i_y_win: 'טה־דה! המפה זזה כל כך מהר, שהכלים פשוט נשארו במקום. זאת התמדה!',
      pv_i_y_in_s: 'התמדה: דברים שעומדים במקום נשארים במקום, אלא אם משהו גורר אותם. הפינגווין רוצה עוגה! מושכים את המפה כך שהעוגה תחליק אליו!',
      pv_i_y_win_s: 'יאמי! כשמושכים לאט, המפה גררה את העוגה עד הפינגווין. השפשוף מושך דברים איתו!',
      pv_i_y_fast_s: 'ווּש! כל כך מהר, שהמפה החליקה החוצה והעוגה נשארה במקום. מושכים לאט יותר!',
      pv_i_y_mid_s: 'כמעט! מושכים קצת יותר לאט, כדי שהמפה תגרור את העוגה רחוק יותר.',
      pv_i_o_in: 'הכלים רוצים להישאר במקום, אבל כל עוד המפה זזה, השפשוף שלה גורר אותם. בוחרים מפה, וכמה מהר למשוך אותה.',
      pv_i_o_drag: 'טראח! המפה שפשפה את הכלים זמן רב מדי. מנסים משיכה מהירה יותר, או מפה חלקה יותר.',
      pv_i_o_win: 'טה־דה! מעט שפשוף, לזמן קצר מאוד, אז הכלים נשארו במקומם. זאת התמדה!',
      pv_f_y_in: 'הקטפולטה נותנת לכל פרי אותה דחיפה. בוחרים את הפרי שיפיל את הפחיות!',
      pv_f_y_heavy: 'ספלאט! הדלעת כבדה כל כך, שאותה דחיפה זרקה אותה רק קצת.',
      pv_f_y_light: 'ווּש! הענבים קלים כל כך, שהם עפו הרחק מעל הפחיות!',
      pv_f_y_win: 'טראח! אותה דחיפה זורקת דברים קלים רחוק, ודברים כבדים רק קצת. זה כוח ומסה!',
      pv_f_y_short: 'קצר מדי! הפרי הזה כבד מדי כדי לעוף רחוק כל כך באותה דחיפה. מנסים פרי קל יותר!',
      pv_f_y_long: 'רחוק מדי! הפרי הזה קל כל כך, שהוא עף הרחק מעבר לפחיות. מנסים פרי כבד יותר!',
      pv_f_o_in: 'יותר גומיות נותנות דחיפה חזקה יותר. מטען כבד יותר צריך דחיפה חזקה יותר, כדי לעוף באותה מהירות. מתאימים את מהירות השיגור לפחיות!',
      pv_f_o_short: 'קצר מדי! מוסיפים גומיות, או בוחרים מטען קל יותר.',
      pv_f_o_long: 'רחוק מדי! פחות גומיות, או מטען כבד יותר.',
      pv_f_o_win: 'בול! מסה כפולה צריכה כוח כפול, כדי להגיע לאותה מהירות. כוח שווה מסה כפול תאוצה!',
      pv_a_y_in: 'רקטה דוחפת גז לכיוון אחד, והגז דוחף את הרקטה לכיוון ההפוך. לאן צריך לדחוף את הגז, כדי לעוף למעלה אל הכוכב?',
      pv_a_y_up: 'אופס! הגז נדחף למעלה, אז הרקטה נדחפה למטה, לתוך האדמה!',
      pv_a_y_side: 'ווּש! הגז יצא הצידה, אז הרקטה נסעה לצד השני!',
      pv_a_y_win: 'המראה! הגז נדחף למטה, אז הרקטה עפה למעלה. לכל דחיפה יש דחיפה בחזרה!',
      pv_a_y_in_b: 'רקטה דוחפת גז לכיוון אחד, והגז דוחף את הרקטה לכיוון ההפוך. לאן צריך לדחוף את הגז, כדי לפוצץ את הבלון?',
      pv_a_y_in_d: 'רקטה דוחפת גז לכיוון אחד, והגז דוחף את הרקטה לכיוון ההפוך. לאן צריך לדחוף את הגז, כדי למעוך את הברווז המצפצף שמתחתיה?',
      pv_a_y_win_b: 'פוף! הגז יצא הצידה, אז הרקטה נסעה לצד השני, ישר לתוך הבלון. לכל דחיפה יש דחיפה בחזרה!',
      pv_a_y_win_d: 'צפצוף! הגז נדחף למעלה, אז הרקטה נדחפה למטה, על הברווז. לכל דחיפה יש דחיפה בחזרה!',
      pv_a_y_down: 'ווּש! הגז נדחף למטה, אז הרקטה עפה למעלה, לכיוון הלא נכון!',
      pv_a_o_in: 'מביאים את הפיצה לדלת של בית העץ! דוחפים את הגז למטה כדי לעלות. כל שאיבת אוויר מרימה את הרקטה בערך מטר וחצי.',
      pv_a_o_dir: 'הרקטה תמיד נעה הפוך מהגז. מכוונים את הגז למטה!',
      pv_a_o_short: 'לא מספיק גבוה! עוד כמה שאיבות נותנות דחיפה חזקה יותר.',
      pv_a_o_high: 'גבוה מדי! הרקטה עפה הרחק מעבר לדלת. משתמשים בפחות שאיבות.',
      pv_a_o_win: 'הפיצה הגיעה! הרקטה דחפה את הגז למטה, והגז דחף את הרקטה למעלה. זאת פעולה ותגובה!',
      pv_s_y_in: 'מהירות אומרת כמה רחוק מגיעים בזמן מסוים. בוחרים מהירות, כדי לקפוץ מעל הנהר!',
      pv_s_y_slow: 'ספלאש! לאט מדי. בזמן שהמכונית עפה, היא לא הספיקה להגיע רחוק מספיק.',
      pv_s_y_mid: 'ספלאש! כל כך קרוב! קצת יותר מהר, ומגיעים רחוק יותר באותו זמן.',
      pv_s_y_win: 'איזו קפיצה! מהר יותר פירושו מרחק גדול יותר באותו זמן. זאת מהירות!',
      pv_s_y_in2: 'מהירות אומרת כמה רחוק מגיעים בזמן מסוים. בוחרים מהירות, כדי להנחית את המכונית על האי הקטן!',
      pv_s_y_win2: 'בדיוק על האי! המהירות הנכונה מגיעה בדיוק למרחק הנכון באותו זמן. זאת מהירות!',
      pv_s_y_fast: 'ספלאש! מהר מדי. באותו זמן המכונית עפה הרחק מעבר לאי. מנסים לאט יותר!',
      pv_s_o_in: 'מהצוק הזה המכונית עפה בדיוק שנייה אחת. מהירות היא מרחק חלקי זמן. בוחרים מהירות, כדי לנחות בבור החול!',
      pv_s_o_short: 'ספלאש! בשנייה אחת, המהירות הזאת לא הגיעה רחוק מספיק.',
      pv_s_o_long: 'רחוק מדי! המכונית עפה מעבר לבור החול, לתוך החציר.',
      pv_s_o_win: 'נחיתה מושלמת! בשנייה אחת המכונית עפה בדיוק את המרחק עד בור החול. מהירות שווה מרחק חלקי זמן!',
      pv_r_y_in: 'חיכוך הוא השפשוף שמאט דברים. על קרקע חלקה יש מעט חיכוך, ועל קרקע מחוספסת הרבה. בוחרים קרקע, כדי שהפינגווין ייעצר ליד הדגים!',
      pv_r_y_ice: 'וִיייי, ספלאש! הקרח חלק כל כך, שהפינגווין החליק הרחק מעבר לדגים.',
      pv_r_y_sand: 'אוי! החול מחוספס, אז הפינגווין נעצר מוקדם מדי.',
      pv_r_y_win: 'יאמי! בשלג היה בדיוק מספיק חיכוך, כדי לעצור ליד הדגים. זה חיכוך!',
      pv_r_y_win_sand: 'יאמי! מהגבעה הגבוהה הפינגווין היה מהיר, אז החול המחוספס עצר אותו בדיוק ליד הדגים. זה חיכוך!',
      pv_r_y_win_ice: 'יאמי! מהגבעה הנמוכה הפינגווין היה איטי, אז הקרח החלק נתן לו להחליק עד הדגים. זה חיכוך!',
      pv_r_y_snowlong: 'רחוק מדי! מהגבעה הגבוהה הוא היה מהיר כל כך, שהשלג לא הספיק לעצור אותו. מנסים קרקע מחוספסת יותר!',
      pv_r_y_snowshort: 'מוקדם מדי! מהגבעה הנמוכה הוא היה איטי, והשלג עצר אותו מוקדם. מנסים קרקע חלקה יותר!',
      pv_r_o_in: 'התחלה גבוהה יותר נותנת יותר מהירות. קרקע מחוספסת עוצרת מהר, וקרקע חלקה נותנת להחליק רחוק. בוחרים גובה התחלה וקרקע!',
      pv_r_o_long: 'רחוק מדי! מתחילים נמוך יותר, או בוחרים קרקע מחוספסת יותר.',
      pv_r_o_short: 'קצר מדי! מתחילים גבוה יותר, או בוחרים קרקע חלקה יותר.',
      pv_r_o_win: 'יאמי! הגובה נתן את המהירות, והחיכוך לקח אותה בדיוק ליד הדגים.',
      pv_e_y_in: 'למעלה, לרכבת ההרים יש אנרגיה אגורה. כשהיא מתגלגלת למטה, האנרגיה הופכת למהירות. בוחרים מאיפה להתחיל, כדי שתעשה סיבוב שלם בלולאה!',
      pv_e_y_low: 'וואו, אחורה! היא לא התחילה גבוה מספיק כדי לטפס על הלולאה.',
      pv_e_y_mid: 'כל כך קרוב! צריך להתחיל גבוה יותר מראש הלולאה.',
      pv_e_y_win: 'סיבוב בלולאה! התחלה גבוהה נתנה מספיק אנרגיה. האנרגיה הופכת מגובה למהירות, ובחזרה!',
      pv_e_y_in2: 'למעלה, לרכבת ההרים יש אנרגיה אגורה. בוחרים התחלה גבוהה מספיק בשביל הלולאה הקטנה, אבל לא גבוהה מדי, כדי שלא תתנפץ דרך הספוג!',
      pv_e_y_win2: 'בדיוק! מספיק אנרגיה בשביל הלולאה הקטנה, ולא יותר מדי בשביל הספוג!',
      pv_e_y_fast: 'טראח! ההתחלה הגבוהה עשתה אותה מהירה כל כך, שהיא התנפצה ישר דרך הספוג!',
      pv_e_o_in: 'אנרגיה אף פעם לא נעלמת, היא רק משנה צורה. אבל החיכוך הופך קצת ממנה לחום. בוחרים גובה התחלה, כדי לעבור את ראש הלולאה!',
      pv_e_o_low: 'היא התגלגלה אחורה! אי אפשר לטפס גבוה יותר מנקודת ההתחלה, וגם החיכוך לקח קצת אנרגיה.',
      pv_e_o_win: 'סיבוב בלולאה! הגובה הפך למהירות, ובראש הלולאה בחזרה לגובה. זאת אנרגיה!',
      pv_w_y_in: 'המים דוחפים למעלה כל דבר שנמצא בהם. דברים צפים אם הם קלים ביחס לגודל שלהם. בוחרים רפסודה שתיקח את הדובי לאי!',
      pv_w_y_stone: 'גלוּג גלוּג! אבן כבדה ביחס לגודל שלה, אז היא שקעה.',
      pv_w_y_ball: 'גלוּג! כדור מתכת מלא כבד ביחס לגודל שלו, אז הוא שקע.',
      pv_w_y_win: 'הידד! עץ קל ביחס לגודל שלו, אז הרפסודה צפה. קדימה, לאי!',
      pv_w_y_win2: 'הידד! סירת המתכת מלאה באוויר מבפנים, אז היא צפה, בדיוק כמו אונייה גדולה!',
      pv_w_y_in2: 'הדובי מביא תיבת אוצר כבדה! דברים צפים אם הם קלים ביחס לגודל שלהם. בוחרים סירה שתוכל לשאת את הדובי ואת התיבה!',
      pv_w_y_wood_h: 'גלוּג! רפסודת העץ צפה לבד, אבל התיבה הכבדה דחפה אותה למטה. צריך סירה גדולה יותר!',
      pv_w_o_in: 'ככל שמעמיסים יותר על סירה, היא שוקעת עמוק יותר במים. מעמיסים כמה שיותר זהב, בלי לתת למים לעלות מעל הדופן!',
      pv_w_o_sink: 'גלוּג גלוּג! כבד מדי. המים עלו מעל הדופן, והסירה שקעה.',
      pv_w_o_light: 'היא צפה! אבל היה מקום לעוד זהב.',
      pv_w_o_win: 'אוצר! המים דחפו למעלה בדיוק מספיק חזק, כדי להחזיק את כל הזהב. זאת ציפה!',
      pv_x_in: 'מכונה עם ארבעה חוקים בבת אחת! רכבת ההרים צריכה לעבור את הלולאה. בסוף המסילה יש מעצור שעוצר את העגלה, אבל הפינגווין ממשיך, עף מעל הנהר ומחליק עד הדגים. בוחרים גובה התחלה וקרקע!',
      pv_x_loop: 'היא התגלגלה אחורה! כדי לעבור את הלולאה, מתחילים גבוה יותר מראש הלולאה, ועוד קצת, כי החיכוך לוקח קצת אנרגיה.',
      pv_x_river: 'ספלאש! הפינגווין היה איטי מדי. בשנייה אחת באוויר הוא לא הגיע לצד השני של הנהר. מתחילים גבוה יותר, בשביל יותר מהירות!',
      pv_x_short: 'קצר מדי! הוא נעצר לפני הדגים. בוחרים קרקע חלקלקה יותר, או מתחילים קצת יותר גבוה.',
      pv_x_long: 'רחוק מדי! הוא החליק מעבר לדגים. בוחרים קרקע מחוספסת יותר, או מתחילים קצת יותר נמוך, אבל מספיק גבוה בשביל הלולאה והנהר!',
      pv_x_win: 'ארוחת בוקר! הגובה הפך למהירות. העגלה נעצרה, אבל הפינגווין המשיך: זאת התמדה. הוא עף מעל הנהר בשנייה אחת, והחיכוך עצר אותו בדיוק ליד הדגים. ארבעה חוקים במכונה אחת!',
      pv_bye_m: 'הו־הו! המכונה עובדת. אתם מהנדסים אמיתיים!' }
  };
  KQRealms.define('game-physics', { strings: STR, themes: THEMES, stages: STAGES });
})();
