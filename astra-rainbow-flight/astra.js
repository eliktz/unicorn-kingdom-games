/* astra.js — Astra the star-coated flying unicorn + Zoe the rider, procedural (three.js primitives).
   Builds onto window.UK. Astra faces +x (her flying direction). All original art. */
(function () {
  const UK = (window.UK = window.UK || {});
  const C = UK.C, rand = UK.rand;
  const mat = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

  // layered pastel-rainbow mane/tail colours, top → bottom
  const MANE = [0xff8fc8, 0xffb0a0, 0xffe08a, 0xa9f0d6, 0xc9a9f5];

  UK.makeAstra = function () {
    const astra = new THREE.Group();
    const root = new THREE.Group(); // inner group for bobbing
    astra.add(root);
    const white = mat(0xffffff, 0.55), shade = mat(0xe7dcff, 0.6);

    // body — a plump rounded horse barrel
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), white);
    body.scale.set(1.5, 1.0, 1.0);
    root.add(body);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 16), white);
    chest.position.set(1.15, 0.05, 0);
    root.add(chest);
    const rump = new THREE.Mesh(new THREE.SphereGeometry(0.8, 20, 16), shade);
    rump.position.set(-1.1, 0.02, 0);
    root.add(rump);

    // neck + head (toward +x)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.6, 1.2, 16), white);
    neck.position.set(1.55, 0.72, 0);
    neck.rotation.z = -0.7;
    root.add(neck);
    const head = new THREE.Group();
    head.position.set(2.15, 1.35, 0);
    root.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), white);
    skull.scale.set(1.15, 0.95, 0.9);
    head.add(skull);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 12), white);
    muzzle.scale.set(1.1, 0.8, 0.85);
    muzzle.position.set(0.55, -0.18, 0);
    head.add(muzzle);
    const nose = mat(0xffc3e3, 0.5);
    [-1, 1].forEach((s) => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), nose);
      n.position.set(0.8, -0.22, s * 0.12); head.add(n);
    });
    // ears
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10), white);
      ear.position.set(-0.1, 0.5, s * 0.28); ear.rotation.x = -s * 0.3; head.add(ear);
    });
    // eyes (friendly, lilac)
    const eyes = [];
    [-1, 1].forEach((s) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), mat(0x3a2550, 0.2));
      e.position.set(0.28, 0.08, s * 0.34); e.scale.z = 0.8; head.add(e); eyes.push(e);
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sh.position.set(0.37, 0.14, s * 0.3); head.add(sh);
      const lash = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0x7d5aa8, 0.4));
      lash.scale.set(1.1, 0.35, 1.1); lash.position.set(0.24, 0.18, s * 0.34); head.add(lash);
    });
    // cheeks
    [-1, 1].forEach((s) => {
      const ch = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff9ec9, transparent: true, opacity: 0.6 }));
      ch.scale.z = 0.3; ch.position.set(0.3, -0.12, s * 0.42); head.add(ch);
    });

    // pearlescent spiral horn
    const horn = new THREE.Group();
    horn.position.set(0.28, 0.55, 0); horn.rotation.z = -0.35;
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xfff2c8, roughness: 0.2, metalness: 0.6, emissive: 0x6a5a20 });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.75, 12), hornMat);
    spire.position.y = 0.37; horn.add(spire);
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1 - i * 0.017, 0.022, 6, 14), hornMat);
      ring.position.y = 0.08 + i * 0.15; ring.rotation.x = Math.PI / 2; horn.add(ring);
    }
    const hornGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: UK.glowTex, color: 0xffe08a, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    hornGlow.scale.set(1.4, 1.4, 1); hornGlow.position.y = 0.8; horn.add(hornGlow);
    head.add(horn);

    // flowing rainbow mane down the neck + a forelock
    const maneParts = [];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.26 - i * 0.012, 10, 8), mat(MANE[i % MANE.length], 0.5));
      m.scale.set(1, 1.5, 0.7);
      m.position.set(1.95 - i * 0.2, 1.5 - i * 0.16, 0);
      root.add(m); maneParts.push(m);
    }
    const forelock = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(MANE[0], 0.5));
    forelock.scale.set(1, 1.3, 0.7); forelock.position.set(2.3, 1.75, 0); head.add(forelock);

    // flowing rainbow tail
    const tail = new THREE.Group();
    tail.position.set(-1.7, 0.2, 0);
    for (let i = 0; i < 8; i++) {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.28 - i * 0.02, 10, 8), mat(MANE[i % MANE.length], 0.5));
      t.scale.set(0.8, 1.6, 0.7); t.position.set(-i * 0.14, -i * 0.22, rand(-0.12, 0.12));
      tail.add(t);
    }
    root.add(tail);

    // translucent feathered wings (pivot groups, flap on z)
    const wings = [];
    const featherM = new THREE.MeshStandardMaterial({ color: 0xf2eaff, roughness: 0.4, transparent: true, opacity: 0.72, side: THREE.DoubleSide, emissive: 0x4a3a7a });
    [-1, 1].forEach((s) => {
      const pivot = new THREE.Group();
      pivot.position.set(0.1, 0.7, s * 0.55);
      for (let i = 0; i < 5; i++) {
        const f = new THREE.Mesh(new THREE.CircleGeometry(0.9 - i * 0.1, 16), featherM);
        f.scale.set(0.5, 1, 1);
        f.position.set(-0.1 - i * 0.18, 0.2 + i * 0.28, s * 0.05 * i);
        f.rotation.z = 0.5 - i * 0.12; f.rotation.y = s * 0.4;
        pivot.add(f);
      }
      root.add(pivot); wings.push(pivot);
    });

    // four slim legs with pastel hooves
    const legs = [];
    const hoof = mat(0xc9a9f5, 0.4);
    [[0.95, 0.5], [0.95, -0.5], [-0.85, 0.5], [-0.85, -0.5]].forEach((p, i) => {
      const leg = new THREE.Group();
      leg.position.set(p[0], -0.7, p[1]);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 1.0, 10), white);
      l.position.y = -0.5; leg.add(l);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 10), hoof);
      h.position.y = -1.05; leg.add(h);
      leg.userData.phase = i * 1.4;
      root.add(leg); legs.push(leg);
    });

    // twinkling silver star speckles on the coat
    const speckM = new THREE.MeshStandardMaterial({ color: 0xe8e6f5, roughness: 0.3, emissive: 0x8a86b5 });
    for (let i = 0; i < 20; i++) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), speckM);
      const a = rand(-1.3, 1.3), b = rand(-0.5, 0.6);
      sp.position.set(Math.cos(a) * 1.4, 0.3 + Math.sin(b), Math.sin(a) * 0.95);
      root.add(sp);
    }

    // Zoe rides on Astra's back
    const zoe = UK.makeZoe();
    zoe.position.set(-0.1, 0.55, 0);
    zoe.scale.setScalar(0.52);
    root.add(zoe);

    astra.userData = { root, head, wings, legs, tail, maneParts, zoe, flap: rand(0, 6), blink: 0, nextBlink: rand(1, 4), eyes };
    return astra;
  };

  UK.animateAstra = function (a, dt, t, flap = 1, speed = 2.2) {
    const u = a.userData;
    u.flap += dt * speed * Math.PI * 2;
    const w = Math.sin(u.flap);
    u.wings.forEach((pv, i) => { const s = i === 0 ? -1 : 1; pv.rotation.x = s * (w * 0.6 * flap + 0.1); });
    u.root.position.y = Math.sin(t * 2) * 0.12 + (flap > 0.5 ? -w * 0.08 : 0);
    u.root.rotation.z = Math.sin(t * 1.6) * 0.03;
    u.tail.rotation.z = Math.sin(t * 2.5) * 0.18;
    u.legs.forEach((l) => (l.rotation.x = Math.sin(t * 2 + l.userData.phase) * 0.25));
    u.nextBlink -= dt;
    if (u.nextBlink < 0) { u.blink = 0.14; u.nextBlink = rand(1.6, 4.5); }
    if (u.blink > 0) u.blink -= dt;
    const sy = u.blink > 0 ? 0.12 : 0.8;
    u.eyes.forEach((e) => (e.scale.y = sy));
    if (u.zoe && u.zoe.userData.update) u.zoe.userData.update(dt, t);
  };

  // Zoe — small chibi girl rider in a lilac dress, faces +x
  UK.makeZoe = function () {
    const g = new THREE.Group();
    const root = new THREE.Group(); g.add(root);
    const skin = mat(0xf3c9a6, 0.8), dress = mat(0xc9a9f5, 0.8), hair = mat(0x5a3a2a, 0.9);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.55, 1.0, 14), dress);
    body.position.y = 0.5; root.add(body);
    const head = new THREE.Group(); head.position.y = 1.35; root.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), skin));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.53, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), hair);
    cap.position.y = 0.06; head.add(cap);
    [-1, 1].forEach((s) => { // pigtails
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), hair);
      p.scale.set(0.8, 1.4, 0.8); p.position.set(-0.1, -0.1, s * 0.5); head.add(p);
    });
    [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0x2a1c3a, 0.2)); e.position.set(0.42, 0.05, s * 0.2); head.add(e); });
    [-1, 1].forEach((s) => { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff9ec9, transparent: true, opacity: 0.55 })); ch.scale.z = 0.3; ch.position.set(0.36, -0.12, s * 0.3); head.add(ch); });
    const arms = [];
    [-1, 1].forEach((s) => {
      const arm = new THREE.Group(); arm.position.set(0.1, 0.95, s * 0.42);
      const a = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8), dress); a.position.y = -0.3; arm.add(a);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skin); h.position.y = -0.65; arm.add(h);
      arm.rotation.z = 0.5; root.add(arm); arms.push(arm);
    });
    g.userData.update = (dt, t) => { root.position.y = Math.sin(t * 2) * 0.03; arms.forEach((a, i) => (a.rotation.x = Math.sin(t * 3 + i) * 0.3 - 0.4)); head.rotation.y = Math.sin(t * 0.8) * 0.15; };
    return g;
  };
})();
