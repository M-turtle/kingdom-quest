/* Kingdom Quest — the parents' curriculum map (Yoni 2026-09-29: 'convert the names of the games to the actual things they stand behind —
   logic, reading in Hebrew or English, math, geometry, pattern recognition, number series … so a parent can pass it on to a teacher';
   'a benchmark of how they are doing against the level they should be at, per the class they are in … they can jump over it, but if
   they do not know it the parents should know'; 'do NOT compare to other kids — only the kid against themselves').

   TOPICS: every skill a world tracks (KQ.skills, key = the game's skill id) → the school term for it, its subject area, and the grade by
   whose END it is typically expected. The grades follow common school standards (US Common Core, Israeli Ministry of Education
   curriculum): an approximation for orientation, not an official syllabus. `game` is the name the child sees, for the parents'
   'where is this practised' reference. A lang topic is tracked per language (KQ.skills keeps `reading@he`, `reading@en`, …).
   The grade scale: -1 pre-K (age 4), 0 kindergarten (5), 1–10 school grades. The content currently reaches about grade 8. */
(function () {
  'use strict';
  const AREAS = {
    num: { grp: 'math', en: 'Number sense', he: 'מושג המספר' },
    add: { grp: 'math', en: 'Addition & subtraction', he: 'חיבור וחיסור' },
    mul: { grp: 'math', en: 'Multiplication & division', he: 'כפל וחילוק' },
    frac: { grp: 'math', en: 'Fractions & decimals', he: 'שברים ומספרים עשרוניים' },
    ratio: { grp: 'math', en: 'Percent & ratio', he: 'אחוזים ויחס' },
    alg: { grp: 'math', en: 'Algebra', he: 'אלגברה' },
    geo: { grp: 'math', en: 'Geometry & measurement', he: 'גאומטריה ומדידה' },
    stats: { grp: 'math', en: 'Data & statistics', he: 'סטטיסטיקה' },
    word: { grp: 'math', en: 'Math word problems', he: 'בעיות מילוליות בחשבון' },
    time: { grp: 'math', en: 'Time (clocks & calendars)', he: 'זמן (שעון ולוחות זמנים)' },
    money: { grp: 'math', en: 'Money & financial literacy', he: 'כסף וחינוך פיננסי' },
    mathmix: { grp: 'math', en: 'Mixed math practice (games)', he: 'תרגול חשבון משולב (משחקים)' },
    phon: { grp: 'lang', lang: 1, en: 'Letters & phonics', he: 'אותיות וצלילים' },
    decode: { grp: 'lang', lang: 1, en: 'Word reading (decoding)', he: 'קריאת מילים (פענוח)' },
    comp: { grp: 'lang', lang: 1, en: 'Reading comprehension', he: 'הבנת הנקרא' },
    vocab: { grp: 'lang', lang: 1, en: 'Vocabulary', he: 'אוצר מילים' },
    gram: { grp: 'lang', lang: 1, en: 'Grammar & sentence structure', he: 'דקדוק ומבנה משפט' },
    spell: { grp: 'lang', lang: 1, en: 'Spelling', he: 'כתיב' },
    langmix: { grp: 'lang', lang: 1, en: 'Mixed reading practice (games)', he: 'תרגול קריאה משולב (משחקים)' },
    pattern: { grp: 'think', en: 'Pattern recognition & number series', he: 'זיהוי חוקיות וסדרות' },
    reason: { grp: 'think', en: 'Logical reasoning', he: 'חשיבה לוגית' },
    class: { grp: 'think', en: 'Classification & sets', he: 'מיון וקבוצות' },
    code: { grp: 'think', en: 'Coding & algorithmic thinking', he: 'תכנות וחשיבה אלגוריתמית' },
    mem: { grp: 'think', en: 'Visual memory & attention', he: 'זיכרון חזותי וקשב' },
    strategy: { grp: 'think', en: 'Strategic thinking (chess)', he: 'חשיבה אסטרטגית (שחמט)' },
    world: { grp: 'social', en: 'Geography (continents, countries, maps, travel)', he: 'גאוגרפיה (יבשות, מדינות, מפות, מסעות)' },
    history: { grp: 'social', en: 'History (timelines, inventions, ages of history)', he: 'היסטוריה (צירי זמן, המצאות, תקופות)' },
    nature: { grp: 'science', en: 'Life science (animals, plants, habitats, ecosystems)', he: 'מדעי החיים (בעלי חיים, צמחים, בתי גידול, מערכות אקולוגיות)' },
    physics: { grp: 'science', en: 'Physics (forces, motion, energy, floating)', he: 'פיזיקה (כוחות, תנועה, אנרגיה, ציפה)' },
    art: { grp: 'arts', en: 'Visual art (colour, artists, styles, art history)', he: 'אמנות חזותית (צבע, אמנים, סגנונות, תולדות האמנות)' },
    music: { grp: 'arts', en: 'Music (listening, notes, rhythm, composers)', he: 'מוזיקה (האזנה, תווים, קצב, מלחינים)' },
    mixed: { grp: 'other', en: 'Mixed review (eagle ride)', he: 'חזרה משולבת (רכיבה על הנשר)' },
    scroll: { grp: 'other', en: 'Class material (Scrolls)', he: 'חומר הכיתה (מגילות)' }
  };
  const GROUPS = { math: { en: 'Math', he: 'חשבון ומתמטיקה' }, lang: { en: 'Language', he: 'שפה' }, think: { en: 'Thinking skills', he: 'כישורי חשיבה' }, science: { en: 'Science', he: 'מדעים' }, social: { en: 'History and geography', he: 'היסטוריה וגאוגרפיה' }, arts: { en: 'Arts', he: 'אמנויות' }, other: { en: 'Other', he: 'אחר' } };
  const TOPICS = {};
  // T(world, skill, area, grade, school term EN, HE, the game's name EN, HE [, Hebrew-content term EN, HE])
  const T = (w, k, a, g, en, he, gen, ghe, hl) => { TOPICS[w + ':' + k] = { w, k, a, g, en, he, game: [gen, ghe], hl: hl || null, lang: !!AREAS[a].lang }; };
  // ---- math (Math Tower)
  T('math', 'count', 'num', -1, 'Counting objects', 'ספירת עצמים', 'Counting', 'ספירה');
  T('math', 'compare', 'num', -1, 'Comparing numbers (more / less)', 'השוואת מספרים (יותר / פחות)', 'More or less', 'יותר או פחות');
  T('math', 'nextNum', 'num', 0, 'Number order (what comes next)', 'סדר המספרים (מה בא אחרי)', 'What comes next', 'מה בא אחר כך');
  T('math', 'addPic', 'add', 0, 'Addition with objects', 'חיבור בעזרת עצמים', 'Add with pictures', 'חיבור עם ציורים');
  T('math', 'add20', 'add', 1, 'Addition within 20', 'חיבור עד 20', 'Add to 20', 'חיבור עד 20');
  T('math', 'sub20', 'add', 1, 'Subtraction within 20', 'חיסור עד 20', 'Take away', 'חיסור');
  T('math', 'missing', 'add', 1, 'Missing number in an equation', 'המספר החסר בתרגיל', 'Missing number', 'המספר החסר');
  T('math', 'double', 'add', 1, 'Doubles', 'כפולות (מספר ועוד אותו מספר)', 'Doubles', 'כפולות');
  T('math', 'tens', 'num', 1, 'Place value: tens and ones', 'ערך המקום: עשרות ויחידות', 'Tens', 'עשרות');
  T('math', 'add100', 'add', 2, 'Addition within 100', 'חיבור עד 100', 'Add to 100', 'חיבור עד 100');
  T('math', 'sub100', 'add', 2, 'Subtraction within 100', 'חיסור עד 100', 'Subtract to 100', 'חיסור עד 100');
  T('math', 'fraction', 'frac', 2, 'Halves and quarters', 'חצי ורבע', 'Halves & quarters', 'חצאים ורבעים');
  T('math', 'times', 'mul', 3, 'Multiplication facts (times tables)', 'עובדות הכפל (לוח הכפל)', 'Times tables', 'לוח הכפל');
  T('math', 'divide', 'mul', 3, 'Division facts', 'עובדות החילוק', 'Division', 'חילוק');
  T('math', 'fracadd', 'frac', 3, 'Fractions of a quantity', 'שבר מכמות', 'Fractions of things', 'שברים של דברים');
  T('math', 'round', 'num', 3, 'Rounding', 'עיגול מספרים', 'Rounding', 'עיגול');
  T('math', 'area', 'geo', 3, 'Area and perimeter', 'שטח והיקף', 'Area & perimeter', 'שטח והיקף');
  T('math', 'word', 'word', 3, 'Word problems', 'בעיות מילוליות', 'Word problems', 'בעיות מילוליות');
  T('math', 'mult2', 'mul', 4, 'Multi-digit multiplication', 'כפל במספר רב-ספרתי', 'Big multiplication', 'כפל גדול');
  T('math', 'mult22', 'mul', 4, 'Two-digit by two-digit multiplication', 'כפל דו-ספרתי בדו-ספרתי', 'Two-digit times', 'כפל דו-ספרתי');
  T('math', 'longdiv', 'mul', 4, 'Division with remainders', 'חילוק עם שארית', 'Division with leftovers', 'חילוק עם שארית');
  T('math', 'fraccmp', 'frac', 4, 'Comparing fractions', 'השוואת שברים', 'Compare fractions', 'השוואת שברים');
  T('math', 'decimals', 'frac', 4, 'Decimals', 'מספרים עשרוניים', 'Decimals', 'מספרים עשרוניים');
  T('math', 'order', 'alg', 5, 'Order of operations', 'סדר פעולות החשבון', 'Order of operations', 'סדר פעולות');
  T('math', 'fracmul', 'frac', 5, 'Multiplying fractions', 'כפל שברים', 'Multiply fractions', 'כפל שברים');
  T('math', 'decmul', 'frac', 5, 'Multiplying decimals by whole numbers', 'כפל מספר עשרוני במספר שלם', 'Decimals × whole', 'עשרוני × שלם');
  T('math', 'percent', 'ratio', 6, 'Percentages', 'אחוזים', 'Percent', 'אחוזים');
  T('math', 'ratio', 'ratio', 6, 'Ratios', 'יחסים', 'Ratios', 'יחסים');
  T('math', 'negatives', 'num', 6, 'Negative numbers', 'מספרים שליליים', 'Negative numbers', 'מספרים שליליים');
  T('math', 'mean', 'stats', 6, 'Mean (average)', 'ממוצע', 'Averages', 'ממוצע');
  T('math', 'lineq', 'alg', 6, 'Solving simple equations', 'פתרון משוואות פשוטות', 'Solve for x', 'למצוא את x');
  T('math', 'lineq2', 'alg', 7, 'Equations with the unknown on both sides', 'משוואות עם נעלם בשני האגפים', 'x on both sides', 'x בשני הצדדים');
  T('math', 'expand', 'alg', 7, 'Expanding brackets (distributive law)', 'פתיחת סוגריים (חוק הפילוג)', 'Expand brackets', 'פתיחת סוגריים');
  T('math', 'pctchange', 'ratio', 7, 'Percent increase and decrease', 'שינוי באחוזים (עלייה וירידה)', 'Percent change', 'שינוי באחוזים');
  T('math', 'expo', 'alg', 8, 'Powers and square roots', 'חזקות ושורשים', 'Powers & roots', 'חזקות ושורשים');
  T('math', 'pythag', 'geo', 8, 'Pythagorean theorem', 'משפט פיתגורס', 'Pythagoras', 'פיתגורס');
  // ---- time (Clock Tower)
  T('clock', 'oclock', 'time', 1, 'Telling time to the hour', 'קריאת שעון: שעות עגולות', "O'clock", 'שעה עגולה');
  T('clock', 'which', 'time', 1, 'Matching a time to a clock face', 'התאמת שעה לשעון', 'Find the clock', 'מוצאים את השעון');
  T('clock', 'half', 'time', 1, 'Half and quarter hours', 'חצאי שעה ורבעי שעה', 'Half & quarter', 'חצי ורבע');
  T('clock', 'five', 'time', 2, 'Telling time to 5 minutes', 'קריאת שעון בדיוק של 5 דקות', 'Five minutes', 'חמש דקות');
  T('clock', 'type', 'time', 2, 'Writing the time (h:mm)', 'כתיבת השעה (ש:דד)', 'Type the time', 'כותבים את השעה');
  T('clock', 'elapsed', 'time', 3, 'Elapsed time', 'חישוב זמן שעבר', 'Time that passes', 'זמן שעובר');
  T('clock', 'elapsed2', 'time', 4, 'Elapsed time in hours and minutes', 'זמן שעבר בשעות ובדקות', 'Hours and minutes later', 'שעות ודקות אחר כך');
  T('clock', 'h24', 'time', 4, '24-hour clock', 'שעון 24 שעות', '24-hour clock', 'שעון 24 שעות');
  T('clock', 'duration', 'time', 5, 'Duration between two times', 'משך זמן בין שתי שעות', 'How long between?', 'כמה זמן עבר?');
  T('clock', 'schedule', 'time', 6, 'Reading timetables', 'קריאת לוחות זמנים', 'Timetables', 'לוחות זמנים');
  T('clock', 'zones', 'time', 7, 'Time zones', 'אזורי זמן', 'Time zones', 'אזורי זמן');
  // ---- geography (World Explorer)
  T('explore', 'landsea', 'world', -1, 'Land, water and air transport', 'תחבורה ביבשה, במים ובאוויר', 'Land, water or air?', 'יבשה, מים או אוויר?');
  T('explore', 'vehicle', 'world', -1, 'Choosing transport', 'בחירת כלי תחבורה', 'Pick the ride', 'בוחרים כלי תחבורה');
  T('explore', 'continent', 'world', 1, 'The continents', 'היבשות', 'Continents', 'יבשות');
  T('explore', 'flag', 'world', 1, 'Countries and their flags', 'מדינות ודגלים', 'Flags', 'דגלים');
  T('explore', 'rail', 'world', 1, 'Travel over land and sea', 'מסעות ביבשה ובים', 'Can a train go there?', 'רכבת יכולה להגיע לשם?');
  T('explore', 'trip', 'world', 2, 'Planning a journey', 'תכנון מסע', 'Plan the trip', 'מתכננים את הטיול');
  T('explore', 'where', 'world', 2, 'Animals and places of the continents', 'בעלי חיים ומקומות ביבשות', 'Where in the world?', 'איפה בעולם?');
  T('explore', 'compass', 'world', 3, 'Compass directions on a map', 'כיווני מצפן במפה', 'North, south, east, west', 'צפון, דרום, מזרח, מערב');
  T('explore', 'capital', 'world', 4, 'Capital cities', 'ערי בירה', 'Capital cities', 'ערי בירה');
  T('explore', 'ocean', 'world', 4, 'The oceans', 'האוקיינוסים', 'Oceans', 'אוקיינוסים');
  T('explore', 'equator', 'world', 5, 'The equator and hemispheres', 'קו המשווה וחצאי הכדור', 'The equator', 'קו המשווה');
  T('explore', 'latlong', 'world', 6, 'Latitude and longitude', 'קווי רוחב ואורך', 'Map coordinates', 'קואורדינטות במפה');
  // ---- history (Time Machine)
  T('timemachine', 'oldnew', 'history', -1, 'Long ago and now', 'פעם והיום', 'Which is older?', 'מה יותר ישן?');
  T('timemachine', 'thennow', 'history', 0, 'How life changed over time', 'איך החיים השתנו לאורך הזמן', 'Then and now', 'אז והיום');
  T('timemachine', 'order', 'history', 1, 'Putting events in time order', 'סידור אירועים לפי זמן', 'Put them in order', 'מסדרים לפי הזמן');
  T('timemachine', 'who', 'history', 2, 'Famous inventors and discoverers', 'ממציאים ומגלים מפורסמים', 'Famous discoverers', 'ממציאים ומגלים');
  T('timemachine', 'century', 'history', 4, 'Centuries', 'מאות', 'Which century?', 'באיזו מאה?');
  T('timemachine', 'era', 'history', 5, 'Ages of history', 'תקופות בהיסטוריה', 'Which age of history?', 'באיזו תקופה?');
  T('timemachine', 'howlong', 'history', 5, 'Time spans between events', 'משך זמן בין אירועים', 'How long between?', 'כמה זמן עבר?');
  T('timemachine', 'bce', 'history', 6, 'BCE and CE dates', 'תאריכים לפני הספירה ולספירה', 'Before and after year 1', 'לפני הספירה ואחריה');
  // ---- nature (Nature Trail)
  T('nature', 'home', 'nature', -1, 'Animals and where they live', 'בעלי חיים ואיפה הם חיים', 'Where does it live?', 'איפה הוא גר?');
  T('nature', 'eat', 'nature', -1, 'What animals eat', 'מה בעלי חיים אוכלים', 'What does it eat?', 'מה הוא אוכל?');
  T('nature', 'weather', 'nature', -1, 'Weather and what we wear', 'מזג אוויר ומה לובשים', 'Dress for the weather', 'מתלבשים לפי מזג האוויר');
  T('nature', 'seasons', 'nature', 0, 'The four seasons', 'ארבע עונות השנה', 'Seasons', 'עונות השנה');
  T('nature', 'lifecycle', 'nature', 1, 'Life cycles of plants and animals', 'מחזורי חיים של צמחים ובעלי חיים', 'Life cycles', 'מחזורי חיים');
  T('nature', 'eaters', 'nature', 1, 'Herbivores, carnivores, omnivores', 'אוכלי צמחים, אוכלי בשר, אוכלי כול', 'Plant-eaters and meat-eaters', 'אוכלי צמחים ואוכלי בשר');
  T('nature', 'classify', 'nature', 3, 'Classifying animals (mammals, birds, fish, reptiles, amphibians, insects)', 'מיון בעלי חיים (יונקים, עופות, דגים, זוחלים, דו־חיים, חרקים)', 'Animal groups', 'קבוצות בעלי חיים');
  T('nature', 'plantparts', 'nature', 2, 'Parts of a plant and what they do', 'חלקי הצמח ותפקידם', 'Parts of a plant', 'חלקי הצמח');
  T('nature', 'foodchain', 'nature', 4, 'Food chains', 'שרשראות מזון', 'Food chains', 'שרשראות מזון');
  T('nature', 'water', 'nature', 4, 'The water cycle', 'מחזור המים', 'The water cycle', 'מחזור המים');
  T('nature', 'adapt', 'nature', 5, 'Adaptations', 'התאמות לסביבה', 'Animal superpowers', 'כוחות־העל של בעלי החיים');
  T('nature', 'ecosystem', 'nature', 5, 'Producers, consumers, decomposers', 'יצרנים, צרכנים, מפרקים', 'Who does what in nature?', 'מי עושה מה בטבע?');
  T('nature', 'photo', 'nature', 6, 'Photosynthesis', 'פוטוסינתזה', 'How plants make food', 'איך צמחים מכינים מזון');
  // ---- art (Art Studio)
  T('art', 'colors', 'art', -1, 'Naming colours in a picture', 'זיהוי צבעים בתמונה', 'Find the colour', 'מוצאים את הצבע');
  T('art', 'same', 'art', -1, 'Visual matching', 'התאמה חזותית', 'Find the same painting', 'מוצאים את אותו ציור');
  T('art', 'mix', 'art', 0, 'Mixing colours (primary, secondary, complementary)', 'ערבוב צבעים (יסוד, משניים, משלימים)', 'Mix the paint', 'מערבבים צבעים');
  T('art', 'detail', 'art', 1, 'Close looking: details in a work of art', 'התבוננות מקרוב: פרטים ביצירה', 'Zoom detective', 'בלשי זום');
  T('art', 'warm', 'art', 1, 'Warm and cool colours', 'צבעים חמים וקרים', 'Warm or cool?', 'חם או קר?');
  T('art', 'artist', 'art', 2, 'Famous artists and their work', 'אמנים מפורסמים ויצירותיהם', 'Who painted it?', 'מי צייר?');
  T('art', 'title', 'art', 2, 'Famous paintings', 'ציורים מפורסמים', 'Name the painting', 'איך קוראים לציור?');
  T('art', 'movement', 'art', 4, 'Art movements and styles', 'זרמים וסגנונות באמנות', 'Art styles', 'סגנונות באמנות');
  T('art', 'older', 'art', 4, 'Art across time', 'אמנות לאורך הזמן', 'Which is older?', 'מה יותר ישן?');
  T('art', 'era', 'art', 6, 'Art history by century', 'תולדות האמנות לפי מאות', 'Which century?', 'באיזו מאה?');
  T('art', 'technique', 'art', 7, 'Art techniques (printmaking, collage, pointillism…)', 'טכניקות באמנות (הדפס, קולאז׳, פוינטיליזם…)', 'How was it made?', 'איך זה נעשה?');
  // ---- music (Music Hall)
  T('music', 'count', 'music', -1, 'Steady beat: counting beats', 'פעמה קבועה: ספירת פעמות', 'Count the beats', 'סופרים תיפופים');
  T('music', 'loudfast', 'music', -1, 'Dynamics and tempo (loud/quiet, fast/slow)', 'עוצמה ומהירות (חזק/חלש, מהר/לאט)', 'Loud or quiet, fast or slow', 'חזק או חלש, מהר או לאט');
  T('music', 'who', 'music', 0, 'Recognising instruments by their sound', 'זיהוי כלי נגינה לפי הצליל', 'Who is playing?', 'מי מנגן?');
  T('music', 'highlow', 'music', 0, 'Pitch: high and low sounds', 'גובה צליל: גבוה ונמוך', 'High or low?', 'גבוה או נמוך?');
  T('music', 'echo', 'music', 1, 'Melodic memory: echoing a tune', 'זיכרון מלודי: חזרה על מנגינה', 'Echo the tune', 'הד של מנגינה');
  T('music', 'happy', 'music', 1, 'Mood in music (major and minor)', 'אווירה במוזיקה (מז׳ור ומינור)', 'Happy or sad?', 'שמח או עצוב?');
  T('music', 'tune', 'music', 2, 'Famous pieces and their composers', 'יצירות מפורסמות והמלחינים שלהן', 'Name that tune', 'איזו מנגינה?');
  T('music', 'staff', 'music', 3, 'Reading notes on the staff', 'קריאת תווים על החמשה', 'Read the notes', 'קוראים תווים');
  T('music', 'rhythm', 'music', 3, 'Note values and beats in a bar', 'ערכי תווים ופעמות בתיבה', 'How long is the note?', 'כמה זמן התו?');
  T('music', 'family', 'music', 4, 'Instrument families of the orchestra', 'משפחות הכלים בתזמורת', 'Instrument families', 'משפחות כלים');
  T('music', 'composer', 'music', 5, 'Composers and their music', 'מלחינים והמוזיקה שלהם', 'Who composed it?', 'מי הלחין?');
  T('music', 'interval', 'music', 6, 'Intervals (2nd to octave)', 'מרווחים (סקונדה עד אוקטבה)', 'Steps and leaps', 'צעדים וקפיצות');
  T('music', 'chord', 'music', 6, 'Major, minor and diminished chords', 'אקורדים: מז׳ור, מינור ומוקטן', 'Major or minor?', 'מז׳ור או מינור?');
  T('music', 'keysig', 'music', 7, 'Key signatures', 'סימני היתק', 'Key signatures', 'סימני היתק');
  // ---- money (Coin Market)
  T('market', 'count', 'money', 1, 'Counting money (the value of coins)', 'ספירת כסף (ערך המטבעות)', 'How much money?', 'כמה כסף?');
  T('market', 'same', 'money', 1, 'Skip-counting coins of one value', 'ספירה בקפיצות (מטבעות זהים)', 'Same coins', 'אותם מטבעות');
  T('market', 'total', 'money', 2, 'Adding up an amount of money', 'חישוב סכום כסף', 'How much money?', 'כמה כסף?');
  T('market', 'pay', 'money', 2, 'Paying an exact amount', 'תשלום סכום מדויק', 'Pay for it', 'משלמים');
  T('market', 'change', 'money', 3, 'Making change', 'חישוב עודף', 'Get the change', 'מקבלים עודף');
  T('market', 'budget', 'money', 4, 'Budgeting', 'עמידה בתקציב', 'Stay in budget', 'לעמוד בתקציב');
  T('market', 'unit', 'money', 5, 'Unit price', 'מחיר ליחידה', 'Price per item', 'מחיר ליחידה');
  T('market', 'discount', 'money', 6, 'Discounts (percent off)', 'הנחות (באחוזים)', 'Discounts', 'הנחות');
  T('market', 'split', 'money', 6, 'Splitting a bill (with a tip)', 'חלוקת חשבון (כולל טיפ)', 'Split the bill', 'לחלק את החשבון');
  T('market', 'tax', 'money', 7, 'Adding tax', 'חישוב מס', 'Adding tax', 'הוספת מס');
  T('market', 'profit', 'money', 7, 'Profit as a percentage', 'אחוז רווח', 'Profit', 'רווח');
  // ---- reading (Reading world), per language
  T('reading', 'findLetter', 'phon', -1, 'Letter recognition', 'זיהוי אותיות', 'Find the letter', 'מוצאים את האות');
  T('reading', 'caseMatch', 'phon', 0, 'Upper- and lower-case letters', 'אותיות גדולות וקטנות', 'Big & small letters', 'אותיות גדולות וקטנות', ['Final letters', 'אותיות סופיות']);
  T('reading', 'firstLetter', 'phon', 0, 'Initial sound (phonemic awareness)', 'הצליל הפותח (מודעות פונולוגית)', 'First letter', 'האות הראשונה');
  T('reading', 'pickWord', 'decode', 1, 'Reading single words', 'קריאת מילים בודדות', 'Pick the word', 'בוחרים את המילה');
  T('reading', 'buildWord', 'decode', 1, 'Building words from letters', 'הרכבת מילים מאותיות', 'Build the word', 'בונים את המילה');
  T('reading', 'listenPick', 'decode', 1, 'Matching a spoken word to its written form', 'התאמת מילה שנשמעת למילה הכתובה', 'Listen & find', 'מקשיבים ומוצאים');
  T('reading', 'sentence', 'comp', 1, 'Reading a sentence for meaning', 'הבנת משפט', 'Read & answer', 'קוראים ועונים');
  T('reading', 'fillBlank', 'comp', 2, 'Completing sentences from context', 'השלמת משפט לפי ההקשר', 'Fill the blank', 'משלימים את החסר');
  T('reading', 'story', 'comp', 2, 'Comprehension of short texts', 'הבנת טקסטים קצרים', 'Story time', 'סיפור קצר');
  T('reading', 'spell', 'spell', 2, 'Spelling words', 'כתיב מילים', 'Spell it', 'מאייתים');
  T('reading', 'antonym', 'vocab', 2, 'Antonyms (opposites)', 'הפכים', 'Opposites', 'הפכים');
  T('reading', 'synonym', 'vocab', 3, 'Synonyms', 'מילים נרדפות', 'Same meaning', 'מילים נרדפות');
  T('reading', 'homophone', 'vocab', 3, 'Homophones (words that sound alike)', 'מילים שנשמעות דומה', 'Sounds alike', 'נשמע דומה');
  T('reading', 'grammar', 'gram', 4, 'Word forms (grammar)', 'צורות המילה (דקדוק)', 'Word forms', 'צורות המילה');
  T('reading', 'root', 'gram', 4, 'Prefixes, suffixes and word roots', 'תחיליות, סופיות ושורשים', 'Word parts', 'השורש', ['Word roots (shoresh)', 'השורש']);
  // ---- spelling (Spelling Bee), per language
  T('spelling', 'first', 'phon', 0, 'Initial letter of a word', 'האות הפותחת של מילה', 'First letter', 'האות הראשונה');
  T('spelling', 'missing', 'spell', 1, 'Spelling: one missing letter', 'כתיב: אות חסרה', 'The missing letter', 'האות החסרה');
  T('spelling', 'listen', 'spell', 1, 'Spelling from dictation', 'כתיב מהכתבה', 'Listen & spell', 'מקשיבים ומאייתים');
  T('spelling', 'fix', 'spell', 2, 'Recognising the correct spelling', 'זיהוי הכתיב הנכון', 'Which spelling?', 'איזה כתיב?');
  T('spelling', 'missing2', 'spell', 3, 'Spelling: two missing letters', 'כתיב: שתי אותיות חסרות', 'Two missing letters', 'שתי אותיות חסרות');
  T('spelling', 'listen3', 'spell', 4, 'Dictation of long words', 'הכתבה של מילים ארוכות', 'Long words', 'מילים ארוכות');
  // ---- story (Story Forest), per language
  T('story', 'build3', 'gram', 1, 'Building simple sentences', 'בניית משפטים פשוטים', 'Little sentences', 'משפטים קטנים');
  T('story', 'order', 'gram', 2, 'Sentence structure (word order)', 'מבנה המשפט (סדר המילים)', 'Word order', 'סדר המילים');
  T('story', 'sequence', 'comp', 2, 'Sequencing the events of a story', 'רצף האירועים בסיפור', 'Story order', 'סדר הסיפור');
  T('story', 'connect', 'gram', 3, 'Connecting words', 'מילות קישור', 'The right word', 'המילה הנכונה');
  T('story', 'title', 'comp', 3, 'Main idea (a title for the story)', 'הרעיון המרכזי (כותרת לסיפור)', 'Name the story', 'שם לסיפור');
  // ---- memory (Memory Cave): two are language skills
  T('memory', 'pics', 'mem', -1, 'Visual memory (picture pairs)', 'זיכרון חזותי (זוגות תמונות)', 'Picture pairs', 'זוגות תמונות');
  T('memory', 'sums', 'add', 1, 'Recalling addition facts', 'שליפת עובדות חיבור', 'Sum pairs', 'זוגות חיבור');
  T('memory', 'words', 'vocab', 1, 'Word–picture vocabulary', 'אוצר מילים: מילה ותמונה', 'Word & picture', 'מילה ותמונה');
  T('memory', 'opposites', 'vocab', 2, 'Antonyms from memory', 'הפכים מהזיכרון', 'Opposites', 'הפכים');
  T('memory', 'facts', 'mul', 3, 'Recalling multiplication facts', 'שליפת עובדות הכפל', 'Times-table pairs', 'זוגות לוח הכפל');
  // ---- logic (Logic Tower)
  T('logic', 'next', 'pattern', -1, 'Patterns: what comes next', 'זיהוי חוקיות: מה בא אחר כך', 'What comes next?', 'מה בא אחר כך?');
  T('logic', 'odd', 'class', 0, 'Classification: odd one out', 'מיון: יוצא הדופן', 'Odd one out', 'מי לא שייך?');
  T('logic', 'grid', 'pattern', 1, 'Completing a pattern grid', 'השלמת חוקיות בטבלה', 'Finish the grid', 'משלימים את הלוח');
  T('logic', 'seq', 'pattern', 2, 'Number patterns', 'דפוסי מספרים', 'Number patterns', 'דפוסי מספרים');
  T('logic', 'riddle', 'reason', 3, 'Riddles (verbal reasoning)', 'חידות (חשיבה מילולית)', 'Riddles', 'חידות');
  T('logic', 'sudoku', 'reason', 3, 'Sudoku (deductive reasoning)', 'סודוקו (הסקה לוגית)', 'Mini sudoku', 'סודוקו קטן');
  T('logic', 'seq2', 'pattern', 4, 'Number series', 'סדרות מספרים', 'Number sequences', 'סדרות מספרים');
  T('logic', 'code', 'reason', 4, 'Codes and ciphers', 'צפנים ופענוח', 'Secret codes', 'צפנים סודיים');
  T('logic', 'truth', 'reason', 5, 'True / false statements (logic)', 'טענות אמת ושקר (לוגיקה)', 'True or false logic', 'אמת או שקר');
  T('logic', 'venn', 'class', 5, 'Sets and Venn diagrams', 'קבוצות ודיאגרמות ון', 'Overlapping groups', 'קבוצות חופפות');
  T('logic', 'deduce', 'reason', 6, 'Logic-grid deduction', 'חידות הסקה (למי יש מה)', 'Who has what?', 'למי יש מה?');

  // rounds that are not one skill: the Games Arcade by game, the realm/portal games and the eagle by the world they count for
  const GAME_AREA = { studio: 'geo', kick: 'geo', cannon: 'num', bridge: 'add', bakery: 'frac', robot: 'code', spell: 'spell', detective: 'comp', physics: 'physics' };
  const WORLD_AREA = { math: 'mathmix', reading: 'langmix', spelling: 'spell', story: 'comp', logic: 'reason', clock: 'time', market: 'money', memory: 'mem', chess: 'strategy', eagle: 'mixed', scrolls: 'scroll', music: 'music', art: 'art', nature: 'nature', timemachine: 'history', explore: 'world' };
  const LANG_WORLDS = ['reading', 'spelling', 'story', 'memory'];

  const GRADES = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], TOP = 8;
  const HE_GR = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳'];
  function gradeName(g, ui) { if (ui === 'he') return g === -1 ? 'גן טרום חובה (גיל 4)' : g === 0 ? 'גן חובה (גיל 5)' : 'כיתה ' + HE_GR[g - 1]; return g === -1 ? 'Pre-K (age 4)' : g === 0 ? 'Kindergarten (age 5)' : 'Grade ' + g; }
  const langName = (l, ui) => ui === 'he' ? (l === 'he' ? 'עברית' : 'אנגלית') : (l === 'he' ? 'Hebrew' : 'English');
  const topic = (w, k) => TOPICS[w + ':' + k] || null;
  // the school term; a language topic says which language it was in (and Hebrew content has its own terms, e.g. final letters)
  function topicName(tp, ui, cl) { const hl = cl === 'he' && tp.hl; const s = hl ? tp.hl[ui === 'he' ? 1 : 0] : tp[ui === 'he' ? 'he' : 'en']; return tp.lang && cl ? s + ' · ' + langName(cl, ui) : s; }
  function areaName(a, ui, cl) { const A = AREAS[a]; if (!A) return a; const s = A[ui === 'he' ? 'he' : 'en']; return A.lang && cl ? s + ' · ' + langName(cl, ui) : s; }
  // which subject a finished round counts for: {area, topic|null, lang|null}
  function rowArea(r, main) {
    const tp = topic(r.world, r.mode); const lang = LANG_WORLDS.includes(r.world) || (tp && tp.lang) ? (r.lang || main) : null;
    if (tp) return { area: tp.a, topic: tp, lang: tp.lang ? lang : null };
    if (r.game && GAME_AREA[r.game]) { const a = GAME_AREA[r.game]; return { area: a, topic: null, lang: AREAS[a].lang ? (r.lang || main) : null }; }
    const a = WORLD_AREA[r.world] || 'mathmix'; return { area: a, topic: null, lang: AREAS[a].lang ? (r.lang || main) : null };
  }
  // a topic's standing from its answers (KQ.skills stats: n, recent, rate over the last 20)
  function status(s) { if (!s || !s.n) return 'none'; if (s.recent >= 6 && s.rate >= 0.8) return 'mastered'; if (s.recent >= 3 && s.rate < 0.6) return 'help'; return 'practising'; }
  // stats(world, lang|null) → the skills map for that world (and language); a language topic falls back to the language-blind map
  // (answers from before per-language tracking) only while no language map has anything for it
  function topicStats(tp, stats, lang) { if (!tp.lang) return stats(tp.w)[tp.k] || null; const m = stats(tp.w + '@' + lang)[tp.k]; if (m && m.n) return m;
    const o = stats(tp.w + '@' + (lang === 'he' ? 'en' : 'he'))[tp.k]; if (o && o.n) return null;   /* answered only in the other language: nothing in this one */
    return stats(tp.w)[tp.k] || null; }
  // the grade benchmark: this grade's topics, earlier topics played but not yet secure, later topics already mastered (ahead)
  function benchmark(grade, stats, lang) {
    const out = { now: [], gaps: [], ahead: [], grade, top: TOP };
    for (const id in TOPICS) { const tp = TOPICS[id], s = topicStats(tp, stats, lang), st = status(s), row = { tp, s, st, lang: tp.lang ? lang : null };
      if (tp.g === grade) out.now.push(row); else if (tp.g < grade) { if (st === 'help' || st === 'practising') out.gaps.push(row); } else if (st === 'mastered') out.ahead.push(row); }   /* an earlier topic never played is not a gap: the child may simply know it */
    const ord = { help: 0, practising: 1, none: 2, mastered: 3 }; out.now.sort((a, b) => ord[a.st] - ord[b.st]); out.gaps.sort((a, b) => ord[a.st] - ord[b.st] || b.tp.g - a.tp.g);
    return out;
  }
  window.KQCurr = { AREAS, GROUPS, TOPICS, GRADES, TOP, LANG_WORLDS, GAME_AREA, WORLD_AREA, topic, topicName, areaName, rowArea, status, topicStats, benchmark, gradeName, langName };
})();
