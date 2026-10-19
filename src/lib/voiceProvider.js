// طبقة مزوّد الصوت — تختار تلقائياً بين:
//   1) محرّك الجهاز المحلي (Web Speech) — يعمل دون إنترنت.
//   2) مزوّد سحابي عالي الجودة (Azure / Google) — صوت يمني طبيعي + SSML كامل.
// المفتاح يُخزَّن محلياً على جهاز المعلم فقط، والطلب يُرسل مباشرةً للمزوّد.
import { loadKey, saveKey } from './storage.js';
import { VOICE_PROFILES, voiceProfileFor, speakText, stopSpeaking, pickArabicVoice, speechSupported } from './voice.js';

const CFG_KEY = 'voiceConfig';

export const DEFAULT_VOICE_CONFIG = {
  provider: 'auto',        // auto | local | google | azure
  googleKey: '',
  azureKey: '',
  azureRegion: 'westeurope',
  proxyUrl: '',            // نقطة نهاية مخصّصة (وسيط) تُعيد صوتاً — اختياري
  voiceNames: {}           // تجاوز أسماء الأصوات لكل ملفّ صوتي
};

export function loadVoiceConfig() {
  const v = loadKey(CFG_KEY, null);
  return { ...DEFAULT_VOICE_CONFIG, ...(v && typeof v === 'object' ? v : {}) };
}

export function saveVoiceConfig(cfg) {
  saveKey(CFG_KEY, { ...DEFAULT_VOICE_CONFIG, ...cfg });
  return loadVoiceConfig();
}

export const PROVIDER_LABELS = {
  auto: 'تلقائي (سحابي إن توفّر، وإلا محلي)',
  local: 'محرّك الجهاز المحلي (بدون إنترنت)',
  azure: 'Azure Speech (صوت يمني طبيعي)',
  google: 'Google Cloud TTS'
};

// الأصوات الافتراضية لكل مزوّد. Azure يوفّر صوتاً يمنياً أصيلاً «ar-YE-SalmaNeural».
const DEFAULT_VOICES = {
  azure: {
    teacher_female: 'ar-YE-SalmaNeural',
    teacher_male: 'ar-SA-HamedNeural',
    agent: 'ar-YE-SalmaNeural'
  },
  google: {
    teacher_female: 'ar-XA-Wavenet-A',
    teacher_male: 'ar-XA-Wavenet-C',
    agent: 'ar-XA-Wavenet-D'
  }
};

const LANG = { azure: 'ar-YE', google: 'ar-XA' };

export function voiceNameFor(provider, profileId, overrides = {}) {
  return (overrides && overrides[profileId]) || (DEFAULT_VOICES[provider] && DEFAULT_VOICES[provider][profileId]) || '';
}

// هل المزوّد السحابي جاهز (مفتاح موجود أو وسيط مخصّص)؟
export function cloudConfigured(cfg) {
  const c = cfg || loadVoiceConfig();
  return {
    google: !!(c.googleKey || c.proxyUrl),
    azure: !!(c.azureKey || c.proxyUrl),
    proxy: !!c.proxyUrl
  };
}

// يختار المزوّد الفعلي وفق الإعداد وحالة الاتصال.
export function resolveProvider(cfg, online) {
  const c = cfg || loadVoiceConfig();
  if (c.provider === 'local') return 'local';
  if (c.provider === 'azure') return (c.azureKey || c.proxyUrl) ? 'azure' : 'local';
  if (c.provider === 'google') return (c.googleKey || c.proxyUrl) ? 'google' : 'local';
  // auto: فضّل Azure (يدعم CORS وصوت يمني)، ثم Google، وإلا محلي
  if (!online) return 'local';
  if (c.azureKey || c.proxyUrl) return 'azure';
  if (c.googleKey) return 'google';
  return 'local';
}

// ===== بناء SSML للمزوّد السحابي =====
const xmlEsc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildCloudSSML(text, { provider = 'azure', profile = null, voiceName = '', rate = null } = {}) {
  const p = profile || voiceProfileFor('teacher_female');
  const sentences = String(text || '')
    .split(/(?<=[.!؟?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const inner = sentences.map((s) => `${xmlEsc(s)}<break time="380ms"/>`).join('');
  const rateStr = rate != null ? `${Math.round((rate - 1) * 100)}%` : (p.ssmlRate || '0%');
  const prosody = `<prosody rate="${rateStr}" pitch="${p.ssmlPitch || '+0%'}">${inner}</prosody>`;
  if (provider === 'azure') {
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${p.lang || LANG.azure}">` +
      `<voice name="${voiceName}">${prosody}</voice></speak>`;
  }
  return `<speak version="1.0" xml:lang="${LANG.google}">${prosody}</speak>`;
}

// ===== طلبات المزوّدين =====
function base64ToBlob(b64, type = 'audio/mpeg') {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function fetchGoogle({ text, ssml, voiceName, profile, rate, key }) {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`;
  const body = {
    input: ssml ? { ssml } : { text },
    voice: { languageCode: LANG.google, name: voiceName || undefined },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: rate != null ? rate : (profile?.rate || 1),
      pitch: profile ? Math.round((profile.pitch - 1) * 12) : 0
    }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('google-http-' + res.status);
  const data = await res.json();
  if (!data.audioContent) throw new Error('google-empty');
  return base64ToBlob(data.audioContent);
}

async function fetchAzure({ text, ssml, voiceName, profile, rate, key, region }) {
  const url = `https://${region || 'westeurope'}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const markup = ssml || buildCloudSSML(text, { provider: 'azure', profile, voiceName, rate });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
    },
    body: markup
  });
  if (!res.ok) throw new Error('azure-http-' + res.status);
  return res.blob();
}

// وسيط مخصّص: يستقبل JSON ويُعيد صوتاً (base64 في audio، أو bytes).
async function fetchProxy({ url, text, ssml, voiceName, provider, profile, rate }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, ssml, voice: voiceName, provider, rate, pitch: profile?.pitch })
  });
  if (!res.ok) throw new Error('proxy-http-' + res.status);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    const b64 = data.audio || data.audioContent;
    if (!b64) throw new Error('proxy-empty');
    return base64ToBlob(b64, data.mime || 'audio/mpeg');
  }
  return res.blob();
}

