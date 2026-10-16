/* Kingdom Quest · the Field Guide of the Nature Trail (Yoni 2026-10-09: 'the breakdown of all the animals needs to be more advanced …
   not a lot of info on each animal … the resolution is very low'; he picked style A, the painted field guide).
   A collection, not a list: an animal's page joins the guide the first time a question is about it; three right answers about it
   earn a gold seal. Each page grows with the child: big facts in the animal's own voice at 4–7, numbers and superpowers at 8–11,
   the tree of life, conservation status and real research at 12+. Every fact comes from nature/guide-data.js (window.KQ_GUIDE),
   built from fact sheets checked against at least two sources. The paintings are 6 sheets of 6 (nature/art/guide0..5.webp) and a
   thumbnail sheet (thumbs.webp). API: KQGuide.open(), .page(id), .meet(id, ok), .pic(id), .thumb(id), .a(id), .txt(id) */
(function () {
  'use strict';
  if (!window.KQ || !window.KQ_GUIDE) return;
  const G = window.KQ_GUIDE, { t } = KQ, el = KQ.ui.el, ART = 'art/', AV = '?v=2';
  const he = () => KQ.i18n.lang === 'he';
  KQ.i18n.extend({
    en: { fg_title: 'Field Guide', fg_found: '{n} of {t} animals found', fg_all: 'All', fg_back: 'Trail', fg_shelf: 'All animals', fg_prev: 'Previous animal', fg_next: 'Next animal',
      fg_locked: 'Not found yet', fg_lockedHint: 'Meet it in a question to add its page', fg_sealGold: 'Gold seal', fg_sealFound: 'Found',
      fg_step1: 'Meet it.', fg_step1b: 'Every animal question on the trail adds that animal’s page to your guide.', fg_step2: 'Read it.', fg_step2b: 'The page grows with you: more to discover at every age.', fg_step3: 'Master it.', fg_step3b: 'Three right answers about an animal earn its page a gold seal.',
      fg_plate: 'Plate {n}', fg_powers: 'Superpowers', fg_world: 'Where in the world', fg_menu: 'On the menu', fg_note: 'Field note', fg_lab: 'In the lab', fg_tree: 'Where it sits in the tree of life', fg_status: 'Conservation status',
      fg_myth: 'Myth or fact?', fg_isMyth: 'Myth.', fg_isFact: 'Fact.', fg_awake: 'Awake', fg_call: 'Hear its call', fg_silent: 'It makes no sound we can hear.', fg_sound: 'Recording',
      fg_newPage: 'New page in your Field Guide: {name}', fg_newSeal: 'Gold seal for the {name}!',
      fg_a_day: 'by day', fg_a_night: 'at night', 'fg_a_dawn and dusk': 'at dawn and dusk', 'fg_a_day and night': 'by day and at night',
      fg_c_mammal: 'Mammal', fg_c_bird: 'Bird', fg_c_fish: 'Fish', fg_c_reptile: 'Reptile', fg_c_amphibian: 'Amphibian', fg_c_insect: 'Insect', fg_c_mollusc: 'Mollusc', fg_c_crustacean: 'Crustacean',
      fg_h_ocean: 'Ocean', fg_h_forest: 'Forest', fg_h_ice: 'Ice and snow', fg_h_farm: 'Farm and field', fg_h_pond: 'Pond and river', fg_h_savanna: 'Grasslands', fg_h_rainforest: 'Rainforest', fg_h_desert: 'Desert',
      fg_iucn_LC: 'Least Concern', fg_iucn_NT: 'Near Threatened', fg_iucn_VU: 'Vulnerable', fg_iucn_EN: 'Endangered', fg_iucn_CR: 'Critically Endangered', fg_iucn_EW: 'Extinct in the Wild', fg_iucn_EX: 'Extinct', fg_iucn_DD: 'Not enough data', fg_iucn_domestic: 'A farm animal (not on the list)',
      'fg_ct_North America': 'N. America', 'fg_ct_South America': 'S. America', fg_ct_Europe: 'Europe', fg_ct_Africa: 'Africa', fg_ct_Asia: 'Asia', fg_ct_Australia: 'Australia', fg_ct_Antarctica: 'Antarctica', 'fg_ct_Worldwide (farms)': 'Worldwide, on farms' },
    he: { fg_title: 'מדריך השדה', fg_found: 'נמצאו {n} מתוך {t} בעלי חיים', fg_all: 'הכול', fg_back: 'לשביל', fg_shelf: 'כל בעלי החיים', fg_prev: 'בעל החיים הקודם', fg_next: 'בעל החיים הבא',
      fg_locked: 'עוד לא נמצא', fg_lockedHint: 'פוגשים אותו בשאלה, והדף שלו מצטרף למדריך', fg_sealGold: 'חותם זהב', fg_sealFound: 'נמצא',
      fg_step1: 'פוגשים.', fg_step1b: 'כל שאלה על בעל חיים בשביל מוסיפה את הדף שלו למדריך.', fg_step2: 'קוראים.', fg_step2b: 'הדף גדל איתכם: בכל גיל יש בו עוד מה לגלות.', fg_step3: 'מומחים.', fg_step3b: 'שלוש תשובות נכונות על בעל חיים מזכות את הדף שלו בחותם זהב.',
      fg_plate: 'לוח {n}', fg_powers: 'כוחות־על', fg_world: 'איפה בעולם', fg_menu: 'מה בתפריט', fg_note: 'רשימה מהשטח', fg_lab: 'במעבדה', fg_tree: 'המקום שלו בעץ החיים', fg_status: 'מצב השמירה',
      fg_myth: 'מיתוס או עובדה?', fg_isMyth: 'מיתוס.', fg_isFact: 'עובדה.', fg_awake: 'ער', fg_call: 'שומעים את הקול', fg_silent: 'אין לו קול שאפשר לשמוע.', fg_sound: 'הקלטה',
      fg_newPage: 'דף חדש במדריך השדה: {name}', fg_newSeal: 'חותם זהב: {name}!',
      fg_a_day: 'ביום', fg_a_night: 'בלילה', 'fg_a_dawn and dusk': 'בשחר ובדמדומים', 'fg_a_day and night': 'ביום ובלילה',
      fg_c_mammal: 'יונק', fg_c_bird: 'עוף', fg_c_fish: 'דג', fg_c_reptile: 'זוחל', fg_c_amphibian: 'דו־חי', fg_c_insect: 'חרק', fg_c_mollusc: 'רכיכה', fg_c_crustacean: 'סרטן (סרטנאי)',
      fg_h_ocean: 'ים ואוקיינוס', fg_h_forest: 'יער', fg_h_ice: 'קרח ושלג', fg_h_farm: 'חווה ושדה', fg_h_pond: 'ברכה ונהר', fg_h_savanna: 'ערבות', fg_h_rainforest: 'יער גשם', fg_h_desert: 'מדבר',
      fg_iucn_LC: 'ללא חשש', fg_iucn_NT: 'קרוב לסיכון', fg_iucn_VU: 'פגיע', fg_iucn_EN: 'בסכנת הכחדה', fg_iucn_CR: 'בסכנת הכחדה חמורה', fg_iucn_EW: 'נכחד בטבע', fg_iucn_EX: 'נכחד', fg_iucn_DD: 'אין מספיק מידע', fg_iucn_domestic: 'חיית משק (לא ברשימה)',
      'fg_ct_North America': 'צפון אמריקה', 'fg_ct_South America': 'דרום אמריקה', fg_ct_Europe: 'אירופה', fg_ct_Africa: 'אפריקה', fg_ct_Asia: 'אסיה', fg_ct_Australia: 'אוסטרליה', fg_ct_Antarctica: 'אנטארקטיקה', 'fg_ct_Worldwide (farms)': 'בכל העולם, בחוות' }
  });
  const css = () => { if (document.getElementById('fgx-css')) return; const s = document.createElement('style'); s.id = 'fgx-css'; s.textContent = `
.fgx{position:fixed; inset:0; z-index:45; overflow:auto; background:#0e1612; color:#f3ead6; padding:calc(14px + env(safe-area-inset-top,0px)) 16px 32px; font-family:'Assistant','Rubik',sans-serif}
.fgx *{box-sizing:border-box}
.fgx h1, .fgx h2, .fgx h3{-webkit-text-fill-color:currentColor; background:none; text-shadow:none; filter:none; letter-spacing:normal; text-transform:none; border:none; box-shadow:none; padding:0; border-radius:0; display:block}   /* the game's gold title style is not for these pages */
.fgx-pr h1, .fgx-h{color:#231c13}
.fgx-in{max-width:1200px; margin:0 auto; display:flex; flex-direction:column; gap:18px}
.fgx-top{display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap}
.fgx-btn{display:inline-flex; align-items:center; gap:6px; min-height:44px; padding:0 18px; border-radius:22px; border:1px solid rgba(243,234,214,.35); background:rgba(243,234,214,.06); color:#f3ead6; font:700 16px 'Assistant','Rubik',sans-serif; cursor:pointer}
.fgx-btn.gold{border-color:#e2bf68; color:#e2bf68}
.fgx-title{display:flex; flex-direction:column; align-items:center; gap:4px}
.fgx-title h2{margin:0; font:700 clamp(22px,4vw,30px) 'Cinzel','Frank Ruhl Libre',serif; letter-spacing:.14em !important; color:#e2bf68}
.fgx-prog{display:flex; align-items:center; gap:10px; font-weight:700; font-size:14px}
.fgx-bar{width:180px; height:8px; border-radius:4px; background:rgba(243,234,214,.15); overflow:hidden} .fgx-bar i{display:block; height:100%; background:#e2bf68}
.fgx-chips{display:flex; gap:6px; flex-wrap:wrap}
.fgx-chip{min-height:38px; padding:0 14px; border-radius:19px; border:1px solid rgba(243,234,214,.3); background:transparent; color:#f3ead6; font:700 14px 'Assistant','Rubik',sans-serif; cursor:pointer}
.fgx-chip.on{background:#e2bf68; border-color:#e2bf68; color:#1d160c}
.fgx-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:16px}
.fgx-card{position:relative; display:flex; flex-direction:column; border-radius:12px; overflow:hidden; background:#f4ecdb; color:#231c13; text-align:start; border:none; padding:0; cursor:pointer; box-shadow:0 12px 30px rgba(0,0,0,.4); font:inherit}
.fgx-card .gp{width:100%; aspect-ratio:1/1}
.fgx-card .tx{padding:10px 14px 14px; display:flex; flex-direction:column; gap:5px; border-top:1px solid #e2d6bb}
.fgx-card b{font:600 21px/1.1 'Fraunces','Frank Ruhl Libre',serif} .fgx-card i{font:italic 500 14px 'Fraunces',serif; color:#5c4f3d} .fgx-card small{font-size:14px; line-height:1.4; color:#4a3f30}
.fgx-tags{display:flex; gap:5px; flex-wrap:wrap} .fgx-tags span{padding:3px 8px; border-radius:10px; background:#e2d6bb; font-weight:700; font-size:12px; color:#3a3024} .fgx-tags span.h{background:#dfe8d6; color:#2f4a28}
.fgx-seal{position:absolute; top:10px; inset-inline-end:10px; width:54px; height:54px; border-radius:27px; display:grid; place-items:center; text-align:center; font:800 9.5px/1.1 'Assistant',sans-serif; letter-spacing:.06em; background:#f4ecdb; color:#3d6b35; border:2px solid #3d6b35}
.fgx-seal.gold{background:#c9952f; color:#1d160c; border-color:#c9952f; box-shadow:0 0 0 3px #f4ecdb, 0 0 0 5px #c9952f}
.fgx-lock{min-height:300px; border-radius:12px; border:1.5px dashed rgba(243,234,214,.35); background:rgba(243,234,214,.04); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:20px; text-align:center}
.fgx-lock .q{width:80px; height:80px; border-radius:40px; border:1.5px solid rgba(226,191,104,.6); display:grid; place-items:center; font:600 40px 'Fraunces',serif; color:#e2bf68}
.fgx-lock .h{font-weight:700; font-size:12px; letter-spacing:.14em; color:rgba(243,234,214,.75); text-transform:uppercase} .fgx-lock blockquote{margin:0; font:italic 500 17px/1.35 'Fraunces','Frank Ruhl Libre',serif} .fgx-lock small{font-size:13px; color:rgba(243,234,214,.75)}
.fgx-steps{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; padding:16px 18px; border-radius:12px; background:rgba(243,234,214,.06); border:1px solid rgba(243,234,214,.14)}
.fgx-steps div{display:flex; gap:10px; align-items:flex-start; font-size:15px; line-height:1.45} .fgx-steps span.n{width:28px; height:28px; border-radius:14px; background:#e2bf68; color:#1d160c; display:grid; place-items:center; font-weight:800; flex:none}
.fgx-book{display:flex; flex-wrap:wrap; border-radius:14px; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,.55)}
.fgx-pl{flex:1 1 420px; min-width:0; background:#f4ecdb; color:#2a2219; padding:26px 28px; display:flex; flex-direction:column; gap:12px}
.fgx-pr{flex:1 1 440px; min-width:0; background:#f7f0e1; color:#231c13; padding:26px 30px; display:flex; flex-direction:column; gap:18px; box-shadow:inset 22px 0 26px -22px rgba(70,48,14,.35)}
[dir=rtl] .fgx-pr{box-shadow:inset -22px 0 26px -22px rgba(70,48,14,.35)}
.fgx-eb{display:flex; justify-content:space-between; gap:10px; font-weight:700; font-size:12px; letter-spacing:.14em; color:#6f604a; text-transform:uppercase}
.fgx-pl .gp{width:100%; max-width:520px; aspect-ratio:1/1; margin:0 auto}
.fgx-cap{font:italic 500 15px/1.4 'Fraunces','Frank Ruhl Libre',serif; color:#5c4f3d}
.fgx-pr h1{margin:0; font:600 clamp(36px,6vw,56px)/1 'Fraunces','Frank Ruhl Libre',serif}
.fgx-sub{display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; font:500 18px 'Fraunces',serif; color:#4a3f30}
.fgx-callbox{display:flex; flex-direction:column; align-items:flex-start; gap:4px} .fgx-credit{font-size:11.5px; line-height:1.35; color:#6f604a; max-width:420px}
.fgx-call{align-self:flex-start; display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:0 16px; border-radius:22px; border:1px solid #c9b994; background:#efe5cf; color:#2a2219; font:700 15px 'Assistant',sans-serif; cursor:pointer}
.fgx-facts{display:flex; flex-direction:column; gap:16px; margin:0; padding:0; list-style:none} .fgx-facts li{display:flex; gap:14px; align-items:center; font:500 clamp(22px,3.4vw,30px)/1.2 'Fraunces','Frank Ruhl Libre',serif}
.fgx-facts li:before{content:''; flex:none; width:16px; height:16px; border-radius:8px; background:#3d6b35; box-shadow:0 0 0 5px #dfe8d6}
.fgx-stats{display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:12px; padding:12px 0; border-top:1px solid #dccfb2; border-bottom:1px solid #dccfb2}
.fgx-stats div{display:flex; flex-direction:column; gap:2px} .fgx-stats span{font-weight:700; font-size:11px; letter-spacing:.14em; color:#6f604a; text-transform:uppercase} .fgx-stats b{font:600 21px 'Fraunces','Frank Ruhl Libre',serif} .fgx-stats small{font-size:13px; color:#5c4f3d}
.fgx-h{margin:0; font:600 21px 'Fraunces','Frank Ruhl Libre',serif}
.fgx-pw{display:flex; gap:12px; align-items:flex-start} .fgx-pw .n{width:26px; height:26px; border-radius:13px; background:#9c3d22; color:#fff; display:grid; place-items:center; font-weight:800; font-size:13px; flex:none; margin-top:2px}
.fgx-pw b{display:block; font-weight:800; font-size:16px} .fgx-pw p{margin:2px 0 0; font-size:15px; line-height:1.45; color:#4a3f30}
.fgx-two{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:18px}
.fgx-ct{display:flex; flex-wrap:wrap; gap:5px} .fgx-ct span{padding:4px 9px; border-radius:12px; font-weight:700; font-size:12px; background:transparent; color:#8a7b62; border:1px dashed #b9aa8b} .fgx-ct span.on{background:#3d6b35; color:#fff; border-color:#3d6b35}
.fgx-p{margin:0; font-size:15px; line-height:1.5; color:#4a3f30}
.fgx-box{display:flex; flex-direction:column; gap:6px; padding:14px 16px; border-radius:10px; background:#ebe1c9; border:1px solid #d6c7a5} .fgx-box.lab{background:#e9efe2; border-color:#c8d6bb} .fgx-box.myth{background:#f3e3d4; border-color:#e0c3a8}
.fgx-box .k{font-weight:700; font-size:12px; letter-spacing:.14em; color:#6f604a; text-transform:uppercase}
.fgx-tree{display:flex; flex-wrap:wrap; align-items:center; gap:6px} .fgx-tree span{padding:5px 10px; border-radius:6px; background:#e8ddc4; color:#3a3024; font-weight:700; font-size:13px} .fgx-tree span.sp{background:#2f5a2a; color:#fff; font:italic 600 14px 'Fraunces',serif}
.fgx-iucn{display:flex; gap:4px} .fgx-iucn span{flex:1; text-align:center; padding:6px 0; border-radius:6px; background:#e8ddc4; color:#7a6a52; font-weight:800; font-size:13px} .fgx-iucn span.on{background:#3d6b35; color:#fff} .fgx-iucn span.on.w{background:#c26a1c} .fgx-iucn span.on.r{background:#b0342a}
.fgx-nav{display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap}
.gp{background-repeat:no-repeat; background-color:#f4ecdb; border-radius:8px}
@media (max-width:560px){ .fgx-pl, .fgx-pr{padding:18px} .fgx-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px} .fgx-card b{font-size:17px} }`; document.head.appendChild(s); };

  /* ---------- data ---------- */
  const A = id => G.a[id];
  const txt = id => { const a = A(id); return (he() && a.he) ? a.he : a.en; };
  const name = id => txt(id).name;
  /* a painting from its sheet (3 × 2), or the small one from the thumbnail sheet (6 × 6) */
  function pic(id, cls) { const a = A(id), d = el('div', 'gp' + (cls ? ' ' + cls : '')); const sh = Math.floor(a.i / 6), c = a.i % 6;
    d.style.backgroundImage = `url(${ART}guide${sh}.webp${AV})`; d.style.backgroundSize = '300% 200%'; d.style.backgroundPosition = `${(c % 3) * 50}% ${Math.floor(c / 3) * 100}%`; d.setAttribute('role', 'img'); d.setAttribute('aria-label', name(id)); return d; }
  function thumb(id, cls) { const a = A(id), d = el('div', 'gp' + (cls ? ' ' + cls : ''));
    d.style.backgroundImage = `url(${ART}thumbs.webp${AV})`; d.style.backgroundSize = '600% 600%'; d.style.backgroundPosition = `${(a.i % 6) * 20}% ${Math.floor(a.i / 6) * 20}%`; d.setAttribute('role', 'img'); d.setAttribute('aria-label', name(id)); return d; }
  /* how deep a page goes: the child's band on the trail (1–2 → 4–7, 3–4 → 8–11, 5–6 → 12+) */
  function level() { const p = KQ.profiles.active(); let b = 2; try { b = KQ.ladder.band(p.id, 'nature', [1, 2, 3, 4, 5, 6]) || 2; } catch (e) {} return b <= 2 ? 1 : b <= 4 ? 2 : 3; }

  /* ---------- the collection: found when a question is about it; a gold seal after three right answers ---------- */
  function book() { const st = KQ.state(), p = KQ.profiles.active(), pid = p ? p.id : 'guest'; st.guide = st.guide || {}; return (st.guide[pid] = st.guide[pid] || { found: {}, right: {} }); }
  function meet(id, ok) { if (!A(id)) return; const b = book(); let msg = null;
    if (!b.found[id]) { b.found[id] = Date.now(); msg = t('fg_newPage', { name: name(id) }); }
    if (ok) { b.right[id] = (b.right[id] || 0) + 1; if (b.right[id] === 3) msg = t('fg_newSeal', { name: name(id) }); }
    KQ.save(); if (msg && KQ.ui.toast) KQ.ui.toast(msg); }

  /* ---------- the shelf ---------- */
  let root = null, filter = 'all';
  const close = () => { if (root) { root.remove(); root = null; document.removeEventListener('keydown', onKey); } };
  const onKey = e => { if (e.key === 'Escape') close(); };
  function frame() { css(); close(); root = el('div', 'fgx'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', t('fg_title')); document.body.appendChild(root); document.addEventListener('keydown', onKey); const inner = el('div', 'fgx-in'); root.appendChild(inner); return inner; }
  function btn(label, cls, fn) { const b = el('button', 'fgx-btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = fn; return b; }
  function open() { const inner = frame(), b = book(), found = G.ids.filter(id => b.found[id]);
    const top = el('div', 'fgx-top'); top.appendChild(btn((he() ? '› ' : '‹ ') + t('fg_back'), '', close));
    const tt = el('div', 'fgx-title'); tt.appendChild(el('h2', null, t('fg_title'))); const pr = el('div', 'fgx-prog'), bar = el('div', 'fgx-bar'), fill = el('i'); fill.style.width = Math.round(found.length / G.ids.length * 100) + '%'; bar.appendChild(fill); pr.appendChild(bar); pr.appendChild(el('span', null, t('fg_found', { n: found.length, t: G.ids.length }))); tt.appendChild(pr); top.appendChild(tt); top.appendChild(el('span')); inner.appendChild(top);
    const homes = ['all'].concat(['forest', 'farm', 'ocean', 'pond', 'savanna', 'desert', 'rainforest', 'ice'].filter(h => G.ids.some(id => A(id).home === h)));
    const chips = el('div', 'fgx-chips'); for (const h of homes) { const c = el('button', 'fgx-chip' + (filter === h ? ' on' : ''), h === 'all' ? t('fg_all') : t('fg_h_' + h)); c.type = 'button'; c.onclick = () => { filter = h; open(); }; chips.appendChild(c); } inner.appendChild(chips);
    const grid = el('div', 'fgx-grid'), lv = level(); const list = G.ids.filter(id => filter === 'all' || A(id).home === filter);
    for (const id of list.filter(id => b.found[id]).concat(list.filter(id => !b.found[id]))) { const a = A(id), x = txt(id);
      if (b.found[id]) { const c = el('button', 'fgx-card'); c.type = 'button'; c.appendChild(thumb(id)); const gold = (b.right[id] || 0) >= 3; c.appendChild(el('div', 'fgx-seal' + (gold ? ' gold' : ''), gold ? t('fg_sealGold') : t('fg_sealFound')));
        const tx = el('div', 'tx'); tx.appendChild(el('b', null, x.name)); tx.appendChild(el('i', null, a.latin)); const tg = el('div', 'fgx-tags'); tg.appendChild(el('span', null, t('fg_c_' + a.group))); tg.appendChild(el('span', 'h', t('fg_h_' + a.home))); tx.appendChild(tg);
        tx.appendChild(el('small', null, lv === 1 ? (x.page_facts || [])[0] || '' : ((x.powers || [])[0] || {}).title || '')); c.appendChild(tx); c.onclick = () => page(id); grid.appendChild(c); }
      else { const c = el('div', 'fgx-lock'); c.appendChild(el('div', 'q', '?')); c.appendChild(el('div', 'h', t('fg_h_' + a.home) + ' · ' + t('fg_locked'))); c.appendChild(el('blockquote', null, '“' + ((x.clues || [])[0] || '') + '”')); c.appendChild(el('small', null, t('fg_lockedHint'))); grid.appendChild(c); } }
    inner.appendChild(grid);
    const steps = el('div', 'fgx-steps'); [[1, 'fg_step1', 'fg_step1b'], [2, 'fg_step2', 'fg_step2b'], [3, 'fg_step3', 'fg_step3b']].forEach(([n, a, b2]) => { const d = el('div'); d.appendChild(el('span', 'n', String(n))); const p = el('span'); p.appendChild(el('b', null, t(a) + ' ')); p.appendChild(document.createTextNode(t(b2))); d.appendChild(p); steps.appendChild(d); }); inner.appendChild(steps);
    root.scrollTop = 0; }

  /* ---------- an animal's page ---------- */
  /* the animal's real call (tools/pack_animal_calls.py → art/calls.mp3): decoded once, each clip played from its own second, with its credit */
  function playClip(S, c) {
    const ctx = window.KQMusic ? KQMusic.ac() : null;
    if (!ctx) { try { const au = S._a || (S._a = new Audio(ART + S.file + AV)); au.currentTime = c[0]; au.play(); clearTimeout(S._t); S._t = setTimeout(() => au.pause(), c[1] * 1000); } catch (e) {} return; }
    S._buf = S._buf || fetch(ART + S.file + AV).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(a => new Promise((res, rej) => ctx.decodeAudioData(a, res, rej)));
    S._buf.then(buf => { if (S._src) { try { S._src.stop(); } catch (e) {} } const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(0, c[0], c[1]); S._src = src; }).catch(() => { S._buf = null; });
  }
  function call(id) { const S = window.KQ_GUIDE_SOUNDS; if (!S) return null; const c = S.clips && S.clips[id]; if (c === 0) { const n = el('div', 'fgx-p'); n.textContent = t('fg_silent'); return n; } if (!c) return null;
    const box = el('div', 'fgx-callbox'); const b = el('button', 'fgx-call'); b.type = 'button'; b.appendChild(el('span', null, '▶')); b.appendChild(el('span', null, t('fg_call'))); b.onclick = () => playClip(S, c); box.appendChild(b);
    if (S.credit && S.credit[id]) box.appendChild(el('small', 'fgx-credit', t('fg_sound') + ': ' + S.credit[id])); return box; }
  function page(id) { const inner = frame(), a = A(id), x = txt(id), lv = level(), b = book(), found = G.ids.filter(k => b.found[k]); const at = found.indexOf(id);
    const nav = el('div', 'fgx-nav'); nav.appendChild(btn((he() ? '› ' : '‹ ') + t('fg_shelf'), '', open)); const pn = el('div', 'fgx-chips');
    if (found.length > 1) { pn.appendChild(btn(he() ? '›' : '‹', '', () => page(found[(at - 1 + found.length) % found.length]))); pn.lastChild.setAttribute('aria-label', t('fg_prev')); pn.appendChild(btn(he() ? '‹' : '›', '', () => page(found[(at + 1) % found.length]))); pn.lastChild.setAttribute('aria-label', t('fg_next')); }
    nav.appendChild(pn); inner.appendChild(nav);
    const bk = el('div', 'fgx-book'), L = el('div', 'fgx-pl'), R = el('div', 'fgx-pr'); bk.appendChild(L); bk.appendChild(R); inner.appendChild(bk);
    const eb = el('div', 'fgx-eb'); eb.appendChild(el('span', null, t('fg_plate', { n: a.i + 1 }))); eb.appendChild(el('span', null, t('fg_h_' + a.home))); L.appendChild(eb); L.appendChild(pic(id)); if (x.habitat_text) L.appendChild(el('div', 'fgx-cap', x.habitat_text));
    if (lv >= 3 && x.taxonomy) { L.appendChild(el('div', 'fgx-eb', t('fg_tree'))); const tr = el('div', 'fgx-tree'); x.taxonomy.forEach((s, i) => tr.appendChild(el('span', i === x.taxonomy.length - 1 ? 'sp' : '', s + (i < x.taxonomy.length - 1 ? (he() ? '  ‹' : '  ›') : '')))); L.appendChild(tr); }
    if (lv >= 3 && a.iucn) { L.appendChild(el('div', 'fgx-eb', t('fg_status'))); if (a.iucn !== 'domestic') { const sc = el('div', 'fgx-iucn'); ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'].forEach(k => sc.appendChild(el('span', k === a.iucn ? 'on' + (k === 'NT' || k === 'VU' ? ' w' : k === 'LC' ? '' : ' r') : '', k))); L.appendChild(sc); }
      L.appendChild(el('p', 'fgx-p', t('fg_iucn_' + a.iucn) + (x.iucn_note ? '. ' + x.iucn_note : ''))); }
    const hd = el('div'); hd.style.cssText = 'display:flex; flex-direction:column; gap:6px'; hd.appendChild(el('div', 'fgx-eb', lv === 1 ? t('fg_h_' + a.home) : t('fg_c_' + a.group) + (x.taxonomy && x.taxonomy[3] ? ' · ' + x.taxonomy[3].split(' · ')[0] : ''))); hd.appendChild(el('h1', null, x.name));
    const sub = el('div', 'fgx-sub'); if (lv >= 2) sub.appendChild(el('i', null, a.latin)); if (a.active) sub.appendChild(el('span', null, t('fg_awake') + ': ' + t('fg_a_' + a.active))); hd.appendChild(sub); const cl = call(id); if (cl) hd.appendChild(cl); R.appendChild(hd);
    if (lv === 1) { const ul = el('ul', 'fgx-facts'); (x.page_facts || []).forEach(f => ul.appendChild(el('li', null, f))); R.appendChild(ul); }
    else {
      if (x.stats && x.stats.length) { const s = el('div', 'fgx-stats'); x.stats.forEach(st => { const d = el('div'); d.appendChild(el('span', null, st.label)); d.appendChild(el('b', null, st.value)); if (st.note) d.appendChild(el('small', null, st.note)); s.appendChild(d); }); R.appendChild(s); }
      if (x.powers && x.powers.length) { R.appendChild(el('h3', 'fgx-h', t('fg_powers'))); x.powers.forEach((p, i) => { const d = el('div', 'fgx-pw'); d.appendChild(el('span', 'n', String(i + 1))); const tx = el('div'); tx.appendChild(el('b', null, p.title)); tx.appendChild(el('p', null, lv >= 3 ? p.teen : p.kid)); d.appendChild(tx); R.appendChild(d); }); }
      const two = el('div', 'fgx-two'), w = el('div'); w.appendChild(el('h3', 'fgx-h', t('fg_world'))); const ct = el('div', 'fgx-ct'); const has = a.continents || [];
      if (has.includes('Worldwide (farms)')) ct.appendChild(el('span', 'on', t('fg_ct_Worldwide (farms)'))); else ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Australia', 'Antarctica'].forEach(c => ct.appendChild(el('span', has.includes(c) ? 'on' : '', t('fg_ct_' + c)))); w.appendChild(ct); two.appendChild(w);
      const mn = el('div'); mn.appendChild(el('h3', 'fgx-h', t('fg_menu'))); mn.appendChild(el('p', 'fgx-p', x.menu || '')); two.appendChild(mn); R.appendChild(two);
      if (x.myth && x.myth.claim) { const m = el('div', 'fgx-box myth'); m.appendChild(el('div', 'k', t('fg_myth'))); m.appendChild(el('p', 'fgx-p', '“' + x.myth.claim + '” ' + t(x.myth.verdict === 'fact' ? 'fg_isFact' : 'fg_isMyth') + ' ' + (x.myth.why || ''))); R.appendChild(m); }
      if (lv >= 3 && x.lab_note) { const m = el('div', 'fgx-box lab'); m.appendChild(el('div', 'k', t('fg_lab'))); m.appendChild(el('p', 'fgx-p', x.lab_note)); R.appendChild(m); }
      if (x.field_note && x.field_note.text) { const m = el('div', 'fgx-box'); m.appendChild(el('div', 'k', t('fg_note') + (x.field_note.place ? ' · ' + (he() && x.field_note.place === 'Israel' ? 'ישראל' : x.field_note.place) : ''))); m.appendChild(el('p', 'fgx-p', x.field_note.text)); R.appendChild(m); } }
    root.scrollTop = 0; }

  window.KQGuide = { open, page, meet, pic, thumb, a: A, txt, name, level, close };
})();
