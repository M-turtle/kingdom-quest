/* Kingdom Quest — THE SKULL CATACOMBS: four games of its own (registered with KQRealms, played in rooms3d.js halls).
     The Coffin Vault   (math)     every coffin lid carries a number: open the right one and a friendly skeleton sits up and waves
     Riddle Graveyard   (reading)  riddles on the tombstones: the right stone glows and a ghost rises to say thank you
     Bone Letters       (writing)  a word carved in the crypt wall has a letter missing: send the right bone to fill the gap
     The Locked Crypt   (logic)    four skeleton keys, one lock: the key with the answer turns and the great door swings open
   Every hall and prop is built here from primitives (no downloaded art); every question comes in English and Hebrew, six age bands. */
(function () {
  'use strict';
  if (!window.KQRealms) return;
  const PI = Math.PI, TAU = PI * 2;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;

  /* ================================================================== the questions */
  const NOUNS = {
    en: { bats: 'bats', bones: 'bones', candles: 'candles', ghosts: 'ghosts', spiders: 'spiders', skulls: 'skulls', pumpkins: 'pumpkins', candies: 'candies' },
    he: { bats: 'עטלפים', bones: 'עצמות', candles: 'נרות', ghosts: 'רוחות רפאים', spiders: 'עכבישים', skulls: 'גולגולות', pumpkins: 'דלעות', candies: 'סוכריות' }
  };
  const hhmm = m => { m = ((m % 720) + 720) % 720; const h = Math.floor(m / 60) || 12; return h + ':' + String(m % 60).padStart(2, '0'); };
  /* the coffin locks: counting, sums, tables, the ghost's clock, floors below ground, fractions, a little algebra */
  function coffinQ(band, lang, H) {
    const { ri, pick, near, shuffle, uniq } = H, he = lang === 'he', N = NOUNS[he ? 'he' : 'en'], k = Math.random();
    const mk = (q, a, step) => ({ q, a, ch: near(a, 4, step || 1) });
    if (band <= 1) { const a = ri(2, 6), b = ri(2, 9 - a);   /* at least two, so 'more fly in' / 'עפים' always agree */
      if (k < 0.35) return mk(he ? `${a} ${N.bats} תלויים בקריפטה. עוד ${b} עפים פנימה. כמה ${N.bats} יש עכשיו?` : `${a} ${N.bats} hang in the crypt. ${b} more fly in. How many ${N.bats} now?`, a + b);
      if (k < 0.6) { const m = a + b; return mk(he ? `דולקים ${m} ${N.candles}. הרוח מכבה ${b}. כמה נרות עדיין דולקים?` : `${m} ${N.candles} are lit. The wind blows out ${b}. How many are still lit?`, m - b); }
      return k < 0.8 ? mk(`${a} + ${b} = ?`, a + b) : mk(`${a + b} − ${b} = ?`, a); }
    if (band === 2) { const a = ri(11, 40), b = ri(4, 29);
      if (k < 0.3) return mk(he ? `בארגז אחד יש ${a} ${N.bones} ובארגז שני ${b}. כמה ${N.bones} יש בסך הכול?` : `One box holds ${a} ${N.bones} and another holds ${b}. How many ${N.bones} in all?`, a + b);
      if (k < 0.55) return mk(he ? `על המדף עומדות ${a + b} ${N.skulls}. ${b} מתגלגלות למטה. כמה נשארו על המדף?` : `${a + b} ${N.skulls} sit on the shelf. ${b} roll off. How many are left?`, a);
      return k < 0.78 ? mk(`${a} + ${b} = ?`, a + b) : mk(`? + ${b} = ${a + b}`, a); }
    if (band === 3) { const x = ri(2, 9), y = ri(2, 9);
      if (k < 0.3) return mk(he ? `לעכביש יש 8 רגליים. כמה רגליים יש ל-${x} ${N.spiders}?` : `A spider has 8 legs. How many legs do ${x} ${N.spiders} have?`, 8 * x, 4);
      if (k < 0.55) return mk(he ? `${x * y} ${N.candies} מתחלקות שווה בשווה בין ${x} ${N.ghosts}. כמה סוכריות מקבלת כל רוח?` : `${x * y} ${N.candies} are shared equally by ${x} ${N.ghosts}. How many does each ghost get?`, y);
      return k < 0.78 ? mk(`${x} × ${y} = ?`, x * y, 2) : mk(`${x * y} ÷ ${y} = ?`, x); }
    if (band === 4) {
      if (k < 0.4) { const t0 = ri(7, 11) * 60 + pick([0, 10, 15, 20, 30, 40, 45]), d = pick([15, 20, 25, 30, 35, 40, 45, 50]), a = hhmm(t0 + d);
        return { q: he ? `רוח הרפאים מתעוררת ב-${hhmm(t0)} ומשחקת ${d} דקות. באיזו שעה היא הולכת לישון?` : `The ghost wakes at ${hhmm(t0)} and plays for ${d} minutes. What time does it go back to sleep?`, a, ch: shuffle(uniq([a, hhmm(t0 + d + 10), hhmm(t0 + d - 10), hhmm(t0 + d + 60)])) }; }
      const x = ri(12, 29), y = ri(3, 8), cc = ri(5, 30); if (k < 0.7) return mk(`${x} × ${y} = ?`, x * y, 3);
      return mk(`${x} × ${y} − ${cc} = ?`, x * y - cc, 2); }
    if (band === 5) {
      if (k < 0.35) { const a = ri(3, 9), b = ri(2, 12); return mk(he ? `המעלית של הקריפטה נמצאת בקומה ${-a}. היא עולה ${b} קומות. באיזו קומה היא עכשיו?` : `The crypt lift is on floor ${-a}. It goes up ${b} floors. Which floor is it on now?`, b - a); }
      if (k < 0.7) { const d = pick([3, 4, 5, 6, 8]), m = pick([1, 2, 3, 5].filter(v => v < d && gcd(v, d) === 1)), t = d * ri(3, 9); return mk(he ? `${m}/${d} מתוך ${t} הנרות דולקים. כמה נרות דולקים?` : `${m}/${d} of the ${t} candles are lit. How many are lit?`, t / d * m, 2); }
      const p = pick([10, 20, 25, 50]), n = pick([20, 40, 60, 80, 100, 120]); return mk(he ? `${p}% מתוך ${n} ${N.pumpkins} זוהרות. כמה ${N.pumpkins} זוהרות?` : `${p}% of ${n} ${N.pumpkins} glow. How many glow?`, n * p / 100, 5); }
    const a = ri(2, 9), x = ri(2, 12), b = ri(1, 20);
    if (k < 0.4) return mk(`${a}x − ${b} = ${a * x - b}. x = ?`, x);
    if (k < 0.7) { const p = ri(2, 9), q = ri(2, 9), r = ri(2, 6); return mk(`(${p} + ${q}) × ${r} = ?`, (p + q) * r, 2); }
    const s = ri(3, 12); return mk(`${s}² + ${b} = ?`, s * s + b, 3);
  }

  /* riddles on the tombstones: what am I, what does it mean, three reading levels */
  const RIDDLES = {
    en: [
      [['I fly at night and sleep upside down. What am I?', 'bat', ['cat', 'fish', 'cow']], ['I have eight legs and I spin a web. What am I?', 'spider', ['snake', 'bird', 'frog']], ['I shine in the night sky and change my shape. What am I?', 'moon', ['sun', 'lamp', 'shoe']], ['I am a big orange vegetable. You can carve a face in me. What am I?', 'pumpkin', ['apple', 'ball', 'cake']], ['I open doors, but I am not a hand. What am I?', 'key', ['hat', 'cup', 'sock']], ['I am white and hard, and I am inside your body. What am I?', 'bone', ['stone', 'cloud', 'milk']], ['I say "hoo-hoo" at night. What am I?', 'owl', ['dog', 'duck', 'cow']], ['I give light, and I melt as I burn. What am I?', 'candle', ['chair', 'book', 'shoe']]],
      [['Which word means "scared"?', 'afraid', ['happy', 'hungry', 'sleepy']], ['Which word means "very old"?', 'ancient', ['tiny', 'shiny', 'quick']], ['Which word means "making no sound"?', 'silent', ['loud', 'bright', 'heavy']], ['A place where people are buried is a…', 'cemetery', ['bakery', 'library', 'harbor']], ['What is the opposite of "appear"?', 'disappear', ['arrive', 'shout', 'grow']], ['Which word means "a little scary"?', 'spooky', ['sunny', 'tasty', 'sporty']], ['What is the opposite of "brave"?', 'cowardly', ['bold', 'strong', 'daring']], ['A skeleton is made of…', 'bones', ['leaves', 'bricks', 'feathers']], ['Which word means "dark and gloomy"?', 'dreary', ['sunny', 'cheerful', 'bright']]],
      [['Which word means "a feeling that something bad will happen"?', 'dread', ['glee', 'relief', 'pride']], ['Which word means "to fade away slowly"?', 'dwindle', ['sprint', 'explode', 'bloom']], ['Which word means "you can see right through it"?', 'transparent', ['opaque', 'enormous', 'fragile']], ['A grand tomb built above the ground is a…', 'mausoleum', ['greenhouse', 'lighthouse', 'warehouse']], ['Which word means "strange and a little frightening"?', 'eerie', ['cozy', 'ordinary', 'cheerful']], ['Which word means "a story passed down for generations"?', 'legend', ['receipt', 'recipe', 'schedule']], ['Which word means "full of secrets, hard to explain"?', 'mysterious', ['obvious', 'simple', 'noisy']], ['What is the opposite of "ancient"?', 'modern', ['antique', 'old', 'aged']], ['Which word means "to shake with fear"?', 'tremble', ['giggle', 'stretch', 'whistle']]]
    ],
    he: [
      [['אני עף בלילה וישן הפוך. מי אני?', 'עטלף', ['חתול', 'דג', 'פרה']], ['יש לי שמונה רגליים ואני טווה קורים. מי אני?', 'עכביש', ['נחש', 'ציפור', 'צפרדע']], ['אני מאיר בשמי הלילה ומשנה את הצורה שלי. מי אני?', 'ירח', ['שמש', 'מנורה', 'נעל']], ['אני ירק גדול וכתום, ואפשר לגלף בי פרצוף. מי אני?', 'דלעת', ['תפוח', 'כדור', 'עוגה']], ['אני פותח דלתות, אבל אני לא יד. מי אני?', 'מפתח', ['כובע', 'כוס', 'גרב']], ['אני לבנה וקשה, ואני נמצאת בתוך הגוף. מי אני?', 'עצם', ['אבן', 'ענן', 'חלב']], ['אני קורא "הו-הו" בלילה. מי אני?', 'ינשוף', ['כלב', 'ברווז', 'פרה']], ['אני נותן אור, ונמס כשאני דולק. מי אני?', 'נר', ['כיסא', 'ספר', 'נעל']]],
      [['איזו מילה פירושה "מפוחד"?', 'חושש', ['שמח', 'רעב', 'ישנוני']], ['איזו מילה פירושה "ישן מאוד, מלפני הרבה שנים"?', 'עתיק', ['זעיר', 'נוצץ', 'מהיר']], ['איזו מילה פירושה "בלי שום קול"?', 'דומם', ['רועש', 'בהיר', 'כבד']], ['מקום שבו קוברים אנשים נקרא…', 'בית קברות', ['מאפייה', 'ספרייה', 'נמל']], ['מה ההפך של "להופיע"?', 'להיעלם', ['להגיע', 'לצעוק', 'לגדול']], ['איזו מילה פירושה "קצת מפחיד"?', 'מצמרר', ['שמשי', 'טעים', 'ספורטיבי']], ['מה ההפך של "אמיץ"?', 'פחדן', ['נועז', 'חזק', 'גיבור']], ['שלד בנוי מ…', 'עצמות', ['עלים', 'לבנים', 'נוצות']], ['איזו מילה פירושה "חשוך ועצוב"?', 'קודר', ['שמשי', 'עליז', 'בהיר']]],
      [['איזו מילה פירושה "תחושה שמשהו רע עומד לקרות"?', 'חרדה', ['שמחה', 'הקלה', 'גאווה']], ['איזו מילה פירושה "להיחלש לאט לאט עד שנעלם"?', 'לדעוך', ['לרוץ', 'להתפוצץ', 'לפרוח']], ['איזו מילה פירושה "שאפשר לראות דרכו"?', 'שקוף', ['אטום', 'ענק', 'שביר']], ['מבנה קבורה מפואר שבנוי מעל האדמה נקרא…', 'מאוזוליאום', ['חממה', 'מגדלור', 'מחסן']], ['איזו מילה פירושה "מלא סודות וקשה להסביר"?', 'מסתורי', ['פשוט', 'ברור', 'רועש']], ['איזו מילה פירושה "סיפור עתיק שעובר מדור לדור"?', 'אגדה', ['קבלה', 'מתכון', 'לוח זמנים']], ['מה ההפך של "עתיק"?', 'מודרני', ['ישן', 'קדום', 'עתיק יומין']], ['איזו מילה פירושה "לרעוד מפחד"?', 'לרטוט', ['לצחקק', 'להתמתח', 'לשרוק']], ['איזו מילה פירושה "שאין לו סוף"?', 'אינסופי', ['קצר', 'זמני', 'רגעי']]]
    ]
  };
  function tombQ(band, lang, H) { const L = RIDDLES[lang === 'he' ? 'he' : 'en'], tier = band <= 2 ? 0 : band <= 4 ? 1 : 2, it = H.pick(L[tier]); return { q: it[0], a: it[1], ch: H.shuffle([it[1]].concat(it[2])) }; }

  /* bone letters: a picture word with one letter missing; the wrong bones are the letters children really mix up */
  const BWORDS = {
    en: [[['bat', 'bat'], ['cat', 'cat'], ['owl', 'owl'], ['web', 'web'], ['key', 'key'], ['moon', 'moon'], ['bone', 'bone'], ['bell', 'bell'], ['ring', 'ring'], ['gem', 'gem'], ['fire', 'fire'], ['wolf', 'wolf'], ['lock', 'lock'], ['fog', 'fog']],
         [['ghost', 'ghost'], ['skull', 'skull'], ['candle', 'candle'], ['spider', 'spider'], ['pumpkin', 'pumpkin'], ['lantern', 'lantern'], ['coffin', 'coffin'], ['castle', 'castle'], ['dragon', 'dragon'], ['wizard', 'wizard'], ['potion', 'potion'], ['shield', 'shield']],
         [['tombstone', 'tombstone'], ['cauldron', 'cauldron'], ['telescope', 'telescope'], ['hourglass', 'hourglass'], ['mushroom', 'mushroom'], ['skeleton', 'skull'], ['lightning', 'lightning'], ['treasure', 'chest'], ['amulet', 'amulet'], ['mysterious', 'question']]],
    he: [[['ירח', 'moon'], ['עצם', 'bone'], ['מפתח', 'key'], ['זאב', 'wolf'], ['חתול', 'cat'], ['ינשוף', 'owl'], ['עטלף', 'bat'], ['כתר', 'crown'], ['דלת', 'door'], ['סלע', 'rock'], ['שעון', 'clock'], ['כוכב', 'star'], ['פעמון', 'bell'], ['טבעת', 'ring']],
         [['גולגולת', 'skull'], ['עכביש', 'spider'], ['דלעת', 'pumpkin'], ['קוסם', 'wizard'], ['שיקוי', 'potion'], ['דרקון', 'dragon'], ['טירה', 'castle'], ['פטרייה', 'mushroom'], ['פנס', 'lantern'], ['מגן', 'shield'], ['קדרה', 'cauldron'], ['ערפל', 'fog']],
         [['מצבה', 'tombstone'], ['שעון חול', 'hourglass'], ['טלסקופ', 'telescope'], ['קמע', 'amulet'], ['שרביט', 'wand'], ['יהלום', 'gem'], ['ברק', 'lightning'], ['אוצר', 'chest'], ['שלד', 'skull'], ['מסתורין', 'question']]]
  };
  const EN_CONF = { a: ['e', 'o', 'u'], e: ['a', 'i', 'o'], i: ['e', 'y', 'a'], o: ['u', 'a', 'e'], u: ['o', 'a', 'e'], y: ['i', 'e'], c: ['k', 's'], k: ['c', 'q'], s: ['c', 'z'], g: ['j', 'q'], j: ['g'], b: ['d', 'p'], d: ['b', 't'], p: ['b', 'q'], t: ['d', 'f'], m: ['n', 'w'], n: ['m', 'h'], l: ['r', 'i'], r: ['l', 'w'], w: ['v', 'u'], v: ['w', 'f'], f: ['v', 't'], h: ['n', 'k'], z: ['s'], q: ['k'], x: ['k', 's'] };
  const HE_CONF = { 'א': ['ע', 'ה'], 'ע': ['א', 'ה'], 'ה': ['א', 'ח'], 'ט': ['ת'], 'ת': ['ט'], 'כ': ['ח', 'ק'], 'ח': ['כ', 'ה'], 'ק': ['כ', 'ג'], 'ס': ['ש', 'צ'], 'ש': ['ס'], 'ב': ['ו', 'פ'], 'ו': ['ב', 'י'], 'י': ['ו', 'א'], 'פ': ['ב'], 'צ': ['ס', 'ז'], 'ג': ['ק'], 'ד': ['ר'], 'ר': ['ד'], 'ז': ['ס', 'צ'], 'ל': ['ר', 'נ'], 'מ': ['נ'], 'נ': ['מ', 'ל'] };
  const FINALS = 'ךםןףץ', STRONG_HE = 'אעהטתכחקסשבוי', VOW = 'aeiouy';
  function boneQ(band, lang, H) {
    const he = lang === 'he', L = BWORDS[he ? 'he' : 'en'], tier = band <= 2 ? 0 : band <= 4 ? 1 : 2, it = H.pick(L[tier]), w = it[0], cs = [...w];
    let cand = cs.map((c, i) => i).filter(i => cs[i] !== ' ' && !FINALS.includes(cs[i]) && (he || i > 0));
    const pref = cand.filter(i => he ? STRONG_HE.includes(cs[i]) : VOW.includes(cs[i]));
    const gap = H.pick(pref.length ? pref : cand), a = cs[gap];
    const conf = (he ? HE_CONF : EN_CONF)[a] || [], pool = he ? 'אהוחיכעקסשתטבלמנר'.split('') : 'aeioustnrlmdbp'.split('');
    const ch = [a]; for (const x of H.shuffle(conf).concat(H.shuffle(pool))) { if (ch.length >= 4) break; if (!ch.includes(x)) ch.push(x); }
    const shown = cs.map((c, i) => i === gap ? '_' : c).join('');
    return { q: (he ? 'איזו אות חסרה? ' : 'Which letter is missing? ') + shown, a, ch: H.shuffle(ch), icon: it[1], x: { word: w, gap } };
  }

  /* the skeleton keys: odd one out, sequences, pairs that go together, number sense, who-is-where, growing patterns */
  const ODD = {
    en: [{ s: ['bat', 'owl', 'crow', 'moth'], o: ['cat', 'frog', 'snake', 'fish'] }, { s: ['moon', 'coin', 'wheel', 'ball'], o: ['key', 'book', 'broom', 'box'] }, { s: ['red', 'blue', 'green', 'purple'], o: ['spider', 'bone', 'candle', 'owl'] }, { s: ['skull', 'bone', 'tooth', 'rib'], o: ['leaf', 'sock', 'cup', 'hat'] }, { s: ['apple', 'pear', 'plum', 'grape'], o: ['bone', 'key', 'bat', 'lamp'] }],
    he: [{ s: ['עטלף', 'ינשוף', 'עורב', 'עש'], o: ['חתול', 'צפרדע', 'נחש', 'דג'] }, { s: ['ירח', 'מטבע', 'גלגל', 'כדור'], o: ['מפתח', 'ספר', 'מטאטא', 'ארגז'] }, { s: ['אדום', 'כחול', 'ירוק', 'סגול'], o: ['עכביש', 'עצם', 'נר', 'ינשוף'] }, { s: ['גולגולת', 'עצם', 'שן', 'צלע'], o: ['עלה', 'גרב', 'כוס', 'כובע'] }, { s: ['תפוח', 'אגס', 'שזיף', 'ענב'], o: ['עצם', 'מפתח', 'עטלף', 'מנורה'] }]
  };
  const PAIRS = {
    en: [['Key goes with lock as match goes with ___', 'candle', ['shoe', 'river', 'pillow']], ['Owl goes with night as rooster goes with ___', 'morning', ['moon', 'bone', 'cave']], ['Spider goes with web as bird goes with ___', 'nest', ['shell', 'cave', 'hive']], ['A ghost says "boo" as a cat says ___', 'meow', ['moo', 'quack', 'oink']], ['A skeleton is made of bones as a book is made of ___', 'pages', ['wheels', 'bricks', 'feathers']], ['Moon goes with night as sun goes with ___', 'day', ['star', 'bed', 'owl']], ['Cold goes with ice as hot goes with ___', 'fire', ['snow', 'rain', 'wind']], ['Bat goes with cave as fish goes with ___', 'sea', ['tree', 'nest', 'sky']]],
    he: [['מפתח הולך עם מנעול, וגפרור הולך עם ___', 'נר', ['נעל', 'נהר', 'כרית']], ['ינשוף הולך עם לילה, ותרנגול הולך עם ___', 'בוקר', ['ירח', 'עצם', 'מערה']], ['עכביש הולך עם קורים, וציפור הולכת עם ___', 'קן', ['צדף', 'מערה', 'כוורת']], ['רוח רפאים אומרת "בו!", וחתול אומר ___', 'מיאו', ['מוו', 'גע-גע', 'אוינק']], ['שלד בנוי מעצמות, וספר בנוי מ___', 'דפים', ['גלגלים', 'לבנים', 'נוצות']], ['ירח הולך עם לילה, ושמש הולכת עם ___', 'יום', ['כוכב', 'מיטה', 'ינשוף']], ['קר הולך עם קרח, וחם הולך עם ___', 'אש', ['שלג', 'גשם', 'רוח']], ['עטלף גר במערה, ודג גר ב___', 'ים', ['עץ', 'קן', 'שמיים']]]
  };
  const WHO = { en: ['Troll', 'Bat', 'Skeleton', 'Owl', 'Cat', 'Wolf'], he: ['הטרול', 'העטלף', 'השלד', 'הינשוף', 'החתול', 'הזאב'] };
  const HE_AB = 'אבגדהוזחטיכלמנסעפצקרשת';
  function keyQ(band, lang, H) {
    const { ri, pick, shuffle, near } = H, he = lang === 'he', NEXT = he ? 'מה בא אחר כך?' : 'What comes next?';
    if (band <= 1) { const S = pick(ODD[he ? 'he' : 'en']), three = shuffle(S.s).slice(0, 3), odd = pick(S.o); return { q: he ? 'מה לא שייך?' : 'Which one does not belong?', a: odd, ch: shuffle(three.concat([odd])) }; }
    if (band === 2) { const st = pick([2, 5, 10]), down = Math.random() < 0.5, s = down ? ri(4, 9) * st + 4 * st : ri(0, 6) * st; const seq = [0, 1, 2, 3].map(i => down ? s - i * st : s + i * st), a = down ? s - 4 * st : s + 4 * st; return { q: `${NEXT} ${seq.join(', ')}, ?`, a, ch: near(a, 4, st) }; }
    if (band === 3) { const it = pick(PAIRS[he ? 'he' : 'en']); return { q: it[0], a: it[1], ch: shuffle([it[1]].concat(it[2])) }; }
    if (band === 4) { if (Math.random() < 0.5) { const odd = Math.random() < 0.5, pool = []; for (let n = 11; n < 60; n++) if ((n % 2 === 1) === odd) pool.push(n); const three = shuffle(pool).slice(0, 3); let x; do { x = ri(11, 59); } while ((x % 2 === 1) === odd); const all = shuffle(three.concat([x])); return { q: (he ? 'איזה מספר לא שייך? ' : 'Which number does not belong? ') + all.join(', '), a: x, ch: all }; }
      const s = ri(2, 5), r = pick([2, 3]), seq = [s, s * r, s * r * r, s * r * r * r], a = s * r * r * r * r; return { q: `${NEXT} ${seq.join(', ')}, ?`, a, ch: near(a, 4, r === 2 ? s * 2 : s * 3) }; }
    if (band === 5) { const [X, Y, Z] = shuffle(WHO[he ? 'he' : 'en']).slice(0, 3), ask = pick(['low', 'high', 'mid']);
      const q = he ? `${X} מבוגר מ${Y}. ${Y} מבוגר מ${Z}. ${ask === 'low' ? 'מי הכי צעיר?' : ask === 'high' ? 'מי הכי מבוגר?' : 'מי באמצע?'}` : `The ${X.toLowerCase()} is older than the ${Y.toLowerCase()}. The ${Y.toLowerCase()} is older than the ${Z.toLowerCase()}. ${ask === 'low' ? 'Who is the youngest?' : ask === 'high' ? 'Who is the oldest?' : 'Who is in the middle?'}`;   /* older, not taller: works for any creature */
      return { q, a: ask === 'low' ? Z : ask === 'high' ? X : Y, ch: shuffle([X, Y, Z]) }; }
    const k = Math.random();
    if (k < 0.5) { if (he) { const st = ri(0, 2), idx = [st, st + 2, st + 5, st + 9], n = st + 14; return { q: `${NEXT} ${idx.map(i => HE_AB[i]).join(', ')}, ?`, a: HE_AB[n], ch: shuffle([HE_AB[n], HE_AB[n - 1], HE_AB[n + 1], HE_AB[n + 2]]) }; }
      const st = ri(0, 5), L = i => String.fromCharCode(65 + i), n = st + 14; return { q: `${NEXT} ${[st, st + 2, st + 5, st + 9].map(L).join(', ')}, ?`, a: L(n), ch: shuffle([L(n), L(n - 1), L(n + 1), L(n + 2)]) }; }
    if (k < 0.75) { const s = ri(2, 5), seq = [s]; for (let i = 0; i < 4; i++) seq.push(seq[i] * 2 - 1); const a = seq[4] * 2 - 1; return { q: `${NEXT} ${seq.join(', ')}, ?`, a, ch: near(a, 4, 2) }; }
    const s = ri(1, 4), seq = [0, 1, 2, 3].map(i => (s + i) * (s + i)), a = (s + 4) * (s + 4); return { q: `${NEXT} ${seq.join(', ')}, ?`, a, ch: near(a, 4, 3) };
  }

  /* ================================================================== shared 3D pieces */
  /* a skull, one vertex-coloured geometry: cranium, jaw, dark sockets, nose, teeth */
  function skullGeo(T) { const G3 = KQRealms.G3, M = (x, y, z, rx, ry, rz, sx, sy, sz) => G3.M4(T, x, y, z, rx, ry, rz, sx, sy, sz), S = new T.SphereGeometry(0.5, 16, 12), B = new T.BoxGeometry(1, 1, 1);
    const P = [{ g: S, m: M(0, 0.1, 0, 0, 0, 0, 1, 0.95, 1.05), c: 0xece2c8 }, { g: B, m: M(0, -0.3, 0.14, 0, 0, 0, 0.6, 0.28, 0.52), c: 0xe2d6ba }, { g: S, m: M(-0.19, 0.06, 0.44, 0, 0, 0, 0.26, 0.28, 0.14), c: 0x1a1410 }, { g: S, m: M(0.19, 0.06, 0.44, 0, 0, 0, 0.26, 0.28, 0.14), c: 0x1a1410 }, { g: new T.ConeGeometry(0.07, 0.15, 3), m: M(0, -0.1, 0.5, PI, 0, 0), c: 0x2a2018 }];
    for (let i = 0; i < 5; i++) P.push({ g: B, m: M(-0.16 + i * 0.08, -0.2, 0.41, 0, 0, 0, 0.06, 0.08, 0.04), c: 0xfaf4e6 });
    return G3.merge(T, P); }
  const vcMat = (T, o) => new T.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 0.55 }, o || {}));
  /* the coffin: the classic six-sided outline, head away from you */
  function coffinGeo(T, lid) { const sh = new T.Shape(), P = [[-0.4, 1.55], [0.4, 1.55], [0.6, 0.95], [0.36, -1.55], [-0.36, -1.55], [-0.6, 0.95]]; sh.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) sh.lineTo(P[i][0], P[i][1]); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: lid ? 0.12 : 0.7, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }); g.rotateX(-PI / 2); return g; }
  function coffinFlat(T) { const sh = new T.Shape(), P = [[-0.34, 1.45], [0.34, 1.45], [0.52, 0.92], [0.3, -1.45], [-0.3, -1.45], [-0.52, 0.92]]; sh.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) sh.lineTo(P[i][0], P[i][1]); sh.closePath(); const g = new T.ShapeGeometry(sh); g.rotateX(-PI / 2); return g; }
  /* a friendly skeleton, from the hips up (it sits up in its coffin and waves) */
  function skeleton(c) { const { T, M } = c, g = new T.Group(), bone = M(0xf0e6d0, { roughness: 0.5 });
    const sk = new T.Mesh(skullGeo(T), vcMat(T)); sk.scale.setScalar(0.62); sk.position.y = 1.42; g.add(sk); g.userData.head = sk;
    c.cyl(0.05, 0.05, 1.0, bone, 0, 0.62, 0, g, 6); c.box(0.5, 0.14, 0.22, bone, 0, 0.12, 0, g);
    for (let i = 0; i < 4; i++) { const r = new T.Mesh(new T.TorusGeometry(0.27 - i * 0.03, 0.035, 5, 14, PI * 1.3), bone); r.rotation.set(PI / 2, 0, -0.15 * PI); r.position.y = 1.0 - i * 0.13; g.add(r); }
    const arms = []; for (const sd of [-1, 1]) { const sh = new T.Group(); sh.position.set(sd * 0.32, 1.1, 0); g.add(sh); c.cyl(0.035, 0.035, 0.46, bone, 0, -0.23, 0, sh, 6); const el = new T.Group(); el.position.y = -0.46; sh.add(el); c.cyl(0.03, 0.03, 0.42, bone, 0, -0.21, 0, el, 6); c.sph(0.07, bone, 0, -0.45, 0, el, 8); sh.rotation.z = sd * 0.25; arms.push({ sh, el }); }
    for (const sd of [-1, 1]) { c.cyl(0.045, 0.04, 0.72, bone, sd * 0.16, -0.3, 0, g, 6); c.cyl(0.04, 0.035, 0.7, bone, sd * 0.17, -1.0, 0, g, 6); c.sph(0.07, bone, sd * 0.16, -0.66, 0.02, g, 8); const ft = c.box(0.14, 0.07, 0.3, bone, sd * 0.17, -1.37, 0.08, g); }
    g.userData.arms = arms; return g; }
  /* a friendly ghost: a sheet with a wavy hem, two eyes and a round "oh" */
  function ghostMesh(c) { const { T, M } = c, g = new T.Group(), prof = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14, y = 1.7 - t * 1.7, r = t < 0.35 ? Math.sin(t / 0.35 * PI / 2) * 0.62 : 0.62 + (t - 0.35) * 0.4; prof.push(new T.Vector2(Math.max(0.001, r), y)); }
    const lg = new T.LatheGeometry(prof.reverse(), 28), p = lg.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.05) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, p.getY(i) + Math.sin(a * 6) * 0.1); } lg.computeVertexNormals();
    const body = new T.Mesh(lg, new T.MeshStandardMaterial({ color: 0xf4f8ff, emissive: 0xbfe8ff, emissiveIntensity: 0.55, transparent: true, opacity: 0.9, roughness: 0.4, side: T.DoubleSide })); g.add(body);
    const ink = M(0x16121e, { roughness: 0.3 }); for (const sd of [-1, 1]) { const e = c.sph(0.1, ink, sd * 0.2, 1.24, 0.53, g, 10); e.scale.set(0.8, 1.2, 0.5); } const mo = c.sph(0.09, ink, 0, 0.98, 0.6, g, 10); mo.scale.set(1, 1.2, 0.5);
    for (const sd of [-1, 1]) { const a = c.sph(0.16, body.material, sd * 0.68, 0.78, 0.06, g, 10); a.scale.set(1.3, 0.7, 0.8); }
    g.userData.body = body; return g; }
  /* a skeleton key: ring bow, collar, shaft, a two-step bit */
  function keyMesh(c, col) { const { T, M } = c, g = new T.Group(), m = M(col || 0xc8a04a, { metalness: 0.85, roughness: 0.3 });
    const bow = new T.Mesh(new T.TorusGeometry(0.32, 0.08, 10, 24), m); bow.position.y = 0.95; g.add(bow); const inner = new T.Mesh(new T.TorusGeometry(0.13, 0.04, 8, 16), m); inner.position.y = 0.95; g.add(inner);
    c.cyl(0.07, 0.07, 1.5, m, 0, 0, 0, g, 10); c.sph(0.12, m, 0, 0.58, 0, g, 10); c.box(0.36, 0.14, 0.08, m, 0.2, -0.56, 0, g); c.box(0.26, 0.12, 0.08, m, 0.15, -0.72, 0, g); return g; }
  /* a bone: a shaft with two knobs at each end */
  function boneMesh(c, s) { const { T, M } = c, g = new T.Group(), m = M(0xf0e4c8, { roughness: 0.55 }); const sh = new T.Mesh(new T.CapsuleGeometry(0.12, 1.2, 4, 10), m); sh.rotation.z = PI / 2; g.add(sh); for (const x of [-0.72, 0.72]) for (const z of [-0.12, 0.12]) c.sph(0.17, m, x, 0, z, g, 10); g.scale.setScalar(s || 1); return g; }
  /* green candle flames (sprites) — the catacombs' own light */
  function greenFlame(c, parent, x, y, z, s) { const f = c.sprite(0x9aff6a, 0.5 * (s || 1), x, y, z, parent, 0.95); f.scale.set(0.3 * (s || 1), 0.55 * (s || 1), 1); const h = c.sprite(0x5aff3a, 1.8 * (s || 1), x, y, z, parent, 0.3); const k = Math.random() * 6; c.updaters.push((dt, tm) => { const q = (0.85 + 0.2 * Math.sin(tm * 12 + k) * Math.sin(tm * 7 + k)) * GUST.v; f.scale.set(0.3 * (s || 1) * q, 0.55 * (s || 1) * q, 1); h.material.opacity = 0.24 + 0.08 * q; }); return f; }
  function candle(c, parent, x, y, z, h) { const { M } = c; c.cyl(0.08, 0.1, h, M(0xe8dcc0, { roughness: 0.6 }), x, y + h / 2, z, parent, 10); greenFlame(c, parent, x, y + h + 0.15, z, 0.8); }
  /* a cobweb for the corners (canvas lines on a transparent plane) */
  function cobweb(c, x, y, z, ry, s) { const { T, scene } = c; const tex = KQRealms.hall.canvasTex(T, 256, 256, (g, w, h) => { g.strokeStyle = 'rgba(235,235,245,0.75)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { const a = i / 8 * PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * w, Math.sin(a) * h); g.stroke(); } for (let r = 30; r < 256; r += 34) { g.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * PI / 2, rr = r * (0.92 + 0.08 * Math.sin(i * 2.3)); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); } });
    const m = new T.Mesh(new T.PlaneGeometry(3 * (s || 1), 3 * (s || 1)), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, PI); scene.add(m); return m; }
  /* a tombstone: a rounded slab (the stage's answer stones and the scenery's graves) */
  function tombGeo(T, w, h, d) { const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.absarc(0, h, w / 2, 0, PI, false); sh.lineTo(-w / 2, 0); const g = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 16 }); g.translate(0, 0, -d / 2); return g; }

  /* ================================================================== the halls */
  const HALL = () => KQRealms.hall;
  /* rows of skulls in niches along the curved back wall: the ossuary */
  function ossuary(c, r, rows, y0, from, to, tint) { const { T, scene } = c, n = rows * 40, inst = new T.InstancedMesh(skullGeo(T), vcMat(T, { color: tint || 0xffffff }), n), m4 = new T.Matrix4(); let k = 0;
    for (let row = 0; row < rows; row++) for (let i = 0; i < 40 && k < n; i++) { const a = from + (to - from) * (i + (row % 2) * 0.5) / 40, rr = r - 0.35; m4.compose(new T.Vector3(Math.cos(a) * rr, y0 + row * 0.95, Math.sin(a) * rr), new T.Quaternion().setFromEuler(new T.Euler(0, -a - PI / 2, 0)), new T.Vector3(0.62, 0.62, 0.62)); inst.setMatrixAt(k++, m4); }
    inst.count = k; scene.add(inst); for (let row = 0; row <= rows; row++) { const shelf = new T.Mesh(new T.CylinderGeometry(r - 0.1, r - 0.1, 0.14, 64, 1, true, PI / 2 - to, to - from), c.M(0x3a3440, { roughness: 1, side: T.DoubleSide })); shelf.position.y = y0 - 0.42 + row * 0.95; scene.add(shelf); } }
  function deadTree(c, x, z, h, s) { const { T, scene, M } = c, bark = M(0x2a2420, { roughness: 1 }), g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(s || 1); scene.add(g);
    const limb = (from, dir, len, r, depth) => { const to = from.clone().add(dir.clone().multiplyScalar(len)); const m = new T.Mesh(new T.CylinderGeometry(r * 0.6, r, len, 6), bark); m.position.copy(from).add(to).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize()); g.add(m); if (depth > 0) for (let i = 0; i < 2; i++) { const d = dir.clone().add(new T.Vector3(c.R(-0.9, 0.9), c.R(0.1, 0.5), c.R(-0.9, 0.9))).normalize(); limb(to, d, len * 0.62, r * 0.6, depth - 1); } };
    limb(new T.Vector3(0, 0, 0), new T.Vector3(c.R(-0.1, 0.1), 1, c.R(-0.1, 0.1)).normalize(), h * 0.5, 0.32, 3); return g; }
  function fogBank(c, n, y, spread, col, op) { const { T, scene } = c; const list = []; for (let i = 0; i < n; i++) { const s = c.sprite(col || 0xc8c0e0, c.R(5, 9), c.R(-spread, spread), y + c.R(0, 0.6), c.R(-14, 6), null, op == null ? 0.16 : op); s.scale.y *= 0.35; list.push(s); } const k0 = Math.random() * 6; c.updaters.push((dt, tm) => list.forEach((s, i) => { s.position.x += Math.sin(tm * 0.2 + i + k0) * dt * 0.3; })); }
  function flappingBats(c, n, cx, cy, cz, rad) { const { T, scene, M } = c, bm = M(0x0e0a12, { roughness: 0.6, side: T.DoubleSide }), bats = []; const wg = new T.Shape(); wg.moveTo(0, 0); wg.quadraticCurveTo(0.35, 0.3, 0.7, 0.12); wg.lineTo(0.55, 0); wg.lineTo(0.62, -0.12); wg.lineTo(0.42, -0.06); wg.lineTo(0.3, -0.16); wg.lineTo(0.12, -0.06); wg.closePath(); const wgeo = new T.ShapeGeometry(wg);
    for (let i = 0; i < n; i++) { const b = new T.Group(); b.add(new T.Mesh(new T.SphereGeometry(0.1, 8, 6), bm)); const ws = []; for (const sd of [-1, 1]) { const w = new T.Mesh(wgeo, bm); w.scale.set(sd, 1, 1); b.add(w); ws.push(w); } b.userData = { a: Math.random() * TAU, r: rad * (0.6 + Math.random() * 0.4), v: (0.3 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1), ws, k: Math.random() * 6, h: cy + Math.random() * 3 }; scene.add(b); bats.push(b); }
    c.updaters.push((dt, tm) => { for (const b of bats) { const u = b.userData; u.a += dt * u.v; b.position.set(cx + Math.cos(u.a) * u.r, u.h + Math.sin(tm * 2 + u.k) * 0.4, cz + Math.sin(u.a) * u.r * 0.5); b.rotation.y = -u.a + (u.v > 0 ? 0 : PI); const f = Math.sin(tm * 16 + u.k) * 0.9; u.ws[0].rotation.y = f; u.ws[1].rotation.y = -f; } }); return bats; }

  /* a little more fright in every skull hall (Yoni 2026-09-25: 'a bit more scarier … all the games in the world'): eyes that open in the
     dark and blink, the flames gutter together when a draught goes by, a ghost drifts across the back now and then, lightning over the
     open halls. All of it stays behind the answers — nothing crosses a station. */
  const GUST = { v: 1 };   /* the draught: every green flame and every haunted light dips with it */
  function haunt(c, o) { const { T, scene } = c; o = o || {}; const spots = (o.eyes || []).slice(), pairs = []; let placed = !o.eyesAt;   /* eyesAt: screen points — the eyes go on whatever rock is really there (halls with random boulders) */
    for (let i = 0; i < Math.min(2, (o.eyes || o.eyesAt || []).length); i++) { const g = new T.Group(); g.visible = false; scene.add(g); const e = [-0.46, 0.46].map(x => c.sprite(o.eyeCol || 0x9aff5a, 0.95, x, 0, 0, g, 1)); pairs.push({ g, e, t: 1.5 + i * 3.2, age: 0, life: 0 }); }
    let ghost = null; if (o.ghost) { ghost = ghostMesh(c); ghost.traverse(m => { if (!m.isMesh) return; m.material = m.material.clone(); m.material.userData.ink = m.material.color.getHex() < 0x303030; m.material.transparent = true; m.material.depthWrite = false; m.material.opacity = 0; }); ghost.scale.setScalar(0.9); ghost.visible = false; scene.add(ghost); }
    const bolt = o.lightning ? new T.HemisphereLight(0xc8d8ff, 0x202030, 0) : null; if (bolt) scene.add(bolt);
    let sky = null; if (bolt) scene.traverse(m => { if (!sky && m.isMesh && m.material && m.material.uniforms && m.material.uniforms.top && m.material.uniforms.hor) sky = m.material.uniforms; }); const sky0 = sky ? [sky.top.value.clone(), sky.hor.value.clone()] : null, skyF = new T.Color(0x9aa4d8);   /* the sky itself lights up — that is what reads as lightning */
    const lights = (o.lights || []).map(l => ({ l, i0: l.intensity })); let gustT = 5 + Math.random() * 4, gust = 0, ghostT = 4 + Math.random() * 4, gp = -1, boltT = 6 + Math.random() * 5, bp = -1;
    c.updaters.push((dt, tm) => {
      if (!placed && tm > 0.6) { placed = true; const rc = new T.Raycaster(), ms = [];   /* once the hall's camera has settled */ scene.traverse(m => { if (m.isMesh && m.visible && m.material && m.material.visible !== false && !m.material.transparent && m.layers.mask === 1) ms.push(m); }); c.camera.updateMatrixWorld(); for (const [x, y] of o.eyesAt) { rc.setFromCamera(new T.Vector2(x, y), c.camera); const h = rc.intersectObjects(ms, false)[0]; if (h && h.distance > 6 && h.distance < 40) spots.push(h.point.clone().addScaledVector(rc.ray.direction, -0.3).toArray()); } if (!spots.length) pairs.length = 0; }
      gustT -= dt; if (gustT < 0) { gust = 1; gustT = 9 + Math.random() * 7; } gust = Math.max(0, gust - dt / 1.2); GUST.v = 1 - 0.6 * Math.sin(gust * PI);
      const fl = GUST.v * (0.9 + 0.1 * Math.sin(tm * 17) * Math.sin(tm * 5.3)); for (const L of lights) L.l.intensity = L.i0 * fl;
      for (const p of pairs) { if (!p.g.visible) { p.t -= dt; if (p.t < 0 && spots.length) { const s = spots[Math.floor(Math.random() * spots.length)]; p.g.position.set(s[0], s[1], s[2]); p.g.visible = true; p.age = 0; p.life = 3 + Math.random() * 2.5; } continue; }
        p.age += dt; const open = Math.min(1, p.age / 0.35, (p.life - p.age) / 0.35), blink = (p.age % 1.7) > 1.55 ? 0.05 : 1; for (const e of p.e) e.scale.set(0.95, 0.52 * Math.max(0.02, open * blink), 1); if (p.age >= p.life) { p.g.visible = false; p.t = 2 + Math.random() * 4; } }
      if (ghost) { if (gp < 0) { ghostT -= dt; if (ghostT < 0) { gp = 0; ghost.visible = true; ghost.userData.dir = Math.random() < 0.5 ? 1 : -1; } }
        else { gp += dt / 10; const d = ghost.userData.dir, a = 0.42 * Math.sin(Math.min(1, gp) * PI); ghost.position.set((gp * 2 - 1) * o.ghost.w * d, o.ghost.y + Math.sin(tm * 1.6) * 0.35, o.ghost.z); ghost.rotation.y = d * 0.9; ghost.traverse(m => { if (m.isMesh) m.material.opacity = m.material.userData.ink ? Math.min(1, a * 1.8) : a; }); if (gp >= 1) { gp = -1; ghost.visible = false; ghostT = 12 + Math.random() * 10; } } }
      if (bolt) { if (bp < 0) { boltT -= dt; if (boltT < 0) bp = 0; } else { bp += dt; const f = bp > 0.3 ? 0 : bp < 0.07 ? 1 : bp < 0.15 ? 0 : bp < 0.24 ? 0.7 : 0; bolt.intensity = 5 * f; if (sky) { sky.top.value.copy(sky0[0]).lerp(skyF, 0.75 * f); sky.hor.value.copy(sky0[1]).lerp(skyF, 0.75 * f); } if (bp > 0.3) { bp = -1; boltT = 10 + Math.random() * 9; } } }
    }); }
  const THEMES = {
    /* the Coffin Vault: a burial vault under the hill — skulls in their niches, green candles, cobwebs, a candle wheel overhead */
    skull_vault: { palette: { sky: 0x0e0a14, ground: 0x1a1620, fog: 0x0c0810, wall: ['brick', '#3a3440', '#4e4656'], floor: ['brick', '#3e3844', '#2c2832'], hemi: [0xb8a8ff, 0x140c1a], key: 0xa8ff9a, dust: { c: 0xd8ffd0, n: 60, mode: 'drift' } }, look: { keyC: 0xe8e0ff, grade: 'skull', exposure: 1.1, fogD: 0.018, rim: 0x8aff5a, face: 0x1a1426, accent: '#b8ff9a', pillars: 'stone', rays: 1 },
      props(c) { const { T, scene, M } = c; ossuary(c, 17, 5, 2.2, PI * 1.12, PI * 1.88);
        for (const [x, z] of [[-7.5, -4], [7.5, -4], [-8.5, 2], [8.5, 2]]) { const g = new T.Group(); g.position.set(x, 0, z); scene.add(g); c.cyl(0.5, 0.6, 0.5, M(0x3a3440), 0, 0.25, 0, g, 10); for (let i = 0; i < 5; i++) candle(c, g, Math.cos(i * 1.3) * 0.32, 0.5, Math.sin(i * 1.3) * 0.32, 0.4 + (i % 3) * 0.25); }
        const wheel = new T.Group(); wheel.position.set(0, 9.5, -1); scene.add(wheel); const ir = M(0x2a2630, { metalness: 0.7, roughness: 0.4 }); { const rim = new T.Mesh(new T.TorusGeometry(2.2, 0.08, 6, 36), ir); rim.rotation.x = PI / 2; wheel.add(rim); } for (let i = 0; i < 4; i++) { const ch = c.cyl(0.02, 0.02, 6.5, ir, Math.cos(i * PI / 2) * 1.6, 3.2, Math.sin(i * PI / 2) * 1.6, wheel, 4); ch.rotation.z = Math.cos(i * PI / 2) * -0.24; ch.rotation.x = Math.sin(i * PI / 2) * 0.24; } for (let i = 0; i < 10; i++) candle(c, wheel, Math.cos(i / 10 * TAU) * 2.2, 0.05, Math.sin(i / 10 * TAU) * 2.2, 0.35); const wl = new T.PointLight(0x9aff6a, 20, 18, 1.6); wl.position.y = -0.5; wheel.add(wl);
        cobweb(c, -11.5, 12.5, -11.5, PI / 4, 1.6); cobweb(c, 11.5, 12.5, -11.5, -PI / 4, 1.6);
        const big = new T.Mesh(skullGeo(T), vcMat(T)); big.scale.setScalar(2.4); big.position.set(0, 11.2, -16); scene.add(big); for (const sd of [-1, 1]) c.sprite(0x8aff5a, 1.4, sd * 0.46, 11.35, -14.9, null, 0.8);
        fogBank(c, 8, 0.15, 12, 0xb8d0b8, 0.1); flappingBats(c, 3, 0, 7.2, -9, 9); haunt(c, { lights: [wl], eyeCol: 0x9aff5a, eyesAt: [[-0.76, 0.4], [-0.93, 0.14], [0.78, 0.36], [0.92, 0.08], [0.7, 0.18], [-0.62, 0.3]], ghost: { y: 5.2, z: -11, w: 11.5 } });   /* screen points: the pillars hide any fixed spot from some views */ } },
    /* Riddle Graveyard: a moonlit churchyard, crooked stones, dead trees, an iron fence, fog in the grass */
    skull_graveyard: { palette: { noFloor: true, sky: 0x140c24, ground: 0x1e2a1c, fog: 0x1a1030, wall: ['rock', '#2a2438', '#3a3448'], floor: ['moss', '#2e3a2a', '#1e2a1c'], hemi: [0xa8b8ff, 0x10140c], key: 0xc8d8ff, dust: { c: 0xd0e0ff, n: 50, mode: 'drift' } }, look: { keyC: 0xd8e0ff, grade: 'skull', exposure: 1.1, fogD: 0.014, rim: 0x9ab8ff, face: 0x141a2a, accent: '#c8d8ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, M } = c; HALL().skyDome(c, 0x0c0820, 0x3a2a5a, true); HALL().ground(c, 0x24301f, 70, c.wallTex('moss', '#2e3a2a', '#1e2a1c')).material.map.repeat.set(18, 18);
        c.sprite(0xf4f0ff, 12, 14, 16, -50, null, 0.95); c.sprite(0xb8c8ff, 34, 14, 16, -52, null, 0.25); flappingBats(c, 7, 14, 13, -40, 7);
        const ir = M(0x1a1820, { metalness: 0.6, roughness: 0.5 }); for (let i = -22; i <= 22; i++) { if (Math.abs(i) < 2) continue; c.cyl(0.05, 0.05, 2.4, ir, i * 0.7, 1.2, -10, null, 5); c.cone(0.1, 0.25, ir, i * 0.7, 2.5, -10, null, 4); } for (const y of [0.5, 2.0]) c.box(31, 0.08, 0.08, ir, 0, y, -10); for (const sd of [-1, 1]) { c.box(0.5, 3.4, 0.5, M(0x4a4658), sd * 1.4, 1.7, -10); c.sph(0.35, M(0x5a5668), sd * 1.4, 3.6, -10, null, 12); }
        const tG = tombGeo(T, 1.0, 0.9, 0.22), stone = M(0x6a6676, { roughness: 0.95 }); for (let i = 0; i < 16; i++) { const x = c.R(-16, 16), z = c.R(-18, -11); const t = new T.Mesh(tG, stone); t.position.set(x, 0, z); t.rotation.set(c.R(-0.15, 0.1), c.R(-0.4, 0.4), c.R(-0.15, 0.15)); t.scale.setScalar(c.R(0.7, 1.2)); scene.add(t); }
        deadTree(c, -11, -6, 9, 1); deadTree(c, 12, -7, 8, 1.1); deadTree(c, -15, 2, 7, 0.9); fogBank(c, 18, 0.25, 16, 0xb8b0d8, 0.14);
        const lp = new T.Group(); lp.position.set(7.2, 0, 3.2); scene.add(lp); c.cyl(0.08, 0.1, 3.6, ir, 0, 1.8, 0, lp, 8); c.box(0.9, 0.06, 0.06, ir, 0.4, 3.5, 0, lp); const lan = c.sph(0.2, M(0xd8f0ff, { emissive: 0xa8d8ff, emissiveIntensity: 2 }), 0.8, 3.1, 0, lp, 10); const pl = new T.PointLight(0xa8c8ff, 12, 12, 1.6); pl.position.set(0.8, 3.1, 0); lp.add(pl);
        haunt(c, { lights: [pl], eyeCol: 0xffc86a, eyes: [[-13, 1.3, -14], [12, 1.1, -13], [-6, 1.2, -16.5], [8, 1.6, -17], [-11, 4.4, -6.4], [12, 4, -7.2]], ghost: { y: 2.6, z: -14, w: 15 }, lightning: true }); } },
    /* Bone Letters: a candlelit crypt with walls of stacked bones and a carved stone slab where the word is set */
    skull_crypt: { palette: { sky: 0x0c0a0e, ground: 0x1a1612, fog: 0x0a0806, wall: ['rock', '#3a342c', '#4a443a'], floor: ['brick', '#3a3430', '#2a2622'], hemi: [0xb8c8b0, 0x0c140a], key: 0xa8ff9a, dust: { c: 0xd8ffd0, n: 60, mode: 'drift' } }, look: { keyC: 0xe0ffe8, grade: 'skull', exposure: 1.02, fogD: 0.02, rim: 0x8aff5a, face: 0x141a14, accent: '#b8ff9a', pillars: 'stone', rays: 1 },   /* was a warm cellar — too cosy for the skull world */
      props(c) { const { T, scene, M } = c; const bones = HALL().canvasTex(T, 512, 256, (x, w, h) => { x.fillStyle = '#2a2420'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let i = 0; i < 12; i++) { const bx = i * 44 + (r % 2) * 22, by = r * 32 + 16; if ((i + r) % 5 === 0) { x.fillStyle = '#d8ccb0'; x.beginPath(); x.arc(bx + 12, by, 13, 0, TAU); x.fill(); x.fillStyle = '#2a2018'; x.beginPath(); x.arc(bx + 7, by - 1, 3.5, 0, TAU); x.arc(bx + 17, by - 1, 3.5, 0, TAU); x.fill(); } else { x.fillStyle = ['#e0d4b8', '#d0c4a8', '#c8bca0'][(i * 7 + r) % 3]; x.fillRect(bx, by - 4, 34, 8); for (const ex of [bx, bx + 34]) { x.beginPath(); x.arc(ex, by - 4, 5, 0, TAU); x.arc(ex, by + 4, 5, 0, TAU); x.fill(); } } } }, [6, 2]);
        for (const sd of [-1, 1]) { const w = new T.Mesh(new T.CylinderGeometry(16.6, 16.6, 9, 48, 1, true, sd < 0 ? PI * 1.02 : PI * 1.62, PI * 0.36), new T.MeshStandardMaterial({ map: bones, roughness: 0.8, side: T.BackSide })); w.position.y = 4.5; scene.add(w); }
        const sar = new T.Group(); sar.position.set(-8.4, 0, -3.5); sar.rotation.y = 0.5; scene.add(sar); c.box(1.8, 1.1, 3.4, M(0x6a6258), 0, 0.55, 0, sar); c.box(2.0, 0.24, 3.6, M(0x7a7266), 0, 1.22, 0, sar); const sk = new T.Mesh(skullGeo(T), vcMat(T)); sk.scale.setScalar(0.7); sk.position.set(0, 1.62, 1.0); sar.add(sk);
        for (const [x, z] of [[8.2, -3.2], [9.2, -1.4]]) { const u = new T.Mesh(new T.LatheGeometry([[0.01, 0], [0.4, 0.05], [0.55, 0.5], [0.4, 1.0], [0.25, 1.15], [0.32, 1.3], [0.01, 1.32]].map(p => new T.Vector2(p[0], p[1])), 18), M(0x8a5a3a, { roughness: 0.7 })); u.position.set(x, 0, z); scene.add(u); }
        for (const [x, z, h] of [[-5.5, -6.6, 1.2], [5.5, -6.6, 1.2], [-6.4, -6.0, 0.8], [6.4, -6.0, 0.9]]) { const g = new T.Group(); g.position.set(x, 0, z); scene.add(g); c.cyl(0.12, 0.14, h, M(0xe8dcc0), 0, h / 2, 0, g, 10); greenFlame(c, g, 0, h + 0.12, 0, 0.7); } const cl = new T.PointLight(0x7aff5a, 12, 16, 1.6); cl.position.set(0, 4, -4); scene.add(cl);
        fogBank(c, 8, 0.15, 12, 0xc0d0b8, 0.1); flappingBats(c, 3, 0, 6.8, -9, 9); haunt(c, { lights: [cl], eyeCol: 0xff8a3a, eyesAt: [[-0.8, 0.35], [-0.93, 0.1], [0.8, 0.32], [0.93, 0.06], [0.66, 0.44], [-0.64, 0.46]], ghost: { y: 4.6, z: -10.5, w: 11 } }); } },
    /* The Locked Crypt: the great door in the hillside at night, skull pillars with green fire, fog along the ground */
    skull_gate: { palette: { noFloor: true, sky: 0x08100c, ground: 0x1a2018, fog: 0x0c1a14, wall: ['rock', '#2a302a', '#3a403a'], floor: ['rock', '#3a4038', '#2a302a'], hemi: [0xa8ffc8, 0x0c140e], key: 0x9aff8a, dust: { c: 0xc8ffd0, n: 50, mode: 'drift' } }, look: { keyC: 0xd8ffe0, grade: 'skull', exposure: 1.1, fogD: 0.016, rim: 0x8aff5a, face: 0x0e1a12, accent: '#9aff8a', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, scene, M } = c; HALL().skyDome(c, 0x060c0a, 0x1a3a2a, true, 0xd8ffe8); HALL().ground(c, 0x2a3028, 70, c.wallTex('rock', '#3a4038', '#2a302a')).material.map.repeat.set(16, 16);
        const rock = M(0x2e342e, { roughness: 1 }); for (let i = 0; i < 22; i++) { const a = c.R(-0.2, PI + 0.2), r = c.R(9, 13), rad = c.R(2, 4.5), sy = c.R(0.8, 1.6); const b = new T.Mesh(new T.DodecahedronGeometry(rad, 0), rock); const x = Math.cos(a) * r; let z = -8 - Math.sin(a) * c.R(2, 5); if (Math.abs(x) < 7.5) z = Math.min(z, -7.6 - rad * sy);   /* never through the door (its face is at z −6.45; a random boulder once poked out of it) */ b.position.set(x, c.R(1, 5), z); b.scale.y = sy; b.rotation.set(c.R(0, 3), c.R(0, 3), 0); scene.add(b); }
        const hill = new T.Mesh(new T.SphereGeometry(16, 32, 16, 0, TAU, 0, PI / 2), rock); hill.scale.set(1.4, 0.8, 0.5); hill.position.set(0, -0.5, -22); scene.add(hill);   /* well behind the door: the hill must never swallow it */
        const gls = []; for (const sd of [-1, 1]) { const p = new T.Group(); p.position.set(sd * 6.4, 0, -5.4); scene.add(p); c.box(1.2, 4.2, 1.2, M(0x4a4a44), 0, 2.1, 0, p); const sk = new T.Mesh(skullGeo(T), vcMat(T)); sk.scale.setScalar(1.1); sk.position.y = 4.8; p.add(sk); const bowl = c.cyl(0.55, 0.3, 0.4, M(0x2a2a2e, { metalness: 0.7 }), 0, 5.7, 0, p, 12); greenFlame(c, p, 0, 6.4, 0, 2.2); const gl = new T.PointLight(0x7aff5a, 16, 14, 1.6); gl.position.set(0, 6.6, 0.5); p.add(gl); gls.push(gl); }
        fogBank(c, 16, 0.2, 14, 0xa8e8c0, 0.12); flappingBats(c, 6, 0, 11, -14, 9); haunt(c, { lights: gls, eyeCol: 0xffa040, eyesAt: [[-0.72, 0.44], [-0.9, 0.2], [0.64, -0.06], [0.84, -0.28], [0.42, 0.28], [0.74, 0.4]], ghost: { y: 6, z: -4.6, w: 9 }, lightning: true });   /* the rock facade walls off everything behind the door */ } }
  };

  /* ================================================================== the games (stages) */
  /* phones: the row of answers shrinks and closes up so all four stay on screen */
  const lay = (c, sp) => { const narrow = c.camera.aspect < 1.05; return { k: narrow ? 0.85 : 1, sp: sp * (narrow ? 0.72 : 1) }; };
  function flyTo(c, obj, to, dur, arc, done) { const from = obj.position.clone(); c.tween(dur, k => { const e = c.ease(k); obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(PI * k) * arc; }, done); }
  const STAGES = {
    /* ---- The Coffin Vault: coffins stand upright along the vault, the answers above them; the right lid swings open like a door and its skeleton steps out and waves ---- */
    coffins(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 5.6, 15.5], look: [0, 2.3, -3.6], fov: 60 } : a < 1.5 ? { pos: [0, 4.9, 12.6], look: [0, 2.4, -3.6], fov: 50 } : { pos: [0, 4.7, 11.8], look: [0, 2.5, -3.6], fov: 46 },
      hostAt: () => new T.Vector3(-7.2, 0, 2.6),
      build() { MS.biers = []; },
      present(choices) { const n = choices.length, wood = c.M(0x4a2a1e, { roughness: 0.6 }), lidM = c.M(0x5a3424, { roughness: 0.55 }), gold = c.M(0xd8b04a, { metalness: 1, roughness: 0.3 }), velvet = c.M(0x7a1428, { roughness: 0.9 });
        const L = lay(c, 3.0); for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, x = off * L.sp, z = -3.6 - Math.abs(off) * 0.6; const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = -off * 0.16; g.scale.setScalar(L.k);
          c.box(1.7, 0.3, 1.3, c.M(0x4a4450, { roughness: 0.9 }), 0, 0.15, 0.1, g);
          const cof = new T.Group(); cof.position.set(0, 1.92, -0.35); cof.rotation.x = PI / 2; g.add(cof);   /* stood on its foot: the head up, the lid facing you */
          const body = new T.Mesh(coffinGeo(T), wood); body.castShadow = true; cof.add(body); const bed = new T.Mesh(coffinFlat(T), velvet); bed.position.y = 0.745; cof.add(bed);
          const piv = new T.Group(); piv.position.set(0.62, 0.76, 0); cof.add(piv); const lid = new T.Mesh(coffinGeo(T, true), lidM); lid.position.x = -0.62; lid.castShadow = true; piv.add(lid); const plate = c.box(0.34, 0.03, 0.5, gold, -0.62, 0.17, -0.5, piv); plate.rotation.y = PI / 4; c.box(0.1, 0.05, 0.1, gold, -0.02, 0.1, 0.4, piv);
          const tab = c.label(choices[j], j, 0.92); tab.position.set(0, 4.25, 0.2); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.1, 4.8, 1.6, j, 2.1); g.add(h);
          const ch = { j, g, tab, obj: cof, hits: [h], still: true, piv }; c.addChoice(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const at = ch.g.position.clone().add(new T.Vector3(0, 2, 0.6));
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; ch.anim = true;
          c.tween(0.7, k => { ch.piv.rotation.z = -1.95 * c.ease(k); }, () => { const sk = skeleton(c); sk.position.set(0, 1.62, -0.1); sk.scale.setScalar(0.001); ch.g.add(sk); c.burst(at, 0x9aff6a, 18); c.burst(at, 0xfff0c0, 10);
            c.tween(0.6, k => { sk.scale.setScalar(Math.max(0.001, 0.82 * c.over(k))); sk.position.z = -0.1 + c.ease(k) * 0.9; }, () => { const A = sk.userData.arms[1]; c.tween(1.3, k => { A.sh.rotation.z = 2.5 + Math.sin(k * PI * 6) * 0.35; A.el.rotation.z = 0.5 + Math.sin(k * PI * 6 + 1) * 0.4; sk.userData.head.rotation.z = Math.sin(k * PI * 4) * 0.25; sk.position.y = 1.62 + Math.abs(Math.sin(k * PI * 6)) * 0.1; }, () => {
              c.tween(0.5, k => { sk.position.z = 0.8 - c.ease(k) * 0.9; sk.scale.setScalar(Math.max(0.001, 0.82 * (1 - k))); }, () => { ch.g.remove(sk); c.tween(0.4, k => { ch.piv.rotation.z = -1.95 * (1 - c.ease(k)); }); }); }); }); }); }
        else { ch.tab.userData.tablet.setState('wrong'); ch.anim = true; const p0 = ch.obj.position.clone(); c.tween(0.9, k => { ch.piv.rotation.z = -Math.abs(Math.sin(k * PI * 6)) * 0.22 * (1 - k); ch.obj.position.x = p0.x + Math.sin(k * PI * 10) * 0.05 * (1 - k); }, () => { ch.obj.position.copy(p0); });
          const bat = new T.Group(); const bm = c.M(0x14101a, { side: T.DoubleSide }); c.sph(0.14, bm, 0, 0, 0, bat, 8); const ws = []; for (const sd of [-1, 1]) { const w = c.box(0.5, 0.02, 0.26, bm, sd * 0.3, 0, 0, bat); ws.push(w); } bat.position.copy(at); scene.add(bat); c.tween(1.4, k => { bat.position.set(at.x + k * 5 * (at.x < 0 ? -1 : 1), at.y + k * 4, at.z + k * 2); ws.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(k * 60) * 0.8; }); }, () => scene.remove(bat)); for (let i = 0; i < 8; i++) { const s = c.sprite(0xb8b0a0, c.R(0.3, 0.6), at.x + c.R(-0.5, 0.5), at.y + c.R(-1, 1), at.z + 0.3, null, 0.6); c.tween(1, k => { s.position.y += 0.02; s.material.opacity = 0.6 * (1 - k); }, () => scene.remove(s), i * 0.05); } c.glowUp(r); }
        return ok ? 3.4 : 2.4; } }; },

    /* ---- Riddle Graveyard: the answers are carved on the stones; the right stone glows and a ghost rises out of it ---- */
    tombs(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 4.4, 11], look: [0, 2.3, -3.4], fov: 60 } : a < 1.5 ? { pos: [0, 3.8, 9.2], look: [0, 2.6, -3.4], fov: 50 } : { pos: [0, 3.6, 8.4], look: [0, 2.7, -3.4], fov: 46 },
      hostAt: () => new T.Vector3(-5.6, 0, 0.6),
      build() { const mound = new T.Mesh(new T.SphereGeometry(9, 32, 12, 0, TAU, 0, PI / 2), c.M(0x2a3424, { roughness: 1, map: c.wallTex('moss', '#34402e', '#24301f') })); mound.scale.set(1.3, 0.08, 0.5); mound.position.set(0, -0.05, -3.6); scene.add(mound); },
      present(choices) { const n = choices.length, G = tombGeo(T, 2.2, 1.6, 0.36), stone = c.M(0x8a8696, { roughness: 0.9, map: c.wallTex('rock', '#8a8696', '#6a6676') });
        const L = lay(c, 3.2); for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2; const g = new T.Group(); g.position.set(off * L.sp, 0, -3.4 - Math.abs(off) * 0.5); g.rotation.y = -off * 0.1; g.scale.setScalar(L.k);
          const st = new T.Mesh(G, stone); st.castShadow = true; g.add(st); c.box(2.6, 0.2, 0.9, c.M(0x5a5664), 0, 0.1, 0.1, g); for (let i = 0; i < 5; i++) { const m = c.sph(c.R(0.12, 0.22), c.M(0x3a6a2a, { roughness: 1 }), c.R(-1, 1), c.R(0, 0.3), 0.2, g, 6); m.scale.y = 0.5; }
          const tab = c.label(choices[j], j, 0.86); tab.position.set(0, 1.6, 0.34); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.5, 3, 1.4, j, 1.4); g.add(h);
          const ch = { j, g, tab, obj: st, hits: [h], still: true }; c.addChoice(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const at = ch.g.position.clone();
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const glow = c.sprite(0xc8f0ff, 5, at.x, 1.6, at.z + 0.3, null, 0); c.tween(0.5, k => { glow.material.opacity = 0.55 * k; });
          const gh = ghostMesh(c); gh.position.set(at.x, 0.2, at.z - 0.6); gh.scale.setScalar(0.001); scene.add(gh);
          c.tween(1.6, k => { const e = c.ease(k); gh.scale.setScalar(Math.max(0.001, Math.min(1, k * 2.2))); gh.position.y = 0.2 + e * 3.2; gh.position.z = at.z - 0.6 + e * 1.2; gh.rotation.y = Math.sin(k * PI * 2) * 0.5; gh.userData.body.material.opacity = 0.9; }, () => { c.burst(gh.position.clone().add(new T.Vector3(0, 1, 0)), 0xdff4ff, 16);
            c.tween(0.9, k => { gh.position.y = 3.4 + k * 3; gh.userData.body.material.opacity = 0.9 * (1 - k); gh.scale.setScalar(Math.max(0.001, 1 - k * 0.6)); glow.material.opacity = 0.55 * (1 - k); }, () => { scene.remove(gh); scene.remove(glow); }, 0.5); }); }
        else { ch.tab.userData.tablet.setState('wrong'); ch.anim = true; const st = ch.obj; c.shatterAt(at.clone().add(new T.Vector3(0, 2.4, 0.2)), 0x8a8696, 10); c.tween(0.6, k => { st.rotation.x = -0.18 * c.ease(k); st.rotation.z = Math.sin(k * PI * 8) * 0.03 * (1 - k); }); for (let i = 0; i < 8; i++) { const s = c.sprite(0xa8a4b0, c.R(0.4, 0.8), at.x + c.R(-1, 1), 0.3, at.z + c.R(0, 0.8), null, 0.5); c.tween(1.1, k => { s.position.y = 0.3 + k * 1.2; s.material.opacity = 0.5 * (1 - k); }, () => scene.remove(s), i * 0.04); } c.glowUp(r); }
        return ok ? 3.2 : 2.3; } }; },

    /* ---- Bone Letters: the word is set in stone on the crypt wall with one tile missing; the right bone flies up and becomes the letter ---- */
    bones(c) { const { T, scene, MS } = c; let slab = null;
      const tile = (ch, dark) => { const t = c.FX.tablet(String(ch), { face: dark ? 0x0c0a08 : c.P.face, glow: c.P.key, w: 1.0, h: 1.2 }); return t; };
      function setWord(x) { if (slab) { scene.remove(slab); slab.traverse(o => { if (o.userData && o.userData.tablet) o.userData.tablet.dispose(); }); } const { word, gap } = x, cs = [...word], n = cs.length, rtl = c.RTL(); slab = new T.Group(); slab.position.set(0, 3.9, -6.2); slab.scale.setScalar(lay(c, 1).k * (n > 8 ? 0.9 : 1)); scene.add(slab); const W = n * 1.34 + 1.2;
        c.box(W, 2.2, 0.4, c.M(0x6a6258, { roughness: 0.9, map: c.wallTex('rock', '#6a6258', '#564e46') }), 0, 0, -0.25, slab); for (const sd of [-1, 1]) { const sk = new T.Mesh(skullGeo(T), vcMat(T)); sk.scale.setScalar(0.7); sk.position.set(sd * (W / 2 + 0.45), 0, -0.1); slab.add(sk); }
        MS.tiles = []; for (let i = 0; i < n; i++) { const px = (rtl ? -1 : 1) * (i - (n - 1) / 2) * 1.34; if (cs[i] === ' ') { MS.tiles.push(null); continue; } let t; if (i === gap) { t = new T.Group(); const hole = c.box(1.12, 1.34, 0.12, c.M(0x0c0a08, { roughness: 1 }), 0, 0, 0, t); const ring = c.sprite(0xffd27a, 1.8, 0, 0, 0.2, t, 0.35); t.userData.ring = ring; MS.gapAt = new T.Vector3(px, 0, 0.1); } else { t = tile(cs[i]); t.scale.setScalar(1.12); } t.position.set(px, 0, 0.05); slab.add(t); MS.tiles.push(t); }
        MS.word = word; MS.gap = gap; MS.slab = slab; }
      return {
      frame: a => a < 1.05 ? { pos: [0, 6.6, 15], look: [0, 2.8, -3.4], fov: 60 } : a < 1.5 ? { pos: [0, 5.6, 12], look: [0, 2.9, -3.4], fov: 50 } : { pos: [0, 5.4, 11.4], look: [0, 3.0, -3.4], fov: 46 },
      hostAt: () => new T.Vector3(-6.2, 0, 1.6),
      build() { const alt = new T.Group(); alt.position.set(0, 0, -0.6); scene.add(alt); c.box(11, 0.9, 1.9, c.M(0x5a524a, { roughness: 0.9 }), 0, 0.45, 0, alt); c.box(11.4, 0.16, 2.1, c.M(0x6a6258), 0, 0.98, 0, alt); MS.altar = alt;
        c.updaters.push((dt, tm) => { const t = MS.tiles && MS.tiles[MS.gap]; if (t && t.userData.ring) t.userData.ring.material.opacity = 0.25 + 0.2 * Math.sin(tm * 4); }); },
      present(choices, q) { const x = q && q.x; if (x && x.word) setWord(x); const n = choices.length;
        const L = lay(c, 2.6); for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2; const g = new T.Group(); g.position.set(off * L.sp, 1.3, -0.6); g.scale.setScalar(L.k); const b = boneMesh(c, 1.0); b.rotation.y = c.R(-0.3, 0.3); g.add(b);
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, 1.0, 0.3); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.3, 2.2, 1.4, j, 0.6); g.add(h);
          const ch = { j, g, tab, obj: b, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); c.updaters.push((dt, tm) => { if (ch.flying) return; b.position.y = Math.sin(tm * 1.8 + ch.k0) * 0.06; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2;
        if (ok && MS.slab && MS.gapAt) { ch.tab.userData.tablet.setState('right'); MS.right++; ch.flying = true; ch.gone = true; const to = MS.slab.localToWorld(MS.gapAt.clone()); c.tween(0.25, k => { ch.tab.scale.setScalar(Math.max(0.001, ch.tab.userData.s0 * (1 - k))); });
          flyTo(c, ch.g, to, 0.9, 1.6, () => { ch.g.visible = false; c.burst(to, 0xffd27a, 18); const old = MS.tiles[MS.gap], t = tile(MS.word[MS.gap]); t.position.copy(old.position); t.scale.setScalar(0.001); MS.slab.remove(old); MS.slab.add(t); MS.tiles[MS.gap] = t; t.userData.tablet.setState('right'); c.tween(0.5, k => t.scale.setScalar(Math.max(0.001, 1.12 * c.over(k))));
            MS.tiles.forEach((tt, i) => { if (tt && tt.userData.tablet && i !== MS.gap) setTimeout(() => { if (c.alive()) tt.userData.tablet.setState('reveal'); }, 200 + i * 90); }); }); }
        else { ch.tab.userData.tablet.setState('wrong'); ch.flying = true; const b = ch.obj, at = ch.g.position.clone(); c.tween(0.5, k => { b.rotation.z = Math.sin(k * PI * 8) * 0.2; }, () => { c.shatterAt(at.clone(), 0xf0e4c8, 12); b.visible = false; for (let i = 0; i < 8; i++) { const s = c.sprite(0xe8dcc0, c.R(0.3, 0.6), at.x + c.R(-0.6, 0.6), at.y, at.z, null, 0.6); c.tween(1, k => { s.position.y = at.y - k * 0.6; s.material.opacity = 0.6 * (1 - k); }, () => scene.remove(s), i * 0.04); } });
          if (MS.slab) { const x0 = MS.slab.position.x; c.tween(0.5, k => { MS.slab.position.x = x0 + Math.sin(k * PI * 8) * 0.06 * (1 - k); }, () => { MS.slab.position.x = x0; }); } c.glowUp(r); }
        return ok ? 3.0 : 2.3; } }; },

    /* ---- The Locked Crypt: four skeleton keys float before the great door; the right key turns in the lock and the door swings open ---- */
    crypt(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 3.6, 15.5], look: [0, 3.2, -6.6], fov: 60 } : a < 1.5 ? { pos: [0, 3.0, 12.4], look: [0, 3.5, -6.6], fov: 50 } : { pos: [0, 2.8, 11.5], look: [0, 3.5, -6.6], fov: 46 },
      hostAt: () => new T.Vector3(-6.9, 0, -1.7),
      build() { const Z = -6.6, stoneM = c.M(0x5a5a52, { roughness: 0.9, map: c.wallTex('rock', '#5a5a52', '#46463f') }), wood = c.M(0x7a5234, { roughness: 0.6, emissive: 0x140a04, emissiveIntensity: 1 }), ir = c.M(0x4a4a50, { metalness: 0.8, roughness: 0.35 });
        for (const sd of [-1, 1]) c.box(1.3, 6.4, 1.4, stoneM, sd * 3.55, 3.2, Z);
        { const lan = new T.Group(); lan.position.set(0, 8.2, Z + 1.3); scene.add(lan); c.cyl(0.02, 0.02, 1.2, ir, 0, 0.6, 0, lan, 4); c.cyl(0.22, 0.28, 0.5, c.M(0xffe0a0, { emissive: 0xffb050, emissiveIntensity: 2.4 }), 0, -0.1, 0, lan, 8); c.cone(0.34, 0.3, ir, 0, 0.3, 0, lan, 8); c.sprite(0xffc870, 3, 0, -0.1, 0, lan, 0.5); const ll = new T.PointLight(0xffc870, 30, 14, 1.4); ll.position.y = -0.4; lan.add(ll); }
        { const sp = new T.SpotLight(0xffd8a0, 42, 30, 0.42, 0.6, 1.2); sp.position.set(0, 7.5, 3); sp.target.position.set(0, 3, Z); scene.add(sp); scene.add(sp.target); }   /* and a warm beam on the door itself: the goal must read at a glance */   /* a lantern over the door, so the door and its lock read */ const arch = new T.Mesh(new T.TorusGeometry(3.55, 0.68, 12, 36, PI), stoneM); arch.position.set(0, 6.4, Z); scene.add(arch);
        { const rf = c.M(0x3a3e38, { roughness: 1, map: c.wallTex('rock', '#3e423c', '#2c302a') }); for (const sd of [-1, 1]) c.box(4.4, 9.5, 1.4, rf, sd * 6.4, 4.75, Z - 0.8); c.box(8.4, 2.6, 1.4, rf, 0, 8.6, Z - 0.8); c.box(6.2, 6.8, 0.3, c.M(0x080604, { roughness: 1 }), 0, 3.4, Z - 2.8); for (const sd of [-1, 1]) c.box(0.3, 6.8, 2.6, c.M(0x14100c, { roughness: 1 }), sd * 3.05, 3.4, Z - 1.5); }   /* the door is set in a rock face, a dark passage behind it */
        const tym = new T.Mesh(new T.CircleGeometry(2.9, 32, 0, PI), c.M(0x46463f, { roughness: 1 })); tym.position.set(0, 6.4, Z - 0.1); scene.add(tym); const sk = new T.Mesh(skullGeo(T), vcMat(T)); sk.scale.setScalar(1.3); sk.position.set(0, 7.6, Z + 0.2); scene.add(sk); for (const sd of [-1, 1]) c.sprite(0x8aff5a, 0.9, sd * 0.25, 7.7, Z + 0.85, null, 0.7);
        const inside = c.sprite(0xffd890, 9, 0, 3.2, Z - 2.2, null, 0); MS.inside = inside; const light = new T.PointLight(0xffc870, 0, 16, 1.6); light.position.set(0, 3, Z + 1); scene.add(light); MS.light = light;
        MS.leaves = []; for (const sd of [-1, 1]) { const piv = new T.Group(); piv.position.set(sd * 2.9, 0, Z); scene.add(piv); const leaf = c.box(2.9, 6.3, 0.3, wood, -sd * 1.45, 3.15, 0, piv); for (const y of [1.1, 3.2, 5.3]) c.box(2.9, 0.22, 0.34, ir, -sd * 1.45, y, 0.02, piv); for (let i = 0; i < 6; i++) c.sph(0.07, ir, -sd * (0.4 + (i % 3) * 0.95), 1.1 + Math.floor(i / 3) * 4.2, 0.2, piv, 6); MS.leaves.push({ piv, sd }); }
        const plate = c.box(0.9, 1.3, 0.12, c.M(0xb88a3a, { metalness: 0.9, roughness: 0.3 }), 0, 2.7, Z + 0.22); c.sprite(0xffd890, 2.2, 0, 2.75, Z + 0.4, null, 0.3); const hole = new T.Group(); hole.position.set(0, 2.8, Z + 0.3); scene.add(hole); const hm = c.M(0x050505, { roughness: 1 }); c.sph(0.14, hm, 0, 0.1, 0, hole, 10).scale.z = 0.2; c.box(0.12, 0.3, 0.03, hm, 0, -0.08, 0, hole); MS.lockAt = new T.Vector3(0, 2.8, Z + 0.55); MS.open = 0;
        const path = new T.Mesh(new T.PlaneGeometry(4.6, 14), c.M(0x4a4a44, { roughness: 1, map: c.wallTex('brick', '#4a4a44', '#3a3a34') })); path.rotation.x = -PI / 2; path.position.set(0, 0.02, Z + 7); scene.add(path); },
      present(choices) { const n = choices.length, cols = [0xc8a04a, 0x9aa0a8, 0xb87a4a, 0xd8c070];
        if (MS.open) { MS.open = 0; c.tween(0.6, k => { const e = 1 - c.ease(k); for (const L of MS.leaves) L.piv.rotation.y = L.sd * -1.25 * e; MS.inside.material.opacity = 0.85 * e; MS.light.intensity = 40 * e; }); }
        const L = lay(c, 2.35); for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2; const g = new T.Group(); g.position.set(off * L.sp, 2.1, 1.6); g.scale.setScalar(L.k); const key = keyMesh(c, cols[j % 4]); key.scale.setScalar(0.95); g.add(key); c.sprite(0xffe6a0, 2.0, 0, 0.3, 0, g, 0.16);
          const tab = c.label(choices[j], j, 0.72); tab.position.set(0, -1.45, 0.1); c.faceCam(tab); g.add(tab);   /* the answer hangs under the key like a tag: the door and its lock stay in view */ const h = c.hitBox(2.0, 3.8, 1.2, j, -0.2); g.add(h);
          const ch = { j, g, tab, obj: key, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); c.updaters.push((dt, tm) => { if (ch.flying) return; key.rotation.y = Math.sin(tm * 0.9 + ch.k0) * 0.5; key.position.y = Math.sin(tm * 1.6 + ch.k0) * 0.1; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.flying = true; ch.gone = true; const key = ch.obj, to = MS.lockAt.clone();
        c.tween(0.25, k => { ch.tab.scale.setScalar(Math.max(0.001, ch.tab.userData.s0 * (1 - k))); }); key.rotation.set(0, 0, 0); key.position.set(0, 0, 0);
        c.tween(0.35, k => { key.rotation.x = PI / 2 * c.ease(k); });
        flyTo(c, ch.g, to, 0.8, 1.2, () => {
          if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; c.tween(0.45, k => { ch.g.rotation.z = -PI / 2 * c.ease(k); }, () => { c.burst(to, 0xffd27a, 14); MS.open = 1;
              c.tween(1.2, k => { const e = c.ease(k); for (const L of MS.leaves) L.piv.rotation.y = L.sd * -1.25 * e; MS.inside.material.opacity = 0.85 * e; MS.light.intensity = 40 * e; ch.g.position.z = to.z - e * 0.2; }, () => { for (let i = 0; i < 16; i++) { const s = c.sprite(0xffe6a0, c.R(0.2, 0.45), c.R(-2, 2), c.R(1, 5), MS.lockAt.z - 1, null, 0.9); c.tween(1.4, k => { s.position.z += 0.08; s.position.y += 0.01; s.material.opacity = 0.9 * (1 - k); }, () => scene.remove(s), i * 0.05); } setTimeout(() => { if (c.alive()) scene.remove(ch.g); }, 900); }); }); }
          else { ch.tab.userData.tablet.setState('wrong'); c.tween(0.6, k => { ch.g.rotation.z = Math.sin(k * PI * 10) * 0.25 * (1 - k); }, () => { for (let i = 0; i < 8; i++) { const s = c.sprite(0xffb050, c.R(0.1, 0.25), to.x, to.y, to.z, null, 0.9); const a = c.R(0, TAU); c.tween(0.5, k => { s.position.set(to.x + Math.cos(a) * k, to.y + Math.sin(a) * k, to.z + k * 0.3); s.material.opacity = 0.9 * (1 - k); }, () => scene.remove(s)); }
              const y0 = ch.g.position.y; c.tween(0.8, k => { ch.g.position.y = Math.max(0.3, y0 - k * k * 4); ch.g.position.z = to.z + k * 1.6; ch.g.rotation.x = k * 1.4; }, () => { c.tween(0.4, k => { ch.g.scale.setScalar(Math.max(0.001, 1 - k)); }, () => scene.remove(ch.g)); }); }); c.glowUp(r); } });
        return ok ? 3.6 : 2.8; } }; }
  };

  /* ================================================================== the map: four places in the Skull Catacombs */
  function landmarks(k) { const { T, plot, box, cyl, cone, stoneMat, stoneDark } = k; const G3 = KQRealms.G3;
    const bone = new T.MeshStandardMaterial({ color: 0xece2c8, roughness: 0.55 }), wood = new T.MeshStandardMaterial({ color: 0x4a2a1e, roughness: 0.6 }), gold = new T.MeshStandardMaterial({ color: 0xd8b04a, metalness: 1, roughness: 0.3 }), green = new T.MeshStandardMaterial({ color: 0x9aff6a, emissive: 0x5aff3a, emissiveIntensity: 2.2 }), ir = new T.MeshStandardMaterial({ color: 0x26262a, metalness: 0.8, roughness: 0.35 });
    const skull = (g, x, y, z, s, ry) => { const m = new T.Mesh(skullGeo(T), vcMat(T)); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.y = ry || 0; m.castShadow = true; g.add(m); return m; };
    /* The Coffin Vault: a mausoleum with a stepped roof, coffins leaning at its door, green lamps */
    plot('rg_coffins', -20, -12, g => { box(6.4, 0.5, 5.4, stoneDark, 0, 0.25, 0, g); box(5.4, 3.6, 4.4, stoneMat, 0, 2.3, 0, g); for (let i = 0; i < 3; i++) box(5.8 - i * 1.4, 0.5, 4.8 - i * 1.2, stoneDark, 0, 4.35 + i * 0.5, 0, g); for (const sd of [-1, 1]) cyl(0.3, 0.34, 3.6, stoneMat, sd * 1.9, 2.3, 2.4, g, 12); box(1.8, 2.6, 0.2, ir, 0, 1.8, 2.25, g); skull(g, 0, 5.9, 0.6, 1.4); skull(g, 0, 3.6, 2.4, 0.6);
      for (const [x, ry] of [[-3.4, 0.25], [3.5, -0.3]]) { const cf = new T.Mesh(coffinGeo(T), wood); cf.rotation.set(-1.25, ry, 0); cf.position.set(x, 1.7, 2.7); cf.castShadow = true; g.add(cf); }
      for (const sd of [-1, 1]) { cyl(0.08, 0.1, 2.6, ir, sd * 2.9, 1.3, 3.0, g, 6); const l = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), green); l.position.set(sd * 2.9, 2.75, 3.0); g.add(l); } }, { labelH: 7.6 });
    /* Riddle Graveyard: a great stone carved with a question mark, a ring of small stones, an iron fence */
    plot('rg_tombs', 22, -10, g => { const tg = tombGeo(T, 2.6, 2.4, 0.5), big = new T.Mesh(tg, stoneMat); big.position.set(0, 0, 0); big.castShadow = true; g.add(big);
      const qc = document.createElement('canvas'); qc.width = qc.height = 128; const x = qc.getContext('2d'); x.fillStyle = '#9aff6a'; x.font = '900 110px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 64, 70); const qt = new T.CanvasTexture(qc); const qm = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), new T.MeshStandardMaterial({ map: qt, transparent: true, emissive: 0x5aff3a, emissiveMap: qt, emissiveIntensity: 1.6 })); qm.position.set(0, 2.5, 0.31); g.add(qm);
      const sg = tombGeo(T, 1.0, 0.9, 0.22); for (let i = 0; i < 7; i++) { const a = PI * 0.12 + i / 6 * PI * 0.76; const t = new T.Mesh(sg, stoneDark); t.position.set(Math.cos(a) * 3.6, 0, -Math.sin(a) * 2.6 - 0.6); t.rotation.set(0.05 * (i % 3 - 1), (PI / 2 - a) * 0.5, 0.08 * (i % 2 ? 1 : -1)); t.castShadow = true; g.add(t); }
      for (let i = -9; i <= 9; i++) { const a = i / 9 * PI * 0.55; cyl(0.05, 0.05, 1.5, ir, Math.sin(a) * 5.2, 0.75, -Math.cos(a) * 3.4, g, 5); } }, { labelH: 6.6 });
    /* Bone Letters: an arch built of bones over a stone slab with carved letter tiles */
    plot('rg_bones', -20, 29, g => { box(5.2, 2.4, 0.6, stoneMat, 0, 1.6, 0, g); for (let i = 0; i < 3; i++) box(1.0, 1.1, 0.12, i === 1 ? green : stoneDark, (i - 1) * 1.3, 1.7, 0.34, g);
      const P = [], M = (x, y, z, rx, ry, rz, sx, sy, sz) => G3.M4(T, x, y, z, rx, ry, rz, sx, sy, sz); for (let i = 0; i <= 14; i++) { const a = i / 14 * PI, x = Math.cos(a) * 3.3, y = 2.8 + Math.sin(a) * 2.6; P.push({ g: new T.CapsuleGeometry(0.16, 0.6, 3, 8), m: M(x, y, 0, 0, 0, a, 1, 1, 1), c: 0xece2c8 }); } for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) P.push({ g: new T.CapsuleGeometry(0.18, 0.6, 3, 8), m: M(sd * 3.3, 0.45 + i * 0.7, 0, 0, 0, 0, 1, 1, 1), c: 0xe2d6ba });
      const arch = new T.Mesh(G3.merge(T, P), vcMat(T)); arch.castShadow = true; g.add(arch); skull(g, 0, 5.6, 0.1, 1.1); for (const sd of [-1, 1]) skull(g, sd * 3.3, 3.3, 0.2, 0.7, sd * -0.3); }, { labelH: 7 });
    /* The Locked Crypt: a door in a grassy barrow, a giant key turning slowly above it */
    plot('rg_keys', 28, 25, g => { const mound = new T.Mesh(new T.SphereGeometry(4.2, 24, 12, 0, TAU, 0, PI / 2), new T.MeshStandardMaterial({ color: 0x3a4a30, roughness: 1 })); mound.scale.set(1.2, 0.85, 1); g.add(mound); box(3.2, 3.6, 1.2, stoneMat, 0, 1.8, 3.4, g); box(2.2, 2.8, 0.2, wood, 0, 1.4, 4.05, g); box(3.6, 0.5, 1.4, stoneDark, 0, 3.8, 3.4, g); skull(g, 0, 4.4, 3.6, 0.8);
      const key = new T.Group(); key.position.set(0, 6.4, 1.2); g.add(key); const bowl = new T.Mesh(new T.TorusGeometry(0.8, 0.2, 10, 24), gold); bowl.position.y = 1.6; key.add(bowl); cyl(0.16, 0.16, 3, gold, 0, 0, 0, key, 10); box(0.9, 0.34, 0.2, gold, 0.45, -1.1, 0, key); box(0.6, 0.3, 0.2, gold, 0.3, -1.45, 0, key); k.fx((dt, tm) => { key.rotation.y = tm * 0.8; key.position.y = 6.4 + Math.sin(tm * 1.5) * 0.25; }); }, { labelH: 9.6 });
  }

  /* ================================================================== the catacombs themselves: a set piece on every free spot */
  function scenery(k) {
    const { T, scene, height, reserved, R32, fx } = k, K = KQRealms.kit(k), G3 = KQRealms.G3;
    const { R, M, VC, BOX, CYL, CYL6, SPH, ROCK, CONE, CONE4, put, putWorld, beam, bx, torch, halo } = K;
    const stoneV = VC({ roughness: 0.9 }), boneV = VC({ roughness: 0.55 }), greenG = K.glowMat(0x9aff6a, 0x5aff3a), amberG = K.glowMat(0xffc46a, 0xffa040);
    /* ---- the ruined chapel, its bell swinging in the tower (end of the west road) ---- */
    { const x0 = -36, z0 = 6, P = []; reserved.push([x0, z0, 7]);
      for (const [x, z, w, d, h] of [[0, -2.2, 6.4, 0.6, 4.2], [-3.0, 0.4, 0.6, 5.4, 3.6], [3.0, 0.9, 0.6, 4.2, 2.4]]) bx(P, x, h / 2, z, w, h, d, 0x6a6676);
      for (let i = 0; i < 5; i++) bx(P, -3.0, 3.6 + i * 0.1, 3.0 - i * 0.45, 0.6, 0.2, 0.4, 0x5a5666); bx(P, 0, 0.1, 0.4, 6.4, 0.2, 5.6, 0x4a4656);
      bx(P, -2.6, 3.1, -2.2, 2.2, 6.2, 2.2, 0x747080); for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) bx(P, -2.6 + dx, 7.3, -2.2 + dz, 0.4, 2.2, 0.4, 0x747080); bx(P, -2.6, 8.55, -2.2, 2.5, 0.3, 2.5, 0x6a6676); P.push({ g: CONE4, m: M(-2.6, 9.9, -2.2, 0, 0, 0, 3.1 / 0.707, 2.4, 3.1 / 0.707), c: 0x3a3448 });   /* an open belfry, so the bell shows */
      for (let i = 0; i < 7; i++) P.push({ g: ROCK, m: M(R(-4, 4), 0.2, R(2, 4), R(0, 3), R(0, 3), 0, R(0.6, 1.2)), c: 0x5a5666 });
      const ch = put(P, stoneV, x0, z0, 0.6, 0.2, 3.4); const bell = new T.Group(); bell.position.set(-2.6, 8.3, -2.2); ch.add(bell); const bm = new T.Mesh(new T.LatheGeometry([[0.01, -1.1], [0.62, -1.1], [0.55, -0.9], [0.42, -0.3], [0.3, 0.05], [0.01, 0.1]].map(p => new T.Vector2(p[0], p[1])), 18), new T.MeshStandardMaterial({ color: 0xb88a3a, metalness: 0.9, roughness: 0.3 })); bell.add(bm);
      const gl = halo(ch, 0x9aff6a, 3.2, 0, 1.5, 0.5, 0.35); fx((dt, tm) => { bell.rotation.z = Math.sin(tm * 1.6) * 0.35; gl.material.opacity = 0.28 + 0.08 * Math.sin(tm * 2); });
      torch(x0 + 3.6, z0 + 3.2, 0x9aff6a, 0x3a3440); torch(x0 - 3.8, z0 + 2.6, 0x9aff6a, 0x3a3440); }
    /* ---- a dragon's skeleton, half sunk in the earth, its skull resting on its claws (south end of the valley) ---- */
    { const x0 = -4, z0 = 38, P = []; reserved.push([x0 + 1, z0, 9.5]); const b = 0xe6dcc2, b2 = 0xd6caae;
      const spine = new T.CatmullRomCurve3([new T.Vector3(-6.5, -0.4, 0), new T.Vector3(-4, 1.8, 0.3), new T.Vector3(-1, 2.8, 0), new T.Vector3(2, 2.2, -0.4), new T.Vector3(4.5, 0.8, -0.2), new T.Vector3(7.2, -0.2, 0.6)]);
      for (let i = 0; i <= 26; i++) { const p = spine.getPointAt(i / 26), t = spine.getTangentAt(i / 26); P.push({ g: SPH, m: new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(new T.Vector3(1, 0, 0), t), new T.Vector3(0.62, 0.5, 0.5).multiplyScalar(1 - Math.abs(i / 26 - 0.4) * 0.9)), c: i % 2 ? b : b2 }); if (i % 2 === 0) P.push({ g: CONE, m: M(p.x, p.y + 0.35, p.z, 0, 0, 0, 0.16, 0.5, 0.16), c: b2 }); }
      for (let i = 0; i < 9; i++) { const u = 0.28 + i * 0.045, p = spine.getPointAt(u), r = 1.9 - Math.abs(i - 4) * 0.18; for (const sd of [-1, 1]) { const cv = new T.CatmullRomCurve3([p.clone(), new T.Vector3(p.x, p.y + 0.25, p.z + sd * r * 0.5), new T.Vector3(p.x + 0.1, p.y - r * 0.35, p.z + sd * r * 0.95), new T.Vector3(p.x + 0.25, p.y - r * 1.05, p.z + sd * r * 0.8)]); P.push({ g: new T.TubeGeometry(cv, 10, 0.09, 5, false), c: b }); } }
      const hd = new T.Vector3(8.4, 0.6, 1.4); P.push({ g: SPH, m: M(hd.x, hd.y + 0.5, hd.z, 0, 0.3, 0, 2.2, 1.3, 1.5), c: b }); P.push({ g: BOX, m: M(hd.x + 1.6, hd.y + 0.25, hd.z + 0.5, 0, 0.3, 0, 2.2, 0.6, 0.9), c: b2 }); P.push({ g: BOX, m: M(hd.x + 1.4, hd.y - 0.2, hd.z + 0.45, 0, 0.3, -0.12, 2.0, 0.26, 0.8), c: b2 });
      for (const sd of [-1, 1]) { P.push({ g: SPH, m: M(hd.x + 0.4, hd.y + 0.8, hd.z + sd * 0.55, 0, 0, 0, 0.5, 0.4, 0.3), c: 0x1a1410 }); P.push({ g: CONE, m: M(hd.x - 0.5, hd.y + 1.5, hd.z + sd * 0.5, 0, 0, 0.9, 0.3, 1.6, 0.3), c: b2 }); }
      for (let i = 0; i < 6; i++) P.push({ g: CONE, m: M(hd.x + 0.9 + i * 0.3, hd.y + 0.02, hd.z + 0.9, PI, 0, 0, 0.1, 0.34, 0.1), c: 0xfaf4e6 });
      for (const [lx, lz] of [[-2.5, 1.6], [3.4, 1.8], [-2.2, -1.6]]) for (let f = 0; f < 3; f++) P.push({ g: CONE, m: M(lx + f * 0.35, 0.1, lz + (lz > 0 ? 0.4 : -0.4), (lz > 0 ? 1 : -1) * 1.2, 0, 0, 0.12, 0.8, 0.12), c: b });
      const dr = put(P, boneV, x0, z0, 0.35, 0.5, 5); for (const sd of [-1, 1]) halo(dr, 0x9aff6a, 0.9, hd.x + 0.5, hd.y + 0.8, hd.z + sd * 0.6, 0.8);
      torch(x0 - 7, z0 + 3, 0x9aff6a, 0x3a3440); torch(x0 + 8, z0 - 3.5, 0x9aff6a, 0x3a3440); }
    /* ---- the potion-maker's hut: crooked walls, a pointed roof, a green cauldron bubbling at the door (east road) ---- */
    { const x0 = 36, z0 = 9, P = []; reserved.push([x0, z0, 7]);
      bx(P, 0, 1.6, -1, 4.2, 3.2, 3.6, 0x5a4a3a); P.push({ g: CONE, m: M(0.2, 4.6, -1, 0, 0, 0.12, 6.0, 3.4, 5.2), c: 0x3a2a3a }); P.push({ g: CONE, m: M(0.55, 6.9, -1, 0, 0, 0.4, 1.2, 1.6, 1.2), c: 0x3a2a3a });
      bx(P, -0.8, 1.1, 0.82, 1.0, 2.2, 0.1, 0x2a1a12); bx(P, 1.6, 4.2, -0.2, 0.7, 1.6, 0.7, 0x4a4040);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; P.push({ g: ROCK, m: M(2.4 + Math.cos(a) * 1.0, 0.15, 2.4 + Math.sin(a) * 1.0, R(0, 3), R(0, 3), 0, 0.5), c: 0x4a4656 }); }
      const hut = put(P, VC({ roughness: 0.85 }), x0, z0, -0.5, 0.2, 3);
      const pot = new T.Mesh(new T.SphereGeometry(0.9, 18, 12, 0, TAU, PI * 0.28, PI * 0.72), new T.MeshStandardMaterial({ color: 0x1e1e22, metalness: 0.6, roughness: 0.4, side: T.DoubleSide })); pot.position.set(2.4, 0.95, 2.4); hut.add(pot); const brew = new T.Mesh(new T.CircleGeometry(0.68, 24), K.glowMat(0x9aff6a, 0x5aff3a, 1.8)); brew.rotation.x = -PI / 2; brew.position.set(2.4, 1.52, 2.4); hut.add(brew);
      for (const w of [[-1.2, 2.2, 0.82], [1.2, 2.2, 0.82]]) { const win = new T.Mesh(new T.BoxGeometry(0.6, 0.7, 0.06), amberG); win.position.set(w[0], w[1], w[2]); hut.add(win); }
      const bub = []; for (let i = 0; i < 7; i++) { const s = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), K.glowMat(0xbfff9a, 0x7aff5a, 1.6)); s.userData.k = R(0, 6); hut.add(s); bub.push(s); } halo(hut, 0x7aff5a, 4.4, 2.4, 2.0, 2.4, 0.4); const pl = new T.PointLight(0x7aff5a, 26, 14, 1.8); pl.position.set(2.4, 2.4, 2.4); hut.add(pl);
      fx((dt, tm) => { for (const s of bub) { const t = (tm * 0.6 + s.userData.k) % 1; s.position.set(2.4 + Math.sin(s.userData.k * 3) * 0.4, 1.5 + t * 1.8, 2.4 + Math.cos(s.userData.k * 3) * 0.4); s.scale.setScalar(1 - t * 0.7); } pl.intensity = 22 + 6 * Math.sin(tm * 5); });
      torch(x0 - 5, z0 + 4, 0x9aff6a, 0x3a3440); }
    /* ---- the lantern tree: a crooked giant hung with glowing pumpkin lanterns (north-west road) ---- */
    { const x0 = -32, z0 = -14; reserved.push([x0, z0, 6]); const bark = new T.MeshStandardMaterial({ color: 0x2e2622, roughness: 1 }), tree = new T.Group(); tree.position.set(x0, height(x0, z0) - 0.2, z0); scene.add(tree); const tips = [];
      const limb = (from, dir, len, r, depth) => { const to = from.clone().add(dir.clone().multiplyScalar(len)); const m = new T.Mesh(new T.CylinderGeometry(r * 0.62, r, len, 7), bark); m.position.copy(from).add(to).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize()); m.castShadow = true; tree.add(m); if (depth > 0) for (let i = 0; i < 2; i++) { const d = dir.clone().add(new T.Vector3(R(-1, 1), R(-0.1, 0.4), R(-1, 1))).normalize(); limb(to, d, len * 0.66, r * 0.6, depth - 1); } else tips.push(to); };
      limb(new T.Vector3(0, 0, 0), new T.Vector3(0.1, 1, 0).normalize(), 5.2, 0.8, 4);
      const pm = new T.MeshStandardMaterial({ color: 0xff8a1a, emissive: 0xff6a0a, emissiveIntensity: 0.9, roughness: 0.6 }); tips.forEach((p, i) => { if (i % 2) return; const lan = new T.Group(); lan.position.copy(p).add(new T.Vector3(0, -0.9, 0)); tree.add(lan); const rope = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.9, 4), bark); rope.position.y = 0.45; lan.add(rope); const pu = new T.Mesh(new T.SphereGeometry(0.34, 12, 8), pm); pu.scale.y = 0.8; lan.add(pu); halo(lan, 0xffa040, 1.4, 0, 0, 0, 0.5); lan.userData.k = i; });
      fx((dt, tm) => { tree.children.forEach(o => { if (o.userData.k != null) o.rotation.z = Math.sin(tm * 1.3 + o.userData.k) * 0.12; }); });
      for (let i = 0; i < 5; i++) { const pu = new T.Mesh(new T.SphereGeometry(R(0.4, 0.6), 12, 8), pm); pu.scale.y = 0.75; const a = R(0, TAU), r = R(2, 3.5); pu.position.set(x0 + Math.cos(a) * r, height(x0 + Math.cos(a) * r, z0 + Math.sin(a) * r) + 0.3, z0 + Math.sin(a) * r); scene.add(pu); } }
    /* ---- the circle of standing stones with a green orb floating at its heart (end of the castle road) ---- */
    { const x0 = 6, z0 = 20, P = []; reserved.push([x0, z0, 5]); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; P.push({ g: BOX, m: M(Math.cos(a) * 3.2, 1.5, Math.sin(a) * 3.2, R(-0.06, 0.06), -a, R(-0.06, 0.06), 0.9, 3.4 + R(-0.4, 0.8), 0.5), c: [0x6a6676, 0x5a5666, 0x747080][i % 3] }); }
      P.push({ g: CYL, m: M(0, 0.35, 0, 0, 0, 0, 1.8, 0.7, 1.8), c: 0x4a4656 }); const ring = put(P, stoneV, x0, z0, 0.3, 0.3, 3.2);
      const orb = new T.Mesh(new T.SphereGeometry(0.55, 20, 14), K.glowMat(0xc8ffb0, 0x7aff5a, 2.4)); ring.add(orb); const oh = halo(ring, 0x7aff5a, 3.6, 0, 2.4, 0, 0.55); const pl = new T.PointLight(0x7aff5a, 20, 14, 1.8); ring.add(pl);
      fx((dt, tm) => { const y = 2.4 + Math.sin(tm * 1.4) * 0.3; orb.position.y = y; oh.position.y = y; pl.position.y = y; oh.material.opacity = 0.45 + 0.12 * Math.sin(tm * 3); }); }
    /* ---- the pumpkin patch behind a crooked iron gate (south-east) ---- */
    { const x0 = 17, z0 = 33, P = []; reserved.push([x0, z0, 6]); for (let i = -6; i <= 6; i++) { if (Math.abs(i) < 1) continue; beam(P, [i * 0.55, -0.2, -3], [i * 0.55 + R(-0.1, 0.1), 1.9, -3], 0.04, 0x1e1c22); P.push({ g: CONE, m: M(i * 0.55, 2.0, -3, 0, 0, 0, 0.12, 0.26, 0.12), c: 0x1e1c22 }); }
      for (const y of [0.4, 1.6]) bx(P, 0, y, -3, 7.2, 0.06, 0.06, 0x1e1c22); for (const sd of [-1, 1]) bx(P, sd * 0.55, 1.2, -3, 0.1, 2.6, 0.1, 0x2a2830);
      for (let i = 0; i < 18; i++) P.push({ g: new T.TorusGeometry(R(0.3, 0.8), 0.04, 4, 10, PI), m: M(R(-3, 3), 0.1, R(-2, 2.5), -PI / 2 + R(-0.3, 0.3), R(0, 3), 0), c: 0x2e5a22 });
      put(P, VC({ metalness: 0.3, roughness: 0.6 }), x0, z0, 0.2, 0.1, 3.5);
      const pm = new T.MeshStandardMaterial({ color: 0xff8a1a, roughness: 0.55 }), face = new T.MeshStandardMaterial({ color: 0xffd060, emissive: 0xffa020, emissiveIntensity: 2.4 });
      for (let i = 0; i < 9; i++) { const x = x0 + R(-3, 3), z = z0 + R(-1.8, 2.6), s = R(0.45, 0.8), g = new T.Group(); g.position.set(x, height(x, z) + s * 0.55, z); g.rotation.y = R(-0.6, 0.6) + 0.2; g.scale.setScalar(s); scene.add(g);
        const pu = new T.Mesh(new T.SphereGeometry(1, 16, 10), pm); pu.scale.y = 0.78; g.add(pu); const st = new T.Mesh(new T.CylinderGeometry(0.08, 0.12, 0.4, 6), new T.MeshStandardMaterial({ color: 0x4a6a2a })); st.position.y = 0.9; g.add(st);
        if (i % 2 === 0) { for (const sd of [-1, 1]) { const e = new T.Mesh(new T.ConeGeometry(0.18, 0.26, 3), face); e.position.set(sd * 0.36, 0.2, 0.9); e.rotation.x = PI / 2; g.add(e); } const mo = new T.Mesh(new T.BoxGeometry(0.7, 0.14, 0.1), face); mo.position.set(0, -0.2, 0.92); g.add(mo); halo(g, 0xffa040, 2.4, 0, 0, 1.0, 0.35); } }
      torch(x0 + 4, z0 - 2.6, 0xffa040, 0x3a3440); }
    K.finish(VC());
  }

  /* ================================================================== the words */
  const S = {
    en: {
      rg_coffins: 'The Coffin Vault', rg_coffins_b: 'Open the coffin with the right number.', rg_coffins_hi: 'Welcome to the vault. Every coffin has a number on its lid.', rg_coffins_how: 'Work out the sum, then open the coffin with the answer. Its skeleton will wave hello.', rg_coffins_q: 'Which coffin opens?',
      rg_tombs: 'Riddle Graveyard', rg_tombs_b: 'The stones know the answers.', rg_tombs_hi: 'The old stones love riddles. Each one holds a word.', rg_tombs_how: 'Read the riddle, then pick the stone with the right word. A friendly ghost will rise.', rg_tombs_q: 'A riddle from the stones:',
      rg_bones: 'Bone Letters', rg_bones_b: 'Fill the gap in the crypt wall.', rg_bones_hi: 'A word is carved in the crypt wall, but one letter has fallen out.', rg_bones_how: 'Look at the picture and the word, then pick the bone with the missing letter.', rg_bones_q: 'Which letter is missing?',
      rg_keys: 'The Locked Crypt', rg_keys_b: 'Four keys. One lock.', rg_keys_hi: 'Four skeleton keys, and only one opens the great door.', rg_keys_how: 'Solve the puzzle, then pick the key with the answer. It turns in the lock.', rg_keys_q: 'Which key opens the door?'
    },
    he: {
      rg_coffins: 'כספת הארונות', rg_coffins_b: 'פותחים את הארון עם המספר הנכון.', rg_coffins_hi: 'ברוכים הבאים לכספת. על המכסה של כל ארון כתוב מספר.', rg_coffins_how: 'פותרים את התרגיל, ופותחים את הארון עם התשובה. השלד שבתוכו ינופף לשלום.', rg_coffins_q: 'איזה ארון נפתח?',
      rg_tombs: 'בית הקברות של החידות', rg_tombs_b: 'המצבות יודעות את התשובות.', rg_tombs_hi: 'המצבות העתיקות אוהבות חידות. על כל אחת חקוקה מילה.', rg_tombs_how: 'קוראים את החידה, ובוחרים את המצבה עם המילה הנכונה. רוח רפאים חביבה תעלה ממנה.', rg_tombs_q: 'חידה מהמצבות:',
      rg_bones: 'אותיות העצמות', rg_bones_b: 'משלימים את החור בקיר הקריפטה.', rg_bones_hi: 'על קיר הקריפטה חקוקה מילה, אבל אות אחת נפלה ממנה.', rg_bones_how: 'מסתכלים בתמונה ובמילה, ובוחרים את העצם עם האות החסרה.', rg_bones_q: 'איזו אות חסרה?',
      rg_keys: 'הקריפטה הנעולה', rg_keys_b: 'ארבעה מפתחות. מנעול אחד.', rg_keys_hi: 'ארבעה מפתחות עתיקים, ורק אחד פותח את הדלת הגדולה.', rg_keys_how: 'פותרים את החידה, ובוחרים את המפתח עם התשובה. הוא יסתובב במנעול.', rg_keys_q: 'איזה מפתח פותח את הדלת?'
    }
  };

  KQRealms.define('skull', {
    games: [
      { id: 'rg_coffins', kind: 'math', stage: 'coffins', theme: 'skull_vault', host: 'ruins', icon: 'coffin' },
      { id: 'rg_tombs', kind: 'reading', stage: 'tombs', theme: 'skull_graveyard', host: 'owl', icon: 'tombstone' },
      { id: 'rg_bones', kind: 'spelling', stage: 'bones', theme: 'skull_crypt', host: 'scarecrow', icon: 'bone' },
      { id: 'rg_keys', kind: 'logic', stage: 'crypt', theme: 'skull_gate', host: 'troll', icon: 'oldkey' }
    ],
    strings: S, themes: THEMES, stages: STAGES, landmarks, scenery,
    gens: { rg_coffins: coffinQ, rg_tombs: tombQ, rg_bones: boneQ, rg_keys: keyQ }
  });
})();
