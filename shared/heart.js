/* Kingdom Quest — the Heart Garden (Yoni 2026-10-03: 'feelings and kindness … a must at every level, age-appropriate: 4–5 sharing,
   caring, sadness, expressing feelings; 6–9+ group communication, inclusion, never ganging up, group integrity' … 'the heart garden is
   not an option, it's a must for every level that you pass').
   Passing a level anywhere plants a seed (kq.js ladder → state.heart[pid].pending); the next game the child starts, in any world, opens one
   short scene first. Nothing is scored and no child is compared with another: a kind choice makes a flower bloom in the child's garden; any
   other choice gets a gentle "how would they feel?" and another try. Ages 4–7 first name the feeling (faces), then choose what to do.
   2026-10-07, trick questions (Yoni: 'they have to think'): every choice sounds all right and only one is really kind, like playing with
   your best friend or with the new kid who is alone. 8 and up have only those; 4–7 get theirs as soon as their lines are recorded.
   API: KQHeart.gate(world, cont) → true when a scene opened (cont runs after it) · open({band, practice}, done) · garden(pid) · SCENES */
(function () {
  'use strict';
  if (!window.KQ) return;
  const { t } = KQ, el = KQ.ui.el;
  KQ.i18n.extend({
    en: { hg_title: 'Heart Garden', hg_seed: 'You passed a level, so a seed is waiting in your Heart Garden. Let’s plant it!', hg_feel: 'How do you think they feel?', hg_do: 'What could you do?', hg_bloom: 'A flower bloomed in your Heart Garden!', hg_again: 'Let’s think again.', hg_back: 'Back to the game', hg_listen: 'Listen',
      f_happy: 'Happy', f_sad: 'Sad', f_angry: 'Angry', f_scared: 'Scared', f_worried: 'Worried', f_lonely: 'Lonely',
      hg_feelYes: 'Yes, they feel {f}.', hg_feelNo: 'Look at the picture again. What does their face say?' },
    he: { hg_title: 'גן הלב', hg_seed: 'עברתם שלב, אז זרע מחכה לכם בגן הלב. בואו נשתול אותו!', hg_feel: 'איך לדעתכם מרגישים שם?', hg_do: 'מה אפשר לעשות?', hg_bloom: 'פרח פרח בגן הלב שלכם!', hg_again: 'בואו נחשוב שוב.', hg_back: 'חוזרים למשחק', hg_listen: 'הקשבה',
      f_happy: 'שמחה', f_sad: 'עצב', f_angry: 'כעס', f_scared: 'פחד', f_worried: 'דאגה', f_lonely: 'בדידות',
      hg_feelYes: 'נכון, מרגישים {f}.', hg_feelNo: 'מסתכלים שוב על התמונה. מה הפנים אומרות?' }
  });
  const he = () => KQ.i18n.lang === 'he', L = p => p[he() ? 1 : 0];
  /* scenes: pic (icons), feel (ages 4–7: the feeling to name), story, choices [[text, kind?]], bloom (why the kind choice helps), nudge (a question back) */
  const YOUNG = [
    { id: 'share', pic: ['👤', '✍️', '👤'], feel: 'sad', story: ['Maya has two crayons. Tom has none, and he wants to draw too.', 'למאיה יש שני צבעים. לתום אין אף אחד, וגם הוא רוצה לצייר.'], q: ['What could Maya do?', 'מה מאיה יכולה לעשות?'],
      ch: [[['Share a crayon with Tom', 'לתת לתום צבע אחד'], 1], [['Keep both crayons and turn away', 'לשמור את שני הצבעים ולהסתובב'], 0], [['Hide the crayons', 'להחביא את הצבעים'], 0]],
      bloom: ['Now they can both draw. Sharing makes friends happy.', 'עכשיו שניהם מציירים. כשמשתפים, החברים שמחים.'], nudge: ['How would Tom feel with nothing to draw with?', 'איך תום ירגיש בלי שום צבע?'] },
    { id: 'fall', pic: ['👤', '❤️', '💧'], feel: 'sad', story: ['Ben fell down and hurt his knee. He is crying.', 'בן נפל ונפצע בברך. הוא בוכה.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Ask “Are you okay?” and help him up', 'לשאול “אתה בסדר?” ולעזור לו לקום'], 1], [['Laugh', 'לצחוק'], 0], [['Keep playing and not look', 'להמשיך לשחק ולא להסתכל'], 0]],
      bloom: ['Helping a friend who is hurt shows you care.', 'כשעוזרים לחבר שנפצע, מראים שאכפת לנו.'], nudge: ['How would you feel if you fell and nobody helped?', 'איך הייתם מרגישים אם הייתם נופלים ואף אחד לא היה עוזר?'] },
    { id: 'teddy', pic: ['👤', '🧸', '🔍'], feel: 'sad', story: ['Noa lost her teddy bear. She feels very sad.', 'נועה איבדה את הדובי שלה. היא מאוד עצובה.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Help her look for it and stay with her', 'לעזור לה לחפש ולהישאר איתה'], 1], [['Say “It’s just a toy”', 'להגיד “זה סתם צעצוע”'], 0], [['Walk away', 'ללכת משם'], 0]],
      bloom: ['When a friend is sad, being with them helps a lot.', 'כשחבר עצוב, להיות לידו עוזר מאוד.'], nudge: ['How does it feel to lose something you love?', 'איך מרגישים כשמאבדים משהו שאוהבים?'] },
    { id: 'tower', pic: ['🧱', '💥', '👤'], feel: 'angry', story: ['Someone knocked over the tower you built. You feel angry.', 'מישהו הפיל את המגדל שבניתם. אתם כועסים.'], q: ['What could you do?', 'מה אפשר לעשות?'],
      ch: [[['Take a deep breath and say “I feel angry because my tower fell”', 'לנשום עמוק ולהגיד “כועס לי כי המגדל נפל”'], 1], [['Knock over their tower too', 'להפיל גם להם את המגדל'], 0], [['Throw the blocks', 'לזרוק את הקוביות'], 0]],
      bloom: ['Saying how you feel with words helps everyone understand.', 'כשאומרים במילים מה מרגישים, כולם מבינים.'], nudge: ['What happens if everyone knocks things over when they are angry?', 'מה יקרה אם כולם יפילו דברים כשהם כועסים?'] },
    { id: 'swing', pic: ['👤', '🌳', '👤'], feel: 'angry', story: ['Two friends both want the same swing.', 'שני חברים רוצים את אותה נדנדה.'], q: ['What could they do?', 'מה הם יכולים לעשות?'],
      ch: [[['Take turns: count to twenty, then swap', 'לעשות תורות: לספור עד עשרים ולהתחלף'], 1], [['Push the other one off', 'לדחוף את השני'], 0], [['Cry until they get it', 'לבכות עד שמקבלים'], 0]],
      bloom: ['Taking turns means everyone gets to play.', 'כשעושים תורות, כולם משחקים.'], nudge: ['Is there a way that both friends can swing?', 'יש דרך ששני החברים יתנדנדו?'] },
    { id: 'newkid', pic: ['🏫', '👤', '👥'], feel: 'lonely', story: ['A new child joins the class and stands alone at recess.', 'ילד חדש הגיע לכיתה ועומד לבד בהפסקה.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Say hi and invite them to play', 'להגיד שלום ולהזמין אותו לשחק'], 1], [['Look away', 'להסתכל הצידה'], 0], [['Whisper about them', 'ללחוש עליו'], 0]],
      bloom: ['A friendly “hi” can make someone’s whole day.', 'שלום חם יכול לשמח מישהו לכל היום.'], nudge: ['How does it feel to be new and alone?', 'איך מרגישים כשחדשים ולבד?'] },
    { id: 'sorry', pic: ['🧃', '💦', '👤'], feel: 'sad', story: ['You bumped into Dan by mistake, and his juice spilled.', 'נתקלתם בדן בטעות, והמיץ שלו נשפך.'], q: ['What could you do?', 'מה אפשר לעשות?'],
      ch: [[['Say “Sorry!” and help clean up', 'להגיד “סליחה!” ולעזור לנקות'], 1], [['Run away', 'לברוח'], 0], [['Say “It’s not my fault”', 'להגיד “זה לא באשמתי”'], 0]],
      bloom: ['Saying sorry and helping fix it makes things right.', 'כשמבקשים סליחה ועוזרים לתקן, הכול מסתדר.'], nudge: ['How would Dan feel with his juice gone?', 'איך דן ירגיש בלי המיץ?'] },
    { id: 'dark', pic: ['🌙', '👤', '🕯️'], feel: 'scared', story: ['Your friend is scared of the dark at a sleepover.', 'חבר שלכם מפחד מהחושך בלילה שבו ישנים יחד.'], q: ['What could you do?', 'מה אפשר לעשות?'],
      ch: [[['Hold their hand and say “I’m here”', 'להחזיק לו את היד ולהגיד “אני פה”'], 1], [['Make scary noises', 'לעשות קולות מפחידים'], 0], [['Laugh at them', 'לצחוק עליו'], 0]],
      bloom: ['Feeling scared is okay. A friend nearby makes it easier.', 'זה בסדר לפחד. חבר קרוב עוזר.'], nudge: ['What helps you when you feel scared?', 'מה עוזר לכם כשאתם מפחדים?'] },
    /* the trick questions (Yoni 2026-10-07: 'we want them to be trick questions … would you rather play with a new kid or your friend? The
       new kid, to make them feel good; your friend is your friend anyway … so they have to think'). Every choice sounds all right; only one
       is really kind. They take over from the eight above once their lines are recorded (see heard() below) */
    { id: 'friendnew', trick: 1, pic: ['👥', '❤️', '👤'], feel: 'lonely', story: ['Your best friend wants to play with you. A new kid is standing all alone.', 'החבר הכי טוב שלכם רוצה לשחק איתכם. ילד חדש עומד לבד לגמרי.'], q: ['Who will you play with?', 'עם מי תשחקו?'],
      ch: [[['With my best friend, like always', 'עם החבר הכי טוב שלי, כמו תמיד'], 0], [['With the new kid', 'עם הילד החדש'], 1]],
      bloom: ['Your best friend is still your friend. The new kid had nobody, and now they feel welcome!', 'החבר הכי טוב שלכם נשאר החבר שלכם. לילד החדש לא היה אף אחד, ועכשיו הוא מרגיש רצוי!'], nudge: ['Your best friend has you every day. Who has nobody to play with today?', 'לחבר הכי טוב יש אתכם כל יום. למי אין היום אף אחד לשחק איתו?'] },
    { id: 'drawing', trick: 1, pic: ['👤', '🖼️', '🎁'], feel: 'happy', story: ['Your friend drew a picture just for you. You don’t really like it.', 'חברה ציירה ציור במיוחד בשבילכם. הוא לא ממש מוצא חן בעיניכם.'], q: ['What will you say?', 'מה תגידו?'],
      ch: [[['“I don’t like it”', '“הוא לא מוצא חן בעיניי”'], 0], [['“Thank you! You made it just for me!”', '“תודה! ציירת אותו במיוחד בשבילי!”'], 1], [['Say nothing and put it away', 'לא להגיד כלום ולשים אותו בצד'], 0]],
      bloom: ['That was true and kind. The best part of a present is that someone thought of you.', 'זה היה נכון וגם נחמד. הדבר הכי טוב במתנה הוא שמישהו חשב עליכם.'], nudge: ['Is there something true you can say that will make your friend smile?', 'יש משהו נכון שאפשר להגיד, שיגרום לחברה לחייך?'] },
    { id: 'race', trick: 1, pic: ['🏅', '💨', '👤'], feel: 'sad', story: ['You won the race! Your friend came last and looks sad.', 'ניצחתם במרוץ! החבר שלכם הגיע אחרון ונראה עצוב.'], q: ['What will you do?', 'מה תעשו?'],
      ch: [[['Jump and shout “I won! I won!”', 'לקפוץ ולצעוק “ניצחתי! ניצחתי!”'], 0], [['Say “Good race! Want to run again?”', 'להגיד “מרוץ טוב! רוצה לרוץ שוב?”'], 1]],
      bloom: ['You can be happy you won and still think of your friend. That’s a real champion!', 'אפשר לשמוח בניצחון ועדיין לחשוב על החבר. ככה עושים אלופים אמיתיים!'], nudge: ['It’s fine to be happy! How does your friend feel while you shout?', 'מותר לשמוח! איך החבר מרגיש כשאתם צועקים?'] },
    { id: 'cake', trick: 1, pic: ['🏠', '🎂', '❤️'], feel: 'happy', story: ['Grandma baked you a cake. It’s a kind you don’t like.', 'סבתא אפתה לכם עוגה. זה סוג של עוגה שאתם לא אוהבים.'], q: ['What will you do?', 'מה תעשו?'],
      ch: [[['Say “Yuck, it’s not tasty”', 'להגיד “איכס, לא טעים לי”'], 0], [['Say “Thank you for baking for me!” and taste a little', 'להגיד “תודה שאפית לי!” ולטעום קצת'], 1], [['Hide your piece in a napkin', 'להחביא את החתיכה במפית'], 0]],
      bloom: ['Grandma baked it with love. Saying thank you shows you noticed.', 'סבתא אפתה באהבה. כשאומרים תודה, מראים ששמנו לב.'], nudge: ['How would Grandma feel if she heard “yuck”, or found the cake hidden?', 'איך סבתא תרגיש אם תשמע “איכס”, או תמצא את העוגה מוחבאת?'] },
    { id: 'twoplay', trick: 1, pic: ['⚽', '👥', '🧩'], story: ['Two friends both ask you to play, each one a different game.', 'שני חברים מזמינים אתכם לשחק, כל אחד במשחק אחר.'], q: ['What will you do?', 'מה תעשו?'],
      ch: [[['Pick the friend with the more fun game', 'לבחור בחבר עם המשחק הכי כיף'], 0], [['Ask them both to play together', 'להציע לשניהם לשחק ביחד'], 1], [['Play alone, so nobody is sad', 'לשחק לבד, כדי שאף אחד לא יהיה עצוב'], 0]],
      bloom: ['Now nobody is left out, and you have two friends to play with!', 'עכשיו אף אחד לא נשאר בחוץ, ויש לכם שני חברים לשחק איתם!'], nudge: ['Is there a way that nobody is left out?', 'יש דרך שאף אחד לא יישאר בחוץ?'] },
    { id: 'joke', trick: 1, pic: ['👥', '💬', '👤'], feel: 'sad', story: ['Your friend makes a joke about another kid’s hair. Everyone laughs.', 'החבר שלכם עושה בדיחה על השיער של ילד אחר. כולם צוחקים.'], q: ['What will you do?', 'מה תעשו?'],
      ch: [[['Laugh too, it’s my friend’s joke', 'לצחוק גם, זאת בדיחה של החבר שלי'], 0], [['Don’t laugh, and say “That’s not nice”', 'לא לצחוק, ולהגיד “זה לא נחמד”'], 1], [['Laugh quietly so nobody notices', 'לצחוק בשקט שאף אחד לא ישים לב'], 0]],
      bloom: ['A good friend doesn’t laugh when someone gets hurt, even at a friend’s joke.', 'חבר טוב לא צוחק כשמישהו נפגע, גם כשהבדיחה של חבר.'], nudge: ['How does the kid with the hair feel when everyone laughs?', 'איך מרגיש הילד עם השיער כשכולם צוחקים?'] },
    { id: 'broke', trick: 1, pic: ['🚗', '💥', '🤫'], story: ['You broke your friend’s toy car by mistake. Nobody saw.', 'שברתם בטעות את מכונית הצעצוע של החבר. אף אחד לא ראה.'], q: ['What will you do?', 'מה תעשו?'],
      ch: [[['Put it back and say nothing', 'להחזיר אותה למקום ולא להגיד כלום'], 0], [['Tell your friend and say sorry', 'לספר לחבר ולבקש סליחה'], 1], [['Say it was already broken', 'להגיד שהיא כבר הייתה שבורה'], 0]],
      bloom: ['Telling the truth is brave. Now you can try to fix it together.', 'להגיד את האמת זה אמיץ. עכשיו אפשר לנסות לתקן ביחד.'], nudge: ['How will your friend feel finding it broken, without knowing what happened?', 'איך החבר ירגיש כשימצא אותה שבורה, בלי לדעת מה קרה?'] },
    { id: 'ladder', trick: 1, pic: ['🪜', '👤', '❤️'], feel: 'scared', story: ['Your friend is scared to climb the tall ladder to the slide.', 'החבר שלכם מפחד לטפס בסולם הגבוה למגלשה.'], q: ['What will you say?', 'מה תגידו?'],
      ch: [[['“It’s not scary at all!”', '“זה בכלל לא מפחיד!”'], 0], [['“It’s okay to be scared. Want to climb together?”', '“זה בסדר לפחד. רוצה שנטפס ביחד?”'], 1], [['“Hurry up, everyone is waiting!”', '“נו, מהר, כולם מחכים!”'], 0]],
      bloom: ['When we say a feeling is okay, a friend feels brave enough to try.', 'כשאומרים לחבר שמותר להרגיש, הוא מרגיש מספיק אמיץ לנסות.'], nudge: ['Is it really not scary for your friend? What would help?', 'זה באמת לא מפחיד בשביל החבר? מה יעזור לו?'] }
  ];
  /* 8 and up read the scenes themselves, so every one is a trick question: the wrong choices are the tempting ones (stay quiet, keep the
     peace, keep the promise, put them on the bench), and only one choice is really kind */
  const OLDER = [
    { id: 'gang', pic: ['👥', '👟', '👤'], story: ['Your group starts making fun of one kid’s shoes. Everyone is laughing.', 'החבורה שלכם מתחילה לצחוק על הנעליים של ילד אחד. כולם צוחקים.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Stay quiet, so you don’t make it worse', 'לשתוק, כדי לא להחמיר'], 0], [['Smile a little, so they don’t laugh at you next', 'לחייך קצת, כדי שלא יצחקו עליכם בפעם הבאה'], 0], [['Say “Let’s stop”, and go stand next to that kid', 'להגיד “בואו נפסיק”, וללכת לעמוד ליד הילד'], 1]],
      bloom: ['It takes courage not to go along with a group. One voice can change the whole group.', 'צריך אומץ לא ללכת אחרי החבורה. קול אחד יכול לשנות את כל הקבוצה.'], nudge: ['When everyone stays quiet, how does that kid know anyone is on their side?', 'כשכולם שותקים, איך הילד יודע שמישהו בצד שלו?'] },
    { id: 'include', pic: ['⚽', '👥', '👤'], story: ['Your team needs one more player. Lior, who isn’t very good at soccer yet, asks to join.', 'לקבוצה שלכם חסר שחקן אחד. ליאור, שעדיין לא כל כך טוב בכדורגל, מבקש להצטרף.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Say the team is full, because you want to win', 'להגיד שהקבוצה מלאה, כי רוצים לנצח'], 0], [['Let Lior join as a sub on the bench', 'לתת לליאור להצטרף כמחליף על הספסל'], 0], [['Say yes, and pass the ball to Lior too', 'להגיד כן, ולמסור גם לליאור'], 1]],
      bloom: ['Including everyone makes a team stronger, and everyone gets better by playing.', 'כשמשתפים את כולם, הקבוצה חזקה יותר, וכולם משתפרים כשהם משחקים.'], nudge: ['Is sitting on the bench really playing? How do people get better if nobody lets them play?', 'לשבת על הספסל זה באמת לשחק? איך משתפרים אם אף אחד לא נותן לשחק?'] },
    { id: 'argue', pic: ['📝', '👥', '💬'], story: ['In a group project, two members disagree loudly about what to do.', 'בעבודה קבוצתית, שני חברים בקבוצה מתווכחים בקול רם מה לעשות.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Let the louder one decide, to end it fast', 'לתת למי שצועק חזק יותר להחליט, כדי לגמור מהר'], 0], [['Do all the work yourself, so nobody fights', 'לעשות את כל העבודה לבד, כדי שאף אחד לא יריב'], 0], [['Suggest that each explains their idea, then decide together', 'להציע שכל אחד יסביר את הרעיון שלו, ואז להחליט יחד'], 1]],
      bloom: ['When everyone gets to speak and be heard, a group decides better.', 'כשכל אחד מדבר ומקשיבים לו, הקבוצה מחליטה טוב יותר.'], nudge: ['Does the loudest idea have to be the best one?', 'הרעיון של מי שצועק הכי חזק הוא בהכרח הכי טוב?'] },
    { id: 'rumor', pic: ['🤫', '💬', '👥'], story: ['A friend tells you a rumor about a classmate and asks you to pass it on.', 'חברה מספרת לכם שמועה על ילדה מהכיתה ומבקשת להעביר הלאה.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Tell only your best friend', 'לספר רק לחבר הכי טוב'], 0], [['Ask the classmate if it’s true, in front of everyone', 'לשאול את הילדה מול כולם אם זה נכון'], 0], [['Don’t pass it on, and say rumors can hurt', 'לא להעביר הלאה, ולהגיד ששמועות יכולות לפגוע'], 1]],
      bloom: ['A group you can trust keeps its word and protects each other.', 'בקבוצה שאפשר לסמוך עליה שומרים זה על זה.'], nudge: ['If each person tells just one friend, how far does a rumor go?', 'אם כל אחד מספר רק לחבר אחד, לאן השמועה מגיעה?'] },
    { id: 'chat', pic: ['💻', '👥', '👤'], story: ['Some kids made a group chat and left one classmate out on purpose.', 'כמה ילדים פתחו קבוצה בצ׳אט והשאירו ילד אחד בחוץ בכוונה.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Stay in the chat, but don’t write anything mean', 'להישאר בקבוצה, אבל לא לכתוב שום דבר מרושע'], 0], [['Leave the chat quietly', 'לצאת מהקבוצה בשקט'], 0], [['Suggest adding them, and tell an adult if it turns mean', 'להציע לצרף אותו, ולספר למבוגר אם זה נהיה מרושע'], 1]],
      bloom: ['Standing up for someone who is left out is what a real friend does.', 'לעמוד לצד מי שנשאר בחוץ, זה מה שחבר אמיתי עושה.'], nudge: ['Does staying quiet change anything for the kid who was left out?', 'האם שתיקה משנה משהו בשביל הילד שנשאר בחוץ?'] },
    { id: 'credit', pic: ['🏆', '📝', '👥'], story: ['Your teammate did most of the work, but the teacher praises only you.', 'חברה לקבוצה עשתה את רוב העבודה, אבל המורה משבחת רק אתכם.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Say nothing: you worked on it too', 'לשתוק: גם אתם עבדתם על זה'], 0], [['Thank the teacher, and tell Dana later in private', 'להגיד תודה למורה, ולספר לדנה אחר כך בשקט'], 0], [['Say “Actually, Dana did most of it”', 'להגיד “בעצם, דנה עשתה את רוב העבודה”'], 1]],
      bloom: ['Giving credit where it is due keeps a team honest and fair.', 'כשנותנים קרדיט למי שמגיע לו, הקבוצה נשארת הוגנת וישרה.'], nudge: ['Who needs to hear that Dana did the work: only Dana, or the teacher too?', 'מי צריך לשמוע שדנה עשתה את העבודה: רק דנה, או גם המורה?'] },
    { id: 'listen', pic: ['👤', '👂', '💬'], story: ['A friend starts telling you about a really bad day.', 'חבר מתחיל לספר לכם על יום ממש רע.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Tell them about your own bad day, so they feel less alone', 'לספר על היום הרע שלכם, כדי שירגיש פחות לבד'], 0], [['Give advice right away on how to fix it', 'לתת מיד עצה איך לתקן'], 0], [['Listen, and ask how they are feeling', 'להקשיב, ולשאול איך הוא מרגיש'], 1]],
      bloom: ['Really listening is one of the kindest things you can do.', 'הקשבה אמיתית היא אחד הדברים הכי טובים שאפשר לעשות.'], nudge: ['Before advice or your own story, what does a friend on a bad day need most?', 'לפני עצה או סיפור משלכם, מה הכי צריך חבר ביום רע?'] },
    { id: 'blame', pic: ['⚽', '👥', '💧'], story: ['Your team lost, and someone blames the goalkeeper.', 'הקבוצה שלכם הפסידה, ומישהו מאשים את השוער.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Stay out of it: it’s not your business', 'לא להתערב: זה לא העניין שלכם'], 0], [['Agree a little, so the argument ends', 'להסכים קצת, כדי שהוויכוח ייגמר'], 0], [['Say “We win and lose as a team”', 'להגיד “מנצחים ומפסידים כקבוצה”'], 1]],
      bloom: ['A team that sticks together after losing comes back stronger.', 'קבוצה שנשארת מאוחדת אחרי הפסד חוזרת חזקה יותר.'], nudge: ['How does the goalkeeper feel right now?', 'איך השוער מרגיש עכשיו?'] },
    { id: 'disagree', pic: ['💬', '🤝', '👤'], story: ['A classmate says something you really disagree with.', 'ילדה מהכיתה אומרת משהו שאתם ממש לא מסכימים איתו.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Say nothing, to keep the peace', 'לשתוק, כדי לשמור על השקט'], 0], [['Prove her wrong in front of everyone', 'להוכיח מול כולם שהיא טועה'], 0], [['Say “I see it differently” and explain kindly', 'להגיד “אני רואה את זה אחרת” ולהסביר בנעימות'], 1]],
      bloom: ['You can disagree and still be kind: that is how people learn from each other.', 'אפשר לא להסכים ועדיין להיות נחמדים: ככה לומדים זה מזה.'], nudge: ['Can two friends disagree and stay friends?', 'האם שני חברים יכולים לא להסכים ולהישאר חברים?'] },
    { id: 'online', pic: ['💻', '💬', '👤'], story: ['Someone posts a mean comment about your friend online.', 'מישהו כותב תגובה מרושעת על חבר שלכם ברשת.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Ignore it: it’s only online', 'להתעלם: זה רק ברשת'], 0], [['Reply and tell the writer off in front of everyone', 'להגיב ולנזוף בכותב מול כולם'], 0], [['Don’t like or share it, support your friend, and tell an adult', 'לא לעשות לייק ולא לשתף, לתמוך בחבר, ולספר למבוגר'], 1]],
      bloom: ['Online or face to face, being kind and getting help when needed is what matters.', 'ברשת או פנים מול פנים, מה שחשוב זה להיות נחמדים ולבקש עזרה כשצריך.'], nudge: ['How would your friend feel reading that comment?', 'איך החבר ירגיש כשיקרא את התגובה?'] },
    { id: 'newkid8', pic: ['🏫', '👤', '👥'], story: ['At lunch, your best friend saved you a seat. The new student is eating alone.', 'בהפסקת האוכל, החבר הכי טוב שלכם שמר לכם מקום. התלמיד החדש אוכל לבד.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Sit with your best friend, like always', 'לשבת עם החבר הכי טוב, כמו תמיד'], 0], [['Wave and smile at the new student from your seat', 'לנפנף ולחייך לתלמיד החדש מהמקום'], 0], [['Go sit with the new student, and ask your friend to come too', 'ללכת לשבת עם התלמיד החדש, ולהזמין גם את החבר'], 1]],
      bloom: ['Your best friend is still your friend, and now the new student has two!', 'החבר הכי טוב נשאר החבר שלכם, ועכשיו לתלמיד החדש יש שניים!'], nudge: ['Your friend will still be your friend tomorrow. Who needs a friend today?', 'החבר שלכם יישאר חבר גם מחר. מי צריך חבר היום?'] },
    { id: 'meanback', pic: ['📚', '💥', '👤'], story: ['The kid who was mean to you yesterday drops all his books in the hallway.', 'הילד שהיה מרושע אליכם אתמול מפיל את כל הספרים שלו במסדרון.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Walk past: he was mean to you', 'לעבור הלאה: הוא היה מרושע אליכם'], 0], [['Call a teacher, so someone else can help', 'לקרוא למורה, כדי שמישהו אחר יעזור'], 0], [['Help him pick them up', 'לעזור לו לאסוף'], 1]],
      bloom: ['Being kind to someone who wasn’t kind to you is hard. It can change how they treat you.', 'להיות נחמדים למי שלא היה נחמד אליכם זה קשה. זה יכול לשנות איך שהוא מתנהג אליכם.'], nudge: ['If you dropped everything, would you want help, even after a bad day?', 'אם אתם הייתם מפילים הכול, הייתם רוצים עזרה, גם אחרי יום רע?'] },
    { id: 'leaveme', pic: ['👤', '🌧️', '💬'], story: ['Your friend is upset and snaps: “Leave me alone!”', 'חבר שלכם נסער ואומר בכעס: “תעזבו אותי!”'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Leave, and don’t talk to him for the rest of the day', 'ללכת, ולא לדבר איתו כל היום'], 0], [['Keep asking what happened until he tells you', 'להמשיך לשאול מה קרה עד שיספר'], 0], [['Say “Okay. I’m here if you want to talk”, and check on him later', 'להגיד “בסדר. אני פה אם תרצה לדבר”, ולבדוק מה איתו אחר כך'], 1]],
      bloom: ['You gave your friend space and showed you care. Both matter.', 'נתתם לחבר מרחב וגם הראיתם שאכפת לכם. שניהם חשובים.'], nudge: ['Did your friend mean forever, or just for now?', 'החבר התכוון לתמיד, או רק לעכשיו?'] },
    { id: 'secret', pic: ['🤫', '👤', '🛡️'], story: ['Your friend says: “Promise you won’t tell, but an older kid keeps pushing me at the park.”', 'חברה אומרת לכם: “תבטיחו שלא תספרו, אבל ילד גדול דוחף אותי כל הזמן בפארק.”'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Keep the promise: a promise is a promise', 'לשמור על ההבטחה: הבטחה זו הבטחה'], 0], [['Go and push the older kid back', 'ללכת ולדחוף את הילד הגדול בחזרה'], 0], [['Tell a grown-up you trust, because your friend needs help', 'לספר למבוגר שסומכים עליו, כי החברה צריכה עזרה'], 1]],
      bloom: ['Some secrets are too big to keep. Getting a grown-up to help is what a true friend does.', 'יש סודות גדולים מדי לשמור. לבקש עזרה ממבוגר, זה מה שחבר אמיתי עושה.'], nudge: ['If someone is getting hurt, who can make it stop?', 'אם מישהו נפגע, מי יכול לעצור את זה?'] },
    { id: 'game', pic: ['👥', '🎲', '👤'], story: ['Your group wants to play tag. A kid with a cast on his leg wants to play too.', 'הקבוצה שלכם רוצה לשחק תופסת. ילד עם גבס ברגל רוצה לשחק גם.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Most kids want tag, so play tag', 'רוב הילדים רוצים תופסת, אז משחקים תופסת'], 0], [['Let him be the judge who keeps score', 'לתת לו להיות השופט שסופר נקודות'], 0], [['Pick a game everyone can play together', 'לבחור משחק שכולם יכולים לשחק ביחד'], 1]],
      bloom: ['A game where everyone plays beats a game where someone just watches.', 'משחק שכולם משחקים בו טוב יותר ממשחק שמישהו רק מסתכל עליו.'], nudge: ['Is the judge really playing with everyone?', 'השופט באמת משחק עם כולם?'] },
    { id: 'feedback', pic: ['📝', '💬', '👤'], story: ['Your friend shows you a story he wrote and asks: “Is it good?” Some parts are confusing.', 'חבר מראה לכם סיפור שכתב ושואל: “זה טוב?” כמה חלקים מבלבלים.'], q: ['What could you say?', 'מה אפשר להגיד?'],
      ch: [[['“It’s perfect!”', '“זה מושלם!”'], 0], [['“It’s confusing and boring”', '“זה מבלבל ומשעמם”'], 0], [['“I love the beginning. This part confused me: want to look at it together?”', '“ההתחלה מעולה. החלק הזה בלבל אותי: רוצה שנסתכל עליו ביחד?”'], 1]],
      bloom: ['Honest and kind together help a friend get better.', 'כנות ונחמדות ביחד עוזרות לחבר להשתפר.'], nudge: ['Will “perfect” help your friend make the story better? Will “boring”?', '“מושלם” יעזור לחבר לשפר את הסיפור? ו“משעמם”?'] },
    { id: 'test', pic: ['📝', '🤫', '👤'], story: ['During a test, your friend whispers and asks to see your answers.', 'באמצע מבחן, חבר לוחש ומבקש לראות את התשובות שלכם.'], q: ['What could you do?', 'מה אתם יכולים לעשות?'],
      ch: [[['Show him: friends help friends', 'להראות לו: חברים עוזרים לחברים'], 0], [['Pretend you didn’t hear', 'לעשות כאילו לא שמעתם'], 0], [['Say no quietly, and offer to study together for the next test', 'להגיד לא בשקט, ולהציע ללמוד יחד למבחן הבא'], 1]],
      bloom: ['Real help is helping your friend learn, not copying.', 'עזרה אמיתית היא לעזור לחבר ללמוד, לא להעתיק.'], nudge: ['Will copying help your friend next time, when you’re not there?', 'העתקה תעזור לחבר בפעם הבאה, כשלא תהיו שם?'] }
  ];
  const FEELS = ['happy', 'sad', 'angry', 'scared', 'lonely'];
  /* faces drawn for the feelings (never an emoji) */
  function face(f) {
    const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('class', 'hg-face');
    const add = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); s.appendChild(e); return e; };
    add('circle', { cx: 50, cy: 50, r: 44, fill: '#ffd86a', stroke: '#c89a2a', 'stroke-width': 3 });
    const eye = (x, dy) => add('ellipse', { cx: x, cy: 42 + (dy || 0), rx: 5, ry: f === 'scared' ? 8 : 6, fill: '#3a2a1a' }); eye(35); eye(65);
    const M = { happy: 'M30 62 Q50 82 70 62', sad: 'M32 74 Q50 58 68 74', angry: 'M32 72 Q50 62 68 72', scared: 'M40 70 Q50 60 60 70 Q50 82 40 70Z', lonely: 'M36 72 Q50 66 64 72' };
    add('path', { d: M[f], fill: f === 'scared' ? '#3a2a1a' : 'none', stroke: '#3a2a1a', 'stroke-width': 4, 'stroke-linecap': 'round' });
    if (f === 'angry') { add('path', { d: 'M26 30 L42 36 M74 30 L58 36', stroke: '#3a2a1a', 'stroke-width': 4, 'stroke-linecap': 'round' }); }
    if (f === 'sad' || f === 'lonely') add('path', { d: 'M66 50 q4 8 0 12 q-4 -4 0 -12', fill: '#5ab0ff' });
    if (f === 'scared') add('path', { d: 'M26 32 L40 30 M74 32 L60 30', stroke: '#3a2a1a', 'stroke-width': 3, 'stroke-linecap': 'round' });
    return s;
  }
  function css() { if (document.getElementById('hg-css')) return; const st = document.createElement('style'); st.id = 'hg-css'; st.textContent = `
.hg{position:fixed; inset:0; z-index:95; display:grid; place-items:center; padding:16px; overflow:auto; background:radial-gradient(120% 90% at 50% 10%, rgba(255,150,190,.55), rgba(40,10,40,.9) 70%)}
.hg-card{width:min(640px,100%); display:grid; gap:14px; padding:22px 20px; border-radius:24px; background:linear-gradient(180deg,#fff6fa,#ffe8f2); color:#3a1630; box-shadow:0 20px 60px rgba(0,0,0,.45); font-family:var(--font-body, Rubik, sans-serif); text-align:center}
.hg-card h2{margin:0; font:900 clamp(22px,4vw,30px) Cinzel, 'Frank Ruhl Libre', serif; color:#c0396b}
.hg-seed{font:700 16px/1.4 var(--font-body, Rubik); color:#7a3a5a}
.hg-pic{display:flex; justify-content:center; gap:10px} .hg-pic .kq-i{width:74px; height:74px}
.hg-story{font:800 clamp(18px,3vw,22px)/1.45 var(--font-body, Rubik)} .hg-q{font:900 clamp(18px,3vw,22px) var(--font-body, Rubik); color:#c0396b}
.hg-ch{display:grid; gap:10px} .hg-ch button{padding:14px 16px; border-radius:16px; border:2px solid #f2b8d0; background:#fff; color:#3a1630; font:800 clamp(16px,2.6vw,19px)/1.35 var(--font-body, Rubik); cursor:pointer; text-align:start}
.hg-ch button:hover{border-color:#c0396b} .hg-ch button.kind{background:#e8ffe8; border-color:#3ecf7a} .hg-ch button.tried{opacity:.55}
.hg-faces{display:flex; gap:10px; justify-content:center; flex-wrap:wrap} .hg-faces button{display:grid; justify-items:center; gap:4px; padding:8px; border-radius:16px; border:2px solid #f2b8d0; background:#fff; color:#3a1630; font:800 15px var(--font-body, Rubik); cursor:pointer} .hg-face{width:72px; height:72px}
.hg-msg{font:800 18px/1.45 var(--font-body, Rubik); color:#2a7a4a} .hg-msg.nudge{color:#a0522d}
.hg-say{justify-self:center; display:inline-flex; align-items:center; gap:8px; padding:8px 16px; border-radius:999px; border:0; background:#c0396b; color:#fff; font:800 15px var(--font-body, Rubik); cursor:pointer} .hg-say .kq-g, .hg-say .kq-i{width:20px; height:20px}
.hg-flower{width:120px; height:120px; margin:0 auto; animation:hgBloom 1.2s cubic-bezier(.2,1.4,.4,1) both} @keyframes hgBloom{from{transform:scale(0) rotate(-40deg)} to{transform:none}}
.hg-go{justify-self:center; padding:12px 26px; border-radius:999px; border:0; background:linear-gradient(180deg,#ffe08a,#f2b84a); color:#3a1630; font:900 17px var(--font-body, Rubik); cursor:pointer}`; document.head.appendChild(st); }
  const COLORS = ['#ff5a8a', '#ffb43c', '#ffd84a', '#b48cff', '#5ab0ff', '#ff7a5a', '#7ed957'];
  function flowerSvg(c) { const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('class', 'hg-flower');
    const add = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); s.appendChild(e); return e; };
    add('path', { d: 'M50 58 C48 74 52 86 50 98', stroke: '#3a9a3a', 'stroke-width': 4, fill: 'none' }); add('path', { d: 'M50 80 C38 72 30 76 28 82 C38 86 46 84 50 80Z', fill: '#4ab04a' });
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; add('ellipse', { cx: 50 + Math.cos(a) * 15, cy: 38 + Math.sin(a) * 15, rx: 13, ry: 9, transform: `rotate(${a * 180 / Math.PI} ${50 + Math.cos(a) * 15} ${38 + Math.sin(a) * 15})`, fill: c }); }
    add('circle', { cx: 50, cy: 38, r: 10, fill: '#ffe08a' }); return s; }
  const store = pid => { const st = KQ.state(); st.heart = st.heart || {}; return (st.heart[pid] = st.heart[pid] || { flowers: [], seen: {} }); };
  const pidNow = () => (KQ.profiles.active() || {}).id || 'guest';
  /* pick the next scene for this child's age, one they haven't had lately */
  /* a 4–7 scene has to be heard (a young child may not read yet), so a trick scene is used only once every line of it is in the recorded
     lines (shared/voices/lines.js); until they are, the first eight carry on. A trick scene with no feeling to name says its story with the question */
  const heard = sc => { const Lg = he() ? 'he' : 'en', m = window.KQ_LINES && KQ_LINES[Lg], has = x => !!(m && m.clips && m.clips[String(x).replace(/\s+/g, ' ').trim()]);
    return has(L(sc.story) + ' ' + (sc.feel ? t('hg_feel') : L(sc.q))) && has(L(sc.q)) && has(t('hg_bloom') + ' ' + L(sc.bloom)) && has(t('hg_again') + ' ' + L(sc.nudge)) && sc.ch.every(c => has(L(c[0]))); };
  function nextScene(young) { const all = young ? YOUNG : OLDER, tricks = all.filter(s => s.trick && heard(s)), pool = young ? (tricks.length ? tricks : all.filter(s => !s.trick)) : all, h = store(pidNow()); const fresh = pool.filter(s => !h.seen[s.id]); const list = fresh.length ? fresh : pool; if (!fresh.length) for (const s of pool) delete h.seen[s.id]; return list[Math.floor(Math.random() * list.length)]; }
  let open_ = false;
  function open(o, done) {
    if (open_) return; open_ = true; css(); o = o || {}; const young = (o.band || 1) <= 2, sc = o.scene || nextScene(young);
    const ov = el('div', 'hg'); ov.setAttribute('role', 'dialog'); const card = el('div', 'hg-card'); ov.appendChild(card); document.body.appendChild(ov);
    const say = text => KQ.speak(text, null, { force: true });
    const sayBtn = text => { if (!young) return null; const b = el('button', 'hg-say'); b.type = 'button'; b.appendChild(KQ.icon('🔊') || el('span', null, '♪')); b.appendChild(el('span', null, t('hg_listen'))); b.onclick = () => say(text); return b; };
    function head() { card.replaceChildren(); card.appendChild(el('h2', null, t('hg_title'))); if (!o.practice) card.appendChild(el('div', 'hg-seed', t('hg_seed'))); const p = el('div', 'hg-pic'); sc.pic.forEach(e => p.appendChild(KQ.icon(e) || el('span', null, e))); card.appendChild(p); card.appendChild(el('div', 'hg-story', L(sc.story))); }
    function feelStep() { head(); card.appendChild(el('div', 'hg-q', t('hg_feel'))); const sb = sayBtn(L(sc.story) + ' ' + t('hg_feel')); if (sb) card.appendChild(sb);
      const opts = [sc.feel, ...FEELS.filter(f => f !== sc.feel).sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5); const row = el('div', 'hg-faces'); const msg = el('div', 'hg-msg');
      opts.forEach(f => { const b = el('button'); b.type = 'button'; b.appendChild(face(f)); b.appendChild(el('span', null, t('f_' + f))); b.onclick = () => { if (f === sc.feel) { msg.className = 'hg-msg'; msg.textContent = t('hg_feelYes', { f: t('f_' + f).toLowerCase() }); setTimeout(doStep, 1200); } else { msg.className = 'hg-msg nudge'; msg.textContent = t('hg_feelNo'); } }; row.appendChild(b); });
      card.appendChild(row); card.appendChild(msg); }
    function doStep() { head(); card.appendChild(el('div', 'hg-q', L(sc.q))); const sb = sayBtn((young && !sc.feel ? L(sc.story) + ' ' : '') + L(sc.q)); if (sb) card.appendChild(sb);
      const box = el('div', 'hg-ch'), msg = el('div', 'hg-msg'); sc.ch.slice().sort(() => Math.random() - 0.5).forEach(([txt, kind]) => { const b = el('button'); b.type = 'button'; b.textContent = L(txt); if (young) b.addEventListener('pointerenter', () => {});
        b.onclick = () => { if (kind) { b.classList.add('kind'); bloom(); } else { b.classList.add('tried'); msg.className = 'hg-msg nudge'; msg.textContent = t('hg_again') + ' ' + L(sc.nudge); if (young) say(t('hg_again') + ' ' + L(sc.nudge)); } }; box.appendChild(b); if (young) { const s2 = el('button', 'hg-say'); s2.type = 'button'; s2.appendChild(KQ.icon('🔊') || el('span', null, '♪')); s2.onclick = e => { e.stopPropagation(); say(L(txt)); }; s2.style.padding = '6px 10px'; s2.setAttribute('aria-label', L(txt)); box.appendChild(s2); } });
      card.appendChild(box); card.appendChild(msg); }
    function bloom() { const h = store(pidNow()), c = COLORS[h.flowers.length % COLORS.length], sp = window.KQFlora ? KQFlora.species(h.flowers.length) : null; h.flowers.push({ c, sp: sp && sp.id, id: sc.id, at: Date.now() }); h.seen[sc.id] = 1; if (!o.practice && h.pending) h.pending = null; try { KQ.save(); } catch (e) {}
      card.replaceChildren(); card.appendChild(el('h2', null, t('hg_title')));
      const after = () => { card.appendChild(el('div', 'hg-msg', t('hg_bloom'))); card.appendChild(el('div', 'hg-story', L(sc.bloom))); if (young) say(t('hg_bloom') + ' ' + L(sc.bloom)); try { KQ.sfx && KQ.sfx.play && KQ.sfx.play('correct'); } catch (e) {}
        const go = el('button', 'hg-go', t('hg_back')); go.type = 'button'; go.onclick = () => { if (st && st.stop) st.stop(); ov.remove(); open_ = false; if (done) done(); }; card.appendChild(go); };
      /* the kind choice is the move; the payoff is a real flower: tap the watering can and it grows from the seed and opens (shared/flora.js) */
      const st = sp ? KQFlora.stage(sp, after) : null; if (st) card.appendChild(st); else { card.appendChild(flowerSvg(c)); after(); } }
    if (young && sc.feel) feelStep(); else doStep();
  }
  /* the gate: when a level was passed anywhere, the next game opens with a Heart Garden scene first */
  function gate(world, cont) { const pid = pidNow(); const h = store(pid); if (!h.pending) return false; const band = h.pending.band || (KQ.ladder && KQ.ladder.band ? KQ.ladder.band(pid, h.pending.world || world, [1, 2, 3, 4, 5, 6]) : 1) || 1; open({ band }, cont); return true; }
  function garden(pid) { return store(pid || pidNow()).flowers; }
  window.KQHeart = { gate, open, garden, face, flowerSvg, YOUNG, OLDER, COLORS };
})();
