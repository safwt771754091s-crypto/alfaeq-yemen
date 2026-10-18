import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loadKey, saveKey, hashPin, randomSalt, uid } from '../lib/storage.js';

const AuthContext = createContext(null);

const USERS_KEY = 'users';
const SESSION_KEY = 'smart_teacher_v1:auth_session';
export const APP_VERSION = '1.5';

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
  { group: 'رفيق الطالب', items: [['studenthub', 'وضع الطالب'], ['studentbook', 'الكتاب الرقمي'], ['studentask', 'اسأل الآن'], ['studenttimetable', 'جدول الطالب'], ['studentpractice', 'تدريب الطالب'], ['studentquestions', 'أسئلة الطلاب']] },
  { group: 'الإعداد', items: [['classes', 'الصفوف والطلاب'], ['users', 'المستخدمون والصلاحيات'], ['settings', 'الإعدادات']] }
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i[0]));

// المعلم الجديد يحصل على كل الصلاحيات ما عدا إدارة المستخدمين
export const DEFAULT_TEACHER_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p !== 'users');

function seedOwner() {
  const salt = randomSalt();
  return {
    id: 'owner',
    name: OWNER.name,
    username: OWNER.login,
    role: 'owner',
    roleLabel: OWNER.roleLabel,
    title: 'مالك المنصة',
    school: '',
    email: OWNER.email,
    phone: OWNER.phone,
    subject: '',
    salt,
    pinHash: hashPin(OWNER.defaultPin, salt),
    permissions: ALL_PERMISSIONS.slice(),
    fixed: true,
    active: true,
    createdAt: new Date().toISOString()
  };
}

function readSession() {
  try { return sessionStorage.getItem(SESSION_KEY) || null; } catch { return null; }
}
function writeSession(id) {
  try { id ? sessionStorage.setItem(SESSION_KEY, id) : sessionStorage.removeItem(SESSION_KEY); } catch { /* تجاهل */ }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const stored = loadKey(USERS_KEY, null);
    let list = Array.isArray(stored) ? stored : [];
    // ضمان وجود حساب المالك الثابت دائماً
    if (!list.find((u) => u.id === 'owner')) list = [seedOwner(), ...list];
    else list = list.map((u) => (u.id === 'owner' ? { ...u, fixed: true, role: 'owner', name: OWNER.name } : u));
    return list;
  });
  const [userId, setUserId] = useState(readSession);

  useEffect(() => { saveKey(USERS_KEY, users); }, [users]);
  useEffect(() => { writeSession(userId); }, [userId]);

  const currentUser = users.find((u) => u.id === userId && u.active !== false) || null;
  const owner = users.find((u) => u.id === 'owner') || null;

  const login = useCallback((username, pin) => {
    const key = String(username || '').trim().toLowerCase();
    const user = users.find((u) =>
      (u.username || '').toLowerCase() === key || String(u.name || '').trim().toLowerCase() === key);
    if (!user) return { ok: false, error: 'لا يوجد مستخدم بهذا الاسم' };
    if (user.active === false) return { ok: false, error: 'الحساب موقوف، راجع مالك المنصة' };
    if (hashPin(String(pin), user.salt) !== user.pinHash) return { ok: false, error: 'رمز الدخول غير صحيح' };
    setUserId(user.id);
    return { ok: true, user };
  }, [users]);

  const logout = useCallback(() => setUserId(null), []);

  const can = useCallback((perm) => {
    if (!currentUser) return false;
    // صفحات الإدارة الأساسية تبقى متاحة دائماً للمالك حتى لا يُقفل نفسه
    if (currentUser.role === 'owner' && (perm === 'dashboard' || perm === 'owner' || perm === 'users')) return true;
    return (currentUser.permissions || []).includes(perm);
  }, [currentUser]);

  const addUser = useCallback((data, pin) => {
    const salt = randomSalt();
    const user = {
      id: uid('usr'),
      name: data.name || '',
      username: (data.username || '').trim(),
      role: data.role || 'teacher',
      roleLabel: data.roleLabel || 'معلم',
      title: data.title || '',
      school: data.school || '',
      email: data.email || '',
      phone: data.phone || '',
      subject: data.subject || '',
      salt,
      pinHash: hashPin(String(pin), salt),
      permissions: data.permissions ? data.permissions.slice() : DEFAULT_TEACHER_PERMISSIONS.slice(),
      fixed: false,
      active: true,
      createdAt: new Date().toISOString()
    };
    setUsers((prev) => [...prev, user]);
    return user;
  }, []);

  const registerTeacher = useCallback((data, pin) => {
    const user = addUser({ ...data, role: 'teacher', roleLabel: 'معلم' }, pin);
    setUserId(user.id);
    return user;
  }, [addUser]);

  const updateUser = useCallback((id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const deleteUser = useCallback((id) => {
    if (id === 'owner') return false;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return true;
  }, []);

  const setPin = useCallback((id, newPin) => {
    const salt = randomSalt();
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, salt, pinHash: hashPin(String(newPin), salt) } : u)));
  }, []);

  const changeOwnPin = useCallback((currentPin, newPin) => {
    if (!currentUser) return false;
    if (hashPin(String(currentPin), currentUser.salt) !== currentUser.pinHash) return false;
    setPin(currentUser.id, newPin);
    return true;
  }, [currentUser, setPin]);

  const value = {
    users, currentUser, owner, isOwner: currentUser?.role === 'owner', isAuthed: !!currentUser,
    login, logout, can, addUser, registerTeacher, updateUser, deleteUser, setPin, changeOwnPin,
    APP_VERSION, PERMISSION_GROUPS, ALL_PERMISSIONS, DEFAULT_TEACHER_PERMISSIONS
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function permissionLabel(id) {
  for (const g of PERMISSION_GROUPS) {
    const found = g.items.find((i) => i[0] === id);
    if (found) return found[1];
  }
  return id;
}
