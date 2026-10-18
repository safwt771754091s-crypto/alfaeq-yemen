// استخراج نصّ كتب المنهج (PDF) داخل المتصفح باستخدام pdf.js — بلا سيرفر وبلا إنترنت بعد التحميل.
// المنهج اليمني الرسمي (عدن) غالباً نسخ مصوّرة (صور) بلا طبقة نصّية مقروءة،
// لذلك نعتمد على pdf.js للنصّ إن وُجد، مع تنبيه المستخدم عند الحاجة إلى OCR خارجي.

import * as pdfjs from 'pdfjs-dist';

export const extractor = pdfjs;

// يُضبط مصدر عامل pdf.js من الوحدة المخصّصة للمتصفح (pdfWorker.js) قبل الاستخراج.
export function configurePdfWorker(src) {
  pdfjs.GlobalWorkerOptions.workerSrc = src;
}

const BIDI_MARKS = /[\u200B\u200E\u200F\uFEFF]/g;

// تنظيف النصّ العربي: إزالة محارف الاتجاه، وتوحيد المسافات والأسطر.
export function normalizeArabic(text) {
  let t = String(text ?? '');
  t = t.replace(BIDI_MARKS, '');
  // محارف بديلة (U+FFFD) تنتج عن خطوط قديمة ناقصة الخريطة — إزالتها تُصلح الكلمة.
  t = t.replace(/\uFFFD/g, '');
  t = t.replace(/[ \t\u00A0]+/g, ' ');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

// هل النصّ مقروء فعلاً (حروف عربية/لاتينية) أم «طلاسم» ناتجة عن خطوط قديمة معطوبة؟
export function looksReadable(text) {
  const t = String(text ?? '').trim();
  if (t.length < 2) return false;

  // صفحة مصوّرة قد تحمل تذييلاً فقط (رابط/بريد) — ليس محتوى.
  if (/(https?:\/\/|www\.|t\.me\/|\S+@\S+|\.ye\b)/i.test(t)) {
    const stripped = t.replace(/(https?:\/\/\S+|www\.\S+|t\.me\/\S+|\S+@\S+)/gi, ' ').replace(/[+\d\s\-_.|،؛:]+/g, ' ');
    if (stripped.trim().length < 10) return false;
  }

  const meaningful = (t.match(/[\u0600-\u06FFa-z0-9]/g) || []).length;
  return meaningful / t.length >= 0.35;
}

// نصّ صفحة واحدة من كائن PDFPageProxy.
// نجمّع العناصر في أسطر حسب الموضع العمودي، ونفصل الأجزاء المتباعدة أفقياً
// (عنوان في وسط السطر، عمودان) حتى لا يلتصق العنوان بالمتن.
async function pageText(page) {
  const tc = await page.getTextContent();
  const items = tc.items.filter((it) => it.str && it.str.trim());
  if (!items.length) return '';

  const lines = new Map();
  for (const it of items) {
    const y = Math.round((it.transform ? it.transform[5] : 0) / 3) * 3;
    if (!lines.has(y)) lines.set(y, []);
    lines.get(y).push(it);
  }

  const out = [];
  for (const [, arr] of [...lines.entries()].sort((a, b) => b[0] - a[0])) {
    let seg = '';
    let prevEnd = null;
    for (const it of arr) {
      const x = it.transform ? it.transform[4] : 0;
      const w = it.width || 0;
      const size = Math.abs(it.transform ? it.transform[3] : 12) || 12;
      const gap = prevEnd === null ? 0 : x - prevEnd;
      if (prevEnd !== null && gap > Math.max(12, size * 1.4)) {
        if (seg.trim()) out.push(seg.trim());
        seg = '';
      }
      seg += it.str;
      prevEnd = x + w;
    }
    if (seg.trim()) out.push(seg.trim());
  }
  return normalizeArabic(out.join('\n'));
}

/**
 * استخراج صفحات ملف PDF. يقبل ArrayBuffer أو Uint8Array.
 * يُرجع { pages: [{page, text}], pageCount, readable, mojibake }.
 * onProgress(page, pageCount) لشريط التقدّم.
 */
export async function extractPdf(data, { onProgress, maxPages = 0 } = {}) {
  const task = pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false });
  const doc = await task.promise;
  const pageCount = doc.numPages;
  const limit = maxPages > 0 ? Math.min(maxPages, pageCount) : pageCount;

  const pages = [];
  let readable = 0;
  for (let n = 1; n <= limit; n++) {
    const page = await doc.getPage(n);
    const text = await pageText(page);
    if (looksReadable(text)) readable++;
    pages.push({ page: n, text });
    if (onProgress && (n % 5 === 0 || n === limit)) onProgress(n, limit);
  }

  // الطبقة النصّية معطوبة إذا كان أغلب الصفحات غير مقروء (خطوط قديمة بلا خريطة محارف).
  const mojibake = readable < Math.max(1, Math.floor(limit * 0.5));
  return { pages, pageCount, readable, mojibake, extracted: limit };
}

export async function pdfOutline(data) {
  try {
    const doc = await pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;
    return (await doc.getOutline()) || [];
  } catch {
    return [];
  }
}
