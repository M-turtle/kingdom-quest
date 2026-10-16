/* Kingdom Quest — the Games Arcade (Yoni 2026-09-27: 'all games have become a few questions in multiple locations … how can we create
   actual games … build all games, put them in a unique location in each world, something that everyone can see'; he chose: the same
   arcade in every world, holding every game, plus a sports game).

   A floating island over the hill in the middle of every map — the one place you can see from anywhere — with a carousel pavilion
   whose windows show the games. Tapping it opens the picker (the hub). Each game is a real game, not a quiz: the maths or the reading
   IS the move. Every game lives in its own file, loaded the first time it is picked; the file registers its hall (a theme) and its
   stage with KQRealms, and the stage runs the whole visit itself (stage.play(api) → api.done(result); see the hub's playCustom). */
(function () {
  'use strict';
  /* ready: shown in the picker (a game appears only once it is built and tested) */
  const GAMES = [
    { id: 'studio', path: 'studio.js', v: 8, icon: 'ruler', kind: 'math', theme: 'fa_studio', stage: 'studio', ready: true },
    { id: 'cannon', path: 'games/cannon.js', v: 5, icon: 'cannon', kind: 'math', theme: 'gm_cove', stage: 'gm_cannon', ready: true },
    { id: 'bridge', path: 'games/bridge.js', v: 3, icon: 'bridge', kind: 'math', theme: 'gm_skybridge', stage: 'gm_bridge', ready: true },
    { id: 'kick', path: 'games/kick.js', v: 2, icon: 'soccer', kind: 'math', theme: 'gm_pitch', stage: 'gm_kick', ready: true },
    { id: 'robot', path: 'games/robot.js', v: 2, icon: 'robot', kind: 'logic', theme: 'gm_seabed', stage: 'gm_robot', ready: true },
    { id: 'spell', path: 'games/spell.js', v: 3, icon: 'wand', kind: 'spelling', theme: 'gm_crypt', stage: 'gm_spell', ready: true },
    { id: 'bakery', path: 'games/bakery.js', v: 3, icon: 'cupcake', kind: 'math', theme: 'gm_bakery', stage: 'gm_bakery', ready: true },
    { id: 'detective', path: 'games/detective.js', v: 3, icon: 'magnifier', kind: 'reading', theme: 'gm_square', stage: 'gm_detective', ready: true },
    { id: 'physics', path: 'games/physics.js', v: 9, icon: 'apple', kind: 'logic', theme: 'gm_lab', stage: 'gm_physics', ready: true }   /* Yoni 2026-10-03: the rules of physics, shown and said */
  ];
  const byId = {}; for (const g of GAMES) byId[g.id] = g;

  const STR = {
    en: { ar_name: 'The Games Arcade', ar_blurb: 'Real games, in every world', ar_title: 'The Games Arcade', ar_sub: 'Pick a game. Every one is played with your hands: measure, aim, build, spell, code and solve.',
      ar_math: 'Maths', ar_reading: 'Reading', ar_spelling: 'Spelling', ar_logic: 'Logic', ar_close: 'Close', ar_loadFail: 'The game did not load. Try again in a moment.', ar_done: 'Well played!', ar_found: 'Well played! You found: {item}.',
      ag_studio: 'The Doll Studio', ag_studio_b: 'Measure, cut and dress a doll with a real ruler',
      ag_cannon: 'Cannon Cove', ag_cannon_b: 'Aim by the numbers and sink the pirate fleet',
      ag_bridge: 'Bridge Builder', ag_bridge_b: 'Lay planks that add up exactly and get the cart across',
      ag_kick: 'Penalty Kick', ag_kick_b: 'Read the protractor and aim for the gap the keeper leaves',
      ag_robot: 'Robot Diver', ag_robot_b: 'Program a robot to collect pearls on the seabed',
      ag_spell: 'Spell Duel', ag_spell_b: 'Spell the words right to cast spells at the monster',
      ag_bakery: 'Potion Bakery', ag_bakery_b: 'Measure fractions, fill the orders, count the change',
      ag_detective: 'Detective Case', ag_detective_b: 'Read the clues and find out who did it',
      ag_physics: 'Physics Lab', ag_physics_b: 'Smash, launch, splash and fly: win every challenge with a rule of physics' },
    he: { ar_name: 'המשחקייה', ar_blurb: 'משחקים אמיתיים, בכל עולם', ar_title: 'המשחקייה', ar_sub: 'בוחרים משחק. בכל אחד משחקים בידיים: מודדים, מכוונים, בונים, מאייתים, מתכנתים ופותרים.',
      ar_math: 'חשבון', ar_reading: 'קריאה', ar_spelling: 'כתיב', ar_logic: 'חשיבה', ar_close: 'סגירה', ar_loadFail: 'המשחק לא נטען. מנסים שוב בעוד רגע.', ar_done: 'כל הכבוד!', ar_found: 'כל הכבוד! מצאתם: {item}.',
      ag_studio: 'סטודיו הבובה', ag_studio_b: 'מודדים, גוזרים ומלבישים בובה עם סרגל אמיתי',
      ag_cannon: 'מפרץ התותחים', ag_cannon_b: 'מכוונים לפי המספרים ומטביעים את צי הפיראטים',
      ag_bridge: 'בוני הגשרים', ag_bridge_b: 'מניחים קרשים שמסתכמים בדיוק ומעבירים את העגלה',
      ag_kick: 'בעיטת עונשין', ag_kick_b: 'קוראים את מד הזווית ומכוונים לפרצה שהשוער משאיר',
      ag_robot: 'צוללן רובוט', ag_robot_b: 'מתכנתים רובוט שאוסף פנינים בקרקעית הים',
      ag_spell: 'דו־קרב כישופים', ag_spell_b: 'מאייתים נכון ומטילים כישופים על המפלצת',
      ag_bakery: 'מאפיית השיקויים', ag_bakery_b: 'מודדים שברים, ממלאים הזמנות וסופרים עודף',
      ag_detective: 'תיק הבלש', ag_detective_b: 'קוראים את הרמזים ומגלים מי עשה את זה',
      ag_physics: 'מעבדת הפיזיקה', ag_physics_b: 'מנפצים, משגרים, מתיזים ועפים: מנצחים כל אתגר בעזרת חוק בפיזיקה' }
  };
  if (window.KQ && KQ.i18n && KQ.i18n.extend) KQ.i18n.extend(STR);

  /* a game's file is fetched the first time it is picked */
  const loading = {};
  function load(id) { const g = byId[id]; if (!g) return Promise.reject(new Error('no game ' + id)); if (loading[id]) return loading[id];
    return (loading[id] = new Promise((res, rej) => { if (window.KQRealms && KQRealms.stage(g.stage)) { res(); return; }
      const s = document.createElement('script'); s.src = 'shared/' + g.path + '?v=' + g.v; s.onload = () => (window.KQRealms && KQRealms.stage(g.stage)) ? res() : rej(new Error('no stage ' + g.stage));
      s.onerror = () => rej(new Error('load ' + g.path)); document.head.appendChild(s); }).catch(e => { delete loading[id]; throw e; })); }

  /* ---------------------------------------------------------------- the map: a floating island with a carousel pavilion over the hill */
  const ISLE = 12.5, SC = 0.72;   /* how high the island floats over the hilltop, and its size: the whole pavilion in the default view */
  function plot(k) { const { T, cone, cyl } = k, PI = Math.PI, TAU = PI * 2; const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
    const canvasTex = (w, h, paint) => { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; };
    const stripes = canvasTex(512, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#fff4e0' : '#e8475a'; g.fillRect(i * w / 16, 0, w / 16 + 1, h); } });
    const grass = M(k.PAL && (k.PAL.grass || k.PAL.grass2) ? (k.PAL.grass || k.PAL.grass2) : 0x6fbf4a, { roughness: 0.9 }), rock = M(0x8a7a6a, { roughness: 0.95, flatShading: true }), gold = M(0xf2c14e, { metalness: 0.8, roughness: 0.28, emissive: 0x3a2400, emissiveIntensity: 0.35 }), cream = M(0xfff4e0, { roughness: 0.6 });
    k.plot('arcade', 0, 0, g => {
      const isle = new T.Group(); isle.position.y = ISLE; isle.scale.setScalar(SC); g.add(isle); g.userData.fly = { focus: ISLE + 2.5, dist: 20, up: 4 };
      /* the island: a grassy top, a rocky underside, crystals hanging below */
      const top = new T.Mesh(new T.CylinderGeometry(7.4, 7.0, 1.2, 40), grass); top.position.y = -0.6; isle.add(top);
      const under = new T.Mesh(new T.ConeGeometry(7.0, 8.5, 14, 3), rock); under.rotation.x = PI; under.position.y = -5.4; isle.add(under);
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3, r = 2.6 + (i % 3) * 1.3; const cr = new T.Mesh(new T.OctahedronGeometry(0.55 + (i % 2) * 0.3, 0), M([0x7ae0ff, 0xff8fd0, 0xffe06a, 0xb48cff][i % 4], { emissive: [0x3aa0ff, 0xff4aa0, 0xffb020, 0x8a5aff][i % 4], emissiveIntensity: 0.8, roughness: 0.2 })); cr.position.set(Math.cos(a) * r, -3.2 - (i % 3) * 1.4, Math.sin(a) * r); cr.scale.y = 1.8; isle.add(cr); }
      /* the pavilion: a cream drum with golden columns, a window for every game, a striped carousel roof, a golden star on top */
      const drum = new T.Mesh(new T.CylinderGeometry(4.2, 4.4, 3.6, 40), cream); drum.position.y = 1.8; isle.add(drum);
      cyl(4.5, 4.5, 0.35, gold, 0, 0.18, 0, isle, 40); cyl(4.4, 4.4, 0.3, gold, 0, 3.7, 0, isle, 40);
      const list = GAMES; for (let i = 0; i < list.length; i++) { const a = i / list.length * TAU; const x = Math.sin(a) * 4.32, z = Math.cos(a) * 4.32;
        const col = cyl(0.16, 0.16, 3.4, gold, Math.sin(a + PI / list.length) * 4.35, 1.85, Math.cos(a + PI / list.length) * 4.35, isle, 8); void col;
        const tex = window.KQ && KQ.iconTexture ? KQ.iconTexture(list[i].icon) : null;
        const win = new T.Mesh(new T.CircleGeometry(1.05, 32), new T.MeshStandardMaterial({ color: 0xffffff, map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.5, transparent: true })); win.position.set(x, 1.9, z); win.rotation.y = a; isle.add(win);
        const ring = new T.Mesh(new T.TorusGeometry(1.12, 0.1, 8, 32), gold); ring.position.set(x * 1.005, 1.9, z * 1.005); ring.rotation.y = a; isle.add(ring); }
      const roof = new T.Mesh(new T.ConeGeometry(5.4, 3.6, 16, 1, true), new T.MeshStandardMaterial({ map: stripes, roughness: 0.6, side: T.DoubleSide })); roof.position.y = 5.7; isle.add(roof);
      const scal = new T.Mesh(new T.TorusGeometry(5.35, 0.22, 8, 48), M(0xe8475a)); scal.rotation.x = PI / 2; scal.position.y = 3.95; isle.add(scal);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; const fl = new T.Mesh(new T.ConeGeometry(0.36, 0.7, 4), M(i % 2 ? 0xffd23f : 0x3a9aff)); fl.position.set(Math.sin(a) * 5.3, 3.55, Math.cos(a) * 5.3); fl.rotation.x = PI; isle.add(fl); }
      cyl(0.12, 0.12, 1.6, gold, 0, 8.2, 0, isle, 8);
      const star = new T.Group(); star.position.y = 9.6; star.userData.noMerge = true; isle.add(star); { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.55 : 1.3, a = i / 10 * TAU + PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); } sh.closePath(); const sm = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 2 }), M(0xffd23f, { metalness: 0.7, roughness: 0.25, emissive: 0xffb020, emissiveIntensity: 0.6 })); sm.position.z = -0.17; sm.userData.noMerge = true; star.add(sm); }
      /* bunting from the roof edge to little poles on the rim, lanterns, a soft beam of light down to the hill */
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; cyl(0.08, 0.08, 2.4, gold, Math.sin(a) * 6.6, 1.2, Math.cos(a) * 6.6, isle, 6); const lamp = new T.Mesh(new T.SphereGeometry(0.28, 12, 8), M(0xfff2c0, { emissive: 0xffc860, emissiveIntensity: 1.4 })); lamp.position.set(Math.sin(a) * 6.6, 2.55, Math.cos(a) * 6.6); isle.add(lamp); }
      const beamM = new T.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide }), bh = ISLE - 9.2 * SC; const beam = new T.Mesh(new T.CylinderGeometry(0.5, 2.2, bh, 24, 1, true), beamM); beam.position.y = bh / 2; beam.userData.noMerge = true; g.add(beam);
      k.fx((dt, tm) => { isle.position.y = ISLE + Math.sin(tm * 0.7) * 0.35; star.rotation.y = tm * 0.9; beamM.opacity = 0.12 + 0.05 * Math.sin(tm * 1.3); });
    }, { labelH: ISLE - 3.4 }); }   /* the plaque hangs under the island: above it is the top edge of the screen, behind the header */

  window.KQArcade = { games: () => GAMES.filter(g => g.ready), all: GAMES, game: id => byId[id] || null, load, plot };
})();