// ===== تشغيل الصوت =====
let currentAudio = null;
const audioCache = new Map(); // مفتاح النصّ → رابط كائن (حدّ أعلى بسيط)

function playBlob(blob, { onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onplay = () => onStart && onStart();
    const done = (okPlayed) => { onEnd && onEnd(okPlayed); resolve(okPlayed); };
    audio.onended = () => { URL.revokeObjectURL(url); done(true); };
    audio.onerror = () => { URL.revokeObjectURL(url); done(false); };
    audio.play().catch(() => { URL.revokeObjectURL(url); done(false); });
  });
}

export function stopSmart() {
  if (currentAudio) { try { currentAudio.pause(); } catch { /* تجاهل */ } currentAudio = null; }
  stopSpeaking();
}

export function clearAudioCache() { audioCache.clear(); }

// هل الجهاز متصل بالإنترنت؟
function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

// ===== الواجهة الرئيسة: ينطق نصّاً بالمزوّد الأنسب =====
// يعيد { provider, cloud, fellBack } ويستدعي onEnd عند الانتهاء.
export async function speakSmart(text, { profileId = 'teacher_female', rate = null, cfg = null, online = null, onStart = null, onEnd = null } = {}) {
  const config = cfg || loadVoiceConfig();
  const isOn = online == null ? isOnline() : online;
  const provider = resolveProvider(config, isOn);
  const profile = voiceProfileFor(profileId);
  const voiceName = voiceNameFor(provider, profileId, config.voiceNames);

  if (provider === 'local') {
    if (!speechSupported()) { onEnd && onEnd(false); return { provider: 'local', cloud: false, fellBack: false }; }
    speakText(text, { profile, rate, voice: pickArabicVoice(window.speechSynthesis.getVoices()), onStart, onEnd });
    return { provider: 'local', cloud: false, fellBack: false };
  }

  const key = `${provider}:${voiceName}:${text}`;
  try {
    let blob;
    if (audioCache.has(key)) {
      blob = audioCache.get(key);
    } else {
      const ssml = buildCloudSSML(text, { provider, profile, voiceName, rate });
      if (config.proxyUrl) {
        blob = await fetchProxy({ url: config.proxyUrl, text, ssml, voiceName, provider, profile, rate });
      } else if (provider === 'azure') {
        blob = await fetchAzure({ text, ssml, voiceName, profile, rate, key: config.azureKey, region: config.azureRegion });
      } else {
        blob = await fetchGoogle({ text, ssml, voiceName, profile, rate, key: config.googleKey });
      }
      if (audioCache.size > 60) audioCache.clear();
      audioCache.set(key, blob);
    }
    const played = await playBlob(blob, { onStart, onEnd });
    if (!played) throw new Error('play-failed');
    return { provider, cloud: true, fellBack: false };
  } catch (e) {
    // فشل السحابي → تراجع تلقائي للمحرّك المحلي
    console.warn('تعذّر الصوت السحابي، تراجع للمحلي:', e?.message || e);
    if (speechSupported()) {
      speakText(text, { profile, rate, voice: pickArabicVoice(window.speechSynthesis.getVoices()), onStart, onEnd });
    } else {
      onEnd && onEnd(false);
    }
    return { provider: 'local', cloud: false, fellBack: true };
  }
}

// اختبار سريع للمزوّد (ينطق جملة قصيرة).
export async function testProvider(cfg = null, profileId = 'teacher_female') {
  const config = cfg || loadVoiceConfig();
  const provider = resolveProvider(config, true);
  if (provider === 'local') return { ok: false, provider, reason: 'لم يُضبط مفتاح سحابي — سيُستخدم المحرّك المحلي' };
  const res = await speakSmart('أهلاً بكم في منصة المعلم الذكية.', { profileId, cfg: config, online: true });
  return { ok: res.cloud, provider: res.provider, reason: res.cloud ? '' : 'تعذّر الاتصال بالمزوّد — تحقّق من المفتاح والمنطقة' };
}

export { VOICE_PROFILES };
