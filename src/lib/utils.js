// دوال مساعدة عامة (تواريخ، أرقام، نصوص)

export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${AR_MONTHS[m - 1]} ${y}`;
}

export function formatDateLong(iso) {
  if (!iso) return '—';
  const dt = new Date(`${iso}T00:00:00`);
  const day = AR_DAYS[dt.getDay()];
  return `${day} ${formatDate(iso)}`;
}

export function lastNDates(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    const p = (k) => String(k).padStart(2, '0');
    out.push(`${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`);
  }
  return out;
}

export function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function download(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob(['\ufeff' + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function slugify(str) {
  return (str || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

export function arabicNumber(n) {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

// تطبيع النص العربي لمقارنة الإجابات (إزالة التشكيل والتطويل وتوحيد الألف والهمزة)
export function normalizeArabic(s) {
  if (!s) return '';
  return String(s)
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
