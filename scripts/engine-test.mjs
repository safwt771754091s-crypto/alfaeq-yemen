// اختبارات وحدة لمحرّكات المنصة (تعمل عبر node مباشرة دون أي تبعيات).
// التشغيل: npm test
import { generateLessonPlan, generateSlides, slidesToMarkdown, slidesToPptx } from '../src/lib/lessonEngine.js';
import { analyzeClass, gradeQuestion, gradePaper, parseStudentsCsv, generateSampleQuiz } from '../src/lib/gradingEngine.js';
import { estimateLabel, subjectsForGrade, getUnits, getLessons, GRADES, GRADES_BY_STAGE, gradeName, gradeOfficial } from '../src/data/curriculum.js';
import { buildNotebook, buildWeeklyPlan, buildCoverage, notebookStats, notebookToMarkdown, notebookToCsv, termName } from '../src/lib/notebookEngine.js';
import { pct, arabicNumber, slugify, lastNDates, normalizeArabic } from '../src/lib/utils.js';
import { hashPin, randomSalt } from '../src/lib/storage.js';

let pass = 0;
let fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FAIL:', msg); } };

// --- المنهج اليمني ---
ok(GRADES.length === 12, 'الصفوف من 1 إلى 12');
ok(gradeName(9) === 'الصف التاسع', 'اسم الصف التاسع');
ok(gradeName(12) === 'الثالث ثانوي', 'تسمية الصف الثاني عشر «الثالث ثانوي»');
ok(gradeName(10) === 'الأول ثانوي', 'تسمية الصف العاشر «الأول ثانوي»');
ok(gradeName(11) === 'الثاني ثانوي', 'تسمية الصف الحادي عشر «الثاني ثانوي»');
ok(gradeOfficial(12) === 'الصف الثاني عشر', 'الاسم الرسمي للصف الثاني عشر');
ok(GRADES.find((g) => g.n === 12).label.includes('الثالث ثانوي'), 'وصف الصف الثاني عشر في القوائم');
ok(GRADES_BY_STAGE.length === 3, 'تجميع الصفوف في ثلاث مراحل');
ok(GRADES_BY_STAGE[2].grades.length === 3, 'المرحلة الثانوية تضم 3 صفوف');
for (const g of GRADES) ok(subjectsForGrade(g.n).length > 0, 'مواد للصف ' + g.n);
ok(getUnits(9, 'math').length > 0, 'وحدات الرياضيات للصف التاسع');
ok(getUnits(12, 'physics').length > 0, 'وحدات الفيزياء للصف الثاني عشر');
ok(estimateLabel(95).label === 'ممتاز', 'التقدير عند 95');
ok(estimateLabel(45).label === 'راسب', 'التقدير عند 45');
let lessonCount = 0;
for (const g of GRADES) for (const s of subjectsForGrade(g.n)) lessonCount += getLessons(g.n, s.id).length;
ok(lessonCount > 200, 'إجمالي الدروس ' + lessonCount);

// --- محرّك التحضير ---
const plan = generateLessonPlan({ subjectId: 'math', grade: 9, title: 'المعادلات من الدرجة الأولى', duration: 45 });
ok(plan.objectives.length >= 3, 'أهداف التحضير');
ok(plan.objectives.every((o) => o && !o.includes('undefined')), 'لا undefined في الأهداف');
ok(plan.strategies.length === 4, 'استراتيجيات التحضير');
ok(plan.phases.length === 4, 'مراحل التحضير');
ok(plan.phases.reduce((a, p) => a + p.minutes, 0) === 45, 'مجموع دقائق المراحل = الزمن');

