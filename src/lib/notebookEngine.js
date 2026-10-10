// محرّك كراسة التحضير الفصلية — يبني خطة أسبوعية ومواءمة منهج ونماذج تحضير جاهزة للطباعة
import { SUBJECTS, gradeName, gradeCycle, getUnits } from '../data/curriculum.js';
import { generateLessonPlan } from './lessonEngine.js';

export const TERMS = [
  { id: 'term1', name: 'الفصل الدراسي الأول', defaultWeeks: 16 },
  { id: 'term2', name: 'الفصل الدراسي الثاني', defaultWeeks: 16 }
];

export function termName(id) {
  return (TERMS.find((t) => t.id === id) || TERMS[0]).name;
}

function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function objectivesFor(lesson, subjectName) {
  return [
    `أن يتعرّف الطالب على المفاهيم الأساسية في «${lesson}».`,
    `أن يشرح الطالب العلاقات والأنماط المرتبطة بـ«${lesson}» في مادة ${subjectName}.`,
    `أن يطبّق الطالب ما تعلّمه في «${lesson}» على مواقف جديدة.`
  ];
}

// بناء الخطة الأسبوعية بتوزيع دروس المنهج على الأسابيع
export function buildWeeklyPlan({ grade, subjectId, weeks = 16, startDate }) {
  const subject = SUBJECTS[subjectId];
  const subjectName = subject ? subject.name : 'المادة';
  const units = getUnits(grade, subjectId);
  const flat = units.flatMap((u) => u.lessons.map((l) => ({ unitTitle: u.title, lesson: l })));

  const plan = [];
  for (let w = 1; w <= weeks; w++) {
    const item = flat[w - 1];
    const date = startDate ? addDays(startDate, (w - 1) * 7) : '';
    if (item) {
      plan.push({
        week: w,
        date,
        kind: 'درس',
        unitTitle: item.unitTitle,
        lesson: item.lesson,
        objectives: objectivesFor(item.lesson, subjectName),
        homework: `تمارين على «${item.lesson}» (أساسية + إثرائية).`
      });
    } else {
      plan.push({
        week: w,
        date,
        kind: 'مراجعة/تقويم',
        unitTitle: 'مراجعة عامة',
        lesson: 'مراجعة وتقويم ختامي',
        objectives: ['مراجعة الوحدات السابقة.', 'تقويم مدى تحقّق الأهداف.'],
        homework: 'مراجعة شاملة استعداداً للاختبار.'
      });
    }
  }
  return plan;
}

// مواءمة المنهج: توزيع الوحدات على الأسابيع حسب الخطة
export function buildCoverage({ grade, subjectId, weeklyPlan }) {
  const units = getUnits(grade, subjectId);
  return units.map((u) => ({
    unitTitle: u.title,
    lessons: u.lessons.map((lesson) => {
      const row = weeklyPlan.find((p) => p.lesson === lesson);
      return { lesson, week: row ? row.week : null };
    })
  }));
}

// ملخّص إحصائي للكراسة
export function notebookStats(notebook) {
  const lessons = notebook.weeklyPlan.filter((w) => w.kind === 'درس').length;
  const units = notebook.coverage.length;
  return {
    weeks: notebook.weeklyPlan.length,
    lessons,
    units,
    review: notebook.weeklyPlan.length - lessons
  };
}

export function buildNotebook({
  subjectId,
  grade,
  section = 'scientific',
  term = 'term1',
  academicYear = '1447هـ / 2025-2026م',
  weeks = 16,
  startDate = '',
  teacherName = '',
  school = '',
  governorate = '',
  directorate = ''
}) {
  const weeklyPlan = buildWeeklyPlan({ grade, subjectId, weeks, startDate });
  const coverage = buildCoverage({ grade, subjectId, weeklyPlan });
  const subject = SUBJECTS[subjectId];
  const samplePlan = generateLessonPlan({
    subjectId,
    grade,
    title: weeklyPlan.find((w) => w.kind === 'درس')?.lesson || 'درس تجريبي',
    duration: 45,
    section
  });

  return {
    id: `nb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    meta: {
      subjectId,
      subjectName: subject ? subject.name : 'المادة',
      grade,
      gradeName: gradeName(grade),
      cycle: gradeCycle(grade),
      section,
      term,
      termName: termName(term),
      academicYear,
      weeks,
      startDate,
      teacherName,
      school,
      governorate,
      directorate
    },
    weeklyPlan,
    coverage,
    samplePlan,
    createdAt: new Date().toISOString()
  };
}

function mdTable(headers, rows) {
  const out = [];
  out.push(`| ${headers.join(' | ')} |`);
  out.push(`| ${headers.map(() => '---').join(' | ')} |`);
  rows.forEach((r) => out.push(`| ${r.join(' | ')} |`));
  return out.join('\n');
}

export function notebookToMarkdown(nb) {
  const m = nb.meta;
  const L = [];
  L.push('# كراسة التحضير الفصلية');
  L.push('');
  L.push(`**الجمهورية اليمنية — وزارة التربية والتعليم**`);
  L.push('');
  L.push(mdTable(['البند', 'البيان'], [
    ['المادة', m.subjectName],
    ['الصف', m.gradeName],
    ['الحلقة/المرحلة', m.cycle],
    ['الفصل الدراسي', m.termName],
    ['العام الدراسي', m.academicYear],
    ['المعلم', m.teacherName || '—'],
    ['المدرسة', m.school || '—'],
    ['المديرية', m.directorate || '—'],
    ['المحافظة', m.governorate || '—']
  ]));
  L.push('');
  L.push('## الخطة الأسبوعية');
  L.push('');
  L.push(mdTable(
    ['الأسبوع', 'التاريخ', 'النوع', 'الوحدة', 'الدرس', 'الواجب'],
    nb.weeklyPlan.map((w) => [w.week, w.date || '—', w.kind, w.unitTitle, w.lesson, w.homework])
  ));
  L.push('');
  L.push('## مواءمة المنهج (توزيع الوحدات على الأسابيع)');
  L.push('');
  nb.coverage.forEach((u) => {
    L.push(`### ${u.unitTitle}`);
    u.lessons.forEach((l) => L.push(`- ${l.lesson}${l.week ? ` — الأسبوع ${l.week}` : ''}`));
    L.push('');
  });
  L.push('## نموذج تحضير درس');
  const sp = nb.samplePlan;
  L.push(`**${sp.title}** — ${sp.subjectName} • ${sp.gradeName} • ${sp.duration} دقيقة`);
  L.push('');
  L.push('### الأهداف');
  sp.objectives.forEach((o) => L.push(`- ${o}`));
  L.push('');
  L.push('### خطوات سير الدرس');
  sp.phases.forEach((p) => L.push(`- (${p.minutes} د) **${p.name}:** ${p.activity}`));
  L.push('');
  return L.join('\n');
}

export function notebookToCsv(nb) {
  const head = ['الأسبوع', 'التاريخ', 'النوع', 'الوحدة', 'الدرس', 'الأهداف', 'الواجب'];
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = nb.weeklyPlan.map((w) => [
    w.week, w.date, w.kind, w.unitTitle, w.lesson, w.objectives.join(' / '), w.homework
  ]);
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}
