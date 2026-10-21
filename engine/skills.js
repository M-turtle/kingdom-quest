/* Kingdom Quest — the engine's skills: what decides right and wrong inside an action. A skill never asks a question; the action asks it
   "does this fit?" (Habgood & Ainsworth 2011: the learning inside the core action, not in quizzes between levels).
   Swallow skills: init(level, lang) → state · spawn(state, rng, mustFit) → item · fits(item, state) · eat(item, state) → { full }
                   face(item, state) → { text | dots | pic } · panel(ctx, state) → { el, render(flash) } · twist(state) → { pic, say } · made(state, n)
   Program skills: repeatsFrom (the level where ×2 ×3 appear) and their own goal line. */
(function () {
  'use strict';
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const range = n => Array.from({ length: n }, (_, i) => i + 1);
  const el = (t, c, x) => KQE.el(t, c, x);
  const PANEL_CSS = `
.kqe-frame{display:grid; grid-template-columns:repeat(5,1fr); gap:5px; direction:ltr}
.kqe-frame i{aspect-ratio:1; border-radius:8px; background:#efe3c8; box-shadow:inset 0 2px 0 rgba(0,0,0,.08); transition:background .25s}
.kqe-frames{display:grid; gap:10px}
.kqe-sum{direction:ltr; text-align:center; font-weight:800; font-size:24px; letter-spacing:.02em}
.kqe-sum b{color:#8e1f2f}
.kqe-flash i{background:#06d6a0 !important}
.kqe-table{direction:ltr; display:grid; gap:3px; font-weight:700; font-size:17px; font-variant-numeric:tabular-nums}
.kqe-table div{padding:3px 8px; border-radius:8px; color:#a8977c}
.kqe-table div.on{background:#ffe7a3; color:#2b1c10}
.kqe-letter{display:grid; place-items:center; font:800 92px/1 "Secular One",Rubik,system-ui,sans-serif; color:#2b1c10; background:#f3e7cc; border-radius:16px; aspect-ratio:1.2}
.kqe-eaten{display:flex; flex-wrap:wrap; gap:4px; font-size:30px; min-height:34px; margin-top:8px}`;
  function css() { if (document.getElementById('kqe-skill-css')) return; const s = el('style'); s.id = 'kqe-skill-css'; s.textContent = PANEL_CSS; document.head.appendChild(s); }
  const COLORS = ['#ef476f', '#118ab2', '#ffd166', '#06d6a0', '#f78c6b', '#8338ec', '#3a86ff'];

  // ---------- make 10 (ages 5–7): swallow numbers that add up to exactly 10; too much and the hole spits it out ----------
  KQE.skill('make-10', {
    actions: ['swallow'], name: { he: 'עושים 10', en: 'Make 10' }, ages: '5–7', pic: 'ten',
    goal: lv => lv >= 4 ? { he: 'בולעים מספרים שעושים 20', en: 'Swallow numbers that make 20' } : { he: 'בולעים מספרים שעושים 10', en: 'Swallow numbers that make 10' },
    init: lv => ({ target: lv >= 4 ? 20 : 10, sum: 0, parts: [], dots: false, tens: 0 }),
    spawn(st, r, mustFit) { const need = st.target - st.sum; if (mustFit) return { n: r() < 0.5 && need <= 9 ? need : 1 + Math.floor(r() * Math.min(9, need)) }; return { n: 1 + Math.floor(r() * 9) }; },
    fits: (d, st) => st.sum + d.n <= st.target,
    eat(d, st) { st.sum += d.n; st.parts.push(d.n); if (st.sum === st.target) { st.tens++; st.sum = 0; st.parts = []; return { full: true }; } return {}; },
    face: (d, st) => (st.dots ? { dots: d.n } : { text: d.n }),
    panel(ctx, st) { css(); const card = el('div', 'kqe-card'), frames = el('div', 'kqe-frames'), sum = el('div', 'kqe-sum'); card.append(frames, sum);
      function render(flash) { frames.replaceChildren(); const cells = []; for (let f = 0; f < st.target / 10; f++) { const fr = el('div', 'kqe-frame' + (flash ? ' kqe-flash' : '')); for (let i = 0; i < 10; i++) { const c = el('i'); fr.appendChild(c); cells.push(c); } frames.appendChild(fr); }
        let k = 0; st.parts.forEach((n, j) => { for (let i = 0; i < n; i++) if (cells[k]) cells[k++].style.background = COLORS[j % COLORS.length]; });
        sum.replaceChildren(); if (st.parts.length) sum.append(st.parts.join(' + ') + ' → '); const b = el('b', null, String(st.target)); sum.appendChild(b); }
      render(); return { el: card, render }; },
    twist: st => { st.dots = true; return { pic: 'dice', say: { he: 'עכשיו המספרים באים בנקודות', en: 'Now the numbers come as dots' } }; },
    made: (st, n) => ({ he: n + ' דברים נבלעו · ' + st.tens + ' פעמים ' + st.target, en: n + ' things swallowed · made ' + st.target + ' ' + st.tens + ' times' })
  });

  // ---------- the 8 times table (ages 8–9; Lily's rule 2026-10-12: it starts with eight times something) ----------
  KQE.skill('times-8', {
    actions: ['swallow'], name: { he: 'לוח הכפל של 8', en: 'The 8 times table' }, ages: '8–9', pic: 'times',
    goal: { he: 'בולעים רק דגים מלוח ה-8', en: 'Swallow only 8 times table fish' },
    init: lv => ({ maxK: lv >= 3 ? 10 : 5, lit: new Set(), tricky: lv >= 4, whole: false }),
    spawn(st, r, mustFit) {
      if (mustFit || r() < 0.5) { const unlit = range(st.maxK).filter(k => !st.lit.has(k)); return { n: 8 * (unlit.length && r() < 0.75 ? pick(unlit, r) : 1 + Math.floor(r() * st.maxK)) }; }
      const k = 1 + Math.floor(r() * st.maxK), base = 8 * k, near = st.tricky ? [4 * (2 * k - 1), 4 * (2 * k + 1)] : [base + 2, base - 2, base + 4, 6 * k, 7 * k, 9 * k];
      const ok = near.filter(n => n > 0 && n % 8 !== 0); return { n: ok.length ? pick(ok, r) : base + 2 }; },
    fits: d => d.n % 8 === 0,
    eat(d, st) { st.lit.add(d.n / 8); if (!st.whole && range(st.maxK).every(k => st.lit.has(k))) { st.whole = true; return { full: true }; } return {}; },
    face: d => ({ text: d.n }),
    panel(ctx, st) { css(); const card = el('div', 'kqe-card'), tb = el('div', 'kqe-table'); card.appendChild(tb);
      function render() { tb.replaceChildren(); for (const k of range(st.maxK)) { const on = st.lit.has(k); tb.appendChild(el('div', on ? 'on' : '', '8 × ' + k + ' = ' + (on ? 8 * k : '?'))); } }
      render(); return { el: card, render }; },
    twist(st) { if (st.maxK < 10) { st.maxK = 10; st.whole = false; return { pic: 'times', say: { he: 'עכשיו עד 8 כפול 10', en: 'Now up to 8 × 10' } }; }
      st.tricky = true; return { pic: 'magnifier', say: { he: 'זהירות: דגים מלוח ה-4 מתחפשים', en: 'Careful: 4 times table fish in disguise' } }; },
    made: (st, n) => ({ he: n + ' דגים נבלעו · ' + st.lit.size + ' שורות בלוח של 8', en: n + ' fish swallowed · ' + st.lit.size + ' rows of the 8 times table' })
  });

  // ---------- the first letter (ages 5–6): swallow only things whose name starts with the letter; pictures, no reading needed ----------
  const WORDS = [['banana', 'בננה', 'banana'], ['balloon', 'בלון', 'balloon'], ['duck', 'ברווז', 'duck'], ['egg', 'ביצה', 'egg'], ['house', 'בית', 'house'],
    ['bear', 'דוב', 'bear'], ['bee', 'דבורה', 'bee'], ['dolphin', 'דולפין', 'dolphin'], ['dragon', 'דרקון', 'dragon'], ['fish', 'דג', 'fish'], ['door', 'דלת', 'door'], ['pumpkin', 'דלעת', 'pumpkin'], ['bucket', 'דלי', 'bucket'], ['dinosaur', 'דינוזאור', 'dinosaur'],
    ['bell', 'פעמון', 'bell'], ['butterfly', 'פרפר', 'butterfly'], ['cow', 'פרה', 'cow'], ['elephant', 'פיל', 'elephant'], ['flower', 'פרח', 'flower'], ['pizza', 'פיצה', 'pizza'], ['penguin', 'פינגווין', 'penguin'],
    ['star', 'כוכב', 'star'], ['crown', 'כתר', 'crown'], ['dog', 'כלב', 'dog'], ['shark', 'כריש', 'shark'], ['basketball', 'כדורסל', 'basketball'],
    ['guitar', 'גיטרה', 'guitar'], ['giraffe', 'ג׳ירפה', 'giraffe'], ['cheese', 'גבינה', 'cheese'], ['bridge', 'גשר', 'bridge'], ['icecream', 'גלידה', 'ice cream'],
    ['apple', 'תפוח', 'apple'], ['drum', 'תוף', 'drum'], ['parrot', 'תוכי', 'parrot'], ['tree', 'עץ', 'tree'], ['cat', 'חתול', 'cat'], ['car', 'מכונית', 'car'], ['moon', 'ירח', 'moon'],
    ['monkey', 'קוף', 'monkey'], ['owl', 'ינשוף', 'owl'], ['pear', 'אגס', 'pear'], ['pig', 'חזיר', 'pig'], ['rabbit', 'ארנב', 'rabbit'], ['rocket', 'טיל', 'rocket'], ['horse', 'סוס', 'horse'],
    ['heart', 'לב', 'heart'], ['lion', 'אריה', 'lion'], ['key', 'מפתח', 'key'], ['kite', 'עפיפון', 'kite'], ['bus', 'אוטובוס', 'bus'], ['bike', 'אופניים', 'bike'], ['bird', 'ציפור', 'bird'],
    ['book', 'ספר', 'book'], ['bread', 'לחם', 'bread'], ['cake', 'עוגה', 'cake'], ['frog', 'צפרדע', 'frog'], ['turtle', 'צב', 'turtle'], ['umbrella', 'מטרייה', 'umbrella'], ['sun', 'שמש', 'sun'],
    ['clock', 'שעון', 'clock'], ['sailboat', 'סירה', 'sailboat'], ['snowflake', 'פתית שלג', 'snowflake'], ['mouse', 'עכבר', 'mouse']].map(([key, he, en]) => ({ key, he, en }));
  const LETTERS = { he: ['ב', 'ד', 'פ', 'כ', 'ג'], en: ['B', 'D', 'C', 'P', 'S'] };
  const first = (w, lang) => (lang === 'he' ? w.he[0] : w.en[0].toUpperCase());
  KQE.skill('starts-with', {
    actions: ['swallow'], name: { he: 'האות הראשונה', en: 'The first letter' }, ages: '5–6', pic: 'letterA',
    goal: lv => { const i = (lv - 1) % 5; return { he: 'בולעים רק מה שמתחיל ב-' + LETTERS.he[i], en: 'Swallow only what starts with ' + LETTERS.en[i] }; },
    init: (lv, lang) => { const li = (lv - 1) % 5; return { lang, li, letter: LETTERS[lang][li], eaten: [] }; },
    spawn(st, r, mustFit) { const yes = WORDS.filter(w => first(w, st.lang) === st.letter), no = WORDS.filter(w => first(w, st.lang) !== st.letter); return { w: (mustFit || r() < 0.42) ? pick(yes, r) : pick(no, r) }; },
    fits: (d, st) => first(d.w, st.lang) === st.letter,
    eat(d, st) { st.eaten.push(d.w.key); return {}; },
    face: d => ({ pic: d.w.key }),
    itemPic: d => d.w.key,
    panel(ctx, st) { css(); const card = el('div', 'kqe-card'), big = el('div', 'kqe-letter'), row = el('div', 'kqe-eaten'); card.append(big, row);
      function render() { big.textContent = st.letter; row.replaceChildren(...st.eaten.slice(-8).map(k => KQE.pic(k))); }
      render(); return { el: card, render }; },
    twist(st) { st.li = (st.li + 1) % 5; st.letter = LETTERS[st.lang][st.li]; const ex = WORDS.find(w => first(w, st.lang) === st.letter);
      return { pic: ex.key, say: { he: 'עכשיו בולעים מה שמתחיל ב-' + st.letter, en: 'Now swallow what starts with ' + st.letter } }; },
    made: (st, n) => ({ he: n + ' דברים נבלעו, כולם מתחילים באות הנכונה', en: n + ' things swallowed, each with the right first letter' })
  });
  KQE.WORDS = WORDS;

  // ---------- program skills: the same action, two ladders (CodeMonkey / Lightbot: one new idea at a time) ----------
  KQE.skill('routes', {
    actions: ['program'], name: { he: 'מסלולים', en: 'Routes' }, ages: '5–9', pic: 'map', repeatsFrom: 2,
    goal: { he: 'בונים תוכנית ואוספים את הכול', en: 'Build a plan, collect them all' }
  });
  KQE.skill('repeats', {
    actions: ['program'], name: { he: 'חזרות', en: 'Repeats' }, ages: '7–10', pic: 'refresh', repeatsFrom: 0,
    goal: { he: 'מעט מהלכים, מסלול ארוך', en: 'Few moves, a long route' }
  });
})();
