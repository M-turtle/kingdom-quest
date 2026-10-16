/* Kingdom Quest — the Avatar Lab's recipe book (Yoni 2026-09-29: 'the results should not be coins … elements, like the potions,
   that you get from the assignments; a combination of elements lets you run an avatar mix — animals × fruits, cars × …, lists of
   20 × 20 — and the more elements you get, the more mixes you can run and build your own').

   ELEMENTS drop at random from every finished assignment (more for more stars). A MIX CATEGORY opens once a player has collected
   enough elements in all (`opensAt`, lifetime), and every mix made in it SPENDS its recipe — a combination of elements. The picture
   of a mix is painted by Google's image model the first time anyone makes it, then kept and reused for free (kq-relay /avatar).
   The relay holds the same English keys as an allowlist: add an item here AND in tools/kq-relay/index.ts, or it is refused. */
(function () {
  'use strict';
  const ELEMENTS = [
    { id: 'fire', e: '🔥', en: 'Fire', he: 'אש' }, { id: 'water', e: '💧', en: 'Water', he: 'מים' }, { id: 'earth', e: '🌱', en: 'Earth', he: 'אדמה' },
    { id: 'wind', e: '🌪', en: 'Wind', he: 'רוח' }, { id: 'light', e: '✨', en: 'Light', he: 'אור' }, { id: 'frost', e: '❄', en: 'Frost', he: 'כפור' }
  ];
  // twenty of each: [key (the word the painter gets), English, Hebrew]
  const LISTS = {
    animals: [['cat', 'Cat', 'חתול'], ['dog', 'Dog', 'כלב'], ['fox', 'Fox', 'שועל'], ['owl', 'Owl', 'ינשוף'], ['dragon', 'Dragon', 'דרקון'], ['bunny', 'Bunny', 'ארנב'], ['panda', 'Panda', 'פנדה'], ['tiger', 'Tiger', 'נמר'], ['lion', 'Lion', 'אריה'], ['bear', 'Bear', 'דוב'],
      ['penguin', 'Penguin', 'פינגווין'], ['elephant', 'Elephant', 'פיל'], ['giraffe', 'Giraffe', "ג'ירפה"], ['monkey', 'Monkey', 'קוף'], ['koala', 'Koala', 'קואלה'], ['unicorn', 'Unicorn', 'חד־קרן'], ['frog', 'Frog', 'צפרדע'], ['turtle', 'Turtle', 'צב'], ['horse', 'Horse', 'סוס'], ['hedgehog', 'Hedgehog', 'קיפוד']],
    fruits: [['apple', 'Apple', 'תפוח'], ['banana', 'Banana', 'בננה'], ['strawberry', 'Strawberry', 'תות'], ['pineapple', 'Pineapple', 'אננס'], ['grapes', 'Grapes', 'ענבים'], ['watermelon', 'Watermelon', 'אבטיח'], ['cherry', 'Cherry', 'דובדבן'], ['lemon', 'Lemon', 'לימון'], ['orange', 'Orange', 'תפוז'], ['peach', 'Peach', 'אפרסק'],
      ['pear', 'Pear', 'אגס'], ['kiwi', 'Kiwi', 'קיווי'], ['mango', 'Mango', 'מנגו'], ['blueberry', 'Blueberry', 'אוכמנית'], ['coconut', 'Coconut', 'קוקוס'], ['avocado', 'Avocado', 'אבוקדו'], ['plum', 'Plum', 'שזיף'], ['raspberry', 'Raspberry', 'פטל'], ['pomegranate', 'Pomegranate', 'רימון'], ['fig', 'Fig', 'תאנה']],
    vehicles: [['car', 'Car', 'מכונית'], ['truck', 'Truck', 'משאית'], ['train', 'Train', 'רכבת'], ['rocket', 'Rocket', 'טיל'], ['airplane', 'Airplane', 'מטוס'], ['helicopter', 'Helicopter', 'מסוק'], ['submarine', 'Submarine', 'צוללת'], ['sailboat', 'Sailboat', 'סירת מפרש'], ['bus', 'Bus', 'אוטובוס'], ['tractor', 'Tractor', 'טרקטור'],
      ['motorcycle', 'Motorcycle', 'אופנוע'], ['bicycle', 'Bicycle', 'אופניים'], ['scooter', 'Scooter', 'קורקינט'], ['firetruck', 'Fire truck', 'כבאית'], ['ambulance', 'Ambulance', 'אמבולנס'], ['bulldozer', 'Bulldozer', 'דחפור'], ['balloon', 'Hot-air balloon', 'כדור פורח'], ['spaceship', 'Spaceship', 'חללית'], ['jeep', 'Jeep', "ג'יפ"], ['racecar', 'Race car', 'מכונית מרוץ']],
    dinosaurs: [['tyrannosaurus', 'T-rex', 'טירנוזאורוס'], ['triceratops', 'Triceratops', 'טריצרטופס'], ['stegosaurus', 'Stegosaurus', 'סטגוזאורוס'], ['brachiosaurus', 'Brachiosaurus', 'ברכיוזאורוס'], ['pterodactyl', 'Pterodactyl', 'פטרודקטיל'], ['velociraptor', 'Velociraptor', 'ולוצירפטור'], ['ankylosaurus', 'Ankylosaurus', 'אנקילוזאורוס'], ['spinosaurus', 'Spinosaurus', 'ספינוזאורוס'], ['diplodocus', 'Diplodocus', 'דיפלודוקוס'], ['parasaurolophus', 'Parasaurolophus', 'פרזאורולופוס'],
      ['iguanodon', 'Iguanodon', 'איגואנודון'], ['allosaurus', 'Allosaurus', 'אלוזאורוס'], ['pachycephalosaurus', 'Pachycephalosaurus', 'פכיצפלוזאורוס'], ['plesiosaur', 'Plesiosaur', 'פלזיוזאור'], ['mosasaurus', 'Mosasaurus', 'מוזאזאורוס'], ['dilophosaurus', 'Dilophosaurus', 'דילופוזאורוס'], ['carnotaurus', 'Carnotaurus', 'קרנוטאורוס'], ['gallimimus', 'Gallimimus', 'גלימימוס'], ['protoceratops', 'Protoceratops', 'פרוטוצרטופס'], ['compsognathus', 'Compsognathus', 'קומפסוגנתוס']],
    sweets: [['cupcake', 'Cupcake', 'קאפקייק'], ['donut', 'Donut', 'סופגנייה'], ['lollipop', 'Lollipop', 'סוכרייה על מקל'], ['icecream', 'Ice cream', 'גלידה'], ['cookie', 'Cookie', 'עוגייה'], ['cake', 'Cake', 'עוגה'], ['candy', 'Candy', 'סוכרייה'], ['chocolate', 'Chocolate', 'שוקולד'], ['pancake', 'Pancake', 'פנקייק'], ['waffle', 'Waffle', 'וופל'],
      ['muffin', 'Muffin', 'מאפין'], ['pretzel', 'Pretzel', 'בייגלה'], ['popcorn', 'Popcorn', 'פופקורן'], ['marshmallow', 'Marshmallow', 'מרשמלו'], ['pie', 'Pie', 'פאי'], ['pudding', 'Pudding', 'פודינג'], ['croissant', 'Croissant', 'קרואסון'], ['macaron', 'Macaron', 'מקרון'], ['gummybear', 'Gummy bear', 'דובון גומי'], ['churro', 'Churro', "צ'ורוס"]],
    sea: [['octopus', 'Octopus', 'תמנון'], ['shark', 'Shark', 'כריש'], ['whale', 'Whale', 'לווייתן'], ['jellyfish', 'Jellyfish', 'מדוזה'], ['crab', 'Crab', 'סרטן'], ['seahorse', 'Seahorse', 'סוסון ים'], ['starfish', 'Starfish', 'כוכב ים'], ['clownfish', 'Clownfish', 'דג ליצן'], ['dolphin', 'Dolphin', 'דולפין'], ['lobster', 'Lobster', 'לובסטר'],
      ['squid', 'Squid', 'דיונון'], ['stingray', 'Stingray', 'טריגון'], ['pufferfish', 'Pufferfish', 'אבו־נפחא'], ['narwhal', 'Narwhal', 'נרוול'], ['seal', 'Seal', 'כלב ים'], ['otter', 'Otter', 'לוטרה'], ['walrus', 'Walrus', 'ניבתן'], ['swordfish', 'Swordfish', 'דג חרב'], ['shrimp', 'Shrimp', 'שרימפס'], ['coral', 'Coral', 'אלמוג']],
    instruments: [['guitar', 'Guitar', 'גיטרה'], ['drum', 'Drum', 'תוף'], ['piano', 'Piano', 'פסנתר'], ['violin', 'Violin', 'כינור'], ['trumpet', 'Trumpet', 'חצוצרה'], ['flute', 'Flute', 'חליל'], ['harp', 'Harp', 'נבל'], ['saxophone', 'Saxophone', 'סקסופון'], ['xylophone', 'Xylophone', 'קסילופון'], ['tambourine', 'Tambourine', 'טמבורין'],
      ['cello', 'Cello', "צ'לו"], ['banjo', 'Banjo', "בנג'ו"], ['ukulele', 'Ukulele', 'יוקלילי'], ['accordion', 'Accordion', 'אקורדיון'], ['trombone', 'Trombone', 'טרומבון'], ['clarinet', 'Clarinet', 'קלרינט'], ['maracas', 'Maracas', 'מרקס'], ['harmonica', 'Harmonica', 'מפוחית'], ['bagpipes', 'Bagpipes', 'חמת חלילים'], ['tuba', 'Tuba', 'טובה']],
    flowers: [['rose', 'Rose', 'ורד'], ['sunflower', 'Sunflower', 'חמנייה'], ['tulip', 'Tulip', 'צבעוני'], ['cactus', 'Cactus', 'קקטוס'], ['daisy', 'Daisy', 'חיננית'], ['lotus', 'Lotus', 'לוטוס'], ['orchid', 'Orchid', 'סחלב'], ['lily', 'Lily', 'שושן'], ['bamboo', 'Bamboo', 'במבוק'], ['mushroom', 'Mushroom', 'פטרייה'],
      ['clover', 'Clover', 'תלתן'], ['fern', 'Fern', 'שרך'], ['lavender', 'Lavender', 'לבנדר'], ['poppy', 'Poppy', 'פרג'], ['anemone', 'Anemone', 'כלנית'], ['palm', 'Palm tree', 'דקל'], ['cherryblossom', 'Cherry blossom', 'פריחת דובדבן'], ['maple', 'Maple leaf', 'עלה אדר'], ['dandelion', 'Dandelion', 'שן הארי'], ['bonsai', 'Bonsai', 'בונסאי']]
  };
  // the mix categories, in the order they open. recipe = the elements one mix spends; opensAt = elements collected in all, ever
  const CATS = [
    { id: 'animals-fruits', a: 'animals', b: 'fruits', en: 'Animals × Fruits', he: 'חיות × פירות', opensAt: 0, recipe: { earth: 2, water: 2 } },
    { id: 'animals-vehicles', a: 'animals', b: 'vehicles', en: 'Animals × Vehicles', he: 'חיות × כלי רכב', opensAt: 15, recipe: { fire: 2, wind: 2 } },
    { id: 'dinosaurs-sweets', a: 'dinosaurs', b: 'sweets', en: 'Dinosaurs × Sweets', he: 'דינוזאורים × ממתקים', opensAt: 35, recipe: { fire: 2, light: 2, earth: 1 } },
    { id: 'sea-instruments', a: 'sea', b: 'instruments', en: 'Sea creatures × Instruments', he: 'יצורי ים × כלי נגינה', opensAt: 60, recipe: { water: 3, wind: 2 } },
    { id: 'dinosaurs-vehicles', a: 'dinosaurs', b: 'vehicles', en: 'Dinosaurs × Vehicles', he: 'דינוזאורים × כלי רכב', opensAt: 90, recipe: { fire: 2, frost: 2, wind: 1 } },
    { id: 'flowers-sea', a: 'flowers', b: 'sea', en: 'Flowers × Sea creatures', he: 'פרחים × יצורי ים', opensAt: 120, recipe: { light: 2, frost: 2, water: 2 } }
  ];
  const item = (list, key) => (LISTS[list] || []).find(x => x[0] === key) || null;
  window.KQMix = { ELEMENTS, LISTS, CATS, item, cat: id => CATS.find(c => c.id === id) || null };
})();