// --- العروض التقديمية ---
const deck = generateSlides({ subjectId: 'math', grade: 9, title: 'المعادلات', duration: 45, slideCount: 10 });
ok(deck.slides[0].layout === 'title', 'أول شريحة عنوان');
ok(deck.slides[deck.slides.length - 1].layout === 'end', 'آخر شريحة خاتمة');
ok(deck.slides.length >= 8, 'عدد الشرائح >= 8');
ok(deck.slides.some((s) => s.layout === 'visual'), 'يوجد شريحة صورة توضيحية');
ok(deck.slides.some((s) => s.layout === 'examples'), 'يوجد شريحة أمثلة وتطبيقات');
ok(deck.slides.some((s) => typeof s.image === 'string' && s.image.startsWith('data:image/svg')), 'الشريحة تحمل صورة SVG مضمّنة');
ok(deck.slides[0].image && deck.slides[0].image.startsWith('data:image/svg'), 'شريحة العنوان تحمل صورة');
ok(plan.examples && plan.examples.length >= 2, 'التحضير يتضمن أمثلة');
ok(typeof plan.illustration === 'string' && plan.illustration.startsWith('data:image/svg'), 'التحضير يتضمن صورة توضيحية');
const md = slidesToMarkdown(deck);
ok(md.includes('---') && md.includes('# المعادلات'), 'تصدير Markdown');
const blob = await slidesToPptx(deck);
ok(blob.size > 2000, 'حجم ملف PowerPoint ' + blob.size);
ok(blob.type.includes('presentationml'), 'نوع ملف PowerPoint');
const buf = Buffer.from(await blob.arrayBuffer());
ok(buf.slice(0, 2).toString() === 'PK', 'ملف PowerPoint أرشيف صالح');

// --- التصحيح الذكي ---
const mcq = { id: 'q1', type: 'mcq', prompt: 'س', options: ['أ', 'ب', 'ج', 'د'], answer: 'أ', points: 2 };
ok(gradeQuestion(mcq, 'أ').score === 2, 'اختيار من متعدد صحيح');
ok(gradeQuestion(mcq, 'ب').score === 0, 'اختيار من متعدد خاطئ');
ok(gradeQuestion(mcq, '').answered === false, 'سؤال متروك');
const essay = { id: 'q2', type: 'essay', prompt: 'اشرح', keywords: ['التعريف', 'السبب', 'النتيجة'], points: 6 };
ok(gradeQuestion(essay, 'التعريف هو كذا والسبب كذا والنتيجة كذا').score >= 4, 'تصحيح مقالي بالكلمات المفتاحية');

const questions = [
  { id: 'a', type: 'mcq', prompt: 'س1', options: ['x', 'y'], answer: 'x', points: 2 },
  { id: 'b', type: 'tf', prompt: 'س2', answer: 'صح', points: 1 },
  { id: 'c', type: 'essay', prompt: 'س3', keywords: ['مفتاح'], points: 5 }
];
const papers = [
  { studentId: 's1', studentName: 'طالب1', answers: { a: 'x', b: 'صح', c: 'مفتاح' } },
  { studentId: 's2', studentName: 'طالب2', answers: { a: 'y', b: 'خطأ', c: 'لا شيء' } },
  { studentId: 's3', studentName: 'طالب3', answers: { a: 'x', b: 'صح', c: '' } }
];
const res = analyzeClass(questions, papers);
ok(res.stats.count === 3, 'عدد الأوراق');
ok(res.perQuestion.length === 3, 'تحليل لكل سؤال');
ok(res.stats.passCount >= 1, 'عدد الناجحين');
ok(res.remedial.length >= 1, 'خطة علاجية مولّدة');
const paper = gradePaper(questions, { a: 'x', b: 'صح', c: 'مفتاح' });
ok(paper.totalMax === 8, 'مجموع الدرجات');
ok(paper.earned === 8, 'الدرجة المحصلة');
ok(paper.percent === 100, 'النسبة المئوية');

