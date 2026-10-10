// اختبارات وحدة لمحرّكات المنصة (تعمل عبر node مباشرة دون أي تبعيات).
// التشغيل: npm test
import { generateLessonPlan, generateSlides, slidesToMarkdown, slidesToPptx } from '../src/lib/lessonEngine.js';
import { analyzeClass, gradeQuestion, gradePaper, parseStudentsCsv, generateSampleQuiz } from '../src/lib/gradingEngine.js';
import { estimateLabel, subjectsForGrade, getUnits, getLessons, GRADES } from '../src/data/curriculum.js';
import { pct, arabicNumber, slugify, lastNDates, normalizeArabic } from '../src/lib/utils.js';

let pass = 0;
let fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FAIL:', msg); } };

// --- المنهج اليمني ---
ok(GRADES.length === 12, 'الصفوف من 1 إلى 12');
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
