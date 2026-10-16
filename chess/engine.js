/* Castle Chess engine — plain-JS chess rules plus a small alpha-beta AI.
   Runs in the page (window.CastleEngine), in a Web Worker (importScripts) and in Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CastleEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EMPTY = 0, OFF = 7;
  const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
  const WHITE = 0, BLACK = 8;
  const TYPE = p => p & 7;
  const COLOR = p => p & 8;

  const F_CAPTURE = 1, F_DOUBLE = 2, F_EP = 4, F_CASTLE_K = 8, F_CASTLE_Q = 16, F_PROMO = 32;
  const CR_WK = 1, CR_WQ = 2, CR_BK = 4, CR_BQ = 8;

  const KNIGHT_D = [-21, -19, -12, -8, 8, 12, 19, 21];
  const BISHOP_D = [-11, -9, 9, 11];
  const ROOK_D = [-10, -1, 1, 10];
  const KING_D = [-11, -10, -9, -1, 1, 9, 10, 11];
  const PROMOS = [QUEEN, ROOK, BISHOP, KNIGHT];

  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const PIECE_CHARS = { 1: 'p', 2: 'n', 3: 'b', 4: 'r', 5: 'q', 6: 'k' };
  const CHAR_PIECES = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };

  function sq(file, rank) { return 21 + rank * 10 + file; }
  function fileOf(s) { return (s % 10) - 1; }
  function rankOf(s) { return ((s / 10) | 0) - 2; }
  function toAlg(s) { return 'abcdefgh'[fileOf(s)] + (rankOf(s) + 1); }
  function fromAlg(a) { return sq(a.charCodeAt(0) - 97, a.charCodeAt(1) - 49); }

  // ---------- evaluation tables (white's view, rank 8 first) ----------
  const VAL = [0, 100, 320, 330, 500, 900, 0];
  const PST = {};
  PST[PAWN] = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0];
  PST[KNIGHT] = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50];
  PST[BISHOP] = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20];
  PST[ROOK] = [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0];
  PST[QUEEN] = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20];
  PST[KING] = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20];
  const PST_KING_END = [
    -50, -40, -30, -20, -20, -30, -40, -50,
    -30, -20, -10, 0, 0, -10, -20, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -30, 0, 0, 0, 0, -30, -30,
    -50, -30, -30, -30, -30, -30, -30, -50];
  function pstIdx(s, color) { const f = fileOf(s), r = rankOf(s); return color === WHITE ? (7 - r) * 8 + f : r * 8 + f; }

  // ---------- position ----------
  class Position {
    constructor(fen) { this.board = new Int8Array(120); this.history = []; this.load(fen || START_FEN); }

    load(fen) {
      const b = this.board; b.fill(OFF);
      for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) b[sq(f, r)] = EMPTY;
      const parts = fen.trim().split(/\s+/);
      const rows = parts[0].split('/');
      if (rows.length !== 8) throw new Error('bad fen');
      for (let i = 0; i < 8; i++) {
        const rank = 7 - i; let f = 0;
        for (const ch of rows[i]) {
          if (ch >= '1' && ch <= '8') f += +ch;
          else {
            const t = CHAR_PIECES[ch.toLowerCase()]; if (!t) throw new Error('bad fen');
            b[sq(f, rank)] = (ch === ch.toUpperCase() ? WHITE : BLACK) | t; f++;
          }
        }
      }
      this.side = parts[1] === 'b' ? BLACK : WHITE;
      this.castling = 0;
      const c = parts[2] || '-';
      if (c.indexOf('K') >= 0) this.castling |= CR_WK;
      if (c.indexOf('Q') >= 0) this.castling |= CR_WQ;
      if (c.indexOf('k') >= 0) this.castling |= CR_BK;
      if (c.indexOf('q') >= 0) this.castling |= CR_BQ;
      this.ep = (parts[3] && parts[3] !== '-') ? fromAlg(parts[3]) : -1;
      this.halfmove = parseInt(parts[4] || '0', 10) || 0;
      this.fullmove = parseInt(parts[5] || '1', 10) || 1;
      this.kingSq = [-1, -1];
      for (let s = 21; s <= 98; s++) {
        if (b[s] === (WHITE | KING)) this.kingSq[0] = s;
        else if (b[s] === (BLACK | KING)) this.kingSq[1] = s;
      }
      this.history = [];
    }

    fen() {
      let s = '';
      for (let r = 7; r >= 0; r--) {
        let e = 0;
        for (let f = 0; f < 8; f++) {
          const p = this.board[sq(f, r)];
          if (p === EMPTY) e++;
          else { if (e) { s += e; e = 0; } const ch = PIECE_CHARS[TYPE(p)]; s += COLOR(p) === WHITE ? ch.toUpperCase() : ch; }
        }
        if (e) s += e;
        if (r) s += '/';
      }
      s += this.side === WHITE ? ' w ' : ' b ';
      let c = '';
      if (this.castling & CR_WK) c += 'K';
      if (this.castling & CR_WQ) c += 'Q';
      if (this.castling & CR_BK) c += 'k';
      if (this.castling & CR_BQ) c += 'q';
      s += (c || '-') + ' ' + (this.ep >= 0 ? toAlg(this.ep) : '-') + ' ' + this.halfmove + ' ' + this.fullmove;
      return s;
    }

    key() { const f = this.fen(); return f.substring(0, f.lastIndexOf(' ', f.lastIndexOf(' ') - 1)); }

    clone() { return new Position(this.fen()); }

    get(alg) {
      const p = this.board[fromAlg(alg)];
      if (p === EMPTY || p === OFF) return null;
      return { color: COLOR(p) === WHITE ? 'w' : 'b', type: PIECE_CHARS[TYPE(p)] };
    }

    turn() { return this.side === WHITE ? 'w' : 'b'; }

    attacked(s, by) {
      const b = this.board;
      if (by === WHITE) { if (b[s - 9] === (WHITE | PAWN) || b[s - 11] === (WHITE | PAWN)) return true; }
      else { if (b[s + 9] === (BLACK | PAWN) || b[s + 11] === (BLACK | PAWN)) return true; }
      const N = by | KNIGHT, K = by | KING, B = by | BISHOP, R = by | ROOK, Q = by | QUEEN;
      for (let i = 0; i < 8; i++) {
        if (b[s + KNIGHT_D[i]] === N) return true;
        if (b[s + KING_D[i]] === K) return true;
      }
      for (let i = 0; i < 4; i++) {
        let d = BISHOP_D[i], t = s + d;
        while (b[t] === EMPTY) t += d;
        if (b[t] === B || b[t] === Q) return true;
        d = ROOK_D[i]; t = s + d;
        while (b[t] === EMPTY) t += d;
        if (b[t] === R || b[t] === Q) return true;
      }
      return false;
    }

    inCheck() { return this.attacked(this.kingSq[this.side >> 3], this.side ^ 8); }

    pseudoMoves() {
      const b = this.board, us = this.side, them = us ^ 8, moves = [];
      const push = (from, to, piece, captured, flags, promo) => moves.push({ from, to, piece, captured, flags, promo: promo || 0 });
      for (let from = 21; from <= 98; from++) {
        const p = b[from];
        if (p === EMPTY || p === OFF || COLOR(p) !== us) continue;
        const t = TYPE(p);
        if (t === PAWN) {
          const dir = us === WHITE ? 10 : -10, startRank = us === WHITE ? 1 : 6, promoRank = us === WHITE ? 7 : 0;
          const to1 = from + dir;
          if (b[to1] === EMPTY) {
            if (rankOf(to1) === promoRank) { for (let k = 0; k < 4; k++) push(from, to1, p, 0, F_PROMO, PROMOS[k]); }
            else {
              push(from, to1, p, 0, 0);
              if (rankOf(from) === startRank && b[from + 2 * dir] === EMPTY) push(from, from + 2 * dir, p, 0, F_DOUBLE);
            }
          }
          for (let k = -1; k <= 1; k += 2) {
            const to = from + dir + k, q = b[to];
            if (q !== EMPTY && q !== OFF && COLOR(q) === them) {
              if (rankOf(to) === promoRank) { for (let j = 0; j < 4; j++) push(from, to, p, q, F_CAPTURE | F_PROMO, PROMOS[j]); }
              else push(from, to, p, q, F_CAPTURE);
            } else if (to === this.ep) push(from, to, p, them | PAWN, F_CAPTURE | F_EP);
          }
        } else if (t === KNIGHT || t === KING) {
          const D = t === KNIGHT ? KNIGHT_D : KING_D;
          for (let i = 0; i < 8; i++) {
            const to = from + D[i], q = b[to];
            if (q === EMPTY) push(from, to, p, 0, 0);
            else if (q !== OFF && COLOR(q) === them) push(from, to, p, q, F_CAPTURE);
          }
          if (t === KING) this.castlingMoves(from, push);
        } else {
          const D = t === BISHOP ? BISHOP_D : t === ROOK ? ROOK_D : KING_D;
          for (let i = 0; i < D.length; i++) {
            let to = from + D[i];
            while (b[to] === EMPTY) { push(from, to, p, 0, 0); to += D[i]; }
            const q = b[to];
            if (q !== OFF && COLOR(q) === them) push(from, to, p, q, F_CAPTURE);
          }
        }
      }
      return moves;
    }

    castlingMoves(from, push) {
      const b = this.board, us = this.side, them = us ^ 8;
      if (us === WHITE) {
        if (from !== 25) return;
        if ((this.castling & CR_WK) && b[26] === EMPTY && b[27] === EMPTY && b[28] === (WHITE | ROOK) &&
          !this.attacked(25, them) && !this.attacked(26, them) && !this.attacked(27, them)) push(25, 27, WHITE | KING, 0, F_CASTLE_K);
        if ((this.castling & CR_WQ) && b[24] === EMPTY && b[23] === EMPTY && b[22] === EMPTY && b[21] === (WHITE | ROOK) &&
          !this.attacked(25, them) && !this.attacked(24, them) && !this.attacked(23, them)) push(25, 23, WHITE | KING, 0, F_CASTLE_Q);
      } else {
        if (from !== 95) return;
        if ((this.castling & CR_BK) && b[96] === EMPTY && b[97] === EMPTY && b[98] === (BLACK | ROOK) &&
          !this.attacked(95, them) && !this.attacked(96, them) && !this.attacked(97, them)) push(95, 97, BLACK | KING, 0, F_CASTLE_K);
        if ((this.castling & CR_BQ) && b[94] === EMPTY && b[93] === EMPTY && b[92] === EMPTY && b[91] === (BLACK | ROOK) &&
          !this.attacked(95, them) && !this.attacked(94, them) && !this.attacked(93, them)) push(95, 93, BLACK | KING, 0, F_CASTLE_Q);
      }
    }

    make(m) {
      const b = this.board, us = this.side, them = us ^ 8;
      this.history.push({ m, castling: this.castling, ep: this.ep, halfmove: this.halfmove });
      b[m.from] = EMPTY;
      b[m.to] = m.promo ? (us | m.promo) : m.piece;
      if (m.flags & F_EP) b[m.to - (us === WHITE ? 10 : -10)] = EMPTY;
      if (m.flags & F_CASTLE_K) { b[m.to + 1] = EMPTY; b[m.to - 1] = us | ROOK; }
      if (m.flags & F_CASTLE_Q) { b[m.to - 2] = EMPTY; b[m.to + 1] = us | ROOK; }
      if (TYPE(m.piece) === KING) {
        this.kingSq[us >> 3] = m.to;
        this.castling &= us === WHITE ? ~(CR_WK | CR_WQ) : ~(CR_BK | CR_BQ);
      }
      if (m.from === 21 || m.to === 21) this.castling &= ~CR_WQ;
      if (m.from === 28 || m.to === 28) this.castling &= ~CR_WK;
      if (m.from === 91 || m.to === 91) this.castling &= ~CR_BQ;
      if (m.from === 98 || m.to === 98) this.castling &= ~CR_BK;
      this.ep = (m.flags & F_DOUBLE) ? (m.from + m.to) / 2 : -1;
      this.halfmove = (TYPE(m.piece) === PAWN || (m.flags & F_CAPTURE)) ? 0 : this.halfmove + 1;
      if (us === BLACK) this.fullmove++;
      this.side = them;
    }

    undo() {
      const st = this.history.pop();
      if (!st) return null;
      const m = st.m, b = this.board;
      this.side ^= 8;
      const us = this.side;
      if (us === BLACK) this.fullmove--;
      this.castling = st.castling; this.ep = st.ep; this.halfmove = st.halfmove;
      b[m.from] = m.piece;
      if (m.flags & F_EP) { b[m.to] = EMPTY; b[m.to - (us === WHITE ? 10 : -10)] = m.captured; }
      else b[m.to] = m.captured;
      if (m.flags & F_CASTLE_K) { b[m.to + 1] = us | ROOK; b[m.to - 1] = EMPTY; }
      if (m.flags & F_CASTLE_Q) { b[m.to - 2] = us | ROOK; b[m.to + 1] = EMPTY; }
      if (TYPE(m.piece) === KING) this.kingSq[us >> 3] = m.from;
      return m;
    }

    legalMoves() {
      const ms = this.pseudoMoves(), out = [], us = this.side, them = us ^ 8;
      for (let i = 0; i < ms.length; i++) {
        const m = ms[i];
        this.make(m);
        if (!this.attacked(this.kingSq[us >> 3], them)) out.push(m);
        this.undo();
      }
      return out;
    }

    san(m, legal) {
      legal = legal || this.legalMoves();
      let s;
      if (m.flags & F_CASTLE_K) s = 'O-O';
      else if (m.flags & F_CASTLE_Q) s = 'O-O-O';
      else {
        const t = TYPE(m.piece);
        if (t === PAWN) s = (m.flags & F_CAPTURE) ? 'abcdefgh'[fileOf(m.from)] + 'x' : '';
        else {
          s = PIECE_CHARS[t].toUpperCase();
          const others = legal.filter(o => o.to === m.to && o.from !== m.from && TYPE(o.piece) === t);
          if (others.length) {
            const sameFile = others.some(o => fileOf(o.from) === fileOf(m.from));
            const sameRank = others.some(o => rankOf(o.from) === rankOf(m.from));
            if (!sameFile) s += 'abcdefgh'[fileOf(m.from)];
            else if (!sameRank) s += (rankOf(m.from) + 1);
            else s += toAlg(m.from);
          }
          if (m.flags & F_CAPTURE) s += 'x';
        }
        s += toAlg(m.to);
        if (m.promo) s += '=' + PIECE_CHARS[m.promo].toUpperCase();
      }
      this.make(m);
      if (this.inCheck()) s += this.legalMoves().length ? '+' : '#';
      this.undo();
      return s;
    }

    // Finds the legal move written in SAN ("Nf3", "O-O", "exd5", "e8=Q"). Returns null when no legal move matches.
    parseSan(str, legal) {
      legal = legal || this.legalMoves();
      const norm = x => x.replace(/[+#!?]/g, '').replace(/0-0-0/g, 'O-O-O').replace(/0-0/g, 'O-O');
      const want = norm(str.trim());
      for (const m of legal) if (norm(this.san(m, legal)) === want) return m;
      return null;
    }

    insufficientMaterial() {
      const b = this.board; let minors = 0, bishops = [];
      for (let s = 21; s <= 98; s++) {
        const p = b[s]; if (p === EMPTY || p === OFF) continue;
        const t = TYPE(p);
        if (t === PAWN || t === ROOK || t === QUEEN) return false;
        if (t === KNIGHT) minors++;
        if (t === BISHOP) { minors++; bishops.push({ c: COLOR(p), sqColor: (fileOf(s) + rankOf(s)) & 1 }); }
      }
      if (minors <= 1) return true;
      if (minors === 2 && bishops.length === 2 && bishops[0].c !== bishops[1].c && bishops[0].sqColor === bishops[1].sqColor) return true;
      return false;
    }

    // keys: list of position keys seen in the game so far (including the current one), for threefold repetition
    status(keys) {
      const legal = this.legalMoves();
      const check = this.inCheck();
      if (!legal.length) return check ? { over: true, result: 'checkmate', winner: this.side === WHITE ? 'b' : 'w', legal } : { over: true, result: 'stalemate', legal };
      if (this.halfmove >= 100) return { over: true, result: 'fifty', legal };
      if (this.insufficientMaterial()) return { over: true, result: 'material', legal };
      if (keys) { const k = this.key(); let n = 0; for (const x of keys) if (x === k) n++; if (n >= 3) return { over: true, result: 'repetition', legal }; }
      return { over: false, check, legal };
    }

    evaluate(jitter) {
      const b = this.board; let score = 0, nonPawn = 0;
      for (let s = 21; s <= 98; s++) {
        const p = b[s]; if (p === EMPTY || p === OFF) continue;
        const t = TYPE(p), c = COLOR(p);
        if (t === KING) continue;
        const v = VAL[t] + PST[t][pstIdx(s, c)];
        if (t !== PAWN) nonPawn += VAL[t];
        score += c === WHITE ? v : -v;
      }
      const endgame = nonPawn <= 1300;
      const kt = endgame ? PST_KING_END : PST[KING];
      score += kt[pstIdx(this.kingSq[0], WHITE)];
      score -= kt[pstIdx(this.kingSq[1], BLACK)];
      if (jitter) score += (Math.random() * 2 - 1) * jitter;
      return this.side === WHITE ? score : -score;
    }
  }

  // ---------- search ----------
  const MATE = 100000, INF = 1e9;
  /* The computer's levels: 18 small steps, measured by playing the levels against each other (2026-10-11, Yoni: 'Squire is much harder
     than Page'). Each step beats the one below it about 60–80% of the time (the top steps are blends; see below). The lowest steps mix in Page-style blunders (mix = the
     chance a move is chosen by `weak`); seeing captures (qDepth) was the big cliff, so it arrives gradually. Six named tiers of three. */
  const PAGE = { depth: 1, timeMs: 300, qDepth: 0, jitter: 150 };
  const SEES = { depth: 1, timeMs: 300, qDepth: 2, jitter: 150 };
  const D5 = { depth: 5, timeMs: 1800, qDepth: 8, jitter: 0 }, D6 = { depth: 6, timeMs: 2400, qDepth: 10, jitter: 0 };
  const LEVELS = {
    1: PAGE,
    2: Object.assign({}, SEES, { mix: 0.7, weak: PAGE }),
    3: Object.assign({}, SEES, { mix: 0.5, weak: PAGE }),
    4: Object.assign({}, SEES, { mix: 0.3, weak: PAGE }),
    5: Object.assign({}, SEES, { mix: 0.15, weak: PAGE }),
    6: SEES,
    7: { depth: 1, timeMs: 300, qDepth: 2, jitter: 90 },
    8: { depth: 2, timeMs: 600, qDepth: 2, jitter: 150 },
    9: { depth: 2, timeMs: 600, qDepth: 2, jitter: 100 },
    10: { depth: 2, timeMs: 600, qDepth: 2, jitter: 60 },
    11: { depth: 2, timeMs: 600, qDepth: 4, jitter: 50 },
    12: { depth: 2, timeMs: 600, qDepth: 6, jitter: 30 },
    13: { depth: 3, timeMs: 900, qDepth: 6, jitter: 40 },
    14: { depth: 3, timeMs: 900, qDepth: 6, jitter: 10 },
    15: { depth: 4, timeMs: 1300, qDepth: 8, jitter: 0 },
    16: D5,
    17: Object.assign({}, D6, { mix: 0.5, weak: D5 }),
    18: D6
  };   /* the top: one ply deeper wins ~96% (measured), so Dragon 2 blends the two; depth 7 and 9 were dropped (unbeatable and slow on phones) */
  const LEVEL_MAX = 18, HINT_LEVEL = 14;
  /* the settings for ONE move at a level (a mixed level decides move by move) */
  function levelCfg(level) { const c = LEVELS[level] || LEVELS[10]; return c.mix && Math.random() < c.mix ? c.weak : c; }

  function search(pos, opts) {
    opts = opts || {};
    const maxDepth = opts.depth || 3, timeMs = opts.timeMs || 1000;
    const qDepth = opts.qDepth == null ? 6 : opts.qDepth, jitter = opts.jitter || 0;
    const repKeys = opts.repKeys || [];
    const start = Date.now(), deadline = start + timeMs;
    let nodes = 0, aborted = false;
    const tick = () => { nodes++; if ((nodes & 1023) === 0 && Date.now() > deadline) aborted = true; };
    const order = moves => {
      for (const m of moves) m.s = (m.flags & F_CAPTURE ? 10000 + VAL[TYPE(m.captured)] * 10 - VAL[TYPE(m.piece)] / 10 : 0) + (m.promo ? 9000 : 0);
      moves.sort((a, b) => b.s - a.s);
      return moves;
    };
    function quiesce(alpha, beta, qd) {
      tick(); if (aborted) return 0;
      const stand = pos.evaluate(jitter);
      if (stand >= beta) return beta;
      if (alpha < stand) alpha = stand;
      if (qd <= 0) return alpha;
      const moves = order(pos.legalMoves().filter(m => m.flags & F_CAPTURE));
      for (const m of moves) {
        pos.make(m); const sc = -quiesce(-beta, -alpha, qd - 1); pos.undo();
        if (aborted) return 0;
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    function negamax(depth, alpha, beta, ply) {
      tick(); if (aborted) return 0;
      if (pos.halfmove >= 100) return 0;
      const check = pos.inCheck();
      if (depth <= 0 && !check) return quiesce(alpha, beta, qDepth);
      const moves = pos.legalMoves();
      if (!moves.length) return check ? -MATE + ply : 0;
      order(moves);
      let best = -INF;
      for (const m of moves) {
        pos.make(m); const sc = -negamax(depth - 1, -beta, -alpha, ply + 1); pos.undo();
        if (aborted) return 0;
        if (sc > best) best = sc;
        if (sc > alpha) alpha = sc;
        if (alpha >= beta) break;
      }
      return best;
    }
    const root = pos.legalMoves();
    if (!root.length) return null;
    order(root);
    let result = null;
    for (let d = 1; d <= maxDepth; d++) {
      let alpha = -INF, bestM = null, bestS = -INF; const scored = [];
      for (const m of root) {
        pos.make(m);
        let reps = 0;
        if (repKeys.length) { const k = pos.key(); for (const x of repKeys) if (x === k) reps++; }
        let sc;
        if (reps >= 2) sc = 0;
        else { sc = -negamax(d - 1, -INF, -alpha, 1); if (reps === 1 && sc > 0) sc -= 25; }
        pos.undo();
        if (aborted) break;
        scored.push({ m, sc });
        if (sc > bestS) { bestS = sc; bestM = m; }
        if (sc > alpha) alpha = sc;
      }
      if (aborted) break;
      scored.sort((a, b) => b.sc - a.sc);
      root.splice(0, root.length, ...scored.map(x => x.m));
      result = { move: bestM, score: bestS, depth: d, nodes };
      if (Math.abs(bestS) >= MATE - 1000) break;
      if (Date.now() - start > timeMs * 0.4) break;
    }
    if (!result) result = { move: root[0], score: 0, depth: 0, nodes };
    result.nodes = nodes;
    result.ms = Date.now() - start;
    return result;
  }

  function perft(pos, depth) {
    if (depth === 0) return 1;
    const ms = pos.legalMoves();
    if (depth === 1) return ms.length;
    let n = 0;
    for (const m of ms) { pos.make(m); n += perft(pos, depth - 1); pos.undo(); }
    return n;
  }

  return {
    Position, search, perft, LEVELS, LEVEL_MAX, HINT_LEVEL, levelCfg, START_FEN,
    EMPTY, OFF, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, WHITE, BLACK, TYPE, COLOR,
    F_CAPTURE, F_DOUBLE, F_EP, F_CASTLE_K, F_CASTLE_Q, F_PROMO,
    PIECE_CHARS, VAL, toAlg, fromAlg, MATE
  };
});
