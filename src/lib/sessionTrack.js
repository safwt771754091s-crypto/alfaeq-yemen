// تتبّع جلسات الدخول والنشاط — من سجّل الدخول، من نشط الآن، وأي صفحة يستخدم.
// يُخزَّن محلياً (LocalStorage) ويعمل دون إنترنت.
import { loadKey, saveKey, uid } from './storage.js';

const SESSIONS_KEY = 'sessions';
const EVENTS_KEY = 'sessionEvents';
const MAX_SESSIONS = 400;
const MAX_EVENTS = 200;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // يُعدّ المستخدم «نشطاً» خلال 5 دقائق من آخر نشاط
const STALE_MS = 12 * 60 * 60 * 1000;    // تُطوى الجلسات المفتوحة أقدم من 12 ساعة تلقائياً

const listeners = new Set();
function emit() { listeners.forEach((fn) => { try { fn(); } catch { /* تجاهل */ } }); }
export function subscribeSessions(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function getSessions() { return loadKey(SESSIONS_KEY, []) || []; }
export function getEvents() { return loadKey(EVENTS_KEY, []) || []; }

function persist(list) { saveKey(SESSIONS_KEY, list.slice(0, MAX_SESSIONS)); emit(); }

// تسجيل حدث دخول/خروج مستقل (لعرضه في لوحة التحكم حتى لو طُويت الجلسة)
export function logEvent(ev) {
  const events = [{ id: uid('ev'), at: new Date().toISOString(), ...ev }, ...getEvents()].slice(0, MAX_EVENTS);
  saveKey(EVENTS_KEY, events);
  emit();
  return events[0];
}

// بدء جلسة عند تسجيل الدخول
export function startSession({ userId, name, username, role, roleLabel, method }) {
  const list = getSessions();
  const now = new Date().toISOString();
  const session = {
    id: uid('ses'),
    userId, name: name || '', username: username || '',
    role: role || 'teacher', roleLabel: roleLabel || '',
    method: method || 'pin',
    loginAt: now, lastSeen: now, logoutAt: null,
    page: 'dashboard', pageName: 'لوحة التحكم',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 160) : ''
  };
  persist([session, ...list]);
  logEvent({ userId, name, type: 'login', method: session.method, text: `دخول: ${name || username}` });
  return session;
}

// تحديث آخر نشاط + الصفحة الحالية
export function touchSession(sessionId, { page, pageName } = {}) {
  if (!sessionId) return;
  const list = getSessions();
  let changed = false;
  const next = list.map((s) => {
    if (s.id !== sessionId) return s;
    changed = true;
    return {
      ...s,
      lastSeen: new Date().toISOString(),
      ...(page ? { page } : {}),
      ...(pageName ? { pageName } : {})
    };
  });
  if (changed) persist(next);
}

export function endSession(sessionId) {
  if (!sessionId) return;
  const list = getSessions();
  const target = list.find((s) => s.id === sessionId);
  persist(list.map((s) => (s.id === sessionId ? { ...s, logoutAt: new Date().toISOString() } : s)));
  if (target) logEvent({ userId: target.userId, name: target.name, type: 'logout', text: `خروج: ${target.name || target.username}` });
}

// يطوي الجلسات المفتوحة القديمة (مثلاً أُغلق المتصفح بلا تسجيل خروج)
export function pruneStale(now = Date.now()) {
  const list = getSessions();
  let changed = false;
  const next = list.map((s) => {
    if (!s.logoutAt && now - new Date(s.lastSeen || s.loginAt).getTime() > STALE_MS) {
      changed = true;
      return { ...s, logoutAt: s.lastSeen || s.loginAt };
    }
    return s;
  });
  if (changed) persist(next);
}

export function isActive(session, now = Date.now()) {
  if (!session || session.logoutAt) return false;
  return now - new Date(session.lastSeen || session.loginAt).getTime() < ACTIVE_WINDOW_MS;
}

// إحصاءات مجمّعة للوحة التحكم
export function sessionStats() {
  const list = getSessions();
  const events = getEvents();
  const now = Date.now();
  const active = list.filter((s) => isActive(s, now));
  const uniqueUsers = new Set(list.map((s) => s.userId));
  const activeUsers = new Set(active.map((s) => s.userId));
  const byPage = {};
  list.forEach((s) => {
    if (!s.page) return;
    const k = s.pageName || s.page;
    byPage[k] = (byPage[k] || 0) + 1;
  });
  return {
    total: list.length,
    active: active.length,
    activeSessions: active,
    uniqueUsers: uniqueUsers.size,
    activeUsers: activeUsers.size,
    loginsToday: list.filter((s) => new Date(s.loginAt).toDateString() === new Date().toDateString()).length,
    byPage: Object.entries(byPage).sort((a, b) => b[1] - a[1]),
    events: events.slice(0, 40),
    recent: list.slice(0, 60)
  };
}

// إحصاءات لكل مستخدم (عدد الدخولات، آخر نشاط، الصفحة، الحالة)
export function userSessionSummary(users) {
  const list = getSessions();
  const now = Date.now();
  return users.map((u) => {
    const mine = list.filter((s) => s.userId === u.id);
    const last = mine[0] || null;
    const activeSess = mine.find((s) => isActive(s, now)) || null;
    return {
      user: u,
      logins: mine.length,
      lastLoginAt: last?.loginAt || null,
      lastSeen: last?.lastSeen || null,
      lastPageName: last?.pageName || null,
      online: !!activeSess,
      currentPageName: activeSess?.pageName || null
    };
  }).sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
  });
}

export function clearSessions() { saveKey(SESSIONS_KEY, []); saveKey(EVENTS_KEY, []); emit(); }
