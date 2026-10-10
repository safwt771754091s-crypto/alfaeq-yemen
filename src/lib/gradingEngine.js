import { normalizeArabic, pct, round1 } from './utils.js';
import { estimateLabel } from '../data/curriculum.js';

// ============ أنواع الأسئلة ============
export const QUESTION_TYPES = {
  mcq: { id: 'mcq', name: 'اختيار من متعدد', icon: '🔘', auto: true },
  tf: { id: 'tf', name: 'صح وخطأ', icon: '✔️', auto: true },
  essay: { id: 'essay', name: 'مقالي قصير', icon: '📝', auto: false }
};

// ============ تصحيح سؤال واحد ============
export function gradeQuestion(question, answer) {
  const max = Number(question.points) || 1;
  if (question.type === 'mcq') {
    const correct = normalizeArabic(question.answer);
    const given = normalizeArabic(answer);
    if (!given) return { score: 0, max, correct: false, answered: false, auto: true };
    // دعم مطابقة نص الخيار أو رقمه/حرفه
    const idx = (question.options || []).findIndex((o) => normalizeArabic(o) === given);
    let isCorrect = given === correct;
    if (!isCorrect && idx >= 0) {
      const correctIdx = (question.options || []).findIndex((o) => normalizeArabic(o) === correct);
      if (correctIdx >= 0) isCorrect = idx === correctIdx;
      else isCorrect = normalizeArabic('abc'[idx]) === correct || String(idx + 1) === question.answer;
    }
    return { score: isCorrect ? max : 0, max, correct: isCorrect, answered: true, auto: true };
  }
  if (question.type === 'tf') {
    const given = normalizeArabic(answer);
    if (!given) return { score: 0, max, correct: false, answered: false, auto: true };
    const isCorrect = given === normalizeArabic(question.answer);
    return { score: isCorrect ? max : 0, max, correct: isCorrect, answered: true, auto: true };
  }
  // مقالي: تصحيح بمساعدة الكلمات المفتاحية
  const given = normalizeArabic(answer);
  if (!given) return { score: 0, max, correct: false, answered: false, auto: false, matched: [], missed: question.keywords || [] };
  const keywords = (question.keywords || []).map((k) => ({ raw: k, n: normalizeArabic(k) })).filter((k) => k.n);
  if (!keywords.length) {
    return { score: null, max, correct: null, answered: true, auto: false, needsManual: true, matched: [], missed: [] };
  }
  const matched = keywords.filter((k) => given.includes(k.n)).map((k) => k.raw);
  const missed = keywords.filter((k) => !given.includes(k.n)).map((k) => k.raw);
  const ratio = matched.length / keywords.length;
  let score = round1(max * ratio);
  // إثراء بسيط مقابل الطول المناسب
  if (ratio >= 0.6 && given.split(' ').length >= 8) score = round1(Math.min(max, score + max * 0.1));
  return {
    score: Math.min(max, score),
    max,
    correct: ratio >= 0.6,
    answered: true,
    auto: false,
    matched,
    missed,
    needsManual: ratio > 0 && ratio < 0.6
  };
}

// ============ تصحيح ورقة إجابة كاملة ============
export function gradePaper(questions, answers) {
  const results = questions.map((q) => {
    const r = gradeQuestion(q, answers[q.id]);
    return { questionId: q.id, type: q.type, prompt: q.prompt, ...r };
  });
  const totalMax = questions.reduce((a, q) => a + (Number(q.points) || 1), 0);
  const earned = results.reduce((a, r) => a + (r.score || 0), 0);
  const autoMax = results.filter((r) => r.auto).reduce((a, r) => a + r.max, 0);
  const autoEarned = results.filter((r) => r.auto).reduce((a, r) => a + (r.score || 0), 0);
  const percent = pct(earned, totalMax);
  const estimate = estimateLabel(percent);
  return {
    results,
    totalMax,
    earned: round1(earned),
    percent,
    estimate,
    autoMax,
    autoEarned: round1(autoEarned),
    autoAccuracy: pct(autoEarned, autoMax),
    needsManual: results.some((r) => r.needsManual || (r.auto === false && r.score == null))
  };
}

