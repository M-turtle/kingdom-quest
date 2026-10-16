/* Kingdom Quest — THE SKY ISLES: four games of its own (registered with KQRealms, played in rooms3d.js halls).
     Kite Hill           (math)     four kites ride the wind, an answer over each: the right kite soars and loops the loop, a wrong one's string snaps
     Wind Chime Temple   (reading)  chimes hang in the temple arch: ring the one whose word means the same, and its note ripples out over the isles
     The Sky Writer      (writing)  the wind has scrambled a word: pick the cloud that spells it right and the little plane writes it across the sky
     Star Observatory    (logic)    four stars over the dome: the right one blazes up and draws its constellation
   Every hall and prop is built here from primitives (no downloaded art); every question comes in English and Hebrew, six age bands. */
(function () {
  'use strict';
  if (!window.KQRealms) return;
  const PI = Math.PI, TAU = PI * 2;
  const HALL = () => KQRealms.hall;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const one = v => (Math.round(v * 10) / 10).toFixed(1);
  /* the right answer plus up to three others, never dropping the answer */
  const four = (H, a, others) => H.shuffle([a].concat(H.shuffle(H.uniq(others.filter(o => String(o) !== String(a)))).slice(0, 3)));

  /* ================================================================== the questions */
  const NOUNS = { en: { kites: 'kites', birds: 'birds', balloons: 'balloons' }, he: { kites: 'עפיפונים', birds: 'ציפורים', balloons: 'בלונים' } };
  /* the kites: sums, place value and rounding, heights, decimals, the cold on the peaks, powers of ten */
  function kiteQ(band, lang, H) {
    const { ri, pick, near, shuffle } = H, he = lang === 'he', N = NOUNS[he ? 'he' : 'en'], k = Math.random();
    const mk = (q, a, step) => ({ q, a, ch: near(a, 4, step || 1) });
    if (band <= 1) { const a = ri(2, 6), b = ri(2, 9 - a);   /* at least two, so 'join them' / 'מצטרפים' always agree */
      if (k < 0.35) return mk(he ? `${a} ${N.kites} עפים ברוח. עוד ${b} מצטרפים. כמה ${N.kites} יש עכשיו?` : `${a} ${N.kites} fly in the wind. ${b} more join them. How many ${N.kites} now?`, a + b);
      if (k < 0.6) return mk(he ? `יש ${a + b} ${N.balloons}. ${b} עפים ברוח. כמה ${N.balloons} נשארו?` : `There are ${a + b} ${N.balloons}. ${b} float away. How many are left?`, a);
      return k < 0.8 ? mk(`${a} + ${b} = ?`, a + b) : mk(`${a + b} − ${a} = ?`, b); }
    if (band === 2) {
      if (k < 0.3) { const t = ri(1, 9), o = ri(0, 9); return mk(he ? `${t} עשרות ו-${o} אחדות הן המספר…` : `${t} tens and ${o} ones make the number…`, t * 10 + o, 10); }
      if (k < 0.55) { const x = ri(21, 89), set = H.uniq([x, +String(x).split('').reverse().join(''), x + ri(1, 8), x - ri(1, 8), ri(12, 98)].filter(v => v > 9 && v < 100)).slice(0, 4), a = Math.max(...set); return { q: he ? 'איזה עפיפון עף הכי גבוה? (המספר הגדול ביותר)' : 'Which kite flies highest? (the greatest number)', a, ch: shuffle(set) }; }
      const a = ri(11, 45), b = ri(5, 40); return k < 0.8 ? mk(`${a} + ${b} = ?`, a + b) : mk(`${a + b} − ${b} = ?`, a); }
    if (band === 3) {
      if (k < 0.3) { const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), n = ds[0] * 100 + ds[1] * 10 + ds[2], pos = ri(0, 2), d = ds[pos], val = d * Math.pow(10, 2 - pos); return { q: he ? `מה הערך של הספרה ${d} במספר ${n}?` : `What is the value of the digit ${d} in ${n}?`, a: val, ch: shuffle([d, d * 10, d * 100, d * 1000]) }; }
      if (k < 0.55) { let n; do { n = ri(101, 989); } while (n % 10 === 5 || n % 10 === 0); const a = Math.round(n / 10) * 10; return mk(he ? `עגלו את ${n} לעשרת הקרובה.` : `Round ${n} to the nearest ten.`, a, 10); }
      const x = ri(2, 9), y = ri(3, 9); return k < 0.8 ? mk(he ? `ל-${x} עפיפונים יש ${y} סרטים בזנב של כל אחד. כמה סרטים יש בסך הכול?` : `${x} kites have ${y} bows on each tail. How many bows in all?`, x * y, 2) : mk(`${x * y} ÷ ${x} = ?`, y); }
    if (band === 4) {
      if (k < 0.3) { let n; do { n = ri(1010, 9890); } while (n % 100 === 50); return mk(he ? `עגלו את ${n} למאה הקרובה.` : `Round ${n} to the nearest hundred.`, Math.round(n / 100) * 100, 100); }
      if (k < 0.6) { const a = ri(120, 480), b = ri(45, 260); return mk(he ? `עפיפון עולה לגובה ${a} מטרים, ואז עוד ${b} מטרים. באיזה גובה הוא עכשיו?` : `A kite climbs to ${a} m, then another ${b} m. How high is it now?`, a + b, 10); }
      const x = ri(13, 48), y = ri(3, 9); return mk(`${x} × ${y} = ?`, x * y, 3); }
    if (band === 5) {
      if (k < 0.4) { const a = ri(11, 89) / 10, b = ri(11, 69) / 10, s = Math.round((a + b) * 10) / 10; return { q: `${one(a)} + ${one(b)} = ?`, a: one(s), ch: four(H, one(s), [s + 0.1, s - 0.1, s + 1, s - 1, s + 0.2].map(one)) }; }
      if (k < 0.75) { const a = ri(2, 12), b = ri(3, 15); return mk(he ? `על הפסגה הגבוהה הטמפרטורה היא ${-a} מעלות. היא עולה ב-${b} מעלות. מה הטמפרטורה עכשיו?` : `On the high peak it is ${-a}°. It warms up by ${b}°. What is the temperature now?`, b - a); }
      const p = pick([10, 20, 25, 50]), n = pick([40, 80, 120, 200, 400]); return mk(he ? `${p}% מתוך ${n} ציפורים עפות דרומה. כמה ציפורים עפות דרומה?` : `${p}% of ${n} birds fly south. How many birds fly south?`, n * p / 100, 5); }
    if (k < 0.35) { const a = ri(2, 9), e = pick([2, 3]), v = a * Math.pow(10, e); return { q: `${a} × 10${e === 2 ? '²' : '³'} = ?`, a: v, ch: shuffle([v, v / 10, v * 10, a + Math.pow(10, e)]) }; }
    if (k < 0.7) { const a = ri(15, 60), b = ri(2, 12), c = ri(3, 9); return mk(`(${a} − ${b}) × ${c} = ?`, (a - b) * c, c); }
    const s = ri(11, 25); return mk(`${s}² = ?`, s * s, 10);
  }

  /* the wind chimes: which word means the same? (easy pairs first, then the word bank's) */
  const EASY_SYN = {
    en: [['big', 'large', ['tiny', 'slow', 'wet']], ['small', 'little', ['huge', 'loud', 'tall']], ['happy', 'glad', ['sad', 'cross', 'sleepy']], ['fast', 'quick', ['slow', 'soft', 'cold']], ['shut', 'close', ['open', 'eat', 'jump']], ['begin', 'start', ['end', 'sleep', 'hide']], ['shout', 'yell', ['whisper', 'walk', 'draw']], ['pretty', 'lovely', ['ugly', 'hard', 'late']], ['look', 'see', ['hear', 'run', 'sing']], ['sick', 'ill', ['well', 'rich', 'full']]],
    he: [['גדול', 'ענק', ['קטן', 'איטי', 'רטוב']], ['קטן', 'זעיר', ['ענק', 'רועש', 'גבוה']], ['שמח', 'עליז', ['עצוב', 'כועס', 'עייף']], ['מהיר', 'זריז', ['איטי', 'רך', 'קר']], ['לצעוק', 'לצווח', ['ללחוש', 'ללכת', 'לצייר']], ['יפה', 'נאה', ['מכוער', 'קשה', 'מאוחר']], ['להסתכל', 'להביט', ['לשמוע', 'לרוץ', 'לשיר']], ['חכם', 'נבון', ['עצלן', 'רטוב', 'רועש']], ['שקט', 'דומם', ['רועש', 'צבעוני', 'חם']], ['ללכת', 'לצעוד', ['לשבת', 'לישון', 'לאכול']]]
  };
  function chimeQ(band, lang, H) { const he = lang === 'he', W = window.KQ_WORDS && KQ_WORDS[he ? 'he' : 'en'], bank = band <= 2 || !W || !W.synonyms ? EASY_SYN[he ? 'he' : 'en'] : W.synonyms;
    const it = H.pick(bank), w = it[0], a = it[1], ds = it[2].slice(0, 3); for (const o of H.shuffle(bank.filter(e => e !== it).map(e => e[1]))) { if (ds.length >= 3) break; if (o !== a && o !== w && !ds.includes(o)) ds.push(o); }
    return { q: he ? `איזו מילה אומרת אותו דבר כמו "${w}"?` : `Which word means the same as "${w}"?`, a, ch: H.shuffle([a].concat(ds)) }; }

  /* the sky writer: a picture word whose letters the wind scrambled; the clouds carry the right spelling and three near misses */
  const SWORDS = {
    en: [[['sun', 'sun'], ['star', 'star'], ['moon', 'moon'], ['kite', 'kite'], ['bird', 'bird'], ['cloud', 'cloud'], ['rain', 'rain'], ['bee', 'bee'], ['bell', 'bell'], ['dove', 'dove']],
         [['rainbow', 'rainbow'], ['balloon', 'balloon'], ['rocket', 'rocket'], ['comet', 'comet'], ['eagle', 'eagle'], ['feather', 'feather'], ['plane', 'plane'], ['storm', 'storm'], ['umbrella', 'umbrella'], ['tornado', 'tornado']],
         [['lightning', 'lightning'], ['telescope', 'telescope'], ['butterfly', 'butterfly'], ['snowflake', 'snowflake'], ['astronaut', 'rocket'], ['thunderstorm', 'storm'], ['hurricane', 'tornado'], ['constellation', 'glowstar'], ['mountain', 'mountain']]],
    he: [[['שמש', 'sun'], ['ירח', 'moon'], ['כוכב', 'star'], ['ציפור', 'bird'], ['ענן', 'cloud'], ['גשם', 'rain'], ['דבורה', 'bee'], ['יונה', 'dove'], ['פעמון', 'bell']],
         [['קשת', 'rainbow'], ['בלון', 'balloon'], ['טיל', 'rocket'], ['שביט', 'comet'], ['נשר', 'eagle'], ['נוצה', 'feather'], ['מטוס', 'plane'], ['סערה', 'storm'], ['מטרייה', 'umbrella'], ['עפיפון', 'kite']],
         [['ברק', 'lightning'], ['טלסקופ', 'telescope'], ['פרפר', 'butterfly'], ['פתיתים', 'snowflake'], ['אסטרונאוט', 'rocket'], ['רעמים', 'storm'], ['הוריקן', 'tornado'], ['גלקסיה', 'glowstar'], ['פסגה', 'mountain']]]
  };
  function writerQ(band, lang, H) { const he = lang === 'he', L = SWORDS[he ? 'he' : 'en'], tier = band <= 2 ? 0 : band <= 4 ? 1 : 2, it = H.pick(L[tier]), w = it[0];
    const letters = [...w].map(c => he ? H.unfin(c) : c.toUpperCase()); let sc = letters; for (let g = 0; g < 30 && sc.join('') === letters.join(''); g++) sc = H.shuffle(letters);
    return { q: (he ? 'הרוח ערבבה את האותיות: ' : 'The wind mixed up the letters: ') + sc.join(' - ') + (he ? '. איזו מילה זו?' : '. Which word is it?'), a: w, ch: H.shuffle([w].concat(H.misspell(w, he, 3))), icon: it[1] }; }

  /* the stars: sky patterns, star values, pairs that go together, the star code, balancing, when do they shine together */
  const SKY_PAT = { en: ['sun', 'moon', 'star', 'cloud', 'kite', 'bird'], he: ['שמש', 'ירח', 'כוכב', 'ענן', 'עפיפון', 'ציפור'] };
  const SKY_PAIRS = {
    en: [['Bird goes with nest as bee goes with ___', 'hive', ['cave', 'kite', 'cloud']], ['Day goes with sun as night goes with ___', 'moon', ['rain', 'bird', 'kite']], ['Rain goes with umbrella as sun goes with ___', 'sun hat', ['snowman', 'boots', 'scarf']], ['Up goes with down as high goes with ___', 'low', ['sky', 'tall', 'fly']], ['A fish has a fin, and a bird has a ___', 'wing', ['paw', 'shell', 'hoof']], ['Snow goes with winter as flowers go with ___', 'spring', ['night', 'cloud', 'sea']], ['Cloud goes with rain as volcano goes with ___', 'lava', ['snow', 'ice', 'leaves']], ['A plane has a pilot, and a ship has a ___', 'captain', ['farmer', 'baker', 'doctor']]],
    he: [['ציפור הולכת עם קן, ודבורה הולכת עם ___', 'כוורת', ['מערה', 'עפיפון', 'ענן']], ['יום הולך עם שמש, ולילה הולך עם ___', 'ירח', ['גשם', 'ציפור', 'עפיפון']], ['גשם הולך עם מטרייה, ושמש הולכת עם ___', 'כובע שמש', ['איש שלג', 'מגפיים', 'צעיף']], ['למעלה הולך עם למטה, וגבוה הולך עם ___', 'נמוך', ['שמיים', 'ארוך', 'לעוף']], ['לדג יש סנפיר, ולציפור יש ___', 'כנף', ['כפה', 'קונכייה', 'פרסה']], ['שלג הולך עם חורף, ופרחים הולכים עם ___', 'אביב', ['לילה', 'ענן', 'ים']], ['ענן הולך עם גשם, והר געש הולך עם ___', 'לבה', ['שלג', 'קרח', 'עלים']], ['למטוס יש טייס, ולספינה יש ___', 'רב חובל', ['חקלאי', 'אופה', 'רופא']]]
  };
  const CODE_W = { en: ['CAB', 'BAD', 'DAB', 'FED', 'BEE', 'ACE', 'BED', 'CAFE', 'BEAD', 'FACE'], he: ['גב', 'דג', 'אב', 'בד', 'גג', 'הד', 'זה', 'גדה', 'בגד', 'אבד'] };
  const HE_AB = 'אבגדהוזחטיכלמנסעפצקרשת';
  function starQ(band, lang, H) {
    const { ri, pick, shuffle, near } = H, he = lang === 'he', NEXT = he ? 'מה בא אחר כך?' : 'What comes next?', P = SKY_PAT[he ? 'he' : 'en'];
    if (band <= 1) { const [a, b, c, d] = shuffle(P), seq = Math.random() < 0.5 ? [a, b, b, a, b, b, a] : [a, b, a, b, a]; return { q: `${NEXT} ${seq.join(', ')}, ?`, a: b, ch: shuffle([a, b, c, d]) }; }
    if (band === 2) { const x = ri(1, 9), y = ri(1, 9); return { q: he ? `שמש שווה ${x}, וירח שווה ${y}. כמה שווים שמש וירח ביחד?` : `A sun is worth ${x} and a moon is worth ${y}. What are a sun and a moon worth together?`, a: x + y, ch: near(x + y, 4, 1) }; }
    if (band === 3) { const it = pick(SKY_PAIRS[he ? 'he' : 'en']); return { q: it[0], a: it[1], ch: shuffle([it[1]].concat(it[2])) }; }
    if (band === 4) { const w = pick(CODE_W[he ? 'he' : 'en']), idx = [...w].map(c => he ? HE_AB.indexOf(c) + 1 : c.charCodeAt(0) - 64), code = v => v.join('-'), a = code(idx);
      const alt = [code(idx.slice().reverse()), code(idx.map((v, i) => i === 0 ? v + 1 : v)), code(idx.map((v, i) => i === idx.length - 1 ? v + 1 : v)), code(idx.map(v => v + 1))];
      return { q: he ? `בצופן הכוכבים כל אות היא המקום שלה באלף-בית (א = 1, ב = 2 …). מה הקוד של "${w}"?` : `In the star code every letter is its place in the alphabet (A = 1, B = 2 …). What is the code for "${w}"?`, a, ch: four(H, a, alt) }; }
    if (band === 5) { const s = ri(2, 9), m = ri(1, 9); return { q: he ? `כוכב ועוד כוכב שווים ${2 * s}. כוכב ועוד ירח שווים ${s + m}. כמה שווה הירח?` : `A star plus a star is ${2 * s}. A star plus a moon is ${s + m}. What is the moon worth?`, a: m, ch: near(m, 4, 1) }; }
    if (Math.random() < 0.6) { const [p, q] = pick([[2, 3], [3, 4], [4, 6], [2, 5], [3, 5], [4, 5], [6, 8], [4, 10]]), l = p * q / gcd(p, q); return { q: he ? `הכוכב מהבהב כל ${p} לילות, והירח זוהר כל ${q} לילות. הלילה שניהם מאירים. בעוד כמה לילות הם יאירו שוב ביחד?` : `The star flashes every ${p} nights and the moon glows every ${q} nights. Tonight both shine. In how many nights will they shine together again?`, a: l, ch: four(H, l, [p * q, p + q, l * 2, l + p, Math.max(p, q)]) }; }
    const a0 = ri(1, 3), b0 = ri(1, 3), seq = [a0, b0]; for (let i = 0; i < 5; i++) seq.push(seq[i] + seq[i + 1]); const a = seq[5] + seq[6]; return { q: `${NEXT} ${seq.join(', ')}, ?`, a, ch: near(a, 4, 2) };
  }

  /* ================================================================== shared 3D pieces */
  const lay = (c, sp) => { const narrow = c.camera.aspect < 1.05; return { k: narrow ? 0.85 : 1, sp: sp * (narrow ? 0.72 : 1) }; };
  function flyTo(c, obj, to, dur, arc, done) { const from = obj.position.clone(); c.tween(dur, k => { const e = c.ease(k); obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(PI * k) * arc; }, done); }
  /* a puffy cloud: a cluster of soft spheres */
  function cloudMesh(c, s, col) { const { T, M } = c, g = new T.Group(), m = M(col || 0xffffff, { roughness: 1, emissive: 0x8090a0, emissiveIntensity: 0.25 }); for (const [x, y, z, r] of [[0, 0, 0, 0.9], [0.9, -0.1, 0.1, 0.7], [-0.9, -0.12, 0, 0.72], [0.4, 0.45, -0.1, 0.62], [-0.45, 0.4, 0.05, 0.6], [1.5, -0.25, 0, 0.45], [-1.5, -0.25, 0, 0.45]]) c.sph(r, m, x, y, z, g, 14); g.scale.setScalar(s || 1); return g; }
  /* a diamond kite: four coloured panels, cross spars, a tail of bows */
  function kiteMesh(c, cA, cB) { const { T, M } = c, g = new T.Group(), P = [[0, 1.3], [0.8, 0.25], [0, -1.1], [-0.8, 0.25]];
    for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4], sh = new T.Shape(); sh.moveTo(0, 0.25); sh.lineTo(a[0], a[1]); sh.lineTo(b[0], b[1]); sh.closePath(); const m = new T.Mesh(new T.ShapeGeometry(sh), M(i % 2 ? cA : cB, { side: T.DoubleSide, roughness: 0.7 })); g.add(m); }
    const sp = M(0x6a4a2a); c.box(0.05, 2.4, 0.05, sp, 0, 0.1, 0.02, g); c.box(1.6, 0.05, 0.05, sp, 0, 0.25, 0.02, g);
    const tail = []; for (let i = 0; i < 5; i++) { const b = new T.Group(); for (const sd of [-1, 1]) { const cn = c.cone(0.12, 0.22, M([0xff5a5a, 0xffd23a, 0x5ac8ff][i % 3], { roughness: 0.6 }), sd * 0.1, 0, 0, b, 4); cn.rotation.z = sd * PI / 2; } g.add(b); tail.push(b); } g.userData.tail = tail; return g; }
  /* a wind chime: a crown disc, five hanging tubes and a clapper */
  function chimeMesh(c, col) { const { T, M } = c, g = new T.Group(), tube = M(col, { metalness: 0.9, roughness: 0.25 }), wd = M(0x8a6a44, { roughness: 0.6 }); c.cyl(0.55, 0.55, 0.12, wd, 0, 0, 0, g, 20); const tubes = [];
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, L = 1.2 + i * 0.22, t = new T.Group(); t.position.set(Math.cos(a) * 0.38, -0.1, Math.sin(a) * 0.38); g.add(t); c.cyl(0.008, 0.008, 0.4, M(0xd8d0c0), 0, -0.2, 0, t, 3); c.cyl(0.07, 0.07, L, tube, 0, -0.4 - L / 2, 0, t, 12); tubes.push(t); }
    c.sph(0.14, wd, 0, -1.2, 0, g, 10); const sail = c.box(0.36, 0.5, 0.03, M(col, { metalness: 0.6, roughness: 0.3 }), 0, -2.3, 0, g); g.userData.tubes = tubes; g.userData.tubeM = tube; return g; }
  /* a little biplane with a spinning propeller */
  function planeMesh(c) { const { T, M } = c, g = new T.Group(), red = M(0xe8443a, { roughness: 0.5 }), cream = M(0xf4ecd8, { roughness: 0.6 }), dark = M(0x2a2a30);
    const body = c.cyl(0.32, 0.2, 2.6, red, 0, 0, 0, g, 14); body.rotation.z = PI / 2; for (const y of [0.34, -0.3]) c.box(0.7, 0.07, 3.2, cream, 0.35, y, 0, g); for (const z of [-1.2, 1.2]) c.cyl(0.03, 0.03, 0.64, dark, 0.35, 0.02, z, g, 4);
    c.box(0.5, 0.06, 1.1, cream, -1.25, 0.05, 0, g); c.box(0.45, 0.6, 0.06, red, -1.3, 0.3, 0, g); c.sph(0.2, M(0x9ad8ff, { metalness: 0.3, roughness: 0.2 }), 0.3, 0.32, 0, g, 10);
    const prop = new T.Group(); prop.position.x = 1.35; g.add(prop); c.box(0.06, 1.3, 0.12, dark, 0, 0, 0, prop); c.sph(0.1, dark, 0, 0, 0, prop, 8); g.userData.prop = prop; return g; }
  /* a five-point star, extruded and glowing */
  function starGeo(T, r) { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = PI / 2 + i / 10 * TAU, rr = i % 2 ? r * 0.45 : r; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: r * 0.3, bevelEnabled: true, bevelThickness: r * 0.08, bevelSize: r * 0.06, bevelSegments: 2 }); g.translate(0, 0, -r * 0.15); return g; }
  /* a floating island: grass on top, a rocky root hanging below */
  function island(c, r, x, y, z, grass, tex) { const { T, scene, M } = c, g = new T.Group(); g.position.set(x, y, z); scene.add(g); const top = c.cyl(r, r * 0.92, 0.6, M(grass || 0x6ab84a, { roughness: 1, map: tex || null }), 0, -0.3, 0, g, 24); const rock = new T.Mesh(new T.ConeGeometry(r * 0.92, r * 1.6, 12), M(0x8a7a6a, { roughness: 1, flatShading: true })); rock.rotation.x = PI; rock.position.y = -0.6 - r * 0.8; g.add(rock); return g; }
  function roundTree(c, parent, x, z, s) { const { M } = c; c.cyl(0.14 * s, 0.2 * s, 1.6 * s, M(0x7a5a3a), x, 0.8 * s, z, parent, 8); c.sph(0.9 * s, M(0x4aa84a, { roughness: 0.9 }), x, 2.0 * s, z, parent, 12); c.sph(0.6 * s, M(0x5ac05a, { roughness: 0.9 }), x + 0.4 * s, 2.4 * s, z + 0.2 * s, parent, 10); }
  function cloudSea(c, y, n, rad) { const { scene } = c, list = []; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r = rad * (0.5 + Math.random() * 0.6), cl = cloudMesh(c, 2.4 + Math.random() * 2.6); cl.position.set(Math.cos(a) * r, y + Math.random() * 2, Math.sin(a) * r); scene.add(cl); list.push(cl); } const k0 = Math.random() * 6; c.updaters.push((dt, tm) => list.forEach((cl, i) => { cl.position.x += Math.sin(tm * 0.05 + i + k0) * dt * 0.4; })); return list; }

  /* ================================================================== the halls */
  const THEMES = {
    /* Kite Hill: the grassy top of a floating isle, the sea of clouds below, other isles drifting far off */
    sky_hill: { palette: { noFloor: true, sky: 0x8cc8ff, ground: 0x6aa84a, fog: 0xcfe8ff, wall: ['cloud', '#ffffff', '#e8f4ff'], floor: ['moss', '#6ab84a', '#4a9a3a'], hemi: [0xffffff, 0x6a9a5a], key: 0xfff4e0, dust: { c: 0xffffff, n: 30, mode: 'drift' } }, look: { keyC: 0xffffff, grade: 'sky', exposure: 1.0, fogD: 0.006, rim: 0xffffff, face: 0x1a2a4a, accent: '#bfe4ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, M } = c; HALL().skyDome(c, 0x3a8ae0, 0xd8f0ff, false); const gt = c.wallTex('moss', '#72c052', '#5aa842'); gt.repeat.set(8, 8); island(c, 16, 0, 0, -2, 0xffffff, gt);
        cloudSea(c, -9, 26, 40); for (const [x, y, z, r] of [[-26, 3, -30, 4], [30, 6, -36, 5], [-40, 9, -12, 3], [38, -1, -8, 3.5]]) { const g = island(c, r, x, y, z); roundTree(c, g, 0, 0, r * 0.3); }
        for (const [x, z, s] of [[-10, -9, 1.3], [11, -10, 1.2], [-13, -2, 1.0], [13, -3, 1.1]]) roundTree(c, scene, x, z, s); for (let i = 0; i < 40; i++) { const a = c.R(0, TAU), r = c.R(6, 14); c.sph(0.12, M([0xff7eb6, 0xffd23a, 0xffffff, 0xb48cff][i % 4]), Math.cos(a) * r, 0.1, Math.sin(a) * r - 2, null, 6); }
        c.sprite(0xfff6d0, 14, 20, 26, -60, null, 0.9); } },
    /* the Wind Chime Temple: a white marble terrace in the evening sky, columns and a long lintel where the chimes hang */
    sky_temple: { palette: { noFloor: true, sky: 0xffb890, ground: 0xe8e0d0, fog: 0xffd8c0, wall: ['brick', '#f4efe6', '#e0d8c8'], floor: ['brick', '#f4efe6', '#e2dac8'], hemi: [0xfff0e0, 0xa08070], key: 0xffe0c0, dust: { c: 0xfff0d0, n: 40, mode: 'drift' } }, look: { keyC: 0xfff0e0, grade: 'dusk', exposure: 1.0, fogD: 0.008, rim: 0xffc8a0, face: 0x2a1a30, accent: '#ffd8b0', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, M } = c; HALL().skyDome(c, 0x6a4a9a, 0xffb088, 300, 0xfff0e0); const marble = M(0xf4efe6, { roughness: 0.4, map: c.wallTex('brick', '#f4efe6', '#e6dece') }); const deck = c.cyl(15, 14, 1.2, marble, 0, -0.6, -2, null, 40); deck.material.map.repeat.set(10, 10); const root = new T.Mesh(new T.ConeGeometry(14, 16, 14), M(0x9a8a7a, { roughness: 1, flatShading: true })); root.rotation.x = PI; root.position.set(0, -9.2, -2); scene.add(root);
        cloudSea(c, -8, 24, 40); for (let i = 0; i < 7; i++) { const a = PI * (1.1 + i / 6 * 0.8), x = Math.cos(a) * 11, z = Math.sin(a) * 11 - 2; c.cyl(0.55, 0.62, 7.4, marble, x, 3.7, z, null, 18); c.box(1.5, 0.4, 1.5, marble, x, 7.6, z); c.box(1.4, 0.35, 1.4, marble, x, 0.18, z); }
        c.sprite(0xffd8a0, 16, -18, 7, -60, null, 0.9); c.sprite(0xff9a6a, 44, -18, 7, -62, null, 0.3); } },
    /* the Sky Writer's airfield: a timber deck on a floating isle, a windsock, bunting, clouds everywhere */
    sky_field: { palette: { noFloor: true, sky: 0x7ac0ff, ground: 0x9a7a5a, fog: 0xd8ecff, wall: ['cloud', '#ffffff', '#e8f4ff'], floor: ['plank', '#b08a5a', '#9a7448'], hemi: [0xffffff, 0x7a6a5a], key: 0xfff4e0, dust: { c: 0xffffff, n: 30, mode: 'drift' } }, look: { keyC: 0xffffff, grade: 'sky', exposure: 1.0, fogD: 0.005, rim: 0xffffff, face: 0x1a2a4a, accent: '#bfe4ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, M } = c; HALL().skyDome(c, 0x2a7ae0, 0xe0f2ff, false); const isle = island(c, 15, 0, 0, -2, 0x6ab84a); const deck = c.box(12, 0.2, 9, M(0xb08a5a, { roughness: 0.8, map: c.wallTex('plank', '#b08a5a', '#9a7448') }), 0, 0.1, 1); deck.material.map.repeat.set(4, 3);
        cloudSea(c, -9, 22, 40); for (let i = 0; i < 9; i++) { const cl = cloudMesh(c, c.R(1.6, 3)); cl.position.set(c.R(-30, 30), c.R(14, 21), c.R(-40, -18)); scene.add(cl); }   /* kept above the band where the plane writes */
        const sock = new T.Group(); sock.position.set(9, 0, -4); scene.add(sock); c.cyl(0.08, 0.1, 5, M(0xd8d8e0, { metalness: 0.6 }), 0, 2.5, 0, sock, 8); const cone = new T.Group(); cone.position.y = 4.8; sock.add(cone); for (let i = 0; i < 4; i++) { const r = new T.Mesh(new T.CylinderGeometry(0.34 - i * 0.05, 0.3 - i * 0.05, 0.5, 12, 1, true), M(i % 2 ? 0xffffff : 0xff6a3a, { side: T.DoubleSide })); r.rotation.z = PI / 2; r.position.x = 0.3 + i * 0.5; cone.add(r); } c.updaters.push((dt, tm) => { cone.rotation.y = Math.sin(tm * 0.7) * 0.5; cone.rotation.z = -0.1 + Math.sin(tm * 2.3) * 0.06; });
        for (let i = 0; i < 12; i++) { const f = c.cone(0.3, 0.5, M([0xff5a5a, 0xffd23a, 0x5ac8ff, 0x7ad86a][i % 4], { side: T.DoubleSide }), -6.5 + i * 1.1, 5.4 - Math.sin(i / 11 * PI) * 0.6, -6, null, 3); f.rotation.x = PI; } c.box(13, 0.03, 0.03, M(0xffffff), 0, 5.7, -6);
        const hang = new T.Group(); hang.position.set(-10, 0, -5); scene.add(hang); const hg = new T.Mesh(new T.CylinderGeometry(3, 3, 6, 20, 1, false, 0, PI), M(0xc8ccd8, { metalness: 0.5, roughness: 0.4, side: T.DoubleSide })); hg.rotation.z = PI / 2; hg.rotation.y = PI / 2; hg.position.y = 0; hang.add(hg); } },
    /* the Star Observatory: a stone terrace at night under a sky full of stars, a great brass telescope */
    sky_dome: { palette: { noFloor: true, sky: 0x050a24, ground: 0x2a2a3a, fog: 0x0a1030, wall: ['brick', '#3a3a4e', '#4a4a60'], floor: ['brick', '#4a4a5e', '#3a3a4c'], hemi: [0x9ab0ff, 0x10102a], key: 0xc8d8ff, dust: { c: 0xd8e0ff, n: 40, mode: 'drift' } }, look: { keyC: 0xdfe8ff, grade: 'night', exposure: 1.15, fogD: 0.006, rim: 0x9ab8ff, face: 0x10163a, accent: '#c8d8ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, M } = c; HALL().skyDome(c, 0x020616, 0x1a2a5a, 1400, 0xf0f4ff); const st = M(0x5a5a70, { roughness: 0.8, map: c.wallTex('brick', '#5a5a70', '#484860') }); c.cyl(14, 13.4, 1, st, 0, -0.5, -2, null, 40).material.map.repeat.set(8, 8);
        const ring = new T.Mesh(new T.TorusGeometry(13.2, 0.08, 6, 64), M(0xc8a04a, { metalness: 0.9, roughness: 0.3 })); ring.rotation.x = PI / 2; ring.position.set(0, 1.2, -2); scene.add(ring); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; c.cyl(0.05, 0.05, 1.2, M(0xc8a04a, { metalness: 0.9 }), Math.cos(a) * 13.2, 0.6, Math.sin(a) * 13.2 - 2, null, 5); }
        const milky = c.sprite(0x8a9aff, 60, 0, 22, -60, null, 0.14); milky.scale.set(90, 14, 1); milky.material.rotation = 0.4; const planet = c.sph(3, M(0xd8a86a, { roughness: 0.8 }), 26, 18, -55, null, 24); const pr = new T.Mesh(new T.TorusGeometry(5, 0.5, 2, 48), M(0xe8d0a0, { roughness: 0.7 })); pr.rotation.set(1.2, 0.3, 0); pr.position.copy(planet.position); pr.scale.z = 0.1; scene.add(pr); c.sph(1.6, M(0xb8d8ff, { roughness: 0.6 }), -30, 22, -58, null, 18);
        const shoot = c.sprite(0xffffff, 1.2, 0, 0, -50, null, 0); shoot.scale.set(6, 0.3, 1); c.updaters.push((dt, tm) => { const t = (tm * 0.12) % 1; shoot.position.set(-40 + t * 80, 26 - t * 10, -50); shoot.material.opacity = t < 0.3 ? Math.sin(t / 0.3 * PI) * 0.8 : 0; }); } }
  };

  /* ================================================================== the games (stages) */
  const STAGES = {
    /* ---- Kite Hill: four kites ride the wind, each tethered to a stake; the right kite loops the loop, a wrong one's string snaps ---- */
    kites(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 3.8, 15], look: [0, 4.0, -4], fov: 60 } : a < 1.5 ? { pos: [0, 3.4, 12.5], look: [0, 4.3, -4], fov: 50 } : { pos: [0, 3.2, 11.6], look: [0, 4.4, -4], fov: 46 },
      hostAt: () => new T.Vector3(-6.6, 0, 1.6),
      build() { MS.lines = []; },
      present(choices) { for (const o of MS.lines.concat(MS.stakes || [])) scene.remove(o); MS.lines = []; MS.stakes = []; const n = choices.length, L = lay(c, 3.3), cols = [[0xff5a5a, 0xffd23a], [0x5ac8ff, 0xffffff], [0x7ad86a, 0xffd23a], [0xb48cff, 0xff9ae0]];
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2; const g = new T.Group(); g.position.set(off * L.sp, 4.3 + (s % 2) * 0.5, -4 - (s % 2) * 0.8); g.scale.setScalar(L.k); const kite = kiteMesh(c, cols[j % 4][0], cols[j % 4][1]); g.add(kite);
          const tab = c.label(choices[j], j, 0.82); tab.position.set(0, 2.25, 0.1); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.3, 4.4, 1.2, j, 0.6); g.add(h);
          const stake = new T.Vector3(off * L.sp * 0.55, 0.3, 4.2); MS.stakes.push(c.box(0.12, 0.6, 0.12, c.M(0x7a5a3a), stake.x, 0.3, stake.z));
          const lg = new T.BufferGeometry().setFromPoints([stake, stake.clone()]), line = new T.Line(lg, new T.LineBasicMaterial({ color: 0xf4f0e0, transparent: true, opacity: 0.8 })); scene.add(line);
          const ch = { j, g, tab, obj: kite, hits: [h], still: true, k0: Math.random() * 6, line, stake }; c.addChoice(ch); const tail = kite.userData.tail, tip = new T.Vector3();
          c.updaters.push((dt, tm) => { if (!ch.free) { kite.rotation.z = Math.sin(tm * 1.1 + ch.k0) * 0.12; kite.position.y = Math.sin(tm * 1.4 + ch.k0) * 0.18; kite.position.x = Math.sin(tm * 0.7 + ch.k0) * 0.15; }
            tail.forEach((b, i) => { b.position.set(Math.sin(tm * 3 + i * 0.8 + ch.k0) * 0.18 * (i + 1) * 0.5, -1.2 - i * 0.42, 0); b.rotation.z = Math.sin(tm * 4 + i) * 0.4; });
            line.visible = !!ch.g.parent; if (line.parent && !ch.cut && ch.g.parent) { kite.localToWorld(tip.set(0, -1.1, 0)); const p = lg.attributes.position; p.setXYZ(0, stake.x, stake.y, stake.z); p.setXYZ(1, tip.x, tip.y, tip.z); p.needsUpdate = true; } }); MS.lines.push(line); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const kite = ch.obj;
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; ch.free = true; ch.line.material.color.setHex(0xffd23a); const y0 = kite.position.y;
          c.tween(1.9, k => { const e = c.ease(k); kite.position.y = y0 + e * 5.5; kite.rotation.z = -k * TAU; if (Math.random() < 0.5) { const w = new T.Vector3(); kite.getWorldPosition(w); const s = c.sprite([0xffd23a, 0xff9ae0, 0x9ad8ff][Math.floor(Math.random() * 3)], c.R(0.3, 0.6), w.x, w.y, w.z, null, 0.9); c.tween(0.8, q => { s.material.opacity = 0.9 * (1 - q); s.position.y -= 0.02; }, () => scene.remove(s)); } }, () => { const w = new T.Vector3(); kite.getWorldPosition(w); c.burst(w, 0xffd23a, 16); c.burst(w, 0xffffff, 10); }); }
        else { ch.tab.userData.tablet.setState('wrong'); ch.free = true; ch.cut = true; scene.remove(ch.line); const w = new T.Vector3(); kite.getWorldPosition(w); c.burst(w.clone().add(new T.Vector3(0, -1, 0)), 0xffffff, 6); const x0 = kite.position.x, y0 = kite.position.y;
          c.tween(1.6, k => { kite.position.x = x0 + k * 3 * (ch.g.position.x < 0 ? -1 : 1); kite.position.y = y0 - k * k * 5; kite.rotation.z = k * 5; kite.rotation.x = Math.sin(k * 12) * 0.5; }, () => { kite.visible = false; }); c.glowUp(r); }
        return ok ? 3.0 : 2.4; } }; },

    /* ---- Wind Chime Temple: chimes hang from the lintel; the right one swings and its note ripples out in rings ---- */
    chimes(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 4.4, 14], look: [0, 4.6, -4], fov: 60 } : a < 1.5 ? { pos: [0, 4.2, 11.2], look: [0, 4.9, -4], fov: 50 } : { pos: [0, 4.0, 10.4], look: [0, 5.0, -4], fov: 46 },
      hostAt: () => new T.Vector3(-5.8, 0, 1.0),
      build() { const marble = c.M(0xf4efe6, { roughness: 0.4 }); for (const sd of [-1, 1]) { c.cyl(0.5, 0.56, 7.6, marble, sd * 7.4, 3.8, -4, null, 18); c.box(1.4, 0.4, 1.4, marble, sd * 7.4, 7.7, -4); } c.box(16.4, 0.6, 0.9, marble, 0, 8.1, -4); c.box(16.8, 0.2, 1.1, c.M(0xd8b04a, { metalness: 0.9, roughness: 0.3 }), 0, 8.45, -4); },
      present(choices) { const n = choices.length, L = lay(c, 3.3), cols = [0xd8dce4, 0xd8b04a, 0xc8a0e0, 0x9ad8e8];
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2; const g = new T.Group(); g.position.set(off * L.sp, 7.8, -4); g.scale.setScalar(L.k); c.cyl(0.015, 0.015, 0.6, c.M(0xd8d0c0), 0, 0.2, 0, g, 3); const ch0 = chimeMesh(c, cols[j % 4]); ch0.position.y = -0.2; ch0.scale.setScalar(1.4); g.add(ch0);
          const tab = c.label(choices[j], j, 0.84); tab.position.set(0, -4.55, 0.3); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.4, 5.6, 1.4, j, -2.6); g.add(h);
          const ch = { j, g, tab, obj: ch0, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); c.updaters.push((dt, tm) => { if (ch.ring) return; ch0.rotation.z = Math.sin(tm * 1.2 + ch.k0) * 0.04; ch0.userData.tubes.forEach((t, i) => { t.rotation.z = Math.sin(tm * 1.8 + i + ch.k0) * 0.05; }); }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const cm = ch.obj, at = new T.Vector3(); cm.getWorldPosition(at); at.y -= 1.2;
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; ch.ring = true; c.tween(2.2, k => { const d = 1 - k; cm.rotation.z = Math.sin(k * PI * 7) * 0.35 * d; cm.userData.tubes.forEach((t, i) => { t.rotation.z = Math.sin(k * PI * 9 + i * 1.3) * 0.4 * d; t.rotation.x = Math.cos(k * PI * 8 + i) * 0.25 * d; }); });
          for (let w = 0; w < 3; w++) { const ringM = new T.Mesh(new T.TorusGeometry(1, 0.04, 6, 48), new T.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.8, depthWrite: false })); ringM.position.copy(at); ringM.lookAt(c.camera.position); scene.add(ringM); c.tween(1.4, k => { ringM.scale.setScalar(0.3 + k * 4.5); ringM.material.opacity = 0.8 * (1 - k); }, () => scene.remove(ringM), w * 0.35); }
          for (let i = 0; i < 12; i++) { const s = c.sprite([0xfff0c0, 0xffc8f0, 0xc8f0ff][i % 3], c.R(0.25, 0.5), at.x + c.R(-0.6, 0.6), at.y, at.z + 0.3, null, 0.9); const ph = c.R(0, TAU); c.tween(1.6, k => { s.position.y = at.y + k * 3.5; s.position.x += Math.sin(k * 8 + ph) * 0.02; s.material.opacity = 0.9 * (1 - k); }, () => scene.remove(s), i * 0.07); } }
        else { ch.tab.userData.tablet.setState('wrong'); ch.ring = true; c.tween(0.5, k => { cm.rotation.z = Math.sin(k * PI * 10) * 0.12 * (1 - k); }); c.tween(0.8, k => { cm.userData.tubeM.color.lerp(new T.Color(0x6a6a70), 0.08); }); c.glowUp(r); }
        return ok ? 2.8 : 2.2; } }; },

    /* ---- The Sky Writer: the clouds carry the spellings; the plane dives through the right one and writes the word across the sky ---- */
    writer(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 4.6, 15], look: [0, 5.0, -4], fov: 60 } : a < 1.5 ? { pos: [0, 4.0, 12.4], look: [0, 5.2, -4], fov: 50 } : { pos: [0, 3.8, 11.6], look: [0, 5.3, -4], fov: 46 },
      hostAt: () => new T.Vector3(-6.4, 0, 1.6),
      build() { const p = planeMesh(c); p.scale.setScalar(0.9); p.rotation.order = 'YXZ'; scene.add(p); MS.plane = p; MS.circle = true; c.updaters.push((dt, tm) => { p.userData.prop.rotation.x += dt * 30; if (MS.circle) { const a = tm * 0.5; p.position.set(Math.cos(a) * 7, 8.3 + Math.sin(tm * 1.3) * 0.25, -10 + Math.sin(a) * 3); p.rotation.set(-0.3, -a - PI / 2, 0); } }); },   /* the nose (+x) follows the circle, banked inward */
      present(choices) { const n = choices.length, L = lay(c, 3.4);
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2; const g = new T.Group(); g.position.set(off * L.sp, 4.0 + (s % 2) * 0.4, -3.6); g.scale.setScalar(L.k); const cl = cloudMesh(c, 1.05); g.add(cl);
          const tab = c.label(choices[j], j, 0.8); tab.position.set(0, -0.05, 1.05); c.faceCam(tab); g.add(tab); const h = c.hitBox(3, 2.4, 1.8, j, 0); g.add(h);
          const ch = { j, g, tab, obj: cl, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); c.updaters.push((dt, tm) => { if (ch.gone) return; cl.position.y = Math.sin(tm * 0.9 + ch.k0) * 0.15; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const at = ch.g.position.clone(), p = MS.plane;
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; MS.circle = false; const word = ch.tab.userData.tablet.label || '';
          flyTo(c, p, at.clone().add(new T.Vector3(0, 0.2, 0.2)), 0.9, 1.5, () => { ch.gone = true; c.burst(at, 0xffffff, 16); c.tween(0.4, k => { ch.obj.scale.setScalar(Math.max(0.001, 1.05 * (1 + k * 0.6) * (1 - k))); });
            const tex = c.FX.text(word, { w: 1024, h: 256, color: '#ffffff', weight: 900, stroke: '#3a7ad8', strokeW: 0.16, shadow: 'rgba(20,60,150,0.7)' }), sky = new T.Mesh(new T.PlaneGeometry(12, 3), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false })); sky.position.set(0, 8.2, -9); scene.add(sky);
            p.position.set(c.RTL() ? 9 : -9, 8.4, -8.6); p.rotation.set(0, c.RTL() ? PI : 0, 0); c.tween(1.6, k => { p.position.x = (c.RTL() ? 9 - 18 * k : -9 + 18 * k); sky.material.opacity = Math.min(1, k * 1.3); sky.scale.x = Math.max(0.01, k); sky.position.x = (c.RTL() ? 6 : -6) * (1 - k); if (Math.random() < 0.6) { const s = c.sprite(0xffffff, c.R(0.6, 1.2), p.position.x, p.position.y, p.position.z, null, 0.7); c.tween(1.2, q => { s.material.opacity = 0.7 * (1 - q); s.scale.setScalar(1 + q * 2); }, () => scene.remove(s)); } }, () => {
              setTimeout(() => { if (!c.alive()) return; c.tween(0.6, k => { sky.material.opacity = 1 - k; }, () => { scene.remove(sky); tex.dispose && tex.dispose(); }); MS.circle = true; }, 900); }); }); }
        else { ch.tab.userData.tablet.setState('wrong'); ch.obj.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.setHex(0x8a90a0); o.material.emissiveIntensity = 0; } }); for (let i = 0; i < 16; i++) { const s = c.sprite(0x9ab8e0, 0.18, at.x + c.R(-1.2, 1.2), at.y - 0.6, at.z + c.R(-0.4, 0.6), null, 0.8); s.scale.set(0.06, 0.35, 1); c.tween(0.8, k => { s.position.y = at.y - 0.6 - k * 4; s.material.opacity = 0.8 * (1 - k); }, () => scene.remove(s), i * 0.05); } c.glowUp(r); }
        return ok ? 3.6 : 2.3; } }; },

    /* ---- Star Observatory: four stars hang over the terrace; the right one blazes, the telescope swings to it, and its constellation draws itself ---- */
    stars(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 3.4, 15], look: [0, 5.2, -5], fov: 60 } : a < 1.5 ? { pos: [0, 3.0, 12.4], look: [0, 5.4, -5], fov: 50 } : { pos: [0, 2.8, 11.6], look: [0, 5.5, -5], fov: 46 },
      hostAt: () => new T.Vector3(-6.2, 0, 1.2),
      build() { const brass = c.M(0xc8a04a, { metalness: 0.9, roughness: 0.3 }), dark = c.M(0x2a2a36, { metalness: 0.6, roughness: 0.4 }); const base = new T.Group(); base.position.set(6.6, 0, 0.4); scene.add(base); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; const leg = c.cyl(0.07, 0.09, 3.2, dark, Math.cos(a) * 0.7, 1.5, Math.sin(a) * 0.7, base, 6); leg.rotation.z = -Math.cos(a) * 0.22; leg.rotation.x = Math.sin(a) * 0.22; }
        const piv = new T.Group(); piv.position.y = 3.1; base.add(piv); const tube = c.cyl(0.26, 0.4, 3.6, brass, 0, 0, 0, piv, 18); tube.rotation.x = PI / 2; tube.position.z = -0.6; c.cyl(0.42, 0.42, 0.14, dark, 0, 0, -2.4, piv, 18).rotation.x = PI / 2; c.cyl(0.18, 0.18, 0.5, dark, 0, 0, 1.3, piv, 10).rotation.x = PI / 2; piv.rotation.order = 'YXZ'; piv.rotation.x = 0.55; piv.rotation.y = 0.5; MS.scope = piv; },
      present(choices) { const n = choices.length, L = lay(c, 3.3), sg = starGeo(T, 0.62);
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2; const g = new T.Group(); g.position.set(off * L.sp, 6.2 - Math.abs(off) * 0.5, -5.4); g.scale.setScalar(L.k); const st = new T.Mesh(sg, c.M(0xffe08a, { emissive: 0xffc840, emissiveIntensity: 1.3, metalness: 0.5, roughness: 0.3 })); g.add(st); const gl = c.sprite(0xffe6a0, 2.6, 0, 0, 0, g, 0.45); st.userData.glow = gl;
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, -1.55, 0.2); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.2, 3.4, 1.2, j, -0.6); g.add(h);
          const ch = { j, g, tab, obj: st, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); c.updaters.push((dt, tm) => { if (ch.done) return; st.rotation.y = Math.sin(tm * 0.8 + ch.k0) * 0.4; gl.material.opacity = 0.35 + 0.15 * Math.sin(tm * 3 + ch.k0); }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const at = ch.g.position.clone(), st = ch.obj; ch.done = true;
        const sc = MS.scope, wp = new T.Vector3(); sc.getWorldPosition(wp); const dir = at.clone().sub(wp); const ry = Math.atan2(-dir.x, -dir.z), rx = Math.atan2(dir.y, Math.hypot(dir.x, dir.z)); const r0 = sc.rotation.y, x0 = sc.rotation.x; c.tween(0.7, k => { const e = c.ease(k); sc.rotation.y = r0 + (ry - r0) * e; sc.rotation.x = x0 + (rx - x0) * e; });
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; c.tween(0.5, k => { st.scale.setScalar(1 + c.over(k) * 0.6); st.userData.glow.material.opacity = 0.45 + k * 0.5; st.userData.glow.scale.setScalar(2.6 + k * 3); }, null, 0.5);
          const shapes = [[[0, 0], [1.2, 0.6], [2.4, 0.4], [3.2, 1.3], [2.3, 2.0], [1.2, 1.6]], [[0, 0], [-1.1, 0.9], [-2.4, 1.1], [-2.8, 2.3], [-1.6, 2.6], [-0.6, 1.9], [0.8, 2.6]], [[0, 0], [1.0, 1.3], [0.2, 2.5], [1.6, 3.0], [2.8, 2.2], [2.2, 0.9]]], pts = shapes[chosen % 3];
          const out = at.x < 0 ? -1 : 1, base = at.clone().add(new T.Vector3(out * 0.7, 0.9, -0.3)), ps = pts.map(p => base.clone().add(new T.Vector3(p[0] * out * 0.9, p[1] * 0.8, 0))), dots = [];   /* drawn outward and up, into empty sky, never over a neighbour */
          ps.forEach((p, i) => { const d = c.sprite(0xffffff, 0.001, p.x, p.y, p.z, null, 0.95); dots.push(d); c.tween(0.3, k => d.scale.setScalar(Math.max(0.001, 0.7 * c.over(k))), null, 0.9 + i * 0.12); });
          const lg = new T.BufferGeometry().setFromPoints(ps), line = new T.Line(lg, new T.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.9 })); lg.setDrawRange(0, 0); scene.add(line); c.tween(0.9, k => { lg.setDrawRange(0, Math.max(0, Math.floor(k * ps.length) + 1)); }, null, 1.0);
          setTimeout(() => { if (!c.alive()) return; c.tween(0.6, k => { line.material.opacity = 0.9 * (1 - k); dots.forEach(d => { d.material.opacity = 0.95 * (1 - k); }); }, () => { scene.remove(line); dots.forEach(d => scene.remove(d)); }); }, 2600); }
        else { ch.tab.userData.tablet.setState('wrong'); c.tween(1.0, k => { st.material.emissiveIntensity = 1.3 * (1 - k) * (0.5 + 0.5 * Math.abs(Math.sin(k * 20))); st.userData.glow.material.opacity = 0.45 * (1 - k); st.material.color.lerp(new T.Color(0x6a6a7a), 0.05); }); c.glowUp(r); }
        return ok ? 3.4 : 2.4; } }; }
  };

  /* ================================================================== the map: four places on the Sky Isles */
  function landmarks(k) { const { T, plot, box, cyl, cone, stoneMat, woodMat } = k;
    const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {})), white = M(0xf4efe6, { roughness: 0.4 }), gold = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 });
    const kite = (g, x, y, z, cA, cB) => { const kg = new T.Group(); kg.position.set(x, y, z); g.add(kg); const P = [[0, 1.1], [0.7, 0.2], [0, -0.9], [-0.7, 0.2]]; for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4], sh = new T.Shape(); sh.moveTo(0, 0.2); sh.lineTo(a[0], a[1]); sh.lineTo(b[0], b[1]); sh.closePath(); kg.add(new T.Mesh(new T.ShapeGeometry(sh), M(i % 2 ? cA : cB, { side: T.DoubleSide }))); } return kg; };
    /* Kite Hill: a grassy knoll, a post, three kites straining on their strings */
    plot('rg_kites', -20, -12, g => { const hill = new T.Mesh(new T.SphereGeometry(4, 20, 10, 0, TAU, 0, PI / 2), M(0x6ab84a, { roughness: 1 })); hill.scale.y = 0.45; g.add(hill); cyl(0.12, 0.16, 2.6, woodMat, 0, 2.6, 0, g, 8); const ks = [];
      for (const [x, y, z, a, b] of [[-3, 9, -2, 0xff5a5a, 0xffd23a], [2.5, 10.5, -3, 0x5ac8ff, 0xffffff], [0.5, 8, 2.5, 0xb48cff, 0xff9ae0]]) { const kg = kite(g, x, y, z, a, b); ks.push(kg); const lg = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 3.8, 0), new T.Vector3(x, y - 0.9, z)]); g.add(new T.Line(lg, new T.LineBasicMaterial({ color: 0xffffff }))); }
      k.fx((dt, tm) => ks.forEach((kg, i) => { kg.rotation.z = Math.sin(tm * 1.2 + i * 2) * 0.2; kg.rotation.y = Math.sin(tm * 0.7 + i) * 0.3; })); }, { labelH: 12 });
    /* Wind Chime Temple: a round marble pavilion, a golden dome, chimes turning in the middle */
    plot('rg_chimes', 22, -10, g => { cyl(3.4, 3.6, 0.5, white, 0, 0.25, 0, g, 24); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; cyl(0.22, 0.26, 3.6, white, Math.cos(a) * 2.8, 2.3, Math.sin(a) * 2.8, g, 12); } cyl(3.3, 3.3, 0.4, white, 0, 4.3, 0, g, 24); const dome = new T.Mesh(new T.SphereGeometry(3.1, 24, 12, 0, TAU, 0, PI / 2), gold); dome.position.y = 4.5; g.add(dome); cone(0.25, 1, gold, 0, 8, 0, g, 8);
      const ch = new T.Group(); ch.position.y = 4.1; g.add(ch); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cyl(0.07, 0.07, 1 + i * 0.2, M(0xd8dce4, { metalness: 0.9, roughness: 0.25 }), Math.cos(a) * 0.5, -0.7 - i * 0.1, Math.sin(a) * 0.5, ch, 8); } k.fx((dt, tm) => { ch.rotation.y = tm * 0.5; ch.rotation.z = Math.sin(tm * 1.5) * 0.06; }); }, { labelH: 9.4 });
    /* The Sky Writer's airfield: a deck, a red biplane, a windsock */
    plot('rg_writer', -20, 29, g => { box(7, 0.3, 5, M(0xb08a5a), 0, 0.15, 0, g); const p = new T.Group(); p.position.set(0, 1.0, 0); p.rotation.y = 0.5; g.add(p); const red = M(0xe8443a), cream = M(0xf4ecd8); const bd = cyl(0.4, 0.26, 3.2, red, 0, 0, 0, p, 14); bd.rotation.z = PI / 2; for (const y of [0.42, -0.36]) box(0.9, 0.09, 4, cream, 0.4, y, 0, p); box(0.6, 0.7, 0.08, red, -1.55, 0.35, 0, p); box(0.6, 0.08, 1.4, cream, -1.5, 0.05, 0, p); const pr = new T.Group(); pr.position.x = 1.7; p.add(pr); box(0.08, 1.6, 0.14, M(0x2a2a30), 0, 0, 0, pr); k.fx((dt, tm) => { pr.rotation.x = tm * 12; });
      cyl(0.08, 0.08, 4.4, M(0xd8d8e0, { metalness: 0.6 }), 3, 2.2, -1.8, g, 6); const sock = new T.Mesh(new T.ConeGeometry(0.4, 1.8, 12, 1, true), M(0xff6a3a, { side: T.DoubleSide })); sock.rotation.z = PI / 2; sock.position.set(3.9, 4.2, -1.8); g.add(sock); k.fx((dt, tm) => { sock.rotation.y = Math.sin(tm * 0.8) * 0.4; }); }, { labelH: 6.4 });
    /* Star Observatory: a white tower with a silver dome, its telescope slowly sweeping the sky */
    plot('rg_stars', 28, 25, g => { cyl(2.8, 3, 3.6, white, 0, 1.8, 0, g, 24); const dome = new T.Group(); dome.position.y = 3.6; g.add(dome); const dm = new T.Mesh(new T.SphereGeometry(2.9, 24, 12, 0, TAU, 0, PI / 2), M(0xc8ccd8, { metalness: 0.7, roughness: 0.3 })); dome.add(dm); box(0.9, 2.6, 5.9, M(0x1a1c2a), 0, 1.3, 0, dome); const tube = cyl(0.3, 0.42, 3.6, gold, 0, 2.6, 1.6, dome, 14); tube.rotation.x = -0.9;
      for (let i = 0; i < 4; i++) { const w = box(0.5, 0.8, 0.1, M(0xffe6a0, { emissive: 0xffc860, emissiveIntensity: 1.6 }), 0, 2, 0, g); const a = i / 4 * TAU + 0.4; w.position.set(Math.sin(a) * 2.92, 2, Math.cos(a) * 2.92); w.rotation.y = a; } k.fx((dt, tm) => { dome.rotation.y = tm * 0.15; }); }, { labelH: 8.2 });
  }

  /* ================================================================== the isles themselves: a set piece on every free spot */
  function scenery(k) {
    const { T, scene, height, reserved, fx } = k, K = KQRealms.kit(k); const { R, M, VC, BOX, CYL, SPH, CONE, put, putWorld, beam, bx, halo } = K;
    const vc = VC({ roughness: 0.6 }), mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));   /* M builds matrices here; mat builds materials */
    /* ---- tethered hot-air balloons, bobbing on their ropes (west road) ---- */
    { const x0 = -36, z0 = 6; reserved.push([x0, z0, 7]); const prof = [[0.01, -1.9], [0.5, -1.7], [1.3, -0.8], [1.75, 0.4], [1.7, 1.3], [1.2, 2.1], [0.01, 2.4]].map(p => new T.Vector2(p[0], p[1]));
      const cols = [[0xff5a5a, 0xffd23a], [0x5ac8ff, 0xffffff], [0x7ad86a, 0xff9ae0]], balloons = [];
      [[-2.5, 0, 9], [2.4, -1.5, 11], [0.2, 2.6, 7.6]].forEach(([dx, dz, h], i) => { const b = new T.Group(); const bx0 = x0 + dx, bz0 = z0 + dz, gy = height(bx0, bz0); b.position.set(bx0, gy + h, bz0); scene.add(b);
        const P = []; for (let s = 0; s < 12; s++) P.push({ g: new T.LatheGeometry(prof, 3, s / 12 * TAU, TAU / 12), c: cols[i][s % 2] }); const env = new T.Mesh(K.merge(P), vc); env.castShadow = true; b.add(env);
        const bk = new T.Mesh(new T.CylinderGeometry(0.5, 0.42, 0.6, 10), mat(0x9a6a3a)); bk.position.y = -2.6; b.add(bk); for (let q = 0; q < 4; q++) { const a = q / 4 * TAU; const rp = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.9, 3), mat(0x5a4a3a)); rp.position.set(Math.cos(a) * 0.42, -2.1, Math.sin(a) * 0.42); b.add(rp); }
        const rope = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1, 3), mat(0xe8e0c8)); scene.add(rope); const stake = new T.Vector3(bx0, gy, bz0); b.userData = { h, gy, k: i * 1.7, rope, stake }; balloons.push(b); });
      fx((dt, tm) => balloons.forEach(b => { const u = b.userData; b.position.y = u.gy + u.h + Math.sin(tm * 0.8 + u.k) * 0.35; b.rotation.z = Math.sin(tm * 0.6 + u.k) * 0.05; const top = b.position.clone().add(new T.Vector3(0, -2.9, 0)); u.rope.position.copy(u.stake).add(top).multiplyScalar(0.5); u.rope.scale.y = top.distanceTo(u.stake); u.rope.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), top.clone().sub(u.stake).normalize()); })); }
    /* ---- a little isle floating over a pool, its waterfall pouring down into mist (south) ---- */
    { const x0 = -3, z0 = 38; reserved.push([x0, z0, 7]); const gy = height(x0, z0);
      const pool = new T.Mesh(new T.CircleGeometry(4.2, 32), new T.MeshStandardMaterial({ color: 0x4ab8e8, roughness: 0.1, metalness: 0.2, emissive: 0x1a5a8a, emissiveIntensity: 0.4 })); pool.rotation.x = -PI / 2; pool.position.set(x0, gy + 0.05, z0); scene.add(pool); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; const r = new T.Mesh(new T.DodecahedronGeometry(R(0.5, 0.9), 0), mat(0x9a8a7a, { flatShading: true })); r.position.set(x0 + Math.cos(a) * 4.4, gy + 0.2, z0 + Math.sin(a) * 4.4); scene.add(r); }
      const isle = new T.Group(); isle.position.set(x0 - 1.2, gy + 8.5, z0 - 1.5); scene.add(isle); const top = new T.Mesh(new T.CylinderGeometry(3.2, 3, 0.7, 20), mat(0x6ab84a, { roughness: 1 })); isle.add(top); const rk = new T.Mesh(new T.ConeGeometry(3, 5, 10), mat(0x8a7a6a, { flatShading: true })); rk.rotation.x = PI; rk.position.y = -2.8; isle.add(rk);
      for (const [tx, tz, s] of [[-1, -0.8, 0.9], [1.2, -1, 0.7]]) { const t = new T.Group(); t.position.set(tx, 0.3, tz); isle.add(t); const tr = new T.Mesh(new T.CylinderGeometry(0.12 * s, 0.18 * s, 1.4 * s, 6), mat(0x7a5a3a)); tr.position.y = 0.7 * s; t.add(tr); const cr = new T.Mesh(new T.SphereGeometry(0.8 * s, 10, 8), mat(0x4aa84a)); cr.position.y = 1.8 * s; t.add(cr); }
      const wtex = (() => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const x = cv.getContext('2d'); x.fillStyle = 'rgba(200,236,255,0.55)'; x.fillRect(0, 0, 64, 256); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`; x.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 3, 20 + Math.random() * 50); } const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; return t; })();
      const fallH = 8.5 - 0.3, fall = new T.Mesh(new T.PlaneGeometry(1.6, fallH), new T.MeshBasicMaterial({ map: wtex, transparent: true, depthWrite: false, side: T.DoubleSide })); fall.position.set(x0 - 1.2 + 2.2, gy + fallH / 2 + 0.1, z0 - 1.5 + 2.2); fall.rotation.y = -PI / 4; scene.add(fall);
      const mist = []; for (let i = 0; i < 5; i++) mist.push(halo(null, 0xffffff, R(2, 3), x0 + 1 + R(-0.6, 0.6), gy + 0.6, z0 + 0.7 + R(-0.6, 0.6), 0.35)); fx((dt, tm) => { wtex.offset.y = -tm * 0.8; isle.position.y = gy + 8.5 + Math.sin(tm * 0.5) * 0.2; mist.forEach((m, i) => { m.material.opacity = 0.25 + 0.12 * Math.sin(tm * 2 + i); }); }); }
    /* ---- an airship moored to its mast (east road) ---- */
    { const x0 = 36, z0 = 9, P = []; reserved.push([x0, z0, 8]); const H0 = 9;
      for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]]) beam(P, [dx * 1.6, 0, dz * 1.6], [dx * 0.4, H0, dz * 0.4], 0.09, 0x8a8a96); for (let y = 1; y < H0; y += 1.5) { const f = 1 - y / H0 * 0.75; for (let i = 0; i < 4; i++) { const a = [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]], p1 = a[i], p2 = a[(i + 1) % 4]; beam(P, [p1[0] * 1.6 * f, y, p1[1] * 1.6 * f], [p2[0] * 1.6 * (1 - (y + 1.5) / H0 * 0.75), y + 1.5, p2[1] * 1.6 * (1 - (y + 1.5) / H0 * 0.75)], 0.04, 0x9a9aa6); } }
      P.push({ g: CYL, m: M(0, H0 + 0.2, 0, 0, 0, 0, 1.2, 0.4, 1.2), c: 0x6a6a76 }); const mast = put(P, VC({ metalness: 0.5, roughness: 0.4 }), x0, z0, 0.3, 0.1, 2.2);
      const ship = new T.Group(); ship.position.set(x0 + 4.2, mast.position.y + H0 - 0.4, z0 + 0.6); scene.add(ship); const env = new T.Mesh(new T.SphereGeometry(1, 28, 16), mat(0xd8dce8, { roughness: 0.5 })); env.scale.set(4.4, 1.5, 1.5); ship.add(env); for (let i = 0; i < 5; i++) { const band = new T.Mesh(new T.TorusGeometry(1.5 * Math.sqrt(1 - Math.pow((i - 2) * 0.35, 2)), 0.03, 4, 32), mat(0xb84a3a)); band.rotation.y = PI / 2; band.position.x = (i - 2) * 1.55; ship.add(band); }
      for (const [fy, fz, rx] of [[0.9, 0, 0], [-0.9, 0, 0], [0, 0.9, PI / 2], [0, -0.9, PI / 2]]) { const fin = new T.Mesh(new T.BoxGeometry(1.4, 1.1, 0.08), mat(0xb84a3a)); fin.position.set(-4.0, fy, fz); fin.rotation.x = rx; ship.add(fin); }
      const gon = new T.Mesh(new T.BoxGeometry(2.2, 0.6, 0.8), mat(0x8a6a44)); gon.position.y = -1.9; ship.add(gon); for (let i = 0; i < 3; i++) { const w = new T.Mesh(new T.BoxGeometry(0.3, 0.25, 0.05), K.glowMat(0xffe6a0, 0xffc860, 1.4)); w.position.set(-0.6 + i * 0.6, -1.85, 0.42); ship.add(w); }
      const pr = new T.Group(); pr.position.set(-4.9, 0, 0); ship.add(pr); for (let i = 0; i < 3; i++) { const bl = new T.Mesh(new T.BoxGeometry(0.06, 1.1, 0.2), mat(0x3a3a40)); bl.rotation.x = i / 3 * PI; pr.add(bl); }
      fx((dt, tm) => { ship.rotation.y = Math.sin(tm * 0.3) * 0.12; ship.position.y = mast.position.y + H0 - 0.4 + Math.sin(tm * 0.7) * 0.15; pr.rotation.x = tm * 8; }); }
    /* ---- a rainbow over a little pond, a cloud at each foot (north-west) ---- */
    { const x0 = -32, z0 = -14; reserved.push([x0, z0, 7]); const gy = height(x0, z0); const rb = new T.Group(); rb.position.set(x0, gy - 0.4, z0); rb.rotation.y = 0.4; scene.add(rb); [0xff4a4a, 0xff9a3a, 0xffe03a, 0x5ad85a, 0x4a9aff, 0x9a6aff].forEach((col, i) => { const t = new T.Mesh(new T.TorusGeometry(6 - i * 0.36, 0.2, 8, 48, PI), K.glowMat(col, col, 0.55)); rb.add(t); });
      const pond = new T.Mesh(new T.CircleGeometry(2.6, 28), new T.MeshStandardMaterial({ color: 0x6ad0ff, roughness: 0.1, emissive: 0x2a7ab8, emissiveIntensity: 0.5 })); pond.rotation.x = -PI / 2; pond.position.set(x0, gy + 0.06, z0); scene.add(pond);
      for (const sd of [-1, 1]) { const cl = new T.Group(); for (const [x, y, r] of [[0, 0, 1.2], [0.9, -0.2, 0.9], [-0.9, -0.2, 0.9], [0.3, 0.6, 0.8]]) { const s = new T.Mesh(new T.SphereGeometry(r, 14, 10), mat(0xffffff, { roughness: 1, emissive: 0x8090a0, emissiveIntensity: 0.25 })); s.position.set(x, y, 0); cl.add(s); } cl.position.set(sd * 5.7, 0.7, 0); rb.add(cl); } }
    /* ---- the great pinwheel, turning in the wind at the end of the castle road ---- */
    { const x0 = 6, z0 = 20, P = []; reserved.push([x0, z0, 4]); beam(P, [0, -0.3, 0], [0, 8.5, 0], 0.18, 0xe8e0d0); P.push({ g: CYL, m: M(0, 0.2, 0, 0, 0, 0, 1.6, 0.4, 1.6), c: 0xb8b0a0 }); const pole = put(P, VC({ roughness: 0.6 }), x0, z0, 0, 0.1, 1);
      const wheel = new T.Group(); wheel.position.set(0, 8.5, 0.5); pole.add(wheel); [0xff5a5a, 0xffd23a, 0x5ac8ff, 0x7ad86a].forEach((col, i) => { const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(2.4, 0.2); sh.quadraticCurveTo(2.2, 1.6, 0.4, 2.2); sh.closePath(); const bl = new T.Mesh(new T.ShapeGeometry(sh), mat(col, { side: T.DoubleSide, roughness: 0.6 })); bl.rotation.z = i / 4 * TAU; wheel.add(bl); }); const hub = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), mat(0xffffff)); wheel.add(hub); fx((dt, tm) => { wheel.rotation.z = -tm * 1.4; }); }
    /* ---- a stack of rock with a great nest on top, three speckled eggs, birds wheeling round it (south-east) ---- */
    { const x0 = 17, z0 = 33, P = []; reserved.push([x0, z0, 5]); for (let i = 0; i < 6; i++) P.push({ g: new T.DodecahedronGeometry(1, 0), m: M(R(-0.4, 0.4), 0.8 + i * 1.2, R(-0.4, 0.4), R(0, 3), R(0, 3), 0, 2.2 - i * 0.18, 1.1, 2.2 - i * 0.18), c: [0x9a8a7a, 0x8a7a6a, 0xa89888][i % 3] });
      for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; P.push({ g: CYL, m: new T.Matrix4().compose(new T.Vector3(Math.cos(a) * 1.4, 7.8 + (i % 3) * 0.12, Math.sin(a) * 1.4), new T.Quaternion().setFromEuler(new T.Euler(PI / 2 + R(-0.3, 0.3), 0, a + R(-0.4, 0.4))), new T.Vector3(0.12, 1.3, 0.12)), c: [0x8a6a44, 0x7a5a3a, 0x9a7a54][i % 3] }); }
      for (let i = 0; i < 3; i++) P.push({ g: SPH, m: M(Math.cos(i * 2.1) * 0.5, 8.1, Math.sin(i * 2.1) * 0.5, 0, 0, 0, 0.6, 0.78, 0.6), c: [0xe8f0ff, 0xd8ecf8, 0xf0f4ff][i] });
      const stack = put(P, VC({ roughness: 0.9 }), x0, z0, 0, 0.3, 2); const birds = [];
      for (let i = 0; i < 4; i++) { const b = new T.Group(); const bm = mat(0xf4f4f8, { side: T.DoubleSide }); b.add(new T.Mesh(new T.SphereGeometry(0.16, 8, 6), bm)); const ws = []; for (const sd of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(0.8, 0.25), bm); w.position.x = sd * 0.42; b.add(w); ws.push(w); } scene.add(b); b.userData = { a: i / 4 * TAU, ws, r: 3 + i * 0.6, h: 9 + i * 0.5 }; birds.push(b); }
      fx((dt, tm) => birds.forEach((b, i) => { const u = b.userData; u.a += dt * (0.5 + i * 0.06); b.position.set(x0 + Math.cos(u.a) * u.r, stack.position.y + u.h + Math.sin(tm * 2 + i) * 0.3, z0 + Math.sin(u.a) * u.r); b.rotation.y = -u.a; const f = Math.sin(tm * 9 + i) * 0.6; u.ws[0].rotation.z = f; u.ws[1].rotation.z = -f; })); }
    K.finish();
  }

  /* ================================================================== the words */
  const S = {
    en: {
      rg_kites: 'Kite Hill', rg_kites_b: 'Four kites on the wind. Which one is right?', rg_kites_hi: 'The wind is up! Four kites, and every one has a number.', rg_kites_how: 'Work out the sum, then pick the kite with the answer. It will loop the loop.', rg_kites_q: 'Which kite flies?',
      rg_chimes: 'Wind Chime Temple', rg_chimes_b: 'Ring the chime with the same meaning.', rg_chimes_hi: 'Listen to the wind in the chimes. Each one sings a word.', rg_chimes_how: 'Pick the chime whose word means the same as the one in the sign. It will ring out.', rg_chimes_q: 'Which chime rings true?',
      rg_writer: 'The Sky Writer', rg_writer_b: 'Help the plane write the word in the sky.', rg_writer_hi: 'The wind has scrambled my letters! Can you help me write the word?', rg_writer_how: 'Look at the picture and the mixed-up letters, then pick the cloud that spells the word right.', rg_writer_q: 'Which cloud has the word?',
      rg_stars: 'Star Observatory', rg_stars_b: 'Light the star with the answer.', rg_stars_hi: 'Welcome to the observatory. Tonight the stars are full of puzzles.', rg_stars_how: 'Solve the puzzle, then pick the star with the answer. Its constellation will appear.', rg_stars_q: 'Which star shines?'
    },
    he: {
      rg_kites: 'גבעת העפיפונים', rg_kites_b: 'ארבעה עפיפונים ברוח. איזה מהם נכון?', rg_kites_hi: 'יש רוח! ארבעה עפיפונים, ולכל אחד מספר.', rg_kites_how: 'פותרים את התרגיל, ובוחרים את העפיפון עם התשובה. הוא יעשה לולאה באוויר.', rg_kites_q: 'איזה עפיפון ממריא?',
      rg_chimes: 'מקדש פעמוני הרוח', rg_chimes_b: 'מצלצלים בפעמון עם אותה משמעות.', rg_chimes_hi: 'הקשיבו לרוח בפעמונים. כל פעמון שר מילה.', rg_chimes_how: 'בוחרים את הפעמון שהמילה שלו אומרת אותו דבר כמו המילה בשלט. הוא יצלצל.', rg_chimes_q: 'איזה פעמון מצלצל?',
      rg_writer: 'כותב השמיים', rg_writer_b: 'עוזרים למטוס לכתוב את המילה בשמיים.', rg_writer_hi: 'הרוח ערבבה לי את האותיות! תעזרו לי לכתוב את המילה?', rg_writer_how: 'מסתכלים בתמונה ובאותיות המעורבבות, ובוחרים את הענן שבו המילה כתובה נכון.', rg_writer_q: 'באיזה ענן המילה?',
      rg_stars: 'מצפה הכוכבים', rg_stars_b: 'מדליקים את הכוכב עם התשובה.', rg_stars_hi: 'ברוכים הבאים למצפה. הלילה הכוכבים מלאים בחידות.', rg_stars_how: 'פותרים את החידה, ובוחרים את הכוכב עם התשובה. קבוצת הכוכבים שלו תופיע.', rg_stars_q: 'איזה כוכב זורח?'
    }
  };

  KQRealms.define('sky', {
    games: [
      { id: 'rg_kites', kind: 'math', stage: 'kites', theme: 'sky_hill', host: 'balloon', icon: 'kite' },
      { id: 'rg_chimes', kind: 'reading', stage: 'chimes', theme: 'sky_temple', host: 'fairy', icon: 'bell' },
      { id: 'rg_writer', kind: 'spelling', stage: 'writer', theme: 'sky_field', host: 'nest', icon: 'plane' },
      { id: 'rg_stars', kind: 'logic', stage: 'stars', theme: 'sky_dome', host: 'crystal', icon: 'telescope' }
    ],
    strings: S, themes: THEMES, stages: STAGES, landmarks, scenery,
    gens: { rg_kites: kiteQ, rg_chimes: chimeQ, rg_writer: writerQ, rg_stars: starQ }
  });
})();
