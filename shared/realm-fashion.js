/* Kingdom Quest — THE FASHION KINGDOM (Yoni 2026-09-26: "a dress-up world … creating cute outfits, in multiple games, everything to
   do with clothes and accessories … mostly focused on measuring things — the geometry math, actually measuring the clothes to fit").
   Four games of its own (registered with KQRealms, played in rooms3d.js halls); every right answer dresses or adorns something:
     The Tailor's Tape   (math · measuring)  garments hang on the rail with their measurement: the one that fits flies onto the
                                             mannequin — one piece per right answer, until the outfit is complete
     The Fitting Room    (logic · sizes)     four curtained booths: the right curtain opens on a finished outfit
     The Pattern Table   (math · shapes)     four fabric pieces stand on the cutting table: the right one is snipped, stitched
                                             round and sewn into the patchwork quilt on the wall
     The Jewelry Box     (spelling · words)  four necklaces on the velvet board: the right one is fastened on the bust, a wrong
                                             string snaps and its beads bounce away
   Open to every player — styled for dress-up, never labelled by gender. Everything is built here from primitives. */
(function () {
  'use strict';
  if (!window.KQRealms) return;
  const PI = Math.PI, TAU = PI * 2;
  const one = v => String(Math.round(v * 100) / 100), an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  const four = (H, a, others) => H.shuffle([a].concat(H.shuffle(H.uniq(others.map(String).filter(o => o !== String(a)))).slice(0, 3)));

  /* ================================================================== the questions */
  /* ---- the Tailor's Tape: lengths in buttons, then the ruler, cm and m, trim all round, area, scale, shrinking, circles, inches ---- */
  function tapeQ(band, lang, H) {
    const { ri, pick, near, shuffle } = H, he = lang === 'he', k = Math.random();
    const mk = (q, a, step) => ({ q, a, ch: near(a, 4, step || 1) });
    if (band <= 1) {
      if (k < 0.4) { const a = ri(2, 6); let b = ri(2, 7); if (b === a) b++; const m = Math.max(a, b); return { q: he ? `הסרט באורך ${a} כפתורים. הצעיף באורך ${b} כפתורים. מה האורך של הארוך מביניהם?` : `The ribbon is ${a} buttons long. The scarf is ${b} buttons long. How long is the longer one?`, a: m, ch: four(H, m, [a, b, m + 1, m + 2, Math.max(1, m - 3)]) }; }
      if (k < 0.75) { const a = ri(2, 6), b = ri(1, 3); return mk(he ? `חגורה באורך ${a} כפתורים. מוסיפים לה עוד ${b}. מה האורך עכשיו?` : `A belt is ${a} buttons long. We add ${b} more. How long is it now?`, a + b); }
      const L = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4); return { q: he ? 'על איזה תג כתוב האורך הקצר ביותר?' : 'Which tag shows the shortest length?', a: Math.min(...L), ch: L }; }
    if (band === 2) {
      if (k < 0.35) { const s = ri(1, 6), L = ri(4, 12); return mk(he ? `על הסרגל, הסרט מתחיל ב-${s} ונגמר ב-${s + L}. מה האורך שלו בס״מ?` : `On the ruler the ribbon starts at ${s} and ends at ${s + L}. How many cm long is it?`, L); }
      if (k < 0.7) { const a = pick([20, 25, 30, 35, 40]), b = pick([5, 10, 15]); return mk(he ? `החצאית באורך ${a} ס״מ. תופרים לה עוד ${b} ס״מ של תחרה. מה האורך עכשיו?` : `The skirt is ${a} cm long. We sew on ${b} cm of lace. How long is it now?`, a + b, 5); }
      const a = pick([40, 50, 60, 70]), b = pick([10, 15, 20, 25]); return mk(he ? `חגורה באורך ${a} ס״מ. גוזרים ממנה ${b} ס״מ. כמה נשאר?` : `A belt is ${a} cm long. We cut off ${b} cm. How much is left?`, a - b, 5); }
    if (band === 3) {
      if (k < 0.3) { const m = ri(2, 5); return { q: he ? `במטר אחד יש 100 ס״מ. כמה ס״מ יש ב-${m} מטרים?` : `1 metre is 100 cm. How many cm are in ${m} metres?`, a: m * 100, ch: four(H, m * 100, [m * 10, m * 1000, m + 100, (m + 1) * 100]) }; }
      if (k < 0.55) { const s = ri(4, 12); return { q: he ? `לכיס מרובע יש צלעות של ${s} ס״מ. כמה סרט צריך כדי להקיף אותו?` : `A square pocket has sides of ${s} cm. How much trim goes all the way around it?`, a: 4 * s, ch: four(H, 4 * s, [2 * s, s * s, 3 * s, 4 * s + 4, s + 4]) }; }
      if (k < 0.8) { const per = pick([15, 20, 25, 30, 35, 45]), n = ri(2, 4); return mk(he ? `לכל פפיון צריך ${per} ס״מ של סרט. כמה ס״מ צריך ל-${n} פפיונים?` : `Each bow needs ${per} cm of ribbon. How much ribbon for ${n} bows?`, per * n, 5); }
      const a = pick([40, 60, 80, 90, 120]); return mk(he ? `צעיף באורך ${a} ס״מ נחתך לשני חצאים שווים. מה האורך של כל חצי?` : `A scarf ${a} cm long is cut into two equal halves. How long is each half?`, a / 2, 5); }
    if (band === 4) {
      if (k < 0.25) { const mm = pick([4, 6, 8, 12, 15, 25]), a = one(mm / 10); return { q: he ? `חרוז ברוחב ${mm} מ״מ. כמה ס״מ זה?` : `A bead is ${mm} mm wide. How many cm is that?`, a, ch: four(H, a, [mm, mm * 10, one(mm / 100), one(mm / 10 + 1)]) }; }
      if (k < 0.5) { const w = pick([60, 80, 90, 120]), h = pick([15, 20, 25, 30]); return { q: he ? `צעיף באורך ${w} ס״מ וברוחב ${h} ס״מ. מה השטח שלו בסמ״ר?` : `A scarf is ${w} cm long and ${h} cm wide. What is its area in cm²?`, a: w * h, ch: four(H, w * h, [2 * (w + h), w + h, w * h / 10, w * h + w]) }; }
      if (k < 0.75) { const w = pick([100, 120, 140, 160]), h = pick([60, 70, 80]); return { q: he ? `מפה באורך ${w} ס״מ וברוחב ${h} ס״מ. כמה תחרה צריך כדי להקיף אותה?` : `A tablecloth is ${w} cm by ${h} cm. How much lace goes all the way around it?`, a: 2 * (w + h), ch: four(H, 2 * (w + h), [w + h, w * h, 2 * w + h, 2 * (w + h) + 20]) }; }
      const p = pick([12, 14, 16, 18, 22, 24]); return { q: he ? `הגזרה משורטטת בחצי מהגודל: ${p} ס״מ על הנייר. מה האורך האמיתי?` : `The pattern is drawn at half size: ${p} cm on paper. How long is the real piece?`, a: p * 2, ch: four(H, p * 2, [p / 2, p, p * 3, p + 2]) }; }
    if (band === 5) {
      if (k < 0.3) { const L = pick([40, 60, 80, 100, 120]), p = pick([10, 20, 25]), a = L * (100 - p) / 100; return { q: he ? `הבד מתכווץ ב-${p}% בכביסה. חצאית באורך ${L} ס״מ — מה האורך שלה אחרי הכביסה?` : `The fabric shrinks by ${p}% in the wash. A skirt is ${L} cm long — how long is it after washing?`, a, ch: four(H, a, [L - p, L * p / 100, L + L * p / 100, a - 5]) }; }
      if (k < 0.6) { const n = pick([3, 4, 5, 10]), s = ri(3, 9); return { q: he ? `השרטוט בקנה מידה 1:${n}. השרוול בשרטוט באורך ${s} ס״מ. מה האורך שלו במציאות?` : `The sketch is at a scale of 1:${n}. The sleeve is ${s} cm on the sketch. How long is it really?`, a: s * n, ch: four(H, s * n, [s + n, s * n + n, Math.max(1, s * n - n), s * n * 2]) }; }
      const r = pick([5, 10, 15, 20]), a = one(2 * 3.14 * r); return { q: he ? `לסרט של כובע עגול יש רדיוס של ${r} ס״מ. מה האורך שלו? (π ≈ 3.14)` : `A round hat band has a radius of ${r} cm. How long is it? (π ≈ 3.14)`, a, ch: four(H, a, [one(3.14 * r), one(3.14 * r * r), 2 * r, one(2 * 3.14 * r + 3.14)]) }; }
    if (k < 0.3) { const inch = pick([4, 6, 8, 10, 12, 20]), a = one(inch * 2.54); return { q: he ? `אינץ׳ אחד = 2.54 ס״מ. כמה ס״מ אורכו של רוכסן של ${inch} אינץ׳?` : `1 inch = 2.54 cm. How many cm long is a ${inch}-inch zipper?`, a, ch: four(H, a, [one(inch / 2.54), one(inch + 2.54), inch * 254, one(inch * 2.5)]) }; }
    if (k < 0.65) { const [p, q, r] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]), m = pick([5, 10]), A = p * m, B = q * m, C = r * m; return { q: he ? `צעיף נגזר ממלבן של ${A} ס״מ על ${B} ס״מ, מפינה לפינה. מה אורך החיתוך?` : `A scarf is cut from a ${A} cm by ${B} cm rectangle, corner to corner. How long is the cut?`, a: C, ch: four(H, C, [A + B, Math.round((A + B) / 2), A * B / 2, C + m]) }; }
    const r = pick([10, 20, 30, 40]), a = one(3.14 * r * r); return { q: he ? `למפה עגולה יש רדיוס של ${r} ס״מ. מה השטח שלה? (π ≈ 3.14)` : `A round tablecloth has a radius of ${r} cm. What is its area? (π ≈ 3.14)`, a, ch: four(H, a, [one(2 * 3.14 * r), one(3.14 * r), r * r, one(3.14 * r * r * 2)]) };
  }

  /* ---- the Fitting Room: what goes where, sizes and size charts, outfits to count, patterns, who wears what ---- */
  const CLO = { en: ['hat', 'sock', 'shoe', 'scarf', 'glove', 'boot'], he: ['כובע', 'גרב', 'נעל', 'צעיף', 'כפפה', 'מגף'] };
  const BODY = { en: [['hat', 'head'], ['glove', 'hand'], ['scarf', 'neck'], ['sock', 'foot'], ['belt', 'waist'], ['ring', 'finger']], he: [['כובע', 'ראש'], ['כפפה', 'יד'], ['צעיף', 'צוואר'], ['גרב', 'רגל'], ['חגורה', 'מותניים'], ['טבעת', 'אצבע']] };
  const KIDS = { en: [['Mia', 'Ben', 'Tom'], ['Noa', 'Dan', 'Lia'], ['Ava', 'Sam', 'Ella']], he: [['מיה', 'בן', 'תום'], ['נועה', 'דן', 'ליה'], ['אווה', 'סאם', 'אלה']] };
  const COL = { en: ['red', 'blue', 'green', 'yellow', 'pink', 'purple'], he: ['אדום', 'כחול', 'ירוק', 'צהוב', 'ורוד', 'סגול'] };
  const ORD = { en: { 7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th' }, he: { 7: 'השביעי', 8: 'השמיני', 9: 'התשיעי', 10: 'העשירי', 11: 'האחד עשר', 12: 'השנים עשר' } };
  function fitQ(band, lang, H) {
    const { ri, pick, shuffle } = H, he = lang === 'he', L = he ? 'he' : 'en', k = Math.random(), NEXT = he ? 'מה בא אחר כך?' : 'What comes next?';
    if (band <= 1) {
      if (k < 0.5) { const [a, b, c, d] = shuffle(CLO[L]), seq = k < 0.25 ? [a, b, a, b, a, b] : [a, b, b, a, b, b, a]; return { q: `${NEXT} ${seq.join(', ')}, ?`, a: seq.length === 6 ? a : b, ch: shuffle([a, b, c, d]) }; }
      const it = pick(BODY[L]); return { q: he ? `על איזה חלק בגוף שמים ${it[0]}?` : `Where on your body does a ${it[0]} go?`, a: it[1], ch: shuffle([it[1]].concat(shuffle(BODY[L].filter(x => x !== it)).slice(0, 3).map(x => x[1]))) }; }
    if (band === 2) {
      if (k < 0.35) { const big = Math.random() < 0.5; return { q: he ? (big ? 'איזו מידה הכי גדולה?' : 'איזו מידה הכי קטנה?') : (big ? 'Which size is the biggest?' : 'Which size is the smallest?'), a: big ? 'XL' : 'S', ch: shuffle(['S', 'M', 'L', 'XL']) }; }
      if (k < 0.7) { const age = ri(4, 9), sz = age <= 5 ? 'S' : age <= 7 ? 'M' : 'L', kid = pick([['Noa', 'נועה', 'בת'], ['Dan', 'דן', 'בן'], ['Ella', 'אלה', 'בת'], ['Tom', 'תום', 'בן']]);
        return { q: he ? `מידה S מתאימה לגילאי 4–5, מידה M לגילאי 6–7, ומידה L לגילאי 8–9. ${kid[1]} ${kid[2]} ${age}. איזו מידה מתאימה?` : `Size S fits ages 4–5, M fits 6–7 and L fits 8–9. ${kid[0]} is ${age}. Which size fits?`, a: sz, ch: shuffle(['S', 'M', 'L', 'XL']) }; }
      const K = pick(KIDS[L]), sz = shuffle([ri(26, 28), ri(29, 31), ri(32, 34)]), mx = sz.indexOf(Math.max(...sz));
      return { q: he ? `הנעל של ${K[0]} במידה ${sz[0]}, של ${K[1]} במידה ${sz[1]}, ושל ${K[2]} במידה ${sz[2]}. של מי הנעל הכי גדולה?` : `${K[0]}'s shoe is size ${sz[0]}, ${K[1]}'s is size ${sz[1]} and ${K[2]}'s is size ${sz[2]}. Whose shoe is the biggest?`, a: K[mx], ch: shuffle(K.concat([he ? 'כולן שוות' : 'All the same'])) }; }
    if (band === 3) {
      if (k < 0.45) { const a = ri(2, 4), b = ri(2, 5), n = a * b; return { q: he ? `יש ${a} חולצות ו-${b} חצאיות. כמה תלבושות שונות אפשר להרכיב (חולצה אחת וחצאית אחת)?` : `There are ${a} shirts and ${b} skirts. How many different outfits can you make (one shirt and one skirt)?`, a: n, ch: four(H, n, [a + b, n + 1, n - 1, n + a, 2 * n]) }; }
      if (k < 0.8) { const [c1, c2] = shuffle(COL[L]).slice(0, 2), nth = ri(7, 12), ans = nth % 2 ? c1 : c2, o = shuffle(COL[L].filter(x => x !== c1 && x !== c2)).slice(0, 2);
        return { q: he ? `הכובעים מסודרים כך: ${c1}, ${c2}, ${c1}, ${c2}… מה הצבע של הכובע ${ORD.he[nth]}?` : `The hats go ${c1}, ${c2}, ${c1}, ${c2}… What colour is the ${ORD.en[nth]} hat?`, a: ans, ch: shuffle([c1, c2].concat(o)) }; }
      return { q: `${NEXT} XS, S, M, L, ?`, a: 'XL', ch: shuffle(['XL', 'XS', 'M', 'XXS']) }; }
    if (band === 4) {
      if (k < 0.5) { const K = shuffle(pick(KIDS[L])), C3 = shuffle(COL[L]).slice(0, 3);   /* K[i] wears C3[i]: the clues pin it down */
        return { q: he ? `ל${K[0]}, ל${K[1]} ול${K[2]} יש צעיפים בשלושה צבעים: ${C3.join(', ')} — לכל אחד צבע אחר. הצעיף של ${K[0]} לא ${C3[1]} ולא ${C3[2]}. הצעיף של ${K[1]} לא ${C3[2]}. למי יש צעיף ${C3[2]}?` : `${K[0]}, ${K[1]} and ${K[2]} each have a scarf: ${C3.join(', ')} — all different. ${K[0]}'s scarf is not ${C3[1]} or ${C3[2]}. ${K[1]}'s scarf is not ${C3[2]}. Who has the ${C3[2]} scarf?`, a: K[2], ch: shuffle(K.concat([he ? 'אי אפשר לדעת' : "Can't tell"])) }; }
      const it = pick([['M', 71, 76], ['L', 77, 82], ['XL', 83, 88]]), v = ri(it[1], it[2]);
      return { q: he ? `מידה M: היקף חזה 71–76 ס״מ. מידה L: ‏77–82 ס״מ. מידה XL: ‏83–88 ס״מ. לאיזו מידה מתאים היקף חזה של ${v} ס״מ?` : `Size M is for a chest of 71–76 cm, L for 77–82 cm and XL for 83–88 cm. Which size fits a chest of ${v} cm?`, a: it[0], ch: shuffle(['S', 'M', 'L', 'XL']) }; }
    if (band === 5) {
      if (k < 0.45) { const a = ri(2, 5), b = ri(2, 4), c = ri(2, 3), n = a * b * c; return { q: he ? `יש ${a} חולצות, ${b} מכנסיים ו-${c} כובעים. כמה תלבושות שונות אפשר להרכיב (אחד מכל סוג)?` : `There are ${a} shirts, ${b} pairs of trousers and ${c} hats. How many different outfits (one of each)?`, a: n, ch: four(H, n, [a + b + c, a * b + c, n + a, n * 2, a * b]) }; }
      const f = pick([16, 18, 20, 22, 24, 26]), s = f * 1.5 + 2; return { q: he ? `מידת נעל ≈ אורך כף הרגל (בס״מ) × 1.5 + 2. לכף רגל באורך ${f} ס״מ מתאימה מידה…` : `Shoe size ≈ foot length (cm) × 1.5 + 2. A foot ${f} cm long needs size…`, a: s, ch: four(H, s, [s + 2, s - 2, f * 1.5, f + 2, s + 3]) }; }
    if (k < 0.4) { const a = ri(3, 6), b = ri(3, 5), n = a * b - 1; return { q: he ? `יש ${a} חולצות ו-${b} חצאיות, אבל החולצה הירוקה אף פעם לא הולכת עם החצאית הוורודה. כמה תלבושות שונות אפשר להרכיב?` : `There are ${a} shirts and ${b} skirts, but the green shirt never goes with the pink skirt. How many different outfits?`, a: n, ch: four(H, n, [a * b, a + b, n - 1, a * b - 2, (a - 1) * (b - 1)]) }; }
    if (k < 0.72) { const n = ri(4, 7), c = n * (n - 1) / 2; return { q: he ? `אפשר לקחת לטיול 2 מתוך ${n} צעיפים. כמה זוגות שונים אפשר לבחור?` : `You may take 2 of your ${n} scarves on a trip. How many different pairs can you choose?`, a: c, ch: four(H, c, [n * (n - 1), 2 * n, n + 2, c + 1, c - 1]) }; }
    const n = ri(3, 5), f = [1, 1, 2, 6, 24, 120][n]; return { q: he ? `${n} בובות עולות למסלול זו אחרי זו. בכמה סדרים שונים אפשר לסדר אותן?` : `${n} dolls walk the runway one after another. In how many different orders can they go?`, a: f, ch: four(H, f, [n * n, n * (n - 1), 2 * n, f / 2, f + n]) };
  }

  /* ---- the Pattern Table: shapes, sides and corners, symmetry, perimeter, area, angles, circles, the diagonal, scaling ---- */
  const SHP = { en: { tri: 'triangle', sq: 'square', circ: 'circle', rect: 'rectangle', pent: 'pentagon', hex: 'hexagon', oct: 'octagon' }, he: { tri: 'משולש', sq: 'ריבוע', circ: 'עיגול', rect: 'מלבן', pent: 'מחומש', hex: 'משושה', oct: 'מתומן' } };
  function cutQ(band, lang, H) {
    const { ri, pick, shuffle, near } = H, he = lang === 'he', S = SHP[he ? 'he' : 'en'], k = Math.random(), deg = v => v + '°';
    if (band <= 1) {
      if (k < 0.55) { const it = pick([['tri', 'Which shape has 3 sides?', 'לאיזו צורה יש 3 צלעות?'], ['sq', 'Which shape has 4 equal sides?', 'לאיזו צורה יש 4 צלעות שוות?'], ['circ', 'Which shape is round like a button?', 'איזו צורה עגולה כמו כפתור?'], ['rect', 'Which shape is long, with 4 corners?', 'איזו צורה ארוכה ויש לה 4 פינות?']]);
        return { q: he ? it[2] : it[1], a: S[it[0]], ch: shuffle([S.tri, S.sq, S.circ, S.rect]) }; }
      const it = pick([['tri', 3], ['sq', 4], ['rect', 4]]); return { q: he ? `כמה צלעות יש ל${S[it[0]]}?` : `How many sides does ${an(S[it[0]])} have?`, a: it[1], ch: near(it[1], 4, 1) }; }
    if (band === 2) {
      if (k < 0.4) { const it = pick([['pent', 5], ['hex', 6], ['oct', 8]]); return { q: he ? `כמה פינות יש ל${S[it[0]]}?` : `How many corners does ${an(S[it[0]])} have?`, a: it[1], ch: near(it[1], 4, 1) }; }
      if (k < 0.7) { const it = pick([['A rectangle label has how many right angles?', 'לתווית בצורת מלבן יש כמה זוויות ישרות?', 4], ['A square patch has how many right angles?', 'לטלאי בצורת ריבוע יש כמה זוויות ישרות?', 4], ['A triangle patch with one square corner has how many right angles?', 'לטלאי משולש עם פינה ישרה אחת יש כמה זוויות ישרות?', 1]]); return { q: he ? it[1] : it[0], a: it[2], ch: shuffle([1, 2, 3, 4]) }; }
      const it = pick([['How many lines of symmetry does a square napkin have?', 'כמה קווי סימטריה יש למפית בצורת ריבוע?', 4], ['How many lines of symmetry does a rectangle napkin have?', 'כמה קווי סימטריה יש למפית בצורת מלבן?', 2], ['How many lines of symmetry does a triangle napkin with 3 equal sides have?', 'כמה קווי סימטריה יש למפית בצורת משולש שווה צלעות?', 3]]); return { q: he ? it[1] : it[0], a: it[2], ch: shuffle([1, 2, 3, 4]) }; }
    if (band === 3) {
      if (k < 0.5) { const w = ri(5, 12), h = ri(2, w - 1); return { q: he ? `טלאי בצורת מלבן, ${w} ס״מ על ${h} ס״מ. כמה סרט צריך כדי להקיף אותו?` : `A rectangle patch is ${w} cm by ${h} cm. How much ribbon goes all the way around it?`, a: 2 * (w + h), ch: four(H, 2 * (w + h), [w + h, w * h, 2 * w + h, 2 * (w + h) + 2]) }; }
      if (k < 0.8) { const a = ri(3, 9), b = ri(3, 9), c = ri(Math.abs(a - b) + 1, a + b - 1); return { q: he ? `לטלאי משולש יש צלעות של ${a}, ${b} ו-${c} ס״מ. מה ההיקף שלו?` : `A triangle patch has sides of ${a}, ${b} and ${c} cm. What is its perimeter?`, a: a + b + c, ch: near(a + b + c, 4, 1) }; }
      const s = ri(3, 9); return { q: he ? `לטלאי בצורת משושה משוכלל יש צלעות של ${s} ס״מ. מה ההיקף שלו?` : `A regular hexagon patch has sides of ${s} cm. What is its perimeter?`, a: 6 * s, ch: four(H, 6 * s, [5 * s, 4 * s, s * s, 6 * s + 6]) }; }
    if (band === 4) {
      if (k < 0.35) { const w = ri(4, 15), h = ri(3, 12); return { q: he ? `טלאי מלבני ${w} ס״מ על ${h} ס״מ. מה השטח שלו בסמ״ר?` : `A rectangle patch is ${w} cm by ${h} cm. What is its area in cm²?`, a: w * h, ch: four(H, w * h, [2 * (w + h), w + h, w * h + w, w * h - h]) }; }
      if (k < 0.7) { const b = 2 * ri(3, 10), h = ri(3, 12); return { q: he ? `לטלאי משולש יש בסיס של ${b} ס״מ וגובה של ${h} ס״מ. מה השטח שלו?` : `A triangle patch has a base of ${b} cm and a height of ${h} cm. What is its area?`, a: b * h / 2, ch: four(H, b * h / 2, [b * h, b + h, b * h / 2 + b, 2 * (b + h)]) }; }
      const a = pick([30, 40, 45, 50, 60, 70, 80]), b = pick([30, 40, 50, 60, 90].filter(x => a + x < 170)), c = 180 - a - b; return { q: he ? `בטלאי משולש שתי זוויות הן ${a}° ו-${b}°. מה הזווית השלישית?` : `Two angles of a triangle patch are ${a}° and ${b}°. What is the third angle?`, a: deg(c), ch: four(H, deg(c), [360 - a - b, Math.abs(90 - c), c + 10, c - 10, a + b].map(deg)) }; }
    if (band === 5) {
      if (k < 0.35) { const d = pick([2, 4, 6, 10, 20]), a = one(3.14 * d); return { q: he ? `לטלאי עגול יש קוטר של ${d} ס״מ. מה ההיקף שלו? (π ≈ 3.14)` : `A round patch has a diameter of ${d} cm. What is its circumference? (π ≈ 3.14)`, a, ch: four(H, a, [one(3.14 * d * 2), one(3.14 * d * d / 4), d * 3, one(3.14 * d / 2)]) }; }
      if (k < 0.7) { const it = pick([['sq', 90], ['pent', 108], ['hex', 120], ['oct', 135]]); return { q: he ? `כמה מעלות יש בכל זווית של ${S[it[0]]} משוכלל?` : `How many degrees is each angle of a regular ${S[it[0]]}?`, a: deg(it[1]), ch: four(H, deg(it[1]), [60, 90, 108, 120, 135, 150].map(deg)) }; }
      const r = pick([2, 3, 4, 5, 10]), a = one(3.14 * r * r); return { q: he ? `לטלאי עגול יש רדיוס של ${r} ס״מ. מה השטח שלו? (π ≈ 3.14)` : `A round patch has a radius of ${r} cm. What is its area? (π ≈ 3.14)`, a, ch: four(H, a, [one(2 * 3.14 * r), one(3.14 * r), r * r, one(3.14 * r * r * 2)]) }; }
    if (k < 0.4) { const [p, q, r] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]); return { q: he ? `טלאי מלבני ${p} ס״מ על ${q} ס״מ. מה אורך האלכסון שלו?` : `A rectangle patch is ${p} cm by ${q} cm. How long is its diagonal?`, a: r, ch: four(H, r, [p + q, q + 1, Math.round(Math.sqrt(p * q)), r + 2, p * q / 2]) }; }
    if (k < 0.7) { const s = pick([2, 3, 4, 5]); return { q: he ? `מגדילים טלאי פי ${s}: כל צלע גדלה פי ${s}. פי כמה גדל השטח?` : `A patch is enlarged ${s} times: every side becomes ${s} times longer. How many times bigger is the area?`, a: s * s, ch: four(H, s * s, [s, 2 * s, s * s * s, s + s * s]) }; }
    const W = pick([10, 12, 14]), Hh = pick([6, 8]), cw = pick([3, 4]), chh = pick([2, 3]), A = W * Hh - cw * chh; return { q: he ? `טלאי בצורת L: מלבן של ${W} על ${Hh} ס״מ, שנגזרה ממנו פינה של ${cw} על ${chh} ס״מ. מה השטח שלו?` : `An L-shaped patch: a ${W} by ${Hh} cm rectangle with a ${cw} by ${chh} cm corner cut out. What is its area?`, a: A, ch: four(H, A, [W * Hh, W * Hh + cw * chh, 2 * (W + Hh), A - cw]) };
  }

  /* ---- the Jewelry Box: spell the pictured item, then what it is, spelling traps, compound words, word families ---- */
  const PIC = {
    en: [[['hat', 'tophat'], ['cap', 'cap'], ['socks', 'socks'], ['shoe', 'sneaker'], ['bag', 'purse'], ['ring', 'ring'], ['bow', 'bow'], ['crown', 'crown'], ['tag', 'tag']],
         [['gloves', 'gloves'], ['shirt', 'shirt'], ['jeans', 'jeans'], ['scissors', 'scissors'], ['thread', 'thread'], ['ruler', 'ruler'], ['purse', 'purse'], ['diamond', 'gem'], ['sneaker', 'sneaker']]],
    he: [[['כובע', 'cap'], ['גרביים', 'socks'], ['נעל', 'sneaker'], ['תיק', 'purse'], ['טבעת', 'ring'], ['כתר', 'crown'], ['פפיון', 'bow'], ['תווית', 'tag'], ['מגבעת', 'tophat']],
         [['כפפות', 'gloves'], ['חולצה', 'shirt'], ['מכנסיים', 'jeans'], ['מספריים', 'scissors'], ['חוט', 'thread'], ['סרגל', 'ruler'], ['ארנק', 'purse'], ['יהלום', 'gem'], ['נעלי ספורט', 'sneaker']]]
  };
  const DEF = {
    en: [['necklace', 'You wear it around your neck, often with beads.'], ['bracelet', 'You wear it around your wrist.'], ['belt', 'It holds your trousers up at the waist.'], ['scarf', 'You wrap it around your neck when it is cold.'], ['gloves', 'They keep your hands warm.'], ['apron', 'You wear it over your clothes when you cook.'], ['pocket', 'A little bag sewn into your clothes.'], ['zipper', 'It closes a coat with tiny teeth.'], ['button', 'A small round thing that closes a shirt.'], ['sleeve', 'The part of a shirt that covers your arm.'], ['collar', 'The part of a shirt that goes around your neck.']],
    he: [['שרשרת', 'עונדים אותה סביב הצוואר, לפעמים עם חרוזים.'], ['צמיד', 'עונדים אותו על פרק היד.'], ['חגורה', 'היא מחזיקה את המכנסיים במותניים.'], ['צעיף', 'כורכים אותו סביב הצוואר כשקר.'], ['כפפות', 'הן שומרות על הידיים חמות.'], ['סינר', 'לובשים אותו מעל הבגדים כשמבשלים.'], ['כיס', 'שקית קטנה שתפורה לבגד.'], ['רוכסן', 'הוא סוגר מעיל בשיניים קטנות.'], ['כפתור', 'דבר קטן ועגול שסוגר חולצה.'], ['שרוול', 'החלק בחולצה שמכסה את היד.'], ['צווארון', 'החלק בחולצה שמסביב לצוואר.']]
  };
  const TRAPS = { necklace: ['neckless', 'necklase'], bracelet: ['braclet', 'bracelit'], button: ['buton', 'buttun'], zipper: ['ziper', 'zippor'], pocket: ['pockit', 'poket'], sleeve: ['sleve', 'sleave'], collar: ['coller', 'colar'], apron: ['apren', 'aprun'], gloves: ['gluves', 'glovs'], scarf: ['scarff', 'skarf'], belt: ['bellt', 'belte'] };
  const COMP = {
    en: [['sun + glasses', 'sunglasses', ['sun glasses', 'sunglases', 'sunnglasses']], ['rain + coat', 'raincoat', ['rain coat', 'raincote', 'rainecoat']], ['neck + lace', 'necklace', ['neckless', 'neck lace', 'necklase']], ['wrist + watch', 'wristwatch', ['wrist watch', 'ristwatch', 'wristwach']], ['back + pack', 'backpack', ['back pack', 'bakpack', 'backpak']], ['ear + ring', 'earring', ['ear ring', 'earing', 'earringe']], ['hand + bag', 'handbag', ['hand bag', 'handbagg', 'hanbag']], ['shoe + lace', 'shoelace', ['shoe lace', 'shoelase', 'shooelace']], ['night + gown', 'nightgown', ['night gown', 'nitegown', 'nightgowne']], ['sweat + shirt', 'sweatshirt', ['sweat shirt', 'swetshirt', 'sweatshert']]],
    he: [['משקפיים + שמש', 'משקפי שמש', ['משקפיים שמש', 'משקפים שמש', 'משקף שמש']], ['נעליים + ספורט', 'נעלי ספורט', ['נעליים ספורט', 'נעלים ספורט', 'נעלת ספורט']], ['בגדים + ים', 'בגדי ים', ['בגדים ים', 'בגדיים ים', 'בגד ימים']], ['נעליים + בית', 'נעלי בית', ['נעליים בית', 'נעלים בית', 'נעלת בית']], ['שמלה + ערב', 'שמלת ערב', ['שמלה ערב', 'שמלי ערב', 'שמלות ערבה']], ['חגורה + עור', 'חגורת עור', ['חגורה עור', 'חגורי עור', 'חגורות עורה']], ['כפפות + צמר', 'כפפות צמר', ['כפפי צמר', 'כפפת צמרים', 'כפפותי צמר']], ['טבעת + זהב', 'טבעת זהב', ['טבעתי זהב', 'טבעות זהבה', 'טבעה זהב']], ['מעילים + גשם', 'מעילי גשם', ['מעילים גשם', 'מעילות גשם', 'מעילת גשם']], ['שרשרת + פנינים', 'שרשרת פנינים', ['שרשרתי פנינים', 'שרשרה פנינים', 'שרשרות פנינים']]]
  };
  const FAM = {
    en: [['fashion → in fashion: ___', 'fashionable', ['fashionful', 'fashionly', 'fashionous']], ['style → full of style: ___', 'stylish', ['styleful', 'stylly', 'stylous']], ['elegant → the noun: ___', 'elegance', ['elegantness', 'elegantion', 'elegantry']], ['embroider → the craft: ___', 'embroidery', ['embroidment', 'embroideration', 'embroidance']], ['design → a person who designs: ___', 'designer', ['designist', 'designor', 'designian']], ['decorate → the noun: ___', 'decoration', ['decoratement', 'decoratery', 'decorance']], ['comfort → the adjective: ___', 'comfortable', ['comfortful', 'comfortly', 'comfortous']], ['tailor → made to fit: ___', 'tailored', ['tailorish', 'tailorly', 'tailorous']]],
    he: [['מהשורש ת-פ-ר: מי שתופרת בגדים היא ___', 'תופרת', ['תפרנית', 'תופרנית', 'תפרית']], ['מהשורש ר-ק-ם: עבודת יד בחוטים צבעוניים היא ___', 'רקמה', ['ריקמון', 'רקמיה', 'מרקמת']], ['מהשורש ס-ר-ג: צעיף שעשו במסרגות הוא צעיף ___', 'סרוג', ['סרגני', 'סרגוג', 'מסרגי']], ['מהשורש א-פ-נ: בגד לפי האופנה הוא בגד ___', 'אופנתי', ['אופניים', 'אופנאי', 'אופנני']], ['מהשורש ע-צ-ב: מי שמעצב בגדים הוא ___', 'מעצב', ['עצבן', 'מעוצב', 'עציב']], ['מהשורש ק-ש-ט: מה ששמים כדי לייפות, כמו סרט או סיכה, הוא ___', 'קישוט', ['קשטון', 'מקשטה', 'קשטית']], ['מהשורש מ-ד-ד: כשבודקים אם בגד מתאים, עושים ___', 'מדידה', ['מדדון', 'מודדות', 'מדידון']], ['מהשורש ג-ז-ר: הדף שלפיו גוזרים בד הוא ___', 'גזרה', ['גזרון', 'מגזרת', 'גזריה']]]
  };
  function beadQ(band, lang, H) {
    const { pick, shuffle, misspell } = H, he = lang === 'he', L = he ? 'he' : 'en';
    if (band <= 2) { const pool = band <= 1 ? PIC[L][0] : PIC[L][0].concat(PIC[L][1]), it = pick(pool), w = it[0];
      return { q: he ? 'איזו שרשרת מאייתת נכון את מה שבתמונה?' : 'Which necklace spells the picture right?', a: w, ch: shuffle([w].concat(misspell(w, he, 3))), icon: it[1] }; }
    if (band === 3) { const it = pick(DEF[L]), others = shuffle(DEF[L].filter(x => x !== it)).slice(0, 3).map(x => x[0]); return { q: (he ? 'מה זה? ' : 'What is it? ') + it[1], a: it[0], ch: shuffle([it[0]].concat(others)) }; }
    if (band === 4) { const it = pick(DEF[L]), w = it[0], traps = !he && TRAPS[w] ? TRAPS[w].slice() : []; const ch = [w].concat(traps); for (const m of misspell(w, he, 4)) { if (ch.length >= 4) break; if (!ch.includes(m)) ch.push(m); }
      return { q: (he ? 'איזה איות נכון? ' : 'Which spelling is right? ') + it[1], a: w, ch: shuffle(ch.slice(0, 4)) }; }
    if (band === 5) { const it = pick(COMP[L]); return { q: he ? `${it[0]} = ? (איך כותבים את הצירוף?)` : `${it[0]} = ? (how is the word written?)`, a: it[1], ch: shuffle([it[1]].concat(it[2])) }; }
    const it = pick(FAM[L]); return { q: it[0], a: it[1], ch: shuffle([it[1]].concat(it[2])) };
  }

  /* ================================================================== shared 3D pieces */
  const place = (c, o, wide, tall) => { if (!o) return; const narrow = c.camera.aspect < 1.05, p = narrow ? tall : wide; o.position.set(p[0], p[1], p[2]); o.rotation.y = p[3]; };   /* portrait phones: the mannequin / bust comes to the empty floor in front, where it can be seen */
  const lay = (c, sp) => { const narrow = c.camera.aspect < 1.05; return { k: narrow ? 0.85 : 1, sp: sp * (narrow ? 0.72 : 1) }; };
  const PASTEL = [0xff8fb8, 0x8fd0f0, 0xc0a0ff, 0xffcf6a, 0x7fdcb0, 0xff9f90];
  const V2 = (T, pts) => pts.map(p => new T.Vector2(p[0], p[1]));
  /* a fabric: polka dots, stripes, checks or a plain weave on a colour (one per room, cached) */
  function fabricTex(c, col, kind) { const cache = c.MS.fab = c.MS.fab || {}, key = col + ':' + kind; if (cache[key]) return cache[key]; const base = '#' + col.toString(16).padStart(6, '0');
    return cache[key] = KQRealms.hall.canvasTex(c.T, 128, 128, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.55)'; g.strokeStyle = 'rgba(255,255,255,0.5)';
      if (kind === 'dots') { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(16 + x * 32 + (y % 2) * 16, 16 + y * 32, 6, 0, TAU); g.fill(); } }
      else if (kind === 'stripes') { g.lineWidth = 10; for (let x = -128; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 128, 128); g.stroke(); } }
      else if (kind === 'checks') { g.fillStyle = 'rgba(255,255,255,0.28)'; for (let i = 0; i < 128; i += 32) { g.fillRect(i, 0, 16, 128); g.fillRect(0, i, 128, 16); } }
      else { g.fillStyle = 'rgba(255,255,255,0.16)'; for (let i = 0; i < 80; i++) g.fillRect((i * 37) % 128, (i * 61) % 128, 2, 2); } }, [1, 1]); }
  /* the dress form: a linen torso on a brass pole and a walnut base; garments sit at their slot (form coordinates) */
  function dressForm(c, s) { const { T, M } = c, g = new T.Group(), linen = M(0xf2e8da, { roughness: 0.9 }), wood = M(0x6a4a30, { roughness: 0.55 }), brass = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 });
    const torso = new T.Mesh(new T.LatheGeometry(V2(T, [[0.001, 0], [0.5, 0.02], [0.6, 0.22], [0.5, 0.62], [0.44, 0.85], [0.56, 1.25], [0.62, 1.52], [0.5, 1.78], [0.22, 1.95], [0.001, 1.98]]), 28), linen); torso.position.y = 2.55; torso.scale.set(1, 1, 0.74); torso.castShadow = true; g.add(torso);
    c.cyl(0.11, 0.13, 0.3, linen, 0, 4.66, 0, g, 12); c.sph(0.15, brass, 0, 4.88, 0, g, 12); c.cyl(0.05, 0.05, 2.6, brass, 0, 1.3, 0, g, 8); c.cyl(0.62, 0.72, 0.12, wood, 0, 0.06, 0, g, 24);
    if (s) g.scale.setScalar(s); return g; }
  /* the garments, built to sit on the form: skirt, top, sash, a necklace and a hat */
  function garment(c, kind, col, pat) { const { T, M } = c, g = new T.Group(), m = M(col, { roughness: 0.75, map: fabricTex(c, col, pat), side: T.DoubleSide }), trim = M(0xfff4e8, { roughness: 0.6 }), gold = M(0xd8b04a, { metalness: 0.8, roughness: 0.35 });
    if (kind === 'skirt') { const sk = new T.Mesh(new T.LatheGeometry(V2(T, [[0.47, 0], [0.62, -0.25], [0.86, -0.75], [1.08, -1.25], [1.18, -1.5]]), 36), m); sk.scale.z = 0.8; g.add(sk); const hem = new T.Mesh(new T.TorusGeometry(1.18, 0.045, 6, 48), trim); hem.rotation.x = PI / 2; hem.position.y = -1.5; hem.scale.y = 0.8; g.add(hem); g.userData.slot = [0, 3.4, 0]; }
    else if (kind === 'top') { const bd = new T.Mesh(new T.LatheGeometry(V2(T, [[0.47, 0], [0.5, 0.3], [0.62, 0.62], [0.67, 0.72], [0.55, 0.9], [0.24, 1.0]]), 32), m); bd.scale.z = 0.8; g.add(bd); for (const sd of [-1, 1]) { const sl = c.cyl(0.2, 0.25, 0.55, m, sd * 0.72, 0.64, 0, g, 12); sl.rotation.z = sd * 1.0; } const cl = new T.Mesh(new T.TorusGeometry(0.26, 0.05, 6, 24), trim); cl.rotation.x = PI / 2; cl.position.y = 0.98; g.add(cl); g.userData.slot = [0, 3.4, 0]; }
    else if (kind === 'sash') { const b = new T.Mesh(new T.TorusGeometry(0.48, 0.09, 8, 40), m); b.rotation.x = PI / 2; b.scale.y = 0.8; g.add(b); const bow = new T.Group(); bow.position.set(0.3, 0, 0.36); g.add(bow); for (const sd of [-1, 1]) { const lp = c.cone(0.16, 0.34, m, sd * 0.2, 0, 0, bow, 8); lp.rotation.z = sd * PI / 2; } c.sph(0.08, m, 0, 0, 0, bow, 8); for (const sd of [-1, 1]) c.box(0.1, 0.42, 0.03, m, sd * 0.1, -0.24, 0, bow).rotation.z = sd * 0.3; g.userData.slot = [0, 3.4, 0]; }
    else if (kind === 'necklace') { const pearl = M(0xfff6ec, { roughness: 0.22, metalness: 0.15 }), n = 24, r = 0.46;   /* Yoni 2026-10-09: jewellery instead of a cape — a pearl necklace with a gem */
      for (let k = 0; k < n; k++) { const a = k / n * PI * 2; c.sph(0.065, pearl, Math.cos(a) * r, -0.13 * Math.max(0, Math.sin(a)), Math.sin(a) * r, g, 10); }
      const gm = c.sph(0.12, M(col, { roughness: 0.15, metalness: 0.2, emissive: col, emissiveIntensity: 0.15 }), 0, -0.3, r + 0.04, g, 10); gm.scale.y = 1.35; c.sph(0.045, gold, 0, -0.16, r + 0.02, g, 8); g.userData.slot = [0, 4.3, 0]; }
    else { c.cyl(0.62, 0.62, 0.05, m, 0, 0, 0, g, 32); c.cyl(0.3, 0.34, 0.36, m, 0, 0.2, 0, g, 24); const bd = new T.Mesh(new T.TorusGeometry(0.33, 0.04, 6, 28), M(0xffffff, { roughness: 0.5 })); bd.rotation.x = PI / 2; bd.position.y = 0.06; g.add(bd); c.sph(0.1, M(PASTEL[(PASTEL.indexOf(col) + 2) % PASTEL.length], { roughness: 0.4 }), 0.3, 0.12, 0.14, g, 8); g.userData.slot = [0, 4.98, 0]; }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
  function hanger(c) { const { T, M } = c, g = new T.Group(), wire = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 }); const hook = new T.Mesh(new T.TorusGeometry(0.16, 0.025, 6, 16, PI * 1.4), wire); hook.position.y = 0.18; hook.rotation.z = -0.2; g.add(hook); c.cyl(0.02, 0.02, 0.2, wire, 0, 0.02, 0, g, 4);
    for (const sd of [-1, 1]) c.cyl(0.03, 0.03, 0.8, wire, sd * 0.36, -0.18, 0, g, 5).rotation.z = sd * 1.1; c.cyl(0.025, 0.025, 1.4, wire, 0, -0.36, 0, g, 5).rotation.z = PI / 2; return g; }
  /* a flat fabric piece (square, triangle, hexagon, circle, heart) with a darker backing that reads as a sewn edge */
  function fabricPiece(c, kind, col, pat) { const { T, M } = c, sh = new T.Shape(), r = 0.9;
    if (kind === 'square') { sh.moveTo(-r, -r); sh.lineTo(r, -r); sh.lineTo(r, r); sh.lineTo(-r, r); sh.closePath(); }
    else if (kind === 'tri') { sh.moveTo(-r * 1.1, -r * 0.8); sh.lineTo(r * 1.1, -r * 0.8); sh.lineTo(0, r * 1.05); sh.closePath(); }
    else if (kind === 'hex') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + PI / 6, x = Math.cos(a) * r * 1.05, y = Math.sin(a) * r * 1.05; i ? sh.lineTo(x, y) : sh.moveTo(x, y); } sh.closePath(); }
    else if (kind === 'circle') sh.absarc(0, 0, r, 0, TAU, false);
    else if (kind === 'rect') { sh.moveTo(-r * 1.2, -r * 0.62); sh.lineTo(r * 1.2, -r * 0.62); sh.lineTo(r * 1.2, r * 0.62); sh.lineTo(-r * 1.2, r * 0.62); sh.closePath(); }
    else if (kind === 'pent' || kind === 'oct') { const nn = kind === 'pent' ? 5 : 8; for (let i = 0; i < nn; i++) { const a = PI / 2 + i / nn * TAU + (kind === 'oct' ? PI / 8 : 0), x = Math.cos(a) * r * 1.05, y = Math.sin(a) * r * 1.05; i ? sh.lineTo(x, y) : sh.moveTo(x, y); } sh.closePath(); }
    else { sh.moveTo(0, -r); sh.bezierCurveTo(r * 1.3, -r * 0.1, r * 0.9, r * 1.1, 0, r * 0.45); sh.bezierCurveTo(-r * 0.9, r * 1.1, -r * 1.3, -r * 0.1, 0, -r); }
    const geo = new T.ShapeGeometry(sh, 24), g = new T.Group(); g.add(new T.Mesh(geo, M(col, { roughness: 0.8, map: fabricTex(c, col, pat), side: T.DoubleSide })));
    const back = new T.Mesh(geo, M(new T.Color(col).multiplyScalar(0.62).getHex(), { roughness: 0.9, side: T.DoubleSide })); back.scale.setScalar(1.07); back.position.z = -0.012; g.add(back);
    g.userData.outline = sh.getSpacedPoints(26); return g; }
  /* when an answer is a shape's name, its fabric piece IS that shape (a 'triangle' tag never sits under a square) */
  const SHAPE_OF = { triangle: 'tri', square: 'square', circle: 'circle', rectangle: 'rect', pentagon: 'pent', hexagon: 'hex', octagon: 'oct', 'משולש': 'tri', 'ריבוע': 'square', 'עיגול': 'circle', 'מלבן': 'rect', 'מחומש': 'pent', 'משושה': 'hex', 'מתומן': 'oct' };
  function scissors(c) { const { T, M } = c, g = new T.Group(), steel = M(0xdfe4ea, { metalness: 0.95, roughness: 0.2 }), handle = M(0xff6a9a, { roughness: 0.4 }), blades = [];
    for (const sd of [-1, 1]) { const b = new T.Group(); g.add(b); c.box(0.12, 1.5, 0.03, steel, 0, 0.8, 0, b); const ring = new T.Mesh(new T.TorusGeometry(0.22, 0.06, 8, 20), handle); ring.position.set(sd * 0.2, -0.4, 0); b.add(ring); c.box(0.08, 0.4, 0.05, handle, sd * 0.08, -0.12, 0, b).rotation.z = sd * 0.35; b.rotation.z = sd * 0.25; blades.push(b); }
    c.cyl(0.05, 0.05, 0.08, M(0x6a6a70, { metalness: 0.9 }), 0, 0, 0, g, 8).rotation.x = PI / 2; g.userData.blades = blades; return g; }
  function sewingMachine(c, x, y, z) { const { T, M } = c, g = new T.Group(); g.position.set(x, y, z); g.rotation.y = -0.3; c.scene.add(g); const body = M(0x2a2a36, { roughness: 0.35, metalness: 0.2 }), gold = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 });
    c.box(2.2, 0.3, 1.0, body, 0, 0.15, 0, g); c.box(0.5, 1.3, 0.8, body, 0.8, 0.9, 0, g); c.box(2.0, 0.45, 0.7, body, -0.1, 1.55, 0, g); c.box(0.3, 0.6, 0.5, body, -1.0, 1.15, 0, g); c.cyl(0.02, 0.02, 0.5, M(0xdfe4ea, { metalness: 0.9 }), -1.0, 0.7, 0, g, 4);
    const wheel = c.cyl(0.35, 0.35, 0.12, gold, 1.15, 1.2, 0, g, 20); wheel.rotation.x = PI / 2; c.box(1.6, 0.04, 0.02, gold, -0.1, 1.55, 0.36, g); c.cyl(0.12, 0.12, 0.3, M(0xff6a9a), 0.2, 1.95, 0, g, 12); return { g, wheel }; }
  function necklace(c, colA, colB, gemCol) { const { T, M } = c, g = new T.Group(), mA = M(colA, { roughness: 0.25, metalness: 0.3 }), mB = M(colB, { roughness: 0.25, metalness: 0.3 }), beads = [], N = 17;
    for (let i = 0; i < N; i++) { const u = i / (N - 1) * 2 - 1; beads.push(c.sph(i % 2 ? 0.11 : 0.15, i % 2 ? mB : mA, u * 1.05, -1.5 * (1 - u * u), 0, g, 10)); }
    const gem = new T.Mesh(new T.OctahedronGeometry(0.26), M(gemCol, { emissive: gemCol, emissiveIntensity: 0.45, metalness: 0.4, roughness: 0.15 })); gem.position.set(0, -1.86, 0); gem.scale.y = 1.3; g.add(gem); beads.push(gem);
    const thr = new T.Mesh(new T.TorusGeometry(1.05, 0.012, 4, 40, PI), M(0xe8d8b0)); thr.rotation.z = PI; thr.scale.y = 1.43; g.add(thr); g.userData.beads = beads; g.userData.thread = thr; return g; }
  function bust(c) { const { T, M } = c, g = new T.Group(), vel = M(0xf4ead8, { roughness: 0.9 }), gold = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 });
    const body = new T.Mesh(new T.LatheGeometry(V2(T, [[0.001, 0], [0.5, 0], [0.66, 0.2], [0.92, 0.5], [1.0, 0.62], [0.72, 0.82], [0.34, 0.92], [0.26, 1.25], [0.28, 1.55], [0.001, 1.58]]), 32), vel); body.position.y = 2.75; body.scale.set(1.15, 1, 0.55); body.castShadow = true; g.add(body);
    c.cyl(0.08, 0.1, 2.6, gold, 0, 1.35, 0, g, 8); c.cyl(0.55, 0.65, 0.14, gold, 0, 0.07, 0, g, 24); return g; }
  function jewelBox(c, x, y, z) { const { T, M } = c, g = new T.Group(); g.position.set(x, y, z); g.rotation.y = 0.5; c.scene.add(g); const lac = M(0xc84a7a, { roughness: 0.35 }), gold = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 }), vel = M(0x3a1a4a, { roughness: 0.95 });
    c.box(2.4, 1.1, 1.6, lac, 0, 0.55, 0, g); c.box(2.2, 0.06, 1.4, vel, 0, 1.08, 0, g); c.box(2.46, 0.08, 1.66, gold, 0, 1.1, 0, g); const lid = new T.Group(); lid.position.set(0, 1.12, -0.8); g.add(lid); c.box(2.4, 0.2, 1.6, lac, 0, 0.1, 0.8, lid); lid.rotation.x = -1.9;
    for (const [gx, gz, col] of [[-0.6, 0.2, 0x7ae0ff], [0.1, -0.2, 0xff6aa8], [0.6, 0.3, 0xffe06a], [-0.2, 0.4, 0x9a7aff]]) { const gm = new T.Mesh(new T.OctahedronGeometry(0.18), M(col, { emissive: col, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.3 })); gm.position.set(gx, 1.24, gz); g.add(gm); }
    c.sprite(0xffe8ff, 2.6, 0, 1.6, 0, g, 0.3); return g; }
  function spool(c, parent, x, y, z, col, s) { const { M } = c, wood = M(0xd8b88a, { roughness: 0.6 }); c.cyl(0.36 * s, 0.36 * s, 0.1 * s, wood, x, y + 0.05 * s, z, parent, 16); c.cyl(0.26 * s, 0.26 * s, 0.5 * s, M(col, { roughness: 0.7 }), x, y + 0.35 * s, z, parent, 16); c.cyl(0.36 * s, 0.36 * s, 0.1 * s, wood, x, y + 0.65 * s, z, parent, 16); }
  function lamp(c, x, y, z, col) { const { M, G } = c; c.cyl(0.015, 0.015, 3, M(0x333333), x, y + 1.5, z, null, 4); const sh = c.cone(0.7, 0.6, M(col || 0xf4c8d8, { roughness: 0.6, side: c.T.DoubleSide }), x, y, z, null, 20); sh.material.side = c.T.DoubleSide; c.sph(0.18, G(0xfff0d0, 2), x, y - 0.2, z, null, 10); c.sprite(0xfff0d0, 2.4, x, y - 0.4, z, null, 0.35); }
  function mirror(c, x, y, z, ry, s) { const { T, M } = c, g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; g.scale.setScalar(s || 1); c.scene.add(g); const fr = new T.Mesh(new T.TorusGeometry(1, 0.12, 8, 40), M(0xd8b04a, { metalness: 0.9, roughness: 0.3 })); fr.scale.y = 1.6; g.add(fr); const gl = new T.Mesh(new T.CircleGeometry(0.95, 40), M(0xdfe8f0, { metalness: 0.95, roughness: 0.05 })); gl.scale.y = 1.6; gl.position.z = -0.02; g.add(gl); c.sph(0.16, M(0xd8b04a, { metalness: 0.9, roughness: 0.3 }), 0, 1.75, 0, g, 10); return g; }
  function chandelier(c, x, y, z) { const { T, M, G } = c, g = new T.Group(); g.position.set(x, y, z); c.scene.add(g); const gold = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 }); const ring = new T.Mesh(new T.TorusGeometry(1.2, 0.06, 6, 36), gold); ring.rotation.x = PI / 2; g.add(ring); c.cyl(0.02, 0.02, 3, gold, 0, 1.5, 0, g, 4);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.sph(0.07, G(0xfff4e0, 1.4), Math.cos(a) * 1.2, 0.12, Math.sin(a) * 1.2, g, 6); for (let d = 0; d < 2; d++) { const dr = new T.Mesh(new T.OctahedronGeometry(0.08), M(0xe8f4ff, { metalness: 0.3, roughness: 0.05, emissive: 0x8090a0, emissiveIntensity: 0.4 })); dr.position.set(Math.cos(a) * (1.2 - d * 0.25), -0.25 - d * 0.3, Math.sin(a) * (1.2 - d * 0.25)); dr.scale.y = 1.6; g.add(dr); } }
    c.sprite(0xfff0d8, 5, 0, 0, 0, g, 0.3); return g; }
  function gridTex(c) { return KQRealms.hall.canvasTex(c.T, 256, 256, (g) => { g.fillStyle = '#3f8a6a'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; for (let i = 0; i <= 256; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); } g.strokeStyle = 'rgba(255,240,120,0.6)'; g.lineWidth = 2; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); } }, [6, 1.4]); }
  function wallpaper(c, a, b) { return KQRealms.hall.canvasTex(c.T, 128, 128, (g) => { g.fillStyle = a; g.fillRect(0, 0, 128, 128); g.fillStyle = b; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const cx = 32 + x * 64, cy = 32 + y * 64; g.beginPath(); g.moveTo(cx, cy - 18); g.quadraticCurveTo(cx + 14, cy, cx, cy + 18); g.quadraticCurveTo(cx - 14, cy, cx, cy - 18); g.fill(); } }, [14, 4]); }

  /* ================================================================== the halls */
  const THEMES = {
    /* the Tailor's Atelier: pinstripe walls, a parquet floor, bolts of fabric on the shelves, a tall window, spools, a gilded mirror */
    fa_atelier: { palette: { sky: 0xf6e6ea, ground: 0xc8966a, fog: 0xf4e2e6, wall: ['plank', '#f8ecef', '#f2dde4'], floor: ['plank', '#c8966a', '#b58558'], hemi: [0xfff4f6, 0x9a7a6a], key: 0xffeedd, dust: { c: 0xffffff, n: 26, mode: 'drift' } },
      look: { keyC: 0xfff2ea, grade: 'warm', exposure: 1.05, fogD: 0.012, rim: 0xffc8d8, face: 0x2e1426, accent: '#ffd0e0', pillars: null, rays: 1 },
      props(c) { const { T, scene, M } = c, wood = M(0x9a6a44, { roughness: 0.6 });
        for (const sx of [-1, 1]) { const x0 = sx * 10.5; for (let r = 0; r < 3; r++) { c.box(4.4, 0.12, 1.1, wood, x0, 1.4 + r * 1.6, -9.6, null); for (let b = 0; b < 4; b++) { const bolt = c.cyl(0.32, 0.32, 1.0, M(PASTEL[(b + r * 2 + (sx > 0 ? 3 : 0)) % 6], { roughness: 0.85 }), x0 - 1.5 + b * 1.0, 1.78 + r * 1.6, -9.5, null, 14); bolt.rotation.x = PI / 2; } } c.box(0.14, 5.0, 1.1, wood, x0 - 2.25, 2.5, -9.6); c.box(0.14, 5.0, 1.1, wood, x0 + 2.25, 2.5, -9.6); }
        const win = c.box(3.4, 5.2, 0.1, M(0xfff4e8, { emissive: 0xffe8d8, emissiveIntensity: 1.1 }), 0, 5.4, -11.5); for (const x of [-0.85, 0.85]) c.box(0.1, 5.2, 0.14, M(0xffffff), x, 5.4, -11.44); c.box(3.4, 0.1, 0.14, M(0xffffff), 0, 5.4, -11.44); c.sprite(0xfff0e8, 7, 0, 5.4, -11.2, null, 0.35);
        mirror(c, -8.6, 3.4, -5.5, 0.7, 1.3); lamp(c, -3.5, 8.2, -3, 0xf4c8d8); lamp(c, 3.5, 8.2, -3, 0xc8d8f4);
        const rack = new T.Group(); rack.position.set(9.4, 0, -5); rack.rotation.y = -0.7; scene.add(rack); c.box(2.4, 3.6, 0.2, wood, 0, 1.8, 0, rack); for (let i = 0; i < 12; i++) spool(c, rack, -0.8 + (i % 4) * 0.55, 0.5 + Math.floor(i / 4) * 1.1, 0.25, PASTEL[i % 6], 0.9);
        const rug = c.cyl(4.5, 4.5, 0.03, M(0xf0c4d4, { roughness: 1 }), 0, 0.02, -1, null, 40); rug.receiveShadow = true;
        const tape = new T.Mesh(new T.TorusGeometry(0.45, 0.12, 8, 24), M(0xffd23a, { roughness: 0.5 })); tape.position.set(9.3, 3.8, -4.6); tape.rotation.y = -0.7; scene.add(tape); } },
    /* the Boutique: rose walls, a cream marble floor, a crystal chandelier, gilded mirrors, a velvet sofa and hat stands */
    fa_boutique: { palette: { sky: 0xffe6ee, ground: 0xefe4d6, fog: 0xffe8f0, wall: ['cloud', '#ffdce8', '#f6c2d6'], floor: ['brick', '#f6efe6', '#e8ddce'], hemi: [0xfff0f6, 0xa08080], key: 0xfff0e8, dust: { c: 0xfff0f8, n: 30, mode: 'drift' } },
      look: { keyC: 0xfff4ee, grade: 'warm', exposure: 1.05, fogD: 0.012, rim: 0xffb8d0, face: 0x2e1426, accent: '#ffc0d8', pillars: null, rays: 0 },
      props(c) { const { T, scene, M } = c; chandelier(c, 0, 8.6, -3.5); mirror(c, -9.6, 3.6, -4.5, 0.9, 1.4); mirror(c, 9.6, 3.6, -4.5, -0.9, 1.4);
        const vel = M(0xc0507a, { roughness: 0.95 }); const sofa = new T.Group(); sofa.position.set(-8.4, 0, 2.2); sofa.rotation.y = 0.9; scene.add(sofa); c.box(3.2, 0.7, 1.2, vel, 0, 0.55, 0, sofa); c.box(3.2, 1.2, 0.3, vel, 0, 1.3, -0.5, sofa); for (const sd of [-1, 1]) c.box(0.3, 0.9, 1.2, vel, sd * 1.6, 0.9, 0, sofa); for (const sd of [-1, 1]) c.cyl(0.08, 0.05, 0.3, M(0xd8b04a, { metalness: 0.9 }), sd * 1.4, 0.15, 0.4, sofa, 6);
        for (const [x, z, col] of [[9.2, 1.8, 0x8fd0f0], [10.4, -0.6, 0xffcf6a]]) { const st = new T.Group(); st.position.set(x, 0, z); scene.add(st); c.cyl(0.05, 0.05, 3.2, M(0xd8b04a, { metalness: 0.9 }), 0, 1.6, 0, st, 6); c.cyl(0.4, 0.45, 0.06, M(0xd8b04a, { metalness: 0.9 }), 0, 0.03, 0, st, 16); const hat = garment(c, 'hat', col, 'plain'); hat.position.y = 3.25; st.add(hat); }
        for (const [x, z, col] of [[7.6, 3.2, 0xff8fb8], [8.3, 3.6, 0xc0a0ff]]) { const bag = c.box(0.8, 0.9, 0.35, M(col, { roughness: 0.6 }), x, 0.45, z); bag.rotation.y = 0.4; const hd = new T.Mesh(new T.TorusGeometry(0.25, 0.03, 6, 16, PI), M(0xffffff)); hd.position.set(x, 0.9, z); hd.rotation.y = 0.4; scene.add(hd); }
        c.cyl(5.2, 5.2, 0.03, M(0xf4d4e0, { roughness: 1 }), 0, 0.02, -2, null, 48).receiveShadow = true; } },
    /* the Workroom: cream brick, a pegboard of tools, paper patterns pinned to the wall, rolls of fabric, a work lamp */
    fa_workroom: { palette: { sky: 0xf2ece0, ground: 0xa8845c, fog: 0xf0e8dc, wall: ['brick', '#efe4d2', '#e4d6c0'], floor: ['plank', '#a8845c', '#98744e'], hemi: [0xfff6e8, 0x8a7060], key: 0xfff0dc, dust: { c: 0xffffff, n: 30, mode: 'drift' } },
      look: { keyC: 0xfff4e4, grade: 'warm', exposure: 1.05, fogD: 0.012, rim: 0xffd8b0, face: 0x2a1a10, accent: '#ffe0b0', pillars: null, rays: 1 },
      props(c) { const { T, scene, M } = c; const pb = c.box(4.4, 3.2, 0.1, M(0xd8c0a0, { roughness: 0.9 }), -9.6, 4.4, -8.2); pb.rotation.y = 0.55;
        for (let i = 0; i < 3; i++) { const sc = scissors(c); sc.position.set(-10.5 + i * 0.9, 4.4 + (i % 2) * 0.3, -7.8 + i * 0.55); sc.rotation.set(0, 0.55, PI * 0.1 * (i - 1)); sc.scale.setScalar(0.8); scene.add(sc); }
        const pat = KQRealms.hall.canvasTex(T, 128, 128, g => { g.fillStyle = '#f6efdf'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#8a6a4a'; g.setLineDash([6, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(20, 110); g.lineTo(40, 20); g.lineTo(90, 20); g.lineTo(108, 110); g.closePath(); g.stroke(); g.setLineDash([]); g.fillStyle = '#c86a4a'; g.font = '700 14px sans-serif'; g.fillText('A', 58, 70); });
        for (const [x, y, rz] of [[-3.8, 6.4, 0.08], [0, 7.0, -0.05], [3.8, 6.3, 0.1]]) { const pp = new T.Mesh(new T.PlaneGeometry(2.2, 2.6), M(0xffffff, { map: pat, roughness: 0.9 })); pp.position.set(x, y, -11.2); pp.rotation.z = rz; scene.add(pp); c.sph(0.1, M(0xff5a7a), x, y + 1.2, -11.1, null, 8); }
        for (let i = 0; i < 4; i++) { const roll = c.cyl(0.35, 0.35, 3.8, M(PASTEL[i], { roughness: 0.85, map: fabricTex(c, PASTEL[i], ['dots', 'stripes', 'checks', 'plain'][i]) }), 9.2 + i * 0.55, 1.9, -6 + i * 0.4, null, 14); roll.rotation.z = -0.18; }
        lamp(c, 0, 8.4, -2, 0xe8d0a0); const shelf = c.box(3.6, 0.12, 1, M(0x9a6a44), 9.6, 5.8, -7.4); shelf.rotation.y = -0.6; for (let i = 0; i < 5; i++) spool(c, null, 8.5 + i * 0.5, 5.86, -6.9 - i * 0.3, PASTEL[(i + 2) % 6], 0.9); } },
    /* the Jewelry Salon: plum quilted velvet, glass cases of glowing gems, velvet drapes, a chandelier */
    fa_salon: { palette: { sky: 0x2a1438, ground: 0x3a2446, fog: 0x3a2048, wall: ['hex', '#4a2a5a', '#5c3a70'], floor: ['brick', '#3a2446', '#4a2e58'], hemi: [0xe8c8ff, 0x2a1030], key: 0xffe8c8, dust: { c: 0xffe8ff, n: 70, mode: 'drift' } },
      look: { keyC: 0xfff0e0, grade: 'magic', exposure: 1.12, fogD: 0.014, rim: 0xd8a8ff, face: 0x1e0e28, accent: '#e8c8ff', pillars: null, rays: 0 },
      props(c) { const { T, scene, M } = c; chandelier(c, 0, 9.2, -3); const glass = M(0xd8e8ff, { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2 }), gold = M(0xd8b04a, { metalness: 0.9, roughness: 0.3 });
        for (const sx of [-1, 1]) { const cs = new T.Group(); cs.position.set(sx * 9.4, 0, -3.8); cs.rotation.y = -sx * 0.6; scene.add(cs); c.box(2.6, 1.8, 1.4, M(0x3a1a4a, { roughness: 0.9 }), 0, 0.9, 0, cs); c.box(2.6, 1.3, 1.4, glass, 0, 2.45, 0, cs); c.box(2.7, 0.08, 1.5, gold, 0, 3.12, 0, cs);
          for (let i = 0; i < 4; i++) { const col = [0x7ae0ff, 0xff6aa8, 0xffe06a, 0x9a7aff][i], gm = new T.Mesh(new T.OctahedronGeometry(0.2), M(col, { emissive: col, emissiveIntensity: 0.9, roughness: 0.1 })); gm.position.set(-0.9 + i * 0.6, 2.1, 0); cs.add(gm); c.updaters.push((dt, tm) => { gm.rotation.y = tm * 0.8 + i; }); } c.sprite(0xffe0ff, 3.4, 0, 2.4, 0, cs, 0.28); }
        const drape = M(0x6a2a5a, { roughness: 0.95 }); for (const sx of [-1, 1]) for (let f = 0; f < 6; f++) c.cyl(0.26, 0.3, 11, drape, sx * (11.8 + f * 0.36), 5.5, -6.5 + f * 0.5, null, 8);
        c.cyl(5, 5, 0.03, M(0x5a2a6a, { roughness: 1 }), 0, 0.02, -2, null, 48).receiveShadow = true; } }
  };

  /* ================================================================== the games (stages) */
  const STAGES = {
    /* ---- The Tailor's Tape: garments hang on the rail; the one that fits flies onto the dress form, a wrong one slips off its hanger ---- */
    tape(c) { const FORM_W = [6.9, 0, -0.8, -0.45], FORM_T = [0, 0, 2.6, 0]; const { T, scene, MS } = c, KINDS = ['skirt', 'top', 'sash', 'necklace', 'hat'], PATS = ['dots', 'stripes', 'checks', 'plain'], HANG = { skirt: -0.45, top: -1.3, sash: -0.75, necklace: -0.6, hat: -0.75 }; return {
      frame: a => { place(c, MS.form, FORM_W, FORM_T); return a < 1.05 ? { pos: [0, 4.2, 16], look: [0, 3.6, -3], fov: 60 } : a < 1.5 ? { pos: [0, 4.0, 13.4], look: [0, 3.8, -3], fov: 50 } : { pos: [0, 3.9, 12.4], look: [0, 3.9, -3], fov: 46 }; },
      hostAt: () => new T.Vector3(-7.4, 0, 1.2),
      build() { const f = dressForm(c); scene.add(f); MS.form = f; place(c, f, FORM_W, FORM_T); MS.gi = 0; MS.hang = [];
        const brass = c.M(0xd8b04a, { metalness: 0.9, roughness: 0.3 }); for (const sd of [-1, 1]) { c.cyl(0.07, 0.07, 6.4, brass, sd * 7.6, 3.2, -4.4, null, 8); c.cyl(0.3, 0.3, 0.12, brass, sd * 7.6, 0.06, -4.4, null, 12); } c.cyl(0.05, 0.05, 15.2, brass, 0, 6.4, -4.4, null, 8).rotation.z = PI / 2; },
      present(choices) { for (const o of MS.hang) scene.remove(o); MS.hang = []; const n = choices.length, L = lay(c, 3.5), kind = KINDS[MS.gi % KINDS.length];
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 6.36, -4.4); g.scale.setScalar(L.k); const hg = hanger(c); g.add(hg);
          const gar = garment(c, kind, PASTEL[(j + MS.gi * 2) % PASTEL.length], PATS[(j + MS.gi) % PATS.length]); gar.position.y = HANG[kind]; if (kind === 'hat') gar.rotation.x = 1.25; if (kind === 'necklace') gar.rotation.x = 1.2; hg.add(gar);
          const tab = c.label(choices[j], j, 0.8); tab.position.set(0, -2.95, 0.3); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.4, 3.6, 1.4, j, -1.2); g.add(h);
          const ch = { j, g, tab, obj: gar, hg, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); MS.hang.push(g);
          c.updaters.push((dt, tm) => { if (ch.free) return; hg.rotation.z = Math.sin(tm * 1.1 + ch.k0) * 0.035; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; const gar = ch.obj; ch.free = true;
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const f = MS.form, from = new T.Vector3(), q0 = new T.Quaternion(), q1 = new T.Quaternion(), s0 = new T.Vector3(); gar.getWorldPosition(from); gar.getWorldQuaternion(q0); f.getWorldQuaternion(q1); gar.getWorldScale(s0);
          const to = f.localToWorld(new T.Vector3(...gar.userData.slot)); scene.attach(gar);
          c.tween(1.25, k => { const e = c.ease(k); gar.position.lerpVectors(from, to, e); gar.position.y += Math.sin(PI * k) * 1.6; gar.quaternion.slerpQuaternions(q0, q1, e); gar.scale.setScalar(s0.x + (1 - s0.x) * e); }, () => { f.attach(gar); c.burst(to, 0xffd6f0, 18); c.burst(to, 0xffffff, 10); });
          MS.gi++; }
        else { ch.tab.userData.tablet.setState('wrong'); const y0 = gar.position.y; c.tween(1.1, k => { gar.position.y = y0 - k * k * 4.2; gar.rotation.z = k * 0.9; if (k > 0.75) gar.scale.y = Math.max(0.25, 1 - (k - 0.75) * 3); }, () => { gar.visible = false; }); c.glowUp(r); }
        return ok ? 3.0 : 2.4; } }; },

    /* ---- The Fitting Room: four curtained booths; the right curtain opens on a finished outfit, a wrong one on an empty booth ---- */
    fit(c) { const { T, scene, MS } = c; return {
      frame: a => a < 1.05 ? { pos: [0, 4.2, 16.5], look: [0, 3.4, -3], fov: 60 } : a < 1.5 ? { pos: [0, 3.9, 13.6], look: [0, 3.6, -3], fov: 50 } : { pos: [0, 3.8, 12.6], look: [0, 3.7, -3], fov: 46 },
      hostAt: () => new T.Vector3(-7.6, 0, 1.6),
      build() { MS.booths = []; },
      present(choices) { for (const o of MS.booths) scene.remove(o); MS.booths = []; const n = choices.length, L = lay(c, 3.6), gold = c.M(0xd8b04a, { metalness: 0.85, roughness: 0.3 }), frameM = c.M(0xf4ece0, { roughness: 0.5 }), backM = c.M(0xf8e6ee, { roughness: 0.8 });
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 0, -3.6); g.scale.setScalar(L.k);
          for (const sd of [-1, 1]) c.box(0.16, 5.2, 0.16, frameM, sd * 1.35, 2.6, 0, g); c.box(3.0, 0.3, 0.3, frameM, 0, 5.3, 0, g); c.box(3.0, 0.08, 0.34, gold, 0, 5.1, 0.02, g); c.cyl(0.05, 0.05, 2.7, gold, 0, 4.95, 0.12, g, 6).rotation.z = PI / 2;
          c.box(2.6, 5.0, 0.06, backM, 0, 2.55, -0.9, g); c.cyl(1.0, 1.0, 0.03, c.M(0xe8b0c8, { roughness: 0.9 }), 0, 0.02, -0.4, g, 24);
          const dol = dressForm(c, 0.62); dol.position.set(0, 0.03, -0.45); g.add(dol); const cA = PASTEL[(j * 2 + 1) % 6], cB = PASTEL[(j * 2 + 4) % 6];
          for (const [kind, col, pat] of [['skirt', cA, 'dots'], ['top', cB, 'plain'], ['sash', cB, 'stripes'], ['hat', cA, 'stripes']]) { const gar = garment(c, kind, col, pat); gar.position.set(...gar.userData.slot); dol.add(gar); } dol.visible = false;
          const velvet = c.M(PASTEL[(j + 3) % 6], { roughness: 0.95 }), curtains = []; for (const sd of [-1, 1]) { const cu = new T.Group(); cu.position.set(sd * 0.68, 4.9, 0.12); g.add(cu); for (let f = 0; f < 5; f++) c.cyl(0.15, 0.17, 4.8, velvet, -0.52 + f * 0.26, -2.4, (f % 2) * 0.06, cu, 8); curtains.push(cu); }
          const tab = c.label(choices[j], j, 0.8); tab.position.set(0, 6.15, 0.3); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.8, 5.2, 1.2, j, 2.6); g.add(h);
          const ch = { j, g, tab, obj: dol, curtains, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); MS.booths.push(g);
          c.updaters.push((dt, tm) => { if (ch.open) return; curtains.forEach((cu, i) => { cu.rotation.z = Math.sin(tm * 0.9 + ch.k0 + i) * 0.012; }); }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.open = true;
        const openC = (b, dur, back) => b.curtains.forEach((cu, i) => { const sd = i ? 1 : -1, x0 = cu.position.x, s0 = cu.scale.x; c.tween(dur || 0.9, k => { const e = c.ease(k); cu.position.x = x0 + (back ? -1 : 1) * sd * 0.55 * e; cu.scale.x = back ? s0 + (1 - s0) * e : 1 - 0.62 * e; }); });
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; ch.obj.visible = true; ch.obj.rotation.y = -0.7; openC(ch); c.tween(1.6, k => { ch.obj.rotation.y = -0.7 + c.ease(k) * 0.7; }, null, 0.5);
          const glow = c.sprite(0xfff0f8, 3.6, 0, 3.0, -0.2, ch.g, 0); c.tween(0.8, k => { glow.material.opacity = 0.5 * k; }, null, 0.4); const w = new T.Vector3(); ch.g.getWorldPosition(w); w.y += 3.4;
          setTimeout(() => { if (!c.alive()) return; c.burst(w, 0xffd6f0, 18); c.burst(w, 0xfff4c0, 12); }, 700); }
        else { ch.tab.userData.tablet.setState('wrong'); openC(ch, 0.6); const sock = c.box(0.34, 0.5, 0.05, c.M(0xb0a8a0), 0, 4.2, 0.1, ch.g); c.tween(1.4, k => { sock.position.y = 4.2 - k * 4.0; sock.rotation.z = Math.sin(k * 12) * 0.6; sock.position.x = Math.sin(k * 7) * 0.4; }, () => { ch.g.remove(sock); });
          setTimeout(() => { if (c.alive()) openC(ch, 0.6, true); }, 1300); if (r) { r.obj.visible = true; r.open = true; openC(r, 0.9); } c.glowUp(r); }
        return ok ? 3.2 : 2.6; } }; },

    /* ---- The Pattern Table: fabric pieces stand on the cutting table; the right one is snipped, stitched round and sewn into the quilt ---- */
    cut(c) { const { T, scene, MS } = c, SHAPES = ['square', 'tri', 'hex', 'circle', 'heart'], PATS = ['dots', 'stripes', 'checks', 'plain']; return {
      frame: a => a < 1.05 ? { pos: [0, 5.2, 16], look: [0, 3.6, -2.5], fov: 60 } : a < 1.5 ? { pos: [0, 5.0, 13.4], look: [0, 3.8, -2.5], fov: 50 } : { pos: [0, 4.8, 12.4], look: [0, 3.9, -2.5], fov: 46 },
      hostAt: () => new T.Vector3(-7.8, 0, 1.8),
      build() { const wood = c.M(0xb88a5a, { roughness: 0.6 }); c.box(15.6, 0.3, 3.4, wood, 0, 2.05, -1.2); c.box(15.1, 0.03, 3.1, c.M(0xffffff, { roughness: 0.9, map: gridTex(c) }), 0, 2.215, -1.2); for (const [x, z] of [[-7.3, -2.6], [7.3, -2.6], [-7.3, 0.2], [7.3, 0.2]]) c.box(0.25, 2.0, 0.25, wood, x, 1.0, z);
        const q = new T.Group(); q.position.set(0, 6.3, -6.6); scene.add(q); c.box(11.3, 5.0, 0.1, c.M(0xff8fb8, { roughness: 0.9 }), 0, 0, -0.02, q); c.box(11, 4.7, 0.12, c.M(0xfdf6ec, { roughness: 0.9 }), 0, 0, 0, q); c.cyl(0.1, 0.1, 12, c.M(0x9a6a44), 0, 2.6, 0.08, q, 8).rotation.z = PI / 2;
        MS.slots = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { const x = -4.1 + i * 2.05, y = 1.05 - r * 2.1; c.box(1.85, 1.85, 0.02, c.M(0xefe6d8, { roughness: 1 }), x, y, 0.07, q); MS.slots.push(new T.Vector3(x, y, 0.12)); }
        MS.quilt = q; MS.qi = 0; const sc = scissors(c); sc.visible = false; scene.add(sc); MS.sc = sc; MS.sm = sewingMachine(c, 6.2, 2.22, -2.0); MS.pieces = []; },
      present(choices) { for (const o of MS.pieces) scene.remove(o); MS.pieces = []; const n = choices.length, L = lay(c, 3.4), stand = c.M(0x8a6a44);
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 2.25, -1.2); g.scale.setScalar(L.k);
          const named = SHAPE_OF[String(choices[j]).trim()], piece = fabricPiece(c, named || SHAPES[(j + MS.qi) % SHAPES.length], PASTEL[(j + MS.qi * 2) % 6], PATS[(j + 1) % 4]); piece.position.set(0, 1.25, 0); piece.rotation.x = -0.16; g.add(piece); c.box(0.08, 1.6, 0.08, stand, 0, 0.75, -0.35, g).rotation.x = -0.28;
          const tab = c.label(choices[j], j, 0.78); tab.position.set(0, -0.95, 1.9); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.4, 3.0, 1.2, j, 0.9); g.add(h);
          const ch = { j, g, tab, obj: piece, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); MS.pieces.push(g);
          c.updaters.push((dt, tm) => { if (ch.done) return; piece.rotation.z = Math.sin(tm * 0.8 + ch.k0) * 0.04; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const piece = ch.obj;
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const at = new T.Vector3(); piece.getWorldPosition(at); const sc = MS.sc; sc.visible = true; sc.position.copy(at).add(new T.Vector3(1.0, 0.6, 0.6)); sc.rotation.set(0, 0, 0.9);
          c.tween(1.0, k => { const snip = Math.abs(Math.sin(k * PI * 3)); sc.userData.blades.forEach((b, i) => { b.rotation.z = (i ? 1 : -1) * (0.05 + 0.3 * snip); }); sc.position.x = at.x + 1.0 - k * 1.2; }, () => { sc.visible = false; });
          const pts = piece.userData.outline; pts.forEach((p, i) => { const w = piece.localToWorld(new T.Vector3(p.x, p.y, 0.05)); const d = c.sprite(0xffffff, 0.001, w.x, w.y, w.z, null, 0.95); c.tween(0.25, k => d.scale.setScalar(Math.max(0.001, 0.22 * c.over(k))), null, 0.9 + i * 0.03); c.tween(0.5, k => { d.material.opacity = 0.95 * (1 - k); }, () => scene.remove(d), 2.2); });
          const slot = MS.slots[MS.qi % MS.slots.length], to = MS.quilt.localToWorld(slot.clone()), q0 = new T.Quaternion(), q1 = new T.Quaternion(), s0 = new T.Vector3(); MS.quilt.getWorldQuaternion(q1);
          setTimeout(() => { if (!c.alive()) return; const from = new T.Vector3(); piece.getWorldPosition(from); piece.getWorldQuaternion(q0); piece.getWorldScale(s0); scene.attach(piece);
            c.tween(1.0, k => { const e = c.ease(k); piece.position.lerpVectors(from, to, e); piece.position.y += Math.sin(PI * k) * 1.2; piece.quaternion.slerpQuaternions(q0, q1, e); piece.scale.setScalar(s0.x + (1.0 - s0.x) * e); }, () => { MS.quilt.attach(piece); c.burst(to, 0xfff4c0, 12); if (MS.sm) c.tween(0.8, k => { MS.sm.wheel.rotation.y = k * TAU * 2; }); }); }, 1900);
          MS.qi++; }
        else { ch.tab.userData.tablet.setState('wrong'); const at = new T.Vector3(); piece.getWorldPosition(at); for (let i = 0; i < 10; i++) { const s = c.sprite(0xf4ece0, 0.16, at.x + c.R(-0.8, 0.8), at.y + c.R(-0.8, 0.8), at.z + 0.2, null, 0.9); s.scale.set(0.04, 0.45, 1); c.tween(1.0, k => { s.position.y -= 0.03; s.material.opacity = 0.9 * (1 - k); }, () => scene.remove(s), i * 0.05); }
          const y0 = piece.position.y; c.tween(1.2, k => { piece.scale.y = Math.max(0.15, 1 - k * 0.85); piece.rotation.z = k * 1.4; piece.position.y = y0 - k * k * 1.3; }, () => { piece.visible = false; }); c.glowUp(r); }
        return ok ? 3.6 : 2.4; } }; },

    /* ---- The Jewelry Box: necklaces hang on the velvet board; the right one is fastened on the bust, a wrong string snaps and its beads bounce away ---- */
    beads(c) { const BUST_W = [6.9, 0, -0.4, -0.45], BUST_T = [0, 0, 2.6, 0]; const { T, scene, MS } = c, GEM = [0x7ae0ff, 0xff6aa8, 0xffe06a, 0x9a7aff, 0x7fdcb0]; return {
      frame: a => { place(c, MS.bust, BUST_W, BUST_T); return a < 1.05 ? { pos: [0, 4.6, 16], look: [0, 4.4, -3.5], fov: 60 } : a < 1.5 ? { pos: [0, 4.4, 13.4], look: [0, 4.6, -3.5], fov: 50 } : { pos: [0, 4.3, 12.4], look: [0, 4.7, -3.5], fov: 46 }; },
      hostAt: () => new T.Vector3(-7.6, 0, 1.8),
      build() { const gold = c.M(0xd8b04a, { metalness: 0.9, roughness: 0.3 }); c.box(15.6, 4.8, 0.3, c.M(0x5a2a6a, { roughness: 0.95 }), 0, 5.3, -5.4); c.box(15.9, 0.16, 0.4, gold, 0, 7.75, -5.3); c.box(15.9, 0.16, 0.4, gold, 0, 2.85, -5.3); for (const sd of [-1, 1]) c.box(0.16, 5.0, 0.4, gold, sd * 7.9, 5.3, -5.3);
        const b = bust(c); scene.add(b); MS.bust = b; place(c, b, BUST_W, BUST_T); MS.worn = 0; jewelBox(c, -6.4, 0, 1.4); MS.necks = []; },
      present(choices) { for (const o of MS.necks) scene.remove(o); MS.necks = []; const n = choices.length, L = lay(c, 3.6), gold = c.M(0xd8b04a, { metalness: 0.9, roughness: 0.3 });
        for (let j = 0; j < n; j++) { const s = c.RTL() ? n - 1 - j : j, off = s - (n - 1) / 2, g = new T.Group(); g.position.set(off * L.sp, 7.25, -5.0); g.scale.setScalar(L.k); c.cyl(0.07, 0.07, 0.3, gold, 0, 0.1, -0.1, g, 8).rotation.x = PI / 2;
          const nk = necklace(c, PASTEL[(j + MS.worn) % 6], 0xfff4e8, GEM[(j + MS.worn) % GEM.length]); g.add(nk);
          const tab = c.label(choices[j], j, 0.8); tab.position.set(0, -3.1, 0.35); c.faceCam(tab); g.add(tab); const h = c.hitBox(2.6, 2.6, 1.0, j, -1.1); g.add(h);
          const ch = { j, g, tab, obj: nk, hits: [h], still: true, k0: Math.random() * 6 }; c.addChoice(ch); MS.necks.push(g);
          c.updaters.push((dt, tm) => { if (ch.done) return; nk.rotation.z = Math.sin(tm * 1.0 + ch.k0) * 0.04; nk.userData.beads[nk.userData.beads.length - 1].rotation.y = tm * 1.2 + ch.k0; }); } },
      resolve(chosen, correct, ok) { const ch = c.choiceOf(chosen), r = c.choiceOf(correct); c.dimOthers([ch, r]); if (!ch) return 2; ch.done = true; const nk = ch.obj;
        if (ok) { ch.tab.userData.tablet.setState('right'); MS.right++; const b = MS.bust, from = new T.Vector3(), q0 = new T.Quaternion(), q1 = new T.Quaternion(), s0 = new T.Vector3(); nk.getWorldPosition(from); nk.getWorldQuaternion(q0); b.getWorldQuaternion(q1); nk.getWorldScale(s0);
          const to = b.localToWorld(new T.Vector3(0, 3.66 - MS.worn * 0.1, 0.64)), s1 = 0.44 - MS.worn * 0.02; scene.attach(nk);
          c.tween(1.3, k => { const e = c.ease(k); nk.position.lerpVectors(from, to, e); nk.position.y += Math.sin(PI * k) * 1.4; nk.quaternion.slerpQuaternions(q0, q1, e); nk.scale.setScalar(s0.x + (s1 - s0.x) * e); }, () => { b.attach(nk); const w = new T.Vector3(); nk.userData.beads[nk.userData.beads.length - 1].getWorldPosition(w); c.burst(w, 0xffffff, 14); c.burst(w, 0xffd6f0, 10); });
          MS.worn++; }
        else { ch.tab.userData.tablet.setState('wrong'); nk.userData.thread.visible = false; const floorY = 0.12;
          nk.userData.beads.forEach(bd => { const w = new T.Vector3(); bd.getWorldPosition(w); scene.attach(bd); const v = new T.Vector3(c.R(-2.5, 2.5), c.R(0.5, 3), c.R(0.5, 2.5)); let bounces = 0; const f = (dt) => { if (bounces > 2) return; v.y -= 14 * dt; bd.position.addScaledVector(v, dt); if (bd.position.y < floorY) { bd.position.y = floorY; v.y = -v.y * 0.45; v.x *= 0.7; v.z *= 0.7; bounces++; } }; c.updaters.push(f); c.tween(0.6, k => { bd.scale.setScalar(Math.max(0.001, 1 - k)); }, () => { scene.remove(bd); }, 2.2); });
          c.glowUp(r); }
        return ok ? 3.2 : 2.6; } }; }
  };

  /* ================================================================== the map: four places in the Fashion Kingdom */
  function landmarks(k) { const { T, plot, box, cyl, cone } = k;
    const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {})), cream = M(0xf6ece0), rose = M(0xf4a8c4), white = M(0xffffff), gold = M(0xd8b04a, { metalness: 0.85, roughness: 0.3 }), glassM = M(0xffe6f0, { emissive: 0xffc8dc, emissiveIntensity: 0.7, roughness: 0.2 }), steel = M(0xdfe4ea, { metalness: 0.95, roughness: 0.2 });
    /* The Tailor's House: a cream shop, a striped awning, a lit window with a dress form, a giant tape measure coiled on the roof */
    plot('rg_tape', -20, -12, g => { box(6.4, 4.2, 4.6, cream, 0, 2.1, 0, g); const roof = cone(4.9, 2.6, M(0xc86a8a), 0, 5.5, 0, g, 4); roof.rotation.y = PI / 4; roof.scale.z = 0.72;
      for (let i = 0; i < 7; i++) box(0.92, 0.08, 1.5, i % 2 ? white : rose, -2.76 + i * 0.92, 3.3, 2.95, g).rotation.x = 0.45;
      box(3.6, 2.0, 0.1, glassM, 0.4, 1.7, 2.32, g); box(1.2, 2.4, 0.12, M(0x8a5a3a), -2.3, 1.2, 2.33, g);
      const form = new T.Group(); form.position.set(0.9, 0.7, 2.0); g.add(form); const tor = new T.Mesh(new T.LatheGeometry([[0.001, 0], [0.34, 0.02], [0.4, 0.15], [0.32, 0.45], [0.4, 0.8], [0.3, 1.05], [0.001, 1.1]].map(p => new T.Vector2(p[0], p[1])), 18), M(0xff8fb8)); tor.position.y = 0.7; form.add(tor); cyl(0.03, 0.03, 0.7, gold, 0, 0.35, 0, form, 6);
      const tape = new T.Group(); tape.position.set(0, 7.3, 0); g.add(tape); const coil = new T.Mesh(new T.TorusGeometry(1.25, 0.36, 10, 32), M(0xffd23a, { roughness: 0.5 })); tape.add(coil); cyl(0.9, 0.9, 0.74, M(0xfff6e0), 0, 0, 0, tape, 24).rotation.x = PI / 2;
      box(0.5, 3.2, 0.04, M(0xffd23a, { roughness: 0.5 }), 1.5, -1.5, 0.2, tape).rotation.z = 0.25; for (let i = 0; i < 9; i++) box(0.3, 0.03, 0.05, M(0x2a2a2a), 1.3 + i * 0.075 * 0.25, -0.3 - i * 0.3, 0.23, tape).rotation.z = 0.25;
      k.fx((dt, tm) => { tape.rotation.z = Math.sin(tm * 0.6) * 0.12; coil.rotation.z = tm * 0.5; }); }, { labelH: 10.4 });
    /* The Boutique: a round rose tower under a giant sun hat with a ribbon and a bow */
    plot('rg_fit', 22, -10, g => { cyl(3.2, 3.4, 5, M(0xf6c8d8), 0, 2.5, 0, g, 28); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; box(0.9, 1.6, 0.12, glassM, Math.sin(a) * 3.28, 2.8, Math.cos(a) * 3.28, g).rotation.y = a; }
      box(1.4, 2.4, 0.2, M(0xc0507a), 0, 1.2, 3.34, g); const straw = M(0xf4e0b0, { roughness: 0.8 }), hat = new T.Group(); hat.position.y = 5.0; g.add(hat); cyl(5.6, 5.8, 0.25, straw, 0, 0.1, 0, hat, 40); cyl(2.6, 3.0, 2.6, straw, 0, 1.5, 0, hat, 32); cyl(3.02, 3.02, 0.6, M(0xff6a9a), 0, 0.55, 0, hat, 32);
      const bow = new T.Group(); bow.position.set(2.2, 0.9, 2.0); hat.add(bow); for (const sd of [-1, 1]) cone(0.6, 1.2, M(0xff6a9a), sd * 0.6, 0, 0, bow, 8).rotation.z = sd * PI / 2; cyl(0.3, 0.3, 0.4, M(0xff4a86), 0, 0, 0, bow, 12).rotation.x = PI / 2;
      k.fx((dt, tm) => { hat.rotation.y = Math.sin(tm * 0.3) * 0.08; hat.position.y = 5.0 + Math.sin(tm * 0.9) * 0.08; }); }, { labelH: 11 });
    /* The Spool Workshop: a building made of a giant spool of thread, a needle through it, a pair of scissors standing guard */
    plot('rg_cut', -20, 29, g => { const wood = M(0xe0c090, { roughness: 0.6 }); cyl(3.4, 3.4, 0.8, wood, 0, 0.4, 0, g, 32); cyl(2.6, 2.6, 4.6, M(0x7fdcb0, { roughness: 0.75 }), 0, 3.1, 0, g, 32); cyl(3.4, 3.4, 0.8, wood, 0, 5.8, 0, g, 32);
      for (let i = 0; i < 10; i++) { const ring = new T.Mesh(new T.TorusGeometry(2.62, 0.05, 4, 40), M(0x5ac09a)); ring.rotation.x = PI / 2; ring.position.y = 1.2 + i * 0.42; g.add(ring); }
      cyl(0.12, 0.02, 7.5, steel, 2.4, 7.2, 0.4, g, 8).rotation.z = -0.6; const eye = new T.Mesh(new T.TorusGeometry(0.18, 0.05, 6, 12), steel); eye.position.set(4.25, 10.0, 0.4); eye.rotation.z = -0.6; g.add(eye); box(1.0, 1.9, 0.15, M(0x8a5a3a), 0, 1.75, 2.62, g);
      const sc = new T.Group(); sc.position.set(-4.6, 0, 1.2); sc.rotation.y = 0.5; g.add(sc); for (const sd of [-1, 1]) { const b = new T.Group(); b.rotation.z = sd * 0.22; sc.add(b); box(0.3, 4.2, 0.1, steel, 0, 3.6, 0, b); const rg = new T.Mesh(new T.TorusGeometry(0.55, 0.16, 8, 20), M(0xff6a9a)); rg.position.set(sd * 0.5, 0.8, 0); b.add(rg); } k.fx((dt, tm) => { sc.children.forEach((b, i) => { b.rotation.z = (i ? 1 : -1) * (0.12 + 0.1 * Math.abs(Math.sin(tm * 0.8))); }); }); }, { labelH: 12.4 });
    /* The Jewel Pavilion: a glass rotunda of glowing gems under a golden dome, a giant diamond ring turning over it */
    plot('rg_beads', 28, 25, g => { cyl(3.6, 3.8, 0.5, M(0xf4efe6), 0, 0.25, 0, g, 32); const gw = new T.Mesh(new T.CylinderGeometry(3.1, 3.1, 3.6, 32, 1, true), M(0xe0f0ff, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3, side: T.DoubleSide })); gw.position.y = 2.3; g.add(gw);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; cyl(0.12, 0.12, 3.6, gold, Math.cos(a) * 3.1, 2.3, Math.sin(a) * 3.1, g, 8); } const dome = new T.Mesh(new T.SphereGeometry(3.3, 28, 14, 0, TAU, 0, PI / 2), gold); dome.position.y = 4.1; g.add(dome);
      [0x7ae0ff, 0xff6aa8, 0xffe06a, 0x9a7aff, 0x7fdcb0].forEach((col, i) => { const gm = new T.Mesh(new T.OctahedronGeometry(0.35), M(col, { emissive: col, emissiveIntensity: 1.2, roughness: 0.1 })); const a = i / 5 * TAU; gm.position.set(Math.cos(a) * 1.4, 1.6, Math.sin(a) * 1.4); g.add(gm); });
      const ring = new T.Group(); ring.position.y = 9.2; g.add(ring); ring.add(new T.Mesh(new T.TorusGeometry(1.5, 0.28, 12, 40), gold)); const dia = new T.Mesh(new T.OctahedronGeometry(0.9, 0), M(0xe8f8ff, { emissive: 0x9ad8ff, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.05 })); dia.position.y = 1.9; dia.scale.y = 0.8; ring.add(dia);
      k.fx((dt, tm) => { ring.rotation.y = tm * 0.6; ring.position.y = 9.2 + Math.sin(tm * 1.1) * 0.2; }); }, { labelH: 13 });
  }

  /* ================================================================== the kingdom itself: a set piece on every free spot */
  function scenery(k) {
    const { T, scene, height, reserved, fx } = k, K = KQRealms.kit(k); const { M, VC, BOX, CYL, SPH, CONE, put, halo } = K;
    const vc = VC({ roughness: 0.6 }), mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
    /* ---- giant spools, one on top of another, a ribbon unrolling across the grass (west road) ---- */
    { const x0 = -36, z0 = 6, P = []; reserved.push([x0, z0, 7]); const sp = (x, y, z, s, col) => P.push({ g: CYL, m: M(x, y + 0.2 * s, z, 0, 0, 0, 2.4 * s, 0.4 * s, 2.4 * s), c: 0xe0c090 }, { g: CYL, m: M(x, y + 1.3 * s, z, 0, 0, 0, 1.8 * s, 1.8 * s, 1.8 * s), c: col }, { g: CYL, m: M(x, y + 2.4 * s, z, 0, 0, 0, 2.4 * s, 0.4 * s, 2.4 * s), c: 0xe0c090 });
      sp(0, 0, 0, 1.4, 0xff8fb8); sp(3.2, 0, 1.4, 1.0, 0x8fd0f0); sp(0.4, 2.6 * 1.4, 0.2, 0.9, 0xffcf6a);
      for (let i = 0; i < 16; i++) { const t = i / 15; P.push({ g: BOX, m: M(-1.6 - t * 7.5, 0.04, 1.2 + Math.sin(t * 5) * 1.6, 0, Math.cos(t * 5) * 0.6, 0, 0.95, 0.06, 0.62), c: 0xff8fb8 }); }
      put(P, vc, x0, z0, 0.3, 0.1, 3); }
    /* ---- a great ribbon bow over the south road ---- */
    { const x0 = -3, z0 = 38, P = []; reserved.push([x0, z0, 6]); for (const sd of [-1, 1]) P.push({ g: CYL, m: M(sd * 3, 2.4, 0, 0, 0, 0, 0.4, 4.8, 0.4), c: 0xfff4e8 }); P.push({ g: BOX, m: M(0, 4.9, 0, 0, 0, 0, 6.6, 0.4, 0.5), c: 0xfff4e8 });
      for (const sd of [-1, 1]) P.push({ g: new T.TorusGeometry(1.1, 0.35, 8, 24), m: M(sd * 1.3, 6.1, 0, 0, 0, sd * 0.35, 1.0, 0.62, 0.6), c: 0xff6a9a }); P.push({ g: SPH, m: M(0, 5.95, 0, 0, 0, 0, 0.9, 0.9, 0.7), c: 0xff4a86 }); for (const sd of [-1, 1]) P.push({ g: BOX, m: M(sd * 0.6, 4.95, 0.34, 0, 0, sd * 0.3, 0.5, 2.0, 0.1), c: 0xff6a9a });
      put(P, vc, x0, z0, 0.2, 0.1, 3); }
    /* ---- the runway: a catwalk with twinkling bulbs, a golden arch, three gowns on the way down (east road) ---- */
    { const x0 = 36, z0 = 9, P = []; reserved.push([x0, z0, 8]); P.push({ g: BOX, m: M(0, 0.4, 0, 0, 0, 0, 3.0, 0.8, 12), c: 0xfff4f8 }, { g: BOX, m: M(0, 0.82, 0, 0, 0, 0, 2.2, 0.04, 11.6), c: 0xff8fb8 });
      for (const sd of [-1, 1]) P.push({ g: BOX, m: M(sd * 2.2, 3.0, -6, 0, 0, 0, 0.4, 6, 0.4), c: 0xd8b04a }); P.push({ g: BOX, m: M(0, 6.1, -6, 0, 0, 0, 4.8, 0.5, 0.5), c: 0xd8b04a });
      [[0, -3.8, 0xc0a0ff], [0, 0, 0xff8fb8], [0, 3.8, 0x8fd0f0]].forEach(([px, pz, col]) => P.push({ g: CONE, m: M(px, 1.95, pz, 0, 0, 0, 1.8, 2.3, 1.8), c: col }, { g: CYL, m: M(px, 3.5, pz, 0, 0, 0, 0.6, 1.0, 0.45), c: col }, { g: SPH, m: M(px, 4.2, pz, 0, 0, 0, 0.24, 0.24, 0.24), c: 0xd8b04a }));
      const run = put(P, vc, x0, z0, 1.2, 0.1, 5), bulbs = []; for (let i = 0; i < 12; i++) for (const sd of [-1, 1]) { const b = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), K.glowMat(0xfff0c0, 0xffd080, 2.2)); b.position.set(sd * 1.4, 0.9, -5.5 + i); run.add(b); bulbs.push(b); }
      fx((dt, tm) => bulbs.forEach((b, i) => { b.material.emissiveIntensity = 1.2 + Math.sin(tm * 4 + i * 0.7) * 1.0; })); }
    /* ---- the hat garden: a top hat, a sun hat and a crown as garden pavilions (north-west) ---- */
    { const x0 = -32, z0 = -14, P = []; reserved.push([x0, z0, 7]); P.push({ g: CYL, m: M(-2.6, 0.1, 0, 0, 0, 0, 5, 0.2, 5), c: 0x2a2a36 }, { g: CYL, m: M(-2.6, 2.0, 0, 0, 0, 0, 3.2, 3.6, 3.2), c: 0x2a2a36 }, { g: CYL, m: M(-2.6, 0.9, 0, 0, 0, 0, 3.26, 0.5, 3.26), c: 0xc84a7a });
      P.push({ g: CYL, m: M(2.8, 0.1, 1.5, 0, 0, 0, 6.2, 0.16, 6.2), c: 0xf4e0b0 }, { g: SPH, m: M(2.8, 0.2, 1.5, 0, 0, 0, 2.8, 2.4, 2.8), c: 0xf4e0b0 }, { g: CYL, m: M(2.8, 0.6, 1.5, 0, 0, 0, 2.86, 0.4, 2.86), c: 0x8fd0f0 });
      P.push({ g: CYL, m: M(0.4, 0.6, -3.2, 0, 0, 0, 2.6, 1.2, 2.6), c: 0xd8b04a }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; P.push({ g: CONE, m: M(0.4 + Math.cos(a) * 1.15, 1.6, -3.2 + Math.sin(a) * 1.15, 0, 0, 0, 0.6, 1.0, 0.6), c: 0xd8b04a }, { g: SPH, m: M(0.4 + Math.cos(a) * 1.15, 2.15, -3.2 + Math.sin(a) * 1.15, 0, 0, 0, 0.26, 0.26, 0.26), c: [0xff6aa8, 0x7ae0ff][i % 2] }); }
      put(P, vc, x0, z0, -0.4, 0.05, 5); }
    /* ---- the button fountain at the end of the castle road ---- */
    { const x0 = 6, z0 = 20; reserved.push([x0, z0, 4.5]); const gy = height(x0, z0), g = new T.Group(); g.position.set(x0, gy, z0); scene.add(g);
      const rim = new T.Mesh(new T.CylinderGeometry(3.2, 3.4, 0.6, 32), mat(0xfff4f8)); rim.position.y = 0.3; rim.castShadow = rim.receiveShadow = true; g.add(rim); const water = new T.Mesh(new T.CircleGeometry(2.9, 32), new T.MeshStandardMaterial({ color: 0x9ad8f0, roughness: 0.1, emissive: 0x4a9ac8, emissiveIntensity: 0.35 })); water.rotation.x = -PI / 2; water.position.y = 0.61; g.add(water);
      const btn = new T.Group(); btn.position.y = 2.7; g.add(btn); const disc = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.4, 36), mat(0xff8fb8, { roughness: 0.4 })); disc.rotation.x = PI / 2; disc.castShadow = true; btn.add(disc); for (const sd of [-1, 1]) { const rb = new T.Mesh(new T.TorusGeometry(1.42, 0.13, 8, 36), mat(0xff6a9a)); rb.position.z = sd * 0.2; btn.add(rb); }
      for (const [hx, hy] of [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45]]) { const h = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.46, 12), mat(0x9a4a6a)); h.rotation.x = PI / 2; h.position.set(hx, hy, 0); btn.add(h); } const post = new T.Mesh(new T.CylinderGeometry(0.2, 0.3, 1.8, 10), mat(0xfff4f8)); post.position.y = 1.4; g.add(post);
      const jets = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; jets.push(halo(g, 0xdff4ff, 0.8, Math.cos(a) * 2.2, 1.0, Math.sin(a) * 2.2, 0.6)); }
      fx((dt, tm) => { btn.rotation.y = tm * 0.5; jets.forEach((j, i) => { const u = (tm * 0.9 + i / 6) % 1; j.position.y = 0.8 + Math.sin(u * PI) * 1.6; j.material.opacity = 0.6 * Math.sin(u * PI); }); }); }
    /* ---- three ballgowns on pedestals in a ring of rose bushes (south-east) ---- */
    { const x0 = 17, z0 = 33, P = []; reserved.push([x0, z0, 6]); for (const [gx, gz, col] of [[-2.6, 0.4, 0xc0a0ff], [0, -0.6, 0xff8fb8], [2.6, 0.4, 0x8fd0f0]]) P.push({ g: CYL, m: M(gx, 0.3, gz, 0, 0, 0, 2.2, 0.6, 2.2), c: 0xfff4f0 }, { g: CONE, m: M(gx, 2.2, gz, 0, 0, 0, 3.0, 3.2, 3.0), c: col }, { g: CYL, m: M(gx, 4.4, gz, 0, 0, 0, 0.9, 1.4, 0.7), c: col }, { g: SPH, m: M(gx, 5.35, gz, 0, 0, 0, 0.34, 0.34, 0.34), c: 0xd8b04a });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; P.push({ g: SPH, m: M(Math.cos(a) * 4.4, 0.5, Math.sin(a) * 3.4, 0, 0, 0, 1.2, 1.0, 1.2), c: 0x4a8a4a }, { g: SPH, m: M(Math.cos(a) * 4.4, 1.0, Math.sin(a) * 3.4 + 0.3, 0, 0, 0, 0.35, 0.35, 0.35), c: [0xff5a7a, 0xffd0e0, 0xff8fb8][i % 3] }); }
      put(P, vc, x0, z0, 0.5, 0.1, 5); }
    K.finish();
  }

  /* ================================================================== the words */
  const S = {
    en: {
      rg_tape: "The Tailor's Tape", rg_tape_b: 'Measure it right and it fits.', rg_tape_hi: 'Welcome to my atelier! Every garment on the rail has its measurement.', rg_tape_how: 'Work out the length, then pick the garment with the answer. It will fly onto the mannequin.', rg_tape_q: 'Which one fits?',
      rg_fit: 'The Fitting Room', rg_fit_b: 'Open the right curtain.', rg_fit_hi: 'Four fitting rooms, and only one has the perfect outfit.', rg_fit_how: 'Solve the puzzle, then open the curtain with the answer.', rg_fit_q: 'Which curtain?',
      rg_cut: 'The Pattern Table', rg_cut_b: 'Cut the right piece for the quilt.', rg_cut_hi: 'My quilt needs new patches. Every piece has a shape puzzle.', rg_cut_how: 'Solve the shape puzzle, then pick the piece with the answer. It will be sewn into the quilt.', rg_cut_q: 'Which piece?',
      rg_beads: 'The Jewelry Box', rg_beads_b: 'String the right necklace.', rg_beads_hi: 'Welcome to the jewelry box! Each necklace spells a word.', rg_beads_how: 'Read carefully and pick the necklace with the right word. It will be fastened on the display.', rg_beads_q: 'Which necklace?'
    },
    he: {
      rg_tape: 'סרט המדידה של החייט', rg_tape_b: 'מודדים נכון — וזה מתאים.', rg_tape_hi: 'ברוכים הבאים לסדנה שלי! לכל בגד על המתלה יש מידה.', rg_tape_how: 'מחשבים את האורך, ובוחרים את הבגד עם התשובה. הוא יעוף אל הבובה.', rg_tape_q: 'מה מתאים?',
      rg_fit: 'חדר ההלבשה', rg_fit_b: 'פותחים את הווילון הנכון.', rg_fit_hi: 'ארבעה תאי הלבשה, ורק באחד מחכה התלבושת המושלמת.', rg_fit_how: 'פותרים את החידה, ופותחים את הווילון עם התשובה.', rg_fit_q: 'איזה וילון?',
      rg_cut: 'שולחן הגזרות', rg_cut_b: 'גוזרים את החלק הנכון לשמיכת הטלאים.', rg_cut_hi: 'לשמיכת הטלאים שלי חסרים טלאים. בכל חלק מחכה חידת צורות.', rg_cut_how: 'פותרים את חידת הצורות, ובוחרים את החלק עם התשובה. הוא ייתפר לשמיכה.', rg_cut_q: 'איזה חלק?',
      rg_beads: 'תיבת התכשיטים', rg_beads_b: 'משחילים את השרשרת הנכונה.', rg_beads_hi: 'ברוכים הבאים לתיבת התכשיטים! כל שרשרת מאייתת מילה.', rg_beads_how: 'קוראים בעיון ובוחרים את השרשרת עם המילה הנכונה. היא תיענד על הבובה.', rg_beads_q: 'איזו שרשרת?'
    }
  };

  KQRealms.define('fashion', {
    games: [
      { id: 'rg_tape', kind: 'math', stage: 'tape', theme: 'fa_atelier', host: 'smith', icon: 'ruler' },
      { id: 'rg_fit', kind: 'logic', stage: 'fit', theme: 'fa_boutique', host: 'fairy', icon: 'tag' },
      { id: 'rg_cut', kind: 'math', stage: 'cut', theme: 'fa_workroom', host: 'gnome', icon: 'scissors' },
      { id: 'rg_beads', kind: 'spelling', stage: 'beads', theme: 'fa_salon', host: 'crystal', icon: 'amulet' }
    ],
    strings: S, themes: THEMES, stages: STAGES, landmarks, scenery,
    gens: { rg_tape: tapeQ, rg_fit: fitQ, rg_cut: cutQ, rg_beads: beadQ }
  });
})();
