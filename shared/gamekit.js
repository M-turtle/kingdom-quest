/* Kingdom Quest — the kit every arcade game plays with (shared/arcade.js). One look for all of them: an instruction plaque carried by
   the camera (the room's banner only follows camera moves, and the games turn their cameras), a gold action button with a '?' for a
   reminder, a number pad (digits, a point, a fraction bar, a minus sign — whatever the question needs), a tray of big tiles (letters,
   cards), and room-time helpers. A stage makes one kit per visit: const K = KQKit.make(c) (c = the rooms3d stage context), calls
   K.mount(api) in play(), and K.dispose() in its own dispose(). The look matches the Doll Studio (same classes). */
(function () {
  'use strict';
  if (!window.THREE) return;
  const T = THREE, PI = Math.PI;
  (function css() { if (document.getElementById('kq-kit-css')) return; const st = document.createElement('style'); st.id = 'kq-kit-css'; st.textContent = `
.sd-ui{position:absolute; inset:0; z-index:6; pointer-events:none; font-family:var(--font-body, Rubik, sans-serif)}
.sd-bar{position:absolute; left:50%; bottom:calc(18px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); display:flex; gap:10px; align-items:center; pointer-events:auto}
.sd-bar .btn{font-size:clamp(16px,2.2vw,20px); padding:12px 22px; min-width:120px; box-shadow:0 8px 22px rgba(0,0,0,.28)} .sd-bar .btn[hidden]{display:none}
.sd-bar .sd-help{min-width:0; width:48px; height:48px; padding:0; border-radius:50%; font:900 24px var(--font-body, Rubik, sans-serif); color:#3a1a44; background:rgba(255,250,236,.95); border:2px solid var(--gold-2, #d8b04a)}
.sd-pad{position:absolute; right:18px; bottom:calc(90px + env(safe-area-inset-bottom,0px)); width:228px; padding:12px; border-radius:20px; pointer-events:auto; background:rgba(28,22,44,.72); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); box-shadow:inset 0 0 0 1px rgba(255,220,150,.4), 0 14px 34px rgba(0,0,0,.35)}
.sd-pad[hidden]{display:none} .sd-pad .sd-disp{direction:ltr; display:flex; align-items:baseline; justify-content:center; gap:8px; height:54px; margin-bottom:10px; border-radius:12px; background:#fffaf0; color:#2a1a30; font:900 34px var(--font-body, Rubik, sans-serif); box-shadow:inset 0 2px 6px rgba(0,0,0,.18)}
.sd-pad .sd-disp small{font-size:18px; color:#7a6a80} .sd-pad .sd-disp b{min-width:1ch} .sd-pad .sd-disp b:empty::before{content:'?'; color:#c9bccf}
.sd-pad .sd-keys{direction:ltr; display:grid; grid-template-columns:repeat(3,1fr); gap:8px} .sd-pad button{height:48px; border:0; border-radius:12px; background:#fff3dc; color:#2a1a30; font:900 22px var(--font-body, Rubik, sans-serif); cursor:pointer; box-shadow:0 3px 0 #d8b98a} .sd-pad button:active{transform:translateY(2px); box-shadow:0 1px 0 #d8b98a}
.sd-pad .sd-ok{grid-column:1 / -1; background:linear-gradient(180deg,#ffe08a,#f2b84a); box-shadow:0 3px 0 #b8862a} .sd-pad button[hidden]{display:none}
.sd-pad.bad .sd-disp{animation:sdShake .35s} @keyframes sdShake{25%{transform:translateX(-6px)} 75%{transform:translateX(6px)}}
.kk-tray{position:absolute; left:50%; bottom:calc(84px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); display:flex; flex-wrap:wrap; justify-content:center; gap:8px; max-width:min(720px,94vw); pointer-events:auto}
.kk-tray[hidden]{display:none} .kk-tray button{min-width:54px; height:58px; padding:0 12px; border:0; border-radius:14px; background:linear-gradient(180deg,#fffaf0,#ffe9c4); color:#2a1a30; font:900 28px var(--font-body, Rubik, sans-serif); cursor:pointer; box-shadow:0 4px 0 #c8a068, 0 8px 18px rgba(0,0,0,.25)}
.kk-tray button:active{transform:translateY(3px); box-shadow:0 1px 0 #c8a068} .kk-tray button.used{opacity:.3; pointer-events:none} .kk-tray button .kq-i{width:34px; height:34px; vertical-align:middle}
@media (max-width:760px){ .sd-pad{left:50%; right:auto; transform:translateX(-50%); bottom:calc(84px + env(safe-area-inset-bottom,0px)); width:min(330px,92vw); padding:10px} .sd-pad .sd-keys{grid-template-columns:repeat(6,1fr); gap:6px} .sd-pad button{height:44px; font-size:20px} .sd-pad .sd-ok{grid-column:auto / span 2} .sd-pad .sd-disp{height:46px; font-size:28px; margin-bottom:8px} .sd-bar .btn{padding:11px 18px; min-width:104px} .kk-tray button{min-width:46px; height:52px; font-size:24px} }
`; document.head.appendChild(st); })();

  function make(c, o) { o = o || {}; const { scene, FX } = c;
    const K = { dead: false, api: null, hintFn: null, readyFn: null, padKey: null, pointer: null, t: k => KQ.t(k), narrow: () => (c.camera.aspect || 1.5) < 1.05 };
    /* ---- the plaque: the room's banner look, carried by the camera ---- */
    const plq = FX.plaque({ w: 9.6, h: 2.7, face: c.P.face, accent: c.P.accent, max: 0.42, lines: 3 }); plq.visible = false; scene.add(plq); let pop = 1; const v3 = new T.Vector3();
    c.updaters.push(() => { if (!plq.visible) return; const cam = c.camera, d = 12, th = Math.tan(cam.fov * PI / 360), vh = 2 * th * d, vw = vh * cam.aspect, nar = cam.aspect < 1.05, s = Math.min(1.05, vw * (nar ? 0.95 : 0.52) / 9.9) * pop; plq.scale.setScalar(Math.max(0.001, s));
      v3.set(0, vh / 2 - 1.5 * s - vh * (nar ? 0.085 : 0.045), -d).applyQuaternion(cam.quaternion).add(cam.position); plq.position.copy(v3); plq.quaternion.copy(cam.quaternion); });
    K.tell = (k, t) => { plq.visible = true; plq.userData.plaque.set(k || '', t || '', null); pop = 0.001; c.tween(0.45, q => { pop = Math.max(0.001, c.over(q)); }, () => { pop = 1; }); };
    K.hideTell = () => { plq.visible = false; };
    /* ---- time (room time: everything pauses with the room) ---- */
    K.alive = () => !K.dead;
    K.wait = s => new Promise(r => c.tween(s, () => {}, r));
    K.anim = (dur, fn, delay) => new Promise(r => c.tween(dur, fn, r, delay));
    K.ease = k => k * k * (3 - 2 * k);
    K.glide = (obj, to, dur, h, rot) => { const a = obj.position.clone(), q0 = obj.quaternion.clone(), q1 = rot ? new T.Quaternion().setFromEuler(rot) : null; return K.anim(dur, k => { const e = K.ease(k); obj.position.lerpVectors(a, to, e); obj.position.y += Math.sin(PI * k) * (h || 0); if (q1) obj.quaternion.slerpQuaternions(q0, q1, e); }); };
    /* ---- the pointer: stages set K.pointer = { down(p, e), move(p, e), up(e), plane: y } (p = the point on that horizontal plane, or the ray) ---- */
    const ray = new T.Raycaster(), ndc = new T.Vector2(), hp = new T.Vector3(); ray.camera = c.camera; let cv = null;
    K.aim = e => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)); ray.setFromCamera(ndc, c.camera); return ray; };
    K.onPlane = (e, y, nrm) => { K.aim(e); const pl = new T.Plane(nrm || new T.Vector3(0, 1, 0), -(y || 0)); return ray.ray.intersectPlane(pl, hp) ? hp.clone() : null; };
    K.hit = (e, objs) => { K.aim(e); return ray.intersectObjects(objs, true)[0] || null; };
    const down = e => { if (K.dead || !K.pointer || !K.pointer.down) return; if (K.pointer.down(e) && cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch (x) {} };
    const move = e => { if (K.dead || !K.pointer) return; if (K.pointer.move) K.pointer.move(e); cv.style.cursor = K.pointer.cursor ? K.pointer.cursor(e) : 'default'; };
    const up = e => { if (K.dead || !K.pointer || !K.pointer.up) return; K.pointer.up(e); };
    /* ---- the DOM layer: the action button and '?', the number pad, the tray ---- */
    let ui = null; const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
    const onKey = e => { if (K.padKey) K.padKey(e); };
    K.mount = api => { K.api = api; cv = c.renderer.domElement; const host = cv.parentNode && cv.parentNode.parentNode; if (!host || ui) return; ui = { root: el('div', 'sd-ui') }; host.appendChild(ui.root);
      ui.bar = el('div', 'sd-bar'); ui.help = el('button', 'btn ghost sd-help', '?'); ui.help.type = 'button'; ui.help.hidden = true; ui.help.onclick = () => { if (K.hintFn) { K.sfx('tap'); K.hintFn(); } };
      ui.main = el('button', 'btn gold'); ui.main.type = 'button'; ui.main.hidden = true; ui.bar.append(ui.help, ui.main); ui.root.appendChild(ui.bar);
      ui.tray = el('div', 'kk-tray'); ui.tray.hidden = true; ui.root.appendChild(ui.tray);
      ui.pad = el('div', 'sd-pad'); ui.pad.hidden = true; const disp = el('div', 'sd-disp'); ui.val = el('b'); ui.unit = el('small'); disp.append(ui.val, ui.unit); ui.keys = el('div', 'sd-keys'); ui.pad.append(disp, ui.keys); ui.root.appendChild(ui.pad);
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫', '/', '-']) { const b = el('button', null, k === '-' ? '−' : k); b.type = 'button'; b.dataset.k = k; ui.keys.appendChild(b); } ui.ok = el('button', 'sd-ok', '✓'); ui.ok.type = 'button'; ui.keys.appendChild(ui.ok);
      cv.style.touchAction = 'none'; cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); document.addEventListener('keydown', onKey); };
    K.sfx = k => { if (K.api && K.api.sfx) K.api.sfx(k); };
    K.hint = f => { K.hintFn = f; if (ui) ui.help.hidden = !f; };
    /* the action button: resolves when pressed; { wait: true } keeps it grey until K.ready() */
    K.act = (label, op) => new Promise(res => { if (!ui || K.dead) return; if (K.skipping) { res(); return; } op = op || {}; const b = ui.main; b.textContent = label; b.hidden = false; b.disabled = !!op.wait; K.readyFn = () => { b.disabled = false; };
      K.skipAct = () => { b.onclick = null; b.hidden = true; K.readyFn = null; K.skipAct = null; res(); };
      b.onclick = () => { if (b.disabled) return; b.onclick = null; b.hidden = true; K.readyFn = null; K.skipAct = null; K.sfx('tap'); res(); }; });
    /* a game's opening (greeting, how-to, Start): the first visit plays it; a returning player gets a Skip that runs straight through it */
    K.intro = async fn => { const I = window.KQ && KQ.intro, id = K.api && K.api.id ? 'game:' + K.api.id : null; K.skipping = false;
      if (I && id && I.seen(id)) I.offer(() => { K.skipping = true; if (K.skipAct) K.skipAct(); });
      try { await fn(); } finally { K.skipping = false; if (I) { I.clear(); if (id && !K.dead) I.mark(id); } } };
    K.ready = () => { if (K.readyFn) K.readyFn(); };
    K.cancelAct = () => { if (ui) { ui.main.hidden = true; ui.main.onclick = null; } K.readyFn = null; };
    /* the number pad: op = { dp: decimals, frac: a fraction bar, neg: a minus sign, unit } — resolves with the typed text (the stage parses it) */
    K.pad = op => new Promise(res => { if (!ui || K.dead) return; op = op || {}; let s = ''; ui.pad.hidden = false; ui.pad.classList.remove('bad'); ui.val.textContent = ''; ui.unit.textContent = op.unit || '';
      const key = k => ui.keys.querySelector('[data-k="' + k + '"]'); key('.').hidden = !op.dp; key('/').hidden = !op.frac; key('-').hidden = !op.neg;
      ui.keys.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b === ui.ok) { if (!s || /[./-]$/.test(s)) return; ui.keys.onclick = null; ui.pad.hidden = true; K.padKey = null; res(s); return; }
        const k = b.dataset.k; if (k === '⌫') s = s.slice(0, -1); else if (k === '.') { if (op.dp && !/\.\d*$/.test(s) && !s.includes('/')) s = (s && !/-$/.test(s) ? s : s + '0') + '.'; } else if (k === '/') { if (op.frac && s && !s.includes('/') && !s.includes('.') && !/-$/.test(s)) s += '/'; } else if (k === '-') { if (op.neg && !s) s = '-'; } else if (s.replace(/[^0-9]/g, '').length < 5) s = (s === '0' ? '' : s) + k;
        ui.val.textContent = s.replace('-', '−'); };
      K.padKey = e => { if (ui.pad.hidden) return; const k = e.key === 'Backspace' ? '⌫' : e.key === 'Enter' ? 'ok' : e.key; const b = k === 'ok' ? ui.ok : key(k); if (b && !b.hidden) b.click(); }; });
    K.padBad = () => { if (ui) { ui.pad.classList.remove('bad'); void ui.pad.offsetWidth; ui.pad.classList.add('bad'); } };
    /* the tray: big tiles (letters, cards); onTap(i) for each; K.tray(null) hides it */
    K.tray = (items, onTap) => { if (!ui) return []; ui.tray.replaceChildren(); if (!items) { ui.tray.hidden = true; return []; } ui.tray.hidden = false;
      return items.map((it, i) => { const b = el('button'); b.type = 'button'; if (it.icon && KQ.icon) { const ic = KQ.icon(it.icon); if (ic) b.appendChild(ic); } if (it.text != null) b.appendChild(document.createTextNode(it.text)); if (it.label) b.setAttribute('aria-label', it.label); b.onclick = () => { K.sfx('tap'); onTap(i, b); }; ui.tray.appendChild(b); return b; }); };
    K.dispose = () => { K.dead = true; K.pointer = null; if (window.KQ && KQ.intro) KQ.intro.clear(); document.removeEventListener('keydown', onKey); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); if (ui && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root); ui = null; try { plq.userData.plaque.dispose(); } catch (e) {} };
    return K; }

  /* numbers as the games show them: whole, decimal (point), fraction (a/b), negative (the true minus sign) */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
  const fmtNum = (v, as) => { if (as && as.den) { const n = Math.round(v * as.den), g = gcd(n, as.den); const nn = n / g, dd = as.den / g; return dd === 1 ? String(nn).replace('-', '−') : ((nn < 0 ? '−' : '') + Math.abs(nn) + '/' + dd); } const r = Math.round(v * 1000) / 1000; return String(r).replace('-', '−'); };
  const parseNum = s => { s = String(s).trim().replace('−', '-'); if (/^-?\d+\/\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return b ? a / b : NaN; } return parseFloat(s); };
  window.KQKit = { make, fmtNum, parseNum, gcd };
})();
