/* Kingdom Quest — the Music Creator (Yoni 2026-10-03: 'a music creator … use a violin, a piano, drums, a cello and create music …
   learn about notes … change the instrument … do samples … built for the level: very simple with a lot of guidance at first,
   more options higher up').
   A grid of coloured notes (rows = notes, columns = time). Ages 4–5: six notes, eight steps, one instrument, and "Learn a tune" leads
   note by note (the next note glows). Ages 6–9: the whole scale, sixteen steps, a drum lane and samples (beats, a cello bass line),
   tempo. Ages 10+: sharps, four tracks, chords, loops and the melody written on a staff. Famous tunes always name their composer.
   Songs are saved to the player's own concert (KQ.state().music[pid].songs). API: KQCreator.open(band) */
(function () {
  'use strict';
  const M = window.KQMusic; if (!M || !window.KQ) return;
  const { t } = KQ, el = KQ.ui.el;
  KQ.i18n.extend({
    en: { mc_title: 'Music Creator', mc_close: 'Close', mc_toBand: 'My band', mc_learn: 'Learn a tune', mc_free: 'Make my own', mc_play: 'Play', mc_stop: 'Stop', mc_clear: 'Clear', mc_save: 'Save to my concert', mc_concert: 'My concert', mc_empty: 'No songs yet. Make one and save it!',
      mc_tempo: 'Speed', mc_slow: 'Slow', mc_fastL: 'Fast', mc_sample: 'Add a sample', mc_s_rock: 'Rock beat', mc_s_march: 'March', mc_s_clap: 'Clapping', mc_s_bass: 'Cello bass line', mc_drums: 'Drums', mc_melody: 'Melody', mc_harmony: 'Harmony', mc_bass: 'Bass',
      mc_chord: 'Chords', mc_loop: 'Loop', mc_song: 'My song {n}', mc_saved: 'Saved to your concert!', mc_kick: 'Big drum', mc_snare: 'Snare', mc_hat: 'Cymbal', mc_staff: 'Your melody on the staff',
      mc_g_tap: 'Tap the glowing note.', mc_g_pick: 'Pick an instrument, then tap the coloured squares.', mc_g_listen: 'Listen to what you made.', mc_g_done: 'You played it! That was {title} by {who}.', mc_g_try: 'Almost! Find the glowing note.', mc_g_learn: 'Pick a tune to learn.', mc_g_doneFolk: 'You played it! That was {title}, {about}.', mc_g_make: 'Tap the coloured squares to make your own music. Tap the drums at the bottom too!', mc_g_band: 'The band plays along with you!', mc_g_surprise: 'Here is a tune to start. Change it any way you like!', mc_band: 'Band', mc_surprise: 'Surprise me', mc_clap: 'Clap', mc_shaker: 'Shaker', mc_by: '{who} · {year}', mc_del: 'Delete', mc_playS: 'Play' },
    he: { mc_title: 'יוצרים מוזיקה', mc_close: 'סגירה', mc_toBand: 'הלהקה שלי', mc_learn: 'לומדים מנגינה', mc_free: 'יוצרים לבד', mc_play: 'ניגון', mc_stop: 'עצירה', mc_clear: 'ניקוי', mc_save: 'שמירה לקונצרט שלי', mc_concert: 'הקונצרט שלי', mc_empty: 'עוד אין שירים. יוצרים אחד ושומרים!',
      mc_tempo: 'מהירות', mc_slow: 'לאט', mc_fastL: 'מהר', mc_sample: 'מוסיפים לופ', mc_s_rock: 'קצב רוק', mc_s_march: 'מארש', mc_s_clap: 'מחיאות כפיים', mc_s_bass: 'בס של צ׳לו', mc_drums: 'תופים', mc_melody: 'מנגינה', mc_harmony: 'הרמוניה', mc_bass: 'בס',
      mc_chord: 'אקורדים', mc_loop: 'חזרה', mc_song: 'השיר שלי {n}', mc_saved: 'נשמר בקונצרט שלכם!', mc_kick: 'תוף גדול', mc_snare: 'תוף סנר', mc_hat: 'מצלה', mc_staff: 'המנגינה שלכם על החמשה',
      mc_g_tap: 'לוחצים על התו שזוהר.', mc_g_pick: 'בוחרים כלי, ואז לוחצים על הריבועים הצבעוניים.', mc_g_listen: 'מקשיבים למה שיצרתם.', mc_g_done: 'ניגנתם את זה! זה היה „{title}” מאת {who}.', mc_g_try: 'כמעט! מחפשים את התו שזוהר.', mc_g_learn: 'בוחרים מנגינה ללמוד.', mc_g_doneFolk: 'ניגנתם את זה! זה היה „{title}”, {about}.', mc_g_make: 'לוחצים על הריבועים הצבעוניים ויוצרים מוזיקה משלכם. אפשר ללחוץ גם על התופים למטה!', mc_g_band: 'הלהקה מנגנת איתכם!', mc_g_surprise: 'הנה מנגינה להתחלה. משנים אותה איך שרוצים!', mc_band: 'להקה', mc_surprise: 'הפתעה', mc_clap: 'מחיאה', mc_shaker: 'שייקר', mc_by: '{who} · {year}', mc_del: 'מחיקה', mc_playS: 'ניגון' }
  });
  const lang = () => KQ.i18n.lang === 'he' ? 'he' : 'en';
  const BASE = { piano: 60, violin: 60, cello: 48, flute: 72, xylophone: 72, guitar: 48, trumpet: 60, harp: 60,
    organ: 60, harmonium: 60, 'guitar-electric': 48, 'bass-electric': 36, contrabass: 36, clarinet: 60, bassoon: 48, saxophone: 60, 'french-horn': 48, trombone: 48, tuba: 36, voice: 48, 'voice-f': 60 };
  /* ages 4–5 make real music too (Yoni 2026-10-03: 'too simplistic … something you can actually create'): a five-note (pentatonic) scale over two
     octaves, so any squares they tap sound good together, sixteen steps, a drum lane, a band that plays along and a surprise starter tune */
  const LEVEL = b => b <= 1 ? { rows: [0, 2, 4, 7, 9, 12, 14, 16], learnRows: [0, 2, 4, 5, 7, 9], steps: 16, insts: ['piano', 'xylophone', 'violin', 'cello', 'flute', 'guitar'], drums: true, tracks: 1, chords: false, staff: false, simple: true }
    : b <= 3 ? { rows: [0, 2, 4, 5, 7, 9, 11, 12], learnRows: [0, 2, 4, 5, 7, 9, 11, 12], steps: 16, insts: ['piano', 'violin', 'cello', 'xylophone', 'flute', 'guitar'], drums: true, tracks: 1, chords: false, staff: b >= 3 }
    : { rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], learnRows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], steps: 32, insts: ['piano', 'violin', 'cello', 'flute', 'xylophone', 'guitar', 'trumpet', 'harp', 'organ', 'harmonium', 'guitar-electric', 'bass-electric', 'contrabass', 'clarinet', 'bassoon', 'saxophone', 'french-horn', 'trombone', 'tuba', 'voice-f', 'voice'], drums: true, tracks: 3, chords: true, staff: true };
  const DRUM_ROWS = ['hat', 'snare', 'kick'];
  const SAMPLES = {
    rock: s => ({ kick: [0, 8].concat(s > 16 ? [16, 24] : []), snare: [4, 12].concat(s > 16 ? [20, 28] : []), hat: Array.from({ length: s / 2 }, (_, k) => k * 2) }),
    march: s => ({ kick: Array.from({ length: s / 4 }, (_, k) => k * 4), snare: Array.from({ length: s / 4 }, (_, k) => k * 4 + 2), hat: [] }),
    clap: s => ({ kick: [0].concat(s > 8 ? [8] : []), snare: [], hat: [], clap: Array.from({ length: s / 4 }, (_, k) => k * 4 + 2) })
  };
  const store = () => { const st = KQ.state(); st.music = st.music || {}; const pid = (KQ.profiles.active() || {}).id || 'guest'; return (st.music[pid] = st.music[pid] || { songs: [] }); };

  let S = null, root = null, timer = null;
  function open(band) {
    close(); M.ac(); const L = LEVEL(band || 1);
    S = { band: band || 1, L, rows: L.rows, inst: L.insts[0], bpm: L.simple ? 108 : 100, loop: !!L.simple, chord: false, band2: !!L.simple, mode: 'free', tune: null, li: 0, wrong: 0,
      tracks: [{ id: 'melody', inst: L.insts[0], cells: new Set() }], cur: 0, drums: { kick: new Set(), snare: new Set(), hat: new Set(), clap: new Set() } };
    if (L.tracks > 1) S.tracks.push({ id: 'harmony', inst: 'violin', cells: new Set() }, { id: 'bass', inst: 'cello', cells: new Set() });
    L.insts.forEach(i => M.load(i));
    root = el('div', 'mc'); root.setAttribute('role', 'dialog'); document.body.appendChild(root); document.body.classList.add('mc-open');
    draw();
    guide(t(L.simple ? 'mc_g_make' : 'mc_g_pick'));
  }
  function close() { stopPlay(); if (root) root.remove(); root = null; document.body.classList.remove('mc-open'); }
  const track = () => S.tracks[S.cur];
  const midiOf = (tr, r) => BASE[tr.inst] + S.rows[r];

  /* the tunes this level can learn: their notes must all sit on this grid's rows (after moving them by whole octaves) */
  function learnable() {
    return M.TUNES.filter(tu => tu.band <= Math.max(1, Math.min(4, S.band))).map(tu => {
      const notes = tu.ev.map(e => e.m);
      const rowsOf = sh => notes.map(m => S.rows.indexOf(m + sh - BASE[S.inst]));
      for (const sh of [0, 12, -12, 24, -24, 36, -36]) { const r = rowsOf(sh); if (r.every(x => x >= 0)) return { tu, rows: r }; }
      return null;
    }).filter(Boolean);
  }

  function guide(text) { const g = root && root.querySelector('.mc-guide'); if (!g) return; g.querySelector('span').textContent = text; g.hidden = false; if (S.band <= 2 && KQ.store && KQ.store.settings && KQ.store.settings.voice) KQ.speak(text); }

  function draw() {
    if (!root) return; root.replaceChildren(); const L = S.L;
    /* header */
    const hd = el('div', 'mc-head'); hd.appendChild(el('h2', null, t('mc_title')));
    const tabs = el('div', 'mc-modes'); for (const m of ['learn', 'free']) { const b = el('button', 'mc-mode' + (S.mode === m ? ' on' : ''), t(m === 'learn' ? 'mc_learn' : 'mc_free')); b.type = 'button'; b.onclick = () => { stopPlay(); S.mode = m; S.tune = null; S.li = 0; S.rows = m === 'learn' ? S.L.learnRows : S.L.rows; draw(); if (m === 'learn') guide(t('mc_g_learn')); else guide(t(S.L.simple ? 'mc_g_make' : 'mc_g_pick')); }; tabs.appendChild(b); }
    /* the way to My band in the Instrument Hall (Yoni 2026-10-10: 'how do i get to my band?') */
    if (window.KQHall) { const mb = el('button', 'mc-mode mc-band', t('mc_toBand')); mb.type = 'button'; mb.onclick = () => { const band = S.band; close(); KQHall.open(band); KQHall.song(); }; tabs.appendChild(mb); }
    hd.appendChild(tabs);
    const x = el('button', 'mc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', t('mc_close')); x.onclick = close; hd.appendChild(x); root.appendChild(hd);
    /* guidance line (with the speaker for the youngest) */
    const g = el('div', 'mc-guide'); g.appendChild(el('span')); if (S.band <= 2) { const sp = el('button', 'mc-say'); sp.type = 'button'; sp.setAttribute('aria-label', 'speak'); sp.appendChild(KQ.icon ? (KQ.icon('🔊') || el('span', null, '♪')) : el('span', null, '♪')); sp.onclick = () => KQ.speak(g.querySelector('span').textContent, null, { force: true }); g.appendChild(sp); } g.hidden = true; root.appendChild(g);
    /* instruments */
    const ins = el('div', 'mc-insts'); L.insts.forEach(i => { const b = el('button', 'mc-inst' + (track().inst === i ? ' on' : '')); b.type = 'button'; b.appendChild(M.art(i)); b.appendChild(el('span', null, t('i_' + i))); b.onclick = () => { track().inst = i; S.inst = i; M.load(i); M.play(i, BASE[i] + 7, { dur: 0.6 }); if (S.mode === 'learn' && S.tune) { const keep = S.tune.tu; S.tune = learnable().find(o => o.tu === keep) || null; } draw(); }; ins.appendChild(b); }); root.appendChild(ins);
    if (S.mode === 'learn' && !S.tune) { drawTunePicker(); return; }
    /* tracks (ages 10+) */
    if (L.tracks > 1 && S.mode === 'free') { const tb = el('div', 'mc-tracks'); S.tracks.forEach((tr, k) => { const b = el('button', 'mc-track' + (k === S.cur ? ' on' : '')); b.type = 'button'; b.appendChild(M.art(tr.inst)); b.appendChild(el('span', null, t('mc_' + tr.id))); b.onclick = () => { S.cur = k; S.inst = tr.inst; draw(); }; tb.appendChild(b); }); root.appendChild(tb); }
    /* the grid */
    const wrap = el('div', 'mc-gridwrap'); const cols = S.mode === 'learn' ? S.tune.rows.length : L.steps;
    const grid = el('div', 'mc-grid'); grid.style.gridTemplateColumns = `var(--mc-lab) repeat(${cols}, var(--mc-cell))`;
    for (let r = L.rows.length - 1; r >= 0; r--) {
      const m = BASE[track().inst] + L.rows[r], pc = ((m % 12) + 12) % 12, sharp = M.LETTERS[pc].length > 1;
      const lab = el('div', 'mc-lab' + (sharp ? ' sharp' : ''), S.band >= 4 ? M.name(m, lang(), 'letter') + ' ' + M.name(m, lang()) : M.name(m, lang())); lab.style.color = M.HUE[pc]; lab.onclick = () => M.play(track().inst, m, { dur: 0.5 }); grid.appendChild(lab);
      for (let c = 0; c < cols; c++) {
        const b = el('button', 'mc-cell' + (c % 4 === 0 ? ' bar' : '') + (sharp ? ' sharp' : '')); b.type = 'button'; b.dataset.r = r; b.dataset.c = c; b.style.setProperty('--hue', M.HUE[pc]);
        if (S.mode === 'learn') { if (c < S.li && S.tune.rows[c] === r) b.classList.add('on'); if (c === S.li && S.tune.rows[c] === r) b.classList.add('glow'); }
        else for (const tr of S.tracks) if (tr.cells.has(r + ',' + c)) b.classList.add(tr === track() ? 'on' : 'ghost');
        b.onclick = () => tap(r, c, b); grid.appendChild(b);
      }
    }
    if (L.drums && S.mode === 'free') (L.simple ? ['hat', 'clap', 'kick'] : DRUM_ROWS.concat(S.drums.clap.size ? ['clap'] : [])).forEach(kind => {
      grid.appendChild(el('div', 'mc-lab drum', t(kind === 'clap' ? 'mc_clap' : L.simple && kind === 'hat' ? 'mc_shaker' : 'mc_' + kind)));
      for (let c = 0; c < cols; c++) { const b = el('button', 'mc-cell drum' + (c % 4 === 0 ? ' bar' : '') + (S.drums[kind].has(c) ? ' on' : '')); b.type = 'button'; b.dataset.c = c; b.onclick = () => { if (S.drums[kind].has(c)) S.drums[kind].delete(c); else { S.drums[kind].add(c); M.drum(kind); } b.classList.toggle('on'); }; grid.appendChild(b); }
    });
    wrap.appendChild(grid); root.appendChild(wrap);
    if (S.mode === 'learn') { const T = M.tuneText(S.tune.tu, lang()); const p = el('div', 'mc-piece'); p.appendChild(el('b', null, T.title)); p.appendChild(el('span', null, t('mc_by', { who: T.who, year: T.year }))); root.insertBefore(p, wrap); }
    /* the staff (ages 8+) */
    if (L.staff) { const notes = S.mode === 'learn' ? S.tune.tu.ev.slice(0, S.li).map(e => ({ m: BASE[track().inst] + S.rows[S.tune.rows[S.tune.tu.ev.indexOf(e)]], d: e.d })) : melodyNotes(); if (notes.length) { const sb = el('div', 'mc-staff'); sb.appendChild(el('small', null, t('mc_staff'))); sb.appendChild(M.staff(notes.slice(0, 16).map(n => ({ m: Math.max(57, Math.min(86, n.m < 57 ? n.m + 12 : n.m > 86 ? n.m - 12 : n.m)), d: [4, 2, 1, 0.5, 1.5, 3].includes(n.d) ? n.d : 1, color: M.HUE[((n.m % 12) + 12) % 12] })))); root.appendChild(sb); } }
    /* controls */
    const ctl = el('div', 'mc-ctl');
    const play = el('button', 'btn gold mc-play', t(timer ? 'mc_stop' : 'mc_play')); play.type = 'button'; play.onclick = () => timer ? stopPlay() : startPlay(); ctl.appendChild(play);
    if (S.mode === 'free') {
      const clr = el('button', 'btn ghost', t('mc_clear')); clr.type = 'button'; clr.onclick = () => { stopPlay(); S.tracks.forEach(tr => tr.cells.clear()); for (const k in S.drums) S.drums[k].clear(); draw(); }; ctl.appendChild(clr);
      /* the band that plays along (a cello bass line and a soft beat) and a surprise tune to start from */
      { const bb = el('button', 'btn ghost mc-big' + (S.band2 ? ' on' : '')); bb.type = 'button'; bb.appendChild(KQ.icon('🥁') || el('span')); bb.appendChild(el('span', null, t('mc_band'))); bb.onclick = () => { S.band2 = !S.band2; bb.classList.toggle('on', S.band2); if (S.band2) guide(t('mc_g_band')); if (timer) { stopPlay(); startPlay(); } }; ctl.appendChild(bb);
        const sp = el('button', 'btn ghost mc-big'); sp.type = 'button'; sp.appendChild(KQ.icon('🎁') || el('span')); sp.appendChild(el('span', null, t('mc_surprise'))); sp.onclick = surprise; ctl.appendChild(sp); }
      if (L.simple) { for (const [k, ic, bpm] of [['mc_slow', '🐢', 84], ['mc_fastL', '🐰', 132]]) { const b = el('button', 'btn ghost mc-big' + (S.bpm === bpm ? ' on' : '')); b.type = 'button'; b.appendChild(KQ.icon(ic) || el('span')); b.appendChild(el('span', null, t(k))); b.onclick = () => { S.bpm = S.bpm === bpm ? 108 : bpm; if (timer) { stopPlay(); startPlay(); } draw(); }; ctl.appendChild(b); } }
      if (S.band >= 2) { const tp = el('label', 'mc-tempo'); tp.appendChild(el('span', null, t('mc_tempo'))); const r = document.createElement('input'); r.type = 'range'; r.min = 60; r.max = 160; r.step = 4; r.value = S.bpm; r.oninput = () => { S.bpm = +r.value; if (timer) { stopPlay(); startPlay(); } }; tp.appendChild(r); ctl.appendChild(tp);
        const sm = el('select', 'mc-sample'); sm.appendChild(new Option(t('mc_sample'), '')); for (const k of ['rock', 'march', 'clap', 'bass']) sm.appendChild(new Option(t('mc_s_' + k), k)); sm.onchange = () => { addSample(sm.value); }; ctl.appendChild(sm); }
      if (L.chords) { const cb = el('button', 'btn ghost' + (S.chord ? ' on' : ''), t('mc_chord')); cb.type = 'button'; cb.onclick = () => { S.chord = !S.chord; cb.classList.toggle('on', S.chord); }; ctl.appendChild(cb);
        const lp = el('button', 'btn ghost' + (S.loop ? ' on' : ''), t('mc_loop')); lp.type = 'button'; lp.onclick = () => { S.loop = !S.loop; lp.classList.toggle('on', S.loop); }; ctl.appendChild(lp); }
      const sv = el('button', 'btn gold', t('mc_save')); sv.type = 'button'; sv.onclick = save; ctl.appendChild(sv);
    }
    root.appendChild(ctl);
    if (S.mode === 'free') drawConcert();
    const gl = root.querySelector('.mc-guide'); if (S.mode === 'learn' && S.li < S.tune.rows.length) { gl.querySelector('span').textContent = t('mc_g_tap'); gl.hidden = false; } else if (S.mode === 'free') { gl.querySelector('span').textContent = t('mc_g_pick'); gl.hidden = false; }
    const glow = root.querySelector('.mc-cell.glow'); if (glow) glow.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function drawTunePicker() {
    const box = el('div', 'mc-tunes'); learnable().forEach(o => { const T = M.tuneText(o.tu, lang()); const b = el('button', 'mc-tune'); b.type = 'button'; b.appendChild(el('b', null, T.title)); b.appendChild(el('span', null, t('mc_by', { who: T.who, year: T.year }))); b.onclick = () => { S.tune = o; S.li = 0; draw(); guide(t('mc_g_tap')); }; box.appendChild(b); }); root.appendChild(box);
  }
  function melodyNotes() { const tr = S.tracks[0], out = []; for (let c = 0; c < S.L.steps; c++) { const rs = [...tr.cells].map(k => k.split(',').map(Number)).filter(([, cc]) => cc === c).map(([r]) => r); if (rs.length) out.push({ m: BASE[tr.inst] + S.rows[Math.max(...rs)], d: 1 }); } return out; }

  function tap(r, c, b) {
    const tr = track(), m = midiOf(tr, r);
    if (S.mode === 'learn') {
      const want = S.tune.rows[S.li]; if (c !== S.li) return;
      if (r === want) { const e = S.tune.tu.ev[S.li]; M.play(tr.inst, m, { dur: Math.min(1.2, e.d * 0.6) }); S.li++; if (S.li >= S.tune.rows.length) { draw(); finishTune(); } else draw(); }
      else { M.play(tr.inst, m, { dur: 0.3, vel: 0.5 }); b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 400); S.wrong++; guide(t('mc_g_try')); }
      return;
    }
    const k = r + ',' + c; const on = !tr.cells.has(k);
    const keys = S.chord ? [r, r + (S.rows.length > 8 ? 4 : 2), r + (S.rows.length > 8 ? 7 : 4)].filter(x => x < S.rows.length) : [r];
    keys.forEach(rr => { const kk = rr + ',' + c; if (on) tr.cells.add(kk); else tr.cells.delete(kk); });
    if (on) keys.forEach(rr => M.play(tr.inst, midiOf(tr, rr), { dur: 0.5 }));
    draw();
  }
  function finishTune() {
    const T = M.tuneText(S.tune.tu, lang()), tr = track(), rows = S.tune.rows;
    const ev = S.tune.tu.ev.map((e, i) => ({ m: midiOf(tr, rows[i]), b: e.b, d: e.d, inst: tr.inst }));
    play2(ev, S.tune.tu.bpm);
    const msg = /Traditional|שיר עם/.test(T.who) ? t('mc_g_doneFolk', { title: T.title, about: T.about }) : t('mc_g_done', { title: T.title, who: T.who });
    guide(msg);
  }
  function play2(ev, bpm) { stopPlay(); const s = M.seq(ev, { bpm, onNote: i => mark(i), onEnd: () => { timer = null; const p = root && root.querySelector('.mc-play'); if (p) p.textContent = t('mc_play'); clearMarks(); } }); timer = s; const p = root && root.querySelector('.mc-play'); if (p) p.textContent = t('mc_stop'); }
  function mark(col) { if (!root) return; clearMarks(); root.querySelectorAll(`.mc-cell[data-c="${col}"]`).forEach(x => x.classList.add('now')); }
  function clearMarks() { if (root) root.querySelectorAll('.mc-cell.now').forEach(x => x.classList.remove('now')); }
  function startPlay() {
    if (S.mode === 'learn') { const tr = track(); return play2(S.tune.tu.ev.slice(0, Math.max(1, S.li)).map((e, i) => ({ m: midiOf(tr, S.tune.rows[i]), b: e.b, d: e.d, inst: tr.inst })), S.tune.tu.bpm); }
    const ev = [], st = 0.5;   /* one column = an eighth note at the chosen speed */
    for (const tr of S.tracks) for (const k of tr.cells) { const [r, c] = k.split(',').map(Number); ev.push({ m: midiOf(tr, r), b: c * st, d: st * (tr.id === 'bass' ? 3.6 : 1.6), inst: tr.inst }); }
    for (const kind in S.drums) for (const c of S.drums[kind]) ev.push({ kind, b: c * st, d: st });
    if (S.band2) ev.push(...bandPart(S.L.steps, st));
    stopPlay(); const spb = 60 / S.bpm; const s = M.seq(ev, { bpm: S.bpm }); let c = 0;
    const tick = setInterval(() => { mark(c); c++; if (c >= S.L.steps) { if (S.loop) { c = 0; M.seq(ev, { bpm: S.bpm }); } else { clearInterval(tick); timer = null; clearMarks(); const p = root && root.querySelector('.mc-play'); if (p) p.textContent = t('mc_play'); } } }, st * spb * 1000);
    timer = { stop() { clearInterval(tick); s.stop(); } }; const p = root.querySelector('.mc-play'); if (p) p.textContent = t('mc_stop');
    if (!ev.length) guide(t('mc_g_pick')); else if (S.band <= 2) guide(t('mc_g_listen'));
  }
  /* the band: cello roots C – A – D – G under every bar, kick and clap, a shaker on the off-beats (soft, so the child's tune stays on top) */
  function bandPart(steps, st) { const ev = [], roots = [36, 33, 38, 31]; for (let c = 0; c < steps; c += 4) { const r = roots[(c / 4) % 4]; ev.push({ m: r + 12, b: c * st, d: st * 3.6, inst: 'cello', vel: 0.55 }); ev.push({ kind: (c / 4) % 2 ? 'clap' : 'kick', b: c * st, d: st, vel: 0.5 }); ev.push({ kind: 'hat', b: (c + 2) * st, d: st, vel: 0.35 }); } return ev; }
  /* a surprise tune to start from: a gentle walk over the scale, with a few rests, and a simple beat */
  function surprise() { stopPlay(); const tr = S.tracks[0]; tr.cells.clear(); for (const k in S.drums) S.drums[k].clear(); let r = Math.floor(S.rows.length / 2);
    for (let c = 0; c < S.L.steps; c++) { if (c % 4 === 3 && Math.random() < 0.5) continue; r = Math.max(0, Math.min(S.rows.length - 1, r + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)])); if (c === S.L.steps - 1 || c === 0) r = S.rows.indexOf(0) >= 0 ? (c ? S.rows.indexOf(12) >= 0 ? S.rows.indexOf(12) : 0 : 0) : r; tr.cells.add(r + ',' + c); }
    for (let c = 0; c < S.L.steps; c += 8) { S.drums.kick.add(c); (S.L.simple ? S.drums.clap : S.drums.snare).add(c + 4); }
    draw(); startPlay(); guide(t('mc_g_surprise')); }
  function stopPlay() { if (timer) { try { timer.stop(); } catch (e) {} } timer = null; M.stop(); clearMarks(); const p = root && root.querySelector('.mc-play'); if (p) p.textContent = t('mc_play'); }
  function addSample(k) {
    if (!k) return; const s = S.L.steps;
    if (k === 'bass') { let tr = S.tracks.find(x => x.id === 'bass'); if (!tr) { tr = { id: 'bass', inst: 'cello', cells: new Set() }; S.tracks.push(tr); }
      const roots = [0, 7, 9, 5]; const per = s / 4; roots.forEach((deg, i) => { const r = S.rows.indexOf(deg); if (r >= 0) tr.cells.add(r + ',' + i * per); }); M.load('cello'); }
    else { const p = SAMPLES[k](s); for (const kind in p) p[kind].forEach(c => S.drums[kind].add(c)); }
    draw();
  }
  function save() {
    const has = S.tracks.some(tr => tr.cells.size) || Object.values(S.drums).some(x => x.size); if (!has) { guide(t('mc_g_pick')); return; }
    const st = store();
    st.songs.unshift({ n: (st.songs.reduce((a, x) => Math.max(a, x.n || 0), 0) || 0) + 1, at: Date.now(), band: S.band, bpm: S.bpm, steps: S.L.steps, rows: S.rows, tracks: S.tracks.map(tr => ({ id: tr.id, inst: tr.inst, cells: [...tr.cells] })), drums: Object.fromEntries(Object.entries(S.drums).map(([k, v]) => [k, [...v]])) });
    st.songs = st.songs.slice(0, 12); try { KQ.save(); } catch (e) {}
    KQ.ui.toast(t('mc_saved')); drawConcert();
  }
  function drawConcert() {
    let box = root.querySelector('.mc-concert'); if (box) box.remove(); box = el('div', 'mc-concert'); box.appendChild(el('h3', null, t('mc_concert')));
    const songs = store().songs; if (!songs.length) box.appendChild(el('p', null, t('mc_empty')));
    songs.forEach((sg, i) => { const row = el('div', 'mc-songrow'); const ic = el('div', 'mc-songart'); ic.appendChild(M.art(sg.type === 'arr' ? ((Object.values(sg.smp || {})[0] || {}).inst || 'piano') : sg.tracks[0].inst)); row.appendChild(ic); row.appendChild(el('b', null, t('mc_song', { n: sg.n || i + 1 })));
      const p = el('button', 'btn sm gold', t('mc_playS')); p.type = 'button'; p.onclick = () => playSong(sg); row.appendChild(p);
      const d = el('button', 'btn sm ghost', t('mc_del')); d.type = 'button'; d.onclick = () => { store().songs.splice(i, 1); try { KQ.save(); } catch (e) {} drawConcert(); }; row.appendChild(d); box.appendChild(row); });
    root.appendChild(box);
  }
  function playSong(sg) {
    /* a song built in the Instrument Hall: lanes of two-bar samples */
    if (sg.type === 'arr') { stopPlay(); if (!window.KQHall) return; const ev = KQHall.events(sg); Promise.all([...new Set(ev.map(e => e.inst))].map(i => M.load(i))).then(() => { timer = M.seq(ev, { bpm: sg.bpm, onEnd: () => { timer = null; } }); }); return; }
    const ev = [], st = 0.5; for (const tr of sg.tracks) { M.load(tr.inst); for (const k of tr.cells) { const [r, c] = k.split(',').map(Number); ev.push({ m: BASE[tr.inst] + sg.rows[r], b: c * st, d: st * (tr.id === 'bass' ? 3.6 : 1.6), inst: tr.inst }); } } for (const kind in sg.drums) for (const c of sg.drums[kind]) ev.push({ kind, b: c * st, d: st }); stopPlay(); timer = M.seq(ev, { bpm: sg.bpm, onEnd: () => { timer = null; } }); }
  document.addEventListener('keydown', e => { if (root && e.key === 'Escape') close(); });
  window.KQCreator = { open, close, get state() { return S; } };
})();
