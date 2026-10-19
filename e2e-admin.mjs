// E2E مؤقت (يُحذف بعد التشغيل) — مركز التحكم، الجلسات، الإرسال الجماعي،
// الدخول بالبريد/الجوال عبر رمز التحقق، ولوحتا المعلم والطالب.
import puppeteer from 'puppeteer-core';

const BASE = process.env.E2E_BASE || 'http://localhost:12000/';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium', headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.on('pageerror', (e) => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
await page.evaluateOnNewDocument(() => { window.open = () => null; });

const hasText = (t) => page.evaluate((x) => document.body.innerText.includes(x), t);
const body = () => page.$eval('body', (e) => e.innerText);

// ينقر أول عنصر (زر/رابط/عنصر تنقّل) نصّه يطابق بدقة (اختياري: يحتوي)
const clickEl = (text, { exact = false, tag = 'button, a, [role="button"], .nav-item' } = {}) =>
  page.evaluate((t, ex, tg) => {
    const els = [...document.querySelectorAll(tg)].filter((e) => !e.closest('aside'));
    const el = els.find((e) => { const s = (e.textContent || '').trim(); return ex ? s === t : s.includes(t); });
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  }, text, exact, tag);
const fill = async (selector, value, index = 0, root = '') => {
  const els = await page.$$(root ? `${root} ${selector}` : selector);
  if (!els[index]) return false;
  await els[index].click({ clickCount: 3 });
  await els[index].type(value);
  return true;
};
const openMenu = async () => { await page.evaluate(() => { const b = document.querySelector('button[aria-label="القائمة"]'); if (b) b.click(); }); await sleep(350); };
const closeMenu = async () => { await page.evaluate(() => { const b = document.querySelector('button[aria-label="إغلاق القائمة"]'); if (b) b.click(); }); await sleep(300); };
const clickNav = (name) => page.evaluate((t) => {
  const els = [...document.querySelectorAll('aside .nav-item')];
  const el = els.find((e) => (e.textContent || '').trim() === t);
  if (!el) return false; el.click(); return true;
}, name);
const goto = async (name) => { await openMenu(); await clickNav(name); await sleep(450); };
const finishOnboarding = async () => {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('ابدأ استخدام المنصة')); if (b) b.click(); });
  await sleep(800);
};

const freshLogin = async (user, pin) => {
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(500);
  await clickEl('ابدأ'); await sleep(500);
  await fill('input.input', user, 0);
  await fill('input.input', pin, 1);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === 'دخول'); if (b) b.click(); });
  await sleep(800);
  // قد يظهر نموذج الإعداد الأولي (Onboarding) عند أول دخول
  await finishOnboarding();
};

console.log('\n== 1) دخول المالك ولوحة المالك ==');
await freshLogin('safwt', 'safwt');
ok(await hasText('لوحة التحكم'), 'دخل المالك وظهرت لوحة التحكم');
ok(await hasText('مالك المنصة'), 'يظهر دور مالك المنصة');

console.log('\n== 2) قائمة المالك تتضمن مجموعة الإدارة ==');
await openMenu();
ok(await hasText('مركز التحكم'), 'ظهور «مركز التحكم»');
ok(await hasText('الجلسات والنشاط'), 'ظهور «الجلسات والنشاط»');
ok(await hasText('الإرسال الجماعي'), 'ظهور «الإرسال الجماعي»');
await closeMenu();
await sleep(300);

console.log('\n== 3) مركز التحكم: نظرة عامة + إضافة صف ==');
await goto('مركز التحكم');
ok(await hasText('أنواع المحتوى'), 'عرض نظرة عامة للمركز');
ok(await clickEl('الصفوف'), 'فتح نوع «الصفوف»');
await sleep(400);
ok(await clickEl('إضافة', { exact: true }), 'فتح نموذج الإضافة');
await sleep(400);
await fill('input.input', 'صف السادس أ', 0, '.fixed');
await clickEl('حفظ', { exact: true });
await sleep(600);
ok(await hasText('صف السادس أ'), 'ظهر الصف المُضاف في القائمة');
ok(await hasText('حُدِّد') === false, 'لا تحديد افتراضي');

