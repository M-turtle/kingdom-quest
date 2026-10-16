/* Kingdom Quest — Spell Duel, a game of the Games Arcade (shared/arcade.js). Spelling as spellcasting: a monster blocks the crypt and only a
   correctly spelled word casts a spell. Build each word from the letter tiles; a right spell strikes (the longer the word, the harder it
   hits), a wrong one fizzles and the letters that were wrong glow red, so you see exactly where the word went astray. The youngest see
   the word first, then it hides and they spell it (look, cover, write, check); from age 8 a sentence with a gap gives the word, never
   shown. Word lists grow with the child, EN and HE, the Hebrew with its final letters. */
(function () {
  'use strict';
  if (!window.THREE || !window.KQRealms || !window.KQKit) return;
  const T = THREE, PI = Math.PI, TAU = PI * 2;
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const t = (k, p) => KQ.t(k, p);

  (function css() { if (document.getElementById('kq-spell-css')) return; const st = document.createElement('style'); st.id = 'kq-spell-css'; st.textContent = `
.sp-word{position:absolute; left:50%; bottom:calc(158px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); display:flex; gap:6px; padding:10px 14px; border-radius:16px; background:rgba(20,10,30,.66); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); box-shadow:inset 0 0 0 1.5px rgba(242,193,78,.55); pointer-events:none}
.sp-word i{display:grid; place-items:center; width:44px; height:52px; border-radius:10px; background:rgba(255,255,255,.1); box-shadow:inset 0 -3px 0 rgba(255,255,255,.3); color:#fff4dc; font:900 28px/1 Rubik, "Secular One", sans-serif; font-style:normal; text-transform:uppercase}
.sp-word i.on{background:linear-gradient(180deg,#fffaf0,#ffe9c4); color:#2a1a30; box-shadow:0 3px 0 #c8a068} .sp-word i.bad{background:linear-gradient(180deg,#ff9a8a,#d8434a); color:#fff} .sp-word i.good{background:linear-gradient(180deg,#9dffb8,#2fa05a); color:#fff}
.sp-word.show i{background:linear-gradient(180deg,#e8d8ff,#b89aff); color:#2a1a40}
@media (max-width:760px){ .sp-word{gap:4px; padding:8px 10px; bottom:auto; top:calc(162px + env(safe-area-inset-top,0px))} .sp-word i{width:34px; height:42px; font-size:22px} }   /* phones: the word under the plaque, the letters below the monster */
`; document.head.appendChild(st); })();

  const THEMES = {
    gm_crypt: { palette: { noFloor: false, sky: 0x140c1e, ground: 0x2a2430, fog: 0x1a1024, wall: ['stone', '#3a3440', '#2a2430'], floor: ['stone', '#3a3440', '#2e2834'], hemi: [0x9a8ac8, 0x1a1020], key: 0xffd8a8, dust: { c: 0xc8b8ff, n: 40, mode: 'drift' } },
      look: { keyC: 0xffd8a8, grade: 'dusk', exposure: 1.1, fogD: 0.03, rim: 0xb89aff, face: 0x1a1024, accent: '#e8d8ff', pillars: null, rays: 0, noWall: false, ceiling: false },
      props(c) { const { scene } = c; KQRealms.hall.skyDome(c, 0x08040e, 0x2a1a3a);
        const stone = M(0x4a4450, { roughness: 0.95, flatShading: true }); for (const x of [-9, 9]) for (let i = 0; i < 3; i++) { const p = new T.Mesh(new T.CylinderGeometry(0.8, 1, 9, 8), stone); p.position.set(x, 4.5, -6 - i * 5); scene.add(p); }
        for (let i = 0; i < 14; i++) { const x = (i % 2 ? 1 : -1) * (5 + Math.random() * 4), z = -2 - Math.random() * 12, cd = new T.Mesh(new T.CylinderGeometry(0.12, 0.14, 0.6 + Math.random() * 0.6, 8), M(0xf4ecd8)); cd.position.set(x, 0.4, z); scene.add(cd); const f = c.sprite(0xffb84a, 0.6, x, 0.95, z, null, 0.9); const k = Math.random() * 6; c.updaters.push((dt, tm) => { f.material.opacity = 0.7 + 0.25 * Math.sin(tm * 9 + k) * Math.sin(tm * 5.3 + k); }); }
        const L = new T.PointLight(0xffb070, 20, 30, 1.6); L.position.set(0, 4, 2); scene.add(L);
      } }
  };

  /* words with a sentence that needs them (the sentence carries the word as ___) */
  const WORDS = {
    en: { 1: [['cat', 'The ___ says meow.'], ['dog', 'The ___ wags its tail.'], ['sun', 'The ___ is hot and bright.'], ['hat', 'Put a ___ on your head.'], ['bed', 'I sleep in my ___.'], ['fish', 'A ___ swims in the sea.']],
      2: [['frog', 'The green ___ jumps into the pond.'], ['ship', 'The ___ sails across the sea.'], ['tree', 'Birds build nests in the ___.'], ['cake', 'We ate birthday ___.'], ['rain', 'Take an umbrella: it will ___.'], ['star', 'A ___ twinkles in the night sky.']],
      3: [['house', 'We live in a big ___.'], ['light', 'Turn on the ___, it is dark.'], ['happy', 'A smile shows you are ___.'], ['water', 'Fish live in the ___.'], ['chair', 'Sit down on the ___.'], ['green', 'Grass is ___.']],
      4: [['castle', 'The king lives in a ___.'], ['bridge', 'We walked over the ___.'], ['rabbit', 'The ___ has long ears.'], ['pencil', 'Write with a ___.'], ['dragon', 'The ___ breathes fire.'], ['summer', 'The hottest season is ___.']],
      5: [['knight', 'The ___ wore shining armour.'], ['wizard', 'The ___ waved a magic wand.'], ['thunder', 'After the lightning came the ___.'], ['island', 'Sea all around: we are on an ___.'], ['treasure', 'The pirates buried their ___.'], ['whisper', 'Speak very quietly: ___.']],
      6: [['mysterious', 'Nobody knew who sent the ___ letter.'], ['adventure', 'Our trip into the jungle was a real ___.'], ['beautiful', 'The sunset was ___.'], ['necessary', 'Water is ___ for life.'], ['library', 'We borrow books from the ___.'], ['surprise', 'The party was a ___!']] },
    he: { 1: [['חתול', 'ה___ אומר מיאו.'], ['כלב', 'ה___ מכשכש בזנב.'], ['שמש', 'ה___ חמה ומאירה.'], ['בית', 'אנחנו גרים ב___.'], ['דג', 'ה___ שוחה בים.'], ['גן', 'ילדים משחקים ב___.']],
      2: [['פרח', 'ה___ פורח בגינה.'], ['ספר', 'קוראים ___ לפני השינה.'], ['עץ', 'ציפורים בונות קן על ה___.'], ['ירח', 'ה___ מאיר בלילה.'], ['גשם', 'לוקחים מטרייה כי יורד ___.'], ['כדור', 'בועטים ב___ בשער.']],
      3: [['שולחן', 'אוכלים ארוחת ערב ליד ה___.'], ['מכונית', 'אבא נוהג ב___.'], ['חלון', 'מסתכלים החוצה דרך ה___.'], ['פרפר', 'ה___ עף מפרח לפרח.'], ['ציפור', 'ה___ שרה על הענף.'], ['שמיים', 'ה___ כחולים ביום.']],
      4: [['טירה', 'המלך גר ב___.'], ['גשר', 'עוברים את הנהר על ה___.'], ['ארנב', 'ל___ יש אוזניים ארוכות.'], ['עיפרון', 'כותבים ב___.'], ['דרקון', 'ה___ יורק אש.'], ['מדבר', 'ב___ יש הרבה חול ומעט מים.']],
      5: [['אביר', 'ה___ לבש שריון נוצץ.'], ['קוסם', 'ה___ נופף בשרביט קסמים.'], ['רעם', 'אחרי הברק בא ה___.'], ['אוצר', 'השודדים קברו את ה___.'], ['מערה', 'העטלפים ישנים ב___ החשוכה.'], ['לחישה', 'מדברים בשקט, ב___.']],
      6: [['הרפתקה', 'הטיול לג׳ונגל היה ___ אמיתית.'], ['ספרייה', 'שואלים ספרים ב___.'], ['הפתעה', 'המסיבה הייתה ___!'], ['מסתורין', 'אף אחד לא פתר את ה___.'], ['תזמורת', 'ה___ ניגנה בקונצרט.'], ['אסטרונאוט', 'ה___ טס לחלל.']] } };
  const LOOK = { en: 'abcdefghijklmnopqrstuvwxyz', he: 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ' };
  const NEAR = { en: { a: 'e', e: 'i', i: 'e', o: 'u', u: 'o', c: 'k', k: 'c', s: 'z', b: 'd', d: 'b', m: 'n', n: 'm', r: 'l', l: 'r', t: 'd', g: 'j', p: 'b', f: 'v', h: 'w', w: 'v', y: 'i' }, he: { 'א': 'ע', 'ע': 'א', 'ט': 'ת', 'ת': 'ט', 'כ': 'ח', 'ח': 'כ', 'ק': 'כ', 'ס': 'ש', 'ש': 'ס', 'ב': 'ו', 'ו': 'ב', 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' } };

  const STAGES = {
    gm_spell(c) { const { scene } = c, K = KQKit.make(c); const S = { band: 2, word: '', typed: [], hp: 1, hp0: 1 };
      /* the monster: a big friendly-scary purple blob with horns, one big eye, a grin, arms that wave; an HP bar over it */
      const mon = new T.Group(); mon.position.set(0, 0, -5); scene.add(mon); const skin = M(0x7a4ab8, { roughness: 0.45, emissive: 0x2a1040, emissiveIntensity: 0.4 });
      const body = new T.Mesh(new T.SphereGeometry(2.1, 36, 26), skin); body.scale.set(1, 1.1, 0.9); body.position.y = 2.2; mon.add(body);
      for (const s of [-1, 1]) { const h = new T.Mesh(new T.ConeGeometry(0.35, 1.2, 12), M(0xf4ecd8)); h.position.set(s * 1.2, 4.3, 0); h.rotation.z = -s * 0.4; mon.add(h); }
      const eye = new T.Mesh(new T.SphereGeometry(0.7, 24, 18), M(0xffffff, { roughness: 0.2 })); eye.position.set(0, 2.9, 1.6); mon.add(eye); const pupil = new T.Mesh(new T.SphereGeometry(0.34, 16, 12), M(0x1a0a2a)); pupil.position.set(0, 2.9, 2.2); mon.add(pupil);
      const mouth = new T.Mesh(new T.TorusGeometry(0.8, 0.12, 8, 24, PI), M(0x2a0a2a)); mouth.rotation.z = PI; mouth.position.set(0, 1.8, 1.85); mon.add(mouth); for (let i = 0; i < 4; i++) { const tooth = new T.Mesh(new T.ConeGeometry(0.1, 0.25, 6), M(0xffffff)); tooth.rotation.x = PI; tooth.position.set(-0.5 + i * 0.33, 1.72, 1.95); mon.add(tooth); }
      const arms = []; for (const s of [-1, 1]) { const a = new T.Group(); a.position.set(s * 2, 2.4, 0); const arm = new T.Mesh(new T.CapsuleGeometry(0.3, 1.4, 8, 12), skin); arm.position.set(s * 0.6, -0.4, 0); arm.rotation.z = s * 0.9; a.add(arm); mon.add(a); arms.push(a); }
      const hpBack = new T.Mesh(new T.PlaneGeometry(3.6, 0.3), new T.MeshBasicMaterial({ color: 0x2a1a2a })); hpBack.position.set(0, 0.25, 2.1); mon.add(hpBack); const hpBar = new T.Mesh(new T.PlaneGeometry(3.5, 0.22), new T.MeshBasicMaterial({ color: 0xff4a6a })); hpBar.position.set(0, 0.25, 2.11); mon.add(hpBar);
      const setHP = () => { const k = Math.max(0.001, S.hp / S.hp0); hpBar.scale.x = k; hpBar.position.x = -3.5 * (1 - k) / 2; };   /* the health bar lies at its feet, below the plaque */
      c.updaters.push((dt, tm) => { if (S.fallen) return; mon.position.y = Math.sin(tm * 1.4) * 0.12; arms.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * Math.sin(tm * 2 + i) * 0.25; }); pupil.position.x = Math.sin(tm * 0.7) * 0.2; });
      /* the staff the spells fly from */
      const staff = new T.Group(); staff.position.set(3.4, -1.2, 5.2); scene.add(staff);   /* to the side: the monster stays in full view */ { const rod = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 3, 8), M(0x6a4a2a)); rod.position.y = 1; staff.add(rod); const orb = new T.Mesh(new T.SphereGeometry(0.3, 20, 14), new T.MeshBasicMaterial({ color: new T.Color(1.4, 1.1, 2.4) })); orb.position.y = 2.6; staff.add(orb); c.sprite(0xb89aff, 1.0, 0, 2.6, 0, staff, 0.5); staff.userData.orb = orb; }
      /* the word row (DOM, crisp) */
      let row = null; function drawWord(state) { if (!row) { row = document.createElement('div'); row.className = 'sp-word'; const host = c.renderer.domElement.parentNode && c.renderer.domElement.parentNode.parentNode; if (host) host.appendChild(row); row.dir = KQ.i18n.lang === 'he' ? 'rtl' : 'ltr'; }
        row.className = 'sp-word' + (state === 'show' ? ' show' : ''); row.replaceChildren(); const w = [...S.word];
        w.forEach((ch, i) => { const e = document.createElement('i'); if (state === 'show') e.textContent = ch; else if (S.typed[i] != null) { e.textContent = S.typed[i]; e.className = state === 'check' ? (S.typed[i] === ch ? 'good' : 'bad') : 'on'; } row.appendChild(e); }); }
      function tray(letters) { K.tray(letters.map(l => ({ text: l.toUpperCase() })).concat([{ text: '⌫', label: t('sd2_undo') }]), (j, btn) => { if (S.locked) return; if (j === letters.length) { const last = S.typed.pop(); if (last != null) { const b = S.used.pop(); if (b) b.classList.remove('used'); } drawWord(); return; } if (btn.classList.contains('used') || S.typed.length >= [...S.word].length) return; S.typed.push(letters[j]); btn.classList.add('used'); S.used.push(btn); drawWord(); if (S.typed.length === [...S.word].length) K.ready(); }); }
      async function bolt(ok) { const from = staff.position.clone().add(new T.Vector3(0, 2.6, 0)), to = new T.Vector3(ok ? 0 : 1.6, ok ? 2.6 : 1.2, ok ? -3.6 : -1), orb = new T.Mesh(new T.SphereGeometry(0.35, 16, 12), new T.MeshBasicMaterial({ color: ok ? new T.Color(1.6, 1.2, 2.8) : new T.Color(0.8, 0.8, 0.8) })); scene.add(orb);
        const trail = []; await K.anim(0.55, k => { orb.position.lerpVectors(from, to, k); orb.position.y += Math.sin(k * PI) * 1.2; if (Math.random() < 0.8) { const s2 = c.sprite(ok ? 0xc8a8ff : 0x9a9a9a, 0.6, orb.position.x, orb.position.y, orb.position.z, null, 0.8); trail.push(s2); } });
        scene.remove(orb); for (const s2 of trail) c.tween(0.5, k => { s2.material.opacity = 0.8 * (1 - k); }, () => scene.remove(s2));
        if (ok) { c.burst(to.clone(), 0xd8b8ff, 22); const r0 = mon.rotation.z; await K.anim(0.4, k => { mon.rotation.z = r0 + Math.sin(k * PI * 3) * 0.12; body.scale.set(1 + Math.sin(k * PI) * 0.1, 1.1 - Math.sin(k * PI) * 0.1, 0.9); }); mon.rotation.z = 0; } else c.burst(to.clone(), 0x8a8a8a, 8); }
      async function duel(i, n, kick) { const b = S.band, L = KQ.i18n.lang === 'he' ? 'he' : 'en', [w, sent] = S.order[i]; S.word = w; S.typed = []; S.used = []; S.locked = false;
        const letters = shuffle([...w].concat(shuffle([...w].map(ch => (NEAR[L][ch] || '')[0]).filter(Boolean).filter(x => !w.includes(x)).concat([pick([...LOOK[L]]), pick([...LOOK[L]])])).slice(0, b <= 2 ? 2 : 3)));
        const look = b <= 2; if (look) { S.locked = true; K.tray(null); K.tell(kick, t('sd2_look')); drawWord('show'); await K.wait(3.2); if (!K.alive()) return null; S.locked = false; K.tell(kick, t('sd2_cover')); } else K.tell(kick, t('sd2_sent', { s: sent }));
        drawWord(); tray(letters); K.hint(() => { K.tell(kick, t('sd2_hint', { a: [...w][0].toUpperCase(), n: [...w].length }) + (look ? '' : ' ' + sent)); });
        for (let tries = 0; ; tries++) { await K.act(t('sd2_cast'), { wait: S.typed.length < [...w].length }); if (!K.alive()) return null; S.locked = true; const ok = S.typed.join('') === w; drawWord('check');
          if (ok) { K.sfx('correct'); await bolt(true); S.hp -= [...w].length; setHP(); K.tell(kick, t('sd2_yes', { w: w.toUpperCase() })); await K.wait(1.0); K.hint(null); return tries === 0 ? 1 : tries === 1 ? 2 : 0; }
          K.sfx('wrong'); await bolt(false); const bad = S.typed.map((ch, j) => ch !== [...w][j] ? j + 1 : 0).filter(Boolean); K.tell(kick, t('sd2_no', { n: bad.length })); await K.wait(1.8);
          if (tries >= 1) { drawWord('show'); K.tell(kick, t('sd2_show', { w: w.toUpperCase() })); await K.wait(2.2); S.hp -= 1; setHP(); K.hint(null); return 0; }
          /* keep the right letters, hand the wrong ones back */
          const keep = []; S.typed.forEach((ch, j) => { if (ch === [...w][j] && keep.length === j) keep.push(ch); }); while (S.typed.length > keep.length) { S.typed.pop(); const btn = S.used.pop(); if (btn) btn.classList.remove('used'); } S.locked = false; drawWord(); if (look) K.tell(kick, t('sd2_cover')); else K.tell(kick, t('sd2_sent', { s: sent })); } }
      function frame(a) { staff.position.x = a < 1.05 ? 2.0 : 3.4; return a < 1.05 ? { pos: [0, 3.4, 15.5], look: [0, 3.6, -2], fov: 58 } : { pos: [0, 3.0, 11.5], look: [0, 2.4, -2], fov: 50 }; }
      async function play(api) { K.mount(api); S.band = Math.max(1, Math.min(6, api.band || 2)); const L = KQ.i18n.lang === 'he' ? 'he' : 'en'; S.order = shuffle(WORDS[L][S.band]).slice(0, 5); S.hp0 = S.hp = S.order.reduce((s, x) => s + [...x[0]].length, 0) + 5; setHP(); window.__spellduel = { S };
        const N = 5, done = []; let pts = 0; api.pips(N, done); const nm = t('ag_spell'); await K.intro(async () => { K.tell(nm, t('sd2_hi')); await K.act(t('sd2_start')); }); if (!K.alive()) return;
        for (let i = 0; i < N; i++) { const r = await duel(i, N, t('sd2_n', { i: i + 1, n: N })); if (r == null || !K.alive()) return; pts += r === 1 ? 10 : r === 2 ? 6 : 2; done.push(r === 1); api.pips(N, done); }
        if (row) row.remove(); row = null; K.tray(null); S.fallen = true; await K.anim(1.2, k => { mon.scale.setScalar(Math.max(0.01, 1 - k)); mon.rotation.y = k * TAU; }); c.burst(new T.Vector3(0, 2.5, -5), 0xffe08a, 30);
        const right = done.filter(Boolean).length; K.tell(nm, t('sd2_win')); await K.wait(1.4);
        api.done({ stars: right === N ? 3 : right >= N * 0.6 ? 2 : 1, points: pts + 50, correct: right, total: N, say: t('sd2_win') }); }
      function dispose() { K.dispose(); if (row) row.remove(); row = null; }
      return { dynamic: true, frame, build() {}, play, say: (k, x) => K.tell(k, x), present() {}, resolve() { return 1; }, dispose };
    }
  };

  const STR = {
    en: { sd2_hi: 'A monster blocks the crypt! Only a correctly spelled word casts a spell. Build each word from the letters, then press Cast.', sd2_start: 'Duel!', sd2_n: 'Spell {i} of {n}',
      sd2_look: 'Look at the word carefully…', sd2_cover: 'Now it is hidden. Spell it from memory!', sd2_sent: 'Spell the missing word: “{s}”', sd2_cast: 'Cast ✦', sd2_undo: 'Take back a letter',
      sd2_yes: '{w}! The spell strikes!', sd2_no: 'Fizzle! {n} letter(s) are wrong: they glow red. Fix it from the first red letter.', sd2_show: 'The word is {w}. Look at it once more.', sd2_hint: 'It starts with {a} and has {n} letters.', sd2_win: 'The monster shrinks into a puff of sparkles. The crypt is yours!' },
    he: { sd2_hi: 'מפלצת חוסמת את המערה! רק מילה שמאויתת נכון מטילה כישוף. בונים כל מילה מהאותיות ולוחצים הטלה.', sd2_start: 'לדו־קרב!', sd2_n: 'כישוף {i} מתוך {n}',
      sd2_look: 'מסתכלים טוב על המילה…', sd2_cover: 'עכשיו היא מוסתרת. מאייתים מהזיכרון!', sd2_sent: 'מאייתים את המילה החסרה: „{s}”', sd2_cast: 'הטלה ✦', sd2_undo: 'מחזירים אות',
      sd2_yes: '{w}! הכישוף פוגע!', sd2_no: 'פספוס! {n} אותיות לא נכונות: הן זוהרות באדום. מתקנים מהאות האדומה הראשונה.', sd2_show: 'המילה היא {w}. מסתכלים עליה שוב.', sd2_hint: 'היא מתחילה ב־{a} ויש בה {n} אותיות.', sd2_win: 'המפלצת מתכווצת לענן של ניצוצות. המערה שלכם!' }
  };
  KQRealms.define('game-spell', { strings: STR, themes: THEMES, stages: STAGES });
})();
