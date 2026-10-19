// التحقق عبر البريد الإلكتروني أو رقم الجوال (واتساب).
// لا يوجد خادم: يُولَّد رمز تحقق (OTP) محلياً، ويُخزَّن مُلبَّداً مع مهلة صلاحية،
// ثم يُرسَل عبر واتساب (رابط wa.me) أو البريد (رابط mailto) — أو يُعرض للتسليم اليدوي.
import { loadKey, saveKey, removeKey, hashPin, randomSalt } from './storage.js';

const PENDING_KEY = 'otpPending';
const OTP_TTL_MS = 5 * 60 * 1000; // صلاحية الرمز 5 دقائق

export function genOtp(length = 6) {
  let s = '';
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return '+' + digits.slice(1).replace(/\D/g, '');
  return digits;
}

// أرقام واتساب اليمنية: نُقبل الصيغة المحلية (7xxxxxxxx) أو الدولية (967xxxxxxxxx)
export function whatsappNumber(phone) {
  let d = normalizePhone(phone).replace(/^\+/, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (!d.startsWith('967')) d = '967' + d;
  return d;
}

export function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }
export function isPhone(v) { const d = normalizePhone(v).replace(/^\+/, ''); return /^\d{7,15}$/.test(d); }

export function detectTargetKind(value) {
  if (isEmail(value)) return 'email';
  if (isPhone(value)) return 'phone';
  return 'invalid';
}

export function otpMessage(code, { appName = 'منصة المعلم الذكية', purpose = 'التحقق من الحساب' } = {}) {
  return `رمز التحقق الخاص بك في ${appName} هو: ${code}\nالغرض: ${purpose}\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`;
}

// إنشاء طلب تحقق جديد — يعيد الرمز الخام (للعرض/التسليم) والطلب المخزّن
export function createOtp({ scope, channel, target, purpose, name = '' }) {
  const code = genOtp();
  const salt = randomSalt();
  const req = {
    scope, channel, target: String(target || '').trim(),
    name, purpose: purpose || 'التحقق',
    salt, codeHash: hashPin(code, salt),
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + OTP_TTL_MS
  };
  const all = loadKey(PENDING_KEY, {}) || {};
  all[scope] = req;
  saveKey(PENDING_KEY, all);
  return { code, req };
}

export function readOtp(scope) {
  const all = loadKey(PENDING_KEY, {}) || {};
  return all[scope] || null;
}

export function clearOtp(scope) {
  const all = loadKey(PENDING_KEY, {}) || {};
  delete all[scope];
  saveKey(PENDING_KEY, all);
}

export function otpRemainingMs(scope) {
  const req = readOtp(scope);
  if (!req) return 0;
  return Math.max(0, req.expiresAt - Date.now());
}

// تحقق من الرمز المدخل
export function verifyOtp(scope, input) {
  const req = readOtp(scope);
  if (!req) return { ok: false, error: 'لا يوجد طلب تحقق — اطلب رمزاً جديداً' };
  if (Date.now() > req.expiresAt) { clearOtp(scope); return { ok: false, error: 'انتهت صلاحية الرمز — اطلب رمزاً جديداً' }; }
  if (hashPin(String(input || '').trim(), req.salt) !== req.codeHash) return { ok: false, error: 'الرمز غير صحيح' };
  return { ok: true };
}

// إرسال الرمز عبر واتساب أو البريد — يفتح تطبيق الجهاز. يعيد الرابط المستخدم.
export function sendOtp({ channel, target, code, name = '', purpose = 'التحقق' }) {
  const msg = otpMessage(code, { purpose });
  if (typeof window === 'undefined') return { ok: false, url: '' };
  if (channel === 'whatsapp') {
    const url = `https://wa.me/${whatsappNumber(target)}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
    return { ok: true, url };
  }
  if (channel === 'email') {
    const subject = `رمز التحقق — ${purpose}`;
    const url = `mailto:${encodeURIComponent(target)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
    return { ok: true, url };
  }
  return { ok: false, url: '' };
}
