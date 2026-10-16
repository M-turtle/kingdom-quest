/* Kingdom Quest — THE PIRATE COVE: four games of its own (registered with KQRealms, played in rooms3d.js halls).
     Cannon Fort      (math)     ships sail past with answers on their sails: fire the cannon at the right one and sink it
     Bottle Beach     (reading)  messages in bottles bob in the surf: the right bottle washes ashore and its scroll unrolls
     The Parrot's Tavern (writing) the parrot squawks a word: it flies to the sign that spells it right
     Treasure Map     (logic)    X marks the spot four times: dig at the right X and a chest of gold rises out of the sand
   Every hall is built here from primitives (no downloaded art), every question comes in English and Hebrew, six age bands. */
(function () {
  'use strict';
  if (!window.KQRealms) return;
  const PI = Math.PI, TAU = PI * 2;

  /* ================================================================== the questions */
  const NOUNS = {
    en: { coins: 'coins', barrels: 'barrels', parrots: 'parrots', balls: 'cannonballs', ships: 'ships', crew: 'pirates', maps: 'maps', chests: 'chests' },
    he: { coins: 'מטבעות', barrels: 'חביות', parrots: 'תוכים', balls: 'כדורי תותח', ships: 'ספינות', crew: 'שודדים', maps: 'מפות', chests: 'תיבות' }
  };
  function cannonQ(band, lang, H) {
    const { ri, pick, near } = H, he = lang === 'he', N = NOUNS[he ? 'he' : 'en'], k = Math.random();
    const mk = (q, a, step) => ({ q, a, ch: near(a, 4, step || 1) });
    if (band <= 1) { const a = ri(2, 7), b = ri(1, 10 - a);
      if (k < 0.35) return mk(he ? `לקפטן יש ${a} ${N.coins}, והוא מוצא עוד ${b}. כמה ${N.coins} יש לו עכשיו?` : `The captain has ${a} ${N.coins} and finds ${b} more. How many ${N.coins} now?`, a + b);
      if (k < 0.6) { const m = a + b; return mk(he ? `על הסיפון יש ${m} ${N.barrels}. ${b} מתגלגלות לים. כמה נשארו?` : `There are ${m} ${N.barrels} on deck. ${b} roll into the sea. How many are left?`, m - b); }
      return k < 0.8 ? mk(`${a} + ${b} = ?`, a + b) : mk(`${a + b} − ${b} = ?`, a); }
    if (band === 2) { const a = ri(8, 30), b = ri(3, 19);
      if (k < 0.3) return mk(he ? `${a} ${N.parrots} על התורן. ${Math.min(b, a - 1)} עפים משם. כמה נשארו?` : `${a} ${N.parrots} sit on the mast. ${Math.min(b, a - 1)} fly away. How many stay?`, a - Math.min(b, a - 1));
      if (k < 0.55) return mk(`? + ${b} = ${a + b}`, a);
      return k < 0.8 ? mk(`${a} + ${b} = ?`, a + b) : mk(`${a + b} − ${a} = ?`, b); }
    if (band === 3) { const x = ri(2, 9), y = ri(3, 9);
      if (k < 0.3) return mk(he ? `ל-${x} ${N.ships} יש ${y} תותחים לכל אחת. כמה תותחים בסך הכול?` : `${x} ${N.ships} have ${y} cannons each. How many cannons in all?`, x * y, 2);
      if (k < 0.55) return mk(he ? `${x * y} ${N.coins} מתחלקים שווה בשווה בין ${x} ${N.crew}. כמה מקבל כל אחד?` : `${x * y} ${N.coins} are shared equally by ${x} ${N.crew}. How many does each get?`, y);
      return k < 0.8 ? mk(`${x} × ${y} = ?`, x * y, 2) : mk(`${x * y} ÷ ${x} = ?`, y); }
    if (band === 4) { const a = ri(40, 90), b = ri(12, 35), c = ri(8, 30);
      if (k < 0.35) return mk(he ? `בתיבה יש ${a} ${N.coins}. הצוות לוקח ${b}, ואחר כך מוצא עוד ${c}. כמה יש עכשיו?` : `A chest holds ${a} ${N.coins}. The crew takes ${b}, then finds ${c} more. How many now?`, a - b + c, 2);
      const x = ri(12, 48), y = ri(3, 9); if (k < 0.65) return mk(`${x} × ${y} = ?`, x * y, 3);
      const z = ri(3, 9); return mk(`${x} × ${z} + ${c} = ?`, x * z + c, 2); }
    if (band === 5) { const p = pick([10, 20, 25, 50, 75]), n = pick([40, 60, 80, 120, 160, 200]);
      if (k < 0.4) return mk(he ? `${p}% מתוך ${n} ${N.coins} הם כמה ${N.coins}?` : `${p}% of ${n} ${N.coins} is how many ${N.coins}?`, n * p / 100, 5);
      const d = pick([3, 4, 5]), m = pick([1, 2, 3].filter(v => v < d && (d % v !== 0 || v === 1))), t = d * ri(4, 12);   /* fractions in lowest terms */ if (k < 0.75) return mk(he ? `${m}/${d} מתוך ${t} ${N.barrels} הם כמה ${N.barrels}?` : `${m}/${d} of ${t} ${N.barrels} is how many ${N.barrels}?`, t / d * m, 2);
      const a = ri(8, 24), b = ri(2, a - 2); return mk(he ? `פעמון צלילה נמצא ${a} מטרים מתחת לים ועולה ${b} מטרים. איפה הוא עכשיו? (מתחת לים זה מינוס)` : `A diving bell is ${a} m below the sea and rises ${b} m. Where is it now? (below the sea is minus)`, b - a); }
    const a = ri(2, 9), x = ri(2, 12), b = ri(1, 20);
    if (k < 0.5) return mk(`${a}x + ${b} = ${a * x + b}. x = ?`, x);
    const s = ri(4, 13), t2 = ri(3, 30); return mk(`${s}² − ${t2} = ?`, s * s - t2, 3);
  }

  /* messages in bottles: a sentence with a word missing (pirate stories, three reading levels) */
  const CLOZE = {
    en: [
      [['The pirate sails a big ___.', 'ship', ['cat', 'cake', 'sock']], ['The parrot can ___ in the sky.', 'fly', ['bark', 'knit', 'melt']], ['The gold is in the ___.', 'chest', ['soup', 'shoe', 'cloud']], ['A crab walks on the ___.', 'sand', ['moon', 'bed', 'cake']], ['The captain looks through a ___.', 'telescope', ['sandwich', 'pillow', 'carrot']], ['At night the ___ shines on the waves.', 'moon', ['shoe', 'bread', 'chair']], ['We row the little ___ to the island.', 'boat', ['horse', 'cake', 'lamp']], ['Fish swim in the ___.', 'sea', ['tree', 'oven', 'bed']]],
      [['The map showed where the treasure was ___.', 'buried', ['singing', 'sleeping', 'melted']], ['Dark clouds meant a ___ was coming.', 'storm', ['picnic', 'birthday', 'lesson']], ['The crew cheered when they saw ___ on the horizon.', 'land', ['soup', 'homework', 'socks']], ['The old wooden deck ___ under their feet.', 'creaked', ['giggled', 'whistled', 'blinked']], ['The captain used a ___ to find north.', 'compass', ['spoon', 'pillow', 'ladder']], ['Waves ___ against the rocks all night.', 'crashed', ['baked', 'knitted', 'painted']], ['The parrot repeated every word it ___.', 'heard', ['ate', 'painted', 'planted']], ['The treasure chest was too ___ to lift alone.', 'heavy', ['hungry', 'sleepy', 'noisy']], ['Lanterns ___ the dark harbor.', 'lit', ['ate', 'drank', 'sang']]],
      [["The captain's orders were ___: nobody could misunderstand them.", 'explicit', ['fragile', 'reluctant', 'temporary']], ['After weeks at sea, the ___ crew finally reached the harbor.', 'exhausted', ['transparent', 'delicious', 'punctual']], ['The storm was so ___ that even the old sailors were afraid.', 'ferocious', ['microscopic', 'generous', 'polite']], ['The map was ___: half the island was missing.', 'incomplete', ['enormous', 'generous', 'obedient']], ['The pirates ___ the treasure among the whole crew.', 'divided', ['admired', 'invented', 'forgave']], ['Fog made the rocks nearly ___ until it was too late.', 'invisible', ['delicious', 'audible', 'punctual']], ["The lighthouse keeper's warning ___ the ship from disaster.", 'saved', ['baked', 'borrowed', 'painted']], ['Only a ___ navigator could cross the reef at night.', 'skilled', ['clumsy', 'careless', 'reckless']], ['The crew ___ the torn sail before the next storm.', 'repaired', ['swallowed', 'forgot', 'painted']]]
    ],
    he: [
      [['השודד מפליג ב___ גדולה.', 'ספינה', ['עוגה', 'נעל', 'כרית']], ['התוכי יכול ___ בשמיים.', 'לעוף', ['לנבוח', 'לסרוג', 'להימס']], ['הזהב נמצא ב___.', 'תיבה', ['מרק', 'נעל', 'ענן']], ['סרטן הולך על ה___.', 'חול', ['ירח', 'מיטה', 'שולחן']], ['הקפטן מסתכל ב___.', 'משקפת', ['כרית', 'גזר', 'עוגה']], ['בלילה ה___ מאיר על הגלים.', 'ירח', ['נעל', 'לחם', 'כיסא']], ['חותרים בסירה אל ה___.', 'אי', ['תנור', 'מקרר', 'ארון']], ['דגים שוחים ב___.', 'ים', ['עץ', 'תנור', 'מיטה']]],
      [['המפה הראתה איפה האוצר ___.', 'קבור', ['שר', 'ישן', 'נמס']], ['עננים שחורים סימנו ש___ מתקרבת.', 'סערה', ['מסיבה', 'ארוחה', 'עוגה']], ['הצוות הריע כשראו ___ באופק.', 'יבשה', ['מרק', 'שיעורי בית', 'גרביים']], ['הסיפון הישן ___ תחת רגליהם.', 'חרק', ['צחק', 'שרק', 'מצמץ']], ['הקפטן השתמש ב___ כדי למצוא את הצפון.', 'מצפן', ['כף', 'כרית', 'סולם']], ['הגלים ___ בסלעים כל הלילה.', 'התנפצו', ['נאפו', 'נסרגו', 'צוירו']], ['התוכי חזר על כל מילה ש___.', 'שמע', ['אכל', 'צייר', 'שתל']], ['תיבת האוצר הייתה ___ מכדי להרים לבד.', 'כבדה', ['רעבה', 'ישנונית', 'רועשת']], ['פנסים ___ את הנמל החשוך.', 'האירו', ['אכלו', 'שתו', 'שרו']]],
      [['הפקודות של הקפטן היו ___: אי אפשר היה לטעות בהן.', 'מפורשות', ['שבירות', 'מהוססות', 'זמניות']], ['אחרי שבועות בים, הצוות ה___ הגיע סוף סוף לנמל.', 'מותש', ['שקוף', 'טעים', 'דייקן']], ['הסערה הייתה כל כך ___ שאפילו המלחים הוותיקים פחדו.', 'אכזרית', ['זעירה', 'נדיבה', 'מנומסת']], ['המפה הייתה ___: חצי מהאי היה חסר בה.', 'חלקית', ['עצומה', 'נדיבה', 'צייתנית']], ['השודדים ___ את האוצר בין כל אנשי הצוות.', 'חילקו', ['הערצו', 'המציאו', 'סלחו']], ['הערפל הסתיר את הסלעים, והם היו כמעט ___.', 'בלתי נראים', ['טעימים', 'רועשים', 'דייקנים']], ['האזהרה של שומר המגדלור ___ את הספינה מאסון.', 'הצילה', ['אפתה', 'שאלה', 'צבעה']], ['רק נווט ___ יכול לחצות את השונית בלילה.', 'מיומן', ['מגושם', 'רשלני', 'פזיז']], ['הצוות ___ את המפרש הקרוע לפני הסערה הבאה.', 'תיקן', ['בלע', 'שכח', 'צבע']]]
    ]
  };
  function bottlesQ(band, lang, H) { const L = CLOZE[lang === 'he' ? 'he' : 'en'], tier = band <= 2 ? 0 : band <= 4 ? 1 : 2, it = H.pick(L[tier]); return { q: it[0], a: it[1], ch: H.shuffle([it[1]].concat(it[2])) }; }

  /* the parrot's words: pictures from the icon atlas, three lengths; misspellings the way children really make them */
  const PWORDS = {
    en: [[['map', 'map'], ['coin', 'coin'], ['crab', 'crab'], ['flag', 'pirateflag'], ['ship', 'sailboat'], ['fish', 'fish'], ['shell', 'shell'], ['key', 'oldkey'], ['bell', 'bell']],
         [['parrot', 'parrot'], ['anchor', 'anchor'], ['island', 'island'], ['cannon', 'cannon'], ['chest', 'chest'], ['shark', 'shark'], ['octopus', 'octopus'], ['lantern', 'lantern'], ['dagger', 'dagger']],
         [['treasure', 'chest'], ['compass', 'compass'], ['telescope', 'telescope'], ['lightning', 'lightning'], ['hourglass', 'hourglass'], ['volcano', 'volcano'], ['whirlpool', 'swirl'], ['navigator', 'shipwheel'], ['thunderstorm', 'storm']]],
    he: [[['מפה', 'map'], ['מטבע', 'coin'], ['סרטן', 'crab'], ['דגל', 'pirateflag'], ['סירה', 'sailboat'], ['דג', 'fish'], ['צדף', 'shell'], ['מפתח', 'oldkey'], ['פעמון', 'bell']],
         [['תוכי', 'parrot'], ['עוגן', 'anchor'], ['תותח', 'cannon'], ['תיבה', 'chest'], ['כריש', 'shark'], ['תמנון', 'octopus'], ['פנס', 'lantern'], ['פגיון', 'dagger'], ['גלגל הגה', 'shipwheel']],
         [['אוצר', 'chest'], ['מצפן', 'compass'], ['טלסקופ', 'telescope'], ['ברק', 'lightning'], ['שעון חול', 'hourglass'], ['הר געש', 'volcano'], ['מערבולת', 'swirl'], ['סופת רעמים', 'storm'], ['מגדלור', 'lantern']]]
  };
  const FIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' }, UNFIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  const heNorm = w => w.split(' ').map(p => p.split('').map((c, i, a) => i === a.length - 1 ? (FIN[c] || c) : (UNFIN[c] || c)).join('')).join(' ');
  const HE_SUB = { 'א': 'ע', 'ע': 'א', 'ט': 'ת', 'ת': 'ט', 'כ': 'ח', 'ח': 'כ', 'ק': 'כ', 'ס': 'ש', 'ש': 'ס', 'ב': 'ו', 'ו': 'ב' };
  function misspell(w, he, H) {
    const out = new Set(); let g = 0;
    while (out.size < 3 && g++ < 200) { const k = Math.random(), i = H.ri(0, Math.max(0, w.length - 2)); let m;
      if (he) { const base = w.split('').map(c => UNFIN[c] || c); const j = H.ri(0, base.length - 1);
        if (k < 0.5 && HE_SUB[base[j]]) { base[j] = HE_SUB[base[j]]; m = base.join(''); }
        else if (k < 0.75) { const pos = H.ri(1, base.length - 1); if (base[pos] === ' ' || base[pos - 1] === ' ') continue; base.splice(pos, 0, H.pick(['ו', 'י'])); m = base.join(''); }
        else { const vi = base.findIndex((c, q) => q > 0 && (c === 'ו' || c === 'י')); if (vi < 0) continue; base.splice(vi, 1); m = base.join(''); }
        m = heNorm(m); }
      else { if (k < 0.3) m = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); else if (k < 0.5) { const d = Math.max(1, i); m = w.slice(0, d) + w.slice(d + 1); } else if (k < 0.65) m = w.slice(0, i) + w[i] + w.slice(i); else { const V = { a: 'e', e: 'i', i: 'e', o: 'u', u: 'o', c: 'k', k: 'c', s: 'z' }; const idx = [...w].map((c, q) => V[c] ? q : -1).filter(q => q >= 0); if (!idx.length) continue; const q = H.pick(idx); m = w.slice(0, q) + V[w[q]] + w.slice(q + 1); } }
      if (m && m !== w && m.trim().length >= 2 && !(H.rude && H.rude(m))) out.add(m); }   /* the shared rude-word and slur filter (2026-09-26: 'flag' minus the l) */
    return [...out];
  }
  function parrotQ(band, lang, H) { const he = lang === 'he', L = PWORDS[he ? 'he' : 'en'], tier = band <= 2 ? 0 : band <= 4 ? 1 : 2, it = H.pick(L[tier]); const w = it[0]; return { q: he ? 'התוכי צורח מילה. איך כותבים אותה נכון?' : 'The parrot squawks a word. Which is spelled right?', icon: it[1], a: w, ch: H.shuffle([w].concat(misspell(w, he, H))) }; }

  /* the treasure map: patterns, steps, grids, clues and codes */
  const HE_AB = 'אבגדהוזחטיכלמנסעפצקרשת';
  function mapQ(band, lang, H) {
    const { ri, pick, shuffle, near } = H, he = lang === 'he';
    const ITEMS = he ? ['מטבע', 'צדף', 'סרטן', 'כוכב', 'דג', 'עוגן'] : ['coin', 'shell', 'crab', 'star', 'fish', 'anchor'];
    const NEXT = he ? 'מה בא אחר כך?' : 'What comes next?';
    if (band <= 1) { const [a, b, x3, x4] = shuffle(ITEMS); const pat = Math.random() < 0.5 ? [a, b, a, b, a] : [a, a, b, a, a]; return { q: `${NEXT} ${pat.join(', ')}, ?`, a: b, ch: shuffle([a, b, x3, x4]) }; }   /* A B A B A → B, and A A B A A → B */
    if (band === 2) { const s = ri(1, 9), st = pick([2, 3, 5, 10]); const seq = [0, 1, 2, 3].map(i => s + i * st); return { q: `${NEXT} ${seq.join(', ')}, ?`, a: s + 4 * st, ch: near(s + 4 * st, 4, 1) }; }
    if (band === 3) { if (Math.random() < 0.5) { const s = ri(1, 5); const seq = [s, s * 2, s * 4, s * 8]; return { q: `${NEXT} ${seq.join(', ')}, ?`, a: s * 16, ch: near(s * 16, 4, 2) }; }
      const a = ri(2, 6), b = ri(2, 7); return { q: he ? `התיבה נמצאת ${a} צעדים שמאלה מהדקל, והדקל ${b} צעדים שמאלה מהסלע. כמה צעדים בין התיבה לסלע?` : `The chest is ${a} steps left of the palm, and the palm is ${b} steps left of the rock. How many steps from the chest to the rock?`, a: a + b, ch: near(a + b, 4, 1) }; }
    if (band === 4) { const x = ri(1, 5), y = ri(1, 5), dx = ri(1, 4), dy = ri(1, 4); const P = (p, q) => `(${p}, ${q})`; const ans = P(x + dx, y + dy); const ch = shuffle([ans, P(x + dx - 1, y + dy), P(x + dx, y + dy + 1), P(x + dy, y + dx) === ans ? P(x + dx + 1, y + dy) : P(x + dy, y + dx)]); return { q: he ? `על המפה יוצאים מהנקודה ${P(x, y)}, זזים ${dx} ימינה ו-${dy} למעלה. לאן מגיעים?` : `On the map, start at ${P(x, y)}. Move ${dx} right and ${dy} up. Where are you?`, a: ans, ch: [...new Set(ch)].length === 4 ? ch : shuffle([ans, P(x + dx + 1, y + dy), P(x + dx, y + dy - 1), P(x + dx - 1, y + dy + 1)]) }; }
    if (band === 5) { const PL = he ? ['מתחת לדקל', 'במערה', 'מתחת לסלע', 'בספינה'] : ['under the palm', 'in the cave', 'under the rock', 'on the ship']; const opts = shuffle(PL).slice(0, 3); const ans = opts[2]; return { q: he ? `האוצר נמצא ${opts[0]}, ${opts[1]} או ${opts[2]}. הוא לא ${opts[0]}, והוא לא ${opts[1]}. איפה הוא?` : `The treasure is ${opts[0]}, ${opts[1]} or ${opts[2]}. It is not ${opts[0]}, and it is not ${opts[1]}. Where is it?`, a: ans, ch: shuffle(PL) }; }
    /* band 6: the pirates' code — every letter moves one step on */
    if (he) { const W = pick(['מפה', 'אוצר', 'סירה', 'דגל', 'חבל', 'תיבה']); const sh = (w, d) => heNorm(w.split('').map(c => { const b = UNFIN[c] || c, i = HE_AB.indexOf(b); return i < 0 ? c : HE_AB[(i + d + HE_AB.length) % HE_AB.length]; }).join('')); const ans = sh(W, 1); return { q: `בצופן של השודדים כל אות זזה אות אחת קדימה (א ← ב). איך כותבים "${W}" בצופן?`, a: ans, ch: shuffle([...new Set([ans, sh(W, -1), sh(W, 2), heNorm(ans.split('').reverse().join(''))])]).concat([sh(W, 3)]).slice(0, 4) }; }
    const W = pick(['MAP', 'GOLD', 'SHIP', 'SAIL', 'MAST', 'ROPE']); const sh = (w, d) => w.split('').map(c => String.fromCharCode(65 + ((c.charCodeAt(0) - 65 + d + 26) % 26))).join(''); const ans = sh(W, 1);
    return { q: `In the pirates' code every letter moves one step on (A → B). How is "${W}" written in code?`, a: ans, ch: shuffle([...new Set([ans, sh(W, -1), sh(W, 2), ans.split('').reverse().join('')])]).concat([sh(W, 3)]).slice(0, 4) };
  }

  /* ================================================================== the halls */
  function canvasTex(T, w, h, paint, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
  /* an open sky for the halls that look out to sea (the room's own background is a flat colour) */
  function skyDome(c, top, hor, stars) { const { T, scene } = c; const m = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new T.Color(top) }, hor: { value: new T.Color(hor) } }, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(hor, top, smoothstep(-0.02, 0.5, h)), 1.0); }' }); const d = new T.Mesh(new T.SphereGeometry(90, 32, 16), m); d.renderOrder = -2; scene.add(d);
    if (stars) { const g = new T.BufferGeometry(), p = []; for (let i = 0; i < 600; i++) { const a = Math.random() * TAU, e = 0.08 + Math.random() * 1.2, r = 85; p.push(r * Math.cos(e) * Math.cos(a), r * Math.sin(e), r * Math.cos(e) * Math.sin(a)); } g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.9 }))); } return d; }
  /* the sea: a wide plane that heaves and shimmers */
  function sea(c, o) { const { T, scene, updaters } = c; o = Object.assign({ w: 90, d: 60, z: -30, y: 0.05, color: 0x1a6a78, deep: 0x06222c, foam: '#d8fff6' }, o);
    const tex = canvasTex(T, 256, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#' + new T.Color(o.color).getHexString()); gr.addColorStop(1, '#' + new T.Color(o.deep).getHexString()); x.fillStyle = gr; x.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { x.strokeStyle = o.foam; x.globalAlpha = 0.12 + Math.random() * 0.35; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const y = Math.random() * h, x0 = Math.random() * w; x.moveTo(x0, y); x.quadraticCurveTo(x0 + 20, y + 4, x0 + 40 + Math.random() * 40, y); x.stroke(); } x.globalAlpha = 1; }, [8, 6]);
    const g = new T.PlaneGeometry(o.w, o.d, 60, 40); g.rotateX(-PI / 2); const base = Float32Array.from(g.attributes.position.array);
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.12, metalness: 0.1, envMapIntensity: 1.2, emissive: new T.Color(o.color).multiplyScalar(0.25) })); m.position.set(0, o.y, o.z); m.receiveShadow = true; scene.add(m);
    updaters.push((dt, tm) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.setY(i, Math.sin(x * 0.22 + tm * 1.3) * 0.18 + Math.sin(z * 0.3 + tm * 1.7 + x * 0.1) * 0.14); } p.needsUpdate = true; g.computeVertexNormals(); tex.offset.x += dt * 0.012; tex.offset.y += dt * 0.006; });
    return m; }
  /* a sand shore that runs down under the waterline (the halls that meet the sea have no round floor) */
  function shore(c, o) { const { T, scene } = c; o = Object.assign({ w: 90, d: 30, z: 10, edge: -3, col: '#d8c08a', col2: '#b89a62' }, o); const tex = c.wallTex('sand', o.col, o.col2); tex.repeat.set(14, 5); const g = new T.PlaneGeometry(o.w, o.d, 40, 20); g.rotateX(-PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i) + o.z, t = (z - o.edge) / 6; const x = p.getX(i); p.setY(i, t < 1 ? -0.5 + Math.max(0, t) * 0.5 : (Math.hypot(x, z) > 12 ? Math.sin(x * 0.3) * Math.cos(z * 0.2) * 0.12 : 0)); }   /* flat where the game is played, gently rolling beyond */ g.computeVertexNormals(); const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, roughness: 1 })); m.position.z = o.z; m.receiveShadow = true; scene.add(m); return m; }
  function palm(c, x, z, h, lean, sc) { const { T, scene, M } = c; const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(sc || 1); scene.add(g); const bark = M(0x7a5a3a, { roughness: 0.95 }), leaf = M(0x2f8a3a, { side: T.DoubleSide, roughness: 0.8 }), leaf2 = M(0x4aa84a, { side: T.DoubleSide, roughness: 0.8 });
    const pts = []; for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push(new T.Vector3(Math.sin(k * 1.4) * lean * k, k * h, 0)); } const curve = new T.CatmullRomCurve3(pts); const trunk = new T.Mesh(new T.TubeGeometry(curve, 16, 0.26, 8, false), bark); trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 9; i++) { const p = curve.getPointAt(i / 9); const ring = new T.Mesh(new T.TorusGeometry(0.28, 0.06, 5, 12), bark); ring.position.copy(p); ring.rotation.x = PI / 2; g.add(ring); }
    const top = curve.getPointAt(1); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, fg = new T.PlaneGeometry(0.9, 3.4, 1, 6); fg.translate(0, 1.7, 0); const p = fg.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setZ(k, -Math.pow(y / 3.4, 2) * 1.6); } fg.computeVertexNormals(); const f = new T.Mesh(fg, i % 2 ? leaf : leaf2); f.position.copy(top); f.rotation.set(-0.9, a, 0, 'YXZ'); f.castShadow = true; g.add(f); }
    for (let i = 0; i < 3; i++) { const co = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), M(0x5a3a1a)); co.position.copy(top).add(new T.Vector3(Math.cos(i * 2.1) * 0.25, -0.25, Math.sin(i * 2.1) * 0.25)); g.add(co); } return g; }
  function lanternPost(c, x, z, h, light) { const { T, scene, cyl, box, flame, woodDark, iron } = c; const g = new T.Group(); g.position.set(x, 0, z); scene.add(g); cyl(0.1, 0.13, h, woodDark, 0, h / 2, 0, g, 8); box(0.9, 0.08, 0.08, woodDark, 0.4, h - 0.1, 0, g); const cage = new T.Group(); cage.position.set(0.8, h - 0.6, 0); g.add(cage); for (const [a, b] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) box(0.03, 0.46, 0.03, iron, a, 0, b, cage); c.cone(0.24, 0.2, iron, 0, 0.32, 0, cage, 4); flame(cage, 0, -0.18, 0, 0.3); if (light) { const l = new T.PointLight(0xffa850, 5, 12, 1.4); l.position.set(0.8, h - 0.5, 0); g.add(l); } return g; }
  function barrelProp(c, x, y, z, s, g) { const { T, M, cyl } = c; const b = new T.Group(); b.position.set(x, y, z); b.scale.setScalar(s || 1); (g || c.scene).add(b); const lg = new T.LatheGeometry([[0.001, -0.55], [0.36, -0.55], [0.44, -0.3], [0.47, 0], [0.44, 0.3], [0.36, 0.55], [0.001, 0.55]].map(p => new T.Vector2(p[0], p[1])), 16); const body = new T.Mesh(lg, M(0x7a5230, { roughness: 0.8 })); body.castShadow = true; b.add(body); for (const y2 of [-0.38, 0.38]) { const r = new T.Mesh(new T.TorusGeometry(0.445, 0.03, 4, 20), M(0x2e2a26, { metalness: 0.6, roughness: 0.5 })); r.rotation.x = PI / 2; r.position.y = y2; b.add(r); } return b; }
  function chestMesh(c, s) { const { T, M, box } = c; const g = new T.Group(); g.scale.setScalar(s || 1); const wd = M(0x6a3e1e, { roughness: 0.75 }), gd = M(0xe8b64a, { metalness: 1, roughness: 0.3, emissive: 0x3a2400, emissiveIntensity: 0.3 }); box(1.4, 0.8, 0.9, wd, 0, 0.4, 0, g); for (const x of [-0.5, 0.5]) box(0.1, 0.84, 0.94, gd, x, 0.4, 0, g); const lid = new T.Group(); lid.position.set(0, 0.8, -0.45); g.add(lid); const top = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 1.4, 16, 1, false, 0, PI), wd); top.rotation.z = PI / 2; top.rotation.y = PI / 2; top.position.z = 0.45; lid.add(top); for (const x of [-0.5, 0.5]) { const b2 = new T.Mesh(new T.TorusGeometry(0.46, 0.05, 6, 16, PI), gd); b2.rotation.y = PI / 2; b2.position.set(x, 0, 0.45); lid.add(b2); } box(0.24, 0.26, 0.08, gd, 0, 0.62, 0.47, g); g.userData.lid = lid; return g; }
  function cave(c, o) { const { T, scene, M, R } = c; o = o || {};
    /* rock boulders and stalactites ringing the hall, so it reads as a sea cave, not a round room */
    const rockM = M(0x3a4446, { roughness: 1 }); for (let i = 0; i < 26; i++) { const a = R(-1.7, 1.7) + PI * 1.5, r = R(13, 16.5); const b = new T.Mesh(new T.DodecahedronGeometry(R(1.2, 3), 0), rockM); b.position.set(Math.cos(a) * r, R(0, 2), Math.sin(a) * r); b.scale.y = R(0.6, 1.4); b.rotation.set(R(0, 3), R(0, 3), 0); scene.add(b); }
    if (!o.open) for (let i = 0; i < 30; i++) { const a = R(0, TAU), r = R(4, 16); const st = new T.Mesh(new T.ConeGeometry(R(0.3, 0.8), R(1.5, 4), 7), rockM); st.position.set(Math.cos(a) * r, 16 - R(0.5, 1.5), Math.sin(a) * r); st.rotation.x = PI; scene.add(st); }
  }

  const THEMES = {
    /* a rocky gun ledge above the night sea: the cannon fires out over the water */
    pirate_battery: { palette: { noFloor: true,  sky: 0x0a1a2a, ground: 0x1a1a1c, fog: 0x0c1e2a, wall: ['rock', '#2e3a3c', '#4a5656'], floor: ['rock', '#4a4a48', '#3a3a38'], hemi: [0x8ab8e0, 0x14100c], key: 0x7fe8d8, dust: { c: 0xbfe8ff, n: 70, mode: 'drift' } }, look: { keyC: 0xe8f0ff, grade: 'pirate', exposure: 1.1, fogD: 0.012, rim: 0x39d8c8, face: 0x10262a, accent: '#7fe8d8', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { skyDome(c, 0x07132a, 0x2a4a6a, true); sea(c, { z: -18, w: 120, d: 90, y: -0.1 }); const { T, scene, M, sprite } = c; const moon = sprite(0xf4f0e0, 10, -18, 20, -60, null, 0.95); sprite(0x9ab8e0, 30, -18, 20, -60, null, 0.25);
        /* the ledge you stand on */ const ledge = new T.Mesh(new T.CylinderGeometry(9, 10, 2, 24), M(0x4a4a48, { roughness: 1, map: c.wallTex('rock', '#4a4a48', '#34342f') })); ledge.material.map.repeat.set(4, 1); ledge.position.set(0, -1, 7); scene.add(ledge);
        for (let i = 0; i < 12; i++) { const r = new T.Mesh(new T.DodecahedronGeometry(c.R(1, 2.4), 0), M(0x3a3a38)); const a = c.R(-0.4, 3.5); r.position.set(Math.cos(a) * 9.5, c.R(-0.5, 0.8), 7 + Math.sin(a) * 4); scene.add(r); }
        for (const [x, z, h] of [[-12, -22, 9], [16, -26, 12], [-26, -34, 14], [30, -40, 10]]) { const rk = new T.Mesh(new T.ConeGeometry(h * 0.45, h, 7), M(0x2a3438, { roughness: 1 })); rk.position.set(x, h / 2 - 1, z); scene.add(rk); }
        lanternPost(c, -6.5, 6, 3.4, true); lanternPost(c, 6.5, 6, 3.4, true); barrelProp(c, -4.6, 0.55, 8.5, 1); barrelProp(c, -5.5, 0.55, 7.6, 0.9); } },
    /* a moonlit beach: the surf runs across the middle of the hall */
    pirate_beach: { palette: { noFloor: true,  sky: 0x2a1a3a, ground: 0x6a5a3a, fog: 0x3a2a4a, wall: ['rock', '#3a3040', '#5a4a5a'], floor: ['sand', '#d8c08a', '#b89a62'], hemi: [0xffc8a8, 0x2a1a10], key: 0xffc07a, dust: { c: 0xffe0b0, n: 60, mode: 'drift' } }, look: { keyC: 0xffe6c8, grade: 'dusk', exposure: 1.0, fogD: 0.012, rim: 0xff9a7a, face: 0x2a1420, accent: '#ffc890', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { skyDome(c, 0x1a2250, 0xff9a6a, true); shore(c, { z: 12, d: 30, edge: -2.4 }); sea(c, { z: -30, w: 120, d: 60, y: -0.05, color: 0x2a6a8a, deep: 0x0a2a4a, foam: '#fff0e0' }); const { T, scene, M, sprite } = c; sprite(0xffd0a0, 14, 12, 8, -60, null, 0.9); sprite(0xff8a5a, 40, 12, 8, -60, null, 0.3);
        /* the foam line where the waves break */ const foam = []; for (let i = 0; i < 14; i++) { const f = new T.Mesh(new T.PlaneGeometry(6, 0.6), new T.MeshBasicMaterial({ color: 0xfff8f0, transparent: true, opacity: 0.6, depthWrite: false })); f.rotation.x = -PI / 2; f.position.set(-26 + i * 4, 0.12, -2.6); scene.add(f); foam.push(f); } c.updaters.push((dt, tm) => foam.forEach((f, i) => { f.position.z = -2.6 + Math.sin(tm * 0.8 + i * 0.4) * 0.5; f.material.opacity = 0.35 + 0.3 * Math.sin(tm * 0.8 + i * 0.4); }));
        palm(c, -8.4, 3.4, 8, 1.4, 1.1); palm(c, 8.8, 2.8, 7.4, -1.3, 1.05); palm(c, -11.5, 0.5, 6, 0.8, 0.9); palm(c, 12, -0.5, 6.4, -0.9, 0.95); for (let i = 0; i < 16; i++) { const sh = new T.Mesh(new T.ConeGeometry(0.16, 0.3, 8), M([0xffd8c8, 0xfff0e0, 0xffb8a0][i % 3])); sh.position.set(c.R(-10, 10), 0.1, c.R(1, 8)); sh.rotation.set(PI / 2, c.R(0, 3), 0); scene.add(sh); }
        const drift = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 4, 8), M(0x9a8a70)); drift.rotation.z = PI / 2; drift.rotation.y = 0.4; drift.position.set(7, 0.25, 6); scene.add(drift); lanternPost(c, -7, 5, 3.2, true); } },
    /* the Parrot's Tavern: planks, beams, a bar, lanterns and the parrot's perch */
    pirate_tavern: { palette: { sky: 0x1a100a, ground: 0x2a1a10, fog: 0x140a06, wall: ['plank', '#4a3020', '#5e3e28'], floor: ['plank', '#6a4a2e', '#7a5636'], hemi: [0xffd0a0, 0x2a1408], key: 0xffb870, dust: { c: 0xffe0a8, n: 80, mode: 'drift' } }, look: { keyC: 0xffe4c0, grade: 'warm', exposure: 1.05, fogD: 0.022, rim: 0xffb070, face: 0x2a160c, accent: '#ffc080', pillars: 'timber', rays: 1 },
      props(c) { const { T, scene, M, box, cyl, woodDark, flame } = c; const bar = new T.Group(); bar.position.set(8.5, 0, -5); bar.rotation.y = -0.5; scene.add(bar); box(6, 1.3, 1.2, M(0x5a3a22), 0, 0.65, 0, bar); box(6.3, 0.14, 1.4, M(0x7a5232), 0, 1.35, 0, bar); for (let i = 0; i < 3; i++) box(6, 0.1, 0.6, woodDark, 0, 2.4 + i * 1.1, -1.4, bar); for (let i = 0; i < 18; i++) { const b = c.bottle([0x5ac8fa, 0x7cf59a, 0xffd60a, 0xff7eb6][i % 4]); b.scale.setScalar(0.32); b.position.set(-2.6 + (i % 6) * 1.0, 2.46 + Math.floor(i / 6) * 1.1, -1.4); bar.add(b); }
        for (let i = 0; i < 4; i++) barrelProp(c, -9 + (i % 2) * 1.1, 0.55 + Math.floor(i / 2) * 1.1, -6 + (i % 2) * 0.3, 1);
        const wheel = new T.Group(); wheel.position.set(-10, 6, -11); wheel.rotation.y = 0.6; scene.add(wheel); const wr = new T.Mesh(new T.TorusGeometry(1.4, 0.12, 8, 30), M(0x6a4428)); wheel.add(wr); for (let i = 0; i < 8; i++) { const sp = box(0.12, 3.6, 0.12, M(0x6a4428), 0, 0, 0, wheel); sp.rotation.z = i / 8 * PI; } cyl(0.3, 0.3, 0.3, M(0x8a6a2a, { metalness: 0.6 }), 0, 0, 0, wheel, 12).rotation.x = PI / 2;
        for (const x of [-5, 0, 5]) { const l = new T.Group(); l.position.set(x, 9, -1); scene.add(l); cyl(0.02, 0.02, 3, woodDark, 0, 1.5, 0, l, 4); flame(l, 0, -0.2, 0, 0.35); const pl = new T.PointLight(0xffa850, 3, 12, 1.4); l.add(pl); }
        for (let i = 0; i < 5; i++) box(0.4, 0.4, 32, woodDark, -8 + i * 4, 13, 0); } },
    /* Treasure Island: a sunny jungle beach, the map spread on the sand */
    pirate_island: { palette: { noFloor: true,  sky: 0x6ab8f0, ground: 0xc8a868, fog: 0xbfe0f0, wall: ['rock', '#6a7a5a', '#8a9a6a'], floor: ['sand', '#e8d09a', '#c8aa70'], hemi: [0xfff4e0, 0x8a6a3a], key: 0xfff0c0, dust: { c: 0xffffff, n: 40, mode: 'drift' } }, look: { keyC: 0xffffff, grade: 'bright', exposure: 0.95, fogD: 0.008, rim: 0xfff0d0, face: 0x2a1c0c, accent: '#ffd890', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { skyDome(c, 0x3a8ae0, 0xd8f0ff, false); shore(c, { z: 0, w: 120, d: 60, edge: -24, col: '#e8d09a', col2: '#c8aa70' }); sea(c, { z: -50, w: 160, d: 60, y: -0.2, color: 0x2ab0c8, deep: 0x0a6a9a, foam: '#ffffff' }); const { T, scene, M, sprite } = c; sprite(0xfff6d0, 16, -30, 30, -70, null, 0.9);
        palm(c, -12, -6, 9, 2, 1.1); palm(c, 13, -7, 8, -1.8, 1.1); palm(c, -15, 4, 7, 1.2, 1); palm(c, 15, 3, 7.5, -1, 1); palm(c, 0, -14, 10, 0.6, 1.2);
        for (let i = 0; i < 20; i++) { const bush = new T.Mesh(new T.SphereGeometry(c.R(0.7, 1.5), 10, 8), M([0x2f7a3a, 0x3f9a4a, 0x2a6a2a][i % 3])); const a = c.R(0, TAU), r = c.R(11, 16); bush.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r - 2); bush.scale.y = 0.7; scene.add(bush); }
        const shovel = new T.Group(); shovel.position.set(6.5, 0, 4.5); shovel.rotation.z = 0.3; scene.add(shovel); c.cyl(0.05, 0.05, 2.4, M(0x7a5a3a), 0, 1.4, 0, shovel, 6); c.box(0.5, 0.6, 0.06, M(0x8a8a90, { metalness: 0.8, roughness: 0.4 }), 0, 0.2, 0, shovel); } }
  };

  /* ================================================================== the games (stages) */
  /* a small sloop with a coloured sail: the cannon's targets */
  function sloop(c, sail) { const { T, M, box } = c; const g = new T.Group(); const hullG = new T.BoxGeometry(3.4, 0.9, 1.2, 10, 3, 4), p = hullG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), t = x / 1.7; p.setZ(i, p.getZ(i) * (1 - Math.pow(Math.abs(t), 3) * 0.8) * (y < 0 ? 0.8 : 1)); p.setY(i, y + t * t * 0.25); } hullG.computeVertexNormals(); const hull = new T.Mesh(hullG, M(0x5a3a22, { roughness: 0.75 })); hull.position.y = 0.35; hull.castShadow = true; g.add(hull);
    c.cyl(0.05, 0.07, 3.4, M(0x3a2414), 0, 2.4, 0, g, 6); const sg = new T.PlaneGeometry(1.9, 1.9, 6, 6), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { const sx = sp.getX(i) / 1.9 + 0.5, sy = sp.getY(i) / 1.9 + 0.5; sp.setZ(i, Math.sin(sx * PI) * Math.sin(sy * PI) * 0.35); } sg.computeVertexNormals(); const s = new T.Mesh(sg, M(sail, { side: T.DoubleSide, roughness: 0.9 })); s.position.set(0, 2.5, 0.08); s.rotation.y = PI / 2; g.add(s); const fl = new T.Mesh(new T.PlaneGeometry(0.5, 0.3), M(0x111111, { side: T.DoubleSide })); fl.position.set(0.25, 4.1, 0); g.add(fl); g.userData.sail = s; return g; }
  function cannonMesh(c) { const { T, M, cyl, box } = c; const g = new T.Group(); const ironM = M(0x2a2a2e, { metalness: 0.85, roughness: 0.4 }), brass = M(0xc89a4a, { metalness: 1, roughness: 0.3 }), wd = M(0x5a3a22, { roughness: 0.8 }); box(1.4, 0.5, 2.2, wd, 0, 0.45, 0, g); for (const x of [-0.72, 0.72]) for (const z of [-0.7, 0.7]) { const w = cyl(0.36, 0.36, 0.14, wd, x, 0.36, z, g, 16); w.rotation.z = PI / 2; } const barrel = new T.Group(); barrel.position.set(0, 0.95, 0); g.add(barrel); const b = cyl(0.26, 0.36, 2.6, ironM, 0, 0, -0.6, barrel, 20); b.rotation.x = PI / 2; for (const z of [-1.8, -0.2, 0.6]) { const r = new T.Mesh(new T.TorusGeometry(0.33, 0.06, 8, 20), brass); r.position.z = z; barrel.add(r); } const muzzle = new T.Object3D(); muzzle.position.z = -1.95; barrel.add(muzzle); g.userData = { barrel, muzzle }; return g; }
  function parrotMesh(c) { const { T, M, sph, cone } = c; const g = new T.Group(); const red = M(0xd8302a, { roughness: 0.55 }), blue = M(0x2a5ad8, { roughness: 0.55 }), yel = M(0xffc82a, { roughness: 0.55 }), dark = M(0x2a2a30, { roughness: 0.4 });
    const body = sph(0.42, red, 0, 0.55, 0, g, 18); body.scale.set(0.9, 1.25, 0.85); const belly = sph(0.32, yel, 0, 0.45, 0.14, g, 14); belly.scale.set(0.8, 1.1, 0.6);
    const head = new T.Group(); head.position.set(0, 1.12, 0.05); g.add(head); sph(0.3, red, 0, 0, 0, head, 18); const face = sph(0.16, M(0xfff4ec), 0, 0.02, 0.2, head, 12); face.scale.set(1.2, 1, 0.5); for (const sd of [-1, 1]) { const e = sph(0.06, M(0x111111), sd * 0.13, 0.06, 0.23, head, 10); sph(0.02, M(0xffffff), sd * 0.13 + 0.02, 0.08, 0.28, head, 6); } const beak = cone(0.1, 0.26, dark, 0, -0.04, 0.34, head, 10); beak.rotation.x = PI / 2 + 0.6;
    const wings = []; for (const sd of [-1, 1]) { const piv = new T.Group(); piv.position.set(sd * 0.36, 0.8, -0.02); g.add(piv); const w = sph(0.34, blue, sd * 0.1, -0.28, 0, piv, 14); w.scale.set(0.35, 1.1, 0.8); const band = sph(0.2, yel, sd * 0.12, -0.05, 0.05, piv, 10); band.scale.set(0.3, 0.6, 0.6); wings.push(piv); }
    for (let i = 0; i < 3; i++) { const t = cone(0.07, 1.0, i === 1 ? red : blue, (i - 1) * 0.08, -0.05, -0.28, g, 6); t.rotation.x = -PI + 0.5; } for (const sd of [-1, 1]) c.cyl(0.03, 0.03, 0.2, dark, sd * 0.12, 0.08, 0.05, g, 6);
    g.userData = { head, wings }; return g; }
  /* phones: the row of answers shrinks and closes up so all four stay on screen */
  const lay = (c, sp) => { const narrow = c.camera.aspect < 1.05; return { k: narrow ? 0.85 : 1, sp: sp * (narrow ? 0.72 : 1) }; };
  function flyTo(c, obj, to, dur, arc, done) { const from = obj.position.clone(); c.tween(dur, k => { const e = c.ease(k); obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(PI * k) * arc; }, done); }

  const STAGES = {
    /* ---- Cannon Fort: ships sail past with answers on their sails; the cannon sinks the right one ---- */
    cannon(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 8.4, 20], look: [0, 2.6, -8], fov: 60 } : a < 1.5 ? { pos: [0, 6.6, 16], look: [0, 2.8, -8], fov: 50 } : { pos: [0, 6.2, 15], look: [0, 2.9, -8], fov: 46 },
      hostAt: () => new T.Vector3(-4.6, 0, 8.4),
      build() { const cn = cannonMesh(c); cn.position.set(0, 0, 8.2); cn.scale.setScalar(1.3); scene.add(cn); MS.cannon = cn; const ballM = c.M(0x1a1a1e, { metalness: 0.7, roughness: 0.4 }); for (let i = 0; i < 6; i++) c.sph(0.22, ballM, 2.2 + (i % 3) * 0.44 + (i > 2 ? 0.22 : 0), 0.22 + (i > 2 ? 0.38 : 0), 8.6, null, 12); MS.ships = []; },
      present(choices) { const n = choices.length, L = lay(c, 5.0); const sails = [0xf4ecd8, 0xd8c0a0, 0xe8d8b8, 0xf0e0c8]; for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, x = (s - (n - 1) / 2) * L.sp, z = -6.2 - (s % 2) * 2.2; const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(L.k); const sh = sloop(c, sails[j % 4]); sh.scale.setScalar(1.35); sh.rotation.y = s % 2 ? 0.4 : -0.4; g.add(sh); const tab = c.label(choices[j], j, 1.15); tab.position.set(0, 3.25, 0.9);   /* the answer is painted on the sail */ c.faceCam(tab); g.add(tab); const h = c.hitBox(5, 7, 3, j, 3); g.add(h); const ch = { j, g, tab, obj: sh, hits: [h], k0: Math.random() * 6 }; ch.still = true; c.addChoice(ch); c.updaters.push((dt, tm) => { if (ch.sunk) return; sh.position.y = Math.sin(tm * 1.4 + ch.k0) * 0.12; sh.rotation.z = Math.sin(tm * 1.1 + ch.k0) * 0.05; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const cn = MS.cannon, target = ch.g.position.clone().add(new T.Vector3(0, 1.2, 0)); const bw = new T.Vector3(); const aim = Math.atan2(target.x - cn.position.x, cn.position.z - target.z);
        c.tween(0.35, k => { cn.rotation.y = -aim * c.ease(k); cn.userData.barrel.rotation.x = 0.12 * c.ease(k); }, () => {
          cn.userData.muzzle.getWorldPosition(bw); c.burst(bw, 0xffb040, 16); for (let i = 0; i < 6; i++) { const s = c.sprite(0xbbbbbb, c.R(1, 2), bw.x, bw.y, bw.z, null, 0.6); c.tween(1.4, k => { s.position.y = bw.y + k * 1.5; s.position.z = bw.z - k * 2; s.material.opacity = 0.6 * (1 - k); s.scale.setScalar(1 + k * 2); }, () => scene.remove(s)); }
          c.tween(0.25, k => { cn.position.z = 8.2 + Math.sin(k * PI) * 0.5; });
          const ball = c.sph(0.25, c.M(0x151518, { metalness: 0.7, roughness: 0.35 }), bw.x, bw.y, bw.z, null, 14); const miss = !ok, end = miss ? target.clone().add(new T.Vector3(c.R(-1.5, 1.5), -1.2, 2.5)) : target;
          flyTo(c, ball, end, 0.9, 3.5, () => { scene.remove(ball);
            if (ok) { ch.sunk = true; c.burst(target, 0xff8a2a, 26); c.burst(target, 0xffe070, 14); ch.tab.userData.tablet.setState('right'); c.tween(1.6, k => { ch.obj.rotation.z = k * 0.9; ch.obj.position.y = -k * 2.6; }); for (let i = 0; i < 8; i++) { const s = c.sprite(0xffffff, c.R(0.6, 1.2), target.x + c.R(-1, 1), 0.3, target.z + c.R(-1, 1), null, 0.8); c.tween(1, k => { s.position.y = 0.3 + k * 2; s.material.opacity = 0.8 * (1 - k); }, () => scene.remove(s), 0.3 + i * 0.05); } MS.right++; }
            else { for (let i = 0; i < 10; i++) { const s = c.sprite(0xe8f8ff, c.R(0.4, 0.9), end.x, 0.2, end.z, null, 0.9); const a = c.R(0, TAU), up = c.R(1.5, 3.5); c.tween(1, k => { s.position.set(end.x + Math.cos(a) * k, 0.2 + up * k - 4 * k * k, end.z + Math.sin(a) * k); s.material.opacity = 0.9 * (1 - k); }, () => scene.remove(s)); } ch.tab.userData.tablet.setState('wrong'); c.glowUp(r); }
            c.tween(0.5, k => { cn.rotation.y = -aim * (1 - c.ease(k)); cn.userData.barrel.rotation.x = 0.12 * (1 - c.ease(k)); }, null, 0.6); }); });
        return ok ? 2.9 : 2.9; } }; },

    /* ---- Bottle Beach: messages bob in the surf; the right bottle washes ashore and its scroll unrolls ---- */
    bottles(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 7.4, 16.5], look: [0, 1.4, -6], fov: 60 } : a < 1.5 ? { pos: [0, 5.6, 13], look: [0, 1.6, -6], fov: 50 } : { pos: [0, 5.2, 12.2], look: [0, 1.7, -6], fov: 46 },
      hostAt: () => new T.Vector3(-6.2, 0, 5.6),
      build() { MS.scrolls = 0; },
      present(choices) { const n = choices.length, L = lay(c, 4.6); for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, x = (s - (n - 1) / 2) * L.sp, z = -4.6 - (s % 2) * 1.2; const g = new T.Group(); g.position.set(x, 0.2, z); g.scale.setScalar(L.k); const b = new T.Group(); b.scale.setScalar(1.5); g.add(b);
          const glass = new T.Mesh(new T.LatheGeometry([[0.02, 0], [0.34, 0.02], [0.4, 0.2], [0.4, 0.9], [0.18, 1.1], [0.13, 1.4], [0.02, 1.42]].map(p => new T.Vector2(p[0], p[1])), 20), new T.MeshPhysicalMaterial({ color: 0x9adfb8, roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1, depthWrite: false })); glass.renderOrder = 2; b.add(glass); const scroll = c.cyl(0.14, 0.14, 0.7, c.M(0xf2e6c8), 0, 0.55, 0, b, 12); c.cyl(0.14, 0.12, 0.2, c.M(0x9a6a3a), 0, 1.48, 0, b, 10); b.rotation.z = 1.25; b.position.y = 0.15; b.userData.glow = c.sprite(0xfff0c0, 2.4, 0, 0.3, 0, g, 0.3);
          const tab = c.label(choices[j], j, 0.95); tab.position.y = 2.2; c.faceCam(tab); g.add(tab); const h = c.hitBox(3, 3, 2.4, j, 1); g.add(h); const ch = { j, g, tab, obj: b, hits: [h], k0: Math.random() * 6, still: true }; c.addChoice(ch); c.updaters.push((dt, tm) => { if (ch.ashore) return; b.position.y = 0.15 + Math.sin(tm * 1.6 + ch.k0) * 0.1; b.rotation.x = Math.sin(tm * 1.2 + ch.k0) * 0.2; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2;
        if (ok) { ch.ashore = true; ch.gone = true; ch.tab.userData.tablet.setState('right'); MS.right++; const g = ch.g, from = g.position.clone(), to = new T.Vector3(from.x * 0.4, 0.15, 3.4); c.tween(1.1, k => { g.position.lerpVectors(from, to, c.ease(k)); g.position.y = 0.15 + Math.abs(Math.sin(k * PI * 2)) * 0.5 * (1 - k); ch.obj.rotation.x += 0.08; ch.tab.scale.setScalar(Math.max(0.001, ch.tab.userData.s0 * (1 - Math.min(1, k * 2)))); }, () => {
            c.burst(to.clone().add(new T.Vector3(0, 0.6, 0)), 0xfff0c0, 12); ch.obj.visible = false; const paper = new T.Mesh(new T.PlaneGeometry(1.8, 1.1), c.M(0xf2e6c8, { side: T.DoubleSide, roughness: 0.9 })); paper.position.copy(to).add(new T.Vector3(0, 1.4, 0)); c.faceCam(paper); paper.scale.set(0.05, 1, 1); scene.add(paper); const txt = c.label(ch.tab.userData.tablet.label || '', -1, 0.6); txt.position.copy(paper.position).add(new T.Vector3(0, 0, 0.05)); c.faceCam(txt); txt.scale.setScalar(0.001); scene.add(txt);
            c.tween(0.6, k => { paper.scale.x = Math.max(0.05, c.over(k)); txt.scale.setScalar(Math.max(0.001, 0.6 * c.ease(k))); }, () => { txt.userData.tablet.setState('right'); c.burst(paper.position.clone(), 0xffd27a, 14); }); setTimeout(() => { if (!c.alive()) return; c.tween(0.5, k => { paper.scale.setScalar(Math.max(0.001, 1 - k)); txt.scale.setScalar(Math.max(0.001, 0.6 * (1 - k))); }, () => { scene.remove(paper); scene.remove(txt); scene.remove(g); txt.userData.tablet.dispose(); }); }, 1700); }); }
        else { ch.tab.userData.tablet.setState('wrong'); ch.ashore = true; const b = ch.obj; c.tween(1.2, k => { b.position.y = 0.15 - k * 1.6; b.rotation.z = 1.25 + k * 0.6; }); for (let i = 0; i < 8; i++) { const s = c.sprite(0xdff4ff, c.R(0.15, 0.35), ch.g.position.x + c.R(-0.4, 0.4), 0.2, ch.g.position.z, null, 0.8); c.tween(1.2, k => { s.position.y = 0.2 + k * 1.4; s.material.opacity = 0.8 * (1 - k); }, () => scene.remove(s), i * 0.08); } c.glowUp(r); }
        return ok ? 2.9 : 2.2; } }; },

    /* ---- The Parrot's Tavern: signs hang from a beam; the parrot flies to the one spelled right ---- */
    parrot(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 6.6, 17], look: [0, 3.2, -4], fov: 60 } : a < 1.5 ? { pos: [0, 5.2, 13], look: [0, 3.4, -4], fov: 50 } : { pos: [0, 5.0, 12], look: [0, 3.5, -4], fov: 46 },
      build() { const perch = new T.Group(); perch.position.set(0, 0, -6.5); scene.add(perch); c.cyl(0.12, 0.18, 5.4, c.woodDark, 0, 2.7, 0, perch, 10); const bar = c.cyl(0.08, 0.08, 1.8, c.woodDark, 0, 5.3, 0, perch, 8); bar.rotation.z = PI / 2; c.cyl(0.9, 1.1, 0.3, c.woodDark, 0, 0.15, 0, perch, 16);
        const p = parrotMesh(c); p.position.set(0, 5.36, -6.5); p.scale.setScalar(1.25); scene.add(p); MS.parrot = p; MS.home = p.position.clone(); c.updaters.push((dt, tm) => { if (!MS.flying) { p.userData.head.rotation.z = Math.sin(tm * 1.7) * 0.25; p.userData.head.rotation.y = Math.sin(tm * 0.9) * 0.4; p.userData.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * 0.05; }); } else p.userData.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.2 + Math.sin(tm * 30) * 0.9); }); });
        const beam = c.box(18, 0.4, 0.4, c.woodDark, 0, 7.4, -1.2); MS.beamY = 7.4; },
      present(choices) { const n = choices.length, L = lay(c, 3.9); for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, x = (s - (n - 1) / 2) * L.sp; const g = new T.Group(); g.position.set(x, 3.6, -1.2); g.scale.setScalar(L.k); const board = c.box(3.2, 1.5, 0.16, c.M(0x7a5232, { roughness: 0.8 }), 0, 0, -0.05, g); for (const sx of [-1.2, 1.2]) { const rope = c.cyl(0.02, 0.02, 3.6, c.M(0xb8a080), sx, 1.9, -0.05, g, 4); } const tab = c.label(choices[j], j, 1.1); tab.position.z = 0.1; c.faceCam(tab); g.add(tab); const h = c.hitBox(3.3, 1.7, 0.6, j, 0); g.add(h); const ch = { j, g, tab, obj: board, hits: [h], k0: Math.random() * 6 }; c.addChoice(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const p = MS.parrot;
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; MS.flying = true; const land = ch.g.position.clone().add(new T.Vector3(0.9, 0.95, 0.1)); flyTo(c, p, land, 1.0, 2.2, () => { MS.flying = false; c.burst(land.clone().add(new T.Vector3(0, 0.6, 0)), 0xff5a4a, 10); c.burst(land.clone().add(new T.Vector3(0, 0.6, 0)), 0x4a8aff, 10); c.tween(0.4, k => { p.position.y = land.y + Math.abs(Math.sin(k * PI * 2)) * 0.3; }); setTimeout(() => { if (!c.alive()) return; MS.flying = true; flyTo(c, p, MS.home, 1.0, 2, () => { MS.flying = false; }); }, 1300); }); }
        else { ch.tab.userData.tablet.setState('wrong'); ch.anim = true; const g = ch.g, y0 = g.position.y; c.tween(0.8, k => { g.position.y = y0 - k * k * 3.6; g.rotation.z = k * 0.5; }, () => { c.shatterAt(g.position.clone(), 0x7a5232, 8); }); c.tween(0.9, k => { p.userData.head.rotation.y = Math.sin(k * 20) * 0.6 * (1 - k); }); c.glowUp(r); }
        return ok ? 2.8 : 2.2; } }; },

    /* ---- Treasure Map: four X's on a huge map; dig at the right one and a chest rises ---- */
    treasure(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 13.5, 13], look: [0, 0, -1.6], fov: 60 } : a < 1.5 ? { pos: [0, 10.4, 10.4], look: [0, 0, -1.4], fov: 50 } : { pos: [0, 9.8, 9.6], look: [0, 0, -1.4], fov: 46 },
      hostAt: () => new T.Vector3(-6.8, 0, 4.8),
      build() { const tex = canvasTex(T, 1024, 768, (x, w, h) => { x.fillStyle = '#e8d6a8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${140 + Math.random() * 40 | 0},${110 + Math.random() * 30 | 0},${60 + Math.random() * 20 | 0},${0.05 + Math.random() * 0.1})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 90, 0, TAU); x.fill(); }
          x.fillStyle = 'rgba(90,150,170,0.35)'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8d6a8'; x.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 300 + Math.sin(a * 3) * 50 + Math.sin(a * 7) * 25; x.lineTo(w / 2 + Math.cos(a) * r * 1.2, h / 2 + Math.sin(a) * r * 0.85); } x.closePath(); x.fill(); x.strokeStyle = '#6a4a2a'; x.lineWidth = 5; x.stroke();
          x.setLineDash([14, 14]); x.lineWidth = 6; x.strokeStyle = '#8a2a1a'; x.beginPath(); x.moveTo(w * 0.2, h * 0.7); x.bezierCurveTo(w * 0.35, h * 0.3, w * 0.6, h * 0.8, w * 0.78, h * 0.35); x.stroke(); x.setLineDash([]);
          for (let i = 0; i < 6; i++) { const px = w * (0.3 + Math.random() * 0.4), py = h * (0.3 + Math.random() * 0.4); x.fillStyle = '#5a7a3a'; x.beginPath(); x.moveTo(px, py - 30); x.lineTo(px - 22, py + 12); x.lineTo(px + 22, py + 12); x.fill(); }
          x.save(); x.translate(w * 0.86, h * 0.8); x.strokeStyle = '#6a4a2a'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 60, 0, TAU); x.stroke(); x.fillStyle = '#8a2a1a'; x.beginPath(); x.moveTo(0, -80); x.lineTo(12, 0); x.lineTo(0, 80); x.lineTo(-12, 0); x.fill(); x.fillStyle = '#6a4a2a'; x.beginPath(); x.moveTo(-80, 0); x.lineTo(0, 12); x.lineTo(80, 0); x.lineTo(0, -12); x.fill(); x.font = '700 34px Georgia'; x.textAlign = 'center'; x.fillText('N', 0, -92); x.restore();
          const gr = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(70,40,10,0.55)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
        const map = new T.Mesh(new T.PlaneGeometry(15, 11.2, 20, 14), c.M(0xffffff, { map: tex, roughness: 0.95, side: T.DoubleSide })); map.rotation.x = -PI / 2; map.position.set(0, 0.06, -1.6); map.receiveShadow = true; const mp = map.geometry.attributes.position; for (let i = 0; i < mp.count; i++) { const x = mp.getX(i), y = mp.getY(i); mp.setZ(i, (Math.abs(x) > 7.2 ? (Math.abs(x) - 7.2) * 0.6 : 0) + Math.sin(x * 0.7) * Math.sin(y * 0.6) * 0.06); } map.geometry.computeVertexNormals(); scene.add(map);
        for (const [x, z] of [[-7.6, -7.2], [7.6, -7.2], [-7.6, 4], [7.6, 4]]) c.sph(0.35, c.M(0x8a8a8a), x, 0.3, z, null, 8);
        const spade = new T.Group(); scene.add(spade); c.cyl(0.05, 0.05, 2.4, c.M(0x7a5a3a), 0, 1.5, 0, spade, 6); c.box(0.55, 0.65, 0.06, c.M(0x9a9aa2, { metalness: 0.8, roughness: 0.35 }), 0, 0.2, 0, spade); spade.visible = false; MS.spade = spade; },
      present(choices) { const n = choices.length; const spots = [[-4.4, -4.6], [4.2, -4.8], [-4.2, 1.4], [4.6, 1.2]]; for (let j = 0; j < n; j++) { const s = c.RTL() ? [1, 0, 3, 2][j] : j, [x, z] = spots[s % 4], L = lay(c, 1); const g = new T.Group(); g.position.set(x * (L.k < 1 ? 0.78 : 1), 0.1, z); g.scale.setScalar(L.k < 1 ? 0.85 : 1); const xm = c.M(0xc02a1a, { roughness: 0.6 }); for (const a of [0.78, -0.78]) { const bar = c.box(1.5, 0.08, 0.24, xm, 0, 0.04, 0, g); bar.rotation.y = a; } const glow = c.sprite(0xffd27a, 2.4, 0, 0.3, 0, g, 0.25); g.userData.glow = glow; const tab = c.label(choices[j], j, s < 2 ? 1.05 : 0.88); tab.position.y = 1.3; c.faceCam(tab); g.add(tab); const h = c.hitBox(2.4, 2.2, 2.4, j, 0.6); g.add(h); const ch = { j, g, tab, obj: g, hits: [h], still: true }; c.addChoice(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const at = ch.g.position.clone(), sp = MS.spade; sp.visible = true; sp.position.set(at.x + 0.7, 0.3, at.z + 0.4); sp.rotation.z = 0.5;
        c.tween(1.2, k => { const d = Math.abs(Math.sin(k * PI * 3)); sp.position.y = 0.3 + d * 0.9; sp.rotation.z = 0.5 - d * 0.4; if (Math.random() < 0.3) { const s = c.sprite(0xd8c08a, c.R(0.3, 0.6), at.x + c.R(-0.6, 0.6), 0.3, at.z + c.R(-0.4, 0.4), null, 0.8); c.tween(0.6, q => { s.position.y = 0.3 + q * 1.2; s.material.opacity = 0.8 * (1 - q); }, () => scene.remove(s)); } }, () => { sp.visible = false;
          if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const chest = chestMesh(c, 0.9); chest.position.set(at.x, -1.2, at.z); scene.add(chest); c.tween(0.8, k => { chest.position.y = -1.2 + 1.3 * c.over(k); }, () => { c.tween(0.5, k => { chest.userData.lid.rotation.x = -k * 1.9; }); const gl = c.sprite(0xffd27a, 3, at.x, 1.2, at.z, null, 0.7); for (let i = 0; i < 16; i++) { const coin = c.cyl(0.14, 0.14, 0.04, c.M(0xf2c14e, { metalness: 1, roughness: 0.25 }), at.x, 0.9, at.z, null, 12); const a = c.R(0, TAU), v = c.R(1, 2.4), up = c.R(2, 4); c.tween(1.1, q => { coin.position.set(at.x + Math.cos(a) * v * q, 0.9 + up * q - 4.6 * q * q, at.z + Math.sin(a) * v * q); coin.rotation.x += 0.3; }, () => { coin.position.y = Math.max(0.12, coin.position.y); }, i * 0.03); } setTimeout(() => { if (!c.alive()) return; c.tween(0.5, q => { chest.scale.setScalar(Math.max(0.001, 0.9 * (1 - q))); gl.material.opacity = 0.7 * (1 - q); }, () => { scene.remove(chest); scene.remove(gl); }); }, 1500); }); }
          else { ch.tab.userData.tablet.setState('wrong'); const crab = new T.Group(); crab.position.set(at.x, 0.2, at.z); scene.add(crab); const cm = c.M(0xd8442a, { roughness: 0.5 }); const bd = c.sph(0.3, cm, 0, 0, 0, crab, 12); bd.scale.set(1.3, 0.55, 1); for (const sd of [-1, 1]) c.sph(0.12, cm, sd * 0.42, 0.05, 0.22, crab, 8); for (const sd of [-1, 1]) c.sph(0.06, c.M(0x111111), sd * 0.1, 0.2, 0.2, crab, 6); c.tween(1.4, k => { crab.position.x = at.x + k * 3; crab.position.y = 0.2 + Math.abs(Math.sin(k * 20)) * 0.05; }, () => scene.remove(crab)); c.glowUp(r); } });
        return ok ? 3.2 : 2.6; } }; }
  };

  /* ================================================================== the map: four places in the Pirate Cove */
  function landmarks(k) { const { T, plot, box, cyl, cone, woodMat, stoneMat, stoneDark, windowMat } = k;
    const jolly = (() => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 80; const x = cv.getContext('2d'); x.fillStyle = '#0c0c10'; x.fillRect(0, 0, 128, 80); x.fillStyle = '#f2ece0'; x.beginPath(); x.arc(64, 34, 16, 0, TAU); x.fill(); x.fillRect(55, 44, 18, 10); x.fillStyle = '#0c0c10'; x.beginPath(); x.arc(58, 33, 5, 0, TAU); x.arc(70, 33, 5, 0, TAU); x.fill(); x.strokeStyle = '#f2ece0'; x.lineWidth = 6; x.beginPath(); x.moveTo(40, 58); x.lineTo(88, 74); x.moveTo(88, 58); x.lineTo(40, 74); x.stroke(); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return new T.MeshStandardMaterial({ map: t, side: T.DoubleSide, roughness: 0.9 }); })();
    const pole = (g, x, y, z, h) => { cyl(0.07, 0.09, h, woodMat, x, y + h / 2, z, g, 6); const f = new T.Mesh(new T.PlaneGeometry(1.6, 1.0), jolly); f.position.set(x + 0.8, y + h - 0.6, z); g.add(f); k.fx((dt, tm) => { f.rotation.y = Math.sin(tm * 2 + x) * 0.25; }); };
    const ironM = new T.MeshStandardMaterial({ color: 0x26262a, metalness: 0.85, roughness: 0.4 }), sand = new T.MeshStandardMaterial({ color: 0xd8c08a, roughness: 1 }), plank = new T.MeshStandardMaterial({ color: 0x6a4428, roughness: 0.85 }), glow = new T.MeshStandardMaterial({ color: 0xffc46a, emissive: 0xffb050, emissiveIntensity: 2.2 });
    /* Cannon Fort: a round stone bastion bristling with cannons */
    plot('rg_cannon', -20, -12, g => { cyl(3.4, 3.8, 3.4, stoneMat, 0, 1.7, 0, g, 18); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; box(0.9, 0.7, 0.7, stoneDark, Math.cos(a) * 3.3, 3.75, Math.sin(a) * 3.3, g).rotation.y = -a; } for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; const b = cyl(0.22, 0.3, 2, ironM, Math.cos(a) * 3.7, 2.4, Math.sin(a) * 3.7, g, 12); b.rotation.z = PI / 2; b.rotation.y = -a; } pole(g, 0, 3.4, 0, 4.5); for (let i = 0; i < 6; i++) cyl(0.25, 0.25, 0.25, ironM, 2 + (i % 3) * 0.5, 0.25 + (i > 2 ? 0.4 : 0), 3.6, g, 10); }, { labelH: 8.5 });
    /* The Parrot's Tavern: a crooked timber inn, lamplit, a parrot on the roof */
    plot('rg_parrot', 22, -10, g => { box(5.4, 3.4, 4.2, plank, 0, 1.7, 0, g); const roof = new T.Mesh(new T.CylinderGeometry(0, 4.2, 2.4, 4), k.roofMat); roof.position.set(0, 4.6, 0); roof.rotation.y = PI / 4; roof.scale.set(1, 1, 0.85); roof.castShadow = true; g.add(roof); for (const x of [-1.6, 1.6]) box(0.9, 0.9, 0.1, glow, x, 2.1, 2.12, g); box(1.1, 2, 0.12, woodMat, 0, 1, 2.12, g);
      const sign = box(1.6, 1.0, 0.1, plank, 3.3, 2.8, 2.2, g); cyl(0.04, 0.04, 1, woodMat, 3.3, 3.5, 2.2, g, 4); const p = new T.Group(); p.position.set(0, 5.9, 0); g.add(p); const red = new T.MeshStandardMaterial({ color: 0xd8302a, roughness: 0.55 }), blue = new T.MeshStandardMaterial({ color: 0x2a5ad8, roughness: 0.55 }); const bd = new T.Mesh(new T.SphereGeometry(0.5, 14, 10), red); bd.scale.set(0.9, 1.3, 0.85); p.add(bd); const hd = new T.Mesh(new T.SphereGeometry(0.36, 14, 10), red); hd.position.y = 0.8; p.add(hd); const bk = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 8), new T.MeshStandardMaterial({ color: 0x2a2a30 })); bk.position.set(0, 0.74, 0.4); bk.rotation.x = PI / 2; p.add(bk); for (const sd of [-1, 1]) { const w = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), blue); w.scale.set(0.3, 1, 0.7); w.position.set(sd * 0.48, 0.1, 0); p.add(w); } k.fx((dt, tm) => { p.rotation.y = Math.sin(tm * 0.8) * 0.5; hd.rotation.z = Math.sin(tm * 2) * 0.2; });
      for (let i = 0; i < 3; i++) { const b = cyl(0.45, 0.45, 1.1, plank, -3.4 + i * 0.3, 0.55 + (i === 2 ? 1.05 : 0), 1.6 - (i === 2 ? 0.4 : i * 0.9), g, 12); } }, { labelH: 7.8 });
    /* Bottle Beach: a sandy spit by the lagoon, bottles stuck in the sand, a palm */
    plot('rg_bottles', -20, 29, g => { const spit = new T.Mesh(new T.SphereGeometry(4.2, 20, 12), sand); spit.scale.set(1.2, 0.18, 1); spit.position.y = -0.2; spit.receiveShadow = true; g.add(spit); const glassM = new T.MeshStandardMaterial({ color: 0x9adfb8, roughness: 0.1, transparent: true, opacity: 0.7, emissive: 0x2a8a6a, emissiveIntensity: 0.4 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, r = 1.6 + (i % 2) * 1.2; const b = cyl(0.22, 0.22, 0.9, glassM, Math.cos(a) * r, 0.6, Math.sin(a) * r, g, 10); b.rotation.z = 0.5 * (i % 2 ? 1 : -1); cyl(0.09, 0.09, 0.3, glassM, Math.cos(a) * r + 0.3 * (i % 2 ? -1 : 1), 1.15, Math.sin(a) * r, g, 8); }
      const trunkPts = []; for (let i = 0; i <= 6; i++) trunkPts.push(new T.Vector3(Math.sin(i / 6 * 1.2) * 1.2, i / 6 * 6, 0)); const tr = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(trunkPts), 12, 0.22, 7, false), new T.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 })); tr.position.set(-2.4, 0, -1.4); tr.castShadow = true; g.add(tr); const top = trunkPts[6].clone().add(tr.position); for (let i = 0; i < 7; i++) { const fg = new T.PlaneGeometry(0.8, 3, 1, 4); fg.translate(0, 1.5, 0); const f = new T.Mesh(fg, new T.MeshStandardMaterial({ color: 0x2f8a3a, side: T.DoubleSide, roughness: 0.8 })); f.position.copy(top); f.rotation.set(-1.0, i / 7 * TAU, 0, 'YXZ'); g.add(f); }
      box(1.6, 1.0, 0.1, plank, 2.6, 1.6, -1.2, g).rotation.y = -0.4; cyl(0.06, 0.06, 1.6, woodMat, 2.6, 0.8, -1.2, g, 6); }, { labelH: 5.8 });
    /* The Treasure Map: a canvas tent over a map table, a dug pit, an open chest of gold */
    plot('rg_map', 28, 25, g => { const tent = new T.Mesh(new T.ConeGeometry(3.2, 3.4, 4, 1, true), new T.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.9, side: T.DoubleSide })); tent.position.set(0, 3.6, 0); tent.rotation.y = PI / 4; tent.castShadow = true; g.add(tent); for (const [x, z] of [[-2.1, -2.1], [2.1, -2.1], [-2.1, 2.1], [2.1, 2.1]]) cyl(0.07, 0.07, 1.9, woodMat, x, 0.95, z, g, 6);
      box(2.6, 0.12, 1.6, plank, 0, 1.2, 0, g); for (const [x, z] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) box(0.12, 1.2, 0.12, plank, x, 0.6, z, g); const mapTop = box(2.2, 0.02, 1.3, new T.MeshStandardMaterial({ color: 0xe8d6a8, roughness: 1 }), 0, 1.27, 0, g); const xM = new T.MeshStandardMaterial({ color: 0xc02a1a }); for (const a of [0.78, -0.78]) box(0.5, 0.03, 0.08, xM, 0.4, 1.3, 0.2, g).rotation.y = a;
      const ch = new T.Group(); ch.position.set(3.2, 0, 2.4); ch.rotation.y = -0.6; g.add(ch); box(1.3, 0.75, 0.85, plank, 0, 0.38, 0, ch); const lid = box(1.3, 0.12, 0.85, plank, 0, 1.0, -0.45, ch); lid.rotation.x = -1.2; lid.position.z = -0.6; for (let i = 0; i < 14; i++) { const coin = cyl(0.12, 0.12, 0.04, new T.MeshStandardMaterial({ color: 0xf2c14e, metalness: 1, roughness: 0.25, emissive: 0x3a2400, emissiveIntensity: 0.4 }), (Math.random() - 0.5) * 1.8, 0.78 + Math.random() * 0.2, (Math.random() - 0.5) * 1.2, ch, 10); coin.rotation.x = Math.random(); } }, { labelH: 6.8 });
  }

  /* ================================================================== the cove itself: a set piece at every free spot, palm groves, a pier out to the ghost ship */
  function jollyMat(T) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 80; const x = cv.getContext('2d'); x.fillStyle = '#0c0c10'; x.fillRect(0, 0, 128, 80); x.fillStyle = '#f2ece0'; x.beginPath(); x.arc(64, 34, 16, 0, TAU); x.fill(); x.fillRect(55, 44, 18, 10); x.fillStyle = '#0c0c10'; x.beginPath(); x.arc(58, 33, 5, 0, TAU); x.arc(70, 33, 5, 0, TAU); x.fill(); x.strokeStyle = '#f2ece0'; x.lineWidth = 6; x.beginPath(); x.moveTo(40, 58); x.lineTo(88, 74); x.moveTo(88, 58); x.lineTo(40, 74); x.stroke(); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return new T.MeshStandardMaterial({ map: t, side: T.DoubleSide, roughness: 0.9 }); }
  /* a ship's hull: a box pulled into a boat shape (sheer, taper, round belly) */
  function hullGeo(T, L, H, W) { const g = new T.BoxGeometry(L, H, W, 16, 4, 6), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = x / (L / 2), taper = 1 - Math.pow(Math.abs(t), 3) * 0.85, belly = y < 0 ? 1 - Math.pow(-y / (H / 2), 2) * 0.55 : 1; p.setZ(i, z * taper * belly); p.setY(i, y + t * t * H * 0.2); } g.computeVertexNormals(); return g; }

  function scenery(k) {
    const { T, scene, height, pickSpot, placeOk, pathDist, reserved, LAKE, WATER_Y, R32, fx } = k, G3 = KQRealms.G3, K = KQRealms.kit(k);
    const { R, M, VC, GT, BOX, CYL, CYL6, SPH, ROCK, CONE, CONE4, low, put, beam, bx, barrel, crate, torch } = K;
    const wood = VC(), iron = VC({ metalness: 0.3, roughness: 0.55 }), glowM = K.glowMat(0xffc46a, 0xffb050), jolly = jollyMat(T);

    /* ---- the lighthouse on its rock at the end of the west road, its beam sweeping the cavern ---- */
    { const x0 = -36, z0 = 6, P = []; reserved.push([x0, z0, 7]);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + R(0, 0.3), r = R(1.4, 3.2); P.push({ g: ROCK, m: M(Math.cos(a) * r, R(0.2, 1.0), Math.sin(a) * r, R(0, 3), R(0, 3), 0, R(1.8, 3), R(1.4, 2.4), R(1.8, 3)), c: [0x4a4642, 0x3a3836, 0x5a544c][i % 3] }); }
      const H0 = 1.4, SH = 1.9, N = 6, rad = h => 1.9 - (h - H0) / (SH * N) * 0.7, top = H0 + SH * N;
      for (let i = 0; i < N; i++) P.push({ g: new T.CylinderGeometry(rad(H0 + SH * (i + 1)), rad(H0 + SH * i), SH, 24), m: M(0, H0 + SH * (i + 0.5), 0), c: i % 2 ? 0xf2ece0 : 0xc8342a });
      P.push({ g: CYL, m: M(0, top + 0.12, 0, 0, 0, 0, 3.8, 0.25, 3.8), c: 0x2a2a2e });
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; P.push({ g: CYL6, m: M(Math.cos(a) * 1.8, top + 0.6, Math.sin(a) * 1.8, 0, 0, 0, 0.07, 0.9, 0.07), c: 0x2a2a2e }); }
      P.push({ g: new T.TorusGeometry(1.8, 0.05, 6, 32), m: M(0, top + 1.05, 0, PI / 2), c: 0x2a2a2e });
      P.push({ g: CONE, m: M(0, top + 2.35, 0, 0, 0, 0, 2.6, 1.3, 2.6), c: 0xc8342a }); P.push({ g: SPH, m: M(0, top + 3.1, 0, 0, 0, 0, 0.4), c: 0xd8b04a });
      P.push({ g: BOX, m: M(0, H0 + 0.9, rad(H0) - 0.05, 0, 0, 0, 0.9, 1.7, 0.3), c: 0x3a2818 });
      const lh = put(P, VC({ roughness: 0.7 }), x0, z0, 0.5, 0.2, 3);
      for (const [h, a] of [[4.6, 0.5], [8.4, 2.6], [11.6, 4.4]]) { const w = new T.Mesh(new T.BoxGeometry(0.34, 0.62, 0.1), glowM); w.position.set(Math.sin(a) * (rad(h) - 0.02), h, Math.cos(a) * (rad(h) - 0.02)); w.rotation.y = a; lh.add(w); }
      const lamp = new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 1.4, 16), new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd070, emissiveIntensity: 3 })); lamp.position.y = top + 0.95; lh.add(lamp);
      /* the beam: two nested cones, bright at the lamp and fading to nothing along their length */
      const fade = (() => { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128; const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, '#8a8a8a'); g.addColorStop(1, '#000000'); x.fillStyle = g; x.fillRect(0, 0, 4, 128); return new T.CanvasTexture(cv); })();
      const sweep = new T.Group(); sweep.position.y = top + 0.95; lh.add(sweep);
      for (const [rr, op] of [[1.4, 0.34], [3.0, 0.14]]) { const bm = new T.MeshBasicMaterial({ color: 0xfff0b0, map: fade, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }); for (const sd of [-1, 1]) { const cg = new T.ConeGeometry(rr, 34, 24, 1, true); cg.translate(0, -17, 0); const c = new T.Mesh(cg, bm); c.rotation.z = sd * PI / 2; sweep.add(c); } }
      const halo = new T.Sprite(new T.SpriteMaterial({ map: GT, color: 0xffe0a0, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(6); halo.position.y = top + 0.95; lh.add(halo);
      const pl = new T.PointLight(0xffd890, 60, 36, 1.6); pl.position.y = top + 1; lh.add(pl);
      fx((dt, tm) => { sweep.rotation.y = tm * 0.55; lamp.material.emissiveIntensity = 2.7 + Math.sin(tm * 3) * 0.3; });
      torch(x0 + 3.2, z0 + 3.4); torch(x0 - 3.4, z0 + 3.0); }

    /* ---- a wrecked galleon, ribs bare to the sky, at the south end of the cove ---- */
    { const x0 = -3, z0 = 38, P = [], L = 11, dark = 0x3e2a1a, mid = 0x5a3e26; reserved.push([x0, z0, 7.5]);
      P.push({ g: BOX, m: M(0, -1.72, 0, 0, 0, 0, L, 0.36, 0.42), c: dark });
      const rOf = x => 1.8 * (1 - Math.pow(x / (L / 2), 2) * 0.55);
      /* ribs: U-frames along the keel; toward the bow they rise bare above the planking and curl inward */
      for (let i = 0; i <= 12; i++) { const x = -L / 2 + 0.5 + i * (L - 1) / 12, r = rOf(x), up = i > 6 ? R(0.8, 2.0) : 0.3; P.push({ g: new T.TorusGeometry(r, 0.12, 5, 16, PI), m: M(x, 0, 0, 0, PI / 2, PI), c: dark }); for (const sd of [-1, 1]) { beam(P, [x, 0, sd * r], [x, up * 0.6, sd * r * 1.03], 0.11, dark); beam(P, [x, up * 0.6, sd * r * 1.03], [x, up, sd * (r - 0.4)], 0.1, dark); } }
      /* the planking: whole along the stern, the lower strakes run on toward the bow, the upper ones are torn away */
      for (const sd of [-1, 1]) for (let row = 0; row < 5; row++) { const a = 0.3 + row * 0.3; for (let sg = 0; sg < 4; sg++) { const x = -L / 2 + 0.7 + sg * 2.5, keep = sg < 2 || (row < 3 ? (sg === 2 || R32() < 0.6) : R32() < (sg === 2 ? 0.5 : 0.12)); if (!keep) continue; const r = rOf(x) + 0.08; P.push({ g: BOX, m: M(x, -r * Math.cos(a), sd * r * Math.sin(a), -sd * a, 0, 0, 2.55, 0.08, 0.5), c: row % 2 ? 0x7a5a3a : 0x6a4a2e }); } }
      for (const sd of [-1, 1]) bx(P, -L / 2 + 3.2, 0.05, sd * rOf(-L / 2 + 3.2) * 1.02, 5.4, 0.16, 0.18, 0x8a6a44);
      bx(P, -L / 2 + 1.5, 0.8, 0, 3.0, 1.6, 2.5, mid); for (const z of [-1.25, 1.25]) bx(P, -L / 2 + 1.5, 1.85, z, 3.0, 0.5, 0.1, dark); bx(P, -L / 2 + 0.05, 1.1, 0, 0.14, 2.3, 2.5, dark); for (const z of [-0.6, 0.6]) bx(P, -L / 2 - 0.02, 1.0, z, 0.06, 0.5, 0.42, 0x1a1410);
      beam(P, [-1.2, -1.5, 0], [0.6, 5.8, 0.4], 0.2, dark); beam(P, [-0.7, 3.9, -1.9], [1.2, 4.6, 2.2], 0.09, dark);
      const wreck = put(P, wood, x0, z0, 0.5, 0, 4); wreck.position.y = height(x0, z0) + 1.25; wreck.rotation.x = 0.3; wreck.rotation.z = -0.08;   /* heeled over toward the valley, so the deck and the bare ribs face the path */   /* keel buried, listing to port, the bare bow nosing into the sand */
      const sg = new T.PlaneGeometry(3.2, 2.6, 8, 6), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / 3.2 + 0.5, v = sp.getY(i) / 2.6 + 0.5; sp.setZ(i, Math.sin(u * PI) * 0.4 + R(-0.05, 0.05)); if (v < 0.2) sp.setY(i, sp.getY(i) + R(0, 0.7) * (1 - v * 5)); } sg.computeVertexNormals();
      const sail = new T.Mesh(sg, new T.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.95, side: T.DoubleSide })); sail.position.set(0.1, 2.9, 0.1); sail.rotation.set(0, PI / 2 + 0.3, 0.25); wreck.add(sail);
      const S2 = []; for (let i = 0; i < 9; i++) { const a = R(0, TAU), r = R(5, 7.5); bx(S2, x0 + Math.cos(a) * r, 0, z0 + Math.sin(a) * r, R(1.4, 2.6), 0.1, 0.36, R32() < 0.5 ? dark : mid, R(0, 3)); } barrel(S2, x0 + 5.6, 0.45, z0 - 2.2, 0.85, true); barrel(S2, x0 - 5.8, 0.55, z0 + 1.8, 0.9);
      for (const s of S2) { const e = new T.Vector3().setFromMatrixPosition(s.m); s.m.setPosition(e.x, e.y + height(e.x, e.z) + 0.05, e.z); } put(S2, wood, 0, 0, 0, 0, 0.01).position.y = 0;
      torch(x0 + 6.5, z0 + 3.2); torch(x0 - 6.2, z0 - 2.4); }

    /* ---- the pirates' shanty town on stilts at the end of the east road: lamplit windows, a campfire, fish drying ---- */
    { const x0 = 36, z0 = 9, P = [], W = []; reserved.push([x0, z0, 8.5]);
      const shack = (S, w, d, h) => { const add = (g, m, c) => P.push({ g, m: S.clone().multiply(m), c });
        for (const [lx, lz] of [[-w / 2 + 0.2, -d / 2 + 0.2], [w / 2 - 0.2, -d / 2 + 0.2], [-w / 2 + 0.2, d / 2 - 0.2], [w / 2 - 0.2, d / 2 - 0.2], [-w / 2 + 0.2, d / 2 + 1.0], [w / 2 - 0.2, d / 2 + 1.0]]) add(CYL6, M(lx, 0.55, lz, 0, 0, 0, 0.24, 2.2, 0.24), 0x4a3422);
        add(BOX, M(0, 1.55, 0.5, 0, 0, 0, w + 0.3, 0.18, d + 1.5), 0x7a5a3a);
        add(BOX, M(0, 1.64 + h / 2, 0, 0, 0, 0, w, h, d), 0x6a4a2e); for (let i = 1; i < 4; i++) add(BOX, M(0, 1.64 + i * h / 4, d / 2 + 0.01, 0, 0, 0, w + 0.02, 0.05, 0.04), 0x4a3220);
        add(CONE4, M(0, 1.64 + h + 0.75, 0, 0, 0, 0, (w + 0.8) / 0.707, 1.5, (d + 0.8) / 0.707), 0x9a8450);
        add(BOX, M(-w * 0.22, 1.64 + 0.85, d / 2 + 0.03, 0, 0, 0, 0.8, 1.7, 0.06), 0x2e1e12);
        for (let i = 0; i < 3; i++) add(BOX, M(0, 1.12 - i * 0.42, d / 2 + 1.42 + i * 0.4, 0, 0, 0, 1.0, 0.12, 0.42), 0x5a3e26);
        W.push(S.clone().multiply(M(w * 0.24, 1.64 + h * 0.56, d / 2 + 0.04, 0, 0, 0, 0.75, 0.62, 0.05))); };
      const spots = [[-3.8, -1.2, 0.5, 3.2, 2.6, 2.3], [3.6, -2.4, -0.45, 3.4, 2.8, 2.5], [0.4, 4.4, PI + 0.1, 3.0, 2.4, 2.2]];
      for (const [sx, sz, ry, w, d, h] of spots) shack(M(sx, 0, sz, 0, ry, 0), w, d, h);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; P.push({ g: ROCK, m: M(Math.cos(a) * 0.9, 0.12, Math.sin(a) * 0.9, R(0, 3), R(0, 3), 0, 0.45), c: 0x4a4642 }); }
      for (let i = 0; i < 3; i++) P.push({ g: CYL6, m: M(0, 0.22, 0, PI / 2, i * PI / 3, 0, 0.2, 1.5, 0.2), c: 0x3a2618 });
      beam(P, [-6.2, 0, 1.6], [-6.2, 2.1, 1.6], 0.07, 0x4a3422); beam(P, [-6.2, 0, 3.8], [-6.2, 2.1, 3.8], 0.07, 0x4a3422); beam(P, [-6.2, 2.0, 1.5], [-6.2, 2.0, 3.9], 0.05, 0x4a3422);
      for (let i = 0; i < 5; i++) P.push({ g: SPH, m: M(-6.2, 1.65, 1.8 + i * 0.5, 0, 0, 0, 0.14, 0.62, 0.3), c: 0xa8b8c0 });
      crate(P, 6.2, 0, 1.2, 0.9, 0.3); crate(P, 6.6, 0, 2.3, 0.8, -0.2); crate(P, 6.4, 0.9, 1.6, 0.7, 0.5); barrel(P, 5.6, 0.55, 3.4, 0.9); barrel(P, -5.4, 0.55, -2.8, 0.85); barrel(P, -4.6, 0.3, -3.6, 0.8, true);
      const vil = put(P, wood, x0, z0, -0.35, 0.25, 5);
      for (const m of W) { const w = new T.Mesh(BOX, glowM); w.applyMatrix4(m); vil.add(w); }
      const lanM = new T.Group(); vil.add(lanM); const rp = []; for (let i = 0; i < 6; i++) { const t = i / 5, p = new T.Vector3(-3.8, 4.4, -1.2).lerp(new T.Vector3(3.6, 4.6, -2.4), t); p.y -= Math.sin(t * PI) * 0.8; rp.push(p.clone()); const l = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), glowM); l.position.copy(p).y -= 0.2; lanM.add(l); } lanM.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rp), 24, 0.025, 4, false), new T.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 1 })));
      const fire = []; for (let i = 0; i < 3; i++) { const f = new T.Sprite(new T.SpriteMaterial({ map: GT, color: i ? 0xffb040 : 0xff6a20, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); f.position.set(R(-0.2, 0.2), 0.6 + i * 0.25, R(-0.2, 0.2)); vil.add(f); fire.push(f); }
      const fl = new T.PointLight(0xff9a40, 40, 20, 1.8); fl.position.set(0, 1.4, 0); vil.add(fl);
      fx((dt, tm) => { fire.forEach((f, i) => { const s = 1 + 0.3 * Math.sin(tm * 12 + i * 2) * Math.sin(tm * 7 + i); f.scale.set(1.3 * s - i * 0.25, 1.9 * s - i * 0.3, 1); }); fl.intensity = 34 + 10 * Math.sin(tm * 11) * Math.sin(tm * 6.3); });
      torch(x0 - 7, z0 + 5); torch(x0 + 6.8, z0 - 4.6); }

    /* ---- the crow's-nest watchtower over the north-west road ---- */
    { const x0 = -32, z0 = -14, P = [], Hp = 8.5; reserved.push([x0, z0, 6]); const legs = [[-2, -2], [2, -2], [2, 2], [-2, 2]], f = y => 1 - 0.4 * (y + 0.5) / (Hp + 0.5);
      for (const [lx, lz] of legs) beam(P, [lx, -0.6, lz], [lx * 0.6, Hp, lz * 0.6], 0.2, 0x5a3a24);
      for (let i = 0; i < 4; i++) { const [ax, az] = legs[i], [cx, cz] = legs[(i + 1) % 4]; for (const [y0, y1] of [[0.4, 4.2], [4.2, 7.9]]) { beam(P, [ax * f(y0), y0, az * f(y0)], [cx * f(y1), y1, cz * f(y1)], 0.08, 0x4a3020); beam(P, [cx * f(y0), y0, cz * f(y0)], [ax * f(y1), y1, az * f(y1)], 0.08, 0x4a3020); } }
      bx(P, 0, Hp + 0.1, 0, 3.4, 0.25, 3.4, 0x7a5a3a);
      for (const [px, pz] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) bx(P, px, Hp + 0.75, pz, 0.12, 1.1, 0.12, 0x4a3020);
      for (const [px, pz, w, d] of [[0, -1.6, 3.3, 0.08], [0, 1.6, 3.3, 0.08], [-1.6, 0, 0.08, 3.3], [1.6, 0, 0.08, 3.3]]) bx(P, px, Hp + 1.25, pz, w, 0.1, d, 0x5a3a24);
      beam(P, [0, Hp, 0], [0, Hp + 7.2, 0], 0.14, 0x4a3020);
      P.push({ g: new T.CylinderGeometry(0.8, 0.62, 1.1, 16), m: M(0, Hp + 4.7, 0), c: 0x6a4428 }); P.push({ g: new T.TorusGeometry(0.8, 0.07, 5, 18), m: M(0, Hp + 5.25, 0, PI / 2), c: 0x2e2a26 });
      for (const sx of [-0.36, 0.36]) beam(P, [sx, -0.2, 2.7], [sx, Hp + 0.1, 1.3], 0.05, 0x5a3a24);
      for (let i = 1; i < 13; i++) { const t = i / 13; bx(P, 0, t * Hp, 2.7 - t * 1.4, 0.74, 0.07, 0.09, 0x6a4a2e); }
      barrel(P, 2.6, 0.55, -1.2, 0.9); crate(P, 2.4, 0, 1.6, 0.9, 0.4);
      const wt = put(P, wood, x0, z0, 0.35, 0.3, 2.6);
      K.flag(wt, 0.08, Hp + 6.5, 0, 1.9, 1.15, jolly);
      const lan = new T.Mesh(new T.SphereGeometry(0.24, 10, 8), glowM); lan.position.set(1.5, Hp + 1.7, 1.5); wt.add(lan);
      torch(x0 + 3.4, z0 + 3.2); }

    /* ---- the great anchor, rammed into the sand at the end of the castle road, its cable coiled at its foot ---- */
    { const x0 = 6, z0 = 20, P = [], A = []; reserved.push([x0, z0, 5]); const ir = 0x8a847c, rust = 0xa8643a;
      A.push({ g: CYL, m: M(0, 3.6, 0, 0, 0, 0, 0.72, 7.2, 0.72), c: ir });
      A.push({ g: CYL, m: M(0, 6.4, 0, PI / 2, 0, 0, 0.46, 4.8, 0.46), c: 0x4a3020 }); for (const sz of [-1.6, 1.6]) A.push({ g: new T.TorusGeometry(0.26, 0.07, 6, 14), m: M(0, 6.4, sz), c: ir });
      A.push({ g: new T.TorusGeometry(0.85, 0.17, 8, 22), m: M(0, 8.0, 0), c: ir });
      A.push({ g: new T.TorusGeometry(2.7, 0.46, 10, 26, PI), m: M(0, 3.3, 0, 0, 0, PI), c: ir });
      for (const sd of [-1, 1]) A.push({ g: new T.OctahedronGeometry(0.5, 0), m: M(sd * 2.7, 3.8, 0, 0, 0, sd * 0.55, 1.8, 2.5, 0.5), c: rust });
      A.push({ g: CONE, m: M(0, 0.5, 0, PI, 0, 0, 0.9, 0.8, 0.9), c: ir });
      const an = put(A, iron, x0, z0, 0.2, 0.5, 2.8); an.rotation.z = 0.22;
      const ring = new T.Vector3(0, 8.0 - 0.85, 0).applyEuler(an.rotation).add(an.position);
      for (let i = 0; i < 4; i++) P.push({ g: new T.TorusGeometry(1.15 - i * 0.12, 0.15, 6, 22), m: M(x0 + 2.8, height(x0 + 2.8, z0 + 1.8) + 0.12 + i * 0.26, z0 + 1.8, PI / 2), c: 0xb89a6a });
      const cable = new T.CatmullRomCurve3([ring, new T.Vector3((ring.x + x0 + 2.8) / 2 + 0.4, ring.y * 0.45, (ring.z + z0 + 1.8) / 2 + 0.8), new T.Vector3(x0 + 2.8 - 1.1, height(x0 + 2.8, z0 + 1.8) + 1.0, z0 + 1.8)]); P.push({ g: new T.TubeGeometry(cable, 20, 0.14, 6, false), c: 0xb89a6a });
      for (let l = 0; l < 3; l++) for (let i = 0; i < 3 - l; i++) for (let j = 0; j < 3 - l; j++) P.push({ g: SPH, m: M(x0 - 3.2 + i * 0.46 + l * 0.23, height(x0 - 3.2, z0 + 1.4) + 0.23 + l * 0.37, z0 + 1.4 + j * 0.46 + l * 0.23, 0, 0, 0, 0.46), c: 0x1e1e22 });
      barrel(P, x0 - 3.0, height(x0 - 3, z0 - 1.6) + 0.55, z0 - 1.6, 0.9);
      put(P, wood, 0, 0, 0, 0, 0.01).position.y = 0;
      torch(x0 - 2.6, z0 + 3.6); torch(x0 + 3.2, z0 - 2.8); }

    /* ---- the beach battery: a low stone wall, two cannons guarding the south shore, a pyramid of shot, an upturned rowboat ---- */
    { const x0 = 17, z0 = 33, P = [], I = []; reserved.push([x0, z0, 6]);
      for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; P.push({ g: BOX, m: M(Math.sin(a) * 4.2, 0.45, -Math.cos(a) * 4.2 + 1.5, 0, -a, 0, 1.05, 0.9 + (i % 2) * 0.12, 0.9), c: [0x6a645a, 0x5a544c, 0x747064][i % 3] }); }
      for (const [cx, ry] of [[-1.6, 0.25], [1.7, -0.2]]) { const S = M(cx, 0, 0, 0, ry, 0); const add = (g, m, c, L) => (L || P).push({ g, m: S.clone().multiply(m), c }); add(BOX, M(0, 0.45, 0, 0, 0, 0, 1.2, 0.45, 1.9), 0x5a3a22); for (const wx of [-0.64, 0.64]) for (const wz of [-0.6, 0.6]) add(CYL, M(wx, 0.34, wz, 0, 0, PI / 2, 0.66, 0.14, 0.66), 0x4a3020); add(CYL, M(0, 0.95, -0.5, PI / 2 + 0.12, 0, 0, 0.5, 2.4, 0.5), 0x2a2a2e, I); for (const z of [-1.5, -0.2]) add(new T.TorusGeometry(0.29, 0.05, 6, 16), M(0, 0.95 - (z + 0.5) * 0.12, z), 0xc89a4a, I); }
      for (let l = 0; l < 4; l++) for (let i = 0; i < 4 - l; i++) for (let j = 0; j < 4 - l; j++) I.push({ g: SPH, m: M(3.4 + i * 0.42 + l * 0.21, 0.21 + l * 0.34, 1.2 + j * 0.42 + l * 0.21, 0, 0, 0, 0.42), c: 0x1e1e22 });
      P.push({ g: hullGeo(T, 3.6, 0.9, 1.4), m: M(-3.6, 0.5, 2.6, PI - 0.25, 0.6, 0), c: 0x6a4428 }); beam(P, [-5.2, 0.1, 3.8], [-2.2, 0.4, 4.4], 0.06, 0x8a6a40); beam(P, [-5.0, 0.1, 4.2], [-2.0, 0.2, 4.9], 0.06, 0x8a6a40);
      beam(P, [0, 0, 3.2], [0, 6.2, 3.2], 0.08, 0x4a3020);
      const bat = put(P, wood, x0, z0, PI + 0.4, 0.2, 4); const b2 = new T.Mesh(G3.merge(T, I), iron); b2.castShadow = true; bat.add(b2);
      K.flag(bat, 0.05, 5.6, 3.2, 1.7, 1.05, jolly);
      torch(x0 + 4.6, z0 - 2.4); }

    /* ---- the pier out to the ghost ship, and a gangplank up its side ---- */
    { const a = 0.7, dx = Math.sin(a), dz = Math.cos(a); let rs = 2.4; while (rs < 16 && height(LAKE.x + dx * rs, LAKE.z + dz * rs) < WATER_Y + 0.3) rs += 0.25;
      const P = [], z1 = 2.3, z2 = rs + 1.8, dy = WATER_Y + 0.8;
      for (let z = z1; z < z2; z += 0.36) bx(P, R(-0.04, 0.04), dy, z, 1.9, 0.08, 0.3, R32() < 0.5 ? 0x6a4a2e : 0x7a5a3a);
      for (const sx of [-0.92, 0.92]) bx(P, sx, dy - 0.1, (z1 + z2) / 2, 0.16, 0.14, z2 - z1, 0x4a3422);
      for (let z = z1 + 0.1; z < z2; z += 1.5) for (const sx of [-0.95, 0.95]) beam(P, [sx, WATER_Y - 1.4, z], [sx, dy + 0.9, z], 0.11, 0x3e2a1a);
      for (const sx of [-0.95, 0.95]) beam(P, [sx, dy + 0.8, z1 + 0.1], [sx, dy + 0.8, z2 - 0.4], 0.035, 0xb89a6a);
      P.push({ g: BOX, m: M(0, dy + 0.6, z1 - 0.55, 0.62, 0, 0, 0.8, 0.07, 1.6), c: 0x7a5a3a });
      crate(P, 0.45, dy, z2 - 1.3, 0.7, 0.3); barrel(P, -0.5, dy + 0.5, z2 - 1.0, 0.8);
      const pier = new T.Mesh(G3.merge(T, P), wood); pier.position.set(LAKE.x, 0, LAKE.z); pier.rotation.y = Math.atan2(dx, dz); pier.castShadow = pier.receiveShadow = true; scene.add(pier);
      const lp = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), glowM); lp.position.set(0.95, dy + 1.1, z1 + 0.1); pier.add(lp);
      torch(LAKE.x + dx * (z2 + 0.4) + dz * 1.4, LAKE.z + dz * (z2 + 0.4) - dx * 1.4); torch(LAKE.x + dx * (z2 + 0.4) - dz * 1.4, LAKE.z + dz * (z2 + 0.4) + dx * 1.4); }

    /* ---- palm groves: one instanced palm, 90 of them in clumps ---- */
    { const pal = [], pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new T.Vector3(Math.sin(t * 1.3) * 1.3 * t, t * 7, 0)); } const curve = new T.CatmullRomCurve3(pts);
      pal.push({ g: new T.TubeGeometry(curve, 14, 0.24, 7, false), c: 0x7a5a3a });
      for (let i = 0; i < 8; i++) { const p = curve.getPointAt(i / 8 + 0.03); pal.push({ g: new T.TorusGeometry(0.26, 0.05, 4, 10), m: M(p.x, p.y, p.z, PI / 2), c: 0x5e4428 }); }
      const top = curve.getPointAt(1);
      for (let i = 0; i < 9; i++) { const fg = new T.PlaneGeometry(1.0, 3.6, 1, 6); fg.translate(0, 1.8, 0); const p = fg.attributes.position; for (let q = 0; q < p.count; q++) { const y = p.getY(q) / 3.6; p.setZ(q, -y * y * 1.9); p.setX(q, p.getX(q) * (1 - y * y * 0.65)); } fg.computeVertexNormals(); pal.push({ g: fg, m: new T.Matrix4().compose(top, new T.Quaternion().setFromEuler(new T.Euler(-0.8 - (i % 3) * 0.14, i / 9 * TAU, 0, 'YXZ')), new T.Vector3(1, 1, 1)), c: i % 2 ? 0x2f8a3a : 0x4aa84a }); }
      for (let i = 0; i < 3; i++) pal.push({ g: SPH, m: M(top.x + Math.cos(i * 2.1) * 0.28, top.y - 0.3, top.z + Math.sin(i * 2.1) * 0.28, 0, 0, 0, 0.42), c: 0x5a3a1a });
      const N = 90, inst = new T.InstancedMesh(G3.merge(T, pal), VC({ side: T.DoubleSide, roughness: 0.8 }), N), m4 = new T.Matrix4(), pk = pickSpot(12, 60); let n = 0;
      const ok = (x, z) => placeOk(x, z, 1.4) && pathDist(x, z) > 2.8 && height(x, z) > WATER_Y + 0.45 && Math.hypot(x, z) < 62;
      for (let g = 0; g < 500 && n < N; g++) { const c = pk(); if (!c) continue; const kk = 3 + Math.floor(R32() * 5); for (let j = 0; j < kk && n < N; j++) { const x = c.x + R(-4.5, 4.5), z = c.z + R(-4.5, 4.5); if (!ok(x, z)) continue; const s = R(0.75, 1.3); m4.compose(new T.Vector3(x, height(x, z) - 0.1, z), new T.Quaternion().setFromEuler(new T.Euler(0, R(0, TAU), 0)), new T.Vector3(s, s * R(0.85, 1.2), s)); inst.setMatrixAt(n++, m4); } }
      inst.count = n; inst.castShadow = inst.receiveShadow = true; scene.add(inst); }

    K.finish(wood);
  }

  /* ================================================================== the words */
  const S = {
    en: {
      rg_cannon: 'Cannon Fort', rg_cannon_b: 'Sink the ship that carries the answer.', rg_cannon_hi: 'Ahoy! Ships on the horizon, and every sail carries a number.', rg_cannon_how: 'Work out the sum, then fire at the ship with the answer on its sail.', rg_cannon_q: 'Aim true, gunner:',
      rg_bottles: 'Bottle Beach', rg_bottles_b: 'Messages wash in with the tide.', rg_bottles_hi: 'The tide brings messages in bottles. One word is missing from each.', rg_bottles_how: 'Read the sentence, then pick the bottle with the word that fits. It washes ashore.', rg_bottles_q: 'A message from the sea:',
      rg_parrot: "The Parrot's Tavern", rg_parrot_b: 'The parrot knows how every word is spelled.', rg_parrot_hi: 'Welcome aboard! Our parrot squawks words all day long.', rg_parrot_how: 'Look at the picture, then pick the sign that spells the word right. The parrot flies to it.', rg_parrot_q: 'Squawk!',
      rg_map: 'The Treasure Map', rg_map_b: 'X marks the spot. But which X?', rg_map_hi: "Four X's on the map, and only one has gold under it.", rg_map_how: 'Solve the riddle, then dig at the X with the answer.', rg_map_q: 'The map says:'
    },
    he: {
      rg_cannon: 'מבצר התותחים', rg_cannon_b: 'מטביעים את הספינה שנושאת את התשובה.', rg_cannon_hi: 'אהוי! ספינות באופק, ועל כל מפרש כתוב מספר.', rg_cannon_how: 'פותרים את התרגיל, ויורים בספינה שעל המפרש שלה התשובה.', rg_cannon_q: 'כוונו היטב, תותחנים:',
      rg_bottles: 'חוף הבקבוקים', rg_bottles_b: 'הגאות מביאה מכתבים בבקבוקים.', rg_bottles_hi: 'הגאות מביאה מכתבים בבקבוקים, ובכל אחד חסרה מילה.', rg_bottles_how: 'קוראים את המשפט, ובוחרים את הבקבוק עם המילה שמתאימה. הוא נסחף אל החוף.', rg_bottles_q: 'מכתב מהים:',
      rg_parrot: 'פונדק התוכי', rg_parrot_b: 'התוכי יודע איך כותבים כל מילה.', rg_parrot_hi: 'ברוכים הבאים לסיפון! התוכי שלנו צורח מילים כל היום.', rg_parrot_how: 'מסתכלים בתמונה, ובוחרים את השלט שבו המילה כתובה נכון. התוכי עף אליו.', rg_parrot_q: 'קראא!',
      rg_map: 'מפת האוצר', rg_map_b: 'האיקס מסמן את המקום. אבל איזה איקס?', rg_map_hi: 'ארבעה איקסים על המפה, ורק מתחת לאחד מהם יש זהב.', rg_map_how: 'פותרים את החידה, וחופרים באיקס שעליו התשובה.', rg_map_q: 'המפה אומרת:'
    }
  };

  KQRealms.define('pirate', {
    games: [
      { id: 'rg_cannon', kind: 'math', stage: 'cannon', theme: 'pirate_battery', host: 'pirate', icon: 'cannon' },
      { id: 'rg_bottles', kind: 'reading', stage: 'bottles', theme: 'pirate_beach', host: 'fisher', icon: 'scroll' },
      { id: 'rg_parrot', kind: 'spelling', stage: 'parrot', theme: 'pirate_tavern', host: 'smith', icon: 'parrot' },
      { id: 'rg_map', kind: 'logic', stage: 'treasure', theme: 'pirate_island', host: 'door', icon: 'map' }
    ],
    strings: S, themes: THEMES, stages: STAGES, landmarks, scenery,
    gens: { rg_cannon: cannonQ, rg_bottles: bottlesQ, rg_parrot: parrotQ, rg_map: mapQ }
  });
})();