// --- السجلات والأدوات ---
const csv = parseStudentsCsv('محمد أحمد\nعلي صالح, 3\n\n  فاطمة عبدالله ، 4');
ok(csv.length === 3, 'قراءة كشف الطلاب');
ok(String(csv[1].seat) === '3', 'رقم الجلوس بفاصلة إنجليزية');
ok(csv[2].name === 'فاطمة عبدالله', 'اسم بفاصلة عربية');
ok(String(csv[2].seat) === '4', 'رقم الجلوس بفاصلة عربية');
const quiz = generateSampleQuiz({ subjectName: 'الرياضيات', title: 'المعادلات', type: 'mcq', count: 4 });
ok(quiz.length === 4, 'أسئلة نموذجية');
ok(quiz.every((q) => q.options && q.options.length >= 2 && q.answer), 'بنية السؤال النموذجي');
ok(pct(50, 100) === 50, 'حساب النسبة');
ok(pct(0, 0) === 0, 'حماية القسمة على صفر');
ok(arabicNumber(7) === '٧', 'تحويل الأرقام للعربية');
ok(slugify('اختبار الوحدة 1') === 'اختبار_الوحدة_1', 'تنظيف اسم الملف');
ok(lastNDates(5).length === 5, 'آخر التواريخ');
ok(normalizeArabic('أحمد') === normalizeArabic('احمد'), 'تطبيع الألف');

// --- كراسة التحضير ---
const wp = buildWeeklyPlan({ grade: 7, subjectId: 'arabic', weeks: 16, startDate: '2025-09-01' });
ok(wp.length === 16, 'الخطة الأسبوعية 16 أسبوعاً');
ok(wp.every((w) => w.lesson && w.unitTitle && w.homework), 'كل أسبوع له بيانات');
ok(wp[0].date === '2025-09-01', 'تاريخ الأسبوع الأول');
ok(wp[1].date === '2025-09-08', 'تاريخ الأسبوع الثاني (+7 أيام)');
const cov = buildCoverage({ grade: 7, subjectId: 'arabic', weeklyPlan: wp });
ok(cov.length > 0, 'مواءمة المنهج لها وحدات');
ok(cov.every((u) => u.lessons.every((l) => 'week' in l)), 'كل درس له حقل أسبوع');
const nb = buildNotebook({ subjectId: 'math', grade: 9, weeks: 12, startDate: '2025-09-01', teacherName: 'أ. محمد', school: 'مدرسة الشهيد' });
ok(nb.meta.gradeName === 'الصف التاسع', 'اسم الصف في الكراسة');
ok(nb.meta.termName === termName('term1'), 'اسم الفصل الدراسي');
ok(nb.weeklyPlan.length === 12, 'عدد أسابيع الكراسة');
ok(nb.samplePlan && nb.samplePlan.objectives.length >= 3, 'نموذج تحضير داخل الكراسة');
const nst = notebookStats(nb);
ok(nst.weeks === 12 && nst.lessons + nst.review === 12, 'إحصاء الكراسة متوازن');
const nmd = notebookToMarkdown(nb);
ok(nmd.includes('كراسة التحضير') && nmd.includes('الخطة الأسبوعية') && nmd.includes('مدرسة الشهيد'), 'تصدير الكراسة Markdown');
const ncsv = notebookToCsv(nb);
ok(ncsv.split('\r\n').length === 13, 'تصدير الكراسة CSV (رأس + 12 أسبوع)');

// --- حساب المالك (رمز الدخول) ---
const saltA = randomSalt();
const saltB = randomSalt();
ok(saltA !== saltB, 'توليد ملح عشوائي مختلف');
ok(hashPin('1234', saltA) === hashPin('1234', saltA), 'تلبيد الرمز ثابت لنفس الملح');
ok(hashPin('1234', saltA) !== hashPin('1234', saltB), 'الملح يغيّر الناتج');
ok(hashPin('1234', saltA) !== hashPin('4321', saltA), 'الرمز الخاطئ لا يطابق');
ok(hashPin('1234', saltA).length > 0, 'ناتج التلبيد غير فارغ');

