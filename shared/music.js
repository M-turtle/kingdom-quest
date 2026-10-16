/* Kingdom Quest — Music Hall's sound engine and its pictures.
   Real recorded instruments (shared/music/<instrument>.mp3, and two shared sprites band.mp3 / winds.mp3 for the eleven added 2026-10-10;
   offsets in music_map.js; tonejs-instruments samples, CC BY 3.0 — the credit is shown in the Instrument Hall; a few notes per
   instrument, every other note is pitched from the nearest recording), synthesised drums, the famous tunes (always with their
   composer and the piece's name), note names (letters and do-re-mi), painted instrument pictures and a music staff.
   API: KQMusic.load(inst) → Promise · play(inst, midi, {when, dur, vel}) · drum(kind, when, vel) · seq(events, {bpm, inst, onNote, onEnd})
        → {stop, ms} · stop() · midi('Fs4') · name(midi, lang, mode) · art(inst) → <svg> · staff(notes, opts) → <svg> · TUNES · INSTR */
(function () {
  'use strict';
  const script = document.currentScript;
  const BASE = new URL('music/', script ? script.src : location.href).href;
  const INSTR = {
    piano: { notes: 'C3 Fs3 C4 Fs4 C5 Fs5 C6', ring: true, fam: 'keys', att: 0.004, rel: 0.5 },
    violin: { notes: 'G3 C4 A4 E5 C6', fam: 'strings', att: 0.06, rel: 0.25 },
    cello: { notes: 'C2 G2 D3 A3 E4 C5', fam: 'strings', att: 0.07, rel: 0.3 },
    flute: { notes: 'C4 A4 E5 C6', fam: 'woodwind', att: 0.05, rel: 0.2 },
    xylophone: { notes: 'G4 C5 G5 C6 G6 C7 G7 C8', ring: true, fam: 'percussion', att: 0.002, rel: 0.3 },
    guitar: { notes: 'A2 D3 G3 C4 E4 A4', ring: true, fam: 'strings', att: 0.003, rel: 0.35 },
    trumpet: { notes: 'F3 Ds4 G4 As4 D5',   /* the file called A#3 sounds A#4 (measured 2026-10-10, art-src/music-notes/RELABELLED.txt) */ fam: 'brass', att: 0.03, rel: 0.2 },
    harp: { notes: 'C3 G3 D4 A4 E5 B5', ring: true, fam: 'strings', att: 0.003, rel: 0.6 },
    /* the eleven added for the Instrument Hall (Yoni 2026-10-10: 'all major instruments'), packed in two sprites: band.mp3 and winds.mp3.
       Our 'guitar' (University of Iowa, a Raimundo 118) is a classical nylon-string guitar, so there is no second classical guitar. */
    organ: { sprite: 'band', fam: 'keys', att: 0.02, rel: 0.15 },
    harmonium: { sprite: 'band', fam: 'keys', att: 0.05, rel: 0.2 },
    'guitar-electric': { sprite: 'band', ring: true, fam: 'strings', att: 0.003, rel: 0.4 },
    'bass-electric': { sprite: 'band', ring: true, fam: 'strings', att: 0.004, rel: 0.3 },
    contrabass: { sprite: 'band', fam: 'strings', att: 0.06, rel: 0.3 },
    clarinet: { sprite: 'winds', fam: 'woodwind', att: 0.04, rel: 0.2 },
    bassoon: { sprite: 'winds', fam: 'woodwind', att: 0.04, rel: 0.2 },
    saxophone: { sprite: 'winds', fam: 'woodwind', att: 0.03, rel: 0.2 },
    'french-horn': { sprite: 'winds', fam: 'brass', att: 0.05, rel: 0.25 },
    trombone: { sprite: 'winds', fam: 'brass', att: 0.04, rel: 0.2 },
    tuba: { sprite: 'winds', fam: 'brass', att: 0.05, rel: 0.25 },
    /* a real drum kit (Karoryfer Big Rusty Drums + a VCSL clap, CC0; tools/prep_voice_drums.py), keyed by kind; until it has loaded the
       drums below are made from oscillators and noise, as before */
    drums: { fam: 'percussion', sprite: 'band', kit: true },
    /* the singing voice (Karoryfer Hadzi-Fia 'ah', CC0): a bass singer, G2–B♭3 (the files sound an octave below their names) */
    voice: { sprite: 'winds', fam: 'voice', att: 0.07, rel: 0.25 },
    /* the woman's voice (Berklee Sampling Archive 'femalevoice_aa', OLPC library, CC BY 3.0): A3–F5, each note tuned to its measured pitch */
    'voice-f': { sprite: 'winds', fam: 'voice', att: 0.06, rel: 0.25 }
  };
  const LET = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) { if (typeof n === 'number') return n; const m = String(n).match(/^([A-G])(s|#|b)?(-?\d)$/); if (!m) return 60; return 12 * (+m[3] + 1) + LET[m[1]] + (m[2] === 's' || m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
  const LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const SOL = { en: ['do', 'do♯', 're', 're♯', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'la♯', 'si'], he: ['דו', 'דו♯', 'רה', 'רה♯', 'מי', 'פה', 'פה♯', 'סול', 'סול♯', 'לה', 'לה♯', 'סי'] };
  /* the colour of each note of the scale (the same rainbow on the xylophone, the creator grid and the staff) */
  const HUE = ['#ff4d5e', '#ff6f4d', '#ff9a3c', '#ffb43c', '#ffd84a', '#7ed957', '#4fc98a', '#3fb6ff', '#5a8cff', '#7a7aff', '#a46cff', '#c86cff'];
  function name(m, lang, mode) { const pc = ((m % 12) + 12) % 12; return mode === 'letter' ? LETTERS[pc] : SOL[lang === 'he' ? 'he' : 'en'][pc]; }

  // ---------- audio ----------
  let ctx = null, out = null;
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; out = ctx.createGain(); out.gain.value = 0.85; out.connect(comp); comp.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const banks = {}, files = {};
  /* each instrument is one sprite (shared/music/<inst>.mp3, offsets in shared/music_map.js): fetched once, decoded, cut into its notes */
  function load(inst) {
    const I = INSTR[inst]; if (!I || I.synth) return Promise.resolve(true);
    if (banks[inst]) return banks[inst].p;
    const c = ac(); const b = banks[inst] = { list: [] }; const SP = (window.KQ_MUSIC_SPRITES || {})[inst]; if (!c || !SP) { b.p = Promise.resolve(false); return b.p; }
    const file = I.sprite || inst;   /* a shared sprite is fetched and decoded once for all its instruments */
    files[file] = files[file] || fetch(BASE + file + '.mp3').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(a => new Promise((res, rej) => c.decodeAudioData(a, res, rej)));
    b.p = files[file].then(all => {
      const sr = all.sampleRate, src = all.getChannelData(0);
      for (const n in SP) { const [st, du] = SP[n], i0 = Math.floor(st * sr), len = Math.min(Math.floor((du + 0.06) * sr), src.length - i0); if (len <= 0) continue; const buf = c.createBuffer(1, len, sr); buf.copyToChannel(src.subarray(i0, i0 + len), 0); if (I.kit) (b.kinds = b.kinds || {})[n] = buf; else b.list.push({ m: midi(n), buf }); }
      if (I.kit) return !!b.kinds;
      b.list.sort((x, y) => x.m - y.m); return b.list.length > 0; }).catch(() => false);
    return b.p;
  }
  const live = new Set();
  function play(inst, m, o) {
    o = o || {}; const c = ac(); if (!c) return;
    if (inst === 'drums') return drum(o.kind || 'kick', o.when, o.vel);
    const I = INSTR[inst] || INSTR.piano, b = banks[inst]; if (!b || !b.list.length) { load(inst); return synthNote(m, o); }
    let best = b.list[0]; for (const s of b.list) if (Math.abs(s.m - m) < Math.abs(best.m - m)) best = s;
    const t = Math.max(c.currentTime, o.when || 0), dur = o.dur || 0.6, vel = o.vel == null ? 0.9 : o.vel;
    const src = c.createBufferSource(); src.buffer = best.buf; src.playbackRate.value = Math.pow(2, (m - best.m) / 12);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + I.att);
    const end = I.ring ? t + Math.max(dur, 0.4) + I.rel * 3 : t + dur;
    if (I.ring) g.gain.setTargetAtTime(0.0001, t + Math.max(dur, 0.35), I.rel); else { g.gain.setValueAtTime(vel, end); g.gain.linearRampToValueAtTime(0.0001, end + I.rel); }
    src.connect(g); g.connect(out); src.start(t); src.stop(end + I.rel + 0.1);
    const h = { src, g, rel: I.rel }; live.add(h); src.onended = () => live.delete(h);
    return h;
  }
  /* let go of a held note (the Instrument Hall's keys): a short fade instead of the note's full length */
  function release(h) { const c = ac(); if (!h || !h.g || !c) return; try { const t = c.currentTime, r = Math.max(0.12, h.rel || 0.2), G = h.g.gain;
    if (G.cancelAndHoldAtTime) G.cancelAndHoldAtTime(t); else { G.cancelScheduledValues(t); G.setValueAtTime(Math.max(G.value, 0.0001), t); }
    G.setTargetAtTime(0.0001, t, r / 3); h.src.stop(t + r + 0.1); } catch (e) {} }
  /* until a bank has loaded, a soft tone keeps the game responsive */
  function synthNote(m, o) { const c = ac(); const t = Math.max(c.currentTime, o.when || 0), f = 440 * Math.pow(2, (m - 69) / 12); const os = c.createOscillator(), g = c.createGain(); os.type = 'triangle'; os.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.01); g.gain.setTargetAtTime(0.0001, t + (o.dur || 0.4), 0.15); os.connect(g); g.connect(out); os.start(t); os.stop(t + (o.dur || 0.4) + 1); const h = { src: os, g }; live.add(h); os.onended = () => live.delete(h); }
  let noise = null; function noiseBuf(c) { if (noise) return noise; noise = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return noise; }
  /* a drum kit made from oscillators and noise: kick, snare, hi-hat, tom, clap, cymbal */
  function drum(kind, when, vel) {
    const c = ac(); if (!c) return; const t = Math.max(c.currentTime, when || 0), v = vel == null ? 0.9 : vel;
    /* the recorded kit when it is ready (the first beat loads it) */
    const kit = banks.drums && banks.drums.kinds; if (!kit) load('drums');
    if (kit && kit[kind]) { const s = c.createBufferSource(), g = c.createGain(); s.buffer = kit[kind]; g.gain.value = Math.min(1.2, v * 1.05); s.connect(g); g.connect(out); s.start(t); const h = { src: s, g }; live.add(h); s.onended = () => live.delete(h); return; }
    const env = (node, a, d, peak) => { const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); g.connect(out); return g; };
    const osc = (type, f0, f1, d) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); o.start(t); o.stop(t + d + 0.05); return o; };
    const nz = (type, f, q, d) => { const s = c.createBufferSource(); s.buffer = noiseBuf(c); const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1; s.connect(fl); s.start(t); s.stop(t + d + 0.05); return fl; };
    if (kind === 'kick') { env(osc('sine', 150, 42, 0.35), 0.004, 0.34, 1.0); env(nz('lowpass', 900, 1, 0.03), 0.002, 0.03, 0.25); }
    else if (kind === 'snare') { env(nz('highpass', 1400, 0.8, 0.2), 0.002, 0.18, 0.55); env(osc('triangle', 220, 160, 0.12), 0.002, 0.1, 0.4); }
    else if (kind === 'hat') { env(nz('highpass', 7500, 1, 0.06), 0.001, 0.05, 0.3); }
    else if (kind === 'tom') { env(osc('sine', 210, 120, 0.3), 0.003, 0.28, 0.75); }
    else if (kind === 'clap') { for (const k of [0, 0.012, 0.024]) { const s = c.createBufferSource(); s.buffer = noiseBuf(c); const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 1500; fl.Q.value = 1.2; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t + k); g.gain.exponentialRampToValueAtTime(0.5 * v, t + k + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + k + (k === 0.024 ? 0.16 : 0.02)); s.connect(fl); fl.connect(g); g.connect(out); s.start(t + k); s.stop(t + k + 0.2); } }
    else if (kind === 'crash') { env(nz('highpass', 4500, 0.6, 1.4), 0.003, 1.3, 0.35); }
  }
  const DRUMS = ['kick', 'snare', 'hat', 'tom', 'clap', 'crash'];
  /* events: [{m, b (start beat), d (beats), inst?, kind?, vel?}] → schedules them, calls onNote(i, ev) as each one sounds */
  let timers = [];
  function seq(events, o) {
    o = o || {}; const c = ac(); if (!c) return { stop() {}, ms: 0 };
    const spb = 60 / (o.bpm || 100), t0 = c.currentTime + 0.08; let last = 0; const my = [];
    events.forEach((ev, i) => {
      const when = t0 + ev.b * spb, inst = ev.inst || o.inst || 'piano';
      if (ev.kind || inst === 'drums') drum(ev.kind || 'kick', when, ev.vel); else if (ev.m != null) play(inst, ev.m, { when, dur: (ev.d || 1) * spb * 0.95, vel: ev.vel });
      if (o.onNote) { const id = setTimeout(() => o.onNote(i, ev), Math.max(0, (when - c.currentTime) * 1000)); timers.push(id); my.push(id); }
      last = Math.max(last, ev.b + (ev.d || 1));
    });
    const ms = last * spb * 1000 + 80;
    if (o.onEnd) { const id = setTimeout(o.onEnd, ms + 120); timers.push(id); my.push(id); }
    return { ms, stop() { my.forEach(clearTimeout); stop(); } };
  }
  function stop() { timers.forEach(clearTimeout); timers = []; const c = ctx; if (!c) return; for (const h of live) { try { h.g.gain.cancelScheduledValues(c.currentTime); h.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.04); h.src.stop(c.currentTime + 0.2); } catch (e) {} } live.clear(); }
  /* "E4:1 R:.5 G4:.5" → events with running beats */
  function parse(str, inst) { let b = 0; const ev = []; for (const tok of str.trim().split(/\s+/)) { const [n, d] = tok.split(':'); const dd = d ? parseFloat(d) : 1; if (n !== 'R') ev.push({ m: midi(n), b, d: dd, inst }); b += dd; } return ev; }

  /* ---------- the famous tunes: every one names its composer and the piece (Yoni 2026-10-03) ---------- */
  const TUNES = [
    { id: 'ode', band: 1, inst: 'piano', bpm: 112, y: '1824', en: ['Ode to Joy', 'Ludwig van Beethoven', 'from Symphony No. 9'], he: ['האודה לשמחה', 'לודוויג ואן בטהובן', 'מתוך הסימפוניה התשיעית'], n: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2' },
    { id: 'twinkle', band: 1, inst: 'xylophone', bpm: 104, y: '1781', en: ['Twinkle, Twinkle, Little Star', 'Wolfgang Amadeus Mozart', 'variations on a French song'], he: ['נצנץ נצנץ כוכב קטן', 'וולפגנג אמדאוס מוצרט', 'וריאציות על שיר צרפתי'], n: 'C5 C5 G5 G5 A5 A5 G5:2 F5 F5 E5 E5 D5 D5 C5:2' },
    { id: 'mary', band: 1, inst: 'xylophone', bpm: 112, y: '1830', en: ['Mary Had a Little Lamb', 'Traditional', 'an American folk song'], he: ['למרי היה כבש קטן', 'שיר עם', 'שיר עם אמריקאי'], n: 'E5 D5 C5 D5 E5 E5 E5:2 D5 D5 D5:2 E5 G5 G5:2' },
    { id: 'jacques', band: 1, inst: 'piano', bpm: 116, y: '1780', en: ['Frère Jacques', 'Traditional', 'a French folk song'], he: ['פרר ז׳אק', 'שיר עם', 'שיר עם צרפתי'], n: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2' },
    { id: 'birthday', band: 1, inst: 'piano', bpm: 100, y: '1893', en: ['Happy Birthday', 'Mildred and Patty Hill', 'a song for every birthday'], he: ['יום הולדת שמח', 'מילדרד ופטי היל', 'שיר לכל יום הולדת'], n: 'C4:.75 C4:.25 D4 C4 F4 E4:2 C4:.75 C4:.25 D4 C4 G4 F4:2' },
    { id: 'elise', band: 3, inst: 'piano', bpm: 76, y: '1810', en: ['Für Elise', 'Ludwig van Beethoven', 'a piano piece'], he: ['לאליזה', 'לודוויג ואן בטהובן', 'יצירה לפסנתר'], n: 'E5:.5 Ds5:.5 E5:.5 Ds5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 Gs4:.5 B4:.5 C5:2' },
    { id: 'lullaby', band: 3, inst: 'harp', bpm: 84, y: '1868', en: ['Lullaby (Wiegenlied)', 'Johannes Brahms', 'a cradle song'], he: ['שיר ערש', 'יוהנס ברהמס', 'שיר לפני השינה'], n: 'E4:.5 E4:.5 G4:2 E4:.5 E4:.5 G4:2 E4:.5 G4:.5 C5:1 B4:1.5 A4:.5 A4:1 G4:2' },
    { id: 'mountain', band: 3, inst: 'cello', bpm: 132, y: '1875', en: ['In the Hall of the Mountain King', 'Edvard Grieg', 'from Peer Gynt'], he: ['בהיכל מלך ההרים', 'אדוורד גריג', 'מתוך פר גינט'], n: 'A3:.5 B3:.5 C4:.5 D4:.5 E4:.5 C4:.5 E4:1 Ds4:.5 B3:.5 Ds4:1 D4:.5 As3:.5 D4:1 A3:.5 B3:.5 C4:.5 D4:.5 E4:.5 C4:.5 E4:.5 A4:.5 G4:.5 E4:.5 C4:.5 E4:.5 G4:2' },
    { id: 'nacht', band: 3, inst: 'violin', bpm: 120, y: '1787', en: ['Eine kleine Nachtmusik', 'Wolfgang Amadeus Mozart', 'a serenade for strings'], he: ['מוזיקת לילה קטנה', 'וולפגנג אמדאוס מוצרט', 'סרנדה לכלי קשת'], n: 'G4:1 R:.5 D4:.5 G4:1 R:.5 D4:.5 G4:.5 D4:.5 G4:.5 B4:.5 D5:2 C5:1 R:.5 A4:.5 C5:1 R:.5 A4:.5 C5:.5 A4:.5 Fs4:.5 A4:.5 D4:2' },
    { id: 'spring', band: 3, inst: 'violin', bpm: 100, y: '1725', en: ['Spring', 'Antonio Vivaldi', 'from The Four Seasons'], he: ['האביב', 'אנטוניו ויוואלדי', 'מתוך ארבע העונות'], n: 'E4:1 Gs4:.5 Gs4:.5 Gs4:.5 Fs4:.25 E4:.25 B4:1.5 B4:.25 A4:.25 Gs4:.5 Gs4:.5 Gs4:.5 Fs4:.25 E4:.25 B4:1.5' },
    { id: 'cancan', band: 3, inst: 'trumpet', bpm: 132, y: '1858', en: ['Can-can', 'Jacques Offenbach', 'from Orpheus in the Underworld'], he: ['קאנקאן', 'ז׳אק אופנבך', 'מתוך אורפאוס בשאול'], n: 'C4:1 D4:.5 F4:.5 E4:.5 D4:.5 G4:1 G4:1 G4:.5 A4:.5 E4:.5 F4:.5 D4:1 D4:1 D4:.5 F4:.5 E4:.5 D4:.5 C4:.5 C5:.5 B4:.5 A4:.5 G4:2' },
    { id: 'minuet', band: 4, inst: 'harp', bpm: 112, y: '1725', en: ['Minuet in G', 'Christian Petzold', 'long thought to be by Bach'], he: ['מינואט בסול מז׳ור', 'כריסטיאן פצולד', 'שנים חשבו שכתב אותו באך'], n: 'D5:1 G4:.5 A4:.5 B4:.5 C5:.5 D5:1 G4:1 G4:1 E5:1 C5:.5 D5:.5 E5:.5 Fs5:.5 G5:1 G4:1 G4:1' },
    { id: 'turkish', band: 4, inst: 'piano', bpm: 120, y: '1783', en: ['Turkish March', 'Wolfgang Amadeus Mozart', 'Rondo alla Turca'], he: ['המארש הטורקי', 'וולפגנג אמדאוס מוצרט', 'רונדו אלה טורקה'], n: 'B4:.25 A4:.25 Gs4:.25 A4:.25 C5:1 D5:.25 C5:.25 B4:.25 C5:.25 E5:1 F5:.25 E5:.25 Ds5:.25 E5:.25 B5:.25 A5:.25 Gs5:.25 A5:.25 B5:.25 A5:.25 Gs5:.25 A5:.25 C6:2' },
    { id: 'morning', band: 4, inst: 'flute', bpm: 96, y: '1875', en: ['Morning Mood', 'Edvard Grieg', 'from Peer Gynt'], he: ['מצב רוח של בוקר', 'אדוורד גריג', 'מתוך פר גינט'], n: 'G5:.5 E5:.5 D5:.5 C5:.5 D5:.5 E5:.5 G5:.5 E5:.5 D5:.5 C5:.5 D5:.25 E5:.25 D5:.25 E5:.25 G5:.5 E5:.5 G5:.5 A5:.5 E5:.5 A5:.5 G5:.5 E5:.5 D5:.5 C5:2' },
    { id: 'swan', band: 4, inst: 'cello', bpm: 72, y: '1886', en: ['The Swan', 'Camille Saint-Saëns', 'from The Carnival of the Animals'], he: ['הברבור', 'קמיל סן־סאנס', 'מתוך קרנבל החיות'], n: 'G4:3 Fs4:1 B3:1 E4:1 D4:1 G3:3 A3:1 B3:1 Cs4:1 D4:1 E4:1 Fs4:1 G4:3' },
    { id: 'canon', band: 4, inst: 'violin', bpm: 76, y: '1680', en: ['Canon in D', 'Johann Pachelbel', 'a canon for strings'], he: ['קנון ברה מז׳ור', 'יוהאן פכלבל', 'קנון לכלי קשת'], n: 'Fs5:2 E5:2 D5:2 Cs5:2 B4:2 A4:2 B4:2 Cs5:2' }
  ];
  TUNES.forEach(t => { t.ev = parse(t.n, t.inst); });
  const tuneText = (tu, lang) => { const L = tu[lang === 'he' ? 'he' : 'en']; return { title: L[0], who: L[1], about: L[2], year: tu.y }; };

  // ---------- pictures: painted instruments (vector, gradients; never an emoji) ----------
  let uid = 0;
  const NS = 'http://www.w3.org/2000/svg';
  /* every picture is built from this file's own constant markup (no outside text), parsed as SVG */
  function svgEl(markup, vb, cls) { const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}" viewBox="${vb || '0 0 120 120'}">${markup}</svg>`, 'image/svg+xml'); const s = document.importNode(doc.documentElement, true); s.setAttribute('class', cls || 'kqm-art'); s.setAttribute('aria-hidden', 'true'); return s; }
  function lg(id, a, b, x2, y2) { return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 == null ? 1 : x2}" y2="${y2 == null ? 1 : y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`; }
  function rg(id, a, b) { return `<radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`; }
  const shadow = id => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#000" flood-opacity=".35"/></filter>`;
  /* the body of a violin-family instrument, centred at (60, cy), w × h */
  function fiddleBody(w, h, cy) { const x = 60, t = cy - h / 2, b = cy + h / 2, hw = w / 2, ww = hw * 0.62;
    return `M${x} ${t} C${x + hw * 0.8} ${t} ${x + hw} ${t + h * 0.1} ${x + hw} ${t + h * 0.26} C${x + hw} ${t + h * 0.36} ${x + ww} ${t + h * 0.38} ${x + ww} ${t + h * 0.47} C${x + ww} ${t + h * 0.56} ${x + hw * 1.04} ${t + h * 0.6} ${x + hw * 1.04} ${t + h * 0.76} C${x + hw * 1.04} ${b - h * 0.04} ${x + hw * 0.6} ${b} ${x} ${b} C${x - hw * 0.6} ${b} ${x - hw * 1.04} ${b - h * 0.04} ${x - hw * 1.04} ${t + h * 0.76} C${x - hw * 1.04} ${t + h * 0.6} ${x - ww} ${t + h * 0.56} ${x - ww} ${t + h * 0.47} C${x - ww} ${t + h * 0.38} ${x - hw} ${t + h * 0.36} ${x - hw} ${t + h * 0.26} C${x - hw} ${t + h * 0.1} ${x - hw * 0.8} ${t} ${x} ${t}Z`; }
  function fiddle(k, big) {
    const i = ++uid, bw = big ? 46 : 36, bh = big ? 62 : 48, cy = big ? 76 : 82, top = big ? 6 : 12;
    return `<defs>${rg('w' + i, big ? '#d9783a' : '#e08a46', big ? '#6a2a10' : '#7a3010')}${lg('n' + i, '#3a2418', '#120a06', 1, 0)}${shadow('s' + i)}</defs>
    <g filter="url(#s${i})"${k ? ` transform="rotate(${k} 60 60)"` : ''}>
      <path d="${fiddleBody(bw, bh, cy)}" fill="url(#w${i})" stroke="#3a1606" stroke-width="1.2"/>
      <path d="${fiddleBody(bw - 4, bh - 4, cy)}" fill="none" stroke="#f0b070" stroke-opacity=".35" stroke-width=".8"/>
      <rect x="57" y="${top + 12}" width="6" height="${cy - top - 4}" rx="2.5" fill="url(#n${i})"/>
      <path d="M57 ${top + 12} q-3 -8 3 -12 q6 4 3 12z" fill="#5a2a10"/><circle cx="60" cy="${top + 1}" r="3.2" fill="#6a3418" stroke="#2a1006" stroke-width=".8"/>
      <rect x="52" y="${top + 5}" width="5" height="2" rx="1" fill="#2a1408"/><rect x="63" y="${top + 5}" width="5" height="2" rx="1" fill="#2a1408"/>
      <path d="M${60 - bw * 0.2} ${cy - 2} q-4 8 0 16 M${60 + bw * 0.2} ${cy - 2} q4 8 0 16" fill="none" stroke="#1a0a04" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="${60 - bw * 0.16}" y="${cy + 6}" width="${bw * 0.32}" height="3" rx="1" fill="#e8c890"/>
      <path d="M56 ${cy + bh * 0.3} h8 l-1.5 ${bh * 0.16} h-5z" fill="#1a0e08"/>
      ${[-1.5, -0.5, 0.5, 1.5].map(o => `<line x1="${60 + o}" y1="${top + 10}" x2="${60 + o * 1.4}" y2="${cy + bh * 0.32}" stroke="#f4e6c8" stroke-width=".55"/>`).join('')}
      ${big ? `<line x1="60" y1="${cy + bh / 2}" x2="60" y2="118" stroke="#b8b8c0" stroke-width="2.4"/>` : ''}
    </g>${big ? '' : `<g filter="url(#s${i})"><line x1="18" y1="34" x2="104" y2="98" stroke="#5a3418" stroke-width="2.6" stroke-linecap="round"/><line x1="20" y1="36" x2="102" y2="97" stroke="#f4ead2" stroke-width=".9"/></g>`}`;
  }
  const ART = {
    piano() { const i = ++uid; let keys = ''; for (let k = 0; k < 10; k++) keys += `<rect x="${16 + k * 8.8}" y="70" width="8.2" height="30" rx="1.2" fill="url(#k${i})" stroke="#b8b0a0" stroke-width=".5"/>`; for (const k of [0, 1, 3, 4, 5, 7, 8]) keys += `<rect x="${21.5 + k * 8.8}" y="70" width="5.4" height="18" rx="1" fill="#14141a"/>`;
      return `<defs>${lg('b' + i, '#3a3440', '#0c0a10')}${lg('k' + i, '#ffffff', '#e6e0d4', 0, 1)}${lg('l' + i, '#5a5260', '#1a161e', 0, 1)}${shadow('s' + i)}</defs>
      <g filter="url(#s${i})"><path d="M12 64 L18 26 Q24 14 44 16 L96 22 Q108 24 108 36 L108 64 Z" fill="url(#b${i})"/><path d="M18 26 L92 30 L104 30" stroke="#8a8090" stroke-width="1" fill="none" opacity=".6"/>
      <path d="M22 26 L40 4 L44 6 L28 28 Z" fill="url(#l${i})"/>
      <rect x="12" y="62" width="96" height="10" rx="2" fill="#1a161e"/>${keys}<rect x="12" y="98" width="96" height="6" rx="2" fill="#1a161e"/>
      <rect x="18" y="104" width="5" height="14" fill="#14111a"/><rect x="97" y="104" width="5" height="14" fill="#14111a"/><rect x="56" y="104" width="8" height="4" rx="1" fill="#c8a24a"/></g>`; },
    violin() { return fiddle(-24, false); },
    cello() { return fiddle(0, true); },
    guitar() { const i = ++uid; return `<defs>${rg('w' + i, '#f2c27a', '#a8641e')}${shadow('s' + i)}</defs><g filter="url(#s${i})" transform="rotate(-30 60 60)">
      <path d="M60 46 C78 46 84 56 78 66 C90 72 90 104 60 106 C30 104 30 72 42 66 C36 56 42 46 60 46Z" fill="url(#w${i})" stroke="#5a300c" stroke-width="1.2"/>
      <circle cx="60" cy="74" r="8" fill="#2a1406"/><circle cx="60" cy="74" r="10" fill="none" stroke="#5a300c" stroke-width="1.6"/>
      <rect x="56.5" y="6" width="7" height="44" rx="1.5" fill="#3a2010"/><rect x="54" y="0" width="12" height="12" rx="2" fill="#2a1408"/>${[16, 22, 28, 34, 40].map(y => `<line x1="56.5" y1="${y}" x2="63.5" y2="${y}" stroke="#c8c0b0" stroke-width=".6"/>`).join('')}
      <rect x="52" y="90" width="16" height="4" rx="1" fill="#2a1406"/>${[-2.4, -1.4, -0.5, 0.5, 1.4, 2.4].map(o => `<line x1="${60 + o}" y1="4" x2="${60 + o * 1.2}" y2="92" stroke="#f4ead2" stroke-width=".45"/>`).join('')}</g>`; },
    flute() { const i = ++uid; return `<defs>${lg('m' + i, '#ffffff', '#8a90a0', 0, 1)}${shadow('s' + i)}</defs><g filter="url(#s${i})" transform="rotate(-28 60 60)">
      <rect x="6" y="56" width="108" height="8" rx="4" fill="url(#m${i})" stroke="#6a7080" stroke-width=".6"/>${[30, 44, 54, 64, 74, 84, 94].map(x => `<circle cx="${x}" cy="60" r="2.6" fill="#d8dce6" stroke="#5a6070" stroke-width="1"/>`).join('')}
      <ellipse cx="18" cy="60" rx="3" ry="2" fill="#2a2e3a"/><rect x="104" y="55" width="4" height="10" rx="1" fill="#a0a6b4"/></g>`; },
    trumpet() { const i = ++uid; return `<defs>${lg('g' + i, '#fff0a0', '#b07a10', 0, 1)}${shadow('s' + i)}</defs><g filter="url(#s${i})">
      <path d="M8 58 h70 M8 66 h70" stroke="url(#g${i})" stroke-width="5" stroke-linecap="round"/><path d="M78 52 Q96 50 112 36 L112 88 Q96 74 78 72 Z" fill="url(#g${i})" stroke="#8a5a08" stroke-width="1"/>
      <path d="M26 62 q0 -16 14 -16 h16 q14 0 14 16" fill="none" stroke="url(#g${i})" stroke-width="5"/>${[40, 48, 56].map(x => `<rect x="${x - 2.5}" y="34" width="5" height="22" rx="1.5" fill="url(#g${i})" stroke="#8a5a08" stroke-width=".6"/><circle cx="${x}" cy="33" r="3.6" fill="#f8f0e0" stroke="#8a5a08" stroke-width=".8"/>`).join('')}
      <path d="M2 56 h8 v12 h-8z" fill="#c89a30"/></g>`; },
    harp() { const i = ++uid; let s = ''; for (let k = 0; k < 11; k++) { const x = 32 + k * 6.4; s += `<line x1="${x}" y1="${100 - k * 1.4}" x2="${x}" y2="${30 + k * 3.4 + Math.sin(k / 3) * 4}" stroke="${k % 7 === 0 ? '#d83a3a' : k % 7 === 4 ? '#3a5ad8' : '#f4ead2'}" stroke-width=".9"/>`; }
      return `<defs>${lg('g' + i, '#ffe08a', '#a8701a', 0, 1)}${shadow('s' + i)}</defs><g filter="url(#s${i})"><path d="M26 108 L30 18 Q34 8 46 14 Q70 30 100 28 Q106 30 104 40 L100 46" fill="none" stroke="url(#g${i})" stroke-width="7" stroke-linecap="round"/>${s}
      <path d="M24 108 L104 100 L100 46" fill="none" stroke="url(#g${i})" stroke-width="5" stroke-linecap="round"/><rect x="16" y="106" width="96" height="8" rx="3" fill="#8a5a18"/></g>`; },
    xylophone() { const i = ++uid; const C = ['#ff4d5e', '#ff9a3c', '#ffd84a', '#7ed957', '#3fb6ff', '#5a8cff', '#a46cff', '#ff6fb0']; let bars = ''; C.forEach((c, k) => { const h = 62 - k * 5, x = 12 + k * 12.4; bars += `<rect x="${x}" y="${60 - h / 2}" width="10.4" height="${h}" rx="2.4" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/><rect x="${x + 1.6}" y="${60 - h / 2 + 2}" width="2.4" height="${h - 4}" rx="1" fill="#fff" opacity=".35"/><circle cx="${x + 5.2}" cy="${60 - h / 2 + 5}" r="1.3" fill="#3a3a48"/><circle cx="${x + 5.2}" cy="${60 + h / 2 - 5}" r="1.3" fill="#3a3a48"/>`; });
      return `<defs>${shadow('s' + i)}</defs><g filter="url(#s${i})"><path d="M8 34 L112 46 M8 86 L112 74" stroke="#7a4a20" stroke-width="5" stroke-linecap="round"/>${bars}<line x1="70" y1="108" x2="98" y2="80" stroke="#c8a070" stroke-width="2.6" stroke-linecap="round"/><circle cx="98" cy="80" r="5" fill="#f4f0e8" stroke="#8a8070"/></g>`; },
    drums() { const i = ++uid; return `<defs>${lg('r' + i, '#ff5a6a', '#9a1626', 0, 1)}${lg('c' + i, '#ffe7a0', '#b8862a', 0, 1)}${shadow('s' + i)}</defs><g filter="url(#s${i})">
      <ellipse cx="60" cy="56" rx="36" ry="10" fill="#f6f0e4" stroke="#b8b0a0"/><path d="M24 56 V92 Q60 106 96 92 V56 Q60 66 24 56Z" fill="url(#r${i})"/><path d="M24 92 Q60 106 96 92" fill="none" stroke="#e8c050" stroke-width="3"/><path d="M24 58 Q60 70 96 58" fill="none" stroke="#e8c050" stroke-width="3"/>
      ${[30, 44, 60, 76, 90].map(x => `<line x1="${x}" y1="${62 + Math.abs(60 - x) * -0.05}" x2="${x}" y2="${96 - Math.abs(60 - x) * 0.12}" stroke="#d8d8e0" stroke-width="1.4"/>`).join('')}
      <ellipse cx="96" cy="24" rx="18" ry="4" fill="url(#c${i})" transform="rotate(-10 96 24)"/><line x1="96" y1="26" x2="100" y2="54" stroke="#9a9aa6" stroke-width="1.6"/>
      <line x1="30" y1="22" x2="54" y2="50" stroke="#e0c090" stroke-width="3" stroke-linecap="round"/><line x1="56" y1="16" x2="66" y2="48" stroke="#e0c090" stroke-width="3" stroke-linecap="round"/></g>`; }
  };
  /* the painted instruments (tools/music_paint.py → shared/music/instruments.webp, 7 × 4 of 560 px, 22 used; Yoni 2026-10-10: 'this level of images'):
     an <svg> whose viewBox shows one painting, so every place that sized the old drawings keeps working */
  const PAINT = ['piano', 'organ', 'harmonium', 'violin', 'cello', 'contrabass', 'harp', 'guitar', 'guitar-electric', 'bass-electric', 'flute', 'clarinet', 'bassoon', 'saxophone', 'trumpet', 'french-horn', 'trombone', 'tuba', 'xylophone', 'drums', 'voice', 'voice-f'], PC = 560;
  function paint(inst, cls) { const i = PAINT.indexOf(inst); if (i < 0) return null; const s = svgEl(`<image href="${BASE}instruments.webp?v=4" width="${PC * 7}" height="${PC * 4}" preserveAspectRatio="none"/>`, `${(i % 7) * PC} ${Math.floor(i / 7) * PC} ${PC} ${PC}`, 'kqm-art kqm-paint kqm-' + inst + (cls ? ' ' + cls : '')); s.setAttribute('role', 'img'); s.style.borderRadius = '12px'; s.style.background = '#f4ecdb'; return s; }
  function art(inst) { return paint(inst) || svgEl((ART[inst] || ART.piano)(), '0 0 120 120', 'kqm-art kqm-' + inst); }

  // ---------- the staff: notes on five lines (treble from E4 on the bottom line, bass from G2) ----------
  const TREBLE = 'M23.6 51.4c-3.7 1.5-6.1 4.9-6.1 8.6 0 4.6 3.1 8.3 7.6 9.2l-.4-2c-2.4-.9-3.9-3.1-3.9-5.6 0-2.7 1.8-5 4.3-5.9l3.4 17.6c-1.3.4-2.7.6-4.2.6-7.9 0-13.3-5.6-13.3-12.6 0-6.6 4.5-11.6 11.2-16.2l-1.6-8.3c-1-5.2.6-11.3 4.4-14.9 2.8 3.3 3.7 8.8 2.6 13.7-.9 3.9-3.4 7.4-6.6 9.9l1.4 7.2c.9-.2 1.8-.3 2.8-.3 6.1 0 10.4 4.7 10.4 10.4 0 4.9-3 8.7-7.4 10.3l1.5 7.6c.4 2.3.5 4.7-.4 6.8-1.4 3.4-4.8 5.6-8.6 5.6-4 0-7.3-2.6-7.3-6 0-2.4 1.9-4.4 4.3-4.4s4.1 1.7 4.1 3.9c0 2-1.4 3.6-3.4 3.9 1 .8 2.4 1.2 3.7 1.1 3.5-.3 5.6-3.5 5-7l-1.5-7.5c-.9.1-1.8.2-2.8.2l-.1-.1zm2.5-.4 3.1 15.9c3-1.1 5-3.8 5-7.2 0-4.6-3.7-8.4-8.1-8.7zm-1.6-25.4c.5 3.1 1.1 6.3 1.6 9.3 2.4-2.1 4-5 4.4-8 .3-2.5-.2-5-1.4-6.7-2.4 1.1-4.2 2.8-4.6 5.4z';
  const NAT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6], ACC = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  const dia = m => Math.floor(m / 12) * 7 + NAT[((m % 12) + 12) % 12];
  /* notes: [{m, d?, color?, label?}] — d (beats) picks the note's shape: 4 whole, 2 half, 1 quarter, .5 eighth */
  function staff(notes, o) {
    o = o || {}; const bass = !!o.bass, gap = 10, top = 34, W = o.w || Math.max(180, 76 + notes.length * 42), H = 128;
    const ref = bass ? dia(43) : dia(64), yOf = m => top + 4 * gap - (dia(m) - ref) * gap / 2;
    let s = `<rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="#fffaf0"/>`;
    for (let k = 0; k < 5; k++) s += `<line x1="10" x2="${W - 10}" y1="${top + k * gap}" y2="${top + k * gap}" stroke="#3a3048" stroke-width="1.3"/>`;
    s += bass ? `<g fill="#2a2036"><path d="M20 ${top + 6}c8-6 22-4 22 10 0 12-12 22-24 28l-1-2c9-6 16-14 16-25 0-8-4-12-10-12-4 0-7 2-7 5 2-1 6 0 6 4 0 3-2 5-5 5s-5-3-5-6c0-4 3-7 8-7z"/><circle cx="48" cy="${top + 6}" r="2.2"/><circle cx="48" cy="${top + 16}" r="2.2"/></g>`
      : `<path d="${TREBLE}" transform="translate(-2 ${top - 26}) scale(1.08)" fill="#2a2036"/>`;
    notes.forEach((n, k) => {
      const x = 80 + k * 42, m = n.m, y = yOf(m), d = n.d || 1, col = n.color || '#1e1a2a', up = y > top + 2 * gap;
      for (let ly = top + 5 * gap; ly <= y + 0.1; ly += gap) s += `<line x1="${x - 11}" x2="${x + 11}" y1="${ly}" y2="${ly}" stroke="#3a3048" stroke-width="1.3"/>`;
      for (let ly = top - gap; ly >= y - 0.1; ly -= gap) s += `<line x1="${x - 11}" x2="${x + 11}" y1="${ly}" y2="${ly}" stroke="#3a3048" stroke-width="1.3"/>`;
      if (ACC[((m % 12) + 12) % 12]) s += `<text x="${x - 19}" y="${y + 5}" font-size="17" font-family="Georgia,serif" fill="${col}" text-anchor="middle">♯</text>`;
      const hollow = d >= 2; s += `<ellipse cx="${x}" cy="${y}" rx="6.6" ry="4.8" transform="rotate(-20 ${x} ${y})" fill="${hollow ? '#fffaf0' : col}" stroke="${col}" stroke-width="${hollow ? 2.2 : 1}"/>`;
      if (d < 4) { const sx = up ? x + 5.8 : x - 5.8, ey = up ? y - 34 : y + 34; s += `<line x1="${sx}" y1="${y}" x2="${sx}" y2="${ey}" stroke="${col}" stroke-width="1.8"/>`; if (d <= 0.5) s += `<path d="M${sx} ${ey} q10 ${up ? 8 : -8} 6 ${up ? 20 : -20}" fill="none" stroke="${col}" stroke-width="2.2"/>`; }
      if (d === 1.5 || d === 3) s += `<circle cx="${x + 11}" cy="${y - ((dia(m) - ref) % 2 ? 0 : 3)}" r="2" fill="${col}"/>`;
      if (n.label) s += `<text x="${x}" y="${H - 6}" font-size="12" font-weight="800" font-family="Rubik,sans-serif" fill="${col}" text-anchor="middle">${n.label}</text>`;
    });
    return svgEl(s, `0 0 ${W} ${H}`, 'kqm-staff');
  }

  window.KQMusic = { INSTR, TUNES, DRUMS, HUE, LETTERS, PAINT, load, play, release, drum, seq, stop, parse, midi, name, art, paint, staff, tuneText, ac };
})();
