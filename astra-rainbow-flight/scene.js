/* scene.js — renderer, dreamy pastel sky, shared textures + particle fx.
   Everything hangs off the global UK namespace so the small <script> files can share it. */
(function () {
  const UK = (window.UK = window.UK || {});

  const rand = (a, b) => a + Math.random() * (b - a);
  UK.rand = rand;
  UK.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  UK.lerp = (a, b, t) => a + (b - a) * t;

  // palette (from DESIGN.md) as hex numbers for three.js
  UK.C = {
    skyTop: 0x3a2766, skyMid: 0x7d5aa8, skyGlow: 0xffc3e3,
    pink: 0xff8fc8, lilac: 0xc9a9f5, silver: 0xe8e6f5,
    mint: 0xa9f0d6, gold: 0xffe08a, ink: 0x3a2550,
  };

  UK.viewport = function () {
    const vv = window.visualViewport;
    return { w: Math.round((vv && vv.width) || window.innerWidth), h: Math.round((vv && vv.height) || window.innerHeight) };
  };

  function canvasTex(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    return t;
  }
  UK.canvasTex = canvasTex;

  // soft round glow
  UK.glowTex = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.75)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  // twinkly star sprite
  UK.starTex = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.45, 'rgba(255,255,255,0.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 5 : 30; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
    g.closePath(); g.fill();
  });

  UK.setup = function (opts) {
    opts = opts || {};
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(dpr());
    const vp0 = UK.viewport();
    renderer.setSize(vp0.w, vp0.h);
    renderer.setClearColor(UK.C.skyTop, 1);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x5a3f82, 30, 80);
    const camera = new THREE.PerspectiveCamera(opts.fov || 55, vp0.w / vp0.h, 0.1, 400);
    camera.position.set(0, 0.5, 22);
    camera.lookAt(0, 0.5, 0);

    scene.add(new THREE.HemisphereLight(0xfff0fb, 0x6a4f9a, 1.35));
    const key = new THREE.DirectionalLight(0xfff3e8, 1.0);
    key.position.set(-6, 10, 12); scene.add(key);
    const rim = new THREE.PointLight(0xff9ad5, 0.7, 60); rim.position.set(8, 2, 10); scene.add(rim);

    function resize() {
      const { w, h } = UK.viewport();
      renderer.setPixelRatio(dpr());
      renderer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (opts.onResize) opts.onResize(w, h);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => { resize(); setTimeout(resize, 250); setTimeout(resize, 600); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    return { renderer, scene, camera, resize };
  };

  // gradient sky dome + drifting twinkling stars + horizon glow
  UK.makeSky = function (scene) {
    const geo = new THREE.SphereGeometry(200, 24, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(UK.C.skyTop) },
        mid: { value: new THREE.Color(UK.C.skyMid) },
        bot: { value: new THREE.Color(UK.C.skyGlow) },
      },
      vertexShader: 'varying vec3 vp; void main(){ vp=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vp; void main(){ float h=normalize(vp).y*0.5+0.5; vec3 c=mix(bot,mid,smoothstep(0.0,0.5,h)); c=mix(c,top,smoothstep(0.45,1.0,h)); gl_FragColor=vec4(c,1.0);} ',
    });
    const dome = new THREE.Mesh(geo, mat);
    scene.add(dome);

    // stars
    const N = 220, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), ph = [];
    const tint = [new THREE.Color(UK.C.silver), new THREE.Color(UK.C.gold), new THREE.Color(UK.C.pink)];
    for (let i = 0; i < N; i++) {
      const a = rand(0, Math.PI * 2), y = rand(0.1, 0.95), r = 150;
      pos[i * 3] = Math.cos(a) * r * Math.sqrt(1 - y * y);
      pos[i * 3 + 1] = y * 110 + 6;
      pos[i * 3 + 2] = Math.sin(a) * r * Math.sqrt(1 - y * y) - 40;
      const c = tint[(Math.random() * 3) | 0]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; ph.push(rand(0, 6));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 4.5, map: UK.starTex, vertexColors: true, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    scene.add(stars);

    // big soft moon
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: UK.glowTex, color: 0xfff0d8, transparent: true, opacity: 0.8, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    moon.scale.set(44, 44, 1); moon.position.set(-48, 46, -120); scene.add(moon);

    return { dome, stars, update(t) { stars.material.opacity = 0.75 + 0.25 * Math.sin(t * 0.8); } };
  };

  // lightweight additive-sprite particle pool for bursts + trails
  UK.Particles = function (scene, max) {
    max = max || 500;
    const sprites = [], free = [];
    const mats = {};
    function mat(color) {
      if (!mats[color]) mats[color] = new THREE.SpriteMaterial({ map: UK.starTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      return mats[color];
    }
    for (let i = 0; i < max; i++) {
      const s = new THREE.Sprite(mat(0xffffff));
      s.visible = false; s.userData = { life: 0 }; scene.add(s); sprites.push(s); free.push(s);
    }
    function spawn(pos, color, vx, vy, size, life, grav) {
      const s = free.pop(); if (!s) return;
      s.material = mat(color); s.visible = true;
      s.position.copy(pos); s.scale.setScalar(size);
      s.userData = { life, max: life, vx, vy, grav: grav == null ? -3 : grav, size };
    }
    this.burst = function (pos, colors, n, speed, size, life) {
      n = n || 24; speed = speed || 6; size = size || 0.6; life = life || 1.1; colors = colors || [UK.C.pink, UK.C.gold, UK.C.silver, UK.C.lilac];
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(speed * 0.3, speed);
        spawn(pos, colors[(Math.random() * colors.length) | 0], Math.cos(a) * sp, Math.sin(a) * sp + 1, size * rand(0.6, 1.2), life * rand(0.6, 1), -4);
      }
    };
    this.trail = function (pos, color, size) { spawn(pos, color || UK.C.gold, rand(-0.4, 0.4), rand(-0.2, 0.4), size || 0.5, 0.7, 0.5); };
    this.update = function (dt) {
      for (const s of sprites) {
        if (!s.visible) continue;
        const u = s.userData; u.life -= dt;
        if (u.life <= 0) { s.visible = false; free.push(s); continue; }
        u.vy += u.grav * dt;
        s.position.x += u.vx * dt; s.position.y += u.vy * dt;
        const k = u.life / u.max;
        s.material.opacity = k; s.scale.setScalar(u.size * (0.4 + 0.6 * k));
      }
    };
  };
})();
