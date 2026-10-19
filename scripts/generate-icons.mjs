// يولّد أيقونات PWA المفقودة من الأيقونة المتجهية pwa-512.svg:
//   - public/pwa-maskable-512.png : أيقونة maskable بخلفية ممتدة وشعار داخل المنطقة الآمنة
//   - public/apple-touch-icon.png : أيقونة أيفون 180×180 بخلفية صلبة (بلا شفافية)
// الاستخدام: node scripts/generate-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'pwa-512.svg'), 'utf8');
const svgUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const BG = '#0f766e';

// أيقونة داخل حاوية بخلفية صلبة. الحجم = نسبة الشعار من الإطار (المنطقة الآمنة).
const page = (size, logoScale) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0}
  html,body{width:${size}px;height:${size}px;background:${BG}}
  .wrap{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center}
  img{width:${Math.round(size * logoScale)}px;height:${Math.round(size * logoScale)}px;display:block}
</style></head><body><div class="wrap"><img src="${svgUri}"></div></body></html>`;

const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: 'new', args: ['--no-sandbox'] });

async function render(out, size, logoScale) {
  const p = await browser.newPage();
  await p.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await p.setContent(page(size, logoScale), { waitUntil: 'load' });
  const buf = await p.screenshot({ type: 'png', omitBackground: false });
  writeFileSync(join(root, 'public', out), buf);
  await p.close();
  console.log(`✓ public/${out} — ${size}×${size}`);
}

// maskable: الشعار ~70% ليبقى داخل الدائرة الآمنة (80%) لأندرويد
await render('pwa-maskable-512.png', 512, 0.7);
// أيفون: 180×180 بخلفية صلبة
await render('apple-touch-icon.png', 180, 0.78);

await browser.close();
