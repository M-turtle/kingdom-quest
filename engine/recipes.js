/* Kingdom Quest — the recipes: every game the engine makes is one entry here. Nothing below is code that plays; it is the idea of a game,
   pushed into the engine (Yoni 2026-10-21). Same action, different place, animals and task = a different game. */
window.KQE_RECIPES = [
  { id: 'farm-make10', action: 'swallow', place: 'farm', skill: 'make-10', ages: '5–7' },
  { id: 'ocean-times8', action: 'swallow', place: 'ocean', skill: 'times-8', ages: '8–9' },
  { id: 'pirate-letters', action: 'swallow', place: 'pirate', skill: 'starts-with', ages: '5–6' },
  { id: 'seabed-robot', action: 'program', place: 'seabed', skill: 'routes', ages: '5–9', goal: { say: { he: 'בונים תוכנית ואוספים את הפנינים', en: 'Build a plan, collect the pearls' } } },
  { id: 'farm-rabbit', action: 'program', place: 'farm', skill: 'routes', ages: '5–9', goal: { say: { he: 'מתכננים לארנב דרך אל התירס', en: "Plan the rabbit's way to the corn" } } },
  { id: 'sky-dragon', action: 'program', place: 'sky', skill: 'repeats', ages: '7–10', goal: { say: { he: 'מתכננים לדרקון טיסה אל הכוכבים', en: "Plan the dragon's flight to the stars" } } }
];
/* a recipe that breaks a rule on purpose: no goal picture. The engine refuses to build it and says why. */
window.KQE_BROKEN = { id: 'broken', action: 'swallow', place: 'farm', skill: 'make-10', goal: { pic: null, say: { he: 'בולעים מספרים שעושים 10', en: 'Swallow numbers that make 10' } } };
