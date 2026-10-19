// وحدات الأدوار والصلاحيات ومطابقة المستخدمين — منطق نقي بلا JSX (قابل للاختبار في node).
import { normalizePhone } from './verification.js';

// ===== حساب المالك الثابت — موجود دائماً في المنصة ولا يمكن حذفه =====
export const OWNER = {
  id: 'owner',
  login: 'safwt',
  name: 'مالك المنصة',
  role: 'owner',
  roleLabel: 'مالك المنصة',
  defaultPin: 'safwt',
  email: 'Safwt771754091s@gmail.com',
  phone: '+967 783488 282',
  whatsapp: '967783488282',
  location: 'اليمن — نخدم جميع المحافظات والمدن',
  replyHours: 'يومياً من 9 صباحاً حتى 5 مساءً'
};

// ===== مجموعات الصلاحيات (مفتاح الصلاحية = معرّف الصفحة في التنقل) =====
export const PERMISSION_GROUPS = [
  { group: 'عام', items: [['dashboard', 'لوحة التحكم'], ['quiz', 'اختبر معرفتك بالمنصة'], ['profile', 'الملف الشخصي'], ['followups', 'المتابعة'], ['messages', 'الرسائل'], ['library', 'المكتبة'], ['training', 'التدريب'], ['design', 'استوديو التصميم']] },
  { group: 'التخطيط', items: [['curriculum', 'المنهج اليمني'], ['planner', 'التحضير الذكي'], ['notebook', 'كراسة التحضير'], ['presentations', 'العروض التقديمية'], ['timetable', 'الجدول الدراسي']] },
  { group: 'التقييم والسجلات', items: [['grader', 'التصحيح الذكي'], ['gradebook', 'سجل الدرجات'], ['attendance', 'الحضور والغياب'], ['certificates', 'الشهادات'], ['reports', 'التقارير'], ['activity', 'سجل النشاط']] },
  { group: 'تواصل وأنشطة', items: [['community', 'المجتمع'], ['announcements', 'الإعلانات'], ['reminders', 'الإشعارات'], ['mathgames', 'ألعاب الرياضيات']] },
  { group: 'رفيق الطالب', items: [['studenthub', 'وضع الطالب'], ['studentbook', 'الكتاب الرقمي'], ['studentask', 'اسأل الآن'], ['studenttimetable', 'جدول الطالب'], ['studentpractice', 'تدريب الطالب'], ['studentbooks', 'مكتبة الكتب'], ['voicelesson', 'الدرس الصوتي'], ['importer', 'استيراد الكتب'], ['studentquestions', 'أسئلة الطلاب']] },
  { group: 'الإعداد', items: [['classes', 'الصفوف والطلاب'], ['users', 'المستخدمون والصلاحيات'], ['controlcenter', 'مركز التحكم'], ['sessions', 'الجلسات والنشاط'], ['broadcast', 'الإرسال الجماعي'], ['settings', 'الإعدادات']] }
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i[0]));

// صلاحيات الإدارة التي تبقى للمالك/المدير فقط
export const ADMIN_ONLY_PERMISSIONS = ['users', 'controlcenter', 'sessions', 'broadcast'];
export const DEFAULT_TEACHER_PERMISSIONS = ALL_PERMISSIONS.filter((p) => !ADMIN_ONLY_PERMISSIONS.includes(p));

// صلاحيات الطالب الافتراضية — صفحات رفيق الطالب فقط
export const DEFAULT_STUDENT_PERMISSIONS = ['dashboard', 'profile', 'studenthub', 'studentbook', 'studentask', 'studenttimetable', 'studentpractice', 'studentbooks', 'voicelesson', 'library', 'mathgames'];

export const ROLE_PERMISSION_PRESETS = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  teacher: DEFAULT_TEACHER_PERMISSIONS,
  viewer: ['dashboard', 'curriculum', 'library', 'reports', 'activity', 'community', 'announcements', 'reminders', 'settings'],
  student: DEFAULT_STUDENT_PERMISSIONS
};

export const ROLE_LABELS = { owner: 'مالك المنصة', admin: 'مدير', teacher: 'معلم', viewer: 'مطّلع (قراءة فقط)', student: 'طالب' };

// نسخة قائمة الصلاحيات — تُزاد عند إضافة صفحات جديدة لترقية صلاحيات المالك.
export const PERMS_VERSION = 2;

// يُضمن وجود المالك دائماً مع كل الصلاحيات. يُرقّى مرة واحدة فقط عند تغيّر
// PERMS_VERSION كي تظهر الصفحات المُضافة لحسابٍ أُنشئ قبلها، ثم يُحترم أي تخصيص لاحق.
export function ensureOwner(users) {
  const list = Array.isArray(users) ? users.slice() : [];
  const idx = list.findIndex((u) => u.id === 'owner');
  if (idx === -1) return list;
  const u = list[idx];
  list[idx] = u.permsVersion === PERMS_VERSION
    ? { ...u, fixed: true, role: 'owner', name: OWNER.name }
    : { ...u, fixed: true, role: 'owner', name: OWNER.name, permissions: ALL_PERMISSIONS.slice(), permsVersion: PERMS_VERSION };
  return list;
}

// مطابقة المستخدم بمعرّف الدخول: اسم المستخدم، الاسم، البريد، أو الجوال
export function findUserBy(users, identifier) {
  const raw = String(identifier || '').trim();
  const key = raw.toLowerCase();
  const phone = normalizePhone(raw).replace(/^\+/, '');
  return (users || []).find((u) =>
    (u.username || '').toLowerCase() === key ||
    String(u.name || '').trim().toLowerCase() === key ||
    (u.email || '').toLowerCase() === key ||
    (u.phone && phone && normalizePhone(u.phone).replace(/^\+/, '') === phone)
  );
}

export function permissionLabel(id) {
  for (const g of PERMISSION_GROUPS) {
    const found = g.items.find((i) => i[0] === id);
    if (found) return found[1];
  }
  return id;
}
