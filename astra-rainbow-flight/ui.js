/* ui.js — minimal Hebrew RTL overlay: start screen, star counter, mute, home, banner.
   Frosted lilac panels + silver borders (DESIGN.md), big iPad-friendly touch targets. */
(function () {
  const UK = (window.UK = window.UK || {});
  const sfx = UK.audio;

  UK.ui = function (opts) {
    const css = document.createElement('style');
    css.textContent = `
      html,body{margin:0;padding:0;width:100%;height:100%;height:100dvh;overflow:hidden;position:fixed;inset:0;background:#3a2766;font-family:'Rubik','Arial Hebrew','Heebo',system-ui,'Trebuchet MS',sans-serif;touch-action:none;overscroll-behavior:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
      canvas{display:block;touch-action:none}
      .uk-btn{position:fixed;top:calc(14px + env(safe-area-inset-top));width:72px;height:72px;border-radius:50%;border:4px solid #e8e6f5;background:rgba(70,45,110,.72);color:#fff;font-size:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;box-shadow:0 4px 16px rgba(60,30,90,.5),0 0 20px rgba(255,143,200,.3);-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      .uk-btn:active{transform:scale(.92)}
      .uk-score{position:fixed;top:calc(14px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);padding:8px 26px;border-radius:40px;background:rgba(70,45,110,.72);border:4px solid #e8e6f5;color:#fff;font-size:42px;font-weight:bold;z-index:10;display:flex;gap:14px;align-items:center;text-shadow:0 2px 6px rgba(255,143,200,.6)}
      .uk-score .pop{animation:ukPop .35s}
      @keyframes ukPop{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)}}
      .uk-start{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;background:radial-gradient(ellipse at center,rgba(125,90,168,.35),rgba(58,39,102,.78));color:#fff;text-align:center;cursor:pointer}
      .uk-title{font-size:min(9vw,66px);font-weight:bold;color:#fff;text-shadow:0 3px 0 #ff8fc8,0 0 30px rgba(201,169,245,.9);margin:0 16px 6px}
      .uk-play{width:150px;height:150px;border-radius:50%;background:linear-gradient(#ffd0ec,#ff8fc8);border:6px solid #e8e6f5;font-size:78px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 0 44px rgba(255,143,200,.85);animation:ukPulse 1.2s infinite;margin:18px}
      @keyframes ukPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      .uk-hint{font-size:38px;opacity:.95;letter-spacing:6px}
      .uk-banner{position:fixed;left:50%;top:40%;transform:translate(-50%,-50%) scale(0);font-size:min(13vw,110px);z-index:15;pointer-events:none;transition:transform .35s cubic-bezier(.3,1.8,.5,1);text-shadow:0 0 30px #ff8fc8;color:#fff;text-align:center;font-weight:bold}
      .uk-banner.show{transform:translate(-50%,-50%) scale(1)}
    `;
    document.head.appendChild(css);

    // RTL: home/back top-right (start of a Hebrew line), mute top-left.
    const home = document.createElement('a');
    home.className = 'uk-btn';
    home.style.right = 'calc(14px + env(safe-area-inset-right))';
    home.href = opts.home || '../index.html';
    home.textContent = '🏡';
    home.title = 'חזרה לתפריט';
    home.style.textDecoration = 'none';
    document.body.appendChild(home);

    const mute = document.createElement('div');
    mute.className = 'uk-btn';
    mute.style.left = 'calc(14px + env(safe-area-inset-left))';
    mute.id = 'muteBtn';
    const setIcon = () => (mute.textContent = sfx.isMuted() ? '🔇' : '🔊');
    setIcon();
    mute.addEventListener('pointerdown', (e) => { e.stopPropagation(); sfx.init(); sfx.setMuted(!sfx.isMuted()); setIcon(); });
    document.body.appendChild(mute);

    const score = document.createElement('div');
    score.className = 'uk-score';
    score.innerHTML = `<span>${opts.icon || '⭐'}</span><span id="scoreNum">0</span>`;
    document.body.appendChild(score);
    const num = score.querySelector('#scoreNum');

    const banner = document.createElement('div');
    banner.className = 'uk-banner';
    document.body.appendChild(banner);

    const start = document.createElement('div');
    start.className = 'uk-start';
    start.id = 'startScreen';
    start.innerHTML = `<div class="uk-title">${opts.title}</div><div class="uk-play">▶</div><div class="uk-hint">${opts.hint || ''}</div>`;
    document.body.appendChild(start);
    const begin = () => { sfx.init(); start.style.display = 'none'; opts.onStart && opts.onStart(); };
    start.addEventListener('pointerdown', (e) => { e.stopPropagation(); begin(); });
    window.addEventListener('keydown', (e) => { if (start.style.display !== 'none' && (e.key === 'Enter' || e.key === ' ')) begin(); });

    let bannerT = null;
    return {
      setScore(v) { num.textContent = v; num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); },
      banner(text, ms = 1600) { banner.textContent = text; banner.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => banner.classList.remove('show'), ms); },
      started: () => start.style.display === 'none',
    };
  };

  /* input: pointer + keyboard, same shape the games expect */
  UK.input = function () {
    const keys = {};
    const st = { keys, pointer: null, down: false };
    window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); });
    window.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));
    const set = (e) => (st.pointer = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1, px: e.clientX, py: e.clientY });
    window.addEventListener('pointerdown', (e) => { st.down = true; set(e); });
    window.addEventListener('pointermove', (e) => { if (st.down || e.pointerType === 'mouse') set(e); });
    window.addEventListener('pointerup', () => (st.down = false));
    window.addEventListener('pointercancel', () => (st.down = false));
    st.axis = function () {
      let x = 0, y = 0;
      if (keys['arrowleft'] || keys['a']) x -= 1;
      if (keys['arrowright'] || keys['d']) x += 1;
      if (keys['arrowup'] || keys['w']) y += 1;
      if (keys['arrowdown'] || keys['s']) y -= 1;
      return { x, y, any: x !== 0 || y !== 0 };
    };
    return st;
  };

  // project a normalized-device pointer onto the z = planeZ plane
  UK.pointerToPlane = function (camera, p, planeZ = 0) {
    const v = new THREE.Vector3(p.x, p.y, 0.5).unproject(camera);
    const dir = v.sub(camera.position).normalize();
    const t = (planeZ - camera.position.z) / dir.z;
    return camera.position.clone().addScaledVector(dir, t);
  };

  // viewport helpers for framing
  UK.isPortrait = function () { const { w, h } = UK.viewport(); return h >= w; };
  UK.fitDistance = function (fov, halfW, halfH) {
    const { w, h } = UK.viewport();
    const vfov = (fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (w / h));
    return Math.max(halfH / Math.tan(vfov / 2), halfW / Math.tan(hfov / 2));
  };

  /* iPad / touch hardening — behave like a native fullscreen game in Safari */
  UK.lockTouch = function () {
    const stop = (e) => e.preventDefault();
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => document.addEventListener(ev, stop, { passive: false }));
    document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 || e.cancelable) e.preventDefault(); }, { passive: false });
    let lastTouch = 0;
    document.addEventListener('touchend', (e) => { const now = e.timeStamp || performance.now(); if (now - lastTouch < 350) e.preventDefault(); lastTouch = now; }, { passive: false });
    document.addEventListener('dblclick', stop, { passive: false });
    document.addEventListener('contextmenu', stop);
  };
  if (document.readyState !== 'loading') UK.lockTouch();
  else document.addEventListener('DOMContentLoaded', UK.lockTouch);

  window.__ukErrors = [];
  window.addEventListener('error', (e) => window.__ukErrors.push(String(e.message)));
})();
