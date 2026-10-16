/* Castle Chess — AI worker. Receives {id, fen, level, repKeys}, answers with the chosen move. */
importScripts('engine.js?v=10');
self.onmessage = function (e) {
  var req = e.data;
  var out = { id: req.id, move: null };
  try {
    var pos = new CastleEngine.Position(req.fen);
    var cfg = req.level === 'analysis' ? { depth: 4, timeMs: 280, qDepth: 6, jitter: 0 } : CastleEngine.levelCfg(req.level);
    var res = CastleEngine.search(pos, { depth: cfg.depth, timeMs: cfg.timeMs, qDepth: cfg.qDepth, jitter: cfg.jitter, repKeys: req.repKeys || [] });
    if (res && res.move) {
      out.move = {
        from: CastleEngine.toAlg(res.move.from),
        to: CastleEngine.toAlg(res.move.to),
        promo: res.move.promo ? CastleEngine.PIECE_CHARS[res.move.promo] : ''
      };
      out.score = res.score; out.depth = res.depth; out.nodes = res.nodes; out.ms = res.ms;
    }
  } catch (err) { out.error = String(err); }
  self.postMessage(out);
};
