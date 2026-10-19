// محرّك الدرس الصوتي التفاعلي — يبني فقرات شرح مسموعة، ويولّد سؤال فهم في نهاية
// كل فقرة، ويقيّم إجابة الطالب (صوتية/نصّية) بكلمات مفتاحية، ويدير الحوار مع الوكيل.
// يعمل دون إنترنت بالكامل (Web Speech + منطق محلي).
import { normalizeArabic } from './utils.js';
import { toYemeni } from './voice.js';
import { buildBook, flattenPages } from './bookEngine.js';
import { askQuestion } from './qnaEngine.js';

// كلمات وظيفية لا تصلح كمفاتيح تقييم
const STOP = new Set([
  'في', 'من', 'على', 'عن', 'الى', 'إلى', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'ما', 'ماذا',
  'كيف', 'لماذا', 'هل', 'ايش', 'إيش', 'يا', 'مع', 'ثم', 'او', 'أو', 'و', 'ثم', 'كل', 'بعض',
  'هو', 'هي', 'هم', 'نحن', 'انت', 'أنا', 'كان', 'كانت', 'يكون', 'ان', 'أن', 'إن', 'لا', 'نعم',
  'درس', 'الدرس', 'نتعلم', 'نتعرّف', 'نتعرف', 'نفهم', 'نقرا', 'نقرأ', 'الوحدة', 'المادة',
  'حيث', 'كذلك', 'ايضا', 'أيضاً', 'جدا', 'جداً', 'بشكل', 'طريقة', 'امثلة', 'أمثلة', 'خطوة'
]);

const AR_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;

// تجذير عربي مبسّط لمطابقة مرنة: إزالة التشكيل، توحيد الألف/الهمزة/التاء، وإزالة «ال» التعريف.
export function stemArabic(word) {
  let w = String(word || '').replace(AR_DIACRITICS, '');
  w = normalizeArabic(w);
  if (w.length > 4 && w.startsWith('ال')) w = w.slice(2);
  return w;
}

// كلمات مفتاحية من نصّ فقرة: الأطول والأكثر تكراراً، بلا تكرار ولا كلمات وظيفية.
export function keywordsFrom(text, limit = 5) {
  const tokens = String(text || '')
    .replace(AR_DIACRITICS, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^ال$/.test(w));
  const freq = new Map();
  for (const w of tokens) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => (b[1] - a[1]) || (b[0].length - a[0].length))
    .map(([w]) => w)
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, limit);
}

