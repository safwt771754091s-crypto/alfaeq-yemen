import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, StatCard, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useOwner } from '../state/owner.jsx';
import { SUBJECTS } from '../data/curriculum.js';
import { formatDate } from '../lib/utils.js';

function PinInput({ value, onChange, autoFocus }) {
  return (
    <input
      className="input text-center tracking-[0.6em] text-2xl font-extrabold"
      inputMode="numeric"
      type="password"
      maxLength={6}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="••••"
    />
  );
}

function SetupOwner() {
  const { configureOwner } = useOwner();
  const { profile } = useApp();
  const toast = useToast();
  const [form, setForm] = useState({
    name: profile.name || '',
    email: '',
    phone: '',
    role: 'مالك المنصة'
  });
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.push('أدخل اسم المالك', 'error'); return; }
    if (pin.length < 4) { toast.push('رمز الدخول 4 أرقام على الأقل', 'error'); return; }
    if (pin !== pin2) { toast.push('الرمزان غير متطابقين', 'error'); return; }
    configureOwner(form, pin);
    toast.push('تم إنشاء حساب المالك');
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="p-6">
        <div className="text-center mb-5">
          <span className="inline-grid place-items-center w-16 h-16 rounded-3xl bg-gradient-to-br from-sand-500 to-sand-600 text-white shadow-card mb-3">
            <Icon.Crown size={34} />
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800">إنشاء حساب المالك</h2>
          <p className="text-slate-500 text-sm font-bold mt-1">
            حساب المالك هو الحساب الرئيسي للمنصة على هذا الجهاز — يحمي الإعدادات والبيانات.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="اسم المالك" required>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="الاسم الكامل" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="البريد الإلكتروني">
              <input className="input" dir="ltr" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />
            </Field>
            <Field label="رقم الهاتف">
              <input className="input" dir="ltr" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+967..." />
            </Field>
          </div>
          <Field label="الصفة">
            <input className="input" value={form.role} onChange={(e) => set('role', e.target.value)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="رمز الدخول (4–6 أرقام)" required>
              <PinInput value={pin} onChange={setPin} />
            </Field>
            <Field label="تأكيد الرمز" required>
              <PinInput value={pin2} onChange={setPin2} />
            </Field>
          </div>
          <div className="rounded-2xl bg-sand-50 p-4 flex items-start gap-3">
            <Icon.Info size={20} className="text-sand-600 shrink-0 mt-0.5" />
            <p className="text-sm text-sand-800 font-bold leading-relaxed">
              الرمز يُخزَّن مُلبَّداً على جهازك فقط ولا يُرسل لأي مكان. يُطلب عند فتح لوحة المالك لحماية بياناتك.
            </p>
          </div>
          <button type="submit" className="btn-sand w-full !py-3 text-base">
            <Icon.CheckCircle size={20} /> إنشاء حساب المالك
          </button>
        </form>
      </Card>
    </div>
  );
}

function OwnerLogin() {
  const { owner, login } = useOwner();
  const toast = useToast();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (login(pin)) { toast.push('مرحباً بك'); return; }
    setErr(true);
    setPin('');
    toast.push('رمز الدخول غير صحيح', 'error');
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6 text-center">
        <span className="inline-grid place-items-center w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card mb-3">
          <Icon.Lock size={32} />
        </span>
        <h2 className="text-2xl font-extrabold text-slate-800">لوحة المالك محمية</h2>
        <p className="text-slate-500 text-sm font-bold mt-1 mb-5">
          أدخل رمز الدخول للوصول إلى حساب المالك{owner.name ? ` — ${owner.name}` : ''}.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <PinInput value={pin} onChange={(v) => { setPin(v); setErr(false); }} autoFocus />
          {err && <div className="text-sm font-bold text-rose-600">الرمز غير صحيح، حاول مرة أخرى.</div>}
          <button type="submit" className="btn-primary w-full !py-3">
            <Icon.Key size={20} /> دخول
          </button>
        </form>
      </Card>
    </div>
  );
}

