/* hint.js — gentle visual hints drawn on canvas: a group of dots for +, crossed-out
   dots for −, a neat array of dots for ×. Shown on a frosted panel above the cauldron. */
(function () {
  const UK = (window.UK = window.UK || {});
  const C = UK.C;

  // small glowing counting dot
  function dot(ctx, x, y, r, color, crossed) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, 7); ctx.fill();
    if (crossed) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.4;
      ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.stroke();
    }
  }

  // lay out n dots in rows of at most perRow, centred around (cx, top), return height used
  function row(ctx, cx, top, n, perRow, r, gap, color, crossedFrom) {
    const cols = Math.min(n, perRow);
    const rows = Math.ceil(n / perRow);
    const step = r * 2 + gap;
    for (let i = 0; i < n; i++) {
      const c = i % perRow, rr = (i / perRow) | 0;
      const rowN = Math.min(perRow, n - rr * perRow);
      const x = cx - ((rowN - 1) * step) / 2 + c * step;
      const y = top + r + rr * step;
      dot(ctx, x, y, r, color, crossedFrom != null && i >= crossedFrom);
    }
    return rows * step;
  }

  // spec comes from UK math hint(): {kind:'groups'|'takeaway'|'array', ...}
  UK.drawHint = function (ctx, cx, cy, s, spec, alpha) {
    if (!spec) return;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const r = Math.max(6, s * 0.09), gap = r * 0.9, perRow = 5;
    const w = s * 2.9, h = s * 1.7;
    // frosted panel
    ctx.fillStyle = 'rgba(70,45,110,.86)';
    UK.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, s * 0.18); ctx.fill();
    ctx.strokeStyle = C.lilac; ctx.lineWidth = 3;
    UK.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, s * 0.18); ctx.stroke();

    const top = cy - h / 2 + r + 6;
    if (spec.kind === 'groups') {
      // two colour groups side by side, then the total underneath
      const half = w * 0.25;
      row(ctx, cx - half, top, spec.groups[0], 4, r, gap, C.pink);
      row(ctx, cx + half, top, spec.groups[1], 4, r, gap, C.gold);
    } else if (spec.kind === 'takeaway') {
      row(ctx, cx, top, spec.from, perRow, r, gap, C.mint, spec.left);
    } else {
      // array: rows × cols grid
      const step = r * 2 + gap;
      const startX = cx - ((spec.cols - 1) * step) / 2;
      const startY = top;
      for (let ri = 0; ri < spec.rows; ri++)
        for (let ci = 0; ci < spec.cols; ci++)
          dot(ctx, startX + ci * step, startY + ri * step, r, ci % 2 ? C.lilac : C.pink);
    }
    ctx.restore();
  };
})();
