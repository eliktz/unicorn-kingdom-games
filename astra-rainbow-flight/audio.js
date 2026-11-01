/* audio.js — procedural WebAudio sfx + gentle music box, with mute + iOS unlock.
   Plus an optional spoken Hebrew cheer. All of it no-ops cleanly when muted/unsupported. */
(function () {
  const UK = (window.UK = window.UK || {});
  const sfx = (UK.audio = {});
  let ctx = null, master = null;
  let muted = localStorage.getItem('ukMuted') === '1';

  function kick() {
    try { const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0); } catch (e) { /* ignore */ }
  }
  sfx.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      kick();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
  };
  sfx.setMuted = function (m) { muted = m; localStorage.setItem('ukMuted', m ? '1' : '0'); if (master) master.gain.value = m ? 0 : 0.5; };
  sfx.isMuted = () => muted;

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ctx || muted) return;
    type = type || 'sine'; vol = vol == null ? 0.3 : vol; when = when || 0;
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, when, freq, q, type) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + (when || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 800; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }

  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
  let chimeIdx = 0;
  sfx.chime = function () { const f = PENTA[chimeIdx % PENTA.length]; chimeIdx++; tone(f, 0.35, 'triangle', 0.24); tone(f * 2, 0.22, 'sine', 0.07, 0.04); };
  sfx.resetChime = () => (chimeIdx = 0);
  sfx.sparkle = function () { for (let i = 0; i < 4; i++) tone(1300 + Math.random() * 1300, 0.14, 'sine', 0.05, i * 0.05); };
  sfx.pop = function () { tone(520, 0.12, 'sine', 0.26, 0, 1100); };
  sfx.whoosh = function () { noise(0.4, 0.1, 0, 1100, 0.5); };
  sfx.sneeze = function () { noise(0.18, 0.12, 0, 900, 0.8); tone(380, 0.3, 'sine', 0.12, 0.12, 180); };
  sfx.cloud = function () { tone(300, 0.4, 'sine', 0.14, 0, 460); sfx.sparkle(); };
  sfx.bloom = function () {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, i) => { tone(n, 0.3, 'triangle', 0.2, i * 0.09); tone(n / 2, 0.3, 'sine', 0.08, i * 0.09); });
  };
  sfx.fanfare = function () {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5], times = [0, 0.12, 0.24, 0.38, 0.6, 0.74];
    notes.forEach((n, i) => { tone(n, i === 5 ? 0.7 : 0.2, 'triangle', 0.22, times[i]); tone(n / 2, 0.2, 'sine', 0.09, times[i]); });
  };

  let musicTimer = null;
  sfx.music = function (on) {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (on === false) return;
    const melody = [659, 0, 784, 880, 784, 659, 0, 587, 659, 0, 523, 587, 659, 0, 494, 0];
    const bass = [220, 262, 247, 196];
    let i = 0;
    musicTimer = setInterval(() => {
      const n = melody[i % melody.length];
      if (n) { tone(n, 0.5, 'sine', 0.045); tone(n * 2, 0.3, 'triangle', 0.012); }
      if (i % 4 === 0) tone(bass[Math.floor(i / 4) % 4], 1.0, 'sine', 0.05);
      i++;
    }, 340);
  };

  // spoken Hebrew cheer — graceful no-op without a Hebrew voice
  let heVoices = [];
  const loadVoices = () => { try { heVoices = window.speechSynthesis.getVoices() || []; } catch (e) { /* ignore */ } };
  if ('speechSynthesis' in window) { loadVoices(); try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { /* ignore */ } }
  const CHEERS = ['כל הכבוד!', 'מעולה!', 'וואו!', 'יש!', 'איזה יופי!', 'מהמם!'];
  let lastCheer = 0;
  sfx.cheer = function (text) {
    if (muted || !('speechSynthesis' in window)) return;
    const now = (window.performance && performance.now()) || 0;
    if (now - lastCheer < 1200) return; lastCheer = now;
    try {
      const phrases = Array.isArray(text) ? text : (text ? [text] : CHEERS);
      const u = new SpeechSynthesisUtterance(phrases[(Math.random() * phrases.length) | 0]);
      u.lang = 'he-IL'; u.rate = 1.0; u.pitch = 1.3; u.volume = 0.9;
      if (!heVoices.length) loadVoices();
      const v = heVoices.find((x) => /he([-_]|$)/i.test(x.lang)) || heVoices.find((x) => /iw/i.test(x.lang));
      if (v) u.voice = v;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { /* unsupported */ }
  };

  // resume audio on first gesture + when returning to foreground
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, sfx.init, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sfx.init(); });
})();