function OwnerDashboard() {
  const { owner, logout, updateOwner, changePin, resetOwner } = useOwner();
  const { classes, students, lessons, notebooks, presentations, quizzes, assessments, attendance, certificates, profile } = useApp();
  const toast = useToast();
  const [info, setInfo] = useState({ name: owner.name, email: owner.email, phone: owner.phone, role: owner.role });
  const [pins, setPins] = useState({ oldPin: '', newPin: '', newPin2: '' });
  const [confirmReset, setConfirmReset] = useState(false);

  const saveInfo = () => { updateOwner(info); toast.push('تم حفظ بيانات المالك'); };

  const doChangePin = (e) => {
    e.preventDefault();
    if (pins.newPin.length < 4) { toast.push('الرمز الجديد 4 أرقام على الأقل', 'error'); return; }
    if (pins.newPin !== pins.newPin2) { toast.push('الرمزان غير متطابقين', 'error'); return; }
    if (!changePin(pins.oldPin, pins.newPin)) { toast.push('الرمز الحالي غير صحيح', 'error'); return; }
    setPins({ oldPin: '', newPin: '', newPin2: '' });
    toast.push('تم تغيير رمز الدخول');
  };

  const attendanceDays = Object.keys(attendance || {}).length;
  const stats = [
    { icon: Icon.Users, label: 'الصفوف', value: classes.length, tone: 'brand' },
    { icon: Icon.Users, label: 'الطلاب', value: students.length, tone: 'sky' },
    { icon: Icon.Sparkles, label: 'التحضيرات', value: lessons.length, tone: 'violet' },
    { icon: Icon.Clipboard, label: 'كراسات التحضير', value: notebooks.length, tone: 'sand' },
    { icon: Icon.Slides, label: 'العروض', value: presentations.length, tone: 'indigo' },
    { icon: Icon.CheckCircle, label: 'الاختبارات', value: quizzes.length, tone: 'teal' },
    { icon: Icon.Chart, label: 'التقييمات', value: assessments.length, tone: 'amber' },
    { icon: Icon.Calendar, label: 'أيام الحضور', value: attendanceDays, tone: 'lime' },
    { icon: Icon.Award, label: 'الشهادات', value: certificates.length, tone: 'rose' }
  ];

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-3xl bg-gradient-to-br from-sand-500 to-sand-600 text-white shadow-card">
            <Icon.Crown size={32} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-slate-800">{owner.name || 'مالك المنصة'}</h2>
              <span className="chip bg-sand-50 text-sand-700"><Icon.Shield size={14} /> {owner.role}</span>
            </div>
            <div className="text-sm text-slate-500 font-bold mt-1">
              {owner.email || '—'} {owner.phone ? `• ${owner.phone}` : ''}
            </div>
            <div className="text-xs text-slate-400 font-bold mt-0.5">
              أُنشئ الحساب في {owner.createdAt ? formatDate(owner.createdAt.slice(0, 10)) : '—'}
            </div>
          </div>
          <button className="btn-outline mr-auto" onClick={logout}><Icon.LogOut size={18} /> خروج</button>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="section-title mb-4"><Icon.Edit size={18} /> بيانات المالك</div>
          <div className="space-y-4">
            <Field label="الاسم"><input className="input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="البريد"><input className="input" dir="ltr" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} /></Field>
              <Field label="الهاتف"><input className="input" dir="ltr" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></Field>
            </div>
            <Field label="الصفة"><input className="input" value={info.role} onChange={(e) => setInfo({ ...info, role: e.target.value })} /></Field>
            <button className="btn-primary" onClick={saveInfo}><Icon.Check size={18} /> حفظ البيانات</button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="section-title mb-4"><Icon.Key size={18} /> تغيير رمز الدخول</div>
            <form onSubmit={doChangePin} className="space-y-4">
              <Field label="الرمز الحالي" required><PinInput value={pins.oldPin} onChange={(v) => setPins({ ...pins, oldPin: v })} /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="الرمز الجديد" required><PinInput value={pins.newPin} onChange={(v) => setPins({ ...pins, newPin: v })} /></Field>
                <Field label="تأكيد الجديد" required><PinInput value={pins.newPin2} onChange={(v) => setPins({ ...pins, newPin2: v })} /></Field>
              </div>
              <button type="submit" className="btn-primary"><Icon.Key size={18} /> تحديث الرمز</button>
            </form>
          </Card>

          <Card className="p-5 border-rose-200">
            <div className="section-title mb-2 text-rose-600"><Icon.Trash size={18} /> إعادة تعيين حساب المالك</div>
            <p className="text-sm text-slate-500 font-bold mb-3">
              يحذف حساب المالك ورمزه (لا يحذف بيانات المنصة). سيُطلب إنشاء الحساب من جديد.
            </p>
            {confirmReset ? (
              <div className="flex gap-2">
                <button className="btn-danger" onClick={() => { resetOwner(); toast.push('تمت إعادة تعيين حساب المالك'); }}>تأكيد الإعادة</button>
                <button className="btn-ghost" onClick={() => setConfirmReset(false)}>إلغاء</button>
              </div>
            ) : (
              <button className="btn-danger" onClick={() => setConfirmReset(true)}><Icon.Refresh size={18} /> إعادة التعيين</button>
            )}
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Info size={18} /> بيانات الملف الشخصي للمعلم</div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500 font-bold">المعلم: </span><span className="font-extrabold text-slate-700">{profile.name || '—'}</span></div>
          <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500 font-bold">المدرسة: </span><span className="font-extrabold text-slate-700">{profile.school || '—'}</span></div>
          <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500 font-bold">التخصص: </span><span className="font-extrabold text-slate-700">{SUBJECTS[profile.mainSubject]?.name || '—'}</span></div>
        </div>
      </Card>
    </div>
  );
}

export default function Owner() {
  const { owner, unlocked } = useOwner();

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Crown}
        title="حساب المالك"
        subtitle="الحساب الرئيسي للمنصة — إدارة بيانات المالك وحماية الوصول برمز دخول"
      />
      {!owner.configured ? <SetupOwner /> : !unlocked ? <OwnerLogin /> : <OwnerDashboard />}
    </div>
  );
}
