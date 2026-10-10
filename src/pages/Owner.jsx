import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, StatCard, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';

function OwnerCard({ owner }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="grid place-items-center w-16 h-16 rounded-3xl bg-gradient-to-br from-sand-500 to-sand-600 text-white shadow-card shrink-0">
          <Icon.Crown size={32} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{owner.name}</h2>
            <span className="chip bg-sand-50 text-sand-700"><Icon.Shield size={14} /> {owner.roleLabel}</span>
            <span className="chip bg-slate-100 text-slate-500">حساب ثابت</span>
          </div>
          <div className="text-sm text-slate-500 font-bold mt-1">
            اسم المستخدم: <span dir="ltr">{owner.username}</span>
            {owner.email ? ` • ${owner.email}` : ''}{owner.phone ? ` • ${owner.phone}` : ''}
          </div>
          <div className="text-xs text-slate-400 font-bold mt-0.5">
            مالك منصة المعلم الذكية — هذا الحساب موجود دائماً ولا يمكن حذفه
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlatformStats() {
  const { classes, students, lessons, notebooks, presentations, quizzes, assessments, attendance, certificates } = useApp();
  const attendanceDays = Object.keys(attendance || {}).length;
  const stats = [
    { icon: Icon.Users, label: 'الصفوف', value: classes.length, tone: 'brand' },
    { icon: Icon.Users, label: 'الطلاب', value: students.length, tone: 'sky' },
    { icon: Icon.Sparkles, label: 'التحضيرات', value: lessons.length, tone: 'violet' },
    { icon: Icon.Clipboard, label: 'كراسات', value: notebooks.length, tone: 'sand' },
    { icon: Icon.Slides, label: 'العروض', value: presentations.length, tone: 'indigo' },
    { icon: Icon.CheckCircle, label: 'الاختبارات', value: quizzes.length, tone: 'teal' },
    { icon: Icon.Chart, label: 'التقييمات', value: assessments.length, tone: 'amber' },
    { icon: Icon.Calendar, label: 'أيام الحضور', value: attendanceDays, tone: 'lime' },
    { icon: Icon.Award, label: 'الشهادات', value: certificates.length, tone: 'rose' }
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />)}
    </div>
  );
}

export default function Owner() {
  const { owner, isOwner, users, currentUser, updateUser, changeOwnPin } = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState({ name: owner?.name || '', email: owner?.email || '', phone: owner?.phone || '', school: owner?.school || '' });
  const [pins, setPins] = useState({ cur: '', nw: '', nw2: '' });

  const saveInfo = () => {
    updateUser('owner', info);
    toast.push('تم حفظ بيانات المالك');
  };

  const doChangePin = (e) => {
    e.preventDefault();
    if (pins.nw.length < 4) { toast.push('الرمز الجديد 4 خانات على الأقل', 'error'); return; }
    if (pins.nw !== pins.nw2) { toast.push('الرمزان غير متطابقين', 'error'); return; }
    if (!changeOwnPin(pins.cur, pins.nw)) { toast.push('الرمز الحالي غير صحيح', 'error'); return; }
    setPins({ cur: '', nw: '', nw2: '' });
    toast.push('تم تغيير رمز الدخول');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Crown}
        title="حساب المالك"
        subtitle="الحساب الرئيسي الثابت للمنصة"
      />

      <OwnerCard owner={owner} />

      <PlatformStats />

      {isOwner ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Edit size={18} /> بيانات المالك</div>
            <div className="space-y-4">
              <Field label="الاسم"><input className="input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="البريد"><input className="input" dir="ltr" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} /></Field>
                <Field label="الهاتف"><input className="input" dir="ltr" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></Field>
              </div>
              <Field label="المدرسة / الجهة"><input className="input" value={info.school} onChange={(e) => setInfo({ ...info, school: e.target.value })} /></Field>
              <button className="btn-primary" onClick={saveInfo}><Icon.Check size={18} /> حفظ البيانات</button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Key size={18} /> تغيير رمز دخول المالك</div>
            <form onSubmit={doChangePin} className="space-y-4">
              <Field label="الرمز الحالي" required><input className="input" type="password" value={pins.cur} onChange={(e) => setPins({ ...pins, cur: e.target.value })} /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="الرمز الجديد" required><input className="input" type="password" value={pins.nw} onChange={(e) => setPins({ ...pins, nw: e.target.value })} /></Field>
                <Field label="تأكيد الجديد" required><input className="input" type="password" value={pins.nw2} onChange={(e) => setPins({ ...pins, nw2: e.target.value })} /></Field>
              </div>
              <button type="submit" className="btn-primary"><Icon.Key size={18} /> تحديث الرمز</button>
            </form>
            <div className="rounded-2xl bg-sand-50 p-4 mt-4 flex items-start gap-3">
              <Icon.Info size={20} className="text-sand-600 shrink-0 mt-0.5" />
              <p className="text-sm text-sand-800 font-bold leading-relaxed">
                رمز المالك الافتراضي هو <b dir="ltr">safwt</b> — يُنصح بتغييره. يُخزَّن مُلبَّداً على جهازك فقط.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <Icon.Lock size={20} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-500 font-bold leading-relaxed">
              بيانات المالك وإدارة المنصة متاحة لصاحب حساب المالك فقط. أنت مسجّل حالياً كـ«{currentUser?.name || 'معلم'}».
            </p>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Info size={18} /> المستخدمون على هذا الجهاز</div>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <span key={u.id} className={`chip ${u.role === 'owner' ? 'bg-sand-50 text-sand-700' : 'bg-brand-50 text-brand-700'}`}>
              {u.role === 'owner' && <Icon.Crown size={13} />} {u.name}
            </span>
          ))}
        </div>
      </Card>
      {toast.view}
    </div>
  );
}