// ============ تحليل أداء صف كامل ============
export function analyzeClass(questions, papers) {
  // papers: [{ studentId, studentName, answers }]
  const graded = papers.map((p) => ({
    ...p,
    grade: gradePaper(questions, p.answers || {})
  }));

  const perQuestion = questions.map((q) => {
    const max = Number(q.points) || 1;
    let correct = 0, attempted = 0, earnedSum = 0;
    graded.forEach((g) => {
      const r = g.grade.results.find((x) => x.questionId === q.id);
      if (!r) return;
      if (r.answered) attempted++;
      if (r.correct) correct++;
      earnedSum += r.score || 0;
    });
    const n = graded.length || 1;
    const successRate = pct(correct, n);
    return {
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      correct,
      attempted,
      total: graded.length,
      successRate,
      avgScore: round1(earnedSum / n),
      max,
      difficulty: successRate >= 75 ? 'سهل' : successRate >= 50 ? 'متوسط' : 'صعب'
    };
  });

  const scores = graded.map((g) => g.grade.percent);
  const avg = scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted.length
    ? sorted.length % 2
      ? sorted[Math.floor(sorted.length / 2)]
      : round1((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
    : 0;
  const passCount = scores.filter((s) => s >= 50).length;
  const failCount = scores.length - passCount;
  const highest = sorted.length ? sorted[sorted.length - 1] : 0;
  const lowest = sorted.length ? sorted[0] : 0;
  const stdDev = scores.length
    ? round1(Math.sqrt(scores.reduce((a, s) => a + (s - avg) ** 2, 0) / scores.length))
    : 0;

  // توزيع التقديرات
  const distribution = {};
  graded.forEach((g) => {
    const l = g.grade.estimate.label;
    distribution[l] = (distribution[l] || 0) + 1;
  });

  // نقاط الضعف: أسئلة نجاحها منخفض
  const weakQuestions = perQuestion
    .filter((q) => q.successRate < 60)
    .sort((a, b) => a.successRate - b.successRate);

  // الطلاب المتعثرون
  const struggling = graded
    .filter((g) => g.grade.percent < 50)
    .sort((a, b) => a.grade.percent - b.grade.percent)
    .map((g) => ({ studentId: g.studentId, studentName: g.studentName, percent: g.grade.percent }));

  // الطلاب المتفوقون
  const topStudents = graded
    .filter((g) => g.grade.percent >= 80)
    .sort((a, b) => b.grade.percent - a.grade.percent)
    .map((g) => ({ studentId: g.studentId, studentName: g.studentName, percent: g.grade.percent }));

  return {
    graded,
    perQuestion,
    stats: {
      count: graded.length,
      avg,
      median,
      highest,
      lowest,
      stdDev,
      passCount,
      failCount,
      passRate: pct(passCount, graded.length)
    },
    distribution,
    weakQuestions,
    struggling,
    topStudents,
    remedial: buildRemedialPlan(perQuestion, struggling)
  };
}

// ============ توليد خطة علاجية مقترحة ============
function buildRemedialPlan(perQuestion, struggling) {
  const plan = [];
  const byType = { mcq: [], tf: [], essay: [] };
  perQuestion.filter((q) => q.successRate < 70).forEach((q) => byType[q.type]?.push(q));

  if (byType.mcq.length) {
    plan.push({
      area: 'المفاهيم الأساسية (الاختيار من متعدد)',
      reason: `ضعف في ${byType.mcq.length} سؤال/أسئلة مفاهيمية`,
      activities: [
        'إعادة شرح المفاهيم التي كثر فيها الخطأ بأمثلة محسوسة.',
        'استخدام الخرائط الذهنية لربط المفاهيم ببعضها.',
        'تدريبات قصيرة متكررة (10 دقائق) في بداية كل حصة.',
        'تكليف الطلاب المتعثرين بتمارين إثرائية بسيطة.'
      ]
    });
  }
  if (byType.tf.length) {
    plan.push({
      area: 'الدقة في المفاهيم (صح وخطأ)',
      reason: 'الخلط بين المفاهيم المتقاربة',
      activities: [
        'أنشطة المقارنة والتمييز بين المفاهيم المتشابهة.',
        'لعبة «صح أم خطأ» جماعية مع تعليل الإجابة.',
        'جدول مقارنة مفاهيمي يملأه الطلاب بأنفسهم.'
      ]
    });
  }
  if (byType.essay.length) {
    plan.push({
      area: 'التعبير والكتابة (الأسئلة المقالية)',
      reason: 'قصور في التنظيم واستخدام المصطلحات',
      activities: [
        'تدريب الطلاب على بناء فقرة منظمة (مقدمة/عرض/خاتمة).',
        'بنك كلمات ومصطلحات أساسية لكل درس.',
        'تصحيح جماعي لنموذج إجابة ومناقشة معايير التقدير.',
        'تدريبات كتابة قصيرة أسبوعية مع تغذية راجعة.'
      ]
    });
  }
  if (struggling.length) {
    plan.push({
      area: `متابعة الطلاب المتعثرين (${struggling.length} طالب)`,
      reason: 'نتائج أقل من حد النجاح (50%)',
      activities: [
        'تشكيل مجموعة تقوية أسبوعية.',
        'متابعة فردية وتكليف بمهام متدرجة الصعوبة.',
        'التواصل مع أولياء الأمور لمتابعة التحصيل.',
        'إعادة تقييم بعد أسبوعين لقياس التقدم.'
      ]
    });
  }
  if (!plan.length) {
    plan.push({
      area: 'تعزيز المستوى العام',
      reason: 'أداء الصف جيد بشكل عام',
      activities: [
        'أنشطة إثرائية للطلاب المتفوقين.',
        'مشاريع تطبيقية تربط المادة بالواقع.',
        'مسابقات صفية تحفيزية.'
      ]
    });
  }
  return plan;
}

// ============ بناء اختبار تجريبي تلقائياً من المنهج ============
// يبني أسئلة تجريبية (نموذج) قابلة للتعديل لمساعدة المعلم
export function generateSampleQuiz({ subjectName, title, type = 'mcq', count = 5 }) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    if (type === 'mcq') {
      items.push({
        id: `q${i}`,
        type: 'mcq',
        prompt: `سؤال ${i} حول «${title}»: اختر الإجابة الصحيحة.`,
        options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
        answer: 'الخيار الأول',
        points: 2
      });
    } else if (type === 'tf') {
      items.push({
        id: `q${i}`,
        type: 'tf',
        prompt: `عبارة ${i} حول «${title}».`,
        answer: 'صح',
        points: 1
      });
    } else {
      items.push({
        id: `q${i}`,
        type: 'essay',
        prompt: `اشرح بإيجاز: ${title} (النقطة ${i}).`,
        answer: '',
        keywords: [],
        points: 5
      });
    }
  }
  return items;
}

// ============ تحويل CSV لاستيراد الطلاب ============
export function parseStudentsCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const out = [];
  lines.forEach((line, i) => {
    const parts = line.split(/[,،;؛\t]+/).map((s) => s.trim());
    if (i === 0 && /اسم|name|الطالب/i.test(parts[0]) && parts.length <= 2) return; // تخطي الترويسة
    const name = parts[0];
    if (!name) return;
    out.push({ name, seat: parts[1] || '', note: parts[2] || '' });
  });
  return out;
}
