// Generates PNG Home Screen icons from a canvas (unicorn on the games' dreamy pastel sky).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const root = path.resolve(__dirname, '..');
  const jobs = [[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']];
  for (const [size, file] of jobs) {
    const dataUrl = await page.evaluate((S) => {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(S * 0.5, S * 1.15, 0, S * 0.5, S * 1.15, S * 1.25);
      grad.addColorStop(0, '#ffc3e3');
      grad.addColorStop(0.3, '#ff8fc8');
      grad.addColorStop(0.62, '#7d5aa8');
      grad.addColorStop(1, '#3a2766');
      g.fillStyle = grad;
      g.fillRect(0, 0, S, S);
      // sparkle stars
      g.fillStyle = '#fff3fb';
      for (let i = 0; i < 42; i++) {
        const x = (Math.sin(i * 12.9) * 0.5 + 0.5) * S;
        const y = (Math.sin(i * 78.2) * 0.5 + 0.5) * S * 0.72;
        const r = (Math.sin(i * 3.3) * 0.5 + 0.5) * S * 0.006 + S * 0.004;
        g.globalAlpha = 0.4 + 0.6 * (Math.sin(i * 5.1) * 0.5 + 0.5);
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      // soft moon
      g.fillStyle = 'rgba(255,240,216,0.95)';
      g.beginPath(); g.arc(S * 0.76, S * 0.24, S * 0.10, 0, 7); g.fill();
      // unicorn emoji
      g.font = `${Math.round(S * 0.58)}px "Apple Color Emoji","Noto Color Emoji",sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('🦄', S * 0.5, S * 0.56);
      return c.toDataURL('image/png');
    }, size);
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(root, file), Buffer.from(b64, 'base64'));
    console.log('wrote', file, size);
  }
  await browser.close();
})();
