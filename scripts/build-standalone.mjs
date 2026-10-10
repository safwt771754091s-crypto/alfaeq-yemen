// يحوّل مخرجات `vite build` (dist/) إلى ملف HTML واحد مكتفٍ بذاته،
// بحيث يعمل الموقع بمجرد فتحه على أي جهاز وهاتف — بدون سيرفر وبدون إنترنت.
// الاستخدام: node scripts/build-standalone.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const MIME = {
  woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf',
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
};

const dataUri = (path) => {
  const ext = path.split('.').pop().toLowerCase();
  return `data:${MIME[ext] || 'application/octet-stream'};base64,${readFileSync(path).toString('base64')}`;
};

// 1) الخطوط: نضمّن كل woff2 كـ data URI داخل CSS
let fontsCss = readFileSync(join(dist, 'fonts', 'fonts.css'), 'utf8');
fontsCss = fontsCss.replace(/url\(\.\/([^)]+\.(?:woff2?|ttf))\)/g, (m, file) => {
  const p = join(dist, 'fonts', file);
  return existsSync(p) ? `url(${dataUri(p)})` : m;
});

// 2) باقي CSS
const assetsDir = join(dist, 'assets');
const cssFile = readdirSync(assetsDir).find((f) => f.endsWith('.css'));
const jsFile = readdirSync(assetsDir).find((f) => f.endsWith('.js'));
if (!cssFile || !jsFile) throw new Error('لم أجد ملفات JS/CSS في dist/assets — شغّل npm run build أولاً');
let css = readFileSync(join(assetsDir, cssFile), 'utf8');

// 3) JS: نمنع إغلاق وسم السكربت داخل الكود
let js = readFileSync(join(assetsDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');

// 4) الأيقونة
const favicon = readFileSync(join(dist, 'favicon.svg'), 'utf8');
const faviconUri = 'data:image/svg+xml;base64,' + Buffer.from(favicon).toString('base64');

// 5) نبني ملف HTML واحد
const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="${faviconUri}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <meta name="theme-color" content="#0f766e" />
    <meta name="description" content="منصة المعلم الذكية — منصة رقمية متكاملة للمعلم اليمني: تحضير الدروس، العروض التقديمية، التصحيح الذكي، وسجلات الدرجات والحضور والشهادات. تعمل دون اتصال بالإنترنت." />
    <title>منصة المعلم الذكية | للمعلم اليمني</title>
    <style>${fontsCss}</style>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${js}</script>
  </body>
</html>
`;

const out = join(dist, 'standalone.html');
writeFileSync(out, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`✓ standalone.html — ${kb} ك.ب (ملف واحد مكتفٍ بذاته، يعمل دون إنترنت)`);
