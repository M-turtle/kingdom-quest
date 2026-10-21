/* Kingdom Quest — the Game Engine (Yoni 2026-10-21: "any idea for a game is just pushed into the engine. It creates the game in the same,
   let's say, concept of the other games, but let's say different designs, different animals, and different tasks, and it grows as we want it").

   A game is a RECIPE, one line of data:  { action, place, skill, goal, leaves }
     action  what the hands do (engine/actions/*.js, code, built once)      skill  what decides right and wrong (engine/skills.js)
     place   where and who (engine/places.js)                               ladder levels that move both ways (here, per recipe)
   Every round has the same six steps, run here, so no game can skip them:
     1 the goal as a picture and a voice, gone in 3 s     2 play: the skill lives inside the action (no question box)
     3 right = you grow, wrong = a funny bounce (no red X) 4 a twist halfway
     5 the end shows what you made, never a rank           6 it goes home to the kingdom
   API: KQE.action(id, def) · KQE.skill(id, def) · KQE.place(id, def) · KQE.check(recipe) → problems[] · KQE.play(recipe, host, onExit)
   Voice: ElevenLabs through the kingdom's relay only, never the device voice (Yoni 2026-09-28). Silent until the speaker is pressed. */
(function () {
  'use strict';
  const ACTIONS = {}, SKILLS = {}, PLACES = {};
  const RELAY = 'https://elnmuuymfmlwnsynzgrh.supabase.co/functions/v1/kq-relay';
  const SFX = '../shared/sfx/';

  // ---------- language: Hebrew first (Yoni 2026-10-17), English on request ----------
  const store = { get(k, d) { try { const v = localStorage.getItem('kqe.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('kqe.' + k, JSON.stringify(v)); } catch (e) {} } };
  let LANG = store.get('lang', 'he');
  const L = o => (o == null ? '' : typeof o === 'string' ? o : (o[LANG] != null ? o[LANG] : o.en));
  const setLang = l => { LANG = l; store.set('lang', l); document.documentElement.lang = l; document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr'; };

  // ---------- the rules every game gets (shown on the engine page; each names where it lives) ----------
  const RULES = [
    { id: 'goal', he: 'המטרה בתמונה ובקול, תוך 3 שניות', en: 'The goal as a picture and a voice, in 3 seconds', where: 'goalCard()' },
    { id: 'inside', he: 'המיומנות מחליטה מה הפעולה מקבלת: אין תיבת שאלה', en: 'The skill decides what the action accepts: no question box', where: 'skill.fits()' },
    { id: 'every', he: 'כל נגיעה עונה: פיצוץ קטן וצליל', en: 'Every touch answers: a pop and a sound', where: 'ctx.good() · ctx.tap()' },
    { id: 'oops', he: 'טעות היא קפיצה מצחיקה, אף פעם לא איקס אדום', en: 'Wrong is a funny bounce, never a red X', where: 'ctx.oops()' },
    { id: 'twist', he: 'טוויסט באמצע הסיבוב', en: 'A twist halfway through', where: 'progress ≥ ½ → twist()' },
    { id: 'made', he: 'הסוף מראה מה נעשה, בלי דירוג', en: 'The end shows what was made, no ranking', where: 'done()' },
    { id: 'home', he: 'מה שנעשה עובר לממלכה', en: 'What was made goes home to the kingdom', where: 'recipe.leaves' },
    { id: 'ladder', he: 'הרמה זזה לשני הכיוונים', en: 'Levels move both ways', where: 'ladderAfter()' }
  ];

  // ---------- registries ----------
  const action = (id, def) => { ACTIONS[id] = Object.assign({ id }, def); };
  const skill = (id, def) => { SKILLS[id] = Object.assign({ id }, def); };
  const place = (id, def) => { PLACES[id] = Object.assign({ id }, def); };

  /* the goal: a recipe may write its own picture or line; whatever it leaves out, the place shows and the skill says */
  function goalOf(r, level) {
    const S = SKILLS[r.skill], P = PLACES[r.place], kit = P && P[r.action], g = r.goal || {};
    const said = S && (typeof S.goal === 'function' ? S.goal(level || 1) : S.goal);
    return { pic: 'pic' in g ? g.pic : kit && kit.goalPic, say: g.say || said };
  }
  function leavesOf(r) {
    if (r.leaves) return r.leaves;
    const P = PLACES[r.place], kit = P && P[r.action];
    return kit && kit.leaves;
  }

  /* KQE.check: the engine refuses a recipe that would break a rule. Every problem names the rule and says why in plain words. */
  const WHY = {
    noAction: { he: 'אין פעולה כזאת במנוע', en: 'The engine has no such action' },
    noSkill: { he: 'אין מיומנות כזאת', en: 'There is no such skill' },
    skillNotForAction: { he: 'המיומנות הזאת לא עובדת עם הפעולה הזאת', en: 'This skill does not work with this action' },
    noPlace: { he: 'אין מקום כזה', en: 'There is no such place' },
    placeNotForAction: { he: 'למקום הזה אין ערכה לפעולה הזאת', en: 'This place has no kit for this action' },
    noGoalPic: { he: 'אין תמונת מטרה: ילד שעוד לא קורא לא ידע מה לעשות', en: "No goal picture: a child who can't read yet wouldn't know what to do" },
    noGoalSay: { he: 'אין משפט מטרה לקול', en: 'No goal line for the voice' },
    goalTooLong: { he: 'משפט המטרה ארוך מדי לשלוש שניות', en: 'The goal line is too long for 3 seconds' },
    noLeaves: { he: 'לא ברור מה עובר לממלכה בסוף', en: 'Nothing says what goes home to the kingdom' }
  };
  const RULE_OF = { noAction: 'inside', noSkill: 'inside', skillNotForAction: 'inside', noPlace: 'goal', placeNotForAction: 'goal', noGoalPic: 'goal', noGoalSay: 'goal', goalTooLong: 'goal', noLeaves: 'home' };
  function check(r) {
    const out = [], add = (code, extra) => out.push({ code, rule: RULE_OF[code], why: WHY[code], extra });
    const A = ACTIONS[r.action], S = SKILLS[r.skill], P = PLACES[r.place];
    if (!A) add('noAction');
    if (!S) add('noSkill'); else if (A && !S.actions.includes(r.action)) add('skillNotForAction');
    if (!P) add('noPlace'); else if (A && !P[r.action]) add('placeNotForAction');
    const g = goalOf(r), keys = window.KQIcons ? KQIcons.iconKeys() : [];
    if (!g || !g.pic || (keys.length && !keys.includes(g.pic))) add('noGoalPic');
    for (const l of ['he', 'en']) { const s = g && g.say && g.say[l]; if (!s) add('noGoalSay', l); else if (s.length > 40) add('goalTooLong', l); }
    const lv = leavesOf(r); if (!lv || !lv.pic) add('noLeaves');
    return out;
  }

  // ---------- the ladder: one level per recipe, up after 2 easy rounds, down after 2 hard ones (Yoni 2026-10-17: levels move both ways) ----------
  const ladderKey = r => 'ladder.' + (r.id || [r.action, r.place, r.skill].join('.'));
  function ladder(r) { return Object.assign({ level: 1, easy: 0, hard: 0 }, store.get(ladderKey(r), {})); }
  function ladderAfter(r, misses, steps) {
    const s = ladder(r), rate = steps ? misses / steps : 0;
    if (rate <= 0.15) { s.easy++; s.hard = 0; } else if (rate >= 0.45) { s.hard++; s.easy = 0; } else { s.easy = 0; s.hard = 0; }
    let moved = 0;
    if (s.easy >= 2 && s.level < 5) { s.level++; s.easy = 0; moved = 1; }
    if (s.hard >= 2 && s.level > 1) { s.level--; s.hard = 0; moved = -1; }
    store.set(ladderKey(r), s); return { level: s.level, moved };
  }

  // ---------- sound: the kingdom's own effects + a synthesized boing for a wrong pick (never the Mac's sound folders) ----------
  let AC = null; const audio = {};
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function sfx(name, vol) { try { let a = audio[name]; if (!a) { a = audio[name] = new Audio(SFX + name + '.mp3'); } const b = a.cloneNode(); b.volume = vol == null ? 0.55 : vol; b.play().catch(() => {}); } catch (e) {} }
  function boing() { const c = ac(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(560, t); o.frequency.exponentialRampToValueAtTime(170, t + 0.32);
    v.frequency.value = 18; vg.gain.value = 30; v.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(c.destination); o.start(t); v.start(t); o.stop(t + 0.4); v.stop(t + 0.4); }

  // ---------- voice: ElevenLabs through the relay, cached per line; on failure the speaker goes quiet, never the device voice ----------
  const VOICE = { cache: new Map(), cur: null };
  function speak(text, btn) {
    if (!text) return; if (VOICE.cur) { try { VOICE.cur.pause(); } catch (e) {} }
    const key = LANG + '|' + text, play = url => { const a = new Audio(url); VOICE.cur = a; a.play().catch(() => {}); if (btn) { btn.classList.add('talk'); a.onended = () => btn.classList.remove('talk'); } };
    if (VOICE.cache.has(key)) return play(VOICE.cache.get(key));
    const body = LANG === 'he' ? { text, lang: 'he', persona: 'mommy' } : { text, lang: 'en' };
    if (btn) btn.classList.add('wait');
    fetch(RELAY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(b => { const u = URL.createObjectURL(b); VOICE.cache.set(key, u); if (btn) btn.classList.remove('wait'); play(u); })
      .catch(() => { if (btn) { btn.classList.remove('wait'); btn.classList.add('off'); } });
  }

  // ---------- small DOM helpers and the drawn glyphs (no emoji anywhere: Yoni 2026-10-19) ----------
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const SVGNS = 'http://www.w3.org/2000/svg';
  /* each glyph: paths on a 24×24 grid; f = filled, otherwise stroked */
  const GLYPHS = {
    speaker: [{ d: 'M4 9h4l5-4v14l-5-4H4z', f: 1 }, { d: 'M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11' }],
    back: [{ d: 'M15 5l-7 7 7 7' }],
    again: [{ d: 'M19 12a7 7 0 1 1-2.05-4.95M19 4v4.5h-4.5' }],
    play: [{ d: 'M8 5l11 7-11 7z', f: 1 }],
    up: [{ d: 'M12 20V5M5.5 11.5L12 5l6.5 6.5' }],
    left: [{ d: 'M18 20v-6a6 6 0 0 0-6-6H5M9.5 3.5L5 8l4.5 4.5' }],
    right: [{ d: 'M6 20v-6a6 6 0 0 1 6-6h7M14.5 3.5L19 8l-4.5 4.5' }],
    erase: [{ d: 'M9 6h11v12H9l-6-6z' }, { d: 'M12 9.5l5 5M17 9.5l-5 5' }],
    home: [{ d: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z' }],
    arrow: [{ d: 'M4 12h15M13 6l6 6-6 6' }],
    check: [{ d: 'M4.5 12.5l5 5 10-11' }],
    stop: [{ d: 'M6 6l12 12M18 6L6 18' }]
  };
  function glyph(name, cls) {
    const w = el('span', 'kqe-g' + (cls ? ' ' + cls : '')), s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    for (const p of GLYPHS[name]) { const e = document.createElementNS(SVGNS, 'path'); e.setAttribute('d', p.d);
      if (p.f) e.setAttribute('fill', 'currentColor'); else { e.setAttribute('fill', 'none'); e.setAttribute('stroke', 'currentColor'); e.setAttribute('stroke-width', '2.6'); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); }
      s.appendChild(e); }
    w.appendChild(s); return w;
  }
  const pic = (key, cls) => { const i = window.KQIcons ? KQIcons.icon(key, cls || '') : el('span'); i.classList.add('kqe-pic'); return i; };

  // ---------- badges drawn on canvas: a number, dice dots, or a short sum ----------
  function badgeTexture(T, b) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = b.ring || '#2b1c10'; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
    g.fillStyle = b.fill || '#fffaf0'; g.beginPath(); g.arc(128, 128, 106, 0, Math.PI * 2); g.fill();
    g.fillStyle = b.ink || '#2b1c10';
    if (b.dots) { const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]], 7: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]], 8: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]], 9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] }[b.dots] || [];
      for (const [x, y] of P) { g.beginPath(); g.arc(128 + x * 50, 128 + y * 50, 19, 0, Math.PI * 2); g.fill(); } }
    else { const t = String(b.text); g.font = '800 ' + (t.length > 4 ? 62 : t.length > 2 ? 84 : 120) + 'px Rubik, "Secular One", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText(t, 128, 136); }
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; return tx;
  }

  // ---------- particles: the pop that answers every right move, the puff of a wrong one ----------
  function makeFx(T, scene) {
    const parts = [], geo = new T.IcosahedronGeometry(0.09, 0), COLORS = [0xffd166, 0xef476f, 0x06d6a0, 0x118ab2, 0xffffff, 0xf78c6b];
    function add(pos, color, v, sc, op) { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color, transparent: true, opacity: op || 1 })); m.position.copy(pos); m.userData.v = v; m.userData.t = 0; m.scale.setScalar(sc); scene.add(m); parts.push(m); }
    function burst(pos, n, scale) { const s0 = scale || 1; for (let i = 0; i < (n || 16); i++) { const a = Math.random() * Math.PI * 2, s = (1.6 + Math.random() * 2.4) * s0; add(pos, COLORS[i % COLORS.length], new T.Vector3(Math.cos(a) * s, 3 + Math.random() * 3 * s0, Math.sin(a) * s), s0); } }
    function puff(pos) { for (let i = 0; i < 7; i++) { const a = Math.random() * Math.PI * 2; add(pos, 0xf2efe6, new T.Vector3(Math.cos(a) * 1.2, 1.5 + Math.random(), Math.sin(a) * 1.2), 2.2, 0.85); } }
    function update(dt) { for (let i = parts.length - 1; i >= 0; i--) { const m = parts[i], u = m.userData; u.t += dt; u.v.y -= 9 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += dt * 6; m.material.opacity = Math.max(0, 1 - u.t / 0.8); if (u.t > 0.8) { scene.remove(m); m.material.dispose(); parts.splice(i, 1); } } }
    return { burst, puff, update };
  }

  // ---------- the page furniture of a round (injected once) ----------
  function css() {
    if (document.getElementById('kqe-css')) return; const s = el('style'); s.id = 'kqe-css'; s.textContent = `
.kqe-stage{position:fixed; inset:0; z-index:50; background:#000; overflow:hidden; font-family:Rubik,"Secular One",system-ui,sans-serif; color:#2b1c10; touch-action:none; user-select:none; -webkit-user-select:none}
.kqe-stage canvas{display:block; width:100%; height:100%}
.kqe-g{display:inline-flex; width:1em; height:1em} .kqe-g svg{width:100%; height:100%}
.kqe-pic.kq-i{width:1em; height:1em; vertical-align:0}
.kqe-top{position:absolute; top:calc(14px + env(safe-area-inset-top,0px)); inset-inline:max(14px, env(safe-area-inset-left,0px)); display:flex; align-items:center; gap:12px; pointer-events:none}
.kqe-btn{pointer-events:auto; display:inline-flex; align-items:center; justify-content:center; gap:8px; min-width:56px; height:56px; padding:0 14px; border-radius:18px; border:0; background:#fffaf0; color:#2b1c10; font:700 20px Rubik,system-ui,sans-serif; box-shadow:0 4px 0 #c9b58a, 0 8px 18px rgba(0,0,0,.18); cursor:pointer}
.kqe-btn:active{transform:translateY(3px); box-shadow:0 1px 0 #c9b58a}
.kqe-btn:focus-visible{outline:3px solid #118ab2; outline-offset:2px}
.kqe-btn .kqe-g{font-size:28px}
.kqe-btn.talk{background:#ffe7a3} .kqe-btn.wait{opacity:.6} .kqe-btn.off{opacity:.35}
.kqe-bar{flex:1; display:flex; align-items:center; gap:10px; max-width:560px; margin-inline:auto; background:rgba(255,250,240,.92); border-radius:999px; padding:6px 10px; box-shadow:0 6px 16px rgba(0,0,0,.16)}
.kqe-bar .kqe-pic{font-size:34px; flex:none}
.kqe-track{flex:1; height:16px; border-radius:999px; background:#e9dcc0; overflow:hidden}
.kqe-fill{height:100%; width:0; border-radius:999px; background:linear-gradient(90deg,#06d6a0,#2f7a3f); transition:width .35s ease}
.kqe-lane{position:absolute; top:calc(92px + env(safe-area-inset-top,0px)); inset-inline-start:max(14px, env(safe-area-inset-left,0px)); width:min(230px, 32vw); display:grid; gap:12px; pointer-events:none}
.kqe-card{background:rgba(255,250,240,.95); border-radius:20px; padding:14px; box-shadow:0 8px 22px rgba(0,0,0,.18)}
.kqe-note{display:flex; gap:10px; align-items:center; font-size:18px; font-weight:700; line-height:1.25; animation:kqe-in .3s ease both}
.kqe-note .kqe-pic{font-size:40px; flex:none}
@keyframes kqe-in{from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:none}}
.kqe-over{position:absolute; inset:0; display:grid; place-items:center; background:rgba(20,14,8,.42); z-index:5}
.kqe-goal{background:#fffaf0; border-radius:28px; padding:26px 30px; display:grid; justify-items:center; gap:14px; max-width:min(520px, 90vw); text-align:center; box-shadow:0 18px 50px rgba(0,0,0,.35); animation:kqe-pop .35s cubic-bezier(.2,1.4,.4,1) both}
@keyframes kqe-pop{from{transform:scale(.7); opacity:0} to{transform:none; opacity:1}}
.kqe-goal .pics{display:flex; align-items:center; gap:18px; font-size:88px}
.kqe-goal .arrow{font-size:42px; color:#8e1f2f}
html[dir=rtl] .kqe-goal .arrow{transform:scaleX(-1)}
.kqe-goal h2{margin:0; font-size:28px; line-height:1.25; font-weight:800}
.kqe-timer{width:100%; height:6px; border-radius:6px; background:#e9dcc0; overflow:hidden} .kqe-timer i{display:block; height:100%; width:100%; background:#8e1f2f; transform-origin:left; animation:kqe-t 3s linear forwards}
html[dir=rtl] .kqe-timer i{transform-origin:right}
@keyframes kqe-t{to{transform:scaleX(0)}}
.kqe-end{background:#fffaf0; border-radius:28px; padding:24px 28px; display:grid; gap:16px; justify-items:center; width:min(560px, 92vw); text-align:center; box-shadow:0 18px 50px rgba(0,0,0,.35); animation:kqe-pop .4s cubic-bezier(.2,1.4,.4,1) both}
.kqe-end h2{margin:0; font-size:26px} .kqe-end p{margin:0; font-size:19px; font-weight:500}
.kqe-made{display:flex; flex-wrap:wrap; justify-content:center; gap:6px; font-size:40px; max-width:100%}
.kqe-made .kqe-pic{animation:kqe-pop .3s ease both}
.kqe-home{display:flex; align-items:center; gap:12px; background:#f3e7cc; border-radius:16px; padding:10px 16px; font-size:18px; font-weight:700}
.kqe-home .kqe-pic{font-size:48px}
.kqe-row{display:flex; gap:12px; flex-wrap:wrap; justify-content:center}
.kqe-lvl{font-size:15px; color:#6b5643; font-weight:500}
.kqe-refuse{background:#fffaf0; border-radius:24px; padding:24px; max-width:min(520px,90vw); display:grid; gap:12px}
.kqe-refuse h2{margin:0; font-size:22px} .kqe-refuse p{margin:0; font-size:17px}
@media (prefers-reduced-motion: reduce){ .kqe-goal,.kqe-end,.kqe-note,.kqe-made .kqe-pic{animation:none} }
`; document.head.appendChild(s); }

  // ---------- KQE.play: build the place, run the action, enforce the six steps ----------
  function play(recipe, host, onExit) {
    const T = window.THREE; css();
    const stage = el('div', 'kqe-stage'); host.appendChild(stage);
    const problems = check(recipe);
    if (problems.length) {   /* fail closed: a broken recipe never becomes a half game */
      const o = el('div', 'kqe-over'), c = el('div', 'kqe-refuse'); c.appendChild(el('h2', null, L({ he: 'המנוע מסרב לבנות את המשחק הזה', en: 'The engine refuses to build this game' })));
      for (const p of problems) c.appendChild(el('p', null, L(p.why) + (p.extra ? ' (' + p.extra + ')' : '')));
      const b = el('button', 'kqe-btn'); b.append(glyph('back'), L({ he: 'חזרה', en: 'Back' })); b.onclick = () => { stage.remove(); onExit && onExit(); }; c.appendChild(b); o.appendChild(c); stage.appendChild(o);
      return { problems };
    }
    const A = ACTIONS[recipe.action], S = SKILLS[recipe.skill], P = PLACES[recipe.place], kit = P[recipe.action];
    const lad = ladder(recipe), goal = goalOf(recipe, lad.level), leaves = leavesOf(recipe);
    const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    stage.appendChild(renderer.domElement);
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(46, 1, 0.1, 400);
    const fx = makeFx(T, scene);
    const rng = (() => { let s = (Date.now() ^ 0x9e3779b9) >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; })();

    /* furniture: exit and speaker in the same corners in every game, the progress path from the hero to the goal picture */
    const top = el('div', 'kqe-top'), exitB = el('button', 'kqe-btn'), spk = el('button', 'kqe-btn'), bar = el('div', 'kqe-bar'), track = el('div', 'kqe-track'), fill = el('div', 'kqe-fill');
    exitB.appendChild(glyph('home')); exitB.setAttribute('aria-label', L({ he: 'יציאה', en: 'Exit' }));
    spk.appendChild(glyph('speaker')); spk.setAttribute('aria-label', L({ he: 'להקשיב למטרה', en: 'Hear the goal' }));
    track.appendChild(fill); bar.append(pic(kit.heroPic || goal.pic), track, pic(goal.pic)); top.append(exitB, bar, spk); stage.appendChild(top);
    const lane = el('div', 'kqe-lane'); stage.appendChild(lane);
    spk.onclick = () => { ac(); speak(L(goal.say), spk); };

    const stats = { good: 0, oops: 0, twisted: false, done: false, progress: 0 };
    let paused = true, inst = null, raf = 0, last = performance.now(), noteTimer = 0;
    const ctx = {
      T, scene, camera, renderer, stage, lane, rng, L, lang: () => LANG, level: lad.level, recipe, skill: S, place: P, kit, fx,
      badge: b => badgeTexture(T, b), glyph, pic, el, sfx, speak,
      good(pos, big) { stats.good++; fx.burst(pos, big ? 34 : 16, big ? 1.6 : 1); sfx('correct', big ? 0.7 : 0.45); },
      oops(pos) { stats.oops++; fx.puff(pos); boing(); },
      tap() { ac(); sfx('tap', 0.35); },
      progress(p) { stats.progress = Math.max(stats.progress, Math.min(1, p)); fill.style.width = (stats.progress * 100).toFixed(1) + '%';
        if (!stats.twisted && stats.progress >= 0.5) { stats.twisted = true; const tw = inst && inst.twist ? inst.twist() : null; if (tw) note(tw.pic, tw.say, 4500); } },
      note, done
    };
    /* notices sit in the side lane, beside the work, never on it (Yoni 2026-10-19), one at a time */
    function note(key, say, ms) { lane.querySelectorAll('.kqe-note').forEach(n => n.remove()); const c = el('div', 'kqe-card kqe-note'); c.append(pic(key), el('span', null, L(say))); lane.prepend(c); clearTimeout(noteTimer); noteTimer = setTimeout(() => c.remove(), ms || 3800); }

    function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (inst && inst.resize) inst.resize(w, h); }
    window.addEventListener('resize', resize);

    /* step 1: the goal as a picture and a voice; gone after 3 s or on a tap; play starts then */
    function goalCard() {
      const o = el('div', 'kqe-over'), c = el('div', 'kqe-goal'), pics = el('div', 'pics'), say = el('button', 'kqe-btn');
      pics.append(pic(kit.heroPic || goal.pic), glyph('arrow', 'arrow'), pic(goal.pic));
      say.append(glyph('speaker')); say.setAttribute('aria-label', L({ he: 'להקשיב', en: 'Listen' })); say.onclick = e => { e.stopPropagation(); ac(); speak(L(goal.say), say); };
      const tm = el('div', 'kqe-timer'); tm.appendChild(el('i'));
      c.append(pics, el('h2', null, L(goal.say)), say, tm, el('div', 'kqe-lvl', L({ he: 'רמה ', en: 'Level ' }) + lad.level)); o.appendChild(c); stage.appendChild(o);
      let gone = false; const go = () => { if (gone) return; gone = true; o.remove(); paused = false; last = performance.now(); if (inst && inst.begin) inst.begin(); };
      o.addEventListener('pointerdown', () => { ac(); go(); }); setTimeout(go, 3000);
    }

    /* steps 5 and 6: what was made, then where it goes in the kingdom. No score against anyone. */
    function done(made) {
      if (stats.done) return; stats.done = true; paused = true;
      const steps = stats.good + stats.oops, lv = ladderAfter(recipe, stats.oops, steps); sfx('round', 0.6);
      setTimeout(() => {
        const o = el('div', 'kqe-over'), c = el('div', 'kqe-end'), row = el('div', 'kqe-made'), home = el('div', 'kqe-home'), btns = el('div', 'kqe-row');
        (made.pics || []).slice(0, 24).forEach((k, i) => { const p = pic(k); p.style.animationDelay = (i * 0.04) + 's'; row.appendChild(p); });
        home.append(pic(leaves.pic), el('span', null, L(leaves.say)));
        const again = el('button', 'kqe-btn'), back = el('button', 'kqe-btn');
        again.append(glyph('again'), L({ he: 'עוד סיבוב', en: 'Play again' })); back.append(glyph('home'), L({ he: 'לממלכה', en: 'To the kingdom' }));
        again.onclick = () => { teardown(); play(recipe, host, onExit); }; back.onclick = () => { teardown(); onExit && onExit(); };
        btns.append(again, back);
        const lvl = el('div', 'kqe-lvl', L({ he: 'רמה ', en: 'Level ' }) + lv.level + (lv.moved > 0 ? L({ he: ' · עולים רמה', en: ' · up a level' }) : lv.moved < 0 ? L({ he: ' · רמה קלה יותר', en: ' · an easier level' }) : ''));
        c.append(el('h2', null, L(made.title || { he: 'זה מה שנעשה', en: 'This is what you made' })), row, el('p', null, L(made.line)), home, lvl, btns); o.appendChild(c); stage.appendChild(o);
      }, 1100);
    }

    function teardown() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); clearTimeout(noteTimer); try { inst && inst.destroy && inst.destroy(); } catch (e) {} renderer.dispose(); stage.remove(); if (VOICE.cur) try { VOICE.cur.pause(); } catch (e) {} window.__kqe = null; }
    exitB.onclick = () => { teardown(); onExit && onExit(); };

    const env = P.build(T, scene, ctx, recipe.action) || {}; inst = A.start(ctx); resize();
    function frame(now) { raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); }
    function step(dt) { if (!paused && inst) inst.update(dt); else if (inst && inst.idle) inst.idle(dt); if (env.update) env.update(dt); fx.update(dt); renderer.render(scene, camera); }
    raf = requestAnimationFrame(frame); goalCard();
    window.__kqe = { recipe, ctx, stats, get inst() { return inst; }, step: (dt, n) => { for (let i = 0; i < (n || 1); i++) step(dt || 1 / 60); }, skipGoal: () => { const o = stage.querySelector('.kqe-over'); if (o) o.dispatchEvent(new Event('pointerdown')); } };
    return { problems: [], teardown };
  }

  window.KQE = { action, skill, place, check, play, goalOf, leavesOf, ladder, RULES, L, setLang, lang: () => LANG, ACTIONS, SKILLS, PLACES, glyph, pic, el, store };
  setLang(LANG);
})();
