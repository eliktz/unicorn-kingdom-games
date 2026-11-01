/* world.js — props for the flight: collectible stars + clouds, grey mischief puffs,
   Shadow the silly pony, and bloomable trees on floating islands. Builds onto window.UK. */
(function () {
  const UK = (window.UK = window.UK || {});
  const C = UK.C, rand = UK.rand;
  const mat = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

  // a chunky gold collectible star that spins
  UK.makeStar = function () {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.22 : 0.5;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? shape.lineTo(x, y) : shape.moveTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 });
    geo.center();
    const star = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.25, metalness: 0.5, emissive: 0x8a6a10 }));
    g.add(star);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: UK.glowTex, color: C.gold, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(2.4, 2.4, 1); g.add(glow);
    g.userData.spin = rand(1, 2);
    return g;
  };

  // a fluffy catchable cloud puff
  UK.makeCloud = function (scale = 1) {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0xf3edff, roughness: 1, emissive: 0x3a2f5a });
    const n = 5;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(rand(0.5, 0.8), 14, 10), m);
      s.position.set((i - n / 2) * 0.55, rand(-0.1, 0.25) - Math.abs(i - n / 2) * 0.08, rand(-0.2, 0.2));
      g.add(s);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: UK.glowTex, color: 0xffc3e3, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(3.2, 2.2, 1); g.add(glow);
    g.scale.setScalar(scale);
    return g;
  };

  // harmless grey mischief puff dropped by Shadow — a sneeze, never a fail
  UK.makeGreyPuff = function () {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0x8c88a0, roughness: 1, transparent: true, opacity: 0.85, emissive: 0x2a2838 });
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(rand(0.35, 0.55), 12, 8), m);
      s.position.set(rand(-0.4, 0.4), rand(-0.3, 0.3), rand(-0.2, 0.2));
      g.add(s);
    }
    return g;
  };

  // Shadow — a round, silly grey pony with droopy ears. Harmless; he just drifts past.
  UK.makeShadow = function () {
    const g = new THREE.Group();
    const root = new THREE.Group(); g.add(root);
    const grey = mat(0x9a93ad, 0.8), dark = mat(0x6f6887, 0.8);
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), grey);
    body.scale.set(1.3, 1.05, 1.0); root.add(body);
    const head = new THREE.Group(); head.position.set(1.15, 0.5, 0); root.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 14), grey));
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), mat(0xb0a9c0, 0.8));
    muzzle.scale.set(1.1, 0.8, 0.9); muzzle.position.set(0.5, -0.2, 0); head.add(muzzle);
    // droopy ears
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), dark);
      ear.position.set(-0.25, 0.3, s * 0.35); ear.rotation.z = 2.2; ear.rotation.x = -s * 0.5; head.add(ear);
    });
    // grumpy little eyes
    [-1, 1].forEach((s) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(0x241c33, 0.2));
      e.position.set(0.32, 0.12, s * 0.28); head.add(e);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), dark);
      brow.position.set(0.34, 0.3, s * 0.28); brow.rotation.z = -s * 0.4; head.add(brow);
    });
    // scruffy dark mane + tail
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 7), dark); m.position.set(0.5 - i * 0.18, 0.95 - i * 0.05, 0); m.rotation.z = 0.5; root.add(m); }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 8), dark);
    tail.position.set(-1.25, 0.1, 0); tail.rotation.z = -2.2; root.add(tail);
    // stubby legs
    [[0.6, 0.45], [0.6, -0.45], [-0.6, 0.45], [-0.6, -0.45]].forEach((p) => {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.8, 8), dark);
      l.position.set(p[0], -1.0, p[1]); root.add(l);
    });
    // little bat-ish wings so he can fly too
    const wings = [];
    [-1, 1].forEach((s) => {
      const pv = new THREE.Group(); pv.position.set(-0.1, 0.5, s * 0.7);
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshStandardMaterial({ color: 0x5a5370, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
      w.scale.set(0.6, 1, 1); w.position.y = 0.4; w.rotation.y = s * 0.3; pv.add(w); root.add(pv); wings.push(pv);
    });
    g.userData = { root, wings, t: rand(0, 6) };
    return g;
  };
  UK.animateShadow = function (sh, dt, t) {
    const u = sh.userData;
    u.wings.forEach((pv, i) => (pv.rotation.x = (i ? 1 : -1) * (Math.sin(t * 14) * 0.7 + 0.1)));
    u.root.position.y = Math.sin(t * 5) * 0.12;
    u.root.rotation.z = Math.sin(t * 3) * 0.06;
  };

  // bloomable tree on a floating grass island: starts bare & droopy, blooms to pink blossom
  UK.makeTree = function () {
    const g = new THREE.Group();
    const island = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x6a4f8a, 1));
    island.scale.set(1, 0.6, 1); island.position.y = -0.1; g.add(island);
    const grass = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), mat(0x4a7a62, 1));
    grass.rotation.x = -Math.PI / 2; grass.position.y = 0.02; g.add(grass);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.0, 10), mat(0x6b4a3a, 0.9));
    trunk.position.y = 1.0; g.add(trunk);
    // two canopy materials we cross-fade: bare (sparse olive) ↔ bloom (mint + pink blossoms)
    const bareM = mat(0x5f6f55, 1), bloomM = mat(C.mint, 0.8);
    const canopy = [], blossoms = [];
    for (let i = 0; i < 7; i++) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(rand(0.55, 0.85), 14, 10), bareM);
      ball.position.set(rand(-0.8, 0.8), 2.0 + rand(-0.1, 0.7), rand(-0.8, 0.8));
      g.add(ball); canopy.push(ball);
    }
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(C.pink, 0.5));
      const a = rand(0, Math.PI * 2), r = rand(0.3, 1.0);
      b.position.set(Math.cos(a) * r, 2.3 + rand(-0.3, 0.7), Math.sin(a) * r);
      b.visible = false; b.scale.setScalar(0.01); g.add(b); blossoms.push(b);
    }
    g.userData = { bloom: 0, target: 0, canopy, blossoms, bareM, bloomM, trunk };
    g.userData.setBloom = (v) => (g.userData.target = v);
    g.userData.update = (dt) => {
      const u = g.userData;
      u.bloom += (u.target - u.bloom) * Math.min(1, dt * 2.5);
      u.canopy.forEach((c) => c.material.color.copy(u.bareM.color).lerp(u.bloomM.color, u.bloom));
      u.trunk.rotation.z = (1 - u.bloom) * 0.08;
      u.blossoms.forEach((b) => { b.visible = u.bloom > 0.05; b.scale.setScalar(Math.max(0.01, u.bloom)); });
    };
    return g;
  };
})();
