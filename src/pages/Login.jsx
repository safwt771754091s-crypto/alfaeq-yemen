import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Field, useToast } from '../components/UI.jsx';
import { useAuth, OWNER } from '../state/auth.jsx';
import { createOtp, verifyOtp, sendOtp } from '../lib/verification.js';

function PinField({ value, onChange, autoFocus, placeholder = '••••' }) {
  return (
    <input
      className="input text-center tracking-[0.4em] text-xl font-extrabold"
      type="password"
      maxLength={16}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function RegisterForm({ onBack }) {
  const { registerTeacher, registerStudent, users } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState('teacher');
  const [f, setF] = useState({ name: '', username: '', school: '', subject: '', email: '', phone: '', pin: '', pin2: '' });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) { toast.push('أدخل الاسم', 'error'); return; }
    const uname = f.username.trim().toLowerCase();
    if (uname.length < 3) { toast.push('اسم المستخدم 3 أحرف على الأقل', 'error'); return; }
    if (users.some((u) => (u.username || '').toLowerCase() === uname)) { toast.push('اسم المستخدم محجوز', 'error'); return; }
    if (f.pin.length < 4) { toast.push('رمز الدخول 4 خانات على الأقل', 'error'); return; }
    if (f.pin !== f.pin2) { toast.push('الرمزان غير متطابقين', 'error'); return; }
    const payload = { name: f.name, username: f.username, school: f.school, subject: f.subject, email: f.email.trim(), phone: f.phone.trim() };
    if (role === 'student') registerStudent(payload, f.pin);
    else registerTeacher(payload, f.pin);
    toast.push(role === 'student' ? 'تم إنشاء حساب الطالب، مرحباً بك' : 'تم إنشاء حساب المعلم، مرحباً بك');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
        {['teacher', 'student'].map((r) => (
          <button key={r} type="button" onClick={() => setRole(r)}
            className={`rounded-xl py-2 text-sm font-extrabold transition ${role === r ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}>
            {r === 'teacher' ? <><Icon.Users size={16} className="inline" /> معلم</> : <><Icon.GraduationCap size={16} className="inline" /> طالب</>}
          </button>
        ))}
      </div>

      <Field label={role === 'student' ? 'اسم الطالب' : 'اسم المعلم'} required>
        <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="الاسم الكامل" />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="اسم المستخدم" hint="للدخول لاحقاً" required>
          <input className="input" dir="ltr" value={f.username} onChange={(e) => set('username', e.target.value)} placeholder="username" />
        </Field>
        {role === 'teacher' ? (
          <Field label="التخصص"><input className="input" value={f.subject} onChange={(e) => set('subject', e.target.value)} placeholder="مثال: رياضيات" /></Field>
        ) : (
          <Field label="الصف"><input className="input" value={f.school} onChange={(e) => set('school', e.target.value)} placeholder="مثال: الصف السادس" /></Field>
        )}
      </div>
      {role === 'teacher' && (
        <Field label="المدرسة"><input className="input" value={f.school} onChange={(e) => set('school', e.target.value)} placeholder="اسم المدرسة" /></Field>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="البريد الإلكتروني" hint="للدخول والتحقق"><input className="input" dir="ltr" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></Field>
        <Field label="رقم الجوال" hint="للدخول عبر واتساب"><input className="input" dir="ltr" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="7xxxxxxxx" /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="رمز الدخول" required><PinField value={f.pin} onChange={(v) => set('pin', v)} /></Field>
        <Field label="تأكيد الرمز" required><PinField value={f.pin2} onChange={(v) => set('pin2', v)} /></Field>
      </div>
      <button type="submit" className="btn-primary w-full !py-3"><Icon.UserCheck size={20} /> إنشاء حساب</button>
      <button type="button" className="btn-ghost w-full" onClick={onBack}>رجوع لتسجيل الدخول</button>
    </form>
  );
}

// نموذج الدخول عبر رمز التحقق (البريد/الجوال)
function OtpLogin({ onBack }) {
  const { findUserForLogin, loginWithOtp } = useAuth();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [req, setReq] = useState(null); // {user, channel, target}
  const [code, setCode] = useState('');
  const [shown, setShown] = useState('');

  const requestCode = () => {
    const res = findUserForLogin(identifier);
    if (!res.ok) { toast.push(res.error, 'error'); return; }
    const scope = `login:${res.user.id}`;
    const { code: c } = createOtp({ scope, channel: res.channel, target: res.target, purpose: 'تسجيل الدخول' });
    sendOtp({ channel: res.channel, target: res.target, code: c, purpose: 'تسجيل الدخول' });
    setShown(c);
    setReq({ ...res, scope });
    toast.push(res.channel === 'whatsapp' ? 'فُتح واتساب لإرسال الرمز' : 'فُتح البريد لإرسال الرمز');
  };

  const confirm = () => {
    const r = verifyOtp(req.scope, code);
    if (!r.ok) { toast.push(r.error, 'error'); return; }
    const res = loginWithOtp(req.user.id);
    if (!res.ok) { toast.push(res.error, 'error'); return; }
    toast.push(`مرحباً ${res.user.name}`);
  };

  return (
    <div className="space-y-4">
      {!req ? (
        <>
          <Field label="البريد الإلكتروني أو رقم الجوال" required>
            <input className="input" dir="ltr" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="name@example.com أو 7xxxxxxxx" />
          </Field>
          <button className="btn-primary w-full !py-3" onClick={requestCode}><Icon.Send size={20} /> إرسال رمز التحقق</button>
          <p className="text-xs text-slate-400 font-bold leading-relaxed text-center">
            سيصلك رمز مكوّن من 6 أرقام عبر واتساب (للجوال) أو البريد الإلكتروني.
          </p>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-brand-50 p-3 text-sm text-brand-800 font-bold leading-relaxed">
            أُرسل الرمز إلى <b dir="ltr">{req.target}</b> عبر {req.channel === 'whatsapp' ? 'واتساب' : 'البريد'}.
          </div>
          <div className="rounded-2xl bg-sand-50 p-3 text-center">
            <div className="text-xs text-sand-700 font-bold mb-1">رمز التحقق (للتسليم اليدوي):</div>
            <div className="text-2xl font-extrabold tracking-[0.3em] text-sand-800" dir="ltr">{shown}</div>
          </div>
          <Field label="أدخل رمز التحقق" required>
            <input className="input text-center tracking-[0.4em] text-xl font-extrabold" dir="ltr" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="••••••" />
          </Field>
          <button className="btn-primary w-full !py-3" onClick={confirm}><Icon.Check size={20} /> دخول</button>
          <div className="flex gap-2">
            <button className="btn-ghost grow" onClick={() => { setReq(null); setCode(''); }}>تغيير الحساب</button>
            <button className="btn-ghost" onClick={requestCode}><Icon.Refresh size={18} /> رمز جديد</button>
          </div>
        </>
      )}
      <button className="btn-ghost w-full" onClick={onBack}>رجوع</button>
      {toast.view}
    </div>
  );
}

export default function Login({ allowRegister = true, onHome }) {
  const { login } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ username: '', pin: '' });
  const [err, setErr] = useState('');
  const [mode, setMode] = useState('login'); // login | register | otp

  const submit = (e) => {
    e.preventDefault();
    const res = login(f.username, f.pin);
    if (!res.ok) { setErr(res.error); toast.push(res.error, 'error'); return; }
    toast.push(`مرحباً ${res.user.name}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10" dir="rtl">
      <div className="absolute inset-0 bg-hero-gradient" />
      <span className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      <span className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-300/20 blur-3xl" />

      {onHome && (
        <button onClick={onHome} className="absolute top-5 right-5 z-10 inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white px-4 py-2 text-sm font-extrabold ring-1 ring-white/25 transition">
          <Icon.ChevronRight size={16} /> الرئيسية
        </button>
      )}

      <div className="relative w-full max-w-md">
        <div className="text-center text-white mb-5">
          <span className="inline-grid place-items-center w-16 h-16 rounded-3xl bg-white/15 ring-1 ring-white/25 mb-3">
            <Icon.School size={34} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">منصة المعلم الذكية</h1>
          <p className="text-white/80 font-bold text-sm mt-1">منصة رقمية للمعلم اليمني — تعمل دون إنترنت</p>
        </div>

        <div className="card p-6 sm:p-7 shadow-xl">
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">تسجيل الدخول</h2>
              <p className="text-xs text-slate-400 font-bold mb-4">بالاسم/البريد/الجوال مع رمز الدخول</p>
              <form onSubmit={submit} className="space-y-4">
                <Field label="المعرّف" required>
                  <input className="input" value={f.username} onChange={(e) => { setF({ ...f, username: e.target.value }); setErr(''); }} placeholder="اسم المستخدم أو البريد أو الجوال" />
                </Field>
                <Field label="رمز الدخول" required>
                  <PinField value={f.pin} onChange={(v) => { setF({ ...f, pin: v }); setErr(''); }} />
                </Field>
                {err && <div className="text-sm font-bold text-rose-600">{err}</div>}
                <button type="submit" className="btn-primary w-full !py-3"><Icon.Key size={20} /> دخول</button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <span className="h-px bg-slate-200 grow" /><span className="text-xs text-slate-400 font-bold">أو</span><span className="h-px bg-slate-200 grow" />
              </div>
              <button className="btn-outline w-full" onClick={() => setMode('otp')}>
                <Icon.Phone size={18} /> الدخول برمز تحقق (واتساب / البريد)
              </button>

              {allowRegister && (
                <button className="btn-ghost w-full mt-3" onClick={() => setMode('register')}>
                  <Icon.Plus size={18} /> جديد؟ أنشئ حساب معلم أو طالب
                </button>
              )}
            </>
          )}

          {mode === 'otp' && (
            <>
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">الدخول برمز التحقق</h2>
              <p className="text-xs text-slate-400 font-bold mb-4">يُرسل الرمز إلى واتساب جوالك أو بريدك الإلكتروني</p>
              <OtpLogin onBack={() => setMode('login')} />
            </>
          )}

          {mode === 'register' && (
            <>
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">إنشاء حساب جديد</h2>
              <p className="text-xs text-slate-400 font-bold mb-4">حساب مستقل على هذا الجهاز، تُحفظ بياناته محلياً</p>
              <RegisterForm onBack={() => setMode('login')} />

              <div className="mt-4 rounded-2xl bg-sand-50 p-3.5 flex items-start gap-2.5">
                <Icon.Crown size={18} className="text-sand-600 shrink-0 mt-0.5" />
                <p className="text-xs text-sand-800 font-bold leading-relaxed">
                  حساب المالك (ثابت): اسم المستخدم <b dir="ltr">{OWNER.login}</b>، رمز الدخول الافتراضي <b dir="ltr">{OWNER.defaultPin}</b> (يُغيّر من حساب المالك).
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-white/70 text-[11px] font-bold mt-4">
          بياناتك محفوظة على جهازك فقط (LocalStorage) — لا تُرسل لأي خادم
        </p>
      </div>
    </div>
  );
}