console.log('\n== 4) الجلسات والنشاط ==');
await goto('الجلسات والنشاط');
ok(await hasText('حالة المستخدمين'), 'عرض حالة المستخدمين');
ok(await hasText('مستخدمون الآن'), 'إحصاء المستخدمين النشطين');
ok(await hasText('يستخدم الآن') || await hasText('آخر ظهور'), 'عرض الصفحة/آخر ظهور');
ok((await body()).includes('مركز التحكم') || (await body()).includes('لوحة التحكم'), 'تسجيل الصفحة الحالية');

console.log('\n== 5) الإرسال الجماعي ==');
await goto('الإرسال الجماعي');
await fill('input.input', 'اختبار إعلان', 0);
await fill('textarea.input', 'هذه رسالة اختبار للمعلمين', 0);
await clickEl('إرسال الآن', { exact: true });
await sleep(600);
ok(await hasText('اختبار إعلان'), 'ظهر الإعلان المُرسل');
ok(await hasText('المستلمون'), 'عرض قائمة المستلمين');

console.log('\n== 6) إنشاء حساب طالب ==');
await page.goto(BASE, { waitUntil: 'networkidle2' });
// نُبقي الإعداد الأولي (setupDone) ونمسح الجلسة فقط
await page.evaluate(() => { sessionStorage.clear(); });
await page.reload({ waitUntil: 'networkidle2' }); await sleep(600);
await clickEl('ابدأ'); await sleep(500);
await clickEl('جديد؟ أنشئ حساب معلم أو طالب'); await sleep(500);
await clickEl('طالب', { exact: true }); await sleep(400);
await fill('input.input', 'سالم أحمد', 0);
await fill('input.input', 'salem', 1);
await fill('input.input', 'الصف السادس', 2);
await fill('input.input', 'salem@test.com', 3);
await fill('input.input', '0771234567', 4);
await fill('input.input', '1234', 5);
await fill('input.input', '1234', 6);
await clickEl('إنشاء حساب', { exact: true }); await sleep(900);
ok(await hasText('لوحة الطالب'), 'دخل الطالب وظهرت لوحة الطالب');
ok(await hasText('صفّي'), 'لوحة الطالب تعرض اختيار الصف');

console.log('\n== 7) قائمة الطالب مقيّدة ==');
await openMenu();
ok(await hasText('الدرس الصوتي'), 'الطالب يرى «الدرس الصوتي»');
ok(!(await hasText('مركز التحكم')), 'الطالب لا يرى «مركز التحكم»');
ok(!(await hasText('المستخدمون والصلاحيات')), 'الطالب لا يرى إدارة المستخدمين');
await closeMenu();
await sleep(300);

console.log('\n== 8) دخول الطالب برمز التحقق (البريد) ==');
await page.evaluate(() => { sessionStorage.removeItem('smart_teacher_v1:auth_session'); });
await page.reload({ waitUntil: 'networkidle2' }); await sleep(800);
await clickEl('ابدأ'); await sleep(500);
ok(await clickEl('الدخول برمز تحقق'), 'فتح شاشة الدخول برمز التحقق');
await sleep(400);
await fill('input.input', 'salem@test.com', 0);
await clickEl('إرسال رمز التحقق'); await sleep(600);
ok(await hasText('أدخل رمز التحقق'), 'ظهر حقل إدخال الرمز');
const code = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((d) => /^\d{6}$/.test((d.textContent || '').trim()));
  return el ? el.textContent.trim() : '';
});
ok(/^\d{6}$/.test(code), 'عرض رمز التحقق للتسليم اليدوي: ' + code);
await fill('input.input', code, 0);
await clickEl('دخول', { exact: true }); await sleep(900);
ok(await hasText('لوحة الطالب'), 'دخل الطالب برمز التحقق عبر البريد');

console.log('\n== 9) توثيق الحساب من الملف الشخصي ==');
await goto('الملف الشخصي');
ok(await hasText('توثيق الحساب'), 'بطاقة «توثيق الحساب» ظاهرة');

console.log(`\nE2E: ${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
