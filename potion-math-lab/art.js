/* art.js — shared utils + procedural canvas scene art (sky, trees, cauldron, particles).
   All original, DESIGN.md pastel palette. No external assets. Sprites live in sprites.js. */
(function () {
  const UK = (window.UK = window.UK || {});

  // palette (canvas hex strings) — DESIGN.md tokens
  UK.C = {
    skyTop: '#3a2766', skyMid: '#7d5aa8', skyGlow: '#ffc3e3',
    pink: '#ff8fc8', lilac: '#c9a9f5', silver: '#e8e6f5',
    mint: '#a9f0d6', gold: '#ffe08a', ink: '#3a2550',
  };
  UK.rand = (a, b) => a + Math.random() * (b - a);
  UK.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  UK.lerp = (a, b, t) => a + (b - a) * t;

  // DPR-aware full-window canvas; onResize(w,h) called in CSS pixels
  UK.canvasSetup = function (onResize) {
    const canvas = document.getElementById('scene');
    const ctx = canvas.getContext('2d');
    const state = { w: 0, h: 0, dpr: 1 };
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      state.w = window.innerWidth; state.h = window.innerHeight; state.dpr = dpr;
      canvas.width = Math.round(state.w * dpr);
      canvas.height = Math.round(state.h * dpr);
      canvas.style.width = state.w + 'px';
      canvas.style.height = state.h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onResize && onResize(state.w, state.h);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    resize();
    return { canvas, ctx, state };
  };

  UK.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  UK.starPath = function (ctx, cx, cy, r, spikes = 5) {
    const inner = r * 0.45;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 ? inner : r;
      const a = (Math.PI / spikes) * i - Math.PI / 2;
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
  };

  // twinkling background star field (rebuilt on size change)
  let field = null, fw = 0, fh = 0;
  UK.drawSky = function (ctx, w, h, t) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, UK.C.skyTop);
    g.addColorStop(0.55, UK.C.skyMid);
    g.addColorStop(1, UK.C.skyGlow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (!field || fw !== w || fh !== h) {
      fw = w; fh = h;
      field = Array.from({ length: 90 }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.7,
        r: Math.random() * 1.8 + 0.5, p: Math.random() * 6,
      }));
    }
    ctx.fillStyle = '#fff3fb';
    for (const s of field) {
      ctx.globalAlpha = 0.35 + 0.5 * Math.sin(t * 2 + s.p);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // bloomable tree: bloom 0 = bare, 1 = full blossom. s = overall scale (px).
  UK.drawTree = function (ctx, x, y, s, bloom) {
    ctx.save();
    ctx.translate(x, y);
    // trunk
    ctx.fillStyle = '#6b4a63';
    UK.roundRect(ctx, -s * 0.09, -s * 0.5, s * 0.18, s * 0.55, s * 0.06);
    ctx.fill();
    // canopy colour shifts from dull to minty
    const bare = '#5d5570', lush = UK.C.mint;
    ctx.fillStyle = bloom > 0.02 ? UK.mix(bare, lush, bloom) : bare;
    for (const [dx, dy, rr] of [[0, -0.78, 0.34], [-0.26, -0.62, 0.26], [0.26, -0.62, 0.26]]) {
      ctx.beginPath(); ctx.arc(dx * s, dy * s, rr * s, 0, 7); ctx.fill();
    }
    // blossoms + sparkle as it blooms
    if (bloom > 0.05) {
      ctx.globalAlpha = bloom;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 7 + 1;
        const bx = Math.cos(a) * s * 0.34, by = -0.7 * s + Math.sin(a) * s * 0.26;
        ctx.fillStyle = i % 2 ? UK.C.pink : UK.C.gold;
        ctx.beginPath(); ctx.arc(bx, by, s * 0.055, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // blend two hex colours (t 0..1)
  UK.mix = function (a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(UK.lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
    const g = Math.round(UK.lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
    const bl = Math.round(UK.lerp(pa & 255, pb & 255, t));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  };

  // simple particle system (sparkle bursts)
  UK.Particles = function () {
    const ps = [];
    return {
      burst(x, y, colors, n = 20, spread = 3, life = 0.8) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 7, sp = UK.rand(40, 40 + spread * 60);
          ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
            life, max: life, r: UK.rand(2, 5), c: colors[(Math.random() * colors.length) | 0] });
        }
      },
      update(dt) {
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i];
          p.life -= dt; if (p.life <= 0) { ps.splice(i, 1); continue; }
          p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        }
      },
      draw(ctx) {
        for (const p of ps) {
          ctx.globalAlpha = Math.max(0, p.life / p.max);
          ctx.fillStyle = p.c;
          UK.starPath(ctx, p.x, p.y, p.r, 5); ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
      get count() { return ps.length; },
    };
  };
})();
