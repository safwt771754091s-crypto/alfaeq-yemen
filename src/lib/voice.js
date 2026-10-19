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

// ===== ملفّات الأصوات (VoiceProfiles) =====
// شخصية صوتية واحدة = معرّف + نبرة + سرعة + لغة/لهجة + وصف.
export const VOICE_PROFILES = {
  teacher_female: {
    id: 'teacher_female', label: 'المعلمة (حنونة ومشجّعة)', gender: 'female',
    lang: 'ar-YE', dialect: 'يمنية مبسّطة', rate: 0.9, pitch: 1.15,
    ssmlPitch: '+12%', ssmlRate: '-5%',
    describe: 'صوت أنثوي ودود، نبرة مشجّعة، إيقاع هادئ مناسب للأطفال.'
  },
  teacher_male: {
    id: 'teacher_male', label: 'المعلم (واضح ومتأنٍّ)', gender: 'male',
    lang: 'ar-YE', dialect: 'يمنية مبسّطة', rate: 0.92, pitch: 0.95,
    ssmlPitch: '-4%', ssmlRate: '-3%',
    describe: 'صوت رجالي واضح، نبرة مطمئنة، مخارج حروف متمهّلة.'
  },
  agent: {
    id: 'agent', label: 'وكيل المنصة (رفيق التعلّم)', gender: 'female',
    lang: 'ar-YE', dialect: 'فصحى مبسّطة', rate: 1.0, pitch: 1.05,
    ssmlPitch: '+4%', ssmlRate: '0%',
    describe: 'صوت الوكيل الذكي الذي يجيب على أسئلة الطالب ويحاوره.'
  }
};

export function voiceProfileFor(id) {
  return VOICE_PROFILES[id] || VOICE_PROFILES.teacher_female;
}

// السرعة بحسب الصف: الأصغر أبطأ ليتابع
export function rateForGrade(grade) {
  const g = Number(grade) || 1;
  if (g <= 4) return 0.82;
  if (g <= 9) return 0.92;
  return 1.0;
}

// ===== SSML =====
// نبني نصّ SSML للتحكم في النبرة والسرعة والتوقّفات. محرّكات المتصفح لا تدعم SSML
// عادةً، لذا نُرفِق النصّ المجرّد أيضاً ليُقرأ احتياطياً.
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildSSML(text, { profile = null, rate = null, pitch = null, breaks = [] } = {}) {
  const p = profile || VOICE_PROFILES.teacher_female;
  const body = String(text || '')
    .split(/(?<=[.!؟?])\s+/)
    .filter(Boolean)
    .map((sentence) => {
      // توقّف قصير بعد كل جملة لإيصال الإيحاء التعليمي
      return `<s>${esc(sentence)}<break time="380ms"/></s>`;
    })
    .join('');
  const extra = (breaks || []).map((b) => `<break time="${Number(b) || 400}ms"/>`).join('');
  return `<speak version="1.0" xml:lang="${p.lang}" xmlns="http://www.w3.org/2001/10/synthesis">` +
    `<prosody rate="${rate || p.ssmlRate}" pitch="${pitch || p.ssmlPitch}">${body}${extra}</prosody></speak>`;
}

// ينطق نصّاً وفق ملفّ صوتي، مع إمكانية تعديل السرعة/النبرة ودعوة عند الانتهاء.
export function speakText(text, { profile = null, rate = null, pitch = null, voice = null, onStart = null, onEnd = null } = {}) {
  if (!speechSupported()) { onEnd && onEnd(false); return false; }
  const p = profile || VOICE_PROFILES.teacher_female;
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch { /* تجاهل */ }
  const u = new SpeechSynthesisUtterance(String(text || ''));
  u.lang = p.lang || 'ar-YE';
  const v = voice || pickArabicVoice(synth.getVoices());
  if (v) u.voice = v;
  u.rate = rate != null ? rate : p.rate;
  u.pitch = pitch != null ? pitch : p.pitch;
  if (onStart) u.onstart = () => onStart();
  if (onEnd) { u.onend = () => onEnd(true); u.onerror = () => onEnd(false); }
  synth.speak(u);
  return true;
}

export function isSpeaking() {
  return speechSupported() && window.speechSynthesis.speaking;
}

// ===== التعرّف على الكلام (ASR) =====
export function asrSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// ينشئ مُتعرّفاً حياً. يعيد كائناً فيه start/stop/abort، أو null إن لم يُدعَم.
export function createRecognizer({ lang = 'ar-YE', interim = true, onResult = null, onEnd = null, onError = null } = {}) {
  if (!asrSupported()) return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = !!interim;
  rec.maxAlternatives = 1;
  let finalText = '';
  rec.onresult = (e) => {
    let interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' ';
      else interimText += r[0].transcript;
    }
    onResult && onResult({ final: finalText.trim(), interim: interimText.trim(), done: false });
  };
  rec.onerror = (e) => onError && onError(e.error || 'error');
  rec.onend = () => onEnd && onEnd(finalText.trim());
  return {
    start() { finalText = ''; try { rec.start(); return true; } catch { return false; } },
    stop() { try { rec.stop(); } catch { /* تجاهل */ } },
    abort() { try { rec.abort(); } catch { /* تجاهل */ } }
  };
}