// --- بنك أسئلة ألعاب الرياضيات ---
import { pool, metaOf, GAME_META, GRADE_BANDS, ALL_TYPES } from '../src/lib/mathBank.js';
ok(GAME_META.length === 6, 'ستة أنواع ألعاب');
ok(GRADE_BANDS.length === 4, 'أربع مراحل دراسية للألعاب');
for (const b of GRADE_BANDS) {
  const mc = pool(b.id, 'mc', 'medium');
  ok(mc.length >= 10, `أسئلة اختيار كافية — ${b.id}`);
  ok(mc.every((it) => it.t === 'mc' && it.choices.length === 4 && it.a >= 0 && it.a < 4), `صحة أسئلة الاختيار — ${b.id}`);
  const tf = pool(b.id, 'tf', 'medium');
  ok(tf.length >= 8 && tf.every((it) => typeof it.a === 'boolean'), `أسئلة صح/خطأ — ${b.id}`);
  const num = pool(b.id, 'num', 'easy');
  ok(num.length >= 8 && num.every((it) => typeof it.a === 'number'), `أسئلة إدخال رقمي — ${b.id}`);
  const pr = pool(b.id, 'pairs', 'medium');
  ok(pr.length >= 1 && pr.every((r) => r.pairs.length === 4), `جولات المطابقة — ${b.id}`);
  const ord = pool(b.id, 'order', 'medium');
  ok(ord.length >= 1 && ord.every((r) => r.values.length >= 4), `جولات الترتيب — ${b.id}`);
}
ok(ALL_TYPES.length === 5, 'خمسة أنواع أسئلة');
ok(metaOf('arcade').timed === 60, 'سباق الوقت ٦٠ ثانية');
ok(metaOf('quiz').id === 'quiz', 'استرجاع بيانات اللعبة');

// --- بنك أسئلة «اختبر معرفتك بالمنصة» ---
import { QUIZ_QUESTIONS, TOTAL_QUESTIONS, EVIDENCE_ANCHORS, QUIZ_META } from '../src/data/platformQuiz.js';
ok(TOTAL_QUESTIONS >= 10, 'عدد أسئلة المنصة ' + TOTAL_QUESTIONS);
ok(QUIZ_META.title.length > 0 && QUIZ_META.intro.length > 0, 'عنوان ومقدمة الاختبار');
for (const q of QUIZ_QUESTIONS) {
  ok(q.options.length === 4, `السؤال «${q.id}» له 4 خيارات`);
  ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `فهرس الإجابة صحيح — ${q.id}`);
  ok(q.evidence && q.evidence.quote.length > 10, `الدليل موجود — ${q.id}`);
  ok(q.evidence && EVIDENCE_ANCHORS[q.evidence.anchor], `مرساة الدليل صحيحة — ${q.id}`);
  ok(new Set(q.options).size === q.options.length, `لا تكرار في الخيارات — ${q.id}`);
}
ok(QUIZ_QUESTIONS.every((q) => q.evidence.source.length > 0), 'لكل سؤال مصدر للدليل');

// --- الكتاب الرقمي (رفيق الطالب) ---
import { buildBook, flattenPages, openAt, searchLessons } from '../src/lib/bookEngine.js';
const bk = buildBook({ grade: 1, subjectId: 'arabic' });
ok(bk.totalLessons > 0 && bk.totalPages > 0, 'الكتاب يحتوي دروساً وصفحات');
ok(flattenPages(bk).length === bk.totalPages, 'عدد الصفحات المسطّحة = إجمالي الصفحات');
const firstPage = openAt(bk, { page: 1 });
ok(firstPage && firstPage.page === 1, 'فتح الكتاب على الصفحة 1');
const byName = openAt(bk, { name: 'الحروف' });
ok(byName && byName.lesson.length > 0, 'فتح الكتاب باسم الدرس');
ok(searchLessons(bk, 'الحروف').length > 0, 'البحث عن درس بالاسم');
const bk12 = buildBook({ grade: 12, subjectId: 'math' });
ok(bk12.totalLessons > 0, 'كتاب الصف الثالث ثانوي (رياضيات)');
const allPages = flattenPages(bk);
ok(allPages.every((p) => p.page >= 1 && p.lesson && p.chapter), 'كل صفحة لها رقم ودرس ووحدة');

