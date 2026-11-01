/* ui.js — minimal Hebrew RTL overlay for the potion lab: start screen, trees-bloomed
   counter, mute, home, the recipe prompt, a hint button, and a celebration banner.
   Frosted lilac panels + silver borders (DESIGN.md), big iPad-friendly touch targets. */
(function () {
  const UK = (window.UK = window.UK || {});
  const sfx = UK.audio;

  UK.ui = function (opts) {
    const css = document.createElement('style');
    css.textContent = `
      html,body{margin:0;padding:0;width:100%;height:100%;height:100dvh;overflow:hidden;position:fixed;inset:0;background:#3a2766;font-family:'Rubik','Arial Hebrew','Heebo',system-ui,'Trebuchet MS',sans-serif;touch-action:none;overscroll-behavior:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
      canvas{display:block;touch-action:none}
      .uk-btn{position:fixed;top:calc(14px + env(safe-area-inset-top));width:72px;height:72px;border-radius:50%;border:4px solid #e8e6f5;background:rgba(70,45,110,.72);color:#fff;font-size:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;box-shadow:0 4px 16px rgba(60,30,90,.5),0 0 20px rgba(255,143,200,.3);-webkit-tap-highlight-color:transparent;touch-action:manipulation;text-decoration:none}
      .uk-btn:active{transform:scale(.92)}
      .uk-score{position:fixed;top:calc(14px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);padding:8px 26px;border-radius:40px;background:rgba(70,45,110,.72);border:4px solid #e8e6f5;color:#fff;font-size:40px;font-weight:bold;z-index:10;display:flex;gap:12px;align-items:center;text-shadow:0 2px 6px rgba(255,143,200,.6)}
      .uk-score .pop{display:inline-block;animation:ukPop .35s}
      @keyframes ukPop{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)}}
      .uk-recipe{position:fixed;top:calc(104px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);padding:12px 30px;border-radius:30px;background:rgba(70,45,110,.8);border:4px solid #c9a9f5;color:#fff;z-index:10;text-align:center;max-width:90vw;box-shadow:0 0 22px rgba(255,143,200,.3)}
      .uk-recipe .lbl{font-size:26px;opacity:.9}
      .uk-recipe .eq{font-size:min(14vw,72px);font-weight:bold;color:#ffe08a;direction:ltr;text-shadow:0 2px 0 #ff8fc8,0 0 20px rgba(255,224,138,.6)}
      .uk-recipe.wobble{animation:ukWob .4s}
      @keyframes ukWob{0%,100%{transform:translateX(-50%) rotate(0)}25%{transform:translateX(-50%) rotate(-2deg)}75%{transform:translateX(-50%) rotate(2deg)}}
      .uk-hintbtn{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom));left:calc(14px + env(safe-area-inset-left));padding:10px 22px;border-radius:40px;border:4px solid #e8e6f5;background:rgba(70,45,110,.72);color:#fff;font-size:30px;z-index:10;cursor:pointer;touch-action:manipulation;display:flex;align-items:center;gap:8px}
      .uk-hintbtn:active{transform:scale(.94)}
      .uk-start{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;background:radial-gradient(ellipse at center,rgba(125,90,168,.35),rgba(58,39,102,.82));color:#fff;text-align:center;cursor:pointer}
      .uk-title{font-size:min(9vw,62px);font-weight:bold;color:#fff;text-shadow:0 3px 0 #ff8fc8,0 0 30px rgba(201,169,245,.9);margin:0 16px 6px}
      .uk-play{width:150px;height:150px;border-radius:50%;background:linear-gradient(#ffd0ec,#ff8fc8);border:6px solid #e8e6f5;font-size:78px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 0 44px rgba(255,143,200,.85);animation:ukPulse 1.2s infinite;margin:18px}
      @keyframes ukPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      .uk-hint{font-size:36px;opacity:.95}
      .uk-banner{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%) scale(0);font-size:min(12vw,96px);z-index:15;pointer-events:none;transition:transform .35s cubic-bezier(.3,1.8,.5,1);text-shadow:0 0 30px #ff8fc8;color:#fff;text-align:center;font-weight:bold}
      .uk-banner.show{transform:translate(-50%,-50%) scale(1)}
    `;
    document.head.appendChild(css);

    // RTL: home top-right, mute top-left.
    const home = document.createElement('a');
    home.className = 'uk-btn';
    home.style.right = 'calc(14px + env(safe-area-inset-right))';
    home.href = opts.home || '../index.html';
    home.textContent = '🏡'; home.title = 'חזרה לתפריט';
    document.body.appendChild(home);

    const mute = document.createElement('div');
    mute.className = 'uk-btn';
    mute.style.left = 'calc(14px + env(safe-area-inset-left))';
    const setIcon = () => (mute.textContent = sfx.isMuted() ? '🔇' : '🔊');
    setIcon();
    mute.addEventListener('pointerdown', (e) => { e.stopPropagation(); sfx.init(); sfx.setMuted(!sfx.isMuted()); setIcon(); });
    document.body.appendChild(mute);

    const score = document.createElement('div');
    score.className = 'uk-score';
    score.innerHTML = `<span>🌳</span><span id="scoreNum">0</span><span style="opacity:.6;font-size:30px">/${opts.goal || 10}</span>`;
    document.body.appendChild(score);
    const num = score.querySelector('#scoreNum');

    const recipe = document.createElement('div');
    recipe.className = 'uk-recipe';
    recipe.innerHTML = `<div class="lbl">${opts.recipeLabel || 'כמה נצנוצים צריך?'}</div><div class="eq" id="eq"></div>`;
    document.body.appendChild(recipe);
    const eq = recipe.querySelector('#eq');

    const hintBtn = document.createElement('div');
    hintBtn.className = 'uk-hintbtn';
    hintBtn.innerHTML = '💡 <span>רמז</span>';
    hintBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); sfx.init(); opts.onHint && opts.onHint(); });
    document.body.appendChild(hintBtn);

    const banner = document.createElement('div');
    banner.className = 'uk-banner';
    document.body.appendChild(banner);

    const start = document.createElement('div');
    start.className = 'uk-start';
    start.innerHTML = `<div class="uk-title">${opts.title}</div><div class="uk-play">▶</div><div class="uk-hint">${opts.hint || ''}</div>`;
    document.body.appendChild(start);
    const begin = () => { sfx.init(); start.style.display = 'none'; opts.onStart && opts.onStart(); };
    start.addEventListener('pointerdown', (e) => { e.stopPropagation(); begin(); });
    window.addEventListener('keydown', (e) => { if (start.style.display !== 'none' && (e.key === 'Enter' || e.key === ' ')) begin(); });

    let bannerT = null;
    return {
      setScore(v) { num.textContent = v; num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); },
      setEquation(t) { eq.textContent = t; },
      wobble() { recipe.classList.remove('wobble'); void recipe.offsetWidth; recipe.classList.add('wobble'); },
      banner(text, ms = 1500) { banner.textContent = text; banner.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => banner.classList.remove('show'), ms); },
      started: () => start.style.display === 'none',
    };
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
