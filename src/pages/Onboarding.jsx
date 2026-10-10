import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Field } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { SUBJECTS } from '../data/curriculum.js';

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
    <div className="min-h-screen grid place-items-center p-4" dir="rtl">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <span className="inline-grid place-items-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card mb-4">
            <Icon.School size={44} />
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800">منصة المعلم الذكية</h1>
          <p className="text-slate-500 mt-2 font-bold">
            منصة رقمية متكاملة للمعلم اليمني — التحضير، العروض، التصحيح، والسجلات
          </p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
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
  );
}
