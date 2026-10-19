import { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, useToast, Confirm, Modal } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth, APP_VERSION } from '../state/auth.jsx';
import { SUBJECTS } from '../data/curriculum.js';
import { download } from '../lib/utils.js';
import { loadVoiceConfig, saveVoiceConfig, PROVIDER_LABELS, testProvider, resolveProvider } from '../lib/voiceProvider.js';

const REPO_URL = 'https://github.com/safwt771754091s-crypto/alfaeq-yemen';
const APK_URL = `${REPO_URL}/releases/latest/download/smart-teacher.apk`;
const APK_URL_PAGES = 'https://safwt771754091s-crypto.github.io/alfaeq-yemen/smart-teacher.apk';
const ZIP_URL = `${REPO_URL}/releases/latest/download/smart-teacher.zip`;
const ZIP_URL_PAGES = 'https://safwt771754091s-crypto.github.io/alfaeq-yemen/smart-teacher.zip';

export default function Settings() {
  const { profile, saveProfile, backup, restore, wipe, classes, students, lessons, notebooks, presentations, quizzes, assessments, certificates } = useApp();
  const { owner, isOwner } = useAuth();
  const toast = useToast();
  const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
  const [form, setForm] = useState(profile);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [voiceCfg, setVoiceCfg] = useState(() => loadVoiceConfig());
  const [testing, setTesting] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setVC = (k, v) => setVoiceCfg((c) => ({ ...c, [k]: v }));
  const saveVoice = () => { setVoiceCfg(saveVoiceConfig(voiceCfg)); toast.push('تم حفظ إعدادات الصوت'); };
  const runVoiceTest = async () => {
    setTesting(true);
    const res = await testProvider(voiceCfg);
    setTesting(false);
    toast.push(res.ok ? `يعمل الصوت: ${PROVIDER_LABELS[res.provider] || res.provider}` : res.reason, res.ok ? 'success' : 'error');
  };

  const save = () => { saveProfile(form); toast.push('تم حفظ الإعدادات'); };

  const doBackup = () => {
    const data = backup();
    download(`نسخة_احتياطية_منصة_المعلم_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
    toast.push('تم تنزيل النسخة الاحتياطية');
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        restore(data);
      } catch { toast.push('ملف غير صالح', 'error'); }
    };
    reader.readAsText(file);
  };

  const counts = {
    classes: classes.length, students: students.length, lessons: lessons.length,
    notebooks: notebooks.length, presentations: presentations.length, quizzes: quizzes.length,
    assessments: assessments.length, certificates: certificates.length
  };

  // إفراغ الذاكرة المؤقتة للـ Service Worker ثم إعادة التحميل — دون المساس ببيانات LocalStorage
  const hardRefresh = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch { /* تجاهل */ }
    toast.push('تم التحديث — جارٍ إعادة التحميل');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Settings} title="الإعدادات" subtitle="بيانات المعلم، النسخ الاحتياطي، ومعلومات المنصة" />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="section-title mb-4"><Icon.Users size={18} /> بيانات المعلم</div>
          <div className="space-y-4">
            <Field label="الاسم"><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="المدرسة"><input className="input" value={form.school || ''} onChange={(e) => set('school', e.target.value)} /></Field>
              <Field label="المديرية"><input className="input" value={form.directorate || ''} onChange={(e) => set('directorate', e.target.value)} /></Field>
              <Field label="المحافظة"><input className="input" value={form.governorate || ''} onChange={(e) => set('governorate', e.target.value)} /></Field>
              <Field label="التخصص الرئيسي">
                <select className="input" value={form.mainSubject} onChange={(e) => set('mainSubject', e.target.value)}>
                  {Object.values(SUBJECTS).map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </Field>
            </div>
            <button className="btn-primary" onClick={save}><Icon.Check size={18} /> حفظ التغييرات</button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="section-title mb-4"><Icon.File size={18} /> البيانات والنسخ الاحتياطي</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(counts).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {k === 'classes' ? 'صفوف' : k === 'students' ? 'طلاب' : k === 'lessons' ? 'تحضيرات' : k === 'notebooks' ? 'كراسات' : k === 'presentations' ? 'عروض' : k === 'quizzes' ? 'اختبارات' : k === 'assessments' ? 'تقييمات' : 'شهادات'}
                  </span>
                  <span className="font-extrabold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary" onClick={doBackup}><Icon.Download size={18} /> نسخة احتياطية</button>
              <button className="btn-outline" onClick={() => fileRef.current?.click()}><Icon.Upload size={18} /> استعادة</button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onFile} />
              <button className="btn-danger" onClick={() => setConfirmWipe(true)}><Icon.Trash size={18} /> حذف كل البيانات</button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Refresh size={18} /> تحديث المنصة</div>
            <p className="text-sm text-slate-500 font-bold leading-relaxed mb-3">
              إن لم تظهر آخر التحديثات، اضغط الزر لإفراغ الذاكرة المؤقتة وإعادة تحميل المنصة بأحدث إصدار. بياناتك لن تُحذف.
            </p>
            <button className="btn-outline" onClick={hardRefresh}><Icon.Refresh size={18} /> إعادة تحميل أحدث إصدار</button>
          </Card>

          {!isNative && (
          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Download size={18} /> تطبيق الأندرويد (يعمل بدون إنترنت)</div>
            <p className="text-sm text-slate-500 font-bold leading-relaxed mb-3">
              نزّل تطبيق المنصة على جوالك واعمل به <b>دون إنترنت</b> — كل الملفات مدمجة داخل التطبيق. بعد التنزيل افتح الملف ثم اسمح بـ«تثبيت من هذا المصدر».
            </p>
            <a className="btn-primary inline-flex" href={APK_URL} target="_blank" rel="noreferrer">
              <Icon.Download size={18} /> تنزيل تطبيق الأندرويد (APK)
            </a>
            <a className="btn-sand inline-flex mt-2" href={ZIP_URL} target="_blank" rel="noreferrer">
              <Icon.Download size={18} /> تنزيل نسخة مضغوطة (ZIP) — أسرع
            </a>
            <div className="flex gap-2 flex-wrap mt-2">
              <a className="btn-outline inline-flex" href={APK_URL_PAGES} target="_blank" rel="noreferrer">
                <Icon.Library size={18} /> رابط بديل (APK)
              </a>
              <a className="btn-outline inline-flex" href={ZIP_URL_PAGES} target="_blank" rel="noreferrer">
                <Icon.Library size={18} /> رابط بديل (ZIP)
              </a>
              <a className="btn-outline inline-flex" href={REPO_URL} target="_blank" rel="noreferrer">
                <Icon.Library size={18} /> مستودع GitHub
              </a>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-2">الإصدار {APP_VERSION} — أندرويد 5.1 فأحدث — حجم APK ~1.5 م.ب / الملف المضغوط ~1.2 م.ب</p>
          </Card>
          )}

          {!isNative && (
          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Send size={18} /> أرسل التطبيق إلى تلفون آخر</div>
            <p className="text-sm text-slate-500 font-bold leading-relaxed mb-3">
              صوّر رمز الاستجابة السريعة (QR) بكاميرا الجوال الآخر ليفتح رابط تنزيل التطبيق مباشرة، أو شارك الرابط.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img src="./qr-android.png" alt="QR تنزيل تطبيق الأندرويد" width={160} height={160} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white p-2" />
              <div className="flex-1 w-full">
                <input readOnly value={APK_URL} className="input w-full text-xs" onFocus={(e) => e.target.select()} />
                <div className="flex gap-2 flex-wrap mt-2">
                  <button className="btn-outline inline-flex" onClick={() => { navigator.clipboard?.writeText(APK_URL); toast('تم نسخ رابط التطبيق'); }}><Icon.Library size={18} /> نسخ الرابط</button>
                  {navigator.share && (
                    <button className="btn-outline inline-flex" onClick={() => navigator.share({ title: 'منصة المعلم الذكية', text: 'حمّل تطبيق منصة المعلم الذكية (يعمل بدون إنترنت)', url: APK_URL }).catch(() => {})}><Icon.Send size={18} /> مشاركة</button>
                  )}
                </div>
              </div>
            </div>
          </Card>
          )}

          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Speaker size={18} /> صوت الشرح (TTS) — جودة عالية</div>
            <p className="text-sm text-slate-500 font-bold leading-relaxed mb-3">
              اختر محرّك الصوت للدروس الصوتية. <b>تلقائي</b> يستخدم صوتاً سحابياً طبيعياً (صوت يمني) عند توفّر الإنترنت، ويعود للمحرّك المدمج بالجهاز عند انقطاعه.
              المفتاح يُحفظ على جهازك فقط.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-extrabold text-slate-500">مزوّد الصوت</span>
                <select className="input mt-1" value={voiceCfg.provider} onChange={(e) => setVC('provider', e.target.value)}>
                  {Object.entries(PROVIDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-extrabold text-slate-500">منطقة Azure</span>
                <input className="input mt-1" dir="ltr" value={voiceCfg.azureRegion} onChange={(e) => setVC('azureRegion', e.target.value)} placeholder="westeurope" />
              </label>
              <label className="block">
                <span className="text-xs font-extrabold text-slate-500">مفتاح Azure Speech</span>
                <input className="input mt-1" dir="ltr" type="password" value={voiceCfg.azureKey} onChange={(e) => setVC('azureKey', e.target.value)} placeholder="المفتاح السري" />
              </label>
              <label className="block">
                <span className="text-xs font-extrabold text-slate-500">مفتاح Google Cloud TTS</span>
                <input className="input mt-1" dir="ltr" type="password" value={voiceCfg.googleKey} onChange={(e) => setVC('googleKey', e.target.value)} placeholder="المفتاح السري" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-extrabold text-slate-500">وسيط مخصّص (اختياري — بديل آمن عن المفتاح في المتصفح)</span>
                <input className="input mt-1" dir="ltr" value={voiceCfg.proxyUrl} onChange={(e) => setVC('proxyUrl', e.target.value)} placeholder="https://your-proxy.example/tts" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button className="btn-primary" onClick={saveVoice}><Icon.Check size={18} /> حفظ إعدادات الصوت</button>
              <button className="btn-outline" onClick={runVoiceTest} disabled={testing}><Icon.Play size={16} /> {testing ? 'جارٍ الاختبار...' : 'اختبار الصوت'}</button>
              <span className="chip bg-slate-100 text-slate-600 self-center">
                المزوّد النشط الآن: {PROVIDER_LABELS[resolveProvider(voiceCfg, typeof navigator === 'undefined' ? true : navigator.onLine)]}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">
              ملاحظة أمنية: وضع المفتاح في المتصفح مناسب للاستخدام الشخصي على جهاز المعلم. للاستخدام العام واسع النطاق، الأفضل استخدام «وسيط مخصّص» يحفظ المفتاح على الخادم.
            </p>
          </Card>

          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Info size={18} /> حول المنصة</div>
            <div className="rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 text-white p-4">
              <div className="flex items-center gap-3">
                <Icon.School size={30} />
                <div>
                  <div className="font-extrabold">منصة المعلم الذكية</div>
                  <div className="text-xs opacity-90">الإصدار {APP_VERSION} — للمعلم اليمني</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm opacity-95">
                <li className="flex gap-2"><Icon.Check size={16} /> هيكل المنهج اليمني (أساسي + ثانوي)</li>
                <li className="flex gap-2"><Icon.Check size={16} /> تحضير ذكي وعروض تقديمية</li>
                <li className="flex gap-2"><Icon.Check size={16} /> تصحيح وتحليل آلي</li>
                <li className="flex gap-2"><Icon.Check size={16} /> سجلات الدرجات والحضور والشهادات</li>
                <li className="flex gap-2"><Icon.Check size={16} /> يعمل دون اتصال — البيانات محلية</li>
              </ul>
            </div>
            {isOwner && (
              <div className="mt-3 rounded-2xl bg-sand-50 p-4 flex items-start gap-3">
                <Icon.Crown size={20} className="text-sand-600 shrink-0 mt-0.5" />
                <p className="text-sm text-sand-800 font-bold leading-relaxed">
                  مالك المنصة: <b dir="ltr">{owner?.username || 'safwt'}</b>
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Confirm open={confirmWipe} onClose={() => setConfirmWipe(false)} onConfirm={wipe}
        title="حذف كل البيانات" message="سيتم حذف جميع الصفوف والطلاب والتحضيرات والعروض والسجلات نهائياً. لا يمكن التراجع. متابعة؟" />
      {toast.view}
    </div>
  );
}
