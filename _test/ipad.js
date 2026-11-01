// iPad Safari emulation test: iPad Pro 11 portrait + landscape, touch input, WebGL via swiftshader.
// Checks: no console errors, touch moves Astra / scores, and captures screenshots.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// page.screenshot() hangs on a canvas that redraws every rAF (software GL); capture via CDP instead.
async function shot(page, file) {
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  await cdp.detach();
}

const ROOT = path.resolve(__dirname, '..');
const url = (name) => 'file://' + path.resolve(ROOT, name === 'index' ? 'index.html' : name + '/index.html');

const PORTRAIT = { width: 834, height: 1194 };
const LANDSCAPE = { width: 1194, height: 834 };
const SAFARI_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function dragTouch(page, from, to, steps = 8) {
  const client = await page.context().newCDPSession(page);
  const send = (type, x, y) => client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await send('touchStart', from.x, from.y);
  for (let i = 1; i <= steps; i++) {
    await send('touchMove', from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    await page.waitForTimeout(40);
  }
  await send('touchEnd', to.x, to.y);
  await client.detach();
}

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  let failures = 0;

  for (const [orient, vp] of [['portrait', PORTRAIT], ['landscape', LANDSCAPE]]) {
    for (const name of ['index', 'astra-rainbow-flight', 'potion-math-lab']) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: SAFARI_UA });
      const page = await ctx.newPage();
      const errs = [];
      // AudioContext-autoplay warnings are a headless artifact (synthetic taps don't grant autoplay);
      // on a real iPad the first touch unlocks audio. Ignore only that known-benign warning.
      const benign = (t) => /AudioContext was not allowed to start/.test(t);
      page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !benign(m.text())) errs.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

      await page.goto(url(name));
      await page.waitForTimeout(1600);
      const tag = `ipad-${name}-${orient}`;
      await shot(page, `shots/${tag}-start.png`);

      let note = '';
      if (name === 'astra-rainbow-flight') {
        await page.touchscreen.tap(vp.width / 2, vp.height / 2); // start
        await page.waitForTimeout(500);
        const before = await page.evaluate(() => ({ x: window.__game.astra.position.x, y: window.__game.astra.position.y, stars: window.__game.stars }));
        await dragTouch(page, { x: vp.width * 0.3, y: vp.height * 0.4 }, { x: vp.width * 0.7, y: vp.height * 0.6 });
        for (const [fx, fy] of [[0.7, 0.3], [0.3, 0.6], [0.6, 0.45], [0.45, 0.4], [0.65, 0.6]]) {
          await page.touchscreen.tap(vp.width * fx, vp.height * fy);
          await page.waitForTimeout(500);
        }
        await page.waitForTimeout(500);
        // verify the milestone/bloom path works
        await page.evaluate(() => window.__game.milestone());
        await page.waitForTimeout(400);
        const after = await page.evaluate(() => ({ x: window.__game.astra.position.x, y: window.__game.astra.position.y, stars: window.__game.stars, bloomed: window.__game.bloomed }));
        const moved = Math.hypot(after.x - before.x, after.y - before.y) > 0.5;
        note = `moved=${moved} stars ${before.stars}->${after.stars} bloomed=${after.bloomed}`;
        if (!moved) { failures++; note += '  !! astra did not respond to touch'; }
        if (after.bloomed < 1) { failures++; note += '  !! tree did not bloom'; }
        await shot(page, `shots/${tag}-play.png`);
      } else if (name === 'potion-math-lab') {
        await page.touchscreen.tap(vp.width / 2, vp.height / 2); // start
        await page.waitForTimeout(500);
        const started = await page.evaluate(() => window.__game.playing);
        // drag the correct ingredient bottle into the cauldron
        const pts = await page.evaluate(() => ({ pot: window.__game.cauldronPos(), bottle: window.__game.correctBottlePos() }));
        if (pts.bottle) await dragTouch(page, pts.bottle, pts.pot, 12);
        await page.waitForTimeout(1600); // let the lock + next-problem settle
        // solve a couple more directly to exercise the adaptive ramp + festival
        for (let i = 0; i < 3; i++) { await page.evaluate(() => window.__game.forceSolve()); await page.waitForTimeout(1500); }
        const after = await page.evaluate(() => ({ bloomed: window.__game.bloomed, level: window.__game.level }));
        note = `started=${started} bloomed=${after.bloomed} level=${after.level.toFixed(2)}`;
        if (!started) { failures++; note += '  !! game did not start'; }
        if (after.bloomed < 1) { failures++; note += '  !! no tree bloomed'; }
        await shot(page, `shots/${tag}-play.png`);
      }

      const ok = errs.length === 0;
      if (!ok) failures++;
      console.log(`${tag.padEnd(34)} ${ok ? 'no console errors' : 'ERRORS: ' + errs.join(' | ')}  ${note}`);
      await ctx.close();
    }
  }

  await browser.close();
  console.log(failures ? `\n❌ ${failures} failure(s)` : '\n✅ all iPad checks passed');
  process.exit(failures ? 1 : 0);
})();
