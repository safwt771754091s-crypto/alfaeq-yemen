// الشرح الصوتي — صياغة ودّية بلهجة يمنية مبسّطة + نطق عبر Web Speech API.
// النطق يستخدم محرّك الصوت المدمج في الجهاز (يعمل دون إنترنت على الجوال)،
// ومع اختيار صوت عربي إن توفّر. لو لم يتوفّر صوت، يظهر النصّ للقراءة.

// إعادة صياغة الجملة بلهجة يمنية مبسّطة (افتتاحية + خِطاب ودّي)
export function toYemeni(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  const opener = 'يا شباب، خلّونا نفهم سوا: ';
  const mapped = t
    .replace(/لماذا/g, 'ليش')
    .replace(/ماذا/g, 'إيش')
    .replace(/كيف/g, 'كيف')
    .replace(/الآن/g, 'الحين')
    .replace(/جيداً/g, 'زين')
    .replace(/جيدا/g, 'زين')
    .replace(/حسناً/g, 'طيّب')
    .replace(/حسنا/g, 'طيّب')
    .replace(/هيا/g, 'يلا')
    .replace(/لكن/g, 'بس')
    .replace(/أريد/g, 'أبغى')
    .replace(/نريد/g, 'نبغى');
  return opener + mapped;
}

// اختيار أفضل صوت عربي متاح
export function pickArabicVoice(voices = []) {
  const ar = voices.filter((v) => /^ar/i.test(v.lang));
  const preferred = ['ar-YE', 'ar-SA', 'ar-EG', 'ar'];
  for (const p of preferred) {
    const hit = ar.find((v) => v.lang === p || v.lang.startsWith(p + '-'));
    if (hit) return hit;
  }
  return ar[0] || null;
}

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// ينطق نصاً (يفضّل لهجة يمنية ثم أقرب لهجة عربية)
export function speak(text, { voice = null, rate = 0.95, pitch = 1 } = {}) {
  if (!speechSupported()) return false;
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch { /* تجاهل */ }
  const u = new SpeechSynthesisUtterance(String(text || ''));
  u.lang = voice?.lang || 'ar-YE';
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = pitch;
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  if (speechSupported()) { try { window.speechSynthesis.cancel(); } catch { /* تجاهل */ } }
}

// بناء نصّ الشرح الصوتي من صفحات الدرس
export function narrationForLesson(pages = []) {
  const parts = [];
  for (const p of pages) {
    if (p.title) parts.push(p.title + '.');
    if (Array.isArray(p.body)) parts.push(...p.body);
    if (Array.isArray(p.points)) parts.push(...p.points);
  }
  return toYemeni(parts.join(' '));
}
