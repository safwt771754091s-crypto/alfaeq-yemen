// تنسيق عملية الاستيراد: PDF → نصّ الصفحات → تقطيع إلى وحدات ودروس → حفظ محلي.
import { extractPdf, looksReadable } from './pdfExtract.js';
import { segmentLessons, extractQuestions } from './textbookSegmenter.js';
import { saveImportedBook } from '../data/importedUnits.js';

// معرف كتاب ثابت (كتاب المنهج لصف/مادة/جهة) لاستبدال الاستيراد السابق بدل تكراره.
// يشمل بصمة الرابط حتى لا تتصادم الأجزاء (الجزء الأول/الثاني) لنفس الصف والمادة.
export function bookIdFor(book) {
  if (book?.id) return book.id;
  const url = String(book?.url || '');
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) | 0;
  const sig = (h >>> 0).toString(36);
  return `${book?.authority || 'aden'}-${book?.grade || 0}-${(book?.subject || '').replace(/\s+/g, '_')}-${book?.term || 'first'}-${sig}`;
}

export function buildUnits(lessons) {
  // إن كانت الدروس تحمل اسم وحدتها (من عناوين «الوحدة») نجمعها بحسبها.
  if (lessons.some((l) => l.unit)) {
    const byUnit = new Map();
    for (const l of lessons) {
      const title = l.unit || 'دروس الكتاب';
      if (!byUnit.has(title)) byUnit.set(title, { title, lessons: [], pages: [l.page_from, l.page_to], questions: [] });
      const u = byUnit.get(title);
      u.lessons.push(l.title);
      u.questions.push(...(l.questions || []));
      u.pages[1] = l.page_to;
    }
    return [...byUnit.values()];
  }

  const units = [];
  let current = null;
  for (const l of lessons) {
    const isUnit = /^(الوحدة|الفصل|المحور|الموضوع)/u.test(l.title || '');
    if (isUnit || !current) {
      current = { title: l.title, lessons: [], pages: [l.page_from, l.page_to], questions: [] };
      units.push(current);
      current.lessons.push(l.title);
      current.questions.push(...(l.questions || []));
      continue;
    }
    current.lessons.push(l.title);
    current.questions.push(...(l.questions || []));
    current.pages[1] = l.page_to;
  }
  // إن كان كل درس في وحدة مستقلة (كتب لا تستخدم الوحدة) نجمّع كل ٤ دروس في وحدة
  if (units.length > 12) {
    const merged = [];
    for (let i = 0; i < lessons.length; i += 4) {
      const slice = lessons.slice(i, i + 4);
      merged.push({
        title: `دروس ${i + 1}–${Math.min(i + 4, lessons.length)}`,
        lessons: slice.map((s) => s.title),
        questions: slice.flatMap((s) => s.questions || []),
        pages: [slice[0].page_from, slice[slice.length - 1].page_to],
      });
    }
    return merged;
  }
  return units;
}

/**
 * يستورد كتاباً من ArrayBuffer.
 * @returns {Promise<{ok:boolean, reason?:string, units?:number, lessons?:number, questions?:number, pages?:number, readable?:number}>}
 */
export async function importBookBuffer({ data, book, onProgress }) {
  const { pages, pageCount, readable, mojibake } = await extractPdf(data, {
    onProgress: (n, total) => onProgress?.({ stage: 'extract', page: n, total })
  });

  if (!readable) {
    return { ok: false, reason: 'no-text', pages: pageCount };
  }

  onProgress?.({ stage: 'segment' });
  const lessons = segmentLessons(pages);

  if (!lessons.length) {
    return { ok: false, reason: 'no-lessons', pages: pageCount, readable };
  }

  // نرفق أسئلة كل درس به حتى تُبنى الوحدات وهي تحمل مسودّات الأسئلة.
  for (const l of lessons) l.questions = extractQuestions(l.sections);

  // لا نحفظ إلا الكتب التي فيها دروس فعلية بصفحاتها (شرط المستخدم).
  const units = buildUnits(lessons);
  let questions = 0;
  for (const l of lessons) questions += l.questions.length;

  onProgress?.({ stage: 'save' });
  saveImportedBook({
    grade: book.grade,
    subjectId: book.subjectId,
    bookId: bookIdFor(book),
    bookTitle: book.title,
    authority: book.authority || 'aden',
    units
  });

  return {
    ok: true,
    units: units.length,
    lessons: lessons.length,
    questions,
    pages: pageCount,
    readable,
    partial: mojibake && readable > 0,
    firstPages: pages.slice(0, 3).map((p) => (looksReadable(p.text) ? p.text.slice(0, 200) : '')).filter(Boolean)
  };
}