// جمل النص مفصولة (نقطة/علامة استفهام/فاصلة منقوطة)
function sentences(text) {
  return String(text || '')
    .split(/(?<=[.!؟?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// تقسيم محتوى الدرس إلى فقرات (كل فقرة جملتان تقريباً) مع عنوان من جملتها الأولى.
function toSegments(items) {
  const flat = [];
  for (const it of items) {
    if (!it || !String(it).trim()) continue;
    for (const s of sentences(it)) flat.push(s);
  }
  const segments = [];
  const PER = 2;
  for (let i = 0; i < flat.length; i += PER) {
    const chunk = flat.slice(i, i + PER).join(' ');
    segments.push({
      id: `seg${segments.length + 1}`,
      order: segments.length + 1,
      title: flat[i].slice(0, 48),
      narration: chunk
    });
  }
  return segments;
}

// قوالب أسئلة الفهم — تتنوّع حسب ترتيب الفقرة لإضفاء طابع حواري.
const Q_TEMPLATES = [
  (k) => `إيش أهم شي نتذكّره في «${k}»؟`,
  (k) => `اذكر الفكرة الأساسية المرتبطة بـ «${k}».`,
  (k) => `كيف تشرح «${k}» بأسلوبك؟`,
  (k) => `إيش علاقة «${k}» بدرسنا اليوم؟`
];

// يبني درساً صوتياً كاملاً: فقرات + سؤال فهم في نهاية كل فقرة.
export function buildVoiceLesson({ grade, subjectId, lesson, subjectName = '' }) {
  const book = buildBook({ grade, subjectId });
  const pages = flattenPages(book).filter((p) => p.lesson === lesson);
  const bodyItems = [];
  for (const p of pages) {
    if (p.title && !/^شرح:|^أمثلة/.test(p.title)) bodyItems.push(p.title);
    if (Array.isArray(p.body)) bodyItems.push(...p.body);
    if (Array.isArray(p.points)) bodyItems.push(...p.points);
  }
  // إن لم نجد صفحات الدرس، نولّد فقرة عامة من عنوانه
  if (!bodyItems.length) bodyItems.push(`درس «${lesson}» من مادة ${subjectName || 'المادة'}، نتعلّمه خطوة بخطوة.`);

  const base = toSegments(bodyItems).slice(0, 6);
  const lessonKey = keywordsFrom(lesson, 2).map(stemArabic).filter(Boolean);
  const segments = base.map((seg, i) => {
    const keys = keywordsFrom(seg.narration, 5);
    // ضمان وجود كلمة من عنوان الدرس بين المفاتيح لتفادي مفاتيح عامة
    const combined = [...new Set([...lessonKey, ...keys])].slice(0, 6);
    const key = keys.find((k) => !lessonKey.includes(stemArabic(k))) || keys[0] || lesson;
    const template = Q_TEMPLATES[i % Q_TEMPLATES.length];
    return {
      ...seg,
      keywords: combined,
      question: template(key),
      sampleAnswer: seg.narration,
      focus: key
    };
  });

  return {
    grade, subjectId, lesson, subjectName,
    segments,
    segmentCount: segments.length
  };
}

// تقييم إجابة الطالب على سؤال فقرة (بحث كلمات مفتاحية + إثراء بسيط للطول).
export function evaluateAnswer(segment, answerText) {
  const given = normalizeArabic(answerText);
  if (!given) return { answered: false, correct: false, score: 0, matched: [], missed: segment.keywords || [], feedback: '' };

  const givenStems = new Set(given.split(' ').map(stemArabic).filter((w) => w.length >= 3));
  const keys = (segment.keywords || []).map((k) => ({ raw: k, stem: stemArabic(k) })).filter((k) => k.stem);
  const matched = keys.filter((k) => givenStems.has(k.stem) || given.includes(k.stem)).map((k) => k.raw);
  const missed = keys.filter((k) => !(givenStems.has(k.stem) || given.includes(k.stem))).map((k) => k.raw);
  const ratio = keys.length ? matched.length / keys.length : 0;
  const longEnough = given.split(' ').length >= 4;
  // مطابقة كلمة السؤال المحورية (focus) كافية لاعتبار الإجابة صحيحة
  const focusStem = stemArabic(segment.focus || '');
  const hitFocus = focusStem.length >= 3 && (givenStems.has(focusStem) || given.includes(focusStem));
  const correct = hitFocus || ratio >= 0.5 || (matched.length >= 2 && longEnough);
  const score = Math.round(Math.min(1, ratio + (hitFocus ? 0.4 : 0) + (longEnough ? 0.1 : 0)) * 100);

  return {
    answered: true,
    correct,
    score,
    matched,
    missed,
    feedback: correct
      ? 'إجابتك صحيحة! ما شاء الله عليك. 👏'
      : 'قريب! خلّينا نراجع الفكرة سوا.'
  };
}

// ===== قوالب التغذية الراجعة الصوتية =====
export function feedbackSpeech({ correct, missed = [], focus = '' }) {
  if (correct) {
    return toYemeni(`إجابة صحيحة، أحسنت! ${focus ? 'تذكّر إنّ ' + focus + ' هو محور الفكرة.' : ''}`.trim());
  }
  const hint = missed.slice(0, 2).join(' و ');
  return toYemeni(`تقريباً صحيح، بس ناقص شوي. ركّز على ${hint || 'الفكرة الأساسية'} وجرّب مرّة ثانية.`);
}

// ===== الحوار مع الوكيل/المعلم =====
// ردّ الوكيل على سؤال الطالب: يستند إلى الكتاب، وإن لم يجد يحوّله للمعلم.
export function agentReply({ question, grade, subjectId, lesson = '' }) {
  const res = askQuestion({ question, grade, subjectId });
  return {
    ...res,
    from: 'agent',
    spoken: res.yemeni || toYemeni(res.short),
    lesson: res.lesson || lesson
  };
}

// اقتراحات حوار سريعة تعرض على الطالب داخل الجلسة.
export function dialogSuggestions(lesson = '') {
  const t = lesson || 'الدرس';
  return [
    { label: 'وضّح أكثر', question: `وضّح لي درس «${t}» أكثر` },
    { label: 'مثال من واقعنا', question: `أعطني مثال من واقعنا على «${t}»` },
    { label: 'ليش نتعلّمه؟', question: `ليش نتعلّم «${t}»؟` },
    { label: 'كرّر السؤال', question: '' } // يُعالج في الواجهة بإعادة نطق السؤال
  ];
}

// نيّة الطالب: ترحيب، إجابة، سؤال، طلب توضيح، أو صمت (انتهاء المهلة).
export function classifyIntent(text) {
  const t = normalizeArabic(text);
  if (!t) return 'silence';
  if (/(وضح|وضّح|اشرح|ابسط|مثال|زيد)/.test(t)) return 'clarify';
  if (/(ما فهمت|مش فاهم|صعب|اعيد|أعيد|كرر)/.test(t)) return 'confused';
  if (/(شكرا|شكراً|تمام|زين|اوكي|خلاص)/.test(t)) return 'thanks';
  if (/(\?|؟|كيف|لماذا|ما هو|ماذا|هل )/.test(text)) return 'question';
  return 'answer';
}

// ملخّص جلسة الدرس: نسبة الفهم، عدد الأسئلة، والتوصيات.
export function summarizeSession(session) {
  const attempts = Array.isArray(session?.attempts) ? session.attempts : [];
  const graded = attempts.filter((a) => a.evaluated);
  const correct = graded.filter((a) => a.correct).length;
  const percent = graded.length ? Math.round((correct / graded.length) * 100) : 0;
  const asked = Array.isArray(session?.dialog) ? session.dialog.length : 0;
  const strengths = [];
  const needsWork = [];
  graded.forEach((a) => {
    if (a.correct) strengths.push(a.focus || a.question);
    else needsWork.push(a.focus || a.question);
  });
  let level = 'يحتاج مراجعة';
  if (percent >= 80) level = 'ممتاز';
  else if (percent >= 60) level = 'جيد';
  else if (percent >= 40) level = 'مقبول';
  return {
    percent, correct, total: graded.length, asked, level,
    strengths: [...new Set(strengths)].slice(0, 5),
    needsWork: [...new Set(needsWork)].slice(0, 5),
    advice: percent >= 60
      ? 'أداء طيب! راجع الفقرات اللي أخطأت فيها ثم أعد الدرس.'
      : 'ركّز على الفقرات الصعبة، واسأل الوكيل عن أي نقطة غامضة.'
  };
}
