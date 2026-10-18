// محرّك «اسأل الآن» — يجيب محلياً (دون إنترنت) بإجابة مختصرة وشرح مبسّط
// مستنداً إلى الكتاب الرقمي والمنهج، ويرسل الأسئلة غير المُجابة إلى قائمة المعلم.
import { SUBJECTS, SUBJECTS_BY_GRADE, getUnits } from '../data/curriculum.js';
import { buildBook, searchLessons, flattenPages } from './bookEngine.js';
import { toYemeni } from './voice.js';

// كلمات مفتاحية → مفهوم عام (إجابات عامة مفيدة حتى لو لم يُذكر الدرس بالاسم)
const GENERAL = [
  { keys: ['لا افهم', 'صعب', 'ما فهمت', 'مش فاهم', 'صعب علي'], short: 'التعلّم يحتاج خطوات صغيرة.',
    explanation: 'قسّم الدرس إلى أجزاء صغيرة، افهم الجزء الأول ثم انتقل للذي بعده، واسأل المعلم عن الجزء الغامض تحديداً.' },
  { keys: ['احفظ', 'حفظ', 'نسيان', 'انسى'], short: 'الحفظ بالتكرار المتباعد أفضل.',
    explanation: 'اقرأ ثم أغلق الكتاب وردّد من ذاكرتك، وكرّر ذلك بعد ساعة ثم بعد يوم ثم بعد أسبوع.' },
  { keys: ['مراجعة', 'راجع', 'امتحان', 'اختبار'], short: 'المراجعة على دفعات أقوى.',
    explanation: 'راجع عنوان الدرس وأفكاره الرئيسة أولاً، ثم حلّ تمارين، ثم راجع أخطاءك السابقة.' },
  { keys: ['تركيز', 'اشرح', 'فهم', 'ابسط'], short: 'بسّط الفكرة بمثال من حياتك.',
    explanation: 'اربط المفهوم بشيء تعرفه من حولك، واشرحه لصديق بصوتك؛ الشرح للغير يثبّت الفهم.' },
];

// يجد أقرب درس يطابق كلمات السؤال داخل كتاب الصف/المادة، أو في كل مواد الصف
function findLesson({ question, grade, subjectId }) {
  const words = tokenize(question);
  if (!words.length) return null;

  const tryBook = (sid) => {
    const book = buildBook({ grade, subjectId: sid });
    const pages = flattenPages(book);
    let best = null, bestScore = 0;
    for (const pg of pages) {
      const hay = normalize(pg.lesson + ' ' + (pg.title || '') + ' ' + (Array.isArray(pg.body) ? pg.body.join(' ') : ''));
      let score = 0;
      for (const w of words) if (w.length > 2 && hay.includes(w)) score++;
      if (score > bestScore) { bestScore = score; best = { page: pg, book, sid }; }
    }
    return bestScore > 0 ? best : null;
  };

  if (subjectId) {
    const hit = tryBook(subjectId);
    if (hit) return hit;
  }
  // ابحث في كل مواد الصف
  for (const sid of (SUBJECTS_BY_GRADE[grade] || [])) {
    const hit = tryBook(sid);
    if (hit) return hit;
  }
  return null;
}

// الواجهة الرئيسة: يعيد { short, explanation, lesson, subjectName, page, grounded }
export function askQuestion({ question, grade, subjectId = '' }) {
  const q = String(question || '').trim();
  if (!q) return { short: 'اكتب سؤالك أولاً.', explanation: '', grounded: false };

  const hit = findLesson({ question: q, grade, subjectId });
  if (hit) {
    const pg = hit.page;
    const short = (Array.isArray(pg.body) && pg.body[0]) || pg.title || 'هذا الدرس يشرح الفكرة.';
    const explanation = [
      `الدرس: «${pg.lesson}» — الوحدة: ${pg.chapter}`,
      ...(Array.isArray(pg.points) ? pg.points : []),
      ...(Array.isArray(pg.body) ? pg.body.slice(1) : []),
    ].join(' ');
    return {
      short,
      explanation,
      grounded: true,
      lesson: pg.lesson,
      subjectId: hit.sid,
      subjectName: SUBJECTS[hit.sid]?.name || '',
      page: pg.page,
      yemeni: toYemeni(short),
    };
  }

  const g = GENERAL.find((g) => g.keys.some((k) => normalize(q).includes(normalize(k))));
  if (g) {
    return { short: g.short, explanation: g.explanation, grounded: false, yemeni: toYemeni(g.short) };
  }

  return {
    short: 'سؤالك وصل، وسيشرحه لك المعلم قريباً.',
    explanation: 'لم أجد إجابة جاهزة في الكتاب الرقمي. أرسلنا سؤالك إلى المعلم ليضيف الشرح المناسب، ويمكنك متابعة بقية الدروس الآن.',
    grounded: false,
    needsTeacher: true,
    yemeni: 'سؤالك وصل، والمعلم بيشرحه لك قريباً إن شاء الله.',
  };
}

// أسئلة مقترحة (محفّزة) بحسب الدرس الحالي
export function suggestedQuestions(lessonTitle = '') {
  const t = lessonTitle || 'الدرس';
  return [
    `إيش معنى «${t}» ببساطة؟`,
    `أعطني مثال من واقعنا على «${t}».`,
    `ليش نتعلّم «${t}»؟`,
    `كيف أحل تمرين «${t}»؟`,
  ];
}

// ====== قائمة أسئلة المعلم (تُخزَّن محلياً) ======
const KEY = 'st.qna.queue.v1';

export function loadQueue() {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveQueue(list) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* تجاهل */ }
}
export function addQuestion(entry) {
  const list = loadQueue();
  const row = {
    id: 'q' + Date.now() + Math.random().toString(36).slice(2, 6),
    question: entry.question,
    grade: entry.grade,
    subjectId: entry.subjectId || '',
    lesson: entry.lesson || '',
    short: entry.short || '',
    explanation: entry.explanation || '',
    askedBy: entry.askedBy || 'طالب',
    createdAt: new Date().toISOString(),
    status: entry.status || (entry.needsTeacher ? 'pending' : 'answered'),
    teacherAnswer: '',
  };
  list.unshift(row);
  saveQueue(list.slice(0, 200));
  return row;
}
export function answerQuestion(id, { text, by = 'المعلم' }) {
  const list = loadQueue();
  const i = list.findIndex((r) => r.id === id);
  if (i >= 0) {
    list[i].teacherAnswer = text;
    list[i].answeredBy = by;
    list[i].answeredAt = new Date().toISOString();
    list[i].status = 'answered';
    saveQueue(list);
  }
  return list;
}
export function removeQuestion(id) {
  const list = loadQueue().filter((r) => r.id !== id);
  saveQueue(list);
  return list;
}
export function clearQueue() { saveQueue([]); return []; }

// ====== أدوات نصية ======
const STOP = new Set(['في', 'من', 'على', 'عن', 'الى', 'إلى', 'هذا', 'هذه', 'ما', 'ماذا', 'كيف', 'لماذا', 'هل', 'ايه', 'إيش', 'ايش', 'يا', 'مع', 'ثم', 'او', 'أو', 'و', 'the', 'a', 'is']);
function tokenize(s) {
  return normalize(s).split(' ').filter((w) => w.length > 1 && !STOP.has(w));
}
function normalize(s) {
  return String(s || '')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\u0621-\u064Aa-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { getUnits };
