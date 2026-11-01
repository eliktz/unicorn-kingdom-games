/* math.js — adaptive problem generator for the potion lab.
   Covers adding/subtracting within 20 and times tables of 2,3,4,5,10.
   Each problem = an equation; the child drags the bottle with the right answer.
   No fail state: wrong picks just lower the level a touch and surface a hint. */
(function () {
  const UK = (window.UK = window.UK || {});

  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[ri(0, arr.length - 1)];
  const TABLES = [2, 3, 4, 5, 10];

  // levels ramp from easy adds to the full mix. level is a float 0..6.
  function makeProblem(level) {
    const L = Math.max(0, Math.min(6, level));
    const roll = Math.random();
    let a, b, op, answer;
    if (L < 1.5) {                 // add within 10
      a = ri(1, 6); b = ri(1, Math.max(1, 9 - a)); op = '+';
    } else if (L < 3) {            // add/sub within 20
      if (roll < 0.5) { a = ri(3, 14); b = ri(2, 20 - a); op = '+'; }
      else { a = ri(6, 20); b = ri(1, a - 1); op = '−'; }
    } else if (L < 4.5) {          // mix in easy tables (2,5,10)
      if (roll < 0.4) { a = ri(5, 20); b = ri(1, a - 1); op = '−'; }
      else if (roll < 0.7) { a = ri(4, 12); b = ri(2, 20 - a); op = '+'; }
      else { a = pick([2, 5, 10]); b = ri(1, 10); op = '×'; }
    } else {                        // full mix incl. 3,4 tables
      if (roll < 0.25) { a = ri(8, 20); b = ri(2, a - 1); op = '−'; }
      else if (roll < 0.45) { a = ri(6, 14); b = ri(3, 20 - a); op = '+'; }
      else { a = pick(TABLES); b = ri(2, 10); op = '×'; }
    }
    if (op === '+') answer = a + b;
    else if (op === '−') answer = a - b;
    else answer = a * b;
    return { a, b, op, answer, text: `${a} ${op} ${b}` };
  }

  // 3 (easy) or 4 (harder) distinct answer options incl. the correct one.
  function makeOptions(answer, level) {
    const n = level < 2 ? 3 : 4;
    const span = level < 3 ? 3 : 6;
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < n && guard++ < 50) {
      let d = answer + ri(-span, span);
      if (d < 0) d = Math.abs(d) + 1;
      if (d !== answer) set.add(d);
    }
    const opts = [...set];
    // shuffle
    for (let i = opts.length - 1; i > 0; i--) { const j = ri(0, i); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return opts;
  }

  // hint spec the renderer turns into dots / groups / a number line.
  function hint(p) {
    if (p.op === '+') return { kind: 'groups', groups: [p.a, p.b], total: p.answer };
    if (p.op === '−') return { kind: 'takeaway', from: p.a, remove: p.b, left: p.answer };
    return { kind: 'array', rows: p.a, cols: p.b, total: p.answer };
  }

  // adaptive controller: nudges level up on success, gently down on misses.
  UK.mathEngine = function () {
    let level = 0.5, streak = 0;
    const state = { get level() { return level; }, problem: null, options: null };
    function next() {
      state.problem = makeProblem(level);
      state.options = makeOptions(state.problem.answer, level);
      state.hint = hint(state.problem);
      return state;
    }
    function correct() {
      streak++;
      level = Math.min(6, level + (streak >= 2 ? 0.55 : 0.35));
      return next();
    }
    function wrong() { streak = 0; level = Math.max(0, level - 0.4); }
    return { state, next, correct, wrong, get level() { return level; } };
  };
})();
