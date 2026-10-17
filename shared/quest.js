/* Kingdom Quest — the round engine every drill-style world shares (Memory Cave, Clock Tower, Coin Market, Spelling Bee,
   Logic Gate, Story Forge). It owns the age bands, the skill tiles with mastery bars, the question loop, scoring through
   KQ.score, streaks, potions, the "teach it, then ask one like it" step after a miss, the mistake journal and the report
   card. A world only supplies its questions (gen), its worked explanations (explain) and, when a question is interactive,
   a renderer that calls api.submit(). Math Tower and Word Garden predate this file and keep their own loops. */
(function () {
  'use strict';
  const { t, store, sfx, ui } = KQ; const { el } = ui;
  const $ = s => document.querySelector(s);
  const NB = ' ';
  function quest(cfg) {
    const profile = KQ.requireProfile(cfg.homeHref || '../index.html'); if (!profile) return null;
    const W = cfg.world, BANDS = cfg.bands, ICONS = cfg.icons || {}, GEN = cfg.gen, EXPLAIN = cfg.explain || {};
    const bandIds = Object.keys(BANDS).map(Number);
    const EGG = new URLSearchParams(location.search).get('egg'); const eggId = EGG && KQ.eggs.world['egg:' + EGG] === W ? 'egg:' + EGG : null;   // ?egg=n → the secret challenge for this world
    const R = { band: KQ.ladder.band(profile.id, W, bandIds) || cfg.defaultBand || bandIds[0], level: 1, fastMul: 1, skill: null, tier: 0, i: 0, n: 10, correct: 0, streak: 0, best: 0, points: 0, times: [], t0: 0, q: null, typed: '', locked: false, results: [], seen: new Set(), retryTags: null, hint: false, howtos: 0, potion: null, shield: false };
    const tagName = k => KQ.tagLabel(W, k);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    function mastery(skill) { const st = KQ.skills.stats(profile.id, W)[skill]; return st && st.recent >= 3 ? st : null; }
    function renderPick() {
      KQ.ui.potionBar($('#potions'));
      const bb = $('#bands'); bb.replaceChildren();
      R.band = KQ.ladder.band(profile.id, W, bandIds) || R.band;   /* Yoni 2026-10-17: no age picker — the ladder places the child and moves them both ways */
      bb.appendChild(el('div', 'bandnow', t(cfg.bandKey ? cfg.bandKey + R.band : 'band' + R.band)));
      const lad = KQ.ladder.get(profile.id, W, R.band), nb = bandIds[bandIds.indexOf(R.band) + 1]; ui.ladder(bb, Object.assign({ steps: KQ.ladder.steps, nextName: nb ? t(cfg.bandKey ? cfg.bandKey + nb : 'band' + nb) : '' }, lad));
      const sk = $('#skills'); sk.replaceChildren();
      const weak = KQ.skills.weak(profile.id, W, 4).map(w => w.key);
      const f = el('div', 'tile focus'); f.appendChild(el('div', 'e', '🎯')); f.appendChild(el('div', 'n', t('focus'))); f.appendChild(el('div', 'd', weak.length ? weak.map(tagName).join(' · ') : t('focusEmpty'))); if (weak.length) f.onclick = () => startRound('focus'); else f.classList.add('locked'); sk.appendChild(f);
      for (const s of BANDS[R.band]) { const d = el('div', 'tile'); d.appendChild(el('div', 'e', ICONS[s] || '⭐')); d.appendChild(el('div', 'n', t('s_' + s))); { const gs = KQ.growth.stats(profile.id, W, R.band, s); if (gs.n) d.appendChild(el('span', 'gchip g-' + gs.status, t('g_status_' + gs.status))); } const m = mastery(s); if (m) { const box = el('div', 'm'); const bar = el('div', 'mastery'); const fill = el('i', m.rate >= 0.8 ? '' : m.rate >= 0.5 ? 'mid' : 'low'); fill.style.width = Math.round(m.rate * 100) + '%'; bar.appendChild(fill); box.appendChild(bar); box.appendChild(el('small', null, Math.round(m.rate * 100) + '% · ' + t('q_answered', { n: m.n }))); d.appendChild(box); } d.onclick = () => startRound(s); sk.appendChild(d); }
    }
    function startRound(skill, o) {
      /* Yoni 2026-10-03: the Heart Garden is a must at every level passed — its scene comes first (shared/heart.js) */
      if (!(o && o.egg) && window.KQHeart && KQHeart.gate(W, () => { renderPick(); startRound(skill, o); })) return;
      /* Yoni 2026-10-03: the second-language lesson after a level is mandatory — while it waits, every new round in this world opens it first */
      if (!(o && o.egg) && KQ.tickets.waiting(profile.id, W) && KQ.bridge.available(profile.id)) { KQ.bridge.open(W, () => { renderPick(); startRound(skill, o); }); return; }
      const egg = !!(o && o.egg); if (egg) R.band = bandIds[bandIds.length - 1];
      const lad = KQ.ladder.get(profile.id, W, R.band), tune = KQ.ladder.tune(egg ? KQ.ladder.steps : lad.level);
      const n = egg ? 12 : typeof cfg.n === 'function' ? cfg.n(skill, R.band) : (cfg.n || tune.n);
      Object.assign(R, { skill, egg: egg ? eggId : null, level: egg ? KQ.ladder.steps : lad.level, fastMul: tune.fastMul, tier: tune.tierStart, i: 0, n, correct: 0, streak: 0, best: 0, points: 0, times: [], typed: '', locked: false, results: [], seen: new Set(), retryTags: null, hint: false, howtos: 0, shield: false });
      R.potion = store.activePotion(profile.id); R.plan = KQ.skills.plan(profile.id, W); R.weak = R.plan.focus; R.helped = false; R.freeHint = false;
      R.G = KQ.growth.round(profile.id, W, R.band, skill === 'focus' ? null : skill, BANDS[R.band]);   /* the growth detector watches this round */
      if (!egg && skill !== 'focus') { const gp = R.G.plan(skill); R.tier = Math.max(R.tier, gp.tier); if (typeof cfg.n !== 'function' && !cfg.n) R.n = Math.max(5, R.n + gp.dn); }
      if (R.egg) { R.plan = { focus: [], easy: {}, boost: 0 }; R.weak = []; }   // the challenge gives no free help
      $('#pick').hidden = true; $('#round').hidden = false; document.body.classList.add('focus');
      $('#skillName').textContent = R.egg ? '🥚 ' + t('eggChallenge') + ' · ' + t('s_' + skill) : (skill === 'focus' ? t('focus') : t('s_' + skill) + ' · ' + t(cfg.bandKey ? cfg.bandKey + R.band : 'band' + R.band)) + ' · ' + t('ladderLevel', { l: R.level, n: KQ.ladder.steps });
      sfx.play('tap'); nextQ();
    }
    function renderDots() { KQ.ui.progress(R.i, R.n); const d = $('#dots'); d.replaceChildren(); for (let i = 0; i < R.n; i++) d.appendChild(el('i', i < R.i ? (R.results[i] ? 'ok' : 'bad') : i === R.i ? 'cur' : '')); $('#streak').textContent = (R.streak >= 2 ? `🔥 ${R.streak}` : '') + (R.potion ? ' ' + KQ.POTIONS.find(p => p.id === R.potion).e : ''); }
    function pickQuestion() {
      const want = R.retryTags || (R.weak.length && Math.random() < R.plan.boost ? [pick(R.weak)] : null);
      const tier = want && want.some(x => R.plan.easy[x]) ? 0 : R.tier;
      let skill = R.skill;
      if (skill === 'focus') skill = R.G ? R.G.pickSkill(BANDS[R.band]) : pick(BANDS[R.band]);
      // rotation: never repeat within the round, and prefer questions this player has not met in earlier rounds of this skill
      const keyOf = c => c.key || (c.prompt + '|' + (c.visual || '')), gb = R.G && !R.egg ? R.G.genBand(skill, BANDS) : R.band, ft = R.skill === 'focus' && R.G ? Math.max(tier, R.G.plan(skill).tier) : tier, gen = () => GEN[skill](ft, gb, R.level), fresh = c => !R.seen.has(keyOf(c));
      let q = want ? KQ.rotate.pick(profile.id, W, R.band, skill, gen, keyOf, c => fresh(c) && c.tags && c.tags.some(x => want.includes(x)), 12) : null;
      q = q || KQ.rotate.pick(profile.id, W, R.band, skill, gen, keyOf, fresh, 24) || gen();
      q.skill = skill; q.tags = q.tags || [skill]; R.seen.add(keyOf(q)); if (KQ.ui.peek) KQ.ui.peek({ repeat: KQ.rotate.seen(profile.id, W, R.band, skill, keyOf(q)), band: R.band, level: R.level, rate: (KQ.skills.stats(profile.id, W)[skill] || {}).rate });   /* the parents' corner code */ return q;
    }
    const api = {
      el, t, sfx, ui, profile, R, cfg, GEN, EXPLAIN, BANDS,
      lock() { R.locked = true; }, locked: () => R.locked,
      submit(ok, given) { settle(!!ok, given == null ? '' : given, null); },
      toast: ui.toast
    };
    function nextQ() { if (R.i >= R.n) return renderQ(); const qc = document.querySelector('.qcard'); if (!qc || qc.classList.contains('swap')) return renderQ(); qc.classList.add('swap'); setTimeout(() => { renderQ(); setTimeout(() => qc.classList.remove('swap'), 30); }, 190); }   // the card fades out, changes, fades back: no jump
    function renderQ() {
      if (R.i >= R.n) return finish();
      const q = pickQuestion(); R.q = q; R.typed = ''; R.locked = false; R.hint = false; R.t0 = performance.now(); R.retryTags = null; if (R.G) R.G.begin();
      renderDots(); $('#howto').replaceChildren(); $('#btnHow').hidden = !EXPLAIN[q.skill] || !!q.render; $('#btnHow').disabled = false;
      const p = $('#prompt'); p.textContent = q.prompt || ''; p.hidden = !q.prompt; p.style.direction = /[֐-׿]/.test(q.prompt || '') ? 'rtl' : 'ltr'; p.style.fontSize = q.wordy ? 'clamp(20px,4.5vw,30px)' : '';
      const v = $('#visual'); v.replaceChildren(); if (q.visualEl) { v.appendChild(q.visualEl); v.hidden = false; v.style.letterSpacing = '0'; } else if (q.visual) { v.textContent = q.visual; v.hidden = false; v.style.letterSpacing = ''; } else v.hidden = true;
      const st = $('#stage'); st.replaceChildren(); st.hidden = !q.render;
      $('#feedback').textContent = ''; $('#feedback').className = 'feedback';
      const ch = $('#choices'), np = $('#numpad'), ab = $('#answerBox');
      ch.hidden = true; np.hidden = true; ab.hidden = true;
      if (q.render) q.render(st, api);
      else if (q.choices) { ch.hidden = false; ch.replaceChildren(); for (const c of q.choices) { const b = el('button', 'choice' + (q.picChoices ? ' pic' : '')); if (c && c.el) b.appendChild(c.el); else b.textContent = String(c != null && c.label != null ? c.label : c); if (q.bigChoices) b.style.fontSize = 'clamp(22px,4.5vw,34px)'; b.style.direction = /[֐-׿]/.test(String(c)) ? 'rtl' : 'ltr'; const cv = c != null && c.value != null ? c.value : c; b.dataset.value = String(cv); b.onclick = () => answer(cv, b); ch.appendChild(b); }
        /* an answer that would need a second line in its tile (story titles…) gets a row of its own and shrinks to one line: never a word per line, never a split word (Yoni 2026-09-26) */
        ch.classList.remove('long'); if (q.choices.some(c => !(c && c.el))) requestAnimationFrame(() => { if (R.q === q && wraps(ch)) { ch.classList.add('long'); fitLong(ch); } }); }
      else { np.hidden = false; ab.hidden = false; $('#answer').textContent = NB; $('#answer').className = 'answer'; ensurePad(); }
      $('#btnSpeak').hidden = !q.speak;
      if (q.speak && store.settings.voice && (cfg.speakBands || [1]).includes(R.band)) KQ.speak(q.speak);
      R.freeHint = false; const struggling = (q.tags || []).filter(x => R.plan.easy[x]);
      if (struggling.length && EXPLAIN[q.skill] && !q.render && !R.retryTags) { R.hint = true; R.freeHint = true; R.howtos++; $('#btnHow').disabled = true; ui.howto($('#howto'), EXPLAIN[q.skill](q), { hideLast: true, doneLabel: t('gotIt'), speak: false }); if (!R.helped) { R.helped = true; ui.toast('🧙 ' + t('j_help', { tags: struggling.map(tagName).join(', ') })); } }
    }
    function tooWide(b) { const cs = getComputedStyle(b), r = document.createRange(); r.selectNodeContents(b); const k = b.getBoundingClientRect().width / (b.offsetWidth || 1) || 1; return r.getBoundingClientRect().width / k > b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 0.5; }   /* the text's one-line width against the tile's inner width (padding kept clear) */
    function wraps(ch) { return [...ch.children].some(b => { if (b.firstElementChild) return false; const w = b.style.whiteSpace; b.style.whiteSpace = 'nowrap'; const o = tooWide(b); b.style.whiteSpace = w; return o; }); }   /* measured, not guessed: short Hebrew titles wrapped too */
    function fitLong(ch) { const bs = [...ch.children]; let fs = bs.length ? parseFloat(getComputedStyle(bs[0]).fontSize) : 0; bs.forEach(b => { b.style.whiteSpace = 'nowrap'; }); while (fs > 15 && bs.some(tooWide)) { fs -= 1; bs.forEach(b => { b.style.fontSize = fs + 'px'; }); } bs.forEach(b => { if (tooWide(b)) b.style.whiteSpace = 'normal'; }); }   /* one shared size, shrunk until every answer fits its row; at the floor, wrap at spaces */
    function ensurePad() { const np = $('#numpad'); if (np.children.length) return; for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', ':', '0', '.', '⌫', '✓']) { const b = el('button', k === '✓' ? 'go' : /[⌫:.]/.test(k) ? 'act' : '', k); if (k === '✓') b.style.gridColumn = 'span 2'; b.onclick = () => key(k); np.appendChild(b); } }
    function key(k) {
      if (R.locked || !R.q || R.q.choices || R.q.render) return; sfx.play('tap');
      if (k === '⌫') R.typed = R.typed.slice(0, -1);
      else if (k === '✓') { if (R.typed !== '' && !/[:.]$/.test(R.typed)) answer(R.typed); return; }
      else if (k === ':' || k === '.') { if (R.typed && !/[:.]/.test(R.typed)) R.typed += k; }
      else if (R.typed.replace(/[^0-9]/g, '').length < 6) R.typed += k;
      $('#answer').textContent = R.typed || NB;
    }
    document.addEventListener('keydown', e => { if ($('#round').hidden || $('#numpad').hidden || R.locked) return; if (/^[0-9]$/.test(e.key)) key(e.key); else if (e.key === ':' || e.key === '.') key(e.key); else if (e.key === 'Backspace') key('⌫'); else if (e.key === 'Enter') key('✓'); });
    $('#btnHow').onclick = () => { if (R.locked || !R.q || R.hint || !EXPLAIN[R.q.skill]) return; R.hint = true; R.howtos++; $('#btnHow').disabled = true; sfx.play('tap'); ui.howto($('#howto'), EXPLAIN[R.q.skill](R.q), { hideLast: true, doneLabel: t('gotIt') }); if (R.potion !== 'hint') ui.toast(t('hintCost')); };
    const same = (a, b) => { const x = String(a).trim().replace(/\s+/g, ' '), y = String(b).trim().replace(/\s+/g, ' '); if (x === y) return true; const nx = parseFloat(x), ny = parseFloat(y); return !isNaN(nx) && !isNaN(ny) && /^[\d.]+$/.test(x) && /^[\d.]+$/.test(y) && Math.abs(nx - ny) < 1e-9; };
    function answer(val, btn) { if (R.locked) return; settle(R.q.check ? R.q.check(val) : same(val, R.q.answer), val, btn); }
    function settle(ok, val, btn) {
      if (R.locked && btn) return; if (R.settledQ === R.q) return; R.settledQ = R.q;   // one verdict per question, however many taps arrive
      R.locked = true; $('#btnHow').disabled = true;
      const ms = performance.now() - R.t0; R.times.push(ms); const q = R.q, fb = $('#feedback');
      R.results[R.i] = ok; if (window.KQStage) KQStage.reward(ok); KQ.skills.note(W, { key: q.skill, tags: q.tags, ok }); const gr = R.G && !R.egg ? R.G.answer(q.skill, ok, ms, { hint: R.hint && !R.freeHint, tier: R.tier }) : null; if (gr && gr.advice === 'up' && R.tier < 2) R.tier++; KQ.rotate.note(profile.id, W, R.band, q.skill, q.key || (q.prompt + '|' + (q.visual || '')));
      if (ok) {
        R.correct++; R.streak++; R.best = Math.max(R.best, R.streak);
        const pts = KQ.score.answer({ ok: true, ms, streak: R.streak, fastMs: (cfg.fastMs || 6000) * R.fastMul, hint: R.hint && !R.freeHint, potion: R.potion }); R.points += pts;
        if (R.streak === 5) ui.toast(KQ.praise.steady(5));   // a quiet note, not a jackpot
        if (R.streak >= 3 && R.tier < 2 && R.results.slice(-3).every(Boolean)) R.tier++;
        fb.textContent = KQ.praise.ok({ hint: R.hint && !R.freeHint, fast: ms < (cfg.fastMs || 6000) * R.fastMul * 0.6 }); fb.className = 'feedback ok'; sfx.play('correct');
        if (btn) btn.classList.add('ok'); else if (!q.render) $('#answer').classList.add('ok');
        R.i++; renderDots(); setTimeout(nextQ, q.render ? 1300 : 900);
      } else {
        if (R.potion === 'shield' && !R.shield) { R.shield = true; ui.toast('🛡️ ' + t('p_shield')); } else R.streak = 0;
        if (R.tier > 0 && R.results.slice(-2).every(x => x === false)) R.tier--;
        const shown = q.answerLabel != null ? q.answerLabel : q.answer;
        fb.textContent = KQ.praise.bad(shown); fb.className = 'feedback bad'; sfx.play('wrong'); ui.toast(KQ.praise.grow());
        KQ.journal.add(W, { skill: q.skill, tags: q.tags, prompt: q.journal || q.prompt || t('s_' + q.skill), given: String(val), answer: String(shown == null ? '' : shown), label: t('s_' + q.skill) });
        if (btn) { btn.classList.add('bad'); for (const b of $('#choices').children) if (b.textContent === String(shown) || b.dataset.value === String(shown)) b.classList.add('ok'); } else if (!q.render) { $('#answer').classList.add('bad'); $('#answer').textContent = R.typed + ' → ' + shown; }
        $('.qcard').classList.add('shake'); setTimeout(() => $('.qcard').classList.remove('shake'), 450);
        R.i++; renderDots();
        if (EXPLAIN[q.skill]) { R.howtos++; $('#howto').replaceChildren(); ui.howto($('#howto'), EXPLAIN[q.skill](q), { doneLabel: R.i < R.n ? t('tryAlike') : t('gotIt'), onDone: () => { R.retryTags = q.tags; nextQ(); } }); }
        else setTimeout(nextQ, 1900);
      }
    }
    function finish() {
      const bonus = KQ.score.perfectBonus(R.correct, R.n); R.points += bonus; if (R.potion === 'double') R.points *= 2;
      const stars = KQ.score.stars(R.correct, R.n), avgMs = Math.round(R.times.reduce((a, b) => a + b, 0) / Math.max(1, R.times.length));
      const label = R.skill === 'focus' ? t('focus') : t('s_' + R.skill);
      const rec = store.record(W, { stars, points: R.points, correct: R.correct, total: R.n, avgMs, mode: R.skill, level: R.band, label, bestStreak: R.best, howtos: R.howtos });
      const skills = BANDS[R.band], nextSkill = skills[(skills.indexOf(R.skill) + 1) % skills.length];
      const extra = []; if (bonus) extra.push([t('perfectBonus'), '+' + bonus]); if (R.potion === 'double') extra.push([t('p_double'), '×2']);
      const lad = R.egg ? { passed: true } : R.G ? R.G.finish(stars, R.level, bandIds, BANDS) : KQ.ladder.complete(profile.id, W, R.band, R.level, stars, bandIds), bandName = b => t(cfg.bandKey ? cfg.bandKey + b : 'band' + b);
      if (lad.lines) extra.push(...lad.lines);
      if (lad.unlocked && !lad.bandUp) extra.push(['🪜 ' + t('ladderUnlocked', { l: lad.level }), '']); else if (!lad.passed && !lad.held && !lad.rolledBack) extra.push(['🪜 ' + t('ladderNeed'), '']);
      if (lad.bandUp) R.band = lad.nextBand;
      let hatched = null; if (R.egg) { if (stars >= 2) { hatched = KQ.eggs.win(profile.id, R.egg); KQ.profiles.update(profile.id, { avatar: hatched }); extra.push(['🐰 ' + t('eggWin'), ui.avatarTitle(hatched)[0]]); } else extra.push(['🥚 ' + t('eggLose'), '']); R.egg = null; }
      const openReport = () => ui.report({ title: t('reportTitle'), stars, points: R.points, correct: R.correct, total: R.n, avgMs, bestStreak: R.best, extra, rec, workingOn: KQ.skills.weak(profile.id, W, 3).map(w => tagName(w.key)), mastered: KQ.skills.mastered(profile.id, W, 4).map(tagName), onAgain: () => startRound(R.skill), onNext: () => startRound(nextSkill), homeHref: cfg.homeHref || '../index.html' });
      const afterBand = lad.bandUp ? () => ui.celebrate({ emoji: '🎓', title: t('ladderBandUp', { n: KQ.ladder.steps, name: bandName(lad.nextBand) }), sub: bandName(lad.nextBand), onDone: openReport }) : openReport;
      const afterCastle = hatched ? () => ui.celebrate({ emoji: '🐰', title: t('eggWin'), sub: ui.avatarTitle(hatched)[0], onDone: afterBand }) : afterBand;
      if (rec && rec.castleUp) ui.celebrate({ emoji: '🏰', title: t('levelUp'), sub: t('welcomeTo', { name: t('castle' + rec.progress.castle) }), onDone: afterCastle }); else afterCastle();
      $('#round').hidden = true; if (KQ.ui.peek) KQ.ui.peek(null); $('#pick').hidden = false; document.body.classList.remove('focus'); renderPick();
    }
    $('#btnQuit').onclick = () => { $('#round').hidden = true; if (KQ.ui.peek) KQ.ui.peek(null); $('#pick').hidden = false; document.body.classList.remove('focus'); renderPick(); };
    $('#btnSpeak').onclick = () => { if (R.q && R.q.speak) KQ.speak(R.q.speak, null, { force: true }); };
    function boot() { ui.header({ title: t(cfg.title), sub: t(cfg.sub), homeHref: cfg.homeHref || '../index.html' }); renderPick(); if (eggId && !R.egg && $('#round').hidden) { const top = BANDS[bandIds[bandIds.length - 1]]; startRound(top[top.length - 1], { egg: true }); } }
    document.addEventListener('kq:ladder', () => { R.band = KQ.ladder.band(profile.id, W, bandIds) || R.band; if ($('#round').hidden) renderPick(); });
    document.addEventListener('kq:lang', () => { boot(); if (!$('#round').hidden && !R.egg) { $('#round').hidden = true; if (KQ.ui.peek) KQ.ui.peek(null); $('#pick').hidden = false; } });   // a language switch resets a normal round, never the egg challenge
    KQ.i18n.apply(); boot();
    window.KQQuest = api;   // the running world, for tests and tooling
    return api;
  }
  // the page skeleton every quest world shares
  quest.shell = function () {
    const main = $('main.play'); if (!main) return;
    const h = (tag, cls, id, text) => { const e = el(tag, cls, text); if (id) e.id = id; return e; };
    main.replaceChildren();
    main.appendChild(h('div', null, 'potions'));
    const pickSec = h('section', 'card', 'pick'); const h2 = h('h2', null, null, t('ageBand')); h2.dataset.i18n = 'ageBand'; pickSec.appendChild(h2); pickSec.appendChild(h('div', 'bands', 'bands')); const sec = h('div', 'sec', null, t('chooseGame')); sec.dataset.i18n = 'chooseGame'; pickSec.appendChild(sec); pickSec.appendChild(h('div', 'tiles', 'skills')); main.appendChild(pickSec);
    const round = h('section', 'card', 'round'); round.hidden = true;
    const top = document.createElement('div'); top.innerHTML = '<div class="rhead"><button class="back" id="btnQuit" type="button"><span class="chev">‹</span><span data-i18n="back">Back</span></button><div class="prog"><div class="qbar" id="qbar"><i></i></div><span class="qcount" id="qcount"></span></div><div class="pill" id="skillName"></div><div class="dots" id="dots" hidden></div><div class="streak" id="streak" hidden></div></div>'; round.appendChild(top.firstElementChild);
    const qc = h('div', 'qcard'); const vis = h('div', 'visual', 'visual'); vis.hidden = true; qc.appendChild(vis); qc.appendChild(h('div', 'prompt', 'prompt')); const stage = h('div', null, 'stage'); qc.appendChild(stage);
    const ab = h('div', null, 'answerBox'); ab.hidden = true; ab.appendChild(h('div', 'answer', 'answer', NB)); qc.appendChild(ab);
    qc.appendChild(h('div', 'feedback', 'feedback')); const ch = h('div', 'choices', 'choices'); ch.hidden = true; qc.appendChild(ch); const np = h('div', 'numpad', 'numpad'); np.hidden = true; qc.appendChild(np);
    const tools = h('div', 'qtools'); const how = h('button', 'btn gold sm', 'btnHow'); how.appendChild(el('span', null, '💡 ')); how.appendChild(el('span', null, t('howTo'))); tools.appendChild(how); tools.appendChild(h('button', 'ibtn', 'btnSpeak', '🔊')); qc.appendChild(tools);
    qc.appendChild(h('div', null, 'howto')); round.appendChild(qc); main.appendChild(round);
  };
  KQ.quest = quest;
})();
