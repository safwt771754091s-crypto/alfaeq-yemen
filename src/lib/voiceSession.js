// تخزين جلسات الدرس الصوتي محلياً (LocalStorage) — تتبع تقدّم الطالب.
// البنية: { [session_id]: { id, lessonId, grade, subjectId, lesson, startedAt,
//   endedAt, segments:[...], attempts:[...], dialog:[...], summary } }
import { loadKey, saveKey, uid } from './storage.js';

const KEY = 'voiceSessions';
const MAX = 40;
const listeners = new Set();

export function getSessions() {
  const v = loadKey(KEY, []);
  return Array.isArray(v) ? v : [];
}

function persist(list) {
  saveKey(KEY, list);
  listeners.forEach((fn) => fn());
}

export function subscribeSessions(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// يفتح جلسة جديدة أو يعيد جلسة غير مكتملة لنفس الدرس.
export function openSession({ grade, subjectId, lesson, subjectName = '' }) {
  const lessonId = `${grade}:${subjectId}:${lesson}`;
  const list = getSessions();
  const existing = list.find((s) => s.lessonId === lessonId && !s.endedAt);
  if (existing) return existing;
  const session = {
    id: uid('vs'),
    lessonId, grade, subjectId, lesson, subjectName,
    startedAt: new Date().toISOString(),
    endedAt: null,
    attempts: [],
    dialog: [],
    summary: null
  };
  persist([session, ...list].slice(0, MAX));
  return session;
}

function update(id, patch) {
  const list = getSessions();
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch };
  persist(list);
  return list[i];
}

// يسجّل محاولة إجابة على سؤال فقرة.
export function recordAttempt(id, { segmentId, question, answer, evaluated, correct, score, focus, at }) {
  const list = getSessions();
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const attempts = [...(list[i].attempts || []), {
    segmentId, question, answer,
    evaluated: !!evaluated, correct: !!correct, score: score || 0,
    focus: focus || '', at: at || new Date().toISOString()
  }];
  list[i] = { ...list[i], attempts };
  persist(list);
  return list[i];
}

// يسجّل رسالة حوار (سؤال الطالب وردّ الوكيل/المعلم).
export function recordDialog(id, { role, text, grounded, needsTeacher, at }) {
  const list = getSessions();
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const dialog = [...(list[i].dialog || []), {
    role, text, grounded: !!grounded, needsTeacher: !!needsTeacher,
    at: at || new Date().toISOString()
  }];
  list[i] = { ...list[i], dialog };
  persist(list);
  return list[i];
}

export function endSession(id, summary) {
  return update(id, { endedAt: new Date().toISOString(), summary: summary || null });
}

export function removeSession(id) {
  persist(getSessions().filter((s) => s.id !== id));
}

export function clearSessions() { persist([]); }

// أحدث جلسة مكتملة لدروس الطالب (لعرض آخر نتيجة).
export function lastSummary() {
  const done = getSessions().filter((s) => s.summary);
  return done[0] || null;
}
