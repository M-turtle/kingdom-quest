/* Castle Chess — opening recognition. Longest matching prefix of the game's moves names the opening. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CASTLE_OPENING_DB = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const raw = [
    ['kings_pawn', "King's Pawn Opening", 'e4'],
    ['queens_pawn', "Queen's Pawn Opening", 'd4'],
    ['english', 'English Opening', 'c4'],
    ['reti', 'Réti Opening', 'Nf3'],
    ['bird', "Bird's Opening", 'f4'],
    ['larsen', "Larsen's Opening", 'b3'],
    ['grob', "Grob's Attack", 'g4'],
    ['open_game', 'Open Game', 'e4 e5'],
    ['sicilian', 'Sicilian Defense', 'e4 c5'],
    ['french', 'French Defense', 'e4 e6'],
    ['carokann', 'Caro-Kann Defense', 'e4 c6'],
    ['scandinavian', 'Scandinavian Defense', 'e4 d5'],
    ['pirc', 'Pirc Defense', 'e4 d6 d4 Nf6 Nc3 g6'],
    ['modern', 'Modern Defense', 'e4 g6'],
    ['alekhine', "Alekhine's Defense", 'e4 Nf6'],
    ['owen', "Owen's Defense", 'e4 b6'],
    ['nimzowitsch', 'Nimzowitsch Defense', 'e4 Nc6'],
    ['italian', 'Italian Game', 'e4 e5 Nf3 Nc6 Bc4'],
    ['giuoco', 'Italian Game: Giuoco Piano', 'e4 e5 Nf3 Nc6 Bc4 Bc5'],
    ['evans', 'Italian Game: Evans Gambit', 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4'],
    ['two_knights', 'Italian Game: Two Knights Defense', 'e4 e5 Nf3 Nc6 Bc4 Nf6'],
    ['fried_liver', 'Two Knights: Fried Liver Attack', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7'],
    ['hungarian', 'Italian Game: Hungarian Defense', 'e4 e5 Nf3 Nc6 Bc4 Be7'],
    ['ruy_lopez', 'Ruy López (Spanish Game)', 'e4 e5 Nf3 Nc6 Bb5'],
    ['ruy_morphy', 'Ruy López: Morphy Defense', 'e4 e5 Nf3 Nc6 Bb5 a6'],
    ['ruy_exchange', 'Ruy López: Exchange Variation', 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6'],
    ['ruy_closed', 'Ruy López: Closed Variation', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7'],
    ['ruy_berlin', 'Ruy López: Berlin Defense', 'e4 e5 Nf3 Nc6 Bb5 Nf6'],
    ['scotch', 'Scotch Game', 'e4 e5 Nf3 Nc6 d4'],
    ['four_knights', 'Four Knights Game', 'e4 e5 Nf3 Nc6 Nc3 Nf6'],
    ['halloween', 'Four Knights: Halloween Gambit', 'e4 e5 Nf3 Nc6 Nc3 Nf6 Nxe5'],
    ['ponziani', 'Ponziani Opening', 'e4 e5 Nf3 Nc6 c3'],
    ['petrov', "Petrov's Defense", 'e4 e5 Nf3 Nf6'],
    ['stafford', "Petrov's Defense: Stafford Gambit", 'e4 e5 Nf3 Nf6 Nxe5 Nc6'],
    ['philidor', 'Philidor Defense', 'e4 e5 Nf3 d6'],
    ['elephant', 'Elephant Gambit', 'e4 e5 Nf3 d5'],
    ['latvian', 'Latvian Gambit', 'e4 e5 Nf3 f5'],
    ['kings_gambit', "King's Gambit", 'e4 e5 f4'],
    ['kga', "King's Gambit Accepted", 'e4 e5 f4 exf4'],
    ['vienna', 'Vienna Game', 'e4 e5 Nc3'],
    ['bishops', "Bishop's Opening", 'e4 e5 Bc4'],
    ['scholar_attack', "Scholar's Mate Attack", 'e4 e5 Bc4 Nc6 Qh5'],
    ['wayward_queen', 'Wayward Queen Attack', 'e4 e5 Qh5'],
    ['bongcloud', 'Bongcloud Attack', 'e4 e5 Ke2'],
    ['center_game', 'Center Game', 'e4 e5 d4 exd4'],
    ['danish', 'Danish Gambit', 'e4 e5 d4 exd4 c3'],
    ['sicilian_open', 'Sicilian Defense: Open Sicilian', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4'],
    ['najdorf', 'Sicilian Defense: Najdorf Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6'],
    ['dragon', 'Sicilian Defense: Dragon Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6'],
    ['sicilian_classical', 'Sicilian Defense: Classical Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6'],
    ['scheveningen', 'Sicilian Defense: Scheveningen Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6'],
    ['accel_dragon', 'Sicilian Defense: Accelerated Dragon', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6'],
    ['sveshnikov', 'Sicilian Defense: Sveshnikov Variation', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5'],
    ['taimanov', 'Sicilian Defense: Taimanov Variation', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6'],
    ['kan', 'Sicilian Defense: Kan Variation', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6'],
    ['alapin', 'Sicilian Defense: Alapin Variation', 'e4 c5 c3'],
    ['closed_sicilian', 'Sicilian Defense: Closed Sicilian', 'e4 c5 Nc3'],
    ['grand_prix', 'Sicilian Defense: Grand Prix Attack', 'e4 c5 Nc3 Nc6 f4'],
    ['smith_morra', 'Sicilian Defense: Smith-Morra Gambit', 'e4 c5 d4 cxd4 c3'],
    ['rossolimo', 'Sicilian Defense: Rossolimo Variation', 'e4 c5 Nf3 Nc6 Bb5'],
    ['moscow', 'Sicilian Defense: Moscow Variation', 'e4 c5 Nf3 d6 Bb5+'],
    ['french_advance', 'French Defense: Advance Variation', 'e4 e6 d4 d5 e5'],
    ['french_exchange', 'French Defense: Exchange Variation', 'e4 e6 d4 d5 exd5'],
    ['winawer', 'French Defense: Winawer Variation', 'e4 e6 d4 d5 Nc3 Bb4'],
    ['french_classical', 'French Defense: Classical Variation', 'e4 e6 d4 d5 Nc3 Nf6'],
    ['tarrasch', 'French Defense: Tarrasch Variation', 'e4 e6 d4 d5 Nd2'],
    ['ck_advance', 'Caro-Kann: Advance Variation', 'e4 c6 d4 d5 e5'],
    ['ck_classical', 'Caro-Kann: Classical Variation', 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5'],
    ['ck_exchange', 'Caro-Kann: Exchange Variation', 'e4 c6 d4 d5 exd5'],
    ['scandi_main', 'Scandinavian Defense: Main Line', 'e4 d5 exd5 Qxd5 Nc3 Qa5'],
    ['scandi_modern', 'Scandinavian Defense: Modern Variation', 'e4 d5 exd5 Nf6'],
    ['queens_gambit', "Queen's Gambit", 'd4 d5 c4'],
    ['qga', "Queen's Gambit Accepted", 'd4 d5 c4 dxc4'],
    ['qgd', "Queen's Gambit Declined", 'd4 d5 c4 e6'],
    ['slav', 'Slav Defense', 'd4 d5 c4 c6'],
    ['semi_slav', 'Semi-Slav Defense', 'd4 d5 c4 c6 Nc3 Nf6 Nf3 e6'],
    ['albin', 'Albin Countergambit', 'd4 d5 c4 e5'],
    ['london', 'London System', 'd4 d5 Bf4'],
    ['london_nf6', 'London System', 'd4 Nf6 Bf4'],
    ['colle', 'Colle System', 'd4 d5 Nf3 Nf6 e3'],
    ['trompowsky', 'Trompowsky Attack', 'd4 Nf6 Bg5'],
    ['torre', 'Torre Attack', 'd4 Nf6 Nf3 e6 Bg5'],
    ['kid', "King's Indian Defense", 'd4 Nf6 c4 g6'],
    ['grunfeld', 'Grünfeld Defense', 'd4 Nf6 c4 g6 Nc3 d5'],
    ['nimzo', 'Nimzo-Indian Defense', 'd4 Nf6 c4 e6 Nc3 Bb4'],
    ['queens_indian', "Queen's Indian Defense", 'd4 Nf6 c4 e6 Nf3 b6'],
    ['bogo', 'Bogo-Indian Defense', 'd4 Nf6 c4 e6 Nf3 Bb4+'],
    ['catalan', 'Catalan Opening', 'd4 Nf6 c4 e6 g3'],
    ['benoni', 'Benoni Defense', 'd4 Nf6 c4 c5 d5'],
    ['benko', 'Benko Gambit', 'd4 Nf6 c4 c5 d5 b5'],
    ['budapest', 'Budapest Gambit', 'd4 Nf6 c4 e5'],
    ['dutch', 'Dutch Defense', 'd4 f5'],
    ['englund', 'Englund Gambit', 'd4 e5'],
    ['english_sym', 'English Opening: Symmetrical', 'c4 c5'],
    ['english_rev', 'English Opening: Reversed Sicilian', 'c4 e5'],
    ['kia', "King's Indian Attack", 'Nf3 d5 g3']
  ];
  const list = raw.map(r => ({ key: r[0], name: r[1], moves: r[2].split(' ') }));
  const norm = s => s.replace(/[+#!?]/g, '');
  // Returns the entry with the longest move list that is a prefix of the game's SAN list, or null.
  function detect(sans) {
    const game = sans.map(norm); let best = null;
    for (const op of list) {
      if (op.moves.length > game.length || (best && op.moves.length < best.moves.length)) continue;
      let ok = true;
      for (let i = 0; i < op.moves.length; i++) if (norm(op.moves[i]) !== game[i]) { ok = false; break; }
      if (ok) best = op;
    }
    return best;
  }
  return { list, detect };
});
