/* main.js — מסע הקשת של אסטרה: a gentle side-scrolling flight.
   Steer Astra by touch/drag, collect stars + catch clouds; every 10 stars paints a
   rainbow band and blooms a wilted tree. Grey puffs only make her sneeze. No fail state. */
(function () {
  const UK = window.UK;
  const { rand, clamp, lerp, C } = UK;

  const { renderer, scene, camera } = UK.setup({ fov: 55, onResize: fitCam });
  // frame Astra + her flight lane; portrait keeps her big and lifts the horizon.
  function fitCam() {
    const p = UK.isPortrait();
    const d = UK.fitDistance(55, p ? 11 : 15, 7);
    camera.position.set(0, p ? 3.5 : 2.5, Math.max(18, d));
    camera.lookAt(0, p ? 3.5 : 2, 0);
  }
  fitCam();

  const sky = UK.makeSky(scene);
  const fx = new UK.Particles(scene, 600);
  const input = UK.input();

  let stars = 0, bloomed = 0, playing = false, speed = 6;
  const ui = UK.ui({
    title: 'מסע הקשת של אסטרה', icon: '⭐', hint: '👆 ⬆️ ⬇️',
    onStart() { playing = true; UK.audio.cloud(); UK.audio.music(true); },
  });

  /* ground mist + floating islands with bloomable trees scroll past below */
  const trees = [];
  for (let i = 0; i < 5; i++) {
    const tr = UK.makeTree();
    tr.position.set(10 + i * 26, rand(-5.5, -4), rand(-6, -2));
    tr.scale.setScalar(rand(1.2, 1.7));
    scene.add(tr);
    trees.push({ o: tr, span: 5 * 26 });
  }
  // soft decorative background clouds
  const bgClouds = [];
  for (let i = 0; i < 10; i++) {
    const c = UK.makeCloud(rand(1.6, 3));
    c.position.set(rand(-40, 40), rand(4, 16), rand(-30, -12));
    c.children.forEach((m) => { if (m.material) m.material.opacity = 0.5, m.material.transparent = true; });
    scene.add(c);
    bgClouds.push({ o: c, speed: rand(0.1, 0.25), span: 90 });
  }

  /* rainbow trail ribbon — a band of coloured segments that grows as you collect */
  const RAIN = [0xff6b9d, 0xffb86b, 0xffe08a, 0xa9f0d6, 0x8fd3ff, 0xc9a9f5];
  const ribbon = new THREE.Group();
  scene.add(ribbon);
  function addRainbowBand() {
    const band = new THREE.Group();
    RAIN.forEach((col, i) => {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.22),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4, roughness: 0.4 }));
      seg.position.y = -i * 0.26;
      band.add(seg);
    });
    band.position.set(0, 2, -1.5);
    band.userData = { t: 0 };
    ribbon.add(band);
  }

  /* Astra */
  const astra = UK.makeAstra();
  astra.scale.setScalar(0.85);
  astra.position.set(-3, 2, 0);
  astra.rotation.y = -0.5; // 3/4 toward camera, facing flight (+x)
  scene.add(astra);
  const vel = new THREE.Vector2();
  let sneeze = 0, loop = 0;

  /* Shadow drifts past now and then, dropping a harmless grey puff */
  const shadow = UK.makeShadow();
  shadow.scale.setScalar(0.5);
  shadow.visible = false;
  shadow.rotation.y = -0.4;
  scene.add(shadow);
  let shadowT = rand(6, 10), shadowActive = false;

  /* collectibles */
  const items = [];
  function spawnStar(x, y) {
    const s = UK.makeStar();
    s.position.set(x, y == null ? rand(-0.5, 6.5) : y, 0);
    s.userData.type = 'star'; s.userData.phase = rand(0, 6);
    scene.add(s); items.push(s);
  }
  function spawnCloud(x) {
    const c = UK.makeCloud(1);
    c.position.set(x, rand(0.5, 6), 0);
    c.userData.type = 'cloud';
    scene.add(c); items.push(c);
  }
  function spawnPuff(x, y) {
    const p = UK.makeGreyPuff();
    p.position.set(x, y, 0);
    p.userData.type = 'puff';
    scene.add(p); items.push(p);
  }
  let spawnTimer = 0, nextSpawn = 0;
  function spawn() {
    const x = 20, r = Math.random();
    if (r < 0.6) {
      if (Math.random() < 0.4) { const y0 = rand(0.5, 5); for (let i = 0; i < 3; i++) spawnStar(x + i * 2.2, y0 + Math.sin(i * 1.1) * 1.3); }
      else spawnStar(x);
    } else spawnCloud(x);
  }
  for (let i = 0; i < 4; i++) spawnStar(3 + i * 4);

  const clock = new THREE.Clock();
  let t = 0;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    sky.update(t);
    const worldSpeed = playing ? speed : 2.5;

    /* steer Astra */
    if (playing) {
      const ax = input.axis();
      if (ax.any) {
        vel.x = lerp(vel.x, ax.x * 8, dt * 6);
        vel.y = lerp(vel.y, ax.y * 8, dt * 6);
      } else if (input.pointer && input.down) {
        const tgt = UK.pointerToPlane(camera, input.pointer, 0);
        vel.x = lerp(vel.x, clamp((tgt.x - astra.position.x) * 3, -11, 11), dt * 6);
        vel.y = lerp(vel.y, clamp((tgt.y - astra.position.y) * 3, -11, 11), dt * 6);
      } else {
        vel.multiplyScalar(1 - dt * 3);
      }
      astra.position.x = clamp(astra.position.x + vel.x * dt, -9, 7);
      astra.position.y = clamp(astra.position.y + vel.y * dt, -2, 8);
    } else {
      astra.position.y = 2 + Math.sin(t * 1.3) * 1.1;
      astra.position.x = -3 + Math.sin(t * 0.6) * 1.5;
    }
    astra.rotation.z = vel.y * 0.03;
    if (sneeze > 0) { sneeze -= dt; astra.rotation.z += Math.sin(sneeze * 40) * 0.25; }
    if (loop > 0) { loop -= dt; astra.rotation.x = (1 - loop / 1.2) * Math.PI * 2; } else astra.rotation.x = 0;
    UK.animateAstra(astra, dt, t, 1, 2 + Math.abs(vel.y) * 0.06);
    // sparkle trail from the horn
    if (Math.random() < 0.5) fx.trail(astra.position.clone().add(new THREE.Vector3(1.5, 1.2, 0)), RAIN[(t * 12) | 0 % RAIN.length], 0.5);

    /* scroll the world */
    for (const b of bgClouds) { b.o.position.x -= worldSpeed * b.speed * dt; if (b.o.position.x < -45) b.o.position.x += b.span; }
    for (const tr of trees) {
      tr.o.position.x -= worldSpeed * 0.5 * dt;
      if (tr.o.position.x < -18) { tr.o.position.x += tr.span; }
      tr.o.userData.update(dt);
    }
    // rainbow ribbon trails behind Astra
    for (let i = ribbon.children.length - 1; i >= 0; i--) {
      const band = ribbon.children[i];
      band.position.x -= worldSpeed * dt;
      if (band.position.x < -40) ribbon.remove(band);
    }

    /* Shadow cameo */
    shadowT -= dt;
    if (!shadowActive && playing && shadowT < 0) { shadowActive = true; shadow.visible = true; shadow.position.set(22, rand(4, 7), -1); }
    if (shadowActive) {
      shadow.position.x -= (worldSpeed + 2) * dt;
      UK.animateShadow(shadow, dt, t);
      if (Math.random() < 0.02) spawnPuff(shadow.position.x - 1, shadow.position.y - 0.5);
      if (shadow.position.x < -22) { shadowActive = false; shadow.visible = false; shadowT = rand(10, 16); }
    }

    /* items */
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i], u = it.userData;
      it.position.x -= worldSpeed * dt;
      if (u.type === 'star') it.rotation.y += dt * u.spin * 2, it.position.y += Math.sin(t * 2 + u.phase) * 0.006;
      if (u.popping) {
        u.popping -= dt; it.scale.multiplyScalar(1 + dt * 4);
        it.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, u.popping * 2); } });
        if (u.popping <= 0) { scene.remove(it); items.splice(i, 1); }
        continue;
      }
      const d = Math.hypot(it.position.x - astra.position.x, it.position.y - astra.position.y);
      if (playing && d < 1.8) {
        if (u.type === 'star') {
          stars++; ui.setScore(stars); UK.audio.chime();
          fx.burst(it.position, [C.gold, 0xffffff, C.pink], 20, 5, 0.6);
          scene.remove(it); items.splice(i, 1);
          if (stars % 10 === 0) milestone();
          continue;
        } else if (u.type === 'cloud') {
          UK.audio.cloud(); UK.audio.sparkle();
          fx.burst(it.position, [0xffffff, 0xc9a9f5, 0xffc3e3], 28, 6, 0.8);
          addRainbowBand();
          scene.remove(it); items.splice(i, 1);
          continue;
        } else if (u.type === 'puff' && !u.hit) {
          u.hit = true; u.popping = 0.4; sneeze = 0.5; UK.audio.sneeze();
          fx.burst(it.position, [0x9a93ad, 0xcfc9e0], 16, 4, 0.7);
          continue;
        }
      }
      if (it.position.x < -24) { scene.remove(it); items.splice(i, 1); }
    }

    if (playing) {
      spawnTimer += dt;
      if (spawnTimer > nextSpawn) { spawnTimer = 0; nextSpawn = rand(0.7, 1.2) * (6 / speed); spawn(); }
    }

    fx.update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // milestone: bloom the next wilted tree, little fanfare + loop, speed nudges up
  function milestone() {
    bloomed++;
    const tr = trees[(bloomed - 1) % trees.length];
    tr.o.userData.setBloom(1);
    UK.audio.bloom(); UK.audio.fanfare();
    ui.banner('העץ פרח! 🌸');
    UK.audio.cheer();
    loop = 1.2;
    addRainbowBand(); addRainbowBand();
    fx.burst(tr.o.position.clone().add(new THREE.Vector3(0, 3, 0)), [C.pink, C.mint, C.gold], 40, 8, 0.9);
    speed = Math.min(speed + 0.5, 10);
    UK.audio.resetChime();
  }

  // test hooks
  window.__game = { get stars() { return stars; }, get bloomed() { return bloomed; }, astra, items, camera, milestone };
  frame();
})();
