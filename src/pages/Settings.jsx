import { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, useToast, Confirm, Modal } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth, APP_VERSION } from '../state/auth.jsx';
import { SUBJECTS } from '../data/curriculum.js';
import { download } from '../lib/utils.js';

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
  const fileRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
