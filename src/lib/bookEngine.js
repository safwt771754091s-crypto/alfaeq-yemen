// محرّك الكتاب الرقمي — يبني كتاباً صفحةً صفحة من المنهج المعتمد،
// ويفتحه بالاسم ورقم الصفحة كما لو كان الطالب يفتح الكتاب الورقي.
import { getUnits, SUBJECTS, gradeName, gradeCycle } from '../data/curriculum.js';
import { topicExamples } from './illustrations.js';

const PAGES_PER_LESSON = 3;

// تصنيف المادة لتوليد محتوى مناسب
function categoryOf(subjectId) {
  if (['arabic', 'english'].includes(subjectId)) return 'lang';
  if (['math'].includes(subjectId)) return 'math';
  if (['science', 'physics', 'chemistry', 'biology'].includes(subjectId)) return 'science';
  if (['social', 'history', 'geography', 'civic'].includes(subjectId)) return 'social';
  if (['quran', 'islamic'].includes(subjectId)) return 'religion';
  if (['psychology', 'philosophy'].includes(subjectId)) return 'human';
  return 'skills';
}

const INTRO_BY_CAT = {
  lang: (t) => [
    `نتعرّف في هذا الدرس على «${t}» بأسلوب سهل وواضح.`,
    'نقرأ النص قراءة سليمة، ثم نفهم معاني الكلمات الجديدة.',
    'نتدرّب على قواعد اللغة ونطبّقها في جمل من واقع حياتنا.',
  ],
  math: (t) => [
    `درس «${t}» يعلّمنا خطوات الحل بطريقة متدرّجة.`,
    'نبدأ بالأمثلة السهلة ثم ننتقل إلى الأصعب قليلاً.',
    'المفتاح هو الممارسة: نحلّ ثم نتحقّق من الإجابة.',
  ],
  science: (t) => [
    `سنتعرّف في «${t}» على الظاهرة وكيف تحدث.`,
    'نلاحظ ثم نسأل ثم نجرّب ونستنتج.',
    'العلم يبدأ بالملاحظة وينتهي بالاستنتاج.',
  ],
  social: (t) => [
    `درس «${t}» يعرّفنا على المكان والزمان والإنسان.`,
    'نقرأ الأحداث ونتساءل عن أسبابها ونتائجها.',
    'نربط ما نتعلّمه بواقع بلدنا الحبيب.',
  ],
  religion: (t) => [
    `نتعلّم في «${t}» ما يقرّبنا إلى الله ويحسّن أخلاقنا.`,
    'نفهم المعنى ثم نحفظ ثم نطبّق في سلوكنا اليومي.',
    'العمل بما نتعلّم هو الغاية.',
  ],
  human: (t) => [
    `نتأمّل في «${t}» كيف نفكّر ونتصرّف ونعيش مع الآخرين.`,
    'نطرح الأسئلة ونقارن الآراء ثم نبني رأياً سليماً.',
    'الفكر السليم أساس السلوك السليم.',
  ],
  skills: (t) => [
    `درس «${t}» مهارة عملية نتعلّمها خطوة بخطوة.`,
    'نشاهد الطريقة ثم نجرّبها بأنفسنا.',
    'المهارة تُبنى بالتكرار والتدريب.',
  ],
};

// بناء صفحات الدرس الثلاث (عنوان — شرح — أمثلة وتمرين)
function lessonPages({ subjectId, grade, unit, lesson, startPage }) {
  const cat = categoryOf(subjectId);
  const intro = INTRO_BY_CAT[cat](lesson);
  const examples = topicExamples(subjectId, lesson);

  const p1 = {
    page: startPage,
    kind: 'title',
    title: lesson,
    body: [
      `الوحدة: ${unit}`,
      `المادة: ${SUBJECTS[subjectId]?.name || ''} — ${gradeName(grade)}`,
      intro[0],
    ],
    tips: 'اقرأ عنوان الدرس وتأمّل الصورة قبل أن تبدأ.',
  };

  const p2 = {
    page: startPage + 1,
    kind: 'lesson',
    title: `شرح: ${lesson}`,
    body: [...intro.slice(1), `أهمّ أفكار درس «${lesson}» نتعلّمها بالترتيب من الأسهل إلى الأصعب.`],
    points: [
      'نفهم الفكرة الأساسية أولاً.',
      'نربط الفكرة بمثال من حياتنا.',
      'نتدرّب ثم نتحقّق من فهمنا.',
    ],
    tips: 'استمع للشرح الصوتي باللهجة اليمنية ثم أعد القراءة.',
  };

  const p3 = {
    page: startPage + 2,
    kind: 'practice',
    title: `أمثلة وتدريب: ${lesson}`,
    examples,
    exercise: [
      `اشرح بأسلوبك ما فهمته من درس «${lesson}».`,
      'أعطِ مثالاً من واقعك على هذه الفكرة.',
      'حلّ تمريناً واحداً وتحقّق من إجابتك.',
    ],
    tips: 'لا تخف من الخطأ؛ الخطأ طريق التعلّم.',
  };

  return [p1, p2, p3];
}

// يبني الكتاب كاملاً للصف والمادة
export function buildBook({ grade, subjectId }) {
  const units = getUnits(grade, subjectId);
  let pageNo = 1;
  const chapters = units.map((u, ui) => {
    const lessons = u.lessons.map((l) => {
      const pages = lessonPages({ subjectId, grade, unit: u.title, lesson: l, startPage: pageNo });
      pageNo += pages.length;
      return { title: l, pages, firstPage: pages[0].page };
    });
    return { index: ui + 1, title: u.title, lessons };
  });
  return {
    grade,
    subjectId,
    subjectName: SUBJECTS[subjectId]?.name || 'المادة',
    gradeLabel: gradeName(grade),
    cycle: gradeCycle(grade),
    chapters,
    totalPages: pageNo - 1,
    totalLessons: chapters.reduce((n, c) => n + c.lessons.length, 0),
  };
}

// قائمة مسطّحة بكل الصفحات (للتقليب صفحة صفحة)
export function flattenPages(book) {
  const out = [];
  for (const ch of book.chapters)
    for (const ls of ch.lessons)
      for (const pg of ls.pages)
        out.push({ ...pg, chapter: ch.title, lesson: ls.title });
  return out;
}

// فتح الكتاب بالاسم ورقم الصفحة (كما في الكتاب الورقي)
// name: اسم الدرس (أو جزء منه) — page: رقم الصفحة (اختياري)
export function openAt(book, { name = '', page = null } = {}) {
  const pages = flattenPages(book);
  const q = normalize(name);
  let target = null;

  if (q) {
    const exact = pages.filter((p) => normalize(p.lesson).includes(q) || normalize(p.title).includes(q));
    target = exact[0] || null;
  }
  if (page != null && Number.isFinite(Number(page))) {
    const n = Number(page);
    const byPage = pages.find((p) => p.page === n);
    if (byPage) target = byPage;
    else if (!target) target = pages.find((p) => p.page >= n) || pages[pages.length - 1];
  }
  return target || pages[0] || null;
}

// بحث نصّي في عناوين الدروس
export function searchLessons(book, query) {
  const q = normalize(query);
  if (!q) return [];
  const hits = [];
  for (const ch of book.chapters)
    for (const ls of ch.lessons)
      if (normalize(ls.title).includes(q) || normalize(ch.title).includes(q))
        hits.push({ lesson: ls.title, chapter: ch.title, page: ls.firstPage });
  return hits.slice(0, 30);
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
