// تقطيع كتاب المنهج إلى دروس اعتماداً على عناوينه نفسها (الدرس/الوحدة/الفصل).
// منقول من منطق مستودع Teacher-Safwat- (Apache-2.0) إلى JavaScript ليعمل في المتصفح.

import { looksReadable } from './pdfExtract.js';

// حدّ كلمة عربي: \b في JavaScript يعتمد على ASCII، لذا لا يتحقق بعد حرف عربي.
// نستخدم نظرةً سلبية تمنع أن يتبع الكلمةَ حرفٌ عربي (حتى لا تُطابق «تدريب» في «تدريباتي»).
const AR_B = '(?![\\u0621-\\u064A])';

const RE_LESSON = new RegExp('^(?:ال)?دروس?' + AR_B + '|^الدرس(?=\\s|[:،؛]|$)', 'u');
const RE_UNIT = /^(?:الوحدة|الموضوع|المحور|الفصل)(?=\s|[:،؛(]|$)/u;
const RE_ACTIVITY = /^نشاط(?=\s|[:،؛]|$)/u;

// عناوين «مُتسامحة»: نصّ قصير يبدأ بكلمة الوحدة/الدرس حتى لو التصق به متن.
const RE_UNIT_SOFT = new RegExp('^(?:الوحدة|الفصل|المحور|الموضوع)' + AR_B, 'u');
const RE_LESSON_SOFT = new RegExp('^(?:الدرس|درس)' + AR_B, 'u');

const isLessonHeading = (l) => RE_LESSON.test(l) || RE_LESSON_SOFT.test(l);
const isUnitHeading = (l) => RE_UNIT.test(l);
const isActivityHeading = (l) => RE_ACTIVITY.test(l);

const hasArabic = (s) => /[\u0621-\u064A]/.test(s);

// إزالة رقم الصفحة الذي يلتصق ببداية السطر ("٧ الوحدة..." أو "7 كلمة").
export function stripPageNo(line) {
  let t = String(line ?? '').trim();
  t = t.replace(/^[\u0660-\u0669]{1,3}[\s\u00A0]+(?=[\u0621-\u064A])/u, '');
  t = t.replace(/^[0-9]{1,3}[\s\u00A0]+(?=[\u0621-\u064A])/u, '');
  return t.trim();
}

const UNIT_WORDS = ['الوحدة', 'الفصل', 'المحور', 'الموضوع'];
const LESSON_WORDS = ['الدرس', 'درس'];

// كلمات تبدأ المتن بعد العنوان مباشرةً — نتوقف عندها حتى لا يدخل المتن في العنوان.
const BODY_STARTERS = new Set([
  'أهداف', 'يتوقع', 'عزيزي', 'عزيزتي', 'مقدمة', 'تمهيد', 'تقويم', 'مراجعة', 'تدريبات',
  'أسئلة', 'أسئله', 'نشاط', 'أنشطة', 'لاحظ', 'ملاحظة', 'تعريف', 'المقصود', 'تذكر',
  'اقرأ', 'اقر', 'اكتب', 'أكمل', 'اختر', 'أجب', 'لنتعلم', 'سنتعلم', 'في', 'من', 'على', 'ما', 'هو', 'هي'
]);

// ترتيب الوحدات/الدروس — لقطع الأسماء الملتصقة («الدرسالأولصَّفالمعلم» → «الدرس الأول»).
const ORDINALS = [
  'الحادي', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع',
  'العاشر', 'الأول', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة',
  'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'
];

// يستخرج عنواناً في بداية السطر (وحدة/درس) حتى لو التصق العنوان بالمتن بلا مسافة
// ("الدرسالأول") أو التصق به نصّ ("الوحدة الخامسة(ك - ي) أهداف الوحدة: ...").
function takeHeading(line) {
  const isUnit = UNIT_WORDS.some((w) => line.startsWith(w));
  const word = UNIT_WORDS.find((w) => line.startsWith(w)) || LESSON_WORDS.find((w) => line.startsWith(w));
  if (!word) return null;

  const after = line.slice(word.length).trim();
  const picked = [];
  let afterOrdinal = false;
  for (const raw of after.split(/\s+/)) {
    if (picked.length >= 4) break;
    const stopChar = /[(\uFFFD\u0640]/u.test(raw);
    const head = raw.split(/[(\uFFFD\u0640]/u)[0].replace(/^[.:،؛\-–]+|[\s.:،؛\-–]+$/gu, '');
    if (head) {
      if (/[\u0660-\u0669\d]/.test(head) || BODY_STARTERS.has(head)) break;
      if (!afterOrdinal) {
        // كلمة الترتيب قد تكون ملتصقة («الخامسة(ك» → «الخامسة»)، وما بعدها اسم الدرس.
        const ord = ORDINALS.filter((o) => head.startsWith(o)).sort((a, b) => b.length - a.length)[0];
        if (ord) { picked.push(ord); afterOrdinal = true; }
        else picked.push(head);
      } else {
        picked.push(head);
      }
      const tail = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1).replace(/^[\s.:،؛\-–]+|[\s.:،؛\-–]+$/gu, '') : '';
      if (tail) { picked.push(tail); break; }
    }
    if (stopChar) break;
  }
  const title = tidyHeading([word, ...picked].join(' '));
  if (!title) return null;

  // ما تبقّى من السطر بعد العنوان يُعامل كمحتوى (كثيراً ما يلتصق العنوان ببداية المتن).
  let rest = after;
  for (const p of picked) rest = rest.replace(new RegExp('^\\s*' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '');
  rest = rest.replace(/^[\s.:،؛\-–(]+/, '').trim();
  return { kind: isUnit ? 'unit' : 'lesson', title, rest: rest.length >= 4 ? rest : '' };
}

function isJunkToken(token) {
  if (!token || token.length < 2) return true;
  if (!hasArabic(token)) return true;
  const chars = [...token];
  return new Set(chars).size === 1;
}

// تنظيف عنوان OCR: قطع ذيول الأرقام/التكرار، وتقشير الكلمات الشاذة.
export function tidyHeading(line) {
  let t = String(line ?? '').trim();
  t = t.replace(/\d{5,}[\s\S]*$/u, '');
  t = t.replace(/(.)\1{4,}[\s\S]*$/u, '');
  const parts = t.split(/\s+/u).filter(Boolean);
  while (parts.length && isJunkToken(parts[parts.length - 1])) parts.pop();
  t = parts.join(' ');
  t = t.replace(/[\s.:،؛\u0640]+$/u, '');
  return t.trim().slice(0, 120);
}

const cleanHeading = tidyHeading;

// عنوانان يعنوان نفس المجموعة إذا تطابقا أو تطابق أول ١٠ محارف.
function sameHeading(a, b) {
  a = String(a ?? '').replace(/\s+/gu, ' ').trim();
  b = String(b ?? '').replace(/\s+/gu, ' ').trim();
  if (!a || !b) return false;
  if (a === b) return true;
  return a.slice(0, 10) === b.slice(0, 10);
}

function isNoiseLine(line, boilerplate) {
  const t = String(line ?? '').trim();
  if (!t) return true;
  if (boilerplate && boilerplate.has(t)) return true;
  if (/(www\.|\.ye\b|edu\.|@)/iu.test(t)) return true;
  if ([...t].length < 3) return true;
  return !hasArabic(t);
}

// الأسطر المتكررة عبر الصفحات (ترويسة/تذييل) = حشو.
function detectBoilerplate(pages) {
  const counts = new Map();
  for (const p of pages) {
    const seen = new Set();
    for (const raw of String(p.text).split(/\r\n|\r|\n/)) {
      const line = raw.trim();
      if (line) seen.add(line);
    }
    for (const line of seen) counts.set(line, (counts.get(line) || 0) + 1);
  }
  const threshold = Math.max(8, Math.floor(Math.max(1, pages.length) * 0.3));
  const bp = new Set();
  for (const [line, n] of counts) if (n >= threshold) bp.add(line);
  return bp;
}

function guessSectionType(line) {
  if (/^(تمرين|سؤال|أجب|حل)/u.test(line)) return 'example';
  if (/^(تعريف|المقصود)/u.test(line)) return 'definition';
  if (/^(ملاحظة|لاحظ|تذكر)/u.test(line)) return 'note';
  return 'point';
}

// احتياطي: تجميع الصفحات حسب عناوين الوحدة/الفصل.
function segmentByUnit(pages, boilerplate) {
  const units = [];
  let current = null;
  for (const page of pages) {
    const lines = String(page.text).split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
    const headings = lines.filter((l) => isUnitHeading(stripPageNo(l)) || isActivityHeading(stripPageNo(l)));
    if (headings.length >= 3) continue; // صفحة فهرس
    const heading = headings[0] || null;
    const headingNorm = heading ? stripPageNo(heading) : null;
    const body = lines.filter((l) => heading === null || l !== heading);
    if (headingNorm !== null) {
      const title = cleanHeading(headingNorm);
      if (current === null || !sameHeading(title, units[current].title)) {
        units.push({ title, page_from: page.page, page_to: page.page, sections: [] });
        current = units.length - 1;
      }
    } else if (current === null) {
      units.push({ title: 'مقدمة الكتاب', page_from: page.page, page_to: page.page, sections: [] });
      current = units.length - 1;
    }
    units[current].page_to = page.page;
    for (const line of body) {
      if (isNoiseLine(line, boilerplate)) continue;
      units[current].sections.push({ type: guessSectionType(line), content: line, source_page: page.page });
    }
  }
  return units.filter((u) => u.sections.length);
}

// احتياطي أخير: تقسيم الصفحات إلى مقاطع ثابتة بعنوان نطاق الصفحات فقط.
function chunkByPages(pages, size, boilerplate) {
  const chunks = [];
  let buffer = [];
  let from = null;
  let to = null;
  const flush = () => {
    if (!buffer.length) return;
    chunks.push({ title: `صفحات ${from} - ${to}`, page_from: from, page_to: to, sections: buffer });
    buffer = [];
    from = null;
    to = null;
  };
  for (const page of pages) {
    const lines = String(page.text).split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean)
      .filter((l) => !isNoiseLine(l, boilerplate) && !isUnitHeading(l) && !isActivityHeading(l));
    if (!lines.length) continue;
    if (from === null) from = page.page;
    to = page.page;
    for (const line of lines) buffer.push({ type: guessSectionType(line), content: line, source_page: page.page });
    if (to - from >= size) flush();
  }
  flush();
  return chunks;
}

/**
 * تقطيع الصفحات المستخرجة إلى دروس.
 * @param {Array<{page:number,text:string}>} pages
 * @returns {Array<{title,page_from,page_to,sections}>}
 */
export function segmentLessons(pages) {
  const usable = pages.filter((p) => looksReadable(p.text));
  if (!usable.length) return [];
  const boilerplate = detectBoilerplate(usable);

  let lessons = [];
  let current = null;
  let currentUnit = null;

  for (const page of usable) {
    const lines = String(page.text).split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
    const headingCount = lines.filter((l) => isLessonHeading(stripPageNo(l))).length;
    if (headingCount >= 3) continue; // فهرس الدروس

    for (const rawLine of lines) {
      const line = stripPageNo(rawLine);
      const h = takeHeading(line);

      if (h && h.kind === 'unit') {
        currentUnit = h.title;
        continue;
      }
      if (h && h.kind === 'lesson') {
        const title = h.title;
        if (current !== null && sameHeading(title, lessons[current].title)) continue;
        lessons.push({ title, unit: currentUnit, page_from: page.page, page_to: page.page, sections: [] });
        current = lessons.length - 1;
        if (h.rest && !isNoiseLine(h.rest, boilerplate)) {
          lessons[current].sections.push({ type: guessSectionType(h.rest), content: h.rest, source_page: page.page });
        }
        continue;
      }
      if (current === null) continue;
      if (isNoiseLine(line, boilerplate)) continue;
      lessons[current].page_to = page.page;
      lessons[current].sections.push({ type: guessSectionType(line), content: line, source_page: page.page });
    }
  }

  lessons = lessons.filter((l) => l.sections.length);

  if (lessons.length < 4) {
    const units = segmentByUnit(usable, boilerplate);
    if (units.length > lessons.length) lessons = units;
  }

  const pageCount = usable.length;
  if (pageCount >= 20 && lessons.length < Math.max(2, Math.floor(pageCount / 20))) {
    const chunks = chunkByPages(usable, 6, boilerplate);
    if (chunks.length > lessons.length) lessons = chunks;
  }

  return lessons.map((l, i) => ({ ...l, sort_order: i }));
}

// استخراج أسئلة الكتاب كمسودّات (بلا إجابات — تُراجَع بشرياً).
// كتب RTL قد تُخرج رقم البند في نهاية السطر بصرياً («....؟(١») لا في بدايته،
// لذلك نتعامل مع العلامات في الطرفين.
const NUM = '0-9\\u0660-\\u0669';
const LEAD_NUM = new RegExp('^[' + NUM + ']+\\s*[-).:\\u066B\\u066C]');
const TAIL_NUM = new RegExp('(?:[-.:\\u066B\\u066C]\\s*|\\(\\s*)[' + NUM + ']+\\s*\\)?$');
const LEAD_OPT = /^([أبجدهوزABCD])\s*[-–)]\s*(.+)$/u;
const TAIL_OPT = /^(.+?)\s*[(-]\s*([أبجدهوزABCD])\s*\)?$/u;

const stripLeadNum = (t) => t.replace(new RegExp('^[' + NUM + ']+\\s*[-).:\\u066B\\u066C]+\\s*'), '').trim();
const stripTailNum = (t) => t.replace(TAIL_NUM, '').replace(/\s+$/, '').trim();

// خيار اختيار من متعدد بصيغة «أ) نص» أو «نص(أ» ← نص موحّد «أ) نص».
function parseOption(t) {
  const lead = LEAD_OPT.exec(t);
  if (lead) return { letter: lead[1], text: `${lead[1]}) ${lead[2].trim()}` };
  const tail = TAIL_OPT.exec(t);
  if (tail) return { letter: tail[2], text: `${tail[2]}) ${tail[1].trim()}` };
  return null;
}

export function extractQuestions(sections) {
  const lines = [];
  for (const s of sections || []) {
    for (const raw of String(s.content).split(/\r\n|\r|\n/)) lines.push({ text: raw.trim(), page: s.source_page });
  }

  const isInstruction = (t) => new RegExp('^(?:تمرين|تدريب|تدريبات|أسئلة|أسئله|أنشطة|نشاط|أجب|أكمل|اختر|صل|حل|علل|استنتج|اكتب|رتب|ضع|عدّ|عُدّ)' + AR_B, 'u').test(t);
  const hasContent = (t) => /[0-9\u0660-\u0669?؟=]/u.test(t);
  const isNoise = (t) => [...t].length < 3 || [...t].length > 140 || !hasArabic(t) || /https?:\/\/|www\./iu.test(t);

  const questions = [];
  const seen = new Set();
  let inBlock = false;
  let current = -1;
  let hint = null;

  for (const line of lines) {
    const text = line.text;
    if (!text) continue;

    if (isInstruction(text) && [...text].length <= 60 && !hasContent(text)) { inBlock = true; current = -1; hint = text; continue; }

    if (isInstruction(text) && !isNoise(text)) {
      if (!seen.has(text)) {
        seen.add(text);
        questions.push({ question: text, type: guessExerciseType(text, text), page: line.page, options: [] });
        current = questions.length - 1;
      }
      inBlock = true;
      hint = text;
      continue;
    }

    if (LEAD_NUM.test(text) || TAIL_NUM.test(text)) {
      const body = stripTailNum(stripLeadNum(text));
      if (isNoise(body)) continue;
      const asks = /(?:\?|؟|ما|ماذا|كيف|لماذا|اذكر|عدد|بيّن|وضح|أكمل|اختر|أجب)/u.test(body);
      if (!inBlock && !asks) continue;
      if (seen.has(body)) continue;
      seen.add(body);
      questions.push({ question: body, type: guessExerciseType(body, hint), page: line.page, options: [] });
      current = questions.length - 1;
      continue;
    }

    const opt = parseOption(text);
    if (opt && current >= 0) {
      questions[current].options.push(opt.text);
      if (questions[current].type === 'short_answer') questions[current].type = 'mcq';
    }
  }
  return questions;
}

// نوع السؤال من صيغته أو من تعليمة التمرين السابقة («أجب بصح أو خطأ» → tf).
function guessExerciseType(q, hint = '') {
  const src = `${hint || ''} ${q}`;
  if (/(?:اختر|أي من|الصحيح|اختيار من متعدد)/u.test(src)) return 'mcq';
  if (/(?:صح|خطأ|صواب|هل )/u.test(src)) return 'tf';
  return 'short_answer';
}

export function optionLabel(text) {
  const m = /^\s*([أبجدهوزABCD])/u.exec(text);
  return m ? m[1] : null;
}
