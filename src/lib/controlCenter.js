// محرّك مركز التحكم — وصف موحّد لكل أنواع المحتوى مع عمليات إضافة/تعديل/دمج/حذف.
// يعمل فوق حالة التطبيق (store) فلا يحتاج إعادة تحميل.
import { GRADES, gradeName, SUBJECTS } from '../data/curriculum.js';

const gradeOptions = GRADES.map((g) => ({ value: g.n, label: g.label }));
const subjectOptions = Object.values(SUBJECTS).map((s) => ({ value: s.id, label: s.name }));

// وصف الحقول لكل نوع (يُستخدم لبناء نماذج الإضافة/التعديل تلقائياً)
export const ENTITIES = [
  {
    key: 'classes', label: 'الصفوف', icon: 'Users', title: (x) => x.name || gradeName(x.grade),
    subtitle: (x) => gradeName(x.grade), search: (x) => `${x.name} ${x.grade}`,
    fields: [
      { k: 'name', label: 'اسم الصف', type: 'text', required: true },
      { k: 'grade', label: 'الصف الدراسي', type: 'select', options: gradeOptions },
      { k: 'section', label: 'القسم', type: 'select', options: [{ value: 'basic', label: 'أساسي' }, { value: 'scientific', label: 'علمي' }, { value: 'literary', label: 'أدبي' }] }
    ]
  },
  {
    key: 'students', label: 'الطلاب', icon: 'GraduationCap', title: (x) => x.name,
    subtitle: (x) => x.className || '', search: (x) => `${x.name} ${x.className} ${x.seatNo}`,
    fields: [
      { k: 'name', label: 'اسم الطالب', type: 'text', required: true },
      { k: 'className', label: 'الصف', type: 'text' },
      { k: 'seatNo', label: 'رقم الجلوس', type: 'text' },
      { k: 'phone', label: 'الجوال', type: 'text' }
    ]
  },
  {
    key: 'lessons', label: 'التحضيرات', icon: 'Sparkles', title: (x) => x.title,
    subtitle: (x) => `${x.subjectName || x.subject || ''} ${x.grade ? gradeName(x.grade) : ''}`.trim(),
    search: (x) => `${x.title} ${x.subjectName} ${x.subject}`,
    fields: [
      { k: 'title', label: 'عنوان الدرس', type: 'text', required: true },
      { k: 'subject', label: 'المادة', type: 'select', options: subjectOptions },
      { k: 'grade', label: 'الصف', type: 'select', options: gradeOptions }
    ]
  },
  {
    key: 'notebooks', label: 'كراسات التحضير', icon: 'Clipboard', title: (x) => x.title || (x.meta ? `${x.meta.subjectName} ${x.meta.gradeName}` : 'كراسة'),
    subtitle: (x) => x.meta?.term || '', search: (x) => `${x.title} ${x.meta?.subjectName} ${x.meta?.gradeName}`,
    fields: [
      { k: 'title', label: 'العنوان', type: 'text', required: true }
    ]
  },
  {
    key: 'presentations', label: 'العروض التقديمية', icon: 'Slides', title: (x) => x.title,
    subtitle: (x) => `${(x.slides || []).length} شريحة`, search: (x) => `${x.title}`,
    fields: [
      { k: 'title', label: 'العنوان', type: 'text', required: true },
      { k: 'subject', label: 'المادة', type: 'select', options: subjectOptions }
    ]
  },
  {
    key: 'quizzes', label: 'الاختبارات', icon: 'CheckCircle', title: (x) => x.title,
    subtitle: (x) => `${(x.questions || []).length} سؤال`, search: (x) => `${x.title}`,
    fields: [
      { k: 'title', label: 'العنوان', type: 'text', required: true },
      { k: 'subject', label: 'المادة', type: 'select', options: subjectOptions }
    ]
  },
  {
    key: 'assessments', label: 'التقييمات', icon: 'Chart', title: (x) => x.title || x.name,
    subtitle: (x) => `${x.max || ''}`, search: (x) => `${x.title} ${x.name}`,
    fields: [
      { k: 'title', label: 'العنوان', type: 'text', required: true },
      { k: 'max', label: 'الدرجة العظمى', type: 'number' }
    ]
  },
  {
    key: 'certificates', label: 'الشهادات', icon: 'Award', title: (x) => x.studentName || x.title,
    subtitle: (x) => x.kind || '', search: (x) => `${x.studentName} ${x.title}`,
    fields: [
      { k: 'studentName', label: 'اسم الطالب', type: 'text', required: true },
      { k: 'title', label: 'العنوان', type: 'text' }
    ]
  },
  { key: 'library', label: 'المكتبة', icon: 'Library', title: (x) => x.title || x.name, search: (x) => `${x.title} ${x.name}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text', required: true }, { k: 'url', label: 'الرابط', type: 'text' }] },
  { key: 'designs', label: 'التصاميم', icon: 'Palette', title: (x) => x.title || x.name, search: (x) => `${x.title} ${x.name}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text', required: true }] },
  { key: 'timetable', label: 'الجدول الدراسي', icon: 'Calendar', title: (x) => x.subject || x.title, search: (x) => `${x.subject} ${x.title} ${x.day}`,
    fields: [{ k: 'subject', label: 'المادة', type: 'text', required: true }, { k: 'day', label: 'اليوم', type: 'text' }] },
  { key: 'reminders', label: 'الإشعارات', icon: 'Bell', title: (x) => x.title || x.text, search: (x) => `${x.title} ${x.text}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text', required: true }, { k: 'text', label: 'النص', type: 'textarea' }] },
  { key: 'community', label: 'المجتمع', icon: 'Users', title: (x) => x.title || x.text, search: (x) => `${x.title} ${x.text}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text' }, { k: 'text', label: 'النص', type: 'textarea', required: true }] },
  { key: 'messages', label: 'الرسائل', icon: 'Message', title: (x) => x.title || x.text, search: (x) => `${x.title} ${x.text}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text' }, { k: 'text', label: 'النص', type: 'textarea', required: true }] },
  { key: 'training', label: 'التدريب', icon: 'GraduationCap', title: (x) => x.title, search: (x) => `${x.title}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text', required: true }, { k: 'text', label: 'الوصف', type: 'textarea' }] },
  { key: 'announcements', label: 'الإعلانات', icon: 'Megaphone', title: (x) => x.title, search: (x) => `${x.title} ${x.text}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text', required: true }, { k: 'text', label: 'النص', type: 'textarea' }, { k: 'audience', label: 'الجمهور', type: 'select', options: [{ value: 'all', label: 'الجميع' }, { value: 'teachers', label: 'المعلمون' }, { value: 'students', label: 'الطلاب' }] }] },
  { key: 'followups', label: 'المتابعة', icon: 'ListChecks', title: (x) => x.title || x.name, search: (x) => `${x.title} ${x.name}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text', required: true }, { k: 'note', label: 'ملاحظة', type: 'textarea' }] },
  { key: 'games', label: 'ألعاب الرياضيات', icon: 'Gamepad', title: (x) => x.title || x.name, search: (x) => `${x.title} ${x.name}`,
    fields: [{ k: 'title', label: 'العنوان', type: 'text', required: true }] }
];

export function entityByKey(key) { return ENTITIES.find((e) => e.key === key) || null; }

// يبني واجهة موحّدة (list/add/update/remove) لكل نوع من حالة التطبيق
export function entityApi(app) {
  const main = {
    classes: [app.classes, app.addClass, app.updateClass, app.deleteClass],
    students: [app.students, app.addStudent, app.updateStudent, app.deleteStudent],
    lessons: [app.lessons, app.addLesson, app.updateLesson, app.deleteLesson],
    notebooks: [app.notebooks, app.addNotebook, app.updateNotebook, app.deleteNotebook],
    presentations: [app.presentations, app.addPresentation, app.updatePresentation, app.deletePresentation],
    quizzes: [app.quizzes, app.addQuiz, app.updateQuiz, app.deleteQuiz],
    assessments: [app.assessments, app.addAssessment, app.updateAssessment, app.deleteAssessment],
    certificates: [app.certificates, app.addCertificate, app.updateCertificate, app.deleteCertificate]
  };
  const coll = ['library', 'designs', 'timetable', 'reminders', 'community', 'messages', 'training', 'announcements', 'followups', 'games'];
  const api = {};
  Object.entries(main).forEach(([k, [list, add, update, remove]]) => {
    api[k] = { list: list || [], add, update, remove };
  });
  coll.forEach((k) => {
    const c = app[k];
    if (c) api[k] = { list: c.items || [], add: c.add, update: c.update, remove: c.remove };
  });
  return api;
}

// ===== إحصاءات لكل نوع (للعرض في البطاقات) =====
export function entityCounts(api) {
  const out = {};
  ENTITIES.forEach((e) => { out[e.key] = (api[e.key]?.list || []).length; });
  return out;
}

// ===== كشف التكرار (للدمج) =====
// مفتاح التطابق الطبيعي: العنوان/الاسم مُطبَّعاً
export function naturalKey(entityKey, row) {
  const e = entityByKey(entityKey);
  const raw = (e?.title ? e.title(row) : row.name || row.title || '') || '';
  return String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
}

// يجمّع الصفوف المتشابهة: [{ key, rows: [...] }] — فقط التي لها أكثر من صف
export function findDuplicates(entityKey, rows) {
  const map = new Map();
  (rows || []).forEach((r) => {
    const k = naturalKey(entityKey, r);
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  });
  return [...map.entries()].filter(([, arr]) => arr.length > 1).map(([key, arr]) => ({ key, rows: arr }));
}

// ===== الدمج =====
// يحتفظ بالصف الأساسي، يدمج حقول الباقي (غير الفارغة تُكمل الفارغ)، ثم يحذف الباقي.
export function mergeRows(rows) {
  if (!rows || rows.length < 2) return rows?.[0] || null;
  const [keep, ...rest] = rows;
  const merged = { ...keep };
  rest.forEach((r) => {
    Object.entries(r).forEach(([k, v]) => {
      if (k === 'id' || k === 'createdAt') return;
      const empty = merged[k] == null || merged[k] === '' || (Array.isArray(merged[k]) && merged[k].length === 0);
      const hasVal = v != null && v !== '' && !(Array.isArray(v) && v.length === 0);
      if (empty && hasVal) merged[k] = v;
      else if (Array.isArray(merged[k]) && Array.isArray(v)) merged[k] = [...merged[k], ...v];
    });
  });
  return merged;
}

// ينفّذ الدمج عبر واجهة النوع: يحدّث الصف الأساسي بالمدمج ويحذف الباقي
export function applyMerge(api, entityKey, group) {
  const { rows } = group;
  if (!api[entityKey] || rows.length < 2) return 0;
  const merged = mergeRows(rows);
  const keep = rows[0];
  const { id, createdAt, ...patch } = merged;
  api[entityKey].update(keep.id, patch);
  rows.slice(1).forEach((r) => api[entityKey].remove(r.id));
  return rows.length - 1;
}

// حذف جماعي
export function removeMany(api, entityKey, ids) {
  if (!api[entityKey]) return 0;
  ids.forEach((id) => api[entityKey].remove(id));
  return ids.length;
}

// تعديل جماعي (نفس الحقول على مجموعة صفوف)
export function updateMany(api, entityKey, ids, patch) {
  if (!api[entityKey]) return 0;
  ids.forEach((id) => api[entityKey].update(id, patch));
  return ids.length;
}

// ===== الإرسال الجماعي: يضيف إعلاناً/رسالة موجّهة =====
export const AUDIENCES = [
  { value: 'all', label: 'الجميع (معلمون وطلاب)' },
  { value: 'teachers', label: 'المعلمون فقط' },
  { value: 'students', label: 'الطلاب فقط' }
];

export function audienceLabel(v) { return (AUDIENCES.find((a) => a.value === v) || AUDIENCES[0]).label; }

// هل الإعلان موجّه لهذا الدور؟
export function audienceMatches(audience, role) {
  if (!audience || audience === 'all') return true;
  if (audience === 'teachers') return role === 'teacher' || role === 'admin' || role === 'owner' || role === 'viewer';
  if (audience === 'students') return role === 'student';
  return true;
}
