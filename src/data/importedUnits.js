// الوحدات المستوردة من كتب المنهج (عدن) — تُخزَّن محلياً وتُدمج في هيكل المنهج.
import { loadKey, saveKey, uid } from '../lib/storage.js';

const KEY = 'importedUnits';
const listeners = new Set();

export function getImportedUnits() {
  const v = loadKey(KEY, {});
  return v && typeof v === 'object' ? v : {};
}

function persist(map) {
  saveKey(KEY, map);
  listeners.forEach((fn) => fn());
}

export function subscribeImported(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// وحدات صف+مادة معيّنين بصيغة متوافقة مع هيكل المنهج.
export function importedUnitsFor(grade, subjectId) {
  const list = getImportedUnits()[`${grade}:${subjectId}`];
  return Array.isArray(list) && list.length ? list : null;
}

// استبدال وحدات كتاب معيّن (نفس bookId) بالوحدات الجديدة — إعادة الاستيراد لا تكرّر.
export function saveImportedBook({ grade, subjectId, bookId, bookTitle, authority = 'aden', units }) {
  const map = { ...getImportedUnits() };
  const key = `${grade}:${subjectId}`;
  const kept = (map[key] || []).filter((u) => u.bookId !== bookId);
  const stamped = units.map((u, i) => ({
    id: u.id || uid('imp'),
    title: u.title,
    sourced: true,
    imported: true,
    bookId,
    bookTitle,
    authority,
    sort_order: i,
    lessons: u.lessons,
    questions: u.questions || [],
    pages: u.pages || null
  }));
  map[key] = [...kept, ...stamped];
  persist(map);
  return stamped.length;
}

export function removeImportedBook(grade, subjectId, bookId) {
  const map = { ...getImportedUnits() };
  const key = `${grade}:${subjectId}`;
  map[key] = (map[key] || []).filter((u) => u.bookId !== bookId);
  if (!map[key].length) delete map[key];
  persist(map);
}

export function removeImportedUnit(id) {
  const map = { ...getImportedUnits() };
  for (const key of Object.keys(map)) {
    map[key] = map[key].filter((u) => u.id !== id);
    if (!map[key].length) delete map[key];
  }
  persist(map);
}

export function importedBooks() {
  const map = getImportedUnits();
  const out = [];
  for (const [key, units] of Object.entries(map)) {
    const [grade, subjectId] = key.split(':');
    const byBook = new Map();
    for (const u of units) {
      const b = byBook.get(u.bookId) || { bookId: u.bookId, bookTitle: u.bookTitle, grade: Number(grade), subjectId, authority: u.authority, units: 0, lessons: 0 };
      b.units += 1;
      b.lessons += (u.lessons || []).length;
      byBook.set(u.bookId, b);
    }
    out.push(...byBook.values());
  }
  return out;
}
