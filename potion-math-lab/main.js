/* main.js — מעבדת השיקויים של אסטרה: a gentle potion-math lab.
   A recipe shows a sum (e.g. 5 + 7); drag the ingredient bottle whose number matches
   into the cauldron. Right → the potion blooms rainbow and a tree wakes up. Wrong → a
   soft fizz + a dot hint, and the level eases down. No fail state, fully touch-driven. */
(function () {
  const UK = window.UK;
  const { clamp, rand, mix, C } = UK;
  const sfx = UK.audio;

  const { ctx, state } = UK.canvasSetup(onResize);
  const P = UK.Particles();
  const engine = UK.mathEngine();

  const GOAL = 10;
  const BOTTLE_COLORS = [C.pink, C.lilac, C.mint, C.gold, '#8fd3ff'];
  const RAINBOW = ['#ff6b9d', '#ffb86b', C.gold, C.mint, '#8fd3ff', C.lilac];

  let bloomed = 0, playing = false, t = 0, lockT = 0, hintT = 0, mood = 0;
  let cauldronColor = C.lilac, cauldronFill = 0.45, pourFlash = 0, pendingNext = false;
  const trees = [];          // {bloom, target, x, y, s}
  let bottles = [];          // {label, color, x, y, hx, hy, held, scale, poured}
  let held = null, offx = 0, offy = 0;
  const cauldron = { x: 0, y: 0, s: 60 };
  const hintPos = { x: 0, y: 0 };

  const ui = UK.ui({
    title: 'מעבדת השיקויים של אסטרה',
    hint: '🧪 גררו את הבקבוק הנכון לסיר',
    goal: GOAL,
    recipeLabel: 'כמה נצנוצים צריך לשיקוי?',
    onStart() { playing = true; sfx.music(true); newProblem(); },
    onHint() { if (playing) { hintT = 4; sfx.sparkle(); } },
  });

  // ---- layout (CSS px) ----
  function onResize(w, h) {
    const m = Math.min(w, h);
    cauldron.x = w / 2; cauldron.y = h * 0.56; cauldron.s = clamp(m * 0.2, 70, 150);
    hintPos.x = w / 2; hintPos.y = h * 0.30;
    // 10 trees along a soft hill behind the cauldron
    const ty = h * 0.40, ts = clamp(m * 0.1, 40, 84);
    for (let i = 0; i < GOAL; i++) {
      const x = w * (i + 0.5) / GOAL;
      if (trees[i]) { trees[i].x = x; trees[i].y = ty; trees[i].s = ts; }
      else trees[i] = { bloom: 0, target: 0, x, y: ty, s: ts };
    }
    layoutBottles(w, h);
  }
  function layoutBottles(w, h) {
    const bs = clamp(Math.min(w, h) * 0.12, 54, 96);
    const y = h - bs * 1.4 - 18;
    bottles.forEach((b, i) => {
      b.s = bs; b.hx = w * (i + 1) / (bottles.length + 1); b.hy = y;
      if (!b.held) { b.x = b.hx; b.y = b.hy; }
    });
  }

  function newProblem() {
    const st = engine.next();
    ui.setEquation(st.problem.text);
    bottles = st.options.map((label, i) => ({
      label, color: BOTTLE_COLORS[i % BOTTLE_COLORS.length],
      x: 0, y: 0, hx: 0, hy: 0, held: false, scale: 1, poured: false,
    }));
    layoutBottles(state.w, state.h);
    hintT = 0;
  }

  // ---- interactions ----
  function hitBottle(px, py) {
    for (let i = bottles.length - 1; i >= 0; i--) {
      const b = bottles[i];
      if (!b.poured && Math.hypot(px - b.x, py - b.y) < b.s * 0.85) return b;
    }
    return null;
  }
  function onDown(px, py) {
    if (!playing || lockT > 0) return;
    const b = hitBottle(px, py);
    if (b) { held = b; b.held = true; offx = b.x - px; offy = b.y - py; sfx.pop(); }
  }
  function onMove(px, py) { if (held) { held.x = px + offx; held.y = py + offy; } }
  function onUp() {
    if (!held) return;
    const b = held; b.held = false; held = null;
    const overPot = Math.hypot(b.x - cauldron.x, b.y - cauldron.y) < cauldron.s * 1.15;
    if (overPot) (b.label === engine.state.problem.answer ? success : wrong)(b);
  }

  function success(b) {
    b.poured = true; b.x = cauldron.x; b.y = cauldron.y - cauldron.s * 0.2;
    sfx.pour(); sfx.bloom(); sfx.fanfare(); sfx.cheer();
    cauldronColor = RAINBOW[bloomed % RAINBOW.length]; pourFlash = 1; cauldronFill = 0.72; mood = 1.4;
    P.burst(cauldron.x, cauldron.y - cauldron.s * 0.3, [C.pink, C.gold, C.mint, C.lilac, '#fff'], 40, 6, 1.0);
    const tree = trees[bloomed % GOAL];
    if (tree) tree.target = 1;
    bloomed++; ui.setScore(bloomed % GOAL === 0 ? GOAL : bloomed % GOAL);
    ui.banner('העץ פרח! 🌸');
    if (bloomed % GOAL === 0) festival();
    lockT = 1.25; pendingNext = true;
  }
  function wrong(b) {
    sfx.fizz(); engine.wrong();
    cauldronColor = '#9a93ad'; pourFlash = 0.6; ui.wobble();
    hintT = 3.2; // auto-reveal the dot hint
    P.burst(cauldron.x, cauldron.y - cauldron.s * 0.2, ['#cfc9e0', '#b7afce'], 14, 3, 0.7);
  }
  function festival() {
    ui.banner('🎉 חגיגת הקיץ! 🎉', 2200);
    for (const tr of trees) tr.target = 1;
    P.burst(state.w / 2, state.h * 0.42, RAINBOW.concat(['#fff']), 70, 8, 1.4);
    // fresh grove for endless, no-fail play
    setTimeout(() => { for (const tr of trees) { tr.target = 0; } }, 2400);
  }

  // ---- render ----
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; t += dt;
    const { w, h } = state;

    if (lockT > 0) { lockT -= dt; if (lockT <= 0 && pendingNext) { pendingNext = false; engine.correct(); newProblem(); } }
    if (hintT > 0) hintT -= dt;
    if (mood > 0) mood -= dt;
    pourFlash = Math.max(0, pourFlash - dt * 1.6);
    cauldronColor = mix(cauldronColor, pourFlash > 0 ? cauldronColor : C.lilac, dt * 1.5);
    cauldronFill += ((playing ? 0.52 : 0.4) - cauldronFill) * dt * 2;

    UK.drawSky(ctx, w, h, t);
    drawHill(w, h);
    for (const tr of trees) { tr.bloom += (tr.target - tr.bloom) * Math.min(1, dt * 2.5); UK.drawTree(ctx, tr.x, tr.y, tr.s, tr.bloom); }

    UK.drawCauldron(ctx, cauldron.x, cauldron.y, cauldron.s, cauldronFill, cauldronColor, t);
    if ((t * 1.3 | 0) % 2 === 0 && playing && Math.random() < 0.02) sfx.bubble();
    UK.drawAstra(ctx, cauldron.x - cauldron.s * 1.7, cauldron.y - cauldron.s * 0.1, cauldron.s * 0.5, t, mood);

    // bottles: settle toward home, held one drawn last (on top)
    for (const b of bottles) {
      if (!b.held) { b.x += (b.hx - b.x) * Math.min(1, dt * 10); b.y += (b.hy - b.y) * Math.min(1, dt * 10); }
      if (b.poured) b.scale = Math.max(0, b.scale - dt * 2.2);
      if (b !== held) drawBottle(b);
    }
    if (held) drawBottle(held);

    if (hintT > 0) UK.drawHint(ctx, hintPos.x, hintPos.y, cauldron.s, engine.state.hint, Math.min(1, hintT));

    P.update(dt); P.draw(ctx);
    requestAnimationFrame(frame);
  }
  function drawBottle(b) {
    if (b.scale <= 0.01) return;
    const lift = b.held ? 1.12 : 1;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.scale * lift, b.scale * lift); ctx.translate(-b.x, -b.y);
    UK.drawBottle(ctx, b.x, b.y, b.s, b.label, b.color, { t });
    ctx.restore();
  }
  function drawHill(w, h) {
    const g = ctx.createLinearGradient(0, h * 0.38, 0, h);
    g.addColorStop(0, 'rgba(106,79,138,.0)'); g.addColorStop(0.3, 'rgba(90,63,120,.55)'); g.addColorStop(1, 'rgba(58,39,80,.8)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, h * 0.52);
    ctx.quadraticCurveTo(w * 0.5, h * 0.42, w, h * 0.52);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  }

  // ---- pointer wiring (touch + mouse via pointer events) ----
  const relay = (fn) => (e) => { fn(e.clientX, e.clientY); };
  window.addEventListener('pointerdown', relay(onDown));
  window.addEventListener('pointermove', relay(onMove));
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  // test hooks
  window.__game = {
    get bloomed() { return bloomed; },
    get playing() { return playing; },
    get level() { return engine.level; },
    cauldronPos: () => ({ x: cauldron.x, y: cauldron.y }),
    correctBottlePos() { const b = bottles.find((x) => x.label === engine.state.problem.answer); return b ? { x: b.x, y: b.y } : null; },
    forceSolve() { const b = bottles.find((x) => x.label === engine.state.problem.answer); if (b) success(b); },
  };
  requestAnimationFrame(frame);
})();
