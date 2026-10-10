// طبقة التخزين المحلي (LocalStorage) — تعمل بكفاءة دون اتصال بالإنترنت
const NS = 'smart_teacher_v1';

export function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(`${NS}:${key}`);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveKey(key, value) {
  try {
    localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('فشل الحفظ المحلي:', e);
    return false;
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(`${NS}:${key}`);
  } catch { /* تجاهل */ }
}

export function exportAll() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`${NS}:`)) {
      try { out[k.slice(NS.length + 1)] = JSON.parse(localStorage.getItem(k)); }
      catch { out[k.slice(NS.length + 1)] = localStorage.getItem(k); }
    }
  }
  return out;
}

export function importAll(data) {
  if (!data || typeof data !== 'object') return false;
  Object.entries(data).forEach(([k, v]) => saveKey(k, v));
  return true;
}

export function clearAll(keep = []) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`${NS}:`)) {
      const short = k.slice(NS.length + 1);
      if (!keep.includes(short)) keys.push(k);
    }
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// تلبيد رمز الدخول (إخفاء محلي وليس تشفيراً قوياً) — كافٍ لحماية واجهة على جهاز المعلم
export function hashPin(pin, salt) {
  const s = `${salt}:${pin}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16);
}

export function randomSalt() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
