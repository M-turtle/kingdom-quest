/* Kingdom Quest — THE SPORTS KINGDOM (Yoni 2026-09-26: "a sports world … showing all the games and major sports like soccer,
   basketball, baseball, football, volleyball, tennis"). One game per sport, each in its own arena with that sport's own move;
   a right answer scores, a wrong one misses (registered with KQRealms, played in rooms3d.js halls):
     The Penalty Spot   soccer      (logic)     four balls on the spot: the right one curls into the net past the keeper
     The Hoop           basketball  (math)      four balls at the line: the right one swishes, a wrong one rims out
     The Home Run       baseball    (reading)   four balls on tees: the bat sends the right one over the fence
     The Goalposts      football    (math)      four balls on tees: the right kick sails between the uprights
     The Beach Net      volleyball  (spelling)  four balls over the net: the right one is spiked into the sand
     Center Court       tennis      (reading)   four balls tossed at the baseline: the right serve is an ace
   Facts about every sport (team sizes, which ball is which, how points are scored) run through the questions. Open to every
   player — never labelled by gender; Hebrew stays gender-neutral. Everything is built here from primitives; the balls are
   painted on canvas by the same painter that drew their icons. */
(function () {
  'use strict';
  if (!window.KQRealms) return;
  const PI = Math.PI, TAU = PI * 2;
  const one = v => String(Math.round(v * 100) / 100);
  const four = (H, a, others) => H.shuffle([a].concat(H.shuffle(H.uniq(others.map(String).filter(o => o !== String(a)))).slice(0, 3)));
  /* a Hebrew past-tense verb agrees with the character it describes: p = [name, 'm' | 'f'] */
  const g3 = (p, m, f) => p[1] === 'f' ? f : m;
  /* a two-word answer (tennis ball) is misspelled in its longest word only — never across the space */
  const miss = (H, w, he, n) => { const ps = w.split(' '); if (ps.length < 2) return H.misspell(w, he, n); let k = 0; ps.forEach((p, i) => { if (p.length > ps[k].length) k = i; }); return H.uniq(H.misspell(ps[k], he, n + 2).map(m => ps.map((p, i) => i === k ? m : p).join(' '))).slice(0, n); };

  /* ================================================================== the questions */
  /* ---- The Penalty Spot (soccer · logic): patterns, which ball, who won, team sizes, league points, who scored when, cups, chances ---- */
  const KIT = { en: ['ball', 'boot', 'cup', 'flag', 'whistle', 'medal'], he: ['כדור', 'נעל', 'גביע', 'דגל', 'משרוקית', 'מדליה'] };
  const BALLQ = {
    en: [['Which ball do you kick into a net, past the goalkeeper?', 'soccer ball'], ['Which ball do you throw through a hoop?', 'basketball'], ['Which small fuzzy ball is hit with a racket?', 'tennis ball'], ['Which ball is hit with a long wooden bat?', 'baseball'], ['Which ball is shaped like an egg with pointed ends?', 'American football'], ['Which ball is hit over a high net with your hands?', 'volleyball']],
    he: [['באיזה כדור בועטים אל השער, מול השוער?', 'כדורגל'], ['איזה כדור זורקים לתוך הסל?', 'כדורסל'], ['איזה כדור קטן ופרוותי חובטים בו עם מחבט?', 'כדור טניס'], ['איזה כדור חובטים בו עם מחבט עץ ארוך?', 'בייסבול'], ['לאיזה כדור יש צורה של ביצה עם קצוות מחודדים?', 'פוטבול'], ['איזה כדור מעבירים מעל רשת גבוהה בידיים?', 'כדורעף']]
  };
  const TEAM = { en: [['soccer', 11], ['basketball', 5], ['volleyball', 6], ['baseball', 9], ['American football', 11]], he: [['כדורגל', 11], ['כדורסל', 5], ['כדורעף', 6], ['בייסבול', 9], ['פוטבול', 11]] };
  const CLUBS = { en: ['the Lions', 'the Tigers', 'the Bears', 'the Eagles'], he: ['האריות', 'הנמרים', 'הדובים', 'הנשרים'] };
  const lamed = s => 'ל' + s.replace(/^ה/, '');   /* ל + האריות = לאריות */
  const PLAYERS = { en: [['Ana', 'Ben', 'Dan'], ['Mia', 'Leo', 'Sam'], ['Noa', 'Tom', 'Ella']], he: [['אנה', 'בן', 'דן'], ['מיה', 'לאו', 'סאם'], ['נועה', 'תום', 'אלה']] };
  function goalQ(band, lang, H) {
    const { ri, pick, shuffle, near } = H, he = lang === 'he', L = he ? 'he' : 'en', k = Math.random(), NEXT = he ? 'מה בא אחר כך?' : 'What comes next?';
    if (band <= 1) {
      if (k < 0.5) { const [a, b, c, d] = shuffle(KIT[L]), seq = k < 0.25 ? [a, b, a, b, a, b] : [a, b, b, a, b, b, a]; return { q: `${NEXT} ${seq.join(', ')}, ?`, a: seq.length === 6 ? a : b, ch: shuffle([a, b, c, d]) }; }
      const it = pick(BALLQ[L]); return { q: it[0], a: it[1], ch: shuffle([it[1]].concat(shuffle(BALLQ[L].filter(x => x !== it)).slice(0, 3).map(x => x[1]))) }; }
    if (band === 2) {
      if (k < 0.4) { const r = ri(2, 6); let b = ri(2, 6); if (Math.random() < 0.2) b = r; const win = r > b ? (he ? 'האדומים' : 'the Reds') : r < b ? (he ? 'הכחולים' : 'the Blues') : (he ? 'תיקו' : 'a draw');
        return { q: he ? `האדומים הבקיעו ${r} שערים, והכחולים ${b}. מי ניצחו?` : `The Reds scored ${r} goals and the Blues scored ${b}. Who won?`, a: win, ch: shuffle(he ? ['האדומים', 'הכחולים', 'תיקו', 'אף אחד לא שיחק'] : ['the Reds', 'the Blues', 'a draw', 'nobody played']) }; }
      if (k < 0.72) { const st = pick([2, 5, 10]), s0 = st * ri(1, 3), seq = [0, 1, 2, 3].map(i => s0 + i * st); return { q: he ? `מספרי החולצות של השחקנים: ${seq.join(', ')}… ${NEXT}` : `The players' shirt numbers go ${seq.join(', ')}… ${NEXT}`, a: s0 + 4 * st, ch: near(s0 + 4 * st, 4, st) }; }
      const it = pick(TEAM[L]); return { q: he ? `כמה שחקנים מקבוצת ${it[0]} אחת משחקים על המגרש בבת אחת?` : `How many players from one ${it[0]} team play at the same time?`, a: it[1], ch: four(H, it[1], [5, 6, 9, 11, 7, 10]) }; }
    if (band === 3) {
      if (k < 0.5) { const w = ri(2, 6), d = ri(2, 4), c = pick(CLUBS[L]); return { q: he ? `ניצחון שווה 3 נקודות, תיקו נקודה אחת והפסד אפס. ${c} ניצחו ב-${w} משחקים וסיימו ${d} משחקים בתיקו. כמה נקודות יש להם?` : `A win is worth 3 points, a draw 1 and a loss 0. ${c[0].toUpperCase() + c.slice(1)} won ${w} games and drew ${d}. How many points do they have?`, a: 3 * w + d, ch: four(H, 3 * w + d, [w + d, 3 * (w + d), 3 * w, 3 * w + d + 1, 2 * w + d]) }; }
      const cs = shuffle(CLUBS[L]).slice(0, 3), pts = shuffle([ri(3, 8), ri(9, 14), ri(15, 21)]), first = Math.random() < 0.6, idx = pts.indexOf(first ? Math.max(...pts) : Math.min(...pts));
      return { q: he ? `בטבלה: ${lamed(cs[0])} יש ${pts[0]} נקודות, ${lamed(cs[1])} ${pts[1]}, ו${lamed(cs[2])} ${pts[2]}. מי ${first ? 'במקום הראשון' : 'במקום האחרון'}?` : `In the table ${cs[0]} have ${pts[0]} points, ${cs[1]} ${pts[1]} and ${cs[2]} ${pts[2]}. Who is ${first ? 'top' : 'bottom'} of the table?`, a: cs[idx], ch: shuffle(cs.concat([he ? 'כולן שוות' : 'they are level'])) }; }
    if (band === 4) {
      if (k < 0.5) { const P = shuffle(pick(PLAYERS[L])), T = ["10'", "30'", "80'"], askLast = Math.random() < 0.5;   /* P[0] first, P[2] after P[1]: P0 10', P1 30', P2 80' */
        return { q: he ? `שלושת השערים במשחק הובקעו בדקות 10, 30 ו-80 — אחד של ${P[0]}, אחד של ${P[1]} ואחד של ${P[2]}. השער של ${P[0]} היה הראשון. השער של ${P[2]} בא אחרי השער של ${P[1]}. באיזו דקה הובקע השער של ${askLast ? P[2] : P[1]}?` : `The three goals in the match came in minutes 10, 30 and 80 — one by ${P[0]}, one by ${P[1]} and one by ${P[2]}. ${P[0]}'s goal was the first. ${P[2]}'s goal came after ${P[1]}'s. In which minute did ${askLast ? P[2] : P[1]} score?`, a: askLast ? T[2] : T[1], ch: shuffle(T.concat(["90'"])) }; }
      const n = pick([4, 8, 16, 32]); return { q: he ? `${n} קבוצות משחקות בטורניר נוקאאוט: קבוצה שמפסידה — יוצאת. כמה משחקים יהיו עד שתיקבע האלופה?` : `${n} teams play a knockout cup: whoever loses a match is out. How many matches until there is a champion?`, a: n - 1, ch: four(H, n - 1, [n, n / 2, n * 2, n - 2, n + 1]) }; }
    if (band === 5) {
      if (k < 0.5) { const n = ri(4, 8), m = n * (n - 1) / 2; return { q: he ? `בליגה ${n} קבוצות, וכל קבוצה משחקת פעם אחת נגד כל קבוצה אחרת. כמה משחקים יש בליגה?` : `In a league of ${n} teams, every team plays every other team once. How many matches are there?`, a: m, ch: four(H, m, [n * (n - 1), n * n, 2 * n, m + n, m - 1]) }; }
      const s = ri(8, 25), c = ri(8, 25); return { q: he ? `הקבוצה הבקיעה ${s} שערים וספגה ${c}. מה הפרש השערים? (הבקעות מינוס ספיגות — אם ספגו יותר, יוצא מספר שלילי)` : `The team scored ${s} goals and let in ${c}. What is the goal difference (scored minus let in — below zero if they let in more)?`, a: s - c, ch: four(H, s - c, [c - s, s + c, s - c + 2, s - c - 2]) }; }
    if (k < 0.3) { const it = pick([['coin', '1/2', ['1/3', '1/4', '1', '2/3']], ['die', '1/6', ['1/2', '1/3', '1/5', '5/6']], ['spin', '1/8', ['1/4', '1/6', '7/8', '1/2']], ['hat', '3/10', ['1/10', '3/7', '7/10', '1/3']]]), Q = he ? { coin: 'מטילים מטבע כדי לבחור מי פותחת את המשחק. מה הסיכוי שייצא עץ?', die: 'שש קבוצות מגרילות בקובייה מי משחקת ראשונה. מה הסיכוי שהקבוצה שלכם תוגרל?', spin: 'על גלגל מזל יש 8 חלקים שווים, ורק באחד מהם כתוב "פנדל". מה הסיכוי לעצור על "פנדל"?', hat: 'בכובע יש 10 פתקים, ועל 3 מהם כתוב "שוער". מה הסיכוי לשלוף פתק של שוער?' } : { coin: 'A coin is tossed to choose who kicks off. What is the chance of heads?', die: 'Six teams roll a die to see who plays first. What is the chance your team is rolled?', spin: 'A spinner has 8 equal parts and only one says "penalty". What is the chance of landing on "penalty"?', hat: 'A hat holds 10 notes and 3 of them say "keeper". What is the chance of pulling a keeper note?' };
      return { q: Q[it[0]], a: it[1], ch: four(H, it[1], it[2]) }; }
    if (k < 0.6) { const it = pick([[3, '1/3', ['1/2', '2/3', '1/4', '3/4']], [2, '1/2', ['1/3', '1/4', '2/3', '1/6']], [4, '1/4', ['1/2', '1/3', '3/4', '1/8']]]);
      const PL = he ? { 3: 'לשמאל, לאמצע או לימין', 2: 'לימין או לשמאל', 4: 'לאחת מארבע פינות השער' } : { 3: 'left, middle or right', 2: 'left or right', 4: 'one of the four corners of the goal' }, TG = he ? { 3: 'לאמצע', 2: 'לימין', 4: 'לפינה העליונה הימנית' } : { 3: 'the middle', 2: 'the right', 4: 'the top right corner' };
      return { q: he ? `בפנדל, הכדור נבעט באקראי ${PL[it[0]]}. מה הסיכוי שהוא ייבעט ${TG[it[0]]}?` : `In a penalty the ball is kicked at random to ${PL[it[0]]}. What is the chance it goes to ${TG[it[0]]}?`, a: it[1], ch: four(H, it[1], it[2]) }; }
    const n = ri(4, 8), p = n * (n - 1) * (n - 2); return { q: he ? `${n} רצים בגמר. בכמה דרכים אפשר לחלק מדליית זהב, מדליית כסף ומדליית ארד?` : `${n} runners are in the final. In how many ways can the gold, silver and bronze medals be given out?`, a: p, ch: four(H, p, [3 * n, n * n * n, p / 6, n * (n - 1), p + n]) };
  }

  /* ---- The Hoop (basketball · math): baskets to count, 1-2-3 points, totals and averages, shooting percent, a comeback, two unknowns ---- */
  const HOOPERS = { en: [['Ella', 'f'], ['Dan', 'm'], ['Noa', 'f'], ['Tom', 'm']], he: [['אלה', 'f'], ['דן', 'm'], ['נועה', 'f'], ['תום', 'm']] };
  function hoopQ(band, lang, H) {
    const { ri, pick, near } = H, he = lang === 'he', k = Math.random(), P = pick(HOOPERS[he ? 'he' : 'en']), N = P[0], SC = he ? g3(P, 'קלע', 'קלעה') : 'scored';
    const mk = (q, a, step) => ({ q, a, ch: near(a, 4, step || 1) });
    if (band <= 1) { if (k < 0.6) { const a = ri(2, 5), b = ri(2, 4); return mk(he ? `${N} ${SC} ${a} סלים, ואז עוד ${b}. כמה סלים בסך הכול?` : `${N} scored ${a} baskets, then ${b} more. How many baskets in all?`, a + b); }
      const t = ri(5, 9), g = ri(2, t - 2); return mk(he ? `בעגלה יש ${t} כדורים. ${g} כדורים התגלגלו החוצה. כמה כדורים נשארו בעגלה?` : `There are ${t} balls in the cart. ${g} roll away. How many are left?`, t - g); }
    if (band === 2) { if (k < 0.5) { const n = ri(2, 9); return mk(he ? `כל סל שווה 2 נקודות. כמה נקודות שווים ${n} סלים?` : `Each basket is worth 2 points. How many points are ${n} baskets worth?`, 2 * n, 2); }
      const a = ri(10, 40), b = ri(2, 15); return mk(he ? `לקבוצה היו ${a} נקודות, והיא קלעה עוד ${b}. כמה נקודות יש לה עכשיו?` : `The team had ${a} points and scored ${b} more. How many points now?`, a + b); }
    if (band === 3) { if (k < 0.6) { const a = ri(2, 6), b = ri(2, 4); return mk(he ? `הקבוצה קלעה ${a} סלים של 2 נקודות ו-${b} סלים של 3 נקודות. כמה נקודות בסך הכול?` : `The team made ${a} two-point baskets and ${b} three-pointers. How many points in all?`, 2 * a + 3 * b); }
      const a = ri(2, 6), f = ri(2, 6); return mk(he ? `זריקת עונשין שווה נקודה אחת. ${a} סלים של 2 נקודות ועוד ${f} זריקות עונשין — כמה נקודות?` : `A free throw is worth 1 point. ${a} two-point baskets and ${f} free throws — how many points?`, 2 * a + f); }
    if (band === 4) { const avg = ri(10, 25), d1 = ri(1, 6), d2 = ri(1, 6), s = [avg - d1, avg + d1 + d2, avg - d2];
      if (k < 0.5) return mk(he ? `${N} ${SC} ${s[0]}, ${s[1]} ו-${s[2]} נקודות בשלושה משחקים. כמה נקודות בסך הכול?` : `${N} scored ${s[0]}, ${s[1]} and ${s[2]} points in three games. How many points in all?`, s[0] + s[1] + s[2], 3);
      return { q: he ? `${N} ${SC} ${s[0]}, ${s[1]} ו-${s[2]} נקודות בשלושה משחקים. כמה נקודות בממוצע למשחק?` : `${N} scored ${s[0]}, ${s[1]} and ${s[2]} points in three games. What is the average per game?`, a: avg, ch: four(H, avg, [avg + 1, avg - 1, avg * 3, avg + 3, Math.max(...s)]) }; }
    if (band === 5) { if (k < 0.55) { const n = pick([10, 20, 25, 50]), m = ri(Math.ceil(n * 0.4), n - 1), pc = Math.round(m * 100 / n);
        return { q: he ? `${N} ${SC} ${m} מתוך ${n} זריקות עונשין. כמה אחוזים זה?` : `${N} made ${m} of ${n} free throws. What percent is that?`, a: pc + '%', ch: four(H, pc + '%', [(pc > 90 ? pc - 5 : pc + 10) + '%', (pc - 10) + '%', m + '%', (100 - pc) + '%', (pc + 5) + '%']) }; }
      const d = ri(3, 12), s = d + ri(2, 12); return { q: he ? `הקבוצה מפגרת ב-${d} נקודות. עכשיו היא קולעת ${s} נקודות ברצף. בכמה נקודות היא מובילה עכשיו?` : `The team is ${d} points behind. Now they score ${s} points in a row. By how many points do they lead now?`, a: s - d, ch: four(H, s - d, [s + d, s, d, s - d + 2, s - d + 1]) }; }
    const B = ri(4, 9), y = ri(1, B - 1), Pp = 2 * B + y; return { q: he ? `הקבוצה קלעה ${B} סלים, רק של 2 או של 3 נקודות, ובסך הכול ${Pp} נקודות. כמה מהסלים היו של 3 נקודות?` : `The team made ${B} baskets, only 2- and 3-pointers, for ${Pp} points in all. How many were three-pointers?`, a: y, ch: four(H, y, [B - y, y + 1, Math.max(0, y - 1), y + 2, Math.round(Pp / 3)]) };
  }

  /* ---- The Home Run (baseball · reading): the word for the picture, a sentence, short stories (who/what/where, then why/how), words in context, the main idea ---- */
  const BPIC = { en: [['ball', 'baseball'], ['cup', 'trophy'], ['medal', 'medal'], ['shoe', 'sneaker'], ['helmet', 'helmet'], ['flag', 'flag'], ['bike', 'bike'], ['target', 'target']], he: [['כדור', 'baseball'], ['גביע', 'trophy'], ['מדליה', 'medal'], ['נעל', 'sneaker'], ['קסדה', 'helmet'], ['דגל', 'flag'], ['אופניים', 'bike'], ['מטרה', 'target']] };
  const SENT = {
    en: [['Sam hit the ball over the fence.', 'What did Sam hit?', 'the ball', ['the fence', 'the bat', 'the glove']], ['Mia caught the ball with her glove.', 'What did Mia catch the ball with?', 'her glove', ['her hat', 'her bat', 'her shoe']], ['The team ran around the bases after the big hit.', 'What did the team run around?', 'the bases', ['the fence', 'the car', 'the lake']], ['Leo put on a helmet before he went to bat.', 'What did Leo put on?', 'a helmet', ['a scarf', 'a crown', 'a coat']], ['The pitcher threw the ball very fast.', 'Who threw the ball?', 'the pitcher', ['the fans', 'the coach', 'the dog']], ['The fans cheered when the ball flew out of the park.', 'Who cheered?', 'the fans', ['the pitcher', 'the birds', 'the umpire']], ['Maya slid into second base in the dust.', 'Where did Maya slide?', 'into second base', ['into the pool', 'into the dugout', 'into the stands']], ['The catcher wore a mask to keep his face safe.', 'Why did the catcher wear a mask?', 'to keep his face safe', ['to look funny', 'to stay warm', 'to see better at night']], ['After the game, the team ate pizza together.', 'What did the team eat?', 'pizza', ['soup', 'popcorn', 'apples']]],
    he: [['סאם חבט בכדור מעל הגדר.', 'במה חבט סאם?', 'בכדור', ['בגדר', 'במחבט', 'בכפפה']], ['מיה תפסה את הכדור בכפפה שלה.', 'במה תפסה מיה את הכדור?', 'בכפפה', ['בכובע', 'במחבט', 'בנעל']], ['הקבוצה רצה סביב הבסיסים אחרי החבטה הגדולה.', 'סביב מה רצה הקבוצה?', 'סביב הבסיסים', ['סביב הגדר', 'סביב המכונית', 'סביב האגם']], ['לאו חבש קסדה לפני שעלה לחבוט.', 'מה חבש לאו?', 'קסדה', ['צעיף', 'כתר', 'מעיל']], ['המגיש זרק את הכדור מהר מאוד.', 'מי זרק את הכדור?', 'המגיש', ['האוהדים', 'המאמן', 'הכלב']], ['האוהדים הריעו כשהכדור עף מחוץ למגרש.', 'מי הריעו?', 'האוהדים', ['המגיש', 'הציפורים', 'השופט']], ['מאיה החליקה אל הבסיס השני בתוך האבק.', 'לאן החליקה מאיה?', 'אל הבסיס השני', ['אל הבריכה', 'אל הספסל', 'אל היציע']], ['התופס חבש מסכה כדי לשמור על הפנים שלו.', 'למה התופס חבש מסכה?', 'כדי לשמור על הפנים שלו', ['כדי להצחיק', 'כדי שיהיה לו חם', 'כדי לראות בלילה']], ['אחרי המשחק כל הקבוצה אכלה פיצה ביחד.', 'מה אכלה הקבוצה?', 'פיצה', ['מרק', 'פופקורן', 'תפוחים']]]
  };
  const STORY = {
    en: [['The Jays had two outs in the last inning. Nora stepped up to bat. She swung hard and the ball flew over the fence. Her team won the game.', 'Who hit the ball over the fence?', 'Nora', ['the coach', 'the pitcher', 'nobody'], 'Why did her team win?', 'Nora hit a home run', ['it started to rain', 'the other team went home', 'Nora dropped the bat']],
      ['It started to rain during the game. The players ran to the dugout to stay dry. When the sun came out, they finished the game.', 'Where did the players go?', 'to the dugout', ['to the car park', 'to the beach', 'home'], 'Why did they go there?', 'to stay dry', ['to eat lunch', 'to find the ball', 'to sleep']],
      ['Omar practised catching every afternoon. At first he dropped many balls. After a month, he caught almost every one.', 'When did Omar practise?', 'every afternoon', ['once a year', 'only at night', 'never'], 'What changed after a month?', 'he caught almost every ball', ['he stopped playing', 'he lost his glove', 'he grew very tall']],
      ['The coach gave each player a water bottle before the game. It was a very hot day. By the fifth inning, all the bottles were empty.', 'What did the coach give each player?', 'a water bottle', ['a new bat', 'a hat', 'a ticket'], 'Why were the bottles empty?', 'it was hot, so they drank the water', ['the bottles had holes', 'the coach took them back', 'it was snowing']],
      ['Lily was nervous before her first game. Her brother told her to take a deep breath. She hit the ball on her first try and smiled.', 'Who helped Lily?', 'her brother', ['her teacher', 'the umpire', 'a dog'], 'How did Lily feel at the end?', 'happy', ['angry', 'sleepy', 'scared']],
      ['The stadium lights came on as the sky got dark. Thousands of fans filled the seats. Everyone stood up to sing before the first pitch.', 'When did the lights come on?', 'as the sky got dark', ['in the morning', 'after the game', 'at lunch'], 'What did everyone do before the first pitch?', 'stood up and sang', ['went home', 'ate popcorn', 'fell asleep']],
      ['Ben lost his glove before the big game. His friend Tia had two gloves, so she gave him one. Ben caught the last ball of the game.', 'Who gave Ben a glove?', 'his friend Tia', ['his coach', 'the umpire', 'a fan'], 'Why could Tia help him?', 'she had two gloves', ['she was the coach', 'she found it in a tree', 'she bought a new one']],
      ['The team bus broke down on the way to the game. The players walked the last mile and arrived just in time. They were tired but they won.', 'How did the players get to the game in the end?', 'they walked the last mile', ['they flew', 'they rode bikes', 'they stayed home'], 'How did they feel when they arrived?', 'tired', ['bored', 'scared', 'angry at the fans']]],
    he: [['לקבוצת הנשרים נשארו שתי הוצאות בסיבוב האחרון. נוגה עלתה לחבוט. היא חבטה חזק והכדור עף מעל הגדר. הקבוצה שלה ניצחה.', 'מי חבט בכדור מעל הגדר?', 'נוגה', ['המאמן', 'המגיש', 'אף אחד'], 'למה הקבוצה שלה ניצחה?', 'נוגה חבטה הום ראן', ['התחיל לרדת גשם', 'הקבוצה השנייה הלכה הביתה', 'נוגה הפילה את המחבט']],
      ['באמצע המשחק התחיל לרדת גשם. השחקנים רצו לספסל המקורה כדי להישאר יבשים. כשהשמש יצאה, הם סיימו את המשחק.', 'לאן הלכו השחקנים?', 'לספסל המקורה', ['לחניה', 'לים', 'הביתה'], 'למה הם הלכו לשם?', 'כדי להישאר יבשים', ['כדי לאכול', 'כדי למצוא את הכדור', 'כדי לישון']],
      ['עומר התאמן בתפיסות כל אחר צהריים. בהתחלה הכדורים נפלו לו הרבה. אחרי חודש הוא תפס כמעט כל כדור.', 'מתי התאמן עומר?', 'כל אחר צהריים', ['פעם בשנה', 'רק בלילה', 'אף פעם'], 'מה השתנה אחרי חודש?', 'הוא תפס כמעט כל כדור', ['הוא הפסיק לשחק', 'הוא איבד את הכפפה', 'הוא גדל מאוד']],
      ['המאמנת נתנה לכל שחקן בקבוק מים לפני המשחק. היה יום חם מאוד. עד הסיבוב החמישי כל הבקבוקים התרוקנו.', 'מה נתנה המאמנת לכל שחקן?', 'בקבוק מים', ['מחבט חדש', 'כובע', 'כרטיס'], 'למה הבקבוקים התרוקנו?', 'היה חם, אז שתו את המים', ['היו חורים בבקבוקים', 'המאמנת לקחה אותם', 'ירד שלג']],
      ['לילי הייתה לחוצה לפני המשחק הראשון שלה. אחיה אמר לה לנשום עמוק. היא חבטה בכדור כבר בניסיון הראשון וחייכה.', 'מי עזר ללילי?', 'אחיה', ['המורה', 'השופט', 'כלב'], 'איך הרגישה לילי בסוף?', 'שמחה', ['כועסת', 'עייפה', 'מפוחדת']],
      ['אורות האצטדיון נדלקו כשהשמיים החשיכו. אלפי אוהדים מילאו את המושבים. כולם קמו לשיר לפני הזריקה הראשונה.', 'מתי נדלקו האורות?', 'כשהשמיים החשיכו', ['בבוקר', 'אחרי המשחק', 'בצהריים'], 'מה עשו כולם לפני הזריקה הראשונה?', 'קמו ושרו', ['הלכו הביתה', 'אכלו פופקורן', 'נרדמו']],
      ['בן איבד את הכפפה שלו לפני המשחק הגדול. לחברה שלו טיה היו שתי כפפות, אז היא נתנה לו אחת. בן תפס את הכדור האחרון במשחק.', 'מי נתנה לבן כפפה?', 'החברה שלו טיה', ['המאמן שלו', 'השופט', 'אוהד'], 'למה טיה יכלה לעזור לו?', 'היו לה שתי כפפות', ['היא הייתה המאמנת', 'היא מצאה כפפה על עץ', 'היא קנתה כפפה חדשה']],
      ['האוטובוס של הקבוצה התקלקל בדרך למשחק. השחקנים הלכו ברגל את הקילומטר האחרון והגיעו בדיוק בזמן. הם היו עייפים, אבל ניצחו.', 'איך הגיעו השחקנים למשחק בסוף?', 'הלכו ברגל את הקילומטר האחרון', ['טסו במטוס', 'רכבו על אופניים', 'נשארו בבית'], 'איך הם הרגישו כשהגיעו?', 'עייפים', ['משועממים', 'מפוחדים', 'כועסים על האוהדים']]]
  };
  const CTX = {
    en: [['The pitcher threw a curveball that bent away from the batter. A curveball is…', 'a pitch that bends', ['a very fast car', 'a round cake', 'a kind of glove']], ['After three strikes, the batter was out. A strike is…', 'a pitch the batter misses', ['a kind of snack', 'a home run', 'a big crowd']], ["The umpire shouted 'Safe!' as the runner touched the base. An umpire is…", 'the judge of the game', ["the team's bus driver", 'a fan in the seats', 'the ball maker']], ['The crowd gave the team a standing ovation. A standing ovation is…', 'people standing up to clap', ['people sitting quietly', 'the lights going off', 'rain starting']], ['He was the MVP, the most valuable player. MVP means…', 'the most valuable player', ['the most visited park', 'the main video player', 'the meeting place']], ['The game went into extra innings because the score was tied. Extra innings are…', 'more turns to break a tie', ['a longer lunch break', 'a second stadium', 'new uniforms']], ['The rookie was nervous, because it was her very first season. A rookie is…', 'a player in the first season', ['the oldest player', 'the team doctor', 'a kind of bird']], ['The shortstop dove and snagged the ball out of the air. Snagged means…', 'caught quickly', ['dropped', 'kicked away', 'painted']]],
    he: [['המגיש זרק כדור מסתובב שעיקם את דרכו הרחק מהחובט. כדור מסתובב הוא…', 'זריקה שמתעקמת באוויר', ['מכונית מהירה', 'עוגה עגולה', 'סוג של כפפה']], ['אחרי שלוש החטאות החובט הוצא מהמשחק. "החטאה" (סטרייק) היא…', 'כדור שהחובט לא פגע בו', ['סוג של חטיף', 'הום ראן', 'קהל גדול']], ['השופט צעק "בטוח!" כשהרץ נגע בבסיס. השופט הוא…', 'מי שמחליט לפי החוקים', ['נהג האוטובוס של הקבוצה', 'אוהד ביציע', 'מי שמייצר כדורים']], ['הקהל נתן לקבוצה תשואות בעמידה. תשואות בעמידה הן…', 'כשכולם קמים ומוחאים כפיים', ['כשכולם יושבים בשקט', 'כשהאורות כבים', 'כשמתחיל גשם']], ['הוא נבחר ל-MVP, השחקן המצטיין. MVP פירושו…', 'השחקן המצטיין', ['הפארק הכי מתויר', 'נגן הווידאו הראשי', 'מקום המפגש']], ['המשחק נמשך לסיבובי הארכה כי התוצאה הייתה שוויון. סיבובי הארכה הם…', 'עוד סיבובים כדי להכריע', ['הפסקת צהריים ארוכה', 'אצטדיון שני', 'מדים חדשים']], ['השחקנית הטירונית התרגשה, כי זו הייתה העונה הראשונה שלה. טירונית היא…', 'שחקנית בעונה הראשונה שלה', ['השחקנית הכי ותיקה', 'רופאת הקבוצה', 'סוג של ציפור']], ['השחקן זינק וחטף את הכדור מהאוויר. חטף פירושו…', 'תפס מהר', ['הפיל', 'בעט רחוק', 'צבע']]]
  };
  const MAIN = {
    en: [['Baseball began in the United States in the 1800s. Over time it spread to Japan, Cuba and many other countries. Today millions of people play and watch it. What is the main idea?', 'baseball spread from one country to the whole world', ['baseball is only played in Japan', 'baseball was invented last year', 'Cuba has the biggest stadium']], ['Warming up before a game gets the body ready. It warms the muscles and makes injuries less likely. A few minutes of stretching and jogging is enough. What is the main idea?', 'warming up helps players stay safe and play well', ['stretching takes hours', 'jogging is a sport of its own', 'games start in the morning']], ["Teams that talk on the field make fewer mistakes. A quick shout of 'Mine!' stops two players running into each other. Good teams practise talking, not only throwing. What is the main idea?", 'talking to each other makes a team better', ['shouting is not allowed', 'throwing is the only skill', 'players should run into each other']], ['Bats were once made only of wood. Today many young players use metal bats because they are lighter. Professional leagues still use wooden bats. What is the main idea?', 'bats can be wood or metal, and different players use each', ['metal bats are banned everywhere', 'wooden bats are the lightest', 'young players never use bats']], ['Players drink water before, during and after a game. Sweating makes the body lose water. Without it, players get tired and dizzy. What is the main idea?', 'drinking water keeps players strong', ['sweating is bad for you', 'games are too long', 'water makes the ball wet']], ['Some teams practise in the rain. Wet grass is slippery, so they learn to keep their balance. On game day, rain does not surprise them. What is the main idea?', 'practising in hard weather gets a team ready', ['rain always stops the game', 'grass is never wet', 'balance is not needed']], ['A good coach cheers when players try hard, not only when they win. Players who feel supported keep practising. Over time, they get much better. What is the main idea?', 'encouragement helps players improve', ['coaches only care about winning', 'practice is boring', 'players never get better']], ['Umpires study the rules for years. They must decide in a split second whether a runner is safe or out. Both teams trust them to be fair. What is the main idea?', 'umpires need knowledge and fairness', ['umpires play for one team', 'the rules are very short', 'runners are always safe']]],
    he: [['הבייסבול התחיל בארצות הברית במאה ה-19. עם הזמן הוא התפשט ליפן, לקובה ולעוד מדינות רבות. היום מיליוני אנשים משחקים וצופים בו. מה הרעיון המרכזי?', 'הבייסבול התפשט ממדינה אחת לכל העולם', ['משחקים בייסבול רק ביפן', 'הבייסבול הומצא בשנה שעברה', 'בקובה יש את האצטדיון הגדול ביותר']], ['חימום לפני משחק מכין את הגוף. הוא מחמם את השרירים ומקטין את הסיכוי לפציעה. כמה דקות של מתיחות וריצה קלה מספיקות. מה הרעיון המרכזי?', 'חימום עוזר לשחקנים להישאר בריאים ולשחק טוב', ['מתיחות נמשכות שעות', 'ריצה קלה היא ספורט בפני עצמו', 'משחקים מתחילים בבוקר']], ['קבוצות שמדברות על המגרש עושות פחות טעויות. קריאה קצרה של "שלי!" מונעת משני שחקנים להתנגש. קבוצות טובות מתאמנות גם בדיבור, לא רק בזריקות. מה הרעיון המרכזי?', 'דיבור בין השחקנים משפר את הקבוצה', ['אסור לצעוק במשחק', 'זריקה היא המיומנות היחידה', 'שחקנים צריכים להתנגש']], ['פעם מחבטים היו עשויים רק מעץ. היום שחקנים צעירים רבים משתמשים במחבטי מתכת כי הם קלים יותר. בליגות המקצועיות עדיין משחקים במחבטי עץ. מה הרעיון המרכזי?', 'יש מחבטים מעץ וממתכת, ושחקנים שונים משתמשים בכל אחד', ['מחבטי מתכת אסורים בכל מקום', 'מחבטי עץ הם הקלים ביותר', 'שחקנים צעירים אף פעם לא משתמשים במחבט']], ['שחקנים שותים מים לפני המשחק, במהלכו ואחריו. בזמן הזיעה הגוף מאבד מים. בלי מים, השחקנים מתעייפים ומסתחררים. מה הרעיון המרכזי?', 'שתיית מים שומרת על השחקנים חזקים', ['זיעה מזיקה', 'המשחקים ארוכים מדי', 'המים מרטיבים את הכדור']], ['יש קבוצות שמתאמנות גם בגשם. דשא רטוב הוא חלקלק, אז הן לומדות לשמור על שיווי משקל. ביום המשחק, הגשם כבר לא מפתיע אותן. מה הרעיון המרכזי?', 'אימון במזג אוויר קשה מכין את הקבוצה', ['גשם תמיד עוצר את המשחק', 'הדשא אף פעם לא רטוב', 'לא צריך שיווי משקל']], ['מאמן טוב מריע כשהשחקנים מתאמצים, לא רק כשהם מנצחים. שחקנים שמרגישים תמיכה ממשיכים להתאמן. עם הזמן הם משתפרים מאוד. מה הרעיון המרכזי?', 'עידוד עוזר לשחקנים להשתפר', ['למאמנים אכפת רק מניצחון', 'אימון הוא דבר משעמם', 'שחקנים אף פעם לא משתפרים']], ['שופטים לומדים את החוקים במשך שנים. הם צריכים להחליט בשבריר שנייה אם רץ בטוח או בחוץ. שתי הקבוצות סומכות עליהם שיהיו הוגנים. מה הרעיון המרכזי?', 'שופט צריך ידע והגינות', ['השופט משחק בשביל קבוצה אחת', 'החוקים קצרים מאוד', 'רץ תמיד בטוח']]]
  };
  function batQ(band, lang, H) {
    const { pick, shuffle } = H, he = lang === 'he', L = he ? 'he' : 'en';
    if (band <= 1) { const it = pick(BPIC[L]); return { q: he ? 'איזו מילה מתאימה לתמונה?' : 'Which word goes with the picture?', a: it[0], ch: shuffle([it[0]].concat(shuffle(BPIC[L].filter(x => x !== it)).slice(0, 3).map(x => x[0]))), icon: it[1] }; }
    if (band === 2) { const it = pick(SENT[L]); return { q: it[0] + ' ' + it[1], a: it[2], ch: shuffle([it[2]].concat(it[3])) }; }
    if (band === 3 || band === 4) { const it = pick(STORY[L]), w = band === 3 ? 1 : 4; return { q: it[0] + ' ' + it[w], a: it[w + 1], ch: shuffle([it[w + 1]].concat(it[w + 2])) }; }
    const it = pick(band === 5 ? CTX[L] : MAIN[L]); return { q: it[0], a: it[1], ch: shuffle([it[1]].concat(it[2])) };
  }

  /* ---- The Goalposts (American football · math): steps, yard lines, touchdowns and field goals, gains and losses, metres, speed, two kinds of score ---- */
  const KICKERS = { en: [['Maya', 'f'], ['Omer', 'm'], ['Lia', 'f'], ['Ben', 'm']], he: [['מאיה', 'f'], ['עומר', 'm'], ['ליה', 'f'], ['בן', 'm']] };
  function yardQ(band, lang, H) {
    const { ri, pick, near } = H, he = lang === 'he', k = Math.random(), P = pick(KICKERS[he ? 'he' : 'en']), N = P[0];
    const mk = (q, a, step) => ({ q, a, ch: near(a, 4, step || 1) });
    if (band <= 1) { const a = ri(2, 5), b = ri(2, 5);
      return k < 0.6 ? mk(he ? `${N} ${g3(P, 'עשה', 'עשתה')} ${a} צעדים, ואז עוד ${b} צעדים. כמה צעדים בסך הכול?` : `${N} took ${a} steps, then ${b} more steps. How many steps in all?`, a + b) : mk(he ? `על הקו עמדו ${a + b} שחקנים. ${b} הלכו לשתות מים. כמה שחקנים נשארו?` : `${a + b} players stood on the line. ${b} went for a drink. How many are left?`, a); }
    if (band === 2) { const y = 5 * ri(2, 7), m = pick([5, 10, 15]), fwd = Math.random() < 0.65 || y - m <= 0, to = fwd ? y + m : y - m;
      return mk(he ? `הכדור על קו ה-${y} יארד. הקבוצה ${fwd ? `מתקדמת ${m} יארד קדימה` : `נסוגה ${m} יארד אחורה`}. על איזה קו הכדור עכשיו?` : `The ball is on the ${y}-yard line. The team moves it ${m} yards ${fwd ? 'forward' : 'back'}. Which yard line is it on now?`, to, 5); }
    if (band === 3) { if (k < 0.45) { const t = ri(2, 4); return mk(he ? `טאצ'דאון שווה 6 נקודות, והבעיטה שאחריו עוד נקודה אחת. כמה נקודות שווים ${t} טאצ'דאונים עם בעיטות?` : `A touchdown is worth 6 points and the kick after it 1 more. How many points are ${t} touchdowns with kicks?`, 7 * t); }
      if (k < 0.75) { const f = ri(2, 6); return mk(he ? `בעיטה לשער (פילד גול) שווה 3 נקודות. כמה נקודות שוות ${f} בעיטות לשער?` : `A field goal is worth 3 points. How many points are ${f} field goals?`, 3 * f, 3); }
      const t = ri(2, 3), f = ri(2, 3); return mk(he ? `${t} טאצ'דאונים עם בעיטה (7 נקודות כל אחד) ועוד ${f} בעיטות לשער (3 נקודות כל אחת). כמה נקודות?` : `${t} touchdowns with kicks (7 points each) and ${f} field goals (3 points each). How many points?`, 7 * t + 3 * f); }
    if (band === 4) { if (k < 0.5) { const g1 = ri(6, 15), l = ri(2, g1 - 2), g2 = ri(3, 12), s = g1 - l + g2;
        return { q: he ? `הקבוצה הרוויחה ${g1} יארד, הפסידה ${l} יארד, ואז הרוויחה עוד ${g2}. בכמה יארד היא התקדמה בסך הכול?` : `The team gained ${g1} yards, lost ${l} yards, then gained ${g2} more. How many yards did they gain in all?`, a: s, ch: four(H, s, [g1 + l + g2, s + 2, s - 2, g1 + g2]) }; }
      const y = ri(15, 85); return mk(he ? `המגרש באורך 100 יארד. הקבוצה כבר קידמה את הכדור ${y} יארד מהקצה שלה. כמה יארד נשארו עד אזור הסיום בצד השני?` : `The field is 100 yards long. The team has moved the ball ${y} yards from its own end. How many yards are left to the end zone at the other end?`, 100 - y, 5); }
    if (band === 5) { if (k < 0.5) { const yd = pick([10, 20, 30, 50, 100]), m = one(yd * 0.9); return { q: he ? `יארד אחד הוא בערך 0.9 מטר. בערך כמה מטרים הם ${yd} יארד?` : `1 yard is about 0.9 metres. About how many metres is ${yd} yards?`, a: m, ch: four(H, m, [yd, yd * 2, one(yd * 0.09), yd + 10, yd - 1]) }; }
      const s = pick([5, 6, 8, 10]), t = pick([4, 5, 6]); return mk(he ? `${N} ${g3(P, 'עבר', 'עברה')} ${s * t} יארד ב-${t} שניות. כמה יארד בשנייה?` : `${N} ran ${s * t} yards in ${t} seconds. How many yards per second?`, s); }
    const T = ri(1, 3), F = ri(1, 4), Pp = 7 * T + 3 * F; return { q: he ? `הקבוצה צברה ${Pp} נקודות רק מטאצ'דאונים עם בעיטה (7) ומבעיטות לשער (3). היו לה ${T === 1 ? "טאצ'דאון אחד" : T + " טאצ'דאונים"}. כמה בעיטות לשער היו?` : `A team scored ${Pp} points using only touchdowns with kicks (7) and field goals (3). They scored ${T === 1 ? 'one touchdown' : T + ' touchdowns'}. How many field goals?`, a: F, ch: four(H, F, [F + 1, Math.max(0, F - 1), T, Math.round(Pp / 3), F + 2]) };
  }

  /* ---- The Beach Net (volleyball · spelling): spell the pictured thing, the right spelling of sports words, + ing, joined words, word families ---- */
  const SPIC = { en: [[['ball', 'soccer'], ['cup', 'trophy'], ['medal', 'medal'], ['flag', 'flag'], ['shoe', 'sneaker'], ['bike', 'bike'], ['crown', 'crown'], ['star', 'star']], [['helmet', 'helmet'], ['target', 'target'], ['trophy', 'trophy'], ['basketball', 'basketball'], ['baseball', 'baseball'], ['football', 'football'], ['volleyball', 'volleyball'], ['tennis ball', 'tennisball']]],
    he: [[['כדור', 'soccer'], ['גביע', 'trophy'], ['מדליה', 'medal'], ['דגל', 'flag'], ['נעל', 'sneaker'], ['אופניים', 'bike'], ['כתר', 'crown'], ['כוכב', 'star']], [['קסדה', 'helmet'], ['מטרה', 'target'], ['כדורסל', 'basketball'], ['בייסבול', 'baseball'], ['פוטבול', 'football'], ['כדורעף', 'volleyball'], ['כדור טניס', 'tennisball'], ['כדורגל', 'soccer']]] };
  const SDEF = { en: [['team', 'The players who play together.'], ['coach', 'The person who trains the players.'], ['score', 'The number of points in the game.'], ['whistle', 'The referee blows it to stop play.'], ['referee', 'The person who makes sure the rules are kept.'], ['racket', 'You hit a tennis ball with it.'], ['stadium', 'A big place with seats all around the field.'], ['champion', 'The winner of the whole competition.'], ['trophy', 'The cup the winners lift.'], ['helmet', 'It protects your head.']],
    he: [['קבוצה', 'השחקנים שמשחקים יחד.'], ['מאמן', 'מי שמאמן את השחקנים.'], ['תוצאה', 'מספר הנקודות או השערים במשחק.'], ['משרוקית', 'השופט שורק בה כדי לעצור את המשחק.'], ['שופט', 'מי שדואג שישמרו על החוקים.'], ['מחבט', 'מכים בו בכדור טניס.'], ['אצטדיון', 'מקום גדול עם מושבים מסביב למגרש.'], ['אלוף', 'מי שניצח בכל התחרות.'], ['גביע', 'מה שהמנצחים מרימים.'], ['קסדה', 'היא מגינה על הראש.']] };
  const STRAP = { whistle: ['whisle', 'wistle'], referee: ['referie', 'refferee'], racket: ['raket', 'rackit'], stadium: ['stadeum', 'staduim'], champion: ['champian', 'champoin'], trophy: ['trofy', 'trophie'], helmet: ['helmit', 'hellmet'], coach: ['coatch', 'cooch'], score: ['scor', 'skore'], team: ['teem', 'taem'] };
  const ING = { en: [['swim', 'swimming', ['swiming', 'swimmimg', 'swimeing']], ['run', 'running', ['runing', 'runnning', 'runeing']], ['hit', 'hitting', ['hiting', 'hittting', 'hitteing']], ['dive', 'diving', ['diveing', 'divving', 'divinng']], ['score', 'scoring', ['scoreing', 'scorring', 'scorinng']], ['serve', 'serving', ['serveing', 'servving', 'servinng']], ['kick', 'kicking', ['kiking', 'kickking', 'kickeing']], ['skate', 'skating', ['skateing', 'skatting', 'skatinng']], ['jump', 'jumping', ['jumpping', 'jumpeing', 'juming']], ['win', 'winning', ['winnig', 'winnning', 'wiining']]],
    he: [['לרוץ', 'ריצה', ['ריצא', 'רייצה', 'ריצאה']], ['לשחות', 'שחייה', ['שכייה', 'שחייא', 'שחיאה']], ['לקפוץ', 'קפיצה', ['כפיצה', 'קפיצא', 'קפייצה']], ['לבעוט', 'בעיטה', ['באיטה', 'בעיתה', 'בעיטא']], ['לזרוק', 'זריקה', ['זריכה', 'זריקא', 'זרייקה']], ['לתפוס', 'תפיסה', ['טפיסה', 'תפיסא', 'תפייסה']], ['להגיש', 'הגשה', ['הגשא', 'אגשה', 'הגאשה']], ['לחבוט', 'חביטה', ['כביטה', 'חביטא', 'חבייטה']], ['לצלול', 'צלילה', ['צלילא', 'צליילה', 'צלילאה']]] };
  const SCOMP = { en: [['foot + ball', 'football', ['foot ball', 'footbal', 'footbawl']], ['basket + ball', 'basketball', ['basket ball', 'basketbal', 'baskettball']], ['base + ball', 'baseball', ['base ball', 'basebal', 'baseboll']], ['volley + ball', 'volleyball', ['volley ball', 'voleyball', 'volleybal']], ['goal + keeper', 'goalkeeper', ['goal keeper', 'golekeeper', 'goalkeper']], ['score + board', 'scoreboard', ['score board', 'scorebord', 'skoreboard']], ['team + mate', 'teammate', ['team mate', 'teamate', 'teemmate']], ['wrist + band', 'wristband', ['wrist band', 'ristband', 'wristbend']]],
    he: [['כדור + רגל', 'כדורגל', ['כדור רגל', 'כדוררגל', 'קדורגל']], ['כדור + סל', 'כדורסל', ['כדור סל', 'קדורסל', 'כדורשל']], ['כדור + עף', 'כדורעף', ['כדור עף', 'כדוראף', 'קדורעף']], ['כדור + יד', 'כדוריד', ['כדור יד', 'קדוריד', 'כדורייד']], ['שח + מט', 'שחמט', ['שח מט', 'שכמט', 'שחמת']], ['אופן + נוע', 'אופנוע', ['אופן נוע', 'אופנואה', 'אופנו']]] };
  const SFAM = { en: [['compete → the event where people compete: ___', 'competition', ['competitor', 'competitive', 'competed']], ['champion → the tournament that decides the champion: ___', 'championship', ['champions', 'championed', 'championing']], ['athlete → the describing word (strong, fit, quick): ___', 'athletic', ['athletes', 'athletics', 'athleticism']], ['strategy → the describing word (well planned): ___', 'strategic', ['strategies', 'strategist', 'strategize']], ['perform → the noun (how well you did): ___', 'performance', ['performer', 'performed', 'performing']], ['train → the person who trains others: ___', 'trainer', ['training', 'trainee', 'trained']], ['swim → the person who swims: ___', 'swimmer', ['swimming', 'swam', 'swims']], ['defend → the player who defends: ___', 'defender', ['defense', 'defending', 'defended']]],
    he: [['מהשורש ת-ח-ר: מפגש שבו מתמודדים כדי לנצח הוא ___', 'תחרות', ['מתחרה', 'תחרותי', 'התחרו']], ['מהשורש א-מ-ן: מה שעושים כדי להשתפר בספורט הוא ___', 'אימון', ['מאמן', 'אמנות', 'התאמן']], ['מהשורש נ-צ-ח: מה שמשיגים כשמנצחים הוא ___', 'ניצחון', ['מנצח', 'נצחי', 'נצח']], ['מהשורש ש-ח-ק: מי שמשחק בקבוצה הוא ___', 'שחקן', ['משחק', 'שחוק', 'שיחק']], ['מהשורש א-ל-ף: התחרות על התואר הגדול היא ה___', 'אליפות', ['אלוף', 'אלף', 'מאלף']], ['מהשורש ז-כ-ה: מה שקורה כשמקבלים את הפרס הוא ___', 'זכייה', ['זכות', 'זכאי', 'זיכוי']], ['מהשורש ש-ע-ר: מי ששומר על השער הוא ה___', 'שוער', ['שער', 'שערה', 'שיעור']], ['מהשורש ש-פ-ט: מי שמחליט לפי החוקים במשחק הוא ה___', 'שופט', ['משפט', 'שפוט', 'נשפט']]] };
  function spikeQ(band, lang, H) {
    const { pick, shuffle } = H, he = lang === 'he', L = he ? 'he' : 'en';
    if (band <= 2) { const pool = band <= 1 ? SPIC[L][0] : SPIC[L][0].concat(SPIC[L][1]), it = pick(pool); return { q: he ? 'איזה כדור מאיית נכון את מה שבתמונה?' : 'Which ball spells the picture right?', a: it[0], ch: shuffle([it[0]].concat(miss(H, it[0], he, 3))), icon: it[1] }; }
    if (band === 3) { const it = pick(SDEF[L]), w = it[0], ch = [w].concat(!he && STRAP[w] ? STRAP[w] : []); for (const m of H.misspell(w, he, 5)) { if (ch.length >= 4) break; if (!ch.includes(m)) ch.push(m); } return { q: (he ? 'איך כותבים נכון? ' : 'Which spelling is right? ') + it[1], a: w, ch: shuffle(ch.slice(0, 4)) }; }
    if (band === 4) { const it = pick(ING[L]); return { q: he ? `איך כותבים את שם הפעולה של "${it[0]}"?` : `How do you spell "${it[0]}" + ing?`, a: it[1], ch: shuffle([it[1]].concat(it[2])) }; }
    if (band === 5) { const it = pick(SCOMP[L]); return { q: he ? `${it[0]} = ? איך כותבים את המילה?` : `${it[0]} = ? How is the word written?`, a: it[1], ch: shuffle([it[1]].concat(it[2])) }; }
    const it = pick(SFAM[L]); return { q: (he ? 'איזו מילה מתאימה? ' : 'Which word fits? ') + it[0], a: it[1], ch: shuffle([it[1]].concat(it[2])) };
  }

  /* ---- Center Court (tennis · reading, words): opposites, same meaning, what tennis words mean, one word two meanings, sports idioms, big ideas ---- */
  const OPP = { en: [['win', 'lose'], ['fast', 'slow'], ['up', 'down'], ['in', 'out'], ['first', 'last'], ['start', 'finish'], ['high', 'low'], ['full', 'empty'], ['strong', 'weak'], ['early', 'late']], he: [['לנצח', 'להפסיד'], ['מהיר', 'איטי'], ['למעלה', 'למטה'], ['בפנים', 'בחוץ'], ['ראשון', 'אחרון'], ['להתחיל', 'לסיים'], ['גבוה', 'נמוך'], ['מלא', 'ריק'], ['חזק', 'חלש'], ['מוקדם', 'מאוחר']] };
  const SYN = { en: [['quick', 'fast'], ['begin', 'start'], ['shout', 'yell'], ['glad', 'happy'], ['large', 'big'], ['leap', 'jump'], ['toss', 'throw'], ['finish', 'end'], ['correct', 'right'], ['chat', 'talk']], he: [['זריז', 'מהיר'], ['לפתוח', 'להתחיל'], ['לצווח', 'לצעוק'], ['עליז', 'שמח'], ['ענק', 'גדול מאוד'], ['לזנק', 'לקפוץ'], ['להטיל', 'לזרוק'], ['לסיים', 'לגמור'], ['לגבור', 'לנצח'], ['לשוחח', 'לדבר']] };
  const TWORD = { en: [["In tennis, 'love' means…", 'zero', ['a hug', 'one point', 'a win']], ["A 'serve' is…", 'the hit that starts a point', ['a kind of racket', 'the last point', 'a rest']], ["A 'rally' is…", 'the ball going back and forth many times', ['a big crowd', 'a new ball', 'the end of the game']], ["A 'match' in sport is…", 'a whole game between players or teams', ['a stick for making fire', 'a pair of socks', 'a trophy']], ["An 'ace' in tennis is…", 'a serve the other player cannot touch', ['a missed ball', 'a long rally', 'a broken racket']], ["A 'volley' is…", 'hitting the ball before it bounces', ['a kind of net', 'a break in play', 'a slow serve']], ["A 'fault' in tennis is…", 'a serve that misses the box', ['a new ball', 'a great shot', 'the end of a game']], ["The 'baseline' is…", 'the line at the very back of the court', ['the net', "the umpire's chair", 'the middle of the court']]],
    he: [["בטניס, 'לאב' (love) פירושו…", 'אפס', ['חיבוק', 'נקודה אחת', 'ניצחון']], ["'הגשה' בטניס היא…", 'המכה שפותחת את הנקודה', ['סוג של מחבט', 'הנקודה האחרונה', 'הפסקה']], ["'ראלי' בטניס הוא…", 'הכדור עובר הלוך ושוב הרבה פעמים', ['קהל גדול', 'כדור חדש', 'סוף המשחק']], ["'משחק' (מאץ') בספורט הוא…", 'מפגש שלם בין שחקנים או קבוצות', ['גפרור', 'זוג גרביים', 'גביע']], ["'אייס' בטניס הוא…", 'הגשה שהיריב לא נוגע בה', ['כדור שהוחמץ', 'ראלי ארוך', 'מחבט שבור']], ["'וולה' בטניס היא…", 'מכה בכדור לפני שהוא נוגע בקרקע', ['סוג של רשת', 'הפסקה במשחק', 'הגשה איטית']], ["'פאולט' (שגיאה) בהגשה הוא…", 'הגשה שלא נכנסה לריבוע', ['כדור חדש', 'מכה מצוינת', 'סוף המשחק']], ["'קו הבסיס' במגרש הטניס הוא…", 'הקו שבקצה האחורי של המגרש', ['הרשת', 'הכיסא של השופט', 'אמצע המגרש']]] };
  const TWO = { en: [["'The players walked onto the court.' Here 'court' means…", 'the place where the game is played', ['a room where judges work', "a king's palace", 'a school yard']], ["'The ball hit the net.' Here 'net' means…", 'the mesh across the middle of the court', ['money left after costs', 'the internet', 'a fishing tool']], ["'They won the match.' Here 'match' means…", 'a game', ['a small stick for fire', 'two things that look alike', 'a date']], ["'He swung the bat.' Here 'bat' means…", 'the stick for hitting the ball', ['a flying animal', 'a blink', 'a small box']], ["'Her serve was fast.' Here 'serve' means…", 'the first hit of a point', ['to bring food to the table', 'to help people', 'to work in the army']], ["'The teams ran onto the pitch.' Here 'pitch' means…", 'the playing field', ['how high a sound is', 'a black sticky tar', 'a sales talk']], ["'The runner made it home safe.' Here 'home' means…", 'home plate, the last base', ['the house where you live', 'a country', "a bird's nest"]], ["'She hit a long drive.' Here 'drive' means…", 'a hard, long hit', ['a trip in a car', 'a computer disk', 'a wide road']]],
    he: [["'השחקנים ניסו לקלוע לסל.' כאן 'סל' הוא…", 'הטבעת עם הרשת שזורקים אליה', ['סל קניות', 'סל פירות', 'סל כביסה']], ["'הכדור נכנס לשער.' כאן 'שער' הוא…", 'המסגרת שהכדור צריך להיכנס אליה', ['דלת גדולה בחומה', 'שער של ספר', 'מחיר של מטבע']], ["'הכדור פגע ברשת.' כאן 'רשת' היא…", 'הרשת שבאמצע המגרש', ['רשת של חנויות', 'רשת האינטרנט', 'רשת של דייגים']], ["'השחקנים יצאו למגרש.' כאן 'מגרש' הוא…", 'המקום שבו משחקים', ['מגרש חניה', 'חלקת אדמה לבנייה', 'מגרש של סוחר מכוניות']], ["'המחבט נשבר.' כאן 'מחבט' הוא…", 'הכלי שמכים בו בכדור', ['זבוב', 'מחבט שטיחים', 'פטיש']], ["'הרופאה נתנה לו כדור.' כאן 'כדור' הוא…", 'תרופה', ['כדור רגל', 'כדור הארץ', 'כדור שלג']], ["'השוער עמד בשער.' כאן 'שער' הוא…", 'המסגרת שמגינים עליה במשחק', ['שער של עיר', 'שער של מטבע', 'שער של ספר']], ["'הקבוצה עלתה לגמר.' כאן 'גמר' הוא…", 'המשחק האחרון שמכריע מי זוכה', ['סוף של סיפור', 'גמר של שיעורי בית', 'גמר של עוגה']]] };
  const IDIOM = { en: [["'The ball is in your court' means…", 'it is your turn to decide or act', ['you won the game', 'the ball is lost', 'you must go home']], ["'Keep your eye on the ball' means…", 'stay focused on what matters', ['stare at one ball all day', 'close your eyes', 'go to sleep']], ["'A level playing field' means…", 'a fair chance for everyone', ['a field with no grass', 'a very high field', 'a game with no rules']], ["'Jump the gun' means…", 'to start too early', ['to jump very high', 'to run very fast', 'to win a prize']], ["'Throw in the towel' means…", 'to give up', ['to dry your hands', 'to start a race', 'to win easily']], ["'Hit it out of the park' means…", 'to do something extremely well', ['to lose the ball', 'to leave the stadium', 'to break a window']], ["'Drop the ball' means…", 'to make a mistake', ['to win the game', 'to take a rest', 'to throw very far']], ["'Take one for the team' means…", 'to do something hard to help your group', ['to steal the ball', 'to leave the team', 'to take a photo']]],
    he: [["'הכדור במגרש שלך' פירושו…", 'עכשיו תורך להחליט או לפעול', ['ניצחת במשחק', 'הכדור אבד', 'צריך ללכת הביתה']], ["'לזרוק את המגבת' פירושו…", 'לוותר ולהפסיק לנסות', ['לייבש את הידיים', 'להתחיל מרוץ', 'לנצח בקלות']], ["'גול עצמי' (בהשאלה) פירושו…", 'לפגוע בעצמך בטעות', ['לנצח לבד', 'לשחק בלי קבוצה', 'לקבל פרס']], ["'כרטיס אדום' (בהשאלה) פירושו…", 'סירוב חד או הרחקה', ['הזמנה למסיבה', 'כרטיס לאוטובוס', 'ציון טוב']], ["'לשחק במגרש הביתי' פירושו…", 'להיות במקום מוכר ונוח', ['לשחק רק בבית', 'לבנות מגרש', 'לא לצאת מהחדר']], ["'נוקאאוט' (בהשאלה) פירושו…", 'ניצחון מוחלט ומהיר', ['הפסד קטן', 'הפסקה קצרה', 'דפיקה בדלת']], ["'להוריד את הכדור לדשא' פירושו…", 'להירגע ולפעול בשקט ובחוכמה', ['לבעוט חזק', 'לצאת מהמגרש', 'לסיים את המשחק']], ["'לשחק בשביל הקבוצה' פירושו…", 'לעזור לכולם ולא רק לעצמך', ['לשחק לבד', 'לשבת על הספסל', 'לשנות קבוצה']]] };
  const BIG = { en: [["Which word means 'a plan to win'?", 'strategy', ['stamina', 'referee', 'trophy']], ["Which word means 'being fair and kind when you play'?", 'sportsmanship', ['stamina', 'strategy', 'overtime']], ["Which word means 'keep trying even when it is hard'?", 'perseverance', ['penalty', 'sportsmanship', 'rally']], ["Which word means 'bouncing back after a loss'?", 'resilience', ['referee', 'strategy', 'tournament']], ["Which word means 'working together as one'?", 'teamwork', ['stamina', 'penalty', 'resilience']], ["Which word means 'the energy to keep going for a long time'?", 'stamina', ['strategy', 'teamwork', 'trophy']], ["Which word means 'a player who leads the team on the field'?", 'captain', ['referee', 'spectator', 'mascot']], ["Which word means 'people who watch a game'?", 'spectators', ['referees', 'rackets', 'athletes']]],
    he: [["איזו מילה פירושה 'תוכנית כדי לנצח'?", 'אסטרטגיה', ['סיבולת', 'שופט', 'גביע']], ["איזה צירוף פירושו 'להיות הוגנים ונחמדים כשמשחקים'?", 'רוח ספורטיבית', ['סיבולת', 'אסטרטגיה', 'הארכה']], ["איזו מילה פירושה 'להמשיך לנסות גם כשקשה'?", 'התמדה', ['פנדל', 'רוח ספורטיבית', 'ראלי']], ["איזו מילה פירושה 'להתאושש אחרי הפסד'?", 'חוסן', ['שופט', 'אסטרטגיה', 'טורניר']], ["איזה צירוף פירושו 'לעבוד יחד כמו אחד'?", 'עבודת צוות', ['סיבולת', 'פנדל', 'חוסן']], ["איזו מילה פירושה 'הכוח להמשיך הרבה זמן'?", 'סיבולת', ['אסטרטגיה', 'עבודת צוות', 'גביע']], ["איזו מילה פירושה 'מי שמוביל את הקבוצה על המגרש'?", 'קפטן', ['שופט', 'צופה', 'קמע']], ["איזו מילה פירושה 'אנשים שצופים במשחק'?", 'צופים', ['שופטים', 'מחבטים', 'ספורטאים']]] };
  function aceQ(band, lang, H) {
    const { pick, shuffle } = H, he = lang === 'he', L = he ? 'he' : 'en';
    if (band <= 1) { const it = pick(OPP[L]), flip = Math.random() < 0.5, w = flip ? it[1] : it[0], a = flip ? it[0] : it[1], others = shuffle(OPP[L].filter(x => x !== it)).slice(0, 3).map(x => x[Math.random() < 0.5 ? 0 : 1]); return { q: he ? `מה ההפך של "${w}"?` : `What is the opposite of "${w}"?`, a, ch: shuffle([a].concat(others)) }; }
    if (band === 2) { const it = pick(SYN[L]), others = shuffle(SYN[L].filter(x => x !== it)).slice(0, 3).map(x => x[1]); return { q: he ? `איזו מילה אומרת אותו דבר כמו "${it[0]}"?` : `Which word means the same as "${it[0]}"?`, a: it[1], ch: shuffle([it[1]].concat(others)) }; }
    const it = pick(band === 3 ? TWORD[L] : band === 4 ? TWO[L] : band === 5 ? IDIOM[L] : BIG[L]); return { q: it[0], a: it[1], ch: shuffle([it[1]].concat(it[2])) };
  }

  /* ================================================================== shared 3D pieces */
  const HALL = () => KQRealms.hall;
  const lay = (c, sp) => { const narrow = c.camera.aspect < 1.05; return { k: narrow ? 0.85 : 1, sp: sp * (narrow ? 0.72 : 1) }; };
  const FANS = [0xe8433a, 0x2a6ae0, 0xf4c21e, 0xffffff, 0x2ab86a, 0xff7a2a, 0xff5aa0, 0x8a4ae0, 0x23232e], SKIN = [0xf2d0a8, 0xe0b48a, 0xc08a5c, 0x8a5a38, 0x5e3c26];
  /* the balls, painted on an equirectangular canvas (the same painter drew their icons); 'pigskin' wraps a lathe (the American football) */
  function ballCanvas(kind) { const S = 512, cv = document.createElement('canvas'); cv.width = S; cv.height = S / 2; const g = cv.getContext('2d'), W = S, H = S / 2;
    const grain = (a, n) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${a},${Math.random() * 0.08})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } };
    const curve = (fn, col, w, stitch) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 240; i++) { const u = i / 240, y = fn(u); i ? g.lineTo(u * W, y) : g.moveTo(u * W, y); } g.stroke(); if (stitch) { g.strokeStyle = stitch; g.lineWidth = w * 0.45; for (let i = 0; i < 64; i++) { const u = (i + 0.5) / 64, x = u * W, y = fn(u), y2 = fn(u + 0.004), a = Math.atan2(y2 - y, 0.004 * W); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + sd * 2.2) * w * 1.6, y + Math.sin(a + sd * 2.2) * w * 1.6); g.stroke(); } } } };
    if (kind === 'soccer') { g.fillStyle = '#f8f8f4'; g.fillRect(0, 0, W, H); const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
      for (const v of V) { const Lv = Math.hypot(...v), x = v[0] / Lv, y = v[1] / Lv, z = v[2] / Lv, lat = Math.asin(y), lon = Math.atan2(x, z); for (const off of [-TAU, 0, TAU]) { const cx = (lon + off + PI) / TAU * W, cy = (PI / 2 - lat) / PI * H, r = H * 0.1, sx = 1 / Math.max(0.25, Math.cos(lat)); g.fillStyle = '#1a1a1e'; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - PI / 2; const px = cx + Math.cos(a) * r * sx, py = cy + Math.sin(a) * r; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.fill(); } } grain('0,0,0', 900); }
    else if (kind === 'basket') { g.fillStyle = '#e2732a'; g.fillRect(0, 0, W, H); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(90,30,0,${Math.random() * 0.18})`; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, 0.9, 0, TAU); g.fill(); }
      g.strokeStyle = '#1e140e'; g.lineWidth = W * 0.008; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); for (const x of [0.25, 0.75]) { g.beginPath(); g.moveTo(x * W, 0); g.lineTo(x * W, H); g.stroke(); }
      curve(u => H / 2 - Math.cos(u * TAU) * H * 0.3, '#1e140e', W * 0.008); curve(u => H / 2 + Math.cos(u * TAU) * H * 0.3, '#1e140e', W * 0.008); }
    else if (kind === 'base') { g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, W, H); grain('120,100,60', 1200); curve(u => H / 2 + Math.sin(u * TAU * 2) * H * 0.26, '#e8e2d2', W * 0.012, '#d0282a'); }
    else if (kind === 'pigskin') { g.fillStyle = '#8a4a24'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(40,16,4,${Math.random() * 0.2})`; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
      g.strokeStyle = '#4a2410'; g.lineWidth = 3; for (const u of [0.125, 0.375, 0.625, 0.875]) { g.beginPath(); g.moveTo(u * W, 0); g.lineTo(u * W, H); g.stroke(); }
      g.fillStyle = '#f4f0e6'; for (const v of [0.15, 0.81]) g.fillRect(0, v * H, W, H * 0.04);   /* the white rings near the tips */
      g.fillRect(W * 0.494, H * 0.33, W * 0.012, H * 0.34); for (let i = 0; i < 8; i++) g.fillRect(W * 0.478, H * (0.35 + i * 0.038), W * 0.044, H * 0.016); }   /* the laces */
    else if (kind === 'volley') { const cols = ['#f6f4ec', '#2a5ac8', '#f4c81e']; for (let b = 0; b < 6; b++) { g.fillStyle = cols[b % 3]; g.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60; g.lineTo(u * W, (b / 6) * H + Math.sin(u * TAU * 1.5 + b) * H * 0.05); } for (let i = 60; i >= 0; i--) { const u = i / 60; g.lineTo(u * W, ((b + 1) / 6) * H + Math.sin(u * TAU * 1.5 + b + 1) * H * 0.05); } g.closePath(); g.fill(); } for (let b = 1; b < 6; b++) curve(u => (b / 6) * H + Math.sin(u * TAU * 1.5 + b) * H * 0.05, 'rgba(40,40,60,0.35)', 2); }
    else if (kind === 'tennis') { g.fillStyle = '#cfe83c'; g.fillRect(0, 0, W, H); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,200' : '120,150,0'},${Math.random() * 0.2})`; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); } curve(u => H / 2 + Math.sin(u * TAU * 2) * H * 0.28, '#f6f8ea', W * 0.016); }
    return cv; }
  function ballMat(c, kind) { const cache = c.MS.bm = c.MS.bm || {}; if (cache[kind]) return cache[kind]; const t = new c.T.CanvasTexture(ballCanvas(kind)); t.colorSpace = c.T.SRGBColorSpace; t.anisotropy = 4;
    return cache[kind] = c.M(kind === 'base' ? 0xc8c4bc : 0xffffff, { map: t, roughness: kind === 'tennis' ? 0.95 : kind === 'basket' || kind === 'pigskin' ? 0.72 : 0.45 }); }
  function ball(c, kind, r) { const { T } = c; let m;
    if (kind === 'pigskin') { const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new T.Vector2(Math.max(0.002, r * 0.64 * Math.pow(Math.sin(PI * t), 0.78)), r * 1.05 * (t * 2 - 1))); } m = new T.Mesh(new T.LatheGeometry(pts, 28), ballMat(c, kind)); }
    else m = new T.Mesh(new T.SphereGeometry(r, 32, 22), ballMat(c, kind));
    m.castShadow = true; return m; }
  /* mown grass: light and dark bands across the field (parallel to x) */
  function grassTex(c, a, b, rep) { return HALL().canvasTex(c.T, 64, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * h / 8, w, h / 8); } g.globalAlpha = 0.07; for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#000000'; g.fillRect(Math.random() * w, Math.random() * h, 1, 2); } g.globalAlpha = 1; }, [rep || 6, rep || 6]); }
  /* a net: white cords on a clear canvas (rep = how many 4×4-cell tiles across and down) */
  function netMat(c, rep, col) { const t = HALL().canvasTex(c.T, 128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = col || 'rgba(255,255,255,1)'; g.lineWidth = 6; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } }, rep);
    return c.M(0xffffff, { map: t, alphaTest: 0.35, side: c.T.DoubleSide, roughness: 0.9 }); }
  /* painted lines on a field: a straight strip, an arc (a0..a1 in radians: 0 = +x, turning towards −z) */
  const LINE_Y = 0.014;
  function strip(c, m, x, z, w, d, y) { const b = c.box(w, 0.012, d, m, x, (y || 0) + LINE_Y, z); b.receiveShadow = true; return b; }
  function arc(c, m, x, z, r, a0, a1, lw, y) { const { T } = c, ring = new T.Mesh(new T.RingGeometry(r - lw / 2, r + lw / 2, 48, 1, a0, a1 - a0), m); ring.rotation.x = -PI / 2; ring.position.set(x, (y || 0) + LINE_Y + 0.004, z); ring.receiveShadow = true; c.scene.add(ring); return ring; }
  /* a curved grandstand round (x, z), open towards the field: stepped tiers and a crowd (instanced shirts and heads). a0..a1 is the
     arc (0 = straight behind, positive = to the left); cheer() sends a Mexican wave round the stand and makes everyone bounce */
  function stands(c, o) { const { T, scene, M } = c; o = o || {}; const tiers = o.tiers || 6, a0 = o.a0 == null ? -1.1 : o.a0, a1 = o.a1 == null ? 1.1 : o.a1, R0 = o.r || 20, rise = o.rise || 0.95, run = o.run || 1.25, y0 = o.y0 == null ? 0.5 : o.y0, span = a1 - a0;
    const g = new T.Group(); g.position.set(o.x || 0, 0, o.z || 0); if (o.ry) g.rotation.y = o.ry; scene.add(g); const conc = M(o.col || 0x8a8f9a, { roughness: 0.92, side: T.DoubleSide }), seatM = M(o.seat || 0x2a5ac8, { roughness: 0.6, side: T.DoubleSide });
    for (let t = 0; t < tiers; t++) { const r = R0 + t * run, h1 = y0 + t * rise, h0 = t ? h1 - rise : 0;
      const riser = new T.Mesh(new T.CylinderGeometry(r, r, h1 - h0, 72, 1, true, PI + a0, span), conc); riser.position.y = (h0 + h1) / 2; riser.receiveShadow = true; g.add(riser);
      const tread = new T.Mesh(new T.RingGeometry(r, r + run, 72, 1, PI / 2 + a0, span), conc); tread.rotation.x = -PI / 2; tread.position.y = h1; tread.receiveShadow = true; g.add(tread);
      const seats = new T.Mesh(new T.RingGeometry(r + run * 0.5, r + run * 0.86, 72, 1, PI / 2 + a0, span), seatM); seats.rotation.x = -PI / 2; seats.position.y = h1 + 0.02; g.add(seats); }
    const top = y0 + (tiers - 1) * rise, back = new T.Mesh(new T.CylinderGeometry(R0 + tiers * run, R0 + tiers * run, top + 2.2, 72, 1, true, PI + a0, span), M(o.wall || 0x4a4e58, { roughness: 0.9, side: T.DoubleSide })); back.position.y = (top + 2.2) / 2; g.add(back);
    const spots = []; for (let t = 0; t < tiers; t++) { const r = R0 + t * run + run * 0.62, h = y0 + t * rise, n = Math.floor(span * r / 0.7); for (let i = 0; i < n; i++) { if (Math.random() < (o.empty == null ? 0.14 : o.empty)) continue; const a = a0 + span * (i + 0.5 + (Math.random() - 0.5) * 0.3) / n; spots.push([-Math.sin(a) * r, h, -Math.cos(a) * r, a, Math.random() * 6]); } }
    const body = new T.InstancedMesh(new T.BoxGeometry(0.46, 0.62, 0.34), M(0xffffff, { roughness: 0.8 }), spots.length), head = new T.InstancedMesh(new T.SphereGeometry(0.17, 8, 6), M(0xffffff, { roughness: 0.7 }), spots.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), one3 = new T.Vector3(1, 1, 1), v = new T.Vector3(), col = new T.Color(), UP = new T.Vector3(0, 1, 0), fans = o.fans || FANS;
    const put = (i, lift) => { const p = spots[i]; q.setFromAxisAngle(UP, p[3]); m4.compose(v.set(p[0], p[1] + 0.31 + lift, p[2]), q, one3); body.setMatrixAt(i, m4); m4.compose(v.set(p[0], p[1] + 0.8 + lift, p[2]), q, one3); head.setMatrixAt(i, m4); };
    spots.forEach((p, i) => { put(i, 0); body.setColorAt(i, col.setHex(fans[Math.floor(Math.random() * fans.length)])); head.setColorAt(i, col.setHex(SKIN[Math.floor(Math.random() * SKIN.length)])); });
    g.add(body); g.add(head);
    let t0 = -1; c.updaters.push((dt, tm) => { if (t0 < 0) return; if (t0 === 0) t0 = tm; const e = tm - t0;
      if (e > 3.4) { t0 = -1; spots.forEach((p, i) => put(i, 0)); body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true; return; }
      spots.forEach((p, i) => { const u = (p[3] - a0) / span, ph = e * 0.8 - (1 - u), wave = ph > 0 && ph < 0.4 ? Math.sin(ph / 0.4 * PI) * 0.55 : 0, hop = e < 2.4 ? Math.max(0, Math.sin(e * 10 + p[4])) * 0.12 : 0; put(i, wave + hop); });
      body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true; });
    return { g, cheer: () => { t0 = 0; } }; }
  /* a floodlight mast: a steel pole and a bank of lamps turned to the middle of the field (on: the lamps glow) */
  function floodlight(c, x, z, h, on) { const { T, M, G } = c, g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); c.scene.add(g); const steel = M(0x9aa0aa, { metalness: 0.7, roughness: 0.4 });
    c.cyl(0.25, 0.42, h, steel, 0, h / 2, 0, g, 10); c.box(4.0, 2.4, 0.4, M(0x3a3e46, { metalness: 0.5, roughness: 0.5 }), 0, h + 1.1, 0, g).rotation.x = 0.25;
    const lamp = on ? G(0xfffaf0, 2.4) : M(0xe8ecf0, { roughness: 0.3, metalness: 0.2 }); for (let r = 0; r < 3; r++) for (let q = 0; q < 5; q++) c.box(0.6, 0.55, 0.12, lamp, -1.45 + q * 0.72, h + 0.35 + r * 0.72, 0.28 - r * 0.18, g);
    if (on) { c.sprite(0xfff6e0, 11, 0, h + 1.1, 1.2, g, 0.5); c.sprite(0xfff6e0, 26, 0, h + 1.1, 1.6, g, 0.12); } return g; }
  /* a scoreboard: a dark panel with amber LED digits and the sport's ball beside them (set(n) lights the new score) */
  function scoreboard(c, o) { const { T, M } = c, cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; const g = new T.Group(); g.position.set(o.x, o.y, o.z); g.rotation.y = o.ry == null ? Math.atan2(-o.x, 14 - o.z) : o.ry; c.scene.add(g);
    const w = o.w || 6, h = w / 2, dark = M(0x1e222a, { metalness: 0.4, roughness: 0.5 }); c.box(w + 0.5, h + 0.5, 0.4, dark, 0, 0, -0.22, g); const scr = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); g.add(scr);
    if (o.legs !== false) for (const sd of [-1, 1]) c.box(0.3, o.y, 0.3, dark, sd * w * 0.35, -o.y / 2, -0.3, g);
    const bc = ballCanvas(o.ball || 'soccer');
    const draw = n => { const x = cv.getContext('2d'); x.fillStyle = '#07090f'; x.fillRect(0, 0, 512, 256);
      x.save(); x.beginPath(); x.arc(128, 128, 84, 0, TAU); x.clip(); x.drawImage(bc, 96, 32, 320, 192, 44, 44, 168, 168); const sh = x.createRadialGradient(100, 96, 10, 128, 128, 90); sh.addColorStop(0, 'rgba(255,255,255,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)'); x.fillStyle = sh; x.fillRect(40, 40, 180, 180); x.restore();
      x.fillStyle = '#ffc63a'; x.font = '800 190px ui-monospace, Menlo, Consolas, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(255,170,40,0.9)'; x.shadowBlur = 18; x.fillText(String(n), 360, 136); x.shadowBlur = 0;
      x.fillStyle = 'rgba(7,9,15,0.55)'; for (let i = 0; i < 512; i += 6) x.fillRect(i, 0, 2, 256); for (let i = 0; i < 256; i += 6) x.fillRect(0, i, 512, 2); tex.needsUpdate = true; };
    draw(0); return { g, set: draw }; }
  /* loose-ball physics: gravity, a few bounces on the floor (y = floor), friction, then it rolls to a stop */
  function loose(c, b, v, floor, o) { o = o || {}; const grav = o.g || 16, damp = o.damp || 0.55, r = o.r || 0.4; let live = true;
    c.updaters.push(dt => { if (!live) return; v.y -= grav * dt; b.position.addScaledVector(v, dt); if (b.position.y < floor) { b.position.y = floor; if (Math.abs(v.y) < 1.3) v.y = 0; else v.y = -v.y * damp; v.x *= 0.82; v.z *= 0.82; }
      b.rotation.x += v.z * dt / r; b.rotation.z -= v.x * dt / r; if (v.y === 0 && b.position.y <= floor + 1e-3) { const f = Math.pow(0.35, dt); v.x *= f; v.z *= f; if (Math.hypot(v.x, v.z) < 0.05) live = false; } });
    return { stop() { live = false; } }; }
  /* a quick streak behind a flying ball (a few fading dots) */
  function streak(c, b, col, dur, delay) { let t = -(delay || 0), n = 0; const w = new c.T.Vector3(); c.updaters.push(dt => { t += dt; if (t < 0 || t > dur) return; if (++n % 2) return; b.getWorldPosition(w); const s = c.sprite(col, 0.3, w.x, w.y, w.z, null, 0.42); c.tween(0.35, k => { s.material.opacity = 0.42 * (1 - k); s.scale.setScalar(0.3 * (1 - k * 0.6)); }, () => c.scene.remove(s)); }); }
  /* a little puff of turf, sand or chalk where a ball is struck */
  function puff(c, at, col, n) { for (let i = 0; i < (n || 7); i++) { const s = c.sprite(col, c.R(0.16, 0.3), at.x + c.R(-0.2, 0.2), at.y, at.z + c.R(-0.2, 0.2), null, 0.8), vx = c.R(-0.8, 0.8), vz = c.R(-0.4, 0.8); c.tween(0.6, k => { s.position.x += vx * 0.016; s.position.z += vz * 0.016; s.position.y = at.y + k * 0.5; s.material.opacity = 0.8 * (1 - k); }, () => c.scene.remove(s)); } }
  /* fireworks over the arena: a burst of coloured sparks at (x, y, z) */
  function firework(c, x, y, z, col) { const { T } = c, at = new T.Vector3(x, y, z); for (let i = 0; i < 26; i++) { const s = c.sprite(col, c.R(0.35, 0.7), x, y, z, null, 0.95), a = Math.random() * TAU, e = c.R(-1, 1), sp = c.R(2.5, 4.5), d = new T.Vector3(Math.cos(a) * Math.sqrt(1 - e * e), e, Math.sin(a) * Math.sqrt(1 - e * e)); c.tween(1.3, k => { const kk = 1 - Math.pow(1 - k, 2); s.position.set(at.x + d.x * sp * kk, at.y + d.y * sp * kk - 1.2 * k * k, at.z + d.z * sp * kk); s.material.opacity = 0.95 * (1 - k); }, () => c.scene.remove(s)); } const fl = c.sprite(col, 6, x, y, z, null, 0.6); c.tween(0.5, k => { fl.material.opacity = 0.6 * (1 - k); }, () => c.scene.remove(fl)); }
  /* keep the arena tidy: the balls that scored stay where they landed (a few), the misses are cleared before the next question */
  function tidy(c, keep) { const MS = c.MS; MS.miss = MS.miss || []; MS.kept = MS.kept || []; const gone = b => { const s0 = b.scale.x; c.tween(0.4, k => b.scale.setScalar(Math.max(0.001, s0 * (1 - k))), () => c.scene.remove(b)); };
    for (const b of MS.miss.splice(0)) gone(b); while (MS.kept.length > (keep == null ? 5 : keep)) gone(MS.kept.shift()); }
  /* a ball leaves its stand for the open arena (keeps its place on screen) */
  const free = (c, b) => { const w = new c.T.Vector3(); b.getWorldPosition(w); c.scene.attach(b); return w; };
  /* the crowd roars: every stand does the wave and confetti pops over the sides of the arena */
  function cheer(c) { for (const s of c.MS.crowd || []) s.cheer(); for (let i = 0; i < 4; i++) setTimeout(() => { if (!c.alive()) return; const sd = i % 2 ? 1 : -1; c.burst(new c.T.Vector3(sd * c.R(7, 11), c.R(3.5, 6), c.R(-13, -8)), FANS[(i * 3) % FANS.length], 16); }, 150 + i * 220); }
  /* a quick shiver (a post that was hit, a rim that rang) */
  function shiver(c, o, axis, amp, dur) { const r0 = o.rotation[axis]; c.tween(dur || 0.7, k => { o.rotation[axis] = r0 + Math.sin(k * 34) * amp * (1 - k); }, () => { o.rotation[axis] = r0; }); }
  /* a net bulges where a ball hits it (x, y in the net's own plane) and springs back */
  function bulgeNet(c, mesh, base, x, y, amp, spread) { const pa = mesh.geometry.attributes.position, s2 = spread || 1.4; c.tween(0.9, k => { const a = Math.sin(PI * Math.min(1, k * 1.6)) * (1 - k * 0.5) * amp; for (let i = 0; i < pa.count; i++) { const dx = base[i * 3] - x, dy = base[i * 3 + 1] - y, f = Math.exp(-(dx * dx + dy * dy) / s2); pa.setZ(i, base[i * 3 + 2] - a * f); } pa.needsUpdate = true; }, () => { for (let i = 0; i < pa.count; i++) pa.setZ(i, base[i * 3 + 2]); pa.needsUpdate = true; }); }
  /* the goalkeeper: a round, friendly figure in a bright kit and big gloves (a toy, not a real player); feet at the origin */
  function keeper(c, kit) { const { T, M } = c, g = new T.Group(), shirt = M(kit, { roughness: 0.55 }), shorts = M(0x1a1a24, { roughness: 0.7 }), skin = M(0xe8b88a, { roughness: 0.6 }), glove = M(0xffffff, { roughness: 0.5 }), boot = M(0x1a1a1a, { roughness: 0.4 });
    for (const sd of [-1, 1]) { c.cyl(0.15, 0.13, 0.95, shorts, sd * 0.22, 0.55, 0, g, 10); c.box(0.24, 0.16, 0.42, boot, sd * 0.22, 0.08, 0.07, g); }
    c.box(0.74, 0.42, 0.48, shorts, 0, 1.18, 0, g); const torso = c.cyl(0.42, 0.36, 1.0, shirt, 0, 1.86, 0, g, 16); torso.scale.z = 0.7; c.box(0.3, 0.3, 0.02, M(0xffffff, { roughness: 0.5 }), 0, 1.95, 0.3, g);
    c.sph(0.35, skin, 0, 2.66, 0, g, 18); const hair = new T.Mesh(new T.SphereGeometry(0.37, 18, 10, 0, TAU, 0, PI * 0.42), M(0x3a2414, { roughness: 0.8 })); hair.position.set(0, 2.68, -0.02); hair.rotation.x = -0.3; g.add(hair);
    for (const sx of [-0.12, 0.12]) c.sph(0.045, M(0x1a1a1a), sx, 2.7, 0.31, g, 8); const smile = new T.Mesh(new T.TorusGeometry(0.1, 0.02, 6, 12, PI), M(0x7a2a1a)); smile.position.set(0, 2.56, 0.325); smile.rotation.z = PI; g.add(smile);
    for (const sd of [-1, 1]) { const arm = new T.Group(); arm.position.set(sd * 0.46, 2.24, 0); g.add(arm); c.cyl(0.11, 0.1, 0.8, shirt, 0, -0.38, 0, arm, 8); c.sph(0.2, glove, 0, -0.82, 0, arm, 12); arm.rotation.z = sd * 2.3; }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
  /* a corner flag that flutters */
  function cornerFlag(c, x, z, col) { const { T, M } = c, g = new T.Group(); g.position.set(x, 0, z); c.scene.add(g); c.cyl(0.035, 0.035, 1.7, M(0xffffff), 0, 0.85, 0, g, 6); const sh = new T.Shape([new T.Vector2(0, 0), new T.Vector2(0.62, -0.2), new T.Vector2(0, -0.42)]), f = new T.Mesh(new T.ShapeGeometry(sh), M(col, { side: T.DoubleSide, roughness: 0.6 })); f.position.y = 1.68; g.add(f); const k0 = Math.random() * 6; c.updaters.push((dt, tm) => { f.rotation.y = Math.sin(tm * 3 + k0) * 0.5; }); return g; }
  /* a ring of LED boards round the pitch: bands of colour that scroll (no words, no brands) */
  function ledBoards(c, x, z, r, a0, a1, h, cols) { const { T } = c, cv = document.createElement('canvas'); cv.width = 512; cv.height = 32; const g = cv.getContext('2d'), w = 512 / cols.length;
    cols.forEach((col, i) => { const gr = g.createLinearGradient(i * w, 0, (i + 1) * w, 0); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); g.fillStyle = gr; g.fillRect(i * w, 0, w, 32); g.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(i * w + w * (k + 0.5) / 5, 16, 5, 0, TAU); g.fill(); } });
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.wrapS = T.RepeatWrapping; tex.repeat.set(5, 1);
    const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 96, 1, true, PI + a0, a1 - a0), new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide, toneMapped: false })); m.position.set(x, h / 2, z); c.scene.add(m); c.updaters.push(dt => { tex.offset.x = (tex.offset.x + dt * 0.04) % 1; }); return m; }
  /* a palm tree: a leaning trunk, a crown of drooping fronds, three coconuts; it sways in the sea breeze */
  function palm(c, x, z, h, lean) { const { T, M } = c, g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = c.R(0, TAU); c.scene.add(g); const pts = [new T.Vector3(0, 0, 0), new T.Vector3(lean * 0.25, h * 0.4, 0), new T.Vector3(lean * 0.7, h * 0.75, 0), new T.Vector3(lean, h, 0)];
    const trunk = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.24, 8, false), M(0x9a7a52, { roughness: 0.95 })); trunk.castShadow = true; g.add(trunk); const top = new T.Group(); top.position.set(lean, h, 0); g.add(top);
    const leaf = M(0x3aa04a, { roughness: 0.7, side: T.DoubleSide }), leaf2 = M(0x2e8a3e, { roughness: 0.7, side: T.DoubleSide }); for (let i = 0; i < 8; i++) { const fr = new T.Group(); fr.rotation.y = i / 8 * TAU; top.add(fr); const bl = new T.Mesh(new T.ConeGeometry(0.42, 3.4, 4), i % 2 ? leaf : leaf2); bl.scale.z = 0.18; bl.position.set(1.5, -0.35, 0); bl.rotation.z = -1.95; bl.castShadow = true; fr.add(bl); }
    for (let i = 0; i < 3; i++) c.sph(0.2, M(0x6a4a2a, { roughness: 0.8 }), Math.cos(i * 2.1) * 0.3, -0.25, Math.sin(i * 2.1) * 0.3, top, 8);
    const k0 = Math.random() * 6; c.updaters.push((dt, tm) => { g.rotation.z = Math.sin(tm * 0.7 + k0) * 0.018; top.rotation.x = Math.sin(tm * 1.1 + k0) * 0.05; }); return g; }
  /* a striped beach umbrella */
  function umbrella(c, x, z, cA, cB) { const { T, M } = c, g = new T.Group(); g.position.set(x, 0, z); c.scene.add(g); c.cyl(0.05, 0.05, 2.8, M(0xf4f0e6), 0, 1.4, 0, g, 6);
    const t = HALL().canvasTex(T, 128, 16, (x2, w, h) => { for (let i = 0; i < 8; i++) { x2.fillStyle = i % 2 ? cA : cB; x2.fillRect(i * w / 8, 0, w / 8, h); } }); const top = new T.Mesh(new T.ConeGeometry(1.7, 0.8, 16, 1, true), M(0xffffff, { map: t, side: T.DoubleSide, roughness: 0.7 })); top.position.y = 2.9; top.castShadow = true; g.add(top); return g; }
  /* a wooden bat: knob, thin handle, fat barrel (lathe; it lies along +x from the knob) */
  function batMesh(c) { const { T, M } = c, g = new T.Group(), prof = [[0.001, 0], [0.09, 0], [0.1, 0.04], [0.05, 0.1], [0.045, 0.7], [0.07, 1.2], [0.11, 1.7], [0.12, 2.1], [0.11, 2.3], [0.001, 2.32]];
    const m = new T.Mesh(new T.LatheGeometry(prof.map(p => new T.Vector2(p[0], p[1])), 18), M(0xc8905a, { roughness: 0.45 })); m.rotation.z = -PI / 2; m.castShadow = true; g.add(m); c.cyl(0.056, 0.056, 0.5, M(0x1a1a22, { roughness: 0.8 }), 0.35, 0, 0, g, 10).rotation.z = PI / 2; return g; }
  /* a tennis racket: the pivot is the end of the grip, the head points up (+y) with the strings facing +z */
  function racketMesh(c, col) { const { T, M } = c, g = new T.Group(), frame = M(col || 0x2a2a3a, { roughness: 0.35, metalness: 0.3 });
    const head = new T.Mesh(new T.TorusGeometry(0.46, 0.045, 8, 36), frame); head.scale.y = 1.28; head.position.y = 1.62; g.add(head); const str = new T.Mesh(new T.CircleGeometry(0.44, 28), netMat(c, [1.6, 2.1], 'rgba(250,250,240,1)')); str.scale.y = 1.28; str.position.y = 1.62; g.add(str);
    for (const sd of [-1, 1]) c.box(0.05, 0.5, 0.05, frame, sd * 0.12, 0.93, 0, g).rotation.z = -sd * 0.26; c.cyl(0.055, 0.06, 0.72, M(0xf4f4f0, { roughness: 0.8 }), 0, 0.36, 0, g, 10); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
  /* a big white number painted flat on the turf (yard lines) */
  function turfNumber(c, txt, x, z, s) { const { T } = c, t = HALL().canvasTex(T, 256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.92)'; g.font = '800 104px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 6); }); const m = new T.Mesh(new T.PlaneGeometry(2.4 * (s || 1), 1.2 * (s || 1)), c.M(0xffffff, { map: t, transparent: true, roughness: 0.7, depthWrite: false })); m.rotation.x = -PI / 2; m.position.set(x, LINE_Y + 0.006, z); c.scene.add(m); return m; }

  /* ================================================================== the arenas */
  const THEMES = {
    /* the Stadium: a mown pitch under a blue sky, a bowl of fans behind the goal, scrolling LED boards, corner flags, floodlight masts */
    sp_pitch: { palette: { noFloor: true, sky: 0x8cc4f0, ground: 0x4f9a3e, fog: 0xd4e8f6, wall: ['cloud', '#ffffff', '#e8f4ff'], floor: ['moss', '#4f9a3e', '#458c36'], hemi: [0xffffff, 0x4a7a3a], key: 0xfff4e0, dust: { c: 0xffffff, n: 14, mode: 'drift' } },
      look: { keyC: 0xfff8ee, grade: 'day', exposure: 1.0, fogD: 0.007, rim: 0xffffff, face: 0x12301c, accent: '#d8ffb0', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { M, MS } = c; HALL().skyDome(c, 0x3a86de, 0xd8ecfa, false); HALL().ground(c, 0x4f9a3e, 80, grassTex(c, '#5aa447', '#4d943c', 7));
        const W = M(0xffffff, { roughness: 0.6 });
        strip(c, W, 0, -7.5, 34, 0.14); for (const sd of [-1, 1]) { strip(c, W, sd * 7, -6, 0.14, 3); strip(c, W, sd * 13, -3.2, 0.14, 8.6); } strip(c, W, 0, -4.5, 14.14, 0.14); strip(c, W, 0, 1.1, 26.14, 0.14);
        arc(c, W, 0, -1.2, 4.2, PI + 0.58, TAU - 0.58, 0.14); c.cyl(0.17, 0.17, 0.01, W, 0, LINE_Y + 0.004, -1.2, null, 16);
        ledBoards(c, 0, -2, 15.4, -1.22, 1.22, 0.9, [['#2a6ae0', '#7ab8ff'], ['#e8433a', '#ff9a5a'], ['#2ab86a', '#9aff8a'], ['#f4c21e', '#fff08a']]);
        MS.crowd = [stands(c, { x: 0, z: -2, r: 16.6, a0: -1.25, a1: 1.25, tiers: 7, seat: 0x2a5ac8 })];
        for (const sd of [-1, 1]) { floodlight(c, sd * 19, -21, 15, false); cornerFlag(c, sd * 13.2, -7.35, sd > 0 ? 0xff4a3a : 0xffd23a); }
        MS.board = scoreboard(c, { x: 10.6, y: 4.6, z: -9.6, w: 4.2, ball: 'soccer' }); } },
    /* the Arena: a glossy maple court under the lights, a painted key, a steep bowl of fans in the dark, spotlight beams */
    sp_court: { palette: { noFloor: true, sky: 0x0c1020, ground: 0x14161e, fog: 0x0c1020, wall: ['brick', '#1a1e2a', '#232838'], floor: ['plank', '#d9a066', '#c89050'], hemi: [0xfff0e0, 0x1a1420], key: 0xffe8c8, dust: { c: 0xffe8c0, n: 36, mode: 'drift' } },
      look: { keyC: 0xfff2e0, grade: 'bright', exposure: 0.94, fogD: 0.014, rim: 0x8ab8ff, face: 0x2a1408, accent: '#ffc890', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, M, MS } = c; HALL().ground(c, 0x14161e, 70);
        const wt = c.wallTex('plank', '#c8904e', '#bb8446'); wt.repeat.set(9, 4); const wood = M(0xffffff, { map: wt, roughness: 0.42, metalness: 0.02 }); const court = c.box(24, 0.2, 26, wood, 0, -0.1, -3.5); court.receiveShadow = true;
        const W = M(0xffffff, { roughness: 0.5 }), paint = M(0x1f4a9a, { roughness: 0.4 }); c.box(6.4, 0.012, 6.6, paint, 0, 0.007, -4.5).receiveShadow = true;
        strip(c, W, 0, -7.8, 24, 0.14); for (const sd of [-1, 1]) { strip(c, W, sd * 3.2, -4.5, 0.12, 6.6); strip(c, W, sd * 7.0, -6.5, 0.14, 2.6); strip(c, W, sd * 12, -3.5, 0.14, 26); } strip(c, W, 0, -1.2, 6.52, 0.12);
        arc(c, W, 0, -1.2, 2.0, PI, TAU, 0.12); arc(c, W, 0, -5.2, 7.0, PI, TAU, 0.14); arc(c, W, 0, 9.5, 2.3, 0, PI, 0.12);
        MS.crowd = [stands(c, { x: 0, z: -3, r: 15.4, a0: -1.5, a1: 1.5, tiers: 10, rise: 1.05, run: 1.15, y0: 0.9, seat: 0xc8342a, col: 0x2a2e38, wall: 0x0e1016 })];
        for (const sd of [-1, 1]) { const bench = c.box(4.2, 0.5, 0.7, M(0x1f4a9a, { roughness: 0.6 }), sd * 13.2, 0.45, 1.5); bench.rotation.y = sd * PI / 2; }
        /* the lighting rig: a truss over the court with lamps, and soft beams falling on the floor */
        const steel = M(0x5a606a, { metalness: 0.7, roughness: 0.4 }); const truss = new T.Mesh(new T.TorusGeometry(9, 0.18, 6, 48), steel); truss.rotation.x = PI / 2; truss.position.set(0, 15, -4); c.scene.add(truss);
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, x = Math.cos(a) * 9, z = -4 + Math.sin(a) * 9; c.cyl(0.3, 0.4, 0.6, M(0x2a2e36, { metalness: 0.5 }), x, 14.6, z, null, 10); c.sprite(0xfff4e0, 3, x, 14.2, z, null, 0.7); }
        for (const [x, z] of [[-5, -8], [5, -8], [0, -1], [0, -10]]) { const beam = new T.Mesh(new T.CylinderGeometry(0.6, 3.2, 15, 24, 1, true), new T.MeshBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: 0.05, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); beam.position.set(x, 7.5, z); c.scene.add(beam); }
        const lt = new T.PointLight(0xfff0dc, 28, 40, 1.4); lt.position.set(0, 13, -4); c.scene.add(lt);
        for (const [x, col] of [[-6, 0xc8342a], [-2, 0xf4c21e], [2, 0x1f4a9a], [6, 0xc8342a]]) { const pn = c.box(1.3, 2.8, 0.04, M(col, { roughness: 0.7, side: T.DoubleSide }), x, 11.6, -13); const st = new T.Mesh(new T.CircleGeometry(0.34, 5), M(0xffffff, { roughness: 0.6 })); st.position.set(x, 11.9, -12.97); st.rotation.z = PI / 2; c.scene.add(st); pn.userData.k = x; }
        MS.board = scoreboard(c, { x: 10.2, y: 5.2, z: -10.4, w: 4.2, ball: 'basket' }); } },
    /* the Ballpark at night: a clay infield and a striped outfield under light towers, a padded fence, bleachers full of fans, stars */
    sp_park: { palette: { noFloor: true, sky: 0x0a1330, ground: 0x2e6a2c, fog: 0x101c40, wall: ['cloud', '#1a2a4a', '#0a1330'], floor: ['moss', '#327a30', '#2c6c2a'], hemi: [0xc8d8ff, 0x1a2a14], key: 0xfff4e4, dust: { c: 0xfff4d0, n: 46, mode: 'drift' } },
      look: { keyC: 0xfff6ea, grade: 'night', exposure: 1.14, fogD: 0.006, rim: 0x9ab8ff, face: 0x0e1a3a, accent: '#bfd8ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, M, MS } = c; HALL().skyDome(c, 0x040a22, 0x1c2e62, 900, 0xf4f6ff); HALL().ground(c, 0x2e6a2c, 90, grassTex(c, '#347c32', '#2c6c2a', 9));
        const clay = M(0xb87a4a, { roughness: 0.95 }), W = M(0xffffff, { roughness: 0.6 }), HP = [0, 1.4];
        const fan = new T.Mesh(new T.CircleGeometry(12.8, 48, PI / 2 - 0.82, 1.64), clay); fan.rotation.x = -PI / 2; fan.position.set(HP[0], 0.008, HP[1]); fan.receiveShadow = true; c.scene.add(fan);
        const inner = new T.Mesh(new T.PlaneGeometry(5.0, 5.0), M(0x3a8a36, { roughness: 0.9 })); inner.rotation.set(-PI / 2, 0, PI / 4); inner.position.set(0, 0.012, -3.3); inner.receiveShadow = true; c.scene.add(inner);
        const mound = c.cyl(0.9, 1.3, 0.24, clay, 0, 0.12, -3.3, null, 24); mound.receiveShadow = true; c.box(0.5, 0.04, 0.12, W, 0, 0.26, -3.3);
        for (const [x, z] of [[4.6, -3.3], [0, -8.0], [-4.6, -3.3]]) { const b = c.box(0.5, 0.1, 0.5, W, x, 0.06, z); b.rotation.y = PI / 4; }
        for (const sd of [-1, 1]) { const fl = c.box(0.12, 0.012, 26, W, HP[0] + sd * Math.sin(PI / 4) * 13, LINE_Y, HP[1] - Math.cos(PI / 4) * 13); fl.rotation.y = -sd * PI / 4; }
        const fence = new T.Mesh(new T.CylinderGeometry(23.5, 23.5, 2.2, 72, 1, true, PI - 0.86, 1.72), M(0x1f5a34, { roughness: 0.8, side: T.DoubleSide })); fence.position.set(HP[0], 1.1, HP[1]); c.scene.add(fence);
        const rail = new T.Mesh(new T.CylinderGeometry(23.45, 23.45, 0.14, 72, 1, true, PI - 0.86, 1.72), M(0xffd23a, { roughness: 0.5, side: T.DoubleSide })); rail.position.set(HP[0], 2.24, HP[1]); c.scene.add(rail);
        for (const sd of [-1, 1]) c.cyl(0.1, 0.1, 9, M(0xffd23a, { roughness: 0.4 }), HP[0] - sd * 23.5 * Math.sin(0.86), 4.5, HP[1] - 23.5 * Math.cos(0.86), null, 8);
        MS.crowd = [stands(c, { x: HP[0], z: HP[1], r: 25.2, a0: -0.9, a1: 0.9, tiers: 7, rise: 1.0, seat: 0x1f4a9a, col: 0x3a3e46, wall: 0x141a2e, empty: 0.2 })];
        for (const sd of [-1, 1]) { floodlight(c, sd * 20, -21, 17, true); floodlight(c, sd * 26, 2, 15, true); const dug = new T.Group(); dug.position.set(sd * 11.5, 0, 2.5); dug.rotation.y = -sd * PI / 2; c.scene.add(dug); c.box(5, 1.5, 1.8, M(0x2a2e3a, { roughness: 0.8 }), 0, 0.75, 0, dug); c.box(5.2, 0.14, 2.1, M(0x1f4a9a, { roughness: 0.6 }), 0, 1.57, 0.1, dug); c.box(4.6, 0.9, 0.05, M(0x0a0c12), 0, 0.85, 0.92, dug); }
        MS.board = scoreboard(c, { x: -10.5, y: 5.2, z: -13, w: 4.4, ball: 'base' }); } },
    /* the Gridiron at golden hour: striped turf, yard lines and numbers, a painted end zone, a bowl of fans, a low sun */
    sp_field: { palette: { noFloor: true, sky: 0xf0b070, ground: 0x3f8a3a, fog: 0xf2c898, wall: ['cloud', '#ffffff', '#ffe8d0'], floor: ['moss', '#46943e', '#3d8636'], hemi: [0xfff0e0, 0x4a6a3a], key: 0xffdcb0, dust: { c: 0xfff0d0, n: 20, mode: 'drift' } },
      look: { keyC: 0xffe4c0, grade: 'dusk', exposure: 1.02, fogD: 0.006, rim: 0xffb070, face: 0x2a0e14, accent: '#ffd0a0', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, M, MS } = c; HALL().skyDome(c, 0x32509a, 0xffae6a, false); c.sprite(0xffe6b0, 16, -26, 8, -72, null, 0.95); c.sprite(0xffb070, 54, -26, 8, -72, null, 0.3);
        HALL().ground(c, 0x3f8a3a, 90, grassTex(c, '#48963f', '#3d8636', 9)); const W = M(0xffffff, { roughness: 0.6 });
        for (let i = 0; i <= 8; i++) { const z = -10 + i * 2.5; strip(c, W, 0, z, 22, i === 0 ? 0.32 : 0.12); if (i < 8) for (const hx of [-3, 3]) for (let q = 1; q < 5; q++) strip(c, W, hx, z + q * 0.5, 0.5, 0.06); }
        for (const sd of [-1, 1]) strip(c, W, sd * 11, -2, 0.24, 27);
        for (const [t, z] of [['10', -5], ['20', 0], ['30', 5]]) for (const sd of [-1, 1]) turfNumber(c, t, sd * 8.4, z, 1);
        const ez = HALL().canvasTex(T, 512, 128, (g, w, h) => { g.fillStyle = '#a01c2a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.9)'; const star = (cx, cy, R) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? R * 0.45 : R; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); }; star(w / 2, h / 2, 44); star(w * 0.22, h / 2, 26); star(w * 0.78, h / 2, 26); });
        const ezm = new T.Mesh(new T.PlaneGeometry(22, 5), M(0xffffff, { map: ez, roughness: 0.8 })); ezm.rotation.x = -PI / 2; ezm.position.set(0, 0.011, -12.5); ezm.receiveShadow = true; c.scene.add(ezm); strip(c, W, 0, -15, 22, 0.24);
        MS.crowd = [stands(c, { x: 0, z: -2, r: 17.4, a0: -1.3, a1: 1.3, tiers: 8, seat: 0xa01c2a, col: 0x8a8f9a, wall: 0x3a3e48 })];
        for (const sd of [-1, 1]) floodlight(c, sd * 18.5, -22, 17, true);
        MS.board = scoreboard(c, { x: -10.8, y: 5.0, z: -10.5, w: 4.2, ball: 'pigskin' }); } },
    /* the Beach: soft sand, a turquoise sea with a moving surf line, palms, striped umbrellas, a lifeguard hut, two little stands */
    sp_beach: { palette: { noFloor: true, sky: 0x7ac8f4, ground: 0xe8d4a0, fog: 0xd8f0fa, wall: ['cloud', '#ffffff', '#e8f8ff'], floor: ['sand', '#e8d4a0', '#d8c088'], hemi: [0xfffaf0, 0xc8a870], key: 0xfff4e0, dust: { c: 0xffffff, n: 10, mode: 'drift' } },
      look: { keyC: 0xfffaf0, grade: 'bright', exposure: 0.98, fogD: 0.006, rim: 0xfff4d0, face: 0x0a2a3a, accent: '#a8f0ff', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, M, MS } = c; HALL().skyDome(c, 0x2a8ae8, 0xd0f0ff, false); c.sprite(0xfffbe8, 14, 22, 30, -80, null, 0.95); c.sprite(0xfff0c0, 44, 22, 30, -80, null, 0.3);
        const st = c.wallTex('sand', '#ead6a2', '#dcc48c'); st.repeat.set(18, 18); HALL().ground(c, 0xe8d4a0, 80, st);
        const sea = new T.Mesh(new T.PlaneGeometry(200, 70, 60, 14), M(0x22aac8, { roughness: 0.18, metalness: 0.1, emissive: 0x0a3a4a, emissiveIntensity: 0.35 })); sea.rotation.x = -PI / 2; sea.position.set(0, 0.06, -55); c.scene.add(sea); const sp = sea.geometry.attributes.position, s0 = Float32Array.from(sp.array);
        const foam = new T.Mesh(new T.PlaneGeometry(200, 1.4), M(0xffffff, { transparent: true, opacity: 0.8, roughness: 0.6, depthWrite: false })); foam.rotation.x = -PI / 2; foam.position.set(0, 0.09, -20.5); c.scene.add(foam);
        c.updaters.push((dt, tm) => { for (let i = 0; i < sp.count; i++) sp.setZ(i, s0[i * 3 + 2] + Math.sin(s0[i * 3] * 0.15 + tm * 1.3) * 0.12 + Math.sin(s0[i * 3 + 1] * 0.4 + tm * 0.9) * 0.1); sp.needsUpdate = true; foam.position.z = -20.5 + Math.sin(tm * 0.8) * 0.8; foam.material.opacity = 0.55 + Math.sin(tm * 0.8) * 0.25; });
        for (const [x, z, h, l] of [[-14, -9, 8, 1.6], [-17, -2, 7, -1.2], [14.5, -11, 8.5, -1.5], [17, -3, 7.2, 1.1], [-9, -17, 7.5, 0.8], [10, -17, 7, -0.9]]) palm(c, x, z, h, l);
        umbrella(c, -12.5, 3, '#ff5a6a', '#ffffff'); umbrella(c, 12.8, 2.2, '#2a8ae0', '#ffffff'); umbrella(c, 15.5, -7, '#ffd23a', '#ff8a3a');
        for (const [x, z, col] of [[-11.8, 4.3, 0xff8ab0], [13.6, 3.4, 0x7ad8ff], [-13.6, 2.2, 0xffd23a]]) c.box(1.1, 0.03, 2.0, M(col, { roughness: 0.9 }), x, 0.02, z).rotation.y = 0.3;
        const wood = M(0xc8a070, { roughness: 0.8 }), hut = new T.Group(); hut.position.set(-15.5, 0, -12.5); hut.rotation.y = 0.5; c.scene.add(hut); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.box(0.18, 3, 0.18, wood, x, 1.5, z, hut); c.box(2.6, 0.2, 2.6, wood, 0, 3.05, 0, hut); c.box(2.4, 1.6, 2.4, M(0xf4f0e6, { roughness: 0.8 }), 0, 3.95, 0, hut); const roof = c.cone(2.1, 1.1, M(0xe8433a, { roughness: 0.7 }), 0, 5.3, 0, hut, 4); roof.rotation.y = PI / 4; c.cyl(0.03, 0.03, 1.6, wood, 0, 6.3, 0, hut, 5); c.box(0.7, 0.4, 0.02, M(0xffd23a), 0.36, 6.9, 0, hut);
        MS.crowd = [stands(c, { x: 0, z: -4, r: 13.2, a0: 0.9, a1: 1.45, tiers: 4, rise: 0.8, run: 1.1, seat: 0xffffff, col: 0xc8a070, wall: 0xa8845a, empty: 0.1 }), stands(c, { x: 0, z: -4, r: 13.2, a0: -1.45, a1: -0.9, tiers: 4, rise: 0.8, run: 1.1, seat: 0xffffff, col: 0xc8a070, wall: 0xa8845a, empty: 0.1 })];
        MS.board = scoreboard(c, { x: 12.8, y: 7.6, z: -10, w: 3.8, ball: 'volley' }); } },
    /* Center Court: a blue hard court in a green bowl, the umpire's high chair, dark-green backdrops, a sunny sky */
    sp_centre: { palette: { noFloor: true, sky: 0x8cc8f4, ground: 0x3a7a50, fog: 0xd8ecf8, wall: ['cloud', '#ffffff', '#e8f4ff'], floor: ['moss', '#3a7a50', '#347048'], hemi: [0xffffff, 0x3a6a4a], key: 0xfff6e8, dust: { c: 0xffffff, n: 10, mode: 'drift' } },
      look: { keyC: 0xfffaf0, grade: 'day', exposure: 1.0, fogD: 0.005, rim: 0xffffff, face: 0x1a2a14, accent: '#e8ffb0', pillars: null, rays: 0, noWall: true, ceiling: false },
      props(c) { const { T, M, MS } = c; HALL().skyDome(c, 0x3a86de, 0xd8ecfa, false); HALL().ground(c, 0x3a7a50, 80);
        const blue = M(0x2a5aa8, { roughness: 0.55 }), outer = M(0x2e7a5a, { roughness: 0.6 }), W = M(0xffffff, { roughness: 0.5 });
        c.box(19, 0.02, 34, outer, 0, 0.004, -10.5).receiveShadow = true; c.box(11, 0.02, 24, blue, 0, 0.012, -10.5).receiveShadow = true;
        const Y = 0.02; for (const z of [1.5, -22.5]) strip(c, W, 0, z, 11, 0.16, Y); for (const sd of [-1, 1]) { strip(c, W, sd * 5.5, -10.5, 0.12, 24, Y); strip(c, W, sd * 4.1, -10.5, 0.12, 24, Y); } for (const z of [-4.1, -16.9]) strip(c, W, 0, z, 8.2, 0.12, Y); strip(c, W, 0, -10.5, 0.12, 12.8, Y); for (const z of [1.3, -22.3]) strip(c, W, 0, z, 0.12, 0.4, Y);
        MS.crowd = [stands(c, { x: 0, z: -10.5, r: 15.8, a0: -1.45, a1: 1.45, tiers: 9, rise: 0.95, run: 1.15, y0: 1.8, seat: 0x1f5a3a, col: 0x7a8088, wall: 0x2a3a30 })];
        const green = M(0x1f4a30, { roughness: 0.8, side: T.DoubleSide }); const back = new T.Mesh(new T.CylinderGeometry(15.7, 15.7, 1.8, 72, 1, true, PI - 1.45, 2.9), green); back.position.set(0, 0.9, -10.5); c.scene.add(back);
        const ch = new T.Group(); ch.position.set(6.9, 0, -10.5); ch.rotation.y = -PI / 2; c.scene.add(ch); const cw = M(0x2a4a3a, { roughness: 0.6 }); for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) c.box(0.1, 2.4, 0.1, cw, x, 1.2, z, ch); c.box(1.2, 0.12, 1.2, cw, 0, 2.4, 0, ch); c.box(1.0, 0.9, 0.1, cw, 0, 2.9, -0.5, ch); for (let i = 0; i < 4; i++) c.box(0.9, 0.05, 0.06, cw, 0, 0.5 + i * 0.5, 0.62, ch); const ump = c.cyl(0.9, 0.9, 0.06, M(0xf4f0e6, { roughness: 0.6 }), 0, 3.9, 0, ch, 16); c.cyl(0.03, 0.03, 1.0, cw, 0, 3.4, 0, ch, 5); ump.castShadow = true;
        MS.board = scoreboard(c, { x: -9.4, y: 5.6, z: -14.5, w: 4.2, ball: 'tennis' }); } }
  };

  /* ================================================================== the games (stages) */
  const STAGES = {
    /* ---- The Penalty Spot: four balls on the line; the right one curls into the net past a diving keeper, a wrong one is saved or rings off the post ---- */
    goal(c) { const { T, scene, MS } = c, GX = 4.6, GY = 3.0, GZ = -7.5, GD = 2.2, TB = 0.6;
      const dive = (dir, reach, dur) => { const K = MS.keeper; MS.kd = true; const x0 = K.position.x, x1 = dir * reach; c.tween(dur || 0.5, k => { const e = c.ease(k); K.position.x = x0 + (x1 - x0) * e; K.position.y = Math.sin(PI * Math.min(1, k * 1.25)) * 0.8 + 0.3 * e; K.rotation.z = -dir * 1.3 * e; }, () => {
          setTimeout(() => { if (!c.alive()) return; const xa = K.position.x, ya = K.position.y, ra = K.rotation.z; c.tween(0.6, k => { const e = c.ease(k); K.position.x = xa * (1 - e); K.position.y = ya * (1 - e); K.rotation.z = ra * (1 - e); }, () => { MS.kd = false; }); }, 1200); }); };
      return {
      frame: a => a < 1.05 ? { pos: [0, 4.8, 17.5], look: [0, 1.8, -5], fov: 60 } : a < 1.5 ? { pos: [0, 4.0, 13.8], look: [0, 1.9, -5], fov: 50 } : { pos: [0, 3.6, 12.6], look: [0, 2.0, -5], fov: 46 },
      hostAt: () => new T.Vector3(-7.0, 0, 0.6),
      build() { const post = c.M(0xffffff, { roughness: 0.35 }), g = new T.Group(); g.position.z = GZ; scene.add(g); MS.goal = g;
        for (const sd of [-1, 1]) c.cyl(0.12, 0.12, GY + 0.12, post, sd * GX, (GY + 0.12) / 2, 0, g, 12).castShadow = true; const bar = c.cyl(0.12, 0.12, GX * 2 + 0.24, post, 0, GY, 0, g, 12); bar.rotation.z = PI / 2; bar.castShadow = true;
        const back = new T.Mesh(new T.PlaneGeometry(GX * 2, GY - TB, 30, 8), netMat(c, [7, 1.9])); back.position.set(0, (GY - TB) / 2, -GD); g.add(back); MS.net = back; MS.net0 = Float32Array.from(back.geometry.attributes.position.array);
        const roof = new T.Mesh(new T.PlaneGeometry(GX * 2, Math.hypot(GD, TB)), netMat(c, [7, 1.7])); roof.position.set(0, GY - TB / 2, -GD / 2); roof.rotation.x = Math.atan2(GD, TB); g.add(roof);
        const side = new T.Shape([new T.Vector2(0, 0), new T.Vector2(0, GY), new T.Vector2(GD, GY - TB), new T.Vector2(GD, 0)]); for (const sd of [-1, 1]) { const s = new T.Mesh(new T.ShapeGeometry(side), netMat(c, [0.75, 0.75])); s.rotation.y = PI / 2; s.position.x = sd * GX; g.add(s); }
        const grey = c.M(0xc8ccd2, { roughness: 0.5 }); for (const sd of [-1, 1]) c.cyl(0.04, 0.04, GY - TB, grey, sd * GX, (GY - TB) / 2, -GD, g, 6); c.cyl(0.04, 0.04, GX * 2, grey, 0, 0.04, -GD, g, 6).rotation.z = PI / 2;
        const K = keeper(c, 0x2ad86a); K.position.set(0, 0, GZ + 0.75); K.scale.setScalar(0.8); scene.add(K); MS.keeper = K; MS.kd = false; MS.cur = []; MS.kept = []; MS.miss = [];
        c.updaters.push((dt, tm) => { if (!MS.kd) { K.position.x += (Math.sin(tm * 1.1) * 1.3 - K.position.x) * Math.min(1, dt * 3); K.position.y = Math.abs(Math.sin(tm * 2.2)) * 0.05; } for (const ch of MS.cur) if (!ch.done) ch.obj.rotation.y += dt * 0.3; }); },
      present(choices) { tidy(c, 4); MS.cur = []; const n = choices.length, L = lay(c, 3.4);
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 0, 0.6); g.scale.setScalar(L.k);
          const b = ball(c, 'soccer', 0.42); b.position.y = 0.43; b.rotation.set(c.R(0, 6), c.R(0, 6), 0); g.add(b);
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, -0.5, 1.5); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.4, 2.0, 2.8, j, 0.3); g.add(h);
          const ch = { j, g, tab, obj: b, hits: [h], still: true }; c.addChoice(ch); MS.cur.push(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const b = ch.obj, from = free(c, b); puff(c, new T.Vector3(from.x, 0.15, from.z), 0x9ad07a);
        const side = from.x > 0.3 ? 1 : from.x < -0.3 ? -1 : (Math.random() < 0.5 ? -1 : 1);
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const tx = side * c.R(1.6, 3.4), ty = c.R(0.8, 2.1), to = new T.Vector3(tx, ty, GZ - GD + 0.5), curl = -side * 1.4;
          dive(-side, 1.6, 0.5); streak(c, b, 0xffffff, 0.8, 0.1);
          c.tween(0.8, k => { b.position.lerpVectors(from, to, k); b.position.x += Math.sin(PI * k) * curl; b.position.y += Math.sin(PI * k) * 1.1; b.rotation.x -= 0.3; b.rotation.y += 0.2; }, () => { bulgeNet(c, MS.net, MS.net0, tx, ty - (GY - TB) / 2, 0.9); c.burst(to, 0xffffff, 14); c.burst(to, 0xfff4a0, 10); cheer(c); MS.board.set(MS.right); loose(c, b, new T.Vector3(0, -1, 1.2), 0.42, { r: 0.42 }); }, 0.1);
          MS.kept.push(b); }
        else { ch.tab.userData.tablet.setState('wrong'); MS.miss.push(b); streak(c, b, 0xffffff, 0.6, 0.1);
          if (Math.random() < 0.6) { const to = new T.Vector3(side * 3.4, 1.1, GZ + 0.95); dive(side, 1.6, 0.45);
            c.tween(0.62, k => { b.position.lerpVectors(from, to, k); b.position.y += Math.sin(PI * k) * 0.8; b.rotation.x -= 0.3; }, () => { c.burst(to, 0xffffff, 10); loose(c, b, new T.Vector3(side * 2.2, 3.4, 5.5), 0.42, { r: 0.42 }); }, 0.1); }
          else { const to = new T.Vector3(side * (GX - 0.1), c.R(1.2, 2.4), GZ + 0.2);
            c.tween(0.7, k => { b.position.lerpVectors(from, to, k); b.position.y += Math.sin(PI * k) * 1.0; b.rotation.x -= 0.3; }, () => { c.burst(to, 0xffffff, 12); shiver(c, MS.goal, 'z', 0.012); loose(c, b, new T.Vector3(side * 3.8, 2.4, 6), 0.42, { r: 0.42 }); }, 0.1); }
          c.glowUp(r); }
        return ok ? 3.2 : 2.8; } }; },

    /* ---- The Hoop: four balls on stands behind the arc; the right shot swishes through the net, a wrong one clangs off the rim ---- */
    hoop(c) { const { T, scene, MS } = c, RIM = new T.Vector3(0, 4.6, -5.2), RR = 0.78; return {
      frame: a => a < 1.05 ? { pos: [0, 5.2, 17], look: [0, 3.4, -4], fov: 60 } : a < 1.5 ? { pos: [0, 4.6, 13.8], look: [0, 3.6, -4], fov: 50 } : { pos: [0, 4.4, 12.6], look: [0, 3.6, -4], fov: 46 },
      hostAt: () => new T.Vector3(-7.0, 0, 0.6),
      build() { const steel = c.M(0x6a707a, { metalness: 0.7, roughness: 0.35 }), orange = c.M(0xff5a1a, { metalness: 0.3, roughness: 0.35 }), pad = c.M(0x1f4a9a, { roughness: 0.6 }), W = c.M(0xffffff, { roughness: 0.4 });
        const bz0 = RIM.z - RR - 0.25; c.box(1.8, 1.3, 2.0, pad, 0, 0.65, bz0 - 3.6); c.cyl(0.2, 0.24, 6.2, steel, 0, 3.1, bz0 - 3.0, null, 12); c.box(0.32, 0.32, 3.0, steel, 0, 6.05, bz0 - 1.5); c.box(0.26, 0.9, 0.26, steel, 0, 5.7, bz0 - 0.2);
        const by = RIM.y - 0.22 + 1.2, bz = bz0; c.box(4.0, 2.4, 0.07, c.M(0xe8f4ff, { transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, depthWrite: false }), 0, by, bz);
        for (const [w, h, x, y] of [[4.1, 0.09, 0, by + 1.2], [4.1, 0.09, 0, by - 1.2], [0.09, 2.49, -2.02, by], [0.09, 2.49, 2.02, by], [1.5, 0.07, 0, RIM.y + 0.16], [1.5, 0.07, 0, RIM.y + 1.2], [0.07, 1.1, -0.72, RIM.y + 0.68], [0.07, 1.1, 0.72, RIM.y + 0.68]]) c.box(w, h, 0.05, W, x, y, bz + 0.05);
        const rim = new T.Mesh(new T.TorusGeometry(RR, 0.06, 10, 44), orange); rim.rotation.x = PI / 2; rim.position.copy(RIM); scene.add(rim); c.box(0.34, 0.07, 0.3, orange, 0, RIM.y, RIM.z - RR - 0.12); MS.rim = rim;
        const net = new T.Mesh(new T.CylinderGeometry(RR, RR * 0.6, 1.1, 20, 4, true), netMat(c, [3, 1])); net.position.set(RIM.x, RIM.y - 0.55, RIM.z); scene.add(net); MS.hnet = net;
        MS.cur = []; MS.kept = []; MS.miss = []; c.updaters.push((dt, tm) => { for (const ch of MS.cur) if (!ch.done) { ch.obj.rotation.y += dt * 0.6; ch.obj.position.y = ch.y0 + Math.sin(tm * 2 + ch.k0) * 0.04; } }); },
      present(choices) { tidy(c, 3); MS.cur = []; const n = choices.length, L = lay(c, 3.4), chrome = c.M(0xd8dde4, { metalness: 0.9, roughness: 0.2 });
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 0, 0.4); g.scale.setScalar(L.k);
          c.cyl(0.36, 0.42, 0.08, chrome, 0, 0.04, 0, g, 20); c.cyl(0.05, 0.05, 1.0, chrome, 0, 0.55, 0, g, 8); const cradle = new T.Mesh(new T.TorusGeometry(0.22, 0.03, 6, 20), chrome); cradle.rotation.x = PI / 2; cradle.position.y = 1.06; g.add(cradle);
          const b = ball(c, 'basket', 0.38); b.position.y = 1.4; b.rotation.set(c.R(-0.4, 0.4), c.R(0, 6), 0); g.add(b);
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, -0.35, 1.3); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.4, 2.6, 2.4, j, 0.8); g.add(h);
          const ch = { j, g, tab, obj: b, y0: 1.4, k0: c.R(0, 6), hits: [h], still: true }; c.addChoice(ch); MS.cur.push(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const b = ch.obj, from = free(c, b);
        const shoot = (to, apex, dur, done) => { streak(c, b, 0xffc890, dur * 0.9); c.tween(dur, k => { b.position.lerpVectors(from, to, k); b.position.y += 4 * apex * k * (1 - k); b.rotation.x -= 0.16; }, done); };
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const top = RIM.clone().add(new T.Vector3(0, 0.25, 0.05));
          shoot(top, 2.6, 1.0, () => { const p0 = b.position.clone(); c.tween(0.28, k => { b.position.set(p0.x + (RIM.x - p0.x) * k, p0.y - k * 1.25, p0.z + (RIM.z - p0.z) * k); }, () => { loose(c, b, new T.Vector3(c.R(-0.5, 0.5), -1, 1.4), 0.38, { r: 0.38 }); });
            const n = MS.hnet; c.tween(0.65, k => { const s = Math.sin(PI * k); n.scale.set(1 - s * 0.12, 1 + s * 0.35, 1 - s * 0.12); n.position.y = RIM.y - 0.55 * n.scale.y; n.rotation.y = Math.sin(k * 12) * 0.2 * (1 - k); }, () => { n.scale.set(1, 1, 1); n.position.y = RIM.y - 0.55; n.rotation.y = 0; });
            c.burst(RIM.clone(), 0xffffff, 12); c.burst(RIM.clone(), 0xffd070, 10); setTimeout(() => { if (!c.alive()) return; cheer(c); MS.board.set(MS.right); }, 250); });
          MS.kept.push(b); }
        else { ch.tab.userData.tablet.setState('wrong'); MS.miss.push(b); const side = Math.random() < 0.5 ? -1 : 1, edge = RIM.clone().add(new T.Vector3(side * 0.35, 0.3, RR * 0.72));
          shoot(edge, 2.5, 0.95, () => { c.burst(edge, 0xffa060, 8); shiver(c, MS.rim, 'y', 0.06); loose(c, b, new T.Vector3(side * 2.4, 3.6, 2.8), 0.38, { r: 0.38 }); });
          c.glowUp(r); }
        return ok ? 3.4 : 2.9; } }; },

    /* ---- The Home Run: four balls on batting tees at the plate; the bat sends the right one over the fence (fireworks), a wrong swing misses ---- */
    bat(c) { const { T, scene, MS } = c;
      const swing = (at, over, done) => { const B = MS.bat; B.visible = true; B.scale.setScalar(1.5); B.position.set(at.x - 2.9, at.y + (over ? 0.62 : 0), at.z + 0.1); B.rotation.set(0, -1.7, 0.05);
        c.tween(0.32, k => { B.rotation.y = -1.7 + 3.1 * k * k; }, () => { setTimeout(() => { if (!c.alive()) return; c.tween(0.35, k => B.scale.setScalar(Math.max(0.001, 1.5 * (1 - k))), () => { B.visible = false; }); }, 450); });
        setTimeout(() => { if (c.alive()) done(); }, 320 * Math.sqrt(1.7 / 3.1)); };
      return {
      frame: a => a < 1.05 ? { pos: [0, 4.6, 16.5], look: [0, 2.9, -6], fov: 60 } : a < 1.5 ? { pos: [0, 4.0, 13.4], look: [0, 3.1, -6], fov: 50 } : { pos: [0, 3.7, 12.2], look: [0, 3.2, -6], fov: 46 },
      hostAt: () => new T.Vector3(-7.0, 0, 0.6),
      build() { MS.cur = []; MS.kept = []; MS.miss = []; MS.bat = batMesh(c); MS.bat.visible = false; scene.add(MS.bat); c.updaters.push((dt, tm) => { for (const ch of MS.cur) if (!ch.done) ch.obj.rotation.y += dt * 0.5; }); },
      present(choices) { tidy(c, 0); MS.cur = []; const n = choices.length, L = lay(c, 3.4), rubber = c.M(0x1a1a1e, { roughness: 0.8 }), W = c.M(0xb8b8b4, { roughness: 0.7 });
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 0, 0.4); g.scale.setScalar(L.k);
          const plate = new T.Mesh(new T.CircleGeometry(0.5, 5), W); plate.rotation.set(-PI / 2, 0, -PI / 2); plate.position.y = 0.025; plate.receiveShadow = true; g.add(plate);
          c.cyl(0.28, 0.32, 0.08, rubber, 0, 0.04, 0, g, 16); c.cyl(0.07, 0.08, 1.0, rubber, 0, 0.55, 0, g, 10);
          const b = ball(c, 'base', 0.3); b.position.y = 1.36; b.rotation.set(c.R(0, 6), 0, c.R(0, 6)); g.add(b);
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, -0.35, 1.3); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.2, 2.4, 2.4, j, 0.8); g.add(h);
          const ch = { j, g, tab, obj: b, hits: [h], still: true }; c.addChoice(ch); MS.cur.push(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const b = ch.obj, from = free(c, b); MS.miss.push(b);
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++;
          swing(from, false, () => { puff(c, from, 0xffffff, 10); streak(c, b, 0xffffff, 1.5); const to = new T.Vector3(c.R(-7, 7), 7, -34), p0 = b.position.clone();
            c.tween(1.8, k => { b.position.lerpVectors(p0, to, k); b.position.y += 12 * k * (1 - k); b.rotation.x -= 0.25; }, () => { b.visible = false; });
            setTimeout(() => { if (!c.alive()) return; firework(c, to.x * 0.6, 9, -30, 0xffd23a); cheer(c); MS.board.set(MS.right); }, 1250);
            setTimeout(() => { if (!c.alive()) return; firework(c, to.x * 0.6 - 7, 8, -31, 0xff5aa0); firework(c, to.x * 0.6 + 7, 8.5, -30, 0x7ad8ff); }, 1600); }); }
        else { ch.tab.userData.tablet.setState('wrong');
          swing(from, true, () => { c.tween(0.3, k => { b.rotation.z = Math.sin(k * 20) * 0.3; }, () => { loose(c, b, new T.Vector3(c.R(-0.6, 0.6), 0.4, 1.2), 0.3, { r: 0.3 }); }, 0.15); });
          c.glowUp(r); }
        return ok ? 3.4 : 2.6; } }; },

    /* ---- The Goalposts: four balls on kicking tees; the right kick tumbles end over end between the uprights, a wrong one goes wide or rings off a post ---- */
    yard(c) { const { T, scene, MS } = c, GZ = -15.3, UX = 2.9, CB = 3.4;
      const kick = (b, from, end, A, dur, onCross, done) => { const kz = (GZ - from.z) / (end.z - from.z); let crossed = false; streak(c, b, 0xfff0d0, dur * 0.8); const r0 = b.rotation.x;
        c.tween(dur, k => { b.position.lerpVectors(from, end, k); b.position.y += 4 * A * k * (1 - k); b.rotation.x = r0 - k * TAU * 2.2; if (!crossed && k >= kz) { crossed = true; if (onCross) onCross(b.position.clone()); } }, done); };
      return {
      frame: a => a < 1.05 ? { pos: [0, 4.8, 17], look: [0, 3.2, -8], fov: 60 } : a < 1.5 ? { pos: [0, 4.2, 13.6], look: [0, 3.4, -8], fov: 50 } : { pos: [0, 3.9, 12.4], look: [0, 3.5, -8], fov: 46 },
      hostAt: () => new T.Vector3(-7.8, 0, -1.0),
      build() { const Y = c.M(0xffd22a, { roughness: 0.4, metalness: 0.2 }), g = new T.Group(); g.position.z = GZ; scene.add(g); MS.posts = g;
        c.cyl(0.2, 0.24, CB, Y, 0, CB / 2, -1.3, g, 12); c.box(0.34, 0.34, 1.45, Y, 0, CB, -0.62, g); c.cyl(0.13, 0.13, UX * 2 + 0.2, Y, 0, CB, 0, g, 12).rotation.z = PI / 2;
        MS.up = []; for (const sd of [-1, 1]) { const u = new T.Group(); u.position.set(sd * UX, CB, 0); g.add(u); c.cyl(0.11, 0.11, 8.4, Y, 0, 4.2, 0, u, 12); c.box(0.06, 1.1, 0.03, c.M(0xff6a2a, { side: T.DoubleSide }), 0, 8.9, 0, u); MS.up.push(u); }
        c.box(0.9, 1.8, 0.9, c.M(0x1f4a9a, { roughness: 0.6 }), 0, 0.9, -1.3, g); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
        MS.cur = []; MS.kept = []; MS.miss = []; c.updaters.push((dt, tm) => { for (const ch of MS.cur) if (!ch.done) ch.obj.rotation.y = Math.sin(tm * 0.8 + ch.k0) * 0.5; }); },
      present(choices) { tidy(c, 0); MS.cur = []; const n = choices.length, L = lay(c, 3.4), tee = c.M(0xff7a1a, { roughness: 0.5 });
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 0, -0.4); g.scale.setScalar(L.k);
          c.cyl(0.16, 0.26, 0.2, tee, 0, 0.1, 0, g, 12); const b = ball(c, 'pigskin', 0.44); b.position.y = 0.62; b.rotation.x = 0.2; g.add(b);
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, -0.45, 1.5); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.2, 2.2, 2.6, j, 0.4); g.add(h);
          const ch = { j, g, tab, obj: b, k0: c.R(0, 6), hits: [h], still: true }; c.addChoice(ch); MS.cur.push(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const b = ch.obj, from = free(c, b); MS.miss.push(b); puff(c, new T.Vector3(from.x, 0.15, from.z), 0x9ad07a);
        const side = from.x > 0.3 ? 1 : from.x < -0.3 ? -1 : (Math.random() < 0.5 ? -1 : 1);
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const tx = c.R(-1.6, 1.6), end = new T.Vector3(tx * 1.15, 4.4, GZ - 5);
          kick(b, from, end, 3.9, 1.4, () => { firework(c, -8.5, 6.5, GZ + 3, 0xffd23a); firework(c, 8.5, 7, GZ + 3, 0xff5a3a); cheer(c); MS.board.set(3 * MS.right); }, () => { loose(c, b, new T.Vector3(0, -2, -1), 0.45, { r: 0.45 }); }); }
        else { ch.tab.userData.tablet.setState('wrong');
          if (Math.random() < 0.5) { const hit = new T.Vector3(side * (UX - 0.12), c.R(4.8, 6.8), GZ + 0.1); c.tween(1.05, k => { b.position.lerpVectors(from, hit, k); b.position.y += 12 * k * (1 - k); b.rotation.x = 0.2 - k * TAU * 1.6; }, () => { c.burst(hit, 0xfff0a0, 12); shiver(c, MS.up[side > 0 ? 1 : 0], 'z', 0.05, 0.9); loose(c, b, new T.Vector3(-side * 1.2, 1.4, 6), 0.45, { r: 0.45 }); }); }
          else kick(b, from, new T.Vector3(side * 6.6, 3.6, GZ - 4), 3.4, 1.35, null, () => { loose(c, b, new T.Vector3(side * 1, -2, -1), 0.45, { r: 0.45 }); });
          c.glowUp(r); }
        return ok ? 3.4 : 2.9; } }; },

    /* ---- The Beach Net: four balls float over the net; the right one is spiked into the sand (a splash), a wrong one is driven into the net ---- */
    spike(c) { const { T, scene, MS } = c, NZ = -1.5, NT = 3.0, NB = 2.0, NW = 16.6;
      const splash = at => { c.burst(at, 0xf0dcae, 22); c.burst(at, 0xd8c088, 14); const ring = new T.Mesh(new T.RingGeometry(0.3, 0.9, 24), new T.MeshBasicMaterial({ color: 0xb89a62, transparent: true, opacity: 0.6, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.set(at.x, 0.03, at.z); scene.add(ring); c.tween(1.6, k => { ring.scale.setScalar(1 + k * 0.8); ring.material.opacity = 0.6 * (1 - k); }, () => scene.remove(ring)); };
      return {
      frame: a => a < 1.05 ? { pos: [0, 3.9, 17], look: [0, 3.4, -2], fov: 60 } : a < 1.5 ? { pos: [0, 3.6, 13.6], look: [0, 3.5, -2], fov: 50 } : { pos: [0, 3.4, 12.4], look: [0, 3.5, -2], fov: 46 },
      hostAt: () => new T.Vector3(-7.0, 0, 0.6),
      build() { const post = c.M(0x2a5ac8, { roughness: 0.5 }), W = c.M(0xffffff, { roughness: 0.5 }), red = c.M(0xff4a3a, { roughness: 0.5 });
        for (const sd of [-1, 1]) c.cyl(0.13, 0.15, NT + 0.3, post, sd * NW / 2, (NT + 0.3) / 2, NZ, null, 10).castShadow = true;
        const net = new T.Mesh(new T.PlaneGeometry(NW, NT - NB, 48, 6), netMat(c, [11, 0.75], 'rgba(34,34,44,1)')); net.position.set(0, (NT + NB) / 2, NZ); scene.add(net); MS.vnet = net; MS.vnet0 = Float32Array.from(net.geometry.attributes.position.array);
        c.box(NW, 0.1, 0.03, W, 0, NT, NZ); c.box(NW, 0.05, 0.03, W, 0, NB, NZ); for (const sd of [-1, 1]) c.cyl(0.025, 0.025, NT - NB + 0.9, red, sd * 8, (NB + NT + 0.9) / 2, NZ, null, 6);
        const tape = c.M(0x2a6ae0, { roughness: 0.6 }); for (const z of [NZ + 7.5, NZ - 7.5]) strip(c, tape, 0, z, 16.12, 0.12); for (const sd of [-1, 1]) strip(c, tape, sd * 8, NZ, 0.12, 15);
        MS.cur = []; MS.kept = []; MS.miss = []; c.updaters.push((dt, tm) => { for (const ch of MS.cur) if (!ch.done) { ch.obj.position.y = ch.y0 + Math.sin(tm * 1.6 + ch.k0) * 0.16; ch.obj.rotation.y += dt * 0.8; ch.obj.rotation.x += dt * 0.3; } }); },
      present(choices) { tidy(c, 3); MS.cur = []; const n = choices.length, L = lay(c, 3.4);
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 3.75, NZ + 2.0); g.scale.setScalar(L.k);
          const b = ball(c, 'volley', 0.42); g.add(b); const sh = new T.Mesh(new T.CircleGeometry(0.5, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false })); sh.rotation.x = -PI / 2; sh.position.y = 0.03 - 3.75; g.add(sh);
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, 1.2, 0.2); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.3, 2.5, 1.6, j, 0.5); g.add(h);
          const ch = { j, g, tab, obj: b, y0: 0, k0: c.R(0, 6), hits: [h], still: true }; c.addChoice(ch); MS.cur.push(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const b = ch.obj, from = free(c, b), up = from.clone().add(new T.Vector3(0, 0.6, 0.5));
        const windup = next => c.tween(0.26, k => { b.position.lerpVectors(from, up, c.ease(k)); b.rotation.x -= 0.12; }, () => { puff(c, up, 0xffffff, 6); next(b.position.clone()); });
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const land = new T.Vector3(from.x * 0.7 + c.R(-1, 1), 0.42, NZ - c.R(3.2, 4.6));
          windup(p0 => { streak(c, b, 0xffffff, 0.36); c.tween(0.34, k => { b.position.lerpVectors(p0, land, k * k); b.position.y += Math.sin(PI * k) * 0.5; b.rotation.x -= 0.5; }, () => { splash(land); cheer(c); MS.board.set(MS.right); loose(c, b, new T.Vector3(c.R(-1, 1), 4.2, -2.2), 0.42, { r: 0.42, damp: 0.4 }); }); });
          MS.kept.push(b); }
        else { ch.tab.userData.tablet.setState('wrong'); MS.miss.push(b); const hit = new T.Vector3(from.x, c.R(2.3, 2.75), NZ + 0.3);
          windup(p0 => { streak(c, b, 0xffffff, 0.34); c.tween(0.34, k => { b.position.lerpVectors(p0, hit, k); b.rotation.x -= 0.5; }, () => { bulgeNet(c, MS.vnet, MS.vnet0, hit.x, hit.y - (NT + NB) / 2, 0.7, 2.2); loose(c, b, new T.Vector3(0, -0.5, 1.7), 0.42, { r: 0.42 }); }); });
          c.glowUp(r); }
        return ok ? 3.1 : 2.7; } }; },

    /* ---- Center Court: four balls bounce at the baseline; the racket serves the right one for an ace (a chalk puff in the box), a wrong serve clips the net ---- */
    ace(c) { const { T, scene, MS } = c, NZ = -10.5, NH = 1.05;
      const serve = (b, done) => { const at = b.position.clone(), top = new T.Vector3(at.x, 2.7, at.z); c.tween(0.34, k => { b.position.lerpVectors(at, top, c.ease(k)); }, () => {
          const R = MS.racket; R.visible = true; R.scale.setScalar(1); R.position.set(top.x + 0.42, top.y - 1.5, top.z + 0.25); R.rotation.set(1.6, 0, 0.2); c.tween(0.3, k => { R.rotation.x = 1.6 - 3.0 * k * k; }, () => { setTimeout(() => { if (!c.alive()) return; c.tween(0.3, k => R.scale.setScalar(Math.max(0.001, 1 - k)), () => { R.visible = false; }); }, 380); });
          setTimeout(() => { if (c.alive()) { puff(c, top, 0xffffff, 6); done(top); } }, 300 * Math.sqrt(1.6 / 3.0)); }); };
      return {
      frame: a => a < 1.05 ? { pos: [0, 10.5, 17.5], look: [0, 0.6, -9], fov: 60 } : a < 1.5 ? { pos: [0, 9.2, 14.6], look: [0, 0.8, -9], fov: 50 } : { pos: [0, 8.6, 13.4], look: [0, 0.9, -9], fov: 46 },
      hostAt: () => new T.Vector3(-7.4, 0, 2.2),
      build() { const post = c.M(0x1f4a30, { roughness: 0.5 }), W = c.M(0xffffff, { roughness: 0.5 });
        for (const sd of [-1, 1]) c.cyl(0.08, 0.08, NH + 0.1, post, sd * 6.0, (NH + 0.1) / 2, NZ, null, 10).castShadow = true;
        const net = new T.Mesh(new T.PlaneGeometry(12, NH - 0.05, 40, 5), netMat(c, [16, 1.4], 'rgba(30,30,34,1)')); net.position.set(0, (NH - 0.05) / 2 + 0.03, NZ); scene.add(net); MS.tnet = net; MS.tnet0 = Float32Array.from(net.geometry.attributes.position.array);
        c.box(12, 0.08, 0.04, W, 0, NH, NZ); c.box(0.08, NH, 0.05, W, 0, NH / 2, NZ);
        MS.racket = racketMesh(c, 0xe8433a); MS.racket.visible = false; scene.add(MS.racket);
        MS.cur = []; MS.kept = []; MS.miss = []; c.updaters.push((dt, tm) => { for (const ch of MS.cur) if (!ch.done) { ch.obj.position.y = 0.3 + Math.abs(Math.sin(tm * 2.2 + ch.k0)) * 1.3; ch.obj.rotation.x += dt * 1.2; } }); },
      present(choices) { tidy(c, 0); MS.cur = []; const n = choices.length, L = lay(c, 3.2);
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 0, 0.6); g.scale.setScalar(L.k);
          const b = ball(c, 'tennis', 0.3); b.position.y = 0.3; g.add(b); const sh = new T.Mesh(new T.CircleGeometry(0.34, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false })); sh.rotation.x = -PI / 2; sh.position.y = 0.03; g.add(sh);
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, -0.3, 1.7); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.2, 2.6, 2.6, j, 0.9); g.add(h);
          const ch = { j, g, tab, obj: b, k0: c.R(0, 6), hits: [h], still: true }; c.addChoice(ch); MS.cur.push(ch); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const b = ch.obj; free(c, b); MS.miss.push(b);
        const cross = b.position.x > 0.3 ? -1 : b.position.x < -0.3 ? 1 : (Math.random() < 0.5 ? -1 : 1);
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++;
          serve(b, top => { streak(c, b, 0xe8ff90, 0.9); const land = new T.Vector3(cross * c.R(0.8, 3.4), 0.3, c.R(-15.8, -13.8)), away = new T.Vector3(land.x * 1.35, 1.6, -26);
            c.tween(0.5, k => { b.position.lerpVectors(top, land, k); b.position.y += Math.sin(PI * k) * 0.9; b.rotation.x -= 0.5; }, () => { puff(c, land, 0xffffff, 14); c.tween(0.45, k => { b.position.lerpVectors(land, away, k); b.position.y += Math.sin(PI * k) * 1.2; }, () => { b.visible = false; }); cheer(c); MS.board.set(MS.right); }); }); }
        else { ch.tab.userData.tablet.setState('wrong');
          serve(b, top => { streak(c, b, 0xe8ff90, 0.5); const hit = new T.Vector3(cross * c.R(0.6, 3), c.R(0.55, 0.9), NZ + 0.12);
            c.tween(0.46, k => { b.position.lerpVectors(top, hit, k); b.position.y += Math.sin(PI * k) * 0.6; b.rotation.x -= 0.5; }, () => { bulgeNet(c, MS.tnet, MS.tnet0, hit.x, hit.y - (NH - 0.05) / 2 - 0.03, 0.5, 1.2); loose(c, b, new T.Vector3(0, 0.4, 1.4), 0.3, { r: 0.3 }); }); });
          c.glowUp(r); }
        return ok ? 3.3 : 2.8; } }; }
  };

  /* ================================================================== the map: six arenas in the Sports Kingdom */
  function landmarks(k) { const { T, plot, box, cyl, cone } = k;
    const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {})), white = M(0xffffff), conc = M(0xc8ccd4), grass = M(0x4f9a3e, { roughness: 0.9 }), steel = M(0x9aa0aa, { metalness: 0.6, roughness: 0.4 }), yellow = M(0xffd22a, { roughness: 0.4 }), lamp = M(0xfff8e0, { emissive: 0xfff0c0, emissiveIntensity: 0.9 });
    const tex = kind => { const t = new T.CanvasTexture(ballCanvas(kind)); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; };
    const bigBall = (g, kind, r, x, y, z) => { const m = new T.Mesh(new T.SphereGeometry(r, 32, 20), M(0xffffff, { map: tex(kind), roughness: 0.5 })); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    const mast = (g, x, z, h) => { cyl(0.09, 0.13, h, steel, x, h / 2, z, g, 8); box(1.1, 0.7, 0.2, lamp, x, h + 0.2, z, g).rotation.y = Math.atan2(-x, -z); };
    /* The Penalty Spot: a little bowl stadium, a pitch with two goals, floodlights, a giant ball bouncing over it */
    plot('rg_goal', -20, -12, g => { cyl(5.4, 5.8, 0.5, conc, 0, 0.25, 0, g, 36); cyl(4.3, 4.3, 0.56, grass, 0, 0.28, 0, g, 36);
      const bowl = new T.Mesh(new T.CylinderGeometry(5.6, 4.5, 2.2, 36, 1, true), M(0x2a5ac8, { side: T.DoubleSide, roughness: 0.6 })); bowl.position.y = 1.4; g.add(bowl); const lip = new T.Mesh(new T.TorusGeometry(5.6, 0.12, 6, 48), white); lip.rotation.x = PI / 2; lip.position.y = 2.5; g.add(lip);
      for (const sd of [-1, 1]) { const gl = new T.Group(); gl.position.set(sd * 3.4, 0.56, 0); gl.rotation.y = sd * PI / 2; g.add(gl); for (const px of [-0.8, 0.8]) box(0.1, 1.0, 0.1, white, px, 0.5, 0, gl); box(1.7, 0.1, 0.1, white, 0, 1.0, 0, gl); }
      box(0.06, 0.02, 8.4, white, 0, 0.57, 0, g); const cc = new T.Mesh(new T.TorusGeometry(1.0, 0.04, 4, 32), white); cc.rotation.x = PI / 2; cc.position.y = 0.58; g.add(cc);
      for (const sd of [-1, 1]) mast(g, sd * 4.6, sd * 2.8, 6.2);
      const bl = bigBall(g, 'soccer', 1.4, 0, 4.8, 0); k.fx((dt, tm) => { bl.rotation.y = tm * 0.8; bl.rotation.x = Math.sin(tm * 0.6) * 0.3; bl.position.y = 4.8 + Math.abs(Math.sin(tm * 1.8)) * 0.8; }); }, { labelH: 9 });
    /* The Hoop: a round arena under a dome painted like a basketball, a ring of lit windows, a hoop outside */
    plot('rg_hoop', 22, -10, g => { cyl(4.4, 4.6, 3.2, M(0xe8e4dc), 0, 1.6, 0, g, 32); const band = new T.Mesh(new T.CylinderGeometry(4.45, 4.45, 0.9, 32, 1, true), M(0x1f3a7a, { emissive: 0x2a4a9a, emissiveIntensity: 0.3, side: T.DoubleSide })); band.position.y = 2.2; g.add(band);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; box(0.5, 0.56, 0.06, lamp, Math.sin(a) * 4.5, 2.2, Math.cos(a) * 4.5, g).rotation.y = a; }
      const dome = new T.Mesh(new T.SphereGeometry(4.4, 36, 18, 0, TAU, 0, PI / 2), M(0xffffff, { map: tex('basket'), roughness: 0.55 })); dome.position.y = 3.2; dome.castShadow = true; g.add(dome); box(1.6, 2.0, 0.2, M(0x2a2e38), 0, 1.0, 4.45, g);
      const hp = new T.Group(); hp.position.set(5.4, 0, 2.2); hp.rotation.y = -PI / 2; g.add(hp); cyl(0.1, 0.12, 4.2, steel, 0, 2.1, -0.5, hp, 8); box(1.6, 1.0, 0.08, white, 0, 4.3, -0.1, hp); const rim = new T.Mesh(new T.TorusGeometry(0.34, 0.04, 6, 20), M(0xff5a1a)); rim.rotation.x = PI / 2; rim.position.set(0, 3.9, 0.3); hp.add(rim);
      k.fx((dt, tm) => { dome.rotation.y = tm * 0.15; }); }, { labelH: 10 });
    /* The Home Run: a little ballpark — clay diamond, outfield fence, light towers, a scoreboard with a giant baseball on top */
    plot('rg_bat', -20, 29, g => { cyl(6.0, 6.3, 0.3, conc, 0, 0.15, 0, g, 36); const fan = new T.Mesh(new T.CircleGeometry(5.6, 32, PI / 2 - 0.8, 1.6), grass); fan.rotation.x = -PI / 2; fan.position.set(0, 0.32, 3.0); g.add(fan);
      const clay = M(0xb87a4a, { roughness: 0.95 }); box(2.8, 0.05, 2.8, clay, 0, 0.34, 0.9, g).rotation.y = PI / 4; box(1.8, 0.06, 1.8, grass, 0, 0.36, 0.9, g).rotation.y = PI / 4; for (const [x, z] of [[1.95, 0.9], [0, -1.05], [-1.95, 0.9], [0, 2.85]]) box(0.26, 0.08, 0.26, white, x, 0.4, z, g).rotation.y = PI / 4;
      const fence = new T.Mesh(new T.CylinderGeometry(5.5, 5.5, 1.0, 32, 1, true, PI - 0.8, 1.6), M(0x1f5a34, { side: T.DoubleSide })); fence.position.set(0, 0.8, 3.0); g.add(fence);
      for (const sd of [-1, 1]) mast(g, sd * 4.2, -0.8, 5.6); cyl(0.12, 0.12, 3.2, steel, -1, 1.6, -3.3, g, 8); cyl(0.12, 0.12, 3.2, steel, 1, 1.6, -3.3, g, 8); box(3.4, 1.8, 0.3, M(0x1e222a), 0, 3.6, -3.3, g); box(2.8, 1.2, 0.05, M(0xffc63a, { emissive: 0xffa020, emissiveIntensity: 0.6 }), 0, 3.6, -3.13, g);
      const bl = bigBall(g, 'base', 1.1, 0, 5.8, -3.3); k.fx((dt, tm) => { bl.rotation.y = tm * 0.7; bl.position.y = 5.8 + Math.sin(tm * 1.4) * 0.2; }); }, { labelH: 9 });
    /* The Goalposts: a striped field with a red end zone, big yellow uprights, bleachers, a giant football on a kicking tee */
    plot('rg_yard', 28, 25, g => { box(7.6, 0.4, 9.2, grass, 0, 0.2, 0, g); for (let i = 0; i < 6; i++) box(7.6, 0.02, 0.1, white, 0, 0.41, -2.4 + i * 1.3, g); box(7.6, 0.03, 1.6, M(0xa01c2a), 0, 0.42, -3.7, g);
      const Y = yellow; cyl(0.12, 0.14, 2.6, Y, 0, 1.6, -4.5, g, 8); cyl(0.09, 0.09, 3.3, Y, 0, 2.9, -4.5, g, 8).rotation.z = PI / 2; for (const sd of [-1, 1]) cyl(0.08, 0.08, 4.2, Y, sd * 1.6, 5.0, -4.5, g, 8);
      for (let s = 0; s < 3; s++) { box(1.2, 0.5 + s * 0.5, 7.0, conc, 4.4 + s * 0.8, (0.5 + s * 0.5) / 2 + 0.4, 0, g); box(0.2, 0.08, 7.0, M([0xa01c2a, 0xffffff, 0x1f4a9a][s]), 4.0 + s * 0.8, 0.9 + s * 0.5, 0, g); }
      cyl(0.5, 0.7, 0.4, M(0xff7a1a), 0, 0.6, 1.6, g, 12); const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new T.Vector2(Math.max(0.002, 0.92 * Math.pow(Math.sin(PI * t), 0.78)), 1.5 * (t * 2 - 1))); }
      const fb = new T.Mesh(new T.LatheGeometry(pts, 28), M(0xffffff, { map: tex('pigskin'), roughness: 0.6 })); fb.position.set(0, 2.3, 1.6); fb.rotation.x = 0.25; fb.castShadow = true; g.add(fb); k.fx((dt, tm) => { fb.rotation.y = tm * 0.6; }); }, { labelH: 10 });
    /* The Beach Net: a patch of sand, a net, two palms and a striped umbrella — and a ball in a rally over the net */
    plot('rg_spike', -36, 6, g => { cyl(5.6, 5.9, 0.3, M(0xe8d4a0, { roughness: 0.95 }), 0, 0.15, 0, g, 32); const tp = M(0x2a6ae0); for (const z of [-3.2, 3.2]) box(7.4, 0.02, 0.1, tp, 0, 0.31, z, g); for (const sd of [-1, 1]) box(0.1, 0.02, 6.4, tp, sd * 3.7, 0.31, 0, g);
      for (const sd of [-1, 1]) cyl(0.08, 0.08, 2.6, M(0x2a5ac8), sd * 3.9, 1.6, 0, g, 8); box(7.8, 0.8, 0.03, M(0x2a2a30, { transparent: true, opacity: 0.55 }), 0, 2.3, 0, g); box(7.8, 0.1, 0.05, white, 0, 2.72, 0, g);
      const bark = M(0x9a7a52, { roughness: 0.95 }), leaf = M(0x3aa04a, { side: T.DoubleSide }); for (const [x, z, l] of [[-4.6, -3.2, 0.8], [4.8, -2.8, -0.7]]) { const tr = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0, 0, 0), new T.Vector3(l * 0.3, 2.5, 0), new T.Vector3(l, 5, 0)]), 10, 0.16, 6), bark); tr.position.set(x, 0.3, z); g.add(tr); for (let i = 0; i < 7; i++) { const fr = new T.Group(); fr.position.set(x + l, 5.3, z); fr.rotation.y = i / 7 * TAU; g.add(fr); const bl = cone(0.3, 2.4, leaf, 1.05, -0.3, 0, fr, 4); bl.scale.z = 0.2; bl.rotation.z = -1.95; } }
      const um = M(0xff5a6a, { side: T.DoubleSide }); cyl(0.04, 0.04, 2.2, white, 3.2, 1.4, 3.0, g, 6); cone(1.2, 0.6, um, 3.2, 2.6, 3.0, g, 8);
      const vb = bigBall(g, 'volley', 0.6, 0, 3.4, 0); k.fx((dt, tm) => { const u = tm * 1.1; vb.position.x = Math.sin(u) * 2.6; vb.position.y = 3.3 + Math.abs(Math.cos(u)) * 2.2; vb.rotation.z = u * 2; }); }, { labelH: 8.5 });
    /* Center Court: a blue court with its lines and net inside a green bowl, a giant tennis ball bouncing, a racket statue */
    plot('rg_ace', 36, 9, g => { box(7.4, 0.3, 9.8, M(0x2e7a5a), 0, 0.15, 0, g); box(5.2, 0.04, 8.4, M(0x2a5aa8), 0, 0.32, 0, g); for (const z of [-4.2, 4.2]) box(5.2, 0.02, 0.08, white, 0, 0.35, z, g); for (const sd of [-1, 1]) box(0.08, 0.02, 8.4, white, sd * 2.6, 0.35, 0, g); for (const z of [-2.2, 2.2]) box(4.0, 0.02, 0.07, white, 0, 0.35, z, g); box(0.07, 0.02, 4.4, white, 0, 0.35, 0, g);
      box(5.8, 0.55, 0.03, M(0x1e1e24, { transparent: true, opacity: 0.6 }), 0, 0.62, 0, g); box(5.8, 0.07, 0.05, white, 0, 0.9, 0, g); for (const sd of [-1, 1]) { cyl(0.05, 0.05, 0.7, M(0x1f4a30), sd * 2.95, 0.65, 0, g, 6); for (let s = 0; s < 3; s++) box(0.8, 0.4 + s * 0.4, 9.4, conc, sd * (3.4 + s * 0.7), 0.3 + (0.4 + s * 0.4) / 2, 0, g); }
      const rk = new T.Group(); rk.position.set(-2.2, 0.3, 3.2); rk.rotation.z = 0.25; g.add(rk); const head = new T.Mesh(new T.TorusGeometry(0.9, 0.09, 8, 32), M(0xe8433a, { roughness: 0.4 })); head.scale.y = 1.28; head.position.y = 3.3; rk.add(head); const strs = new T.Mesh(new T.CircleGeometry(0.86, 24), M(0xf4f4ea, { transparent: true, opacity: 0.55, side: T.DoubleSide })); strs.scale.y = 1.28; strs.position.y = 3.3; rk.add(strs); cyl(0.1, 0.12, 1.6, white, 0, 0.8, 0, rk, 8); cyl(0.07, 0.07, 0.9, M(0xe8433a), 0, 1.9, 0, rk, 8);
      const tb = bigBall(g, 'tennis', 0.9, 0.6, 2.6, -1.5); k.fx((dt, tm) => { tb.position.y = 1.3 + Math.abs(Math.sin(tm * 1.9)) * 2.6; tb.rotation.x = tm * 1.6; }); }, { labelH: 9 });
  }

  /* ================================================================== the kingdom itself: a set piece on every free spot */
  function scenery(k) {
    const { T, scene, height, reserved, fx } = k, K = KQRealms.kit(k); const { M, VC, BOX, CYL, SPH, CONE, put, halo } = K;
    const vc = VC({ roughness: 0.6 }), mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
    /* ---- the winners' podium: gold, silver and bronze blocks with stars, three flags on tall poles, a rack of medals (north-west) ---- */
    { const x0 = -32, z0 = -14, P = []; reserved.push([x0, z0, 7]);
      P.push({ g: BOX, m: M(0, 1.5, 0, 0, 0, 0, 2.4, 3.0, 2.4), c: 0xf4c430 }, { g: BOX, m: M(-2.45, 1.0, 0.25, 0, 0, 0, 2.4, 2.0, 2.4), c: 0xc8ccd4 }, { g: BOX, m: M(2.45, 0.7, 0.25, 0, 0, 0, 2.4, 1.4, 2.4), c: 0xc8844a });
      for (const [x, y, z] of [[0, 1.9, 1.21], [-2.45, 1.3, 1.46], [2.45, 0.95, 1.46]]) P.push({ g: new T.CircleGeometry(0.45, 5), m: M(x, y, z, 0, 0, PI / 2), c: 0xffffff });
      for (const [x, h] of [[-2.6, 5.8], [0, 7.0], [2.6, 5.2]]) P.push({ g: CYL, m: M(x, h / 2, -2.2, 0, 0, 0, 0.12, h, 0.12), c: 0xe8ecf0 });
      P.push({ g: BOX, m: M(5.2, 1.4, -1.0, 0, 0, 0, 0.14, 2.8, 0.14), c: 0x8a6a44 }, { g: BOX, m: M(7.0, 1.4, -1.0, 0, 0, 0, 0.14, 2.8, 0.14), c: 0x8a6a44 }, { g: BOX, m: M(6.1, 2.75, -1.0, 0, 0, 0, 2.0, 0.14, 0.14), c: 0x8a6a44 });
      [[5.5, 0xf4c430], [6.1, 0xc8ccd4], [6.7, 0xc8844a]].forEach(([mx, col]) => { P.push({ g: BOX, m: M(mx, 2.25, -1.0, 0, 0, 0, 0.08, 0.9, 0.04), c: 0x2a6ae0 }, { g: CYL, m: M(mx, 1.65, -0.98, PI / 2, 0, 0, 0.44, 0.06, 0.44), c: col }); });
      const pod = put(P, vc, x0, z0, 0.3, 0.05, 4); const fl = [[-2.6, 5.8, 0xe8433a], [0, 7.0, 0x2a6ae0], [2.6, 5.2, 0xf4c21e]]; fl.forEach(([x, h, col]) => K.flag(pod, x + 0.06, h - 0.55, -2.2, 1.6, 1.0, mat(col, { side: T.DoubleSide, roughness: 0.6 }))); }
    /* ---- the running track: a red oval with white lanes round a green infield, hurdles on the straight, a finish line (south road) ---- */
    { const x0 = -3, z0 = 38, P = [], L = 6.4, R = 2.6, W = 1.8; reserved.push([x0, z0, 8]);
      for (const sd of [-1, 1]) { P.push({ g: BOX, m: M(0, 0.1, sd * (R + W / 2), 0, 0, 0, L, 0.2, W), c: 0xc8452a }); P.push({ g: new T.RingGeometry(R, R + W, 24, 1, sd > 0 ? -PI / 2 : PI / 2, PI), m: M(sd * L / 2, 0.21, 0, -PI / 2, 0, 0, 1, 1, 1), c: 0xc8452a }); P.push({ g: new T.CircleGeometry(R, 24, sd > 0 ? -PI / 2 : PI / 2, PI), m: M(sd * L / 2, 0.22, 0, -PI / 2, 0, 0, 1, 1, 1), c: 0x4f9a3e }); }
      P.push({ g: BOX, m: M(0, 0.12, 0, 0, 0, 0, L, 0.2, R * 2), c: 0x4f9a3e });
      for (const f of [0, 0.5, 1]) for (const sd of [-1, 1]) { const rr = R + f * W; P.push({ g: BOX, m: M(0, 0.215, sd * rr, 0, 0, 0, L, 0.02, 0.07), c: 0xffffff }); P.push({ g: new T.RingGeometry(rr - 0.035, rr + 0.035, 24, 1, sd > 0 ? -PI / 2 : PI / 2, PI), m: M(sd * L / 2, 0.23, 0, -PI / 2, 0, 0, 1, 1, 1), c: 0xffffff }); }
      P.push({ g: BOX, m: M(0.6, 0.225, R + W / 2, 0, 0, 0, 0.18, 0.02, W), c: 0xffffff });
      for (const hx of [-2, 0, 2]) for (const lane of [0.45, 1.35]) { const hz = R + lane; P.push({ g: BOX, m: M(hx - 0.25, 0.55, hz - 0.3, 0, 0, 0, 0.06, 0.7, 0.06), c: 0xf4f4f4 }, { g: BOX, m: M(hx - 0.25, 0.55, hz + 0.3, 0, 0, 0, 0.06, 0.7, 0.06), c: 0xf4f4f4 }, { g: BOX, m: M(hx - 0.25, 0.86, hz, 0, 0, 0, 0.08, 0.14, 0.7), c: [0x1a1a1a, 0xffffff][lane > 1 ? 1 : 0] }); }
      put(P, vc, x0, z0, 0.1, 0.02, 6); }
    /* ---- the trophy fountain at the end of the castle road: a giant golden cup turning in a pool, with jets round it ---- */
    { const x0 = 6, z0 = 20; reserved.push([x0, z0, 4.5]); const gy = height(x0, z0), g = new T.Group(); g.position.set(x0, gy, z0); scene.add(g);
      const rim = new T.Mesh(new T.CylinderGeometry(3.2, 3.4, 0.6, 32), mat(0xfff8ee)); rim.position.y = 0.3; rim.castShadow = rim.receiveShadow = true; g.add(rim); const water = new T.Mesh(new T.CircleGeometry(2.9, 32), new T.MeshStandardMaterial({ color: 0x8ad0f0, roughness: 0.1, emissive: 0x3a8ac8, emissiveIntensity: 0.35 })); water.rotation.x = -PI / 2; water.position.y = 0.61; g.add(water);
      const ped = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 1.4, 16), mat(0x2a2e38, { roughness: 0.4 })); ped.position.y = 1.2; g.add(ped);
      const gold = mat(0xf4c430, { metalness: 0.9, roughness: 0.25 }), cup = new T.Group(); cup.position.y = 1.9; g.add(cup); const prof = [[0.001, 0], [0.8, 0], [0.8, 0.2], [0.3, 0.35], [0.2, 1.1], [0.42, 1.35], [1.05, 1.75], [1.2, 2.6], [1.14, 2.66], [0.001, 2.5]];
      const body = new T.Mesh(new T.LatheGeometry(prof.map(p => new T.Vector2(p[0], p[1])), 32), gold); body.castShadow = true; cup.add(body); for (const sd of [-1, 1]) { const h = new T.Mesh(new T.TorusGeometry(0.5, 0.09, 8, 20, PI * 1.2), gold); h.position.set(sd * 1.25, 2.05, 0); h.rotation.z = sd > 0 ? -PI * 0.6 : PI * 0.4; cup.add(h); }
      const jets = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; jets.push(halo(g, 0xdff4ff, 0.8, Math.cos(a) * 2.3, 1.0, Math.sin(a) * 2.3, 0.6)); }
      fx((dt, tm) => { cup.rotation.y = tm * 0.4; jets.forEach((j, i) => { const u = (tm * 0.9 + i / 8) % 1; j.position.y = 0.8 + Math.sin(u * PI) * 1.7; j.material.opacity = 0.6 * Math.sin(u * PI); }); }); }
    /* ---- the swimming pool: lanes with red and white ropes, starting blocks at one end, a diving board and a ladder (south-east) ---- */
    { const x0 = 17, z0 = 33, P = []; reserved.push([x0, z0, 6]);
      P.push({ g: BOX, m: M(0, 0.2, 0, 0, 0, 0, 9.4, 0.4, 6.2), c: 0xf4f0e8 }, { g: BOX, m: M(0, 0.22, 0, 0, 0, 0, 8.2, 0.4, 5.0), c: 0x2a8ac8 });
      for (const lz of [-1.25, 0, 1.25]) for (let i = 0; i < 20; i++) P.push({ g: SPH, m: M(-4 + i * 0.42, 0.44, lz, 0, 0, 0, 0.16, 0.16, 0.16), c: i % 2 ? 0xffffff : 0xe8433a });
      for (const bz of [-1.9, -0.62, 0.62, 1.9]) P.push({ g: BOX, m: M(-4.4, 0.65, bz, 0, 0, 0, 0.5, 0.5, 0.5), c: 0xf4f4f4 }, { g: BOX, m: M(-4.4, 0.92, bz, 0, 0, 0, 0.52, 0.04, 0.52), c: 0x2a5ac8 });
      P.push({ g: BOX, m: M(4.6, 0.8, 1.6, 0, 0, 0, 0.5, 0.8, 0.5), c: 0x8a8f9a }, { g: BOX, m: M(3.4, 1.25, 1.6, 0, 0, 0, 2.6, 0.08, 0.5), c: 0x2a6ae0 });
      for (const lz of [-2.2, -1.8]) P.push({ g: CYL, m: M(4.2, 0.9, lz, 0, 0, 0, 0.06, 1.2, 0.06), c: 0xdfe4ea }); for (let r = 0; r < 3; r++) P.push({ g: CYL, m: M(4.2, 0.55 + r * 0.25, -2.0, PI / 2, 0, 0, 0.04, 0.4, 0.04), c: 0xdfe4ea });
      const pool = put(P, vc, x0, z0, -0.3, 0.1, 5); const water = new T.Mesh(new T.PlaneGeometry(8.1, 4.9), new T.MeshStandardMaterial({ color: 0x5ac0f0, roughness: 0.08, metalness: 0.1, emissive: 0x1a6aa0, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 })); water.rotation.x = -PI / 2; water.position.y = 0.43; pool.add(water);
      fx((dt, tm) => { water.material.emissiveIntensity = 0.35 + Math.sin(tm * 1.7) * 0.08; }); }
    /* ---- a blimp circles high over the kingdom, the way it does over a big match (stripes and fins, no writing) ---- */
    { const bl = new T.Group(); bl.scale.setScalar(0.8); scene.add(bl); const hull = new T.Mesh(new T.SphereGeometry(1, 28, 16), mat(0xf4f6f8, { roughness: 0.35, metalness: 0.1 })); hull.scale.set(5.2, 1.6, 1.6); bl.add(hull);
      for (const [x, col] of [[-1.2, 0xe8433a], [0, 0x2a6ae0], [1.2, 0xf4c21e]]) { const band = new T.Mesh(new T.CylinderGeometry(1, 1, 0.36, 28, 1, true), mat(col, { roughness: 0.5, side: T.DoubleSide })); const r = Math.sqrt(Math.max(0.05, 1 - (x / 5.2) * (x / 5.2))) * 1.61; band.scale.set(r, 1, r); band.rotation.z = PI / 2; band.position.x = x; bl.add(band); }
      for (let i = 0; i < 4; i++) { const fin = new T.Mesh(new T.BoxGeometry(1.4, 0.08, 1.2), mat(0x2a6ae0, { roughness: 0.5 })); fin.position.set(-4.4, 0, 0); fin.rotation.x = i * PI / 2; fin.translateZ(0.9); bl.add(fin); }
      const gon = new T.Mesh(new T.BoxGeometry(1.4, 0.45, 0.6), mat(0x2a2e38, { roughness: 0.5 })); gon.position.set(0.4, -1.75, 0); bl.add(gon); bl.traverse(o => { if (o.isMesh) o.castShadow = true; });
      fx((dt, tm) => { const a = tm * 0.07, R = 36; bl.position.set(Math.cos(a) * R, 31 + Math.sin(tm * 0.5) * 0.6, Math.sin(a) * R * 0.8 - 6); bl.rotation.y = Math.atan2(-Math.cos(a) * 0.8, -Math.sin(a)); }); }
    K.finish();
  }

  /* ================================================================== the words */
  const S = {
    en: {
      rg_goal: 'The Penalty Spot', rg_goal_b: 'Score past the keeper.', rg_goal_hi: 'Welcome to the stadium! The keeper is ready — are you?', rg_goal_how: 'Solve the puzzle, then pick the ball with the answer. The right one flies into the net.', rg_goal_q: 'Which ball?',
      rg_hoop: 'The Hoop', rg_hoop_b: 'Shoot the right ball.', rg_hoop_hi: 'Welcome to the arena! Every ball on the line has a number.', rg_hoop_how: 'Work it out, then pick the ball with the answer. The right one swishes through the hoop.', rg_hoop_q: 'Which shot?',
      rg_bat: 'The Home Run', rg_bat_b: 'Hit it out of the park.', rg_bat_hi: 'Welcome to the ballpark! Read carefully — every ball is an answer.', rg_bat_how: 'Read the question, then pick the ball with the right answer. The bat will send it over the fence.', rg_bat_q: 'Which ball?',
      rg_yard: 'The Goalposts', rg_yard_b: 'Kick it between the posts.', rg_yard_hi: 'Welcome to the gridiron! Every kick needs the right number.', rg_yard_how: 'Work it out, then pick the ball with the answer. The right kick sails between the posts.', rg_yard_q: 'Which kick?',
      rg_spike: 'The Beach Net', rg_spike_b: 'Spike the right spelling.', rg_spike_hi: 'Welcome to the beach! Each ball carries a spelling.', rg_spike_how: 'Read carefully and pick the ball that is spelled right. It gets spiked into the sand.', rg_spike_q: 'Which ball?',
      rg_ace: 'Center Court', rg_ace_b: 'Serve an ace.', rg_ace_hi: 'Welcome to center court! Every ball carries a word.', rg_ace_how: 'Pick the ball with the right word. The right serve is an ace.', rg_ace_q: 'Which serve?'
    },
    he: {
      rg_goal: 'נקודת הפנדל', rg_goal_b: 'מבקיעים מול השוער.', rg_goal_hi: 'ברוכים הבאים לאצטדיון! השוער מוכן — ואתם?', rg_goal_how: 'פותרים את החידה ובוחרים את הכדור עם התשובה. הכדור הנכון יעוף לרשת.', rg_goal_q: 'איזה כדור?',
      rg_hoop: 'הסל', rg_hoop_b: 'זורקים את הכדור הנכון.', rg_hoop_hi: 'ברוכים הבאים לאולם! לכל כדור על הקו יש מספר.', rg_hoop_how: 'מחשבים ובוחרים את הכדור עם התשובה. הכדור הנכון ייכנס לסל.', rg_hoop_q: 'איזו זריקה?',
      rg_bat: 'ההום ראן', rg_bat_b: 'חובטים אל מחוץ למגרש.', rg_bat_hi: 'ברוכים הבאים למגרש הבייסבול! קוראים בעיון — כל כדור הוא תשובה.', rg_bat_how: 'קוראים את השאלה ובוחרים את הכדור עם התשובה הנכונה. המחבט ישלח אותו מעל הגדר.', rg_bat_q: 'איזה כדור?',
      rg_yard: 'עמודי השער', rg_yard_b: 'בועטים בין העמודים.', rg_yard_hi: 'ברוכים הבאים למגרש הפוטבול! כל בעיטה צריכה את המספר הנכון.', rg_yard_how: 'מחשבים ובוחרים את הכדור עם התשובה. הבעיטה הנכונה תעבור בין העמודים.', rg_yard_q: 'איזו בעיטה?',
      rg_spike: 'רשת החוף', rg_spike_b: 'מנחיתים את האיות הנכון.', rg_spike_hi: 'ברוכים הבאים לחוף! על כל כדור כתוב איות.', rg_spike_how: 'קוראים בעיון ובוחרים את הכדור שכתוב נכון. הוא יונחת בחול.', rg_spike_q: 'איזה כדור?',
      rg_ace: 'המגרש המרכזי', rg_ace_b: 'מגישים אייס.', rg_ace_hi: 'ברוכים הבאים למגרש המרכזי! על כל כדור כתובה מילה.', rg_ace_how: 'בוחרים את הכדור עם המילה הנכונה. ההגשה הנכונה היא אייס.', rg_ace_q: 'איזו הגשה?'
    }
  };

  KQRealms.define('sports', {
    games: [
      { id: 'rg_goal', kind: 'logic', stage: 'goal', theme: 'sp_pitch', host: 'tower', icon: 'soccer' },
      { id: 'rg_hoop', kind: 'math', stage: 'hoop', theme: 'sp_court', host: 'bear', icon: 'basketball' },
      { id: 'rg_bat', kind: 'reading', stage: 'bat', theme: 'sp_park', host: 'fisher', icon: 'baseball' },
      { id: 'rg_yard', kind: 'math', stage: 'yard', theme: 'sp_field', host: 'troll', icon: 'football' },
      { id: 'rg_spike', kind: 'spelling', stage: 'spike', theme: 'sp_beach', host: 'frog', icon: 'volleyball' },
      { id: 'rg_ace', kind: 'reading', stage: 'ace', theme: 'sp_centre', host: 'owl', icon: 'tennisball' }
    ],
    strings: S, themes: THEMES, stages: STAGES, landmarks, scenery,
    gens: { rg_goal: goalQ, rg_hoop: hoopQ, rg_bat: batQ, rg_yard: yardQ, rg_spike: spikeQ, rg_ace: aceQ }
  });
})();
