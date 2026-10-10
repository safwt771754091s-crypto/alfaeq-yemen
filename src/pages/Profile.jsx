import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, StatCard, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';
import { SUBJECTS, gradeName } from '../data/curriculum.js';

export default function Profile() {
  const { profile, saveProfile, classes, students, lessons, presentations, assessments, certificates } = useApp();
  const { currentUser, isOwner } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(profile);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => { saveProfile({ ...profile, ...form }); toast.push('تم حفظ الملف الشخصي'); };

  return (
    <div className="space-y-6">
      {/* بطاقة الهوية */}
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient text-white p-6 sm:p-8 shadow-lg">
        <span className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <span className="grid place-items-center w-20 h-20 rounded-3xl bg-white/15 backdrop-blur text-white ring-1 ring-white/25 shrink-0">
            <Icon.Users size={40} />
          </span>
          <div className="grow">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="chip bg-white/15 text-white/95">{isOwner ? '👑 مالك المنصة' : '👨‍🏫 معلم'}</span>
              {currentUser?.username && <span className="chip bg-white/10 text-white/80">@{currentUser.username}</span>}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">{form.name || currentUser?.name || 'معلم بدون اسم'}</h2>
            <p className="text-white/85 font-bold mt-1">
              {[form.school, form.directorate, form.governorate].filter(Boolean).join(' — ') || 'أكمل بياناتك أدناه لتظهر هنا'}
            </p>
          </div>
        </div>
      </div>

      {/* إحصاءاتي */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Icon.Users} label="طلابي" value={students.length} tone="brand" sub={`${classes.length} صف`} />
        <StatCard icon={Icon.Sparkles} label="خطط دروسي" value={lessons.length} tone="sand" />
        <StatCard icon={Icon.Slides} label="عروضي" value={presentations.length} tone="sky" />
        <StatCard icon={Icon.Award} label="شهاداتي" value={certificates.length} tone="violet" sub={`${assessments.length} تقييم`} />
      </div>

      {/* النموذج */}
      <Card className="p-5 sm:p-6">
        <SectionHeader icon={Icon.Edit} title="بياناتي" subtitle="تظهر هذه البيانات في التقارير والشهادات المطبوعة" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم الكامل"><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="المدرسة"><input className="input" value={form.school || ''} onChange={(e) => set('school', e.target.value)} /></Field>
          <Field label="المديرية"><input className="input" value={form.directorate || ''} onChange={(e) => set('directorate', e.target.value)} /></Field>
          <Field label="المحافظة"><input className="input" value={form.governorate || ''} onChange={(e) => set('governorate', e.target.value)} /></Field>
          <Field label="التخصص الرئيسي">
            <select className="input" value={form.mainSubject || 'arabic'} onChange={(e) => set('mainSubject', e.target.value)}>
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="المؤهل العلمي" hint="اختياري"><input className="input" value={form.degree || ''} onChange={(e) => set('degree', e.target.value)} placeholder="بكالوريوس / ماجستير..." /></Field>
          <Field label="الجوال"><input className="input" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="07xxxxxxxx" /></Field>
          <Field label="سنوات الخبرة"><input type="number" min={0} className="input" value={form.experience || ''} onChange={(e) => set('experience', e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary" onClick={save}><Icon.Check size={18} /> حفظ البيانات</button>
        </div>
      </Card>

      {/* صفوفي */}
      {classes.length > 0 && (
        <Card className="p-5">
          <SectionHeader icon={Icon.Users} title="صفوفي" subtitle="الصفوف والمواد التي أدرّسها" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="font-extrabold text-slate-800 dark:text-white">{c.name}</div>
                <div className="text-xs text-slate-400 font-bold mt-0.5">{gradeName(c.grade)} • {students.filter((s) => s.classId === c.id).length} طالب</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
