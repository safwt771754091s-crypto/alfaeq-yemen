import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { loadKey, saveKey, hashPin, randomSalt, uid } from '../lib/storage.js';
import { startSession, endSession, touchSession, pruneStale } from '../lib/sessionTrack.js';
import { isEmail, isPhone } from '../lib/verification.js';
import {
  OWNER, PERMISSION_GROUPS, ALL_PERMISSIONS, ADMIN_ONLY_PERMISSIONS,
  DEFAULT_TEACHER_PERMISSIONS, DEFAULT_STUDENT_PERMISSIONS,
  ROLE_PERMISSION_PRESETS, ROLE_LABELS, findUserBy, permissionLabel
} from '../lib/roles.js';

export {
  OWNER, PERMISSION_GROUPS, ALL_PERMISSIONS, ADMIN_ONLY_PERMISSIONS,
  DEFAULT_TEACHER_PERMISSIONS, DEFAULT_STUDENT_PERMISSIONS,
  ROLE_PERMISSION_PRESETS, ROLE_LABELS, findUserBy, permissionLabel
};

const AuthContext = createContext(null);

const USERS_KEY = 'users';
const SESSION_KEY = 'smart_teacher_v1:auth_session';
export const APP_VERSION = '1.6';

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
    verified: { email: true, phone: true },
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
    if (!list.find((u) => u.id === 'owner')) list = [seedOwner(), ...list];
    else list = list.map((u) => (u.id === 'owner' ? { ...u, fixed: true, role: 'owner', name: OWNER.name } : u));
    return list;
  });
  const [userId, setUserId] = useState(readSession);
  const [sessionId, setSessionId] = useState(null);
  const startedRef = useRef(false);

  useEffect(() => { saveKey(USERS_KEY, users); }, [users]);
  useEffect(() => { writeSession(userId); }, [userId]);

  const currentUser = users.find((u) => u.id === userId && u.active !== false) || null;
  const owner = users.find((u) => u.id === 'owner') || null;

  // بدء جلسة التتبّع عند وجود مستخدم مسجّل (مرة واحدة لكل تسجيل دخول)
  useEffect(() => {
    if (currentUser && !startedRef.current) {
      startedRef.current = true;
      pruneStale();
      const s = startSession({
        userId: currentUser.id, name: currentUser.name, username: currentUser.username,
        role: currentUser.role, roleLabel: currentUser.roleLabel, method: currentUser.__method || 'pin'
      });
      setSessionId(s.id);
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id
        ? { ...u, lastLoginAt: s.loginAt, loginCount: (u.loginCount || 0) + 1, __method: undefined }
        : u)));
    }
    if (!currentUser && startedRef.current) {
      startedRef.current = false;
      setSessionId(null);
    }
  }, [currentUser]);

  const finishLogin = useCallback((user, method) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, __method: method } : u)));
    setUserId(user.id);
  }, []);

  const login = useCallback((identifier, pin) => {
    const user = findUserBy(users, identifier);
    if (!user) return { ok: false, error: 'لا يوجد حساب بهذا المعرّف' };
    if (user.active === false) return { ok: false, error: 'الحساب موقوف، راجع مالك المنصة' };
    if (hashPin(String(pin), user.salt) !== user.pinHash) return { ok: false, error: 'رمز الدخول غير صحيح' };
    finishLogin(user, 'pin');
    return { ok: true, user };
  }, [users, finishLogin]);

  // دخول عبر رمز تحقق (OTP) مُتحقَّق منه مسبقاً
  const loginWithOtp = useCallback((userIdOrIdentifier) => {
    const user = users.find((u) => u.id === userIdOrIdentifier) || findUserBy(users, userIdOrIdentifier);
    if (!user) return { ok: false, error: 'لا يوجد حساب مطابق' };
    if (user.active === false) return { ok: false, error: 'الحساب موقوف، راجع مالك المنصة' };
    finishLogin(user, 'otp');
    return { ok: true, user };
  }, [users, finishLogin]);

  // يبحث عن مستخدم لطلب رمز تحقق للدخول
  const findUserForLogin = useCallback((identifier) => {
    const user = findUserBy(users, identifier);
    if (!user) return { ok: false, error: 'لا يوجد حساب بهذا البريد أو الجوال' };
    if (user.active === false) return { ok: false, error: 'الحساب موقوف، راجع مالك المنصة' };
    const channel = isEmail(identifier) ? 'email' : (isPhone(identifier) ? 'whatsapp' : (user.email ? 'email' : 'whatsapp'));
    const target = channel === 'email' ? user.email : (user.phone || identifier);
    if (!target) return { ok: false, error: 'لا يوجد بريد أو جوال مسجّل لهذا الحساب' };
    return { ok: true, user, channel, target };
  }, [users]);

  const logout = useCallback(() => {
    if (sessionId) endSession(sessionId);
    setSessionId(null);
    setUserId(null);
  }, [sessionId]);

  // تسجيل صفحة التنقّل الحالية في الجلسة
  const trackPage = useCallback((page, pageName) => {
    if (sessionId) touchSession(sessionId, { page, pageName });
  }, [sessionId]);

  const can = useCallback((perm) => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner' && (perm === 'dashboard' || perm === 'owner' || perm === 'users')) return true;
    return (currentUser.permissions || []).includes(perm);
  }, [currentUser]);

  const addUser = useCallback((data, pin) => {
    const salt = randomSalt();
    const role = data.role || 'teacher';
    const user = {
      id: uid('usr'),
      name: data.name || '',
      username: (data.username || '').trim(),
      role,
      roleLabel: data.roleLabel || ROLE_LABELS[role] || 'معلم',
      title: data.title || '',
      school: data.school || '',
      email: data.email || '',
      phone: data.phone || '',
      subject: data.subject || '',
      grade: data.grade || '',
      salt,
      pinHash: pin ? hashPin(String(pin), salt) : '',
      permissions: data.permissions ? data.permissions.slice() : (ROLE_PERMISSION_PRESETS[role] || DEFAULT_TEACHER_PERMISSIONS).slice(),
      fixed: false,
      active: true,
      verified: data.verified || { email: false, phone: false },
      createdAt: new Date().toISOString()
    };
    setUsers((prev) => [...prev, user]);
    return user;
  }, []);

  const registerTeacher = useCallback((data, pin) => {
    const user = addUser({ ...data, role: 'teacher', roleLabel: ROLE_LABELS.teacher }, pin);
    finishLogin(user, 'register');
    return user;
  }, [addUser, finishLogin]);

  const registerStudent = useCallback((data, pin) => {
    const user = addUser({ ...data, role: 'student', roleLabel: ROLE_LABELS.student }, pin);
    finishLogin(user, 'register');
    return user;
  }, [addUser, finishLogin]);

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

  // توثيق البريد/الجوال للحساب (بعد نجاح رمز التحقق)
  const markVerified = useCallback((id, kind) => {
    setUsers((prev) => prev.map((u) => (u.id === id
      ? { ...u, verified: { ...(u.verified || {}), [kind]: true } }
      : u)));
  }, []);

  const value = {
    users, currentUser, owner, isOwner: currentUser?.role === 'owner', isAuthed: !!currentUser,
    isStudent: currentUser?.role === 'student',
    isTeacher: currentUser?.role === 'teacher' || currentUser?.role === 'admin',
    sessionId, login, loginWithOtp, findUserForLogin, logout, trackPage, can,
    addUser, registerTeacher, registerStudent, updateUser, deleteUser, setPin, changeOwnPin, markVerified,
    APP_VERSION, PERMISSION_GROUPS, ALL_PERMISSIONS, DEFAULT_TEACHER_PERMISSIONS, DEFAULT_STUDENT_PERMISSIONS,
    ADMIN_ONLY_PERMISSIONS, ROLE_LABELS, ROLE_PERMISSION_PRESETS
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

