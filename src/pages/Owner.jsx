import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, StatCard, useToast } from '../components/UI.jsx';
import PermissionsEditor from '../components/PermissionsEditor.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth, ALL_PERMISSIONS } from '../state/auth.jsx';

function OwnerCard({ owner }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="grid place-items-center w-16 h-16 rounded-3xl bg-gradient-to-br from-sand-500 to-sand-600 text-white shadow-card shrink-0">
          <Icon.Crown size={32} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800" dir="ltr">@{owner.username}</h2>
            <span className="chip bg-sand-50 text-sand-700"><Icon.Shield size={14} /> {owner.roleLabel}</span>
            <span className="chip bg-slate-100 text-slate-500">حساب ثابت</span>
          </div>
          <div className="text-sm text-slate-500 font-bold mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {owner.email && <a href={`mailto:${owner.email}`} dir="ltr" className="hover:text-brand-700">📧 {owner.email}</a>}
            {owner.phone && <a href={`https://wa.me/967783488282`} target="_blank" rel="noreferrer" dir="ltr" className="hover:text-brand-700">📱 {owner.phone}</a>}
            {owner.school && <span>🏫 {owner.school}</span>}
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

export default function Owner({ go }) {
  const { owner, isOwner, users, currentUser, updateUser, changeOwnPin } = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState({ name: owner?.name || '', email: owner?.email || '', phone: owner?.phone || '', school: owner?.school || '' });
  const [pins, setPins] = useState({ cur: '', nw: '', nw2: '' });
  const [perms, setPerms] = useState(owner?.permissions || []);

  // حماية: لا تُعرض بيانات المالك لغير المالك (دفاع في العمق حتى لو اختُرق التوجيه)
  if (!isOwner) return null;

  const management = [
    { id: 'controlcenter', name: 'مركز التحكم', icon: Icon.Grid, desc: 'إضافة/تعديل/دمج/حذف كل المحتوى', tone: 'from-brand-500 to-brand-700' },
    { id: 'users', name: 'المستخدمون والصلاحيات', icon: Icon.Shield, desc: 'إدارة الحسابات والأدوار', tone: 'from-sky-500 to-sky-700' },
    { id: 'sessions', name: 'الجلسات والنشاط', icon: Icon.Eye, desc: 'من سجّل ومن نشط وعلى أي صفحة', tone: 'from-violet-500 to-violet-700' },
    { id: 'broadcast', name: 'الإرسال الجماعي', icon: Icon.Megaphone, desc: 'رسائل للمعلمين والطلاب', tone: 'from-amber-500 to-amber-600' }
  ];

  const savePerms = (next) => {
    setPerms(next);
    updateUser('owner', { permissions: next });
  };

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

      {go && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {management.map((m) => (
            <button key={m.id} onClick={() => go(m.id)} className={`text-right rounded-3xl p-5 text-white bg-gradient-to-br ${m.tone} shadow-soft hover:scale-[1.02] transition`}>
              <m.icon size={26} />
              <div className="font-extrabold mt-2">{m.name}</div>
              <div className="text-white/90 text-xs font-bold mt-0.5 leading-relaxed">{m.desc}</div>
            </button>
          ))}
        </div>
      )}

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

      {isOwner && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="section-title"><Icon.Shield size={18} /> صلاحيات المالك</div>
            <div className="flex items-center gap-2">
              <span className="chip bg-brand-50 text-brand-700">{perms.length} / {ALL_PERMISSIONS.length} صلاحية</span>
              <button className="btn-outline !px-3 !py-2 text-xs" onClick={() => savePerms(ALL_PERMISSIONS.slice())}>
                <Icon.Check size={15} /> تفعيل الكل
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-bold mb-4 leading-relaxed">
            خصّص الصفحات التي تظهر في قائمتك. تبقى صفحات «لوحة التحكم»، «حساب المالك»، و«المستخدمون والصلاحيات» متاحة دائماً.
          </p>
          <PermissionsEditor value={perms} onChange={savePerms} />
        </Card>
      )}

      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Info size={18} /> المستخدمون على هذا الجهاز</div>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <span key={u.id} className={`chip ${u.role === 'owner' ? 'bg-sand-50 text-sand-700' : 'bg-brand-50 text-brand-700'}`}>
              {u.role === 'owner' && <Icon.Crown size={13} />} {u.role === 'owner' ? `@${u.username}` : u.name}
            </span>
          ))}
        </div>
      </Card>
      {toast.view}
    </div>
  );
}