// --- الشرح الصوتي باللهجة اليمنية ---
import { toYemeni, narrationForLesson, pickArabicVoice, speechSupported } from '../src/lib/voice.js';
ok(toYemeni('ماذا تفعل الآن؟').includes('إيش'), 'استبدال «ماذا» بـ«إيش»');
ok(toYemeni('لماذا؟').includes('ليش'), 'استبدال «لماذا» بـ«ليش»');
ok(narrationForLesson(allPages.slice(0, 3)).length > 20, 'بناء نصّ الشرح من الصفحات');
const vYe = pickArabicVoice([{ lang: 'en-US' }, { lang: 'ar-YE' }, { lang: 'ar-SA' }]);
ok(vYe && vYe.lang === 'ar-YE', 'اختيار اللهجة اليمنية أولاً');
const vSa = pickArabicVoice([{ lang: 'en-US' }, { lang: 'ar-SA' }]);
ok(vSa && vSa.lang === 'ar-SA', 'الرجوع لأقرب لهجة عربية');
ok(pickArabicVoice([{ lang: 'en-US' }]) === null, 'لا صوت عربي متاح');

// --- محرّك الأسئلة والأجوبة ---
import { askQuestion, suggestedQuestions } from '../src/lib/qnaEngine.js';
const ansHit = askQuestion({ question: 'إيش معنى الحروف الهجائية؟', grade: 1, subjectId: 'arabic' });
ok(ansHit.short && ansHit.short.length > 0, 'إجابة مختصرة موجودة');
ok(ansHit.grounded === true, 'الإجابة مستندة إلى الكتاب');
const ansMiss = askQuestion({ question: 'xyzabc nonsensical', grade: 1, subjectId: 'arabic' });
ok(ansMiss.needsTeacher === true, 'سؤال غير معروف يُحوّل للمعلم');
ok(suggestedQuestions('المعادلات').length === 4, 'أربعة أسئلة مقترحة');

// --- المحتوى المنهجي الحقيقي المُجمَّع من مصادر مفتوحة ---
import { SOURCED_QUESTIONS, SOURCES, SOURCED_UNITS, sourcedUnitsFor } from '../src/data/sourcedContent.js';
ok(SOURCES.length === 2, 'مصدران موثّقان (خطى المتفوقين + quiz9)');
ok(SOURCES.every((s) => s.repo && s.url && s.license), 'كل مصدر يحمل نسبة ورخصة');
ok(SOURCED_QUESTIONS.length === 18, 'بنك أسئلة حقيقي بـ18 سؤالاً');
ok(SOURCED_QUESTIONS.every((q) => q.options.length === 4), 'كل سؤال له 4 خيارات');
ok(SOURCED_QUESTIONS.every((q) => q.options.includes(q.answer)), 'الإجابة الصحيحة ضمن الخيارات');
ok(new Set(SOURCED_QUESTIONS.map((q) => q.prompt)).size === 18, 'لا أسئلة مكررة');
ok(SOURCED_QUESTIONS.every((q) => q.source === 'quiz9' && q.grade === 9 && q.subjectId === 'math'), 'وسم المصدر والصف والمادة');
const math12 = getUnits(12, 'math');
ok(math12.some((u) => u.sourced && u.title.includes('الأعداد المركبة')), 'وحدة «الأعداد المركبة» مدرجة في منهج الرياضيات ثالث ثانوي');
ok(math12.find((u) => u.sourced).lessons.length === 6, 'الوحدة المصدرية فيها 6 دروس');
ok(sourcedUnitsFor(12, 'math') && !sourcedUnitsFor(5, 'math'), 'sourcedUnitsFor يخصّ الصف 12 فقط');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
