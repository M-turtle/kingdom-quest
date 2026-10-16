/* Castle Chess — every line the Herald can say, keyed by a stable id.
   The ids name the pre-rendered voice files (voices/<id>.mp3). Opening intros and tips are derived from openings.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CASTLE_LINES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const lines = {};
  const add = (prefix, arr) => arr.map((text, i) => { const id = prefix + '_' + String(i + 1).padStart(2, '0'); lines[id] = text; return id; });
  const groups = {
    start: add('start', ['Hear ye, hear ye! Let the battle begin!', 'Once upon a time, in a kingdom far, far away, two armies met on a checkered field.', 'Knights, to your horses! Towers, stand tall!', 'Ready your armies. The kingdom awaits a champion!']),
    capture: add('cap', [
      'Veni, vidi, vici! I came, I saw, I captured!', 'Off with their head!', "I'll be back!", 'Hasta la vista, baby!',
      'To infinity... and beyond!', 'Houston, we have a problem.', 'Elementary, my dear Watson.', 'May the fork be with you.',
      'One small step for a pawn, one giant leap for the kingdom!', 'Do, or do not. There is no try.',
      'Float like a butterfly, sting like a bishop!', 'You shall not pass!', 'Winter is coming... for your king.',
      'Cowabunga, dude!', 'Yabba dabba doo!', 'Great Scott!', 'Hakuna matata! No worries... for me.',
      'We shall never surrender!', 'Et tu, Bishop?', 'Nobody puts Bishop in a corner!', 'Why so serious? It was just a pawn.',
      'Nom nom nom. Delicious.', "That's gotta hurt!", 'Oops! Did I do that?', 'Bazinga!', "It's a trap!",
      'Live long and prosper... except you.', 'Keep calm and carry on... without that piece.', 'Alea iacta est! The die is cast!',
      'Ask not what your pawns can do for you...', 'The kingdom strikes back!', 'Run, Forrest, run!', 'Say hello to my little pawn!',
      "There's no place like home... too bad you can't go back.", 'This is Sparta!', 'I am your father... and I just took your piece.'
    ]),
    piece_p: add('piece_p', ['A pawn has fallen! Somebody call the pawn shop.', "Just a pawn. Don't cry.", 'Pawn down! Pawn down!', 'That pawn had a family, you know.', 'Pawn today, gone tomorrow.']),
    piece_n: add('piece_n', ['The horse has left the stable!', 'Neigh... no more.', 'Knight night!', 'Somebody call the vet!', 'That knight just got unhorsed!']),
    piece_b: add('piece_b', ['The bishop has been excommunicated!', 'Bishop? More like bye-shop!', 'Hope the bishop said his prayers.', 'The bishop is off to a long, long retreat.']),
    piece_r: add('piece_r', ['The tower has fallen!', 'Rook, line, and sinker!', 'Castle... crumbled.', 'One less tower to clean.', 'Timber! There goes the rook.']),
    piece_q: add('piece_q', ['Her Majesty is down! Call the royal doctor!', 'The queen has left the building!', 'Long live the... oh, never mind.', 'Off with HER head!', 'The queen is captured! Somebody grab the crown jewels!']),
    check: add('check', ['Check! Your Majesty, run!', 'Check, please!', 'Uh oh! The king is in trouble!', 'Check! Somebody protect the king!', 'Knock knock. Who is there? CHECK.', 'Check! The castle walls are shaking!']),
    mate: add('mate', ['Checkmate! The king is dead, long live the king!', 'Checkmate! Game over, man, game over!', "Checkmate! That's all, folks!", 'Checkmate! Ring the bells and raise the banners!']),
    draw: add('draw', ["It's a draw! Nobody wins, nobody loses. Tea time!", 'A draw! Both kingdoms live to fight another day.', 'Draw! Shake hands, brave warriors.']),
    stalemate: add('stalemate', ['Stalemate! The king cannot move, but he is not in check. A draw!']),
    castle: add('castle', ['The king is hiding in the castle!', 'Castle! Safe and sound.', 'The king and the rook swap places. Sneaky!', 'Castling! The drawbridge is up.']),
    promote: add('promote', ['A pawn became a queen! Cinderella story!', 'Promotion! From zero to hero!', 'The little pawn grew up. Look at it now!']),
    notbook: add('notbook', ['Not the book move! Follow the glowing squares.', 'Hmm, the book says otherwise. Try the golden arrow!', 'Close, but the book move is glowing. Give it a go!']),
    undo: add('undo', ['Time travel! The move is undone.', 'Take-back accepted, brave knight.', 'The chronicle has been rewritten.']),
    hint: add('hint', ['The wise old wizard whispers: try the green arrow.', 'Psst... the green arrow looks strong.', 'A little bird says: green arrow!']),
    win_you: add('win_you', ['Victory! You conquered the kingdom, champion!', 'The crown is yours! Well played, my liege.']),
    win_cpu: add('win_cpu', ['The computer wins this battle. Sharpen your sword and try again!', 'Defeated... this time. Every great knight loses a few battles.']),
    win_white: add('win_white', ['White conquers the kingdom!']),
    win_black: add('win_black', ['Black conquers the kingdom!']),
    bookdone: add('bookdone', ['The book is closed. Now it is all up to you, champion!']),
    free: add('free', ['Free play! The book is closed. Use your own clever brain.']),
    hello: add('hello', ['The Herald is at your service!']),
    followarrow: add('followarrow', ['Follow the golden arrow. That is the book move!'])
  };
  function openingLines(openings) {
    const out = {};
    for (const op of openings || []) {
      out['op_' + op.id] = op.name + '. ' + op.desc;
      for (const k of Object.keys(op.tips || {})) out['tip_' + op.id + '_' + k] = op.tips[k];
    }
    return out;
  }
  const TEMPLATES = ['Aha! The {n}!', 'Behold: the {n}!', 'Ooh, the {n}. A classic!', 'The {n}! Famous moves, well played.', 'I know this one! The {n}!'];
  function announcementLines(db) {
    const out = {};
    (db && db.list || []).forEach((op, i) => { out['opn_' + op.key] = TEMPLATES[i % TEMPLATES.length].replace('{n}', op.name); });
    return out;
  }
  function allLines(openings, db) { return Object.assign({}, lines, openingLines(openings), announcementLines(db)); }
  return { lines, groups, openingLines, announcementLines, allLines };
});
