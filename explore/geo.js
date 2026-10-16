/* Kingdom Quest — World Explorer geography: a simple world map (continents as lon/lat outlines, drawn in an equirectangular
   360 × 180 frame), the cities children travel between (which coast, which railway network), countries, flags, capitals,
   oceans. Real travel rules (Yoni 2026-10-03: 'travel in a way that's actually possible: by sea a ship, a plane, a train when
   overland'): a train only runs inside one connected railway network (Britain joins Europe through the Channel Tunnel; Moscow
   joins Beijing on the Trans-Siberian), a ship only between two coastal cities, a plane anywhere.
   API: KQGeo.map(opts) → <svg> · CITIES · CONT · OCEANS · FLAGS · flag(code) → <svg> · can(a, b, mode) · dir(a, b) */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const P = pts => pts.map(([lon, lat]) => [lon + 180, 90 - lat]);
  const CONT = {
    na: P([[-165, 65], [-150, 71], [-125, 72], [-95, 74], [-80, 73], [-62, 60], [-55, 52], [-66, 45], [-75, 38], [-81, 31], [-80, 25], [-90, 29], [-97, 26], [-98, 19], [-87, 15], [-83, 9], [-78, 8], [-92, 15], [-105, 20], [-112, 28], [-117, 32], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]]),
    greenland: P([[-55, 60], [-45, 60], [-20, 70], [-20, 80], [-60, 82], [-70, 77]]),
    sa: P([[-78, 8], [-60, 10], [-50, 0], [-35, -5], [-38, -15], [-48, -25], [-58, -35], [-65, -42], [-68, -52], [-74, -50], [-72, -35], [-71, -20], [-76, -12], [-81, -5], [-78, 1]]),
    europe: P([[-10, 36], [-9, 43], [-2, 44], [-4, 48], [2, 51], [8, 54], [8, 58], [5, 61], [12, 66], [18, 70], [28, 71], [40, 67], [55, 67], [58, 55], [50, 47], [42, 42], [36, 41], [28, 41], [26, 38], [22, 37], [20, 40], [16, 38], [18, 40], [13, 44], [8, 44], [3, 43], [-2, 37], [-6, 36]]),
    uk: P([[-5, 50], [1, 51], [0, 53], [-3, 56], [-5, 58], [-6, 55]]),
    asia: P([[55, 67], [70, 73], [100, 77], [130, 72], [160, 70], [180, 66], [170, 60], [160, 52], [142, 46], [135, 35], [122, 30], [120, 22], [108, 18], [105, 10], [100, 2], [98, 8], [92, 20], [80, 15], [77, 8], [72, 20], [66, 25], [57, 25], [52, 15], [44, 12], [35, 30], [36, 36], [42, 42], [50, 47], [58, 55]]),
    japan: P([[130, 31], [136, 34], [140, 36], [142, 41], [140, 45], [138, 38], [132, 34]]),
    africa: P([[-17, 21], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -2], [40, -15], [35, -25], [28, -33], [18, -34], [12, -18], [13, -5], [9, 4], [-8, 4], [-17, 14]]),
    oceania: P([[114, -22], [122, -17], [131, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [131, -31], [115, -34]]),
    antarctica: P([[-180, -72], [-120, -73], [-60, -64], [0, -70], [60, -67], [120, -66], [180, -72], [180, -90], [-180, -90]])
  };
  /* which shapes make each continent (for the quiz) */
  const CONTINENT = { na: ['na', 'greenland'], sa: ['sa'], europe: ['europe', 'uk'], asia: ['asia', 'japan'], africa: ['africa'], oceania: ['oceania'], antarctica: ['antarctica'] };
  const CONT_NAME = { na: ['North America', 'צפון אמריקה'], sa: ['South America', 'דרום אמריקה'], europe: ['Europe', 'אירופה'], asia: ['Asia', 'אסיה'], africa: ['Africa', 'אפריקה'], oceania: ['Australia and Oceania', 'אוסטרליה ואוקיאניה'], antarctica: ['Antarctica', 'אנטארקטיקה'] };
  const CONT_COL = { na: '#7ec46a', sa: '#a8d45a', europe: '#e8c45a', asia: '#e89a5a', africa: '#d8b46a', oceania: '#c88ad8', antarctica: '#e8f2fa' };
  /* which landmass a country sits on: no railway can cross between two of them (Britain reaches Europe through the Channel Tunnel) */
  const LAND = { us: 'americas', br: 'americas', ar: 'americas', gb: 'britain', jp: 'japan', au: 'australia' };
  /* [id, English, Hebrew, lon, lat, coastal, railway network, country] */
  const CITIES = [
    ['telaviv', 'Tel Aviv', 'תל אביב', 34.8, 32.1, true, 'il', 'il'], ['jerusalem', 'Jerusalem', 'ירושלים', 35.2, 31.8, false, 'il', 'il'],
    ['newyork', 'New York', 'ניו יורק', -74, 40.7, true, 'na', 'us'], ['denver', 'Denver', 'דנוור', -105, 39.7, false, 'na', 'us'], ['losangeles', 'Los Angeles', 'לוס אנג׳לס', -118.2, 34, true, 'na', 'us'],
    ['rio', 'Rio de Janeiro', 'ריו דה ז׳ניירו', -43.2, -22.9, true, null, 'br'], ['buenosaires', 'Buenos Aires', 'בואנוס איירס', -58.4, -34.6, true, null, 'ar'],
    ['london', 'London', 'לונדון', -0.1, 51.5, true, 'eu', 'gb'], ['paris', 'Paris', 'פריז', 2.35, 48.9, false, 'eu', 'fr'], ['rome', 'Rome', 'רומא', 12.5, 41.9, false, 'eu', 'it'], ['athens', 'Athens', 'אתונה', 23.7, 38, true, 'eu', 'gr'],
    ['berlin', 'Berlin', 'ברלין', 13.4, 52.5, false, 'eu', 'de'], ['moscow', 'Moscow', 'מוסקבה', 37.6, 55.8, false, 'eu', 'ru'], ['beijing', 'Beijing', 'בייג׳ינג', 116.4, 39.9, false, 'eu', 'cn'],
    ['tokyo', 'Tokyo', 'טוקיו', 139.7, 35.7, true, 'jp', 'jp'], ['mumbai', 'Mumbai', 'מומבאי', 72.9, 19.1, true, 'in', 'in'], ['cairo', 'Cairo', 'קהיר', 31.2, 30, false, 'eg', 'eg'],
    ['capetown', 'Cape Town', 'קייפטאון', 18.4, -33.9, true, 'za', 'za'], ['sydney', 'Sydney', 'סידני', 151.2, -33.9, true, 'au', 'au']
  ].map(([id, en, he, lon, lat, coast, rail, cc]) => ({ id, n: [en, he], lon, lat, coast, rail, cc, land: LAND[cc] || 'afroeurasia' }));
  const COUNTRY = { il: ['Israel', 'ישראל', 'asia'], us: ['the United States', 'ארצות הברית', 'na'], br: ['Brazil', 'ברזיל', 'sa'], ar: ['Argentina', 'ארגנטינה', 'sa'], gb: ['the United Kingdom', 'הממלכה המאוחדת', 'europe'], fr: ['France', 'צרפת', 'europe'], it: ['Italy', 'איטליה', 'europe'], gr: ['Greece', 'יוון', 'europe'], de: ['Germany', 'גרמניה', 'europe'], ru: ['Russia', 'רוסיה', 'europe'], cn: ['China', 'סין', 'asia'], jp: ['Japan', 'יפן', 'asia'], in: ['India', 'הודו', 'asia'], eg: ['Egypt', 'מצרים', 'africa'], za: ['South Africa', 'דרום אפריקה', 'africa'], au: ['Australia', 'אוסטרליה', 'oceania'], se: ['Sweden', 'שוודיה', 'europe'], ch: ['Switzerland', 'שווייץ', 'europe'], nl: ['the Netherlands', 'הולנד', 'europe'], ie: ['Ireland', 'אירלנד', 'europe'], ca: ['Canada', 'קנדה', 'na'], es: ['Spain', 'ספרד', 'europe'], mx: ['Mexico', 'מקסיקו', 'na'] };
  const CAPITAL = { il: ['Jerusalem', 'ירושלים'], us: ['Washington, D.C.', 'וושינגטון די. סי.'], fr: ['Paris', 'פריז'], jp: ['Tokyo', 'טוקיו'], it: ['Rome', 'רומא'], gb: ['London', 'לונדון'], eg: ['Cairo', 'קהיר'], br: ['Brasília', 'ברזיליה'], au: ['Canberra', 'קנברה'], ca: ['Ottawa', 'אוטווה'], de: ['Berlin', 'ברלין'], es: ['Madrid', 'מדריד'], cn: ['Beijing', 'בייג׳ינג'], in: ['New Delhi', 'ניו דלהי'], gr: ['Athens', 'אתונה'], mx: ['Mexico City', 'מקסיקו סיטי'], ar: ['Buenos Aires', 'בואנוס איירס'], ru: ['Moscow', 'מוסקבה'], se: ['Stockholm', 'שטוקהולם'], nl: ['Amsterdam', 'אמסטרדם'], ie: ['Dublin', 'דבלין'], ch: ['Bern', 'ברן'], za: ['Pretoria', 'פרטוריה'] };
  const OCEANS = { atlantic: [['the Atlantic Ocean', 'האוקיינוס האטלנטי'], -35, 20], pacific: [['the Pacific Ocean', 'האוקיינוס השקט'], -140, 5], indian: [['the Indian Ocean', 'האוקיינוס ההודי'], 75, -22], arctic: [['the Arctic Ocean', 'האוקיינוס הארקטי'], 0, 82], southern: [['the Southern Ocean', 'האוקיינוס הדרומי'], 30, -60] };
  /* flags drawn from their real designs (simple ones only) */
  const FLAGS = {
    il: '<rect width="60" height="40" fill="#fff"/><rect y="4" width="60" height="5" fill="#0038b8"/><rect y="31" width="60" height="5" fill="#0038b8"/><path d="M30 12 L36 23 H24Z M30 28 L24 17 H36Z" fill="none" stroke="#0038b8" stroke-width="1.6"/>',
    jp: '<rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="11" fill="#bc002d"/>',
    fr: '<rect width="20" height="40" fill="#0055a4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ef4135"/>',
    it: '<rect width="20" height="40" fill="#009246"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ce2b37"/>',
    ie: '<rect width="20" height="40" fill="#169b62"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ff883e"/>',
    de: '<rect width="60" height="14" fill="#000"/><rect y="13" width="60" height="14" fill="#dd0000"/><rect y="26" width="60" height="14" fill="#ffce00"/>',
    nl: '<rect width="60" height="14" fill="#ae1c28"/><rect y="13" width="60" height="14" fill="#fff"/><rect y="26" width="60" height="14" fill="#21468b"/>',
    se: '<rect width="60" height="40" fill="#006aa7"/><rect x="18" width="7" height="40" fill="#fecc00"/><rect y="16.5" width="60" height="7" fill="#fecc00"/>',
    ch: '<rect width="60" height="40" fill="#da291c"/><rect x="26" y="9" width="8" height="22" fill="#fff"/><rect x="19" y="16" width="22" height="8" fill="#fff"/>',
    gr: Array.from({ length: 9 }, (_, i) => `<rect y="${i * 40 / 9}" width="60" height="${40 / 9 + 0.1}" fill="${i % 2 ? '#fff' : '#0d5eaf'}"/>`).join('') + '<rect width="22.2" height="22.2" fill="#0d5eaf"/><rect x="8.9" width="4.4" height="22.2" fill="#fff"/><rect y="8.9" width="22.2" height="4.4" fill="#fff"/>',
    us: Array.from({ length: 13 }, (_, i) => `<rect y="${i * 40 / 13}" width="60" height="${40 / 13 + 0.1}" fill="${i % 2 ? '#fff' : '#b22234'}"/>`).join('') + '<rect width="24" height="21.5" fill="#3c3b6e"/>' + Array.from({ length: 9 }, (_, r) => Array.from({ length: r % 2 ? 5 : 6 }, (_, i) => `<circle cx="${(r % 2 ? 4 : 2) + i * 4}" cy="${1.9 + r * 2.2}" r="0.7" fill="#fff"/>`).join('')).join('')   /* all 50 stars */
  };
  function svgOf(markup, vb, cls) { const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}" viewBox="${vb}">${markup}</svg>`, 'image/svg+xml'); const s = document.importNode(doc.documentElement, true); s.setAttribute('class', cls || ''); s.setAttribute('aria-hidden', 'true'); return s; }
  const flag = cc => svgOf(FLAGS[cc] + '<rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.25)"/>', '0 0 60 40', 'kqg-flag');
  const xy = (lon, lat) => [lon + 180, 90 - lat];
  /* the map: highlight a continent, mark cities, draw a route, a dot in an ocean, the equator / grid */
  function map(o) {
    o = o || {}; const parts = []; const hi = o.highlight ? CONTINENT[o.highlight] : null;
    parts.push('<rect width="360" height="180" fill="#2a6ab8"/>');
    if (o.grid) { for (let lon = -180; lon <= 180; lon += 30) parts.push(`<line x1="${lon + 180}" y1="0" x2="${lon + 180}" y2="180" stroke="#8ab8ee" stroke-width="${lon === 0 ? 1 : 0.4}" opacity=".7"/>`); for (let lat = -60; lat <= 60; lat += 30) parts.push(`<line x1="0" y1="${90 - lat}" x2="360" y2="${90 - lat}" stroke="#8ab8ee" stroke-width="${lat === 0 ? 1.2 : 0.4}" opacity=".7"/>`); }
    else if (o.equator) parts.push('<line x1="0" y1="90" x2="360" y2="90" stroke="#ffe08a" stroke-width="1.4" stroke-dasharray="4 3"/>');
    for (const c in CONTINENT) for (const k of CONTINENT[c]) { const col = hi ? (hi.includes(k) ? '#ffd23a' : '#8aa898') : CONT_COL[c]; parts.push(`<path d="M${CONT[k].map(p => p.join(' ')).join(' L')}Z" fill="${col}" stroke="${hi && hi.includes(k) ? '#fff6c8' : 'rgba(0,0,0,.25)'}" stroke-width="${hi && hi.includes(k) ? 1.4 : 0.5}"/>`); }
    if (o.ocean) { const [, lon, lat] = OCEANS[o.ocean], [x, y] = xy(lon, lat); parts.push(`<circle cx="${x}" cy="${y}" r="9" fill="#ffd23a" opacity=".35"/><circle cx="${x}" cy="${y}" r="4.2" fill="#ffd23a" stroke="#fff" stroke-width="1.2"/>`); }
    if (o.route) { const [a, b] = o.route, [x1, y1] = xy(a.lon, a.lat), [x2, y2] = xy(b.lon, b.lat), mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.18 - 6; parts.push(`<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="${o.routeMode === 'train' ? '0' : '4 3'}"/>`); }
    for (const c of o.cities || []) { const [x, y] = xy(c.lon, c.lat); parts.push(`<circle cx="${x}" cy="${y}" r="3.2" fill="#ff3a5a" stroke="#fff" stroke-width="1.2"/>`); if (c.label) parts.push(`<text x="${x}" y="${y - 6}" font-size="8" font-weight="800" font-family="Rubik, sans-serif" fill="#fff" stroke="#0a2a4a" stroke-width="2.4" paint-order="stroke" text-anchor="middle">${c.label.replace(/[<&>]/g, '')}</text>`); }
    return svgOf(parts.join(''), '0 0 360 180', 'kqg-map');
  }
  /* why a train cannot go: sea in between, or simply no line was built across the land */
  const noRailWhy = (a, b) => a.land !== b.land && !([a.land, b.land].includes('britain') && [a.rail, b.rail].every(r => r === 'eu')) ? 'sea' : 'none';
  const can = (a, b, mode) => mode === 'plane' ? true : mode === 'train' ? !!(a.rail && a.rail === b.rail) : mode === 'ship' ? a.coast && b.coast : false;
  /* compass direction from a to b (the bigger of east-west / north-south) */
  function dir(a, b) { const dx = b.lon - a.lon, dy = b.lat - a.lat; return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'north' : 'south'); }
  window.KQGeo = { CONT, CONTINENT, CONT_NAME, CITIES, COUNTRY, CAPITAL, OCEANS, FLAGS, map, flag, can, dir, xy, noRailWhy };
})();
