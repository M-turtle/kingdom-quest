const { chromium } = require('/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:4412/index.html'); await p.waitForFunction(() => window.__ctl, null, { timeout: 90000 }); await p.waitForTimeout(2000);
  const bb = await (await p.$('#stage')).boundingBox();
  for (const deg of [-90, -60, -30, 0, 30, 60, 90, 120]) {
    const az = await p.evaluate(d => { const c = window.__ctl, cam = window.__cam; c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity; c.minPolarAngle = 0; c.maxPolarAngle = Math.PI; if (!window.__base) { window.__base = { az: c.getAzimuthalAngle(), po: c.getPolarAngle(), r: c.getDistance(), t: c.target.clone(), up: cam.up.clone() }; }
      const b = window.__base, th = b.az + d * Math.PI / 180, ph = b.po; // spherical in the camera's up frame
      const up = b.up.clone().normalize(); const any = Math.abs(up.y) < 0.9 ? new (cam.position.constructor)(0, 1, 0) : new (cam.position.constructor)(1, 0, 0); const x = any.clone().cross(up).normalize(); const z = up.clone().cross(x).normalize();
      // match three's spherical: position = target + r*(sin(ph)sin(th) x̂? ) -> just rebuild from current then rotate around up by d
      const rel = cam.position.clone().sub(b.t); const q = new (cam.quaternion.constructor)().setFromAxisAngle(up, -d * Math.PI / 180); const base = window.__rel0 || (window.__rel0 = rel.clone()); const nr = base.clone().applyQuaternion(q); cam.position.copy(b.t.clone().add(nr)); cam.lookAt(b.t); c.update(); return c.getAzimuthalAngle(); }, deg);
    await p.waitForTimeout(700); await p.screenshot({ path: `probe_${deg}.png`, clip: bb }); console.log(deg, az.toFixed(2));
  }
  await b.close();
})();
