import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Field } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { SUBJECTS } from '../data/curriculum.js';

const FEATURES = [
  { icon: '📝', title: 'التحضير الذكي', desc: 'تحضير كامل بالأهداف والتمهيد والتقويم' },
  { icon: '🎞️', title: 'العروض التقديمية', desc: 'شرائح جاهزة للتصدير والطباعة' },
  { icon: '✅', title: 'التصحيح الذكي', desc: 'رصد وتحليل أخطاء الطلاب تلقائياً' },
  { icon: '📊', title: 'السجلات المدرسية', desc: 'درجات وحضور وشهادات بضغطة زر' }
];

export default function Onboarding({ onDone }) {
  const { saveProfile } = useApp();
  const [form, setForm] = useState({
    name: '',
    school: '',
    directorate: '',
    governorate: '',
    mainSubject: 'arabic'
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    saveProfile({ ...form, setupDone: true });
    onDone?.();
  };

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-hero-gradient" />
      <span className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" />
      <span className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-300/20 blur-3xl" />

      <div className="relative container max-w-6xl mx-auto px-4 py-10 sm:py-14 grid lg:grid-cols-2 gap-10 items-center">
        {/* المقدمة */}
        <div className="text-white">
          <span className="chip bg-white/15 text-white/95">🇾🇪 صُنع خصيصاً لمعلم اليمن</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mt-4">
            منصة <span className="text-brand-200">المعلم الذكية</span><br />
            كل أدواتك في مكان واحد
          </h1>
          <p className="text-white/85 font-bold mt-4 max-w-xl leading-relaxed">
            حضّر دروسك، ولّد عروضك التقديمية، صحّح اختباراتك، وسجّل الدرجات والحضور والشهادات —
            بواجهة عربية أنيقة تعمل على الجوال والحاسوب، ومتوافقة مع المنهج اليمني.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-2xl bg-white/10 backdrop-blur px-4 py-3 ring-1 ring-white/15">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <div className="font-extrabold text-white text-sm">{f.title}</div>
                  <div className="text-[11px] text-white/75 font-bold">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 text-xs font-bold text-white/85">
            <span className="inline-flex items-center gap-1.5">⚡ بدون تسجيل معقّد</span>
            <span className="inline-flex items-center gap-1.5">🔒 بياناتك في جهازك</span>
            <span className="inline-flex items-center gap-1.5">📱 يعمل على الجوال</span>
            <span className="inline-flex items-center gap-1.5">🌍 يعمل بلا إنترنت</span>
          </div>
        </div>

        {/* نموذج الإعداد */}
        <div className="w-full max-w-lg mx-auto">
          <form onSubmit={submit} className="card p-6 sm:p-7 space-y-4 shadow-lg">
            <div className="flex items-center gap-3 mb-1">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-gradient text-white shadow-soft shrink-0">
                <Icon.School size={26} />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">إعداد الحساب</h2>
                <p className="text-xs text-slate-400 font-bold">تُستخدم بياناتك في أغلفة الكراسات والشهادات</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="اسم المعلم" required>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="مثال: محمد عبدالله" required />
              </Field>
              <Field label="المدرسة">
                <input className="input" value={form.school} onChange={(e) => set('school', e.target.value)} placeholder="اسم المدرسة" />
              </Field>
              <Field label="المديرية">
                <input className="input" value={form.directorate} onChange={(e) => set('directorate', e.target.value)} placeholder="المديرية" />
              </Field>
              <Field label="المحافظة">
                <input className="input" value={form.governorate} onChange={(e) => set('governorate', e.target.value)} placeholder="المحافظة" />
              </Field>
            </div>
            <Field label="التخصص الرئيسي" hint="يُستخدم لتخصيص التحضير والعروض تلقائياً">
              <select className="input" value={form.mainSubject} onChange={(e) => set('mainSubject', e.target.value)}>
                {Object.values(SUBJECTS).map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </Field>

            <div className="rounded-2xl bg-brand-50 p-4 flex items-start gap-3">
              <Icon.Info size={20} className="text-brand-600 shrink-0 mt-0.5" />
              <p className="text-sm text-brand-800 font-bold leading-relaxed">
                كل البيانات تُخزَّن على جهازك فقط (LocalStorage) وتعمل بكفاءة حتى مع ضعف الإنترنت أو انقطاعه.
              </p>
            </div>

            <button type="submit" className="btn-primary w-full !py-3 text-base">
              <Icon.CheckCircle size={20} /> ابدأ استخدام المنصة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
