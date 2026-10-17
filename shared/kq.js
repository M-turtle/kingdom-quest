/* Kingdom Quest — shared runtime: profiles, unified scoreboard, badges, skill tracking (what each kid finds hard),
   treasure economy (coins, gems, potions, collectibles), i18n (EN / everyday gender-neutral HE), sounds, speech, common UI.
   Loaded by the hub and by every world. State lives in localStorage under one key so the worlds share it. */
(function () {
  'use strict';
  const KEY = 'kq.state.v1';
  /* FULL RESET (Yoni 2026-09-29: 'reset it all, remove all users, remove all data, remove all history'): once per device, before anything
     is read — every player, all progress, results, journals, eggs, mixes, the parent PIN, the chess scores and settings. Nothing is kept.
     A new WIPE value would reset again; leave it as is unless another full reset is asked for. */
  (function wipe() { const WIPE = '2026-09-29-full'; try { if (localStorage.getItem('kq.wipe') === WIPE) return;
    for (const k of Object.keys(localStorage)) if (/^(kq[._]|castle-chess)/.test(k)) localStorage.removeItem(k);
    for (const k of Object.keys(sessionStorage)) if (/^kq[._]/.test(k)) sessionStorage.removeItem(k);
    localStorage.setItem('kq.wipe', WIPE); } catch (e) {} })();
  const HEROES = ['h:knight', 'h:wizard', 'h:princess', 'h:ranger', 'h:bard', 'h:paladin', 'h:necromancer', 'h:druid', 'h:berserker', 'h:rogue', 'h:cleric', 'h:warlock', 'h:monk', 'h:summoner', 'h:alchemist', 'h:icemage', 'h:firemage', 'h:timemage', 'h:shadowdancer', 'h:dragonrider'];   // RPG classes (shared/heroes.webp), the first choice for every age
  const AVATARS = HEROES.concat(['🦁', '🐉', '🦊', '🐺', '🦄', '🐯', '🐻', '🦅', '🐸', '🐧', '🦖', '🐼', '🦋', '🐙', '🦈', '🐲']);
  const WORLDS = ['math', 'reading', 'chess'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const svgEl = (tag, attrs) => { const e = document.createElementNS(SVG_NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const KQ_BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');   /* the shared/ folder, for files loaded on demand */
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  // ---------- state ----------
  const DEFAULT = { lang: '', profiles: [], activeId: null, settings: { sfx: true, voice: false, music: true }, results: [], skills: {}, inv: {}, active: {} };
  let state = JSON.parse(JSON.stringify(DEFAULT));
  try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); state = Object.assign(state, o); state.settings = Object.assign({}, DEFAULT.settings, o.settings || {}); for (const k of ['profiles', 'results']) if (!Array.isArray(state[k])) state[k] = []; for (const k of ['skills', 'inv', 'active']) if (!state[k] || typeof state[k] !== 'object') state[k] = {}; } } catch (e) {}
  if (!state.lang) state.lang = 'he';   /* Yoni 2026-10-17: Hebrew first, unless changed to English */
  /* Yoni 2026-10-17: every player picks a language at sign-up and the whole interface stays in it, on every page, until they change it in
     Settings. The active player's language wins over the device's; a player made before this keeps the language they were using. */
  { const ap = state.profiles.find(p => p.id === state.activeId) || state.profiles[0]; if (ap) { if (ap.lang !== 'he' && ap.lang !== 'en') ap.lang = state.lang; state.lang = ap.lang; } }
  const save = () => { try { if (window.KQ && KQ.cloud) KQ.cloud.schedule(); } catch (e) {} for (let k = 0; k < 4; k++) { try { localStorage.setItem(KEY, JSON.stringify(state)); return; } catch (e) { if (!state.results || state.results.length < 50) return; state.results = state.results.slice(Math.floor(state.results.length / 3)); } } };   /* a full storage used to drop every save in silence: now the oldest third of the round history goes first, never the progress */

  // ---------- i18n (Hebrew: everyday, plural/neutral forms — never assume the player's gender) ----------
  const dict = {
    en: {
      br_en: 'English', br_he: 'Hebrew', br_title: '{lang} bridge', br_sub: 'One short lesson opens level {n}.', br_learn: 'First, meet the words', br_ready: "I'm ready", br_q_pic: 'Which word is this in {lang}?', br_q_w1w2: 'How do you say "{w}" in {lang}?', br_q_w2w1: 'What does "{w}" mean?', br_q_listen: 'Listen. Which picture is it?', br_q_blank: 'Fill the gap in {lang}:', br_q_sent: 'Read it, then answer:', br_q_syn: 'Which {lang} word means the same as "{w}"?', br_q_ant: 'Which {lang} word means the opposite of "{w}"?', br_pass: 'Level {n} is open! Your {lang} grows with you.', br_fail: '{k} of 5. Look at the words once more and try again.', br_retry: 'Try again', br_later: 'Later', br_continue: 'Continue', br_btn: '{lang} lesson → open level {n}', br_need: 'One {lang} lesson opens level {n}.', br_start: 'Start the {lang} lesson', 
      g_assisted: 'Lots of long pauses or time away this round, so it does not move the ladder. One more round on your own does.', g_down: 'That was hard twice in a row, so the next round is one level easier (level {l}).', g_bandDown: 'Two hard rounds: the next round moves to an easier stage ({b}).', g_slow: 'All right, but slowly: the level waits until the answers come quicker.', g_rollback: 'The last big jump did not hold this time, so that level waits for you again. Practice makes it stick.', g_confirmed: 'Confirmed: you did it again, so it was no fluke.', g_provisional: 'A big jump! Show it again next round to lock the level in.', g_provisionalNew: 'Great start! Do it again next round to lock the level in.', g_hinted: 'You leaned on the help cards a lot this round. Try the next one on your own to move up.', g_fasttrack: 'Perfect, quick and on your own: you skip ahead a level.', g_bandHeld: 'Ten levels done. To move up, make these secure:', g_status_new: '🌱 New', g_status_learning: '🌱 Learning', g_status_practicing: '🔁 Practicing', g_status_confirming: '🔍 Confirming', g_status_secure: '✅ Secure', g_status_stretch: '🚀 Ready to stretch', g_timeEasy: 'You answered much faster than usual: harder questions are coming.', g_timeHard: 'These made you think hard. That is how you grow.', g_timeRight: 'Your thinking time is right in the growing zone.', g_title: 'Growth detector', g_sub: 'Mastery counts only when it is steady: enough answers to be sure, on at least two separate visits, without help, and not slowing down.', g_conf: '{p}% sure', g_visits: 'visits: {n}', g_faster: '{p}% faster', g_slower: '{p}% slower', g_help: 'help noticed {p}%', g_none: 'Play a few rounds and the growth detector starts learning.', 
      r_meadow: 'The Meadow', r_pirate: 'The Pirate Cove', r_skull: 'The Skull Catacombs', gt_above: 'The kingdoms above', gt_under: 'The underworld', gt_ride: 'Hold on tight!', gt_ride_pirate: 'Hold on tight! The whirlpool is pulling the ship down…', gt_ride_skull: 'Shhh… the crypt door is opening…', gt_up_pirate: 'The sea lifts the ship back to the light…', gt_up_skull: 'Up the stairs, back to the light…', r_sky: 'The Sky Isles', r_cloud: 'The Cloud Kingdom', r_ocean: 'The Sky Ocean', r_fashion: 'The Fashion Kingdom', r_sports: 'The Sports Kingdom', r_space: 'Space', r_lift_space: 'A little harder', gt_ride_space: '3, 2, 1… lift-off!', gt_up_space: 'Back to Earth!', rk_name: 'The Rocket', rk_blurb: 'Fly up through the sky to space', rk_home_name: 'The Rocket Home', rk_home_blurb: 'Fly back down to the meadow', r_harder: '{n} steps harder', r_harder1: 'One step harder', r_lift_sky: 'A little harder', r_lift_cloud: 'A bit harder still', r_lift_ocean: 'Harder', r_lift_fashion: 'A little harder', r_lift_sports: 'A little harder', r_lift_pirate: 'A real challenge', r_lift_skull: 'The biggest challenge', r_here: 'You are here',
      hero_knight: 'Knight', ht_knight: 'Guardian of the Realm', hero_wizard: 'Wizard', ht_wizard: 'Master of Arcane Arts', hero_princess: 'Princess', ht_princess: 'Heir to the Golden Throne', hero_ranger: 'Ranger', ht_ranger: 'Eye of the Forest', hero_bard: 'Bard', ht_bard: 'Voice of a Thousand Tales', hero_paladin: 'Paladin', ht_paladin: 'Champion of Holy Light', hero_necromancer: 'Necromancer', ht_necromancer: 'Caller of Spirits', hero_druid: 'Druid', ht_druid: 'Keeper of the Wild', hero_berserker: 'Berserker', ht_berserker: 'Fury of the Battlefield', hero_rogue: 'Rogue', ht_rogue: 'Shadow in the Night', hero_cleric: 'Cleric', ht_cleric: 'Hand of Mercy', hero_warlock: 'Warlock', ht_warlock: 'Pact of the Dark Beyond', hero_monk: 'Monk', ht_monk: 'Fist of Inner Peace', hero_summoner: 'Summoner', ht_summoner: 'Master of Many Beasts', hero_alchemist: 'Alchemist', ht_alchemist: 'Brewer of Wonders', hero_icemage: 'Ice Mage', ht_icemage: 'Blizzard Incarnate', hero_firemage: 'Fire Mage', ht_firemage: 'Flame Without Mercy', hero_timemage: 'Time Mage', ht_timemage: 'Bender of Hours', hero_shadowdancer: 'Shadow Dancer', ht_shadowdancer: 'Dancer in Darkness', hero_dragonrider: 'Dragon Rider', ht_dragonrider: 'Sky Lord of Embers',
      forgeTitle: 'Avatar Forge', forgeSub: 'Slide a creature and a fruit into the window, then forge them together', forgeAnimal: 'Creature', forgeFruit: 'Fruit', forgeGo: 'Forge it!', forgeWorking: 'The forge is painting…', forgeLocked: 'Complete a level to earn a visit to the forge', forgeFull: 'You already have {n} forged avatars — the maximum', forgeCredits: '{n} forge visits left', forgeOffline: 'The forge needs the studio relay to be connected', forgeUse: 'Use this avatar', forgeFail: 'The forge misfired — try again', forgeBtn: '🧪 Avatar Forge', forgeOwned: 'Already in your collection — tap to wear it', forgeWear: 'Wear it', forgeKeep: 'Keep it!', forgePull: '🎰 Surprise me', forgedTitle: 'Forged in the Avatar Forge', fc_cat: 'Cat', fc_dog: 'Pup', fc_fox: 'Fox', fc_owl: 'Owl', fc_dragon: 'Dragon', fc_bunny: 'Bunny', fc_panda: 'Panda', fc_tiger: 'Tiger', ff_apple: 'Apple', ff_banana: 'Banana', ff_strawberry: 'Strawberry', ff_pineapple: 'Pineapple', ff_grapes: 'Grape', ff_watermelon: 'Watermelon',
      memory: 'Memory Cave', music: 'Music Hall', art: 'Art Studio', nature: 'Nature Trail', explore: 'World Explorer', timemachine: 'Time Machine', kindness: 'Heart Garden', clock: 'Clock Tower', market: 'Coin Market', spelling: 'Spelling Bee', logic: 'Logic Gate', story: 'Story Forge', chooseGame: 'Choose a game', q_answered: '{n} answered',
      app: 'Kingdom Quest', tag: 'Math, reading and chess for clever kids', whoPlays: "Who's playing?", addPlayer: 'Add a player', name: 'Name', namePh: 'What is your name?', chooseAvatar: 'Choose your creature', save: 'Save', cancel: 'Cancel', remove: 'Remove player', confirmRemove: 'Remove this player and their scores?',
      play: 'Play', back: 'Back', home: 'Home', md_quiet: 'Quiet', md_quiet_place: 'The Quiet Clearing', md_quiet_blurb: 'A willow over a still pond. Sit, breathe and rest for as long as you like.', start: 'Start', next: 'Next', again: 'Play again', done: 'Done', settings: 'Settings', sound: 'Sound effects', voice: 'Read aloud', music: 'Music', language: 'Language', close: 'Close', soon: 'Coming soon',
      worlds: 'Choose your world', math: 'Math Tower', mathBlurb: 'Count, add, multiply and conquer the tower.', reading: 'Word Garden', readingBlurb: 'Letters, words and stories that bloom.', chess: 'Castle Chess', chessBlurb: 'Battle in the great hall with the Royal Herald.',
      scoreboard: 'Scoreboard', yourCastle: "{name}'s castle", stars: 'Stars', points: 'Points', badges: 'Badges', streak: 'Streak', days: 'days', level: 'Level', round: 'Round', rounds: 'Rounds', best: 'Best', total: 'Total', family: 'Family leaderboard', recent: 'Recent adventures', noResults: 'No adventures yet. Pick a world!', noPlayers: 'Add a player to begin.', player: 'Player', today: 'Today', pickPlayer: 'Choose who is playing first.',
      reportTitle: 'Report card', correct: 'Correct', accuracy: 'Accuracy', speed: 'Speed', bestStreak: 'Best streak', earned: 'Points earned', newBadge: 'New badge: {name}!', castleUp: 'Your castle grew!',
      fb_ok: 'Correct. Your method works.|Right. You checked it step by step.|Correct. Careful work pays off.|That is it. You kept going and worked it out.|Correct. You used a good strategy.|Right. You read the question closely.', fb_okHint: 'Correct. Using the hint was a smart move.|Right. Asking how it works is exactly what strong learners do.', fb_okFast: 'Correct, and quick, because you know this well now.|Right away. This one is becoming automatic for you.', fb_proved: 'Correct, and you showed the path. That is real understanding.|Right, and you explained the step. That is how it sticks.', fb_bad: 'Not yet. The answer is {a}. Let us look at why.', fb_badNoAns: 'Not yet. Let us look at it together.|Not this time. One more look.', fb_grow: 'A mistake means your brain is working on something new.|Errors are where learning happens. Try the next one.|You found the tricky part. That is useful.', fb_steady: '{n} in a row. Steady, careful work.', rp_effort: 'You worked through {n} questions and got {c} right.', rp_fixed: 'Tricky ones you met and worked through: {m}.', rp_steady: 'Your longest run of careful answers was {n}.', rp_better: 'Last time {a}/{b}, now {c}/{n}. You are improving.', rp_same: 'Last time {a}/{b}, now {c}/{n}. Just as steady.', rp_dip: 'Last time {a}/{b}, now {c}/{n}. Harder questions today, and you kept going.', great: 'Great job!', good: 'Well done!', keepGoing: 'Keep going!', tryAgain: 'Try again!', yes: 'Yes!', notQuite: 'Not quite. The answer is {a}.',
      castle0: 'Meadow', castle1: 'Campfire', castle2: 'Hut', castle3: 'Cottage', castle4: 'Watchtower', castle5: 'Keep', castle6: 'Castle', castle7: 'Fortress', castle8: 'Citadel', castle9: 'Kingdom',
      b_first: 'First quest', b_math100: 'Math wizard', b_read50: 'Word gardener', b_chesswin: 'Checkmate!', b_chess5: 'Grandmaster kid', b_streak3: 'On a roll', b_perfect: 'Perfect round', b_allworlds: 'Explorer', b_stars50: 'Star collector', b_speed: 'Lightning fast', b_thinker: 'Deep thinker', b_collector: 'Treasure hunter',
      ageBand: 'Your level', band1: 'Page', band2: 'Squire', band3: 'Knight', band4: 'Baron', band5: 'Duke', band6: 'Monarch', ladderLevel: 'Level {l} of {n}', ladderUnlocked: 'Level {l} unlocked!', ladderNeed: 'Earn 2 stars to unlock the next level', ladderDone: 'All {n} levels complete', ladderBandUp: 'All {n} levels climbed! Onward to {name}', ladderOnward: 'Next age group', eggTitle: 'Hatched from a secret egg', egg_rose: 'Rose Bunny', egg_sunflower: 'Sunflower Bunny', egg_tulip: 'Tulip Bunny', eggFound: '🥚 You found a secret egg!', eggHint: 'Beat the Sage\'s challenge to hatch it: one hard round at the top level, no hints.', eggGo: 'Take the challenge', eggHatched: 'This egg has already hatched', eggChallenge: 'Secret egg challenge', eggWin: 'The egg hatched!', eggLose: 'Not this time. Find the egg again to retry.',
      guest: 'Guest', pickOpponent: 'Family player or guest', kingdomEarned: 'Kingdom Quest', wins: 'Wins', won: 'Won', lost: 'Lost', draw: 'Draw', perfectBonus: 'Perfect round bonus',
      skip: 'Skip', howTo: 'How?', letsSee: "Let's see how it works", nextStep: 'Next step', tryAlike: 'Try one like it', gotIt: 'Got it!', showMe: 'Show me', workingOn: 'Working on', mastered: 'Mastered', focus: 'Practice the tricky bits', focusEmpty: 'Play a few rounds and the castle will find what to practice.', hintCost: 'Hints cost a little', hintUsed: 'Hint used',
      coins: 'Coins', gems: 'Gems', chest: 'Treasure chest', market: 'Potion market', buy: 'Buy', use: 'Use', ready: 'Ready for the next round', potionOn: '{name} is active!', found: 'You found: {name}!', collection: 'Collection', notEnough: 'Not enough coins yet', rarity_common: 'Common', rarity_rare: 'Rare', rarity_epic: 'Legendary', potions: 'Potions', noPotions: 'No potions yet. Earn coins and visit the market.', earnedCoins: 'Coins earned', doubled: 'Double potion: points ×2',
      p_double: 'Double potion', p_double_d: 'Double points for one round', p_shield: 'Streak shield', p_shield_d: 'One mistake will not break your streak', p_hint: 'Hint lantern', p_hint_d: 'Hints are free for one round', p_time: 'Time charm', p_time_d: 'Speed bonus on every correct answer',
      tg_add: 'adding', tg_sub: 'taking away', tg_bridge10: 'adding past 10', tg_within10: 'adding within 10', tg_countback: 'counting back', tg_countup: 'counting up', tg_missing: 'missing numbers', tg_double: 'doubles', tg_tens: 'tens', tg_carry: 'carrying a ten', tg_nocarry: 'adding columns', tg_borrow: 'borrowing a ten', tg_noborrow: 'subtracting columns', tg_times: 'times tables', tg_div: 'dividing', tg_half: 'halves', tg_quarter: 'quarters', tg_round: 'rounding', tg_pattern: 'number patterns', tg_count: 'counting', tg_compare: 'comparing', tg_bigtimes: 'big multiplication', tg_area: 'two-digit times', tg_remainder: 'leftovers', tg_fraccmp: 'comparing fractions', tg_order: 'order of operations', tg_word: 'word problems', tg_wordadd: 'adding stories', tg_wordsub: 'taking-away stories', tg_wordmul: 'multiplying stories', tg_worddiv: 'sharing stories', tg_finals: 'final letters', tg_case: 'big & small letters', tg_first: 'first letters', tg_words: 'picking words', tg_spell: 'spelling', tg_listen: 'listening', tg_sentence: 'reading stories', tg_blank: 'filling blanks',
      journal: 'Learning journal', j_recent: 'Recent mistakes', j_none: 'No mistakes logged yet. That is either brilliant or brand new.', j_focus: 'Tricky right now', j_help: 'Extra help is on for: {tags}', j_given: 'answered', levelUp: 'Level up!', welcomeTo: 'Welcome to the {name}!', streakBonus: 'Streak bonus!', nextStage: '{n} ★ to the {name}', topStage: 'Highest level reached!', tapToContinue: 'Tap to continue', sw_title: 'Who is playing?', sw_add: 'New player', tix_new: 'A new avatar mix is ready! Open the Avatar Lab in the menu.', tour_step: 'On the path to Mount Glory: {d} of {n} games done', tour_done: 'Every game done! Sign Mount Glory and mix a new avatar!', skip: 'Skip', faster: 'Short ride', slower: 'Full ride',
      i_key: 'Old key', i_feather: 'Phoenix feather', i_mushroom: 'Glow mushroom', i_shell: 'Sea shell', i_log: 'Oak log', i_candle: 'Wax candle', i_apple: 'Golden apple', i_thread: 'Silver thread', i_sword: "Knight's sword", i_map: 'Treasure map', i_compass: 'Star compass', i_lantern: 'Fairy lantern', i_scroll: 'Ancient scroll', i_crown: 'Royal crown', i_crystal: 'Crystal ball', i_dragon: 'Dragon egg'
    },
    he: {
      br_en: 'אנגלית', br_he: 'עברית', br_title: 'גשר {lang}', br_sub: 'שיעור קצר אחד פותח את שלב {n}.', br_learn: 'קודם, מכירים את המילים', br_ready: 'אפשר להתחיל', br_q_pic: 'איזו מילה זו ב{lang}?', br_q_w1w2: 'איך אומרים "{w}" ב{lang}?', br_q_w2w1: 'מה פירוש "{w}"?', br_q_listen: 'הקשיבו. איזו תמונה זו?', br_q_blank: 'השלימו את החסר ב{lang}:', br_q_sent: 'קראו, ואז ענו:', br_q_syn: 'איזו מילה ב{lang} דומה במשמעות ל-"{w}"?', br_q_ant: 'איזו מילה ב{lang} היא ההפך מ-"{w}"?', br_pass: 'שלב {n} פתוח! גם ה{lang} שלכם גדלה.', br_fail: '{k} מתוך 5. מסתכלים שוב על המילים ומנסים שוב.', br_retry: 'לנסות שוב', br_later: 'אחר כך', br_continue: 'להמשיך', br_btn: 'שיעור {lang} ← פותח את שלב {n}', br_need: 'שיעור {lang} אחד פותח את שלב {n}.', br_start: 'להתחיל את שיעור ה{lang}', 
      g_assisted: 'היו בסבב הרבה הפסקות ארוכות או יציאות מהמסך, לכן הוא לא מקדם בסולם. סבב אחד לבד כן יקדם.', g_down: 'היה קשה פעמיים ברצף, אז הסבב הבא קל יותר ברמה אחת (רמה {l}).', g_bandDown: 'שני סבבים קשים: הסבב הבא עובר לשלב קל יותר ({b}).', g_slow: 'הכול נכון, אבל לאט: הרמה מחכה עד שהתשובות יגיעו מהר יותר.', g_rollback: 'הקפיצה הגדולה לא החזיקה הפעם, אז השלב מחכה לכם שוב. תרגול מקבע.', g_confirmed: 'אושר: עשיתם את זה שוב, זה לא היה מקרה.', g_provisional: 'קפיצה גדולה! תראו את זה שוב בסבב הבא כדי לנעול את השלב.', g_provisionalNew: 'התחלה מצוינת! עשו את זה שוב בסבב הבא כדי לנעול את השלב.', g_hinted: 'נעזרתם הרבה בכרטיסי העזרה בסבב הזה. נסו את הבא לבד כדי לעלות.', g_fasttrack: 'מושלם, מהיר ולבד: מדלגים שלב קדימה.', g_bandHeld: 'עשרה שלבים הושלמו. כדי לעלות, צריך לבסס את אלה:', g_status_new: '🌱 חדש', g_status_learning: '🌱 לומדים', g_status_practicing: '🔁 מתרגלים', g_status_confirming: '🔍 מאמתים', g_status_secure: '✅ מבוסס', g_status_stretch: '🚀 מוכנים לאתגר', g_timeEasy: 'עניתם הרבה יותר מהר מהרגיל: שאלות קשות יותר בדרך.', g_timeHard: 'השאלות האלה גרמו לכם לחשוב חזק. ככה גדלים.', g_timeRight: 'זמן החשיבה שלכם בדיוק באזור הצמיחה.', g_title: 'גלאי הצמיחה', g_sub: 'שליטה נחשבת רק כשהיא יציבה: מספיק תשובות כדי להיות בטוחים, בשני ביקורים נפרדים לפחות, בלי עזרה ובלי האטה.', g_conf: '{p}% ודאות', g_visits: 'ביקורים: {n}', g_faster: '{p}% מהר יותר', g_slower: '{p}% לאט יותר', g_help: 'עזרה זוהתה {p}%', g_none: 'שחקו כמה סבבים וגלאי הצמיחה יתחיל ללמוד.', 
      r_meadow: 'האחו', r_pirate: 'מפרץ השודדים', r_skull: 'מערות הגולגולות', gt_above: 'הממלכות שלמעלה', gt_under: 'העולם התחתון', gt_ride: 'תחזיקו חזק!', gt_ride_pirate: 'תחזיקו חזק! המערבולת מושכת את הספינה למטה…', gt_ride_skull: 'ששש… דלת הקבר נפתחת…', gt_up_pirate: 'הים מרים את הספינה בחזרה אל האור…', gt_up_skull: 'במעלה המדרגות, בחזרה אל האור…', r_sky: 'איי השמיים', r_cloud: 'ממלכת העננים', r_ocean: 'אוקיינוס השמיים', r_fashion: 'ממלכת האופנה', r_sports: 'ממלכת הספורט', r_space: 'החלל', r_lift_space: 'קצת יותר קשה', gt_ride_space: '3, 2, 1… המראה!', gt_up_space: 'חוזרים לכדור הארץ!', rk_name: 'הטיל', rk_blurb: 'טסים דרך השמיים עד לחלל', rk_home_name: 'הטיל הביתה', rk_home_blurb: 'טסים בחזרה אל האחו', r_harder: 'קשה יותר ב-{n} דרגות', r_harder1: 'קשה יותר בדרגה אחת', r_lift_sky: 'קצת יותר קשה', r_lift_cloud: 'עוד קצת יותר קשה', r_lift_ocean: 'קשה יותר', r_lift_fashion: 'קצת יותר קשה', r_lift_sports: 'קצת יותר קשה', r_lift_pirate: 'אתגר אמיתי', r_lift_skull: 'האתגר הגדול ביותר', r_here: 'אתם כאן',
      hero_knight: 'אביר', ht_knight: 'שומר הממלכה', hero_wizard: 'קוסם', ht_wizard: 'אמן הכישוף', hero_princess: 'נסיכה', ht_princess: 'יורשת כס הזהב', hero_ranger: 'סיירת', ht_ranger: 'עין היער', hero_bard: 'פייטן', ht_bard: 'קול אלף הסיפורים', hero_paladin: 'פלאדין', ht_paladin: 'אלוף האור הקדוש', hero_necromancer: 'מכשף רוחות', ht_necromancer: 'קורא לרוחות', hero_druid: 'דרואידית', ht_druid: 'שומרת הפרא', hero_berserker: 'ברסרקר', ht_berserker: 'זעם שדה הקרב', hero_rogue: 'נוכלת', ht_rogue: 'צל בלילה', hero_cleric: 'מרפאת', ht_cleric: 'יד הרחמים', hero_warlock: 'וורלוק', ht_warlock: 'ברית האופל', hero_monk: 'נזיר', ht_monk: 'אגרוף השלווה', hero_summoner: 'מזמנת', ht_summoner: 'אדונית החיות', hero_alchemist: 'אלכימאית', ht_alchemist: 'רוקחת הפלאים', hero_icemage: 'קוסמת קרח', ht_icemage: 'סופת השלגים', hero_firemage: 'קוסם אש', ht_firemage: 'להבה ללא רחמים', hero_timemage: 'קוסמת זמן', ht_timemage: 'מכופפת השעות', hero_shadowdancer: 'רקדן צללים', ht_shadowdancer: 'רוקד בחשכה', hero_dragonrider: 'רוכב דרקונים', ht_dragonrider: 'אדון שמי הגחלים',
      forgeTitle: 'נפחיית הדמויות', forgeSub: 'מחליקים יצור ופרי לתוך החלון, ואז מחשלים אותם יחד', forgeAnimal: 'יצור', forgeFruit: 'פרי', forgeGo: 'לחשל!', forgeWorking: 'הנפחייה מציירת…', forgeLocked: 'משלימים שלב כדי לזכות בביקור בנפחייה', forgeFull: 'כבר יש לכם {n} דמויות מחושלות — זה המקסימום', forgeCredits: 'נשארו {n} ביקורים בנפחייה', forgeOffline: 'הנפחייה צריכה חיבור לממסר האולפן', forgeUse: 'לבחור את הדמות הזאת', forgeFail: 'הנפחייה נכשלה — נסו שוב', forgeBtn: '🧪 נפחיית הדמויות', forgeOwned: 'כבר באוסף שלכם — נוגעים כדי ללבוש', forgeWear: 'ללבוש', forgeKeep: 'לשמור!', forgePull: '🎰 הפתיעו אותי', forgedTitle: 'חושל בנפחיית הדמויות', fc_cat: 'חתול', fc_dog: 'כלבלב', fc_fox: 'שועל', fc_owl: 'ינשוף', fc_dragon: 'דרקון', fc_bunny: 'ארנב', fc_panda: 'פנדה', fc_tiger: 'נמר', ff_apple: 'תפוח', ff_banana: 'בננה', ff_strawberry: 'תות', ff_pineapple: 'אננס', ff_grapes: 'ענבים', ff_watermelon: 'אבטיח',
      memory: 'מערת הזיכרון', music: 'אולם המוזיקה', art: 'סטודיו האמנות', nature: 'שביל הטבע', explore: 'מגלי העולם', timemachine: 'מכונת הזמן', kindness: 'גן הלב', clock: 'מגדל השעון', market: 'שוק המטבעות', spelling: 'כוורת האיות', logic: 'שער ההיגיון', story: 'נפחיית הסיפורים', chooseGame: 'בחרו משחק', q_answered: '{n} תשובות',
      app: 'מסע הממלכה', tag: 'חשבון, קריאה ושחמט לילדים חכמים', whoPlays: 'מי משחקים?', addPlayer: 'הוספת דמות', name: 'שם', namePh: 'איך קוראים לך?', chooseAvatar: 'בחרו יצור', save: 'שמירה', cancel: 'ביטול', remove: 'מחיקת הדמות', confirmRemove: 'למחוק את הדמות ואת כל התוצאות שלה?',
      play: 'משחק', back: 'חזרה', home: 'בית', md_quiet: 'שקט', md_quiet_place: 'הקרחת השקטה', md_quiet_blurb: 'ערבה מעל בריכה שקטה. יושבים, נושמים ונחים כמה שרוצים.', start: 'התחלה', next: 'הבא', again: 'עוד פעם', done: 'סיום', settings: 'הגדרות', sound: 'צלילים', voice: 'הקראה', music: 'מוזיקה', language: 'שפה', close: 'סגירה', soon: 'בקרוב',
      worlds: 'בחרו עולם', math: 'מגדל החשבון', mathBlurb: 'לספור, לחבר, לכפול ולכבוש את המגדל.', reading: 'גן המילים', readingBlurb: 'אותיות, מילים וסיפורים שפורחים.', chess: 'שחמט הטירה', chessBlurb: 'קרב באולם הגדול עם הכרוז המלכותי.',
      scoreboard: 'לוח התוצאות', yourCastle: 'הטירה של {name}', stars: 'כוכבים', points: 'נקודות', badges: 'עיטורים', streak: 'רצף', days: 'ימים', level: 'רמה', round: 'סיבוב', rounds: 'סיבובים', best: 'שיא', total: 'סך הכול', family: 'טבלת המשפחה', recent: 'הרפתקאות אחרונות', noResults: 'עוד אין הרפתקאות. בחרו עולם!', noPlayers: 'הוסיפו דמות כדי להתחיל.', player: 'דמות', today: 'היום', pickPlayer: 'קודם בוחרים דמות.',
      reportTitle: 'תעודה', correct: 'נכון', accuracy: 'דיוק', speed: 'מהירות', bestStreak: 'רצף שיא', earned: 'נקודות שנצברו', newBadge: 'עיטור חדש: {name}!', castleUp: 'הטירה שלכם גדלה!',
      fb_ok: 'נכון. השיטה שלך עובדת.|נכון. בדקת שלב אחרי שלב.|נכון. עבודה זהירה משתלמת.|זהו. המשכת ופתרת.|נכון. השתמשת באסטרטגיה טובה.|נכון. קראת את השאלה בעיון.', fb_okHint: 'נכון. להשתמש ברמז היה מהלך חכם.|נכון. לשאול איך זה עובד זה בדיוק מה שלומדים חזקים עושים.', fb_okFast: 'נכון, ומהר, כי את/ה כבר יודע/ת את זה היטב.|מיד. זה נהיה אוטומטי אצלך.', fb_proved: 'נכון, והראית את הדרך. זו הבנה אמיתית.|נכון, והסברת את השלב. ככה זה נשאר.', fb_bad: 'עוד לא. התשובה היא {a}. בואו נראה למה.', fb_badNoAns: 'עוד לא. בואו נסתכל יחד.|לא הפעם. עוד מבט אחד.', fb_grow: 'טעות אומרת שהמוח עובד על משהו חדש.|טעויות הן המקום שבו לומדים. ממשיכים לבאה.|מצאת את החלק המסובך. זה שימושי.', fb_steady: '{n} ברצף. עבודה יציבה וזהירה.', rp_effort: 'עברת על {n} שאלות וענית נכון על {c}.', rp_fixed: 'פגשת {m} שאלות מסובכות וראית איך הן עובדות.', rp_steady: 'הרצף הארוך ביותר של תשובות זהירות היה {n}.', rp_better: 'בפעם הקודמת {a}/{b}, עכשיו {c}/{n}. יש שיפור.', rp_same: 'בפעם הקודמת {a}/{b}, עכשיו {c}/{n}. יציב בדיוק כמו קודם.', rp_dip: 'בפעם הקודמת {a}/{b}, עכשיו {c}/{n}. שאלות קשות יותר היום, והמשכת.', great: 'כל הכבוד!', good: 'יפה מאוד!', keepGoing: 'ממשיכים!', tryAgain: 'עוד ניסיון!', yes: 'נכון!', notQuite: 'לא בדיוק. התשובה היא {a}.',
      castle0: 'אחו', castle1: 'מדורה', castle2: 'בקתה', castle3: 'בית', castle4: 'מגדל שמירה', castle5: 'מצודה', castle6: 'טירה', castle7: 'מבצר', castle8: 'עיר מבצר', castle9: 'ממלכה',
      b_first: 'הרפתקה ראשונה', b_math100: 'קסם החשבון', b_read50: 'גן פורח', b_chesswin: 'שחמט!', b_chess5: 'כתר השחמט', b_streak3: 'ברצף', b_perfect: 'סיבוב מושלם', b_allworlds: 'גילוי עולמות', b_stars50: 'אוסף כוכבים', b_speed: 'מהירות הברק', b_thinker: 'מחשבה עמוקה', b_collector: 'ציד אוצרות',
      ageBand: 'הרמה שלך', band1: 'מתחילים', band2: 'מתקדמים', band3: 'אבירים', band4: 'ברונים', band5: 'דוכסים', band6: 'מלכים', ladderLevel: 'שלב {l} מתוך {n}', ladderUnlocked: 'שלב {l} נפתח!', ladderNeed: 'צוברים 2 כוכבים כדי לפתוח את השלב הבא', ladderDone: 'כל {n} השלבים הושלמו', ladderBandUp: 'טיפסתם את כל {n} השלבים! עוברים אל {name}', ladderOnward: 'קבוצת הגיל הבאה', eggTitle: 'בקע מביצה סודית', egg_rose: 'ארנב הוורד', egg_sunflower: 'ארנב החמנייה', egg_tulip: 'ארנב הצבעוני', eggFound: '🥚 מצאתם ביצה סודית!', eggHint: 'עוברים את אתגר החכם כדי לבקוע אותה: סבב קשה אחד ברמה הגבוהה, בלי רמזים.', eggGo: 'לאתגר!', eggHatched: 'הביצה הזאת כבר בקעה', eggChallenge: 'אתגר הביצה הסודית', eggWin: 'הביצה בקעה!', eggLose: 'לא הפעם. מוצאים את הביצה שוב כדי לנסות עוד פעם.',
      guest: 'אורח/ת', pickOpponent: 'עם מי משחקים?', kingdomEarned: 'מסע הממלכה', wins: 'ניצחונות', won: 'ניצחון', lost: 'הפסד', draw: 'תיקו', perfectBonus: 'בונוס סיבוב מושלם',
      skip: 'דילוג', howTo: 'איך?', letsSee: 'בואו נראה איך זה עובד', nextStep: 'השלב הבא', tryAlike: 'עוד אחת כזאת', gotIt: 'הבנתי!', showMe: 'תראו לי', workingOn: 'עובדים על', mastered: 'כבר יודעים', focus: 'תרגול של מה שקשה', focusEmpty: 'שחקו כמה סיבובים והטירה תמצא מה כדאי לתרגל.', hintCost: 'רמז עולה קצת נקודות', hintUsed: 'השתמשתם ברמז',
      coins: 'מטבעות', gems: 'אבני חן', chest: 'תיבת האוצר', market: 'שוק השיקויים', buy: 'קנייה', use: 'שימוש', ready: 'מוכן לסיבוב הבא', potionOn: '{name} פעיל!', found: 'מצאתם: {name}!', collection: 'האוסף', notEnough: 'עוד אין מספיק מטבעות', rarity_common: 'רגיל', rarity_rare: 'נדיר', rarity_epic: 'אגדי', potions: 'שיקויים', noPotions: 'עוד אין שיקויים. אוספים מטבעות וקונים בשוק.', earnedCoins: 'מטבעות שנצברו', doubled: 'שיקוי כפול: נקודות ×2',
      p_double: 'שיקוי כפול', p_double_d: 'נקודות כפולות לסיבוב אחד', p_shield: 'מגן הרצף', p_shield_d: 'טעות אחת לא תשבור את הרצף', p_hint: 'פנס הרמזים', p_hint_d: 'רמזים בחינם לסיבוב אחד', p_time: 'קמע הזמן', p_time_d: 'בונוס מהירות על כל תשובה נכונה',
      tg_add: 'חיבור', tg_sub: 'חיסור', tg_bridge10: 'חיבור מעבר ל-10', tg_within10: 'חיבור עד 10', tg_countback: 'ספירה לאחור', tg_countup: 'ספירה קדימה', tg_missing: 'מספר חסר', tg_double: 'כפולות', tg_tens: 'עשרות', tg_carry: 'העברת עשרת', tg_nocarry: 'חיבור בטור', tg_borrow: 'פריטת עשרת', tg_noborrow: 'חיסור בטור', tg_times: 'לוח הכפל', tg_div: 'חילוק', tg_half: 'חצאים', tg_quarter: 'רבעים', tg_round: 'עיגול', tg_pattern: 'סדרות', tg_count: 'ספירה', tg_compare: 'השוואה', tg_bigtimes: 'כפל גדול', tg_area: 'כפל דו-ספרתי', tg_remainder: 'שארית', tg_fraccmp: 'השוואת שברים', tg_order: 'סדר פעולות', tg_word: 'בעיות מילוליות', tg_wordadd: 'סיפורי חיבור', tg_wordsub: 'סיפורי חיסור', tg_wordmul: 'סיפורי כפל', tg_worddiv: 'סיפורי חילוק', tg_finals: 'אותיות סופיות', tg_case: 'אותיות גדולות וקטנות', tg_first: 'אותיות ראשונות', tg_words: 'בחירת מילים', tg_spell: 'איות', tg_listen: 'הקשבה', tg_sentence: 'קריאת סיפורים', tg_blank: 'השלמת מילים',
      journal: 'יומן הלמידה', j_recent: 'טעויות אחרונות', j_none: 'עוד לא נרשמו טעויות. או שזה מבריק, או שרק התחלנו.', j_focus: 'קשה כרגע', j_help: 'עזרה נוספת פעילה עבור: {tags}', j_given: 'התשובה שניתנה', levelUp: 'שלב חדש!', welcomeTo: 'ברוכים הבאים אל {name}!', streakBonus: 'בונוס רצף!', nextStage: 'עוד {n} ★ עד {name}', topStage: 'הגעתם לשלב הגבוה ביותר!', tapToContinue: 'לוחצים כדי להמשיך', sw_title: 'מי משחק?', sw_add: 'שחקן חדש', tix_new: 'ערבוב דמות חדש מחכה לכם! פותחים את מעבדת הדמויות בתפריט.', tour_step: 'בדרך להר התהילה: {d} מתוך {n} משחקים', tour_done: 'כל המשחקים הושלמו! חותמים על הר התהילה ומערבבים דמות חדשה!', skip: 'דילוג', faster: 'טיסה קצרה', slower: 'טיסה מלאה',
      i_key: 'מפתח עתיק', i_feather: 'נוצת עוף החול', i_mushroom: 'פטרייה זוהרת', i_shell: 'צדף ים', i_log: 'בול עץ אלון', i_candle: 'נר שעווה', i_apple: 'תפוח זהב', i_thread: 'חוט כסף', i_sword: 'חרב האבירים', i_map: 'מפת אוצר', i_compass: 'מצפן הכוכבים', i_lantern: 'פנס פיות', i_scroll: 'מגילה עתיקה', i_crown: 'כתר המלוכה', i_crystal: 'כדור בדולח', i_dragon: 'ביצת דרקון'
    }
  };
  const i18n = {
    langs: [{ id: 'he', name: 'עברית', dir: 'rtl' }, { id: 'en', name: 'English', dir: 'ltr' }],
    get lang() { return state.lang; },
    extend(more) { for (const l in more) dict[l] = Object.assign(dict[l] || {}, more[l]); },
    t(key, vars) { let s = (dict[state.lang] || dict.en)[key]; if (s == null) s = dict.en[key] != null ? dict.en[key] : key; if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]); return s; },
    set(lang, o) { const L = i18n.langs.find(l => l.id === lang) || i18n.langs[0]; state.lang = L.id; const ap = state.profiles.find(p => p.id === state.activeId); if (ap && !(o && o.transient)) ap.lang = L.id; save(); i18n.apply(); },   /* a change in Settings (or the header) sticks to the player; transient = only the screen flips (the sign-up dialog) */
    apply() {
      const L = i18n.langs.find(l => l.id === state.lang) || i18n.langs[0];
      document.documentElement.lang = L.id; document.documentElement.dir = L.dir;
      $$('[data-i18n]').forEach(n => { n.textContent = i18n.t(n.dataset.i18n); });
      $$('[data-i18n-ph]').forEach(n => { n.placeholder = i18n.t(n.dataset.i18nPh); });
      $$('[data-i18n-title]').forEach(n => { n.title = i18n.t(n.dataset.i18nTitle); n.setAttribute('aria-label', i18n.t(n.dataset.i18nTitle)); });
      $$('.langs').forEach(box => { box.replaceChildren(); i18n.langs.forEach(l => { const b = el('button', l.id === state.lang ? 'on' : '', l.name); b.type = 'button'; b.onclick = () => i18n.set(l.id); box.appendChild(b); }); });
      document.dispatchEvent(new CustomEvent('kq:lang', { detail: { lang: state.lang } }));
    }
  };
  const t = i18n.t;

  // ---------- profiles ----------
  const profiles = {
    list() { return state.profiles.slice(); },
    get(id) { return state.profiles.find(p => p.id === id) || null; },
    active() { return profiles.get(state.activeId) || state.profiles[0] || null; },
    setActive(id) { state.activeId = id; const p = profiles.get(id); if (p && (p.lang === 'he' || p.lang === 'en') && p.lang !== state.lang) { state.lang = p.lang; save(); i18n.apply(); } else save(); document.dispatchEvent(new CustomEvent('kq:profile', { detail: { id } })); },   /* switching players switches the language with them */
    add(p) { const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); const prof = { id, key: p.key || (p.pics && p.pics.length ? cloud.keyFrom(p.name, p.pics) : cloudKey()), pics: Array.isArray(p.pics) ? p.pics.slice(0, 4) : null, lang: p.lang === 'he' || p.lang === 'en' ? p.lang : state.lang, age: p.age == null ? null : +p.age, name: (p.name || '').trim().slice(0, 18) || t('player'), avatar: AVATARS.includes(p.avatar) || /^[cf]:/.test(p.avatar || '') ? p.avatar : AVATARS[state.profiles.length % AVATARS.length], created: Date.now(), main: (p.lang === 'he' || p.lang === 'en' ? p.lang : state.lang) === 'he' ? 'he' : 'en' }; state.profiles.push(prof); state.activeId = id; save(); return prof; },
    update(id, patch) { const p = profiles.get(id); if (!p) return; Object.assign(p, patch); save(); },
    /* Yoni 2026-10-07: a player is a first name and the first letter of the last name ('Noa E.', 'נועה א׳'), and a name belongs to one
       player only. Returns { ok, name } (the tidy form) or { ok: false, why: 'nm_format' | 'nm_taken' } */
    nameKey: n => String(n || '').toLocaleLowerCase().replace(/[.׳'’`\s-]/g, ''),
    nameCheck(raw, exceptId) { const parts = String(raw || '').replace(/\s+/g, ' ').trim().split(' '); if (parts.length < 2) return { ok: false, why: 'nm_format' };
      const ini = parts.pop().replace(/[.׳'’`]/g, ''), first = parts.join(' ');
      if (ini.length !== 1 || !/\p{L}/u.test(ini) || first.length < 2 || !/^\p{L}[\p{L}' -]*$/u.test(first)) return { ok: false, why: 'nm_format' };
      const heb = /[\u0590-\u05FF]/.test(ini), name = (first[0].toLocaleUpperCase() + first.slice(1)) + ' ' + (heb ? ini + '׳' : ini.toLocaleUpperCase() + '.');
      if (state.profiles.some(p => p.id !== exceptId && profiles.nameKey(p.name) === profiles.nameKey(name))) return { ok: false, why: 'nm_taken', name };
      return { ok: true, name }; },
    /* players that share a name (made before the rule): the Parents tab asks for a rename */
    dupes() { const g = {}; for (const p of state.profiles) (g[profiles.nameKey(p.name)] = g[profiles.nameKey(p.name)] || []).push(p); return Object.values(g).filter(x => x.length > 1); },
    nameOk(p) { return !!p && profiles.nameCheck(p.name, p.id).ok; },
    remove(id) { state.profiles = state.profiles.filter(p => p.id !== id); state.results = state.results.filter(r => r.pid !== id); delete state.skills[id]; if (state.journal) delete state.journal[id]; if (state.ladderLog) delete state.ladderLog[id]; delete state.inv[id]; delete state.active[id]; if (state.activeId === id) state.activeId = state.profiles[0] ? state.profiles[0].id : null; save(); }
  };

  // ---------- the ladder: every world × age band has 10 levels; 2+ stars at the current level unlocks the next, level 10 opens the next band ----------
  const LADDER_STEPS = 10, LADDER_PASS = 2;


  // ---------- the language bridge: a Hebrew-first child opens every new level with a short English lesson, and the other way round ----------
  /* Pitched at the child's band in that world: band 1 names pictures, band 2 translates, band 3 reads and listens without a
     picture, band 4 fills gaps in sentences, band 5 reads short texts, band 6 works with synonyms and opposites. Every lesson
     first teaches three words, then asks five questions; four right opens the level. The level waits otherwise, and the
     lesson can be tried again at any time (new words each time). */
  const bridge = {
    main(pid) { const p = profiles.get(pid); if (!p) return state.lang === 'he' ? 'he' : 'en'; if (!p.main) { p.main = state.lang === 'he' ? 'he' : 'en'; save(); } return p.main; },
    second(pid) { return bridge.main(pid) === 'he' ? 'en' : 'he'; },
    langName(l) { return t(l === 'he' ? 'br_he' : 'br_en'); },
    available(pid) { return !!(window.KQ_WORDS && KQ_WORDS.en && KQ_WORDS.he && profiles.get(pid)); },
    _shuf(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    _say(text, l) { speak(text, l, { force: true }); },   /* the 🔊 button: ElevenLabs through speak(), never the device voice */
    lesson(pid, band) { const L1 = bridge.main(pid), L2 = bridge.second(pid), W1 = KQ_WORDS[L1], W2 = KQ_WORDS[L2], S = bridge._shuf; const tier = Math.max(1, Math.min(6, band || 1));
      const byPic = new Map(W1.words.map(w => [w[1], w[0]])); const pairs = W2.words.filter(w => byPic.has(w[1])).map(w => ({ pic: w[1], w2: w[0], w1: byPic.get(w[1]) }));
      const learn = S(pairs).slice(0, 3), pool = S(pairs); const others = (x, key) => S(pool.filter(p => p[key] !== x[key])).slice(0, 3).map(p => p[key]);
      const kinds = { 1: ['pic', 'listen'], 2: ['pic', 'w1w2', 'listen'], 3: ['w1w2', 'w2w1', 'listen'], 4: ['w2w1', 'blank', 'w1w2'], 5: ['blank', 'sent', 'syn'], 6: ['sent', 'syn', 'ant', 'blank'] }[tier];
      const sa = S(W2.synonyms.map(v => ['syn', v]).concat(W2.antonyms.map(v => ['ant', v]))).slice(0, 3); let saI = 0;   /* the synonym/opposite pairs the older lessons teach, then test */
      const make = (kind, i) => { const x = i < 3 ? learn[i] : pool[i];
        if (kind === 'pic') return { kind, pic: x.pic, q: t('br_q_pic', { lang: bridge.langName(L2) }), a: x.w2, ch: S([x.w2, ...others(x, 'w2')]), chLang: L2 };
        if (kind === 'listen') return { kind, say: x.w2, q: t('br_q_listen'), a: x.pic, ch: S([x.pic, ...others(x, 'pic')]), big: true };
        if (kind === 'w1w2') return { kind, pic: tier <= 2 ? x.pic : null, q: t('br_q_w1w2', { w: x.w1, lang: bridge.langName(L2) }), a: x.w2, ch: S([x.w2, ...others(x, 'w2')]), chLang: L2 };
        if (kind === 'w2w1') return { kind, text: x.w2, textLang: L2, q: t('br_q_w2w1', { w: x.w2 }), a: x.w1, ch: S([x.w1, ...others(x, 'w1')]), say: x.w2 };
        if (kind === 'blank') { const b = W2.blanks[Math.floor(Math.random() * W2.blanks.length)]; return { kind, text: b[0], textLang: L2, q: t('br_q_blank', { lang: bridge.langName(L2) }), a: b[1], ch: S(b[2]), chLang: L2 }; }
        if (kind === 'sent') { const s = W2.sentences[Math.floor(Math.random() * W2.sentences.length)]; return { kind, text: s[0], textLang: L2, q2: s[1], q: t('br_q_sent'), a: s[2][0], ch: S(s[2]), chLang: L2, say: s[0] }; }
        const taught = sa.filter(v => v[0] === kind)[saI++ % Math.max(1, sa.filter(v => v[0] === kind).length)], list = kind === 'syn' ? W2.synonyms : W2.antonyms, s = taught ? taught[1] : list[Math.floor(Math.random() * list.length)]; return { kind, text: s[3] || '', textLang: L2, q: t(kind === 'syn' ? 'br_q_syn' : 'br_q_ant', { w: s[0], lang: bridge.langName(L2) }), a: s[1], ch: S([s[1], ...s[2].slice(0, 3)]), chLang: L2 }; };
      const qs = []; for (let i = 0; i < 5; i++) qs.push(make(kinds[i % kinds.length], i));
      /* the teaching cards: for the older bands, the words the harder questions lean on, with an example */
      const cards = tier <= 4 ? learn.map(x => ({ pic: x.pic, w2: x.w2, w1: x.w1 })) : sa.map(([kd, v]) => ({ pic: kd === 'syn' ? '🟰' : '↔️', w2: v[0] + ' · ' + v[1], w1: v[3] || '' }));
      return { L1, L2, tier, cards, qs }; },
    open(world, onPass) { const p = profiles.active(); if (!p) return; const w = ladder._w(p.id, world); if (!w.bw) return; const band = w.bw.band; let lesson = bridge.lesson(p.id, band);
      ensureBridgeCss(); const ov = el('div', 'kq-overlay kq-bridge'), card = el('div', 'kqb'); ov.appendChild(card); document.body.appendChild(ov);
      const dir2 = () => lesson.L2 === 'he' ? 'rtl' : 'ltr';
      const head = () => { card.replaceChildren(); const x = el('button', 'close', '✕'); x.type = 'button'; x.onclick = () => ov.remove(); card.appendChild(x); card.appendChild(el('h2', null, '🌍 ' + t('br_title', { lang: bridge.langName(lesson.L2) }))); card.appendChild(el('div', 'sub', t('br_sub', { n: w.bw.opens }))); };
      const teach = () => { head(); card.appendChild(el('div', 'bstep', t('br_learn'))); const g = el('div', 'cards'); for (const c of lesson.cards) { const d = el('div', 'wc'); d.appendChild(el('div', 'pic', c.pic)); const w2 = el('div', 'w2', c.w2); w2.style.direction = dir2(); d.appendChild(w2); if (c.w1) d.appendChild(el('div', 'w1', c.w1)); const s = el('button', 'say', '🔊'); s.type = 'button'; s.onclick = () => bridge._say(c.w2.split(' · ')[0], lesson.L2); d.appendChild(s); g.appendChild(d); } card.appendChild(g); const go = el('button', 'btn gold', t('br_ready')); go.type = 'button'; go.onclick = () => ask(0, 0); card.appendChild(go); };
      const ask = (i, ok) => { if (i >= lesson.qs.length) return done(ok); const q = lesson.qs[i]; bridge._cur = q; head(); card.appendChild(el('div', 'bstep', (i + 1) + ' / 5'));
        if (q.pic) card.appendChild(el('div', 'bigpic', q.pic)); if (q.text) { const tx = el('div', 'text', q.text); tx.style.direction = q.textLang === 'he' ? 'rtl' : 'ltr'; card.appendChild(tx); }
        card.appendChild(el('div', 'q', q.q)); if (q.q2) { const q2 = el('div', 'q2', q.q2); q2.style.direction = dir2(); card.appendChild(q2); }
        if (q.say) { const s = el('button', 'say big', '🔊'); s.type = 'button'; s.onclick = () => bridge._say(q.say, lesson.L2); card.appendChild(s); if (q.kind === 'listen') setTimeout(() => bridge._say(q.say, lesson.L2), 300); }
        const box = el('div', 'ch'); const fb = el('div', 'fb'); for (const c of q.ch) { const b = el('button', 'choice' + (q.big ? ' big' : ''), c); b.type = 'button'; if (q.chLang) b.style.direction = q.chLang === 'he' ? 'rtl' : 'ltr'; b.onclick = () => { for (const x of box.children) x.disabled = true; const right = c === q.a; b.classList.add(right ? 'ok' : 'bad'); if (!right) for (const x of box.children) if (x.textContent === q.a) x.classList.add('ok'); fb.textContent = right ? praise.ok() : praise.bad(q.a); fb.className = 'fb ' + (right ? 'ok' : 'bad'); sfx.play(right ? 'correct' : 'wrong'); setTimeout(() => ask(i + 1, ok + (right ? 1 : 0)), right ? 900 : 1800); }; box.appendChild(b); } card.appendChild(box); card.appendChild(fb); };
      const done = ok => { head(); const pass = ok >= 4; if (pass) { const bw = ladder.bridgeDone(p.id, world); card.appendChild(el('div', 'bigpic', '🌍')); card.appendChild(el('div', 'q', t('br_pass', { n: bw ? bw.opens : '', lang: bridge.langName(lesson.L2) }))); sfx.play('star'); state.bridgeLog = state.bridgeLog || []; state.bridgeLog.push({ pid: p.id, world, band, lang: lesson.L2, ok, ts: Date.now() }); if (state.bridgeLog.length > 200) state.bridgeLog.splice(0, state.bridgeLog.length - 200); save(); document.dispatchEvent(new CustomEvent('kq:ladder', { detail: { world } })); const c = el('button', 'btn gold', t('br_continue')); c.type = 'button'; c.onclick = () => { ov.remove(); if (onPass) onPass(); }; card.appendChild(c); }
        else { card.appendChild(el('div', 'bigpic', '📚')); card.appendChild(el('div', 'q', t('br_fail', { k: ok }))); const r = el('button', 'btn gold', t('br_retry')); r.type = 'button'; r.onclick = () => { lesson = bridge.lesson(p.id, band); teach(); }; card.appendChild(r); const l = el('button', 'btn ghost', t('br_later')); l.type = 'button'; l.onclick = () => ov.remove(); card.appendChild(l); } };
      teach(); }
  };
  function ensureBridgeCss() { if (document.getElementById('kqb-css')) return; const s = document.createElement('style'); s.id = 'kqb-css'; s.textContent = `
.kq-bridge{position:fixed; inset:0; z-index:90; display:grid; place-items:center; background:rgba(12,24,40,.6); padding:16px; overflow:auto}
.kqb{position:relative; width:min(640px,94vw); background:linear-gradient(180deg,#f2f8ff,#fffaf0); border:3px solid #8fbfe8; border-radius:22px; padding:22px 24px; text-align:center; box-shadow:0 30px 80px rgba(0,0,0,.45); font-family:var(--font-body, serif)}
.kqb .close{position:absolute; top:10px; inset-inline-end:10px; border:0; background:transparent; font-size:20px; cursor:pointer}
.kqb h2{margin:0 0 4px} .kqb .sub{color:#5a6a7a; font-weight:700} .kqb .bstep{margin:12px 0 6px; font-weight:900; color:#2b5fa8; letter-spacing:.06em}
.kqb .cards{display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin:8px 0 14px} .kqb .wc{position:relative; background:#fff; border:2px solid #d6e6f6; border-radius:16px; padding:12px 8px}
.kqb .wc .pic{font-size:44px} .kqb .wc .w2{font-size:24px; font-weight:900; color:#1f3a5a} .kqb .wc .w1{font-size:14px; color:#6a7a8a; font-weight:700} .kqb .say{border:0; background:#e8f2fc; border-radius:999px; padding:4px 10px; cursor:pointer; margin-top:6px} .kqb .say.big{font-size:26px; padding:8px 18px}
.kqb .bigpic{font-size:72px; line-height:1.1; margin:6px 0} .kqb .text{font-size:clamp(20px,3.4vw,28px); font-weight:800; margin:8px 0; color:#1f3a5a} .kqb .q{font-size:clamp(18px,2.8vw,22px); font-weight:800; margin:8px 0} .kqb .q2{font-size:18px; font-weight:700; color:#2b5fa8}
.kqb .ch{display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; margin-top:10px} .kqb .choice{font:800 20px var(--font-body, serif); padding:14px 10px; border-radius:14px; border:3px solid #d6e6f6; background:#fff; cursor:pointer} .kqb .choice.big{font-size:40px} .kqb .choice.ok{background:#dff5e3; border-color:#5ad17a} .kqb .choice.bad{background:#fde2dd; border-color:#ff8a7a}
.kqb .fb{min-height:28px; margin-top:8px; font-weight:800} .kqb .fb.ok{color:#2f7a3f} .kqb .fb.bad{color:#b0461a} .kqb .btn{margin:10px 6px 0}`; document.head.appendChild(s); }
  // ---------- growth: the personal growth detector ----------
  /* Every answer is evidence about one skill, for one player, in one band. Evidence is weighted by how much it can be trusted:
     an answer after a hint counts 0, after leaving the tab 0.25, after a pause far longer than this child's own usual time 0.5,
     and a correct tap faster than 0.6 s (a probable guess) 0.5. Mastery is the Wilson lower bound (80%) of the weighted accuracy
     over the last 16 answers, so a skill is only called secure once enough answers make the estimate trustworthy: 5/5 is not
     enough on one occasion, it must hold again on a second visit at least 30 minutes later (the fluke guard).
     Time to answer is read against the child's own baseline for that skill: fast and right means the questions are too easy,
     slow and right means they are working hard, and the engine steers the difficulty from both. */
  const G_WIN = 16, G_Z = 1.28, G_OCCASION_MS = 30 * 60 * 1000, G_SECURE = 0.7, G_STRETCH = 0.8;
  const F_HINT = 1, F_AWAY = 2, F_LONG = 4, F_RUSH = 8;
  const gWeight = f => (f & F_HINT) ? 0 : (f & F_AWAY) ? 0.25 : (f & (F_LONG | F_RUSH)) ? 0.5 : 1;
  const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  function wilson(S, N) { if (N <= 0) return 0; const p = S / N, z2 = G_Z * G_Z; return Math.max(0, (p + z2 / (2 * N) - G_Z * Math.sqrt(p * (1 - p) / N + z2 / (4 * N * N))) / (1 + z2 / N)); }
  const gAway = { on: false, away: false };
  document.addEventListener('visibilitychange', () => { if (document.hidden && gAway.on) gAway.away = true; });
  const growth = {
    _node(pid, world, band, skill) { state.growth = state.growth || {}; const P = state.growth[pid] = state.growth[pid] || {}; const W = P[world] = P[world] || {}; const B = W[band] = W[band] || {}; return B[skill] = B[skill] || { a: [], early: [], first: Date.now() }; },
    _peek(pid, world, band, skill) { const g = state.growth && state.growth[pid] && state.growth[pid][world] && state.growth[pid][world][band]; return g ? g[skill] || null : null; },
    /* the child's own usual time for this skill: median of the last 12 trusted correct answers */
    baseline(node) { const t = node.a.filter(e => e[0] && e[2] === 0).slice(-12).map(e => e[1]); return t.length >= 4 ? median(t) : null; },
    stats(pid, world, band, skill) { const node = growth._peek(pid, world, band, skill); if (!node || !node.a.length) return { status: 'new', n: 0, lower: 0, rate: 0, occasions: 0, speed: null, outside: 0, hints: 0 };
      const win = node.a.slice(-G_WIN); let S = 0, N = 0, outside = 0, hints = 0; for (const e of win) { const w = gWeight(e[2]); S += w * e[0]; N += w; if (e[2] & (F_AWAY | F_LONG)) outside++; if (e[2] & F_HINT) hints++; }
      const lower = wilson(S, N), rate = N ? S / N : 0;
      /* occasions: rounds (sids) in the window with at least 3 trusted answers at ≥ 70%, counted only when 30+ minutes apart */
      const bySid = {}; for (const e of win) { const w = gWeight(e[2]); if (!w) continue; const b = bySid[e[5]] = bySid[e[5]] || { S: 0, N: 0, ts: e[4] }; b.S += w * e[0]; b.N += w; }
      const good = Object.values(bySid).filter(b => b.N >= 3 && b.S / b.N >= 0.7).map(b => b.ts).sort((x, y) => x - y); let occasions = 0, last = -Infinity; for (const ts of good) if (ts - last >= G_OCCASION_MS) { occasions++; last = ts; }
      /* speed: the child's first 8 trusted correct answers against the last 8 — below 1 means faster than they started */
      const recent = node.a.filter(e => e[0] && e[2] === 0).slice(-8).map(e => e[1]); const early = median(node.early), now = median(recent); const speed = early && now && node.early.length >= 6 && recent.length >= 4 ? now / early : null;
      const n = node.a.length; let status;
      if (N < 3) status = 'new'; else if (lower < 0.45) status = 'learning'; else if (lower < G_SECURE) status = 'practicing'; else if (occasions < 2) status = 'confirming';
      else if (lower >= G_STRETCH && (speed == null || speed <= 1.05)) status = 'stretch'; else status = 'secure';
      if ((status === 'secure' || status === 'stretch') && outside / win.length >= 0.25) status = 'confirming';   /* too much of it happened with help from outside: not yet trusted */
      return { status, n, lower, rate, occasions, speed, outside: outside / win.length, hints, nowMs: now, earlyMs: early }; },
    /* what a round of this skill should look like */
    plan(pid, world, band, skill) { const st = growth.stats(pid, world, band, skill);
      const P = { new: { tier: 0, dn: 2 }, learning: { tier: 0, dn: 2 }, practicing: { tier: 1, dn: 0 }, confirming: { tier: 1, dn: 0 }, secure: { tier: 1, dn: -1 }, stretch: { tier: 2, dn: -2 } }[st.status];
      return Object.assign({ status: st.status, stretchBand: st.status === 'stretch' }, P, { st }); },
    need(status) { return { learning: 5, practicing: 4, new: 3, confirming: 3, secure: 1, stretch: 1 }[status] || 2; },
    /* one round of play: start it when the round starts, call begin() as each question appears and answer() when it is settled */
    round(pid, world, band, skill, bandSkills) {
      const sid = Date.now(), items = [], before = {}; const skills = (bandSkills && bandSkills.length ? bandSkills : [skill]).filter(Boolean);
      for (const s of new Set(skills.concat(skill ? [skill] : []))) before[s] = growth.stats(pid, world, band, s).status;
      let fast = 0;
      const G = {
        sid, world, band, skill, before, items,
        plan: s => growth.plan(pid, world, band, s || skill),
        /* focus rounds: serve the skills that need evidence most, never ignoring any */
        pickSkill(list) { const L = (list && list.length ? list : skills); const w = L.map(s => growth.need(growth.stats(pid, world, band, s).status)); let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < L.length; i++) { r -= w[i]; if (r <= 0) return L[i]; } return L[L.length - 1]; },
        /* a stretch skill borrows one question in three from the next band when that band teaches the same skill */
        genBand(s, bandsMap) { const p = growth.plan(pid, world, band, s); if (!p.stretchBand || !bandsMap) return band; const ids = Object.keys(bandsMap).map(Number), nb = ids[ids.indexOf(band) + 1]; return nb && (bandsMap[nb] || []).includes(s) && Math.random() < 0.34 ? nb : band; },
        begin() { gAway.on = true; gAway.away = document.hidden; },
        answer(s, ok, ms, o) { o = o || {}; gAway.on = false; const node = growth._node(pid, world, band, s || skill), base = growth.baseline(node);
          let f = 0; if (o.hint) f |= F_HINT; if (gAway.away) f |= F_AWAY; if (ms > Math.max(20000, base ? base * 4 : 45000)) f |= F_LONG; if (ok && ms < 600) f |= F_RUSH; gAway.away = false;
          node.a.push([ok ? 1 : 0, Math.round(ms), f, o.tier || 0, Date.now(), sid]); if (node.a.length > 60) node.a.splice(0, node.a.length - 60);
          if (ok && f === 0 && node.early.length < 8) node.early.push(Math.round(ms));
          const effort = base ? ms / base : null; items.push({ s: s || skill, ok: !!ok, ms, f, effort }); save();
          /* the time-to-answer steer: two quick, trusted right answers in a row → a harder question; a right answer that took
             more than twice the usual time → hold the level, the child is working hard */
          let advice = 'keep'; if (ok && f === 0 && effort != null && effort < 0.6) { fast++; if (fast >= 2) { advice = 'up'; fast = 0; } } else fast = 0; if (ok && effort != null && effort > 2.2) advice = 'hold';
          return { effort, advice, flags: f }; },
        /* end of round: decides what the ladder may do with this round and explains it */
        finish(stars, level, bands, bandsMap) {
          const n = items.length, okN = items.filter(x => x.ok).length, outsideN = items.filter(x => x.f & (F_AWAY | F_LONG)).length, trusted = items.filter(x => x.f === 0);
          const efforts = trusted.filter(x => x.ok && x.effort != null).map(x => x.effort), mEff = median(efforts);
          const hintN = items.filter(x => x.f & F_HINT).length, hinted = n >= 5 && hintN / n >= 0.5; const st0 = before[skill] || 'new', assisted = n >= 5 && (outsideN / n >= 0.34 || hinted);
          const provisional = !!skill && !assisted && (st0 === 'new' || st0 === 'learning') && okN / Math.max(1, n) >= 0.8;   /* focus rounds mix skills, so only a single-skill round can be a suspicious jump */
          const fastTrack = !!skill && !assisted && okN === n && n >= 5 && trusted.length === n && (st0 === 'secure' || st0 === 'stretch') && mEff != null && mEff <= 0.85;
          const bandSkills = bandsMap && bandsMap[band] ? bandsMap[band] : skills;
          const gate = () => { const sts = bandSkills.map(s => ({ s, st: growth.stats(pid, world, band, s).status })); const strong = sts.filter(x => x.st === 'secure' || x.st === 'stretch').length, weakPlayed = sts.filter(x => x.st === 'learning'); const ok = strong >= Math.ceil(bandSkills.length * 0.6) && !weakPlayed.length; return { ok, missing: sts.filter(x => x.st !== 'secure' && x.st !== 'stretch').map(x => x.s) }; };
          const wv = ladder._w(pid, world), snap = JSON.parse(JSON.stringify({ band: wv.band, done: wv.done || {}, held: wv.held || {}, prov: wv.prov || {} }));
          const slow = !assisted && mEff != null && mEff > 2 && stars < 3;   /* right answers, but far slower than this child's own pace */
          const lad = ladder.complete(pid, world, band, level, stars, bands, { hold: assisted, slow, provisional, skip: fastTrack, gate, bridge: bridge.available(pid), snap });
          const lines = [], after = growth.stats(pid, world, band, skill), label = x => tagLabel(world, x) || t('s_' + x);
          if (assisted) lines.push(['g', '🧭 ' + t(hinted && outsideN / n < 0.34 ? 'g_hinted' : 'g_assisted'), '']);
          else if (lad.rolledBack) lines.push(['g', '🔁 ' + t('g_rollback'), '']);
          else if (lad.bandDown) lines.push(['g', '🪜 ' + t('g_bandDown', { b: t('band' + lad.nextBand) }), '']); else if (lad.levelDown) lines.push(['g', '🪜 ' + t('g_down', { l: lad.level }), '']); else if (lad.slow) lines.push(['g', '🐢 ' + t('g_slow'), '']);
          else if (lad.confirmed) lines.push(['g', '✅ ' + t('g_confirmed'), '']);
          else if (provisional && lad.unlocked) lines.push(['g', '🔍 ' + t(st0 === 'new' ? 'g_provisionalNew' : 'g_provisional'), '']);
          if (fastTrack && lad.skipped) lines.push(['g', '🚀 ' + t('g_fasttrack'), '']);
          if (lad.bandHeld) lines.push(['g', '🧱 ' + t('g_bandHeld'), (lad.missing || []).map(label).join(' · ')]);
          if (lad.bridgeNeeded || lad.bridgePending) lines.push(['g', '🌍 ' + t('br_need', { lang: bridge.langName(bridge.second(pid)), n: (ladder._w(pid, world).bw || {}).opens || level }), '', 'bridge:' + world]);
          if (skill && after.status !== st0) lines.push(['g', t('g_status_' + after.status) + ' · ' + label(skill), '']);
          if (mEff != null && n >= 5) lines.push(['g', '⏱️ ' + t(mEff < 0.7 ? 'g_timeEasy' : mEff > 1.6 ? 'g_timeHard' : 'g_timeRight'), '']);
          lines.forEach(l => { l.shift(); l.splice(2, 0, 'g'); });   /* marked so the report card shows them as a note, not a stat tile */
          return Object.assign({}, lad, { unlocked: lad.unlocked && !lad.bridgeNeeded, bandUp: lad.bandUp && !lad.bridgeNeeded, lines, status: after.status, before: st0, assisted, provisional, fastTrack }); }
      };
      return G; },
    /* the growth report for Wizard's Pond: every skill a player has met, with its evidence */
    report(pid) { const out = [], P = (state.growth || {})[pid] || {}; for (const w in P) for (const b in P[w]) for (const s in P[w][b]) { const st = growth.stats(pid, w, +b, s); if (st.n) out.push(Object.assign({ world: w, band: +b, skill: s }, st)); } return out; },
    F: { HINT: F_HINT, AWAY: F_AWAY, LONG: F_LONG, RUSH: F_RUSH }
  };
  // ---------- realms: the meadow and the three kingdoms above it; each one asks its questions a band harder ----------
  const REALMS = { meadow: { offset: 0, e: '🌿', icon: 'r_meadow' }, sky: { offset: 1, e: '🏝️', icon: 'r_sky' }, cloud: { offset: 2, e: '☁️', icon: 'r_cloud' }, ocean: { offset: 3, e: '🌊', icon: 'r_ocean' }, fashion: { offset: 1, e: '🎀', icon: 'r_fashion' }, sports: { offset: 1, e: '⚽', icon: 'r_sports' }, space: { offset: 1, e: '🚀', icon: 'rocket', ride: true }, pirate: { offset: 4, e: '🏴‍☠️', icon: 'r_pirate', under: true }, skull: { offset: 5, e: '💀', icon: 'r_skull', under: true } };   /* the two underworld realms sit below the meadow and are the hardest of all */
  /* how much harder each realm is — GRADUAL, never a leap (Yoni 2026-09-23: "you can't jump from adding two-digit numbers to
     powers and x"). Every child plays their OWN band in every realm; a higher realm only (1) starts the drill rounds one tier
     harder inside that band, (2) lets the pop-up games borrow a few questions from the NEXT band — more as the child proves
     ready — and (3) makes the chess computer at most one step stronger. Nothing is ever more than one band above the child. */
  const LIFT = { meadow: { tier: 0, stretch: 0.05, chess: 0 }, sky: { tier: 0, stretch: 0.1, chess: 0 }, cloud: { tier: 0, stretch: 0.15, chess: 0 }, ocean: { tier: 1, stretch: 0.2, chess: 1 }, fashion: { tier: 0, stretch: 0.1, chess: 0 }, sports: { tier: 0, stretch: 0.1, chess: 0 }, space: { tier: 0, stretch: 0.1, chess: 0 }, pirate: { tier: 1, stretch: 0.25, chess: 1 }, skull: { tier: 1, stretch: 0.3, chess: 1 } };
  const realmId = (() => { try { const r = new URLSearchParams(location.search).get('realm'); return REALMS[r] ? r : 'meadow'; } catch (e) { return 'meadow'; } })();
  const realm = { id: realmId, offset: REALMS[realmId].offset, lift: LIFT[realmId] || LIFT.meadow, liftOf: id => LIFT[id] || LIFT.meadow, e: REALMS[realmId].e, list: Object.keys(REALMS), of: id => REALMS[id], href(u) { if (realmId === 'meadow') return u; return u + (u.includes('?') ? '&' : '?') + 'realm=' + realmId; } };
  const ladder = {
    steps: LADDER_STEPS,
    _w(pid, world) { state.ladder = state.ladder || {}; const L = state.ladder[pid] = state.ladder[pid] || {}; return L[world] = L[world] || { band: null, done: {} }; },
    /* while a level waits for its language bridge, the ladder shows the state from before that round */
    _v(pid, world) { const w = ladder._w(pid, world); return w.bw ? w.bw.snap : w; },
    get(pid, world, band) { const w = ladder._w(pid, world), v = ladder._v(pid, world), done = v.done[band] || 0; const bw = w.bw && w.bw.band === band ? w.bw : null; return { done, level: Math.min(LADDER_STEPS, done + 1), complete: done >= LADDER_STEPS, bridgePending: !!bw, bridgeWorld: bw ? world : null, bridgeLevel: bw ? w.bw.opens : null }; },
    // the band a player should be on: the one they chose, else the first band with levels still to climb
    band(pid, world, bands) { const w = ladder._v(pid, world); if (w.band && bands.includes(w.band)) return w.band; const first = bands.find(x => (w.done[x] || 0) < LADDER_STEPS) || bands[bands.length - 1];
      /* the class the parents set (Parents tab) is where a world starts: a 9-year-old does not begin with counting objects (2026-09-29).
         Class → age band: pre-K/K → 1, 1–2 → 2, 3–4 → 3, 5–6 → 4, 7–8 → 5, 9–10 → 6; a world whose bands stop lower starts at its top one */
      const p = profiles.get(pid); let ab = null; if (p && p.age != null) ab = ladder.bandForAge(p.age); else if (p && p.grade != null) ab = p.grade <= 0 ? 1 : Math.min(6, Math.ceil(p.grade / 2) + 1); if (ab == null) return first; const fit = bands.filter(x => x <= ab).pop() || bands[0]; return Math.max(first, fit); },
    /* Yoni 2026-10-17: every player gives their age once; nothing in the games asks for an age again. 4–5 → 1, 6–7 → 2, 8–9 → 3, 10–11 → 4, 12–13 → 5, 14+ → 6 */
    bandForAge(age) { age = +age; return age <= 5 ? 1 : age <= 7 ? 2 : age <= 9 ? 3 : age <= 11 ? 4 : age <= 13 ? 5 : 6; },
    /* the age was just given (or changed): the bands the child once tapped by hand no longer count; climbed levels stay */
    resetBands(pid) { const L = state.ladder && state.ladder[pid]; if (L) for (const w of Object.values(L)) w.band = null; save(); },   /* the SAME band in every realm: realms no longer add whole bands (that was a leap) — see LIFT */
    /* the band for ONE pop-up question: the child's own band or — as a stretch — the next one, never further. The chance
       grows with the realm (LIFT.stretch), with how far the child has climbed this band and with a run of right answers in
       this round; the first question is a warm-up, and a miss brings the next question back to the child's own band. */
    stretchBand(pid, world, bands, ctx) { ctx = ctx || {}; const b = ladder.band(pid, world, bands), nb = bands[bands.indexOf(b) + 1]; if (!nb || ctx.first || ctx.missed) return b;
      const ready = (ladder.get(pid, world, b).level - 1) / (LADDER_STEPS - 1), p = Math.min(0.6, realm.lift.stretch + ready * 0.3 + ((ctx.streak || 0) >= 2 ? 0.15 : 0)); return Math.random() < p ? nb : b; },
    setBand(pid, world, band) { ladder._w(pid, world).band = band; save(); },
    // how a level shapes a round: harder starting tier, a few more questions, a shorter "fast" window
    tune(level) { return { tierStart: Math.min(2, (level <= 3 ? 0 : level <= 7 ? 1 : 2) + realm.lift.tier), n: 8 + Math.ceil(level / 2), fastMul: Math.max(0.6, 1 - (level - 1) * 0.045) }; },   /* the higher realms start one tier harder inside the child's band */
    // after a round: did this pass unlock the next level, and did finishing level 10 escalate the band?
    /* opts (from the growth engine): hold — the round looked helped from outside, it does not move the ladder;
       provisional — a big jump from a weak history, the level opens but the next round must confirm it or it rolls back;
       skip — a perfect, fluent, trusted round on a secure skill climbs one extra level; gate() — the band only opens
       when its skills are secure across visits, not just after ten passed rounds. */
    complete(pid, world, band, level, stars, bands, opts) {
      opts = opts || {}; const w = ladder._w(pid, world); w.prov = w.prov || {}; w.held = w.held || {}; let done = w.done[band] || 0; const passed = stars >= LADDER_PASS;
      if (w.bw) return { passed, unlocked: false, bandUp: false, bridgePending: true, level: Math.min(LADDER_STEPS, (w.bw.snap.done[band] || 0) + 1) };   /* nothing moves until the waiting bridge lesson is passed */
      const res = ladder._complete(w, band, level, stars, bands, opts, done, passed); ladder._log(pid, world, band, res, stars);
      if ((res.unlocked || res.bandUp) && !res.rolledBack && !res.held) tickets.earn(pid, 'level', world);   /* moving up a level opens a new avatar mix */
      /* Yoni 2026-10-03: the Heart Garden is a must at every level passed — a seed waits, and the next game starts with one short scene (shared/heart.js) */
      if ((res.unlocked || res.bandUp) && !res.rolledBack && !res.held) { state.heart = state.heart || {}; const h = state.heart[pid] = state.heart[pid] || { flowers: [], seen: {} }; h.pending = { world, band, ts: Date.now() }; save(); }
      if (opts.bridge && (res.unlocked || res.bandUp)) { w.bw = { band, snap: opts.snap, opens: res.bandUp ? 1 : res.level, bandUp: !!res.bandUp, nextBand: res.nextBand, ts: Date.now() }; res.bridgeNeeded = true; save(); }
      return res;
    },
    /* the language bridge was passed: the waiting level (or band) opens for real */
    /* every move on the ladder with its date (Yoni 2026-10-07: 'when did they move from level to level'): up a level, up a stage (band),
       back a level (an unconfirmed jump), or a stage held until its skills are secure. The Parents report card reads it */
    _log(pid, world, band, res, stars) { const k = res.rolledBack ? 'back' : res.bandUp ? 'band' : res.bandDown ? 'bdown' : res.levelDown ? 'down' : res.unlocked ? 'up' : res.bandHeld ? 'held' : null; if (!k) return;
      state.ladderLog = state.ladderLog || {}; const L = state.ladderLog[pid] = state.ladderLog[pid] || []; L.push({ ts: Date.now(), w: world, b: band, nb: res.nextBand && (res.bandUp || res.bandDown) ? res.nextBand : null, l: res.level, k, s: stars || 0, skip: res.skipped ? 1 : 0, wait: res.bridgeNeeded ? 1 : 0 }); if (L.length > 1000) L.splice(0, L.length - 1000); save(); },
    history(pid) { return ((state.ladderLog || {})[pid] || []).slice(); },
    bridgeDone(pid, world) { const w = ladder._w(pid, world); const bw = w.bw; if (!bw) return null; w.bw = null; save(); if (tickets._v(pid).tour.includes(world)) tickets.check(pid, world); return bw; },   /* the lesson may be the last step of the path */
    _complete(w, band, level, stars, bands, opts, done, passed) {
      if (opts.hold) return { passed, unlocked: false, bandUp: false, held: true, level: Math.min(LADDER_STEPS, done + 1) };
      let confirmed = false;
      if (w.prov[band]) { delete w.prov[band]; if (!passed) { w.done[band] = Math.max(0, done - 1); save(); return { passed: false, unlocked: false, bandUp: false, rolledBack: true, level: Math.min(LADDER_STEPS, w.done[band] + 1) }; } confirmed = true; }
      /* Yoni 2026-10-17: 'if the level is too hard — too much lag or too many wrong answers — the level decreases'. A hard round is one
         below 2 stars, or a right-but-slow one (opts.slow: the child took more than twice their usual time). Two in a row drop a level;
         at level 1 the band itself drops. A round that only passed slowly never climbs. */
      w.fail = w.fail || {}; const hard = !passed || !!opts.slow;
      if (hard) { w.fail[band] = (w.fail[band] || 0) + 1;
        if (w.fail[band] >= 2) { w.fail[band] = 0;
          if (done > 0) { w.done[band] = done - 1; save(); return { passed, unlocked: false, bandUp: false, levelDown: true, level: Math.min(LADDER_STEPS, w.done[band] + 1) }; }
          const i = bands.indexOf(band); if (i > 0) { w.band = bands[i - 1]; w.returnTo = w.returnTo || {}; w.returnTo[bands[i - 1]] = band; save(); return { passed, unlocked: false, bandUp: false, bandDown: true, nextBand: bands[i - 1], level: Math.min(LADDER_STEPS, (w.done[bands[i - 1]] || 0) + 1) }; } }
        if (opts.slow && passed) { save(); return { passed, unlocked: false, bandUp: false, slow: true, level: Math.min(LADDER_STEPS, done + 1) }; } }
      else w.fail[band] = 0;
      /* the way back up after a drop: two strong rounds (3 stars) in the easier stage return the child to the stage they came from */
      w.good = w.good || {}; if (passed && stars >= 3 && w.returnTo && w.returnTo[band]) { w.good[band] = (w.good[band] || 0) + 1; if (w.good[band] >= 2) { const nb = w.returnTo[band]; delete w.returnTo[band]; w.good[band] = 0; w.band = nb; save(); return { passed, unlocked: false, bandUp: true, returned: true, nextBand: nb, level: Math.min(LADDER_STEPS, (w.done[nb] || 0) + 1) }; } } else w.good[band] = 0;
      const bandUpNow = () => { const i = bands.indexOf(band); if (i >= 0 && i < bands.length - 1) { w.band = bands[i + 1]; delete w.held[band]; return bands[i + 1]; } return null; };
      if (done >= LADDER_STEPS && w.held[band] && passed) { const g = opts.gate ? opts.gate() : { ok: true }; if (g.ok) { const nb = bandUpNow(); save(); return { passed, unlocked: false, bandUp: !!nb, nextBand: nb, confirmed, level: LADDER_STEPS, complete: true }; } save(); return { passed, unlocked: false, bandUp: false, bandHeld: true, missing: g.missing, confirmed, level: LADDER_STEPS, complete: true }; }
      if (!passed || level !== done + 1) { save(); return { passed, unlocked: false, bandUp: false, confirmed, level: Math.min(LADDER_STEPS, done + 1) }; }
      done++; let skipped = false; if (opts.skip && done < LADDER_STEPS) { done++; skipped = true; } w.done[band] = done; if (opts.provisional && !confirmed && done < LADDER_STEPS) w.prov[band] = done;
      let bandUp = false, nextBand = band, bandHeld = false, missing = null;
      if (done >= LADDER_STEPS) { const g = opts.gate ? opts.gate() : { ok: true }; if (g.ok) { const nb = bandUpNow(); if (nb) { nextBand = nb; bandUp = true; } } else { w.held[band] = true; bandHeld = true; missing = g.missing; } }
      save(); return { passed: true, unlocked: true, bandUp, nextBand, bandHeld, missing, confirmed, skipped, level: Math.min(LADDER_STEPS, w.done[band] + 1), complete: w.done[band] >= LADDER_STEPS };
    }
  };

  // ---------- feedback grounded in the research: praise the PROCESS, not the child (Mueller & Dweck 1998); make errors informational
  //            (Hattie & Timperley 2007; Kluger & DeNisi 1996); keep rewards quiet so motivation stays intrinsic (Deci, Koestner & Ryan 1999) ----------
  const praise = {
    pool(key) { return t(key).split('|').map(x => x.trim()).filter(Boolean); },
    pickFrom(key, seed) { const p = praise.pool(key); return p[(seed == null ? Math.floor(Math.random() * p.length) : seed) % p.length]; },
    ok(o) { o = o || {}; if (o.proved) return praise.pickFrom('fb_proved'); if (o.hint) return praise.pickFrom('fb_okHint'); if (o.fast) return praise.pickFrom('fb_okFast'); return praise.pickFrom('fb_ok'); },
    bad(answer) { return (answer == null || answer === '') ? praise.pickFrom('fb_badNoAns') : t('fb_bad', { a: answer }); },
    grow() { return praise.pickFrom('fb_grow'); },
    steady(n) { return t('fb_steady', { n }); },
    // the report: what the child did, in process terms, plus their own last round as the yardstick
    summary(r) { const c = r.correct || 0, n = r.total || 0, m = n - c; let s = t('rp_effort', { c, n }); if (m > 0) s += ' ' + t('rp_fixed', { m }); if (r.bestStreak >= 5) s += ' ' + t('rp_steady', { n: r.bestStreak }); return s; },
    lastTime(pid, world, mode, row) { const rs = (state.results || []).filter(x => x.pid === pid && x.world === world && x.mode === mode && x !== row && x.total); const prev = rs[rs.length - 1]; if (!prev) return null; const a = prev.correct, b = prev.total, c = row.correct, n = row.total; return t(c / n > a / b + 1e-9 ? 'rp_better' : c / n < a / b - 1e-9 ? 'rp_dip' : 'rp_same', { a, b, c, n }); }
  };

  // ---------- rotation: a player should not meet the same question twice while fresh ones remain; per world × band × skill, the last 400 keys ----------
  const rotate = {
    cap: 400,
    _set(pid, world, band, skill) { state.qseen = state.qseen || {}; const P = state.qseen[pid] = state.qseen[pid] || {}; const k = world + ':' + band + ':' + skill; return P[k] = P[k] || []; },
    seen(pid, world, band, skill, key) { return rotate._set(pid, world, band, skill).includes(key); },
    note(pid, world, band, skill, key) { const s = rotate._set(pid, world, band, skill); if (!s.includes(key)) { s.push(key); if (s.length > rotate.cap) s.splice(0, s.length - rotate.cap); save(); } },
    // pick(genFn, tries): call the generator up to `tries` times and prefer a key never shown to this player; when the whole pool is exhausted, forget it and start the rotation again
    pick(pid, world, band, skill, gen, keyOf, ok, tries) { let first = null; for (let i = 0; i < (tries || 24); i++) { const c = gen(); if (!c) continue; if (ok && !ok(c)) continue; first = first || c; if (!rotate.seen(pid, world, band, skill, keyOf(c))) return c; } state.qseen[pid][world + ':' + band + ':' + skill] = []; save(); return first; }
  };

  // ---------- secret eggs: three hidden on the kingdom map; each opens a hard challenge in one world; passing hatches a bunny avatar ----------
  const eggs = {
    ids: ['egg:1', 'egg:2', 'egg:3'],
    world: { 'egg:1': 'logic', 'egg:2': 'math', 'egg:3': 'reading' },
    avatar: { 'egg:1': 'e:rose', 'egg:2': 'e:sunflower', 'egg:3': 'e:tulip' },
    _s(pid) { state.eggs = state.eggs || {}; return state.eggs[pid] = state.eggs[pid] || { found: [], won: [] }; },
    found(pid) { return eggs._s(pid).found.slice(); },
    find(pid, id) { const s = eggs._s(pid); if (!s.found.includes(id)) { s.found.push(id); save(); } return !s.won.includes(id); },
    won(pid, id) { return eggs._s(pid).won.includes(id); },
    win(pid, id) { const s = eggs._s(pid), key = eggs.avatar[id]; if (!key) return null; if (!s.won.includes(id)) s.won.push(id); state.avatars = state.avatars || {}; const list = state.avatars[pid] = state.avatars[pid] || []; if (!list.some(a => a.id === key)) list.push({ id: key, egg: true, label: id, ts: Date.now() }); save(); return key; }
  };

  // ---------- player-made riddle eggs: a child who has climbed every world of an age band may leave one egg on the map, with a riddle, for others to find ----------
  const EGG_WORLDS = ['math', 'reading', 'memory', 'clock', 'market', 'spelling', 'logic', 'story'];
  const playerEggs = {
    list() { return state.playerEggs = state.playerEggs || []; },
    bandsDone(pid) { let n = 0; for (const b of [1, 2, 3, 4, 5, 6]) if (EGG_WORLDS.every(w => ladder.get(pid, w, b).complete)) n++; return n; },
    made(pid) { return playerEggs.list().filter(e => e.by === pid).length; },
    canCreate(pid) { const allowed = playerEggs.bandsDone(pid), made = playerEggs.made(pid); return { allowed, made, left: Math.max(0, allowed - made) }; },
    create(pid, o) { if (playerEggs.canCreate(pid).left <= 0) return null; const e = { id: 'pe:' + Date.now().toString(36), by: pid, x: +o.x, z: +o.z, color: o.color || '#ffd35a', emoji: o.emoji || '⭐', q: String(o.q || '').trim().slice(0, 200), a: String(o.a || '').trim().slice(0, 80), solved: [], ts: Date.now() }; playerEggs.list().push(e); save(); return e; },
    remove(id) { state.playerEggs = playerEggs.list().filter(e => e.id !== id); save(); },
    get(id) { return playerEggs.list().find(e => e.id === id) || null; },
    norm(s) { return String(s).toLowerCase().replace(/[֑-ׇ]/g, '').replace(/[.,!?;:"'()\-–—]/g, ' ').replace(/\s+/g, ' ').trim(); },
    solve(pid, id, answer) { const e = playerEggs.get(id); if (!e) return false; const ok = playerEggs.norm(answer) === playerEggs.norm(e.a); if (ok && !e.solved.includes(pid)) { e.solved.push(pid); elements.grant(pid, 2); } return ok; }
  };

  // ---------- the Avatar Lab's shelf: every mix a player has made (Yoni 2026-09-29). Mixes are paid for in elements (see elements below),
  //            so there are no forge credits and no cap. Keys: 'f:<animal>-<fruit>' = the pre-painted library; 'c:<cat>:<a>-<b>' = a painted
  //            mix whose 4-frame strip (a small webp data URL) is kept with the player. ----------
  const forge = {
    list(pid) { return ((state.avatars || {})[pid] || []); },
    owns(pid, key) { return forge.list(pid).some(a => a.id === key); },
    add(pid, key, label, strip) { state.avatars = state.avatars || {}; const list = state.avatars[pid] = state.avatars[pid] || []; if (!list.some(a => a.id === key)) list.push(Object.assign({ id: key, label, ts: Date.now() }, strip ? { strip } : {})); if (strip && window.KQAvatars) KQAvatars.registerCustom(key, strip); save(); return key; },
    register() { if (!window.KQAvatars) return; for (const pid in (state.avatars || {})) for (const a of state.avatars[pid]) if (a.strip) KQAvatars.registerCustom(a.id, a.strip); }
  };
  // ---------- unified scoring: the single rulebook every world uses ----------
  const score = {
    FAST_MS: { math: 4000, reading: 5000 },
    PATH_BONUS: 5,   // for showing a solution step when asked to prove an answer was not a lucky guess
    stars(correct, total) { const a = total ? correct / total : 0; return a >= 0.999 ? 3 : a >= 0.8 ? 2 : a >= 0.6 ? 1 : 0; },
    // one answer: 10 base, +5 on a streak of 3+, +5 when fast (or always with the time charm); a hint halves it unless the hint lantern is active
    answer(a) { if (!a.ok) return 0; let p = 10 + (a.streak >= 3 ? 5 : 0) + ((a.ms != null && a.ms < (a.fastMs || 4000)) || a.potion === 'time' ? 5 : 0); if (a.hint && a.potion !== 'hint') p = Math.ceil(p / 2); return p; },
    perfectBonus(correct, total) { return total >= 5 && correct === total ? 20 : 0; },
    chess(g) { const win = g.result === 'win', draw = g.result === 'draw'; return { stars: win ? 3 : draw ? 1 : 0, points: win ? 100 + (g.mode === 'cpu' ? 25 * (g.level || 1) : 50) : draw ? 40 : 10, result: g.result }; },
    lesson(stepsDone, steps) { return { stars: stepsDone >= steps ? 3 : stepsDone > 0 ? 1 : 0, points: 15 * stepsDone }; }
  };

  // ---------- treasure economy: coins, gems, potions, collectibles ----------
  const POTIONS = [
    { id: 'double', e: '🧪', price: 30 }, { id: 'shield', e: '🛡️', price: 20 }, { id: 'hint', e: '🏮', price: 15 }, { id: 'time', e: '⏳', price: 25 }
  ];
  const ITEMS = [
    { id: 'key', e: '🗝️', r: 'common' }, { id: 'feather', e: '🪶', r: 'common' }, { id: 'mushroom', e: '🍄', r: 'common' }, { id: 'shell', e: '🐚', r: 'common' }, { id: 'log', e: '🪵', r: 'common' }, { id: 'candle', e: '🕯️', r: 'common' }, { id: 'apple', e: '🍎', r: 'common' }, { id: 'thread', e: '🧵', r: 'common' },
    { id: 'sword', e: '⚔️', r: 'rare' }, { id: 'map', e: '🗺️', r: 'rare' }, { id: 'compass', e: '🧭', r: 'rare' }, { id: 'lantern', e: '🏮', r: 'rare' }, { id: 'scroll', e: '📜', r: 'rare' },
    { id: 'crown', e: '👑', r: 'epic' }, { id: 'crystal', e: '🔮', r: 'epic' }, { id: 'dragon', e: '🐲', r: 'epic' }
  ];
  const inv = pid => { const v = state.inv[pid] || (state.inv[pid] = { coins: 0, gems: 0, potions: {}, items: {} }); v.potions = v.potions || {}; v.items = v.items || {}; return v; };
  /* ---------- mix tickets (Yoni 2026-09-29): a new avatar mix is EARNED by play, then paid for with elements. One ticket each time a level
     opens in any world (depth: go further in the game you love) and one each time the child has finished a round in every world of the
     TOUR (breadth: go through everything). The first avatar is made free, by the mixer, when the player is created. ---------- */
  const TOUR = ['math', 'reading', 'chess', 'memory', 'clock', 'market', 'spelling', 'logic', 'story'];
  const tickets = {
    tour: TOUR,
    _v(pid) { const v = inv(pid); v.tix = v.tix || { n: 0, tour: [], log: [] }; return v.tix; },
    count(pid) { return tickets._v(pid).n; },
    /* Yoni 2026-10-03: the language lesson after a level is part of finishing a game — a game whose new level still waits for its
       second-language lesson (ladder bw) is not done on the path until that lesson is passed. Read-only: never creates a ladder entry */
    waiting(pid, w) { const L = state.ladder && state.ladder[pid]; return !!(L && L[w] && L[w].bw); },
    progress(pid) { const x = tickets._v(pid), ok = w => x.tour.includes(w) && !tickets.waiting(pid, w); return { done: TOUR.filter(ok), left: TOUR.filter(w => !ok(w)), wait: TOUR.filter(w => x.tour.includes(w) && tickets.waiting(pid, w)) }; },
    earn(pid, why, world) { if (!profiles.get(pid)) return; const x = tickets._v(pid); x.n++; x.log.push({ why, world: world || null, ts: Date.now() }); if (x.log.length > 60) x.log.splice(0, x.log.length - 60); save();
      try { document.dispatchEvent(new CustomEvent('kq:ticket', { detail: { pid, why, world } })); } catch (e) {} },
    visit(pid, world) { if (!TOUR.includes(world)) return; const x = tickets._v(pid); if (x.tour.includes(world)) return; x.tour.push(world); save(); setTimeout(() => tickets.check(pid, world), 0); },   /* after this tick: the round is recorded just before its level-up (and any language lesson it brings) is decided */
    /* the whole path: every game played AND no language lesson left waiting → a new mix AND a signature on Mount Glory */
    check(pid, world) { const x = tickets._v(pid), pr = tickets.progress(pid);
      if (!pr.left.length) { x.tour = []; x.sign = (x.sign || 0) + 1; tickets.earn(pid, 'tour'); return; }
      save(); if (world && !tickets.waiting(pid, world)) try { document.dispatchEvent(new CustomEvent('kq:tour', { detail: { pid, d: pr.done.length, n: TOUR.length } })); } catch (e) {} },
    spend(pid) { const x = tickets._v(pid); if (x.n < 1) return false; x.n--; save(); return true; },
    refund(pid) { tickets._v(pid).n++; save(); }
  };
  /* Mount Glory (Yoni 2026-09-29): a child who has finished a round in every game signs the mountain — their mark, with the avatar they wear */
  const mountain = {
    list() { return (state.mountain || []).slice(); },
    pending(pid) { return tickets._v(pid).sign || 0; },
    sign(pid, text) { const x = tickets._v(pid), p = profiles.get(pid); if (!p || !(x.sign > 0)) return false; x.sign--; (state.mountain = state.mountain || []).push({ pid, name: p.name, avatar: p.avatar, text: String(text || '').trim().slice(0, 40), ts: Date.now() }); save(); return true; }   /* text: what the child chose to write on the mountain (Yoni 2026-10-03) */
  };
  /* ---------- elements (Yoni 2026-09-29: 'not coins that people can use to buy items … elements … a combination of elements lets you run
     an avatar mix'): every finished assignment drops a few at random — more for more stars. They open the Avatar Lab's mix categories
     (shared/mixes.js: opensAt = elements collected in all) and a mix spends its recipe. Potions are found, never bought. ---------- */
  const ELEMENT_IDS = ['fire', 'water', 'earth', 'wind', 'light', 'frost'];
  const pickEl = () => ELEMENT_IDS[Math.floor(Math.random() * ELEMENT_IDS.length)];
  const elements = {
    ids: ELEMENT_IDS,
    of(pid) { const v = inv(pid); v.el = v.el || {}; if (v.elAll == null) { const n = Math.min(30, Math.floor(((v.coins || 0) + (v.gems || 0) * 3) / 40)); for (let i = 0; i < n; i++) { const id = pickEl(); v.el[id] = (v.el[id] || 0) + 1; } v.elAll = n; save(); }   /* a player from the coin days: coins and gems become a first handful, once */ return v.el; },
    held(pid) { const h = elements.of(pid); return ELEMENT_IDS.reduce((a, k) => a + (h[k] || 0), 0); },
    total(pid) { elements.of(pid); return inv(pid).elAll || 0; },
    grant(pid, n) { const h = elements.of(pid), v = inv(pid), got = []; for (let i = 0; i < n; i++) { const id = pickEl(); h[id] = (h[id] || 0) + 1; got.push(id); } v.elAll = (v.elAll || 0) + n; save(); return got; },
    has(pid, recipe) { const h = elements.of(pid); return Object.keys(recipe || {}).every(k => (h[k] || 0) >= recipe[k]); },
    spend(pid, recipe) { if (!elements.has(pid, recipe)) return false; const h = elements.of(pid); for (const k in recipe) h[k] -= recipe[k]; save(); return true; },
    refund(pid, recipe) { const h = elements.of(pid); for (const k in recipe) h[k] = (h[k] || 0) + recipe[k]; save(); },
    group(ids) { const g = {}; for (const id of ids || []) g[id] = (g[id] || 0) + 1; return g; },
    icon: id => ({ fire: '🔥', water: '💧', earth: '🌱', wind: '🌪', light: '✨', frost: '❄' })[id] || '✨'
  };
  function rollPotion(stars, forced) { const p = forced ? 1 : [0.05, 0.2, 0.4, 0.65][Math.min(3, stars)]; if (Math.random() > p) return null; return POTIONS[Math.floor(Math.random() * POTIONS.length)]; }
  function rollDrop(stars, forced) {
    const p = forced ? 1 : [0.05, 0.2, 0.4, 0.65][Math.min(3, stars)];
    if (Math.random() > p) return null;
    const r = Math.random(), tier = r < 0.08 ? 'epic' : r < 0.35 ? 'rare' : 'common';
    const pool = ITEMS.filter(i => i.r === tier); return pool[Math.floor(Math.random() * pool.length)];
  }

  // ---------- skill tracking: what each kid finds hard (per world, per skill, per concept tag) ----------
  const LANG_WORLDS = ['reading', 'spelling', 'story', 'memory'];
  function skillMap(pid, world) { const s = state.skills[pid] || (state.skills[pid] = {}); return s[world] || (s[world] = {}); }
  const rate = s => { const last = s.last || ''; if (!last.length) return null; let ok = 0; for (const c of last) if (c === '1') ok++; return ok / last.length; };
  const skills = {
    // record one answer: key = skill id, tags = concept tags (e.g. 'bridge10', 'x7', 'borrow', letter 'ב'); the skill id is also tracked as a tag
    note(world, a) {
      const p = profiles.active(); if (!p) return;
      const maps = [skillMap(p.id, world)]; if (LANG_WORLDS.includes(world)) maps.push(skillMap(p.id, world + '@' + (state.lang === 'he' ? 'he' : 'en')));   /* language worlds also keep a copy per language, so a parent sees Hebrew and English reading apart */
      for (const m of maps) for (const k of new Set([a.key].concat(a.tags || []).filter(Boolean))) { const s = m[k] || (m[k] = { n: 0, ok: 0, last: '' }); s.n++; if (a.ok) s.ok++; s.last = (s.last + (a.ok ? '1' : '0')).slice(-20); s.ts = Date.now(); }
      save();
    },
    stats(pid, world) { const m = skillMap(pid, world), out = {}; for (const k in m) out[k] = { n: m[k].n, ok: m[k].ok, rate: rate(m[k]), recent: m[k].last.length, ts: m[k].ts || 0 }; return out; },
    // tricky concepts: at least 3 recent answers and at most 60% right (worst first)
    weak(pid, world, n) { const st = skills.stats(pid, world); return Object.keys(st).filter(k => st[k].recent >= 3 && st[k].rate <= 0.6).sort((a, b) => st[a].rate - st[b].rate || st[b].ts - st[a].ts).slice(0, n || 3).map(k => ({ key: k, rate: st[k].rate, n: st[k].n })); },
    mastered(pid, world, n) { const st = skills.stats(pid, world); return Object.keys(st).filter(k => st[k].recent >= 6 && st[k].rate >= 0.9).sort((a, b) => st[b].n - st[a].n).slice(0, n || 6); },
    forget(pid, world) { if (state.skills[pid]) for (const w of [world, world + '@he', world + '@en']) delete state.skills[pid][w]; save(); },
    // what the games should do next for this kid: which concepts to serve more, and where to switch on extra help
    plan(pid, world) { const m = skillMap(pid, world), weak = skills.weak(pid, world, 5).map(w => w.key), easy = {}; for (const k in m) { const last5 = m[k].last.slice(-5); const fails = last5.split('').filter(c => c === '0').length; const last3 = m[k].last.slice(-3); if (last5.length >= 4 && fails >= 3 && !(last3.length === 3 && last3 === '111')) easy[k] = true; } return { focus: weak, boost: weak.length ? Math.min(0.8, 0.5 + 0.08 * weak.length) : 0, easy, helpOn: Object.keys(easy) }; }
  };

  // ---------- learning journal: the actual mistakes, per kid, so a parent (and the games) can see where it goes wrong ----------
  // ---------- intros a returning player may skip (Yoni 2026-09-29: 'a repeated user that already knows what to do … just press skip'):
  // the first time, every intro plays in full; once seen (per player), a Skip button offers the way past it. The rocket to space is never
  // skipped — after one full take-off and one full landing it offers 'Faster' (×1.5) instead. One floating button, any page. ----------
  const intro = {
    _pid() { const p = profiles.active(); return p ? p.id : '_'; },
    _m() { const all = state.introSeen || (state.introSeen = {}); return all[intro._pid()] || (all[intro._pid()] = {}); },
    seen(id) { return !!intro._m()[id]; },
    mark(id) { const m = intro._m(); if (!m[id]) { m[id] = Date.now(); save(); } },
    unmark(id) { const m = intro._m(); if (m[id]) { delete m[id]; save(); } },
    _btn: null,
    // show the floating button; label defaults to Skip. It goes away when pressed (unless keep) or on clear()
    offer(onPress, label, keep) { let b = intro._btn; if (!b) { b = intro._btn = document.createElement('button'); b.type = 'button'; b.className = 'kq-skip'; document.body.appendChild(b);
        if (!document.getElementById('kq-skip-css')) { const st = document.createElement('style'); st.id = 'kq-skip-css'; st.textContent = '.kq-skip{position:fixed; top:calc(14px + env(safe-area-inset-top,0px)); inset-inline-end:14px; z-index:2147483000; padding:10px 20px; border-radius:999px; border:2px solid #d8b04a; background:rgba(255,250,236,.95); color:#2a1a30; font:800 17px var(--font-body, Rubik, sans-serif); cursor:pointer; box-shadow:0 6px 18px rgba(0,0,0,.3)} .kq-skip[hidden]{display:none} .kq-skip:active{transform:translateY(1px)}'; document.head.appendChild(st); } }
      b.textContent = label || t('skip'); b.hidden = false; b.onclick = e => { e.stopPropagation(); if (!keep) intro.clear(); onPress(); }; },
    clear() { if (intro._btn) { intro._btn.hidden = true; intro._btn.onclick = null; } }
  };

  const journal = {
    add(world, e) { const p = profiles.active(); if (!p) return; const j = state.journal || (state.journal = {}); const arr = j[p.id] || (j[p.id] = []); arr.push(Object.assign({ ts: Date.now(), world }, e)); if (arr.length > 150) arr.splice(0, arr.length - 150); save(); },
    list(pid, world, n) { const arr = ((state.journal || {})[pid] || []).filter(e => !world || e.world === world).slice().reverse(); return n ? arr.slice(0, n) : arr; },
    clear(pid) { if (state.journal) delete state.journal[pid]; save(); }
  };
  // ---------- results, progress, badges ----------
  const CASTLE_STEPS = [0, 5, 15, 30, 50, 80, 120, 170, 230, 300];
  const castleStage = stars => { let s = 0; for (let i = 0; i < CASTLE_STEPS.length; i++) if (stars >= CASTLE_STEPS[i]) s = i; return s; };
  const BADGES = [
    { id: 'first', e: '🗺️', test: (p, rs) => rs.length >= 1 },
    { id: 'math100', e: '🧙', test: p => p.byWorld.math.correct >= 100 },
    { id: 'read50', e: '🌸', test: p => p.byWorld.reading.correct >= 50 },
    { id: 'chesswin', e: '👑', test: p => p.byWorld.chess.wins >= 1 },
    { id: 'chess5', e: '♛', test: p => p.byWorld.chess.wins >= 5 },
    { id: 'streak3', e: '🔥', test: p => p.streak.best >= 3 },
    { id: 'perfect', e: '💯', test: (p, rs) => rs.some(r => r.total >= 8 && r.correct === r.total) },
    { id: 'allworlds', e: '🧭', test: p => WORLDS.every(w => p.byWorld[w].rounds > 0) },
    { id: 'stars50', e: '⭐', test: p => p.stars >= 50 },
    { id: 'speed', e: '⚡', test: (p, rs) => rs.some(r => r.total >= 8 && r.avgMs && r.avgMs < 3000 && r.correct / r.total >= 0.9) },
    { id: 'thinker', e: '🧠', test: (p, rs) => rs.filter(r => r.howtos >= 2).length >= 3 },
    { id: 'collector', e: '🧰', test: p => p.elements >= 30 }
  ];
  function progress(pid) {
    const rs = state.results.filter(r => r.pid === pid), v = inv(pid);
    const p = { pid, points: 0, stars: 0, rounds: rs.length, byWorld: {}, badges: [], streak: { current: 0, best: 0, today: false }, elements: elements.total(pid) };
    const blank = () => ({ stars: 0, points: 0, rounds: 0, correct: 0, total: 0, wins: 0, losses: 0, draws: 0, best: 0 });
    for (const w of WORLDS) p.byWorld[w] = blank();
    for (const r of rs) { const b = p.byWorld[r.world] || (p.byWorld[r.world] = blank()); b.stars += r.stars || 0; b.points += r.points || 0; b.rounds++; b.correct += r.correct || 0; b.total += r.total || 0; const res = r.result || (r.win ? 'win' : null); if (res === 'win') b.wins++; else if (res === 'loss') b.losses++; else if (res === 'draw') b.draws++; b.best = Math.max(b.best, r.points || 0); p.points += r.points || 0; p.stars += r.stars || 0; }
    const days = [...new Set(rs.map(r => dayKey(new Date(r.ts))))].sort();
    let cur = 0, best = 0, prev = null;
    for (const d of days) { const dt = new Date(d + 'T12:00:00'); if (prev && (dt - prev) / 86400000 <= 1.5) cur++; else cur = 1; best = Math.max(best, cur); prev = dt; }
    const today = dayKey(), yest = dayKey(new Date(Date.now() - 86400000));
    p.streak = { current: (days.includes(today) || days.includes(yest)) ? cur : 0, best, today: days.includes(today) };
    p.castle = castleStage(p.stars);
    p.badges = BADGES.filter(b => b.test(p, rs)).map(b => b.id);
    return p;
  }
  const store = {
    profiles, progress, BADGES, CASTLE_STEPS, castleStage, WORLDS, AVATARS, score, skills, POTIONS, ITEMS, elements,
    get settings() { return state.settings; }, setSetting(k, v) { state.settings[k] = v; save(); },
    results(pid, n) { const rs = state.results.filter(r => !pid || r.pid === pid).slice().reverse(); return n ? rs.slice(0, n) : rs; },
    inventory(pid) { return inv(pid || (profiles.active() || {}).id); },
    activePotion(pid) { const id = pid || (profiles.active() || {}).id; return id ? state.active[id] || null : null; },
    usePotion(pid, potion) { const v = inv(pid); if (!v.potions[potion]) return false; v.potions[potion]--; state.active[pid] = potion; save(); return true; },
    cancelPotion(pid) { const cur = state.active[pid]; if (!cur) return; inv(pid).potions[cur] = (inv(pid).potions[cur] || 0) + 1; delete state.active[pid]; save(); },
    // record a finished round/game for any profile; drops elements (more for more stars), sometimes a potion, consumes the active potion.
    // returns {progress, newBadges, castleUp, row, elements: [ids], potion, potionUsed}
    recordFor(pid, world, r) {
      const p = profiles.get(pid); if (!p) return null;
      const before = progress(p.id), v = inv(p.id);
      const potionUsed = state.active[p.id] || null; if (potionUsed) delete state.active[p.id];
      const row = Object.assign({ pid: p.id, world, ts: Date.now(), stars: 0, points: 0, correct: 0, total: 0, realm: realm.id, lang: state.lang === 'he' ? 'he' : 'en' }, r, { potion: potionUsed });
      state.results.push(row); { const PER = 1500, mine = state.results.filter(x => x.pid === p.id); if (mine.length > PER) { const old = new Set(mine.slice(0, mine.length - PER)); state.results = state.results.filter(x => !old.has(x)); } if (state.results.length > 6000) state.results = state.results.slice(-6000); }   /* each child keeps their last 1,500 rounds (it was 600 for the whole family) */
      if ((row.correct || 0) > 0 || row.result === 'win' || (row.points || 0) > 0) tickets.visit(p.id, world);
      const worked = (row.correct || 0) > 0 || row.result === 'win' || (row.points || 0) > 0;
      const nEl = worked ? Math.min(5, Math.max(1, (row.stars || 0) + (row.result === 'win' ? 1 : 0)) + (r.bonus || 0)) : 0;   /* bonus: a won arena or arcade game */
      const got = nEl ? elements.grant(p.id, nEl) : [];
      const potion = r.noDrop ? null : rollPotion(row.stars || 0, row.result === 'win' || !!r.drop); if (potion) v.potions[potion.id] = (v.potions[potion.id] || 0) + 1;
      save();
      const after = progress(p.id);
      const newBadges = after.badges.filter(b => !before.badges.includes(b));
      document.dispatchEvent(new CustomEvent('kq:result', { detail: { row, after } }));
      save();
      return { progress: after, newBadges, castleUp: after.castle > before.castle, row, elements: got, potion, item: null, potionUsed };
    },
    record(world, r) { const p = profiles.active(); return p ? store.recordFor(p.id, world, r) : null; },
    leaderboard() { return state.profiles.map(p => Object.assign({ profile: p }, progress(p.id))).sort((a, b) => b.points - a.points || b.stars - a.stars); },
    starsFor: score.stars,
    exportJSON() { return JSON.stringify(state); }
  };

  // ---------- sounds ----------
  const sfx = (() => {
    let ctx = null, bus = null, unlocked = false;
    // studio-made effects (ElevenLabs sound generation) for the sounds a child hears most; the synth below remains the fallback
    const SFX_BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '') + 'sfx/';
    const FILES = { wrong: 'wrong.mp3', star: 'round.mp3', tap: 'tap.mp3' }, VOL = { wrong: 0.55, star: 0.75, tap: 0.35 }, cache = {};   /* a point is the soft chime below, not correct.mp3 (Yoni 2026-10-05: 'something more pleasant') */
    function file(name) { if (!FILES[name]) return null; if (!cache[name]) { const a = new Audio(SFX_BASE + FILES[name] + '?v=1'); a.preload = 'auto'; cache[name] = a; } return cache[name]; }
    function playFile(name) { const a = file(name); if (!a) return false; try { const c = a.cloneNode(); c.volume = VOL[name] || 0.6; const p = c.play(); if (p && p.catch) p.catch(() => {}); return true; } catch (e) { return false; } }
    function ensure() { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; if (!ctx) { ctx = new AC(); bus = ctx.createGain(); bus.gain.value = 0.6; bus.connect(ctx.destination); } if (ctx.state === 'suspended') ctx.resume(); unlocked = true; return ctx; }
    function tone(type, f0, f1, tt, dur, vel) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), tt + dur); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vel, tt + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur); o.connect(g); g.connect(bus); o.start(tt); o.stop(tt + dur + 0.03); }
    // muted voice: oscillator through a low-pass so nothing buzzes; bell = sine plus a quiet detuned octave with a long soft decay (music-box feel)
    function soft(type, f0, f1, tt, dur, vel, cutoff) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), tt + dur); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff || 1200; lp.Q.value = 0.7; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vel, tt + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur); o.connect(lp); lp.connect(g); g.connect(bus); o.start(tt); o.stop(tt + dur + 0.03); }
    function bell(f, tt, dur, vel) { soft('sine', f, f, tt, dur, vel, 4000); soft('sine', f * 2.005, f * 2.005, tt, dur * 0.6, vel * 0.28, 6000); }
    let nbuf = null; function noiseBuf() { if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nbuf; }
    function seq(notes, type, vel) { const tt = ctx.currentTime + 0.01; let at = tt; for (const [f, d] of notes) { tone(type || 'triangle', f, f, at, d, vel || 0.25); at += d * 0.9; } }
    function play(name) {
      if (!state.settings.sfx) return; if (FILES[name] && playFile(name)) return; if (!ensure()) return;
      switch (name) {
        case 'tap': tone('sine', 700, 700, ctx.currentTime, 0.05, 0.1); break;
        case 'correct': { const tt = ctx.currentTime + 0.01; bell(880, tt, 0.7, 0.15); bell(1318.5, tt + 0.09, 0.95, 0.13); soft('sine', 2637, 2637, tt + 0.09, 0.4, 0.025, 8000); break; }   // a point: a soft music-box 'ding-ding' (A5, then E6: a perfect fifth) with a faint shimmer
        case 'wrong': { const tt = ctx.currentTime + 0.01; soft('triangle', 262, 262, tt, 0.16, 0.16, 900); soft('triangle', 220, 220, tt + 0.16, 0.26, 0.15, 800); break; }   // a soft, muted "hmm" — never a buzzer
        case 'star': seq([[880, 0.08], [1175, 0.08], [1568, 0.25]], 'sine', 0.2); break;
        case 'win': { const tt = ctx.currentTime + 0.01; [523, 659, 784, 1047].forEach((f, i) => bell(f, tt + i * 0.11, i === 3 ? 0.7 : 0.35, 0.2)); break; }
        case 'fanfare': { const tt = ctx.currentTime + 0.01; [[392, 0], [523, 0.1], [659, 0.2], [784, 0.3], [659, 0.55], [784, 0.65], [1047, 0.75]].forEach(([f, at], i) => bell(f, tt + at, i === 6 ? 0.9 : 0.35, 0.2)); break; }
        case 'badge': seq([[784, 0.1], [988, 0.1], [1175, 0.1], [1568, 0.4]], 'triangle', 0.22); break;
        case 'eerie': { const tt = ctx.currentTime + 0.01;   // the way into a skull-world game: a cold draught and a low moan (synthesised here — no sound files)
          const n = ctx.createBufferSource(); n.buffer = noiseBuf(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2; bp.frequency.setValueAtTime(260, tt); bp.frequency.exponentialRampToValueAtTime(1100, tt + 0.7); bp.frequency.exponentialRampToValueAtTime(380, tt + 1.6); const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, tt); ng.gain.exponentialRampToValueAtTime(0.32, tt + 0.5); ng.gain.exponentialRampToValueAtTime(0.0001, tt + 1.7); n.connect(bp); bp.connect(ng); ng.connect(bus); n.start(tt); n.stop(tt + 1.8);
          for (const [f, d] of [[196, 0], [233, 0.06]]) { const at = tt + 0.25 + d, o = ctx.createOscillator(), v = ctx.createOscillator(), vg = ctx.createGain(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(f * 0.74, tt + 1.7); v.frequency.value = 5.2; vg.gain.value = f * 0.018; v.connect(vg); vg.connect(o.frequency); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.1, tt + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.9); o.connect(g); g.connect(bus); o.start(at); o.stop(tt + 2.0); v.start(at); v.stop(tt + 2.0); }
          break; }
        case 'coin': { const tt = ctx.currentTime + 0.01; bell(1319, tt, 0.12, 0.12); bell(1760, tt + 0.07, 0.3, 0.12); break; }
        case 'chest': seq([[440, 0.1], [554, 0.1], [659, 0.1], [880, 0.3], [1109, 0.35]], 'triangle', 0.2); break;
        case 'step': tone('triangle', 520, 640, ctx.currentTime, 0.12, 0.12); break;
      }
    }
    document.addEventListener('pointerdown', () => { if (!unlocked) ensure(); }, { passive: true });
    return { ensure, play };
  })();

  // ---------- speech: the calm teacher voice, ElevenLabs only (a studio sprite, or the kq-relay). NEVER the device's speech voice
  // (Yoni 2026-09-28: 'never, ever use the generic voice of the computer'): when ElevenLabs cannot answer, the line stays silent. ----------
  const DEFAULT_RELAY = 'https://elnmuuymfmlwnsynzgrh.supabase.co/functions/v1/kq-relay';   // the studio relay (ElevenLabs + Avatar Forge): Kingdom Quest's own Supabase project (2026-09-28)
  const OLD_RELAYS = ['https://hgdputgqjpnvmirhifwg.supabase.co/functions/v1/kq-relay'];   /* its first home (a shared project): a device that saved it moves to the new one */
  let ttsEndpoint = window.KQ_TTS_ENDPOINT || ''; try { const saved = localStorage.getItem('kq.tts') || ''; if (OLD_RELAYS.includes(saved)) localStorage.removeItem('kq.tts'); else ttsEndpoint = ttsEndpoint || saved; } catch (e) {}
  ttsEndpoint = ttsEndpoint || DEFAULT_RELAY;
  const tts = { get endpoint() { return ttsEndpoint; }, set endpoint(v) { ttsEndpoint = v || ''; try { if (!ttsEndpoint || ttsEndpoint === DEFAULT_RELAY) localStorage.removeItem('kq.tts'); else localStorage.setItem('kq.tts', ttsEndpoint); } catch (e) {} }, cache: new Map(), current: null, failures: 0 };
  // Studio voice without a server: pages load shared/voices/<lang>_map.js, which maps exact text to a clip inside one
  // ElevenLabs sprite (Alice for English, Noa for Hebrew). Anything not in the sprite goes to the relay (ElevenLabs); never the device voice.
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  // The sprite is fetched whole and played from a blob URL, so seeking works on any host (a plain URL needs HTTP ranges).
  function spriteFor(L) { const m = window['KQ_VOICES_' + String(L).toUpperCase()]; if (!m || !m.clips) return null; if (!m._load) m._load = fetch(m.base + m.file).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(b => new Audio(URL.createObjectURL(b))).catch(() => new Audio(m.base + m.file)).then(a => { a.preload = 'auto'; return a; }); return m; }
  /* the recorded speaker lines: one sprite per language (shared/voices/lines.js → lines_<lang>.mp3), played like the studio sprite,
     plus the voice packs a game brings along (window.KQ_LINE_PACKS, e.g. shared/voices/physics_lines.js): each its own sprite, fetched only when one of its lines is spoken */
  function linesFor(L, text) { for (const LN of [window.KQ_LINES].concat(window.KQ_LINE_PACKS || [])) { const m = LN && LN[L]; if (!m || !m.clips || !m.clips[text]) continue; if (!m._load) { m.base = LN.base; m._load = fetch(LN.base + m.file).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(b => new Audio(URL.createObjectURL(b))).catch(() => new Audio(LN.base + m.file)); } return m; } return null; }
  let speakSeq = 0;
  function playSprite(m, segs, onFail) {
    const seq = ++speakSeq;
    m._load.then(a => {
      if (seq !== speakSeq) return;                 // a newer line replaced this one while the sprite was loading
      tts.current = a; a._seq = seq; let i = 0, timer = null, guard = null, stopAt = 0;
      const mine = () => a._seq === seq && tts.current === a;   // one Audio element is shared: every callback checks it still owns it
      const clear = () => { clearTimeout(timer); clearTimeout(guard); a.removeEventListener('timeupdate', onTime); a.removeEventListener('seeked', onSeeked); };
      const finishClip = () => { clear(); a.pause(); timer = setTimeout(next, 220); };
      const onTime = () => { if (!mine()) return clear(); if (a.currentTime >= stopAt) finishClip(); };
      // play only once the seek has landed: a stale timeupdate from the previous clip would otherwise stop this one at birth
      let started = false;
      const onSeeked = () => { if (started) return; started = true; if (!mine()) return clear(); a.removeEventListener('seeked', onSeeked); clearTimeout(guard); a.addEventListener('timeupdate', onTime); timer = setTimeout(() => { if (mine()) finishClip(); }, Math.max(0, stopAt - a.currentTime) * 1000 + 150); a.play().catch(e => { if (mine() && !(e && e.name === 'AbortError')) { clear(); onFail(); } }); };
      function next() { if (!mine() || i >= segs.length) return; const [start, dur] = segs[i++]; stopAt = start + dur - 0.02; started = false; a.addEventListener('seeked', onSeeked); a.currentTime = start; guard = setTimeout(onSeeked, 400); }
      next();
    });
  }
  function speak(text, lang, opts) {
    if ((!state.settings.voice && !(opts && opts.force)) || !text) return;   // one switch silences every automatic voice; an explicit 🔊 tap (force) still speaks
    const L = lang || state.lang; speakSeq++;
    if (tts.current) { try { tts.current.pause(); } catch (e) {} tts.current = null; }
    const parts = (Array.isArray(text) ? text : [text]).map(norm).filter(Boolean); if (!parts.length) return;
    // a studio sprite for this language wins outright: play the parts it has and never drop to the device voice
    const m = spriteFor(L); if (m) { const have = parts.filter(p => m.clips[p]); if (have.length) return playSprite(m, have.map(p => m.clips[p]), () => {}); if (!ttsEndpoint) return; }
    text = parts.join(' ');
    /* lines recorded once and shipped with the game (shared/voices/lines.js → shared/voices/lines/<lang>/*.mp3): a published page cannot
       reach the relay, so every line a child can tap 🔊 on is recorded ahead of time (Yoni 2026-10-03: 'run it once and save the recordings') */
    { const ls = linesFor(L, text); if (ls) return playSprite(ls, [ls.clips[text]], () => {}); }
    if (!ttsEndpoint || tts.failures >= 3) return;   /* no ElevenLabs: silence, never the device voice */
    /* the family voices (Yoni 2026-09-28): Hebrew is read by mommy, and by daddy on the pages that ask for him (Math, the chess herald: KQ_PERSONA) */
    const persona = L === 'he' ? (window.KQ_PERSONA || 'mommy') : '';
    const my = speakSeq, key = L + '|' + persona + '|' + text; const play = url => { if (my !== speakSeq) return; const a = new Audio(url); tts.current = a; a.play().catch(() => {}); };
    if (tts.cache.has(key)) return play(tts.cache.get(key));
    const ask = () => fetch(ttsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(persona ? { text, lang: L, persona } : { text, lang: L }) }).then(r => { if (!r.ok) throw Object.assign(new Error(r.status), { status: r.status }); return r.blob(); });
    /* the relay now and then drops a connection (2026-09-28): one more try after a moment (a 4xx such as the daily cap is final), and only three
       failures IN A ROW silence the voice for the visit — before, any three failures did, so a long visit could go quiet for good */
    ask().catch(e => e.status && e.status < 500 ? Promise.reject(e) : new Promise(res => setTimeout(res, 350)).then(ask))
      .then(b => { tts.failures = 0; const url = URL.createObjectURL(b); tts.cache.set(key, url); play(url); }).catch(() => { tts.failures++; });
  }

  // ---------- common UI ----------
  function crownSvg(cls) {
    const svg = svgEl('svg', { viewBox: '0 0 64 40', class: cls || 'crown' });
    svg.appendChild(svgEl('path', { d: 'M4 34h56l-4-22-12 10-12-16-12 16L8 12z', fill: 'currentColor' }));
    [[8, 10], [32, 5], [56, 10]].forEach(([cx, cy]) => svg.appendChild(svgEl('circle', { cx, cy, r: 3, fill: 'currentColor' })));
    svg.appendChild(svgEl('rect', { x: 4, y: 34, width: 56, height: 4, fill: 'currentColor' }));
    return svg;
  }
  function starsEl(n, max) { const s = el('span', 'stars'); for (let i = 0; i < (max || 3); i++) s.appendChild(el('span', i < n ? '' : 'off', i < n ? '★' : '☆')); return s; }
  function ringEl(pct, label, color) { const r = el('div', 'ring'); r.style.setProperty('--p', Math.max(0, Math.min(100, pct))); if (color) r.style.setProperty('--c', color); r.appendChild(el('b', null, label)); return r; }
  function toast(msg) { const x = el('div', 'toast', msg); document.body.appendChild(x); setTimeout(() => x.remove(), 3100); }
  /* the corner code (Yoni 2026-09-29: 'an indication for parents … top right of the screen … new or doing it again, and their performance …
     code it so it won't be clear for kids'): two tiny dots and a small number at the very top-right while a question is up.
     1st dot: hollow ring = a question this child has never had, filled = one they had before. 2nd dot: their recent accuracy on this skill
     (green 80%+, amber 60–79%, red under 60%, grey = not enough answers yet). The number: age band · level. Parents read it in the Parents tab. */
  function peek(o) { let x = document.getElementById('kq-peek');
    if (!o) { if (x) x.hidden = true; return; }
    if (!x) { x = document.createElement('div'); x.id = 'kq-peek'; x.setAttribute('aria-hidden', 'true'); document.body.appendChild(x);
      const st = document.createElement('style'); st.textContent = '#kq-peek{position:fixed; top:calc(3px + env(safe-area-inset-top,0px)); right:4px; z-index:2147482000; display:flex; align-items:center; gap:3px; opacity:.5; pointer-events:none; font:600 9px/1 ui-monospace,Menlo,monospace; color:#9a93a6; direction:ltr} #kq-peek[hidden]{display:none} #kq-peek i{display:block; width:6px; height:6px; border-radius:50%} #kq-peek i.n{box-shadow:inset 0 0 0 1.5px #9a93a6} #kq-peek i.r{background:#9a93a6}'; document.head.appendChild(st); }
    const r = o.rate, col = r == null ? '#7a7485' : r >= 0.8 ? '#3fae62' : r >= 0.6 ? '#d6a02a' : '#c8503c';
    x.replaceChildren(); const a = document.createElement('i'); a.className = o.repeat ? 'r' : 'n'; const b = document.createElement('i'); b.style.background = col; x.append(a, b, document.createTextNode((o.band || '·') + '·' + (o.level || '·'))); x.hidden = false; }
  /* switching players from inside any game (Yoni 2026-09-29): tap your own chip, pick another player. onPick runs after the switch (a world
     page reloads, the hub re-renders); onAdd opens the avatar mixer (in a world page it goes home to the hub's mixer) */
  function switcher(anchor, onPick, onAdd) { const old = document.getElementById('kq-switch'); if (old) { old.remove(); return; }
    if (!document.getElementById('kq-switch-css')) { const st = document.createElement('style'); st.id = 'kq-switch-css'; st.textContent = '#kq-switch{position:fixed; z-index:2147482500; min-width:200px; max-width:min(320px,92vw); max-height:70vh; overflow:auto; padding:8px; border-radius:18px; background:#1f1830; box-shadow:0 0 0 1px rgba(216,176,74,.55), 0 18px 40px rgba(0,0,0,.5); display:grid; gap:6px} #kq-switch h4{margin:4px 8px 2px; font:800 13px var(--font-body, Rubik, sans-serif); color:#bdb3cf} #kq-switch button{display:flex; align-items:center; gap:10px; width:100%; padding:6px 12px 6px 6px; border:0; border-radius:999px; background:rgba(255,255,255,.06); color:#f6efe2; font:800 16px var(--font-body, Rubik, sans-serif); cursor:pointer; text-align:start} #kq-switch button.on{box-shadow:inset 0 0 0 2px #d8b04a} #kq-switch button .av,#kq-switch button .kqav-photo{width:40px !important; height:40px !important; flex:none} #kq-switch button.add{justify-content:center; padding:10px; background:rgba(216,176,74,.16)}'; document.head.appendChild(st); }
    const pop = el('div'); pop.id = 'kq-switch'; pop.appendChild(el('h4', null, t('sw_title'))); const cur = profiles.active();
    for (const p of profiles.list()) { const b = avatar('button', cur && cur.id === p.id ? 'on' : '', p.avatar); b.type = 'button'; b.appendChild(el('span', null, p.name)); b.onclick = () => { pop.remove(); if (cur && cur.id === p.id) return; profiles.setActive(p.id); sfx.play('tap'); if (onPick) onPick(p.id); }; pop.appendChild(b); }
    if (onAdd) { const a = el('button', 'add', '+ ' + t('sw_add')); a.type = 'button'; a.onclick = () => { pop.remove(); onAdd(); }; pop.appendChild(a); }
    document.body.appendChild(pop); const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.top = Math.min(innerHeight - h - 8, r.bottom + 6) + 'px'; pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    setTimeout(() => { const off = e => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('pointerdown', off, true); } }; document.addEventListener('pointerdown', off, true); }, 0); }
  document.addEventListener('kq:tour', e => { const p = profiles.active(); if (p && e.detail && e.detail.pid === p.id) setTimeout(() => toast('🏔 ' + t('tour_step', { d: e.detail.d, n: e.detail.n })), 900); });
  document.addEventListener('kq:ticket', e => { const p = profiles.active(); if (p && e.detail && e.detail.pid === p.id) setTimeout(() => toast(e.detail.why === 'tour' ? '🏔 ' + t('tour_done') : '🎰 ' + t('tix_new')), 900); });
  const itemName = it => t('i_' + it.id), potionName = id => t('p_' + id);
  // human name for a tracked skill/concept key: ×7, ÷4, words ('w:cat'), single letters, or a dictionary label
  const has = k => (dict[state.lang] || dict.en)[k] != null || dict.en[k] != null;
  function tagLabel(world, k) { if (/^x\d+$/.test(k)) return '×' + k.slice(1); if (/^d\d+$/.test(k)) return '÷' + k.slice(1); if (k.startsWith('w:')) return k.slice(2); if (k.startsWith('it:')) { const [, d, i] = k.split(':'); for (const pid in state.scrolls || {}) { const dk = ((state.scrolls[pid] || {}).decks || []).find(x => x.id === d), it = dk && dk.items[+i]; if (it) return it.term || it.q; } return '…'; } if (k.length <= 1) return k; if (has('tg_' + k)) return t('tg_' + k); if (has('s_' + k)) return t('s_' + k); return k; }
  // Header for a world page. opts: {title, sub, homeHref}
  // an avatar element: the animated character when avatars.js is loaded, the plain emoji otherwise
  // the round header: a filling bar and '3 / 10' (dots stay in the DOM for the engines, hidden)
  function roundProgress(i, n) { const b = document.getElementById('qbar'), c = document.getElementById('qcount'); if (b && b.firstElementChild) b.firstElementChild.style.width = Math.round(Math.min(i, n) / Math.max(1, n) * 100) + '%'; if (c) c.textContent = Math.min(i + 1, n) + ' / ' + n; }
  function avatarTitle(key) { const m = /^h:(\w+)$/.exec(key || ''); if (m) return [t('hero_' + m[1]), t('ht_' + m[1])]; const f = /^f:(\w+)-(\w+)$/.exec(key || ''); if (f) return [t('fc_' + f[1]) + ' ' + t('ff_' + f[2]), t('forgedTitle')]; const e = /^e:(\w+)$/.exec(key || ''); return e ? [t('egg_' + e[1]), t('eggTitle')] : null; }
  function avatar(tag, cls, key) { const e = el(tag, cls); const s = window.KQAvatars && KQAvatars.make(key); if (s) e.appendChild(s); else e.textContent = key || ''; return e; }
  /* the Quiet places (Yoni 2026-10-09: 'Quiet … for every world, adapted for every world'): a leaf button in every top bar opens the meditation
     scene of the realm the child is in. meditate.js loads only when it is first opened. */
  const quiet = {
    open(realmId) { const go = () => window.KQMeditate && KQMeditate.open({ realm: realmId || realm.id }); if (window.KQMeditate) return go();
      const sc = document.createElement('script'); sc.src = KQ_BASE + 'meditate.js?v=3'; sc.onload = go; document.head.appendChild(sc); },
    leaf() { const svg = svgEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'leaf' });
      svg.appendChild(svgEl('path', { d: 'M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z' })); svg.appendChild(svgEl('path', { d: 'M2 21c0-3 1.85-5.36 5.08-6' })); return svg; },
    button(cls) { const b = el('button', cls || 'kq-quiet'); b.type = 'button'; b.setAttribute('aria-label', t('md_quiet')); b.appendChild(quiet.leaf()); b.appendChild(el('span', null, t('md_quiet'))); b.onclick = () => quiet.open(); return b; }
  };

  function header(opts) {
    const h = $('.kq-header'); if (!h) return;
    const home = el('a', 'home'); home.href = realm.href(opts.homeHref || '../index.html');
    home.appendChild(crownSvg('crown')); home.appendChild(el('span', null, t('home')));
    const title = el('div', 'kq-title'); const rib = el('div', 'ribbon'); rib.appendChild(el('h1', null, opts.title)); title.appendChild(rib); if (opts.sub) title.appendChild(el('div', 'sub', opts.sub));
    const tools = el('div', 'kq-tools'); const p = profiles.active();
    if (p) { const v = inv(p.id), pr = progress(p.id), next = CASTLE_STEPS[pr.castle + 1]; const chip = el('div', 'kq-chip'); chip.appendChild(avatar('span', 'av', p.avatar)); chip.appendChild(el('span', null, p.name)); chip.appendChild(el('span', 'coin', '✨ ' + elements.held(p.id))); chip.onclick = () => switcher(chip, () => location.reload(), () => { location.href = realm.href((opts.homeHref || '../index.html')) + (/\?/.test(realm.href(opts.homeHref || '../index.html')) ? '&' : '?') + 'add=1'; }); chip.style.cursor = 'pointer'; tools.appendChild(chip);
      const lvl = el('div', 'lvl'); lvl.appendChild(el('span', null, '🏰 ' + t('castle' + pr.castle) + ' · ' + (next ? t('nextStage', { n: next - pr.stars, name: t('castle' + (pr.castle + 1)) }) : t('topStage')))); const bar = el('div', 'mastery'); const fill = el('i'); const lo = CASTLE_STEPS[pr.castle]; fill.style.width = next ? Math.round((pr.stars - lo) / (next - lo) * 100) + '%' : '100%'; fill.style.background = 'var(--gold-2)'; bar.appendChild(fill); lvl.appendChild(bar); title.appendChild(lvl); }
    tools.appendChild(quiet.button('kq-quiet')); tools.appendChild(el('div', 'langs'));
    h.replaceChildren(home, title, tools);
  }

  // ----- teaching visuals: shared so every world explains things in the same visual language -----
  const COLORS = { a: 'var(--math)', b: 'var(--warn)', c: 'var(--reading)', x: 'var(--bad)' };
  function vis(v) {
    if (v && v.el) return v.el;   // a ready-made element (a clock face, a coin row)
    if (!v) return null;
    const box = el('div', 'vis vis-' + v.type);
    if (v.type === 'dots') {
      for (const g of v.groups) { const row = el('div', 'dotrow'); for (let i = 0; i < g.n; i++) { const d = el('i', g.cross && i >= g.n - g.cross ? 'x' : ''); d.style.background = COLORS[g.color || 'a']; if (g.hl != null && i < g.hl) d.classList.add('hl'); row.appendChild(d); } if (g.label) row.appendChild(el('b', null, g.label)); box.appendChild(row); }
    } else if (v.type === 'tenframe') {
      const fr = el('div', 'tenframe'); for (let i = 0; i < 10; i++) { const c = el('i'); if (i < v.a) { c.classList.add('on'); c.style.background = COLORS.a; } else if (i < v.a + v.b) { c.classList.add('on'); c.style.background = COLORS.b; } fr.appendChild(c); } box.appendChild(fr);
      const extra = v.a + v.b - 10; if (extra > 0) { const row = el('div', 'dotrow'); for (let i = 0; i < extra; i++) { const d = el('i'); d.style.background = COLORS.b; row.appendChild(d); } box.appendChild(row); }
    } else if (v.type === 'array') {
      const gr = el('div', 'array'); gr.style.gridTemplateColumns = `repeat(${v.cols}, 1fr)`; for (let r = 0; r < v.rows; r++) for (let c = 0; c < v.cols; c++) { const d = el('i'); d.style.background = v.hlRows != null && r < v.hlRows ? COLORS.b : COLORS.a; gr.appendChild(d); } box.appendChild(gr);
      if (v.rowLabels) { const lab = el('div', 'muted', v.rowLabels.join(' · ')); lab.style.direction = 'ltr'; box.appendChild(lab); }
    } else if (v.type === 'groups') {
      for (let g = 0; g < v.groups; g++) { const row = el('div', 'group'); for (let i = 0; i < v.each; i++) { const d = el('i'); d.style.background = COLORS.a; row.appendChild(d); } box.appendChild(row); }
      if (v.rem) { const row = el('div', 'group rem'); for (let i = 0; i < v.rem; i++) { const d = el('i'); d.style.background = COLORS.b; row.appendChild(d); } box.appendChild(row); }
    } else if (v.type === 'numline') {
      const W = 520, H = 70, lo = v.from, hi = v.to, n = hi - lo, x = k => 20 + (k - lo) / n * (W - 40);
      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'numline' });
      svg.appendChild(svgEl('line', { x1: 20, y1: 44, x2: W - 20, y2: 44, stroke: 'currentColor', 'stroke-width': 2 }));
      const step = n > 40 ? 10 : n > 20 ? 5 : n > 12 ? 2 : 1;
      for (let k = lo; k <= hi; k += step) { const big = v.marks && v.marks.includes(k); svg.appendChild(svgEl('line', { x1: x(k), y1: big ? 36 : 40, x2: x(k), y2: 48, stroke: 'currentColor', 'stroke-width': big ? 3 : 1.5 })); if (big || n <= 20 || (k - lo) % (step * 2) === 0) { const tx = svgEl('text', { x: x(k), y: 64, 'text-anchor': 'middle', 'font-size': big ? 14 : 11, 'font-weight': big ? 800 : 600, fill: 'currentColor' }); tx.textContent = k; svg.appendChild(tx); } }
      for (const [a, b] of v.jumps || []) { const mid = (x(a) + x(b)) / 2, h = Math.min(30, 8 + Math.abs(x(b) - x(a)) / 3); svg.appendChild(svgEl('path', { d: `M${x(a)} 42 Q${mid} ${42 - h * 1.6} ${x(b)} 42`, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 2.5 })); }
      if (v.point != null) svg.appendChild(svgEl('circle', { cx: x(v.point), cy: 44, r: 6, fill: 'var(--accent)' }));
      box.appendChild(svg);
    } else if (v.type === 'column') {
      const a = String(v.a), b = String(v.b), w = Math.max(a.length, b.length) + 1;
      const col = el('div', 'column'); col.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
      const rows = [v.carry || '', a.padStart(w, ' '), v.op + b.padStart(w - 1, ' '), v.res != null ? String(v.res).padStart(w, ' ') : ''];
      rows.forEach((r, ri) => { const cells = r.padStart(w, ' ').split(''); cells.forEach(ch => { const c = el('span', ri === 0 ? 'carry' : ri === 3 ? 'res' : '', ch === ' ' ? '' : ch); col.appendChild(c); }); if (ri === 2) { const rule = el('span', 'rule'); rule.style.gridColumn = `1 / span ${w}`; col.appendChild(rule); } });
      box.appendChild(col);
    } else if (v.type === 'bars') {
      for (const [n, d, label] of v.fracs) { const bar = el('div', 'bar'); for (let i = 0; i < d; i++) { const seg = el('i'); if (i < n) seg.classList.add('on'); bar.appendChild(seg); } const wrap = el('div', 'barrow'); wrap.appendChild(el('b', null, label || `${n}/${d}`)); wrap.appendChild(bar); box.appendChild(wrap); }
    } else if (v.type === 'area') {
      const g = el('div', 'area'); g.style.gridTemplateColumns = `auto repeat(${v.cols.length}, 1fr)`;
      g.appendChild(el('span', 'hd', '×')); v.cols.forEach(c => g.appendChild(el('span', 'hd', String(c))));
      v.rows.forEach(r => { g.appendChild(el('span', 'hd', String(r))); v.cols.forEach(c => g.appendChild(el('span', 'cell', String(r * c)))); });
      g.style.direction = 'ltr'; box.appendChild(g);
    } else if (v.type === 'pie') {
      const svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'pie' }); const cx = 50, cy = 50, r = 44;
      for (let i = 0; i < v.d; i++) { const a0 = -Math.PI / 2 + i / v.d * 2 * Math.PI, a1 = -Math.PI / 2 + (i + 1) / v.d * 2 * Math.PI; const p = svgEl('path', { d: `M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 ${(a1 - a0) > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`, fill: i < v.n ? 'var(--warn)' : 'var(--paper-3)', stroke: 'var(--ink)', 'stroke-width': 1.5 }); svg.appendChild(p); }
      box.appendChild(svg);
    } else if (v.type === 'word') {
      const w = el('div', 'wordvis'); w.style.direction = v.rtl ? 'rtl' : 'ltr';
      (v.chunks || [v.word]).forEach((ch, i) => { const c = el('span', 'chunk'); for (const L of ch) { const s = el('span', 'L', L); if (v.root && v.root.includes(L) && !s.classList.contains('root') && countRoot(v, L, c)) s.classList.add('root'); c.appendChild(s); } w.appendChild(c); if (i < (v.chunks || []).length - 1) w.appendChild(el('span', 'sep', '·')); });
      box.appendChild(w);
      if (v.family && v.family.length) { const f = el('div', 'family'); v.family.forEach(x => f.appendChild(el('span', null, x))); box.appendChild(f); }
    }
    return box;
  }
  // mark each root letter once, left to right (so a doubled letter is not double-marked)
  function countRoot(v, L, chunkEl) { v._seen = v._seen || {}; const need = v.root.split('').filter(x => x === L).length, have = v._seen[L] || 0; if (have >= need) return false; v._seen[L] = have + 1; return true; }
  // Step-by-step "how it works" panel. Steps reveal themselves on a timer so a child can just watch;
  // tapping the panel jumps to the next step for anyone who reads faster. steps: [{text, vis, big}]
  // opts: {title, hideLast, onDone, doneLabel, stepwise:false = show all at once, speak}
  function howto(container, steps, opts) {
    opts = opts || {};
    const box = el('div', 'howto'); box.appendChild(el('div', 'lbl', opts.title || t('letsSee')));
    const list = el('ol', 'steps'); box.appendChild(list);
    const shown = opts.hideLast ? steps.slice(0, -1) : steps;
    let i = 0, timer = null, finished = false;
    const done = el('button', 'btn crimson', opts.doneLabel || t('gotIt')); done.type = 'button'; done.hidden = true;
    done.onclick = e => { e.stopPropagation(); clearTimeout(timer); box.remove(); opts.onDone && opts.onDone(); };
    const skip = el('button', 'btn ghost sm', t('skip')); skip.type = 'button'; skip.hidden = false;
    skip.onclick = e => { e.stopPropagation(); while (i < shown.length) reveal(true); };
    const bar = el('div', 'btns'); bar.appendChild(skip); bar.appendChild(done); box.appendChild(bar);
    // how long a step stays on screen before the next one appears: enough to read it, never less than 1.6s
    const dwell = s => Math.min(6000, Math.max(1600, 460 + String(s.text || '').length * 62 + (s.vis ? 900 : 0)));
    function reveal(instant) {
      clearTimeout(timer);
      if (i >= shown.length) return;
      const s = shown[i++];
      const li = el('li', 'step pop');
      const tx = el('div', 'txt', s.text); if (s.big) tx.classList.add('big');
      li.appendChild(tx);
      const vv = vis(s.vis); if (vv) li.appendChild(vv);
      list.appendChild(li);
      sfx.play('step');
      if (opts.speak === true && !instant) speak(s.text);   // opt-in only: auto-reading every step was a wall of noise
      li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (i >= shown.length) { finished = true; skip.hidden = true; done.hidden = false; done.classList.add('pop'); }
      else if (!instant) timer = setTimeout(reveal, dwell(s));
    }
    // tapping the panel pulls the next step forward; tapping when finished closes it
    box.onclick = () => { if (finished) done.click(); else reveal(); };
    container.appendChild(box);
    reveal();
    if (opts.stepwise === false) { while (i < shown.length) reveal(true); }
    return box;
  }

  // Report card overlay. r: {title, correct, total, points, stars, avgMs, bestStreak, extra:[[k,v]...], rec (from store.record), workingOn:[names], onAgain, onNext, homeHref}
  // The report card styles itself, so it looks the same inside the chess hall (which has its own stylesheet).
  function ensureReportCss() {
    if (document.getElementById('kqr-css')) return;
    const st = document.createElement('style'); st.id = 'kqr-css';
    st.textContent = `
.kq-overlay{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:16px;background:rgba(20,12,6,.62);backdrop-filter:blur(3px);overflow:auto}
.kqr{position:relative;width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--paper,#f4ead8);color:var(--ink,#2a1a0a);border:3px solid var(--gold-2,#b8862b);border-radius:20px;padding:22px 20px 20px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:var(--font-body,Fraunces,serif)}
.kqr h2{margin:0 0 6px;font:900 26px var(--font-display,Cinzel,serif);color:var(--accent-2,#6e1a26)}
.kqr .big{font:900 44px/1.1 var(--font-display,Cinzel,serif);color:var(--accent,#8e1f2f);margin:4px 0}
.kqr p{margin:6px 0 10px;font-weight:800}
.kqr .kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:12px 0}
.kqr .kv div{background:var(--paper-2,#efe2c9);border:1px solid var(--line,#d5c39d);border-radius:10px;padding:8px 6px}
.kqr .kv b{display:block;font:900 20px/1.1 var(--font-display,Cinzel,serif);font-variant-numeric:tabular-nums}
.kqr .kv span{font:800 10px var(--font-label,Cinzel,serif);letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#7a6a55)}
.kqr .working{margin:8px 0;font-size:14px;font-weight:700;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}
.kqr .working.ok .tag{background:#d9f2df;border-color:#3d9a55}
.kqr .tag{padding:3px 9px;border-radius:999px;background:var(--paper-2,#efe2c9);border:1px solid var(--line,#d5c39d);font-size:13px}
.kqr .found{display:grid;justify-items:center;gap:2px;margin:10px auto;padding:10px;border-radius:14px;background:#fff3c4;border:2px solid var(--gold-2,#b8862b);max-width:260px}
.kqr .found .e{font-size:40px} .kqr .found .n{font-weight:800} .kqr .found .r{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#7a6a55)}
.kqr .potion-note{font-size:14px;color:var(--muted,#7a6a55)}
.kqr .badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.kqr .badge{display:grid;justify-items:center;padding:8px 10px;border-radius:12px;background:var(--paper-2,#efe2c9);border:1px solid var(--line,#d5c39d);font-size:12px;font-weight:800} .kqr .badge .e{font-size:28px}
.kqr .btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:14px}
.kqr .btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 20px;border-radius:12px;border:2px solid var(--gold-2,#b8862b);background:var(--paper-2,#efe2c9);color:var(--ink,#2a1a0a);font:800 16px var(--font-body,Fraunces,serif);text-decoration:none;cursor:pointer}
.kqr .btn.crimson{background:linear-gradient(180deg,#a8283a,#6e1220);color:#fff;border-color:#4a0b14}
.kqr .btn.ghost{background:transparent}
.kqr .btn.gold{background:linear-gradient(180deg,#f2d27a,#c9962a);border-color:#8a6210}
.kqr .close{position:absolute;inset-inline-end:10px;top:10px;width:38px;height:38px;border-radius:50%;border:2px solid var(--gold-2,#b8862b);background:var(--paper,#f4ead8);font:900 18px var(--font-body,Fraunces,serif);cursor:pointer;display:grid;place-items:center}
.kqr .pop{animation:kqrPop .5s cubic-bezier(.2,1.4,.4,1)} @keyframes kqrPop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}`;
    document.head.appendChild(st);
  }
  function report(r) {
    ensureReportCss(); const ov = el('div', 'kq-overlay'), sc = el('div', 'kqr'); const rec = r.rec || {};
    const x = el('button', 'close', '✕'); x.type = 'button'; x.setAttribute('aria-label', t('back')); x.onclick = () => ov.remove(); sc.appendChild(x);   // back to where you were
    sc.appendChild(el('h2', null, r.title || t('reportTitle')));
    const st = starsEl(r.stars, 3); st.style.fontSize = '44px'; sc.appendChild(st);
    sc.appendChild(el('div', 'big', '+' + (r.points || 0)));
    sc.appendChild(el('p', null, praise.summary(r)));
    { const row = rec.row, p = profiles.active(); const lt = row && p ? praise.lastTime(p.id, row.world, row.mode, row) : null; if (lt) sc.appendChild(el('p', 'muted', lt)); }
    const kv = el('div', 'kv');
    const add = (k, v) => { const d = el('div'); d.appendChild(el('b', null, String(v))); d.appendChild(el('span', null, k)); kv.appendChild(d); };
    if (r.total) add(t('correct'), `${r.correct} / ${r.total}`);
    if (r.total) add(t('accuracy'), Math.round(100 * r.correct / r.total) + '%');
    if (r.avgMs) add(t('speed'), (r.avgMs / 1000).toFixed(1) + 's');
    if (r.bestStreak != null) add(t('bestStreak'), r.bestStreak);
    (r.extra || []).filter(e => e[2] !== 'g').forEach(([k, v]) => add(k, v));
    { const gl = (r.extra || []).filter(e => e[2] === 'g'); if (gl.length) { const box = el('div', 'kqr-growth'); box.appendChild(el('div', 'h', '🌱 ' + t('g_title'))); for (const [k, v, , tag] of gl) { const li = el('div', 'li', k); if (v) li.appendChild(el('b', null, ' ' + v)); box.appendChild(li); if (tag && tag.startsWith('bridge:')) { const b = el('button', 'btn gold', '🌍 ' + t('br_start', { lang: bridge.langName(bridge.second(profiles.active().id)) })); b.type = 'button'; b.onclick = () => { ov.remove(); bridge.open(tag.slice(7)); }; box.appendChild(b); } } sc.appendChild(box); } }
    if (rec.elements && rec.elements.length) { const g = elements.group(rec.elements); add(t('earnedEl'), Object.keys(g).map(k => elements.icon(k) + (g[k] > 1 ? '×' + g[k] : '')).join(' ')); }
    sc.appendChild(kv);
    if (rec.potionUsed) sc.appendChild(el('p', 'potion-note', POTIONS.find(x => x.id === rec.potionUsed).e + ' ' + potionName(rec.potionUsed)));
    if (rec.potion) { const f = el('div', 'found pop'); f.appendChild(el('div', 'e', rec.potion.e)); f.appendChild(el('div', 'n', t('foundPotion', { name: potionName(rec.potion.id) }))); sc.appendChild(f); }
    if (rec.newBadges && rec.newBadges.length) { const bx = el('div', 'badges'); bx.style.justifyContent = 'center'; rec.newBadges.forEach(id => { const b = BADGES.find(x => x.id === id); const d = el('div', 'badge pop'); d.appendChild(el('div', 'e', b ? b.e : '🏅')); d.appendChild(el('div', 'n', t('b_' + id))); bx.appendChild(d); }); sc.appendChild(el('p', null, t('newBadge', { name: t('b_' + rec.newBadges[0]) }))); sc.appendChild(bx); }
    if (rec.castleUp) sc.appendChild(el('p', null, '🏰 ' + t('castleUp')));
    if (r.workingOn && r.workingOn.length) { const w = el('div', 'working'); w.appendChild(el('b', null, t('workingOn') + ': ')); r.workingOn.forEach(x => w.appendChild(el('span', 'tag', x))); sc.appendChild(w); }
    if (r.mastered && r.mastered.length) { const w = el('div', 'working ok'); w.appendChild(el('b', null, t('mastered') + ': ')); r.mastered.forEach(x => w.appendChild(el('span', 'tag', x))); sc.appendChild(w); }
    const btns = el('div', 'btns');
    const again = el('button', 'btn crimson', t('again')); again.onclick = () => { ov.remove(); r.onAgain && r.onAgain(); };
    const home = el('a', 'btn ghost', t('home')); home.href = realm.href(r.homeHref || '../index.html');
    btns.appendChild(again); if (r.onNext) { const nx = el('button', 'btn gold', t('next')); nx.onclick = () => { ov.remove(); r.onNext(); }; btns.appendChild(nx); } btns.appendChild(home);
    sc.appendChild(btns); ov.appendChild(sc); document.body.appendChild(ov);
    sfx.play(r.stars === 3 ? 'fanfare' : r.stars >= 1 ? 'win' : 'star');
    if (rec.potion) setTimeout(() => sfx.play('chest'), 700);
    if (rec.newBadges && rec.newBadges.length) setTimeout(() => sfx.play('badge'), 1300);
    return ov;
  }
  const FX_CSS = '.kq-cel{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;background:rgba(12,8,6,.72);cursor:pointer;overflow:hidden;font-family:var(--font-body,Georgia,serif);color:#f8efdc;text-align:center}.kq-cel .in{position:relative;z-index:2;animation:kqcel .6s ease}.kq-cel .e{font-size:110px;line-height:1;filter:drop-shadow(0 8px 20px rgba(0,0,0,.5))}.kq-cel h2{font:900 44px/1.1 var(--font-display,Georgia,serif);color:#f1d98a;margin:12px 0 6px;text-shadow:0 3px 0 rgba(0,0,0,.4)}.kq-cel p{font-weight:800;font-size:22px;margin:0}.kq-cel small{display:block;margin-top:18px;opacity:.7;font-weight:700}.kq-cel i{position:absolute;top:-20px;width:12px;height:18px;border-radius:2px;animation:kqfall linear forwards}@keyframes kqfall{to{transform:translateY(110vh) rotate(720deg)}}@keyframes kqcel{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}.kq-burst{position:fixed;left:50%;top:45%;z-index:85;pointer-events:none;font-size:34px;animation:kqburst 1.1s ease-out forwards}@keyframes kqburst{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}15%{opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.1);opacity:0}}';
  function ensureFxCss() { if (document.getElementById('kq-fx-css')) return; const s = document.createElement('style'); s.id = 'kq-fx-css'; s.textContent = FX_CSS; document.head.appendChild(s); }
  // A full-screen moment: level up, big find. opts: {emoji, title, sub, onDone}
  // the level ladder under the age bands: "Level 3 of 10" with ten pips
  function ladderUi(bandsEl, info) {
    let box = document.getElementById('ladder'); if (!box) { box = el('div', 'ladder'); box.id = 'ladder'; bandsEl.after(box); }
    box.replaceChildren();
    box.appendChild(el('div', 'lv', info.complete ? '✅ ' + t('ladderDone', { n: info.steps }) : '🪜 ' + t('ladderLevel', { l: info.level, n: info.steps })));
    const pips = el('div', 'pips'); for (let i = 1; i <= info.steps; i++) pips.appendChild(el('i', i <= info.done ? 'done' : i === info.level && !info.complete ? 'cur' : '', String(i))); box.appendChild(pips);
    box.appendChild(el('div', 'hint', info.complete ? (info.nextName ? t('ladderOnward') + ': ' + info.nextName : '') : t('ladderNeed')));
    if (info.bridgePending) { const p = profiles.active(); const b = el('button', 'btn gold bridgebtn', '🌍 ' + t('br_btn', { lang: bridge.langName(bridge.second(p.id)), n: info.bridgeLevel })); b.type = 'button'; b.onclick = () => bridge.open(info.bridgeWorld); box.appendChild(b); }
    return box;
  }
  function celebrate(opts) {
    ensureFxCss(); const ov = el('div', 'kq-cel'); const inner = el('div', 'in'); inner.appendChild(el('div', 'e', opts.emoji || '🏰')); inner.appendChild(el('h2', null, opts.title || t('levelUp'))); if (opts.sub) inner.appendChild(el('p', null, opts.sub)); inner.appendChild(el('small', null, t('tapToContinue'))); ov.appendChild(inner);
    const cols = ['#f1d98a', '#8e1f2f', '#2b5fa8', '#2f7a3f', '#ffffff', '#d98a1f']; for (let i = 0; i < 70; i++) { const c = el('i'); c.style.left = Math.random() * 100 + '%'; c.style.background = cols[i % cols.length]; c.style.animationDuration = (2.2 + Math.random() * 2) + 's'; c.style.animationDelay = (Math.random() * 1.2) + 's'; ov.appendChild(c); }
    let done = false; const finish = () => { if (done) return; done = true; ov.remove(); opts.onDone && opts.onDone(); }; ov.onclick = finish; setTimeout(finish, opts.ms || 4200);
    document.body.appendChild(ov); sfx.play('fanfare'); if (opts.speak !== false) speak((opts.title || '') + ' ' + (opts.sub || '')); return ov;
  }
  // A quick shower of emoji from the middle of the screen (coins on a streak, stars on a perfect answer)
  function burst(emoji, n) { ensureFxCss(); for (let i = 0; i < (n || 12); i++) { const s = el('span', 'kq-burst', emoji || '🪙'); const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 160; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d - 60 + 'px'); s.style.animationDelay = (Math.random() * 0.25) + 's'; document.body.appendChild(s); setTimeout(() => s.remove(), 1500); } }
  // Potion banner for a world page: shows the active potion (if any) and lets the kid pick one before a round. Returns the active potion id.
  function potionBar(container, opts) {
    const p = profiles.active(); if (!p) return null; const v = inv(p.id); const cur = state.active[p.id] || null;
    container.replaceChildren();
    const bar = el('div', 'potionbar');
    if (cur) { const P = POTIONS.find(x => x.id === cur); bar.classList.add('on'); bar.appendChild(el('span', 'e', P.e)); bar.appendChild(el('span', 'n', t('potionOn', { name: potionName(cur) }) + ' ' + t('p_' + cur + '_d'))); const x = el('button', 'ibtn sm', '✕'); x.type = 'button'; x.title = t('cancel'); x.onclick = () => { store.cancelPotion(p.id); potionBar(container, opts); }; bar.appendChild(x); }
    else {
      const have = POTIONS.filter(P => v.potions[P.id] > 0);
      if (!have.length) { bar.appendChild(el('span', 'n muted', t('noPotions'))); }
      else { bar.appendChild(el('span', 'n', t('potions') + ':')); have.forEach(P => { const b = el('button', 'pbtn'); b.type = 'button'; b.appendChild(el('span', 'e', P.e)); b.appendChild(el('span', null, potionName(P.id) + ' ×' + v.potions[P.id])); b.title = t('p_' + P.id + '_d'); b.onclick = () => { store.usePotion(p.id, P.id); sfx.play('coin'); potionBar(container, opts); opts && opts.onChange && opts.onChange(P.id); }; bar.appendChild(b); }); }
    }
    container.appendChild(bar); return cur;
  }
  function requireProfile(homeHref) { const p = profiles.active(); if (!p) { try { sessionStorage.setItem('kq.msg', 'pickPlayer'); } catch (e) {} location.href = realm.href(homeHref || '../index.html'); } return p; }

  forge.register();   // forged avatars must exist before any surface draws them
  const prewarm = () => { if (window['KQ_VOICES_' + state.lang.toUpperCase()]) spriteFor(state.lang); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prewarm); else prewarm();
  document.addEventListener('kq:lang', prewarm);
  /* ---------- the parents' corner (Yoni 2026-09-29): a 4-digit PIN chosen by a parent the first time; it opens the Parents page and
     guards removing a player. It keeps small hands out — it is not a password (the app has no accounts). ---------- */
  const parent = {
    hash(pin) { let h = 5381; for (const c of 'kq-parent:' + pin) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'h' + (h >>> 0).toString(36); },
    has() { return !!(state.parent && state.parent.pin); },
    set(pin) { state.parent = { pin: parent.hash(pin), ts: Date.now() }; save(); parent.unlock(); },
    check(pin) { const ok = parent.has() && state.parent.pin === parent.hash(pin); if (ok) parent.unlock(); return ok; },
    isOpen() { try { return sessionStorage.getItem('kq_parent') === '1'; } catch (e) { return false; } },
    unlock() { try { sessionStorage.setItem('kq_parent', '1'); } catch (e) {} },
    lock() { try { sessionStorage.removeItem('kq_parent'); } catch (e) {} }
  };
  i18n.extend({
    en: { earnedEl: 'Elements found', foundPotion: 'You found a potion: {name}!', pt_el: '+{n} {name}', el_fire: 'Fire', el_water: 'Water', el_earth: 'Earth', el_wind: 'Wind', el_light: 'Light', el_frost: 'Frost' },
    he: { earnedEl: 'יסודות שנמצאו', foundPotion: 'מצאתם שיקוי: {name}!', pt_el: '+{n} {name}', el_fire: 'אש', el_water: 'מים', el_earth: 'אדמה', el_wind: 'רוח', el_light: 'אור', el_frost: 'כפור' }
  });

  // ---------- Kingdom keys + cloud saves (Yoni 2026-10-17: 'save progress by user, not only by device') ----------
  /* Every player has a Kingdom key (XXXX-XXXX-XXXX). Their whole slice of the state is pushed to the relay a few seconds after any
     change, under that key, and pulled back on any device where the key is typed in. The key is the only secret: whoever has it can
     load that player (first name + initial, age, game progress — nothing more). Last save wins; two devices playing the same player at
     the same moment would overwrite each other. The relay keeps the table (kq_saves) private; only its own routes read it. */
  const KEY_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function cloudKey() { const a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.floor(Math.random() * 256); }); let k = ''; for (let i = 0; i < 12; i++) { k += KEY_CHARS[a[i] % KEY_CHARS.length]; if (i === 3 || i === 7) k += '-'; } return k; }
  const KEY_RE = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  const PER_PLAYER = ['skills', 'ladder', 'ladderLog', 'growth', 'inv', 'active', 'avatars', 'heart', 'eggs', 'qseen', 'scrolls', 'journal'];
  /* Yoni 2026-10-17: 'no kid will remember that, we need something simple' — the key is DERIVED from the child's name (first name + family initial)
     and ONE secret picture, so the same name + picture on any device rebuild the same key (Yoni: 'a child name, first letter of family name
     and a pic is enough'). 12 pictures: two children with the same name AND the same picture would share one save; the parents' key
     in the Parents tab stays as the exact fallback. The name is folded: letters only, lower-case, so "Noa E." and "noa e" match. */
  const SECRET_PICS = ['apple', 'banana', 'bear', 'bee', 'star', 'heart', 'fish', 'car', 'tree', 'house', 'sun', 'moon'];
  const foldName = n => String(n || '').toLowerCase().replace(/[^\p{L}]/gu, '');
  function keyFromHash(str) { let h1 = 0x811c9dc5, h2 = 0x5bd1e995; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0; h2 = Math.imul(h2 ^ c, 0x9e3779b1) >>> 0; h2 = (h2 ^ (h2 >>> 15)) >>> 0; } let k = '', x = h1, y = h2; for (let i = 0; i < 12; i++) { k += KEY_CHARS[(x >>> 0) % KEY_CHARS.length]; x = Math.imul(x ^ (y >>> (i % 7)), 0x85ebca6b) >>> 0; y = Math.imul(y ^ (x >>> 13), 0xc2b2ae35) >>> 0; if (i === 3 || i === 7) k += '-'; } return k; }
  const cloud = {
    pics: SECRET_PICS.slice(),
    keyFrom(name, pics) { return keyFromHash('kq1|' + foldName(name) + '|' + (pics || []).join(',')); },
    url() { return (window.KQ_TTS_ENDPOINT || DEFAULT_RELAY).replace(/\/$/, ''); },
    keyOf(pid) { const p = profiles.get(pid); if (!p) return null; if (!p.key) { p.key = cloudKey(); save(); } return p.key; },
    tidy(k) { return String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.{4})(.{4})$/, '$1-$2-$3'); },
    valid(k) { return KEY_RE.test(k); },
    slice(pid) { const p = profiles.get(pid); if (!p) return null; const d = { v: 1, ts: Date.now(), profile: JSON.parse(JSON.stringify(p)), results: state.results.filter(r => r.pid === pid) };
      for (const k of PER_PLAYER) if (state[k] && state[k][pid] !== undefined) d[k] = state[k][pid];
      try { const L = localStorage.getItem('kq-letters:' + pid); if (L) d.letters = JSON.parse(L); } catch (e) {}
      try { const C = JSON.parse(localStorage.getItem('castle-chess-skill') || '{}'); if (C && C[pid] != null) d.chess = { skill: C[pid], games: C['#' + pid] || 0 }; } catch (e) {}
      return d; },
    apply(d) { if (!d || !d.profile || !d.profile.id) return null; const pid = d.profile.id; cloud.quiet = true;
      try { const old = profiles.get(pid); if (old) Object.assign(old, d.profile); else state.profiles.push(d.profile);
        state.results = state.results.filter(r => r.pid !== pid).concat(Array.isArray(d.results) ? d.results : []);
        for (const k of PER_PLAYER) if (d[k] !== undefined) { state[k] = state[k] || {}; state[k][pid] = d[k]; }
        try { if (d.letters) localStorage.setItem('kq-letters:' + pid, JSON.stringify(d.letters)); } catch (e) {}
        try { if (d.chess) { const C = JSON.parse(localStorage.getItem('castle-chess-skill') || '{}'); C[pid] = d.chess.skill; C['#' + pid] = d.chess.games; localStorage.setItem('castle-chess-skill', JSON.stringify(C)); } } catch (e) {}
        const p = profiles.get(pid); p.synced = d.ts || Date.now(); save(); } finally { cloud.quiet = false; }
      return profiles.get(pid); },
    _last: {}, ready: false,
    /* nothing goes up before this page's first pull has finished (or failed), and nothing goes up if it is identical to the last save:
       a stale copy must never overwrite a newer one made elsewhere */
    async push(pid) { if (!cloud.ready) { clearTimeout(cloud._t); cloud._t = setTimeout(() => cloud.push(pid), 1500); return false; } const key = cloud.keyOf(pid), d = cloud.slice(pid); if (!key || !d || !navigator.onLine) return false; const sig = JSON.stringify(Object.assign({}, d, { ts: 0 })); if (cloud._last[pid] === sig) return false; cloud._last[pid] = sig;
      try { const r = await fetch(cloud.url() + '/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, data: d }) }); if (!r.ok) return false; const p = profiles.get(pid); if (p) { p.synced = d.ts; cloud.quiet = true; try { save(); } finally { cloud.quiet = false; } } return true; } catch (e) { return false; } },
    async load(key) { key = cloud.tidy(key); if (!cloud.valid(key) || !navigator.onLine) return { ok: false, why: 'offline' };
      try { const r = await fetch(cloud.url() + '/load', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) }); if (r.status === 404) return { ok: false, why: 'notfound' }; if (!r.ok) return { ok: false, why: 'error' }; const j = await r.json(); const p = cloud.apply(j.data); if (!p) return { ok: false, why: 'error' }; p.key = key; save(); return { ok: true, profile: p }; } catch (e) { return { ok: false, why: 'error' }; } },
    /* on every page open: a player saved more recently somewhere else is refreshed here */
    async refresh() { try { if (!navigator.onLine) return; for (const p of profiles.list()) { if (!p.key) continue; try { const r = await fetch(cloud.url() + '/load', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: p.key }) }); if (!r.ok) continue; const j = await r.json(); if (j.data && (j.data.ts || 0) > (p.synced || 0)) { cloud.apply(j.data); cloud._last[p.id] = JSON.stringify(Object.assign({}, cloud.slice(p.id), { ts: 0 })); document.dispatchEvent(new CustomEvent('kq:cloud', { detail: { id: p.id } })); } else if (j.data) cloud._last[p.id] = JSON.stringify(Object.assign({}, cloud.slice(p.id), { ts: 0 })); } catch (e) {} } } finally { cloud.ready = true; } },
    _t: null, quiet: false,
    /* a few seconds after any change, the active player's slice goes up */
    schedule() { if (cloud.quiet) return; const p = profiles.active(); if (!p) return; clearTimeout(cloud._t); cloud._t = setTimeout(() => cloud.push(p.id), 3000); }
  };
  setTimeout(() => { try { cloud.refresh(); } catch (e) { cloud.ready = true; } }, 300);
  window.KQ = { state: () => state, save, i18n, t, quiet, profiles, store, forge, elements, parent, ladder, realm, growth, bridge, eggs, playerEggs, rotate, praise, score, skills, journal, intro, tickets, mountain, sfx, speak, cloud, ui: { el, svgEl, crownSvg, starsEl, ringEl, toast, peek, switcher, header, report, vis, howto, potionBar, itemName, potionName, celebrate, burst, avatar, avatarTitle, ladder: ladderUi, progress: roundProgress }, tts, tagLabel, requireProfile, AVATARS, WORLDS, POTIONS, ITEMS, dayKey };
})();
