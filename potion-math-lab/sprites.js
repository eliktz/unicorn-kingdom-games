/* sprites.js — procedural canvas sprites for the potion lab: cauldron, numbered
   ingredient bottles, and a small Astra mascot. All original, DESIGN.md palette. */
(function () {
  const UK = (window.UK = window.UK || {});
  const C = UK.C;

  // cauldron: rounded dark pot on little legs, with a glowing liquid surface.
  // fill 0..1 = how full; color = liquid hex; t = time for bubbles/shimmer.
  UK.drawCauldron = function (ctx, cx, cy, s, fill, color, t) {
    ctx.save();
    ctx.translate(cx, cy);
    const rw = s, rh = s * 0.78;
    // soft glow under the rim
    ctx.save();
    ctx.globalAlpha = 0.5;
    const gg = ctx.createRadialGradient(0, -rh * 0.1, 2, 0, -rh * 0.1, rw * 1.1);
    gg.addColorStop(0, color); gg.addColorStop(1, 'rgba(255,195,227,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, -rh * 0.1, rw * 1.1, 0, 7); ctx.fill();
    ctx.restore();
    // legs
    ctx.fillStyle = '#2a1c42';
    for (const lx of [-rw * 0.55, rw * 0.55]) { UK.roundRect(ctx, lx - s * 0.06, rh * 0.42, s * 0.12, s * 0.28, s * 0.05); ctx.fill(); }
    // body
    const body = ctx.createLinearGradient(0, -rh * 0.5, 0, rh * 0.6);
    body.addColorStop(0, '#4a3568'); body.addColorStop(1, '#241636');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    // liquid surface (an ellipse clipped to the pot mouth)
    const mouthY = -rh * 0.34;
    const surfY = mouthY + (1 - fill) * rh * 0.5;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, rw * 0.96, rh * 0.58, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(-rw, surfY, rw * 2, rh * 2);
    // bubbles
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 6; i++) {
      const bx = Math.sin(t * 1.3 + i * 2.1) * rw * 0.6;
      const by = surfY + ((t * 20 + i * 37) % (rh * 0.9));
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 3 + i);
      ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 3), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // rim
    ctx.strokeStyle = C.silver; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.ellipse(0, mouthY, rw * 0.98, rh * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
    // surface shimmer line
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, surfY, rw * 0.8, rh * 0.16, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
  };

  // ingredient bottle with a cork, coloured potion, a star, and a big number.
  // opts: {held, glow} — held lifts it, glow outlines a hinted choice.
  UK.drawBottle = function (ctx, x, y, s, label, color, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (opts.glow) {
      ctx.save(); ctx.globalAlpha = 0.55 + 0.25 * Math.sin((opts.t || 0) * 5);
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, 7); ctx.fill(); ctx.restore();
    }
    const w = s * 0.86, h = s * 1.3;
    // neck + cork
    ctx.fillStyle = '#b98a63';
    UK.roundRect(ctx, -w * 0.18, -h * 0.62, w * 0.36, h * 0.18, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    UK.roundRect(ctx, -w * 0.12, -h * 0.5, w * 0.24, h * 0.12, 3); ctx.fill();
    // glass body
    const gb = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    gb.addColorStop(0, 'rgba(255,255,255,.25)'); gb.addColorStop(0.5, color); gb.addColorStop(1, 'rgba(40,20,60,.35)');
    ctx.fillStyle = gb;
    UK.roundRect(ctx, -w / 2, -h * 0.4, w, h * 0.8, w * 0.42); ctx.fill();
    ctx.strokeStyle = C.silver; ctx.lineWidth = 3;
    UK.roundRect(ctx, -w / 2, -h * 0.4, w, h * 0.8, w * 0.42); ctx.stroke();
    // highlight
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    UK.roundRect(ctx, -w * 0.3, -h * 0.28, w * 0.16, h * 0.5, w * 0.08); ctx.fill();
    // little star
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    UK.starPath(ctx, w * 0.12, -h * 0.05, s * 0.11, 5); ctx.fill();
    // number label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(s * 0.62)}px Rubik, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = C.ink; ctx.shadowBlur = 6;
    ctx.fillText(String(label), 0, h * 0.12);
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // tiny Astra mascot (head) who nods when happy. mood>0 = cheering tilt.
  UK.drawAstra = function (ctx, x, y, s, t, mood) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * (mood > 0 ? 8 : 1.5)) * (mood > 0 ? 0.18 : 0.05));
    // mane puff behind
    ctx.fillStyle = C.lilac;
    ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.1, s * 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = C.pink;
    ctx.beginPath(); ctx.arc(-s * 0.4, s * 0.2, s * 0.35, 0, 7); ctx.fill();
    // head
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.7, 0, 0, 7); ctx.fill();
    // muzzle
    ctx.beginPath(); ctx.ellipse(s * 0.28, s * 0.3, s * 0.34, s * 0.3, 0, 0, 7); ctx.fill();
    // ear
    ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.5); ctx.lineTo(-s * 0.05, -s * 0.9); ctx.lineTo(s * 0.12, -s * 0.5); ctx.fill();
    // horn
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.moveTo(s * 0.18, -s * 0.55); ctx.lineTo(s * 0.34, -s * 1.05); ctx.lineTo(s * 0.4, -s * 0.5); ctx.fill();
    // eye
    ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.arc(s * 0.12, s * 0.02, s * 0.09, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.15, -s * 0.01, s * 0.03, 0, 7); ctx.fill();
    // star speckle
    ctx.fillStyle = C.lilac;
    UK.starPath(ctx, -s * 0.15, s * 0.25, s * 0.08, 5); ctx.fill();
    ctx.restore();
  };
})();
