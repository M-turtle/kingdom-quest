/* Kingdom Quest — Art Studio helpers: the real paintings (shared/art/<id>.webp, catalogue in shared/art.js), their captions (the
   artist and the piece are always named), colour names and swatches, the art movements and techniques, and the Gallery walk.
   API: KQArtKit.img(work, cls) · framed(work) · caption(work) · swatch(colour) · cname(colour) · zoom(work, x%, y%, size%) · title(work)
        · artistName(en) · moveName(key) · moveAbout(key) · techName · techAbout · yearOf · century · cenName · openGallery(band) */
(function () {
  'use strict';
  const { t } = KQ, el = KQ.ui.el;
  const script = document.currentScript;
  const BASE = new URL('../shared/art/', script ? script.src : location.href).href;
  const he = () => KQ.i18n.lang === 'he';
  const L = pair => pair[he() ? 1 : 0];
  KQ.i18n.extend({
    en: { gl_title: 'The Gallery', gl_all: 'All', gl_close: 'Close', gl_count: '{n} paintings', gl_pd: 'Public domain', gl_cr: 'Shown for learning at home',
      c_red: 'red', c_orange: 'orange', c_yellow: 'yellow', c_green: 'green', c_blue: 'blue', c_purple: 'purple', c_pink: 'pink', c_brown: 'brown', c_black: 'black', c_white: 'white', c_grey: 'grey', c_lightblue: 'light blue' },
    he: { gl_title: 'הגלריה', gl_all: 'הכול', gl_close: 'סגירה', gl_count: '{n} ציורים', gl_pd: 'נחלת הכלל', gl_cr: 'מוצג ללמידה בבית',
      c_red: 'אדום', c_orange: 'כתום', c_yellow: 'צהוב', c_green: 'ירוק', c_blue: 'כחול', c_purple: 'סגול', c_pink: 'ורוד', c_brown: 'חום', c_black: 'שחור', c_white: 'לבן', c_grey: 'אפור', c_lightblue: 'תכלת' }
  });
  const HEX = { red: '#d8262e', orange: '#f08a24', yellow: '#f6d238', green: '#3c9a48', blue: '#2a5ad0', purple: '#7a3ab0', pink: '#f49ac0', brown: '#7a4a24', black: '#1a1a1a', white: '#f8f6f0', grey: '#8a8a8a', lightblue: '#8ac8f4' };
  const MOVES = {
    renaissance: [['Renaissance', 'רנסנס'], ['Artists studied nature and people closely and painted them lifelike, with depth and perspective.', 'אמנים חקרו מקרוב את הטבע ואת בני האדם וציירו אותם כמו בחיים, עם עומק ופרספקטיבה.']],
    baroque: [['Baroque (Dutch Golden Age)', 'בארוק (תור הזהב ההולנדי)'], ['Rich colours and dramatic light and shadow, often showing everyday life.', 'צבעים עשירים, אור וצל דרמטיים, ולעיתים קרובות חיי יום־יום.']],
    ukiyoe: [['Japanese woodblock prints (ukiyo-e)', 'הדפסי עץ יפניים (אוקיו־אה)'], ['Pictures carved into wooden blocks and printed in flat colours with bold outlines.', 'תמונות שנחרטו בלוחות עץ והודפסו בצבעים שטוחים עם קווי מתאר חזקים.']],
    romantic: [['Romanticism', 'רומנטיקה'], ['Big feelings and the power of nature: storms, mountains, sunsets.', 'רגשות גדולים ועוצמת הטבע: סערות, הרים ושקיעות.']],
    realism: [['Realism', 'ריאליזם'], ['Painting real people and real life exactly as they are.', 'ציור אנשים אמיתיים וחיים אמיתיים בדיוק כמו שהם.']],
    impressionism: [['Impressionism', 'אימפרסיוניזם'], ['Quick, visible brushstrokes that catch light and colour in a single moment, often painted outdoors.', 'משיכות מכחול מהירות שתופסות אור וצבע ברגע אחד, ולעיתים קרובות ציור בחוץ.']],
    postimp: [['Post-Impressionism', 'פוסט־אימפרסיוניזם'], ['Bold colours, strong shapes and personal brushwork, like Van Gogh’s swirls or Seurat’s dots.', 'צבעים נועזים, צורות חזקות ומשיכות מכחול אישיות, כמו הסלסולים של ואן גוך או הנקודות של סרה.']],
    artnouveau: [['Art Nouveau', 'ארט נובו'], ['Flowing lines, decoration and gold, inspired by plants and patterns.', 'קווים זורמים, קישוטים וזהב, בהשראת צמחים ודוגמאות.']],
    expressionism: [['Expressionism', 'אקספרסיוניזם'], ['Colours and shapes that show feelings rather than how things really look.', 'צבעים וצורות שמראים רגשות ולא איך הדברים נראים באמת.']],
    fauvism: [['Fauvism', 'פוביזם'], ['"Wild beast" colours: bright, unexpected colours straight from the tube.', 'צבעי "חיות פרא": צבעים בוהקים ומפתיעים, ישר מהשפופרת.']],
    cubism: [['Cubism', 'קוביזם'], ['Things broken into shapes and shown from several sides at once.', 'דברים מפורקים לצורות ומוצגים מכמה צדדים בבת אחת.']],
    abstract: [['Abstract art', 'אמנות מופשטת'], ['Colours, lines and shapes for their own sake, not pictures of things.', 'צבעים, קווים וצורות בשביל עצמם, לא ציורים של דברים.']],
    surrealism: [['Surrealism', 'סוריאליזם'], ['Dream pictures: ordinary things in impossible places.', 'תמונות של חלום: דברים רגילים במקומות בלתי אפשריים.']],
    modern: [['Modern art', 'אמנות מודרנית'], ['Artists of the 1900s inventing new, personal ways to paint.', 'אמני המאה ה־20 שהמציאו דרכים חדשות ואישיות לצייר.']],
    popart: [['Pop art', 'פופ ארט'], ['Art made from everyday things: comics, adverts, soup cans and famous faces.', 'אמנות מדברים של יום־יום: קומיקס, פרסומות, פחיות מרק ופנים מפורסמות.']],
    street: [['Street art', 'אמנות רחוב'], ['Art that started on city walls: bold lines, stencils and messages for everyone.', 'אמנות שהתחילה על קירות העיר: קווים חזקים, שבלונות ומסרים לכולם.']],
    contemporary: [['Contemporary art', 'אמנות עכשווית'], ['Art of our own time, often big, bright and playful.', 'אמנות של הזמן שלנו, לעיתים קרובות גדולה, צבעונית ושובבה.']]
  };
  const TECH = { 'grande-jatte': 'dots', 'pollock-convergence-number-10': 'drip', 'pollock-number-19': 'drip', 'matisse-the-snail': 'cutout', 'matisse-icarus': 'cutout', 'great-wave': 'woodblock', 'red-fuji': 'woodblock', 'sudden-shower': 'woodblock',
    'lichtenstein-girl-with-ball': 'benday', 'lichtenstein-artist-s-studio-look-mickey': 'benday', 'warhol-campbell-s-soup-cans': 'silkscreen', 'warhol-gold-marilyn-monroe': 'silkscreen', 'kusama-pumpkin': 'polka', 'kusama-yellow-pumpkin': 'polka', 'banksy-girl-with-balloon': 'stencil', 'starry-night': 'impasto', 'sunflowers': 'impasto', 'vertumnus': 'composite', 'summer-arcimboldo': 'composite' };
  const TECHS = {
    dots: [['Tiny dots of pure colour (pointillism)', 'נקודות קטנות של צבע טהור (פוינטיליזם)'], ['Seurat put thousands of small dots side by side; your eye mixes them from far away.', 'סרה שם אלפי נקודות קטנות זו ליד זו; העין מערבבת אותן מרחוק.']],
    drip: [['Dripping and pouring paint', 'טפטוף ושפיכה של צבע'], ['Pollock laid the canvas on the floor and dripped paint onto it from sticks and cans.', 'פולוק הניח את הבד על הרצפה וטפטף עליו צבע ממקלות ומפחיות.']],
    cutout: [['Cut-out painted paper', 'נייר צבוע גזור'], ['Matisse painted paper, cut shapes out with scissors and pinned them up: "drawing with scissors".', 'מאטיס צבע נייר, גזר ממנו צורות במספריים והצמיד אותן: "לצייר במספריים".']],
    woodblock: [['Carved woodblock printing', 'הדפס מלוח עץ חרוט'], ['The picture is carved into wood, inked and pressed onto paper, one block for each colour.', 'התמונה נחרטת בעץ, נצבעת בדיו ונלחצת על נייר, לוח אחד לכל צבע.']],
    benday: [['Printed comic-book dots', 'נקודות דפוס של קומיקס'], ['Lichtenstein copied the dots that cheap comic printing used, painting them by hand, very big.', 'ליכטנשטיין העתיק את הנקודות של הדפסת קומיקס זולה, וצייר אותן ביד, גדולות מאוד.']],
    silkscreen: [['Silkscreen printing', 'הדפס משי'], ['Warhol pushed ink through a fine screen, so he could print the same picture again and again.', 'וורהול דחף דיו דרך רשת עדינה, כך שיכול היה להדפיס את אותה תמונה שוב ושוב.']],
    polka: [['Polka dots everywhere', 'נקודות בכל מקום'], ['Kusama covers pumpkins, rooms and canvases with dots: endless, repeating patterns.', 'קוסאמה מכסה דלעות, חדרים ובדים בנקודות: דוגמאות שחוזרות בלי סוף.']],
    stencil: [['Spray paint through a stencil', 'ריסוס צבע דרך שבלונה'], ['A shape is cut out of card and sprayed through onto a wall, fast and sharp.', 'צורה נגזרת מקרטון ומרוססת דרכה על קיר, מהר ובחדות.']],
    impasto: [['Thick paint you can see and feel (impasto)', 'צבע עבה שרואים ומרגישים (אימפסטו)'], ['Van Gogh laid paint on so thickly that every brushstroke stands up from the canvas.', 'ואן גוך מרח צבע בשכבות כל כך עבות שכל משיכת מכחול בולטת מהבד.']],
    composite: [['A face made of fruit, vegetables and flowers', 'פנים עשויות מפירות, ירקות ופרחים'], ['Arcimboldo painted real fruit and flowers so that together they form a face.', 'ארצ׳ימבולדו צייר פירות ופרחים אמיתיים כך שיחד הם יוצרים פנים.']]
  };
  const artistHe = {}; (window.KQ_ART || []).forEach(w => { artistHe[w.a[0]] = w.a[1]; });
  const api = {
    MOVES, TECH, HEX,
    cname: c => t('c_' + c), title: w => L(w.t), artistName: en => he() ? (artistHe[en] || en) : en,
    moveName: m => L(MOVES[m][0]), moveAbout: m => L(MOVES[m][1]), techName: k => L(TECHS[k][0]), techAbout: k => L(TECHS[k][1]),
    yearOf: w => parseInt(String(w.y).replace(/[^\d]/g, ''), 10) || 2000, century: w => Math.floor((api.yearOf(w) - 1) / 100) + 1,
    cenName: n => n === 21 ? t('cen21') : t('cen', { n }),
    img(w, cls) { const i = document.createElement('img'); i.src = BASE + w.id + '.webp'; i.alt = L(w.t) + ', ' + api.artistName(w.a[0]); i.loading = 'lazy'; i.decoding = 'async'; if (cls) i.className = cls; i.draggable = false; return i; },
    framed(w) { const f = el('div', 'frame'); f.appendChild(api.img(w)); return f; },
    caption(w) { const d = el('div', 'cap'); d.appendChild(el('b', null, L(w.t))); d.appendChild(el('span', null, api.artistName(w.a[0]) + ' · ' + w.y)); return d; },
    swatch(c) { const s = el('span', 'sw'); s.style.background = HEX[c] || c; return s; },
    /* a round magnifier on part of the painting (x%, y% = the spot, size% = how far in) */
    zoom(w, x, y, size) { const z = el('div', 'zoom'); z.style.backgroundImage = 'url("' + BASE + w.id + '.webp")'; z.style.backgroundSize = size + '%'; z.style.backgroundPosition = x + '% ' + y + '%'; return z; },
    openGallery
  };
  /* the Gallery: every work the child's age suits, by movement, oldest first; tap for the big picture and what the style means */
  function openGallery(band) {
    const works = KQ_ART.filter(w => w.band <= Math.max(1, band)).sort((a, b) => api.yearOf(a) - api.yearOf(b));
    const root = el('div', 'gl'); root.setAttribute('role', 'dialog'); document.body.appendChild(root); document.body.classList.add('mc-open');
    const close = () => { root.remove(); document.body.classList.remove('mc-open'); document.removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', esc);
    let mv = null;
    function draw() {
      root.replaceChildren();
      const hd = el('div', 'gl-head'); hd.appendChild(el('h2', null, t('gl_title'))); hd.appendChild(el('span', 'gl-n', t('gl_count', { n: works.length }))); const x = el('button', 'mc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', t('gl_close')); x.onclick = close; hd.appendChild(x); root.appendChild(hd);
      const chips = el('div', 'gl-chips'); const chip = (k, label) => { const b = el('button', 'gl-chip' + (mv === k ? ' on' : ''), label); b.type = 'button'; b.onclick = () => { mv = k; draw(); }; chips.appendChild(b); };
      chip(null, t('gl_all')); [...new Set(works.map(w => w.mv))].forEach(k => chip(k, api.moveName(k))); root.appendChild(chips);
      if (mv) root.appendChild(el('p', 'gl-about', api.moveAbout(mv)));
      const grid = el('div', 'gl-grid'); works.filter(w => !mv || w.mv === mv).forEach(w => { const c = el('button', 'gl-item'); c.type = 'button'; const f = el('div', 'frame'); f.appendChild(api.img(w)); c.appendChild(f); c.appendChild(api.caption(w)); c.onclick = () => big(w); grid.appendChild(c); }); root.appendChild(grid);
    }
    function big(w) {
      const lb = el('div', 'gl-big'); const f = el('div', 'frame'); const im = api.img(w); im.loading = 'eager'; f.appendChild(im); lb.appendChild(f); lb.appendChild(api.caption(w));
      lb.appendChild(el('p', 'gl-about', api.moveName(w.mv) + ': ' + api.moveAbout(w.mv))); if (TECH[w.id]) lb.appendChild(el('p', 'gl-about', api.techName(TECH[w.id]) + ': ' + api.techAbout(TECH[w.id])));
      lb.appendChild(el('small', 'gl-note', w.pd ? t('gl_pd') : t('gl_cr')));
      lb.onclick = () => lb.remove(); root.appendChild(lb);
    }
    draw();
  }
  window.KQArtKit = api;
})();
